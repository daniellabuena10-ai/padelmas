// ===== Pádel+ · Material de pádel: palas y zapatillas (recomendador, fichas, opiniones, preguntas) =====
// Datos orientativos de cada modelo; las marcas sacan versión nueva cada temporada.
// Palas: [id, marca, modelo, forma, balance(1 bajo-3 alto), dureza(1 blanda-3 dura), peso g, cara, nivel(1 inic-3 avanz), perfil(1 control-3 potencia), precio(1-3), descripción]
const PALAS_RAW = [
  ["at10luxury18k", "Nox", "AT10 Luxury Genius 18K Alum 2026", "lágrima", 2, 2.5, 365, "carbono 18K", 3, 2, 3, "La pala de Agustín Tapia: polivalente de verdad. Control desde el fondo y pegada suficiente en la red."],
  ["at10xtreme12k", "Nox", "AT10 Genius 12K Alum Xtreme 2026", "lágrima", 1.8, 2.3, 365, "carbono 12K", 3, 1.6, 3, "Versión más de control de la AT10: precisión para construir el punto."],
  ["ventus12k", "Nox", "EA10 Ventus Attack 12K Xtreme 2026", "diamante", 2.7, 2.7, 370, "carbono 12K", 3, 2.8, 3, "Pala de ataque con salida rápida para rematadores."],
  ["xhero", "Nox", "X-Hero Blue 2026", "redonda", 1.3, 1.5, 355, "fibra de vidrio", 1, 1.2, 1, "Redonda, blanda y con punto dulce grande: perdona los descentrados de los primeros meses."],
  ["equation", "Nox", "Equation Advanced", "lágrima", 2, 2, 360, "fibra / carbono", 2, 2, 1, "Pala de transición a buen precio para quien ya juega con regularidad."],
  ["metalbone26", "adidas", "Metalbone 2026", "diamante", 2.8, 2.7, 370, "carbono", 3, 3, 3, "Referencia en ataque: remate, víbora y salida de bola para jugadores de técnica sólida."],
  ["metalbonehrd", "adidas", "Metalbone HRD 2026", "diamante", 2.8, 3, 370, "carbono", 3, 3, 3, "La Metalbone más dura: máxima potencia, exige brazo y técnica."],
  ["metalbonectrl", "adidas", "Metalbone Ctrl 2026", "redonda", 1.6, 2.3, 365, "carbono alum", 3, 1.5, 3, "La versión de control de la familia Metalbone, en formato redondo."],
  ["crossitlight", "adidas", "Cross It Team Light 2026", "lágrima", 2, 1.8, 350, "fibra / carbono", 2, 2, 2, "Ligera y cómoda, pensada para manejabilidad. Muy buena para jugadoras y brazos sensibles."],
  ["techviper3", "Babolat", "Technical Viper 3.0 2026", "diamante", 2.8, 3, 370, "carbono 3K", 3, 3, 3, "La pala de Juan Lebrón: tacto firme y pegada para jugadores agresivos."],
  ["viper3", "Babolat", "Viper 3.0 2026", "lágrima", 2.4, 2.6, 365, "carbono 3K", 2.5, 2.6, 3, "Agresiva pero con algo más de control que la Technical."],
  ["techvertuo", "Babolat", "Technical Vertuo", "lágrima", 2, 2.2, 365, "carbono", 2.5, 2, 2, "Polivalente y cómoda: juego completo para intermedios que quieren dar un salto."],
  ["aircrest", "Babolat", "Air Crest 2026", "redonda", 1.4, 1.5, 345, "vidrio / carbono", 1, 1.3, 1, "Muy ligera, ideal para empezar y para cuidar el brazo."],
  ["extremeteam", "Head", "Extreme Team 2026", "diamante", 2.4, 2, 360, "fibra / carbono", 2, 2.4, 2, "Diamante tolerante: control sorprendente para ser de ataque. Muy buena para intermedios."],
  ["coellopro", "Head", "Coello Pro 2026", "diamante", 2.6, 2.8, 370, "carbono", 3, 2.7, 3, "La pala de Arturo Coello: ataque y estabilidad para jugadores con buena técnica."],
  ["extremepro", "Head", "Extreme Pro", "diamante", 2.8, 2.6, 365, "carbono / vidrio", 3, 2.9, 3, "Diamante de balance alto con superficie rugosa para mucho efecto."],
  ["evospeed", "Head", "Evo Speed", "lágrima", 2, 1.5, 355, "fibra de vidrio", 1, 1.8, 1, "Polivalente, ligera y barata. Una gran primera pala."],
  ["vertex04comfort", "Bullpadel", "Vertex 04 Comfort", "diamante", 2.5, 1.8, 365, "carbono", 2.5, 2.7, 3, "Potencia con núcleo cómodo: ataque sin castigar tanto el brazo."],
  ["hack04comfort", "Bullpadel", "Hack 04 Comfort 2026", "diamante", 2.5, 2, 365, "carbono", 2.5, 2.6, 3, "Para intermedios que quieren añadir potencia sin perder tolerancia."],
  ["ioniccontrol", "Bullpadel", "Ionic Control 2026", "redonda", 1.5, 2.3, 365, "carbono", 2.5, 1.3, 2, "Respuesta controlada y precisión para jugadores de colocación."],
  ["k2power", "Bullpadel", "K2 Power", "diamante", 2.6, 1.8, 365, "fibra de vidrio", 2, 2.5, 1, "Puerta de entrada a la potencia a precio contenido."],
  ["fuji", "Kombat", "Fuji 2026", "lágrima", 2.2, 2.3, 365, "carbono", 2.5, 2.2, 2, "Equilibrada y competitiva, de las alternativas más interesantes a las grandes marcas."],
  ["hybridcoki", "Kuikma", "Hybrid Pro Coki Nieto", "lágrima", 1.9, 2.2, 365, "carbono", 2.5, 1.8, 2, "Para el jugador estratega que controla el ritmo del partido. Muy buena relación calidad-precio."],
  ["wallbreaker375", "Tecnifibre", "Wall Breaker 375", "lágrima", 2.2, 2.5, 375, "carbono", 2.5, 2.4, 2, "Pesada y estable (375 g): mucha inercia en el golpe."],
  ["vertex05", "Bullpadel", "Vertex 05 2026", "diamante", 2.8, 2.7, 370, "carbono 12K", 3, 2.9, 3, "La pala de Juan Tello: diamante con balance alto y superficie rugosa para rematar y dar efecto."],
  ["vertex05hybrid", "Bullpadel", "Vertex 05 Hybrid 2026", "híbrida", 2.4, 2, 365, "carbono", 2.5, 2.4, 3, "La Vertex más cómoda: absorbe vibraciones, buena si cuidas codo u hombro sin renunciar a atacar."],
  ["vertex05w", "Bullpadel", "Vertex 05 W 2026", "diamante", 2.6, 2.2, 355, "carbono", 2.5, 2.6, 3, "La versión ligera de la Vertex (la de Delfi Brea): potencia con más manejabilidad."],
  ["neuron02", "Bullpadel", "Neuron 02 2026", "híbrida", 2.2, 2.6, 370, "carbono", 3, 2.1, 3, "La pala de Fede Chingotto: equilibrio, precisión y mucha estabilidad cuando sube el ritmo."],
  ["radicalpro", "Head", "Radical Pro 2026", "híbrida", 1.9, 2.4, 365, "carbono", 3, 1.6, 2, "La Radical es la familia de control de Head: precisión y comodidad con algo de salida."],
  ["radicallight", "Head", "Radical Team Light 2026", "híbrida", 1.8, 1.8, 350, "fibra / carbono", 2, 1.6, 1, "Control y ligereza a buen precio (unos 150 €)."],
  ["coelloteam", "Head", "Coello Team 2026", "diamante", 2.4, 2.1, 360, "fibra / carbono", 2, 2.5, 2, "La Coello más accesible: ataque tolerante para intermedios."],
  ["electrapro", "Siux", "Electra Pro 2026", "lágrima", 2, 2.4, 362, "carbono", 3, 2.1, 3, "La línea de Franco Stupaczuk: híbrida y muy completa para jugadores avanzados."],
  ["diablopro", "Siux", "Diablo Pro 2026", "lágrima", 2, 2.4, 365, "carbono", 3, 2, 3, "Polivalente y estable, un clásico de Siux."],
  ["pegasuspro", "Siux", "Pegasus Pro 2026", "híbrida", 2, 2.5, 365, "carbono 18K", 2.8, 2.3, 3, "Para atacantes versátiles: ritmo y salida sin ser una pala de remate puro."],
  ["fenixelite", "Siux", "Fenix Elite 2026", "diamante", 2.8, 2.5, 365, "carbono", 3, 2.9, 3, "La Siux de ataque: diamante y balance alto."],
  ["trilogypro", "Siux", "Trilogy Pro 2026", "redonda", 1.6, 2.2, 365, "carbono", 2.5, 1.4, 2, "Control y colocación: para construir el punto con paciencia."],
  ["raptor", "StarVie", "Raptor+ 2026", "lágrima", 2.2, 2.4, 365, "carbono 3D", 2.7, 2.2, 3, "Lágrima equilibrada entre potencia, control y manejabilidad."],
  ["drax", "StarVie", "Drax+ 2026", "redonda", 1.7, 2.3, 365, "carbono", 2.5, 1.7, 3, "Control con un punto de potencia y buena absorción de vibraciones."],
  ["blacktitan", "StarVie", "Black Titan 2026", "redonda", 1.6, 2.6, 365, "carbono", 2.7, 1.4, 2, "Sensación firme y predecible para colocar y manejar el ritmo."],
  ["arkos", "StarVie", "Arkos 2026", "lágrima", 2, 1.8, 360, "fibra / carbono", 2, 2, 1, "StarVie a precio contenido para intermedios."],
  ["patronkore", "Black Crown", "Patron Kore 2026", "diamante", 2.7, 2.7, 370, "carbono", 3, 2.8, 3, "La más avanzada de Black Crown: potencia para jugadores exigentes."],
  ["canyonattack", "Drop Shot", "Canyon Pro Attack 2.0 2026", "diamante", 2.7, 2.7, 370, "carbono", 3, 2.9, 3, "La pala de ataque de Pablo Lima."],
  ["explorercomfort", "Drop Shot", "Explorer Pro Comfort 2.0 2026", "lágrima", 2.1, 1.9, 365, "carbono", 2.5, 2.1, 3, "Polivalente y cómoda, equilibrio entre control y potencia."],
  ["defyprov1", "Wilson", "Defy Pro V1 2026", "lágrima", 2.3, 2.5, 365, "carbono", 3, 2.4, 3, "La gama alta de Wilson en pádel: polivalente con salida."],
];
const PALAS = PALAS_RAW.map(r => ({ id: "pala_" + r[0], marca: r[1], modelo: r[2], forma: r[3], balance: r[4], dureza: r[5], peso: r[6], cara: r[7], nivel: r[8], perfil: r[9], precio: r[10], desc: r[11] }));
// Zapatillas de pádel: [id, marca, modelo, suela, amort(1-5), estab(1-5), peso g, horma, precio, descripción]
const ZP_RAW = [
  ["noxat10lux", "Nox", "AT10 Lux", "híbrida", 4, 5, 400, "normal", 3, "Equilibrio top entre comodidad y sujeción del tobillo y la rodilla."],
  ["noxat10pro", "Nox", "AT10 Pro 2026", "espiga", 4, 4, 390, "normal", 2, "Agarre de espiga y buena estabilidad a precio más contenido."],
  ["noxnerbo", "Nox", "Nerbo 2026", "espiga", 4, 4, 380, "ancha", 3, "Cómoda y con horma generosa."],
  ["jetpremura2", "Babolat", "Jet Premura 2", "espiga", 3, 4, 360, "normal", 3, "Ligera y reactiva para jugadores rápidos."],
  ["premura3", "Babolat", "Premura 3 2026", "espiga", 4, 4, 380, "normal", 3, "Comodidad y estabilidad de gama alta."],
  ["pspro", "Kuikma", "PS Pro", "espiga", 4, 4, 380, "normal", 2, "Desarrollada con Maxi Sánchez y Lucía Sainz: reactiva y muy completa por su precio."],
  ["ps990", "Kuikma", "PS 990 Dynamic", "espiga", 3, 3, 370, "normal", 1, "Buenas prestaciones a precio de iniciación."],
  ["xplovibram", "Bullpadel", "Xplo Vibram 26", "espiga", 4, 4, 390, "normal", 3, "Suela Vibram muy duradera y con gran agarre."],
  ["prfcomfort", "Bullpadel", "PRF Comfort", "espiga", 5, 3, 380, "normal", 2, "Mucha amortiguación para jugar muchas horas."],
  ["crazyquickboost", "adidas", "Crazyquick Boost Padel", "espiga", 5, 4, 390, "normal", 3, "Boost en el talón: cómoda y con buen retorno."],
  ["crazyquickls", "adidas", "Crazyquick LS 2026", "espiga", 4, 3, 360, "normal", 2, "Ligera y rápida para desplazamientos explosivos."],
  ["courtjam3", "adidas", "CourtJam Control 3", "omni", 3, 4, 390, "ancha", 1, "Resistente y estable; buena para empezar y para pie ancho."],
  ["barricade14", "adidas", "Barricade 14", "híbrida", 3, 5, 420, "normal", 3, "Un tanque de estabilidad para jugadores potentes."],
  ["ubersonic5", "adidas", "Adizero Ubersonic 5", "híbrida", 3, 3, 340, "estrecha", 3, "Ligerísima para jugadores rápidos de pie fino."],
  ["gamecourt2", "adidas", "GameCourt 2", "omni", 2, 3, 360, "normal", 1, "Económica para jugar de vez en cuando."],
  ["dedicate8", "ASICS", "Gel-Dedicate 8 Padel", "espiga", 4, 3, 370, "normal", 1, "Gel en el talón y gran durabilidad por poco dinero."],
  ["revoltpro5", "Head", "Revolt Pro 5.0 Clay", "espiga", 3, 5, 410, "normal", 3, "Muy estable y sujeta: para quien busca protección del tobillo."],
  ["hurakn", "Wilson", "Hurakn Lite", "espiga", 3, 3, 350, "normal", 2, "Ligera y ágil para pistas de arena."],
  ["enforcetour2", "Mizuno", "Wave Enforce Tour 2 CC", "espiga", 4, 4, 390, "normal", 3, "Placa Wave para estabilidad y amortiguación en apoyos laterales."],
];
const ZPADEL = ZP_RAW.map(r => ({ id: "zp_" + r[0], marca: r[1], modelo: r[2], suela: r[3], amort: r[4], estab: r[5], peso: r[6], horma: r[7], precio: r[8], desc: r[9] }));
const gearOf = id => PALAS.find(p => p.id === id) || ZPADEL.find(p => p.id === id) || shoeOf(id);
const NIVL = ["", "Iniciación", "Intermedio", "Avanzado"];
const nivTxt = n => n < 1.5 ? "Iniciación" : n < 2.4 ? "Intermedio" : n < 2.8 ? "Intermedio-avanzado" : "Avanzado";
const perfilTxt = v => v < 1.7 ? "Control" : v < 2.4 ? "Polivalente" : "Potencia";
const blTxt = v => v < 1.7 ? "Bajo" : v < 2.4 ? "Medio" : "Alto";
const durTxt = v => v < 1.7 ? "Blando" : v < 2.4 ? "Medio" : "Duro";

// ---------- Recomendador de palas ----------
function myPadelBand() { const r = (state.perfil.padel || {}).nivel0 ? computeNivel() : null; if (!r) return 2; return r.nivel < 2.6 ? 1 : r.nivel < 4.1 ? 2 : 3; }
function recPala(q) {
  return PALAS.map(p => {
    let sc = 0; const why = [];
    const dn = Math.abs(p.nivel - q.nivel); sc += 2.2 - dn * 2; if (dn < .6) why.push(`para nivel ${NIVL[q.nivel].toLowerCase()}`);
    const dp = Math.abs(p.perfil - q.estilo); sc += 2 - dp * 1.4; if (dp < .5) why.push(perfilTxt(p.perfil).toLowerCase() === "polivalente" ? "polivalente" : `de ${perfilTxt(p.perfil).toLowerCase()}`);
    if (q.lado === "reves" && p.perfil >= 2.3) { sc += .3; why.push("remata bien desde el revés"); }
    if (q.lado === "drive" && p.perfil <= 2.2) { sc += .3; why.push("precisa desde el drive"); }
    if (q.brazo) { sc += (3 - p.dureza) * .5 + (3 - p.balance) * .3 - (p.peso > 365 ? .6 : 0); if (p.dureza < 2.1) why.push("tacto blando, cuida el codo"); if (p.dureza > 2.6) sc -= 1; }
    if (q.ligera && p.peso <= 355) { sc += .6; why.push(`ligera (~${p.peso} g)`); } if (q.ligera && p.peso >= 370) sc -= .6;
    if (q.nivel === 1 && p.forma === "redonda") { sc += .5; why.push("redonda, punto dulce grande"); }
    if (q.nivel === 1 && p.forma === "diamante") sc -= .8;
    if (q.precio && p.precio > q.precio) sc -= .9 * (p.precio - q.precio); if (q.precio === 1 && p.precio === 1) why.push("económica");
    return { s: p, sc, why: [...new Set(why)].slice(0, 3) };
  }).sort((a, b) => b.sc - a.sc).slice(0, 6);
}
function openRecPala() {
  const P = state.perfil.padel || {}; const q = { nivel: myPadelBand(), estilo: 2, lado: P.lado || null, brazo: false, ligera: false, precio: 0 };
  openSheet("¿Qué pala me compro?", `
    <div class="field">Tu nivel ${(P.nivel0 ? `<span class="tiny mute">(según tu nivel en Pádel+: ${fmtNivel(computeNivel().nivel)})</span>` : "")}<div class="seg" id="rpN">${[[1, "Iniciación"], [2, "Intermedio"], [3, "Avanzado"]].map(([k, n]) => `<button data-v="${k}" class="${q.nivel === k ? "on" : ""}">${n}</button>`).join("")}</div></div>
    <div class="field">¿Cómo te gusta jugar?<div class="seg" id="rpE">${[[1, "Control y colocación"], [2, "Un poco de todo"], [3, "Atacar y rematar"]].map(([k, n]) => `<button data-v="${k}" class="${q.estilo === k ? "on" : ""}">${n}</button>`).join("")}</div></div>
    <div class="field">Tu lado<div class="seg" id="rpL">${[["drive", "Drive"], ["reves", "Revés"], ["", "Los dos"]].map(([k, n]) => `<button data-v="${k}" class="${(q.lado || "") === k ? "on" : ""}">${n}</button>`).join("")}</div></div>
    <label class="check"><input type="checkbox" id="rpB"> <span>Tengo o he tenido molestias de <b>codo u hombro</b></span></label>
    <label class="check"><input type="checkbox" id="rpLi"> <span>Prefiero una pala <b>ligera</b></span></label>
    <div class="field">Presupuesto<div class="seg" id="rpP">${[[0, "Me da igual"], [1, "Hasta ~100 €"], [2, "Hasta ~200 €"], [3, "Top"]].map(([k, n]) => `<button data-v="${k}" class="${q.precio === k ? "on" : ""}">${n}</button>`).join("")}</div></div>
    <button class="btn block" id="rpGo" style="background:#facc15;color:#1a1500;border:0">Ver mis palas ideales</button>`, s => {
    const seg = (id, k, num) => $$(`#${id} [data-v]`, s).forEach(b => b.onclick = () => { q[k] = num ? +b.dataset.v : b.dataset.v || null; $$(`#${id} [data-v]`, s).forEach(x => x.classList.toggle("on", x === b)); });
    seg("rpN", "nivel", 1); seg("rpE", "estilo", 1); seg("rpL", "lado"); seg("rpP", "precio", 1);
    $("#rpGo", s).onclick = () => { q.brazo = $("#rpB", s).checked; q.ligera = $("#rpLi", s).checked;
      const r = recPala(q); openSheet("Tus palas ideales", `<p class="small mute" style="margin:-6px 0 12px">Nivel ${NIVL[q.nivel].toLowerCase()} · ${["", "control", "polivalente", "ataque"][q.estilo]}${q.brazo ? " · cuidando el brazo" : ""}</p>${r.map((x, i) => gearRow(x.s, i === 0 ? "🥇 Mejor opción" : null, x.why)).join("")}
        ${q.brazo ? `<div class="hint">${svg("info")}<span>Con molestias de codo: busca tacto blando, balance bajo o medio y no más de ~365 g. Si duele, consulta con un fisio.</span></div>` : ""}
        <p class="tiny mute" style="text-align:center;margin-top:10px">Orientativo. Si puedes, pruébala antes: el tacto es muy personal.</p><button class="btn block" id="rAgain">${svg("refresh")}Cambiar respuestas</button>
        ${window.guest && !(me && me.uid) ? `<div class="card" style="margin-top:12px;border-color:rgba(212,255,58,.35)"><h3>Esto es solo el principio</h3><p class="small mute" style="margin:6px 0 12px">Crea tu cuenta gratis: calcula tu nivel real con tus partidos y la recomendación se ajusta a cómo juegas de verdad.</p><button class="btn pri block" id="rUp">Crear cuenta gratis</button></div>` : ""}`, s2 => { wireGearRows(s2); $("#rAgain", s2).onclick = openRecPala; const u = $("#rUp", s2); if (u) u.onclick = () => { closeSheet(); $("#goUp").click(); }; }); };
  });
}

// ---------- Recomendador de zapatillas de pádel ----------
function recZP(q) {
  return ZPADEL.map(z => {
    let sc = 0; const why = [];
    const sue = { arena: { espiga: 2, "híbrida": 1.2, omni: .2 }, moqueta: { omni: 2, "híbrida": 1.4, espiga: .6 }, mixto: { "híbrida": 2, espiga: 1.4, omni: 1 } }[q.pista][z.suela];
    sc += sue * 1.4; if (sue >= 2) why.push(`suela ${z.suela}: ideal para tu pista`);
    if (q.rodilla) { sc += (z.amort - 3) * .6; if (z.amort >= 4) why.push("mucha amortiguación"); }
    if (q.tobillo) { sc += (z.estab - 3) * .6; if (z.estab >= 4) why.push("muy estable, protege el tobillo"); }
    if (q.horma === "ancha" || q.ancho) { if (z.horma === "ancha") { sc += 1.2; why.push("horma ancha, para tu pie"); } if (z.horma === "estrecha") sc -= 1.4; }
    if (q.horma === "estrecha") { if (z.horma === "estrecha") { sc += .7; why.push("horma estrecha, se ajusta a tu pie"); } if (z.horma === "ancha") sc -= .7; }
    if (q.frec >= 3) { sc += (z.amort + z.estab) * .1; } if (q.rapido && z.peso <= 365) { sc += .5; why.push(`ligera (~${z.peso} g)`); }
    if (q.precio && z.precio > q.precio) sc -= .9 * (z.precio - q.precio); if (q.precio === 1 && z.precio === 1) why.push("económica");
    const kg = q.kg || weightKg();
    if (kg >= 85) { sc += (z.amort + z.estab - 6) * .35; if (z.amort >= 4 && z.estab >= 4) why.push(`buena para tu peso (${kg} kg)`); if (z.peso <= 340) sc -= .5; }
    else if (kg <= 65) { if (z.peso <= 360) { sc += .5; why.push("ligera, ideal para tu peso"); } if (z.amort >= 5) sc -= .2; }
    return { s: z, sc, why: [...new Set(why)].slice(0, 3) };
  }).sort((a, b) => b.sc - a.sc).slice(0, 6);
}
function zpIdeal(z) {
  if (z.amort >= 4 && z.estab >= 4) return "Cualquier peso, también +85 kg";
  if (z.amort >= 4) return "Hasta ~90 kg";
  if (z.peso <= 350) return "Ligeros, hasta ~75 kg";
  return "Hasta ~85 kg";
}
function openRecZP() {
  const q = { pista: "arena", frec: 2, rodilla: false, tobillo: false, horma: "normal", kg: Math.round(weightKg()), rapido: false, precio: 0 };
  openSheet("¿Qué zapatillas de pádel?", `
    <div class="field">¿Dónde juegas sobre todo?<div class="seg" id="rzP" style="flex-wrap:wrap">${[["arena", "Césped con arena"], ["moqueta", "Moqueta / indoor rápida"], ["mixto", "Un poco de todo"]].map(([k, n]) => `<button data-v="${k}" class="${q.pista === k ? "on" : ""}">${n}</button>`).join("")}</div></div>
    <div class="field">¿Cuánto juegas?<div class="seg" id="rzF">${[[1, "1 vez/semana o menos"], [2, "2–3 veces"], [3, "4 o más"]].map(([k, n]) => `<button data-v="${k}" class="${q.frec === k ? "on" : ""}">${n}</button>`).join("")}</div></div>
    <label class="check"><input type="checkbox" id="rzR"> <span>Me molestan las <b>rodillas</b> o la espalda</span></label>
    <label class="check"><input type="checkbox" id="rzT"> <span>Me <b>tuerzo el tobillo</b> con facilidad</span></label>
    <div class="field">¿Cómo es tu pie?<div class="seg" id="rzH">${[["estrecha", "Estrecho"], ["normal", "Normal"], ["ancha", "Ancho"]].map(([k, n]) => `<button data-v="${k}" class="${q.horma === k ? "on" : ""}">${n}</button>`).join("")}</div><span class="tiny mute">Si las zapatillas te suelen apretar por los lados, es ancho.</span></div>
    <label class="field">Tu peso (kg)<input id="rzK" type="number" inputmode="numeric" min="35" max="160" value="${q.kg}"><span class="tiny mute">Con más peso conviene más amortiguación y estabilidad.</span></label>
    <label class="check"><input type="checkbox" id="rzL"> <span>Quiero algo <b>ligero y rápido</b></span></label>
    <div class="field">Presupuesto<div class="seg" id="rzPr">${[[0, "Me da igual"], [1, "Económica"], [2, "Media"], [3, "Top"]].map(([k, n]) => `<button data-v="${k}" class="${q.precio === k ? "on" : ""}">${n}</button>`).join("")}</div></div>
    <button class="btn block" id="rzGo" style="background:#facc15;color:#1a1500;border:0">Ver mis zapatillas ideales</button>`, s => {
    const seg = (id, k, num) => $$(`#${id} [data-v]`, s).forEach(b => b.onclick = () => { q[k] = num ? +b.dataset.v : b.dataset.v; $$(`#${id} [data-v]`, s).forEach(x => x.classList.toggle("on", x === b)); });
    seg("rzP", "pista"); seg("rzF", "frec", 1); seg("rzPr", "precio", 1); seg("rzH", "horma");
    $("#rzGo", s).onclick = () => { q.rodilla = $("#rzR", s).checked; q.tobillo = $("#rzT", s).checked; q.rapido = $("#rzL", s).checked; q.kg = Math.max(35, Math.min(160, +$("#rzK", s).value || q.kg));
      const r = recZP(q); openSheet("Tus zapatillas de pádel", `${r.map((x, i) => gearRow(x.s, i === 0 ? "🥇 Mejor opción" : null, x.why)).join("")}
        <div class="hint">${svg("info")}<span><b style="color:var(--ink)">Suela:</b> espiga para césped con arena (lo más habitual), omni para moqueta o pistas rápidas indoor, híbrida si juegas en ambas.</span></div>
        <button class="btn block" id="rAgain">${svg("refresh")}Cambiar respuestas</button>
        ${window.guest && !(me && me.uid) ? `<button class="btn pri block" id="rUp" style="margin-top:10px">Crear cuenta gratis</button>` : ""}`, s2 => { wireGearRows(s2); $("#rAgain", s2).onclick = openRecZP; const u = $("#rUp", s2); if (u) u.onclick = () => { closeSheet(); $("#goUp").click(); }; }); };
  });
}

// ---------- Ilustraciones (dibujo propio orientativo, no es foto del producto) ----------
const BRAND_COL = { Nox: ["#111827", "#facc15"], adidas: ["#0f172a", "#e5e7eb"], Babolat: ["#0b1220", "#22d3ee"], Head: ["#111", "#f97316"], Bullpadel: ["#0b1020", "#38bdf8"], Kombat: ["#1f2937", "#a3e635"], Kuikma: ["#0f172a", "#60a5fa"], Tecnifibre: ["#111", "#ef4444"], Siux: ["#1e1b4b", "#f43f5e"], StarVie: ["#0a0a0a", "#d4ff3a"], "Black Crown": ["#0a0a0a", "#eab308"], "Drop Shot": ["#111827", "#14b8a6"], Wilson: ["#111", "#dc2626"], ASICS: ["#0b1220", "#3b82f6"], Mizuno: ["#0b1220", "#2563eb"] };
function hueOf(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
function palaArt(g, size = 120) {
  const [base, acc0] = BRAND_COL[g.marca] || ["#111827", "#facc15"]; const acc = acc0; const alt = `hsl(${hueOf(g.modelo)},70%,55%)`;
  const head = { redonda: "M60 8 C96 8 108 36 108 62 C108 92 88 112 60 112 C32 112 12 92 12 62 C12 36 24 8 60 8Z", "lágrima": "M60 6 C94 6 108 34 108 58 C108 86 86 112 60 114 C34 112 12 86 12 58 C12 34 26 6 60 6Z", diamante: "M60 4 C88 4 106 22 108 46 C110 74 88 106 60 116 C32 106 10 74 12 46 C14 22 32 4 60 4Z", "híbrida": "M60 6 C92 6 108 30 108 56 C108 84 88 110 60 114 C32 110 12 84 12 56 C12 30 28 6 60 6Z" }[g.forma] || "";
  let holes = ""; for (let y = 30; y <= 92; y += 11) for (let x = 30; x <= 90; x += 11) if (Math.hypot(x - 60, (y - 60) * 1.05) < 34) holes += `<circle cx="${x}" cy="${y}" r="2.6" fill="#000" opacity=".55"/>`;
  return `<svg viewBox="0 0 120 190" width="${size * .63}" height="${size}"><defs><linearGradient id="pg${g.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${base}"/><stop offset="1" stop-color="${base}" stop-opacity=".85"/></linearGradient></defs>
    <path d="${head}" fill="url(#pg${g.id})" stroke="${acc}" stroke-width="4"/>
    <path d="M24 ${g.forma === "diamante" ? 70 : 82} Q60 ${g.forma === "diamante" ? 30 : 46} 96 ${g.forma === "diamante" ? 70 : 82}" stroke="${alt}" stroke-width="7" fill="none" opacity=".9" stroke-linecap="round"/>${holes}
    <rect x="52" y="112" width="16" height="20" rx="3" fill="${acc}"/><rect x="53" y="130" width="14" height="52" rx="6" fill="#1f2937"/><path d="M53 140h14M53 150h14M53 160h14M53 170h14" stroke="#374151" stroke-width="2"/></svg>`;
}
function shoeArt(g, size = 120) {
  const [base, acc] = BRAND_COL[g.marca] || ["#111827", "#d4ff3a"]; const alt = `hsl(${hueOf(g.modelo)},75%,58%)`;
  return `<svg viewBox="0 0 200 110" width="${size}" height="${size * .55}"><path d="M14 82 C14 60 30 52 48 48 L84 36 C96 30 104 22 118 24 C130 26 132 40 146 46 C166 54 186 58 188 76 L188 84 Z" fill="${base}" stroke="${acc}" stroke-width="3"/>
    <path d="M60 46 L70 62 M76 40 L86 56 M92 34 L100 50" stroke="#e5e7eb" stroke-width="3" stroke-linecap="round"/><path d="M110 60 C130 52 150 60 170 70" stroke="${alt}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M10 84 H192 C192 92 186 98 176 98 H22 C14 98 10 92 10 84Z" fill="#e5e7eb"/><path d="M22 98 V92 M40 98 V92 M58 98 V92 M76 98 V92 M94 98 V92 M112 98 V92 M130 98 V92 M148 98 V92 M166 98 V92" stroke="#9ca3af" stroke-width="2"/></svg>`;
}
function gearArt(g, size) { return g.id.startsWith("pala_") ? palaArt(g, size) : shoeArt(g, size); }

// ---------- Precio y compra ----------
// PVP orientativo (precio oficial de lanzamiento visto en tiendas; las ofertas suelen ser más bajas)
const PVP = { pala_vertex05hybrid: 339.95, pala_techviper3: 370, pala_pegasuspro: 349.9, pala_diablopro: 349.9, pala_drax: 270, pala_arkos: 150, pala_patronkore: 260,
  pala_radicalpro: 240, pala_radicallight: 150, pala_vertex05w: 269.95, pala_neuron02: 269.95, pala_coelloteam: 191, pala_trilogypro: 179.9,
  zp_noxat10pro: 120, zp_noxnerbo: 140, zp_premura3: 159.95, zp_xplovibram: 174.95, zp_crazyquickls: 120, zp_barricade14: 160 };
const RANGO = ["", "menos de 100 €", "100 – 200 €", "más de 200 €"];
const priceTxt = g => PVP[g.id] ? `${Math.round(PVP[g.id])} €` : RANGO[g.precio];
// Cuando Awin apruebe los programas, se rellena AFFIL y los enlaces pasan a ser de afiliado.
const AFFIL = { activo: false, affid: "3159710", tiendas: [] /* {n, mid, buscar: q => url} */ };
function priceLinks(g) {
  const q = `${g.marca} ${g.modelo}`;
  if (AFFIL.activo && AFFIL.tiendas.length) return AFFIL.tiendas.map(t => ({ n: t.n, url: `https://www.awin1.com/cread.php?awinmid=${t.mid}&awinaffid=${AFFIL.affid}&ued=${encodeURIComponent(t.buscar(q))}` }));
  return [{ n: "Comparar precios", url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}` }];
}
function priceBtns(g) { return `<div class="stat" style="margin:4px 0 10px;display:flex;align-items:center;justify-content:space-between"><div><div class="k">${PVP[g.id] ? "Precio oficial (PVP)" : "Precio orientativo"}</div><div class="num" style="font-size:26px;color:#facc15">${priceTxt(g)}</div></div><div class="tiny mute" style="text-align:right;max-width:52%">En tiendas suele haber descuentos. Compara antes de comprar.</div></div><div class="row" style="margin:4px 0 12px">${priceLinks(g).map(l => `<a class="btn block" href="${l.url}" target="_blank" rel="noopener sponsored" style="text-decoration:none;color:inherit">${svg("cart")}${esc(l.n)}</a>`).join("")}</div><p class="tiny mute" style="margin:-6px 0 12px;line-height:1.45">🤝 <b>Enlace de afiliado:</b> si compras desde aquí${AFFIL.activo ? ` en ${AFFIL.tiendas.map(t => esc(t.n)).join(", ") || "la tienda"}` : ""}, Pádel+ puede recibir una comisión. A ti no te cuesta más y no cambia nuestras recomendaciones. <a href="privacidad.html#afiliacion" target="_blank" style="color:var(--volt)">Más info</a></p>`; }

// ---------- Filas y fichas ----------
function gearRow(g, tag = null, why = null) {
  if (!g.id.startsWith("pala_") && !g.id.startsWith("zp_")) return shoeRow(g, tag, why);
  const isP = g.id.startsWith("pala_"); const st = shoeStats[g.id];
  const chips = isP ? [g.forma, perfilTxt(g.perfil), `balance ${blTxt(g.balance).toLowerCase()}`, `~${g.peso} g`] : [`suela ${g.suela}`, `~${g.peso} g`, g.horma !== "normal" ? `horma ${g.horma}` : null].filter(Boolean);
  return `<button class="card shoe" data-gear="${g.id}" style="display:block;width:100%;text-align:left;padding:14px">${tag ? `<div class="tiny" style="color:#facc15;font-weight:700;margin-bottom:6px">${tag}</div>` : ""}
    <div style="display:flex;align-items:center;gap:12px"><div class="gart">${gearArt(g, isP ? 64 : 70)}</div><div style="min-width:0;flex:1"><div class="small mute">${g.marca}</div><div style="font-weight:700;font-size:15.5px">${g.modelo}</div></div><div style="text-align:right;flex:none"><div class="small" style="color:#facc15;font-weight:700;white-space:nowrap">${PVP[g.id] ? priceTxt(g) : PRECIO[g.precio]}</div>${PVP[g.id] ? `<div class="tiny mute">PVP</div>` : `<div class="tiny mute" style="white-space:nowrap">${RANGO[g.precio]}</div>`}${st && st.n ? `<div class="tiny mute">★ ${nf(st.avg, 1)} (${st.n})</div>` : ""}</div></div>
    <div class="chips" style="margin-top:10px">${isP ? `<span class="chip" style="color:#facc15">${nivTxt(g.nivel)}</span>` : ""}${chips.map(c => `<span class="chip">${c}</span>`).join("")}</div>
    ${why && why.length ? `<p class="small" style="margin-top:10px;color:#cfd6de">✓ ${why.join(" · ")}</p>` : ""}</button>`;
}
function wireGearRows(root) { $$("[data-gear]", root).forEach(b => b.onclick = () => openGear(b.dataset.gear)); wireShoeRows(root); }
function openGear(id) {
  const g = gearOf(id); if (!g) return; if (!id.startsWith("pala_") && !id.startsWith("zp_")) return openShoe(id);
  const isP = id.startsWith("pala_");
  const bars = isP ? [["Potencia", g.perfil / 3], ["Control", (4 - g.perfil) / 3], ["Manejabilidad", Math.max(.2, (380 - g.peso) / 40 * .6 + (3 - g.balance) / 2 * .4)], ["Comodidad (brazo)", (3.2 - g.dureza) / 2.2]]
    : [["Amortiguación", g.amort / 5], ["Estabilidad", g.estab / 5], ["Ligereza", Math.max(.15, (430 - g.peso) / 90)], ["Precio", 1 - (g.precio - 1) / 2.5]];
  const specs = isP ? [["Forma", g.forma], ["Balance", blTxt(g.balance)], ["Tacto", durTxt(g.dureza)], ["Peso", `~${g.peso} g`], ["Caras", g.cara], ["Nivel", nivTxt(g.nivel)]]
    : [["Suela", g.suela], ["Peso", `~${g.peso} g`], ["Horma", g.horma], ["Amortiguación", `${g.amort}/5`], ["Estabilidad", `${g.estab}/5`], ["Ideal para", zpIdeal(g)]];
  openSheet(`${g.marca} ${g.modelo}`, `<div class="gartbig">${gearArt(g, isP ? 180 : 230)}<span class="tiny mute">Ilustración orientativa · forma ${isP ? g.forma : "y suela"}</span></div><p style="line-height:1.5;margin-top:-4px">${g.desc}</p>
    <div class="grid3" style="margin:14px 0">${specs.map(([k, v]) => `<div class="stat"><div class="k">${k}</div><div style="font-weight:700;margin-top:4px">${String(v)[0].toUpperCase() + String(v).slice(1)}</div></div>`).join("")}</div>
    <div class="card bars">${bars.map(([n, v]) => `<div class="b"><div><span>${n}</span></div><i><b style="width:${Math.max(5, Math.min(100, v * 100))}%;background:#facc15"></b></i></div>`).join("")}</div>
    ${isP ? "" : `<div class="hint">${svg("info")}<span><b style="color:var(--ink)">Talla y horma:</b> pruébatelas por la tarde y con el calcetín de jugar. Debe quedar un dedo de hueco delante y el pie no debe bailar a los lados. ${g.horma === "ancha" ? "Esta horma es ancha: buena si los pies se te salen por los lados." : g.horma === "estrecha" ? "Esta horma es estrecha: si tienes el pie ancho, mejor otra o media talla más." : "Horma normal: vale para la mayoría de pies."}</span></div>`}
    ${priceBtns(g)}
    ${socialOn() ? `<button class="btn block" id="gRev">${svg("edit")}Opinar</button>` : ""}
    <div class="sec">Opiniones de la comunidad</div><div id="shRevs"><p class="small mute">${socialOn() ? "Cargando…" : "Únete a la comunidad para ver y dejar opiniones."}</p></div>`, s => {
    const rv = $("#gRev", s); if (rv) rv.onclick = () => openOpinar(g);
    if (socialOn()) loadReviews(id);
  });
}
function openGearReview(g) {
  let nota = 0;
  openSheet(`Opinar: ${g.modelo}`, `<div class="field">Tu nota<div class="seg" id="rvN">${[1, 2, 3, 4, 5].map(n => `<button data-n="${n}" style="font-size:20px">★</button>`).join("")}</div></div>
    <label class="field">Meses usándola<input id="rvK" type="number" inputmode="numeric" placeholder="6"></label>
    <label class="field">Tu opinión<textarea id="rvT" rows="3" maxlength="600" placeholder="${g.id.startsWith("pala_") ? "Potencia, control, tacto, punto dulce, ¿te ha dado molestias?…" : "Agarre, comodidad, talla, cuánto te han durado…"}"></textarea></label>
    <button class="btn block" id="rvOk" style="background:#facc15;color:#1a1500;border:0">Publicar opinión</button>`, s => {
    $$("#rvN button", s).forEach(b => b.onclick = () => { nota = +b.dataset.n; $$("#rvN button", s).forEach(x => x.style.color = +x.dataset.n <= nota ? "#facc15" : ""); });
    $("#rvOk", s).onclick = async () => {
      if (!nota) { toast("Pon una nota"); return; }
      try { await FS().collection("zapas").doc(g.id).collection("opiniones").doc(me.uid).set({ uid: me.uid, autor: social.me.nombre, color: social.me.color, nota, meses: +$("#rvK", s).value || 0, texto: $("#rvT", s).value.trim().slice(0, 600), t: Date.now() }); toast("¡Gracias por tu opinión!"); openGear(g.id); }
      catch (e) { console.warn(e); toast("No se pudo publicar"); }
    };
  });
}

// ---------- Hub de material ----------
let gearSeg = "palas", gearFilter = "todas", gearBrand = "todas";
function materialView() {
  const segs = [["palas", "Palas"], ["zpadel", "Zapatillas"], ["outfits", "Outfits"], ["acces", "Accesorios"]];
  const seg = `<div class="seg" style="margin-bottom:14px">${segs.map(([k, n]) => `<button data-gs="${k}" class="${gearSeg === k ? "on" : ""}">${n}</button>`).join("")}</div>`;
  if (gearSeg === "running") gearSeg = "palas";
  if (gearSeg === "outfits") return seg + outfitsHTML() + (socialOn() ? `<div class="sec">Preguntas sobre ropa <button id="qAsk">Preguntar</button></div><div id="qList"></div>` : "");
  if (gearSeg === "acces") return seg + accesHTML() + (socialOn() ? `<div class="sec">Preguntas sobre ropa y accesorios <button id="qAsk">Preguntar</button></div><div id="qList"></div>` : "");
  const isP = gearSeg === "palas"; const all = isP ? PALAS : ZPADEL;
  const cats = isP ? [["todas", "Todas"], ["1", "Control"], ["2", "Polivalente"], ["3", "Potencia"]] : [["todas", "Todas"], ["espiga", "Espiga"], ["omni", "Omni"], ["híbrida", "Híbrida"]];
  const list = all.filter(g => (gearFilter === "todas" || (isP ? String(Math.round(g.perfil)) === gearFilter : g.suela === gearFilter)) && (gearBrand === "todas" || g.marca === gearBrand));
  return seg + `<div class="hero" style="background:radial-gradient(420px 220px at 100% 0%,rgba(250,204,21,.22),transparent 70%),linear-gradient(160deg,#1a170c,#0d0c08 60%);border-color:rgba(250,204,21,.22)">
      <div class="lbl" style="color:#e5d38f">Recomendador</div><h2 style="font-size:24px;letter-spacing:-.5px;margin:6px 0 8px">${isP ? "¿Qué pala me va?" : "¿Qué zapatillas de pádel?"}</h2>
      <p class="small" style="color:#ddd6bf;line-height:1.5">${isP ? `Tu nivel, cómo juegas, tu lado y si te molesta el codo. Te digo las mejores de ${PALAS.length} palas y te explico por qué.` : `Tu pista, cuánto juegas, tus rodillas y tobillos. Te recomiendo entre ${ZPADEL.length} modelos y te explico el tipo de suela.`}</p>
      <button class="btn block" id="gRec" style="margin-top:14px;background:#facc15;color:#1a1500;border:0">${svg("target")}${isP ? "Encontrar mi pala" : "Encontrar mis zapatillas"}</button></div>
    ${isP ? `<div class="card"><h3>${svg("info")}Cómo leer una pala</h3><p class="small mute" style="line-height:1.6"><b style="color:var(--ink)">Forma:</b> redonda = control y punto dulce grande; lágrima = equilibrio; diamante = potencia, más exigente.<br><b style="color:var(--ink)">Balance:</b> alto = más pegada pero más brazo; bajo = más manejable.<br><b style="color:var(--ink)">Tacto:</b> blando = salida de bola y cuida el codo; duro = control y potencia si golpeas fuerte.</p></div>` : ""}
    ${socialOn() ? `<div class="sec">Preguntas sobre ${isP ? "palas" : "zapatillas de pádel"} <button id="qAsk">Preguntar</button></div><div id="qList"><p class="small mute" style="margin:0 4px">Cargando…</p></div>` : ""}
    <div class="sec">Catálogo</div>
    <div class="seg">${cats.map(([k, n]) => `<button data-gf="${k}" class="${gearFilter === k ? "on" : ""}">${n}</button>`).join("")}</div>
    <div class="seg">${["todas", ...new Set(all.map(g => g.marca))].map(m => `<button data-gb="${m}" class="${gearBrand === m ? "on" : ""}" style="padding:7px 10px;font-size:13px">${m === "todas" ? "Todas las marcas" : m}</button>`).join("")}</div>
    ${list.map(g => gearRow(g)).join("") || `<p class="small mute">No hay modelos con ese filtro.</p>`}
    <p class="tiny mute" style="text-align:center;line-height:1.5">Datos aproximados y orientativos. Pádel+ no cobra de ninguna marca.</p>`;
}
function wireMaterial(root) {
  $$("[data-gs]", root).forEach(b => b.onclick = () => { gearSeg = b.dataset.gs; gearFilter = "todas"; gearBrand = "todas"; render(); });
  if (gearSeg === "running") { wireZapasView(root); return; }
  if (gearSeg === "outfits") { wireOutfits(root); const q = $("#qAsk", root); if (q) { q.onclick = () => openAsk("acces"); loadQuestions("acces"); } return; }
  if (gearSeg === "acces") { wireAcces(root); const q = $("#qAsk", root); if (q) { q.onclick = () => openAsk("acces"); loadQuestions("acces"); } return; }
  $("#gRec", root).onclick = gearSeg === "palas" ? openRecPala : openRecZP; wireGearRows(root);
  $$("[data-gf]", root).forEach(b => b.onclick = () => { gearFilter = b.dataset.gf; render(); });
  $$("[data-gb]", root).forEach(b => b.onclick = () => { gearBrand = b.dataset.gb; render(); });
  const qa = $("#qAsk", root); if (qa) { qa.onclick = () => openAsk(gearSeg); loadQuestions(gearSeg); }
}
