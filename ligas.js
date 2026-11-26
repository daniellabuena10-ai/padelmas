// ===== Pádel+ · Ligas: grupos con ranking propio, invitación por enlace y muro =====
// Firestore (sin reglas nuevas): perfiles/{uid}.ligas[] + ligasInfo{codigo:{nombre,sede,creador,t}} · muro en posts {tipo:'liga', liga, uid, texto, t} (sin 'fecha', así no sale en el muro general)

const LIGA_ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
let misLigas = null, ligasCargando = false;
const ligaLink = c => `https://padelmas.club/liga/?c=${c}`;
const ligaCod = () => Array.from({ length: 6 }, () => LIGA_ABC[Math.floor(Math.random() * LIGA_ABC.length)]).join("");

// ---------- Invitación por enlace ----------
(function () {
  try {
    const m = (location.search + location.hash).match(/liga=([A-Z0-9]{6})/i);
    if (m) { localStorage.setItem("pm-liga-inv", m[1].toUpperCase()); history.replaceState(null, "", location.pathname); }
  } catch {}
})();
function ligaPendiente() { try { return localStorage.getItem("pm-liga-inv"); } catch { return null; } }
// Aviso en la portada para quien llega invitado sin cuenta
function ligaBannerLanding() {
  const c = ligaPendiente(); const land = document.getElementById("land"); if (!c || !land || document.getElementById("ligaInv")) return;
  const d = document.createElement("div"); d.id = "ligaInv"; d.className = "ligainv";
  d.innerHTML = `<span style="font-size:26px">🏆</span><div><b>Te han invitado a una liga</b><span>Crea tu cuenta y entra directo: verás la clasificación y quién va primero.</span></div>`;
  land.prepend(d); d.onclick = () => { const b = document.getElementById("goUp"); if (b) b.click(); };
}
setInterval(() => {
  if (!ligaPendiente()) return;
  if (!(typeof me !== "undefined" && me && me.uid)) { ligaBannerLanding(); return; }
  if (window.__shown && typeof socialOn === "function" && socialOn() && !sheetOpen && !window.__ligaInvOpen) { window.__ligaInvOpen = true; openUnirmeLiga(ligaPendiente()); }
}, 1200);

// ---------- Datos ----------
// Cada jugador guarda en su perfil público las ligas a las que pertenece (ligas[]) y sus datos (ligasInfo).
const PERF = () => FS().collection("perfiles");
async function cargarMisLigas(force) {
  if (!socialOn()) return;
  if (ligasCargando || (misLigas && !force)) return;
  ligasCargando = true;
  try {
    const d = await PERF().doc(me.uid).get(); const p = d.exists ? d.data() : {};
    if (social.me) { social.me.ligas = p.ligas || []; social.me.ligasInfo = p.ligasInfo || {}; }
    const info = p.ligasInfo || {};
    misLigas = await Promise.all((p.ligas || []).map(async id => { let n = 0; try { n = (await PERF().where("ligas", "array-contains", id).limit(300).get()).size; } catch {} return { id, ...(info[id] || { nombre: "Liga " + id }), n }; }));
    misLigas.sort((a, b) => (b.t || 0) - (a.t || 0));
    try { localStorage.setItem("pm-ligas", JSON.stringify(misLigas)); } catch {}
  } catch (e) { console.warn("ligas", e); misLigas = misLigas || []; }
  ligasCargando = false;
}
async function leerLiga(id) {
  const q = await PERF().where("ligas", "array-contains", id).limit(300).get();
  const docs = q.docs.map(d => d.data()); if (!docs.length) return null;
  const info = (docs.find(x => x.ligasInfo && x.ligasInfo[id] && x.ligasInfo[id].creador === x.uid) || docs.find(x => x.ligasInfo && x.ligasInfo[id]) || {}).ligasInfo || {};
  return { id, ...(info[id] || { nombre: "Liga " + id }), miembros: docs.map(x => x.uid), perfiles: docs };
}
async function entrarLiga(id, info) {
  await PERF().doc(me.uid).set({ ligas: FV().arrayUnion(id), ligasInfo: { [id]: { nombre: info.nombre, sede: info.sede || "", creador: info.creador, t: info.t || Date.now() } } }, { merge: true });
}
function yoRank() {
  const r = typeof computeNivel === "function" ? computeNivel() : null; const st = typeof padelStats === "function" ? padelStats() : { n: 0, w: 0 };
  return { uid: me.uid, nombre: (social.me && social.me.nombre) || "Tú", color: social.me && social.me.color, nivelPadel: r ? r.nivel : (social.me && social.me.nivelPadel) || null, nPadel: st.n, wPadel: st.w, nivel7: social.me && social.me.nivel7, yo: true };
}
async function clasificacion(L) {
  const rows = (L.perfiles || []).map(p => p.uid === me.uid ? yoRank() : { ...p });
  return rows.sort((a, b) => (b.nivelPadel || 0) - (a.nivelPadel || 0) || (b.nPadel || 0) - (a.nPadel || 0));
}

// ---------- Pestaña Ligas ----------
function ligasHTML() {
  if (!socialOn()) return `<div class="card empty"><p>Las ligas necesitan tu perfil público de la comunidad. Actívalo en Comunidad para crear o unirte a una liga.</p></div>`;
  if (!misLigas) { cargarMisLigas().then(() => { if (view === "padel" && padelTab === "ligas" && !sheetOpen) render(); }); }
  const lista = misLigas || [];
  return `<div class="ligahero"><div class="lgem">🏆</div><h2>Tu liga, tu ranking</h2><p>Crea una liga con tu grupo, tu club o tu americana de los jueves. Cada partido que apuntéis mueve la clasificación.</p>
      <div class="row" style="gap:8px;margin-top:14px"><button class="btn" id="lgNew" style="flex:1;background:var(--ink);color:#fff;border:0">${svg("plus")}Crear liga</button><button class="btn" id="lgJoin" style="flex:1">Tengo un código</button></div></div>
    ${!misLigas ? `<p class="small mute" style="text-align:center;margin:16px 0">Cargando tus ligas…</p>` : lista.length ? `<div class="sec">Tus ligas</div>${lista.map(L => `<button class="ligarow" data-liga="${L.id}"><span class="lgic">${esc((L.nombre || "?")[0].toUpperCase())}</span><span style="flex:1;min-width:0"><b>${esc(L.nombre)}</b><small>${(L.miembros || []).length} jugador${(L.miembros || []).length === 1 ? "" : "es"}${L.sede ? " · " + esc(L.sede) : ""}</small></span><span class="mute">›</span></button>`).join("")}`
      : `<div class="card" style="margin-top:12px"><h3>¿Cómo funciona?</h3><ol class="lgsteps"><li><b>Crea la liga</b> y ponle nombre (“Los del jueves”, “Club X”).</li><li><b>Invita</b> por WhatsApp con el enlace: entran en 10 segundos.</li><li><b>Apuntad vuestros partidos</b>: el nivel de cada uno sube o baja según contra quién gana.</li><li><b>Mirad quién va primero</b> y picaos en el muro de la liga.</li></ol></div>`}`;
}
function wireLigas(root) {
  const n = $("#lgNew", root); if (n) n.onclick = openCrearLiga;
  const j = $("#lgJoin", root); if (j) j.onclick = () => openUnirmeLiga("");
  $$("[data-liga]", root).forEach(b => b.onclick = () => openLiga(b.dataset.liga));
}
// Para quien aún no ha calculado su nivel: las ligas en una hoja
function openMisLigasSheet() {
  openSheet("Ligas", ligasHTML(), s => { wireLigas(s); if (!misLigas) cargarMisLigas().then(() => sheetOpen && openMisLigasSheet()); });
}

// ---------- Crear / unirse ----------
function openCrearLiga() {
  openSheet("Crear liga", `<label class="field">Nombre de la liga<input id="lgN" maxlength="40" placeholder="Ej.: Los del jueves, Liga Club Delicias"></label>
    <label class="field">Club o ciudad <span class="tiny mute">(opcional)</span><input id="lgS" maxlength="40" placeholder="Ej.: Zaragoza"></label>
    <button class="btn block" id="lgOk" style="background:var(--ink);color:#fff;border:0">Crear e invitar</button>`, s => {
    $("#lgOk", s).onclick = async () => {
      const nombre = $("#lgN", s).value.trim(), sede = $("#lgS", s).value.trim(); if (nombre.length < 3) { toast("Ponle un nombre"); return; }
      $("#lgOk", s).disabled = true;
      try {
        let id = ligaCod();
        for (let i = 0; i < 3; i++) { const ex = await PERF().where("ligas", "array-contains", id).limit(1).get(); if (ex.empty) break; id = ligaCod(); }
        await entrarLiga(id, { nombre: nombre.slice(0, 40), sede: sede.slice(0, 40), creador: me.uid, t: Date.now() });
        misLigas = null; rkInicio = null; window.__rkFresh = 0; await cargarMisLigas(true); await rkCargar(); openLiga(id, true);
      } catch (e) { console.warn(e); toast("No se ha podido crear. Inténtalo en un momento."); $("#lgOk", s).disabled = false; }
    };
  });
}
async function openUnirmeLiga(code) {
  if (!code) {
    openSheet("Unirme a una liga", `<label class="field">Código de la liga<input id="lgC" maxlength="6" placeholder="Ej.: K7P2QX" style="text-transform:uppercase;letter-spacing:3px;font-weight:800;font-size:20px"></label><button class="btn block" id="lgCk" style="background:var(--ink);color:#fff;border:0">Buscar liga</button>`,
      s => { $("#lgCk", s).onclick = () => { const c = $("#lgC", s).value.trim().toUpperCase(); if (c.length === 6) openUnirmeLiga(c); else toast("El código tiene 6 caracteres"); }; });
    return;
  }
  let L = null; try { L = await leerLiga(code); } catch (e) { console.warn(e); }
  try { localStorage.removeItem("pm-liga-inv"); } catch {}
  if (!L) { openSheet("Liga no encontrada", `<p class="mute">No existe ninguna liga con el código <b>${esc(code)}</b>. Pide a quien te invitó que te pase el enlace de nuevo.</p>`); return; }
  if ((L.miembros || []).includes(me.uid)) { openLiga(L.id); return; }
  const rows = await clasificacion(L);
  openSheet("Te han invitado", `<div class="ligahero" style="margin-top:0"><div class="lgem">🏆</div><h2>${esc(L.nombre)}</h2><p>${(L.miembros || []).length} jugador${(L.miembros || []).length === 1 ? "" : "es"}${L.sede ? " · " + esc(L.sede) : ""}</p></div>
    ${rows.length ? `<div class="sec">Así va la clasificación</div>${podioHTML(rows)}` : ""}
    <button class="btn block" id="lgIn" style="background:var(--ink);color:#fff;border:0;margin-top:12px">Unirme a la liga</button>`, s => {
    $("#lgIn", s).onclick = async () => {
      try { await entrarLiga(L.id, L); } catch (e) { console.warn(e); toast("No se ha podido entrar. Inténtalo de nuevo."); return; }
      misLigas = null; rkInicio = null; window.__rkFresh = 0; await cargarMisLigas(true); await rkCargar(); toast("¡Ya estás dentro! 🎾"); openLiga(L.id);
      if (!(state.perfil.padel || {}).nivel0 && !(social.me && social.me.nivelPadel) && typeof openNivelTest === "function") setTimeout(() => toast("Calcula tu nivel para aparecer en la clasificación"), 1500);
    };
  });
}

// ---------- Liga: clasificación + muro ----------
function podioHTML(rows) {
  const t = rows.slice(0, 3); if (!t.length) return "";
  const ord = [t[1], t[0], t[2]].filter(Boolean), alt = { 0: 92, 1: 120, 2: 72 };
  return `<div class="podio">${ord.map(p => { const i = rows.indexOf(p); return `<div class="pod p${i + 1}" ${p.yo ? "" : `data-user="${p.uid}"`}>${i === 0 ? `<div class="crown">👑</div>` : ""}${avatar(p, i === 0 ? 56 : 46)}<div class="pn">${esc(p.yo ? "Tú" : (p.nombre || "").split(" ")[0])}</div><div class="pv num">${p.nivelPadel ? fmtNivel(p.nivelPadel) : "–"}</div><div class="pb" style="height:${alt[i]}px"><span>${i + 1}</span></div></div>`; }).join("")}</div>`;
}
async function openLiga(id, recienCreada) {
  let L = null; try { L = await leerLiga(id); } catch (e) { console.warn(e); }
  if (!L) { toast("No se ha encontrado la liga"); return; }
  const rows = await clasificacion(L); const pos = rows.findIndex(r => r.yo) + 1;
  const invTxt = `🏆 Únete a mi liga de pádel "${L.nombre}" en Pádel+ y a ver quién va primero 😏\n\n👉 ${ligaLink(L.id)}\n\n(Código: ${L.id})`;
  const fila = (p, i) => { const d = p.nivelPadel && p.nivel7 ? p.nivelPadel - p.nivel7 : 0; return `<button class="lgfila${p.yo ? " yo" : ""}" ${p.yo ? "" : `data-user="${p.uid}"`}><span class="lgpos">${i + 1}</span>${avatar(p, 34)}<span style="flex:1;min-width:0;text-align:left"><b>${esc(p.yo ? "Tú" : p.nombre || "Jugador")}</b><small>${p.nPadel ? `${p.nPadel} partidos · ${Math.round((p.wPadel || 0) / p.nPadel * 100)}% victorias` : "Sin partidos aún"}</small></span>${Math.abs(d) >= .01 ? `<span class="lgtr ${d > 0 ? "up" : "dn"}">${d > 0 ? "▲" : "▼"}${nf(Math.abs(d), 2)}</span>` : ""}<span class="num lgniv">${p.nivelPadel ? fmtNivel(p.nivelPadel) : "–"}</span></button>`; };
  const yo = rows[pos - 1];
  const msgPos = !yo || !yo.nivelPadel ? `Calcula tu nivel y apunta un partido para entrar en la clasificación.` : pos === 1 ? `Vas primero de la liga 👑 Que no te adelanten.` : `Vas ${pos}º. Te faltan <b style="color:var(--vt)">${nf(rows[pos - 2].nivelPadel - yo.nivelPadel, 2)}</b> para adelantar a ${esc((rows[pos - 2].nombre || "").split(" ")[0])}.`;
  openSheet(esc(L.nombre), `
    ${recienCreada ? `<div class="hint" style="margin-bottom:10px">🎉<span>¡Liga creada! Ahora invita a tu gente: cuantos más seáis, más pique.</span></div>` : ""}
    <div class="lgcab"><div><div class="tiny mute">${(L.miembros || []).length} jugador${(L.miembros || []).length === 1 ? "" : "es"}${L.sede ? " · " + esc(L.sede) : ""}</div><div class="small" style="margin-top:4px">${msgPos}</div></div></div>
    <div class="row" style="gap:8px;margin:12px 0"><button class="btn" id="lgInv" style="flex:1;background:var(--ink);color:#fff;border:0">Invitar por WhatsApp</button><button class="btn" id="lgCopy" style="flex:0 0 auto">Compartir</button></div>
    ${podioHTML(rows)}
    <div class="sec">Clasificación</div><div class="card" style="padding:4px 8px">${rows.map(fila).join("")}</div>
    <button class="btn block" id="lgAdd" style="margin-top:10px">${svg("plus")}Apuntar un partido</button>
    <div class="sec">Muro de la liga</div>
    <div class="lgcompose"><textarea id="lgMsg" rows="2" maxlength="500" placeholder="Reta a alguien, organiza el próximo partido o pica al líder…"></textarea><button class="btn" id="lgSend" style="background:var(--ink);color:#fff;border:0">Enviar</button></div>
    <div id="lgMuro"><p class="small mute" style="text-align:center;margin:12px 0">Cargando…</p></div>
    <p class="tiny mute" style="text-align:center;margin-top:14px">Código de la liga: <b style="letter-spacing:2px">${L.id}</b>${L.creador !== me.uid ? ` · <button class="link" id="lgOut" style="font-size:inherit">Salir de la liga</button>` : ""}</p>`, s => {
    $$("[data-user]", s).forEach(b => b.onclick = () => openUser(b.dataset.user));
    $("#lgInv", s).onclick = () => { const tx = encodeURIComponent(invTxt); if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) location.href = `whatsapp://send?text=${tx}`; else window.open(`https://web.whatsapp.com/send?text=${tx}`, "_blank"); };
    $("#lgCopy", s).onclick = async () => { try { if (navigator.share) await navigator.share({ text: invTxt }); else { await navigator.clipboard.writeText(invTxt); toast("Enlace copiado"); } } catch {} };
    $("#lgAdd", s).onclick = () => { closeSheet(); if ((state.perfil.padel || {}).nivel0) openPadelMatch(); else openNivelTest(); };
    const out = $("#lgOut", s); if (out) out.onclick = () => confirmSheet("Salir de la liga", `¿Seguro que quieres salir de “${esc(L.nombre)}”?`, "Salir", async () => { try { await PERF().doc(me.uid).set({ ligas: FV().arrayRemove(id), ligasInfo: { [id]: FV().delete() } }, { merge: true }); } catch {} misLigas = null; rkInicio = null; window.__rkFresh = 0; try { localStorage.removeItem("pm-rk"); localStorage.removeItem("pm-ligas"); } catch {} closeSheet(); });
    const muro = $("#lgMuro", s);
    const pinta = async () => {
      try {
        const q = await FS().collection("posts").where("liga", "==", id).limit(80).get();
        const M = q.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => m.tipo === "liga").sort((a, b) => (b.t || 0) - (a.t || 0)).slice(0, 40);
        muro.innerHTML = M.length ? M.map(m => `<div class="lgm">${avatar({ nombre: m.nombre, color: m.color }, 32)}<div style="flex:1;min-width:0"><div class="tiny"><b>${esc(m.uid === me.uid ? "Tú" : m.nombre || "Jugador")}</b> <span class="mute">${ago(m.t)}</span></div><div style="line-height:1.4;white-space:pre-wrap">${esc(m.texto)}</div></div>${m.uid === me.uid ? `<button class="link tiny" data-dm="${m.id}">Borrar</button>` : ""}</div>`).join("") : `<p class="small mute" style="text-align:center;margin:12px 0">Todavía no hay mensajes. ¡Rompe el hielo! 🎾</p>`;
        $$("[data-dm]", muro).forEach(b => b.onclick = async () => { try { await FS().collection("posts").doc(b.dataset.dm).delete(); } catch {} pinta(); });
      } catch (e) { muro.innerHTML = `<p class="small mute" style="text-align:center">No se ha podido cargar el muro.</p>`; }
    };
    pinta();
    $("#lgSend", s).onclick = async () => {
      const ta = $("#lgMsg", s), tx = ta.value.trim(); if (!tx) return;
      try { const ref = FS().collection("posts").doc(); await ref.set({ id: ref.id, uid: me.uid, tipo: "liga", liga: id, nombre: (social.me && social.me.nombre) || "Jugador", color: (social.me && social.me.color) || null, texto: tx.slice(0, 500), t: Date.now() }); ta.value = ""; pinta(); }
      catch (e) { toast("No se ha podido enviar"); }
    };
  });
}

// ---------- Ranking en Inicio ----------
let rkInicio = null; // {L, rows} cacheado (también en el móvil para pintar al instante, sin saltos)
try { const c = JSON.parse(localStorage.getItem("pm-rk") || "null"); if (c && c.L && c.rows) { rkInicio = c; rkInicio.rows.forEach(r => { r.yo = r.uid === (localStorage.getItem("pm-rk-uid") || ""); }); } } catch {}
try { const c = JSON.parse(localStorage.getItem("pm-ligas") || "null"); if (Array.isArray(c)) misLigas = c; } catch {}
let rkUltimo = "";
function rkNivelHTML() {
  const P = state.perfil.padel || {}; const r = P.nivel0 && typeof computeNivel === "function" ? computeNivel() : null;
  if (!r) return `<div class="hrkn"><div><div class="lbl">Tu nivel de pádel</div><div class="hrkq">¿Cuál es tu nivel?</div><div class="tiny mute">5 preguntas y lo sabes. Luego sube o baja con cada partido.</div></div></div><button class="btn block" id="hRkTest" style="margin-top:12px;background:var(--ink);color:#fff;border:0">Calcular mi nivel</button>`;
  const st = padelStats(); const d7 = social && social.me && social.me.nivel7 ? r.nivel - social.me.nivel7 : 0;
  return `<div class="hrkn"><div><div class="lbl">Tu nivel de pádel</div><div class="num hrkv">${fmtNivel(r.nivel)}</div><div class="tiny mute">${nivelTxt(r.nivel)}${Math.abs(d7) >= .01 ? ` · <span style="color:${d7 > 0 ? "#15803d" : "#b91c1c"};font-weight:800">${d7 > 0 ? "▲" : "▼"}${nf(Math.abs(d7), 2)} esta semana</span>` : ""}</div></div>
    <div class="hrks"><div><b class="num">${st.n}</b> partidos</div><div><b class="num" style="color:var(--vt)">${st.n ? Math.round(st.w / st.n * 100) : 0}%</b> victorias</div></div></div>`;
}
function rankingInicioHTML() {
  const nv = rkNivelHTML(), hasN = !!(state.perfil.padel || {}).nivel0;
  const btns = hasN ? `<button class="btn" id="hRkAdd" style="background:var(--ink);color:#fff;border:0">${svg("plus")}Apuntar partido</button>` : "";
  const cta = (tit, sub) => `<div class="hrk">${nv}<div class="hrkl"><b>🏆 ${tit}</b><span>${sub}</span><div class="hrkb">${btns}<button class="btn" id="hRkNew">Crear liga</button><button class="btn" id="hRkJoin">Tengo código</button></div></div></div>`;
  if (!(typeof socialOn === "function" && socialOn())) {
    if (typeof me !== "undefined" && me && me.uid && !window.__rkNoSocial) {
      if (!window.__rkWait) { window.__rkWait = 1; let k = 0; const iv = setInterval(() => { if (socialOn() || ++k > 14) { clearInterval(iv); window.__rkWait = 0; if (!socialOn()) window.__rkNoSocial = 1; rkPintar(); } }, 500); }
      if (rkInicio && misLigas && misLigas.length) { /* hay datos guardados: se pintan abajo */ }
      else return `<div class="hrk">${nv}<div class="hrkl"><b>🏆 Tu liga</b><span>Cargando…</span></div></div>`;
    }
    if (!(rkInicio && misLigas && misLigas.length) || window.__rkNoSocial) return cta("Pica a tus amigos", "Crea una liga con tu grupo y mirad quién va primero.");
  }
  try { const cu = localStorage.getItem("pm-rk-uid"); if (cu && cu !== me.uid) { rkInicio = null; misLigas = null; localStorage.removeItem("pm-rk"); localStorage.removeItem("pm-ligas"); localStorage.setItem("pm-rk-uid", me.uid); } } catch {}
  if (!window.__rkFresh && socialOn()) { window.__rkFresh = 1; cargarMisLigas(true).then(rkCargar).then(rkPintar); }
  if (!misLigas || (misLigas.length && !rkInicio)) return `<div class="hrk">${nv}<div class="hrkl"><b>🏆 Tu liga</b><span>Cargando clasificación…</span></div></div>`;
  if (!misLigas.length || !rkInicio) return cta("Pica a tus amigos", "Crea una liga con tu grupo y mirad quién va primero.");
  const yoR = yoRank(); const rows = rkInicio.rows.map(r => r.uid === me.uid ? { ...r, ...yoR } : r).sort((a, b) => (b.nivelPadel || 0) - (a.nivelPadel || 0)); const L = rkInicio.L;
  const pos = rows.findIndex(r => r.yo) + 1, yo = rows[pos - 1];
  const sub = !yo || !yo.nivelPadel ? "Apunta un partido para entrar en la clasificación." : pos === 1 ? "Vas primero 👑 Que no te adelanten." : `Vas ${pos}º de ${rows.length}. Te faltan <b style="color:var(--vt)">${nf(rows[pos - 2].nivelPadel - yo.nivelPadel, 2)}</b> para adelantar a ${esc((rows[pos - 2].nombre || "").split(" ")[0])}.`;
  return `<div class="hrk">${nv}<div class="hrkl"><b>🏆 ${esc(L.nombre)}</b><span>${sub}</span>${rows.length > 1 ? podioHTML(rows) : ""}
    <div class="hrkb">${btns}<button class="btn" id="hRkOpen">Ver la liga</button></div></div></div>`;
}
async function rkCargar() {
  try {
    if (misLigas && misLigas.length) { const L = await leerLiga(misLigas[0].id); if (L) { const rows = await clasificacion(L); rkInicio = { L: { id: L.id, nombre: L.nombre }, rows: rows.map(r => ({ uid: r.uid, nombre: r.nombre, color: r.color, foto: r.foto, nivelPadel: r.nivelPadel, yo: !!r.yo })) }; } }
    else rkInicio = null;
    try { localStorage.setItem("pm-rk", JSON.stringify(rkInicio)); localStorage.setItem("pm-rk-uid", me.uid); } catch {}
  } catch (e) { console.warn(e); }
}
function rkPintar() { const h = document.getElementById("hRank"); if (!h || view !== "inicio") return; const html = rankingInicioHTML(); if (html === h.innerHTML || html === rkUltimo) return; rkUltimo = html; h.innerHTML = html; wireRankingInicio(); }
function wireRankingInicio() {
  const on = (id, f) => { const e = document.getElementById(id); if (e) e.onclick = f; };
  on("hRkNew", () => socialOn() ? openCrearLiga() : (padelTab = "ligas", setView("padel")));
  on("hRkJoin", () => socialOn() ? openUnirmeLiga("") : (padelTab = "ligas", setView("padel")));
  on("hRkOpen", () => rkInicio && openLiga(rkInicio.L.id));
  on("hRkAdd", () => openPadelMatch()); on("hRkTest", () => openNivelTest());
  $$("#hRank [data-user]").forEach(b => b.onclick = () => openUser(b.dataset.user));
}
