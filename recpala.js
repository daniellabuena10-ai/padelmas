// ===== Pádel+ · Recomendador de palas (asistente paso a paso, visual, con texto libre) =====
// Sustituye a openRecPala() de gear.js. Guarda las respuestas para que Inicio recomiende lo mismo.

const RP_KEY = "pm-recpala";
function rpSaved() { try { return JSON.parse(localStorage.getItem(RP_KEY) || "null"); } catch { return null; } }
function rpSave(q) {
  const o = { nivel: q.nivel, estilo: q.estilo, lado: q.lado, extras: [...q.extras], precio: q.precio, texto: q.texto || "", t: Date.now() };
  try { localStorage.setItem(RP_KEY, JSON.stringify(o)); } catch {}
  try { if (typeof me !== "undefined" && me && me.uid && typeof savePerfil === "function") savePerfil({ recPala: o }); } catch {}
}
// Lo que se usa en Inicio ("Elegido para ti")
function rpInicioQ() {
  const s = rpSaved();
  if (s) return { ...s, extras: new Set(s.extras || []) };
  const P = (state.perfil && state.perfil.padel) || {};
  return { nivel: myPadelBand(), estilo: 2, lado: P.lado || "", extras: new Set(), precio: 0, texto: "" };
}

// ---------- Texto libre: entendemos lo que cuenta el jugador ----------
const RP_MARCAS = ["nox", "bullpadel", "adidas", "head", "babolat", "siux", "starvie", "star vie", "wilson", "black crown", "kombat", "kuikma", "drop shot", "vibor-a", "vibora", "royal padel", "dunlop", "varlion"];
function rpLeeTexto(txt) {
  const t = norm2(txt || ""); const a = { notas: [] };
  if (!t.trim()) return a;
  const has = re => re.test(t);
  if (has(/codo|epicondil|hombro|munec|tendin|lesion|dolor|molest/)) { a.brazo = true; a.notas.push("cuidar el brazo"); }
  if (has(/potencia|remat|pegar|pego fuerte|atac|smash|por tres|por 3|x3|x4|vibora|salida de bola|me falta pegada/)) { a.estilo = .6; a.notas.push("más potencia"); }
  if (has(/control|coloc|defien|defens|precis|se me escapan|se me van|me paso|globo|bajada de pared/)) { a.estilo = (a.estilo || 0) - .6; a.notas.push("más control"); }
  if (has(/ligera|pesa mucho|pesada|cansa el brazo|manejable|rapida de manos|red\b|volea/)) { a.ligera = true; a.notas.push("pala ligera y manejable"); }
  if (has(/tenis|tenista|frontenis|squash/)) { a.tenis = true; a.notas.push("vienes de otro deporte de raqueta"); }
  if (has(/empiezo|empezando|principiante|novato|nuevo en el padel|primera pala|poco tiempo/)) { a.nivel = 1; a.notas.push("estás empezando"); }
  if (has(/compito|torneo|federad|nivel alto|avanzado/)) { a.nivel = 3; a.notas.push("juegas a buen nivel"); }
  if (has(/barat|economic|poco dinero|no quiero gastar|presupuesto bajo|menos de 100|100 ?(euros|€)/)) { a.precio = 1; a.notas.push("buen precio"); }
  else if (has(/menos de 200|200 ?(euros|€)|precio medio/)) { a.precio = 2; a.notas.push("presupuesto medio"); }
  if (has(/blanda|blando|suave|comoda|confort/)) { a.dureza = -1; a.notas.push("tacto blando"); }
  if (has(/\bdura\b|\bduro\b|rigida|tacto seco/)) { a.dureza = 1; a.notas.push("tacto duro"); }
  if (has(/muchas horas|todos los dias|juego mucho|4 veces|5 veces|a diario/)) { a.horas = true; a.notas.push("juegas mucho"); }
  if (has(/mujer|chica|mi novia|mi mujer|mi hija/)) { a.ligera = true; if (!a.notas.includes("pala ligera y manejable")) a.notas.push("pala ligera y manejable"); }
  const m = RP_MARCAS.filter(x => t.includes(x));
  if (m.length) { a.marcas = m; a.notas.push("marca: " + m.map(x => x.replace(/\b\w/g, c => c.toUpperCase())).join(", ")); }
  if (has(/redonda/)) { a.forma = "redonda"; a.notas.push("forma redonda"); }
  else if (has(/lagrima/)) { a.forma = "lágrima"; a.notas.push("forma de lágrima"); }
  else if (has(/diamante/)) { a.forma = "diamante"; a.notas.push("forma de diamante"); }
  a.notas = [...new Set(a.notas)];
  return a;
}

// ---------- Puntuación ----------
function rpScore(q) {
  const tx = rpLeeTexto(q.texto);
  const nivel = tx.nivel || q.nivel;
  const estilo = Math.max(1, Math.min(3, (q.estilo || 2) + (tx.estilo || 0)));
  const ex = q.extras || new Set();
  const brazo = ex.has("codo") || ex.has("hombro") || tx.brazo;
  const ligera = ex.has("ligera") || tx.ligera;
  const fuerte = ex.has("fuerte");
  const horas = ex.has("horas") || tx.horas;
  const precio = tx.precio || q.precio;
  const L = PALAS.map(p => {
    let sc = 0; const why = [];
    const dn = Math.abs(p.nivel - nivel); sc += 2.4 - dn * 2.1; if (dn < .6) why.push(`Hecha para nivel ${NIVL[nivel].toLowerCase()}`);
    const dp = Math.abs(p.perfil - estilo); sc += 2.2 - dp * 1.5;
    if (dp < .5) why.push(p.perfil < 1.7 ? "Pala de control: coloca la bola donde quieres" : p.perfil < 2.4 ? "Polivalente: defiende y ataca bien" : "Pala de ataque: más pegada en el remate");
    if (q.lado === "reves" && p.perfil >= 2.3) { sc += .35; why.push("Ideal para rematar desde el revés"); }
    if (q.lado === "drive" && p.perfil <= 2.2) { sc += .35; why.push("Precisa para construir desde el drive"); }
    if (brazo) { sc += (3 - p.dureza) * .6 + (3 - p.balance) * .5 - (p.peso > 365 ? .6 : 0) - (p.forma === "diamante" ? .5 : 0); if (p.dureza < 1.7) why.push("Tacto blando que cuida el codo y el hombro"); else if (p.dureza < 2.2) why.push("Tacto cómodo, sin castigar el brazo"); if (p.dureza > 2.6) sc -= 1.1; }
    if (ligera) { if (p.peso <= 355) { sc += .7; why.push(`Ligera (~${p.peso} g), muy manejable`); } if (p.peso >= 370) sc -= .7; }
    if (fuerte && !brazo) { sc += (p.dureza - 2) * .4 + (p.balance - 2) * .3; if (p.dureza >= 2.5) why.push("Tacto duro para quien pega fuerte"); }
    if (horas) { sc += (2.6 - p.dureza) * .25 + (p.peso <= 360 ? .2 : 0); }
    if (tx.dureza) { sc += (p.dureza - 2) * .6 * tx.dureza; }
    if (tx.tenis) { if (p.forma === "lágrima") { sc += .4; why.push("Lágrima: el tacto más parecido a una raqueta de tenis"); } if (p.balance <= 2.2) sc += .15; }
    if (tx.forma && p.forma === tx.forma) { sc += .8; why.push(`Forma ${p.forma}, como buscabas`); }
    if (tx.marcas && tx.marcas.some(m => norm2(p.marca).replace(/\s/g, "").startsWith(m.replace(/\s|-/g, "")))) { sc += .9; why.push(`De ${p.marca}, la marca que te gusta`); }
    if (nivel === 1 && p.forma === "redonda") { sc += .5; why.push("Redonda: punto dulce grande que perdona fallos"); }
    if (nivel === 1 && p.forma === "diamante") sc -= .9;
    if (precio && p.precio > precio) sc -= 1 * (p.precio - precio);
    if (precio === 1 && p.precio === 1) why.push("Muy buena relación calidad-precio");
    const r = typeof realOf === "function" && realOf(p);
    if (r) { sc += .5; const d = dto(r); if (d >= 15) { sc += Math.min(.4, d / 100); why.push(`Ahora con un ${d}% de descuento`); } }
    return { s: p, r, sc, why: [...new Set(why)] };
  }).sort((a, b) => b.sc - a.sc);
  const top = L[0] ? L[0].sc : 1, low = L[Math.min(L.length - 1, 14)] ? L[Math.min(L.length - 1, 14)].sc : 0;
  L.forEach((x, i) => { x.pct = Math.max(55, Math.min(98, Math.round(98 - (top - x.sc) / Math.max(.5, top - low) * 40))); if (i === 0) x.pct = Math.max(x.pct, 94); });
  return { list: L.slice(0, 8), tx, nivel, brazo, ligera };
}

// ---------- Dibujos ----------
const RP_FORMA = {
  1: `<path d="M22 3a19 19 0 1 1 0 38a19 19 0 1 1 0-38z" fill="none" stroke="currentColor" stroke-width="3"/>`,
  2: `<path d="M22 3c11 0 19 8 19 19 0 9-7 15-13 19h-12C10 37 3 31 3 22 3 11 11 3 22 3z" fill="none" stroke="currentColor" stroke-width="3"/>`,
  3: `<path d="M22 3l17 14-6 24H11L5 17z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>`
};
const rpPala = k => `<svg width="40" height="52" viewBox="0 0 44 56" style="color:var(--ink)">${RP_FORMA[k]}<rect x="19" y="40" width="6" height="15" rx="3" fill="currentColor"/></svg>`;
const rpPista = lado => `<svg width="64" height="44" viewBox="0 0 64 44"><rect x="2" y="2" width="60" height="40" rx="5" fill="#e8f5d0" stroke="#0f172a" stroke-width="2"/><line x1="32" y1="2" x2="32" y2="42" stroke="#0f172a" stroke-width="2" stroke-dasharray="3 3"/><line x1="2" y1="22" x2="32" y2="22" stroke="#0f172a" stroke-width="1.5"/>
  ${lado === "drive" || lado === "" ? `<circle cx="17" cy="32" r="6" fill="#0f172a"/>` : ""}${lado === "reves" || lado === "" ? `<circle cx="17" cy="12" r="6" fill="${lado === "" ? "#0f172a" : "#0f172a"}"/>` : ""}</svg>`;

// ---------- Asistente ----------
const RP_STEPS = [
  { k: "nivel", t: "¿Cuál es tu nivel?", s: "Sé sincero: así acertamos más.", opts: [
    [1, "🌱", "Estoy empezando", "Llevo menos de un año o juego de vez en cuando."],
    [2, "🎯", "Intermedio", "Juego con regularidad, hago bandejas y puntos largos."],
    [3, "🔥", "Avanzado", "Compito o juego a buen nivel: remates, víboras, x3."]] },
  { k: "estilo", t: "¿Cómo te gusta jugar?", s: "Piensa en cómo ganas los puntos.", opts: [
    [1, rpPala(1), "Control y colocación", "Me gusta construir el punto y no fallar."],
    [2, rpPala(2), "Un poco de todo", "Defiendo bien y ataco cuando puedo."],
    [3, rpPala(3), "Atacar y rematar", "Busco la red y acabar el punto arriba."]] },
  { k: "lado", t: "¿En qué lado juegas?", s: "Mirando a la red.", opts: [
    ["drive", rpPista("drive"), "Drive", "Juego a la derecha."],
    ["reves", rpPista("reves"), "Revés", "Juego a la izquierda."],
    ["", rpPista(""), "Los dos", "Depende del día o de la pareja."]] },
  { k: "extras", multi: true, t: "¿Algo que debamos saber?", s: "Marca todas las que quieras. Si no, sigue.", opts: [
    ["codo", "💪", "Molestias de codo", ""], ["hombro", "🩹", "Molestias de hombro", ""],
    ["ligera", "🪶", "Prefiero una pala ligera", ""], ["fuerte", "⚡", "Pego muy fuerte", ""],
    ["horas", "⏱️", "Juego muchas horas", ""]] },
  { k: "precio", t: "¿Cuánto quieres gastar?", s: "Te enseñamos el precio de hoy, con descuentos.", opts: [
    [1, "💶", "Hasta 100 €", "Buena pala sin gastar mucho."],
    [2, "💳", "Hasta 200 €", "El punto ideal calidad-precio."],
    [3, "💎", "Lo mejor", "Gama alta, la que usan los pros."],
    [0, "🤷", "Me da igual", "Enséñame la mejor para mí."]] },
  { k: "texto", t: "Cuéntanos tu juego", s: "Opcional, pero ayuda mucho. Escribe como hablas: lo que te pasa en pista, lo que buscas o lo que no te gusta de tu pala.", free: true }
];
const RP_SUG = ["Se me escapan las bolas por el fondo", "Me falta potencia en el remate", "Vengo del tenis", "Mi pala actual me pesa", "Me duele el codo al jugar", "Busco algo barato para empezar", "Me gusta Bullpadel", "Juego casi todos los días"];

let rpQ = null;
function openRecPala(stepIx) {
  if (typeof stepIx !== "number") stepIx = undefined;
  if (!rpQ || stepIx === undefined) {
    const s = rpSaved(); const P = (state.perfil && state.perfil.padel) || {};
    rpQ = s ? { ...s, extras: new Set(s.extras || []) } : { nivel: myPadelBand(), estilo: 2, lado: P.lado || "", extras: new Set(), precio: 0, texto: "" };
    stepIx = 0;
  }
  const st = RP_STEPS[stepIx], n = RP_STEPS.length;
  const prog = `<div class="rwprog">${RP_STEPS.map((_, i) => `<i class="${i <= stepIx ? "on" : ""}"></i>`).join("")}</div>`;
  let body;
  if (st.free) {
    body = `<label class="field" style="margin:4px 0 8px"><textarea id="rpT" rows="4" maxlength="500" placeholder="Ej.: juego de revés, me cuesta definir por arriba y mi pala me cansa el brazo al final del partido…" style="min-height:110px;line-height:1.45">${esc(rpQ.texto || "")}</textarea></label>
      <div class="tiny mute" style="margin:0 2px 8px">Ideas para empezar (toca para añadir):</div>
      <div class="chips" id="rpSug">${RP_SUG.map(x => `<button class="chip" data-s="${esc(x)}">+ ${esc(x)}</button>`).join("")}</div>
      <div id="rpTx" style="margin-top:10px"></div>`;
  } else {
    const cur = rpQ[st.k];
    body = `<div class="rwopts${st.multi ? " multi" : ""}">${st.opts.map(([v, ic, t, d]) => { const on = st.multi ? cur.has(v) : cur === v; return `<button class="rwopt${on ? " on" : ""}" data-v="${esc(String(v))}"><span class="rwic">${ic}</span><span class="rwtx"><b>${t}</b>${d ? `<small>${d}</small>` : ""}</span>${st.multi ? `<span class="rwck">${on ? "✓" : ""}</span>` : ""}</button>`; }).join("")}</div>`;
    if (st.k === "nivel" && state.perfil && state.perfil.padel && state.perfil.padel.nivel0 && typeof computeNivel === "function") body = `<div class="hint" style="margin-bottom:10px">${svg("info")}<span>Según tus partidos en Pádel+ tu nivel es <b style="color:var(--ink)">${fmtNivel(computeNivel().nivel)}</b>.</span></div>` + body;
  }
  const foot = `<div class="rwfoot">${stepIx > 0 ? `<button class="btn" id="rpBack">← Atrás</button>` : `<span></span>`}${st.multi || st.free ? `<button class="btn" id="rpNext" style="background:var(--ink);color:#fff;border:0">${stepIx === n - 1 ? "Ver mis palas" : "Siguiente →"}</button>` : ""}</div>`;
  openSheet(stepIx === 0 ? "Tu pala ideal" : `Paso ${stepIx + 1} de ${n}`, `${prog}<h3 class="rwq">${st.t}</h3><p class="small mute" style="margin:2px 0 14px;line-height:1.45">${st.s}</p>${body}${foot}`, s => {
    const go = i => i >= n ? rpResultados() : openRecPala(i);
    if (st.free) {
      const ta = $("#rpT", s), out = $("#rpTx", s);
      const upd = () => { rpQ.texto = ta.value; const a = rpLeeTexto(ta.value); out.innerHTML = a.notas.length ? `<div class="tiny" style="font-weight:700;color:var(--vt);margin-bottom:6px">✓ Lo tendremos en cuenta:</div><div class="chips">${a.notas.map(x => `<span class="chip l">${esc(x)}</span>`).join("")}</div>` : ""; };
      ta.oninput = upd; upd();
      $$("#rpSug [data-s]", s).forEach(b => b.onclick = () => { const v = b.dataset.s; ta.value = (ta.value.trim() ? ta.value.trim().replace(/[.,]?$/, ". ") : "") + v + "."; upd(); b.remove(); });
    } else {
      $$(".rwopt", s).forEach(b => b.onclick = () => {
        let v = b.dataset.v; if (st.k === "nivel" || st.k === "estilo" || st.k === "precio") v = +v;
        if (st.multi) { rpQ.extras.has(v) ? rpQ.extras.delete(v) : rpQ.extras.add(v); b.classList.toggle("on"); $(".rwck", b).textContent = rpQ.extras.has(v) ? "✓" : ""; return; }
        rpQ[st.k] = v; $$(".rwopt", s).forEach(x => x.classList.toggle("on", x === b)); setTimeout(() => go(stepIx + 1), 180);
      });
    }
    const bk = $("#rpBack", s); if (bk) bk.onclick = () => { if (st.free) rpQ.texto = $("#rpT", s).value; go(stepIx - 1); };
    const nx = $("#rpNext", s); if (nx) nx.onclick = () => { if (st.free) rpQ.texto = $("#rpT", s).value; go(stepIx + 1); };
  });
}

function rpResultados() {
  rpSave(rpQ);
  const R = rpScore(rpQ); const [h, ...rest] = R.list; if (!h) return;
  const resumen = [NIVL[R.nivel], ["", "Control", "Polivalente", "Ataque"][rpQ.estilo], rpQ.lado === "drive" ? "Drive" : rpQ.lado === "reves" ? "Revés" : null,
    R.brazo ? "Cuidando el brazo" : null, R.ligera ? "Ligera" : null, ["", "Hasta 100 €", "Hasta 200 €", "Gama alta", ""][rpQ.precio] || null].filter(Boolean);
  const foto = (x, sz) => x.r ? fotoReal(x.r, sz) : palaArt(x.s, sz * .85);
  const precio = x => x.r ? `<span style="white-space:nowrap"><span class="num" style="font-size:22px;color:var(--ink)">${eur(x.r.p)}</span>${x.r.o && x.r.o > x.r.p ? ` <s class="tiny mute">${eur(x.r.o)}</s>` : ""}</span>` : `<span class="small mute">${priceTxt(x.s)}</span>`;
  const comprar = (x, big) => `<a class="btn buy${big ? " block" : ""}" href="${esc(buyUrl(x.s))}" target="_blank" rel="noopener sponsored" style="${big ? "" : "padding:10px 12px;font-size:14px"}">${svg("cart")}Comprar</a>`;
  const hero = `<div class="rwhero">
      <div class="rwbadge">🥇 Tu pala ideal</div>
      <div class="rwimg">${foto(h, 190)}${h.r && dto(h.r) >= 5 ? `<span class="dtob" style="position:absolute;top:10px;right:10px">-${dto(h.r)}%</span>` : ""}</div>
      <div class="tiny mute" style="text-transform:uppercase;letter-spacing:.4px;font-weight:700">${esc(h.s.marca)}</div>
      <div style="font-size:21px;font-weight:900;letter-spacing:-.4px;line-height:1.15">${esc(h.s.modelo)}</div>
      <div class="rwmatch"><div><i style="width:${h.pct}%"></i></div><b>${h.pct}% para ti</b></div>
      <ul class="rwwhy">${h.why.slice(0, 4).map(w => `<li>${esc(w)}</li>`).join("")}</ul>
      <div class="chips" style="margin:10px 0 12px">${[h.s.forma, `balance ${blTxt(h.s.balance).toLowerCase()}`, `tacto ${durTxt(h.s.dureza).toLowerCase()}`, `~${h.s.peso} g`].map(c => `<span class="chip">${c}</span>`).join("")}</div>
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px">${precio(h)}</div>
      ${comprar(h, true)}<button class="btn block" data-gear="${h.s.id}" style="margin-top:8px">Ver ficha y opiniones</button></div>`;
  const alt = rest.slice(0, 5).map(x => `<div class="rwalt">
      <button class="rwaltimg" data-gear="${x.s.id}">${foto(x, 86)}</button>
      <div style="flex:1;min-width:0"><div class="tiny mute">${esc(x.s.marca)} · <b style="color:var(--vt)">${x.pct}%</b></div><div style="font-weight:800;line-height:1.2">${esc(x.s.modelo)}</div>
      <div class="tiny mute" style="margin:3px 0 6px">${esc(x.why.find(w => !/^Hecha para nivel/.test(w)) || x.why[0] || perfilTxt(x.s.perfil))}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span>${precio(x).replace('font-size:22px', 'font-size:17px')}</span>${comprar(x)}</div></div></div>`).join("");
  const txN = R.tx.notas || [];
  openSheet("Tus palas ideales", `
    <div class="chips" style="margin:-4px 0 6px">${resumen.map(c => `<span class="chip">${esc(c)}</span>`).join("")}</div>
    ${txN.length ? `<div class="hint" style="margin:8px 0 12px">${svg("info")}<span>Por lo que nos has contado, hemos tenido en cuenta: <b style="color:var(--ink)">${txN.map(esc).join(", ")}</b>.</span></div>` : ""}
    ${hero}
    <div class="sec">Otras buenas opciones</div>${alt}
    ${R.brazo ? `<div class="hint">${svg("info")}<span>Con molestias de codo u hombro: tacto blando, balance bajo o medio y no más de ~365 g. Si duele, consulta con un fisio.</span></div>` : ""}
    <div class="row" style="gap:8px;margin-top:12px"><button class="btn" id="rAgain" style="flex:1">${svg("refresh")}Cambiar respuestas</button><button class="btn" id="rShare" style="flex:1">Compartir</button></div>
    <p class="tiny mute" style="text-align:center;margin-top:10px">Orientativo: si puedes, pruébala antes. 🤝 Enlaces de afiliado: si compras, Pádel+ recibe una comisión sin coste para ti.</p>
    ${window.guest && !(me && me.uid) ? `<div class="card" style="margin-top:12px"><h3>Guarda tu pala y tu nivel</h3><p class="small mute" style="margin:6px 0 12px">Crea tu cuenta: apunta partidos, sube en el ranking y la recomendación se ajusta a cómo juegas de verdad.</p><button class="btn pri block" id="rUp">Crear cuenta</button></div>` : ""}`, s => {
    wireGearRows(s);
    $("#rAgain", s).onclick = () => openRecPala(0);
    const sh = $("#rShare", s); if (sh) sh.onclick = async () => { const txt = `Mi pala ideal según Pádel+: ${h.s.marca} ${h.s.modelo} (${h.pct}% para mí). ¿Cuál es la tuya? 👉 https://padelmas.club`; try { if (navigator.share) await navigator.share({ text: txt }); else { await navigator.clipboard.writeText(txt); toast("Copiado"); } } catch {} };
    const u = $("#rUp", s); if (u) u.onclick = () => { closeSheet(); $("#goUp").click(); };
  });
}

// Enlace directo al recomendador (p. ej. desde la guía): padelmas.club/?pala=1
(function () {
  let want = false; try { want = /[?&#]pala=1/.test(location.search + location.hash); if (want) history.replaceState(null, "", location.pathname); } catch {}
  if (!want) return;
  let n = 0; const iv = setInterval(() => {
    if (++n > 40) return clearInterval(iv);
    if (typeof sheetOpen !== "undefined" && sheetOpen) return;
    if (typeof me !== "undefined" && me && me.uid && window.__shown) { clearInterval(iv); openRecPala(); return; }
    const a = document.getElementById("auth"), g = document.getElementById("goPala");
    if (a && !a.hidden && g) { clearInterval(iv); g.click(); }
  }, 300);
})();
