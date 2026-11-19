"""SFX for "O MIMIC" (hook to the Iceberg). No music. Harsh sounds low; each sound marks one moment; strong opening."""
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
# opening: city ambience (waves), whoosh crane, block falling + landing thud + break crackle
loopfill(ocean if 'ocean' in globals() else (lambda d: lowpass(noise(d), 0.03) * 2), 0.0, 6.5, 0.05)
add(whoosh(1.0), 0.0, 0.14); add(whoosh(0.4, False), 0.3, 0.1); add(thump(), 0.62, 0.16); add(crackle(0.4), 0.64, 0.1); add(pop_sfx(), 1.92, 0.2)
add(whoosh(0.5), 2.42, 0.12); add(sting(1.0), 2.45, 0.05)
add(tick(), 3.7, 0.1); add(glitch(0.6), 5.38, 0.07); add(static(0.4), 5.4, 0.04)
add(boom(0.6, 1.2) * 0.6, 7.34, 0.07); add(whir(1.2, 80, 160), 7.4, 0.05); add(ding(), 7.96, 0.06)
add(thud(45, 0.2, 0.6), 11.40, 0.14); add(crackle(0.6), 11.42, 0.08); add(pop_sfx(), 11.43, 0.18)
add(whoosh(0.5), 13.64, 0.1); add(chime(1.4), 13.82, 0.06); add(pop_sfx(), 16.64, 0.2)
for k in range(24): add(click(), 17.94 + k * 0.06, 0.1 * (0.6 + 0.4 * ((k * 7) % 5) / 5))
add(thump(), 19.4, 0.12); add(whoosh(0.4), 22.34, 0.12); add(whoosh(1.2), 22.7, 0.08); add(whoosh(1.2, False), 23.88, 0.08)
add(tick(), 25.92, 0.1); add(pop_sfx(), 26.4, 0.18); add(whoosh(0.3), 27.2, 0.1); add(zap(0.2), 28.7, 0.06)
add(chime(1.2), 30.32, 0.05); add(pop_sfx(), 32.30, 0.12); add(thump(), 32.78, 0.1); add(tick(), 33.72, 0.1)
add(zap(0.3), 35.62, 0.06); add(pop_sfx(), 36.8, 0.18); add(tick(), 38.92, 0.1); add(tick(), 40.56, 0.1)
for k in range(40): add(click(), 41.9 + k * 0.035, 0.08)
add(boom(0.8, 1.6) * 0.5, 41.92, 0.08); add(whoosh(1.6), 41.4, 0.1)
add(whoosh(0.5), 44.3, 0.08); add(chime(1.6), 47.08, 0.06); add(pop_sfx(), 47.1, 0.18)
add(whoosh(0.4), 50.28, 0.1); add(whoosh(0.4), 51.36, 0.1); add(pop_sfx(), 52.2, 0.2); add(whoosh(0.4), 52.84, 0.08)
mix[:] = np.tanh(mix * 1.15) * 0.8
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16); os.makedirs('out', exist_ok=True)
with wave.open('out/sfx.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(np.stack([pcm, pcm], 1).tobytes())
print('ok', np.abs(mix).max())
