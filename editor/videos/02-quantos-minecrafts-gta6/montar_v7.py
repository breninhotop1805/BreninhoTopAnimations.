# Video 2 (v7): animacoes no estilo do video 1 / referencia Metacritic: synthwave, logos centralizadas,
# selos de numero grudados nas logos, contador subindo + pilha se formando. Fisica de mola, 60 fps.
import sys, math, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import montar_v6 as V6
from montar_v6 import *
V2D = "/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad/v2"

def grass_block(size):
    sys.path.insert(0, V2D)
    import montar_v2 as M2
    return M2.grass_block(size)
BLK = grass_block(40); BLK_T = grass_block(14)

GLx = load_sprite(f"{KIT}/assets/logos/gta6-logo.png", 600); GLm = load_sprite(f"{KIT}/assets/logos/gta6-logo.png", 380)
MCL = load_sprite(f"{UP}/61c99b5d-image.png", 760)
def gray(spr, amt=0.75, dark=0.85):
    s = spr.copy(); g = s[..., :3].mean(-1, keepdims=True); s[..., :3] = (s[..., :3]*(1 - amt) + g*amt)*dark; return s
MCL_OLD = gray(MCL)
GLOW = glow_dot(420, (255, 120, 230))

def tag(txt, bg, size=96):
    f = ImageFont.truetype(F_BLACK, size); bb = f.getbbox(txt)
    w = bb[2] - bb[0] + int(size*0.8); h = int(size*1.45)
    im = rounded(w, h, int(h*0.22), bg + (255,)); d = ImageDraw.Draw(im)
    d.text(((w - (bb[2] + bb[0]))/2, (h - (bb[3] + bb[1]))/2), txt, font=f, fill=(255, 255, 255))
    sh = Image.new("RGBA", (w + 60, h + 60), (0, 0, 0, 0)); sh.paste((0, 0, 0, 140), (30, 42), im.split()[3])
    sh = sh.filter(ImageFilter.GaussianBlur(12)); sh.alpha_composite(im, (30, 30)); return to_sprite(sh)
PINKB = (235, 40, 150); GREENB = (70, 175, 70); GRAYB = (95, 95, 110)
TAG212 = tag("212 GB", PINKB); TAG212s = tag("212 GB", PINKB, 70); TAG1 = tag("1 GB", GREENB, 54); TAG09 = tag("0,9 MB", GRAYB, 84)
NUMS = {}
def num(txt, size=230):
    k = (txt, size)
    if k not in NUMS:
        if len(NUMS) > 500: NUMS.clear()
        NUMS[k] = text_sprite(txt, F_BLACK, size, fill=(255, 255, 255), stroke=8, stroke_fill=(40, 10, 50), glow=None)
    return NUMS[k]
LBL = text_sprite("MINECRAFTS", F_BLACK, 64, fill=(255, 255, 255), stroke=5, stroke_fill=(40, 10, 50), glow=None)
LBL2 = text_sprite("2009", F_BLACK, 70, fill=(230, 230, 235), stroke=5, stroke_fill=(40, 10, 50), glow=None)

def sp(t, ti, k=170, c=15): return step(t, ti, k, c)
def shake_xy(t, ti, amp=18):
    if t < ti: return 0, 0
    e = amp*math.exp(-(t - ti)*10); return e*math.sin((t - ti)*55), e*math.cos((t - ti)*47)
def scene(t, t0, dur):
    f = fundo(t, 1 + 0.16*(t - t0)/dur); ec = 1 + 0.10*(t - t0)/dur
    return f, ec

# ===== A1 212 gigas (8.06 -> 10.34) =====
def a1(t):
    f, ec = scene(t, 8.06, 2.3)
    k = sp(t, 8.06, 120, 14); dx, dy = shake_xy(t, 9.04)
    def P(x, y): return 540 + (x - 540)*ec + dx, 960 + (y - 960)*ec + dy
    x, y = P(540, 760 + 260*(1 - k)); blit(f, GLOW, x, y, ec*1.3, 0, 0.5*clamp(k))
    blit(f, GLx, x, y, ec*mix(0.7, 1.0, k), 0, clamp(k*3))
    kb = sp(t, 9.04, 520, 20)
    if kb > 0.01: bx, by = P(540 + 190, 760 + 165); blit(f, TAG212, bx, by, ec*mix(1.6, 1.0, kb), mix(-18, 6, min(kb, 1)), clamp(kb*4))
    return finish(f, t)

# ===== A2 1 giga (15.33 -> 17.57) =====
def a2(t):
    f, ec = scene(t, 15.33, 2.25)
    up = e_io(clamp((t - 15.33)/0.5))
    def P(x, y): return 540 + (x - 540)*ec, 960 + (y - 960)*ec
    gy = mix(760, 560, up); gs = mix(1.0, 0.72, up)
    x, y = P(540, gy); blit(f, GLx, x, y, ec*gs); blit(f, TAG212, *P(540 + 190*gs, gy + 165*gs), ec*gs, 6)
    km = sp(t, 15.55, 120, 14)
    x, y = P(540, 1040 + 300*(1 - km)); blit(f, GLOW, x, y, ec*1.0, 0, 0.35*clamp(km)); blit(f, MCL, x, y, ec*0.95, 0, clamp(km*3))
    kt = sp(t, 16.71, 480, 18)
    if kt > 0.01: bx, by = P(540 + 330, 1040 + 70); blit(f, TAG1, bx, by, ec*mix(2.0, 1.0, kt), mix(-20, 6, min(kt, 1)), clamp(kt*4))
    return finish(f, t)

# ===== A3 212 Minecrafts (17.57 -> 22.03) =====
COLS = 20; GRID = [(i % COLS, i//COLS) for i in range(212)]
def a3(t):
    f, ec = scene(t, 17.57, 4.5)
    def P(x, y): return 540 + (x - 540)*ec, 960 + (y - 960)*ec
    k = sp(t, 17.57, 120, 14)
    x, y = P(540, 470 + 200*(1 - k)); blit(f, GLm, x, y, ec, 0, clamp(k*3))
    kn = sp(t, 18.55, 300, 16)
    if kn > 0.01:
        n = int(round(212*e_out(clamp((t - 18.89)/1.6))));
        bump = 1 + 0.08*math.exp(-max(0, t - 20.5)*8)*(t >= 20.5)
        if n >= 1: x, y = P(540, 790); blit(f, num(str(n), 230), x, y, ec*kn*bump, 0, clamp(kn*3))
    kl = sp(t, 19.77, 260, 15)
    if kl > 0.01: x, y = P(540, 925); blit(f, LBL, x, y, ec*kl, 0, clamp(kl*3))
    for i, (c, r) in enumerate(GRID):
        ti = 18.89 + 1.6*(i/len(GRID))**1.2
        kk = sp(t, ti, 420, 22)
        if kk <= 0.01: continue
        x, y = P(540 - (COLS - 1)*16 + c*32, 1030 + r*30 - 60*(1 - kk)); blit(f, BLK_T, x, y, ec*kk*1.85, 0, clamp(kk*3))
    return finish(f, t)

# ===== A4 menos de 1 mega (34.45 -> 36.19) =====
def a4(t):
    f, ec = scene(t, 34.45, 1.75)
    def P(x, y): return 540 + (x - 540)*ec, 960 + (y - 960)*ec
    k = sp(t, 34.45, 120, 14)
    x, y = P(540, 620 - 120*(1 - k)); blit(f, LBL2, x, y, ec*k, 0, clamp(k*3))
    x, y = P(540, 800 + 260*(1 - k)); blit(f, MCL_OLD, x, y, ec*mix(0.7, 0.95, k), 0, clamp(k*3))
    kb = sp(t, 35.25, 520, 20)
    if kb > 0.01: bx, by = P(540, 1000); blit(f, TAG09, bx, by, ec*mix(2.4, 1.0, kb), mix(-15, -4, min(kb, 1)), clamp(kb*4))
    return finish(f, t)

# ===== A5 200 mil (39.46 -> 44.28) =====
rng7 = np.random.default_rng(7)
DUST = [(rng7.uniform(-330, 330), rng7.uniform(0, 300), rng7.uniform(0, 1)) for _ in range(1400)]
def a5(t):
    f, ec = scene(t, 39.46, 4.8)
    dx, dy = shake_xy(t, 41.98, 22)
    def P(x, y): return 540 + (x - 540)*ec + dx, 960 + (y - 960)*ec + dy
    k = sp(t, 39.46, 120, 14)
    x, y = P(540, 470 + 200*(1 - k)); blit(f, GLm, x, y, ec, 0, clamp(k*3))
    kn = sp(t, 39.80, 300, 16)
    u = clamp((t - 39.90)/(41.98 - 39.90)); n = 200000 if t >= 41.98 else int(200000*u**2.4)
    pulse = 1 + 0.10*math.exp(-max(0, t - 41.98)*7)*(t >= 41.98)
    if kn > 0.01:
        txt = ("+" if t >= 41.98 else "") + f"{n:,}".replace(",", ".")
        x, y = P(540, 790); blit(f, num(txt, 170), x, y, ec*kn*pulse, 0, clamp(kn*3))
        x, y = P(540, 925); blit(f, LBL, x, y, ec*kn, 0, clamp(kn*3))
    # pilha organizada de minecrafts minusculos (grade fina que enche linha a linha)
    frac = clamp((t - 39.90)/(41.98 - 39.90))**1.6
    GC, GR, cs = 66, 30, 10
    nd = int(GC*GR*frac)
    if nd:
        x0, y0 = P(540 - GC*cs/2, 1030); s_ = cs*ec
        for i in range(nd):
            r_, c_ = divmod(i, GC)
            px, py = x0 + c_*s_, y0 + r_*s_
            col = (0.36, 0.80, 0.42) if (c_ + r_) % 3 else (0.30, 0.66, 0.36)
            cv2.rectangle(f, (int(px), int(py)), (int(px + s_ - 2), int(py + s_ - 2)), col, -1)
    return finish(f, t)

REPL = {8.06: a1, 15.33: a2, 17.57: a3, 34.45: a4, 39.46: a5}
for it in V6.TL:
    if "anim" in it: it["anim"] = REPL[it["a"]]
M.TL = V6.TL
M.counter_overlay = lambda f, t: f

if __name__ == "__main__":
    M.render(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]))
