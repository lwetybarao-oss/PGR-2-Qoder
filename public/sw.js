// ============================================================
// PGR Arguidos - Service Worker
// Offline caching + Push notifications
// ============================================================

const CACHE_NAME = 'pgr-arguidos-v2';
const STATIC_CACHE = 'pgr-static-v2';
const API_CACHE = 'pgr-api-v2';

// Files to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ============================================================
// INSTALL - Pre-cache critical assets
// ============================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// ============================================================
// ACTIVATE - Clean old caches
// ============================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// ============================================================
// FETCH - Network-first for API, Cache-first for static
// ============================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstThenCache(request, API_CACHE));
    return;
  }

  // Static assets (JS, CSS, images, fonts) - Cache first, fallback to network
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ttf') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(cacheFirstThenNetwork(request, STATIC_CACHE));
    return;
  }

  // HTML pages - Network first, fallback to cache
  event.respondWith(networkFirstThenCache(request, STATIC_CACHE));
});

// ============================================================
// Caching Strategies
// ============================================================
async function networkFirstThenCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    return new Response('Offline - sem conexao', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

async function cacheFirstThenNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================
self.addEventListener('push', (event) => {
  let data = {
    title: 'PGR - Alerta de Prazo',
    body: 'Novo alerta de prazo disponivel.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    url: '/?view=alertas',
    tag: 'pgr-alerta',
    urgency: 'normal',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag || 'pgr-alerta',
      data: { url: data.url || '/?view=alertas' },
      requireInteraction: data.urgency === 'vencido' || data.urgency === 'critico',
      vibrate: data.urgency === 'vencido' ? [200, 100, 200, 100, 200] : [100, 50, 100],
      actions: [
        { action: 'view', title: 'Ver Alertas' },
        { action: 'dismiss', title: 'Ignorar' },
      ],
    })
  );
});

// ============================================================
// NOTIFICATION CLICK - Open app
// ============================================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/?view=alertas';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes('localhost') || client.url.includes('space.chatglm')) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ============================================================
// BACKGROUND SYNC - Sync pending actions when back online
// ============================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-alertas') {
    event.waitUntil(syncAlertas());
  }
});

async function syncAlertas() {
  try {
    const response = await fetch('/api/alertas/verificar', { method: 'POST' });
    if (response.ok) {
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({ type: 'ALERTAS_SYNCED' });
      });
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}
