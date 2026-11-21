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
function precioReal(p) { return `<span class="num" style="color:#facc15">${eur(p.p)}</span>${p.o ? ` <s class="tiny mute">${eur(p.o)}</s>` : ""}${dto(p) >= 5 ? ` <span class="dtob">-${dto(p)}%</span>` : ""}`; }
function fotoReal(p, size) { return `<img src="${esc(p.f)}" alt="${esc(p.n)}" decoding="async" referrerpolicy="no-referrer" style="width:${size}px;height:${size}px;object-fit:contain;background:#fff;border-radius:14px;opacity:0;transition:opacity .25s" onload="this.style.opacity=1" onerror="this.style.visibility='hidden'">`; }

// ---------- Tienda (en Material) ----------
let tdCat = "pala", tdQ = "", tdOrden = "top", tdN = 30, tdGen = "";
const TD_CATS = [["pala", "Palas"], ["zapa", "Zapatillas"], ["ropa", "Ropa"], ["acces", "Accesorios"]];
function tiendaHTML() {
  if (!CAT) { loadCatalogo(); return `<div class="card empty"><p>${catLoading ? "Cargando el catálogo de Padel Market…" : "El catálogo se está preparando. Vuelve en un rato."}</p></div>`; }
  const qs = norm2(tdQ).split(/\s+/).filter(Boolean);
  let L = CAT.p.filter(p => p.c === tdCat && !p.x && (!tdGen || p.g === tdGen) && (!qs.length || (s => qs.every(w => s.includes(w)))(norm2(`${p.m} ${p.n}`))));
  const TOPM = ["nox", "bullpadel", "adidas", "head", "babolat", "siux", "starvie", "star vie", "wilson", "black crown", "kombat", "drop shot", "asics"];
  const rec = new Set(Object.values(CAT.match || {}));
  const score = p => (rec.has(p.i) ? 100 : 0) + (dto(p) * 2) + (TOPM.some(m => norm2(p.m || p.n).startsWith(m)) ? 20 : 0) + (/\bjr\b|junior|nino|nina|kids/.test(norm2(p.n)) ? -40 : 0) + Math.min(10, p.p / 30);
  L.sort(tdOrden === "barato" ? (a, b) => a.p - b.p : tdOrden === "caro" ? (a, b) => b.p - a.p : tdOrden === "oferta" ? (a, b) => dto(b) - dto(a) || a.p - b.p : (a, b) => score(b) - score(a));
  const tot = L.length; L = L.slice(0, tdN);
  return `<div class="card" style="padding:12px;border-color:rgba(250,204,21,.3)"><div style="display:flex;gap:10px;align-items:center"><span style="font-size:22px">🛒</span><div style="flex:1"><div style="font-weight:800">Tienda Pádel+</div><div class="tiny mute">${CAT.p.length.toLocaleString("es-ES")} productos de ${esc(CAT.tienda)} · precios de hoy</div></div></div></div>
    <div class="seg" id="tdC" style="margin:4px 0 10px">${TD_CATS.map(([k, n]) => `<button data-c="${k}" class="${tdCat === k ? "on" : ""}">${n}</button>`).join("")}</div>
    <div class="row" style="gap:8px;margin-bottom:10px"><label class="field" style="margin:0;flex:1"><input id="tdQ" value="${esc(tdQ)}" placeholder="Busca marca o modelo (ej. Bullpadel)" style="margin:0" enterkeyhint="search"></label>
      <select id="tdO" style="flex:0 0 auto;width:auto;margin:0;padding:0 10px;border-radius:14px;background:var(--card2);color:var(--ink);border:1px solid var(--line2)"><option value="top" ${tdOrden === "top" ? "selected" : ""}>Destacadas</option>${CAT.p.some(p => p.o) ? `<option value="oferta" ${tdOrden === "oferta" ? "selected" : ""}>Ofertas</option>` : ""}<option value="barato" ${tdOrden === "barato" ? "selected" : ""}>Más barato</option><option value="caro" ${tdOrden === "caro" ? "selected" : ""}>Más caro</option></select></div>
    ${tdCat === "ropa" || tdCat === "zapa" ? `<div class="seg" id="tdG" style="margin-bottom:10px">${[["", "Todo"], ["m", "Mujer"], ["h", "Hombre"]].map(([k, n]) => `<button data-g="${k}" class="${tdGen === k ? "on" : ""}">${n}</button>`).join("")}</div>` : ""}
    <p class="tiny mute" style="margin:0 2px 8px">${tot.toLocaleString("es-ES")} resultados</p>
    <div class="tdgrid">${L.map(p => `<a class="tdcard" href="${esc(p.u)}" target="_blank" rel="noopener sponsored" data-out="${esc(p.i)}">
      <div class="tdimg">${fotoReal(p, 130)}${dto(p) >= 5 ? `<span class="dtob" style="position:absolute;top:8px;left:8px">-${dto(p)}%</span>` : ""}</div>
      <div class="tiny mute" style="margin-top:8px">${esc(p.m || "")}</div><div class="tdname">${esc(limpiaNombre(p.n, p.m))}</div>
      <div style="margin-top:4px"><span class="num" style="color:#facc15;font-size:17px">${eur(p.p)}</span>${p.o ? ` <s class="tiny mute">${eur(p.o)}</s>` : ""}</div><span class="buyrow" style="margin-top:8px;justify-content:center">${svg("cart")}Comprar</span></a>`).join("")}</div>
    ${tot > tdN ? `<button class="btn block" id="tdMas" style="margin-top:10px">Ver más</button>` : ""}
    <p class="tiny mute" style="text-align:center;margin:12px 0 4px">🤝 Enlaces de afiliado: si compras, Pádel+ recibe una comisión sin coste para ti. Precios y stock de ${esc(CAT.tienda)}, actualizados a diario.</p>`;
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
function inicioTiendaHTML(pala) {
  const zp = typeof recZP === "function" ? (recZP({ pista: "arena", frec: 2, horma: "normal", kg: Math.round(weightKg()), precio: 0 }) || [])[0] : null;
  const picks = [pala && pala.s, zp && zp.s].filter(Boolean);
  const card = (g, lbl) => { const r = realOf(g); return `<button class="hpick" data-gear="${g.id}"><div class="tdimg" style="height:118px">${r ? fotoReal(r, 110) : CAT ? gearArt(g, 90) : ""}${r && dto(r) >= 5 ? `<span class="dtob" style="position:absolute;top:6px;left:6px">-${dto(r)}%</span>` : ""}</div>
    <div class="tiny" style="color:#facc15;font-weight:800;margin-top:8px">${lbl}</div><div class="tdname" style="min-height:0">${esc(g.marca)} ${esc(g.modelo)}</div>
    <div style="margin-top:4px">${r ? `<span class="num" style="color:#facc15;font-size:17px">${eur(r.p)}</span>${r.o ? ` <s class="tiny mute">${eur(r.o)}</s>` : ""}` : `<span class="small mute">${priceTxt(g)}</span>`}</div>
    <span class="buyrow" data-buy="${g.id}" style="margin-top:8px;justify-content:center">${svg("cart")}Comprar</span></button>`; };
  const ofertas = CAT ? CAT.p.filter(p => p.c === "pala" && !p.x && dto(p) >= 15 && !/\bjr\b|junior|nino|nina/.test(norm2(p.n))).sort((a, b) => dto(b) - dto(a)).slice(0, 10) : [];
  return `<div class="card" style="padding:16px 14px;border-color:rgba(250,204,21,.4);background:radial-gradient(340px 170px at 100% 0%,rgba(250,204,21,.16),transparent 70%),var(--card)">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><div><h3 style="margin:0">${svg("target")}Elegido para ti</h3><p class="tiny mute" style="margin-top:3px">Según tu nivel${state.perfil.padel && state.perfil.padel.nivel0 ? "" : " (haz el test para afinar)"} · cómpralo aquí</p></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">${card(picks[0] || PALAS[0], "TU PALA")}${picks[1] ? card(picks[1], "TUS ZAPATILLAS") : ""}</div>
    <div class="row" style="gap:8px;margin-top:12px"><button class="btn sm" id="hRec" style="flex:1">${svg("target")}Afinar a mi juego</button><button class="btn sm" id="hShop" style="flex:1;background:#facc15;color:#1a1500;border:0">${svg("cart")}Ir a la tienda</button></div></div>
  ${ofertas.length ? `<div class="sec" style="display:flex;justify-content:space-between;align-items:center">🔥 Ofertas en palas<button class="tiny" id="hOfAll" style="color:var(--volt);font-weight:700;text-transform:none;letter-spacing:0">Ver todas</button></div>
    <div class="hscroll">${ofertas.map(p => `<a class="tdcard" href="${esc(p.u)}" target="_blank" rel="noopener sponsored" style="flex:0 0 150px"><div class="tdimg" style="height:120px">${fotoReal(p, 110)}<span class="dtob" style="position:absolute;top:6px;left:6px">-${dto(p)}%</span></div>
      <div class="tdname" style="margin-top:8px;font-size:13px">${esc(limpiaNombre(p.n, ""))}</div><div><span class="num" style="color:#facc15">${eur(p.p)}</span> <s class="tiny mute">${eur(p.o)}</s></div></a>`).join("")}</div>` : ""}`;
}
function wireInicioTienda() {
  const v = $("#view"); if (typeof wireGearRows === "function") wireGearRows(v);
  const on = (id, f) => { const e = $(id); if (e) e.onclick = f; };
  on("#hRec", () => { gearSeg = "palas"; openRecPala(); }); on("#hShop", () => { gearSeg = "tienda"; tdCat = "pala"; setView("material"); });
  on("#hOfAll", () => { gearSeg = "tienda"; tdCat = "pala"; tdOrden = "oferta"; setView("material"); });
}
