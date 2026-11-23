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
6. **Nunca colocar música e nunca colocar legendas.** As duas coisas o dono faz.
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
