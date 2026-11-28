# Diretriz Mestra — Canal PNG Tuber (Foxy)

> Claude: leia este arquivo inteiro antes de qualquer produção do formato PNG Tuber.
> Estas regras são do dono do canal e são inegociáveis. Valem acima do GUIA_DE_ESTILO.md para este formato.

## 1. Fluxo obrigatório
1. **Decupagem do roteiro** frase por frase / segundo a segundo.
2. **Mapeamento de assets**: pose e emoção do Foxy, música e tipo de take para cada trecho.
3. **Checklist de solicitação**: listar exatamente quais takes o dono precisa enviar (Drive ou chat) antes do corte.
4. Storyboard para aprovação antes do render final (regra do canal).

## 2. Layout fixo (1080x1920, gabarito `editor/assets/layout_pngtuber.png`)
- **Caixa de takes:** retângulo no topo, x 23–1056 (≈1034 px de largura), y ≈ 41, proporção **16:9 fixa**
  (≈1034x582). Mesmo tamanho em todos os cortes. Take 9:16 só com aprovação prévia do dono.
- **Legenda:** centralizada logo abaixo da caixa (centro em y ≈ 660–690), pequena e discreta.
- **Foxy:** centralizado na parte de baixo, da base até um pouco acima da metade da tela.
  **Mesma altura proporcional e mesma ancoragem** em todas as poses.
- **Fundo:** parkour de Minecraft (pasta `PARKOUR FUNDO DE VÍDEO CANAL` + o `.webm` de 8 min).
  **Nunca repetir o mesmo trecho entre vídeos** — anotar abaixo os trechos já usados.

## 3. Foxy (poses em `PNG TUBER FOXY POSES`)
- Remover o fundo branco de todas as poses com recorte limpo (sem serrilhado nem halo branco).
- Nivelar nitidez/resolução entre as poses (nenhuma pode parecer pior que outra).
- **Idle:** pêndulo/flutuação sutil e constante o vídeo todo.
- **Troca de pose a cada 2–4 s**, coerente com o sentido da frase (dúvida = pensando etc.). Nada aleatório.
- **Cooldown:** não repetir a mesma pose em sequência nem em intervalos curtos.
- **Transição entre poses:** nunca corte seco — squash & stretch (esticada vertical com retorno elástico rápido)
  + leve motion blur.
- **Câmera:** alternar **Modo A** (só o Foxy dá um "soco" de zoom para frente e volta, ênfase) e **Modo B**
  (composição inteira — fundo, Foxy, takes, legenda — com zoom suave/rápido em direção ao personagem).

## 4. Legenda
- Fonte **Komika Axis** (`editor/fontes/KOMIKAX_.ttf`).
- Preenchimento branco, **borda vermelha**, **contorno externo fino preto**, **sombra leve**.
- **Blocos de 2–3 palavras** (não palavra por palavra), com a animação de entrada padrão do canal (pop).
- Sincronia por alinhamento forçado de fonemas (`editor/tools/alinhar.py`).

## 5. Transições e SFX
- **Fim da intro: FLASH na tela inteira** e, no mesmo frame, **primeira troca de música**. Lei do canal.
- Transições de takes **só dentro da moldura dos takes**:
  - 80%: corte seco + **clique do Minecraft** (`editor/sfx/corte_clique_limpo.wav`).
  - 20%: pop (escala rápida + leve desfoque) ou deslize rápido.
- SFX do pack só quando agregam (comédia, tensão, ênfase). Nunca poluir.

## 6. Música (pasta `MÚSICAS DO CANAL`)
- **Normalizar todas as faixas** para a mesma altura percebida, sempre abaixo da narração e claramente audíveis.
- **2 a 3 músicas por vídeo.** Trocar só: (1) no flash pós-intro; (2) quando o clima mudar drasticamente;
  (3) se uma faixa estiver tocando há tempo demais.
- **Lavender Town** e **Mario Odyssey (New Donk City)**: **somente na INTRO** (Lavender = mistério/terror/tensão;
  Mario = animado/divertido).
- **Fallen Down** e **Celeste Resurrections**: **proibidas na intro**; livres no resto quando o clima pedir.
- Não usar sempre as favoritas: explorar o catálogo (Ghost Fight, Simian Segue, Main Theme, Mysterious Strange Things,
  Stream/Immaterial, Undertale Shop...).
- Troca: fade out 0,3–0,5 s na faixa que sai + fade in rápido de 0,3 s na que entra.
- **Cortar o silêncio inicial** de cada faixa para entrar tocando no frame exato.

## Referências (estilo Mundo Torajo) — o que se vê nelas
- Personagem grande, centralizado embaixo, trocando de pose praticamente a cada frase, com pequeno "pulo"/estica
  na troca e às vezes um brilho/zoom de ênfase.
- Fundo de parkour de Minecraft sempre em movimento.
- Legenda pequena em blocos curtos logo acima/abaixo da área central.
- Texto grande ocasional no topo ("DIA 20", "FALE COMIGO", "EMPOLGADOS") e imagens de apoio no topo
  (calendário, prints do canal). No canal do dono, as imagens de apoio vão **dentro da caixa de takes 16:9**.

## Poses do Foxy (recortadas em `editor/pngtuber/foxy_poses/`, alinhadas pelos óculos)
| arquivo | pose | usar quando |
|---|---|---|
| lv_0_20261127052636 | mão no queixo | pergunta, dúvida, "será que..." |
| lv_0_20261127034355~2 | dedo pra cima | "olha só", "um detalhe", número/fato |
| IMG-20261127-WA9910 | mão levantada rindo | apresentando algo animado |
| IMG-20261127-WA6512~2 | mão levantada explicando | explicação normal |
| IMG-20261127-WA5558 | gancho erguido | empolgação, "absurdo!" |
| Novo_projeto_155_[1350470] | mãos na cintura | confiante, afirmação forte |
| IMG-20261127-WA7511~2 | braços cruzados | ceticismo, "só isso?" |
| IMG-20261127-WA1904~2 | mão na cabeça | "bugar a mente", sem graça, confuso |
| IMG-20261127-WA7417~2 | acenando | só oi/tchau (início ou fim) |
| IMG-20261127-WA4974~2 | neutro | transição calma |

## Motor
- `editor/pngtuber/pngtuber.py <config.json> <saida.mp4>` (60 fps). Exemplo de config: `editor/pngtuber/teste.json`.
- Músicas normalizadas em -15 LUFS (silêncio inicial cortado) antes da mixagem; ducking leve sob a voz; limitador final.
- Parkour: baixar só o trecho necessário do arquivo de 2 h direto do Drive (ffmpeg via http, com range), sem baixar tudo.

## Controle de trechos de parkour já usados
- `Minecraft Parkour Gameplay No Copyright (2 Hours)`: 30:30–30:54 (teste de 20 s)
- `Minecraft Parkour 8 Minutes ... 109` (2560x1440, recorte vertical x=875): 0:30–0:57, 2:48–3:06, 3:36–3:42, 4:24–4:28
  (vídeo "Quantos Minecrafts cabem no GTA 6?", formato Foxy)

## Ajustes aprovados/pedidos pelo dono (teste de 20 s → vídeo completo)
- Legenda um pouco menor (64 px).
- **Transições de take aplicam no quadro inteiro** (moldura + conteúdo): arrastar pro lado com desfoque e o próximo entra
  logo em seguida; pop de entrada / pop inverso de saída com curva elástica leve e um pouco de desfoque.
- Pêndulo do Foxy e soco de zoom só no Foxy (modo A) **bem mais sutis**; squash & stretch da troca de pose fica como está.
- Zoom da tela inteira (modo B): **lento e raro**, só nos momentos mais importantes. Modo A também raro (menos que o B não).
- **Sombra leve** atrás do Foxy.
- Parkour: usar o de 8 minutos, escolhendo os trechos mais bonitos (céu aberto, cores vivas).
- **Troca de música no flash precisa ser audível** (a nova entra cheia no frame do flash). Mais variedade de músicas
  (3 faixas num vídeo de ~55 s).
- **1 ou 2 transições de tela inteira por vídeo** (arrastar pro lado com desfoque), simples.
- Renderizar no máximo 2–3 partes em paralelo (cada parte usa ~2 GB de RAM).

## Regras fixas adicionadas (vídeo final do Foxy)
- **Abertura de todo vídeo:** tela branca cobrindo tudo que some em 0,3 s, com um tremor rápido, e o som
  `editor/sfx/xp_inicio.wav` (XP do Minecraft, sem silêncio no começo) alto, começando no frame 0.
- **TAKE 1 chega de cima pra baixo** em ~1 s, com desfoque de movimento, em todo vídeo.
- **Mais transições nos takes** (sem exagero): arrastar pra direita **e pra esquerda**, mais pops; cada animação com som fixo
  (arrastar = whoosh, pop = pop).
- **Aproximação no personagem (regra atual, substitui as anteriores):** 1 ou 2 vezes por vídeo, **2 a 4 s**, curva **reta**,
  bem aparente (~1,36–1,38x), indo **em direção ao Foxy, mais pra baixo** (centro bem embaixo, no peito/barriga, y ≈ 1545).
  No instante em que ela começa, o **TAKE sobe e sai pelo topo** (o inverso da entrada da intro, **bem lento, ~0,95 s**, acompanhando o ritmo, com desfoque).
  O retorno varia entre:
  1. **Corte seco com som** (clique do Minecraft ou dano): a câmera e o take voltam secos no mesmo frame.
  2. **Volta rápida (~0,26 s)** da tela inteira afastando com leve desfoque, e o take **desce de volta** rápido (~0,26 s).
- **Tremor da abertura:** só deslocamento (sem escala), começa forte e zera em ~0,2 s com fade-out.

## Distribuição das poses (regra)
- **Variar bastante e espalhar** as poses pelo vídeo: nenhuma pose dominando, nenhuma esquecida. Equilibrar o uso entre as 9 poses
  de fala (todas servem pra maioria das frases — escolher a que melhor encaixa, mas priorizando variedade).
- **Acenando (tchau): só 1 vez por vídeo, no FINAL** (o dono não fala "oi" no começo).
- Não seguir uma ordem fixa/ciclo previsível; espalhar de forma natural, respeitando o cooldown (não repetir em sequência nem perto).
- Antes de renderizar, conferir a contagem de cada pose (meta: diferença pequena entre a mais e a menos usada).
- **Tamanho e proporção do Foxy** sempre iguais entre as poses (alinhadas pelos óculos, mesma altura na tela) — conferir no storyboard.

## Sincronia do corte seco (regra)
- O **corte seco da aproximação** acontece **sempre no começo de uma frase nova**, nunca no meio de uma legenda.
  Nesse mesmo frame trocam juntos: **pose do Foxy, take e bloco da legenda** (+ o som de clique/dano). Ex.: vídeo Foxy,
  corte em 44,25 s no "E o mais bizarro..." (antes estava errado em 43,70, no meio de "originais").

## Ajustes finais (regras para os próximos vídeos)
- **Sombra no Foxy em todas as poses**, visível mas sem exagero (sombra desfocada deslocada levemente pra direita/baixo, ~40% de opacidade).
- **Sem desfoque de movimento na aproximação no personagem e na volta rápida dela** (câmera e take voltando ficam nítidos).
  O desfoque continua em todo o resto: legenda, troca de pose, entrada do take 1, saída do take, transições de takes e de tela.
