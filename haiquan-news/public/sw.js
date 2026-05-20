const CACHE_VERSION = 'hq-news-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const ARTICLE_CACHE = `${CACHE_VERSION}-articles`;

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

const STATIC_PATTERNS = [
  /\/fonts\//,
  /\.woff2?$/,
  /\/opengraph\./,
  /\/favicon/,
  /\/logo/,
  /\/manifest\.json$/,
];

const BYPASS_PATTERNS = [
  /\/api\//,
  /supabase\.co/,
  /chrome-extension/,
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(n => !n.startsWith(CACHE_VERSION))
          .map(n => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (BYPASS_PATTERNS.some(p => p.test(event.request.url))) return;

  if (STATIC_PATTERNS.some(p => p.test(url.pathname))) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      }).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  if (url.pathname.startsWith('/bai-viet/') && url.origin === location.origin) {
    event.respondWith(
      caches.open(ARTICLE_CACHE).then(async cache => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then(response => {
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => cached || new Response('Offline', { status: 503 }));
        return cached || fetchPromise;
      })
    );
    return;
  }

  if (url.origin === location.origin) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(async cache => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then(response => {
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => cached || new Response('Offline', { status: 503 }));
        return cached || fetchPromise;
      })
    );
    return;
  }
});

self.addEventListener('message', event => {
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))));
    event.ports[0]?.postMessage({ ok: true });
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
