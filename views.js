// ===== Ritmo+ · vistas: Inicio, Entrenos, Progreso, Perfil, detalle =====

function weekStats(from) {
  const to = addDays(from, 7); const acts = actList().filter(a => { const d = new Date(a.fecha); return d >= from && d < to; });
  const perDay = Array(7).fill(0); acts.forEach(a => { perDay[(new Date(a.fecha).getDay() + 6) % 7] += (a.dur || 0) / 60; });
  return { acts, min: acts.reduce((s, a) => s + (a.dur || 0), 0) / 60, dist: acts.reduce((s, a) => s + (a.dist || 0), 0), kcal: acts.reduce((s, a) => s + (a.kcal || 0), 0), perDay };
}
function streak() {
  // Semanas seguidas con al menos un entreno (como Strava).
  let n = 0, w = monday(new Date());
  if (!weekStats(w).acts.length) w = addDays(w, -7);
  while (weekStats(w).acts.length) { n++; w = addDays(w, -7); if (n > 520) break; }
  return n;
}
function ringSVG(pct, color = "var(--volt)", size = 112, sw = 11) {
  const r = (size - sw) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct));
  return `<svg viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="${sw}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" style="transition:stroke-dashoffset 1s ease"/></svg>`;
}
function actCard(a) {
  const s = sportOf(a.deporte); const gps = a.dist > 0;
  const mets = gps
    ? [["Distancia", `${fmtKm(a.dist)} <small class="mute">km</small>`], [a.deporte === "bici" ? "Velocidad" : "Ritmo", a.deporte === "bici" ? `${fmtSpeed(a.dist, a.dur)} <small class="mute">km/h</small>` : `${fmtPace(a.dur / km(a.dist))} <small class="mute">/km</small>`], ["Tiempo", fmtDur(a.dur)]]
    : [["Tiempo", fmtDur(a.dur, true)], ["Calorías", nf(a.kcal || 0)], a.resultado ? ["Resultado", esc(a.resultado)] : a.ejercicios ? ["Ejercicios", a.ejercicios.length] : ["Sensación", "★".repeat(a.sensacion || 0) || "–"]];
  const badge = a.ganado === true ? `<span class="badge">Victoria</span>` : a.ganado === false ? `<span class="badge l">Derrota</span>` : (a.fuente === "fit" || a.fuente === "gpx") ? `<span class="badge" style="background:rgba(56,189,248,.12);color:var(--sky)">${svg("watch")}</span>` : "";
  return `<button class="act" data-act="${a.id}"><div class="hd">${sportBadge(a.deporte)}<div style="min-width:0"><div class="t">${esc(a.titulo || s.n)}</div><div class="s">${relDate(a.fecha)} · ${s.n}</div></div>${badge}</div>
    <div class="mets">${mets.map(([k, v]) => `<div>${k}<b>${v}</b></div>`).join("")}</div>
    ${a.trk && a.trk.length > 1 ? `<div class="mini">${routeSVG(a.trk, 600, 200, s.c)}</div>` : ""}</button>`;
}
function wireActs(root = document) { $$("[data-act]", root).forEach(b => b.onclick = () => openAct(b.dataset.act)); }

// ---------- INICIO ----------
function vInicio() {
  const meta = +state.perfil.metaMin || 150, w = weekStats(monday(new Date())), pct = w.min / meta;
  const h = new Date().getHours(), saludo = h < 13 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";
  const nombre = (me.name || state.perfil.nombre || "").split(" ")[0];
  const st = streak(), today = (new Date().getDay() + 6) % 7, maxD = Math.max(30, ...w.perDay);
  const n = nutriToday(); const acts = actList();
  return `
  <p class="mute" style="margin:-6px 2px 14px">${saludo}${nombre ? ", " + esc(nombre) : ""} 👋</p>
  <div class="hero">
    <div class="ringwrap">
      <div class="ring">${ringSVG(pct)}<div class="in"><div><b class="num">${Math.round(pct * 100)}%</b><br><span>meta semanal</span></div></div></div>
      <div><div class="lbl">Esta semana</div><div class="big num" style="white-space:nowrap">${Math.round(w.min)}<small>/${meta} min</small></div>
        <div class="small mute">${w.acts.length} entreno${w.acts.length === 1 ? "" : "s"}${w.dist ? ` · ${fmtKm(w.dist)} km` : ""}</div></div>
    </div>
    <div class="chips"><span class="chip volt">${svg("flame")}${st} semana${st === 1 ? "" : "s"} de racha</span><span class="chip hot">${svg("bolt")}${nf(w.kcal)} kcal</span></div>
    <div class="week">${DIAS.map((d, i) => `<div class="${i === today ? "today" : ""}">${d}<i><b style="height:${Math.min(100, w.perDay[i] / maxD * 100)}%"></b></i></div>`).join("")}</div>
  </div>
  <div class="grid3" style="margin-bottom:14px">
    <button class="stat" id="qRec" style="text-align:left"><div class="k" style="color:var(--volt)">${svg("gps")}Grabar</div><div class="small" style="margin-top:6px;font-weight:600">GPS en vivo</div></button>
    <button class="stat" id="qMan" style="text-align:left"><div class="k" style="color:var(--hot)">${svg("edit")}Añadir</div><div class="small" style="margin-top:6px;font-weight:600">Pádel, gym…</div></button>
    <button class="stat" id="qImp" style="text-align:left"><div class="k" style="color:var(--sky)">${svg("watch")}Reloj</div><div class="small" style="margin-top:6px;font-weight:600">Importar</div></button>
  </div>
  <div class="card" id="nutriMini" style="cursor:pointer">
    <h3><span style="display:flex;align-items:center;gap:8px">${svg("food")}Nutrición de hoy</span>${svg("chev")}</h3>
    ${n.target ? `<div class="kring"><div class="ring" style="width:84px;height:84px">${ringSVG(n.kcal / n.target, "var(--hot)", 84, 9)}<div class="in"><div><b class="num" style="font-size:22px">${nf(n.kcal)}</b><br><span>kcal</span></div></div></div>
      <div style="flex:1" class="bars">${macroBar("Proteína", n.p, n.tp, "#d4ff3a")}${macroBar("Carbohidratos", n.c, n.tc, "#38bdf8")}${macroBar("Grasa", n.g, n.tg, "#ff6a3d")}</div></div>
      <p class="small mute" style="margin-top:10px">Te quedan <b style="color:var(--ink)">${nf(Math.max(0, n.target - n.kcal))} kcal</b> de ${nf(n.target)}${n.burn ? ` · has quemado ${nf(n.burn)} kcal entrenando` : ""}</p>`
      : `<p class="mute small" style="line-height:1.5">Calcula tus calorías y macros y te hago un plan de comidas semanal con lista de la compra.</p><button class="btn pri sm" style="margin-top:12px">Crear mi plan</button>`}
  </div>
  ${shoeAlert()}
  <button class="card" id="qShoe" style="display:flex;align-items:center;gap:12px;width:100%;text-align:left"><div class="sp" style="background:var(--volt-soft);color:var(--volt)">${svg("run")}</div><div style="flex:1"><div style="font-weight:700">¿Qué zapatilla me va?</div><div class="small mute">Recomendador con ${SHOES.length} modelos y opiniones de la comunidad</div></div>${svg("chev", "chev")}</button>
  <div class="sec">Últimos entrenos ${acts.length ? `<button id="verTodos">Ver todos</button>` : ""}</div>
  ${acts.length ? acts.slice(0, 4).map(actCard).join("") : `<div class="card empty">${svg("run")}<p>Aún no tienes entrenos.<br>Toca el <b style="color:var(--volt)">+</b> para grabar el primero.</p></div>`}`;
}
function shoeAlert() { const z = (state.perfil.zapas || []).filter(z => z.activa !== false).find(z => zapaKm(z) > ZAPA_VIDA * .9); return z ? `<div class="hint" style="background:var(--hot-soft);margin-bottom:14px">${svg("info")}<span style="color:var(--ink)">Tus <b>${esc(z.apodo || z.nombre)}</b> llevan ${nf(zapaKm(z))} km. Es buen momento para cambiarlas.</span></div>` : ""; }
function macroBar(n, v, t, c) { return `<div class="b"><div><span>${n}</span><span class="mute">${nf(v)} / ${nf(t)} g</span></div><i><b style="width:${Math.min(100, t ? v / t * 100 : 0)}%;background:${c}"></b></i></div>`; }
WIRE.inicio = () => {
  wireActs(); $("#qRec").onclick = openStart; $("#qMan").onclick = () => openManual(); $("#qImp").onclick = openImport;
  $("#nutriMini").onclick = () => setView("nutricion"); $("#qShoe").onclick = () => { social.tab = "zapas"; setView("comunidad"); }; const v = $("#verTodos"); if (v) v.onclick = () => setView("entrenos");
};

// ---------- ENTRENOS ----------
let entFilter = "todos";
function vEntrenos() {
  const all = actList(); const used = [...new Set(all.map(a => a.deporte))];
  const acts = entFilter === "todos" ? all : all.filter(a => a.deporte === entFilter);
  let html = `<div class="row" style="margin-bottom:14px"><button class="btn sm" id="eMan">${svg("plus")}Añadir</button><button class="btn sm" id="eImp">${svg("watch")}Importar del reloj</button></div>`;
  if (used.length > 1) html += `<div class="seg">${[["todos", "Todos"], ...used.map(u => [u, sportOf(u).n])].map(([k, n]) => `<button data-f="${k}" class="${entFilter === k ? "on" : ""}">${n}</button>`).join("")}</div>`;
  if (!acts.length) return html + `<div class="card empty">${svg("list")}<p>No hay entrenos todavía.</p></div>`;
  let lastM = "";
  for (const a of acts) {
    const d = new Date(a.fecha), m = `${MESES[d.getMonth()]} ${d.getFullYear()}`;
    if (m !== lastM) { const ms = acts.filter(x => { const y = new Date(x.fecha); return y.getMonth() === d.getMonth() && y.getFullYear() === d.getFullYear(); });
      html += `<div class="sec"><span>${m}</span><span style="text-transform:none;letter-spacing:0;font-weight:500">${ms.length} · ${fmtDur(ms.reduce((s, x) => s + (x.dur || 0), 0), true)}</span></div>`; lastM = m; }
    html += actCard(a);
  }
  return html;
}
WIRE.entrenos = () => { wireActs(); $("#eMan").onclick = () => openManual(); $("#eImp").onclick = openImport; $$("[data-f]").forEach(b => b.onclick = () => { entFilter = b.dataset.f; render(); }); };

// ---------- DETALLE ----------
let detMap = null;
function openAct(id) {
  const a = state.act[id]; if (!a) return; const s = sportOf(a.deporte); const gps = a.trk && a.trk.length > 1;
  const stats = [];
  if (a.dist) stats.push(["route", "Distancia", `${fmtKm(a.dist)}<small>km</small>`]);
  stats.push(["clock", "Tiempo", fmtDur(a.dur)]);
  if (a.dist && a.deporte !== "bici") stats.push(["pace", "Ritmo medio", `${fmtPace(a.dur / km(a.dist))}<small>/km</small>`]);
  if (a.dist && a.deporte === "bici") stats.push(["pace", "Velocidad", `${fmtSpeed(a.dist, a.dur)}<small>km/h</small>`]);
  if (a.desnivel) stats.push(["mountain", "Desnivel +", `${nf(a.desnivel)}<small>m</small>`]);
  stats.push(["flame", "Calorías", `${nf(a.kcal || 0)}<small>kcal</small>`]);
  if (a.fcMedia) stats.push(["heart", "FC media", `${nf(a.fcMedia)}<small>ppm</small>`]);
  if (a.fcMax) stats.push(["heart", "FC máx.", `${nf(a.fcMax)}<small>ppm</small>`]);
  const sp = gps && a.dist >= 900 ? splitsOf(a.trk) : [];
  const best = sp.length ? Math.min(...sp.map(x => x.t)) : 0, worst = sp.length ? Math.max(...sp.map(x => x.t)) : 0;
  const bests = a.bests || {}; const pr = Object.entries(bests).filter(([D, t]) => isPR(a, +D, t));
  let html = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">${sportBadge(a.deporte)}<div><div class="small mute">${relDate(a.fecha)} · ${s.n}${a.fuente === "fit" || a.fuente === "gpx" ? " · desde tu reloj" : ""}</div></div></div>`;
  if (gps) html += `<div id="detMap"></div>`;
  if (pr.length) html += `<div class="hint" style="background:var(--volt-soft);color:var(--volt)">${svg("trophy")}<span><b>¡Récord personal!</b> ${pr.map(([D, t]) => `${prName(+D)} en ${fmtDur(t)}`).join(" · ")}</span></div>`;
  html += `<div class="grid2">${stats.map(([i, k, v]) => `<div class="stat"><div class="k">${svg(i)}${k}</div><div class="v num">${v}</div></div>`).join("")}</div>`;
  if (a.resultado || a.companero || a.rivales) html += `<div class="card" style="margin-top:14px"><h3>${svg("trophy")}Partido</h3>${a.resultado ? `<div class="num" style="font-size:34px">${esc(a.resultado)}</div>` : ""}${a.ganado != null ? `<span class="badge ${a.ganado ? "" : "l"}" style="margin:0">${a.ganado ? "Victoria" : "Derrota"}</span>` : ""}${a.companero ? `<p class="small mute" style="margin-top:8px">Con <b style="color:var(--ink)">${esc(a.companero)}</b>${a.rivales ? ` contra ${esc(a.rivales)}` : ""}</p>` : a.rivales ? `<p class="small mute" style="margin-top:8px">Contra ${esc(a.rivales)}</p>` : ""}</div>`;
  if (a.ejercicios && a.ejercicios.length) html += `<div class="card" style="margin-top:14px"><h3>${svg("gym")}Ejercicios <span class="small mute">${nf(gymVolume(a))} kg movidos</span></h3>${a.ejercicios.map(e => `<div class="item" style="display:block"><b>${esc(e.n)}</b><div class="small mute" style="margin-top:4px">${e.series.map(x => `${x.r || 0}×${x.kg || 0} kg`).join(" · ")}</div></div>`).join("")}</div>`;
  if (sp.length > 1) html += `<div class="card" style="margin-top:14px"><h3>${svg("pace")}Parciales</h3><table class="splits">${sp.map(x => `<tr><td class="mute">${x.part ? (x.part / 1000).toFixed(2) : x.km}</td><td class="num" style="font-size:17px">${fmtPace(x.t)}</td><td class="mute small">${x.up ? "+" + Math.round(x.up) + " m" : ""}</td><td><i style="width:${30 + 70 * (worst === best ? 1 : (worst - x.t) / (worst - best))}%;${x.t === best ? "" : "opacity:.55"}"></i></td></tr>`).join("")}</table></div>`;
  if (gps) { const ch = streamCharts(a); if (ch) html += ch; }
  if (a.sensacion) html += `<p class="small mute" style="margin-top:12px">Sensación: <span style="color:var(--volt)">${"★".repeat(a.sensacion)}</span>${"☆".repeat(5 - a.sensacion)}</p>`;
  if (a.notas) html += `<div class="hint">${svg("edit")}<span style="color:var(--ink)">${esc(a.notas)}</span></div>`;
  html += `<div class="row" style="margin-top:16px"><button class="btn" id="aEdit">${svg("edit")}Editar</button><button class="btn danger" id="aDel">${svg("trash")}Borrar</button></div>`;
  openSheet(esc(a.titulo || s.n), html, sh => {
    $("#aDel", sh).onclick = () => confirmSheet("¿Borrar entreno?", "Se borrará para siempre.", "Borrar", () => { delItem("act", a.id); closeSheet(); toast("Entreno borrado"); });
    $("#aEdit", sh).onclick = () => openFinish(a, true);
    if (gps) setTimeout(() => drawMap("detMap", a.trk, s.c), 60);
  });
}
function drawMap(elId, trk, color, live = false) {
  if (!window.L) { $("#" + elId).innerHTML = routeSVG(trk, 600, 280, color); return null; }
  const m = L.map(elId, { zoomControl: false, attributionControl: true, dragging: true });
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19, subdomains: "abcd", attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>' }).addTo(m);
  if (trk && trk.length) {
    const ll = trk.map(p => [p[0], p[1]]);
    L.polyline(ll, { color, weight: 10, opacity: .25 }).addTo(m); L.polyline(ll, { color, weight: 4 }).addTo(m);
    if (!live) { L.circleMarker(ll[0], { radius: 7, color: "#0a0d11", weight: 3, fillColor: "#4ade80", fillOpacity: 1 }).addTo(m); L.circleMarker(ll[ll.length - 1], { radius: 7, color: "#0a0d11", weight: 3, fillColor: "#ff6a3d", fillOpacity: 1 }).addTo(m); }
    m.fitBounds(L.latLngBounds(ll), { padding: [28, 28] });
  }
  return m;
}
function lineChart(vals, color, { invert = false, unit = "", fmt = v => nf(v) } = {}) {
  const v = vals.filter(x => x != null && isFinite(x)); if (v.length < 5) return "";
  const W = 600, H = 150, mn = Math.min(...v), mx = Math.max(...v), rg = mx - mn || 1;
  const pts = vals.map((x, i) => x == null ? null : [i / (vals.length - 1) * W, invert ? 12 + (x - mn) / rg * (H - 30) : H - 12 - (x - mn) / rg * (H - 30)]).filter(Boolean);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");
  return `<svg viewBox="0 0 ${W} ${H}"><defs><linearGradient id="lg${color.slice(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${d}L${W} ${H}L0 ${H}Z" fill="url(#lg${color.slice(1)})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/></svg>
  <div class="row small mute" style="justify-content:space-between;margin-top:4px"><span>${invert ? "más lento" : "mín."} ${fmt(invert ? mx : mn)}${unit}</span><span>${invert ? "más rápido" : "máx."} ${fmt(invert ? mn : mx)}${unit}</span></div>`;
}
function streamCharts(a) {
  const t = a.trk, N = 120, step = Math.max(1, Math.floor(t.length / N)); const pace = [], ele = [], hr = [];
  for (let i = step; i < t.length; i += step) {
    const p0 = t[i - step], p1 = t[i]; const d = haversine(p0, p1), dt = p1[3] - p0[3];
    const spk = d > 2 ? dt / (d / 1000) : null; pace.push(spk && spk < 1200 ? (a.deporte === "bici" ? d / dt * 3.6 : spk) : null);
    ele.push(p1[2]); hr.push(p1[4] || null);
  }
  let out = "";
  const pc = lineChart(pace, "#d4ff3a", a.deporte === "bici" ? { unit: " km/h", fmt: v => nf(v, 1) } : { invert: true, fmt: fmtPace, unit: "/km" });
  if (pc) out += `<div class="card chartbox" style="margin-top:14px"><h3>${svg("pace")}${a.deporte === "bici" ? "Velocidad" : "Ritmo"}</h3>${pc}</div>`;
  const ec = lineChart(ele, "#38bdf8", { unit: " m" }); if (ec) out += `<div class="card chartbox"><h3>${svg("mountain")}Altitud</h3>${ec}</div>`;
  const hc = lineChart(hr, "#f87171", { unit: " ppm" }); if (hc) out += `<div class="card chartbox"><h3>${svg("heart")}Frecuencia cardiaca</h3>${hc}</div>`;
  return out;
}
const prName = D => ({ 1000: "1 km", 5000: "5 km", 10000: "10 km", 21097: "Media maratón" })[D];
function isPR(a, D, t) { for (const b of Object.values(state.act)) { if (b.id === a.id || b.deporte !== a.deporte || !b.bests || !b.bests[D]) continue; if (b.bests[D] < t || (b.bests[D] === t && b.fecha < a.fecha)) return false; } return true; }
function gymVolume(a) { return (a.ejercicios || []).reduce((s, e) => s + e.series.reduce((t, x) => t + (+x.r || 0) * (+x.kg || 0), 0), 0); }

// ---------- PROGRESO ----------
function vProgreso() {
  const acts = actList(); const pesos = Object.values(state.peso).sort((a, b) => a.fecha.localeCompare(b.fecha));
  // Volumen semanal (12 semanas)
  const w0 = monday(new Date()); const weeks = []; for (let i = 11; i >= 0; i--) { const ws = weekStats(addDays(w0, -7 * i)); weeks.push({ d: addDays(w0, -7 * i), min: ws.min }); }
  const mx = Math.max(60, ...weeks.map(w => w.min));
  // Mapa de calor: 12 semanas x 7 días
  const days = {}; acts.forEach(a => { const k = dstr(new Date(a.fecha)); days[k] = (days[k] || 0) + (a.dur || 0) / 60; });
  let heat = ""; const start = addDays(w0, -77);
  for (let r = 0; r < 7; r++) for (let c = 0; c < 12; c++) { const d = addDays(start, c * 7 + r); const v = days[dstr(d)] || 0; const fut = d > new Date();
    heat += `<i style="grid-row:${r + 1};grid-column:${c + 1};${fut ? "opacity:.25;" : ""}${v ? `background:rgba(212,255,58,${Math.min(1, .25 + v / 90)})` : ""}"></i>`; }
  // Récords
  const recs = [];
  for (const D of [1000, 5000, 10000, 21097]) { let b = null; for (const a of acts) if (a.deporte === "correr" && a.bests && a.bests[D] && (!b || a.bests[D] < b.bests[D])) b = a; if (b) recs.push([prName(D), fmtDur(b.bests[D]), `${fmtPace(b.bests[D] / (D / 1000))}/km`, b.id]); }
  const longest = (sp, n) => { const a = acts.filter(x => x.deporte === sp && x.dist).sort((x, y) => y.dist - x.dist)[0]; if (a) recs.push([n, `${fmtKm(a.dist)} km`, relDate(a.fecha).split(" · ")[0], a.id]); };
  longest("correr", "Carrera más larga"); longest("bici", "Salida más larga en bici");
  const climb = acts.filter(x => x.desnivel).sort((x, y) => y.desnivel - x.desnivel)[0]; if (climb) recs.push(["Más desnivel", `${nf(climb.desnivel)} m`, sportOf(climb.deporte).n, climb.id]);
  const lifts = {}; acts.forEach(a => (a.ejercicios || []).forEach(e => e.series.forEach(s => { if (+s.kg > (lifts[e.n]?.kg || 0)) lifts[e.n] = { kg: +s.kg, r: s.r, id: a.id }; })));
  // Partidos
  const matches = acts.filter(a => a.ganado != null); const wins = matches.filter(a => a.ganado).length;
  // Por deporte (año)
  const y = new Date().getFullYear(), bySport = {}; acts.filter(a => new Date(a.fecha).getFullYear() === y).forEach(a => { const b = bySport[a.deporte] = bySport[a.deporte] || { n: 0, dur: 0, dist: 0 }; b.n++; b.dur += a.dur || 0; b.dist += a.dist || 0; });
  const lastP = pesos[pesos.length - 1], firstP = pesos[0];
  return `
  <div class="card"><h3><span style="display:flex;gap:8px;align-items:center">${svg("chart")}Minutos por semana</span><span class="small mute">12 semanas</span></h3>
    <div style="display:flex;align-items:flex-end;gap:5px;height:120px">${weeks.map((w, i) => `<div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%"><div style="height:${Math.max(3, w.min / mx * 100)}%;border-radius:7px;background:${i === 11 ? "var(--volt)" : "rgba(212,255,58,.35)"}"></div></div>`).join("")}</div>
    <div class="row small mute" style="justify-content:space-between;margin-top:6px"><span>${weeks[0].d.getDate()} ${MESES[weeks[0].d.getMonth()].slice(0, 3)}</span><span>Esta semana: <b style="color:var(--ink)">${Math.round(weeks[11].min)} min</b></span></div></div>
  <div class="card"><h3><span style="display:flex;gap:8px;align-items:center">${svg("calendar")}Constancia</span><span class="small mute">${Object.keys(days).filter(k => parseD(k) >= start).length} días activos</span></h3><div class="heat" style="grid-template-rows:repeat(7,1fr)">${heat}</div></div>
  <div class="card"><h3><span style="display:flex;gap:8px;align-items:center">${svg("scale")}Peso</span><button class="btn sm" id="pAdd">${svg("plus")}Apuntar</button></h3>
    ${lastP ? `<div style="display:flex;align-items:baseline;gap:10px"><span class="num" style="font-size:44px">${nf(lastP.kg, 1)}</span><span class="mute">kg</span>${firstP !== lastP ? `<span class="chip ${lastP.kg <= firstP.kg ? "volt" : "hot"}" style="margin-left:auto">${lastP.kg - firstP.kg > 0 ? "+" : ""}${nf(lastP.kg - firstP.kg, 1)} kg</span>` : ""}</div>
      <div class="chartbox">${pesos.length > 1 ? lineChart(pesos.map(p => p.kg).concat(pesos.length < 5 ? Array(5 - pesos.length).fill(lastP.kg) : []), "#ff6a3d", { unit: " kg", fmt: v => nf(v, 1) }) : ""}</div>` : `<p class="small mute">Apunta tu peso de vez en cuando para ver tu evolución.</p>`}</div>
  <div class="sec">Récords personales</div>
  <div class="card">${recs.length ? recs.map(([n, v, s, id]) => `<button class="item" data-act="${id}"><span style="color:var(--volt)">${svg("medal")}</span><div><div style="font-weight:600">${n}</div><div class="small mute">${s}</div></div><span class="num" style="margin-left:auto;font-size:22px">${v}</span></button>`).join("") : `<p class="small mute">Graba o importa carreras para ver tus mejores marcas en 1K, 5K, 10K y media maratón.</p>`}</div>
  ${Object.keys(lifts).length ? `<div class="sec">Gimnasio · peso máximo</div><div class="card">${Object.entries(lifts).sort((a, b) => b[1].kg - a[1].kg).map(([n, l]) => `<div class="item"><span style="color:var(--hot)">${svg("gym")}</span><div style="font-weight:600">${esc(n)}</div><span class="num" style="margin-left:auto;font-size:20px">${nf(l.kg, 1)} kg <small class="mute">× ${l.r}</small></span></div>`).join("")}</div>` : ""}
  ${matches.length ? `<div class="sec">Partidos</div><div class="grid3"><div class="stat"><div class="k">Jugados</div><div class="v num">${matches.length}</div></div><div class="stat"><div class="k">Ganados</div><div class="v num" style="color:var(--volt)">${wins}</div></div><div class="stat"><div class="k">% victorias</div><div class="v num">${Math.round(wins / matches.length * 100)}<small>%</small></div></div></div>` : ""}
  ${Object.keys(bySport).length ? `<div class="sec">Tu ${y} por deporte</div><div class="card">${Object.entries(bySport).sort((a, b) => b[1].dur - a[1].dur).map(([k, b]) => `<div class="item">${sportBadge(k)}<div><div style="font-weight:600">${sportOf(k).n}</div><div class="small mute">${b.n} sesi${b.n === 1 ? "ón" : "ones"}${b.dist ? ` · ${fmtKm(b.dist)} km` : ""}</div></div><span class="num" style="margin-left:auto;font-size:20px">${fmtDur(b.dur, true)}</span></div>`).join("")}</div>` : ""}`;
}
WIRE.progreso = () => { wireActs(); $("#pAdd").onclick = openPeso; };
function openPeso() {
  openSheet("Apuntar peso", `<div class="row"><label class="field">Peso (kg)<input id="pKg" type="number" step="0.1" inputmode="decimal" value="${weightKg()}"></label><label class="field">Fecha<input id="pF" type="date" value="${todayStr()}"></label></div><button class="btn pri block" id="pOk">Guardar</button>`,
    s => $("#pOk", s).onclick = () => { const kg = parseFloat(String($("#pKg", s).value).replace(",", ".")); if (!(kg > 25 && kg < 350)) { toast("Revisa el peso"); return; } const f = $("#pF", s).value || todayStr(); saveItem("peso", { id: "p" + f, fecha: f, kg }); savePerfil({ peso: kg }); closeSheet(); toast("Peso guardado"); });
}

// ---------- PERFIL ----------
function openPerfil() {
  const name = me.name || state.perfil.nombre || "";
  openSheet("Tu perfil", `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px"><div class="av" style="width:58px;height:58px;font-size:24px">${esc((name || me.email || "R")[0].toUpperCase())}</div><div><div style="font-weight:700;font-size:18px">${esc(name || "Deportista")}</div><div class="small mute">${esc(me.email || "")}</div></div></div>
    <div class="card"><h3>${svg("target")}Meta semanal</h3><div class="seg" id="metaSeg">${[90, 150, 200, 300, 420].map(v => `<button data-m="${v}" class="${(+state.perfil.metaMin || 150) === v ? "on" : ""}">${v} min</button>`).join("")}</div><p class="tiny mute">La OMS recomienda al menos 150 minutos de actividad moderada a la semana.</p></div>
    <div class="card list" style="padding:4px 14px">
      <button class="item" id="pPub">${svg("users")}${typeof social !== "undefined" && social.me ? "Mi perfil público · @" + esc(social.me.usuario) : "Unirme a la comunidad"}${svg("chev", "chev")}</button>
      <button class="item" id="pAll">${svg("list")}Mis entrenos${svg("chev", "chev")}</button>
      <button class="item" id="pName">${svg("user")}Cambiar nombre${svg("chev", "chev")}</button>
      <button class="item" id="pWatch">${svg("watch")}Conectar reloj${svg("chev", "chev")}</button>
      <button class="item" id="pNut">${svg("food")}Mis datos de nutrición${svg("chev", "chev")}</button>
      <a class="item" href="privacidad.html">${svg("shield")}Privacidad y condiciones${svg("chev", "chev")}</a>
      <a class="item" href="mailto:soporte.ahorra@gmail.com?subject=Ritmo%2B">${svg("mail")}Contacto y soporte${svg("chev", "chev")}</a>
      <button class="item" id="pOut">${svg("logout")}Cerrar sesión${svg("chev", "chev")}</button>
      <button class="item" id="pDel" style="color:var(--neg)">${svg("trash")}Borrar mi cuenta${svg("chev", "chev")}</button>
    </div><p class="tiny mute" style="text-align:center;margin-top:8px">Ritmo+ · versión 1.0</p>`, s => {
    $$("[data-m]", s).forEach(b => b.onclick = () => { savePerfil({ metaMin: +b.dataset.m }); $$("[data-m]", s).forEach(x => x.classList.toggle("on", x === b)); toast("Meta actualizada"); });
    $("#pName", s).onclick = () => openSheet("Tu nombre", `<label class="field">Nombre<input id="nN" value="${esc(name)}" maxlength="40"></label><button class="btn pri block" id="nOk">Guardar</button>`, s2 => $("#nOk", s2).onclick = async () => { const n = $("#nN", s2).value.trim(); if (!n) return; me.name = n; savePerfil({ nombre: n }); try { store.auth && await store.auth.currentUser.updateProfile({ displayName: n }); } catch {} closeSheet(); toast("Nombre guardado"); });
    $("#pWatch", s).onclick = openImport; $("#pAll", s).onclick = () => { closeSheet(); setView("entrenos"); };
    $("#pPub", s).onclick = () => { if (social.me) openUser(me.uid); else if (store.kind === "firebase") openPerfilPublico(); else toast("Necesitas conexión"); }; $("#pNut", s).onclick = () => openNutriSetup();
    $("#pOut", s).onclick = () => confirmSheet("¿Cerrar sesión?", "Tus datos quedan guardados en tu cuenta.", "Cerrar sesión", async () => { closeSheet(); await store.signOut(); }, false);
    $("#pDel", s).onclick = openBorrar;
  });
}
function openBorrar() {
  openSheet("Borrar mi cuenta", `<div class="hint" style="background:rgba(248,113,113,.08)">${svg("info")}<span>Se borrarán <b style="color:var(--neg)">para siempre</b> tu cuenta, tus entrenos, comidas y datos. No se puede deshacer.</span></div>
    ${store.kind === "firebase" ? `<label class="field">Escribe tu contraseña para confirmar<input id="dP" type="password" autocomplete="current-password"></label>` : ""}<div class="err" id="dErr"></div><button class="btn danger block" id="dOk">Borrar todo</button>`, s => {
    $("#dOk", s).onclick = async () => {
      const b = $("#dOk", s); b.disabled = true;
      try {
        if (store.kind === "firebase") { const u = store.auth.currentUser; await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, $("#dP", s).value)); await store.deleteAll(); await u.delete(); }
        else { await store.deleteAll(); await store.signOut(); }
        closeSheet(); toast("Cuenta borrada");
      } catch (e) { $("#dErr", s).textContent = authErr(e); b.disabled = false; }
    };
  });
}
