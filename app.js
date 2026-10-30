/* LUX Klantportaal — app.lux-media.nl */
(function () {
  'use strict';
  var CFG = window.LUX_PORTAAL || {};
  var $app = document.getElementById('app');
  var T = { token: null, rol: null, ik: null };
  try { T.token = localStorage.getItem('lux_token'); T.rol = localStorage.getItem('lux_rol'); } catch (e) {}

  /* ---------- hulpjes ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function gb(b) { b = Number(b) || 0; if (b < 1024 * 1024 * 1024) return (b / 1024 / 1024).toFixed(b < 10 * 1024 * 1024 ? 1 : 0).replace('.', ',') + ' MB'; return (b / 1024 / 1024 / 1024).toFixed(1).replace('.0', '').replace('.', ',') + ' GB'; }
  function datum(d) { try { return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } }
  function maand(d) { try { var s = new Date(d).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); } catch (e) { return ''; } }
  function fotos(n) { return n === 1 ? '1 foto' : n + ' foto’s'; }
  function voornaam(n) { return String(n || '').split(' ')[0]; }
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  var I = {
    up: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></svg>',
    down: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M6 10l6 6 6-6M4 20h16"/></svg>',
    plus: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    x: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    links: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    rechts: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    uit: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/></svg>',
    vink: '<svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0D0A12" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
    speel: '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="#F7F3FA"><path d="M8 5v14l11-7z"/></svg>',
    beeld: '<svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 16l-5-5-9 8"/></svg>'
  };
  var LOGO = '<svg aria-hidden="true" width="26" height="34" viewBox="0 0 120 160"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF5E5B"/><stop offset=".5" stop-color="#C957B0"/><stop offset="1" stop-color="#8F55FF"/></linearGradient></defs><path fill="url(#lg)" fill-rule="evenodd" d="M10 30 H70 L80 8 H105 a5 5 0 0 1 5 5 V57 A38 38 0 0 0 110 133 V150 a10 10 0 0 1 -10 10 H10 a10 10 0 0 1 -10 -10 V40 a10 10 0 0 1 10 -10 Z M16 44 h26 a3 3 0 0 1 3 3 v6 a3 3 0 0 1 -3 3 h-26 a3 3 0 0 1 -3 -3 v-6 a3 3 0 0 1 3 -3 Z"/><path d="M110 70 A25 25 0 0 0 110 120" fill="none" stroke="url(#lg)" stroke-width="9"/><circle cx="111" cy="92" r="8" fill="url(#lg)"/></svg>';

  function toast(t) {
    $$('.toast').forEach(function (x) { x.remove(); });
    var el = document.createElement('div'); el.className = 'toast'; if ($('.overlay')) el.classList.add('boven'); el.setAttribute('role', 'status'); el.textContent = t;
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 3200);
  }
  function api(actie, data) {
    if (!CFG.FUNCTION_URL) return Promise.reject(new Error('Het portaal is nog niet ingesteld (config.js).'));
    var h = { 'Content-Type': 'application/json' };
    if (T.token) h.Authorization = 'Bearer ' + T.token;
    var body = Object.assign({ actie: actie }, data || {});
    return fetch(CFG.FUNCTION_URL, { method: 'POST', headers: h, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { ok: false, fout: 'Geen verbinding met het portaal.' }; }).then(function (j) { j.__status = r.status; return j; }); })
      .then(function (j) {
        if (j.__status === 401) { uitloggen(true); throw new Error(j.fout || 'Log opnieuw in.'); }
        if (!j.ok) throw new Error(j.fout || 'Er ging iets mis.');
        return j;
      }, function () { throw new Error('Geen internetverbinding. Probeer het opnieuw.'); });
  }
  function bewaar(token, rol) { T.token = token; T.rol = rol; try { localStorage.setItem('lux_token', token); localStorage.setItem('lux_rol', rol); } catch (e) {} }
  function uitloggen(stil) {
    T.token = null; T.rol = null; T.ik = null;
    try { localStorage.removeItem('lux_token'); localStorage.removeItem('lux_rol'); } catch (e) {}
    if (!stil) toast('Je bent uitgelogd.');
    location.hash = '#/';
    render();
  }

  /* ---------- schermdelen ---------- */
  function kop() {
    var klant = T.rol === 'klant';
    var naam = klant && T.ik ? T.ik.naam : 'LUX Media';
    return '<header class="kop"><div class="kop-in">' +
      '<a class="logo" href="#/" aria-label="Naar mijn overzicht">' + LOGO + '<span style="display:flex;flex-direction:column;line-height:.95"><i style="font-size:15px">LUX</i><b style="font-size:17px">' + (klant ? 'Klantportaal' : 'Beheer') + '</b></span></a>' +
      '<div class="kop-rechts">' +
      (klant ? '<button type="button" class="btn btn-grad btn-upload" data-actie="upload">' + I.up + 'Foto’s uploaden</button>' : '') +
      '<span class="wie"><span class="rondje grad">' + esc(naam.charAt(0).toUpperCase()) + '</span><span class="naam">' + esc(klant ? voornaam(naam) : 'Beheer') + '</span></span>' +
      '<button type="button" class="icon-btn" data-actie="uitloggen" aria-label="Uitloggen" title="Uitloggen">' + I.uit + '</button>' +
      '</div></div></header>';
  }
  function laden() { return '<div class="laden" role="status" aria-label="Laden"><span></span></div>'; }
  function scherm(html) { $app.innerHTML = html; window.scrollTo(0, 0); var h = $('h1', $app); if (h) { h.setAttribute('tabindex', '-1'); } }
  function fout(e) { return '<p class="melding" role="alert">' + esc(e.message || e) + '</p>'; }

  /* ---------- inloggen ---------- */
  function loginScherm() {
    scherm('<div class="login">' +
      '<div class="login-links grad">' +
      '<span class="logo" style="color:#0D0A12"><svg aria-hidden="true" width="34" height="44" viewBox="0 0 120 160"><path fill="#0D0A12" fill-rule="evenodd" d="M10 30 H70 L80 8 H105 a5 5 0 0 1 5 5 V57 A38 38 0 0 0 110 133 V150 a10 10 0 0 1 -10 10 H10 a10 10 0 0 1 -10 -10 V40 a10 10 0 0 1 10 -10 Z M16 44 h26 a3 3 0 0 1 3 3 v6 a3 3 0 0 1 -3 3 h-26 a3 3 0 0 1 -3 -3 v-6 a3 3 0 0 1 3 -3 Z"/><path d="M110 70 A25 25 0 0 0 110 120" fill="none" stroke="#0D0A12" stroke-width="9"/><circle cx="111" cy="92" r="8" fill="#0D0A12"/></svg><span style="width:2px;height:44px;background:#0D0A12"></span><span style="display:flex;flex-direction:column;line-height:.92"><i style="font-size:20px">LUX</i><b style="font-size:24px">Media</b></span></span>' +
      '<div style="display:flex;flex-direction:column;gap:16px"><h1>Al je foto’s. Veilig op één plek.</h1><p>Bekijk de beelden van je shoot, bewaar je eigen foto’s en maak ruimte vrij op je telefoon.</p></div>' +
      '<span style="font-size:13px;font-weight:700;letter-spacing:.25em">WE CREATE EMOTIONS</span></div>' +
      '<div class="login-rechts"><div id="loginvak" style="width:100%;max-width:400px"></div></div></div>');
    stapMail();
  }
  function stapMail(email, melding) {
    var vak = $('#loginvak');
    vak.innerHTML = '<form class="login-form in" id="f-mail" novalidate>' +
      '<div style="display:flex;flex-direction:column;gap:8px"><span class="grad-text" style="font-weight:700;font-size:13px;letter-spacing:.3em;align-self:flex-start">KLANTPORTAAL</span>' +
      '<h2 style="margin:0;font-weight:800;font-size:34px">Inloggen</h2>' +
      '<p class="sub" style="font-size:15px">Vul het e-mailadres in waarmee LUX je account heeft aangemaakt. Je krijgt een inlogcode per mail, een wachtwoord is niet nodig.</p></div>' +
      (melding ? '<p class="melding" role="alert">' + esc(melding) + '</p>' : '') +
      '<div class="veld"><label for="l-mail">E-mailadres</label><input id="l-mail" type="email" autocomplete="email" inputmode="email" required value="' + esc(email || '') + '"></div>' +
      '<button type="submit" class="btn btn-grad">Stuur mij een inlogcode</button>' +
      '<p class="sub" style="font-size:13px;color:#8E849A">Nog geen klant? <a href="#/boeken">Boek een shoot</a>, dan maken wij je account aan.</p></form>';
    var f = $('#f-mail');
    $('#l-mail').focus();
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var m = $('#l-mail').value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)) { stapMail(m, 'Vul een geldig e-mailadres in.'); return; }
      var b = $('button[type=submit]', f); b.disabled = true; b.textContent = 'Even geduld…';
      api('code_aanvragen', { email: m }).then(function () { stapCode(m); }, function (er) { stapMail(m, er.message); });
    });
  }
  function stapCode(email, melding) {
    var vak = $('#loginvak');
    var vakjes = ''; for (var i = 0; i < 6; i++) vakjes += '<input inputmode="numeric" pattern="[0-9]*" aria-label="Cijfer ' + (i + 1) + '"' + (i === 0 ? ' autocomplete="one-time-code"' : '') + '>';
    vak.innerHTML = '<form class="login-form in" id="f-code" novalidate>' +
      '<div style="display:flex;flex-direction:column;gap:8px"><h2 style="margin:0;font-weight:800;font-size:34px">Check je mail</h2>' +
      '<p class="sub" style="font-size:15px">Als dit adres bij ons bekend is, hebben we een code van 6 cijfers gestuurd naar <b style="color:#F7F3FA">' + esc(email) + '</b>. Kijk ook in je spam.</p></div>' +
      (melding ? '<p class="melding" role="alert">' + esc(melding) + '</p>' : '') +
      '<fieldset style="border:0;padding:0;margin:0"><legend style="font-size:13px;font-weight:600;color:#B3A9BD;margin-bottom:10px">Inlogcode</legend><div class="codes">' + vakjes + '</div></fieldset>' +
      '<button type="submit" class="btn btn-grad">Inloggen</button>' +
      '<div class="knoppen"><button type="button" class="btn btn-ghost btn-klein" id="opnieuw">Nieuwe code sturen</button><button type="button" class="btn btn-ghost btn-klein" id="ander">Ander e-mailadres</button></div></form>';
    var velden = $$('.codes input');
    velden[0].focus();
    velden.forEach(function (v, i) {
      v.addEventListener('input', function () {
        var d = v.value.replace(/\D/g, '');
        if (d.length > 1) { d.split('').slice(0, 6 - i).forEach(function (c, j) { velden[i + j].value = c; }); var n = Math.min(5, i + d.length); velden[n].focus(); }
        else { v.value = d; if (d && i < 5) velden[i + 1].focus(); }
        if (velden.every(function (x) { return x.value; })) $('#f-code').requestSubmit ? $('#f-code').requestSubmit() : null;
      });
      v.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !v.value && i > 0) velden[i - 1].focus(); });
    });
    $('#ander').onclick = function () { stapMail(email); };
    $('#opnieuw').onclick = function () { api('code_aanvragen', { email: email }).then(function () { toast('Nieuwe code verstuurd (als je adres bekend is).'); }, function (er) { toast(er.message); }); };
    $('#f-code').addEventListener('submit', function (e) {
      e.preventDefault();
      var code = velden.map(function (x) { return x.value; }).join('');
      if (code.length !== 6) { stapCode(email, 'Vul alle 6 cijfers in.'); return; }
      var b = $('button[type=submit]', this); b.disabled = true; b.textContent = 'Inloggen…';
      api('inloggen', { email: email, code: code }).then(function (j) { bewaar(j.token, j.rol); location.hash = '#/'; render(); }, function (er) { stapCode(email, er.message); });
    });
  }

  /* ---------- klant: overzicht ---------- */
  function albumKaart(a, beheer) {
    var info = a.soort === 'lux' ? maand(a.aangemaakt) + ' · ' + fotos(a.aantal) : fotos(a.aantal) + (a.bytes ? ' · ' + gb(a.bytes) : '');
    var badge = beheer ? (a.klaar ? '<span class="badge grad">ZICHTBAAR</span>' : '<span class="badge grijs">NOG NIET ZICHTBAAR</span>') : (a.nieuw && a.soort === 'lux' ? '<span class="badge grad">NIEUW</span>' : '');
    var extra = (a.ongelezen ? '<span class="badge-r bericht-b">' + a.ongelezen + ' nieuw bericht' + (a.ongelezen > 1 ? 'en' : '') + '</span>' : '') + (beheer && a.favorieten ? '<span class="badge-r">♥ ' + a.favorieten + (a.keuze_verstuurd ? ' · doorgestuurd' : '') + '</span>' : '');
    badge += extra ? '<span class="badges-r">' + extra + '</span>' : '';
    return '<button type="button" class="album" data-album="' + esc(a.id) + '"><span class="cover">' + badge +
      (a.cover ? '<img src="' + esc(a.cover) + '" alt="" loading="lazy">' : '<span style="color:#8E849A">' + I.beeld + '</span>') +
      '</span><span style="display:flex;flex-direction:column;gap:4px"><span class="naam">' + esc(a.titel) + '</span><span class="info">' + esc(info) + '</span></span></button>';
  }
  function home() {
    scherm(kop() + '<main>' + laden() + '</main>');
    api('ik').then(function (j) {
      T.ik = j;
      var p = Math.min(100, Math.round(j.gebruikt / j.quota * 100));
      var lux = j.albums.filter(function (a) { return a.soort === 'lux'; });
      var eigen = j.albums.filter(function (a) { return a.soort === 'eigen'; });
      var nieuw = lux.some(function (a) { return a.nieuw; });
      scherm(kop() + '<main class="in">' +
        '<div style="display:flex;flex-wrap:wrap;gap:24px;align-items:stretch">' +
        '<div style="flex:2 1 420px;display:flex;flex-direction:column;justify-content:center;gap:10px"><h1 class="titel">Welkom, <span class="grad-text">' + esc(voornaam(j.naam)) + '</span></h1>' +
        '<p class="sub">' + (nieuw ? 'Er staat een nieuwe shoot voor je klaar. ' : '') + 'Je foto’s worden hier veilig bewaard, ook als je ze van je telefoon verwijdert.</p></div>' +
        '<div class="kaart" style="flex:1 1 280px;padding:22px;display:flex;flex-direction:column;gap:12px">' +
        '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px"><b style="font-size:15px">Opslag</b><span style="color:#B3A9BD;font-size:14px"><b style="color:#F7F3FA">' + gb(j.gebruikt) + '</b> van ' + gb(j.quota) + '</span></div>' +
        '<div class="balk" role="img" aria-label="' + p + ' procent van je opslag gebruikt"><span style="width:' + p + '%"></span></div>' +
        '<span style="color:#B3A9BD;font-size:13px;line-height:1.5">' + (p >= 90 ? 'Je opslag is bijna vol. Vraag LUX om meer ruimte.' : 'Shoots van LUX tellen niet mee voor je ruimte.') + '</span></div></div>' +
        (j.review ? reviewKaart(j.review) : j.heeftReview ? refKaart() : '') +
        '<section style="display:flex;flex-direction:column;gap:18px"><div class="rij"><h2 class="sectie">Van LUX Media</h2><span class="sub" style="font-size:14px">Shoots die wij voor je hebben klaargezet · <a href="#/boeken">Nieuwe shoot boeken</a></span></div>' +
        (lux.length ? '<div class="albums">' + lux.map(function (a) { return albumKaart(a); }).join('') + '</div>' : '<div class="leeg">Hier verschijnen de foto’s van je shoots met LUX Media.</div>') + '</section>' +
        '<section style="display:flex;flex-direction:column;gap:18px"><div class="rij"><h2 class="sectie">Mijn albums</h2><button type="button" class="btn btn-ghost btn-klein" data-actie="nieuw-album">' + I.plus + 'Nieuw album</button></div>' +
        '<div class="albums">' + eigen.map(function (a) { return albumKaart(a); }).join('') +
        '<button type="button" class="album nieuw-album" data-actie="upload"><span class="cover"><span style="display:flex;flex-direction:column;align-items:center;gap:10px;color:#B3A9BD;font-weight:600;font-size:15px"><span class="grad rondje" style="width:52px;height:52px">' + I.up.replace('currentColor', '#0D0A12') + '</span>Foto’s toevoegen</span></span><span style="display:flex;flex-direction:column;gap:4px"><span class="naam">Uploaden</span><span class="info">Vanaf je computer of telefoon</span></span></button>' +
        '</div></section></main>' +
        '<button type="button" class="btn btn-grad fab" data-actie="upload">' + I.up + 'Foto’s uploaden</button>');
      if (j.review) koppelReview(j.review);
      vulRef();
    }, function (e) { scherm(kop() + '<main>' + fout(e) + '</main>'); });
  }

  /* ---------- album ---------- */
  var HUIDIG = null, FILTER = 'alles';
  var GEBRUIK = {
    prive: ['Alleen privé', 'Voor jezelf, familie en vrienden. Niet op social media of voor je bedrijf.'],
    online: ['Privé & eigen social media', 'Ook op je eigen social media, graag met vermelding van @lux_media.nl. Niet voor reclame.'],
    commercieel: ['Commercieel gebruik toegestaan', 'Ook voor je bedrijf: website, advertenties, social media en drukwerk.']
  };
  var HART = function (vol) { return '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="' + (vol ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-9.3-9.2C1.6 7.6 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.4 3.1 4.3 6.3C19.5 15.4 12 20 12 20z"/></svg>'; };
  var BALLON = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>';
  var DEEL = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/></svg>';
  var FORMAAT_I = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="3" y="6" width="9" height="12" rx="1.5"/><rect x="14" y="3" width="7" height="18" rx="1.5"/></svg>';
  function gebruikVan(f) { return f.gebruik || (HUIDIG && HUIDIG.album.gebruik) || 'online'; }
  function isBeeld(f) { return !/^video\//.test(f.type) && (f.groot || /^image\/(jpe?g|png|webp|gif|avif)/.test(f.type)); }
  function albumScherm(id) {
    scherm(kop() + '<main>' + laden() + '</main>');
    api('album', { album_id: id }).then(function (j) {
      HUIDIG = j; FILTER = 'alles';
      if (T.rol === 'beheer' && j.album.klant_id) HUIDIG_KLANT = j.album.klant_id;
      tekenAlbum();
      if (j.album.soort === 'lux') laadBerichten();
    }, function (e) { scherm(kop() + '<main><a class="terug" href="#/">' + I.links + 'Terug</a>' + fout(e) + '</main>'); });
  }
  function tekenAlbum() {
    var j = HUIDIG, a = j.album, beheer = T.rol === 'beheer', klant = T.rol === 'klant', lux = a.soort === 'lux';
    var kiezen = klant && lux;
    var totaal = j.fotos.reduce(function (t, f) { return t + f.grootte; }, 0);
    var fav = j.fotos.filter(function (f) { return f.favoriet; }).length, fb = j.fotos.filter(function (f) { return f.feedback; }).length;
    var label = lux ? 'VAN LUX MEDIA' : 'MIJN ALBUM';
    var terug = beheer ? '#/beheer/klant/' + encodeURIComponent(HUIDIG_KLANT || '') : '#/';
    var lijst = j.fotos.map(function (f, i) { return { f: f, i: i }; }).filter(function (x) { return FILTER === 'alles' || (FILTER === 'fav' && x.f.favoriet) || (FILTER === 'fb' && x.f.feedback); });
    var g = GEBRUIK[a.gebruik || 'online'];
    scherm(kop() + '<main class="in" style="gap:26px">' +
      '<div class="rij"><div style="display:flex;flex-direction:column;gap:8px">' +
      '<a class="terug" href="' + terug + '">' + I.links + (beheer ? 'Terug naar klant' : 'Terug naar overzicht') + '</a>' +
      '<span class="grad-text" style="font-weight:700;font-size:12px;letter-spacing:.25em;align-self:flex-start">' + label + '</span>' +
      '<h1 class="titel">' + esc(a.titel) + '</h1><span class="sub" style="font-size:15px">' + fotos(j.fotos.length) + (totaal ? ' · ' + gb(totaal) : '') + ' · originele kwaliteit</span>' +
      (beheer ? '<span class="sub" style="font-size:14px">' + (a.klaar ? 'Zichtbaar voor de klant.' : 'Nog niet zichtbaar voor de klant. Upload de foto’s en zet de shoot daarna klaar.') + '</span>' : '') +
      '</div><div class="knoppen">' +
      (j.magBewerken ? '<button type="button" class="btn btn-ghost" data-actie="upload-hier">' + I.up + 'Uploaden</button>' : '') +
      (klant && j.fotos.length ? '<button type="button" class="btn btn-ghost" data-actie="delen">' + DEEL + 'Delen</button>' : '') +
      (j.fotos.length ? '<button type="button" class="btn btn-ghost" data-actie="alles">' + I.down + 'Alles downloaden</button>' : '') +
      (lux ? '<button type="button" class="btn btn-ghost" data-actie="naar-chat">' + BALLON + 'Berichten</button>' : '') +
      (beheer && !a.klaar ? '<button type="button" class="btn btn-grad" data-actie="shoot-klaar">Zet klaar &amp; mail klant</button>' : '') +
      (j.magBewerken ? '<button type="button" class="btn btn-ghost btn-klein" data-actie="hernoem">Naam wijzigen</button><button type="button" class="btn btn-rood btn-klein" data-actie="album-weg">Album verwijderen</button>' : '') +
      '</div></div>' +
      (lux ? '<div class="infobalk">' +
        '<div class="gebruik-blok"><span class="gb-icoon grad">©</span><div><b>' + (beheer ? 'Gebruiksrecht' : 'Wat mag je met deze foto’s?') + '</b>' +
        (beheer ? '<select id="album-gebruik" aria-label="Gebruiksrecht voor deze shoot">' + Object.keys(GEBRUIK).map(function (k) { return '<option value="' + k + '"' + (k === (a.gebruik || 'online') ? ' selected' : '') + '>' + GEBRUIK[k][0] + '</option>'; }).join('') + '</select><small>Standaard voor alle foto’s; per foto aan te passen in de lichtbak.</small>'
          : '<span>' + g[0] + '</span><small>' + g[1] + ' Bij sommige foto’s kan het anders zijn; dat zie je als je de foto opent.</small>') + '</div></div>' +
        (kiezen ? '<div class="kies-blok"><div><b>' + HART(true) + ' ' + fav + (fav === 1 ? ' favoriet' : ' favorieten') + (fb ? ' · ' + fb + (fb === 1 ? ' opmerking' : ' opmerkingen') : '') + '</b><small>Tik op het hartje bij de foto’s die je het mooist vindt en zet opmerkingen bij een foto. Klaar? Stuur je keuze door naar LUX.</small></div>' +
          '<button type="button" class="btn btn-grad btn-klein" data-actie="keuze"' + (fav || fb ? '' : ' disabled') + '>' + (a.keuze_verstuurd ? 'Keuze opnieuw doorsturen' : 'Keuze doorsturen') + '</button>' + (a.keuze_verstuurd ? '<small class="ok-tekst">Doorgestuurd op ' + esc(datum(a.keuze_verstuurd)) + '</small>' : '') + '</div>' : '') +
        (beheer && (fav || fb || a.keuze_verstuurd) ? '<div class="kies-blok"><div><b>' + HART(true) + ' ' + fav + ' favorieten · ' + fb + (fb === 1 ? ' opmerking' : ' opmerkingen') + '</b><small>' + (a.keuze_verstuurd ? 'Klant stuurde de keuze door op ' + esc(datum(a.keuze_verstuurd)) + '.' : 'De klant is nog aan het kiezen.') + '</small></div></div>' : '') +
        '</div>' : '') +
      (lux && (fav || fb) ? '<div class="chips" role="tablist" aria-label="Filter">' + [['alles', 'Alles', j.fotos.length], ['fav', 'Favorieten', fav], ['fb', 'Met opmerking', fb]].map(function (x) {
        return '<button type="button" role="tab" class="chip-knop' + (FILTER === x[0] ? ' actief' : '') + '" aria-selected="' + (FILTER === x[0]) + '" data-albumfilter="' + x[0] + '">' + x[1] + ' <span>' + x[2] + '</span></button>'; }).join('') + '</div>' : '') +
      (lijst.length ? '<div class="fotos">' + lijst.map(function (x) {
        var f = x.f, i = x.i, video = /^video\//.test(f.type);
        return '<div class="foto-w"><button type="button" class="foto" data-foto="' + i + '" aria-label="' + esc((video ? 'Video ' : 'Foto ') + (i + 1) + ': ' + f.naam) + '">' +
          (f.mini ? '<img src="' + esc(f.mini) + '" alt="" loading="lazy">' : I.beeld) + (video ? '<span class="speel">' + I.speel + '</span>' : '') +
          (f.feedback ? '<span class="fb-stip" title="' + esc(f.feedback) + '">' + BALLON + '</span>' : '') + '</button>' +
          (kiezen ? '<button type="button" class="hart' + (f.favoriet ? ' aan' : '') + '" data-hart="' + i + '" aria-pressed="' + f.favoriet + '" aria-label="Favoriet: ' + esc(f.naam) + '">' + HART(f.favoriet) + '</button>'
            : f.favoriet ? '<span class="hart aan stil" aria-label="Favoriet van de klant">' + HART(true) + '</span>' : '') + '</div>';
      }).join('') + '</div>' : '<div class="leeg">' + (j.fotos.length ? 'Geen foto’s in deze selectie.' : j.magBewerken ? 'Dit album is nog leeg. Klik op Uploaden om foto’s toe te voegen.' : 'Dit album is nog leeg.') + '</div>') +
      (lux ? '<section class="kaart chat" id="chat" aria-labelledby="chat-titel"><div class="chat-kop"><h2 class="sectie" id="chat-titel" style="font-size:20px">' + (beheer ? 'Berichten met de klant' : 'Berichten met LUX') + '</h2><small>' + (beheer ? 'De klant krijgt een mail bij een nieuw bericht.' : 'Vragen of afspraken over deze shoot? Zet ze hier, dan blijft alles bij elkaar.') + '</small></div>' +
        '<div class="chat-lijst" id="chat-lijst" aria-live="polite">' + laden() + '</div>' +
        '<form class="chat-form" id="chat-form"><label class="sr" for="chat-in">Bericht</label><textarea id="chat-in" rows="1" placeholder="Typ een bericht…"></textarea><button type="submit" class="btn btn-grad btn-klein">Versturen</button></form></section>' : '') +
      '</main>' + (T.rol === 'klant' && j.magBewerken ? '<button type="button" class="btn btn-grad fab" data-actie="upload-hier">' + I.up + 'Uploaden</button>' : ''));
    var sel = $('#album-gebruik');
    if (sel) sel.onchange = function () { var v = sel.value; api('album_gebruik', { album_id: a.id, gebruik: v }).then(function () { a.gebruik = v; toast('Gebruiksrecht opgeslagen.'); }, function (er) { toast(er.message); }); };
    var cf = $('#chat-form');
    if (cf) {
      var ci = $('#chat-in');
      ci.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); cf.requestSubmit ? cf.requestSubmit() : null; } });
      ci.addEventListener('input', function () { ci.style.height = 'auto'; ci.style.height = Math.min(160, ci.scrollHeight) + 'px'; });
      cf.addEventListener('submit', function (e) {
        e.preventDefault(); var t = ci.value.trim(); if (!t) return;
        var b = $('button', cf); b.disabled = true;
        api('bericht_sturen', { album_id: a.id, tekst: t }).then(function (r) { ci.value = ''; ci.style.height = ''; b.disabled = false; (HUIDIG.berichten = HUIDIG.berichten || []).push(r.bericht); tekenBerichten(); }, function (er) { b.disabled = false; toast(er.message); });
      });
      if (HUIDIG.berichten) tekenBerichten();
    }
  }
  var chatTimer = null;
  function laadBerichten() {
    clearTimeout(chatTimer);
    if (!HUIDIG || HUIDIG.album.soort !== 'lux') return;
    var id = HUIDIG.album.id;
    api('berichten', { album_id: id }).then(function (r) {
      if (!HUIDIG || HUIDIG.album.id !== id) return;
      var oud = (HUIDIG.berichten || []).length; HUIDIG.berichten = r.berichten;
      if (r.berichten.length !== oud || !$('#chat-lijst .bericht-r, #chat-lijst .chat-leeg')) tekenBerichten();
      chatTimer = setTimeout(function () { if ($('#chat-lijst') && !document.hidden) laadBerichten(); else if ($('#chat-lijst')) chatTimer = setTimeout(laadBerichten, 20000); }, 20000);
    }, function () {});
  }
  function tekenBerichten() {
    var l = $('#chat-lijst'); if (!l) return;
    var mij = T.rol === 'klant' ? 'klant' : 'lux', b = HUIDIG.berichten || [];
    l.innerHTML = b.length ? b.map(function (m) {
      return '<div class="bericht-r ' + (m.van === mij ? 'mij' : 'zij') + '"><div class="bubbel">' + esc(m.tekst).replace(/\n/g, '<br>') + '</div><small>' + (m.van === 'lux' ? 'LUX Media' : (T.rol === 'beheer' ? 'Klant' : 'Jij')) + ' · ' + esc(tijdstip(m.aangemaakt)) + '</small></div>';
    }).join('') : '<p class="chat-leeg">Nog geen berichten. Stuur gerust een vraag' + (T.rol === 'klant' ? ', we reageren zo snel mogelijk.' : '.') + '</p>';
    l.scrollTop = l.scrollHeight;
  }
  function tijdstip(d) { try { var x = new Date(d); return x.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) + ' ' + x.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
  function wisselHart(i) {
    var f = HUIDIG.fotos[i], aan = !f.favoriet; f.favoriet = aan;
    api('foto_favoriet', { foto_id: f.id, aan: aan }).catch(function (er) { f.favoriet = !aan; toast(er.message); tekenAlbum(); });
    if (lbEl) { var hb = $('[data-lb=hart]', lbEl); if (hb) { hb.classList.toggle('aan', aan); hb.setAttribute('aria-pressed', aan); hb.innerHTML = HART(aan) + (aan ? 'Favoriet' : 'Favoriet maken'); } }
    var y = window.scrollY; tekenAlbum(); window.scrollTo(0, y);
  }

  /* ---------- lichtbak ---------- */
  var lbIndex = 0, lbEl = null;
  function lichtbak(i) {
    lbIndex = i; sluitLichtbak();
    var f = HUIDIG.fotos[i], n = HUIDIG.fotos.length, video = /^video\//.test(f.type);
    var bron = f.groot || f.origineel;
    var kanTonen = video || f.groot || /^image\/(jpe?g|png|gif|webp|avif)/.test(f.type);
    var lux = HUIDIG.album.soort === 'lux', klant = T.rol === 'klant', beheer = T.rol === 'beheer', gedeeld = !!HUIDIG.gedeeld;
    var g = gebruikVan(f);
    lbEl = document.createElement('div');
    lbEl.className = 'overlay lichtbak'; lbEl.setAttribute('role', 'dialog'); lbEl.setAttribute('aria-modal', 'true'); lbEl.setAttribute('aria-label', f.naam);
    lbEl.innerHTML = '<button type="button" class="icon-btn sluit" data-lb="sluit" aria-label="Sluiten">' + I.x + '</button>' +
      (n > 1 ? '<button type="button" class="icon-btn pijl" style="left:16px" data-lb="vorige" aria-label="Vorige">' + I.links + '</button><button type="button" class="icon-btn pijl" style="right:16px" data-lb="volgende" aria-label="Volgende">' + I.rechts + '</button>' : '') +
      (video ? '<video class="beeld" src="' + esc(f.origineel) + '" controls playsinline' + (f.groot ? ' poster="' + esc(f.groot) + '"' : '') + '></video>'
        : kanTonen ? '<img class="beeld" src="' + esc(bron) + '" alt="' + esc(f.naam) + '">'
        : '<div class="kaart" style="padding:40px;text-align:center;color:#B3A9BD;max-width:420px">' + I.beeld + '<p>Van dit bestand (' + esc(f.naam) + ') kan geen voorbeeld worden getoond. Download het om het te bekijken.</p></div>') +
      '<div class="balkje"><span>' + (i + 1) + ' / ' + n + ' · ' + esc(f.naam) + (f.grootte ? ' · ' + gb(f.grootte) : '') + '</span>' +
      (lux && klant ? '<button type="button" class="btn btn-ghost btn-klein hart-knop' + (f.favoriet ? ' aan' : '') + '" data-lb="hart" aria-pressed="' + f.favoriet + '">' + HART(f.favoriet) + (f.favoriet ? 'Favoriet' : 'Favoriet maken') + '</button>' : '') +
      (!gedeeld || f.download ? '<button type="button" class="btn btn-grad btn-klein" data-lb="download">' + I.down + (gedeeld ? 'Downloaden' : 'Download origineel') + '</button>' : '') +
      (!gedeeld && isBeeld(f) ? '<button type="button" class="btn btn-ghost btn-klein" data-lb="formaat">' + FORMAAT_I + 'Social formaten</button>' : '') +
      (HUIDIG.magBewerken ? '<button type="button" class="btn btn-rood btn-klein" data-lb="weg">Verwijderen</button>' : '') + '</div>' +
      (lux && !gedeeld ? '<div class="lb-extra">' +
        '<span class="gebruik-pil gb-' + g + '" title="' + esc(GEBRUIK[g][1]) + '">© ' + GEBRUIK[g][0] + '</span>' +
        (beheer ? '<label class="sr" for="lb-gebruik">Gebruik van deze foto</label><select id="lb-gebruik" class="mini-select"><option value="">Zoals de shoot (' + GEBRUIK[HUIDIG.album.gebruik || 'online'][0] + ')</option>' + Object.keys(GEBRUIK).map(function (k) { return '<option value="' + k + '"' + (f.gebruik === k ? ' selected' : '') + '>' + GEBRUIK[k][0] + '</option>'; }).join('') + '</select>' : '') +
        (klant ? '<form class="lb-fb" id="lb-fb"><label class="sr" for="lb-fb-in">Opmerking bij deze foto</label><input id="lb-fb-in" placeholder="Opmerking voor LUX, bijv. “iets lichter graag”" value="' + esc(f.feedback || '') + '" maxlength="1000"><button type="submit" class="btn btn-ghost btn-klein">' + (f.feedback ? 'Bijwerken' : 'Opslaan') + '</button></form>'
          : f.feedback ? '<span class="lb-fb-tekst">' + BALLON + ' <b>Klant:</b> ' + esc(f.feedback) + '</span>' : '') +
        '</div>' : '');
    document.body.appendChild(lbEl);
    $('[data-lb=sluit]', lbEl).focus();
    var gs = $('#lb-gebruik', lbEl);
    if (gs) gs.onchange = function () { var v = gs.value || null; api('foto_gebruik', { foto_id: f.id, gebruik: v }).then(function () { f.gebruik = v; toast('Opgeslagen.'); lichtbak(i); }, function (er) { toast(er.message); }); };
    var fbf = $('#lb-fb', lbEl);
    if (fbf) fbf.addEventListener('submit', function (e) {
      e.preventDefault(); var t = $('#lb-fb-in', lbEl).value.trim();
      api('foto_feedback', { foto_id: f.id, tekst: t }).then(function () { f.feedback = t || null; toast(t ? 'Opmerking opgeslagen.' : 'Opmerking verwijderd.'); var y = window.scrollY; tekenAlbum(); window.scrollTo(0, y); lichtbak(i); }, function (er) { toast(er.message); });
    });
  }
  function sluitLichtbak() { if (lbEl) { lbEl.remove(); lbEl = null; } }
  function downloadFoto(f) {
    if (HUIDIG && HUIDIG.gedeeld) { if (!f.download) return Promise.resolve(); var d = document.createElement('a'); d.href = f.download; d.rel = 'noopener'; d.download = f.naam; document.body.appendChild(d); d.click(); d.remove(); return Promise.resolve(); }
    return api('download', { foto_id: f.id }).then(function (j) {
      var a = document.createElement('a'); a.href = j.url; a.rel = 'noopener'; a.download = f.naam; document.body.appendChild(a); a.click(); a.remove();
    });
  }

  /* ---------- uploaden ---------- */
  function maakVoorbeeld(file) {
    // Maakt een voorbeeld (1600 px) en miniatuur (480 px) als JPEG. Lukt dat niet (bv. HEIC op Chrome), dan zonder.
    function vanBron(bron, w, h) {
      function schaal(max, kwaliteit) {
        var s = Math.min(1, max / Math.max(w, h)), c = document.createElement('canvas');
        c.width = Math.round(w * s); c.height = Math.round(h * s);
        c.getContext('2d').drawImage(bron, 0, 0, c.width, c.height);
        return new Promise(function (res) { c.toBlob(res, 'image/jpeg', kwaliteit); });
      }
      return Promise.all([schaal(1600, 0.82), schaal(480, 0.72)]).then(function (r) { return r[0] && r[1] ? { groot: r[0], mini: r[1] } : null; });
    }
    if (/^video\//.test(file.type)) {
      return new Promise(function (res) {
        var v = document.createElement('video'), url = URL.createObjectURL(file), klaar = false;
        var stop = function (x) { if (klaar) return; klaar = true; URL.revokeObjectURL(url); res(x); };
        v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
        v.onloadeddata = function () { try { v.currentTime = Math.min(1, (v.duration || 2) / 3); } catch (e) { stop(null); } };
        v.onseeked = function () { if (!v.videoWidth) return stop(null); vanBron(v, v.videoWidth, v.videoHeight).then(stop, function () { stop(null); }); };
        v.onerror = function () { stop(null); };
        setTimeout(function () { stop(null); }, 8000);
      });
    }
    if (!/^image\//.test(file.type) && !/\.(heic|heif)$/i.test(file.name)) return Promise.resolve(null);
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: 'from-image' }).then(function (bm) { return vanBron(bm, bm.width, bm.height); }).catch(function () { return viaImg(file); });
    }
    return viaImg(file);
    function viaImg(f) {
      return new Promise(function (res) {
        var img = new Image(), url = URL.createObjectURL(f);
        img.onload = function () { vanBron(img, img.naturalWidth, img.naturalHeight).then(function (x) { URL.revokeObjectURL(url); res(x); }, function () { res(null); }); };
        img.onerror = function () { URL.revokeObjectURL(url); res(null); };
        img.src = url;
      });
    }
  }
  function put(url, blob, type, opVoortgang) {
    return new Promise(function (res, rej) {
      var x = new XMLHttpRequest();
      x.open('PUT', url);
      x.setRequestHeader('Content-Type', type || 'application/octet-stream');
      x.upload.onprogress = function (e) { if (e.lengthComputable && opVoortgang) opVoortgang(e.loaded / e.total); };
      x.onload = function () { x.status >= 200 && x.status < 300 ? res() : rej(new Error('Upload mislukt (' + x.status + ')')); };
      x.onerror = function () { rej(new Error('Verbinding verbroken tijdens uploaden.')); };
      x.send(blob);
    });
  }
  function uploadVenster(albumId) {
    var klant = T.rol === 'klant';
    var albums = klant && T.ik ? T.ik.albums.filter(function (a) { return a.soort === 'eigen'; }) : [];
    var ov = document.createElement('div');
    ov.className = 'overlay'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'up-titel');
    var keuze = albumId ? '' : '<div class="veld"><label for="u-album">Naar album</label><select id="u-album">' +
      albums.map(function (a) { return '<option value="' + esc(a.id) + '">' + esc(a.titel) + '</option>'; }).join('') +
      '<option value="__nieuw">' + (albums.length ? '+ Nieuw album…' : 'Telefoon-uploads (nieuw)') + '</option></select></div>';
    ov.innerHTML = '<div class="kaart modal in"><button type="button" class="icon-btn sluit" aria-label="Sluiten" data-u="sluit">' + I.x + '</button>' +
      '<h2 id="up-titel">Foto’s uploaden</h2><div id="u-inhoud" style="display:flex;flex-direction:column;gap:18px">' + keuze +
      '<label class="drop" id="u-drop" tabindex="0"><span class="grad rondje" style="width:60px;height:60px">' + I.up.replace('currentColor', '#0D0A12').replace('width="18" height="18"', 'width="26" height="26"') + '</span>Kies foto’s of video’s<span style="color:#B3A9BD;font-weight:500;font-size:14px">of sleep ze hierheen</span><small>JPG, PNG, HEIC en video · originele kwaliteit</small>' +
      '<input type="file" id="u-bestand" multiple accept="image/*,video/*,.heic,.heif" class="sr"></label></div></div>';
    document.body.appendChild(ov);
    var bezig = false;
    var sluit = function () { if (bezig && !confirm('Het uploaden is nog bezig. Weet je zeker dat je wilt stoppen?')) return; ov.remove(); };
    $('[data-u=sluit]', ov).onclick = sluit;
    ov.addEventListener('click', function (e) { if (e.target === ov && !bezig) ov.remove(); });
    var drop = $('#u-drop', ov), inp = $('#u-bestand', ov);
    drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } });
    ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files.length) start(e.dataTransfer.files); });
    inp.addEventListener('change', function () { if (inp.files.length) start(inp.files); });
    setTimeout(function () { drop.focus(); }, 50);

    function kiesAlbum() {
      if (albumId) return Promise.resolve({ id: albumId, titel: HUIDIG && HUIDIG.album ? HUIDIG.album.titel : '' });
      var sel = $('#u-album', ov), v = sel ? sel.value : '__nieuw';
      if (v !== '__nieuw') return Promise.resolve({ id: v, titel: sel.options[sel.selectedIndex].text });
      var titel = albums.length ? (prompt('Naam van het nieuwe album:', 'Nieuw album') || '').trim() : 'Telefoon-uploads';
      if (!titel) return Promise.reject(new Error('Geen albumnaam gekozen.'));
      return api('album_maken', { titel: titel }).then(function (j) { return { id: j.album.id, titel: j.album.titel }; });
    }
    function start(lijst) {
      var files = Array.prototype.slice.call(lijst, 0, 200);
      var inhoud = $('#u-inhoud', ov);
      var doelAlbum;
      bezig = true;
      inhoud.innerHTML = '<p class="sub" style="font-size:15px" id="u-status">Voorbereiden…</p><div class="uplijst">' + files.map(function (f, i) {
        return '<div class="upitem"><span class="mini" id="u-mini-' + i + '"></span><div class="wat"><span>' + esc(f.name) + ' · ' + gb(f.size) + '</span><div class="balk"><span id="u-balk-' + i + '" style="width:0%"></span></div></div></div>';
      }).join('') + '</div><p class="melding" id="u-fout" role="alert" hidden></p>';
      var voorbeelden = [];
      kiesAlbum().then(function (a) {
        doelAlbum = a;
        $('#u-status', ov).textContent = 'Voorbeelden maken…';
        var p = Promise.resolve();
        files.forEach(function (f, i) {
          p = p.then(function () { return maakVoorbeeld(f).then(function (vb) {
            voorbeelden[i] = vb;
            if (vb) { var u = URL.createObjectURL(vb.mini); $('#u-mini-' + i, ov).outerHTML = '<img class="mini" src="' + u + '" alt="">'; }
          }); });
        });
        return p;
      }).then(function () {
        $('#u-status', ov).textContent = fotos(files.length) + ' uploaden naar ' + (doelAlbum.titel || 'je album') + '…';
        return api('upload_start', { album_id: doelAlbum.id, bestanden: files.map(function (f, i) { return { naam: f.name, type: f.type || 'application/octet-stream', grootte: f.size, metVoorbeeld: !!voorbeelden[i] }; }) });
      }).then(function (j) {
        var klaarIds = [], mislukt = 0, volgende = 0;
        function werker() {
          if (volgende >= j.uploads.length) return Promise.resolve();
          var i = volgende++, u = j.uploads[i], f = files[i], vb = voorbeelden[i], balk = $('#u-balk-' + i, ov);
          return put(u.origineel, f, f.type, function (x) { balk.style.width = Math.round(x * 92) + '%'; })
            .then(function () { return vb && u.groot ? put(u.groot, vb.groot, 'image/jpeg') : null; })
            .then(function () { return vb && u.mini ? put(u.mini, vb.mini, 'image/jpeg') : null; })
            .then(function () { balk.style.width = '100%'; klaarIds.push(u.id); }, function () { mislukt++; balk.style.background = '#FF8A88'; balk.style.width = '100%'; })
            .then(werker);
        }
        return Promise.all([werker(), werker(), werker()]).then(function () {
          return api('upload_klaar', { ids: klaarIds }).then(function (r) { return { klaar: r.klaar, mislukt: mislukt }; });
        });
      }).then(function (r) {
        bezig = false;
        var klantTekst = klant ? '<p class="sub" style="font-size:15px">Je kunt ze nu van je telefoon verwijderen om ruimte vrij te maken. Ze blijven hier bewaard in originele kwaliteit.</p>' : '';
        inhoud.innerHTML = '<div class="in" style="display:flex;flex-direction:column;gap:14px;align-items:flex-start"><span class="vink grad">' + I.vink + '</span>' +
          '<p style="margin:0;font-size:18px;font-weight:700">' + fotos(r.klaar) + ' staan veilig in ' + esc(doelAlbum.titel || 'je album') + '.</p>' + klantTekst +
          (r.mislukt ? '<p class="melding" role="alert">' + r.mislukt + ' bestand(en) zijn niet gelukt. Probeer die opnieuw.</p>' : '') +
          '<button type="button" class="btn btn-grad" id="u-klaar">Bekijk album</button></div>';
        $('#u-klaar', ov).onclick = function () { ov.remove(); if (location.hash === '#/album/' + doelAlbum.id) albumScherm(doelAlbum.id); else location.hash = '#/album/' + doelAlbum.id; };
      }).catch(function (e) {
        bezig = false;
        var fe = $('#u-fout', ov); if (fe) { fe.hidden = false; fe.textContent = e.message; }
        var st = $('#u-status', ov); if (st) st.textContent = 'Uploaden gestopt.';
      });
    }
  }

  /* ---------- beheer ---------- */
  var HUIDIG_KLANT = null;
  function status(k) {
    var p = k.quota_bytes ? k.eigen / k.quota_bytes : 0;
    if (k.status === 'gepauzeerd') return '<span class="pil gepauzeerd">Gepauzeerd</span>';
    if (k.status === 'uitgenodigd') return '<span class="pil uitgenodigd">Uitgenodigd</span>';
    return p >= 0.8 ? '<span class="pil vol">Bijna vol</span>' : '<span class="pil actief">Actief</span>';
  }
  function beheerScherm() {
    scherm(kop() + '<main>' + laden() + '</main>');
    Promise.all([api('klanten'), api('aanvragen').catch(function () { return { aanvragen: [] }; })]).then(function (rr) {
      var j = rr[0], nieuw = rr[1].aanvragen.filter(function (a) { return a.status === 'aangevraagd'; }).length;
      var k = j.klanten, totaal = k.reduce(function (t, x) { return t + Number(x.eigen || 0); }, 0);
      var vol = k.filter(function (x) { return x.quota_bytes && x.eigen / x.quota_bytes >= 0.8; }).length;
      scherm(kop() + '<main class="in" style="gap:28px">' + beheerTabs('klanten', nieuw) +
        '<div class="rij"><div style="display:flex;flex-direction:column;gap:8px"><h1 class="titel">Klanten</h1><p class="sub">Alleen jij maakt accounts aan. Een klant krijgt een uitnodiging per mail en logt in met een code.</p></div>' +
        '<button type="button" class="btn btn-grad" data-actie="klant-nieuw">' + I.plus + 'Klant toevoegen</button></div>' +
        '<div class="stats"><div class="kaart"><span>Klanten</span><b>' + k.length + '</b></div><div class="kaart"><span>Eigen foto’s van klanten</span><b>' + gb(totaal) + '</b></div><div class="kaart"><span>Bijna vol (boven 80%)</span><b>' + vol + '</b></div></div>' +
        (k.length ? '<div class="kaart tabel"><table><caption class="sr">Klanten en hun opslag</caption><thead><tr><th scope="col">Klant</th><th scope="col">Opslag</th><th scope="col">Shoots</th><th scope="col">Laatst ingelogd</th><th scope="col">Status</th><th scope="col"><span class="sr">Acties</span></th></tr></thead><tbody>' +
          k.map(function (x) {
            var p = Math.min(100, Math.round((x.eigen / x.quota_bytes) * 100));
            return '<tr><td><div style="display:flex;align-items:center;gap:12px"><span class="rondje grad">' + esc(x.naam.charAt(0).toUpperCase()) + '</span><span style="display:flex;flex-direction:column;gap:2px"><b>' + esc(x.naam) + '</b><span style="color:#B3A9BD;font-size:13px">' + esc(x.email) + '</span></span></div></td>' +
              '<td><div style="display:flex;flex-direction:column;gap:6px;min-width:150px"><span style="font-size:13px;color:#B3A9BD"><b style="color:#F7F3FA">' + gb(x.eigen) + '</b> van ' + gb(x.quota_bytes) + '</span><div class="balk" style="height:8px"><span style="width:' + p + '%"></span></div></div></td>' +
              '<td>' + x.shoots + (x.ongelezen ? ' <span class="pil st-aangevraagd" title="Ongelezen berichten">' + x.ongelezen + ' bericht' + (x.ongelezen > 1 ? 'en' : '') + '</span>' : '') + '</td><td style="color:#B3A9BD;font-size:14px">' + (x.laatst_ingelogd ? datum(x.laatst_ingelogd) : 'Nog niet') + '</td><td>' + status(x) + '</td>' +
              '<td style="text-align:right"><a class="btn btn-ghost btn-klein" href="#/beheer/klant/' + esc(x.id) + '">Openen</a></td></tr>';
          }).join('') + '</tbody></table></div>' : '<div class="leeg">Nog geen klanten. Klik op <b>Klant toevoegen</b> om je eerste klant uit te nodigen.</div>') +
        '</main>');
    }, function (e) { scherm(kop() + '<main>' + fout(e) + '</main>'); });
  }
  function klantScherm(id) {
    HUIDIG_KLANT = id;
    scherm(kop() + '<main>' + laden() + '</main>');
    Promise.all([api('klant_shoots', { klant_id: id }), api('klanten')]).then(function (r) {
      var j = r[0], k = r[1].klanten.filter(function (x) { return x.id === id; })[0] || {};
      var qgb = Math.round(k.quota_bytes / 1024 / 1024 / 1024);
      scherm(kop() + '<main class="in" style="gap:30px">' +
        '<div style="display:flex;flex-direction:column;gap:8px"><a class="terug" href="#/beheer">' + I.links + 'Alle klanten</a>' +
        '<h1 class="titel">' + esc(j.klant.naam) + '</h1><span class="sub" style="font-size:15px">' + esc(j.klant.email) + ' · ' + status(k) + '</span></div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:20px">' +
        '<form class="kaart" id="k-form" style="flex:1 1 340px;padding:24px;display:flex;flex-direction:column;gap:16px"><h2 class="sectie" style="font-size:20px">Account</h2>' +
        '<div class="veld"><label for="k-naam">Naam</label><input id="k-naam" value="' + esc(j.klant.naam) + '"></div>' +
        '<div class="veld"><label for="k-quota">Opslagruimte (GB)</label><input id="k-quota" type="number" min="1" max="2000" value="' + qgb + '"></div>' +
        '<div style="color:#B3A9BD;font-size:14px">In gebruik: <b style="color:#F7F3FA">' + gb(k.eigen) + '</b> eigen foto’s</div>' +
        '<div class="knoppen"><button type="submit" class="btn btn-grad btn-klein">Opslaan</button>' +
        '<button type="button" class="btn btn-ghost btn-klein" data-actie="uitnodigen">Uitnodiging opnieuw sturen</button></div>' +
        '<div class="knoppen"><button type="button" class="btn btn-ghost btn-klein" data-actie="pauze">' + (k.status === 'gepauzeerd' ? 'Account weer activeren' : 'Account pauzeren') + '</button>' +
        '<button type="button" class="btn btn-rood btn-klein" data-actie="klant-weg">Klant verwijderen</button></div></form>' +
        '<form class="kaart" id="s-form" style="flex:1 1 340px;padding:24px;display:flex;flex-direction:column;gap:16px"><h2 class="sectie" style="font-size:20px">Nieuwe shoot aanleveren</h2>' +
        '<p class="sub" style="font-size:14px">Maak een album aan, upload de bewerkte foto’s en zet het klaar. Pas dan ziet de klant het en krijgt hij een mail.</p>' +
        '<div class="veld"><label for="s-titel">Naam van de shoot</label><input id="s-titel" placeholder="Bijv. Fotoshoot op locatie" required></div>' +
        '<button type="submit" class="btn btn-grad" style="align-self:flex-start">' + I.plus + 'Shoot aanmaken</button></form></div>' +
        '<section style="display:flex;flex-direction:column;gap:18px"><h2 class="sectie">Shoots van ' + esc(voornaam(j.klant.naam)) + '</h2>' +
        (j.shoots.length ? '<div class="albums">' + j.shoots.map(function (a) { return albumKaart(a, true); }).join('') + '</div>' : '<div class="leeg">Nog geen shoots aangeleverd.</div>') +
        '<p class="sub" style="font-size:13px">Eigen albums van de klant zie je hier bewust niet: die zijn privé.</p></section></main>');
      $('#k-form').addEventListener('submit', function (e) {
        e.preventDefault();
        api('klant_wijzigen', { klant_id: id, naam: $('#k-naam').value, quota_gb: Number($('#k-quota').value) }).then(function () { toast('Opgeslagen.'); klantScherm(id); }, function (er) { toast(er.message); });
      });
      $('#s-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var t = $('#s-titel').value.trim(); if (!t) { $('#s-titel').focus(); return; }
        api('shoot_maken', { klant_id: id, titel: t }).then(function (r2) { location.hash = '#/album/' + r2.album.id; setTimeout(function () { uploadVenster(r2.album.id); }, 600); }, function (er) { toast(er.message); });
      });
      $app.dataset.klant = JSON.stringify({ status: k.status, naam: j.klant.naam });
    }, function (e) { scherm(kop() + '<main><a class="terug" href="#/beheer">' + I.links + 'Alle klanten</a>' + fout(e) + '</main>'); });
  }
  function nieuweKlant() {
    var ov = document.createElement('div');
    ov.className = 'overlay'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'nk-titel');
    ov.innerHTML = '<form class="kaart modal in" novalidate><button type="button" class="icon-btn sluit" aria-label="Sluiten" data-n="sluit">' + I.x + '</button><h2 id="nk-titel">Klant toevoegen</h2>' +
      '<div class="veld"><label for="n-naam">Naam</label><input id="n-naam" required autocomplete="off"></div>' +
      '<div class="veld"><label for="n-mail">E-mailadres</label><input id="n-mail" type="email" required autocomplete="off"></div>' +
      '<div class="veld"><label for="n-quota">Opslagruimte</label><select id="n-quota"><option value="5">5 GB</option><option value="10" selected>10 GB</option><option value="25">25 GB</option><option value="50">50 GB</option><option value="100">100 GB</option></select></div>' +
      '<label style="display:flex;gap:12px;align-items:center;font-size:15px;min-height:44px"><input type="checkbox" id="n-uit" checked style="width:20px;height:20px;accent-color:#C957B0">Stuur meteen een uitnodiging per mail</label>' +
      '<p class="melding" id="n-fout" role="alert" hidden></p>' +
      '<div class="knoppen"><button type="submit" class="btn btn-grad">Klant toevoegen</button><button type="button" class="btn btn-ghost" data-n="sluit">Annuleren</button></div></form>';
    document.body.appendChild(ov);
    $$('[data-n=sluit]', ov).forEach(function (b) { b.onclick = function () { ov.remove(); }; });
    $('#n-naam', ov).focus();
    $('form', ov).addEventListener('submit', function (e) {
      e.preventDefault();
      var b = $('button[type=submit]', ov); b.disabled = true;
      api('klant_maken', { naam: $('#n-naam', ov).value, email: $('#n-mail', ov).value, quota_gb: Number($('#n-quota', ov).value), uitnodigen: $('#n-uit', ov).checked })
        .then(function (j) { ov.remove(); toast($('#n-uit', ov) && $('#n-uit', ov).checked ? 'Klant toegevoegd en uitgenodigd.' : 'Klant toegevoegd.'); location.hash = '#/beheer/klant/' + j.klant.id; },
          function (er) { b.disabled = false; var f = $('#n-fout', ov); f.hidden = false; f.textContent = er.message; });
    });
  }

  /* ---------- shoot boeken (zonder inloggen) ---------- */
  var SOORT = {
    foto: { t: 'Fotografie', s: 'Portret, lifestyle of zakelijk', i: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>' },
    video: { t: 'Video & film', s: 'Van clip tot bedrijfsfilm', i: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>' },
    drone: { t: 'Drone', s: 'Beelden vanuit de lucht', i: '<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M7 8l3 3M17 8l-3 3M7 16l3-3M17 16l-3-3"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/>' },
    event: { t: 'Event', s: 'Feest, bruiloft of bedrijfsevent', i: '<path d="M5 21l4-12 6 6z"/><path d="M14 4v2M19 9h2M17.5 5.5l-1.5 1.5M12 9l1-1"/>' },
    social: { t: 'Social media', s: 'Content voor Instagram & TikTok', i: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17" cy="7" r="1" fill="currentColor"/>' }
  };
  var STATUS = [
    ['aangevraagd', 'Aangevraagd', 'We bekijken je aanvraag en sturen je binnen 24 uur een voorstel met prijs.'],
    ['bevestigd', 'Bevestigd', 'Je shoot staat vast. We nemen de laatste details met je door.'],
    ['geschoten', 'Geschoten', 'Bedankt voor de shoot! We zoeken nu de beste beelden uit.'],
    ['bewerking', 'In bewerking', 'We zijn je beelden aan het bewerken.'],
    ['klaar', 'Klaar', 'Je beelden staan in je portaal. Log in om ze te bekijken en te downloaden.']
  ];
  var DAGDEEL = ['ochtend', 'middag', 'avond', 'geen voorkeur'];
  function icoon(k, maat) { return '<svg aria-hidden="true" width="' + (maat || 26) + '" height="' + (maat || 26) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + SOORT[k].i + '</svg>'; }
  function langeDatum(d) { if (!d) return ''; try { return new Date(d + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return d; } }
  function iso(dt) { return dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2); }
  function pubKop() {
    return '<header class="kop"><div class="kop-in"><a class="logo" href="https://lux-media.nl" aria-label="Naar lux-media.nl">' + LOGO + '<span style="display:flex;flex-direction:column;line-height:.95"><i style="font-size:15px">LUX</i><b style="font-size:17px">Media</b></span></a>' +
      '<div class="kop-rechts">' + (T.token ? '<a class="btn btn-ghost btn-klein" href="#/">Naar mijn portaal</a>' : '<a class="btn btn-ghost btn-klein" href="#/">Inloggen</a>') + '</div></div></header>';
  }

  var B = null; // formulier-staat
  function boekScherm(ref) {
    B = { soorten: [], datum: null, maand: null, bezet: [], flex: false, dagdeel: 'geen voorkeur', ref: null };
    var nu = new Date(); B.maand = new Date(nu.getFullYear(), nu.getMonth(), 1);
    scherm(pubKop() + '<main class="in boek">' +
      '<div class="boek-kop"><span class="grad-text eyebrow">SHOOT BOEKEN</span><h1 class="titel">Vertel ons wat je <span class="grad-text">in gedachten</span> hebt.</h1>' +
      '<p class="sub">Je hebt geen account nodig. Je hoort binnen 24 uur van ons met een voorstel en een prijs op maat. Aanvragen is gratis en zit nergens aan vast.</p><div id="ref-banner" hidden></div></div>' +
      '<form id="boek" class="boek-form" novalidate>' +
      '<section class="kaart stap"><div class="stap-kop"><span class="nr grad">1</span><div><h2>Wat wil je laten maken?</h2><p>Kies er één of meer.</p></div></div>' +
      '<div class="keuzes" role="group" aria-label="Soort shoot">' + Object.keys(SOORT).map(function (k) {
        return '<label class="keuze"><input type="checkbox" name="soort" value="' + k + '"><span class="keuze-in"><span class="keuze-icoon">' + icoon(k) + '</span><b>' + SOORT[k].t + '</b><small>' + SOORT[k].s + '</small></span></label>';
      }).join('') + '</div></section>' +
      '<section class="kaart stap"><div class="stap-kop"><span class="nr grad">2</span><div><h2>Wanneer?</h2><p>Kies een datum die je goed uitkomt. Weet je het nog niet? Sla dit gewoon over.</p></div></div>' +
      '<div class="wanneer"><div class="kalender" id="kal" aria-live="polite"></div>' +
      '<div class="wanneer-rechts"><div class="gekozen" id="gekozen">Nog geen datum gekozen</div>' +
      '<label class="vink-rij"><input type="checkbox" id="b-flex">Mijn datum is flexibel</label>' +
      '<div class="veld"><span class="label">Voorkeur voor dagdeel</span><div class="chips" role="radiogroup" aria-label="Dagdeel">' + DAGDEEL.map(function (d) {
        return '<label class="chip"><input type="radio" name="dagdeel" value="' + d + '"' + (d === 'geen voorkeur' ? ' checked' : '') + '><span>' + d.charAt(0).toUpperCase() + d.slice(1) + '</span></label>';
      }).join('') + '</div></div></div></div></section>' +
      '<section class="kaart stap"><div class="stap-kop"><span class="nr grad">3</span><div><h2>Waar?</h2><p>Wij houden van mooie locaties, het liefst buiten. Binnen kan natuurlijk ook.</p></div></div>' +
      '<div class="veld"><label for="b-loc">Locatie of plaats</label><input id="b-loc" placeholder="Bijv. Kinderdijk, je bedrijf in Rotterdam…" autocomplete="off"></div>' +
      '<label class="vink-rij"><input type="checkbox" id="b-mee" checked>LUX mag meedenken over een mooie locatie</label></section>' +
      '<section class="kaart stap"><div class="stap-kop"><span class="nr grad">4</span><div><h2>Over jou</h2><p>Zodat we je een voorstel kunnen sturen.</p></div></div>' +
      '<div class="velden2"><div class="veld"><label for="b-naam">Naam *</label><input id="b-naam" autocomplete="name" required></div>' +
      '<div class="veld"><label for="b-mail">E-mailadres *</label><input id="b-mail" type="email" inputmode="email" autocomplete="email" required></div>' +
      '<div class="veld"><label for="b-tel">Telefoon <span style="font-weight:500;color:#8E849A">(optioneel)</span></label><input id="b-tel" type="tel" inputmode="tel" autocomplete="tel"></div></div>' +
      '<div class="veld"><label for="b-wens">Vertel iets over je idee</label><textarea id="b-wens" rows="5" placeholder="Waar is het voor? Welke sfeer zoek je? Hoeveel personen?"></textarea></div>' +
      '<div class="potje" aria-hidden="true"><label>Website<input id="b-web" tabindex="-1" autocomplete="off"></label></div></section>' +
      '<p class="melding" id="b-fout" role="alert" hidden></p>' +
      '<div class="boek-onder"><button type="submit" class="btn btn-grad btn-groot">Aanvraag versturen</button><span class="sub" style="font-size:13px">Door te versturen ga je akkoord met onze <a href="privacy.html">privacyverklaring</a>.</span></div>' +
      '</form></main>');
    tekenKalender();
    api('bezet').then(function (j) { B.bezet = j.datums || []; tekenKalender(); }, function () {});
    if (ref) api('ref_info', { code: ref }).then(function (r) { if (!r.geldig) return; B.ref = ref; var bn = $('#ref-banner'); if (!bn) return; bn.hidden = false; bn.className = 'ref-banner'; bn.innerHTML = '<span class="grad rondje" style="width:40px;height:40px">%</span><span><b>' + esc(r.voornaam) + ' heeft je doorverwezen!</b> Je krijgt ' + esc(KORTING) + ' korting op je eerste shoot.</span>'; }, function () {});
    $('#b-flex').onchange = function () { B.flex = this.checked; };
    $('#boek').addEventListener('change', function () { $('#b-fout').hidden = true; });
    $('#boek').addEventListener('submit', verstuurBoeking);
  }
  function tekenKalender() {
    var kal = $('#kal'); if (!kal) return;
    var m = B.maand, vandaag = iso(new Date()), nu = new Date(); nu = new Date(nu.getFullYear(), nu.getMonth(), 1);
    var eerste = (m.getDay() + 6) % 7, dagen = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    var titel = m.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
    var h = '<div class="kal-kop"><button type="button" class="icon-btn" data-kal="-1" aria-label="Vorige maand"' + (m <= nu ? ' disabled' : '') + '>' + I.links + '</button><b>' + titel.charAt(0).toUpperCase() + titel.slice(1) + '</b><button type="button" class="icon-btn" data-kal="1" aria-label="Volgende maand">' + I.rechts + '</button></div>' +
      '<div class="kal-grid" role="grid">' + ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map(function (d) { return '<span class="kal-dag" role="columnheader">' + d + '</span>'; }).join('');
    for (var i = 0; i < eerste; i++) h += '<span></span>';
    for (var d = 1; d <= dagen; d++) {
      var s = iso(new Date(m.getFullYear(), m.getMonth(), d)), voorbij = s < vandaag, vol = B.bezet.indexOf(s) >= 0;
      h += '<button type="button" class="kal-d' + (s === B.datum ? ' gekozen-d' : '') + (vol ? ' vol' : '') + (s === vandaag ? ' vandaag' : '') + '" data-dag="' + s + '"' + (voorbij || vol ? ' disabled' : '') +
        ' aria-label="' + langeDatum(s) + (vol ? ', al volgeboekt' : '') + '" aria-pressed="' + (s === B.datum) + '">' + d + '</button>';
    }
    kal.innerHTML = h + '</div><div class="kal-legenda"><span><i class="bol vol"></i>Al volgeboekt</span><span><i class="bol grad"></i>Jouw keuze</span></div>';
    $$('[data-kal]', kal).forEach(function (b) { b.onclick = function () { B.maand = new Date(m.getFullYear(), m.getMonth() + Number(b.dataset.kal), 1); tekenKalender(); }; });
    $$('[data-dag]', kal).forEach(function (b) { b.onclick = function () { B.datum = B.datum === b.dataset.dag ? null : b.dataset.dag; tekenKalender(); var k = $('[data-dag="' + b.dataset.dag + '"]'); if (k) k.focus(); }; });
    var g = $('#gekozen'); if (g) g.innerHTML = B.datum ? '<span style="color:#B3A9BD;font-size:13px;font-weight:600">Gekozen datum</span><b>' + esc(langeDatum(B.datum)) + '</b>' : 'Nog geen datum gekozen';
  }
  function verstuurBoeking(e) {
    e.preventDefault();
    var f = $('#b-fout'), soorten = $$('input[name=soort]:checked').map(function (x) { return x.value; });
    var naam = $('#b-naam').value.trim(), mail = $('#b-mail').value.trim();
    function stop(t, el) { f.hidden = false; f.textContent = t; if (el) { el.focus(); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }
    if (!soorten.length) return stop('Kies wat voor shoot je wilt (stap 1).', $('input[name=soort]'));
    if (!naam) return stop('Vul je naam in.', $('#b-naam'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return stop('Vul een geldig e-mailadres in.', $('#b-mail'));
    f.hidden = true;
    var loc = $('#b-loc').value.trim(), mee = $('#b-mee').checked;
    var knopje = $('#boek button[type=submit]'); knopje.disabled = true; knopje.textContent = 'Versturen…';
    api('aanvraag_doen', {
      soorten: soorten, datum: B.datum, datum_flexibel: B.flex, dagdeel: ($('input[name=dagdeel]:checked') || {}).value,
      locatie: loc ? loc + (mee ? ' (LUX mag meedenken)' : '') : (mee ? '' : ''), naam: naam, email: mail,
      telefoon: $('#b-tel').value.trim(), wens: $('#b-wens').value.trim(), website: $('#b-web').value, ref: B.ref
    }).then(function (j) {
      scherm(pubKop() + '<main class="in boek"><div class="kaart bedankt"><span class="vink grad">' + I.vink + '</span>' +
        '<h1 class="titel" style="font-size:clamp(28px,4vw,40px)">Aanvraag verstuurd!</h1>' +
        '<p class="sub">Bedankt, ' + esc(voornaam(naam)) + '. We hebben een bevestiging gestuurd naar <b style="color:#F7F3FA">' + esc(mail) + '</b>. Binnen 24 uur hoor je van ons met een voorstel en prijs.</p>' +
        '<div class="knoppen" style="justify-content:center">' + (j.volg ? '<a class="btn btn-grad" href="#/volg/' + esc(j.volg) + '">Volg je aanvraag</a>' : '') + '<a class="btn btn-ghost" href="https://lux-media.nl">Terug naar lux-media.nl</a></div></div></main>');
    }, function (er) { knopje.disabled = false; knopje.textContent = 'Aanvraag versturen'; stop(er.message); });
  }

  function volgScherm(code) {
    scherm(pubKop() + '<main>' + laden() + '</main>');
    api('volg', { code: code }).then(function (j) { tekenVolg(code, j.aanvraag); }, function (e) {
      scherm(pubKop() + '<main class="in boek"><div class="kaart bedankt"><h1 class="titel" style="font-size:32px">Aanvraag niet gevonden</h1><p class="sub">' + esc(e.message) + '</p><div class="knoppen" style="justify-content:center"><a class="btn btn-grad" href="#/boeken">Shoot boeken</a></div></div></main>');
    });
  }
  function tekenVolg(code, a) {
    var idx = STATUS.map(function (s) { return s[0]; }).indexOf(a.status);
    var afgewezen = a.status === 'afgewezen', voorstel = a.status === 'voorstel';
    if (voorstel) idx = 0;
    var allesKlaar = a.status === 'klaar';
    var tijdlijn = afgewezen ? '' : '<ol class="tijdlijn">' + STATUS.map(function (s, i) {
      var st = i < idx || allesKlaar ? 'klaar' : i === idx ? 'nu' : '';
      return '<li class="' + st + '"><span class="punt">' + (i < idx ? I.vink.replace(/width="30" height="30"/, 'width="14" height="14"') : '') + '</span><div><b>' + s[1] + '</b>' + (i === idx && !voorstel ? '<p>' + s[2] + '</p>' : '') + '</div></li>';
    }).join('') + '</ol>';
    var datumTekst = a.geplande_datum && a.status !== 'aangevraagd' && !voorstel ? langeDatum(a.geplande_datum) : a.datum ? langeDatum(a.datum) + (a.datum_flexibel ? ' (flexibel)' : '') : 'Nog geen voorkeur';
    scherm(pubKop() + '<main class="in boek">' +
      '<div class="boek-kop"><span class="grad-text eyebrow">JE AANVRAAG</span><h1 class="titel">Hoi ' + esc(a.naam) + '</h1>' +
      '<p class="sub">Hier zie je hoe het met je shoot staat. Bewaar deze link, of open hem via de mail die we je stuurden.</p></div>' +
      (voorstel ? '<div class="kaart voorstel"><span class="pil uitgenodigd" style="align-self:flex-start">Nieuw voorstel</span><h2>Op je gewenste datum lukt het helaas niet. Past deze datum?</h2>' +
        '<p class="groot-datum grad-text">' + esc(langeDatum(a.geplande_datum)) + '</p>' + (a.bericht ? '<p class="bericht">' + esc(a.bericht) + '</p>' : '') +
        '<div class="knoppen"><button type="button" class="btn btn-grad" id="v-ja">Ja, dat komt goed uit</button><button type="button" class="btn btn-ghost" id="v-nee">Past niet</button></div>' +
        '<div id="v-nee-vak" hidden class="veld"><label for="v-opm">Wanneer kan het wel?</label><textarea id="v-opm" rows="3" placeholder="Bijv. liever in het weekend, of na 15 november"></textarea><button type="button" class="btn btn-ghost btn-klein" id="v-stuur" style="align-self:flex-start">Versturen</button></div></div>' : '') +
      (afgewezen ? '<div class="kaart voorstel"><h2>Helaas lukt deze shoot niet</h2><p class="sub">' + esc(a.bericht || 'Bedankt voor je aanvraag. Helaas kunnen we deze shoot niet voor je doen.') + '</p><div class="knoppen"><a class="btn btn-ghost" href="#/boeken">Nieuwe aanvraag</a></div></div>' : '') +
      '<div class="volg-grid">' + (afgewezen ? '' : '<div class="kaart" style="padding:26px">' + tijdlijn + '</div>') +
      '<div class="kaart volg-info"><h2 class="sectie" style="font-size:20px">Details</h2><dl>' +
      '<dt>Wat</dt><dd><span class="soort-pillen">' + (a.soorten || []).map(function (s) { return SOORT[s] ? '<span>' + icoon(s, 16) + SOORT[s].t + '</span>' : ''; }).join('') + '</span></dd>' +
      '<dt>' + (a.status === 'aangevraagd' || voorstel ? 'Gewenste datum' : 'Datum') + '</dt><dd>' + esc(datumTekst) + (a.dagdeel && a.dagdeel !== 'geen voorkeur' ? ' · ' + esc(a.dagdeel) : '') + '</dd>' +
      '<dt>Locatie</dt><dd>' + esc(a.locatie || 'LUX denkt mee') + '</dd>' +
      '<dt>Aangevraagd</dt><dd>' + esc(datum(a.aangemaakt)) + '</dd></dl>' +
      (a.bericht && !voorstel && !afgewezen ? '<p class="bericht"><b>Bericht van LUX</b><br>' + esc(a.bericht) + '</p>' : '') +
      (a.heeft_account ? '<div class="portaal-tip"><b>' + (a.status === 'klaar' ? 'Je beelden staan klaar!' : 'Je portaal staat klaar') + '</b><span>' + (a.status === 'klaar' ? 'Log in met je e-mailadres om ze te bekijken en te downloaden.' : 'Hier komen straks je foto’s en video’s. Inloggen doe je met je e-mailadres.') + '</span><a class="btn btn-grad btn-klein" href="#/">' + (a.status === 'klaar' ? 'Bekijk je beelden' : 'Naar je portaal') + '</a></div>' : '') +
      '<p class="sub" style="font-size:13px">Vragen? Mail <a href="mailto:thomasdeekman@lux-media.nl">thomasdeekman@lux-media.nl</a></p></div></div></main>');
    if (voorstel) {
      $('#v-ja').onclick = function () { this.disabled = true; api('volg_reactie', { code: code, akkoord: true }).then(function (j) { toast('Top! We bevestigen je shoot zo snel mogelijk.'); tekenVolg(code, j.aanvraag); }, function (er) { toast(er.message); }); };
      $('#v-nee').onclick = function () { $('#v-nee-vak').hidden = false; $('#v-opm').focus(); };
      $('#v-stuur').onclick = function () { api('volg_reactie', { code: code, akkoord: false, opmerking: $('#v-opm').value }).then(function (j) { toast('Bedankt, we komen met een nieuw voorstel.'); tekenVolg(code, j.aanvraag); }, function (er) { toast(er.message); }); };
    }
  }

  /* ---------- beheer: aanvragen ---------- */
  var AANVR = [], AFILTER = 'open';
  var STATUS_NAAM = { aangevraagd: 'Nieuw', voorstel: 'Voorstel gestuurd', bevestigd: 'Bevestigd', geschoten: 'Geschoten', bewerking: 'In bewerking', klaar: 'Klaar', afgewezen: 'Afgewezen' };
  function beheerTabs(actief, nieuw) {
    return '<nav class="tabs" aria-label="Beheer"><a href="#/beheer" class="' + (actief === 'klanten' ? 'actief' : '') + '"' + (actief === 'klanten' ? ' aria-current="page"' : '') + '>Klanten</a>' +
      '<a href="#/beheer/aanvragen" class="' + (actief === 'aanvragen' ? 'actief' : '') + '"' + (actief === 'aanvragen' ? ' aria-current="page"' : '') + '>Aanvragen' + (nieuw ? ' <span class="teller grad">' + nieuw + '</span>' : '') + '</a>' +
      '<a href="#/beheer/reviews" class="' + (actief === 'reviews' ? 'actief' : '') + '"' + (actief === 'reviews' ? ' aria-current="page"' : '') + '>Reviews</a></nav>';
  }
  function aanvraagPil(s) { return '<span class="pil st-' + s + '">' + STATUS_NAAM[s] + '</span>'; }
  function aanvragenScherm() {
    scherm(kop() + '<main>' + laden() + '</main>');
    api('aanvragen').then(function (j) { AANVR = j.aanvragen; tekenAanvragen(); }, function (e) { scherm(kop() + '<main>' + fout(e) + '</main>'); });
  }
  function tekenAanvragen() {
    var groep = { open: ['aangevraagd', 'voorstel'], gepland: ['bevestigd', 'geschoten', 'bewerking'], af: ['klaar', 'afgewezen'], alles: null };
    var lijst = AANVR.filter(function (a) { return !groep[AFILTER] || groep[AFILTER].indexOf(a.status) >= 0; });
    var tel = function (g) { return AANVR.filter(function (a) { return !groep[g] || groep[g].indexOf(a.status) >= 0; }).length; };
    var nieuw = AANVR.filter(function (a) { return a.status === 'aangevraagd'; }).length;
    scherm(kop() + '<main class="in" style="gap:28px">' + beheerTabs('aanvragen', nieuw) +
      '<div class="rij"><div style="display:flex;flex-direction:column;gap:8px"><h1 class="titel">Aanvragen</h1><p class="sub">Shoots die via <a href="#/boeken">app.lux-media.nl/boeken</a> zijn aangevraagd. Bevestig je er een, dan wordt de klant en een leeg shoot-album automatisch aangemaakt.</p></div>' +
      '<button type="button" class="btn btn-ghost btn-klein" data-actie="boeklink">Link kopiëren</button></div>' +
      '<div class="chips" role="tablist" aria-label="Filter">' + [['open', 'Open'], ['gepland', 'Gepland'], ['af', 'Afgerond'], ['alles', 'Alles']].map(function (f) {
        return '<button type="button" role="tab" class="chip-knop' + (AFILTER === f[0] ? ' actief' : '') + '" aria-selected="' + (AFILTER === f[0]) + '" data-filter="' + f[0] + '">' + f[1] + ' <span>' + tel(f[0]) + '</span></button>';
      }).join('') + '</div>' +
      (lijst.length ? '<div class="aanvragen">' + lijst.map(function (a) {
        var d = a.geplande_datum || a.datum;
        return '<button type="button" class="kaart aanvraag" data-aanvraag="' + esc(a.id) + '"><span class="aanvraag-boven">' + aanvraagPil(a.status) + '<span class="wanneer-k">' + esc(datum(a.aangemaakt)) + '</span></span>' +
          '<b class="aanvraag-naam">' + esc(a.naam) + '</b><span class="soort-pillen">' + (a.soorten || []).map(function (s) { return SOORT[s] ? '<span>' + icoon(s, 15) + SOORT[s].t + '</span>' : ''; }).join('') + '</span>' +
          '<span class="aanvraag-info"><span>' + (d ? esc(langeDatum(d)) + (!a.geplande_datum && a.datum_flexibel ? ' (flexibel)' : '') : 'Geen datum') + '</span><span>' + esc(a.locatie || 'Locatie: LUX denkt mee') + '</span></span></button>';
      }).join('') + '</div>' : '<div class="leeg">' + (AFILTER === 'open' ? 'Geen open aanvragen. Deel de link <b>app.lux-media.nl/boeken</b> om aanvragen binnen te krijgen.' : 'Niets in deze lijst.') + '</div>') +
      '</main>');
  }
  function aanvraagVenster(id) {
    var a = AANVR.filter(function (x) { return x.id === id; })[0]; if (!a) return;
    var ov = document.createElement('div');
    ov.className = 'overlay'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'av-titel');
    var opties = Object.keys(STATUS_NAAM).map(function (s) { return '<option value="' + s + '"' + (s === a.status ? ' selected' : '') + '>' + STATUS_NAAM[s] + '</option>'; }).join('');
    ov.innerHTML = '<form class="kaart modal in" novalidate style="max-width:640px"><button type="button" class="icon-btn sluit" aria-label="Sluiten" data-n="sluit">' + I.x + '</button>' +
      '<div style="display:flex;flex-direction:column;gap:8px">' + aanvraagPil(a.status) + '<h2 id="av-titel">' + esc(a.naam) + '</h2></div>' +
      '<dl class="av-dl"><dt>E-mail</dt><dd><a href="mailto:' + esc(a.email) + '">' + esc(a.email) + '</a></dd>' +
      '<dt>Telefoon</dt><dd>' + (a.telefoon ? '<a href="tel:' + esc(a.telefoon) + '">' + esc(a.telefoon) + '</a>' : '—') + '</dd>' +
      '<dt>Wat</dt><dd><span class="soort-pillen">' + (a.soorten || []).map(function (s) { return SOORT[s] ? '<span>' + icoon(s, 15) + SOORT[s].t + '</span>' : ''; }).join('') + '</span></dd>' +
      '<dt>Gewenste datum</dt><dd>' + (a.datum ? esc(langeDatum(a.datum)) + (a.datum_flexibel ? ' (flexibel)' : '') : 'Geen voorkeur') + (a.dagdeel && a.dagdeel !== 'geen voorkeur' ? ' · ' + esc(a.dagdeel) : '') + '</dd>' +
      '<dt>Locatie</dt><dd>' + esc(a.locatie || 'LUX mag meedenken') + '</dd>' +
      '<dt>Aangevraagd</dt><dd>' + esc(datum(a.aangemaakt)) + '</dd>' +
      (a.ref_code ? '<dt>Doorverwezen</dt><dd><span class="pil st-aangevraagd">' + esc(KORTING) + ' korting</span> via ' + esc(a.ref_naam || a.ref_code) + '</dd>' : '') + '</dl>' +
      (a.wens ? '<p class="bericht" style="white-space:pre-wrap">' + esc(a.wens) + '</p>' : '') +
      '<div class="knoppen">' + (a.album_id ? '<a class="btn btn-ghost btn-klein" href="#/album/' + esc(a.album_id) + '">Shoot-album openen</a>' : '') + (a.klant_id ? '<a class="btn btn-ghost btn-klein" href="#/beheer/klant/' + esc(a.klant_id) + '">Klant openen</a>' : '') +
      '<a class="btn btn-ghost btn-klein" href="#/volg/' + esc(a.volg_code) + '" target="_blank" rel="noopener">Bekijk als klant</a></div>' +
      '<hr style="border:0;border-top:1px solid #2B2433;margin:0">' +
      '<div class="velden2"><div class="veld"><label for="av-st">Status</label><select id="av-st">' + opties + '</select></div>' +
      '<div class="veld"><label for="av-dat">Datum shoot <span style="font-weight:500;color:#8E849A">(vastleggen of voorstellen)</span></label><input id="av-dat" type="date" value="' + esc(a.geplande_datum || a.datum || '') + '"></div></div>' +
      '<div class="veld"><label for="av-ber">Bericht aan de klant <span style="font-weight:500;color:#8E849A">(komt in de mail en op de statuspagina)</span></label><textarea id="av-ber" rows="4" placeholder="Bijv. de prijs, wat je meeneemt of het voorstel voor de locatie">' + esc(a.bericht || '') + '</textarea></div>' +
      '<p class="sub" id="av-uitleg" style="font-size:13px"></p>' +
      '<label class="vink-rij"><input type="checkbox" id="av-mail" checked>Klant mailen over de nieuwe status</label>' +
      '<p class="melding" id="av-fout" role="alert" hidden></p>' +
      '<div class="knoppen"><button type="submit" class="btn btn-grad">Opslaan</button><button type="button" class="btn btn-ghost" data-n="sluit">Annuleren</button><button type="button" class="btn btn-rood btn-klein" id="av-weg" style="margin-left:auto">Verwijderen</button></div></form>';
    document.body.appendChild(ov);
    var uitleg = { aangevraagd: 'De aanvraag staat open.', voorstel: 'De klant krijgt de datum hierboven als voorstel en kan met één klik akkoord gaan.', bevestigd: a.klant_id ? 'De shoot staat vast.' : 'Er wordt automatisch een klantaccount (10 GB) en een leeg shoot-album aangemaakt. De klant krijgt een bevestiging met inloginfo.', geschoten: 'De klant krijgt een bedankmail.', bewerking: 'De klant ziet dat je met de beelden bezig bent.', klaar: 'Het shoot-album wordt zichtbaar voor de klant en hij krijgt de mail “je foto’s staan klaar”. Upload eerst de beelden!', afgewezen: 'De klant krijgt een nette afwijzing, met je bericht erbij.' };
    function zetUitleg() { $('#av-uitleg', ov).textContent = uitleg[$('#av-st', ov).value] || ''; }
    $('#av-st', ov).onchange = zetUitleg; zetUitleg();
    $$('[data-n=sluit]', ov).forEach(function (b) { b.onclick = function () { ov.remove(); }; });
    $('#av-weg', ov).onclick = function () {
      if (!confirm('Aanvraag van ' + a.naam + ' verwijderen? Een klantaccount of album dat al is aangemaakt blijft bestaan.')) return;
      api('aanvraag_verwijderen', { id: a.id }).then(function () { ov.remove(); toast('Aanvraag verwijderd.'); aanvragenScherm(); }, function (er) { toast(er.message); });
    };
    $('form', ov).addEventListener('submit', function (e) {
      e.preventDefault();
      var b = $('button[type=submit]', ov); b.disabled = true; b.textContent = 'Opslaan…';
      api('aanvraag_bijwerken', { id: a.id, status: $('#av-st', ov).value, geplande_datum: $('#av-dat', ov).value || null, bericht: $('#av-ber', ov).value, mailen: $('#av-mail', ov).checked })
        .then(function () { ov.remove(); toast('Opgeslagen.'); aanvragenScherm(); },
          function (er) { b.disabled = false; b.textContent = 'Opslaan'; var f = $('#av-fout', ov); f.hidden = false; f.textContent = er.message; });
    });
  }

  /* ---------- social formaten ---------- */
  var FORMATEN = [
    { k: 'post', t: 'Instagram post', s: '4:5', w: 1080, h: 1350 },
    { k: 'vierkant', t: 'Vierkant', s: '1:1', w: 1080, h: 1080 },
    { k: 'story', t: 'Story & Reels', s: '9:16', w: 1080, h: 1920 },
    { k: 'banner', t: 'LinkedIn & website', s: '1,91:1', w: 1200, h: 628 }
  ];
  function formaatVenster(f) {
    var ov = document.createElement('div');
    ov.className = 'overlay'; ov.style.zIndex = 35; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'fm-titel');
    ov.innerHTML = '<div class="kaart modal in formaat-modal"><button type="button" class="icon-btn sluit" aria-label="Sluiten" data-n="sluit">' + I.x + '</button>' +
      '<div><h2 id="fm-titel">Social formaten</h2><p class="sub" style="font-size:14px;margin-top:6px">Kies een formaat en sleep de foto om hem goed in beeld te zetten.</p></div>' +
      '<div class="chips" role="radiogroup" aria-label="Formaat">' + FORMATEN.map(function (x, i) { return '<label class="chip"><input type="radio" name="fm" value="' + i + '"' + (i === 0 ? ' checked' : '') + '><span>' + x.t + ' <small style="opacity:.7;margin-left:4px">' + x.s + '</small></span></label>'; }).join('') + '</div>' +
      '<div class="fm-podium"><canvas id="fm-canvas" aria-label="Voorbeeld van de uitsnede"></canvas><div class="laden" id="fm-laden" style="position:absolute;inset:0;padding:0;align-items:center"><span></span></div></div>' +
      '<div class="fm-zoom"><label for="fm-zoom">Inzoomen</label><input id="fm-zoom" type="range" min="1" max="2.5" step="0.01" value="1"></div>' +
      '<p class="melding" id="fm-fout" role="alert" hidden></p>' +
      '<div class="knoppen"><button type="button" class="btn btn-grad" id="fm-download">' + I.down + 'Opslaan</button>' + (navigator.share ? '<button type="button" class="btn btn-ghost" id="fm-deel">' + DEEL + 'Delen</button>' : '') + '</div></div>';
    document.body.appendChild(ov);
    $$('[data-n=sluit]', ov).forEach(function (b) { b.onclick = function () { ov.remove(); }; });
    var cv = $('#fm-canvas', ov), cx = cv.getContext('2d'), img = new Image(), st = { fm: FORMATEN[0], zoom: 1, px: 0.5, py: 0.5 };
    function teken() {
      var fm = st.fm, maxW = Math.min(520, ov.querySelector('.fm-podium').clientWidth), maxH = Math.min(window.innerHeight * 0.48, 520);
      var schaal = Math.min(maxW / fm.w, maxH / fm.h);
      cv.style.width = Math.round(fm.w * schaal) + 'px'; cv.style.height = Math.round(fm.h * schaal) + 'px';
      cv.width = fm.w; cv.height = fm.h; render(cx, fm.w, fm.h);
    }
    function render(c, W, H) {
      if (!img.naturalWidth) return;
      var s = Math.max(W / img.naturalWidth, H / img.naturalHeight) * st.zoom;
      var w = img.naturalWidth * s, h = img.naturalHeight * s;
      var x = (W - w) * st.px, y = (H - h) * st.py;
      c.fillStyle = '#0D0A12'; c.fillRect(0, 0, W, H); c.imageSmoothingQuality = 'high'; c.drawImage(img, x, y, w, h);
    }
    function laad(src, reserve) {
      img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = function () { $('#fm-laden', ov).hidden = true; teken(); };
      img.onerror = function () { if (reserve) laad(reserve); else { $('#fm-laden', ov).hidden = true; var e = $('#fm-fout', ov); e.hidden = false; e.textContent = 'Deze foto kon niet worden geladen.'; } };
      img.src = src;
    }
    var origOk = /^image\/(jpe?g|png|webp)/.test(f.type) && f.origineel && f.grootte < 40 * 1024 * 1024;
    laad(origOk ? f.origineel : (f.groot || f.origineel), origOk ? f.groot : null);
    $$('input[name=fm]', ov).forEach(function (r) { r.onchange = function () { st.fm = FORMATEN[Number(r.value)]; st.px = st.py = 0.5; teken(); }; });
    $('#fm-zoom', ov).oninput = function () { st.zoom = Number(this.value); teken(); };
    var sleep = null;
    cv.addEventListener('pointerdown', function (e) { sleep = { x: e.clientX, y: e.clientY, px: st.px, py: st.py }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function (e) {
      if (!sleep || !img.naturalWidth) return;
      var r = cv.getBoundingClientRect(), fm = st.fm, s = Math.max(fm.w / img.naturalWidth, fm.h / img.naturalHeight) * st.zoom;
      var overX = img.naturalWidth * s - fm.w, overY = img.naturalHeight * s - fm.h, sch = fm.w / r.width;
      if (overX > 0) st.px = Math.max(0, Math.min(1, sleep.px - (e.clientX - sleep.x) * sch / overX));
      if (overY > 0) st.py = Math.max(0, Math.min(1, sleep.py - (e.clientY - sleep.y) * sch / overY));
      render(cx, fm.w, fm.h);
    });
    cv.addEventListener('pointerup', function () { sleep = null; });
    cv.addEventListener('keydown', function (e) { var d = { ArrowLeft: [-.05, 0], ArrowRight: [.05, 0], ArrowUp: [0, -.05], ArrowDown: [0, .05] }[e.key]; if (!d) return; e.preventDefault(); st.px = Math.max(0, Math.min(1, st.px + d[0])); st.py = Math.max(0, Math.min(1, st.py + d[1])); teken(); });
    cv.tabIndex = 0;
    function blob() { return new Promise(function (res, rej) { try { cv.toBlob(function (b) { b ? res(b) : rej(new Error('Opslaan lukte niet.')); }, 'image/jpeg', 0.92); } catch (e) { rej(new Error('Deze foto kan niet worden bewerkt (beveiliging van de browser).')); } }); }
    function naam() { return f.naam.replace(/\.[^.]+$/, '') + '-' + st.fm.k + '.jpg'; }
    $('#fm-download', ov).onclick = function () { blob().then(function (b) { var u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = naam(); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); toast('Opgeslagen als ' + naam()); }, function (e) { toast(e.message); }); };
    var dk = $('#fm-deel', ov);
    if (dk) dk.onclick = function () { blob().then(function (b) { var file = new File([b], naam(), { type: 'image/jpeg' }); if (navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file] }); throw new Error('Delen wordt op dit apparaat niet ondersteund. Gebruik Opslaan.'); }).catch(function (e) { if (e && e.name !== 'AbortError') toast(e.message); }); };
  }

  /* ---------- delen via link ---------- */
  function deelVenster() {
    var a = HUIDIG.album;
    var ov = document.createElement('div');
    ov.className = 'overlay'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'dl-titel');
    ov.innerHTML = '<form class="kaart modal in" novalidate><button type="button" class="icon-btn sluit" aria-label="Sluiten" data-n="sluit">' + I.x + '</button>' +
      '<div><h2 id="dl-titel">“' + esc(a.titel) + '” delen</h2><p class="sub" style="font-size:14px;margin-top:6px">Maak een link voor familie, vrienden of collega’s. Zij hebben geen account nodig.</p></div>' +
      (a.soort === 'lux' && a.gebruik === 'prive' ? '<p class="melding goed">Let op: deze foto’s zijn alleen voor privégebruik. Deel ze dus niet op social media.</p>' : '') +
      '<label class="vink-rij"><input type="checkbox" id="dl-down">Ze mogen de foto’s ook downloaden</label>' +
      '<div class="velden2"><div class="veld"><label for="dl-dagen">Link verloopt</label><select id="dl-dagen"><option value="7">Na 7 dagen</option><option value="30" selected>Na 30 dagen</option><option value="0">Nooit</option></select></div>' +
      '<div class="veld"><label for="dl-ww">Wachtwoord <span style="font-weight:500;color:#8E849A">(optioneel)</span></label><input id="dl-ww" type="text" autocomplete="off" maxlength="100"></div></div>' +
      '<p class="melding" id="dl-fout" role="alert" hidden></p>' +
      '<button type="submit" class="btn btn-grad" style="align-self:flex-start">' + DEEL + 'Link maken</button>' +
      '<div id="dl-lijst" class="dl-lijst"></div></form>';
    document.body.appendChild(ov);
    $$('[data-n=sluit]', ov).forEach(function (b) { b.onclick = function () { ov.remove(); }; });
    function lijst() {
      api('deel_lijst', { album_id: a.id }).then(function (r) {
        var l = $('#dl-lijst', ov); if (!l) return;
        l.innerHTML = r.links.length ? '<h3>Je links</h3>' + r.links.map(function (x) {
          var verlopen = x.verloopt && new Date(x.verloopt) < new Date();
          return '<div class="dl-item"><div><code>' + esc(x.url.replace('https://', '')) + '</code><small>' + (verlopen ? 'Verlopen' : x.verloopt ? 'Geldig tot ' + esc(datum(x.verloopt)) : 'Verloopt niet') + ' · ' + (x.download ? 'met download' : 'alleen bekijken') + (x.wachtwoord ? ' · wachtwoord' : '') + ' · ' + x.bekeken + '× bekeken</small></div>' +
            '<div class="knoppen"><button type="button" class="btn btn-ghost btn-klein" data-kopieer="' + esc(x.url) + '">Kopiëren</button><button type="button" class="btn btn-rood btn-klein" data-intrek="' + esc(x.id) + '">Intrekken</button></div></div>';
        }).join('') : '';
        $$('[data-kopieer]', l).forEach(function (b) { b.onclick = function () { kopieer(b.dataset.kopieer, a.titel); }; });
        $$('[data-intrek]', l).forEach(function (b) { b.onclick = function () { api('deel_intrekken', { id: b.dataset.intrek }).then(function () { toast('Link ingetrokken.'); lijst(); }, function (er) { toast(er.message); }); }; });
      }, function () {});
    }
    lijst();
    $('form', ov).addEventListener('submit', function (e) {
      e.preventDefault(); var b = $('button[type=submit]', ov); b.disabled = true;
      api('deel_maken', { album_id: a.id, download: $('#dl-down', ov).checked, dagen: Number($('#dl-dagen', ov).value), wachtwoord: $('#dl-ww', ov).value })
        .then(function (r) { b.disabled = false; $('#dl-ww', ov).value = ''; kopieer(r.url, a.titel); lijst(); }, function (er) { b.disabled = false; var f = $('#dl-fout', ov); f.hidden = false; f.textContent = er.message; });
    });
  }
  function kopieer(url, titel) {
    if (navigator.share && /iphone|ipad|android/i.test(navigator.userAgent)) { navigator.share({ title: titel, text: 'Bekijk de foto’s van ' + titel, url: url }).catch(function () {}); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { toast('Link gekopieerd.'); }, function () { prompt('Kopieer deze link:', url); });
  }
  function gedeeldScherm(code, ww) {
    scherm(pubKop() + '<main>' + laden() + '</main>');
    api('gedeeld', { code: code, wachtwoord: ww || '' }).then(function (j) {
      if (j.wachtwoordNodig) return wachtwoordScherm(code);
      HUIDIG = { gedeeld: true, album: { titel: j.album.titel, soort: j.album.soort }, magBewerken: false,
        fotos: j.fotos.map(function (f) { return { id: f.id, naam: f.naam, type: f.type, mini: f.mini, groot: f.groot, origineel: f.video || f.groot, download: f.download, grootte: 0 }; }) };
      scherm(pubKop() + '<main class="in" style="gap:26px">' +
        '<div class="rij"><div style="display:flex;flex-direction:column;gap:8px"><span class="grad-text eyebrow">GEDEELD DOOR ' + esc((j.van || '').toUpperCase()) + '</span><h1 class="titel">' + esc(j.album.titel) + '</h1><span class="sub" style="font-size:15px">' + fotos(j.fotos.length) + (j.album.soort === 'lux' ? ' · gemaakt door LUX Media' : '') + '</span></div>' +
        (j.download && j.fotos.length ? '<div class="knoppen"><button type="button" class="btn btn-ghost" data-actie="alles">' + I.down + 'Alles downloaden</button></div>' : '') + '</div>' +
        (j.fotos.length ? '<div class="fotos">' + HUIDIG.fotos.map(function (f, i) { var video = /^video\//.test(f.type);
          return '<div class="foto-w"><button type="button" class="foto" data-foto="' + i + '" aria-label="' + esc((video ? 'Video ' : 'Foto ') + (i + 1)) + '">' + (f.mini ? '<img src="' + esc(f.mini) + '" alt="" loading="lazy">' : I.beeld) + (video ? '<span class="speel">' + I.speel + '</span>' : '') + '</button></div>'; }).join('') + '</div>' : '<div class="leeg">Dit album is leeg.</div>') +
        '<div class="kaart reclame"><div><span class="grad-text eyebrow">LUX MEDIA</span><h2>Ook zulke beelden van jezelf of je bedrijf?</h2><p class="sub">Fotografie, video, drone en social content. Het liefst op een mooie locatie buiten. Vraag vrijblijvend een shoot aan.</p></div>' +
        '<div class="knoppen"><a class="btn btn-grad" href="#/boeken">Boek een shoot</a><a class="btn btn-ghost" href="https://lux-media.nl">Bekijk ons werk</a></div></div></main>');
    }, function (e) {
      if (/wachtwoord/i.test(e.message)) return wachtwoordScherm(code, e.message);
      scherm(pubKop() + '<main class="in boek"><div class="kaart bedankt"><h1 class="titel" style="font-size:32px">Link niet beschikbaar</h1><p class="sub">' + esc(e.message) + '</p><div class="knoppen" style="justify-content:center"><a class="btn btn-grad" href="https://lux-media.nl">Naar lux-media.nl</a></div></div></main>');
    });
  }
  function wachtwoordScherm(code, melding) {
    scherm(pubKop() + '<main class="in boek"><form class="kaart bedankt" id="ww-form" style="align-items:stretch;text-align:left"><h1 class="titel" style="font-size:30px">Dit album is beveiligd</h1><p class="sub">Vul het wachtwoord in dat je hebt gekregen.</p>' +
      (melding ? '<p class="melding" role="alert">' + esc(melding) + '</p>' : '') +
      '<div class="veld"><label for="ww-in">Wachtwoord</label><input id="ww-in" type="password" autocomplete="off" required></div><button type="submit" class="btn btn-grad">Bekijken</button></form></main>');
    $('#ww-in').focus();
    $('#ww-form').addEventListener('submit', function (e) { e.preventDefault(); gedeeldScherm(code, $('#ww-in').value); });
  }

  /* ---------- review & doorverwijzen ---------- */
  var KORTING = CFG.VRIEND_KORTING || '10%';
  function reviewKaart(r) {
    return '<section class="kaart review-kaart" id="review"><div><span class="grad-text eyebrow">JOUW MENING</span><h2 class="sectie" style="font-size:22px;margin-top:6px">Hoe vond je “' + esc(r.titel) + '”?</h2><p class="sub" style="font-size:14px;margin-top:6px">Je review helpt ons enorm. Het kost je maar een halve minuut.</p></div>' +
      '<form id="rv-form" novalidate><div class="sterren" role="radiogroup" aria-label="Aantal sterren">' + [1, 2, 3, 4, 5].map(function (n) { return '<label><input type="radio" name="rv-s" value="' + n + '"><span aria-hidden="true">★</span><span class="sr">' + n + ' ster' + (n > 1 ? 'ren' : '') + '</span></label>'; }).join('') + '</div>' +
      '<div class="veld"><label for="rv-t">Wat vond je ervan? <span style="font-weight:500;color:#8E849A">(optioneel)</span></label><textarea id="rv-t" rows="3" maxlength="2000"></textarea></div>' +
      '<label class="vink-rij"><input type="checkbox" id="rv-m" checked>LUX mag mijn review (met voornaam) op de website zetten</label>' +
      '<p class="melding" id="rv-fout" role="alert" hidden></p><button type="submit" class="btn btn-grad" style="align-self:flex-start">Review versturen</button></form></section>';
  }
  function refKaart() {
    return '<section class="kaart ref-kaart" id="ref"><div class="ref-tekst"><span class="eyebrow" style="color:#0D0A12">DEEL LUX MET EEN VRIEND</span><h2>Jullie krijgen allebei ' + esc(KORTING) + ' korting</h2><p>Stuur je persoonlijke link naar een vriend. Boekt die een shoot, dan krijgt je vriend ' + esc(KORTING) + ' korting en jij ook op je volgende shoot.</p></div>' +
      '<div class="ref-link"><code id="ref-url">…</code><div class="knoppen"><button type="button" class="btn btn-dark btn-klein" data-actie="ref-deel">' + DEEL + 'Link delen</button></div><small id="ref-tel"></small></div></section>';
  }
  function koppelReview(r) {
    var f = $('#rv-form'); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = $('input[name=rv-s]:checked', f), fe = $('#rv-fout');
      if (!s) { fe.hidden = false; fe.textContent = 'Kies eerst het aantal sterren.'; return; }
      var b = $('button[type=submit]', f); b.disabled = true;
      api('review_geven', { album_id: r.album_id, sterren: Number(s.value), tekst: $('#rv-t').value, mag_tonen: $('#rv-m').checked }).then(function () {
        var k = $('#review'); k.outerHTML = '<section class="kaart review-kaart bedankt-klein"><span class="vink grad">' + I.vink + '</span><div><h2 class="sectie" style="font-size:20px">Dankjewel!</h2><p class="sub" style="font-size:14px">Je review is binnen. Super fijn.</p></div></section>' + ($('#ref') ? '' : refKaart());
        vulRef();
      }, function (er) { b.disabled = false; fe.hidden = false; fe.textContent = er.message; });
    });
  }
  var REF = null;
  function vulRef() {
    if (!$('#ref')) return;
    api('mijn_ref').then(function (r) { REF = r; var u = $('#ref-url'); if (u) u.textContent = r.url.replace('https://', ''); var t = $('#ref-tel'); if (t && r.aanmeldingen) t.textContent = r.aanmeldingen + (r.aanmeldingen === 1 ? ' vriend heeft' : ' vrienden hebben') + ' via jouw link een shoot aangevraagd.'; }, function () {});
  }

  /* ---------- beheer: reviews ---------- */
  function reviewsScherm() {
    scherm(kop() + '<main>' + laden() + '</main>');
    Promise.all([api('reviews'), api('aanvragen').catch(function () { return { aanvragen: [] }; })]).then(function (rr) {
      var r = rr[0].reviews, nieuw = rr[1].aanvragen.filter(function (a) { return a.status === 'aangevraagd'; }).length;
      var gem = r.length ? (r.reduce(function (t, x) { return t + x.sterren; }, 0) / r.length).toFixed(1).replace('.', ',') : '–';
      scherm(kop() + '<main class="in" style="gap:28px">' + beheerTabs('reviews', nieuw) +
        '<div style="display:flex;flex-direction:column;gap:8px"><h1 class="titel">Reviews</h1><p class="sub">Klanten krijgen na het bekijken van een opgeleverde shoot de vraag om een review. Reviews met “mag op de website” kun je gebruiken op lux-media.nl.</p></div>' +
        '<div class="stats"><div class="kaart"><span>Gemiddeld</span><b>' + gem + ' ★</b></div><div class="kaart"><span>Reviews</span><b>' + r.length + '</b></div><div class="kaart"><span>Mag op de website</span><b>' + r.filter(function (x) { return x.mag_tonen; }).length + '</b></div></div>' +
        (r.length ? '<div class="aanvragen">' + r.map(function (x) {
          return '<div class="kaart aanvraag" style="cursor:default"><span class="aanvraag-boven"><span class="sterren-tekst" aria-label="' + x.sterren + ' van 5 sterren">' + '★★★★★'.slice(0, x.sterren) + '<span style="color:#3A3145">' + '★★★★★'.slice(x.sterren) + '</span></span><span class="wanneer-k">' + esc(datum(x.aangemaakt)) + '</span></span>' +
            '<b class="aanvraag-naam">' + esc(x.naam || 'Klant') + '</b>' + (x.tekst ? '<p class="sub" style="font-size:15px">“' + esc(x.tekst) + '”</p>' : '') +
            '<span class="aanvraag-info"><span>' + esc(x.album || '') + '</span><span>' + (x.mag_tonen ? '<span class="pil st-klaar">Mag op de website</span>' : '<span class="pil uitgenodigd">Alleen voor LUX</span>') + '</span></span></div>';
        }).join('') + '</div>' : '<div class="leeg">Nog geen reviews.</div>') + '</main>');
    }, function (e) { scherm(kop() + '<main>' + fout(e) + '</main>'); });
  }

  /* ---------- klikken ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-actie],[data-album],[data-foto],[data-lb],[data-aanvraag],[data-filter],[data-hart],[data-albumfilter]') : null;
    if (!t) return;
    if (t.dataset.album) { location.hash = '#/album/' + t.dataset.album; return; }
    if (t.dataset.aanvraag) { aanvraagVenster(t.dataset.aanvraag); return; }
    if (t.dataset.hart) { wisselHart(Number(t.dataset.hart)); return; }
    if (t.dataset.albumfilter) { FILTER = t.dataset.albumfilter; tekenAlbum(); return; }
    if (t.dataset.filter) { AFILTER = t.dataset.filter; tekenAanvragen(); return; }
    if (t.dataset.foto) { lichtbak(Number(t.dataset.foto)); return; }
    if (t.dataset.lb) {
      var f = HUIDIG.fotos[lbIndex], n = HUIDIG.fotos.length;
      if (t.dataset.lb === 'sluit') sluitLichtbak();
      if (t.dataset.lb === 'vorige') lichtbak((lbIndex - 1 + n) % n);
      if (t.dataset.lb === 'volgende') lichtbak((lbIndex + 1) % n);
      if (t.dataset.lb === 'download') downloadFoto(f).catch(function (er) { toast(er.message); });
      if (t.dataset.lb === 'hart') wisselHart(lbIndex);
      if (t.dataset.lb === 'formaat') formaatVenster(f);
      if (t.dataset.lb === 'weg' && confirm('Weet je zeker dat je “' + f.naam + '” wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
        api('foto_verwijderen', { foto_id: f.id }).then(function () { sluitLichtbak(); toast('Verwijderd.'); albumScherm(HUIDIG.album.id); }, function (er) { toast(er.message); });
      }
      return;
    }
    var a = t.dataset.actie;
    if (a === 'uitloggen') uitloggen();
    if (a === 'upload') uploadVenster();
    if (a === 'upload-hier') uploadVenster(HUIDIG.album.id);
    if (a === 'nieuw-album') {
      var titel = (prompt('Naam van het nieuwe album:', '') || '').trim();
      if (titel) api('album_maken', { titel: titel }).then(function (j) { location.hash = '#/album/' + j.album.id; }, function (er) { toast(er.message); });
    }
    if (a === 'hernoem') {
      var nt = (prompt('Nieuwe naam:', HUIDIG.album.titel) || '').trim();
      if (nt) api('album_hernoemen', { album_id: HUIDIG.album.id, titel: nt }).then(function () { albumScherm(HUIDIG.album.id); }, function (er) { toast(er.message); });
    }
    if (a === 'album-weg' && confirm('Weet je zeker dat je het album “' + HUIDIG.album.titel + '” met alle foto’s wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
      api('album_verwijderen', { album_id: HUIDIG.album.id }).then(function () { toast('Album verwijderd.'); location.hash = T.rol === 'beheer' ? '#/beheer/klant/' + (HUIDIG_KLANT || '') : '#/'; }, function (er) { toast(er.message); });
    }
    if (a === 'alles') {
      var lijst = HUIDIG.fotos.slice(), i = 0;
      toast('Downloaden gestart. Sta meerdere downloads toe als je browser erom vraagt.');
      (function volgende() { if (i >= lijst.length) return; downloadFoto(lijst[i++]).then(function () { setTimeout(volgende, 900); }, function () { setTimeout(volgende, 900); }); })();
    }
    if (a === 'shoot-klaar') {
      var mailen = confirm('De shoot wordt zichtbaar voor de klant. Wil je de klant er ook een mail over sturen?\n\nOK = zichtbaar maken én mailen\nAnnuleren = alleen zichtbaar maken');
      api('shoot_klaar', { album_id: HUIDIG.album.id, mailen: mailen }).then(function () { toast(mailen ? 'Klaargezet en gemaild.' : 'Klaargezet.'); albumScherm(HUIDIG.album.id); }, function (er) { toast(er.message); });
    }
    if (a === 'klant-nieuw') nieuweKlant();
    if (a === 'delen') deelVenster();
    if (a === 'naar-chat') { var c = $('#chat'); if (c) { c.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(function () { var ci = $('#chat-in'); if (ci) ci.focus({ preventScroll: true }); }, 500); } }
    if (a === 'ref-deel' && REF) kopieer(REF.url, 'LUX Media — ' + KORTING + ' korting op je shoot');
    if (a === 'keuze') {
      var nf = HUIDIG.fotos.filter(function (x) { return x.favoriet; }).length;
      if (confirm('Je keuze doorsturen naar LUX? (' + nf + ' favorieten)\nJe kunt daarna nog steeds aanpassen en opnieuw doorsturen.')) {
        api('keuze_versturen', { album_id: HUIDIG.album.id }).then(function () { HUIDIG.album.keuze_verstuurd = new Date().toISOString(); toast('Doorgestuurd! LUX gaat ermee aan de slag.'); tekenAlbum(); }, function (er) { toast(er.message); });
      }
    }
    if (a === 'boeklink') { var l = location.origin + '/boeken'; (navigator.clipboard ? navigator.clipboard.writeText(l) : Promise.reject()).then(function () { toast('Gekopieerd: ' + l); }, function () { prompt('Kopieer deze link:', l); }); }
    if (a === 'uitnodigen') api('klant_uitnodigen', { klant_id: HUIDIG_KLANT }).then(function () { toast('Uitnodiging verstuurd.'); }, function (er) { toast(er.message); });
    if (a === 'pauze') {
      var info = JSON.parse($app.dataset.klant || '{}');
      api('klant_wijzigen', { klant_id: HUIDIG_KLANT, status: info.status === 'gepauzeerd' ? 'actief' : 'gepauzeerd' }).then(function () { klantScherm(HUIDIG_KLANT); }, function (er) { toast(er.message); });
    }
    if (a === 'klant-weg') {
      var inf = JSON.parse($app.dataset.klant || '{}');
      var check = prompt('Hiermee verwijder je de klant én al zijn foto’s (ook de eigen uploads) definitief.\nTyp de naam “' + inf.naam + '” om te bevestigen:');
      if (check != null && check.trim() === inf.naam) api('klant_verwijderen', { klant_id: HUIDIG_KLANT }).then(function () { toast('Klant verwijderd.'); location.hash = '#/beheer'; }, function (er) { toast(er.message); });
      else if (check != null) toast('Naam kwam niet overeen, er is niets verwijderd.');
    }
  });
  document.addEventListener('keydown', function (e) {
    var bovenop = $$('.overlay').filter(function (o) { return o !== lbEl; }).pop();
    if (bovenop && lbEl) { if (e.key === 'Escape') { var sb = $('.sluit', bovenop); if (sb) sb.click(); } return; }
    if (lbEl) {
      if (e.key === 'Escape') sluitLichtbak();
      if (e.key === 'ArrowLeft') lichtbak((lbIndex - 1 + HUIDIG.fotos.length) % HUIDIG.fotos.length);
      if (e.key === 'ArrowRight') lichtbak((lbIndex + 1) % HUIDIG.fotos.length);
      return;
    }
    if (e.key === 'Escape') { var ov = $$('.overlay').pop(); var s = ov && $('.sluit', ov); if (s) s.click(); }
  });

  /* ---------- router ---------- */
  function render() {
    sluitLichtbak();
    $$('.overlay').forEach(function (o) { o.remove(); });
    var h = location.hash.replace(/^#/, '') || '/';
    var m;
    clearTimeout(chatTimer);
    if (h === '/boeken' || h.indexOf('/boeken?') === 0) return boekScherm((h.match(/[?&]ref=([A-Za-z0-9-]{4,30})/) || [])[1]);
    if ((m = h.match(/^\/g\/([A-Za-z0-9_-]{12,40})$/))) return gedeeldScherm(m[1]);
    if ((m = h.match(/^\/volg\/([A-Za-z0-9_-]{20,64})$/))) return volgScherm(m[1]);
    if (!T.token) { loginScherm(); return; }
    if ((m = h.match(/^\/album\/([0-9a-f-]{36})$/i))) return albumScherm(m[1]);
    if (T.rol === 'beheer') {
      if ((m = h.match(/^\/beheer\/klant\/([0-9a-f-]{36})$/i))) return klantScherm(m[1]);
      if (h === '/beheer/aanvragen') return aanvragenScherm();
      if (h === '/beheer/reviews') return reviewsScherm();
      return beheerScherm();
    }
    return home();
  }
  window.addEventListener('hashchange', render);
  render();
})();
