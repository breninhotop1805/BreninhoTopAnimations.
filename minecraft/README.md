# Animações de Minecraft

Motor próprio em Three.js renderizado no Chromium headless (sem GPU), com mundo de voxels,
skins de Minecraft com camada externa, HUD desenhado pixel a pixel e efeitos sonoros sintetizados.

## Como renderizar
```bash
cd minecraft
npm install                      # three.js
python3 transcribe.py <modelo>   # (opcional) tempos das palavras -> audio/words.json
node check.cjs                   # checagem de atravessamento (tem que dar 0)
node render.cjs --stills=1.0,2.5 --out=preview --w=540 --h=960   # prévias
node render.cjs --f0=0 --f1=1866 --out=render/video.mp4           # vídeo (1080x1920)
python3 audio/sfx.py             # efeitos + mixagem
```
Arquivos principais: `engine/shots.js` (linha do tempo/cenas), `engine/sets.js` (cenários),
`engine/character.js` (rig de skin), `engine/models.js` (itens, mobs, partículas, céu), `engine/hud.js`.
