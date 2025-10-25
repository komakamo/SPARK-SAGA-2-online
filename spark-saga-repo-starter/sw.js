// --- CONFIGURATION ---
const CACHE_NAME = 'spark-saga-v1';
const CORE_ASSETS = [
  './index.html',
  './public/manifest.json',
  './public/icon-192.png',
  './public/icon-512.png'
];

// --- EVENT HANDLERS ---

// 1. On Install: Pre-cache the core assets.
self.addEventListener('install', event => {
  console.log('[SW] Install event fired. Caching core assets...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

// 2. On Activate: Clean up old, unused caches.
self.addEventListener('activate', event => {
  console.log('[SW] Activate event fired. Cleaning up old caches...');
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});

// 3. On Fetch: Serve assets from cache first, with a network fallback.
// This is a "Cache First" strategy.
self.addEventListener('fetch', event => {
  console.log(`[SW] Fetching: ${event.request.url}`);
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // If the asset is in the cache, return it.
      if (cachedResponse) {
        console.log(`[SW] Cache HIT for: ${event.request.url}`);
        return cachedResponse;
      }
      // If the asset is not in the cache, fetch it from the network.
      console.log(`[SW] Cache MISS for: ${event.request.url}. Fetching from network...`);
      return fetch(event.request).catch(() => {
        // If the network request fails (e.g., offline), return the main index.html as a fallback.
        console.warn(`[SW] Network request FAILED. Serving offline fallback for: ${event.request.url}`);
        return caches.match('./index.html');
      });
    })
  );
});
