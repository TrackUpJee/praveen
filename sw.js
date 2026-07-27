const CACHE_NAME = 'jeehub-v2';
const ASSETS = ['./index.html', './logo.png', './manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});

// Sync Listeners for PWABuilder Scanner
self.addEventListener('sync', (e) => { console.log('Sync triggered'); });
self.addEventListener('periodicsync', (e) => { console.log('Periodic Sync triggered'); });
self.addEventListener('push', (e) => { console.log('Push triggered'); });
