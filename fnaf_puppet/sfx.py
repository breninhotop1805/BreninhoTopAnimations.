"""Sound effects for "A verdadeira história da Puppet" (out/sfx.wav). Narration-synced, no music bed.
Times come from the word-level transcription (words.json)."""
import numpy as np, wave

SR = 44100; DUR = 56.0
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

# ------------------------- extra sounds -------------------------
def rain_bed(dur, gain=1.0):
    n = int(dur * SR); x = noise(dur)[:n]; hiss = hp(x, 0.25) * 0.5; body = lowpass(x, 0.08) * 1.2
    drops = (rng.random(n) > 0.997) * rng.standard_normal(n) * 1.5
    return fade((hiss + body + drops) * 0.35 * gain, 0.25, 0.25)
def thunder(dur=2.6, crack=True):
    n = int(dur * SR); t = np.arange(n) / SR
    rumble = lowpass(lowpass(noise(dur)[:n], 0.02), 0.05) * 6 * np.exp(-t / 0.9) * (0.6 + 0.4 * np.sin(2 * np.pi * 3.1 * t) ** 2)
    c = hp(noise(dur)[:n], 0.3) * np.exp(-t / 0.05) * 1.5 if crack else 0
    return rumble + c
def knock(): a = thud(140, 0.04, 0.2) * 0.9; n = len(a); return a + hp(noise(0.2), 0.3)[:n] * env(n, 0.0005, 0.01) * 0.6
def click(): n = int(0.04 * SR); return hp(noise(0.04)[:n], 0.4) * env(n, 0.0005, 0.006)
def lockclick(): return np.concatenate([click() * 0.8, np.zeros(int(0.05 * SR)), click()]) + 0
def door_slam(): a = boom(0.25, 0.9) * 0.7; b = thud(90, 0.1, 0.5); a[:len(b)] += b; return a
def zap(dur=0.4):
    n = int(dur * SR); t = np.arange(n) / SR
    buzz_ = np.sign(np.sin(2 * np.pi * 60 * t)) * (rng.random(n) > 0.5) * 0.6 + hp(noise(dur)[:n], 0.5) * 0.8
    return buzz_ * env(n, 0.002, 0.12)

# ------------------------- timeline (from words.json) -------------------------
mbox = [79, 76, 72, 76, 79, None, 77, 74, 71, 74, 77, None, 76, 72, 69, 72, 76, None, 74, 71, 67, 71, 74]
add(musicbox(mbox, 0.3), 0.0, 0.11)                                    # Puppet's music box opening
add(shimmer(1.0, 523), 1.75, 0.25)                                     # Puppet turns
add(thud(220, 0.04, 0.2), 2.3, 0.35); add(whoosh(0.6, True), 2.4, 0.2)  # gift box lid
add(rain_bed(0.9), 3.70, 0.7); add(thunder(1.6), 3.95, 0.55)           # FNaF facade
add(shimmer(1.4, 659), 4.75, 0.45); add(breath(1.2), 4.7, 0.25)        # soul inside
add(chip([72, 76, 79], 0.12, w='sin', gain=0.12), 6.5, 1.0)            # "Charlotte" sparkle
for k in range(9): add(sparks(0.12), 8.8 + k * 0.1, 0.18)              # welding
add(clack(), 10.22, 0.45); add(drone(1.0, 70), 10.22, 0.15)            # workshop lights / originals
add(drone(2.6, 44), 11.24, 0.3)                                        # first victim
for t in [12.8, 13.05, 13.3]: add(clack(), t, 0.25)                    # hall lights off
add(fade(tone(55, 1.0, d=2, wave_='saw') * 0.3, 0.02, 0.3), 13.88, 0.4); add(boom(0.4, 1.0), 13.9, 0.3)   # William sting
add(door_slam(), 15.21, 0.6); add(fade(tone(220, 0.25, d=1, wave_='sq'), 0.005, 0.05), 15.41, 0.25)    # secret door + X
add(rain_bed(4.6), 16.48, 0.8)                                         # outside: storm
add(lockclick(), 17.06, 0.6)
for s_ in [17.3, 18.75, 19.55, 20.0]: add(thunder(2.4, s_ in (18.75, 20.0)), s_, 0.6)
for t in [18.44, 18.83]: add(knock(), t, 0.6)
add(rain_bed(1.9), 20.9, 0.25)                                         # muffled rain on the workshop roof
for k in range(6): add(beep(1600 if k % 2 else 1300, 0.05), 23.2 + k * 0.22, 0.12)   # bracelet / security
for k in range(14): add(click(), 24.55 + k * 0.09, 0.5)                # typing
for k in range(4): add(beep(1800, 0.06), 25.9 + k * 0.33, 0.1)
add(shimmer(1.2, 784), 25.85, 0.25)                                    # "proteger"
add(rain_bed(4.6), 27.28, 0.5); add(thunder(2.2), 28.3, 0.55)
for k in range(3): add(beep(900, 0.12), 28.0 + k * 0.18, 0.3)         # alert
add(thunder(2.0, False), 29.4, 0.45)
add(rain_bed(10.0), 30.22, 0.85); add(thunder(2.2), 31.2, 0.55)        # alley storm
for t in [30.35, 30.75, 31.15, 31.55]: add(step(80), t, 0.3)
for k in range(5): add(zap(0.3), 32.68 + k * 0.18, 0.4)                 # short circuit
add(sparks(0.6), 32.7, 0.4); add(static(0.3), 33.0, 0.2)
add(thud(60, 0.15, 0.6), 34.81, 0.75); add(fade(lowpass(noise(0.5), 0.2), 0.01, 0.3), 34.81, 0.3)   # collapse
add(musicbox(mbox[:12], 0.4), 35.3, 0.08)                              # sad music box under the rain
add(shimmer(2.0, 523), 37.9, 0.5); add(breath(2.0), 37.8, 0.35)        # soul rises
add(whoosh(0.8, True), 39.7, 0.35); add(boom(0.5, 1.2), 40.46, 0.45); add(shimmer(1.0, 1046), 40.46, 0.45)   # soul enters
for t in [41.3, 41.75, 42.2]: add(step(60), t, 0.45)
add(scream(0.8), 42.33, 0.25); add(boom(0.35, 0.9), 42.33, 0.3)        # others attack
add(musicbox(mbox[:8], 0.3), 43.5, 0.1)                                # conscious Puppet
add(chip([60, 64, 67, 72, 67, 64], 0.13, gain=0.2), 45.4, 1.0)        # Give Gifts jingle
for i in range(3): add(chip([84, 88], 0.06, gain=0.25), 47.04 + i * 0.35 + 0.35, 1.0)   # masks on
add(boom(0.35, 1.0), 49.16, 0.4); add(shimmer(1.0, 880), 49.16, 0.35)  # they come alive
add(chip([69, 72, 76, 72, 69, None, 74, 77, 81, 77], 0.11, gain=0.2), 50.2, 1.0)        # arcade attract
add(shimmer(1.2, 659), 52.5, 0.3); add(musicbox(mbox[:10], 0.32), 52.3, 0.08)
add(shimmer(1.4, 880), 54.0, 0.4); add(chip([72, 76, 79, 84], 0.1, gain=0.12), 54.1, 1.0)

# low room tone throughout
t_all = np.arange(N) / SR
mix += (0.3 * np.sin(2 * np.pi * 50 * t_all) + 0.15 * np.sin(2 * np.pi * 100 * t_all)) * 0.005 + lowpass(rng.standard_normal(N) * 0.4, 0.015) * 0.03

mix = np.tanh(mix * 1.15) * 0.8
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open('out/sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(np.stack([pcm, pcm], 1).tobytes())
print('ok', float(np.abs(mix).max()))
