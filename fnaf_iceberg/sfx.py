"""SFX track for "O BIZARRO ICEBERG DE FNAF" (out/sfx.wav, full 627 s, cut per part by mux_part.sh).
No music. Rules (CLAUDE.md): harsh sounds (fire, chime/bell, scream/boom, metal steps, thuds, static/glitch) kept low;
no repeated "bling"; each sound marks one moment; strong but tasteful opening."""
import numpy as np, wave
from sfx_lib import *

# ---------- extra generators for this video ----------
def rain(dur):
    n = int(dur * SR); x = noise(dur)[:n]; x = x - lowpass(x, 0.35); drops = (rng.random(n) > 0.9993) * rng.standard_normal(n) * 2.5
    e = np.minimum(1, np.arange(n) / (0.3 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.4 * SR)); return (x * 0.5 + lowpass(drops, 0.5)) * e
def thunder(dur=3.0):
    n = int(dur * SR); t = np.arange(n) / SR; r = lowpass(noise(dur)[:n], 0.012) * 9
    m = 0.55 + 0.45 * np.sin(2 * np.pi * 1.7 * t + 2 * np.sin(2 * np.pi * 0.6 * t)); crack = (noise(dur)[:n] - lowpass(noise(dur)[:n], 0.3)) * env(n, 0.002, 0.08) * 0.8
    return (r * m * np.minimum(1, t / 0.05) * np.exp(-t / (dur * 0.45)) + crack)
def siren(dur=2.0):
    n = int(dur * SR); t = np.arange(n) / SR; f = 720 + 160 * np.sin(2 * np.pi * 1.4 * t)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(2 * np.pi * np.cumsum(f * 2) / SR)
    return lowpass(s, 0.08) * np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.5)
def ocean(dur):
    n = int(dur * SR); t = np.arange(n) / SR; x = lowpass(noise(dur)[:n], 0.03) * 3
    return x * (0.45 + 0.55 * np.sin(2 * np.pi * 0.23 * t) ** 2) * np.minimum(1, t / 0.5) * np.minimum(1, (dur - t) / 0.5)
def underwater(dur):
    n = int(dur * SR); t = np.arange(n) / SR; x = lowpass(lowpass(noise(dur)[:n], 0.006), 0.02) * 30
    return x * (0.8 + 0.2 * np.sin(2 * np.pi * 0.17 * t)) * np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6)
def bubbles(dur, rate=9):
    out = np.zeros(int(dur * SR))
    for k in range(int(dur * rate)):
        d = 0.06 + rng.random() * 0.06; m = int(d * SR); t = np.arange(m) / SR; f0 = 300 + rng.random() * 700
        b = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 1.6 * t / d)) / SR) * env(m, 0.002, d * 0.4)
        i = int(rng.random() * (dur - d) * SR); out[i:i + m] += b * (0.3 + 0.7 * rng.random())
    return out
def splash():
    n = int(1.2 * SR); t = np.arange(n) / SR; x = noise(1.2)[:n]; x = lowpass(x, 0.25) - lowpass(x, 0.02)
    return x * env(n, 0.004, 0.25) * 2.0 + np.concatenate([np.zeros(int(0.15 * SR)), bubbles(1.05, 22)])[:n] * 0.7
def dive_whoosh(dur=2.6):
    n = int(dur * SR); t = np.arange(n) / SR; x = lowpass(noise(dur)[:n], 0.03) * 3; y = lowpass(noise(dur)[:n], 0.12)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5; return (x + y * 0.5) * e
def servo(dur=0.5, f0=420, f1=620): return whir(dur, f0, f1) * 0.9
def chip(f=660, dur=0.07):
    n = int(dur * SR); t = np.arange(n) / SR; return np.sign(np.sin(2 * np.pi * f * t)) * 0.35 * np.minimum(1, (dur - t) / 0.01)
def beep(f=1200, dur=0.08):
    n = int(dur * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t) * 0.5 * np.minimum(1, t / 0.004) * np.minimum(1, (dur - t) / 0.01)
def doorcreak(dur=0.7): return creak(dur, 260) * 0.8
def hum(dur, f=60):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2 * t) + 0.2 * np.sign(np.sin(2 * np.pi * f * 3 * t))
    return lowpass(s, 0.1) * np.minimum(1, t / 0.2) * np.minimum(1, (dur - t) / 0.2)
def whisper(dur=1.5):
    n = int(dur * SR); t = np.arange(n) / SR; x = noise(dur)[:n]; x = lowpass(x, 0.3) - lowpass(x, 0.08)
    m = (0.5 + 0.5 * np.sin(2 * np.pi * 4.3 * t + 3 * np.sin(2 * np.pi * 0.9 * t))) ** 2
    return x * m * np.sin(np.pi * t / dur) * 1.8
def drone(dur, f=48):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 1.5 * t + np.sin(2 * np.pi * 0.2 * t))
    return s * np.minimum(1, t / 0.8) * np.minimum(1, (dur - t) / 0.8)
def ring2(): return np.concatenate([ring(0.4), np.zeros(int(0.2 * SR)), ring(0.4)])
def loopfill(fn, t0, t1, gain): add(fn(t1 - t0), t0, gain)
TOREADOR = [392, 330, 330, 349, 392, 392, 392, 349, 330, 349, 392, 349, 330, 294]  # Freddy's tune (Toreador March), music-box timbre

# ================================ PART 1 (0 – 156.33) ================================
# --- opening: storm, kids running and laughing (strong, clean start) ---
add(thunder(3.2), 0.05, 0.55); loopfill(rain, 0.0, 6.9, 0.10); add(laugh(5, 620, 0.12, 0.5), 0.35, 0.5); add(laugh(4, 540, 0.14, 0.45), 1.15, 0.5)
for i, t in enumerate(np.arange(0.15, 2.6, 0.19)): add(footstep(150 + 30 * (i % 3)), t + 0.03 * (i % 2), 0.12)
add(thunder(1.6), 1.75, 0.22)
add(doorcreak(0.6), 2.6, 0.22); add(chatter(2.2, 0.8), 2.75, 0.5)
for t in np.arange(2.8, 4.8, 0.21): add(footstep(170), t, 0.08)
add(slam() * 0.5, 4.95, 0.22); add(click(), 5.83, 0.45); add(hum(0.9, 60), 4.9, 0.05)
add(siren(2.2), 6.6, 0.16); add(thunder(1.4), 5.85, 0.18)
loopfill(lambda d: buzz(d, 120), 8.76, 10.7, 0.045); add(whisper(1.6), 9.0, 0.10)
add(whoosh(0.5), 10.62, 0.12); loopfill(lambda d: chatter(d, 0.7), 10.8, 15.2, 0.35)
add(sting(1.4), 15.24, 0.10); loopfill(lambda d: buzz(d, 220), 15.3, 16.5, 0.02)
add(heartbeat(), 16.9, 0.25); add(heartbeat(), 17.75, 0.22)
for t in [18.7, 19.25, 19.95, 20.55]: add(drip(), t, 0.22)
loopfill(lambda d: whir(d, 70, 72), 21.2, 24.9, 0.05); add(click(), 23.32, 0.3); add(static(0.12), 23.3, 0.06)
loopfill(ocean, 24.9, 30.0, 0.30); add(whoosh(0.8), 24.8, 0.12)
add(dive_whoosh(2.4), 27.6, 0.25); add(splash(), 29.85, 0.35); loopfill(underwater, 29.9, 30.6, 0.35)
add(click(), 30.5, 0.4); add(whoosh(0.6), 30.4, 0.1)
loopfill(underwater, 33.6, 37.6, 0.4); add(bubbles(3.8, 6), 33.7, 0.12); add(drone(3.8, 44), 33.7, 0.10)
loopfill(lambda d: drone(d, 40), 37.5, 41.0, 0.06); add(boot(0.8), 39.4, 0.18); add(growl(1.4, 40), 39.6, 0.16)
loopfill(underwater, 41.0, 43.2, 0.45); add(boom(1.0, 2.2) * 0.6, 41.1, 0.10)
for t in [43.6, 44.6, 45.6, 46.5]: add(heartbeat(), t, 0.2)
add(sting(1.4), 46.55, 0.09)
loopfill(lambda d: whir(d, 70, 72), 48.7, 52.7, 0.04); add(click(), 49.68, 0.45); loopfill(lambda d: buzz(d, 120), 49.7, 52.0, 0.035)
add(slam() * 0.5, 52.04, 0.25)
# --- transition 1: wind + water swell + title hit ---
add(dive_whoosh(2.7), 52.8, 0.30); loopfill(ocean, 53.4, 57.6, 0.25); add(thud(48, 0.25, 0.8), 54.5, 0.28)
# --- camada 1 ---
for t in np.arange(57.7, 61.0, 0.62): add(mstep(), t, 0.16)
add(whoosh(0.9), 61.0, 0.12); add(chime(1.6), 61.95, 0.16)  # chime 1/3
for i in range(5): add(whoosh(0.6), 63.3 + i * 0.35, 0.05)
add(whisper(2.2), 63.0, 0.10); add(laugh(3, 700, 0.15, 0.25), 64.2, 0.4)
for k in range(2): add(ring2(), 66.45 + k * 1.3, 0.45)
add(boot(0.7), 69.1, 0.14)
for t in np.arange(69.3, 70.8, 0.18): add(tick(0.8), t, 0.3)
add(alarm(0.18, 880), 70.84, 0.12); add(alarm(0.18, 880), 71.06, 0.12)
for t in np.arange(72.35, 75.1, 0.33): add(footstep(110), t, 0.14)
for t in [72.7, 73.5, 74.3]: add(mstep(), t, 0.14)
add(creak(0.9, 160), 73.0, 0.10); add(breath(0.8), 72.6, 0.12); add(breath(0.7), 73.8, 0.12)
add(zap(0.25), 75.6, 0.12); loopfill(lambda d: whir(d, 110, 130), 75.7, 79.5, 0.06); add(servo(0.4), 77.9, 0.12); add(servo(0.4), 78.6, 0.12)
loopfill(lambda d: buzz(d, 120), 79.6, 82.8, 0.03); add(creak(1.6, 120), 80.0, 0.10); add(click(), 81.6, 0.3)
add(servo(0.35, 380, 560), 83.35, 0.22); add(servo(0.35, 400, 600), 83.4, 0.16); add(servo(0.35, 360, 540), 83.43, 0.16)
for t in np.arange(85.95, 89.9, 0.7): add(mstep(), t, 0.12)
for k in range(3): add(beep(1400, 0.06), 86.0 + k * 1.35, 0.15); add(wrong(), 86.9 + k * 1.35, 0.06)
for t in np.arange(89.95, 91.2, 0.42): add(footstep(95), t, 0.18)
add(click(), 90.0, 0.35); add(laugh(4, 300, 0.16, 0.6), 92.2, 0.35); add(whoosh(0.6), 91.3, 0.1)
for i, t in enumerate(np.arange(93.95, 98.6, 0.24)): add(chip(330 if i % 2 else 392), t, 0.10)
add(chip(880, 0.12), 96.5, 0.14); add(chip(988, 0.12), 96.62, 0.14)
add(drone(2.0, 46), 98.7, 0.06); add(thud(60, 0.2, 0.6), 100.66, 0.25); add(click(), 100.64, 0.45)
loopfill(lambda d: chatter(d, 0.6), 101.5, 103.7, 0.3); add(laugh(3, 380, 0.15, 0.4), 102.4, 0.4)
for t in [103.9, 104.25, 104.6]: add(metal_step(240) * 0.5, t, 0.18)
add(laugh(3, 760, 0.12, 0.3), 105.05, 0.4)
add(boom(0.8, 1.8) * 0.6, 105.92, 0.10); add(whisper(2.4), 106.0, 0.12)
add(heartbeat(), 108.6, 0.22); add(heartbeat(), 109.4, 0.2)
add(whoosh(1.4, False), 111.0, 0.15)
add(ring2(), 112.9, 0.42); add(click(), 114.1, 0.3); add(static(0.6), 114.15, 0.04)
add(snap(), 117.26, 0.35); add(thud(70, 0.1), 117.3, 0.2)
loopfill(lambda d: drone(d, 42), 118.7, 121.7, 0.07); add(heartbeat(), 119.5, 0.16)
loopfill(lambda d: static(d), 121.7, 125.3, 0.035); add(creak(0.8, 200), 121.9, 0.12); add(creak(0.8, 230), 122.9, 0.12); add(snap(), 124.4, 0.22)
add(pop_sfx(), 125.62, 0.2)
add(click(), 126.52, 0.4); add(growl(0.7, 70), 126.6, 0.10)
add(static(0.5), 127.3, 0.05); add(laugh(2, 900, 0.1, 0.25), 127.5, 0.3)
loopfill(lambda d: static(d), 128.4, 130.5, 0.02)
loopfill(lambda d: chatter(d, 0.4), 130.6, 133.9, 0.18); add(sting(1.2), 133.05, 0.09)
loopfill(lambda d: buzz(d, 120), 133.95, 135.4, 0.05)
for k in range(3): add(ring(0.35), 135.45 + k * 0.6, 0.45)
for t in [137.63, 138.03, 138.43, 138.88]: add(knock(), t, 0.4)
mbox(TOREADOR, 139.5, 0.12, 0.0, 0.10)
add(scream(1.0), 141.14, 0.13); add(boom(0.45, 1.2), 141.14, 0.16); add(static(1.2), 141.2, 0.06)
loopfill(hiss, 142.5, 144.5, 0.07)
for t in [144.9, 145.7, 146.5]: add(drip(), t, 0.2)
add(drone(2.4, 40), 144.6, 0.06)
loopfill(lambda d: static(d), 147.0, 151.2, 0.025); add(whisper(1.5), 149.4, 0.10)
add(static(0.25), 151.2, 0.08); add(scream(1.4)[:int(1.2 * SR)] * 0.5, 151.3, 0.06); add(heartbeat(), 152.2, 0.2)
for t in [153.6, 154.2, 154.75, 155.2]: add(glitch(0.2), t, 0.08)
add(static(0.35), 156.0, 0.08)


# ================================ PART 2 (156.33 – 267.93) ================================
add(dive_whoosh(2.7), 156.4, 0.30); add(splash(), 157.35, 0.35); loopfill(underwater, 157.4, 161.4, 0.35); add(bubbles(3.5, 10), 157.4, 0.12); add(thud(48, 0.25, 0.8), 158.0, 0.28)
add(creak(1.2, 210), 161.6, 0.16); loopfill(lambda d: drone(d, 50), 161.4, 166.2, 0.05)
add(breath(0.9), 163.2, 0.14); add(breath(0.8, False), 164.3, 0.12); add(breath(0.9), 165.3, 0.14)
add(growl(1.4, 45), 166.3, 0.12); add(sting(1.2), 166.3, 0.08)
loopfill(lambda d: chatter(d, 0.8), 167.7, 171.4, 0.3); add(laugh(5, 520, 0.12, 0.5), 168.6, 0.45); add(laugh(4, 600, 0.13, 0.45), 170.2, 0.4)
for t in np.arange(171.6, 173.6, 0.3): add(footstep(140), t, 0.1)
add(laugh(6, 560, 0.11, 0.5), 172.4, 0.4); add(laugh(4, 640, 0.12, 0.4), 173.8, 0.4)
add(snap(), 175.12, 0.4); add(thud(50, 0.2, 0.8), 175.15, 0.25); add(scream(0.6), 175.1, 0.06)
add(heartbeat(), 176.6, 0.22); add(drone(3.0, 40), 176.4, 0.06)
add(whisper(2.0), 177.6, 0.08)
add(curtain(0.5), 181.2, 0.12)
loopfill(lambda d: drone(d, 44), 183.4, 186.2, 0.06); add(creak(1.4, 90), 184.4, 0.1)
add(laugh(3, 760, 0.13, 0.35), 186.8, 0.35)
add(whoosh(0.5), 191.2, 0.12); add(boot(0.6), 191.3, 0.12)
for t in np.arange(191.9, 193.0, 0.3): add(footstep(170), t, 0.1)
add(servo(0.4, 300, 450), 193.2, 0.14); add(pop_sfx(), 193.6, 0.12)
add(servo(0.5, 500, 300), 195.0, 0.2); add(metal_step(200) * 0.6, 195.4, 0.2); add(snap(), 196.42, 0.3)
add(sting(1.4), 196.9, 0.08); loopfill(lambda d: drone(d, 46), 196.9, 199.0, 0.05)
for t in [199.4, 199.9, 200.5, 201.0]: add(metal_step(260) * 0.4, t, 0.15)
add(servo(0.6, 350, 520), 201.9, 0.16); add(laugh(2, 700, 0.1, 0.2), 202.6, 0.3)
add(boom(0.8, 1.8) * 0.6, 203.5, 0.1); add(breath(1.0, False), 204.2, 0.12)
add(click(), 206.0, 0.3); add(metal_step(300) * 0.5, 207.6, 0.2)
add(servo(0.3, 600, 700), 209.7, 0.15); add(creak(0.8, 260), 210.0, 0.12)
loopfill(rain, 210.8, 213.7, 0.06); for_t = [211.1, 211.6, 212.2]
for t in for_t: add(drip(), t, 0.18)
add(servo(0.3, 300, 700), 212.9, 0.2)
for t in [213.86, 214.16, 214.41, 214.76, 215.16]: add(snap(), t, 0.22)
add(scream(1.2)[:int(1.0 * SR)] * 0.5, 214.0, 0.06)
for t in np.arange(216.8, 219.3, 0.32): add(footstep(100), t, 0.15)
add(whisper(2.4), 216.9, 0.12); add(laugh(3, 700, 0.15, 0.25), 218.0, 0.35)
add(curtain(0.6), 220.2, 0.12); add(servo(0.4, 400, 500), 220.8, 0.14)
for t in np.arange(221.75, 223.2, 0.3): add(snap(), t, 0.18)
add(scream(1.4)[:int(1.2 * SR)] * 0.5, 221.8, 0.07); add(whisper(1.5), 222.0, 0.08)
add(thud(60, 0.2, 0.6), 224.9, 0.2); for_t = [225.3, 225.8]
for t in for_t: add(drip(), t, 0.18)
add(drone(2.0, 38), 226.0, 0.06); add(boot(0.7), 227.0, 0.16); add(growl(1.2, 45), 227.2, 0.14)
add(creak(1.2, 110), 227.8, 0.14)
for t in np.arange(229.3, 230.5, 0.55): add(mstep(), t, 0.14)
add(zap(0.25), 230.7, 0.1); loopfill(lambda d: whir(d, 90, 100), 230.7, 233.1, 0.05)
loopfill(rain, 233.2, 238.8, 0.08)
for i, t in enumerate(np.arange(233.4, 235.4, 0.5)): add(chip(220 if i % 2 else 196, 0.12), t, 0.08)
add(breath(0.7), 236.0, 0.1); add(breath(0.7), 237.2, 0.1)
add(laugh(3, 820, 0.12, 0.3), 239.4, 0.35)
add(metal_step(240) * 0.4, 241.4, 0.14); add(laugh(2, 380, 0.15, 0.4), 242.0, 0.3)
loopfill(rain, 242.9, 245.3, 0.09)
for t in np.arange(243.0, 245.2, 0.45): add(footstep(95), t, 0.12)
add(whoosh(1.2), 245.4, 0.1); add(chime(1.6), 246.9, 0.12)  # chime 2/3
add(creak(0.7, 300), 248.0, 0.12); add(whoosh(0.8), 248.9, 0.1)
for i, t in enumerate(np.arange(250.5, 254.2, 0.75)): add(chip(523, 0.1), t, 0.1); add(chip(659, 0.1), t + 0.1, 0.1)
add(whisper(1.6), 254.5, 0.08)
for i in range(4): add(whoosh(0.4), 257.0 + i * 0.25, 0.06)
add(buzz(1.5, 120), 258.8, 0.04); add(glitch(0.2), 259.5, 0.06); add(glitch(0.2), 260.6, 0.06)
loopfill(lambda d: drone(d, 42), 261.6, 264.5, 0.06); add(heartbeat(), 262.4, 0.15); add(heartbeat(), 263.4, 0.12)
loopfill(lambda d: whir(d, 70, 72), 264.6, 267.9, 0.05); add(bubbles(3.2, 4), 264.7, 0.08); add(sting(1.4), 266.3, 0.07)


# ================================ PART 3 (267.93 – 346.6) ================================
add(dive_whoosh(2.7), 268.0, 0.30); loopfill(underwater, 268.0, 272.6, 0.38); add(bubbles(3.5, 9), 268.2, 0.12); add(thud(46, 0.25, 0.8), 269.6, 0.26)
for k in range(2): add(ring2(), 272.7 + k * 0.7, 0.42)
add(click(), 274.1, 0.3); add(static(1.6), 274.2, 0.03)
add(boot(0.6), 276.5, 0.12)
for t in np.arange(276.7, 279.2, 0.16): add(tick(0.7), t, 0.25)
for t in np.arange(279.3, 281.0, 0.11): add(tick(0.6), t, 0.22)
add(alarm(0.18, 880), 280.4, 0.1)
loopfill(lambda d: chatter(d, 0.9), 281.0, 284.0, 0.35); add(laugh(4, 640, 0.12, 0.45), 281.4, 0.4)
add(siren(1.6), 282.6, 0.12); add(pop_sfx(), 284.2, 0.2)
add(creak(0.5, 300), 285.0, 0.12); for_t = [284.8, 285.4, 286.0, 286.6, 287.2]
for t in for_t: add(footstep(90), t, 0.12)
add(doorcreak(0.6), 287.7, 0.12); loopfill(lambda d: chatter(d, 0.6), 287.8, 289.6, 0.2)
loopfill(underwater, 289.7, 292.7, 0.35); add(drone(3.0, 42), 289.7, 0.08)
add(sting(1.4), 292.8, 0.08); loopfill(lambda d: drone(d, 40), 295.1, 296.9, 0.06)
add(curtain(0.5), 297.2, 0.1); add(thud(90, 0.06, 0.3), 298.81, 0.4); add(knock(), 298.82, 0.2)
add(curtain(0.6), 300.8, 0.1); add(curtain(0.4), 301.6, 0.08)
loopfill(lambda d: whir(d, 70, 72), 304.0, 305.0, 0.06); add(bubbles(1.0, 6), 304.0, 0.1)
loopfill(lambda d: whir(d, 110, 120), 305.0, 309.8, 0.05); add(whisper(2.4), 306.4, 0.08)
add(bubbles(2.8, 4), 309.9, 0.08); add(heartbeat(), 311.0, 0.15)
add(whisper(1.4), 312.8, 0.1); add(laugh(3, 300, 0.16, 0.5), 313.3, 0.25)
add(typing(2.8), 314.3, 0.35)
add(whoosh(1.0), 317.2, 0.12); add(zap(0.25), 318.25, 0.1)
add(heartbeat(), 319.4, 0.15); add(pop_sfx(), 321.5, 0.15)
loopfill(underwater, 322.9, 325.8, 0.4); add(boom(1.0, 2.2) * 0.6, 323.4, 0.08)
loopfill(lambda d: drone(d, 55), 325.8, 336.0, 0.03); add(breath(0.8), 326.6, 0.1); add(breath(0.8), 328.2, 0.1)
add(curtain(0.5), 329.3, 0.1); add(breath(1.0, False), 330.4, 0.1)
add(whisper(1.6), 333.0, 0.08); add(pop_sfx(), 335.0, 0.15)
add(static(1.2), 336.4, 0.03); add(buzz(1.2, 180), 336.6, 0.03)
loopfill(lambda d: static(d), 338.8, 342.3, 0.02); add(whisper(2.0), 339.6, 0.08); add(click(), 339.0, 0.25)
loopfill(lambda d: drone(d, 60), 342.4, 344.4, 0.03)
loopfill(lambda d: buzz(d, 120), 344.5, 346.6, 0.03); for_t = [344.6, 345.6]
for t in for_t: add(beep(1100, 0.05), t, 0.12)


# ================================ PART 4 (346.6 – 454.3) ================================
add(dive_whoosh(2.7), 346.7, 0.30); loopfill(underwater, 346.7, 358.5, 0.38); add(bubbles(3.5, 9), 346.9, 0.12); add(thud(44, 0.25, 0.8), 348.3, 0.26)
add(drone(7.0, 38), 351.5, 0.07); add(bubbles(1.2, 30), 358.6, 0.2); add(breath(0.9), 358.7, 0.12)
add(fire(4.0), 359.6, 0.10); add(creak(1.0, 90), 361.4, 0.1); add(thud(60, 0.2, 0.6), 362.2, 0.15)
add(boot(0.8), 363.6, 0.12); add(whoosh(0.6), 366.4, 0.12)
for t in [367.7, 368.4, 369.2]: add(click(), t, 0.15)
add(zap(0.2), 369.9, 0.08); loopfill(lambda d: whir(d, 120, 130), 370.6, 373.4, 0.04); add(whisper(2.0), 371.0, 0.08)
add(static(1.5), 373.6, 0.03); add(whoosh(1.2), 373.7, 0.1); add(glitch(0.3), 375.1, 0.08)
add(glitch(0.25), 377.2, 0.09); add(laugh(3, 340, 0.16, 0.5), 377.4, 0.3)
for t in [378.6, 379.6, 380.6]: add(glitch(0.15), t, 0.05)
add(glitch(0.25), 381.8, 0.08); add(laugh(2, 320, 0.18, 0.5), 382.0, 0.25)
add(whisper(3.0), 382.6, 0.12); add(static(0.4), 387.1, 0.05); add(laugh(3, 900, 0.1, 0.3), 387.6, 0.25)
loopfill(lambda d: static(d), 388.4, 393.4, 0.02); add(glitch(0.2), 390.1, 0.06); add(glitch(0.2), 391.8, 0.06)
add(whoosh(0.6), 393.4, 0.12)
loopfill(lambda d: whir(d, 70, 72), 395.0, 406.5, 0.05)
add(sting(1.4), 398.0, 0.07); add(buzz(2.0, 120), 400.0, 0.03)
for t in np.arange(402.0, 404.2, 0.7): add(mstep(), t, 0.1)
for i, t in enumerate([404.26, 404.83, 405.40, 405.97]): add(scream(0.5), t, 0.08); add(static(0.15), t + 0.45, 0.05)
add(creak(1.2, 100), 406.8, 0.12); add(glitch(0.15), 407.9, 0.06)
add(drone(3.4, 45), 409.0, 0.07); add(whisper(2.0), 409.6, 0.08)
add(thud(50, 0.25, 0.7), 412.8, 0.22); add(static(0.3), 413.8, 0.04)
add(glitch(0.3), 415.0, 0.05); add(growl(2.6, 50), 416.8, 0.12); add(laugh(3, 760, 0.14, 0.3), 418.2, 0.25)
add(curtain(0.6), 419.8, 0.1); add(click(), 422.52, 0.3)
add(metal_step(180) * 0.6, 423.2, 0.16); add(creak(1.0, 140), 424.0, 0.1); add(metal_step(160) * 0.6, 426.7, 0.18); add(thud(70, 0.1), 428.1, 0.15)
loopfill(lambda d: drone(d, 50), 428.6, 431.3, 0.05)
for t in np.arange(431.4, 433.6, 0.35): add(footstep(170), t, 0.08)
add(splash() * 0.6, 434.2, 0.3); add(dive_whoosh(1.2), 434.4, 0.2); add(whoosh(0.6), 435.1, 0.1)
loopfill(lambda d: chatter(d, 0.9), 435.4, 438.6, 0.3); add(laugh(4, 620, 0.12, 0.45), 436.6, 0.4)
for t in np.arange(438.7, 440.9, 0.55): add(footstep(110), t, 0.1)
add(sting(1.2), 441.1, 0.07); add(laugh(3, 300, 0.17, 0.5), 444.0, 0.25)
add(servo(0.6, 300, 420), 444.8, 0.12)
add(glitch(0.3), 446.6, 0.06); add(drone(4.4, 42), 446.6, 0.06); add(glitch(0.2), 448.8, 0.05)
add(creak(1.0, 110), 451.2, 0.14); add(static(0.25), 452.4, 0.05); add(laugh(2, 330, 0.2, 0.4), 453.4, 0.2)


# ================================ PART 5 (454.3 – 501.07) ================================
add(dive_whoosh(2.7), 454.4, 0.30); loopfill(underwater, 454.4, 460.5, 0.42); add(bubbles(3.5, 8), 454.6, 0.1); add(thud(42, 0.3, 0.9), 456.0, 0.26)
add(drone(2.0, 36), 458.9, 0.08); add(whoosh(0.6), 460.4, 0.12)
for k in range(4): add(alarm(0.25, 700), 462.95 + k * 0.6, 0.06)
for t in [463.3, 464.0]: add(mstep(), t, 0.1)
add(boot(0.6), 465.2, 0.16); add(growl(0.9, 60), 465.4, 0.1)
for t in [466.2, 466.9, 467.6, 468.3]: add(metal_step(260) * 0.4, t, 0.15)
add(servo(0.8, 300, 420), 469.0, 0.12); add(servo(0.8, 420, 300), 470.0, 0.12)
add(drone(2.4, 50), 471.6, 0.05)
add(breath(1.0, False), 474.4, 0.12); add(breath(1.0, False), 475.6, 0.12)
add(servo(0.4, 600, 800), 477.4, 0.15); add(growl(1.6, 48), 477.8, 0.16); add(static(0.4), 478.0, 0.04)
for t in np.arange(478.7, 481.0, 0.62): add(mstep(), t, 0.11)
add(laugh(3, 520, 0.13, 0.4), 481.2, 0.25); add(laugh(3, 300, 0.16, 0.5), 482.3, 0.2)
add(laugh(3, 380, 0.15, 0.4), 483.6, 0.25); add(glitch(0.4), 485.8, 0.08); add(growl(0.9, 55), 486.0, 0.1)
loopfill(underwater, 486.6, 489.6, 0.4)
loopfill(lambda d: buzz(d, 120), 489.7, 493.7, 0.03); add(creak(1.2, 110), 490.6, 0.1)
add(glitch(0.4), 494.0, 0.08); add(boot(0.5), 494.5, 0.12)
add(whisper(2.4), 495.3, 0.1); add(sting(1.4), 497.3, 0.07)
for k in range(5): add(click(), 498.0 + k * 0.455, 0.15)
add(static(0.3), 500.8, 0.06)

# ================================ (part 6 follows) ================================

mix += 0.3 * np.sin(2 * np.pi * 50 * np.arange(N) / SR) * 0.004
mix[:] = np.tanh(mix * 1.15) * 0.8
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open('out/sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(np.stack([pcm, pcm], 1).tobytes())
print('ok', np.abs(mix).max())
