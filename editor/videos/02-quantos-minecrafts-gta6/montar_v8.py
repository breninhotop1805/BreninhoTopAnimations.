# Video 2 no estilo novo (referencias Sev7n): titulo Burbank na intro, palavras-chave grandes, video encolhendo,
# mao apontando, legenda pequena, tela cheia/fundo desfocado conforme a cena, camera sempre andando.
import sys, math, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import montar_v7 as V7
from montar_v7 import *

BURB = "/home/user/BreninhoTopAnimations./editor/fontes/BurbankBigCondensed-Black.otf"
ARM = "/home/user/BreninhoTopAnimations./editor/assets/braco_apontando.png"

def burb(lines, size, stroke=None):
    stroke = stroke or int(size*0.11)
    f = ImageFont.truetype(BURB, size); pad = stroke*3 + 20
    ws = [f.getbbox(l, stroke_width=stroke) for l in lines]
    lh = int(size*0.98); w = max(b[2] - b[0] for b in ws) + pad*2; h = lh*len(lines) + pad*2
    sh = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d2 = ImageDraw.Draw(im)
    for i, (l, b) in enumerate(zip(lines, ws)):
        x = (w - (b[2] - b[0]))/2 - b[0]; y = pad + i*lh - b[1]*0.35
        d.text((x + 6, y + 9), l, font=f, fill=(0, 0, 0, 200), stroke_width=stroke, stroke_fill=(0, 0, 0, 200))
        d2.text((x, y), l, font=f, fill=(255, 255, 255, 255), stroke_width=stroke, stroke_fill=(0, 0, 0, 255))
    sh = sh.filter(ImageFilter.GaussianBlur(7)); sh.alpha_composite(im)
    return to_sprite(sh)

TITLE = burb(["QUANTOS MINECRAFTS", "CABEM NO GTA 6?"], 138)
if TITLE.shape[1] > 1000:
    TITLE = burb(["QUANTOS MINECRAFTS", "CABEM NO GTA 6?"], int(138*1000/TITLE.shape[1]))
KW1 = burb(["212 GIGAS"], 190)
KW2 = burb(["NÃO É NADA"], 170)
GLI = load_sprite(f"{KIT}/assets/logos/gta6-logo.png", 520)
ARMS = load_sprite(ARM, 760)

def blit_mb(f, spr, x, y, s, r, a, vy):
    """blit com desfoque de movimento vertical (varias copias ao longo da velocidade)"""
    n = int(min(8, abs(vy)/900)) + 1
    for i in range(n):
        o = (i/(n) - 0.5)*vy/60*0.9 if n > 1 else 0
        blit(f, spr, x, y + o, s, r, a/n if n > 1 else a)

def title(f, t):
    if t < 0.32:     # flash da logo do GTA VI
        k = step(t, 0.0, 600, 22); blit(f, GLI, 540, 880, 0.8 + 0.25*k, 0, 1.0)
        return
    if t >= 3.55: return
    T0 = 0.32; k = step(t, T0, 300, 13)
    y = mix(-260, 300, k); dt = 1/240; vy = (mix(-260, 300, step(t + dt, T0, 300, 13)) - y)/dt
    s = 1.0 + 0.015*math.sin((t - T0)*3.0); r = 0.8*math.sin((t - T0)*2.2)
    a = 1.0
    if t > 3.25:    # saida: cresce e sai pelo topo
        u = e_in((t - 3.25)/0.30); s *= 1 + 1.4*u; y -= 380*u; a = 1 - u
    blit_mb(f, TITLE, 540, y, s, r, a, vy if t < T0 + 0.45 else 0)

def keyword(f, t, spr, t0, t1, y=900):
    if not (t0 <= t < t1 + 0.18): return
    k = step(t, t0, 520, 19); s = mix(0.35, 1.0, k); r = mix(-10, -3, min(k, 1)); yy = y
    if t >= t1: u = e_in((t - t1)/0.18); yy += 900*u; r += 30*u
    blit(f, spr, 540, yy, s, r, clamp(k*4))

def shrink(f, t, t0=26.71, t1=27.99):
    if not (t0 <= t < t1): return f
    u = e_io(clamp((t - t0)/0.45)); s = mix(1.0, 0.40, u)
    bg = np.zeros_like(f); bg[:] = (0.03, 0.03, 0.035)
    sm = cv2.resize(f, (int(W*s), int(H*s)), interpolation=cv2.INTER_AREA)
    h_, w_ = sm.shape[:2]
    M_ = cv2.getRotationMatrix2D((w_/2, h_/2), -4*u, 1.0); M_[0, 2] += W/2 - w_/2; M_[1, 2] += H*0.46 - h_/2
    card = cv2.warpAffine(sm, M_, (W, H)); msk = cv2.warpAffine(np.ones(sm.shape[:2], np.float32), M_, (W, H))[..., None]
    shd = cv2.GaussianBlur(msk[..., 0], (0, 0), 30)[..., None]*0.6
    out = bg*(1 - shd) + card*msk
    edge = cv2.dilate(msk[..., 0], np.ones((7, 7), np.uint8)) - msk[..., 0]
    out = out*(1 - edge[..., None]) + edge[..., None]*0.9
    return out

def hand(f, t, t0=33.62, t1=34.45, tip=(565, 900)):
    if not (t0 <= t < t1): return
    k = step(t, t0, 260, 15); h_, w_ = ARMS.shape[:2]
    x = tip[0] + w_/2 - 10 + 700*(1 - k); y = tip[1] + h_*0.05 - 70*(1 - k)
    blit(f, ARMS, x, y, 1.0, -6 + 4*(1 - k), 1.0)

ORIG_POST = M.post
def post(f, t):
    f = shrink(f, t)
    f = ORIG_POST(f, t)
    title(f, t)
    keyword(f, t, KW1, 9.04, 10.25)
    keyword(f, t, KW2, 27.20, 27.90, y=1230)
    hand(f, t)
    return f
M.post = post
M.B.ZOOM_OUT = -10.0

C = M.C if hasattr(M, "C") else V7.C
TL = [
    C(0.00, 1.30, SHA, 113.0, "full", 1.00, 1.18, c0=(860, 540), c1=(1060, 540)),
    C(1.30, 3.54, GTA, 93785.0, "box", 1.05, 1.40, box_w=1900),
    C(3.54, 6.56, BSL, 32.0, "full", 1.00, 1.20, c0=(1060, 480), c1=(860, 480)),
    C(6.56, 8.06, GTA, 95883.0, "box", 1.35, 1.10, box_w=1900),
    C(8.06, 10.34, GTA, 99540.0, "box", 1.05, 1.40, box_w=1900),
    C(10.34, 12.20, GTA, 69898.5, "full", 1.00, 1.15, c0=(960, 700), c1=(960, 400)),
    C(12.20, 13.73, GTA, 70198.5, "box", 1.40, 1.10, box_w=1900),
    C(13.73, 15.33, TRA, 12.6, "full", 1.05, 1.20, c0=(1000, 540), c1=(880, 540)),
    A(15.33, 17.57, V7.a2),
    A(17.57, 22.03, V7.a3),
    SP(22.03, 25.57, (SHA, 50.0), (GTA, 69661.0)),
    C(25.57, 27.99, SHA, 43.0, "full", 1.00, 1.15, c0=(900, 540), c1=(1040, 540)),
    C(27.99, 30.27, SHA, 22.0, "full", 1.18, 1.00, c0=(760, 540), c1=(900, 540)),
    C(30.27, 32.41, PRE, 143.0, "box", 1.05, 1.35, box_w=1500),
    C(32.41, 33.43, PRE, 13.0, "box", 1.35, 1.10, box_w=1500),
    C(33.43, 34.45, PRE, 0.0, "box", 1.00, 2.10, c0=(320, 260), c1=(190, 175), box_w=1500, ease=True),
    A(34.45, 36.19, V7.a4),
    C(36.19, 39.46, PRE, 136.0, "box", 1.40, 1.05, box_w=1500),
    A(39.46, 44.28, V7.a5),
    C(44.28, 46.24, PRE, 110.9, "box", 1.40, 1.05, box_w=1500),
    C(46.24, 48.48, TRA, 24.0, "full", 1.00, 1.18, c0=(880, 540), c1=(1040, 540)),
    SP(48.48, 52.90, (GTA, 95884.0), (SHA, 6.3)),
    C(52.90, TOTAL, SHA, 105.5, "full", 1.00, 1.15),
]
M.TL = TL

if __name__ == "__main__":
    M.render(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]))
