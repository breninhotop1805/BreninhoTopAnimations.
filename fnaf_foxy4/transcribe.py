import json
from faster_whisper import WhisperModel
m = WhisperModel('small', device='cpu', compute_type='int8')
import subprocess, numpy as np
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'assets/narracao.mp3', '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
segs, _ = m.transcribe(audio, language='pt', word_timestamps=True, beam_size=5)
W = []
for s in segs:
    for w in s.words: W.append([round(w.start, 2), round(w.end, 2), w.word.strip(), round(w.probability, 2)])
json.dump(W, open('assets/words.json', 'w'), ensure_ascii=False)
print(' '.join(f'{w[2]}[{w[0]:.2f}]' for w in W))
