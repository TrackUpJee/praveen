// TrackUp service worker
const CACHE_NAME = "trackup-cache-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// App se message aane par local notification dikhane ka code
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const title = event.data.title || "TrackUp Alert";
    const options = {
      body: event.data.body || "",
      icon: "logo.png",
      badge: "logo.png",
      vibrate: [200, 100, 200],
      tag: "trackup-alert",
      renotify: true
    };

    self.registration.showNotification(title, options);
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then((cs) => {
      if (cs.length > 0) return cs[0].focus();
      return self.clients.openWindow("/");
    })
  );
});


