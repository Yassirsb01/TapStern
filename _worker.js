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
      if (method === 'POST' && path === '/api/upload-logo') return handleUploadLogo(request, env);
      if (method === 'POST' && path === '/api/upload-banner') return handleUploadBanner(request, env);
      if (method === 'POST' && path === '/api/remove-photo') return handleRemovePhoto(request, env);
      if (method === 'POST' && path === '/api/remove-logo') return handleRemoveLogo(request, env);
      if (method === 'POST' && path === '/api/remove-banner') return handleRemoveBanner(request, env);
      if (method === 'POST' && path === '/api/track') return handleTrack(request, env);
      if (method === 'POST' && path === '/api/create-checkout') return handleCreateCheckout(request, env);
      if (method === 'GET' && path === '/api/stats') return handleStats(request, env);
      if (method === 'GET' && path === '/api/card') return handleCard(request, env);

      /* ── Stempel (Treueprogramm) ── */
      if (method === 'POST' && path === '/api/stempel/signup') return handleStempelSignup(request, env);
      if (method === 'POST' && path === '/api/stempel/verify-email') return handleStempelVerifyEmail(request, env);
      if (method === 'POST' && path === '/api/stempel/login') return handleStempelLogin(request, env);
      if (method === 'GET'  && path === '/api/stempel/me') return handleStempelMe(request, env);
      if (method === 'PUT'  && path === '/api/stempel/settings') return handleStempelSettings(request, env);
      if (method === 'GET'  && path === '/api/stempel/customers') return handleStempelCustomers(request, env);
      if (method === 'POST' && path === '/api/stempel/upload-logo') return handleStempelUploadImage(request, env, { formField: 'logo', column: 'logo_key', prefix: 'stempel-logo', resultKey: 'logoUrl' });
      if (method === 'POST' && path === '/api/stempel/upload-banner') return handleStempelUploadImage(request, env, { formField: 'banner', column: 'banner_key', prefix: 'stempel-banner', resultKey: 'bannerUrl' });
      if (method === 'POST' && path === '/api/stempel/remove-logo') return handleStempelRemoveImage(request, env, 'logo_key');
      if (method === 'POST' && path === '/api/stempel/remove-banner') return handleStempelRemoveImage(request, env, 'banner_key');
      if (method === 'GET'  && path === '/api/stempel/employees') return handleStempelListEmployees(request, env);
      if (method === 'POST' && path === '/api/stempel/employees') return handleStempelAddEmployee(request, env);
      const stempelEmpMatch = path.match(/^\/api\/stempel\/employees\/([^/]+)$/);
      if (method === 'DELETE' && stempelEmpMatch) return handleStempelDeleteEmployee(request, env, stempelEmpMatch[1]);
      if (method === 'POST' && path === '/api/stempel/checkout-subscription') return handleStempelCheckoutSubscription(request, env);
      if (method === 'POST' && path === '/api/stempel/checkout-card') return handleStempelCheckoutCard(request, env);
      if (method === 'POST' && path === '/webhook/stripe-stempel') return handleStempelStripeWebhook(request, env);

      const stempelTapMatch = path.match(/^\/s\/([^/]+)$/);
      if (method === 'GET' && stempelTapMatch) return handleStempelTap(request, env, stempelTapMatch[1], ctx);
      const staffRedeemMatch = path.match(/^\/staff-redeem\/([^/]+)$/);
      if (method === 'GET' && staffRedeemMatch) return handleStaffRedeemPage(request, env, staffRedeemMatch[1]);
      const googleWalletMatch = path.match(/^\/wallet\/google\/([^/]+)$/);
      if (method === 'GET' && googleWalletMatch) return handleGoogleWalletSave(request, env, googleWalletMatch[1]);
      if (method === 'POST' && path === '/api/stempel/staff-redeem') return handleStaffRedeemSubmit(request, env, ctx);

      /* ── Business Hub ── */
      if (method === 'POST' && path === '/api/hub/submit') return handleHubSubmit(request, env);
      if (method === 'POST' && path === '/api/hub/admin/login') return handleHubAdminLogin(request, env);
      if (method === 'GET'  && path === '/api/hub/admin/list') return handleHubAdminList(request, env);
      const hubPageMatch = path.match(/^\/api\/hub\/admin\/page\/([^/]+)$/);
      if (hubPageMatch && method === 'GET') return handleHubAdminGetPage(request, env, hubPageMatch[1]);
      if (hubPageMatch && method === 'PUT') return handleHubAdminUpdatePage(request, env, hubPageMatch[1]);
      const hubUploadMatch = path.match(/^\/api\/hub\/admin\/page\/([^/]+)\/(logo|banner)$/);
      if (hubUploadMatch && method === 'POST') return handleHubAdminUploadImage(request, env, hubUploadMatch[1], hubUploadMatch[2]);
      const hubPublishMatch = path.match(/^\/api\/hub\/admin\/page\/([^/]+)\/(publish|unpublish)$/);
      if (hubPublishMatch && method === 'POST') return handleHubAdminSetPublished(request, env, hubPublishMatch[1], hubPublishMatch[2] === 'publish');
      const hubReadyMatch = path.match(/^\/api\/hub\/admin\/page\/([^/]+)\/ready$/);
      if (hubReadyMatch && method === 'POST') return handleHubAdminMarkReady(request, env, hubReadyMatch[1]);
      const hubPaidMatch = path.match(/^\/api\/hub\/admin\/page\/([^/]+)\/mark-paid$/);
      if (hubPaidMatch && method === 'POST') return handleHubAdminMarkPaid(request, env, hubPaidMatch[1]);
      const hubDeleteMatch = path.match(/^\/api\/hub\/admin\/page\/([^/]+)$/);
      if (hubDeleteMatch && method === 'DELETE') return handleHubAdminDeletePage(request, env, hubDeleteMatch[1]);

      const hubPreviewMatch = path.match(/^\/hub-preview\/([^/]+)$/);
      if (method === 'GET' && hubPreviewMatch) return handleHubPreviewPage(request, env, hubPreviewMatch[1]);
      const hubCheckoutMatch = path.match(/^\/api\/hub\/preview\/([^/]+)\/checkout$/);
      if (method === 'POST' && hubCheckoutMatch) return handleHubPreviewCheckout(request, env, hubCheckoutMatch[1]);

      const hubPublicMatch = path.match(/^\/hub\/([^/]+)$/);
      if (method === 'GET' && hubPublicMatch) return handleHubPublicPage(request, env, hubPublicMatch[1]);

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
  if (row.logo_key) { try { await env.PHOTOS.delete(row.logo_key); } catch (e) {} }
  if (row.banner_key) { try { await env.PHOTOS.delete(row.banner_key); } catch (e) {} }
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
  if ('bgColor' in data) { sets.push('bg_color = ?'); vals.push(bgColorOrNull(data.bgColor)); }
  if ('employmentStatus' in data) { sets.push('employment_status = ?'); vals.push(employment(data.employmentStatus)); }
  if ('contacts' in data) { sets.push('contacts = ?'); vals.push(normalizeContacts(data.contacts)); }
  if (!sets.length) return json({ error: 'Keine Änderungen' }, 400);

  sets.push('updated_at = ?'); vals.push(Date.now());
  await env.DB.prepare(`UPDATE businesscards SET ${sets.join(', ')} WHERE slug = ?`)
    .bind(...vals, row.slug).run();

  return json({ success: true, card: publicCard(await card(env, row.slug)) });
}

/* ──────────────────── Bild-Uploads: Foto, Logo, Banner ──────────────────── */
// Gemeinsame Logik für /api/upload-photo, /api/upload-logo, /api/upload-banner.
// Alle drei legen die Datei im selben R2-Bucket (PHOTOS) ab und merken sich
// nur den Objekt-Key in der jeweiligen Spalte — genau wie bisher beim Foto.
async function handleUploadImage(request, env, opts) {
  let form;
  try { form = await request.formData(); } catch (e) { return json({ error: 'Ungültige Anfrage' }, 400); }

  const u = await currentUser(env, request);
  if (u.error) return json({ error: u.error }, u.status);
  const row = await ownedCard(env, u, form.get('slug'));
  if (row.error) return json({ error: row.error }, row.status);

  const file = form.get(opts.formField);
  if (!file) return json({ error: 'Fehlende Angaben' }, 400);
  if (!file.type || !file.type.startsWith('image/')) return json({ error: 'Bitte ein Bild hochladen' }, 400);
  if (file.size > 4 * 1024 * 1024) return json({ error: 'Bild darf maximal 4 MB groß sein' }, 400);

  const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const key = `${opts.prefix}-${row.slug}-${Date.now()}.${ext}`;
  await env.PHOTOS.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });

  const oldKey = row[opts.column];
  if (oldKey) { try { await env.PHOTOS.delete(oldKey); } catch (e) {} }

  await env.DB.prepare(`UPDATE businesscards SET ${opts.column} = ?, updated_at = ? WHERE slug = ?`)
    .bind(key, Date.now(), row.slug).run();

  return json({ success: true, [opts.resultKey]: `/photo/${key}` });
}

/* ────────────────────────── /api/upload-photo ──────────────────────── */
function handleUploadPhoto(request, env) {
  return handleUploadImage(request, env, { formField: 'photo', column: 'photo_key', prefix: 'photo', resultKey: 'photoUrl' });
}

/* ────────────────────────── /api/upload-logo ───────────────────────── */
function handleUploadLogo(request, env) {
  return handleUploadImage(request, env, { formField: 'logo', column: 'logo_key', prefix: 'logo', resultKey: 'logoUrl' });
}

/* ───────────────────────── /api/upload-banner ──────────────────────── */
function handleUploadBanner(request, env) {
  return handleUploadImage(request, env, { formField: 'banner', column: 'banner_key', prefix: 'banner', resultKey: 'bannerUrl' });
}

/* Logo/Banner wieder entfernen, ohne die restliche Karte anzufassen */
async function handleRemoveImage(request, env, column) {
  const d = await readJson(request) || {};
  const u = await currentUser(env, request);
  if (u.error) return json({ error: u.error }, u.status);
  const row = await ownedCard(env, u, d.slug);
  if (row.error) return json({ error: row.error }, row.status);

  if (row[column]) { try { await env.PHOTOS.delete(row[column]); } catch (e) {} }
  await env.DB.prepare(`UPDATE businesscards SET ${column} = NULL, updated_at = ? WHERE slug = ?`)
    .bind(Date.now(), row.slug).run();
  return json({ success: true });
}
function handleRemoveLogo(request, env) { return handleRemoveImage(request, env, 'logo_key'); }
function handleRemoveBanner(request, env) { return handleRemoveImage(request, env, 'banner_key'); }
function handleRemovePhoto(request, env) { return handleRemoveImage(request, env, 'photo_key'); }

/* ───────────────────────────── /api/track ─────────────────────────── */
// Aufruf vom Browser: navigator.sendBeacon('/api/track', JSON.stringify({slug, action:'call'}))
async function handleTrack(request, env) {
  const data = await readJson(request);
  if (!data || !data.slug) return json({ error: 'Ungültige Anfrage' }, 400);
  const action = ['view', 'save', 'call', 'mail', 'web'].includes(data.action) ? data.action : 'view';
  await logEvent(env, str(data.slug), action, source(request, str(data.source)), request);
  return json({ success: true });
}

/* ───────────────────────── /api/create-checkout ───────────────────── */
// Erstellt eine Stripe Checkout Session für "Jetzt online bezahlen" auf
// bestellen.html. Ruft die Stripe-API direkt per fetch auf (kein SDK nötig
// in Workers). Braucht STRIPE_SECRET_KEY als Secret (wrangler secret put).
//
// SICHERHEITSHINWEIS: Die Preise kommen hier vom Browser (Client), nicht aus
// einer serverseitigen Preisliste. Für den Start ok, aber jemand könnte
// theoretisch den Preis im Netzwerk-Request manipulieren, bevor er zu Stripe
// geht. Für mehr Sicherheit später: Preise serverseitig anhand einer festen
// Produktliste nachrechnen statt dem Client zu vertrauen.
async function handleCreateCheckout(request, env) {
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Zahlung ist noch nicht eingerichtet (STRIPE_SECRET_KEY fehlt)' }, 500);

  const data = await readJson(request);
  if (!data || !Array.isArray(data.items) || !data.items.length) {
    return json({ error: 'Ungültige Anfrage' }, 400);
  }

  const origin = new URL(request.url).origin;
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', origin + (data.successPath || '/bestellen.html?zahlung=erfolg'));
  params.set('cancel_url', origin + (data.cancelPath || '/bestellen.html?zahlung=abgebrochen'));
  if (data.customerEmail) params.set('customer_email', str(data.customerEmail));

  data.items.slice(0, 10).forEach((item, i) => {
    const name = str(item.name).slice(0, 200) || 'Tapstern-Bestellung';
    const unitAmount = Math.round(Number(item.unitAmount));
    const quantity = Math.max(1, Math.round(Number(item.quantity) || 1));
    if (!(unitAmount > 0)) return;
    params.set(`line_items[${i}][price_data][currency]`, 'eur');
    params.set(`line_items[${i}][price_data][product_data][name]`, name);
    params.set(`line_items[${i}][price_data][unit_amount]`, String(unitAmount));
    params.set(`line_items[${i}][quantity]`, String(quantity));
  });

  if (data.metadata && typeof data.metadata === 'object') {
    let n = 0;
    for (const [key, value] of Object.entries(data.metadata)) {
      if (n >= 20) break;
      params.set(`metadata[${str(key).slice(0, 40)}]`, str(value).slice(0, 490));
      n++;
    }
  }

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    const session = await res.json();
    if (!res.ok) return json({ error: session.error?.message || 'Stripe-Fehler' }, 502);
    return json({ url: session.url });
  } catch (e) {
    return json({ error: 'Zahlung konnte nicht gestartet werden: ' + e.message }, 500);
  }
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
  const bg = bgColorOrNull(row.bg_color) || '#161826';
  const textColor = readableTextColor(bg);
  const bannerUrl = row.banner_key ? `/photo/${escapeAttr(row.banner_key)}` : null;
  const logoUrl = row.logo_key ? `/photo/${escapeAttr(row.logo_key)}` : null;
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
    --bg:${bg}; --surface:color-mix(in srgb, var(--bg) 93%, var(--text) 7%); --text:${textColor}; --accent:${accent};
    --divider:color-mix(in srgb, var(--text) 16%, transparent);
    --muted:color-mix(in srgb, var(--text) 55%, transparent);
    --radius:8px; --shadow-md:0 0 0 1px color-mix(in srgb, var(--text) 20%, transparent), 0 6px 18px rgba(0,0,0,0.35);
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
  .head{position:relative; text-align:center;}
  .banner{height:120px; position:relative; overflow:hidden; background-size:cover; background-position:center;}
  .banner.no-image{background:linear-gradient(135deg, color-mix(in srgb, var(--accent) 45%, transparent), transparent 75%), var(--surface);}
  .logo-badge{position:absolute; top:14px; left:16px; width:38px; height:38px; border-radius:9px; overflow:hidden; background:rgba(0,0,0,.25); box-shadow:0 0 0 1px rgba(255,255,255,.15); z-index:2;}
  .logo-badge img{width:100%; height:100%; object-fit:cover; display:block;}
  .head-body{padding:0 22px 22px; margin-top:-44px; position:relative;}
  .avatar{
    width:88px; height:88px; margin:0 auto 14px; border-radius:50%; overflow:hidden;
    display:grid; place-items:center; box-shadow:0 0 0 4px var(--surface), inset 0 0 0 1px var(--accent); position:relative;
  }
  .avatar img{width:100%; height:100%; object-fit:cover; display:block;}
  .avatar.mono{
    font-size:31px; font-weight:500; letter-spacing:.02em; color:var(--accent);
    background:color-mix(in srgb, var(--accent) 22%, var(--surface));
  }
  h1{font-size:25px; font-weight:500; line-height:1.12; letter-spacing:-.015em; margin:0 0 3px;}
  .role{font-size:13px; color:color-mix(in srgb, var(--text) 70%, transparent); margin:0;}
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
  .row:hover{background:color-mix(in srgb, var(--text) 4%, transparent);}
  .row .ico{
    flex:none; display:grid; place-items:center; width:34px; height:34px; border-radius:var(--radius);
    background:color-mix(in srgb, var(--text) 6%, transparent);
  }
  .row .txt{display:grid; gap:1px; min-width:0;}
  .row .lbl{font-size:10px; letter-spacing:.09em; text-transform:uppercase; color:color-mix(in srgb, var(--text) 50%, transparent);}
  .row .val{font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
  .foot{
    padding:14px 22px 22px; display:flex; align-items:center; justify-content:center; gap:8px;
    font-size:11px; color:color-mix(in srgb, var(--text) 40%, transparent);
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
    <div class="banner${bannerUrl ? '' : ' no-image'}"${bannerUrl ? ` style="background-image:url('${bannerUrl}')"` : ''}>
      ${logoUrl ? `<div class="logo-badge"><img src="${logoUrl}" alt=""></div>` : ''}
    </div>
    <div class="head-body">
      ${avatar}
      <h1>${escapeHtml(row.name)}</h1>
      ${roleLine ? `<p class="role">${escapeHtml(roleLine)}</p>` : ''}
      ${row.bio ? `<p class="bio">${escapeHtml(row.bio)}</p>` : ''}
      <a class="save" href="/vk/${escapeAttr(slug)}/vcard" download="${escapeAttr(row.name)}.vcf">Kontakt speichern</a>
    </div>
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

/* PBKDF2-SHA256, 100.000 Runden — Cloudflare Workers erlaubt maximal 100.000 */
async function hashPassword(password, saltHex) {
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  return 'pbkdf2$100000$' + bytesToHex(salt) + '$' + bytesToHex(new Uint8Array(bits));
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
  const ctaHtml = ctaUrl
    ? `<tr><td><a href="${escapeAttr(ctaUrl)}" style="display:inline-block;padding:11px 22px;border:1px solid #9184d9;border-radius:8px;color:#b5abfc;text-decoration:none;font-size:15px">${escapeHtml(ctaLabel)}</a></td></tr>
<tr><td style="font-size:12px;color:#7a7d8c;padding-top:24px;line-height:1.6">Funktioniert der Knopf nicht, kopiere diese Adresse in den Browser:<br><span style="color:#9d9fae;word-break:break-all">${escapeHtml(ctaUrl)}</span></td></tr>`
    : '';
  const html = `<!DOCTYPE html><html lang="de"><body style="margin:0;padding:32px 16px;background:#161826;font-family:'Helvetica Neue',Arial,sans-serif;color:#e9e9ed">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#232532;border-radius:8px;padding:32px">
<tr><td style="font-size:20px;font-weight:500;padding-bottom:12px">${escapeHtml(heading)}</td></tr>
<tr><td style="font-size:15px;line-height:1.6;color:#c9c9d1;padding-bottom:24px">${escapeHtml(body)}</td></tr>
${ctaHtml}
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

/* ── QR-Code komplett serverseitig erzeugt (kein CDN, kein Client-Skript nötig) ──
   Damit der QR-Code auf der Kundenkarte niemals an einer externen Bibliothek scheitern kann. */
function makeQrcodeFactory(){
var qrcode=function(){var t=function(t,r){var e=t,n=g[r],o=null,i=0,a=null,u=[],f={},c=function(t,r){o=function(t){for(var r=new Array(t),e=0;e<t;e+=1){r[e]=new Array(t);for(var n=0;n<t;n+=1)r[e][n]=null}return r}(i=4*e+17),l(0,0),l(i-7,0),l(0,i-7),s(),h(),d(t,r),e>=7&&v(t),null==a&&(a=p(e,n,u)),w(a,r)},l=function(t,r){for(var e=-1;e<=7;e+=1)if(!(t+e<=-1||i<=t+e))for(var n=-1;n<=7;n+=1)r+n<=-1||i<=r+n||(o[t+e][r+n]=0<=e&&e<=6&&(0==n||6==n)||0<=n&&n<=6&&(0==e||6==e)||2<=e&&e<=4&&2<=n&&n<=4)},h=function(){for(var t=8;t<i-8;t+=1)null==o[t][6]&&(o[t][6]=t%2==0);for(var r=8;r<i-8;r+=1)null==o[6][r]&&(o[6][r]=r%2==0)},s=function(){for(var t=B.getPatternPosition(e),r=0;r<t.length;r+=1)for(var n=0;n<t.length;n+=1){var i=t[r],a=t[n];if(null==o[i][a])for(var u=-2;u<=2;u+=1)for(var f=-2;f<=2;f+=1)o[i+u][a+f]=-2==u||2==u||-2==f||2==f||0==u&&0==f}},v=function(t){for(var r=B.getBCHTypeNumber(e),n=0;n<18;n+=1){var a=!t&&1==(r>>n&1);o[Math.floor(n/3)][n%3+i-8-3]=a}for(n=0;n<18;n+=1){a=!t&&1==(r>>n&1);o[n%3+i-8-3][Math.floor(n/3)]=a}},d=function(t,r){for(var e=n<<3|r,a=B.getBCHTypeInfo(e),u=0;u<15;u+=1){var f=!t&&1==(a>>u&1);u<6?o[u][8]=f:u<8?o[u+1][8]=f:o[i-15+u][8]=f}for(u=0;u<15;u+=1){f=!t&&1==(a>>u&1);u<8?o[8][i-u-1]=f:u<9?o[8][15-u-1+1]=f:o[8][15-u-1]=f}o[i-8][8]=!t},w=function(t,r){for(var e=-1,n=i-1,a=7,u=0,f=B.getMaskFunction(r),c=i-1;c>0;c-=2)for(6==c&&(c-=1);;){for(var g=0;g<2;g+=1)if(null==o[n][c-g]){var l=!1;u<t.length&&(l=1==(t[u]>>>a&1)),f(n,c-g)&&(l=!l),o[n][c-g]=l,-1==(a-=1)&&(u+=1,a=7)}if((n+=e)<0||i<=n){n-=e,e=-e;break}}},p=function(t,r,e){for(var n=A.getRSBlocks(t,r),o=b(),i=0;i<e.length;i+=1){var a=e[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var u=0;for(i=0;i<n.length;i+=1)u+=n[i].dataCount;if(o.getLengthInBits()>8*u)throw"code length overflow. ("+o.getLengthInBits()+">"+8*u+")";for(o.getLengthInBits()+4<=8*u&&o.put(0,4);o.getLengthInBits()%8!=0;)o.putBit(!1);for(;!(o.getLengthInBits()>=8*u||(o.put(236,8),o.getLengthInBits()>=8*u));)o.put(17,8);return function(t,r){for(var e=0,n=0,o=0,i=new Array(r.length),a=new Array(r.length),u=0;u<r.length;u+=1){var f=r[u].dataCount,c=r[u].totalCount-f;n=Math.max(n,f),o=Math.max(o,c),i[u]=new Array(f);for(var g=0;g<i[u].length;g+=1)i[u][g]=255&t.getBuffer()[g+e];e+=f;var l=B.getErrorCorrectPolynomial(c),h=k(i[u],l.getLength()-1).mod(l);for(a[u]=new Array(l.getLength()-1),g=0;g<a[u].length;g+=1){var s=g+h.getLength()-a[u].length;a[u][g]=s>=0?h.getAt(s):0}}var v=0;for(g=0;g<r.length;g+=1)v+=r[g].totalCount;var d=new Array(v),w=0;for(g=0;g<n;g+=1)for(u=0;u<r.length;u+=1)g<i[u].length&&(d[w]=i[u][g],w+=1);for(g=0;g<o;g+=1)for(u=0;u<r.length;u+=1)g<a[u].length&&(d[w]=a[u][g],w+=1);return d}(o,n)};f.addData=function(t,r){var e=null;switch(r=r||"Byte"){case"Numeric":e=M(t);break;case"Alphanumeric":e=x(t);break;case"Byte":e=m(t);break;case"Kanji":e=L(t);break;default:throw"mode:"+r}u.push(e),a=null},f.isDark=function(t,r){if(t<0||i<=t||r<0||i<=r)throw t+","+r;return o[t][r]},f.getModuleCount=function(){return i},f.make=function(){if(e<1){for(var t=1;t<40;t++){for(var r=A.getRSBlocks(t,n),o=b(),i=0;i<u.length;i++){var a=u[i];o.put(a.getMode(),4),o.put(a.getLength(),B.getLengthInBits(a.getMode(),t)),a.write(o)}var g=0;for(i=0;i<r.length;i++)g+=r[i].dataCount;if(o.getLengthInBits()<=8*g)break}e=t}c(!1,function(){for(var t=0,r=0,e=0;e<8;e+=1){c(!0,e);var n=B.getLostPoint(f);(0==e||t>n)&&(t=n,r=e)}return r}())},f.createTableTag=function(t,r){t=t||2;var e="";e+='<table style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: "+(r=void 0===r?4*t:r)+"px;",e+='">',e+="<tbody>";for(var n=0;n<f.getModuleCount();n+=1){e+="<tr>";for(var o=0;o<f.getModuleCount();o+=1)e+='<td style="',e+=" border-width: 0px; border-style: none;",e+=" border-collapse: collapse;",e+=" padding: 0px; margin: 0px;",e+=" width: "+t+"px;",e+=" height: "+t+"px;",e+=" background-color: ",e+=f.isDark(n,o)?"#000000":"#ffffff",e+=";",e+='"/>';e+="</tr>"}return e+="</tbody>",e+="</table>"},f.createSvgTag=function(t,r,e,n){var o={};"object"==typeof arguments[0]&&(t=(o=arguments[0]).cellSize,r=o.margin,e=o.alt,n=o.title),t=t||2,r=void 0===r?4*t:r,(e="string"==typeof e?{text:e}:e||{}).text=e.text||null,e.id=e.text?e.id||"qrcode-description":null,(n="string"==typeof n?{text:n}:n||{}).text=n.text||null,n.id=n.text?n.id||"qrcode-title":null;var i,a,u,c,g=f.getModuleCount()*t+2*r,l="";for(c="l"+t+",0 0,"+t+" -"+t+",0 0,-"+t+"z ",l+='<svg version="1.1" xmlns="http://www.w3.org/2000/svg"',l+=o.scalable?"":' width="'+g+'px" height="'+g+'px"',l+=' viewBox="0 0 '+g+" "+g+'" ',l+=' preserveAspectRatio="xMinYMin meet"',l+=n.text||e.text?' role="img" aria-labelledby="'+y([n.id,e.id].join(" ").trim())+'"':"",l+=">",l+=n.text?'<title id="'+y(n.id)+'">'+y(n.text)+"</title>":"",l+=e.text?'<description id="'+y(e.id)+'">'+y(e.text)+"</description>":"",l+='<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>',l+='<path d="',a=0;a<f.getModuleCount();a+=1)for(u=a*t+r,i=0;i<f.getModuleCount();i+=1)f.isDark(a,i)&&(l+="M"+(i*t+r)+","+u+c);return l+='" stroke="transparent" fill="black"/>',l+="</svg>"},f.createDataURL=function(t,r){t=t||2,r=void 0===r?4*t:r;var e=f.getModuleCount()*t+2*r,n=r,o=e-r;return I(e,e,function(r,e){if(n<=r&&r<o&&n<=e&&e<o){var i=Math.floor((r-n)/t),a=Math.floor((e-n)/t);return f.isDark(a,i)?0:1}return 1})},f.createImgTag=function(t,r,e){t=t||2,r=void 0===r?4*t:r;var n=f.getModuleCount()*t+2*r,o="";return o+="<img",o+=' src="',o+=f.createDataURL(t,r),o+='"',o+=' width="',o+=n,o+='"',o+=' height="',o+=n,o+='"',e&&(o+=' alt="',o+=y(e),o+='"'),o+="/>"};var y=function(t){for(var r="",e=0;e<t.length;e+=1){var n=t.charAt(e);switch(n){case"<":r+="&lt;";break;case">":r+="&gt;";break;case"&":r+="&amp;";break;case'"':r+="&quot;";break;default:r+=n}}return r};return f.createASCII=function(t,r){if((t=t||1)<2)return function(t){t=void 0===t?2:t;var r,e,n,o,i,a=1*f.getModuleCount()+2*t,u=t,c=a-t,g={"██":"█","█ ":"▀"," █":"▄","  ":" "},l={"██":"▀","█ ":"▀"," █":" ","  ":" "},h="";for(r=0;r<a;r+=2){for(n=Math.floor((r-u)/1),o=Math.floor((r+1-u)/1),e=0;e<a;e+=1)i="█",u<=e&&e<c&&u<=r&&r<c&&f.isDark(n,Math.floor((e-u)/1))&&(i=" "),u<=e&&e<c&&u<=r+1&&r+1<c&&f.isDark(o,Math.floor((e-u)/1))?i+=" ":i+="█",h+=t<1&&r+1>=c?l[i]:g[i];h+="\n"}return a%2&&t>0?h.substring(0,h.length-a-1)+Array(a+1).join("▀"):h.substring(0,h.length-1)}(r);t-=1,r=void 0===r?2*t:r;var e,n,o,i,a=f.getModuleCount()*t+2*r,u=r,c=a-r,g=Array(t+1).join("██"),l=Array(t+1).join("  "),h="",s="";for(e=0;e<a;e+=1){for(o=Math.floor((e-u)/t),s="",n=0;n<a;n+=1)i=1,u<=n&&n<c&&u<=e&&e<c&&f.isDark(o,Math.floor((n-u)/t))&&(i=0),s+=i?g:l;for(o=0;o<t;o+=1)h+=s+"\n"}return h.substring(0,h.length-1)},f.renderTo2dContext=function(t,r){r=r||2;for(var e=f.getModuleCount(),n=0;n<e;n++)for(var o=0;o<e;o++)t.fillStyle=f.isDark(n,o)?"black":"white",t.fillRect(o*r,n*r,r,r)},f};t.stringToBytes=(t.stringToBytesFuncs={default:function(t){for(var r=[],e=0;e<t.length;e+=1){var n=t.charCodeAt(e);r.push(255&n)}return r}}).default,t.createStringToBytes=function(t,r){var e=function(){for(var e=S(t),n=function(){var t=e.read();if(-1==t)throw"eof";return t},o=0,i={};;){var a=e.read();if(-1==a)break;var u=n(),f=n()<<8|n();i[String.fromCharCode(a<<8|u)]=f,o+=1}if(o!=r)throw o+" != "+r;return i}(),n="?".charCodeAt(0);return function(t){for(var r=[],o=0;o<t.length;o+=1){var i=t.charCodeAt(o);if(i<128)r.push(i);else{var a=e[t.charAt(o)];"number"==typeof a?(255&a)==a?r.push(a):(r.push(a>>>8),r.push(255&a)):r.push(n)}}return r}};var r,e,n,o,i,a=1,u=2,f=4,c=8,g={L:1,M:0,Q:3,H:2},l=0,h=1,s=2,v=3,d=4,w=5,p=6,y=7,B=(r=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],e=1335,n=7973,i=function(t){for(var r=0;0!=t;)r+=1,t>>>=1;return r},(o={}).getBCHTypeInfo=function(t){for(var r=t<<10;i(r)-i(e)>=0;)r^=e<<i(r)-i(e);return 21522^(t<<10|r)},o.getBCHTypeNumber=function(t){for(var r=t<<12;i(r)-i(n)>=0;)r^=n<<i(r)-i(n);return t<<12|r},o.getPatternPosition=function(t){return r[t-1]},o.getMaskFunction=function(t){switch(t){case l:return function(t,r){return(t+r)%2==0};case h:return function(t,r){return t%2==0};case s:return function(t,r){return r%3==0};case v:return function(t,r){return(t+r)%3==0};case d:return function(t,r){return(Math.floor(t/2)+Math.floor(r/3))%2==0};case w:return function(t,r){return t*r%2+t*r%3==0};case p:return function(t,r){return(t*r%2+t*r%3)%2==0};case y:return function(t,r){return(t*r%3+(t+r)%2)%2==0};default:throw"bad maskPattern:"+t}},o.getErrorCorrectPolynomial=function(t){for(var r=k([1],0),e=0;e<t;e+=1)r=r.multiply(k([1,C.gexp(e)],0));return r},o.getLengthInBits=function(t,r){if(1<=r&&r<10)switch(t){case a:return 10;case u:return 9;case f:case c:return 8;default:throw"mode:"+t}else if(r<27)switch(t){case a:return 12;case u:return 11;case f:return 16;case c:return 10;default:throw"mode:"+t}else{if(!(r<41))throw"type:"+r;switch(t){case a:return 14;case u:return 13;case f:return 16;case c:return 12;default:throw"mode:"+t}}},o.getLostPoint=function(t){for(var r=t.getModuleCount(),e=0,n=0;n<r;n+=1)for(var o=0;o<r;o+=1){for(var i=0,a=t.isDark(n,o),u=-1;u<=1;u+=1)if(!(n+u<0||r<=n+u))for(var f=-1;f<=1;f+=1)o+f<0||r<=o+f||0==u&&0==f||a==t.isDark(n+u,o+f)&&(i+=1);i>5&&(e+=3+i-5)}for(n=0;n<r-1;n+=1)for(o=0;o<r-1;o+=1){var c=0;t.isDark(n,o)&&(c+=1),t.isDark(n+1,o)&&(c+=1),t.isDark(n,o+1)&&(c+=1),t.isDark(n+1,o+1)&&(c+=1),0!=c&&4!=c||(e+=3)}for(n=0;n<r;n+=1)for(o=0;o<r-6;o+=1)t.isDark(n,o)&&!t.isDark(n,o+1)&&t.isDark(n,o+2)&&t.isDark(n,o+3)&&t.isDark(n,o+4)&&!t.isDark(n,o+5)&&t.isDark(n,o+6)&&(e+=40);for(o=0;o<r;o+=1)for(n=0;n<r-6;n+=1)t.isDark(n,o)&&!t.isDark(n+1,o)&&t.isDark(n+2,o)&&t.isDark(n+3,o)&&t.isDark(n+4,o)&&!t.isDark(n+5,o)&&t.isDark(n+6,o)&&(e+=40);var g=0;for(o=0;o<r;o+=1)for(n=0;n<r;n+=1)t.isDark(n,o)&&(g+=1);return e+=Math.abs(100*g/r/r-50)/5*10},o),C=function(){for(var t=new Array(256),r=new Array(256),e=0;e<8;e+=1)t[e]=1<<e;for(e=8;e<256;e+=1)t[e]=t[e-4]^t[e-5]^t[e-6]^t[e-8];for(e=0;e<255;e+=1)r[t[e]]=e;var n={glog:function(t){if(t<1)throw"glog("+t+")";return r[t]},gexp:function(r){for(;r<0;)r+=255;for(;r>=256;)r-=255;return t[r]}};return n}();function k(t,r){if(void 0===t.length)throw t.length+"/"+r;var e=function(){for(var e=0;e<t.length&&0==t[e];)e+=1;for(var n=new Array(t.length-e+r),o=0;o<t.length-e;o+=1)n[o]=t[o+e];return n}(),n={getAt:function(t){return e[t]},getLength:function(){return e.length},multiply:function(t){for(var r=new Array(n.getLength()+t.getLength()-1),e=0;e<n.getLength();e+=1)for(var o=0;o<t.getLength();o+=1)r[e+o]^=C.gexp(C.glog(n.getAt(e))+C.glog(t.getAt(o)));return k(r,0)},mod:function(t){if(n.getLength()-t.getLength()<0)return n;for(var r=C.glog(n.getAt(0))-C.glog(t.getAt(0)),e=new Array(n.getLength()),o=0;o<n.getLength();o+=1)e[o]=n.getAt(o);for(o=0;o<t.getLength();o+=1)e[o]^=C.gexp(C.glog(t.getAt(o))+r);return k(e,0).mod(t)}};return n}var A=function(){var t=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12,7,37,13],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],r=function(t,r){var e={};return e.totalCount=t,e.dataCount=r,e},e={};return e.getRSBlocks=function(e,n){var o=function(r,e){switch(e){case g.L:return t[4*(r-1)+0];case g.M:return t[4*(r-1)+1];case g.Q:return t[4*(r-1)+2];case g.H:return t[4*(r-1)+3];default:return}}(e,n);if(void 0===o)throw"bad rs block @ typeNumber:"+e+"/errorCorrectionLevel:"+n;for(var i=o.length/3,a=[],u=0;u<i;u+=1)for(var f=o[3*u+0],c=o[3*u+1],l=o[3*u+2],h=0;h<f;h+=1)a.push(r(c,l));return a},e}(),b=function(){var t=[],r=0,e={getBuffer:function(){return t},getAt:function(r){var e=Math.floor(r/8);return 1==(t[e]>>>7-r%8&1)},put:function(t,r){for(var n=0;n<r;n+=1)e.putBit(1==(t>>>r-n-1&1))},getLengthInBits:function(){return r},putBit:function(e){var n=Math.floor(r/8);t.length<=n&&t.push(0),e&&(t[n]|=128>>>r%8),r+=1}};return e},M=function(t){var r=a,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+2<r.length;)t.put(o(r.substring(n,n+3)),10),n+=3;n<r.length&&(r.length-n==1?t.put(o(r.substring(n,n+1)),4):r.length-n==2&&t.put(o(r.substring(n,n+2)),7))}},o=function(t){for(var r=0,e=0;e<t.length;e+=1)r=10*r+i(t.charAt(e));return r},i=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);throw"illegal char :"+t};return n},x=function(t){var r=u,e=t,n={getMode:function(){return r},getLength:function(t){return e.length},write:function(t){for(var r=e,n=0;n+1<r.length;)t.put(45*o(r.charAt(n))+o(r.charAt(n+1)),11),n+=2;n<r.length&&t.put(o(r.charAt(n)),6)}},o=function(t){if("0"<=t&&t<="9")return t.charCodeAt(0)-"0".charCodeAt(0);if("A"<=t&&t<="Z")return t.charCodeAt(0)-"A".charCodeAt(0)+10;switch(t){case" ":return 36;case"$":return 37;case"%":return 38;case"*":return 39;case"+":return 40;case"-":return 41;case".":return 42;case"/":return 43;case":":return 44;default:throw"illegal char :"+t}};return n},m=function(r){var e=f,n=t.stringToBytes(r),o={getMode:function(){return e},getLength:function(t){return n.length},write:function(t){for(var r=0;r<n.length;r+=1)t.put(n[r],8)}};return o},L=function(r){var e=c,n=t.stringToBytesFuncs.SJIS;if(!n)throw"sjis not supported.";!function(){var t=n("友");if(2!=t.length||38726!=(t[0]<<8|t[1]))throw"sjis not supported."}();var o=n(r),i={getMode:function(){return e},getLength:function(t){return~~(o.length/2)},write:function(t){for(var r=o,e=0;e+1<r.length;){var n=(255&r[e])<<8|255&r[e+1];if(33088<=n&&n<=40956)n-=33088;else{if(!(57408<=n&&n<=60351))throw"illegal char at "+(e+1)+"/"+n;n-=49472}n=192*(n>>>8&255)+(255&n),t.put(n,13),e+=2}if(e<r.length)throw"illegal char at "+(e+1)}};return i},D=function(){var t=[],r={writeByte:function(r){t.push(255&r)},writeShort:function(t){r.writeByte(t),r.writeByte(t>>>8)},writeBytes:function(t,e,n){e=e||0,n=n||t.length;for(var o=0;o<n;o+=1)r.writeByte(t[o+e])},writeString:function(t){for(var e=0;e<t.length;e+=1)r.writeByte(t.charCodeAt(e))},toByteArray:function(){return t},toString:function(){var r="";r+="[";for(var e=0;e<t.length;e+=1)e>0&&(r+=","),r+=t[e];return r+="]"}};return r},S=function(t){var r=t,e=0,n=0,o=0,i={read:function(){for(;o<8;){if(e>=r.length){if(0==o)return-1;throw"unexpected end of file./"+o}var t=r.charAt(e);if(e+=1,"="==t)return o=0,-1;t.match(/^\s$/)||(n=n<<6|a(t.charCodeAt(0)),o+=6)}var i=n>>>o-8&255;return o-=8,i}},a=function(t){if(65<=t&&t<=90)return t-65;if(97<=t&&t<=122)return t-97+26;if(48<=t&&t<=57)return t-48+52;if(43==t)return 62;if(47==t)return 63;throw"c:"+t};return i},I=function(t,r,e){for(var n=function(t,r){var e=t,n=r,o=new Array(t*r),i={setPixel:function(t,r,n){o[r*e+t]=n},write:function(t){t.writeString("GIF87a"),t.writeShort(e),t.writeShort(n),t.writeByte(128),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(0),t.writeByte(255),t.writeByte(255),t.writeByte(255),t.writeString(","),t.writeShort(0),t.writeShort(0),t.writeShort(e),t.writeShort(n),t.writeByte(0);var r=a(2);t.writeByte(2);for(var o=0;r.length-o>255;)t.writeByte(255),t.writeBytes(r,o,255),o+=255;t.writeByte(r.length-o),t.writeBytes(r,o,r.length-o),t.writeByte(0),t.writeString(";")}},a=function(t){for(var r=1<<t,e=1+(1<<t),n=t+1,i=u(),a=0;a<r;a+=1)i.add(String.fromCharCode(a));i.add(String.fromCharCode(r)),i.add(String.fromCharCode(e));var f,c,g,l=D(),h=(f=l,c=0,g=0,{write:function(t,r){if(t>>>r!=0)throw"length over";for(;c+r>=8;)f.writeByte(255&(t<<c|g)),r-=8-c,t>>>=8-c,g=0,c=0;g|=t<<c,c+=r},flush:function(){c>0&&f.writeByte(g)}});h.write(r,n);var s=0,v=String.fromCharCode(o[s]);for(s+=1;s<o.length;){var d=String.fromCharCode(o[s]);s+=1,i.contains(v+d)?v+=d:(h.write(i.indexOf(v),n),i.size()<4095&&(i.size()==1<<n&&(n+=1),i.add(v+d)),v=d)}return h.write(i.indexOf(v),n),h.write(e,n),h.flush(),l.toByteArray()},u=function(){var t={},r=0,e={add:function(n){if(e.contains(n))throw"dup key:"+n;t[n]=r,r+=1},size:function(){return r},indexOf:function(r){return t[r]},contains:function(r){return void 0!==t[r]}};return e};return i}(t,r),o=0;o<r;o+=1)for(var i=0;i<t;i+=1)n.setPixel(i,o,e(i,o));var a=D();n.write(a);for(var u=function(){var t=0,r=0,e=0,n="",o={},i=function(t){n+=String.fromCharCode(a(63&t))},a=function(t){if(t<0);else{if(t<26)return 65+t;if(t<52)return t-26+97;if(t<62)return t-52+48;if(62==t)return 43;if(63==t)return 47}throw"n:"+t};return o.writeByte=function(n){for(t=t<<8|255&n,r+=8,e+=1;r>=6;)i(t>>>r-6),r-=6},o.flush=function(){if(r>0&&(i(t<<6-r),t=0,r=0),e%3!=0)for(var o=3-e%3,a=0;a<o;a+=1)n+="="},o.toString=function(){return n},o}(),f=a.toByteArray(),c=0;c<f.length;c+=1)u.writeByte(f[c]);return u.flush(),"data:image/gif;base64,"+u};return t}();qrcode.stringToBytesFuncs["UTF-8"]=function(t){return function(t){for(var r=[],e=0;e<t.length;e++){var n=t.charCodeAt(e);n<128?r.push(n):n<2048?r.push(192|n>>6,128|63&n):n<55296||n>=57344?r.push(224|n>>12,128|n>>6&63,128|63&n):(e++,n=65536+((1023&n)<<10|1023&t.charCodeAt(e)),r.push(240|n>>18,128|n>>12&63,128|n>>6&63,128|63&n))}return r}(t)};
return qrcode;
}
const qrcodeFactory = makeQrcodeFactory();

function generateQrSvg(text, size) {
  const qr = qrcodeFactory(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: size || 5, margin: 2 });
}

function color(v) {
  const c = str(v).toLowerCase();
  return /^#[0-9a-f]{6}$/.test(c) ? c : COLORS[0];
}
// Anders als accent_color: leer/ungültig bedeutet hier "Standard verwenden" (NULL),
// nicht ein erzwungener Fallback-Wert — so lässt sich die Karte auf Standard zurücksetzen.
function bgColorOrNull(v) {
  const c = str(v).toLowerCase();
  return /^#[0-9a-f]{6}$/.test(c) ? c : null;
}
// Einfache Helligkeits-Schätzung, damit Text auf hellem Hintergrund dunkel
// und auf dunklem Hintergrund hell wird — ohne dass der Kunde das einstellen muss.
function readableTextColor(bgHex) {
  const c = str(bgHex).replace('#', '');
  const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#161826' : '#e9e9ed';
}
function employment(v) { return ['gruender', 'mitarbeiter', 'keiner'].includes(v) ? v : 'keiner'; }
function card(env, slug) { return env.DB.prepare('SELECT * FROM businesscards WHERE slug = ?').bind(str(slug).toLowerCase()).first(); }

function publicCard(row) {
  return {
    slug: row.slug, name: row.name, birthday: row.birthday, photoUrl: row.photo_key ? `/photo/${row.photo_key}` : null,
    logoUrl: row.logo_key ? `/photo/${row.logo_key}` : null, bannerUrl: row.banner_key ? `/photo/${row.banner_key}` : null,
    employmentStatus: row.employment_status, jobTitle: row.job_title, companyName: row.company_name,
    bio: row.bio, accentColor: color(row.accent_color), bgColor: row.bg_color || null, contacts: parseContacts(row)
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

/* ══════════════════════════════════════════════════════════════
   Stempel — digitales Treueprogramm für lokale Läden
   Tabellen: stempel_shops, stempel_customers, stempel_events
   (eigene Tabellennamen, kollidieren nicht mit users/businesscards)
   ══════════════════════════════════════════════════════════════ */

function stempelCookie(shopId, token) {
  return `stempel_session=${shopId}:${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}
function stempelSessionFromRequest(request) {
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)stempel_session=([^;]+)/);
  return m ? m[1] : '';
}
async function currentShop(env, request) {
  const raw = stempelSessionFromRequest(request);
  if (!raw) return null;
  const [shopId, token] = raw.split(':');
  const row = await env.DB.prepare(
    `SELECT * FROM stempel_shops WHERE id = ? AND session_token_hash = ?`
  ).bind(shopId, await sha256(token || '')).first();
  return row || null;
}

async function handleStempelSignup(request, env) {
  const data = await request.json();
  const email = str(data.email).toLowerCase();
  const name = str(data.name);
  const password = str(data.password);
  const branche = str(data.branche);
  const firstName = str(data.first_name);
  const lastName = str(data.last_name);
  const phone = str(data.phone);
  const companySize = str(data.company_size);
  const referralCode = str(data.referral_code).toUpperCase();

  if (!email || !name || password.length < 8) {
    return json({ error: 'Bitte Name, gültige E-Mail und Passwort (min. 8 Zeichen) angeben' }, 400);
  }
  if (!validEmail(email)) return json({ error: 'Bitte eine gültige E-Mail-Adresse angeben' }, 400);

  const existing = await env.DB.prepare('SELECT id, verified FROM stempel_shops WHERE email = ?').bind(email).first();
  if (existing && existing.verified) return json({ error: 'Diese E-Mail ist schon registriert' }, 400);

  const slug = name.toLowerCase()
    .replace(/[äöüß]/g, c => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c]))
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).slice(2, 6);

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await sha256(code);
  const passwordHash = await hashPassword(password);

  if (existing) {
    // Unverifizierten Versuch mit neuen Daten überschreiben, statt einen zweiten Datensatz anzulegen
    await env.DB.prepare(
      `UPDATE stempel_shops SET name = ?, password_hash = ?, branche = ?, first_name = ?, last_name = ?, phone = ?, company_size = ?, verify_code_hash = ?, referral_code = ? WHERE id = ?`
    ).bind(name, passwordHash, branche, firstName || null, lastName || null, phone || null, companySize || null, codeHash, referralCode || null, existing.id).run();
  } else {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO stempel_shops (id, slug, name, email, password_hash, branche, first_name, last_name, phone, company_size, verify_code_hash, referral_code, verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
    ).bind(id, slug, name, email, passwordHash, branche, firstName || null, lastName || null, phone || null, companySize || null, codeHash, referralCode || null).run();
  }

  await sendMail(env, email, 'Dein Bestätigungscode für Tapstempel',
    'Fast geschafft',
    `Dein Bestätigungscode lautet: ${code}. Gib ihn ein, um dein Tapstempel-Konto zu aktivieren.`
  );

  return json({ success: true });
}

async function handleStempelVerifyEmail(request, env) {
  const data = await request.json();
  const email = str(data.email).toLowerCase();
  const code = str(data.code);

  const shop = await env.DB.prepare('SELECT * FROM stempel_shops WHERE email = ?').bind(email).first();
  if (!shop) return json({ error: 'Kein Konto mit dieser E-Mail gefunden' }, 404);
  if (shop.verified) return json({ error: 'Konto ist bereits bestätigt' }, 400);
  if (!shop.verify_code_hash || (await sha256(code)) !== shop.verify_code_hash) {
    return json({ error: 'Code ist falsch oder abgelaufen' }, 401);
  }

  const token = randomToken();
  await env.DB.prepare('UPDATE stempel_shops SET verified = 1, verify_code_hash = NULL, session_token_hash = ? WHERE id = ?')
    .bind(await sha256(token), shop.id).run();

  const { password_hash, session_token_hash, verify_code_hash, ...safe } = shop;
  safe.verified = 1;
  return json({ success: true, shop: safe }, 200, stempelCookie(shop.id, token));
}

async function handleStempelLogin(request, env) {
  const data = await request.json();
  const email = str(data.email).toLowerCase();
  const password = str(data.password);

  const shop = await env.DB.prepare('SELECT * FROM stempel_shops WHERE email = ?').bind(email).first();
  if (!shop || !(await verifyPassword(password, shop.password_hash))) {
    return json({ error: 'E-Mail oder Passwort falsch' }, 401);
  }
  if (!shop.verified) return json({ error: 'Bitte bestätige zuerst deine E-Mail-Adresse' }, 403);

  const token = randomToken();
  await env.DB.prepare('UPDATE stempel_shops SET session_token_hash = ? WHERE id = ?')
    .bind(await sha256(token), shop.id).run();

  const { password_hash, session_token_hash, ...safe } = shop;
  return json({ success: true, shop: safe }, 200, stempelCookie(shop.id, token));
}

async function handleStempelMe(request, env) {
  const shop = await currentShop(env, request);
  if (!shop) return json({ error: 'Nicht angemeldet' }, 401);
  const { password_hash, session_token_hash, ...safe } = shop;
  return json({ shop: safe });
}

async function handleStempelSettings(request, env) {
  const shop = await currentShop(env, request);
  if (!shop) return json({ error: 'Nicht angemeldet' }, 401);
  const data = await request.json();

  const validIcons = ['circle', 'star', 'heart', 'coffee', 'tea', 'food', 'pizza', 'cocktail', 'beer', 'bread', 'cupcake', 'icecream', 'scissors', 'nails', 'flower', 'spa', 'bag', 'paw', 'dumbbell', 'ball', 'book', 'car', 'leaf', 'shisha'];
  const stampIcon = validIcons.includes(str(data.stamp_icon)) ? str(data.stamp_icon) : (shop.stamp_icon || 'circle');
  const validPatterns = ['branche', 'none', 'dots', 'stripes'];
  const bgPattern = validPatterns.includes(str(data.bg_pattern)) ? str(data.bg_pattern) : (shop.bg_pattern || 'none');
  const accentColor = /^#[0-9a-fA-F]{6}$/.test(str(data.accent_color)) ? str(data.accent_color) : shop.accent_color;
  const cardBgColor = /^#[0-9a-fA-F]{6}$/.test(str(data.card_bg_color)) ? str(data.card_bg_color) : (shop.card_bg_color || '#14131a');

  await env.DB.prepare(
    `UPDATE stempel_shops SET reward_threshold = ?, reward_text = ?, accent_color = ?, card_bg_color = ?, extra_link_url = ?, extra_link_label = ?, min_stamp_interval_minutes = ?, stamp_icon = ?, bg_pattern = ? WHERE id = ?`
  ).bind(
    Math.max(1, parseInt(data.reward_threshold) || shop.reward_threshold),
    str(data.reward_text) || shop.reward_text,
    accentColor,
    cardBgColor,
    str(data.extra_link_url) || null,
    str(data.extra_link_label) || null,
    Math.max(10, parseInt(data.min_stamp_interval_minutes) || shop.min_stamp_interval_minutes),
    stampIcon,
    bgPattern,
    shop.id
  ).run();

  return json({ success: true });
}

/* Logo/Banner-Uploads fürs Stempel-Profil — nutzt denselben PHOTOS-Bucket wie die Karten-App */
async function handleStempelUploadImage(request, env, opts) {
  let form;
  try { form = await request.formData(); } catch (e) { return json({ error: 'Ungültige Anfrage' }, 400); }

  const shop = await currentShop(env, request);
  if (!shop) return json({ error: 'Nicht angemeldet' }, 401);

  const file = form.get(opts.formField);
  if (!file) return json({ error: 'Fehlende Angaben' }, 400);
  if (!file.type || !file.type.startsWith('image/')) return json({ error: 'Bitte ein Bild hochladen' }, 400);
  if (file.size > 4 * 1024 * 1024) return json({ error: 'Bild darf maximal 4 MB groß sein' }, 400);

  const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const key = `${opts.prefix}-${shop.slug}-${Date.now()}.${ext}`;
  await env.PHOTOS.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });

  const oldKey = shop[opts.column];
  if (oldKey) { try { await env.PHOTOS.delete(oldKey); } catch (e) {} }

  await env.DB.prepare(`UPDATE stempel_shops SET ${opts.column} = ? WHERE id = ?`).bind(key, shop.id).run();
  return json({ success: true, [opts.resultKey]: `/photo/${key}` });
}

async function handleStempelRemoveImage(request, env, column) {
  const shop = await currentShop(env, request);
  if (!shop) return json({ error: 'Nicht angemeldet' }, 401);
  if (shop[column]) { try { await env.PHOTOS.delete(shop[column]); } catch (e) {} }
  await env.DB.prepare(`UPDATE stempel_shops SET ${column} = NULL WHERE id = ?`).bind(shop.id).run();
  return json({ success: true });
}

async function handleStempelCustomers(request, env) {
  const shop = await currentShop(env, request);
  if (!shop) return json({ error: 'Nicht angemeldet' }, 401);
  const { results } = await env.DB.prepare(
    `SELECT id, stamps, redeemed_count, created_at, last_stamp_at FROM stempel_customers WHERE shop_id = ? ORDER BY last_stamp_at DESC LIMIT 200`
  ).bind(shop.id).all();
  return json({ customers: results });
}

/* Der Kern: NFC-Tap an der Laden-Karte, GET /s/:slug */
async function grantStamp(env, request, shop, ctx) {
  const cookieMatch = (request.headers.get('cookie') || '').match(/(?:^|;\s*)stempel_device=([^;]+)/);
  const deviceToken = cookieMatch ? cookieMatch[1] : null;
  let customer = deviceToken
    ? await env.DB.prepare('SELECT * FROM stempel_customers WHERE device_token = ? AND shop_id = ?').bind(deviceToken, shop.id).first()
    : null;

  const headers = new Headers({ 'Content-Type': 'text/html; charset=utf-8' });
  let isNew = false, cooldownHit = false;

  if (!customer) {
    isNew = true;
    const newToken = crypto.randomUUID();
    const redeemToken = crypto.randomUUID();
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO stempel_customers (id, shop_id, device_token, redeem_token, stamps, last_stamp_at) VALUES (?, ?, ?, ?, 1, datetime('now'))`
    ).bind(id, shop.id, newToken, redeemToken).run();
    await env.DB.prepare(`INSERT INTO stempel_events (id, customer_id, shop_id) VALUES (?, ?, ?)`).bind(crypto.randomUUID(), id, shop.id).run();
    customer = { id, stamps: 1, redeemed_count: 0, redeem_token: redeemToken };
    headers.append('Set-Cookie', `stempel_device=${newToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000`);
  } else {
    if (!customer.redeem_token) {
      customer.redeem_token = crypto.randomUUID();
      await env.DB.prepare(`UPDATE stempel_customers SET redeem_token = ? WHERE id = ?`).bind(customer.redeem_token, customer.id).run();
    }
    const result = await applyStampLogic(env, customer, shop, null, request, ctx);
    customer = result.customer; cooldownHit = result.cooldownHit;
  }

  return { headers, customer, isNew, cooldownHit };
}

/* Erhöht den Stempelstand eines bereits bekannten Kunden — genutzt vom NFC-Tap (bestehender Kunde)
   und vom Personal-Scan-Weg (Kunde per redeem_token bereits ermittelt). employeeId ist null bei NFC.
   Stößt danach (per ctx.waitUntil, blockiert die Response nicht) einen Live-Update-Push an Google
   Wallet an, damit bereits gespeicherte Karten den neuen Stempelstand zeigen. */
async function applyStampLogic(env, customer, shop, employeeId, request, ctx) {
  const lastStamp = customer.last_stamp_at ? new Date(customer.last_stamp_at + 'Z').getTime() : 0;
  const cooldownMs = (shop.min_stamp_interval_minutes || 240) * 60 * 1000;
  let cooldownHit = false;
  let stampChanged = false;

  if (Date.now() - lastStamp < cooldownMs) {
    cooldownHit = true;
  } else if (customer.stamps >= shop.reward_threshold) {
    await env.DB.prepare(
      `UPDATE stempel_customers SET stamps = 1, redeemed_count = redeemed_count + 1, last_stamp_at = datetime('now') WHERE id = ?`
    ).bind(customer.id).run();
    customer.stamps = 1; customer.redeemed_count += 1;
    stampChanged = true;
  } else {
    await env.DB.prepare(
      `UPDATE stempel_customers SET stamps = stamps + 1, last_stamp_at = datetime('now') WHERE id = ?`
    ).bind(customer.id).run();
    customer.stamps += 1;
    await env.DB.prepare(`INSERT INTO stempel_events (id, customer_id, shop_id, employee_id) VALUES (?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), customer.id, shop.id, employeeId).run();
    stampChanged = true;
  }

  if (stampChanged && ctx && request) {
    const origin = new URL(request.url).origin;
    ctx.waitUntil(
      pushGoogleWalletUpdate(env, origin, shop, customer).catch(e => console.error('Google Wallet Update fehlgeschlagen:', e))
    );
  }

  return { customer, cooldownHit };
}

async function grantStampToCustomer(env, customer, shop, employeeId, request, ctx) {
  const result = await applyStampLogic(env, customer, shop, employeeId, request, ctx);
  return { customer: result.customer, isNew: false, cooldownHit: result.cooldownHit };
}

async function handleStempelTap(request, env, slug, ctx) {
  const shop = await env.DB.prepare('SELECT * FROM stempel_shops WHERE slug = ?').bind(slug).first();
  if (!shop) return new Response('Laden nicht gefunden', { status: 404 });

  const { headers, customer, isNew, cooldownHit } = await grantStamp(env, request, shop, ctx);

  // TODO: sobald Apple/Google-Zertifikate als Secrets gesetzt sind, hier
  // echte Wallet-Karte erzeugen (isNew) bzw. per Push aktualisieren.

  const rewardReached = customer.stamps >= shop.reward_threshold;
  const html = renderStempelTapPage(shop, customer, { isNew, cooldownHit, rewardReached }, new URL(request.url).origin);
  return new Response(html, { headers });
}

/* ── Mitarbeiter-Verwaltung ── */
async function handleStempelListEmployees(request, env) {
  const shop = await currentShop(env, request);
  if (!shop) return json({ error: 'Nicht angemeldet' }, 401);
  const { results } = await env.DB.prepare(
    `SELECT id, name, created_at FROM stempel_employees WHERE shop_id = ? ORDER BY created_at`
  ).bind(shop.id).all();
  return json({ employees: results, plan: shop.plan || 'basic' });
}

async function handleStempelAddEmployee(request, env) {
  const shop = await currentShop(env, request);
  if (!shop) return json({ error: 'Nicht angemeldet' }, 401);
  const data = await readJson(request);
  const name = str(data?.name);
  const pin = str(data?.pin);
  if (!name) return json({ error: 'Bitte einen Namen angeben' }, 400);
  if (!/^\d{4,6}$/.test(pin)) return json({ error: 'PIN muss 4-6 Ziffern haben' }, 400);

  const limit = (shop.plan === 'premium') ? Infinity : 5;
  const { results: existing } = await env.DB.prepare(`SELECT id FROM stempel_employees WHERE shop_id = ?`).bind(shop.id).all();
  if ((existing || []).length >= limit) {
    return json({ error: `Dein Paket erlaubt maximal ${limit} Mitarbeiter. Für mehr auf Premium wechseln.` }, 400);
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO stempel_employees (id, shop_id, name, pin_hash) VALUES (?, ?, ?, ?)`)
    .bind(id, shop.id, name, await sha256(pin)).run();
  return json({ success: true, id });
}

async function handleStempelDeleteEmployee(request, env, id) {
  const shop = await currentShop(env, request);
  if (!shop) return json({ error: 'Nicht angemeldet' }, 401);
  const row = await env.DB.prepare(`SELECT id FROM stempel_employees WHERE id = ? AND shop_id = ?`).bind(id, shop.id).first();
  if (!row) return json({ error: 'Nicht gefunden' }, 404);
  await env.DB.prepare(`DELETE FROM stempel_employees WHERE id = ?`).bind(id).run();
  return json({ success: true });
}

/* ── Pakete & Preise ──
   TODO: Jahrespreis ist vorerst "10 Monate zahlen, 12 bekommen" — bitte prüfen/anpassen. */
const STEMPEL_PLAN_PRICES = {
  basic:   { monthly: 1999, yearly: 1999 * 10 },
  premium: { monthly: 2999, yearly: 2999 * 10 },
};
const STEMPEL_CARD_FIRST_CENTS = 2000;
const STEMPEL_CARD_EXTRA_CENTS = 500;

async function handleStempelCheckoutSubscription(request, env) {
  const shop = await currentShop(env, request);
  if (!shop) return json({ error: 'Nicht angemeldet' }, 401);
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Zahlung ist noch nicht eingerichtet' }, 500);

  const data = await readJson(request);
  const plan = ['basic', 'premium'].includes(str(data?.plan)) ? str(data.plan) : 'basic';
  const interval = ['monthly', 'yearly'].includes(str(data?.interval)) ? str(data.interval) : 'monthly';
  const amountCents = STEMPEL_PLAN_PRICES[plan][interval];
  const stripeInterval = interval === 'yearly' ? 'year' : 'month';

  const origin = new URL(request.url).origin;
  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('success_url', origin + '/stempel.html?abo=erfolg');
  params.set('cancel_url', origin + '/stempel.html?abo=abgebrochen');
  params.set('customer_email', shop.email);
  params.set('client_reference_id', shop.id);
  params.set('line_items[0][price_data][currency]', 'eur');
  params.set('line_items[0][price_data][product_data][name]', `Tapstempel ${plan === 'premium' ? 'Premium' : 'Basic'} (${interval === 'yearly' ? 'jährlich' : 'monatlich'})`);
  params.set('line_items[0][price_data][unit_amount]', String(amountCents));
  params.set('line_items[0][price_data][recurring][interval]', stripeInterval);
  params.set('line_items[0][quantity]', '1');
  params.set('metadata[shop_id]', shop.id);
  params.set('metadata[plan]', plan);
  params.set('metadata[interval]', interval);
  params.set('subscription_data[metadata][shop_id]', shop.id);
  params.set('subscription_data[metadata][plan]', plan);

  if (shop.referral_code && env.STEMPEL_REFERRAL_CODE && shop.referral_code.toUpperCase() === env.STEMPEL_REFERRAL_CODE.toUpperCase()) {
    params.set('subscription_data[trial_period_days]', '60');
  }

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const session = await res.json();
    if (!res.ok) return json({ error: session.error?.message || 'Stripe-Fehler' }, 502);
    return json({ url: session.url });
  } catch (e) {
    return json({ error: 'Zahlung konnte nicht gestartet werden: ' + e.message }, 500);
  }
}

async function handleStempelCheckoutCard(request, env) {
  const shop = await currentShop(env, request);
  if (!shop) return json({ error: 'Nicht angemeldet' }, 401);
  if (shop.subscription_status !== 'active') {
    return json({ error: 'Karten können erst nach einem aktiven Abo bestellt werden' }, 403);
  }
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Zahlung ist noch nicht eingerichtet' }, 500);

  const data = await readJson(request);
  const quantity = Math.max(1, Math.min(200, parseInt(data?.quantity) || 1));
  const amountCents = STEMPEL_CARD_FIRST_CENTS + (quantity - 1) * STEMPEL_CARD_EXTRA_CENTS;

  const orderId = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO stempel_card_orders (id, shop_id, quantity, amount_cents, status) VALUES (?, ?, ?, ?, 'pending')`
  ).bind(orderId, shop.id, quantity, amountCents).run();

  const origin = new URL(request.url).origin;
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', origin + '/stempel.html?karten=erfolg');
  params.set('cancel_url', origin + '/stempel.html?karten=abgebrochen');
  params.set('customer_email', shop.email);
  params.set('line_items[0][price_data][currency]', 'eur');
  params.set('line_items[0][price_data][product_data][name]', `Tapstempel NFC-Karten (${quantity} Stück, NTAG424 DNA)`);
  params.set('line_items[0][price_data][unit_amount]', String(amountCents));
  params.set('line_items[0][quantity]', '1');
  params.set('metadata[shop_id]', shop.id);
  params.set('metadata[order_id]', orderId);

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const session = await res.json();
    if (!res.ok) return json({ error: session.error?.message || 'Stripe-Fehler' }, 502);
    await env.DB.prepare(`UPDATE stempel_card_orders SET stripe_session_id = ? WHERE id = ?`).bind(session.id, orderId).run();
    return json({ url: session.url });
  } catch (e) {
    return json({ error: 'Zahlung konnte nicht gestartet werden: ' + e.message }, 500);
  }
}

/* ── Stripe-Webhook: hält subscription_status / plan automatisch aktuell.
   Braucht STEMPEL_STRIPE_WEBHOOK_SECRET als Secret — im Stripe-Dashboard unter
   Webhooks einen Endpunkt auf /webhook/stripe-stempel anlegen, Signing Secret kopieren. */
async function verifyStripeSignature(rawBody, sigHeader, secret) {
  if (!sigHeader) return false;
  const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')));
  const signedPayload = parts.t + '.' + rawBody;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expected = [...new Uint8Array(sigBuf)].map(b => b.toString(16).padStart(2, '0')).join('');
  return expected === parts.v1;
}

async function handleStempelStripeWebhook(request, env) {
  const rawBody = await request.text();
  if (env.STEMPEL_STRIPE_WEBHOOK_SECRET) {
    const ok = await verifyStripeSignature(rawBody, request.headers.get('stripe-signature'), env.STEMPEL_STRIPE_WEBHOOK_SECRET);
    if (!ok) return new Response('Ungültige Signatur', { status: 400 });
  }
  let event;
  try { event = JSON.parse(rawBody); } catch (e) { return new Response('Ungültiger Body', { status: 400 }); }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.mode === 'subscription' && session.metadata?.shop_id) {
      await env.DB.prepare(
        `UPDATE stempel_shops SET subscription_status = 'active', plan = ?, billing_interval = ?, stripe_customer_id = ?, stripe_subscription_id = ? WHERE id = ?`
      ).bind(session.metadata.plan, session.metadata.interval, session.customer, session.subscription, session.metadata.shop_id).run();
    }
    if (session.mode === 'payment' && session.metadata?.order_id) {
      await env.DB.prepare(`UPDATE stempel_card_orders SET status = 'bezahlt' WHERE id = ?`).bind(session.metadata.order_id).run();
      const order = await env.DB.prepare(`SELECT * FROM stempel_card_orders WHERE id = ?`).bind(session.metadata.order_id).first();
      const shop = order ? await env.DB.prepare(`SELECT * FROM stempel_shops WHERE id = ?`).bind(order.shop_id).first() : null;
      if (shop && env.MAIL_FROM) {
        sendMail(env, parseSender(env.MAIL_FROM).email, 'Tapstempel: Kartenbestellung bezahlt — ' + shop.name,
          'Neue Kartenbestellung', `${shop.name} hat ${order.quantity} Karte(n) bestellt und bezahlt (${(order.amount_cents / 100).toFixed(2)}€).`).catch(() => {});
      }
    }
  }

  if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object;
    const status = sub.status === 'active' || sub.status === 'trialing' ? 'active' : 'canceled';
    await env.DB.prepare(`UPDATE stempel_shops SET subscription_status = ? WHERE stripe_subscription_id = ?`)
      .bind(status, sub.id).run();
  }

  return json({ received: true });
}

/* ── Personal scannt den EIGENEN Code des Kunden, gibt dann den eigenen Mitarbeiter-PIN ein ──
   Kein Laden-Login auf dem Scan-Gerät nötig — der Mitarbeiter-PIN allein autorisiert den Stempel,
   und wird pro Mitarbeiter im Dashboard vergeben, damit im Verlauf sichtbar ist, wer gestempelt hat. */
/* ── Google Wallet ──
   Braucht drei Secrets (wrangler secret put):
   GOOGLE_WALLET_ISSUER_ID           — aus der Google Pay & Wallet Console
   GOOGLE_WALLET_SERVICE_ACCOUNT     — die "client_email" aus deiner Dienstkonto-JSON-Datei
   GOOGLE_WALLET_PRIVATE_KEY         — die "private_key" aus derselben Datei (mit \n als echte Zeilenumbrüche) */

function base64url(input) {
  // Strings müssen erst als UTF-8-Bytes kodiert werden, bevor btoa() sie
  // base64-kodiert — sonst kippt btoa() Zeichen wie "ü" in ein falsches
  // Einzelbyte (statt der 2-Byte-UTF-8-Folge), und beim Dekodieren wird
  // daraus "�" (kaputte Umlaute in Google-Wallet-Texten).
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const str = btoa(binary);
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signGoogleWalletJwt(payload, serviceAccountEmail, privateKeyPem) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const pemBody = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\\n/g, '')
    .replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8', binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${base64url(signature)}`;
}

/* Baut Class-/Object-IDs und den Belohnungstext — gemeinsam genutzt vom initialen
   "Zu Google Wallet hinzufügen" (JWT-Save) und vom späteren Live-Update (REST-Patch),
   damit beide Wege exakt denselben Text/Stand erzeugen. */
function buildLoyaltyIds(env, shop, customer) {
  return {
    classId: `${env.GOOGLE_WALLET_ISSUER_ID}.${shop.slug}`,
    objectId: `${env.GOOGLE_WALLET_ISSUER_ID}.${customer.id}`,
  };
}

function buildRewardMessage(shop, customer) {
  const remaining = Math.max(0, shop.reward_threshold - customer.stamps);
  return remaining === 0
    ? `Belohnung bereit: ${shop.reward_text}`
    : `Noch ${remaining} Stempel bis zu: ${shop.reward_text}`;
}

function buildLoyaltyClass(env, origin, shop, classId) {
  return {
    id: classId,
    issuerName: 'Tapstempel',
    programName: shop.name,
    reviewStatus: 'UNDER_REVIEW',
    hexBackgroundColor: shop.card_bg_color || '#14131a',
    ...(shop.logo_key ? { programLogo: { sourceUri: { uri: `${origin}/photo/${shop.logo_key}` } } } : {}),
  };
}

function buildLoyaltyObject(env, origin, shop, customer, classId, objectId) {
  return {
    id: objectId,
    classId: classId,
    state: 'ACTIVE',
    accountId: customer.id,
    accountName: shop.name,
    loyaltyPoints: {
      label: 'Stempel',
      balance: { string: `${customer.stamps}/${shop.reward_threshold}` },
    },
    textModulesData: [
      { id: 'reward_info', header: 'Deine Belohnung', body: buildRewardMessage(shop, customer) },
    ],
    barcode: {
      type: 'QR_CODE',
      value: `${origin}/staff-redeem/${customer.redeem_token}`,
      alternateText: 'Für Personal',
    },
    hexBackgroundColor: shop.card_bg_color || '#14131a',
    ...(shop.banner_key ? { heroImage: { sourceUri: { uri: `${origin}/photo/${shop.banner_key}` } } } : {}),
  };
}

async function handleGoogleWalletSave(request, env, slug) {
  if (!env.GOOGLE_WALLET_ISSUER_ID || !env.GOOGLE_WALLET_SERVICE_ACCOUNT || !env.GOOGLE_WALLET_PRIVATE_KEY) {
    return new Response('Google Wallet ist noch nicht eingerichtet.', { status: 500 });
  }
  const shop = await env.DB.prepare('SELECT * FROM stempel_shops WHERE slug = ?').bind(slug).first();
  if (!shop) return new Response('Laden nicht gefunden', { status: 404 });

  const cookieMatch = (request.headers.get('cookie') || '').match(/(?:^|;\s*)stempel_device=([^;]+)/);
  const customer = cookieMatch
    ? await env.DB.prepare('SELECT * FROM stempel_customers WHERE device_token = ? AND shop_id = ?').bind(cookieMatch[1], shop.id).first()
    : null;
  if (!customer) return new Response('Keine Stempelkarte gefunden — erst antippen oder QR-Code beitreten.', { status: 404 });

  const origin = new URL(request.url).origin;
  const { classId, objectId } = buildLoyaltyIds(env, shop, customer);

  const loyaltyClass = buildLoyaltyClass(env, origin, shop, classId);
  const loyaltyObject = buildLoyaltyObject(env, origin, shop, customer, classId, objectId);

  const payload = {
    iss: env.GOOGLE_WALLET_SERVICE_ACCOUNT,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    payload: {
      loyaltyClasses: [loyaltyClass],
      loyaltyObjects: [loyaltyObject],
    },
  };

  try {
    const jwt = await signGoogleWalletJwt(payload, env.GOOGLE_WALLET_SERVICE_ACCOUNT, env.GOOGLE_WALLET_PRIVATE_KEY);
    return Response.redirect(`https://pay.google.com/gp/v/save/${jwt}`, 302);
  } catch (e) {
    return new Response('Google Wallet konnte nicht erstellt werden: ' + e.message, { status: 500 });
  }
}

/* Holt ein OAuth-Access-Token fürs Dienstkonto (JWT-Bearer-Flow), um danach
   authentifiziert gegen die Google Wallet REST-API zu sprechen. Nötig, weil der
   "Save"-JWT oben NUR den initialen "Zu Wallet hinzufügen"-Klick abdeckt — spätere
   Änderungen an einer bereits gespeicherten Karte erreichen den Nutzer nur über
   einen echten PATCH-Call hier. */
async function getGoogleWalletAccessToken(env) {
  const payload = {
    iss: env.GOOGLE_WALLET_SERVICE_ACCOUNT,
    scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
    aud: 'https://oauth2.googleapis.com/token',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const jwt = await signGoogleWalletJwt(payload, env.GOOGLE_WALLET_SERVICE_ACCOUNT, env.GOOGLE_WALLET_PRIVATE_KEY);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Google OAuth fehlgeschlagen: ' + JSON.stringify(data));
  return data.access_token;
}

/* Schreibt den aktuellen Stempelstand + Belohnungstext auf das bei Google bereits
   gespeicherte Objekt zurück, damit iPhone/Android/Browser sofort denselben,
   aktuellen Stand zeigen — statt des Standes vom letzten "Zu Wallet hinzufügen". */
/* Schickt bei jedem Stempel das KOMPLETTE Class- und Object-JSON an Google (nicht nur
   Stempelstand + Text). Dadurch heilen sich alte/kaputte Karten (falsches Barcode-Alt-Text,
   fehlendes Banner/Logo, veraltete Farben) automatisch beim nächsten Stempel selbst — ohne
   dass der Kunde die Karte löschen und neu hinzufügen muss. PATCH überschreibt bei Google
   nur die mitgeschickten Felder, das komplette Objekt mitzuschicken ist also unkritisch. */
async function pushGoogleWalletUpdate(env, origin, shop, customer) {
  if (!env.GOOGLE_WALLET_ISSUER_ID || !env.GOOGLE_WALLET_SERVICE_ACCOUNT || !env.GOOGLE_WALLET_PRIVATE_KEY) return;
  if (!customer.redeem_token) return;

  const { classId, objectId } = buildLoyaltyIds(env, shop, customer);
  const accessToken = await getGoogleWalletAccessToken(env);
  const authHeaders = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  const classRes = await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${classId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify(buildLoyaltyClass(env, origin, shop, classId)),
  });
  if (!classRes.ok && classRes.status !== 404) {
    console.error(`Google Wallet Class-PATCH ${classRes.status}: ${await classRes.text()}`);
  }

  const objectRes = await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objectId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify(buildLoyaltyObject(env, origin, shop, customer, classId, objectId)),
  });

  if (!objectRes.ok) {
    // 404 heißt meist: Kunde hat die Karte nie zu Google Wallet hinzugefügt — kein Fehler, nur nichts zu tun.
    if (objectRes.status !== 404) {
      throw new Error(`Google Wallet Object-PATCH ${objectRes.status}: ${await objectRes.text()}`);
    }
  }
}

async function handleStaffRedeemPage(request, env, token) {
  const customer = await env.DB.prepare('SELECT * FROM stempel_customers WHERE redeem_token = ?').bind(token).first();
  if (!customer) return new Response('Karte nicht gefunden.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  const shop = await env.DB.prepare('SELECT * FROM stempel_shops WHERE id = ?').bind(customer.shop_id).first();
  if (!shop) return new Response('Laden nicht gefunden.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

  const accent = shop.accent_color || '#6366f1';
  return new Response(`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(shop.name)} — Stempel vergeben</title>
<style>
  body{margin:0; font-family:'Inter',system-ui,sans-serif; background:#14131a; color:#f3f0ea; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px;}
  .card{background:#211f29; border-radius:20px; padding:32px 28px; max-width:340px; width:100%; text-align:center;}
  h1{font-size:1.15rem; margin:0 0 6px;}
  p{color:#948d9c; font-size:0.88rem; margin:0 0 20px;}
  input{width:100%; font-size:1.6rem; text-align:center; letter-spacing:0.3em; padding:14px; border-radius:10px; border:1px solid rgba(255,255,255,0.12); background:#161421; color:#fff; margin-bottom:16px;}
  button{width:100%; padding:13px; border-radius:10px; border:none; background:${accent}; color:#fff; font-weight:600; font-size:0.95rem; cursor:pointer;}
  .err{color:#f2765a; font-size:0.85rem; margin-top:12px; display:none;}
</style></head>
<body>
  <div class="card">
    <h1>${escapeHtml(shop.name)}</h1>
    <p>Für diesen Gast einen Stempel vergeben — gib deinen persönlichen Mitarbeiter-PIN ein</p>
    <input type="text" inputmode="numeric" maxlength="6" id="pin" placeholder="••••">
    <button id="go">Stempel vergeben</button>
    <div class="err" id="err"></div>
  </div>
<script>
  document.getElementById('go').onclick = async function(){
    var pin = document.getElementById('pin').value.trim();
    var btn = this;
    btn.disabled = true;
    try {
      var res = await fetch('/api/stempel/staff-redeem', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ token: '${token}', pin: pin })
      });
      if (!res.ok) {
        var data = await res.json().catch(function(){ return {}; });
        document.getElementById('err').textContent = data.error || 'PIN falsch';
        document.getElementById('err').style.display = 'block';
        btn.disabled = false;
        return;
      }
      document.open(); document.write(await res.text()); document.close();
    } catch (e) {
      document.getElementById('err').textContent = 'Verbindungsfehler';
      document.getElementById('err').style.display = 'block';
      btn.disabled = false;
    }
  };
</script>
</body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

async function handleStaffRedeemSubmit(request, env, ctx) {
  const data = await readJson(request);
  const token = str(data?.token);
  const pin = str(data?.pin);

  const customer = await env.DB.prepare('SELECT * FROM stempel_customers WHERE redeem_token = ?').bind(token).first();
  if (!customer) return json({ error: 'Karte nicht gefunden' }, 404);
  const shop = await env.DB.prepare('SELECT * FROM stempel_shops WHERE id = ?').bind(customer.shop_id).first();
  if (!shop) return json({ error: 'Laden nicht gefunden' }, 404);

  const pinHash = await sha256(pin);
  const employee = await env.DB.prepare('SELECT * FROM stempel_employees WHERE shop_id = ? AND pin_hash = ?')
    .bind(shop.id, pinHash).first();
  if (!employee) return json({ error: 'PIN falsch' }, 401);

  const { customer: updated, isNew, cooldownHit } = await grantStampToCustomer(env, customer, shop, employee.id, request, ctx);
  const rewardReached = updated.stamps >= shop.reward_threshold;
  const html = renderStempelTapPage(shop, updated, { isNew: false, cooldownHit, rewardReached }, new URL(request.url).origin);
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

/* Branchen-Symbol fürs Hintergrundmuster — Farbe kommt vom Laden, Form von der Branche */
function brancheIconPath(branche) {
  const icons = {
    'Café': '<path d="M8 9 L9.5 20 Q9.7 22 11.5 22 L16.5 22 Q18.3 22 18.5 20 L20 9 Z" fill="C"/><path d="M20 11 Q25 11 25 15 Q25 19 20 18.3" fill="none" stroke="C" stroke-width="1.6"/>',
    'Restaurant': '<line x1="8" y1="3" x2="8" y2="13" stroke="C" stroke-width="1.6"/><line x1="6" y1="3" x2="6" y2="9" stroke="C" stroke-width="1.6"/><line x1="10" y1="3" x2="10" y2="9" stroke="C" stroke-width="1.6"/><line x1="8" y1="13" x2="8" y2="23" stroke="C" stroke-width="1.6"/><path d="M21 3 L21 11 Q21 13 19 13 L19 23" fill="none" stroke="C" stroke-width="1.6"/>',
    'Bar': '<path d="M6 5 L19 5 L12.5 14 Z" fill="none" stroke="C" stroke-width="1.6"/><line x1="12.5" y1="14" x2="12.5" y2="22" stroke="C" stroke-width="1.6"/><line x1="8.5" y1="22" x2="16.5" y2="22" stroke="C" stroke-width="1.6"/>',
    'Shishabar': '<path d="M12 22 Q6 22 6 16.5 Q6 11 12.5 11 Q17 11 17 6.5 Q17 3 12.5 3" fill="none" stroke="C" stroke-width="1.6" stroke-linecap="round"/>',
  };
  return icons[branche] || '<path d="M13 2 L15.3 9.7 L23 12 L15.3 14.3 L13 22 L10.7 14.3 L3 12 L10.7 9.7 Z" fill="C"/>';
}

function patternBackgroundCss(branche, colorHex, bgPattern) {
  const pattern = bgPattern || 'branche';
  if (pattern === 'none') return 'none';
  if (pattern === 'dots') {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26'><circle cx='4' cy='4' r='1.6' fill='${colorHex}' opacity='0.22'/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }
  if (pattern === 'stripes') {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26'><line x1='0' y1='26' x2='26' y2='0' stroke='${colorHex}' stroke-width='2' opacity='0.16'/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }
  const raw = brancheIconPath(branche).replace(/C/g, colorHex);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72'><g opacity='0.16'>${raw}</g><g opacity='0.16' transform='translate(36 36)'>${raw}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/* Stempel-Symbol statt festem Kreis — der Laden wählt in den Einstellungen */
const EMOJI_ICONS = {
  star: '⭐', heart: '❤️', coffee: '☕', tea: '🍵', food: '🍽️', pizza: '🍕',
  cocktail: '🍸', beer: '🍺', bread: '🥐', cupcake: '🧁', icecream: '🍦',
  scissors: '✂️', nails: '💅', flower: '🌸', spa: '🧘', bag: '🛍️',
  paw: '🐾', dumbbell: '🏋️', ball: '⚽', book: '📚', car: '🚗', leaf: '🍃',
};

function stampIconShape(icon, accent, extraClass) {
  const cls = `dot ${extraClass}`;
  if (icon === 'shisha') {
    const svg = '<ellipse cx="12" cy="17" rx="4.5" ry="4"/><rect x="11.3" y="6" width="1.4" height="9"/><path d="M9.5 6h5l-1 2.5h-3z"/>';
    return `<div class="${cls} dot-icon"><svg viewBox="0 0 24 24">${svg}</svg></div>`;
  }
  if (EMOJI_ICONS[icon]) {
    return `<div class="${cls} dot-emoji"><span>${EMOJI_ICONS[icon]}</span></div>`;
  }
  return `<div class="${cls}"></div>`;
}

function lightenHex(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amt));
  const b = Math.min(255, Math.max(0, (n & 0xff) + amt));
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

function luminanceOf(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function mixHex(hex, target, pct) {
  const n1 = parseInt(hex.replace('#', ''), 16), n2 = parseInt(target.replace('#', ''), 16);
  const r = Math.round(((n1 >> 16) & 0xff) + (((n2 >> 16) & 0xff) - ((n1 >> 16) & 0xff)) * pct);
  const g = Math.round(((n1 >> 8) & 0xff) + (((n2 >> 8) & 0xff) - ((n1 >> 8) & 0xff)) * pct);
  const b = Math.round((n1 & 0xff) + ((n2 & 0xff) - (n1 & 0xff)) * pct);
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

/* Kontrast-Fläche fürs Emoji-Kästchen: bei dunklem Kartenhintergrund deutlich heller machen (Richtung Weiß),
   bei hellem Kartenhintergrund deutlich dunkler (Richtung Schwarz) — echte Prozent-Mischung statt kleiner Zahl,
   damit man's wirklich sieht, egal welche Farbe der Laden wählt. */
function adaptiveSurface(hex) {
  return luminanceOf(hex) > 0.55 ? mixHex(hex, '#000000', 0.14) : mixHex(hex, '#ffffff', 0.24);
}

function renderStempelTapPage(shop, customer, { isNew, cooldownHit, rewardReached }, origin) {
  const accent = shop.accent_color || '#6366f1';
  const bg = shop.card_bg_color || '#14131a';
  const isLightBg = luminanceOf(bg) > 0.55;
  const bgSurface = isLightBg ? mixHex(bg, '#000000', 0.06) : mixHex(bg, '#ffffff', 0.09);
  const bgSurface2 = isLightBg ? mixHex(bg, '#000000', 0.10) : mixHex(bg, '#ffffff', 0.15);
  const emojiBox = adaptiveSurface(bg);
  const textColor = isLightBg ? '#1a1a1a' : '#f3f0ea';
  const mutedColor = isLightBg ? '#6b6b6b' : '#948d9c';
  const cardBorder = isLightBg ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.08)';
  const message = cooldownHit
    ? 'Dieser Stempel wurde gerade schon erfasst — versuch es beim nächsten Besuch nochmal.'
    : rewardReached
      ? `Belohnung erreicht: ${escapeHtml(shop.reward_text)}`
      : isNew ? 'Willkommen! Dein erster Stempel ist da.' : 'Stempel hinzugefügt!';
  const newestIndex = cooldownHit ? -1 : customer.stamps - 1;
  const patternCss = patternBackgroundCss(shop.branche, accent, shop.bg_pattern);
  const bannerHtml = shop.banner_key
    ? `<div class="banner" style="background-image:url('/photo/${escapeAttr(shop.banner_key)}')"></div>` : '';
  const logoHtml = shop.logo_key
    ? `<div class="logo-badge"><img src="/photo/${escapeAttr(shop.logo_key)}" alt=""></div>` : '';
  const linkHtml = (shop.extra_link_url && shop.extra_link_label)
    ? `<a class="extra-link" href="${escapeAttr(normalizeUrl(shop.extra_link_url))}" target="_blank" rel="noopener">${escapeHtml(shop.extra_link_label)}</a>` : '';

  return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(shop.name)} — Treueprogramm</title>
<style>
  @media (prefers-reduced-motion: reduce){ *{animation-duration:0.01ms !important; animation-iteration-count:1 !important;} }
  body{
    margin:0; font-family:'Inter',system-ui,sans-serif; background-color:${bg}; color:${textColor};
    background-image:${patternCss}; background-repeat:repeat;
    min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; overflow:hidden;
  }
  .card{
    background:${bgSurface}; border:1px solid ${cardBorder}; border-radius:20px; overflow:hidden;
    max-width:360px; width:100%; text-align:center; position:relative; z-index:1;
    animation:cardIn 0.5s cubic-bezier(.16,1,.3,1);
  }
  @keyframes cardIn{ from{opacity:0; transform:translateY(14px);} to{opacity:1; transform:translateY(0);} }
  .banner{height:96px; background-size:cover; background-position:center;}
  .logo-badge{
    width:52px; height:52px; border-radius:12px; overflow:hidden; margin:${shop.banner_key ? '-30px auto 6px' : '24px auto 6px'};
    background:${bgSurface2}; box-shadow:0 0 0 3px ${bgSurface}; position:relative; z-index:2;
  }
  .logo-badge img{width:100%; height:100%; object-fit:cover;}
  .body-pad{padding:${shop.banner_key || shop.logo_key ? '0 28px 32px' : '32px 28px'};}
  h1{font-size:1.25rem; margin:0 0 4px; font-weight:700;}
  .msg{color:${accent}; font-weight:600; margin:14px 0 24px; font-size:0.95rem;}
  .stamps{display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin:0 0 6px;}
  .dot{aspect-ratio:1; border-radius:50%; border:2px solid ${accent}; position:relative; display:flex; align-items:center; justify-content:center; transition:background 0.2s;}
  .dot.filled{background:${accent};}
  .dot-icon svg{width:56%; height:56%; fill:${accent}; stroke:${accent}; opacity:0.55;}
  .dot-icon.filled svg{fill:#fff; stroke:#fff; opacity:1;}
  .dot-emoji, .dot.filled.dot-emoji{border:none; border-radius:12px; background:${emojiBox};}
  .dot-emoji span{font-size:1.65rem; line-height:1; opacity:0.4; filter:saturate(0.5); transition:opacity 0.2s, filter 0.2s;}
  .dot-emoji.filled span{opacity:1; filter:none;}
  .dot.newest{animation:stampDown 0.45s cubic-bezier(.34,1.56,.64,1);}
  .stamps-panel{background:${mixHex(bg, luminanceOf(bg) > 0.55 ? '#000000' : '#ffffff', 0.06)}; border:1px solid ${mixHex(bg, luminanceOf(bg) > 0.55 ? '#000000' : '#ffffff', 0.14)}; border-radius:16px; padding:16px 14px 12px;}
  @keyframes stampDown{ 0%{transform:scale(1.8) rotate(-15deg); opacity:0;} 60%{transform:scale(0.92) rotate(4deg); opacity:1;} 100%{transform:scale(1) rotate(0);} }
  .count{font-size:0.85rem; color:${mutedColor}; margin-top:14px;}
  .extra-link{
    display:inline-block; margin-top:20px; padding:11px 22px; border-radius:10px;
    border:1px solid ${accent}; color:${accent}; text-decoration:none; font-size:0.88rem; font-weight:600;
  }
  .qr-fallback{margin-top:18px; font-size:0.8rem; color:${mutedColor};}
  .wallet-btn{
    display:flex; align-items:center; justify-content:center; gap:8px; margin-top:18px;
    padding:12px 16px; border-radius:10px; background:#fff; color:#1a1a1a; text-decoration:none;
    font-size:0.88rem; font-weight:600; box-shadow:0 2px 8px rgba(0,0,0,0.15);
  }
  .qr-fallback summary{cursor:pointer; color:${accent};}
  .qr-fallback #myQr{background:#fff; padding:10px; border-radius:10px;}
  .qr-fallback #myQr svg{width:100%; height:auto; display:block;}
</style></head>
<body>
  <canvas id="confetti" style="position:fixed; inset:0; pointer-events:none; z-index:0;"></canvas>
  <div class="card">
    ${bannerHtml}
    <div class="body-pad">
      ${logoHtml}
      <h1>${escapeHtml(shop.name)}</h1>
      <div class="msg">${message}</div>
      <div class="stamps-panel">
        <div class="stamps">
          ${Array.from({ length: shop.reward_threshold }, (_, i) =>
            stampIconShape(shop.stamp_icon, accent, `${i < customer.stamps ? 'filled' : ''} ${i === newestIndex ? 'newest' : ''}`)
          ).join('')}
        </div>
        <div class="count">${customer.stamps} / ${shop.reward_threshold} Stempel</div>
      </div>
      <a class="wallet-btn" href="${origin}/wallet/google/${shop.slug}">
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.2l7 3.5v8.6l-7 3.5-7-3.5V7.7l7-3.5z"/></svg>
        Zu Google Wallet hinzufügen
      </a>
      <details class="qr-fallback">
        <summary>Kein NFC? Zeig das dem Personal</summary>
        <div id="myQr" style="margin:14px auto 0; width:150px;">${generateQrSvg(origin + '/staff-redeem/' + (customer.redeem_token || ''))}</div>
      </details>
      ${linkHtml}
    </div>
  </div>
<script>
  ${rewardReached ? `
  (function(){
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var c = document.getElementById('confetti'), ctx = c.getContext('2d');
    c.width = innerWidth; c.height = innerHeight;
    var colors = ['${accent}', '${textColor}', '#e8663d'];
    var pieces = Array.from({length: 90}, function(){
      return { x: Math.random()*c.width, y: -20 - Math.random()*200, r: 3+Math.random()*4,
        c: colors[Math.floor(Math.random()*colors.length)], vy: 2+Math.random()*3, vx: -1.5+Math.random()*3, rot: Math.random()*360, vr: -6+Math.random()*12 };
    });
    var start = performance.now();
    function frame(t){
      ctx.clearRect(0,0,c.width,c.height);
      pieces.forEach(function(p){
        p.y += p.vy; p.x += p.vx; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle = p.c; ctx.fillRect(-p.r,-p.r,p.r*2,p.r*2); ctx.restore();
      });
      if (t - start < 2600) requestAnimationFrame(frame); else ctx.clearRect(0,0,c.width,c.height);
    }
    requestAnimationFrame(frame);
  })();` : ''}
</script>
</body></html>`;
}

/* ══════════════════════════════════════════════════════════════
   Business Hub — Multi-Link-Landingpage
   Kein Kunden-Login: Kunde bestellt + beschreibt seine Wunsch-Seite,
   Yassir trägt es im eigenen Admin-Bereich ein und veröffentlicht.
   Tabellen: hub_pages, hub_links, hub_admin_sessions
   ══════════════════════════════════════════════════════════════ */

const HUB_MAX_LINKS = 10;
const HUB_ADMIN_SESSION_DAYS = 14;

function hubAdminCookie(token) {
  return `hub_admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${HUB_ADMIN_SESSION_DAYS * 86400}`;
}
async function requireHubAdmin(request, env) {
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)hub_admin_session=([^;]+)/);
  if (!m) return false;
  const row = await env.DB.prepare(
    `SELECT 1 FROM hub_admin_sessions WHERE token_hash = ? AND expires_at > datetime('now')`
  ).bind(await sha256(m[1])).first();
  return !!row;
}

async function hubUniqueSlug(env, businessName) {
  const base = str(businessName).toLowerCase()
    .replace(/[äöüß]/g, c => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c]))
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'hub';
  let slug = base, n = 1;
  while (await env.DB.prepare('SELECT 1 FROM hub_pages WHERE slug = ?').bind(slug).first()) {
    n++; slug = base + '-' + n;
  }
  return slug;
}

function parseHubLinks(raw) {
  let links;
  try { links = JSON.parse(raw || '[]'); } catch (e) { return []; }
  if (!Array.isArray(links)) return [];
  return links
    .filter(l => l && str(l.label) && str(l.url))
    .slice(0, HUB_MAX_LINKS)
    .map(l => ({ description: str(l.description).slice(0, 200), label: str(l.label).slice(0, 60), url: str(l.url).slice(0, 500) }));
}

/* ── Bestellung / Erstanlage durch den Kunden ── */
async function handleHubSubmit(request, env) {
  let form;
  try { form = await request.formData(); } catch (e) { return json({ error: 'Ungültige Anfrage' }, 400); }

  const businessName = str(form.get('business_name'));
  const contactEmail = str(form.get('contact_email'));
  const contactPhone = str(form.get('contact_phone'));
  const bgColor = /^#[0-9a-fA-F]{6}$/.test(str(form.get('bg_color'))) ? str(form.get('bg_color')) : '#161826';
  const links = parseHubLinks(form.get('links'));
  const cardQuantity = [10, 20, 50, 100].includes(parseInt(form.get('card_quantity'))) ? parseInt(form.get('card_quantity')) : 10;

  if (!businessName) return json({ error: 'Bitte einen Firmen-/Betriebsnamen angeben' }, 400);
  if (contactEmail && !validEmail(contactEmail)) return json({ error: 'Bitte eine gültige E-Mail-Adresse angeben' }, 400);

  // Bilder vorab prüfen, bevor irgendetwas in der Datenbank landet
  const logoFile = form.get('logo');
  const bannerFile = form.get('banner');
  for (const f of [logoFile, bannerFile]) {
    if (f && typeof f === 'object' && f.size > 0) {
      if (!f.type || !f.type.startsWith('image/')) return json({ error: 'Logo/Banner müssen Bilddateien sein' }, 400);
      if (f.size > 5 * 1024 * 1024) return json({ error: 'Bilder dürfen maximal 5 MB groß sein' }, 400);
    }
  }

  const id = crypto.randomUUID();
  const slug = await hubUniqueSlug(env, businessName);
  const previewToken = crypto.randomUUID();

  let logoKey = null, bannerKey = null;
  try {
    if (logoFile && typeof logoFile === 'object' && logoFile.size > 0) {
      logoKey = `hub-logo-${slug}-${Date.now()}.${(logoFile.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')}`;
      await env.PHOTOS.put(logoKey, await logoFile.arrayBuffer(), { httpMetadata: { contentType: logoFile.type } });
    }
    if (bannerFile && typeof bannerFile === 'object' && bannerFile.size > 0) {
      bannerKey = `hub-banner-${slug}-${Date.now()}.${(bannerFile.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')}`;
      await env.PHOTOS.put(bannerKey, await bannerFile.arrayBuffer(), { httpMetadata: { contentType: bannerFile.type } });
    }
  } catch (e) {
    return json({ error: 'Bild-Upload fehlgeschlagen: ' + e.message }, 500);
  }

  await env.DB.prepare(
    `INSERT INTO hub_pages (id, slug, business_name, contact_email, contact_phone, logo_key, banner_key, bg_color, card_quantity, preview_token, published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
  ).bind(id, slug, businessName, contactEmail || null, contactPhone || null, logoKey, bannerKey, bgColor, cardQuantity, previewToken).run();

  for (let i = 0; i < links.length; i++) {
    await env.DB.prepare(
      `INSERT INTO hub_links (id, page_id, description, label, url, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), id, links[i].description || null, links[i].label, links[i].url, i).run();
  }

  if (env.MAIL_FROM) {
    const adminUrl = new URL(request.url).origin + '/hub-admin.html';
    sendMail(env, parseSender(env.MAIL_FROM).email, 'Neue Business-Hub-Bestellung: ' + businessName,
      'Neue Bestellung eingegangen',
      `${businessName} hat einen Business Hub bestellt. ${links.length} Link(s) angegeben. Jetzt im Admin-Bereich prüfen und veröffentlichen.`,
      'Zum Admin-Bereich', adminUrl
    ).catch(() => {});
  }

  return json({ success: true });
}

/* ── Admin-Bereich (nur Yassir) ── */
async function handleHubAdminLogin(request, env) {
  const data = await request.json();
  if (!env.HUB_ADMIN_PASSWORD) return json({ error: 'Admin-Zugang ist noch nicht eingerichtet' }, 500);
  if (str(data.password) !== env.HUB_ADMIN_PASSWORD) return json({ error: 'Falsches Passwort' }, 401);

  const token = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO hub_admin_sessions (token_hash, expires_at) VALUES (?, datetime('now', '+${HUB_ADMIN_SESSION_DAYS} days'))`
  ).bind(await sha256(token)).run();

  return json({ success: true }, 200, hubAdminCookie(token));
}

async function handleHubAdminList(request, env) {
  if (!(await requireHubAdmin(request, env))) return json({ error: 'Nicht angemeldet' }, 401);
  const { results } = await env.DB.prepare(
    `SELECT id, slug, business_name, published, created_at FROM hub_pages ORDER BY created_at DESC`
  ).all();
  return json({ pages: results });
}

async function handleHubAdminGetPage(request, env, id) {
  if (!(await requireHubAdmin(request, env))) return json({ error: 'Nicht angemeldet' }, 401);
  const page = await env.DB.prepare(`SELECT * FROM hub_pages WHERE id = ?`).bind(id).first();
  if (!page) return json({ error: 'Nicht gefunden' }, 404);
  const { results: links } = await env.DB.prepare(
    `SELECT id, description, label, url FROM hub_links WHERE page_id = ? ORDER BY sort_order`
  ).bind(id).all();
  return json({ page, links });
}

async function handleHubAdminUpdatePage(request, env, id) {
  if (!(await requireHubAdmin(request, env))) return json({ error: 'Nicht angemeldet' }, 401);
  const page = await env.DB.prepare(`SELECT id FROM hub_pages WHERE id = ?`).bind(id).first();
  if (!page) return json({ error: 'Nicht gefunden' }, 404);

  const data = await request.json();
  const businessName = str(data.business_name);
  if (!businessName) return json({ error: 'Firmenname darf nicht leer sein' }, 400);
  const bgColor = /^#[0-9a-fA-F]{6}$/.test(str(data.bg_color)) ? str(data.bg_color) : '#161826';
  const cardQuantity = [10, 20, 50, 100].includes(parseInt(data.card_quantity)) ? parseInt(data.card_quantity) : 10;
  const links = parseHubLinks(JSON.stringify(data.links || []));

  await env.DB.prepare(
    `UPDATE hub_pages SET business_name = ?, contact_email = ?, contact_phone = ?, bg_color = ?, card_quantity = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(businessName, str(data.contact_email) || null, str(data.contact_phone) || null, bgColor, cardQuantity, id).run();

  await env.DB.prepare(`DELETE FROM hub_links WHERE page_id = ?`).bind(id).run();
  for (let i = 0; i < links.length; i++) {
    await env.DB.prepare(
      `INSERT INTO hub_links (id, page_id, description, label, url, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), id, links[i].description || null, links[i].label, links[i].url, i).run();
  }
  return json({ success: true });
}

async function handleHubAdminUploadImage(request, env, id, kind) {
  if (!(await requireHubAdmin(request, env))) return json({ error: 'Nicht angemeldet' }, 401);
  const page = await env.DB.prepare(`SELECT * FROM hub_pages WHERE id = ?`).bind(id).first();
  if (!page) return json({ error: 'Nicht gefunden' }, 404);

  let form;
  try { form = await request.formData(); } catch (e) { return json({ error: 'Ungültige Anfrage' }, 400); }
  const file = form.get('file');
  if (!file || !file.type || !file.type.startsWith('image/')) return json({ error: 'Bitte ein Bild hochladen' }, 400);
  if (file.size > 5 * 1024 * 1024) return json({ error: 'Bild darf maximal 5 MB groß sein' }, 400);

  const column = kind === 'logo' ? 'logo_key' : 'banner_key';
  const key = `hub-${kind}-${page.slug}-${Date.now()}.${(file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')}`;
  await env.PHOTOS.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });

  if (page[column]) { try { await env.PHOTOS.delete(page[column]); } catch (e) {} }
  await env.DB.prepare(`UPDATE hub_pages SET ${column} = ?, updated_at = datetime('now') WHERE id = ?`).bind(key, id).run();
  return json({ success: true, url: `/photo/${key}` });
}

async function handleHubAdminSetPublished(request, env, id, published) {
  if (!(await requireHubAdmin(request, env))) return json({ error: 'Nicht angemeldet' }, 401);
  const page = await env.DB.prepare(`SELECT id FROM hub_pages WHERE id = ?`).bind(id).first();
  if (!page) return json({ error: 'Nicht gefunden' }, 404);
  await env.DB.prepare(`UPDATE hub_pages SET published = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(published ? 1 : 0, id).run();
  return json({ success: true });
}

/* Yassir ist mit dem Bauen fertig — Kunde bekommt den Vorschau-Link per Mail */
async function handleHubAdminMarkReady(request, env, id) {
  if (!(await requireHubAdmin(request, env))) return json({ error: 'Nicht angemeldet' }, 401);
  const page = await env.DB.prepare(`SELECT * FROM hub_pages WHERE id = ?`).bind(id).first();
  if (!page) return json({ error: 'Nicht gefunden' }, 404);
  if (!page.contact_email) return json({ error: 'Für diese Seite ist keine Kunden-E-Mail hinterlegt' }, 400);

  await env.DB.prepare(`UPDATE hub_pages SET ready_for_review = 1, updated_at = datetime('now') WHERE id = ?`).bind(id).run();

  const previewUrl = new URL(request.url).origin + '/hub-preview/' + page.preview_token;
  await sendMail(env, page.contact_email, 'Deine Business-Hub-Seite ist fertig zur Ansicht',
    'Deine Seite ist startklar',
    `Wir haben deine Business-Hub-Landingpage für ${page.business_name} fertiggestellt. Schau sie dir unverbindlich an — bestellen kannst du erst, wenn sie dir gefällt.`,
    'Vorschau ansehen', previewUrl
  );
  return json({ success: true });
}

async function handleHubAdminMarkPaid(request, env, id) {
  if (!(await requireHubAdmin(request, env))) return json({ error: 'Nicht angemeldet' }, 401);
  const page = await env.DB.prepare(`SELECT id FROM hub_pages WHERE id = ?`).bind(id).first();
  if (!page) return json({ error: 'Nicht gefunden' }, 404);
  await env.DB.prepare(`UPDATE hub_pages SET paid = 1, updated_at = datetime('now') WHERE id = ?`).bind(id).run();
  return json({ success: true });
}

async function handleHubAdminDeletePage(request, env, id) {
  if (!(await requireHubAdmin(request, env))) return json({ error: 'Nicht angemeldet' }, 401);
  const page = await env.DB.prepare(`SELECT * FROM hub_pages WHERE id = ?`).bind(id).first();
  if (!page) return json({ error: 'Nicht gefunden' }, 404);
  if (page.logo_key) { try { await env.PHOTOS.delete(page.logo_key); } catch (e) {} }
  if (page.banner_key) { try { await env.PHOTOS.delete(page.banner_key); } catch (e) {} }
  await env.DB.prepare(`DELETE FROM hub_links WHERE page_id = ?`).bind(id).run();
  await env.DB.prepare(`DELETE FROM hub_pages WHERE id = ?`).bind(id).run();
  return json({ success: true });
}

/* Preisstaffel für die Business-Hub-Karten (Menge -> Preis in EUR) */
const HUB_CARD_PRICES = { 10: 115, 20: 180, 50: 295, 100: 350 };
const HUB_HOSTING_PRICES = { 1: 39, 2: 69 };

/* ── Vorschau-Seite für den Kunden — funktioniert unabhängig vom Veröffentlichungs-Status ── */
async function handleHubPreviewPage(request, env, token) {
  const page = await env.DB.prepare(`SELECT * FROM hub_pages WHERE preview_token = ?`).bind(token).first();
  if (!page) return new Response('Vorschau nicht gefunden.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

  const { results: links } = await env.DB.prepare(
    `SELECT description, label, url FROM hub_links WHERE page_id = ? ORDER BY sort_order`
  ).bind(page.id).all();

  const bodyHtml = renderHubBody(page, links);
  const cardPrice = HUB_CARD_PRICES[page.card_quantity] || HUB_CARD_PRICES[10];

  const approvalBar = page.paid ? `
    <div class="approval-bar paid">✓ Bestellt — wir melden uns mit den nächsten Schritten.</div>
  ` : `
    <div class="approval-bar">
      <p>Gefällt dir deine Seite so? ${page.card_quantity} Karten/Aufkleber: <strong>${cardPrice}€</strong></p>
      <label>Hosting-Laufzeit</label>
      <div class="hosting-choice">
        <label><input type="radio" name="hy" value="1" checked> 1 Jahr — 39€</label>
        <label><input type="radio" name="hy" value="2"> 2 Jahre — 69€</label>
      </div>
      <button id="approveBtn" class="approve-btn">Jetzt bestellen &amp; bezahlen</button>
      <div class="approve-err" id="approveErr"></div>
    </div>
  `;

  return new Response(`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vorschau — ${escapeHtml(page.business_name)}</title>
<style>
  body{margin:0; font-family:'Inter',system-ui,sans-serif; background:#0d0f1a; color:#f3f0ea; min-height:100vh; padding-bottom:40px;}
  .preview-banner{background:#6366f1; color:#fff; text-align:center; padding:10px; font-size:0.85rem; font-weight:600;}
  ${hubPageStyles(page.bg_color)}
  .approval-bar{max-width:420px; margin:24px auto 0; background:#211f29; border-radius:14px; padding:22px; text-align:center;}
  .approval-bar.paid{color:#4ade80; font-weight:600;}
  .approval-bar p{margin:0 0 14px; font-size:0.95rem;}
  .hosting-choice{display:flex; flex-direction:column; gap:8px; text-align:left; font-size:0.88rem; margin:8px 0 16px;}
  .approve-btn{width:100%; padding:13px; border-radius:10px; border:none; background:#6366f1; color:#fff; font-weight:600; font-size:0.95rem; cursor:pointer;}
  .approve-btn:disabled{opacity:0.6;}
  .approve-err{color:#f2765a; font-size:0.85rem; margin-top:10px;}
</style></head>
<body>
  <div class="preview-banner">Das ist eine unverbindliche Vorschau — noch nicht öffentlich sichtbar.</div>
  ${bodyHtml}
  ${approvalBar}
<script>
  var btn = document.getElementById('approveBtn');
  if (btn) {
    btn.onclick = async function(){
      btn.disabled = true; btn.textContent = 'Weiterleitung zu Stripe …';
      var years = document.querySelector('input[name="hy"]:checked').value;
      try {
        var res = await fetch('/api/hub/preview/${token}/checkout', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ hosting_years: years })
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Fehler');
        window.location.href = data.url;
      } catch (e) {
        document.getElementById('approveErr').textContent = e.message;
        btn.disabled = false; btn.textContent = 'Jetzt bestellen & bezahlen';
      }
    };
  }
</script>
</body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

/* Zahlung erst nach Zustimmung des Kunden — setzt NICHT automatisch "published",
   das macht Yassir bewusst manuell im Admin-Bereich, nachdem er den Zahlungseingang
   geprüft hat (schützt davor, dass jemand die Erfolgs-URL ohne echte Zahlung aufruft) */
async function handleHubPreviewCheckout(request, env, token) {
  const page = await env.DB.prepare(`SELECT * FROM hub_pages WHERE preview_token = ?`).bind(token).first();
  if (!page) return json({ error: 'Vorschau nicht gefunden' }, 404);
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Zahlung ist noch nicht eingerichtet' }, 500);

  const data = await readJson(request);
  const hostingYears = [1, 2].includes(parseInt(data?.hosting_years)) ? parseInt(data.hosting_years) : 1;
  const cardPrice = HUB_CARD_PRICES[page.card_quantity] || HUB_CARD_PRICES[10];
  const hostingPrice = HUB_HOSTING_PRICES[hostingYears];
  const totalCents = Math.round((cardPrice + hostingPrice) * 100);

  await env.DB.prepare(`UPDATE hub_pages SET hosting_years = ? WHERE id = ?`).bind(hostingYears, page.id).run();

  const origin = new URL(request.url).origin;
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', origin + '/hub-preview/' + token + '?zahlung=erfolg');
  params.set('cancel_url', origin + '/hub-preview/' + token + '?zahlung=abgebrochen');
  if (page.contact_email) params.set('customer_email', page.contact_email);
  params.set('line_items[0][price_data][currency]', 'eur');
  params.set('line_items[0][price_data][product_data][name]',
    `Business Hub — ${page.card_quantity} Karten + ${hostingYears} Jahr(e) Hosting (${page.business_name})`);
  params.set('line_items[0][price_data][unit_amount]', String(totalCents));
  params.set('line_items[0][quantity]', '1');
  params.set('metadata[hub_page_id]', page.id);

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const session = await res.json();
    if (!res.ok) return json({ error: session.error?.message || 'Stripe-Fehler' }, 502);

    // Zahlungsversuch als "unterwegs" markieren, damit Yassir es im Admin-Bereich sieht —
    // "paid" wird erst nach manueller Prüfung durch Yassir gesetzt, nicht automatisch hier.
    if (env.MAIL_FROM) {
      sendMail(env, parseSender(env.MAIL_FROM).email, 'Business Hub: Kunde will bestellen — ' + page.business_name,
        'Zahlung angestoßen', `${page.business_name} hat die Bestellung gestartet (${page.card_quantity} Karten, ${hostingYears} Jahr(e) Hosting). Bitte Zahlungseingang bei Stripe prüfen, bevor du im Admin-Bereich veröffentlichst.`,
        'Zum Admin-Bereich', origin + '/hub-admin.html').catch(() => {});
    }

    return json({ url: session.url });
  } catch (e) {
    return json({ error: 'Zahlung konnte nicht gestartet werden: ' + e.message }, 500);
  }
}

/* ── Öffentliche Landingpage ── */
function hubPageStyles(bgColor) {
  const bg = bgColor || '#161826';
  return `
  body{margin:0; font-family:'Inter',system-ui,sans-serif; background:${bg}; color:#f3f0ea; min-height:100vh;}
  .page{max-width:420px; width:100%; margin:0 auto;}
  .banner{height:150px; background-size:cover; background-position:center;}
  .logo-badge{width:64px; height:64px; border-radius:14px; overflow:hidden; margin:auto; background:rgba(255,255,255,0.08); box-shadow:0 0 0 4px ${bg}; position:relative;}
  .logo-badge img{width:100%; height:100%; object-fit:cover;}
  h1{text-align:center; font-size:1.3rem; margin:0 0 26px; padding:0 20px;}
  .link-block{padding:0 20px; margin-bottom:16px;}
  .link-desc{font-size:0.85rem; color:rgba(243,240,234,0.65); margin:0 0 8px; text-align:center;}
  .link-btn{display:block; text-align:center; padding:14px; border-radius:12px; background:rgba(255,255,255,0.08); color:#f3f0ea; text-decoration:none; font-weight:600; font-size:0.95rem;}
  .link-btn:hover{background:rgba(255,255,255,0.14);}`;
}

function renderHubBody(page, links) {
  const bannerHtml = page.banner_key ? `<div class="banner" style="background-image:url('/photo/${escapeAttr(page.banner_key)}')"></div>` : '';
  const logoStyle = page.banner_key ? 'margin-top:-34px; margin-bottom:14px;' : 'margin-top:40px; margin-bottom:14px;';
  const logoHtml = page.logo_key ? `<div class="logo-badge" style="${logoStyle}"><img src="/photo/${escapeAttr(page.logo_key)}" alt=""></div>` : '<div style="height:40px;"></div>';
  const linksHtml = (links || []).map(l => `
    <div class="link-block">
      ${l.description ? `<p class="link-desc">${escapeHtml(l.description)}</p>` : ''}
      <a class="link-btn" href="${escapeAttr(normalizeUrl(l.url))}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>
    </div>`).join('');

  return `<div class="page">
    ${bannerHtml}
    ${logoHtml}
    <h1>${escapeHtml(page.business_name)}</h1>
    ${linksHtml || '<p style="text-align:center; color:rgba(243,240,234,0.5);">Noch keine Links hinterlegt.</p>'}
  </div>`;
}

async function handleHubPublicPage(request, env, slug) {
  const page = await env.DB.prepare(`SELECT * FROM hub_pages WHERE slug = ?`).bind(slug).first();
  if (!page || !page.published) {
    return new Response('Diese Seite ist nicht (mehr) verfügbar.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  const { results: links } = await env.DB.prepare(
    `SELECT description, label, url FROM hub_links WHERE page_id = ? ORDER BY sort_order`
  ).bind(page.id).all();

  return new Response(`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(page.business_name)}</title>
<style>${hubPageStyles(page.bg_color)}
  body{display:flex; justify-content:center; padding-bottom:40px;}
</style></head>
<body>
  ${renderHubBody(page, links)}
</body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
