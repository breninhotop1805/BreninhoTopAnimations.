"""Synthesizes the sound-effects track (out/sfx.wav) for the Springtrap video.
No music — narration-sync'd SFX only, per the user's request."""
import numpy as np, wave

SR = 44100; DUR = 68.376
N = int(SR * DUR); mix = np.zeros(N)
rng = np.random.default_rng(41)

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

def load_wav(p):
    with wave.open(p) as w: a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
    return a / np.abs(a).max()
BB = [load_wav(f'assets/bb/bb{i}.wav') for i in range(5)]   # 0 'hi', 1 'hello', 2-4 laughs (Balloon Boy's real voice clips)
def bb(i, at, gain=0.42): add(BB[i], at, gain)

# ---------- SFX timeline (matches shots.js beats) ----------
# hook
for t in np.arange(0.15, 1.5, 0.55): add(mstep(), t, 0.35)
add(static(0.2), 0.0, 0.3); add(whir(0.5, 70, 110), 0.8, 0.12)
add(sting(0.9), 1.55, 0.18); add(creak(0.5, 150), 1.9, 0.18)
for t in np.arange(2.8, 3.8, 0.55): add(mstep(), t, 0.3)
bb(2, 2.95)
add(glitch(0.12), 4.25, 0.15)
add(whoosh(0.4, True), 4.6, 0.3); add(thud(90, 0.12), 4.7, 0.35)
# theory
add(static(1.6), 5.75, 0.05); add(typing(0.9), 5.9, 0.4); add(whoosh(0.3, True), 6.6, 0.15)
add(creak(1.2, 120), 7.6, 0.2); add(breath(1.0, False), 8.0, 0.3)
add(glitch(0.2), 9.14, 0.3); add(sting(1.2), 9.2, 0.25); add(static(0.15), 10.1, 0.4); add(static(0.1), 10.65, 0.35); add(heartbeat(), 9.6, 0.3)
for t in np.arange(11.05, 13.1, 0.42): add(mstep(), t, 0.32)
bb(1, 11.5, 0.32)
add(boom(0.4, 1.0), 13.18, 0.3); add(static(0.15), 13.18, 0.35); add(pop_sfx(), 13.55, 0.3)
# Afton knows
add(whoosh(0.35, True), 15.15, 0.2); add(crackle(1.4), 15.3, 0.5)
for t in [15.5, 15.9, 16.3, 16.75]: add(click(), t, 0.25)
add(chatter(1.6, 0.25), 17.4, 1); add(whoosh(0.5, True), 17.35, 0.2)
add(sting(0.6), 19.3, 0.12)
add(click(), 20.6, 0.5); bb(3, 20.85, 0.36)
# question
add(heartbeat(), 22.9, 0.35); add(heartbeat(), 23.55, 0.35); add(whir(0.5, 60, 90), 24.2, 0.12)
bb(4, 25.0); add(static(0.2), 25.0, 0.1); add(creak(0.4, 170), 25.9, 0.2)
add(click(), 26.75, 0.3); bb(0, 26.95, 0.32); add(click(), 27.7, 0.3)
for t in [28.15, 28.45]: add(mstep(), t, 0.3)
add(scream(0.9), 28.68, 0.3); add(boom(0.45, 1.2), 28.68, 0.4); add(static(0.2), 28.65, 0.3)
# real answer
for t in [29.5, 30.1, 30.7]: add(heartbeat(), t, 0.4)
add(sting(1.5), 31.5, 0.15); add(whir(1.4, 80, 140), 33.7, 0.25); add(alarm(0.1, 1200), 34.2, 0.1); add(alarm(0.1, 1200), 34.5, 0.1)
# golden era
add(chatter(3.3, 0.35), 35.86, 1); mbox([784, 988, 1175, 1319, 1175, 988], 35.95, 0.22, 0, 0.12)
add(chatter(1.5, 0.25), 37.42, 1); add(click(), 39.05, 0.6); add(whir(0.7, 90, 220), 39.1, 0.35); add(alarm(0.12, 1500), 39.08, 0.2)
for i, t in enumerate(np.arange(40.4, 43.2, 0.5)): add(mstep(), t, 0.35); add(whir(0.25, 120, 160), t, 0.12)
add(chatter(2.3, 0.45), 43.25, 1); add(whir(0.3, 140, 260), 44.5, 0.3); add(alarm(0.1, 1300), 44.5, 0.15)
add(chatter(3.4, 0.35), 45.6, 1); add(bell(1568, 0.5, 0.3, 0.12), 46.2, 1)
# still active
add(whoosh(0.5, False), 49.05, 0.3); add(thud(60, 0.2, 0.6), 49.55, 0.45); add(click(), 49.55, 0.3)
add(whir(1.8, 100, 140), 50.5, 0.3); add(alarm(0.1, 1200), 50.6, 0.12); add(alarm(0.1, 1200), 51.1, 0.12)
add(click(), 52.95, 0.7); bb(2, 53.05, 0.36)
add(breath(0.6, True), 53.7, 0.4); add(whir(0.8, 80, 150), 54.3, 0.25)
add(thud(70, 0.2), 55.6, 0.4); add(whir(2.0, 90, 200), 55.6, 0.4)
for t in np.arange(55.7, 57.7, 0.4): add(mstep(), t, 0.3)
for t in np.arange(57.8, 59.5, 0.38): add(mstep(), t, 0.4); add(whir(0.25, 140, 170), t, 0.15)
add(breath(0.8, True), 58.0, 0.45); bb(1, 58.3, 0.3)
add(crackle(1.8), 59.6, 0.6); add(breath(0.7, False), 59.7, 0.45); add(whir(1.8, 120, 90), 59.6, 0.3)
for t in [60.0, 60.5, 61.0]: add(snap(), t, 0.12)
# prisoner
add(sting(1.8), 61.5, 0.18); add(creak(1.2, 110), 62.0, 0.2)
add(snap(), 63.82, 0.45); add(boom(0.5, 1.3), 63.82, 0.35); add(scream(0.5), 63.85, 0.12)
# outro
bb(3, 64.95); add(pop_sfx(), 65.23, 0.25)
add(whoosh(0.4, False), 66.3, 0.2); bb(0, 67.25, 0.3); add(bell(220, 1.4, 0.8, 0.1), 67.4, 1)

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
