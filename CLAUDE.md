# BreninhoTopAnimations — regras do canal (ler antes de qualquer vídeo novo)

Canal de TikTok de FNAF em português. Cada vídeo é uma animação 3D estilo Minecraft/voxel (three.js renderizado
headless), sincronizada com a narração do usuário. Cada projeto é uma pasta `fnaf_*` (copie a mais recente como base).

## Entrega (sempre)
- 1080×1920, 30fps, cortes rápidos (~1 por segundo), animação fluida.
- **Sem legendas** (ele coloca no CapCut). **Sem música** — só efeitos sonoros.
- **Volume dos efeitos** (ajuste final dele): os sons baixos/médios estão no ponto — manter. Os **brutos e abafantes**
  ficam MAIS BAIXOS: fogo (fireloop), "bling" (chime/bell/ding), jumpscare (scream/boom), passos robóticos (mstep),
  estrondos (thud/boom), estática/glitch. No sfx.py: ganho desses ~40–50% menor que antes; no `mux.sh` o limitador
  dos efeitos fica em 0.32 (picos ~10 dB abaixo da voz) e o compressor mantém os baixos audíveis.
- **Efeitos profissionais, sem poluição**: nada de repetir o mesmo som várias vezes (ex.: "bling"/chime a cada cena).
  Cada som marca um momento específico; variar (whoosh, clique, zumbido, passos, ambiente) e deixar respiros.
  Máx. ~3 chimes/bells por vídeo; passos em sequência com ganho baixo; fogo como ambiente contínuo baixo.
- **Começo do vídeo sempre com efeitos marcantes** (sem exagero): ex. clique de luz, zumbido, whoosh, passos,
  vozes de crianças, chime/heartbeat — o começo é o mais importante.
- Duas versões: `NOME.mp4` (narração + efeitos) e `NOME_SO_NARRACAO.mp4`.
- Sem ícones de like/sino no final. Commit + push no branch da sessão.
- Transcrever a narração (faster-whisper) e cortar as cenas nas palavras-chave.

## Erros que ele já pediu pra corrigir — NUNCA repetir
### Personagens / skins
- Skins nunca podem bugar: corpo alinhado, movimento correto, nada atravessando.
- Partes 3D (orelhas, focinhos, bicos, cabelo, chapéus, moicano, laços, garras, microfone…) sempre em 3D
  **e apagando a versão 2D pintada na skin** (camada hat / topo da cabeça), senão fica "vestígio".
- Ao anexar voxelArt numa cabeça: `extrudePixels` é **centrado** — orelhas precisam ser deslocadas pra cima
  (metade da altura), senão ficam enterradas na cabeça.
- Cabelo 3D **sem exagero** (baixo, rente; nada de tufos altos ou "capacete" quadrado).
- Proporções fiéis: animatrônicos bem maiores que crianças/humanos (Gregory/Cassie ~0.86–0.88,
  animatrônicos ~1.3–1.4; BB e crianças pequenos; Circus Baby grande e "cheinha").
- Objetos na mão: orientação certa (ex.: bola do microfone **em cima**); não colocar objetos que o roteiro
  não pede (ex.: sorvete na mão da Elizabeth) e não inventar cenas com props estranhos (ex.: laço no chão).
- Detalhes de cor importantes (olhos azuis/verdes etc.) precisam estar corretos e visíveis.

### Cenários
- **Nada de imagens/PNG "coladas"** em planos (telões com desenhos, placas de texto em canvas, neon pintado).
  Neon = tubos 3D de verdade (TubeGeometry redondo + brilho), letras em voxel, estrelas/arcos em 3D.
  Telas de fundo = neon/geometria 3D, não imagens de baixa qualidade. Não inventar coisas que não existem
  (ex.: "OUT OF ORDER" num telão).
- Ser fiel às referências que ele manda (layout, cores, elementos marcantes), mas sempre feito por mim em 3D.
- Lembrar que o vídeo é **vertical**: o campo de visão horizontal é estreito — elementos importantes
  perto do centro; testar se o personagem está realmente dentro do quadro.

### Bugs de parede / colisão
- Nenhum personagem atravessando parede, bloco, mesa, escombro ou objeto preto. Conferir a posição
  contra a geometria do cenário (e limpar escombros aleatórios perto de onde os personagens ficam).
- Câmera nunca dentro/atrás de objetos; nada grande tapando o quadro em primeiro plano.
- Personagens importantes perto da câmera e bem iluminados (fill light **depois** de posicionar a câmera).

### Marcações (lupas/círculos) — NÃO USAR
- Ele pediu pra **descartar totalmente** as bolinhas/lupas com ✗ vermelho e ✓ verde. Não usar mais.
  Destacar detalhes com câmera (close, push-in), luz, tint e animação.

### Telas dentro do 3D (fliperama, monitor)
- Tela proporcional (4:3) e **completa**, embutida numa moldura de verdade (não um plano colado no gabinete);
  a câmera termina enquadrando a tela inteira, sem cortar.

### Minigames 2D (pixel art)
- Desenhados por mim, pixel a pixel, em alta qualidade (nunca recortar sprites do jogo de referência).
  Parecidos com o original: cenário, cores, scanlines de CRT, contador etc.

### Logos
- Logo só quando ele pedir, e na fala certa. PNG com fundo removido de forma limpa (sem borrão/caixa),
  com sombra; quando pedido, fundo da cena desfocado (uniform `blur` do post) pra destacar a logo.

### Movimento (o mais importante)
- Toda cena precisa de movimento de verdade: personagem andando/gesticulando/pulando/virando a cabeça +
  câmera se movendo (push-in, órbita, travelling). Nada de cena parada ou "travada". Intro sempre forte e animada.
- Animatrônicos principais **centralizados e de frente** pra câmera (ex.: Mangle no teto simétrica, rosto pra
  câmera — nunca de lado/torta).
- Cuidado com exposição: personagens brancos (Mangle, rostos) estouram fácil com lâmpada/fill/lanterna perto.
- Checar oclusão: câmera não pode ficar atrás de cadeira/mesa/parede no começo do movimento.
- Props apoiados em algo (ex.: bolo em cima de uma mesa, nunca flutuando).

## Processo de qualidade
1. Testar modelos (lineup claro, frente e lado) antes das cenas.
2. Contact sheet de todas as cenas (frame a ~60% de cada cena) e corrigir enquadramento/luz/colisão.
3. Só então renderizar o vídeo inteiro; conferir frames do vídeo final antes de entregar.
4. Se ele pedir ajuste rápido que afeta só um trecho, re-renderizar só o trecho e emendar.
