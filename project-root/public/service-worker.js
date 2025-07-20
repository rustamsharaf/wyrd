// Кэширование статических ресурсов при установке
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('ball-game-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/static/js/main.chunk.js',
        '/static/js/0.chunk.js',
        '/static/js/bundle.js',
        '/favicon.ico',
        '/logo192.png',
        '/logo512.png'
      ]);
    })
  );
});

// Стратегия: сначала сеть, потом кэш
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Очистка старых кэшей
self.addEventListener('activate', (event) => {
  const cacheWhitelist = ['ball-game-v1'];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});