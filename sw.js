const CACHE = 'bikuboo-shell-v8';
const APP_SHELL = [
  './', './index.html', './styles.css', './app.js', './brand-logo.js', './auth-launcher.js', './mobile-top-actions.js', './landing-refresh.js', './landing-click-fix.js', './phone-auth-actions.js', './homepage-visual-cleanup.js', './landing-polish.js', './manifest.webmanifest',
  './privacy.html', './terms.html', './refund.html', './safety.html',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-180.png',
  './assets/bikuboo-logo.webp', './assets/map-vibe.svg', './community-vibe.svg', './safety-vibe.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      fetch(event.request, {cache: 'no-store'})
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put('./index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (['script','style'].includes(event.request.destination)) {
    event.respondWith(
      fetch(event.request, {cache:'no-store'}).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => caches.match('./index.html'))
    )
  );
});