# Video 1: "O GTA PASSOU O ZELDA" - montagem completa (video sem audio; audio e mixado depois)
import sys, math, subprocess, numpy as np, cv2
from lib import *

S = "/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad"
GTA = f"{S}/full/gta6_full.mp4"
BUG = f"{S}/v1/in/bugs.mp4"
ZEL = f"{S}/v1/in/zelda.mp4"
M_GTA = (0, 64, 1920, 885)        # tira tarjas, legenda do jogo e marca MKIceAndFire
M_ZEL = (0, 0, 854, 480)
M_BUG = (175, 0, 1280, 720)        # tira a webcam do streamer (canto superior esquerdo)
M_BUG_PONTE = (0, 70, 960, 720)    # trecho da ponte: webcam na direita e chat no topo
TOTAL = 56.6

# ---------- assets ----------
sw = Synthwave()
ZL = load_sprite(f"{S}/v1/assets/zelda_logo.png", 520)
GL = load_sprite(f"{KIT}/assets/logos/gta6-logo.png", 440)
CR = crown(250)
POD = podium(520, 300, "1")
PODQ = podium(400, 260, "?")
GLOW = glow_dot(230)
B99S = badge(99, 170)
def _meta():
    from PIL import Image, ImageDraw, ImageFilter
    im = Image.open("/root/.claude/uploads/160acac5-b307-5059-8cfe-e8b2ecad7162/6c19ba3a-image.png").convert("RGBA")
    m = Image.new("L", im.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, im.width-1, im.height-1], 40, fill=255)
    im.putalpha(m)
    sh = Image.new("RGBA", (im.width+120, im.height+120), (0, 0, 0, 0))
    sh.paste(Image.new("RGBA", im.size, (0, 0, 0, 170)), (60, 75), m); sh = sh.filter(ImageFilter.GaussianBlur(25))
    sh.alpha_composite(im, (60, 60)); return to_sprite(sh)
META = _meta()
BRED = {n: badge(n, 170, (235, 40, 60)) for n in (99, 97, 94, 91)}
CARD = review_card(66, 82)
CARDS = review_card(50, 62)
RED = review_card(170, 210, (235, 40, 60), 60)
TXT = {}
def T(s, size, font=F_BLACK, glow=(255, 60, 200), fill=(255, 255, 255)):
    k = (s, size, font, glow, fill)
    if k not in TXT: TXT[k] = text_sprite(s, font, size, fill=fill, glow=glow)
    return TXT[k]

# ---------- cenas animadas ----------
def cena_intro(t):
    f = sw.frame(t)
    # GTA cai do ceu no podio (0.2 -> 0.8)
    blit(f, POD, 540, 1470)
    bob = 6*math.sin(t*3)
    if t < 0.8:
        zx, zy, zr, zs, za = 540, 1150 + bob, 0, 1.0, 1.0
    else:
        u = seg(t, 0.8, 1.6)
        zx, zy, zr, zs, za = mix(540, 240, u), mix(1150, 1660, u), mix(0, -24, u), mix(1.0, 0.55, u), mix(1, 0.75, u)
    blit(f, ZL, zx, zy, zs * 0.85, zr, za)
    if t >= 0.2:
        u = seg(t, 0.2, 0.8, e_in)
        gy = mix(-450, 1110, u) + (bob if t > 1.2 else 0)
        blit(f, GL, 540, gy, mix(1.4, 1.2, u))
    # coroa
    if t < 0.8: cx, cy, cr = 540, 880 + bob, -4
    elif t < 2.1:
        u = seg(t, 0.8, 1.3); cx, cy, cr = 540, mix(880, 560, u) + 10*math.sin(t*4), mix(-4, 360, u) % 360 if u < 1 else 8*math.sin(t*4)
    else:
        u = seg(t, 2.1, 2.65, e_io); cx, cy, cr = 540, mix(560, 850, u) + (bob if u >= 1 else 0), mix(8*math.sin(2.1*4), 0, u)
    if t >= 2.6:
        blit(f, GLOW, cx, cy, 1.2 + 0.1*math.sin(t*5), 0, seg(t, 2.6, 3.0))
    pulse = 1 + 0.12*math.exp(-(t - 2.65)*10) if t >= 2.65 else 1
    blit(f, CR, cx, cy, pulse, cr)
    sh = 22*math.exp(-(t - 0.8)*9) if t >= 0.8 else 0
    f = shake(f, sh, t)
    s = 1 + 0.05 * t / 5.0  # zoom lento constante
    return cv2.warpAffine(f, cv2.getRotationMatrix2D((W/2, H*0.55), 0, s), (W, H), borderMode=cv2.BORDER_REFLECT)

def cena_criticos(t):  # t global 19.23 -> 29.45
    f = sw.frame(t)
    dimz = mix(1.0, 0.55, seg(t, 22.76, 23.2))
    # Zelda
    u = seg(t, 19.28, 19.75)
    blit(f, ZL, 280, mix(300, 470, u), 0.42, 0, u * dimz)
    n = int(round(22 * seg(t, 20.7, 21.35, lin)))
    if t >= 20.6: blit(f, T(str(n), 150), 280, 720, 1, 0, dimz)
    if t >= 21.5: blit(f, T("CRÍTICOS", 42, F_BLACK, None), 280, 830, 1, 0, seg(t, 21.5, 21.8) * dimz)
    for i in range(22):
        ti = 20.7 + i * 0.03
        if t < ti: break
        c, r = i % 4, i // 4
        k = e_back(seg(t, ti, ti + 0.18, lin))
        blit(f, CARD, 280 - 117 + c*78, 950 + r*94, k, 0, dimz)
    # GTA
    if t >= 22.76:
        u = seg(t, 22.76, 23.15)
        blit(f, T("GTA 6", 96, glow=(255, 160, 40)), mix(1300, 800, u), 470, 1, 0, u)
    if t >= 24.35:
        v = seg(t, 24.35, 25.05, lin); n = int(round(100 * v))
        blit(f, T(f"{n}+" if v >= 1 else str(n), 150, glow=(255, 160, 40)), 800, 720)
    if t >= 25.08: blit(f, T("ANÁLISES", 42, F_BLACK, None), 800, 830, 1, 0, seg(t, 25.08, 25.4))
    for i in range(120):
        ti = 24.35 + i * 0.019
        if t < ti: break
        c, r = i % 8, i // 8
        k = e_back(seg(t, ti, ti + 0.15, lin))
        blit(f, CARDS, 800 - 213 + c*61, 930 + r*72, k)
    # media 99 e nota baixa caindo
    if t >= 27.1:
        u = e_back(seg(t, 27.1, 27.35, lin))
        if t < 28.14: blit(f, B99S, 800, 1290, u)
        else:
            k = min(3, int((t - 28.14) / 0.12)); num = (99, 97, 94, 91)[k]
            blit(f, BRED[num], 800 + 10*math.sin(t*60)*math.exp(-(t-28.14)*4), 1290, 1)
    if 27.55 <= t:
        u = seg(t, 27.55, 28.12, e_in)
        y = mix(-200, 1180, u); a = 1 if t < 28.14 else max(0, 1 - (t - 28.14) / 0.25)
        blit(f, RED, 800, y, 1, mix(-25, 8, u), a)
    sh = 20*math.exp(-(t - 28.14)*8) if t >= 28.14 else 0
    f = shake(f, sh, t)
    s = 1 + 0.04 * (t - 19.23) / 10
    return cv2.warpAffine(f, cv2.getRotationMatrix2D((W/2, H/2), 0, s), (W, H), borderMode=cv2.BORDER_REFLECT)

PAINEL = None
def cena_update(t):  # 32.15 -> 35.01
    global PAINEL
    if PAINEL is None:
        from PIL import Image, ImageDraw, ImageFont
        im = rounded(820, 230, 34, (25, 8, 40, 225), (255, 90, 220, 255), 5)
        d = ImageDraw.Draw(im); fnt = ImageFont.truetype(F_BLACK, 44)
        d.text((60, 42), "ATUALIZAÇÃO", font=fnt, fill=(255, 255, 255, 255))
        PAINEL = to_sprite(im)
    f = sw.frame(t)
    u = seg(t, 32.55, 32.95)
    blit(f, ZL, 540, mix(400, 640, u), mix(0.5, 0.75, u), 0, u)
    if t >= 33.15:
        v = seg(t, 33.15, 33.5)
        py = mix(1350, 1220, v)
        failed = t >= 34.44
        dx = 12*math.sin(t*70)*math.exp(-(t-34.44)*6) if failed else 0
        blit(f, PAINEL, 540 + dx, py, 1, 0, v)
        # barra
        x0, y0 = int(130 + dx), int(py + 20); x1 = 950 + dx
        cv2.rectangle(f, (x0, y0), (int(x1), y0 + 40), (0.25, 0.1, 0.2), -1, cv2.LINE_AA)
        prog = 0.38 * seg(t, 33.5, 34.35, lin)
        col = (0.25, 0.2, 0.95) if failed else (0.9, 0.35, 1.0)
        cv2.rectangle(f, (x0, y0), (int(x0 + (x1 - x0)*prog), y0 + 40), col, -1, cv2.LINE_AA)
        if failed:
            k = seg(t, 34.44, 34.6, lin)
            s = mix(1.8, 1.0, e_out(k))
            X = T("X", 330, glow=(40, 40, 255), fill=(255, 50, 60))
            blit(f, X, 540, 1210, s, 0, k)
    s = 1 + 0.04 * (t - 32.15) / 3
    return cv2.warpAffine(f, cv2.getRotationMatrix2D((W/2, H/2), 0, s), (W, H), borderMode=cv2.BORDER_REFLECT)

def cena_trono(t):  # 51.53 -> 54.27
    f = sw.frame(t)
    blit(f, PODQ, 290, 1500); blit(f, PODQ, 790, 1500)
    bob = 6*math.sin(t*3)
    blit(f, ZL, 290, 1190 + bob, 0.68)
    blit(f, GL, 790, 1180 - bob, 0.92)
    sw_ = math.sin((t - 51.53) * 2*math.pi*0.75)
    cx = 540 + 230*sw_
    blit(f, GLOW, cx, 760, 1.0, 0, 0.8)
    blit(f, CR, cx, 760 + 25*abs(sw_), 1.0, -14*sw_)
    blit(f, T("?", 220, glow=(255, 60, 200)), 540, 420, 1 + 0.05*math.sin(t*6))
    s = 1 + 0.05 * (t - 51.53) / 2.7
    return cv2.warpAffine(f, cv2.getRotationMatrix2D((W/2, H/2), 0, s), (W, H), borderMode=cv2.BORDER_REFLECT)

# ---------- linha do tempo ----------
# gameplay: (inicio_global, fim_global, fonte, inicio_fonte, mascara, modo, zoom0, zoom1, centro0, centro1)
G = lambda *a: ("gp",) + a
A = lambda a, b, fn: ("anim", a, b, fn)
TL = [
    A(0.00, 5.03, lambda t: cena_intro(t)),
    G(5.03, 6.43, GTA, 840.3, M_GTA, "full", 1.00, 1.08, (960, 480), (960, 470)),
    G(6.43, 7.53, GTA, 851.4, M_GTA, "full", 1.02, 1.10, (1130, 480), (1170, 470)),
    G(7.53, 9.60, GTA, 300.6, M_GTA, "box", 1.00, 1.08, None, None),
    G(9.60, 12.08, GTA, 310.0, M_GTA, "box", 1.00, 1.07, None, None),
    G(12.08, 13.10, ZEL, 70.2, M_ZEL, "box", 1.00, 1.08, None, None),
    G(13.10, 14.17, ZEL, 48.8, M_ZEL, "box", 1.04, 1.12, None, None),
    G(14.17, 16.93, ZEL, 652.0, M_ZEL, "box", 1.00, 1.08, None, None),
    G(16.93, 19.23, GTA, 1080.5, M_GTA, "full", 1.00, 1.09, (960, 520), (960, 500)),
    A(19.23, 29.45, lambda t: cena_criticos(t)),
    G(29.45, 30.85, GTA, 2549.0, M_GTA, "full", 1.05, 1.15, (1010, 480), (1000, 470)),
    G(30.85, 32.15, GTA, 2520.5, M_GTA, "full", 1.00, 1.10, (820, 470), (800, 460)),
    A(32.15, 35.01, lambda t: cena_update(t)),
    G(35.01, 36.30, ZEL, 664.5, M_ZEL, "box", 1.00, 1.07, None, None),
    G(36.30, 37.95, ZEL, 675.5, M_ZEL, "box", 1.07, 1.00, None, None),
    G(37.95, 40.09, BUG, 1.0, M_BUG, "box", 1.00, 1.10, None, None),
    G(40.09, 41.53, BUG, 11.0, M_BUG_PONTE, "box", 1.05, 1.15, (520, 420), (520, 420)),
    G(41.53, 42.35, BUG, 45.4, M_BUG, "box", 1.05, 1.12, None, None),
    G(42.35, 44.05, BUG, 63.3, M_BUG, "box", 1.00, 1.10, None, None),
    G(44.05, 45.60, GTA, 6779.0, M_GTA, "full", 1.00, 1.08, (1080, 440), (1080, 430)),
    G(45.60, 47.29, GTA, 9179.75, M_GTA, "full", 1.05, 1.55, (1000, 480), (1040, 470), "ease"),
    G(47.29, 49.45, GTA, 5020.0, M_GTA, "box", 1.00, 1.08, None, None),
    G(49.45, 51.53, GTA, 5080.0, M_GTA, "box", 1.00, 1.08, None, None),
    A(51.53, 54.27, lambda t: cena_trono(t)),
    G(54.27, TOTAL, GTA, 1110.0, M_GTA, "box", 1.12, 1.00, None, None),
]
FLASH = [28.14]
ZOOM_TR = [29.45]
WHIP_TR = [51.53]

# overlays sobre gameplay
def overlay(f, t):
    if 9.60 <= t < 12.08:
        f *= 1 - 0.45 * seg(t, 9.6, 9.85)
        # (t, escala, ponto do print no centro da tela)
        kf = [(9.60, 0.82, 610, 600), (10.05, 0.82, 610, 600), (10.45, 1.25, 560, 330), (11.62, 1.32, 560, 330),
              (12.00, 1.25, 560, 900), (12.08, 1.25, 560, 900)]
        sc, px, py = kf[0][1:]
        for (ta, sa, xa, ya), (tb, sb, xb, yb) in zip(kf, kf[1:]):
            if ta <= t <= tb:
                ease = lin if (ta, tb) == (10.45, 11.62) else e_io
                u = seg(t, ta, tb, ease); sc, px, py = mix(sa, sb, u), mix(xa, xb, u), mix(ya, yb, u)
        ent = seg(t, 9.60, 9.88)
        cxs = 540 + (META.shape[1]/2 - px) * sc
        cys = 960 + (META.shape[0]/2 - py) * sc + (1 - ent) * 400
        blit(f, META, cxs, cys, sc, 0, ent)
    if 15.3 <= t < 16.93:
        u = seg(t, 15.35, 15.7)
        blit(f, T("1998", 120, glow=(255, 60, 200)), 540, mix(520, 470, u), 1, 0, u)
    return f

# ---------- render ----------
def render(out_path, t_from=0.0, t_to=TOTAL):
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "15",
                            "-pix_fmt", "yuv420p", out_path], stdin=subprocess.PIPE)
    for item in TL:
        a, b = item[1], item[2]
        if b <= t_from or a >= t_to: continue
        f0 = int(round(a*FPS)); f1 = int(round(b*FPS))
        frames = None
        if item[0] == "gp":
            _, a, b, src, s0, mask, mode, z0, z1, c0, c1, *rest = item
            ease = e_io if rest and rest[0] == "ease" else lin
            sw_, sh_ = probe_size(src)
            frames = read_frames(src, s0, (f1 - f0)/FPS, sw_, sh_)
            mx_, my_ = (mask[0]+mask[2])/2, (mask[1]+mask[3])/2
            c0 = c0 or (mx_, my_); c1 = c1 or c0
        for fi in range(f0, f1):
            t = fi / FPS
            if t < t_from or t >= t_to: continue
            if item[0] == "anim":
                f = item[3](t)
            else:
                k = (fi - f0) / max(f1 - f0 - 1, 1)
                if rest and rest[0] == "ease":
                    k = seg(t, 45.74, 46.4, e_io)  # zoom no oculos em "olhos"
                fr = frames[min(fi - f0, len(frames) - 1)]
                f = render_gameplay(fr, mask, mode, mix(z0, z1, k), mix(c0[0], c1[0], k), mix(c0[1], c1[1], k))
                f = overlay(f, t)
            # transicoes
            for T0 in ZOOM_TR:
                if T0 - 0.18 <= t < T0: u = (t - (T0 - 0.18)) / 0.18; f = zoom_blur(f, 1 + 0.6*u*u, 0.25*u)
                if T0 <= t < T0 + 0.25: u = 1 - e_out((t - T0) / 0.25); f = zoom_blur(f, 1 + 0.5*u, 0.2*u)
            for T0 in WHIP_TR:
                if T0 - 0.15 <= t < T0: u = e_in((t - (T0 - 0.15)) / 0.15); f = whip(f, -W*0.7*u, 90*u)
                if T0 <= t < T0 + 0.2: u = 1 - e_out((t - T0) / 0.2); f = whip(f, W*0.7*u, 90*u)
            for T0 in FLASH:
                if T0 - 0.04 <= t < T0 + 0.35:
                    a_ = seg(t, T0 - 0.04, T0, lin) if t < T0 else 1 - seg(t, T0, T0 + 0.35, e_out)
                    f = f * (1 - a_) + a_
            if t > TOTAL - 0.5: f = f * max(0, (TOTAL - t) / 0.5)
            enc.stdin.write((np.clip(f, 0, 1)*255).astype(np.uint8).tobytes())
        frames = None
    enc.stdin.close(); enc.wait()

if __name__ == "__main__":
    a = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
    b = float(sys.argv[3]) if len(sys.argv) > 3 else TOTAL
    render(sys.argv[1], a, b)
