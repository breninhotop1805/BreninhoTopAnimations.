#!/bin/bash
# usage: bash mux.sh NOME   -> out/NOME.mp4 (narração + efeitos) e out/NOME_SO_NARRACAO.mp4
# Efeitos: comprimidos (sons baixos sobem, altos ficam limitados ~-7 dB abaixo do pico da voz) pra não brigar com a narração.
set -e; cd "$(dirname "$0")"; F=$1
CH="volume=2.8,acompressor=threshold=0.05:ratio=4:attack=5:release=180:makeup=2.5,alimiter=limit=0.32:level=disabled"
ffmpeg -y -v error -i out/video_noaudio.mp4 -i assets/narracao.mp3 -i out/sfx.wav -filter_complex "[1:a]aresample=44100,aformat=channel_layouts=stereo[n];[2:a]$CH[s];[n][s]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]" -map 0:v -map "[a]" -c:v libx264 -preset slow -crf 21 -maxrate 18M -bufsize 36M -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart out/$F.mp4
ffmpeg -y -v error -i out/$F.mp4 -i assets/narracao.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart out/${F}_SO_NARRACAO.mp4
