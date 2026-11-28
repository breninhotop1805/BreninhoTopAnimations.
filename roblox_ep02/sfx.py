"""EP02 'Amigo imaginário' — SFX timeline (NEW Roblox library roblox_base/rsfx.py; nothing from the FNAF kit).
Light cartoon/game sounds under the voice: each one marks a specific moment, no repetition back-to-back, ambience very low,
max 3 bell/chime moments. Times = video timeline (silence-cut voice)."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'roblox_base'))
from rsfx import *
T = Timeline(112.4); A = T.add
# --- ambience beds (very low): street birds, bedroom room tone, school yard, plaza breeze
A(birds(9.5, 1), 0.0, 0.05, 0.3); A(room_tone(3.0), 6.5, 0.05); A(birds(4.5, 2), 9.5, 0.04, -0.3)
A(room_tone(3.5), 19.3, 0.04); A(birds(3.0, 3), 25.7, 0.04, 0.4); A(room_tone(2.8), 34.2, 0.05)
A(birds(2.6, 4), 50.5, 0.035); A(birds(5.0, 6), 55.6, 0.035, -0.4); A(birds(6.0, 7), 64.3, 0.035, 0.3); A(breeze(10.0), 70.0, 0.03); A(breeze(12.0), 80.0, 0.03); A(breeze(11.0), 92.0, 0.03)
# 1 opening: swish in + Bolota's bouncy steps + sneaker steps
A(swish(0.3), 0.0, 0.25); A(boing(190), 0.22, 0.12, 0.2); A(boing(175), 0.82, 0.10, 0.2); A(run_steps(3, 0.4, 'stone', 1), 0.12, 0.12, -0.2)
A(whoosh(0.35), 1.0, 0.12); A(twinkle(2093), 2.55, 0.14)                               # "de verdade" — sparkle 1
A(sparkle(0.6, 2093, 6, down=True, seed=1), 3.62, 0.14, 0.3)                          # "somem": the friend dissolves
A(run_steps(4, 0.3, 'stone', 5), 4.6, 0.10, 0.3)
# morning
A(blip((660, 990)), 6.6, 0.12); A(whoosh(0.3, up=False), 7.4, 0.08); A(pop(360, 900), 7.9, 0.16); A(swish(0.25), 8.25, 0.12)
A(run_steps(6, 0.33, 'stone', 9), 9.6, 0.07, -0.3)                                      # everybody walking
A(plop(), 12.2, 0.18); A(run_steps(8, 0.35, 'stone', 20), 13.2, 0.08, 0.2); A(pop(500, 1300), 14.92, 0.12, 0.3)
A(swish(0.25), 15.95, 0.1); A(big_snore(1.4), 17.45, 0.14); A(big_snore(1.2), 18.75, 0.12)      # dragon asleep
A(step('wood', 3), 19.4, 0.1); A(scribble(0.6, 4), 19.6, 0.07)                          # chalk
for i, t in enumerate([22.04, 22.34, 22.57]): A(pop(400 + 150 * i, 1000 + 300 * i), t, 0.16)   # 1, 2, 3
A(page_flip(), 23.25, 0.16); A(fail(), 25.32, 0.1)                                      # no question 4
A(swish(0.25), 25.75, 0.1); A(blip((784, 1175)), 26.88, 0.12)                           # "Bolota"
A(boing(150, 0.5), 27.7, 0.2); A(pop(300, 700, 0.12), 28.42, 0.12); A(hum(1.3), 29.1, 0.07)
A(magic_rise(0.8), 30.0, 0.08); A(run_steps(5, 0.36, 'stone', 30), 30.7, 0.06)          # flashback
A(run_steps(3, 0.32, 'stone', 40), 33.3, 0.09); A(plop(), 36.38, 0.2); A(boing(120, 0.4), 36.42, 0.1)
A(hum(1.0, 52), 37.1, 0.04); A(snore_cartoon(1.3), 38.45, 0.16)                         # fake snore
A(page_flip(0.3, 2), 40.45, 0.18); A(magic_rise(0.6), 42.3, 0.05); A(page_flip(0.3, 3), 43.62, 0.18); A(whoosh(0.4), 45.9, 0.1); A(page_flip(0.3, 4), 46.93, 0.18)
A(sparkle(0.5, 1760, 5, down=True, seed=2), 48.6, 0.08)
A(swish(0.3), 49.9, 0.16); A(run_steps(6, 0.24, 'stone', 50), 50.6, 0.08); A(boing(200, 0.3), 51.0, 0.07)
A(scribble(1.4, 6), 52.1, 0.12); A(scribble(0.7, 7), 53.72, 0.12); A(scribble(0.6, 8), 54.5, 0.1)
A(whoosh(0.3), 55.7, 0.1); A(crowd_laugh(1.8, 10, 3), 57.65, 0.1)                       # the whole school laughs
A(whoosh(0.5, up=False), 59.9, 0.07)
A(door_open(), 60.9, 0.16); A(school_bell(0.8), 61.25, 0.05); A(run_steps(4, 0.35, 'stone', 60), 61.5, 0.09)
A(run_steps(4, 0.35, 'stone', 70), 62.95, 0.08); A(swish(0.25), 64.4, 0.08); A(run_steps(5, 0.35, 'stone', 80), 64.6, 0.08)
A(blip((587, 784)), 67.3, 0.09); A(pop(420, 1000), 69.1, 0.12)                          # "espera" / "?"
A(run_steps(4, 0.45, 'stone', 90), 69.9, 0.07); A(plop(), 71.6, 0.14)
A(clock_fast(2.0, 9), 77.6, 0.07)                                                        # time flies
A(magic_rise(1.2), 81.1, 0.06); A(twinkle(1760), 84.48, 0.1)                            # fading / smiling
A(whoosh(0.6), 91.6, 0.08); A(page_flip(0.5, 5), 92.4, 0.06)                             # months go by
A(blip((1046, 1568)), 97.33, 0.1)                                                        # wink
A(sparkle(1.1, 1568, 9, seed=7), 98.05, 0.16); A(magic_rise(1.0), 98.0, 0.05)            # disappears — sparkle 2
A(whoosh(0.3, up=False), 100.3, 0.05); A(pop(420, 1000), 102.45, 0.12)
A(magic_rise(0.7), 103.0, 0.07); A(run_steps(5, 0.36, 'stone', 99), 103.5, 0.05); A(boing(150, 0.5), 106.0, 0.18); A(swish(0.3), 106.73, 0.1); A(hum(1.0), 107.45, 0.07)
A(pop(300, 800, 0.12), 108.95, 0.12); A(whoosh(1.0), 110.25, 0.08); A(chord_bell(), 110.6, 0.08)   # final — bell 3
print('peak', T.save('out/sfx.wav'))
