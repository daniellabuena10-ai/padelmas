// ===== Pádel+ · Estadísticas sin cookies (GoatCounter) =====
// No guarda nada en el móvil ni identifica a nadie: solo cuenta visitas, tests hechos y clics en Comprar.
// Para activarlo basta con poner aquí el código de la cuenta de GoatCounter.
const GC_CODE = "";
function track(ev) {
  if (!GC_CODE || location.hostname !== "padelmas.club") return;
  try { if (window.goatcounter && goatcounter.count) goatcounter.count({ path: ev, title: ev, event: true }); } catch {}
}
(function () {
  if (!GC_CODE || location.hostname !== "padelmas.club") return;
  window.goatcounter = { no_onload: false };
  const s = document.createElement("script"); s.async = true; s.src = "https://gc.zgo.at/count.js"; s.dataset.goatcounter = `https://${GC_CODE}.goatcounter.com/count`; document.head.appendChild(s);
  // Clics en botones de compra (enlaces de afiliado)
  document.addEventListener("click", e => { const a = e.target.closest && e.target.closest("a[href]"); if (a && /awin1\.com|padelmarket\.com/.test(a.href)) track("compra"); }, true);
  // Tests terminados y apartados visitados
  window.addEventListener("load", () => {
    const envolver = (n, ev) => { const f = window[n]; if (typeof f === "function") window[n] = function () { track(ev); return f.apply(this, arguments); }; };
    envolver("rpResultados", "test-pala"); envolver("zqResultados", "test-zapatillas");
    if (typeof setView === "function") { const sv = setView; setView = function (v) { track("vista-" + v); return sv.apply(this, arguments); }; }
  });
})();
