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
loopfill(room, 0.0, 53.11, 0.035); loopfill(fanloop, 1.12, 3.76, 0.02); loopfill(fanloop, 6.36, 9.96, 0.018); loopfill(fanloop, 21.46, 28.44, 0.018); loopfill(fanloop, 31.58, 40.42, 0.018); loopfill(fanloop, 43.96, 47.8, 0.018)
def hall(d): return lowpass(noise(d), 0.02) * 2.0
def crowd(d): return chatter(d, 1.0)
# 1 hook: spotlight slam + whoosh of the spin, heavy step, sting on "Freddy"; palm whoosh, five coins on the desk + counter pop
add(thud(80, 0.08, 0.3), 0.0, 0.06); add(buzz(0.4, 120), 0.0, 0.03); add(whoosh(0.5), 0.02, 0.08); add(metal_step(70), 0.5, 0.06); add(whoosh(0.3), 0.7, 0.06); add(sting(1.0), 0.78, 0.035)
add(whoosh(0.3), 1.12, 0.05)
for i in range(5): add(coin(2300 + 250 * i), 1.48 + i * 0.07, 0.05); add(coin(2600 + 200 * i)[:int(0.15 * SR)], 1.64 + i * 0.07, 0.03)
add(pop_sfx(), 1.72, 0.1); add(whoosh(1.2, False), 2.2, 0.05)
for k in range(6): add(click(), 2.5 + k * 0.17, 0.06)
# 2 joke: kids laughing at the stage, he shrugs and laughs along
add(crowd(1.4), 3.76, 0.03); add(laugh(5, 520, 0.12, 1.0), 3.85, 0.035); add(laugh(4, 600, 0.11, 1.0), 4.3, 0.03)
add(whoosh(0.3), 5.12, 0.05); add(laugh(4, 240, 0.14, 1.0), 5.75, 0.05)
# 3 criticism: crane down, hand covers the box, heavy coin thud, lamp creak
add(whoosh(0.8), 6.4, 0.05); add(thud(90, 0.05, 0.2), 7.28, 0.05); add(coin(2400), 7.95, 0.05); add(thud(55, 0.15, 0.5), 8.16, 0.09); add(boom(0.5, 0.9) * 0.4, 8.17, 0.035)
add(creak(1.2, 160), 8.7, 0.04); add(sting(1.2), 9.18, 0.03)
# 4 FNAF 6 stage
add(whoosh(1.0), 10.0, 0.05); add(whoosh(0.5, False), 11.66, 0.06); add(coin(2600), 13.1, 0.05); add(slot(), 13.42, 0.07); add(whoosh(0.5), 13.9, 0.05); add(pop_sfx(), 14.16, 0.08)
# 5 greed: the sign lighting up (clicks), coins pouring and the pile rising, transformation, jingling walk
loopfill(hall, 15.28, 21.46, 0.03)
for k in range(7): add(click(), 15.4 + k * 0.12, 0.08)
add(buzz(1.0, 100), 15.4, 0.02)
for i in range(30): add(coin(2000 + 300 * (i % 5)), 15.5 + i * 0.16, 0.022)
add(whir(1.1, 50, 110), 16.95, 0.04); add(pop_sfx(), 18.0, 0.1)
add(whoosh(0.5), 18.5, 0.06); add(zap(0.2), 18.6, 0.04); add(chime(1.0), 18.95, 0.03)
for tt in [20.15, 20.55, 20.95, 21.35]: add(metal_step(72), tt, 0.045); add(coin(2400)[:int(0.12 * SR)], tt + 0.03, 0.03)
# 6 UCN darker: dolly in, CRT program beeps, lamp failing
add(whoosh(0.8, False), 21.46, 0.05)
for k in range(5): add(tick(), 23.15 + k * 0.2, 0.06)
add(glitch(0.3), 24.05, 0.03); add(buzz(0.5, 60), 24.5, 0.05); add(click(), 24.55, 0.2); add(click(), 24.68, 0.2); add(click(), 24.86, 0.25); add(sting(1.2), 24.92, 0.03)
# 7 William + nightmare + Golden Freddy
add(breath(0.6, True), 25.6, 0.07); add(whoosh(0.4), 27.04, 0.05); add(thud(70, 0.1, 0.3), 28.04, 0.04); add(whoosh(1.0), 28.44, 0.05); add(static(1.4), 28.5, 0.02)
add(heartbeat(), 29.0, 0.15); add(glitch(0.4), 30.04, 0.03); add(static(0.4), 30.06, 0.015); add(growl(0.8, 50), 30.7, 0.04); add(breath(0.4, True), 31.1, 0.06)
# 8 spirit -> robot: shimmer of the golden stream, star flare, the robot leans in (tapping foot)
add(whoosh(0.8), 31.62, 0.05); add(hiss(1.0), 32.0, 0.015); add(zap(0.2), 32.78, 0.04); add(chime(0.8) * 0.7, 32.8, 0.025); add(whoosh(0.6, False), 33.2, 0.04)
add(metal_step(70), 33.7, 0.05)
for k in range(7): add(click(), 34.0 + k * 0.18, 0.06)
add(growl(0.8, 55), 34.76, 0.04)
# 9 paying
add(breath(0.5, False), 35.6, 0.06)
for i in range(5): add(coin(2300 + 200 * i)[:int(0.2 * SR)], 36.9 + i * 0.1, 0.05)
add(pop_sfx(), 37.3, 0.09)
for i in range(5): add(whoosh(0.2), 38.45 + i * 0.12, 0.025); add(slot(), 38.95 + i * 0.12, 0.04)
add(breath(0.9, False), 39.5, 0.07)
# 10 souls: coins glow one by one, souls rise, the nightmare circle
add(whir(1.0, 120, 300), 40.6, 0.03)
for i in range(5): add(whoosh(0.3), 41.6 + i * 0.15, 0.03)
add(heartbeat(), 42.7, 0.15); add(static(0.8), 42.6, 0.018)
# 11 heater: idea "!", turning, button click, heater hum
add(pop_sfx(), 44.8, 0.1); add(whoosh(0.4), 45.3, 0.05); add(click(), 46.24, 0.3); add(whir(0.8, 60, 160), 46.3, 0.04); add(tick(), 46.72, 0.08)
# 12 heat + fire
add(breath(0.4, False), 47.05, 0.05); add(metal_step(70), 47.5, 0.04); add(boom(0.5, 1.0) * 0.4, 47.8, 0.035); add(fireloop(1.6), 47.8, 0.035); add(thud(60, 0.15, 0.4), 48.7, 0.045)
# 13 ending: the dots connect into a star, then the stage
add(whoosh(0.6), 49.35, 0.04)
add(hiss(0.7), 49.9, 0.012); add(whir(0.7, 150, 400), 49.88, 0.025)
add(chime(1.0), 50.52, 0.03)
add(whoosh(0.5), 51.14, 0.06); add(pop_sfx(), 51.2, 0.08)
for i in range(6): add(coin(2200 + 250 * (i % 3)), 51.5 + i * 0.25, 0.022)
mix[:] = np.tanh(mix * 1.15) * 0.8
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16); os.makedirs('out', exist_ok=True)
with wave.open('out/sfx.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(np.stack([pcm, pcm], 1).tobytes())
print('ok', np.abs(mix).max())
