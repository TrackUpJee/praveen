// sw.js — JEE2027 Hub service worker
// Ship this file in the SAME folder as index.html (alongside manifest.json
// and logo.png), on a real https:// host (Netlify Drop, GitHub Pages, etc).
// It CANNOT do anything on file:// — that's a browser security rule, not a
// bug — the app already detects that and falls back to on-screen alerts.
//
// What this actually fixes vs. the old in-memory ("blob URL") service
// worker: a blob SW only exists in RAM and is thrown away the instant the
// tab/app is closed, so notifications stopped the moment you left. A real
// same-origin sw.js file is registered against this URL, so the browser can
// re-launch/keep it alive in the background independently of the tab —
// notifications fire while the app is closed or the phone is asleep/screen
// off, as long as the phone itself is powered on and has a moment of
// connectivity/background time (this is how every web app's background
// notifications work, JEE2027 Hub included).
//
// Honest limit that no app — native or web — can get around: if the phone
// itself is fully powered OFF, nothing can wake it to show a notification.
// The OS has to be running for any notification, from any app, to appear.

const CACHE_NAME = "jee2027hub-v1";
const CORE_ASSETS = ["./", "./index.html", "./manifest.json", "./logo.png"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Best-effort — don't fail install if one asset is missing (e.g. no logo.png yet)
      Promise.all(CORE_ASSETS.map((url) => cache.add(url).catch(() => {})))
    )
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first so you always get the latest app version when online; falls
// back to the cached copy when offline (airplane mode, dead network, etc).
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(e.request).then((cached) => cached || caches.match("./index.html")))
  );
});

// Tapping a notification focuses an already-open tab instead of opening a
// duplicate one, or opens a fresh tab if the app isn't open anywhere.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ("focus" in c) return c.focus();
      }
      return self.clients.openWindow("./");
    })
  );
});

// Lets the page ask the SW to show a notification directly (used by the
// app's notifyUser()/live-study-timer notification code) — this route works
// even when Android has fully backgrounded the tab's own JS.
self.addEventListener("message", (e) => {
  const msg = e.data || {};
  if (msg.type === "SHOW_NOTIFICATION") {
    self.registration.showNotification(msg.title || "JEE2027 Hub", msg.options || {});
  }
});

// Periodic Background Sync — Chrome-only, only granted for installed PWAs
// with real usage history, and the browser decides the actual interval
// (commonly ~every 12h+, never as often as "every minute"). It's a genuine
// best-effort extra chance to nudge you even if the app hasn't been opened
// in a while — not a guaranteed-timing reminder system. Regular reminders
// (task times, milestones, live study timer) are still driven by the app
// itself while it's open/backgrounded, same as before.
self.addEventListener("periodicsync", (e) => {
  if (e.tag === "jee2027hub-nudge") {
    e.waitUntil(
      self.registration.showNotification("📚 JEE2027 Hub", {
        body: "Open the app to check today's tasks, tests & study plan.",
        tag: "periodic-nudge",
        icon: "./logo.png",
        badge: "./logo.png",
      }).catch(() => {})
    );
  }
});
