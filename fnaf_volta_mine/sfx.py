"""SFX track for "POR QUE O SPRINGTRAP SEMPRE VOLTA" (remake). No music.
Rules (CLAUDE.md): harsh sounds (fire, chime, scream/boom, metal steps, thuds, static/glitch) kept low; no repeated "bling";
each sound marks one moment; strong but tasteful opening. Bus is limited + volume=0.2 in mux.sh."""
import numpy as np, wave
from sfx_lib import *

def drone(dur, f=48):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t + 0.4 * np.sin(2 * np.pi * 0.3 * t))
    return x * np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6)
def loopfill(fn, t0, t1, gain): add(fn(t1 - t0), t0, gain)

# --- intro: flicker buzz, low drone, limping metal steps, punch whoosh, "?" pop
add(static(0.25), 0.0, 0.07); add(buzz(0.6, 120), 0.05, 0.08); loopfill(lambda d: drone(d, 46), 0.0, 2.3, 0.07)
for k, tt in enumerate([0.12, 0.5, 0.9, 1.2]): add(mstep(), tt, 0.09 - 0.01 * k)
add(whoosh(0.4), 0.42, 0.14); add(creak(0.6, 160), 1.45, 0.1); add(pop_sfx(), 1.66, 0.22)
# --- FNaF 3 fire + the guard's gasp
add(whoosh(0.6), 2.55, 0.12); loopfill(fireloop, 2.75, 3.58, 0.07); add(growl(0.8, 50), 2.9, 0.07)
add(click(), 3.6, 0.22); add(breath(0.5, True), 3.68, 0.14); add(pop_sfx(), 3.72, 0.2)
# --- FNaF 6 maze fire, Scraptrap steps out
loopfill(fireloop, 4.42, 5.9, 0.07); add(mstep(), 5.2, 0.08); add(mstep(), 5.6, 0.07); add(growl(0.7, 44), 5.55, 0.06)
# --- "eu sempre volto" + echo cuts
add(whoosh(0.5), 5.92, 0.09); add(heartbeat(0.55), 6.78, 0.22); add(heartbeat(0.55), 7.25, 0.12)
for tt in (7.70, 8.14, 8.34): add(static(0.12), tt, 0.06)
add(glitch(0.25), 8.36, 0.07)
# --- William: normal guy?  fire around him, "?" pops
add(whoosh(0.5), 9.0, 0.07); add(pop_sfx(), 10.1, 0.2)
loopfill(fireloop, 10.5, 12.82, 0.06); add(crackle(0.5), 11.85, 0.08); add(breath(0.6, True), 11.7, 0.1)
add(pop_sfx(), 13.48, 0.2)
# --- "A verdade é que William Afton deixou de ser humano"
loopfill(lambda d: drone(d, 41), 14.0, 16.7, 0.06); add(whoosh(0.35), 14.95, 0.13); add(glitch(0.3), 16.38, 0.08); add(hiss(0.6), 16.4, 0.04)
# --- walks to the Spring Bonnie suit
for tt in (16.8, 17.15, 17.5, 17.85): add(footstep(90), tt, 0.13)
add(knock(), 18.12, 0.12)
# --- hunting the kids
loopfill(lambda d: chatter(d, 0.8), 18.72, 20.3, 0.12); add(laugh(3, 640, 0.12, 0.3), 18.9, 0.1)
for tt in (18.8, 19.25, 19.7, 20.15): add(footstep(70), tt, 0.1)
add(heartbeat(0.55), 19.88, 0.18)
# --- Remanescente
add(pop_sfx(), 20.55, 0.2); add(whoosh(0.7), 21.15, 0.1); loopfill(lambda d: whir(d, 80, 120), 21.2, 22.3, 0.05)
loopfill(lambda d: drone(d, 58), 22.22, 24.1, 0.05); add(whoosh(0.3), 23.05, 0.1)
add(snap(), 25.2, 0.1); add(snap(), 25.45, 0.07); loopfill(lambda d: whir(d, 100, 160), 24.2, 26.0, 0.04)
add(whoosh(1.2), 26.1, 0.08); add(chime(1.4), 27.36, 0.07)
# --- madness / injection
add(creak(0.6, 200), 28.0, 0.08); add(tick(), 28.6, 0.15); add(tick(), 29.0, 0.12)
add(laugh(6, 300, 0.14, 0.5), 29.42, 0.18)
loopfill(lambda d: drone(d, 44), 31.46, 34.4, 0.05); add(ring(0.35), 32.1, 0.05)
add(zap(0.25), 34.9, 0.1); add(glitch(0.4), 34.95, 0.07); add(sting(1.2), 34.95, 0.06)
# --- strong? soul stuck in the metal, agony
add(mstep(), 35.5, 0.07); add(whoosh(0.3), 36.9, 0.1)
add(heartbeat(0.55), 38.05, 0.2); add(heartbeat(0.55), 38.55, 0.14); loopfill(lambda d: drone(d, 38), 37.22, 41.2, 0.06)
add(growl(1.0, 48), 40.8, 0.08)
# --- became the monster he created
add(whoosh(0.8), 41.3, 0.07); add(sting(1.0), 42.3, 0.06)
# --- collapse, mind into a computer virus
loopfill(fireloop, 43.72, 46.38, 0.06); add(creak(0.8, 140), 44.8, 0.08); add(thud(70, 0.14, 0.45), 45.62, 0.12); add(thud(55, 0.16, 0.5), 45.9, 0.08)
add(whoosh(1.4), 46.7, 0.08); add(boot(0.6), 48.4, 0.08); add(static(0.6), 48.42, 0.05)
# --- Glitchtrap
add(glitch(0.4), 49.06, 0.1); add(chime(1.2), 49.5, 0.06); add(pop_sfx(), 51.04, 0.2)
add(whoosh(0.5), 51.9, 0.07)

mix[:] = np.tanh(mix * 1.15) * 0.8
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
import os; os.makedirs('out', exist_ok=True)
with wave.open('out/sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(np.stack([pcm, pcm], 1).tobytes())
print('ok', np.abs(mix).max())
