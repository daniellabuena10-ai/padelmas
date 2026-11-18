// ===== Ritmo+ · núcleo: utilidades, datos, sesión, navegación =====
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = (p = "") => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, "0");
const dstr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => dstr(new Date());
const parseD = s => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const monday = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["L", "M", "X", "J", "V", "S", "D"];
const DIAS_L = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const nf = (n, d = 0) => (+n || 0).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d });
function fmtDur(s, long = false) {
  s = Math.round(s || 0); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  if (long) return h ? `${h} h ${m} min` : `${m} min`;
  return h ? `${h}:${pad(m)}:${pad(x)}` : `${m}:${pad(x)}`;
}
const km = m => (m || 0) / 1000;
const fmtKm = m => nf(km(m), km(m) < 10 ? 2 : 1);
const fmtPace = spk => (!spk || !isFinite(spk) || spk > 3600) ? "–:––" : `${Math.floor(spk / 60)}:${pad(Math.round(spk % 60) % 60)}`;
const fmtSpeed = (m, s) => s ? nf(m / s * 3.6, 1) : "0";
function relDate(iso) {
  const d = new Date(iso), t = new Date(); const diff = Math.round((parseD(dstr(t)) - parseD(dstr(d))) / 864e5);
  const h = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (diff === 0) return `Hoy · ${h}`; if (diff === 1) return `Ayer · ${h}`;
  if (diff < 7) return `${DIAS_L[d.getDay()][0].toUpperCase() + DIAS_L[d.getDay()].slice(1)} · ${h}`;
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)} ${d.getFullYear() !== t.getFullYear() ? d.getFullYear() : ""} · ${h}`.replace("  ", " ");
}
function toast(msg) { const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; $("#toastHost").append(t); setTimeout(() => t.remove(), 2600); }
function haversine(a, b) {
  const R = 6371e3, r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r;
  const x = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// ---------- Estado ----------
let me = null, store = null;
let state = { act: {}, com: {}, peso: {}, dia: {}, perfil: {} };
let loaded = false;
const COLS = { act: "actividades", com: "comidas", peso: "pesos", dia: "dias" };

// Firestore no admite arrays anidados: la ruta se guarda como texto JSON.
function packAct(a) { const o = { ...a }; if (Array.isArray(o.trk)) o.trk = JSON.stringify(o.trk); return o; }
function unpackAct(a) { if (typeof a.trk === "string") { try { a.trk = JSON.parse(a.trk); } catch { a.trk = null; } } return a; }

function firebaseStore() {
  const app = firebase.initializeApp(window.FIREBASE_CONFIG);
  const auth = firebase.auth(), db = firebase.firestore();
  try { db.enablePersistence({ synchronizeTabs: true }).catch(() => {}); } catch {}
  let unsubs = [];
  return {
    kind: "firebase", auth, db,
    onUser(cb) { auth.onAuthStateChanged(u => cb(u ? { uid: u.uid, email: u.email, name: u.displayName } : null)); },
    async signIn(e, p) { await auth.signInWithEmailAndPassword(e, p); },
    async signUp(e, p, n) { const c = await auth.createUserWithEmailAndPassword(e, p); if (n) await c.user.updateProfile({ displayName: n }); me && (me.name = n); },
    async reset(e) { await auth.sendPasswordResetEmail(e); },
    async signOut() { unsubs.forEach(f => f()); unsubs = []; stopSocial(); await auth.signOut(); },
    start(u, onChange) {
      const base = db.collection("users").doc(u.uid); this.base = base;
      const since = dstr(addDays(new Date(), -400));
      let pending = 5; const done = () => { if (--pending === 0) onChange(true); };
      for (const [k, col] of Object.entries(COLS)) {
        let q = base.collection(col); if (k === "com" || k === "dia") q = q.where("fecha", ">=", since);
        let first = true;
        unsubs.push(q.onSnapshot(s => {
          s.docChanges().forEach(ch => { const d = { id: ch.doc.id, ...ch.doc.data() }; if (ch.type === "removed") delete state[k][d.id]; else state[k][d.id] = k === "act" ? unpackAct(d) : d; });
          if (first) { first = false; done(); } else onChange(false);
        }, err => { console.error(err); if (first) { first = false; done(); } }));
      }
      let f2 = true;
      unsubs.push(base.collection("config").doc("perfil").onSnapshot(s => { state.perfil = s.exists ? s.data() : {}; if (f2) { f2 = false; done(); } else onChange(false); }, () => { if (f2) { f2 = false; done(); } }));
    },
    save(k, o) { return this.base.collection(COLS[k]).doc(o.id).set(k === "act" ? packAct(o) : o); },
    del(k, id) { return this.base.collection(COLS[k]).doc(id).delete(); },
    savePerfil(p) { return this.base.collection("config").doc("perfil").set(p, { merge: true }); },
    async deleteAll() { try { await leaveSocial(); } catch {} for (const col of Object.values(COLS)) { const s = await this.base.collection(col).get(); for (const d of s.docs) await d.ref.delete(); } await this.base.collection("config").doc("perfil").delete(); },
  };
}
function localStore() {
  const K = "ritmo-local"; const load = () => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch { return {}; } };
  const db = load(); const persist = () => { try { localStorage.setItem(K, JSON.stringify(db)); } catch {} };
  let cbUser;
  return {
    kind: "local",
    onUser(cb) { cbUser = cb; cb(db.user || null); },
    async signIn(e) { db.user = db.user || { uid: "local", email: e, name: e.split("@")[0] }; persist(); cbUser(db.user); },
    async signUp(e, p, n) { db.user = { uid: "local", email: e, name: n || e.split("@")[0] }; persist(); cbUser(db.user); },
    async reset() {}, async signOut() { delete db.user; persist(); cbUser(null); },
    start(u, onChange) { for (const k of Object.keys(COLS)) state[k] = { ...(db[k] || {}) }; for (const a of Object.values(state.act)) unpackAct(a); state.perfil = db.perfil || {}; onChange(true); },
    save(k, o) { db[k] = db[k] || {}; db[k][o.id] = k === "act" ? packAct(o) : o; persist(); },
    del(k, id) { if (db[k]) delete db[k][id]; persist(); },
    savePerfil(p) { db.perfil = { ...(db.perfil || {}), ...p }; persist(); },
    async deleteAll() { for (const k of [...Object.keys(COLS), "perfil"]) delete db[k]; persist(); },
  };
}
function saveItem(k, o) { const isNew = !state[k][o.id]; state[k][o.id] = o; store.save(k, o); if (k === "act" && typeof publishAct === "function") publishAct(o, isNew); }
function delItem(k, id) { const o = state[k][id]; delete state[k][id]; store.del(k, id); if (k === "act" && o && typeof unpublishAct === "function") unpublishAct(o); }
function savePerfil(p) { state.perfil = { ...state.perfil, ...p }; store.savePerfil(p); }

// ---------- Arranque y sesión ----------
let authMode = "in";
function initAuthUI() {
  $("#feat").innerHTML = [["gps", "GPS"], ["padel", "Pádel y más"], ["gym", "Gimnasio"], ["food", "Nutrición"], ["watch", "Tu reloj"]].map(([i, t]) => `<span>${svg(i)}${t}</span>`).join("");
  const setMode = m => { authMode = m; $("#fName").hidden = m !== "up"; $("#aBtn").textContent = m === "up" ? "Crear cuenta" : "Entrar"; $("#aSwTxt").textContent = m === "up" ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"; $("#aSw").textContent = m === "up" ? "Entrar" : "Crear cuenta"; $("#aPass").autocomplete = m === "up" ? "new-password" : "current-password"; $("#aErr").textContent = ""; };
  $("#aSw").onclick = () => setMode(authMode === "up" ? "in" : "up");
  $("#aReset").onclick = async () => { const e = $("#aEmail").value.trim(); if (!e) { $("#aErr").textContent = "Escribe tu email arriba y vuelve a tocar."; return; } try { await store.reset(e); $("#aErr").textContent = ""; toast("Te hemos enviado un email para cambiarla"); } catch (er) { $("#aErr").textContent = authErr(er); } };
  $("#authForm").onsubmit = async ev => {
    ev.preventDefault(); const b = $("#aBtn"); b.disabled = true; $("#aErr").textContent = "";
    try { const e = $("#aEmail").value.trim(), p = $("#aPass").value; if (authMode === "up") await store.signUp(e, p, $("#aName").value.trim()); else await store.signIn(e, p); }
    catch (er) { $("#aErr").textContent = authErr(er); } finally { b.disabled = false; }
  };
}
function authErr(e) {
  const c = e && e.code || ""; return ({ "auth/invalid-credential": "Email o contraseña incorrectos.", "auth/wrong-password": "Contraseña incorrecta.", "auth/user-not-found": "No hay ninguna cuenta con ese email.", "auth/email-already-in-use": "Ya existe una cuenta con ese email. Prueba a entrar.", "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.", "auth/invalid-email": "Ese email no es válido.", "auth/too-many-requests": "Demasiados intentos. Espera un momento.", "auth/network-request-failed": "Sin conexión. Revisa tu internet." })[c] || "No se ha podido. Inténtalo otra vez.";
}
function boot() {
  store = (window.FIREBASE_CONFIG && window.firebase) ? firebaseStore() : localStore();
  initAuthUI(); initNav();
  store.onUser(u => {
    $("#splash").classList.add("out");
    if (!u) { me = null; state = { act: {}, com: {}, peso: {}, dia: {}, perfil: {} }; loaded = false; $("#auth").hidden = false; $("#app").hidden = true; $("#tabbar").hidden = true; return; }
    me = u; $("#auth").hidden = true; $("#app").hidden = false; $("#tabbar").hidden = false;
    store.start(u, first => { loaded = true; if (first) { setView(view); checkRecovery(); startSocial().then(() => { if (view === "comunidad" && !sheetOpen) render(); }); } else if (!sheetOpen && !recActive) render(); });
  });
}

// ---------- Navegación ----------
let view = "inicio", sheetOpen = false;
const TABS = { inicio: ["home", "Inicio"], comunidad: ["users", "Comunidad"], grabar: ["plus", "Grabar"], nutricion: ["food", "Nutrición"], progreso: ["chart", "Progreso"], entrenos: ["list", "Mis entrenos"] };
function initNav() {
  $$("#tabbar button").forEach(b => {
    const [ic, t] = TABS[b.dataset.v];
    if (b.dataset.v === "grabar") b.querySelector(".rec").innerHTML = svg("plus"); else b.innerHTML = svg(ic) + `<span>${t}</span>` + (b.dataset.v === "comunidad" ? `<i class="dotb" hidden></i>` : "");
    b.onclick = () => b.dataset.v === "grabar" ? openStart() : setView(b.dataset.v);
  });
  $("#avBtn").onclick = openPerfil; $("#chatBtn").onclick = openChats; $("#bellBtn").onclick = openAvisos;
  $("#sheetBg").onclick = closeSheet;
}
function setView(v) { view = v; $$("#tabbar button").forEach(b => b.classList.toggle("on", b.dataset.v === v || (v === "entrenos" && b.dataset.v === "progreso"))); window.scrollTo(0, 0); render(); }
function render() {
  if (!me || !loaded) return;
  const name = (me.name || state.perfil.nombre || me.email || "R").trim();
  $("#avBtn").textContent = name[0].toUpperCase();
  const V = { inicio: vInicio, entrenos: vEntrenos, nutricion: vNutricion, progreso: vProgreso, comunidad: vComunidad }[view];
  $("#title").textContent = TABS[view][1];
  $("#view").innerHTML = `<div class="fade">${V()}</div>`;
  (WIRE[view] || (() => {}))();
  if (view === "comunidad" && store.kind !== "firebase") wireZapasView($("#view"));
}
const WIRE = {};
function openSheet(title, html, wire) {
  const s = $("#sheet"); s.innerHTML = `<div class="grab"></div><div class="sh"><h2>${title}</h2><button class="x" id="shX">${svg("close")}</button></div>${html}`;
  $("#shX").onclick = closeSheet; s.scrollTop = 0; sheetOpen = true;
  s.classList.add("on"); $("#sheetBg").classList.add("on"); wire && wire(s);
}
function closeSheet() { chatOpenId = null; if (msgUnsub) { msgUnsub(); msgUnsub = null; } $("#sheet").classList.remove("on"); $("#sheetBg").classList.remove("on"); sheetOpen = false; setTimeout(() => { if (!sheetOpen) render(); }, 50); }
function confirmSheet(title, text, okTxt, onOk, danger = true) {
  openSheet(title, `<p class="mute" style="line-height:1.5;margin-bottom:18px">${text}</p><div class="row"><button class="btn" id="cNo">Cancelar</button><button class="btn ${danger ? "danger" : "pri"}" id="cOk">${okTxt}</button></div>`,
    s => { $("#cNo", s).onclick = closeSheet; $("#cOk", s).onclick = () => { onOk(); }; });
}

// ---------- Cálculos de actividad ----------
const actList = () => Object.values(state.act).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
function weightKg() { const p = Object.values(state.peso).sort((a, b) => b.fecha.localeCompare(a.fecha))[0]; return p ? p.kg : (+state.perfil.peso || 72); }
function estKcal(sport, dur, dist) {
  const s = sportOf(sport); let met = s.met; const kmh = dur ? dist / dur * 3.6 : 0;
  if (sport === "correr" && kmh) met = Math.max(6, Math.min(16, kmh * 1.0));
  if (sport === "bici" && kmh) met = kmh < 16 ? 6 : kmh < 20 ? 8 : kmh < 25 ? 10 : 12;
  if (sport === "caminar" && kmh) met = kmh < 4 ? 3 : kmh < 5.5 ? 3.8 : 5;
  return Math.round(met * weightKg() * dur / 3600);
}
function bestEfforts(trk) {
  // trk: [lat, lon, ele, t, hr]. Mejor tiempo para 1k, 5k, 10k y media maratón.
  if (!trk || trk.length < 2) return {};
  const cum = [0]; for (let i = 1; i < trk.length; i++) cum.push(cum[i - 1] + haversine(trk[i - 1], trk[i]));
  const out = {};
  for (const D of [1000, 5000, 10000, 21097]) {
    if (cum[cum.length - 1] < D) break; let j = 0, best = Infinity;
    for (let i = 0; i < trk.length; i++) { while (j < trk.length && cum[j] - cum[i] < D) j++; if (j >= trk.length) break; const t = trk[j][3] - trk[i][3]; if (t > 0 && t < best) best = t; }
    if (isFinite(best)) out[D] = best;
  }
  return out;
}
function splitsOf(trk) {
  if (!trk || trk.length < 2) return [];
  const res = []; let acc = 0, t0 = trk[0][3], e0 = trk[0][2], up = 0;
  for (let i = 1; i < trk.length; i++) {
    const d = haversine(trk[i - 1], trk[i]); acc += d;
    if (trk[i][2] != null && trk[i - 1][2] != null && trk[i][2] > trk[i - 1][2]) up += trk[i][2] - trk[i - 1][2];
    if (acc >= 1000) { res.push({ km: res.length + 1, t: trk[i][3] - t0, up }); t0 = trk[i][3]; acc -= 1000; up = 0; }
  }
  if (acc > 150) { const t = trk[trk.length - 1][3] - t0; res.push({ km: res.length + 1, t: t / (acc / 1000), up, part: acc }); }
  return res;
}
function elevGain(trk) { let up = 0; if (!trk) return 0; let last = null; for (const p of trk) { if (p[2] == null) continue; if (last != null && p[2] - last > 0.6) up += p[2] - last; if (last == null || Math.abs(p[2] - last) > 0.6) last = p[2]; } return Math.round(up); }
function downsample(trk, max = 1500) { if (!trk || trk.length <= max) return trk; const step = trk.length / max, o = []; for (let i = 0; i < max; i++) o.push(trk[Math.floor(i * step)]); o.push(trk[trk.length - 1]); return o; }
function autoTitle(sport, iso) {
  const h = new Date(iso).getHours(); const f = h < 6 ? "nocturna" : h < 12 ? "matutina" : h < 15 ? "de mediodía" : h < 21 ? "de tarde" : "nocturna";
  const base = { correr: "Carrera", bici: "Salida en bici", caminar: "Caminata", senderismo: "Ruta", gym: "Entreno de gimnasio", padel: "Partido de pádel", tenis: "Partido de tenis", futbol: "Partido de fútbol", baloncesto: "Partido de baloncesto", natacion: "Natación", yoga: "Sesión de yoga", hiit: "Entreno HIIT" }[sport] || "Entreno";
  if (["gym", "padel", "tenis", "futbol", "baloncesto", "yoga", "hiit"].includes(sport)) return base;
  return `${base} ${base.endsWith("a") || base === "Natación" ? f : f.replace("matutina", "matutino").replace("nocturna", "nocturno")}`;
}

// ---------- Mini mapa SVG ----------
function routeSVG(trk, w = 600, h = 240, color = "#d4ff3a") {
  if (!trk || trk.length < 2) return "";
  let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const p of trk) { a = Math.min(a, p[0]); b = Math.max(b, p[0]); c = Math.min(c, p[1]); d = Math.max(d, p[1]); }
  const k = Math.cos((a + b) / 2 * Math.PI / 180), W = (d - c) * k || 1e-6, H = (b - a) || 1e-6, pd = 22;
  const sc = Math.min((w - pd * 2) / W, (h - pd * 2) / H), ox = (w - W * sc) / 2, oy = (h - H * sc) / 2;
  const P = trk.map(p => [ox + (p[1] - c) * k * sc, oy + (b - p[0]) * sc]);
  const step = Math.max(1, Math.floor(P.length / 400)); const pts = P.filter((_, i) => i % step === 0 || i === P.length - 1).map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const s = P[0], e = P[P.length - 1];
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet"><defs><pattern id="g" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="rgba(255,255,255,.035)"/></pattern></defs><rect width="100%" height="100%" fill="url(#g)"/>
  <polyline points="${pts}" fill="none" stroke="${color}" stroke-opacity=".25" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${s[0]}" cy="${s[1]}" r="6" fill="#4ade80" stroke="#0a0d11" stroke-width="2.5"/><circle cx="${e[0]}" cy="${e[1]}" r="6" fill="#ff6a3d" stroke="#0a0d11" stroke-width="2.5"/></svg>`;
}
function sportBadge(id, size = "") { const s = sportOf(id); return `<div class="sp ${size}" style="background:${s.c}1f;color:${s.c}">${svg(s.ic)}</div>`; }
