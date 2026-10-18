// Service worker generado por scripts/build.mjs
const VERSION = '__VERSION__';
const BASE = '__BASE__';
const PRECACHE = "__PRECACHE__";
const CACHE = 'recetario-' + VERSION;
const FOTOS = 'recetario-fotos';
const FUENTES = 'recetario-fuentes';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('recetario-') && ![CACHE, FOTOS, FUENTES].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function primeroRed(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const url = new URL(req.url);
    const hit = (await cache.match(req, { ignoreSearch: true })) ||
      (await cache.match(url.pathname.endsWith('/') ? url.pathname : url.pathname + '/'));
    return hit || (await cache.match(BASE + '404.html')) || Response.error();
  }
}

async function primeroCache(req, nombre) {
  const cache = await caches.open(nombre);
  const hit = await cache.match(req, { ignoreSearch: nombre === CACHE });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(primeroCache(req, FUENTES));
    return;
  }
  if (url.origin !== location.origin || !url.pathname.startsWith(BASE)) return;
  if (req.mode === 'navigate') {
    // Páginas: red primero (recetas nuevas al momento), caché si no hay conexión
    e.respondWith(primeroRed(req));
    return;
  }
  if (url.pathname.startsWith(BASE + 'fotos/')) {
    e.respondWith(primeroCache(req, FOTOS));
    return;
  }
  e.respondWith(primeroCache(req, CACHE));
});
