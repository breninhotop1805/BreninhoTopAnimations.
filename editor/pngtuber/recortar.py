# Recorta o fundo branco das poses do Foxy e padroniza escala/ancoragem pelos oculos.
import sys, glob, os, numpy as np, cv2
from PIL import Image, ImageOps
SRC = sys.argv[1]; OUT = sys.argv[2]; os.makedirs(OUT, exist_ok=True)
GLASS_W = 430          # largura dos oculos na tela final (px)
GLASS_Y = 985          # altura dos oculos na tela final (1080x1920)
# buracos brancos fechados (entre braco e corpo) que nao tocam a borda: pontos-semente na imagem original
HOLES = {"lv_0_20261127052636": [(975, 1147)], "IMG-20261127-WA1904~2": [(795, 425), (835, 476)]}

def cut(path):
    im = np.asarray(ImageOps.exif_transpose(Image.open(path)).convert("RGB")).astype(np.float32)
    h, w, _ = im.shape
    mn = im.min(-1); mx = im.max(-1)
    white = ((mn > 214) & (mx - mn < 26)).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(white, 4)
    bg = np.zeros((h, w), bool)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    seeds = HOLES.get(os.path.splitext(os.path.basename(path))[0], [])
    extra = {int(lab[y, x]) for (x, y) in seeds if lab[y, x] > 0}
    for i in range(1, n):
        if i in border or i in extra or st[i, cv2.CC_STAT_AREA] > 0.004*h*w: bg |= lab == i
    # alfa: fundo = 0; faixa de 3 px na borda recebe alfa pela "escuridao" (contorno preto antialiased)
    fg = (~bg).astype(np.uint8)
    dist = cv2.distanceTransform(fg, cv2.DIST_L2, 3)
    band = (dist > 0) & (dist < 3.5)
    a = np.where(bg, 0.0, 1.0).astype(np.float32)
    dark = np.clip((245 - mn)/70.0, 0, 1)
    a[band] = np.maximum(dark[band], np.clip((dist[band] - 1.2)/2.0, 0, 1))
    a = cv2.GaussianBlur(a, (0, 0), 0.6)*(~bg | (cv2.dilate(fg, np.ones((3, 3), np.uint8)) > 0))
    # descontaminacao do branco nas bordas
    aa = np.clip(a, 1e-3, 1)[..., None]
    col = np.clip((im - (1 - aa)*255)/aa, 0, 255)
    col = np.where(a[..., None] > 0.98, im, col)
    # oculos: linha com mais pixels pretos no terco de cima; extensao horizontal na faixa (tolerando falhas pequenas)
    blk = (mx < 70)
    prof = blk[: int(h*0.45)].sum(1)
    gy = int(np.argmax(prof))
    band = blk[max(0, gy - 12): gy + 12].any(0)
    xs = np.where(band)[0]
    runs = []; st_ = xs[0]; pv = xs[0]
    for x in xs[1:]:
        if x - pv > int(w*0.03): runs.append((st_, pv)); st_ = x
        pv = x
    runs.append((st_, pv))
    gx0, gx1 = max(runs, key=lambda r: r[1] - r[0]); gw = gx1 - gx0
    gx, gh = gx0, 1
    rgba = np.dstack([col, a*255]).astype(np.uint8)
    return rgba, (gx + gw/2, gy + gh/2, gw)

rows = []
for p in sorted(glob.glob(SRC + "/*")):
    rgba, (cx, cy, gw) = cut(p)
    s = GLASS_W/gw
    im = Image.fromarray(rgba, "RGBA")
    im = im.resize((round(im.width*s), round(im.height*s)), Image.LANCZOS)
    # nitidez leve para nivelar as poses
    arr = np.asarray(im).astype(np.float32)
    bl = cv2.GaussianBlur(arr[..., :3], (0, 0), 1.0); arr[..., :3] = np.clip(arr[..., :3]*1.35 - bl*0.35, 0, 255)
    im = Image.fromarray(arr.astype(np.uint8), "RGBA")
    ax, ay = cx*s, cy*s
    name = os.path.splitext(os.path.basename(p))[0]
    im.save(f"{OUT}/{name}.png")
    bottom = GLASS_Y - ay + im.height
    rows.append(f"{name}|{ax:.1f}|{ay:.1f}|{im.width}|{im.height}|bottom_on_screen={bottom:.0f}")
open(f"{OUT}/anchors.txt", "w").write("\n".join(rows))
print("\n".join(rows))
