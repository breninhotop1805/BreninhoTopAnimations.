# Guia de Estilo: Shorts de GTA 6 (Breninho)

> Claude: leia este arquivo inteiro antes de editar qualquer vídeo deste canal.
> Estas são as regras do dono do canal. Elas valem acima de qualquer outro kit ou guia.

## As 12 regras do canal

1. **Formato vertical 9:16 (1080x1920).** Por enquanto, só Shorts.
2. **Cortes rápidos, de 1 a 2 s no máximo.** Quando a cena está *mostrando* algo, ela dura o tempo da fala
   sobre aquilo. Cada cena tem que bater com o **sentido** da narração e ser a melhor opção disponível.
3. **Zoom quase sempre.** O padrão é aproximar lentamente, como keyframe. Também pode afastar.
   Curva **linear (reta), lenta e sem exagero** na maioria das vezes. Curva com easing só quando o contexto pedir
   (por exemplo, apontar um item que a narração cita: "olha a chave").
4. **Fundo desfocado como padrão** (gameplay numa faixa no meio e fundo borrado). **Tela cheia** quando ficar melhor
   mostrar de perto.
5. **Efeitos sonoros:**
   - **Troca de cena brusca (corte seco):** quando tiver som, é **sempre** um dos 2 efeitos do canal
     (`sfx/corte_clique.wav` ou `sfx/corte_dano.wav`). Nem todo corte precisa de som.
   - **Transições de verdade são RARAS: 2 a 4 por vídeo.** Tipos: aproximar (zoom in), afastar, arrastar
     a câmera rápido pro lado (whip) e flash.
     - Zoom e whip levam som de **vento/whoosh**.
     - Flash leva som de **flash**: `sfx/flash_1.wav` (curto, ~0,3 s) ou `sfx/flash_2.wav` (câmera, ~1 s).
       **Um flash por vídeo**, alternando entre os dois de um vídeo pro outro.
   - Efeitos temáticos (sirene de polícia etc.) são permitidos quando fizerem sentido, **sempre abaixo da narração**.
   - **Nunca** colocar efeito sonoro em zoom lento, em movimento de câmera dentro da cena ou em ação do jogo.
6. **Música e legenda agora são feitas por mim** (o dono mudou a regra): música de fundo fixa e legenda no padrão aprovado (ver abaixo).
7. **Sem áudio do jogo.** Tirar 100% do som da gameplay (as falas em inglês ficam ruins).
8. **Narração intocada.** Não mudar volume, EQ, ruído nem qualidade. Usar exatamente o arquivo enviado.
9. **Texto na tela só se for necessário e clean** (por exemplo, a altura de algo). **Logo do GTA 6: no máximo 1 vez**
   (2 no máximo absoluto), de preferência só na intro.
10. **Seguir as referências.** Animações explicativas (estilo synthwave) na intro e/ou no meio, quando a ideia pedir.
    Têm que ser bonitas, fluidas e sem bugs. Exemplo: o vídeo das 6 estrelas abre com uma animação.
11. **Nada de cena tosca ou sem sentido.** Tudo tem que combinar com a fala. Use o mapa das 29 h pra achar a cena certa.
12. **Se precisar de um fundo, logo ou asset, peça pro dono.** Sempre que isso deixar o vídeo melhor.

Meta: ser **mais profissional que as referências**. Prender do início ao fim. Ser criativo, mas com controle.

## O que as referências mostram (análise de 6 vídeos, 31 a 43 s cada)

| Referência | Duração | Cena média |
|---|---|---|
| Por que o 99 do GTA 6 no Metacritic não é empate com o Zelda | 39 s | ~2,8 s |
| O que acontece se jogar o ovo de Páscoa da torre mais alta | 35 s | ~2,2 s |
| O que acontece se pegar 6 estrelas | 42 s | ~2,2 s |
| Quantos mapas do GTA 6 cabem no Minecraft | 43 s | ~3,0 s |
| Por que os códigos não funcionam no GTA 6 | 39 s | ~3,6 s |
| O que acontece se só comer besteira | 31 s | ~3,1 s |

(A detecção automática não pega todos os cortes, então o ritmo real é um pouco mais rápido. O dono pede 1 a 2 s.)

- **Duração típica:** 30 a 45 s.
- **Layout com fundo desfocado:** a gameplay 16:9 fica numa faixa central **um pouco mais larga que a tela**
  (cerca de 1,2x, com as laterais cortadas). Em cima e embaixo, a mesma imagem ampliada e bem borrada.
  Isso também esconde a logo do canal do amigo, que fica no canto superior direito.
- **Animações synthwave** (intro ou meio): céu roxo em degradê, sol amarelo-laranja com faixas, grade neon rosa
  em perspectiva se movendo, silhueta de palmeiras e prédios. Por cima entram elementos explicativos:
  logos (GTA VI, Zelda), estrelas de procurado, contadores de números subindo, pódio, relógio/cronômetro,
  torre, ovo etc. Os elementos entram de forma fluida.
- **Outras inserções explicativas:** mapa com marcação, globo terrestre, tela de download, prints (notas, sites).
- **Gancho imediato:** o primeiro frame já mostra o tema (animação ou a cena principal).

## Material disponível

- **Gameplay completa:** 29 h (104.380 s), 1080p60, com logo do canal do amigo no canto superior direito
  (sempre cortar fora). O dono tem permissão do amigo. Colocar crédito na descrição do vídeo.
  - Drive: pasta "Vídeos Claude" → `GTA 6 JOGO COMPLETO, TODAS AS 9 PARTES.` → id `1ZbWpJFrMcihiK9ES_1KwKfZEaOjD9-7e`
  - Download: o link público estoura a cota anônima do Google (~2,7 GB). É preciso uma chave temporária
    de leitura (OAuth Playground, escopo `drive.readonly`), salva como Network secret pra `www.googleapis.com`,
    e baixar por `https://www.googleapis.com/drive/v3/files/<id>?alt=media` com `curl -C -`.
    Depois, o dono remove o acesso em myaccount.google.com/permissions.
  - Mapa: miniaturas a cada 10 s, geradas com `-skip_frame nokey` (~11 min), e folhas 8x8 (~10 min de jogo por folha).
- **Prologue:** 17 min em 1080p (id `12-A1VpgmdhaoXMBy9Paum-R-OAcd_IqU`), com marca GTASERIES no canto superior direito
  e legenda em inglês gravada na imagem.
- **Kit GTA 6** (zip enviado pelo dono): gameplay de 25 min em 720p, logos GTA VI e Rockstar (PNG transparente),
  efeitos whoosh, whoosh-cinematico, glitch, riser, pop, clique, dinheiro, relógio e notificação.
  Do kit, **usar só os assets**. O estilo do kit (legendas, botão inscreva-se etc.) **não** vale pra este canal.
- **Pack de 70 efeitos** (id `14DWvrltU9zMbEMqyXU9sZc0M7d6V3w_s`): lista em `editor/efeitos-pack-70.txt`.
- **Pasta do Drive:** https://drive.google.com/drive/folders/1_UYj-WXsrFVJThSxX8-flCkIPGizHW67
  (subpastas Gameplay e Efeitos). Referências e narração chegam pelo chat.

## Técnica

- Motor de câmera: `editor/tools/camera.py`, com keyframes, Lanczos, nitidez leve e máscara pra cortar a logo
  e as tarjas pretas.
- Exportação: H.264 com CRF 16 ou menor, preset slow, 1080x1920, 30 ou 60 fps, áudio AAC 256k.
  A narração entra como está, sem processamento.
- Sincronia: transcrever a narração com marcação de tempo por palavra (whisper) pra cortar e dar zoom
  exatamente na palavra certa.

## Lições do vídeo 1 (o que o dono aprovou e o que reprovou)

- **Reprovado:** animações paradas, logos pequenas, zooms tímidos (7–10%), coroa e pódio "de enfeite",
  logo passando por cima de outra, cenas associadas de forma forçada, efeitos sonoros baixos.
- **Aprovado:** intro no estilo da referência do Metacritic (logo nascendo de dentro do sol, selo 99 encaixando,
  medalhas 1 e 2), **câmera sempre andando**, **física de mola** em tudo (sem saltos de velocidade = sem "travadinha"),
  **motion blur** real (média de subquadros), tremores como impulso de mola, **60 fps**.
- **Zoom:** sempre presente e visível (15–25%), alternando aproximar e afastar entre as cenas. Nada de zoom exagerado
  num detalhe (por exemplo, nos óculos).
- **Cenas:** a fala manda. Procurar no mapa das 29 h a cena que *literalmente* ilustra a frase. Os capítulos finais
  (~25 h–26,6 h) têm as vistas aéreas de Vice City, o pôr do sol entre prédios e Jason e Lucia no terraço.
- **Efeitos sonoros:** cada som tem que combinar com o evento (whoosh = movimento ou transição, pop = selo ou elemento
  aparecendo, glitch = erro, flash = flash, dano ou clique = corte seco). Volume audível, sempre abaixo da voz.

## Enquadramento (regras do dono, a partir do vídeo 2)

- **Padrão: fundo desfocado** com a gameplay **grande** (faixa de ~1,5x a largura da tela) e **um pouco acima do centro**,
  porque **embaixo entra o título do vídeo**, que o dono coloca. Nunca deixar algo importante colado no rodapé.
- **Mas não usar fundo desfocado o tempo todo**, pra não ficar repetitivo. Usar **tela cheia** quando:
  - tiver **um personagem no centro** e os lados não importarem;
  - um **carro** (ou outro objeto) couber bem no recorte vertical **sem perder qualidade nem ficar irreconhecível**.
- **Rastreamento (segmento):** nos próximos vídeos, aplicar **acompanhamento de rosto, carro ou objeto de destaque**
  (a câmera segue o elemento), quando ficar bom.
- **Zoom** sempre presente e visível, alternando aproximar e afastar, sem exagero.
- **Sons nos cortes secos:** o **clique do Minecraft** é o favorito. Usar **bastante** e **alto**. O **dano** entra de vez em quando.
  Nas animações, os sons variam conforme o contexto.
- Pensar sempre num vídeo **variado, confortável pro público e que prenda a atenção do início ao fim**.
- **Área segura do título também nas animações:** nada importante no terço de baixo (exemplo: o Zelda da intro do vídeo 1
  ficou baixo demais e seria coberto pelo título). Também não jogar tudo pro topo. A composição deve ficar **centralizada**,
  numa altura confortável, com movimentos fluidos, com sentido e na qualidade máxima.

## Legendas (aprovado pelo dono, padrão a partir de agora)

- **Fonte:** Komika Axis (`editor/fontes/KOMIKAX_.ttf`), tamanho **84 px** (em 1080x1920), branca, **contorno preto de 14 px**
  e sombra suave.
- **Palavra por palavra**, no **terço inferior** (centro em y ≈ 1470). Palavras curtíssimas (menos de 0,11 s, com até 2 letras, tipo
  "o", "um", "de") se juntam com a seguinte pra não piscar.
- **Animação:** pop com mola (nasce em 62% do tamanho, dá um leve salto e assenta) + desfoque só nos primeiros quadros.
  **Sem fade:** a palavra já nasce opaca.
- **Sincronia (o ponto mais importante):** alinhamento forçado por fonemas (`editor/tools/alinhar.py`, wav2vec2 em português)
  com o texto exato da narração, conferido contra a energia do áudio. A palavra entra **2 quadros antes** (33 ms).
  Nunca usar só os tempos do Whisper, que erram até 0,27 s.
- Ferramenta: `editor/tools/legendar.py <video> <palavras_alinhadas.json> <saida>`.

## Volume e quantidade de efeitos (regra fixa)

- **Cliques do Minecraft:** **não é número fixo.** Usar uma **boa quantidade** (mais pra muito do que pra pouco), na maioria
  dos cortes secos, mas **nem todo corte leva clique**: decidir pelo ritmo do vídeo. Referência do vídeo 1: 12 em ~55 s
  ficou bom. **Dano:** de vez em quando.
- Usar sempre as versões **limpas** (`sfx/corte_clique_limpo.wav`, `sfx/corte_dano_limpo.wav`).
- Ganhos de referência (vídeo 1 final): clique 1,45 e dano 1,25, com limitador de pico em 0,89; whoosh ≈ 1,1;
  pop ≈ 0,9; flash ≈ 0,9; glitch ≈ 0,85. Limitador final em 0,99 na mixagem.

## Música de fundo e master final (regra para todos os vídeos de GTA)

- **Música:** sempre `editor/musica/musica_fundo_gta.mp3` (enviada pelo dono), começando no início do vídeo.
- **Sempre mais baixa que a narração:** ganho de **-6 dB** sobre o arquivo original (aprovado pelo dono), ficando uns 6 dB abaixo da voz (uns 9 dB enquanto ele fala),
  com ducking leve (sidechain, ratio 2) que abaixa a música enquanto o dono fala.
- **Fade out de 1 s** na música, terminando junto com o vídeo.
- **Volume geral alto** (o "400 do CapCut"): a narração do dono **já chega em cerca de -5 LUFS**, ou seja, já vem alta.
  Não amplificar mais (iria distorcer). O master final fica em cerca de **-7 LUFS integrado**, com limitador e teto em
  **-1,6 dBFS** (pico real abaixo de 0 dBTP): alto pra celular e sem estourar.
- Ferramenta: `editor/tools/master.sh <voz_e_efeitos.mp4> <musica> <video_legendado> <saida> <duracao> -6`.
- **Ordem do fluxo:** render do vídeo → mixagem (narração + efeitos) → legenda → master (música + limitador).

## Fluxo de material novo (outros jogos, bugs, easter eggs)

- **O dono baixa o vídeo inteiro e sobe no Drive** (subpastas por jogo: GTA 5, San Andreas, Vice City, Bugs e Easter Eggs...).
- **Sempre que um arquivo novo chegar, eu peço o tempo da cena**, por exemplo: "Bugs de GTA 5: já recebi o arquivo, me fala só o
  tempo certo". O dono costuma passar o tempo **2 a 3 s antes** da cena. Eu mapeio a partir dali, acho o início e o
  **fim exato** da cena e corto só ela.
- **Storyboard antes de renderizar (obrigatório):** mandar ao dono uma imagem com a cena escolhida pra cada frase do roteiro
  (miniatura, tempo e origem). Só renderizar depois da aprovação.
- **Biblioteca:** tudo que chegar é catalogado e reaproveitado em vídeos futuros. Anotar a origem pra o dono dar crédito.
- **Gravação de tela (teste de 24/11):** 2400x1080 a ~59 fps, com área útil de 2074x1080 (barras pretas nas laterais).
  Qualidade boa, mas surgem controles do YouTube ao tocar na tela, barra de status e notificações. Só usar os trechos limpos.
  Recorte: `crop=2074:1080:176:0,scale=1920:1080,fps=60`, sem áudio. Arquivos pesados (~28 Mbps), então baixar o vídeo
  inteiro costuma ser mais prático.
- **Nunca** baixar do YouTube daqui (bloqueado e contra as regras). Sem memes por enquanto.

## Biblioteca de material (Drive)

- Minecraft (pasta "Minecraft."): shaders cinematográfico 1080p60 (lago no pôr do sol 6–12 s, árvore 15–21, montanha com nuvens 42–55,
  montanha com flores 105–108, vale dourado 111–121; a partir de 122 é noite), gameplay BSL com HUD, pre-alpha 2009 em 480p
  (cortar o topo, y≥40, por causa do texto de debug; paisagem limpa em 138–145 s, Steve no horizonte em 0–1 s, pedra e tábuas
  em 12–18 s) e trailer oficial Village & Pillage (vila colorida em 22–48 s).
- GTA 6 (29 h): praia com posto de salva-vidas 71579 s; arranha-céu visto de baixo 69898 s; Vice City à noite vista do alto 69660 s;
  pôr do sol entre prédios 94078 s; helicóptero 93785 s.

## Lições do vídeo 2 (Minecraft x GTA 6)

- **Reprovado:** contador e equações na tela ("muito texto e matemática"); logo "fantasma" que enchia e depois **outra logo
  surgindo por cima** (ficou embolado); intro sem impacto.
- **Direção que substituiu:** **um elemento forte por vez**, conta mostrada **visualmente** (a mesma logo enchendo de grama:
  blocos grandes = 212, pixels finos = 200 mil), texto só no número final. Intro com **impacto físico** (bloco caindo e batendo
  no chão) e contraste de tamanho que já faz a pergunta.
- Mostrar **prévia só das animações** antes do vídeo inteiro quando a ideia for nova.

## Texto no centro (momentos-chave) — regras do dono

- Só nos **momentos matadores** (intro e números de impacto). Fora disso, legenda normal embaixo.
- **Uma linha/palavra por vez**, grande, centralizada. Nunca empilhar várias linhas (polui).
- Fonte Komika Axis. Cores: **branco, amarelo e rosa** apenas. **Sem brilho/glow** no texto — só contorno preto e sombra leve.
- Variar as animações de entrada (pop, cair de cima, deslizar, bater na tela) e de **saída** (cair, ir pro lado, crescer e sumir).
- Elementos extras (braço apontando, X, ✓ em `editor/assets/`) só quando fizerem sentido.
- Vídeos guiados por gameplay: muitas cenas (cortes de ~1–1,5 s), intro com cortes rápidos em tela cheia + socos de zoom.

## Animações no estilo das referências (vídeo 2 v5)

- As animações das referências **não são desenho animado**: são **interfaces realistas** (tela de download do console,
  armazenamento, página do Metacritic, pílula contadora) num **fundo escuro**, com **câmera deslizando devagar**, **desfoque de
  profundidade** e um título gigante desfocado ao fundo. Usar isso nas partes de **números**, sem poluir.
- **Intro:** sem animação. Só gameplay com cortes rápidos e a **legenda maior no centro** (Komika 128 px, mesmas cores),
  com pop limpo. Pode ir pro alto se cobrir algo importante.
- Não reciclar animações de vídeos já postados (ex.: a intro do Zelda).

## O que funcionou no vídeo 2 (versão aprovada, "melhorou bem")

- **Processo obrigatório:** storyboard (uma imagem por trecho, com a fala) ANTES de renderizar. Pular isso gerou
  várias versões ruins seguidas.
- **Uma cena por frase**, ligada ao que é falado. Não encher de cortes aleatórios. Nada de cena repetida.
- **Intro = só a primeira pergunta** do roteiro, com legenda grande no centro (pop limpo) e 1–2 cenas.
- **Animações = fundo synthwave em movimento** + logos centralizadas + **selos de número grudados nas logos** + **contador
  subindo** com rótulo e uma pilha/grade se formando embaixo. Física de mola, 60 fps, nada sobreposto, área do título livre.
- **Não deu certo (evitar):** blocos caindo e enchendo a logo, equações na tela, cards de interface em fundo escuro, vários
  textos coloridos empilhados, brilho no texto, reciclar a intro de outro vídeo.
