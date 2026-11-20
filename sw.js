const V = "padelplus-v28";
const SHELL = ["./", "index.html", "core.js", "views.js", "rec.js", "nutri.js", "social.js", "shoes.js", "padel.js", "gear.js", "learn.js", "share.js", "pistas.js", "opinar.js", "subir.js", "data.js", "icons.js", "config.js", "manifest.json", "icon-192.png", "privacidad.html", "guia.html", "lib/leaflet.js", "lib/leaflet.css", "icon-512.png", "apple-touch-icon.png"];
// Instala la versión nueva descargándola fresca (sin caché del navegador)
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => fetch(new Request(u, { cache: "reload" })).then(r => { if (r.ok) return c.put(u, r); })))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url); if (e.request.method !== "GET") return;
  if (u.origin === location.origin) {
    // Abre al instante desde la memoria del móvil; si no está, lo baja y lo guarda
    const key = e.request.mode === "navigate" ? "index.html" : e.request;
    e.respondWith(caches.open(V).then(c => c.match(key, { ignoreSearch: e.request.mode === "navigate" }).then(r => r || fetch(e.request).then(n => { if (n.ok && e.request.mode !== "navigate") c.put(e.request, n.clone()); return n; }).catch(() => c.match("index.html")))));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com|gstatic\.com\/firebasejs/.test(u.host + u.pathname)) e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(n => { const c = n.clone(); caches.open(V).then(x => x.put(e.request, c)); return n; })));
});
