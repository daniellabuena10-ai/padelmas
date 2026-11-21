// ===== Pádel+ · Opiniones de material en la comunidad =====
const OP_CRIT = {
  pala: [["potencia", "Potencia"], ["control", "Control"], ["comodidad", "Comodidad (brazo)"]],
  zapa: [["agarre", "Agarre"], ["comodidad", "Comodidad"], ["durabilidad", "Duración"]],
  otro: [["calidad", "Calidad"], ["comodidad", "Comodidad"], ["precio", "Calidad/precio"]] };
const opTipo = g => !g ? "otro" : g.id && g.id.startsWith("pala_") ? "pala" : g.id && g.id.startsWith("zp_") ? "zapa" : "otro";
const stars = (n, c = "#facc15") => `<span style="color:${c};letter-spacing:1px">${"★".repeat(n)}<span style="opacity:.25">${"★".repeat(5 - n)}</span></span>`;

// Paso 1: elegir el producto
function openOpinar(pre = null) {
  if (!socialOn() || !social.me) { toast("Crea tu perfil en Comunidad para opinar"); return; }
  if (pre) return openOpinarForm(pre);
  const all = [...PALAS, ...ZPADEL];
  const list = q => { q = q.trim().toLowerCase(); return (q ? all.filter(g => `${g.marca} ${g.modelo}`.toLowerCase().includes(q)) : all.slice(0, 0)).slice(0, 20); };
  openSheet("Opinar sobre material", `<p class="small mute" style="margin:-6px 0 12px">Tu opinión ayuda a otros jugadores a acertar. Busca la pala o la zapatilla:</p>
    <label class="field"><input id="opQ" placeholder="Ej. Nox AT10, Bullpadel Vertex…" autocomplete="off" enterkeyhint="search"></label>
    <div id="opL"></div>
    <button class="item" id="opOtro" style="margin-top:6px"><span style="font-size:22px;width:28px;text-align:center">➕</span><div style="flex:1"><div style="font-weight:700">No está en la lista</div><div class="tiny mute">Otra pala, zapatilla, ropa o accesorio</div></div>${svg("chev", "chev")}</button>`, s => {
    const q = $("#opQ", s), L = $("#opL", s);
    const draw = () => { const r = list(q.value); L.innerHTML = r.length ? `<div class="card" style="padding:4px 12px">${r.map(g => `<button class="item" data-g="${g.id}"><span style="width:34px;display:grid;place-items:center">${gearArt(g, 30)}</span><div style="flex:1;min-width:0"><div style="font-weight:700">${esc(g.marca)} ${esc(g.modelo)}</div><div class="tiny mute">${g.id.startsWith("pala_") ? "Pala" : "Zapatilla de pádel"}</div></div>${svg("chev", "chev")}</button>`).join("")}</div>` : q.value.trim() ? `<p class="small mute" style="margin:6px 2px">No lo encuentro. Usa «No está en la lista».</p>` : "";
      $$("[data-g]", L).forEach(b => b.onclick = () => openOpinarForm(gearOf(b.dataset.g))); };
    q.oninput = draw; setTimeout(() => q.focus(), 250);
    $("#opOtro", s).onclick = () => openOpinarForm(null);
  });
}

// Paso 2: la opinión
function openOpinarForm(g) {
  const tipo = opTipo(g); let nota = 0; const crit = {}; let cat = "pala";
  const critHTML = t => OP_CRIT[t].map(([k, n]) => `<div class="field" style="margin-bottom:8px"><div class="small" style="margin-bottom:4px">${n}</div><div class="seg" data-crit="${k}">${[1, 2, 3, 4, 5].map(v => `<button data-v="${v}" class="${crit[k] === v ? "on" : ""}">${v}</button>`).join("")}</div></div>`).join("");
  openSheet(g ? `Opinar: ${esc(g.modelo)}` : "Opinar sobre material", `
    ${g ? `<div class="item" style="cursor:default;margin-top:-6px"><span style="width:44px;display:grid;place-items:center">${gearArt(g, 40)}</span><div><div style="font-weight:800">${esc(g.marca)} ${esc(g.modelo)}</div><div class="tiny mute">${tipo === "pala" ? "Pala" : "Zapatilla de pádel"}</div></div></div>`
      : `<div class="field">¿Qué es?<div class="seg" id="opCat">${[["pala", "Pala"], ["zapa", "Zapatillas"], ["ropa", "Ropa"], ["acces", "Accesorio"]].map(([k, n]) => `<button data-v="${k}" class="${cat === k ? "on" : ""}">${n}</button>`).join("")}</div></div>
      <div class="row"><label class="field">Marca<input id="opM" maxlength="30" placeholder="Nox"></label><label class="field">Modelo<input id="opMo" maxlength="50" placeholder="AT10 Genius"></label></div>`}
    <div class="field">Tu nota<div class="seg" id="opN">${[1, 2, 3, 4, 5].map(n => `<button data-n="${n}" style="font-size:22px">★</button>`).join("")}</div></div>
    <div id="opCr">${critHTML(tipo === "otro" ? "pala" : tipo)}</div>
    <label class="field">Tu opinión<textarea id="opT" rows="4" maxlength="600" placeholder="${tipo === "zapa" ? "Agarre en tu pista, talla, comodidad, cuánto te han durado…" : "Potencia, control, tacto, punto dulce, ¿te ha dado molestias en el codo?…"}"></textarea></label>
    <label class="field">Tiempo usándola<select id="opU"><option value="">Elige…</option><option>Menos de 1 mes</option><option>1–6 meses</option><option>6–12 meses</option><option>Más de 1 año</option></select></label>
    <label class="check"><input type="checkbox" id="opRec" checked> <span>La recomendaría</span></label>
    <div class="err" id="opE"></div>
    <button class="btn block" id="opOk" style="background:var(--volt);color:#0b0f02;border:0">Publicar en la comunidad</button>
    <p class="tiny mute" style="text-align:center;margin-top:8px">Se publica con tu nombre y tu nivel. También aparece en la ficha del producto.</p>`, s => {
    const wireCrit = () => $$("[data-crit]", s).forEach(sg => $$("button", sg).forEach(b => b.onclick = () => { crit[sg.dataset.crit] = +b.dataset.v; $$("button", sg).forEach(x => x.classList.toggle("on", x === b)); }));
    wireCrit();
    $$("#opN button", s).forEach(b => b.onclick = () => { nota = +b.dataset.n; $$("#opN button", s).forEach(x => x.style.color = +x.dataset.n <= nota ? "#facc15" : ""); });
    $$("#opCat [data-v]", s).forEach(b => b.onclick = () => { cat = b.dataset.v; $$("#opCat [data-v]", s).forEach(x => x.classList.toggle("on", x === b)); for (const k in crit) delete crit[k]; $("#opCr", s).innerHTML = critHTML(cat === "pala" ? "pala" : cat === "zapa" ? "zapa" : "otro"); wireCrit(); });
    $("#opOk", s).onclick = async () => {
      const E = $("#opE", s); const texto = $("#opT", s).value.trim().slice(0, 600);
      const marca = g ? g.marca : ($("#opM", s).value.trim()), modelo = g ? g.modelo : ($("#opMo", s).value.trim());
      if (!g && (!marca || !modelo)) { E.textContent = "Pon la marca y el modelo."; return; }
      if (!nota) { E.textContent = "Pon una nota de 1 a 5 estrellas."; return; }
      if (texto.length < 10) { E.textContent = "Cuéntanos un poco más (mínimo 10 letras)."; return; }
      const b = $("#opOk", s); b.disabled = true;
      const now = new Date().toISOString(), lv = computeNivel ? computeNivel() : null;
      const gid = g ? g.id : null, gtipo = g ? tipo : cat;
      const id = "p" + Math.max(0, 1e13 - Date.parse(now)).toString(36).padStart(9, "0") + "_op" + me.uid.slice(0, 6);
      const p = { id, uid: me.uid, autor: social.me.nombre, usuario: social.me.usuario, color: social.me.color, foto: social.me.foto || null, tipo: "opinion", deporte: "padel",
        fecha: now, t: Date.now(), gear: { id: gid, marca, modelo, tipo: gtipo }, nota, crit, texto, uso: $("#opU", s).value || "", recomienda: $("#opRec", s).checked,
        nivel: lv ? +lv.nivel.toFixed(2) : (social.me.nivelPadel || null), kudos: [], nCom: 0, titulo: `${marca} ${modelo}`, dur: 0, dist: 0 };
      try {
        await FS().collection("posts").doc(id).set(p);
        if (gid) await FS().collection("zapas").doc(gid).collection("opiniones").doc(me.uid).set({ uid: me.uid, autor: social.me.nombre, color: social.me.color, nota, meses: 0, texto, t: Date.now(), nivel: p.nivel, crit }).catch(() => {});
        social.feed.unshift(p); social.disc.unshift(p); closeSheet(); toast("¡Opinión publicada! Gracias 🙌");
        if (view === "comunidad") render();
      } catch (e) { console.warn(e); E.textContent = "No se pudo publicar. Revisa tu conexión."; b.disabled = false; }
    };
  });
}

// Tarjeta de opinión en el muro
function opinionCard(p) {
  const mine = p.uid === me.uid, k = (p.kudos || []).includes(me.uid), g = p.gear && p.gear.id ? gearOf(p.gear.id) : null;
  const tipoN = { pala: "Pala", zapa: "Zapatillas", ropa: "Ropa", acces: "Accesorio" }[p.gear && p.gear.tipo] || "Material";
  const cr = OP_CRIT[p.gear && (p.gear.tipo === "pala" || p.gear.tipo === "zapa") ? p.gear.tipo : "otro"];
  return `<div class="act post" data-post="${p.id}">
    <div class="hd"><button data-user="${p.uid}" style="display:flex;align-items:center;gap:10px;text-align:left;min-width:0">${avatar(p, 40)}<div style="min-width:0"><div class="t" style="font-size:14.5px">${esc(p.autor)}${mine ? ` <span class="tiny mute">(tú)</span>` : ""}</div><div class="tiny mute">${relDate(p.fecha)}${p.nivel ? ` · nivel ${nf(p.nivel, 1)}` : ""}</div></div></button>
      <span class="chip" style="margin-left:auto;color:var(--vt)">✍️ Opinión</span></div>
    <button ${g ? `data-gear="${g.id}"` : ""} style="display:flex;gap:12px;align-items:center;width:100%;text-align:left;margin-top:12px;padding:10px;border-radius:14px;background:var(--card2)">
      <span style="width:46px;display:grid;place-items:center">${g ? gearArt(g, 42) : `<span style="font-size:30px">${{ pala: "🎾", zapa: "👟", ropa: "👕", acces: "🎒" }[p.gear && p.gear.tipo] || "🏷️"}</span>`}</span>
      <div style="flex:1;min-width:0"><div class="tiny mute">${tipoN}</div><div style="font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.gear ? p.gear.marca + " " + p.gear.modelo : p.titulo)}</div><div style="font-size:18px">${stars(p.nota || 0)}</div></div>${g ? svg("chev", "chev") : ""}</button>
    ${cr && p.crit && Object.keys(p.crit).length ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px">${cr.filter(([k2]) => p.crit[k2]).map(([k2, n]) => `<div class="tiny mute">${n}<div style="height:6px;border-radius:3px;background:var(--line2);margin-top:4px;overflow:hidden"><div style="height:100%;width:${p.crit[k2] * 20}%;background:var(--volt)"></div></div></div>`).join("")}</div>` : ""}
    <p style="margin-top:10px;line-height:1.5">${esc(p.texto || "")}</p>
    <div class="tiny mute" style="margin-top:6px">${[p.uso ? "Uso: " + esc(p.uso) : null, p.recomienda ? "👍 La recomienda" : "👎 No la recomienda"].filter(Boolean).join(" · ")}</div>
    <div class="pact"><button data-kudo="${p.id}" class="${k ? "on" : ""}">${svg("heart")}<span>${(p.kudos || []).length || ""}</span>${k ? "" : " Útil"}</button><button data-com="${p.id}">${svg("mail")}<span>${p.nCom || ""}</span> Comentar</button>${mine ? `<button data-delop="${p.id}" style="margin-left:auto" class="mute">${svg("trash")}</button>` : ""}</div></div>`;
}
