#!/bin/bash
# usage: bash mux_part.sh N FROM TO [VIDEO]  -> out/ICEBERG_PARTE_N.mp4 (narração + efeitos) e out/ICEBERG_PARTE_N_SO_NARRACAO.mp4
# O áudio é cortado exatamente nos mesmos limites (FROM..TO, múltiplos de 1/30 s) do vídeo, pra emendar as partes sem corte.
set -e; cd "$(dirname "$0")"; N=$1; A=$2; B=$3; V=${4:-out/part$N.mp4}; F=ICEBERG_PARTE_$N
CH="volume=2.8,acompressor=threshold=0.05:ratio=4:attack=5:release=180:makeup=2.5,alimiter=limit=0.32:level=disabled"
TR="atrim=start=$A:end=$B,asetpts=PTS-STARTPTS"
ffmpeg -y -v error -i $V -i assets/narracao_ext.wav -i out/sfx.wav -filter_complex "[1:a]$TR,aresample=44100,aformat=channel_layouts=stereo[n];[2:a]$TR,$CH[s];[n][s]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]" -map 0:v -map "[a]" -c:v libx264 -preset slow -crf 20 -maxrate 18M -bufsize 36M -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart out/$F.mp4
ffmpeg -y -v error -i $V -i assets/narracao_ext.wav -filter_complex "[1:a]$TR,aresample=44100,aformat=channel_layouts=stereo[a]" -map 0:v -map "[a]" -c:v libx264 -preset slow -crf 20 -maxrate 18M -bufsize 36M -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart out/${F}_SO_NARRACAO.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 out/$F.mp4
