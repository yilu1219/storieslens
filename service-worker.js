const VERSION = "storieslens-h5-v43-20260911";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const APP_SHELL = [
  "/offline.html",
  "/app.html",
  "/index.html",
  "/classroom-archive.html",
  "/manifest.webmanifest",
  "/styles.css",
  "/teacher-dashboard.css",
  "/classroom-archive.css?v=20260911-4",
  "/classroom-archive.js?v=20260911-3",
  "/analytics.js",
  "/i18n.js?v=20260908-1",
  "/portal-home.css?v=20260911-29",
  "/portal-home.js?v=20260911-28",
  "/family-flow.css?v=20260911-2",
  "/h5-app.js?v=20260911-4",
  "/showcase.html",
  "/showcase.css?v=20260909-1",
  "/showcase.js",
  "/app-shell.css",
  "/h5-app.css?v=20260907-4",
  "/pwa.css",
  "/platform-client.js",
  "/safety-client.js",
  "/artwork-upload-safety.js",
  "/pwa.js",
  "/offline.js",
  "/assets/storieslens-logo.png",
  "/assets/portal-solo-family-watercolor-v5.jpg",
  "/assets/portal-cocreate-family-watercolor-v5.jpg",
  "/assets/portal-teacher-bulletin-watercolor-v4.jpg",
  "/assets/lightyear-three-generations-watercolor-v2.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => ![STATIC_CACHE, PAGE_CACHE].includes(key)).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
      return response;
    }).catch(async () => (await caches.match(request)) || caches.match("/offline.html")));
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) caches.open(STATIC_CACHE).then((cache) => cache.put(request, response.clone()));
    return response;
  })));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
