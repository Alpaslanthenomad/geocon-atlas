// GEOCON service worker — conservative cache-first for static assets,
// network-first for HTML, no caching of Supabase requests.

const VERSION = "geocon-v1";
const STATIC_CACHE = `${VERSION}-static`;

const STATIC_ALLOWED = [
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
  /\.(?:woff2|woff|ttf)$/i,
  /\/_next\/static\//,
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(["/manifest.json", "/icon-192.svg", "/icon-512.svg"]).catch(() => {})
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Don't touch Supabase, API routes, or cross-origin third parties.
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.endsWith(".supabase.co") ||
    url.hostname.endsWith(".supabase.in")
  ) {
    return;
  }

  // Static asset → cache-first
  const isStatic = STATIC_ALLOWED.some((re) => re.test(url.pathname));
  if (isStatic) {
    event.respondWith(
      caches.match(request).then((hit) => {
        if (hit) return hit;
        return fetch(request).then((res) => {
          if (!res || res.status !== 200 || res.type === "opaque") return res;
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
          return res;
        }).catch(() => caches.match("/icon-192.svg"));
      })
    );
    return;
  }

  // HTML / RSC → stay network-first, don't bother caching to avoid stale UI
});
