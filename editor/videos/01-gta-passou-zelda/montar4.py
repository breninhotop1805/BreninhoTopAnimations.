# Video 1 - versao 2: 60 fps, animacoes com fisica, cenas reescolhidas, zooms variados.
import sys, math, subprocess, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
from lib import *
import intro_v2 as V2
import intro_v5 as I4

FPS2 = 60
S = "/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad"
GTA = f"{S}/full/gta6_full.mp4"; BUG = f"{S}/v1/in/bugs.mp4"; ZEL = f"{S}/v1/in/zelda.mp4"
M_GTA = (0, 64, 1920, 885); M_ZEL = (0, 0, 854, 480)
M_BUG = (175, 0, 1280, 720); M_BUG_PONTE = (0, 70, 960, 720)
TOTAL = 56.6
CEN = I4.CEN
rng = np.random.default_rng(3)

# ---------- fisica generica ----------
DT = 1/1000.0
class Spring:
    """Mola amortecida com alvos em degraus e impulsos, integrada no intervalo [t0, t1]."""
    def __init__(self, t0, t1, targets, k=150, c=16, impulses=()):
        n = int((t1 - t0 + 0.3)/DT) + 1; self.t0 = t0; self.a = np.zeros(n)
        x = targets[0][1]; v = 0.0; ti = 0; tgt = x; imp = sorted(impulses); ii = 0
        for i in range(n):
            t = t0 + i*DT
            while ti + 1 < len(targets) and t >= targets[ti+1][0]: ti += 1; tgt = targets[ti][1]
            while ii < len(imp) and t >= imp[ii][0]: v += imp[ii][1]; ii += 1
            v += (k*(tgt - x) - c*v)*DT; x += v*DT; self.a[i] = x
    def __call__(self, t): return self.a[min(max(int(round((t - self.t0)/DT)), 0), len(self.a)-1)]

ROLL = [0.0]
def bloom(f):
    br = np.clip(f - 0.75, 0, None); f = f + cv2.GaussianBlur(br, (0, 0), 18)*0.75
    ang = 1.0*math.sin(ROLL[0]*0.7 + 1.3)
    return cv2.warpAffine(f, cv2.getRotationMatrix2D((W/2, H/2), ang, 1.035), (W, H), borderMode=cv2.BORDER_REFLECT)

SPARK = [(rng.uniform(60, 1020), rng.uniform(150, 1800), rng.uniform(0.4, 1.2), rng.uniform(0, 6)) for _ in range(50)]
def sparks(f, t, P):
    for (x0, y0, sp, ph) in SPARK:
        yv = (y0 - t*110*sp) % 1800 + 80; xv = x0 + 22*math.sin(t*1.3 + ph)
        px, py = P(xv, yv); b = 0.5 + 0.5*math.sin(t*3.5 + ph)
        cv2.circle(f, (int(px), int(py)), 2 + int(sp*2), (0.9*b, 0.6*b, 1.0*b), -1, cv2.LINE_AA)

TXT = {}
def T(s, size, glow=(255, 60, 200), fill=(255, 255, 255)):
    k = (s, size, glow, fill)
    if k not in TXT: TXT[k] = text_sprite(s, F_BLACK, size, fill=fill, glow=glow)
    return TXT[k]

# ---------- assets ----------
ZL = load_sprite(f"{S}/v1/assets/zelda_logo.png", 540)
GL = load_sprite(f"{KIT}/assets/logos/gta6-logo.png", 470)
ZL_VS = load_sprite(f"{S}/v1/assets/zelda_logo.png", 440)
CARD = review_card(70, 86); CARDS = review_card(46, 57)
RED = review_card(230, 280, (235, 40, 60), 60)
B99 = badge(99, 300); BRED = {n: badge(n, 300, (235, 40, 60)) for n in (99, 96, 94, 91)}
GLOWB = glow_dot(460, (255, 120, 230)); GLOWW = glow_dot(380, (255, 230, 200))
def _meta():
    im = Image.open("/root/.claude/uploads/160acac5-b307-5059-8cfe-e8b2ecad7162/6c19ba3a-image.png").convert("RGBA")
    m = Image.new("L", im.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, im.width-1, im.height-1], 44, fill=255)
    im.putalpha(m)
    sh = Image.new("RGBA", (im.width+140, im.height+140), (0, 0, 0, 0))
    sh.paste((0, 0, 0, 190), (70, 95), m); sh = sh.filter(ImageFilter.GaussianBlur(30))
    sh.alpha_composite(im, (70, 70)); return to_sprite(sh)
META = _meta()

# ================= CENAS ANIMADAS =================
# --- Metacritic (9.60 -> 12.08) ---
mt_y = Spring(9.6, 12.1, [(9.6, 900.0), (9.62, 0.0)], k=110, c=14)
mt_r = Spring(9.6, 12.1, [(9.6, 8.0), (9.62, 0.0)], k=90, c=10)
mt_s = Spring(9.6, 12.1, [(9.6, 0.78), (10.05, 1.30), (11.60, 1.30)], k=60, c=13)
mt_px = Spring(9.6, 12.1, [(9.6, 670.0), (10.05, 600.0)], k=60, c=13)
mt_py = Spring(9.6, 12.1, [(9.6, 656.0), (10.05, 380.0), (11.60, 960.0)], k=55, c=12.5)
def cena_meta(t):
    f = CEN.frame(t, 1 + 0.12*(t - 9.6)/2.5)
    ec = 1 + 0.08*(t - 9.6)/2.5
    s = mt_s(t)*ec; px, py = mt_px(t), mt_py(t)
    cx = 540 + (META.shape[1]/2 - px)*s; cy = 960 + (META.shape[0]/2 - py)*s + mt_y(t)
    blit(f, GLOWB, 540, 960, 1.6, 0, 0.5)
    blit(f, META, cx, cy, s, mt_r(t))
    return bloom(f)

# --- Criticos (19.23 -> 29.45) ---
T0c = 19.23
z_pop = Spring(T0c, 29.5, [(T0c, 0.0), (19.30, 1.0)], k=220, c=13)
grp = Spring(T0c, 29.5, [(T0c, 0.0), (22.70, -1250.0)], k=70, c=14)        # grupo Zelda sai pra esquerda
grp2 = Spring(T0c, 29.5, [(T0c, 1250.0), (22.70, 0.0)], k=70, c=14)        # grupo GTA entra da direita
lab1 = Spring(T0c, 29.5, [(T0c, 0.0), (21.54, 1.0)], k=230, c=13)
lab2 = Spring(T0c, 29.5, [(T0c, 0.0), (25.08, 1.0)], k=230, c=13)
cnt_out = Spring(T0c, 29.5, [(T0c, 1.0), (26.95, 0.0)], k=160, c=16)
avg = Spring(T0c, 29.5, [(T0c, 0.0), (27.10, 1.0)], k=230, c=12, impulses=[(28.14, -9.0)])
push = Spring(T0c, 29.5, [(T0c, 0.0), (27.05, 1.0)], k=40, c=11)
shx = Spring(T0c, 29.5, [(T0c, 0.0)], k=800, c=20, impulses=[(28.14, 420), (22.72, -150)])
shy = Spring(T0c, 29.5, [(T0c, 0.0)], k=800, c=20, impulses=[(28.14, -300)])
def card_pop(t, ti, k=260, c=14):
    """escala de mola analitica (sem integrar 120 molas): resposta ao degrau de oscilador amortecido"""
    if t < ti: return 0.0
    w0 = math.sqrt(k); z = c/(2*w0); wd = w0*math.sqrt(max(1 - z*z, 1e-6)); u = t - ti
    return 1 - math.exp(-z*w0*u)*(math.cos(wd*u) + z*w0/wd*math.sin(wd*u))
# carta vermelha: gravidade ate bater na media, depois ricocheteia
RED_T, HIT = 27.58, 28.14
def red_state(t):
    y_hit = 880 - 170
    g = 2*(y_hit + 220)/((HIT - RED_T)**2)
    if t < HIT:
        u = t - RED_T; return 540 + 30*u, -220 + 0.5*g*u*u, -18 + 30*u
    u = t - HIT; vx, vy = 900, -900
    return 540 + 30*(HIT-RED_T) + vx*u, y_hit + vy*u + 0.5*g*u*u, -2 + 420*u
def cena_criticos(t):
    f = CEN.frame(t, 1 + 0.18*(t - T0c)/10)
    ec = (1 + 0.12*(t - T0c)/10) * (1 + 0.18*push(t))
    def P(x, y): return 540 + (x - 540)*ec + shx(t), 960 + (y - 960)*ec + shy(t)
    sparks(f, t, P)
    # ---- grupo Zelda ----
    gx = grp(t)
    if gx > -1240:
        x, y = P(540 + gx, 520); blit(f, GLOWW, x, y, ec*1.2, 0, 0.35*z_pop(t))
        blit(f, ZL, x, y, ec*z_pop(t), 0, clamp(z_pop(t)*3))
        n = int(round(22*seg(t, 20.70, 21.35, lin)))
        if t >= 20.62:
            x, y = P(540 + gx, 860); blit(f, T(str(n), 280), x, y, ec*(1 + 0.06*math.exp(-(t-21.35)*8)*(t > 21.35)))
        if lab1(t) > 0.01:
            x, y = P(540 + gx, 1010); blit(f, T("CRÍTICOS", 64, None), x, y, ec*lab1(t), 0, clamp(lab1(t)*3))
        for i in range(22):
            k = card_pop(t, 20.70 + i*0.028)
            if k <= 0.01: continue
            c, r = i % 11, i // 11
            x, y = P(540 + gx - 400 + c*80, 1150 + r*104 - (1 - k)*120); blit(f, CARD, x, y, ec*k, 0, clamp(k*3))
    # ---- grupo GTA ----
    gx2 = grp2(t)
    if gx2 < 1240:
        x, y = P(540 + gx2, 520); blit(f, GLOWB, x, y, ec*1.0, 0, 0.45)
        blit(f, T("GTA VI", 170, glow=(255, 120, 40), fill=(255, 225, 120)), x, y, ec)
        o = cnt_out(t)
        if t >= 24.30 and o > 0.01:
            v = seg(t, 24.35, 25.05, lin); n = int(round(100*v))
            x, y = P(540 + gx2, 860)
            blit(f, T(f"{n}+" if v >= 1 else str(n), 280, glow=(255, 140, 40)), x, y, ec*o*(1 + 0.06*math.exp(-(t-25.05)*8)*(t > 25.05)), 0, clamp(o*2))
        if lab2(t) > 0.01 and o > 0.01:
            x, y = P(540 + gx2, 1010); blit(f, T("ANÁLISES", 64, None), x, y, ec*lab2(t)*o, 0, clamp(lab2(t)*3)*o)
        dim = 1 - 0.55*seg(t, 27.0, 27.4)
        for i in range(112):
            k = card_pop(t, 24.35 + i*0.0170, k=300, c=15)
            if k <= 0.01: continue
            c, r = i % 16, i // 16
            x, y = P(540 + gx2 - 450 + c*60, 1100 + r*58 - (1 - k)*160); blit(f, CARDS, x, y, ec*k, 0, clamp(k*3)*dim)
    # ---- media 99 e a nota baixa ----
    a = avg(t)
    if a > 0.01:
        num = 99 if t < HIT else (96, 94, 91)[min(2, int((t - HIT)/0.11))]
        spr = B99 if t < HIT else BRED[num]
        x, y = P(540, 880); blit(f, GLOWW if t < HIT else glow_dot(380, (255, 60, 60)), x, y, ec*1.3, 0, 0.5*min(a, 1))
        blit(f, spr, x, y, ec*a, 0, clamp(a*3))
        if t >= 27.25: x2, y2 = P(540, 1110); blit(f, T("MÉDIA", 64, None), x2, y2, ec*card_pop(t, 27.25), 0, 1)
    if t >= RED_T:
        rx, ry, rr = red_state(t); x, y = P(rx, ry); blit(f, RED, x, y, ec, rr)
    return bloom(f)

# --- Atualizacao (32.15 -> 35.01) ---
T0u = 32.15
u_z = Spring(T0u, 35.1, [(T0u, 0.0), (32.55, 1.0)], k=200, c=13)
u_p = Spring(T0u, 35.1, [(T0u, 700.0), (33.12, 0.0)], k=110, c=13)
u_x = Spring(T0u, 35.1, [(T0u, 0.0)], k=900, c=16, impulses=[(34.44, 900)])
u_X = Spring(T0u, 35.1, [(T0u, 0.0), (34.44, 1.0)], k=320, c=15)
PAINEL = None
def cena_update(t):
    global PAINEL
    if PAINEL is None:
        im = rounded(900, 270, 40, (22, 6, 36, 235), (255, 90, 220, 255), 6)
        d = ImageDraw.Draw(im); from PIL import ImageFont
        d.text((60, 46), "ATUALIZAÇÃO 1.01", font=ImageFont.truetype(F_BLACK, 52), fill=(255, 255, 255, 255))
        PAINEL = to_sprite(im)
    f = CEN.frame(t, 1 + 0.15*(t - T0u)/2.9)
    ec = 1 + 0.12*(t - T0u)/2.9
    def P(x, y): return 540 + (x - 540)*ec + u_x(t), 960 + (y - 960)*ec
    sparks(f, t, P)
    k = u_z(t); x, y = P(540, 600); blit(f, GLOWW, x, y, ec*1.2, 0, 0.3*k); blit(f, ZL, x, y, ec*k*1.05, 0, clamp(k*3))
    py = 1090 + u_p(t)
    if py < 1900:
        x, y = P(540, py); blit(f, PAINEL, x, y, ec)
        # barra (com pequenas travadas no progresso, como download real)
        prog = 0.40*seg(t, 33.45, 34.40, lambda u: clamp(u + 0.06*math.sin(u*18)))
        failed = t >= 34.44
        bx0, by0 = P(120, py + 25); bx1, by1 = P(960, py + 85)
        cv2.rectangle(f, (int(bx0), int(by0)), (int(bx1), int(by1)), (0.28, 0.08, 0.22), -1, cv2.LINE_AA)
        col = (0.25, 0.2, 1.0) if failed else (1.0, 0.4, 1.0)
        cv2.rectangle(f, (int(bx0), int(by0)), (int(bx0 + (bx1 - bx0)*prog), int(by1)), col, -1, cv2.LINE_AA)
    kx = u_X(t)
    if kx > 0.01:
        x, y = P(540, 1090); blit(f, T("X", 520, glow=(40, 40, 255), fill=(255, 50, 70)), x, y, ec*(2.2 - 1.2*min(kx, 1.2)), 0, clamp(kx*2.5))
    return bloom(f)

# --- VS / trono (51.53 -> 54.27): GTA em cima, VS no meio, Zelda embaixo ---
T0v = 51.53
GL_VS = load_sprite(f"{KIT}/assets/logos/gta6-logo.png", 480)
ZL_VS2 = load_sprite(f"{S}/v1/assets/zelda_logo.png", 420)
v_g = Spring(T0v, 54.4, [(T0v, -900.0), (51.55, 0.0)], k=120, c=14)
v_z = Spring(T0v, 54.4, [(T0v, 900.0), (51.55, 0.0)], k=120, c=14)
v_vs = Spring(T0v, 54.4, [(T0v, 0.0), (51.80, 1.0)], k=260, c=12)
v_hl = Spring(T0v, 54.4, [(T0v, 0.5), (52.62, 0.0), (53.20, 1.0)], k=90, c=13)   # 0=GTA em destaque, 1=Zelda
def cena_vs(t):
    f = CEN.frame(t, 1.14 - 0.12*(t - T0v)/2.7)
    ec = 1.12 - 0.10*(t - T0v)/2.7
    def P(x, y): return 540 + (x - 540)*ec, 960 + (y - 960)*ec
    sparks(f, t, P)
    h = v_hl(t)
    gx, gy = P(540, 610 + v_g(t)); zx, zy = P(540, 1250 + v_z(t))
    blit(f, GLOWW, mix(gx, zx, h), mix(gy, zy, h), ec*1.6, 0, 0.55)
    sg = 1 + 0.12*(1 - h) - 0.10*h; sz = 1 + 0.12*h - 0.10*(1 - h)
    blit(f, GL_VS, gx, gy, ec*sg, 0, 1 - 0.55*h)
    blit(f, ZL_VS2, zx, zy, ec*sz, 0, 1 - 0.55*(1 - h))
    k = v_vs(t); x, y = P(540, 935); blit(f, T("VS", 190, glow=(255, 60, 200)), x, y, ec*k, mix(-25, -6, min(k, 1)), clamp(k*3))
    return bloom(f)

# ================= LINHA DO TEMPO =================
# gameplay: (ini, fim, fonte, ini_fonte, mascara, modo, zoom_ini, zoom_fim, centro_ini, centro_fim)
G = lambda *a: ("gp",) + a
A = lambda a, b, fn: ("anim", a, b, fn)
TL = [
    A(0.00, 5.03, lambda t: I4.cena(t)),
    G(5.03, 7.53, GTA, 26038.5, M_GTA, "box", 1.00, 1.35, (930, 420), (930, 420)),
    G(7.53, 9.60, GTA, 93785.0, M_GTA, "box", 1.30, 1.05, (860, 470), (1060, 470)),
    A(9.60, 12.08, cena_meta),
    G(12.08, 13.10, ZEL, 49.0, M_ZEL, "box", 1.00, 1.25, None, None),
    G(13.10, 14.17, ZEL, 70.2, M_ZEL, "box", 1.25, 1.00, None, None),
    G(14.17, 16.93, ZEL, 652.0, M_ZEL, "box", 1.00, 1.30, (400, 240), (454, 240)),
    G(16.93, 19.23, GTA, 95883.0, M_GTA, "box", 1.30, 1.00, None, None),
    A(19.23, 29.45, cena_criticos),
    G(29.45, 30.85, GTA, 1262.0, M_GTA, "box", 1.00, 1.30, None, None),
    G(30.85, 32.15, GTA, 2520.5, M_GTA, "full", 1.08, 1.00, (880, 475), (860, 475)),
    A(32.15, 35.01, cena_update),
    G(35.01, 36.30, ZEL, 818.5, M_ZEL, "box", 1.00, 1.25, None, None),
    G(36.30, 37.95, ZEL, 823.5, M_ZEL, "box", 1.25, 1.02, None, None),
    G(37.95, 40.09, BUG, 1.0, M_BUG, "box", 1.00, 1.25, None, None),
    G(40.09, 41.53, BUG, 11.0, M_BUG_PONTE, "box", 1.25, 1.00, (520, 420), (520, 420)),
    G(41.53, 42.35, BUG, 53.3, M_BUG, "box", 1.00, 1.20, None, None),
    G(42.35, 44.05, BUG, 59.2, M_BUG, "box", 1.25, 1.00, None, None),
    G(44.05, 45.60, GTA, 6779.0, M_GTA, "full", 1.00, 1.12, (1060, 450), (1070, 440)),
    G(45.60, 47.29, GTA, 9179.75, M_GTA, "full", 1.12, 1.00, (1000, 470), (1010, 470)),
    G(47.29, 49.45, GTA, 90780.5, M_GTA, "box", 1.00, 1.30, (900, 470), (1020, 470)),
    G(49.45, 51.53, GTA, 94078.0, M_GTA, "box", 1.30, 1.00, None, None),
    A(51.53, 54.27, cena_vs),
    G(54.27, TOTAL, GTA, 16229.0, M_GTA, "box", 1.00, 1.25, None, None),
]
FLASH = [28.14]; ZOOM_TR = [29.45]; WHIP_TR = [51.53]

y98 = Spring(15.3, 16.95, [(15.3, 0.0), (15.42, 1.0)], k=240, c=13)
def overlay(f, t):
    if 15.3 <= t < 16.93:
        k = y98(t)
        if k > 0.01: blit(f, T("1998", 150, glow=(255, 60, 200)), 540, 330, k, mix(-12, 0, min(k, 1)), clamp(k*3))
    return f

def post(f, t):
    for T0 in ZOOM_TR:
        if T0 - 0.18 <= t < T0: u = (t - (T0 - 0.18))/0.18; f = zoom_blur(f, 1 + 0.6*u*u, 0.25*u)
        if T0 <= t < T0 + 0.25: u = 1 - e_out((t - T0)/0.25); f = zoom_blur(f, 1 + 0.5*u, 0.2*u)
    for T0 in WHIP_TR:
        if T0 - 0.15 <= t < T0: u = e_in((t - (T0 - 0.15))/0.15); f = whip(f, -W*0.7*u, 90*u)
        if T0 <= t < T0 + 0.2: u = 1 - e_out((t - T0)/0.2); f = whip(f, W*0.7*u, 90*u)
    for T0 in FLASH:
        if T0 - 0.04 <= t < T0 + 0.35:
            a_ = seg(t, T0 - 0.04, T0, lin) if t < T0 else 1 - seg(t, T0, T0 + 0.35, e_out)
            f = f*(1 - a_) + a_
    if t > TOTAL - 0.5: f = f*max(0, (TOTAL - t)/0.5)
    return f

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
            _, a, b, src, s0, mask, mode, z0, z1, c0, c1 = item
            sw_, sh_ = probe_size(src)
            frames = read_frames(src, s0 + (lo - f0)/FPS2, (hi - lo)/FPS2, sw_, sh_, fps=FPS2)
            mc = ((mask[0]+mask[2])/2, (mask[1]+mask[3])/2); c0 = c0 or mc; c1 = c1 or c0
        for fi in range(lo, hi):
            t = fi/FPS2
            if item[0] == "anim":
                acc = np.zeros((H, W, 3), np.float32)
                for k in range(sub): ROLL[0] = t + k*shutter/FPS2/sub; acc += item[3](ROLL[0])
                f = acc/sub
            else:
                k = (fi - f0)/max(f1 - f0 - 1, 1)
                fr = frames[min(fi - lo, len(frames) - 1)]
                f = render_gameplay(fr, mask, mode, mix(z0, z1, k), mix(c0[0], c1[0], k), mix(c0[1], c1[1], k), box_w=1650, cy_s=880)
                f = overlay(f, t)
            f = post(f, t)
            enc.stdin.write((np.clip(f, 0, 1)*255).astype(np.uint8).tobytes())
        frames = None
    enc.stdin.close(); enc.wait()

if __name__ == "__main__":
    render(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]))
