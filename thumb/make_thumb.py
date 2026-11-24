"""Gera a thumbnail: boneco de palito com o rosto do Neymar chutando,
goleiro voando na bola e o Neymar real à direita."""
import math
import random
import sys
from PIL import Image, ImageDraw, ImageFilter

SRC = sys.argv[1]          # PNG recortado do Neymar (com transparência)
OUT = sys.argv[2]
W, H = 1280, 720
SS = 2                      # supersampling para bordas suaves
random.seed(7)


def S(v):
    return int(round(v * SS))


def P(*pts):
    return [(S(x), S(y)) for x, y in pts]


canvas = Image.new("RGB", (W * SS, H * SS))
d = ImageDraw.Draw(canvas)

# ---------- céu ----------
sky_top, sky_bot = (18, 110, 235), (120, 200, 255)
for y in range(S(470)):
    t = y / S(470)
    c = tuple(int(sky_top[i] + (sky_bot[i] - sky_top[i]) * t) for i in range(3))
    d.line([(0, y), (W * SS, y)], fill=c)

# nuvens
clouds = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
cd = ImageDraw.Draw(clouds)
for cx, cy, sc in [(120, 60, 1.2), (420, 40, 0.9), (700, 90, 1.0), (980, 50, 1.3), (260, 160, 0.7), (1150, 170, 0.8)]:
    for _ in range(14):
        rx = random.uniform(25, 60) * sc
        ry = rx * random.uniform(0.35, 0.55)
        ox = random.uniform(-90, 90) * sc
        oy = random.uniform(-12, 12) * sc
        a = random.randint(150, 230)
        cd.ellipse([S(cx + ox - rx), S(cy + oy - ry), S(cx + ox + rx), S(cy + oy + ry)], fill=(255, 255, 255, a))
clouds = clouds.filter(ImageFilter.GaussianBlur(S(6)))
canvas.paste(clouds, (0, 0), clouds)
d = ImageDraw.Draw(canvas)

# refletor
d.rectangle(P((292, 70), (300, 470)), fill=(200, 205, 215))
d.rounded_rectangle(P((262, 36), (330, 78)), radius=S(5), fill=(235, 238, 245), outline=(150, 155, 165), width=S(2))
for i in range(3):
    for j in range(2):
        x0, y0 = 268 + i * 21, 41 + j * 18
        d.rectangle(P((x0, y0), (x0 + 17, y0 + 14)), fill=(255, 255, 240))
glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
ImageDraw.Draw(glow).ellipse(P((230, 5), (362, 110)), fill=(255, 255, 230, 120))
glow = glow.filter(ImageFilter.GaussianBlur(S(18)))
canvas.paste(glow, (0, 0), glow)
d = ImageDraw.Draw(canvas)

# alambrado / arquibancada distante
d.rectangle(P((0, 395), (W, 470)), fill=(150, 190, 225))
for x in range(0, W, 14):
    d.line(P((x, 395), (x + 75, 470)), fill=(120, 160, 200), width=S(1))
    d.line(P((x + 75, 395), (x, 470)), fill=(120, 160, 200), width=S(1))
d.rectangle(P((0, 392), (W, 397)), fill=(90, 110, 140))

# ---------- gramado ----------
horizon = 470
for y in range(S(horizon), H * SS):
    t = (y - S(horizon)) / (H * SS - S(horizon))
    d.line([(0, y), (W * SS, y)], fill=(int(40 + 25 * t), int(150 + 30 * t), int(40 + 10 * t)))
# faixas
for k in range(9):
    if k % 2:
        continue
    x0, x1 = -200 + k * 190, -200 + (k + 1) * 190
    d.polygon(P((x0 * 0.6 + 260, horizon), (x1 * 0.6 + 260, horizon), (x1 * 1.4 - 100, H), (x0 * 1.4 - 100, H)), fill=(70, 175, 55))
# linhas
d.line(P((0, 540), (W, 525)), fill=(245, 245, 245), width=S(5))
d.line(P((220, 470), (120, 540)), fill=(245, 245, 245), width=S(4))
# textura de grama
grass = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
gd = ImageDraw.Draw(grass)
for _ in range(9000):
    x = random.uniform(0, W)
    y = random.uniform(horizon, H)
    h = 2 + (y - horizon) / 40
    g = random.choice([(30, 120, 30, 120), (110, 210, 80, 110)])
    gd.line(P((x, y), (x + random.uniform(-1, 1), y - h)), fill=g, width=S(1))
canvas.paste(grass, (0, 0), grass)
d = ImageDraw.Draw(canvas)

# ---------- gol ----------
GL, GR, GT, GB = 300, 900, 120, 500     # trave da frente
BL, BR, BT, BB = 340, 860, 150, 455     # fundo
net = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
nd = ImageDraw.Draw(net)
nd.polygon(P((GL, GT), (GR, GT), (GR, GB), (GL, GB)), fill=(255, 255, 255, 25))
step = 14
for x in range(GL, GR + 1, step):
    nd.line(P((x, GT), (x, GB)), fill=(255, 255, 255, 150), width=S(1.3))
for y in range(GT, GB + 1, step):
    nd.line(P((GL, y), (GR, y)), fill=(255, 255, 255, 150), width=S(1.3))
canvas.paste(net, (0, 0), net)
d = ImageDraw.Draw(canvas)
# sombra no chão
d.polygon(P((GL, GB + 2), (GR, GB + 2), (GR + 20, GB + 14), (GL - 20, GB + 14)), fill=(40, 120, 40))
# traves
for pts, wdt in [(((GL, GB), (GL, GT), (GR, GT), (GR, GB)), 13)]:
    d.line(P(*pts), fill=(170, 175, 185), width=S(wdt + 3), joint="curve")
    d.line(P(*pts), fill=(255, 255, 255), width=S(wdt), joint="curve")

# ---------- helpers do boneco ----------
def limb(pts, color, width, outline=(30, 30, 40)):
    d.line(P(*pts), fill=outline, width=S(width + 5), joint="curve")
    for p in pts:
        r = (width + 5) / 2
        d.ellipse([S(p[0] - r), S(p[1] - r), S(p[0] + r), S(p[1] + r)], fill=outline)
    d.line(P(*pts), fill=color, width=S(width), joint="curve")
    for p in pts:
        r = width / 2
        d.ellipse([S(p[0] - r), S(p[1] - r), S(p[0] + r), S(p[1] + r)], fill=color)


def ball(cx, cy, r, color=(255, 255, 255), outline=(40, 40, 50)):
    d.ellipse([S(cx - r - 2.5), S(cy - r - 2.5), S(cx + r + 2.5), S(cy + r + 2.5)], fill=outline)
    d.ellipse([S(cx - r), S(cy - r), S(cx + r), S(cy + r)], fill=color)
    d.ellipse([S(cx - r * 0.55), S(cy - r * 0.75), S(cx - r * 0.05), S(cy - r * 0.35)], fill=(255, 255, 255))


def boot(heel, toe, color=(250, 250, 250), accent=(0, 170, 80)):
    hx, hy = heel
    tx, ty = toe
    ang = math.atan2(ty - hy, tx - hx)
    nx, ny = -math.sin(ang), math.cos(ang)
    L = math.hypot(tx - hx, ty - hy)
    pts = [(hx - nx * 14, hy - ny * 14), (tx - nx * 6, ty - ny * 6), (tx + nx * 10, ty + ny * 10), (hx + nx * 12, hy + ny * 12)]
    d.polygon(P(*pts), fill=(30, 30, 40))
    pts2 = [(hx - nx * 11 + math.cos(ang) * 2, hy - ny * 11 + math.sin(ang) * 2),
            (tx - nx * 4 - math.cos(ang) * 3, ty - ny * 4 - math.sin(ang) * 3),
            (tx + nx * 7 - math.cos(ang) * 3, ty + ny * 7 - math.sin(ang) * 3),
            (hx + nx * 9, hy + ny * 9)]
    d.polygon(P(*pts2), fill=color)
    # sola
    d.line(P((hx + nx * 10, hy + ny * 10), (tx + nx * 8, ty + ny * 8)), fill=accent, width=S(5))
    # swoosh-like stripe
    mx, my = hx + (tx - hx) * 0.45, hy + (ty - hy) * 0.45
    d.line(P((mx - nx * 2 - math.cos(ang) * 12, my - ny * 2 - math.sin(ang) * 12), (mx + math.cos(ang) * 14 - nx * 6, my + math.sin(ang) * 14 - ny * 6)), fill=accent, width=S(4))


# ---------- trajetória da bola ----------
BALL = (815, 205)
trail = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
td = ImageDraw.Draw(trail)
start = (440, 380)
for i in range(60):
    t0, t1 = i / 60, (i + 1) / 60
    def bez(t):
        cx, cy = 600, 230
        return ((1 - t) ** 2 * start[0] + 2 * (1 - t) * t * cx + t ** 2 * BALL[0],
                (1 - t) ** 2 * start[1] + 2 * (1 - t) * t * cy + t ** 2 * BALL[1])
    a = int(70 + 185 * t1)
    w = 4 + 18 * t1
    td.line([tuple(S(v) for v in bez(t0)), tuple(S(v) for v in bez(t1))], fill=(255, 255, 255, a), width=S(w))
    for off in (-14, 14):
        p0, p1 = bez(t0), bez(t1)
        td.line([(S(p0[0]), S(p0[1] + off * t0)), (S(p1[0]), S(p1[1] + off * t1))], fill=(255, 255, 255, int(a * 0.5)), width=S(2))
trail = trail.filter(ImageFilter.GaussianBlur(S(3)))
canvas.paste(trail, (0, 0), trail)
d = ImageDraw.Draw(canvas)

# ---------- goleiro voando ----------
def keeper():
    # corpo inclinado, voando para a direita/cima
    hip = (640, 335)
    chest = (725, 272)
    # pernas
    limb([hip, (590, 352), (548, 372)], (240, 200, 0), 11)
    limb([hip, (600, 320), (560, 330)], (240, 200, 0), 11)
    for k in [((548, 372), (530, 382)), ((560, 330), (540, 336))]:
        d.line(P(*k), fill=(30, 30, 40), width=S(12))
    # tronco
    d.line(P(hip, chest), fill=(30, 30, 40), width=S(34))
    d.line(P(hip, chest), fill=(250, 215, 20), width=S(28))
    d.line(P((655, 322), (712, 283)), fill=(0, 150, 70), width=S(4))
    # braços esticados para a bola
    limb([chest, (765, 240), (795, 218)], (250, 215, 20), 10)
    limb([(715, 280), (770, 262), (805, 240)], (250, 215, 20), 10)
    for gx, gy in [(797, 214), (808, 238)]:
        d.ellipse(P((gx - 11, gy - 11), (gx + 11, gy + 11)), fill=(30, 30, 40))
        d.ellipse(P((gx - 8.5, gy - 8.5), (gx + 8.5, gy + 8.5)), fill=(60, 200, 90))
    # cabeça cartoon
    hx, hy = 712, 238
    d.ellipse(P((hx - 22, hy - 22), (hx + 22, hy + 22)), fill=(30, 30, 40))
    d.ellipse(P((hx - 19, hy - 19), (hx + 19, hy + 19)), fill=(240, 195, 160))
    d.pieslice(P((hx - 20, hy - 22), (hx + 20, hy + 16)), 180, 360, fill=(80, 50, 30))
    d.ellipse(P((hx - 9, hy - 2), (hx - 3, hy + 6)), fill=(30, 30, 40))
    d.ellipse(P((hx + 4, hy - 2), (hx + 10, hy + 6)), fill=(30, 30, 40))
    d.ellipse(P((hx - 4, hy + 9), (hx + 5, hy + 15)), fill=(150, 40, 40))


keeper()
ball(*BALL, 22)
# gomos da bola
bx, by = BALL
d.regular_polygon((S(bx + 2), S(by + 2), S(7)), 5, fill=(30, 30, 40))
for a in range(0, 360, 72):
    ex = bx + 2 + math.cos(math.radians(a - 90)) * 15
    ey = by + 2 + math.sin(math.radians(a - 90)) * 15
    d.line(P((bx + 2 + math.cos(math.radians(a - 90)) * 7, by + 2 + math.sin(math.radians(a - 90)) * 7), (ex, ey)), fill=(30, 30, 40), width=S(2))

# ---------- boneco Neymar chutando ----------
YEL, BLUE, WHITE = (255, 215, 0), (30, 80, 200), (245, 245, 250)
hip = (205, 470)
neck = (190, 300)
# sombra no chão
sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
ImageDraw.Draw(sh).ellipse(P((110, 655), (330, 690)), fill=(0, 60, 0, 110))
sh = sh.filter(ImageFilter.GaussianBlur(S(6)))
canvas.paste(sh, (0, 0), sh)
d = ImageDraw.Draw(canvas)

# braço de trás (esquerda, esticado para trás)
limb([(175, 320), (110, 300), (50, 330)], BLUE, 24)
# perna de apoio
knee_s = (190, 580)
foot_s = (200, 655)
limb([hip, knee_s, foot_s], BLUE, 28)
boot((190, 660), (250, 668))
# perna do chute (esticada para frente e cima)
knee_k = (305, 445)
foot_k = (395, 398)
limb([hip, knee_k, foot_k], BLUE, 28)
boot((385, 410), (440, 376))

# tronco (camisa)
torso = [(150, 300), (232, 300), (246, 470), (166, 478)]
d.polygon(P(*[(x - 3, y - 3) for x, y in torso[:2]], *[(x + 3, y + 3) for x, y in torso[2:]]), fill=(30, 30, 40))
d.polygon(P(*torso), fill=YEL)
d.line(P((150, 300), (166, 478)), fill=(30, 30, 40), width=S(5))
d.line(P((232, 300), (246, 470)), fill=(30, 30, 40), width=S(5))
d.line(P((150, 300), (232, 300)), fill=(30, 30, 40), width=S(5))
d.line(P((166, 478), (246, 470)), fill=(30, 30, 40), width=S(5))
# gola verde
d.chord(P((168, 285), (214, 318)), 0, 180, fill=(0, 150, 70))
# shorts
d.polygon(P((164, 462), (248, 455), (258, 505), (166, 512)), fill=(30, 30, 40))
d.polygon(P((168, 465), (244, 459), (252, 500), (170, 506)), fill=BLUE)
# número 10 (desenhado)
def draw10(x, y, s, col):
    d.line(P((x, y), (x, y + s)), fill=col, width=S(6))
    d.rounded_rectangle(P((x + 10, y), (x + 10 + s * 0.55, y + s)), radius=S(s * 0.27), outline=col, width=S(6))
draw10(206, 340, 42, (0, 140, 60))
# braço da frente (para frente, equilibrando)
limb([(225, 320), (275, 360), (320, 345)], BLUE, 24)
# luvas/juntas brancas
for jx, jy, r in [(50, 330, 22), (320, 345, 20), (110, 300, 14), (275, 360, 14), (190, 580, 16), (305, 445, 16)]:
    d.ellipse(P((jx - r - 3, jy - r - 3), (jx + r + 3, jy + r + 3)), fill=(30, 30, 40))
    d.ellipse(P((jx - r, jy - r), (jx + r, jy + r)), fill=WHITE)
    d.ellipse(P((jx - r * 0.6, jy - r * 0.7), (jx - r * 0.1, jy - r * 0.25)), fill=(255, 255, 255))

canvas = canvas.resize((W, H), Image.LANCZOS)

# ---------- rosto real no boneco ----------
src = Image.open(SRC).convert("RGBA")
head = src.crop((120, 0, 440, 360))
mask = Image.new("L", head.size, 0)
ImageDraw.Draw(mask).polygon([(0, 0), (320, 0), (320, 235), (268, 282), (215, 322), (160, 342), (110, 336), (70, 300), (30, 240), (0, 230)], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(2))
alpha = Image.composite(head.getchannel("A"), Image.new("L", head.size, 0), mask)
head.putalpha(alpha)
head = head.resize((int(320 * 0.72), int(360 * 0.72)), Image.LANCZOS)
head = head.rotate(8, resample=Image.BICUBIC, expand=True)
# contorno escuro + sombra para parecer "colado" como cabeça de boneco
outline = head.getchannel("A").filter(ImageFilter.GaussianBlur(4))
ol = Image.new("RGBA", head.size, (20, 20, 30, 0))
ol.putalpha(outline.point(lambda v: min(220, v * 4)))
hx, hy = 72, 72
canvas.paste(ol, (hx, hy), ol)
canvas.paste(head, (hx, hy), head)

# ---------- Neymar real à direita ----------
person = src.copy()
scale = 0.92
person = person.resize((int(src.width * scale), int(src.height * scale)), Image.LANCZOS)
person = person.crop((0, 0, person.width, 720 - 10))
# brilho/contorno branco
a = person.getchannel("A")
glow = a.filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(10))
gl = Image.new("RGBA", person.size, (255, 255, 255, 0))
gl.putalpha(glow.point(lambda v: min(255, int(v * 1.3))))
px, py = W - person.width + 40, 20
canvas.paste(gl, (px, py), gl)
canvas.paste(person, (px, py), person)

# vinheta leve
vig = Image.new("L", (W, H), 0)
ImageDraw.Draw(vig).ellipse((-200, -150, W + 200, H + 150), fill=255)
vig = vig.filter(ImageFilter.GaussianBlur(120))
dark = Image.new("RGB", (W, H), (0, 20, 40))
canvas = Image.composite(canvas, dark, vig.point(lambda v: 150 + v * 105 // 255))

canvas.save(OUT, quality=95)
print("ok", OUT)
