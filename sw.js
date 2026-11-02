/* Service Worker: يخلّي التطبيق يفتح بسرعة وحتى بدون إنترنت (الواجهة بس) */
const CACHE = "osw-v3";
const CORE = ["./", "index.html", "check.html", "style.css", "config.js", "util.js", "data.js", "content.js", "engine3d.js", "audio.js", "scene_houses.js", "scene_world.js", "chars3d.js", "world3d.js", "game.js", "ui.js", "places.js", "app.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // بيانات Supabase ما بنخزّنها أبداً
  if (u.hostname.endsWith("supabase.co") || u.hostname.endsWith("supabase.in")) return;
  // الملفات المحلية: الشبكة أولاً ثم الكاش
  if (u.origin === location.origin) {
    e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then((m) => m || caches.match("index.html"))));
    return;
  }
  // الخطوط والمكتبات: كاش أولاً
  if (/fonts\.g|jsdelivr/.test(u.hostname)) {
    e.respondWith(caches.match(e.request).then((m) => m || fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; })));
  }
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window" }).then((cs) => (cs.length ? cs[0].focus() : self.clients.openWindow("./"))));
});
