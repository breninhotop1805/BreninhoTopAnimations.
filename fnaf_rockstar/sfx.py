"""SFX for "Por que o Rockstar Freddy pede 5 moedas na UCN?". No music. Harsh sounds low; one sound per moment."""
import numpy as np, wave, os
from sfx_lib import *
def loopfill(fn, t0, t1, gain): add(fn(t1 - t0), t0, gain)
def room(d): return lowpass(noise(d), 0.006) * 4.0
def coin(f=2600):
    t = np.arange(int(0.35 * SR)) / SR; return (np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 1.5 * t) + 0.3 * np.sin(2 * np.pi * f * 2.3 * t)) * np.exp(-t / 0.08)
def clink(): return coin(3200) * 0.6 + click() [:int(0.35 * SR)].tolist().__len__() * 0
def slot():  # coin dropping inside the chest: short metallic rattle
    out = np.zeros(int(0.4 * SR)); r = np.random.default_rng(3)
    for k in range(5): c = coin(1800 + 400 * k)[:int(0.1 * SR)]; i = int((0.02 + k * 0.05) * SR); out[i:i + len(c)] += c[:len(out) - i] * (0.8 - k * 0.12)
    return out
def fanloop(d):
    t = np.arange(int(d * SR)) / SR; return lowpass(noise(d), 0.05) * 1.5 * (0.8 + 0.2 * np.sin(2 * np.pi * 9 * t))
loopfill(room, 0.0, 53.11, 0.04); loopfill(fanloop, 0.0, 9.96, 0.025); loopfill(fanloop, 21.46, 46.0, 0.02)
# opening: lamp flicker buzz + clicks, heavy steps, sting
add(buzz(0.4, 120), 0.0, 0.05); add(click(), 0.05, 0.25); add(click(), 0.2, 0.2); add(click(), 0.33, 0.25)
for tt in [0.1, 0.4, 0.7]: add(metal_step(70), tt, 0.06)
add(sting(1.0), 0.78, 0.04); add(whir(0.4, 120, 180), 1.2, 0.03); add(coin(), 1.44, 0.07); add(pop_sfx(), 1.46, 0.12)
add(whoosh(0.8), 2.18, 0.08)
add(laugh(4, 240, 0.14, 1.0), 5.2, 0.05)
add(whoosh(1.0), 6.4, 0.05); add(sting(1.2), 8.82, 0.04); add(buzz(0.6, 70), 8.8, 0.04)
add(whoosh(0.5), 9.96, 0.08); add(coin(), 13.0, 0.06); add(slot(), 13.44, 0.08)
for i in range(10): add(coin(2200 + 300 * (i % 4)), 15.4 + i * 0.13, 0.035)
add(pop_sfx(), 18.0, 0.12)
for k, tt in enumerate([18.6, 19.1, 19.6, 20.1, 20.6, 21.1]): add(metal_step(72), tt, 0.05)
add(chime(1.2), 20.32, 0.04)
add(whoosh(0.8, False), 21.46, 0.06); add(sting(1.2), 24.92, 0.04)
add(breath(0.6, True), 25.6, 0.07); add(thud(70, 0.1, 0.3), 27.84, 0.06)
add(heartbeat(), 28.6, 0.18); add(heartbeat(), 29.2, 0.16); add(whoosh(1.2), 30.3, 0.06); add(sting(1.0), 30.44, 0.03)
add(whoosh(1.2), 31.9, 0.07); add(zap(0.2), 33.1, 0.05); add(growl(0.8, 55), 34.7, 0.06)
for i in range(5): add(coin(2400 + 200 * i), 35.76 + i * 0.25, 0.06)
for i in range(5): add(slot(), 37.85 + i * 0.13, 0.05)
add(breath(0.9, False), 38.9, 0.07)
for i in range(5): add(chime(0.8) * 0.6, 41.2 + i * 0.12, 0.015)
add(heartbeat(), 42.74, 0.16); add(click(), 44.4, 0.2); add(click(), 46.24, 0.3); add(whir(0.8, 60, 160), 46.3, 0.05)
add(whoosh(0.6), 47.0, 0.06); add(fireloop(2.2), 47.1, 0.04); add(boom(0.5, 1.0) * 0.5, 47.8, 0.04)
for tt in [49.9, 50.4, 50.9]: add(metal_step(70), tt, 0.05)
add(pop_sfx(), 49.55, 0.14); add(whoosh(0.4), 51.14, 0.07); add(coin(), 51.5, 0.05)
mix[:] = np.tanh(mix * 1.15) * 0.8
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16); os.makedirs('out', exist_ok=True)
with wave.open('out/sfx.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(np.stack([pcm, pcm], 1).tobytes())
print('ok', np.abs(mix).max())
