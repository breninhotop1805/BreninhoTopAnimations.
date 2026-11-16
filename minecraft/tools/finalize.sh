#!/bin/bash
# junta as partes renderizadas e gera as duas versões (com efeitos / só narração)
set -e
cd "$(dirname "$0")/.."
NAME="ELE_PERDEU_TUDO_NO_MINECRAFT"
printf "file '%s'\n" a.mp4 b.mp4 c.mp4 > render/parts/list.txt
ffmpeg -v error -y -f concat -safe 0 -i render/parts/list.txt -c copy render/parts/video.mp4
python3 audio/sfx.py
for v in "completo:$NAME" "so_narracao:${NAME}_SO_NARRACAO"; do
  src=${v%%:*}; out=${v#*:}
  ffmpeg -v error -y -i render/parts/video.mp4 -i audio/mix_$src.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -c:a aac -b:a 256k -shortest -movflags +faststart render/$out.mp4
done
ls -la render/*.mp4
