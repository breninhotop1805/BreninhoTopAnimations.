"""Synthesizes the sound-effects track (out/sfx.wav) for the Golden Freddy video.
No music — narration-sync'd SFX only, per the user's request."""
import numpy as np, wave

SR = 44100; DUR = 52.608
N = int(SR * DUR); mix = np.zeros(N)
rng = np.random.default_rng(13)

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
for t in [0.4, 1.2, 2.1, 3.0]: add(footstep(80), t, 0.3)          # withered approaching, backstage_tease
add(whoosh(0.5, True), 1.05, 0.3)                                   # cut to UCN logo
add(static(0.3), 1.0, 0.18); add(static(0.15), 2.85, 0.2)           # ucn_logo / glitch
for t in [5.1, 5.45, 5.8, 6.15, 6.45]: add(footstep(70), t, 0.45)   # freddy running
add(scream(0.9), 6.95, 0.3); add(boom(0.45, 1.2), 6.95, 0.35)       # freddy lunge jumpscare
add(static(0.25), 6.9, 0.3)
add(pop_sfx(), 7.6, 0.3); add(bell(1760, 0.35, 0.2, 0.18), 7.65, 1) # like pop
add(pop_sfx(), 8.7, 0.25); add(bell(1320, 0.4, 0.25, 0.2), 8.75, 1) # bell pop
add(static(0.2), 14.35, 0.15)                                        # withered_away cut
add(static(0.3), 16.6, 0.22)                                         # golden_reveal settle glitch
add(static(0.35), 18.4, 0.3)                                         # golden_glitch_beat
add(ring(0.35), 20.75, 0.35); add(ring(0.35), 21.2, 0.35); add(ring(0.35), 21.65, 0.35)  # phone guy
add(whoosh(0.3, True), 22.9, 0.2)                                    # empty chair flash
add(whoosh(0.4, True), 27.0, 0.3); add(static(0.15), 27.0, 0.25)     # nightcard FNAF2 flash
for t in [35.65, 35.85]: add(static(0.12), t, 0.4)
add(whoosh(0.35, True), 35.62, 0.4); add(pop_sfx(), 35.95, 0.3)      # golden teleport in
add(whoosh(0.35, False), 37.55, 0.4); add(static(0.2), 37.58, 0.45)  # golden teleport out
add(pop_sfx(), 39.5, 0.25); add(bell(1568, 0.5, 0.3, 0.18), 39.55, 1)  # fans like
add(thud(90, 0.1), 41.5, 0.25)                                       # withered official beat
for t in [47.6, 48.05, 48.5, 48.95, 49.3]: add(heartbeat(), t, 0.5)  # golden ghostly / not real
add(static(0.2), 49.6, 0.2)
add(bell(220, 1.4, 0.8, 0.12), 50.2, 1)                               # finale eerie tone
add(whoosh(0.6, False), 51.9, 0.15)                                  # fade to black whoosh

# ambient low hum throughout, quieter than project 1 (no music bed)
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
