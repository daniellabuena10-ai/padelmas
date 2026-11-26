#!/usr/bin/env python3
"""Carruseles de Instagram (1080x1350) con el estilo de la web: fondo oscuro, lima y fotos reales.

Uso: python3 scripts/ig_posts.py <modo> <prefijo> [titulo] [etiqueta]
  modo: presentacion | quepala | compite | ofertas | suelas
  Genera ig/<prefijo>-1.jpg, -2.jpg ... e imprime en la última línea un JSON con los archivos y datos para el texto.
  titulo/etiqueta solo se usan en "ofertas" (para Black Friday, Cyber Monday...).
Las fotos de producto se descargan del catálogo; en un sitio sin internet se puede probar con STORY_FAKEIMG=icon-512.png.
"""
import asyncio, json, re, sys, os, html, base64, urllib.request
from datetime import datetime
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
modo = sys.argv[1] if len(sys.argv) > 1 else "presentacion"
pref = sys.argv[2] if len(sys.argv) > 2 else modo
titulo = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else ""
etiqueta = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] else ""

d = json.load(open(os.path.join(ROOT, "data/catalogo.json")))
def dto(p): return round(100 * (1 - p["p"] / p["o"])) if p.get("o") and p["o"] > p["p"] else 0
def limpia(p):
    s = re.sub(r"\s*\((pala|zapatillas?)\)\s*$", "", p["n"], flags=re.I).split(" + ")[0]
    m = p.get("m") or ""
    if s.lower().startswith(m.lower() + " "): s = s[len(m) + 1:]
    return s.strip()
eur = lambda x: (f"{x:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")).replace(",00", "") + " €"
TOPM = ("bullpadel", "nox", "adidas", "head", "babolat", "siux", "star vie", "starvie", "black crown", "wilson", "drop shot", "kombat", "vibor", "royal", "dunlop", "varlion", "joma", "asics", "mizuno", "k-swiss")
def ranking(cat, minimo=20, extra=lambda p: True):
    L = [p for p in d["p"] if p["c"] == cat and not p.get("x") and p.get("f") and dto(p) >= minimo and " + " not in p["n"]
         and not re.search(r"\bjr\b|junior|niñ|nino|kids", p["n"].lower()) and extra(p)]
    L.sort(key=lambda p: (0 if (p.get("m") or "").lower().startswith(TOPM) else 1, -dto(p), p["p"]))
    vistos, out = set(), []
    for p in L:
        k = re.sub(r"\b(20\d\d)\b.*", "", limpia(p).lower())[:22]
        if k not in vistos: vistos.add(k); out.append(p)
    return out

def b64(path, mime): return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()
FAKE = os.environ.get("STORY_FAKEIMG")
def foto(p):
    if FAKE: return b64(os.path.join(ROOT, FAKE), "image/png")
    u = p["f"] + ("&" if "?" in p["f"] else "?") + "width=900"
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 padelmas-ig"}), timeout=20)
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
shot = {i: b64(os.path.join(ROOT, f"img/land{i}.jpg"), "image/jpeg") for i in (1, 2, 3)}
fonts = "".join(f"@font-face{{font-family:Inter;font-weight:{w};src:url({b64(os.path.join(ROOT, f'fonts/inter-latin-{w}-normal.woff2'), 'font/woff2')}) format('woff2')}}" for w in (500, 600, 700, 800, 900))
fonts += f"@font-face{{font-family:Barlow;font-weight:700;src:url({b64(os.path.join(ROOT, 'fonts/barlow-condensed-latin-700-normal.woff2'), 'font/woff2')}) format('woff2')}}"
CSS = fonts + """*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;font-family:Inter,Arial,sans-serif;background:#0f172a;color:#fff;position:relative}
.glow{position:absolute;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,rgba(212,255,58,.16),transparent 65%);top:-300px;right:-300px}
.hd{position:absolute;top:64px;left:72px;right:72px;display:flex;align-items:center;justify-content:space-between}
.logo{display:flex;align-items:center;gap:14px;font-weight:900;font-size:38px}.logo img{width:60px;height:60px;border-radius:17px}.logo b{color:#d4ff3a}
.num{font-weight:800;font-size:26px;color:#94a3b8}
.tag{display:inline-block;font-size:26px;font-weight:800;letter-spacing:2px;color:#0f172a;background:#d4ff3a;border-radius:999px;padding:10px 22px;text-transform:uppercase}
h1{font-weight:900;letter-spacing:-4px;line-height:.95}h1 em{font-style:normal;color:#d4ff3a}
.sub{font-size:38px;line-height:1.3;color:#cbd5e1;font-weight:500}.sub b{color:#fff}
.ft{position:absolute;left:72px;right:72px;bottom:64px;display:flex;align-items:center;justify-content:space-between}
.url{font-weight:900;font-size:34px}.url b{color:#d4ff3a}
.sw{background:#d4ff3a;color:#0f172a;font-weight:900;font-size:28px;border-radius:999px;padding:14px 26px}
.blob{background:#fff;border-radius:44px;display:flex;align-items:center;justify-content:center;overflow:hidden}.blob img{width:86%;height:86%;object-fit:contain}
.badge{position:absolute;background:#ff5a36;color:#fff;font-weight:900;border-radius:20px;transform:rotate(-6deg);box-shadow:0 12px 28px rgba(0,0,0,.3)}
.card{background:#1e293b;border:2px solid #334155;border-radius:36px}
.ph{background:#475569;border-radius:44px;padding:10px;box-shadow:0 30px 60px rgba(0,0,0,.4)}.ph img{display:block;width:100%;border-radius:36px}
.li{display:flex;gap:22px;align-items:flex-start;font-size:36px;line-height:1.3;color:#cbd5e1;margin-top:28px}.li i{font-style:normal;font-size:44px;width:60px;text-align:center;flex:none}.li b{color:#fff}
.price{font-weight:900;letter-spacing:-3px}.old{color:#94a3b8;font-weight:700;text-decoration:line-through}
"""
slides = []
def S(body, n_total=None):
    slides.append(body)
def hd(i, n): return f'<div class="glow"></div><div class="hd"><div class="logo"><img src="{icon}">Pádel<b>+</b></div><span class="num">{i}/{n}</span></div>'
def ft(last=False): return f'<div class="ft"><span class="url">padel<b>mas</b>.club</span>' + ('<span class="sw" style="background:#fff">Enlace en el perfil 👆</span>' if last else '<span class="sw">Desliza →</span>') + '</div>'
def podio():
    return ('<div style="display:flex;align-items:flex-end;gap:18px;width:520px">' + "".join(
        f'<div style="flex:1;text-align:center"><div style="font-size:64px;margin-bottom:10px">{e}</div><div style="height:{h}px;border-radius:26px 26px 8px 8px;background:{bg};color:{c};font-weight:900;font-size:44px;padding-top:22px">{t}</div></div>'
        for e, h, bg, c, t in [("🥈", 210, "#d4ff3a", "#0f172a", "TÚ"), ("👑", 290, "#334155", "#fff", "1º"), ("🥉", 150, "#334155", "#fff", "3º")]) + '</div>')
def anillo(v="3,39", pct=.48, size=330):
    off = round(314 * (1 - pct))
    return f'<div style="position:relative;width:{size}px;height:{size}px"><svg viewBox="0 0 120 120" style="width:100%;height:100%"><circle cx="60" cy="60" r="50" fill="none" stroke="#334155" stroke-width="10"/><circle cx="60" cy="60" r="50" fill="none" stroke="#d4ff3a" stroke-width="10" stroke-linecap="round" stroke-dasharray="314" stroke-dashoffset="{off}" transform="rotate(-90 60 60)"/></svg><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center"><b style="font-family:Barlow;font-size:{size*0.33:.0f}px;line-height:1">{v}</b><span style="font-size:28px;color:#94a3b8;font-weight:700">de 7</span></div></div>'
info = {"modo": modo, "files": []}
fecha = datetime.now().strftime("%d/%m")

if modo == "presentacion":
    pal = con_foto(ranking("pala", 30), 3)
    if len(pal) < 3: sys.exit("Sin fotos suficientes")
    N = 6; mx = max(dto(p) for p, _ in pal); info["max"] = mx
    S(f'''{hd(1,N)}<div style="position:absolute;top:200px;left:72px;right:72px"><span class="tag">Bienvenido a Pádel+</span>
      <h1 style="font-size:110px;margin-top:34px">Todo tu pádel,<br><em>en una sola app.</em></h1></div>
      <div style="position:absolute;bottom:170px;left:72px;right:72px;display:flex;gap:26px;align-items:flex-end;justify-content:center">
      <div class="ph" style="width:280px;transform:rotate(-6deg) translateY(30px)"><img src="{shot[1]}"></div><div class="ph" style="width:300px;z-index:1"><img src="{shot[2]}"></div><div class="ph" style="width:280px;transform:rotate(6deg) translateY(30px)"><img src="{shot[3]}"></div></div>{ft()}''')
    p, f = pal[0]
    S(f'''{hd(2,N)}<div style="position:absolute;top:190px;left:72px;right:72px"><span class="tag">🎾 Test de 1 minuto</span>
      <h1 style="font-size:104px;margin-top:30px">Descubre tu<br><em>pala ideal.</em></h1>
      <p class="sub" style="margin-top:30px;max-width:560px">Te preguntamos tu <b>nivel</b>, tu <b>lado</b>, si buscas <b>potencia o control</b> y si te molesta el codo.</p></div>
      <div class="blob" style="position:absolute;right:72px;bottom:190px;width:380px;height:520px;transform:rotate(5deg)"><img src="{f}"></div>
      <div style="position:absolute;right:300px;bottom:620px;background:#d4ff3a;color:#0f172a;font-weight:900;font-size:40px;padding:14px 24px;border-radius:22px;transform:rotate(-4deg)">98% para ti</div>{ft()}''')
    cards = "".join(f'''<div style="position:relative;flex:1"><div class="blob" style="height:380px;border-radius:36px"><img src="{f}"></div><div class="badge" style="top:-18px;left:-10px;font-size:40px;padding:10px 20px">-{dto(p)}%</div>
      <div style="margin-top:20px;font-size:24px;font-weight:800;letter-spacing:2px;color:#94a3b8;text-transform:uppercase">{html.escape(p.get("m") or "")}</div>
      <div style="display:flex;align-items:baseline;gap:12px;margin-top:6px"><span class="price" style="font-size:56px">{eur(p["p"])}</span></div><div class="old" style="font-size:28px">{eur(p["o"])}</div></div>''' for p, f in pal)
    S(f'''{hd(3,N)}<div style="position:absolute;top:190px;left:72px;right:72px"><span class="tag">🛒 Ofertas de hoy</span>
      <h1 style="font-size:100px;margin-top:30px">Y la compras<br><em>desde la app.</em></h1>
      <p class="sub" style="margin-top:24px">Con el precio de hoy y hasta un <b>-{mx}%</b>.</p></div>
      <div style="position:absolute;left:72px;right:72px;bottom:170px;display:flex;gap:28px">{cards}</div>{ft()}''')
    S(f'''{hd(4,N)}<div style="position:absolute;top:190px;left:72px;right:72px"><span class="tag">🏆 Tu nivel y ranking</span>
      <h1 style="font-size:104px;margin-top:30px">Compite con<br><em>tus amigos.</em></h1>
      <p class="sub" style="margin-top:24px;max-width:860px">Apunta tus partidos y tu nivel sube o baja según contra quién ganas.</p></div>
      <div style="position:absolute;left:72px;right:72px;bottom:190px;display:flex;align-items:flex-end;justify-content:space-between">{anillo()}{podio()}</div>{ft()}''')
    S(f'''{hd(5,N)}<div style="position:absolute;top:190px;left:72px;right:72px"><span class="tag">👥 Comunidad</span>
      <h1 style="font-size:104px;margin-top:30px">Tu pádel,<br><em>con los tuyos.</em></h1>
      <div class="li"><i>🏟️</i><span><b>Crea una liga</b> con tu grupo e invítales por WhatsApp</span></div>
      <div class="li"><i>💬</i><span><b>Comparte tus partidos</b> y sigue a tus amigos</span></div>
      <div class="li"><i>⭐</i><span><b>Opiniones reales</b> de cada pala, de jugadores de tu nivel</span></div>
      <div class="li"><i>📍</i><span><b>Pistas cerca de ti</b>, con cómo llegar y dónde reservar</span></div></div>{ft()}''')
    S(f'''<div class="glow" style="top:200px;right:-200px"></div><div class="hd"><div class="logo"><img src="{icon}">Pádel<b>+</b></div><span class="num">6/6</span></div>
      <div style="position:absolute;top:300px;left:72px;right:72px;text-align:center"><h1 style="font-size:112px">Únete a la<br><em>comunidad.</em></h1>
      <p class="sub" style="margin-top:30px">Desde el móvil, sin descargar nada.<br>En 30 segundos, con tu email.</p>
      <div style="display:inline-block;margin-top:70px;background:#d4ff3a;color:#0f172a;font-weight:900;font-size:72px;padding:30px 60px;border-radius:999px;letter-spacing:-2px">padelmas.club</div>
      <p style="margin-top:34px;font-size:36px;font-weight:700;color:#cbd5e1">Enlace en el perfil 👆</p></div>''')

elif modo == "quepala":
    pal = con_foto(ranking("pala", 25), 3)
    if len(pal) < 3: sys.exit("Sin fotos suficientes")
    N = 4
    S(f'''{hd(1,N)}<div style="position:absolute;top:200px;left:72px;right:72px"><span class="tag">Test · 1 minuto</span>
      <h1 style="font-size:150px;margin-top:34px">¿Qué pala<br><em>eres?</em></h1></div>
      <div style="position:absolute;left:72px;right:72px;bottom:180px;display:flex;gap:24px;align-items:flex-end">''' +
      "".join(f'<div class="blob" style="flex:1;height:{h}px;transform:rotate({r}deg)"><img src="{f}"></div>' for (p, f), h, r in zip(pal, (420, 500, 420), (-5, 0, 5))) + f'''</div>{ft()}''')
    chips = "".join(f'<div style="background:#1e293b;border:2px solid #334155;border-radius:999px;padding:22px 34px;font-size:38px;font-weight:800;display:inline-flex;gap:16px;align-items:center;margin:0 18px 22px 0"><span style="font-size:44px">{e}</span>{t}</div>' for e, t in [("📊", "Tu nivel"), ("↔️", "Drive o revés"), ("💥", "Potencia o control"), ("💪", "Codo u hombro"), ("🪶", "Si te pesa la pala"), ("💶", "Tu presupuesto")])
    S(f'''{hd(2,N)}<div style="position:absolute;top:190px;left:72px;right:72px"><span class="tag">Te preguntamos</span>
      <h1 style="font-size:100px;margin-top:30px">6 cosas sobre<br><em>tu juego.</em></h1><div style="margin-top:56px">{chips}</div>
      <p class="sub" style="margin-top:20px">Y si quieres, nos cuentas con tus palabras cómo juegas.</p></div>{ft()}''')
    S(f'''{hd(3,N)}<div style="position:absolute;top:190px;left:72px;width:520px"><span class="tag">Tu resultado</span>
      <h1 style="font-size:78px;margin-top:30px">Y te decimos<br><em>cuál es<br>la tuya.</em></h1>
      <p class="sub" style="margin-top:30px">Con foto, el % que encaja contigo, por qué y el precio de hoy.</p>
      <p class="sub" style="margin-top:30px"><b>🛒 Y la compras desde la app.</b></p></div>
      <div class="ph" style="position:absolute;right:72px;top:220px;width:400px;transform:rotate(4deg)"><img src="{shot[1]}"></div>{ft()}''')
    S(f'''<div class="glow" style="top:200px;right:-200px"></div><div class="hd"><div class="logo"><img src="{icon}">Pádel<b>+</b></div><span class="num">4/4</span></div>
      <div style="position:absolute;top:320px;left:72px;right:72px;text-align:center"><h1 style="font-size:120px">Haz el test<br><em>ahora.</em></h1>
      <p class="sub" style="margin-top:30px">Sin registrarte. 1 minuto.</p>
      <div style="display:inline-block;margin-top:70px;background:#d4ff3a;color:#0f172a;font-weight:900;font-size:72px;padding:30px 60px;border-radius:999px;letter-spacing:-2px">padelmas.club</div>
      <p style="margin-top:34px;font-size:36px;font-weight:700;color:#cbd5e1">Enlace en el perfil 👆</p></div>''')

elif modo == "compite":
    N = 5
    S(f'''{hd(1,N)}<div style="position:absolute;top:200px;left:72px;right:72px"><span class="tag">🏆 Ranking y ligas</span>
      <h1 style="font-size:130px;margin-top:34px">¿Quién manda<br><em>en tu grupo?</em></h1></div>
      <div style="position:absolute;left:0;right:0;bottom:180px;display:flex;justify-content:center">{podio()}</div>{ft()}''')
    S(f'''{hd(2,N)}<div style="position:absolute;top:190px;left:72px;right:72px"><span class="tag">📈 Tu nivel real</span>
      <h1 style="font-size:100px;margin-top:30px">Del 1 al 7,<br><em>partido a partido.</em></h1>
      <p class="sub" style="margin-top:24px;max-width:900px">Apunta el resultado en 10 segundos. Si ganas a alguien de más nivel, subes más.</p></div>
      <div style="position:absolute;left:72px;right:72px;bottom:190px;display:flex;align-items:center;gap:60px">{anillo(size=380)}
      <div><div style="background:#d4ff3a;color:#0f172a;font-weight:900;font-size:44px;border-radius:999px;padding:14px 28px;display:inline-block">▲ +0,14 esta semana</div><p class="sub" style="margin-top:24px">Intermedio · 12 partidos</p></div></div>{ft()}''')
    S(f'''{hd(3,N)}<div style="position:absolute;top:190px;left:72px;right:72px"><span class="tag">🏟️ Ligas</span>
      <h1 style="font-size:100px;margin-top:30px">Crea tu liga<br><em>en 1 minuto.</em></h1></div>
      <div style="position:absolute;left:72px;right:200px;top:640px;background:#fff;color:#0f172a;border-radius:40px 40px 40px 8px;padding:34px 40px;font-size:42px;font-weight:600;line-height:1.3">Os he metido en la liga del jueves 🏆 Apuntad los partidos y a ver quién acaba primero 😏</div>
      <div style="position:absolute;right:72px;top:930px;background:#d4ff3a;color:#0f172a;border-radius:40px 40px 8px 40px;padding:28px 36px;font-size:42px;font-weight:700">Voy a por ti 😂</div>
      <p class="sub" style="position:absolute;left:72px;bottom:190px">Invítales por WhatsApp con un enlace.</p>{ft()}''')
    S(f'''{hd(4,N)}<div style="position:absolute;top:190px;left:72px;right:72px"><span class="tag">👥 Comunidad</span>
      <h1 style="font-size:100px;margin-top:30px">Mucho más que<br><em>un ranking.</em></h1>
      <div class="li"><i>💬</i><span><b>Comparte tus partidos</b> y sigue a tus amigos</span></div>
      <div class="li"><i>⭐</i><span><b>Opiniones reales</b> de cada pala, de jugadores de tu nivel</span></div>
      <div class="li"><i>🎾</i><span><b>Tu pala ideal</b> con un test de 1 minuto</span></div>
      <div class="li"><i>🔥</i><span><b>Ofertas</b> y la compras desde la app</span></div></div>{ft()}''')
    S(f'''<div class="glow" style="top:200px;right:-200px"></div><div class="hd"><div class="logo"><img src="{icon}">Pádel<b>+</b></div><span class="num">5/5</span></div>
      <div style="position:absolute;top:300px;left:72px;right:72px;text-align:center"><h1 style="font-size:112px">Únete a la<br><em>comunidad.</em></h1>
      <p class="sub" style="margin-top:30px">Desde el móvil, sin descargar nada.<br>En 30 segundos, con tu email.</p>
      <div style="display:inline-block;margin-top:70px;background:#d4ff3a;color:#0f172a;font-weight:900;font-size:72px;padding:30px 60px;border-radius:999px;letter-spacing:-2px">padelmas.club</div>
      <p style="margin-top:34px;font-size:36px;font-weight:700;color:#cbd5e1">Enlace en el perfil 👆</p></div>''')

elif modo == "ofertas":
    pal = con_foto(ranking("pala", 25), 6)
    if len(pal) < 4: sys.exit("Sin fotos suficientes")
    N = len(pal) + 2; mx = max(dto(p) for p, _ in pal); info.update(max=mx, n=len(pal), marcas=sorted({p.get("m") for p, _ in pal if p.get("m")}))
    tit = titulo or "Las palas más rebajadas de la semana"; et = etiqueta or "Ofertas de la semana"
    p0, f0 = pal[0]
    S(f'''{hd(1,N)}<div style="position:absolute;top:200px;left:72px;right:72px"><span class="tag">🔥 {html.escape(et)}</span>
      <h1 style="font-size:{110 if len(tit) < 34 else 92}px;margin-top:34px">{html.escape(tit)}</h1>
      <div style="margin-top:30px;font-size:64px;font-weight:900;color:#d4ff3a">Hasta -{mx}%</div></div>
      <div class="blob" style="position:absolute;right:72px;bottom:170px;width:460px;height:560px;transform:rotate(5deg)"><img src="{f0}"></div>
      <div class="badge" style="right:430px;bottom:560px;font-size:60px;padding:16px 30px">-{dto(p0)}%</div>{ft()}''')
    for i, (p, f) in enumerate(pal, 2):
        S(f'''{hd(i,N)}<div class="blob" style="position:absolute;top:170px;left:72px;right:72px;height:700px"><img src="{f}"></div>
          <div class="badge" style="top:150px;right:50px;font-size:70px;padding:18px 34px">-{dto(p)}%</div>
          <div style="position:absolute;top:910px;left:72px;right:72px"><div style="font-size:30px;font-weight:800;letter-spacing:3px;color:#94a3b8;text-transform:uppercase">{html.escape(p.get("m") or "")}</div>
          <div style="font-size:{62 if len(limpia(p)) < 26 else 50}px;font-weight:900;letter-spacing:-1.5px;line-height:1.05;margin-top:8px">{html.escape(limpia(p))}</div>
          <div style="display:flex;align-items:baseline;gap:22px;margin-top:18px"><span class="price" style="font-size:92px;color:#d4ff3a">{eur(p["p"])}</span><span class="old" style="font-size:42px">{eur(p["o"])}</span></div></div>{ft()}''')
    S(f'''<div class="glow" style="top:200px;right:-200px"></div><div class="hd"><div class="logo"><img src="{icon}">Pádel<b>+</b></div><span class="num">{N}/{N}</span></div>
      <div style="position:absolute;top:300px;left:72px;right:72px;text-align:center"><h1 style="font-size:104px">Todas las ofertas,<br><em>al día.</em></h1>
      <p class="sub" style="margin-top:30px">Y si no sabes cuál es la tuya,<br>te lo decimos en 1 minuto.</p>
      <div style="display:inline-block;margin-top:70px;background:#d4ff3a;color:#0f172a;font-weight:900;font-size:72px;padding:30px 60px;border-radius:999px;letter-spacing:-2px">padelmas.club</div>
      <p style="margin-top:34px;font-size:30px;font-weight:600;color:#94a3b8">Precios en Padel Market a {fecha}. Pueden cambiar.</p></div>''')

elif modo == "suelas":
    tipos = [("e", "Espiga", "La más habitual", "Agarre y deslizamiento. Para pistas con poca o media arena."),
             ("o", "Omni", "Máximo agarre", "Para pistas con mucha arena o que resbalan."),
             ("h", "Híbrida", "Vale para todo", "Si juegas en clubes distintos y no sabes qué pista te toca.")]
    sel = []
    TOPZ = ("asics", "bullpadel", "adidas", "nike", "head", "babolat", "wilson", "mizuno", "nox")
    def topz(s):
        L = [p for p in ranking("zapa", 10, lambda p, s=s: p.get("s") == s) if (p.get("m") or "").lower().startswith(TOPZ)]
        rk = {m: i for i, m in enumerate(TOPZ)}
        L.sort(key=lambda p: (min(i for m, i in rk.items() if (p.get("m") or "").lower().startswith(m)), -(p.get("o") or p["p"])))
        return L or ranking("zapa", 15, lambda p, s=s: p.get("s") == s)
    usadas = set()
    for s, *_ in tipos:
        r = con_foto([p for p in topz(s) if (p.get("m") or "").lower() not in usadas], 1) or con_foto(topz(s), 1)
        if not r: sys.exit(f"Sin foto de zapatilla {s}")
        sel.append(r[0]); usadas.add((r[0][0].get("m") or "").lower())
    N = 5
    S(f'''{hd(1,N)}<div style="position:absolute;top:200px;left:72px;right:72px"><span class="tag">👟 Zapatillas</span>
      <h1 style="font-size:124px;margin-top:34px">¿Espiga<br>u <em>omni</em>?</h1>
      <p class="sub" style="margin-top:30px;max-width:560px">Elegir mal la suela es resbalar… o lesionarte.</p></div>
      <div class="blob" style="position:absolute;right:72px;bottom:170px;width:520px;height:520px;transform:rotate(-5deg)"><img src="{sel[0][1]}"></div>{ft()}''')
    for i, ((s, nom, lema, txt), (p, f)) in enumerate(zip(tipos, sel), 2):
        S(f'''{hd(i,N)}<div style="position:absolute;top:190px;left:72px;right:72px"><span class="tag">{lema}</span>
          <h1 style="font-size:130px;margin-top:30px"><em>{nom}</em></h1><p class="sub" style="margin-top:20px;max-width:900px">{txt}</p></div>
          <div class="blob" style="position:absolute;left:72px;right:72px;top:640px;height:440px"><img src="{f}"></div>
          <div style="position:absolute;left:72px;right:72px;top:1110px;display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:34px;font-weight:800;color:#cbd5e1">{html.escape((p.get("m") or "") + " " + limpia(p))[:34]}</span><span class="price" style="font-size:60px;color:#d4ff3a">{eur(p["p"])}</span></div>{ft()}''')
    S(f'''<div class="glow" style="top:200px;right:-200px"></div><div class="hd"><div class="logo"><img src="{icon}">Pádel<b>+</b></div><span class="num">5/5</span></div>
      <div style="position:absolute;top:300px;left:72px;right:72px;text-align:center"><h1 style="font-size:100px">¿Cuáles son<br><em>las tuyas?</em></h1>
      <p class="sub" style="margin-top:30px">Te lo decimos según tu pista y tu pie.<br>Y las compras desde la app.</p>
      <div style="display:inline-block;margin-top:70px;background:#d4ff3a;color:#0f172a;font-weight:900;font-size:72px;padding:30px 60px;border-radius:999px;letter-spacing:-2px">padelmas.club</div>
      <p style="margin-top:34px;font-size:36px;font-weight:700;color:#cbd5e1">Enlace en el perfil 👆</p></div>''')
elif modo == "reto":
    pal = con_foto(ranking("pala", 30), 4)
    if len(pal) < 4: sys.exit("Sin fotos suficientes")
    N = 6; mx = max(dto(p) for p, _ in pal); info["max"] = mx
    p0, f0 = pal[0]
    S(f'''<div class="glow" style="width:1200px;height:1200px;top:-200px;right:-500px;background:radial-gradient(circle,rgba(255,90,54,.22),transparent 62%)"></div><div class="hd"><div class="logo"><img src="{icon}">Pádel<b>+</b></div><span class="num">1/{N}</span></div>
      <div style="position:absolute;top:210px;left:72px;right:72px"><h1 style="font-size:170px;letter-spacing:-7px">Tu pala<br>tiene la<br><span style="color:#ff5a36">culpa.</span></h1></div>
      <div class="blob" style="position:absolute;right:60px;bottom:150px;width:400px;height:500px;transform:rotate(12deg)"><img src="{f0}"></div>
      <div style="position:absolute;right:330px;bottom:520px;width:150px;height:150px;border-radius:50%;background:#ff5a36;display:grid;place-items:center;font-size:110px;font-weight:900;transform:rotate(-10deg);box-shadow:0 16px 40px rgba(0,0,0,.4)">?</div>
      <p class="sub" style="position:absolute;left:72px;bottom:200px;max-width:480px">Y nadie te lo ha dicho.</p>{ft()}''')
    sen = "".join(f'<div style="display:flex;gap:26px;align-items:center;background:#1e293b;border:2px solid #334155;border-radius:30px;padding:26px 30px;margin-top:22px"><span style="font-size:58px">{e}</span><span style="font-size:42px;font-weight:700;line-height:1.2">{x}</span></div>' for e, x in [("😖", "Te duele el codo al acabar"), ("🪨", "Te pesa en el tercer set"), ("🎯", "La bola no sale donde quieres"), ("💸", "Te la compraste porque estaba de oferta")])
    S(f'''{hd(2,N)}<div style="position:absolute;top:180px;left:72px;right:72px"><span class="tag" style="background:#ff5a36;color:#fff">Señales</span>
      <h1 style="font-size:92px;margin-top:26px">¿Te pasa<br><em>alguna?</em></h1>{sen}
      <p class="sub" style="margin-top:34px">Si has dicho que sí a una, sigue →</p></div>{ft()}''')
    S(f'''{hd(3,N)}<div style="position:absolute;top:190px;left:72px;width:540px"><span class="tag">🎾 Test de 1 minuto</span>
      <h1 style="font-size:86px;margin-top:30px">Te decimos<br><em>cuál es<br>la tuya.</em></h1>
      <p class="sub" style="margin-top:30px">Según tu nivel, tu lado, tu juego y tu brazo. Sin registrarte.</p></div>
      <div class="ph" style="position:absolute;right:72px;top:220px;width:400px;transform:rotate(4deg)"><img src="{shot[1]}"></div>
      <div style="position:absolute;right:300px;top:860px;background:#d4ff3a;color:#0f172a;font-weight:900;font-size:46px;padding:16px 28px;border-radius:24px;transform:rotate(-5deg);box-shadow:0 14px 30px rgba(0,0,0,.35)">98% para ti</div>{ft()}''')
    cards = "".join(f'''<div style="position:relative"><div class="blob" style="height:250px;border-radius:30px"><img src="{f}"></div><div class="badge" style="top:-16px;left:-10px;font-size:36px;padding:8px 18px">-{dto(p)}%</div>
      <div style="display:flex;align-items:baseline;gap:12px;margin-top:14px"><span class="price" style="font-size:48px;color:#d4ff3a">{eur(p["p"])}</span><span class="old" style="font-size:26px">{eur(p["o"])}</span></div></div>''' for p, f in pal)
    S(f'''{hd(4,N)}<div style="position:absolute;top:180px;left:72px;right:72px"><span class="tag">🛒 Y la compras desde la app</span>
      <h1 style="font-size:96px;margin-top:26px">Hasta <span style="color:#ff5a36">-{mx}%</span><br><em>hoy.</em></h1></div>
      <div style="position:absolute;left:72px;right:72px;top:500px;display:grid;grid-template-columns:1fr 1fr;gap:34px 30px">{cards}</div>{ft()}''')
    S(f'''{hd(5,N)}<div style="position:absolute;top:190px;left:72px;right:72px"><span class="tag">🏆 Y después</span>
      <h1 style="font-size:100px;margin-top:30px">Demuéstralo<br><em>en la pista.</em></h1>
      <p class="sub" style="margin-top:24px;max-width:880px">Tu nivel real del 1 al 7 y una liga con tus amigos para ver quién manda.</p></div>
      <div style="position:absolute;left:72px;right:72px;bottom:190px;display:flex;align-items:flex-end;justify-content:space-between">{anillo()}{podio()}</div>{ft()}''')
    S(f'''<div class="glow" style="top:200px;right:-200px"></div><div class="hd"><div class="logo"><img src="{icon}">Pádel<b>+</b></div><span class="num">6/6</span></div>
      <div style="position:absolute;top:250px;left:72px;right:72px;text-align:center"><span class="tag" style="background:#ff5a36;color:#fff">Te reto</span>
      <h1 style="font-size:104px;margin-top:34px">¿A que no te sale<br><em>la pala que tienes?</em></h1>
      <p class="sub" style="margin-top:30px">Haz el test y cuéntanos en comentarios 👇</p>
      <div style="display:inline-block;margin-top:60px;background:#d4ff3a;color:#0f172a;font-weight:900;font-size:72px;padding:30px 60px;border-radius:999px;letter-spacing:-2px">padelmas.club</div>
      <p style="margin-top:30px;font-size:36px;font-weight:700;color:#cbd5e1">Enlace en el perfil 👆</p></div>''')
else:
    sys.exit("Modo desconocido")

async def main():
    async with async_playwright() as pw:
        br = await pw.chromium.launch(args=["--no-sandbox"]); pg = await br.new_page(viewport={"width": 1080, "height": 1350})
        os.makedirs(os.path.join(ROOT, "ig"), exist_ok=True)
        for i, b in enumerate(slides, 1):
            await pg.set_content(f'<!DOCTYPE html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{b}</body></html>')
            await pg.wait_for_timeout(500)
            fn = f"ig/{pref}-{i}.jpg"; await pg.screenshot(path=os.path.join(ROOT, fn), type="jpeg", quality=88); info["files"].append(fn)
        await br.close()
    print(json.dumps(info, ensure_ascii=False))
asyncio.run(main())
