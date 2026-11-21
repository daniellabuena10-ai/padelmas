// Descarga el feed de productos de Padel Market (Awin) y genera data/catalogo.json
// Uso: AWIN_FEED_URL="https://productdata.awin.com/datafeed/download/..." node scripts/feed.mjs
// La URL lleva una clave privada: se guarda como secreto de GitHub (AWIN_FEED_URL), nunca en el código.
import fs from "node:fs";
import zlib from "node:zlib";
import vm from "node:vm";

const SRC = process.env.AWIN_FEED_URL || process.argv[2];
if (!SRC) { console.error("Falta AWIN_FEED_URL"); process.exit(1); }
const AFFID = "3159710", MID = "24562";

// ---------- descarga ----------
async function getText(src) {
  let buf;
  if (/^https?:/.test(src)) { const r = await fetch(src); if (!r.ok) throw new Error("HTTP " + r.status); buf = Buffer.from(await r.arrayBuffer()); }
  else buf = fs.readFileSync(src);
  if (buf[0] === 0x1f && buf[1] === 0x8b) buf = zlib.gunzipSync(buf);
  else if (buf[0] === 0x50 && buf[1] === 0x4b) throw new Error("El feed viene en ZIP: en Awin elige compresión gzip o ninguna.");
  return buf.toString("utf8").replace(/^﻿/, "");
}

// ---------- CSV robusto (comillas, saltos de línea, ; , | o tabulador) ----------
function parseCSV(t) {
  const first = t.slice(0, t.indexOf("\n"));
  const d = [",", ";", "|", "\t"].sort((a, b) => first.split(b).length - first.split(a).length)[0];
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === d) { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(f); f = ""; if (row.length > 1 || row[0]) rows.push(row); row = []; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const H = rows.shift().map(h => h.trim().toLowerCase());
  return rows.map(r => Object.fromEntries(H.map((h, i) => [h, (r[i] || "").trim()])));
}

// ---------- utilidades ----------
const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const num = v => { const n = parseFloat(String(v || "").replace(/[^\d.,]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".")); return isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null; };
const pick = (o, ...k) => { for (const x of k) if (o[x]) return o[x]; return ""; };
const STOP = new Set("pala padel racket raquette raqueta zapatillas zapatilla shoes by de la el the y and con for para edition edicion".split(" "));
const toks = s => norm(s).split(" ").filter(w => w && !STOP.has(w));
const KEY = /^(\d+k|hybrid|light|lite|attack|ultra|jr|junior|w|woman|women|mujer|pro|soft|hard|hrd|xtreme|xtrem|comfort|ctrl|control|power|alum|luxury|team|elite|lux|limited|ltd|plus|carbon|evo|speed|tour|boost|ls|clay|cc|kids|kid|technical|pack|motion|buenos|aires|edicion|lmtd|jr|superlight|hyb|special|man|woman)$/;

function categoria(p) {
  const s = norm(`${p.n} ${p.catTxt}`);
  if (/\bjunior\b|\bjr\b|\bnino|\bkid/.test(s) && /pala|racket/.test(s)) return "pala";
  if (/\b(pala|palas|racket|raqueta)\b/.test(s) && !/paletero|funda|protector|grip|bolsa|mochila/.test(s)) return "pala";
  if (/zapatilla|calzado|\bshoe|sneaker/.test(s)) return "zapa";
  if (/paletero|mochila|bolsa|bag|overgrip|grip|pelota|ball|protector|muñequera|munequera|gorra|visera|calcetin|cinta|toalla|antivibrador|funda/.test(s)) return "acces";
  if (/camiseta|polo|falda|short|pantalon|sudadera|chaqueta|vestido|legging|mallas|top\b|sujetador|chandal|ropa|textil|jersey|cortavientos|t shirt|skirt|dress/.test(s)) return "ropa";
  return null;
}
function genero(p) { const s = norm(`${p.n} ${p.catTxt}`); return /mujer|woman|women|femenin|chica/.test(s) ? "m" : /hombre|man\b|men\b|masculin/.test(s) ? "h" : ""; }

// ---------- nuestros modelos (para unir fichas con productos reales) ----------
function nuestrosModelos() {
  const src = fs.readFileSync(new URL("../gear.js", import.meta.url), "utf8");
  const take = name => { const i = src.indexOf(`const ${name} = [`); if (i < 0) return []; let d = 0, j = src.indexOf("[", i);
    for (let k = j; k < src.length; k++) { if (src[k] === "[") d++; else if (src[k] === "]" && --d === 0) return vm.runInNewContext(src.slice(j, k + 1)); } return []; };
  return [...take("PALAS_RAW").map(r => ({ id: "pala_" + r[0], marca: r[1], modelo: r[2], cat: "pala" })), ...take("ZP_RAW").map(r => ({ id: "zp_" + r[0], marca: r[1], modelo: r[2], cat: "zapa" }))];
}

// ---------- principal ----------
const raw = parseCSV(await getText(SRC));
console.log("Filas en el feed:", raw.length, "· columnas:", Object.keys(raw[0] || {}).join(", "));
let prods = raw.map(r => {
  const p = {
    id: pick(r, "aw_product_id", "merchant_product_id", "product_id"),
    n: pick(r, "product_name", "name", "title"),
    marca: pick(r, "brand_name", "brand"),
    catTxt: [pick(r, "merchant_category"), pick(r, "category_name"), pick(r, "product_type"), pick(r, "merchant_product_category_path")].join(" "),
    precio: num(pick(r, "search_price", "store_price", "display_price", "price")),
    pvp: num(pick(r, "rrp_price", "product_price_old", "base_price", "saving")),
    img: pick(r, "merchant_image_url", "large_image", "aw_image_url", "image_url", "merchant_thumb_url", "aw_thumb_url"),
    url: pick(r, "aw_deep_link", "deep_link"),
    land: pick(r, "merchant_deep_link", "product_url", "link"),
    stock: !/^(0|no|false|out)/i.test(pick(r, "in_stock", "stock_status") || "1") && pick(r, "stock_quantity") !== "0",
    talla: pick(r, "custom_2", "size", "fashion_size", "Fashion:size"),
    color: pick(r, "colour", "color", "fashion:suitable_for")
  };
  p.cat = categoria(p); p.gen = genero(p);
  if (!p.url && p.land) p.url = `https://www.awin1.com/cread.php?awinmid=${MID}&awinaffid=${AFFID}&clickref=padelmas&ued=${encodeURIComponent(p.land)}`;
  if (p.url && !/clickref=/.test(p.url)) p.url += (p.url.includes("?") ? "&" : "?") + "clickref=padelmas";
  if (p.pvp && p.precio && p.pvp <= p.precio) p.pvp = null;
  if (!p.marca) p.marca = (p.n.match(/^(nox|bullpadel|adidas|head|babolat|siux|starvie|star vie|wilson|dunlop|varlion|black crown|kombat|vibor-a|vibora|royal padel|joma|asics|lotto|drop shot|mizuno|puma|hydrogen|j hayber|joma|cartri|enebe|osaka|oxdog|kuikma)/i) || [""])[0];
  return p;
}).filter(p => p.n && p.url && p.img && p.precio && p.cat);

// quita repetidos (misma pala en varias tallas/colores): se queda con el más barato en stock
const seen = new Map();
for (const p of prods) { const k = p.cat + "|" + norm(p.n).replace(/\b(talla|size|t)\s*\S+$/, ""); const o = seen.get(k);
  if (!o || (p.stock && !o.stock) || (p.stock === o.stock && p.precio < o.precio)) seen.set(k, p); }
prods = [...seen.values()];

// une nuestros modelos con el producto real más parecido
const mod = nuestrosModelos(), match = {};
for (const m of mod) {
  const mt = toks(`${m.marca} ${m.modelo}`), brand = norm(m.marca).split(" ")[0];
  let best = null, bs = 0;
  for (const p of prods) {
    if (p.cat !== m.cat) continue;
    const pn = norm(`${p.marca} ${p.n}`); if (!pn.includes(brand)) continue;
    const ptl = toks(p.n), pt = new Set(ptl); let hit = 0; for (const t of mt) if (pt.has(t)) hit++;
    // las palabras propias del modelo (sin marca ni año) tienen que estar casi todas
    const core = mt.filter(t => t !== brand && !/^20\d\d$/.test(t)); const ch = core.filter(t => pt.has(t)).length;
    if (core.length && ch / core.length < .8) continue;
    let sc = hit / mt.length - .03 * ptl.filter(t => !mt.includes(t)).length; if (!p.stock) sc -= .15;
    // versiones distintas (12K/18K, Hybrid, W, Light, Attack, Jr…) que el producto tiene y nuestro modelo no
    const mset = new Set(mt);
    for (const t of pt) if (KEY.test(t) && !mset.has(t) && !(t === "xtrem" && mset.has("xtreme"))) sc -= .45;
    const yr = (m.modelo.match(/20\d\d/) || [])[0]; if (yr && !pn.includes(yr)) sc -= .2;
    if (sc > bs) { bs = sc; best = p; }
  }
  if (best && bs >= .45) match[m.id] = best.id;
}

// tamaño: todas las palas y zapatillas en stock; ropa y accesorios, los 600 primeros de cada
const keep = new Set(Object.values(match)); const by = { pala: [], zapa: [], ropa: [], acces: [] };
for (const p of prods) if (p.stock || keep.has(p.id)) by[p.cat].push(p);
const lim = { pala: 1500, zapa: 800, ropa: 600, acces: 600 };
const out = Object.entries(by).flatMap(([c, L]) => L.sort((a, b) => (keep.has(b.id) - keep.has(a.id)) || ((b.pvp ? 1 : 0) - (a.pvp ? 1 : 0)) || a.precio - b.precio).slice(0, lim[c]))
  .map(p => { const o = { i: p.id, n: p.n, m: p.marca, c: p.cat, p: p.precio, u: p.url, f: p.img }; if (p.pvp) o.o = p.pvp; if (p.gen) o.g = p.gen; if (!p.stock) o.x = 1; return o; });

fs.mkdirSync(new URL("../data/", import.meta.url), { recursive: true });
fs.writeFileSync(new URL("../data/catalogo.json", import.meta.url), JSON.stringify({ t: new Date().toISOString(), tienda: "Padel Market", match, p: out }));
console.log(`Guardados ${out.length} productos (palas ${by.pala.length}, zapas ${by.zapa.length}, ropa ${by.ropa.length}, accesorios ${by.acces.length}) · fichas enlazadas ${Object.keys(match).length}/${mod.length}`);
