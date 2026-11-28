#!/bin/bash
# Mixagem do video PNG Tuber completo: narracao + 3 musicas normalizadas (troca no flash e na virada) + SFX.
set -e
S=/tmp/claude-0/-home-user-BreninhoTopAnimations-/160acac5-b307-5059-8cfe-e8b2ecad7162/scratchpad
P=$S/png; R=/home/user/BreninhoTopAnimations./editor/sfx; K="$S/kit/Kit GTA 6 com Claude/assets/sfx"
cd $P
printf "file 'p_%s.mp4'\n" 0 10.34 20.49 30.27 41.10 > partes/lista.txt
ffmpeg -v error -y -f concat -safe 0 -i partes/lista.txt -c copy video_completo_sem_audio.mp4
D=54.25; F1=3.54; F2=30.27
M1="musn/New_Donk_City_-_Super_Mario_Odyssey_OST(480P).wav"
M2="musn/Donkey_Kong_Country_OST_(Super_Nintendo)_-_Track_02_23_-_Simian_Segue(360P).wav"
M3="musn/Main_Theme(360P).wav"
C="$R/corte_clique_limpo.wav"
# arquivo|tempo|ganho
SONS=(
"$C|1.30|1.45" "$C|6.56|1.45" "$C|10.34|1.45" "$C|12.20|1.45" "$C|15.33|1.45" "$C|17.57|1.45" "$C|20.49|1.45"
"$C|23.60|1.45" "$C|25.57|1.45" "$C|26.71|1.45" "$C|27.99|1.45" "$C|32.41|1.45" "$C|33.43|1.45" "$C|36.19|1.45"
"$C|37.85|1.45" "$C|39.46|1.45" "$C|44.28|1.45" "$C|47.40|1.45" "$C|50.75|1.45" "$C|52.90|1.45"
"$R/flash_1.wav|3.50|0.95" "$K/glitch.wav|5.38|0.85" "$K/whoosh.wav|8.02|0.95" "$K/pop.wav|13.85|0.85"
"$K/whoosh.wav|22.00|0.9" "$K/whoosh-cinematico.wav|30.08|0.95" "$K/pop.wav|34.57|0.85" "$K/whoosh.wav|41.07|0.9"
"$K/riser.wav|38.9|0.75" "$R/flash_2.wav|41.94|0.85" "$K/pop.wav|46.36|0.85" "$K/whoosh-cinematico.wav|48.30|0.95"
)
IN=(-i video_completo_sem_audio.mp4 -i $S/v2/in/narracao.mp3 -i "$M1" -i "$M2" -i "$M3"); FC=""; L=""; i=5
for s in "${SONS[@]}"; do
  IFS='|' read -r f t g <<< "$s"; IN+=(-i "$f"); ms=$(python3 -c "print(int($t*1000))")
  lim=""; case "$f" in *corte_*) lim=",alimiter=limit=0.89:level=false";; esac
  FC+="[$i:a]aresample=48000,aformat=channel_layouts=stereo,volume=$g$lim,adelay=$ms|$ms[s$i];"; L+="[s$i]"; i=$((i+1))
done
n=$((i-5))
FC+="[1:a]atrim=0:$D,asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur=$D,asplit=2[voz][sc];"
# musica 1 ate o flash (fade out 0,4 s terminando no flash); musica 2 entra cheia no flash (fade in 0,3 s);
# musica 2 sai com fade 0,4 s no arrasto dos 30 s; musica 3 entra ali e faz fade out de 1 s no fim
FC+="[2:a]atrim=0:$F1,asetpts=PTS-STARTPTS,afade=t=out:st=$(python3 -c "print($F1-0.4)"):d=0.4[m1];"
FC+="[3:a]atrim=0:$(python3 -c "print($F2-$F1)"),asetpts=PTS-STARTPTS,afade=t=in:d=0.3,afade=t=out:st=$(python3 -c "print($F2-$F1-0.4)"):d=0.4,adelay=$(python3 -c "print(int($F1*1000))")|$(python3 -c "print(int($F1*1000))")[m2];"
FC+="[4:a]atrim=0:$(python3 -c "print($D-$F2)"),asetpts=PTS-STARTPTS,afade=t=in:d=0.3,afade=t=out:st=$(python3 -c "print($D-$F2-1.0)"):d=1.0,adelay=$(python3 -c "print(int($F2*1000))")|$(python3 -c "print(int($F2*1000))")[m3];"
FC+="[m1][m2][m3]amix=inputs=3:normalize=0:duration=longest,apad=whole_dur=$D,volume=-4dB[mus0];"
FC+="[mus0][sc]sidechaincompress=threshold=0.1:ratio=2:attack=25:release=400:makeup=1[mus];"
FC+="[voz][mus]${L}amix=inputs=$((n+2)):normalize=0:duration=first,alimiter=limit=0.75:attack=1:release=50:level=false[a]"
ffmpeg -v error -y "${IN[@]}" -filter_complex "$FC" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 320k -ar 48000 -t $D -movflags +faststart FOXY_QUANTOS_MINECRAFTS_GTA6.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 FOXY_QUANTOS_MINECRAFTS_GTA6.mp4
ffmpeg -hide_banner -i FOXY_QUANTOS_MINECRAFTS_GTA6.mp4 -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)"
ffmpeg -v error -y -i FOXY_QUANTOS_MINECRAFTS_GTA6.mp4 -vf "fps=2,scale=150:-1,drawtext=text='%{pts\:hms}':x=2:y=2:fontsize=11:fontcolor=yellow:box=1:boxcolor=black,tile=12x9" -frames:v 1 completo_sheet.jpg
echo PRONTO
