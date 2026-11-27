"""Remove the silences of the narration (pauses become tight, natural gaps): any pause >= MIN s below the noise
threshold is shortened to GAP s (half kept on each side, 8 ms fades) -> no dead air, no clicks.
usage: python3 cut_silence.py in.mp3 out.wav"""
import sys, subprocess, numpy as np, wave
SR = 48000; MIN = 0.16; GAP = 0.09
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
a = np.frombuffer(raw, np.float32).copy(); hop = SR // 100
env = np.sqrt(np.convolve(a ** 2, np.ones(SR // 50) / (SR // 50), mode='same'))[::hop]
thr = max(np.percentile(env, 99) * 10 ** (-38 / 20), 1e-4); quiet = env < thr
segs = []; i = 0; n = len(quiet)
while i < n:
    if quiet[i]:
        j = i
        while j < n and quiet[j]: j += 1
        if (j - i) / 100 >= MIN: segs.append((i / 100, j / 100))
        i = j
    else: i += 1
keep = []; t0 = 0.0; total = len(a) / SR
for s, e in segs:
    if s <= 0.01: t0 = max(t0, e - 0.03); continue          # leading silence: start right before the first word
    if e >= total - 0.01: keep.append((t0, s + 0.12)); t0 = None; break
    keep.append((t0, s + GAP / 2)); t0 = e - GAP / 2
if t0 is not None: keep.append((t0, total))
out = []; f = int(0.008 * SR); ramp = np.linspace(0, 1, f, dtype=np.float32)
for s, e in keep:
    c = a[int(s * SR):int(e * SR)].copy()
    if len(c) > 2 * f: c[:f] *= ramp; c[-f:] *= ramp[::-1]
    out.append(c)
y = np.concatenate(out); pcm = (np.clip(y, -1, 1) * 32767).astype(np.int16)
with wave.open(sys.argv[2], 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(f'silences cut: {len(segs)}  {total:.2f}s -> {len(y) / SR:.2f}s')
