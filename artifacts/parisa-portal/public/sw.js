// PARISA MEMORY PORTAL — Service Worker v2.0
const CACHE_NAME = "parisa-v2.0";
const MEDIA_CACHE = "parisa-media-v2.0";

const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== MEDIA_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Cache Drive media proxy — stale-while-revalidate for fast playback
  if (url.pathname.startsWith("/api/drive/proxy/") || url.pathname.startsWith("/api/drive/prefetch/")) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then((resp) => {
          if (resp.ok && resp.status === 200) {
            cache.put(event.request, resp.clone());
          }
          return resp;
        }).catch(() => cached ?? new Response("Media offline", { status: 503 }));
        // Return cached immediately if available, fetch in background
        return cached ?? fetchPromise;
      })
    );
    return;
  }

  // Never cache other API calls
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: "offline" }), {
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Network-first for HTML navigation
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match("/") ?? caches.match(event.request)
      )
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, fonts, images)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && event.request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached ?? new Response("Offline", { status: 503 }));
    })
  );
});

// Listen for messages from the app to prefetch media
self.addEventListener("message", (event) => {
  if (event.data?.type === "PREFETCH_MEDIA" && Array.isArray(event.data.urls)) {
    const urls = event.data.urls;
    caches.open(MEDIA_CACHE).then(async (cache) => {
      for (const url of urls) {
        try {
          const cached = await cache.match(url);
          if (!cached) {
            const resp = await fetch(url);
            if (resp.ok) cache.put(url, resp);
          }
        } catch {}
      }
    });
  }
});
