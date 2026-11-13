"""Sound effects for "Os Toy Animatronics tem alma?" (out/sfx.wav). Narration-synced, no music bed.
Times come from the word-level transcription (words.json)."""
import numpy as np, wave

SR = 44100; DUR = 62.5
N = int(SR * DUR); mix = np.zeros(N)
rng = np.random.default_rng(21)

def add(sig, at, gain=1.0):
    i = int(at * SR); j = min(N, i + len(sig))
    if j > i: mix[i:j] += sig[: j - i] * gain
def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def noise(dur): return rng.standard_normal(int(dur * SR))
def lowpass(x, a):  # one-pole, vectorised via exponential smoothing in blocks
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x): acc += a * (v - acc); y[i] = acc
    return y
def hp(x, a): return x - lowpass(x, a)
def tone(f, dur, d=0.3, a=0.004, wave_='sin'):
    n = int(dur * SR); t = np.arange(n) / SR; ph = 2 * np.pi * f * t
    s = np.sin(ph) if wave_ == 'sin' else (np.sign(np.sin(ph)) * 0.6 if wave_ == 'sq' else 2 * ((f * t) % 1) - 1)
    return s * env(n, a, d)
def sweep(f0, f1, dur, wave_='sin'):
    n = int(dur * SR); t = np.arange(n) / SR; f = f0 + (f1 - f0) * t / dur; ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) if wave_ == 'sin' else np.sign(np.sin(ph)) * 0.6
def fade(s, a=0.01, b=0.05):
    n = len(s); e = np.ones(n); ia, ib = min(int(a * SR), n // 2), min(int(b * SR), n // 2)
    if ia: e[:ia] = np.linspace(0, 1, ia)
    if ib: e[-ib:] = np.linspace(1, 0, ib)
    return s * e
def static(dur):
    n = noise(dur); n = hp(n, 0.15) * 0.5 + (rng.random(len(n)) > 0.985) * rng.standard_normal(len(n)) * 3
    return fade(n, 0.02, 0.03)
def thud(f0=110, d=0.12, dur=0.35):
    n = int(dur * SR); t = np.arange(n) / SR; f = f0 * (1 + 1.5 * np.exp(-t / 0.02))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, d) + noise(dur)[:n] * env(n, 0.0005, 0.008) * 0.6
def boom(d=0.6, dur=1.6):
    n = int(dur * SR); t = np.arange(n) / SR; f = 55 * (1 + 2.5 * np.exp(-t / 0.05))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, d) + lowpass(noise(dur)[:n], 0.05) * env(n, 0.001, 0.25) * 2
def clack():  # big light switch
    return thud(160, 0.05, 0.25) * 0.8 + hp(noise(0.25), 0.4)[: int(0.25 * SR)] * env(int(0.25 * SR), 0.0005, 0.01)
def buzz(dur, f=120):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sign(np.sin(2 * np.pi * f * t)) * 0.4 + 0.3 * np.sin(2 * np.pi * 2 * f * t)
    gate = (rng.random(n // 800 + 1) > 0.35).repeat(800)[:n]
    return fade(s * (0.4 + 0.6 * gate), 0.01, 0.05)
def servo(dur=0.18):
    n = int(dur * SR); t = np.arange(n) / SR; f = 700 + 500 * np.sin(np.pi * t / dur)
    s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3 + hp(noise(dur)[:n], 0.3) * 0.25
    return fade(s, 0.005, 0.03)
def sparks(dur=0.5):
    n = int(dur * SR); x = hp(noise(dur)[:n], 0.5); crack = (rng.random(n) > 0.992) * rng.standard_normal(n) * 6
    return (x * 0.4 + crack) * env(n, 0.001, 0.15)
def shimmer(dur=1.2, base=880):
    out = np.zeros(int(dur * SR))
    for k, f in enumerate([base, base * 1.25, base * 1.5, base * 2, base * 2.5]):
        s = tone(f, dur - k * 0.08, d=0.6) * 0.18; i = int(k * 0.08 * SR); m = min(len(s), len(out) - i); out[i:i + m] += s[:m]
    return out
def ring(dur=0.6):  # FNAF2 desk phone
    n = int(dur * SR); t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 480 * t)) * 0.5 * (np.sin(2 * np.pi * 22 * t) > 0)
    return fade(s, 0.005, 0.03)
def beep(f=1400, dur=0.07, w='sq'): return fade(tone(f, dur, d=1, wave_=w), 0.002, 0.01)
def siren(dur):
    n = int(dur * SR); t = np.arange(n) / SR; f = np.where((t * 3) % 1 < 0.5, 960, 770)
    return fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6, 0.02, 0.08)
def scream(dur=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; f = 900 - 420 * (t / dur) + 55 * np.sin(2 * np.pi * 21 * t)
    ph = np.cumsum(f) / SR; saw = 2 * (ph % 1) - 1 + 0.6 * (2 * (ph * 1.51 % 1) - 1)
    return np.tanh(3 * (saw + 0.5 * noise(dur)[:n])) * np.minimum(1, t / 0.01) * np.clip(1.15 - t / dur, 0, 1)
def whoosh(dur=0.5, rise=True):
    n = int(dur * SR); t = np.arange(n) / SR; x = lowpass(noise(dur)[:n], 0.08)
    f = (200 + 2200 * (t / dur)) if rise else (2400 - 2200 * (t / dur))
    return (x * 0.6 + np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.7
def drone(dur, f=55):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t + 0.3 * np.sin(t)) + 0.3 * np.sin(2 * np.pi * f * 2.01 * t)
    return fade(s * 0.4, 0.3, 0.4)
def step(f0=70): n = int(0.18 * SR); return lowpass(noise(0.18)[:n], 0.3) * env(n, 0.002, 0.05) * 1.4 + np.sin(2 * np.pi * f0 * np.arange(n) / SR) * env(n, 0.002, 0.05) * 0.6
def clank():
    n = int(0.3 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1730 * t) * 0.5 + np.sin(2 * np.pi * 2610 * t) * 0.3) * env(n, 0.001, 0.06) + thud(140, 0.03, 0.3)[:n] * 0.4
def radio(dur):  # Mangle's distorted radio garble
    n = int(dur * SR); t = np.arange(n) / SR
    carrier = np.sin(2 * np.pi * (300 + 220 * np.sin(2 * np.pi * 7 * t) + 120 * np.sin(2 * np.pi * 13.7 * t)) * t)
    s = np.tanh(2.5 * (carrier * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t)) + hp(noise(dur)[:n], 0.2) * 0.6))
    return fade(s, 0.03, 0.08)
def chip(notes, dur_note=0.12, w='sq', gain=1.0):  # 8-bit melody, notes as midi or None
    out = []
    for m in notes:
        n = int(dur_note * SR)
        out.append(np.zeros(n) if m is None else fade(tone(440 * 2 ** ((m - 69) / 12), dur_note, d=0.5, wave_=w), 0.002, 0.01) * gain)
    return np.concatenate(out)
def musicbox(notes, step_=0.32):
    out = np.zeros(int((len(notes) * step_ + 1.5) * SR))
    for k, m in enumerate(notes):
        if m is None: continue
        f = 440 * 2 ** ((m - 69) / 12); n = int(1.4 * SR); t = np.arange(n) / SR
        s = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.15)) * env(n, 0.002, 0.45)
        i = int(k * step_ * SR); m = min(n, len(out) - i); out[i:i + m] += s[:m]
    return out
def heartbeat(): b1 = thud(55, 0.06, 0.18); b2 = thud(50, 0.08, 0.2); o = np.zeros(int(0.55 * SR)); o[:len(b1)] += b1; i2 = int(0.16 * SR); m = min(len(b2), len(o) - i2); o[i2:i2 + m] += b2[:m]; return o
def breath(dur):
    n = int(dur * SR); t = np.arange(n) / SR; x = hp(lowpass(noise(dur)[:n], 0.25), 0.02)
    return x * (np.sin(np.pi * t / dur) ** 2) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.7 * t))

# ------------------------- timeline -------------------------
add(drone(1.0, 45), 0.0, 0.25)                                   # cold open
add(clack(), 0.84, 0.6); add(boom(0.35, 1.0), 0.84, 0.3)          # stage lights on ("Toy")
add(buzz(0.9, 118), 1.40, 0.12)                                  # neon FNAF 2 sign
for t in [2.30, 2.44, 2.73, 2.87, 3.16, 3.30]: add(servo(0.13), t, 0.22)   # Bonnie twitches
add(sparks(0.6), 3.53, 0.45); add(static(0.2), 3.50, 0.2)        # "com defeito"
add(shimmer(1.3, 660), 5.05, 0.6); add(breath(1.0), 5.0, 0.25)   # "almas?"
for t in [8.38, 8.83, 9.29]: add(ring(0.38), t, 0.4)             # red phone (Phone Guy)
add(fade(sweep(300, 900, 1.8) * 0.25 + sweep(305, 910, 1.8) * 0.25, 0.1, 0.2), 9.52, 0.18)   # laser scan
for k in range(8): add(beep(1800 if k % 2 else 1400, 0.05), 11.4 + k * 0.15, 0.18)           # face scan
for k in range(20): add(beep(900 + (k * 137) % 900, 0.035), 12.62 + k * 0.08, 0.12)           # database search
add(siren(0.75), 14.24, 0.3)                                     # "polícia"
add(fade(tone(110, 0.9, d=2, wave_='sq'), 0.01, 0.05), 14.95, 0.3); add(static(0.25), 15.6, 0.2)   # error buzzer
add(drone(2.0, 62), 16.72, 0.3)
for k in range(5): add(beep(1200, 0.04), 16.85 + k * 0.28, 0.12)
add(beep(2200, 0.25, 'sin'), 18.22, 0.25)                        # target lock
for k in range(4): add(beep(880, 0.12), 18.78 + k * 0.25, 0.28)  # MATCH alarm
for t in [19.92, 20.05, 20.18, 20.30]: add(step(65), t, 0.5)    # Toy Freddy runs
add(scream(0.9), 20.40, 0.32); add(boom(0.5, 1.2), 20.40, 0.4); add(static(0.3), 21.03, 0.35)
for t in [21.56, 21.81, 22.06, 22.31]: add(clack(), t, 0.4)       # lights switching off
add(drone(1.8, 41), 22.3, 0.35)
add(shimmer(1.6, 523), 23.44, 0.55); add(breath(1.3), 23.4, 0.3)  # "almas sim"
chipA = [69, 72, 76, 72, 69, None, 74, 77, 81, 77, 74, None]
add(chip(chipA * 2, 0.11, gain=0.25), 24.45, 1.0)                 # arcade attract tune
add(whoosh(1.0, True), 27.6, 0.35); add(static(0.15), 28.55, 0.3)  # into the screen
for k in range(10): add(beep(220 + 40 * (k % 2), 0.05), 28.7 + k * 0.22, 0.12)   # 8-bit footsteps
add(chip([57, 56, 55, 54, None, 50], 0.18, gain=0.3), 31.4, 1.0)   # sad 8-bit sting ("corpos")
add(fade(tone(73, 1.3, d=3, wave_='sq'), 0.05, 0.3), 32.8, 0.12)
add(chip([45, None, 45, 46, 45], 0.14, w='saw', gain=0.3), 35.55, 1.0)   # William sting
add(chip([81, 84, 88, 84], 0.2, w='sin', gain=0.2) , 36.1, 1.0); add(chip([81, 84, 88, 84], 0.2, w='sin', gain=0.15), 37.0, 1.0)
add(static(0.2), 38.1, 0.35)
add(thud(220, 0.04, 0.2), 38.35, 0.4); add(whoosh(0.6, True), 38.6, 0.25)   # gift box lid
mb = [76, 74, 72, 74, 76, None, 76, 76, 74, None, 74, 76, 79, None, 79, None, 76, 74, 72, 74, 76, 76, 76, 74, 74, 76, 74, 72]
add(musicbox(mb, 0.3), 38.4, 0.1)                                 # Puppet music box (original melody)
add(shimmer(1.2, 784), 40.5, 0.4)                                 # orb forming
add(whoosh(0.8, False), 41.55, 0.25); add(boom(0.4, 1.0), 42.35, 0.3); add(shimmer(0.8, 988), 42.36, 0.35)   # originals awaken
for i in range(3): add(whoosh(0.5, True), 43.94 + i * 0.12, 0.2)
for t in [45.85, 46.10, 46.35]: add(shimmer(0.6, 1046), t, 0.3); add(thud(90, 0.05), t, 0.25)
add(thud(180, 0.08), 47.53, 0.5); add(sparks(0.3), 47.53, 0.3); add(boom(0.3, 0.8), 47.53, 0.3)   # beak ripped
add(radio(1.7), 49.26, 0.22)
for t in np.arange(49.35, 50.9, 0.21): add(clank(), t, 0.12)       # Mangle crawling
for k in range(13):
    t0 = 50.94 + k / 6
    add(radio(0.06), t0, 0.35); add(static(0.05), t0, 0.15)
add(drone(1.8, 49), 53.08, 0.35)
for t in [53.2, 53.75, 54.3]: add(step(60), t, 0.45)
for t in [53.4, 54.0, 54.6]: add(heartbeat(), t, 0.4)
add(breath(1.2), 54.86, 0.45); add(shimmer(1.1, 587), 54.9, 0.4)  # ghost children
add(musicbox(mb[:8], 0.32), 56.05, 0.09)
for t in [58.8, 59.4, 59.95]: add(static(0.18), t, 0.3)
add(fade(sweep(800, 120, 1.5, 'sq') * 0.2, 0.02, 0.3), 58.9, 0.4)  # "vírus" glitch drop
add(shimmer(1.4, 880), 60.55, 0.45); add(chip([72, 76, 79, 84], 0.1, gain=0.15), 60.6, 1.0)

# low room tone throughout
t_all = np.arange(N) / SR
mix += (0.3 * np.sin(2 * np.pi * 50 * t_all) + 0.15 * np.sin(2 * np.pi * 100 * t_all)) * 0.005 + lowpass(rng.standard_normal(N) * 0.4, 0.015) * 0.03

mix = np.tanh(mix * 1.15) * 0.8
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open('out/sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(np.stack([pcm, pcm], 1).tobytes())
print('ok', float(np.abs(mix).max()))
