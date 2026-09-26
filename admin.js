/* ══ Tapstern Admin — Oberfläche ══
   Regeln: alle Daten laufen durch esc() bzw. textContent; keine Inline-Styles/-Handler
   (CSP); jede Änderung schickt den Header X-Tapstern-Admin (CSRF-Schutz im Server). */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = c => (Number(c || 0) / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  const fmtDate = s => s ? new Date(s * 1000).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '–';
  const fmtDay = s => s ? new Date(s * 1000).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) : '–';
  function ago(s) {
    if (!s) return '–';
    const d = Math.floor(Date.now() / 1000 - s);
    if (d < 60) return 'gerade eben';
    if (d < 3600) return `vor ${Math.floor(d / 60)} Min.`;
    if (d < 86400) return `vor ${Math.floor(d / 3600)} Std.`;
    return `vor ${Math.floor(d / 86400)} T.`;
  }
  const sqlSec = v => v == null ? null : typeof v === 'number' ? (v > 1e12 ? Math.floor(v / 1000) : v) : Math.floor(Date.parse(String(v).replace(' ', 'T') + 'Z') / 1000) || null;

  const state = { me: null, modules: [], route: 'overview', cache: {} };
  const ROLE = { owner: 'Inhaber', admin: 'Admin', viewer: 'Nur lesen' };
  const ORDER_STATUS = {
    neu: ['Neu', 'p-violet'], in_bearbeitung: ['In Bearbeitung', 'p-info'], versendet: ['Versendet', 'p-warn'],
    erledigt: ['Erledigt', 'p-ok'], storniert: ['Storniert', 'p-muted'],
  };
  const PAYMENT = { bezahlt: ['Bezahlt', 'p-ok'], offen: ['Offen', 'p-warn'], rechnung: ['Rechnung', 'p-info'] };
  const ACCESS = {
    trial: ['Im Test', 'p-warn'], subscribed: ['Abo aktiv', 'p-ok'], unlocked: ['Freigeschaltet', 'p-info'],
    expired: ['Test abgelaufen', 'p-muted'], locked: ['Gesperrt', 'p-bad'],
  };

  /* ── Server ── */
  async function api(path, opts = {}) {
    const res = await fetch('/api/admin/' + path, {
      method: opts.method || 'GET',
      headers: { 'X-Tapstern-Admin': '1', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (opts.raw) return res;
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && state.me && !opts.auth) { toast('Sitzung abgelaufen — bitte neu anmelden', true); showAuth('login'); }
    if (!res.ok) throw Object.assign(new Error(data.error || 'Fehler ' + res.status), { status: res.status, data });
    return data;
  }

  function toast(msg, bad) {
    const t = document.createElement('div');
    t.className = 'toast' + (bad ? ' bad' : '');
    t.textContent = msg;
    $('toasts').appendChild(t);
    setTimeout(() => t.remove(), 4200);
  }

  /* ── Überlagerungen: Dialog und Seitenleiste ── */
  function closeOverlay() { $('overlay').innerHTML = ''; $('overlay').classList.add('hide'); }
  function openOverlay(html, kind) {
    $('overlay').innerHTML = `<div class="backdrop" data-action="close"></div><div class="${kind}" role="dialog" aria-modal="true">${html}</div>`;
    $('overlay').classList.remove('hide');
    const first = $('overlay').querySelector('input, select, textarea, button:not([data-action="close"])');
    if (first) first.focus();
    return $('overlay').querySelector('.' + kind);
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('overlay').classList.contains('hide')) closeOverlay(); });

  /* Frischer 2FA-Code für heikle Aktionen — als Dialog statt prompt() */
  function askCode(title, text, extraHtml = '') {
    return new Promise(resolve => {
      const box = openOverlay(`
        <h3>${esc(title)}</h3><p>${esc(text)}</p>${extraHtml}
        <label class="lbl" for="m-code">Aktueller Code aus deiner Authenticator-App</label>
        <input class="input code-input" id="m-code" inputmode="numeric" maxlength="6" autocomplete="one-time-code">
        <div class="actions"><button class="btn btn-ghost" data-action="close">Abbrechen</button><button class="btn btn-primary" id="m-ok">Bestätigen</button></div>`, 'modal');
      const done = v => { closeOverlay(); resolve(v); };
      box.querySelector('#m-code').focus();
      box.querySelector('#m-ok').onclick = () => {
        const extra = {};
        box.querySelectorAll('[data-field]').forEach(el => { extra[el.dataset.field] = el.type === 'checkbox' ? el.checked : el.value; });
        done({ code: box.querySelector('#m-code').value.trim(), ...extra });
      };
      box.querySelector('#m-code').onkeydown = e => { if (e.key === 'Enter') box.querySelector('#m-ok').click(); };
      $('overlay').querySelectorAll('[data-action="close"]').forEach(b => b.onclick = () => done(null));
    });
  }
  function confirmBox(title, text, okLabel = 'Bestätigen', danger) {
    return new Promise(resolve => {
      const box = openOverlay(`<h3>${esc(title)}</h3><p>${esc(text)}</p>
        <div class="actions"><button class="btn btn-ghost" data-action="close">Abbrechen</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="m-ok">${esc(okLabel)}</button></div>`, 'modal');
      box.querySelector('#m-ok').onclick = () => { closeOverlay(); resolve(true); };
      $('overlay').querySelectorAll('[data-action="close"]').forEach(b => b.onclick = () => { closeOverlay(); resolve(false); });
    });
  }
  function showSecretOnce(title, text, secret) {
    const box = openOverlay(`<h3>${esc(title)}</h3><p>${esc(text)}</p><div class="secret" id="m-secret"></div>
      <div class="actions"><button class="btn btn-ghost" id="m-copy">Kopieren</button><button class="btn btn-primary" data-action="close">Fertig</button></div>`, 'modal');
    box.querySelector('#m-secret').textContent = secret;
    box.querySelector('#m-copy').onclick = () => navigator.clipboard.writeText(secret).then(() => toast('Kopiert'));
    $('overlay').querySelectorAll('[data-action="close"]').forEach(b => b.onclick = closeOverlay);
  }

  /* ══ Anmeldung ══ */
  function showAuth(step, extra) {
    state.me = null;
    $('app').classList.add('hide');
    $('auth').classList.remove('hide');
    ['f-login', 'f-totp', 'f-mailrec', 'f-setup', 'f-recovery'].forEach(id => $(id).classList.add('hide'));
    if (step === 'full') return enterApp();
    if (step === 'mailrec') { $('f-mailrec').classList.remove('hide'); $('mr-err').textContent = ''; $('mr-sent').textContent = ''; $('mr-code').value = ''; $('mr-send').focus(); }
    if (step === 'login') { $('f-login').classList.remove('hide'); $('l-pw').value = ''; $('l-email').focus(); }
    if (step === 'totp') { $('f-totp').classList.remove('hide'); $('t-code').value = ''; $('t-code').focus(); }
    if (step === 'setup') startSetup();
    if (step === 'recovery') showRecovery(extra);
  }

  $('f-login').onsubmit = async e => {
    e.preventDefault();
    $('l-err').textContent = '';
    try {
      const d = await api('login', { method: 'POST', body: { email: $('l-email').value.trim(), password: $('l-pw').value }, auth: true });
      state.mustChangePassword = d.mustChangePassword;
      $('l-pw').value = '';
      showAuth(d.stage);
    } catch (err) { $('l-err').textContent = err.message; }
  };

  let useRecovery = false;
  $('t-toggle').onclick = () => {
    useRecovery = !useRecovery;
    $('totp-code-field').classList.toggle('hide', useRecovery);
    $('totp-rec-field').classList.toggle('hide', !useRecovery);
    $('t-toggle').textContent = useRecovery ? 'Doch mit Code aus der App anmelden' : 'Wiederherstellungscode verwenden';
    (useRecovery ? $('t-rec') : $('t-code')).focus();
  };
  $('t-code').oninput = () => { if (/^\d{6}$/.test($('t-code').value)) $('f-totp').requestSubmit(); };
  $('f-totp').onsubmit = async e => {
    e.preventDefault();
    $('t-err').textContent = '';
    try {
      const body = useRecovery ? { recoveryCode: $('t-rec').value.trim() } : { code: $('t-code').value.trim() };
      body.trustDevice = $('t-trust').checked;
      const d = await api('login/totp', { method: 'POST', body, auth: true });
      if (d.recoveryCodesLeft != null) toast(`Wiederherstellungscode verbraucht — noch ${d.recoveryCodesLeft} übrig`, d.recoveryCodesLeft < 3);
      await enterApp();
    } catch (err) {
      $('t-err').textContent = err.message;
      $('t-code').value = '';
      if (err.status === 401 && /neu anmelden/.test(err.message)) setTimeout(() => showAuth('login'), 1400);
    }
  };
  document.querySelectorAll('[data-action="restart"]').forEach(b => b.onclick = () => showAuth('login'));

  /* Handy verloren: Passwort ist bestätigt, jetzt Code per E-Mail */
  $('t-mail').onclick = () => showAuth('mailrec');
  $('mr-back').onclick = () => showAuth('totp');
  $('mr-send').onclick = async () => {
    $('mr-err').textContent = '';
    try {
      const d = await api('recovery/email', { method: 'POST', auth: true });
      $('mr-sent').textContent = `Code gesendet an ${d.sentTo} — gültig 15 Minuten. Auch im Spam-Ordner nachsehen.`;
      $('mr-send').textContent = 'Neuen Code senden';
      $('mr-code').focus();
    } catch (err) {
      $('mr-err').textContent = err.message;
      if (err.status === 401) setTimeout(() => showAuth('login'), 1400);
    }
  };
  $('f-mailrec').onsubmit = async e => {
    e.preventDefault();
    $('mr-err').textContent = '';
    try {
      await api('recovery/email/verify', { method: 'POST', body: { code: $('mr-code').value.trim() }, auth: true });
      toast('Bestätigt — jetzt die Authenticator-App auf dem neuen Handy einrichten');
      showAuth('setup');
    } catch (err) {
      $('mr-err').textContent = err.message;
      if (err.status === 401) setTimeout(() => showAuth('login'), 1400);
    }
  };

  async function startSetup() {
    $('f-setup').classList.remove('hide');
    $('s-err').textContent = '';
    try {
      const d = await api('2fa/setup', { method: 'POST', auth: true });
      $('s-qr').src = d.qr;
      $('s-secret').textContent = d.secret;
      $('s-code').focus();
    } catch (err) { $('s-err').textContent = err.message; }
  }
  $('f-setup').onsubmit = async e => {
    e.preventDefault();
    $('s-err').textContent = '';
    try {
      const d = await api('2fa/enable', { method: 'POST', body: { code: $('s-code').value.trim(), trustDevice: $('s-trust').checked }, auth: true });
      showAuth('recovery', d.recoveryCodes);
    } catch (err) { $('s-err').textContent = err.message; }
  };

  function showRecovery(codes) {
    $('f-recovery').classList.remove('hide');
    $('r-codes').innerHTML = codes.map(c => `<span>${esc(c)}</span>`).join('');
    $('r-ok').checked = false; $('r-continue').disabled = true;
    const text = 'Tapstern Admin — Wiederherstellungscodes\n(jeder Code gilt einmal)\n\n' + codes.join('\n');
    $('r-copy').onclick = () => navigator.clipboard.writeText(text).then(() => toast('Kopiert'));
    $('r-download').onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
      a.download = 'tapstern-admin-wiederherstellungscodes.txt';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $('r-ok').onchange = () => { $('r-continue').disabled = !$('r-ok').checked; };
    $('r-continue').onclick = () => { $('r-codes').innerHTML = ''; enterApp(); };
  }

  /* ══ App ══ */
  async function enterApp() {
    const me = await api('me');
    if (me.stage !== 'full') return showAuth(me.stage === 'setup' ? 'setup' : 'totp');
    state.me = me;
    state.modules = (await api('modules')).modules;
    $('auth').classList.add('hide');
    $('app').classList.remove('hide');
    const name = me.admin.name || me.admin.email;
    $('me-name').textContent = name;
    $('me-role').textContent = ROLE[me.admin.role] + ' · ' + me.admin.email;
    $('me-avatar').textContent = name.split(/[\s@.]/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join('');
    renderNav();
    if (me.mustChangePassword) { location.hash = '#/sicherheit'; toast('Bitte zuerst ein eigenes Passwort festlegen', true); }
    route();
    idleWatch();
  }

  const mod = key => state.modules.find(m => m.key === key) || { key, name: key, icon: '•', color: '#8b7cf6' };
  function setModColor(root) { root.querySelectorAll('[data-mod-color]').forEach(el => el.style.setProperty('--mod', el.dataset.modColor)); }

  function renderNav() {
    const role = state.me.admin.role;
    const items = [
      ['overview', '◈', 'Übersicht'],
      ['bestellungen', '📦', 'Bestellungen'],
      '__MODULES__',
      ...state.modules.filter(m => m.enabled && m.key !== 'shop').map(m => ['modul/' + m.key, m.icon, m.name, m.color]),
      '__KONTO__',
      ['sicherheit', '🔐', 'Sicherheit'],
      ['protokoll', '📜', 'Protokoll'],
      ...(role === 'owner' ? [['team', '👥', 'Team'], ['einstellungen', '⚙️', 'Einstellungen']] : []),
    ];
    $('nav').innerHTML = items.map(it => {
      if (it === '__MODULES__') return '<div class="nav-group">Module</div>';
      if (it === '__KONTO__') return '<div class="nav-group">Verwaltung</div>';
      const [r, ico, label, color] = it;
      return `<a href="#/${r}" data-route="${esc(r)}" ${color ? `data-mod-color="${esc(color)}"` : ''}><span class="ico">${esc(ico)}</span>${esc(label)}${r === 'bestellungen' ? '<span class="badge hide" id="nav-orders"></span>' : ''}</a>`;
    }).join('');
    setModColor($('nav'));
  }

  $('logout').onclick = async () => { try { await api('logout', { method: 'POST' }); } catch (e) {} location.hash = ''; showAuth('login'); };
  $('menu').onclick = () => $('side').classList.toggle('open');
  $('refresh').onclick = () => route();
  window.addEventListener('hashchange', () => { if (state.me) route(); });

  /* Leerlauf: der Server meldet nach 30 Minuten ab — hier sichtbar mitzählen */
  let lastActivity = Date.now();
  ['click', 'keydown', 'mousemove', 'touchstart'].forEach(ev => document.addEventListener(ev, () => { lastActivity = Date.now(); }, { passive: true }));
  let idleTimer;
  function idleWatch() {
    clearInterval(idleTimer);
    idleTimer = setInterval(async () => {
      if (!state.me) return;
      const idleMin = (Date.now() - lastActivity) / 60000;
      const left = Math.max(0, Math.ceil((state.me.idleMinutes || 30) - idleMin));
      $('session-text').textContent = left <= 5 ? `Abmeldung in ${left} Min.` : 'Sitzung aktiv';
      if (left <= 0) { toast('Aus Sicherheitsgründen abgemeldet (Inaktivität)'); try { await api('logout', { method: 'POST' }); } catch (e) {} showAuth('login'); }
    }, 20000);
  }

  const ROUTES = {
    overview: ['Übersicht', 'Alles Wichtige aus allen Modulen', viewOverview],
    bestellungen: ['Bestellungen', 'Shop, Aufsteller und Business Hub — alles an einem Ort', viewOrders],
    sicherheit: ['Sicherheit', 'Dein Konto, Zwei-Faktor, Sitzungen und Datensicherung', viewSecurity],
    protokoll: ['Protokoll', 'Wer hat wann was gemacht', viewAudit],
    team: ['Team', 'Admin-Konten und Rollen', viewTeam],
    einstellungen: ['Einstellungen', 'Module benennen und gestalten', viewSettings],
  };

  async function route() {
    const r = (location.hash.replace(/^#\/?/, '') || 'overview');
    state.route = r;
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.dataset.route === r));
    $('side').classList.remove('open');
    closeOverlay();
    /* Jede Ansicht rendert in einen eigenen Container: kommt eine langsame, ältere
       Antwort erst nach einem Wechsel an, landet sie im abgehängten Container. */
    const view = document.createElement('div');
    view.className = 'view-inner';
    $('view').replaceChildren(view);
    view.innerHTML = '<div class="grid g-4"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>';
    let title, sub, fn;
    if (r.startsWith('modul/')) {
      const m = mod(r.slice(6));
      title = `${m.icon} ${m.name}`; sub = m.description || '';
      fn = { tapstempel: viewTapstempel, business_hub: viewHub, visitenkarten: viewCards }[m.key];
    } else [title, sub, fn] = ROUTES[r] || ROUTES.overview;
    $('title').textContent = title;
    $('subtitle').textContent = sub;
    document.title = title.replace(/^\S+\s/, '') + ' · Tapstern Admin';
    try { await (fn || viewOverview)(view); }
    catch (err) { if (err.status !== 401) view.innerHTML = `<div class="card empty"><b>Das hat nicht geklappt</b>${esc(err.message)}</div>`; }
  }

  /* ══ Übersicht ══ */
  async function viewOverview(view) {
    const d = await api('overview');
    const t = d.tapstempel, h = d.hub, v = d.visitenkarten;
    const badge = $('nav-orders');
    if (badge) { badge.textContent = d.openOrders; badge.classList.toggle('hide', !d.openOrders); }
    const tile = (key, ico, label, value, foot) => `<div class="card kpi" data-mod-color="${esc(mod(key).color)}"><small><span class="ico">${ico}</span>${label}</small><strong>${value}</strong><div class="foot">${foot}</div></div>`;
    const missing = d.security.filter(s => !s.ok);
    view.innerHTML = `
      <div class="grid g-4">
        ${tile('shop', '💶', 'Umsatz · 30 Tage', eur(d.revenue30Cents), 'bezahlte Bestellungen')}
        ${tile('shop', '📦', 'Offene Bestellungen', d.openOrders, `${d.unpaidOrders} davon noch nicht bezahlt`)}
        ${tile('tapstempel', '🎟️', 'Aktive Läden', t.subscribed + t.unlocked, `${t.trial} im Test · ${t.expired} abgelaufen`)}
        ${tile('visitenkarten', '🪪', 'Visitenkarten online', v.published, `${v.views7} Aufrufe in 7 Tagen`)}
      </div>
      <div class="grid g-main" id="ov-row">
        <div class="card">
          <div class="card-head"><div><h3>Umsatz der letzten 30 Tage</h3><p class="card-sub">Bezahlte Bestellungen pro Tag, alle Module</p></div><b class="num">${eur(d.revenue30Cents)}</b></div>
          <div class="chart" id="rev-chart"></div>
        </div>
        <div class="card">
          <h3>Sicherheit</h3><p class="card-sub">${missing.length ? `${missing.length} Punkt(e) offen` : 'Alles eingerichtet'}</p>
          <ul class="checklist">${d.security.map(s => `<li><span class="st ${s.ok ? 'ok' : 'no'}">${s.ok ? '✓' : '!'}</span><span>${esc(s.label)}</span></li>`).join('')}</ul>
        </div>
      </div>
      <div class="grid g-3" id="ov-mods">
        ${modCard('tapstempel', [[t.shops, 'Läden'], [t.customers, 'Kunden'], [t.stamps7, 'Stempel 7 T']])}
        ${modCard('business_hub', [[h.pages, 'Seiten'], [h.published, 'online'], [h.review, 'zur Prüfung']])}
        ${modCard('visitenkarten', [[v.users, 'Konten'], [v.cards, 'Karten'], [v.published, 'online']])}
      </div>
      <div class="grid g-2" id="ov-lists">
        <div class="card"><div class="card-head"><h3>Neueste Bestellungen</h3><a href="#/bestellungen">Alle ansehen →</a></div>${ordersTable(d.latestOrders, true)}</div>
        <div class="card"><div class="card-head"><h3>Letzte Aktivität</h3><a href="#/protokoll">Protokoll →</a></div>
          ${d.recentActivity.length ? `<ul class="feed">${d.recentActivity.map(a => `<li><span>${esc(auditLabel(a.action))}${a.target ? ` <span class="faint">· ${esc(a.target)}</span>` : ''}<br><span class="faint">${esc(a.admin_email || 'System')}</span></span><span class="when">${ago(a.created_at)}</span></li>`).join('')}</ul>` : '<div class="empty">Noch keine Aktivität</div>'}
        </div>
      </div>`;
    ['ov-row', 'ov-mods', 'ov-lists'].forEach(id => $(id).classList.add('spaced'));
    setModColor(view);
    view.querySelectorAll('.mod-card').forEach(c => c.onclick = () => { location.hash = '#/modul/' + c.dataset.key; });
    bindOrderRows(view, d.latestOrders);
    barChart($('rev-chart'), d.revenueDaily);
  }

  function modCard(key, stats) {
    const m = mod(key);
    if (!m.enabled) return '';
    return `<div class="card mod-card" data-key="${esc(key)}" data-mod-color="${esc(m.color)}" tabindex="0">
      <div class="mod-title"><span class="mod-icon">${esc(m.icon)}</span><div>${esc(m.name)}<div class="cell-sub">${esc(m.description || '')}</div></div></div>
      <div class="mod-stats">${stats.map(([n, l]) => `<div><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join('')}</div></div>`;
  }

  /* Säulen: eine Farbe, schmale Balken, 4px abgerundet oben, 2px Abstand, Tooltip beim Überfahren */
  function barChart(host, values) {
    const W = 640, H = 190, padL = 44, padB = 22, padT = 8;
    const max = Math.max(...values, 1);
    const step = niceStep(max);
    const top = Math.ceil(max / step) * step;
    const slot = (W - padL) / values.length;
    const bw = Math.min(16, slot - 2);
    const y = v => padT + (H - padT - padB) * (1 - v / top);
    const ticks = []; for (let t = 0; t <= top; t += step) ticks.push(t);
    const today = Date.now() / 1000;
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Umsatz pro Tag, letzte 30 Tage, Höchstwert ${eur(max)}">`;
    svg += ticks.map(t => `<line class="grid-line" x1="${padL}" x2="${W}" y1="${y(t)}" y2="${y(t)}"/><text class="axis-text" x="${padL - 8}" y="${y(t) + 4}" text-anchor="end">${(t / 100).toLocaleString('de-DE')} €</text>`).join('');
    values.forEach((v, i) => {
      const x = padL + i * slot + (slot - bw) / 2, yy = y(v), h = H - padB - yy;
      if (v > 0) {
        const r = Math.min(4, h);
        svg += `<path class="bar" data-i="${i}" d="M${x},${H - padB} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + bw - r} Q${x + bw},${yy} ${x + bw},${yy + r} V${H - padB} Z"/>`;
      }
      svg += `<rect class="hit" data-i="${i}" x="${padL + i * slot}" y="${padT}" width="${slot}" height="${H - padT}"/>`;
    });
    [0, 14, 29].forEach(i => svg += `<text class="axis-text" x="${padL + i * slot + slot / 2}" y="${H - 5}" text-anchor="middle">${fmtDay(today - (29 - i) * 86400)}</text>`);
    svg += '</svg><div class="tooltip hide"></div>';
    host.innerHTML = svg;
    const tip = host.querySelector('.tooltip');
    host.querySelectorAll('.hit').forEach(hit => {
      hit.addEventListener('mouseenter', () => {
        const i = +hit.dataset.i;
        host.querySelectorAll('.bar').forEach(b => b.classList.toggle('dim', +b.dataset.i !== i));
        tip.innerHTML = `<span class="faint">${fmtDay(today - (29 - i) * 86400)}</span><b>${eur(values[i])}</b>`;
        const box = host.getBoundingClientRect(), hb = hit.getBoundingClientRect();
        tip.style.left = (hb.left - box.left + hb.width / 2) + 'px';
        tip.style.top = (host.querySelector('svg').getBoundingClientRect().height * (y(values[i]) / H)) + 'px';
        tip.classList.remove('hide');
      });
      hit.addEventListener('mouseleave', () => { tip.classList.add('hide'); host.querySelectorAll('.bar').forEach(b => b.classList.remove('dim')); });
    });
  }
  function niceStep(max) {
    const raw = max / 4, pow = Math.pow(10, Math.floor(Math.log10(raw)));
    return [1, 2, 2.5, 5, 10].map(m => m * pow).find(s => s >= raw) || raw;
  }

  /* ══ Bestellungen ══ */
  function ordersTable(orders, compact) {
    if (!orders.length) return '<div class="empty"><b>Keine Bestellungen</b>Sobald jemand bestellt, erscheint es hier.</div>';
    return `<div class="table-wrap"><table class="table responsive"><thead><tr><th>Bestellung</th>${compact ? '' : '<th>Modul</th>'}<th>Betrag</th><th>Zahlung</th><th>Status</th>${compact ? '' : '<th>Datum</th>'}</tr></thead><tbody>
      ${orders.map((o, i) => {
        const m = mod(o.module); const [sl, sc] = ORDER_STATUS[o.status] || ORDER_STATUS.neu; const [pl, pc] = PAYMENT[o.payment] || PAYMENT.offen;
        return `<tr class="clickable" data-order="${i}">
          <td data-l="Bestellung"><div class="cell-main">${esc(o.customer.name || 'Unbekannt')}</div><div class="cell-sub">${esc(o.title)}</div></td>
          ${compact ? '' : `<td data-l="Modul"><span class="mod-tag" data-mod-color="${esc(m.color)}"><i></i>${esc(m.name)}</span></td>`}
          <td data-l="Betrag" class="num">${eur(o.amountCents)}</td>
          <td data-l="Zahlung"><span class="pill ${pc}">${pl}</span></td>
          <td data-l="Status"><span class="pill ${sc}">${sl}</span></td>
          ${compact ? '' : `<td data-l="Datum" class="cell-sub">${fmtDate(o.createdAt)}</td>`}
        </tr>`;
      }).join('')}</tbody></table></div>`;
  }
  function bindOrderRows(root, orders) {
    root.querySelectorAll('tr[data-order]').forEach(tr => tr.onclick = () => openOrder(orders[+tr.dataset.order]));
  }

  async function viewOrders(view) {
    const { orders } = await api('orders');
    state.cache.orders = orders;
    let fStatus = 'offen', fMod = 'alle', q = '';
    const render = () => {
      const list = orders.filter(o =>
        (fStatus === 'alle' || (fStatus === 'offen' ? !['erledigt', 'storniert'].includes(o.status) : o.status === fStatus)) &&
        (fMod === 'alle' || o.module === fMod) &&
        (!q || [o.customer.name, o.customer.email, o.title, o.id].some(x => String(x || '').toLowerCase().includes(q))));
      const cnt = st => orders.filter(o => st === 'offen' ? !['erledigt', 'storniert'].includes(o.status) : st === 'alle' || o.status === st).length;
      const modKeys = [...new Set(orders.map(o => o.module))];
      view.innerHTML = `
        <div class="toolbar">
          <input class="input" id="o-q" placeholder="Suchen: Kunde, E-Mail, Bestellnummer …" value="${esc(q)}">
          <div class="chips">${[['offen', 'Offen'], ...Object.entries(ORDER_STATUS).map(([k, [l]]) => [k, l]), ['alle', 'Alle']].map(([k, l]) => `<button class="chip ${fStatus === k ? 'on' : ''}" data-st="${k}">${l} <b>${cnt(k)}</b></button>`).join('')}</div>
        </div>
        <div class="toolbar"><div class="chips">${[['alle', 'Alle Module'], ...modKeys.map(k => [k, mod(k).name])].map(([k, l]) => `<button class="chip ${fMod === k ? 'on' : ''}" data-mod="${esc(k)}">${esc(l)}</button>`).join('')}</div></div>
        <div class="card">${ordersTable(list)}</div>`;
      setModColor(view);
      bindOrderRows(view, list);
      view.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { fStatus = b.dataset.st; render(); });
      view.querySelectorAll('[data-mod]').forEach(b => b.onclick = () => { fMod = b.dataset.mod; render(); });
      const qi = $('o-q'); qi.oninput = () => { q = qi.value.trim().toLowerCase(); const pos = qi.selectionStart; render(); $('o-q').focus(); $('o-q').setSelectionRange(pos, pos); };
    };
    render();
  }

  function openOrder(o) {
    const m = mod(o.module);
    const writable = state.me.admin.role !== 'viewer';
    const box = openOverlay(`
      <div class="card-head"><div><span class="mod-tag" data-mod-color="${esc(m.color)}"><i></i>${esc(m.name)}</span><h2>${esc(o.customer.name || 'Bestellung')}</h2><div class="cell-sub mono">${esc(o.id)}</div></div><button class="btn btn-ghost btn-sm" data-action="close">✕</button></div>
      <dl class="kv">
        <dt>Datum</dt><dd>${fmtDate(o.createdAt)}</dd>
        <dt>Zahlung</dt><dd><span class="pill ${(PAYMENT[o.payment] || PAYMENT.offen)[1]}">${(PAYMENT[o.payment] || PAYMENT.offen)[0]}</span></dd>
        ${o.customer.contact ? `<dt>Ansprechpartner</dt><dd>${esc(o.customer.contact)}</dd>` : ''}
        ${o.customer.email ? `<dt>E-Mail</dt><dd><a href="mailto:${esc(o.customer.email)}">${esc(o.customer.email)}</a></dd>` : ''}
        ${o.customer.phone ? `<dt>Telefon</dt><dd>${esc(o.customer.phone)}</dd>` : ''}
        ${o.customer.address ? `<dt>Lieferadresse</dt><dd>${esc(o.customer.address)}</dd>` : ''}
      </dl>
      <table class="items">${o.items.map(i => `<tr><td>${esc(i.qty)}× ${esc(i.name)}</td><td class="num">${i.unitCents ? eur(i.unitCents * i.qty) : ''}</td></tr>`).join('')}
        <tr class="total"><td>Gesamt</td><td class="num">${eur(o.amountCents)}</td></tr></table>
      ${Object.keys(o.details || {}).length ? `<dl class="kv">${Object.entries(o.details).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}
      <div class="field"><label class="lbl" for="d-status">Status</label><select class="input" id="d-status" ${writable ? '' : 'disabled'}>${Object.entries(ORDER_STATUS).map(([k, [l]]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label class="lbl" for="d-note">Interne Notiz</label><textarea class="input" id="d-note" placeholder="z. B. Sendungsnummer, Absprachen …" ${writable ? '' : 'disabled'}></textarea></div>
      ${writable && o.payment !== 'bezahlt' ? '<label class="check"><input type="checkbox" id="d-paid"> Zahlungseingang geprüft — als bezahlt markieren</label>' : ''}
      ${writable ? '<div class="toolbar"><button class="btn btn-primary" id="d-save">Speichern</button><button class="btn btn-ghost" data-action="close">Schließen</button></div>' : ''}`, 'drawer');
    box.querySelector('#d-note').value = o.note || '';
    setModColor(box);
    $('overlay').querySelectorAll('[data-action="close"]').forEach(b => b.onclick = closeOverlay);
    const save = box.querySelector('#d-save');
    if (save) save.onclick = async () => {
      try {
        await api(`orders/${o.source}/${encodeURIComponent(o.id)}`, { method: 'POST', body: { status: $('d-status').value, note: $('d-note').value, markPaid: !!(box.querySelector('#d-paid') || {}).checked } });
        toast('Bestellung gespeichert'); closeOverlay(); route();
      } catch (err) { toast(err.message, true); }
    };
  }

  /* ══ Tapstempel ══ */
  async function viewTapstempel(view) {
    const { shops } = await api('tapstempel/shops');
    const writable = state.me.admin.role !== 'viewer';
    let filter = 'alle', q = '', tab = 'shops', notices = null;
    const tabs = () => `<div class="toolbar"><div class="chips"><button class="chip ${tab === 'shops' ? 'on' : ''}" data-tab="shops">Läden <b>${shops.length}</b></button><button class="chip ${tab === 'notices' ? 'on' : ''}" data-tab="notices">Nachrichten & Feedback${notices ? ` <b>${notices.answers.length}</b>` : ''}</button></div>
      ${writable ? '<button class="btn btn-primary btn-sm" id="n-all">✉️ Nachricht an alle Läden</button>' : ''}</div>`;
    const wireTabs = () => {
      view.querySelectorAll('[data-tab]').forEach(b => b.onclick = async () => { tab = b.dataset.tab; if (tab === 'notices') await loadNotices(); render(); });
      const all = $('n-all'); if (all) all.onclick = () => composeNotice(null);
    };
    const loadNotices = async () => { notices = await api('notices'); };
    const render = () => {
      if (tab === 'notices') return renderNotices();
      const verified = shops.filter(s => s.verified);
      const cnt = k => k === 'alle' ? verified.length : k === 'unbestaetigt' ? shops.length - verified.length : verified.filter(s => s.access.state === k).length;
      const list = shops.filter(s => (filter === 'unbestaetigt' ? !s.verified : s.verified && (filter === 'alle' || s.access.state === filter)) &&
        (!q || [s.name, s.email, s.phone, s.first_name, s.last_name, s.slug, s.branche].some(x => String(x || '').toLowerCase().includes(q))));
      view.innerHTML = tabs() + `
        <div class="toolbar"><input class="input" id="t-q" placeholder="Laden, E-Mail, Telefon …" value="${esc(q)}">
          <div class="chips">${[['alle', 'Alle'], ...Object.entries(ACCESS).map(([k, [l]]) => [k, l]), ['unbestaetigt', 'Unbestätigt']].map(([k, l]) => `<button class="chip ${filter === k ? 'on' : ''}" data-f="${k}">${l} <b>${cnt(k)}</b></button>`).join('')}</div></div>
        <div class="card">${list.length ? list.map(s => {
          const [al, ac] = ACCESS[s.access.state] || ACCESS.trial;
          const manual = s.override === 'unlocked' || s.override === 'locked';
          const trial = s.subscription_status === 'active' ? '' : s.access.trialEndsAt ? ` · Test bis ${fmtDate(s.access.trialEndsAt)}` : ' · Test startet beim nächsten Aufruf';
          return `<div class="row-item"><div>
              <div class="cell-main">${esc(s.name)} <a href="/s/${encodeURIComponent(s.slug)}" target="_blank" rel="noopener noreferrer" class="cell-sub">Karte ↗</a></div>
              <div class="cell-sub">${esc([[s.first_name, s.last_name].filter(Boolean).join(' '), s.email, s.phone].filter(Boolean).join(' · '))}</div>
              <div class="cell-sub">${esc(s.branche || 'keine Branche')} · ${esc(s.customers)} Kunden · ${s.subscription_status === 'active' ? `Abo ${s.plan === 'premium' ? 'Premium' : 'Basic'}` : 'kein Abo'}${esc(trial)}${manual ? ' · manuell ' + (s.override === 'locked' ? 'gesperrt' : 'freigeschaltet') : ''}</div>
              ${s.note ? `<div class="note">📝 ${esc(s.note)}</div>` : ''}
              ${writable && s.verified ? `<div class="row-actions">
                ${s.override !== 'unlocked' ? `<button class="btn btn-ok btn-sm" data-a="unlock" data-id="${esc(s.id)}">Freischalten</button>` : ''}
                ${s.override !== 'locked' ? `<button class="btn btn-danger btn-sm" data-a="lock" data-id="${esc(s.id)}">Sperren</button>` : ''}
                ${manual ? `<button class="btn btn-ghost btn-sm" data-a="auto" data-id="${esc(s.id)}">Automatisch</button>` : ''}
                <button class="btn btn-ghost btn-sm" data-a="extend" data-days="1" data-id="${esc(s.id)}">Test +1 Tag</button>
                <button class="btn btn-ghost btn-sm" data-a="extend" data-days="7" data-id="${esc(s.id)}">Test +7 Tage</button>
                <button class="btn btn-ghost btn-sm" data-a="extend" data-days="30" data-id="${esc(s.id)}">Gratismonat +30 Tage</button>
                <button class="btn btn-ghost btn-sm" data-a="note" data-id="${esc(s.id)}">Notiz</button>
                <button class="btn btn-ghost btn-sm" data-msg="${esc(s.id)}">✉️ Nachricht</button>
                <a class="btn btn-ghost btn-sm" href="/api/admin/tapstempel/shops/${encodeURIComponent(s.id)}/sticker" target="_blank" rel="noopener">🖨️ Sticker</a></div>` : ''}
            </div><span class="pill ${s.verified ? ac : 'p-muted'}">${s.verified ? al : 'Unbestätigt'}</span></div>`;
        }).join('') : '<div class="empty"><b>Keine Läden</b>Passe Filter oder Suche an.</div>'}</div>`;
      view.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filter = b.dataset.f; render(); });
      const qi = $('t-q'); qi.oninput = () => { q = qi.value.trim().toLowerCase(); const p = qi.selectionStart; render(); $('t-q').focus(); $('t-q').setSelectionRange(p, p); };
      view.querySelectorAll('[data-a]').forEach(b => b.onclick = () => shopAction(shops.find(s => s.id === b.dataset.id), b.dataset.a, b.dataset.days));
      view.querySelectorAll('[data-msg]').forEach(b => b.onclick = () => composeNotice(shops.find(s => s.id === b.dataset.msg)));
      wireTabs();
    };

    /* Nachrichten-Übersicht mit Status, Lesebestätigung und Antworten */
    const KIND = { info: ['Info', 'p-info'], erinnerung: ['Erinnerung', 'p-warn'], feedback: ['Feedback-Frage', 'p-violet'] };
    const stars = r => r ? '★'.repeat(r) + '☆'.repeat(5 - r) : '';
    const renderNotices = () => {
      const now = Date.now() / 1000;
      const statusOf = n => n.cancelled ? ['Beendet', 'p-muted'] : n.show_from > now ? ['Geplant ab ' + fmtDate(n.show_from), 'p-info']
        : n.expires_at && n.expires_at <= now ? ['Abgelaufen', 'p-muted'] : ['Sichtbar', 'p-ok'];
      const byNotice = {};
      notices.answers.forEach(a => (byNotice[a.notice_id] = byNotice[a.notice_id] || []).push(a));
      view.innerHTML = tabs() + `<div class="card">${notices.notices.length ? notices.notices.map(n => {
        const [sl, sc] = statusOf(n), [kl, kc] = KIND[n.kind] || KIND.info, ans = byNotice[n.id] || [];
        return `<div class="row-item"><div>
            <div class="cell-main">${esc(n.title)}</div>
            <div class="cell-sub">An ${n.target_id ? esc(n.target_name || 'gelöschter Laden') : '<b>alle Läden</b>'} · erstellt ${fmtDate(n.created_at)} von ${esc(n.created_by_email || '–')}${n.expires_at ? ' · bis ' + fmtDate(n.expires_at) : ''}</div>
            <div class="note notice-body">${esc(n.body)}</div>
            <div class="cell-sub">👁 ${esc(n.reads)}× gelesen${n.kind === 'feedback' ? ` · 💬 ${ans.length} Antwort${ans.length === 1 ? '' : 'en'}` : ''}</div>
            ${ans.map(a => `<div class="answer"><b>${esc(a.shop_name || 'Laden')}</b> <span class="stars">${stars(a.rating)}</span> <span class="faint">${ago(a.feedback_at)}</span>${a.feedback ? `<div class="notice-body">${esc(a.feedback)}</div>` : ''}</div>`).join('')}
            ${writable && !n.cancelled && sl !== 'Abgelaufen' ? `<div class="row-actions"><button class="btn btn-ghost btn-sm" data-cancel="${esc(n.id)}">Beenden</button></div>` : ''}
          </div><div class="pill-stack"><span class="pill ${kc}">${kl}</span><span class="pill ${sc}">${esc(sl)}</span></div></div>`;
      }).join('') : '<div class="empty"><b>Noch keine Nachrichten</b>Schreib einem Laden über „✉️ Nachricht“ oder allen oben rechts.</div>'}</div>`;
      view.querySelectorAll('[data-cancel]').forEach(b => b.onclick = async () => {
        if (!(await confirmBox('Nachricht beenden?', 'Sie verschwindet sofort aus den Dashboards. Antworten bleiben erhalten.', 'Beenden', true))) return;
        try { await api(`notices/${encodeURIComponent(b.dataset.cancel)}/cancel`, { method: 'POST', body: {} }); toast('Nachricht beendet'); await loadNotices(); render(); }
        catch (err) { toast(err.message, true); }
      });
      wireTabs();
    };

    /* Nachricht verfassen — an einen Laden oder alle, sofort oder geplant */
    const toLocalInput = sec => { const d = new Date(sec * 1000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
    const composeNotice = shop => {
      const now = Math.floor(Date.now() / 1000);
      const trialEnd = shop?.access?.trialEndsAt;
      const box = openOverlay(`<h3>Nachricht an ${shop ? '„' + esc(shop.name) + '“' : 'alle Läden'}</h3>
        <p>Erscheint oben im Dashboard des Ladens${shop ? '' : ' — bei allen Läden'}, auch wenn der Zugang abgelaufen ist.</p>
        <div class="field"><label class="lbl">Vorlage</label><div class="chips">
          ${trialEnd ? '<button class="chip" data-tpl="ende">Gratiszeit endet bald</button>' : ''}
          <button class="chip" data-tpl="feedback">Nach Feedback fragen</button><button class="chip" data-tpl="danke">Willkommen / Danke</button></div></div>
        <div class="field"><label class="lbl" for="nc-kind">Art</label><select class="input" id="nc-kind"><option value="info">Info</option><option value="erinnerung">Erinnerung (auffällig)</option><option value="feedback">Feedback-Frage (mit Sternen + Antwortfeld)</option></select></div>
        <div class="field"><label class="lbl" for="nc-title">Titel</label><input class="input" id="nc-title" maxlength="100"></div>
        <div class="field"><label class="lbl" for="nc-body">Text</label><textarea class="input" id="nc-body" maxlength="1500" rows="5"></textarea>
          <div class="faint">Platzhalter: {name} = Vorname, {laden} = Ladenname, {testende} = Ende der Test-/Gratiszeit</div></div>
        <div class="grid g-2"><div class="field"><label class="lbl" for="nc-from">Anzeigen ab</label><input class="input" id="nc-from" type="datetime-local"></div>
          <div class="field"><label class="lbl" for="nc-to">Anzeigen bis (optional)</label><input class="input" id="nc-to" type="datetime-local"></div></div>
        <div class="actions"><button class="btn btn-ghost" data-action="close">Abbrechen</button><button class="btn btn-primary" id="nc-ok">${shop ? 'Speichern' : 'An alle Läden senden'}</button></div>`, 'modal');
      $('overlay').querySelectorAll('[data-action="close"]').forEach(b => b.onclick = closeOverlay);
      const f = id => box.querySelector('#' + id);
      f('nc-from').value = toLocalInput(now);
      const TPL = {
        ende: () => { f('nc-kind').value = 'erinnerung'; f('nc-title').value = 'Deine Gratiszeit endet am {testende}';
          f('nc-body').value = 'Hallo {name},\n\ndeine kostenlose Zeit mit Tapstempel endet bald. Damit deine Stempelkarte, der Kartenlink und die Wallet-Karten ohne Unterbrechung weiterlaufen, schließe einfach unter „Abo & Karten“ ein Abo ab. Deine Kunden und Einstellungen bleiben erhalten.\n\nFragen? Schreib uns an anfrage@tapstern.de.';
          f('nc-from').value = toLocalInput(Math.max(now, trialEnd - 5 * 86400)); f('nc-to').value = toLocalInput(trialEnd); },
        feedback: () => { f('nc-kind').value = 'feedback'; f('nc-title').value = 'Wie gefällt dir Tapstempel?';
          f('nc-body').value = 'Hallo {name},\n\nwir möchten Tapstempel für {laden} noch besser machen. Wie zufrieden bist du bisher, und was fehlt dir noch? Deine Antwort liest das Tapstern-Team persönlich.'; f('nc-to').value = ''; },
        danke: () => { f('nc-kind').value = 'info'; f('nc-title').value = 'Willkommen bei Tapstempel!';
          f('nc-body').value = 'Hallo {name},\n\nschön, dass {laden} dabei ist. Bei Fragen erreichst du uns jederzeit unter anfrage@tapstern.de.'; f('nc-to').value = ''; },
      };
      box.querySelectorAll('[data-tpl]').forEach(b => b.onclick = () => { box.querySelectorAll('[data-tpl]').forEach(x => x.classList.toggle('on', x === b)); TPL[b.dataset.tpl](); });
      f('nc-ok').onclick = async () => {
        const sec = v => v ? Math.floor(new Date(v).getTime() / 1000) : null;
        const body = { module: 'tapstempel', targetId: shop?.id || null, kind: f('nc-kind').value, title: f('nc-title').value.trim(), body: f('nc-body').value.trim(),
          showFrom: sec(f('nc-from').value) || now, expiresAt: sec(f('nc-to').value) };
        try {
          await api('notices', { method: 'POST', body }); closeOverlay();
          toast(body.showFrom > now + 60 ? 'Nachricht geplant ab ' + fmtDate(body.showFrom) : 'Nachricht ist jetzt sichtbar');
          if (tab === 'notices') { await loadNotices(); render(); }
        } catch (err) { toast(err.message, true); }
      };
    };
    const shopAction = async (s, action, days) => {
      const body = { action };
      if (action === 'lock' && !(await confirmBox(`„${s.name}“ sperren?`, 'Karte, Link, Stempeln und Wallet werden sofort pausiert.', 'Sperren', true))) return;
      if (action === 'unlock' && !(await confirmBox(`„${s.name}“ freischalten?`, 'Dauerhaft offen, auch ohne Stripe-Abo.', 'Freischalten'))) return;
      if (action === 'extend') body.days = +days;
      if (action === 'note') {
        const box = openOverlay(`<h3>Notiz zu „${esc(s.name)}“</h3><p>Nur für Admins sichtbar.</p><textarea class="input" id="n-text"></textarea>
          <div class="actions"><button class="btn btn-ghost" data-action="close">Abbrechen</button><button class="btn btn-primary" id="n-ok">Speichern</button></div>`, 'modal');
        box.querySelector('#n-text').value = s.note || '';
        $('overlay').querySelectorAll('[data-action="close"]').forEach(b => b.onclick = closeOverlay);
        body.note = await new Promise(res => { box.querySelector('#n-ok').onclick = () => { const v = $('n-text').value; closeOverlay(); res(v); }; });
      }
      try { await api(`tapstempel/shops/${encodeURIComponent(s.id)}/access`, { method: 'POST', body }); toast('Gespeichert'); route(); }
      catch (err) { toast(err.message, true); }
    };
    render();
  }

  /* ══ Business Hub ══ */
  async function viewHub(view) {
    const { pages } = await api('hub/pages');
    const writable = state.me.admin.role !== 'viewer';
    view.innerHTML = `
      <div class="toolbar"><a class="btn btn-primary" href="/hub-admin.html" target="_blank" rel="noopener">Seiten-Editor öffnen ↗</a><span class="faint">Inhalte, Links und Bilder bearbeitest du im Editor — Anmeldung läuft über dieses Admin.</span></div>
      <div class="card">${pages.length ? `<div class="table-wrap"><table class="table responsive"><thead><tr><th>Betrieb</th><th>Status</th><th>Links</th><th>Bestellung</th><th></th></tr></thead><tbody>
        ${pages.map(p => `<tr>
          <td data-l="Betrieb"><div class="cell-main">${esc(p.business_name)}</div><div class="cell-sub">${esc([p.contact_email, p.contact_phone].filter(Boolean).join(' · '))}</div></td>
          <td data-l="Status">${p.published ? '<span class="pill p-ok">Online</span>' : p.ready_for_review ? '<span class="pill p-warn">Zur Prüfung</span>' : '<span class="pill p-muted">Entwurf</span>'}</td>
          <td data-l="Links" class="num">${esc(p.links)}</td>
          <td data-l="Bestellung">${p.paid ? '<span class="pill p-ok">Bezahlt</span>' : p.hosting_years ? '<span class="pill p-warn">Zahlung offen</span>' : '<span class="faint">–</span>'} <span class="cell-sub">${esc(p.card_quantity)} Karten</span></td>
          <td data-l=""><div class="row-actions">
            ${p.published ? `<a class="btn btn-ghost btn-sm" href="/hub/${encodeURIComponent(p.slug)}" target="_blank" rel="noopener noreferrer">Ansehen ↗</a>` : p.previewUrl ? `<a class="btn btn-ghost btn-sm" href="${esc(p.previewUrl)}" target="_blank" rel="noopener noreferrer">Vorschau ↗</a>` : ''}
            ${writable ? `${p.published ? `<button class="btn btn-ghost btn-sm" data-h="unpublish" data-id="${esc(p.id)}">Offline</button>` : `<button class="btn btn-ok btn-sm" data-h="publish" data-id="${esc(p.id)}">Veröffentlichen</button>`}
            ${!p.paid ? `<button class="btn btn-ghost btn-sm" data-h="paid" data-id="${esc(p.id)}">Bezahlt</button>` : ''}
            <button class="btn btn-danger btn-sm" data-h="delete" data-id="${esc(p.id)}">Löschen</button>` : ''}
          </div></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty"><b>Noch keine Seiten</b>Bestellungen über die Business-Hub-Seite erscheinen hier.</div>'}</div>`;
    view.querySelectorAll('[data-h]').forEach(b => b.onclick = async () => {
      const p = pages.find(x => x.id === b.dataset.id), action = b.dataset.h;
      const body = {};
      if (action === 'delete') {
        const r = await askCode(`„${p.business_name}“ löschen?`, 'Seite, Links und Bilder werden endgültig entfernt.');
        if (!r) return; body.code = r.code;
      } else if (action === 'paid' && !(await confirmBox('Als bezahlt markieren?', 'Nur wenn der Zahlungseingang geprüft ist.'))) return;
      try { await api(`hub/pages/${encodeURIComponent(p.id)}/${action}`, { method: 'POST', body }); toast('Gespeichert'); route(); }
      catch (err) { toast(err.message, true); }
    });
  }

  /* ══ Visitenkarten ══ */
  async function viewCards(view) {
    const { users } = await api('visitenkarten');
    const writable = state.me.admin.role !== 'viewer';
    let q = '';
    const render = () => {
      const list = users.filter(u => !q || [u.email, ...u.cards.map(c => c.name + ' ' + c.slug + ' ' + (c.company_name || ''))].some(x => String(x).toLowerCase().includes(q)));
      view.innerHTML = `<div class="toolbar"><input class="input" id="v-q" placeholder="E-Mail, Name, Firma …" value="${esc(q)}"><span class="faint">${users.length} Konten · ${users.reduce((s, u) => s + u.cards.length, 0)} Karten</span></div>
        <div class="card">${list.length ? list.map(u => `<div class="row-item"><div>
            <div class="cell-main">${esc(u.email)} ${u.verified ? '' : '<span class="pill p-warn">unbestätigt</span>'}</div>
            <div class="cell-sub">Seit ${fmtDate(u.createdAt)} · ${u.cards.length} Karte(n)</div>
            ${u.cards.map(c => `<div class="row-actions"><span class="pill ${c.published ? 'p-ok' : 'p-muted'}">${c.published ? 'Online' : 'Offline'}</span>
              <span>${esc(c.name)}${c.company_name ? ` <span class="faint">· ${esc(c.company_name)}</span>` : ''}</span>
              <a href="/vk/${encodeURIComponent(c.slug)}" target="_blank" rel="noopener noreferrer" class="cell-sub">/vk/${esc(c.slug)} ↗</a>
              <span class="cell-sub">${esc(c.views30)} Aufrufe / 30 T</span>
              ${writable ? `<button class="btn btn-ghost btn-sm" data-c="${c.published ? 'unpublish' : 'publish'}" data-id="${esc(c.id)}">${c.published ? 'Offline nehmen' : 'Online stellen'}</button>` : ''}</div>`).join('')}
          </div></div>`).join('') : '<div class="empty"><b>Keine Konten gefunden</b></div>'}</div>`;
      const qi = $('v-q'); qi.oninput = () => { q = qi.value.trim().toLowerCase(); const p = qi.selectionStart; render(); $('v-q').focus(); $('v-q').setSelectionRange(p, p); };
      view.querySelectorAll('[data-c]').forEach(b => b.onclick = async () => {
        if (b.dataset.c === 'unpublish' && !(await confirmBox('Karte offline nehmen?', 'Der Link zeigt dann keine Karte mehr, bis sie wieder online ist.', 'Offline nehmen', true))) return;
        try { await api(`visitenkarten/cards/${encodeURIComponent(b.dataset.id)}/${b.dataset.c}`, { method: 'POST' }); toast('Gespeichert'); route(); }
        catch (err) { toast(err.message, true); }
      });
    };
    render();
  }

  /* ══ Sicherheit ══ */
  async function viewSecurity(view) {
    const [{ sessions, trustedDevices }, me] = await Promise.all([api('sessions'), api('me')]);
    const a = me.admin;
    view.innerHTML = `
      <div class="grid g-2">
        <div class="card"><h3>Dein Konto</h3><p class="card-sub">${esc(a.email)} · ${esc(ROLE[a.role])}</p>
          <ul class="checklist">
            <li><span class="st ok">✓</span><span>Zwei-Faktor-Anmeldung aktiv</span></li>
            <li><span class="st ${me.recoveryCodesLeft >= 3 ? 'ok' : 'no'}">${me.recoveryCodesLeft >= 3 ? '✓' : '!'}</span><span>${esc(me.recoveryCodesLeft)} Wiederherstellungscodes übrig</span></li>
            <li><span class="st ${me.mustChangePassword ? 'no' : 'ok'}">${me.mustChangePassword ? '!' : '✓'}</span><span>${me.mustChangePassword ? 'Einmal-Passwort — bitte jetzt ändern' : 'Eigenes Passwort gesetzt'}</span></li>
          </ul>
          <div class="toolbar spaced"><button class="btn btn-ghost" id="sec-codes">Neue Wiederherstellungscodes</button><button class="btn btn-ghost" id="sec-move">2FA auf neues Handy umziehen</button></div>
        </div>
        <div class="card"><h3>Passwort ändern</h3><p class="card-sub">Mindestens 12 Zeichen. Danach werden alle anderen Sitzungen beendet.</p>
          <div class="field"><label class="lbl" for="pw-cur">Aktuelles Passwort</label><input class="input" id="pw-cur" type="password" autocomplete="current-password"></div>
          <div class="field"><label class="lbl" for="pw-new">Neues Passwort</label><input class="input" id="pw-new" type="password" autocomplete="new-password"></div>
          <div class="field"><label class="lbl" for="pw-new2">Neues Passwort wiederholen</label><input class="input" id="pw-new2" type="password" autocomplete="new-password"></div>
          <button class="btn btn-primary" id="pw-save">Passwort ändern</button>
        </div>
      </div>
      <div class="card spaced"><div class="card-head"><div><h3>Aktive Sitzungen</h3><p class="card-sub">Geräte, auf denen du gerade angemeldet bist. Unbekannt? Sofort beenden und Passwort ändern.</p></div>
        <button class="btn btn-danger btn-sm" id="ses-all" ${sessions.length > 1 ? '' : 'disabled'}>Alle anderen abmelden</button></div>
        <div class="table-wrap"><table class="table responsive"><thead><tr><th>Gerät</th><th>IP</th><th>Angemeldet</th><th>Zuletzt aktiv</th><th></th></tr></thead><tbody>
        ${sessions.map(s => `<tr><td data-l="Gerät"><div class="cell-main">${esc(deviceName(s.userAgent))}</div>${s.current ? '<span class="pill p-ok">Dieses Gerät</span>' : s.stage !== 'full' ? '<span class="pill p-warn">Anmeldung nicht abgeschlossen</span>' : ''}</td>
          <td data-l="IP" class="mono">${esc(s.ip)}</td><td data-l="Angemeldet">${fmtDate(s.createdAt)}</td><td data-l="Zuletzt aktiv">${ago(s.lastSeen)}</td>
          <td data-l="">${s.current ? '' : `<button class="btn btn-ghost btn-sm" data-ses="${esc(s.id)}">Beenden</button>`}</td></tr>`).join('')}</tbody></table></div>
      </div>
      <div class="card spaced"><div class="card-head"><div><h3>Vertraute Geräte</h3><p class="card-sub">Hier reichen E-Mail und Passwort — die 2FA wurde auf dem Gerät schon bestätigt. Gilt 30 Tage. Heikle Aktionen fragen trotzdem nach dem Code. Passwort ändern entfernt alle.</p></div>
        <button class="btn btn-danger btn-sm" id="trust-all" ${trustedDevices.length ? '' : 'disabled'}>Alle entfernen</button></div>
        ${trustedDevices.length ? `<div class="table-wrap"><table class="table responsive"><thead><tr><th>Gerät</th><th>IP</th><th>Zuletzt benutzt</th><th>Gültig bis</th><th></th></tr></thead><tbody>
        ${trustedDevices.map(t => `<tr><td data-l="Gerät"><div class="cell-main">${esc(deviceName(t.userAgent))}</div>${t.current ? '<span class="pill p-ok">Dieses Gerät</span>' : ''}</td>
          <td data-l="IP" class="mono">${esc(t.ip)}</td><td data-l="Zuletzt benutzt">${ago(t.lastUsed)}</td><td data-l="Gültig bis">${fmtDate(t.expiresAt)}</td>
          <td data-l=""><button class="btn btn-ghost btn-sm" data-trust="${esc(t.id)}">Entfernen</button></td></tr>`).join('')}</tbody></table></div>`
        : '<p class="faint">Keine vertrauten Geräte. Beim Anmelden kannst du „Diesem Gerät 30 Tage vertrauen“ ankreuzen.</p>'}
      </div>
      <div class="card spaced"><h3>Datensicherung</h3>
        <p class="card-sub">Lädt alle Daten aller Module als JSON-Datei herunter — ohne Passwörter, Zugangstokens und 2FA-Geheimnisse. Zusätzlich sichert Cloudflare die Datenbank automatisch (D1 Time Travel, 30 Tage zurück).</p>
        ${a.role === 'viewer' ? '<p class="faint">Nur für Admins und Inhaber.</p>' : '<button class="btn btn-primary" id="sec-export">Backup herunterladen</button>'}
      </div>`;
    $('sec-codes').onclick = async () => {
      const r = await askCode('Neue Wiederherstellungscodes', 'Die alten Codes werden sofort ungültig.');
      if (!r) return;
      try {
        const d = await api('recovery-codes', { method: 'POST', body: { code: r.code } });
        showSecretOnce('Neue Wiederherstellungscodes', 'Jetzt sicher speichern — sie werden nur einmal angezeigt.', d.recoveryCodes.join('\n'));
      } catch (err) { toast(err.message, true); }
    };
    $('sec-move').onclick = () => {
      const box = openOverlay(`<h3>2FA auf neues Handy umziehen</h3>
        <p>Danach scannst du einen neuen QR-Code mit dem neuen Handy. Das alte Handy, alle Wiederherstellungscodes und vertrauten Geräte werden ungültig, andere Sitzungen abgemeldet.</p>
        <label class="lbl" for="mv-pw">Passwort</label><input class="input" id="mv-pw" type="password" autocomplete="current-password">
        <label class="lbl spaced" for="mv-code">Code vom alten Handy <span class="faint">oder</span> Wiederherstellungscode</label>
        <input class="input mono" id="mv-code" autocomplete="off" placeholder="123456 oder XXXXX-XXXXX">
        <div class="actions"><button class="btn btn-ghost" data-action="close">Abbrechen</button><button class="btn btn-primary" id="mv-ok">Weiter</button></div>`, 'modal');
      box.querySelector('#mv-ok').onclick = async () => {
        const c = box.querySelector('#mv-code').value.trim();
        const body = { password: box.querySelector('#mv-pw').value, ...(/^\d{6}$/.test(c) ? { code: c } : { recoveryCode: c }) };
        try { await api('2fa/move', { method: 'POST', body }); closeOverlay(); toast('Jetzt das neue Handy einrichten'); showAuth('setup'); }
        catch (err) { toast(err.message, true); }
      };
    };
    $('trust-all').onclick = async () => {
      if (!(await confirmBox('Alle vertrauten Geräte entfernen?', 'Auf allen Geräten wird beim nächsten Login wieder der 2FA-Code verlangt.', 'Entfernen', true))) return;
      await api('trusted-devices/revoke', { method: 'POST', body: { all: true } }); toast('Vertraute Geräte entfernt'); route();
    };
    view.querySelectorAll('[data-trust]').forEach(b => b.onclick = async () => { await api('trusted-devices/revoke', { method: 'POST', body: { id: b.dataset.trust } }); toast('Gerät entfernt'); route(); });
    $('pw-save').onclick = async () => {
      if ($('pw-new').value !== $('pw-new2').value) return toast('Die neuen Passwörter stimmen nicht überein', true);
      const r = await askCode('Passwort ändern', 'Zur Sicherheit mit deinem 2FA-Code bestätigen.');
      if (!r) return;
      try {
        await api('password', { method: 'POST', body: { current: $('pw-cur').value, next: $('pw-new').value, code: r.code } });
        toast('Passwort geändert — andere Sitzungen wurden beendet'); state.me.mustChangePassword = false; route();
      } catch (err) { toast(err.message, true); }
    };
    $('ses-all').onclick = async () => {
      if (!(await confirmBox('Alle anderen Sitzungen beenden?', 'Alle anderen Geräte werden sofort abgemeldet.', 'Beenden', true))) return;
      await api('sessions/revoke', { method: 'POST', body: { all: true } }); toast('Andere Sitzungen beendet'); route();
    };
    view.querySelectorAll('[data-ses]').forEach(b => b.onclick = async () => { await api('sessions/revoke', { method: 'POST', body: { id: b.dataset.ses } }); toast('Sitzung beendet'); route(); });
    const ex = $('sec-export');
    if (ex) ex.onclick = async () => {
      const r = await askCode('Backup herunterladen', 'Die Datei enthält Kundendaten — speichere sie verschlüsselt und lösche alte Kopien.');
      if (!r) return;
      const res = await api('export', { method: 'POST', body: { code: r.code }, raw: true });
      if (!res.ok) return toast((await res.json().catch(() => ({}))).error || 'Export fehlgeschlagen', true);
      const a2 = document.createElement('a');
      a2.href = URL.createObjectURL(await res.blob());
      a2.download = `tapstern-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a2.click(); setTimeout(() => URL.revokeObjectURL(a2.href), 2000);
      toast('Backup heruntergeladen');
    };
  }
  function deviceName(ua) {
    ua = String(ua || '');
    const os = /iPhone|iPad/.test(ua) ? 'iPhone/iPad' : /Android/.test(ua) ? 'Android' : /Mac OS/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Gerät';
    const br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '';
    return br ? `${br} auf ${os}` : os;
  }

  /* ══ Protokoll ══ */
  const AUDIT = {
    'login.erfolgreich': 'Angemeldet', 'login.erfolgreich_mit_wiederherstellungscode': 'Angemeldet (Wiederherstellungscode)',
    'login.fehlgeschlagen': '⚠️ Anmeldung fehlgeschlagen', 'login.2fa_falsch': '⚠️ Falscher 2FA-Code', 'login.2fa_gesperrt': '⚠️ Anmeldung nach 2FA-Fehlern gesperrt',
    'login.passwort_ok': 'Passwort bestätigt', logout: 'Abgemeldet', 'konto.erstes_inhaberkonto_angelegt': 'Inhaber-Konto angelegt',
    'sicherheit.2fa_aktiviert': 'Zwei-Faktor aktiviert', 'sicherheit.passwort_geaendert': 'Passwort geändert',
    'sicherheit.wiederherstellungscodes_neu': 'Neue Wiederherstellungscodes', 'sicherheit.andere_sitzungen_beendet': 'Andere Sitzungen beendet',
    'sicherheit.sitzung_beendet': 'Sitzung beendet', 'team.admin_angelegt': 'Admin angelegt', 'team.role': 'Rolle geändert',
    'team.disable': 'Admin deaktiviert', 'team.enable': 'Admin aktiviert', 'team.delete': 'Admin gelöscht', 'team.zugang_zurueckgesetzt': 'Zugang zurückgesetzt',
    'einstellungen.modul_geaendert': 'Modul geändert', 'bestellung.aktualisiert': 'Bestellung aktualisiert', datenexport: 'Backup heruntergeladen',
    'hub.publish': 'Hub-Seite veröffentlicht', 'hub.unpublish': 'Hub-Seite offline', 'hub.paid': 'Hub-Seite bezahlt', 'hub.delete': 'Hub-Seite gelöscht', 'hub.editor': 'Hub-Editor',
    'visitenkarten.publish': 'Visitenkarte online', 'visitenkarten.unpublish': 'Visitenkarte offline',
    'tapstempel.zugang_unlock': 'Laden freigeschaltet', 'tapstempel.zugang_lock': 'Laden gesperrt', 'tapstempel.zugang_auto': 'Laden automatisch',
    'tapstempel.zugang_extend': 'Test verlängert', 'tapstempel.zugang_note': 'Notiz zum Laden',
    'nachricht.erstellt': 'Nachricht an Laden erstellt', 'nachricht.beendet': 'Nachricht beendet',
    'login.erfolgreich_vertrautes_geraet': 'Angemeldet (vertrautes Gerät)', 'sicherheit.geraet_vertraut': 'Gerät als vertraut gespeichert',
    'sicherheit.geraet_entfernt': 'Vertrautes Gerät entfernt', 'sicherheit.alle_geraete_entfernt': 'Alle vertrauten Geräte entfernt',
    'sicherheit.2fa_umzug_gestartet': '⚠️ 2FA-Umzug auf neues Handy', 'sicherheit.email_code_angefordert': '⚠️ Wiederherstellungs-Code per E-Mail angefordert',
    'login.email_code_falsch': '⚠️ Falscher E-Mail-Code', 'sicherheit.2fa_per_email_zurueckgesetzt': '⚠️ 2FA per E-Mail zurückgesetzt',
    'sicherheit.2fa_notfall_zurueckgesetzt': '⚠️ 2FA über Cloudflare-Notzugang zurückgesetzt',
  };
  const auditLabel = a => AUDIT[a] || a;

  async function viewAudit(view) {
    const { entries } = await api('audit?limit=500');
    let onlyWarn = false;
    const render = () => {
      const list = onlyWarn ? entries.filter(e => /fehlgeschlagen|falsch|gesperrt|zurueckgesetzt|umzug|email_code/.test(e.action)) : entries;
      view.innerHTML = `<div class="toolbar"><div class="chips"><button class="chip ${onlyWarn ? '' : 'on'}" data-w="0">Alle <b>${entries.length}</b></button><button class="chip ${onlyWarn ? 'on' : ''}" data-w="1">Warnungen <b>${entries.filter(e => /fehlgeschlagen|falsch|gesperrt|zurueckgesetzt|umzug|email_code/.test(e.action)).length}</b></button></div></div>
        <div class="card"><div class="table-wrap"><table class="table responsive"><thead><tr><th>Zeit</th><th>Aktion</th><th>Wer</th><th>IP</th></tr></thead><tbody>
        ${list.map(e => `<tr><td data-l="Zeit" class="cell-sub">${fmtDate(e.created_at)}</td>
          <td data-l="Aktion"><div class="cell-main">${esc(auditLabel(e.action))}</div>${e.target ? `<div class="cell-sub">${esc(e.target)}</div>` : ''}${e.details ? `<div class="cell-sub mono">${esc(e.details)}</div>` : ''}</td>
          <td data-l="Wer">${esc(e.admin_email || '–')}</td><td data-l="IP" class="mono">${esc(e.ip)}</td></tr>`).join('')}</tbody></table></div></div>`;
      view.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { onlyWarn = b.dataset.w === '1'; render(); });
    };
    render();
  }

  /* ══ Team ══ */
  async function viewTeam(view) {
    const { team } = await api('team');
    view.innerHTML = `
      <div class="toolbar"><button class="btn btn-primary" id="team-add">+ Admin einladen</button><span class="faint">Neue Konten bekommen ein Einmal-Passwort und müssen 2FA einrichten.</span></div>
      <div class="card"><div class="table-wrap"><table class="table responsive"><thead><tr><th>Admin</th><th>Rolle</th><th>2FA</th><th>Letzte Anmeldung</th><th></th></tr></thead><tbody>
        ${team.map(t => `<tr><td data-l="Admin"><div class="cell-main">${esc(t.name || t.email)}</div><div class="cell-sub">${esc(t.email)}</div></td>
          <td data-l="Rolle">${t.disabled ? '<span class="pill p-bad">Deaktiviert</span>' : `<span class="pill ${t.role === 'owner' ? 'p-violet' : t.role === 'admin' ? 'p-info' : 'p-muted'}">${esc(ROLE[t.role])}</span>`}</td>
          <td data-l="2FA">${t.twoFactor ? '<span class="pill p-ok">aktiv</span>' : '<span class="pill p-warn">noch nicht</span>'}</td>
          <td data-l="Letzte Anmeldung">${t.lastLoginAt ? ago(t.lastLoginAt) : '–'}</td>
          <td data-l="">${t.id === state.me.admin.id ? '<span class="faint">Du</span>' : `<div class="row-actions">
            <select class="input btn-sm" data-role="${esc(t.id)}">${Object.entries(ROLE).map(([k, l]) => `<option value="${k}" ${t.role === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
            <button class="btn btn-ghost btn-sm" data-t="${t.disabled ? 'enable' : 'disable'}" data-id="${esc(t.id)}">${t.disabled ? 'Aktivieren' : 'Deaktivieren'}</button>
            <button class="btn btn-ghost btn-sm" data-t="reset" data-id="${esc(t.id)}">Zugang zurücksetzen</button>
            <button class="btn btn-danger btn-sm" data-t="delete" data-id="${esc(t.id)}">Löschen</button></div>`}</td></tr>`).join('')}
      </tbody></table></div></div>
      <div class="card spaced"><h3>Rollen</h3><ul class="checklist">
        <li><span class="pill p-violet">Inhaber</span><span>Alles, inklusive Team und Einstellungen.</span></li>
        <li><span class="pill p-info">Admin</span><span>Alle Module und Bestellungen bearbeiten, keine Team-Verwaltung.</span></li>
        <li><span class="pill p-muted">Nur lesen</span><span>Sieht alles, kann nichts ändern — z. B. für Buchhaltung.</span></li></ul></div>`;
    const doAction = async (id, body, title, text) => {
      const r = await askCode(title, text);
      if (!r) return;
      try {
        const d = await api('team/' + encodeURIComponent(id), { method: 'POST', body: { ...body, code: r.code } });
        if (d.tempPassword) showSecretOnce('Neues Einmal-Passwort', 'Gib es der Person sicher weiter (nicht per E-Mail im Klartext). Sie richtet beim Anmelden 2FA neu ein.', d.tempPassword);
        else toast('Gespeichert');
        if (!d.tempPassword) route();
      } catch (err) { toast(err.message, true); route(); }
    };
    view.querySelectorAll('[data-role]').forEach(sel => sel.onchange = () => doAction(sel.dataset.role, { action: 'role', role: sel.value }, 'Rolle ändern', 'Die Person wird abgemeldet und hat danach die neuen Rechte.'));
    view.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
      const texts = { disable: ['Admin deaktivieren', 'Sofortige Abmeldung, kein Zugriff mehr.'], enable: ['Admin aktivieren', 'Zugriff wieder erlauben.'],
        reset: ['Zugang zurücksetzen', 'Neues Einmal-Passwort, 2FA wird neu eingerichtet — z. B. bei verlorenem Handy.'], delete: ['Admin löschen', 'Das Konto wird endgültig entfernt.'] };
      doAction(b.dataset.id, { action: b.dataset.t }, ...texts[b.dataset.t]);
    });
    $('team-add').onclick = async () => {
      const r = await askCode('Admin einladen', 'Bestätige mit deinem 2FA-Code.', `
        <div class="field"><label class="lbl" for="i-email">E-Mail</label><input class="input" id="i-email" data-field="email" type="email"></div>
        <div class="field"><label class="lbl" for="i-name">Name</label><input class="input" id="i-name" data-field="name"></div>
        <div class="field"><label class="lbl" for="i-role">Rolle</label><select class="input" id="i-role" data-field="role"><option value="admin">Admin</option><option value="viewer">Nur lesen</option></select></div>`);
      if (!r) return;
      try {
        const d = await api('team', { method: 'POST', body: r });
        showSecretOnce('Einmal-Passwort', `Für ${r.email}. Wird nur jetzt angezeigt. Anmeldung unter /admin, dort wird 2FA eingerichtet und ein eigenes Passwort festgelegt.`, d.tempPassword);
      } catch (err) { toast(err.message, true); }
    };
  }

  /* ══ Einstellungen: Module ══ */
  async function viewSettings(view) {
    const { modules } = await api('modules');
    view.innerHTML = `<div class="card"><h3>Module</h3><p class="card-sub">Name, Beschreibung, Farbe und Symbol gelten überall im Admin und über <span class="mono">/api/platform/modules</span> auch für Website und App. Umbenennen reicht — nichts muss im Code angepasst werden.</p>
      ${modules.map(m => `<div class="row-item" data-mod-color="${esc(m.color)}"><div class="grid g-4">
        <div class="field"><label class="lbl">Name</label><input class="input" data-k="${esc(m.key)}" data-f="name"></div>
        <div class="field"><label class="lbl">Beschreibung</label><input class="input" data-k="${esc(m.key)}" data-f="description"></div>
        <div class="field"><label class="lbl">Symbol & Farbe</label><div class="toolbar"><input class="input" data-k="${esc(m.key)}" data-f="icon" maxlength="4"><input class="swatch-input" type="color" data-k="${esc(m.key)}" data-f="color"></div></div>
        <div class="field"><label class="lbl">Aktiv</label><label class="check"><input type="checkbox" data-k="${esc(m.key)}" data-f="enabled"> im Admin anzeigen</label>
          <button class="btn btn-primary btn-sm" data-save="${esc(m.key)}">Speichern</button></div>
      </div></div>`).join('')}</div>`;
    for (const m of modules) {
      const f = name => view.querySelector(`[data-k="${m.key}"][data-f="${name}"]`);
      f('name').value = m.name; f('description').value = m.description || ''; f('icon').value = m.icon || ''; f('color').value = m.color || '#8b7cf6'; f('enabled').checked = m.enabled;
    }
    view.querySelectorAll('[data-save]').forEach(b => b.onclick = async () => {
      const k = b.dataset.save, f = name => view.querySelector(`[data-k="${k}"][data-f="${name}"]`);
      try {
        await api('modules/' + k, { method: 'PUT', body: { name: f('name').value, description: f('description').value, icon: f('icon').value, color: f('color').value, enabled: f('enabled').checked } });
        state.modules = (await api('modules')).modules; renderNav(); route(); toast('Modul gespeichert');
      } catch (err) { toast(err.message, true); }
    });
  }

  /* ══ Start ══ */
  (async () => {
    try {
      const me = await api('me', { auth: true });
      if (me.stage === 'full') return enterApp();
      showAuth(me.stage === 'setup' ? 'setup' : 'totp');
    } catch (e) { showAuth('login'); }
  })();
})();
