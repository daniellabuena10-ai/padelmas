#!/usr/bin/env python3
"""Genera una historia de Instagram (1080x1920) para @padelmas.app.

Uso: python3 scripts/ig_story.py <tipo> <archivo_salida.jpg> [n]
  tipo: oferta | qr | liga | recomendador | ofertas3
  n:    para "oferta", qué puesto del ranking de descuentos usar (1 = el mayor). Sirve para no repetir pala.
Imprime en la última línea un JSON con el archivo y datos útiles para el texto.
"""
import asyncio, json, re, sys, os, html, base64
from datetime import datetime
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tipo = sys.argv[1] if len(sys.argv) > 1 else "oferta"
out = sys.argv[2] if len(sys.argv) > 2 else f"ig/story-{tipo}.jpg"
n = int(sys.argv[3]) if len(sys.argv) > 3 else 1

d = json.load(open(os.path.join(ROOT, "data/catalogo.json")))
def dto(p): return round(100 * (1 - p["p"] / p["o"])) if p.get("o") and p["o"] > p["p"] else 0
def limpia(p):
    s = re.sub(r"\s*\((pala|zapatillas?)\)\s*$", "", p["n"], flags=re.I).split(" + ")[0]
    m = p.get("m") or ""
    if s.lower().startswith(m.lower() + " "): s = s[len(m) + 1:]
    return s.strip()
eur = lambda x: (f"{x:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")).replace(",00", "") + " €"
of = [p for p in d["p"] if p["c"] == "pala" and not p.get("x") and dto(p) >= 20 and " + " not in p["n"]
      and not re.search(r"\bjr\b|junior|niñ|nino|kids", p["n"].lower())]
of.sort(key=lambda p: (-dto(p), p["p"]))
TOPM = ("bullpadel", "nox", "adidas", "head", "babolat", "siux", "star vie", "starvie", "black crown", "wilson", "drop shot", "kombat", "vibor", "royal", "dunlop", "varlion", "joma")
of.sort(key=lambda p: (0 if (p.get("m") or "").lower().startswith(TOPM) else 1, -dto(p), p["p"]))
vistos, top = set(), []
for p in of:
    k = re.sub(r"\b(20\d\d)\b.*", "", limpia(p).lower())[:22]
    if k in vistos: continue
    vistos.add(k); top.append(p)

icon = "data:image/png;base64," + base64.b64encode(open(os.path.join(ROOT, "icon-512.png"), "rb").read()).decode()
CSS = """*{margin:0;padding:0;box-sizing:border-box}body{width:1080px;height:1920px;overflow:hidden;font-family:Inter,Arial,sans-serif;background:#0f172a;color:#fff;position:relative}
.wrap{padding:150px 90px 0}.logo{display:flex;align-items:center;gap:20px;font-weight:900;font-size:50px}.logo img{width:84px;height:84px;border-radius:22px}.logo b{color:#d4ff3a}
.tag{display:inline-block;margin-top:120px;background:#d4ff3a;color:#0b0f02;font-weight:900;font-size:40px;padding:14px 30px;border-radius:99px;text-transform:uppercase;letter-spacing:1px}
h1{font-size:128px;line-height:.98;letter-spacing:-5px;font-weight:900;margin-top:50px}h1 em{font-style:normal;color:#d4ff3a}
.sub{font-size:50px;line-height:1.3;color:#cbd5e1;margin-top:46px;font-weight:500}
.card{margin-top:70px;background:#fff;color:#0f172a;border-radius:48px;padding:56px}
.br{font-size:36px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:2px}.md{font-size:70px;font-weight:900;letter-spacing:-2px;line-height:1.05;margin-top:8px}
.pr{display:flex;align-items:baseline;gap:26px;margin-top:40px}.pr b{font-size:120px;font-weight:900;letter-spacing:-4px}.pr s{font-size:52px;color:#94a3b8}
.off{display:inline-block;background:#e11d48;color:#fff;font-weight:900;font-size:64px;padding:12px 34px;border-radius:30px;margin-top:30px}
.row{display:flex;align-items:center;gap:30px;padding:34px 0;border-top:3px solid #e2e8f0}.row:first-child{border-top:0;padding-top:0}.row .o{flex:none;background:#e11d48;color:#fff;font-weight:900;font-size:48px;padding:16px 22px;border-radius:24px}
.row .nm{flex:1;min-width:0}.row .nm div{font-size:30px;color:#64748b;font-weight:800;text-transform:uppercase}.row .nm p{font-size:46px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.row .p{font-size:54px;font-weight:900;white-space:nowrap}
.cta{position:absolute;left:90px;right:90px;bottom:260px;text-align:center}.url{display:inline-block;background:#d4ff3a;color:#0b0f02;font-size:72px;font-weight:900;padding:34px 60px;border-radius:40px}
.cta p{font-size:40px;color:#94a3b8;margin-top:34px;font-weight:600}
.qr{background:#fff;border-radius:40px;padding:40px;display:inline-block;margin-top:70px;border:10px solid #d4ff3a}.qr img{width:520px;height:520px;display:block}
.pts{margin-top:70px}.pt{display:flex;gap:30px;align-items:center;margin-bottom:46px}.pt span{width:110px;height:110px;border-radius:30px;background:#d4ff3a;display:grid;place-items:center;font-size:58px;flex:none}.pt b{font-size:52px;line-height:1.15}
.fine{position:absolute;left:90px;right:90px;bottom:120px;font-size:28px;color:#64748b;text-align:center}"""
logo = f'<div class="logo"><img src="{icon}">Pádel<b>+</b></div>'
fecha = datetime.now().strftime("%d/%m")
info = {"file": out, "tipo": tipo}

if tipo == "oferta":
    p = top[min(n, len(top)) - 1]
    info.update(marca=p.get("m"), modelo=limpia(p), precio=eur(p["p"]), dto=dto(p))
    body = f'''<div class="wrap">{logo}<div class="tag">🔥 Oferta del día</div><h1>Esta pala está<br><em>a -{dto(p)}%</em></h1>
      <div class="card"><div class="br">{html.escape(p.get("m") or "")}</div><div class="md">{html.escape(limpia(p))}</div>
      <div class="pr"><b>{eur(p["p"])}</b><s>{eur(p["o"])}</s></div></div></div>
      <div class="cta"><div class="url">padelmas.club</div><p>Más ofertas de palas, al día 👆</p></div><div class="fine">Precio en Padel Market a {fecha}. Puede cambiar.</div>'''
elif tipo == "ofertas3":
    rows = "".join(f'<div class="row"><div class="o">-{dto(p)}%</div><div class="nm"><div>{html.escape(p.get("m") or "")}</div><p>{html.escape(limpia(p))}</p></div><div class="p">{eur(p["p"])}</div></div>' for p in top[:3])
    info.update(max=dto(top[0]))
    body = f'''<div class="wrap">{logo}<div class="tag">🔥 Top 3 de hoy</div><h1>Palas<br><em>rebajadas</em></h1><div class="card">{rows}</div></div>
      <div class="cta"><div class="url">padelmas.club</div><p>Todas las ofertas, al día 👆</p></div><div class="fine">Precios en Padel Market a {fecha}. Pueden cambiar.</div>'''
elif tipo == "qr":
    import qrcode, io
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=20, border=1); q.add_data("https://padelmas.club"); q.make(fit=True)
    b = io.BytesIO(); q.make_image(fill_color="#0f172a", back_color="white").save(b, format="PNG")
    qri = "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()
    body = f'''<div class="wrap" style="text-align:center">{logo.replace('class="logo"', 'class="logo" style="justify-content:center"')}<h1 style="margin-top:150px">¿Tu <em>pala</em><br>está a tu nivel?</h1>
      <p class="sub">Descúbrelo en 1 minuto y cómprala con descuento.</p><div class="qr"><img src="{qri}"></div></div>
      <div class="cta" style="bottom:200px"><div class="url">padelmas.club</div></div>'''
elif tipo == "liga":
    body = f'''<div class="wrap">{logo}<div class="tag">🏆 Novedad</div><h1>Crea tu <em>liga</em><br>con tu grupo</h1>
      <div class="pts"><div class="pt"><span>👥</span><b>Invita a tus amigos<br>por WhatsApp</b></div><div class="pt"><span>📈</span><b>Apuntad partidos y<br>el ranking se mueve</b></div><div class="pt"><span>👑</span><b>A ver quién va<br>primero esta semana</b></div></div></div>
      <div class="cta"><div class="url">padelmas.club</div><p>Pádel → Ligas → Crear liga</p></div>'''
else:  # recomendador
    body = f'''<div class="wrap">{logo}<div class="tag">🎾 Tu pala ideal</div><h1>6 preguntas.<br><em>1 minuto.</em></h1>
      <p class="sub">Y si quieres, nos cuentas tu juego con tus palabras.</p>
      <div class="pts" style="margin-top:60px"><div class="pt"><span>✅</span><b>Tu pala ideal con<br>% de afinidad</b></div><div class="pt"><span>🔥</span><b>Con el precio de hoy<br>y su descuento</b></div></div></div>
      <div class="cta"><div class="url">padelmas.club</div><p>Pruébalo ahora 👆</p></div>'''

async def main():
    async with async_playwright() as pw:
        br = await pw.chromium.launch(args=["--no-sandbox"]); pg = await br.new_page(viewport={"width": 1080, "height": 1920})
        await pg.set_content(f'<!DOCTYPE html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&display=swap" rel="stylesheet"><style>{CSS}</style></head><body>{body}</body></html>')
        await pg.wait_for_timeout(800)
        os.makedirs(os.path.dirname(os.path.join(ROOT, out)), exist_ok=True)
        await pg.screenshot(path=os.path.join(ROOT, out), type="jpeg", quality=88); await br.close()
    print(json.dumps(info, ensure_ascii=False))
asyncio.run(main())
