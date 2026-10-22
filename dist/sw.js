const CACHE = 'tempo-v8';
const ASSETS = [
  './', './index.html', './app.mjs', './parser.mjs', './storage.mjs',
  './domain/current.mjs', './domain/archive.mjs', './views/gauge.mjs', './services/history-import.mjs',
  './styles/gauge.css', './domain/history.mjs', './views/charts.mjs', './views/statistics.mjs', './services/backup.mjs',
  './domain/departure.mjs', './domain/time.mjs', './domain/settings.mjs', './domain/balance.mjs',
  './views/table.mjs', './views/settings.mjs', './services/import.mjs',
  './styles/base.css', './styles/layout.css', './styles/theme.css',
  './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png',
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('tempo-') && key !== CACHE).map(key => caches.delete(key)),
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;
  if (!ASSETS.some(path => new URL(path, self.registration.scope).pathname === url.pathname)) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && response.type !== 'opaqueredirect') {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request)));
});
