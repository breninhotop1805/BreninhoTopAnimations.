# Legenda palavra por palavra (Komika Axis), pop com mola + leve desfoque de entrada, sincronizada por alinhamento forcado.
import sys, json, math, re, subprocess, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 60
FONT = "/home/user/BreninhoTopAnimations./editor/fontes/KOMIKAX_.ttf"
SRC, WORDS, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
T0 = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0
T1 = float(sys.argv[5]) if len(sys.argv) > 5 else 1e9
Y = 1470            # centro vertical da legenda (terco inferior)
SIZE = 84
LEAD = 2/60         # entra 2 quadros antes do inicio da palavra (percepcao de sincronia)

words = [w for w in json.load(open(WORDS)) if w["s"] is not None]
def clean(w):
    w = w.strip()
    w = re.sub(r"[.,;:!]+$", "", w)
    return w.upper()
# junta palavras curtissimas (<0,11 s) com a seguinte pra nao piscar
caps = []
i = 0
while i < len(words):
    txt = clean(words[i]["w"]); s = words[i]["s"]; e = words[i]["e"]
    while i + 1 < len(words) and (words[i]["e"] - words[i]["s"]) < 0.11 and len(clean(words[i]["w"])) <= 2 \
            and words[i+1]["s"] - words[i]["e"] < 0.15:
        i += 1; txt += " " + clean(words[i]["w"]); e = words[i]["e"]
    caps.append({"t": txt, "s": s - LEAD, "e": e}); i += 1
for k, c in enumerate(caps):
    nxt = caps[k+1]["s"] if k + 1 < len(caps) else c["e"] + 0.4
    c["fim"] = nxt if nxt - c["e"] < 0.35 else c["e"] + 0.15
json.dump(caps, open(OUT + ".legendas.json", "w"), ensure_ascii=False, indent=0)

INTRO_END = 6.56; BIG = 128
FONTS = {SIZE: ImageFont.truetype(FONT, SIZE), BIG: ImageFont.truetype(FONT, BIG)}
def sprite(txt, size=SIZE):
    font = FONTS[size]; st = 14 if size == SIZE else 18
    bb = font.getbbox(txt, stroke_width=st); pad = 40
    w, h = bb[2] - bb[0] + pad*2, bb[3] - bb[1] + pad*2
    sh = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
    d.text((pad - bb[0] + 5, pad - bb[1] + 8), txt, font=font, fill=(0, 0, 0, 150), stroke_width=st, stroke_fill=(0, 0, 0, 150))
    sh = sh.filter(ImageFilter.GaussianBlur(7))
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.text((pad - bb[0], pad - bb[1]), txt, font=font, fill=(255, 255, 255, 255), stroke_width=st, stroke_fill=(0, 0, 0, 255))
    sh.alpha_composite(im)
    a = np.asarray(sh).astype(np.float32) / 255; a[..., :3] *= a[..., 3:4]
    return a[..., [2, 1, 0, 3]].copy()
SPR = {}

def pop(u, k=700.0, c=26.0):
    """resposta ao degrau de mola amortecida: 0 -> 1 com leve overshoot (salto sem exagero)"""
    if u <= 0: return 0.0
    w0 = math.sqrt(k); z = c/(2*w0); wd = w0*math.sqrt(1 - z*z)
    return 1 - math.exp(-z*w0*u)*(math.cos(wd*u) + z*w0/wd*math.sin(wd*u))

def draw(f, c, t):
    global Y
    big = c["s"] < INTRO_END; size = BIG if big else SIZE; key = (c["t"], size)
    if key not in SPR: SPR[key] = sprite(c["t"], size)
    spr = SPR[key]; u = t - c["s"]
    Y = 960 if big else 1470
    p = pop(u) if not big else pop(u, k=900.0, c=30.0); s = (0.62 + 0.38*p) if not big else (0.45 + 0.55*p)
    a = 1.0   # sem fade: a palavra ja nasce opaca
    blur = max(0.0, 7.0*(1 - u/0.09))
    hh, ww = spr.shape[:2]
    M = cv2.getRotationMatrix2D((ww/2, hh/2), 0, s); M[0, 2] += W/2 - ww/2; M[1, 2] += Y - hh/2 - 14*(1 - p)
    x0, y0 = max(0, int(W/2 - ww*s/2) - 2), max(0, int(Y - hh*s/2) - 20); x1, y1 = min(W, int(W/2 + ww*s/2) + 2), min(H, int(Y + hh*s/2) + 4)
    M[0, 2] -= x0; M[1, 2] -= y0
    r = cv2.warpAffine(spr, M, (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR)
    if blur > 0.3: r = cv2.GaussianBlur(r, (0, 0), blur)
    al = r[..., 3:4]*a; roi = f[y0:y1, x0:x1]
    roi[:] = roi*(1 - al) + r[..., :3]*a

dec = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{T0}", "-i", SRC, "-t", f"{min(T1, 1e6) - T0}", "-map", "0:v:0",
                        "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS),
                        "-i", "-", "-ss", f"{T0}", "-i", SRC, "-t", f"{min(T1, 1e6) - T0}", "-map", "0:v", "-map", "1:a",
                        "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", "-c:a", "copy",
                        "-movflags", "+faststart", OUT], stdin=subprocess.PIPE)
n = W*H*3; i = 0
while True:
    b = dec.stdout.read(n)
    if len(b) < n: break
    t = T0 + i/FPS; i += 1
    f = np.frombuffer(b, np.uint8).reshape(H, W, 3).astype(np.float32)/255
    for c in caps:
        if c["s"] <= t < c["fim"]: draw(f, c, t)
    enc.stdin.write((np.clip(f, 0, 1)*255).astype(np.uint8).tobytes())
enc.stdin.close(); enc.wait()
print("legendas:", len(caps), "quadros:", i)
