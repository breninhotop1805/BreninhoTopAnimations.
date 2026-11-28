"""SFX for "QUANTOS MINECRAFTS CABEM DENTRO DE UM GTA 6?". No music. Harsh sounds low; each sound marks one moment; strong opening."""
import numpy as np, wave, os
from sfx_lib import *
def drone(dur, f=48):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t + 0.4 * np.sin(2 * np.pi * 0.3 * t))
    return x * np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6)
def loopfill(fn, t0, t1, gain): add(fn(t1 - t0), t0, gain)
def chatter_teeth(dur=0.5):
    out = np.zeros(int(dur * SR))
    for k in range(int(dur * 18)): c = click(); i = int(k / 18 * SR); out[i:i + len(c)] += c[:len(out) - i] * (0.6 + 0.4 * rng.random())
    return out
def thump(): return thud(60, 0.12, 0.4)
def ocean(d): return lowpass(noise(d), 0.02) * 2.2 * (0.7 + 0.3 * np.sin(2 * np.pi * 0.15 * np.arange(int(d * SR)) / SR))
def engine(d):  # convertible engine: low harmonic hum with a little rumble
    t = np.arange(int(d * SR)) / SR; f = 62 + 6 * np.sin(2 * np.pi * 0.4 * t); ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph) + 0.3 * lowpass(noise(d), 0.05) * 3
    return x * np.minimum(1, t / 0.3) * np.minimum(1, (d - t) / 0.3)
def hum(d, f=55):  # SSD data-hall electric hum
    t = np.arange(int(d * SR)) / SR; x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 3 * t) + 0.15 * np.sin(2 * np.pi * f * 5 * t)
    return x * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.3)
# --- ambiences (low, continuous, change with the setting) ---
loopfill(ocean, 0.0, 3.54, 0.05); loopfill(lambda d: lowpass(noise(d), 0.01) * 3, 3.54, 6.54, 0.04)          # street / rooftop wind
loopfill(ocean, 6.54, 13.64, 0.06); loopfill(lambda d: hum(d), 17.44, 22.34, 0.035)                          # beach / SSD hall
loopfill(ocean, 23.88, 27.80, 0.05); loopfill(engine, 23.88, 26.68, 0.07); loopfill(lambda d: hum(d), 37.60, 39.72, 0.03)
loopfill(lambda d: hum(d, 48), 41.22, 44.26, 0.035); loopfill(ocean, 48.44, 51.06, 0.04); loopfill(ocean, 52.84, 53.7, 0.05)
# --- hook: crane whoosh, footsteps, block crashing down ---
add(whoosh(1.0), 0.0, 0.14); for_steps = [0.15, 0.45, 0.75, 1.02, 1.26]
for k, tt in enumerate(for_steps): add(footstep(85 + 6 * (k % 2)), tt, 0.07 * (1 - 0.12 * k))
add(whoosh(0.4, False), 0.3, 0.1); add(thump(), 0.62, 0.16); add(crackle(0.4), 0.64, 0.1); add(pop_sfx(), 1.92, 0.2)
add(whoosh(0.5), 2.42, 0.12); add(sting(1.0), 2.45, 0.05)
add(whoosh(0.4), 3.54, 0.06); add(tick(), 3.75, 0.08); add(glitch(0.6), 5.38, 0.07); add(static(0.4), 5.4, 0.04)
add(boom(0.6, 1.2) * 0.6, 7.34, 0.07); add(whir(1.2, 80, 160), 7.4, 0.05); add(ding(), 7.96, 0.06); add(whoosh(0.4), 9.18, 0.07)
add(thud(45, 0.2, 0.6), 11.40, 0.14); add(crackle(0.6), 11.42, 0.08); add(pop_sfx(), 11.43, 0.18)
add(whoosh(0.5), 13.64, 0.1); add(chime(1.4), 13.82, 0.06); add(pop_sfx(), 16.64, 0.2)
# --- SSD: power-on, steps on the metal floor, pedestals popping in with the counter ---
add(boot(0.8), 17.44, 0.07); add(footstep(95), 17.6, 0.06); add(footstep(100), 17.9, 0.06); add(footstep(95), 18.2, 0.05)
for k in range(28): add(click(), 18.86 + k * 0.05, 0.09 * (0.6 + 0.4 * ((k * 7) % 5) / 5))
add(ding(), 20.26, 0.05); add(whoosh(0.3), 20.52, 0.08); add(pop_sfx(), 20.86, 0.16)
add(whoosh(0.5), 22.34, 0.12); add(whoosh(1.2), 22.8, 0.07); add(whoosh(1.0, False), 23.88, 0.08)
add(tick(), 25.92, 0.08); add(pop_sfx(), 26.42, 0.18); add(whoosh(0.3), 27.2, 0.1); add(zap(0.2), 28.7, 0.06)
add(chime(1.2), 30.32, 0.05); add(pop_sfx(), 32.30, 0.12); add(thump(), 32.78, 0.1); add(tick(), 33.72, 0.1)
add(zap(0.3), 35.62, 0.06)
for k, tt in enumerate([36.15, 36.45, 36.75, 37.0]): add(footstep(88), tt, 0.06 * (1 - 0.15 * k))
add(pop_sfx(), 37.27, 0.16); add(whoosh(0.3), 37.60, 0.06); add(tick(), 38.92, 0.1); add(whoosh(0.4), 39.72, 0.07); add(tick(), 40.56, 0.1)
for k in range(40): add(click(), 41.9 + k * 0.035, 0.08)
add(boom(0.8, 1.6) * 0.5, 41.92, 0.08); add(whoosh(1.6), 41.4, 0.1); add(whoosh(0.4), 43.36, 0.06)
add(whoosh(0.5), 44.3, 0.08); add(pop_sfx(), 45.78, 0.14); add(chime(1.6), 47.26, 0.06); add(pop_sfx(), 47.28, 0.18)
for k in range(5): add(snap(), 47.3 + k * 0.11, 0.06)
add(whoosh(0.4), 50.28, 0.1); add(whoosh(0.4), 51.06, 0.1); add(pop_sfx(), 52.2, 0.2); add(whoosh(0.4), 52.84, 0.08)
mix[:] = np.tanh(mix * 1.15) * 0.8
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16); os.makedirs('out', exist_ok=True)
with wave.open('out/sfx.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(np.stack([pcm, pcm], 1).tobytes())
print('ok', np.abs(mix).max())
