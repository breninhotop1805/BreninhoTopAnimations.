"""EP02 'Amigo imaginário' — discrete SFX under the voice (+ the music in the mix). Each sound marks one moment; nothing repeated
back-to-back; max 3 chimes/bells; footsteps soft; harsh sounds very low. Times = video timeline (silence-cut voice)."""
import numpy as np, wave, os
from sfx_lib import *
def boing(f0=180, dur=0.35):
    n = int(dur * SR); t = np.arange(n) / SR; f = f0 * (1 + 0.8 * np.exp(-t / 0.05)) * (1 + 0.08 * np.sin(2 * np.pi * 14 * t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.004, 0.12) * 0.8
def shimmer(dur=1.0, f0=1800, down=False):
    out = np.zeros(int(dur * SR) + SR)
    for k in range(14): f = f0 * (2 ** ((-k if down else k) / 12 * 1.5)); add_at(out, bell(f, 0.5, 0.18, 1.0), k / 14 * dur, 0.5 * (1 - k / 20))
    return out
def add_at(buf, sig, at, g): i = int(at * SR); j = min(len(buf), i + len(sig)); buf[i:j] += sig[:j - i] * g
def hum(dur=1.0, f=60):
    n = int(dur * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2 * f * t)) * np.minimum(1, t / 0.2) * np.minimum(1, (dur - t) / 0.2) * 0.6
def page(): return curtain(0.35)
def steps(ts, g=0.07, f0=95):
    for i, t in enumerate(ts): add(footstep(f0 + (i % 2) * 8), t, g)
def snore(at, dur=0.9, g=0.06):
    n = int(dur * SR); t = np.arange(n) / SR; x = noise(dur)[:n]; x = lowpass(x, 0.05) - lowpass(x, 0.006); x += 0.5 * np.sin(2 * np.pi * 70 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 35 * t))
    add(x * np.sin(np.pi * t / dur) ** 1.5 * 1.5, at, g)
# 1 opening: whoosh in, Bolota hops (soft boings), footsteps on cobble
add(whoosh(0.45), 0.0, 0.10); add(boing(170), 0.25, 0.06); add(boing(160), 0.85, 0.05); steps([0.15, 0.55, 0.95], 0.06)
add(whoosh(0.3), 1.0, 0.05); add(chime(1.2), 2.5, 0.05)                                   # "de verdade" (chime 1/3)
add(shimmer(0.7, 2200, down=True), 3.6, 0.035)                                           # "somem": the little friend dissolves
steps([4.6, 4.9, 5.2, 5.5], 0.05); add(laugh(3, 640, 0.12), 5.6, 0.035)
# morning
add(breath(0.7, True), 6.65, 0.06); add(tick(), 7.0, 0.05); add(pop_sfx(), 7.95, 0.08); add(whoosh(0.3, rise=False), 8.25, 0.06)
add(chatter(1.4), 9.55, 0.03)                                                            # "todo mundo"
add(thud(80, 0.12, 0.35), 12.2, 0.07); steps([13.2, 13.55, 13.9, 14.25, 14.6, 14.95, 15.3, 15.65], 0.045, 100); add(pop_sfx(), 14.92, 0.05)
add(whoosh(0.35), 15.95, 0.05); snore(17.5, 1.0, 0.05); snore(18.6, 0.9, 0.045)            # dragon snoring
add(knock(), 19.35, 0.04); add(scratch(), 19.6, 0.03)                                    # chalk / desk
for i, t in enumerate([22.05, 22.35, 22.58]): add(pop_sfx(), t, 0.06 + 0.01 * i)            # 1, 2, 3
add(page(), 23.25, 0.05); add(wrong(), 25.32, 0.025)                                     # no question 4
add(whoosh(0.3), 25.75, 0.05); add(ding(), 26.88, 0.04)                                  # "Bolota" (bell 2/3)
add(boing(150, 0.45), 27.7, 0.08); add(whoosh(0.3), 28.4, 0.04); add(hum(1.3, 55), 29.1, 0.05)
add(whoosh(0.6), 30.4, 0.06); mbox([523, 659, 784, 659, 587, 523], 30.6, 0.42, 0.0, 0.025)   # flashback music-box
steps([33.3, 33.6, 33.9], 0.05); add(chatter(1.6), 34.2, 0.03); add(thud(90, 0.1, 0.3), 36.38, 0.06); add(boing(120, 0.4), 36.4, 0.06)
add(breath(0.9, False), 37.2, 0.05); snore(38.5, 0.8, 0.07); snore(39.25, 0.6, 0.06); add(laugh(3, 560, 0.11), 40.05, 0.04)
add(page(), 40.5, 0.06); add(whir(0.7, 300, 160), 42.5, 0.02); add(page(), 43.65, 0.06); add(whoosh(0.4), 45.9, 0.05); add(page(), 46.95, 0.06)
add(shimmer(0.5, 1500, down=True), 48.6, 0.025)
add(whoosh(0.35), 49.9, 0.07); steps([50.65, 50.9, 51.15, 51.4, 51.65], 0.045, 110); add(laugh(2, 700, 0.12), 51.0, 0.03)
add(typing(1.3), 52.1, 0.04); add(scratch(), 53.75, 0.05); add(scratch(), 53.95, 0.04); add(typing(0.7), 54.5, 0.035)
add(whoosh(0.3), 55.7, 0.06); add(chatter(2.0), 57.6, 0.035)
for i, t in enumerate([57.7, 58.0, 58.3, 58.6, 58.95]): add(laugh(3, 480 + 90 * i, 0.1 + 0.01 * i), t, 0.03)    # the whole school laughs
add(breath(0.8, False), 59.95, 0.05)
add(creak(0.6, 200), 60.95, 0.04); add(ring(0.35), 61.2, 0.025); steps([61.5, 61.85, 62.2, 62.55], 0.05)
steps([62.95, 63.3, 63.65, 64.0], 0.045); add(whoosh(0.4), 64.4, 0.04); steps([64.6, 64.95, 65.3, 65.65, 66.0], 0.045)
add(pop_sfx(), 67.3, 0.04); add(pop_sfx(), 69.1, 0.06)                                   # "espera" / "?"
steps([69.9, 70.35, 70.8, 71.25], 0.04, 90); add(thud(90, 0.1, 0.3), 71.6, 0.05)
add(laugh(3, 600, 0.12), 76.6, 0.035); add(laugh(3, 520, 0.12), 76.75, 0.03)
for k in range(14): add(tick(), 77.6 + k * 0.15, 0.03)                                   # time flies
add(shimmer(1.2, 1400), 81.2, 0.03); add(shimmer(0.6, 1700), 84.45, 0.025)
add(whoosh(0.5), 87.5, 0.04); add(laugh(3, 600, 0.12), 90.1, 0.03)
add(whoosh(0.7), 91.6, 0.05); add(curtain(0.6), 92.3, 0.03); add(curtain(0.6), 93.2, 0.03)  # leaves
add(pop_sfx(), 97.33, 0.05); add(chime(1.6), 98.1, 0.05); add(shimmer(1.0, 2000), 98.2, 0.04)  # wink + disappears (chime 3/3)
add(whoosh(0.3, rise=False), 100.3, 0.03); add(pop_sfx(), 102.45, 0.05)
add(whoosh(0.6), 103.3, 0.06); mbox([523, 659, 784], 103.6, 0.5, 0.0, 0.02); add(boing(150, 0.45), 106.0, 0.07); add(whoosh(0.35), 106.75, 0.05); add(hum(1.0, 55), 107.45, 0.05)
add(pop_sfx(), 108.95, 0.05); add(whoosh(0.9), 110.3, 0.05); add(shimmer(1.3, 1600), 110.6, 0.03)
mix[:] = np.tanh(mix * 1.15) * 0.8
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16); os.makedirs('out', exist_ok=True)
with wave.open('out/sfx.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(np.stack([pcm, pcm], 1).tobytes())
print('ok', np.abs(mix).max())
