#!/usr/bin/env python3
"""Genera un carrusel de Instagram (1080x1350) con las palas más rebajadas del catálogo real.

Uso: python3 scripts/ig_ofertas.py <prefijo> [titulo] [etiqueta]
  prefijo   nombre de los archivos: ig/<prefijo>-1.jpg, -2.jpg ...
  titulo    texto grande de la portada (por defecto "Las palas más rebajadas de la semana")
  etiqueta  texto pequeño encima del título (por defecto "Ofertas de la semana")
Imprime en la última línea un JSON con los archivos generados y el descuento máximo.
"""
import asyncio, json, re, sys, html, os
from datetime import datetime
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pref = sys.argv[1] if len(sys.argv) > 1 else "ofertas"
titulo = sys.argv[2] if len(sys.argv) > 2 else "Las palas más rebajadas de la semana"
etiqueta = sys.argv[3] if len(sys.argv) > 3 else "Ofertas de la semana"

d = json.load(open(os.path.join(ROOT, "data/catalogo.json")))
def dto(p): return round(100 * (1 - p["p"] / p["o"])) if p.get("o") and p["o"] > p["p"] else 0
def limpia(p):
    s = re.sub(r"\s*\((pala|zapatillas?)\)\s*$", "", p["n"], flags=re.I)
    s = s.split(" + ")[0]
    m = p.get("m") or ""
    if s.lower().startswith(m.lower() + " "): s = s[len(m) + 1:]
    return s.strip()
of = [p for p in d["p"] if p["c"] == "pala" and not p.get("x") and dto(p) >= 25 and " + " not in p["n"]
      and not re.search(r"\bjr\b|junior|niñ|nino|kids", p["n"].lower())]
of.sort(key=lambda p: (-dto(p), p["p"]))
vistos, top = set(), []
for p in of:
    k = re.sub(r"\b(20\d\d)\b.*", "", limpia(p).lower())[:22]
    if k in vistos: continue
    vistos.add(k); top.append(p)
    if len(top) == 10: break
eur = lambda n: (f"{n:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")).replace(",00", "") + " €"
fecha = datetime.now().strftime("%d/%m")
maxd = dto(top[0]) if top else 0

CSS = """*{margin:0;padding:0;box-sizing:border-box}body{width:1080px;height:1350px;font-family:Inter,Arial,sans-serif;overflow:hidden}
.logo{display:flex;align-items:center;gap:16px;font-weight:900;font-size:40px}.logo img{width:64px;height:64px;border-radius:18px}.logo b{color:#d4ff3a}
.dark{background:#0f172a;color:#fff;height:100%;padding:80px}.light{background:#fff;color:#0f172a;height:100%;padding:70px 70px}
.tag{display:inline-block;margin-top:110px;background:#d4ff3a;color:#0b0f02;font-weight:900;font-size:34px;padding:12px 24px;border-radius:99px;text-transform:uppercase;letter-spacing:1px}
h1{font-size:118px;line-height:.98;letter-spacing:-4px;font-weight:900;margin-top:40px}h1 em{font-style:normal;color:#d4ff3a}
.hasta{margin-top:56px;font-size:46px;font-weight:700;color:#cbd5e1}.hasta b{font-size:150px;color:#fff;display:block;letter-spacing:-5px;line-height:1}
.sw{position:absolute;bottom:80px;left:80px;right:80px;display:flex;justify-content:space-between;font-size:32px;font-weight:700;color:#94a3b8}
h2{font-size:64px;letter-spacing:-2px;font-weight:900;margin:40px 0 20px}
.row{display:flex;align-items:center;gap:26px;padding:42px 0;border-top:2px solid #e2e8f0}
.off{flex:none;width:150px;height:96px;border-radius:24px;background:#e11d48;color:#fff;display:grid;place-items:center;font-size:46px;font-weight:900;letter-spacing:-1px}
.nm{flex:1;min-width:0}.br{font-size:26px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1px}.md{font-size:42px;font-weight:800;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pr{text-align:right;flex:none}.pr b{display:block;font-size:46px;font-weight:900;letter-spacing:-1px}.pr s{font-size:28px;color:#94a3b8}
.ft{position:absolute;left:70px;right:70px;bottom:56px;font-size:26px;color:#64748b;font-weight:600}
.cta h1{font-size:104px;margin-top:150px}.url{margin-top:70px;display:inline-block;background:#d4ff3a;color:#0b0f02;font-size:58px;font-weight:900;padding:26px 44px;border-radius:30px}
.cta p{font-size:42px;color:#cbd5e1;margin-top:50px;line-height:1.35;font-weight:500}"""
import base64
icon = "data:image/png;base64," + base64.b64encode(open(os.path.join(ROOT, "icon-512.png"), "rb").read()).decode()
logo = f'<div class="logo"><img src="{icon}">Pádel<b>+</b></div>'
def page(body): return f'<!DOCTYPE html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&display=swap" rel="stylesheet"><style>{CSS}</style></head><body style="position:relative">{body}</body></html>'
slides = [page(f'<div class="dark">{logo}<div class="tag">🔥 {html.escape(etiqueta)}</div><h1>{html.escape(titulo)}</h1><div class="hasta">hasta<b>-{maxd}%</b></div><div class="sw"><span>Desliza →</span><span>@padelmas.app</span></div></div>')]
for i in range(0, len(top), 5):
    rows = "".join(f'<div class="row"><div class="off">-{dto(p)}%</div><div class="nm"><div class="br">{html.escape(p.get("m") or "")}</div><div class="md">{html.escape(limpia(p))}</div></div><div class="pr"><b>{eur(p["p"])}</b><s>{eur(p["o"])}</s></div></div>' for p in top[i:i + 5])
    slides.append(page(f'<div class="light">{logo}<h2>{"Top 5" if i == 0 else "Y estas también"} 🎾</h2>{rows}<div class="ft">Precios en Padel Market a {fecha}. Pueden cambiar: mira el precio de hoy en la app.</div></div>'))
slides.append(page(f'<div class="dark cta">{logo}<h1>Todas las ofertas, <em>al día</em></h1><div class="url">padelmas.club</div><p>Y descubre qué pala va con tu juego en 1 minuto.<br>Enlace en el perfil 👆</p></div>'))

async def main():
    os.makedirs(os.path.join(ROOT, "ig"), exist_ok=True)
    out = []
    async with async_playwright() as pw:
        br = await pw.chromium.launch(args=["--no-sandbox"])
        pg = await br.new_page(viewport={"width": 1080, "height": 1350})
        for k, s in enumerate(slides, 1):
            await pg.set_content(s); await pg.wait_for_timeout(700)
            f = f"ig/{pref}-{k}.jpg"
            await pg.screenshot(path=os.path.join(ROOT, f), type="jpeg", quality=88); out.append(f)
        await br.close()
    print(json.dumps({"files": out, "max": maxd, "n": len(top)}))
asyncio.run(main())
