// ===== Pádel+ · Zapatillas: tipos de suela visuales + test "¿Qué zapatilla necesitas?" (productos reales) =====
const ZS_SVG = {
  e: `<svg viewBox="0 0 46 46" width="40" height="40"><rect width="46" height="46" rx="12" fill="#fff"/><g stroke="#0f172a" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M10 12l6 5 6-5 6 5 6-5"/><path d="M10 21l6 5 6-5 6 5 6-5"/><path d="M10 30l6 5 6-5 6 5 6-5"/></g></svg>`,
  o: `<svg viewBox="0 0 46 46" width="40" height="40"><rect width="46" height="46" rx="12" fill="#fff"/><g fill="#0f172a"><circle cx="13" cy="13" r="2.8"/><circle cx="23" cy="13" r="2.8"/><circle cx="33" cy="13" r="2.8"/><circle cx="13" cy="23" r="2.8"/><circle cx="23" cy="23" r="2.8"/><circle cx="33" cy="23" r="2.8"/><circle cx="13" cy="33" r="2.8"/><circle cx="23" cy="33" r="2.8"/><circle cx="33" cy="33" r="2.8"/></g></svg>`,
  h: `<svg viewBox="0 0 46 46" width="40" height="40"><rect width="46" height="46" rx="12" fill="#fff"/><g stroke="#0f172a" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M10 12l6 5 6-5 6 5 6-5"/></g><g fill="#0f172a"><circle cx="13" cy="27" r="2.8"/><circle cx="23" cy="27" r="2.8"/><circle cx="33" cy="27" r="2.8"/><circle cx="18" cy="35" r="2.8"/><circle cx="28" cy="35" r="2.8"/></g></svg>`,
  a: `<svg viewBox="0 0 46 46" width="40" height="40"><rect width="46" height="46" rx="12" fill="#fff"/><path d="M9 30c4-9 9-12 16-12 6 0 10 3 12 7v5H9z" fill="none" stroke="#0f172a" stroke-width="2.6" stroke-linejoin="round"/><path d="M9 34h28" stroke="#84cc16" stroke-width="4" stroke-linecap="round"/></svg>`
};
const ZS_TIPOS = [["e", "Espiga", "Agarre + deslizamiento", "La más usada. Pistas de césped con arena."], ["o", "Omni", "Máximo agarre", "Pistas con mucha arena o que resbalan."], ["h", "Híbrida", "Vale para todo", "Si juegas en clubes distintos."], ["a", "Amortiguadas", "Más comodidad", "Cuidan rodillas y tobillos."]];

// Bloque visual para la tienda (sustituye a los botones de texto)
function zsTiposHTML(sel) {
  return `<button class="zsquiz" id="zsQuiz"><span class="zqi">👟</span><span style="flex:1;min-width:0"><b>¿Qué zapatilla necesitas?</b><small>5 preguntas: tu pista, tu pie y cómo juegas</small></span><span class="ar">→</span></button>
    <div class="sec" style="margin:6px 2px 8px">O elige por tipo de suela</div>
    <div class="zsgrid">${ZS_TIPOS.map(([k, n, s, d]) => `<button data-s="${k}" class="${sel === k ? "on" : ""}">${ZS_SVG[k]}<b>${n}</b><small>${s}</small><span class="zsd">${d}</span></button>`).join("")}</div>
    ${sel ? `<button class="link tiny" data-s="" style="margin:0 2px 10px;font-size:13px">✕ Quitar filtro de suela</button>` : ""}`;
}

// ---------- Test ----------
const ZQ_KEY = "pm-reczapa";
let zQ = null;
const ZQ_STEPS = [
  { k: "pista", t: "¿Cómo es la pista donde más juegas?", s: "Mira el suelo: es lo que más importa en una zapatilla de pádel.", opts: [
    ["e", ZS_SVG.e, "Césped con arena normal", "La pista típica de club."], ["o", ZS_SVG.o, "Mucha arena o resbala", "Pistas exteriores, nuevas o muy cargadas de arena."],
    ["h", ZS_SVG.h, "Juego en pistas distintas", "Cambio de club o no lo sé."], ["i", "🏟️", "Indoor rápida", "Pistas cubiertas con poca arena."]] },
  { k: "pie", t: "¿Cómo es tu pie?", s: "Si las zapatillas te suelen apretar por los lados, tienes el pie ancho.", opts: [
    ["n", "🦶", "Normal", "Me valen casi todas."], ["a", "↔️", "Ancho", "Me aprietan a los lados."], ["e", "📏", "Estrecho", "Me bailan o tengo que apretar mucho."]] },
  { k: "prio", multi: true, t: "¿Qué te importa más?", s: "Marca lo que quieras. Si no, sigue.", opts: [
    ["a", "☁️", "Comodidad y amortiguación", "Juego muchas horas o me molestan rodillas."], ["l", "🪶", "Ligereza", "Quiero ir rápido a la bola."],
    ["t", "🧱", "Estabilidad y sujeción", "Tobillos seguros en los giros."], ["d", "🛡️", "Que duren", "Las gasto rápido por la suela."]] },
  { k: "gen", t: "¿Para quién son?", s: "Para enseñarte las tallas y modelos correctos.", opts: [["h", "👨", "Hombre", ""], ["m", "👩", "Mujer", ""]] },
  { k: "precio", t: "¿Cuánto quieres gastar?", s: "Con el precio de hoy y sus descuentos.", opts: [
    [80, "💶", "Hasta 80 €", "Buenas y sin gastar mucho."], [130, "💳", "Hasta 130 €", "El punto ideal calidad-precio."], [0, "💎", "Me da igual", "Enséñame las mejores para mí."]] }
];
function zqScore(q) {
  if (!CAT) return [];
  const TOP = ["bullpadel", "nox", "adidas", "head", "babolat", "asics", "joma", "wilson", "mizuno", "lotto", "drop shot", "siux", "kswiss", "k swiss", "lacoste"];
  const pista = q.pista === "i" ? "h" : q.pista;
  return CAT.p.filter(p => p.c === "zapa" && !p.x && p.f && (!q.gen || (p.g ? p.g === q.gen : !(q.gen === "h" ? /\b(w|women|woman|mujer)\b/ : /\b(m|men|man|hombre)\b/).test(norm2(p.n)))) && !/\bjr\b|junior|nino|nina|kids/.test(norm2(p.n))).map(p => {
    let sc = 0; const why = [];
    if (p.s === pista) { sc += 3; why.push(pista === "e" ? "Suela de espiga, ideal para tu pista" : pista === "o" ? "Suela omni: máximo agarre" : "Suela híbrida: vale para cualquier pista"); }
    else if (p.s === "h" && pista !== "h") { sc += 1.8; why.push("Suela híbrida, también sirve en tu pista"); }
    else if (p.s && p.s !== pista) sc -= 1.5;
    if (q.pie === "a") { if (p.h === "a") { sc += 2.5; why.push("Horma ancha: no te aprietan"); } else if (p.h === "e") sc -= 3; }
    if (q.pie === "e") { if (p.h === "e") { sc += 2.5; why.push("Horma estrecha: sujetan bien el pie"); } else if (p.h === "a") sc -= 3; }
    const pr = q.prio || new Set();
    if (pr.has("a") && p.a) { sc += 1.5; why.push("Muy buena amortiguación"); }
    if (pr.has("l") && (p.r || "").includes("l")) { sc += 2.2; why.push("Ligeras y rápidas"); }
    if (pr.has("t") && (p.r || "").includes("t")) { sc += 2.2; why.push("Estables en los giros"); }
    if (pr.has("d") && (p.r || "").includes("d")) { sc += 2.2; why.push("Suela muy resistente"); }
    if (q.precio && p.p > q.precio) sc -= 2 + (p.p - q.precio) / 40;
    if (TOP.some(m => norm2(p.m || p.n).startsWith(m))) sc += .6;
    const d = dto(p); if (d >= 10) { sc += Math.min(.8, d / 60); why.push(`Ahora con un ${d}% de descuento`); }
    return { p, sc, why: [...new Set(why)] };
  }).sort((a, b) => b.sc - a.sc).filter((x, i, L) => L.findIndex(y => norm2(limpiaNombre(y.p.n, y.p.m)).split(" ").slice(0, 3).join(" ") === norm2(limpiaNombre(x.p.n, x.p.m)).split(" ").slice(0, 3).join(" ")) === i).slice(0, 8)
    .map((x, i, L) => ({ ...x, pct: Math.max(60, Math.min(98, Math.round(98 - (L[0].sc - x.sc) * 6))) }));
}
function openRecZapa(ix) {
  if (typeof ix !== "number") { try { const s = JSON.parse(localStorage.getItem(ZQ_KEY) || "null"); zQ = s ? { ...s, prio: new Set(s.prio || []) } : null; } catch { zQ = null; }
    if (!zQ) zQ = { pista: "e", pie: "n", prio: new Set(), gen: (state.perfil && state.perfil.sexo === "m") ? "m" : "h", precio: 0 }; ix = 0; }
  const st = ZQ_STEPS[ix], n = ZQ_STEPS.length, cur = zQ[st.k];
  const body = `<div class="rwopts${st.multi ? " multi" : ""}">${st.opts.map(([v, ic, t, d]) => { const on = st.multi ? cur.has(v) : cur === v; return `<button class="rwopt${on ? " on" : ""}" data-v="${v}"><span class="rwic">${ic}</span><span class="rwtx"><b>${t}</b>${d ? `<small>${d}</small>` : ""}</span>${st.multi ? `<span class="rwck">${on ? "✓" : ""}</span>` : ""}</button>`; }).join("")}</div>`;
  openSheet(ix === 0 ? "Tus zapatillas ideales" : `Paso ${ix + 1} de ${n}`, `<div class="rwprog">${ZQ_STEPS.map((_, i) => `<i class="${i <= ix ? "on" : ""}"></i>`).join("")}</div><h3 class="rwq">${st.t}</h3><p class="small mute" style="margin:2px 0 14px;line-height:1.45">${st.s}</p>${body}
    <div class="rwfoot">${ix > 0 ? `<button class="btn" id="zqB">← Atrás</button>` : "<span></span>"}${st.multi ? `<button class="btn" id="zqN" style="background:var(--ink);color:#fff;border:0">Siguiente →</button>` : ""}</div>`, s => {
    const go = i => i >= n ? zqResultados() : openRecZapa(i);
    $$(".rwopt", s).forEach(b => b.onclick = () => {
      let v = b.dataset.v; if (st.k === "precio") v = +v;
      if (st.multi) { zQ.prio.has(v) ? zQ.prio.delete(v) : zQ.prio.add(v); b.classList.toggle("on"); $(".rwck", b).textContent = zQ.prio.has(v) ? "✓" : ""; return; }
      zQ[st.k] = v; $$(".rwopt", s).forEach(x => x.classList.toggle("on", x === b)); setTimeout(() => go(ix + 1), 180);
    });
    const bk = $("#zqB", s); if (bk) bk.onclick = () => go(ix - 1);
    const nx = $("#zqN", s); if (nx) nx.onclick = () => go(ix + 1);
  });
}
function zqResultados() {
  if (!CAT && typeof loadCatalogo === "function") { openSheet("Tus zapatillas ideales", `<p class="mute" style="text-align:center;margin:30px 0">Buscando tus zapatillas…</p>`); loadCatalogo().then(() => CAT && zqResultados()); return; }
  try { localStorage.setItem(ZQ_KEY, JSON.stringify({ ...zQ, prio: [...zQ.prio] })); } catch {}
  const R = zqScore(zQ); if (!R.length) { openSheet("Tus zapatillas ideales", `<p class="mute">Ahora mismo no hay zapatillas que encajen. Prueba a cambiar el presupuesto.</p><button class="btn block" id="zqA">Cambiar respuestas</button>`, s => { $("#zqA", s).onclick = () => openRecZapa(0); }); return; }
  const [h, ...rest] = R;
  const precio = x => `<span style="white-space:nowrap"><span class="num" style="font-size:22px;color:var(--ink)">${eur(x.p.p)}</span>${x.p.o && x.p.o > x.p.p ? ` <s class="tiny mute">${eur(x.p.o)}</s>` : ""}</span>`;
  const comprar = (x, big) => `<a class="btn buy${big ? " block" : ""}" href="${esc(x.p.u)}" target="_blank" rel="noopener sponsored" style="${big ? "" : "padding:10px 12px;font-size:14px"}">${svg("cart")}Comprar</a>`;
  const res = [["e", "Espiga"], ["o", "Omni"], ["h", "Híbrida"], ["i", "Indoor"]].find(x => x[0] === zQ.pista)[1];
  const chips = [res, zQ.pie === "a" ? "Pie ancho" : zQ.pie === "e" ? "Pie estrecho" : null, zQ.gen === "m" ? "Mujer" : "Hombre", zQ.precio ? `Hasta ${zQ.precio} €` : null].filter(Boolean);
  openSheet("Tus zapatillas ideales", `<div class="chips" style="margin:-4px 0 6px">${chips.map(c => `<span class="chip">${c}</span>`).join("")}</div>
    <div class="rwhero"><div class="rwbadge">🥇 Tus zapatillas ideales</div>
      <div class="rwimg">${fotoReal(h.p, 190)}${dto(h.p) >= 5 ? `<span class="dtob" style="position:absolute;top:10px;right:10px">-${dto(h.p)}%</span>` : ""}</div>
      <div class="tiny mute" style="text-transform:uppercase;letter-spacing:.4px;font-weight:700">${esc(h.p.m || "")}</div>
      <div style="font-size:21px;font-weight:900;letter-spacing:-.4px;line-height:1.15">${esc(limpiaNombre(h.p.n, h.p.m))}</div>
      <div class="rwmatch"><div><i style="width:${h.pct}%"></i></div><b>${h.pct}% para ti</b></div>
      <ul class="rwwhy">${(h.why.length ? h.why : ["Buena opción para tu juego"]).slice(0, 4).map(w => `<li>${esc(w)}</li>`).join("")}</ul>
      <div style="display:flex;align-items:baseline;gap:8px;margin:12px 0 10px">${precio(h)}</div>${comprar(h, true)}</div>
    <div class="sec">Otras buenas opciones</div>
    ${rest.slice(0, 5).map(x => `<div class="rwalt"><a class="rwaltimg" href="${esc(x.p.u)}" target="_blank" rel="noopener sponsored">${fotoReal(x.p, 86)}</a><div style="flex:1;min-width:0"><div class="tiny mute">${esc(x.p.m || "")} · <b style="color:var(--vt)">${x.pct}%</b></div><div style="font-weight:800;line-height:1.2">${esc(limpiaNombre(x.p.n, x.p.m))}</div><div class="tiny mute" style="margin:3px 0 6px">${esc(x.why[0] || "")}</div><div style="display:flex;align-items:center;justify-content:space-between;gap:8px">${precio(x).replace("font-size:22px", "font-size:17px")}${comprar(x)}</div></div></div>`).join("")}
    <button class="btn block" id="zqA" style="margin-top:12px">${svg("refresh")}Cambiar mis respuestas</button>
    <p class="tiny mute" style="text-align:center;margin-top:10px">Si dudas entre dos tallas, mira la guía de tallas de la tienda. 🤝 Enlaces de afiliado: si compras, Pádel+ recibe una comisión sin coste para ti.</p>`, s => { $("#zqA", s).onclick = () => openRecZapa(0); });
}
// El botón "Encontrar mis zapatillas" de Material usa el test nuevo
if (typeof openRecZP === "function") { openRecZP = openRecZapa; }
