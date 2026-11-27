# Análise das 10 referências novas (nov/2026) — canal Roblox

Vídeos analisados: "Não seja de papel", "Não durma aqui", "Cuidado com a chuva", "Cuidado com os pequeninos",
"Não seja um zumbi", "Não entre nesta cidade", "Não use o seu botão", "Não fale aqui", "Não entre no bunker" e
"Não pare o tempo".

Como foi feita:
- Os 10 vídeos inteiros (1.035 planos), analisados quadro a quadro.
- Detecção de cortes, movimento de câmera por fluxo óptico e cor de cada quadro.
- Transcrição palavra a palavra (faster-whisper large-v3-turbo).
- Folhas com 1 quadro por plano + a fala.
- Tiras densas (10–30 fps) nas cenas de ação, nas expressões e nas transições.
- Comparação com os nossos EP02 e EP03, medidos do mesmo jeito.

## 1. Números medidos

| Medida | Referências | EP02 | EP03 |
|---|---|---|---|
| Duração do plano (mediana) | **1,43 s** (1,03–1,58 conforme o vídeo) | 1,33 | 1,40 |
| Planos < 1,2 s | 36% | — | — |
| Planos > 3 s | 2% | — | — |
| Corte × início da palavra | **−0,04 s** (86% a ±0,2 s; 60% antes) | ok | ok |
| Narração | 215–289 palavras/min (~236) | — | — |
| Push-in / pull-out / pan / estático | 65% / 12% / 13% / 21% | 70/14/23/9 | 79/9/10/9 |
| Push-in mediano | 4,2%/s | 5,8 | 6,2 |
| **Saturação média** | **0,50** | 0,46 | **0,33** |
| **Colorido** (Hasler) | **71,5** (25% piores ≥ 57) | 70 | **54** |
| **Pixels vivos** (S>0,45, V>0,35) | **32%** | 37% | **18%** |
| Brilho médio | 0,55 | 0,59 | 0,61 |

O que os números mostram:
- **Ritmo e sincronia:** já estamos no padrão.
- **Quantidade de movimento de câmera:** já é igual ou maior que a das referências. O que falta não é "mais zoom", e
  sim **variedade de ângulo** e **ação física dentro do quadro** (ver 2.B e 2.G).
- **Cor:** o EP03 ficou muito abaixo (34% menos saturado e 24% menos colorido). A causa são os cômodos brancos e claros
  (banheiro, dentista, médico, prefeito) e os flashbacks em sépia. Os piores planos foram o dentista (colorido 14–22),
  o banheiro (26) e o médico (30). O EP02, com cenários coloridos, ficou no padrão.
- **Brilho:** as referências são um pouco MAIS ESCURAS e MAIS SATURADAS que nós: cor rica, sem branco estourado.

## 2. O que eles fazem — por ponto que ele pediu

### A. Animações expressivas, "soltas", fluidas
- **Corrida de frente pra câmera:**
  - Braços em arco largo, joelhos altos, tronco inclinado.
  - A câmera recua junto (travelling para trás) e o personagem fica do mesmo tamanho no quadro.
  - Exemplo: abertura de "Não durma aqui", 0–0,9 s.
- **Corpo inteiro reagindo à física:**
  - Voando e girando no vento, com folhas coloridas passando.
  - Caindo amassado no chão.
  - Afundando na piscina.
  - Quicando de parede em parede.
  - Empurrado pela multidão até o centro.
  - Caindo de joelhos.
- **Dança:** braços abertos que sobem e descem, quadril balançando, a multidão copiando.
- **Gestos grandes e segurados:**
  - Braços pra cima comemorando.
  - Mão no peito.
  - Aponta pra câmera.
  - Cobre o rosto.
  - Mãos na cabeça.
  - Ombros encolhidos com "?".
- **Escala:**
  - Rei gigante × herói minúsculo dentro da xícara.
  - Golem de lava visto de baixo.
  - O dedo do gigante descendo sobre o herói.
- **Ação = a palavra:** "soprei" = sopro visível; "chute" = porta abrindo com a perna; "congelou" = mão coberta de gelo;
  "virou pó" = coroa se desfazendo em partículas.

### B. Mais cenas e mais movimento
- Toda frase nova ganha cenário ou ângulo novo.
- **Listas viram rajadas**: "na sala / na diretoria / na cozinha" = 3 lugares em 0,8 s cada.
- **"Chuva de coisas" com milhares de instâncias:** doces, notas de dinheiro, brinquedos, ursos, bicicletas e chaves
  douradas cobrindo a rua.
- **Multidões de centenas:**
  - Zumbis na rua.
  - Estádio lotado.
  - Fila dando a volta no quarteirão.
  - A escola inteira na chuva.
- **Transformação de cenário inteiro:**
  - A cidade sendo pintada de verde.
  - O céu ficando vermelho com chuva de meteoros.
  - Todas as telas ficando vermelhas com triângulos de alerta.

### C/D. Nada atravessando, nada sobreposto (cintilação)
- Nas referências nada encosta errado:
  - Mãos seguram as coisas de verdade (alça da mochila, controle remoto, chave na fechadura).
  - Cada personagem ocupa o próprio espaço.
  - Os objetos ficam apoiados no chão ou na mesa.
  - Nenhuma superfície "tremendo".
- Na auditoria do EP03 com a ferramenta nova (seção 4), achei:
  - **Beirais dos telhados das casas vizinhas no mesmo plano** (o mesmo tipo de erro das persianas), já corrigido no
    `house()`.
  - Duas faixas de chão da rua sobrepostas.
  - O topo da fachada da escola coplanar com a faixa de acabamento.
  - **Câmera encostando na estante** em t=28,0 (o sofá vermelho aparece cortado no canto).
- Nenhum desses apareceu grande na tela do EP03. Mesmo assim agora são checados sempre.

### E. Mais colorido
Paleta por cenário, nunca parede branca lisa:
- **Corredor:** armários de arco-íris, cada porta de uma cor saturada.
- **Quartos:**
  - Paredes verde, azul ou roxa.
  - Cobertores xadrez laranja, roxo ou azul.
  - Tapete estampado e quadros.
- **Sala:**
  - Poltrona xadrez verde e sofá vermelho.
  - Tapete com bordas coloridas e luminária amarela.
- **Refeitório:** piso xadrez verde-água.
- **Castelo:**
  - Vitrais coloridos e cortina vermelha.
  - Piso xadrez vermelho e branco, tapete vermelho com borda dourada.
- **Bunker:** paredes de concreto com faixa verde, faixas de perigo amarelo/preto, tapete vermelho, sofá laranja e
  prateleiras cheias de latas coloridas.
- **Noite** (nunca preto e branco):
  - Céu azul profundo ou roxo com lua.
  - Prédios com centenas de janelas quentes acesas.
  - Varais de lâmpadas atravessando a rua.
  - Chão molhado refletindo as luzes.
- **Luz de "clima":**
  - Dourado = magia ou desejo.
  - Vermelho = alarme ou perigo.
  - Roxo/violeta = pesadelo.
  - Ciano = mundo pausado ou congelado (o resto dessatura e só o herói mantém a cor).
  - Laranja = pôr do sol, voltando pra casa.

### F. Expressões faciais
Vocabulário (todos decals 2D de traço grosso):
- O.O com pupila minúscula (choque).
- >.< com rubor (vergonha / riso nervoso).
- Choro: olhos >.< + rios ou gotas azuis + boca aberta com língua.
- Deboche: pálpebra pesada + sobrancelha + língua no canto.
- Sorriso enorme com dentes.
- Raiva: sobrancelha em V + dentes.
- Boca de zíper.
- Gota de suor.
- Rosto de zumbi detalhado.

Como usam:
- **A expressão muda NA PALAVRA, em degraus.** "Não durma aqui": "sorriu" → sorriso pequeno; "sorriso" → maior;
  "crescendo" → maior ainda; "orelhas" → de orelha a orelha. Sempre com push-in lento no rosto.
- **Reação do outro personagem no plano seguinte**: o herói nervoso olhando de lado.

### G. Câmeras mais expressivas
Variam o ângulo o tempo todo:
- **De baixo** em gigantes, vilões e heróis.
- **De cima** em multidões, filas e estádio.
- **Close extremo de objeto na mão:** cronômetro, chave "47" na fechadura, polegar apertando o botão.
- POV.
- Plano por cima do ombro.

Movimentos que "seguem algo":
- Tilt acompanhando quem afunda ou cai.
- Travelling junto de quem corre.
- Grua subindo quando a multidão empurra.
- Giro curto quando anda no fundo do rio.
- Push-in rápido nas revelações (z +45…+88%/s em 2–4 quadros).

### H. Principal sempre centralizado; transições
- Em ~90% dos planos o personagem ou objeto principal está no centro e grande.
- O rosto fica ACIMA da legenda (a legenda fica a ~68% da altura).
- **88% dos cortes são secos** e caem 1 quadro antes da palavra. A "transição bonita" é o corte certo + câmera já
  em movimento + composição que continua (mesmo ponto de interesse no centro dos dois planos).
- Efeitos de transição SÓ quando a história pede:
  - Apertar PAUSA: onda de choque branco/ciano (anel que se expande) + flash frio + zoom-burst em 3–4 quadros.
  - Botão dourado: brilho dourado com anel de relógio.
  - Susto: flash branco de 1 quadro.
  - Acordar do pesadelo: mergulho no preto de 0,2 s.
  - TV quebrando: flicker liga/desliga.

### I. Sem cenas toscas
- Nunca cômodo vazio: chão com tapete, móveis, objetos, gente no fundo.
- Personagem grande (do peito pra cima ou corpo inteiro ocupando ~60% da altura).
- Inserts de objeto bem modelados: cronômetro, despertador, chave, botão, calendário, placar LED, TV de alerta,
  celular "SEM SINAL".
- O objeto mágico da história aparece em todo momento-chave (botão no peito, controle PLAY/PAUSA, cronômetro, contador
  de palavras no pulso, placar "HUMANOS: 1").
- Final com callback visual (guarda-chuva, placar 1.000.001, o cachorro tirando a máscara).

### J. Cidades e monumentos
- **Rua mediterrânea:**
  - Sobrados pastel (rosa, amarelo, azul, verde) com sacadas de ferro e persianas azuis.
  - Calçada de pedra.
  - Torre do relógio, coreto e fonte na praça.
  - Árvores low-poly redondas, céu azul com nuvens.
- **Subúrbio:** casas de madeira cinza/branca, tijolinho vermelho, cerca branca, caixa d'água.
- **Castelos:** paredes brancas com cones azuis e bandeiras, montanhas low-poly com neve.
- **Metrópole noturna:** arranha-céus com centenas de janelas acesas, lua, postes, varal de lâmpadas.
- **Estádio:** arquibancada lotada, refletores, placar LED.
- **Cidade em ruínas:** fogo, carros batidos, zumbis.

Iluminação:
- Sol quente + céu azul de dia.
- Luz quente de janelas e postes à noite.
- Contraluz/bloom nas luzes.

**Cada parte nova da história abre com um plano de situação** do lugar (rua, castelo, estádio, bunker) e depois fecha
nos personagens.

## 3. Autocrítica do EP03 (comparado com as referências)
- **Pálido:**
  - Banheiro, dentista e médico brancos.
  - Paredes azul-claro.
  - Flashback em sépia.
  - Resultado: 18% de pixels vivos contra 32% nas referências.
- **Cômodos vazios:**
  - Chão grande sem nada.
  - Personagens pequenos no fundo (ex.: "família", "se").
  - Alguns planos de costas ou por cima do ombro, com o herói cortado na borda.
- **Expressões pequenas e de pouca variação** (olho de ponto, boca simples). Faltavam O.O, >.<, choro escancarado,
  deboche, sorriso crescendo.
- **Poucas ações físicas grandes:** muito gesto parado e pouca corrida, queda, voo, multidão ou transformação.
- **Câmera encostando em móvel** em t≈28 s: o sofá vermelho aparece cortado no canto inferior.

## 4. Ferramentas novas no kit (`roblox_base`)

### `sceneCheck(scene)` — kit.js, uma vez por cenário
- Procura todos os triângulos de malhas diferentes que estão no MESMO PLANO, virados pro mesmo lado e se sobrepondo
  (= cintilação/z-fighting).
  - Calcula a área sobreposta.
  - Ignora pares do mesmo material (sem diferença visível).
  - Loga `LOG CINTILACAO`.
- Testa os obstáculos entre si com caixas orientadas (SAT) → `LOG ATRAVESSA_OBJETO`.
  - Móvel dentro de móvel.
  - Objeto que fura a parede e sai do outro lado.
  - Portas e batentes são ignorados.
- Rodar com `node scenechk.mjs <pasta do episódio>`, que usa `scenechk.html` e `buildSets()`.
  - Na auditoria do EP03 achou os beirais sobrepostos (já corrigidos no `house()`).

### `flickerCheck(t, scene, cam)` + `cameraInsideCheck` — por quadro, dentro do `qa()`
- Só reclama da cintilação que a câmera REALMENTE vê:
  - Virada pra câmera.
  - Dentro do quadro.
  - Não escondida atrás de nada (raycast).
  - Maior que ~40 px na tela.
- Loga `LOG CAMERA_DENTRO` quando a câmera encosta num objeto (corte de near-plane).

### `colorqa.py` — mede a cor dos stills e do vídeo final
- Por still: saturação, colorido e % de pixels vivos.
- `LOG POUCA_COR` abaixo do piso (colorido 52 / saturação 0,38).
- Média do vídeo com alvo de saturação ≥ 0,47 e colorido ≥ 68.

### Rostos novos (`drawFace` em rbx.js)
- Olhos:
  - `shock` (O.O grande, pupila minúscula).
  - `smug` (pálpebra pesada).
- Bocas:
  - `tongue` (deboche com língua).
  - `mega` com `grin: 0..1` (sorriso que CRESCE até as orelhas).
  - `wail` (choro aberto, cantos pra baixo).
  - `zip` (zíper).
- Extras:
  - `drops` (gotas de lágrima caindo, animadas pela fase).
  - `browW` (sobrancelha grossa).
- Correção: a pálpebra de raiva/tristeza era PINTADA de quase-branco e virava mancha branca em pele morena. Agora é
  apagada (`destination-out`).
- Folha de conferência: `node facesheet.mjs out/EXPRESSOES_v2.jpg`.
