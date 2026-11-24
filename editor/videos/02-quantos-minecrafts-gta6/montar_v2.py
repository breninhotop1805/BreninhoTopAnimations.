# Video 2: "Quantos Minecrafts cabem em GTA 6?" - 60 fps, animacoes com fisica, fundo synthwave com mais movimento.
import sys, os, math, subprocess, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
V1 = "/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad/v1"
sys.path.insert(0, V1)
from lib import *
import intro_v2 as V2
import intro_v4 as I4

FPS2 = 60
S = "/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad"
IN = f"{S}/v2/in"
GTA = f"{S}/full/gta6_full.mp4"
SHA = f"{IN}/mc_shaders.mp4"; PRE = f"{IN}/mc_prealpha.mp4"; TRA = f"{IN}/mc_trailer.mp4"
M_GTA = (0, 64, 1920, 885); M_MC = (0, 0, 1920, 1080); M_PRE = (0, 40, 640, 480); M_TRA = (0, 0, 1920, 1080)
TOTAL = 54.25
rng = np.random.default_rng(21)

# ================= FISICA =================
DT = 1/1000.0
class Spring:
    def __init__(self, t0, t1, targets, k=150, c=16, impulses=()):
        n = int((t1 - t0 + 0.3)/DT) + 1; self.t0 = t0; self.a = np.zeros(n)
        x = targets[0][1]; v = 0.0; ti = 0; tgt = x; imp = sorted(impulses); ii = 0
        for i in range(n):
            t = t0 + i*DT
            while ti + 1 < len(targets) and t >= targets[ti+1][0]: ti += 1; tgt = targets[ti][1]
            while ii < len(imp) and t >= imp[ii][0]: v += imp[ii][1]; ii += 1
            v += (k*(tgt - x) - c*v)*DT; x += v*DT; self.a[i] = x
    def __call__(self, t): return self.a[min(max(int(round((t - self.t0)/DT)), 0), len(self.a)-1)]

def step_pop(t, ti, k=260, c=14):
    if t < ti: return 0.0
    w0 = math.sqrt(k); z = c/(2*w0); wd = w0*math.sqrt(max(1 - z*z, 1e-6)); u = t - ti
    return 1 - math.exp(-z*w0*u)*(math.cos(wd*u) + z*w0/wd*math.sin(wd*u))

# ================= CENARIO COM MAIS MOVIMENTO =================
CEN = I4.CEN
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)
def beams(f, t):
    """feixes de luz diagonais suaves que passam devagar (parallax de luz)"""
    out = np.zeros((H, W), np.float32)
    for k, (sp, w, a, ph) in enumerate([(70, 140, 0.10, 0), (45, 90, 0.08, 700), (95, 60, 0.07, 1400)]):
        pos = ((t*sp + ph) % (W + H + 600)) - 300
        d = (XX + YY*0.55) - pos
        out += a*np.exp(-(d/w)**2)
    out *= np.clip(1.15 - YY/H, 0, 1)
    return f + out[..., None]*np.array([0.95, 0.6, 1.0], np.float32)

PIX = [(rng.uniform(40, 1040), rng.uniform(100, 1800), rng.uniform(0.5, 1.3), rng.uniform(0, 6), rng.integers(0, 3)) for _ in range(46)]
PIXC = [(0.35, 0.85, 0.45), (1.0, 0.55, 0.95), (1.0, 0.85, 0.5)]   # BGR: verde-grama, rosa, azul-claro
def pixels(f, t, P):
    for (x0, y0, sp, ph, c) in PIX:
        yv = (y0 - t*95*sp) % 1800 + 60; xv = x0 + 18*math.sin(t*1.2 + ph)
        px, py = P(xv, yv); s = int(4 + sp*4); b = 0.55 + 0.45*math.sin(t*3 + ph)
        col = tuple(v*b for v in PIXC[c])
        cv2.rectangle(f, (int(px - s), int(py - s)), (int(px + s), int(py + s)), col, -1)

def fundo(t, dolly):
    return beams(CEN.frame(t, dolly), t)

ROLL = [0.0]
def finish(f):
    br = np.clip(f - 0.75, 0, None); f = f + cv2.GaussianBlur(br, (0, 0), 18)*0.75
    ang = 1.0*math.sin(ROLL[0]*0.7 + 0.9)
    f = cv2.warpAffine(f, cv2.getRotationMatrix2D((W/2, H/2), ang, 1.035), (W, H), borderMode=cv2.BORDER_REFLECT)
    return np.clip(f, 0, 1)

# ================= ASSETS =================
def grass_block(size):
    """bloco de grama do Minecraft em isometrico (pixel art 16x16 por face)"""
    r2 = np.random.default_rng(5)
    def tex(top):
        t = np.zeros((16, 16, 3), np.uint8)
        for y in range(16):
            for x in range(16):
                if top:
                    g = r2.integers(0, 3); t[y, x] = [(95, 159, 53), (110, 178, 62), (82, 140, 45)][g]
                else:
                    edge = 3 + (r2.integers(0, 3) if x % 3 else 1)
                    if y < edge: g = r2.integers(0, 2); t[y, x] = [(95, 159, 53), (82, 140, 45)][g]
                    else:
                        g = r2.integers(0, 4); t[y, x] = [(134, 96, 67), (121, 85, 58), (150, 108, 74), (110, 110, 110)][g if g < 3 or r2.random() < 0.15 else 0]
        return Image.fromarray(t).resize((16*16, 16*16), Image.NEAREST)
    top, side = tex(True), tex(False)
    S_ = 256; Wc = int(S_*1.732); Hc = int(S_*2)
    im = Image.new("RGBA", (Wc, Hc), (0, 0, 0, 0))
    def face(img, dst, shade):
        a = np.asarray(img).astype(np.float32)*shade
        src = np.float32([[0, 0], [S_, 0], [0, S_]]); M = cv2.getAffineTransform(src, np.float32(dst))
        w = cv2.warpAffine(np.dstack([a, np.full(a.shape[:2], 255, np.float32)]), M, (Wc, Hc), flags=cv2.INTER_NEAREST)
        return Image.fromarray(np.clip(w, 0, 255).astype(np.uint8), "RGBA")
    cx = Wc/2; h = S_/2
    im.alpha_composite(face(top, [[cx, 0], [Wc, h], [0, h]], 1.0))
    im.alpha_composite(face(side, [[0, h], [cx, 2*h], [0, h + S_]], 0.78))
    im.alpha_composite(face(side, [[cx, 2*h], [Wc, h], [cx, 2*h + S_]], 0.6))
    ys, xs = np.where(np.asarray(im)[..., 3] > 0); im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    im = im.resize((size, int(size*im.height/im.width)), Image.LANCZOS)
    sh = Image.new("RGBA", (im.width + 40, im.height + 40), (0, 0, 0, 0)); sh.paste((0, 0, 0, 120), (20, 28), im.split()[3])
    sh = sh.filter(ImageFilter.GaussianBlur(8)); sh.alpha_composite(im, (20, 20))
    return to_sprite(sh)

BLK_BIG = grass_block(330); BLK = grass_block(64); BLK_S = grass_block(30); BLK_XS = grass_block(18)
GL = load_sprite(f"{KIT}/assets/logos/gta6-logo.png", 700); GH = 700*770/1012
GL_S = load_sprite(f"{KIT}/assets/logos/gta6-logo.png", 130)
MCL = load_sprite("/root/.claude/uploads/160acac5-b307-5059-8cfe-e8b2ecad7162/61c99b5d-image.png", 820)
MCL_S = load_sprite("/root/.claude/uploads/160acac5-b307-5059-8cfe-e8b2ecad7162/61c99b5d-image.png", 640)
M1 = I4.medal(1, True, 78)
GLOWB = glow_dot(460, (255, 120, 230)); GLOWW = glow_dot(380, (255, 230, 200)); GLOWG = glow_dot(420, (120, 255, 140))
RAYS = V2.RAYS
TXT = {}
def T(s, size, glow=(255, 60, 200), fill=(255, 255, 255), font=F_BLACK):
    k = (s, size, glow, fill, font)
    if k not in TXT: TXT[k] = text_sprite(s, font, size, fill=fill, glow=glow)
    return TXT[k]
def pill(txt, color, size=74):
    f = ImageFont.truetype(F_BLACK, size); bb = f.getbbox(txt); w = bb[2] - bb[0] + size; h = int(size*1.55)
    im = rounded(w, h, h//2, color + (255,)); d = ImageDraw.Draw(im)
    d.text(((w - (bb[2]+bb[0]))/2, (h - (bb[3]+bb[1]))/2), txt, font=f, fill=(255, 255, 255))
    sh = Image.new("RGBA", (w + 60, h + 60), (0, 0, 0, 0)); sh.paste((0, 0, 0, 150), (30, 42), im.split()[3])
    sh = sh.filter(ImageFilter.GaussianBlur(12)); sh.alpha_composite(im, (30, 30)); return to_sprite(sh)
P1GB = pill("1 GB", (60, 170, 70)); P1MB = pill("< 1 MB", (60, 170, 70), 70); P2009 = pill("2009", (70, 70, 90), 70)

def fmt(n): return f"{n:,}".replace(",", ".")

# ================= A1: INTRO (0 -> 6.56) =================
T_G = 0.15
a1_gs = Spring(0, 6.7, [(0, 0.18), (T_G, 1.0)], k=95, c=11)
a1_gy = Spring(0, 6.7, [(0, 1000.0), (T_G, 640.0)], k=80, c=13)
a1_pulse = Spring(0, 6.7, [(0, 0.0)], k=500, c=16, impulses=[(1.32 + i*0.115, 0.10) for i in range(18)])
a1_q = Spring(0, 6.7, [(0, 0.0), (3.55, 1.0)], k=230, c=13)
a1_sx = Spring(0, 6.7, [(0, 0.0)], k=800, c=20, impulses=[(T_G + 0.22, 200), (5.44, -260), (5.52, 220)])
a1_sy = Spring(0, 6.7, [(0, 0.0)], k=800, c=20, impulses=[(T_G + 0.22, -300)])
DROPS = []
for i in range(18):
    t0 = 1.0 + i*0.115; x0 = rng.uniform(230, 850); r0 = rng.uniform(-40, 40)
    DROPS.append((t0, x0, r0, rng.uniform(-200, 200)))
def a1(t):
    f = fundo(t, 1 + 0.2*t/6.5)
    ec = (1 + 0.22*t/6.5)
    def P(x, y): return 540 + (x - 540)*ec + a1_sx(t), 960 + (y - 960)*ec + a1_sy(t)
    pixels(f, t, P)
    gy = a1_gy(t); gs = a1_gs(t)*(1 + a1_pulse(t))
    lx, ly = P(540, gy); blit(f, GLOWB, lx, ly, ec*1.3*a1_gs(t), 0, 0.55*clamp((t - T_G)/0.3))
    # blocos caindo e sendo "engolidos" pela logo
    for (t0, x0, r0, vx) in DROPS:
        u = t - t0
        if u < 0: continue
        y = -120 + 0.5*2600*u*u; xx = x0 + vx*u*0.3
        if y > gy - 60:
            k = clamp((y - (gy - 60))/220); s = 1 - k
            if s <= 0.02: continue
            xx = mix(xx, 540, k*0.6)
        else: s = 1.0
        px, py = P(xx, y); blit(f, BLK, px, py, ec*s*1.2, r0 + 160*u)
    if t >= T_G - 0.02: blit(f, GL, lx, ly, ec*gs, 0, clamp((t - T_G)/0.14))
    # contador embaralhando
    k = a1_q(t)
    if k > 0.01:
        if t < 5.44:
            s = "".join(str(int((t*37 + j*7.3)*3) % 10) for j in range(6)); s = s[:3] + "." + s[3:]
        else: s = "???.???"
        x, y = P(540, 1170); blit(f, T(s, 150, glow=(120, 255, 140)), x, y, ec*k, 0, clamp(k*3))
        x, y = P(540, 1290); blit(f, T("MINECRAFTS", 56, None), x, y, ec*k, 0, clamp(k*3))
    f = finish(f)
    # glitch no "bugar"
    g = math.exp(-max(0, t - 5.44)*7) if t >= 5.44 else 0
    if g > 0.03:
        sh = int(26*g); f2 = f.copy()
        f2[..., 2] = np.roll(f[..., 2], sh, 1); f2[..., 0] = np.roll(f[..., 0], -sh, 1)
        for _ in range(7):
            y0 = int(rng.uniform(0, H - 80)); hh = int(rng.uniform(15, 90)); dx = int(rng.uniform(-90, 90)*g)
            f2[y0:y0 + hh] = np.roll(f2[y0:y0 + hh], dx, 1)
        f = f2
    return f

# ================= A2: ARMAZENAMENTO (8.06 -> 10.34) =================
T2 = 8.06
a2_in = Spring(T2, 10.5, [(T2, 700.0), (T2 + 0.02, 0.0)], k=120, c=14)
a2_fill = lambda t: e_out(clamp((t - 8.10)/0.94))
a2_sy = Spring(T2, 10.5, [(T2, 0.0)], k=700, c=14, impulses=[(9.05, 520)])
a2_pn = Spring(T2, 10.5, [(T2, 0.0)], k=260, c=14, impulses=[(9.05, 1.2)])
PAN = None
def a2(t):
    global PAN
    if PAN is None:
        im = rounded(900, 420, 44, (20, 6, 34, 235), (255, 90, 220, 255), 6); d = ImageDraw.Draw(im)
        d.text((60, 46), "ARMAZENAMENTO", font=ImageFont.truetype(F_BLACK, 50), fill=(255, 255, 255))
        PAN = to_sprite(im)
    f = fundo(t, 1 + 0.15*(t - T2)/2.3)
    ec = (1 + 0.12*(t - T2)/2.3)*(1 + 0.05*a2_pn(t))
    def P(x, y): return 540 + (x - 540)*ec, 960 + (y - 960)*ec + a2_sy(t)
    pixels(f, t, P)
    py = 880 + a2_in(t)
    x, y = P(540, py); blit(f, PAN, x, y, ec)
    x, y = P(205, py + 50); blit(f, GL_S, x, y, ec)
    p = clamp(a2_fill(t), 0, 1.04); full = t >= 9.05
    bx0, by0 = P(300, py + 20); bx1, by1 = P(950, py + 85)
    cv2.rectangle(f, (int(bx0), int(by0)), (int(bx1), int(by1)), (0.28, 0.08, 0.22), -1, cv2.LINE_AA)
    col = (0.25, 0.22, 1.0) if full else (0.45, 0.85, 0.35)
    cv2.rectangle(f, (int(bx0), int(by0)), (int(bx0 + (bx1 - bx0)*min(p, 1)), int(by1)), col, -1, cv2.LINE_AA)
    n = int(round(212*min(p, 1)))
    x, y = P(540, py + 165); blit(f, T(f"{n} GB", 96, glow=(40, 40, 255) if full else (120, 255, 140)), x, y, ec*(1 + 0.12*math.exp(-(t - 9.05)*8)*full))
    if full:
        k = step_pop(t, 9.3); x, y = P(540, 560); blit(f, T("MAIS PESADO DA HISTÓRIA", 60, glow=(40, 40, 255), fill=(255, 220, 220)), x, y, ec*k, 0, clamp(k*3))
    return finish(f)

# ================= A3: 212 BLOCOS ENCHENDO A LOGO (17.57 -> 22.03) =================
T3 = 17.57
def logo_cells(n_target=212):
    a = GL[..., 3]; h, w = a.shape
    for cell in range(40, 10, -1):
        cells = []
        for gy in range(0, h - cell, cell):
            for gx in range(0, w - cell, cell):
                if a[gy:gy + cell, gx:gx + cell].mean() > 0.55: cells.append((gx + cell/2, gy + cell/2))
        if len(cells) >= n_target: return cell, cells
    return cell, cells
CELL, CELLS = logo_cells()
CELLS = sorted(CELLS, key=lambda c: (-c[1], c[0]))[:212]   # de baixo pra cima
BLKC = grass_block(int(CELL*1.25))
DJ = [(rng.uniform(-0.12, 0.12), rng.uniform(180, 520)) for _ in range(len(CELLS))]
LOGO_CY = 660
a3_in = Spring(T3, 22.2, [(T3, 0.0), (T3 + 0.02, 1.0)], k=160, c=15)
a3_c = Spring(T3, 22.2, [(T3, 0.0), (18.79, 1.0)], k=230, c=13)
a3_sy = Spring(T3, 22.2, [(T3, 0.0)], k=700, c=16, impulses=[(21.31, 260)])
C_T0, C_T1 = 18.75, 20.70
def a3(t):
    f = fundo(t, 1 + 0.16*(t - T3)/4.5)
    ec = 1 + 0.12*(t - T3)/4.5
    def P(x, y): return 540 + (x - 540)*ec, 960 + (y - 960)*ec + a3_sy(t)
    pixels(f, t, P)
    k = a3_in(t)
    gx0 = 540 - GL.shape[1]/2; gy0 = LOGO_CY - GL.shape[0]/2
    x, y = P(540, LOGO_CY); blit(f, GLOWG, x, y, ec*1.35, 0, 0.35*k)
    blit(f, GL, x, y, ec*k, 0, 0.35*clamp(k*2))          # logo "fantasma" (o recipiente)
    n = 0
    for i, (cx, cy) in enumerate(CELLS):
        ti = C_T0 + (C_T1 - C_T0)*(i/len(CELLS))**0.8 + DJ[i][0]
        u = t - ti
        if u < 0: continue
        ty = gy0 + cy; tx = gx0 + cx; hgt = DJ[i][1]
        y = min(ty, ty - hgt + 0.5*5200*u*u)
        fa = clamp(u/0.10)
        if y >= ty:   # pousou: quiquinho
            tl = math.sqrt(2*hgt/5200); bounce = 10*math.exp(-(u - tl)*16)*abs(math.sin((u - tl)*30)); y = ty - bounce; n += 1
        px, py = P(tx, y); blit(f, BLKC, px, py, ec, 0, fa)
    # logo nitida por cima quando enche
    if t >= 21.15:
        x, y = P(540, LOGO_CY); blit(f, GL, x, y, ec*(1 + 0.06*math.exp(-(t - 21.31)*7)), 0, 0.85*clamp((t - 21.15)/0.25))
    c = a3_c(t)
    if c > 0.01:
        x, y = P(540, 1180); blit(f, T(str(n), 170, glow=(120, 255, 140)), x, y, ec*c*(1 + 0.05*math.exp(-(t - 21.1)*8)*(t > 21.1)), 0, clamp(c*3))
        x, y = P(540, 1310); blit(f, T("MINECRAFTS", 56, None), x, y, ec*c, 0, clamp(c*3))
    return finish(f)

# ================= A4: "ISSO NAO E NADA" - camera afasta (25.57 -> 27.99) =================
T4 = 25.57
a4_s = Spring(T4, 28.2, [(T4, 1.0), (26.72, 0.05)], k=26, c=9.5)
FILLED = None
def a4(t):
    global FILLED
    if FILLED is None:
        im = np.zeros((GL.shape[0] + 40, GL.shape[1] + 40, 4), np.float32)
        tmp = np.zeros((GL.shape[0] + 40, GL.shape[1] + 40, 3), np.float32); al = np.zeros(tmp.shape[:2], np.float32)
        gx0, gy0 = 20, 20
        for (cx, cy) in CELLS:
            blit(tmp, BLKC, gx0 + cx, gy0 + cy)
        blit(tmp, GL, tmp.shape[1]/2, tmp.shape[0]/2, 1, 0, 0.85)
        al = (tmp.max(-1) > 0.01).astype(np.float32)
        FILLED = np.dstack([tmp*al[..., None], al])
    f = fundo(t, 1.0 + 0.5*(1 - a4_s(t)))
    s = a4_s(t)
    def P(x, y): return 540 + (x - 540), 960 + (y - 960)
    pixels(f, t, P)
    blit(f, GLOWG, 540, LOGO_CY + 300*(1 - s), 1.35*s + 0.08, 0, 0.35)
    blit(f, FILLED, 540, LOGO_CY + 300*(1 - s), s)
    return finish(f)

# ================= A5: A CONTA (34.45 -> 44.28) =================
T5 = 34.45
a5_b = Spring(T5, 44.5, [(T5, 0.0), (T5 + 0.03, 1.0), (35.26, 0.16), (36.2, 0.16)], k=110, c=12)
a5_by = Spring(T5, 44.5, [(T5, 700.0), (36.2, 700.0), (36.25, 330.0)], k=90, c=13)
a5_bx = Spring(T5, 44.5, [(T5, 540.0), (36.25, 540.0)], k=90, c=13)
a5_mb = Spring(T5, 44.5, [(T5, 0.0), (35.66, 1.0), (36.2, 0.0)], k=230, c=14)
L1 = Spring(T5, 44.5, [(T5, 0.0), (36.55, 1.0), (39.85, 0.0)], k=230, c=14)
L2 = Spring(T5, 44.5, [(T5, 0.0), (37.30, 1.0), (39.85, 0.0)], k=230, c=14)
L3 = Spring(T5, 44.5, [(T5, 0.0), (38.80, 1.0), (39.85, 0.0)], k=230, c=14)
BIG = Spring(T5, 44.5, [(T5, 0.0), (39.90, 1.0)], k=200, c=13, impulses=[(41.98, 2.5)])
a5_sx = Spring(T5, 44.5, [(T5, 0.0)], k=800, c=20, impulses=[(41.98, 380)])
a5_sy = Spring(T5, 44.5, [(T5, 0.0)], k=800, c=20, impulses=[(41.98, -420)])
BURST = [(rng.uniform(0, 2*math.pi), rng.uniform(500, 2300), rng.uniform(-400, 400), rng.uniform(0, 0.25), rng.integers(0, 2)) for _ in range(180)]
def a5(t):
    f = fundo(t, 1 + 0.18*(t - T5)/9.8)
    ec = 1 + 0.12*(t - T5)/9.8
    def P(x, y): return 540 + (x - 540)*ec + a5_sx(t), 960 + (y - 960)*ec + a5_sy(t)
    pixels(f, t, P)
    # bloco grande que encolhe
    b = a5_b(t)
    if b > 0.01 and t < 39.95:
        x, y = P(a5_bx(t), a5_by(t)); blit(f, GLOWG, x, y, ec*b*1.2 + 0.2, 0, 0.35)
        blit(f, BLK_BIG, x, y, ec*b, 6*math.sin(t*1.7))
    k = a5_mb(t)
    if k > 0.01: x, y = P(540, 1000); blit(f, P1MB, x, y, ec*k, mix(-15, 0, min(k, 1)), clamp(k*3))
    # linhas da conta
    for spr_fn, sp, yy in ((lambda: T("212 GB", 120, glow=(255, 160, 40)), L1, 560),
                           (lambda: T("= 212.000 MB", 96, glow=(255, 60, 200)), L2, 720),
                           (lambda: T("÷ 1 MB", 96, glow=(120, 255, 140)), L3, 880)):
        k = sp(t)
        if k > 0.01:
            x, y = P(540, yy); blit(f, spr_fn(), x, y, ec*k, 0, clamp(k*3))
    if L1(t) > 0.01: x, y = P(220, 560); blit(f, GL_S, x, y, ec*L1(t), 0, clamp(L1(t)*3))
    # explosao de blocos minusculos
    if t >= 41.98:
        u = t - 41.98
        for (ang, sp, spin, d0, big) in BURST:
            uu = u - d0
            if uu < 0: continue
            x = 540 + math.cos(ang)*sp*uu; y = 800 + math.sin(ang)*sp*uu + 0.5*1500*uu*uu
            if y > 2100 or x < -100 or x > 1180: continue
            px, py = P(x, y); blit(f, BLK_S if big else BLK_XS, px, py, ec, spin*uu)
    # contador grande ate 200.000
    k = BIG(t)
    if k > 0.01:
        u = clamp((t - 40.0)/(41.98 - 40.0)); n = int(200000*(u**2.2)) if t < 41.98 else 200000
        txt = ("+" + fmt(n)) if t >= 41.98 else fmt(n)
        x, y = P(540, 800); blit(f, GLOWG, x, y, ec*1.5, 0, 0.5*clamp(k))
        blit(f, T(txt, 170, glow=(120, 255, 140)), x, y, ec*min(k, 1.25))
        x, y = P(540, 960); blit(f, T("MINECRAFTS", 64, None), x, y, ec*min(k, 1.2), 0, clamp(k*3))
    return finish(f)

# ================= A6: VS (48.48 -> 52.90) =================
T6 = 48.48
v_g = Spring(T6, 53.1, [(T6, -900.0), (T6 + 0.02, 0.0)], k=120, c=14)
v_m = Spring(T6, 53.1, [(T6, 900.0), (T6 + 0.02, 0.0)], k=120, c=14)
v_vs = Spring(T6, 53.1, [(T6, 0.0), (48.70, 1.0)], k=260, c=12)
v_hl = Spring(T6, 53.1, [(T6, 0.5), (50.22, 0.0), (51.46, 1.0)], k=90, c=13)
PILE = []
for i in range(140):
    row = int((math.sqrt(8*i + 1) - 1)/2)   # piramide
    col = i - row*(row + 1)//2
    PILE.append((col - row/2, row))
PILE_ROWS = max(r for _, r in PILE) + 1
def a6(t):
    f = fundo(t, 1.14 - 0.12*(t - T6)/4.4)
    ec = 1.12 - 0.10*(t - T6)/4.4
    def P(x, y): return 540 + (x - 540)*ec, 960 + (y - 960)*ec
    pixels(f, t, P)
    h = v_hl(t)
    gx, gy = P(540, 590 + v_g(t)); mx, my = P(540, 1200 + v_m(t))
    blit(f, GLOWW, mix(gx, mx, h), mix(gy, my, h), ec*1.6, 0, 0.55)
    sg = 1 + 0.12*(1 - h) - 0.10*h; sm = 1 + 0.12*h - 0.10*(1 - h)
    blit(f, GL, gx, gy, ec*0.72*sg, 0, 1 - 0.55*h)
    # montanha de blocos (piramide) + numero
    am = 1 - 0.55*(1 - h)
    for (c, r) in PILE:
        x = 540 + c*26; y = 1140 + r*14
        px, py = P(x, y + v_m(t)); blit(f, BLK_S, px, py, ec*sm, 0, am)
    x, y = P(540, 1335 + v_m(t)); blit(f, T("200.000 MINECRAFTS", 64, glow=(120, 255, 140)), x, y, ec*sm, 0, am)
    k = v_vs(t); x, y = P(540, 920); blit(f, T("VS", 190, glow=(255, 60, 200)), x, y, ec*k, mix(-25, -6, min(k, 1)), clamp(k*3))
    return finish(f)

# ================= OVERLAYS EM GAMEPLAY =================
ov_1gb = Spring(16.6, 17.6, [(16.6, 0.0), (16.71, 1.0)], k=240, c=13)
ov_09 = Spring(30.2, 32.5, [(30.2, 0.0), (30.35, 1.0)], k=240, c=13)
ov_mc = Spring(46.6, 48.5, [(46.6, 0.0), (46.72, 1.0)], k=200, c=13)
ov_md = Spring(46.6, 48.5, [(46.6, 0.0), (47.12, 1.0)], k=230, c=13)
def overlay(f, t):
    if 16.6 <= t < 17.57:
        k = ov_1gb(t)
        if k > 0.01: blit(f, P1GB, 540, 300, k, mix(-12, 0, min(k, 1)), clamp(k*3))
    if 30.27 <= t < 32.41:
        k = ov_09(t)
        if k > 0.01: blit(f, P2009, 540, 300, k, mix(-12, 0, min(k, 1)), clamp(k*3))
    if 46.70 <= t < 48.48:
        k = ov_mc(t)
        if k > 0.01: blit(f, MCL_S, 540, 330, k, 0, clamp(k*3))
        k = ov_md(t)
        if k > 0.01: blit(f, M1, 540, 175, k, mix(-30, -8, min(k, 1)), clamp(k*3))
    return f

# ================= LINHA DO TEMPO =================
# gameplay: (ini, fim, fonte, ini_fonte, mascara, modo, z0, z1, c0, c1, opcoes)
def G(a, b, src, s0, mask, mode, z0, z1, c0=None, c1=None, **o): return ("gp", a, b, src, s0, mask, mode, z0, z1, c0, c1, o)
def A(a, b, fn): return ("anim", a, b, fn)
TL = [
    A(0.00, 6.56, a1),
    G(6.56, 8.06, GTA, 71579.3, M_GTA, "box", 1.00, 1.28),
    A(8.06, 10.34, a2),
    G(10.34, 12.20, GTA, 69898.5, M_GTA, "box", 1.30, 1.02),
    G(12.20, 13.73, GTA, 94078.0, M_GTA, "box", 1.00, 1.25),
    G(13.73, 15.33, SHA, 6.5, M_MC, "box", 1.00, 1.25),
    G(15.33, 17.57, SHA, 16.5, M_MC, "box", 1.28, 1.02),
    A(17.57, 22.03, a3),
    G(22.03, 24.37, SHA, 43.0, M_MC, "box", 1.00, 1.30),
    G(24.37, 25.57, GTA, 69660.6, M_GTA, "box", 1.28, 1.05),
    A(25.57, 27.99, a4),
    G(27.99, 30.27, SHA, 113.0, M_MC, "box", 1.25, 1.00),
    G(30.27, 32.41, PRE, 143.0, M_PRE, "box", 1.00, 1.22, box_w=1240),
    G(32.41, 33.43, PRE, 13.0, M_PRE, "box", 1.20, 1.02, box_w=1240),
    G(33.43, 34.45, PRE, 0.0, M_PRE, "box", 1.00, 2.10, (320, 260), (190, 175), box_w=1240, ease=True),
    A(34.45, 44.28, a5),
    G(44.28, 46.70, PRE, 138.0, M_PRE, "box", 1.22, 1.00, box_w=1240),
    G(46.70, 48.48, TRA, 28.0, M_TRA, "box", 1.00, 1.22),
    A(48.48, 52.90, a6),
    G(52.90, TOTAL, SHA, 105.5, M_MC, "box", 1.00, 1.18),
]
ZOOM_OUT = []            # a4 ja e a transicao de afastar
REWIND = [30.27]
FLASH = [41.98]
WHIP = [48.48]

def post(f, t):
    for T0 in REWIND:
        if T0 - 0.30 <= t < T0 + 0.22:
            u = 1 - abs(t - T0)/0.3 if t < T0 else 1 - (t - T0)/0.22
            u = clamp(u)
            g = f.copy()
            for y0 in range(0, H, 6):
                g[y0:y0 + 2] *= 1 - 0.5*u
            sh = int(60*u); g = np.roll(g, int(140*u*math.sin(t*90)), 1)
            g[..., 2] = np.roll(g[..., 2], sh, 1); g[..., 0] = np.roll(g[..., 0], -sh, 1)
            f = g*(1 - 0.15*u) + 0.15*u*np.array([1.0, 0.85, 0.9])
    for T0 in WHIP:
        if T0 - 0.15 <= t < T0: u = e_in((t - (T0 - 0.15))/0.15); f = whip(f, -W*0.7*u, 90*u)
        if T0 <= t < T0 + 0.2: u = 1 - e_out((t - T0)/0.2); f = whip(f, W*0.7*u, 90*u)
    for T0 in FLASH:
        if T0 - 0.04 <= t < T0 + 0.35:
            a_ = seg(t, T0 - 0.04, T0, lin) if t < T0 else 1 - seg(t, T0, T0 + 0.35, e_out)
            f = f*(1 - a_) + a_
    if t > TOTAL - 0.5: f = f*max(0, (TOTAL - t)/0.5)
    return f

def frame_at(item, t, frames, lo, f0, f1, fi):
    _, a, b, src, s0, mask, mode, z0, z1, c0, c1, o = item
    mc = ((mask[0]+mask[2])/2, (mask[1]+mask[3])/2); c0 = c0 or mc; c1 = c1 or c0
    k = (fi - f0)/max(f1 - f0 - 1, 1)
    if o.get("ease"): k = e_io(clamp((t - a - 0.15)/(b - a - 0.35)))
    fr = frames[min(fi - lo, len(frames) - 1)]
    f = render_gameplay(fr, mask, mode, mix(z0, z1, k), mix(c0[0], c1[0], k), mix(c0[1], c1[1], k),
                        box_w=o.get("box_w", 1650), cy_s=880)
    return overlay(f, t)

def render(out, t_from, t_to, sub=3, shutter=0.55):
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
                            "-r", str(FPS2), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "15",
                            "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    for item in TL:
        a, b = item[1], item[2]
        f0, f1 = int(round(a*FPS2)), int(round(b*FPS2))
        lo, hi = max(f0, int(round(t_from*FPS2))), min(f1, int(round(t_to*FPS2)))
        if lo >= hi: continue
        frames = None
        if item[0] == "gp":
            src, s0 = item[3], item[4]; sw_, sh_ = probe_size(src)
            frames = read_frames(src, s0 + (lo - f0)/FPS2, (hi - lo)/FPS2, sw_, sh_, fps=FPS2)
        for fi in range(lo, hi):
            t = fi/FPS2
            if item[0] == "anim":
                acc = np.zeros((H, W, 3), np.float32)
                for k in range(sub): ROLL[0] = t + k*shutter/FPS2/sub; acc += item[3](ROLL[0])
                f = acc/sub
            else:
                f = frame_at(item, t, frames, lo, f0, f1, fi)
            f = post(f, t)
            enc.stdin.write((np.clip(f, 0, 1)*255).astype(np.uint8).tobytes())
        frames = None
    enc.stdin.close(); enc.wait()

if __name__ == "__main__":
    render(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]))
