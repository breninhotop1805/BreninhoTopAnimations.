#!/bin/bash
# Junta video + narracao intocada + efeitos (sempre abaixo da voz)
S=/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad
R=/home/user/BreninhoTopAnimations./editor/sfx
K="$S/kit/Kit GTA 6 com Claude/assets/sfx"
cd $S/v1
# formato: arquivo|tempo(s)|ganho
SONS=(
"$K/whoosh.wav|0.62|0.30"
"$R/corte_dano.wav|5.00|1.6"
"$R/corte_clique.wav|12.05|0.30"
"$R/flash_1.wav|28.10|0.30"
"$K/whoosh-cinematico.wav|29.12|0.35"
"$R/corte_dano.wav|37.92|1.6"
"$R/corte_clique.wav|44.02|0.30"
"$K/whoosh.wav|51.42|0.32"
)
IN=(-i video_sem_audio.mp4 -i in/narracao.mp3); FC=""; L="[1:a]"
i=2
for s in "${SONS[@]}"; do
  IFS='|' read -r f t g <<< "$s"; IN+=(-i "$f")
  ms=$(python3 -c "print(int($t*1000))")
  FC+="[$i:a]aresample=48000,aformat=channel_layouts=stereo,volume=$g,adelay=$ms|$ms[s$i];"; L+="[s$i]"; i=$((i+1))
done
n=$((i-1))
FC+="[1:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur=56.6[nar];${L/\[1:a\]/[nar]}amix=inputs=$n:normalize=0:duration=first[a]"
ffmpeg -v error -y "${IN[@]}" -filter_complex "$FC" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$1"
