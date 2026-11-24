#!/bin/bash
# Video 2: junta partes -> mixa narracao + efeitos -> legenda -> master com musica
set -e
S=/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad
R=/home/user/BreninhoTopAnimations./editor/sfx
K="$S/kit/Kit GTA 6 com Claude/assets/sfx"
cd $S/v5
PD=parts
printf "file 'p_%s.mp4'\n" 0 8.06 15.33 22.03 30.27 37.85 44.28 > $PD/lista.txt
ffmpeg -v error -y -f concat -safe 0 -i $PD/lista.txt -c copy video_sem_audio.mp4
ffmpeg -v error -y -i "$K/whoosh.wav" -af areverse,volume=1.0 rewind.wav
C="$R/corte_clique_limpo.wav"; D="$R/corte_dano_limpo.wav"
SONS=(
"$C|0.52|1.45|c"
"$C|1.30|1.45|c"
"$C|2.54|1.45|c"
"$C|3.54|1.45|c"
"$C|6.56|1.45|c"
"$C|10.34|1.45|c"
"$C|12.22|1.45|c"
"$C|13.73|1.45|c"
"$C|17.57|1.45|c"
"$C|21.31|1.45|c"
"$C|24.37|1.45|c"
"$C|25.57|1.45|c"
"$C|27.99|1.45|c"
"$C|31.73|1.45|c"
"$C|33.43|1.45|c"
"$C|36.19|1.45|c"
"$C|37.85|1.45|c"
"$C|41.10|1.45|c"
"$C|44.28|1.45|c"
"$C|46.24|1.45|c"
"$C|52.90|1.45|c"
"$K/whoosh-cinematico.wav|0.00|1.0|n"
"$K/glitch.wav|5.38|0.95|n"
"$K/whoosh.wav|8.00|0.95|n"
"$K/whoosh.wav|15.28|0.9|n"
"$K/whoosh.wav|18.50|0.9|n"
"$K/pop.wav|20.75|0.9|n"
"$K/whoosh.wav|21.92|1.0|n"
"$K/whoosh-cinematico.wav|26.40|1.0|n"
"rewind.wav|30.02|1.1|n"
"$K/whoosh.wav|34.40|0.9|n"
"$K/notificacao.wav|35.25|0.95|n"
"$K/pop.wav|40.00|0.84|n"
"$K/riser.wav|39.90|0.9|n"
"$R/flash_2.wav|41.94|0.93|n"
"$K/whoosh.wav|48.36|1.12|n"
)
IN=(-i video_sem_audio.mp4 -i ../v2/in/narracao.mp3); FC=""; L="[nar]"; i=2
for s in "${SONS[@]}"; do
  IFS='|' read -r f t g k <<< "$s"; IN+=(-i "$f")
  ms=$(python3 -c "print(int($t*1000))")
  lim=""; [ "$k" = "c" ] && lim=",alimiter=limit=0.89:attack=0.5:release=40:level=false"
  FC+="[$i:a]aresample=48000,aformat=channel_layouts=stereo,volume=$g$lim,adelay=$ms|$ms[s$i];"; L+="[s$i]"; i=$((i+1))
done
n=$((i-1))
FC+="[1:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur=54.25[nar];${L}amix=inputs=$n:normalize=0:duration=first,alimiter=limit=0.99:attack=1:release=20:level=false[a]"
ffmpeg -v error -y "${IN[@]}" -filter_complex "$FC" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 320k -ar 48000 -t 54.25 -movflags +faststart video_mix.mp4
python3 legendar_v5.py video_mix.mp4 ../v2/palavras.json video_legendado.mp4
bash $S/v1/master.sh video_mix.mp4 $S/v1/in/musica_fundo.wav video_legendado.mp4 QUANTOS_MINECRAFTS_CABEM_NO_GTA6_v5.mp4 54.25 -6
ffprobe -v error -show_entries format=duration:stream=r_frame_rate -of csv=p=0 QUANTOS_MINECRAFTS_CABEM_NO_GTA6_v5.mp4
ffmpeg -hide_banner -i QUANTOS_MINECRAFTS_CABEM_NO_GTA6_v5.mp4 -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)"
ffmpeg -v error -y -i QUANTOS_MINECRAFTS_CABEM_NO_GTA6_v5.mp4 -vf "fps=2,scale=180:-1,drawtext=text='%{pts\:hms}':x=2:y=2:fontsize=13:fontcolor=yellow:box=1:boxcolor=black,tile=12x10" -frames:v 1 final_sheet.jpg
echo PRONTO
