// ===== Pádel+ · grabar, añadir a mano, gimnasio e importar del reloj =====

function openStart() {
  openSheet("Pádel", `<div class="subQuick"><button class="hi" id="sFoto">📸 Publicación</button><button id="sHist">⏱ Historia</button></div>
    <div class="row" style="margin-bottom:6px"><button class="btn block" id="sPm" style="background:#facc15;color:#1a1500;border:0;padding:18px">${svg("plus")}Apuntar partido</button><button class="btn block" id="sPc" style="padding:18px">${svg("clock")}Cronometrar</button></div>
    <p class="tiny mute" style="text-align:center;margin-top:10px">Apunta el resultado al acabar, o cronometra el partido mientras juegas.</p>`, s => {
    $("#sFoto", s).onclick = () => openSubir("foto"); $("#sHist", s).onclick = () => openSubir("historia");
    $("#sPm", s).onclick = () => openPadelMatch(); $("#sPc", s).onclick = () => { sheetOpen = false; $("#sheet").classList.remove("on"); $("#sheetBg").classList.remove("on"); startRec("padel"); };
  });
}

// ---------- Grabación ----------
let R = null, recActive = false, recTimer = null, watchId = null, wakeLock = null, recMap = null, recLine = null, recDot = null;
const REC_KEY = "ritmo-rec";
function startRec(sport, restore = null) {
  const s = sportOf(sport); recActive = true;
  R = restore || { sport, start: Date.now(), acc: 0, runSince: null, pts: [], dist: 0, hr: [] };
  const el = $("#rec"); el.hidden = false; document.body.style.overflow = "hidden";
  el.innerHTML = `${s.gps ? `<div id="recMap"></div>` : `<div id="recMap" style="display:grid;place-items:center"><div style="text-align:center">${sportBadge(sport)}<p class="mute" style="margin-top:10px">${s.n}</p></div></div>`}
    <div class="gpsSt"><span class="pill" id="gpsPill">${s.gps ? `<span class="dot" id="gpsDot"></span><span id="gpsTxt">Buscando GPS…</span>` : `${svg(s.ic)}${s.n}`}</span><button class="pill" id="recClose">${svg("close")}</button></div>
    <div class="recPanel">
      <div class="recTime num" id="rT">0:00</div>
      <div class="recGrid">${s.gps ? `<div><b class="num" id="rD">0,00</b><span>km</span></div><div><b class="num" id="rP">–:––</b><span>${sport === "bici" ? "km/h" : "ritmo /km"}</span></div><div><b class="num" id="rA">–:––</b><span>${sport === "bici" ? "media km/h" : "medio /km"}</span></div>` : `<div><b class="num" id="rK">0</b><span>kcal</span></div><div><b class="num">${svg(s.ic)}</b><span>${s.n}</span></div><div><b class="num" id="rClock">--:--</b><span>hora</span></div>`}</div>
      <div class="recBtns" id="rBtns"></div>
      ${s.gps ? `<p class="tiny mute" style="text-align:center;margin-top:12px">En iPhone, deja la pantalla encendida mientras grabas.</p>` : ""}
    </div>`;
  $("#recClose").onclick = () => { if (R && (R.acc > 5000 || R.runSince)) confirmSheet("¿Descartar entreno?", "Se perderá lo que llevas grabado.", "Descartar", () => { closeSheet(); stopRec(true); }); else stopRec(true); };
  if (s.gps) { setTimeout(() => { recMap = drawMap("recMap", [], s.c, true); if (recMap) { recLine = L.polyline([], { color: s.c, weight: 5 }).addTo(recMap); recMap.setView([40.4168, -3.7038], 15); restorePath(); } }, 30); startGPS(); }
  renderRecBtns(); clearInterval(recTimer); recTimer = setInterval(tick, 1000); tick(); keepAwake();
}
function restorePath() { if (R.pts.length && recLine) { recLine.setLatLngs(R.pts.map(p => [p[0], p[1]])); recMap.fitBounds(recLine.getBounds(), { padding: [30, 30] }); } }
function elapsed() { return R ? (R.acc + (R.runSince ? Date.now() - R.runSince : 0)) / 1000 : 0; }
function renderRecBtns() {
  const b = $("#rBtns"); if (!b) return;
  if (!R.runSince && R.acc === 0) b.innerHTML = `<button class="rb go" id="rGo">${svg("play")}</button>`;
  else if (R.runSince) b.innerHTML = `<button class="rb go" id="rPause" style="background:var(--ink)">${svg("pause")}</button>`;
  else b.innerHTML = `<button class="rb go" id="rGo">${svg("play")}</button><button class="rb st" id="rStop">${svg("stop")}</button>`;
  const go = $("#rGo"); if (go) go.onclick = () => { R.runSince = Date.now(); R.lastGap = true; renderRecBtns(); saveRecLocal(); navigator.vibrate && navigator.vibrate(40); };
  const pa = $("#rPause"); if (pa) pa.onclick = () => { R.acc += Date.now() - R.runSince; R.runSince = null; renderRecBtns(); saveRecLocal(); };
  const st = $("#rStop"); if (st) st.onclick = finishRec;
}
function tick() {
  if (!R) return; const t = elapsed(); const s = sportOf(R.sport); $("#rT").textContent = fmtDur(t);
  if (s.gps) {
    $("#rD").textContent = nf(km(R.dist), 2);
    // Ritmo actual: últimos ~30 s
    const P = R.pts; let cur = null;
    if (P.length > 2 && R.runSince) { const last = P[P.length - 1]; let j = P.length - 1; while (j > 0 && last[3] - P[j][3] < 30) j--; let d = 0; for (let k = j + 1; k < P.length; k++) d += haversine(P[k - 1], P[k]); const dt = last[3] - P[j][3]; if (d > 15 && dt > 0) cur = dt / (d / 1000); }
    if (R.sport === "bici") { $("#rP").textContent = cur ? nf(3600 / cur, 1) : "0,0"; $("#rA").textContent = t ? nf(R.dist / t * 3.6, 1) : "0,0"; }
    else { $("#rP").textContent = fmtPace(cur); $("#rA").textContent = R.dist > 50 ? fmtPace(t / km(R.dist)) : "–:––"; }
  } else { $("#rK").textContent = nf(estKcal(R.sport, t, 0)); const d = new Date(); $("#rClock").textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
  if (Math.round(t) % 10 === 0) saveRecLocal();
}
function startGPS() {
  if (!navigator.geolocation) { setGps("bad", "Este móvil no tiene GPS disponible"); return; }
  watchId = navigator.geolocation.watchPosition(onPos, err => setGps("bad", err.code === 1 ? "Permite la ubicación para grabar" : "Sin señal GPS"), { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 });
}
function setGps(c, t) { const d = $("#gpsDot"); if (d) d.className = "dot " + c; const x = $("#gpsTxt"); if (x) x.textContent = t; }
function onPos(p) {
  const { latitude: la, longitude: lo, altitude: al, accuracy: ac } = p.coords;
  setGps(ac <= 25 ? "ok" : "bad", ac <= 25 ? `GPS listo · ±${Math.round(ac)} m` : `Señal débil · ±${Math.round(ac)} m`);
  if (recDot) recDot.setLatLng([la, lo]); else if (recMap) recDot = L.circleMarker([la, lo], { radius: 8, color: "#0a0d11", weight: 3, fillColor: sportOf(R.sport).c, fillOpacity: 1 }).addTo(recMap);
  if (recMap && (!R.pts.length || !R.runSince)) recMap.setView([la, lo], Math.max(recMap.getZoom(), 16));
  if (!R.runSince || ac > 35) return;
  const t = elapsed(), pt = [+la.toFixed(6), +lo.toFixed(6), al != null ? Math.round(al * 10) / 10 : null, Math.round(t), null];
  const last = R.pts[R.pts.length - 1];
  if (last && !R.lastGap) {
    const d = haversine(last, pt), dt = Math.max(1, pt[3] - last[3]); const maxV = R.sport === "bici" ? 25 : 12;
    if (d < 3) return; if (d / dt > maxV) return; R.dist += d;
  }
  R.lastGap = false; R.pts.push(pt);
  if (recLine) { recLine.addLatLng([la, lo]); recMap.panTo([la, lo]); }
}
async function keepAwake() { try { if ("wakeLock" in navigator) { wakeLock = await navigator.wakeLock.request("screen"); } } catch {} }
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && recActive) keepAwake(); });
function saveRecLocal() { try { if (R) localStorage.setItem(REC_KEY, JSON.stringify({ ...R, savedAt: Date.now() })); } catch {} }
function stopRec(discard) {
  clearInterval(recTimer); if (watchId != null) navigator.geolocation.clearWatch(watchId); watchId = null;
  try { wakeLock && wakeLock.release(); } catch {} wakeLock = null;
  if (recMap) { recMap.remove(); recMap = null; recLine = null; recDot = null; }
  $("#rec").hidden = true; $("#rec").innerHTML = ""; document.body.style.overflow = ""; recActive = false;
  if (discard) { R = null; localStorage.removeItem(REC_KEY); render(); }
}
function finishRec() {
  const t = elapsed(); if (t < 10) { toast("Graba al menos unos segundos"); return; }
  if (R.sport === "padel") { const f = new Date(R.start).toISOString(); stopRec(false); localStorage.removeItem(REC_KEY); R = null; openPadelMatch({ fecha: f, dur: Math.round(t), fuente: "crono" }); return; }
  const s = sportOf(R.sport), trk = downsample(R.pts);
  const a = { id: uid("a"), deporte: R.sport, fecha: new Date(R.start).toISOString(), dur: Math.round(t), dist: Math.round(R.dist), fuente: s.gps ? "gps" : "crono" };
  if (trk && trk.length > 1) { a.trk = trk; a.desnivel = elevGain(trk); a.bests = bestEfforts(trk); }
  a.kcal = estKcal(a.deporte, a.dur, a.dist); a.titulo = autoTitle(a.deporte, a.fecha);
  stopRec(false); openFinish(a, false);
}
function checkRecovery() {
  try { const r = JSON.parse(localStorage.getItem(REC_KEY)); if (!r || !r.sport) return;
    if (Date.now() - r.savedAt > 6 * 3600e3) { localStorage.removeItem(REC_KEY); return; }
    if (r.runSince) { r.acc += Math.max(0, r.savedAt - r.runSince); r.runSince = null; }
    confirmSheet("Tienes un entreno sin terminar", `${sportOf(r.sport).n} · ${fmtDur(r.acc / 1000)}${r.dist ? ` · ${fmtKm(r.dist)} km` : ""}. ¿Quieres seguir grabándolo?`, "Continuar", () => { closeSheet(); setTimeout(() => startRec(r.sport, r), 50); }, false);
    setTimeout(() => { const no = $("#cNo"); if (no) { no.textContent = "Descartar"; no.onclick = () => { localStorage.removeItem(REC_KEY); closeSheet(); }; } }, 10);
  } catch {}
}

// ---------- Guardar / editar ----------
function openFinish(a, editing) {
  const s = sportOf(a.deporte);
  openSheet(editing ? "Editar entreno" : "¡Buen trabajo! 🔥", `
    ${editing ? "" : `<div class="grid3" style="margin-bottom:14px"><div class="stat"><div class="k">Tiempo</div><div class="v num" style="font-size:22px">${fmtDur(a.dur)}</div></div>${a.dist ? `<div class="stat"><div class="k">Distancia</div><div class="v num" style="font-size:22px">${fmtKm(a.dist)} km</div></div>` : ""}<div class="stat"><div class="k">Calorías</div><div class="v num" style="font-size:22px">${nf(a.kcal)}</div></div></div>`}
    <label class="field">Título<input id="fT" value="${esc(a.titulo || "")}" maxlength="60"></label>
    ${editing ? `<div class="row"><label class="field">Duración (min)<input id="fDur" type="number" inputmode="numeric" value="${Math.round(a.dur / 60)}"></label>${s.gps || a.dist ? `<label class="field">Distancia (km)<input id="fDist" type="number" step="0.01" inputmode="decimal" value="${(a.dist / 1000).toFixed(2)}"></label>` : ""}</div>` : ""}
    ${s.match ? matchFields(a) : ""}
    ${zapaSelect(a)}
    <div class="field">¿Qué tal te has sentido?<div class="seg" id="fS">${[1, 2, 3, 4, 5].map(n => `<button data-n="${n}" class="${a.sensacion === n ? "on" : ""}">${["😫", "😕", "🙂", "😀", "🔥"][n - 1]}</button>`).join("")}</div></div>
    <label class="field">Notas<textarea id="fN" rows="2" maxlength="400" placeholder="Cómo fue, zapatillas, sensaciones…">${esc(a.notas || "")}</textarea></label>
    ${typeof social !== "undefined" && social.me ? `<label class="check"><input type="checkbox" id="fVis" ${a.vis === "privado" ? "" : "checked"}> <span>Publicar en la comunidad (tus seguidores lo verán)</span></label>` : ""}
    <button class="btn pri block" id="fOk">${editing ? "Guardar cambios" : "Guardar entreno"}</button>
    ${editing ? "" : `<button class="btn block" style="margin-top:10px;color:var(--mute)" id="fDis">Descartar</button>`}`, sh => {
    let sens = a.sensacion || 0;
    $$("#fS button", sh).forEach(b => b.onclick = () => { sens = +b.dataset.n; $$("#fS button", sh).forEach(x => x.classList.toggle("on", x === b)); });
    wireMatch(sh, a);
    $("#fOk", sh).onclick = () => {
      a.titulo = $("#fT", sh).value.trim() || autoTitle(a.deporte, a.fecha); a.notas = $("#fN", sh).value.trim(); a.sensacion = sens || null;
      const fv = $("#fVis", sh); if (fv) a.vis = fv.checked ? "todos" : "privado";
      const fz = $("#fZ", sh); if (fz) a.zapa = fz.value || null;
      if (editing) { const d = +$("#fDur", sh).value; if (d > 0) a.dur = d * 60; const di = $("#fDist", sh); if (di) a.dist = Math.round(parseFloat(String(di.value).replace(",", ".")) * 1000) || 0; a.kcal = estKcal(a.deporte, a.dur, a.dist); }
      if (s.match) readMatch(sh, a);
      saveItem("act", a); localStorage.removeItem(REC_KEY); R = null; closeSheet();
      toast(editing ? "Cambios guardados" : "Entreno guardado 💪");
      if (!editing) { const pr = Object.entries(a.bests || {}).filter(([D, t]) => isPR(a, +D, t)); if (pr.length) setTimeout(() => toast(`🏆 ¡Récord en ${pr.map(([D]) => prName(+D)).join(", ")}!`), 700); }
    };
    const dis = $("#fDis", sh); if (dis) dis.onclick = () => confirmSheet("¿Descartar entreno?", "No se guardará.", "Descartar", () => { localStorage.removeItem(REC_KEY); R = null; closeSheet(); });
  });
}
function matchFields(a) {
  return `<div class="card" style="padding:12px"><div class="small mute" style="margin-bottom:8px">Partido (opcional)</div>
    <div class="seg" id="fW"><button data-w="1" class="${a.ganado === true ? "on" : ""}">🏆 Ganado</button><button data-w="0" class="${a.ganado === false ? "on" : ""}">Perdido</button></div>
    <label class="field">Resultado<input id="fR" value="${esc(a.resultado || "")}" placeholder="${a.deporte === "padel" || a.deporte === "tenis" ? "6-4 / 3-6 / 7-5" : "3-2"}" maxlength="40"></label>
    <div class="row">${a.deporte === "padel" ? `<label class="field">Compañero/a<input id="fC" value="${esc(a.companero || "")}" maxlength="40"></label>` : ""}<label class="field">Rivales<input id="fRv" value="${esc(a.rivales || "")}" maxlength="60"></label></div></div>`;
}
function wireMatch(sh, a) { $$("#fW button", sh).forEach(b => b.onclick = () => { const on = !b.classList.contains("on"); $$("#fW button", sh).forEach(x => x.classList.remove("on")); if (on) b.classList.add("on"); }); }
function readMatch(sh, a) {
  const w = $("#fW button.on", sh); a.ganado = w ? w.dataset.w === "1" : null; a.resultado = $("#fR", sh).value.trim(); a.rivales = $("#fRv", sh).value.trim();
  const c = $("#fC", sh); if (c) a.companero = c.value.trim();
}

// ---------- Añadir a mano ----------
function openManual(sport = null) {
  if (!sport) {
    openSheet("Añadir entreno", `<div class="sports">${SPORTS.filter(s => ["padel", "gym", "hiit", "yoga"].includes(s.id)).map(s => `<button data-s="${s.id}">${sportBadge(s.id)}${s.n}</button>`).join("")}</div>`,
      s => $$("[data-s]", s).forEach(b => b.onclick = () => b.dataset.s === "gym" ? openGym() : openManual(b.dataset.s)));
    return;
  }
  if (sport === "padel") { openPadelMatch(); return; }
  const s = sportOf(sport), now = new Date(); const a = { id: uid("a"), deporte: sport, fuente: "manual" };
  openSheet(`${s.n}`, `
    <div class="row"><label class="field">Fecha<input id="mF" type="date" value="${todayStr()}"></label><label class="field">Hora<input id="mH" type="time" value="${pad(now.getHours())}:${pad(now.getMinutes())}"></label></div>
    <div class="row"><label class="field">Duración (min)<input id="mD" type="number" inputmode="numeric" placeholder="60"></label>${s.gps || sport === "natacion" ? `<label class="field">Distancia (km)<input id="mDi" type="number" step="0.01" inputmode="decimal" placeholder="${sport === "natacion" ? "1,5" : "5"}"></label>` : ""}</div>
    ${s.match ? matchFields(a) : ""}
    ${zapaSelect(a)}
    <label class="field">Título (opcional)<input id="mT" maxlength="60" placeholder="${esc(autoTitle(sport, now.toISOString()))}"></label>
    <label class="field">Notas<textarea id="mN" rows="2" maxlength="400"></textarea></label>
    ${typeof social !== "undefined" && social.me ? `<label class="check"><input type="checkbox" id="mVis" checked> <span>Publicar en la comunidad</span></label>` : ""}
    <button class="btn pri block" id="mOk">Guardar</button>`, sh => {
    wireMatch(sh, a);
    $("#mOk", sh).onclick = () => {
      const d = +$("#mD", sh).value; if (!(d > 0)) { toast("Pon la duración"); return; }
      const di = $("#mDi", sh); a.dist = di ? Math.round((parseFloat(String(di.value).replace(",", ".")) || 0) * 1000) : 0;
      a.fecha = new Date(`${$("#mF", sh).value}T${$("#mH", sh).value || "12:00"}`).toISOString(); a.dur = d * 60;
      a.kcal = estKcal(sport, a.dur, a.dist); a.titulo = $("#mT", sh).value.trim() || autoTitle(sport, a.fecha); a.notas = $("#mN", sh).value.trim();
      if (s.match) readMatch(sh, a); const mv = $("#mVis", sh); if (mv) a.vis = mv.checked ? "todos" : "privado"; const mz = $("#fZ", sh); if (mz) a.zapa = mz.value || null;
      saveItem("act", a); closeSheet(); toast("Entreno guardado 💪");
    };
  });
}

// ---------- Gimnasio ----------
let G = null;
function openGym(existing = null) {
  G = existing || { start: Date.now(), ej: [] };
  const lastFor = n => { for (const a of actList()) { const e = (a.ejercicios || []).find(x => x.n === n); if (e) return e.series; } return null; };
  const draw = () => {
    const sh = $("#sheet"); const body = $("#gymBody", sh); if (!body) return;
    body.innerHTML = G.ej.length ? G.ej.map((e, i) => `<div class="ex"><div class="eh"><span>${esc(e.n)}</span><button data-rm="${i}" class="mute">${svg("trash")}</button></div>
      <div class="set tiny mute" style="margin-bottom:2px"><span>#</span><span>Reps</span><span>Kg</span><span></span></div>
      ${e.series.map((s, j) => `<div class="set"><span>${j + 1}</span><input inputmode="numeric" data-e="${i}" data-j="${j}" data-k="r" value="${s.r ?? ""}" placeholder="10"><input inputmode="decimal" data-e="${i}" data-j="${j}" data-k="kg" value="${s.kg ?? ""}" placeholder="0"><button data-del="${i}-${j}" class="mute">${svg("close")}</button></div>`).join("")}
      <button class="btn sm" data-add="${i}" style="margin-top:4px">${svg("plus")}Serie</button>${e.prev ? `<span class="tiny mute" style="margin-left:8px">Última vez: ${e.prev.map(x => `${x.r}×${x.kg}`).join(", ")}</span>` : ""}</div>`).join("")
      : `<div class="empty">${svg("gym")}<p>Añade tu primer ejercicio.</p></div>`;
    $$("[data-k]", body).forEach(inp => inp.oninput = () => { G.ej[+inp.dataset.e].series[+inp.dataset.j][inp.dataset.k] = parseFloat(String(inp.value).replace(",", ".")) || 0; });
    $$("[data-add]", body).forEach(b => b.onclick = () => { const e = G.ej[+b.dataset.add]; const l = e.series[e.series.length - 1] || {}; e.series.push({ r: l.r || 10, kg: l.kg || 0 }); draw(); });
    $$("[data-del]", body).forEach(b => b.onclick = () => { const [i, j] = b.dataset.del.split("-").map(Number); G.ej[i].series.splice(j, 1); if (!G.ej[i].series.length) G.ej.splice(i, 1); draw(); });
    $$("[data-rm]", body).forEach(b => b.onclick = () => { G.ej.splice(+b.dataset.rm, 1); draw(); });
    const t = $("#gymT", sh); if (t) t.textContent = fmtDur((Date.now() - G.start) / 1000);
  };
  openSheet(G.rutina ? esc(G.rutina) : "Entreno de gimnasio", `<div class="row" style="align-items:center;margin-bottom:12px"><div><div class="small mute">Tiempo</div><div class="num" style="font-size:34px" id="gymT">0:00</div></div><button class="btn sm" id="gRest" style="flex:none">${svg("clock")}Descanso 90 s</button></div>
    <div id="gymBody"></div>
    <label class="field">Añadir ejercicio<select id="gEx"><option value="">Elige un ejercicio…</option>${GYM_EX.map(n => `<option>${n}</option>`).join("")}<option value="__otro">Otro…</option></select></label>
    <button class="btn pri block" id="gOk" style="margin-top:6px">Terminar y guardar</button>`, sh => {
    draw(); const iv = setInterval(() => { const t = $("#gymT"); if (!t) { clearInterval(iv); return; } t.textContent = fmtDur((Date.now() - G.start) / 1000); }, 1000);
    $("#gEx", sh).onchange = e => { let n = e.target.value; if (n === "__otro") n = (prompt("Nombre del ejercicio") || "").trim(); e.target.value = ""; if (!n) return; const prev = lastFor(n); G.ej.push({ n, series: prev ? prev.map(x => ({ ...x })) : [{ r: 10, kg: 0 }], prev }); draw(); };
    let rest = null; $("#gRest", sh).onclick = e => { const b = e.currentTarget; clearInterval(rest); let n = 90; b.innerHTML = `${svg("clock")}${n} s`; rest = setInterval(() => { n--; b.innerHTML = `${svg("clock")}${n} s`; if (n <= 0) { clearInterval(rest); b.innerHTML = `${svg("clock")}Descanso 90 s`; navigator.vibrate && navigator.vibrate([200, 100, 200]); toast("¡A por la siguiente serie!"); } }, 1000); };
    $("#gOk", sh).onclick = () => {
      if (!G.ej.length) { toast("Añade al menos un ejercicio"); return; }
      const dur = Math.max(60, Math.round((Date.now() - G.start) / 1000));
      const a = { id: uid("a"), deporte: "gym", fecha: new Date(G.start).toISOString(), dur, dist: 0, fuente: "gym", ejercicios: G.ej.map(e => ({ n: e.n, series: e.series.filter(s => s.r) })) };
      a.kcal = estKcal("gym", dur, 0); a.titulo = G.rutina ? `${G.rutina} · pádel` : autoTitle("gym", a.fecha); clearInterval(iv); G = null; openFinish(a, false);
    };
  });
}

// ---------- Importar del reloj ----------
function openImport() {
  openSheet("Conecta tu reloj", `
    <div class="hint">${svg("watch")}<span>Importa actividades de <b style="color:var(--ink)">Garmin, Coros, Polar, Suunto, Wahoo, Apple Watch</b> o cualquier app que exporte archivos <b style="color:var(--ink)">.FIT</b>, <b style="color:var(--ink)">.GPX</b> o <b style="color:var(--ink)">.TCX</b>. Se guardan con ruta, ritmo, desnivel y pulso.</span></div>
    <label class="btn pri block" for="impIn" style="margin:6px 0 14px">${svg("upload")}Elegir archivos</label>
    <input type="file" id="impIn" accept=".fit,.gpx,.tcx,application/octet-stream,application/gpx+xml,application/xml,text/xml" multiple hidden>
    <div id="impSt"></div>
    <div class="card" style="margin-top:6px"><h3>${svg("info")}Cómo sacar el archivo</h3>
      <p class="small mute" style="line-height:1.6"><b style="color:var(--ink)">Garmin Connect:</b> abre la actividad en connect.garmin.com → ⚙️ → Exportar original (.FIT) o Exportar a GPX.<br>
      <b style="color:var(--ink)">Strava:</b> abre la actividad en la web → ⋯ → Exportar GPX.<br>
      <b style="color:var(--ink)">Coros / Polar / Suunto:</b> en su app, compartir o exportar la actividad como FIT o GPX.</p></div>
    <p class="tiny mute" style="text-align:center">Próximamente: sincronización automática con Strava y Garmin.</p>`, sh => {
    $("#impIn", sh).onchange = async e => {
      const files = [...e.target.files]; const st = $("#impSt", sh); let ok = 0, fail = 0, dup = 0;
      st.innerHTML = `<p class="small mute">Leyendo ${files.length} archivo${files.length > 1 ? "s" : ""}…</p>`;
      for (const f of files) {
        try { const a = await parseFile(f); if (!a) { fail++; continue; }
          if (Object.values(state.act).some(x => Math.abs(new Date(x.fecha) - new Date(a.fecha)) < 60e3 && x.deporte === a.deporte)) { dup++; continue; }
          saveItem("act", a); ok++; } catch (er) { console.error(er); fail++; }
      }
      st.innerHTML = `<div class="hint" style="background:var(--volt-soft)">${svg("check")}<span style="color:var(--ink)">${ok ? `${ok} actividad${ok > 1 ? "es importadas" : " importada"}.` : "No se importó nada."}${dup ? ` ${dup} ya estaba${dup > 1 ? "n" : ""}.` : ""}${fail ? ` ${fail} no se pudo leer.` : ""}</span></div>`;
      if (ok) toast(`${ok} actividad${ok > 1 ? "es" : ""} importada${ok > 1 ? "s" : ""} ⌚`);
      e.target.value = "";
    };
  });
}
const SPORT_MAP = { running: "correr", run: "correr", trail_running: "correr", cycling: "bici", biking: "bici", ride: "bici", mountain_biking: "bici", walking: "caminar", walk: "caminar", hiking: "senderismo", hike: "senderismo", swimming: "natacion", training: "gym", strength_training: "gym", fitness_equipment: "gym", tennis: "tenis", padel: "padel", soccer: "futbol", basketball: "baloncesto", yoga: "yoga", hiit: "hiit" };
function mapSport(s) { s = String(s || "").toLowerCase().replace(/\s+/g, "_"); return SPORT_MAP[s] || (s.includes("run") ? "correr" : s.includes("cycl") || s.includes("bik") ? "bici" : s.includes("walk") ? "caminar" : s.includes("hik") ? "senderismo" : s.includes("swim") ? "natacion" : "otro"); }
async function parseFile(f) {
  const name = f.name.toLowerCase();
  if (name.endsWith(".fit")) return parseFIT(await f.arrayBuffer());
  const txt = await f.text(); if (name.endsWith(".tcx") || txt.includes("<TrainingCenterDatabase")) return parseTCX(txt); return parseGPX(txt);
}
function buildAct(sport, pts, extra = {}) {
  // pts: [{lat, lon, ele, time(ms), hr}]
  pts = pts.filter(p => p.time); if (!pts.length && !extra.dur) return null;
  const t0 = pts.length ? pts[0].time : Date.parse(extra.fecha); const geo = pts.filter(p => p.lat != null && p.lon != null);
  let trk = geo.map(p => [+p.lat.toFixed(6), +p.lon.toFixed(6), p.ele != null ? Math.round(p.ele * 10) / 10 : null, Math.round((p.time - t0) / 1000), p.hr || null]);
  let dist = 0; for (let i = 1; i < trk.length; i++) dist += haversine(trk[i - 1], trk[i]);
  const hrs = pts.map(p => p.hr).filter(Boolean);
  const a = { id: uid("a"), deporte: sport, fecha: new Date(t0).toISOString(), dur: Math.round(extra.dur || (pts.length ? (pts[pts.length - 1].time - t0) / 1000 : 0)), dist: Math.round(extra.dist || dist), fuente: extra.fuente };
  if (trk.length > 1) { trk = downsample(trk); a.trk = trk; a.desnivel = Math.round(extra.ascent || elevGain(trk)); a.bests = bestEfforts(trk); }
  if (hrs.length) { a.fcMedia = Math.round(hrs.reduce((s, x) => s + x, 0) / hrs.length); a.fcMax = Math.max(...hrs); }
  if (extra.fcMedia) a.fcMedia = Math.round(extra.fcMedia); if (extra.fcMax) a.fcMax = Math.round(extra.fcMax);
  a.kcal = Math.round(extra.kcal || estKcal(sport, a.dur, a.dist)); a.titulo = extra.titulo || autoTitle(sport, a.fecha);
  if (sport === "correr" && state.perfil.zapaDef) a.zapa = state.perfil.zapaDef;
  return a;
}
function parseGPX(txt) {
  const x = new DOMParser().parseFromString(txt, "application/xml"); if (x.querySelector("parsererror")) return null;
  const type = x.querySelector("trk > type")?.textContent; const nm = x.querySelector("trk > name")?.textContent;
  const pts = [...x.getElementsByTagName("trkpt")].map(p => { const hr = [...p.getElementsByTagName("*")].find(e => /(^|:)hr$/.test(e.tagName)); return { lat: +p.getAttribute("lat"), lon: +p.getAttribute("lon"), ele: p.getElementsByTagName("ele")[0] ? +p.getElementsByTagName("ele")[0].textContent : null, time: p.getElementsByTagName("time")[0] ? Date.parse(p.getElementsByTagName("time")[0].textContent) : null, hr: hr ? +hr.textContent : null }; });
  return buildAct(mapSport(type || (nm || "").toLowerCase()), pts, { fuente: "gpx", titulo: nm && nm.length < 60 ? nm : null });
}
function parseTCX(txt) {
  const x = new DOMParser().parseFromString(txt, "application/xml"); const act = x.getElementsByTagName("Activity")[0]; if (!act) return null;
  const pts = [...x.getElementsByTagName("Trackpoint")].map(p => { const g = t => p.getElementsByTagName(t)[0]?.textContent; const hb = p.getElementsByTagName("HeartRateBpm")[0]; return { lat: g("LatitudeDegrees") != null ? +g("LatitudeDegrees") : null, lon: g("LongitudeDegrees") != null ? +g("LongitudeDegrees") : null, ele: g("AltitudeMeters") != null ? +g("AltitudeMeters") : null, time: Date.parse(g("Time")), hr: hb ? +hb.getElementsByTagName("Value")[0].textContent : null }; });
  const laps = [...x.getElementsByTagName("Lap")]; const sum = t => laps.reduce((s, l) => s + (+l.getElementsByTagName(t)[0]?.textContent || 0), 0);
  return buildAct(mapSport(act.getAttribute("Sport")), pts, { fuente: "gpx", dur: sum("TotalTimeSeconds") || null, dist: sum("DistanceMeters") || null, kcal: sum("Calories") || null });
}
function loadFit() { return window.FitParser ? Promise.resolve() : new Promise((ok, ko) => { const s = document.createElement("script"); s.src = "fitparser.js"; s.onload = ok; s.onerror = ko; document.head.append(s); }); }
async function parseFIT(buf) {
  await loadFit();
  return new Promise((res, rej) => {
    new FitParser({ force: true, speedUnit: "m/s", lengthUnit: "m", elapsedRecordField: true, mode: "list" }).parse(buf, (err, d) => {
      if (err && !d) { rej(err); return; }
      const ses = (d.sessions || [])[0] || {};
      const pts = (d.records || []).map(r => ({ lat: r.position_lat, lon: r.position_long, ele: r.enhanced_altitude ?? r.altitude, time: r.timestamp ? new Date(r.timestamp).getTime() : null, hr: r.heart_rate }));
      const sport = mapSport(ses.sub_sport && ses.sub_sport !== "generic" && SPORT_MAP[ses.sub_sport] ? ses.sub_sport : ses.sport);
      res(buildAct(sport, pts, { fuente: "fit", dur: ses.total_timer_time || ses.total_elapsed_time, dist: ses.total_distance, kcal: ses.total_calories, ascent: ses.total_ascent, fcMedia: ses.avg_heart_rate, fcMax: ses.max_heart_rate, fecha: ses.start_time }));
    });
  });
}

// ---------- Rutinas de gimnasio pensadas para el pádel ----------
const RUTINAS_PADEL = [
  { id: "piernas", e: "🦵", t: "Piernas y core", obj: "Más estabilidad en los desplazamientos y golpes con más fuerza desde el suelo.", min: 40,
    ej: [["Sentadilla goblet", 3, 10, "Baja controlado, rodillas en línea con los pies."], ["Zancada lateral", 3, 8, "Por cada lado. Es el gesto de llegar a la bola abierta."], ["Peso muerto rumano", 3, 10, "Espalda recta; trabaja la parte de atrás de la pierna."], ["Elevación de gemelos", 3, 15, "Protege el tendón de Aquiles y ayuda en los arranques."], ["Plancha lateral (seg)", 3, 30, "Por cada lado. Core para girar el tronco en cada golpe."], ["Pallof press", 3, 10, "Con polea o banda: aguanta sin girar. Core antirrotación."]] },
  { id: "explosiva", e: "⚡", t: "Explosividad y agilidad", obj: "Arrancar antes, llegar a más bolas y saltar mejor en el remate.", min: 35,
    ej: [["Salto al cajón", 4, 5, "Sube explosivo, baja andando. Calidad, no cantidad."], ["Desplazamiento lateral con banda", 3, 10, "Banda en los tobillos, pasos cortos y rápidos."], ["Sprint corto 5 m", 4, 6, "Desde posición de espera, como en la pista."], ["Lanzamiento lateral balón medicinal", 3, 8, "Por cada lado contra la pared: imita la derecha y el revés."], ["Burpees", 3, 8, "Ritmo alto, buena técnica."], ["Split squat con salto", 3, 6, "Por pierna. Fuerza reactiva para el remate."]] },
  { id: "prevencion", e: "🛡️", t: "Prevención de lesiones", obj: "Cuida hombro, codo, rodilla y tobillo, las zonas que más castiga el pádel.", min: 30,
    ej: [["Rotación externa con banda", 3, 15, "Codo pegado al cuerpo. Hombro sano para el remate."], ["Face pull", 3, 12, "Tira hacia la cara abriendo los codos."], ["Extensión de muñeca excéntrica", 3, 15, "Baja lento con una mancuerna ligera: previene el codo de tenista."], ["Sentadilla isométrica en pared (seg)", 3, 30, "Rodilla fuerte y estable."], ["Equilibrio a una pierna (seg)", 3, 30, "Por pierna. Sobre superficie blanda si puedes: tobillo."], ["Puente de glúteo", 3, 12, "Glúteo fuerte = menos carga en rodilla y lumbar."]] }];
let rutNivel = "basico";
function openRutinas() {
  const ser = n => rutNivel === "basico" ? Math.max(2, n - 1) : n;
  openSheet("Rutinas para pádel", `<p class="small mute" style="margin:-6px 0 12px">Hechas para rendir más en la pista. Haz 2 por semana en días sin partido, o el día antes de forma suave.</p>
    <div class="seg" id="ruN" style="margin-bottom:12px">${[["basico", "Empiezo"], ["avanzado", "Ya entreno"]].map(([k, n]) => `<button data-v="${k}" class="${rutNivel === k ? "on" : ""}">${n}</button>`).join("")}</div>
    ${RUTINAS_PADEL.map(r => `<div class="card" style="padding:14px"><div style="display:flex;gap:10px;align-items:center"><span style="font-size:26px">${r.e}</span><div style="flex:1"><div style="font-weight:800;font-size:17px">${r.t}</div><div class="tiny mute">~${r.min} min · ${r.ej.length} ejercicios</div></div></div>
      <p class="small" style="margin:8px 0 6px;line-height:1.45">${r.obj}</p>
      <details><summary class="small" style="color:var(--vt);cursor:pointer;padding:4px 0">Ver ejercicios</summary>${r.ej.map(([n, s, rep, tip]) => `<div style="padding:8px 0;border-top:1px solid var(--line)"><div style="display:flex;justify-content:space-between;gap:8px"><b class="small">${n.replace(" (seg)", "")}</b><span class="small num" style="color:var(--vt);white-space:nowrap">${ser(s)} × ${rep}${n.includes("(seg)") ? " s" : ""}</span></div><div class="tiny mute" style="margin-top:2px">${tip}</div></div>`).join("")}</details>
      <button class="btn pri block" data-rut="${r.id}" style="margin-top:10px">${svg("play")}Empezar</button></div>`).join("")}
    <p class="tiny mute" style="text-align:center">Calienta 5–10 min antes. Si tienes una lesión o dolor, consulta antes con un fisioterapeuta.</p>`, s => {
    $$("#ruN [data-v]", s).forEach(b => b.onclick = () => { rutNivel = b.dataset.v; openRutinas(); });
    $$("[data-rut]", s).forEach(b => b.onclick = () => { const r = RUTINAS_PADEL.find(x => x.id === b.dataset.rut);
      openGym({ start: Date.now(), rutina: r.t, ej: r.ej.map(([n, sr, rep]) => ({ n, series: Array.from({ length: ser(sr) }, () => ({ r: rep, kg: 0 })) })) }); });
  });
}
