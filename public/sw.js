// GEOCON service worker — conservative cache-first for static assets,
// network-first for HTML, no caching of Supabase requests.
// Also handles web push notifications + notificationclick routing.

const VERSION = "geocon-v2";
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

// ─── Push ──────────────────────────────────────────────────────────────
//
// Push payload (delivered by /api/push/send) is JSON:
//   { title, body, tag?, url?, icon?, badge?, data? }
// `tag` collapses duplicates so the user doesn't see ten identical alerts.
// `url` is what we navigate to on click; falls back to /geocon.
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "GEOCON", body: event.data?.text?.() || "" };
  }

  const title = payload.title || "GEOCON";
  const opts = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.svg",
    badge: payload.badge || "/icon-192.svg",
    tag: payload.tag || "geocon",
    renotify: true,
    data: { url: payload.url || "/geocon", ...(payload.data || {}) },
  };

  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || "/geocon";
  const targetUrl = new URL(target, self.location.origin).href;

  event.waitUntil((async () => {
    // Focus an existing tab on the same origin if any; otherwise open new.
    const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clientList) {
      try {
        const sameOrigin = new URL(client.url).origin === self.location.origin;
        if (sameOrigin && "focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(targetUrl);
          return;
        }
      } catch { /* skip malformed client.url */ }
    }
    if (self.clients.openWindow) await self.clients.openWindow(targetUrl);
  })());
});

// Some browsers (Firefox especially) deliver `pushsubscriptionchange`
// when the subscription is invalidated. We can't re-subscribe without
// user gesture here — flag it for the next page load to handle.
self.addEventListener("pushsubscriptionchange", () => {
  // Intentionally noop: client-side PushSubscribeButton checks on every
  // mount and will re-subscribe with the new endpoint.
});
