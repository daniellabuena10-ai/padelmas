// ===== Pádel+ · Zapatillas: catálogo, recomendador, mis zapatillas, opiniones y preguntas =====
// Datos orientativos (peso aprox. en talla 42-43 de hombre). Ritmo ideal en s/km [rápido, lento].
const SHOE_CATS = { diario: "Diario", maxcush: "Máxima amortiguación", tempo: "Tempo / series", carrera: "Competición (carbono)", estab: "Estabilidad", trail: "Trail" };
const SHOE_CAT_C = { diario: "#d4ff3a", maxcush: "#a78bfa", tempo: "#38bdf8", carrera: "#ff6a3d", estab: "#34d399", trail: "#facc15" };
// [id, marca, modelo, cat, peso, drop, placa, estab(0 neutra/1 estable/2 control), amort(1-5), precio(1-3), rMin, rMax, terreno, descripción]
const SHOES_RAW = [
  ["novablast6", "ASICS", "Novablast 6", "diario", 255, 8, "no", 0, 4, 2, 255, 405, "asfalto", "Ligera y con mucho rebote. Vale para casi todo: rodajes, tiradas y algún cambio de ritmo."],
  ["superblast3", "ASICS", "Superblast 3", "diario", 240, 8, "no", 0, 5, 3, 230, 390, "asfalto", "«Super trainer»: espuma de competición sin placa. Muy alta, muy ligera y muy rápida para entrenar."],
  ["nimbus28", "ASICS", "Gel-Nimbus 28", "maxcush", 290, 8, "no", 0, 5, 3, 300, 450, "asfalto", "Máxima comodidad y suavidad para rodajes tranquilos y tiradas largas."],
  ["kayano32", "ASICS", "Gel-Kayano 32", "estab", 300, 8, "no", 1, 5, 3, 300, 450, "asfalto", "La estabilidad de referencia: guía el pie si pronas, con mucha amortiguación."],
  ["metaspeedsky", "ASICS", "Metaspeed Sky Tokyo", "carrera", 170, 5, "carbono", 0, 4, 3, 170, 300, "asfalto", "Zapatilla de récord, muy ligera. Para competir de 10K a maratón a ritmos rápidos."],
  ["ghost17", "Brooks", "Ghost 17", "diario", 285, 12, "no", 0, 3, 2, 300, 450, "asfalto", "Fiable y cómoda, muy fácil de llevar. Ideal para empezar o sumar kilómetros tranquilos."],
  ["glycerin23", "Brooks", "Glycerin 23", "maxcush", 285, 10, "no", 0, 5, 3, 300, 450, "asfalto", "Pisada muy suave y protectora para mucho volumen."],
  ["ghostmax3", "Brooks", "Ghost Max 3", "maxcush", 290, 6, "no", 1, 5, 2, 330, 480, "asfalto", "Base ancha y estable con mucha espuma. Muy buena para corredores pesados y rodajes suaves."],
  ["adrenaline25", "Brooks", "Adrenaline GTS 25", "estab", 285, 10, "no", 1, 4, 2, 300, 450, "asfalto", "Estabilidad suave con guías laterales. Un clásico si pronas un poco."],
  ["hyperion5", "Brooks", "Hyperion Elite 5", "carrera", 220, 8, "carbono", 0, 4, 3, 190, 320, "asfalto", "Carbono cómodo y versátil para competir sin que castigue."],
  ["cascadia19", "Brooks", "Cascadia 19", "trail", 310, 6, "no", 1, 3, 2, 330, 540, "trail", "Todoterreno estable y duradera para montaña y ultras."],
  ["ride18", "Saucony", "Ride 18", "diario", 265, 8, "no", 0, 3, 2, 285, 420, "asfalto", "Equilibrada, transpirable y duradera. Gran relación calidad-precio."],
  ["triumph23", "Saucony", "Triumph 23", "maxcush", 280, 10, "no", 0, 5, 3, 300, 450, "asfalto", "Amortiguación premium con algo más de chispa que otras zapatillas blandas."],
  ["guide18", "Saucony", "Guide 18", "estab", 265, 6, "no", 1, 4, 2, 300, 440, "asfalto", "Estabilidad ligera y moderna para el día a día."],
  ["speed5", "Saucony", "Endorphin Speed 5", "tempo", 230, 8, "nylon", 0, 4, 3, 210, 330, "asfalto", "La reina de los entrenos rápidos: placa de nylon, muy versátil para series y tempo."],
  ["endopro4", "Saucony", "Endorphin Pro 4", "carrera", 210, 8, "carbono", 0, 4, 3, 180, 300, "asfalto", "Carbono rígido y estable para competir de 10K a maratón."],
  ["paramountmax", "Saucony", "Paramount Max", "maxcush", 290, 6, "no", 0, 5, 3, 330, 480, "asfalto", "Máxima amortiguación para recuperar y para tiradas muy largas."],
  ["endoedge", "Saucony", "Endorphin Edge", "trail", 240, 6, "carbono", 0, 4, 3, 240, 420, "trail", "Trail rápido con placa de carbono para competir por pistas y senderos corredores."],
  ["clifton10", "HOKA", "Clifton 10", "diario", 275, 8, "no", 0, 4, 2, 300, 450, "asfalto", "Blanda y ligera para su altura. Perfecta para rodajes de todos los días."],
  ["mach7", "HOKA", "Mach 7", "diario", 230, 5, "no", 0, 3, 2, 240, 375, "asfalto", "Ligera y reactiva: rodajes con alegría, tempo y hasta carreras."],
  ["bondi9", "HOKA", "Bondi 9", "maxcush", 300, 5, "no", 1, 5, 2, 330, 480, "asfalto", "Mucha protección y balanceo (rocker). Para recuperar y para corredores pesados."],
  ["arahi7", "HOKA", "Arahi 7", "estab", 265, 5, "no", 1, 4, 2, 300, 440, "asfalto", "Estabilidad sin sensación rígida, gracias a su marco J-Frame."],
  ["rocketx3", "HOKA", "Rocket X 3", "carrera", 227, 7, "carbono", 0, 4, 3, 180, 310, "asfalto", "Carbono versátil y estable, bueno para media y maratón."],
  ["speedgoat7", "HOKA", "Speedgoat 7", "trail", 285, 4, "no", 0, 5, 2, 300, 540, "trail", "La trail amortiguada más popular: agarre Vibram y comodidad para largas distancias."],
  ["vomero18", "Nike", "Vomero 18", "maxcush", 305, 10, "no", 0, 5, 2, 300, 450, "asfalto", "Mucha espuma a buen precio. Rodajes cómodos y tiradas largas."],
  ["pegplus", "Nike", "Pegasus Plus", "diario", 250, 10, "no", 0, 4, 3, 270, 390, "asfalto", "Pegasus con espuma ZoomX: más ligera y saltarina para el día a día."],
  ["zoomfly6", "Nike", "Zoom Fly 6", "tempo", 250, 8, "carbono", 0, 4, 3, 210, 330, "asfalto", "Carbono para entrenar: series, tempo y carreras si no quieres una supershoe."],
  ["vaporfly4", "Nike", "Vaporfly 4", "carrera", 190, 8, "carbono", 0, 4, 3, 170, 300, "asfalto", "La supershoe más popular. Ligerísima para 10K, media y maratón rápidos."],
  ["alphafly3", "Nike", "Alphafly 3", "carrera", 210, 8, "carbono", 0, 5, 3, 170, 300, "asfalto", "Máximo rebote para maratón. Brilla a ritmos muy rápidos."],
  ["evosl", "adidas", "Adizero EVO SL", "diario", 225, 6, "no", 0, 4, 2, 220, 360, "asfalto", "Espuma de competición sin placa a precio de entreno. Ligera y muy rápida."],
  ["adiospro4", "adidas", "Adizero Adios Pro 4", "carrera", 220, 6, "carbono", 0, 4, 3, 170, 300, "asfalto", "Varillas de carbono (EnergyRods) y espuma Lightstrike Pro. Referencia en maratón."],
  ["rider30", "Mizuno", "Wave Rider 30", "diario", 280, 8, "no", 0, 3, 2, 285, 420, "asfalto", "Pisada firme y estable dentro de lo neutro, muy duradera."],
  ["neovista2", "Mizuno", "Neo Vista 2", "maxcush", 280, 8, "no", 0, 5, 3, 270, 420, "asfalto", "Altísima y saltarina: protege las piernas en tiradas largas."],
  ["horizon9", "Mizuno", "Wave Horizon 9", "estab", 310, 8, "no", 2, 4, 3, 330, 480, "asfalto", "Estabilidad máxima con placa Wave completa. Para pronación marcada."],
  ["rebellionpro", "Mizuno", "Wave Rebellion Pro 3", "carrera", 200, 5, "carbono", 0, 4, 3, 180, 300, "asfalto", "Geometría agresiva para empujar hacia delante en competición."],
  ["nb1080v15", "New Balance", "1080 v15", "maxcush", 285, 6, "no", 0, 5, 3, 300, 450, "asfalto", "Muy blanda y cómoda: el gran rodador de New Balance."],
  ["nb860", "New Balance", "860", "estab", 280, 8, "no", 1, 4, 2, 300, 450, "asfalto", "Estabilidad cómoda y disponible en ancho extra."],
  ["scelite", "New Balance", "FuelCell SC Elite", "carrera", 215, 4, "carbono", 0, 5, 3, 170, 300, "asfalto", "Carbono con mucha espuma para maratón."],
  ["cloudmonster", "On", "Cloudmonster", "diario", 290, 6, "no", 0, 4, 3, 285, 420, "asfalto", "Mucho rebote y balanceo con el estilo de On."],
  ["velocitynitro", "Puma", "Velocity Nitro", "diario", 260, 10, "no", 0, 4, 1, 285, 420, "asfalto", "Versátil y económica, con espuma con nitrógeno y buen agarre."],
  ["deviatenitro", "Puma", "Deviate Nitro", "tempo", 255, 10, "carbono", 0, 4, 2, 215, 340, "asfalto", "Carbono para entrenar a precio contenido."],
  ["lonepeak9", "Altra", "Lone Peak 9", "trail", 300, 0, "no", 0, 3, 2, 330, 540, "trail", "Drop cero y puntera muy ancha. Muy natural en montaña."],
  ["norvanld4", "Arc'teryx", "Norvan LD 4", "trail", 290, 6, "no", 0, 4, 3, 300, 540, "trail", "Trail cómoda y precisa para largas distancias técnicas."],
  ["speedcross", "Salomon", "Speedcross", "trail", 320, 10, "no", 0, 3, 2, 330, 560, "trail", "Tacos enormes: imbatible en barro y terreno blando."],
  ["pegtrail", "Nike", "Pegasus Trail", "trail", 290, 10, "no", 0, 4, 2, 300, 480, "mixto", "De asfalto a pista sin cambiar de zapatilla."],
  ["venture10", "ASICS", "Gel-Venture 10", "trail", 300, 10, "no", 0, 2, 1, 330, 540, "mixto", "Trail barata para empezar a salir por caminos."],
  ["morphlite", "Merrell", "Morphlite", "trail", 260, 6, "no", 0, 3, 1, 330, 540, "trail", "Trail ligera y económica, buena relación calidad-precio."],
];
const SHOES = SHOES_RAW.map(r => ({ id: r[0], marca: r[1], modelo: r[2], cat: r[3], peso: r[4], drop: r[5], placa: r[6], estab: r[7], amort: r[8], precio: r[9], rMin: r[10], rMax: r[11], terreno: r[12], desc: r[13] }));
const shoeOf = id => SHOES.find(s => s.id === id);
const shoeName = s => s ? `${s.marca} ${s.modelo}` : "";
const PRECIO = ["", "€", "€€", "€€€"];

// ---------- Recomendador ----------
function recPace() { const r = actList().filter(a => a.deporte === "correr" && a.dist > 2000).slice(0, 10); if (!r.length) return 330; return Math.round(r.reduce((s, a) => s + a.dur / km(a.dist), 0) / r.length / 5) * 5; }
function recommend(q) {
  const p = q.ritmo, kg = weightKg();
  const out = SHOES.map(s => {
    let sc = 0; const why = [];
    const W = { diario: { diario: 1, maxcush: .75, estab: .7, tempo: .35, carrera: .05, trail: 0 }, tempo: { tempo: 1, carrera: .7, diario: .55, maxcush: .1, estab: .2, trail: 0 }, carrera: { carrera: 1, tempo: .75, diario: .45, maxcush: 0, estab: .1, trail: 0 }, larga: { maxcush: 1, diario: .85, estab: .7, tempo: .4, carrera: .3, trail: 0 }, trail: { trail: 1, diario: .1 } }[q.uso] || {};
    let w = W[s.cat] || 0;
    if (q.uso !== "trail" && s.terreno === "trail") w = 0;
    if (q.uso === "trail" && s.terreno === "mixto" && q.terreno === "mixto") w = 1.1;
    if (q.uso === "diario" || q.uso === "tempo") { if (s.id === "superblast3" || s.id === "evosl" || s.id === "mach7" || s.id === "novablast6") w += .15; }
    if (q.uso === "carrera" && p > 300 && s.cat === "carrera") w -= .25; // supershoes rinden menos a ritmos lentos
    sc += w * 3; if (w >= .9) why.push(`pensada para ${({ diario: "rodajes diarios", tempo: "series y ritmos vivos", carrera: "competir", larga: "tiradas largas", trail: "montaña" })[q.uso]}`);
    if (p >= s.rMin && p <= s.rMax) { sc += 1.2 + .3 * (1 - Math.abs(p - (s.rMin + s.rMax) / 2) / ((s.rMax - s.rMin) / 2)); why.push(`rinde bien a ${fmtPace(p)}/km`); } else sc -= Math.min(1.5, (p < s.rMin ? s.rMin - p : p - s.rMax) / 40);
    if (q.pisada === "prona") { if (s.estab >= 1) { sc += 1.3; why.push("te da estabilidad si pronas"); } else sc -= .6; }
    if (q.uso === "diario" || q.uso === "larga") sc += s.amort * .04;
    if (q.pisada === "neutra" && s.estab === 2) sc -= .6;
    if (kg >= 85) { if (s.amort >= 4 && s.peso >= 240) { sc += .4; why.push("amortiguación de sobra para tu peso"); } if (s.peso < 200) sc -= .5; }
    if (q.km >= 50 && q.uso === "diario" && s.amort >= 4) sc += .2;
    if (q.km < 20 && s.cat === "carrera") sc -= .3;
    if (q.precio && s.precio > q.precio) sc -= .8 * (s.precio - q.precio);
    if (q.precio === 1 && s.precio === 1) why.push("económica");
    if (s.peso <= 230 && q.uso !== "larga" && q.uso !== "trail") why.push(`ligera (~${s.peso} g)`);
    if (q.uso === "trail" && q.terreno === "barro" && s.id === "speedcross") { sc += 1; why.push("agarre brutal en barro"); }
    if (q.uso === "trail" && q.terreno === "tecnico" && (s.id === "speedgoat7" || s.id === "norvanld4" || s.id === "cascadia19")) { sc += .5; why.push("buena en terreno técnico"); }
    return { s, sc, why: [...new Set(why)].slice(0, 3) };
  }).filter(x => x.sc > 0).sort((a, b) => b.sc - a.sc);
  return out.slice(0, 6);
}
function openRecomendador() {
  const q = { ritmo: recPace(), uso: "diario", pisada: "nose", km: 30, precio: 0, terreno: "pista" };
  openSheet("¿Qué zapatilla me compro?", `
    <div class="field">¿Para qué la quieres?<div class="seg" id="qUso">${[["diario", "Rodajes diarios"], ["tempo", "Series / tempo"], ["carrera", "Competir"], ["larga", "Tiradas largas"], ["trail", "Montaña"]].map(([k, n]) => `<button data-v="${k}" class="${q.uso === k ? "on" : ""}">${n}</button>`).join("")}</div></div>
    <div class="field" id="qTerr" hidden>Terreno<div class="seg">${[["pista", "Pistas y caminos"], ["tecnico", "Técnico / rocas"], ["barro", "Barro"], ["mixto", "Asfalto + caminos"]].map(([k, n]) => `<button data-t="${k}" class="${q.terreno === k ? "on" : ""}">${n}</button>`).join("")}</div></div>
    <div class="field">Ritmo al que la vas a usar: <b id="qPv" class="num" style="font-size:22px;color:var(--volt)">${fmtPace(q.ritmo)}</b> /km<input type="range" id="qP" min="180" max="480" step="5" value="${q.ritmo}" style="width:100%;margin-top:8px;accent-color:#d4ff3a"><div class="row tiny mute" style="justify-content:space-between"><span>3:00 rápido</span><span>8:00 suave</span></div></div>
    <div class="field">Tu pisada<div class="seg" id="qPis">${[["neutra", "Neutra"], ["prona", "Prono (se me va hacia dentro)"], ["nose", "No lo sé"]].map(([k, n]) => `<button data-v="${k}" class="${q.pisada === k ? "on" : ""}">${n}</button>`).join("")}</div></div>
    <div class="field">Kilómetros a la semana<div class="seg" id="qKm">${[[10, "< 20"], [30, "20–50"], [60, "> 50"]].map(([k, n]) => `<button data-v="${k}" class="${q.km === k ? "on" : ""}">${n} km</button>`).join("")}</div></div>
    <div class="field">Presupuesto<div class="seg" id="qPr">${[[0, "Me da igual"], [1, "Económica"], [2, "Media"], [3, "Top"]].map(([k, n]) => `<button data-v="${k}" class="${q.precio === k ? "on" : ""}">${n}</button>`).join("")}</div></div>
    <button class="btn pri block" id="qGo">Ver mis zapatillas ideales</button>`, s => {
    const seg = (id, k, num) => $$(`#${id} [data-v]`, s).forEach(b => b.onclick = () => { q[k] = num ? +b.dataset.v : b.dataset.v; $$(`#${id} [data-v]`, s).forEach(x => x.classList.toggle("on", x === b)); if (id === "qUso") $("#qTerr", s).hidden = q.uso !== "trail"; });
    seg("qUso", "uso"); seg("qPis", "pisada"); seg("qKm", "km", 1); seg("qPr", "precio", 1);
    $$("#qTerr [data-t]", s).forEach(b => b.onclick = () => { q.terreno = b.dataset.t; $$("#qTerr [data-t]", s).forEach(x => x.classList.toggle("on", x === b)); });
    $("#qP", s).oninput = e => { q.ritmo = +e.target.value; $("#qPv", s).textContent = fmtPace(q.ritmo); };
    $("#qGo", s).onclick = () => showRecs(q);
  });
}
function showRecs(q) {
  const r = recommend(q);
  const fast = q.uso === "diario" || q.uso === "larga" ? recommend({ ...q, uso: "tempo" })[0] : null;
  openSheet("Tus zapatillas ideales", `<p class="small mute" style="margin:-6px 0 12px">Para ${({ diario: "rodajes diarios", tempo: "series y tempo", carrera: "competir", larga: "tiradas largas", trail: "montaña" })[q.uso]} a ${fmtPace(q.ritmo)}/km${q.pisada === "prona" ? ", pisada pronadora" : ""}.</p>
    ${r.map((x, i) => shoeRow(x.s, i === 0 ? "🥇 Mejor opción" : null, x.why)).join("")}
    ${fast && !r.slice(0, 3).some(x => x.s.id === fast.s.id) ? `<div class="hint">${svg("bolt")}<span><b style="color:var(--ink)">Consejo de rotación:</b> combínala con una más rápida para los días de series, como la <b style="color:var(--ink)">${shoeName(fast.s)}</b>. Alternar dos pares reparte el desgaste.</span></div>` : ""}
    <p class="tiny mute" style="text-align:center;margin-top:10px;line-height:1.5">Recomendación orientativa. Pruébatelas antes: lo más importante es que te sienten bien. Pádel+ no cobra de ninguna marca.</p>
    <button class="btn block" id="rAgain">${svg("refresh")}Cambiar respuestas</button>`, s => { wireShoeRows(s); $("#rAgain", s).onclick = openRecomendador; });
}
function shoeRow(sh, tag = null, why = null) {
  const st = shoeStats[sh.id];
  return `<button class="card shoe" data-shoe="${sh.id}" style="display:block;width:100%;text-align:left;padding:14px">
    ${tag ? `<div class="tiny" style="color:var(--volt);font-weight:700;margin-bottom:6px">${tag}</div>` : ""}
    <div style="display:flex;align-items:center;gap:12px"><div class="gart">${shoeArt(sh, 70)}</div>
      <div style="min-width:0;flex:1"><div class="small mute">${sh.marca}</div><div style="font-weight:700;font-size:16px">${sh.modelo}</div></div>
      <div style="text-align:right;flex:none"><div class="small" style="color:var(--volt)">${PRECIO[sh.precio]}</div><div class="tiny mute" style="white-space:nowrap">${["", "menos de 100 €", "100 – 160 €", "más de 160 €"][sh.precio]}</div>${st && st.n ? `<div class="tiny mute">★ ${nf(st.avg, 1)} (${st.n})</div>` : ""}</div></div>
    <div class="chips" style="margin-top:10px"><span class="chip" style="color:${SHOE_CAT_C[sh.cat]}">${SHOE_CATS[sh.cat]}</span><span class="chip">${sh.peso} g</span><span class="chip">drop ${sh.drop} mm</span>${sh.placa !== "no" ? `<span class="chip">placa ${sh.placa}</span>` : ""}</div>
    ${why && why.length ? `<p class="small" style="margin-top:10px;color:#cfd6de">✓ ${why.join(" · ")}</p>` : ""}</button>`;
}
function wireShoeRows(root) { $$("[data-shoe]", root).forEach(b => b.onclick = () => openShoe(b.dataset.shoe)); }

// ---------- Ficha de zapatilla con opiniones ----------
let shoeStats = {};
async function openShoe(id) {
  const sh = shoeOf(id); if (!sh) return; const mine = (state.perfil.zapas || []).some(z => z.modelo === id);
  const bars = [["Amortiguación", sh.amort / 5], ["Ligereza", Math.max(0, Math.min(1, (330 - sh.peso) / 160))], ["Estabilidad", [.35, .7, 1][sh.estab]], ["Precio", 1 - (sh.precio - 1) / 2.5]];
  openSheet(`${sh.marca} ${sh.modelo}`, `<div class="gartbig">${shoeArt(sh, 230)}<span class="tiny mute">Ilustración orientativa</span></div>
    <div class="chips" style="margin:-6px 0 12px"><span class="chip" style="color:${SHOE_CAT_C[sh.cat]}">${SHOE_CATS[sh.cat]}</span><span class="chip">${sh.terreno === "trail" ? "Montaña" : sh.terreno === "mixto" ? "Asfalto y caminos" : "Asfalto"}</span><span class="chip" style="color:var(--volt)">${PRECIO[sh.precio]}</span></div>
    <p style="line-height:1.5">${sh.desc}</p>
    <div class="grid3" style="margin:14px 0"><div class="stat"><div class="k">Peso aprox.</div><div class="v num" style="font-size:24px">${sh.peso}<small>g</small></div></div><div class="stat"><div class="k">Drop</div><div class="v num" style="font-size:24px">${sh.drop}<small>mm</small></div></div><div class="stat"><div class="k">Placa</div><div class="v num" style="font-size:20px">${sh.placa === "no" ? "No" : sh.placa[0].toUpperCase() + sh.placa.slice(1)}</div></div></div>
    <div class="card bars">${bars.map(([n, v]) => `<div class="b"><div><span>${n}</span></div><i><b style="width:${v * 100}%;background:${SHOE_CAT_C[sh.cat]}"></b></i></div>`).join("")}
      <p class="small mute" style="margin-top:12px">Ritmo ideal: <b style="color:var(--ink)">${fmtPace(sh.rMin)} – ${fmtPace(sh.rMax)} /km</b></p></div>
    ${priceBtns(sh)}
    <div class="row"><button class="btn ${mine ? "" : "pri"}" id="shHave">${mine ? "✓ La tengo" : `${svg("plus")}La tengo`}</button>${socialOn() ? `<button class="btn" id="shRev">${svg("edit")}Opinar</button>` : ""}</div>
    <div class="sec">Opiniones de la comunidad</div><div id="shRevs"><p class="small mute">${socialOn() ? "Cargando…" : "Únete a la comunidad para ver y dejar opiniones."}</p></div>`, s => {
    $("#shHave", s).onclick = () => { if (!mine) addZapa(id); else toast("Ya está en Mis zapatillas"); };
    const rv = $("#shRev", s); if (rv) rv.onclick = () => openReview(sh);
    if (socialOn()) loadReviews(id);
  });
}
async function loadReviews(id) {
  try {
    const q = await FS().collection("zapas").doc(id).collection("opiniones").orderBy("t", "desc").limit(50).get();
    const rs = q.docs.map(d => d.data()); const box = $("#shRevs"); if (!box) return;
    if (rs.length) shoeStats[id] = { n: rs.length, avg: rs.reduce((s, r) => s + r.nota, 0) / rs.length };
    box.innerHTML = rs.length ? `<div class="row" style="align-items:center;margin-bottom:8px"><span class="num" style="font-size:40px;flex:none">${nf(shoeStats[id].avg, 1)}</span><div><div style="color:#facc15">${"★".repeat(Math.round(shoeStats[id].avg))}${"☆".repeat(5 - Math.round(shoeStats[id].avg))}</div><div class="small mute">${rs.length} opinion${rs.length > 1 ? "es" : ""}</div></div></div>` +
      rs.map(r => `<div class="meal" style="align-items:flex-start"><button data-user="${r.uid}">${avatar(r, 34)}</button><div style="flex:1;min-width:0"><div class="small"><b>${esc(r.autor)}</b> <span style="color:#facc15">${"★".repeat(r.nota)}</span></div><div class="tiny mute">${r.km ? `${nf(r.km)} km con ellas · ` : ""}${r.ritmo ? `ritmo ${fmtPace(r.ritmo)}/km · ` : ""}${ago(r.t)}</div>${r.texto ? `<div style="margin-top:4px;line-height:1.45">${esc(r.texto)}</div>` : ""}</div></div>`).join("")
      : `<p class="small mute">Nadie ha opinado todavía. ¡Sé el primero!</p>`;
    $$("[data-user]", box).forEach(b => b.onclick = () => openUser(b.dataset.user));
  } catch (e) { console.warn(e); const box = $("#shRevs"); if (box) box.innerHTML = `<p class="small mute">No se pudieron cargar las opiniones.</p>`; }
}
function openReview(sh) {
  const z = (state.perfil.zapas || []).find(x => x.modelo === sh.id); let nota = 0;
  openSheet(`Opinar: ${sh.modelo}`, `<div class="field">Tu nota<div class="seg" id="rvN">${[1, 2, 3, 4, 5].map(n => `<button data-n="${n}" style="font-size:20px">★</button>`).join("")}</div></div>
    <div class="row"><label class="field">Km con ellas<input id="rvK" type="number" inputmode="numeric" value="${z ? Math.round(zapaKm(z)) : ""}"></label><label class="field">Ritmo habitual (/km)<input id="rvP" placeholder="5:30" value="${fmtPace(recPace())}"></label></div>
    <label class="field">Tu opinión<textarea id="rvT" rows="3" maxlength="600" placeholder="Qué tal la amortiguación, la talla, la durabilidad…"></textarea></label>
    <button class="btn pri block" id="rvOk">Publicar opinión</button>`, s => {
    $$("#rvN button", s).forEach(b => b.onclick = () => { nota = +b.dataset.n; $$("#rvN button", s).forEach(x => { x.classList.toggle("on", +x.dataset.n <= nota); x.style.color = +x.dataset.n <= nota ? "#facc15" : ""; }); });
    $("#rvOk", s).onclick = async () => {
      if (!nota) { toast("Pon una nota"); return; }
      const pm = String($("#rvP", s).value).match(/^(\d{1,2}):(\d{2})$/);
      try { await FS().collection("zapas").doc(sh.id).collection("opiniones").doc(me.uid).set({ uid: me.uid, autor: social.me.nombre, color: social.me.color, nota, km: +$("#rvK", s).value || 0, ritmo: pm ? +pm[1] * 60 + +pm[2] : null, texto: $("#rvT", s).value.trim().slice(0, 600), t: Date.now() });
        toast("¡Gracias por tu opinión!"); openShoe(sh.id); } catch (e) { console.warn(e); toast("No se pudo publicar"); }
    };
  });
}

// ---------- Mis zapatillas (kilómetros) ----------
const ZAPA_VIDA = 700;
function zapaKm(z) { return (z.km0 || 0) + actList().filter(a => a.zapa === z.id).reduce((s, a) => s + km(a.dist), 0); }
function addZapa(modelo = "") {
  openSheet("Añadir zapatillas", `<label class="field">Modelo<select id="zM"><option value="">Elige…</option>${[...new Set(SHOES.map(s => s.marca))].map(m => `<optgroup label="${m}">${SHOES.filter(s => s.marca === m).map(s => `<option value="${s.id}" ${s.id === modelo ? "selected" : ""}>${s.modelo}</option>`).join("")}</optgroup>`).join("")}<option value="__otra">Otra…</option></select></label>
    <label class="field" id="zOw" hidden>Nombre<input id="zO" maxlength="40" placeholder="Marca y modelo"></label>
    <div class="row"><label class="field">Apodo (opcional)<input id="zA" maxlength="24" placeholder="Las de series"></label><label class="field">Km que ya llevan<input id="zK" type="number" inputmode="numeric" value="0"></label></div>
    <label class="check"><input type="checkbox" id="zD" ${(state.perfil.zapas || []).length ? "" : "checked"}> <span>Usarlas por defecto en mis carreras</span></label>
    <button class="btn pri block" id="zOk">Guardar</button>`, s => {
    $("#zM", s).onchange = e => $("#zOw", s).hidden = e.target.value !== "__otra";
    $("#zOk", s).onclick = () => {
      const m = $("#zM", s).value; if (!m) { toast("Elige el modelo"); return; } const otra = m === "__otra" ? $("#zO", s).value.trim() : null; if (m === "__otra" && !otra) return;
      const z = { id: uid("z"), modelo: m === "__otra" ? null : m, nombre: otra || shoeName(shoeOf(m)), apodo: $("#zA", s).value.trim(), km0: +$("#zK", s).value || 0, desde: todayStr(), activa: true };
      const upd = { zapas: [...(state.perfil.zapas || []), z] }; if ($("#zD", s).checked) upd.zapaDef = z.id; savePerfil(upd); closeSheet(); toast("Zapatillas añadidas 👟");
    };
  });
}
function zapasHTML() {
  const zs = (state.perfil.zapas || []).filter(z => z.activa !== false);
  if (!zs.length) return `<p class="small mute">Añade tus zapatillas y te contamos los kilómetros que llevan. Te avisamos cuando toque cambiarlas (~${ZAPA_VIDA} km).</p><button class="btn sm" id="zAdd" style="margin-top:10px">${svg("plus")}Añadir mis zapatillas</button>`;
  return zs.map(z => { const k = zapaKm(z), pct = k / ZAPA_VIDA; return `<div class="item" style="display:block"><div style="display:flex;justify-content:space-between;align-items:center"><div><b>${esc(z.apodo || z.nombre)}</b>${z.apodo ? `<div class="tiny mute">${esc(z.nombre)}</div>` : ""}${state.perfil.zapaDef === z.id ? `<span class="badge" style="margin-left:6px">por defecto</span>` : ""}</div><span class="num" style="font-size:22px">${nf(k)}<small class="mute" style="font-size:13px"> km</small></span></div>
    <div style="height:7px;border-radius:9px;background:rgba(255,255,255,.07);margin-top:8px"><div style="height:100%;width:${Math.min(100, pct * 100)}%;border-radius:9px;background:${pct > .9 ? "var(--neg)" : pct > .7 ? "var(--hot)" : "var(--volt)"}"></div></div>
    ${pct > .9 ? `<p class="tiny" style="color:var(--neg);margin-top:6px">Ya llevan muchos kilómetros: es buen momento para cambiarlas.</p>` : ""}
    <div class="row" style="margin-top:8px"><button class="btn sm" data-zdef="${z.id}">Por defecto</button><button class="btn sm" data-zret="${z.id}">Retirar</button></div></div>`; }).join("") + `<button class="btn sm" id="zAdd" style="margin-top:10px">${svg("plus")}Añadir otras</button>`;
}
function wireZapas(root) {
  const a = $("#zAdd", root); if (a) a.onclick = () => addZapa();
  $$("[data-zdef]", root).forEach(b => b.onclick = () => { savePerfil({ zapaDef: b.dataset.zdef }); toast("Zapatillas por defecto"); render(); });
  $$("[data-zret]", root).forEach(b => b.onclick = () => confirmSheet("¿Retirar zapatillas?", "Dejarán de salir para nuevos entrenos. Sus kilómetros se guardan.", "Retirar", () => { savePerfil({ zapas: state.perfil.zapas.map(z => z.id === b.dataset.zret ? { ...z, activa: false } : z), zapaDef: state.perfil.zapaDef === b.dataset.zret ? null : state.perfil.zapaDef }); closeSheet(); }));
}
function zapaSelect(a) {
  if (!["correr", "caminar", "senderismo"].includes(a.deporte)) return "";
  const zs = (state.perfil.zapas || []).filter(z => z.activa !== false); if (!zs.length) return "";
  const cur = a.zapa !== undefined ? a.zapa : state.perfil.zapaDef || "";
  return `<label class="field">Zapatillas<select id="fZ"><option value="">Ninguna</option>${zs.map(z => `<option value="${z.id}" ${z.id === cur ? "selected" : ""}>${esc(z.apodo || z.nombre)}</option>`).join("")}</select></label>`;
}

// ---------- Vista Zapatillas (dentro de Comunidad) ----------
let shoeFilter = "todas", shoeBrand = "todas";
function zapasView() {
  const list = SHOES.filter(s => (shoeFilter === "todas" || s.cat === shoeFilter) && (shoeBrand === "todas" || s.marca === shoeBrand));
  return `<div class="hero" style="background:radial-gradient(420px 220px at 100% 0%,rgba(212,255,58,.22),transparent 70%),linear-gradient(160deg,#141a10,#0b0e0a 60%)">
      <div class="lbl">Recomendador</div><h2 style="font-size:24px;letter-spacing:-.5px;margin:6px 0 8px">¿Qué zapatilla me va?</h2>
      <p class="small" style="color:#d5dcc6;line-height:1.5">Dime para qué, a qué ritmo y tu pisada, y te digo las que mejor te van de ${SHOES.length} modelos de ${new Set(SHOES.map(s => s.marca)).size} marcas.</p>
      <button class="btn pri block" id="zRec" style="margin-top:14px">${svg("target")}Encontrar mis zapatillas</button></div>
    <div class="card"><h3>${svg("run")}Mis zapatillas</h3>${zapasHTML()}</div>
    ${socialOn() ? `<div class="sec">Preguntas de la comunidad <button id="qAsk">Preguntar</button></div><div id="qList"><p class="small mute" style="margin:0 4px">Cargando…</p></div>` : ""}
    <div class="sec">Catálogo</div>
    <div class="seg">${[["todas", "Todas"], ...Object.entries(SHOE_CATS)].map(([k, n]) => `<button data-sf="${k}" class="${shoeFilter === k ? "on" : ""}">${n}</button>`).join("")}</div>
    <div class="seg">${["todas", ...new Set(SHOES.map(s => s.marca))].map(m => `<button data-sb="${m}" class="${shoeBrand === m ? "on" : ""}" style="padding:7px 10px;font-size:13px">${m === "todas" ? "Todas las marcas" : m}</button>`).join("")}</div>
    ${list.map(s => shoeRow(s)).join("") || `<p class="small mute">No hay modelos con ese filtro.</p>`}
    <p class="tiny mute" style="text-align:center;line-height:1.5">Datos aproximados y orientativos. Las marcas renuevan modelos cada año.</p>`;
}
function wireZapasView(root) {
  $("#zRec", root).onclick = openRecomendador; wireZapas(root); wireShoeRows(root);
  $$("[data-sf]", root).forEach(b => b.onclick = () => { shoeFilter = b.dataset.sf; render(); });
  $$("[data-sb]", root).forEach(b => b.onclick = () => { shoeBrand = b.dataset.sb; render(); });
  const qa = $("#qAsk", root); if (qa) { qa.onclick = () => openAsk("running"); loadQuestions("running"); }
}

// ---------- Preguntas y respuestas ----------
const QCAT = { running: "zapatillas de running", palas: "palas", zpadel: "zapatillas de pádel", acces: "ropa y accesorios", juego: "técnica y táctica" };
async function loadQuestions(cat = "palas") {
  try { const q = await FS().collection("preguntas").orderBy("t", "desc").limit(60).get(); const qs = q.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => (x.cat || "running") === cat).slice(0, 20); const box = $("#qList"); if (!box) return;
    box.innerHTML = qs.length ? `<div class="card" style="padding:4px 14px">${qs.map(x => `<button class="item" data-q="${x.id}">${avatar(x, 34)}<div style="min-width:0;flex:1"><div style="font-weight:600;line-height:1.35">${esc(x.texto)}</div><div class="tiny mute" style="margin-top:3px">${esc(x.autor)} · ${ago(x.t)} · ${x.nResp || 0} respuesta${x.nResp === 1 ? "" : "s"}</div></div>${svg("chev", "chev")}</button>`).join("")}</div>`
      : `<div class="card"><p class="small mute">¿Dudas con ${cat === "palas" ? "una pala" : cat === "zpadel" ? "unas zapatillas de pádel" : cat === "acces" ? "ropa o accesorios" : cat === "juego" ? "un golpe o la táctica" : "unas zapatillas, un plan o una carrera"}? Pregunta y te responde la comunidad.</p></div>`;
    $$("[data-q]", box).forEach(b => b.onclick = () => openQuestion(qs.find(x => x.id === b.dataset.q)));
  } catch (e) { console.warn(e); const box = $("#qList"); if (box) box.innerHTML = ""; }
}
function openAsk(cat = "palas") {
  const ph = { running: "¿Qué zapatillas me recomendáis para rodar a 5:30 en llano?", palas: "Juego de revés y me molesta el codo, ¿qué pala me recomendáis?", zpadel: "¿Qué zapatillas para pista de arena si tengo el pie ancho?", acces: "¿Qué pelotas duran más vivas?", juego: "¿Cómo hago para que la bandeja no se me quede corta?" }[cat];
  openSheet(`Preguntar sobre ${QCAT[cat]}`, `<label class="field">Tu pregunta<textarea id="aqT" rows="3" maxlength="300" placeholder="${ph}"></textarea></label><button class="btn pri block" id="aqOk">Publicar</button>`, s => {
    $("#aqOk", s).onclick = async () => { const t = $("#aqT", s).value.trim(); if (t.length < 8) { toast("Escribe un poco más"); return; }
      try { await FS().collection("preguntas").add({ uid: me.uid, autor: social.me.nombre, color: social.me.color, texto: t.slice(0, 300), cat, t: Date.now(), nResp: 0 }); closeSheet(); toast("Pregunta publicada"); } catch { toast("No se pudo publicar"); } };
  });
}
let ansUnsub = null;
function openQuestion(qd) {
  openSheet("Pregunta", `<div style="display:flex;gap:10px;align-items:flex-start">${avatar(qd, 38)}<div><div style="font-weight:700;font-size:17px;line-height:1.35">${esc(qd.texto)}</div><div class="tiny mute" style="margin-top:4px">${esc(qd.autor)} · ${ago(qd.t)}</div></div></div>
    ${qd.uid === me.uid ? `<button class="tiny mute" id="qDel" style="margin-top:8px">Borrar pregunta</button>` : ""}
    <div class="sec">Respuestas</div><div id="ans"><p class="small mute">Cargando…</p></div>
    <div class="cbar"><input id="aIn" placeholder="Tu respuesta…" maxlength="600"><button class="btn pri sm" id="aSend">${svg("send")}</button></div>`, s => {
    ansUnsub && ansUnsub(); ansUnsub = FS().collection("preguntas").doc(qd.id).collection("respuestas").orderBy("t").onSnapshot(q => {
      const box = $("#ans"); if (!box) { ansUnsub(); ansUnsub = null; return; } const rs = q.docs.map(d => ({ id: d.id, ...d.data() }));
      box.innerHTML = rs.length ? rs.map(r => `<div class="meal" style="align-items:flex-start"><button data-user="${r.uid}">${avatar(r, 32)}</button><div style="flex:1;min-width:0"><div class="small"><b>${esc(r.autor)}</b> <span class="mute">${ago(r.t)}</span></div><div style="margin-top:2px;line-height:1.45">${linkShoes(esc(r.texto))}</div></div>${r.uid === me.uid ? `<button class="tiny mute" data-adel="${r.id}">borrar</button>` : ""}</div>`).join("") : `<p class="small mute">Aún sin respuestas. ¡Ayuda tú!</p>`;
      $$("[data-user]", box).forEach(b => b.onclick = () => openUser(b.dataset.user)); wireGearRows(box);
      $$("[data-adel]", box).forEach(b => b.onclick = async () => { await FS().collection("preguntas").doc(qd.id).collection("respuestas").doc(b.dataset.adel).delete().catch(() => {}); FS().collection("preguntas").doc(qd.id).update({ nResp: FV().increment(-1) }).catch(() => {}); });
    }, () => {});
    const send = async () => { const inp = $("#aIn", s); const t = inp.value.trim(); if (!t) return; inp.value = "";
      try { await FS().collection("preguntas").doc(qd.id).collection("respuestas").add({ uid: me.uid, autor: social.me.nombre, color: social.me.color, texto: t.slice(0, 600), t: Date.now() }); FS().collection("preguntas").doc(qd.id).update({ nResp: FV().increment(1) }).catch(() => {});
        if (qd.uid !== me.uid) aviso(qd.uid, { tipo: "comentario", texto: `ha respondido a tu pregunta: «${t.slice(0, 60)}»` }); } catch { toast("No se pudo enviar"); } };
    $("#aSend", s).onclick = send; $("#aIn", s).onkeydown = e => { if (e.key === "Enter") send(); };
    const qd2 = $("#qDel", s); if (qd2) qd2.onclick = () => confirmSheet("¿Borrar pregunta?", "Se borrará con sus respuestas.", "Borrar", async () => { await FS().collection("preguntas").doc(qd.id).delete().catch(() => {}); closeSheet(); toast("Pregunta borrada"); });
  });
}
function linkShoes(txt) { // convierte menciones de modelos en enlaces a su ficha
  let out = txt; for (const s of [...SHOES, ...(typeof PALAS !== "undefined" ? PALAS : []), ...(typeof ZPADEL !== "undefined" ? ZPADEL : [])]) { const re = new RegExp(`\\b(${s.modelo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`, "i"); if (re.test(out)) { out = out.replace(re, `<a data-gear="${s.id}" style="color:var(--volt);font-weight:600">$1</a>`); } } return out;
}
