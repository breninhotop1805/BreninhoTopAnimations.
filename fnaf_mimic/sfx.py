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
# opening: light click + hum + whoosh, William's sinister breath
add(click(), 0.0, 0.3); add(buzz(0.7, 110), 0.02, 0.08); loopfill(lambda d: drone(d, 44), 0.0, 1.4, 0.07); add(whoosh(0.4), 0.6, 0.12); add(breath(0.6, False), 0.75, 0.08)
# four deaths: snap / fire / fire / collapse
add(snap(), 1.39, 0.18); add(static(0.1), 1.38, 0.05); add(fireloop(0.35), 1.7, 0.06); add(static(0.1), 1.70, 0.05); add(fireloop(0.35), 2.01, 0.06); add(static(0.1), 2.01, 0.05); add(thud(70, 0.14, 0.45), 2.42, 0.12)
# "e ele sempre volta": rise + eyes
add(creak(0.8, 150), 2.75, 0.09); add(heartbeat(0.55), 3.57, 0.2); loopfill(lambda d: drone(d, 40), 3.88, 6.5, 0.05)
add(glitch(0.25), 5.67, 0.07); add(glitch(0.15), 5.95, 0.05); add(pop_sfx(), 6.12, 0.2)
# the Mimic reveal
add(whir(1.2, 60, 90), 6.6, 0.06); add(zap(0.25), 8.8, 0.08); add(chatter_teeth(0.45), 8.85, 0.12)
# Edwin's workshop
add(typing(1.4), 9.3, 0.08); add(tick(), 10.4, 0.12); add(whoosh(0.3), 11.45, 0.08); add(ding(), 13.36, 0.05)
add(whir(0.6, 120, 180), 13.6, 0.05); add(snap(), 14.95, 0.08); add(chatter_teeth(0.35), 15.45, 0.08)
for k, tt in enumerate([15.95, 16.2, 16.45]): add(footstep(90), tt, 0.1); add(mstep(), tt + 0.03, 0.04)
add(chatter_teeth(0.4), 17.62, 0.1)
# tragedy
loopfill(lambda d: drone(d, 38), 17.86, 22.4, 0.06); add(thud(60, 0.16, 0.5), 18.6, 0.07); add(breath(1.0, False), 19.4, 0.07); add(sting(1.0), 20.24, 0.05)
add(whir(0.4, 140, 90), 21.8, 0.05)
# no love / pain / rage / hurt
add(creak(0.5, 220), 22.6, 0.07); add(growl(0.9, 50), 24.58, 0.07); add(growl(0.6, 44), 24.96, 0.08); add(whoosh(0.35), 25.7, 0.12); add(scratch(), 25.78, 0.1)
# Ruin: Cassie, the voice, the lure
loopfill(lambda d: drone(d, 52), 26.76, 33.0, 0.05)
for_steps = [27.0, 27.6, 28.2, 28.8]
for tt in for_steps: add(footstep(110), tt, 0.07)
add(click(), 26.85, 0.18); add(breath(0.8, True), 29.4, 0.08); add(pop_sfx(), 29.97, 0.18)
add(chatter_teeth(0.6), 31.0, 0.06); add(creak(0.6, 260), 32.0, 0.06)
# pensa / qualquer pessoa / pizzaria
add(tick(), 33.73, 0.12)
for tt in [34.6, 35.1, 35.6, 36.1, 36.6]: add(mstep(), tt, 0.05)
add(glitch(0.2), 35.2, 0.05); add(whoosh(0.5), 36.8, 0.06)
# the legend, refuses to die
loopfill(lambda d: drone(d, 42), 38.05, 41.8, 0.06); add(buzz(0.5, 100), 38.1, 0.06); add(heartbeat(0.55), 39.96, 0.2); add(laugh(3, 260, 0.15, 0.4), 41.4, 0.1)
# who? exactly!
add(pop_sfx(), 43.52, 0.2); add(laugh(6, 300, 0.13, 0.5), 43.9, 0.18); add(chatter_teeth(0.5), 43.95, 0.08)
# iceberg dive + end card
add(whoosh(1.4), 44.6, 0.12); add(lowpass(noise(2.4), 0.03) * 2, 44.9, 0.06); add(chime(1.4), 46.3, 0.07); add(boom(0.8, 1.6) * 0.5, 47.2, 0.06)
add(whoosh(0.5), 49.2, 0.1); add(pop_sfx(), 49.5, 0.18)
mix[:] = np.tanh(mix * 1.15) * 0.8
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16); os.makedirs('out', exist_ok=True)
with wave.open('out/sfx.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(np.stack([pcm, pcm], 1).tobytes())
print('ok', np.abs(mix).max())
