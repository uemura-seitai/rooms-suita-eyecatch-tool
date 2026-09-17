// Cleanup worker for devices that previously installed the offline cache.
// It never intercepts requests or caches application files.
const CACHE_PREFIX = 'rooms-eyecatch-';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil((async () => {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames
    .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX))
    .map((cacheName) => caches.delete(cacheName)));
  await self.registration.unregister();
})()));
