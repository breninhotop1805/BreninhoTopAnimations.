#!/bin/bash
# full-video QA (NORENDER) in 3 processes -> out/chk_all.txt ; summary per shot
cd "$(dirname "$0")"; D=${DUR:-121.8}; pids=()
for i in 0 1 2; do a=$(python3 -c "print(round($D*$i/3*30)/30)"); b=$(python3 -c "print(round($D*($i+1)/3*30)/30)"); node render.mjs check $a $b > out/chk_$i.log 2>&1 & pids+=($!); done
for p in "${pids[@]}"; do wait $p; done; cat out/chk_0.log out/chk_1.log out/chk_2.log | grep -v "LOG \(fem\|masc\|bloco\) " > out/chk_all.txt
python3 - <<'PY'
import re, collections
L = open('out/chk_all.txt').read().splitlines(); print(len([l for l in L if 'LOG' in l]), 'logs')
shots = []; import json
src = open('src/shots.js').read(); shots = [(float(a), b) for a, b in re.findall(r"at\((\d+\.\d+), '([a-z_0-9]+)'", src)]
def shot(t):
    n = shots[0][1]
    for a, b in shots:
        if t >= a: n = b
    return n
C = collections.Counter()
for l in L:
    if 'pageerror' in l or 'Error' in l: print(l[:300]); continue
    m = re.search(r't=([\d.]+) (.*)', l)
    if m: kind = re.sub(r'[\d.,-]+', '', m.group(2))[:90]; C[(shot(float(m.group(1))), kind)] += 1
for (s, k), n in sorted(C.items(), key=lambda z: [a for a, b in shots].index(next(a for a, b in shots if b == z[0][0]))): print(f'{s:14s} {n:4d}  {k}')
PY
