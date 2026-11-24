#!/bin/bash
# Master final: voz+efeitos (ja mixados) no volume alto, musica de fundo por baixo com ducking, fade out de 1 s no fim,
# limitador final pra nao estourar (teto -1 dBFS).
# uso: master.sh <video_com_voz_e_efeitos> <musica> <video_final_legendado_sem_musica> <saida> <duracao> <ganho_musica_dB>
VOZ="$1"; MUS="$2"; VID="$3"; OUT="$4"; DUR="$5"; G="${6:--14}"
FO=$(python3 -c "print($DUR-1.0)")
ffmpeg -v error -y -i "$VID" -i "$VOZ" -i "$MUS" -filter_complex "
[1:a]aresample=48000,aformat=channel_layouts=stereo,asplit=2[voz][sc];
[2:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:$DUR,asetpts=PTS-STARTPTS,volume=${G}dB[m0];
[m0][sc]sidechaincompress=threshold=0.1:ratio=2:attack=25:release=400:makeup=1[m1];
[m1]afade=t=out:st=$FO:d=1.0[mus];
[voz][mus]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.79:attack=1:release=50:level=false[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart "$OUT"
