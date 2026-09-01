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
      if (method === 'POST' && path === '/api/register') return handleRegister(request, env);
      if (method === 'POST' && path === '/api/login') return handleLogin(request, env);
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

/* ─────────────────────────── /api/register ─────────────────────────── */
async function handleRegister(request, env) {
  const data = await readJson(request);
  if (!data) return json({ error: 'Ungültige Anfrage' }, 400);

  const name = str(data.name);
  if (!name) return json({ error: 'Name fehlt' }, 400);

  const baseSlug = slugify(name);
  let slug = baseSlug, attempt = 1;
  while (await slugExists(env.DB, slug)) { attempt++; slug = `${baseSlug}-${attempt}`; }

  const editCode = generateCode();
  const now = Date.now();
  const token = crypto.randomUUID();

  await env.DB.prepare(
    `INSERT INTO businesscards
     (id, slug, edit_code_hash, name, birthday, employment_status, job_title,
      company_name, bio, accent_color, contacts,
      session_token, session_expires, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    crypto.randomUUID(), slug, await sha256(editCode), name, str(data.birthday),
    employment(data.employmentStatus), str(data.jobTitle), str(data.companyName),
    str(data.bio), color(data.accentColor), normalizeContacts(data.contacts),
    token, now + DAY, now, now
  ).run();

  return json({ slug, editCode, token, url: `/vk/${slug}` });
}

/* ───────────────────────────── /api/login ──────────────────────────── */
async function handleLogin(request, env) {
  const data = await readJson(request);
  if (!data) return json({ error: 'Ungültige Anfrage' }, 400);

  const slug = str(data.slug).toLowerCase();
  const editCode = str(data.editCode).toUpperCase();
  if (!slug || !editCode) return json({ error: 'Bitte Link und Zugangscode angeben' }, 400);

  const row = await card(env, slug);
  if (!row) return json({ error: 'Karte nicht gefunden' }, 404);
  if (await sha256(editCode) !== row.edit_code_hash) return json({ error: 'Falscher Zugangscode' }, 401);

  const token = crypto.randomUUID();
  await env.DB.prepare('UPDATE businesscards SET session_token = ?, session_expires = ? WHERE slug = ?')
    .bind(token, Date.now() + DAY, slug).run();

  return json({ token, card: publicCard(row) });
}

/* ───────────────────────────── /api/update ─────────────────────────── */
async function handleUpdate(request, env) {
  const data = await readJson(request);
  if (!data) return json({ error: 'Ungültige Anfrage' }, 400);

  const row = await authorize(env, data.slug, data.token);
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

  const row = await authorize(env, form.get('slug'), form.get('token'));
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
  const url = new URL(request.url);
  const row = await authorize(env, url.searchParams.get('slug'), url.searchParams.get('token'));
  if (row.error) return json({ error: row.error }, row.status);
  return json({ card: publicCard(row) });
}

/* ───────────────────────────── /api/stats ─────────────────────────── */
async function handleStats(request, env) {
  const url = new URL(request.url);
  const row = await authorize(env, url.searchParams.get('slug'), url.searchParams.get('token'));
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

  ctx.waitUntil(logEvent(env, slug, 'save', source(request), request));

  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${row.name}`];
  if (row.employment_status !== 'keiner' && row.company_name) lines.push(`ORG:${row.company_name}`);
  if (row.job_title) lines.push(`TITLE:${row.job_title}`);
  if (row.birthday) lines.push(`BDAY:${row.birthday.replace(/-/g, '')}`);
  for (const c of parseContacts(row)) {
    const v = str(c.value);
    if (!v) continue;
    const work = c.label === 'Arbeit';
    if (c.kind === 'phone') lines.push(`TEL;TYPE=${c.label === 'Mobil' ? 'CELL,VOICE' : work ? 'WORK,VOICE' : 'HOME,VOICE'}:${v}`);
    else if (c.kind === 'mail') lines.push(`EMAIL;TYPE=INTERNET,${work ? 'WORK' : 'HOME'}:${v}`);
    else if (c.kind === 'web') lines.push(`URL:${contactHref(c)}`);
    else if (c.kind === 'address') lines.push(`ADR;TYPE=${work ? 'WORK' : 'HOME'}:;;${v.replace(/,\s*/g, ';')};;;;`);
    else if (c.kind === 'social') lines.push(`X-SOCIALPROFILE;TYPE=${c.label.toLowerCase()}:${contactHref(c)}`);
  }
  if (row.bio) lines.push(`NOTE:${row.bio.replace(/\r?\n/g, '\\n')}`);
  if (row.photo_key) lines.push(`PHOTO;VALUE=URI:${new URL(request.url).origin}/photo/${row.photo_key}`);
  lines.push('END:VCARD');

  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/vcard; charset=UTF-8',
      'Content-Disposition': `attachment; filename="${row.name}.vcf"`
    }
  });
}

/* ────────────────────────── GET /vk/:slug ─────────────────────────── */
async function handleCardPage(request, env, ctx, slug) {
  const row = await card(env, slug);
  if (!row) return new Response('Diese Visitenkarte wurde nicht gefunden.', { status: 404 });

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

/* ───────────────────────────── Helpers ────────────────────────────── */
const DAY = 1000 * 60 * 60 * 24;

async function readJson(request) { try { return await request.json(); } catch (e) { return null; } }
function str(v) { return (v == null ? '' : String(v)).trim(); }
function color(v) { const c = str(v).toLowerCase(); return COLORS.includes(c) ? c : COLORS[0]; }
function employment(v) { return ['gruender', 'mitarbeiter', 'keiner'].includes(v) ? v : 'keiner'; }
function card(env, slug) { return env.DB.prepare('SELECT * FROM businesscards WHERE slug = ?').bind(str(slug).toLowerCase()).first(); }

async function authorize(env, slug, token) {
  slug = str(slug).toLowerCase(); token = str(token);
  if (!slug || !token) return { error: 'Sitzung fehlt, bitte neu einloggen', status: 401 };
  const row = await card(env, slug);
  if (!row) return { error: 'Karte nicht gefunden', status: 404 };
  if (!row.session_token || row.session_token !== token || Date.now() > row.session_expires) {
    return { error: 'Sitzung abgelaufen, bitte neu einloggen', status: 401 };
  }
  return row;
}

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
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function normalizeUrl(url) { return /^https?:\/\//i.test(url) ? url : `https://${url}`; }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s).replace(/\n/g, ' '); }
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
}
