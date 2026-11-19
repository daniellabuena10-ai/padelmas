// ===== Pádel+ · tarjeta para stories y cara a cara =====
const APP_LINK = "padelmas.club";

function myFirstName() { return ((social && social.me && social.me.nombre) || me.name || state.perfil.nombre || "Yo").trim().split(" ")[0]; }
function nivelDelta(a) {
  const h = computeNivel(); if (!h) return null; const i = h.hist.findIndex(x => x.id === a.id);
  return i > 0 ? { n: h.hist[i].n, d: h.hist[i].n - h.hist[i - 1].n } : { n: h.nivel, d: null };
}

// ---------- Tarjeta 1080×1920 (formato stories) ----------
async function matchCanvas(a) {
  try { await document.fonts.load('800 80px "Barlow Condensed"'); await document.fonts.load("800 40px Inter"); } catch {}
  const W = 1080, H = 1920, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
  const p = a.padel, won = setsWin(p.sets), lv = nivelDelta(a);
  const VOLT = "#d4ff3a", HOT = "#ff6a3d", INK = "#f2f5f7", MUTE = "#8b95a3";
  const BC = (w, s) => `${w} ${s}px "Barlow Condensed", Inter, sans-serif`, IN = (w, s) => `${w} ${s}px Inter, system-ui, sans-serif`;
  // Fondo
  x.fillStyle = "#07090c"; x.fillRect(0, 0, W, H);
  let g = x.createRadialGradient(W * .85, 120, 0, W * .85, 120, 900); g.addColorStop(0, won ? "rgba(212,255,58,.30)" : "rgba(255,106,61,.28)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, W, H);
  g = x.createRadialGradient(0, H, 0, 0, H, 900); g.addColorStop(0, "rgba(212,255,58,.10)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, W, H);
  // Pista (líneas sutiles)
  x.strokeStyle = "rgba(255,255,255,.05)"; x.lineWidth = 4; x.strokeRect(90, 1410, 900, 300); x.beginPath(); x.moveTo(540, 1400); x.lineTo(540, 1640); x.moveTo(90, 1490); x.lineTo(990, 1490); x.stroke();
  // Logo
  x.textBaseline = "alphabetic"; x.fillStyle = INK; x.font = IN(800, 56); x.fillText("Pádel", 90, 170); const lw = x.measureText("Pádel").width; x.fillStyle = VOLT; x.fillText("+", 90 + lw + 4, 170);
  x.fillStyle = MUTE; x.font = IN(600, 34); x.textAlign = "right"; x.fillText(new Date(a.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "long" }), 990, 166); x.textAlign = "left";
  // Resultado
  x.fillStyle = won ? VOLT : HOT; x.font = BC(800, 188); x.fillText(won ? "VICTORIA" : "DERROTA", 80, 440);
  x.fillStyle = MUTE; x.font = IN(600, 36); x.fillText([p.club, p.tipo && p.tipo !== "amistoso" ? p.tipo : null, fmtDur(a.dur, true)].filter(Boolean).join("  ·  "), 90, 510);
  // Marcador
  const rowY = [640, 800], names = [[myFirstName(), p.comp && p.comp.n].filter(Boolean).join(" y "), (p.riv || []).map(r => r.n).filter(Boolean).join(" y ") || "Rivales"];
  const box = (y, h, col) => { x.fillStyle = col; roundRect(x, 80, y, 920, h, 36); x.fill(); };
  box(580, 340, "rgba(255,255,255,.05)"); x.strokeStyle = "rgba(255,255,255,.09)"; x.lineWidth = 2; roundRect(x, 80, 580, 920, 340, 36); x.stroke();
  x.fillStyle = "rgba(255,255,255,.08)"; x.fillRect(120, 750, 840, 2);
  [0, 1].forEach(t => {
    const y = rowY[t] + 30; const teamWon = t === 0 ? won : !won;
    x.fillStyle = teamWon ? INK : MUTE; x.font = IN(800, 46); x.fillText(fitText(x, names[t], 430), 130, y);
    p.sets.forEach((s, i) => { const v = s[t], w = s[t] > s[1 - t]; const cx = 690 + i * 105;
      if (w) { x.fillStyle = won === (t === 0) ? VOLT : HOT; roundRect(x, cx - 44, y - 78, 88, 104, 20); x.fill(); }
      x.fillStyle = w ? "#07090c" : MUTE; x.font = BC(800, 92); x.textAlign = "center"; x.fillText(v, cx, y + 4); x.textAlign = "left"; });
  });
  // Nivel
  if (lv) {
    x.fillStyle = MUTE; x.font = IN(700, 34); x.fillText("MI NIVEL", 90, 1050);
    x.fillStyle = INK; x.font = BC(800, 230); x.fillText(nf(lv.n, 2), 84, 1260);
    const nw = x.measureText(nf(lv.n, 2)).width;
    if (lv.d != null && Math.abs(lv.d) >= .005) {
      const t = `${lv.d >= 0 ? "+" : ""}${nf(lv.d, 2)}`, X0 = 130 + nw; x.font = BC(800, 92); const tw = x.measureText(t).width;
      x.fillStyle = lv.d >= 0 ? "rgba(212,255,58,.14)" : "rgba(255,106,61,.16)"; roundRect(x, X0, 1130, tw + 110, 120, 30); x.fill();
      x.fillStyle = lv.d >= 0 ? VOLT : HOT; x.beginPath(); if (lv.d >= 0) { x.moveTo(X0 + 28, 1212); x.lineTo(X0 + 58, 1162); x.lineTo(X0 + 88, 1212); } else { x.moveTo(X0 + 28, 1162); x.lineTo(X0 + 58, 1212); x.lineTo(X0 + 88, 1162); } x.fill();
      x.fillText(t, X0 + 100, 1222);
    }
    x.fillStyle = MUTE; x.font = IN(600, 40); x.fillText(nivelTxt(lv.n), 90, 1352);
  }
  // Pie
  x.fillStyle = VOLT; roundRect(x, 80, 1640, 920, 170, 40); x.fill();
  x.fillStyle = "#07090c"; x.font = IN(800, 44); x.fillText("¿Cuál es tu nivel real?", 130, 1712);
  x.font = IN(600, 32); x.fillText(APP_LINK, 130, 1766);
  return c;
}
function roundRect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
function fitText(x, t, max) { if (x.measureText(t).width <= max) return t; while (t.length > 1 && x.measureText(t + "…").width > max) t = t.slice(0, -1); return t.trim() + "…"; }

async function shareCanvas(c, text) {
  const blob = await new Promise(r => c.toBlob(r, "image/png"));
  const file = new File([blob], "padelplus-partido.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text }); return true; } catch (e) { if (e && e.name === "AbortError") return true; }
  }
  const url = URL.createObjectURL(blob); const l = document.createElement("a"); l.href = url; l.download = file.name; document.body.appendChild(l); l.click(); l.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000); toast("Imagen descargada. Súbela a tus stories 📸"); return false;
}

// Hoja tras guardar un partido (o desde el detalle)
async function openShareMatch(a, recien = false) {
  const won = setsWin(a.padel.sets), lv = nivelDelta(a);
  const head = recien ? (won ? "¡Victoria! 🏆" : "Partido guardado") : "Compartir partido";
  openSheet(head, `${recien && lv && lv.d != null ? `<p class="small mute" style="margin:-6px 0 12px">Tu nivel ${lv.d >= 0 ? "sube" : "baja"} <b style="color:${lv.d >= 0 ? "var(--volt)" : "var(--neg)"}">${lv.d >= 0 ? "+" : ""}${nf(lv.d, 2)}</b> y se queda en <b>${nf(lv.n, 2)}</b>.</p>` : ""}
    <div id="shPrev" style="aspect-ratio:9/16;max-height:52vh;margin:0 auto 14px;border-radius:18px;overflow:hidden;background:var(--card2);display:flex;align-items:center;justify-content:center"><span class="small mute">Creando tarjeta…</span></div>
    <button class="btn pri block" id="shGo">${svg("share")}Compartir en stories</button>
    <p class="tiny mute" style="text-align:center;margin-top:8px">Elige Instagram en el menú y súbela a tu historia. Etiqueta a tus compañeros 😉</p>
    ${recien ? `<button class="btn block" id="shNo" style="margin-top:8px">Ahora no</button>` : ""}`, async s => {
    const c = await matchCanvas(a); const img = new Image(); img.src = c.toDataURL("image/png"); img.style.cssText = "height:100%;width:auto;display:block";
    const pv = $("#shPrev", s); if (pv) { pv.innerHTML = ""; pv.appendChild(img); }
    $("#shGo", s).onclick = () => shareCanvas(c, `${won ? "Victoria" : "Partido"} en Pádel+ 🎾 ¿Cuál es tu nivel? ${APP_LINK}`);
    const no = $("#shNo", s); if (no) no.onclick = closeSheet;
  });
}

// ---------- Cara a cara con un amigo ----------
function caraACara(uid) {
  const r = { contra: [0, 0], juntos: [0, 0], ult: null };
  for (const a of padelActs()) {
    const p = a.padel, won = setsWin(p.sets); if (won === null) continue;
    const vs = (p.riv || []).some(x => x && x.uid === uid), con = p.comp && p.comp.uid === uid;
    if (vs) r.contra[won ? 0 : 1]++; else if (con) r.juntos[won ? 0 : 1]++; else continue;
    r.ult = a;
  }
  return r;
}
function caraACaraHTML(uid, p) {
  const r = caraACara(uid), nm = esc(p.nombre.split(" ")[0]), tot = r.contra[0] + r.contra[1], tj = r.juntos[0] + r.juntos[1];
  if (!tot && !tj) return `<div class="card" style="margin:14px 0"><h3>${svg("trophy")}Cara a cara</h3><p class="small mute" style="margin-top:6px">Aún no habéis jugado juntos. Cuando apuntes un partido, escribe <b>@${esc(p.usuario)}</b> y empezará el pique 😏</p></div>`;
  const lead = r.contra[0] > r.contra[1] ? "Vas ganando tú 😎" : r.contra[0] < r.contra[1] ? `Te gana ${nm}. Toca revancha 🔥` : "Empate. Hay que desempatar ⚔️";
  return `<div class="card" style="margin:14px 0"><h3>${svg("trophy")}Cara a cara</h3>
    ${tot ? `<div style="display:flex;align-items:center;justify-content:center;gap:18px;margin:10px 0 4px">
      <div style="text-align:center"><div class="tiny mute">Tú</div><div class="num" style="font-size:56px;line-height:1;color:${r.contra[0] >= r.contra[1] ? "var(--volt)" : "var(--ink)"}">${r.contra[0]}</div></div>
      <div class="num mute" style="font-size:32px">–</div>
      <div style="text-align:center"><div class="tiny mute">${nm}</div><div class="num" style="font-size:56px;line-height:1;color:${r.contra[1] > r.contra[0] ? "var(--hot)" : "var(--ink)"}">${r.contra[1]}</div></div></div>
      <p class="small" style="text-align:center;margin-bottom:6px">${lead}</p>` : ""}
    ${tj ? `<div class="item" style="border-top:1px solid var(--line);margin-top:6px"><div style="flex:1"><div style="font-weight:600">Jugando juntos</div><div class="small mute">${r.juntos[0]} victorias · ${r.juntos[1]} derrotas</div></div><span class="num" style="font-size:24px;color:var(--volt)">${Math.round(r.juntos[0] / tj * 100)}%</span></div>` : ""}
    ${r.ult ? `<p class="tiny mute" style="margin-top:6px">Último: ${relDate(r.ult.fecha)} · ${setsStr(r.ult.padel.sets)}</p>
      <button class="btn pri block" id="uRev" style="margin-top:10px" data-pre="${esc(JSON.stringify([r.ult.padel.comp, ...(r.ult.padel.riv || [])].map(jugNombre)))}">${svg("bolt")}${r.contra[1] > r.contra[0] ? "Apuntar la revancha" : "Apuntar otro partido"}</button>` : ""}</div>`;
}

function jugNombre(x) { if (!x) return ""; return x.uid && profCache[x.uid] && profCache[x.uid].usuario ? "@" + profCache[x.uid].usuario : x.n || ""; }

// ---------- Ranking de nivel con tus amigos ----------
function rankAmigosHTML() {
  if (!socialOn() || !social.following || !social.following.size) return "";
  const yo = { uid: me.uid, nombre: (social.me && social.me.nombre) || "Tú", color: social.me && social.me.color, foto: social.me && social.me.foto, nivelPadel: computeNivel() ? computeNivel().nivel : null, yo: true };
  const L = [yo, ...[...social.following].map(u => profCache[u]).filter(p => p && p.nivelPadel)].filter(p => p.nivelPadel).sort((a, b) => b.nivelPadel - a.nivelPadel);
  if (L.length < 2) return "";
  const pos = L.findIndex(p => p.yo) + 1;
  return `<div class="sec">Ranking con tus amigos</div><div class="card" style="padding:6px 14px">
    <p class="small mute" style="margin:6px 0 4px">${pos === 1 ? "Eres el número 1 de tu grupo 👑" : `Vas ${pos}º de ${L.length}. Te faltan <b style="color:var(--volt)">${nf(L[pos - 2].nivelPadel - yo.nivelPadel, 2)}</b> para pasar a ${esc(L[pos - 2].nombre.split(" ")[0])}.`}</p>
    ${L.slice(0, 10).map((p, i) => `<button class="item" ${p.yo ? "" : `data-user="${p.uid}"`} style="${p.yo ? "background:rgba(212,255,58,.06);border-radius:12px;padding-left:8px;padding-right:8px" : ""}"><span class="num" style="width:24px;font-size:20px;color:${i === 0 ? "#facc15" : "var(--mute)"}">${i + 1}</span>${avatar(p, 34)}<div style="flex:1;min-width:0;font-weight:${p.yo ? 800 : 600};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.yo ? "Tú" : esc(p.nombre)}</div><span class="num" style="font-size:22px;color:${p.yo ? "var(--volt)" : "var(--ink)"}">${nf(p.nivelPadel, 2)}</span></button>`).join("")}</div>`;
}
