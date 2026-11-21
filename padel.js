// ===== Pádel+ · Pádel: nivel, partidos con amigos, estadísticas y buscar partido =====
const NIVEL_TXT = [[1.5, "Iniciación"], [2.5, "Principiante"], [3.5, "Intermedio"], [4.5, "Intermedio alto"], [5.5, "Avanzado"], [8, "Competición"]];
const nivelTxt = n => (NIVEL_TXT.find(x => n < x[0]) || NIVEL_TXT[NIVEL_TXT.length - 1])[1];
const fmtNivel = n => nf(n, 2);
let padelLv = {}; // niveles públicos de otros jugadores (uid → nivel)

// ---------- Partidos guardados como actividades ----------
const padelActs = () => actList().filter(a => a.deporte === "padel" && a.padel && a.padel.sets && a.padel.sets.length).sort((a, b) => a.fecha.localeCompare(b.fecha));
function setsStr(sets) { return sets.map(s => `${s[0]}-${s[1]}`).join(" / "); }
function setsWin(sets) { let a = 0, b = 0; sets.forEach(s => { if (s[0] > s[1]) a++; else if (s[1] > s[0]) b++; }); return a > b ? true : b > a ? false : null; }
function gamesOf(sets) { return sets.reduce((r, s) => [r[0] + s[0], r[1] + s[1]], [0, 0]); }

// ---------- Nivel (sistema tipo ELO adaptado a escala 1-7) ----------
function computeNivel() {
  const P = state.perfil.padel || {}; let lv = P.nivel0 || 0; if (!lv) return null;
  const hist = [{ f: null, n: lv }]; let n = 0;
  for (const a of padelActs()) {
    const p = a.padel; const won = setsWin(p.sets); if (won === null) continue;
    const comp = p.comp && p.comp.uid && padelLv[p.comp.uid] ? padelLv[p.comp.uid] : (p.comp && p.comp.nv) || lv;
    const team = (lv + comp) / 2;
    const rv = (p.riv || []).map(r => r.uid && padelLv[r.uid] ? padelLv[r.uid] : r.nv || team);
    const opp = rv.length ? rv.reduce((s, x) => s + x, 0) / rv.length : team;
    const exp = 1 / (1 + Math.pow(10, (opp - team) / 1.5));
    const [g1, g2] = gamesOf(p.sets); const mult = 1 + Math.min(.5, Math.abs(g1 - g2) / 14);
    const K = n < 10 ? .22 : n < 30 ? .12 : .08;
    lv = Math.max(.5, Math.min(7, lv + K * mult * ((won ? 1 : 0) - exp))); n++;
    hist.push({ f: a.fecha, n: lv, id: a.id });
  }
  return { nivel: lv, n, hist, fiab: Math.min(100, Math.round(n / 15 * 100)) };
}
function syncNivel() {
  const r = computeNivel(); if (!r) return; const P = state.perfil.padel || {};
  if (Math.abs((P.nivel || 0) - r.nivel) > .001 || P.n !== r.n) savePerfil({ padel: { ...P, nivel: r.nivel, n: r.n } });
  if (socialOn() && (Math.abs((social.me.nivelPadel || 0) - r.nivel) > .001)) { social.me.nivelPadel = r.nivel; FS().collection("perfiles").doc(me.uid).update({ nivelPadel: Math.round(r.nivel * 100) / 100 }).catch(() => {}); }
}
async function fetchLevels(uids) {
  const need = [...new Set(uids)].filter(u => u && padelLv[u] === undefined); if (!need.length || !socialOn()) return;
  await Promise.all(need.map(u => FS().collection("perfiles").doc(u).get().then(d => { padelLv[u] = d.exists && d.data().nivelPadel ? d.data().nivelPadel : null; }).catch(() => { padelLv[u] = null; })));
}

// ---------- Test de nivel inicial ----------
function openNivelTest() {
  const Q = [
    ["¿Cuánto tiempo llevas jugando?", [["Menos de 6 meses", 1], ["6 meses – 2 años", 2], ["2 – 5 años", 3.2], ["Más de 5 años", 4.2]]],
    ["¿Cuántas veces juegas a la semana?", [["Menos de 1", -.2], ["1 vez", 0], ["2 – 3 veces", .25], ["4 o más", .45]]],
    ["¿Qué tal te defiendes con la pared?", [["Me cuesta mucho", -.5], ["Salgo de las fáciles", 0], ["Las juego con control", .45], ["Las ataco", .8]]],
    ["¿Tu golpe en la red?", [["Voleo poco", -.4], ["Voleas sencillas", 0], ["Bandeja segura", .4], ["Víbora y remate por 3", .85]]],
    ["¿Compites?", [["No", 0], ["Ligas de club", .3], ["Torneos federados", .7]]],
  ];
  const ans = Array(Q.length).fill(null);
  openSheet("Calcula tu nivel", `<p class="small mute" style="margin:-6px 0 12px">5 preguntas para tu nivel de partida (escala 1 a 7). Después se ajusta solo con cada partido que apuntes.</p>
    ${Q.map(([q, os], i) => `<div class="field">${q}<div class="seg" style="flex-wrap:wrap" data-q="${i}">${os.map(([t, v], j) => `<button data-j="${j}">${t}</button>`).join("")}</div></div>`).join("")}
    <div class="err" id="ntE"></div><button class="btn pri block" id="ntOk">Ver mi nivel</button>`, s => {
    $$("[data-q]", s).forEach(g => $$("button", g).forEach(b => b.onclick = () => { ans[+g.dataset.q] = +b.dataset.j; $$("button", g).forEach(x => x.classList.toggle("on", x === b)); }));
    $("#ntOk", s).onclick = () => {
      if (ans.some(x => x === null)) { $("#ntE", s).textContent = "Responde las 5 preguntas."; return; }
      let lv = Q.reduce((t, [q, os], i) => t + os[ans[i]][1], 0); lv = Math.round(Math.max(1, Math.min(6, lv)) * 100) / 100;
      savePerfil({ padel: { ...(state.perfil.padel || {}), nivel0: lv, nivel: lv } }); syncNivel(); closeSheet(); setView("padel"); toast(`Tu nivel de partida: ${fmtNivel(lv)} de 7 · ${nivelTxt(lv)}`); setTimeout(openNivelInfo, 700);
    };
  });
}

// ---------- Estadísticas ----------
function padelStats() {
  const A = padelActs(); const st = { n: A.length, w: 0, l: 0, sw: 0, sl: 0, gw: 0, gl: 0, racha: 0, mejorRacha: 0, comp: {}, riv: {}, lado: { drive: [0, 0], reves: [0, 0] }, club: {}, tie: [0, 0] };
  let cur = 0;
  for (const a of A) {
    const p = a.padel, won = setsWin(p.sets); if (won === null) continue;
    won ? st.w++ : st.l++; cur = won ? Math.max(1, cur + 1) : Math.min(-1, cur - 1); st.mejorRacha = Math.max(st.mejorRacha, cur);
    p.sets.forEach(s => { s[0] > s[1] ? st.sw++ : st.sl++; st.gw += s[0]; st.gl += s[1]; if ((s[0] === 7 && s[1] === 6) || (s[1] === 7 && s[0] === 6)) st.tie[s[0] > s[1] ? 0 : 1]++; });
    const cn = p.comp && p.comp.n; if (cn) { const c = st.comp[cn] = st.comp[cn] || { n: cn, uid: p.comp.uid, w: 0, t: 0 }; c.t++; if (won) c.w++; }
    (p.riv || []).forEach(r => { if (!r.n) return; const x = st.riv[r.n] = st.riv[r.n] || { n: r.n, uid: r.uid, w: 0, t: 0 }; x.t++; if (won) x.w++; });
    if (p.lado && st.lado[p.lado]) { st.lado[p.lado][1]++; if (won) st.lado[p.lado][0]++; }
    if (p.club) { const c = st.club[p.club] = st.club[p.club] || [0, 0]; c[1]++; if (won) c[0]++; }
  }
  st.racha = cur;
  const comps = Object.values(st.comp).filter(c => c.t >= 2).sort((a, b) => b.w / b.t - a.w / a.t || b.t - a.t);
  const rivs = Object.values(st.riv).filter(c => c.t >= 2).sort((a, b) => a.w / a.t - b.w / b.t || b.t - a.t);
  st.mejorPareja = comps[0] || null; st.bestia = rivs.length && rivs[0].w / rivs[0].t < .5 ? rivs[0] : null; st.victima = rivs.length ? [...rivs].reverse().find(r => r.w / r.t > .5) || null : null;
  st.frecuente = Object.values(st.comp).sort((a, b) => b.t - a.t)[0] || null;
  return st;
}

// ---------- Vista Pádel ----------
let padelTab = "resumen", partidosPend = [], quedadas = [], padelLoaded = 0;
function vPadel() {
  const P = state.perfil.padel || {};
  if (padelTab === "pistas") return (P.nivel0 ? `<div class="tabs">${[["resumen", "Resumen"], ["partidos", "Partidos"], ["pistas", "Pistas"], ["aprende", "Aprende"]].map(([k, n]) => `<button data-pt="${k}" class="${padelTab === k ? "on" : ""}">${n}</button>`).join("")}</div>`
    : `<div class="row" style="align-items:center;margin-bottom:10px"><button class="btn sm" id="piBack" style="flex:0 0 auto">${svg("back")}Pádel</button><h3 style="margin:0 0 0 6px">Pistas y clubes</h3></div>`) + pistasHTML();
  if (!P.nivel0) return `<div class="hero">
      <div class="lbl" style="color:var(--mute)">Pádel</div><h2 style="font-size:26px;letter-spacing:-.5px;margin:8px 0 10px">Tu pádel, al siguiente nivel</h2>
      <p class="small" style="color:var(--mute);line-height:1.55">Apunta tus partidos, etiqueta a tus amigos y la app calcula <b>tu nivel del 1 al 7</b> (la escala de los clubes), que sube o baja según contra quién ganas. Descubre con quién juegas mejor, quién es tu <b>bestia negra</b> y qué pala te va de verdad.</p>
      <button class="btn block" id="pdTest" style="margin-top:16px;background:var(--ink);color:#fff;border:0">Calcular mi nivel</button></div>
      <button class="item pdPis"><span style="font-size:22px;width:28px;text-align:center">📍</span><div style="flex:1"><div style="font-weight:700">Buscar pistas</div><div class="tiny mute">Clubes y pistas de pádel en tu ciudad</div></div>${svg("chev", "chev")}</button>`;
  const r = computeNivel(), st = padelStats(); const lv = r.nivel; const prev = r.hist.length > 1 ? r.hist[Math.max(0, r.hist.length - 6)].n : lv; const tr = lv - prev;
  const tabs = `<div class="tabs">${[["resumen", "Resumen"], ["partidos", "Partidos"], ["pistas", "Pistas"], ["aprende", "Aprende"]].map(([k, n]) => `<button data-pt="${k}" class="${padelTab === k ? "on" : ""}">${n}</button>`).join("")}</div>`;
  const pend = partidosPend.length ? `<div class="card" style="border-color:rgba(132,204,22,.35)"><h3>${svg("bell")}Te han apuntado en ${partidosPend.length} partido${partidosPend.length > 1 ? "s" : ""}</h3>${partidosPend.map(pendRow).join("")}</div>` : "";
  let body = "";
  if (padelTab === "resumen") {
    body = `<div class="hero">
      <div class="ringwrap"><div><div class="lbl" style="color:var(--mute)">Tu nivel</div><div style="display:flex;align-items:baseline;gap:6px"><div class="big num" style="color:var(--vt)">${fmtNivel(lv)}</div><span class="num" style="color:var(--mute);font-size:22px">/ 7</span></div><div class="small" style="color:var(--mute)">${nivelTxt(lv)}${r.n ? ` · fiabilidad ${r.fiab}%` : " · nivel de partida"}</div><button class="tiny" id="pdHow" style="color:var(--vt);font-weight:700;margin-top:6px;text-decoration:underline">¿Cómo se calcula?</button></div>
        <div style="margin-left:auto;text-align:right">${r.n ? `<span class="chip ${tr >= 0 ? "volt" : "hot"}">${tr >= 0 ? "▲" : "▼"} ${nf(Math.abs(tr), 2)}</span><div class="tiny mute" style="margin-top:6px">últimos 5</div>` : ""}</div></div>
      ${r.hist.length > 2 ? `<div class="chartbox" style="margin-top:10px">${lineChart(r.hist.map(h => h.n).concat(r.hist.length < 5 ? Array(5 - r.hist.length).fill(lv) : []), "#65a30d", { fmt: v => nf(v, 2) })}</div>` : ""}
      <button class="btn block" id="pdAdd" style="margin-top:14px;background:var(--ink);color:#fff;border:0">${svg("plus")}Apuntar partido</button></div>
      ${pend}
      ${st.n ? `<div class="grid3"><div class="stat"><div class="k">Partidos</div><div class="v num">${st.n}</div></div><div class="stat"><div class="k">Victorias</div><div class="v num" style="color:var(--vt)">${Math.round(st.w / Math.max(1, st.w + st.l) * 100)}<small>%</small></div></div><div class="stat"><div class="k">Racha</div><div class="v num" style="color:${st.racha >= 0 ? "var(--volt)" : "var(--neg)"}">${st.racha > 0 ? "+" : ""}${st.racha}</div></div></div>
      <div class="grid2" style="margin-top:10px"><div class="stat"><div class="k">Sets</div><div class="v num" style="font-size:24px">${st.sw}<small>–${st.sl}</small></div></div><div class="stat"><div class="k">Juegos</div><div class="v num" style="font-size:24px">${st.gw}<small>–${st.gl}</small></div></div></div>
      ${rankAmigosHTML()}
      <div class="sec">Tus datos</div><div class="card" style="padding:4px 14px">
        ${st.mejorPareja ? statItem("🤝", "Mejor pareja", st.mejorPareja.n, `${st.mejorPareja.w}/${st.mejorPareja.t} ganados`, st.mejorPareja.uid) : statItem("🤝", "Mejor pareja", "–", "juega 2+ partidos con alguien")}
        ${st.bestia ? statItem("😈", "Tu bestia negra", st.bestia.n, `te ha ganado ${st.bestia.t - st.bestia.w} de ${st.bestia.t}`, st.bestia.uid) : statItem("😈", "Tu bestia negra", "Nadie", "¡de momento!")}
        ${st.victima ? statItem("🎯", "Tu víctima favorita", st.victima.n, `le has ganado ${st.victima.w} de ${st.victima.t}`, st.victima.uid) : ""}
        ${statItem("🔥", "Mejor racha", st.mejorRacha > 0 ? `${st.mejorRacha} victorias seguidas` : "–", "")}
        ${st.lado.drive[1] || st.lado.reves[1] ? statItem("↔️", "Por lado", `Drive ${st.lado.drive[1] ? Math.round(st.lado.drive[0] / st.lado.drive[1] * 100) + "%" : "–"} · Revés ${st.lado.reves[1] ? Math.round(st.lado.reves[0] / st.lado.reves[1] * 100) + "%" : "–"}`, "porcentaje de victorias") : ""}
        ${st.tie[0] + st.tie[1] ? statItem("🧊", "Tie-breaks", `${st.tie[0]} ganados · ${st.tie[1]} perdidos`, "") : ""}
      </div>
      <button class="item" id="pdGear" style="margin-top:4px"><span style="font-size:22px;width:28px;text-align:center">🎾</span><div style="flex:1"><div style="font-weight:700">¿Qué pala me va?</div><div class="tiny mute">Recomendador según tu nivel (${fmtNivel(lv)}) y tu juego</div></div>${svg("chev", "chev")}</button>
      <button class="item pdPis"><span style="font-size:22px;width:28px;text-align:center">📍</span><div style="flex:1"><div style="font-weight:700">Buscar pistas</div><div class="tiny mute">Clubes y pistas de pádel en tu ciudad</div></div>${svg("chev", "chev")}</button>
      <button class="item" id="pdFind"><span style="font-size:22px;width:28px;text-align:center">👥</span><div style="flex:1"><div style="font-weight:700">Buscar partido</div><div class="tiny mute">Partidos abiertos de tu nivel</div></div>${svg("chev", "chev")}</button>` : `<div class="card empty">${svg("padel")}<p>Apunta tu primer partido y empieza a mover tu nivel.</p></div>`}`;
  } else if (padelTab === "partidos") {
    const A = padelActs().reverse();
    body = pend + `<button class="btn pri block" id="pdAdd" style="margin-bottom:14px">${svg("plus")}Apuntar partido</button>` + (A.length ? A.map(matchCard).join("") : `<div class="card empty">${svg("padel")}<p>Todavía no hay partidos.</p></div>`);
  } else if (padelTab === "aprende") body = aprendeHTML();
  else body = `<button class="btn sm" id="bqBack" style="margin-bottom:12px">${svg("back")}Volver</button>` + buscarHTML();
  return tabs + body;
}
function statItem(e, k, v, s, uid) { return `<div class="item" ${uid ? `data-user="${uid}" style="cursor:pointer"` : ""}><span style="font-size:22px;width:28px;text-align:center">${e}</span><div style="min-width:0;flex:1"><div class="small mute">${k}</div><div style="font-weight:700">${esc(v)}</div>${s ? `<div class="tiny mute">${s}</div>` : ""}</div>${uid ? svg("chev", "chev") : ""}</div>`; }
function matchCard(a) {
  const p = a.padel, won = setsWin(p.sets); const h = computeNivel(); const i = h ? h.hist.findIndex(x => x.id === a.id) : -1; const d = i > 0 ? h.hist[i].n - h.hist[i - 1].n : null;
  return `<button class="act" data-act="${a.id}"><div class="hd"><div class="sp" style="background:${won ? "var(--volt-soft)" : "rgba(248,113,113,.12)"};color:${won ? "var(--volt)" : "var(--neg)"};font-weight:800">${won ? "V" : "D"}</div><div style="min-width:0;flex:1"><div class="t">${esc(p.club || "Partido de pádel")}${p.tipo && p.tipo !== "amistoso" ? ` <span class="badge" style="margin:0">${p.tipo}</span>` : ""}</div><div class="s">${relDate(a.fecha)}${p.lado ? ` · ${p.lado === "reves" ? "revés" : "drive"}` : ""}</div></div>${d != null ? `<span class="num" style="font-size:16px;color:${d >= 0 ? "var(--volt)" : "var(--neg)"}">${d >= 0 ? "+" : ""}${nf(d, 2)}</span>` : ""}</div>
    <div class="score"><div><b>Tú</b>${p.comp && p.comp.n ? ` y ${esc(p.comp.n)}` : ""}</div>${p.sets.map(s => `<span class="${s[0] > s[1] ? "w" : ""}">${s[0]}</span>`).join("")}</div>
    <div class="score"><div class="mute">${(p.riv || []).map(r => esc(r.n || "?")).join(" y ") || "Rivales"}</div>${p.sets.map(s => `<span class="${s[1] > s[0] ? "w" : ""}">${s[1]}</span>`).join("")}</div></button>`;
}
function pendRow(m) {
  const mine = m.equipos.a.some(x => x.uid === me.uid) ? "a" : "b"; const sets = unpackSets(m.sets).map(s => mine === "a" ? s : [s[1], s[0]]); const won = setsWin(sets);
  const by = m.equipos.a.concat(m.equipos.b).find(x => x.uid === m.creador);
  return `<div class="meal" style="align-items:flex-start"><div class="mi" style="color:${won ? "var(--volt)" : "var(--neg)"};font-weight:800">${won ? "V" : "D"}</div><div style="flex:1;min-width:0"><div style="font-weight:600">${esc(by ? by.n : "Alguien")} te ha apuntado</div><div class="small mute">${setsStr(sets)} · ${esc(m.club || "pádel")} · ${relDate(m.fecha)}</div>
    <div class="row" style="margin-top:8px"><button class="btn sm pri" data-pok="${m.id}">${svg("check")}Confirmar</button><button class="btn sm" data-pno="${m.id}">No era yo</button></div></div></div>`;
}
WIRE.padel = () => {
  $$(".pdPis").forEach(b => b.onclick = () => { padelTab = "pistas"; render(); window.scrollTo(0, 0); });
  if (padelTab === "pistas") { const pb = $("#piBack"); if (pb) pb.onclick = () => { padelTab = "resumen"; render(); }; $$("[data-pt]").forEach(b => b.onclick = () => { padelTab = b.dataset.pt; render(); }); wirePistas($("#view")); return; }
  const hw = $("#pdHow"); if (hw) hw.onclick = openNivelInfo;
  const t = $("#pdTest"); if (t) { t.onclick = openNivelTest; return; }
  $$("[data-pt]").forEach(b => b.onclick = () => { padelTab = b.dataset.pt; render(); });
  $$("#pdAdd").forEach(b => b.onclick = () => openPadelMatch()); const f = $("#pdFind"); if (f) f.onclick = () => { padelTab = "buscar"; render(); };
  const g = $("#pdGear"); if (g) g.onclick = () => { gearSeg = "palas"; openRecPala(); };
  if (!(state.perfil.padel || {}).nivel0) return;
  wireActs(); $$("[data-user]").forEach(b => b.onclick = () => socialOn() ? openUser(b.dataset.user) : null);
  $$("[data-pok]").forEach(b => b.onclick = () => confirmPartido(b.dataset.pok, true)); $$("[data-pno]").forEach(b => b.onclick = () => confirmPartido(b.dataset.pno, false));
  if (padelTab === "buscar") { wireBuscar(); const bb = $("#bqBack"); if (bb) bb.onclick = () => { padelTab = "resumen"; render(); }; }
  if (padelTab === "aprende") wireAprende($("#view"));
  loadPadelSocial();
};
async function loadPadelSocial(force = false) {
  if (!socialOn() || (!force && Date.now() - padelLoaded < 45e3)) return; padelLoaded = Date.now();
  try {
    const q = await FS().collection("partidos").where("jugadores", "array-contains", me.uid).get();
    const all = q.docs.map(d => ({ id: d.id, ...d.data() }));
    partidosPend = all.filter(m => m.creador !== me.uid && !(m.conf || {})[me.uid] && !(m.rech || {})[me.uid] && !Object.values(state.act).some(a => a.padel && a.padel.pid === m.id));
    if (social.following && social.following.size) await fetchProfiles([...social.following]);
    const uids = []; padelActs().forEach(a => { const p = a.padel; [p.comp, ...(p.riv || [])].forEach(x => x && x.uid && uids.push(x.uid)); }); await fetchLevels(uids);
    const td = todayStr(); const qq = await FS().collection("quedadas").where("fecha", ">=", td).orderBy("fecha").limit(40).get(); quedadas = qq.docs.map(d => ({ id: d.id, ...d.data() }));
    syncNivel();
  } catch (e) { console.warn(e); }
  if (view === "padel" && !sheetOpen) render();
}
async function confirmPartido(id, ok) {
  const m = partidosPend.find(x => x.id === id); if (!m) return;
  try {
    await FS().collection("partidos").doc(id).update({ [`${ok ? "conf" : "rech"}.${me.uid}`]: true });
    if (ok) {
      const side = m.equipos.a.some(x => x.uid === me.uid) ? "a" : "b", other = side === "a" ? "b" : "a";
      const sets = unpackSets(m.sets).map(s => side === "a" ? s : [s[1], s[0]]); const comp = m.equipos[side].find(x => x.uid !== me.uid) || null;
      const a = { id: uid("a"), deporte: "padel", fecha: m.fecha, dur: m.dur || 5400, dist: 0, fuente: "partido", padel: { sets, comp, riv: m.equipos[other], club: m.club || "", tipo: m.tipo || "amistoso", lado: null, pid: id } };
      fillPadelAct(a); saveItem("act", a); toast("Partido añadido a tu historial");
    } else toast("Partido rechazado");
    partidosPend = partidosPend.filter(x => x.id !== id); syncNivel(); render();
  } catch (e) { console.warn(e); toast("No se pudo"); }
}
function fillPadelAct(a) {
  const p = a.padel; a.ganado = setsWin(p.sets); a.resultado = setsStr(p.sets); a.companero = p.comp ? p.comp.n : ""; a.rivales = (p.riv || []).map(r => r.n).filter(Boolean).join(" y ");
  a.kcal = estKcal("padel", a.dur, 0); a.titulo = a.titulo || (p.club ? `Pádel en ${p.club}` : "Partido de pádel");
}

// ---------- Apuntar partido ----------
function openPadelMatch(base = {}) {
  const now = new Date(base.fecha || Date.now()); const P = state.perfil.padel || {};
  const sets = [[6, 4], [6, 4], [0, 0]]; let lado = P.lado || null, tipo = "amistoso";
  const people = socialOn() ? [...social.following] : [];
  const pick = (id, ph) => `<input id="${id}" list="pl" placeholder="${ph}" autocomplete="off" autocapitalize="words" style="margin:0">`;
  const clubTxt = P.club ? esc(P.club) : "sin club";
  openSheet("Apuntar partido", `
    <div class="field" style="margin-bottom:10px">Resultado <span class="tiny mute">(tu equipo – rivales)</span><div id="pmS"></div></div>
    <div class="card pmIn" style="padding:12px;margin-bottom:10px">
      <div class="small mute" style="margin-bottom:6px">Tú y…</div>${pick("pmComp", "Compañero/a (nombre o @usuario)")}
      <div class="small mute" style="margin:12px 0 6px">Contra</div><div class="row" style="gap:8px">${pick("pmR1", "Rival 1")}${pick("pmR2", "Rival 2")}</div>
      <div id="pmQ" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px"></div></div>
    <datalist id="pl"></datalist>
    <details id="pmMore" style="margin-bottom:12px"><summary class="small mute" style="padding:8px 2px;cursor:pointer">Más detalles · <span style="color:var(--ink)">hoy, ${pad(now.getHours())}:${pad(now.getMinutes())}, ${clubTxt}</span></summary>
      <div class="row" style="margin-top:8px"><label class="field">Fecha<input id="pmF" type="date" value="${dstr(now)}"></label><label class="field">Hora<input id="pmH" type="time" value="${pad(now.getHours())}:${pad(now.getMinutes())}"></label><label class="field">Min<input id="pmD" type="number" inputmode="numeric" value="${Math.round((base.dur || 5400) / 60)}"></label></div>
      <label class="field">Club / pista<input id="pmC" list="clubs" value="${esc(P.club || "")}" placeholder="Ej. Club de Pádel Las Rozas"></label>
      <datalist id="clubs">${[...new Set(padelActs().map(a => a.padel.club).filter(Boolean))].map(c => `<option value="${esc(c)}">`).join("")}</datalist>
      <div class="field">Tu lado<div class="seg" id="pmL"><button data-v="drive" class="${lado === "drive" ? "on" : ""}">Drive</button><button data-v="reves" class="${lado === "reves" ? "on" : ""}">Revés</button></div></div>
      <div class="field">Tipo<div class="seg" id="pmT"><button data-v="amistoso" class="on">Amistoso</button><button data-v="liga">Liga</button><button data-v="torneo">Torneo</button></div></div></details>
    ${socialOn() ? `<p class="tiny mute" style="margin-bottom:10px">Etiqueta con @ a tus amigos de Pádel+: les llega el partido y lo confirman con un toque.</p>` : ""}
    <div class="err" id="pmE"></div><button class="btn block" id="pmOk" style="background:var(--ink);color:#fff;border:0">Guardar partido</button>`, async s => {
    const dl = $("#pl", s); const opts = [];
    if (people.length) { await fetchProfiles(people); people.forEach(u => { const p = profCache[u]; if (p) opts.push(`@${p.usuario}`); }); }
    const names = new Set(); padelActs().forEach(a => [a.padel.comp, ...(a.padel.riv || [])].forEach(x => x && x.n && !x.uid && names.add(x.n)));
    dl.innerHTML = [...opts, ...names].map(o => `<option value="${esc(o)}">`).join("");
    const freq = {}; padelActs().slice(-30).forEach(x => [x.padel.comp, ...(x.padel.riv || [])].forEach(y => { if (!y || !y.n) return; const k = y.uid && profCache[y.uid] ? "@" + profCache[y.uid].usuario : y.n; freq[k] = (freq[k] || 0) + 1; }));
    const quick = [...new Set([...Object.keys(freq).sort((p, q) => freq[q] - freq[p]), ...opts])].slice(0, 10);
    const fields = ["pmComp", "pmR1", "pmR2"].map(i => $("#" + i, s));
    const drawQ = () => { const used = fields.map(f => f.value.trim()); $("#pmQ", s).innerHTML = quick.filter(q => !used.includes(q)).map(q => `<button class="chip" data-q="${esc(q)}" style="cursor:pointer">+ ${esc(q)}</button>`).join("");
      $$("#pmQ [data-q]", s).forEach(c => c.onclick = () => { const f = fields.find(f => !f.value.trim()); if (f) { f.value = c.dataset.q; drawQ(); } }); };
    if (base.pre) base.pre.forEach((v, i) => { if (fields[i] && v) fields[i].value = v; });
    fields.forEach(f => f.addEventListener("input", drawQ)); drawQ();
    const drawSets = () => { $("#pmS", s).innerHTML = sets.map((st, i) => `<div class="setrow"><span class="tiny mute">Set ${i + 1}</span>${[0, 1].map(k => `<div class="stp"><button data-s="${i}" data-k="${k}" data-d="-1">−</button><b class="num">${st[k]}</b><button data-s="${i}" data-k="${k}" data-d="1">+</button></div>`).join(`<span class="mute">–</span>`)}</div>`).join("") + `<div class="tiny mute" style="margin-top:4px">Deja el 3.º set en 0–0 si no se jugó.</div>`;
      $$("#pmS [data-s]", s).forEach(b => b.onclick = () => { const st = sets[+b.dataset.s]; st[+b.dataset.k] = Math.max(0, Math.min(7, st[+b.dataset.k] + +b.dataset.d)); drawSets(); }); };
    drawSets();
    $$("#pmL [data-v]", s).forEach(b => b.onclick = () => { lado = lado === b.dataset.v ? null : b.dataset.v; $$("#pmL [data-v]", s).forEach(x => x.classList.toggle("on", x.dataset.v === lado)); });
    $$("#pmT [data-v]", s).forEach(b => b.onclick = () => { tipo = b.dataset.v; $$("#pmT [data-v]", s).forEach(x => x.classList.toggle("on", x === b)); });
    let saving = false;
    $("#pmOk", s).onclick = () => {
      if (saving) return; // evita doble toque = partidos duplicados
      const played = sets.filter(x => x[0] + x[1] > 0); const won = setsWin(played);
      if (!played.length || won === null) { $("#pmE", s).textContent = "Pon el resultado (tiene que haber un ganador)."; return; }
      const btn = $("#pmOk", s); saving = true; btn.disabled = true; btn.textContent = "Guardando…"; $("#pmE", s).textContent = "";
      let a;
      try {
        const resolve = v => { v = (v || "").trim(); if (!v) return null; if (v.startsWith("@")) { const p = Object.values(profCache).find(x => x.usuario === v.slice(1).toLowerCase()); if (p && p.uid) return { uid: p.uid, n: p.nombre || p.usuario || v.slice(1) }; } return { n: v.replace(/^@/, "") }; };
        const comp = resolve($("#pmComp", s).value), riv = [resolve($("#pmR1", s).value), resolve($("#pmR2", s).value)].filter(Boolean);
        const club = $("#pmC", s).value.trim();
        let f = new Date(`${$("#pmF", s).value}T${$("#pmH", s).value || "19:00"}`); if (isNaN(f)) f = new Date();
        const fecha = f.toISOString();
        a = { id: uid("a"), deporte: "padel", fecha, dur: (+$("#pmD", s).value || 90) * 60, dist: 0, fuente: base.fuente || "manual", padel: { sets: played, comp, riv, club, tipo, lado } };
        const tagged = [comp, ...riv].filter(x => x && x.uid);
        if (tagged.length && socialOn()) {
          const pid = uid("m"); a.padel.pid = pid;
          const eq = { a: [{ uid: me.uid, n: (social.me && social.me.nombre) || me.name || "" }, ...(comp ? [comp] : [])], b: riv };
          // En segundo plano: no esperamos al servidor (con poca cobertura se quedaba colgado)
          Promise.resolve().then(() => FS().collection("partidos").doc(pid).set({ creador: me.uid, fecha, dur: a.dur, club, tipo, sets: packSets(played), equipos: eq, jugadores: [me.uid, ...tagged.map(x => x.uid)], conf: { [me.uid]: true }, t: Date.now() }))
            .then(() => tagged.forEach(x => aviso(x.uid, { tipo: "comentario", texto: `te ha apuntado en un partido de pádel (${setsStr(played)})` })))
            .catch(e => console.warn("partido compartido", e));
        }
        fillPadelAct(a);
        saveItem("act", a);
        try { savePerfil({ padel: { ...(state.perfil.padel || {}), club: club || P.club || "", lado: lado || P.lado || null } }); } catch (e) { console.warn(e); }
        try { syncNivel(); } catch (e) { console.warn(e); }
      } catch (e) {
        console.error("guardar partido", e); saving = false; btn.disabled = false; btn.textContent = "Guardar partido";
        $("#pmE", s).textContent = "No se pudo guardar el partido. Inténtalo otra vez."; return;
      }
      closeSheet();
      // Tarjeta para Instagram siempre al guardar
      setTimeout(() => { try { openShareMatch(a, true); } catch (e) { console.warn(e); toast(won ? "¡Victoria! 🏆" : "Partido guardado"); } }, 120);
    };
  });
}
let profCache = {};
async function fetchProfiles(uids) { const need = uids.filter(u => !profCache[u]); await Promise.all(need.map(u => FS().collection("perfiles").doc(u).get().then(d => { if (d.exists) { profCache[u] = d.data(); if (d.data().nivelPadel) padelLv[u] = d.data().nivelPadel; } }).catch(() => {}))); }

// ---------- Buscar partido (quedadas) ----------
let qCity = "";
function buscarHTML() {
  if (!socialOn()) return `<div class="card empty">${svg("users")}<p>Para buscar partido necesitas tu perfil en la comunidad.</p><button class="btn sm pri" id="bqJoin" style="margin-top:10px">Crear perfil</button></div>`;
  const lv = (computeNivel() || {}).nivel || 0; const list = quedadas.filter(q => !qCity || (q.ciudad || "").toLowerCase().includes(qCity.toLowerCase()) || (q.club || "").toLowerCase().includes(qCity.toLowerCase()));
  return `<div class="row" style="margin-bottom:12px"><label class="field" style="margin:0;flex:1"><input id="bqC" placeholder="Filtrar por ciudad o club" value="${esc(qCity)}" style="margin:0"></label><button class="btn" id="bqNew" style="flex:none;background:var(--ink);color:#fff;border:0">${svg("plus")}Crear</button></div>
    ${list.length ? list.map(q => quedadaCard(q, lv)).join("") : `<div class="card empty">${svg("padel")}<p>No hay partidos abiertos${qCity ? " ahí" : ""}.<br>¡Crea uno y que se apunte gente de tu nivel!</p></div>`}`;
}
function quedadaCard(q, lv) {
  const libres = (q.plazas || 4) - q.jugadores.length, dentro = q.uids.includes(me.uid), fit = lv && lv >= (q.nivelMin || 0) - .25 && lv <= (q.nivelMax || 7) + .25; const d = parseD(q.fecha);
  return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><div style="font-weight:700;font-size:16px">${esc(q.club || "Partido")}</div><div class="small mute">${DIAS_L[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)} · ${esc(q.hora || "")}${q.ciudad ? ` · ${esc(q.ciudad)}` : ""}</div></div>
    <div style="text-align:right"><div class="chip" style="color:var(--vt)">Nivel ${nf(q.nivelMin || 0, 1)}–${nf(q.nivelMax || 7, 1)}</div>${fit ? `<div class="tiny" style="color:var(--vt);margin-top:4px">✓ tu nivel</div>` : ""}</div></div>
    <div style="display:flex;gap:8px;margin:12px 0">${Array.from({ length: q.plazas || 4 }, (_, i) => { const j = q.jugadores[i]; return j ? `<button data-user="${j.uid}" style="text-align:center;flex:1">${avatar(j, 40)}<div class="tiny" style="margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(j.n.split(" ")[0])}</div>${j.nv ? `<div class="tiny mute">${nf(j.nv, 2)}</div>` : ""}</button>` : `<div style="flex:1;text-align:center"><div style="width:40px;height:40px;border-radius:50%;border:2px dashed var(--line2);margin:0 auto;display:grid;place-items:center;color:var(--mute2)">+</div><div class="tiny mute" style="margin-top:4px">Libre</div></div>`; }).join("")}</div>
    ${q.notas ? `<p class="small mute" style="margin-bottom:10px">${esc(q.notas)}</p>` : ""}
    <div class="row">${q.creador === me.uid ? `<button class="btn sm danger" data-qdel="${q.id}">Cancelar</button>` : dentro ? `<button class="btn sm" data-qout="${q.id}">Salirme</button>` : libres > 0 ? `<button class="btn sm pri" data-qin="${q.id}">Apuntarme</button>` : `<button class="btn sm" disabled>Completo</button>`}${q.creador !== me.uid ? `<button class="btn sm" data-dm="${q.creador}">${svg("mail")}Escribir</button>` : ""}</div></div>`;
}
function wireBuscar() {
  const j = $("#bqJoin"); if (j) { j.onclick = () => store.kind === "firebase" ? openPerfilPublico() : null; return; }
  let to; $("#bqC").oninput = e => { clearTimeout(to); to = setTimeout(() => { qCity = e.target.value.trim(); render(); setTimeout(() => { const i = $("#bqC"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 0); }, 500); };
  $("#bqNew").onclick = openQuedada;
  $$("[data-qin]").forEach(b => b.onclick = () => joinQuedada(b.dataset.qin, true)); $$("[data-qout]").forEach(b => b.onclick = () => joinQuedada(b.dataset.qout, false));
  $$("[data-qdel]").forEach(b => b.onclick = () => confirmSheet("¿Cancelar partido?", "Se borrará para todos los apuntados.", "Cancelar partido", async () => { await FS().collection("quedadas").doc(b.dataset.qdel).delete().catch(() => {}); quedadas = quedadas.filter(q => q.id !== b.dataset.qdel); closeSheet(); }));
  $$("[data-dm]").forEach(b => b.onclick = () => openChatWith(b.dataset.dm));
}
function meJugador() { const lv = (computeNivel() || {}).nivel; return { uid: me.uid, n: social.me.nombre, color: social.me.color, nv: lv ? Math.round(lv * 100) / 100 : null }; }
async function joinQuedada(id, entrar) {
  const q = quedadas.find(x => x.id === id); if (!q) return; const yo = meJugador();
  const jug = entrar ? [...q.jugadores, yo] : q.jugadores.filter(j => j.uid !== me.uid), uids = entrar ? [...q.uids, me.uid] : q.uids.filter(u => u !== me.uid);
  try { await FS().collection("quedadas").doc(id).update({ jugadores: jug, uids }); q.jugadores = jug; q.uids = uids;
    if (entrar) { aviso(q.creador, { tipo: "comentario", texto: `se ha apuntado a tu partido en ${q.club || "pádel"}` }); toast("¡Apuntado! 🎾"); } else toast("Te has salido"); render();
  } catch (e) { console.warn(e); toast("No se pudo"); }
}
function openQuedada() {
  const P = state.perfil.padel || {}; const lv = (computeNivel() || {}).nivel || 3; const tm = addDays(new Date(), 1);
  openSheet("Crear partido abierto", `<label class="field">Club<input id="qdC" value="${esc(P.club || "")}" placeholder="Club o pista"></label>
    <div class="row"><label class="field">Ciudad<input id="qdCi" value="${esc(social.me.ciudad || "")}"></label><label class="field">Día<input id="qdF" type="date" value="${dstr(tm)}"></label><label class="field">Hora<input id="qdH" type="time" value="19:00"></label></div>
    <div class="row"><label class="field">Nivel mínimo<input id="qdMin" type="number" step="0.25" value="${nf(Math.max(1, lv - .5), 2).replace(",", ".")}"></label><label class="field">Nivel máximo<input id="qdMax" type="number" step="0.25" value="${nf(Math.min(7, lv + .5), 2).replace(",", ".")}"></label></div>
    <div class="field">Ya somos<div class="seg" id="qdN"><button data-v="1" class="on">Solo yo</button><button data-v="2">2</button><button data-v="3">3 (falta 1)</button></div></div>
    <label class="field">Notas (opcional)<input id="qdNo" maxlength="120" placeholder="Pista cubierta, pagamos a medias…"></label>
    <button class="btn block" id="qdOk" style="background:var(--ink);color:#fff;border:0">Publicar</button>`, s => {
    let ya = 1; $$("#qdN [data-v]", s).forEach(b => b.onclick = () => { ya = +b.dataset.v; $$("#qdN [data-v]", s).forEach(x => x.classList.toggle("on", x === b)); });
    $("#qdOk", s).onclick = async () => {
      const club = $("#qdC", s).value.trim(); if (!club) { toast("Pon el club"); return; }
      const yo = meJugador(); const extra = Array.from({ length: ya - 1 }, (_, i) => ({ uid: `${me.uid}_inv${i}`, n: `Invitado de ${social.me.nombre.split(" ")[0]}`, color: "#64748b" }));
      const d = { creador: me.uid, club, ciudad: $("#qdCi", s).value.trim(), fecha: $("#qdF", s).value, hora: $("#qdH", s).value, nivelMin: parseFloat($("#qdMin", s).value) || 1, nivelMax: parseFloat($("#qdMax", s).value) || 7, plazas: 4, jugadores: [yo, ...extra], uids: [me.uid, ...extra.map(x => x.uid)], notas: $("#qdNo", s).value.trim(), t: Date.now() };
      try { const r = await FS().collection("quedadas").add(d); quedadas.push({ id: r.id, ...d }); quedadas.sort((a, b) => a.fecha.localeCompare(b.fecha)); closeSheet(); toast("Partido publicado 🎾"); } catch (e) { console.warn(e); toast("No se pudo publicar"); }
    };
  });
}

// ---------- Explicación del nivel ----------
function openNivelInfo() {
  const P = state.perfil.padel || {}, r = computeNivel(), lv = r ? r.nivel : null;
  const escala = [[1, 1.5, "Iniciación", "Primeros partidos, aprendiendo golpes"], [1.5, 2.5, "Principiante", "Pasas la bola, peloteos cortos"], [2.5, 3.5, "Intermedio", "Juegas partidos completos, empiezas a usar la pared"], [3.5, 4.5, "Intermedio alto", "Bandeja, globos y buena colocación"], [4.5, 5.5, "Avanzado", "Juego táctico, remates que definen"], [5.5, 7.01, "Competición", "Torneos y ligas de nivel alto"]];
  openSheet("¿Cómo funciona tu nivel?", `
    <p style="line-height:1.55;margin:-4px 0 14px">Tu nivel va <b>del 1 al 7</b>, la misma escala que usan los clubes y Playtomic. Así lo puedes comparar con cualquiera.</p>
    <div class="card" style="padding:6px 14px">${escala.map(([a, b, n, d]) => { const yo = lv != null && lv >= a && lv < b;
      return `<div style="display:flex;gap:12px;align-items:center;padding:10px ${yo ? "8px" : "0"};${yo ? "background:var(--volt-soft);border-radius:12px;" : ""}border-top:1px solid var(--line)"><span class="num" style="width:74px;white-space:nowrap;font-size:17px;color:${yo ? "#facc15" : "var(--mute)"}">${nf(a, 1)}–${nf(Math.min(b, 7), 1)}</span><div style="flex:1"><div style="font-weight:700">${n}${yo ? ` <span class="tiny" style="color:var(--vt)">← tú (${fmtNivel(lv)})</span>` : ""}</div><div class="tiny mute">${d}</div></div></div>`; }).join("")}</div>
    <div class="sec">Cómo sube y baja</div>
    <div class="card">
      <div style="padding:6px 0"><b>1. Empiezas con el test.</b><div class="small mute" style="margin-top:2px">Tus respuestas te dan un nivel de partida.</div></div>
      <div style="padding:8px 0;border-top:1px solid var(--line)"><b>2. Cada partido lo ajusta.</b><div class="small mute" style="margin-top:2px">Si ganas, sube. Si pierdes, baja.</div></div>
      <div style="padding:8px 0;border-top:1px solid var(--line)"><b>3. Importa contra quién.</b><div class="small mute" style="margin-top:2px">Ganar a una pareja mejor que la tuya sube mucho. Perder contra gente mejor apenas baja. Ganar a gente de menos nivel sube poco.</div></div>
      <div style="padding:8px 0;border-top:1px solid var(--line)"><b>4. Importa el resultado.</b><div class="small mute" style="margin-top:2px">Un 6-1 6-2 cuenta más que ganar en el tie-break del tercer set.</div></div>
      <div style="padding:8px 0;border-top:1px solid var(--line)"><b>5. Al principio se mueve más.</b><div class="small mute" style="margin-top:2px">En los primeros partidos el nivel cambia rápido hasta encontrar el tuyo. Luego se estabiliza. La <b>fiabilidad</b> te dice cuánto de seguro es tu nivel.</div></div>
    </div>
    <div class="hint">${svg("info")}<span><b style="color:var(--ink)">Ejemplo:</b> tienes 3,0 y ganas 6-3 6-4 a una pareja de 3,5 → subes unas décimas. Si pierdes contra esa misma pareja, bajas muy poco.</span></div>
    ${P.nivel0 ? `<button class="btn block" id="niRe" style="margin-top:12px">Repetir el test de nivel</button>` : `<button class="btn pri block" id="niRe" style="margin-top:12px">Calcular mi nivel</button>`}`, s => {
    $("#niRe", s).onclick = () => { closeSheet(); setTimeout(openNivelTest, 250); };
  });
}
