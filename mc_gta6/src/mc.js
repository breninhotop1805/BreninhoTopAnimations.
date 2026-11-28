// Minecraft side: real 16x16 block textures (extracted from the user's renders), instanced block worlds,
// the 2009 "Classic" look, falling blocks with break particles. Everything here is MINECRAFT material.
import * as THREE from 'three';

export const TEX = {};
const loader = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
function nearest(img) { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; t.userData.canvas = c; return t; }
export async function loadTextures() {
  for (const n of ['grass_top', 'grass_side', 'dirt_side', 'stone_side', 'cobble_side', 'log_side', 'log_top', 'sand_side', 'planks_side', 'leaves', 'glass'])
    TEX[n] = nearest(await loader(`/textures/${n}.png`));
  // Classic (2009) look: flat lime grass, plain stone — recoloured from the real textures
  TEX.classic_top = recolor(TEX.grass_top, [0.62, 1.0, 0.45], 1.0); TEX.classic_side = classicSide(TEX.grass_side);
}
function recolor(t, mul, gain = 1) { const s = t.userData.canvas; const c = document.createElement('canvas'); c.width = s.width; c.height = s.height; const g = c.getContext('2d'); g.drawImage(s, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height); for (let i = 0; i < d.data.length; i += 4) { const l = (d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3; const f = 0.55 + 0.45 * l / 140;
    d.data[i] = Math.min(255, 110 * f * mul[0] * gain); d.data[i + 1] = Math.min(255, 150 * f * mul[1] * gain); d.data[i + 2] = Math.min(255, 70 * f * mul[2] * gain); }
  g.putImageData(d, 0, 0); return nearest(c); }
function classicSide(t) { const s = t.userData.canvas; const c = document.createElement('canvas'); c.width = s.width; c.height = s.height; const g = c.getContext('2d'); g.drawImage(s, 0, 0);
  const d = g.getImageData(0, 0, c.width, 4); for (let i = 0; i < d.data.length; i += 4) { d.data[i] = 84; d.data[i + 1] = 150; d.data[i + 2] = 42; } g.putImageData(d, 0, 0); return nearest(c); }

const MATS = {};
function mat(key, opts = {}) { if (MATS[key]) return MATS[key]; const m = new THREE.MeshStandardMaterial({ map: TEX[key], roughness: 0.92, metalness: 0, ...opts }); MATS[key] = m; return m; }
// face order for BoxGeometry: +x, -x, +y, -y, +z, -z
export function blockMats(type) {
  switch (type) {
    case 'grass': { const s = mat('grass_side'), t = mat('grass_top'), b = mat('dirt_side'); return [s, s, t, b, s, s]; }
    case 'classic': { const s = mat('classic_side'), t = mat('classic_top'), b = mat('dirt_side'); return [s, s, t, b, s, s]; }
    case 'log': { const s = mat('log_side'), t = mat('log_top'); return [s, s, t, t, s, s]; }
    case 'leaves': { const m = MATS.leavesM || (MATS.leavesM = new THREE.MeshStandardMaterial({ map: TEX.leaves, transparent: true, alphaTest: 0.5, roughness: 0.9, side: THREE.DoubleSide })); return m; }
    case 'glass': { const m = MATS.glassM || (MATS.glassM = new THREE.MeshStandardMaterial({ map: TEX.glass, transparent: true, roughness: 0.1, depthWrite: false })); return m; }
    default: return mat(type + '_side');
  }
}
// a single block (e.g. the "Minecraft" block the story is about)
export function block(type = 'grass', size = 1) { const m = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), blockMats(type)); m.castShadow = m.receiveShadow = true; return m; }

// instanced world from a list of [x,y,z,type]
export function buildWorld(cells, group) {
  const by = {}; for (const c of cells) (by[c[3]] = by[c[3]] || []).push(c);
  const geo = new THREE.BoxGeometry(1, 1, 1); const m4 = new THREE.Matrix4();
  for (const [type, list] of Object.entries(by)) { const im = new THREE.InstancedMesh(geo, blockMats(type), list.length);
    list.forEach((c, i) => { m4.makeTranslation(c[0] + 0.5, c[1] + 0.5, c[2] + 0.5); im.setMatrixAt(i, m4); }); im.castShadow = type !== 'glass'; im.receiveShadow = true; group.add(im); }
  return group; }

function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function noise2(seed) { const r = rng(seed); const g = []; for (let i = 0; i < 64 * 64; i++) g.push(r()); const v = (x, y) => g[((y & 63) * 64 + (x & 63))];
  return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi; const s = t => t * t * (3 - 2 * t);
    const a = v(xi, yi), b = v(xi + 1, yi), c = v(xi, yi + 1), d = v(xi + 1, yi + 1); return a + (b - a) * s(fx) + (c - a) * s(fy) + (a - b - c + d) * s(fx) * s(fy); }; }

// MODERN Minecraft world: hills, oak trees, sand beach, water
export function modernWorld(S) {
  const s = new THREE.Scene(); s.background = new THREE.Color('#79a6ff'); s.fog = new THREE.Fog('#a8c8ff', 26, 70); const g = new THREE.Group(); s.add(g);
  const n = noise2(7); const cells = []; const R = 34; const wl = 3; const r = rng(3);
  for (let x = -R; x < R; x++) for (let z = -R; z < 10; z++) { const h = Math.round(3 + 4 * n(x * 0.09, z * 0.09) + 3 * n(x * 0.03 + 9, z * 0.03) - (z > 4 ? (z - 4) * 0.8 : 0));
    for (let y = Math.max(0, h - 3); y <= h; y++) cells.push([x, y, z, y === h ? (h <= wl ? 'sand' : 'grass') : (y < h - 2 ? 'stone' : 'dirt')]);
    if (h < wl) for (let y = h + 1; y <= wl; y++) cells.push([x, y, z, 'water']);
    if (h > wl + 1 && r() < 0.025 && Math.abs(x) > 3) tree(cells, x, h + 1, z, r); }
  const water = cells.filter(c => c[3] === 'water'); const solid = cells.filter(c => c[3] !== 'water'); buildWorld(solid, g);
  const wm = new THREE.MeshStandardMaterial({ color: '#2f5fe8', transparent: true, opacity: 0.78, roughness: 0.15, metalness: 0.1 }); const wg = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.88, 1), wm, water.length); const m4 = new THREE.Matrix4();
  water.forEach((c, i) => { m4.makeTranslation(c[0] + 0.5, c[1] + 0.44, c[2] + 0.5); wg.setMatrixAt(i, m4); }); g.add(wg);
  const sun = new THREE.DirectionalLight('#fff4e0', 2.6); sun.position.set(20, 30, 14); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, far: 90 }); s.add(sun);
  s.add(new THREE.HemisphereLight('#bcd6ff', '#5a7a3a', 1.1)); clouds(g, 26, '#ffffff', 0.9);
  S.mcHeight = (x, z) => { let top = 0; for (const c of solid) if (c[0] === Math.floor(x) && c[2] === Math.floor(z) && c[1] + 1 > top) top = c[1] + 1; return top; };
  S.mc = s; return s; }
function tree(cells, x, y, z, r) { const h = 4 + Math.floor(r() * 2); for (let i = 0; i < h; i++) cells.push([x, y + i, z, 'log']);
  for (let dy = h - 2; dy <= h + 1; dy++) { const rad = dy >= h ? 1 : 2; for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) { if (Math.abs(dx) === rad && Math.abs(dz) === rad && r() < 0.6) continue; if (dx === 0 && dz === 0 && dy < h) continue; cells.push([x + dx, y + dy, z + dz, 'leaves']); } } }
function clouds(g, y, col, op) { const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, fog: false }); const r = rng(11);
  for (let i = 0; i < 26; i++) { const w = 6 + r() * 12, d = 4 + r() * 8; const c = new THREE.Mesh(new THREE.BoxGeometry(w, 1.2, d), m); c.position.set((r() - 0.5) * 140, y + r() * 4, -20 - r() * 90); g.add(c); } }

// CLASSIC 2009 world: flat lime grass, cliffs with dirt, stone, strong blue water, white flat clouds, pale sky
export function classicWorld(S) {
  const s = new THREE.Scene(); s.background = new THREE.Color('#9cc8ff'); s.fog = new THREE.Fog('#d8e8ff', 30, 80); const g = new THREE.Group(); s.add(g);
  const n = noise2(23); const cells = []; const R = 30;
  for (let x = -R; x < R; x++) for (let z = -R; z < 8; z++) { const h = Math.round(2 + 3 * n(x * 0.08, z * 0.08) + (n(x * 0.2, z * 0.2) > 0.7 ? 2 : 0));
    for (let y = Math.max(0, h - 3); y <= h; y++) cells.push([x, y, z, y === h ? (h <= 2 ? 'sand' : 'classic') : (y < h - 1 ? 'stone' : 'dirt')]);
    if (h < 2) for (let y = h + 1; y <= 2; y++) cells.push([x, y, z, 'water']); }
  // a few exposed stone outcrops (the "pedra" of the script)
  for (const [x, z] of [[-3, -4], [-2, -4], [-3, -5], [4, -6], [5, -6]]) for (let y = 0; y < 6; y++) cells.push([x, y, z, 'stone']);
  const water = cells.filter(c => c[3] === 'water'); buildWorld(cells.filter(c => c[3] !== 'water'), g);
  const wm = new THREE.MeshStandardMaterial({ color: '#1f3fd8', roughness: 0.4 }); const wg = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.9, 1), wm, water.length); const m4 = new THREE.Matrix4();
  water.forEach((c, i) => { m4.makeTranslation(c[0] + 0.5, c[1] + 0.45, c[2] + 0.5); wg.setMatrixAt(i, m4); }); g.add(wg);
  const sun = new THREE.DirectionalLight('#ffffff', 2.0); sun.position.set(10, 30, 20); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25 }); s.add(sun);
  s.add(new THREE.HemisphereLight('#ffffff', '#6a8a4a', 1.3)); clouds(g, 20, '#ffffff', 1);
  S.classic = s; S.classicCells = cells; return s; }

// falling-block field (instanced, deterministic): N blocks raining onto an area, settling in stacked rows
export function blockRain(n, size, area, seed = 5) { const r = rng(seed); const im = new THREE.InstancedMesh(new THREE.BoxGeometry(size, size, size), blockMats('grass'), n); im.castShadow = true; im.receiveShadow = true;
  const P = []; const cols = Math.ceil(Math.sqrt(n * area[0] / area[1])), rows = Math.ceil(n / cols);
  for (let i = 0; i < n; i++) { const cx = i % cols, cz = Math.floor(i / cols) % rows, layer = Math.floor(i / (cols * rows));
    P.push({ x: area[2] + (cx + 0.5) / cols * area[0] + (r() - 0.5) * size * 0.2, z: area[3] + (cz + 0.5) / rows * area[1] + (r() - 0.5) * size * 0.2, y: size / 2 + layer * size, delay: r(), spin: r() * 6, h0: 6 + r() * 10 }); }
  im.userData.P = P; im.userData.size = size; return im; }
// k = 0..1 progress of the rain; blocks drop in with a little bounce
export function updateRain(im, k, spread = 0.75) { const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
  let shown = 0; im.userData.P.forEach((b, i) => { const t0 = b.delay * spread; const u = Math.max(0, Math.min(1, (k - t0) / (1 - spread))); if (u <= 0) { s.setScalar(0.0001); p.set(b.x, -50, b.z); }
    else { shown++; const fall = Math.min(1, u * 1.25); const yy = b.y + b.h0 * (1 - fall) * (1 - fall); const bounce = u > 0.8 ? Math.sin((u - 0.8) / 0.2 * Math.PI) * 0.08 * im.userData.size : 0;
      p.set(b.x, yy + bounce, b.z); e.set(b.spin * (1 - fall), b.spin * 0.7 * (1 - fall), 0); s.setScalar(1); }
    q.setFromEuler(e); m4.compose(p, q, s); im.setMatrixAt(i, m4); }); im.instanceMatrix.needsUpdate = true; return shown; }

// break / land particles (small textured cubes)
export function particles(n = 24) { const g = new THREE.Group(); const r = rng(9); const m = blockMats('dirt');
  for (let i = 0; i < n; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), Array.isArray(m) ? m[0] : m); p.userData.v = new THREE.Vector3((r() - 0.5) * 3, 1 + r() * 2.5, (r() - 0.5) * 3); g.add(p); }
  g.userData.update = (k, origin) => { g.position.copy(origin); g.children.forEach(p => { const t = k * 0.9; const v = p.userData.v; p.position.set(v.x * t, v.y * t - 4.9 * t * t, v.z * t); p.visible = k > 0 && k < 0.9 && p.position.y > -0.2; p.rotation.set(t * 8, t * 6, 0); }); };
  return g; }
