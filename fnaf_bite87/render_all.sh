#!/bin/bash
set -e
cd "$(dirname "$0")"; mkdir -p out
N=${N:-3}; DUR=62.95
pids=()
for i in $(seq 0 $((N-1))); do
  a=$(python3 -c "print(round($DUR*$i/$N*30)/30)"); b=$(python3 -c "print(round($DUR*($i+1)/$N*30)/30)")
  node render.mjs video out/part$i.mp4 $a $b > out/log$i.txt 2>&1 & pids+=($!)
done
for p in "${pids[@]}"; do wait $p; done
: > out/list.txt; for i in $(seq 0 $((N-1))); do echo "file 'part$i.mp4'" >> out/list.txt; done
ffmpeg -y -v error -f concat -safe 0 -i out/list.txt -c copy out/video_noaudio.mp4
echo done
