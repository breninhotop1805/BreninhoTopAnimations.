#!/bin/bash
# usage: [VW=960 VH=540] K=4 bash render_part.sh N FROM TO  -> out/partN.mp4 (silent), rendered in K parallel chunks
set -e; cd "$(dirname "$0")"; mkdir -p out; N=$1; A=$2; B=$3; K=${K:-4}
pids=(); : > out/list$N.txt
for i in $(seq 0 $((K-1))); do
  a=$(python3 -c "print(round(($A+($B-$A)*$i/$K)*30)/30)"); b=$(python3 -c "print(round(($A+($B-$A)*($i+1)/$K)*30)/30)")
  node render.mjs video out/p${N}_$i.mp4 $a $b > out/log${N}_$i.txt 2>&1 & pids+=($!)
  echo "file 'p${N}_$i.mp4'" >> out/list$N.txt
done
for p in "${pids[@]}"; do wait $p; done
ffmpeg -y -v error -f concat -safe 0 -i out/list$N.txt -c copy out/part$N.mp4
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 out/part$N.mp4
