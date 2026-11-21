# O BIZARRO ICEBERG DE FNAF — plano de produção (vídeo longo, YouTube)

- Formato: **16:9 horizontal, 1920×1080, 30 fps** (o usuário escreveu "9:16" mas pediu horizontal pra YouTube).
- Áudio: `assets/narracao.mp3` (616 s). As pausas entre camadas tinham só ~1 s; foram esticadas para ~2,8 s
  com silêncio → `assets/narracao_ext.wav` (627,27 s). Tempos das palavras já remapeados: `assets/words_ext.json`.
- `assets/timeline.json`: janelas de transição (água + câmera mergulhando no iceberg + título da camada em 3D)
  e limites das 6 partes (em múltiplos de 1/30 s, pra emendar sem corte no editor):

| Parte | Conteúdo | Início | Fim |
|---|---|---|---|
| 1 | Intro + Camada 1 (a superfície) | 0.0000 | 156.3333 |
| 2 | Camada 2 (abaixo d'água) | 156.3333 | 267.9333 |
| 3 | Camada 3 (o escuro) | 267.9333 | 346.6000 |
| 4 | Camada 4 (a fossa) | 346.6000 | 454.3000 |
| 5 | Camada 5 (o fundo) | 454.3000 | 501.0667 |
| 6 | Camada 6 (sem nome) + final | 501.0667 | 627.2667 |

- Uma timeline global em `src/shots.js` (tempo absoluto do vídeo); cada parte é renderizada com
  `node render.mjs video out/partN.mp4 <inicio> <fim>` → continuidade perfeita entre partes.
- Cada parte: prévia em baixa resolução → aprovação do usuário → render final → mux (narração estendida + sfx)
  cortado exatamente nos mesmos limites. Entregar `ICEBERG_PARTE_N.mp4` e `ICEBERG_PARTE_N_SO_NARRACAO.mp4`.
- Títulos das camadas: SIM (letras 3D em voxel, na transição). Final: só animação (sem like/sino).
- Logos fornecidos: SOTM (refs/sotm_logo.webp), UCN (refs/ucn_logo.png — remover fundo preto), Help Wanted (refs/hw_logo.png).
- Skins novas: vanny, mimic (fazer 3D bonito e fiel à refs/mimic.png — endoesqueleto, olhos laranja brilhantes), edwin, andrew.
- Seguir TODAS as regras do CLAUDE.md da raiz (efeitos brutos mais baixos, sem repetir sons, sem PNG colado, sem bolinhas, movimento sempre, nada atravessando).
