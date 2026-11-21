const V = "padelplus-v43";
const SHELL = ["./", "index.html", "core.js", "views.js", "rec.js", "nutri.js", "social.js", "shoes.js", "padel.js", "gear.js", "learn.js", "share.js", "pistas.js", "opinar.js", "tablon.js", "tienda.js", "subir.js", "data.js", "icons.js", "config.js", "manifest.json", "icon-192.png", "privacidad.html", "guia.html", "lib/leaflet.js", "lib/leaflet.css", "icon-512.png", "apple-touch-icon.png"];
// Instala la versión nueva descargándola fresca (sin caché del navegador)
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => fetch(new Request(u, { cache: "reload" })).then(r => { if (r.ok) return c.put(u, r); })))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== "padelplus-fotos").map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url); if (e.request.method !== "GET") return;
  if (u.origin === location.origin && u.pathname.includes("/data/")) {
    // Catálogo: siempre el más reciente; si no hay red, el guardado
    e.respondWith(fetch(e.request).then(n => { const c = n.clone(); caches.open(V).then(x => x.put(e.request, c)); return n; }).catch(() => caches.match(e.request)));
    return;
  }
  if (u.origin === location.origin) {
    // Siempre la versión más nueva si hay internet (máx. 3,5 s); si no, la guardada en el móvil
    const key = e.request.mode === "navigate" ? "index.html" : e.request;
    e.respondWith(caches.open(V).then(c => {
      const net = fetch(e.request, { cache: "no-cache" }).then(n => { if (n.ok) c.put(key, n.clone()); return n; });
      const slow = new Promise(r => setTimeout(r, 3500)).then(() => c.match(key, { ignoreSearch: e.request.mode === "navigate" }));
      return Promise.race([net.catch(() => c.match(key, { ignoreSearch: e.request.mode === "navigate" })), slow.then(r => r || net)]).then(r => r || net);
    }));
    return;
  }
  if (u.host === "cdn.shopify.com" && e.request.destination === "image") {
    // Fotos de productos: guardadas en el móvil para que salgan al instante
    e.respondWith(caches.open("padelplus-fotos").then(c => c.match(e.request).then(r => r || fetch(e.request).then(n => { c.put(e.request, n.clone()); return n; }))));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com|gstatic\.com\/firebasejs/.test(u.host + u.pathname)) e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(n => { const c = n.clone(); caches.open(V).then(x => x.put(e.request, c)); return n; })));
});
