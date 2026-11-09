"""Synthesizes the background music + sound effects track (out/sfx.wav), timed to the shots."""
import numpy as np, wave

SR = 44100; DUR = 60.0
N = int(SR * DUR); mix = np.zeros(N)
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR

def add(sig, at, gain=1.0):
    i = int(at * SR); j = min(N, i + len(sig))
    if j > i: mix[i:j] += sig[: j - i] * gain

def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)

def bell(f, dur=1.2, d=0.45):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.15) + 0.12 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t / 0.08)
    return s * env(n, 0.003, d)

def noise(dur): return rng.standard_normal(int(dur * SR))

def lowpass(x, a):  # one-pole
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x): acc += a * (v - acc); y[i] = acc
    return y

def static(dur, gain=1.0):
    n = noise(dur); n = n - lowpass(n, 0.15)  # crunchy highpassed
    crackle = (rng.random(len(n)) > 0.985) * rng.standard_normal(len(n)) * 3
    e = np.ones(len(n)); f = int(0.03 * SR); e[:f] = np.linspace(0, 1, f); e[-f:] = np.linspace(1, 0, f)
    return (n * 0.5 + crackle) * e * gain

def pop():
    n = int(0.12 * SR); t = np.arange(n) / SR; f = 380 + 900 * t / 0.12
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.04)

def thud(f0=110, d=0.12):
    n = int(0.35 * SR); t = np.arange(n) / SR; f = f0 * (1 + 1.5 * np.exp(-t / 0.02))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, d)
    c = noise(0.35)[:n] * env(n, 0.0005, 0.008) * 0.6
    return s + c

def rip():  # plastic pop + crack
    n = int(0.35 * SR)
    c = noise(0.35)[:n]; c = c - lowpass(c, 0.3)
    return c * env(n, 0.001, 0.05) * 0.9 + thud(180, 0.08)[:n] * 0.7

def boom(d=0.6):
    n = int(1.6 * SR); t = np.arange(n) / SR; f = 55 * (1 + 2.5 * np.exp(-t / 0.05))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, d)
    nz = lowpass(noise(1.6)[:n], 0.05) * env(n, 0.001, 0.25) * 2
    return s + nz

def scream(dur=1.3):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 950 - 450 * (t / dur) + 60 * np.sin(2 * np.pi * 23 * t)
    ph = np.cumsum(f) / SR
    saw = 2 * (ph * 1.0 % 1) - 1 + 0.6 * (2 * (ph * 1.51 % 1) - 1)
    s = np.tanh(3 * (saw + 0.5 * noise(dur)[:n]))
    e = np.minimum(1, t / 0.01) * np.clip(1.15 - t / dur, 0, 1)
    return s * e

def swell(dur, f0=200, f1=2000):
    n = int(dur * SR); t = np.arange(n) / SR; x = noise(dur)[:n]
    a = np.linspace(0.02, 0.5, n); y = np.empty(n); acc = 0.0
    for i in range(n): acc += a[i] * (x[i] - acc); y[i] = acc
    return y * (t / dur) ** 2 * 1.5

def chime(at, gain=0.12):
    for k, f in enumerate([1568, 1976, 2349, 3136, 2637]): add(bell(f, 0.8, 0.25), at + k * 0.06, gain)

# ---- music box loop (original melody), ducked in scary moments ----
notes = [69, 72, 76, 81, 79, 76, 72, 76, 67, 71, 74, 79, 77, 74, 71, 74, 65, 69, 72, 77, 76, 72, 69, 72, 64, 68, 71, 76, 74, 71, 68, 71]
music = np.zeros(N); step = 0.22
t = 0.0; k = 0
while t < DUR:
    f = 440 * 2 ** ((notes[k % len(notes)] - 69) / 12)
    s = bell(f, 1.0, 0.35); i = int(t * SR); j = min(N, i + len(s)); music[i:j] += s[: j - i]
    if k % 8 == 0:  # soft bass
        fb = f / 4; b = bell(fb, 1.6, 0.6); j = min(N, i + len(b)); music[i:j] += 0.5 * b[: j - i]
    t += step; k += 1
duck = np.ones(N)
def set_level(a, b, lvl, ramp=0.15):
    i, j, r = int(a * SR), int(b * SR), int(ramp * SR)
    duck[i:j] = np.minimum(duck[i:j], lvl)
for a, b, l in [(2.97, 4.69, 0.35), (9.98, 14.29, 0.35), (20.52, 32.08, 0.25), (28.4, 31.0, 0.0), (39.31, 41.0, 0.15), (46.84, 50.97, 0.3), (54.6, 57.56, 0.25)]:
    set_level(a, b, l)
# smooth the ducking curve
k = int(0.12 * SR); duck = np.convolve(duck, np.ones(k) / k, mode='same')
mix += music * duck * 0.05

# ---- ambient hum + fan ----
hum = 0.4 * np.sin(2 * np.pi * 60 * t_all) + 0.2 * np.sin(2 * np.pi * 120 * t_all)
fan = lowpass(rng.standard_normal(N) * 0.5, 0.02)
mix += (hum * 0.012 + fan * 0.05)

# ---- effects ----
for at, d, g in [(4.69, 0.3, 0.16), (6.10, 0.18, 0.1), (12.45, 0.3, 0.16), (12.9, 0.15, 0.1), (25.95, 0.15, 0.1), (35.1, 0.2, 0.1), (29.65, 0.9, 0.12)]:
    add(static(d), at, g)
for at in [14.54, 15.66, 33.62, 42.72, 43.04, 43.36]: add(pop(), at, 0.22)
for at in [3.45, 21.43, 54.97]: add(rip(), at, 0.5)
for at, g in [(23.39, 0.6), (23.73, 0.4), (23.96, 0.25)]: add(thud(), at, g)
add(scream(1.3), 29.22, 0.22); add(boom(0.5), 29.22, 0.5)
add(boom(0.4), 41.35, 0.35); chime(41.4, 0.12)
chime(7.6, 0.07); chime(57.8, 0.08); chime(52.8, 0.05)
add(swell(1.3), 45.5, 0.25); add(bell(220, 2.0, 1.0), 46.84, 0.15)
add(boom(1.0) * 0.6, 30.5, 0.3)  # dolly zoom low hit
add(boom(0.3), 3.45, 0.2); add(boom(0.3), 54.97, 0.25)
# heartbeat under the jumpscare build-up
for at in [26.95, 27.55, 28.1]: add(thud(60, 0.1), at, 0.35); add(thud(60, 0.1), at + 0.18, 0.25)

mix = np.tanh(mix * 1.2) * 0.8
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
st = np.stack([pcm, pcm], 1)
with wave.open('out/sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
print('ok', np.abs(mix).max())
