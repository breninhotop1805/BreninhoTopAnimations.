# Regras do canal — animações de Minecraft

(Adaptadas das regras das animações de FNAF. Valem para todos os vídeos desta aba.)

## 1. Formato e entrega
- Vídeo vertical 1080×1920, 30 fps, animação fluida.
- Cortes rápidos: uma cena por ideia falada, corte a cada ~1–2 s; nenhuma cena com mais de ~3 s sem novo corte ou ação marcante.
- **SEM legendas** (ele coloca no CapCut). **SEM música** — só efeitos sonoros.
- Sempre duas versões: `NOME.mp4` (narração + efeitos) e `NOME_SO_NARRACAO.mp4`.
- Sem ícones de like/sino no final. Logo só quando ele pedir.
- No final de vídeo-gancho: card com a thumbnail do vídeo completo e setinhas (pequenas) apontando pra baixo.

## 2. Sincronia
- Transcrever a narração palavra por palavra (só para temporizar — nunca vira legenda).
- Cortar no início exato da palavra-chave; a ação principal acontece **na sílaba** que a descreve.

## 3. Personagens (skins de Minecraft)
- Sempre bonecos de Minecraft com skin (64×64, camada externa). Texturas o mais fiéis possível ao Minecraft.
- Skins nunca bugam: corpo alinhado, nada atravessando. Tamanhos fixos por categoria (bebês 0,5 corpo / 0,75 cabeça, como no jogo).
- Nick do protagonista em nametag estilo Minecraft.

## 4. Atuação e emoção
- Ninguém parado: respiração, troca de peso, cabeça viva. Piscar, boca abrindo, sobrancelha de raiva/tristeza (sem bugar).
- Gestos curvos com preparação, overshoot e acomodação. Balão "!"/"?" que pula.
- Cabeça já na pose certa no quadro 0; viradas ≥ 0,4 s. Andar nunca para de repente.
- Nada some do nada (fade, encolher, fumaça, sair do quadro ou corte).

## 5. Nunca atravessar
- Checagem automática (OBB/SAT) em TODOS os quadros — `node minecraft/check.cjs` — só entrega com ZERO ocorrências.
- O solver de pose afasta/abaixa o braço o mínimo necessário quando há contato.

## 6. Câmera
- Sempre em movimento suave (push-in, órbita, deriva) e punch-in rápido (~0,25 s) nas palavras-chave.
- Altura dos olhos ou levemente de baixo; personagem grande no quadro; fundo desfocado nos closes.
- Câmera nunca dentro de blocos, nunca na nuca do personagem.

## 7. Cenários e luz
- Tudo em 3D, bloco a bloco (texturas desenhadas pixel a pixel). HUD do jogo desenhado pixel a pixel.
- Luz vinda do ambiente (sol, lua, tochas, lava). Rostos não estouram.

## 8. Efeitos sonoros
- Média dos efeitos 14–18 dB abaixo da voz (medido em `audio/mix_report.json`). Brutos 4 dB mais baixos.
- Cada som marca um momento; máx. ~3 chimes por vídeo.

## 9. Processo
1. Testar modelos (frente/lado) → 2. prévias de todas as cenas em 15/50/90% → 3. checagem de atravessamento →
4. render final → 5. conferir quadros → 6. commit + push.
