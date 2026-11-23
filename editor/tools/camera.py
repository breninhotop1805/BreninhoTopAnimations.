# Motor de camera em keyframes para video vertical 1080x1920.
# Cada segmento: trecho da fonte + lista de keyframes (t, modo/escala, centro) com easing.
import json, subprocess, sys, numpy as np, cv2

W, H = 1080, 1920
FPS = 30

def ease(x):  # easeInOutCubic
    x = min(max(x, 0.0), 1.0)
    return 4*x*x*x if x < 0.5 else 1 - (-2*x + 2)**3 / 2

def interp(kfs, t):
    """kfs: lista de (t, escala, cx, cy). Interpola escala em log e centro com easing."""
    if t <= kfs[0][0]: return kfs[0][1:]
    for a, b in zip(kfs, kfs[1:]):
        if a[0] <= t <= b[0]:
            u = ease((t - a[0]) / max(b[0] - a[0], 1e-6))
            s = np.exp(np.log(a[1]) + (np.log(b[1]) - np.log(a[1])) * u)
            return s, a[2] + (b[2]-a[2])*u, a[3] + (b[3]-a[3])*u
    return kfs[-1][1:]

def read_frames(src, start, dur, sw, sh):
    cmd = ["ffmpeg", "-v", "error", "-ss", str(start), "-t", str(dur), "-i", src, "-map", "0:v:0",
           "-vf", f"fps={FPS}", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    n = sw*sh*3
    while True:
        b = p.stdout.read(n)
        if len(b) < n: break
        yield np.frombuffer(b, np.uint8).reshape(sh, sw, 3)

def render(cfg, out_video):
    src = cfg["fonte"]; sw, sh = cfg["largura"], cfg["altura"]
    # mascara da fonte: tira tarjas pretas e a area da logo do canal
    m = cfg["mascara"]  # x0,y0,x1,y1 da area util
    alpha_src = np.zeros((sh, sw), np.float32)
    alpha_src[m[1]:m[3], m[0]:m[2]] = 1.0
    alpha_src = cv2.GaussianBlur(alpha_src, (0, 0), 1.2)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24",
        "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "16",
        "-pix_fmt", "yuv420p", out_video], stdin=subprocess.PIPE)
    for seg in cfg["segmentos"]:
        kfs = seg["kf"]; punch = seg.get("punch", 0.0)
        for i, fr in enumerate(read_frames(src, seg["inicio"], seg["dur"], sw, sh)):
            t = i / FPS
            s, cx, cy = interp(kfs, t)
            if punch: s *= 1 + punch * np.exp(-t * 9)  # "soco" de zoom no inicio do corte
            # fundo: versao ampliada, desfocada e escurecida (so aparece quando a imagem nao cobre a tela)
            bs = max(W / (m[2]-m[0]), H / (m[3]-m[1])) * 1.05
            bcx, bcy = (m[0]+m[2])/2, (m[1]+m[3])/2
            small = cv2.resize(fr, (sw//4, sh//4), interpolation=cv2.INTER_AREA)
            small = cv2.GaussianBlur(small, (0, 0), 9)
            Mb = np.float32([[bs*4, 0, W/2 - bs*bcx], [0, bs*4, H/2 - bs*bcy]])
            bg = cv2.warpAffine(small, Mb, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
            bg = bg.astype(np.float32) * 0.55
            M = np.float32([[s, 0, W/2 - s*cx], [0, s, H/2 - s*cy]])
            fg = cv2.warpAffine(fr, M, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_CONSTANT)
            a = cv2.warpAffine(alpha_src, M, (W, H), flags=cv2.INTER_LINEAR, borderValue=0)[..., None]
            # sombra suave embaixo da imagem
            sh_a = cv2.GaussianBlur(a[..., 0], (0, 0), 25)[..., None] * 0.6
            out = bg * (1 - sh_a) * (1 - a) + fg.astype(np.float32) * a
            # nitidez leve (unsharp)
            blur = cv2.GaussianBlur(out, (0, 0), 1.0)
            out = cv2.addWeighted(out, 1.35, blur, -0.35, 0)
            # fades de entrada/saida do segmento
            fi, fo = seg.get("fade_in", 0), seg.get("fade_out", 0)
            k = 1.0
            if fi and t < fi: k = min(k, t / fi)
            if fo and t > seg["dur"] - fo: k = min(k, (seg["dur"] - t) / fo)
            out = np.clip(out * k, 0, 255).astype(np.uint8)
            enc.stdin.write(out.tobytes())
    enc.stdin.close(); enc.wait()

if __name__ == "__main__":
    cfg = json.load(open(sys.argv[1]))
    render(cfg, sys.argv[2])
