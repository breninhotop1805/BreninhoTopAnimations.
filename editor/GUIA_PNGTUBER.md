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

## Controle de trechos de parkour já usados
(nenhum ainda)
