/**
 * TapStern — Cloudflare Worker
 * Bindings: DB (D1), PHOTOS (R2), ASSETS (static files from the repo)
 * Schema: siehe schema.sql
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      if (method === 'POST' && path === '/api/signup') return handleSignup(request, env, ctx);
      if (method === 'POST' && path === '/api/signin') return handleSignin(request, env);
      if (method === 'POST' && path === '/api/signout') return handleSignout(request, env);
      if (method === 'POST' && path === '/api/resend-verify') return handleResendVerify(request, env, ctx);
      if (method === 'POST' && path === '/api/forgot') return handleForgot(request, env, ctx);
      if (method === 'POST' && path === '/api/reset-password') return handleResetPassword(request, env);
      if (method === 'GET'  && path === '/api/me') return handleMe(request, env);
      if (method === 'POST' && path === '/api/cards') return handleCreateCard(request, env);
      if (method === 'POST' && path === '/api/delete-card') return handleDeleteCard(request, env);
      if (method === 'GET'  && path === '/verify') return handleVerifyLink(request, env);

      if (method === 'POST' && path === '/api/update') return handleUpdate(request, env);
      if (method === 'POST' && path === '/api/upload-photo') return handleUploadPhoto(request, env);
      if (method === 'POST' && path === '/api/track') return handleTrack(request, env);
      if (method === 'GET' && path === '/api/stats') return handleStats(request, env);
      if (method === 'GET' && path === '/api/card') return handleCard(request, env);

      const vcardMatch = path.match(/^\/vk\/([^/]+)\/vcard$/);
      if (method === 'GET' && vcardMatch) return handleVcard(request, env, ctx, vcardMatch[1]);

      const vkMatch = path.match(/^\/vk\/([^/]+)$/);
      if (method === 'GET' && vkMatch) return handleCardPage(request, env, ctx, vkMatch[1]);

      const photoMatch = path.match(/^\/photo\/([^/]+)$/);
      if (method === 'GET' && photoMatch) return handlePhoto(env, photoMatch[1]);

      // Alles andere: statische Dateien (index.html, visitenkarten.html, …)
      return env.ASSETS.fetch(request);
    } catch (err) {
      return json({ error: 'Serverfehler: ' + err.message }, 500);
    }
  }
};

const SESSION_DAYS = 30;
const VERIFY_HOURS = 24;
const RESET_MINUTES = 60;
const MAX_CARDS = 10;

/* ══════════════════════ Konten: E-Mail und Passwort ══════════════════════ */

/* POST /api/signup — Konto anlegen, Bestätigungsmail senden */
async function handleSignup(request, env, ctx) {
  const d = await readJson(request);
  if (!d) return json({ error: 'Ungültige Anfrage' }, 400);

  const email = normalizeEmail(d.email);
  const password = String(d.password || '');
  if (!validEmail(email)) return json({ error: 'Bitte eine gültige E-Mail-Adresse angeben' }, 400);
  const pwErr = passwordProblem(password);
  if (pwErr) return json({ error: pwErr }, 400);

  const existing = await env.DB.prepare('SELECT id, verified FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    return json({ error: 'Für diese Adresse gibt es schon ein Konto. Melde dich an oder setze das Passwort zurück.' }, 409);
  }

  const now = Date.now();
  const userId = crypto.randomUUID();
  const verifyToken = randomToken();

  await env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, verified, verify_token, verify_expires, created_at)
     VALUES (?,?,?,0,?,?,?)`
  ).bind(userId, email, await hashPassword(password), await sha256(verifyToken), now + VERIFY_HOURS * 3600000, now).run();

  const token = await newSession(env, userId);
  ctx.waitUntil(sendVerifyMail(env, request, email, verifyToken));

  return json({ user: { email, verified: false }, cards: [] }, 200, sessionCookie(token));
}

/* POST /api/signin */
async function handleSignin(request, env) {
  const d = await readJson(request);
  if (!d) return json({ error: 'Ungültige Anfrage' }, 400);

  const email = normalizeEmail(d.email);
  const gate = await checkLock(env, 'pw:' + email);
  if (gate) return json({ error: gate }, 429);

  const u = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  const ok = u && await verifyPassword(String(d.password || ''), u.password_hash);
  if (!ok) {
    await noteFail(env, 'pw:' + email);
    return json({ error: 'E-Mail oder Passwort ist falsch' }, 401);
  }
  await clearFails(env, 'pw:' + email);

  const token = await newSession(env, u.id);
  return json({ user: { email: u.email, verified: !!u.verified }, cards: await cardsOf(env, u.id) }, 200, sessionCookie(token));
}

/* POST /api/signout */
async function handleSignout(request, env) {
  const t = sessionToken(request);
  if (t) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(t)).run();
  return json({ success: true }, 200, 'ts_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
}

/* GET /api/me — Konto und Karten der laufenden Sitzung */
async function handleMe(request, env) {
  const u = await currentUser(env, request);
  if (u.error) return json({ error: u.error }, u.status);
  return json({ user: { email: u.email, verified: !!u.verified }, cards: await cardsOf(env, u.id) });
}

/* GET /verify?token=… — Klick aus der Bestätigungsmail */
async function handleVerifyLink(request, env) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const hash = await sha256(token);
  const u = await env.DB.prepare('SELECT * FROM users WHERE verify_token = ?').bind(hash).first();

  if (!u) return verifyPage(false, 'Dieser Link ist ungültig. Fordere im Konto eine neue Bestätigung an.');
  if (u.verified) return verifyPage(true, 'Diese Adresse war schon bestätigt.');
  if (u.verify_expires < Date.now()) return verifyPage(false, 'Der Link ist abgelaufen. Fordere im Konto eine neue Bestätigung an.');

  await env.DB.prepare('UPDATE users SET verified = 1, verify_token = NULL, verify_expires = NULL WHERE id = ?').bind(u.id).run();
  await env.DB.prepare('UPDATE businesscards SET published = 1 WHERE user_id = ?').bind(u.id).run();
  return verifyPage(true, 'E-Mail bestätigt. Deine Karten sind jetzt öffentlich erreichbar.');
}

/* POST /api/resend-verify */
async function handleResendVerify(request, env, ctx) {
  const u = await currentUser(env, request);
  if (u.error) return json({ error: u.error }, u.status);
  if (u.verified) return json({ error: 'Adresse ist bereits bestätigt' }, 400);

  const gate = await checkLock(env, 'verify:' + u.email);
  if (gate) return json({ error: gate }, 429);
  await noteFail(env, 'verify:' + u.email);

  const t = randomToken();
  await env.DB.prepare('UPDATE users SET verify_token = ?, verify_expires = ? WHERE id = ?')
    .bind(await sha256(t), Date.now() + VERIFY_HOURS * 3600000, u.id).run();
  ctx.waitUntil(sendVerifyMail(env, request, u.email, t));
  return json({ success: true });
}

/* POST /api/forgot — antwortet immer gleich, verrät keine Konten */
async function handleForgot(request, env, ctx) {
  const d = await readJson(request);
  const email = normalizeEmail(d && d.email);
  const u = email ? await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first() : null;

  if (u) {
    const t = randomToken();
    await env.DB.prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?')
      .bind(await sha256(t), Date.now() + RESET_MINUTES * 60000, u.id).run();
    ctx.waitUntil(sendResetMail(env, request, email, t));
  }
  return json({ success: true });
}

/* POST /api/reset-password */
async function handleResetPassword(request, env) {
  const d = await readJson(request);
  if (!d) return json({ error: 'Ungültige Anfrage' }, 400);

  const pwErr = passwordProblem(String(d.password || ''));
  if (pwErr) return json({ error: pwErr }, 400);

  const u = await env.DB.prepare('SELECT * FROM users WHERE reset_token = ?').bind(await sha256(String(d.token || ''))).first();
  if (!u || u.reset_expires < Date.now()) return json({ error: 'Der Link ist abgelaufen. Fordere einen neuen an.' }, 400);

  await env.DB.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?')
    .bind(await hashPassword(String(d.password)), u.id).run();
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(u.id).run();

  const token = await newSession(env, u.id);
  return json({ user: { email: u.email, verified: !!u.verified }, cards: await cardsOf(env, u.id) }, 200, sessionCookie(token));
}

/* POST /api/cards — weitere Karte anlegen */
async function handleCreateCard(request, env) {
  const u = await currentUser(env, request);
  if (u.error) return json({ error: u.error }, u.status);

  const d = await readJson(request) || {};
  const name = str(d.name);
  if (!name) return json({ error: 'Name fehlt' }, 400);

  const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM businesscards WHERE user_id = ?').bind(u.id).first();
  if (count.n >= MAX_CARDS) return json({ error: `Maximal ${MAX_CARDS} Karten pro Konto` }, 400);

  const slug = await freeSlug(env, d.slug ? slugify(d.slug) : slugify(name));
  const now = Date.now();

  await env.DB.prepare(
    `INSERT INTO businesscards
     (id, user_id, slug, published, name, job_title, company_name, accent_color, contacts, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(crypto.randomUUID(), u.id, slug, u.verified ? 1 : 0, name,
    str(d.jobTitle), str(d.companyName), COLORS[0], '[]', now, now).run();

  return json({ slug, cards: await cardsOf(env, u.id) });
}

/* POST /api/delete-card */
async function handleDeleteCard(request, env) {
  const u = await currentUser(env, request);
  if (u.error) return json({ error: u.error }, u.status);

  const d = await readJson(request) || {};
  const row = await ownedCard(env, u, d.slug);
  if (row.error) return json({ error: row.error }, row.status);

  if (row.photo_key) { try { await env.PHOTOS.delete(row.photo_key); } catch (e) {} }
  await env.DB.prepare('DELETE FROM businesscards WHERE id = ?').bind(row.id).run();
  await env.DB.prepare('DELETE FROM card_events WHERE slug = ?').bind(row.slug).run();
  return json({ cards: await cardsOf(env, u.id) });
}

const FIELDS = {
  name: 'name', birthday: 'birthday', jobTitle: 'job_title', companyName: 'company_name',
  bio: 'bio', accentColor: 'accent_color'
};
const COLORS = ['#968ae0', '#b5abfc', '#7972a9', '#4c5397'];

/* Kontaktdaten: beliebig viele Einträge je Art, jeder mit eigenem Label.
   Gespeichert als JSON-Array in businesscards.contacts. */
const LABELS = {
  phone: ['Mobil', 'Privat', 'Arbeit'],
  mail: ['Privat', 'Arbeit'],
  address: ['Arbeit', 'Privat', 'Filiale'],
  web: ['Website', 'Portfolio', 'Shop'],
  social: ['LinkedIn', 'Instagram', 'X', 'GitHub', 'TikTok', 'Xing', 'WhatsApp']
};
const SOCIAL_BASE = {
  LinkedIn: 'https://linkedin.com/in/', Instagram: 'https://instagram.com/',
  X: 'https://x.com/', GitHub: 'https://github.com/', TikTok: 'https://tiktok.com/@',
  Xing: 'https://xing.com/profile/', WhatsApp: 'https://wa.me/'
};
const MAX_CONTACTS = 30;

function normalizeContacts(input) {
  if (!Array.isArray(input)) return '[]';
  const out = [];
  for (const raw of input.slice(0, MAX_CONTACTS)) {
    if (!raw) continue;
    const kind = LABELS[raw.kind] ? raw.kind : null;
    const value = str(raw.value).slice(0, 300);
    if (!kind || !value) continue;
    const label = LABELS[kind].includes(str(raw.label)) ? str(raw.label) : LABELS[kind][0];
    out.push({ kind, label, value });
  }
  return JSON.stringify(out);
}

function parseContacts(row) {
  let list = [];
  try { list = JSON.parse(row.contacts || '[]'); } catch (e) { list = []; }
  if (Array.isArray(list) && list.length) return list;
  // Fallback für Karten aus der alten Struktur
  const legacy = [];
  if (row.phone1) legacy.push({ kind: 'phone', label: 'Mobil', value: row.phone1 });
  if (row.phone2) legacy.push({ kind: 'phone', label: 'Arbeit', value: row.phone2 });
  if (row.email1) legacy.push({ kind: 'mail', label: 'Arbeit', value: row.email1 });
  if (row.email2) legacy.push({ kind: 'mail', label: 'Privat', value: row.email2 });
  if (row.company_address) legacy.push({ kind: 'address', label: 'Arbeit', value: row.company_address });
  if (row.company_website) legacy.push({ kind: 'web', label: 'Website', value: row.company_website });
  if (row.linkedin) legacy.push({ kind: 'social', label: 'LinkedIn', value: row.linkedin });
  if (row.instagram) legacy.push({ kind: 'social', label: 'Instagram', value: row.instagram });
  return legacy;
}

function contactHref(c) {
  const v = str(c.value);
  if (c.kind === 'phone') return 'tel:' + v.replace(/[\s/]/g, '');
  if (c.kind === 'mail') return 'mailto:' + v;
  if (c.kind === 'web') return normalizeUrl(v);
  if (c.kind === 'address') return 'https://maps.google.com/?q=' + encodeURIComponent(v);
  return (SOCIAL_BASE[c.label] || 'https://') + v.replace(/^@/, '');
}

function contactDisplay(c) {
  const v = str(c.value);
  if (c.kind === 'social') return c.label === 'WhatsApp' ? v : '@' + v.replace(/^@/, '');
  if (c.kind === 'web') return v.replace(/^https?:\/\//i, '');
  return v;
}

function trackKind(kind) {
  return kind === 'phone' ? 'call' : kind === 'mail' ? 'mail' : kind === 'web' ? 'web' : '';
}

/* ───────────────────────────── /api/update ─────────────────────────── */
async function handleUpdate(request, env) {
  const data = await readJson(request);
  if (!data) return json({ error: 'Ungültige Anfrage' }, 400);

  const u = await currentUser(env, request);
  if (u.error) return json({ error: u.error }, u.status);
  const row = await ownedCard(env, u, data.slug);
  if (row.error) return json({ error: row.error }, row.status);

  const sets = [], vals = [];
  for (const [key, col] of Object.entries(FIELDS)) {
    if (!(key in data)) continue;
    let v = str(data[key]);
    if (col === 'accent_color') v = color(data[key]);
    if (col === 'name' && !v) continue;
    sets.push(`${col} = ?`); vals.push(v);
  }
  if ('employmentStatus' in data) { sets.push('employment_status = ?'); vals.push(employment(data.employmentStatus)); }
  if ('contacts' in data) { sets.push('contacts = ?'); vals.push(normalizeContacts(data.contacts)); }
  if (!sets.length) return json({ error: 'Keine Änderungen' }, 400);

  sets.push('updated_at = ?'); vals.push(Date.now());
  await env.DB.prepare(`UPDATE businesscards SET ${sets.join(', ')} WHERE slug = ?`)
    .bind(...vals, row.slug).run();

  return json({ success: true, card: publicCard(await card(env, row.slug)) });
}

/* ────────────────────────── /api/upload-photo ──────────────────────── */
async function handleUploadPhoto(request, env) {
  let form;
  try { form = await request.formData(); } catch (e) { return json({ error: 'Ungültige Anfrage' }, 400); }

  const u = await currentUser(env, request);
  if (u.error) return json({ error: u.error }, u.status);
  const row = await ownedCard(env, u, form.get('slug'));
  if (row.error) return json({ error: row.error }, row.status);

  const file = form.get('photo');
  if (!file) return json({ error: 'Fehlende Angaben' }, 400);
  if (!file.type || !file.type.startsWith('image/')) return json({ error: 'Bitte ein Bild hochladen' }, 400);
  if (file.size > 4 * 1024 * 1024) return json({ error: 'Bild darf maximal 4 MB groß sein' }, 400);

  const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const key = `${row.slug}-${Date.now()}.${ext}`;
  await env.PHOTOS.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  if (row.photo_key) { try { await env.PHOTOS.delete(row.photo_key); } catch (e) {} }

  await env.DB.prepare('UPDATE businesscards SET photo_key = ?, updated_at = ? WHERE slug = ?')
    .bind(key, Date.now(), row.slug).run();

  return json({ success: true, photoUrl: `/photo/${key}` });
}

/* ───────────────────────────── /api/track ─────────────────────────── */
// Aufruf vom Browser: navigator.sendBeacon('/api/track', JSON.stringify({slug, action:'call'}))
async function handleTrack(request, env) {
  const data = await readJson(request);
  if (!data || !data.slug) return json({ error: 'Ungültige Anfrage' }, 400);
  const action = ['view', 'save', 'call', 'mail', 'web'].includes(data.action) ? data.action : 'view';
  await logEvent(env, str(data.slug), action, source(request, str(data.source)), request);
  return json({ success: true });
}

/* ───────────────────────────── /api/card ──────────────────────────── */
// Karte der laufenden Sitzung laden (für den Auto-Login im Editor)
async function handleCard(request, env) {
  const u = await currentUser(env, request);
  if (u.error) return json({ error: u.error }, u.status);
  const row = await ownedCard(env, u, new URL(request.url).searchParams.get('slug'));
  if (row.error) return json({ error: row.error }, row.status);
  return json({ card: publicCard(row) });
}

/* ───────────────────────────── /api/stats ─────────────────────────── */
async function handleStats(request, env) {
  const url = new URL(request.url);
  const u = await currentUser(env, request);
  if (u.error) return json({ error: u.error }, u.status);
  const row = await ownedCard(env, u, url.searchParams.get('slug'));
  if (row.error) return json({ error: row.error }, row.status);

  const days = url.searchParams.get('days') === '90' ? 90 : 30;
  const since = Date.now() - days * DAY;

  const totals = await env.DB.prepare(
    `SELECT action, COUNT(*) AS n FROM card_events WHERE slug = ? AND created_at >= ? GROUP BY action`
  ).bind(row.slug, since).all();

  const weekly = await env.DB.prepare(
    `SELECT CAST((? - created_at) / 604800000 AS INTEGER) AS bucket,
            SUM(CASE WHEN action = 'view' THEN 1 ELSE 0 END) AS views,
            SUM(CASE WHEN action = 'save' THEN 1 ELSE 0 END) AS saves
     FROM card_events WHERE slug = ? AND created_at >= ?
     GROUP BY bucket ORDER BY bucket DESC`
  ).bind(Date.now(), row.slug, since).all();

  const recent = await env.DB.prepare(
    `SELECT created_at, action, source, device FROM card_events
     WHERE slug = ? ORDER BY created_at DESC LIMIT 20`
  ).bind(row.slug).all();

  const t = {};
  for (const r of totals.results || []) t[r.action] = r.n;

  return json({
    days,
    totals: {
      views: t.view || 0,
      saves: t.save || 0,
      contacts: (t.call || 0) + (t.mail || 0),
      saveRate: t.view ? Math.round(((t.save || 0) / t.view) * 100) : 0
    },
    weekly: (weekly.results || []).reverse(),
    recent: recent.results || []
  });
}

/* ─────────────────────────── GET /photo/:key ──────────────────────── */
async function handlePhoto(env, key) {
  const obj = await env.PHOTOS.get(key);
  if (!obj) return new Response('Nicht gefunden', { status: 404 });
  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}

/* ─────────────────────── GET /vk/:slug/vcard ──────────────────────── */
async function handleVcard(request, env, ctx, slug) {
  const row = await card(env, slug);
  if (!row) return new Response('Nicht gefunden', { status: 404 });
  if (!row.published) return new Response('Diese Karte ist noch nicht veröffentlicht.', { status: 403 });

  ctx.waitUntil(logEvent(env, slug, 'save', source(request), request));

  const nameParts = splitName(row.name);
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${vc(nameParts.family)};${vc(nameParts.given)};;;`, `FN:${vc(row.name)}`];
  if (row.company_name) lines.push(`ORG:${vc(row.company_name)}`);
  if (row.job_title) lines.push(`TITLE:${vc(row.job_title)}`);
  if (row.birthday) lines.push(`BDAY:${row.birthday.replace(/-/g, '')}`);
  for (const c of parseContacts(row)) {
    const v = str(c.value);
    if (!v) continue;
    const work = c.label === 'Arbeit';
    if (c.kind === 'phone') lines.push(`TEL;TYPE=${c.label === 'Mobil' ? 'CELL,VOICE' : work ? 'WORK,VOICE' : 'HOME,VOICE'}:${vc(v)}`);
    else if (c.kind === 'mail') lines.push(`EMAIL;TYPE=INTERNET,${work ? 'WORK' : 'HOME'}:${vc(v)}`);
    else if (c.kind === 'web') lines.push(`URL:${contactHref(c)}`);
    else if (c.kind === 'address') lines.push(`ADR;TYPE=${work ? 'WORK' : 'HOME'}:;;${v.split(/,\s*/).map(vc).join(';')};;;;`);
    else if (c.kind === 'social') lines.push(`X-SOCIALPROFILE;type=${c.label.toLowerCase()};x-user=${v.replace(/^@/, '')}:${contactHref(c)}`);
  }
  if (row.bio) lines.push(foldVcardLine(`NOTE:${vc(row.bio)}`));
  if (row.photo_key) {
    const photoLine = await embeddedPhotoLine(env, row.photo_key);
    if (photoLine) lines.push(photoLine);
  }
  lines.push('END:VCARD');

  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/vcard; charset=UTF-8',
      'Content-Disposition': `attachment; filename="${slug}.vcf"; filename*=UTF-8''${encodeURIComponent(row.name)}.vcf`
    }
  });
}

async function embeddedPhotoLine(env, key) {
  try {
    const obj = await env.PHOTOS.get(key);
    if (!obj) return null;
    const buf = await obj.arrayBuffer();
    const base64 = bufferToBase64(buf);
    const mime = (obj.httpMetadata && obj.httpMetadata.contentType) || 'image/jpeg';
    const subtype = (mime.split('/')[1] || 'jpeg').toUpperCase().replace('JPG', 'JPEG');
    return foldVcardLine(`PHOTO;ENCODING=b;TYPE=${subtype}:${base64}`);
  } catch (e) {
    return null;
  }
}

function bufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function foldVcardLine(line) {
  const limit = 75;
  if (line.length <= limit) return line;
  let out = line.slice(0, limit);
  let rest = line.slice(limit);
  while (rest.length > 0) {
    out += '\r\n ' + rest.slice(0, limit - 1);
    rest = rest.slice(limit - 1);
  }
  return out;
}

/* ────────────────────────── GET /vk/:slug ─────────────────────────── */
async function handleCardPage(request, env, ctx, slug) {
  const row = await card(env, slug);
  if (!row) return new Response('Diese Visitenkarte wurde nicht gefunden.', { status: 404 });
  if (!row.published) return notPublishedPage();

  ctx.waitUntil(logEvent(env, slug, 'view', source(request), request));

  const accent = color(row.accent_color);
  const initials = row.name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  const avatar = row.photo_key
    ? `<div class="avatar"><img src="/photo/${escapeAttr(row.photo_key)}" alt="${escapeHtml(row.name)}"></div>`
    : `<div class="avatar mono">${escapeHtml(initials)}</div>`;

  let roleLine = '';
  if (row.employment_status === 'gruender') roleLine = [row.job_title || 'Gründer', row.company_name].filter(Boolean).join(' · ');
  else if (row.employment_status === 'mitarbeiter') roleLine = [row.job_title, row.company_name].filter(Boolean).join(' bei ');
  else roleLine = [row.job_title, row.company_name].filter(Boolean).join(' · ');

  const rows = parseContacts(row)
    .filter(c => str(c.value))
    .map(c => detailRow(c.kind, c.label, contactDisplay(c), contactHref(c), trackKind(c.kind)))
    .join('');

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(row.name)} — TapStern</title>
<link rel="icon" type="image/png" href="/tapstern-favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#161826; --surface:#232532; --text:#e9e9ed; --accent:${accent};
    --divider:color-mix(in srgb, #e9e9ed 16%, transparent);
    --muted:color-mix(in srgb, #e9e9ed 55%, transparent);
    --radius:8px; --shadow-md:0 0 0 1px #595d6c, 0 6px 18px rgba(0,0,0,0.55);
  }
  *,*::before,*::after{box-sizing:border-box;}
  body{
    margin:0; min-height:100vh; background:var(--bg); color:var(--text);
    font-family:'Inter',system-ui,sans-serif; font-size:15px; line-height:1.55;
    display:flex; align-items:center; justify-content:center; padding:22px 16px;
  }
  .card{
    width:100%; max-width:400px; background:var(--surface); border-radius:14px;
    box-shadow:var(--shadow-md); overflow:hidden;
  }
  .head{position:relative; padding:34px 22px 22px; text-align:center; overflow:hidden;}
  .head::before{
    content:''; position:absolute; inset:0;
    background:radial-gradient(120% 80% at 50% -20%, color-mix(in srgb, var(--accent) 30%, transparent), transparent 70%);
  }
  .head > *{position:relative;}
  .avatar{
    width:88px; height:88px; margin:0 auto 14px; border-radius:50%; overflow:hidden;
    display:grid; place-items:center; box-shadow:inset 0 0 0 1px var(--accent);
  }
  .avatar img{width:100%; height:100%; object-fit:cover; display:block;}
  .avatar.mono{
    font-size:31px; font-weight:500; letter-spacing:.02em; color:var(--accent);
    background:color-mix(in srgb, var(--accent) 22%, var(--surface));
  }
  h1{font-size:25px; font-weight:500; line-height:1.12; letter-spacing:-.015em; margin:0 0 3px;}
  .role{font-size:13px; color:color-mix(in srgb, #e9e9ed 70%, transparent); margin:0;}
  .bio{font-size:12px; color:var(--muted); margin:6px 0 0;}
  .save{
    display:inline-flex; align-items:center; justify-content:center; margin-top:17px;
    padding:11px 20px; border-radius:var(--radius); border:1px solid var(--accent);
    color:var(--accent); background:transparent; text-decoration:none; font-weight:500; font-size:15px;
  }
  .save:hover{background:color-mix(in srgb, var(--accent) 12%, transparent);}
  .save:active{background:color-mix(in srgb, var(--accent) 22%, transparent);}
  .rows{padding:0 22px 6px; display:grid;}
  .row{
    display:flex; gap:11px; align-items:center; padding:8px 0;
    color:var(--text); text-decoration:none;
  }
  .row:hover{background:color-mix(in srgb, #e9e9ed 4%, transparent);}
  .row .ico{
    flex:none; display:grid; place-items:center; width:34px; height:34px; border-radius:var(--radius);
    background:color-mix(in srgb, #e9e9ed 6%, transparent);
  }
  .row .txt{display:grid; gap:1px; min-width:0;}
  .row .lbl{font-size:10px; letter-spacing:.09em; text-transform:uppercase; color:color-mix(in srgb, #e9e9ed 50%, transparent);}
  .row .val{font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
  .foot{
    padding:14px 22px 22px; display:flex; align-items:center; justify-content:center; gap:8px;
    font-size:11px; color:color-mix(in srgb, #e9e9ed 40%, transparent);
  }
  .foot a{color:inherit; text-decoration:none;}
  .dot{width:6px; height:6px; border-radius:50%; background:var(--accent);}
  :focus{outline:none;}
  :focus-visible{outline:2px solid var(--accent); outline-offset:2px;}
  ::selection{background:color-mix(in srgb, var(--accent) 30%, transparent);}
</style>
</head>
<body>
<div class="card">
  <div class="head">
    ${avatar}
    <h1>${escapeHtml(row.name)}</h1>
    ${roleLine ? `<p class="role">${escapeHtml(roleLine)}</p>` : ''}
    ${row.bio ? `<p class="bio">${escapeHtml(row.bio)}</p>` : ''}
    <a class="save" href="/vk/${escapeAttr(slug)}/vcard" download="${escapeAttr(row.name)}.vcf">Kontakt speichern</a>
  </div>
  <div class="rows">${rows}</div>
  <div class="foot"><span class="dot"></span><span>Karte von <a href="https://tapstern.de">TapStern</a></span></div>
</div>
<script>
  document.querySelectorAll('[data-track]').forEach(function (el) {
    el.addEventListener('click', function () {
      try {
        navigator.sendBeacon('/api/track', JSON.stringify({
          slug: ${JSON.stringify(slug)}, action: el.dataset.track
        }));
      } catch (e) {}
    });
  });
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'no-store' }
  });
}

const ICONS = {
  phone: 'M6.5 3h3l1.5 3.5-2 1.5a9 9 0 0 0 4 4l1.5-2L18 11.5v3c0 .8-.7 1.5-1.5 1.5A12.5 12.5 0 0 1 4 4.5C4 3.7 4.7 3 5.5 3z',
  mail: 'M3 5.5h14v9H3zM3 6l7 5 7-5',
  web: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM3 10h14M10 3c2 2.2 2 11.8 0 14M10 3C8 5.2 8 14.8 10 17',
  address: 'M10 17s5-4.6 5-8.2A5 5 0 0 0 5 8.8C5 12.4 10 17 10 17zM10 10.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z',
  social: 'M8 12l4-4M7.5 10.5l-1.7 1.7a2.4 2.4 0 0 0 3.4 3.4l1.7-1.7M12.5 9.5l1.7-1.7a2.4 2.4 0 0 0-3.4-3.4L9.1 6.1'
};

function detailRow(icon, label, value, href, track) {
  return `<a class="row" href="${escapeAttr(href)}"${track ? ` data-track="${track}"` : ''}${/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : ''}>
    <span class="ico"><svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="var(--accent)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[icon] || ICONS.social}"/></svg></span>
    <span class="txt"><span class="lbl">${escapeHtml(label)}</span><span class="val">${escapeHtml(value)}</span></span>
  </a>`;
}

/* ══════════════════════ Konten-Helfer ══════════════════════ */

function normalizeEmail(v) { return str(v).toLowerCase(); }
function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) && v.length <= 254; }

function passwordProblem(pw) {
  if (pw.length < 10) return 'Das Passwort braucht mindestens 10 Zeichen';
  if (pw.length > 200) return 'Das Passwort ist zu lang';
  if (!/[a-zA-ZäöüÄÖÜß]/.test(pw) || !/[0-9]/.test(pw)) return 'Bitte Buchstaben und Zahlen mischen';
  return null;
}

function randomToken() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return [...b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/* PBKDF2-SHA256, 210.000 Runden — in Workers eingebaut, kein Paket nötig */
async function hashPassword(password, saltHex) {
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' }, key, 256);
  return 'pbkdf2$210000$' + bytesToHex(salt) + '$' + bytesToHex(new Uint8Array(bits));
}

async function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 4) return false;
  const again = await hashPassword(password, parts[2]);
  return timingSafeEqual(again, stored);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function bytesToHex(b) { return [...b].map(x => x.toString(16).padStart(2, '0')).join(''); }
function hexToBytes(h) {
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
}

/* Sitzung im HttpOnly-Cookie — kein Token im localStorage */
async function newSession(env, userId) {
  const token = randomToken();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires) VALUES (?,?,?)')
    .bind(await sha256(token), userId, Date.now() + SESSION_DAYS * DAY).run();
  return token;
}

function sessionCookie(token) {
  return `ts_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}

function sessionToken(request) {
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)ts_session=([^;]+)/);
  return m ? m[1] : '';
}

async function currentUser(env, request) {
  const t = sessionToken(request);
  if (!t) return { error: 'Bitte anmelden', status: 401 };
  const row = await env.DB.prepare(
    `SELECT u.*, s.expires FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`
  ).bind(await sha256(t)).first();
  if (!row) return { error: 'Bitte anmelden', status: 401 };
  if (row.expires < Date.now()) {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(t)).run();
    return { error: 'Sitzung abgelaufen, bitte neu anmelden', status: 401 };
  }
  return row;
}

async function cardsOf(env, userId) {
  const r = await env.DB.prepare(
    'SELECT slug, name, job_title, company_name, published, photo_key FROM businesscards WHERE user_id = ? ORDER BY created_at'
  ).bind(userId).all();
  return (r.results || []).map(c => ({
    slug: c.slug, name: c.name, jobTitle: c.job_title, companyName: c.company_name,
    published: !!c.published, photoUrl: c.photo_key ? '/photo/' + c.photo_key : null
  }));
}

async function ownedCard(env, user, slug) {
  const row = await card(env, slug);
  if (!row) return { error: 'Karte nicht gefunden', status: 404 };
  if (row.user_id !== user.id) return { error: 'Diese Karte gehört zu einem anderen Konto', status: 403 };
  return row;
}

async function freeSlug(env, base) {
  let slug = base || 'karte', n = 1;
  while (await slugExists(env.DB, slug)) { n++; slug = base + '-' + n; }
  return slug;
}

/* ══════════════════════ Mailversand über Brevo (EU) ══════════════════════ */

async function sendMail(env, to, subject, heading, body, ctaLabel, ctaUrl) {
  if (!env.BREVO_KEY) { console.log('BREVO_KEY fehlt — Mail an ' + to + ' nicht gesendet'); return; }
  const sender = parseSender(env.MAIL_FROM);
  const html = `<!DOCTYPE html><html lang="de"><body style="margin:0;padding:32px 16px;background:#161826;font-family:'Helvetica Neue',Arial,sans-serif;color:#e9e9ed">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#232532;border-radius:8px;padding:32px">
<tr><td style="font-size:20px;font-weight:500;padding-bottom:12px">${escapeHtml(heading)}</td></tr>
<tr><td style="font-size:15px;line-height:1.6;color:#c9c9d1;padding-bottom:24px">${escapeHtml(body)}</td></tr>
<tr><td><a href="${escapeAttr(ctaUrl)}" style="display:inline-block;padding:11px 22px;border:1px solid #9184d9;border-radius:8px;color:#b5abfc;text-decoration:none;font-size:15px">${escapeHtml(ctaLabel)}</a></td></tr>
<tr><td style="font-size:12px;color:#7a7d8c;padding-top:24px;line-height:1.6">Funktioniert der Knopf nicht, kopiere diese Adresse in den Browser:<br><span style="color:#9d9fae;word-break:break-all">${escapeHtml(ctaUrl)}</span></td></tr>
</table>
<div style="font-size:11px;color:#5c5f6d;padding-top:20px">TapStern · Diese Mail wurde automatisch versendet.</div>
</td></tr></table></body></html>`;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': env.BREVO_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ sender, to: [{ email: to }], subject, htmlContent: html })
    });
    if (!res.ok) console.log('Brevo ' + res.status + ': ' + await res.text());
  } catch (e) { console.log('Mailversand fehlgeschlagen: ' + e.message); }
}

// "TapStern <noreply@tapstern.de>" → { name, email }
function parseSender(v) {
  const raw = str(v) || 'TapStern <noreply@tapstern.de>';
  const m = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1] || 'TapStern', email: m[2] } : { name: 'TapStern', email: raw };
}

function sendVerifyMail(env, request, email, token) {
  const url = new URL(request.url).origin + '/verify?token=' + token;
  return sendMail(env, email, 'TapStern: E-Mail bestätigen', 'Noch ein Klick',
    'Bestätige deine Adresse, damit deine Karte öffentlich erreichbar wird. Der Link gilt 24 Stunden.',
    'E-Mail bestätigen', url);
}

function sendResetMail(env, request, email, token) {
  const url = new URL(request.url).origin + '/app.html?reset=' + token;
  return sendMail(env, email, 'TapStern: Passwort zurücksetzen', 'Neues Passwort setzen',
    'Du hast ein neues Passwort angefordert. Der Link gilt 60 Minuten. Warst du das nicht, ignoriere diese Mail.',
    'Passwort neu setzen', url);
}

function notPublishedPage() {
  return new Response(`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Noch nicht öffentlich — TapStern</title>
<link rel="icon" type="image/png" href="/tapstern-favicon.png">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#161826;color:#e9e9ed;font-family:'Inter',system-ui,sans-serif;padding:22px}
.box{max-width:380px;background:#232532;border-radius:8px;box-shadow:0 0 0 1px #595d6c,0 6px 18px rgba(0,0,0,.55);padding:34px;text-align:center}
h1{font-size:20px;font-weight:500;letter-spacing:-.015em;margin:0 0 11px}
p{font-size:14px;line-height:1.55;color:color-mix(in srgb,#e9e9ed 65%,transparent);margin:0}</style></head>
<body><div class="box"><h1>Noch nicht öffentlich</h1>
<p>Diese Karte wird sichtbar, sobald der Inhaber seine E-Mail-Adresse bestätigt hat.</p></div></body></html>`,
    { status: 404, headers: { 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'no-store' } });
}

function verifyPage(ok, message) {
  const accent = ok ? '#9184d9' : '#c98a8a';
  return new Response(`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"><title>TapStern</title>
<link rel="icon" type="image/png" href="/tapstern-favicon.png">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#161826;color:#e9e9ed;font-family:'Inter',system-ui,sans-serif;padding:22px}
.box{max-width:400px;background:#232532;border-radius:8px;box-shadow:0 0 0 1px #595d6c,0 6px 18px rgba(0,0,0,.55);padding:34px;text-align:center}
h1{font-size:22px;font-weight:500;letter-spacing:-.015em;margin:0 0 11px}
p{font-size:15px;line-height:1.55;color:color-mix(in srgb,#e9e9ed 70%,transparent);margin:0 0 22px}
a{display:inline-block;padding:11px 22px;border:1px solid ${accent};border-radius:8px;color:${accent};text-decoration:none;font-size:15px;font-weight:500}
a:hover{background:color-mix(in srgb,${accent} 12%,transparent)}</style></head>
<body><div class="box"><h1>${ok ? 'Fertig' : 'Das hat nicht geklappt'}</h1><p>${escapeHtml(message)}</p>
<a href="/app.html">Zum Konto</a></div></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=UTF-8', 'Cache-Control': 'no-store' } });
}

/* ─────────────────── Fehlversuche: 10 pro 15 Minuten ─────────────────── */
const LOCK_MAX = 10, LOCK_WINDOW = 15 * 60 * 1000;

async function checkLock(env, key) {
  const r = await env.DB.prepare('SELECT fails, until FROM login_locks WHERE key = ?').bind(key).first();
  if (!r) return null;
  if (r.until > Date.now()) {
    const min = Math.ceil((r.until - Date.now()) / 60000);
    return `Zu viele Fehlversuche. Bitte in ${min} Minuten erneut versuchen.`;
  }
  return null;
}

async function noteFail(env, key) {
  const now = Date.now();
  const r = await env.DB.prepare('SELECT fails, until FROM login_locks WHERE key = ?').bind(key).first();
  const fails = (r && r.until > now - LOCK_WINDOW ? r.fails : 0) + 1;
  const until = fails >= LOCK_MAX ? now + LOCK_WINDOW : now;
  await env.DB.prepare(
    'INSERT INTO login_locks (key, fails, until) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET fails = ?, until = ?'
  ).bind(key, fails, until, fails, until).run();
}

function clearFails(env, key) {
  return env.DB.prepare('DELETE FROM login_locks WHERE key = ?').bind(key).run();
}

/* ───────────────────────────── Helpers ────────────────────────────── */
const DAY = 1000 * 60 * 60 * 24;

async function readJson(request) { try { return await request.json(); } catch (e) { return null; } }
function str(v) { return (v == null ? '' : String(v)).trim(); }
function color(v) { const c = str(v).toLowerCase(); return COLORS.includes(c) ? c : COLORS[0]; }
function employment(v) { return ['gruender', 'mitarbeiter', 'keiner'].includes(v) ? v : 'keiner'; }
function card(env, slug) { return env.DB.prepare('SELECT * FROM businesscards WHERE slug = ?').bind(str(slug).toLowerCase()).first(); }

function publicCard(row) {
  return {
    slug: row.slug, name: row.name, birthday: row.birthday, photoUrl: row.photo_key ? `/photo/${row.photo_key}` : null,
    employmentStatus: row.employment_status, jobTitle: row.job_title, companyName: row.company_name,
    bio: row.bio, accentColor: color(row.accent_color), contacts: parseContacts(row)
  };
}

function source(request, explicit) {
  if (explicit) return explicit;
  const ref = request.headers.get('referer') || '';
  if (!ref) return 'nfc';           // Direktaufruf ohne Referrer: NFC-Tap oder QR
  try { if (new URL(ref).hostname === new URL(request.url).hostname) return 'intern'; } catch (e) {}
  return 'link';
}

function device(request) {
  const ua = request.headers.get('user-agent') || '';
  if (/iphone|ipad/i.test(ua)) return 'iPhone';
  if (/android/i.test(ua)) return 'Android';
  if (/macintosh|windows|linux/i.test(ua)) return 'Desktop';
  return 'Unbekannt';
}

async function logEvent(env, slug, action, src, request) {
  try {
    await env.DB.prepare(
      'INSERT INTO card_events (slug, action, source, device, created_at) VALUES (?,?,?,?,?)'
    ).bind(str(slug).toLowerCase(), action, src || 'nfc', device(request), Date.now()).run();
  } catch (e) { /* Statistik darf die Seite nie blockieren */ }
}

function slugify(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'kontakt';
}
async function slugExists(db, slug) {
  return !!(await db.prepare('SELECT 1 FROM businesscards WHERE slug = ?').bind(slug).first());
}
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
// vCard-Werte: Backslash, Semikolon, Komma und Umbruch maskieren (RFC 6350)
function vc(v) {
  return str(v).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function splitName(full) {
  const parts = str(full).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { given: '', family: '' };
  if (parts.length === 1) return { given: parts[0], family: '' };
  const family = parts.pop();
  return { given: parts.join(' '), family };
}

function normalizeUrl(url) { return /^https?:\/\//i.test(url) ? url : `https://${url}`; }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s).replace(/\n/g, ' '); }
function json(obj, status = 200, cookie) {
  const headers = { 'Content-Type': 'application/json; charset=UTF-8' };
  if (cookie) headers['Set-Cookie'] = cookie;
  return new Response(JSON.stringify(obj), { status, headers });
}
