#!/bin/bash
# Video 2: junta partes -> mixa narracao + efeitos -> legenda -> master com musica
set -e
S=/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad
R=/home/user/BreninhoTopAnimations./editor/sfx
K="$S/kit/Kit GTA 6 com Claude/assets/sfx"
cd $S/v2
printf "file 'p_%s.mp4'\n" 0 8.06 17.57 27.99 34.45 44.28 > parts/lista.txt
ffmpeg -v error -y -f concat -safe 0 -i parts/lista.txt -c copy video_sem_audio.mp4
ffmpeg -v error -y -i "$K/whoosh.wav" -af areverse,volume=1.0 rewind.wav
C="$R/corte_clique_limpo.wav"; D="$R/corte_dano_limpo.wav"
SONS=(
"$K/whoosh-cinematico.wav|0.07|1.12|n"
"$K/glitch.wav|5.40|0.95|n"
"$C|6.56|1.45|c"
"$K/whoosh.wav|8.04|1.02|n"
"$K/pop.wav|9.30|0.93|n"
"$C|10.34|1.45|c"
"$C|12.20|1.45|c"
"$C|13.73|1.45|c"
"$C|15.33|1.45|c"
"$K/pop.wav|16.71|0.84|n"
"$C|17.57|1.45|c"
"$K/pop.wav|21.31|0.84|n"
"$C|22.03|1.45|c"
"$C|24.37|1.45|c"
"$K/whoosh-cinematico.wav|26.40|1.0|n"
"$C|27.99|1.45|c"
"rewind.wav|30.02|1.1|n"
"$K/pop.wav|30.35|0.84|n"
"$C|32.41|1.45|c"
"$D|34.45|1.25|c"
"$K/pop.wav|35.66|0.84|n"
"$K/pop.wav|36.55|0.84|n"
"$K/pop.wav|38.80|0.84|n"
"$K/riser.wav|38.84|0.9|n"
"$R/flash_2.wav|41.94|0.93|n"
"$C|44.28|1.45|c"
"$C|46.70|1.45|c"
"$K/pop.wav|47.12|0.84|n"
"$K/whoosh.wav|48.36|1.12|n"
"$C|52.90|1.45|c"
)
IN=(-i video_sem_audio.mp4 -i in/narracao.mp3); FC=""; L="[nar]"; i=2
for s in "${SONS[@]}"; do
  IFS='|' read -r f t g k <<< "$s"; IN+=(-i "$f")
  ms=$(python3 -c "print(int($t*1000))")
  lim=""; [ "$k" = "c" ] && lim=",alimiter=limit=0.89:attack=0.5:release=40:level=false"
  FC+="[$i:a]aresample=48000,aformat=channel_layouts=stereo,volume=$g$lim,adelay=$ms|$ms[s$i];"; L+="[s$i]"; i=$((i+1))
done
n=$((i-1))
FC+="[1:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur=54.25[nar];${L}amix=inputs=$n:normalize=0:duration=first,alimiter=limit=0.99:attack=1:release=20:level=false[a]"
ffmpeg -v error -y "${IN[@]}" -filter_complex "$FC" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 320k -ar 48000 -t 54.25 -movflags +faststart video_mix.mp4
python3 $S/v1/legendar.py video_mix.mp4 palavras.json video_legendado.mp4
bash $S/v1/master.sh video_mix.mp4 $S/v1/in/musica_fundo.wav video_legendado.mp4 QUANTOS_MINECRAFTS_CABEM_NO_GTA6.mp4 54.25 -6
ffprobe -v error -show_entries format=duration:stream=r_frame_rate -of csv=p=0 QUANTOS_MINECRAFTS_CABEM_NO_GTA6.mp4
ffmpeg -hide_banner -i QUANTOS_MINECRAFTS_CABEM_NO_GTA6.mp4 -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)"
ffmpeg -v error -y -i QUANTOS_MINECRAFTS_CABEM_NO_GTA6.mp4 -vf "fps=2,scale=180:-1,drawtext=text='%{pts\:hms}':x=2:y=2:fontsize=13:fontcolor=yellow:box=1:boxcolor=black,tile=12x10" -frames:v 1 final_sheet.jpg
echo PRONTO
