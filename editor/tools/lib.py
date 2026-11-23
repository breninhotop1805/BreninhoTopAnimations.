# Biblioteca de edicao: fundo synthwave, sprites, camera de gameplay, transicoes.
import math, subprocess, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 30
KIT = "/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad/kit/Kit GTA 6 com Claude"
F_BLACK = f"{KIT}/estilo/fontes/ArchivoBlack-Regular.ttf"
F_MONT = f"{KIT}/estilo/fontes/Montserrat.ttf"

# ---------- easing ----------
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def lin(x): return clamp(x)
def e_out(x): x = clamp(x); return 1 - (1 - x) ** 3
def e_in(x): x = clamp(x); return x ** 3
def e_io(x): x = clamp(x); return 4*x**3 if x < .5 else 1 - (-2*x+2)**3/2
def e_back(x, s=1.7):
    x = clamp(x); x -= 1; return 1 + (s+1)*x**3 + s*x**2
def seg(t, a, b, f=e_out): return f((t - a) / max(b - a, 1e-6))
def mix(a, b, u): return a + (b - a) * u

# ---------- sprites (float32 RGBA premultiplied, 0..1) ----------
def to_sprite(img):
    a = np.asarray(img.convert("RGBA")).astype(np.float32) / 255
    a[..., :3] *= a[..., 3:4]
    return a[..., [2, 1, 0, 3]].copy()  # BGRA

def load_sprite(path, width):
    im = Image.open(path).convert("RGBA")
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    return to_sprite(im)

def blit(dst, spr, cx, cy, scale=1.0, rot=0.0, alpha=1.0):
    """Cola sprite com centro em (cx,cy), escala, rotacao (graus) e opacidade. dst BGR float32 0..1."""
    if alpha <= 0.002 or scale <= 0.001: return
    h, w = spr.shape[:2]
    M = cv2.getRotationMatrix2D((w/2, h/2), rot, scale)
    M[0, 2] += cx - w/2; M[1, 2] += cy - h/2
    pts = np.array([[0, 0, 1], [w, 0, 1], [0, h, 1], [w, h, 1]], np.float32) @ M.T
    x0, y0 = np.floor(pts.min(0)).astype(int); x1, y1 = np.ceil(pts.max(0)).astype(int)
    x0, y0 = max(x0, 0), max(y0, 0); x1, y1 = min(x1, dst.shape[1]), min(y1, dst.shape[0])
    if x1 <= x0 or y1 <= y0: return
    M2 = M.copy(); M2[0, 2] -= x0; M2[1, 2] -= y0
    r = cv2.warpAffine(spr, M2, (x1-x0, y1-y0), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    a = r[..., 3:4] * alpha
    roi = dst[y0:y1, x0:x1]
    roi *= (1 - a); roi += r[..., :3] * alpha

def text_sprite(txt, font, size, fill=(255, 255, 255), stroke=0, stroke_fill=(0, 0, 0), glow=None, glow_r=18):
    f = ImageFont.truetype(font, size)
    bb = f.getbbox(txt, stroke_width=stroke)
    pad = glow_r * 3 if glow else 10
    w, h = bb[2] - bb[0] + pad*2, bb[3] - bb[1] + pad*2
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.text((pad - bb[0], pad - bb[1]), txt, font=f, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)
    if glow:
        g = Image.new("RGBA", (w, h), (0, 0, 0, 0)); gd = ImageDraw.Draw(g)
        gd.text((pad - bb[0], pad - bb[1]), txt, font=f, fill=glow, stroke_width=stroke+4)
        g = g.filter(ImageFilter.GaussianBlur(glow_r))
        g.alpha_composite(im); im = g
    return to_sprite(im)

def rounded(w, h, r, fill, outline=None, width=0):
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle([0, 0, w-1, h-1], r, fill=fill, outline=outline, width=width)
    return im

def badge(num, size=260, color=(102, 204, 51)):
    im = rounded(size, size, size//7, color + (255,))
    f = ImageFont.truetype(F_BLACK, int(size*0.55))
    d = ImageDraw.Draw(im); bb = d.textbbox((0, 0), str(num), font=f)
    d.text(((size - bb[2] - bb[0])/2, (size - bb[3] - bb[1])/2), str(num), font=f, fill=(255, 255, 255))
    sh = Image.new("RGBA", (size+60, size+60), (0, 0, 0, 0))
    sh.paste(rounded(size, size, size//7, (0, 0, 0, 150)), (30, 40))
    sh = sh.filter(ImageFilter.GaussianBlur(14)); sh.alpha_composite(im, (30, 30))
    return to_sprite(sh)

def review_card(w, h, score_color=(102, 204, 51), score=None):
    im = rounded(w, h, max(4, w//10), (250, 250, 255, 255))
    d = ImageDraw.Draw(im); s = int(w*0.42)
    d.rounded_rectangle([w*0.1, h*0.1, w*0.1+s, h*0.1+s], max(3, s//6), fill=score_color + (255,))
    if score is not None:
        f = ImageFont.truetype(F_BLACK, int(s*0.55)); bb = d.textbbox((0, 0), str(score), font=f)
        d.text((w*0.1 + (s-bb[2]-bb[0])/2, h*0.1 + (s-bb[3]-bb[1])/2), str(score), font=f, fill=(255, 255, 255))
    for i in range(3):
        y = h*0.1 + s + h*0.1 + i*h*0.12
        d.rounded_rectangle([w*0.1, y, w*(0.9 - 0.15*i), y + h*0.06], 3, fill=(190, 190, 205, 255))
    return to_sprite(im)

def crown(w=300):
    h = int(w*0.75); S = 4
    im = Image.new("RGBA", (w*S, h*S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    pts = [(0.06, 0.92), (0.06, 0.35), (0.28, 0.6), (0.5, 0.12), (0.72, 0.6), (0.94, 0.35), (0.94, 0.92)]
    P = [(x*w*S, y*h*S) for x, y in pts]
    d.polygon(P, fill=(255, 200, 40, 255), outline=(170, 100, 0, 255), width=6*S)
    d.rectangle([0.06*w*S, 0.78*h*S, 0.94*w*S, 0.95*h*S], fill=(240, 170, 20, 255), outline=(170, 100, 0, 255), width=5*S)
    for x, y in [(0.06, 0.33), (0.5, 0.1), (0.94, 0.33)]:
        r = 0.055*w*S; d.ellipse([x*w*S-r, y*h*S-r, x*w*S+r, y*h*S+r], fill=(255, 235, 120, 255), outline=(170, 100, 0, 255), width=3*S)
    for x, c in [(0.3, (230, 30, 80)), (0.5, (40, 120, 255)), (0.7, (230, 30, 80))]:
        r = 0.05*w*S; d.ellipse([x*w*S-r, 0.865*h*S-r, x*w*S+r, 0.865*h*S+r], fill=c + (255,))
    # brilho
    hl = Image.new("RGBA", im.size, (0, 0, 0, 0)); hd = ImageDraw.Draw(hl)
    hd.polygon([(0.12*w*S, 0.75*h*S), (0.12*w*S, 0.45*h*S), (0.25*w*S, 0.62*h*S)], fill=(255, 255, 220, 120))
    im.alpha_composite(hl)
    im = im.resize((w, h), Image.LANCZOS)
    return to_sprite(im)

def podium(w=520, h=300, label="1"):
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    top = int(h*0.16)
    d.polygon([(w*0.06, top), (w*0.94, top), (w, top+18), (0, top+18)], fill=(255, 150, 235, 255))
    for y in range(top+18, h):
        u = (y - top) / (h - top)
        c = (int(mix(240, 120, u)), int(mix(60, 10, u)), int(mix(200, 120, u)), 255)
        d.line([(0, y), (w, y)], fill=c)
    d.rectangle([0, top+18, w-1, h-1], outline=(255, 120, 230, 255), width=4)
    f = ImageFont.truetype(F_BLACK, int(h*0.5)); bb = d.textbbox((0, 0), label, font=f)
    d.text(((w - bb[2] - bb[0])/2, top + 18 + (h - top - 18 - bb[3] - bb[1])/2), label, font=f, fill=(255, 255, 255, 255))
    return to_sprite(im)

def glow_dot(r=200, color=(255, 220, 120)):
    s = r*2; yy, xx = np.mgrid[0:s, 0:s]; d = np.hypot(xx - r, yy - r) / r
    a = np.clip(1 - d, 0, 1) ** 2
    im = np.zeros((s, s, 4), np.float32); im[..., 3] = a * 0.8
    for i, c in enumerate(color[::-1]): im[..., i] = c/255 * im[..., 3]
    return im

# ---------- fundo synthwave ----------
class Synthwave:
    def __init__(self, horizon=1080, seed=3):
        rng = np.random.default_rng(seed)
        self.hy = hy = horizon
        sky = np.zeros((H, W, 3), np.float32)
        top = np.array([0.13, 0.01, 0.05]); mid = np.array([0.45, 0.07, 0.36]); hor = np.array([0.62, 0.2, 1.0])  # BGR
        for y in range(hy):
            u = y / hy
            c = mix(top, mid, u/0.6) if u < 0.6 else mix(mid, hor, (u-0.6)/0.4)
            sky[y] = c
        # estrelas
        for _ in range(140):
            x, y = rng.integers(0, W), rng.integers(0, int(hy*0.6)); b = rng.uniform(0.3, 1)
            cv2.circle(sky, (int(x), int(y)), int(rng.integers(1, 3)), (b, b, b), -1, cv2.LINE_AA)
        # sol
        sun = np.zeros((H, W, 4), np.float32); cx, cy, R = W//2, hy - 230, 330
        yy, xx = np.mgrid[0:H, 0:W]; d = np.hypot(xx - cx, yy - cy)
        inside = (d <= R) & (yy < hy)
        u = np.clip((yy - (cy - R)) / (2*R), 0, 1)
        col = np.stack([mix(0.35, 0.5, u), mix(0.9, 0.25, u), mix(1.0, 1.0, u)], -1)  # amarelo -> rosa
        band = np.ones((H, W), bool)
        for k in range(7):
            y0 = cy + 30 + k*38; th = 4 + k*3
            band &= ~((yy >= y0) & (yy < y0 + th))
        m = (inside & band).astype(np.float32)
        m = cv2.GaussianBlur(m, (0, 0), 1.2)
        glow = cv2.GaussianBlur((d <= R).astype(np.float32) * (yy < hy), (0, 0), 60) * 0.55
        sky = sky * (1 - m[..., None]) + col * m[..., None]
        sky += glow[..., None] * np.array([0.5, 0.35, 1.0])
        # silhueta de cidade e palmeiras
        sil = Image.new("L", (W, H), 0); d2 = ImageDraw.Draw(sil)
        x = -20
        while x < W:
            bw = int(rng.integers(40, 110)); bh = int(rng.integers(40, 190))
            if abs(x + bw/2 - W/2) < 260: bh = int(bh*0.45)
            d2.rectangle([x, hy - bh, x + bw, hy], fill=255); x += bw + int(rng.integers(0, 12))
        for px, ph, lean in [(90, 430, 30), (200, 330, -20), (960, 460, -35), (860, 320, 25)]:
            pts = [(px + lean*(i/20)**2, hy - ph*i/20) for i in range(21)]
            d2.line(pts, fill=255, width=16)
            tx, ty = pts[-1]
            for dx, up, L in [(-1, 0.55, 190), (-1, 0.15, 210), (-1, -0.2, 170), (1, 0.55, 190), (1, 0.15, 215),
                              (1, -0.2, 175), (-0.35, 0.9, 120), (0.35, 0.9, 125)]:
                fp = []
                for i in range(13):
                    s = i / 12
                    fp.append((tx + dx*L*s, ty - up*L*0.6*s + L*0.75*s*s))
                for i in range(12):
                    d2.line([fp[i], fp[i+1]], fill=255, width=max(3, int(16 - i*1.1)))
            d2.ellipse([tx-14, ty-14, tx+14, ty+14], fill=255)
        silm = np.asarray(sil).astype(np.float32) / 255
        silc = np.array([0.22, 0.03, 0.16])
        sky = sky * (1 - silm[..., None]) + silc * silm[..., None]
        # chao
        for y in range(hy, H):
            u = (y - hy) / (H - hy)
            sky[y] = mix(np.array([0.35, 0.02, 0.22]), np.array([0.12, 0.0, 0.06]), u**0.5)
        self.base = sky.astype(np.float32)

    def frame(self, t, speed=1.2):
        f = self.base.copy(); hy = self.hy
        g = np.zeros((H - hy, W), np.float32)
        vx = W / 2
        for i in range(-14, 15):
            xb = vx + i * 190
            cv2.line(g, (int(vx + i*14), 0), (int(xb + i*190*1.2), H - hy), 1.0, 3, cv2.LINE_AA)
        ph = (t * speed) % 1.0
        for k in range(0, 26):
            z = k + 1 - ph
            if z <= 0.15: continue
            y = int(46 * 22 / z)
            if y >= H - hy: continue
            cv2.line(g, (0, y), (W, y), 1.0, 3, cv2.LINE_AA)
        fade = np.clip(np.linspace(0, 1.3, H - hy), 0, 1)[:, None] ** 0.8
        g *= fade
        glow = cv2.GaussianBlur(g, (0, 0), 7) * 1.6 + g
        col = np.array([0.95, 0.25, 1.0])
        f[hy:] += glow[..., None] * col
        np.clip(f, 0, 1, out=f)
        return f

# ---------- leitura de video ----------
def read_frames(src, start, dur, sw, sh, fps=FPS):
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-i", src, "-t", f"{dur + 0.2:.3f}", "-map", "0:v:0",
           "-vf", f"fps={fps}", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE); n = sw*sh*3; out = []
    while True:
        b = p.stdout.read(n)
        if len(b) < n: break
        out.append(np.frombuffer(b, np.uint8).reshape(sh, sw, 3))
    p.wait(); return out

def probe_size(src):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                        "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip().split(",")
    return int(r[0]), int(r[1])

# ---------- camera de gameplay ----------
def render_gameplay(fr, mask, mode, zoom, cx, cy, box_w=1296, cy_s=None):
    """fr uint8 BGR. mask=(x0,y0,x1,y1) area util. mode 'box' (fundo desfocado) ou 'full'.
    zoom multiplica a escala base do modo. (cx,cy) centro na fonte."""
    x0, y0, x1, y1 = mask; mw, mh = x1 - x0, y1 - y0
    src = fr[y0:y1, x0:x1].astype(np.float32) / 255
    # fundo: area util ampliada pra cobrir e desfocada
    small = cv2.resize(src, (mw//6 or 1, mh//6 or 1), interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small, (0, 0), 6)
    bs = max(W / mw, H / mh) * 1.08
    Mb = np.float32([[bs*6, 0, W/2 - bs*mw/2], [0, bs*6, H/2 - bs*mh/2]])
    bg = cv2.warpAffine(small, Mb, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT) * 0.5
    if cy_s is None: cy_s = H/2
    if mode == "box": s = box_w / mw * zoom
    else: s = max(H / mh, W / mw) * zoom
    lcx, lcy = cx - x0, cy - y0
    # nao deixar sair da area util no modo cheio
    if mode == "full":
        hw, hh = W/2/s, H/2/s
        lcx = clamp(lcx, hw, mw - hw) if mw > 2*hw else mw/2
        lcy = clamp(lcy, hh, mh - hh) if mh > 2*hh else mh/2
    M = np.float32([[s, 0, W/2 - s*lcx], [0, s, (cy_s if mode == "box" else H/2) - s*lcy]])
    fg = cv2.warpAffine(src, M, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_CONSTANT)
    a = cv2.warpAffine(np.ones((mh, mw), np.float32), M, (W, H), flags=cv2.INTER_LINEAR, borderValue=0)[..., None]
    sh = cv2.GaussianBlur(a[..., 0], (0, 0), 22)[..., None] * 0.55
    out = bg * (1 - sh) * (1 - a) + fg * a
    blur = cv2.GaussianBlur(out, (0, 0), 1.1)
    out = cv2.addWeighted(out, 1.45, blur, -0.45, 0)
    return np.clip(out, 0, 1)

# ---------- transicoes ----------
def zoom_blur(f, scale, strength):
    out = np.zeros_like(f); n = 6
    for i in range(n):
        s = scale * (1 + strength * i / n)
        M = cv2.getRotationMatrix2D((W/2, H/2), 0, s)
        out += cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return out / n

def whip(f, dx, blur):
    M = np.float32([[1, 0, dx], [0, 1, 0]])
    g = cv2.warpAffine(f, M, (W, H), borderMode=cv2.BORDER_REFLECT)
    k = int(blur) | 1
    if k > 1: g = cv2.blur(g, (k, 1))
    return g

def shake(f, amp, t, freq=38):
    if amp < 0.5: return f
    dx = amp * math.sin(t * freq); dy = amp * math.cos(t * freq * 1.3)
    M = np.float32([[1.02, 0, dx - W*0.01], [0, 1.02, dy - H*0.01]])
    return cv2.warpAffine(f, M, (W, H), borderMode=cv2.BORDER_REFLECT)
