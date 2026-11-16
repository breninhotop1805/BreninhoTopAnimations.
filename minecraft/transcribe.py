# Transcrição palavra-a-palavra SÓ para sincronia (nunca vira legenda)
import json, wave, sys, numpy as np, sherpa_onnx
M=sys.argv[1]
r=sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f"{M}/encoder.int8.onnx",decoder=f"{M}/decoder.int8.onnx",
  joiner=f"{M}/joiner.int8.onnx",tokens=f"{M}/tokens.txt",model_type="nemo_transducer",num_threads=4)
w=wave.open("audio/n16.wav"); x=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float32)/32768
words=[]
# chunks de ~20s com sobreposição simples por pausas
step=16000*20; off=0
while off<len(x):
  seg=x[off:off+step+16000*2] if off+step<len(x) else x[off:]
  s=r.create_stream(); s.accept_waveform(16000,seg); r.decode_stream(s); res=s.result
  cur=None
  for tok,t in zip(res.tokens,res.timestamps):
    T=t+off/16000
    if T>=(off+step)/16000 and off+step<len(x): break
    if tok.startswith(" ") or cur is None:
      if cur: words.append(cur)
      cur=[round(T,2),tok.strip()]
    else: cur[1]+=tok
  if cur: words.append(cur)
  off+=step
json.dump(words,open("audio/words.json","w"),ensure_ascii=False)
for t,wd in words: print(f"{t:6.2f} {wd}")
