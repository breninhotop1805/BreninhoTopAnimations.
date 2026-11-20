// FNAF 4 minigame, drawn pixel by pixel (vertical 120x213 canvas, upscaled with no smoothing): the living room with the
// TV on its red stand, the blue sofa with the Psychic Friend Fredbear plush, the orange rug, the hallway, the crying child
// and the older brother wearing the Foxy mask. Gray CRT scanlines over everything, as in the game.
const PW = 120, PH = 213;
const cv = document.createElement('canvas'); cv.width = PW; cv.height = PH; const g = cv.getContext('2d');
const PAL = { h: '#5a3a16', s: '#f2c68a', k: '#101010', w: '#f2f2f2', t: '#3a78e8', p: '#2a48a8', d: '#1a1a24', r: '#c8201a', R: '#8a1010', y: '#f2c020', b: '#e8b07a', n: '#181010', g: '#8a8a92', G: '#5a5a62', f: '#f2c68a', o: '#2a2a30', Y: '#d8b020', P: '#7a2a9a', B: '#1a1a1a' };
function spr(rows, x, y, flip = false, pal = PAL) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = r[flip ? r.length - 1 - i : i]; if (c === '.' || !pal[c]) continue; g.fillStyle = pal[c]; g.fillRect(Math.round(x + i), Math.round(y + j), 1, 1); } }); }
const CHILD = ['...hhhhhh...', '..hhhhhhhh..', '.hhsssssshh.', '.hssssssssh.', '.skkssssskk.', '.skkssssskk.', '.sttsssstts.', '..tssssst...', '...ssssss...', '..kwkwkwkw..', 'skwkwkwkwkws', 'skwkwkwkwkws', 's.kwkwkwkw.s', '..kwkwkwkw..', '..pppppppp..', '..ppp..ppp..', '..ppp..ppp..', '..ddd..ddd..'];
const CHILD_CRY = ['...hhhhhh...', '..hhhhhhhh..', '.hhsssssshh.', '.hssssssssh.', '.skkssssskk.', '.stkssssktt.', '.sttskksstt.', '..tskkkst...', '...ssssss...', 's.kwkwkwkw.s', 'skwkwkwkwkws', '.kwkwkwkwkw.', '..kwkwkwkw..', '..kwkwkwkw..', '..pppppppp..', '..ppp..ppp..', '..ppp..ppp..', '..ddd..ddd..'];
const BRO = ['..r........r..', '.rrr......rrr.', '.rRrr....rrRr.', '.rrrrrrrrrrrr.', 'rrrrrrrrrrrrrr', 'rkkkrrrrrrkkkr', 'rkyyrrrrrryykr', 'rrrrrrrrrrrrrr', 'rrrrbbbbbbrrrr', 'rrrbbbnnbbbrrr', 'rrbwbwbwbwbwrr', '.rrbbbbbbbbrr.', '..rrrrrrrrrr..', '...ffffffff...', '.gggggggggggg.', 'fggggggggggggf', 'fggGgggggGgggf', 'fggggggggggggf', 'f.gggggggggg.f', '..gggggggggg..', '..oooooooooo..', '..oooo..oooo..', '..oooo..oooo..', '..oooo..oooo..', '..BBBB..BBBB..'];
const BRO_ARMS_UP = ['f............f', 'f............f', 'ff..........ff'];
const FREDBEAR = ['...PPPP...', '...PPPP...', '..PPPPPP..', 'Y.YYYYYY.Y', 'YYYYYYYYYY', '.YkYYYYkY.', '.YYYYYYYY.', '..YYkkYY..', '..YYYYYY..', '...PPPP...', '.YYYYYYYY.', 'YYYYPPYYYY', 'YYYYYYYYYY', '.YYY..YYY.', '.YYY..YYY.'];

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function ell(cx, cy, rx, ry) { for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry))); g.fillRect(cx - w, cy + y, w * 2, 1); } }
function room() {
  g.fillStyle = '#8a8a92'; g.fillRect(0, 0, PW, 92); g.fillStyle = '#6a6a72'; for (let y = 0; y < 92; y += 6) g.fillRect(0, y, PW, 1);
  g.fillStyle = '#0c1430'; g.fillRect(0, 92, PW, PH - 92); const r = mulberry(3); for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? '#1c2a5a' : '#142048'; g.fillRect(Math.floor(r() * PW), 92 + Math.floor(r() * (PH - 92)), 2 + Math.floor(r() * 3), 1); }
  g.fillStyle = '#7a1e18'; g.fillRect(0, 150, 4, 50);
  g.fillStyle = '#5a5a62'; g.fillRect(6, 38, 46, 36); g.fillStyle = '#b8b8c0'; g.fillRect(10, 42, 36, 26); g.fillStyle = '#d8d8e0'; g.fillRect(12, 44, 12, 4);
  g.fillStyle = '#8a3020'; g.fillRect(4, 74, 50, 22); g.fillStyle = '#6a2418'; g.fillRect(4, 84, 50, 2); g.fillStyle = '#3a1410'; g.fillRect(18, 88, 22, 2); g.fillRect(6, 96, 4, 4); g.fillRect(48, 96, 4, 4);
  g.fillStyle = '#2a48a8'; g.fillRect(60, 56, 56, 22); g.fillStyle = '#20388a'; g.fillRect(56, 70, 64, 26); g.fillStyle = '#2a50b8'; g.fillRect(62, 74, 52, 10); g.fillStyle = '#1a2a6a'; g.fillRect(64, 96, 12, 4); g.fillRect(102, 96, 12, 4);
  spr(FREDBEAR, 80, 58);
  g.fillStyle = '#c84a10'; ell(58, 160, 46, 18); g.fillStyle = '#e86a18'; ell(58, 158, 38, 13); g.fillStyle = '#f0802a'; ell(56, 156, 24, 7);
}
function hall() {
  g.fillStyle = '#0c1430'; g.fillRect(0, 0, PW, PH); g.fillStyle = '#8a8a92'; g.fillRect(0, 0, 26, PH); g.fillRect(94, 0, 26, PH); g.fillStyle = '#6a6a72'; for (let y = 0; y < PH; y += 6) { g.fillRect(0, y, 26, 1); g.fillRect(94, y, 26, 1); }
  const r = mulberry(5); for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? '#1c2a5a' : '#142048'; g.fillRect(26 + Math.floor(r() * 66), Math.floor(r() * PH), 2 + Math.floor(r() * 3), 1); }
  for (const [y, side] of [[40, 0], [120, 1]]) { g.fillStyle = '#5a3a1a'; g.fillRect(side ? 92 : 22, y, 6, 30); g.fillStyle = '#c8a040'; g.fillRect(side ? 93 : 25, y + 15, 2, 2); }
  g.fillStyle = '#000'; g.fillRect(40, 0, 40, 10);
}
function tears(x, y, t, n = 4) { g.fillStyle = PAL.t; for (let i = 0; i < n; i++) { const k = ((t * 1.6 + i / n) % 1); g.fillRect(x + (i % 2 ? 9 : 1), y + 7 + Math.floor(k * 10), 1, 2); } }
function bang(x, y, k) { if (k <= 0) return; g.fillStyle = '#ffffff'; const s = 1 + Math.round(2 * Math.min(1, k * 3)); g.fillRect(x, y, 2 * s, 5 * s); g.fillRect(x, y + 6 * s, 2 * s, 2 * s); }

// it: { scene: 'room'|'hall'|'roomScare'|'hallScare', L, peek, jump, cry, stat, a }
export function drawMinigame(ui, W, H, it, t) {
  const L = it.L ?? 0; g.clearRect(0, 0, PW, PH);
  if (it.scene === 'room') { room(); if (it.peek) { const k = Math.min(1, it.peek); spr(BRO.slice(0, 13), 38, 26 + Math.round(12 * (1 - k))); g.fillStyle = '#5a5a62'; g.fillRect(6, 38, 46, 36); g.fillStyle = '#b8b8c0'; g.fillRect(10, 42, 36, 26); g.fillStyle = '#d8d8e0'; g.fillRect(12, 44, 12, 4); }
    const cx = 52 + Math.round(it.walk ? (L * 14) : 0), cy = 140; spr(CHILD, cx, cy); }
  if (it.scene === 'hall') { hall(); const step = Math.floor(L * 8) % 2; const y = Math.round(190 - L * 50); spr(CHILD, 54, y); if (step) { g.fillStyle = PAL.d; g.fillRect(57, y + 17, 3, 1); g.fillStyle = '#0c1430'; g.fillRect(61, y + 17, 3, 1); } }
  if (it.scene === 'roomScare') { room(); const j = it.jump ?? 0; const bx = 38 + j * 6, by = 30 + j * 82 - Math.sin(Math.min(1, j) * Math.PI) * 22; const cry = it.cry ?? 0;
    const cx = 54 + (cry > 0 ? Math.round(Math.sin(t * 40)) : 0), cy = 150 + Math.round(cry * 4); spr(cry > 0 ? CHILD_CRY : CHILD, cx, cy); if (cry > 0) tears(cx, cy, t, 6);
    spr(BRO, bx, by); if (j > 0.05) spr(BRO_ARMS_UP, bx, by + 12); bang(bx + 22, by - 10, j > 0.25 ? j : 0); }
  if (it.scene === 'hallScare') { hall(); const j = it.jump ?? 0; const bx = 28 + j * 20, by = 50 + j * 50 - Math.sin(Math.min(1, j) * Math.PI) * 18; const cry = it.cry ?? 0; spr(cry > 0 ? CHILD_CRY : CHILD, 56, 140); if (cry > 0) tears(56, 140, t, 6);
    spr(BRO, bx, by); if (j > 0.05) spr(BRO_ARMS_UP, bx, by + 12); bang(bx + 22, by - 10, j > 0.25 ? j : 0); }
  ui.save(); ui.imageSmoothingEnabled = false; const sc = Math.max(W / PW, H / PH); const dw = PW * sc, dh = PH * sc; ui.globalAlpha = it.a ?? 1; ui.drawImage(cv, (W - dw) / 2, (H - dh) / 2, dw, dh);
  const lh = H / PH; ui.fillStyle = 'rgba(70,70,78,0.45)'; for (let y = 0; y < H; y += lh) ui.fillRect(0, Math.round(y + lh * 0.62), W, Math.max(1, Math.round(lh * 0.32)));
  if (it.stat > 0) { const r = mulberry(Math.floor(t * 30)); for (let i = 0; i < 1400; i++) { const v = r() * 255 | 0; ui.fillStyle = `rgba(${v},${v},${v},${it.stat})`; ui.fillRect(r() * W, r() * H, 3 + r() * 10, 2); } }
  const vg = ui.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); ui.fillStyle = vg; ui.fillRect(0, 0, W, H);
  ui.restore(); }
