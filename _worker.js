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
      if (method === 'PUT'  && path === '/api/stempel/settings') return handleStempelSettings(request, env, ctx);
      if (method === 'GET'  && path === '/api/stempel/customers') return handleStempelCustomers(request, env);
      if (method === 'POST' && path === '/api/stempel/upload-logo') return handleStempelUploadImage(request, env, { formField: 'logo', column: 'logo_key', prefix: 'stempel-logo', resultKey: 'logoUrl' }, ctx);
      if (method === 'POST' && path === '/api/stempel/upload-banner') return handleStempelUploadImage(request, env, { formField: 'banner', column: 'banner_key', prefix: 'stempel-banner', resultKey: 'bannerUrl' });
      if (method === 'POST' && path === '/api/stempel/remove-logo') return handleStempelRemoveImage(request, env, 'logo_key', ctx);
      if (method === 'POST' && path === '/api/stempel/remove-banner') return handleStempelRemoveImage(request, env, 'banner_key');
      if (method === 'GET'    && path === '/api/stempel/message') return handleStempelGetMessage(request, env);
      if (method === 'POST'   && path === '/api/stempel/message') return handleStempelSendMessage(request, env, ctx);
      if (method === 'DELETE' && path === '/api/stempel/message') return handleStempelEndMessage(request, env, ctx);
      if (method === 'GET'  && path === '/api/stempel/employees') return handleStempelListEmployees(request, env);
      if (method === 'POST' && path === '/api/stempel/employees') return handleStempelAddEmployee(request, env);
      const stempelEmpMatch = path.match(/^\/api\/stempel\/employees\/([^/]+)$/);
      if (method === 'DELETE' && stempelEmpMatch) return handleStempelDeleteEmployee(request, env, stempelEmpMatch[1]);
      if (method === 'POST' && path === '/api/stempel/checkout-subscription') return handleStempelCheckoutSubscription(request, env);
      if (method === 'POST' && path === '/api/stempel/checkout-card') return handleStempelCheckoutCard(request, env);
      if (method === 'POST' && path === '/webhook/stripe-stempel') return handleStempelStripeWebhook(request, env);

      const stempelTapMatch = path.match(/^\/s\/([^/]+)$/);
      if (method === 'GET' && stempelTapMatch) return handleStempelTap(request, env, stempelTapMatch[1], ctx);
      if (method === 'POST' && stempelTapMatch) return handleStempelTapSubmit(request, env, stempelTapMatch[1], ctx);
      const staffRedeemMatch = path.match(/^\/staff-redeem\/([^/]+)$/);
      if (method === 'GET' && staffRedeemMatch) return handleStaffRedeemPage(request, env, staffRedeemMatch[1]);
      const stripImageMatch = path.match(/^\/wallet\/strip\/([^/]+)\/(\d+)-([0-9a-z]+)\.png$/);
      if (method === 'GET' && stripImageMatch) return handleStampStripImage(request, env, stripImageMatch[1], stripImageMatch[2], stripImageMatch[3]);
      const googleWalletMatch = path.match(/^\/wallet\/google\/([^/]+)$/);
      if (method === 'GET' && googleWalletMatch) return handleGoogleWalletSave(request, env, googleWalletMatch[1]);
      if (path.startsWith(APPLE_WS_PREFIX)) return handleAppleWalletService(request, env, path.slice(APPLE_WS_PREFIX.length));
      const appleWalletMatch = path.match(/^\/wallet\/apple\/([^/]+)$/);
      if (method === 'GET' && appleWalletMatch) return handleAppleWalletPass(request, env, appleWalletMatch[1]);
      if (method === 'POST' && path === '/api/stempel/staff-redeem') return handleStaffRedeemSubmit(request, env, ctx);

      /* ── Admin: Stempel-Läden ── */
      if (method === 'GET'  && path === '/api/admin/stempel/shops') return handleAdminStempelShops(request, env);
      const adminAccessMatch = path.match(/^\/api\/admin\/stempel\/shops\/([^/]+)\/access$/);
      if (method === 'POST' && adminAccessMatch) return handleAdminStempelAccess(request, env, adminAccessMatch[1]);

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

  if (env.MAIL_FROM) {
    sendMail(env, parseSender(env.MAIL_FROM).email, 'Neue Visitenkarten-Registrierung: ' + u.email,
      'Neuer Nutzer registriert',
      `${u.email} hat sich gerade bei den Tapstern-Visitenkarten registriert und bestätigt.`,
      'Zum Admin-Bereich', new URL(request.url).origin + '/app.html'
    ).catch(() => {});
  }

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


/* ══ Zugang: 24-Stunden-Test, Abo, Admin-Entscheidung ══
   Nach der E-Mail-Bestätigung hat ein Laden 24 Stunden alles offen zum Testen und
   Gestalten. Danach bleibt ohne aktives Abo nur „Abo & Karten“ im Dashboard; Kartenlink,
   Stempeln, Personal-Scan und „Zu Wallet hinzufügen“ sind pausiert. Im Admin-Bereich
   (stempel-admin.html) kann ein Laden unabhängig davon freigeschaltet, gesperrt oder
   sein Test verlängert werden. Eigene Tabelle stempel_shop_access, damit stempel_shops
   unverändert bleibt; Läden von vor dieser Regel bekommen ihre 24 Stunden ab dem
   ersten Aufruf danach. */
const TRIAL_HOURS = 24;
let accessTableReady = false;

async function ensureAccessTable(env) {
  if (accessTableReady) return;
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS stempel_shop_access (
       shop_id TEXT PRIMARY KEY,
       trial_ends_at INTEGER NOT NULL,
       override TEXT,
       note TEXT,
       updated_at INTEGER
     )`
  ).run();
  accessTableReady = true;
}

/* Zugangs-Datensatz eines Ladens; fehlt er, beginnt jetzt der 24-Stunden-Test */
async function shopAccessRow(env, shopId) {
  await ensureAccessTable(env);
  let row = await env.DB.prepare('SELECT * FROM stempel_shop_access WHERE shop_id = ?').bind(shopId).first();
  if (!row) {
    const now = Math.floor(Date.now() / 1000);
    row = { shop_id: shopId, trial_ends_at: now + TRIAL_HOURS * 3600, override: null, note: null, updated_at: now };
    await env.DB.prepare('INSERT OR IGNORE INTO stempel_shop_access (shop_id, trial_ends_at, updated_at) VALUES (?, ?, ?)')
      .bind(shopId, row.trial_ends_at, now).run();
  }
  return row;
}

/* state: trial | subscribed | unlocked (Admin) | expired | locked (Admin) */
function accessStateOf(shop, row, now = Math.floor(Date.now() / 1000)) {
  const trialEndsAt = row?.trial_ends_at || null;
  if (row?.override === 'locked') return { state: 'locked', active: false, trialEndsAt };
  if (row?.override === 'unlocked') return { state: 'unlocked', active: true, trialEndsAt };
  if (shop.subscription_status === 'active') return { state: 'subscribed', active: true, trialEndsAt };
  if (!trialEndsAt || now < trialEndsAt) return { state: 'trial', active: true, trialEndsAt };
  return { state: 'expired', active: false, trialEndsAt };
}

async function shopAccess(env, shop) {
  return accessStateOf(shop, await shopAccessRow(env, shop.id));
}

/* Für Dashboard-Endpunkte, die nur mit aktivem Test oder Abo gehen */
async function requireActiveShop(env, request) {
  const shop = await currentShop(env, request);
  if (!shop) return { denied: json({ error: 'Nicht angemeldet' }, 401) };
  const access = await shopAccess(env, shop);
  if (!access.active) {
    return { denied: json({
      error: access.state === 'locked'
        ? 'Dein Konto ist gesperrt. Bitte melde dich beim Tapstern-Support.'
        : 'Deine Testphase ist abgelaufen. Schließe ein Abo ab, um weiterzumachen.',
      access,
    }, 402) };
  }
  return { shop, access };
}

/* Laden-Daten fürs Dashboard, ohne Geheimnisse, mit Zugangsstatus */
async function publicShop(env, shop) {
  const { password_hash, session_token_hash, verify_code_hash, ...safe } = shop;
  safe.access = await shopAccess(env, shop);
  return safe;
}

/* Kundenseite, wenn der Laden gerade nicht aktiv ist */
function inactiveShopResponse(shop, asJson) {
  const msg = `Die Stempelkarte von ${shop.name} ist gerade pausiert. Frag gern direkt im Laden nach.`;
  if (asJson) return json({ error: msg }, 403);
  return new Response(`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(shop.name)} — Stempelkarte pausiert</title>
<style>
  body{margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px;
    font-family:'Inter',system-ui,-apple-system,sans-serif; background:#14131a; color:#f3f0ea;}
  .box{max-width:340px; text-align:center; background:#211f29; border-radius:20px; padding:32px 26px;}
  h1{font-size:1.15rem; margin:0 0 10px;}
  p{color:#a39cad; font-size:0.9rem; line-height:1.5; margin:0;}
</style></head>
<body><div class="box"><h1>${escapeHtml(shop.name)}</h1><p>${escapeHtml(msg)}</p></div></body></html>`,
    { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

/* ── Admin: Läden verwalten (gleiches Login wie der Hub-Admin) ── */
async function handleAdminStempelShops(request, env) {
  if (!(await requireHubAdmin(request, env))) return json({ error: 'Nicht angemeldet' }, 401);
  await ensureAccessTable(env);
  const { results } = await env.DB.prepare(
    `SELECT s.id, s.slug, s.name, s.email, s.first_name, s.last_name, s.phone, s.branche, s.plan, s.billing_interval,
            s.subscription_status, s.verified, s.created_at, a.trial_ends_at, a.override, a.note,
            (SELECT COUNT(*) FROM stempel_customers c WHERE c.shop_id = s.id) AS customers
     FROM stempel_shops s LEFT JOIN stempel_shop_access a ON a.shop_id = s.id
     ORDER BY s.created_at DESC`
  ).all();
  const now = Math.floor(Date.now() / 1000);
  return json({ shops: (results || []).map(r => ({ ...r, access: accessStateOf(r, r.trial_ends_at ? r : null, now) })) });
}

/* POST /api/admin/stempel/shops/:id/access — { action: unlock | lock | auto | extend, days?, note? } */
async function handleAdminStempelAccess(request, env, shopId) {
  if (!(await requireHubAdmin(request, env))) return json({ error: 'Nicht angemeldet' }, 401);
  const shop = await env.DB.prepare('SELECT * FROM stempel_shops WHERE id = ?').bind(shopId).first();
  if (!shop) return json({ error: 'Laden nicht gefunden' }, 404);
  const data = await readJson(request);
  const action = str(data?.action);
  const row = await shopAccessRow(env, shop.id);
  const now = Math.floor(Date.now() / 1000);
  let { trial_ends_at: trialEndsAt, override } = row;

  if (action === 'unlock') override = 'unlocked';
  else if (action === 'lock') override = 'locked';
  else if (action === 'auto') override = null;
  else if (action === 'extend') {
    const days = Math.max(1, Math.min(365, parseInt(data?.days) || 1));
    trialEndsAt = Math.max(now, trialEndsAt) + days * 86400;
    if (override === 'locked') override = null; // wer verlängert, will den Laden wieder offen haben
  } else return json({ error: 'Unbekannte Aktion' }, 400);

  const note = data?.note !== undefined ? (str(data.note).slice(0, 500) || null) : row.note;
  await env.DB.prepare('UPDATE stempel_shop_access SET trial_ends_at = ?, override = ?, note = ?, updated_at = ? WHERE shop_id = ?')
    .bind(trialEndsAt, override, note, now, shop.id).run();
  return json({ success: true, access: accessStateOf(shop, { trial_ends_at: trialEndsAt, override }, now) });
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
  // 24-Stunden-Test beginnt mit der Bestätigung
  await ensureAccessTable(env);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    `INSERT INTO stempel_shop_access (shop_id, trial_ends_at, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(shop_id) DO UPDATE SET trial_ends_at = excluded.trial_ends_at, updated_at = excluded.updated_at`
  ).bind(shop.id, now + TRIAL_HOURS * 3600, now).run();

  if (env.MAIL_FROM) {
    const adminUrl = new URL(request.url).origin + '/stempel.html';
    sendMail(env, parseSender(env.MAIL_FROM).email, 'Neue Tapstempel-Registrierung: ' + shop.name,
      'Neuer Laden registriert',
      `${shop.name} (${shop.branche || 'keine Branche angegeben'}) hat sich gerade bei Tapstempel registriert und bestätigt. Ansprechpartner: ${[shop.first_name, shop.last_name].filter(Boolean).join(' ') || '–'}, Telefon: ${shop.phone || '–'}, E-Mail: ${email}.`,
      'Zum Dashboard', adminUrl
    ).catch(() => {});
  }

  const safe = await publicShop(env, { ...shop, verified: 1 });
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

  return json({ success: true, shop: await publicShop(env, shop) }, 200, stempelCookie(shop.id, token));
}

async function handleStempelMe(request, env) {
  const shop = await currentShop(env, request);
  if (!shop) return json({ error: 'Nicht angemeldet' }, 401);
  return json({ shop: await publicShop(env, shop) });
}

async function handleStempelSettings(request, env, ctx) {
  const { shop, denied } = await requireActiveShop(env, request);
  if (denied) return denied;
  const data = await request.json();

  const stampIcon = STAMP_ICON_IDS.includes(str(data.stamp_icon)) ? str(data.stamp_icon) : (shop.stamp_icon || 'circle');
  const bgPattern = BG_PATTERN_IDS.includes(str(data.bg_pattern)) ? str(data.bg_pattern) : (shop.bg_pattern || 'aurora');
  const accentColor = /^#[0-9a-fA-F]{6}$/.test(str(data.accent_color)) ? str(data.accent_color) : shop.accent_color;
  const cardBgColor = /^#[0-9a-fA-F]{6}$/.test(str(data.card_bg_color)) ? str(data.card_bg_color) : (shop.card_bg_color || '#14131a');
  const rewardThreshold = Math.max(1, parseInt(data.reward_threshold) || shop.reward_threshold);
  const rewardText = str(data.reward_text) || shop.reward_text;

  await env.DB.prepare(
    `UPDATE stempel_shops SET reward_threshold = ?, reward_text = ?, accent_color = ?, card_bg_color = ?, extra_link_url = ?, extra_link_label = ?, min_stamp_interval_minutes = ?, stamp_icon = ?, bg_pattern = ? WHERE id = ?`
  ).bind(
    rewardThreshold,
    rewardText,
    accentColor,
    cardBgColor,
    str(data.extra_link_url) || null,
    str(data.extra_link_label) || null,
    Math.max(10, parseInt(data.min_stamp_interval_minutes) || shop.min_stamp_interval_minutes),
    stampIcon,
    bgPattern,
    shop.id
  ).run();

  // Nur was auch auf der Wallet-Karte steht, löst ein Update aller Karten aus
  const walletChanged = rewardThreshold !== shop.reward_threshold || rewardText !== shop.reward_text
    || accentColor !== shop.accent_color || cardBgColor !== shop.card_bg_color || stampIcon !== shop.stamp_icon;
  if (walletChanged) {
    await markShopWalletChanged(env, shop.id, ctx);
    syncGoogleWalletShop(env, request, shop.id, ctx);
  }

  return json({ success: true });
}

/* Logo/Banner-Uploads fürs Stempel-Profil — nutzt denselben PHOTOS-Bucket wie die Karten-App */
async function handleStempelUploadImage(request, env, opts, ctx) {
  let form;
  try { form = await request.formData(); } catch (e) { return json({ error: 'Ungültige Anfrage' }, 400); }

  const { shop, denied } = await requireActiveShop(env, request);
  if (denied) return denied;

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
  if (opts.column === 'logo_key') { // Logo steht auf der Wallet-Karte
    await markShopWalletChanged(env, shop.id, ctx);
    syncGoogleWalletShop(env, request, shop.id, ctx);
  }
  return json({ success: true, [opts.resultKey]: `/photo/${key}` });
}

async function handleStempelRemoveImage(request, env, column, ctx) {
  const { shop, denied } = await requireActiveShop(env, request);
  if (denied) return denied;
  if (shop[column]) { try { await env.PHOTOS.delete(shop[column]); } catch (e) {} }
  await env.DB.prepare(`UPDATE stempel_shops SET ${column} = NULL WHERE id = ?`).bind(shop.id).run();
  if (column === 'logo_key') {
    await markShopWalletChanged(env, shop.id, ctx);
    syncGoogleWalletShop(env, request, shop.id, ctx);
  }
  return json({ success: true });
}

async function handleStempelCustomers(request, env) {
  const { shop, denied } = await requireActiveShop(env, request);
  if (denied) return denied;
  const { results } = await env.DB.prepare(
    `SELECT id, card_code, stamps, redeemed_count, created_at, last_stamp_at FROM stempel_customers WHERE shop_id = ? ORDER BY last_stamp_at DESC LIMIT 200`
  ).bind(shop.id).all();
  return json({ customers: results });
}

/* Der Kern: NFC-Tap an der Laden-Karte, GET /s/:slug */
/* Gerät aus dem Cookie wiedererkennen — der Cookie-Wert ist der device_token */
function deviceTokenOf(request) {
  const cookieMatch = (request.headers.get('cookie') || '').match(/(?:^|;\s*)stempel_device=([^;]+)/);
  return cookieMatch ? cookieMatch[1] : null;
}

function deviceCookie(token) {
  return `stempel_device=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000`;
}

function customerOfDevice(env, shop, deviceToken) {
  if (!deviceToken) return Promise.resolve(null);
  return env.DB.prepare('SELECT * FROM stempel_customers WHERE device_token = ? AND shop_id = ?')
    .bind(deviceToken, shop.id).first();
}

/* Neue Karte anlegen — inklusive erstem Stempel und eigener Karten-ID */
async function createCustomerWithFirstStamp(env, shop) {
  const deviceToken = crypto.randomUUID();
  const redeemToken = crypto.randomUUID();
  const cardCode = await uniqueCardCode(env);
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO stempel_customers (id, shop_id, device_token, redeem_token, card_code, stamps, last_stamp_at) VALUES (?, ?, ?, ?, ?, 1, datetime('now'))`
  ).bind(id, shop.id, deviceToken, redeemToken, cardCode).run();
  await env.DB.prepare(`INSERT INTO stempel_events (id, customer_id, shop_id) VALUES (?, ?, ?)`)
    .bind(crypto.randomUUID(), id, shop.id).run();
  const customer = { id, shop_id: shop.id, stamps: 1, redeemed_count: 0, device_token: deviceToken, redeem_token: redeemToken, card_code: cardCode };
  return { customer, deviceToken };
}

/* Stempel für ein bekanntes Gerät — Cooldown und Belohnungs-Reset stecken in applyStampLogic */
async function grantStampToDevice(env, request, shop, customer, ctx) {
  if (!customer.redeem_token) {
    customer.redeem_token = crypto.randomUUID();
    await env.DB.prepare(`UPDATE stempel_customers SET redeem_token = ? WHERE id = ?`).bind(customer.redeem_token, customer.id).run();
  }
  await ensureCardCode(env, customer);
  const result = await applyStampLogic(env, customer, shop, null, request, ctx);
  return { customer: result.customer, cooldownHit: result.cooldownHit };
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
    ctx.waitUntil(
      pushAppleWalletUpdate(env, customer).catch(e => console.error('Apple Wallet Update fehlgeschlagen:', e))
    );
  }

  return { customer, cooldownHit };
}

async function grantStampToCustomer(env, customer, shop, employeeId, request, ctx) {
  await ensureCardCode(env, customer);
  const result = await applyStampLogic(env, customer, shop, employeeId, request, ctx);
  return { customer: result.customer, isNew: false, cooldownHit: result.cooldownHit };
}

/* GET /s/:slug — kennt das Gerät die Karte schon, gibt es direkt den Stempel.
   Sonst erst die Auswahl: neue Karte starten oder vorhandene wiederherstellen. */
async function handleStempelTap(request, env, slug, ctx) {
  const shop = await env.DB.prepare('SELECT * FROM stempel_shops WHERE slug = ?').bind(slug).first();
  if (!shop) return new Response('Laden nicht gefunden', { status: 404 });
  if (!(await shopAccess(env, shop)).active) return inactiveShopResponse(shop);

  const customer = await customerOfDevice(env, shop, deviceTokenOf(request));
  if (!customer) {
    return new Response(renderStempelStartPage(shop, {}), htmlHeaders());
  }

  const { cooldownHit } = await grantStampToDevice(env, request, shop, customer, ctx);
  return cardResponse(request, env, shop, customer, { isNew: false, cooldownHit });
}

/* POST /s/:slug — Antwort auf die Auswahl aus der Startansicht */
async function handleStempelTapSubmit(request, env, slug, ctx) {
  const shop = await env.DB.prepare('SELECT * FROM stempel_shops WHERE slug = ?').bind(slug).first();
  if (!shop) return new Response('Laden nicht gefunden', { status: 404 });
  if (!(await shopAccess(env, shop)).active) return inactiveShopResponse(shop);

  const form = await request.formData().catch(() => null);
  const action = str(form?.get('action'));

  /* Gerät hat inzwischen doch eine Karte (z. B. zweiter Tab) — dann normal stempeln */
  const known = await customerOfDevice(env, shop, deviceTokenOf(request));
  if (known) {
    const { cooldownHit } = await grantStampToDevice(env, request, shop, known, ctx);
    return cardResponse(request, env, shop, known, { isNew: false, cooldownHit });
  }

  if (action === 'restore') return handleStempelRestore(request, env, shop, form, ctx);
  if (action !== 'new') return new Response(renderStempelStartPage(shop, {}), htmlHeaders(400));

  const { customer, deviceToken } = await createCustomerWithFirstStamp(env, shop);
  return cardResponse(request, env, shop, customer, { isNew: true, cooldownHit: false }, deviceToken);
}

/* Karte per Karten-ID zurückholen — reiner Besitznachweis, kein Konto.
   Gegen Durchprobieren greift dieselbe Sperre wie beim Login (login_locks). */
async function handleStempelRestore(request, env, shop, form, ctx) {
  const code = normalizeCardCode(form?.get('code'));
  const lockKey = 'cardcode:' + (request.headers.get('CF-Connecting-IP') || 'unbekannt');

  const gate = await checkLock(env, lockKey);
  if (gate) return new Response(renderStempelStartPage(shop, { error: gate, showRestore: true }), htmlHeaders(429));

  if (code.length !== CARD_CODE_LENGTH) {
    await noteFail(env, lockKey);
    return new Response(renderStempelStartPage(shop, {
      error: `Die Karten-ID besteht aus ${CARD_CODE_LENGTH} Zeichen. Bitte prüf deine Eingabe.`,
      showRestore: true, code,
    }), htmlHeaders(400));
  }

  const customer = await env.DB.prepare('SELECT * FROM stempel_customers WHERE card_code = ? AND shop_id = ?')
    .bind(code, shop.id).first();
  if (!customer) {
    await noteFail(env, lockKey);
    return new Response(renderStempelStartPage(shop, {
      error: 'Zu dieser Karten-ID gibt es hier keine Karte. Tipp sie nochmal ein oder starte eine neue.',
      showRestore: true, code,
    }), htmlHeaders(404));
  }

  await clearFails(env, lockKey);
  /* Das Gerät hängt sich an den bestehenden device_token — künftige Taps
     landen damit wieder ganz normal auf dieser Karte. */
  const { cooldownHit } = await grantStampToDevice(env, request, shop, customer, ctx);
  return cardResponse(request, env, shop, customer, { isNew: false, cooldownHit, restored: true }, customer.device_token);
}

function htmlHeaders(status) {
  return { status: status || 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } };
}

async function cardResponse(request, env, shop, customer, state, setDeviceToken) {
  const headers = new Headers({ 'Content-Type': 'text/html; charset=utf-8' });
  if (setDeviceToken) headers.append('Set-Cookie', deviceCookie(setDeviceToken));
  const rewardReached = customer.stamps >= shop.reward_threshold;
  const news = await currentShopMessage(env, shop.id);
  const html = renderStempelTapPage(shop, customer, { ...state, rewardReached, platform: device(request), news }, new URL(request.url).origin);
  return new Response(html, { headers });
}

/* ── Mitarbeiter-Verwaltung ── */
async function handleStempelListEmployees(request, env) {
  const { shop, denied } = await requireActiveShop(env, request);
  if (denied) return denied;
  const { results } = await env.DB.prepare(
    `SELECT id, name, created_at FROM stempel_employees WHERE shop_id = ? ORDER BY created_at`
  ).bind(shop.id).all();
  return json({ employees: results, plan: shop.plan || 'basic' });
}

async function handleStempelAddEmployee(request, env) {
  const { shop, denied } = await requireActiveShop(env, request);
  if (denied) return denied;
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
  const { shop, denied } = await requireActiveShop(env, request);
  if (denied) return denied;
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
  const { state } = await shopAccess(env, shop);
  if (state !== 'subscribed' && state !== 'unlocked') { // im Test noch nicht, vom Admin freigeschaltet schon
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
    accountId: customer.card_code || customer.id, // Google zeigt das als Mitgliedsnummer an
    accountName: shop.name,
    loyaltyPoints: {
      label: 'Stempel',
      balance: { string: `${customer.stamps}/${shop.reward_threshold}` },
    },
    textModulesData: [
      { id: 'reward_info', header: 'Deine Belohnung', body: buildRewardMessage(shop, customer) },
      ...(customer.card_code ? [{ id: 'card_code', header: `Karten-ID: ${customer.card_code}`, body: 'Mit dieser ID holst du die Karte auf einem neuen Handy zurück.' }] : []),
    ],
    barcode: {
      type: 'QR_CODE',
      value: `${origin}/staff-redeem/${customer.redeem_token}`,
      alternateText: customer.card_code ? `Karten-ID ${customer.card_code}` : 'Für Personal',
    },
    hexBackgroundColor: shop.card_bg_color || '#14131a',
    // Stempel wie in Apple Wallet als Bild quer über die Karte
    heroImage: {
      sourceUri: { uri: googleStripUrl(origin, shop, customer.stamps) },
      contentDescription: { defaultValue: { language: 'de', value: `${Math.min(customer.stamps, shop.reward_threshold)} von ${shop.reward_threshold} Stempeln` } },
    },
    // Banner des Ladens rutscht in die Detailansicht
    imageModulesData: shop.banner_key ? [{ id: 'banner', mainImage: { sourceUri: { uri: `${origin}/photo/${shop.banner_key}` } } }] : [],
  };
}

async function handleGoogleWalletSave(request, env, slug) {
  if (!env.GOOGLE_WALLET_ISSUER_ID || !env.GOOGLE_WALLET_SERVICE_ACCOUNT || !env.GOOGLE_WALLET_PRIVATE_KEY) {
    return new Response('Google Wallet ist noch nicht eingerichtet.', { status: 500 });
  }
  const shop = await env.DB.prepare('SELECT * FROM stempel_shops WHERE slug = ?').bind(slug).first();
  if (!shop) return new Response('Laden nicht gefunden', { status: 404 });
  if (!(await shopAccess(env, shop)).active) return inactiveShopResponse(shop);

  const cookieMatch = (request.headers.get('cookie') || '').match(/(?:^|;\s*)stempel_device=([^;]+)/);
  const customer = cookieMatch
    ? await env.DB.prepare('SELECT * FROM stempel_customers WHERE device_token = ? AND shop_id = ?').bind(cookieMatch[1], shop.id).first()
    : null;
  if (!customer) return new Response('Keine Stempelkarte gefunden — erst antippen oder QR-Code beitreten.', { status: 404 });
  await ensureCardCode(env, customer);

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

/* ── Apple Wallet ──
   Braucht zwei Secrets (wrangler secret put):
   APPLE_PASS_CERT — Pass-Type-ID-Zertifikat als PEM ("BEGIN CERTIFICATE")
   APPLE_PASS_KEY  — der zugehörige private Schlüssel als PEM (PKCS#8, "BEGIN PRIVATE KEY")
   Das Apple-WWDR-G4-Zwischenzertifikat ist öffentlich und steht direkt im Code.
   Der Pass wird komplett hier gebaut: pass.json + Bilder, manifest.json (SHA-1),
   signature (PKCS#7 detached, SHA-256) und ZIP — ohne externe Bibliotheken. */

const APPLE_PASS_TYPE_ID = 'pass.de.tapstern.stempelkarte';
const APPLE_TEAM_ID = 'P37HGXF6Y3';
const APPLE_PASS_IMAGES = ['icon.png', 'icon@2x.png', 'icon@3x.png', 'logo.png', 'logo@2x.png', 'logo@3x.png'];

// Apple Worldwide Developer Relations CA - G4, gültig bis 10.12.2030
// SHA-256: EA:47:57:88:55:38:DD:8C:B5:9F:F4:55:6F:67:60:87:D8:3C:85:E7:09:02:C1:22:E4:2C:08:08:B5:BC:E1:4C
const APPLE_WWDR_G4_PEM = `-----BEGIN CERTIFICATE-----
MIIEVTCCAz2gAwIBAgIUE9x3lVJx5T3GMujM/+Uh88zFztIwDQYJKoZIhvcNAQEL
BQAwYjELMAkGA1UEBhMCVVMxEzARBgNVBAoTCkFwcGxlIEluYy4xJjAkBgNVBAsT
HUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MRYwFAYDVQQDEw1BcHBsZSBS
b290IENBMB4XDTIwMTIxNjE5MzYwNFoXDTMwMTIxMDAwMDAwMFowdTFEMEIGA1UE
Aww7QXBwbGUgV29ybGR3aWRlIERldmVsb3BlciBSZWxhdGlvbnMgQ2VydGlmaWNh
dGlvbiBBdXRob3JpdHkxCzAJBgNVBAsMAkc0MRMwEQYDVQQKDApBcHBsZSBJbmMu
MQswCQYDVQQGEwJVUzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANAf
eKp6JzKwRl/nF3bYoJ0OKY6tPTKlxGs3yeRBkWq3eXFdDDQEYHX3rkOPR8SGHgjo
v9Y5Ui8eZ/xx8YJtPH4GUnadLLzVQ+mxtLxAOnhRXVGhJeG+bJGdayFZGEHVD41t
QSo5SiHgkJ9OE0/QjJoyuNdqkh4laqQyziIZhQVg3AJK8lrrd3kCfcCXVGySjnYB
5kaP5eYq+6KwrRitbTOFOCOL6oqW7Z+uZk+jDEAnbZXQYojZQykn/e2kv1MukBVl
PNkuYmQzHWxq3Y4hqqRfFcYw7V/mjDaSlLfcOQIA+2SM1AyB8j/VNJeHdSbCb64D
YyEMe9QbsWLFApy9/a8CAwEAAaOB7zCB7DASBgNVHRMBAf8ECDAGAQH/AgEAMB8G
A1UdIwQYMBaAFCvQaUeUdgn+9GuNLkCm90dNfwheMEQGCCsGAQUFBwEBBDgwNjA0
BggrBgEFBQcwAYYoaHR0cDovL29jc3AuYXBwbGUuY29tL29jc3AwMy1hcHBsZXJv
b3RjYTAuBgNVHR8EJzAlMCOgIaAfhh1odHRwOi8vY3JsLmFwcGxlLmNvbS9yb290
LmNybDAdBgNVHQ4EFgQUW9n6HeeaGgujmXYiUIY+kchbd6gwDgYDVR0PAQH/BAQD
AgEGMBAGCiqGSIb3Y2QGAgEEAgUAMA0GCSqGSIb3DQEBCwUAA4IBAQA/Vj2e5bbD
eeZFIGi9v3OLLBKeAuOugCKMBB7DUshwgKj7zqew1UJEggOCTwb8O0kU+9h0UoWv
p50h5wESA5/NQFjQAde/MoMrU1goPO6cn1R2PWQnxn6NHThNLa6B5rmluJyJlPef
x4elUWY0GzlxOSTjh2fvpbFoe4zuPfeutnvi0v/fYcZqdUmVIkSoBPyUuAsuORFJ
EtHlgepZAE9bPFo22noicwkJac3AfOriJP6YRLj477JxPxpd1F1+M02cHSS+APCQ
A1iZQT0xWmJArzmoUUOSqwSonMJNsUvSq3xKX+udO7xPiEAGE/+QF4oIRynoYpgp
pU8RBWk6z/Kf
-----END CERTIFICATE-----`;

/* GET /wallet/apple/:slug — liefert die Stempelkarte des Geräts als .pkpass */
async function handleAppleWalletPass(request, env, slug) {
  const text = (msg, status) => new Response(msg, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  if (!env.APPLE_PASS_CERT || !env.APPLE_PASS_KEY) return text('Apple Wallet ist noch nicht eingerichtet.', 500);
  const shop = await env.DB.prepare('SELECT * FROM stempel_shops WHERE slug = ?').bind(slug).first();
  if (!shop) return text('Laden nicht gefunden', 404);
  if (!(await shopAccess(env, shop)).active) return inactiveShopResponse(shop);

  const customer = await customerOfDevice(env, shop, deviceTokenOf(request));
  if (!customer) return text('Keine Stempelkarte gefunden — erst antippen oder QR-Code beitreten.', 404);
  await ensureCardCode(env, customer);

  try {
    const origin = new URL(request.url).origin;
    const files = await appleWalletFiles(env, origin, shop, customer);
    const pkpass = await buildPkpass(files, env.APPLE_PASS_CERT, env.APPLE_PASS_KEY);
    return new Response(pkpass, {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="${shop.slug}.pkpass"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return text('Apple Wallet Karte konnte nicht erstellt werden: ' + e.message, 500);
  }
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgb(${(n >> 16) & 0xff}, ${(n >> 8) & 0xff}, ${n & 0xff})`;
}

/* Inhalt der Karte — gleiche Farben wie die Kartenseite (renderStempelTapPage).
   Die Stempel selbst zeigt das Bild strip.png; darunter im Nebenfeld der
   Belohnungssatz (Beschriftung steht dort über dem Wert). */
function buildApplePassJson(origin, shop, customer, authToken, message) {
  const total = shop.reward_threshold;
  const remaining = Math.max(0, total - customer.stamps);
  const bg = shop.card_bg_color || '#14131a';
  const accent = shop.accent_color || '#6366f1';
  const isLightBg = luminanceOf(bg) > 0.55;

  return {
    formatVersion: 1,
    passTypeIdentifier: APPLE_PASS_TYPE_ID,
    teamIdentifier: APPLE_TEAM_ID,
    serialNumber: customer.id,
    organizationName: shop.name,
    description: `Stempelkarte ${shop.name}`,
    logoText: shop.name,
    foregroundColor: hexToRgb(isLightBg ? '#15141a' : '#f6f3ee'),
    backgroundColor: hexToRgb(bg),
    labelColor: hexToRgb(isLightBg ? mixHex(accent, '#000000', 0.18) : mixHex(accent, '#ffffff', 0.18)),
    sharingProhibited: true,
    webServiceURL: `${origin}/wallet/apple/ws`,
    authenticationToken: authToken,
    storeCard: {
      headerFields: [
        { key: 'stamps', label: 'STEMPEL', value: `${Math.min(customer.stamps, total)}/${total}` },
      ],
      // Kein Hauptfeld: dessen Text läge über dem Stempel-Streifen (strip.png)
      secondaryFields: [
        { key: 'reward', label: remaining === 0 ? 'BELOHNUNG BEREIT' : `NOCH ${remaining} STEMPEL BIS`, value: shop.reward_text || '' },
      ],
      backFields: [
        // Immer vorhanden, damit iOS eine Änderung erkennt. changeMessage nur bei aktiver
        // Nachricht: dann wird der neue Text zur Mitteilung — das Beenden bleibt still.
        {
          key: 'news', label: `Neuigkeiten von ${shop.name}`,
          value: message ? message.text : 'Aktuell keine Neuigkeiten.',
          ...(message ? { changeMessage: '%@' } : {}),
        },
        { key: 'cardcode', label: 'Karten-ID', value: `${customer.card_code || ''}\nMit dieser ID holst du die Karte auf einem neuen Handy zurück.` },
        { key: 'redeemed', label: 'Eingelöste Belohnungen', value: String(customer.redeemed_count || 0) },
        { key: 'asof', label: 'Stand', value: new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }) },
        { key: 'web', label: 'Treueprogramm von', value: 'https://tapstern.de' },
      ],
    },
    ...(customer.redeem_token ? {
      barcodes: [{
        format: 'PKBarcodeFormatQR',
        message: `${origin}/staff-redeem/${customer.redeem_token}`,
        messageEncoding: 'iso-8859-1',
        altText: customer.card_code ? `Karten-ID ${customer.card_code}` : 'Für Personal',
      }],
    } : {}),
  };
}

/* Alle Dateien des Passes außer manifest.json und signature.
   Icon/Logo kommen aus /wallet/ (statische Dateien); hat der Laden ein PNG-Logo,
   ersetzt es das Tapstern-Logo (Wallet zeigt nur PNG zuverlässig an). */
async function appleWalletFiles(env, origin, shop, customer) {
  const authToken = await appleAuthToken(env, customer.id);
  const message = await currentShopMessage(env, shop.id);
  const files = { 'pass.json': new TextEncoder().encode(JSON.stringify(buildApplePassJson(origin, shop, customer, authToken, message))) };

  let shopLogo = null;
  if (shop.logo_key) {
    const obj = await env.PHOTOS.get(shop.logo_key);
    const bytes = obj ? new Uint8Array(await obj.arrayBuffer()) : null;
    const isPng = bytes && bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    if (isPng) shopLogo = bytes;
  }

  for (const name of APPLE_PASS_IMAGES) {
    if (shopLogo && name.startsWith('logo')) continue;
    const res = await env.ASSETS.fetch(new Request(`${origin}/wallet/${name}`));
    if (!res.ok) throw new Error(`Bild ${name} fehlt (${res.status})`);
    files[name] = new Uint8Array(await res.arrayBuffer());
  }
  if (shopLogo) files['logo.png'] = shopLogo;
  Object.assign(files, await stampStripFiles(env, origin, shop, customer));
  return files;
}

/* ── Stempel-Streifen (strip.png) ──
   Wallet kennt kein Stempelraster — Anbieter zeichnen die Stempel deshalb als
   Bild in den Streifen unter dem Kopf der Karte. Das Raster folgt der
   Kartenseite (stampColumns, gefüllte Kachel mit Akzentring, leere ausgegraut).
   Die farbigen Icons liegen vorgerendert unter /wallet/stamps/<id>.png (128 px,
   RGBA) — erzeugt aus STAMP_ICON_SPRITE; "circle" ist dort eine schwarze Maske,
   die hier mit der Akzentfarbe eingefärbt wird. */
const STRIP_W = 375, STRIP_H = 144; // Punkte, Streifen einer storeCard

async function streamBytes(data, transform) {
  return new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(transform)).arrayBuffer());
}

/* Nur 8-Bit-RGBA ohne Interlacing — genau so liegen die Icons im Repo */
async function decodePng(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const idat = [];
  let w = 0, h = 0;
  for (let o = 8; o < bytes.length;) {
    const len = dv.getUint32(o);
    const type = String.fromCharCode(...bytes.subarray(o + 4, o + 8));
    if (type === 'IHDR') {
      w = dv.getUint32(o + 8); h = dv.getUint32(o + 12);
      if (bytes[o + 16] !== 8 || bytes[o + 17] !== 6 || bytes[o + 20] !== 0) throw new Error('PNG-Format nicht unterstützt');
    } else if (type === 'IDAT') idat.push(bytes.subarray(o + 8, o + 8 + len));
    else if (type === 'IEND') break;
    o += 12 + len;
  }
  const raw = await streamBytes(concatBytes(idat), new DecompressionStream('deflate'));
  const stride = w * 4, px = new Uint8Array(stride * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, row = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? px[row + x - 4] : 0, b = y > 0 ? px[row - stride + x] : 0, c = x >= 4 && y > 0 ? px[row - stride + x - 4] : 0;
      let v = raw[src + x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[row + x] = v & 0xff;
    }
  }
  return { w, h, px };
}

async function encodePngRgb(rgb, w, h) {
  const raw = new Uint8Array((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * (w * 3 + 1) + 1);
  const chunk = (type, data) => {
    const body = concatBytes([new TextEncoder().encode(type), data]);
    const out = new Uint8Array(body.length + 8), dv = new DataView(out.buffer);
    dv.setUint32(0, data.length); out.set(body, 4); dv.setUint32(body.length + 4, crc32(body));
    return out;
  };
  const ihdr = new Uint8Array(13), hv = new DataView(ihdr.buffer);
  hv.setUint32(0, w); hv.setUint32(4, h); ihdr[8] = 8; ihdr[9] = 2; // 8 Bit, RGB
  return concatBytes([
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', await streamBytes(raw, new CompressionStream('deflate'))),
    chunk('IEND', new Uint8Array(0)),
  ]);
}

function rgbOf(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/* Spaltenzahl, bei der die Kacheln im Streifen am größten werden (bei Gleichstand weniger Zeilen) */
function stripLayout(total, ptW = STRIP_W, ptH = STRIP_H) {
  const padX = 16, padY = 14, gap = 10;
  let best = null;
  for (let cols = 1; cols <= total; cols++) {
    const rows = Math.ceil(total / cols);
    const d = Math.min(58, (ptW - 2 * padX - (cols - 1) * gap) / cols, (ptH - 2 * padY - (rows - 1) * gap) / rows);
    if (!best || d > best.d + 0.01) best = { cols, rows, d, gap };
  }
  return best;
}

/* Zeichnet den Streifen in Pixeln (Punkte × scale) und gibt RGB-Bytes zurück.
   Kachelform und skaliertes Icon werden einmal berechnet und für jede Kachel kopiert. */
function drawStampStrip(shop, customer, icon, scale, ptW = STRIP_W, ptH = STRIP_H) {
  const bg = shop.card_bg_color || '#14131a';
  const accent = shop.accent_color || '#6366f1';
  const isLightBg = luminanceOf(bg) > 0.55;
  const toward = isLightBg ? '#000000' : '#ffffff';
  const tileEmpty = rgbOf(mixHex(bg, toward, isLightBg ? 0.07 : 0.06));
  const fillHi = rgbOf(isLightBg ? mixHex(bg, '#ffffff', 0.95) : mixHex(bg, '#ffffff', 0.20));
  const fillLo = rgbOf(isLightBg ? mixHex(bg, '#ffffff', 0.70) : mixHex(bg, '#ffffff', 0.09));
  const emptyLine = rgbOf(mixHex(bg, accent, 0.42));
  const acc = rgbOf(accent);
  const tint = !STAMP_ICON_IDS.includes(shop.stamp_icon) || shop.stamp_icon === 'circle';

  const W = Math.round(ptW * scale), H = Math.round(ptH * scale);
  const img = new Uint8Array(W * H * 3);
  const bgc = rgbOf(bg);
  for (let i = 0; i < img.length; i += 3) { img[i] = bgc[0]; img[i + 1] = bgc[1]; img[i + 2] = bgc[2]; }

  const total = shop.reward_threshold;
  const { cols, rows, d, gap } = stripLayout(total, ptW, ptH);
  const x0 = (ptW - (cols * d + (cols - 1) * gap)) / 2;
  const y0 = (ptH - (rows * d + (rows - 1) * gap)) / 2;

  // Kachelform: Deckung von Fläche und Ring, einmal für alle Kacheln
  const size = Math.ceil(d * scale) + 2, r = d * scale / 2, c0 = r + 1, line = 1.6 * scale;
  const cover = new Float32Array(size * size), ring = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = x + 0.5 - c0, dy = y + 0.5 - c0, dist = Math.sqrt(dx * dx + dy * dy);
    const outer = Math.min(1, Math.max(0, r - dist + 0.5));
    cover[y * size + x] = outer;
    ring[y * size + x] = outer - Math.min(1, Math.max(0, r - line - dist + 0.5));
  }

  // Icon: 70 % der Kachel, einmal per Box-Filter verkleinert (Farbe + Deckung)
  const is = Math.round(d * scale * 0.7), io = Math.round(c0 - is / 2);
  const ic = new Float32Array(is * is * 4);
  const f = icon.w / is, n = Math.max(1, Math.ceil(f));
  for (let y = 0; y < is; y++) for (let x = 0; x < is; x++) {
    let sr = 0, sg = 0, sb = 0, sa = 0;
    for (let v = 0; v < n; v++) {
      const sy = Math.min(icon.h - 1, Math.floor((y + (v + 0.5) / n) * f));
      for (let u = 0; u < n; u++) {
        const sx = Math.min(icon.w - 1, Math.floor((x + (u + 0.5) / n) * f));
        const p = (sy * icon.w + sx) * 4, a = icon.px[p + 3] / 255;
        sr += icon.px[p] * a; sg += icon.px[p + 1] * a; sb += icon.px[p + 2] * a; sa += a;
      }
    }
    const o = (y * is + x) * 4;
    if (sa <= 0) continue;
    let cr = sr / sa, cg = sg / sa, cb = sb / sa;
    if (tint) { cr = acc[0] + (255 - acc[0]) * cr / 255; cg = acc[1] + (255 - acc[1]) * cg / 255; cb = acc[2] + (255 - acc[2]) * cb / 255; }
    ic[o] = cr; ic[o + 1] = cg; ic[o + 2] = cb; ic[o + 3] = sa / (n * n);
  }

  for (let k = 0; k < total; k++) {
    const filled = k < customer.stamps;
    const tx = Math.round((x0 + (k % cols) * (d + gap)) * scale) - 1;
    const ty = Math.round((y0 + Math.floor(k / cols) * (d + gap)) * scale) - 1;
    const rc = filled ? acc : emptyLine, ra = filled ? 0.85 : 1;
    for (let y = 0; y < size; y++) {
      const py = ty + y;
      if (py < 0 || py >= H) continue;
      const t = Math.min(1, Math.max(0, (y - 1) / (2 * r)));
      const fr = filled ? fillHi[0] + (fillLo[0] - fillHi[0]) * t : tileEmpty[0];
      const fg = filled ? fillHi[1] + (fillLo[1] - fillHi[1]) * t : tileEmpty[1];
      const fb = filled ? fillHi[2] + (fillLo[2] - fillHi[2]) * t : tileEmpty[2];
      for (let x = 0; x < size; x++) {
        const px = tx + x;
        if (px < 0 || px >= W) continue;
        const q = y * size + x, i = (py * W + px) * 3;
        let a = cover[q];
        if (a > 0) { img[i] += (fr - img[i]) * a; img[i + 1] += (fg - img[i + 1]) * a; img[i + 2] += (fb - img[i + 2]) * a; }
        a = ring[q] * ra;
        if (a > 0) { img[i] += (rc[0] - img[i]) * a; img[i + 1] += (rc[1] - img[i + 1]) * a; img[i + 2] += (rc[2] - img[i + 2]) * a; }
        const ix = x - io, iy = y - io;
        if (ix < 0 || iy < 0 || ix >= is || iy >= is) continue;
        const o = (iy * is + ix) * 4;
        a = ic[o + 3];
        if (a <= 0) continue;
        let cr = ic[o], cg = ic[o + 1], cb = ic[o + 2];
        if (!filled) { cr = cg = cb = 0.2126 * cr + 0.7152 * cg + 0.0722 * cb; a *= 0.32; } // leer: grau + blass wie auf der Webseite
        img[i] += (cr - img[i]) * a; img[i + 1] += (cg - img[i + 1]) * a; img[i + 2] += (cb - img[i + 2]) * a;
      }
    }
  }
  return { rgb: img, w: W, h: H };
}

/* Streifen hängen nur vom Laden-Design und vom Stempelstand ab — alle Kunden mit
   gleichem Stand bekommen dasselbe Bild. Deshalb liegen fertige Streifen in R2
   und werden pro Kombination nur einmal gezeichnet. */
const STRIP_VERSION = 1; // erhöhen, wenn sich das Aussehen ändert
const STRIP_SCALES = [['strip.png', 1], ['strip@2x.png', 2], ['strip@3x.png', 3]];

function stampIconId(shop) {
  return STAMP_ICON_IDS.includes(shop.stamp_icon) ? shop.stamp_icon : 'circle';
}

async function loadStampIcon(env, origin, id) {
  const res = await env.ASSETS.fetch(new Request(`${origin}/wallet/stamps/${id}.png`));
  if (!res.ok) throw new Error(`Stempel-Icon ${id} fehlt (${res.status})`);
  return decodePng(new Uint8Array(await res.arrayBuffer()));
}

async function stampStripFiles(env, origin, shop, customer) {
  const id = stampIconId(shop);
  const stamps = Math.min(customer.stamps, shop.reward_threshold);
  const key = 'wallet-strip/' + await sha256(JSON.stringify([STRIP_VERSION, shop.card_bg_color || '', shop.accent_color || '', id, shop.reward_threshold, stamps]));
  const files = {};

  try {
    const cached = await Promise.all(STRIP_SCALES.map(([, s]) => env.PHOTOS.get(`${key}@${s}x.png`)));
    if (cached.every(Boolean)) {
      for (let j = 0; j < STRIP_SCALES.length; j++) files[STRIP_SCALES[j][0]] = new Uint8Array(await cached[j].arrayBuffer());
      return files;
    }
  } catch (e) { /* Cache ist optional — dann eben neu zeichnen */ }

  const icon = await loadStampIcon(env, origin, id);
  for (const [name, scale] of STRIP_SCALES) {
    const { rgb, w, h } = drawStampStrip(shop, { stamps }, icon, scale);
    files[name] = await encodePngRgb(rgb, w, h);
    try {
      await env.PHOTOS.put(`${key}@${scale}x.png`, files[name], { httpMetadata: { contentType: 'image/png' } });
    } catch (e) { console.error('Stempel-Streifen nicht gecacht:', e); }
  }
  return files;
}


/* ── Stempel-Bild für Google Wallet ──
   Google zeigt quer über die Karte ein "Hero Image" (empfohlen 1032 × 336 px) und
   lädt es selbst über eine URL. Stempelstand und Design stecken in der URL, damit
   Google nach jedem Stempel bzw. jeder Design-Änderung das neue Bild holt. */
const GOOGLE_STRIP_PT_H = 122, GOOGLE_STRIP_W = 1032; // 375 × 122 Punkte → 1032 × 336 px

/* Kurzer, synchroner Fingerabdruck des Designs (FNV-1a) für die Bild-URL */
function stripDesignHash(shop) {
  const text = JSON.stringify([STRIP_VERSION, shop.card_bg_color || '', shop.accent_color || '', stampIconId(shop), shop.reward_threshold]);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}

function googleStripUrl(origin, shop, stamps) {
  return `${origin}/wallet/strip/${shop.slug}/${Math.min(stamps, shop.reward_threshold)}-${stripDesignHash(shop)}.png`;
}

/* GET /wallet/strip/:slug/:stamps-:hash.png */
async function handleStampStripImage(request, env, slug, stampsParam, hash) {
  const shop = await env.DB.prepare('SELECT * FROM stempel_shops WHERE slug = ?').bind(slug).first();
  if (!shop) return new Response('Nicht gefunden', { status: 404 });
  const stamps = Math.max(0, Math.min(parseInt(stampsParam, 10) || 0, shop.reward_threshold));
  const current = hash === stripDesignHash(shop); // alte URL: aktuelles Design liefern, aber nicht dauerhaft cachen
  const key = 'wallet-strip/google-' + await sha256(JSON.stringify([STRIP_VERSION, shop.card_bg_color || '', shop.accent_color || '', stampIconId(shop), shop.reward_threshold, stamps]));

  let png = null;
  try {
    const cached = await env.PHOTOS.get(key);
    if (cached) png = new Uint8Array(await cached.arrayBuffer());
  } catch (e) { /* Cache ist optional */ }

  if (!png) {
    const icon = await loadStampIcon(env, new URL(request.url).origin, stampIconId(shop));
    const { rgb, w, h } = drawStampStrip(shop, { stamps }, icon, GOOGLE_STRIP_W / STRIP_W, STRIP_W, GOOGLE_STRIP_PT_H);
    png = await encodePngRgb(rgb, w, h);
    try {
      await env.PHOTOS.put(key, png, { httpMetadata: { contentType: 'image/png' } });
    } catch (e) { console.error('Google-Stempelbild nicht gecacht:', e); }
  }
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': current ? 'public, max-age=31536000, immutable' : 'no-store',
    },
  });
}

async function buildPkpass(files, certPem, keyPem) {
  const manifest = {};
  for (const [name, data] of Object.entries(files)) {
    manifest[name] = bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-1', data)));
  }
  const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
  const signature = await signPkcs7Detached(manifestBytes, certPem, keyPem);
  return zipStore({ ...files, 'manifest.json': manifestBytes, 'signature': signature });
}

function pemToDer(pem) {
  const b64 = String(pem).replace(/\\n/g, '').replace(/-----(BEGIN|END)[^-]+-----/g, '').replace(/\s/g, '');
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

/* ── Minimaler DER-Baukasten für die PKCS#7-Signatur ── */
function concatBytes(parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
function der(tag, ...parts) {
  const body = concatBytes(parts);
  let len = [body.length];
  if (body.length >= 0x80) {
    len = [];
    for (let n = body.length; n > 0; n = Math.floor(n / 256)) len.unshift(n & 0xff);
    len.unshift(0x80 | len.length);
  }
  return concatBytes([new Uint8Array([tag, ...len]), body]);
}
function derOid(oid) {
  const p = oid.split('.').map(Number);
  const out = [40 * p[0] + p[1]];
  for (const v of p.slice(2)) {
    const b = [v & 0x7f];
    for (let x = v >>> 7; x > 0; x >>>= 7) b.unshift((x & 0x7f) | 0x80);
    out.push(...b);
  }
  return der(0x06, new Uint8Array(out));
}
function derElement(buf, off) {
  let len = buf[off + 1], p = off + 2;
  if (len & 0x80) {
    const n = len & 0x7f;
    len = 0;
    for (let i = 0; i < n; i++) len = len * 256 + buf[p++];
  }
  return { tag: buf[off], off, start: p, end: p + len };
}
function derChildren(buf, el) {
  const out = [];
  for (let o = el.start; o < el.end;) { const e = derElement(buf, o); out.push(e); o = e.end; }
  return out;
}
function compareBytes(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
}
function utcTime(d) {
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getUTCFullYear() % 100)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

/* CMS SignedData ohne eingebetteten Inhalt, signiert mit RSA/SHA-256.
   Enthält Signer-Zertifikat + WWDR G4, damit Wallet die Kette bis zur Apple Root CA prüfen kann. */
async function signPkcs7Detached(content, certPem, keyPem) {
  const cert = pemToDer(certPem);
  const wwdr = pemToDer(APPLE_WWDR_G4_PEM);
  const tbs = derChildren(cert, derChildren(cert, derElement(cert, 0))[0]);
  const i = tbs[0].tag === 0xa0 ? 1 : 0; // [0] version ist optional
  const serial = cert.slice(tbs[i].off, tbs[i].end);
  const issuer = cert.slice(tbs[i + 2].off, tbs[i + 2].end);

  const sha256Alg = der(0x30, derOid('2.16.840.1.101.3.4.2.1'), der(0x05));
  const rsaAlg = der(0x30, derOid('1.2.840.113549.1.1.1'), der(0x05));
  const dataOid = derOid('1.2.840.113549.1.7.1');
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', content));
  const te = new TextEncoder();

  const attr = (oid, value) => der(0x30, derOid(oid), der(0x31, value));
  const attrs = concatBytes([
    attr('1.2.840.113549.1.9.3', dataOid),                               // contentType
    attr('1.2.840.113549.1.9.5', der(0x17, te.encode(utcTime(new Date())))), // signingTime
    attr('1.2.840.113549.1.9.4', der(0x04, digest)),                     // messageDigest
  ].sort(compareBytes)); // DER: SET OF sortiert

  const key = await crypto.subtle.importKey(
    'pkcs8', pemToDer(keyPem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
  // Signiert werden die Attribute als SET (0x31), eingebettet dann als [0] IMPLICIT (0xa0)
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, der(0x31, attrs)));

  const one = der(0x02, new Uint8Array([1]));
  const signerInfo = der(0x30, one, der(0x30, issuer, serial), sha256Alg, der(0xa0, attrs), rsaAlg, der(0x04, sig));
  const signedData = der(0x30, one, der(0x31, sha256Alg), der(0x30, dataOid), der(0xa0, cert, wwdr), der(0x31, signerInfo));
  return der(0x30, derOid('1.2.840.113549.1.7.2'), der(0xa0, signedData));
}

/* ── ZIP ohne Kompression (Methode 0 "stored") — reicht für die paar KB eines Passes ── */
let crcTable = null;
function crc32(bytes) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function zipStore(files) {
  const te = new TextEncoder();
  const local = [], central = [];
  let offset = 0;
  const DOS_DATE = (1 << 5) | 1; // 01.01.1980

  for (const [name, data] of Object.entries(files)) {
    const nameBytes = te.encode(name);
    const crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true);
    lh.setUint16(12, DOS_DATE, true); lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
    lh.setUint16(26, nameBytes.length, true);
    local.push(new Uint8Array(lh.buffer), nameBytes, data);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true);
    ch.setUint16(14, DOS_DATE, true); ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
    ch.setUint16(28, nameBytes.length, true); ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), nameBytes);

    offset += 30 + nameBytes.length + data.length;
  }

  const cd = concatBytes(central);
  const count = Object.keys(files).length;
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, count, true); end.setUint16(10, count, true);
  end.setUint32(12, cd.length, true); end.setUint32(16, offset, true);
  return concatBytes([...local, cd, new Uint8Array(end.buffer)]);
}

/* ── Apple Wallet: Aktualisierung ──
   Jeder Pass trägt webServiceURL + authenticationToken. Damit meldet das iPhone
   die Karte beim Hinzufügen automatisch hier an (Push-Token des Geräts), beim
   Löschen wieder ab — der Kunde merkt davon nichts. Nach jedem Stempel geht ein
   leerer Push über APNs an diese Geräte; Wallet holt sich daraufhin selbst die
   neue Karte über GET /passes/…. Protokoll: Apple "Wallet Web Service".
   Der Push braucht das mTLS-Binding APNS_CERT (Pass-Zertifikat + Schlüssel,
   siehe wrangler.jsonc) — ohne Binding bleibt die manuelle Aktualisierung. */

const APPLE_WS_PREFIX = '/wallet/apple/ws/v1/';

/* Geheimer Token pro Karte — abgeleitet statt gespeichert (HMAC über die Karten-ID) */
async function appleAuthToken(env, serial) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(env.APPLE_PASS_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('wallet-auth:' + serial));
  return bytesToHex(new Uint8Array(mac)).slice(0, 40);
}

async function appleAuthOk(request, env, serial) {
  const m = (request.headers.get('Authorization') || '').match(/^ApplePass\s+(\S+)$/);
  return !!m && m[1] === await appleAuthToken(env, serial);
}

/* Stand einer Karte in Sekunden — ändert sich mit jedem Stempel, jeder Einlösung
   und jeder Laden-Änderung, die auf der Karte sichtbar ist (shop_updated_at) */
function applePassUpdatedAt(row) {
  const stamped = row.last_stamp_at ? Math.floor(new Date(row.last_stamp_at + 'Z').getTime() / 1000) : 0;
  return Math.max(stamped, row.shop_updated_at || 0);
}

async function ensureWalletTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS wallet_registrations (
       device_id TEXT NOT NULL,
       push_token TEXT NOT NULL,
       serial TEXT NOT NULL,
       created_at TEXT DEFAULT (datetime('now')),
       PRIMARY KEY (device_id, serial)
     )`
  ).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_wallet_registrations_serial ON wallet_registrations(serial)').run();
  await env.DB.prepare(
    'CREATE TABLE IF NOT EXISTS wallet_shop_versions (shop_id TEXT PRIMARY KEY, updated_at INTEGER NOT NULL)'
  ).run();
}

/* Laden hat Belohnung, Farben, Icon o. ä. geändert: Stand aller seiner Karten
   hochsetzen und alle Geräte mit einer Karte dieses Ladens anstoßen */
async function markShopWalletChanged(env, shopId, ctx) {
  try {
    await ensureWalletTable(env);
    await env.DB.prepare(
      `INSERT INTO wallet_shop_versions (shop_id, updated_at) VALUES (?, ?)
       ON CONFLICT(shop_id) DO UPDATE SET updated_at = excluded.updated_at`
    ).bind(shopId, Math.floor(Date.now() / 1000)).run();
  } catch (e) {
    console.error('Wallet-Stand des Ladens nicht gespeichert:', e);
    return;
  }
  const push = env.DB.prepare(
    `SELECT DISTINCT r.push_token FROM wallet_registrations r
     JOIN stempel_customers c ON c.id = r.serial WHERE c.shop_id = ?`
  ).bind(shopId).all()
    .then(r => sendApplePushes(env, (r.results || []).map(x => x.push_token)))
    .catch(e => console.error('Apple Wallet Laden-Update fehlgeschlagen:', e));
  if (ctx) ctx.waitUntil(push); else await push;
}

async function handleAppleWalletService(request, env, sub) {
  if (!env.APPLE_PASS_CERT || !env.APPLE_PASS_KEY) return new Response(null, { status: 503 });
  const p = sub.split('/').map(s => { try { return decodeURIComponent(s); } catch (e) { return ''; } });
  const method = request.method;

  // POST /log — Wallet meldet hier Fehler mit unserem Dienst
  if (method === 'POST' && p[0] === 'log' && p.length === 1) {
    const body = await readJson(request);
    console.error('Apple Wallet Log:', JSON.stringify(body?.logs || body));
    return new Response(null, { status: 200 });
  }

  // /devices/:deviceId/registrations/:passTypeId[/:serial]
  if (p[0] === 'devices' && p[2] === 'registrations' && p[3] === APPLE_PASS_TYPE_ID) {
    const deviceId = p[1];
    if (!/^[A-Za-z0-9._-]{1,128}$/.test(deviceId)) return new Response(null, { status: 400 });

    if (p.length === 5) {
      const serial = p[4];
      if (!(await appleAuthOk(request, env, serial))) return new Response(null, { status: 401 });

      if (method === 'POST') {
        const pushToken = str((await readJson(request))?.pushToken);
        if (!/^[0-9a-fA-F]{16,256}$/.test(pushToken)) return new Response(null, { status: 400 });
        const customer = await env.DB.prepare('SELECT id FROM stempel_customers WHERE id = ?').bind(serial).first();
        if (!customer) return new Response(null, { status: 404 });
        await ensureWalletTable(env);
        const existing = await env.DB.prepare('SELECT 1 FROM wallet_registrations WHERE device_id = ? AND serial = ?')
          .bind(deviceId, serial).first();
        await env.DB.prepare(
          `INSERT INTO wallet_registrations (device_id, push_token, serial) VALUES (?, ?, ?)
           ON CONFLICT(device_id, serial) DO UPDATE SET push_token = excluded.push_token`
        ).bind(deviceId, pushToken, serial).run();
        return new Response(null, { status: existing ? 200 : 201 });
      }
      if (method === 'DELETE') {
        await env.DB.prepare('DELETE FROM wallet_registrations WHERE device_id = ? AND serial = ?').bind(deviceId, serial).run()
          .catch(() => null);
        return new Response(null, { status: 200 });
      }
    }

    // GET — welche Karten dieses Geräts haben sich seit passesUpdatedSince geändert?
    if (p.length === 4 && method === 'GET') {
      const since = Number(new URL(request.url).searchParams.get('passesUpdatedSince')) || 0;
      await ensureWalletTable(env);
      const rows = await env.DB.prepare(
        `SELECT r.serial, c.last_stamp_at, v.updated_at AS shop_updated_at FROM wallet_registrations r
         JOIN stempel_customers c ON c.id = r.serial
         LEFT JOIN wallet_shop_versions v ON v.shop_id = c.shop_id
         WHERE r.device_id = ?`
      ).bind(deviceId).all().then(r => r.results || [], () => []);
      const changed = rows.filter(r => applePassUpdatedAt(r) > since);
      if (!changed.length) return new Response(null, { status: 204 });
      return json({
        serialNumbers: changed.map(r => r.serial),
        lastUpdated: String(Math.max(...rows.map(applePassUpdatedAt))),
      });
    }
  }

  // GET /passes/:passTypeId/:serial — aktuelle Version der Karte
  if (method === 'GET' && p[0] === 'passes' && p[1] === APPLE_PASS_TYPE_ID && p.length === 3) {
    const serial = p[2];
    if (!(await appleAuthOk(request, env, serial))) return new Response(null, { status: 401 });
    const customer = await env.DB.prepare('SELECT * FROM stempel_customers WHERE id = ?').bind(serial).first();
    if (!customer) return new Response(null, { status: 404 });
    const shop = await env.DB.prepare('SELECT * FROM stempel_shops WHERE id = ?').bind(customer.shop_id).first();
    if (!shop) return new Response(null, { status: 404 });

    await ensureWalletTable(env);
    const version = await env.DB.prepare('SELECT updated_at FROM wallet_shop_versions WHERE shop_id = ?').bind(shop.id).first();
    const updatedAt = applePassUpdatedAt({ ...customer, shop_updated_at: version?.updated_at });
    const since = Date.parse(request.headers.get('If-Modified-Since') || '');
    if (since && updatedAt && Math.floor(since / 1000) >= updatedAt) return new Response(null, { status: 304 });

    const files = await appleWalletFiles(env, new URL(request.url).origin, shop, customer);
    const pkpass = await buildPkpass(files, env.APPLE_PASS_CERT, env.APPLE_PASS_KEY);
    return new Response(pkpass, {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Last-Modified': new Date((updatedAt || Math.floor(Date.now() / 1000)) * 1000).toUTCString(),
        'Cache-Control': 'no-store',
      },
    });
  }

  return new Response(null, { status: 404 });
}

/* Leerer Push an alle Geräte mit dieser Karte — Wallet lädt die Karte dann selbst neu.
   APNs verlangt dafür das Pass-Zertifikat als Client-Zertifikat (mTLS-Binding APNS_CERT). */
async function pushAppleWalletUpdate(env, customer) {
  if (!env.APNS_CERT) return;
  const rows = await env.DB.prepare('SELECT DISTINCT push_token FROM wallet_registrations WHERE serial = ?')
    .bind(customer.id).all().then(r => r.results || [], () => []);
  await sendApplePushes(env, rows.map(r => r.push_token));
}

/* In Gruppen zu 25 — ein Laden kann viele Karten haben */
async function sendApplePushes(env, pushTokens) {
  if (!env.APNS_CERT) return;
  for (let i = 0; i < pushTokens.length; i += 25) {
    await Promise.all(pushTokens.slice(i, i + 25).map(push_token => sendApplePush(env, push_token)));
  }
}

async function sendApplePush(env, push_token) {
  try {
    const res = await env.APNS_CERT.fetch(`https://api.push.apple.com/3/device/${push_token}`, {
      method: 'POST',
      headers: { 'apns-topic': APPLE_PASS_TYPE_ID, 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (res.status === 410) {
      // Gerät hat die Karte nicht mehr — Anmeldung aufräumen
      await env.DB.prepare('DELETE FROM wallet_registrations WHERE push_token = ?').bind(push_token).run();
    } else if (!res.ok) {
      console.error(`APNs ${res.status}: ${await res.text()}`);
    }
  } catch (e) {
    console.error('APNs nicht erreichbar:', e); // ein Gerät darf die anderen nicht aufhalten
  }
}

/* ── Nachrichten an Kunden ──
   Der Laden schreibt im Dashboard eine kurze Nachricht (z. B. neues Getränk am
   Wochenende). Apple Wallet: Feld "news" mit changeMessage — ändert sich der Text,
   zeigt das iPhone ihn als Mitteilung auf dem Sperrbildschirm (ausgelöst über den
   normalen Karten-Push). Google Wallet: Nachricht an der Klasse (TEXT_AND_NOTIFY).
   Kartenseite im Browser zeigt die Nachricht ebenfalls.
   Höchstens eine Nachricht pro Laden und 24 Stunden — gegen Spam. */
const MESSAGE_MAX_LEN = 200;
const MESSAGE_INTERVAL_SEC = 24 * 3600;

async function ensureMessagesTable(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS stempel_messages (
       id TEXT PRIMARY KEY,
       shop_id TEXT NOT NULL,
       text TEXT NOT NULL,
       created_at INTEGER NOT NULL,
       expires_at INTEGER,
       ended_at INTEGER
     )`
  ).run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_stempel_messages_shop ON stempel_messages(shop_id, created_at)').run();
}

/* Aktuelle Nachricht eines Ladens oder null (auch wenn die Tabelle noch fehlt) */
async function currentShopMessage(env, shopId) {
  try {
    return await env.DB.prepare(
      `SELECT * FROM stempel_messages WHERE shop_id = ? AND ended_at IS NULL
       AND (expires_at IS NULL OR expires_at > ?) ORDER BY created_at DESC LIMIT 1`
    ).bind(shopId, Math.floor(Date.now() / 1000)).first();
  } catch (e) {
    return null;
  }
}

/* "2026-09-27" → Sonntag 23:59:59 in Berlin, als Unix-Sekunden */
function berlinEndOfDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const utc = Date.UTC(y, m - 1, d, 23, 59, 59);
  const tz = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Berlin', timeZoneName: 'shortOffset' })
    .formatToParts(new Date(utc)).find(p => p.type === 'timeZoneName')?.value || 'GMT+1';
  const hours = parseInt((tz.match(/GMT([+-]\d+)/) || [0, '1'])[1], 10);
  return Math.floor((utc - hours * 3600000) / 1000);
}

/* Wer bekommt eine Nachricht als Mitteilung aufs Handy? Kunden-IDs mit Apple-Wallet-Karte
   (aus den Geräte-Anmeldungen) und mit Google-Wallet-Karte (Googles Objektliste der
   Laden-Klasse, hasUsers = gespeichert). Ein Kunde mit beiden Wallets zählt einmal. */
async function appleWalletCustomerIds(env, shopId) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT DISTINCT r.serial FROM wallet_registrations r
       JOIN stempel_customers c ON c.id = r.serial WHERE c.shop_id = ?`
    ).bind(shopId).all();
    return new Set((results || []).map(r => r.serial));
  } catch (e) {
    return new Set();
  }
}

/* null = unbekannt (Google Wallet nicht eingerichtet oder nicht erreichbar) */
async function googleWalletCustomerIds(env, shop) {
  if (!env.GOOGLE_WALLET_ISSUER_ID || !env.GOOGLE_WALLET_SERVICE_ACCOUNT || !env.GOOGLE_WALLET_PRIVATE_KEY) return null;
  try {
    const { classId } = buildLoyaltyIds(env, shop, { id: '' });
    const prefix = `${env.GOOGLE_WALLET_ISSUER_ID}.`;
    const accessToken = await getGoogleWalletAccessToken(env);
    const ids = new Set();
    let pageToken = '';
    for (let page = 0; page < 10; page++) { // höchstens 1000 Karten abfragen
      const url = `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject?classId=${encodeURIComponent(classId)}&maxResults=100`
        + (pageToken ? `&token=${encodeURIComponent(pageToken)}` : '');
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      if (res.status === 404) return ids; // noch niemand hat die Karte in Google Wallet
      if (!res.ok) throw new Error(`loyaltyObject-Liste ${res.status}: ${await res.text()}`);
      const data = await res.json();
      for (const o of data.resources || []) {
        if (o.hasUsers && o.state !== 'INACTIVE' && o.id?.startsWith(prefix)) ids.add(o.id.slice(prefix.length));
      }
      pageToken = data.pagination?.nextPageToken;
      if (!pageToken) break;
    }
    return ids;
  } catch (e) {
    console.error('Google-Wallet-Karten nicht abrufbar:', e);
    return null;
  }
}

async function walletReach(env, shop) {
  const [apple, google, total] = await Promise.all([
    appleWalletCustomerIds(env, shop.id),
    googleWalletCustomerIds(env, shop),
    env.DB.prepare('SELECT COUNT(*) AS n FROM stempel_customers WHERE shop_id = ?').bind(shop.id).first().then(r => r?.n || 0, () => 0),
  ]);
  const reached = new Set([...apple, ...(google || [])]);
  return { wallet: reached.size, apple: apple.size, google: google ? google.size : null, customers: total };
}

async function lastMessageCreatedAt(env, shopId) {
  const row = await env.DB.prepare('SELECT MAX(created_at) AS t FROM stempel_messages WHERE shop_id = ?').bind(shopId).first();
  return row?.t || 0;
}

/* GET /api/stempel/message — aktuelle Nachricht, Empfänger, wann die nächste möglich ist */
async function handleStempelGetMessage(request, env) {
  const { shop, denied } = await requireActiveShop(env, request);
  if (denied) return denied;
  await ensureMessagesTable(env);
  const last = await lastMessageCreatedAt(env, shop.id);
  const next = last + MESSAGE_INTERVAL_SEC;
  return json({
    message: await currentShopMessage(env, shop.id),
    reach: await walletReach(env, shop),
    nextAllowedAt: next > Date.now() / 1000 ? next : null,
    maxLength: MESSAGE_MAX_LEN,
  });
}

/* POST /api/stempel/message — Nachricht senden */
async function handleStempelSendMessage(request, env, ctx) {
  const { shop, denied } = await requireActiveShop(env, request);
  if (denied) return denied;
  const data = await readJson(request);
  const text = str(data?.text).replace(/\s+/g, ' ');
  if (text.length < 3) return json({ error: 'Bitte schreib eine Nachricht.' }, 400);
  if (text.length > MESSAGE_MAX_LEN) return json({ error: `Maximal ${MESSAGE_MAX_LEN} Zeichen.` }, 400);

  let expiresAt = null;
  const until = str(data?.until);
  if (until) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) return json({ error: 'Ungültiges Datum' }, 400);
    expiresAt = berlinEndOfDay(until);
    if (expiresAt <= Date.now() / 1000) return json({ error: 'Das Enddatum liegt in der Vergangenheit.' }, 400);
  }

  await ensureMessagesTable(env);
  const now = Math.floor(Date.now() / 1000);
  const last = await lastMessageCreatedAt(env, shop.id);
  if (last && now - last < MESSAGE_INTERVAL_SEC) {
    const next = new Date((last + MESSAGE_INTERVAL_SEC) * 1000)
      .toLocaleString('de-DE', { timeZone: 'Europe/Berlin', weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
    return json({ error: `Du kannst eine Nachricht pro Tag senden. Die nächste geht ab ${next} Uhr.` }, 429);
  }

  const message = { id: crypto.randomUUID(), shop_id: shop.id, text, created_at: now, expires_at: expiresAt, ended_at: null };
  await env.DB.prepare('INSERT INTO stempel_messages (id, shop_id, text, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
    .bind(message.id, shop.id, text, now, expiresAt).run();

  // Apple: Karten neu laden lassen — das neue news-Feld löst die Mitteilung aus
  await markShopWalletChanged(env, shop.id, ctx);
  const google = pushGoogleWalletMessage(env, shop, message).catch(e => console.error('Google Wallet Nachricht fehlgeschlagen:', e));
  if (ctx) ctx.waitUntil(google); else await google;

  return json({ success: true, message });
}

/* DELETE /api/stempel/message — Nachricht vorzeitig beenden (ohne neue Mitteilung) */
async function handleStempelEndMessage(request, env, ctx) {
  const { shop, denied } = await requireActiveShop(env, request);
  if (denied) return denied;
  const message = await currentShopMessage(env, shop.id);
  if (!message) return json({ success: true });
  await env.DB.prepare('UPDATE stempel_messages SET ended_at = ? WHERE id = ?').bind(Math.floor(Date.now() / 1000), message.id).run();
  await markShopWalletChanged(env, shop.id, ctx);
  const google = clearGoogleWalletMessages(env, shop).catch(e => console.error('Google Wallet Nachricht nicht entfernt:', e));
  if (ctx) ctx.waitUntil(google); else await google;
  return json({ success: true });
}

async function pushGoogleWalletMessage(env, shop, message) {
  if (!env.GOOGLE_WALLET_ISSUER_ID || !env.GOOGLE_WALLET_SERVICE_ACCOUNT || !env.GOOGLE_WALLET_PRIVATE_KEY) return;
  const classId = `${env.GOOGLE_WALLET_ISSUER_ID}.${shop.slug}`;
  const accessToken = await getGoogleWalletAccessToken(env);
  const res = await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${classId}/addMessage`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        id: 'msg-' + message.id,
        header: shop.name,
        body: message.text,
        messageType: 'TEXT_AND_NOTIFY',
        ...(message.expires_at ? { displayInterval: { end: { date: new Date(message.expires_at * 1000).toISOString() } } } : {}),
      },
    }),
  });
  // 404: noch niemand hat die Karte dieses Ladens in Google Wallet — nichts zu tun
  if (!res.ok && res.status !== 404) throw new Error(`addMessage ${res.status}: ${await res.text()}`);
}

async function clearGoogleWalletMessages(env, shop) {
  if (!env.GOOGLE_WALLET_ISSUER_ID || !env.GOOGLE_WALLET_SERVICE_ACCOUNT || !env.GOOGLE_WALLET_PRIVATE_KEY) return;
  const classId = `${env.GOOGLE_WALLET_ISSUER_ID}.${shop.slug}`;
  const accessToken = await getGoogleWalletAccessToken(env);
  const res = await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${classId}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [] }),
  });
  if (!res.ok && res.status !== 404) throw new Error(`Class-PATCH ${res.status}: ${await res.text()}`);
}

/* ── Google Wallet: Laden-Änderungen ──
   Bei Google stehen Farben und Logo an der Klasse (einmal pro Laden), Belohnungstext,
   Stempelstand und Stempel-Bild aber an jeder einzelnen Karte. Ändert der Laden etwas
   davon, werden Klasse und jede gespeicherte Google-Karte des Ladens aktualisiert —
   wie bei Apple sofort statt erst beim nächsten Stempel des Kunden. */
function syncGoogleWalletShop(env, request, shopId, ctx) {
  const job = pushGoogleWalletShopUpdate(env, new URL(request.url).origin, shopId)
    .catch(e => console.error('Google Wallet Laden-Update fehlgeschlagen:', e));
  if (ctx) ctx.waitUntil(job);
  return job;
}

async function pushGoogleWalletShopUpdate(env, origin, shopId) {
  if (!env.GOOGLE_WALLET_ISSUER_ID || !env.GOOGLE_WALLET_SERVICE_ACCOUNT || !env.GOOGLE_WALLET_PRIVATE_KEY) return;
  const shop = await env.DB.prepare('SELECT * FROM stempel_shops WHERE id = ?').bind(shopId).first(); // Stand nach dem Speichern
  if (!shop) return;

  const { classId } = buildLoyaltyIds(env, shop, { id: '' });
  const accessToken = await getGoogleWalletAccessToken(env);
  const patch = (kind, id, body) => fetch(`https://walletobjects.googleapis.com/walletobjects/v1/${kind}/${id}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const classRes = await patch('loyaltyClass', classId, buildLoyaltyClass(env, origin, shop, classId));
  if (classRes.status === 404) return; // noch niemand hat eine Karte dieses Ladens in Google Wallet
  if (!classRes.ok) console.error(`Google Wallet Class-PATCH ${classRes.status}: ${await classRes.text()}`);

  const saved = await googleWalletCustomerIds(env, shop);
  if (!saved || !saved.size) return;
  const { results } = await env.DB.prepare('SELECT * FROM stempel_customers WHERE shop_id = ?').bind(shop.id).all();
  const customers = (results || []).filter(c => saved.has(c.id) && c.redeem_token);

  for (let i = 0; i < customers.length; i += 10) {
    await Promise.all(customers.slice(i, i + 10).map(async customer => {
      const { objectId } = buildLoyaltyIds(env, shop, customer);
      try {
        const res = await patch('loyaltyObject', objectId, buildLoyaltyObject(env, origin, shop, customer, classId, objectId));
        if (!res.ok && res.status !== 404) console.error(`Google Wallet Object-PATCH ${res.status}: ${await res.text()}`);
      } catch (e) {
        console.error('Google Wallet Object-PATCH fehlgeschlagen:', e); // eine Karte darf die anderen nicht aufhalten
      }
    }));
  }
}

async function handleStaffRedeemPage(request, env, token) {
  const customer = await env.DB.prepare('SELECT * FROM stempel_customers WHERE redeem_token = ?').bind(token).first();
  if (!customer) return new Response('Karte nicht gefunden.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  const shop = await env.DB.prepare('SELECT * FROM stempel_shops WHERE id = ?').bind(customer.shop_id).first();
  if (!shop) return new Response('Laden nicht gefunden.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  if (!(await shopAccess(env, shop)).active) return inactiveShopResponse(shop);

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
  if (!(await shopAccess(env, shop)).active) return inactiveShopResponse(shop, true);

  const pinHash = await sha256(pin);
  const employee = await env.DB.prepare('SELECT * FROM stempel_employees WHERE shop_id = ? AND pin_hash = ?')
    .bind(shop.id, pinHash).first();
  if (!employee) return json({ error: 'PIN falsch' }, 401);

  const { customer: updated, isNew, cooldownHit } = await grantStampToCustomer(env, customer, shop, employee.id, request, ctx);
  const rewardReached = updated.stamps >= shop.reward_threshold;
  const html = renderStempelTapPage(shop, updated, { isNew: false, cooldownHit, rewardReached }, new URL(request.url).origin);
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

/* ══ Karten-ID ══
   Kurzer Code, den der Kunde abtippen kann, um seine Karte auf einem neuen
   Gerät zurückzuholen. Kein Ersatz für id/redeem_token, sondern ein reines
   Wiedererkennungsmerkmal. Ohne 0/O und 1/I/L, damit nichts verwechselt wird. */
const CARD_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CARD_CODE_LENGTH = 8;

function randomCardCode() {
  const out = [];
  /* Zufallsbytes verwerfen, die den Zeichenvorrat ungleich verteilen würden */
  const limit = 256 - (256 % CARD_CODE_ALPHABET.length);
  while (out.length < CARD_CODE_LENGTH) {
    for (const b of crypto.getRandomValues(new Uint8Array(CARD_CODE_LENGTH))) {
      if (b >= limit) continue;
      out.push(CARD_CODE_ALPHABET[b % CARD_CODE_ALPHABET.length]);
      if (out.length === CARD_CODE_LENGTH) break;
    }
  }
  return out.join('');
}

/* Eingaben tolerant lesen: Kleinbuchstaben, Leerzeichen und Bindestriche erlaubt */
function normalizeCardCode(input) {
  return String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CARD_CODE_LENGTH);
}

/* Eindeutig über die ganze Tabelle — bei Kollision neu würfeln und erneut prüfen */
async function uniqueCardCode(env) {
  for (let i = 0; i < 10; i++) {
    const code = randomCardCode();
    const taken = await env.DB.prepare('SELECT 1 FROM stempel_customers WHERE card_code = ?').bind(code).first();
    if (!taken) return code;
  }
  throw new Error('Karten-ID konnte nicht vergeben werden');
}

/* Bestandskunden ohne Karten-ID bekommen beim nächsten Besuch eine */
async function ensureCardCode(env, customer) {
  if (customer.card_code) return customer.card_code;
  const code = await uniqueCardCode(env);
  await env.DB.prepare('UPDATE stempel_customers SET card_code = ? WHERE id = ?').bind(code, customer.id).run();
  customer.card_code = code;
  return code;
}

/* ══ Kartenhintergrund ══
   Statt Flächenfarbe ein mehrschichtiger Verlauf: Basis aus der Ladenfarbe,
   darüber je nach gewähltem Stil farbige Lichter, ein Raster oder ein
   Glanz-Streifen. Alles reines CSS, keine Bilddateien.
   Reihenfolge der Ebenen: Muster/Lichter zuerst, Basisverlauf zuletzt.
   ACHTUNG: gleiche Werte in stempel.html (cardBackgroundLayers). */
const BG_PATTERNS = [
  { id: 'aurora', label: 'Aurora' },
  { id: 'mesh', label: 'Farbnebel' },
  { id: 'spotlight', label: 'Spotlight' },
  { id: 'grid', label: 'Raster' },
  { id: 'dots', label: 'Punkte' },
  { id: 'rays', label: 'Glanzstreifen' },
  { id: 'none', label: 'Nur Verlauf' },
];
const BG_PATTERN_IDS = BG_PATTERNS.map(p => p.id);

/* Helligkeit einer Farbe (0–1) — entscheidet über helles oder dunkles Kartenthema */
function luminanceOf(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/* Zwei Farben prozentual mischen — daraus leiten sich alle Flächen der Karte ab */
function mixHex(hex, target, pct) {
  const n1 = parseInt(hex.replace('#', ''), 16), n2 = parseInt(target.replace('#', ''), 16);
  const r = Math.round(((n1 >> 16) & 0xff) + (((n2 >> 16) & 0xff) - ((n1 >> 16) & 0xff)) * pct);
  const g = Math.round(((n1 >> 8) & 0xff) + (((n2 >> 8) & 0xff) - ((n1 >> 8) & 0xff)) * pct);
  const b = Math.round((n1 & 0xff) + ((n2 & 0xff) - (n1 & 0xff)) * pct);
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

/* Hex + Alpha-Prozent → #rrggbbaa */
function withAlpha(hex, pct) {
  const a = Math.round(Math.max(0, Math.min(1, pct)) * 255).toString(16).padStart(2, '0');
  return hex + a;
}

function cardBackgroundLayers(pattern, accent, bg, isLightBg) {
  const away = isLightBg ? '#ffffff' : '#000000';
  const top = mixHex(mixHex(bg, away, isLightBg ? 0.45 : 0.12), accent, 0.08);
  const deep = mixHex(bg, '#000000', isLightBg ? 0.05 : 0.32);
  const base = `radial-gradient(135% 85% at 18% -12%, ${top} 0%, ${bg} 52%, ${deep} 100%)`;
  const strong = isLightBg ? 0.22 : 0.34;
  const soft = isLightBg ? 0.13 : 0.22;
  const line = withAlpha(accent, isLightBg ? 0.10 : 0.09);
  /* Zweite Farbe fürs Farbnebel-Muster: Akzent Richtung Weiß bzw. Schwarz gedreht */
  const accent2 = isLightBg ? mixHex(accent, '#ffffff', 0.45) : mixHex(accent, '#ffffff', 0.35);

  switch (pattern) {
    case 'mesh':
      return {
        image: [
          `radial-gradient(52% 38% at 82% 8%, ${withAlpha(accent, strong)} 0%, transparent 70%)`,
          `radial-gradient(46% 34% at 8% 34%, ${withAlpha(accent2, soft)} 0%, transparent 72%)`,
          `radial-gradient(58% 42% at 52% 104%, ${withAlpha(accent, soft)} 0%, transparent 70%)`,
          base,
        ].join(', '),
        size: 'auto', repeat: 'no-repeat',
      };
    case 'spotlight':
      return {
        image: [
          `radial-gradient(70% 45% at 50% -8%, ${withAlpha(accent, strong)} 0%, transparent 68%)`,
          base,
        ].join(', '),
        size: 'auto', repeat: 'no-repeat',
      };
    case 'grid':
      return {
        image: [
          `linear-gradient(${line} 1px, transparent 1px)`,
          `linear-gradient(90deg, ${line} 1px, transparent 1px)`,
          base,
        ].join(', '),
        size: '34px 34px, 34px 34px, auto', repeat: 'repeat, repeat, no-repeat',
      };
    case 'dots':
      return {
        image: [
          `radial-gradient(${withAlpha(accent, isLightBg ? 0.16 : 0.15)} 1.6px, transparent 1.7px)`,
          base,
        ].join(', '),
        size: '22px 22px, auto', repeat: 'repeat, no-repeat',
      };
    case 'rays':
      return {
        image: [
          `repeating-linear-gradient(115deg, ${withAlpha(accent, 0.11)} 0 2px, transparent 2px 22px)`,
          base,
        ].join(', '),
        size: 'auto', repeat: 'repeat, no-repeat',
      };
    case 'none':
      return { image: base, size: 'auto', repeat: 'no-repeat' };
    default: /* 'aurora' — auch der Fallback für alte gespeicherte Werte */
      return {
        image: [
          `radial-gradient(48% 34% at 88% 4%, ${withAlpha(accent, strong)} 0%, transparent 68%)`,
          `radial-gradient(54% 38% at 4% 92%, ${withAlpha(accent, soft)} 0%, transparent 70%)`,
          base,
        ].join(', '),
        size: 'auto', repeat: 'no-repeat',
      };
  }
}

/* ══ Tapstempel Icon-System ══
   Eigene farbige Icons als SVG-Sprite: jedes Symbol ist ein <symbol> mit
   Verläufen und Glanzlichtern, eingebunden über <use href="#tsi-…">. Die
   Verläufe liegen einmal zentral in <defs>, deshalb kostet ein Stempel mehr
   im Markup nur ein <use>. Gefüllt = volle Farbe, leer = ausgegraut (CSS).
   ACHTUNG: Sprite und ID-Liste identisch in _worker.js und stempel.html halten.
   Für Apple Wallet liegt jedes Icon zusätzlich als PNG in wallet/stamps/<id>.png
   (128 px, RGBA; "circle" als schwarze Maske) — bei Änderungen neu rendern. */
const STAMP_ICON_SPRITE = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>
<linearGradient id="tsg-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#ef9b16"/></linearGradient>
<linearGradient id="tsg-amber" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc861"/><stop offset="1" stop-color="#e2761b"/></linearGradient>
<linearGradient id="tsg-red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a6b"/><stop offset="1" stop-color="#dc2f1c"/></linearGradient>
<linearGradient id="tsg-pink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb6d3"/><stop offset="1" stop-color="#ec4f93"/></linearGradient>
<linearGradient id="tsg-purple" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c7a4ff"/><stop offset="1" stop-color="#7c3aed"/></linearGradient>
<linearGradient id="tsg-blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ecbff"/><stop offset="1" stop-color="#2563eb"/></linearGradient>
<linearGradient id="tsg-teal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ee8da"/><stop offset="1" stop-color="#0d9488"/></linearGradient>
<linearGradient id="tsg-green" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93e39b"/><stop offset="1" stop-color="#22a04b"/></linearGradient>
<linearGradient id="tsg-kraft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eac599"/><stop offset="1" stop-color="#bd8447"/></linearGradient>
<linearGradient id="tsg-choc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b3773f"/><stop offset="1" stop-color="#6d3c17"/></linearGradient>
<linearGradient id="tsg-coffee" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4a25"/><stop offset="1" stop-color="#43220e"/></linearGradient>
<linearGradient id="tsg-cream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#f0dcba"/></linearGradient>
<linearGradient id="tsg-white" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe6ef"/></linearGradient>
<linearGradient id="tsg-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef3f9"/><stop offset="1" stop-color="#93a3b8"/></linearGradient>
<linearGradient id="tsg-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a6678"/><stop offset="1" stop-color="#1f2937"/></linearGradient>
<linearGradient id="tsg-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".85"/><stop offset="1" stop-color="#cfe1ee" stop-opacity=".7"/></linearGradient>
</defs>

<symbol id="tsi-circle" viewBox="0 0 48 48"><circle cx="24" cy="24" r="15" fill="currentColor"/><ellipse cx="19" cy="17.5" rx="8" ry="5.4" fill="#fff" opacity=".3"/></symbol>

<symbol id="tsi-star" viewBox="0 0 48 48"><path d="M24 6.5l5.4 11 12.1 1.8-8.8 8.5 2.1 12L24 34.1 13.2 39.8l2.1-12-8.8-8.5 12.1-1.8z" fill="url(#tsg-gold)"/><path d="M24 6.5l5.4 11 12.1 1.8-8.8 8.5-2.6-13.9z" fill="#fff" opacity=".25"/></symbol>

<symbol id="tsi-heart" viewBox="0 0 48 48"><path d="M24 40.6C12.8 33.3 7.2 27.1 7.2 20.6A8.8 8.8 0 0 1 24 16.1a8.8 8.8 0 0 1 16.8 4.5c0 6.5-5.6 12.7-16.8 20z" fill="url(#tsg-red)"/><ellipse cx="16.2" cy="21.4" rx="4.6" ry="3" fill="#fff" opacity=".4" transform="rotate(-28 16.2 21.4)"/></symbol>

<symbol id="tsi-coffee" viewBox="0 0 48 48"><ellipse cx="22" cy="39.5" rx="15" ry="3" fill="url(#tsg-steel)"/><path d="M33.5 18.5h3a5.8 5.8 0 0 1 0 11.6h-3" fill="none" stroke="#cfd8e3" stroke-width="3.4" stroke-linecap="round"/><path d="M9 15.5h26v10.8A13 13 0 0 1 22 39.3 13 13 0 0 1 9 26.3z" fill="url(#tsg-white)"/><ellipse cx="22" cy="15.8" rx="13" ry="3.6" fill="url(#tsg-coffee)"/><path d="M14.4 21.5c-.6 5 .2 9.4 2.4 13.2" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/><path d="M16.5 4.5c-1.6 2.2-1.6 4.4 0 6.6M24 3c-1.6 2.2-1.6 4.4 0 6.6" fill="none" stroke="#c3ccd8" stroke-width="2.2" stroke-linecap="round"/></symbol>

<symbol id="tsi-tea" viewBox="0 0 48 48"><path d="M17 5c-1.8 2.4-1.8 4.8 0 7.2M24.5 3.5c-1.8 2.4-1.8 4.8 0 7.2M32 5c-1.8 2.4-1.8 4.8 0 7.2" fill="none" stroke="#b9c5d2" stroke-width="2.2" stroke-linecap="round"/><path d="M11.5 15h25l-2.6 21.5A6 6 0 0 1 28 42h-8A6 6 0 0 1 14.1 36.5z" fill="url(#tsg-glass)"/><path d="M14.4 21h19.2l-1.9 14.8A4 4 0 0 1 27.8 39h-7.6a4 4 0 0 1-3.9-3.2z" fill="url(#tsg-amber)"/><path d="M20 21c2.4-3.4 6-4.6 10.5-3.4-.8 3.8-3.6 6-8.4 6.2z" fill="url(#tsg-green)"/><path d="M17.4 17.5h3l-1.8 20h-2.5z" fill="#fff" opacity=".5"/></symbol>

<symbol id="tsi-food" viewBox="0 0 48 48"><path d="M10 7.5v9.5a3.2 3.2 0 0 0 6.4 0V7.5" fill="none" stroke="#47536b" stroke-width="3.2" stroke-linecap="round"/><path d="M13.2 7.5v9.5M13.2 20V40" stroke="#47536b" stroke-width="3.2" stroke-linecap="round"/><path d="M36.5 7.5c3 3.4 3.6 8.2 1.4 12.2-.4.8-.9 1.4-1.4 1.8V40" fill="none" stroke="#47536b" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="24.5" cy="24" r="12" fill="url(#tsg-white)"/><circle cx="24.5" cy="24" r="7.6" fill="none" stroke="#cfd8e3" stroke-width="2"/><ellipse cx="19.5" cy="18.5" rx="4.4" ry="2.8" fill="#fff" opacity=".75"/></symbol>

<symbol id="tsi-pizza" viewBox="0 0 48 48"><path d="M24 5.5l15.6 28.2a3 3 0 0 1-2.6 4.5H11a3 3 0 0 1-2.6-4.5z" fill="url(#tsg-kraft)"/><path d="M24 13l12.2 22H11.8z" fill="url(#tsg-gold)"/><circle cx="20.3" cy="25" r="2.8" fill="#dc2f1c"/><circle cx="27.4" cy="30.5" r="2.8" fill="#dc2f1c"/><circle cx="24" cy="18.6" r="2.3" fill="#dc2f1c"/><path d="M24 5.5l4.5 8.2-9 0z" fill="#fff" opacity=".2"/></symbol>

<symbol id="tsi-cocktail" viewBox="0 0 48 48"><path d="M23 26v12" stroke="#c3ccd8" stroke-width="2.8" stroke-linecap="round"/><path d="M15 40h16" stroke="#c3ccd8" stroke-width="3.4" stroke-linecap="round"/><path d="M6.5 10.5h33L23 27z" fill="url(#tsg-glass)"/><path d="M11.6 14.5h22.8L23 26z" fill="url(#tsg-pink)"/><circle cx="33.5" cy="9" r="3.6" fill="#dc2f1c"/><path d="M33.5 5.5c.8-3.4 2.8-5 6-5" fill="none" stroke="#22a04b" stroke-width="2" stroke-linecap="round"/></symbol>

<symbol id="tsi-beer" viewBox="0 0 48 48"><path d="M31 20.5h3.6a5.6 5.6 0 0 1 0 11.2H31" fill="none" stroke="#d9c07f" stroke-width="3.4" stroke-linecap="round"/><path d="M11 16h20v18.5a6 6 0 0 1-6 6h-8a6 6 0 0 1-6-6z" fill="url(#tsg-amber)"/><path d="M11 16h20v4.5H11z" fill="#fff"/><circle cx="14.5" cy="14" r="5" fill="#fff"/><circle cx="21.5" cy="11.5" r="6" fill="#fff"/><circle cx="28.5" cy="14" r="5" fill="#fff"/><rect x="14.6" y="22" width="3.4" height="14" rx="1.7" fill="#fff" opacity=".45"/></symbol>

<symbol id="tsi-bread" viewBox="0 0 48 48"><path d="M13.5 25.5c-2.4-11 .6-17.5 4.6-17.5s7 6.5 4.6 17.5z" fill="url(#tsg-gold)"/><path d="M15.2 13.5l4.6-2.2M14.6 17.5l5.6-2.6M14.4 21.5l6-2.8" stroke="#cf8f1a" stroke-width="1.6" stroke-linecap="round"/><path d="M25.5 25.5c-2.4-12 .6-19 4.8-19s7.2 7 4.8 19z" fill="url(#tsg-gold)"/><path d="M27.2 12.5l4.8-2.4M26.6 16.5l5.8-2.8M26.4 20.5l6.2-3" stroke="#cf8f1a" stroke-width="1.6" stroke-linecap="round"/><path d="M9 24h30l-2.2 16.4a3 3 0 0 1-3 2.6H14.2a3 3 0 0 1-3-2.6z" fill="url(#tsg-kraft)"/><path d="M9 28h30" stroke="#8a5f2e" stroke-width="1.8" opacity=".3"/><path d="M13.5 29.5h3.2l-1 11h-2.6z" fill="#fff" opacity=".3"/></symbol>

<symbol id="tsi-cupcake" viewBox="0 0 48 48"><path d="M13.5 24.5h21l-2.6 14.2a3.2 3.2 0 0 1-3.1 2.6h-9.6a3.2 3.2 0 0 1-3.1-2.6z" fill="url(#tsg-kraft)"/><path d="M19.5 25.5l-1 15M24 25.5v15M28.5 25.5l1 15" stroke="#8a5f2e" stroke-width="1.5" opacity=".3"/><path d="M14.5 25c-3-2.6-2-7 1.8-8.2-.6-5.3 3.1-9.3 7.7-9.3s8.3 4 7.7 9.3c3.8 1.2 4.8 5.6 1.8 8.2z" fill="url(#tsg-pink)"/><circle cx="24" cy="6.5" r="3.2" fill="#dc2f1c"/><ellipse cx="18.5" cy="17" rx="3.4" ry="2.4" fill="#fff" opacity=".45"/></symbol>

<symbol id="tsi-icecream" viewBox="0 0 48 48"><path d="M14.5 23.5h19l-7.9 18.2a1.8 1.8 0 0 1-3.2 0z" fill="url(#tsg-kraft)"/><path d="M17.5 23.5l5.5 15M25.5 23.5l-4.5 12" stroke="#8a5f2e" stroke-width="1.5" opacity=".35"/><circle cx="18" cy="18.5" r="6.8" fill="url(#tsg-pink)"/><circle cx="30" cy="18.5" r="6.8" fill="url(#tsg-cream)"/><circle cx="24" cy="11.5" r="6.8" fill="url(#tsg-choc)"/><ellipse cx="21" cy="8.5" rx="2.6" ry="1.8" fill="#fff" opacity=".35"/></symbol>

<symbol id="tsi-scissors" viewBox="0 0 48 48"><path d="M17.5 30.5 33.5 8.5M30.5 30.5 14.5 8.5" stroke="url(#tsg-steel)" stroke-width="4.2" stroke-linecap="round"/><circle cx="14.5" cy="36" r="5.6" fill="none" stroke="url(#tsg-red)" stroke-width="3.6"/><circle cx="33.5" cy="36" r="5.6" fill="none" stroke="url(#tsg-red)" stroke-width="3.6"/><circle cx="24" cy="27" r="2.4" fill="#5a6678"/></symbol>

<symbol id="tsi-nails" viewBox="0 0 48 48"><rect x="19.5" y="6" width="9" height="10.5" rx="2.4" fill="url(#tsg-dark)"/><rect x="21.5" y="15" width="5" height="5" fill="#334155"/><path d="M15.5 19.5h17v17.6a4.4 4.4 0 0 1-4.4 4.4h-8.2a4.4 4.4 0 0 1-4.4-4.4z" fill="url(#tsg-pink)"/><rect x="18.2" y="23" width="3.2" height="11" rx="1.6" fill="#fff" opacity=".45"/><path d="M37 8.5l1.6 4.2 4.2 1.6-4.2 1.6L37 20.1l-1.6-4.2-4.2-1.6 4.2-1.6z" fill="url(#tsg-gold)"/></symbol>

<symbol id="tsi-flower" viewBox="0 0 48 48"><g fill="url(#tsg-pink)"><ellipse cx="24" cy="12.5" rx="6.2" ry="8.4"/><ellipse cx="24" cy="12.5" rx="6.2" ry="8.4" transform="rotate(72 24 24)"/><ellipse cx="24" cy="12.5" rx="6.2" ry="8.4" transform="rotate(144 24 24)"/><ellipse cx="24" cy="12.5" rx="6.2" ry="8.4" transform="rotate(216 24 24)"/><ellipse cx="24" cy="12.5" rx="6.2" ry="8.4" transform="rotate(288 24 24)"/></g><circle cx="24" cy="24" r="5.4" fill="url(#tsg-gold)"/><ellipse cx="22" cy="9" rx="2.2" ry="3" fill="#fff" opacity=".4"/></symbol>

<symbol id="tsi-spa" viewBox="0 0 48 48"><path d="M24 40C9.5 40 4.5 33 6 21.5 20 22 25 29 24 40z" fill="url(#tsg-green)"/><path d="M24 40c14.5 0 19.5-7 18-18.5C28 22 23 29 24 40z" fill="url(#tsg-teal)"/><path d="M24 40c-4.5-8-4.5-16 0-23 4.5 7 4.5 15 0 23z" fill="url(#tsg-pink)"/><path d="M12 27c5 1.6 8.6 5.4 10.5 11" fill="none" stroke="#fff" stroke-width="1.8" opacity=".45" stroke-linecap="round"/></symbol>

<symbol id="tsi-bag" viewBox="0 0 48 48"><path d="M17 18v-4.5a7 7 0 0 1 14 0V18" fill="none" stroke="#94a3b8" stroke-width="3.2" stroke-linecap="round"/><path d="M9.5 16h29l2 23.5a3.2 3.2 0 0 1-3.2 3.5H10.7a3.2 3.2 0 0 1-3.2-3.5z" fill="url(#tsg-purple)"/><path d="M12.5 19h4l-1.6 21h-3.6z" fill="#fff" opacity=".22"/></symbol>

<symbol id="tsi-paw" viewBox="0 0 48 48"><ellipse cx="24" cy="32.5" rx="10" ry="8" fill="url(#tsg-choc)"/><ellipse cx="11.5" cy="22" rx="4.6" ry="5.8" fill="url(#tsg-choc)"/><ellipse cx="36.5" cy="22" rx="4.6" ry="5.8" fill="url(#tsg-choc)"/><ellipse cx="18" cy="13.5" rx="4.4" ry="5.6" fill="url(#tsg-choc)"/><ellipse cx="30" cy="13.5" rx="4.4" ry="5.6" fill="url(#tsg-choc)"/><ellipse cx="20" cy="29" rx="3.4" ry="2.4" fill="#fff" opacity=".28"/></symbol>

<symbol id="tsi-dumbbell" viewBox="0 0 48 48"><rect x="16" y="21" width="16" height="6" rx="3" fill="url(#tsg-steel)"/><rect x="9" y="14.5" width="8" height="19" rx="3.4" fill="url(#tsg-dark)"/><rect x="31" y="14.5" width="8" height="19" rx="3.4" fill="url(#tsg-dark)"/><rect x="3.5" y="19" width="5.5" height="10" rx="2.6" fill="url(#tsg-steel)"/><rect x="39" y="19" width="5.5" height="10" rx="2.6" fill="url(#tsg-steel)"/><rect x="10.8" y="17" width="2.4" height="9" rx="1.2" fill="#fff" opacity=".3"/></symbol>

<symbol id="tsi-ball" viewBox="0 0 48 48"><circle cx="24" cy="24" r="16.5" fill="url(#tsg-white)"/><circle cx="24" cy="24" r="16.5" fill="none" stroke="#c8d2de" stroke-width="1.6"/><path d="M24 14.5l7.2 5.2-2.7 8.5h-9l-2.7-8.5z" fill="#2b3648"/><path d="M24 7.5v7M38.5 19l-6.8 1M33 37l-4.2-5.6M15 37l4.2-5.6M9.5 19l6.8 1" stroke="#2b3648" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="17" cy="14" rx="4.5" ry="3" fill="#fff" opacity=".6"/></symbol>

<symbol id="tsi-book" viewBox="0 0 48 48"><path d="M6 9.5h15.5A4.5 4.5 0 0 1 26 14v25a5 5 0 0 0-5-5H6z" fill="url(#tsg-blue)"/><path d="M42 9.5H26.5A4.5 4.5 0 0 0 22 14v25a5 5 0 0 1 5-5h15z" fill="url(#tsg-teal)"/><path d="M9.5 14H20M9.5 19H20M28 14h10.5M28 19h10.5" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/><path d="M22 14a4.5 4.5 0 0 1 4.5-4.5h0A4.5 4.5 0 0 0 22 14v25z" fill="#0f172a" opacity=".25"/></symbol>

<symbol id="tsi-car" viewBox="0 0 48 48"><path d="M6.5 32v-5.5l3.8-8.8A5.5 5.5 0 0 1 15.4 14h17.2a5.5 5.5 0 0 1 5.1 3.7L41.5 26.5V32a2.5 2.5 0 0 1-2.5 2.5H9a2.5 2.5 0 0 1-2.5-2.5z" fill="url(#tsg-red)"/><path d="M15.6 17.5h16.8l2.6 7.5H13z" fill="#a9dcff"/><circle cx="14.5" cy="34.5" r="4.8" fill="#2b3648"/><circle cx="33.5" cy="34.5" r="4.8" fill="#2b3648"/><circle cx="14.5" cy="34.5" r="1.8" fill="#c8d2de"/><circle cx="33.5" cy="34.5" r="1.8" fill="#c8d2de"/><rect x="6.8" y="26.5" width="5" height="3.4" rx="1.7" fill="url(#tsg-gold)"/></symbol>

<symbol id="tsi-leaf" viewBox="0 0 48 48"><path d="M40 6.5c0 17.8-9.6 27.2-22 27.2A10 10 0 0 1 7.8 23.7C7.8 12.6 21.9 6.5 40 6.5z" fill="url(#tsg-green)"/><path d="M32.2 14.5 11 37.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".55"/><path d="M29 12c-6 1-10.4 3.6-13.4 7.6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".35"/></symbol>

<symbol id="tsi-shisha" viewBox="0 0 48 48"><path d="M30 26.5c7.6 1.8 10 6.2 7.2 13" fill="none" stroke="url(#tsg-dark)" stroke-width="3.4" stroke-linecap="round"/><ellipse cx="22.5" cy="34" rx="10" ry="9" fill="url(#tsg-purple)"/><rect x="20.5" y="10" width="4" height="17" rx="2" fill="url(#tsg-gold)"/><rect x="16.5" y="24" width="12" height="3.4" rx="1.7" fill="url(#tsg-gold)"/><path d="M17.5 3.5h10l-2 7h-6z" fill="url(#tsg-dark)"/><ellipse cx="17.5" cy="30.5" rx="3" ry="4.2" fill="#fff" opacity=".3" transform="rotate(-25 17.5 30.5)"/></symbol>
</svg>`;

const STAMP_ICON_LABELS = {
  circle: 'Punkt', star: 'Stern', heart: 'Herz', coffee: 'Kaffee', tea: 'Tee', food: 'Restaurant',
  pizza: 'Pizza', cocktail: 'Cocktail', beer: 'Bier', bread: 'Backware', cupcake: 'Cupcake',
  icecream: 'Eis', scissors: 'Schere', nails: 'Nagellack', flower: 'Blüte', spa: 'Wellness',
  bag: 'Einkaufstasche', paw: 'Pfote', dumbbell: 'Hantel', ball: 'Ball', book: 'Buch',
  car: 'Auto', leaf: 'Blatt', shisha: 'Shisha',
};

const STAMP_ICON_IDS = Object.keys(STAMP_ICON_LABELS);

/* Ein Stempel: Kachel + farbiges Icon. Gefüllt = Akzent-Kachel mit voller
   Icon-Farbe, leer = blasse Kachel mit ausgegrautem Icon (siehe .dot-CSS). */
function stampIconShape(icon, accent, extraClass) {
  const id = STAMP_ICON_IDS.includes(icon) ? icon : 'circle';
  const cls = `dot ${extraClass}`.replace(/\s+/g, ' ').trim();
  return `<div class="${cls}"><svg viewBox="0 0 48 48" aria-hidden="true"><use href="#tsi-${id}"/></svg></div>`;
}

/* Zwischenansicht beim ersten Tap auf einem Gerät: neue Karte oder vorhandene
   per Karten-ID zurückholen. Gleiche Farb- und Verlaufslogik wie die Karte. */
function renderStempelStartPage(shop, { error, showRestore, code }) {
  const accent = shop.accent_color || '#6366f1';
  const bg = shop.card_bg_color || '#14131a';
  const isLightBg = luminanceOf(bg) > 0.55;
  const toward = isLightBg ? '#000000' : '#ffffff';
  const away = isLightBg ? '#ffffff' : '#000000';
  const page = cardBackgroundLayers(shop.bg_pattern, accent, bg, isLightBg);

  const cardTop = mixHex(mixHex(bg, away, isLightBg ? 0.60 : 0.16), accent, 0.09);
  const cardMid = mixHex(bg, away, isLightBg ? 0.34 : 0.07);
  const cardLow = mixHex(bg, '#000000', isLightBg ? 0.04 : 0.22);
  const glossColor = isLightBg ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.16)';
  const cardBorder = isLightBg ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.09)';
  const fieldBg = mixHex(bg, toward, isLightBg ? 0.05 : 0.10);
  const fieldLine = mixHex(bg, accent, 0.42);
  const onAccent = luminanceOf(accent) > 0.62 ? '#14110f' : '#ffffff';
  const accentSoft = mixHex(accent, bg, 0.78);
  const accentText = isLightBg ? mixHex(accent, '#000000', 0.18) : mixHex(accent, '#ffffff', 0.18);
  const textColor = isLightBg ? '#15141a' : '#f6f3ee';
  const mutedColor = isLightBg ? '#6b6b6b' : '#9c96a6';

  const logoHtml = shop.logo_key
    ? `<div class="logo-badge"><img src="/photo/${escapeAttr(shop.logo_key)}" alt=""></div>` : '';
  const errorHtml = error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : '';

  return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(shop.name)} — Treuekarte</title>
<style>
  *{box-sizing:border-box;}
  body{
    margin:0; font-family:'Inter',system-ui,-apple-system,sans-serif; color:${textColor};
    background-color:${bg}; background-image:${page.image}; background-size:${page.size};
    background-repeat:${page.repeat}; background-attachment:fixed;
    min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px 20px;
    -webkit-font-smoothing:antialiased;
  }
  .card{
    background:linear-gradient(158deg, ${cardTop} 0%, ${cardMid} 46%, ${cardLow} 100%);
    border:1px solid ${cardBorder}; border-radius:24px; max-width:380px; width:100%;
    padding:30px 24px 26px; position:relative; overflow:hidden;
    box-shadow:0 24px 60px -20px rgba(0,0,0,${isLightBg ? '0.22' : '0.6'});
  }
  .card::before{
    content:''; position:absolute; inset:0; pointer-events:none;
    background:radial-gradient(115% 62% at 8% -14%, ${glossColor} 0%, transparent 62%);
  }
  .card > *{position:relative;}
  .logo-badge{width:52px; height:52px; border-radius:14px; overflow:hidden; margin-bottom:14px; background:${fieldBg};}
  .logo-badge img{width:100%; height:100%; object-fit:cover; display:block;}
  .eyebrow{font-size:0.6rem; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; color:${mutedColor};}
  h1{font-size:1.32rem; line-height:1.22; margin:6px 0 8px; font-weight:700; letter-spacing:-0.015em; overflow-wrap:anywhere;}
  .lead{font-size:0.9rem; line-height:1.45; color:${mutedColor}; margin:0 0 22px;}
  .error{
    margin:0 0 18px; padding:11px 14px; border-radius:12px; font-size:0.84rem; line-height:1.4; font-weight:600;
    background:${mixHex(bg, accent, 0.16)}; border:1px solid ${mixHex(bg, accent, 0.30)}; color:${accentText};
  }
  .btn-primary{
    display:block; width:100%; padding:15px 18px; border:none; border-radius:14px; cursor:pointer;
    background:linear-gradient(150deg, ${mixHex(accent, '#ffffff', 0.18)}, ${accent});
    color:${onAccent}; font-size:0.95rem; font-weight:700; font-family:inherit;
    box-shadow:0 10px 24px -12px ${accentSoft};
  }
  details{margin-top:14px;}
  summary{
    list-style:none; cursor:pointer; text-align:center; padding:13px 18px; border-radius:14px;
    border:1px solid ${fieldLine}; color:${accentText}; font-size:0.9rem; font-weight:600;
  }
  summary::-webkit-details-marker{display:none;}
  details[open] summary{margin-bottom:14px;}
  .hint{font-size:0.8rem; line-height:1.45; color:${mutedColor}; margin:0 0 12px;}
  input[name="code"]{
    width:100%; padding:14px 16px; border-radius:12px; border:1px solid ${fieldLine};
    background:${fieldBg}; color:${textColor}; font-family:inherit; font-size:1.15rem; font-weight:700;
    letter-spacing:0.16em; text-align:center; text-transform:uppercase;
  }
  input[name="code"]::placeholder{color:${mutedColor}; letter-spacing:0.16em; font-weight:600;}
  input[name="code"]:focus{outline:2px solid ${accent}; outline-offset:1px;}
  .btn-secondary{
    display:block; width:100%; margin-top:12px; padding:14px 18px; border-radius:12px; cursor:pointer;
    border:1px solid ${accent}; background:transparent; color:${accentText};
    font-size:0.9rem; font-weight:700; font-family:inherit;
  }
</style></head>
<body>
  <div class="card">
    ${logoHtml}
    <span class="eyebrow">Treuekarte</span>
    <h1>${escapeHtml(shop.name)}</h1>
    <p class="lead">Willkommen! Sammel ab jetzt Stempel — nach ${shop.reward_threshold} gibt's: ${escapeHtml(shop.reward_text || 'deine Belohnung')}.</p>
    ${errorHtml}
    <form method="post">
      <input type="hidden" name="action" value="new">
      <button class="btn-primary" type="submit">Neue Karte starten</button>
    </form>
    <details${showRestore ? ' open' : ''}>
      <summary>Ich habe schon eine Karte</summary>
      <p class="hint">Tipp die ${CARD_CODE_LENGTH}-stellige Karten-ID ein, die auf deiner Karte unter „Karte" steht.</p>
      <form method="post">
        <input type="hidden" name="action" value="restore">
        <input type="text" name="code" value="${escapeAttr(code || '')}" maxlength="${CARD_CODE_LENGTH}"
          placeholder="${'X'.repeat(CARD_CODE_LENGTH)}" autocomplete="off" autocapitalize="characters"
          spellcheck="false" aria-label="Karten-ID" required>
        <button class="btn-secondary" type="submit">Karte wiederherstellen</button>
      </form>
    </details>
  </div>
</body></html>`;
}

/* Spaltenzahl fürs Stempelraster — teilerfreundlich, damit keine halbe Reihe übrig bleibt */
function stampColumns(total) {
  if (total <= 5) return total;
  for (const c of [5, 6, 4]) if (total % c === 0) return c;
  return 5;
}

function renderStempelTapPage(shop, customer, { isNew, cooldownHit, rewardReached, platform, news }, origin) {
  const accent = shop.accent_color || '#6366f1';
  const bg = shop.card_bg_color || '#14131a';
  const isLightBg = luminanceOf(bg) > 0.55;
  const toward = isLightBg ? '#000000' : '#ffffff';
  const away = isLightBg ? '#ffffff' : '#000000';

  /* Seitenhintergrund: Verlauf plus gewählter Licht-/Musterstil (siehe cardBackgroundLayers). */
  const page = cardBackgroundLayers(shop.bg_pattern, accent, bg, isLightBg);
  const cardTop = mixHex(mixHex(bg, away, isLightBg ? 0.60 : 0.16), accent, 0.09);
  const cardMid = mixHex(bg, away, isLightBg ? 0.34 : 0.07);
  const cardLow = mixHex(bg, '#000000', isLightBg ? 0.04 : 0.22);
  const glossColor = isLightBg ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.16)';

  const panelTop = mixHex(bg, toward, isLightBg ? 0.05 : 0.09);
  const panelLow = mixHex(bg, toward, isLightBg ? 0.10 : 0.03);
  const panelBorder = mixHex(bg, toward, isLightBg ? 0.16 : 0.18);
  const tileEmpty = mixHex(bg, toward, isLightBg ? 0.07 : 0.06);
  const tileFillHi = isLightBg ? mixHex(bg, '#ffffff', 0.95) : mixHex(bg, '#ffffff', 0.20);
  const tileFillLo = isLightBg ? mixHex(bg, '#ffffff', 0.70) : mixHex(bg, '#ffffff', 0.09);
  const tileEmptyLine = mixHex(bg, accent, 0.42);
  const iconMuted = mixHex(bg, accent, 0.55);
  const onAccent = luminanceOf(accent) > 0.62 ? '#14110f' : '#ffffff';
  const accentSoft = mixHex(accent, bg, 0.78);
  const accentText = isLightBg ? mixHex(accent, '#000000', 0.18) : mixHex(accent, '#ffffff', 0.18);

  const textColor = isLightBg ? '#15141a' : '#f6f3ee';
  const mutedColor = isLightBg ? '#6b6b6b' : '#9c96a6';
  const cardBorder = isLightBg ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.09)';

  const message = cooldownHit
    ? 'Dieser Stempel wurde gerade schon erfasst — versuch es beim nächsten Besuch nochmal.'
    : rewardReached
      ? 'Belohnung erreicht!'
      : isNew ? 'Willkommen! Dein erster Stempel ist da.' : 'Stempel hinzugefügt!';
  const newestIndex = cooldownHit ? -1 : customer.stamps - 1;
  const total = shop.reward_threshold;
  const done = Math.min(customer.stamps, total);
  const remaining = Math.max(0, total - customer.stamps);
  const cols = stampColumns(total);
  const bannerHtml = shop.banner_key
    ? `<div class="banner" style="background-image:url('/photo/${escapeAttr(shop.banner_key)}')"></div>` : '';
  const logoHtml = shop.logo_key
    ? `<div class="logo-badge"><img src="/photo/${escapeAttr(shop.logo_key)}" alt=""></div>` : '';
  /* iPhone bekommt Apple Wallet, Android Google Wallet, alle anderen beide */
  const walletHtml = [
    platform !== 'Android' ? `<a class="wallet-btn wallet-apple" href="${origin}/wallet/apple/${shop.slug}">
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5zm3-1a1 1 0 0 0-1 1v3h12V5a1 1 0 0 0-1-1H7zm11 6H6v2h12v-2zm0 4H6v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-5z"/></svg>
        Zu Apple Wallet hinzufügen
      </a>` : '',
    platform !== 'iPhone' ? `<a class="wallet-btn" href="${origin}/wallet/google/${shop.slug}">
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.2l7 3.5v8.6l-7 3.5-7-3.5V7.7l7-3.5z"/></svg>
        Zu Google Wallet hinzufügen
      </a>` : '',
  ].join('');
  const linkHtml = (shop.extra_link_url && shop.extra_link_label)
    ? `<a class="extra-link" href="${escapeAttr(normalizeUrl(shop.extra_link_url))}" target="_blank" rel="noopener">${escapeHtml(shop.extra_link_label)}</a>` : '';

  return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(shop.name)} — Treueprogramm</title>
<style>
  @media (prefers-reduced-motion: reduce){ *{animation-duration:0.01ms !important; animation-iteration-count:1 !important;} }
  *{box-sizing:border-box;}
  body{
    margin:0; font-family:'Inter',system-ui,-apple-system,sans-serif; color:${textColor};
    background-color:${bg};
    background-image:${page.image};
    background-size:${page.size};
    background-repeat:${page.repeat};
    background-attachment:fixed;
    min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px 20px; overflow-x:hidden;
    -webkit-font-smoothing:antialiased;
  }
  .card{
    background:linear-gradient(158deg, ${cardTop} 0%, ${cardMid} 46%, ${cardLow} 100%);
    border:1px solid ${cardBorder}; border-radius:24px; overflow:hidden;
    max-width:380px; width:100%; position:relative; z-index:1;
    box-shadow:0 24px 60px -20px rgba(0,0,0,${isLightBg ? '0.22' : '0.6'}), 0 2px 0 0 ${isLightBg ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.06)'} inset;
    animation:cardIn 0.5s cubic-bezier(.16,1,.3,1);
  }
  /* Glanz-Highlight oben links — liegt über dem Verlauf, unter dem Inhalt */
  .card::before{
    content:''; position:absolute; inset:0; pointer-events:none; z-index:0;
    background:radial-gradient(115% 62% at 8% -14%, ${glossColor} 0%, transparent 62%);
  }
  /* Diagonaler Glanzstreifen — gibt der Karte die glasige Anmutung */
  .card::after{
    content:''; position:absolute; inset:0; pointer-events:none; z-index:0;
    background:linear-gradient(104deg, transparent 32%, rgba(255,255,255,${isLightBg ? '0.55' : '0.07'}) 46%, transparent 58%);
  }
  .card > *{position:relative; z-index:1;}
  @keyframes cardIn{ from{opacity:0; transform:translateY(14px);} to{opacity:1; transform:translateY(0);} }
  .banner{height:104px; background-size:cover; background-position:center;}
  .body-pad{padding:${shop.banner_key ? '0 24px 26px' : '26px 24px'};}

  .card-head{display:flex; align-items:flex-start; justify-content:space-between; gap:14px; ${shop.banner_key ? 'padding-top:26px;' : ''}}
  .head-left{display:flex; align-items:center; gap:11px; min-width:0;}
  .logo-badge{
    width:42px; height:42px; border-radius:12px; overflow:hidden; flex:none;
    background:${panelTop}; box-shadow:0 0 0 1px ${panelBorder};
  }
  .logo-badge img{width:100%; height:100%; object-fit:cover; display:block;}
  h1{font-size:1.18rem; line-height:1.2; margin:0; font-weight:700; letter-spacing:-0.015em; overflow-wrap:anywhere;}
  .head-right{text-align:right; flex:none;}
  .eyebrow{font-size:0.6rem; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; color:${mutedColor}; display:block;}
  .progress-value{font-size:1.6rem; font-weight:800; line-height:1.05; letter-spacing:-0.02em; display:block; margin-top:3px;}
  .progress-value .sep, .progress-value .of{color:${mutedColor}; font-weight:600;}

  .msg{
    display:inline-block; margin:16px 0 14px; padding:7px 13px; border-radius:999px;
    background:${mixHex(bg, accent, 0.16)}; border:1px solid ${mixHex(bg, accent, 0.30)}; color:${accentText};
    font-weight:600; font-size:0.82rem; line-height:1.35;
  }

  .news{
    margin:0 0 14px; padding:12px 14px; border-radius:14px;
    background:${mixHex(bg, accent, 0.10)}; border:1px solid ${mixHex(bg, accent, 0.26)};
  }
  .news p{margin:4px 0 0; font-size:0.88rem; line-height:1.45; overflow-wrap:anywhere;}
  .stamps-panel{
    background:linear-gradient(170deg, ${panelTop} 0%, ${panelLow} 100%);
    border:1px solid ${panelBorder}; border-radius:18px; padding:16px 15px;
  }
  .stamps{display:grid; grid-template-columns:repeat(${cols},1fr); gap:10px;}
  .dot{
    aspect-ratio:1; border-radius:50%; border:1.5px solid ${tileEmptyLine}; background:${tileEmpty};
    display:flex; align-items:center; justify-content:center; color:${iconMuted};
    transition:background 0.2s, border-color 0.2s;
  }
  .dot svg{width:70%; height:70%; display:block;}
  /* Leerer Stempel: dasselbe Icon, nur ausgegraut — wie ein noch nicht eingelöstes Feld */
  .dot:not(.filled) svg{filter:grayscale(1) opacity(0.32);}
  /* Gefüllt: helle, glänzende Kachel mit Akzentring — die Farbe kommt aus dem Icon */
  .dot.filled{
    border-color:${withAlpha(accent, 0.85)}; color:${accent};
    background:
      radial-gradient(85% 65% at 30% 16%, rgba(255,255,255,${isLightBg ? '0.98' : '0.26'}) 0%, transparent 60%),
      linear-gradient(155deg, ${tileFillHi} 0%, ${tileFillLo} 100%);
    box-shadow:0 5px 14px -5px ${accentSoft}, inset 0 1px 0 rgba(255,255,255,${isLightBg ? '0.9' : '0.22'});
  }
  .dot.newest{animation:stampDown 0.45s cubic-bezier(.34,1.56,.64,1);}
  @keyframes stampDown{ 0%{transform:scale(1.8) rotate(-15deg); opacity:0;} 60%{transform:scale(0.92) rotate(4deg); opacity:1;} 100%{transform:scale(1) rotate(0);} }

  .reward-row{display:flex; align-items:flex-end; justify-content:space-between; gap:14px; margin-top:16px;}
  .reward-text{font-size:0.93rem; font-weight:600; line-height:1.3; margin-top:4px; overflow-wrap:anywhere;}
  .reward-col{min-width:0;}
  .card-no{text-align:right; flex:none;}
  .card-no-value{font-size:0.9rem; font-weight:700; color:${textColor}; margin-top:4px; letter-spacing:0.09em; font-variant-numeric:tabular-nums;}
  .hint{font-size:0.78rem; color:${mutedColor}; margin-top:12px;}
  .hint-sub{margin-top:6px; line-height:1.45;}
  .hint-sub b{color:${textColor}; letter-spacing:0.08em; font-variant-numeric:tabular-nums;}

  .extra-link{
    display:block; text-align:center; margin-top:10px; padding:12px 22px; border-radius:12px;
    border:1px solid ${tileEmptyLine}; color:${accentText}; text-decoration:none; font-size:0.86rem; font-weight:600;
  }
  .wallet-btn{
    display:flex; align-items:center; justify-content:center; gap:8px; margin-top:18px;
    padding:13px 16px; border-radius:12px;
    background:linear-gradient(150deg, ${mixHex(accent, '#ffffff', 0.18)}, ${accent});
    color:${onAccent}; text-decoration:none; font-size:0.88rem; font-weight:700;
    box-shadow:0 10px 24px -12px ${accentSoft};
  }
  .wallet-btn + .wallet-btn{margin-top:10px;}
  .wallet-apple{background:#000; color:#fff; box-shadow:0 10px 24px -12px rgba(0,0,0,0.6);}
  .qr-fallback{margin-top:14px; font-size:0.78rem; color:${mutedColor}; text-align:center;}
  .qr-fallback summary{cursor:pointer; color:${accentText};}
  .qr-fallback #myQr{background:#fff; padding:10px; border-radius:12px;}
  .qr-fallback #myQr svg{width:100%; height:auto; display:block;}
</style></head>
<body>
  ${STAMP_ICON_SPRITE}
  <canvas id="confetti" style="position:fixed; inset:0; pointer-events:none; z-index:0;"></canvas>
  <div class="card">
    ${bannerHtml}
    <div class="body-pad">
      <div class="card-head">
        <div class="head-left">
          ${logoHtml}
          <h1>${escapeHtml(shop.name)}</h1>
        </div>
        <div class="head-right">
          <span class="eyebrow">Fortschritt</span>
          <span class="progress-value">${done}<span class="sep"> / </span><span class="of">${total}</span></span>
        </div>
      </div>
      <div class="msg">${escapeHtml(message)}</div>
      ${news ? `<div class="news"><span class="eyebrow">Neuigkeit</span><p>${escapeHtml(news.text)}</p></div>` : ''}
      <div class="stamps-panel">
        <div class="stamps">
          ${Array.from({ length: total }, (_, i) =>
            stampIconShape(shop.stamp_icon, accent, `${i < customer.stamps ? 'filled' : ''} ${i === newestIndex ? 'newest' : ''}`)
          ).join('')}
        </div>
      </div>
      <div class="reward-row">
        <div class="reward-col">
          <span class="eyebrow">Deine Belohnung</span>
          <div class="reward-text">${escapeHtml(shop.reward_text || '')}</div>
        </div>
        <div class="card-no">
          <span class="eyebrow">Karte</span>
          <div class="card-no-value">${escapeHtml(customer.card_code || '')}</div>
        </div>
      </div>
      <div class="hint">${rewardReached ? 'Zeig diese Karte beim nächsten Besuch vor und lös deine Belohnung ein.' : `Noch ${remaining} ${remaining === 1 ? 'Stempel' : 'Stempel'} bis zur Belohnung.`}</div>
      <div class="hint hint-sub">Neues Handy? Mit dieser Karten-ID holst du die Karte zurück — notier sie dir am besten.</div>
      ${walletHtml}
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
