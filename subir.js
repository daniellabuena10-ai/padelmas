// ---------- Subir foto: publicación o historia (rápido, sin formularios) ----------
// Foto + texto opcional. La imagen se comprime en el móvil y se guarda en el propio post de Firestore.
const HIST_MS = 24 * 3600e3;

(function injectSubirCSS() {
  const css = `
.stbar{display:flex;gap:12px;overflow-x:auto;padding:2px 2px 12px;margin-bottom:6px;scrollbar-width:none}
.stbar::-webkit-scrollbar{display:none}
.stbar button{flex:0 0 66px;display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center}
.stbar .ring{width:62px;height:62px;border-radius:50%;padding:3px;background:linear-gradient(135deg,#facc15,#d4ff3a 45%,#38bdf8);display:grid;place-items:center}
.stbar .ring.seen{background:rgba(255,255,255,.18)}
.stbar .ring>.av,.stbar .ring>.addst{border:3px solid var(--bg,#0a0d11)}
.stbar .addst{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:var(--card,#f6f9fc);font-size:26px;color:var(--volt,#d4ff3a)}
.stbar .nm{font-size:11.5px;max-width:66px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.subQuick{display:flex;gap:10px;margin-bottom:12px}
.subQuick button{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 10px;border-radius:16px;font-weight:800;background:var(--card,#f6f9fc);border:1px solid var(--line,rgba(255,255,255,.08))}
.subQuick button.hi{background:linear-gradient(135deg,rgba(250,204,21,.18),rgba(212,255,58,.12));border-color:rgba(250,204,21,.4)}
.subPrev{width:100%;border-radius:18px;overflow:hidden;background:#000;display:grid;place-items:center;margin-bottom:12px;max-height:52vh}
.subPrev img{max-width:100%;max-height:52vh;display:block;object-fit:contain}
.segSub{display:flex;background:rgba(255,255,255,.06);border-radius:14px;padding:4px;margin-bottom:12px}
.segSub button{flex:1;padding:11px;border-radius:11px;font-weight:700;color:var(--mute,#94a3b8)}
.segSub button.on{background:var(--volt,#d4ff3a);color:#0a0d11}
.postImg{margin-top:10px;border-radius:16px;overflow:hidden;background:#000}
.postImg img{width:100%;display:block;max-height:520px;object-fit:cover}
#stView{position:fixed;inset:0;z-index:9999;background:#000;display:flex;flex-direction:column;touch-action:manipulation}
#stView .bars{display:flex;gap:4px;padding:calc(env(safe-area-inset-top) + 10px) 10px 8px}
#stView .bars i{flex:1;height:3px;border-radius:3px;background:rgba(255,255,255,.3);overflow:hidden}
#stView .bars i b{display:block;height:100%;width:0;background:#fff}
#stView .top{display:flex;align-items:center;gap:10px;padding:0 12px 8px;color:#fff}
#stView .top .x{margin-left:auto;font-size:26px;padding:4px 8px;color:#fff}
#stView .pic{flex:1;display:grid;place-items:center;position:relative;min-height:0}
#stView .pic img{max-width:100%;max-height:100%;object-fit:contain}
#stView .cap{position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom) + 24px);text-align:center;padding:0 22px}
#stView .cap span{display:inline-block;background:rgba(0,0,0,.55);color:#fff;padding:8px 14px;border-radius:14px;font-weight:600;line-height:1.35;max-width:100%;word-wrap:break-word}
#stView .nav{position:absolute;inset:0;display:flex}
#stView .nav div{flex:1}`;
  const st = document.createElement("style"); st.textContent = css; document.head.append(st);
})();

// Abre la cámara / galería directamente; al elegir foto, pantalla mínima para subir.
function openSubir(tipo = "foto") {
  if (!socialOn()) { toast("Necesitas conexión para subir fotos"); return; }
  if (!social.me) { toast("Crea tu perfil público para poder subir fotos"); openPerfilPublico(); return; }
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.style.display = "none";
  document.body.append(inp);
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; inp.remove(); if (!f) return;
    try { const img = await comprimirFoto(f); subirSheet(img, tipo); }
    catch (e) { console.warn(e); toast("No se pudo leer la foto"); }
  };
  inp.click();
}

async function comprimirFoto(file, max = 1080) {
  const url = URL.createObjectURL(file);
  try {
    const im = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
    let w = im.naturalWidth, h = im.naturalHeight; const k = Math.min(1, max / Math.max(w, h)); w = Math.round(w * k); h = Math.round(h * k);
    const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d");
    x.fillStyle = "#000"; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h);
    let q = 0.75, d = c.toDataURL("image/jpeg", q);
    while (d.length > 650000 && q > 0.35) { q -= 0.1; d = c.toDataURL("image/jpeg", q); } // Firestore admite como mucho ~1 MB por documento
    if (d.length > 900000) throw new Error("foto demasiado grande");
    return d;
  } finally { URL.revokeObjectURL(url); }
}

function subirSheet(img, tipo) {
  openSheet("Subir", `<div class="subPrev"><img src="${img}" alt=""></div>
    <div class="segSub" id="sbT"><button data-t="foto" class="${tipo === "foto" ? "on" : ""}">Publicación</button><button data-t="historia" class="${tipo === "historia" ? "on" : ""}">Historia · 24 h</button></div>
    <label class="field" style="margin-bottom:12px"><textarea id="sbTx" rows="2" maxlength="300" placeholder="Escribe algo (opcional)… ej. Zapas nuevas 🔥"></textarea></label>
    <p class="small" id="sbE" style="color:var(--hot,#f87171);min-height:1em"></p>
    <div class="row"><button class="btn" id="sbOtra">Otra foto</button><button class="btn pri" id="sbOk">${svg("upload")}Subir</button></div>`, s => {
    $$("#sbT button", s).forEach(b => b.onclick = () => { tipo = b.dataset.t; $$("#sbT button", s).forEach(x => x.classList.toggle("on", x === b)); });
    $("#sbOtra", s).onclick = () => { closeSheet(); setTimeout(() => openSubir(tipo), 120); };
    $("#sbOk", s).onclick = async () => {
      const b = $("#sbOk", s); b.disabled = true; b.textContent = "Subiendo…";
      try { await publicarFoto(img, tipo, $("#sbTx", s).value.trim().slice(0, 300)); closeSheet(); toast(tipo === "historia" ? "¡Historia subida! Dura 24 h" : "¡Publicado!"); if (view !== "comunidad") setView("comunidad"); }
      catch (e) { console.warn(e); $("#sbE", s).textContent = "No se pudo subir. Revisa tu conexión."; b.disabled = false; b.innerHTML = `${svg("upload")}Subir`; }
    };
  });
}

async function publicarFoto(img, tipo, texto) {
  const now = new Date().toISOString(), t = Date.now();
  const id = "p" + Math.max(0, 1e13 - t).toString(36).padStart(9, "0") + "_" + (tipo === "historia" ? "hs" : "ft") + me.uid.slice(0, 6) + Math.random().toString(36).slice(2, 5);
  const p = { id, uid: me.uid, autor: social.me.nombre, usuario: social.me.usuario, color: social.me.color, foto: social.me.foto || null,
    tipo, deporte: "padel", fecha: now, t, img, texto, titulo: texto ? texto.slice(0, 60) : (tipo === "historia" ? "Historia" : "Foto"),
    kudos: [], nCom: 0, dur: 0, dist: 0, ...(tipo === "historia" ? { expira: t + HIST_MS } : {}) };
  await FS().collection("posts").doc(id).set(p);
  social.feed.unshift(p); social.disc.unshift(p);
}

// Tarjeta de publicación con foto (en el feed)
function fotoCard(p) {
  const mine = p.uid === me.uid, k = (p.kudos || []).includes(me.uid);
  return `<div class="act post" data-post="${p.id}">
    <div class="hd"><button data-user="${p.uid}" style="display:flex;align-items:center;gap:10px;text-align:left;min-width:0">${avatar(p, 40)}<div style="min-width:0"><div class="t" style="font-size:14.5px">${esc(p.autor)}${mine ? ` <span class="mute small">· tú</span>` : ""}</div><div class="s">${relDate(p.fecha)}</div></div></button>
      ${mine ? `<button data-delft="${p.id}" class="mute tiny" style="margin-left:auto">borrar</button>` : ""}</div>
    ${p.texto ? `<p style="margin-top:10px;line-height:1.45">${esc(p.texto)}</p>` : ""}
    <div class="postImg"><img src="${p.img}" alt="" loading="lazy"></div>
    <div class="pact"><button data-kudo="${p.id}" class="${k ? "on" : ""}">${svg("heart")}<span>${(p.kudos || []).length || ""}</span>${k ? "" : " Kudos"}</button><button data-com="${p.id}">${svg("mail")}<span>${p.nCom || ""}</span> Comentar</button>${!mine ? `<button data-dm="${p.uid}" style="margin-left:auto">${svg("send")}</button>` : ""}</div></div>`;
}
function wireFotos(root) {
  $$("[data-delft]", root).forEach(b => b.onclick = e => { e.stopPropagation(); const id = b.dataset.delft;
    confirmSheet("Borrar publicación", "¿Seguro que quieres borrar esta foto?", "Borrar", () => borrarPost(id, "Publicación borrada")); });
}
async function borrarPost(id, msg) {
  try { await FS().collection("posts").doc(id).delete(); } catch {}
  social.feed = social.feed.filter(x => x.id !== id); social.disc = social.disc.filter(x => x.id !== id);
  closeSheet(); toast(msg);
}

// ---------- Historias ----------
const esHistoriaViva = p => p.tipo === "historia" && (p.expira || (p.t + HIST_MS)) > Date.now();
function historiasPorUsuario() {
  const seen = new Set(), by = new Map();
  [...social.feed, ...social.disc].filter(p => esHistoriaViva(p) && !seen.has(p.id) && seen.add(p.id))
    .filter(p => p.uid === me.uid || social.following.has(p.uid))
    .sort((a, b) => a.t - b.t).forEach(p => { if (!by.has(p.uid)) by.set(p.uid, []); by.get(p.uid).push(p); });
  const L = [...by.values()];
  return L.sort((a, b) => (a[0].uid === me.uid ? -1 : b[0].uid === me.uid ? 1 : b[b.length - 1].t - a[a.length - 1].t));
}
function vistas() { try { return JSON.parse(localStorage.getItem("padel-hvistas") || "{}"); } catch { return {}; } }
function marcarVista(id) { try { const v = vistas(); v[id] = Date.now(); for (const k in v) if (Date.now() - v[k] > 2 * HIST_MS) delete v[k]; localStorage.setItem("padel-hvistas", JSON.stringify(v)); } catch {} }

function historiasHTML() {
  const g = historiasPorUsuario(), v = vistas(), mias = g.find(x => x[0].uid === me.uid);
  return `<div class="stbar">
    <button id="stMine"><div class="ring ${mias ? "" : "seen"}">${mias ? avatar(social.me, 56) : `<div class="addst">+</div>`}</div><div class="nm">${mias ? "Tu historia" : "Subir historia"}</div></button>
    ${g.filter(x => x[0].uid !== me.uid).map(x => `<button data-st-u="${x[0].uid}"><div class="ring ${x.every(p => v[p.id]) ? "seen" : ""}">${avatar(x[0], 56)}</div><div class="nm">${esc(x[0].autor.split(" ")[0])}</div></button>`).join("")}
  </div>
  <div class="subQuick"><button class="hi" id="sqFoto">📸 Publicar foto</button><button id="sqHist">⏱ Subir historia</button></div>`;
}
function wireHistorias(root) {
  const mine = $("#stMine", root); if (mine) mine.onclick = () => { const g = historiasPorUsuario().find(x => x[0].uid === me.uid); g ? verHistorias(g) : openSubir("historia"); };
  $$("[data-st-u]", root).forEach(b => b.onclick = () => { const g = historiasPorUsuario().find(x => x[0].uid === b.dataset.stU); if (g) verHistorias(g); });
  const f = $("#sqFoto", root); if (f) f.onclick = () => openSubir("foto");
  const h = $("#sqHist", root); if (h) h.onclick = () => openSubir("historia");
}

let stTimer = null;
function verHistorias(list, i = 0) {
  clearTimeout(stTimer); let el = $("#stView"); if (!el) { el = document.createElement("div"); el.id = "stView"; document.body.append(el); }
  const p = list[i]; if (!p) { cerrarHistorias(); return; } marcarVista(p.id); const mine = p.uid === me.uid;
  el.innerHTML = `<div class="bars">${list.map((_, j) => `<i><b style="width:${j < i ? 100 : 0}%"></b></i>`).join("")}</div>
    <div class="top">${avatar(p, 34)}<div><div style="font-weight:700">${esc(p.autor)}</div><div class="tiny" style="opacity:.7">${ago(p.t)}</div></div>
      ${mine ? `<button id="stDel" style="margin-left:auto;color:#fff;opacity:.85;padding:6px">${svg("trash")}</button>` : ""}<button class="x" id="stX" ${mine ? `style="margin-left:0"` : ""}>✕</button></div>
    <div class="pic"><img src="${p.img}" alt=""><div class="nav"><div id="stPrev"></div><div id="stNext"></div></div>${p.texto ? `<div class="cap"><span>${esc(p.texto)}</span></div>` : ""}</div>`;
  document.body.style.overflow = "hidden";
  const bar = el.querySelectorAll(".bars b")[i]; requestAnimationFrame(() => { bar.style.transition = "width 5s linear"; bar.style.width = "100%"; });
  stTimer = setTimeout(() => verHistorias(list, i + 1), 5000);
  $("#stX", el).onclick = cerrarHistorias;
  $("#stPrev", el).onclick = () => verHistorias(list, Math.max(0, i - 1));
  $("#stNext", el).onclick = () => verHistorias(list, i + 1);
  const d = $("#stDel", el); if (d) d.onclick = () => { clearTimeout(stTimer); cerrarHistorias(); confirmSheet("Borrar historia", "¿Quieres borrar esta historia?", "Borrar", () => borrarPost(p.id, "Historia borrada")); };
}
function cerrarHistorias() { clearTimeout(stTimer); const el = $("#stView"); if (el) el.remove(); document.body.style.overflow = ""; if (view === "comunidad" && !sheetOpen) render(); }

// Limpia mis historias caducadas (no se borran solas en la base de datos)
function limpiarHistorias() {
  if (!socialOn() || !social.me) return;
  social.feed.filter(p => p.uid === me.uid && p.tipo === "historia" && !esHistoriaViva(p))
    .forEach(p => FS().collection("posts").doc(p.id).delete().catch(() => {}));
}
