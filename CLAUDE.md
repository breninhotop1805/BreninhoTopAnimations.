# BreninhoTopAnimations — regras do canal (ler antes de qualquer vídeo novo)

Canal de TikTok de FNAF em português. Cada vídeo é uma animação 3D estilo Minecraft/voxel (three.js renderizado
headless), sincronizada com a narração do usuário. Cada projeto é uma pasta `fnaf_*` (copie a mais recente como base).

## Entrega (sempre)
- 1080×1920, 30fps, cortes rápidos (~1 por segundo), animação fluida.
- **Sem legendas** (ele coloca no CapCut). **Sem música** — só efeitos sonoros, e **efeitos baixos**
  (mix do sfx em ~0.6; jumpscare/estática/glitch/estrondos bem mais baixos que o resto).
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

### Marcações (lupas/círculos)
- Círculos de destaque **centralizados exatamente** no detalhe (ex.: nos olhos — conferir a linha real do olho
  na textura da skin, que costuma ser mais baixa que o meio da cabeça). Sempre validar num frame.

### Telas dentro do 3D (fliperama, monitor)
- Tela proporcional (4:3) e **completa**, embutida numa moldura de verdade (não um plano colado no gabinete);
  a câmera termina enquadrando a tela inteira, sem cortar.

### Minigames 2D (pixel art)
- Desenhados por mim, pixel a pixel, em alta qualidade (nunca recortar sprites do jogo de referência).
  Parecidos com o original: cenário, cores, scanlines de CRT, contador etc.

### Logos
- Logo só quando ele pedir, e na fala certa. PNG com fundo removido de forma limpa (sem borrão/caixa),
  com sombra; quando pedido, fundo da cena desfocado (uniform `blur` do post) pra destacar a logo.

## Processo de qualidade
1. Testar modelos (lineup claro, frente e lado) antes das cenas.
2. Contact sheet de todas as cenas (frame a ~60% de cada cena) e corrigir enquadramento/luz/colisão.
3. Só então renderizar o vídeo inteiro; conferir frames do vídeo final antes de entregar.
4. Se ele pedir ajuste rápido que afeta só um trecho, re-renderizar só o trecho e emendar.
