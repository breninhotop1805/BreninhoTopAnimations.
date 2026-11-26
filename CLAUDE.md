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
- **APROVADO por ele** ("Excelente! Pegou a visão! Movimentos fluidos, câmeras fluidas, expressões sem bugar!"):
  o remake do Springtrap em `fnaf_volta_mine` é o **novo padrão de qualidade e a base pra copiar nos próximos vídeos**
  (face.js + act.js + câmera em 2 passadas + checagem de colisão). Sempre dá pra aprimorar conforme o vídeo.

## Volume dos efeitos — correção no vídeo do Mimic
- Com `volume=0.2` os efeitos ficaram INAUDÍVEIS ("cadê os efeitos sonoros? Nenhum tem! Mas proporcionais"): a narração
  dele vem muito alta/comprimida (média ≈ −7,5 dB) e o barramento ficou ~29 dB abaixo. Padrão agora no `mux.sh`:
  limitador 0.32 e depois **`volume=0.85`** → efeitos com pico ≈ −11 dB e média ≈ −24 dB (≈ 16 dB abaixo da média da
  voz): dá pra ouvir cada efeito sem abafar a narração. Sempre MEDIR (volumedetect) o barramento de efeitos e a voz antes
  de entregar: média dos efeitos 14–18 dB abaixo da média da voz. Os brutos (fogo, estrondo, estática) continuam com
  ganho baixo no sfx.py.

## Props (correção no vídeo do Bonnie azul)
- Objeto que o personagem não segura de verdade com as mãos NÃO entra (a guitarra do Bonnie ficou "voando na barriga").
  Só usar prop se as mãos estiverem posicionadas nele em todos os quadros; senão, tirar — o roteiro manda.

## Cobrança depois do vídeo do Nightmare Foxy (FNAF 4) — vale pra TODOS os próximos
Ele aceitou o vídeo mas apontou de novo erros "que já falamos demais": **focinho bugado, partes atravessando outras partes**
e a **máscara 3D do Michael não satisfatória**. Regras:
- **A checagem automática NÃO cobre tudo**: ela só testa braços/cabeça. Toda peça 3D extra (focinho, mandíbula aberta, dentes,
  gancho, máscara, orelhas, props) precisa ser conferida VISUALMENTE em close e em movimento: nada entrando no peito/pescoço
  quando a mandíbula abre, focinho alinhado ao rosto (sem "degrau" ou buraco preto entre focinho e cabeça), dentes saindo da
  boca e não do meio da cara, gancho/mão sem entrar no corpo. Fazer contact sheet de CLOSES de cada modelo (frente, 3/4,
  perfil, boca aberta/fechada) ANTES das cenas e mandar pra ele se tiver peça nova.
- Mandíbula aberta: a parte de baixo nunca pode atravessar o torso — limitar o ângulo e/ou recuar a mandíbula; conferir de perfil.
- Peça que passa por cima da cabeça (máscara, capacete): modelar com qualidade (formato fiel, olhos/focinho/orelhas bem
  feitos, encaixe justo na cabeça, sem ficar "caixa grande"); as mãos seguram pelas laterais sem atravessar a peça nem a cabeça.
- Pelúcia/versão mini de personagem que tem modelo 3D: usar o modelo 3D completo (focinho, orelhas, gancho…), nunca só a skin.
- Exposição: lanterna/spot perto de rosto claro estoura — intensidade baixa e conferir em cada close.
- (vídeo do compartimento do Freddy) Rosto dos Funtimes ABERTO (placas do rosto + olhos 3D redondos atrás) foi REPROVADO:
  "que nojo, olhos redondos, os olhos 2D abriram junto". Não abrir rostos/placas faciais; se uma peça aberta tiver risco de
  ficar estranha, não usar. Peito/barriga abrindo com o design da própria skin foi aprovado ("o Freddy ficou bom").
- (vídeo do Rockstar Freddy) Microfone saiu MINÚSCULO (parte do cabo ficava dentro do braço) e só foi notado no render.
  Props na mão: tamanho comparado com a referência (bola do microfone ≈ do tamanho do punho), segurado NA FRENTE do punho
  (offset pra frente, nunca saindo de dentro do braço), e conferido num close ANTES do render. HUD/contador nunca em cima
  do rosto do personagem (canto superior).

## REPROVAÇÃO FORTE — vídeo do Rockstar Freddy (UCN): "um dos piores vídeos"
O que ele apontou: vídeo feio e repetitivo, sem vida, sem criatividade; quase tudo no MESMO escritório com o MESMO ângulo
(câmera atrás da mesa olhando o Rockstar); animações sem vida/bugadas (Rockstar parado só respirando, mesmo aceno repetido);
almas SOBREPOSTAS; microfone parecendo VOAR (afastado do punho); olhos vermelhos = retângulos chapados (feio);
pelúcias/brinquedos do cenário malfeitos (blocos toscos). Causa real: pressa — foquei em consertar bug e esqueci direção.
REGRAS a partir daqui:
- **Storyboard antes de tudo**: lista de cenas com cenário + ângulo + ação de cada uma; no máximo ~3 cenas seguidas no mesmo
  cenário/ângulo; trocar de lugar (cenários diferentes, flashback, close extremo, plano de cima, travelling) e de lente.
  Mandar o storyboard em imagens (1 quadro por cena) pra ele aprovar ANTES do render.
- **Cada personagem atua em toda cena** (andar, gesto forte com overshoot, cabeça viva, reação) — nunca só `alive`.
  Não repetir o mesmo gesto (ex.: wave) mais de 1–2 vezes no vídeo.
- **Prop na mão = segurado de verdade**: cabo atravessando o punho fechado (encaixe no handR), nunca flutuando à frente.
- **Olhos brilhando**: pupila acesa pequena/glow suave sobre o pixel do olho — nunca retângulo de cor chapada cobrindo o olho.
- **Vários personagens/almas no quadro**: espaçados na tela (sem sobreposição visual), entrando um de cada vez.
- **Objetos de cenário em close** (pelúcias, brinquedos): modelar com cuidado (personagem reconhecível) ou deixar fora do close.

## Segunda reprovação do Rockstar (remake) — "só um pouco melhor, aceitável"
O que ele apontou no remake: **cenas sem sentido** (imagem não ilustra a frase), **porta do cofre bugada**, **alma do Golden
Freddy feia**, **começo do vídeo mostrando o teto** (a lâmpada). Regras:
- **Cada cena ilustra literalmente a frase falada.** Antes de animar, escrever ao lado de cada trecho da transcrição "o que o
  espectador vê e por quê". Se não dá pra justificar em uma linha, a cena muda. Nada de cena "de enfeite".
- **O primeiro quadro é o personagem principal**, grande, de frente e bem iluminado, já em ação. Nunca teto, lâmpada,
  chão ou cenário vazio no começo.
- **Peças mecânicas animadas (portas, cofres, gavetas):** pivô no lugar certo (dobradiça), sem atravessar a parede ou o
  batente. Conferir abrindo em close e de lado antes do render.
- **Almas/fantasmas de personagens conhecidos (Golden Freddy):** modelo completo e reconhecível, com transparência
  bonita, sem as partes internas aparecendo nem cores lavadas. Fazer um close de teste e só usar se ficar bonito.
- Assistir ao vídeo final inteiro com áudio, como espectador, perguntando em cada corte "isso faz sentido com a fala?".
- (Rockstar v3) Pedidos dele: **NADA de cofre** (porta redonda bugava) — moedas caídas/montanhas de moedas podem; **nunca mais
  "olho vermelho"** pra indicar algo sombrio — usar luz (lâmpada falhando, ele aparecendo mais perto no escuro, luz fria de tela).
  Almas de animatrônico (Golden Freddy) = modelo SÓLIDO (buildGolden em rockstar.js) aparecendo com flicker/fade, nunca fantasma
  transparente aditivo (fica feio).
- Contact sheet em cena escura engana (fundo escuro parece "cabeça cortada"): conferir frames duvidosos em escala 0.4.
- Tela/monitor numa mesa = com pé/base apoiado na mesa; nunca flutuando na frente do personagem.

## APROVADO COM FESTA — Rockstar v3 ("VOCÊ APRENDEU! QUE EVOLUÇÃO! GUARDE BEM ISSO!")
O remake v3 do Rockstar (fnaf_rockstar) é o NOVO PADRÃO de direção. O que fez dar certo — repetir sempre:
- **Cada cena ilustra literalmente a frase** (tabela fala → cena antes de codar): "pede" = mão estendida; "5 moedas" = moedas
  caindo + contador; "muita gente acha piada" = crianças rindo e apontando; "esconde" = mão cobrindo; "Fazbear Entertainment" =
  letreiro 3D acendendo; "nível" = montanha de moedas subindo; "transformou" = a peça se montando no corpo; "ligou os pontos" =
  moedas conectadas por linhas formando a estrela do personagem.
- **Primeiro quadro = personagem principal em ação**, grande e iluminado. Final com gesto pra câmera (apontar/acenar).
- **Sombrio sem efeitos baratos**: luz falhando + personagem aparece mais perto no escuro + luz fria de tela.
- **Variedade de cenários** (palco, escritório, salão da empresa, pesadelo, vazio simbólico, fogo) e ângulos; callback visual no fim.
- Animatrônico "alma" sólido com flicker/fade; partículas/fluxo de luz pra mostrar possessão; ninguém sumindo seco.
- Storyboard em imagens enviado antes; render; corrigir colisões só nos trechos; checar quadros do vídeo final.

# ======================= CANAL ROBLOX (novo rumo — canal de 1 milhão) =======================
A aba agora tem DOIS canais: **FNAF/Minecraft** (tudo acima) e **ROBLOX** (esta seção). Projetos Roblox ficam em `roblox_*`
(base: `roblox_base/` — copiar como ponto de partida). As regras de FNAF (sincronia, movimento, colisão, nada sumindo seco,
cena literal à fala, storyboard antes, conferir quadros finais, efeitos sem poluição, commit+push) valem aqui também — e mais.

## Referências (8 vídeos que ele mandou: "NÃO CONFIE NOS SEUS HERÓIS", "NÃO VEJA O SEGREDO DELA", "MINHA CRUSH É PRESIDENTE"…)
Inspiração MÁXIMA — ficar ainda mais parecido com elas do que os vídeos de FNAF ficaram das referências deles.
- **Histórias** narradas em 1ª pessoa (~2:15–2:35 min), cortes a cada **~1,6 s** (85–95 cortes), CADA corte ilustra literalmente
  a palavra/ideia falada (relógio em "segundos", calendário "DIA 3", TV de jornal em "jornal", lousa "SEMANA 2", placa "LEI 7").
- **Visual**: bonecos Roblox R6 de plástico macio (cantos arredondados, leve textura granulada), cabeça clássica cilíndrica
  arredondada, **rosto = decal 2D** com expressões fortes (sobrancelhas, olhos arregalados, boca "o", sorriso com dentes,
  lágrimas, rubor), cabelos/chapéus/acessórios em 3D. Render "Blender": sol quente com sombra suave, AO de contato,
  hemisfério claro, cores saturadas, leve profundidade de campo e bloom suave.
- **Cenários** coloridos e cheios (ruas com casas coloridas e calçada de pedra, escola, refeitório, quarto, palácio,
  prisão, aeroporto, ilha), tudo em 3D próprio. Textos de cenário (placas, lousa, TV, calendário) PODEM existir aqui como
  objetos do mundo desenhados por mim (não PNG colado de fora).
- **Câmera**: altura dos olhos, personagem grande e centralizado (corpo inteiro ou da cintura pra cima), push-in lento, às vezes
  travelling/lateral; atuação contínua (andar, gesticular, pular, abraçar), efeitos 3D (corações flutuando, faíscas, poderes).
- **Legendas**: UMA palavra por vez, centralizada a ~69% da altura, branca com contorno preto grosso + sombra; palavras-chave
  em VERMELHO. Pedido dele: fonte **KOMIKAX** (`roblox_base/assets/komikax.ttf`), **SEM desfoque**, animação de **APROXIMAR** (a palavra cresce de longe até o tamanho final) com **curva elástica profissional** (elástico PEQUENO ~6%, duração ~0,32 s — 0,2 s ficou rápido demais, 0,5 s lento —, começa em 45% do tamanho; borda preta GROSSA = 30% do tamanho da fonte — "não pode parecer CapCut"), com ORIGEM NA BASE da palavra (cresce de baixo pra cima) e um desfoque PEQUENO e profissional (máx ~2 px em 1080, some em 0,1 s) — NÃO é "pop" — (antes: leve
  desfoque** que some quando a palavra assenta; sincronia 100% com a voz (timestamps palavra a palavra do faster-whisper,
  corrigidos à mão se precisar). Voz agora é de IA.

## Protagonista (ele mesmo) — `protagonist()` em roblox_base/src/rbx.js
Cabeça branca com rosto sorridente, **cartola azul com faixa vermelha**, tronco vermelho, braços brancos, pernas pretas.
Ajuste pedido por ele: cartola **mais baixa e encaixada** (a cabeça entra na copa), **copa mais curta**, **menos testa**
(olhos/boca um pouco mais baixos no decal). Vários outros personagens Roblox serão necessários em cada vídeo
(cabelos, roupas, tons de pele variados) — sempre no mesmo padrão de qualidade.

## Pipeline Roblox (roblox_base)
- `rbx.js`: classe `Rbx` (R6: quadril/tronco/pescoço/cabeça/braços/pernas com pivôs), `drawFace` (decal com eyes/mouth/brow/
  talk/blink/tears/blush), `topHat`, `plastic()`.
- `act.js`: gestos com antecipação/overshoot (wave, point, think, shrug, cheer, chest, scared, facepalm, angry, sad, reach,
  hips), `walkPath` com parada suave, `alive`, `talk` (boca falando), `startle` (pulo de susto com squash).
- `subs.js`: legendas KOMIKAX palavra a palavra (pop elástico + blur), vermelho nas palavras-chave.
- `main.js`: câmera em 2 passadas, pós: GTAO + Bokeh (foco no personagem) + bloom + grade (saturação/vinheta) + legendas.
- Render pesado (AO + DOF em 1080×1920): ~3–5 s/quadro → renderizar em 4 partes em paralelo; testar com stills antes.
- **Skins v1 REPROVADAS** ("MUITO FEIAS": blocos lisos, cabelo = touca simples). Padrão agora = `roblox_base/src/chars.js`
  (`dressed()`, `hero()`, `CAST2`): mãos em C, roupas com textura desenhada em cada face (listras, xadrez, camuflado, jaqueta
  aberta + camiseta, terno com lapela/gravata, moletom com bolso/cordão/degradê, blusa, shorts/jeans com costura), tênis 3D com
  sola, **cabelo = touca no formato da cabeça cortada na linha do cabelo (nunca cobrir olhos) + dezenas de mechas 3D curvas e
  afiladas com textura de fios** (mechas sobre a touca até a franja recortada + mechas longas/espetadas/coque conforme o estilo).
  Referências de cabelo/skin que ele mandou: liso longo com mechas claras, ondulado loiro, liso preto, "Pal hair", espetado,
  bagunçado preto, Bacon, Acorn (coque ruivo), menina com space buns, menino com moletom degradê e topete.
  Variar MUITO entre personagens (cor de pele, cabelo, roupa, estampa), sempre nesse nível.
- **NUNCA personagem sobreposto a personagem ou objeto** (nem em lineup/teste): espaçar, um por vez no quadro de apresentação,
  e checar colisão nas cenas.
- **Sincronia (Roblox)**: `roblox_base/transcribe.py <audio> [saida.json]` usa **faster-whisper large-v3-turbo** (ele liberou
  baixar o que precisar; baixa sozinho do HF se o container for novo, ~1,6 GB) + **ajuste do início de cada palavra no ataque
  real do som** (envelope RMS, janela −120/+80 ms). Testado na narração do Foxy: 24 s pra 60 s de áudio e acertou palavras que
  o 'small' errava ("encolhe", "invadir"). Legenda e corte de cena usam esses tempos; conferir o vídeo com áudio no fim.

## Regras dele pra TODO vídeo Roblox (EP01 "relógio da mãe")
1. Estudar as referências; movimento fluido seguindo o personagem/foco; sem bugs.
2. Cenas com sentido pro contexto, profissionais, sincronizadas com a fala.
3. Bastante movimento e cenários diferentes, nada repetitivo (prender o espectador).
4. **Cortar os silêncios da narração** (`roblox_ep01/cut_silence.py`: pausas ≥0,16 s viram 0,09 s, fades de 8 ms).
5. Qualidade máxima: nada atravessando nada, personagem nunca sobre outro nem dentro de objeto, skins bonitas.
6. Expressões coerentes, estilo Roblox, fluidas.
7. **Sempre a música dele** (`roblox_base/assets/music/temporex_numbers.wav`) **abaixo da voz**, mas audível.
8. **Voz 3× mais alta sem estourar**: `highpass=f=70,acompressor=threshold=-26dB:ratio=3.5:attack=4:release=100:makeup=2,
   loudnorm=I=-14:TP=-1.2:LRA=7,alimiter=limit=0.87` → média ≈ −13,6 dB. Música com `volume=-14dB` (média ≈ −29 dB, ~15 dB
   abaixo da voz), fade-in 0,3 s e fade-out 2,5 s no fim; voz mono → `pan=stereo|c0=c0|c1=c0` antes do amix (normalize=0).
- Lições de enquadramento (vertical!): dois personagens lado a lado precisam de ~4,2–4,8 de distância entre centros (braços R6
  ocupam ±2) e câmera a ~8–10 de distância; braço R6 é reto (alcance fixo 2) → posicionar o personagem pra que a mão chegue no
  alvo; câmera sempre do lado pra onde o rosto aponta; nada de luz só por trás (rosto vira silhueta); sprites (corações, "!")
  ficam fora do GTAO (senão aparece um quadrado escuro).
- **Render rápido (Roblox, CPU/swiftshader):** GTAO em meia resolução + 6 amostras, render interno a 0,8 (`RS=0.8`, 864×1536)
  e upscale lanczos pra 1080×1920 no ffmpeg (igual a olho nu); no máximo 2 processos em paralelo (4 ficava MAIS lento).
  ~1,3 s/quadro → ~70 min pra 2 min de vídeo. Ele reclamou de 3 h ("os de FNAF eram 30 min") — medir s/quadro ANTES de renderizar.

## ANÁLISE PROFUNDA DAS REFERÊNCIAS ROBLOX (16 vídeos, quadro a quadro) — PADRÃO PROS PRÓXIMOS (pedido: "fidelidade máxima")
Ele cobrou: "não está parecido com as referências; nem todos têm corpo quadrado R6 — a maioria é o PADRÃO do Roblox".
- **Rig = R15 em TODOS** (inclusive os "quadradões"): ombro, COTOVELO, pulso, quadril, JOELHO, tornozelo. Sentados dobram o
  joelho (perna de baixo vertical), braços dobram no cotovelo (mão no queixo, mão na cintura, segurar objeto na frente do peito).
  Mãos = bloco "C" com polegar (pega objetos de verdade). Pés com tênis/sapato separados.
- **Dois tipos de corpo** (mesma altura base, tamanhos fixos por categoria):
  1. *Blocky* (o protagonista deles e o MEU): peças quadradas com chanfro leve; ombros largos.
  2. *Padrão Roblox 2.0 / "Woman"* (a MAIORIA): tronco levemente afunilado (ombro > cintura), braços/pernas mais finos e
     arredondados, cabeça clássica. Crianças = mesmo corpo em escala menor; adultos/velhos maiores.
- **Rostos**: decal 2D clássico (sorriso, "o", sobrancelha brava, lágrima azul, rubor) + rostos ANIME pras meninas (olhos grandes
  coloridos com brilho, cílios, boca pequena) + rostos detalhados de vilão (rugas/dentes). Óculos 3D grossos.
- **Cabelos**: malhas 3D GROSSAS e lisas, em blocos/mechas largas (não fios finos): rabo de cavalo com elástico, maria-chiquinha
  com laço, franja reta, espetado de anime, liso longo até a cintura, careca/grisalho com entradas, coque. Chapéus: ushanka, boné,
  coroa, capacete de bombeiro, chef. Proporção: cabelo encaixa na cabeça, volume moderado.
- **Roupas**: texturas "Classic shirt/pants" (moletom com bolso, camisa xadrez, listras, terno, pijama estampado de estrelas,
  uniforme de futebol com número, macacão) + peças 3D às vezes (saia, colete, capa).
- **Variedade**: cada personagem diferente (pele clara/morena/negra, cabelo, roupa); figurantes também.
- **Cenários**: MUITO detalhados, cheios e coerentes (quarto com cama/abajur/quadros/tapete/cortina; sala com poltrona estampada,
  relógio, estante; bunker com prateleiras de latas, placas "REGRAS", porta blindada com volante, faixas de alerta; rua com casas
  de 2 andares com sacada, calçada de pedra, postes, árvores low-poly arredondadas; cidade noturna com prédios iluminados; estádio
  com torcida; sala de aula com carteiras). Cores saturadas, luz quente de lâmpadas, DOF forte, bloom.
- **Elementos gráficos 3D**: relógios de parede, placas/painéis LED com texto, balão de pensamento, "Z z z" de sono, "?" "!",
  círculo destacando objeto, corações. Legenda branca com borda (vermelho nas palavras-chave).
- **Movimento**: caminhada natural com joelho e cotovelo; gestos com antebraço; sentar dobrando o joelho; abraços com braços
  dobrados (sem atravessar); câmera perto, altura dos olhos, close de rosto nas reações.
- Protagonista dele: cartola AINDA MENOR (pedido depois do EP01).
- **CORREÇÃO (ele brigou: "as meninas NÃO são assim, nem a maioria dos meninos")**: o corpo da MAIORIA é o **R15 fino
  ("Woman/Man")**: tronco mais ou menos da largura da cabeça (uma peça só, levemente afunilada), **braços e pernas FINOS e
  CILÍNDRICOS** (cápsulas, raio ~0,22–0,27), mãos C pequenas, sapatos pequenos; cotovelo e joelho. Quadradão (blocky) SÓ pro
  protagonista. `body: 'slim'` em roblox_base/src/chars.js. Cabelo = malha esculpida lisa e brilhante com mechas pontudas
  (franja com pontas, volume), NÃO blocos grossos e NÃO fios texturizados. Estudar os closes em resolução cheia, nunca só miniaturas.
- **Render e disco:** o disco encheu durante a render do EP01 e a 2ª metade saiu ESCURA (sombra/iluminação quebrada no Chromium),
  sem nenhum erro no log. Antes de renderizar: `df -h` (≥10 GB livres) e não rodar testes pesados em paralelo; depois: medir o
  brilho de quadros do vídeo final contra stills dos mesmos tempos antes de entregar.

## PADRÃO PROFISSIONAL ROBLOX (pedido dele: "o próximo vídeo já terá um nível totalmente superior") — REGRAS FIXAS
Personagens:
- **Corpos OFICIAIS do Roblox** exportados por ele (`roblox_base/assets/roblox_export/ROBLOX_EXPORT/`): Feminino/Masculino (2016,
  maioria do elenco) e Masculino quadrado (2012, SÓ o protagonista). Montados em `roblox_base/src/realbody.js` (`loadBodies()`,
  `realChar()`) com articulações nos RigAttachments oficiais. Cabeça clássica + rosto 2D nosso (a dele é protegida). Cabelos e
  acessórios do catálogo NÃO exportam (bloqueio de permissão) → modelados por mim, fiéis às referências, cores variando entre vídeos.
- Mãos posicionadas por **IK** (alvo no mundo: queixo, peito, objeto, ombro de outro) — nunca ângulos fixos que atravessam o corpo.
- Expressões fortes e coerentes com a fala (decal 2D), troca suave; piscar rápido nos humanos.
Verificação ANTES da render (pra não perder tempo):
1. Lineup de cada personagem novo: frente, 3/4, perfil, costas, andando, sentado, gesto — conferir em close.
2. Checagem automática de colisão (zero ATRAVESSA) + conferência visual de mãos, props e cabelo em close.
3. Contact sheet 3 quadros por cena (15/50/90%) — enquadramento, luz (rosto iluminado, nada de silhueta), câmera fora de objetos.
4. Medir s/quadro e `df -h` antes; nada pesado em paralelo; brilho do vídeo final conferido contra stills.
Direção:
- Cenas rápidas (~1,5–2 s), cada uma ilustra literalmente a fala; câmera fluida (push-in, órbita curta, punch-in na palavra-chave).
- Cenários 3D coerentes, cheios e "cara de Roblox" (nada de PNG colado; textos só como objetos 3D do mundo: placas, telas, relógios).
- Efeitos sonoros coerentes e discretos por baixo da voz (whoosh nos cortes fortes, plim nos números, passos, porta, multidão),
  sem repetir o mesmo som; música dele sempre ~15 dB abaixo da voz.

## REVISÃO COMPLETA DAS 16 REFERÊNCIAS (1.511 cortes = 1 quadro por corte de cena, todos os vídeos) — aplicar FIELMENTE
**Ritmo e lógica de corte**
- ~55–65 cortes por minuto (1 corte a cada ~1–1,5 s). Cada corte = UMA palavra/ideia mostrada literalmente:
  "1926" → letreiro LED; "mundo" → globo; "votos" → urna; "navios" → navios no mar; "ilha" → ilha vista de cima;
  "churros"/"fervendo" → barraca + espiral de massa; "12:06" → relógio do painel do carro; "San Lucero" → placa da estrada;
  "aniversário" → bolo com velas; "oitocentos" → pilha de bilhetes; "pétalas" → cerejeiras; "pedras" → Torre Eiffel (viagem).
- **Inserts de objeto** (sem personagem) são ~20% dos cortes: relógio de parede, calendário, despertador, comida no prato, placa,
  TV de notícias, celular/botão, porta, carta. Eles dão ritmo e explicam a fala.
- **Planos de situação** curtos (rua inteira, estádio, mapa, estrada de cima) abrem cada nova parte da história.
**Câmera** (variar SEMPRE, nunca 3 iguais seguidos)
- Plano médio/corpo inteiro na altura dos olhos, personagem centralizado (maioria); close de rosto nas reações; close de mãos
  com objeto; plano aéreo/de cima (cama, mapa, ilha, estrada); contra-plongée em gigantes/monstros; POV (de dentro do carro pelo
  para-brisa, olhando pela janela); por cima do ombro; travelling acompanhando quem anda; push-in nas palavras-chave.
**Personagens**
- Protagonista (o dele) em quase todo corte, com o corpo quadradão; ele anda em direção à câmera, aponta, reage, segura objetos.
- Elenco = corpos padrão R15 com roupas "classic" (xadrez, listras, camisa de time com NÚMERO, terno, uniforme laranja de presídio,
  farda militar verde, avental de chef, pijama de estrelinhas, jaleco); cabelos de catálogo lisos e brilhantes; meninas com rosto
  anime; idosos grisalhos com óculos grossos; vilões com rosto detalhado; crianças menores. Figurantes MUITOS e variados
  (multidões na rua, torcida no estádio, sala de aula cheia, dormitório com 30 camas coloridas).
- **Marcadores de história no corpo**: contador/plaquinha com número no peito ("12", "0", "99.996"), relógio no pulso, botão
  PLAY/PAUSA na mão, moeda/medalha — o "objeto mágico" de cada história é sempre visível e reaparece nos momentos-chave.
**Cenários** (um mundo coerente por vídeo + vários ambientes internos)
- Rua colorida estilo mediterrâneo (sobrados com sacada, calçada de pedra, torre do relógio, fonte, pombos voando, árvores
  low-poly redondas, postes, bandeirinhas); escola (corredor de armários coloridos, sala com lousa verde "PROVA", relógio,
  cartazes); sala (poltrona estampada, abajur, quadros, tapete); quarto (cama com cobertor colorido, criado-mudo, janela);
  hospital (monitor cardíaco); presídio (paredes cinza com faixa verde, guichê "COZINHA", bilhetes); palácio (piso xadrez
  vermelho/branco, trono, guardas); festa noturna (bandeirinhas, lanternas, barraca de churros, palco com bateria); reino de
  fantasia (castelo, montanhas low-poly, golens); escadaria gigante com torcida dos lados; bunker; cidade zumbi noturna.
- Textos SÓ como objetos do mundo: placas, letreiros LED, calendários de folha ("SEGUNDA/TERÇA 14", "MARÇO SEMANA 1"),
  lousa ("SEMANA 2", "DIA 1"), TV de notícias com faixa ("URGENTE…"), cartazes "PROCURA-SE", papel na mão.
**Efeitos** (3D, coerentes, nunca colados)
- Chuva, neve, pétalas, folhas; congelar (tinta azul + gelo); brilho/aura dourada (desejo, magia); raios azuis (poder); fumaça;
  confete; dinheiro voando; corações; "Z z z" roxos sobre quem dorme; ícones "?" "!" e triângulo de alerta; etiqueta "$1";
  motion blur em ação rápida; flashback em sépia/cinza; noite = azul + janelas quentes + lanternas coloridas.
**Luz e cor**: saturado, sol quente com sombra suave, bloom nas luzes, fundo desfocado nos closes, interiores com luz quente de
  abajur/teto; cada cena tem uma fonte de luz plausível.

## BÍBLIA DE PRODUÇÃO ROBLOX v2 — MEDIDA nas 16 referências (1.410 planos, transcrição palavra a palavra) — SEGUIR À RISCA
### Números medidos (não chutar)
- **Plano**: mediana 1,47 s (média 1,67); 34% < 1,2 s; 20% entre 2–3 s; 8% > 3 s. ~90 planos em 2:20.
- **Corte ↔ fala**: o corte cai **~1 quadro ANTES do início da palavra** (mediana −0,04 s; 88% a ±0,2 s; 61% antes).
  Corte nas fronteiras de oração (~1 corte a cada 4–6 palavras; narração ≈ 235 palavras/min).
- **Câmera**: 94% dos planos se movem. **Push-in em 75%** (zoom mediano **4,8%/s**, p75 7,4%/s, p90 11%/s); pull-out 9%
  (revelar/descrever, abrir parte nova); pan/tilt ~13% (acompanhar ação: "correu" = tilt/pan; "se transformou" = tilt-up).
  Movimento sempre suave (sem tranco). Estático só em inserts e falas curtas.
- **Gramática da fala**: gancho = 1ª frase quebrada em 2–4 planos nos primeiros 3 s; LISTAS = 1 plano por item (0,8–1,1 s);
  números/tempo ganham plano próprio ("a cada 100 anos", "4 bilhões de votos", relógio/calendário); planos longos (3–6 s) só
  pra descrição com várias ações dentro do mesmo plano + câmera viajando; explosões dramáticas = rajada de planos de 0,2–0,5 s
  (flash/whip/congelar).
### Atuação (corpo + rosto juntos, sempre exagerado)
- chorar = mãos no rosto (`coverFace`) + rios de lágrima azuis (`cry`) + tremor; gritar = olhos em círculo (`circle`) +
  boca escancarada (`scream`) + mãos na cabeça (`handsHead`); rir = cabeça pra trás + olhos fechados + boca aberta (`laugh`);
  medo = olhos em círculo/encolhido (`scared`, suor) ou escondido debaixo do cobertor só com os olhos; raiva = braços cruzados
  (`crossArms`) ou punho erguido (`fistUp`); pensar = mão no queixo (`think`); dúvida = `shrug` + "?"; susto = pulo (`startle`).
  Poses em `roblox_base/src/poses15.js` (IK nos alvos do próprio corpo; `mirror` = braço de fora). Rostos em `drawFace`
  (olhos: normal/wide/circle/squeeze/happy/closed/sad/angry/tired/anime; bocas: smile/grin/laugh/scream/grimace/o/smallo/frown/
  flat/wavy; extras: cry, tears, sweat, blush, brow, browUp).
- Ninguém parado: respiração (`alive`), cabeça viva, gesto na palavra. Mesmo gesto no máx. 2× por vídeo.
### Personagens (padrão novo)
- Corpos OFICIAIS (`realbody.js`) + **roupa clássica pintada no atlas oficial** (`outfit.js`: plain, tee, stripes, plaid,
  jersey c/ número, hoodie c/ cordão e degradê, sweater, suit c/ gravata, jacket, polo, pajama de estrelas, prison c/ crachá,
  military, camo; calças jeans/pants/shorts/skirt/track/pajama/plaid; tênis com sola/cadarço/listra; botas).
- **Cabelo v4** (`hair4.js`): calota lisa + mechas grossas brilhantes com PONTAS (franja reta pontuda, laterais, nuca);
  estilos long(+buns), ponytail(+laço), pigtails, bob, boy, bacon, spiky, messy, old, bun. Trocar cor entre vídeos.
- Elenco sempre variado (pele, cabelo, roupa, estampa); crianças com escala fixa menor; idosos com óculos/cabelo grisalho.
### Cenários (kit `roblox_base/src/kit.js`) — PROPORÇÃO FIXA (ele cobrou: "personagens do tamanho das construções")
- Personagem ≈ 5,2. Porta 4,6 × 7,8 (≈1,5× o personagem) com batente, dobradiça, maçaneta e **corredor iluminado atrás**
  (porta nunca abre pra parede/bloco sólido); pé-direito 12; andar 12; sobrado ≈ 26; janela peitoril 3,4 × 4 de altura;
  mesa 2,4; assento 1,15; cama 1,8; armário escolar 7,2; poste 11; árvore ~9.
- Personagem que entra/sai: a porta abre ANTES (sm 0–0,8 s), caminho pelo CENTRO do vão, sem encostar na folha aberta.
- `obstacleCheck` (kit.js): toda parede, batente, folha de porta e móvel é obstáculo → zero `LOG ATRAVESSA` antes da render.
- **Fontes**: KOMIKAX SÓ na legenda. Todo texto do mundo (placas, lousa, TV, relógio digital, hologramas, crachás) em
  **Montserrat 900** (`assets/fonts`, `textTex()`), igual às placas das referências.
- **QA de câmera automático** (`cameraCheck` em kit.js): a cada quadro, raio da câmera até o rosto de cada personagem →
  `LOG OCLUSAO` (parede/árvore/móvel na frente) e `LOG FORA_DO_QUADRO` (rosto fora da área vertical). Junto com
  `obstacleCheck` e a colisão entre personagens: só renderiza com ZERO logs (`node render.mjs check`). Já pegou um erro real no
  demo (câmera atrás da parede na cena da porta).
- Gestos por tipo de corpo: o quadradão (braços grossos) usa alvos mais abertos/à frente (poses15 ajusta sozinho) e "pensar"
  só com uma mão. Base de referência visual: `roblox_base/src/demo.js` (DEMO_NOVO_PADRAO).
- **Decisões dele (depois da demo):** protagonista no **corpo masculino PADRÃO** (`heroStd()` em realbody.js: pele branca,
  regata vermelha, calça/tênis pretos, cartola azul) — não mais o quadradão. **Cabelos = HAIR4 (v4)**; a tentativa HAIR5
  (cabelos de catálogo com textura de fios) foi REPROVADA ("pontas, tufos, calvícies, feio") — não usar HAIR5.
  Ele não quer testes/renders extras sem pedir: renderizar só o que ele pedir.
- **Cabelos (decisão dele):** MENINOS = `hair6.js` (volume liso único + relevo 3D leve, fios pintados): boy, quiff (topete),
  curtains (repartido), buzz (raspado), messy (bagunçado arrumado), spiky (espetado suave), surfer (médio), curly (cacheado) —
  variar formato E cor. MENINAS = HAIR4 originais da demo (ponytail, long(+buns), pigtails, bob, bun), sem "ajeitar".
  Catálogo de referência: `roblox_base/out/CATALOGO_CABELOS.jpg` (gerado por hairsheet.html). Mostrar 1 imagem antes de usar
  cabelo novo; não fazer render de vídeo pra testar.
- **QA único por quadro (`qa()` em kit.js)** = `charCheck` (todas as peças R15 entre personagens) + `obstacleCheck` (paredes,
  batentes, folhas de porta, móveis) + `cameraCheck` (oclusão/enquadramento). Todo episódio novo chama `qa()` no renderAt e só
  renderiza com `node render.mjs check` dando ZERO logs. Portas: abrir ANTES de alguém passar, para o lado oposto de quem vem.
  Animações: poses15 (IK) + walkPath com parada suave; câmera push-in ~5%/s; sempre comparar com as referências (bíblia v2).
