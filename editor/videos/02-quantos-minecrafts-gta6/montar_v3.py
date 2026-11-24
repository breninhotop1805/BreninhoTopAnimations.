# Video 2 - refeito: menos texto, um elemento forte por vez, conta mostrada visualmente.
import sys, math, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
import montar_v2 as B
from montar_v2 import *

# ---------- fundo mais leve: feixes calculados em 1/4 da resolucao ----------
hW, hH = W//4, H//4
yy4, xx4 = np.mgrid[0:hH, 0:hW].astype(np.float32)*4
def beams(f, t):
    out = np.zeros((hH, hW), np.float32)
    for (sp, w, a, ph) in [(70, 140, 0.10, 0), (45, 90, 0.08, 700), (95, 60, 0.07, 1400)]:
        pos = ((t*sp + ph) % (W + H + 600)) - 300
        out += a*np.exp(-(((xx4 + yy4*0.55) - pos)/w)**2)
    out *= np.clip(1.15 - yy4/H, 0, 1)
    out = cv2.resize(out, (W, H), interpolation=cv2.INTER_LINEAR)
    return f + out[..., None]*np.array([0.95, 0.6, 1.0], np.float32)
def fundo(t, dolly): return beams(CEN.frame(t, dolly), t)

# ---------- logo do GTA que "enche" de grama ----------
LW = 700
GLA = GL[..., 3].copy()                          # mascara da logo
LH_, LW_ = GLA.shape
def tile_texture(tile):
    """grama do Minecraft vista de cima: verde vivo com variacao de pixel e grade dos blocos"""
    r = np.random.default_rng(3)
    img = np.zeros((LH_, LW_, 3), np.float32)
    pal = np.array([(60, 190, 105), (72, 210, 120), (50, 165, 90), (85, 220, 135)], np.float32)/255     # BGR
    p = max(1, tile//8)
    for by in range(0, LH_, tile):
        for bx in range(0, LW_, tile):
            shade = r.uniform(0.9, 1.1)
            for y in range(by, min(by + tile, LH_), p):
                for x in range(bx, min(bx + tile, LW_), p):
                    img[y:y + p, x:x + p] = pal[r.integers(0, 4)]*shade
            e = max(1, tile//14)
            img[by:by + tile, bx:bx + e] *= 0.62; img[by:by + e, bx:bx + tile] *= 0.62
    return np.clip(img, 0, 1)
TEX_BIG = tile_texture(34)        # 212 Minecrafts
TEX_TINY = tile_texture(6)        # 200 mil Minecrafts originais

def logo_filled(level, tex, edge_glow=1.0):
    """sprite da logo com o interior preenchido ate 'level' (0..1) de baixo pra cima"""
    base = GL.copy()
    yline = LH_*(1 - level)
    ys = np.arange(LH_, dtype=np.float32)[:, None]
    fill = np.clip((ys - yline)/3.0, 0, 1)*(GLA > 0.5)
    lum = base[..., :3].mean(-1)/np.maximum(GLA, 1e-3)
    keep = np.clip((lum - 0.80)/0.12, 0, 1)            # mantem o texto branco e o contorno da logo
    a = fill*0.88*(1 - keep)
    col = base[..., :3]*(1 - a[..., None]) + tex*0.95*GLA[..., None]*a[..., None]
    if 0.01 < level < 0.995:
        band = np.exp(-((ys - yline)/5.0)**2)*(GLA > 0.5)*edge_glow
        col = col + band[..., None]*np.array([0.6, 1.0, 0.6])
    out = base.copy(); out[..., :3] = np.clip(col, 0, 1); return out

# ================= A1: INTRO =================
def debris(n, seed):
    r = np.random.default_rng(seed)
    return [(r.uniform(-1, 1)*900, -r.uniform(500, 1400), r.integers(0, 3), r.uniform(6, 14)) for _ in range(n)]
DEB1 = debris(34, 1)
T_LAND = 0.52
a1_bs = Spring(0, 6.8, [(0, 1.0)], k=420, c=13, impulses=[(T_LAND, -3.2)])                 # squash do bloco
a1_gy = Spring(0, 6.8, [(0, 1500.0), (1.30, 560.0)], k=60, c=11)                            # logo sobe do horizonte
a1_gs = Spring(0, 6.8, [(0, 0.7), (1.30, 1.0)], k=70, c=10)
a1_q = Spring(0, 6.8, [(0, 0.0), (3.58, 1.0)], k=240, c=11)
a1_cam = Spring(0, 6.8, [(0, 1.0), (3.54, 1.12)], k=10, c=6)
a1_sx = Spring(0, 6.8, [(0, 0.0)], k=800, c=20, impulses=[(T_LAND, 260), (1.6, -120), (5.44, -260), (5.52, 220)])
a1_sy = Spring(0, 6.8, [(0, 0.0)], k=800, c=20, impulses=[(T_LAND, 520), (1.6, -200)])
BLK_Y = 1215
def a1(t):
    f = fundo(t, 1 + 0.18*t/6.5)
    ec = (1 + 0.10*t/6.5)*a1_cam(t)
    def P(x, y): return 540 + (x - 540)*ec + a1_sx(t), 900 + (y - 900)*ec + a1_sy(t)
    pixels(f, t, P)
    # logo sobe do horizonte por tras (recortada na linha do horizonte)
    g2 = f.copy(); ly = a1_gy(t)
    lx, lyy = P(540, ly)
    blit(g2, GLOWB, lx, lyy, ec*1.35, 0, 0.6*clamp((t - 1.3)/0.5))
    blit(g2, GL, lx, lyy, ec*a1_gs(t))
    hy_s = P(0, I4.HY)[1]
    ramp = np.clip((hy_s - np.arange(H))/14.0, 0, 1)[:, None, None]
    f = f*(1 - ramp) + g2*ramp
    # bloco cai do ceu e bate no chao
    if t < T_LAND: y = -260 + 0.5*(2*(BLK_Y + 260)/T_LAND**2)*t*t; rot = -18*(1 - t/T_LAND)
    else: y = BLK_Y + 6*math.sin((t - T_LAND)*2.2)*min(1, (t - T_LAND)); rot = 3*math.sin(t*1.3)
    sq = a1_bs(t)
    bx, by = P(540, y)
    if t >= T_LAND:
        blit(f, GLOWG, bx, by + 60*ec, ec*0.9, 0, 0.45)
        # poeira de pixels do impacto
        u = t - T_LAND
        for (vx, vy, c, s) in DEB1:
            if u > 1.4: break
            px = 540 + vx*u; py = BLK_Y + 120 + vy*u + 0.5*2600*u*u
            if py > BLK_Y + 160: continue
            qx, qy = P(px, py); ss = int(s*ec*(1 - u/1.4))
            if ss > 0: cv2.rectangle(f, (int(qx - ss), int(qy - ss)), (int(qx + ss), int(qy + ss)), PIXC[c], -1)
    h, w = BLK_BIG.shape[:2]
    spr = cv2.resize(BLK_BIG, (int(w*(2 - sq)), int(h*sq))) if abs(sq - 1) > 0.01 else BLK_BIG
    blit(f, spr, bx, by + (1 - sq)*h*0.5*ec, ec*0.9, rot)
    # "?" unico
    k = a1_q(t)
    if k > 0.01:
        x, y = P(840, 1000); blit(f, T("?", 300, glow=(255, 60, 200)), x, y, ec*k, 10*math.sin(t*2.5), clamp(k*3))
    f = finish(f)
    g = math.exp(-max(0, t - 5.44)*7) if t >= 5.44 else 0
    if g > 0.03:
        r2 = np.random.default_rng(int(t*60)); sh = int(30*g); f2 = f.copy()
        f2[..., 2] = np.roll(f[..., 2], sh, 1); f2[..., 0] = np.roll(f[..., 0], -sh, 1)
        for _ in range(8):
            y0 = int(r2.uniform(0, H - 80)); hh = int(r2.uniform(15, 90)); dx = int(r2.uniform(-110, 110)*g)
            f2[y0:y0 + hh] = np.roll(f2[y0:y0 + hh], dx, 1)
        f = f2
    return f

# ================= A2: ARMAZENAMENTO (sem texto extra) =================
def a2(t):
    if B.PAN is None:
        im = rounded(900, 330, 44, (20, 6, 34, 235), (255, 90, 220, 255), 6); d = ImageDraw.Draw(im)
        d.text((60, 42), "ARMAZENAMENTO", font=ImageFont.truetype(F_BLACK, 46), fill=(255, 255, 255))
        B.PAN = to_sprite(im)
    f = fundo(t, 1 + 0.15*(t - B.T2)/2.3)
    ec = (1 + 0.12*(t - B.T2)/2.3)*(1 + 0.05*B.a2_pn(t))
    def P(x, y): return 540 + (x - 540)*ec, 960 + (y - 960)*ec + B.a2_sy(t)
    pixels(f, t, P)
    py = 820 + B.a2_in(t)
    x, y = P(540, py); blit(f, B.PAN, x, y, ec)
    x, y = P(205, py + 40); blit(f, GL_S, x, y, ec)
    p = clamp(B.a2_fill(t), 0, 1); full = t >= 9.05
    bx0, by0 = P(300, py + 10); bx1, by1 = P(950, py + 75)
    cv2.rectangle(f, (int(bx0), int(by0)), (int(bx1), int(by1)), (0.28, 0.08, 0.22), -1, cv2.LINE_AA)
    col = (0.25, 0.22, 1.0) if full else (0.45, 0.85, 0.35)
    cv2.rectangle(f, (int(bx0), int(by0)), (int(bx0 + (bx1 - bx0)*p), int(by1)), col, -1, cv2.LINE_AA)
    x, y = P(540, 1130); blit(f, T(f"{int(round(212*p))} GB", 150, glow=(40, 40, 255) if full else (120, 255, 140)), x, y, ec*(1 + 0.15*math.exp(-(t - 9.05)*8)*full))
    return finish(f)

# ================= A3: 212 BLOCOS ENCHENDO A LOGO =================
T3 = 17.57; LOGO_CY = 640
a3_in = Spring(T3, 22.3, [(T3, 0.8), (T3 + 0.02, 1.0)], k=160, c=14)
a3_lvl = lambda t: e_io(clamp((t - 18.75)/(21.15 - 18.75)))
a3_n = Spring(T3, 22.3, [(T3, 0.0), (21.31, 1.0)], k=240, c=12)
a3_pulse = Spring(T3, 22.3, [(T3, 0.0)], k=300, c=14, impulses=[(21.31, 1.0)])
r3 = np.random.default_rng(9)
DROP3 = [(18.45 + i*0.06 + r3.uniform(-0.03, 0.03), r3.uniform(330, 750), r3.uniform(-60, 60)) for i in range(42)]
def a3(t):
    f = fundo(t, 1 + 0.16*(t - T3)/4.5)
    ec = 1 + 0.12*(t - T3)/4.5
    def P(x, y): return 540 + (x - 540)*ec, 960 + (y - 960)*ec
    pixels(f, t, P)
    lvl = a3_lvl(t)
    x, y = P(540, LOGO_CY)
    blit(f, GLOWG, x, y, ec*1.4, 0, 0.25 + 0.35*lvl)
    s = ec*a3_in(t)*(1 + 0.06*a3_pulse(t))
    blit(f, to_sprite_cached(lvl, TEX_BIG), x, y, s)
    # blocos caindo e entrando na logo (somem ao entrar, so na metade de cima da tela)
    top = LOGO_CY - LH_/2 + LH_*(1 - lvl) + 30
    for (t0, x0, r0) in DROP3:
        u = t - t0
        if u < 0: continue
        yy = -100 + 0.5*3600*u*u
        if yy > top: continue
        px, py = P(x0, yy); blit(f, BLK, px, py, ec, r0 + 200*u)
    k = a3_n(t)
    if k > 0.01:
        x, y = P(540, 1150); blit(f, T("212", 200, glow=(120, 255, 140)), x, y, ec*k, 0, clamp(k*3))
    return finish(f)
_FC = {}
def to_sprite_cached(lvl, tex):
    key = (round(lvl, 3), id(tex))
    if key not in _FC:
        if len(_FC) > 400: _FC.clear()
        _FC[key] = logo_filled(lvl, tex)
    return _FC[key]

# ================= A4: camera afasta =================
def a4(t):
    f = fundo(t, 1.0 + 0.5*(1 - B.a4_s(t)))
    s = B.a4_s(t)
    def P(x, y): return x, y
    pixels(f, t, P)
    yy = LOGO_CY + 300*(1 - s)
    blit(f, GLOWG, 540, yy, 1.4*s + 0.08, 0, 0.4)
    blit(f, to_sprite_cached(1.0, TEX_BIG), 540, yy, s)
    return finish(f)

# ================= A5: a conta, so visual =================
T5 = 34.45
b_s = Spring(T5, 44.5, [(T5, 0.0), (T5 + 0.03, 1.0), (35.26, 0.05)], k=95, c=11.5)
b_y = Spring(T5, 44.5, [(T5, 700.0), (36.25, 700.0), (36.9, 560.0)], k=60, c=11)
mb = Spring(T5, 44.5, [(T5, 0.0), (35.66, 1.0), (36.30, 0.0)], k=230, c=14)
lg = Spring(T5, 44.5, [(T5, -900.0), (36.30, 0.0)], k=70, c=12)
cnt = Spring(T5, 44.5, [(T5, 0.0), (39.90, 1.0)], k=220, c=13, impulses=[(41.98, 3.0)])
lvl5 = lambda t: clamp((t - 38.0)/(41.95 - 38.0))**1.6
shx = Spring(T5, 44.5, [(T5, 0.0)], k=800, c=20, impulses=[(41.98, 380)])
shy = Spring(T5, 44.5, [(T5, 0.0)], k=800, c=20, impulses=[(41.98, -420)])
r5 = np.random.default_rng(13)
STREAM = [(r5.uniform(38.0, 41.9), r5.uniform(380, 700), r5.integers(0, 3)) for _ in range(900)]
BURST5 = [(r5.uniform(0, 2*math.pi), r5.uniform(600, 2400), r5.uniform(0, 0.15), r5.integers(0, 3), r5.uniform(4, 10)) for _ in range(420)]
def a5(t):
    f = fundo(t, 1 + 0.18*(t - T5)/9.8)
    ec = 1 + 0.12*(t - T5)/9.8
    def P(x, y): return 540 + (x - 540)*ec + shx(t), 960 + (y - 960)*ec + shy(t)
    pixels(f, t, P)
    # logo entra (vazia) e enche de pixelzinhos
    ly = LOGO_CY + lg(t)
    if lg(t) > -880:
        lv = lvl5(t)
        x, y = P(540, ly); blit(f, GLOWG, x, y, ec*1.4, 0, 0.2 + 0.4*lv)
        if t < 41.98:
            blit(f, to_sprite_cached(lv, TEX_TINY), x, y, ec)
        else:
            u = t - 41.98
            blit(f, to_sprite_cached(1.0, TEX_TINY), x, y, ec*(1 + 0.08*math.exp(-u*6)), 0, 1)
    # cachoeira de pixels entrando na logo
    if 38.0 <= t < 42.0:
        top = ly - LH_/2 + LH_*(1 - lvl5(t)) + 20
        for (t0, x0, c) in STREAM:
            u = t - t0
            if u < 0 or u > 0.6: continue
            yv = -40 + 0.5*4000*u*u
            if yv > top: continue
            px, py = P(x0 + 30*math.sin(t0*40), yv); s = 4
            cv2.rectangle(f, (int(px - s), int(py - s)), (int(px + s), int(py + s)), PIXC[c], -1)
    # bloco de 1 MB que encolhe e vira um pixel
    k = b_s(t)
    if k > 0.003 and t < 37.2:
        x, y = P(540, b_y(t)); blit(f, BLK_BIG, x, y, ec*max(k, 0.05), 6*math.sin(t*1.7), clamp(k*20))
    k = mb(t)
    if k > 0.01: x, y = P(540, 1000); blit(f, P1MB, x, y, ec*k, mix(-15, 0, min(k, 1)), clamp(k*3))
    # explosao de pixels
    if t >= 41.98:
        u = t - 41.98
        for (ang, sp, d0, c, s) in BURST5:
            uu = u - d0
            if uu < 0: continue
            x = 540 + math.cos(ang)*sp*uu; y = ly + math.sin(ang)*sp*uu + 0.5*1400*uu*uu
            if y > 2000 or x < -50 or x > 1130: continue
            px, py = P(x, y); ss = s*ec
            cv2.rectangle(f, (int(px - ss), int(py - ss)), (int(px + ss), int(py + ss)), PIXC[c], -1)
    # numero unico
    k = cnt(t)
    if k > 0.01:
        u = clamp((t - 40.0)/(41.98 - 40.0)); n = int(200000*(u**2.2)) if t < 41.98 else 200000
        txt = ("+" + fmt(n)) if t >= 41.98 else fmt(n)
        x, y = P(540, 1160); blit(f, T(txt, 170, glow=(120, 255, 140)), x, y, ec*min(k, 1.3), 0, clamp(k*3))
    return finish(f)

# ================= A6: VS (sem texto extra) =================
def a6(t):
    f = fundo(t, 1.14 - 0.12*(t - B.T6)/4.4)
    ec = 1.12 - 0.10*(t - B.T6)/4.4
    def P(x, y): return 540 + (x - 540)*ec, 960 + (y - 960)*ec
    pixels(f, t, P)
    h = B.v_hl(t)
    gx, gy = P(540, 560 + B.v_g(t)); mx, my = P(540, 1170 + B.v_m(t))
    blit(f, GLOWW, mix(gx, mx, h), mix(gy, my, h), ec*1.6, 0, 0.55)
    sg = 1 + 0.12*(1 - h) - 0.10*h; sm = 1 + 0.12*h - 0.10*(1 - h)
    blit(f, GL, gx, gy, ec*0.70*sg, 0, 1 - 0.55*h)
    am = 1 - 0.55*(1 - h)
    for (c, r) in B.PILE:
        x = 540 + c*26; y = 1110 + r*14
        px, py = P(x, y + B.v_m(t)); blit(f, BLK_S, px, py, ec*sm, 0, am)
    x, y = P(540, 1330 + B.v_m(t)); blit(f, T("200.000", 96, glow=(120, 255, 140)), x, y, ec*sm, 0, am)
    k = B.v_vs(t); x, y = P(540, 905); blit(f, T("VS", 190, glow=(255, 60, 200)), x, y, ec*k, mix(-25, -6, min(k, 1)), clamp(k*3))
    return finish(f)

# substitui as cenas na linha do tempo
REPL = {B.a1: a1, B.a2: a2, B.a3: a3, B.a4: a4, B.a5: a5, B.a6: a6}
B.TL = [("anim", it[1], it[2], REPL[it[3]]) if it[0] == "anim" else it for it in B.TL]
B.fundo = fundo

if __name__ == "__main__":
    B.render(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sub=int(sys.argv[4]) if len(sys.argv) > 4 else 3)
