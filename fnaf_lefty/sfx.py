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
# opening: stage light click + hum + whoosh, "não" head shake creak
add(click(), 0.0, 0.3); add(buzz(0.8, 110), 0.02, 0.08); loopfill(lambda d: drone(d, 44), 0.0, 2.5, 0.06); add(whoosh(0.4), 0.3, 0.12); add(creak(0.4, 200), 0.65, 0.07); add(mstep(), 1.98, 0.06)
add(pop_sfx(), 2.92, 0.2); add(whoosh(0.6), 4.86, 0.08); add(tick(), 7.2, 0.1); add(whoosh(0.3), 9.9, 0.1)
add(zap(0.2), 12.42, 0.07); add(click(), 13.1, 0.2); add(boot(0.5), 13.15, 0.07); add(ding(), 13.85, 0.05)
add(pop_sfx(), 17.36, 0.18); add(click(), 21.32, 0.3); add(buzz(0.5, 120), 21.34, 0.06)
add(whoosh(0.4), 24.9, 0.08); add(chime(1.2), 26.38, 0.06)
for k, tt in enumerate([27.92, 28.34, 28.78, 29.36, 29.82]): add(tick(), tt, 0.12)
add(mbox([523, 659, 784, 659], 30.34, 0.18), 0, 0) if False else None
add(bell(784, 0.6, 0.25), 30.34, 0.06); add(slam(), 31.18, 0.08); add(whoosh(0.5), 31.82, 0.1); add(zap(0.2), 32.26, 0.06)
for tt in [32.5, 32.85, 33.2]: add(mstep(), tt, 0.05)
add(whoosh(0.5, False), 33.22, 0.1); add(tick(), 34.65, 0.1)
add(heartbeat(0.55), 36.54, 0.18); loopfill(lambda d: drone(d, 40), 36.5, 41.6, 0.05)
loopfill(fireloop, 38.36, 41.7, 0.06); add(chime(1.4), 39.66, 0.05); add(whoosh(1.0), 39.5, 0.06)
add(whoosh(0.5), 42.4, 0.08); add(creak(0.6, 160), 44.9, 0.08); add(zap(0.25), 45.2, 0.06)
add(pop_sfx(), 48.32, 0.2); add(whoosh(0.4), 48.85, 0.08)
mix[:] = np.tanh(mix * 1.15) * 0.8
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16); os.makedirs('out', exist_ok=True)
with wave.open('out/sfx.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(np.stack([pcm, pcm], 1).tobytes())
print('ok', np.abs(mix).max())
