/* LUX Klantportaal — als app op je telefoon zetten */
(function () {
  'use strict';
  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone) return;

  var ua = navigator.userAgent || '';
  var ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var iosSafari = ios && /safari/i.test(ua) && !/crios|fxios|edgios|opios/i.test(ua);
  var uitgesteld = null, el = null;

  function weggeklikt() { try { var t = Number(localStorage.getItem('lux_installeer_weg') || 0); return Date.now() - t < 14 * 864e5; } catch (e) { return false; } }
  function weg() { try { localStorage.setItem('lux_installeer_weg', String(Date.now())); } catch (e) {} sluit(); }
  function sluit() { if (el) { el.remove(); el = null; } }

  var DEEL = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5EA2FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
  var PLUS = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
  var X = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function toon(html) {
    sluit();
    el = document.createElement('div');
    el.className = 'inst'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'LUX als app installeren');
    el.innerHTML = '<img src="/icon-192.png" alt="">' + html + '<button class="icon-btn" type="button" data-weg aria-label="Sluiten">' + X + '</button>';
    document.body.appendChild(el);
    el.querySelector('[data-weg]').onclick = weg;
    return el;
  }

  function android() {
    if (!uitgesteld || weggeklikt()) return;
    var b = toon('<div class="inst-tekst"><strong>Zet LUX op je telefoon</strong><span>Open je foto’s met één tik, net als een app.</span></div><button class="btn btn-grad" type="button" data-ja>Installeren</button>');
    b.querySelector('[data-ja]').onclick = function () {
      var p = uitgesteld; uitgesteld = null; sluit();
      p.prompt(); p.userChoice.then(function (k) { if (k.outcome !== 'accepted') weg(); });
    };
  }
  function iphone() {
    if (weggeklikt()) return;
    toon('<div class="inst-tekst"><strong>Zet LUX op je beginscherm</strong><ol class="inst-stappen"><li>' + DEEL + '<span>Tik onderin op <b>Deel</b></span></li><li>' + PLUS + '<span>Kies <b>Zet op beginscherm</b></span></li></ol></div>');
  }

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); uitgesteld = e; setTimeout(android, 1500); });
  window.addEventListener('appinstalled', function () { sluit(); try { localStorage.setItem('lux_installeer_weg', String(Date.now() + 3650 * 864e5)); } catch (e) {} });
  if (iosSafari) window.addEventListener('load', function () { setTimeout(iphone, 1500); });

  // Ook te openen via een knop op de pagina: <button data-installeer>
  document.addEventListener('click', function (e) {
    var k = e.target.closest && e.target.closest('[data-installeer]'); if (!k) return;
    try { localStorage.removeItem('lux_installeer_weg'); } catch (x) {}
    if (uitgesteld) android(); else if (ios) iphone();
  });
  function knopTonen() { var k = document.getElementById('inst-link'); if (k && (uitgesteld || ios)) { k.hidden = false; k.previousSibling.textContent = ' · '; } }
  window.addEventListener('beforeinstallprompt', knopTonen);
  if (ios) window.addEventListener('load', knopTonen);
})();
