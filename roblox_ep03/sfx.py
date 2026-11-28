"""EP03 'O reflexo no espelho' — SFX timeline with the Roblox library (roblox_base/rsfx.py; nothing from the FNAF kit).
Glassy mirror sounds (shimmer/ripple) mark the mirror moments; light cartoon sounds elsewhere; ambience very low; max 3 bells."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'roblox_base'))
from rsfx import *
import numpy as np
def drill(d=0.9):  # tiny dentist drill (high whine, very low)
    t = tt(d); return norm(fade(osc(2400 + 300 * np.sin(2 * np.pi * 9 * t), d) * 0.5 + 0.3 * bp(np.random.default_rng(4).standard_normal(len(t)), 2000, 6000), 0.05, 0.1), 0.4)
def glass_ripple(d=1.0):  # watery glass shimmer for the mirror surface
    t = tt(d); s = sum(osc(f * (1 + 0.02 * np.sin(2 * np.pi * 7 * t)), d) * a for f, a in [(1320, 0.5), (1980, 0.35), (2640, 0.2)]) * np.exp(-t / 0.35)
    return norm(fade(s + 0.4 * sweep_noise(d, 3000, 1200, q=0.9), 0.005, 0.2), 0.6)
T = Timeline(108.4); A = T.add
A(birds(4.7, 1), 0.0, 0.04, 0.3); A(room_tone(3.0), 4.7, 0.04); A(room_tone(1.6), 8.5, 0.05); A(room_tone(3.0), 12.0, 0.04); A(birds(2.2, 2), 20.0, 0.035)
A(room_tone(6.0), 29.5, 0.04); A(birds(1.6, 3), 39.9, 0.035); A(birds(4.9, 4), 47.9, 0.035); A(room_tone(4.0), 52.8, 0.04); A(room_tone(8.0), 74.7, 0.05); A(room_tone(9.0), 98.4, 0.05)
# opening: swish + steps; the shop mirror
A(swish(0.3), 0.0, 0.22); A(run_steps(3, 0.42, 'stone', 1), 0.1, 0.12, -0.2); A(glass_ripple(0.8), 1.1, 0.06, 0.3)
A(run_steps(5, 0.4, 'stone', 6), 1.5, 0.05, 0.4); A(plop(0.25), 2.3, 0.05, 0.4); A(whoosh(0.35), 2.55, 0.1); A(twinkle(2093), 4.1, 0.1)          # "espelho" — sparkle 1
# morning: "pediu demissão" — paper rustle; "saiu andando do espelho" — glass ripple + step out
A(blip((660, 990)), 4.75, 0.1); A(page_flip(0.3, 1), 6.0, 0.16); A(fail(), 6.3, 0.05)
A(run_steps(3, 0.22, 'wood', 10), 7.0, 0.08); A(glass_ripple(1.2), 7.58, 0.14); A(magic_rise(0.6), 7.4, 0.06); A(run_steps(3, 0.3, 'wood', 13), 7.8, 0.1)
# homework at night / dentist / apology / teacher / mayor
A(scribble(2.2, 4), 8.6, 0.08); A(snore_cartoon(1.1), 10.9, 0.08)
A(drill(0.9), 12.3, 0.03); A(plop(), 13.6, 0.06); A(fail(), 13.7, 0.04)                                   # drill / plate
A(blip((523, 392)), 14.6, 0.08)                                                                                  # bow
A(scribble(1.5, 5), 15.3, 0.08); A(snore_cartoon(1.0), 16.3, 0.06); A(blip((880, 660)), 18.5, 0.08); A(pop(420, 1000), 19.0, 0.1)
A(crowd_laugh(1.4, 6, 9), 20.4, 0.03); A(whoosh(0.3), 22.46, 0.06); A(clock_fast(1.2, 12), 24.6, 0.07); A(page_flip(0.25, 6), 24.6, 0.08)
# "o melhor" / "nunca reclamou" / "até hoje" (box drops)
A(blip((784, 1175)), 26.0, 0.1); A(run_steps(4, 0.35, 'wood', 20), 27.5, 0.06); A(plop(0.35), 29.25, 0.18)
# bathroom
A(blip((660, 880)), 29.6, 0.08); A(scribble(1.2, 8), 30.7, 0.05)                                                     # brushing (soft bristles)
A(whoosh(0.5, up=False), 31.95, 0.08); A(glass_ripple(0.6), 32.2, 0.05); A(swish(0.25), 33.4, 0.1); A(whoosh(0.5), 35.05, 0.08)
A(door_open(), 37.75, 0.16); A(run_steps(4, 0.35, 'stone', 30), 37.9, 0.08)
# days
A(page_flip(0.3, 2), 38.9, 0.16); A(run_steps(4, 0.36, 'stone', 40), 39.95, 0.07); A(school_bell(0.7), 40.4, 0.035)
A(pop(500, 1200), 41.7, 0.08); A(pop(560, 1300), 42.2, 0.07); A(crowd_laugh(1.4, 10, 3), 43.4, 0.09); A(chord_bell(), 45.0, 0.07)   # bravo — bell 2
A(page_flip(0.3, 3), 46.9, 0.16); A(whoosh(0.35, up=False), 48.4, 0.06); A(pop(300, 600), 50.3, 0.06); A(run_steps(3, 0.2, 'stone', 50), 51.5, 0.07); A(crowd_laugh(1.0, 3, 11), 52.1, 0.05)
A(page_flip(0.3, 4), 52.9, 0.16); A(blip((523, 659)), 54.3, 0.07); A(run_steps(5, 0.4, 'wood', 60), 55.7, 0.07); A(whoosh(0.5, up=False), 57.0, 0.04)
# clues
A(pop(420, 1000), 58.6, 0.1); A(scribble(1.5, 9), 60.1, 0.09); A(blip((880, 1320)), 62.0, 0.06); A(page_flip(0.4, 7), 64.2, 0.12)
A(swish(0.3), 66.25, 0.1); A(pop(420, 1000), 68.7, 0.08)
for k in range(4): A(plop(0.22), 70.1 + k * 0.42, 0.06)                                                          # heartbeat on the right side
A(tick(), 72.1, 0.08); A(tick(False), 72.6, 0.07); A(clock_fast(1.6, 6), 73.0, 0.05)
# night: door, the question
A(door_open(), 75.6, 0.12); A(run_steps(2, 0.4, 'wood', 70), 75.9, 0.06); A(whoosh(0.4), 77.75, 0.05); A(pop(420, 1000), 79.9, 0.08)
# flashback: the swap
A(magic_rise(0.8), 80.3, 0.07); A(glass_ripple(1.3), 81.95, 0.16); A(sparkle(0.6, 1760, 6, seed=3), 82.0, 0.08); A(cartoon_laugh(4, 820, 5), 83.0, 0.05); A(run_steps(5, 0.25, 'stone', 80), 83.1, 0.06)
A(blip((1046, 784)), 85.2, 0.07); A(clock_fast(1.4, 5), 86.95, 0.04)
# reveal
A(whoosh(0.6, up=False), 88.4, 0.08); A(sparkle(0.6, 1568, 7, down=True, seed=5), 89.6, 0.12); A(glass_ripple(0.8), 89.8, 0.08)    # "eu era o reflexo"
A(scribble(1.0, 10), 92.7, 0.06); A(drill(0.7), 93.95, 0.025); A(blip((523, 392)), 95.2, 0.07); A(glass_ripple(1.6), 96.7, 0.1)
A(plop(0.3), 98.6, 0.08); A(whoosh(0.35), 99.4, 0.07)
A(door_open(), 100.9, 0.14); A(run_steps(5, 0.22, 'wood', 90), 101.0, 0.1)
A(glass_ripple(1.0), 102.1, 0.07); A(swish(0.3), 103.1, 0.06); A(glass_ripple(1.6), 105.0, 0.14); A(magic_rise(1.6), 106.5, 0.06); A(chord_bell((659, 784, 988, 1318)), 107.0, 0.05)  # final — bell 3
print('peak', T.save('out/sfx.wav'))
