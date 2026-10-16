const CACHE_NAME = 'billing-pwa-cache-v12';
const urlsToCache = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/logo.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      const response = await caches.match(event.request);
      if (response) return response;
      
      // Fallback when not in cache
      return new Response('Network error and resource not in cache', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'text/plain'
        })
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('push', event => {
  console.log('[SW] Push Received.', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      console.log('[SW] Push data parsed as JSON:', data);
    } catch (e) {
      data = { body: event.data.text() };
      console.log('[SW] Push data parsed as text:', data);
    }
  }
  
  const title = data.title || 'Notifikasi Baru';
  const options = {
    body: data.body || '',
    icon: (data.icon || '/logo.jpg') + '?v=12',
    badge: '/badge.png?v=12',
    data: data.data || { url: '/' },
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[SW] Notification shown!'))
      .catch(err => console.error('[SW] Notification show error:', err))
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        // If so, just focus it.
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
