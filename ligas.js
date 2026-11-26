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
let ligasProm = null;
function cargarMisLigas(force) {
  if (!socialOn()) return Promise.resolve();
  if (ligasCargando) return force ? ligasProm.then(() => cargarMisLigas(true)) : ligasProm; // ya se están cargando: se espera a esa misma carga (evita bucles de repintado)
  if (misLigas && !force) return Promise.resolve();
  ligasCargando = true;
  ligasProm = cargarMisLigas_().finally(() => { ligasCargando = false; });
  return ligasProm;
}
async function cargarMisLigas_() {
  try {
    const d = await PERF().doc(me.uid).get(); const p = d.exists ? d.data() : {};
    if (social.me) { social.me.ligas = p.ligas || []; social.me.ligasInfo = p.ligasInfo || {}; }
    const info = p.ligasInfo || {};
    misLigas = (await Promise.all((p.ligas || []).map(async id => {
      if (info[id] && info[id].borrada) return null; // la eliminé yo
      let n = 0, borr = false;
      try { const q = await PERF().where("ligas", "array-contains", id).limit(300).get(); n = q.size; borr = q.docs.some(d => { const x = d.data(); return x.ligasInfo && x.ligasInfo[id] && x.ligasInfo[id].borrada; }); } catch {}
      if (borr) { try { await PERF().doc(me.uid).set({ ligas: FV().arrayRemove(id), ligasInfo: { [id]: FV().delete() } }, { merge: true }); } catch {} return null; } // el creador la eliminó
      return { id, ...(info[id] || { nombre: "Liga " + id }), n };
    }))).filter(Boolean);
    misLigas.sort((a, b) => (b.t || 0) - (a.t || 0));
    try { localStorage.setItem("pm-ligas", JSON.stringify(misLigas)); } catch {}
  } catch (e) { console.warn("ligas", e); misLigas = misLigas || []; }
}
// Quita una liga de lo guardado en el móvil sin recargar nada (al salir o eliminarla)
function quitarLigaLocal(id) {
  misLigas = (misLigas || []).filter(l => l.id !== id);
  if (rkInicio && rkInicio.L && rkInicio.L.id === id) { rkInicio = null; window.__rkFresh = 0; }
  try { localStorage.setItem("pm-ligas", JSON.stringify(misLigas)); if (!rkInicio) localStorage.removeItem("pm-rk"); } catch {}
}
async function leerLiga(id) {
  const q = await PERF().where("ligas", "array-contains", id).limit(300).get();
  const docs = q.docs.map(d => d.data()); if (!docs.length) return null;
  if (docs.some(x => x.ligasInfo && x.ligasInfo[id] && x.ligasInfo[id].borrada)) return null; // eliminada por su creador
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
  if (!misLigas) { cargarMisLigas().then(() => { if (misLigas && view === "padel" && padelTab === "ligas" && !sheetOpen) render(); }); }
  const lista = misLigas || [];
  return `<div class="ligahero"><div class="lgem">🏆</div><h2>Tu liga, tu ranking</h2><p>Crea una liga con tu grupo, tu club o tu americana de los jueves. Cada partido que apuntéis mueve la clasificación.</p>
      <div class="row" style="gap:8px;margin-top:14px"><button class="btn" id="lgNew" style="flex:1;background:var(--ink);color:#fff;border:0">${svg("plus")}Crear liga</button><button class="btn" id="lgJoin" style="flex:1">Tengo un código</button></div></div>
    ${!misLigas ? `<p class="small mute" style="text-align:center;margin:16px 0">Cargando tus ligas…</p>` : lista.length ? `<div class="sec">Tus ligas</div>${lista.map(L => `<button class="ligarow" data-liga="${L.id}"><span class="lgic">${esc((L.nombre || "?")[0].toUpperCase())}</span><span style="flex:1;min-width:0"><b>${esc(L.nombre)}</b><small>${(L.miembros || []).length} jugador${(L.miembros || []).length === 1 ? "" : "es"}${L.sede ? " · " + esc(L.sede) : ""}</small></span><span class="mute">›</span></button>`).join("")}`
      : `<div class="card" style="margin-top:12px"><h3>¿Cómo funciona?</h3><ol class="lgsteps"><li><b>Crea la liga</b> y ponle nombre (“Los del jueves”, “Club X”).</li><li><b>Invita</b> por WhatsApp con el enlace: entran en 10 segundos.</li><li><b>Apuntad vuestros partidos</b>: el nivel de cada uno sube o baja según contra quién gana.</li><li><b>Mirad quién va primero</b> y retaos en el muro de la liga.</li></ol></div>`}`;
}
function wireLigas(root) {
  const n = $("#lgNew", root); if (n) n.onclick = openCrearLiga;
  const j = $("#lgJoin", root); if (j) j.onclick = () => openUnirmeLiga("");
  $$("[data-liga]", root).forEach(b => b.onclick = () => openLiga(b.dataset.liga));
}
// Para quien aún no ha calculado su nivel: las ligas en una hoja
function openMisLigasSheet() {
  openSheet("Ligas", ligasHTML(), s => { wireLigas(s); if (!misLigas) cargarMisLigas().then(() => misLigas && sheetOpen && openMisLigasSheet()); });
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

// ---------- Partidos de liga (cuentan cuando un rival los confirma) ----------
// posts {tipo:'ligapartido', liga, uid, t, a:[uids de quien lo apunta y su pareja], b:[uids rivales], s:"6-4,6-3", kudos:[]}
//   kudos = rivales que lo confirman (las reglas solo dejan que cada uno se añada a sí mismo, así nadie confirma por otro)
// posts {tipo:'ligarech', liga, uid, ref, t} = un rival dice que el resultado no es correcto
const LP_GANA = 3, LP_PIERDE = 1;
const lpSets = s => String(s || "").split(",").map(x => x.split("-").map(Number)).filter(x => x.length === 2 && x.every(n => !isNaN(n)));
function lpEstado(m, rech) {
  const riv = m.b || [];
  if (rech.some(r => r.ref === m.id && riv.includes(r.uid))) return "rech";
  if ((m.kudos || []).some(u => riv.includes(u))) return "ok";
  return "pend";
}
async function leerLigaPosts(id) {
  const q = await FS().collection("posts").where("liga", "==", id).limit(400).get();
  const all = q.docs.map(d => ({ id: d.id, ...d.data() }));
  const rech = all.filter(x => x.tipo === "ligarech");
  const partidos = all.filter(x => x.tipo === "ligapartido").map(m => ({ ...m, estado: lpEstado(m, rech) })).sort((a, b) => (b.t || 0) - (a.t || 0));
  return { muro: all.filter(x => x.tipo === "liga").sort((a, b) => (b.t || 0) - (a.t || 0)).slice(0, 40), partidos, rech };
}
// Clasificación de la liga: 3 puntos por victoria y 1 por partido jugado y perdido. Solo partidos confirmados.
function tablaLiga(L, partidos) {
  const T = {}; (L.perfiles || []).forEach(p => { T[p.uid] = { ...(p.uid === me.uid ? yoRank() : p), pj: 0, pg: 0, pts: 0, ds: 0 }; });
  partidos.filter(m => m.estado === "ok").forEach(m => {
    const sets = lpSets(m.s), gA = setsWin(sets); if (gA === null) return;
    let sA = 0, sB = 0; sets.forEach(x => { if (x[0] > x[1]) sA++; else if (x[1] > x[0]) sB++; });
    [[m.a, gA, sA - sB], [m.b, !gA, sB - sA]].forEach(([eq, gana, d]) => (eq || []).forEach(u => { const r = T[u]; if (!r) return; r.pj++; if (gana) { r.pg++; r.pts += LP_GANA; } else r.pts += LP_PIERDE; r.ds += d; }));
  });
  return Object.values(T).sort((a, b) => b.pts - a.pts || b.ds - a.ds || b.pg - a.pg || (b.nivelPadel || 0) - (a.nivelPadel || 0));
}
const lpNom = (L, u) => { if (u === me.uid) return "Tú"; const p = (L.perfiles || []).find(x => x.uid === u); return p ? (p.nombre || "Jugador").split(" ")[0] : "Jugador"; };
const lpEq = (L, eq) => (eq || []).map(u => lpNom(L, u)).join(" y ");
function lpPersonal(L, m, ladoMio) {
  // Guarda el partido también en el historial de quien juega (para su nivel), desde su lado
  const sets = lpSets(m.s).map(x => ladoMio === "a" ? x : [x[1], x[0]]);
  const mio = ladoMio === "a" ? m.a : m.b, otro = ladoMio === "a" ? m.b : m.a;
  const jug = u => { const p = (L.perfiles || []).find(x => x.uid === u) || {}; return { uid: u, n: p.nombre || "Jugador" }; };
  const compU = (mio || []).find(u => u !== me.uid);
  const a = { id: uid("a"), deporte: "padel", fecha: new Date(m.t || Date.now()).toISOString(), dur: 5400, dist: 0, fuente: "liga", padel: { sets, comp: compU ? jug(compU) : null, riv: (otro || []).map(jug), club: L.nombre, tipo: "liga", lado: null, lpid: m.id } };
  if (Object.values(state.act).some(x => x.padel && x.padel.lpid === m.id)) return;
  fillPadelAct(a); saveItem("act", a); try { syncNivel(); } catch {}
}
function openLigaPartido(L) {
  const otros = (L.perfiles || []).filter(p => p.uid !== me.uid);
  if (!otros.length) { toast("Invita primero a tus rivales a la liga"); return; }
  const sets = [[6, 4], [6, 4], [0, 0]];
  const opt = ph => `<option value="">${ph}</option>` + otros.map(p => `<option value="${p.uid}">${esc(p.nombre || "Jugador")}</option>`).join("");
  openSheet("Partido de liga", `
    <div class="hint" style="margin-bottom:12px">✅<span>Cuenta para la clasificación cuando <b style="color:var(--ink)">uno de tus rivales lo confirme</b> desde la app.</span></div>
    <div class="card" style="padding:12px;margin-bottom:10px">
      <div class="small mute" style="margin-bottom:6px">Tú y…</div><select id="lpC"><option value="">Sin pareja de la liga</option>${otros.map(p => `<option value="${p.uid}">${esc(p.nombre || "Jugador")}</option>`).join("")}</select>
      <div class="small mute" style="margin:12px 0 6px">Contra</div><div class="row" style="gap:8px"><select id="lpR1">${opt("Rival 1")}</select><select id="lpR2">${opt("Rival 2 (opcional)")}</select></div></div>
    <div class="field" style="margin-bottom:10px">Resultado <span class="tiny mute">(tu equipo – rivales)</span><div id="lpS"></div></div>
    <div class="err" id="lpE"></div><button class="btn block" id="lpOk" style="background:var(--ink);color:#fff;border:0">Enviar para confirmar</button>`, s => {
    const drawSets = () => { $("#lpS", s).innerHTML = sets.map((st, i) => `<div class="setrow"><span class="tiny mute">Set ${i + 1}</span>${[0, 1].map(k => `<div class="stp"><button data-s="${i}" data-k="${k}" data-d="-1">−</button><b class="num">${st[k]}</b><button data-s="${i}" data-k="${k}" data-d="1">+</button></div>`).join(`<span class="mute">–</span>`)}</div>`).join("") + `<div class="tiny mute" style="margin-top:4px">Deja el 3.º set en 0–0 si no se jugó.</div>`;
      $$("#lpS [data-s]", s).forEach(b => b.onclick = () => { const st = sets[+b.dataset.s]; st[+b.dataset.k] = Math.max(0, Math.min(7, st[+b.dataset.k] + +b.dataset.d)); drawSets(); }); };
    drawSets();
    let saving = false;
    $("#lpOk", s).onclick = async () => {
      if (saving) return;
      const c = $("#lpC", s).value, r1 = $("#lpR1", s).value, r2 = $("#lpR2", s).value, E = $("#lpE", s);
      const riv = [r1, r2].filter(Boolean);
      if (!riv.length) { E.textContent = "Elige al menos un rival de la liga."; return; }
      if (new Set([c, ...riv].filter(Boolean)).size !== [c, ...riv].filter(Boolean).length) { E.textContent = "Has elegido a la misma persona dos veces."; return; }
      const played = sets.filter(x => x[0] + x[1] > 0); if (!played.length || setsWin(played) === null) { E.textContent = "Pon el resultado (tiene que haber un ganador)."; return; }
      saving = true; const btn = $("#lpOk", s); btn.disabled = true; btn.textContent = "Enviando…"; E.textContent = "";
      try {
        const ref = FS().collection("posts").doc();
        const m = { id: ref.id, uid: me.uid, tipo: "ligapartido", liga: L.id, nombre: (social.me && social.me.nombre) || "Jugador", a: [me.uid, ...(c ? [c] : [])], b: riv, s: played.map(x => x.join("-")).join(","), kudos: [], t: Date.now() };
        await ref.set(m);
        lpPersonal(L, m, "a");
        riv.forEach(u => { try { aviso(u, { tipo: "comentario", texto: `ha apuntado un partido de la liga ${L.nombre} (${setsStr(played)}). Entra en la liga para confirmarlo.` }); } catch {} });
        toast("Enviado. Cuenta cuando un rival lo confirme ✅"); closeSheet(); openLiga(L.id, false, "liga");
      } catch (e) { console.warn(e); saving = false; btn.disabled = false; btn.textContent = "Enviar para confirmar"; E.textContent = "No se ha podido enviar. Inténtalo otra vez."; }
    };
  });
}
async function lpConfirmar(L, m, ok) {
  try {
    if (ok) { await FS().collection("posts").doc(m.id).update({ kudos: FV().arrayUnion(me.uid) }); lpPersonal(L, { ...m, kudos: [...(m.kudos || []), me.uid] }, "b"); toast("Resultado confirmado ✅"); }
    else { const ref = FS().collection("posts").doc(); await ref.set({ id: ref.id, uid: me.uid, tipo: "ligarech", liga: L.id, ref: m.id, t: Date.now() }); try { aviso(m.uid, { tipo: "comentario", texto: `dice que el resultado del partido de la liga ${L.nombre} no es correcto. Bórralo y apúntalo de nuevo.` }); } catch {} toast("Hemos avisado a quien lo apuntó"); }
  } catch (e) { console.warn(e); toast("No se ha podido. Inténtalo en un momento."); return; }
  openLiga(L.id, false, "liga");
}

// ---------- Liga: clasificación + muro ----------
function podioHTML(rows, val = p => p.nivelPadel ? fmtNivel(p.nivelPadel) : "–") {
  const t = rows.slice(0, 3); if (!t.length) return "";
  const ord = [t[1], t[0], t[2]].filter(Boolean), alt = { 0: 92, 1: 120, 2: 72 };
  return `<div class="podio">${ord.map(p => { const i = rows.indexOf(p); return `<div class="pod p${i + 1}" ${p.yo ? "" : `data-user="${p.uid}"`}>${i === 0 ? `<div class="crown">👑</div>` : ""}${avatar(p, i === 0 ? 56 : 46)}<div class="pn">${esc(p.yo ? "Tú" : (p.nombre || "").split(" ")[0])}</div><div class="pv num">${val(p)}</div><div class="pb" style="height:${alt[i]}px"><span>${i + 1}</span></div></div>`; }).join("")}</div>`;
}
async function openLiga(id, recienCreada, tab) {
  let L = null, P = { muro: [], partidos: [], rech: [] };
  try { [L, P] = await Promise.all([leerLiga(id), leerLigaPosts(id).catch(e => { console.warn(e); return P; })]); } catch (e) { console.warn(e); }
  if (!L) { toast("No se ha encontrado la liga"); return; }
  const rowsN = await clasificacion(L), rowsL = tablaLiga(L, P.partidos);
  const hayLiga = P.partidos.some(m => m.estado === "ok");
  const modo = tab || (hayLiga ? "liga" : "nivel");
  const misPend = P.partidos.filter(m => m.estado === "pend" && (m.b || []).includes(me.uid) && !P.rech.some(r => r.ref === m.id && r.uid === me.uid));
  const invTxt = `🏆 Únete a mi liga de pádel "${L.nombre}" en Pádel+ y a ver quién va primero 😏\n\n👉 ${ligaLink(L.id)}\n\n(Código: ${L.id})`;
  const filaN = (p, i) => { const d = p.nivelPadel && p.nivel7 ? p.nivelPadel - p.nivel7 : 0; return `<button class="lgfila${p.yo ? " yo" : ""}" ${p.yo ? "" : `data-user="${p.uid}"`}><span class="lgpos">${i + 1}</span>${avatar(p, 34)}<span style="flex:1;min-width:0;text-align:left"><b>${esc(p.yo ? "Tú" : p.nombre || "Jugador")}</b><small>${p.nPadel ? `${p.nPadel} partidos · ${Math.round((p.wPadel || 0) / p.nPadel * 100)}% victorias` : "Sin partidos aún"}</small></span>${Math.abs(d) >= .01 ? `<span class="lgtr ${d > 0 ? "up" : "dn"}">${d > 0 ? "▲" : "▼"}${nf(Math.abs(d), 2)}</span>` : ""}<span class="num lgniv">${p.nivelPadel ? fmtNivel(p.nivelPadel) : "–"}</span></button>`; };
  const filaL = (p, i) => `<button class="lgfila${p.yo ? " yo" : ""}" ${p.yo ? "" : `data-user="${p.uid}"`}><span class="lgpos">${i + 1}</span>${avatar(p, 34)}<span style="flex:1;min-width:0;text-align:left"><b>${esc(p.yo ? "Tú" : p.nombre || "Jugador")}</b><small>${p.pj ? `${p.pj} jugado${p.pj === 1 ? "" : "s"} · ${p.pg} ganado${p.pg === 1 ? "" : "s"}` : "Sin partidos de liga"}</small></span><span class="num lgniv">${p.pts}<small style="display:inline;font-size:11px;font-weight:700;color:var(--mute)"> pts</small></span></button>`;
  const rows = modo === "liga" ? rowsL : rowsN;
  const pos = rows.findIndex(r => r.yo) + 1, yo = rows[pos - 1];
  const msgPos = modo === "liga"
    ? (!yo || !yo.pj ? `Juega y apunta tu primer partido de liga para sumar puntos.` : pos === 1 ? `Vas primero de la liga 👑 Que no te adelanten.` : (() => { const dif = rows[pos - 2].pts - yo.pts, nom = esc((rows[pos - 2].nombre || "").split(" ")[0]); return `Vas ${pos}º con ${yo.pts} punto${yo.pts === 1 ? "" : "s"}. ` + (dif ? `Estás a <b style="color:var(--vt)">${dif}</b> punto${dif === 1 ? "" : "s"} de ${nom}.` : `Empatado a puntos con ${nom}: gana el siguiente y lo adelantas.`); })())
    : (!yo || !yo.nivelPadel ? `Calcula tu nivel y apunta un partido para entrar en la clasificación.` : pos === 1 ? `Vas primero de la liga 👑 Que no te adelanten.` : `Vas ${pos}º. Te faltan <b style="color:var(--vt)">${nf(rows[pos - 2].nivelPadel - yo.nivelPadel, 2)}</b> para adelantar a ${esc((rows[pos - 2].nombre || "").split(" ")[0])}.`);
  const est = { ok: `<span class="lpst ok">✅ Confirmado</span>`, pend: `<span class="lpst pend">⏳ Falta que confirme un rival</span>`, rech: `<span class="lpst rech">❌ Un rival dice que no es correcto</span>` };
  const partidoHTML = m => { const sets = lpSets(m.s), gA = setsWin(sets); return `<div class="lpm"><div style="flex:1;min-width:0"><div class="small"><b${gA ? ` style="color:var(--vt)"` : ""}>${esc(lpEq(L, m.a))}</b> <span class="num">${esc(setsStr(sets))}</span> <b${gA === false ? ` style="color:var(--vt)"` : ""}>${esc(lpEq(L, m.b))}</b></div><div class="tiny mute" style="margin-top:3px">${est[m.estado]} · ${ago(m.t)}</div></div>${m.uid === me.uid && m.estado !== "ok" ? `<button class="link tiny" data-lpdel="${m.id}">Borrar</button>` : ""}</div>`; };
  openSheet(esc(L.nombre), `
    ${recienCreada ? `<div class="hint" style="margin-bottom:10px">🎉<span>¡Liga creada! Ahora invita a tu gente: cuantos más seáis, más emoción.</span></div>` : ""}
    ${misPend.map(m => `<div class="lpconf"><div class="small"><b>${esc(lpNom(L, m.uid))}</b> ha apuntado un partido contra ti:</div><div style="margin:6px 0 10px;font-weight:800">${esc(lpEq(L, m.a))} <span class="num">${esc(setsStr(lpSets(m.s)))}</span> ${esc(lpEq(L, m.b))}</div><div class="row" style="gap:8px"><button class="btn" data-lpno="${m.id}" style="flex:1">No es correcto</button><button class="btn" data-lpok="${m.id}" style="flex:1;background:var(--ink);color:#fff;border:0">Confirmar</button></div></div>`).join("")}
    <div class="lgcab"><div><div class="tiny mute">${(L.miembros || []).length} jugador${(L.miembros || []).length === 1 ? "" : "es"}${L.sede ? " · " + esc(L.sede) : ""}</div><div class="small" style="margin-top:4px">${msgPos}</div></div></div>
    <div class="row" style="gap:8px;margin:12px 0"><button class="btn" id="lgInv" style="flex:1;background:var(--ink);color:#fff;border:0">Invitar por WhatsApp</button><button class="btn" id="lgCopy" style="flex:0 0 auto">Compartir</button></div>
    <div class="seg" id="lgModo" style="margin-bottom:4px"><button data-m="liga" class="${modo === "liga" ? "on" : ""}">🏆 Liga</button><button data-m="nivel" class="${modo === "nivel" ? "on" : ""}">📈 Nivel</button></div>
    ${modo === "liga" && !hayLiga ? `<div class="hint" style="margin-top:10px">🎾<span>Aún no hay partidos de liga confirmados. Cada victoria suma <b style="color:var(--ink)">3 puntos</b> y cada derrota <b style="color:var(--ink)">1</b>, y cuentan cuando un rival confirma el resultado.</span></div>` : podioHTML(rows, modo === "liga" ? (p => `${p.pts} pts`) : undefined)}
    <div class="sec">Clasificación</div><div class="card" style="padding:4px 8px">${rows.map(modo === "liga" ? filaL : filaN).join("")}</div>
    <button class="btn block" id="lgAdd" style="margin-top:10px;background:var(--ink);color:#fff;border:0">${svg("plus")}Apuntar partido de liga</button>
    ${P.partidos.length ? `<div class="sec">Partidos de la liga</div><div class="card" style="padding:4px 10px">${P.partidos.slice(0, 15).map(partidoHTML).join("")}</div>` : ""}
    <div class="sec">Muro de la liga</div>
    <div class="lgcompose"><textarea id="lgMsg" rows="2" maxlength="500" placeholder="Organiza el próximo partido, busca pareja o desafía al líder…"></textarea><button class="btn" id="lgSend" style="background:var(--ink);color:#fff;border:0">Enviar</button></div>
    <div id="lgMuro"><p class="small mute" style="text-align:center;margin:12px 0">Cargando…</p></div>
    <p class="tiny mute" style="text-align:center;margin-top:14px">Código de la liga: <b style="letter-spacing:2px">${L.id}</b>${L.creador !== me.uid ? ` · <button class="link" id="lgOut" style="font-size:inherit">Salir de la liga</button>` : ` · <button class="link" id="lgDel" style="font-size:inherit;color:var(--red,#e11d48)">Eliminar liga</button>`}</p>`, s => {
    $$("[data-user]", s).forEach(b => b.onclick = () => openUser(b.dataset.user));
    $$("#lgModo [data-m]", s).forEach(b => b.onclick = () => { if (b.dataset.m !== modo) openLiga(id, false, b.dataset.m); });
    $$("[data-lpok]", s).forEach(b => b.onclick = () => { b.disabled = true; lpConfirmar(L, P.partidos.find(m => m.id === b.dataset.lpok), true); });
    $$("[data-lpno]", s).forEach(b => b.onclick = () => confirmSheet("No es correcto", "Avisaremos a quien lo apuntó para que lo borre y lo apunte bien. No contará para la clasificación.", "Avisar", () => lpConfirmar(L, P.partidos.find(m => m.id === b.dataset.lpno), false), false));
    $$("[data-lpdel]", s).forEach(b => b.onclick = async () => { b.disabled = true; try { await FS().collection("posts").doc(b.dataset.lpdel).delete(); } catch {} const a = Object.values(state.act).find(x => x.padel && x.padel.lpid === b.dataset.lpdel); if (a) { try { delItem("act", a.id); } catch {} } openLiga(id, false, modo); });
    $("#lgInv", s).onclick = () => { const tx = encodeURIComponent(invTxt); if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) location.href = `whatsapp://send?text=${tx}`; else window.open(`https://web.whatsapp.com/send?text=${tx}`, "_blank"); };
    $("#lgCopy", s).onclick = async () => { try { if (navigator.share) await navigator.share({ text: invTxt }); else { await navigator.clipboard.writeText(invTxt); toast("Enlace copiado"); } } catch {} };
    $("#lgAdd", s).onclick = () => openLigaPartido(L);
    const out = $("#lgOut", s); if (out) out.onclick = () => confirmSheet("Salir de la liga", `¿Seguro que quieres salir de “${esc(L.nombre)}”?`, "Salir", async () => { try { await PERF().doc(me.uid).set({ ligas: FV().arrayRemove(id), ligasInfo: { [id]: FV().delete() } }, { merge: true }); } catch {} quitarLigaLocal(id); closeSheet(); });
    const del = $("#lgDel", s); if (del) del.onclick = () => confirmSheet("Eliminar liga", `¿Seguro que quieres eliminar “${esc(L.nombre)}”? Desaparecerá para todos sus jugadores y no se puede deshacer.`, "Eliminar", async () => { const ok = $("#cOk"); if (ok) { if (ok.disabled) return; ok.disabled = true; ok.textContent = "Eliminando…"; } try { await PERF().doc(me.uid).set({ ligasInfo: { [id]: { borrada: true } } }, { merge: true }); } catch (e) { console.warn(e); toast("No se ha podido eliminar. Inténtalo en un momento."); return; } quitarLigaLocal(id); closeSheet(); toast("Liga eliminada"); });
    const muro = $("#lgMuro", s);
    const pinta = async () => {
      try {
        const q = await FS().collection("posts").where("liga", "==", id).limit(400).get();
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
    if (!(rkInicio && misLigas && misLigas.length) || window.__rkNoSocial) return cta("Compite con tus amigos", "Crea una liga con tu grupo y mirad quién va primero.");
  }
  try { const cu = localStorage.getItem("pm-rk-uid"); if (cu && cu !== me.uid) { rkInicio = null; misLigas = null; localStorage.removeItem("pm-rk"); localStorage.removeItem("pm-ligas"); localStorage.setItem("pm-rk-uid", me.uid); } } catch {}
  if (!window.__rkFresh && socialOn()) { window.__rkFresh = 1; cargarMisLigas(true).then(rkCargar).then(rkPintar); }
  if (!misLigas || (misLigas.length && !rkInicio)) return `<div class="hrk">${nv}<div class="hrkl"><b>🏆 Tu liga</b><span>Cargando clasificación…</span></div></div>`;
  if (!misLigas.length || !rkInicio) return cta("Compite con tus amigos", "Crea una liga con tu grupo y mirad quién va primero.");
  const yoR = yoRank(); const rows = rkInicio.rows.map(r => r.uid === me.uid ? { ...r, ...yoR } : r).sort((a, b) => (b.nivelPadel || 0) - (a.nivelPadel || 0)); const L = rkInicio.L;
  const pos = rows.findIndex(r => r.yo) + 1, yo = rows[pos - 1];
  const sub = !yo || !yo.nivelPadel ? "Apunta un partido para entrar en la clasificación." : pos === 1 ? "Vas primero 👑 Que no te adelanten." : `Vas ${pos}º de ${rows.length}. Te faltan <b style="color:var(--vt)">${nf(rows[pos - 2].nivelPadel - yo.nivelPadel, 2)}</b> para adelantar a ${esc((rows[pos - 2].nombre || "").split(" ")[0])}.`;
  const pendTxt = rkInicio.pend ? `<span style="display:block;margin-top:6px;color:#b45309;font-weight:800">⏳ Tienes ${rkInicio.pend} resultado${rkInicio.pend === 1 ? "" : "s"} por confirmar. Entra en la liga.</span>` : "";
  return `<div class="hrk">${nv}<div class="hrkl"><b>🏆 ${esc(L.nombre)}</b><span>${sub}${pendTxt}</span>${rows.length > 1 ? podioHTML(rows) : ""}
    <div class="hrkb">${btns}<button class="btn" id="hRkOpen">Ver la liga</button></div></div></div>`;
}
async function rkCargar() {
  try {
    if (misLigas && misLigas.length) { const L = await leerLiga(misLigas[0].id); if (!L) rkInicio = null; else { const rows = await clasificacion(L); let pend = 0; try { const P = await leerLigaPosts(L.id); pend = P.partidos.filter(m => m.estado === "pend" && (m.b || []).includes(me.uid) && !P.rech.some(r => r.ref === m.id && r.uid === me.uid)).length; } catch {} rkInicio = { pend, L: { id: L.id, nombre: L.nombre }, rows: rows.map(r => ({ uid: r.uid, nombre: r.nombre, color: r.color, foto: r.foto, nivelPadel: r.nivelPadel, yo: !!r.yo })) }; } }
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
