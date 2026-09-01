export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      if (method === 'POST' && path === '/api/register') return handleRegister(request, env);
      if (method === 'POST' && path === '/api/login') return handleLogin(request, env);
      if (method === 'POST' && path === '/api/update') return handleUpdate(request, env);
      if (method === 'POST' && path === '/api/upload-photo') return handleUploadPhoto(request, env);

      const vcardMatch = path.match(/^\/vk\/([^/]+)\/vcard$/);
      if (method === 'GET' && vcardMatch) return handleVcard(request, env, vcardMatch[1]);

      const vkMatch = path.match(/^\/vk\/([^/]+)$/);
      if (method === 'GET' && vkMatch) return handleCardPage(env, vkMatch[1]);

      const photoMatch = path.match(/^\/photo\/([^/]+)$/);
      if (method === 'GET' && photoMatch) return handlePhoto(env, photoMatch[1]);

      // Alles andere: normale statische Dateien ausliefern (index.html, visitenkarten.html, usw.)
      return env.ASSETS.fetch(request);
    } catch (err) {
      return json({ error: 'Serverfehler: ' + err.message }, 500);
    }
  }
};

// ---------- /api/register ----------
async function handleRegister(request, env) {
  let data;
  try { data = await request.json(); } catch (e) { return json({ error: 'Ungültige Anfrage' }, 400); }

  const name = (data.name || '').trim();
  if (!name) return json({ error: 'Name fehlt' }, 400);

  const birthday = (data.birthday || '').trim();
  const employmentStatus = ['gruender', 'mitarbeiter', 'keiner'].includes(data.employmentStatus)
    ? data.employmentStatus : 'keiner';
  const jobTitle = (data.jobTitle || '').trim();
  const companyName = (data.companyName || '').trim();
  const companyAddress = (data.companyAddress || '').trim();
  const companyWebsite = (data.companyWebsite || '').trim();
  const phone1 = (data.phone1 || '').trim();
  const phone2 = (data.phone2 || '').trim();
  const email1 = (data.email1 || '').trim();
  const email2 = (data.email2 || '').trim();

  const baseSlug = slugify(name);
  let slug = baseSlug;
  let attempt = 1;
  while (await slugExists(env.DB, slug)) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const editCode = generateCode();
  const editCodeHash = await sha256(editCode);
  const id = crypto.randomUUID();
  const now = Date.now();
  const token = crypto.randomUUID();
  const sessionExpires = now + 1000 * 60 * 60 * 24;

  await env.DB.prepare(
    `INSERT INTO businesscards
     (id, slug, edit_code_hash, name, birthday, employment_status, job_title,
      company_name, company_address, company_website, phone1, phone2, email1, email2,
      session_token, session_expires, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, slug, editCodeHash, name, birthday, employmentStatus, jobTitle,
    companyName, companyAddress, companyWebsite, phone1, phone2, email1, email2,
    token, sessionExpires, now, now
  ).run();

  return json({ slug, editCode, token, url: `/vk/${slug}` });
}

// ---------- /api/login ----------
async function handleLogin(request, env) {
  let data;
  try { data = await request.json(); } catch (e) { return json({ error: 'Ungültige Anfrage' }, 400); }

  const slug = (data.slug || '').trim().toLowerCase();
  const editCode = (data.editCode || '').trim().toUpperCase();
  if (!slug || !editCode) return json({ error: 'Bitte Link und Zugangscode angeben' }, 400);

  const row = await env.DB.prepare('SELECT * FROM businesscards WHERE slug = ?').bind(slug).first();
  if (!row) return json({ error: 'Karte nicht gefunden' }, 404);

  const hash = await sha256(editCode);
  if (hash !== row.edit_code_hash) return json({ error: 'Falscher Zugangscode' }, 401);

  const token = crypto.randomUUID();
  const expires = Date.now() + 1000 * 60 * 60 * 24;
  await env.DB.prepare('UPDATE businesscards SET session_token = ?, session_expires = ? WHERE slug = ?')
    .bind(token, expires, slug).run();

  return json({
    token,
    card: {
      slug: row.slug, name: row.name, birthday: row.birthday, photoKey: row.photo_key,
      employmentStatus: row.employment_status, jobTitle: row.job_title,
      companyName: row.company_name, companyAddress: row.company_address, companyWebsite: row.company_website,
      phone1: row.phone1, phone2: row.phone2, email1: row.email1, email2: row.email2
    }
  });
}

// ---------- /api/update ----------
async function handleUpdate(request, env) {
  let data;
  try { data = await request.json(); } catch (e) { return json({ error: 'Ungültige Anfrage' }, 400); }

  const { slug, token } = data;
  if (!slug || !token) return json({ error: 'Sitzung fehlt, bitte neu einloggen' }, 401);

  const row = await env.DB.prepare('SELECT * FROM businesscards WHERE slug = ?').bind(slug).first();
  if (!row) return json({ error: 'Karte nicht gefunden' }, 404);
  if (!row.session_token || row.session_token !== token || Date.now() > row.session_expires) {
    return json({ error: 'Sitzung abgelaufen, bitte neu einloggen' }, 401);
  }

  const employmentStatus = ['gruender', 'mitarbeiter', 'keiner'].includes(data.employmentStatus)
    ? data.employmentStatus : 'keiner';

  await env.DB.prepare(
    `UPDATE businesscards SET
      name = ?, birthday = ?, employment_status = ?, job_title = ?,
      company_name = ?, company_address = ?, company_website = ?,
      phone1 = ?, phone2 = ?, email1 = ?, email2 = ?, updated_at = ?
     WHERE slug = ?`
  ).bind(
    (data.name || row.name).trim(), (data.birthday || '').trim(), employmentStatus,
    (data.jobTitle || '').trim(), (data.companyName || '').trim(), (data.companyAddress || '').trim(),
    (data.companyWebsite || '').trim(), (data.phone1 || '').trim(), (data.phone2 || '').trim(),
    (data.email1 || '').trim(), (data.email2 || '').trim(), Date.now(), slug
  ).run();

  return json({ success: true });
}

// ---------- /api/upload-photo ----------
async function handleUploadPhoto(request, env) {
  let formData;
  try { formData = await request.formData(); } catch (e) { return json({ error: 'Ungültige Anfrage' }, 400); }

  const slug = formData.get('slug');
  const token = formData.get('token');
  const file = formData.get('photo');
  if (!slug || !token || !file) return json({ error: 'Fehlende Angaben' }, 400);

  const row = await env.DB.prepare('SELECT * FROM businesscards WHERE slug = ?').bind(slug).first();
  if (!row) return json({ error: 'Karte nicht gefunden' }, 404);
  if (!row.session_token || row.session_token !== token || Date.now() > row.session_expires) {
    return json({ error: 'Sitzung abgelaufen, bitte neu einloggen' }, 401);
  }
  if (!file.type || !file.type.startsWith('image/')) return json({ error: 'Bitte ein Bild hochladen' }, 400);
  if (file.size > 4 * 1024 * 1024) return json({ error: 'Bild darf maximal 4 MB groß sein' }, 400);

  const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const key = `${slug}-${Date.now()}.${ext}`;

  await env.PHOTOS.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });

  if (row.photo_key) {
    try { await env.PHOTOS.delete(row.photo_key); } catch (e) { /* ggf. schon weg */ }
  }

  await env.DB.prepare('UPDATE businesscards SET photo_key = ?, updated_at = ? WHERE slug = ?')
    .bind(key, Date.now(), slug).run();

  return json({ success: true, photoUrl: `/photo/${key}` });
}

// ---------- GET /photo/:key ----------
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

// ---------- GET /vk/:slug ----------
async function handleCardPage(env, slug) {
  const row = await env.DB.prepare('SELECT * FROM businesscards WHERE slug = ?').bind(slug).first();
  if (!row) return new Response('Diese Visitenkarte wurde nicht gefunden.', { status: 404 });

  const initials = row.name.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const avatarHtml = row.photo_key
    ? `<img class="avatar-img" src="/photo/${row.photo_key}" alt="${escapeHtml(row.name)}">`
    : `<div class="avatar">${initials}</div>`;

  let roleLine = '';
  if (row.employment_status === 'gruender') {
    roleLine = [row.job_title || 'Gründer', row.company_name].filter(Boolean).join(' · ');
  } else if (row.employment_status === 'mitarbeiter') {
    roleLine = [row.job_title, row.company_name].filter(Boolean).join(' bei ');
  }

  const birthdayLine = row.birthday ? formatBirthday(row.birthday) : '';
  const phoneLinks = [row.phone1, row.phone2].filter(Boolean).map(p => `<a href="tel:${escapeHtml(p)}">📞 ${escapeHtml(p)}</a>`).join('');
  const emailLinks = [row.email1, row.email2].filter(Boolean).map(e => `<a href="mailto:${escapeHtml(e)}">✉️ ${escapeHtml(e)}</a>`).join('');
  const websiteLink = row.company_website ? `<a href="${escapeHtml(normalizeUrl(row.company_website))}" target="_blank" rel="noopener">🌐 Website</a>` : '';

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(row.name)} — Tapstern</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{ --bg:#f5f6fb; --card:#ffffff; --ink:#161a2c; --ink-soft:#5b6079; --primary:#6366f1; --primary-bright:#4338ca; --line: rgba(22,26,44,0.10); --navy:#1e2340; }
  *{box-sizing:border-box;}
  body{margin:0; min-height:100vh; background:var(--bg); color:var(--ink); font-family:'Inter',sans-serif; display:flex; align-items:center; justify-content:center; padding:24px;}
  .card{width:100%; max-width:400px; background:var(--card); border:1px solid var(--line); border-radius:24px; padding:36px 30px; text-align:center; box-shadow:0 30px 60px -30px rgba(20,24,31,0.25);}
  .avatar, .avatar-img{width:88px; height:88px; border-radius:50%; margin:0 auto 20px; display:flex; align-items:center; justify-content:center; object-fit:cover;}
  .avatar{background:linear-gradient(135deg,#2b3157,var(--navy)); font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:1.8rem; color:#eef0fb;}
  h1{font-family:'Space Grotesk',sans-serif; font-size:1.4rem; margin:0 0 4px;}
  .role{color:var(--ink-soft); font-size:0.95rem; margin:0 0 4px;}
  .birthday{color:var(--ink-soft); font-size:0.85rem; margin:0 0 22px;}
  .save-btn{display:block; width:100%; padding:15px; border-radius:12px; background:var(--primary); color:#fff; text-decoration:none; font-weight:700; font-size:0.98rem; margin:22px 0;}
  .quick-links{display:flex; flex-direction:column; gap:8px; margin-bottom:20px; text-align:left;}
  .quick-links a{padding:11px 14px; border-radius:10px; border:1px solid var(--line); color:var(--ink); text-decoration:none; font-size:0.86rem; font-weight:600;}
  .address{font-size:0.82rem; color:var(--ink-soft); border-top:1px solid var(--line); padding-top:16px; margin-top:4px;}
  .footer-note{font-size:0.78rem; color:var(--ink-soft); margin-top:16px;}
  .footer-note a{color:var(--primary-bright); text-decoration:none;}
</style>
</head>
<body>
<div class="card">
  ${avatarHtml}
  <h1>${escapeHtml(row.name)}</h1>
  ${roleLine ? `<p class="role">${escapeHtml(roleLine)}</p>` : ''}
  ${birthdayLine ? `<p class="birthday">🎂 ${birthdayLine}</p>` : ''}
  <a class="save-btn" href="/vk/${slug}/vcard" download="${escapeHtml(row.name)}.vcf">Kontakt speichern</a>
  <div class="quick-links">${phoneLinks}${emailLinks}${websiteLink}</div>
  ${row.company_address ? `<p class="address">${escapeHtml(row.company_address)}</p>` : ''}
  <p class="footer-note">powered by <a href="https://tapstern.de" target="_blank" rel="noopener">Tapstern</a></p>
</div>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
}

// ---------- GET /vk/:slug/vcard ----------
async function handleVcard(request, env, slug) {
  const row = await env.DB.prepare('SELECT * FROM businesscards WHERE slug = ?').bind(slug).first();
  if (!row) return new Response('Nicht gefunden', { status: 404 });

  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${row.name}`];
  if (row.employment_status !== 'keiner' && row.company_name) lines.push(`ORG:${row.company_name}`);
  if (row.job_title) lines.push(`TITLE:${row.job_title}`);
  if (row.birthday) lines.push(`BDAY:${row.birthday.replace(/-/g, '')}`);
  if (row.phone1) lines.push(`TEL;TYPE=CELL,VOICE:${row.phone1}`);
  if (row.phone2) lines.push(`TEL;TYPE=WORK,VOICE:${row.phone2}`);
  if (row.email1) lines.push(`EMAIL;TYPE=INTERNET:${row.email1}`);
  if (row.email2) lines.push(`EMAIL;TYPE=INTERNET:${row.email2}`);
  if (row.company_website) lines.push(`URL:${normalizeUrl(row.company_website)}`);
  if (row.company_address) lines.push(`ADR;TYPE=WORK:;;${row.company_address.replace(/\n/g, ';')};;;;`);
  if (row.photo_key) {
    const origin = new URL(request.url).origin;
    lines.push(`PHOTO;VALUE=URI:${origin}/photo/${row.photo_key}`);
  }
  lines.push('END:VCARD');

  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/vcard; charset=UTF-8',
      'Content-Disposition': `attachment; filename="${row.name}.vcf"`
    }
  });
}

// ---------- Helpers ----------
function slugify(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'kontakt';
}
async function slugExists(db, slug) {
  const row = await db.prepare('SELECT 1 FROM businesscards WHERE slug = ?').bind(slug).first();
  return !!row;
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
function formatBirthday(iso) {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const months = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
  return `${parseInt(parts[2], 10)}. ${months[parseInt(parts[1], 10) - 1] || ''}`;
}
function normalizeUrl(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
