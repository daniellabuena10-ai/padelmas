// ===== Pádel+ · nutrición =====
const ACT_LV = [[1.2, "Sedentario", "Trabajo sentado, poco movimiento"], [1.375, "Ligero", "Entreno 1–3 días por semana"], [1.55, "Moderado", "Entreno 3–5 días por semana"], [1.725, "Alto", "Entreno 6–7 días por semana"], [1.9, "Muy alto", "Doble sesión o trabajo físico"]];
const OBJ = [["perder", "Perder grasa"], ["mantener", "Mantenerme"], ["ganar", "Ganar músculo"]];

function nutriTargets(p = state.perfil.nutri) {
  if (!p || !p.peso || !p.altura || !p.edad) return null;
  const kg = weightKg() || p.peso;
  const bmr = 10 * kg + 6.25 * p.altura - 5 * p.edad + (p.sexo === "m" ? -161 : 5);
  const tdee = bmr * (p.act || 1.375);
  let kcal = p.obj === "perder" ? tdee * 0.82 : p.obj === "ganar" ? tdee + 300 : tdee;
  const floor = Math.max(bmr, p.sexo === "m" ? 1200 : 1500); // nunca por debajo de lo seguro
  kcal = Math.round(Math.max(kcal, floor) / 10) * 10;
  const prot = Math.round(kg * (p.obj === "mantener" ? 1.5 : 1.8)), fat = Math.round(kcal * 0.28 / 9), carb = Math.max(0, Math.round((kcal - prot * 4 - fat * 9) / 4));
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, prot, fat, carb, agua: Math.round(kg * 35 / 250) };
}
function nutriToday(day = todayStr()) {
  const T = nutriTargets(); const items = Object.values(state.com).filter(c => c.fecha === day);
  const s = k => items.reduce((a, c) => a + (+c[k] || 0), 0);
  const burn = actList().filter(a => dstr(new Date(a.fecha)) === day).reduce((a, x) => a + (x.kcal || 0), 0);
  return { items, kcal: s("kcal"), p: s("p"), c: s("c"), g: s("g"), burn, target: T ? T.kcal : 0, tp: T ? T.prot : 0, tc: T ? T.carb : 0, tg: T ? T.fat : 0, T };
}

let nTab = "partido", nDay = todayStr(), nMom = "antes";
function vNutricion() {
  const T = nutriTargets();
  if (!T) return `<div class="hero" style="background:radial-gradient(400px 200px at 100% 0%,rgba(255,106,61,.25),transparent 70%),linear-gradient(160deg,#fcf8f6,#fcfbfa 60%);border-color:rgba(255,106,61,.2)">
    <div class="lbl" style="color:var(--mute)">Nutrición para el pádel</div><h2 style="font-size:26px;letter-spacing:-.5px;margin:8px 0 10px">Come para rendir en la pista</h2>
    <p class="small" style="color:var(--mute);line-height:1.55">Con tu edad, altura, peso y actividad calculo tus calorías y macros, y te preparo un <b>plan de comidas para la semana</b> con lista de la compra. Además puedes apuntar lo que comes.</p>
    <button class="btn hot block" id="nStart" style="margin-top:16px">Calcular mi plan</button></div>
    ${nPartido()}
    <p class="tiny mute" style="text-align:center;line-height:1.5">Recomendaciones generales y orientativas. No sustituyen a un médico ni a un dietista-nutricionista.</p>`;
  return `<div class="tabs">${[["partido", "Partido"], ["hoy", "Diario"], ["plan", "Plan semanal"], ["datos", "Mis números"]].map(([k, n]) => `<button data-t="${k}" class="${nTab === k ? "on" : ""}">${n}</button>`).join("")}</div>` +
    (nTab === "partido" ? nPartido(T) : nTab === "hoy" ? nHoy(T) : nTab === "plan" ? nPlan(T) : nDatos(T));
}
const N_PARTIDO = {
  antes: { e: "⏰", t: "Antes del partido", items: [
    ["2–3 h antes", "Comida normal con hidratos y algo de proteína: pasta, arroz o bocadillo de pavo, con poca grasa."],
    ["30–60 min antes", "Algo ligero si tienes hambre: un plátano, una tostada con mermelada o un yogur."],
    ["Agua", "Llega bien hidratado: 400–500 ml en las 2 horas previas, a sorbos."],
    ["Evita", "Fritos, comidas copiosas y mucha fibra justo antes: pesan y dan flato."]] },
  durante: { e: "🎾", t: "Durante el partido", items: [
    ["En cada cambio de lado", "Un par de tragos de agua, unos 150–250 ml cada 15–20 min. No esperes a tener sed."],
    ["Si hace calor o pasas de 75 min", "Bebida isotónica o sales en el agua: recuperas el sodio que pierdes sudando."],
    ["Partidos largos", "Medio plátano, unos dátiles o un gel entre sets te mantiene con energía."],
    ["Truco", "Lleva dos botellas: una de agua y otra con sales."]] },
  despues: { e: "🔋", t: "Después del partido", items: [
    ["En la primera hora", "Hidratos + proteína para recuperar: yogur con fruta, batido de leche y plátano o bocadillo de atún o pavo."],
    ["Rehidrátate", "Bebe poco a poco durante las 2 horas siguientes, sobre todo si has sudado mucho."],
    ["La cerveza del tercer tiempo", "Si cae, que sea después de beber agua, y mejor una que tres."],
    ["Cena", "Plato completo: verdura, proteína (pescado, huevo, pollo) y algo de hidrato si mañana vuelves a jugar."]] },
  torneo: { e: "🏆", t: "Día de torneo", items: [
    ["Varios partidos", "Comidas pequeñas cada 2–3 h en vez de una grande. Nada de experimentos ese día."],
    ["En la bolsa", "Fruta (plátano, manzana), frutos secos, barritas de cereales, sándwich y bebida isotónica."],
    ["Entre partidos", "Si tienes menos de 1 h: algo líquido o muy ligero. Si tienes más de 2 h: un bocadillo."],
    ["Al acabar", "Recupera como después de cualquier partido, y descansa bien esa noche."]] } };
function nPartido() {
  const M = N_PARTIDO[nMom] || N_PARTIDO.antes;
  return `<div class="sec" style="margin-top:6px">Come para jugar mejor</div>
    <div class="seg" id="nMo" style="margin-bottom:10px">${Object.entries(N_PARTIDO).map(([k, m]) => `<button data-m="${k}" class="${nMom === k ? "on" : ""}" style="padding-left:4px;padding-right:4px">${({ antes: "Antes", durante: "Durante", despues: "Después", torneo: "Torneo" })[k]}</button>`).join("")}</div>
    <div class="card"><h3>${M.e} ${M.t}</h3>${M.items.map(([k, v]) => `<div style="padding:10px 0;border-top:1px solid var(--line)"><div class="small" style="color:var(--vt);font-weight:700">${k}</div><div style="line-height:1.5;margin-top:2px">${v}</div></div>`).join("")}</div>
    <p class="tiny mute" style="text-align:center;line-height:1.5">Consejos generales para deportistas aficionados. No sustituyen a un dietista-nutricionista.</p>`;
}
function nHoy(T) {
  const n = nutriToday(nDay); const d = parseD(nDay); const isToday = nDay === todayStr();
  const water = (state.dia[nDay] || {}).agua || 0;
  return `<div class="row" style="align-items:center;margin-bottom:12px"><button class="x" id="dPrev" style="flex:none">${svg("back")}</button><div style="text-align:center;font-weight:700">${isToday ? "Hoy" : `${DIAS_L[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`}</div><button class="x" id="dNext" style="flex:none;${isToday ? "opacity:.3" : ""}">${svg("chev")}</button></div>
  <div class="card"><div class="kring"><div class="ring">${ringSVG(n.kcal / n.target, n.kcal > n.target * 1.08 ? "var(--neg)" : "var(--hot)")}<div class="in"><div><b class="num">${nf(Math.max(0, n.target - n.kcal))}</b><br><span>kcal restantes</span></div></div></div>
    <div style="flex:1"><div class="small mute">Comido</div><div class="num" style="font-size:30px">${nf(n.kcal)} <small class="mute" style="font-size:16px">/ ${nf(n.target)}</small></div>${n.burn ? `<span class="chip volt" style="margin-top:6px">${svg("flame")}${nf(n.burn)} kcal entrenando</span>` : ""}</div></div>
    <div class="bars" style="margin-top:6px">${macroBar("Proteína", n.p, n.tp, "#d4ff3a")}${macroBar("Carbohidratos", n.c, n.tc, "#38bdf8")}${macroBar("Grasa", n.g, n.tg, "#ff6a3d")}</div>
    ${n.burn > 250 ? `<p class="tiny mute" style="margin-top:10px">Hoy has entrenado fuerte: puedes comer ~${nf(Math.round(n.burn * .5 / 10) * 10)} kcal más para recuperar bien.</p>` : ""}</div>
  <div class="card"><h3><span style="display:flex;gap:8px;align-items:center;color:var(--sky)">${svg("water")}<span style="color:var(--ink)">Agua</span></span><span class="small mute">${nf(water * 0.25, 2)} / ${nf(T.agua * 0.25, 1)} L</span></h3>
    <div class="water">${Array.from({ length: Math.max(T.agua, water + 1) }, (_, i) => `<button data-w="${i}" class="${i < water ? "on" : ""}">${svg("water")}</button>`).join("")}</div></div>
  ${MOMENTOS.map(([k, n2]) => { const its = n.items.filter(c => c.momento === k); const kc = its.reduce((s, c) => s + (+c.kcal || 0), 0);
    if (k === "snack" && !its.length) return `<button class="btn sm block" data-addm="snack" style="margin-bottom:14px">${svg("plus")}Añadir picoteo</button>`;
    return `<div class="card"><h3>${n2}<span class="small mute">${kc ? nf(kc) + " kcal" : ""}</span></h3>${its.map(c => `<div class="meal"><div class="mi">${svg("food")}</div><div style="min-width:0"><div class="t">${esc(c.nombre)}</div><div class="s">${c.gr ? c.gr + " g · " : ""}P ${nf(c.p)} · C ${nf(c.c)} · G ${nf(c.g)}</div></div><div class="r"><div class="num" style="font-size:19px">${nf(c.kcal)}</div><button data-dc="${c.id}" class="tiny mute">quitar</button></div></div>`).join("")}
      <button class="btn sm" data-addm="${k}" style="margin-top:${its.length ? 10 : 0}px">${svg("plus")}Añadir</button></div>`; }).join("")}`;
}
// ---- Plan semanal ----
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function weekPlan(T) {
  const p = state.perfil.nutri || {}; const ov = state.perfil.planOv || {}; const w0 = monday(new Date());
  const seed = +dstr(w0).replace(/-/g, "") + (p.semilla || 0); const r = rng(seed);
  const pool = m => MEALS.map((x, i) => ({ ...x, i })).filter(x => x.m === m && (p.dieta !== "veg" || x.t.includes("veg")));
  const days = [];
  for (let d = 0; d < 7; d++) {
    const date = dstr(addDays(w0, d)); const meals = [];
    for (const m of ["desayuno", "comida", "merienda", "cena"]) {
      const P = pool(m); let pick = P[Math.floor(r() * P.length)]; const key = `${date}_${m}`;
      if (ov[key] != null && MEALS[ov[key]]) pick = { ...MEALS[ov[key]], i: ov[key] };
      const base = mealMacros(pick); const goal = T.kcal * REPARTO[m]; const k = Math.max(0.6, Math.min(1.8, goal / base.kcal));
      meals.push({ m, key, meal: pick, k: Math.round(k * 20) / 20, mac: mealMacros(pick, Math.round(k * 20) / 20) });
    }
    days.push({ date, meals });
  }
  return days;
}
let planDay = (new Date().getDay() + 6) % 7;
function nPlan(T) {
  const days = weekPlan(T); const d = days[planDay]; const tot = d.meals.reduce((s, x) => s + x.mac.kcal, 0);
  return `<div class="seg" style="justify-content:space-between">${days.map((x, i) => `<button data-pd="${i}" class="${i === planDay ? "on" : ""}" style="flex:1;padding:9px 0">${DIAS[i]}</button>`).join("")}</div>
  <p class="small mute" style="margin:0 2px 12px">≈ ${nf(tot)} kcal · raciones ajustadas a tu objetivo de ${nf(T.kcal)} kcal</p>
  ${d.meals.map(x => { const done = Object.values(state.com).some(c => c.plan === x.key); return `<div class="card"><h3><span class="small mute" style="text-transform:uppercase;letter-spacing:.8px">${MOMENTOS.find(m => m[0] === x.m)[1]}</span><span class="num" style="font-size:18px">${nf(x.mac.kcal)} kcal</span></h3>
    <div style="font-weight:700;font-size:16px;margin:-4px 0 8px">${esc(x.meal.n)}</div>
    <div class="small mute" style="line-height:1.6">${x.meal.ing.map(([n, g]) => `${esc(n.replace(/ \(.*\)/, ""))} <b style="color:var(--ink)">${Math.round(g * x.k / 5) * 5} g</b>`).join(" · ")}</div>
    <div class="small mute" style="margin-top:6px">P ${nf(x.mac.p)} g · C ${nf(x.mac.c)} g · G ${nf(x.mac.g)} g</div>
    <div class="row" style="margin-top:12px"><button class="btn sm" data-swap="${x.key}|${x.m}">${svg("refresh")}Cambiar</button><button class="btn sm ${done ? "" : "pri"}" data-eat="${planDay}|${x.m}" ${done ? "disabled" : ""}>${svg("check")}${done ? "Apuntado" : "Me lo he comido"}</button></div></div>`; }).join("")}
  <button class="btn block" id="shop">${svg("cart")}Lista de la compra de la semana</button>
  <button class="btn block" id="regen" style="margin-top:10px;color:var(--mute)">${svg("refresh")}Generar otro menú</button>
  <p class="tiny mute" style="text-align:center;margin-top:12px;line-height:1.5">Plan orientativo. Si tienes alguna condición médica, alergia o estás embarazada, consúltalo con un profesional.</p>`;
}
function nDatos(T) {
  const p = state.perfil.nutri;
  return `<div class="grid2"><div class="stat"><div class="k">${svg("flame")}Objetivo diario</div><div class="v num">${nf(T.kcal)}<small>kcal</small></div></div><div class="stat"><div class="k">${svg("bolt")}Gasto estimado</div><div class="v num">${nf(T.tdee)}<small>kcal</small></div></div>
    <div class="stat"><div class="k" style="color:var(--mute)">Proteína</div><div class="v num">${T.prot}<small>g</small></div></div><div class="stat"><div class="k" style="color:#0284c7">Carbohidratos</div><div class="v num">${T.carb}<small>g</small></div></div>
    <div class="stat"><div class="k" style="color:var(--mute)">Grasa</div><div class="v num">${T.fat}<small>g</small></div></div><div class="stat"><div class="k" style="color:var(--sky)">${svg("water")}Agua</div><div class="v num">${nf(T.agua * .25, 1)}<small>L</small></div></div></div>
  <div class="hint">${svg("info")}<span>Metabolismo basal ${nf(T.bmr)} kcal (fórmula Mifflin-St Jeor) × nivel de actividad. Objetivo: <b style="color:var(--ink)">${OBJ.find(o => o[0] === p.obj)[1].toLowerCase()}</b>${p.obj === "perder" ? " con un déficit moderado (~18 %), sin bajar nunca de tu basal" : p.obj === "ganar" ? " con un superávit suave (+300 kcal)" : ""}.</span></div>
  <button class="btn block" id="nEdit">${svg("edit")}Cambiar mis datos</button>`;
}
WIRE.nutricion = () => {
  $$("#nMo [data-m]").forEach(b => b.onclick = () => { nMom = b.dataset.m; render(); });
  const st = $("#nStart"); if (st) { st.onclick = () => openNutriSetup(); return; }
  $$("[data-t]").forEach(b => b.onclick = () => { nTab = b.dataset.t; render(); });
  $$("#nMo [data-m]").forEach(b => b.onclick = () => { nMom = b.dataset.m; render(); });
  if (nTab === "hoy") {
    $("#dPrev").onclick = () => { nDay = dstr(addDays(parseD(nDay), -1)); render(); };
    $("#dNext").onclick = () => { if (nDay < todayStr()) { nDay = dstr(addDays(parseD(nDay), 1)); render(); } };
    $$("[data-w]").forEach(b => b.onclick = () => { const i = +b.dataset.w; const cur = (state.dia[nDay] || {}).agua || 0; const v = i < cur ? i : i + 1; saveItem("dia", { ...(state.dia[nDay] || {}), id: nDay, fecha: nDay, agua: v }); render(); });
    $$("[data-addm]").forEach(b => b.onclick = () => openAddFood(b.dataset.addm));
    $$("[data-dc]").forEach(b => b.onclick = () => { delItem("com", b.dataset.dc); render(); });
  }
  if (nTab === "plan") {
    $$("[data-pd]").forEach(b => b.onclick = () => { planDay = +b.dataset.pd; render(); });
    $$("[data-swap]").forEach(b => b.onclick = () => openSwap(...b.dataset.swap.split("|")));
    $$("[data-eat]").forEach(b => b.onclick = () => { const [d, m] = b.dataset.eat.split("|"); const x = weekPlan(nutriTargets())[+d].meals.find(y => y.m === m);
      saveItem("com", { id: uid("c"), fecha: todayStr(), momento: m, nombre: x.meal.n, kcal: Math.round(x.mac.kcal), p: Math.round(x.mac.p), c: Math.round(x.mac.c), g: Math.round(x.mac.g), plan: x.key }); toast("Apuntado en tu diario de hoy"); render(); });
    $("#shop").onclick = openShopping;
    $("#regen").onclick = () => { savePerfil({ nutri: { ...state.perfil.nutri, semilla: ((state.perfil.nutri.semilla || 0) + 1) % 1000 }, planOv: {} }); toast("Menú nuevo generado"); render(); };
  }
  if (nTab === "datos") $("#nEdit").onclick = () => openNutriSetup();
};
function openSwap(key, m) {
  const p = state.perfil.nutri || {}; const opts = MEALS.map((x, i) => ({ ...x, i })).filter(x => x.m === m && (p.dieta !== "veg" || x.t.includes("veg")));
  openSheet("Cambiar plato", opts.map(x => `<button class="item" data-i="${x.i}"><div class="mi meal" style="border:0;padding:0"><div class="mi">${svg("food")}</div></div><div><div style="font-weight:600">${esc(x.n)}</div><div class="small mute">${x.t.includes("veg") ? "Vegetariano · " : ""}${nf(mealMacros(x).kcal)} kcal ración base</div></div></button>`).join(""),
    s => $$("[data-i]", s).forEach(b => b.onclick = () => { savePerfil({ planOv: { ...(state.perfil.planOv || {}), [key]: +b.dataset.i } }); closeSheet(); toast("Plato cambiado"); }));
}
function openShopping() {
  const tot = {}; weekPlan(nutriTargets()).forEach(d => d.meals.forEach(x => x.meal.ing.forEach(([n, g]) => { tot[n] = (tot[n] || 0) + g * x.k; })));
  const fmtQ = (n, g) => n.includes("Huevo") ? `${Math.ceil(g / 60)} uds.` : n.includes("Aceite") ? `${Math.round(g / 10)} cdas.` : g >= 1000 ? `${nf(g / 1000, 1)} kg` : `${Math.round(g / 10) * 10} g`;
  const got = state.perfil.compra || {};
  openSheet("Lista de la compra", `<p class="small mute" style="margin-bottom:10px">Para los 7 días de tu plan. Toca para tachar.</p>${Object.entries(tot).sort((a, b) => a[0].localeCompare(b[0])).map(([n, g]) => `<button class="item" data-sh="${esc(n)}" style="${got[n] ? "opacity:.4;text-decoration:line-through" : ""}"><span style="color:${got[n] ? "var(--volt)" : "var(--mute2)"}">${svg(got[n] ? "check" : "cart")}</span><span>${esc(n.replace(/ \(.*\)/, ""))}</span><span class="num" style="margin-left:auto;font-size:18px">${fmtQ(n, g)}</span></button>`).join("")}
    <button class="btn block" id="shCopy" style="margin-top:14px">Copiar lista</button>`, s => {
    $$("[data-sh]", s).forEach(b => b.onclick = () => { const n = b.dataset.sh; const c = { ...(state.perfil.compra || {}) }; c[n] = !c[n]; savePerfil({ compra: c }); b.style.opacity = c[n] ? .4 : 1; b.style.textDecoration = c[n] ? "line-through" : "none"; b.querySelector("span").innerHTML = svg(c[n] ? "check" : "cart"); b.querySelector("span").style.color = c[n] ? "var(--volt)" : "var(--mute2)"; });
    $("#shCopy", s).onclick = async () => { const t = "🛒 Lista de la compra (Pádel+)\n" + Object.entries(tot).map(([n, g]) => `- ${n.replace(/ \(.*\)/, "")}: ${fmtQ(n, g)}`).join("\n"); try { await navigator.clipboard.writeText(t); toast("Lista copiada"); } catch { toast("No se pudo copiar"); } };
  });
}
function openNutriSetup() {
  const p = { sexo: "h", edad: "", altura: "", peso: state.perfil.peso || "", act: 1.55, obj: "mantener", dieta: "todo", ...(state.perfil.nutri || {}) };
  openSheet("Tus datos", `
    <div class="field">Sexo<div class="seg" id="sx"><button data-v="h" class="${p.sexo === "h" ? "on" : ""}">Hombre</button><button data-v="m" class="${p.sexo === "m" ? "on" : ""}">Mujer</button></div></div>
    <div class="row"><label class="field">Edad<input id="nE" type="number" inputmode="numeric" value="${p.edad}" placeholder="28"></label><label class="field">Altura (cm)<input id="nA" type="number" inputmode="numeric" value="${p.altura}" placeholder="175"></label><label class="field">Peso (kg)<input id="nP" type="number" step="0.1" inputmode="decimal" value="${p.peso}" placeholder="72"></label></div>
    <div class="field">Nivel de actividad<div id="ac">${ACT_LV.map(([v, n, d]) => `<button class="item" data-v="${v}" style="${+p.act === v ? "color:var(--vt)" : ""}"><span style="width:20px">${+p.act === v ? svg("check") : ""}</span><div><div style="font-weight:600">${n}</div><div class="small mute">${d}</div></div></button>`).join("")}</div></div>
    <div class="field">Objetivo<div class="seg" id="ob">${OBJ.map(([v, n]) => `<button data-v="${v}" class="${p.obj === v ? "on" : ""}">${n}</button>`).join("")}</div></div>
    <div class="field">Alimentación<div class="seg" id="di"><button data-v="todo" class="${p.dieta !== "veg" ? "on" : ""}">Como de todo</button><button data-v="veg" class="${p.dieta === "veg" ? "on" : ""}">Vegetariana</button></div></div>
    <div class="err" id="nErr"></div><button class="btn hot block" id="nOk">Calcular mi plan</button>`, s => {
    const seg = (id, k) => $$(`#${id} [data-v]`, s).forEach(b => b.onclick = () => { p[k] = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v; $$(`#${id} [data-v]`, s).forEach(x => { x.classList.toggle("on", x === b); if (id === "ac") { x.style.color = x === b ? "var(--volt)" : ""; x.querySelector("span").innerHTML = x === b ? svg("check") : ""; } }); });
    seg("sx", "sexo"); seg("ac", "act"); seg("ob", "obj"); seg("di", "dieta");
    $("#nOk", s).onclick = () => {
      p.edad = +$("#nE", s).value; p.altura = +$("#nA", s).value; p.peso = parseFloat(String($("#nP", s).value).replace(",", "."));
      if (!(p.edad >= 14 && p.edad <= 100) || !(p.altura > 120 && p.altura < 230) || !(p.peso > 30 && p.peso < 300)) { $("#nErr", s).textContent = "Revisa edad, altura y peso."; return; }
      if (p.edad < 18) { $("#nErr", s).textContent = ""; }
      const upd = { nutri: p, peso: p.peso }; savePerfil(upd);
      if (!Object.values(state.peso).length) saveItem("peso", { id: "p" + todayStr(), fecha: todayStr(), kg: p.peso });
      nTab = "datos"; closeSheet(); setView("nutricion"); toast("¡Tu plan está listo!");
    };
  });
}
function openAddFood(momento) {
  let q = "";
  const list = () => { const ql = q.toLowerCase(); const meals = MEALS.filter(m => !ql || m.n.toLowerCase().includes(ql)).slice(0, ql ? 8 : 0); const foods = FOODS.filter(f => !ql || f[0].toLowerCase().includes(ql)).slice(0, ql ? 30 : 40);
    const recent = []; if (!ql) { const seen = new Set(); for (const c of Object.values(state.com).sort((a, b) => (b.creado || 0) - (a.creado || 0))) { if (seen.has(c.nombre)) continue; seen.add(c.nombre); recent.push(c); if (recent.length >= 5) break; } }
    return (recent.length ? `<div class="sec" style="margin-top:6px">Recientes</div>${recent.map((c, i) => `<button class="item" data-rc="${i}"><span style="color:var(--hot)">${svg("refresh")}</span><div><div style="font-weight:600">${esc(c.nombre)}</div><div class="small mute">${nf(c.kcal)} kcal</div></div>${svg("plus", "chev")}</button>`).join("")}` : "")
      + (meals.length ? `<div class="sec">Platos</div>${meals.map(m => `<button class="item" data-ml="${MEALS.indexOf(m)}"><span style="color:var(--hot)">${svg("food")}</span><div><div style="font-weight:600">${esc(m.n)}</div><div class="small mute">${nf(mealMacros(m).kcal)} kcal</div></div>${svg("plus", "chev")}</button>`).join("")}` : "")
      + `<div class="sec">Alimentos</div>${foods.map(f => `<button class="item" data-fd="${FOODS.indexOf(f)}"><div><div style="font-weight:600">${esc(f[0])}</div><div class="small mute">${f[1]} kcal / 100 g · ración ${f[5]} g</div></div>${svg("plus", "chev")}</button>`).join("")}`
      + `<button class="btn block" id="fManual" style="margin-top:12px">${svg("edit")}Apuntar a mano (kcal y macros)</button>`;
  };
  const wire = s => {
    const R = Object.values(state.com).sort((a, b) => (b.creado || 0) - (a.creado || 0)); const seen = new Set(); const recent = R.filter(c => !seen.has(c.nombre) && seen.add(c.nombre)).slice(0, 5);
    $$("[data-rc]", s).forEach(b => b.onclick = () => { const c = recent[+b.dataset.rc]; addCom(momento, { nombre: c.nombre, gr: c.gr, kcal: c.kcal, p: c.p, c: c.c, g: c.g }); });
    $$("[data-ml]", s).forEach(b => b.onclick = () => { const m = MEALS[+b.dataset.ml]; const x = mealMacros(m); addCom(momento, { nombre: m.n, kcal: x.kcal, p: x.p, c: x.c, g: x.g }); });
    $$("[data-fd]", s).forEach(b => b.onclick = () => openGrams(momento, FOODS[+b.dataset.fd]));
    $("#fManual", s).onclick = () => openManualFood(momento);
  };
  openSheet(`Añadir · ${MOMENTOS.find(m => m[0] === momento)[1]}`, `<label class="field" style="position:sticky;top:-10px;background:var(--bg2);z-index:2;padding-top:4px"><input id="fq" placeholder="Busca: pollo, avena, pizza…" autocomplete="off"></label><div id="fl">${list()}</div>`, s => {
    wire(s); $("#fq", s).oninput = e => { q = e.target.value.trim(); $("#fl", s).innerHTML = list(); wire(s); };
  });
}
function openGrams(momento, f) {
  openSheet(esc(f[0]), `<label class="field">Cantidad (g)<input id="gG" type="number" inputmode="numeric" value="${f[5]}"></label><div id="gM" class="grid2" style="margin-bottom:14px"></div><button class="btn pri block" id="gOk">Añadir</button>`, s => {
    const upd = () => { const g = +$("#gG", s).value || 0, k = g / 100; $("#gM", s).innerHTML = [["Calorías", f[1] * k, "kcal"], ["Proteína", f[2] * k, "g"], ["Carbohidratos", f[3] * k, "g"], ["Grasa", f[4] * k, "g"]].map(([n, v, u]) => `<div class="stat"><div class="k">${n}</div><div class="v num" style="font-size:24px">${nf(v)}<small>${u}</small></div></div>`).join(""); };
    upd(); $("#gG", s).oninput = upd;
    $("#gOk", s).onclick = () => { const g = +$("#gG", s).value; if (!(g > 0)) return; const k = g / 100; addCom(momento, { nombre: f[0], gr: g, kcal: f[1] * k, p: f[2] * k, c: f[3] * k, g: f[4] * k }); };
  });
}
function openManualFood(momento) {
  openSheet("Apuntar a mano", `<label class="field">Qué has comido<input id="mfN" maxlength="60" placeholder="Menú del día"></label><div class="row"><label class="field">Calorías<input id="mfK" type="number" inputmode="numeric"></label><label class="field">Proteína (g)<input id="mfP" type="number" inputmode="numeric"></label></div><div class="row"><label class="field">Carbohidratos (g)<input id="mfC" type="number" inputmode="numeric"></label><label class="field">Grasa (g)<input id="mfG" type="number" inputmode="numeric"></label></div><button class="btn pri block" id="mfOk">Añadir</button>`,
    s => $("#mfOk", s).onclick = () => { const k = +$("#mfK", s).value; if (!(k > 0)) { toast("Pon las calorías"); return; } addCom(momento, { nombre: $("#mfN", s).value.trim() || "Comida", kcal: k, p: +$("#mfP", s).value || 0, c: +$("#mfC", s).value || 0, g: +$("#mfG", s).value || 0 }); });
}
function addCom(momento, o) {
  saveItem("com", { id: uid("c"), fecha: nDay, momento, nombre: o.nombre, gr: o.gr || null, kcal: Math.round(o.kcal), p: Math.round(o.p), c: Math.round(o.c), g: Math.round(o.g), creado: Date.now() });
  closeSheet(); toast(`${o.nombre} añadido`);
}
