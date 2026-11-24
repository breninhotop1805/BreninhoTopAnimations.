# Video 2 (v5): gameplay + animacoes de interface realista (estilo das referencias): camera deslizando, desfoque de profundidade.
import sys, math, subprocess, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
V1 = "/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad/v1"
V4 = "/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad/v4"
sys.path.insert(0, V1); sys.path.insert(0, V4)
from lib import *
import montar_v4 as B

FPS2 = 60
S = "/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad"
GTA, SHA, PRE, TRA = B.GTA, B.SHA, B.PRE, B.TRA
BSL = f"{S}/v2/in/mc_bsl.mp4"
B.MASK[BSL] = (0, 0, 1920, 960)          # corta a hotbar
TOTAL = 54.25
ROB = f"{KIT}/estilo/fontes/Roboto.ttf"
UP = "/root/.claude/uploads/160acac5-b307-5059-8cfe-e8b2ecad7162"

def rob(size, weight="Regular"):
    f = ImageFont.truetype(ROB, size)
    try: f.set_variation_by_name(weight)
    except Exception: pass
    return f

def step(t, ti, k=200, c=17):
    if t < ti: return 0.0
    w0 = math.sqrt(k); z = c/(2*w0); wd = w0*math.sqrt(max(1 - z*z, 1e-6)); u = t - ti
    return 1 - math.exp(-z*w0*u)*(math.cos(wd*u) + z*w0/wd*math.sin(wd*u))

# ---------- assets de interface (renderizados em 2x) ----------
SC = 2
def icon_gta(sz):
    im = Image.new("RGBA", (sz, sz), (0, 0, 0, 255)); a = np.zeros((sz, sz, 3), np.uint8)
    yy = np.linspace(0, 1, sz)[:, None]; a[..., 0] = (40 + 120*yy).astype(np.uint8); a[..., 1] = (10 + 30*yy).astype(np.uint8); a[..., 2] = (60 + 80*yy).astype(np.uint8)
    im = Image.fromarray(np.dstack([a, np.full((sz, sz), 255, np.uint8)]), "RGBA")
    lg = Image.open(f"{KIT}/assets/logos/gta6-logo.png").convert("RGBA"); lg.thumbnail((int(sz*0.86), int(sz*0.86)), Image.LANCZOS)
    im.alpha_composite(lg, ((sz - lg.width)//2, (sz - lg.height)//2))
    m = Image.new("L", (sz, sz), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, sz - 1, sz - 1], sz//8, fill=255); im.putalpha(m)
    return im
def icon_mc(sz, classic=False):
    im = Image.open(f"{UP}/393eb6e2-image.jpg").convert("RGBA").resize((sz, sz), Image.LANCZOS)
    if classic:
        a = np.asarray(im).astype(np.float32); g = a[..., :3].mean(-1, keepdims=True)
        a[..., :3] = a[..., :3]*0.55 + g*0.45; im = Image.fromarray(a.astype(np.uint8), "RGBA")
    m = Image.new("L", (sz, sz), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, sz - 1, sz - 1], sz//8, fill=255); im.putalpha(m)
    return im

def card(title, sub, icon, w=1500, h=230, bar=0.0, bar_col=(255, 255, 255), right=""):
    """card de download estilo console (em coordenadas de mundo; renderizado em 2x)"""
    W2, H2 = w*SC, h*SC
    im = Image.new("RGBA", (W2, H2), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W2 - 1, H2 - 1], 16*SC, fill=(22, 24, 30, 235), outline=(150, 155, 165, 255), width=3*SC)
    isz = int(h*0.74)*SC; im.alpha_composite(icon.resize((isz, isz), Image.LANCZOS), (26*SC, (H2 - isz)//2))
    x0 = 26*SC + isz + 30*SC
    d.text((x0, 38*SC), title, font=rob(50*SC, "Medium"), fill=(240, 242, 246))
    if right:
        f = rob(40*SC); bb = d.textbbox((0, 0), right, font=f); d.text((W2 - 40*SC - bb[2], 118*SC), right, font=f, fill=(205, 208, 215))
    d.text((x0, 118*SC), sub, font=rob(40*SC), fill=(170, 174, 184))
    by = H2 - 46*SC; d.rounded_rectangle([x0, by, W2 - 40*SC, by + 10*SC], 5*SC, fill=(70, 74, 84))
    if bar > 0: d.rounded_rectangle([x0, by, x0 + int((W2 - 40*SC - x0)*min(bar, 1)), by + 10*SC], 5*SC, fill=bar_col)
    return to_sprite(im)

def fmt_br(x, dec=1): return f"{x:,.{dec}f}".replace(",", "X").replace(".", ",").replace("X", ".")

# ---------- camera de interface ----------
yyH, xxW = np.mgrid[0:H, 0:W].astype(np.float32)
def backdrop(t, title, seed=0):
    f = np.zeros((H, W, 3), np.float32)
    f[:] = np.array([0.05, 0.035, 0.03])
    f += (0.07*np.exp(-((xxW - W*0.5)/(W*0.9))**2 - ((yyH - H*0.45)/(H*0.5))**2))[..., None]*np.array([1.0, 0.8, 0.9])
    return f
BIG = {}
def ghost(f, txt, x, y, s):
    if txt not in BIG:
        im = Image.new("RGBA", (1800, 360), (0, 0, 0, 0)); ImageDraw.Draw(im).text((20, 20), txt, font=rob(260, "Bold"), fill=(255, 255, 255, 40))
        BIG[txt] = to_sprite(im)
    blit(f, BIG[txt], x, y, s)

def dof(f, fx, fy, r0=180, r1=420, sigma=9):
    b = cv2.GaussianBlur(f, (0, 0), sigma)
    d = np.sqrt(((xxW - fx)*1.0)**2 + ((yyH - fy)*1.6)**2)
    m = np.clip((d - r0)/r1, 0, 1)[..., None]
    return f*(1 - m) + b*m

def grain(f, t):
    r = np.random.default_rng(int(t*60)); n = r.normal(0, 0.012, (H//2, W//2, 1)).astype(np.float32)
    return f + cv2.resize(n, (W, H))[..., None]

# ===== U1: download do GTA VI (8.06 -> 10.34) =====
GTA_ICON = icon_gta(400); MC_ICON = icon_mc(400); MCC_ICON = icon_mc(400, classic=True)
U1T = 8.06
cam1 = lambda t: (mix(-300, 290, e_io(clamp((t - U1T)/2.2))), 1.55 + 0.12*clamp((t - U1T)/2.3))
def u1(t):
    f = backdrop(t, "GTA")
    gb = 212*e_out(clamp((t - 8.10)/1.0))
    left = max(1, int(83 - 70*clamp((t - 8.1)/2.2)))
    spr = card("Grand Theft Auto VI", "Baixando...", GTA_ICON, bar=gb/212*0.995, bar_col=(235, 235, 240),
               right=f"{left}min restantes ({fmt_br(gb, 1)} GB / 212 GB)")
    cx, z = cam1(t)
    ghost(f, "Grand Theft Auto VI", 540 - cx*0.4 + 300, 560, 0.9*z)
    k = step(t, U1T, 120, 16)
    blit(f, spr, 540 - cx*z, 900 + 120*(1 - k), z/SC, 0, clamp(k*3))
    f = dof(f, 540, 900, 230, 430)
    return np.clip(grain(f, t), 0, 1)

# ===== U2: armazenamento (15.33 -> 17.57) =====
U2T = 15.33
def u2(t):
    f = backdrop(t, "MC")
    kG = step(t, U2T, 140, 17); kM = step(t, 15.80, 140, 17)
    z = 1.04 + 0.10*clamp((t - U2T)/2.2)
    cy = mix(830, 1010, e_io(clamp((t - 15.9)/0.8)))
    def P(x, y): return 540 + (x - 540)*z, 960 + (y - cy)*z
    ghost(f, "Armazenamento", *P(720, 560), 0.8*z)
    sG = card("Grand Theft Auto VI", "Jogo", GTA_ICON, w=900, bar=1.0, bar_col=(235, 235, 240), right="212 GB")
    sM = card("Minecraft", "Jogo", MC_ICON, w=900, bar=0.006, bar_col=(110, 220, 120), right="1 GB")
    x, y = P(540 + 200*(1 - kG), 840); blit(f, sG, x, y, z/SC, 0, clamp(kG*3))
    x, y = P(540 + 260*(1 - kM), 1100); blit(f, sM, x, y, z/SC, 0, clamp(kM*3))
    f = dof(f, 540, mix(900, 1090, e_io(clamp((t - 15.9)/0.8))), 260, 460)
    return np.clip(grain(f, t), 0, 1)

# ===== U3: biblioteca enchendo de Minecrafts (18.55 -> 21.31) =====
U3T = 18.55; COLS = 18
ICO = to_sprite(icon_mc(120))
GRID = [(i % COLS, i//COLS) for i in range(212)]
U3_T0, U3_T1 = 18.62, 20.75
PILL = {}
def pill(n, icon, w=470):
    key = (n, id(icon))
    if key in PILL: return PILL[key]
    W2, H2 = w*SC, 104*SC
    im = Image.new("RGBA", (W2, H2), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W2 - 1, H2 - 1], H2//2, fill=(16, 16, 22, 230), outline=(255, 70, 190, 255), width=4*SC)
    isz = 72*SC; im.alpha_composite(icon.resize((isz, isz), Image.LANCZOS), (18*SC, (H2 - isz)//2))
    txt = fmt_br(n, 0); f = rob(66*SC, "Bold"); bb = d.textbbox((0, 0), txt, font=f)
    d.text((18*SC + isz + 22*SC, (H2 - (bb[3] + bb[1]))//2), txt, font=f, fill=(255, 255, 255))
    if len(PILL) > 300: PILL.clear()
    PILL[key] = to_sprite(im); return PILL[key]
def u3(t):
    f = backdrop(t, "LIB")
    z = 1.22 - 0.22*e_io(clamp((t - U3T)/2.6))
    def P(x, y): return 540 + (x - 540)*z, 980 + (y - 980)*z
    ghost(f, "Grand Theft Auto VI", *P(760, 520), 0.8*z)
    # moldura = "espaco do GTA VI"
    x0, y0 = P(40, 690); x1, y1 = P(1040, 690 + 12*56 + 24)
    cv2.rectangle(f, (int(x0), int(y0)), (int(x1), int(y1)), (0.40, 0.38, 0.36), 2, cv2.LINE_AA)
    n = 0
    for i, (c, r) in enumerate(GRID):
        ti = U3_T0 + (U3_T1 - U3_T0)*(i/len(GRID))**1.15
        k = step(t, ti, 420, 22)
        if k <= 0.01: continue
        n += 1
        x, y = P(65 + c*55.9, 728 + r*56)
        blit(f, ICO, x, y, z*k*0.42, 0, clamp(k*3))
    nn = min(212, int(round(212*clamp((t - U3_T0)/(U3_T1 - U3_T0))**0.9)))
    kp = step(t, U3T, 200, 16)
    blit(f, pill(max(nn, 1), icon_mc(160)), 540, 470 + 80*(1 - kp), z*0.5*(1 + 0.08*math.exp(-max(0, t - U3_T1)*9)*(t > U3_T1)), 0, clamp(kp*3))
    f = dof(f, 540, 900, 380, 600, 7)
    return np.clip(grain(f, t), 0, 1)

# ===== U4: Minecraft Classic (2009) baixa na hora (34.45 -> 36.19) =====
U4T = 34.45
CHECK = None
def u4(t):
    global CHECK
    if CHECK is None:
        ck = Image.open(f"{UP}/0dcfb16a-image.png").convert("RGBA"); ck.thumbnail((150, 150), Image.LANCZOS); CHECK = to_sprite(ck)
    f = backdrop(t, "MCC")
    p = e_out(clamp((t - 34.95)/0.30)); done = t >= 35.25
    spr = card("Minecraft Classic (2009)", "Concluído" if done else "Baixando...", MCC_ICON, bar=p, bar_col=(110, 220, 120),
               right=f"{fmt_br(0.9*p, 1)} MB / 0,9 MB")
    cx = mix(-300, 250, e_io(clamp((t - U4T)/1.6))); z = 1.50 + 0.10*clamp((t - U4T)/1.7)
    ghost(f, "Minecraft", 540 - cx*0.4 + 200, 560, 0.9*z)
    k = step(t, U4T, 120, 16)
    blit(f, spr, 540 - cx*z, 900 + 120*(1 - k), z/SC, 0, clamp(k*3))
    if done:
        kc = step(t, 35.25, 380, 15); blit(f, CHECK, 540, 650, kc, mix(-25, 0, min(kc, 1)), clamp(kc*3))
    f = dof(f, 540, 900, 230, 430)
    return np.clip(grain(f, t), 0, 1)

# ===== contador sobre a gameplay (40.0 -> 44.28) =====
def counter_overlay(f, t):
    if not (40.0 <= t < 44.28): return f
    kp = step(t, 40.0, 220, 16)
    u = clamp((t - 40.05)/(41.98 - 40.05)); n = 200000 if t >= 41.98 else int(200000*u**2.4)
    s = 0.5*(1 + 0.12*math.exp(-max(0, t - 41.98)*8)*(t >= 41.98))
    out = clamp((44.28 - t)/0.12)
    blit(f, pill(max(n, 1), icon_mc(160), w=560), 540, 330 + 60*(1 - kp), s, 0, clamp(kp*3)*out)
    return f

# ---------- linha do tempo ----------
C, SP = B.C, B.SP
def A(a, b, fn): return dict(a=a, b=b, anim=fn)
TL = [
    C(0.00, 0.52, GTA, 93785.0, "full", 1.25, 1.10, punch=True),
    C(0.52, 1.30, SHA, 43.0, "full", 1.12, 1.25, punch=True),
    C(1.30, 1.90, TRA, 12.6, "full", 1.25, 1.12, punch=True),
    C(1.90, 2.54, GTA, 94078.0, "full", 1.10, 1.25, punch=True),
    C(2.54, 3.54, GTA, 90237.5, "full", 1.28, 1.10, punch=True),
    C(3.54, 4.62, SHA, 113.0, "full", 1.05, 1.25, punch=True),
    C(4.62, 5.44, GTA, 69660.8, "full", 1.25, 1.08, punch=True),
    C(5.44, 6.56, SHA, 16.5, "full", 1.05, 1.20),
    C(6.56, 7.42, GTA, 95883.0, "box", 1.00, 1.22),
    C(7.42, 8.06, GTA, 99540.0, "box", 1.22, 1.05),
    A(8.06, 10.34, u1),
    C(10.34, 11.28, GTA, 69898.5, "box", 1.28, 1.02),
    C(11.28, 12.22, GTA, 16229.0, "box", 1.00, 1.25),
    C(12.22, 13.73, GTA, 70198.5, "box", 1.25, 1.00),
    C(13.73, 14.60, TRA, 30.0, "box", 1.00, 1.22),
    C(14.60, 15.33, BSL, 32.0, "box", 1.22, 1.02),
    A(15.33, 17.57, u2),
    C(17.57, 18.55, GTA, 90240.5, "box", 1.00, 1.22),
    A(18.55, 21.31, u3),
    C(21.31, 22.03, GTA, 90779.6, "box", 1.00, 1.20),
    SP(22.03, 24.37, (SHA, 50.0), (GTA, 69661.0)),
    C(24.37, 25.57, GTA, 69663.5, "full", 1.05, 1.25),
    C(25.57, 26.71, TRA, 20.0, "box", 1.00, 1.25),
    C(26.71, 27.99, GTA, 26818.0, "box", 1.25, 1.00),
    C(27.99, 28.93, SHA, 22.0, "box", 1.00, 1.22),
    C(28.93, 30.27, BSL, 77.0, "box", 1.20, 1.02),
    C(30.27, 31.73, PRE, 143.0, "box", 1.00, 1.22, box_w=1240),
    C(31.73, 32.41, PRE, 141.5, "box", 1.20, 1.02, box_w=1240),
    C(32.41, 33.43, PRE, 13.0, "box", 1.00, 1.20, box_w=1240),
    C(33.43, 34.45, PRE, 0.0, "box", 1.00, 2.10, c0=(320, 260), c1=(190, 175), box_w=1240, ease=True),
    A(34.45, 36.19, u4),
    C(36.19, 37.85, BSL, 257.0, "box", 1.00, 1.22),
    C(37.85, 39.46, PRE, 136.0, "box", 1.22, 1.00, box_w=1240),
    C(39.46, 41.10, GTA, 99958.0, "full", 1.05, 1.22),
    C(41.10, 43.50, PRE, 110.9, "box", 1.30, 1.00, box_w=1240),
    C(43.50, 44.28, PRE, 137.5, "box", 1.00, 1.18, box_w=1240),
    C(44.28, 45.42, PRE, 139.0, "box", 1.18, 1.00, box_w=1240),
    C(45.42, 46.24, BSL, 263.0, "box", 1.00, 1.20),
    C(46.24, 47.38, TRA, 16.0, "full", 1.20, 1.05),
    C(47.38, 48.48, TRA, 36.0, "box", 1.00, 1.22),
    SP(48.48, 52.90, (GTA, 95884.0), (SHA, 6.3)),
    C(52.90, TOTAL, SHA, 105.5, "full", 1.05, 1.25),
]

def post(f, t):
    f = counter_overlay(f, t)
    g = math.exp(-max(0, t - B.GLITCH)*7) if t >= B.GLITCH - 0.06 else 0
    if t < B.GLITCH: g = clamp((t - (B.GLITCH - 0.06))/0.06)
    if g > 0.03:
        r = np.random.default_rng(int(t*60)); sh = int(32*g); f2 = f.copy()
        f2[..., 2] = np.roll(f[..., 2], sh, 1); f2[..., 0] = np.roll(f[..., 0], -sh, 1)
        for _ in range(9):
            y0 = int(r.uniform(0, H - 80)); hh = int(r.uniform(15, 100)); dx = int(r.uniform(-130, 130)*g)
            f2[y0:y0 + hh] = np.roll(f2[y0:y0 + hh], dx, 1)
        f = f2
    Z = B.ZOOM_OUT
    if Z - 0.18 <= t < Z: u = (t - (Z - 0.18))/0.18; f = zoom_blur(f, 1 + 0.6*u*u, 0.25*u)
    if Z <= t < Z + 0.25: u = 1 - e_out((t - Z)/0.25); f = zoom_blur(f, 1 + 0.5*u, 0.2*u)
    R = B.REWIND
    if R - 0.30 <= t < R + 0.22:
        u = clamp(1 - abs(t - R)/0.3 if t < R else 1 - (t - R)/0.22); g2 = f.copy()
        for y0 in range(0, H, 6): g2[y0:y0 + 2] *= 1 - 0.5*u
        g2 = np.roll(g2, int(140*u*math.sin(t*90)), 1); sh = int(60*u)
        g2[..., 2] = np.roll(g2[..., 2], sh, 1); g2[..., 0] = np.roll(g2[..., 0], -sh, 1)
        f = g2*(1 - 0.15*u) + 0.15*u*np.array([1.0, 0.85, 0.9])
    Wh = B.WHIP
    if Wh - 0.15 <= t < Wh: u = e_in((t - (Wh - 0.15))/0.15); f = whip(f, -W*0.7*u, 90*u)
    if Wh <= t < Wh + 0.2: u = 1 - e_out((t - Wh)/0.2); f = whip(f, W*0.7*u, 90*u)
    Fl = B.FLASH
    if Fl - 0.04 <= t < Fl + 0.30:
        a_ = seg(t, Fl - 0.04, Fl, lin) if t < Fl else 1 - seg(t, Fl, Fl + 0.30, e_out)
        f = f*(1 - 0.85*a_) + 0.85*a_
    # transicoes suaves de entrada/saida das animacoes de interface (fade curto pelo preto com leve zoom)
    for it in TL:
        if "anim" not in it: continue
        for T0 in (it["a"], it["b"]):
            if abs(t - T0) < 0.07: f = f*(0.55 + 0.45*abs(t - T0)/0.07)
    if t > TOTAL - 0.5: f = f*max(0, (TOTAL - t)/0.5)
    return f

def render(out, t_from, t_to, sub=2, shutter=0.5):
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
                            "-r", str(FPS2), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "15",
                            "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    for it in TL:
        a, b = it["a"], it["b"]; f0, f1 = int(round(a*FPS2)), int(round(b*FPS2))
        lo, hi = max(f0, int(round(t_from*FPS2))), min(f1, int(round(t_to*FPS2)))
        if lo >= hi: continue
        dur = (hi - lo)/FPS2; off = (lo - f0)/FPS2
        if "anim" in it: pass
        elif "split" in it:
            (sA, oA), (sB, oB) = it["split"]
            FA = read_frames(sA, oA + off, dur, *probe_size(sA), fps=FPS2); FB = read_frames(sB, oB + off, dur, *probe_size(sB), fps=FPS2)
        else:
            FR = read_frames(it["src"], it["s0"] + off, dur, *probe_size(it["src"]), fps=FPS2)
            m = B.MASK[it["src"]]; mc = ((m[0] + m[2])/2, (m[1] + m[3])/2); c0 = it.get("c0", mc); c1 = it.get("c1", c0)
        for fi in range(lo, hi):
            t = fi/FPS2; k = (fi - f0)/max(f1 - f0 - 1, 1); j = fi - lo
            if "anim" in it:
                acc = np.zeros((H, W, 3), np.float32)
                for q in range(sub): acc += it["anim"](t + q*shutter/FPS2/sub)
                f = acc/sub
            elif "split" in it:
                f = B.render_split(FA[min(j, len(FA) - 1)], FB[min(j, len(FB) - 1)], it["split"][0][0], it["split"][1][0],
                                   mix(*it["zA"], k), mix(*it["zB"], k))
            else:
                if it.get("ease"): k = e_io(clamp((t - a - 0.15)/(b - a - 0.35)))
                z = mix(it["z0"], it["z1"], k)
                if it.get("punch"): z *= 1 + 0.14*math.exp(-(t - a)*11)
                f = render_gameplay(FR[min(j, len(FR) - 1)], B.MASK[it["src"]], it["mode"], z,
                                    mix(c0[0], c1[0], k), mix(c0[1], c1[1], k), box_w=it.get("box_w", 1650), cy_s=880)
            f = post(f, t)
            enc.stdin.write((np.clip(f, 0, 1)*255).astype(np.uint8).tobytes())
    enc.stdin.close(); enc.wait()

if __name__ == "__main__":
    render(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]))
