// ===== Pádel+ · Catálogo real de Padel Market (data/catalogo.json, se actualiza cada noche) =====
let CAT = null, CATBY = {}, catLoading = null;
// Copia guardada en el móvil: así la primera pantalla sale ya con fotos y precios, sin parpadeos
try { const c = JSON.parse(localStorage.getItem("pm-cat") || "null"); if (c && c.p) { CAT = c; CATBY = Object.fromEntries(c.p.map(p => [p.i, p])); } } catch {}
const eur = n => n == null ? "" : n.toLocaleString("es-ES", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + " €";
function loadCatalogo() {
  if (catLoading) return catLoading;
  const had = !!CAT, oldT = CAT && CAT.t;
  catLoading = fetch("data/catalogo.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : null).then(d => {
    if (!d || !d.p) return CAT; if (d.t === oldT) return CAT;
    CAT = d; CATBY = Object.fromEntries(d.p.map(p => [p.i, p]));
    try { localStorage.setItem("pm-cat", JSON.stringify(d)); } catch {}
    // Si ya se veía la tienda con datos, no redibujamos Inicio (evita el salto); la tienda sí se refresca
    if (typeof view !== "undefined" && !sheetOpen && (!had ? ["material", "inicio"].includes(view) : view === "material")) render();
    return d;
  }).catch(() => CAT);
  return catLoading;
}
// Producto real enlazado a una de nuestras fichas
function realOf(g) { return CAT && g && CAT.match && CATBY[CAT.match[g.id]] || null; }
function dto(p) { return p.o && p.o > p.p ? Math.round((1 - p.p / p.o) * 100) : 0; }
function precioReal(p) { return `<span class="num" style="color:var(--ink)">${eur(p.p)}</span>${p.o ? ` <s class="tiny mute">${eur(p.o)}</s>` : ""}${dto(p) >= 5 ? ` <span class="dtob">-${dto(p)}%</span>` : ""}`; }
function fotoUrl(u, size) { return /cdn\.shopify\.com/.test(u) ? u + (u.includes("?") ? "&" : "?") + "width=" + Math.min(600, Math.ceil(size * 2.5 / 50) * 50) : u; }
function fotoReal(p, size) { return `<img src="${esc(fotoUrl(p.f, size))}" alt="${esc(p.n)}" decoding="async" referrerpolicy="no-referrer" style="width:${size}px;height:${size}px;object-fit:contain;background:#fff;border-radius:14px" onerror="this.style.visibility='hidden'">`; }
// Precarga las fotos que se ven nada más entrar (para que la pantalla aparezca ya completa)
function fotosListas(root, max) { const imgs = [...(root || document).querySelectorAll("img")].slice(0, 8).filter(i => !i.complete); return imgs.length ? Promise.race([Promise.all(imgs.map(i => new Promise(r => { i.addEventListener("load", r, { once: true }); i.addEventListener("error", r, { once: true }); }))), new Promise(r => setTimeout(r, max))]) : Promise.resolve(); }

// ---------- Tienda (en Material) ----------
let tdCat = "pala", tdQ = "", tdOrden = "top", tdN = 30, tdGen = "";
const TD_CATS = [["pala", "Palas"], ["zapa", "Zapatillas"], ["ropa", "Ropa"], ["acces", "Accesorios"]];
function tiendaHTML(fija) {
  if (fija) tdCat = fija;
  if (!CAT) { loadCatalogo(); return `<div class="card empty"><p>${catLoading ? "Cargando el catálogo de Padel Market…" : "El catálogo se está preparando. Vuelve en un rato."}</p></div>`; }
  const qs = norm2(tdQ).split(/\s+/).filter(Boolean);
  const kidQ = /\bjr\b|junior|nin|kid/.test(norm2(tdQ));
  let L = CAT.p.filter(p => p.c === tdCat && !p.x && (!tdGen || p.g === tdGen) && (kidQ || tdCat === "pala" || !/\bjr\b|junior|nino|nina|kids/.test(norm2(p.n))) && (!qs.length || (s => qs.every(w => s.includes(w)))(norm2(`${p.m} ${p.n}`))));
  const TOPM = ["nox", "bullpadel", "adidas", "head", "babolat", "siux", "starvie", "star vie", "wilson", "black crown", "kombat", "drop shot", "asics"];
  const rec = new Set(Object.values(CAT.match || {}));
  const score = p => (rec.has(p.i) ? 100 : 0) + (dto(p) * 2) + (TOPM.some(m => norm2(p.m || p.n).startsWith(m)) ? 20 : 0) + (/\bjr\b|junior|nino|nina|kids/.test(norm2(p.n)) ? -40 : 0) + Math.min(10, p.p / 30);
  L.sort(tdOrden === "barato" ? (a, b) => a.p - b.p : tdOrden === "caro" ? (a, b) => b.p - a.p : tdOrden === "oferta" ? (a, b) => dto(b) - dto(a) || a.p - b.p : (a, b) => score(b) - score(a));
  const tot = L.length; L = L.slice(0, tdN);
  return `${fija ? "" : `<div class="card" style="padding:12px;border-color:rgba(132,204,22,.3)"><div style="display:flex;gap:10px;align-items:center"><span style="font-size:22px">🛒</span><div style="flex:1"><div style="font-weight:800">Tienda Pádel+</div><div class="tiny mute">${CAT.p.length.toLocaleString("es-ES")} productos de ${esc(CAT.tienda)} · precios de hoy</div></div></div></div>
    <div class="seg" id="tdC" style="margin:4px 0 10px">${TD_CATS.map(([k, n]) => `<button data-c="${k}" class="${tdCat === k ? "on" : ""}">${n}</button>`).join("")}</div>`}
    <div class="row" style="gap:8px;margin-bottom:10px"><label class="field" style="margin:0;flex:1"><input id="tdQ" value="${esc(tdQ)}" placeholder="Busca marca o modelo (ej. Bullpadel)" style="margin:0" enterkeyhint="search"></label>
      <select id="tdO" style="flex:0 0 auto;width:auto;margin:0;padding:0 10px;border-radius:14px;background:var(--card2);color:var(--ink);border:1px solid var(--line2)"><option value="top" ${tdOrden === "top" ? "selected" : ""}>Destacadas</option>${CAT.p.some(p => p.o) ? `<option value="oferta" ${tdOrden === "oferta" ? "selected" : ""}>Ofertas</option>` : ""}<option value="barato" ${tdOrden === "barato" ? "selected" : ""}>Más barato</option><option value="caro" ${tdOrden === "caro" ? "selected" : ""}>Más caro</option></select></div>
    ${tdCat === "ropa" || tdCat === "zapa" ? `<div class="seg" id="tdG" style="margin-bottom:10px">${[["", "Todo"], ["m", "Mujer"], ["h", "Hombre"]].map(([k, n]) => `<button data-g="${k}" class="${tdGen === k ? "on" : ""}">${n}</button>`).join("")}</div>` : ""}
    <p class="tiny mute" style="margin:0 2px 8px">${tot.toLocaleString("es-ES")} resultados</p>
    <div class="tdgrid">${L.map(p => `<a class="tdcard" href="${esc(p.u)}" target="_blank" rel="noopener sponsored" data-out="${esc(p.i)}">
      <div class="tdimg">${fotoReal(p, 130)}${dto(p) >= 5 ? `<span class="dtob" style="position:absolute;top:8px;left:8px">-${dto(p)}%</span>` : ""}</div>
      <div class="tiny mute" style="margin-top:8px">${esc(p.m || "")}</div><div class="tdname">${esc(limpiaNombre(p.n, p.m))}</div>
      <div style="margin-top:4px"><span class="num" style="color:var(--ink);font-size:17px">${eur(p.p)}</span>${p.o ? ` <s class="tiny mute">${eur(p.o)}</s>` : ""}</div><span class="buyrow" style="margin-top:8px;justify-content:center">${svg("cart")}Comprar</span></a>`).join("")}</div>
    ${tot > tdN ? `<button class="btn block" id="tdMas" style="margin-top:10px">Ver más</button>` : ""}
    <p class="tiny mute" style="text-align:center;margin:12px 0 4px">🤝 Enlaces de afiliado: si compras, Pádel+ recibe una comisión sin coste para ti. Precios y stock de ${esc(CAT.tienda)}, actualizados a diario.</p>`;
}
function ropaTopHTML(g, n) {
  if (!CAT) return "";
  const gg = g === "mujer" ? "m" : g === "hombre" ? "h" : "";
  const TOPM = ["nox", "bullpadel", "adidas", "head", "babolat", "siux", "joma", "drop shot", "black crown", "kombat"];
  const L = CAT.p.filter(p => p.c === "ropa" && !p.x && (!gg || p.g === gg) && !/\bjr\b|junior|nino|nina|kids/.test(norm2(p.n)))
    .sort((a, b) => (dto(b) * 2 + (TOPM.some(m => norm2(b.m || b.n).startsWith(m)) ? 20 : 0)) - (dto(a) * 2 + (TOPM.some(m => norm2(a.m || a.n).startsWith(m)) ? 20 : 0))).slice(0, n || 4);
  return L.length ? `<div class="tdgrid">${L.map(p => `<a class="tdcard" href="${esc(p.u)}" target="_blank" rel="noopener sponsored"><div class="tdimg">${fotoReal(p, 120)}${dto(p) >= 5 ? `<span class="dtob" style="position:absolute;top:8px;left:8px">-${dto(p)}%</span>` : ""}</div><div class="tiny mute" style="margin-top:8px">${esc(p.m || "")}</div><div class="tdname">${esc(limpiaNombre(p.n, p.m))}</div><div style="margin-top:4px"><span class="num" style="color:var(--ink);font-size:17px">${eur(p.p)}</span>${p.o ? ` <s class="tiny mute">${eur(p.o)}</s>` : ""}</div><span class="buyrow" style="margin-top:8px;justify-content:center">${svg("cart")}Comprar</span></a>`).join("")}</div>` : "";
}
function wireTienda(root) {
  $$("#tdC [data-c]", root).forEach(b => b.onclick = () => { tdCat = b.dataset.c; tdN = 30; tdGen = ""; render(); });
  $$("#tdG [data-g]", root).forEach(b => b.onclick = () => { tdGen = b.dataset.g; tdN = 30; render(); });
  const q = $("#tdQ", root); if (q) { let t; q.oninput = () => { clearTimeout(t); t = setTimeout(() => { tdQ = q.value; tdN = 30; render(); setTimeout(() => { const n = $("#tdQ"); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 0); }, 350); }; }
  const o = $("#tdO", root); if (o) o.onchange = () => { tdOrden = o.value; render(); };
  const m = $("#tdMas", root); if (m) m.onclick = () => { tdN += 30; render(); };
}
const norm2 = s => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const limpiaNombre = (n, m) => { let s = n.replace(/\s*\((pala|zapatillas?|racket|ropa)\)\s*$/i, ""); if (m && norm2(s).startsWith(norm2(m) + " ")) s = s.slice(m.length + 1); return s; };

// ---------- Bloque de tienda en Inicio ----------
function inicioTiendaHTML(palas) {
  // Siempre un producto que se pueda comprar y con foto real (el mejor de los recomendados que esté en la tienda)
  const conFoto = l => { l = Array.isArray(l) ? l : [l]; return l.slice(0, 12).find(x => x && x.s && realOf(x.s)) || l[0]; };
  const pala = conFoto(palas);
  const zp = typeof recZP === "function" ? conFoto(recZP({ pista: "arena", frec: 2, horma: "normal", kg: Math.round(weightKg()), precio: 0 }) || []) : null;
  const picks = [pala && pala.s, zp && zp.s].filter(Boolean);
  const card = (g, lbl) => { const r = realOf(g); return `<button class="hpick" data-gear="${g.id}"><div class="tdimg" style="height:118px">${r ? fotoReal(r, 110) : CAT ? gearArt(g, 90) : ""}${r && dto(r) >= 5 ? `<span class="dtob" style="position:absolute;top:6px;left:6px">-${dto(r)}%</span>` : ""}</div>
    <div class="tiny" style="color:var(--vt);font-weight:800;margin-top:8px">${lbl}</div><div class="tdname" style="min-height:0">${esc(g.marca)} ${esc(g.modelo)}</div>
    <div style="margin-top:4px">${r ? `<span class="num" style="color:var(--ink);font-size:17px">${eur(r.p)}</span>${r.o ? ` <s class="tiny mute">${eur(r.o)}</s>` : ""}` : `<span class="small mute">${priceTxt(g)}</span>`}</div>
    <span class="buyrow" data-buy="${g.id}" style="margin-top:8px;justify-content:center">${svg("cart")}Comprar</span></button>`; };
  const ofertas = CAT ? CAT.p.filter(p => p.c === "pala" && !p.x && dto(p) >= 15 && !/\bjr\b|junior|nino|nina/.test(norm2(p.n))).sort((a, b) => dto(b) - dto(a)).slice(0, 10) : [];
  return `<div class="card" style="padding:16px 14px">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><div><h3 style="margin:0">${svg("target")}Elegido para ti</h3><p class="tiny mute" style="margin-top:3px">Según tu nivel${state.perfil.padel && state.perfil.padel.nivel0 ? "" : " (haz el test para afinar)"} · cómpralo aquí</p></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">${card(picks[0] || PALAS[0], "TU PALA")}${picks[1] ? card(picks[1], "TUS ZAPATILLAS") : ""}</div>
    <div class="row" style="gap:8px;margin-top:12px"><button class="btn sm" id="hRec" style="flex:1">${svg("target")}Afinar a mi juego</button><button class="btn sm" id="hShop" style="flex:1;background:var(--ink);color:#fff;border:0">${svg("cart")}Ir a la tienda</button></div></div>
  <a class="gbanner" href="guia.html"><span class="gi">🎾</span><span><small>Guía 2026</small><b>¿Qué pala de pádel me compro?</b><span class="s">Las mejores por nivel, con fotos y precio de hoy</span></span><span class="ar">→</span></a>
  <button class="lgbanner" id="hLiga"><span class="gi">🏆</span><span><b>Crea tu liga con amigos</b><span class="s">Ranking propio, muro y pique semanal</span></span><span class="ar">→</span></button>
  ${ofertas.length ? `<div class="sec" style="display:flex;justify-content:space-between;align-items:center">${(() => { const d = new Date(), m = d.getMonth(), n = d.getDate(); return m === 10 && n >= 24 && n <= 30 ? (n >= 27 ? "🖤 Black Friday en palas" : "🔥 Ofertas Black Friday") : m === 11 && n >= 10 && n <= 24 ? "🎁 Ofertas para regalar" : "🔥 Ofertas en palas"; })()}<button class="tiny" id="hOfAll" style="color:var(--vt);font-weight:700;text-transform:none;letter-spacing:0">Ver todas</button></div>
    <div class="hscroll">${ofertas.map(p => `<a class="tdcard" href="${esc(p.u)}" target="_blank" rel="noopener sponsored" style="flex:0 0 150px"><div class="tdimg" style="height:120px">${fotoReal(p, 110)}<span class="dtob" style="position:absolute;top:6px;left:6px">-${dto(p)}%</span></div>
      <div class="tdname" style="margin-top:8px;font-size:13px">${esc(limpiaNombre(p.n, ""))}</div><div><span class="num" style="color:var(--ink)">${eur(p.p)}</span> <s class="tiny mute">${eur(p.o)}</s></div></a>`).join("")}</div>` : ""}`;
}
const TOPMARCAS = ["bullpadel", "nox", "adidas", "head", "babolat", "siux", "star vie", "starvie", "black crown", "wilson", "drop shot", "kombat", "joma", "asics", "mizuno"];
const esTop = p => TOPMARCAS.some(m => norm2(p.m || p.n).startsWith(m));
const sinNino = p => !/\bjr\b|junior|nino|nina|kids/.test(norm2(p.n));
function escaparate(cat, n, off) { if (!CAT) return []; return CAT.p.filter(p => p.c === cat && !p.x && p.f && sinNino(p) && !p.n.includes(" + ")).sort((a, b) => ((esTop(b) ? 30 : 0) + dto(b)) - ((esTop(a) ? 30 : 0) + dto(a))).slice(off || 0, (off || 0) + n); }
// ===== Inicio elegante (opción A): cartel del recomendador + 4 accesos + ofertas/guía/liga =====
function inicioHomeHTML() {
  const sv = typeof rpSaved === "function" ? rpSaved() : null;
  let top = null; if (sv && typeof rpScore === "function") { try { top = rpScore({ ...sv, extras: new Set(sv.extras || []) }).list[0]; } catch {} }
  const palaSvg = (document.querySelector("#goPala svg") || {}).outerHTML || "🎾";
  const hero = top ? `<div class="hhero"><small>TU PALA IDEAL</small>
      <div class="hhrow"><div class="hhimg">${top.r ? fotoReal(top.r, 84) : palaArt(top.s, 70)}</div><div style="flex:1;min-width:0"><div class="hhm">${esc(top.s.marca)}</div><div class="hhn">${esc(top.s.modelo)}</div><div class="hhp"><b>${top.pct}% para ti</b>${top.r ? ` · ${eur(top.r.p)}` : ""}</div></div></div>
      <div class="hhbt"><button class="b1" id="hMis">Ver mis palas</button><button class="b2" id="hRe">Cambiar mis respuestas</button></div></div>`
    : (() => { const f = escaparate("pala", 1)[0]; return `<div class="hhero hhnew"><div style="flex:1;min-width:0"><small>TU PALA IDEAL</small><h2>¿Qué pala es la tuya?</h2><p>6 preguntas, 1 minuto. Con el precio de hoy.</p></div>${f ? `<div class="hhimg big">${fotoReal(f, 110)}</div>` : ""}<div class="hhbt" style="flex-basis:100%"><button class="b1" id="hRe">Descubrir mi pala</button></div></div>`; })();
  const of = CAT ? CAT.p.filter(p => p.c === "pala" && !p.x && dto(p) >= 15) : [];
  const maxd = of.reduce((m, p) => Math.max(m, dto(p)), 0);
  const ofTit = (() => { const d = new Date(), m = d.getMonth(), n = d.getDate(); return m === 10 && n >= 24 && n <= 30 ? "Ofertas Black Friday" : m === 11 && n >= 10 && n <= 24 ? "Ofertas para regalar" : "Ofertas de la semana"; })();
  return `${hero}
    <div class="sec">Equípate</div>
    <div class="hgrid">${[["palas", "pala", "Palas", "Por nivel y juego", palaSvg], ["zpadel", "zapa", "Zapatillas", "Suela, horma y peso", "👟"], ["outfits", "ropa", "Ropa", "Mujer y hombre", "👕"], ["acces", "acces", "Accesorios", "Paleteros, grips…", "🎒"]].map(([seg, cat, tit, sub, ic]) => { const f = escaparate(cat, 1, cat === "pala" ? 3 : 0)[0]; return `<button data-hg="${seg}"><span class="hgimg">${f ? fotoReal(f, 96) : `<span class="pe">${ic}</span>`}</span><b>${tit}</b><small>${sub}</small></button>`; }).join("")}</div>
    ${CAT ? `<div class="sec" style="display:flex;justify-content:space-between;align-items:center"><span>Selección de la semana</span><button class="link tiny" id="hSelAll" style="font-size:13px">Ver tienda</button></div>
    <div class="hsel">${[...escaparate("pala", 4), ...escaparate("zapa", 2), ...escaparate("pala", 2, 4)].map(p => `<a class="hsi" href="${esc(p.u)}" target="_blank" rel="noopener sponsored"><span class="hsimg">${fotoReal(p, 130)}${dto(p) >= 5 ? `<span class="hsd">-${dto(p)}%</span>` : ""}</span><span class="hsm">${esc(p.m || "")}</span><span class="hsn">${esc(limpiaNombre(p.n, p.m))}</span><span class="hsp"><b>${eur(p.p)}</b>${p.o && p.o > p.p ? ` <s>${eur(p.o)}</s>` : ""}</span></a>`).join("")}</div>` : ""}
    ${maxd ? `<button class="hof" id="hOfAll"><span><b>${ofTit}</b><small>Palas hasta -${maxd}%, actualizado cada día</small></span><span class="ar">→</span></button>` : ""}
    <a class="gbanner" href="guia.html"><span class="gi">🎾</span><span><small>Guía 2026</small><b>¿Qué pala de pádel me compro?</b><span class="s">Las mejores por nivel, con fotos y precio de hoy</span></span><span class="ar">→</span></a>
    <button class="lgbanner" id="hLiga"><span class="gi">🏆</span><span><b>Crea tu liga con amigos</b><span class="s">Ranking propio, muro y pique semanal</span></span><span class="ar">→</span></button>`;
}
function wireInicioTienda() {
  $$("[data-hg]").forEach(b => b.onclick = () => { gearSeg = b.dataset.hg; setView("material"); window.scrollTo(0, 0); });
  { const e = $("#hMis"); if (e) e.onclick = () => { const s = rpSaved(); rpQ = { ...s, extras: new Set(s.extras || []) }; rpResultados(); }; }
  { const e = $("#hRe"); if (e) e.onclick = () => openRecPala(); }
  { const e = $("#hSelAll"); if (e) e.onclick = () => { gearSeg = "tienda"; tdCat = "pala"; setView("material"); window.scrollTo(0, 0); }; }
  const v = $("#view"); if (typeof wireGearRows === "function") wireGearRows(v);
  const on = (id, f) => { const e = $(id); if (e) e.onclick = f; };
  on("#hLiga", () => { padelTab = "ligas"; setView("padel"); }); on("#hRec", () => { gearSeg = "palas"; openRecPala(); }); on("#hShop", () => { gearSeg = "tienda"; tdCat = "pala"; setView("material"); });
  on("#hOfAll", () => { gearSeg = "tienda"; tdCat = "pala"; tdOrden = "oferta"; setView("material"); });
}
