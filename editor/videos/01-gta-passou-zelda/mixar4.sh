#!/bin/bash
# Video 1 v3: clique do Minecraft na maioria dos cortes secos (alto), dano de vez em quando.
S=/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad
R=/home/user/BreninhoTopAnimations./editor/sfx
K="$S/kit/Kit GTA 6 com Claude/assets/sfx"
cd $S/v1
printf "file 'p_%s.mp4'\n" 0 9.6 19.23 29.45 44.05 > parts/lista.txt
ffmpeg -v error -y -f concat -safe 0 -i parts/lista.txt -c copy video4_sem_audio.mp4
C="$R/corte_clique_limpo.wav"; D="$R/corte_dano_limpo.wav"
# arquivo|tempo|ganho|tipo (c = clique/dano: reforcado e limitado pra soar alto sem distorcer)
SONS=(
"$K/whoosh-cinematico.wav|0.07|0.84|n"
"$K/pop.wav|1.20|0.7|n"
"$K/pop.wav|2.40|0.7|n"
"$K/whoosh.wav|4.20|0.84|n"
"$C|5.02|1.0|n"
"$C|7.52|1.0|n"
"$K/whoosh.wav|9.58|0.77|n"
"$C|12.07|1.0|n"
"$K/pop.wav|15.42|0.63|n"
"$D|16.92|0.85|n"
"$K/pop.wav|19.30|0.63|n"
"$K/whoosh.wav|22.70|0.77|n"
"$R/flash_1.wav|28.10|0.7|n"
"$K/whoosh-cinematico.wav|29.12|0.84|n"
"$C|30.84|1.0|n"
"$K/glitch.wav|34.40|0.63|n"
"$C|35.00|1.0|n"
"$D|37.94|0.85|n"
"$C|44.04|1.0|n"
"$C|47.28|1.0|n"
"$K/whoosh.wav|51.42|0.84|n"
"$C|54.26|1.0|n"
)
IN=(-i video4_sem_audio.mp4 -i in/narracao.mp3); FC=""; L="[nar]"; i=2
for s in "${SONS[@]}"; do
  IFS='|' read -r f t g k <<< "$s"; IN+=(-i "$f")
  ms=$(python3 -c "print(int($t*1000))")
  lim=""; [ "$k" = "c" ] && lim=",alimiter=limit=0.7:attack=1:release=30:level=false"
  FC+="[$i:a]aresample=48000,aformat=channel_layouts=stereo,volume=$g$lim,adelay=$ms|$ms[s$i];"; L+="[s$i]"; i=$((i+1))
done
n=$((i-1))
FC+="[1:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur=56.6[nar];${L}amix=inputs=$n:normalize=0:duration=first,alimiter=limit=0.99:attack=1:release=20:level=false[a]"
ffmpeg -v error -y "${IN[@]}" -filter_complex "$FC" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart "$1"
