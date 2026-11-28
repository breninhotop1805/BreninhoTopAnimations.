"""ROBLOX channel SFX library (NEW, written for the Roblox channel — nothing reused from the FNAF sound kit).
Cartoon / game-UI style sounds, light and clean: everything band-limited, short attacks without clicks, stereo placement,
a small room reverb on the whole bus. Usage: T = Timeline(dur); T.add(sound, t, gain, pan); T.save(path)."""
import numpy as np, wave
from scipy import signal
SR = 44100
_rng = np.random.default_rng(2026)
def tt(d): return np.arange(int(d * SR)) / SR
def fade(x, a=0.004, r=0.02):
    n = len(x); e = np.ones(n); ia, ir = max(1, int(a * SR)), max(1, int(r * SR)); e[:ia] = np.linspace(0, 1, ia) ** 1.5; e[-ir:] *= np.linspace(1, 0, ir) ** 1.5; return x * e
def bp(x, lo, hi, order=2): return signal.sosfilt(signal.butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)
def hp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'high', fs=SR, output='sos'), x)
def lp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'low', fs=SR, output='sos'), x)
def norm(x, peak=0.9): m = np.abs(x).max(); return x / m * peak if m > 0 else x
def osc(freq, d):  # freq: scalar or array (Hz) -> sine with continuous phase
    f = np.broadcast_to(freq, (int(d * SR),)).astype(float); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def sweep_noise(d, f0, f1, q=1.2, curve=1.0):
    """noise through a band-pass whose centre glides f0 -> f1 (STFT-domain, smooth)"""
    n = int(d * SR); x = _rng.standard_normal(n + 2048)
    f, t, Z = signal.stft(x, SR, nperseg=1024, noverlap=768); u = np.clip(t / d, 0, 1) ** curve; fc = f0 * (f1 / f0) ** u
    G = np.exp(-0.5 * (np.log(np.maximum(f[:, None], 1) / fc[None, :]) * q * 2) ** 2); _, y = signal.istft(Z * G, SR, nperseg=1024, noverlap=768); return y[:n]
# ---------------- movement / transitions ----------------
def whoosh(d=0.45, up=True, bright=1.0):
    y = sweep_noise(d, 350 * bright if up else 2600 * bright, 2600 * bright if up else 350 * bright, q=1.0); t = tt(d)[:len(y)]
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** (1.4 if up else 1.1); return norm(fade(y * env, 0.01, 0.05), 0.8)
def swish(d=0.22): return whoosh(d, True, 1.6)
def magic_rise(d=1.2):  # soft airy riser + shimmer partials
    y = sweep_noise(d, 800, 6000, q=0.8, curve=1.6) * np.linspace(0, 1, int(d * SR))[:int(d * SR)] ** 2
    t = tt(d); s = sum(osc(f * (1 + 0.5 * t / d), d) * 0.15 for f in (1046, 1318, 1568)) * (t / d) ** 2
    return norm(fade(y * 0.6 + s, 0.02, 0.15), 0.7)
# ---------------- cartoon ----------------
def pop(f0=420, f1=1100, d=0.09):  # bubbly "bloop" (rising)
    t = tt(d); f = f0 + (f1 - f0) * (1 - np.exp(-t / 0.018)); return norm(fade(osc(f, d) * np.exp(-t / 0.03), 0.001, 0.01), 0.8)
def blip(notes=(880, 1320), step=0.055):  # two-note UI blip
    out = np.zeros(int((step * len(notes) + 0.12) * SR))
    for i, n in enumerate(notes): d = 0.11; t = tt(d); s = (osc(n, d) + 0.3 * osc(2 * n, d)) * np.exp(-t / 0.035); i0 = int(i * step * SR); out[i0:i0 + len(s)] += fade(s, 0.001, 0.01)
    return norm(out, 0.7)
def boing(f0=210, d=0.42):  # spring: pitch wobbles around a falling centre
    t = tt(d); f = f0 * (1.6 - 0.6 * t / d) * (1 + 0.12 * np.sin(2 * np.pi * 16 * t) * np.exp(-t / 0.2))
    return norm(fade(osc(f, d) * np.exp(-t / 0.16) + 0.25 * osc(2 * f, d) * np.exp(-t / 0.08), 0.002, 0.03), 0.75)
def plop(d=0.3):  # something soft landing on a seat
    t = tt(d); body = osc(95 * (1 + 0.6 * np.exp(-t / 0.03)), d) * np.exp(-t / 0.07); air = lp(_rng.standard_normal(len(t)), 900) * np.exp(-t / 0.03) * 0.5
    return norm(fade(body + air, 0.002, 0.03), 0.8)
def fail(d=0.55):  # gentle cartoon "nope" (two falling tones, muted)
    out = np.zeros(int(d * SR))
    for i, (a, b) in enumerate([(392, 370), (330, 290)]):
        dd = 0.24; t = tt(dd); s = lp(np.sign(osc(np.linspace(a, b, len(t)), dd)) * 0.5 + osc(np.linspace(a, b, len(t)), dd), 1800) * np.exp(-t / 0.12)
        i0 = int(i * 0.2 * SR); out[i0:i0 + len(s)] += fade(s, 0.003, 0.03)
    return norm(out, 0.6)
# ---------------- bells / sparkle (celesta-like, inharmonic partials) ----------------
def celesta(f, d=0.9):
    t = tt(d); s = sum(a * osc(f * r, d) * np.exp(-t / (dc)) for r, a, dc in [(1, 1, 0.45), (2.0, 0.35, 0.18), (3.01, 0.12, 0.09), (4.2, 0.08, 0.05)])
    return fade(s, 0.0015, 0.05)
def sparkle(d=0.8, base=1568, n=9, down=False, seed=0):
    r = np.random.default_rng(seed); scale = [0, 2, 4, 7, 9, 12, 14, 16, 19]; out = np.zeros(int((d + 1.0) * SR))
    for k in range(n):
        st = scale[(n - 1 - k) if down else k] if n <= len(scale) else scale[r.integers(len(scale))]; f = base * 2 ** (st / 12) * (1 + 0.003 * r.standard_normal())
        s = celesta(f, 0.8) * (0.9 - 0.4 * k / n); i0 = int((k / n * d + 0.01 * r.random()) * SR); out[i0:i0 + len(s)] += s
    return norm(out, 0.7)
def twinkle(f=2093): a = celesta(f, 0.7); b = np.pad(celesta(f * 1.5, 0.6), (int(0.06 * SR), 0)); b = np.pad(b, (0, max(0, len(a) - len(b))))[:len(a)]; return norm(a + 0.6 * b, 0.6)
def chord_bell(notes=(784, 988, 1175, 1568), step=0.07):
    out = np.zeros(int((step * len(notes) + 1.3) * SR))
    for i, f in enumerate(notes): s = celesta(f, 1.3); i0 = int(i * step * SR); out[i0:i0 + len(s)] += s * (1 - 0.1 * i)
    return norm(out, 0.7)
# ---------------- foley ----------------
def step(kind='stone', seed=0, d=0.12):  # sneaker step: soft heel tap + scuff
    r = np.random.default_rng(seed); t = tt(d); n = r.standard_normal(len(t))
    if kind == 'stone': s = bp(n, 700, 4500) * np.exp(-t / 0.012) * 0.8 + bp(n, 150, 600) * np.exp(-t / 0.02) * 0.6
    elif kind == 'wood': s = bp(n, 250, 2500) * np.exp(-t / 0.015) + osc(140, d) * np.exp(-t / 0.025) * 0.5
    else: s = bp(n, 200, 1500) * np.exp(-t / 0.02)
    return norm(fade(s, 0.0008, 0.02), 0.7 + 0.2 * r.random())
def run_steps(n, gap, kind='stone', start_seed=0):
    out = np.zeros(int((n * gap + 0.2) * SR))
    for i in range(n): s = step(kind, start_seed + i) * (0.8 + 0.2 * (i % 2)); i0 = int(i * gap * SR); out[i0:i0 + len(s)] += s
    return out
def page_flip(d=0.32, seed=1):
    r = np.random.default_rng(seed); t = tt(d); n = r.standard_normal(len(t)); flutter = 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 23 * t + r.random() * 3))
    s = hp(bp(n, 1500, 9000), 1200) * flutter * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.8 + bp(n, 300, 1200) * np.exp(-((t - d * 0.8) / 0.02) ** 2) * 0.6
    return norm(fade(s, 0.01, 0.04), 0.7)
def scribble(d=1.2, seed=2):  # pencil on paper: short strokes
    r = np.random.default_rng(seed); t = tt(d); n = bp(r.standard_normal(len(t)), 2500, 8000); strokes = np.zeros(len(t)); x = 0.0
    while x < d: L = 0.08 + 0.12 * r.random(); a = int(x * SR); b = min(len(t), int((x + L) * SR)); strokes[a:b] = np.sin(np.pi * np.linspace(0, 1, b - a)) * (0.6 + 0.4 * r.random()); x += L + 0.03 * r.random()
    return norm(fade(n * strokes * (1 + 0.3 * np.sin(2 * np.pi * 60 * t)), 0.01, 0.05), 0.6)
def tick(hi=True):
    d = 0.05; t = tt(d); f = 3200 if hi else 2400; s = osc(f, d) * np.exp(-t / 0.006) + bp(_rng.standard_normal(len(t)), 2000, 7000) * np.exp(-t / 0.003) * 0.6; return norm(fade(s, 0.0005, 0.005), 0.6)
def clock_fast(d=2.0, rate=8):
    out = np.zeros(int((d + 0.1) * SR))
    for k in range(int(d * rate)): s = tick(k % 2 == 0); i0 = int(k / rate * SR); out[i0:i0 + len(s)] += s
    return out
def door_open(d=0.9):  # latch click + soft air swing (no horror creak)
    out = np.zeros(int(d * SR)); c = bp(_rng.standard_normal(int(0.03 * SR)), 1500, 6000) * np.exp(-tt(0.03) / 0.004); out[:len(c)] += c * 0.9
    w = whoosh(0.6, True, 0.6) * 0.5; i0 = int(0.12 * SR); out[i0:i0 + len(w)] += w[:len(out) - i0]; return norm(out, 0.7)
def school_bell(d=0.9):  # electric bell, short and soft
    t = tt(d); clap = (np.sin(2 * np.pi * 28 * t) > 0).astype(float); tone = sum(osc(f, d) * a for f, a in [(1180, 1), (2950, 0.4), (4300, 0.2)])
    return norm(fade(tone * (0.4 + 0.6 * clap) * np.minimum(1, (d - t) / 0.25), 0.005, 0.1), 0.5)
def hum(d=1.2, f=58): t = tt(d); return norm(fade((osc(f, d) + 0.5 * osc(2 * f, d) + 0.2 * osc(3 * f, d)) * (1 + 0.05 * np.sin(2 * np.pi * 3 * t)), 0.2, 0.25), 0.5)
def snore_cartoon(d=1.4):  # inhale "khhh" + exhale whistle "fiuuu" (comic)
    a = d * 0.55; t = tt(a); inh = bp(_rng.standard_normal(len(t)), 120, 900) * np.sin(np.pi * t / a) ** 1.3 * (1 + 0.6 * np.sin(2 * np.pi * 32 * t))
    b = d - a; tb = tt(b); wh = osc(np.linspace(1300, 700, len(tb)), b) * np.sin(np.pi * tb / b) ** 1.5 * 0.35 + hp(_rng.standard_normal(len(tb)), 3000) * np.sin(np.pi * tb / b) * 0.08
    return norm(np.concatenate([fade(inh, 0.05, 0.05), fade(wh, 0.03, 0.05)]), 0.7)
def big_snore(d=1.6):  # deep sleepy rumble (dragon)
    t = tt(d); r = lp(_rng.standard_normal(len(t)), 260) * (1 + 0.8 * np.sin(2 * np.pi * 24 * t)) + 0.4 * osc(55 + 10 * np.sin(np.pi * t / d), d)
    return norm(fade(r * np.sin(np.pi * t / d) ** 1.4, 0.1, 0.2), 0.6)
def birds(d=3.0, seed=5):  # light outdoor chirps
    r = np.random.default_rng(seed); out = np.zeros(int((d + 0.3) * SR)); x = 0.1
    while x < d:
        n = r.integers(2, 4); f0 = 2800 + 1400 * r.random()
        for k in range(n): cd = 0.06 + 0.03 * r.random(); tc = tt(cd); f = f0 * (1 + 0.35 * np.sin(np.pi * tc / cd)); s = osc(f, cd) * np.sin(np.pi * tc / cd) ** 2; i0 = int((x + k * 0.09) * SR); out[i0:i0 + len(s)] += s * (0.5 + 0.5 * r.random())
        x += 0.5 + 0.9 * r.random()
    return out * 0.5
def breeze(d=3.0): t = tt(d); y = sweep_noise(d, 300, 500, q=0.6); return norm(fade(y * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * t[:len(y)])), 0.5, 0.8), 0.5)
def room_tone(d=2.0, lo=120, hi=900): t = tt(d); return norm(fade(bp(_rng.standard_normal(len(t)), lo, hi) * 0.5, 0.4, 0.6), 0.35)
def cartoon_laugh(n=4, f0=560, seed=0, gap=0.12):  # kid-like "he-he-he" synthesized with formants (subtle, used low)
    r = np.random.default_rng(seed); out = np.zeros(int((n * gap + 0.25) * SR))
    for k in range(n):
        d = 0.09 + 0.02 * r.random(); t = tt(d); f = f0 * (1 - 0.04 * k) * (1 + 0.1 * np.exp(-t / 0.03)); ph = np.cumsum(f) / SR; src = (2 * (ph % 1) - 1)
        v = sum(bp(src, fc * 0.8, fc * 1.25) * a for fc, a in [(750, 1.0), (1700, 0.6), (2700, 0.25)]) + bp(r.standard_normal(len(t)), 2000, 6000) * 0.15
        i0 = int(k * gap * SR); out[i0:i0 + len(v)] += fade(v * np.sin(np.pi * t / d) ** 1.2, 0.003, 0.01)
    return norm(out, 0.6)
def crowd_laugh(d=1.8, voices=9, seed=3):  # many small laughs spread in stereo (returns L, R)
    r = np.random.default_rng(seed); L = np.zeros(int((d + 0.6) * SR)); R = L.copy()
    for v in range(voices):
        s = cartoon_laugh(int(r.integers(3, 6)), 420 + 380 * r.random(), seed + v, 0.1 + 0.04 * r.random()) * (0.5 + 0.5 * r.random()); i0 = int(r.random() * d * 0.5 * SR); p = r.random()
        L[i0:i0 + len(s)] += s * np.sqrt(1 - p); R[i0:i0 + len(s)] += s * np.sqrt(p)
    return L, R
# ---------------- timeline with stereo + reverb ----------------
class Timeline:
    def __init__(self, dur): self.N = int(dur * SR); self.L = np.zeros(self.N); self.R = np.zeros(self.N); self.dur = dur
    def add(self, s, at, gain=1.0, pan=0.0):
        if isinstance(s, tuple): self.add(s[0], at, gain, -0.9); self.add(s[1], at, gain, 0.9); return
        i = int(at * SR); j = min(self.N, i + len(s));
        if j <= i: return
        a = (pan + 1) / 2; self.L[i:j] += s[:j - i] * gain * np.sqrt(1 - a); self.R[i:j] += s[:j - i] * gain * np.sqrt(a)
    def master(self, rev=0.16):
        ir_t = tt(0.9); r = np.random.default_rng(9); irL = r.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.22); irR = r.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.22)
        irL, irR = lp(irL, 5000) / np.sqrt((irL ** 2).sum()), lp(irR, 5000) / np.sqrt((irR ** 2).sum())
        L = self.L + rev * signal.fftconvolve(self.L, irL)[:self.N]; R = self.R + rev * signal.fftconvolve(self.R, irR)[:self.N]
        return np.tanh(L * 1.1) * 0.9, np.tanh(R * 1.1) * 0.9
    def save(self, path):
        L, R = self.master(); pcm = (np.clip(np.stack([L, R], 1), -1, 1) * 32767).astype(np.int16)
        with wave.open(path, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
        return float(np.abs(np.stack([L, R])).max())
