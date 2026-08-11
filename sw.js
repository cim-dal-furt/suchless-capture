const CACHE_NAME = 'suchless-v3';

// Okamžitá aktivace nového Service Workeru bez čekání
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// Vyčištění starých verzí keše při aktivaci
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Strategie Network-First
self.addEventListener('fetch', (e) => {
  // Ignorovat non-GET požadavky (POST na Google Apps Script záchyt neřeší keš)
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // Pokud je síťový požadavek úspěšný, uložit kopii do keše a vrátit živá data
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Výpadek sítě: Načíst z lokální keše
        return caches.match(e.request);
      })
  );
});
