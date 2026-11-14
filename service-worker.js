/**
 * SEVEN PERSONALIZADOS — SERVICE WORKER PWA
 * Suporte a modo standalone no iPhone (iOS), cache e Notificações Push
 */

const CACHE_NAME = 'seven-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './manifest.json',
  './favicon.ico',
  './favicon-192.png',
  './favicon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Responde com rede primeiro, e fallback para cache
self.addEventListener('fetch', (event) => {
  // Ignora requisições de API ou CDN externo para garantir tempo real
  if (event.request.url.includes('supabase.co') || event.request.url.includes('cdn.jsdelivr.net')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Disparo de Notificação Push
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Seven Personalizados', body: event.data ? event.data.text() : 'Nova atualização no sistema!' };
  }

  const title = data.title || 'Seven Personalizados';
  const options = {
    body: data.body || 'Uma alteração foi feita no sistema!',
    icon: './favicon-192.png',
    badge: './favicon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'seven-update',
    renotify: true,
    data: {
      url: data.url || './index.html'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || './index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Comunicação com a janela do app (para disparo nativo)
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'SHOW_NOTIFICATION') {
    const payload = event.data.payload || {};
    self.registration.showNotification(payload.title || 'Seven Personalizados', {
      body: payload.body || 'Atualização no sistema',
      icon: './favicon-192.png',
      badge: './favicon-192.png',
      vibrate: [200, 100, 200],
      tag: payload.tag || 'seven-alert',
      renotify: true,
      data: { url: './index.html' }
    });
  }
});
