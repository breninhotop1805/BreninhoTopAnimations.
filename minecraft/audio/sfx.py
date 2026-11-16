# Efeitos sonoros sintetizados (sem música) + mixagem proporcional à narração.
# Saídas: audio/sfx.wav, audio/mix_completo.wav, audio/mix_so_narracao.wav
import numpy as np, subprocess, json, sys, os
from scipy.signal import butter, sosfilt, fftconvolve
SR = 48000
DUR = 62.2
rng = np.random.default_rng(7)
HERE = os.path.dirname(os.path.abspath(__file__))

def t_(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def env(n, a=0.005, d=0.2, shape=1.0):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4)); return e ** shape
def norm(x): m = np.max(np.abs(x)) + 1e-9; return x / m
def sweep_bp(x, f0, f1, q=1.2, steps=24):
    out = np.zeros_like(x); n = len(x); seg = n // steps + 1
    for i in range(steps):
        a, b = i * seg, min(n, (i + 1) * seg + seg // 2)
        if a >= n: break
        f = f0 * (f1 / f0) ** (i / (steps - 1)); lo, hi = f / (1 + 1 / q), min(f * (1 + 1 / q), SR / 2 - 100)
        y = bp(x[max(0, a - seg):b], lo, hi)[(a - max(0, a - seg)):]
        w = np.ones(b - a); fade = min(seg // 2, len(w))
        w[:fade] = np.linspace(0, 1, fade) if i else 1; w[-fade:] = np.minimum(w[-fade:], np.linspace(1, 0, fade)) if i < steps - 1 else w[-fade:]
        out[a:b] += y[:b - a] * w
    return out
def reverb(x, rt=0.8, wet=0.25):
    ir = rng.standard_normal(int(rt * SR)) * np.exp(-np.arange(int(rt * SR)) / SR * 6.9 / rt); ir = lp(ir, 5000)
    y = fftconvolve(x, ir)[:len(x) + len(ir) - 1]; y = y / (np.max(np.abs(y)) + 1e-9) * np.max(np.abs(x))
    out = np.zeros(len(y)); out[:len(x)] += x * (1 - wet); out += y * wet; return out

# ---------------------------------------------------------------- sons
def whoosh(d=0.6, f0=300, f1=2500, rise=0.6):
    x = sweep_bp(noise(d), f0, f1); n = len(x); t = np.arange(n) / n
    e = np.where(t < rise, (t / rise) ** 2, ((1 - t) / (1 - rise)) ** 1.5); return norm(x * e)
def thump(f=70, d=0.35, drop=0.5):
    t = t_(d); ph = 2 * np.pi * np.cumsum(f * (1 - drop * np.minimum(1, t / d))) / SR
    return norm(np.sin(ph) * env(len(t), 0.002, d / 4) + lp(noise(d), 300) * env(len(t), 0.001, 0.02) * 0.4)
def block_place(seed=0):
    d = 0.16; x = bp(noise(d), 250, 2200) * env(int(d * SR), 0.001, 0.025) + thump(140 + seed * 7, d, 0.3) * 0.5
    return norm(x)
def step(kind='stone'):
    d = 0.12; lo, hi = (180, 1600) if kind == 'stone' else (300, 3500)
    x = bp(noise(d), lo, hi) * env(int(d * SR), 0.002, 0.03)
    clicks = np.zeros(int(d * SR)); idx = rng.integers(0, len(clicks) // 2, 6); clicks[idx] = rng.uniform(-1, 1, 6); x += hp(clicks, 1500) * 2
    return norm(x)
def hit():
    d = 0.25; x = bp(noise(d), 300, 3000) * env(int(d * SR), 0.001, 0.03) + thump(95, d, 0.5) * 0.8
    return norm(x)
def swing(): return whoosh(0.22, 900, 4000, 0.45)
def explosion():
    d = 2.2; t = t_(d); n = len(t)
    body = lp(noise(d), 900) * env(n, 0.005, 0.45); sub = np.sin(2 * np.pi * np.cumsum(55 * np.exp(-t * 1.5) + 25) / SR) * env(n, 0.003, 0.5)
    crack = hp(noise(d), 2500) * env(n, 0.001, 0.06) * 0.5
    return norm(reverb(body + sub * 0.9 + crack, 1.2, 0.3))
def groan(f=105, d=0.75, baby=False):
    t = t_(d); vib = 1 + 0.04 * np.sin(2 * np.pi * 5.5 * t); fr = f * vib * (1 + 0.15 * np.sin(np.pi * t / d))
    ph = 2 * np.pi * np.cumsum(fr) / SR; saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    x = bp(saw, 350, 900) + bp(saw, 1000, 1600) * 0.5 + bp(noise(d), 300, 1200) * 0.15
    e = np.sin(np.pi * np.minimum(1, t / d)) ** 0.8; return norm(x * e)
def hiss(d=0.9):
    x = hp(noise(d), 2500); n = len(x); e = np.linspace(0.2, 1, n) ** 1.5; e[-int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR)); return norm(x * e)
def heartbeat():
    a = thump(55, 0.22, 0.4); b = thump(50, 0.25, 0.4) * 0.75; out = np.zeros(int(0.6 * SR)); out[:len(a)] += a; s = int(0.19 * SR); out[s:s + len(b)] += b; return norm(lp(out, 200))
def chime(f=1320):
    d = 1.6; t = t_(d); x = sum(np.sin(2 * np.pi * f * k * t + k) * (0.6 ** i) for i, k in enumerate([1, 1.5, 2, 3.01]))
    x *= env(len(t), 0.003, 0.5) * (1 + 0.1 * np.sin(2 * np.pi * 7 * t)); return norm(reverb(x, 1.0, 0.3))
def drip():
    d = 0.25; t = t_(d); f = 900 + 900 * np.minimum(1, t / 0.03); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.001, 0.04)
    return norm(reverb(x, 1.4, 0.45))
def roar(f=72, d=1.2, deep=False):
    t = t_(d); fr = f * (1 + 0.25 * np.sin(np.pi * t / d)) * (1 + 0.03 * np.sin(2 * np.pi * 9 * t))
    ph = 2 * np.pi * np.cumsum(fr) / SR; saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    x = np.tanh(3 * (saw + 0.6 * lp(noise(d), 1500))) ; x = lp(x, 900 if deep else 1500) + bp(x, 400, 800) * 0.6
    e = np.minimum(1, t / 0.08) * np.exp(-np.maximum(0, t - 0.5 * d) / (0.25 * d)); return norm(reverb(x * e, 1.3, 0.3))
def flap(): d = 0.4; return norm(lp(noise(d), 450) * env(int(d * SR), 0.06, 0.08, 1.2))
def poof(): d = 0.35; return norm(lp(noise(d), 1100) * env(int(d * SR), 0.01, 0.08))
def pop(f=900): d = 0.09; t = t_(d); return norm(np.sin(2 * np.pi * np.cumsum(f + 600 * t / d) / SR) * env(len(t), 0.002, 0.03))
def sting():
    d = 1.1; t = t_(d); x = sum(np.sign(np.sin(2 * np.pi * f * t)) * 0.3 for f in [233, 247, 349, 370]); x = lp(x, 2500)
    h = hit(); x = x * env(len(t), 0.004, 0.25); x[:len(h)] += h * 0.6
    return norm(reverb(x, 1.0, 0.35))
def drone(d, f=55):
    t = t_(d); x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.498 * t) + 0.3 * lp(noise(d), 180)
    x *= 0.7 + 0.3 * np.sin(2 * np.pi * 0.25 * t); fade = int(0.4 * SR); x[:fade] *= np.linspace(0, 1, fade); x[-fade:] *= np.linspace(1, 0, fade); return norm(x)
def wind(d):
    x = lp(noise(d), 700) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.3 * t_(d) + 1)); fade = int(0.3 * SR); x[:fade] *= np.linspace(0, 1, fade); x[-fade:] *= np.linspace(1, 0, fade); return norm(x)
def birds(d):
    out = np.zeros(int(d * SR))
    for _ in range(int(d * 3)):
        s = rng.integers(0, max(1, len(out) - int(0.15 * SR))); dd = 0.06 + rng.random() * 0.06; t = t_(dd); f0 = 3000 + rng.random() * 1800
        c = np.sin(2 * np.pi * np.cumsum(f0 + 1500 * np.sin(np.pi * t / dd)) / SR) * env(len(t), 0.005, dd / 3); out[s:s + len(c)] += c * rng.uniform(0.4, 1)
    return norm(out)
def crumble():
    d = 0.18; x = bp(noise(d), 400, 4000) * env(int(d * SR), 0.001, 0.04); clicks = np.zeros(int(d * SR)); idx = rng.integers(0, len(clicks), 14); clicks[idx] = rng.uniform(-1, 1, 14)
    return norm(x + hp(clicks, 800) * 3)
def web():
    d = 0.35; x = bp(noise(d), 1200, 5000) * env(int(d * SR), 0.01, 0.1); return norm(x * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 37 * t_(d)))))
def rustle(d=0.5): return norm(bp(noise(d), 800, 4500) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 3 * t_(d)))) * env(int(d * SR), 0.05, d / 2))
def tick(): d = 0.03; return norm(hp(noise(d), 3000) * env(int(d * SR), 0.0005, 0.005))
def sizzle(d=1.4): return norm(hp(noise(d), 3500) * (0.3 + 0.7 * np.abs(rng.standard_normal(int(d * SR))) ** 4) * env(int(d * SR), 0.2, d / 2))

# ---------------------------------------------------------------- cues
# (tempo, som, ganho dB, grupo)  — grupo 'bruto' leva -4 dB extra
C = []
def cue(t, snd, db=0, brute=False, cave=False): C.append((t, snd, db - (4 if brute else 0), cave))
# 01–03 superfície
cue(0.00, whoosh(0.9, 200, 1800, 0.55), -2)
cue(0.05, wind(3.6), -10)
cue(0.6, birds(3.0), -14)
for k in range(10): cue(1.22 + k * 0.118, tick(), -12)
cue(1.20, whoosh(1.1, 400, 3000, 0.5), -8)
cue(2.40, whoosh(1.2, 150, 900, 0.5), -7)
# 04 construindo: um "toc" por bloco
for i in range(9): cue(3.68 + i * 0.13 + 0.02, block_place(i), -3)
cue(4.88, thump(48, 0.9, 0.6), -2, brute=True)
cue(4.9, whoosh(0.8, 120, 700, 0.3), -8)
# 06–07 noite
cue(5.68, wind(2.0), -12)
cue(5.78, groan(98, 0.8), -5)
cue(6.30, hiss(0.9), -9)
cue(6.82, swing(), -2)
cue(6.98, hit(), -1)
cue(7.16, explosion(), 0, brute=True)
# 08–10 regra cruel / uma vida
cue(7.92, pop(800), -8)
cue(8.64, whoosh(0.35, 600, 3000, 0.7), -6)
cue(8.66, heartbeat(), -3)
cue(9.92, heartbeat(), -1)
cue(10.54, heartbeat(), -1)
cue(11.16, heartbeat(), -6)
# 11–13 lenda
cue(11.2, wind(1.6), -12)
cue(11.85, whoosh(0.4, 1500, 5000, 0.6), -6)
cue(12.05, chime(1568), -8)                     # chime 1/3 (espada erguida)
cue(12.80, whoosh(1.0, 250, 1200, 0.5), -10)
cue(14.00, groan(92, 0.7), -5)
cue(14.30, hit(), -4)
cue(14.52, swing(), -2)
cue(14.72, hit(), 0)
cue(15.27, poof(), -6)
# 14 mergulho
cue(15.36, whoosh(0.75, 2500, 150, 0.4), -2)
# 15–19 caverna
cue(15.9, drone(8.0, 49), -10, brute=True, cave=True)
for k in range(12): cue(16.0 + 0.2 + k * 0.403, step('stone'), -9, cave=True)
cue(16.6, drip(), -8, cave=True); cue(17.9, drip(), -9, cave=True)
cue(18.32, step('stone'), -10, cave=True)
cue(18.9, heartbeat(), -4)
cue(19.20, pop(1100), -6); cue(19.21, hit(), -9)
cue(19.92, whoosh(0.5, 200, 1500, 0.5), -6)
cue(20.02, flap(), -4); cue(20.72, flap(), -4)
cue(21.04, roar(70, 1.1), -2, brute=True)
cue(21.46, heartbeat(), -2)
cue(22.05, roar(46, 1.0, deep=True), -1, brute=True)
cue(22.64, drone(3.0, 41), -8, brute=True, cave=True)
cue(23.30, chime(1760), -12)                    # chime 2/3 (brilho no escuro)
for k in range(5): cue(23.86 + k * 0.08, step('gravel'), -8, cave=True)
cue(24.22, whoosh(0.35, 500, 3500, 0.5), -3)
cue(24.62, step('stone'), -4, cave=True)
cue(24.72, sting(), -3)
cue(25.2, heartbeat(), -6)
cue(26.68, groan(210, 0.5), -6, cave=True)
for k in range(10): cue(28.58 + k * 0.105, step('gravel'), -9, cave=True)
cue(28.6, whoosh(0.9, 400, 2500, 0.3), -8)
cue(29.95, chime(2093), -10)                    # chime 3/3 (armadura de ouro)
cue(30.96, sizzle(1.0), -14)
# 27–30 os golpes
for k in range(5): cue(32.75 + k * 0.09, step('gravel'), -9, cave=True)
for tt in [33.2, 34.48, 35.52, 36.08, 38.7]: cue(tt, hit(), 0)
cue(33.25, groan(200, 0.4), -9, cave=True)
for k in range(6): cue(36.5 + k * 0.23, heartbeat()[: int(0.3 * SR)], -6)
for k in range(4): cue(37.86 + k * 0.42 + 0.06, swing(), -4)
# 31–33 teia
cue(39.9, step('stone'), -6, cave=True)
cue(40.08, web(), -3)
cue(40.6, rustle(0.6), -8); cue(41.25, rustle(0.5), -9)
cue(41.6, whoosh(0.6, 1200, 200, 0.2), -6)
cue(41.65, drone(2.4, 37), -6, brute=True, cave=True)
# 34–36 o fim
for k in range(4): cue(42.3 + k * 0.4, step('gravel'), -9, cave=True)
cue(43.9, heartbeat(), -3); cue(44.75, heartbeat(), -5)
cue(45.32, whoosh(0.3, 600, 3000, 0.6), -5)
cue(45.60, hit(), 2)
cue(45.62, thump(60, 0.5, 0.5), -2, brute=True)
cue(46.02, thump(90, 0.3, 0.4), -6)
cue(46.28, poof(), -3)
# 37–40 silêncio e tela de morte
cue(48.4, drone(3.9, 41), -11, brute=True)
cue(51.44, thump(44, 1.3, 0.3), -4, brute=True)
cue(51.46, chime(523), -14)
# 41–43 o império apagado
cue(53.36, wind(3.9), -11)
cue(53.5, birds(1.6), -16)
for k in range(13): cue(55.12 + k * 0.12, crumble(), -6 - (k % 3))
cue(55.15, thump(40, 1.6, 0.3), -5, brute=True)
cue(57.2, whoosh(0.25, 300, 1500, 0.7), -8); cue(57.42, thump(70, 0.2, 0.3), -6)
# 44–45 final
cue(58.4, drone(3.6, 49), -11, brute=True, cave=True)
cue(59.0, groan(205, 0.5), -7, cave=True)
cue(60.56, whoosh(0.3, 500, 3000, 0.7), -4)
cue(60.98, step('stone'), -6, cave=True); cue(61.3, step('stone'), -8, cave=True)
cue(61.05, thump(52, 0.9, 0.4), -6, brute=True)

def build():
    n = int(DUR * SR); out = np.zeros(n + SR * 3)
    for t, snd, db, cave in C:
        x = reverb(snd, 1.1, 0.22) if cave else snd
        s = int(t * SR); out[s:s + len(x)] += x * 10 ** (db / 20)
    return out[:n]

def load_voice():
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(HERE, 'narracao.mp3'), '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True)
    v = np.frombuffer(p.stdout, np.float32).astype(np.float64); out = np.zeros(int(DUR * SR)); out[:min(len(v), len(out))] = v[:len(out)]; return out

def active_db(x, thr=-45):
    f = x[:len(x) // 2400 * 2400].reshape(-1, 2400); r = np.sqrt((f ** 2).mean(1)); d = 20 * np.log10(r + 1e-12); a = d[d > thr]
    return 10 * np.log10(np.mean(10 ** (a / 10))) if len(a) else -99

def write(path, x):
    x = np.clip(x, -1, 1); st = np.stack([x, x], 1); pcm = (st * 32767).astype(np.int16).tobytes()
    import wave; w = wave.open(path, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm); w.close()

if __name__ == '__main__':
    voice = load_voice(); sfx = build()
    vdb = active_db(voice, -35); target = vdb - 16.0
    sdb = active_db(sfx, active_db(sfx) - 30); g = 10 ** ((target - sdb) / 20); sfx *= g
    # nenhum efeito acima de (voz - 6 dB) de pico
    pk = np.max(np.abs(sfx)); vpk = np.max(np.abs(voice)); lim = vpk * 10 ** (-6 / 20)
    if pk > lim: sfx = np.tanh(sfx / lim) * lim
    mix = voice + sfx; m = np.max(np.abs(mix)); mix = mix / m * 0.97 if m > 0.97 else mix
    write(os.path.join(HERE, 'sfx.wav'), sfx); write(os.path.join(HERE, 'mix_completo.wav'), mix); write(os.path.join(HERE, 'mix_so_narracao.wav'), voice)
    rep = {'voz_dB': round(vdb, 1), 'efeitos_dB': round(active_db(sfx, active_db(sfx) - 30), 1), 'diferenca_dB': round(vdb - active_db(sfx, active_db(sfx) - 30), 1), 'cues': len(C)}
    print(json.dumps(rep, ensure_ascii=False)); json.dump(rep, open(os.path.join(HERE, 'mix_report.json'), 'w'), ensure_ascii=False)
