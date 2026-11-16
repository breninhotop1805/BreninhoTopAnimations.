// Texturas 16x16 estilo Minecraft, geradas pixel a pixel (procedurais, determinísticas)
import * as THREE from 'three';

export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const hex = h => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

function tile(fn, seed) {
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const g = c.getContext('2d'); const img = g.createImageData(16, 16); const R = rng(seed);
  const set = (x, y, col, a = 255) => { x = (x + 16) % 16; y = (y + 16) % 16; const i = (y * 16 + x) * 4; img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = a; };
  const get = (x, y) => { x = (x + 16) % 16; y = (y + 16) % 16; const i = (y * 16 + x) * 4; return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]]; };
  fn({ set, get, R });
  g.putImageData(img, 0, 0); return c;
}
const pick = (R, pal) => hex(pal[Math.floor(R() * pal.length)]);
function speckle(pal, weights) {
  return ({ set, R }) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { let r = R(), i = 0; while (i < weights.length - 1 && r > weights[i]) { r -= weights[i]; i++; } set(x, y, hex(pal[i])); } };
}

const T = {};
T.stone = tile(({ set, R }) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) set(x, y, hex(0x838383 + (R() < .5 ? 0x050505 : 0)));
  for (let k = 0; k < 22; k++) { const x = R() * 16 | 0, y = R() * 16 | 0, c = hex([0x686868, 0x8f8f8f, 0x747474, 0x999999][R() * 4 | 0]); set(x, y, c); if (R() < .6) set(x + 1, y, c); }
}, 11);
T.dirt = tile(speckle([0x866043, 0x79553a, 0x966c4a, 0x5d4128, 0xb9855c], [.42, .3, .15, .09, .04]), 12);
T.grass_top = tile(({ set, R }) => { const p = [0x6aa84f, 0x5e9a45, 0x7cb85c, 0x548c3d, 0x87c565]; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) set(x, y, pick(R, p)); }, 13);
T.grass_side = tile(({ set, get, R }) => {
  const d = [0x866043, 0x79553a, 0x966c4a, 0x5d4128, 0xb9855c];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) set(x, y, pick(R, [0x866043, 0x866043, 0x79553a, 0x966c4a, 0x5d4128]));
  const g = [0x6aa84f, 0x5e9a45, 0x7cb85c, 0x548c3d];
  for (let x = 0; x < 16; x++) { const h = 3 + (R() < .5 ? 1 : 0) + (R() < .25 ? 1 : 0); for (let y = 0; y < h; y++) set(x, y, pick(R, g)); }
}, 14);
T.cobblestone = tile(({ set, R }) => {
  const pts = []; for (let i = 0; i < 9; i++) pts.push([R() * 16, R() * 16, [0x8a8a8a, 0x7a7a7a, 0x9c9c9c, 0x6e6e6e][i % 4]]);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let d1 = 1e9, d2 = 1e9, c = 0;
    for (const [px, py, col] of pts) for (const ox of [-16, 0, 16]) for (const oy of [-16, 0, 16]) { const d = Math.hypot(x - px - ox, y - py - oy); if (d < d1) { d2 = d1; d1 = d; c = col; } else if (d < d2) d2 = d; }
    let col = hex(c); if (d2 - d1 < 1.1) col = hex(0x4f4f4f); else if (d2 - d1 < 2) col = mix(col, [70, 70, 70], .35); else if (R() < .15) col = mix(col, [180, 180, 180], .3);
    set(x, y, col);
  }
}, 15);
T.deepslate = tile(({ set, R }) => {
  for (let y = 0; y < 16; y++) { const b = R() < .3 ? -8 : 0; for (let x = 0; x < 16; x++) { const v = 0x4a + b + (R() * 10 | 0) - (y % 4 === 0 && R() < .5 ? 12 : 0); set(x, y, [v, v, v + 4]); } }
}, 16);
T.deepslate_top = tile(({ set, R }) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const v = 0x46 + (R() * 14 | 0); set(x, y, [v, v, v + 4]); } }, 17);
T.oak_planks = tile(({ set, R }) => {
  const seams = [3, 11, 7, 1];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const row = y >> 2; let c = hex([0xa2834f, 0x9c7d4b, 0xaf8f55, 0xb8945f][R() * 4 | 0]);
    if (y % 4 === 3) c = hex(0x6b5432); else if (x === seams[row]) c = hex(0x7a6038); else if (y % 4 === 0 && R() < .5) c = hex(0xbc9862);
    set(x, y, c);
  }
}, 18);
T.spruce_planks = tile(({ set, R }) => {
  const seams = [5, 13, 2, 9];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const row = y >> 2; let c = hex([0x725430, 0x6a4e2c, 0x7a5a34][R() * 3 | 0]);
    if (y % 4 === 3) c = hex(0x4a361d); else if (x === seams[row]) c = hex(0x56401f);
    set(x, y, c);
  }
}, 19);
T.oak_log = tile(({ set, R }) => { for (let x = 0; x < 16; x++) { const base = [0x6b5133, 0x5c452b, 0x775a38, 0x4c3a24][(x + (R() * 2 | 0)) % 4]; for (let y = 0; y < 16; y++) set(x, y, R() < .12 ? hex(0x3f2f1d) : hex(base)); } }, 20);
T.oak_log_top = tile(({ set }) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)); set(x, y, d > 6.6 ? hex(0x6b5133) : hex([0xb8945f, 0x9c7d4b][Math.floor(d) % 2])); } }, 21);
T.oak_leaves = tile(({ set, R }) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const r = R(); if (r < .2) set(x, y, [0, 0, 0], 0); else set(x, y, pick(R, [0x3f7a2a, 0x4c8f32, 0x356b23, 0x5aa03c, 0x2c5c1d])); } }, 22);
T.stone_bricks = tile(({ set, R }) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let c = hex([0x8a8a8a, 0x939393, 0x858585, 0x9a9a9a][R() * 4 | 0]);
    const row = y >> 3, off = row ? 4 : 0, xx = (x + off) % 16;
    if (y % 8 === 7 || xx % 8 === 7) c = hex(0x5a5a5a); else if (y % 8 === 0 || xx % 8 === 0) c = mix(c, [160, 160, 160], .3);
    else if (y % 8 === 6 || xx % 8 === 6) c = mix(c, [90, 90, 90], .3);
    set(x, y, c);
  }
}, 23);
T.gold_block = tile(({ set, R }) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let c = hex([0xf5d93b, 0xfadd4b, 0xedcb2f][R() * 3 | 0]);
    if (x === 0 || y === 0) c = hex(0xfffac2); else if (x === 15 || y === 15) c = hex(0xc28c18); else if (x === 1 || y === 1) c = hex(0xfdf07a); else if (x === 14 || y === 14) c = hex(0xdba92a);
    set(x, y, c);
  }
}, 24);
function ore(cols, seed) {
  return tile(({ set, R, get }) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) set(x, y, mix(hex(0x7d7d7d), [100, 100, 100], R() * .3));
    for (let k = 0; k < 4; k++) { const cx = 2 + R() * 11 | 0, cy = 2 + R() * 11 | 0; for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [-1, 1]]) if (R() < .8) set(cx + dx, cy + dy, hex(cols[R() * cols.length | 0])); }
  }, seed);
}
T.diamond_ore = ore([0x5decf5, 0x2ac2c9, 0xa1fbe8], 25);
T.iron_ore = ore([0xd8af93, 0xaf8e77, 0xe2c0a5], 26);
T.coal_ore = ore([0x2b2b2b, 0x3c3c3c, 0x1a1a1a], 27);
T.gold_ore = ore([0xfcee4b, 0xd9a334, 0xfffaa0], 28);
T.gravel = tile(speckle([0x837f7e, 0x6c6868, 0x9e9a99, 0x5a5656, 0xb3afae], [.3, .25, .2, .15, .1]), 29);
T.sand = tile(speckle([0xdbd3a0, 0xd5c98f, 0xe5dcae, 0xc9bd84], [.4, .3, .2, .1]), 30);
T.water = tile(({ set, R }) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) set(x, y, pick(R, [0x2f5bd6, 0x3463df, 0x2a52c4, 0x3c6ce6]), 190); }, 31);
T.lava = tile(({ set, R }) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const v = Math.sin(x * .7 + Math.sin(y * .5) * 2) + Math.sin(y * .6) * .7 + R() * .6; set(x, y, v > .8 ? hex(0xffe066) : v > 0 ? hex(0xff9a1f) : hex(0xd8571a)); } }, 32);
T.obsidian = tile(({ set, R }) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const r = R(); set(x, y, r < .08 ? hex(0x3b2754) : r < .2 ? hex(0x1e1530) : hex(0x0f0b18)); } }, 33);
T.end_stone = tile(({ set, R }) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const r = R(); set(x, y, r < .1 ? hex(0xbfc27d) : r < .2 ? hex(0xeef1b6) : hex(0xdbde9e)); } }, 34);
T.bedrock = tile(speckle([0x565656, 0x353535, 0x7a7a7a, 0x222222], [.35, .3, .2, .15]), 35);
T.cobweb = tile(({ set }) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) set(x, y, [0, 0, 0], 0);
  const w = [232, 232, 236];
  for (let i = 1; i < 15; i++) { if (i % 3) { set(i, i, w, 220); set(15 - i, i, w, 220); } if (i % 4) { set(7, i, w, 200); set(i, 8, w, 200); } }
  for (const [r, a0] of [[3, 0], [6, 0.3]]) for (let a = 0; a < 8; a++) { const t1 = (a + a0) / 8 * Math.PI * 2, t2 = (a + 1 + a0) / 8 * Math.PI * 2; for (let k = 0; k <= 4; k++) { const t = t1 + (t2 - t1) * k / 4; const rr = r - Math.sin(k / 4 * Math.PI) * 0.8; set(Math.round(7.5 + Math.cos(t) * rr), Math.round(7.5 + Math.sin(t) * rr), w, 230); } }
}, 36);
T.glass = tile(({ set }) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const edge = x === 0 || y === 0 || x === 15 || y === 15; const streak = (x - y === 3 || x - y === 4 || x - y === -6) && x > 2 && x < 13; set(x, y, edge ? [220, 240, 245] : [255, 255, 255], edge ? 255 : streak ? 140 : 0); } }, 37);
T.sculk = tile(({ set, R }) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const r = R(); set(x, y, r < .06 ? hex(0x2fd6d0) : r < .3 ? hex(0x0b2a35) : hex(0x07161e)); } }, 38);
T.red_wool = tile(speckle([0xa12722, 0x8f221d, 0xb02e28], [.5, .25, .25]), 39);
T.dark_oak_log = tile(({ set, R }) => { for (let x = 0; x < 16; x++) { const base = [0x3e2912, 0x34230f, 0x48311a][(x + (R() * 2 | 0)) % 3]; for (let y = 0; y < 16; y++) set(x, y, hex(base)); } }, 40);
T.glowstone = tile(speckle([0xffd27a, 0xc99a4a, 0xfff0b0, 0x8a6a35], [.35, .3, .2, .15]), 41);
T.chest_side = tile(({ set, R }) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { let c = hex([0xa0712d, 0x956826][R() * 2 | 0]); if (x === 0 || x === 15 || y === 0 || y === 15) c = hex(0x523813); if (y === 5 || y === 6) c = hex(0x523813); set(x, y, c); } set(7, 6, [200, 200, 200]); set(8, 6, [200, 200, 200]); set(7, 7, [140, 140, 140]); set(8, 7, [140, 140, 140]); }, 42);
T.black = tile(({ set }) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) set(x, y, [8, 8, 10]); }, 43);
T.netherrack = tile(speckle([0x6f3534, 0x5c2a2a, 0x833f3e, 0x4a2020], [.35, .3, .2, .15]), 44);
T.mossy = tile(({ set, R }) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) set(x, y, R() < .4 ? pick(R, [0x5a7a3a, 0x4a6a2e]) : pick(R, [0x7a7a7a, 0x6a6a6a, 0x8a8a8a])); }, 45);
T.rail = tile(({ set }) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) set(x, y, [0, 0, 0], 0); for (let y = 0; y < 16; y++) { set(2, y, [120, 120, 120]); set(13, y, [120, 120, 120]); } for (const y of [1, 5, 9, 13]) for (let x = 1; x < 15; x++) set(x, y, [110, 80, 45]); for (let y = 0; y < 16; y++) { set(2, y, [150, 150, 150]); set(13, y, [150, 150, 150]); } }, 46);

// --- Atlas ---------------------------------------------------------------
export const NAMES = Object.keys(T);
const COLS = 8;
export const ATLAS_SIZE = COLS * 16;
const atlasCanvas = document.createElement('canvas');
atlasCanvas.width = atlasCanvas.height = ATLAS_SIZE;
const ag = atlasCanvas.getContext('2d');
export const TILE = {};
NAMES.forEach((n, i) => { const x = (i % COLS) * 16, y = Math.floor(i / COLS) * 16; ag.drawImage(T[n], x, y); TILE[n] = [x, y]; });
export function nearestTex(canvas) {
  const t = new THREE.CanvasTexture(canvas); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; return t;
}
export const atlasTex = nearestTex(atlasCanvas);
export const tileCanvas = T;
