# Video 2 (v6): uma cena por frase, animacoes de interface SOBRE o fundo synthwave.
import sys, math, numpy as np, cv2
V5 = "/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad/v5"
sys.path.insert(0, V5)
import montar_v5 as M
from montar_v5 import *
import intro_v4 as I4

CEN = I4.CEN
def fundo(t, dolly=1.0):
    f = CEN.frame(t, dolly)
    return f
def finish(f, t):
    br = np.clip(f - 0.75, 0, None); f = f + cv2.GaussianBlur(br, (0, 0), 18)*0.7
    ang = 0.9*math.sin(t*0.7 + 0.9)
    return np.clip(cv2.warpAffine(f, cv2.getRotationMatrix2D((W/2, H/2), ang, 1.035), (W, H), borderMode=cv2.BORDER_REFLECT), 0, 1)

def soft_dof(f, fy, r0=260, r1=520):
    b = cv2.GaussianBlur(f, (0, 0), 6)
    m = np.clip((np.abs(yyH - fy) - r0)/r1, 0, 1)[..., None]
    return f*(1 - m) + b*m

# ===== U1: download do GTA VI sobre o synthwave (8.06 -> 10.34) =====
def u1(t):
    f = fundo(t, 1 + 0.15*(t - 8.06)/2.3)
    gb = 212*e_out(clamp((t - 8.10)/1.0)); left = max(1, int(83 - 70*clamp((t - 8.1)/2.2)))
    spr = card("Grand Theft Auto VI", "Baixando...", GTA_ICON, w=980, bar=gb/212*0.995, bar_col=(235, 235, 240),
               right=f"{fmt_br(gb, 1)} GB / 212 GB")
    z = 1.0 + 0.10*clamp((t - 8.06)/2.3); k = step(t, 8.06, 130, 16)
    blit(f, spr, 540, 760 + 140*(1 - k), z/SC, 0, clamp(k*3))
    return finish(soft_dof(f, 760), t)

# ===== U2: armazenamento (15.33 -> 17.57) =====
def u2(t):
    f = fundo(t, 1 + 0.12*(t - 15.33)/2.2)
    kG = step(t, 15.33, 140, 17); kM = step(t, 15.85, 140, 17); z = 1.0 + 0.08*clamp((t - 15.33)/2.2)
    sG = card("Grand Theft Auto VI", "Jogo", GTA_ICON, w=960, bar=1.0, bar_col=(235, 235, 240), right="212 GB")
    sM = card("Minecraft", "Jogo", MC_ICON, w=960, bar=0.006, bar_col=(110, 220, 120), right="1 GB")
    blit(f, sG, 540 + 200*(1 - kG), 700, z/SC, 0, clamp(kG*3))
    blit(f, sM, 540 + 260*(1 - kM), 960, z/SC, 0, clamp(kM*3))
    return finish(soft_dof(f, 830, 320), t)

# ===== U3: 212 Minecrafts enchendo a biblioteca do GTA (17.57 -> 22.03) =====
COLS = 18; ROWS = 12; T0, T1 = 18.55, 21.05
GRID = [(i % COLS, i//COLS) for i in range(212)]
FR = None
def u3(t):
    global FR
    f = fundo(t, 1 + 0.15*(t - 17.57)/4.5)
    kp = step(t, 17.57, 160, 16)
    # painel escuro translucido = "o espaco do GTA VI"
    x0, y0, x1, y1 = 40, 560, 1040, 560 + ROWS*56 + 34
    if FR is None:
        FR = np.zeros((y1 - y0, x1 - x0, 4), np.float32); FR[..., 3] = 0.72; FR[..., :3] = np.array([0.08, 0.05, 0.06])*0.72
        cv2.rectangle(FR, (0, 0), (x1 - x0 - 1, y1 - y0 - 1), (0.75, 0.35, 0.95, 1.0), 3)
    blit(f, FR, 540, (y0 + y1)/2 + 120*(1 - kp), 1.0, 0, clamp(kp*3))
    blit(f, GL_S, 540, 480 + 120*(1 - kp), 1.0, 0, clamp(kp*3))
    for i, (c, r) in enumerate(GRID):
        ti = T0 + (T1 - T0)*(i/len(GRID))**1.1; k = step(t, ti, 420, 22)
        if k <= 0.01: continue
        blit(f, ICO, 72 + c*56, 590 + r*56, k*0.42, 0, clamp(k*3))
    n = min(212, int(round(212*clamp((t - T0)/(T1 - T0))**0.9)))
    kc = step(t, 18.40, 200, 16)
    if kc > 0.01: blit(f, pill(max(n, 1), icon_mc(160)), 540, 1330, 0.55*kc*(1 + 0.08*math.exp(-max(0, t - T1)*9)*(t > T1)), 0, clamp(kc*3))
    return finish(f, t)

# ===== U4: Minecraft Classic baixa na hora (34.45 -> 36.19) =====
def u4(t):
    f = fundo(t, 1 + 0.12*(t - 34.45)/1.7)
    p = e_out(clamp((t - 34.95)/0.30)); done = t >= 35.25
    spr = card("Minecraft Classic (2009)", "Concluído" if done else "Baixando...", MCC_ICON, w=980, bar=p, bar_col=(110, 220, 120),
               right=f"{fmt_br(0.9*p, 1)} MB / 0,9 MB")
    k = step(t, 34.45, 130, 16); z = 1.0 + 0.08*clamp((t - 34.45)/1.7)
    blit(f, spr, 540, 800 + 140*(1 - k), z/SC, 0, clamp(k*3))
    if done:
        if M.CHECK is None: M.u4(35.3)
        kc = step(t, 35.25, 380, 15); blit(f, M.CHECK, 540, 560, kc, mix(-25, 0, min(kc, 1)), clamp(kc*3))
    return finish(soft_dof(f, 760), t)

# ===== U5: contador ate 200 mil (39.46 -> 44.28) =====
GLB = load_sprite(f"{KIT}/assets/logos/gta6-logo.png", 560)
GL_S = load_sprite(f"{KIT}/assets/logos/gta6-logo.png", 200)
def u5(t):
    f = fundo(t, 1 + 0.18*(t - 39.46)/4.8)
    kl = step(t, 39.46, 120, 15)
    blit(f, GLB, 540, 640 + 160*(1 - kl), 1.0 + 0.05*(t - 39.46)/4.8, 0, clamp(kl*3))
    u = clamp((t - 39.90)/(41.98 - 39.90)); n = 200000 if t >= 41.98 else int(200000*u**2.4)
    kc = step(t, 39.80, 200, 16)
    s = 0.62*(1 + 0.15*math.exp(-max(0, t - 41.98)*8)*(t >= 41.98))
    if kc > 0.01: blit(f, pill(max(n, 1), icon_mc(160), w=560), 540, 1080, s*kc, 0, clamp(kc*3))
    return finish(f, t)

# ---------- linha do tempo: uma cena por frase ----------
TL = [
    C(0.00, 1.30, SHA, 113.0, "full", 1.05, 1.22),                 # Quantos Minecrafts
    C(1.30, 3.54, GTA, 93785.0, "full", 1.22, 1.05),                # cabem dentro de um unico GTA 6?
    C(3.54, 6.56, BSL, 32.0, "box", 1.00, 1.25),                    # e o numero... vai bugar a sua mente
    C(6.56, 8.06, GTA, 95883.0, "box", 1.00, 1.22),                 # Hoje o GTA 6 chegou pedindo
    A(8.06, 10.34, u1),                                             # 212 gigas do seu console
    C(10.34, 12.20, GTA, 69898.5, "box", 1.28, 1.00),               # simplesmente o jogo mais pesado
    C(12.20, 13.73, GTA, 70198.5, "box", 1.00, 1.22),               # da historia dos videogames
    C(13.73, 15.33, TRA, 12.6, "box", 1.00, 1.22),                  # O Minecraft de hoje, com tudo
    A(15.33, 17.57, u2),                                            # instalado, tem por volta de 1 giga
    A(17.57, 22.03, u3),                                            # cabem uns 212 Minecrafts dentro do GTA 6
    SP(22.03, 25.57, (SHA, 50.0), (GTA, 69661.0)),                  # 212 mundos infinitos dentro de uma cidade so
    C(25.57, 27.99, SHA, 43.0, "box", 1.25, 1.00),                  # Parece muito, ne? Mas isso nao e nada
    C(27.99, 30.27, SHA, 22.0, "box", 1.00, 1.22),                  # Porque o Minecraft nao nasceu desse tamanho
    C(30.27, 32.41, PRE, 143.0, "box", 1.00, 1.22, box_w=1240),     # Em 2009, a primeira versao do jogo era so
    C(32.41, 33.43, PRE, 13.0, "box", 1.00, 1.20, box_w=1240),      # grama, pedra
    C(33.43, 34.45, PRE, 0.0, "box", 1.00, 2.10, c0=(320, 260), c1=(190, 175), box_w=1240, ease=True),   # e um Steve parado
    A(34.45, 36.19, u4),                                            # E ela tinha menos de 1 mega
    C(36.19, 39.46, PRE, 136.0, "box", 1.22, 1.00, box_w=1240),     # Agora refaz a conta comigo. Se cada Minecraft tem menos de 1 mega
    A(39.46, 44.28, u5),                                            # dentro de um unico GTA 6 cabem mais de 200 mil
    C(44.28, 46.24, PRE, 110.9, "box", 1.25, 1.00, box_w=1240),     # E o mais bizarro e que esse joguinho com esse tamanho
    C(46.24, 48.48, TRA, 24.0, "box", 1.00, 1.22),                  # virou o mais vendido da historia
    SP(48.48, 52.90, (GTA, 95884.0), (SHA, 6.3)),                   # levava um GTA 6 ou 200 mil Minecrafts?
    C(52.90, TOTAL, SHA, 105.5, "box", 1.00, 1.18),                 # Comenta ai
]
M.TL = TL
M.B.ZOOM_OUT = 26.71
if __name__ == "__main__":
    M.render(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]))
