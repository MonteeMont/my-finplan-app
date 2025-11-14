const CACHE_NAME = 'finplan-cache-v1';
// This list should include all the files your app needs to run offline.
const URLS_TO_CACHE = [
  'finance-tracker.html',
  'manifest.json',
  // You MUST add your icon files here once you create them:
  'icon-192.svg',
  'icon-512.svg',
  
  // External resources to cache
  'https://cdn.tailwindcss.com',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
];

// Install event: Caches the app shell
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        // Note: addAll() is atomic. If one file fails, the whole cache fails.
        // It's better to cache non-essential files individually if needed.
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
  console.log('Service Worker: Activating...');
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

  // For Firebase and other external resources, use a "network first" strategy
  // to ensure data is always fresh, as this is a data-driven app.
  if (event.request.url.includes('firebase') || event.request.url.includes('google')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, try to get from cache (if it was ever cached)
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For our app shell (HTML, icons, etc.), use a "cache first" strategy.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If it's in the cache, return it.
        if (response) {
          return response;
        }
        
        // If not, fetch it from the network.
        return fetch(event.request)
          .then((networkResponse) => {
            // And cache the new response for next time.
            return caches.open(CACHE_NAME)
              .then((cache) => {
                // Check if the response is valid before caching
                if (networkResponse.status === 200) {
                    cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
              });
          });
      })
      .catch((error) => {
        console.error('Service Worker: Fetch error', error);
        // You could return a specific offline fallback page here if you had one.
      })
  );
});