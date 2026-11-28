# Motor do formato PNG Tuber (Foxy): parkour ao fundo, caixa de takes 16:9 no topo, Foxy animado embaixo,
# legenda em blocos de 2-3 palavras, flash pos-intro, zoom de camera (modos A e B). 60 fps.
import sys, json, math, subprocess, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 60
BOX = (23, 41, 1034, 582)                 # x, y, largura, altura da caixa de takes (16:9)
GLASS_Y = 985                             # altura dos oculos do Foxy na tela
KOM = "/home/user/BreninhoTopAnimations./editor/fontes/KOMIKAX_.ttf"

def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def mix(a, b, u): return a + (b - a)*u
def e_io(x): x = clamp(x); return 4*x**3 if x < .5 else 1 - (-2*x + 2)**3/2
def e_out(x): x = clamp(x); return 1 - (1 - x)**3
def spring(u, k=320.0, c=16.0):
    if u <= 0: return 0.0
    w0 = math.sqrt(k); z = c/(2*w0); wd = w0*math.sqrt(max(1 - z*z, 1e-6))
    return 1 - math.exp(-z*w0*u)*(math.cos(wd*u) + z*w0/wd*math.sin(wd*u))

def to_f(im):  # PIL RGBA -> float BGRA premultiplicado
    a = np.asarray(im.convert("RGBA")).astype(np.float32)/255; a[..., :3] *= a[..., 3:4]; return a[..., [2, 1, 0, 3]].copy()

def blit(dst, spr, cx, cy, sx=1.0, sy=None, rot=0.0, alpha=1.0, pivot=None):
    sy = sx if sy is None else sy
    if alpha <= 0.002: return
    h, w = spr.shape[:2]; px, py = pivot if pivot else (w/2, h/2)
    c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    M = np.float32([[sx*c, -sy*s, 0], [sx*s, sy*c, 0]])
    M[0, 2] = cx - (M[0, 0]*px + M[0, 1]*py); M[1, 2] = cy - (M[1, 0]*px + M[1, 1]*py)
    pts = np.array([[0, 0, 1], [w, 0, 1], [0, h, 1], [w, h, 1]], np.float32) @ M.T
    x0, y0 = np.floor(pts.min(0)).astype(int); x1, y1 = np.ceil(pts.max(0)).astype(int)
    x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, dst.shape[1]), min(y1, dst.shape[0])
    if x1 <= x0 or y1 <= y0: return
    M[0, 2] -= x0; M[1, 2] -= y0
    r = cv2.warpAffine(spr, M, (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    a = r[..., 3:4]*alpha; roi = dst[y0:y1, x0:x1]; roi *= (1 - a); roi += r[..., :3]*alpha

def read_frames(src, start, dur, crop=None, size=None, fps=FPS):
    vf = [f"fps={fps}"]
    if crop: vf.append("crop=%d:%d:%d:%d" % crop)
    if size: vf.append(f"scale={size[0]}:{size[1]}:flags=lanczos")
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-i", src, "-t", f"{dur + 0.2:.3f}", "-map", "0:v:0",
                          "-vf", ",".join(vf), "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE)
    w, h = size; n = w*h*3; out = []
    while True:
        b = p.stdout.read(n)
        if len(b) < n: break
        out.append(np.frombuffer(b, np.uint8).reshape(h, w, 3))
    p.wait(); return out

# ---------------- legenda (blocos de 2-3 palavras) ----------------
def cap_sprite(txt, size=74):
    f = ImageFont.truetype(KOM, size); red, blk = 9, 4; pad = 30
    bb = f.getbbox(txt, stroke_width=red + blk); w, h = bb[2] - bb[0] + pad*2, bb[3] - bb[1] + pad*2
    org = (pad - bb[0], pad - bb[1])
    sh = Image.new("RGBA", (w, h), (0, 0, 0, 0)); ImageDraw.Draw(sh).text((org[0] + 4, org[1] + 7), txt, font=f, fill=(0, 0, 0, 150), stroke_width=red + blk, stroke_fill=(0, 0, 0, 150))
    sh = sh.filter(ImageFilter.GaussianBlur(5))
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.text(org, txt, font=f, fill=(0, 0, 0, 255), stroke_width=red + blk, stroke_fill=(0, 0, 0, 255))   # contorno externo preto
    d.text(org, txt, font=f, fill=(225, 20, 30, 255), stroke_width=red, stroke_fill=(225, 20, 30, 255))  # borda vermelha
    d.text(org, txt, font=f, fill=(255, 255, 255, 255))                                                   # preenchimento
    sh.alpha_composite(im); return to_f(sh)

def group_caps(words, lead=2/60):
    def clean(w): return w.strip().upper()
    caps, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        txt = " ".join(clean(x["w"]) for x in cur)
        end_punct = w["w"].strip()[-1:] in ".,?!:;"
        nxt_gap = (words[i + 1]["s"] - w["e"]) if i + 1 < len(words) else 9
        if len(cur) >= 3 or len(txt) >= 15 or end_punct or nxt_gap > 0.25 or i == len(words) - 1:
            caps.append({"t": txt, "s": cur[0]["s"] - lead, "e": w["e"]}); cur = []
    for k, c in enumerate(caps):
        nxt = caps[k + 1]["s"] if k + 1 < len(caps) else c["e"] + 0.4
        c["fim"] = nxt if nxt - c["e"] < 0.4 else c["e"] + 0.2
    return caps

# ---------------- motor ----------------
class Video:
    def __init__(self, cfg):
        self.cfg = cfg
        self.caps = group_caps([w for w in json.load(open(cfg["palavras"])) if w["s"] is not None and w["s"] < cfg["dur"]])
        self.capspr = {}
        self.poses = {}
        anchors = {l.split("|")[0]: (float(l.split("|")[1]), float(l.split("|")[2])) for l in open(cfg["poses_dir"] + "/anchors.txt").read().splitlines()}
        for name in set(p[1] for p in cfg["poses"]):
            im = Image.open(f"{cfg['poses_dir']}/{name}.png"); self.poses[name] = (to_f(im), anchors[name])
        frame = Image.new("RGBA", (BOX[2] + 24, BOX[3] + 24), (0, 0, 0, 0)); d = ImageDraw.Draw(frame)
        d.rounded_rectangle([0, 0, BOX[2] + 23, BOX[3] + 23], 22, outline=(255, 255, 255, 255), width=10)
        sh = Image.new("RGBA", frame.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle([6, 14, BOX[2] + 17, BOX[3] + 23], 22, fill=(0, 0, 0, 120))
        sh = sh.filter(ImageFilter.GaussianBlur(10)); self.box_shadow = to_f(sh); self.box_frame = to_f(frame)
        m = Image.new("L", (BOX[2], BOX[3]), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, BOX[2] - 1, BOX[3] - 1], 16, fill=255)
        self.box_mask = (np.asarray(m).astype(np.float32)/255)[..., None]

    def pose_at(self, t):
        ps = self.cfg["poses"]; cur = ps[0]; prev = None
        for p in ps:
            if p[0] <= t: prev, cur = cur, p
        return cur, (prev if prev is not cur else None)

    def take_frame(self, t):
        for tk in self.cfg["takes"]:
            if tk["a"] <= t < tk["b"]: return tk
        return None

    def render(self, out):
        cfg = self.cfg; dur = cfg["dur"]; n = int(round(dur*FPS))
        bg = read_frames(cfg["parkour"], cfg["parkour_t"], dur, crop=(608, 1080, cfg.get("pk_x", 656), 0), size=(W, H))
        # takes pre-carregados
        for tk in cfg["takes"]:
            x0, y0, x1, y1 = tk.get("crop", (0, 0, 1920, 1080))
            tk["_fr"] = read_frames(tk["src"], tk["s0"], tk["b"] - tk["a"] + 0.4, crop=(x1 - x0, y1 - y0, x0, y0), size=(int(BOX[2]*1.12), int(BOX[3]*1.12)))
        enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS),
                                "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
        for i in range(n):
            t = i/FPS
            f = bg[min(i, len(bg) - 1)].astype(np.float32)/255
            f = self.draw_take(f, t)
            f = self.draw_foxy(f, t)
            f = self.draw_caption(f, t)
            f = self.camera(f, t)
            f = self.flash(f, t)
            if t > dur - 0.4: f = f*max(0.0, (dur - t)/0.4)
            enc.stdin.write((np.clip(f, 0, 1)*255).astype(np.uint8).tobytes())
        enc.stdin.close(); enc.wait()

    # ---- takes ----
    def take_img(self, tk, t):
        fr = tk["_fr"]; j = min(int((t - tk["a"])*FPS), len(fr) - 1); img = fr[j].astype(np.float32)/255
        u = clamp((t - tk["a"])/max(tk["b"] - tk["a"], 0.1)); z0, z1 = tk.get("z", (1.0, 1.10))
        z = mix(z0, z1, u)/1.12; h, w = img.shape[:2]
        cx, cy = mix(*tk.get("px", (w/2, w/2)), u), h/2
        M = np.float32([[z, 0, BOX[2]/2 - z*cx], [0, z, BOX[3]/2 - z*cy]])
        return cv2.warpAffine(img, M, (BOX[2], BOX[3]), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

    def draw_take(self, f, t):
        tk = self.take_frame(t)
        if tk is None: return f
        blit(f, self.box_shadow, BOX[0] + BOX[2]/2, BOX[1] + BOX[3]/2 + 6)
        img = self.take_img(tk, t); tr = tk.get("tr", "cut"); u = t - tk["a"]
        if tr == "pop" and u < 0.30:
            k = spring(u, 420, 20); s = mix(0.82, 1.0, k); bl = max(0, 6*(1 - u/0.12))
            canvas = np.zeros((BOX[3], BOX[2], 3), np.float32)
            prev = [p for p in self.cfg["takes"] if abs(p["b"] - tk["a"]) < 1e-3]
            if prev: canvas = self.take_img(prev[0], tk["a"] - 1/FPS)
            sm = cv2.resize(img, None, fx=s, fy=s)
            if bl > 0.3: sm = cv2.GaussianBlur(sm, (0, 0), bl)
            hh, ww = sm.shape[:2]; y0 = (BOX[3] - hh)//2; x0 = (BOX[2] - ww)//2
            canvas[max(y0, 0):max(y0, 0) + min(hh, BOX[3]), max(x0, 0):max(x0, 0) + min(ww, BOX[2])] = sm[max(-y0, 0):max(-y0, 0) + min(hh, BOX[3]), max(-x0, 0):max(-x0, 0) + min(ww, BOX[2])]
            img = canvas
        elif tr == "slide" and u < 0.28:
            k = e_out(u/0.28); prev = [p for p in self.cfg["takes"] if abs(p["b"] - tk["a"]) < 1e-3]
            old = self.take_img(prev[0], tk["a"] - 1/FPS) if prev else np.zeros_like(img)
            dx = int(BOX[2]*(1 - k)); canvas = np.zeros_like(img)
            canvas[:, :BOX[2] - dx] = old[:, dx:] if dx < BOX[2] else canvas[:, :0]
            canvas[:, BOX[2] - dx:] = img[:, :dx] if dx > 0 else canvas[:, BOX[2]:]
            img = np.roll(img, -0, 1); img = canvas if dx > 0 else img
            img = cv2.blur(img, (int(1 + 40*(1 - k)) | 1, 1))
        if tk.get("glitch") and abs(t - tk["glitch"]) < 0.25:
            g = 1 - abs(t - tk["glitch"])/0.25; sh = int(22*g)
            img = img.copy(); img[..., 2] = np.roll(img[..., 2], sh, 1); img[..., 0] = np.roll(img[..., 0], -sh, 1)
        x, y = BOX[0], BOX[1]; roi = f[y:y + BOX[3], x:x + BOX[2]]
        roi[:] = roi*(1 - self.box_mask) + img*self.box_mask
        blit(f, self.box_frame, BOX[0] + BOX[2]/2, BOX[1] + BOX[3]/2)
        return f

    # ---- legenda ----
    def draw_caption(self, f, t):
        for c in self.caps:
            if c["s"] <= t < c["fim"]:
                if c["t"] not in self.capspr: self.capspr[c["t"]] = cap_sprite(c["t"])
                u = t - c["s"]; p = spring(u, 700, 26); s = 0.62 + 0.38*p
                spr = self.capspr[c["t"]]
                if u < 0.09: spr = cv2.GaussianBlur(spr, (0, 0), 6*(1 - u/0.09) + 0.01)
                blit(f, spr, W/2, self.cfg.get("cap_y", 688) - 10*(1 - p), s)
        return f

    # ---- Foxy ----
    def draw_foxy(self, f, t):
        (t0, name), prev = self.pose_at(t)
        spr, (ax, ay) = self.poses[name]
        u = t - t0
        # squash & stretch na troca (estica vertical e volta elastica)
        st = 0.10*math.exp(-u*9)*math.cos(u*24) if u < 0.6 and t0 > 0 else 0.0
        sy = 1 + st; sx = 1 - st*0.55
        # idle: pendulo + flutuacao
        rot = 1.1*math.sin(t*2*math.pi*0.42); bob = 7*math.sin(t*2*math.pi*0.42*2 + 0.6)
        # modo A: soco de zoom so no Foxy
        za = 1.0
        for ta in self.cfg.get("modoA", []):
            if 0 <= t - ta < 0.5: za = 1 + 0.10*math.sin(math.pi*clamp((t - ta)/0.5))**1.2
        pivot_y = spr.shape[0]*0.98
        cx = W/2; cy = GLASS_Y - ay + pivot_y + bob
        img = spr
        if u < 0.07 and t0 > 0: img = cv2.blur(spr, (1, int(1 + 26*(1 - u/0.07)) | 1))   # motion blur curto
        blit(f, img, cx - (ax - spr.shape[1]/2)*0, cy, sx*za, sy*za, rot, 1.0, pivot=(ax, pivot_y))
        return f

    # ---- camera (modo B) ----
    def camera(self, f, t):
        z = 1.0
        for (a, b, z0, z1) in self.cfg.get("modoB", []):
            if a <= t < b: z = mix(z0, z1, e_io((t - a)/(b - a)))
        if abs(z - 1) < 1e-3: return f
        M = cv2.getRotationMatrix2D((W/2, 1250), 0, z)
        return cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

    def flash(self, f, t):
        T0 = self.cfg["flash"]
        if T0 - 0.05 <= t < T0 + 0.40:
            a = clamp((t - (T0 - 0.05))/0.05) if t < T0 else 1 - e_out((t - T0)/0.40)
            f = f*(1 - a) + a
        return f

if __name__ == "__main__":
    cfg = json.load(open(sys.argv[1])); Video(cfg).render(sys.argv[2])
