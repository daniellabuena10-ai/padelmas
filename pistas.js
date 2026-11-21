// ===== Pádel+ · Buscador de pistas y clubes (OpenStreetMap + clubes añadidos por la comunidad) =====
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
let pistas = { lugar: null, lat: null, lon: null, radio: 15, clubs: [], busy: false, err: "", sel: null, addMode: false, filtro: "todos" };
let pistasMap = null;

// ---------- utilidades ----------
const toRad = d => d * Math.PI / 180;
function distKm(a, b, c, d) { const R = 6371, x = toRad(c - a), y = toRad(d - b); const h = Math.sin(x / 2) ** 2 + Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(y / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
const geoCell = (lat, lon) => `${Math.round(lat * 2)}_${Math.round(lon * 2)}`;
function geoCells(lat, lon) { const a = Math.round(lat * 2), b = Math.round(lon * 2), r = []; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) r.push(`${a + i}_${b + j}`); return r; }
const kmTxt = d => d < 1 ? `${Math.round(d * 1000)} m` : `${nf(d, d < 10 ? 1 : 0)} km`;
function cacheGet(k, ttl) { try { const v = JSON.parse(localStorage.getItem(k)); return v && Date.now() - v.t < ttl ? v.d : null; } catch { return null; } }
function cacheSet(k, d) { try { localStorage.setItem(k, JSON.stringify({ t: Date.now(), d })); } catch {} }

// ---------- búsqueda ----------
function fetchT(url, opts = {}, ms = 15000) { const c = new AbortController(); const id = setTimeout(() => c.abort(), ms); return fetch(url, { ...opts, signal: c.signal }).finally(() => clearTimeout(id)); }
async function geocode(q) {
  const k = "pm-geo2:" + q.toLowerCase(); const c = cacheGet(k, 30 * 864e5); if (c) return c;
  let d = null;
  try { const r = await fetchT(`https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=es&countrycodes=es,pt,ad,fr,it&q=${encodeURIComponent(q)}`, { headers: { Accept: "application/json" } }, 10000);
    const j = await r.json(); if (j && j.length) d = { lat: +j[0].lat, lon: +j[0].lon, nombre: j[0].display_name.split(",")[0] }; } catch (e) { console.warn("nominatim", e); }
  if (!d) try { const r = await fetchT(`https://photon.komoot.io/api/?limit=1&lang=es&q=${encodeURIComponent(q)}`, {}, 10000); const j = await r.json(); const f = j.features && j.features[0];
    if (f) d = { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], nombre: f.properties.name || q }; } catch (e) { console.warn("photon", e); }
  if (d) cacheSet(k, d); return d;
}
async function overpass(lat, lon, radioKm) {
  const a = `(around:${Math.round(radioKm * 1000)},${lat.toFixed(5)},${lon.toFixed(5)})`;
  const q = `[out:json][timeout:12];(nwr["sport"~"padel|paddle",i]${a};nwr["leisure"~"sports_centre|pitch|sports_hall"]["name"~"p[aá]del",i]${a};);out center tags;`;
  // Pregunta a todos los servidores a la vez y se queda con el primero que conteste bien
  const one = u => fetchT(u, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded" } }, 14000)
    .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then(j => { if (!j || !j.elements) throw new Error("vacío"); return j.elements; });
  return Promise.any(OVERPASS.map(one));
}
// Junta pistas sueltas en clubes: un polideportivo con 6 pistas es un club, no 6 resultados.
function agrupar(els, lat0, lon0) {
  const pts = els.map(e => { const c = e.center || e; return { id: `${e.type[0]}${e.id}`, lat: c.lat, lon: c.lon, t: e.tags || {} }; }).filter(p => p.lat != null);
  const isPitch = p => p.t.leisure === "pitch" || (!p.t.name && !p.t.leisure);
  const anchors = pts.filter(p => !isPitch(p)), pitches = pts.filter(isPitch);
  const clubs = anchors.map(a => ({ id: "osm_" + a.id, nombre: a.t.name || "Club de pádel", lat: a.lat, lon: a.lon, tags: a.t, pistas: 0, cubiertas: 0 }));
  for (const p of pitches) {
    let best = null, bd = 1e9;
    for (const c of clubs) { const d = distKm(p.lat, p.lon, c.lat, c.lon); const lim = c.tags.leisure === "pitch" ? .12 : .3; if (d < lim && d < bd) { best = c; bd = d; } }
    if (!best) { best = { id: "osm_" + p.id, nombre: p.t.name || "", lat: p.lat, lon: p.lon, tags: { ...p.t }, pistas: 0, cubiertas: 0, suelta: true }; clubs.push(best); }
    best.pistas += Math.max(1, +(p.t.courts || p.t.pitches || 1) || 1);
    if (p.t.covered === "yes" || p.t.indoor === "yes" || p.t.building || p.t.leisure === "sports_hall") best.cubiertas++;
    if (!best.nombre && p.t.name) best.nombre = p.t.name;
    for (const k of ["addr:street", "addr:housenumber", "addr:city", "website", "contact:website", "phone", "contact:phone", "operator", "access", "fee"]) if (p.t[k] && !best.tags[k]) best.tags[k] = p.t[k];
  }
  clubs.forEach(c => { if (!c.cubiertas && (c.tags.leisure === "sports_hall" || c.tags.covered === "yes" || c.tags.indoor === "yes" || /indoor|cubiert/i.test(c.nombre))) c.cubiertas = Math.max(1, c.pistas || 1); });
  return clubs.map(c => {
    const t = c.tags; const calle = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", ");
    const muni = /ayuntamiento|municipal|concello|ajuntament|patronato|deportes/i.test(t.operator || "");
    if (!c.nombre) c.nombre = (muni ? "Pistas municipales" : t.operator || "Pistas de pádel") + (t["addr:street"] ? ` · ${t["addr:street"]}` : "");
    return { id: c.id, nombre: c.nombre, lat: c.lat, lon: c.lon, pistas: c.pistas || null, cubiertas: c.cubiertas, dir: [calle, t["addr:city"]].filter(Boolean).join(" · "),
      web: t.website || t["contact:website"] || "", tel: t.phone || t["contact:phone"] || "", publica: !!(t.access === "yes" || muni || (c.suelta && !t.name && t.access !== "private" && !t.operator)),
      dist: distKm(lat0, lon0, c.lat, c.lon), fuente: "osm" };
  });
}
async function clubsComunidad(lat, lon) {
  if (!socialOn()) return [];
  try { const s = await Promise.race([FS().collection("clubs").where("cell", "in", geoCells(lat, lon)).limit(200).get(), new Promise((_, r) => setTimeout(() => r(new Error("timeout")), 6000))]); return s.docs.map(d => ({ id: d.id, ...d.data(), fuente: "user" })); } catch (e) { console.warn(e); return []; }
}
let busqId = 0;
async function buscarPistas(opts) {
  const my = ++busqId;
  setTimeout(() => { if (busqId === my && pistas.busy) { pistas.busy = false; pistas.paso = ""; pistas.err = "El mapa está tardando demasiado. Prueba otra vez en un momento o mira los clubes en Google Maps."; if (view === "padel" && !sheetOpen) render(); } }, 25000);
  pistas.busy = true; pistas.err = ""; pistas.aviso = ""; pistas.sel = null; if (!pistas.paso || !/cerca/.test(pistas.paso)) pistas.paso = "Buscando pistas…"; if (view === "padel") render();
  try {
    let lugar = opts.lugar, lat = opts.lat, lon = opts.lon;
    if (lat == null) { const g = await geocode(lugar); if (!g) throw new Error("nolugar"); lat = g.lat; lon = g.lon; lugar = g.nombre; }
    Object.assign(pistas, { lugar, lat, lon }); try { localStorage.setItem("pm-pistas-lugar", JSON.stringify({ lugar, lat, lon })); } catch {}
    const k = `pm-pistas3:${lat.toFixed(2)},${lon.toFixed(2)},${pistas.radio}`;
    let osm = cacheGet(k, 7 * 864e5);
    const [ov, cm] = await Promise.allSettled([osm ? Promise.resolve(null) : overpass(lat, lon, pistas.radio), clubsComunidad(lat, lon)]);
    if (busqId !== my) return;
    if (!osm) { if (ov.status === "fulfilled") { osm = agrupar(ov.value, lat, lon); if (osm.length) cacheSet(k, osm); } else { console.warn("overpass", ov.reason); osm = []; pistas.aviso = "El mapa libre no ha respondido; te enseño lo que hay y tienes Google Maps abajo."; } }
    const us = (cm.status === "fulfilled" ? cm.value : []).map(c => ({ ...c, dist: distKm(lat, lon, c.lat, c.lon) })).filter(c => c.dist <= pistas.radio + 2);
    const all = [...us]; osm.forEach(o => { if (!us.some(u => distKm(u.lat, u.lon, o.lat, o.lon) < .08)) all.push({ ...o, dist: distKm(lat, lon, o.lat, o.lon) }); });
    pistas.clubs = all.sort((a, b) => a.dist - b.dist);
  } catch (e) { if (busqId !== my) return; console.warn(e); pistas.err = e.message === "nolugar" ? "No encuentro ese sitio. Prueba con el nombre de la ciudad." : "No se pudo cargar el mapa de pistas. Revisa tu conexión y vuelve a probar."; }
  pistas.busy = false; pistas.paso = ""; if (view === "padel" && !sheetOpen) render();
}
// Ubicación aproximada por internet (por si el GPS falla o tarda)
async function ubicacionIP() {
  for (const u of ["https://get.geojs.io/v1/ip/geo.json", "https://ipapi.co/json/"]) {
    try { const r = await fetchT(u, {}, 8000); const j = await r.json(); const lat = +j.latitude, lon = +j.longitude; if (lat && lon) return { lat, lon, ciudad: j.city || "" }; } catch (e) { console.warn("ip-geo", u, e); }
  }
  return null;
}
function cercaDeMi() {
  pistas.busy = true; pistas.err = ""; pistas.paso = "📍 Buscando tu ubicación… Si el móvil te pregunta, pulsa Permitir."; render();
  const fallo = async (code, msg) => {
    pistas.paso = "Probando con tu zona aproximada…"; render();
    const ip = await ubicacionIP();
    if (ip) { toast(code === 1 ? "Sin permiso de GPS: uso tu zona aproximada" : "Uso tu zona aproximada"); return buscarPistas(ip.ciudad ? { lugar: ip.ciudad, lat: ip.lat, lon: ip.lon } : { lugar: "Tu ubicación", lat: ip.lat, lon: ip.lon }); }
    pistas.busy = false;
    pistas.err = code === 1
      ? "La app no tiene permiso de ubicación. En el iPhone: Ajustes → Privacidad y seguridad → Localización → Sitios web de Safari → «Al usarse la app». En Android: mantén pulsado el icono → Información de la app → Permisos → Ubicación. O escribe tu ciudad arriba."
      : "No he podido saber dónde estás. Escribe tu ciudad arriba.";
    pistas.err += ` (código ${code ?? "?"}${msg ? ": " + msg : ""}${window.isSecureContext ? "" : ", sin https"})`;
    render();
  };
  if (!navigator.geolocation) return fallo(2);
  let done = false;
  const ok = p => { if (done) return; done = true; pistas.paso = "Buscando pistas cerca de ti…"; buscarPistas({ lugar: "Tu ubicación", lat: p.coords.latitude, lon: p.coords.longitude }); };
  const ko = e => { if (done) return; if (e && e.code === 1) { done = true; return fallo(1); }
    // Reintenta con GPS de alta precisión antes de rendirse
    pistas.paso = "📍 Afinando con el GPS…"; render();
    navigator.geolocation.getCurrentPosition(ok, e2 => { if (done) return; done = true; fallo(e2 && e2.code, e2 && e2.message); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }); };
  navigator.geolocation.getCurrentPosition(ok, ko, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
  setTimeout(() => { if (!done) { done = true; fallo(3); } }, 28000); // por si el móvil nunca responde
}

// ---------- vista ----------
function pistasHTML() {
  const myClub = (state.perfil.padel || {}).clubId;
  const list = pistas.clubs.filter(c => pistas.filtro === "todos" || (pistas.filtro === "cubiertas" ? c.cubiertas > 0 : !c.cubiertas || c.cubiertas < (c.pistas || 1)));
  const res = pistas.busy ? `<div class="card empty"><p>${esc(pistas.paso || "Buscando pistas…")}</p></div>`
    : pistas.err ? `<div class="card empty"><p>${esc(pistas.err)}</p></div><a class="btn block" href="https://www.google.com/maps/search/${encodeURIComponent("pistas de pádel " + ($("#piQ") && $("#piQ").value || ""))}" target="_blank" rel="noopener">${svg("search")}Buscar en Google Maps</a>`
    : !pistas.lugar ? `<div class="card empty">${svg("gps")}<p>Escribe tu ciudad o pulsa <b>Cerca de mí</b> para ver los clubes y pistas de pádel.</p></div>`
    : `<div class="row" style="justify-content:space-between;align-items:center;margin:4px 2px 8px"><div class="small"><b>${list.length}</b> <span class="mute">sitios en ${esc(pistas.lugar)} (${pistas.radio} km)</span></div></div>
      ${pistas.aviso ? `<p class="tiny" style="color:#facc15;margin:0 2px 8px">${esc(pistas.aviso)}</p>` : ""}<div class="seg" id="piF" style="margin-bottom:10px">${[["todos", "Todos"], ["cubiertas", "Cubiertas"], ["aire", "Al aire libre"]].map(([k, n]) => `<button data-f="${k}" class="${pistas.filtro === k ? "on" : ""}">${n}</button>`).join("")}</div>
      <div id="piMap" style="height:260px;border-radius:18px;overflow:hidden;margin-bottom:12px;border:1px solid var(--line2)"></div>
      ${list.length ? `<div class="card" style="padding:4px 14px">${list.slice(0, 60).map(c => `<button class="item" data-club="${c.id}"><span style="font-size:20px;width:28px;text-align:center">${c.id === myClub ? "⭐" : c.cubiertas ? "🏟️" : "🎾"}</span><div style="flex:1;min-width:0"><div style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.nombre)}</div><div class="tiny mute">${[c.pistas ? `${c.pistas} pista${c.pistas > 1 ? "s" : ""}` : null, c.cubiertas ? (c.cubiertas >= (c.pistas || 1) ? "cubiertas" : "cubiertas y exteriores") : c.pistas ? "al aire libre" : null, c.fuente === "user" ? "añadido por la comunidad" : null].filter(Boolean).join(" · ") || esc(c.dir || "Pádel")}</div></div><span class="small mute" style="white-space:nowrap">${kmTxt(c.dist)}</span></button>`).join("")}</div>`
        : `<div class="card empty"><p>${pistas.clubs.length ? "No hay pistas con ese filtro." : "El mapa libre aún no tiene clubes registrados aquí."}</p></div>`}
      <a class="btn block" href="${`https://www.google.com/maps/search/${encodeURIComponent("pistas de pádel " + (pistas.lugar && pistas.lugar !== "Tu ubicación" ? pistas.lugar : ""))}${pistas.lugar === "Tu ubicación" ? `/@${pistas.lat},${pistas.lon},13z` : ""}`}" target="_blank" rel="noopener" style="margin-top:4px">${svg("search")}Ver todos los clubes en Google Maps</a>`;
  return `<div class="row" style="gap:8px;margin-bottom:10px"><label class="field" style="margin:0;flex:1"><input id="piQ" placeholder="Ciudad o barrio (ej. Zaragoza)" value="${esc(pistas.lugar && pistas.lugar !== "Tu ubicación" ? pistas.lugar : "")}" style="margin:0" enterkeyhint="search"></label><button class="btn" id="piGo" style="flex:0 0 auto">${svg("search")}</button></div>
    <div class="row" style="gap:8px;margin-bottom:12px;align-items:center"><button class="btn sm" id="piMe" style="flex:0 0 auto;white-space:nowrap">${svg("gps")}Cerca de mí</button><div class="seg" id="piR" style="flex:1;min-width:0">${[5, 15, 30].map(r => `<button data-r="${r}" class="${pistas.radio === r ? "on" : ""}">${r} km</button>`).join("")}</div></div>
    ${res}
    ${pistas.lugar && !pistas.busy ? `<button class="item" id="piAdd" style="margin-top:6px"><span style="font-size:20px;width:28px;text-align:center">➕</span><div style="flex:1"><div style="font-weight:700">¿Falta tu club?</div><div class="tiny mute">Añádelo para que lo vea todo el mundo</div></div>${svg("chev", "chev")}</button>` : ""}
    <p class="tiny mute" style="text-align:center;margin:12px 0 4px">Datos de mapa © colaboradores de OpenStreetMap</p>`;
}
function wirePistas(root) {
  const go = () => { const q = $("#piQ", root).value.trim(); if (q) buscarPistas({ lugar: q }); };
  $("#piGo", root).onclick = go; $("#piQ", root).onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); e.target.blur(); go(); } };
  $("#piMe", root).onclick = cercaDeMi;
  $$("#piR [data-r]", root).forEach(b => b.onclick = () => { pistas.radio = +b.dataset.r; if (pistas.lat != null) buscarPistas({ lugar: pistas.lugar, lat: pistas.lat, lon: pistas.lon }); else render(); });
  $$("#piF [data-f]", root).forEach(b => b.onclick = () => { pistas.filtro = b.dataset.f; render(); });
  $$("[data-club]", root).forEach(b => b.onclick = () => openClub(b.dataset.club));
  const ad = $("#piAdd", root); if (ad) ad.onclick = () => openAddClub();
  if (!pistas.lugar && !pistas.busy && !pistas.err) {
    let last = null; try { last = JSON.parse(localStorage.getItem("pm-pistas-lugar")); } catch {}
    const ciudad = social && social.me && social.me.ciudad;
    if (last) buscarPistas(last); else if (ciudad) buscarPistas({ lugar: ciudad });
  }
  const el = $("#piMap", root); if (el && window.L) setTimeout(() => drawPistasMap(el), 30);
}
function drawPistasMap(el) {
  if (pistasMap) { try { pistasMap.remove(); } catch {} pistasMap = null; }
  if (!document.body.contains(el)) return;
  const m = L.map(el, { zoomControl: false, attributionControl: false }); pistasMap = m;
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19, subdomains: "abcd" }).addTo(m);
  const myClub = (state.perfil.padel || {}).clubId;
  const list = pistas.clubs.filter(c => pistas.filtro === "todos" || (pistas.filtro === "cubiertas" ? c.cubiertas > 0 : !c.cubiertas || c.cubiertas < (c.pistas || 1)));
  const pts = [];
  list.forEach(c => { pts.push([c.lat, c.lon]);
    L.circleMarker([c.lat, c.lon], { radius: c.id === myClub ? 10 : 7, color: "#0a0d11", weight: 2, fillColor: c.id === myClub ? "#facc15" : c.fuente === "user" ? "#38bdf8" : "#d4ff3a", fillOpacity: 1 }).addTo(m).on("click", () => openClub(c.id)); });
  if (pistas.lugar === "Tu ubicación") L.circleMarker([pistas.lat, pistas.lon], { radius: 6, color: "#fff", weight: 2, fillColor: "#38bdf8", fillOpacity: 1 }).addTo(m);
  if (pts.length) m.fitBounds(L.latLngBounds(pts).pad(.15), { maxZoom: 15 }); else m.setView([pistas.lat, pistas.lon], 12);
}

// ---------- ficha del club ----------
async function openClub(id) {
  const c = pistas.clubs.find(x => x.id === id); if (!c) return;
  const P = state.perfil.padel || {}, mio = P.clubId === id;
  const maps = `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lon}`;
  const web = c.web ? (/^https?:/.test(c.web) ? c.web : "https://" + c.web) : `https://www.google.com/search?q=${encodeURIComponent(c.nombre + " " + (c.dir || pistas.lugar || "") + " reservar pista pádel")}`;
  openSheet(esc(c.nombre), `
    <div class="small mute" style="margin:-6px 0 12px">${esc(c.dir || "")}${c.dir ? " · " : ""}a ${kmTxt(c.dist)}</div>
    <div class="grid3" style="margin-bottom:12px"><div class="stat"><div class="k">Pistas</div><div class="v num">${c.pistas || "?"}</div></div><div class="stat"><div class="k">Cubiertas</div><div class="v num">${c.cubiertas ? (c.cubiertas >= (c.pistas || 0) ? "Sí" : c.cubiertas) : c.pistas ? "No" : "?"}</div></div><div class="stat"><div class="k">Aire libre</div><div class="v num">${c.pistas ? (c.cubiertas >= c.pistas ? "No" : c.cubiertas ? c.pistas - c.cubiertas : "Sí") : "?"}</div></div></div>
    <div id="clGente" class="card" style="margin-bottom:12px"><h3>${svg("users")}Gente de Pádel+ aquí</h3><p class="small mute" style="margin-top:6px">${socialOn() ? "Cargando…" : "Crea tu perfil en Comunidad para ver quién juega aquí."}</p></div>
    <div class="row" style="gap:8px"><a class="btn" href="${maps}" target="_blank" rel="noopener" style="flex:1">${svg("route")}Cómo llegar</a><a class="btn pri" href="${web}" target="_blank" rel="noopener" style="flex:1">${svg("calendar")}${c.web ? "Web / reservar" : "Buscar reservas"}</a></div>
    ${c.tel ? `<a class="btn block" href="tel:${esc(c.tel.replace(/\s/g, ""))}" style="margin-top:8px">📞 ${esc(c.tel)}</a>` : ""}
    <button class="btn block" id="clMio" style="margin-top:8px">${mio ? "⭐ Es mi club" : "Marcar como mi club"}</button>
    <p class="tiny mute" style="margin-top:10px">${c.fuente === "user" ? "Club añadido por la comunidad de Pádel+." : "Datos de OpenStreetMap. Si algo está mal o falta, añade el club con sus datos."}</p>`, async s => {
    $("#clMio", s).onclick = async () => {
      const nuevo = mio ? null : id;
      savePerfil({ padel: { ...P, clubId: nuevo, club: nuevo ? c.nombre : P.club } });
      if (socialOn()) { try { await FS().collection("perfiles").doc(me.uid).update({ clubId: nuevo, clubNombre: nuevo ? c.nombre : null }); social.me.clubId = nuevo; } catch (e) { console.warn(e); } }
      toast(nuevo ? `${c.nombre} es tu club ⭐` : "Club quitado"); closeSheet();
    };
    if (!socialOn()) return;
    try {
      const q = await FS().collection("perfiles").where("clubId", "==", id).limit(60).get(); const g = q.docs.map(d => d.data());
      const box = $("#clGente", s); if (!box) return;
      const lv = g.map(x => x.nivelPadel).filter(Boolean); const media = lv.length ? lv.reduce((a, b) => a + b, 0) / lv.length : null;
      box.innerHTML = `<h3>${svg("users")}Gente de Pádel+ aquí</h3>` + (g.length
        ? `<p class="small" style="margin:6px 0 10px"><b>${g.length}</b> jugador${g.length > 1 ? "es" : ""}${media ? ` · nivel medio <b style="color:var(--volt)">${nf(media, 1)}</b>` : ""}</p><div style="display:flex;gap:8px;flex-wrap:wrap">${g.slice(0, 12).map(p => `<button data-user="${p.uid}" title="${esc(p.nombre)}">${avatar(p, 38)}</button>`).join("")}</div>`
        : `<p class="small mute" style="margin-top:6px">Aún nadie lo ha marcado como su club. ¡Sé el primero!</p>`);
      $$("[data-user]", box).forEach(b => b.onclick = () => openUser(b.dataset.user));
    } catch (e) { console.warn(e); }
  });
}

// ---------- añadir club ----------
function openAddClub() {
  if (!socialOn()) { toast("Crea tu perfil en Comunidad para añadir clubes"); return; }
  const lat0 = pistasMap ? pistasMap.getCenter().lat : pistas.lat, lon0 = pistasMap ? pistasMap.getCenter().lng : pistas.lon;
  let cub = "no";
  openSheet("Añadir club", `<p class="small mute" style="margin:-6px 0 10px">Mueve el mapa hasta que el punto amarillo quede encima del club.</p>
    <div style="position:relative;height:220px;border-radius:16px;overflow:hidden;margin-bottom:12px;border:1px solid var(--line2)"><div id="acMap" style="position:absolute;inset:0"></div>
      <div style="position:absolute;left:50%;top:50%;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:#facc15;border:3px solid #0a0d11;z-index:500;pointer-events:none"></div></div>
    <button class="btn sm" id="acMe" style="margin-bottom:12px">${svg("gps")}Estoy en el club</button>
    <label class="field">Nombre del club<input id="acN" maxlength="60" placeholder="Ej. Club Pádel Zaragoza"></label>
    <div class="row"><label class="field">Nº de pistas<input id="acP" type="number" inputmode="numeric" min="1" max="40" placeholder="6"></label>
      <div class="field">Cubiertas<div class="seg" id="acC"><button data-v="no" class="on">No</button><button data-v="parte">Algunas</button><button data-v="si">Sí</button></div></div></div>
    <label class="field">Web o Playtomic (opcional)<input id="acW" maxlength="200" placeholder="https://…" autocapitalize="off"></label>
    <label class="field">Teléfono (opcional)<input id="acT" maxlength="20" inputmode="tel"></label>
    <div class="err" id="acE"></div><button class="btn pri block" id="acOk">Añadir club</button>`, s => {
    let m = null;
    if (window.L) setTimeout(() => { m = L.map($("#acMap", s), { zoomControl: false, attributionControl: false }).setView([lat0, lon0], 15); L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19, subdomains: "abcd" }).addTo(m); }, 60);
    $("#acMe", s).onclick = () => navigator.geolocation && navigator.geolocation.getCurrentPosition(p => m && m.setView([p.coords.latitude, p.coords.longitude], 17), () => toast("Sin permiso de ubicación"));
    $$("#acC [data-v]", s).forEach(b => b.onclick = () => { cub = b.dataset.v; $$("#acC [data-v]", s).forEach(x => x.classList.toggle("on", x === b)); });
    $("#acOk", s).onclick = async () => {
      const nombre = $("#acN", s).value.trim(), np = Math.max(0, Math.min(40, +$("#acP", s).value || 0));
      if (nombre.length < 3) { $("#acE", s).textContent = "Pon el nombre del club."; return; }
      const ce = m ? m.getCenter() : { lat: lat0, lng: lon0 };
      const d = { nombre, lat: +ce.lat.toFixed(6), lon: +ce.lng.toFixed(6), cell: geoCell(ce.lat, ce.lng), pistas: np || null, cubiertas: cub === "si" ? (np || 1) : cub === "parte" ? 1 : 0,
        web: $("#acW", s).value.trim().slice(0, 200), tel: $("#acT", s).value.trim().slice(0, 20), dir: pistas.lugar && pistas.lugar !== "Tu ubicación" ? pistas.lugar : "", by: me.uid, t: Date.now() };
      const b = $("#acOk", s); b.disabled = true;
      try { const ref = await FS().collection("clubs").add(d); const c = { id: ref.id, ...d, fuente: "user", dist: distKm(pistas.lat, pistas.lon, d.lat, d.lon) };
        pistas.clubs = [c, ...pistas.clubs].sort((a, b) => a.dist - b.dist); closeSheet(); toast("¡Club añadido! Gracias 🙌"); }
      catch (e) { console.warn(e); $("#acE", s).textContent = "No se pudo guardar. Revisa tu conexión."; b.disabled = false; }
    };
  });
}
