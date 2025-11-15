const CACHE_NAME = 'finplan-cache-v10'; // <-- Incremented to v10
const URLS_TO_CACHE = [
  '/',
  'index.html',
  'manifest.json',
  'icon-192.svg',
  'icon-512.svg',
  'icon-monochrome.svg', 
  
  // External resources to cache
  // 'https://cdn.tailwindcss.com', // <-- REMOVED THIS LINE. It was breaking the cache.
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
];

// Install event: Caches the app shell
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing new version (v10)...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        self.skipWaiting(); // Activate the new service worker immediately
      })
      .catch(error => {
        console.error('Service Worker: Cache addAll failed:', error);
      })
  );
});

// Activate event: Cleans up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating new version (v10)...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Take control of all open clients
    })
  );
});

// Fetch event: Serves cached content
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // Network-first strategy for external resources
  if (event.request.url.includes('firebase') || event.request.url.includes('google')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Cache-first strategy for our app shell
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then((networkResponse) => {
            return caches.open(CACHE_NAME)
              .then((cache) => {
                if (networkResponse.status === 200) {
                    cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
              });
          });
      })
      .catch((error) => {
        console.error('Service Worker: Fetch error', error);
      })
  );
});
