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
def cap_sprite(txt, size=64):
    f = ImageFont.truetype(KOM, size); red, blk = 8, 4; pad = 30
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
        self.shadows = {}
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

    def render(self, out, t_from=0.0, t_to=None):
        cfg = self.cfg; dur = cfg["dur"]; t_to = t_to if t_to is not None else dur
        f0, f1 = int(round(t_from*FPS)), int(round(t_to*FPS))
        enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS),
                                "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
        seg_i, seg_fr = -1, []
        for i in range(f0, f1):
            t = i/FPS
            # fundo: carrega o segmento de parkour atual (so o trecho dentro desta parte)
            si = max(k for k, sg in enumerate(cfg["parkour_segs"]) if sg[0] <= t + 1e-6)
            if si != seg_i:
                a_, b_, t0 = cfg["parkour_segs"][si]; lo = max(a_, t_from); hi = min(b_, t_to)
                seg_fr = read_frames(cfg["parkour"], t0 + (lo - a_), hi - lo, crop=tuple(cfg["pk_crop"]), size=(W, H)); seg_i = si; seg_lo = lo
            j = min(int(round((t - seg_lo)*FPS)), len(seg_fr) - 1)
            f = seg_fr[j].astype(np.float32)/255
            # takes: carrega sob demanda e libera os que ja passaram
            for tk in cfg["takes"]:
                if tk["a"] - 0.5 <= t < tk["b"] + 0.5 and "_fr" not in tk:
                    x0, y0, x1, y1 = tk.get("crop", (0, 0, 1920, 1080))
                    tk["_fr"] = read_frames(tk["src"], tk["s0"], tk["b"] - tk["a"] + 0.4, crop=(x1 - x0, y1 - y0, x0, y0), size=(int(BOX[2]*1.12), int(BOX[3]*1.12)))
                elif t >= tk["b"] + 0.5 and "_fr" in tk:
                    del tk["_fr"]
            f = self.draw_take(f, t)
            f = self.draw_foxy(f, t)
            f = self.draw_caption(f, t)
            f = self.camera(f, t)
            f = self.screen_whip(f, t)
            f = self.flash(f, t)
            if t < 0.30:
                sh = 18*(1 - t/0.30); dx = sh*math.sin(t*95); dy = sh*math.cos(t*83)
                f = cv2.warpAffine(f, np.float32([[1.03, 0, dx - W*0.015], [0, 1.03, dy - H*0.015]]), (W, H), borderMode=cv2.BORDER_REFLECT)
                a_ = 1 - t/0.30; f = f*(1 - a_) + a_
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

    def box_sprite(self, tk, t):
        img = self.take_img(tk, t)
        if tk.get("glitch") and abs(t - tk["glitch"]) < 0.25:
            g = 1 - abs(t - tk["glitch"])/0.25; sh = int(22*g)
            img = img.copy(); img[..., 2] = np.roll(img[..., 2], sh, 1); img[..., 0] = np.roll(img[..., 0], -sh, 1)
        bw, bh = BOX[2] + 24, BOX[3] + 24
        spr = np.zeros((bh, bw, 4), np.float32)
        spr[12:12 + BOX[3], 12:12 + BOX[2], :3] = img*self.box_mask; spr[12:12 + BOX[3], 12:12 + BOX[2], 3:] = self.box_mask
        fa = self.box_frame[..., 3:4]; spr[..., :3] = spr[..., :3]*(1 - fa) + self.box_frame[..., :3]; spr[..., 3:] = np.maximum(spr[..., 3:], fa)
        return spr

    def push(self, t, alvo):
        for (a, b, z, who) in self.cfg.get("push", []):
            if who == alvo and a <= t < b: return 1 + (z - 1)*(t - a)/(b - a)
        return 1.0

    def put_box(self, f, spr, dx=0.0, s=1.0, alpha=1.0, blur=0.0, hblur=0):
        if hblur > 1: spr = cv2.blur(spr, (int(hblur) | 1, 1))
        if blur > 0.3: spr = cv2.GaussianBlur(spr, (0, 0), blur)
        s *= self.push(self._t, "take")
        cx, cy = BOX[0] + BOX[2]/2 + dx, BOX[1] + BOX[3]/2
        blit(f, self.box_shadow, cx, cy + 6, s, s, 0, alpha)
        blit(f, spr, cx, cy, s, s, 0, alpha)

    def draw_take(self, f, t):
        self._t = t
        tk = self.take_frame(t)
        if tk is None: return f
        tr = tk.get("tr", "cut"); u = t - tk["a"]
        if tk is self.cfg["takes"][0] and u < 1.0:      # TAKE 1 chegando de cima pra baixo (1 s, com desfoque)
            k = spring(u, 140, 15); vy = 1 - clamp(u/0.55)
            dy = -(BOX[1] + BOX[3] + 40)*(1 - k)
            spr = self.box_sprite(tk, t)
            if vy > 0.02: spr = cv2.blur(spr, (1, int(1 + 70*vy) | 1))
            cx, cy = BOX[0] + BOX[2]/2, BOX[1] + BOX[3]/2 + dy
            blit(f, self.box_shadow, cx, cy + 6); blit(f, spr, cx, cy)
            return f
        side = -1.0 if tk.get("dir") == "left" else 1.0
        prev = [p for p in self.cfg["takes"] if abs(p["b"] - tk["a"]) < 1e-3]
        prev = prev[0] if prev else None
        if tr == "slide" and prev is not None and u < 0.34:
            if u < 0.14:      # quadro atual arrastado pra esquerda
                k = (u/0.14)**2
                self.put_box(f, self.box_sprite(prev, tk["a"] - 1/FPS), dx=-side*W*1.05*k, hblur=60*k)
            else:             # o novo vem da direita, com leve curva elastica
                k = spring(u - 0.14, 260, 21)
                self.put_box(f, self.box_sprite(tk, t), dx=side*W*1.05*(1 - k), hblur=50*max(0, 1 - (u - 0.14)/0.12))
            return f
        if tr == "pop" and prev is not None and u < 0.40:
            if u < 0.12:      # pop inverso: o atual encolhe e some
                k = u/0.12
                self.put_box(f, self.box_sprite(prev, tk["a"] - 1/FPS), s=1 - 0.35*k**2, alpha=1 - k, blur=5*k)
            else:             # pop de entrada com curva elastica leve
                k = spring(u - 0.12, 300, 20)
                self.put_box(f, self.box_sprite(tk, t), s=mix(0.62, 1.0, k), alpha=clamp((u - 0.12)/0.06), blur=5*max(0, 1 - (u - 0.12)/0.10))
            return f
        self.put_box(f, self.box_sprite(tk, t))
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
        rot = 0.45*math.sin(t*2*math.pi*0.38); bob = 3*math.sin(t*2*math.pi*0.38*2 + 0.6)
        # modo A: soco de zoom so no Foxy
        za = 1.0
        for ta in self.cfg.get("modoA", []):
            if 0 <= t - ta < 0.7: za = 1 + 0.05*math.sin(math.pi*clamp((t - ta)/0.7))**1.2
        za *= self.push(t, "foxy")
        pivot_y = spr.shape[0]*0.98
        cx = W/2; cy = GLASS_Y - ay + pivot_y + bob
        img = spr
        if u < 0.07 and t0 > 0: img = cv2.blur(spr, (1, int(1 + 26*(1 - u/0.07)) | 1))   # motion blur curto
        if name not in self.shadows:
            sh = np.zeros_like(spr); sh[..., 3] = cv2.GaussianBlur(spr[..., 3], (0, 0), 14)*0.32
            self.shadows[name] = sh
        blit(f, self.shadows[name], cx + 12, cy + 4, sx*za, sy*za, rot, 1.0, pivot=(ax, pivot_y))
        blit(f, img, cx, cy, sx*za, sy*za, rot, 1.0, pivot=(ax, pivot_y))
        return f

    # ---- camera (modo B) ----
    def camera(self, f, t):
        z = 1.0
        for (a, b, z0, z1) in self.cfg.get("modoB", []):
            if a <= t < b: z = mix(z0, z1, e_io((t - a)/(b - a)))
        if abs(z - 1) < 1e-3: return f
        M = cv2.getRotationMatrix2D((W/2, 1250), 0, z)
        return cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

    def screen_whip(self, f, t):
        for T0 in self.cfg.get("whip", []):
            if T0 - 0.16 <= t < T0 + 0.20:
                if t < T0: k = ((t - (T0 - 0.16))/0.16)**2; dx = -W*0.55*k
                else: k = 1 - e_out((t - T0)/0.20); dx = W*0.55*k
                M = np.float32([[1, 0, dx], [0, 1, 0]])
                f = cv2.warpAffine(f, M, (W, H), borderMode=cv2.BORDER_REFLECT)
                f = cv2.blur(f, (int(1 + 120*k) | 1, 1))
        return f

    def flash(self, f, t):
        T0 = self.cfg["flash"]
        if T0 - 0.05 <= t < T0 + 0.40:
            a = clamp((t - (T0 - 0.05))/0.05) if t < T0 else 1 - e_out((t - T0)/0.40)
            f = f*(1 - a) + a
        return f

if __name__ == "__main__":
    cfg = json.load(open(sys.argv[1])); a = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0; b = float(sys.argv[4]) if len(sys.argv) > 4 else None
    Video(cfg).render(sys.argv[2], a, b)
