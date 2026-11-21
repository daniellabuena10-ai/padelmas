// ===== Pádel+ · Catálogo real de Padel Market (data/catalogo.json, se actualiza cada noche) =====
let CAT = null, CATBY = {}, catLoading = null;
const eur = n => n == null ? "" : n.toLocaleString("es-ES", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + " €";
function loadCatalogo() {
  if (CAT || catLoading) return catLoading;
  catLoading = fetch("data/catalogo.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : null).then(d => {
    if (!d || !d.p) return null; CAT = d; CATBY = Object.fromEntries(d.p.map(p => [p.i, p]));
    if (typeof view !== "undefined" && ["material", "inicio"].includes(view) && !sheetOpen) render();
    return d;
  }).catch(() => null);
  return catLoading;
}
// Producto real enlazado a una de nuestras fichas
function realOf(g) { return CAT && g && CAT.match && CATBY[CAT.match[g.id]] || null; }
function dto(p) { return p.o && p.o > p.p ? Math.round((1 - p.p / p.o) * 100) : 0; }
function precioReal(p) { return `<span class="num" style="color:#facc15">${eur(p.p)}</span>${p.o ? ` <s class="tiny mute">${eur(p.o)}</s>` : ""}${dto(p) >= 5 ? ` <span class="dtob">-${dto(p)}%</span>` : ""}`; }
function fotoReal(p, size) { return `<img src="${esc(p.f)}" alt="${esc(p.n)}" loading="lazy" referrerpolicy="no-referrer" style="width:${size}px;height:${size}px;object-fit:contain;background:#fff;border-radius:14px" onerror="this.style.display='none'">`; }

// ---------- Tienda (en Material) ----------
let tdCat = "pala", tdQ = "", tdOrden = "oferta", tdN = 30, tdGen = "";
const TD_CATS = [["pala", "Palas"], ["zapa", "Zapatillas"], ["ropa", "Ropa"], ["acces", "Accesorios"]];
function tiendaHTML() {
  if (!CAT) { loadCatalogo(); return `<div class="card empty"><p>${catLoading ? "Cargando el catálogo de Padel Market…" : "El catálogo se está preparando. Vuelve en un rato."}</p></div>`; }
  const qs = norm2(tdQ).split(/\s+/).filter(Boolean);
  let L = CAT.p.filter(p => p.c === tdCat && !p.x && (!tdGen || p.g === tdGen) && (!qs.length || (s => qs.every(w => s.includes(w)))(norm2(`${p.m} ${p.n}`))));
  L.sort(tdOrden === "barato" ? (a, b) => a.p - b.p : tdOrden === "caro" ? (a, b) => b.p - a.p : (a, b) => dto(b) - dto(a) || a.p - b.p);
  const tot = L.length; L = L.slice(0, tdN);
  return `<div class="card" style="padding:12px;border-color:rgba(250,204,21,.3)"><div style="display:flex;gap:10px;align-items:center"><span style="font-size:22px">🛒</span><div style="flex:1"><div style="font-weight:800">Tienda Pádel+</div><div class="tiny mute">${CAT.p.length.toLocaleString("es-ES")} productos de ${esc(CAT.tienda)} · precios de hoy</div></div></div></div>
    <div class="seg" id="tdC" style="margin:4px 0 10px">${TD_CATS.map(([k, n]) => `<button data-c="${k}" class="${tdCat === k ? "on" : ""}">${n}</button>`).join("")}</div>
    <div class="row" style="gap:8px;margin-bottom:10px"><label class="field" style="margin:0;flex:1"><input id="tdQ" value="${esc(tdQ)}" placeholder="Busca marca o modelo (ej. Bullpadel)" style="margin:0" enterkeyhint="search"></label>
      <select id="tdO" style="flex:0 0 auto;width:auto;margin:0;padding:0 10px;border-radius:14px;background:var(--card2);color:var(--ink);border:1px solid var(--line2)"><option value="oferta" ${tdOrden === "oferta" ? "selected" : ""}>Ofertas</option><option value="barato" ${tdOrden === "barato" ? "selected" : ""}>Más barato</option><option value="caro" ${tdOrden === "caro" ? "selected" : ""}>Más caro</option></select></div>
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
