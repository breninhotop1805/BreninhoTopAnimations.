// FNAF 4 style "Fredbear's Family Diner" 2D pixel minigame (own pixel art, not traced).
// World 480x240 native px: grey striped wall, purple ceiling/floor bands, stage with Fredbear + Spring Bonnie,
// hanging lamps, balloon table, streamers, poster, red doors, confetti, heavy CRT scanlines.

const WW = 480, WH = 240;
let world, wg, view, vg;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
export function initBiteGame() { [world, wg] = mk(WW, WH); [view, vg] = mk(135, 240); }
const hsh = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
let G = null; const R = (x, y, w, h, c) => { G.fillStyle = c; G.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

// ---------- scenery ----------
function room(t, dark) {
  R(0, 0, WW, WH, '#000');
  for (let x = 0; x < WW; x += 6) { const k = Math.floor(x / 6); R(x, 12, 6, 184, ['#6c6c74', '#62626a', '#74747c', '#5e5e66'][k % 4]); if (k % 7 === 3) R(x + 2, 12, 2, 184, '#86868e'); }
  R(0, 0, WW, 12, '#26266a'); R(0, 10, WW, 2, '#3a3a8a');
  R(0, 196, WW, 2, '#a8a8e8'); R(0, 198, WW, 42, '#30307a'); R(0, 214, WW, 26, '#22225a');
  // poster (Fredbear face) + red doors
  R(356, 36, 76, 64, '#a01a1a'); R(360, 40, 68, 56, '#d8c02a'); R(372, 36, 44, 10, '#6a2a8a'); R(380, 28, 28, 10, '#6a2a8a'); R(376, 56, 8, 8, '#5a3a1a'); R(400, 56, 8, 8, '#5a3a1a'); R(372, 74, 44, 6, '#5a3a1a'); R(368, 70, 6, 6, '#5a3a1a'); R(414, 70, 6, 6, '#5a3a1a');
  R(398, 112, 72, 84, '#3a0a0a'); R(400, 114, 34, 82, '#b81a1a'); R(436, 114, 32, 82, '#b81a1a'); R(426, 150, 4, 12, '#2a0a0a'); R(438, 150, 4, 12, '#2a0a0a');
  // streamers (zig-zag)
  const zig = (x0, col, n) => { for (let i = 0; i < n; i++) { const x = x0 + ((i % 4) < 2 ? i % 2 : 1 - i % 2) * 4 + i * 0.6; R(x, 12 + i * 5, 4, 6, col); } };
  zig(186, '#6a2a9a', 14); zig(318, '#2ad83a', 30); zig(452, '#2ad83a', 36); zig(246, '#e8781a', 22);
  // hanging lamps
  [[150, '#f2e23a'], [210, '#7ad8ff'], [270, '#2ad84a'], [330, '#e8a0f0']].forEach(([x, c]) => { R(x + 4, 12, 3, 14, '#222'); R(x - 2, 26, 15, 6, '#2a2a2e'); R(x, 32, 11, 7, c); R(x + 2, 33, 4, 2, '#ffffff'); });
  // table + balloons
  R(232, 160, 104, 5, '#d84a5a'); R(232, 165, 104, 3, '#8a2a2a'); R(238, 168, 4, 28, '#7a2a1a'); R(326, 168, 4, 28, '#7a2a1a');
  [[262, 104, '#e8781a'], [276, 94, '#e81a2a'], [292, 96, '#2ad83a'], [304, 112, '#3a6ae8'], [286, 118, '#e81a2a'], [316, 98, '#a04ad8']].forEach(([x, y, c], i) => { R(x + 6, y + 16, 1, 160 - y - 16, '#3a3a3a'); R(x + 2, y, 10, 2, c); R(x, y + 2, 14, 11, c); R(x + 2, y + 13, 10, 3, c); R(x + 3, y + 3, 3, 3, '#ffffff'); });
  // stage
  R(8, 172, 168, 24, '#7a3a2a'); for (let y = 174; y < 196; y += 3) R(8, y, 168, 1, '#5a2a1a'); R(8, 172, 168, 2, '#a85a3a');
  // confetti
  for (let i = 0; i < 90; i++) { const x = hsh(i, 1) * WW, y = 14 + hsh(i, 2) * 180; R(x, y, 3, 2, ['#e85a7a', '#e8a03a', '#7a5ae8', '#5ae87a', '#e8e85a'][i % 5]); }
  for (let i = 0; i < 70; i++) { const x = hsh(i, 3) * WW, y = 200 + hsh(i, 4) * 36; R(x, y, 4, 2, ['#e85a7a', '#7ad8ff', '#5ae87a', '#e8e85a', '#e8a03a'][i % 5]); }
  if (dark) { G.fillStyle = 'rgba(0,0,0,0.45)'; G.fillRect(0, 0, WW, WH); }
}

// ---------- animatronics ----------
function fredbear(X, Y, o = {}) { // feet (X,Y), facing right (mouth on the right side of the head), ~96px
  const Gd = '#d8a82a', Gl = '#f0c84a', Gs = '#a8781a', P = '#6a2a8a', K = '#1a1a1a';
  const jaw = o.jaw ?? 0.2;
  R(X - 14, Y - 4, 12, 4, Gs); R(X + 2, Y - 4, 12, 4, Gs); R(X - 13, Y - 30, 10, 26, Gd); R(X + 3, Y - 30, 10, 26, Gd); R(X - 13, Y - 30, 3, 26, Gs);
  R(X - 18, Y - 66, 36, 38, Gd); R(X - 8, Y - 60, 18, 28, Gl); R(X - 18, Y - 66, 4, 38, Gs);
  R(X - 6, Y - 66, 12, 5, P); R(X - 9, Y - 68, 6, 6, P); R(X + 3, Y - 68, 6, 6, P);
  R(X - 26, Y - 62, 8, 26, Gs); R(X - 26, Y - 38, 8, 6, Gd); R(X + 18, Y - 62, 8, 18, Gd); R(X + 22, Y - 48, 12, 7, Gd); R(X + 32, Y - 54, 4, 10, '#3a3a3a'); R(X + 31, Y - 58, 6, 5, '#202020');
  const hx = X - 16, hy = Y - 96;
  R(hx, hy + 6, 32, 24, Gd); R(hx + 4, hy + 2, 24, 6, Gd); R(hx, hy + 6, 4, 24, Gs);
  R(hx - 2, hy - 2, 9, 9, Gd); R(hx + 1, hy + 1, 3, 3, Gs); R(hx + 25, hy - 2, 9, 9, Gd); R(hx + 28, hy + 1, 3, 3, Gs);
  R(hx + 6, hy - 12, 20, 12, P); R(hx + 2, hy - 2, 28, 3, P);
  R(hx + 10, hy + 10, 6, 4, '#e8e8e8'); R(hx + 13, hy + 11, 3, 3, '#7a1a1a'); R(hx + 20, hy + 10, 6, 4, '#e8e8e8'); R(hx + 23, hy + 11, 3, 3, '#7a1a1a'); R(hx + 9, hy + 8, 8, 2, Gs); R(hx + 19, hy + 8, 8, 2, Gs);
  // snout (upper) + lower jaw that opens
  R(hx + 22, hy + 16, 18, 7, Gl); R(hx + 36, hy + 14, 6, 5, '#5a3a1a');
  for (let i = 0; i < 4; i++) R(hx + 24 + i * 4, hy + 23, 2, 2, '#f4f4f4');
  const jo = Math.round(jaw * 12); R(hx + 20, hy + 23, 20, jo, '#2a0a0a');
  R(hx + 18, hy + 23 + jo, 20, 6, Gd); for (let i = 0; i < 4; i++) R(hx + 22 + i * 4, hy + 22 + jo, 2, 2, '#f4f4f4');
}
function springbonnie(X, Y) { const B = '#7a5a22', Bd = '#5a4018', Bl = '#9a7a3a';
  R(X - 11, Y - 4, 10, 4, Bd); R(X + 1, Y - 4, 10, 4, Bd); R(X - 10, Y - 28, 8, 24, B); R(X + 2, Y - 28, 8, 24, B);
  R(X - 15, Y - 60, 30, 34, B); R(X - 6, Y - 54, 14, 24, Bl); R(X - 21, Y - 58, 7, 26, Bd); R(X + 15, Y - 58, 7, 24, B);
  const hx = X - 13, hy = Y - 86; R(hx, hy + 6, 26, 22, B); R(hx + 18, hy + 16, 12, 7, Bl);
  R(hx + 4, hy - 16, 6, 22, B); R(hx + 6, hy - 12, 2, 16, '#c8a060'); R(hx + 14, hy - 20, 6, 26, B); R(hx + 16, hy - 16, 2, 18, '#c8a060');
  R(hx + 12, hy + 11, 5, 3, '#e8e8e8'); R(hx + 14, hy + 11, 2, 3, '#2a5a2a'); R(hx + 20, hy + 23, 10, 2, '#2a1a0a'); }

// ---------- kids ----------
const SKIN = '#e8a060';
function body(X, Y, shirt, shorts, step, armsUp) { const K = '#2a2a2a';
  const a = Math.round(step * 2);
  R(X - 6 + a, Y - 3, 5, 3, K); R(X + 1 - a, Y - 3, 5, 3, K); R(X - 5 + a, Y - 11, 3, 8, SKIN); R(X + 2 - a, Y - 11, 3, 8, SKIN);
  R(X - 7, Y - 17, 14, 6, shorts); R(X - 7, Y - 29, 14, 12, shirt);
  if (armsUp) { R(X - 10, Y - 62, 3, 34, SKIN); R(X + 7, Y - 62, 3, 34, SKIN); } else { R(X - 10, Y - 29, 3, 12, SKIN); R(X + 7, Y - 29, 3, 12, SKIN); R(X - 10, Y - 18, 3, 2, SKIN); }
}
function maskKid(X, Y, type, t, o = {}) { const step = o.walk ? Math.sin(t * 9 + X) : 0; const bob = o.walk ? -Math.abs(step) : 0; Y += bob;
  const outfit = { foxy: ['#8a8a92', '#1a5a6a'], bonnie: ['#d81a2a', '#1a5a6a'], chica: ['#1a2a8a', '#5a3a1a'], freddy: ['#4a7a1a', '#1a4a5a'] }[type];
  body(X, Y, outfit[0], outfit[1], step, o.armsUp);
  const hx = X - 9, hy = Y - 46; const E = (x, y) => { R(x, y, 6, 5, '#0c0c0c'); R(x + 1, y + 4, 4, 1, '#000'); R(x + 1, y + 1, 2, 2, '#ffffff'); }; // hollow mask eye hole + glint
  if (type === 'foxy') { R(hx, hy + 2, 18, 16, '#d81a1a'); R(hx - 14, hy + 9, 16, 6, '#d81a1a'); R(hx - 16, hy + 8, 4, 4, '#111'); for (let i = 0; i < 4; i++) R(hx - 12 + i * 4, hy + 15, 2, 2, '#f4f4f4'); R(hx - 12, hy + 15, 14, 1, '#7a0a0a');
    R(hx + 2, hy - 4, 5, 7, '#d81a1a'); R(hx + 11, hy - 4, 5, 7, '#d81a1a'); R(hx + 3, hy - 2, 3, 4, '#2a0a0a'); E(hx + 1, hy + 6); E(hx + 9, hy + 6); }
  if (type === 'bonnie') { R(hx, hy + 2, 18, 16, '#2a3ad8'); R(hx + 1, hy - 12, 5, 15, '#2a3ad8'); R(hx + 11, hy - 14, 5, 17, '#2a3ad8'); R(hx + 2, hy - 9, 2, 10, '#1a1a8a'); R(hx - 4, hy + 10, 6, 5, '#2a3ad8'); E(hx + 2, hy + 6); E(hx + 10, hy + 6); for (let i = 0; i < 3; i++) R(hx + 3 + i * 4, hy + 15, 2, 2, '#f4f4f4'); }
  if (type === 'chica') { R(hx, hy + 2, 18, 16, '#f0d02a'); R(hx - 6, hy + 10, 8, 5, '#e8781a'); R(hx - 6, hy + 15, 7, 2, '#c85a0a'); E(hx + 2, hy + 6); E(hx + 10, hy + 6); R(hx + 5, hy - 2, 3, 4, '#f0d02a'); R(hx + 9, hy - 3, 3, 5, '#f0d02a'); }
  if (type === 'freddy') { R(hx, hy + 2, 18, 16, '#6a4220'); R(hx - 4, hy + 10, 6, 6, '#8a5a30'); R(hx - 2, hy - 1, 5, 5, '#6a4220'); R(hx + 15, hy - 1, 5, 5, '#6a4220'); R(hx + 4, hy - 10, 10, 10, '#111'); R(hx + 1, hy - 1, 16, 2, '#111'); E(hx + 2, hy + 6); E(hx + 10, hy + 6); for (let i = 0; i < 3; i++) R(hx + 3 + i * 4, hy + 15, 2, 2, '#f4f4f4'); }
}
function cryingChild(X, Y, t, o = {}) { // standing, or held horizontally (o.lift = height above ground, o.flat)
  const H = '#5a3a1a', S = '#f4c8a0', K = '#111', T = '#5ab8ff';
  if (o.flat) { const y = Y; R(X - 14, y - 6, 8, 4, '#2a3a8a'); R(X - 6, y - 7, 12, 6, '#141414'); R(X - 18, y - 5, 4, 3, K); R(X + 6, y - 8, 9, 9, S); R(X + 6, y - 9, 9, 3, H); R(X + 14, y - 8, 2, 7, H); R(X + 8, y - 6, 2, 2, K); R(X + 8, y - 4, 1, 4, T); R(X - 4, y - 1, 3, 4, S); R(X + 2, y - 1, 3, 4, S); return; }
  R(X - 5, Y - 3, 4, 3, K); R(X + 1, Y - 3, 4, 3, K); R(X - 4, Y - 9, 3, 6, S); R(X + 1, Y - 9, 3, 6, S); R(X - 5, Y - 13, 10, 4, '#2a3a8a'); R(X - 6, Y - 22, 12, 9, '#141414'); R(X - 8, Y - 21, 2, 7, S); R(X + 6, Y - 21, 2, 7, S);
  R(X - 5, Y - 32, 10, 10, S); R(X - 6, Y - 34, 12, 4, H); R(X - 6, Y - 31, 2, 4, H); R(X + 4, Y - 31, 2, 4, H); R(X - 3, Y - 29, 2, 2, K); R(X + 1, Y - 29, 2, 2, K);
  const f = Math.floor(t * 8) % 2; R(X - 3, Y - 27, 1, 3 + f, T); R(X + 2, Y - 27, 1, 3 + (1 - f), T); R(X - 1, Y - 25, 2, 1, '#7a2a2a');
}

// ---------- overlay: rubber stamp "MADE IN 1983" ----------
function stamp(g, cx, cy, r, k, a) { g.save(); g.translate(cx, cy); g.rotate(-0.28); g.scale(k, k); g.globalAlpha = a; g.strokeStyle = '#121214'; g.fillStyle = '#121214';
  g.lineWidth = r * 0.07; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); g.lineWidth = r * 0.03; g.beginPath(); g.arc(0, 0, r * 0.84, 0, 7); g.stroke();
  g.font = `bold ${r * 0.24}px "DejaVu Sans", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MADE IN', 0, -r * 0.56); g.fillText('MADE IN', 0, r * 0.58);
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) g.fillText('★', sx * (r * 0.22 + i * r * 0.15), -r * 0.34 + i * 0.0);
  g.fillRect(-r * 1.05, -r * 0.24, r * 2.1, r * 0.48); g.fillStyle = '#e8e8e8'; g.fillRect(-r * 0.98, -r * 0.18, r * 1.96, r * 0.36); g.fillStyle = '#121214'; g.font = `bold ${r * 0.4}px "DejaVu Sans", sans-serif`; g.fillText('1983', 0, r * 0.02);
  g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 160; i++) { const x = (hsh(i, 9) - 0.5) * r * 2.2, y = (hsh(i, 8) - 0.5) * r * 2.2; g.fillRect(x, y, r * 0.03, r * 0.02); } g.restore(); }

// ---------- render ----------
export function renderBiteGame(spec, t, out, ow, oh, opts = {}) {
  G = wg; room(t, spec.dark);
  springbonnie(52, 172); fredbear(112, 172, { jaw: spec.jaw });
  const A = [];
  (spec.kids || []).forEach(k => A.push([k.y, () => maskKid(k.x, k.y, k.type, t, k)]));
  if (spec.child) { const c = spec.child; A.push([c.y + 0.5, () => cryingChild(c.x, c.y, t, c)]); }
  A.sort((a, b) => a[0] - b[0]).forEach(a => a[1]());
  if (spec.black) { G.fillStyle = `rgba(0,0,0,${spec.black})`; G.fillRect(0, 0, WW, WH); }
  const vw = opts.vw || 135, vh = opts.vh || 240; if (view.width !== vw || view.height !== vh) { view.width = vw; view.height = vh; vg.imageSmoothingEnabled = false; }
  const z = spec.z || 1; const sw = vw / z, sh = vh / z; let sx = (spec.cx ?? 120) - sw / 2, sy = (spec.cy ?? 120) - sh / 2; sx = Math.max(0, Math.min(WW - sw, sx)); sy = Math.max(0, Math.min(WH - sh, sy));
  vg.fillStyle = '#000'; vg.fillRect(0, 0, vw, vh); vg.drawImage(world, sx, sy, sw, sh, 0, 0, vw, vh);
  if (spec.glitch) { const fr = Math.floor(t * 30); for (let y = 0; y < vh; y += 2) if (hsh(y, fr) < 0.25 * spec.glitch) vg.drawImage(view, 0, y, vw, 2, Math.round((hsh(y, fr + 1) - 0.5) * 30 * spec.glitch), y, vw, 2); }
  if (spec.flash) { vg.fillStyle = `rgba(255,255,255,${spec.flash})`; vg.fillRect(0, 0, vw, vh); }
  const og = out.getContext('2d'); og.imageSmoothingEnabled = false; og.drawImage(view, 0, 0, vw, vh, 0, 0, ow, oh);
  if (spec.q) { const k = spec.q; og.save(); og.globalAlpha = k; og.font = `bold ${ow * 0.5}px "DejaVu Sans Mono", monospace`; og.textAlign = 'center'; og.textBaseline = 'middle'; og.lineWidth = ow * 0.02; og.strokeStyle = '#000'; og.strokeText('?', ow / 2, oh * 0.3); og.fillStyle = '#ff3a3a'; og.fillText('?', ow / 2, oh * 0.3); og.restore(); }
  if (spec.stamp) { const [k, a] = spec.stamp; stamp(og, ow * 0.5, oh * 0.3, ow * 0.3, k, a); }
  if (!opts.noCRT) { const p = oh / vh; og.fillStyle = 'rgba(0,0,0,0.34)'; for (let y = 0; y < vh; y++) og.fillRect(0, Math.round(y * p + p * 0.55), ow, Math.max(1, Math.round(p * 0.45)));
    const gr = og.createRadialGradient(ow / 2, oh / 2, oh * 0.28, ow / 2, oh / 2, oh * 0.66); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)'); og.fillStyle = gr; og.fillRect(0, 0, ow, oh); }
}
