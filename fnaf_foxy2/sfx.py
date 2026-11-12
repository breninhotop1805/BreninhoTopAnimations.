"""Synthesizes the sound-effects track (out/sfx.wav) for the Withered Foxy (FNAF 2) video.
No music — narration-sync'd SFX only, per the user's request."""
import numpy as np, wave

SR = 44100; DUR = 54.26
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
for t in np.arange(0.05, 1.6, 0.42): add(mstep(), t, 0.35)
add(static(0.18), 0.0, 0.113); add(whoosh(0.35, False), 0.25, 0.15); add(mask_breath(1.3), 0.7, 0.55)
add(creak(0.6, 160), 1.95, 0.25); add(mask_breath(1.1), 1.9, 0.4)
add(boom(0.5, 1.2), 2.6, 0.203); add(whoosh(0.4, True), 2.45, 0.25)
add(glitch(0.3), 3.25, 0.158); add(zap(), 3.45, 0.158); add(buzz(0.8, 115), 3.5, 0.1); add(glitch(0.25), 3.95, 0.135); add(zap(), 4.25, 0.135); add(glitch(0.2), 4.6, 0.113)
add(growl(1.3, 45), 5.0, 0.3); add(heartbeat(), 5.3, 0.3); add(heartbeat(), 6.0, 0.3)
add(whir(1.0, 90, 160), 6.45, 0.2); add(ding(), 6.75, 0.3)
add(sting(1.2), 7.78, 0.15); add(static(0.12), 8.66, 0.203); add(heartbeat(), 8.2, 0.35); add(static(0.08), 9.04, 0.158)
for t in [9.42, 9.88]: add(ring(0.38), t, 0.35)
add(click(), 10.4, 0.5); add(thud(160, 0.05, 0.15), 10.42, 0.09)
for t in [11.35, 12.05, 12.75]: add(zap(), t, 0.135); add(glitch(0.15), t + 0.05, 0.09)
add(creak(0.9, 120), 11.6, 0.25); add(buzz(1.6, 100), 11.3, 0.07)
for t in np.arange(13.5, 14.9, 0.33): add(mstep(), t, 0.4)
add(thud(70, 0.1), 14.92, 0.203); add(sting(0.8), 14.95, 0.1)
add(chip_blip(660, 0.06), 15.9, 0.25); add(chip_blip(880, 0.06), 16.05, 0.25); add(chip_blip(660, 0.06), 16.5, 0.2); add(chip_blip(880, 0.06), 16.65, 0.2)
add(whoosh(0.45, True), 17.25, 0.3); add(chip_blip(1320, 0.12), 17.66, 0.3)
add(curtain(0.6), 17.74, 0.4); add(chip_go(), 17.82, 0.4); add(chip_go(), 18.02, 0.4); add(chip_go(), 18.22, 0.4)
for t in np.arange(18.2, 20.3, 0.12): add(chip_step(), t, 0.35)
add(chip_cheer(), 20.3, 0.55); add(chip_cheer(), 20.95, 0.4)
for t in [20.45, 20.8, 21.3, 21.75, 22.1]: add(chip_blip(1200 + 200 * ((t * 10) % 3), 0.05), t, 0.18)
add(chip_glitch(0.5), 22.4, 0.18); add(drone8(2.4, 55), 22.5, 0.5); add(chip_low(0.9, 130), 22.92, 0.315)
for t in np.arange(23.65, 24.88, 0.16): add(chip_step(), t, 0.28)
add(chip_glitch(0.18), 24.88, 0.225)
add(chip_low(1.4, 90), 25.8, 0.248); add(drone8(4.4, 49), 25.8, 0.45); add(chip_glitch(0.12), 26.88, 0.203)
add(heartbeat(), 28.1, 0.3); add(heartbeat(), 28.9, 0.3); add(chip_glitch(0.45), 29.8, 0.248); add(static(0.2), 30.05, 0.135)
add(sting(1.2), 30.25, 0.15); add(static(0.12), 30.22, 0.135)
for t in np.arange(32.05, 33.6, 0.28): add(footstep(150), t, 0.18); add(footstep(170), t + 0.13, 0.14)
add(creak(0.8, 200), 33.75, 0.2); add(glitch(0.6), 34.84, 0.158); add(sting(0.9), 34.9, 0.12)
add(chime(1.6), 35.8, 0.3); add(heartbeat(), 36.5, 0.3)
for t in [37.16, 37.51, 37.86]: add(chip_glitch(0.12), t, 0.203)
for t in np.arange(38.4, 39.9, 0.36): add(mstep(), t, 0.38)
add(mask_breath(1.2), 38.5, 0.5); add(mask_breath(1.1), 39.75, 0.45)
add(whir(0.8, 120, 200), 40.05, 0.15); add(ding(), 40.3, 0.3)
for t in np.arange(41.3, 43.6, 0.3): add(tick(0.8), t, 0.5)
add(mask_breath(1.3), 41.6, 0.35)
for t in np.arange(43.72, 45.5, 0.19): add(glitch(0.06), t, 0.081)
add(growl(1.6, 40), 43.9, 0.3)
for t in [45.58, 45.86, 46.14, 46.42]: add(alarm(0.2, 920), t, 0.081)
add(scream(1.0), 46.93, 0.189); add(boom(0.5, 1.0), 46.93, 0.18); add(static(0.25), 47.7, 0.158)
add(chime(1.8), 48.0, 0.3); add(bell(523, 1.4, 0.8, 0.08), 48.1, 1)
for t in [49.4, 49.62, 49.84, 50.06]: add(tick(1.0), t, 0.45)
add(creak(0.5, 220), 50.4, 0.2); add(pop_sfx(), 50.66, 0.25)


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
