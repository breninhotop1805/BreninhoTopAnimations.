import re, sys
src = open('src/shots.js').read(); shots = [(float(a), b) for a, b in re.findall(r"at\((\d+\.\d+), '([a-z_0-9]+)'", src)]
for k in sys.argv[1:]:
    i = [b for a, b in shots].index(k); t0 = shots[i][0]; t1 = shots[i + 1][0] if i + 1 < len(shots) else 999; seen = set()
    for l in open('out/chk_all.txt'):
        m = re.search(r't=([\d.]+) (.*)', l)
        if m and t0 <= float(m.group(1)) < t1:
            key = re.sub(r'[\d.,-]+', '#', m.group(2))[:50]
            if key not in seen: seen.add(key); print(k, '|', l.strip()[6:240])
