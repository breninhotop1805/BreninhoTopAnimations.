"""EP04 'Na minha escola' — SFX timeline with the Roblox library (roblox_base/rsfx.py; nothing from the FNAF kit).
Each sound marks one moment; school ambience very low; magic shimmer on every colour change; max 3 strong bells
(hat turns green 7.4 / her hair revealed 94.0 / the final 118.3)."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'roblox_base'))
from rsfx import *
import numpy as np
R = np.random.default_rng(44)
def water_amb(d=3.0):  # indoor pool: soft lapping + far splashes
    t = tt(d); y = lp(R.standard_normal(len(t)), 700) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t)); y += 0.5 * bp(R.standard_normal(len(t)), 1500, 4000) * (np.sin(2 * np.pi * 0.31 * t) > 0.92)
    return norm(fade(y, 0.3, 0.4), 0.6)
def whistle(d=0.55):  # coach whistle (pea whistle trill), short
    t = tt(d); f = 2900 + 120 * np.sin(2 * np.pi * 38 * t); return norm(fade(osc(f, d) * (0.8 + 0.2 * np.sin(2 * np.pi * 38 * t)) + 0.15 * bp(R.standard_normal(len(t)), 2500, 4000), 0.01, 0.08), 0.5)
def gavel(d=0.35):  # wooden knock
    t = tt(d); return norm(fade(lp(R.standard_normal(len(t)), 900) * np.exp(-t / 0.03) + 0.6 * osc(190, d) * np.exp(-t / 0.08), 0.001, 0.1), 0.9)
def chalk_snap(d=0.12):
    t = tt(d); return norm(fade(bp(R.standard_normal(len(t)), 2500, 7000) * np.exp(-t / 0.015), 0.0005, 0.03), 0.8)
def murmur(d=2.0):  # crowd murmur (kids whispering together)
    t = tt(d); y = bp(R.standard_normal(len(t)), 250, 1600) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 3.1 * t) * np.sin(2 * np.pi * 1.7 * t + 1))); return norm(fade(y, 0.2, 0.3), 0.5)
def whisper(d=1.2):
    t = tt(d); y = bp(R.standard_normal(len(t)), 2200, 6500) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 4.3 * t))); return norm(fade(y, 0.08, 0.15), 0.5)
def heart(d=0.5): return plop(0.18)
D = 121.8; T = Timeline(D); A = T.add
# ambiences (very low): yard birds, class room tone, lab hum, cafeteria, hall, stage hum, pool water
A(birds(4.8, 1), 0.0, 0.04, 0.3); A(room_tone(6.0), 4.84, 0.04); A(hum(2.0, 60), 10.57, 0.03); A(room_tone(4.3), 13.86, 0.05); A(room_tone(4.0), 18.16, 0.04)
A(birds(4.3, 2), 23.74, 0.035); A(room_tone(9.0), 28.94, 0.04); A(birds(2.2, 3), 37.86, 0.03); A(hum(7.2, 55), 40.07, 0.025); A(birds(9.5, 4), 45.25, 0.035)
A(room_tone(17.3), 57.34, 0.035); A(birds(4.2, 5), 75.32, 0.03); A(room_tone(4.2), 78.71, 0.035); A(water_amb(20.8), 84.02, 0.05); A(water_amb(8.6), 107.86, 0.05); A(birds(9.0, 6), 112.72, 0.04)
# 1 opening: swish + sneakers on the yard
A(swish(0.3), 0.0, 0.22); A(run_steps(3, 0.42, 'stone', 1), 0.1, 0.1, -0.1)
# 2-4 falling in love: two pops for the hearts, the purple hair shimmer, a blink blip
A(pop(500, 1200), 1.3, 0.09, 0.2); A(pop(600, 1400), 1.5, 0.07, -0.2); A(magic_rise(0.8), 2.3, 0.08); A(sparkle(0.6, 1760, 6, seed=2), 2.6, 0.07); A(blip((1046, 1318)), 4.2, 0.06)
# 5 math class: chalk writing
A(scribble(1.8, 4), 5.0, 0.07, -0.3)
# 6 "verde-esmeralda": rise + bell 1 + startle pop
A(magic_rise(0.7), 6.85, 0.1); A(twinkle(2093), 7.4, 0.12); A(pop(300, 800), 7.5, 0.08)
# 7 hiding the hat: swish + giggles
A(swish(0.25), 9.0, 0.1); A(crowd_laugh(1.2, 4, 7), 9.4, 0.03)
# 8-9 lab: bubbling flask, year counter ticking
for k in range(6): A(pop(240 + 60 * k, 600 + 90 * k, 0.07), 10.7 + k * 0.28, 0.05, 0.2)
A(clock_fast(1.1, 16), 12.7, 0.06)
# 10-12 cafeteria: tray clinks, eyes blip, awkward silence plop
A(tick(True), 14.2, 0.06); A(tick(False), 14.6, 0.05); A(blip((880, 1175)), 15.45, 0.05); A(plop(0.25), 17.0, 0.07)
# 13-14 popular boy: steps + hearts; 7 colour pops rising
A(run_steps(5, 0.4, 'stone', 6), 18.2, 0.06); A(pop(500, 1200), 18.6, 0.06)
for k in range(7): A(pop(380 + 70 * k, 900 + 140 * k, 0.08), 19.73 + k * 0.36, 0.08, -0.4 + 0.13 * k)
# 15 Valentine's: page + heart pops; 16 everyone in caps: crowd steps, punch on "boné"; 17 teachers: boing
A(page_flip(0.3, 2), 22.45, 0.12); A(pop(520, 1250), 22.8, 0.06); A(run_steps(8, 0.25, 'stone', 20), 23.8, 0.05); A(swish(0.22), 24.6, 0.08); A(boing(260, 0.4), 25.6, 0.07)
# 18 "comigo nunca": confident blip down (head shake)
A(blip((784, 523)), 27.6, 0.06)
# 19-21 the teacher stops writing, turns, drops the chalk (snap on the floor)
A(scribble(0.9, 8), 29.0, 0.08, -0.2); A(whoosh(0.35), 31.7, 0.08); A(whoosh(0.35, up=False), 32.6, 0.05); A(chalk_snap(), 33.52, 0.14); A(chalk_snap(), 33.6, 0.08, 0.3)
# 22-24 the whole class looks: murmur; "verde": shimmer; "brilhando": soft sparkle (not a bell)
A(murmur(2.4), 34.1, 0.04); A(whoosh(0.4), 34.05, 0.06); A(magic_rise(0.6), 36.5, 0.06); A(sparkle(0.7, 1568, 8, seed=5), 37.2, 0.06)
# 25 aerial: airy whoosh; 26-29 stage: three spotlight clicks, low hums
A(whoosh(0.7), 37.9, 0.06); A(tick(True), 40.12, 0.09); A(tick(True), 40.24, 0.08); A(tick(True), 40.36, 0.08); A(whoosh(0.3, up=False), 42.1, 0.05); A(blip((660, 880)), 43.7, 0.05); A(pop(420, 900), 44.4, 0.05)
# 30 first day: shy steps; 31 recess: bell + kids laughing; 32 gavel BANG on "tribunal"
A(run_steps(4, 0.42, 'stone', 30), 45.3, 0.06); A(school_bell(0.8), 47.2, 0.04); A(crowd_laugh(1.0, 6, 3), 47.6, 0.04); A(gavel(), 49.11, 0.16); A(gavel(), 49.35, 0.07)
# 33-37 suspects board + bets
A(pop(420, 1000), 50.4, 0.06); A(whoosh(0.35), 52.1, 0.06); A(plop(0.22), 53.4, 0.1); A(plop(0.22), 53.65, 0.08); A(blip((880, 1320)), 55.4, 0.06)
for k, tk in enumerate([56.17, 56.3, 56.43, 57.1]): A(pop(400 + 80 * k, 1000 + 100 * k, 0.07), tk, 0.08)
# 38-39 the bully's stare: steps + tension swish
A(run_steps(5, 0.42, 'stone', 40), 57.4, 0.05); A(swish(0.3), 58.8, 0.05)
# 40-44 next day, the bouquet, "parar", the cap off (yellow shimmer), girlfriend hearts
A(blip((523, 659)), 60.2, 0.05); A(whoosh(0.3), 61.3, 0.06); A(pop(300, 700), 62.15, 0.07); A(murmur(1.0), 62.3, 0.03); A(whoosh(0.4, up=False), 63.4, 0.04)
A(swish(0.3), 65.4, 0.07); A(sparkle(0.6, 1318, 6, seed=7), 66.4, 0.06); A(pop(500, 1200), 67.7, 0.06); A(pop(600, 1400), 67.95, 0.05)
# 45 two photos fall off the board
A(whoosh(0.35, up=False), 69.65, 0.06); A(whoosh(0.35, up=False), 69.85, 0.05); A(plop(0.2), 70.3, 0.06)
# 46-47 whispers, "?" pops
A(whisper(1.3), 70.9, 0.05, -0.3); A(pop(400, 900), 72.35, 0.06); A(pop(450, 1000), 72.5, 0.05, 0.3)
# 48-53 the beanie: rustles, heat, jumping jacks, principal, passing by
A(page_flip(0.25, 4), 73.8, 0.06); A(breeze(1.9), 75.4, 0.04); A(tick(True), 75.5, 0.04)
for k in range(4): A(plop(0.15), 77.4 + k * 0.43, 0.05)
A(blip((659, 494)), 78.9, 0.05); A(run_steps(5, 0.4, 'stone', 50), 80.1, 0.05); A(swish(0.22), 82.3, 0.05)
# 54-58 the pool: whistle, sign punch, the girl at the edge, everyone watching (murmur)
A(whistle(0.55), 84.5, 0.07); A(swish(0.25), 87.1, 0.06); A(page_flip(0.25, 5), 89.6, 0.05); A(murmur(1.6), 91.6, 0.04)
# 59-61 she takes it off: rise + bell 2 + sparkle; orbit swishes
A(magic_rise(0.8), 93.3, 0.09); A(chord_bell((784, 988, 1175, 1568)), 94.0, 0.09); A(sparkle(0.6, 1760, 7, seed=9), 94.2, 0.06); A(swish(0.3), 96.2, 0.05); A(swish(0.3), 96.6, 0.05)
# 62-65 he stands up; the eyes (heartbeat + two blips)
A(whoosh(0.35), 98.1, 0.05); A(heart(), 99.9, 0.08); A(heart(), 100.25, 0.07); A(blip((1175, 1568)), 101.65, 0.06); A(blip((784, 587)), 102.35, 0.06)
# 66-67 flashback: reverse whoosh, hearts, her hair changes, beanie plop
A(pop(450, 1000), 103.3, 0.05); A(whoosh(0.6, up=False), 104.8, 0.07); A(pop(520, 1250), 105.2, 0.05); A(magic_rise(0.6), 105.35, 0.06); A(plop(0.25), 106.9, 0.07)
# 68-70 silence at the pool; the teacher's smile (two soft heart pops)
A(plop(0.2), 109.0, 0.03); A(pop(500, 1200), 111.9, 0.06); A(pop(600, 1400), 112.1, 0.05)
# 71-76 the next day: steps, her steps, the hat lifted slowly, green shimmer + bell 3, the beanie thrown in the bin, cheering
A(run_steps(4, 0.45, 'stone', 60), 113.7, 0.05); A(run_steps(3, 0.32, 'stone', 70), 115.35, 0.06); A(magic_rise(1.4), 116.4, 0.05)
A(magic_rise(0.6), 117.9, 0.07); A(twinkle(2349), 118.3, 0.1); A(whoosh(0.5), 119.6, 0.08); A(plop(0.3), 120.55, 0.12); A(crowd_laugh(1.2, 8, 5), 120.6, 0.04)
print('peak', T.save('out/sfx.wav'))
