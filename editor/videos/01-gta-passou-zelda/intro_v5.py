# Intro v4: estilo das referencias (limpo), tudo com fisica de mola, camera sempre em movimento.
import sys, math, subprocess, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from lib import *
import intro_v2 as V2

FPS2 = 60
S = "/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad"
DUR = 5.03
HY = 1250
CEN = V2.Cenario(hy=HY)
rng = np.random.default_rng(5)

def medal(num, gold=True, r=95):
    SS = 4; R = r*SS; w = int(R*2.4); h = int(R*3.0)
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im); cx, cy = w/2, R*1.15
    # fitas
    c1, c2 = ((230, 40, 120), (60, 90, 230))
    d.polygon([(cx-R*0.55, cy), (cx-R*0.05, cy), (cx-R*0.15, cy+R*1.75), (cx-R*0.42, cy+R*1.5), (cx-R*0.7, cy+R*1.7)], fill=c1)
    d.polygon([(cx+R*0.05, cy), (cx+R*0.55, cy), (cx+R*0.7, cy+R*1.7), (cx+R*0.42, cy+R*1.5), (cx+R*0.15, cy+R*1.75)], fill=c2)
    # disco metalico com gradiente radial
    yy, xx = np.mgrid[0:h, 0:w]; dd = np.hypot(xx-cx, yy-cy) / R
    base = np.array([255, 205, 60]) if gold else np.array([215, 220, 235])
    dark = np.array([170, 105, 10]) if gold else np.array([120, 125, 145])
    lt = np.clip(1 - ((xx - cx + R*0.35)**2 + (yy - cy + R*0.35)**2) ** 0.5 / (R*1.6), 0, 1)
    col = dark + (base - dark) * lt[..., None]
    rim = (dd > 0.82) & (dd <= 1.0); inner = dd <= 0.82
    arr = np.asarray(im).astype(np.float32)
    disk = (dd <= 1.0)
    arr[disk, :3] = col[disk]; arr[disk, 3] = 255
    arr[rim, :3] = (dark + (base - dark)*0.55)
    im = Image.fromarray(arr.astype(np.uint8)); d = ImageDraw.Draw(im)
    f = ImageFont.truetype(F_BLACK, int(R*1.05)); bb = d.textbbox((0, 0), str(num), font=f)
    tc = (120, 70, 0) if gold else (80, 85, 105)
    d.text((cx - (bb[2]+bb[0])/2, cy - (bb[3]+bb[1])/2 + R*0.02), str(num), font=f, fill=tc)
    # brilho especular
    hl = Image.new("RGBA", im.size, (0, 0, 0, 0)); hd = ImageDraw.Draw(hl)
    hd.ellipse([cx-R*0.7, cy-R*0.8, cx+R*0.1, cy-R*0.3], fill=(255, 255, 255, 90)); hl = hl.filter(ImageFilter.GaussianBlur(R*0.08))
    im.alpha_composite(hl)
    im = im.resize((w//SS, h//SS), Image.LANCZOS)
    sh = Image.new("RGBA", (im.width+60, im.height+60), (0, 0, 0, 0)); sh.paste((0, 0, 0, 140), (30, 42), im.split()[3])
    sh = sh.filter(ImageFilter.GaussianBlur(10)); sh.alpha_composite(im, (30, 30))
    return to_sprite(sh)

GL = load_sprite(f"{KIT}/assets/logos/gta6-logo.png", 700)
ZL = load_sprite(f"{S}/v1/assets/zelda_logo.png", 440)
B99 = badge(99, 190)
M1 = medal(1, True, 78); M2 = medal(2, False, 58)
GLOWB = glow_dot(460, (255, 120, 230)); RAYS = V2.RAYS
GH = 700*770/1012; ZH = 560*ZL.shape[0]/ZL.shape[1]
G_REST = 700          # GTA no alto, sobre o sol
Z_REST = 1220                  # Zelda embaixo, sobre o chao

# ---------- fisica ----------
DT = 1/1200.0; N = int((DUR + 0.2)/DT) + 1
def spring(targets, k=120.0, c=18.0, impulses=()):
    out = np.zeros(N); x = targets[0][1]; v = 0.0; ti = 0; tgt = x; imp = sorted(impulses); ii = 0
    for i in range(N):
        t = i*DT
        while ti + 1 < len(targets) and t >= targets[ti+1][0]: ti += 1; tgt = targets[ti][1]
        while ii < len(imp) and t >= imp[ii][0]: v += imp[ii][1]; ii += 1
        a = k*(tgt - x) - c*v; v += a*DT; x += v*DT; out[i] = x
    return out
def at(a, t): return a[min(max(int(round(t/DT)), 0), N-1)]

T_GTA, T_REC, T_TRONO, T_ZEL = 0.18, 1.20, 2.40, 4.22
SUN_Y = HY - 250
g_s = spring([(0, 0.18), (T_GTA, 1.0)], k=95, c=11)
g_y = spring([(0, SUN_Y), (T_GTA, G_REST)], k=80, c=13)
g_r = spring([(0, -10.0), (T_GTA, 0.0)], k=70, c=9)
b_s = spring([(0, 0.0), (T_REC, 1.0)], k=240, c=14); b_r = spring([(0, -30.0), (T_REC, 6.0)], k=160, c=11)
m1_s = spring([(0, 0.0), (T_TRONO, 1.0)], k=230, c=13); m1_r = spring([(0, -40.0), (T_TRONO, -8.0)], k=150, c=10)
z_s = spring([(0, 0.05), (T_ZEL, 1.0)], k=110, c=13); z_y = spring([(0, HY), (T_ZEL, Z_REST)], k=90, c=14)
m2_s = spring([(0, 0.0), (T_ZEL + 0.22, 1.0)], k=230, c=13)
# camera: dolly + leve descida no fim pra enquadrar os dois; tremores como impulsos de mola
cam_t = spring([(0, 0.0), (T_ZEL - 0.1, -60.0)], k=25, c=10)
sx = spring([(0, 0)], k=800, c=20, impulses=[(T_GTA + 0.25, 220), (T_TRONO + 0.05, -160), (T_ZEL + 0.15, 120)])
sy = spring([(0, 0)], k=800, c=20, impulses=[(T_GTA + 0.22, -320), (T_TRONO + 0.05, 240), (T_ZEL + 0.15, -150)])
pn = spring([(0, 0)], k=280, c=18, impulses=[(T_GTA + 0.22, 1.0), (T_REC + 0.03, 0.35), (T_TRONO + 0.03, 0.6), (T_ZEL + 0.12, 0.4)])

SPARK = [(rng.uniform(60, 1020), rng.uniform(150, 1800), rng.uniform(0.4, 1.2), rng.uniform(0, 6)) for _ in range(55)]

def cena(t):
    dolly = 1 + 0.20*t/DUR
    f = CEN.frame(t, dolly)
    ec = (1 + 0.26*t/DUR) * (1 + 0.04*at(pn, t))
    oy = at(cam_t, t)
    def P(x, y): return W/2 + (x - W/2)*ec + at(sx, t), 960 + (y - 960)*ec + oy + at(sy, t)
    for (x0, y0, sp, ph) in SPARK:
        yv = (y0 - t*110*sp) % 1800 + 80; xv = x0 + 22*math.sin(t*1.3 + ph)
        px, py = P(xv, yv); b = 0.5 + 0.5*math.sin(t*3.5 + ph)
        cv2.circle(f, (int(px), int(py)), 2 + int(sp*2), (0.9*b, 0.6*b, 1.0*b), -1, cv2.LINE_AA)
    # brilho e raios atras do GTA
    gs = at(g_s, t)
    x, y = P(540, at(g_y, t)); blit(f, GLOWB, x, y, ec*1.25*gs, 0, clamp((t - T_GTA)/0.3)*0.6)
    if t >= T_TRONO:
        a = clamp((t - T_TRONO)/0.4); blit(f, RAYS, x, y, ec*(0.75 + 0.25*a), t*10, a*0.9)
    # GTA nasce do sol
    if t >= T_GTA - 0.02:
        blit(f, GL, x, y, ec*gs, at(g_r, t), clamp((t - T_GTA)/0.14))
    # selo 99 encaixado no canto inferior direito da logo
    k = at(b_s, t)
    if k > 0.01:
        bx, by = P(540 + 265, at(g_y, t) + GH/2 - 65); blit(f, B99, bx, by, ec*k, at(b_r, t), clamp(k*3))
    # medalha de ouro "1"
    k = at(m1_s, t)
    if k > 0.01:
        mx, my = P(540 - 235, at(g_y, t) - GH/2 + 90); blit(f, M1, mx, my, ec*k, at(m1_r, t), clamp(k*3))
    # Zelda sobe do horizonte (recortado na linha do horizonte enquanto atravessa)
    zs = at(z_s, t)
    if t >= T_ZEL - 0.02:
        g2 = f.copy(); zx, zy = P(540, at(z_y, t)); blit(g2, ZL, zx, zy, ec*zs, 0, clamp((t - T_ZEL)/0.12))
        k2 = at(m2_s, t)
        if k2 > 0.01:
            mx, my = P(540 - 195, at(z_y, t) - ZH/2 + 55); blit(g2, M2, mx, my, ec*k2, -8, clamp(k2*3))
        f = g2
    fl = 0.28*math.exp(-max(0, t - (T_GTA + 0.22))*13)*(t >= T_GTA + 0.22) + 0.15*math.exp(-max(0, t - T_TRONO)*13)*(t >= T_TRONO)
    f = f + fl
    br = np.clip(f - 0.75, 0, None); f = f + cv2.GaussianBlur(br, (0, 0), 18)*0.8
    ang = 1.1*math.sin(t*0.7 + 0.4)
    f = cv2.warpAffine(f, cv2.getRotationMatrix2D((W/2, H/2), ang, 1.035), (W, H), borderMode=cv2.BORDER_REFLECT)
    return np.clip(f, 0, 1)

def render(out, sub=4, shutter=0.55):
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
                            "-r", str(FPS2), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "15",
                            "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    for i in range(int(round(DUR*FPS2))):
        t = i/FPS2; acc = np.zeros((H, W, 3), np.float32)
        for k in range(sub): acc += cena(t + k*shutter/FPS2/sub)
        enc.stdin.write((np.clip(acc/sub, 0, 1)*255).astype(np.uint8).tobytes())
    enc.stdin.close(); enc.wait()

if __name__ == "__main__":
    render(sys.argv[1])
