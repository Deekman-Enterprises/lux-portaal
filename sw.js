/* LUX Klantportaal — service worker: app werkt als echte app en laadt snel.
   Alleen de app-bestanden worden bewaard; foto's en inloggegevens nooit. */
const VERSIE = 'lux-portaal-v2';
const BESTANDEN = ['/', '/index.html', '/app.css', '/app.js', '/installeer.js', '/config.js', '/privacy.html', '/manifest.webmanifest',
  '/favicon.svg', '/favicon-32.png', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSIE).then((c) => c.addAll(BESTANDEN)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((n) => n !== VERSIE).map((n) => caches.delete(n)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // API en foto's altijd live
  // Eerst het netwerk (altijd de nieuwste versie), offline terugvallen op de bewaarde versie.
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok) { const kopie = r.clone(); caches.open(VERSIE).then((c) => c.put(e.request, kopie)); }
    return r;
  }).catch(() => caches.match(e.request).then((r) => r || caches.match('/index.html'))));
});
