// HUD 2D desenhado pixel a pixel (corações do hardcore, tela de morte)
import { drawText, measure } from './font.js';

const HEART = [
  '.XX...XX.',
  'XrrX.XrrX',
  'XrwrXrrrX',
  'XwrrrrrrX',
  'XrrrrrrrX',
  '.XrrrrrX.',
  '..XrrrX..',
  '...XrX...',
  '....X....',
];
// variante hardcore: padrão escuro tipo "olhos" na parte de cima (desenho próprio)
const HC = { '2,2': 'k', '6,2': 'k', '3,3': 'k', '5,3': 'k' };
function heartPix(x, y, kind, hardcore, blinkWhite) {
  const ch = HEART[y][x];
  if (ch === '.') return null;
  if (ch === 'X') return blinkWhite ? '#ffffff' : '#1a0000';
  if (kind === 'empty') return '#3b0b0b';
  if (hardcore && HC[`${x},${y}`]) return '#5c0000';
  if (ch === 'w') return '#ffd6d6';
  return y >= 5 ? '#c40000' : '#ff1f1f';
}
// hearts: valor 0..10 (pode ter meia), x/y = centro superior
export function drawHearts(g, cx, y, s, value, { hardcore = true, flash = 0, shakeT = 0, pulse = 0 } = {}) {
  const n = 10, w = 9 * s, gap = 1 * s, total = n * w + (n - 1) * gap; let x0 = cx - total / 2;
  for (let i = 0; i < n; i++) {
    const kind = value >= i + 1 ? 'full' : value > i ? 'half' : 'empty';
    const jy = shakeT ? Math.round(Math.sin(shakeT * 40 + i * 1.7) * s) : 0;
    const sc = i === Math.ceil(value) - 1 ? 1 + pulse * 0.25 : 1;
    const ox = x0 + i * (w + gap), ps = s * sc, offx = (w - 9 * ps) / 2, offy = (w - 9 * ps) / 2;
    for (let yy = 0; yy < 9; yy++) for (let xx = 0; xx < 9; xx++) {
      let k = kind; if (kind === 'half') k = xx < 5 ? 'full' : 'empty';
      const c = heartPix(xx, yy, k, hardcore, flash > 0.5);
      if (!c) continue; g.fillStyle = c; g.fillRect(Math.round(ox + offx + xx * ps), Math.round(y + offy + yy * ps + jy), Math.ceil(ps), Math.ceil(ps));
    }
  }
}
// um coração grande centralizado (para "uma única vida")
export function drawBigHeart(g, cx, cy, s, { hardcore = true, empty = false } = {}) {
  for (let yy = 0; yy < 9; yy++) for (let xx = 0; xx < 9; xx++) { const c = heartPix(xx, yy, empty ? 'empty' : 'full', hardcore, false); if (!c) continue; g.fillStyle = c; g.fillRect(Math.round(cx - 4.5 * s + xx * s), Math.round(cy - 4.5 * s + yy * s), Math.ceil(s), Math.ceil(s)); }
}
// tela de morte (gradiente vermelho do jogo + título + mensagem + botões)
export function drawDeath(g, W, H, { a = 1, title = 1, msg = 1, buttons = 1, hover = -1 } = {}) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, `rgba(80,0,0,${0.55 * a})`); gr.addColorStop(1, `rgba(128,48,48,${0.75 * a})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const s = 6;
  if (title > 0) { g.globalAlpha = title; const T = 'Você morreu!', ts = s * 2; drawText(g, T, Math.round(W / 2 - measure(T) * ts / 2), Math.round(H * 0.25), ts, '#ffffff'); }
  if (msg > 0) { g.globalAlpha = msg; const M = 'Philza foi morto por Zumbi'; drawText(g, M, Math.round(W / 2 - measure(M) * s / 2), Math.round(H * 0.25 + 150), s, '#ffffff'); }
  if (buttons > 0) {
    g.globalAlpha = buttons;
    ['Observar mundo', 'Tela de título'].forEach((L, i) => {
      const bw = 200 * 4.4, bh = 20 * 4.4, bx = W / 2 - bw / 2, by = H * 0.43 + i * (bh + 30);
      g.fillStyle = '#000'; g.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
      g.fillStyle = i === hover ? '#7d8cc4' : '#6f6f6f'; g.fillRect(bx, by, bw, bh);
      g.fillStyle = i === hover ? '#a9b6e6' : '#a8a8a8'; g.fillRect(bx, by, bw, 6); g.fillRect(bx, by, 6, bh);
      g.fillStyle = '#4a4a4a'; g.fillRect(bx, by + bh - 8, bw, 8); g.fillRect(bx + bw - 6, by, 6, bh);
      drawText(g, L, Math.round(W / 2 - measure(L) * 5 / 2), Math.round(by + bh / 2 - 18), 5, '#e0e0e0');
    });
  }
  g.globalAlpha = 1;
}
export function vignette(g, W, H, k = 0.5, color = '0,0,0') {
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
  gr.addColorStop(0, `rgba(${color},0)`); gr.addColorStop(1, `rgba(${color},${k})`); g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
