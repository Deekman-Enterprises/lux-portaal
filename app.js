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
    var el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = t;
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
      '<p class="sub" style="font-size:13px;color:#8E849A">Nog geen account? Accounts worden aangemaakt door LUX Media. <a href="mailto:thomasdeekman@lux-media.nl">Vraag toegang aan</a>.</p></form>';
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
        '<section style="display:flex;flex-direction:column;gap:18px"><div class="rij"><h2 class="sectie">Van LUX Media</h2><span class="sub" style="font-size:14px">Shoots die wij voor je hebben klaargezet</span></div>' +
        (lux.length ? '<div class="albums">' + lux.map(function (a) { return albumKaart(a); }).join('') + '</div>' : '<div class="leeg">Hier verschijnen de foto’s van je shoots met LUX Media.</div>') + '</section>' +
        '<section style="display:flex;flex-direction:column;gap:18px"><div class="rij"><h2 class="sectie">Mijn albums</h2><button type="button" class="btn btn-ghost btn-klein" data-actie="nieuw-album">' + I.plus + 'Nieuw album</button></div>' +
        '<div class="albums">' + eigen.map(function (a) { return albumKaart(a); }).join('') +
        '<button type="button" class="album nieuw-album" data-actie="upload"><span class="cover"><span style="display:flex;flex-direction:column;align-items:center;gap:10px;color:#B3A9BD;font-weight:600;font-size:15px"><span class="grad rondje" style="width:52px;height:52px">' + I.up.replace('currentColor', '#0D0A12') + '</span>Foto’s toevoegen</span></span><span style="display:flex;flex-direction:column;gap:4px"><span class="naam">Uploaden</span><span class="info">Vanaf je computer of telefoon</span></span></button>' +
        '</div></section></main>' +
        '<button type="button" class="btn btn-grad fab" data-actie="upload">' + I.up + 'Foto’s uploaden</button>');
    }, function (e) { scherm(kop() + '<main>' + fout(e) + '</main>'); });
  }

  /* ---------- album ---------- */
  var HUIDIG = null;
  function albumScherm(id) {
    scherm(kop() + '<main>' + laden() + '</main>');
    api('album', { album_id: id }).then(function (j) {
      HUIDIG = j;
      var a = j.album, beheer = T.rol === 'beheer';
      var totaal = j.fotos.reduce(function (t, f) { return t + f.grootte; }, 0);
      var label = a.soort === 'lux' ? 'VAN LUX MEDIA' : 'MIJN ALBUM';
      var terug = beheer ? '#/beheer/klant/' + encodeURIComponent(HUIDIG_KLANT || '') : '#/';
      scherm(kop() + '<main class="in" style="gap:26px">' +
        '<div class="rij"><div style="display:flex;flex-direction:column;gap:8px">' +
        '<a class="terug" href="' + terug + '">' + I.links + (beheer ? 'Terug naar klant' : 'Terug naar overzicht') + '</a>' +
        '<span class="grad-text" style="font-weight:700;font-size:12px;letter-spacing:.25em;align-self:flex-start">' + label + '</span>' +
        '<h1 class="titel">' + esc(a.titel) + '</h1><span class="sub" style="font-size:15px">' + fotos(j.fotos.length) + (totaal ? ' · ' + gb(totaal) : '') + ' · originele kwaliteit</span>' +
        (beheer ? '<span class="sub" style="font-size:14px">' + (a.klaar ? 'Zichtbaar voor de klant.' : 'Nog niet zichtbaar voor de klant. Upload de foto’s en zet de shoot daarna klaar.') + '</span>' : '') +
        '</div><div class="knoppen">' +
        (j.magBewerken ? '<button type="button" class="btn btn-ghost" data-actie="upload-hier">' + I.up + 'Uploaden</button>' : '') +
        (j.fotos.length ? '<button type="button" class="btn btn-ghost" data-actie="alles">' + I.down + 'Alles downloaden</button>' : '') +
        (beheer && !a.klaar ? '<button type="button" class="btn btn-grad" data-actie="shoot-klaar">Zet klaar &amp; mail klant</button>' : '') +
        (j.magBewerken ? '<button type="button" class="btn btn-ghost btn-klein" data-actie="hernoem">Naam wijzigen</button><button type="button" class="btn btn-rood btn-klein" data-actie="album-weg">Album verwijderen</button>' : '') +
        '</div></div>' +
        (j.fotos.length ? '<div class="fotos">' + j.fotos.map(function (f, i) {
          var video = /^video\//.test(f.type);
          return '<button type="button" class="foto" data-foto="' + i + '" aria-label="' + esc((video ? 'Video ' : 'Foto ') + (i + 1) + ': ' + f.naam) + '">' +
            (f.mini ? '<img src="' + esc(f.mini) + '" alt="" loading="lazy">' : I.beeld) + (video ? '<span class="speel">' + I.speel + '</span>' : '') + '</button>';
        }).join('') + '</div>' : '<div class="leeg">' + (j.magBewerken ? 'Dit album is nog leeg. Klik op Uploaden om foto’s toe te voegen.' : 'Dit album is nog leeg.') + '</div>') +
        '</main>' + (T.rol === 'klant' && j.magBewerken ? '<button type="button" class="btn btn-grad fab" data-actie="upload-hier">' + I.up + 'Uploaden</button>' : ''));
    }, function (e) { scherm(kop() + '<main><a class="terug" href="#/">' + I.links + 'Terug</a>' + fout(e) + '</main>'); });
  }

  /* ---------- lichtbak ---------- */
  var lbIndex = 0, lbEl = null;
  function lichtbak(i) {
    lbIndex = i; sluitLichtbak();
    var f = HUIDIG.fotos[i], n = HUIDIG.fotos.length, video = /^video\//.test(f.type);
    var bron = f.groot || f.origineel;
    var kanTonen = video || f.groot || /^image\/(jpe?g|png|gif|webp|avif)/.test(f.type);
    lbEl = document.createElement('div');
    lbEl.className = 'overlay lichtbak'; lbEl.setAttribute('role', 'dialog'); lbEl.setAttribute('aria-modal', 'true'); lbEl.setAttribute('aria-label', f.naam);
    lbEl.innerHTML = '<button type="button" class="icon-btn sluit" data-lb="sluit" aria-label="Sluiten">' + I.x + '</button>' +
      (n > 1 ? '<button type="button" class="icon-btn pijl" style="left:16px" data-lb="vorige" aria-label="Vorige">' + I.links + '</button><button type="button" class="icon-btn pijl" style="right:16px" data-lb="volgende" aria-label="Volgende">' + I.rechts + '</button>' : '') +
      (video ? '<video class="beeld" src="' + esc(f.origineel) + '" controls playsinline' + (f.groot ? ' poster="' + esc(f.groot) + '"' : '') + '></video>'
        : kanTonen ? '<img class="beeld" src="' + esc(bron) + '" alt="' + esc(f.naam) + '">'
        : '<div class="kaart" style="padding:40px;text-align:center;color:#B3A9BD;max-width:420px">' + I.beeld + '<p>Van dit bestand (' + esc(f.naam) + ') kan geen voorbeeld worden getoond. Download het om het te bekijken.</p></div>') +
      '<div class="balkje"><span>' + (i + 1) + ' / ' + n + ' · ' + esc(f.naam) + ' · ' + gb(f.grootte) + '</span>' +
      '<button type="button" class="btn btn-grad btn-klein" data-lb="download">' + I.down + 'Download origineel</button>' +
      (HUIDIG.magBewerken ? '<button type="button" class="btn btn-rood btn-klein" data-lb="weg">Verwijderen</button>' : '') + '</div>';
    document.body.appendChild(lbEl);
    $('[data-lb=sluit]', lbEl).focus();
  }
  function sluitLichtbak() { if (lbEl) { lbEl.remove(); lbEl = null; } }
  function downloadFoto(f) {
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
    api('klanten').then(function (j) {
      var k = j.klanten, totaal = k.reduce(function (t, x) { return t + Number(x.eigen || 0); }, 0);
      var vol = k.filter(function (x) { return x.quota_bytes && x.eigen / x.quota_bytes >= 0.8; }).length;
      scherm(kop() + '<main class="in" style="gap:28px">' +
        '<div class="rij"><div style="display:flex;flex-direction:column;gap:8px"><h1 class="titel">Klanten</h1><p class="sub">Alleen jij maakt accounts aan. Een klant krijgt een uitnodiging per mail en logt in met een code.</p></div>' +
        '<button type="button" class="btn btn-grad" data-actie="klant-nieuw">' + I.plus + 'Klant toevoegen</button></div>' +
        '<div class="stats"><div class="kaart"><span>Klanten</span><b>' + k.length + '</b></div><div class="kaart"><span>Eigen foto’s van klanten</span><b>' + gb(totaal) + '</b></div><div class="kaart"><span>Bijna vol (boven 80%)</span><b>' + vol + '</b></div></div>' +
        (k.length ? '<div class="kaart tabel"><table><caption class="sr">Klanten en hun opslag</caption><thead><tr><th scope="col">Klant</th><th scope="col">Opslag</th><th scope="col">Shoots</th><th scope="col">Laatst ingelogd</th><th scope="col">Status</th><th scope="col"><span class="sr">Acties</span></th></tr></thead><tbody>' +
          k.map(function (x) {
            var p = Math.min(100, Math.round((x.eigen / x.quota_bytes) * 100));
            return '<tr><td><div style="display:flex;align-items:center;gap:12px"><span class="rondje grad">' + esc(x.naam.charAt(0).toUpperCase()) + '</span><span style="display:flex;flex-direction:column;gap:2px"><b>' + esc(x.naam) + '</b><span style="color:#B3A9BD;font-size:13px">' + esc(x.email) + '</span></span></div></td>' +
              '<td><div style="display:flex;flex-direction:column;gap:6px;min-width:150px"><span style="font-size:13px;color:#B3A9BD"><b style="color:#F7F3FA">' + gb(x.eigen) + '</b> van ' + gb(x.quota_bytes) + '</span><div class="balk" style="height:8px"><span style="width:' + p + '%"></span></div></div></td>' +
              '<td>' + x.shoots + '</td><td style="color:#B3A9BD;font-size:14px">' + (x.laatst_ingelogd ? datum(x.laatst_ingelogd) : 'Nog niet') + '</td><td>' + status(x) + '</td>' +
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

  /* ---------- klikken ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-actie],[data-album],[data-foto],[data-lb]') : null;
    if (!t) return;
    if (t.dataset.album) { location.hash = '#/album/' + t.dataset.album; return; }
    if (t.dataset.foto) { lichtbak(Number(t.dataset.foto)); return; }
    if (t.dataset.lb) {
      var f = HUIDIG.fotos[lbIndex], n = HUIDIG.fotos.length;
      if (t.dataset.lb === 'sluit') sluitLichtbak();
      if (t.dataset.lb === 'vorige') lichtbak((lbIndex - 1 + n) % n);
      if (t.dataset.lb === 'volgende') lichtbak((lbIndex + 1) % n);
      if (t.dataset.lb === 'download') downloadFoto(f).catch(function (er) { toast(er.message); });
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
    if (!T.token) { loginScherm(); return; }
    var h = location.hash.replace(/^#/, '') || '/';
    var m;
    if ((m = h.match(/^\/album\/([0-9a-f-]{36})$/i))) return albumScherm(m[1]);
    if (T.rol === 'beheer') {
      if ((m = h.match(/^\/beheer\/klant\/([0-9a-f-]{36})$/i))) return klantScherm(m[1]);
      return beheerScherm();
    }
    return home();
  }
  window.addEventListener('hashchange', render);
  render();
})();
