/* Офлайн-кэш оболочки приложения.
   ВАЖНО: здесь кэшируются только файлы интерфейса (index.html, иконки).
   Финансовые данные живут в IndexedDB и этим кэшем не затрагиваются:
   очистка кэша / обновление приложения не удаляет ни одной операции. */
const CACHE = 'cards-shell-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* stale-while-revalidate: мгновенный запуск из кэша, в фоне подтягивается
   свежая версия — обновление приложения происходит само при открытии с интернетом */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fresh = fetch(e.request)
        .then((resp) => {
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
