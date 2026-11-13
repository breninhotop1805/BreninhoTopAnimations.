// "Foxy Go! Go! Go!" style 2D pixel-art minigame (FNAF 2 Atari look), drawn on canvases at native resolution.
// Pure function of its spec + time. World 540x240 native px; view 135x240 (9:16) shown at 8x on a 1080x1920 frame.

const WW = 540, WH = 240;
let world, wg, view, vg, tmp, tg, PG = null;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
export function initMinigame(pgImg) {
  [world, wg] = mk(WW, WH); [view, vg] = mk(135, 240); [tmp, tg] = mk(256, 256);
  PG = pgImg;
}

// deterministic hash noise
const hsh = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

let G = null; // current ctx
const R = (x, y, w, h, c) => { G.fillStyle = c; G.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

// ---------------- 5x7 pixel font ----------------
const FONT = {
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'], O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'], E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'], R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'], D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'], H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'], '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};
function text(g, s, cx, y, sc, col, outline = '#000') {
  const adv = 6 * sc, w = s.length * adv - sc; let x0 = Math.round(cx - w / 2);
  for (const pass of [0, 1]) {
    let x = x0;
    for (const ch of s) { const f = FONT[ch] || FONT[' '];
      for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (f[r][c] === '1') {
        if (pass === 0) { g.fillStyle = outline; g.fillRect(x + c * sc - 1, y + r * sc - 1, sc + 2, sc + 2); }
        else { g.fillStyle = typeof col === 'function' ? col(r) : col; g.fillRect(x + c * sc, y + r * sc, sc, sc); } }
      x += adv; }
  }
}

// ---------------- sprites ----------------
function foxy(X, Y, ph, run, opts = {}) {
  const F = '#c4462c', Fd = '#7e2618', T = '#eab47c', M = '#a2a8b2', Md = '#5c606a', K = '#0a0a0a', Yc = '#ffe23a', Wt = '#f6f2e2', P = '#6a3c1c';
  const bob = run ? -Math.round(Math.abs(Math.sin(ph)) * 2) : 0; Y += bob;
  const legs = i => { const s = run ? Math.sin(ph + i * Math.PI) : 0; const lift = run ? Math.round(Math.max(0, Math.cos(ph + i * Math.PI)) * 2) : 0;
    const dark = i === 0; R(X - 2 + Math.round(s * 2), Y - 14 - bob, 4, 6, dark ? Fd : F); R(X - 1 + Math.round(s * 4), Y - 8 - lift - bob, 2, 6, dark ? Md : M); R(X - 2 + Math.round(s * 5), Y - 2 - lift - bob, 5, 2, dark ? K : Md); };
  legs(0);
  // back arm
  { const s = run ? -Math.sin(ph) : 0; R(X - 3 + Math.round(s * 3), Y - 25, 3, 8, Fd); R(X - 3 + Math.round(s * 5), Y - 18, 2, 4, Md); }
  // torso
  R(X - 5, Y - 26, 10, 12, F); R(X - 5, Y - 26, 2, 12, Fd); R(X + 1, Y - 24, 4, 9, T); R(X - 5, Y - 15, 10, 3, P); R(X - 5, Y - 13, 10, 1, '#3a2010');
  legs(1);
  // front arm + hook
  { const s = run ? Math.sin(ph) : (opts.wave ? 0.6 : 0); const hx = X + 1 + Math.round(s * 6), hy = Y - 15 - Math.round(Math.max(0, s) * 3);
    R(X - 1 + Math.round(s * 3), Y - 25, 3, 6, F); R(hx - 1, hy - 5, 2, 5, M);
    R(hx - 1, hy, 2, 2, '#d8d8e2'); R(hx + 1, hy + 1, 2, 1, '#d8d8e2'); R(hx + 3, hy - 1, 1, 2, '#d8d8e2'); }
  // neck + head
  R(X - 1, Y - 28, 3, 2, M);
  const hy = Y - 37; const jaw = opts.jaw ?? (run ? (Math.sin(ph * 2) > 0 ? 1 : 0) : 0);
  R(X - 4, hy, 10, 9, F); R(X - 4, hy, 1, 1, '#0000'); R(X - 4, hy + 8, 2, 1, Fd); R(X - 4, hy + 1, 1, 7, Fd);
  // ears
  R(X - 3, hy - 4, 2, 4, Fd); R(X + 1, hy - 5, 3, 5, F); R(X + 2, hy - 4, 1, 3, T);
  // eyepatch strap, brow, eye
  R(X - 4, hy + 1, 6, 1, K); R(X + 1, hy + 1, 3, 1, K); R(X + 2, hy + 2, 2, 2, Yc); R(X + 3, hy + 2, 1, 1, K);
  // muzzle
  R(X + 5, hy + 3, 5, 3, T); R(X + 9, hy + 2, 2, 2, K);
  for (let i = 0; i < 4; i++) R(X + 5 + i * 1.25, hy + 6, 1, 1, i % 2 ? K : Wt);
  R(X + 4, hy + 7, 6, 1 + jaw, K); R(X + 3, hy + 8 + jaw, 6, 2, F); for (let i = 0; i < 3; i++) R(X + 5 + i * 1.5, hy + 8 + jaw, 1, 1, Wt);
  if (opts.eyeGlow) { R(X + 2, hy + 2, 2, 2, '#ff3030'); }
}

function kid(X, Y, i, state, t) {
  const SH = ['#e83a3a', '#3a7ae8', '#36c04a', '#b048e0', '#f0a020'][i], PA = ['#2a4a8a', '#3a3a3a', '#5a3a22', '#2a2a5a', '#3a2a5a'][i];
  const HA = ['#5a3a1a', '#2a1a0a', '#c8902a', '#1a1a1a', '#7a3a1a'][i], HT = [['#ffd23a', '#e83a3a'], ['#3ad8ff', '#ffffff'], ['#ff5ad0', '#ffd23a'], ['#5aff7a', '#3a7ae8'], ['#ff8a2a', '#ffffff']][i];
  const SK = '#f2c08e', K = '#111';
  const jump = state === 'cheer' ? Math.round(Math.max(0, Math.sin(t * 14 + i * 1.7)) * 3) : 0; Y -= jump;
  R(X - 2, Y - 4, 2, 4, PA); R(X + 1, Y - 4, 2, 4, PA); R(X - 2, Y - 1, 2, 1, K); R(X + 1, Y - 1, 2, 1, K);
  R(X - 3, Y - 10, 7, 6, SH);
  const up = state === 'cheer' && Math.sin(t * 14 + i * 1.7) > -0.3;
  if (up) { R(X - 4, Y - 15, 1, 6, SH); R(X + 4, Y - 15, 1, 6, SH); R(X - 4, Y - 16, 1, 1, SK); R(X + 4, Y - 16, 1, 1, SK); }
  else { R(X - 4, Y - 10, 1, 5, SH); R(X + 4, Y - 10, 1, 5, SH); R(X - 4, Y - 5, 1, 1, SK); R(X + 4, Y - 5, 1, 1, SK); }
  R(X - 3, Y - 15, 7, 5, SK); R(X - 3, Y - 15, 7, 1, HA); R(X - 3, Y - 14, 1, 2, HA);
  R(X - 1, Y - 13, 1, 1, K); R(X + 2, Y - 13, 1, 1, K);
  if (state === 'cheer') { R(X, Y - 11, 2, 1, K); R(X - 1, Y - 12, 1, 1, K); R(X + 2, Y - 12, 1, 1, K); } else R(X, Y - 11, 2, 1, K);
  R(X - 1, Y - 17, 3, 2, HT[0]); R(X, Y - 19, 1, 2, HT[1]); R(X, Y - 20, 1, 1, '#ffffff');
}
function deadKid(X, Y, i, dir = 1) {
  const SH = ['#8a4848', '#4a5e88', '#4a7a52', '#6e4a82', '#8a6a3a'][i], PA = '#2a2a34', SK = '#a89a90', HA = '#3a3030', K = '#141414';
  const d = dir; // lying, head toward -d
  const hx = X - d * 8; R(hx - 2, Y - 5, 5, 5, SK); R(hx - 2 + (d > 0 ? 0 : 4), Y - 5, 1, 5, HA); R(hx - 1, Y - 3, 3, 1, K);
  R(Math.min(X - d * 5, X + d * 2) , Y - 5, 7, 5, SH); R(Math.min(X + d * 3, X + d * 9), Y - 4, 6, 3, PA);
  R(X - d * 3, Y, 3, 1, SH);
  // fallen party hat
  R(hx - d * 6, Y - 2, 3, 2, ['#ffd23a', '#3ad8ff', '#ff5ad0', '#5aff7a', '#ff8a2a'][i]); R(hx - d * 6 + 1, Y - 3, 1, 1, '#ffffff');
}
function table(x, y, w, dark) {
  R(x, y, w, 3, dark ? '#6a6a72' : '#f6f6f6'); R(x, y + 3, w, 8, dark ? '#4a4a58' : '#d4d4ea');
  for (let i = 0; i < w; i += 6) R(x + i, y + 9, 3, 2, dark ? '#3a2a40' : '#ff5ad0');
  for (let i = 8; i < w - 6; i += 18) { R(x + i, y - 3, 3, 3, dark ? '#5a5a5a' : '#ff3a3a'); R(x + i + 1, y - 4, 1, 1, '#ffffff'); R(x + i + 8, y - 2, 4, 2, dark ? '#6a5a40' : '#f0a020'); }
}

// ---------------- world ----------------
function drawWorld(sp, t) {
  G = wg; const dark = sp.third; R(0, 0, WW, WH, '#000');
  // ---- Pirate Cove (x 0..104)
  R(0, 0, 104, 150, '#140e30');
  for (let i = 0; i < 22; i++) { const sx = (hsh(i, 1) * 100) | 0, sy = (hsh(i, 2) * 140) | 0; R(sx, sy, 1, 1, hsh(i, 3) > 0.5 ? '#ffe85a' : '#ffffff'); }
  R(4, 150, 98, 10, '#8a5228'); R(4, 150, 98, 1, '#c07a3a'); R(4, 160, 98, 6, '#5a3416');
  R(4, 166, 98, 74, '#0c0a14'); // floor in front of the cove
  // curtain (two halves) with folds + stars; opens with sp.curtain
  const o = sp.curtain || 0; const half = 42 * (1 - 0.78 * o);
  R(12, 8, 84, 142, '#07050c');
  for (const side of [0, 1]) { const x0 = side ? 96 - half : 12;
    for (let x = 0; x < half; x++) { const fold = Math.floor((x + (side ? 0 : 2)) / 3) % 2; R(x0 + x, 12, 1, 138, fold ? '#5a2296' : '#7a3ac0'); }
    for (let k = 0; k < 7; k++) { const sx = x0 + 4 + ((k * 13 + side * 7) % Math.max(6, half - 6)), sy = 24 + k * 17; if (sx < x0 + half - 2) { R(sx, sy, 1, 3, '#ffe85a'); R(sx - 1, sy + 1, 3, 1, '#ffe85a'); } } }
  R(8, 4, 92, 10, '#3a1468'); for (let x = 8; x < 100; x += 6) R(x, 14, 4, 2, '#3a1468'); R(8, 4, 92, 1, '#8a4ad0');
  // ---- hallway (x 104..300)
  R(104, 0, 196, 112, dark ? '#10162a' : '#22346a');
  for (let y = 0; y < 112; y += 8) for (let x = 104 + ((y / 8) % 2) * 6; x < 300; x += 12) R(x, y, 1, 8, dark ? '#0a0e1c' : '#1a2850');
  for (let y = 8; y < 112; y += 8) R(104, y, 196, 1, dark ? '#0a0e1c' : '#1a2850');
  for (let x = 104; x < 300; x += 4) R(x, 100, 4, 4, ((x / 4) % 2) ? '#e8e8e8' : '#111'); for (let x = 104; x < 300; x += 4) R(x, 104, 4, 4, ((x / 4) % 2) ? '#111' : '#e8e8e8');
  // posters
  for (const [px, c] of [[122, '#8a5a2a'], [176, '#c4462c'], [232, '#5a2a8a']]) { R(px, 34, 22, 30, '#e8e0c8'); R(px + 2, 36, 18, 26, dark ? '#3a3030' : c); R(px + 6, 44, 3, 3, '#000'); R(px + 13, 44, 3, 3, '#000'); R(px + 7, 54, 8, 2, '#000'); }
  // ceiling lights (flicker on the 3rd run)
  for (let i = 0; i < 4; i++) { const on = !dark || hsh(Math.floor(t * 12), i) > 0.55; R(112 + i * 48, 2, 14, 3, on ? '#fff6c8' : '#2a2a2a'); }
  R(104, 112, 196, 84, '#0e0e16'); for (let y = 112; y < 196; y += 8) for (let x = 104; x < 300; x += 8) if (((x + y) / 8) % 2 < 1) R(x, y, 8, 8, dark ? '#16161e' : '#2a2a3a');
  R(104, 196, 196, 44, dark ? '#0a0e1a' : '#18244a'); R(104, 196, 196, 2, dark ? '#1a2440' : '#3a5aa0');
  // ---- party room (x 300..540)
  R(300, 0, 240, 72, dark ? '#160c26' : '#4a2a8a'); R(300, 66, 240, 6, dark ? '#0e0818' : '#2a1458');
  for (let x = 300; x < 540; x += 10) { const ci = (x / 10) % 4; const col = dark ? ['#3a2a2a', '#2a2a3a', '#2a3a2a', '#3a3a2a'][ci] : ['#ff3a3a', '#ffd23a', '#3ad8ff', '#5aff7a'][ci];
    const sag = Math.round(3 * Math.sin(((x - 300) % 60) / 60 * Math.PI)); for (let k = 0; k < 5; k++) R(x + k, 16 + sag, 10 - 2 * k, 1, col); R(x, 14 + sag, 10, 1, dark ? '#333' : '#ddd'); }
  // balloons on the wall
  if (!dark) for (const [bx, c] of [[318, '#ff3a3a'], [470, '#3ad8ff'], [505, '#ffd23a']]) { R(bx, 30, 7, 9, c); R(bx + 1, 29, 5, 1, c); R(bx + 1, 31, 2, 2, '#ffffff'); R(bx + 3, 39, 1, 12, '#dddddd'); }
  // "CELEBRATE" banner frame + kid drawings
  for (let k = 0; k < 4; k++) { const dx = 352 + k * 26; R(dx, 32, 16, 20, dark ? '#4a4a4a' : '#f4f4f4'); R(dx + 3, 36, 10, 10, dark ? '#2a2a2a' : ['#c4462c', '#8a5a2a', '#ffd23a', '#5a2a8a'][k]); R(dx + 5, 39, 2, 2, '#000'); R(dx + 9, 39, 2, 2, '#000'); }
  // floor: black/white checker
  for (let y = 72; y < 240; y += 8) for (let x = 300; x < 540; x += 8) R(x, y, 8, 8, (((x - 300) / 8 + (y - 72) / 8) % 2) ? (dark ? '#1a1a1e' : '#d8d8d8') : (dark ? '#060608' : '#18181c'));
  if (dark) { G.fillStyle = 'rgba(80,0,0,' + (0.18 + 0.12 * Math.sin(t * 9)) + ')'; G.fillRect(300, 0, 240, 240); }

  // ---- actors (depth sorted by feet y)
  const A = [];
  const kidsSpots = [[352, 112], [378, 112], [404, 112], [452, 182], [480, 182]];
  if (sp.kids === 'dead') {
    [[344, 140, 1], [392, 150, -1], [418, 134, 1], [446, 214, -1], [492, 208, 1]].forEach(([x, y, d], i) => A.push([y, () => deadKid(x, y, i, d)]));
  } else kidsSpots.forEach(([x, y], i) => A.push([y, () => kid(x, y, i, sp.kids === 'cheer' ? 'cheer' : 'sit', t)]));
  A.push([114, () => table(336, 112, 92, dark)]); A.push([184, () => table(438, 182, 72, dark)]);
  if (sp.pg) A.push([98, () => { G.drawImage(PG, 506, 53); if (sp.pgGlint && Math.floor(t * 4) % 3 === 0) { R(509 + 2, 53 + 3, 1, 1, '#ffffff'); } }]);
  if (sp.foxy) { const f = sp.foxy; A.push([f.y, () => foxy(f.x, f.y, f.ph || 0, f.run, f)]); }
  A.sort((a, b) => a[0] - b[0]).forEach(a => a[1]());
  // confetti
  if (sp.confetti) for (let i = 0; i < 46; i++) { const cx = 330 + hsh(i, 5) * 200, sp0 = 20 + hsh(i, 6) * 30; const cy = ((t * sp0 + hsh(i, 7) * 200) % 200) + 20;
    R(cx + Math.sin(t * 5 + i) * 3, cy, 2, 1, ['#ff3a3a', '#ffd23a', '#3ad8ff', '#5aff7a', '#ff5ad0'][i % 5]); }
  // darkness of the 3rd run: radial light around Foxy only
  if (dark && sp.foxy) {
    const f = sp.foxy; const gr = G.createRadialGradient(f.x, f.y - 18, 10, f.x, f.y - 18, 90 + 10 * Math.sin(t * 7));
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.78)'); G.fillStyle = gr; G.fillRect(0, 0, WW, WH);
  }
}

// ---------------- view / post ----------------
// spec: { cx, cy, z, curtain, foxy:{x,y,ph,run,jaw}, kids:'sit'|'cheer'|'dead', pg, third, confetti, text, textCol, big, glitch, flash, fadeBlack }
export function renderMinigame(spec, t, out, ow, oh, opts = {}) {
  drawWorld(spec, t);
  const vw = opts.vw || 135, vh = opts.vh || 240; if (view.width !== vw || view.height !== vh) { view.width = vw; view.height = vh; vg.imageSmoothingEnabled = false; }
  const z = spec.z || 1; const sw = vw / z, sh = vh / z;
  let sx = (spec.cx ?? 60) - sw / 2, sy = (spec.cy ?? 120) - sh / 2; sx = Math.max(0, Math.min(WW - sw, sx)); sy = Math.max(0, Math.min(WH - sh, sy));
  vg.fillStyle = '#000'; vg.fillRect(0, 0, vw, vh);
  vg.drawImage(world, Math.round(sx * z) / z, Math.round(sy * z) / z, sw, sh, 0, 0, vw, vh);
  G = vg;
  // HUD text
  if (spec.text) { const blinkOn = !spec.blink || Math.floor(t * 6) % 2 === 0; if (blinkOn) text(vg, spec.text, vw / 2, spec.textY ?? 14, spec.textSc ?? 2, spec.textCol || (r => r < 3 ? '#ffffff' : '#ff3a3a')); }
  if (spec.big) { const k = spec.bigK ?? 1; text(vg, spec.big, vw / 2, vh * 0.2 - 21 * k, Math.max(1, Math.round(6 * k)), '#ff2a2a', '#000'); }
  // glitch: row shifts, colour bands, static
  const gl = spec.glitch || 0;
  if (gl > 0) {
    tmp.width = vw; tmp.height = vh; tg.imageSmoothingEnabled = false; tg.drawImage(view, 0, 0);
    const fr = Math.floor(t * 30);
    for (let y = 0; y < vh; y += 2) { const r = hsh(y * 0.37, fr); if (r < 0.22 * gl) { const dx = Math.round((hsh(y, fr + 1) - 0.5) * 40 * gl); const hgt = 1 + Math.floor(hsh(y, fr + 2) * 6); vg.drawImage(tmp, 0, y, vw, hgt, dx, y, vw, hgt); } }
    for (let i = 0; i < 160 * gl; i++) R((hsh(i, fr + 3) * vw) | 0, (hsh(i, fr + 4) * vh) | 0, 1 + ((hsh(i, fr) * 3) | 0), 1, hsh(i, fr + 5) > 0.5 ? '#ffffff' : '#ff2a5a');
    if (hsh(fr, 9) < 0.25 * gl) { vg.fillStyle = 'rgba(255,0,60,0.25)'; vg.fillRect(0, (hsh(fr, 11) * vh) | 0, vw, 10 + ((hsh(fr, 12) * 30) | 0)); }
  }
  if (spec.flash) { vg.fillStyle = `rgba(255,255,255,${spec.flash})`; vg.fillRect(0, 0, vw, vh); }
  if (spec.fadeBlack) { vg.fillStyle = `rgba(0,0,0,${spec.fadeBlack})`; vg.fillRect(0, 0, vw, vh); }
  // upscale to the output (nearest) + CRT scanlines/vignette
  const og = out.getContext('2d'); og.imageSmoothingEnabled = false; og.drawImage(view, 0, 0, vw, vh, 0, 0, ow, oh);
  if (!opts.noCRT) {
    const p = oh / vh; og.fillStyle = 'rgba(0,0,0,0.22)'; for (let y = 0; y < vh; y++) og.fillRect(0, Math.round(y * p + p * 0.72), ow, Math.max(1, Math.round(p * 0.28)));
    const gr = og.createRadialGradient(ow / 2, oh / 2, oh * 0.25, ow / 2, oh / 2, oh * 0.62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)'); og.fillStyle = gr; og.fillRect(0, 0, ow, oh);
  }
}
