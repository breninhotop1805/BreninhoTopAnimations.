# BreninhoTopAnimations — regras do canal (ler antes de qualquer vídeo novo)

Canal de TikTok de FNAF em português. Cada vídeo é uma animação 3D estilo Minecraft/voxel (three.js renderizado
headless), sincronizada com a narração do usuário. Cada projeto é uma pasta `fnaf_*` (copie a mais recente como base).

## Entrega (sempre)
- 1080×1920, 30fps, cortes rápidos (~1 por segundo), animação fluida.
- **Sem legendas** (ele coloca no CapCut). **Sem música** — só efeitos sonoros.
- **Volume dos efeitos** (ajuste final dele): os sons baixos/médios estão no ponto — manter. Os **brutos e abafantes**
  ficam MAIS BAIXOS: fogo (fireloop), "bling" (chime/bell/ding), jumpscare (scream/boom), passos robóticos (mstep),
  estrondos (thud/boom), estática/glitch. No sfx.py: ganho desses ~40–50% menor que antes; no `mux.sh` o limitador
  dos efeitos fica em 0.32 e depois `volume=0.2` (pedido dele no Iceberg: efeitos BEM baixos, picos ~20 dB abaixo da voz,
  a narração nunca pode ficar abafada/"bugada" pelos efeitos). Vale pra todos os vídeos.
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

## Lições do Iceberg (vídeo longo) — aplicar sempre
- **Sincronia:** uma cena por ideia falada; cortar no início exato da palavra-chave; nenhuma cena com mais de ~3 s
  sem um novo corte ou ação marcante; a ação principal da cena (soco, olho acendendo, porta batendo) acontece
  **na sílaba** que a descreve. Conferir a sincronia assistindo a prévia com o áudio, não só pelo roteiro.
- **Movimento/atuação:** personagens sempre atuando (andar, gesticular, reagir, virar a cabeça), nunca só "idle";
  câmera sempre se movendo. Evitar poses rígidas de braço esticado.
- **Contact sheet em 3 momentos por cena** (~15%, 50%, 90%), não só 60% — pega flashes cinzas, personagem cortado,
  câmera nas costas do personagem e quadros vazios.
- Bugs vistos: câmera nas costas/nuca do personagem, rosto estourado por luz perto (key/fill fortes), flash em fundo
  preto vira quadro cinza (flash máx ~0.05 em cena escura), fantasmas com opacidade < 0.5 sumiam (alphaTest do
  makeGhost agora 0.02), cenas subaquáticas com a câmera dentro dos blocos (sempre deixar água aberta no quadro).

## Pedido dele depois do Iceberg — REGRAS FIXAS pra todos os próximos vídeos (prompt anotado)
"Nos próximos shorts, deixe tudo impecável. Tudo isso e as coisas passadas. Quero animações fluidas e bonitas."
1. **Cabeça "bugando" no começo da cena:** nada de pose que pula nos primeiros quadros. A cabeça/corpo já começam
   na pose certa no quadro 0 (nada de `lookAtCam`/rotação entrando com rampa curta a partir de L=0; se for virar,
   transição suave de ≥0.4 s). Conferir os 3 primeiros quadros de cada cena.
2. **Tamanhos fixos por categoria — nunca aumentar nem diminuir por cena** (não passar escala extra no `put`):
   todos os animatrônicos com a mesma escala (diferença só se o personagem for canonicamente maior, ex. Baby/Mimic,
   definida uma vez no main.js); todas as crianças com a mesma escala; todos os adultos com a mesma escala.
   Plushies/miniaturas são o único caso de tamanho diferente.
3. **Almas/fantasmas entrando em algo:** nunca "só some". Animar de verdade: a alma voa até o alvo, encolhe/afunila
   pra dentro dele com rastro de partículas e um brilho/flash de luz no alvo (olhos acendendo). E **nada some do nada**
   (`visible=false` seco é proibido): sair de cena com fade, dissolve, encolher, sair do quadro ou corte de câmera.
4. **Andar/correr não pode parar de repente:** ao chegar, a passada desacelera e termina em pose neutra (amplitude
   da caminhada vai a zero junto com a velocidade, com 1–2 passos de desaceleração). Quem anda até o fim da cena
   continua andando. Nenhuma peça ou personagem atravessando outro (checar braços/mãos em `aim`, máscaras, props,
   personagens próximos).
5. **Sincronia impecável** (o erro clássico): cortar e executar a ação exatamente na palavra; cenas curtas; assistir
   a prévia com áudio antes de entregar e corrigir qualquer atraso.
- Somam-se a todas as regras anteriores deste arquivo. Animações fluidas e bonitas acima de tudo.

## Estilo de movimento e câmera — referência: canal @lukskk (vídeos que ele mandou) — SEGUIR SEMPRE
Analisado quadro a quadro (4 fps) nos vídeos de referência:
- **Câmera:** quase sempre na altura dos olhos ou levemente de baixo; personagem grande no quadro (do peito pra cima
  ou corpo inteiro bem perto), nada de planos abertos e vazios. Em toda cena um movimento suave e contínuo:
  push-in lento, leve deriva lateral/órbita curta. Nas palavras-chave, **punch-in rápido** (zoom/aproximação com
  ease-out em ~0.25 s) no rosto ou na ação. Cortes a cada ~1,5–2 s acompanhando a fala.
- **Fundo levemente desfocado** (profundidade de campo) quando é close; personagem nítido e bem iluminado.
- **Atuação dos personagens (fluida, "cartoon"):**
  - Andar de perfil com braços balançando, tronco inclinado pra frente; ao pegar/empurrar algo, braços esticados à
    frente (pose de alcançar) e corpo inclinado.
  - Gestos claros e segurados por um instante: mão no queixo (pensando), apontar, mão no peito, braços pra cima
    (comemorar), ombros encolhidos. Entram com **overshoot** (easing back) e assentam suave — nada linear/robótico.
  - Cabeça sempre viva: inclina, vira pro outro personagem, olha pra câmera na fala dele.
  - Reações exageradas: mandíbula **caindo** de susto (jaw abre com bounce), tremidinha, pulo pra trás.
  - Respiração/idle sutil sempre; ninguém parado como estátua.
- **Elementos de apoio:** balão "?" / "!" que pulam sobre a cabeça em dúvida/surpresa (pop com overshoot);
  personagens de frente pra câmera quando falam/reagem; dois personagens interagindo no mesmo quadro.

## Processo de qualidade
1. Testar modelos (lineup claro, frente e lado) antes das cenas.
2. Contact sheet de todas as cenas (frame a ~60% de cada cena) e corrigir enquadramento/luz/colisão.
3. Só então renderizar o vídeo inteiro; conferir frames do vídeo final antes de entregar.
4. Se ele pedir ajuste rápido que afeta só um trecho, re-renderizar só o trecho e emendar.

## Pedido depois do teste de animação (ANOTADO — reforço máximo)
- **NUNCA personagens/partes atravessando outros personagens.** Isso já foi pedido várias vezes. No teste, Toy Chica e
  Glamrock Freddy acenaram com as mãos atravessando uma na outra — erro inaceitável.
  - Em cena com dois personagens lado a lado, gestos (acenar, apontar, abraçar) usam o **braço de fora**; espaçamento
    mínimo ~1,9 unidades entre centros quando os dois gesticulam.
  - **Checagem automática obrigatória** em todo vídeo: a cada quadro, mãos/cotovelos/cabeça de cada personagem contra o
    corpo (torso+cabeça, sem braços) dos outros e contra as mãos/cotovelos dos outros (distância < 0,28 = erro).
    Logar `LOG ATRAVESSA ...` e só renderizar o vídeo final com **zero** ocorrências; depois conferir visualmente.
- **Iluminação vem do ambiente** (lâmpadas penduradas, spot do palco, luzes coloridas, janelas, telas, fogo): nada de luz
  "de estúdio" presa na câmera nem fill genérico que deixa tudo chapado. Ambiente/hemisfério fraco, sombras reais, cada
  luz com uma fonte visível ou plausível no cenário.

## Decisão final sobre modelos (depois do remake do Springtrap)
- Os modelos "novos" (lab_modelos/, estilo @lukskk, humanos de cabeça cúbica) foram **REPROVADOS**: "ficou feio, preferi as
  antigas de Mine". **Usar SEMPRE os bonecos de Minecraft antigos (skins + skin.js)**. Não propor trocar de modelo de novo.
- O que ele quer agora: **animações dos bonecos de Minecraft MAIS BONITAS e COM EMOÇÃO** (estavam "muito feias e sem
  emoção"). Manter o visual Minecraft; melhorar a atuação: expressões no rosto, poses e gestos fortes com antecipação e
  overshoot, caminhada com peso, reações exageradas, respiração, cabeça viva.

## Kit de atuação dos bonecos de Minecraft (fnaf_volta_mine/src) — usar nos próximos vídeos
- **Rosto (face.js):** expressões trocando a TEXTURA da skin (pálpebras, sobrancelha "inclinada" via pálpebra
  raiva/tristeza, boca abrindo). Nada de geometria nova no rosto → não flutua, não pisca errado, não atravessa.
  Config por personagem em `FACES` (retângulos dos olhos/boca na skin). Humanos piscam rápido (~0,16 s) de vez em
  quando; animatrônicos não piscam. "Cuidado com essa de piscar, NÃO PODE BUGAR."
- **Corpo (act.js):** poses somadas com curvas (arcos X+Z), antecipação só no tronco/cabeça (membros nunca antecipam
  pra dentro do corpo), overshoot + acomodação (`springE`), follow-through da cabeça/tronco, `walkPath` com peso
  e parada suave, `alive` (respiração/peso), gestos: think, point, shrug, cheer, chest, scared, cower, sad, angry,
  laugh, evil, reach, flex, wave(braço de fora), agony, slump, startle (pulo de susto com squash), nod, headShake.
- **Câmera em 2 passadas por quadro (main.js):** a 1ª posiciona a câmera, a 2ª roda a cena de novo pra que todo
  `lookAtCam` use a câmera DESTE quadro → a cabeça não "pula" no começo da cena.
- **Checagem de colisão orientada (act.js `collisionCheck`):** pontos ao longo do braço (centro + 4 cantos) testados
  no espaço local do corpo/cabeça: braço dentro do próprio corpo/cabeça, dentro de outro personagem, braço
  encostando no braço de outro, cabeça dentro de outro. Vídeo final só com ZERO `LOG ATRAVESSA`.
- Fogo: luzes do fogo NA FRENTE do personagem (iluminam o rosto), bloom baixo (0,15) nas cenas de fogo.
