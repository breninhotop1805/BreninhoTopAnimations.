"""Synthesizes the sound-effects track (out/sfx.wav) for the "mais rapidos" video.
No music — narration-sync'd SFX only, per the user's request."""
import numpy as np, wave

SR = 44100; DUR = 58.488
N = int(SR * DUR); mix = np.zeros(N)
rng = np.random.default_rng(29)

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

# ---------- SFX timeline (matches shots.js beats) ----------
# montage
add(whoosh(0.35, True), 0.0, 0.25); [add(metal_step(80), t, 0.3) for t in [0.08, 0.22, 0.36]]
add(static(0.15), 0.56, 0.25); mbox([1047, 784], 0.62, 0.18, 0, 0.15)
add(glitch(0.25), 1.05, 0.25); add(static(0.12), 1.35, 0.2)
add(creak(0.45, 140), 1.5, 0.15); add(whoosh(0.3, True), 1.95, 0.2); add(sting(0.5), 2.0, 0.18)
add(thud(70, 0.15, 0.5), 2.38, 0.35); add(whoosh(0.4, False), 2.34, 0.2)
for t in [3.3, 3.85, 4.4]: add(heartbeat(), t, 0.4)
for i in range(8): add(tick(), 4.5 + i * 0.1, 0.35)
jump(4.62)
# Freddy CTA
for t in [5.9, 6.2, 6.5]: add(footstep(70), t, 0.45)
add(knock(), 6.68, 0.5); add(knock(), 6.9, 0.45)
add(pop_sfx(), 7.9, 0.3); add(bell(1760, 0.35, 0.2, 0.18), 7.95, 1)
add(pop_sfx(), 8.82, 0.25); add(bell(1320, 0.5, 0.3, 0.2), 8.87, 1); add(bell(1320, 0.5, 0.3, 0.12), 9.05, 1)
# FNAF 1 — Foxy
add(whoosh(0.4, True), 9.36, 0.3); add(thud(90, 0.12), 9.45, 0.35)
add(curtain(0.8), 10.55, 0.35)
for i, t in enumerate(np.arange(11.25, 13.15, 0.15)): add(metal_step(70 + (i % 2) * 8), t, 0.35 + 0.25 * (t - 11.2) / 2)
for i in range(9): add(tick(), 13.22 + i * 0.1, 0.35)
add(whoosh(0.3, True), 14.2, 0.2); add(click(), 15.08, 0.5)
add(slam(), 15.92, 0.5); for_t = [16.2, 16.38, 16.56]
for t in for_t: add(knock(), t, 0.55)
# FNAF 2 — Withered Foxy / Puppet
add(whoosh(0.4, True), 16.62, 0.3); add(thud(90, 0.12), 16.7, 0.35)
mbox([784, 988, 1175, 988, 784, 659], 17.65, 0.14, 0, 0.18)
for t in np.arange(18.5, 20.1, 0.29): add(click(), t, 0.15)                        # hall light flicker
add(alarm(0.12, 220), 20.33, 0.5); add(thud(60, 0.1), 20.33, 0.35)                 # X buzzer
for t in [21.45, 21.75]: add(footstep(80), t, 0.25)
mbox([1047, 1175, 1319, 1047, 784, 880, 988, 784, 659, 587], 23.0, 0.13, 0.12, 0.22)  # music box winding down
add(whoosh(0.3, True), 24.5, 0.35); add(static(0.15), 24.48, 0.35); add(pop_sfx(), 24.55, 0.2)
jump(25.85)
# FNAF 3 — Phantom Foxy
add(whoosh(0.4, True), 26.84, 0.3); add(thud(90, 0.12), 26.92, 0.35)
for t in [27.9, 28.25, 28.6]: add(glitch(0.15), t, 0.25)
add(static(1.0), 28.82, 0.12); add(click(), 28.85, 0.4); add(click(), 29.4, 0.4)
add(static(0.2), 29.84, 0.2); add(sting(1.0), 30.06, 0.3)
add(glitch(0.3), 31.06, 0.3); jump(31.18, low=True)
add(static(0.3), 32.4, 0.4); add(whoosh(0.35, False), 32.42, 0.3)
# FNAF 4 — Nightmarionne
add(whoosh(0.4, True), 32.98, 0.3); add(thud(90, 0.12), 33.06, 0.35)
add(sting(1.4), 34.15, 0.15)
add(creak(1.0, 160), 36.95, 0.3)
add(breath(1.0, True), 38.1, 0.5); add(breath(0.8, False), 39.0, 0.4)
for i in range(10): add(tick(), 39.0 + i * 0.1, 0.35)
add(creak(0.6, 200), 40.6, 0.25); add(slam(), 41.25, 0.35)
add(click(), 41.66, 0.6)
jump(42.4)
# SL — Yenndo
add(whoosh(0.4, True), 43.28, 0.3); add(thud(90, 0.12), 43.36, 0.35)
add(thud(50, 0.3, 0.8), 46.14, 0.4); add(click(), 46.12, 0.5)
add(static(0.3), 49.3, 0.12)
add(sting(0.8), 50.76, 0.35); add(glitch(0.15), 50.72, 0.25)
add(hiss(1.2), 52.45, 0.12)
for t in np.arange(52.5, 53.6, 0.35): add(alarm(0.15, 990), t, 0.18)
add(breath(0.6, True), 53.7, 0.4)
jump(55.12)
# outro
add(whoosh(0.4, False), 55.74, 0.25); add(pop_sfx(), 56.7, 0.3); add(bell(1568, 0.5, 0.3, 0.15), 56.75, 1)
add(bell(220, 1.4, 0.8, 0.1), 57.6, 1)

# ambient: quiet room tone (no music)
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
