#!/bin/bash
# Video 1 v2: junta as partes, narracao intocada + efeitos (mais altos, sempre abaixo da voz)
S=/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad
R=/home/user/BreninhoTopAnimations./editor/sfx
K="$S/kit/Kit GTA 6 com Claude/assets/sfx"
cd $S/v1
printf "file 'p_%s.mp4'\n" 0 9.6 19.23 29.45 44.05 > parts/lista.txt
ffmpeg -v error -y -f concat -safe 0 -i parts/lista.txt -c copy video2_sem_audio.mp4
SONS=(
"$K/whoosh-cinematico.wav|0.07|0.84"
"$K/pop.wav|1.20|0.7"
"$K/pop.wav|2.40|0.7"
"$K/whoosh.wav|4.20|0.84"
"$R/corte_dano.wav|5.00|3.5"
"$K/whoosh.wav|9.58|0.77"
"$R/corte_clique.wav|12.05|0.7"
"$K/pop.wav|15.42|0.63"
"$K/pop.wav|19.30|0.63"
"$K/whoosh.wav|22.70|0.77"
"$R/flash_1.wav|28.10|0.7"
"$K/whoosh-cinematico.wav|29.12|0.84"
"$K/pop.wav|32.55|0.63"
"$K/glitch.wav|34.40|0.63"
"$R/corte_dano.wav|37.92|3.5"
"$R/corte_clique.wav|44.02|0.7"
"$K/whoosh.wav|51.42|0.84"
)
IN=(-i video2_sem_audio.mp4 -i in/narracao.mp3); FC=""; L="[nar]"; i=2
for s in "${SONS[@]}"; do
  IFS='|' read -r f t g <<< "$s"; IN+=(-i "$f")
  ms=$(python3 -c "print(int($t*1000))")
  FC+="[$i:a]aresample=48000,aformat=channel_layouts=stereo,volume=$g,adelay=$ms|$ms[s$i];"; L+="[s$i]"; i=$((i+1))
done
n=$((i-1))
FC+="[1:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur=56.6[nar];${L}amix=inputs=$n:normalize=0:duration=first[a]"
ffmpeg -v error -y "${IN[@]}" -filter_complex "$FC" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart "$1"
