"""Word-level transcription for perfect subtitle/scene sync.
usage: python3 transcribe.py assets/narracao.mp3  -> assets/words.json  [[start, end, word, prob], ...]
1) faster-whisper large-v3-turbo with word timestamps (much better than 'small' on fast AI voices)
2) onset refinement: every word start is snapped to the real attack of the sound (RMS envelope rise) within -120..+80 ms,
   so the subtitle appears exactly when the word is heard; ends are clipped to the next start."""
import json, sys, subprocess, numpy as np
from faster_whisper import WhisperModel
src = sys.argv[1] if len(sys.argv) > 1 else 'assets/narracao.mp3'; out = sys.argv[2] if len(sys.argv) > 2 else 'assets/words.json'
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
m = WhisperModel('large-v3-turbo', device='cpu', compute_type='int8')
segs, _ = m.transcribe(audio, language='pt', word_timestamps=True, beam_size=5, vad_filter=False)
W = [[w.start, w.end, w.word.strip(), w.probability] for s in segs for w in s.words]
hop = 160; env = np.sqrt(np.convolve(audio ** 2, np.ones(400) / 400, mode='same'))[::hop]   # 10 ms RMS envelope
floor = np.percentile(env, 10)
def onset(t):
    a, b = max(0, int((t - 0.12) * 100)), min(len(env) - 1, int((t + 0.08) * 100)); seg = env[a:b + 1]
    if len(seg) < 3: return t
    pk = seg.max(); thr = floor + 0.3 * (pk - floor)
    for i in range(1, len(seg)):
        if seg[i] >= thr and seg[i - 1] < thr: return (a + i) / 100
    return t
for w in W: w[0] = round(onset(w[0]), 3)
for i in range(len(W) - 1): W[i][1] = round(min(W[i][1], W[i + 1][0]), 3)
W = [[w[0], round(w[1], 3), w[2], round(w[3], 2)] for w in W]
json.dump(W, open(out, 'w'), ensure_ascii=False)
print(' '.join(f'{w[2]}[{w[0]:.2f}]' for w in W))
