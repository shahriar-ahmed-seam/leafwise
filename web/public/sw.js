/**
 * Leafwise service worker.
 *
 * Two caching strategies, for two very different assets:
 *
 *  - the model (~9 MB) and the ONNX Runtime wasm binaries are immutable, so they are
 *    cache-first forever; that is what makes the second visit work with the radio off.
 *  - everything else is network-first with a cache fallback, so a deploy is picked up
 *    immediately when there is signal, and still opens when there is none.
 */

const VERSION = "leafwise-v1";
const STATIC_CACHE = `${VERSION}-static`;
const MODEL_CACHE = `${VERSION}-model`;

const SHELL = ["/", "/scan", "/manifest.webmanifest"];
const IMMUTABLE = [/^\/model\//, /^\/ort\//, /^\/_next\/static\//, /^\/icons\//];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(SHELL).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function isImmutable(pathname) {
  return IMMUTABLE.some((re) => re.test(pathname));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isImmutable(url.pathname)) {
    event.respondWith(
      caches.open(MODEL_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const res = await fetch(request);
        if (res.ok && (request.mode === "navigate" || url.pathname.startsWith("/_next/"))) {
          const cache = await caches.open(STATIC_CACHE);
          cache.put(request, res.clone());
        }
        return res;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const shell = await caches.match("/scan");
          if (shell) return shell;
        }
        throw new Error("offline and not cached");
      }
    })(),
  );
});
