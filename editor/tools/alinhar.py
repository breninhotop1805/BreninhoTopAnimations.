# Alinhamento forcado palavra a palavra (wav2vec2 portugues + CTC forced_align).
import json, re, subprocess, sys, unicodedata
import numpy as np, torch, torchaudio
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor

AUDIO = sys.argv[1]; WORDS = sys.argv[2]; OUT = sys.argv[3]
MODEL = "jonatasgrosman/wav2vec2-large-xlsr-53-portuguese"

UN = {0:"zero",1:"um",2:"dois",3:"tres",4:"quatro",5:"cinco",6:"seis",7:"sete",8:"oito",9:"nove",10:"dez",11:"onze",
      12:"doze",13:"treze",14:"quatorze",15:"quinze",16:"dezesseis",17:"dezessete",18:"dezoito",19:"dezenove"}
DZ = {2:"vinte",3:"trinta",4:"quarenta",5:"cinquenta",6:"sessenta",7:"setenta",8:"oitenta",9:"noventa"}
CT = {1:"cento",2:"duzentos",3:"trezentos",4:"quatrocentos",5:"quinhentos",6:"seiscentos",7:"setecentos",8:"oitocentos",9:"novecentos"}
def ext(n):
    if n < 20: return UN[n]
    if n < 100: d, u = divmod(n, 10); return DZ[d] + ("" if u == 0 else " e " + UN[u])
    if n == 100: return "cem"
    if n < 1000: c, r = divmod(n, 100); return CT[c] + ("" if r == 0 else " e " + ext(r))
    m, r = divmod(n, 1000); pre = "mil" if m == 1 else ext(m) + " mil"
    return pre + ("" if r == 0 else (" e " if r < 100 or r % 100 == 0 else " ") + ext(r))

words = json.load(open(WORDS))
disp = [w["w"] for w in words]
def norm(w):
    w = w.lower()
    if re.fullmatch(r"\d+[.,!?]*", w): w = ext(int(re.sub(r"\D", "", w)))
    w = re.sub(r"[^a-záàâãéêíóôõúüç ]", "", w)
    return w.strip()

proc = Wav2Vec2Processor.from_pretrained(MODEL); model = Wav2Vec2ForCTC.from_pretrained(MODEL).eval()
vocab = proc.tokenizer.get_vocab()
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", AUDIO, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout
wav = torch.from_numpy(np.frombuffer(raw, np.float32).copy())
with torch.inference_mode():
    iv = proc(wav.numpy(), sampling_rate=16000, return_tensors="pt").input_values
    em = torch.log_softmax(model(iv).logits, -1)[0]
ratio = wav.shape[0] / em.shape[0] / 16000.0   # segundos por quadro de emissao

# sequencia de tokens: palavras separadas por "|"
tok_ids, owner = [], []
for wi, w in enumerate(disp):
    nw = norm(w)
    for ci, sub in enumerate(nw.split()):
        for ch in sub:
            if ch in vocab: tok_ids.append(vocab[ch]); owner.append(wi)
        if not (wi == len(disp)-1 and ci == len(nw.split())-1):
            tok_ids.append(vocab["|"]); owner.append(-1)
blank = vocab.get("<pad>", 0)
aligned, scores = torchaudio.functional.forced_align(em.unsqueeze(0), torch.tensor([tok_ids], dtype=torch.int32), blank=blank)
aligned = aligned[0].tolist()
# mapear cada token alvo para os quadros em que ele foi emitido
spans = []; ti = -1; prev = blank
for fi, a in enumerate(aligned):
    if a != blank and (a != prev or (ti >= 0 and fi > 0 and aligned[fi-1] == blank)):
        ti += 1; spans.append([fi, fi])
    elif a != blank and ti >= 0:
        spans[ti][1] = fi
    prev = a
out = []
for wi, w in enumerate(disp):
    idx = [k for k, o in enumerate(owner) if o == wi and k < len(spans)]
    if not idx: out.append({"w": w, "s": None, "e": None}); continue
    s = spans[idx[0]][0]*ratio; e = (spans[idx[-1]][1] + 1)*ratio
    out.append({"w": w, "s": round(s, 3), "e": round(e, 3)})
json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=0)
diffs = [abs(o["s"] - w["s"]) for o, w in zip(out, words) if o["s"] is not None]
print("palavras:", len(out), "| diferenca media vs whisper:", round(float(np.mean(diffs))*1000), "ms | max:", round(float(np.max(diffs))*1000), "ms")
