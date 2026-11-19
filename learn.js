// ===== Pádel+ · Aprende pádel: golpes, táctica y físico, según tu nivel =====
// nivel: 1 iniciación · 2 intermedio · 3 avanzado
const LESSONS = [
  { id: "posicion", cat: "Táctica", nivel: 1, t: "Dónde colocarte en la pista", r: "La mitad de los puntos se pierden por estar mal colocado, no por golpear mal.",
    p: ["En el saque y la defensa, tu sitio es 1–2 metros por delante de la pared de fondo: así la bola te llega con tiempo.", "Tu pareja y tú os movéis juntos, como unidos por una cuerda de 3 metros: si uno sube, sube el otro.", "La zona de volea es a unos 2–3 metros de la red; más pegado te pasan con un globo.", "Entre golpe y golpe, vuelve siempre al centro de tu medio campo."],
    e: ["Quedarte en la «tierra de nadie» (mitad de pista): te botan la bola en los pies.", "Pegarte demasiado a la pared de fondo: no te deja sitio para jugarla."], tip: "Antes de cada punto pregúntate: ¿estamos los dos a la misma altura?" },
  { id: "pared", cat: "Golpes", nivel: 1, t: "Salida de pared de fondo", r: "El golpe que más separa a un principiante de un jugador que ya se defiende.",
    p: ["Deja que la bola pase: no vayas a buscarla antes de que toque la pared.", "Colócate de lado, con el hombro apuntando a la pared lateral.", "Acompaña la bola con la pala abierta y golpea cuando baje, a la altura de la cintura.", "Busca profundidad o un globo; no intentes ganar el punto desde aquí."],
    e: ["Correr hacia la pared en lugar de esperar a que la bola salga.", "Golpear con la bola muy alta o muy pegada al cuerpo."], tip: "Practica dejando botar la bola y diciendo en voz alta «pared» antes de moverte." },
  { id: "volea", cat: "Golpes", nivel: 1, t: "Volea de derecha y de revés", r: "En la red no se pega, se coloca.",
    p: ["Pala siempre delante del cuerpo, a la altura del pecho, preparada.", "Movimiento corto: casi sin echar la pala atrás.", "Bloquea la muñeca y empuja con el hombro hacia donde quieres mandar la bola.", "Apunta a los pies del rival o a los huecos, no a su pala."],
    e: ["Hacer un swing completo como si fuera un golpe de fondo.", "Dejar caer la pala entre golpe y golpe."], tip: "Piensa en «empujar» la bola, no en golpearla." },
  { id: "globo", cat: "Golpes", nivel: 1, t: "El globo: tu mejor arma defensiva", r: "Con un buen globo recuperas la red y obligas al rival a retroceder.",
    p: ["Abre la cara de la pala y golpea de abajo arriba con un movimiento largo y suave.", "Busca altura y profundidad: que la bola bote cerca de la pared de fondo rival.", "Hazlo cuando los rivales estén pegados a la red.", "Después del globo, sube a la red con tu pareja."],
    e: ["Globos cortos: son remate seguro para el rival.", "Golpear con fuerza: el globo es control, no potencia."], tip: "Mejor un globo alto y profundo que uno rápido y bajo." },
  { id: "saque", cat: "Golpes", nivel: 1, t: "Saque y resto", r: "El saque no gana puntos, pero te da la iniciativa para subir a la red.",
    p: ["Bota la bola detrás de la línea y golpéala por debajo de la cintura.", "Busca el cristal lateral o el cuerpo del restador: le complica el resto.", "Tras sacar, sube a la red en diagonal.", "Al restar, juega bajo y cruzado o un globo para quitarle la red al que sube."],
    e: ["Sacar fuerte y quedarte atrás.", "Restar al cuerpo del jugador que ya está en la red."], tip: "Varía el saque: al cristal, al centro y al cuerpo." },
  { id: "bandeja", cat: "Golpes", nivel: 2, t: "La bandeja", r: "El golpe para mantener la red cuando te hacen un globo que no puedes rematar.",
    p: ["Ponte de perfil, con la pala alta detrás de la cabeza y el brazo libre señalando la bola.", "Golpea la bola por delante del cuerpo, a la altura de la cabeza o un poco por debajo.", "Corta la bola de arriba abajo, cortando hacia el lateral: la bola baja y no rebota mucho.", "Busca la esquina o la reja, y vuelve rápido a tu posición de red."],
    e: ["Querer rematarla fuerte: la bandeja es para controlar, no para ganar el punto.", "Golpear con la bola detrás de la cabeza: pierdes control."], tip: "Si no llegas cómodo a la bola, mejor una bandeja segura que un remate fallado." },
  { id: "chiquita", cat: "Golpes", nivel: 2, t: "La chiquita", r: "Una bola lenta y baja a los pies del que está en la red para recuperar tú la red.",
    p: ["Úsala cuando los rivales estén en la red y tú en el fondo.", "Golpe suave, con la cara de la pala algo abierta, buscando que la bola pase justa por encima de la red.", "Apunta a los pies del jugador, idealmente al centro.", "Tras la chiquita, sube a la red con tu pareja."],
    e: ["Darle demasiado fuerte o demasiado alta: es volea fácil para el rival.", "Hacerla y quedarte atrás."], tip: "La clave es el ritmo: lenta, baja y a los pies." },
  { id: "dejada", cat: "Golpes", nivel: 2, t: "La dejada", r: "Sorpresa: una bola muerta junto a la red cuando el rival está en el fondo.",
    p: ["Disimula: prepárala igual que una volea normal.", "Abre la cara de la pala y amortigua el golpe, como si atraparas la bola.", "Busca que la bola bote cerca de la red y lejos de la pared lateral.", "Úsala con los rivales lejos, al fondo."], e: ["Hacerla cuando el rival está cerca de la red.", "Usarla demasiado: pierde la sorpresa."], tip: "Funciona mejor después de varias voleas profundas." },
  { id: "bajada", cat: "Golpes", nivel: 2, t: "Bajada de pared", r: "Atacar una bola que vuelve alta de la pared de fondo.",
    p: ["Espera a que la bola salga de la pared y empiece a bajar.", "Colócate de lado, como en un remate pero con la bola más baja.", "Golpea plano o con un poco de corte, buscando los pies del rival o la reja.", "Si dudas, mejor un globo que una bajada fallada."], e: ["Golpear con la bola todavía subiendo.", "Querer ganar el punto con una bola sin ventaja."], tip: "Solo ataca si la bola sale alta y cerca del cuerpo." },
  { id: "subir", cat: "Táctica", nivel: 2, t: "Cuándo subir a la red", r: "Quien domina la red domina el partido.",
    p: ["Sube después de un buen globo, una chiquita o un saque.", "Sube con tu pareja: si sube uno solo os abren un hueco en el medio.", "Para en la zona de volea; no te pegues a la red.", "Si el rival te lanza un buen globo, baja junto a tu pareja."], e: ["Subir detrás de una bola mala: te pasan fácil.", "Subir uno y quedarse el otro atrás."], tip: "«Globo bueno, red para nosotros»." },
  { id: "comunicacion", cat: "Táctica", nivel: 2, t: "Comunicación con tu pareja", r: "Las parejas que hablan ganan los puntos dudosos.",
    p: ["Decid «mía» o «tuya» en las bolas por el centro, y hacedlo pronto.", "Por defecto, la bola del centro la juega el de la derecha (drive)… o el que la tenga de derecha. ¡Pactadlo antes!", "Avisad «pared», «sube» o «quieto» para orientar a tu pareja.", "Tras un error, ánimo y siguiente punto."], e: ["Ir los dos a por la misma bola, o ninguno.", "Callarse durante todo el partido."], tip: "Antes de empezar, decidid quién se queda las bolas del centro." },
  { id: "vibora", cat: "Golpes", nivel: 3, t: "La víbora", r: "Una bandeja agresiva con mucho efecto lateral que sale de la pared con poco bote.",
    p: ["Colócate como en la bandeja, pero golpea la bola algo más atrasada y a la altura del hombro.", "Movimiento más rápido y con más muñeca, cortando la bola de lado (de las 3 a las 9 de un reloj).", "Busca la reja o la pared lateral del rival para que la bola salga rápida y baja.", "Exige timing: practícala primero en entrenamiento."], e: ["Usarla con bolas muy profundas o muy rápidas.", "Abusar de la muñeca: puede cargar el codo."], tip: "La víbora es ataque; la bandeja es mantener. Elige bien cada una." },
  { id: "por3", cat: "Golpes", nivel: 3, t: "Remate por 3 y por 4", r: "Sacar la bola de la pista por la pared lateral (por 3) o por el fondo (por 4).",
    p: ["Solo con bolas altas, lentas y cerca de la red.", "Golpe plano y potente, buscando el bote cerca de la pared lateral rival.", "Para el «por 3», remata hacia la esquina de la pared lateral para que la bola salga por encima.", "Si no tienes una bola clara, mejor bandeja o víbora."], e: ["Intentarlo desde el fondo de la pista.", "Rematar todo: los rivales aprenden a esperar."], tip: "El remate ganador sale de la paciencia: espera la bola buena." },
  { id: "rulo", cat: "Golpes", nivel: 3, t: "El rulo (topspin)", r: "Remate con efecto liftado que bota alto y obliga al rival a jugar desde muy atrás.",
    p: ["Golpea la bola por delante, de abajo arriba y hacia delante, cepillándola.", "Busca que bote lejos de la red y alto.", "Úsalo cuando la bola no esté para un por 3."], e: ["Golpear plano: pierde el efecto y bota poco."], tip: "Muy útil contra rivales que defienden bien las bolas planas." },
  { id: "calentamiento", cat: "Físico", nivel: 1, t: "Calentamiento antes de jugar (8 minutos)", r: "La mayoría de lesiones de pádel llegan por empezar en frío.",
    p: ["2 min de trote suave y desplazamientos laterales.", "Movilidad: círculos de hombros, muñecas, cadera y tobillos.", "10 sentadillas y 10 zancadas por pierna.", "Peloteo suave desde la red y el fondo antes de empezar a contar."], e: ["Empezar el partido directamente.", "Estirar en estático y en frío."], tip: "Los gemelos y el hombro son los que más sufren: dales cariño." },
  { id: "codo", cat: "Físico", nivel: 1, t: "Cuida tu codo y tu hombro", r: "La «epicondilitis» es la lesión más típica del pádel.",
    p: ["Usa una pala adecuada: tacto blando o medio y balance no muy alto si tienes molestias.", "Cambia el overgrip a menudo: un grip gastado te obliga a apretar más.", "Fortalece antebrazo y hombro con gomas 2–3 veces por semana.", "No abuses de la muñeca en bandejas y víboras."], e: ["Jugar con dolor «hasta que se pase».", "Usar una pala dura y pesada sin técnica."], tip: "Si el dolor dura más de una semana, consulta con un fisioterapeuta." },
];
const learnSeen = () => state.perfil.aprende || {};
function nextLesson() { const b = myPadelBand(), s = learnSeen(); return LESSONS.filter(l => !s[l.id]).sort((a, c) => Math.abs(a.nivel - b) - Math.abs(c.nivel - b))[0] || null; }
let learnCat = "todas";
function aprendeHTML() {
  const b = myPadelBand(), s = learnSeen(); const done = LESSONS.filter(l => s[l.id]).length;
  const list = LESSONS.filter(l => learnCat === "todas" || l.cat === learnCat);
  const nx = nextLesson();
  return `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><div><div class="small mute">Tu progreso</div><div class="num" style="font-size:30px">${done}<small class="mute" style="font-size:16px"> / ${LESSONS.length} lecciones</small></div></div><div class="ring" style="width:64px;height:64px">${ringSVG(done / LESSONS.length, "#facc15", 64, 8)}</div></div></div>
    ${nx ? `<button class="card" data-les="${nx.id}" style="display:block;width:100%;text-align:left;border-color:rgba(250,204,21,.3)"><div class="tiny" style="color:#facc15;font-weight:700">SIGUIENTE PARA TU NIVEL</div><div style="font-weight:800;font-size:18px;margin-top:4px">${nx.t}</div><div class="small mute" style="margin-top:4px">${nx.r}</div></button>` : ""}
    <div class="seg">${["todas", "Golpes", "Táctica", "Físico"].map(c => `<button data-lc="${c}" class="${learnCat === c ? "on" : ""}">${c === "todas" ? "Todas" : c}</button>`).join("")}</div>
    <div class="card" style="padding:4px 14px">${list.map(l => `<button class="item" data-les="${l.id}"><span style="font-size:18px;width:26px;text-align:center">${s[l.id] ? "✅" : l.cat === "Golpes" ? "🎾" : l.cat === "Táctica" ? "🧠" : "💪"}</span><div style="flex:1;min-width:0"><div style="font-weight:600">${l.t}</div><div class="tiny mute">${l.cat} · ${NIVL[l.nivel]}${l.nivel === b ? " · tu nivel" : ""}</div></div>${svg("chev", "chev")}</button>`).join("")}</div>
    ${socialOn() ? `<div class="sec">Dudas de técnica y táctica <button id="qAsk">Preguntar</button></div><div id="qList"></div>` : ""}`;
}
function wireAprende(root) { $$("[data-les]", root).forEach(b => b.onclick = () => openLesson(b.dataset.les)); const q = $("#qAsk", root); if (q) { q.onclick = () => openAsk("juego"); loadQuestions("juego"); } $$("[data-lc]", root).forEach(b => b.onclick = () => { learnCat = b.dataset.lc; render(); }); }
function openLesson(id) {
  const l = LESSONS.find(x => x.id === id); if (!l) return; const seen = !!learnSeen()[id];
  openSheet(l.t, `<div class="chips" style="margin:-6px 0 12px"><span class="chip" style="color:#facc15">${l.cat}</span><span class="chip">${NIVL[l.nivel]}</span></div>
    <p style="font-size:17px;line-height:1.45;font-weight:600">${l.r}</p>
    <div class="sec">Cómo se hace</div><div class="card">${l.p.map((x, i) => `<div style="display:flex;gap:12px;margin-bottom:${i < l.p.length - 1 ? 12 : 0}px"><span class="num" style="font-size:22px;color:#facc15;width:18px;flex:none">${i + 1}</span><p style="line-height:1.5">${x}</p></div>`).join("")}</div>
    <div class="sec">Errores típicos</div><div class="card">${l.e.map(x => `<p style="line-height:1.5;margin-bottom:8px">❌ ${x}</p>`).join("")}</div>
    <div class="hint" style="background:rgba(250,204,21,.08)"><span style="font-size:18px">💡</span><span style="color:var(--ink)">${l.tip}</span></div>
    ${socialOn() ? `<button class="btn block" id="lAsk" style="margin-top:6px">${svg("mail")}Preguntar a la comunidad</button>` : ""}
    <button class="btn block ${seen ? "" : "pri"}" id="lDone" style="margin-top:10px">${seen ? "✓ Aprendida" : "Marcar como aprendida"}</button>`, s => {
    $("#lDone", s).onclick = () => { const a = { ...learnSeen() }; if (a[id]) delete a[id]; else a[id] = Date.now(); savePerfil({ aprende: a }); closeSheet(); toast(a[id] ? "¡Una lección menos! 🎾" : "Lección desmarcada"); };
    const q = $("#lAsk", s); if (q) q.onclick = () => openAsk("juego");
  });
}

// ===== Ropa y accesorios =====
const ACCES = [
  { id: "pelotas", e: "🟡", t: "Pelotas", r: "Las de presión alta («Pro») botan más y duran más vivas; las de gama básica pierden presión antes.", tips: ["Un bote de 3 dura vivo unas 2–4 horas de juego intensivo.", "Si notas que «no salen» de la pared, toca cambiarlas.", "En altitud o con frío se usan pelotas de menos presión."], marcas: ["Head", "Bullpadel", "Wilson", "Babolat", "Nox", "Kuikma"] },
  { id: "overgrip", e: "🖐️", t: "Overgrip", r: "La cinta del mango. Barata y de lo que más influye en el control y en el codo.", tips: ["Cámbialo cada 5–10 partidos, o antes si resbala.", "Perforado si te sudan las manos; liso si buscas tacto.", "Con dos overgrips engordas el mango si tienes la mano grande."], marcas: ["Bullpadel", "Head", "Wilson", "Nox", "adidas"] },
  { id: "protector", e: "🛡️", t: "Protector de pala", r: "Una cinta en el marco que evita que la pala se desconche al rozar el suelo y las paredes.", tips: ["Muy recomendable si juegas mucho de pared o te agachas a por bolas bajas.", "Suma unos gramos en la cabeza: puede subir algo el balance."], marcas: ["Bullpadel", "Nox", "adidas", "Head"] },
  { id: "paletero", e: "🎒", t: "Paletero o mochila", r: "Protege la pala del calor y los golpes. Nunca la dejes en el maletero en verano.", tips: ["Con compartimento térmico si juegas con calor.", "Mochila si llevas una pala; paletero grande si llevas dos y ropa de cambio."], marcas: ["Bullpadel", "Nox", "adidas", "Head", "Babolat", "Siux"] },
  { id: "camiseta", e: "👕", t: "Camiseta técnica", r: "Tejido transpirable que seque rápido. Evita el algodón: se empapa y pesa.", tips: ["Cuello y costuras planas para que no rocen.", "Ten una de cambio en el paletero para los partidos largos."], marcas: ["adidas", "Bullpadel", "Nox", "Joma", "Siux", "Kuikma"] },
  { id: "pantalon", e: "🩳", t: "Pantalón o falda", r: "Que te deje moverte en lateral y tenga bolsillo para la segunda bola.", tips: ["Mallas interiores para evitar rozaduras en partidos largos.", "Bolsillo profundo o malla con bolsillo para guardar la bola."], marcas: ["adidas", "Bullpadel", "Nox", "Joma", "Siux"] },
  { id: "calcetines", e: "🧦", t: "Calcetines", r: "Los grandes olvidados: unos buenos evitan ampollas en las frenadas.", tips: ["Técnicos y con refuerzo en talón y puntera.", "Media caña protegen del roce de la zapatilla en el tobillo."], marcas: ["Bullpadel", "Nox", "adidas", "Kuikma"] },
  { id: "munequera", e: "🎽", t: "Muñequeras y cinta del pelo", r: "Evitan que el sudor te baje a la mano y al mango.", tips: ["Imprescindibles en verano y en pista cubierta sin ventilación."], marcas: ["Bullpadel", "Nox", "adidas", "Head"] },
];
function accesHTML() {
  return `<div class="hint" style="background:rgba(250,204,21,.08)"><span style="font-size:18px">🎒</span><span style="color:var(--ink)">Lo que de verdad importa además de la pala y las zapatillas, explicado sin rollo.</span></div>
    ${ACCES.map(a => `<button class="card" data-acc="${a.id}" style="display:block;width:100%;text-align:left"><div style="display:flex;gap:12px;align-items:center"><span style="font-size:26px">${a.e}</span><div style="flex:1"><div style="font-weight:700">${a.t}</div><div class="small mute" style="margin-top:2px;line-height:1.4">${a.r}</div></div>${svg("chev", "chev")}</div></button>`).join("")}`;
}
function wireAcces(root) { $$("[data-acc]", root).forEach(b => b.onclick = () => { const a = ACCES.find(x => x.id === b.dataset.acc);
  openSheet(`${a.e} ${a.t}`, `<p style="font-size:16px;line-height:1.5">${a.r}</p><div class="sec">Consejos</div><div class="card">${a.tips.map(t => `<p style="line-height:1.5;margin-bottom:8px">✓ ${t}</p>`).join("")}</div>
    <div class="sec">Marcas habituales</div><div class="chips">${a.marcas.map(m => `<span class="chip">${m}</span>`).join("")}</div>
    ${socialOn() ? `<button class="btn block" id="aAsk" style="margin-top:16px">${svg("mail")}Preguntar a la comunidad</button>` : ""}`, s => { const q = $("#aAsk", s); if (q) q.onclick = () => openAsk("acces"); }); }); }

// ===== Outfits de pádel =====
const OUTFITS = [
  { id: "verano-m", g: "mujer", e: "☀️", t: "Verano · Mujer", piezas: ["Camiseta de tirantes o top técnico transpirable", "Falda pantalón con malla interior y bolsillo para la bola", "Calcetines técnicos tobilleros", "Visera y muñequera"], tips: ["Colores claros: absorben menos calor.", "Malla interior con bolsillo: la segunda bola siempre a mano.", "Lleva una camiseta de cambio en el paletero."] },
  { id: "invierno-m", g: "mujer", e: "❄️", t: "Invierno · Mujer", piezas: ["Camiseta técnica de manga larga o térmica", "Mallas largas o falda + mallas térmicas", "Sudadera ligera con cremallera para calentar", "Calcetines de media caña"], tips: ["Capas: te quitas la sudadera después de calentar.", "Las mallas térmicas protegen la musculatura en pistas frías."] },
  { id: "verano-h", g: "hombre", e: "☀️", t: "Verano · Hombre", piezas: ["Camiseta técnica de manga corta o sin mangas", "Pantalón corto con bolsillos profundos o malla interior", "Calcetines técnicos", "Cinta o gorra"], tips: ["Tejido que seque rápido (nada de algodón).", "Bolsillo profundo para que no se caiga la bola al correr."] },
  { id: "invierno-h", g: "hombre", e: "❄️", t: "Invierno · Hombre", piezas: ["Camiseta térmica de manga larga", "Pantalón corto + malla larga, o pantalón largo técnico", "Sudadera o chaqueta ligera", "Calcetines de media caña"], tips: ["Calienta con la chaqueta puesta y quítatela al empezar.", "Si la pista es exterior y hay humedad, guarda una camiseta seca."] },
  { id: "torneo", g: "todos", e: "🏆", t: "Día de torneo", piezas: ["Dos camisetas iguales (para cambiarte entre partidos)", "Pantalón o falda de confianza, ya probada", "Zapatillas usadas al menos 2–3 partidos (nunca nuevas)", "Overgrip nuevo puesto la noche antes"], tips: ["Ir conjuntado con tu pareja motiva (y queda mejor en las fotos).", "Prepara el paletero la noche anterior: pelotas, agua, plátano, overgrip."] },
  { id: "tallas", g: "todos", e: "📏", t: "Cómo acertar con la talla", piezas: ["Camiseta: ajustada pero sin apretar en hombros (que puedas rematar)", "Falda / pantalón: que la malla no se suba al agacharte", "Zapatillas: medio número más que tu calle si juegas mucho (el pie se hincha)"], tips: ["Haz una sentadilla y un gesto de remate en el probador.", "Cada marca talla distinto: mira la tabla de tallas de cada una."] },
];
let outfitG = "todos";
function outfitsHTML() {
  const list = OUTFITS.filter(o => outfitG === "todos" || o.g === outfitG || o.g === "todos");
  return `<div class="hint" style="background:rgba(250,204,21,.08)"><span style="font-size:18px">👕</span><span style="color:var(--ink)">Qué ponerte para jugar cómodo y que te quede bien, según la estación. Sin tecnicismos.</span></div>
    <div class="seg">${[["todos", "Todo"], ["mujer", "Mujer"], ["hombre", "Hombre"]].map(([k, n]) => `<button data-og="${k}" class="${outfitG === k ? "on" : ""}">${n}</button>`).join("")}</div>
    ${list.map(o => `<button class="card" data-out="${o.id}" style="display:block;width:100%;text-align:left"><div style="display:flex;gap:12px;align-items:center"><span style="font-size:26px">${o.e}</span><div style="flex:1"><div style="font-weight:700">${o.t}</div><div class="small mute" style="margin-top:2px">${o.piezas.slice(0, 2).join(" · ")}…</div></div>${svg("chev", "chev")}</div></button>`).join("")}`;
}
function wireOutfits(root) {
  $$("[data-og]", root).forEach(b => b.onclick = () => { outfitG = b.dataset.og; render(); });
  $$("[data-out]", root).forEach(b => b.onclick = () => { const o = OUTFITS.find(x => x.id === b.dataset.out);
    openSheet(`${o.e} ${o.t}`, `<div class="sec" style="margin-top:0">Qué llevar</div><div class="card">${o.piezas.map(p => `<p style="line-height:1.5;margin-bottom:8px">👉 ${p}</p>`).join("")}</div>
      <div class="sec">Consejos</div><div class="card">${o.tips.map(t => `<p style="line-height:1.5;margin-bottom:8px">✓ ${t}</p>`).join("")}</div>
      <div class="sec">Marcas habituales</div><div class="chips">${["adidas", "Bullpadel", "Nox", "Siux", "Joma", "Kuikma", "Head", "Babolat"].map(m => `<span class="chip">${m}</span>`).join("")}</div>
      <a class="btn block" style="margin-top:16px;text-decoration:none;color:inherit" target="_blank" rel="noopener" href="https://www.google.com/search?tbm=shop&q=${encodeURIComponent("ropa padel " + (o.g === "todos" ? "" : o.g))}">${svg("cart")}Ver ropa de pádel</a>`); }); }

function openRopaGuest() {
  openSheet("Ropa de pádel", outfitsHTML() + (window.guest && !(me && me.uid) ? `<button class="btn pri block" id="ogUp" style="margin-top:6px">Crear cuenta gratis</button>` : ""), s => {
    wireOutfits(s); $$("[data-og]", s).forEach(b => b.onclick = () => { outfitG = b.dataset.og; openRopaGuest(); });
    const u = $("#ogUp", s); if (u) u.onclick = () => { closeSheet(); $("#goUp").click(); };
  });
}
