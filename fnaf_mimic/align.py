# Forced alignment without an ASR model: syllable-weighted timeline over voiced frames, anchored at the real pauses.
import numpy as np, re, json
db = np.load('/tmp/db.npy'); fr = 0.01
voiced = (db > np.percentile(db, 12) + 3).astype(float)
T0 = np.argmax(voiced > 0) * fr; T1 = (len(voiced) - np.argmax(voiced[::-1] > 0)) * fr
cum = np.cumsum(voiced) * fr
txt = open('script.txt').read()
toks = re.findall(r"[\wÀ-ú]+|[.,?:!]", txt)
rep = {'FNAF': 'fi nafi', 'William': 'uí liam', 'Afton': 'af ton', 'Murray': 'mã rei', 'Edwin': 'ed uin', 'Ruin': 'ru in', 'Mimic': 'mí mic', 'iceberg': 'ais berg', 'Mímico': 'mí mi co'}
def syl(w): w = rep.get(w, w).lower(); return max(1, len(re.findall(r'[aeiouáéíóúâêôãõày]+', w.replace('qu', 'q').replace('gu', 'g'))))
words = []; bounds = []; S = 0
for t in toks:
    if t in '.,?:!': bounds.append((S, t)); continue
    words.append([t, S, syl(t)]); S += syl(t)
# gaps
q = db < np.percentile(db, 12) + 3; gaps = []; i = 0
while i < len(q):
    if q[i]:
        j = i
        while j < len(q) and q[j]: j += 1
        if (j - i) * fr >= 0.07: gaps.append((i * fr, j * fr))
        i = j
    else: i += 1
gaps = [g for g in gaps if g[0] > T0 + 0.1 and g[1] < T1 - 0.1]
# voiced-time -> real time
def v2t(v): return np.searchsorted(cum, v) * fr
V = cum[-1]
anchors = [(0, T0), (S, T1)]
for b, p in bounds:
    est = v2t(V * b / S)
    best = min(gaps, key=lambda g: abs((g[0] + g[1]) / 2 - est)) if gaps else None
    if best and abs((best[0] + best[1]) / 2 - est) < (0.9 if p in '.?' else 0.6): anchors.append((b, best[0], best[1]))
# dedupe monotonic
an = sorted(anchors, key=lambda a: a[0]); clean = [an[0]]
for a in an[1:]:
    if a[1] > clean[-1][-1] + 0.15: clean.append(a)
# piecewise: syllable s -> time, interpolating in voiced-time between anchors (start of speech after a gap = gap end)
pts = []
for a in clean:
    if len(a) == 3: pts.append((a[0], a[2], a[1]))   # syll index, start time after gap, end time before gap
    else: pts.append((a[0], a[1], a[1]))
def s2t(s):
    for k in range(len(pts) - 1):
        a, b = pts[k], pts[k + 1]
        if a[0] <= s <= b[0]:
            ta, tb = a[1], b[2]; va, vb = cum[int(ta / fr)], cum[min(len(cum) - 1, int(tb / fr))]
            f = (s - a[0]) / max(1e-6, b[0] - a[0]); return float(v2t(va + (vb - va) * f))
    return float(T1)
out = [[round(s2t(w[1]), 2), round(s2t(w[1] + w[2]), 2), w[0], 1.0] for w in words]
json.dump(out, open('assets/words.json', 'w'), ensure_ascii=False)
print(len(clean), 'anchors'); print(' '.join(f'{w[2]}[{w[0]:.2f}]' for w in out))
# refine: snap each word start to the nearest energy onset within ±0.14 s (keeps order)
s = np.convolve(db, np.ones(3) / 3, 'same'); d = np.diff(s, prepend=s[0])
on = [i * fr for i in range(2, len(d) - 1) if d[i] > 2.5 and d[i] >= d[i - 1] and d[i] >= d[i + 1]]
on = np.array(on); prev = 0
for w in out:
    c = on[(np.abs(on - w[0]) < 0.14) & (on > prev + 0.06)]
    if len(c): w[0] = round(float(c[np.argmin(np.abs(c - w[0]))]), 2)
    prev = w[0]
json.dump(out, open('assets/words.json', 'w'), ensure_ascii=False)
print('refined'); print(' '.join(f'{w[2]}[{w[0]:.2f}]' for w in out))
