// Descarga todos los clubes/pistas de pádel de España (OpenStreetMap) y las ciudades, y genera data/clubes.json
// Se ejecuta en GitHub Actions una vez por semana. La app busca en este archivo, sin depender de servidores externos.
import fs from "node:fs";

const SERVERS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
async function overpass(q) {
  let last;
  for (const u of SERVERS) {
    for (let i = 0; i < 2; i++) {
      try {
        const r = await fetch(u, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "padelmas.club (holapadelmas@gmail.com)" } });
        if (!r.ok) throw new Error(u + " HTTP " + r.status);
        const j = await r.json(); if (!j.elements) throw new Error("sin datos"); return j.elements;
      } catch (e) { last = e; console.warn(String(e)); await new Promise(r => setTimeout(r, 5000)); }
    }
  }
  throw last;
}
const AREA = `area["ISO3166-1"="ES"][admin_level=2]->.es;`;
const els = await overpass(`[out:json][timeout:300];${AREA}(nwr["sport"~"padel|paddle",i](area.es);nwr["leisure"~"sports_centre|pitch|sports_hall|fitness_centre"]["name"~"p[aá]del",i](area.es););out center tags;`);
console.log("Elementos de pádel:", els.length);
const places = await overpass(`[out:json][timeout:200];${AREA}node["place"~"^(city|town|village|suburb)$"]["name"](area.es);out tags;`.replace("out tags;", "out;"));
console.log("Lugares:", places.length);

// ---------- agrupar pistas en clubes ----------
const R = 6371, rad = d => d * Math.PI / 180;
const dist = (a, b, c, d) => { const x = rad(c - a), y = rad(d - b); const h = Math.sin(x / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(y / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const pts = els.map(e => { const c = e.center || e; return { lat: c.lat, lon: c.lon, t: e.tags || {} }; }).filter(p => p.lat != null);
const isPitch = p => p.t.leisure === "pitch" || (!p.t.name && !p.t.leisure);
const clubs = pts.filter(p => !isPitch(p)).map(a => ({ n: a.t.name || "", lat: a.lat, lon: a.lon, t: a.t, pistas: 0, cub: 0 }));
// rejilla para acelerar
const grid = new Map(), key = (la, lo) => `${Math.floor(la * 100)}_${Math.floor(lo * 100)}`;
const addG = c => { const k = key(c.lat, c.lon); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(c); };
clubs.forEach(addG);
for (const p of pts.filter(isPitch)) {
  let best = null, bd = 1e9; const a = Math.floor(p.lat * 100), b = Math.floor(p.lon * 100);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const c of grid.get(`${a + i}_${b + j}`) || []) {
    const d = dist(p.lat, p.lon, c.lat, c.lon); const lim = c.t.leisure === "pitch" ? .12 : .3; if (d < lim && d < bd) { best = c; bd = d; } }
  if (!best) { best = { n: p.t.name || "", lat: p.lat, lon: p.lon, t: { ...p.t }, pistas: 0, cub: 0, suelta: true }; clubs.push(best); addG(best); }
  best.pistas += Math.max(1, +(p.t.courts || p.t.pitches || 1) || 1);
  if (p.t.covered === "yes" || p.t.indoor === "yes" || p.t.building || p.t.leisure === "sports_hall") best.cub++;
  if (!best.n && p.t.name) best.n = p.t.name;
  for (const k of ["addr:street", "addr:housenumber", "addr:city", "website", "contact:website", "phone", "contact:phone", "operator"]) if (p.t[k] && !best.t[k]) best.t[k] = p.t[k];
}
// ciudades (para buscar por nombre sin internet)
const L = places.map(p => [p.tags.name, +p.lat.toFixed(4), +p.lon.toFixed(4), { city: 3, town: 2, village: 1, suburb: 1 }[p.tags.place] || 0, +(p.tags.population || 0)])
  .sort((a, b) => b[3] - a[3] || b[4] - a[4]).map(x => x.slice(0, 4));
const city = (lat, lon) => { let b = null, bd = 1e9; for (const l of L) { if (l[3] < 1) continue; const d = Math.abs(l[1] - lat) + Math.abs(l[2] - lon); if (d < bd) { bd = d; b = l; } } return b && bd < .25 ? b[0] : ""; };

const out = clubs.map(c => {
  const t = c.t, muni = /ayuntamiento|municipal|concello|ajuntament|patronato|deportes/i.test(t.operator || "");
  const calle = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", ");
  const ciudad = t["addr:city"] || "";
  let n = c.n || (muni ? "Pistas municipales" : t.operator || "Pistas de pádel") + (t["addr:street"] ? ` · ${t["addr:street"]}` : "");
  const cub = !c.pistas && (t.leisure === "sports_hall" || t.covered === "yes" || t.indoor === "yes" || /indoor|cubiert/i.test(n)) ? 1 : c.cub;
  return [n, +c.lat.toFixed(5), +c.lon.toFixed(5), c.pistas || 0, cub, [calle, ciudad].filter(Boolean).join(" · "), t.website || t["contact:website"] || "", t.phone || t["contact:phone"] || ""];
});
// rellena la ciudad que falte
for (const o of out) if (!o[5]) o[5] = city(o[1], o[2]);
fs.mkdirSync(new URL("../data/", import.meta.url), { recursive: true });
fs.writeFileSync(new URL("../data/clubes.json", import.meta.url), JSON.stringify({ t: new Date().toISOString(), c: out, l: L }));
console.log(`Guardados ${out.length} clubes y ${L.length} lugares`);
