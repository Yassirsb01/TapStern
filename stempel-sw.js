/* Tapstempel als App: Service Worker nur für das Dashboard (/stempel…).
   Er speichert KEINE Daten zwischen — nur eine Offline-Seite und das Icon.
   Alle Anfragen gehen immer frisch ans Netz (Kunden, Stempel, Login). */
const CACHE = 'tapstempel-v1';
const OFFLINE = '/pwa/offline.html';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll([OFFLINE, '/pwa/tapstempel-192.png'])));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate') return; // alles andere normal übers Netz
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)));
});
