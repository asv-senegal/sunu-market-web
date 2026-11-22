// Service worker de Sunu-Market (PWA).
// - Pages : toujours depuis le réseau (données à jour, pages privées jamais mises en cache) ;
//   hors connexion, page « Vous êtes hors ligne ».
// - Fichiers statiques (code, styles, icônes, photos de démonstration, polices) : cache, puis mise à jour en arrière-plan.
// - Tout le reste (données des pages, API, images privées) passe directement par le réseau.
const VERSION = 'v1';
const STATIC = `sunu-static-${VERSION}`;
const OFFLINE = '/offline.html';
const PRECACHE = [OFFLINE, '/favicon.svg', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('sunu-') && k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isStatic = (url) =>
  (url.origin === self.location.origin && /^\/(assets|demo|icons)\/|^\/(favicon\.svg|manifest\.webmanifest)$/.test(url.pathname)) ||
  url.origin === 'https://fonts.googleapis.com' ||
  url.origin === 'https://fonts.gstatic.com';

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    return;
  }

  if (isStatic(url)) {
    e.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(req);
        const net = fetch(req).then((res) => {
          if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
          return res;
        }).catch(() => hit);
        return hit || net;
      }),
    );
  }
});
