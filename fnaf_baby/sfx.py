"""Synthesizes the sound-effects track (out/sfx.wav) for the Circus Baby eyes video.
No music — narration-sync'd SFX only, per the user's request."""
import numpy as np, wave

SR = 44100; DUR = 52.9
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

# ---- 8-bit (Atari) minigame sounds ----
def sq(f, dur, duty=0.5):
    n = int(dur * SR); t = np.arange(n) / SR; ph = (np.cumsum(np.full(n, f) if np.isscalar(f) else f) / SR) % 1
    return np.where(ph < duty, 1.0, -1.0)
def crush(x, levels=8): return np.round(x * levels) / levels
def chip_blip(f=880, dur=0.07, gain=1.0):
    n = int(dur * SR); return crush(sq(f, dur, 0.25) * np.exp(-np.arange(n) / SR / (dur * 0.6))) * gain
def chip_go():  # "GO!" — rising square chirp
    dur = 0.16; n = int(dur * SR); t = np.arange(n) / SR; f = 440 + 900 * t / dur
    return crush(sq(f, dur, 0.5) * np.minimum(1, (dur - t) / 0.03))
def chip_step(): return chip_blip(150, 0.035, 0.8) + crush(noise(0.035)[: int(0.035 * SR)] * 0.3)
def chip_cheer():  # kids "hurray": noisy rising burst with a 2-tone yelp
    dur = 0.55; n = int(dur * SR); t = np.arange(n) / SR
    nz = crush(lowpass(noise(dur)[:n], 0.35) * 1.4) * np.exp(-t / 0.3)
    f = np.where(t < 0.2, 660, 880); y = sq(f, dur, 0.25) * 0.35 * np.exp(-t / 0.35)
    return nz + crush(y)
def chip_low(dur=0.9, f0=110):
    n = int(dur * SR); t = np.arange(n) / SR; f = f0 * (1 - 0.35 * t / dur)
    return crush(sq(f, dur, 0.5) * np.exp(-t / (dur * 0.6))) * 0.8
def chip_glitch(dur=0.25):
    n = int(dur * SR); x = crush(np.repeat(rng.uniform(-1, 1, n // 60 + 1), 60)[:n], 4)
    return x * np.minimum(1, np.arange(n)[::-1] / (0.02 * SR))
def drone8(dur=2.0, f=55):
    n = int(dur * SR); t = np.arange(n) / SR; return crush(sq(f + 2 * np.sin(2 * np.pi * 3 * t), dur, 0.5) * 0.4) * np.minimum(1, t / 0.2) * np.minimum(1, (dur - t) / 0.2)
def mask_breath(dur=1.2):  # FNAF 2 mask breathing: filtered noise, in-out
    n = int(dur * SR); t = np.arange(n) / SR; x = lowpass(noise(dur)[:n], 0.06) - lowpass(noise(dur)[:n], 0.01)
    e = np.sin(np.pi * t / dur) ** 2; return x * e * 2.2

# ---- TIMELINE ----
add(static(0.18), 0.0, 0.12); add(sting(1.0), 0.05, 0.08); add(wrong(), 1.12, 0.18)
add(creak(0.7, 160), 2.6, 0.15); add(growl(1.2, 50), 2.9, 0.12); add(buzz(0.8, 110), 2.95, 0.04)
add(chip_blip(660, 0.06), 4.2, 0.2); add(chip_blip(880, 0.06), 4.35, 0.2); add(whoosh(0.45, True), 5.15, 0.22); add(chip_blip(1320, 0.12), 5.5, 0.22)
add(boom(0.4, 1.0), 5.66, 0.2)
for t in np.arange(6.85, 8.95, 0.2): add(chip_step(), t, 0.22)
add(chip_go(), 8.98, 0.2)
for t0 in [0.2, 0.95, 1.7]: add(chip_blip(990, 0.08), 8.98 + t0, 0.22); add(chip_cheer(), 8.98 + t0 + 0.6, 0.25); add(chip_blip(1480, 0.06), 8.98 + t0 + 0.62, 0.2)
add(chip_blip(1760, 0.18), 12.05, 0.22); add(chime(1.2), 12.1, 0.12)
for t in [13.5, 13.9, 14.5, 14.95, 15.4]: add(zap(), t, 0.12)
add(buzz(1.2, 90), 15.8, 0.05)
for t in [16.0, 16.5, 17.0]: add(tick(0.6), t, 0.3)
add(sting(1.4), 17.7, 0.1); add(heartbeat(), 18.6, 0.22); add(heartbeat(), 19.3, 0.22); add(pop_sfx(), 19.32, 0.15)
add(growl(2.0, 40), 20.4, 0.2); add(static(0.12), 20.36, 0.12); add(heartbeat(), 21.5, 0.2)
add(chime(1.4), 23.1, 0.12); add(bell(784, 0.6, 0.3, 0.08), 23.6, 1); add(bell(988, 0.6, 0.3, 0.08), 24.0, 1); add(pop_sfx(), 25.25, 0.15)
add(creak(0.5, 200), 26.95, 0.2); add(whir(0.9, 120, 220), 27.5, 0.2); add(snap(), 28.25, 0.2)
add(whir(1.0, 90, 150), 28.6, 0.1)
for t in np.arange(28.8, 31.5, 0.3): add(tick(0.5), t, 0.25)
add(alarm(0.2, 880), 31.2, 0.12); add(alarm(0.2, 880), 31.5, 0.12)
add(footstep(110), 32.4, 0.12); add(click(), 32.9, 0.15)
for t in np.arange(33.6, 35.7, 0.32): add(footstep(170), t, 0.12)
add(whir(0.4, 160, 300), 35.95, 0.22); add(snap(), 36.25, 0.25); add(boom(0.4, 1.0), 36.28, 0.22); add(static(0.2), 36.3, 0.15)
add(thud(150, 0.05, 0.15), 36.7, 0.18); add(sting(1.4), 36.8, 0.08)
add(chime(1.6), 38.45, 0.15); add(bell(1319, 0.6, 0.35, 0.08), 38.6, 1)
add(pop_sfx(), 40.25, 0.12); add(ding(), 41.1, 0.22)
add(whir(1.2, 80, 140), 43.0, 0.1); add(zap(), 43.95, 0.15); add(chime(1.6), 44.3, 0.15); add(buzz(0.8, 160), 44.0, 0.05)
add(whoosh(1.2, True), 46.3, 0.15); add(chime(1.8), 47.5, 0.18); add(bell(1568, 0.6, 0.3, 0.1), 47.75, 1)
add(pop_sfx(), 49.35, 0.18); add(creak(0.4, 230), 49.1, 0.12)
add(chime(1.4), 51.0, 0.1)

t_all = np.arange(N) / SR
hum = 0.3 * np.sin(2 * np.pi * 50 * t_all) + 0.15 * np.sin(2 * np.pi * 100 * t_all)
fan = lowpass(rng.standard_normal(N) * 0.4, 0.015)
mg_mute = np.ones(N); i0, i1 = int(17.72 * SR), int(30.22 * SR); mg_mute[i0:i1] = 0.25
mix += (hum * 0.006 + fan * 0.03) * mg_mute
mix = np.tanh(mix * 1.15) * 0.8
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
st = np.stack([pcm, pcm], 1)
with wave.open('out/sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
print('ok', np.abs(mix).max())
