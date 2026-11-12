// "Circus Baby's Pizza World" style 2D pixel minigame (Sister Location), drawn natively and upscaled with nearest filtering.
// Own pixel art (not traced): blue sky + scanlines, teal stepped hills, clouds, smiling sun, grass platforms, flowers, dirt ground.
// World 360x240 native px; view 135x240 for 9:16, or 160x120 for a 4:3 arcade screen.

const WW = 360, WH = 240;
let world, wg, view, vg;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
export function initBabyGame() { [world, wg] = mk(WW, WH); [view, vg] = mk(135, 240); }
const hsh = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
let G = null; const R = (x, y, w, h, c) => { G.fillStyle = c; G.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

// ---- digits (3x5) for the counter ----
const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001010010', '111101111101111', '111101111001111'];
function number(n, x, y, sc, col) { const s = String(n); for (let k = 0; k < s.length; k++) { const d = DIG[+s[k]]; for (let i = 0; i < 15; i++) if (d[i] === '1') R(x + k * 4 * sc + (i % 3) * sc, y + Math.floor(i / 3) * sc, sc, sc, col); } }

// ---- scenery ----
function cloud(x, y, w) { const rows = [[0.3, 0.7], [0.1, 0.9], [0, 1], [0.08, 0.92], [0.25, 0.75]]; rows.forEach(([a, b], i) => { R(x + a * w, y + i * 3, (b - a) * w, 3, '#f2f2f2'); R(x + a * w, y + i * 3 + 2, (b - a) * w, 1, '#c8c8d0'); }); }
function sun(x, y, t) { const Y = '#e8d23a', O = '#c8781a'; R(x - 12, y - 10, 24, 20, Y); R(x - 10, y - 12, 20, 24, Y); for (const [dx, dy] of [[-20, -2], [16, -2], [-2, -20], [-2, 16], [-16, -16], [12, -16], [-16, 12], [12, 12]]) R(x + dx, y + dy, 4, 4, Y);
  R(x - 8, y - 3, 6, 2, O); R(x + 2, y - 3, 6, 2, O); R(x - 7, y + 3, 14, 3, O); R(x - 5, y + 6, 10, 1, O); }
function hill(x0, x1, top, base, col, dark) { const w = x1 - x0, steps = 9; for (let i = 0; i < steps; i++) { const k = i / steps; const hw = w / 2 * Math.sqrt(1 - k) * (1 - k * 0.15); const yy = base - (base - top) * k;
    R(x0 + w / 2 - hw, yy - (base - top) / steps, hw * 2, (base - top) / steps + 1, col); }
  for (let i = 0; i < 26; i++) { const xx = x0 + hsh(i, x0) * w, yy = top + hsh(i, x0 + 1) * (base - top); R(xx, yy, 5, 3, dark); } }
function platform(x, y, w) { R(x, y, w, 4, '#3ab83a'); R(x, y + 4, w, 9, '#8a4a2a'); for (let i = 0; i < w; i += 5) { R(x + i, y + 4, 2, 2 + (i * 7) % 4, '#1e7a1e'); R(x + i + 2, y + 7, 3, 3, '#6a321a'); } R(x, y, w, 1, '#6ae86a'); }
function flower(x, y) { R(x, y - 7, 1, 7, '#2a8a2a'); R(x + 1, y - 4, 3, 1, '#2a8a2a'); R(x - 3, y - 13, 7, 3, '#f4f4f4'); R(x - 1, y - 15, 3, 7, '#f4f4f4'); R(x - 1, y - 12, 3, 2, '#e8c83a'); }
function ground() { R(0, 196, WW, 9, '#2aa82a'); R(0, 196, WW, 1, '#6ae86a'); for (let x = 0; x < WW; x += 6) R(x, 205, 3, 3 + (x * 13) % 5, '#1a6a1a');
  R(0, 205, WW, 35, '#0e2a0e'); for (let x = 0; x < WW; x += 24) { R(x + 2, 214, 18, 26, '#9a5a32'); R(x + 4, 212, 6, 4, '#9a5a32'); R(x + 13, 210, 5, 6, '#9a5a32'); R(x + 2, 214, 18, 2, '#b8784a'); } }

// ---- sprites ----
function baby(X, Y, t, o = {}) { // feet at (X,Y); ~58px tall
  const W = '#f2f2f2', Gr = '#a8a8b0', Rd = '#d8262a', Rd2 = '#a81c20', Or = '#f07a1a', K = '#111', Sk = '#f8f0f0';
  const step = o.walk ? Math.sin(t * 10) : 0; const bob = o.walk ? -Math.abs(step) : 0; Y += bob;
  for (const sx of [-1, 1]) { const lift = o.walk ? Math.max(0, sx * step) * 2 : 0; R(X + sx * 5 - 3, Y - 4 - lift, 7, 4, Rd); R(X + sx * 5 - 2, Y - 16 - lift, 5, 12, W); R(X + sx * 5 - 2, Y - 11 - lift, 5, 2, Gr); }
  R(X - 13, Y - 22, 26, 6, Rd); R(X - 12, Y - 17, 24, 1, Rd2); for (let i = -12; i < 12; i += 4) R(X + i, Y - 22, 1, 6, Rd2);
  R(X - 10, Y - 31, 20, 9, W); R(X - 4, Y - 31, 8, 8, Or); R(X - 2, Y - 29, 4, 4, K); R(X - 1, Y - 29, 2, 4, W); R(X - 2, Y - 28, 4, 2, W);
  R(X - 10, Y - 41, 20, 10, Rd); R(X - 10, Y - 41, 20, 2, Rd2);
  const aR = o.throw ? -1 : 0;
  R(X - 15, Y - 40, 5, 6, W); R(X - 15, Y - 34 + aR * 12, 5, 8, W); R(X - 16, Y - 26 + aR * 16, 6, 4, W); R(X - 15, Y - 35, 5, 1, Gr);
  R(X + 10, Y - 40, 5, 14, W); R(X + 10, Y - 35, 5, 1, Gr); R(X + 9, Y - 27, 7, 4, W);
  if (o.mic) { R(X + 11, Y - 32, 2, 6, '#3a3a40'); R(X + 10, Y - 35, 4, 4, '#2a2a2e'); }
  R(X - 2, Y - 43, 4, 2, Gr);
  // head
  const hx = X - 9, hy = Y - 61; R(hx, hy + 2, 18, 17, Sk); R(hx + 1, hy + 1, 16, 1, Sk);
  R(hx - 1, hy - 1, 20, 5, Rd); R(hx + 2, hy - 3, 14, 3, Rd); R(hx + 7, hy - 5, 4, 3, Rd);
  // pigtails (curly, sticking out)
  for (const sx of [-1, 1]) { const bx = sx < 0 ? hx - 4 : hx + 18; R(bx, hy + 1, 4, 4, Rd2); R(bx + sx * 3, hy - 3, 5, 5, Rd); R(bx + sx * 7, hy - 6, 5, 4, Rd); R(bx + sx * 11, hy - 4, 4, 4, Rd); R(bx + sx * 12, hy, 3, 3, Rd2); }
  const eye = o.eye || '#3a8af0';
  for (const ex of [hx + 3, hx + 11]) { R(ex - 1, hy + 6, 6, 1, '#2a2a6a'); R(ex, hy + 7, 4, 4, '#ffffff'); R(ex + 1, hy + 8, 3, 3, eye); R(ex + 2, hy + 9, 1, 1, K); R(ex + 1, hy + 8, 1, 1, '#ffffff'); }
  R(hx + 8, hy + 11, 2, 2, '#e82a3a'); R(hx + 1, hy + 12, 3, 2, '#f08aa0'); R(hx + 14, hy + 12, 3, 2, '#f08aa0');
  R(hx + 4, hy + 14, 10, 3, K); R(hx + 5, hy + 15, 8, 1, '#ffffff'); R(hx + 3, hy + 13, 1, 1, K); R(hx + 14, hy + 13, 1, 1, K);
}
function kid(X, Y, t, i, o = {}) { const S = '#f0b090', H = ['#5a3a1a', '#3a2412', '#6a4422', '#4a2e16'][i % 4], SH = ['#d84a6a', '#c83a5a', '#e85a7a', '#b8384e'][i % 4], P = '#2a4a9a', K = '#111';
  const j = o.happy ? Math.round(Math.max(0, Math.sin(t * 9 + i)) * 3) : 0; Y -= j;
  R(X - 5, Y - 3, 4, 3, K); R(X + 1, Y - 3, 4, 3, K); R(X - 4, Y - 7, 3, 4, S); R(X + 1, Y - 7, 3, 4, S); R(X - 6, Y - 12, 12, 5, P);
  R(X - 7, Y - 22, 14, 10, SH); R(X - 1, Y - 20, 2, 1, '#802030'); R(X - 1, Y - 17, 2, 1, '#802030'); R(X - 10, Y - 21, 3, 8, SH); R(X + 7, Y - 21, 3, 8, SH); R(X - 10, Y - 13, 3, 2, S); R(X + 7, Y - 13, 3, 2, S);
  R(X - 6, Y - 33, 12, 11, S); R(X - 7, Y - 36, 14, 5, H); R(X - 7, Y - 33, 2, 4, H); R(X + 5, Y - 33, 2, 4, H);
  R(X - 4, Y - 30, 3, 3, '#fff'); R(X + 1, Y - 30, 3, 3, '#fff'); R(X - 3, Y - 29, 1, 2, K); R(X + 2, Y - 29, 1, 2, K); R(X - 6, Y - 26, 2, 2, '#e88a8a'); R(X + 4, Y - 26, 2, 2, '#e88a8a');
  R(X - 3, Y - 25, 6, 2, '#a01a1a'); R(X - 2, Y - 25, 4, 1, '#ffffff');
  if (o.note) { const nx = X + 10, ny = Y - 36 - ((t * 20 + i * 7) % 10); R(nx, ny, 1, 6, '#fff'); R(nx - 2, ny + 5, 3, 2, '#fff'); R(nx + 1, ny, 3, 1, '#fff'); }
}
function liz(X, Y, t, o = {}) { const S = '#f8d0a8', H = '#e8902a', Hd = '#c87018', Bw = '#e8141e', K = '#111';
  const step = o.walk ? Math.sin(t * 9) : 0; Y -= o.walk ? Math.abs(step) : 0;
  R(X - 5, Y - 3, 4, 3, K); R(X + 1, Y - 3, 4, 3, K); R(X - 4, Y - 8, 3, 5, S); R(X + 1, Y - 8, 3, 5, S); R(X - 7, Y - 14, 14, 6, '#2a5ab8');
  R(X - 7, Y - 23, 14, 9, '#d82a8a'); R(X - 1, Y - 21, 2, 1, '#801050'); R(X - 10, Y - 22, 3, 8, '#d82a8a'); R(X + 7, Y - 22, 3, 8, '#d82a8a'); R(X - 10, Y - 14, 3, 2, S); R(X + 7, Y - 14, 3, 2, S);
  if (o.icecream) { R(X + 8, Y - 18, 3, 5, '#c8902a'); R(X + 7, Y - 22, 5, 4, '#f4e8f0'); R(X + 8, Y - 24, 3, 2, '#f08ab0'); }
  R(X - 8, Y - 36, 16, 14, H); R(X - 6, Y - 33, 12, 11, S); R(X - 8, Y - 37, 16, 4, H); R(X - 8, Y - 33, 2, 10, Hd); R(X + 6, Y - 33, 2, 10, Hd);
  R(X - 6, Y - 41, 5, 4, Bw); R(X + 1, Y - 41, 5, 4, Bw); R(X - 1, Y - 40, 2, 2, '#a80c12');
  R(X - 4, Y - 30, 3, 3, '#fff'); R(X + 1, Y - 30, 3, 3, '#fff'); R(X - 3, Y - 29, 2, 2, '#2ac83a'); R(X + 2, Y - 29, 2, 2, '#2ac83a'); R(X - 5, Y - 26, 2, 1, '#f08a8a'); R(X + 3, Y - 26, 2, 1, '#f08a8a'); R(X - 2, Y - 25, 4, 1, '#a01a1a'); }
function cupcake(x, y) { R(x - 4, y - 5, 8, 5, '#d8a85a'); for (let i = 0; i < 8; i += 2) R(x - 4 + i, y - 5, 1, 5, '#b8884a'); R(x - 5, y - 9, 10, 4, '#3ab83a'); R(x - 4, y - 11, 8, 2, '#3ab83a'); R(x - 3, y - 8, 1, 1, '#e8e83a'); R(x + 1, y - 10, 1, 1, '#e83a3a'); R(x + 2, y - 7, 1, 1, '#3a8ae8'); R(x, y - 14, 1, 3, '#f0d070'); R(x, y - 15, 1, 1, '#ff8a2a'); }

// ---- world + view ----
function drawWorld(sp, t) {
  G = wg; for (let y = 0; y < 196; y++) { const k = y / 196; R(0, y, WW, 1, `rgb(${10 + 6 * k | 0},${22 + 10 * k | 0},${200 + 30 * k | 0})`); }
  sun(36, 34, t); cloud(110, 14, 56); cloud(240, 44, 60); cloud(300, 10, 40);
  hill(20, 230, 82, 196, '#2a8a8a', '#247a7a'); hill(170, 360, 112, 196, '#2e9696', '#287e7e'); hill(-40, 80, 140, 196, '#287e7e', '#226e6e');
  platform(36, 150, 52); platform(200, 104, 56); platform(250, 150, 50); platform(300, 64, 46);
  ground(); for (const fx of [118, 168, 232, 330]) flower(fx, 196);
  // actors
  const A = [];
  (sp.kids || []).forEach((k, i) => A.push([k.y, () => kid(k.x, k.y, t, i, k)]));
  if (sp.liz) A.push([sp.liz.y, () => liz(sp.liz.x, sp.liz.y, t, sp.liz)]);
  if (sp.baby) A.push([sp.baby.y + 0.1, () => baby(sp.baby.x, sp.baby.y, t, sp.baby)]);
  A.sort((a, b) => a[0] - b[0]).forEach(a => a[1]());
  (sp.cakes || []).forEach(c => cupcake(c.x, c.y));
  if (sp.counter !== undefined) number(sp.counter, WW - 26, 214, 3, '#e8e8f0');
}
export function renderBabyGame(spec, t, out, ow, oh, opts = {}) {
  drawWorld(spec, t);
  const vw = opts.vw || 135, vh = opts.vh || 240; if (view.width !== vw || view.height !== vh) { view.width = vw; view.height = vh; vg.imageSmoothingEnabled = false; }
  const z = spec.z || 1; const sw = vw / z, sh = vh / z;
  let sx = (spec.cx ?? 120) - sw / 2, sy = (spec.cy ?? 120) - sh / 2; sx = Math.max(0, Math.min(WW - sw, sx)); sy = Math.max(0, Math.min(WH - sh, sy));
  vg.fillStyle = '#000'; vg.fillRect(0, 0, vw, vh); vg.drawImage(world, sx, sy, sw, sh, 0, 0, vw, vh);
  if (spec.fadeBlack) { vg.fillStyle = `rgba(0,0,0,${spec.fadeBlack})`; vg.fillRect(0, 0, vw, vh); }
  const og = out.getContext('2d'); og.imageSmoothingEnabled = false; og.drawImage(view, 0, 0, vw, vh, 0, 0, ow, oh);
  // magnifier ring (screen space) on a world point
  if (spec.ring) { const [wx, wy, r, col, a] = spec.ring; const X = (wx - sx) * z * ow / vw, Y = (wy - sy) * z * oh / vh; og.save(); og.globalAlpha = a ?? 1; og.strokeStyle = col || '#ffffff'; og.lineWidth = ow * 0.012; og.beginPath(); og.arc(X, Y, r * ow, 0, 7); og.stroke(); og.restore(); }
  if (!opts.noCRT) { const p = oh / vh; og.fillStyle = 'rgba(0,0,10,0.28)'; for (let y = 0; y < vh; y++) og.fillRect(0, Math.round(y * p + p * 0.62), ow, Math.max(1, Math.round(p * 0.38)));
    const gr = og.createRadialGradient(ow / 2, oh / 2, oh * 0.28, ow / 2, oh / 2, oh * 0.66); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.5)'); og.fillStyle = gr; og.fillRect(0, 0, ow, oh); }
}
