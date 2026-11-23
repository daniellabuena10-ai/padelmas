#!/usr/bin/env python3
"""Genera una historia de Instagram (1080x1920) para @padelmas.app, con fotos reales de producto.

Uso: python3 scripts/ig_story.py <tipo> <archivo_salida.jpg> [n] [tema]
  tipo: oferta | ofertas3 | recomendador | liga | qr
  n:    para "oferta", qué puesto del ranking de descuentos usar (1 = el mayor). Sirve para no repetir pala.
  tema: noche | lima | claro. Si no se indica, cambia solo según el día para que no se repitan.
Las fotos se descargan del catálogo (Padel Market). Solo salen productos cuya foto se ha podido descargar.
Imprime en la última línea un JSON con el archivo y datos útiles para el texto.
"""
import asyncio, json, re, sys, os, html, base64, urllib.request
from datetime import datetime
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tipo = sys.argv[1] if len(sys.argv) > 1 else "oferta"
out = sys.argv[2] if len(sys.argv) > 2 else f"ig/story-{tipo}.jpg"
n = int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3].isdigit() else 1
TEMAS = ["noche", "lima", "claro"]
tema = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] in TEMAS else TEMAS[(datetime.now().timetuple().tm_yday + "orlq".find(tipo[0])) % 3]

d = json.load(open(os.path.join(ROOT, "data/catalogo.json")))
def dto(p): return round(100 * (1 - p["p"] / p["o"])) if p.get("o") and p["o"] > p["p"] else 0
def limpia(p):
    s = re.sub(r"\s*\((pala|zapatillas?)\)\s*$", "", p["n"], flags=re.I).split(" + ")[0]
    m = p.get("m") or ""
    if s.lower().startswith(m.lower() + " "): s = s[len(m) + 1:]
    return s.strip()
eur = lambda x: (f"{x:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")).replace(",00", "") + " €"
TOPM = ("bullpadel", "nox", "adidas", "head", "babolat", "siux", "star vie", "starvie", "black crown", "wilson", "drop shot", "kombat", "vibor", "royal", "dunlop", "varlion", "joma")
of = [p for p in d["p"] if p["c"] == "pala" and not p.get("x") and p.get("f") and dto(p) >= 20 and " + " not in p["n"]
      and not re.search(r"\bjr\b|junior|niñ|nino|kids", p["n"].lower())]
of.sort(key=lambda p: (0 if (p.get("m") or "").lower().startswith(TOPM) else 1, -dto(p), p["p"]))
vistos, top = set(), []
for p in of:
    k = re.sub(r"\b(20\d\d)\b.*", "", limpia(p).lower())[:22]
    if k in vistos: continue
    vistos.add(k); top.append(p)

def b64(path, mime): return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()
FAKE = os.environ.get("STORY_FAKEIMG")  # solo para pruebas sin internet
def foto(p):
    if FAKE: return b64(FAKE, "image/png")
    u = p["f"] + ("&" if "?" in p["f"] else "?") + "width=900"
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 padelmas-stories"}), timeout=20)
        data = r.read(); mime = r.headers.get("Content-Type", "image/jpeg").split(";")[0]
        return f"data:{mime};base64," + base64.b64encode(data).decode() if len(data) > 3000 else None
    except Exception:
        return None
def con_foto(lista, k):
    res = []
    for p in lista:
        if len(res) >= k: break
        f = foto(p)
        if f: res.append((p, f))
    return res

icon = b64(os.path.join(ROOT, "icon-512.png"), "image/png")
fonts = "".join(f"@font-face{{font-family:Inter;font-weight:{w};src:url({b64(os.path.join(ROOT, f'fonts/inter-latin-{w}-normal.woff2'), 'font/woff2')}) format('woff2')}}" for w in (500, 600, 700, 800, 900))
T = {"noche": dict(bg="#0f172a", ink="#ffffff", mute="#94a3b8", acc="#d4ff3a", accInk="#0f172a", card="#1e293b", line="#334155", hot="#ff5a36"),
     "lima":  dict(bg="#d4ff3a", ink="#0f172a", mute="#3f4a12", acc="#0f172a", accInk="#d4ff3a", card="#ffffff", line="#b7dc2a", hot="#ff5a36"),
     "claro": dict(bg="#f4f1ea", ink="#0f172a", mute="#6b6558", acc="#ff5a36", accInk="#ffffff", card="#ffffff", line="#e5dfd2", hot="#ff5a36")}[tema]
CSS = fonts + """*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;font-family:Inter,Arial,sans-serif;background:var(--bg);color:var(--ink);position:relative}
:root{""" + ";".join(f"--{k}:{v}" for k, v in T.items()) + """}
.top{position:absolute;top:150px;left:80px;right:80px;display:flex;align-items:center;justify-content:space-between}
.logo{display:flex;align-items:center;gap:16px;font-weight:900;font-size:44px}.logo img{width:72px;height:72px;border-radius:20px}.logo b{color:var(--hot)}
.chip{font-weight:800;font-size:30px;letter-spacing:3px;text-transform:uppercase;border:3px solid var(--ink);border-radius:99px;padding:12px 26px}
h1{font-weight:900;letter-spacing:-5px;line-height:.92}
.foot{position:absolute;left:80px;right:80px;bottom:150px;display:flex;align-items:center;justify-content:space-between;gap:30px}
.url{background:var(--acc);color:var(--accInk);font-weight:900;font-size:56px;padding:26px 46px;border-radius:999px;letter-spacing:-1px}
.foot p{font-size:32px;font-weight:700;color:var(--mute);text-align:right;line-height:1.25}
.fine{position:absolute;left:80px;right:80px;bottom:90px;font-size:24px;color:var(--mute);font-weight:600}
.blob{background:#fff;border-radius:64px;display:grid;place-items:center;overflow:hidden}
.blob img{max-width:86%;max-height:86%;object-fit:contain}
.stk{position:absolute;width:300px;height:300px;border-radius:50%;background:var(--hot);color:#fff;display:grid;place-items:center;text-align:center;font-weight:900;transform:rotate(-12deg);box-shadow:0 18px 40px rgba(0,0,0,.25)}
.stk b{font-size:104px;letter-spacing:-4px;line-height:1}.stk small{display:block;font-size:30px;letter-spacing:2px;margin-top:-6px}
"""
logo = f'<div class="logo"><img src="{icon}">Pádel<b>+</b></div>'
fecha = datetime.now().strftime("%d/%m")
info = {"file": out, "tipo": tipo, "tema": tema}

if tipo == "oferta":
    sel = con_foto(top[max(0, n - 1):], 1) or con_foto(top, 1)
    if not sel: sys.exit("Sin fotos de producto: no se genera la historia")
    p, f = sel[0]
    info.update(marca=p.get("m"), modelo=limpia(p), precio=eur(p["p"]), dto=dto(p))
    body = f'''<div class="top">{logo}<span class="chip">Oferta del día</span></div>
    <div class="blob" style="position:absolute;top:330px;left:80px;right:80px;height:860px"><img src="{f}"></div>
    <div class="stk" style="top:280px;right:40px"><div><b>-{dto(p)}%</b><small>HOY</small></div></div>
    <div style="position:absolute;top:1240px;left:80px;right:80px">
      <div style="font-size:34px;font-weight:800;letter-spacing:4px;text-transform:uppercase;color:var(--mute)">{html.escape(p.get("m") or "")}</div>
      <h1 style="font-size:{86 if len(limpia(p)) < 22 else 68}px;margin-top:12px">{html.escape(limpia(p))}</h1>
      <div style="display:flex;align-items:baseline;gap:24px;margin-top:30px"><span style="font-size:120px;font-weight:900;letter-spacing:-5px">{eur(p["p"])}</span><s style="font-size:50px;color:var(--mute);font-weight:700">{eur(p["o"])}</s></div></div>
    <div class="foot"><span class="url">padelmas.club</span><p>Enlace en<br>el perfil 👆</p></div>
    <div class="fine">Precio en Padel Market a {fecha}. Puede cambiar.</div>'''
elif tipo == "ofertas3":
    sel = con_foto(top, 3)
    if len(sel) < 3: sys.exit("Sin fotos suficientes: no se genera la historia")
    info.update(max=max(dto(p) for p, _ in sel))
    rows = "".join(f'''<div style="display:flex;gap:30px;align-items:center;background:#fff;border-radius:44px;padding:22px;margin-top:{0 if i == 0 else 26}px;position:relative">
      <div class="blob" style="width:210px;height:210px;flex:none;border-radius:30px;border:3px solid #e2e8f0"><img src="{f}"></div>
      <div style="flex:1;min-width:0;color:#0f172a"><div style="font-size:26px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#64748b">{html.escape(p.get("m") or "")}</div>
      <div style="font-size:44px;font-weight:900;letter-spacing:-1px;line-height:1.05;margin-top:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">{html.escape(limpia(p))}</div>
      <div style="display:flex;align-items:baseline;gap:16px;margin-top:14px"><span style="font-size:58px;font-weight:900;letter-spacing:-2px">{eur(p["p"])}</span><s style="font-size:30px;color:#94a3b8;font-weight:700">{eur(p["o"])}</s></div></div>
      <div style="position:absolute;top:-18px;left:-14px;background:var(--hot);color:#fff;font-weight:900;font-size:40px;padding:10px 20px;border-radius:22px;transform:rotate(-6deg)">-{dto(p)}%</div></div>''' for i, (p, f) in enumerate(sel))
    body = f'''<div class="top">{logo}<span class="chip">Top 3 de hoy</span></div>
    <h1 style="position:absolute;top:300px;left:80px;right:80px;font-size:118px">{"Palas a mitad<br>de precio" if min(dto(p) for p, _ in sel) >= 50 else f"Palas hasta<br>-{info['max']}%"}</h1>
    <div style="position:absolute;top:620px;left:80px;right:80px">{rows}</div>
    <div class="foot"><span class="url">padelmas.club</span><p>Todas las<br>ofertas 👆</p></div>
    <div class="fine">Precios en Padel Market a {fecha}. Pueden cambiar.</div>'''
elif tipo == "recomendador":
    sel = con_foto(top, 1)
    ph = f'<div class="blob" style="position:absolute;bottom:300px;right:70px;width:320px;height:400px;transform:rotate(6deg)"><img src="{sel[0][1]}"></div>' if sel else ""
    opts = "".join(f'<div style="background:var(--card);color:#0f172a;border-radius:999px;padding:30px 44px;font-size:46px;font-weight:800;margin-top:24px;display:flex;align-items:center;gap:22px;width:{w}px"><span style="font-size:52px">{e}</span>{t}</div>' for e, t, w in [("🎯", "Control", 520), ("⚖️", "Polivalente", 600), ("💥", "Potencia", 540)])
    body = f'''<div class="top">{logo}<span class="chip">Test · 1 min</span></div>
    <h1 style="position:absolute;top:310px;left:80px;right:80px;font-size:150px">¿Qué<br>pala<br>eres?</h1>
    <div style="position:absolute;top:860px;left:80px">{opts}<p style="font-size:36px;font-weight:700;color:var(--mute);margin-top:40px;max-width:520px;line-height:1.3">Te decimos la tuya según tu nivel, tu lado y tu juego.</p></div>
    {ph}
    <div class="foot"><span class="url">padelmas.club</span><p>Haz el<br>test 👆</p></div>'''
elif tipo == "liga":
    pod = "".join(f'<div style="flex:1;display:flex;flex-direction:column;align-items:center"><div style="width:150px;height:150px;border-radius:50%;background:{c};display:grid;place-items:center;font-size:80px;border:8px solid var(--bg);margin-bottom:-30px;z-index:1">{e}</div><div style="width:100%;height:{h}px;background:var(--card);border-radius:36px 36px 0 0;display:grid;place-items:center;font-size:110px;font-weight:900;color:#0f172a">{k}</div></div>' for e, c, h, k in [("🥈", "#cbd5e1", 300, 2), ("👑", "#d4ff3a", 420, 1), ("🥉", "#fdba74", 220, 3)])
    body = f'''<div class="top">{logo}<span class="chip">Ligas</span></div>
    <h1 style="position:absolute;top:310px;left:80px;right:80px;font-size:132px">¿Quién manda<br>en tu grupo?</h1>
    <div style="position:absolute;top:720px;left:80px;right:80px;background:#fff;color:#0f172a;border-radius:40px 40px 40px 8px;padding:30px 40px;font-size:42px;font-weight:600;line-height:1.3">Os he metido en la liga del jueves 🏆 Apuntad los partidos y a ver quién acaba primero 😏</div>
    <div style="position:absolute;bottom:330px;left:80px;right:80px;display:flex;align-items:flex-end;gap:24px">{pod}</div>
    <div class="foot"><span class="url">padelmas.club</span><p>Pádel → Ligas<br>→ Crear liga</p></div>'''
else:  # qr
    import qrcode, io
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=20, border=1); q.add_data("https://padelmas.club"); q.make(fit=True)
    b = io.BytesIO(); q.make_image(fill_color="#0f172a", back_color="white").save(b, format="PNG")
    qri = "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()
    body = f'''<div class="top">{logo}<span class="chip">Pásalo</span></div>
    <h1 style="position:absolute;top:310px;left:80px;right:80px;font-size:130px">¿Tu pala<br>está a tu<br>nivel?</h1>
    <div style="position:absolute;top:880px;left:80px;background:#fff;border-radius:48px;padding:40px;border:10px solid var(--acc)"><img src="{qri}" style="width:500px;height:500px;display:block"></div>
    <div class="foot"><span class="url">padelmas.club</span><p>Escanea o<br>enlace 👆</p></div>'''

async def main():
    async with async_playwright() as pw:
        br = await pw.chromium.launch(args=["--no-sandbox"]); pg = await br.new_page(viewport={"width": 1080, "height": 1920})
        await pg.set_content(f'<!DOCTYPE html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{body}</body></html>')
        await pg.wait_for_timeout(800)
        os.makedirs(os.path.dirname(os.path.join(ROOT, out)) or ".", exist_ok=True)
        await pg.screenshot(path=os.path.join(ROOT, out), type="jpeg", quality=88); await br.close()
    print(json.dumps(info, ensure_ascii=False))
asyncio.run(main())
