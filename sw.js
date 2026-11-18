const V = "padelplus-v5";
const SHELL = ["./", "index.html", "core.js", "views.js", "rec.js", "nutri.js", "social.js", "shoes.js", "padel.js", "gear.js", "learn.js", "share.js", "data.js", "icons.js", "config.js", "manifest.json", "icon-192.png", "privacidad.html", "guia.html", "lib/leaflet.js", "lib/leaflet.css"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url); if (e.request.method !== "GET") return;
  if (u.origin === location.origin) { e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html")))); return; }
  if (/fonts\.(googleapis|gstatic)\.com|unpkg\.com|gstatic\.com\/firebasejs/.test(u.host + u.pathname)) e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(n => { const c = n.clone(); caches.open(V).then(x => x.put(e.request, c)); return n; })));
});
