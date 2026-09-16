const CACHE = 'rooms-eyecatch-v1';
const BASE_URL = self.registration.scope;
const APP_SHELL = [BASE_URL, `${BASE_URL}manifest.webmanifest`, `${BASE_URL}icons/icon-192.png`, `${BASE_URL}icons/icon-512.png`];

self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    return response;
  }).catch(() => event.request.mode === 'navigate' ? caches.match(BASE_URL) : undefined)));
});
