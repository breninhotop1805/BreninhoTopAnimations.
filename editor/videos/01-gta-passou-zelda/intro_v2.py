# Intro v2: camera sempre em movimento, logos grandes, motion blur real, 60 fps
import sys, math, subprocess, numpy as np, cv2
import lib
from lib import *

FPS2 = 60
S = "/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad"
DUR = 5.03
rng = np.random.default_rng(7)

# ---------- cenario synthwave refeito (horizonte mais alto, chao dominante) ----------
class Cenario:
    def __init__(self, hy=1130):
        self.hy = hy
        sky = np.zeros((H, W, 3), np.float32)
        top = np.array([0.16, 0.02, 0.07]); mid = np.array([0.42, 0.05, 0.30]); hor = np.array([0.75, 0.25, 1.0])
        for y in range(hy):
            u = y / hy
            sky[y] = mix(top, mid, u/0.55) if u < 0.55 else mix(mid, hor, (u-0.55)/0.45)
        for _ in range(220):
            x, y = rng.integers(0, W), rng.integers(0, int(hy*0.7)); b = rng.uniform(0.25, 1)
            cv2.circle(sky, (int(x), int(y)), 1 + int(rng.random() < .2), (b, b*0.9, b), -1, cv2.LINE_AA)
        self.sky = sky
        # sol (camada separada pra parallax)
        R = 340; cx, cy = W//2, hy - 250
        yy, xx = np.mgrid[0:H, 0:W]; d = np.hypot(xx - cx, yy - cy)
        u = np.clip((yy - (cy - R)) / (2*R), 0, 1)
        col = np.stack([mix(0.30, 0.55, u), mix(0.92, 0.28, u), np.ones_like(u)], -1)
        band = np.ones((H, W), bool)
        for k in range(8):
            y0 = cy + 20 + k*36; band &= ~((yy >= y0) & (yy < y0 + 3 + k*3))
        m = ((d <= R) & band & (yy < hy)).astype(np.float32); m = cv2.GaussianBlur(m, (0, 0), 1.2)
        glow = cv2.GaussianBlur(((d <= R) & (yy < hy)).astype(np.float32), (0, 0), 70) * 0.7
        sun = np.zeros((H, W, 4), np.float32); sun[..., :3] = col * m[..., None] + glow[..., None]*np.array([0.55, 0.3, 1.0])
        sun[..., 3] = np.clip(m + glow, 0, 1)
        self.sun = sun
        # silhueta (palmeiras e predios) em camada propria
        from PIL import Image, ImageDraw
        sil = Image.new("L", (W, H), 0); d2 = ImageDraw.Draw(sil); x = -30
        while x < W:
            bw = int(rng.integers(30, 90)); bh = int(rng.integers(30, 150))
            if abs(x + bw/2 - W/2) < 300: bh = int(bh*0.35)
            d2.rectangle([x, hy - bh, x + bw, hy], fill=255)
            for wy in range(hy - bh + 8, hy - 4, 14):
                for wx in range(x + 6, x + bw - 6, 12):
                    if rng.random() < 0.25: d2.rectangle([wx, wy, wx+3, wy+4], fill=120)
            x += bw + int(rng.integers(0, 10))
        for px, ph, lean in [(70, 470, 35), (175, 360, -18), (1000, 500, -40), (900, 350, 22)]:
            pts = [(px + lean*(i/20)**2, hy - ph*i/20) for i in range(21)]
            d2.line(pts, fill=255, width=14); tx, ty = pts[-1]
            for dx, up, L in [(-1, .55, 200), (-1, .15, 220), (-1, -.2, 180), (1, .55, 200), (1, .15, 225), (1, -.2, 185), (-.35, .9, 125), (.35, .9, 130)]:
                fp = [(tx + dx*L*s, ty - up*L*.6*s + L*.75*s*s) for s in np.linspace(0, 1, 13)]
                for i in range(12): d2.line([fp[i], fp[i+1]], fill=255, width=max(3, int(15 - i)))
        a = np.asarray(sil).astype(np.float32) / 255
        silc = np.zeros((H, W, 4), np.float32)
        win = (a > 0.4) & (a < 0.6)
        silc[..., :3] = np.array([0.20, 0.02, 0.14]); silc[win, :3] = np.array([0.6, 0.5, 1.0])
        silc[..., 3] = np.clip(a * 2, 0, 1); silc[..., :3] *= silc[..., 3:4]
        self.sil = silc

    def frame(self, t, cam):
        hy = self.hy
        # parallax: ceu quase parado, sol e silhueta acompanham um pouco a camera
        f = self.sky.copy()
        for layer, k in ((self.sun, 0.35), (self.sil, 0.55)):
            s = 1 + (cam - 1) * k
            M = cv2.getRotationMatrix2D((W/2, hy), 0, s)
            L = cv2.warpAffine(layer, M, (W, H))
            f = f * (1 - L[..., 3:4]) + L[..., :3]
        # chao com grade andando rapido
        g = np.zeros((H - hy, W), np.float32)
        for i in range(-22, 23):
            cv2.line(g, (int(W/2 + i*9*cam), 0), (int(W/2 + i*200*cam), H - hy), 1.0, 2, cv2.LINE_AA)
        ph = (t * 2.2) % 1.0
        for k in range(40):
            z = k + 1 - ph
            if z <= 0.08: continue
            y = int(30 * 26 / z * (0.85 + 0.15*cam))
            if y >= H - hy: continue
            cv2.line(g, (0, y), (W, y), 1.0, 2, cv2.LINE_AA)
        fade = np.clip(np.linspace(0, 1.6, H - hy), 0, 1)[:, None] ** 0.7
        g *= fade
        glow = cv2.GaussianBlur(g, (0, 0), 6) * 2.0 + g * 1.2
        floor = np.zeros((H - hy, W, 3), np.float32)
        yy = np.linspace(0, 1, H - hy)[:, None, None]
        floor[:] = mix(np.array([0.32, 0.02, 0.22]), np.array([0.10, 0.0, 0.05]), yy ** 0.5)
        floor += glow[..., None] * np.array([1.0, 0.3, 1.0])
        # mancha de luz no centro do chao
        xx = np.linspace(-1, 1, W)[None, :]; spot = np.exp(-(xx/0.35)**2 - ((yy[..., 0] - 0.35)/0.18)**2)
        floor += spot[..., None] * np.array([0.5, 0.15, 0.6]) * 0.5
        f[hy:] = floor
        # neblina no horizonte
        band = np.exp(-((np.arange(H) - hy)/40.0)**2)[:, None, None] * np.array([0.7, 0.3, 1.0]) * 0.35
        f += band
        return f

CEN = Cenario()
GL = load_sprite(f"{KIT}/assets/logos/gta6-logo.png", 820)
ZL = load_sprite(f"{S}/v1/assets/zelda_logo.png", 860)
CR = crown(340)
B99 = badge(99, 210)
GLOW = glow_dot(320)
GLOWB = glow_dot(420, (255, 120, 230))

def rays_sprite(n=14, r=900):
    s = 2*r; yy, xx = np.mgrid[0:s, 0:s] - r
    ang = np.arctan2(yy, xx); d = np.hypot(xx, yy) / r
    v = (np.cos(ang * n) * 0.5 + 0.5) ** 6 * np.clip(1 - d, 0, 1) ** 1.5
    im = np.zeros((s, s, 4), np.float32); im[..., 3] = v * 0.55
    im[..., 0] = v*0.55*0.7; im[..., 1] = v*0.55*0.75; im[..., 2] = v*0.55*1.0
    return im
RAYS = rays_sprite()

# zelda "derrotado": dessaturado e escuro
ZD = ZL.copy(); g_ = ZD[..., :3].mean(-1, keepdims=True); ZD[..., :3] = (ZD[..., :3]*0.3 + g_*0.7) * 0.6

SPARK = [(rng.uniform(80, 1000), rng.uniform(300, 1500), rng.uniform(0.4, 1.2), rng.uniform(0, 6)) for _ in range(45)]

def cena(t):
    cam = 1 + 0.22 * (t / DUR)                     # dolly-in constante
    f = CEN.frame(t, cam)
    E = np.zeros_like(f)                           # camada dos elementos (pra camera propria)
    Ea = np.zeros(f.shape[:2] + (1,), np.float32)
    def put(spr, x, y, s=1.0, r=0.0, a=1.0):
        tmp = np.zeros((H, W, 3), np.float32)
        blit(f_el, spr, x, y, s, r, a)
    f_el = f  # desenhamos direto no frame; camera dos elementos aplicada nas coordenadas
    ec = 1 + 0.30 * (t / DUR)                      # elementos aproximam mais que o fundo (parallax)
    oy = -40 * (t / DUR)
    def P(x, y): y += 130; return W/2 + (x - W/2)*ec, 1030 + (y - 1030)*ec + oy
    # brilho rosa atras de tudo
    gx, gy = P(540, 860); blit(f, GLOWB, gx, gy, ec*1.2, 0, 0.6)
    # raios girando depois da coroacao
    if t >= 2.5:
        a = seg(t, 2.5, 2.9); rx, ry = P(540, 800)
        blit(f, RAYS, rx, ry, ec*(0.85 + 0.15*a), t*14, a)
    # particulas subindo
    for (x0, y0, sp, ph) in SPARK:
        y = (y0 - t*120*sp) % 1500 + 200; x = x0 + 25*math.sin(t*1.5 + ph)
        px, py = P(x, y); b = 0.5 + 0.5*math.sin(t*4 + ph)
        cv2.circle(f, (int(px), int(py)), 2 + int(sp*2), (0.9*b, 0.6*b, 1.0*b), -1, cv2.LINE_AA)
    # ZELDA no trono -> arremessado
    if t < 0.5:
        zx, zy, zs, zr = 540, 900 + 8*math.sin(t*4), 1.0, 0
        x, y = P(zx, zy); blit(f, ZL, x, y, ec*zs, zr)
    elif t < 1.3:
        u = seg(t, 0.5, 1.3, e_out)
        zx, zy = mix(540, -650, u), mix(900, 1350, u) - 260*math.sin(math.pi*u)
        x, y = P(zx, zy); blit(f, ZL, x, y, ec*mix(1.0, 0.7, u), mix(0, 75, u))
    # GTA nasce de dentro do sol
    if t >= 0.12:
        u = seg(t, 0.12, 0.55, e_out)
        s = mix(0.12, 1.08, u) if t < 0.55 else mix(1.08, 1.0, seg(t, 0.55, 0.85, e_io))
        gy_ = mix(770, 880, u) + (6*math.sin((t-0.85)*3) if t > 0.85 else 0)
        x, y = P(540, gy_); blit(f, GL, x, y, ec*s, mix(-14, 0, u), seg(t, 0.12, 0.28, lin))
    # coroa: lancada, flutua, cai no GTA
    if t < 0.5: cx_, cy_, cr_, cs_ = 540, 430 + 8*math.sin(t*4), -6, 1.0
    elif t < 1.25:
        u = seg(t, 0.5, 1.25, e_out); cx_, cy_, cr_, cs_ = mix(540, 640, u), mix(430, 190, u), mix(-6, 520, u), 1.0
    elif t < 2.1:
        cx_, cy_, cr_, cs_ = 640 + 12*math.sin(t*3), 190 + 14*math.sin(t*4), 520 + 10*math.sin(t*3), 1.0
    else:
        u = seg(t, 2.1, 2.5, e_in)
        cx_, cy_, cr_ = mix(640, 540, u), mix(190, 520, u), mix(520, 352, u)
        cs_ = 1.0 if t < 2.5 else 1 + 0.18*math.exp(-(t-2.5)*9)*math.cos((t-2.5)*25)
        if t >= 2.5: cy_ += 6*math.sin((t-2.85)*3) if t > 2.85 else 0
    x, y = P(cx_, cy_)
    if t >= 2.5: blit(f, GLOW, x, y, ec*(1.1 + 0.1*math.sin(t*5)), 0, seg(t, 2.5, 2.7))
    blit(f, CR, x, y, ec*cs_, cr_)
    # selo 99
    if t >= 3.5:
        k = e_back(seg(t, 3.5, 3.8, lin), 2.2); x, y = P(820, 1200)
        blit(f, B99, x, y, ec*k, mix(-20, 8, seg(t, 3.5, 3.8)))
    # zelda derrotado aparece no canto em "de Zelda"
    if t >= 4.35:
        u = seg(t, 4.35, 4.75, e_out); x, y = P(mix(-200, 230, u), mix(1700, 1480, u))
        blit(f, ZD, x, y, ec*0.5, mix(-40, -16, u))
    # impactos: tremor + flash
    sh = 26*math.exp(-(t-0.55)*8) if t >= 0.55 else 0
    sh += 14*math.exp(-(t-2.5)*10) if t >= 2.5 else 0
    f = shake(f, sh, t)
    fl = 0.35*math.exp(-(t-0.55)*12) if t >= 0.55 else 0
    fl += 0.25*math.exp(-(t-2.5)*12) if t >= 2.5 else 0
    f = f + fl
    # bloom
    br = np.clip(f - 0.75, 0, None)
    f = f + cv2.GaussianBlur(br, (0, 0), 18) * 0.8
    return np.clip(f, 0, 1)

def render(out, t0=0.0, t1=DUR, sub=4, shutter=0.6):
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
                            "-r", str(FPS2), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "15",
                            "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    n = int(round((t1 - t0) * FPS2))
    for i in range(n):
        t = t0 + i / FPS2
        acc = np.zeros((H, W, 3), np.float32)
        for k in range(sub):   # motion blur: media de sub-quadros dentro do obturador
            acc += cena(t + k * shutter / FPS2 / sub)
        enc.stdin.write((np.clip(acc/sub, 0, 1)*255).astype(np.uint8).tobytes())
    enc.stdin.close(); enc.wait()

if __name__ == "__main__":
    render(sys.argv[1], sub=3)
