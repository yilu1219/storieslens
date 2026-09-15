const VERSION = "storieslens-h5-v67-product-film-20260915";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const APP_SHELL = [
  "/offline.html",
  "/app.html",
  "/chinese-studio.html",
  "/index.html",
  "/product-video.html",
  "/classroom-archive.html",
  "/manifest.webmanifest",
  "/styles.css",
  "/teacher-dashboard.css",
  "/classroom-archive.css?v=20260911-4",
  "/classroom-archive.js?v=20260913-4",
  "/analytics.js",
  "/i18n.js?v=20260908-1",
  "/portal-home.css?v=20260913-35",
  "/portal-home.js?v=20260914-37",
  "/family-flow.css?v=20260915-2",
  "/chinese-studio.css?v=20260914-3",
  "/h5-app.js?v=20260915-3",
  "/yu-profile.css?v=20260915-3",
  "/yu-profile.js?v=20260915-3",
  "/showcase.html",
  "/showcase.css?v=20260909-1",
  "/showcase.js",
  "/app-shell.css",
  "/h5-app.css?v=20260907-4",
  "/pwa.css",
  "/platform-client.js",
  "/safety-client.js",
  "/artwork-upload-safety.js?v=20260913-1",
  "/pwa.js",
  "/offline.js",
  "/assets/storieslens-logo.png",
  "/assets/yu-mascot-logo-v2.png",
  "/assets/yu-feather-mark.svg",
  "/assets/storieslens-zh-seal-v2.png",
  "/assets/hero-zh-wuxia-ink-v1.png",
  "/assets/hero-zh-ink-cocreation-hd-v2.png",
  "/assets/outcome-zh-ink-book-v1.png",
  "/assets/outcome-zh-lianhuanhua-v1.png",
  "/assets/outcome-zh-cocreated-film-v1.png",
  "/assets/outcome-zh-cinematic-trailer-v1.png",
  "/assets/portal-solo-family-watercolor-v5.jpg",
  "/assets/portal-cocreate-family-watercolor-v5.jpg",
  "/assets/portal-teacher-bulletin-watercolor-v4.jpg",
  "/assets/lightyear-three-generations-family-watercolor-v3.jpg",
  "/assets/storieslens-product-film-poster.jpg"
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
