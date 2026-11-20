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
loopfill(room, 0.0, 53.11, 0.035); loopfill(fanloop, 0.48, 9.96, 0.02); loopfill(fanloop, 21.46, 28.44, 0.018); loopfill(fanloop, 31.58, 46.9, 0.018)
def vaultamb(d): return lowpass(noise(d), 0.02) * 2.0
# 1 hook: lamp flicker (clicks + buzz), heavy steps, mic whoosh, coins dropping + counter
add(buzz(0.5, 120), 0.0, 0.05); add(click(), 0.04, 0.25); add(click(), 0.16, 0.2); add(click(), 0.28, 0.25); add(whoosh(0.5), 0.45, 0.07)
for tt in [0.55, 0.85]: add(metal_step(70), tt, 0.06)
add(sting(1.0), 0.78, 0.035); add(whoosh(0.3), 1.12, 0.05)
for i in range(5): add(coin(2300 + 250 * i), 1.5 + i * 0.07, 0.05); add(coin(2600 + 200 * i)[:int(0.15 * SR)], 1.66 + i * 0.07, 0.03)
add(pop_sfx(), 1.46, 0.1); add(whoosh(1.2), 2.2, 0.06)
# 2 joke: foot taps, laugh
for k in range(8): add(click(), 3.9 + k * 0.17, 0.08)
add(laugh(4, 240, 0.14, 1.0), 5.2, 0.05)
# 3 criticism: whoosh down, heavy coin thud, lamp dies, pupils
add(whoosh(0.8), 6.4, 0.06); add(coin(2400), 7.95, 0.05); add(thud(55, 0.15, 0.5), 8.16, 0.09); add(boom(0.5, 0.9) * 0.4, 8.17, 0.04)
add(buzz(0.4, 60), 8.66, 0.05); add(click(), 8.9, 0.2); add(sting(1.2), 9.18, 0.035)
# 4 FNAF 6 stage
add(whoosh(0.6), 9.96, 0.07); add(whoosh(0.5, False), 11.66, 0.06); add(coin(2600), 13.3, 0.05); add(slot(), 13.44, 0.07); add(whoosh(0.5), 13.9, 0.05); add(pop_sfx(), 14.16, 0.08)
# 5 vault: door wheel + hydraulic, coins pouring, cheer
add(whir(0.9, 70, 140), 15.3, 0.05); add(thud(70, 0.1, 0.3), 15.35, 0.06); loopfill(vaultamb, 15.28, 21.46, 0.03)
for i in range(26): add(coin(2000 + 300 * (i % 5)), 15.6 + i * 0.22, 0.025)
add(pop_sfx(), 18.0, 0.1)
for tt in [20.2, 20.6, 21.0]: add(metal_step(72), tt, 0.05)
add(chime(1.0), 20.32, 0.035)
# 6 UCN darker
add(whoosh(0.8, False), 21.46, 0.06); add(static(1.2), 23.1, 0.02); add(glitch(0.3), 23.6, 0.035); add(sting(1.2), 24.92, 0.035)
# 7 William + nightmare
add(breath(0.6, True), 25.6, 0.07); add(thud(70, 0.1, 0.3), 27.84, 0.05); add(whoosh(1.0), 28.44, 0.06); add(static(1.4), 28.5, 0.025)
add(heartbeat(), 29.0, 0.16); add(sting(1.0), 30.44, 0.03); add(whoosh(1.0), 30.4, 0.04)
# 8 spirit -> robot
add(whoosh(1.2), 31.8, 0.06); add(zap(0.2), 32.8, 0.05); add(chime(0.8) * 0.7, 32.85, 0.03); add(growl(0.8, 55), 34.7, 0.05)
for k in range(6): add(click(), 34.0 + k * 0.18, 0.07)
# 9 paying
add(breath(0.5, False), 35.6, 0.06)
for i in range(5): add(coin(2300 + 200 * i)[:int(0.2 * SR)], 36.9 + i * 0.24, 0.05)
for i in range(5): add(slot(), 39.0 + i * 0.12, 0.045)
add(pop_sfx(), 39.4, 0.1)
for tt in [39.9, 40.2]: add(metal_step(72), tt, 0.04)
# 10 souls
for i in range(5): add(chime(0.7) * 0.5, 40.75 + i * 0.12, 0.012)
for i in range(5): add(whoosh(0.3), 41.6 + i * 0.19, 0.035)
add(heartbeat(), 42.7, 0.16); add(static(0.8), 42.6, 0.02)
# 11 heater
add(whoosh(0.4), 43.96, 0.06); add(click(), 46.24, 0.3); add(whir(0.8, 60, 160), 46.3, 0.05)
# 12 fire
add(whoosh(0.6), 47.0, 0.06); add(fireloop(2.4), 47.1, 0.04); add(boom(0.5, 1.0) * 0.4, 47.8, 0.04); add(thud(60, 0.15, 0.4), 48.6, 0.05)
# 13 ending
add(breath(0.8, False), 49.5, 0.06); add(pop_sfx(), 49.6, 0.12)
for tt in [50.5, 50.9]: add(metal_step(70), tt, 0.045)
add(whoosh(0.5), 51.14, 0.07)
for i in range(6): add(coin(2200 + 250 * (i % 3)), 51.3 + i * 0.25, 0.025)
mix[:] = np.tanh(mix * 1.15) * 0.8
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16); os.makedirs('out', exist_ok=True)
with wave.open('out/sfx.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(np.stack([pcm, pcm], 1).tobytes())
print('ok', np.abs(mix).max())
