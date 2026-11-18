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
def strum_sfx(dur=0.8, f0=110):
    n = int(dur * SR); t = np.arange(n) / SR; x = sum(np.sign(np.sin(2 * np.pi * f0 * m * t)) * (0.5 / m) for m in (1, 1.5, 2)); return lowpass(x, 0.15) * np.exp(-t / (dur * 0.45))
# opening: stage lights slam on + hum + guitar strum + whoosh
add(click(), 0.10, 0.3); add(click(), 0.16, 0.15); add(buzz(0.9, 120), 0.12, 0.08); add(strum_sfx(1.0, 110), 0.3, 0.12); add(whoosh(0.4), 0.9, 0.12); add(strum_sfx(0.6, 147), 1.3, 0.08); add(pop_sfx(), 1.84, 0.2)
add(chatter(1.6, 0.6), 2.9, 0.08); add(strum_sfx(0.5, 98), 6.1, 0.08)
add(whoosh(0.4), 7.2, 0.08); add(mstep(), 7.5, 0.05); add(static(0.2), 8.10, 0.05); add(click(), 8.12, 0.15)
add(scream(0.6), 9.06, 0.06); add(static(0.3), 9.5, 0.04)
add(heartbeat(0.55), 10.86, 0.15); add(tick(), 12.08, 0.12); add(tick(), 12.44, 0.1); add(pop_sfx(), 14.34, 0.2)
loopfill(lambda d: buzz(d, 60), 15.9, 21.6, 0.03); add(whoosh(0.5), 16.0, 0.06); add(whoosh(0.3), 20.6, 0.08)
add(click(), 22.40, 0.3); add(buzz(0.4, 120), 22.42, 0.05); add(chime(1.4), 23.06, 0.06)
add(whoosh(0.5), 26.78, 0.07)
add(whoosh(0.35), 28.40, 0.1); add(ding(), 29.30, 0.06); add(whoosh(0.35), 29.92, 0.1); add(creak(0.4, 160), 30.1, 0.06); add(whoosh(0.35), 31.26, 0.1); add(strum_sfx(0.5, 165), 31.9, 0.06)
add(pop_sfx(), 35.38, 0.2); for tt in (36.2, 36.55, 36.9, 37.25): add(footstep(95), tt, 0.1)
add(tick(), 41.14, 0.12)
add(whoosh(1.0), 42.3, 0.08); add(chime(1.6), 43.28, 0.07); add(click(), 42.64, 0.2)
for tt in (44.0, 44.5, 45.0, 45.5, 46.0, 46.5): add(mstep(), tt, 0.04)
loopfill(lambda d: buzz(d, 70), 47.34, 50.9, 0.03); add(glitch(0.3), 50.28, 0.06)
add(pop_sfx(), 52.20, 0.2); add(strum_sfx(0.8, 131), 52.8, 0.08)
mix[:] = np.tanh(mix * 1.15) * 0.8
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16); os.makedirs('out', exist_ok=True)
with wave.open('out/sfx.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(np.stack([pcm, pcm], 1).tobytes())
print('ok', np.abs(mix).max())
