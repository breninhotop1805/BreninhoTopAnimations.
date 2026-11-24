# Video 2 (v4): edicao guiada por gameplay, cortes rapidos, texto cinetico no centro so nos momentos-chave.
import sys, math, subprocess, json, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
V1 = "/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad/v1"
sys.path.insert(0, V1)
from lib import *

FPS2 = 60
S = "/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad"
GTA = f"{S}/full/gta6_full.mp4"; I = f"{S}/v2/in"
SHA = f"{I}/mc_shaders.mp4"; PRE = f"{I}/mc_prealpha.mp4"; TRA = f"{I}/mc_trailer.mp4"
MASK = {GTA: (0, 64, 1920, 885), SHA: (0, 0, 1920, 1080), PRE: (0, 40, 640, 480), TRA: (0, 0, 1920, 1080)}
TOTAL = 54.25
KOMIKA = "/home/user/BreninhoTopAnimations./editor/fontes/KOMIKAX_.ttf"

def step_pop(t, ti, k=320, c=16):
    if t < ti: return 0.0
    w0 = math.sqrt(k); z = c/(2*w0); wd = w0*math.sqrt(max(1 - z*z, 1e-6)); u = t - ti
    return 1 - math.exp(-z*w0*u)*(math.cos(wd*u) + z*w0/wd*math.sin(wd*u))

# ---------- enquadramentos ----------
def render_split(frA, frB, srcA, srcB, zA, zB):
    out = np.zeros((H, W, 3), np.float32)
    for k, (fr, src, z) in enumerate(((frA, srcA, zA), (frB, srcB, zB))):
        x0, y0, x1, y1 = MASK[src]; mw, mh = x1 - x0, y1 - y0
        img = fr[y0:y1, x0:x1].astype(np.float32)/255
        hh = H//2; s = max(W/mw, hh/mh)*z
        M = np.float32([[s, 0, W/2 - s*mw/2], [0, s, hh/2 - s*mh/2]])
        out[k*hh:(k + 1)*hh] = cv2.warpAffine(img, M, (W, hh), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
    blur = cv2.GaussianBlur(out, (0, 0), 1.1); out = cv2.addWeighted(out, 1.4, blur, -0.4, 0)
    # divisoria com brilho
    line = np.zeros((H, W), np.float32); cv2.line(line, (0, H//2), (W, H//2), 1.0, 6)
    g = cv2.GaussianBlur(line, (0, 0), 14)*2.2 + line
    out += g[..., None]*np.array([1.0, 0.35, 1.0])
    return np.clip(out, 0, 1)

# ---------- texto cinetico (Komika Axis) ----------
_TS = {}
def ktext(txt, size, fill=(255, 255, 255), stroke=16, glow=None):
    key = (txt, size, fill, stroke, glow)
    if key in _TS: return _TS[key]
    f = ImageFont.truetype(KOMIKA, size); bb = f.getbbox(txt, stroke_width=stroke); pad = 60
    w, h = bb[2] - bb[0] + pad*2, bb[3] - bb[1] + pad*2
    base = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(base)
    d.text((pad - bb[0] + 7, pad - bb[1] + 10), txt, font=f, fill=(0, 0, 0, 170), stroke_width=stroke, stroke_fill=(0, 0, 0, 170))
    base = base.filter(ImageFilter.GaussianBlur(9))
    if glow:
        gl = Image.new("RGBA", (w, h), (0, 0, 0, 0)); ImageDraw.Draw(gl).text((pad - bb[0], pad - bb[1]), txt, font=f, fill=glow + (255,), stroke_width=stroke + 10, stroke_fill=glow + (255,))
        gl = gl.filter(ImageFilter.GaussianBlur(22)); base.alpha_composite(gl)
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((pad - bb[0], pad - bb[1]), txt, font=f, fill=fill + (255,), stroke_width=stroke, stroke_fill=(0, 0, 0, 255))
    base.alpha_composite(im); _TS[key] = to_sprite(base); return _TS[key]
WHITE = (255, 255, 255); GREEN = (90, 235, 110); PINK = (255, 70, 190); YELLOW = (255, 214, 10)

YEL = (255, 214, 10)
# (texto, entra, sai, cor, glow, estilo_entrada, estilo_saida, tamanho)
CAPS = [
    ("QUANTOS",      0.04, 0.52, WHITE, None,            "pop",   "left", 200),
    ("MINECRAFTS",   0.52, 1.30, YEL, None,   "drop",  "fall", 190),
    ("CABEM DENTRO", 1.30, 1.90, WHITE, None,            "slide", "left", 150),
    ("DE UM ÚNICO",  1.90, 2.54, WHITE, None,            "pop",   "up",   160),
    ("GTA 6?",       2.54, 3.48, PINK, None,  "slam",  "fall", 250),
    ("212",          8.06, 9.04, YEL, None,   "slam",  "up",   300),
    ("GIGAS",        9.04, 10.30, WHITE, None,           "rise",  "fall", 230),
    ("#212",         18.89, 19.77, YEL, None,   "pop",   "left", 300),
    ("MINECRAFTS",   19.77, 21.31, WHITE, None,          "slide", "fall", 190),
    ("MAIS DE",      41.38, 41.98, WHITE, None,          "pop",   "up",   200),
    ("200 MIL",      41.98, 42.78, YEL, None,   "slam",  "left", 260),
    ("MINECRAFTS",   42.78, 43.55, WHITE, None,          "drop",  "fall", 190),
    ("GTA 6",        50.22, 51.46, PINK, None, "slam",  "left", 250),
    ("200 MIL",      51.46, 52.26, YEL, None,   "drop",  "up",   250),
    ("MINECRAFTS?",  52.26, 52.88, WHITE, None,          "pop",   "fall", 180),
]
EXIT = 0.16
def fit(txt, size, maxw=1000):
    spr = ktext(txt, size); w = spr.shape[1] - 120
    return size if w <= maxw else int(size*maxw/w)
def hero(f, t):
    for (txt, ti, to, col, glow, sin, sout, size) in CAPS:
        if t < ti or t >= to + EXIT: continue
        if txt.startswith("#"):
            n = int(212*e_out(clamp((t - ti)/0.5))); txt = str(max(n, 1))
        size = fit(txt if not txt.isdigit() else "212", size)
        u = t - ti; x, y, s, r, a = 540.0, 930.0, 1.0, 0.0, 1.0
        if sin == "pop":   p = step_pop(t, ti, 360, 17); s = 0.3 + 0.7*p; a = clamp(p*5)
        elif sin == "drop": p = step_pop(t, ti, 300, 15); y -= 700*(1 - p); r = -12*(1 - p)
        elif sin == "slide": p = step_pop(t, ti, 300, 17); x += 1100*(1 - p); r = 8*(1 - p)
        elif sin == "slam": p = step_pop(t, ti, 520, 20); s = mix(2.8, 1.0, p)
        elif sin == "rise": p = step_pop(t, ti, 280, 15); y += 650*(1 - p)
        r += 2.0*math.sin(u*2.4)                      # respiracao leve
        if t >= to:                                   # saida
            v = e_in((t - to)/EXIT)
            if sout == "fall": y += 900*v; r += 35*v
            elif sout == "left": x -= 1200*v
            elif sout == "up": s *= 1 + 0.9*v; a *= 1 - v
        blit(f, ktext(txt, size, col, glow=glow), x, y, s, r, a)
HERO = [(0.00, 3.64), (8.06, 10.46), (18.85, 21.47), (41.30, 43.71), (50.15, 53.04)]
def in_hero(t): return any(a <= t < b for a, b in HERO)

M1 = None
def medal_overlay(f, t):
    global M1
    if not (47.12 <= t < 48.48): return
    if M1 is None:
        import intro_v4 as I4; M1 = I4.medal(1, True, 90)
    k = step_pop(t, 47.12, k=260, c=13)
    blit(f, M1, 540, 470, k*1.15, mix(-30, -8, min(k, 1)), clamp(k*3))

# ---------- linha do tempo ----------
# (ini, fim, fonte, ini_fonte, modo, z0, z1, extras)
def C(a, b, src, s0, mode="box", z0=1.0, z1=1.2, **o): return dict(a=a, b=b, src=src, s0=s0, mode=mode, z0=z0, z1=z1, **o)
def SP(a, b, A_, B_, zA=(1.0, 1.15), zB=(1.15, 1.0)): return dict(a=a, b=b, split=(A_, B_), zA=zA, zB=zB)
TL = [
    C(0.00, 0.52, GTA, 93785.0, "full", 1.25, 1.10, punch=True),
    C(0.52, 1.30, SHA, 43.0, "full", 1.12, 1.25, punch=True),
    C(1.30, 1.90, SHA, 113.0, "full", 1.25, 1.12, punch=True),
    C(1.90, 2.54, GTA, 94078.0, "full", 1.10, 1.25, punch=True),
    C(2.54, 3.54, GTA, 90237.5, "full", 1.28, 1.10, punch=True),
    C(3.54, 4.62, SHA, 72.0, "full", 1.05, 1.25, punch=True),
    C(4.62, 5.44, GTA, 69660.8, "full", 1.25, 1.08, punch=True),
    C(5.44, 6.56, SHA, 16.5, "full", 1.05, 1.20),
    C(6.56, 7.42, GTA, 95883.0, "box", 1.00, 1.22),
    C(7.42, 8.06, GTA, 99540.0, "box", 1.22, 1.05),
    C(8.06, 9.04, GTA, 93300.0, "box", 1.25, 1.05),
    C(9.04, 10.34, GTA, 99959.8, "full", 1.05, 1.22),
    C(10.34, 11.28, GTA, 69898.5, "box", 1.28, 1.02),
    C(11.28, 12.22, GTA, 16229.0, "box", 1.00, 1.25),
    C(12.22, 13.73, GTA, 94078.5, "box", 1.25, 1.00),
    C(13.73, 14.60, SHA, 6.5, "box", 1.00, 1.22),
    C(14.60, 15.33, SHA, 81.0, "full", 1.20, 1.05),
    C(15.33, 16.50, SHA, 17.0, "box", 1.00, 1.25),
    C(16.50, 17.57, SHA, 105.5, "full", 1.22, 1.05),
    C(17.57, 18.55, GTA, 90240.5, "box", 1.00, 1.22),
    C(18.55, 19.77, SHA, 117.0, "box", 1.25, 1.02),
    C(19.77, 20.49, SHA, 74.0, "box", 1.00, 1.20),
    C(20.49, 21.31, SHA, 48.0, "box", 1.22, 1.02),
    C(21.31, 22.03, GTA, 90779.6, "box", 1.00, 1.20),
    SP(22.03, 24.37, (SHA, 50.0), (GTA, 69661.0)),
    C(24.37, 25.57, GTA, 69663.5, "full", 1.05, 1.25),
    C(25.57, 26.71, SHA, 119.0, "box", 1.00, 1.30),
    C(26.71, 27.99, GTA, 16231.0, "box", 1.25, 1.00),
    C(27.99, 28.93, SHA, 116.0, "box", 1.00, 1.22),
    C(28.93, 30.27, SHA, 107.0, "full", 1.20, 1.05),
    C(30.27, 31.73, PRE, 143.0, "box", 1.00, 1.22, box_w=1240),
    C(31.73, 32.41, PRE, 141.5, "box", 1.20, 1.02, box_w=1240),
    C(32.41, 33.43, PRE, 13.0, "box", 1.00, 1.20, box_w=1240),
    C(33.43, 34.45, PRE, 0.0, "box", 1.00, 2.10, c0=(320, 260), c1=(190, 175), box_w=1240, ease=True),
    C(34.45, 35.26, PRE, 138.0, "box", 1.20, 1.00, box_w=1240),
    C(35.26, 36.19, PRE, 132.5, "box", 1.00, 1.22, box_w=1240),
    C(36.19, 37.85, GTA, 99837.5, "full", 1.05, 1.22),
    C(37.85, 39.46, PRE, 136.0, "box", 1.22, 1.00, box_w=1240),
    C(39.46, 41.10, GTA, 93783.0, "full", 1.05, 1.25),
    C(41.10, 43.50, PRE, 110.9, "box", 1.30, 1.00, box_w=1240),
    C(43.50, 44.28, PRE, 137.5, "box", 1.00, 1.18, box_w=1240),
    C(44.28, 45.42, PRE, 139.0, "box", 1.18, 1.00, box_w=1240),
    C(45.42, 46.24, PRE, 1.2, "box", 1.00, 1.20, box_w=1240),
    C(46.24, 47.38, TRA, 13.0, "full", 1.20, 1.05),
    C(47.38, 48.48, TRA, 24.0, "box", 1.00, 1.22),
    SP(48.48, 52.90, (GTA, 95884.0), (SHA, 6.3)),
    C(52.90, TOTAL, SHA, 105.5, "full", 1.05, 1.25),
]
GLITCH = 5.44; ZOOM_OUT = 26.71; REWIND = 30.27; FLASH = 41.98; WHIP = 48.48

def post(f, t):
    if in_hero(t):     # escurece o centro pra o texto respirar
        f = f*VIG
    hero(f, t); medal_overlay(f, t)
    g = math.exp(-max(0, t - GLITCH)*7) if t >= GLITCH - 0.06 else 0
    if t < GLITCH: g = clamp((t - (GLITCH - 0.06))/0.06)
    if g > 0.03:
        r = np.random.default_rng(int(t*60)); sh = int(32*g); f2 = f.copy()
        f2[..., 2] = np.roll(f[..., 2], sh, 1); f2[..., 0] = np.roll(f[..., 0], -sh, 1)
        for _ in range(9):
            y0 = int(r.uniform(0, H - 80)); hh = int(r.uniform(15, 100)); dx = int(r.uniform(-130, 130)*g)
            f2[y0:y0 + hh] = np.roll(f2[y0:y0 + hh], dx, 1)
        f = f2
    if ZOOM_OUT - 0.18 <= t < ZOOM_OUT: u = (t - (ZOOM_OUT - 0.18))/0.18; f = zoom_blur(f, 1 + 0.6*u*u, 0.25*u)
    if ZOOM_OUT <= t < ZOOM_OUT + 0.25: u = 1 - e_out((t - ZOOM_OUT)/0.25); f = zoom_blur(f, 1 + 0.5*u, 0.2*u)
    if REWIND - 0.30 <= t < REWIND + 0.22:
        u = clamp(1 - abs(t - REWIND)/0.3 if t < REWIND else 1 - (t - REWIND)/0.22)
        g2 = f.copy()
        for y0 in range(0, H, 6): g2[y0:y0 + 2] *= 1 - 0.5*u
        g2 = np.roll(g2, int(140*u*math.sin(t*90)), 1); sh = int(60*u)
        g2[..., 2] = np.roll(g2[..., 2], sh, 1); g2[..., 0] = np.roll(g2[..., 0], -sh, 1)
        f = g2*(1 - 0.15*u) + 0.15*u*np.array([1.0, 0.85, 0.9])
    if WHIP - 0.15 <= t < WHIP: u = e_in((t - (WHIP - 0.15))/0.15); f = whip(f, -W*0.7*u, 90*u)
    if WHIP <= t < WHIP + 0.2: u = 1 - e_out((t - WHIP)/0.2); f = whip(f, W*0.7*u, 90*u)
    if FLASH - 0.04 <= t < FLASH + 0.35:
        a_ = seg(t, FLASH - 0.04, FLASH, lin) if t < FLASH else 1 - seg(t, FLASH, FLASH + 0.35, e_out)
        f = f*(1 - a_) + a_
    if t > TOTAL - 0.5: f = f*max(0, (TOTAL - t)/0.5)
    return f
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIG = (1 - 0.42*np.exp(-(((xx - W/2)/(W*0.55))**2 + ((yy - H*0.48)/(H*0.30))**2)))[..., None]

def render(out, t_from, t_to):
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
                            "-r", str(FPS2), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "15",
                            "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    for it in TL:
        a, b = it["a"], it["b"]; f0, f1 = int(round(a*FPS2)), int(round(b*FPS2))
        lo, hi = max(f0, int(round(t_from*FPS2))), min(f1, int(round(t_to*FPS2)))
        if lo >= hi: continue
        dur = (hi - lo)/FPS2; off = (lo - f0)/FPS2
        if "split" in it:
            (sA, oA), (sB, oB) = it["split"]
            wA, hA = probe_size(sA); wB, hB = probe_size(sB)
            FA = read_frames(sA, oA + off, dur, wA, hA, fps=FPS2); FB = read_frames(sB, oB + off, dur, wB, hB, fps=FPS2)
        else:
            sw, sh = probe_size(it["src"]); FR = read_frames(it["src"], it["s0"] + off, dur, sw, sh, fps=FPS2)
            m = MASK[it["src"]]; mc = ((m[0] + m[2])/2, (m[1] + m[3])/2)
            c0 = it.get("c0", mc); c1 = it.get("c1", c0)
        for fi in range(lo, hi):
            t = fi/FPS2; k = (fi - f0)/max(f1 - f0 - 1, 1); j = fi - lo
            if "split" in it:
                f = render_split(FA[min(j, len(FA) - 1)], FB[min(j, len(FB) - 1)], it["split"][0][0], it["split"][1][0],
                                 mix(*it["zA"], k), mix(*it["zB"], k))
            else:
                if it.get("ease"): k = e_io(clamp((t - a - 0.15)/(b - a - 0.35)))
                z = mix(it["z0"], it["z1"], k)
                if it.get("punch"): z *= 1 + 0.14*math.exp(-(t - a)*11)
                f = render_gameplay(FR[min(j, len(FR) - 1)], MASK[it["src"]], it["mode"], z,
                                    mix(c0[0], c1[0], k), mix(c0[1], c1[1], k), box_w=it.get("box_w", 1650), cy_s=880)
            f = post(f, t)
            enc.stdin.write((np.clip(f, 0, 1)*255).astype(np.uint8).tobytes())
    enc.stdin.close(); enc.wait()

if __name__ == "__main__":
    render(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]))
