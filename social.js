// ===== Pádel+ · comunidad: perfiles, seguir, muro, kudos, comentarios, chat y avisos =====
const FS = () => store.db;
const FV = () => firebase.firestore.FieldValue;
const COLORS = ["#d4ff3a", "#38bdf8", "#ff6a3d", "#a78bfa", "#34d399", "#facc15", "#f472b6", "#22d3ee"];
let social = { me: null, loaded: false, following: new Set(), followers: 0, feed: [], disc: [], chats: [], avisos: [], tab: "siguiendo", busy: false, lastLoad: 0 };
const socialOn = () => store && store.kind === "firebase" && social.me;
const handleOk = h => /^[a-z0-9._]{3,20}$/.test(h);
function avatar(p, size = 40) { const n = (p && (p.nombre || p.autor || p.n) || "?").trim(); return `<div class="av" style="width:${size}px;height:${size}px;font-size:${Math.round(size * .42)}px;background:${(p && p.color) || "#d4ff3a"};flex:none">${esc(n[0].toUpperCase())}</div>`; }
function ago(t) { const s = (Date.now() - t) / 1000; if (s < 60) return "ahora"; if (s < 3600) return `hace ${Math.floor(s / 60)} min`; if (s < 86400) return `hace ${Math.floor(s / 3600)} h`; if (s < 7 * 86400) return `hace ${Math.floor(s / 86400)} d`; const d = new Date(t); return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`; }

// ---------- Arranque ----------
let socialUnsubs = [];
async function startSocial() {
  if (store.kind !== "firebase") return;
  socialUnsubs.forEach(f => f()); socialUnsubs = [];
  try {
    const s = await FS().collection("perfiles").doc(me.uid).get(); social.me = s.exists ? s.data() : null;
    if (social.me) await loadFollowing();
  } catch (e) { console.warn(e); }
  social.loaded = true;
  // Chats y avisos en tiempo real (para los contadores de la cabecera)
  socialUnsubs.push(FS().collection("chats").where("miembros", "array-contains", me.uid).onSnapshot(s => { social.chats = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.t || 0) - (a.t || 0)); updateBadges(); if (chatOpenId === "__list") drawChatList(); }, () => {}));
  socialUnsubs.push(store.base.collection("avisos").orderBy("t", "desc").limit(40).onSnapshot(s => { social.avisos = s.docs.map(d => ({ id: d.id, ...d.data() })); updateBadges(); }, () => {}));
  updateBadges();
}
function stopSocial() { socialUnsubs.forEach(f => f()); socialUnsubs = []; social = { me: null, loaded: false, following: new Set(), followers: 0, feed: [], disc: [], chats: [], avisos: [], tab: "siguiendo", busy: false, lastLoad: 0 }; }
async function loadFollowing() {
  const [a, b] = await Promise.all([FS().collection("follows").where("de", "==", me.uid).get(), FS().collection("follows").where("a", "==", me.uid).get()]);
  social.following = new Set(a.docs.map(d => d.data().a)); social.followers = b.size;
}
const unreadChats = () => social.chats.filter(c => c.ultimo && c.ultimo.de !== me.uid && (c.ultimo.t || 0) > ((c.leido || {})[me.uid] || 0)).length;
const unreadAvisos = () => social.avisos.filter(a => !a.leido).length;
function updateBadges() {
  const c = unreadChats(), a = unreadAvisos();
  const cb = $("#chatBadge"), ab = $("#bellBadge"); if (cb) { cb.textContent = c; cb.hidden = !c; } if (ab) { ab.textContent = a > 9 ? "9+" : a; ab.hidden = !a; }
  const tb = $("#tabbar [data-v=comunidad] .dotb"); if (tb) tb.hidden = !(c + a);
}

// ---------- Publicar entrenos ----------
function postId(a) { return "p" + Math.max(0, 1e13 - Date.parse(a.fecha)).toString(36).padStart(9, "0") + "_" + a.id; }
function privacyTrim(trk, m = 200) {
  if (!trk || trk.length < 10) return trk; let d = 0, i = 0; while (i < trk.length - 1 && d < m) { d += haversine(trk[i], trk[i + 1]); i++; }
  let e = 0, j = trk.length - 1; while (j > i && e < m) { e += haversine(trk[j - 1], trk[j]); j--; } return trk.slice(i, j + 1);
}
function shouldPublish(a) { return socialOn() && a.vis !== "privado"; }
async function publishAct(a, isNew) {
  if (!socialOn()) return;
  const id = a.postId || postId(a);
  if (a.vis === "privado") { if (a.postId) { try { await FS().collection("posts").doc(a.postId).delete(); } catch {} } return; }
  if (isNew && Date.now() - Date.parse(a.fecha) > 10 * 864e5 && a.fuente !== "gps") return; // no inundar el muro con importaciones antiguas
  let ruta = null; if (a.trk && a.trk.length > 1) { const t = social.me.ocultarInicio === false ? a.trk : privacyTrim(a.trk); ruta = JSON.stringify(downsample(t, 220).map(p => [p[0], p[1]])); }
  const p = { id, act: a.id, uid: me.uid, autor: social.me.nombre, usuario: social.me.usuario, color: social.me.color, deporte: a.deporte, titulo: a.titulo || "", fecha: a.fecha, dur: a.dur || 0, dist: a.dist || 0, kcal: a.kcal || 0, desnivel: a.desnivel || 0, ruta,
    resultado: a.resultado || null, ganado: a.ganado ?? null, companero: a.companero || null, rivales: a.rivales || null, notas: a.notas || "", sensacion: a.sensacion || null,
    ejercicios: a.ejercicios ? a.ejercicios.map(e => ({ n: e.n, s: e.series.length, max: Math.max(0, ...e.series.map(s => +s.kg || 0)) })) : null,
    pr: Object.entries(a.bests || {}).filter(([D, t]) => isPR(a, +D, t)).map(([D]) => prName(+D)), fuente: a.fuente || "", t: Date.now() };
  try {
    const ref = FS().collection("posts").doc(id); const old = await ref.get();
    if (old.exists) { const o = old.data(); p.kudos = o.kudos || []; p.nCom = o.nCom || 0; p.t = o.t || p.t; } else { p.kudos = []; p.nCom = 0; }
    await ref.set(p); if (a.postId !== id) { a.postId = id; store.save("act", a); }
    social.feed = social.feed.filter(x => x.id !== id); social.feed.unshift(p);
  } catch (e) { console.warn("publicar", e); }
}
async function unpublishAct(a) { if (socialOn() && a.postId) { try { await FS().collection("posts").doc(a.postId).delete(); } catch {} } }

// ---------- Vista Comunidad ----------
function vComunidad() {
  if (store.kind !== "firebase") return `<div class="card empty">${svg("users")}<p>La comunidad necesita conexión.</p></div>`;
  if (!social.loaded) return `<div class="empty">Cargando…</div>`;
  if (!social.me) return `<div class="hero">
      <div class="lbl" style="color:var(--mute)">Comunidad Pádel+</div><h2 style="font-size:26px;letter-spacing:-.5px;margin:8px 0 10px">Juega con tu gente</h2>
      <p class="small" style="color:var(--mute);line-height:1.55">Sigue a tus amigos, mira sus partidos, dales <b>kudos</b>, comenta y habla por mensaje. Pregunta por palas y zapatillas a gente que juega como tú.</p>
      <div class="chips"><span class="chip">${svg("heart")}Kudos</span><span class="chip">${svg("mail")}Mensajes</span><span class="chip">${svg("trophy")}Ranking</span><span class="chip">${svg("shield")}Zona privada</span></div>
      <button class="btn pri block" id="cpStart" style="margin-top:16px">Crear mi perfil público</button></div>
      <p class="tiny mute" style="text-align:center;margin-bottom:18px">Tus datos de salud y nutrición nunca se publican.</p>`;
  const rank = weeklyRanking();
  return `<div class="row" style="margin-bottom:12px"><label class="field" style="margin:0;flex:1"><input id="srch" placeholder="Buscar personas por @usuario o nombre" autocomplete="off" style="margin:0"></label></div>
    <div id="srchRes"></div>
    ${historiasHTML()}
    <button class="card" id="opNew" style="display:flex;gap:12px;align-items:center;width:100%;text-align:left;border-color:rgba(132,204,22,.35);background:radial-gradient(300px 140px at 100% 0%,rgba(132,204,22,.12),transparent 70%),var(--card)"><span style="font-size:26px">✍️</span><div style="flex:1"><div style="font-weight:800">Opina sobre tu material</div><div class="small mute">Pala, zapatillas, ropa o accesorios. Ayuda a otros a acertar.</div></div>${svg("chev", "chev")}</button>
    <div class="tabs">${[["siguiendo", "Siguiendo"], ["descubrir", "Descubrir"], ["opiniones", "Opiniones"], ["ranking", "Ranking"]].map(([k, n]) => `<button data-st="${k}" class="${social.tab === k ? "on" : ""}">${n}</button>`).join("")}</div>
    ${social.tab === "ranking" ? rankHTML(rank) : social.tab === "opiniones" ? `<div id="feed">${opinionesHTML()}</div>` : `${genteHTML()}<div id="feed">${feedHTML(social.tab === "siguiendo" ? social.feed : social.disc)}</div>`}`;
}
function opinionesHTML() {
  const seen = new Set(), L = [...social.disc, ...social.feed].filter(p => p.tipo === "opinion" && !seen.has(p.id) && seen.add(p.id)).sort((a, b) => b.fecha.localeCompare(a.fecha));
  return L.length ? L.map(postCard).join("") : `<div class="card empty"><span style="font-size:34px">✍️</span><p>Todavía no hay opiniones.<br>¡Sé el primero en contar qué tal tu pala o tus zapatillas!</p></div>`;
}
function genteHTML() {
  const g = (social.gente || []).filter(p => social.tab === "descubrir" || !social.following.has(p.uid));
  if (!g.length || (social.tab === "siguiendo" && social.feed.length > 3 && social.following.size > 2)) return "";
  return `<div class="card" style="padding:14px 0 12px"><h3 style="padding:0 16px">${svg("users")}${social.tab === "descubrir" ? "Gente en Pádel+" : "Nuevos en Pádel+"}</h3>
    <div style="display:flex;gap:10px;overflow-x:auto;padding:10px 16px 2px;scrollbar-width:none">${g.map(p => {
      const f = social.following.has(p.uid);
      return `<button data-user="${p.uid}" style="flex:0 0 92px;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center">${avatar(p, 54)}
        <div class="small" style="font-weight:700;max-width:92px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.nombre)}</div>
        <div class="tiny mute" style="max-width:92px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.nivelPadel ? "Nivel " + (+p.nivelPadel).toFixed(1) : "@" + esc(p.usuario || "")}</div>
        <span class="tiny" style="color:${f ? "#94a3b8" : "var(--volt,#d4ff3a)"};font-weight:700">${f ? "Siguiendo" : "+ Seguir"}</span></button>`;
    }).join("")}</div></div>`;
}
function feedHTML(list) {
  list = list.filter(p => p.tipo !== "historia");
  if (social.busy && !list.length) return `<div class="empty">Cargando entrenos…</div>`;
  if (!list.length) return social.tab === "siguiendo"
    ? `<div class="card empty">${svg("user")}<p>Aún no sigues a nadie.<br>Busca a tus amigos arriba o entra en <b>Descubrir</b>.</p><button class="btn sm" id="goDisc" style="margin-top:10px">Descubrir gente</button></div>`
    : `<div class="card empty">${svg("spark")}<p>Todavía no hay entrenos públicos.<br>¡Sé el primero en publicar uno!</p></div>`;
  return list.map(postCard).join("");
}
function postCard(p) {
  if (p.tipo === "opinion") return opinionCard(p);
  if (p.tipo === "foto") return fotoCard(p);
  if (p.tipo === "historia") return "";
  const s = sportOf(p.deporte), mine = p.uid === me.uid, k = (p.kudos || []).includes(me.uid); const ruta = p.ruta ? JSON.parse(p.ruta) : null;
  const mets = p.dist ? [["Distancia", `${fmtKm(p.dist)} km`], [p.deporte === "bici" ? "Velocidad" : "Ritmo", p.deporte === "bici" ? `${fmtSpeed(p.dist, p.dur)} km/h` : `${fmtPace(p.dur / km(p.dist))} /km`], ["Tiempo", fmtDur(p.dur)]]
    : [["Tiempo", fmtDur(p.dur, true)], p.resultado ? ["Resultado", esc(p.resultado)] : ["Calorías", nf(p.kcal)], p.ejercicios ? ["Ejercicios", p.ejercicios.length] : p.desnivel ? ["Desnivel", `${nf(p.desnivel)} m`] : ["Deporte", s.n]];
  return `<div class="act post" data-post="${p.id}">
    <div class="hd"><button data-user="${p.uid}" style="display:flex;align-items:center;gap:10px;text-align:left;min-width:0">${avatar(p, 40)}<div style="min-width:0"><div class="t" style="font-size:14.5px">${esc(p.autor)}${mine ? ` <span class="mute small">· tú</span>` : ""}</div><div class="s">${relDate(p.fecha)} · ${s.n}</div></div></button>
      <div style="margin-left:auto" class="sp" title="${s.n}"><span style="color:${s.c}">${svg(s.ic)}</span></div></div>
    <div class="t" style="margin-top:10px;font-size:17px">${esc(p.titulo || s.n)}</div>
    ${p.notas ? `<p class="small" style="color:var(--mute);margin-top:4px;line-height:1.45">${esc(p.notas)}</p>` : ""}
    ${p.ganado != null ? `<span class="badge ${p.ganado ? "" : "l"}" style="display:inline-block;margin-top:6px">${p.ganado ? "🏆 Victoria" : "Derrota"}${p.companero ? ` · con ${esc(p.companero)}` : ""}</span>` : ""}
    ${(p.pr || []).length ? `<div class="chip volt" style="margin-top:8px">${svg("trophy")}Récord en ${p.pr.join(", ")}</div>` : ""}
    <div class="mets">${mets.map(([a, b]) => `<div>${a}<b>${b}</b></div>`).join("")}</div>
    ${ruta && ruta.length > 1 ? `<div class="mini">${routeSVG(ruta.map(x => [x[0], x[1]]), 600, 200, s.c)}</div>` : ""}
    <div class="pact"><button data-kudo="${p.id}" class="${k ? "on" : ""}">${svg("heart")}<span>${(p.kudos || []).length || ""}</span>${k ? "" : " Kudos"}</button><button data-com="${p.id}">${svg("mail")}<span>${p.nCom || ""}</span> Comentar</button>${!mine ? `<button data-dm="${p.uid}" style="margin-left:auto">${svg("send")}</button>` : ""}</div></div>`;
}
function weeklyRanking() {
  const w0 = monday(new Date()); const by = {};
  const all = [...social.feed]; // incluye mis publicaciones y las de quienes sigo
  for (const p of all) { if (p.tipo === "opinion" || p.tipo === "foto" || p.tipo === "historia" || new Date(p.fecha) < w0) continue; if (p.uid !== me.uid && !social.following.has(p.uid)) continue; const r = by[p.uid] = by[p.uid] || { uid: p.uid, autor: p.autor, color: p.color, min: 0, n: 0, dep: new Set() }; r.min += p.dur / 60; r.n++; r.dep.add(p.deporte); }
  if (!by[me.uid]) { const ws = weekStats(w0); by[me.uid] = { uid: me.uid, autor: social.me.nombre, color: social.me.color, min: ws.min, n: ws.acts.length, dep: new Set(ws.acts.map(a => a.deporte)) }; }
  return Object.values(by).sort((a, b) => b.min - a.min);
}
function rankHTML(r) {
  const mx = Math.max(1, ...r.map(x => x.min));
  return `<div class="card"><h3>${svg("trophy")}Ranking semanal<span class="small mute" style="white-space:nowrap">minutos</span></h3>
    ${r.map((x, i) => `<button class="item" data-user="${x.uid}" style="${x.uid === me.uid ? "background:var(--volt-soft);border-radius:14px;padding-left:8px;padding-right:8px" : ""}"><span class="num" style="width:22px;font-size:20px;color:${i === 0 ? "#facc15" : i === 1 ? "#cbd5e1" : i === 2 ? "#d97706" : "var(--mute)"}">${i + 1}</span>${avatar(x, 34)}<div style="flex:1;min-width:0"><div style="font-weight:600">${esc(x.autor)}${x.uid === me.uid ? " (tú)" : ""}</div><div style="height:6px;border-radius:9px;background:rgba(15,23,42,.06);margin-top:6px"><div style="height:100%;width:${x.min / mx * 100}%;border-radius:9px;background:var(--volt)"></div></div></div><span class="num" style="font-size:20px;margin-left:8px">${Math.round(x.min)}<small class="mute" style="font-size:12px"> min</small></span></button>`).join("")}
    ${r.length < 2 ? `<p class="small mute" style="margin-top:10px">Sigue a tus amigos para competir con ellos cada semana. El ranking se reinicia los lunes.</p>` : ""}</div>
    <p class="tiny mute" style="text-align:center">Cuenta pádel, gimnasio, fútbol… todo suma. Nada de pagar por ver tus propias estadísticas.</p>`;
}
// Un mismo partido/entreno solo una vez (si cambió la fecha se generaba otro id)
function dedupePosts(L) { const m = new Map(); for (const p of L) { const k = p.act ? p.uid + "|" + p.act : p.id; const o = m.get(k); if (!o || (p.t || 0) > (o.t || 0)) m.set(k, p); } return [...m.values()]; }
async function loadFeed(force = false) {
  if (!socialOn() || social.busy) return; if (!force && Date.now() - social.lastLoad < 60e3) return;
  social.busy = true;
  try {
    const ids = [me.uid, ...social.following];
    const res = await Promise.all(ids.slice(0, 60).map(u => FS().collection("posts").where("uid", "==", u).limit(15).get().catch(() => ({ docs: [] }))));
    let all = res.flatMap(s => s.docs.map(d => d.data())).filter(p => p.tipo !== "liga" && p.fecha);
    // Limpieza: publicaciones mías de partidos/entrenos que ya no existen (p. ej. partidos que no llegaron a guardarse)
    const ghost = new Set();
    if (loaded && state.act) all.filter(p => p.uid === me.uid && p.act && !state.act[p.act]).forEach(p => { ghost.add(p.id); FS().collection("posts").doc(p.id).delete().catch(() => {}); });
    social.feed = dedupePosts(all.filter(p => !ghost.has(p.id))).sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 80);
    const d = await FS().collection("posts").orderBy("fecha", "desc").limit(40).get();
    social.disc = dedupePosts(d.docs.map(x => x.data()).filter(p => !ghost.has(p.id)));
    const g = await FS().collection("perfiles").orderBy("creado", "desc").limit(30).get().catch(() => ({ docs: [] }));
    social.gente = g.docs.map(x => x.data()).filter(x => x.uid && x.uid !== me.uid);
    social.lastLoad = Date.now(); limpiarHistorias();
  } catch (e) { console.warn(e); } finally { social.busy = false; }
  if (view === "comunidad" && !sheetOpen) render();
}
WIRE.comunidad = () => {
  const st = $("#cpStart"); if (st) { st.onclick = () => openPerfilPublico(); return; }
  if (!social.me) return;
  loadFeed();
  $$("[data-st]").forEach(b => b.onclick = () => { social.tab = b.dataset.st; render(); });
  const gd = $("#goDisc"); if (gd) gd.onclick = () => { social.tab = "descubrir"; render(); };
  if (social.tab === "zapas") social.tab = "siguiendo"; wirePosts($("#view")); wireHistorias($("#view"));
  const on = $("#opNew"); if (on) on.onclick = () => openOpinar();
  let to; $("#srch").oninput = e => { clearTimeout(to); const q = e.target.value.trim().toLowerCase().replace(/^@/, ""); to = setTimeout(() => searchPeople(q), 300); };
};
function wirePosts(root) {
  $$("[data-user]", root).forEach(b => b.onclick = e => { e.stopPropagation(); openUser(b.dataset.user); });
  $$("[data-kudo]", root).forEach(b => b.onclick = e => { e.stopPropagation(); toggleKudo(b.dataset.kudo, b); });
  $$("[data-com]", root).forEach(b => b.onclick = e => { e.stopPropagation(); openPost(b.dataset.com); });
  $$("[data-dm]", root).forEach(b => b.onclick = e => { e.stopPropagation(); openChatWith(b.dataset.dm); });
  $$("[data-post]", root).forEach(b => b.onclick = () => openPost(b.dataset.post));
  $$("[data-gear]", root).forEach(b => b.onclick = e => { e.stopPropagation(); openGear(b.dataset.gear); });
  wireFotos(root);
  $$("[data-delop]", root).forEach(b => b.onclick = e => { e.stopPropagation(); const id = b.dataset.delop;
    confirmSheet("Borrar opinión", "¿Seguro que quieres borrar esta opinión?", "Borrar", async () => { try { await FS().collection("posts").doc(id).delete(); } catch {} social.feed = social.feed.filter(x => x.id !== id); social.disc = social.disc.filter(x => x.id !== id); closeSheet(); toast("Opinión borrada"); }); });
}
const findPost = id => social.feed.find(p => p.id === id) || social.disc.find(p => p.id === id) || (userPosts || []).find(p => p.id === id);
async function toggleKudo(id, btn) {
  const p = findPost(id); if (!p) return; const on = (p.kudos || []).includes(me.uid);
  [social.feed, social.disc, userPosts || []].forEach(l => l.forEach(x => { if (x.id === id) x.kudos = on ? x.kudos.filter(u => u !== me.uid) : [...(x.kudos || []), me.uid]; }));
  if (btn) { btn.classList.toggle("on", !on); btn.innerHTML = `${svg("heart")}<span>${p.kudos.length || ""}</span>${!on ? "" : " Kudos"}`; if (!on) { btn.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], 300); navigator.vibrate && navigator.vibrate(15); } }
  try {
    await FS().collection("posts").doc(id).update({ kudos: on ? FV().arrayRemove(me.uid) : FV().arrayUnion(me.uid) });
    if (!on && p.uid !== me.uid) aviso(p.uid, { tipo: "kudos", post: id, texto: `ha dado kudos a «${p.titulo}»` });
  } catch (e) { console.warn(e); toast("No se pudo dar kudos"); }
}
function aviso(uid, o) { FS().collection("users").doc(uid).collection("avisos").add({ ...o, de: me.uid, autor: social.me.nombre, color: social.me.color, t: Date.now(), leido: false }).catch(() => {}); }

// ---------- Publicación y comentarios ----------
let comUnsub = null;
function openPost(id) {
  const p = findPost(id); if (!p) return;
  openSheet(p.tipo === "opinion" ? "Opinión" : p.tipo === "foto" ? "Publicación" : p.deporte === "padel" ? "Partido" : "Entreno", `<div id="pBox">${postCard(p)}</div><div class="sec">Comentarios</div><div id="coms"><p class="small mute">Cargando…</p></div>
    <div class="cbar"><input id="cIn" placeholder="Escribe un comentario…" maxlength="500"><button class="btn pri sm" id="cSend">${svg("send")}</button></div>`, s => {
    wirePosts($("#pBox", s)); $$("[data-post]", s).forEach(b => b.onclick = null);
    comUnsub && comUnsub(); comUnsub = FS().collection("posts").doc(id).collection("comentarios").orderBy("t").onSnapshot(q => {
      const c = q.docs.map(d => ({ id: d.id, ...d.data() })); const box = $("#coms"); if (!box) { comUnsub(); comUnsub = null; return; }
      box.innerHTML = c.length ? c.map(x => `<div class="meal"><button data-user="${x.uid}">${avatar(x, 34)}</button><div style="min-width:0;flex:1"><div class="small"><b>${esc(x.autor)}</b> <span class="mute">${ago(x.t)}</span></div><div style="margin-top:2px;line-height:1.4;word-wrap:break-word">${esc(x.texto)}</div></div>${x.uid === me.uid || p.uid === me.uid ? `<button data-dcom="${x.id}" class="mute tiny">borrar</button>` : ""}</div>`).join("") : `<p class="small mute">Sé el primero en comentar.</p>`;
      $$("[data-user]", box).forEach(b => b.onclick = () => openUser(b.dataset.user));
      $$("[data-dcom]", box).forEach(b => b.onclick = async () => { await FS().collection("posts").doc(id).collection("comentarios").doc(b.dataset.dcom).delete().catch(() => {}); FS().collection("posts").doc(id).update({ nCom: FV().increment(-1) }).catch(() => {}); });
    }, () => { const box = $("#coms"); if (box) box.innerHTML = `<p class="small mute">No se pudieron cargar los comentarios.</p>`; });
    const send = async () => {
      const inp = $("#cIn", s); const t = inp.value.trim(); if (!t) return; inp.value = "";
      try { await FS().collection("posts").doc(id).collection("comentarios").add({ uid: me.uid, autor: social.me.nombre, color: social.me.color, texto: t.slice(0, 500), t: Date.now() });
        FS().collection("posts").doc(id).update({ nCom: FV().increment(1) }).catch(() => {}); p.nCom = (p.nCom || 0) + 1;
        if (p.uid !== me.uid) aviso(p.uid, { tipo: "comentario", post: id, texto: `ha comentado: «${t.slice(0, 60)}»` });
      } catch { toast("No se pudo enviar"); }
    };
    $("#cSend", s).onclick = send; $("#cIn", s).onkeydown = e => { if (e.key === "Enter") send(); };
  });
}

// ---------- Perfiles ----------
function openPerfilPublico() {
  const p = social.me || { nombre: me.name || state.perfil.nombre || "", usuario: "", bio: "", ciudad: "", color: COLORS[Math.floor(Math.random() * COLORS.length)], ocultarInicio: true };
  const sug = (p.nombre || me.email.split("@")[0]).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9._]/g, "").slice(0, 16);
  openSheet(social.me ? "Editar perfil público" : "Tu perfil público", `
    <div style="display:flex;justify-content:center;margin-bottom:12px" id="avPrev">${avatar(p, 72)}</div>
    <div class="seg" id="colSeg" style="justify-content:center">${COLORS.map(c => `<button data-c="${c}" style="width:34px;height:34px;padding:0;border-radius:50%;background:${c};${p.color === c ? "outline:3px solid #fff;outline-offset:2px" : ""}"></button>`).join("")}</div>
    <label class="field">Nombre<input id="ppN" maxlength="40" value="${esc(p.nombre)}"></label>
    <label class="field">Usuario<input id="ppU" maxlength="20" value="${esc(p.usuario || sug)}" ${social.me ? "disabled" : ""} autocapitalize="off" autocorrect="off" spellcheck="false"></label>
    <p class="tiny mute" style="margin:-6px 0 12px">${social.me ? "El usuario no se puede cambiar." : "Solo minúsculas, números, punto y guion bajo. Será tu @ en Pádel+."}</p>
    <label class="field">Ciudad (opcional)<input id="ppC" maxlength="40" value="${esc(p.ciudad || "")}"></label>
    <label class="field">Sobre ti (opcional)<textarea id="ppB" rows="2" maxlength="160" placeholder="Juego de revés, 3 días por semana, buscando pala nueva">${esc(p.bio || "")}</textarea></label>
    <label class="check"><input type="checkbox" id="ppZ" ${p.ocultarInicio !== false ? "checked" : ""}> <span><b>Zona privada:</b> ocultar los primeros y últimos 200 m de mis rutas (para que nadie sepa dónde vives)</span></label>
    <div class="err" id="ppE"></div><button class="btn pri block" id="ppOk">${social.me ? "Guardar" : "Crear perfil"}</button>
    ${social.me ? `<button class="btn block danger" id="ppDel" style="margin-top:10px">Dejar la comunidad</button>` : ""}`, s => {
    let color = p.color;
    $$("[data-c]", s).forEach(b => b.onclick = () => { color = b.dataset.c; $$("[data-c]", s).forEach(x => x.style.outline = x === b ? "3px solid #fff" : "none"); $("#avPrev", s).innerHTML = avatar({ nombre: $("#ppN", s).value || "?", color }, 72); });
    $("#ppOk", s).onclick = async () => {
      const nombre = $("#ppN", s).value.trim(), usuario = social.me ? social.me.usuario : $("#ppU", s).value.trim().toLowerCase().replace(/^@/, "");
      if (!nombre) { $("#ppE", s).textContent = "Pon tu nombre."; return; } if (!handleOk(usuario)) { $("#ppE", s).textContent = "El usuario debe tener de 3 a 20 caracteres: letras minúsculas, números, punto o guion bajo."; return; }
      const b = $("#ppOk", s); b.disabled = true; $("#ppE", s).textContent = "";
      try {
        if (!social.me) { const h = await FS().collection("usuarios").doc(usuario).get().catch(() => null); if (h && h.exists) { $("#ppE", s).textContent = "Ese usuario ya existe. Prueba otro."; b.disabled = false; return; }
          await FS().collection("usuarios").doc(usuario).set({ uid: me.uid }); }
        const data = { uid: me.uid, nombre, nombreLower: nombre.toLowerCase(), usuario, ciudad: $("#ppC", s).value.trim(), bio: $("#ppB", s).value.trim(), color, ocultarInicio: $("#ppZ", s).checked, creado: (social.me && social.me.creado) || Date.now() };
        await FS().collection("perfiles").doc(me.uid).set(data, { merge: true }); const first = !social.me; social.me = { ...(social.me || {}), ...data };
        closeSheet(); toast(first ? "¡Bienvenido a la comunidad! 🎉" : "Perfil guardado");
        if (first) { for (const a of actList().filter(a => Date.now() - Date.parse(a.fecha) < 10 * 864e5)) await publishAct(a, false); social.lastLoad = 0; loadFeed(true); }
      } catch (e) { console.warn(e); $("#ppE", s).textContent = "No se pudo guardar. Revisa tu conexión."; b.disabled = false; }
    };
    const dl = $("#ppDel", s); if (dl) dl.onclick = () => confirmSheet("¿Dejar la comunidad?", "Se borrará tu perfil público y tus publicaciones. Tus entrenos siguen guardados en tu cuenta.", "Dejar", async () => { await leaveSocial(); closeSheet(); toast("Has dejado la comunidad"); });
  });
}
async function leaveSocial() {
  if (!social.me) return; const db = FS();
  const ps = await db.collection("posts").where("uid", "==", me.uid).get(); for (const d of ps.docs) await d.ref.delete();
  const fs = await db.collection("follows").where("de", "==", me.uid).get(); for (const d of fs.docs) await d.ref.delete();
  await db.collection("usuarios").doc(social.me.usuario).delete().catch(() => {}); await db.collection("perfiles").doc(me.uid).delete();
  social.me = null; social.feed = []; social.following = new Set();
}
let userPosts = null;
async function openUser(uid) {
  if (uid === me.uid && !social.me) return;
  openSheet("Perfil", `<div class="empty">Cargando…</div>`);
  try {
    const db = FS(); const [ps, fo, fi, po] = await Promise.all([db.collection("perfiles").doc(uid).get(), db.collection("follows").where("a", "==", uid).get(), db.collection("follows").where("de", "==", uid).get(), db.collection("posts").where("uid", "==", uid).limit(30).get()]);
    if (!ps.exists) { $("#sheet .empty").textContent = "Este perfil ya no existe."; return; }
    const p = ps.data(); userPosts = po.docs.map(d => d.data()).filter(x => x.tipo !== "historia" && x.tipo !== "liga" && x.fecha).sort((a, b) => b.fecha.localeCompare(a.fecha)); const mine = uid === me.uid, sigo = social.following.has(uid);
    const y = new Date().getFullYear(); const ya = userPosts.filter(x => new Date(x.fecha).getFullYear() === y);
    const html = `<div style="display:flex;align-items:center;gap:14px">${avatar(p, 68)}<div style="min-width:0"><div style="font-weight:800;font-size:20px">${esc(p.nombre)}</div><div class="small mute">@${esc(p.usuario)}${p.ciudad ? ` · ${esc(p.ciudad)}` : ""}</div></div></div>
      ${p.bio ? `<p style="margin-top:12px;line-height:1.45">${esc(p.bio)}</p>` : ""}
      <div class="grid3" style="margin:14px 0"><div class="stat"><div class="k">Seguidores</div><div class="v num">${fo.size}</div></div><div class="stat"><div class="k">Siguiendo</div><div class="v num">${fi.size}</div></div><div class="stat"><div class="k">Publicado</div><div class="v num">${userPosts.length}</div></div></div>
      ${mine ? `<button class="btn block" id="uEdit">${svg("edit")}Editar perfil público</button>` : `<div class="row"><button class="btn ${sigo ? "" : "pri"}" id="uFol">${sigo ? "Siguiendo ✓" : "Seguir"}</button><button class="btn" id="uDm">${svg("mail")}Mensaje</button></div>${caraACaraHTML(uid, p)}`}
      ${ya.length ? `<div class="sec">${y}</div><div class="grid3"><div class="stat"><div class="k">Tiempo</div><div class="v num" style="font-size:22px">${fmtDur(ya.reduce((s, x) => s + x.dur, 0), true)}</div></div><div class="stat"><div class="k">Distancia</div><div class="v num" style="font-size:22px">${fmtKm(ya.reduce((s, x) => s + x.dist, 0))}<small>km</small></div></div><div class="stat"><div class="k">Deportes</div><div class="v num" style="font-size:22px">${new Set(ya.map(x => x.deporte)).size}</div></div></div>` : ""}
      <div class="sec">Partidos y entrenos</div><div id="uPosts">${userPosts.length ? userPosts.map(postCard).join("") : `<p class="small mute">Aún no ha publicado entrenos.</p>`}</div>`;
    const s = $("#sheet"); s.innerHTML = `<div class="grab"></div><div class="sh"><h2>${esc(p.nombre.split(" ")[0])}</h2><button class="x" id="shX">${svg("close")}</button></div>${html}`; $("#shX").onclick = closeSheet;
    wirePosts($("#uPosts", s)); $$("#uPosts [data-user]", s).forEach(b => b.onclick = e => e.stopPropagation());
    if (mine) $("#uEdit", s).onclick = () => openPerfilPublico();
    else { $("#uFol", s).onclick = () => toggleFollow(uid, p).then(() => openUser(uid)); $("#uDm", s).onclick = () => openChatWith(uid, p); const rv = $("#uRev", s); if (rv) rv.onclick = () => { const pre = JSON.parse(rv.dataset.pre); closeSheet(); setTimeout(() => openPadelMatch({ pre }), 260); }; }
  } catch (e) { console.warn(e); const em = $("#sheet .empty"); if (em) em.textContent = "No se pudo cargar el perfil."; }
}
async function toggleFollow(uid, p) {
  const id = `${me.uid}_${uid}`; const db = FS();
  try {
    if (social.following.has(uid)) { await db.collection("follows").doc(id).delete(); social.following.delete(uid); toast(`Has dejado de seguir a ${p.nombre.split(" ")[0]}`); }
    else { await db.collection("follows").doc(id).set({ de: me.uid, a: uid, t: Date.now() }); social.following.add(uid); toast(`Ahora sigues a ${p.nombre.split(" ")[0]}`); aviso(uid, { tipo: "seguir", texto: "ha empezado a seguirte" }); }
    social.lastLoad = 0; loadFeed(true);
  } catch (e) { console.warn(e); toast("No se pudo"); }
}
async function searchPeople(q) {
  const box = $("#srchRes"); if (!box) return; if (q.length < 2) { box.innerHTML = ""; return; }
  try {
    const db = FS(); const [a, b] = await Promise.all([db.collection("perfiles").where("usuario", ">=", q).where("usuario", "<=", q + "").limit(8).get(), db.collection("perfiles").where("nombreLower", ">=", q).where("nombreLower", "<=", q + "").limit(8).get()]);
    const m = new Map(); [...a.docs, ...b.docs].forEach(d => m.set(d.id, d.data()));
    box.innerHTML = m.size ? `<div class="card" style="padding:4px 14px">${[...m.values()].map(p => `<button class="item" data-user="${p.uid}">${avatar(p, 36)}<div><div style="font-weight:600">${esc(p.nombre)}</div><div class="small mute">@${esc(p.usuario)}${p.ciudad ? " · " + esc(p.ciudad) : ""}</div></div>${social.following.has(p.uid) ? `<span class="badge" style="margin-left:auto">Siguiendo</span>` : svg("chev", "chev")}</button>`).join("")}</div>` : `<p class="small mute" style="margin:0 4px 12px">No hay nadie con ese nombre.</p>`;
    $$("[data-user]", box).forEach(b => b.onclick = () => openUser(b.dataset.user));
  } catch (e) { console.warn(e); }
}

// ---------- Mensajes ----------
let chatOpenId = null, msgUnsub = null;
const chatIdWith = uid => [me.uid, uid].sort().join("_");
function openChats() {
  if (!socialOn()) { setView("comunidad"); return; }
  chatOpenId = "__list"; openSheet("Mensajes", `<div id="chatList"></div>`, () => drawChatList());
}
function drawChatList() {
  const box = $("#chatList"); if (!box) return;
  box.innerHTML = social.chats.length ? social.chats.map(c => { const o = c.miembros.find(u => u !== me.uid); const n = (c.nombres || {})[o] || "Deportista"; const un = c.ultimo && c.ultimo.de !== me.uid && (c.ultimo.t || 0) > ((c.leido || {})[me.uid] || 0);
    return `<button class="item" data-chat="${o}">${avatar({ nombre: n, color: (c.colores || {})[o] }, 44)}<div style="min-width:0;flex:1"><div style="font-weight:${un ? 800 : 600}">${esc(n)}</div><div class="small ${un ? "" : "mute"}" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.ultimo ? (c.ultimo.de === me.uid ? "Tú: " : "") + esc(c.ultimo.texto) : "Nueva conversación"}</div></div><div style="text-align:right"><div class="tiny mute">${c.ultimo ? ago(c.ultimo.t) : ""}</div>${un ? `<span class="nb">●</span>` : ""}</div></button>`; }).join("")
    : `<div class="empty">${svg("mail")}<p>No tienes mensajes.<br>Entra en el perfil de alguien y toca <b>Mensaje</b>.</p></div>`;
  $$("[data-chat]", box).forEach(b => b.onclick = () => openChatWith(b.dataset.chat));
}
async function openChatWith(uid, prof = null) {
  if (!socialOn() || uid === me.uid) return;
  const id = chatIdWith(uid); const db = FS();
  try {
    if (!prof) { const s = await db.collection("perfiles").doc(uid).get(); prof = s.exists ? s.data() : { nombre: "Deportista", color: "#94a3b8" }; }
    await db.collection("chats").doc(id).set({ miembros: [me.uid, uid].sort(), nombres: { [me.uid]: social.me.nombre, [uid]: prof.nombre }, colores: { [me.uid]: social.me.color, [uid]: prof.color || "#94a3b8" }, leido: { [me.uid]: Date.now() } }, { merge: true });
  } catch (e) { console.warn(e); toast("No se pudo abrir el chat"); return; }
  chatOpenId = id;
  openSheet(`<span style="display:flex;align-items:center;gap:10px">${avatar(prof, 32)}${esc(prof.nombre)}</span>`, `<div id="msgs" class="msgs"><p class="small mute" style="text-align:center">Cargando…</p></div>
    <div class="cbar" style="position:sticky;bottom:0"><input id="mIn" placeholder="Escribe un mensaje…" maxlength="1000"><button class="btn pri sm" id="mSend">${svg("send")}</button></div>`, s => {
    msgUnsub && msgUnsub();
    msgUnsub = db.collection("chats").doc(id).collection("msgs").orderBy("t").limitToLast(100).onSnapshot(q => {
      const box = $("#msgs"); if (!box || chatOpenId !== id) { msgUnsub && msgUnsub(); msgUnsub = null; return; }
      const ms = q.docs.map(d => d.data());
      box.innerHTML = ms.length ? ms.map((m, i) => { const day = new Date(m.t).toDateString() !== (ms[i - 1] ? new Date(ms[i - 1].t).toDateString() : ""); return `${day ? `<div class="tiny mute" style="text-align:center;margin:10px 0">${relDate(new Date(m.t).toISOString()).split(" · ")[0]}</div>` : ""}<div class="bub ${m.de === me.uid ? "me" : ""}">${esc(m.texto)}<span>${pad(new Date(m.t).getHours())}:${pad(new Date(m.t).getMinutes())}</span></div>`; }).join("") : `<p class="small mute" style="text-align:center;margin:20px 0">Saluda a ${esc(prof.nombre.split(" ")[0])} 👋</p>`;
      const sh = $("#sheet"); sh.scrollTop = sh.scrollHeight;
      db.collection("chats").doc(id).update({ [`leido.${me.uid}`]: Date.now() }).catch(() => {});
    }, e => console.warn(e));
    const send = async () => { const inp = $("#mIn", s); const t = inp.value.trim(); if (!t) return; inp.value = ""; const now = Date.now();
      try { await db.collection("chats").doc(id).collection("msgs").add({ de: me.uid, texto: t.slice(0, 1000), t: now }); await db.collection("chats").doc(id).update({ ultimo: { de: me.uid, texto: t.slice(0, 120), t: now }, t: now, [`leido.${me.uid}`]: now }); } catch (e) { console.warn(e); toast("No se pudo enviar"); } };
    $("#mSend", s).onclick = send; $("#mIn", s).onkeydown = e => { if (e.key === "Enter") send(); };
  });
}

// ---------- Avisos ----------
function openAvisos() {
  if (!socialOn()) { setView("comunidad"); return; }
  const list = social.avisos;
  openSheet("Avisos", list.length ? list.map(a => `<button class="item" data-av="${a.id}" style="${a.leido ? "" : "background:rgba(212,255,58,.05);border-radius:12px;padding-left:8px"}">${avatar(a, 38)}<div style="min-width:0;flex:1"><div class="small" style="line-height:1.4"><b>${esc(a.autor)}</b> ${esc(a.texto)}</div><div class="tiny mute" style="margin-top:2px">${ago(a.t)}</div></div><span style="color:${a.tipo === "kudos" ? "var(--hot)" : a.tipo === "seguir" ? "var(--volt)" : "var(--sky)"}">${svg(a.tipo === "kudos" ? "heart" : a.tipo === "seguir" ? "user" : "mail")}</span></button>`).join("")
    : `<div class="empty">${svg("bell")}<p>Aquí verás quién te da kudos, te comenta o te sigue.</p></div>`, s => {
    $$("[data-av]", s).forEach(b => b.onclick = () => { const a = list.find(x => x.id === b.dataset.av); if (a.post) { const p = findPost(a.post); if (p) openPost(a.post); else FS().collection("posts").doc(a.post).get().then(d => { if (d.exists) { social.disc.push(d.data()); openPost(a.post); } }); } else openUser(a.de); });
    list.filter(a => !a.leido).forEach(a => store.base.collection("avisos").doc(a.id).update({ leido: true }).catch(() => {}));
  });
}
