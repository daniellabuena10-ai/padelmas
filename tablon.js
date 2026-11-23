// ===== Pádel+ · Tablón: torneos, novedades y patrocinios =====
// Las publicaciones se editan aquí (las gestiona Pádel+). Cuando haya anunciantes, se añaden como tipo "patrocinado".
const TABLON = [
  { id: "t-bienvenida", tipo: "novedad", fecha: "2026-11-21", e: "🎾", t: "Bienvenido a Pádel+",
    d: "Apunta tus partidos, descubre tu pala y tus zapatillas ideales y pica a tus amigos en el ranking. Cuéntanos qué te gustaría ver en la app.",
    cta: ["Escríbenos", "mailto:holapadelmas@gmail.com?subject=Idea%20para%20P%C3%A1del%2B"] },
  { id: "t-torneos", tipo: "torneo", fecha: "2026-11-21", e: "🏆", t: "¿Organizas un torneo o una liga?",
    d: "Anúnciala gratis en el tablón de Pádel+: fechas, club, niveles y cómo apuntarse. La verán los jugadores de tu zona.",
    cta: ["Anunciar mi torneo", "mailto:holapadelmas@gmail.com?subject=Anunciar%20torneo%20en%20P%C3%A1del%2B&body=Nombre%20del%20torneo%3A%0AClub%20y%20ciudad%3A%0AFechas%3A%0ANiveles%3A%0AC%C3%B3mo%20apuntarse%20(web%20o%20tel%C3%A9fono)%3A"] },
  { id: "t-marcas", tipo: "patrocinio", fecha: "2026-11-21", e: "🤝", t: "Marcas y clubes: patrocina en Pádel+",
    d: "Destaca tu club en el buscador de pistas, patrocina un torneo o un ranking, o presenta tu nueva pala a jugadores del nivel exacto al que va dirigida.",
    cta: ["Quiero patrocinar", "mailto:holapadelmas@gmail.com?subject=Patrocinio%20en%20P%C3%A1del%2B"] },
  { id: "t-guia", tipo: "consejo", fecha: "2026-11-21", e: "📘", t: "Guía: qué pala de pádel comprarte",
    d: "Redonda, lágrima o diamante, suelas espiga u omni… todo explicado sin tecnicismos.", cta: ["Leer la guía", "guia.html"] }
];
const TB_TIPO = { torneo: ["Torneo", "#a16207"], patrocinado: ["Patrocinado", "#0284c7"], patrocinio: ["Patrocinios", "#0284c7"], novedad: ["Novedad", "#4d7c0f"], consejo: ["Consejo", "#c2410c"], oferta: ["Oferta", "#be185d"] };
let tbFiltro = "todo";

function tablonCard(p, compact = false) {
  const [tn, tc] = TB_TIPO[p.tipo] || ["Aviso", "#d4ff3a"];
  return `<div class="card" style="padding:${compact ? "14px" : "16px"};${p.tipo === "patrocinado" ? "border-color:rgba(56,189,248,.4)" : ""}">
    <div style="display:flex;gap:12px;align-items:flex-start"><span style="font-size:${compact ? 26 : 30}px;line-height:1">${p.e}</span><div style="flex:1;min-width:0">
      <div class="tiny" style="color:${tc};font-weight:800;letter-spacing:.5px;text-transform:uppercase">${tn}${p.donde ? ` · ${esc(p.donde)}` : ""}</div>
      <div style="font-weight:800;font-size:${compact ? 16 : 17.5}px;margin-top:3px;line-height:1.3">${esc(p.t)}</div>
      ${compact ? "" : `<p class="small" style="margin-top:6px;line-height:1.5;color:var(--mute)">${esc(p.d)}</p>`}
      ${!compact && p.cta ? `<a class="btn sm" href="${p.cta[1]}" ${/^https?:/.test(p.cta[1]) ? `target="_blank" rel="noopener${p.tipo === "patrocinado" ? " sponsored" : ""}"` : ""} style="margin-top:10px;display:inline-flex">${esc(p.cta[0])}</a>` : ""}
    </div>${compact ? svg("chev", "chev") : ""}</div></div>`;
}
function vTablon() {
  const L = TABLON.filter(p => tbFiltro === "todo" || p.tipo === tbFiltro || (tbFiltro === "patrocinio" && p.tipo === "patrocinado"));
  return `<p class="small mute" style="margin:-4px 2px 12px">Torneos, novedades y patrocinios del mundo del pádel.</p>
    <div class="seg" id="tbF" style="margin-bottom:12px;flex-wrap:nowrap">${[["todo", "Todo"], ["torneo", "Torneos"], ["patrocinio", "Marcas"], ["novedad", "Novedades"]].map(([k, n]) => `<button data-f="${k}" class="${tbFiltro === k ? "on" : ""}">${n}</button>`).join("")}</div>
    ${L.length ? L.map(p => tablonCard(p)).join("") : `<div class="card empty"><p>No hay nada en esta sección todavía.</p></div>`}`;
}
WIRE.tablon = () => { $$("#tbF [data-f]").forEach(b => b.onclick = () => { tbFiltro = b.dataset.f; render(); }); };
function tablonInicioHTML() {
  return `<div class="sec" style="display:flex;justify-content:space-between;align-items:center">Tablón<button class="tiny" id="hTbAll" style="color:var(--vt);font-weight:700;text-transform:none;letter-spacing:0">Ver todo</button></div>
    ${TABLON.slice(0, 2).map(p => `<button data-tb="${p.id}" style="display:block;width:100%;text-align:left">${tablonCard(p, true)}</button>`).join("")}`;
}
