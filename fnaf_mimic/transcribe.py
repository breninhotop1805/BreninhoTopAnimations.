import json
from faster_whisper import WhisperModel
m = WhisperModel('small', device='cpu', compute_type='int8')
segs, _ = m.transcribe('assets/narracao.mp3', language='pt', word_timestamps=True, beam_size=5)
W = []
for s in segs:
    for w in s.words: W.append([round(w.start, 2), round(w.end, 2), w.word.strip(), round(w.probability, 2)])
json.dump(W, open('assets/words.json', 'w'), ensure_ascii=False)
print(' '.join(f'{w[2]}[{w[0]:.2f}]' for w in W))
