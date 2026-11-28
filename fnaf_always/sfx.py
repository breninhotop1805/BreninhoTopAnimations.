"""Synthesizes the sound-effects track (out/sfx.wav) for the Springtrap always comes back video.
No music — narration-sync'd SFX only, per the user's request."""
import numpy as np, wave

SR = 44100; DUR = 53.88
N = int(SR * DUR); mix = np.zeros(N)
rng = np.random.default_rng(57)

def add(sig, at, gain=1.0):
    i = int(at * SR); j = min(N, i + len(sig))
    if j > i: mix[i:j] += sig[: j - i] * gain

def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)

def noise(dur): return rng.standard_normal(int(dur * SR))

def lowpass(x, a):
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x): acc += a * (v - acc); y[i] = acc
    return y

def static(dur, gain=1.0):
    n = noise(dur); n = n - lowpass(n, 0.15)
    crackle = (rng.random(len(n)) > 0.985) * rng.standard_normal(len(n)) * 3
    e = np.ones(len(n)); f = int(0.03 * SR); e[:f] = np.linspace(0, 1, f); e[-f:] = np.linspace(1, 0, f)
    return (n * 0.5 + crackle) * e * gain

def thud(f0=110, d=0.12, dur=0.35):
    n = int(dur * SR); t = np.arange(n) / SR; f = f0 * (1 + 1.5 * np.exp(-t / 0.02))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, d)
    c = noise(dur)[:n] * env(n, 0.0005, 0.008) * 0.6
    return s + c

def footstep(f0=85):
    n = int(0.18 * SR); t = np.arange(n) / SR
    s = lowpass(noise(0.18)[:n], 0.3) * env(n, 0.002, 0.05) * 1.4
    thump = np.sin(2 * np.pi * f0 * t) * env(n, 0.002, 0.05) * 0.6
    return s + thump

def boom(d=0.6, dur=1.6):
    n = int(dur * SR); t = np.arange(n) / SR; f = 55 * (1 + 2.5 * np.exp(-t / 0.05))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, d)
    nz = lowpass(noise(dur)[:n], 0.05) * env(n, 0.001, 0.25) * 2
    return s + nz

def scream(dur=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 900 - 420 * (t / dur) + 55 * np.sin(2 * np.pi * 21 * t)
    ph = np.cumsum(f) / SR
    saw = 2 * (ph * 1.0 % 1) - 1 + 0.6 * (2 * (ph * 1.51 % 1) - 1)
    s = np.tanh(3 * (saw + 0.5 * noise(dur)[:n]))
    e = np.minimum(1, t / 0.01) * np.clip(1.15 - t / dur, 0, 1)
    return s * e

def whoosh(dur=0.5, rise=True):
    n = int(dur * SR); t = np.arange(n) / SR
    x = lowpass(noise(dur)[:n], 0.08)
    f = (200 + 2200 * (t / dur)) if rise else (2400 - 2200 * (t / dur))
    mod = np.sin(2 * np.pi * np.cumsum(f) / SR)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.7
    return (x * 0.6 + mod * 0.4) * e

def bell(f, dur=0.5, d=0.3, gain=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.1)
    return s * env(n, 0.002, d) * gain

def ring(dur=0.35):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 1000 * t) + np.sin(2 * np.pi * 1200 * t)
    return s * 0.3 * (np.sin(2 * np.pi * 20 * t) > 0)

def pop_sfx():
    n = int(0.1 * SR); t = np.arange(n) / SR; f = 500 + 1400 * t / 0.1
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.035)

def heartbeat(dur=0.55):
    n = int(dur * SR)
    b1 = thud(55, 0.06, 0.18); b2 = thud(50, 0.08, 0.2)
    out = np.zeros(n); out[:len(b1)] += b1
    i2 = int(0.16 * SR); out[i2:i2 + len(b2)] += b2[: max(0, n - i2)]
    return out

# ---------- SFX timeline (matches shots.js beats) ----------
def tick(gain=1.0):
    n = int(0.03 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 3200 * t) + 0.5 * noise(0.03)[:n]) * env(n, 0.0005, 0.006) * gain

def click():
    n = int(0.05 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1800 * t) * 0.6 + noise(0.05)[:n]) * env(n, 0.0005, 0.008)

def metal_step(f0=75):
    s = footstep(f0); n = len(s); t = np.arange(n) / SR
    clank = (np.sin(2 * np.pi * 1450 * t) + 0.7 * np.sin(2 * np.pi * 2310 * t) + 0.4 * np.sin(2 * np.pi * 3170 * t)) * env(n, 0.001, 0.035) * 0.35
    return s + clank

def slam():
    b = boom(0.35, 1.0); n = len(b); t = np.arange(n) / SR
    clang = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(180, 0.5), (412, 0.35), (733, 0.25), (1190, 0.15)]) * env(n, 0.001, 0.4)
    return b + clang * 0.8

def knock():
    a = thud(140, 0.05, 0.2); b = metal_step(120) * 0.4; a[:len(b)] += b; return a

def curtain(dur=0.7):
    n = int(dur * SR); t = np.arange(n) / SR
    x = noise(dur)[:n]; x = x - lowpass(x, 0.25)
    return x * np.sin(np.pi * t / dur) ** 1.5 * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t))

def creak(dur=0.8, f0=180):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 + 60 * np.sin(2 * np.pi * 1.3 * t) + 30 * rng.standard_normal(n).cumsum() / SR * 30
    ph = np.cumsum(f) / SR; saw = 2 * (ph % 1) - 1
    pulses = (np.sin(2 * np.pi * 34 * t) > 0.3)
    return lowpass(saw * pulses, 0.2) * np.sin(np.pi * t / dur) * 1.6

def breath(dur=0.9, inhale=True):
    n = int(dur * SR); t = np.arange(n) / SR
    x = noise(dur)[:n]; x = lowpass(x, 0.12) - lowpass(x, 0.02)
    e = np.sin(np.pi * t / dur) ** (1.2 if inhale else 2.0)
    return x * e * 2.2

def mbox(notes, start, step, slow=0.0, gain=0.25):
    tt = start
    for i, f in enumerate(notes):
        add(bell(f, 0.9, 0.5, 1.0), tt, gain); add(bell(f * 2, 0.4, 0.15, 0.3), tt, gain)
        tt += step * (1 + slow * i)

def glitch(dur=0.3):
    n = int(dur * SR); t = np.arange(n) / SR
    sq = np.sign(np.sin(2 * np.pi * (rng.integers(80, 900)) * t)) * (np.sin(2 * np.pi * 37 * t) > 0)
    return (sq * 0.4 + static(dur)[:n] * 0.8) * np.minimum(1, (dur - t) / 0.02)

def sting(dur=1.2):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t + 3 * np.sin(2 * np.pi * 6 * t)) for f in [233, 247, 349, 370])
    return np.tanh(1.5 * s) * env(n, 0.003, 0.5) * 0.7

def alarm(dur=0.25, f=880):
    n = int(dur * SR); t = np.arange(n) / SR
    return np.sign(np.sin(2 * np.pi * f * t)) * 0.4 * np.minimum(1, t / 0.005) * np.minimum(1, (dur - t) / 0.01)

def hiss(dur=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = noise(dur)[:n]; x = x - lowpass(x, 0.4)
    return x * np.minimum(1, t / 0.1) * np.minimum(1, (dur - t) / 0.2)

def jump(at, low=False):
    add(scream(1.0) if not low else scream(1.0)[::1], at, 0.32 if not low else 0.25)
    add(boom(0.45, 1.2), at, 0.4); add(static(0.2), at - 0.03, 0.3)

def laugh(n=4, f0=520, gap=0.13, gain=1.0):
    out = np.zeros(int((n * gap + 0.2) * SR))
    for k in range(n):
        d = 0.1; m = int(d * SR); t = np.arange(m) / SR
        f = f0 * (1.0 - 0.06 * k) * (1 + 0.15 * np.exp(-t / 0.03))
        ph = np.cumsum(f) / SR; src = 2 * (ph % 1) - 1 + 0.3 * rng.standard_normal(m)
        v = lowpass(src, 0.35) - lowpass(src, 0.04)
        e = np.sin(np.pi * t / d) ** 1.2
        i = int(k * gap * SR); out[i:i + m] += v * e * 1.6
    return out * gain

def whir(dur=1.0, f0=90, f1=160):
    n = int(dur * SR); t = np.arange(n) / SR; f = f0 + (f1 - f0) * t / dur
    ph = np.cumsum(f) / SR; s = np.sign(np.sin(2 * np.pi * ph)) * 0.3 + np.sin(2 * np.pi * ph * 3) * 0.3
    s += 0.25 * np.sin(2 * np.pi * np.cumsum(f * 7.3) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 13 * t))
    return lowpass(s, 0.25) * np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.08)

def snap():
    n = int(0.6 * SR); t = np.arange(n) / SR
    c = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(820, 0.5), (1430, 0.4), (2210, 0.3), (3370, 0.2)]) * env(n, 0.0005, 0.12)
    return c + noise(0.6)[:n] * env(n, 0.0005, 0.01) * 1.5 + thud(70, 0.12, 0.6)[:n] * 0.8

def crackle(dur=0.5):
    n = int(dur * SR); x = (rng.random(n) > 0.992) * rng.standard_normal(n) * 3
    return lowpass(x, 0.6) * np.minimum(1, (dur - np.arange(n) / SR) / 0.05)

def chatter(dur=2.0, gain=1.0):
    out = np.zeros(int(dur * SR))
    for k in range(int(dur * 7)):
        at_ = rng.random() * (dur - 0.3); seg_ = laugh(1 + rng.integers(0, 3), 380 + rng.random() * 300, 0.12, 0.35)
        i = int(at_ * SR); j = min(len(out), i + len(seg_)); out[i:j] += seg_[: j - i]
    return out * gain

def mstep(): return metal_step(65) * 1.1

def typing(dur=1.0):
    out = np.zeros(int(dur * SR))
    for t in np.arange(0, dur - 0.05, 0.09 + 0.0): add_at = int((t + rng.random() * 0.03) * SR); c = click() * 0.5; out[add_at:add_at + len(c)] += c[: len(out) - add_at]
    return out

def slither(dur=1.0, gain=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = noise(dur)[:n]; x = lowpass(x, 0.18) - lowpass(x, 0.03)
    m = 0.5 + 0.5 * np.sin(2 * np.pi * 5.5 * t + 2 * np.sin(2 * np.pi * 1.3 * t))
    clk = (rng.random(n) > 0.996) * rng.standard_normal(n) * 1.5
    return (x * 2.4 * m + clk) * np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.15) * gain

def buzz(dur=0.6, f=110):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sign(np.sin(2 * np.pi * f * t)) * 0.4 + 0.3 * np.sin(2 * np.pi * f * 3 * t)
    s *= (0.6 + 0.4 * (rng.random(n) > 0.02))
    return lowpass(s, 0.3) * np.minimum(1, t / 0.01) * np.minimum(1, (dur - t) / 0.05)

def zap(dur=0.25):
    n = int(dur * SR); t = np.arange(n) / SR
    return (noise(dur)[:n] * 0.8 + np.sign(np.sin(2 * np.pi * 900 * t * (1 - t / dur * 0.6)))) * env(n, 0.001, 0.06)

def fire(dur=2.5):
    n = int(dur * SR); t = np.arange(n) / SR
    roar = lowpass(noise(dur)[:n], 0.04) * 2.0
    cr = crackle(dur) * 1.5
    return (roar + cr) * np.minimum(1, t / 0.3) * np.minimum(1, (dur - t) / 0.4)

def chime(dur=1.5):
    out = np.zeros(int(dur * SR))
    for k, f in enumerate([1318, 1568, 1976, 2637]):
        b = bell(f, 1.2, 0.6, 0.25); i = int(k * 0.12 * SR); j = min(len(out), i + len(b)); out[i:j] += b[: j - i]
    return out

def ding():
    return bell(1568, 0.5, 0.25, 0.5) + np.concatenate([np.zeros(int(0.08 * SR)), bell(2093, 0.42, 0.25, 0.4)])[: int(0.5 * SR)]

def wrong():
    return buzz(0.35, 140) * 0.9

def growl(dur=1.2, f0=55):
    n = int(dur * SR); t = np.arange(n) / SR; f = f0 + 8 * np.sin(2 * np.pi * 3 * t)
    s = np.tanh(2.5 * (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.6 * lowpass(noise(dur)[:n], 0.1)))
    return lowpass(s, 0.15) * np.minimum(1, t / 0.1) * np.minimum(1, (dur - t) / 0.3)

# ---------- SFX timeline (matches shots.js beats) ----------
# hook

def scratch(dur=0.18):
    n = int(dur * SR); t = np.arange(n) / SR; x = noise(dur)[:n] - lowpass(noise(dur)[:n], 0.2)
    f = 2500 + 3000 * t / dur; return x * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (dur * 0.5)) * 0.8
def boot(dur=0.8):
    n = int(dur * SR); t = np.arange(n) / SR; f = 200 + 900 * (t / dur) ** 2
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.05) * np.exp(-t / dur) * 0.6
def fireloop(dur=2.0):
    n = int(dur * SR); x = lowpass(noise(dur)[:n], 0.08) * 1.4; cr = (rng.random(n) > 0.997) * rng.standard_normal(n) * 2.5
    e = np.minimum(1, np.arange(n) / (0.2 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.3 * SR)); return (x + cr) * e
def drip(): n = int(0.18 * SR); t = np.arange(n) / SR; f = 900 + 1400 * np.exp(-t / 0.02); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.05) * 0.6
# intro: static + flicker buzz + heavy metal steps + growl + sting
add(static(0.3), 0.0, 0.2); add(buzz(2.2, 120), 0.05, 0.12); add(sting(1.4), 0.1, 0.25); add(growl(1.8, 42), 0.3, 0.3)
for t in np.arange(0.2, 2.1, 0.42): add(mstep(), t, 0.4); add(creak(0.35, 140), t + 0.12, 0.08)
add(boom(0.4, 0.9), 1.98, 0.25)
add(fireloop(2.2), 2.18, 0.35); add(whoosh(0.6, True), 2.18, 0.25); add(scream(0.7), 2.5, 0.06)
add(fireloop(1.7), 4.30, 0.35); add(creak(0.8, 100), 4.5, 0.15)
add(growl(2.6, 38), 5.8, 0.25)
for t in [6.7, 7.6, 8.5]: add(static(0.1), t, 0.2)
add(pop_sfx(), 10.1, 0.2); add(fireloop(2.5), 11.32, 0.3); add(whoosh(0.8, True), 11.3, 0.2)
add(sting(1.6), 13.9, 0.15); add(glitch(0.3), 16.4, 0.2)
for t in np.arange(16.9, 18.4, 0.45): add(footstep(110), t, 0.18)
add(creak(0.6, 160), 17.9, 0.12)
for t in np.arange(18.6, 20.2, 0.22): add(footstep(170), t, 0.1)
for t in np.arange(18.7, 20.2, 0.45): add(footstep(100), t, 0.18)
add(whir(3.2, 80, 140), 20.3, 0.15)
for t in np.arange(20.6, 23.8, 0.6): add(drip(), t, 0.25)
add(chime(1.6), 22.9, 0.25); add(bell(659, 1.4, 0.8, 0.08), 23.1, 1)
add(whir(3.5, 100, 120), 24.0, 0.1); add(chime(2.0), 24.4, 0.2)
for t in np.arange(24.3, 27.6, 0.5): add(drip(), t, 0.15)
add(heartbeat(), 28.0, 0.25); add(heartbeat(), 28.8, 0.25); add(click(), 29.3, 0.3); add(drip(), 29.6, 0.2)
add(sting(1.2), 31.4, 0.12); add(heartbeat(), 32.2, 0.3); add(boom(0.5, 1.2), 33.3, 0.28); add(glitch(0.4), 33.4, 0.2); add(whoosh(1.0, True), 33.0, 0.2)
add(creak(1.2, 90), 35.4, 0.25); add(mstep(), 36.2, 0.4); add(thud(80, 0.1), 36.7, 0.3)
add(growl(3.0, 36), 37.2, 0.3); add(heartbeat(), 38.5, 0.3); add(heartbeat(), 39.3, 0.3); add(static(0.2), 40.2, 0.12)
add(glitch(0.3), 41.2, 0.2); add(growl(1.2, 50), 41.4, 0.2)
add(fireloop(2.6), 43.6, 0.35); add(creak(1.0, 80), 44.0, 0.2); add(thud(70, 0.12), 45.3, 0.35)
add(whoosh(1.2, True), 46.3, 0.2); add(click(), 47.6, 0.3); add(static(1.2), 47.7, 0.15); add(glitch(0.4), 48.9, 0.3)
add(glitch(0.3), 49.0, 0.3); add(chime(1.4), 49.3, 0.2); add(pop_sfx(), 50.52, 0.25); add(glitch(0.15), 51.0, 0.2); add(chime(1.4), 51.8, 0.15)

t_all = np.arange(N) / SR
hum = 0.3 * np.sin(2 * np.pi * 50 * t_all) + 0.15 * np.sin(2 * np.pi * 100 * t_all)
fan = lowpass(rng.standard_normal(N) * 0.4, 0.015)
mix += hum * 0.006 + fan * 0.03
mix = np.tanh(mix * 1.15) * 0.8
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
st = np.stack([pcm, pcm], 1)
with wave.open('out/sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
print('ok', np.abs(mix).max())
