// FNAF 4 Nightmares built on the user's Minecraft skins, with everything that sticks out in 3D:
// snouts, big mouths full of teeth (upper row + a hinged lower jaw), ears, hook, beak, glowing eyes.
// Skin clean-up: the teeth those skins paint on the NECK (top of the torso) and around the bottom of the head are
// painted over with the neighbouring fur, and the flat 2D ears/snouts on the hat layer are erased -> no 2D leftovers.
import * as THREE from 'three';
import { Character, U, imgCopy, voxelArt, extrudePixels } from './skin.js';

const MC = new Map();
const mat = (c, o = {}) => { const k = c + JSON.stringify(o); if (!MC.has(k)) MC.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? 0.75, metalness: o.metal ?? 0, emissive: o.em || '#000', emissiveIntensity: o.ei || 0 })); return MC.get(k); };
export const bx = (w, h, d, c, x, y, z, p, o = {}) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w * U, h * U, d * U), mat(c, o)); m.position.set(x * U, y * U, z * U); m.castShadow = m.receiveShadow = true; p.add(m); return m; };
// sharp tooth (4-sided pyramid), tip down (dir -1) or up (dir 1)
function tooth(p, x, y, z, h, dir, col = '#e9e2c8', w = 0.55) { const m = new THREE.Mesh(new THREE.ConeGeometry(w * U, h * U, 4), mat(col, { rough: 0.35 })); m.rotation.y = Math.PI / 4; if (dir < 0) m.rotation.x = Math.PI; m.position.set(x * U, (y + dir * h / 2) * U, z * U); m.castShadow = true; p.add(m); return m; }
// a U-shaped row of teeth along the front and both sides of a mouth edge
function teethRow(p, w, d, y, z0, dir, n = 7, ns = 4, h = 1.1, col) { for (let i = 0; i < n; i++) tooth(p, -w / 2 + 0.4 + i * (w - 0.8) / (n - 1), y, z0 + d - 0.35, h * (0.8 + 0.4 * ((i * 7) % 3) / 2), dir, col);
  for (const sx of [-1, 1]) for (let i = 0; i < ns; i++) tooth(p, sx * (w / 2 - 0.35), y, z0 + 0.6 + i * (d - 1.3) / Math.max(1, ns - 1), h * (0.7 + 0.3 * (i % 2)), dir, col); }

// ---------- skin clean-up ----------
function copyRows(A, x0, x1, y0, y1, fromY) { const s = A.width / 64, g = A.getContext('2d'); const src = g.getImageData(x0 * s, Math.floor(fromY * s), (x1 - x0) * s, 1);
  for (let y = Math.round(y0 * s); y < Math.round(y1 * s); y++) { const row = g.getImageData(x0 * s, y, (x1 - x0) * s, 1); for (let i = 0; i < row.data.length; i += 4) if (src.data[i + 3] > 128) row.data.set(src.data.slice(i, i + 4), i); g.putImageData(row, x0 * s, y); } }
function erase(A, x, y, w, h) { const s = A.width / 64; A.getContext('2d').clearRect(x * s, y * s, w * s, h * s); }
function fillAvg(A, x, y, w, h, fx, fy) { const s = A.width / 64, g = A.getContext('2d'); const d = g.getImageData(fx * s, fy * s, 1, 1).data; g.fillStyle = `rgb(${d[0]},${d[1]},${d[2]})`; g.fillRect(x * s, y * s, w * s, h * s); }
export function cleanSkin(src, o) { const A = imgCopy(src);
  if (o.headRows) copyRows(A, 0, 32, o.headRows[0], o.headRows[1], o.headRows[0] - 0.01 - (o.headFrom || 0));          // teeth around the head bottom
  if (o.neckRows) { copyRows(A, 16, 40, o.neckRows[0], o.neckRows[1], o.neckRows[1] + 0.2); fillAvg(A, 20, 16, 8, 4, 24, 26); } // teeth painted on the neck
  erase(A, 32, 0, 32, 16); erase(A, 16, 32, 24, 16);                                                                // flat hat-layer ears/snout + jaw outline
  return A; }

// glowing eyes: the painted eye pixels extruded a hair in front of the face with an emissive material
function eyeGlow(ch, A, filter, color, ei = 2.2) { const s = A.width / 64; const g = A.getContext('2d'); const d = g.getImageData(8 * s, 8 * s, 8 * s, 8 * s);
  const c = document.createElement('canvas'); c.width = c.height = 8 * s; const cg = c.getContext('2d'); const od = cg.createImageData(8 * s, 8 * s);
  for (let i = 0; i < d.data.length; i += 4) if (d.data[i + 3] > 128 && filter(d.data[i], d.data[i + 1], d.data[i + 2])) od.data.set([d.data[i], d.data[i + 1], d.data[i + 2], 255], i); cg.putImageData(od, 0, 0);
  const m = extrudePixels(c, 0, 0, c.width, c.height, U / s, 0.12 * U); m.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: ei, roughness: 0.4 }); o.castShadow = false; } });
  m.position.set(0, 4 * U, 4 * U + 0.07 * U); ch.head.add(m); ch.eyeMesh = m; ch.eyeMat = m.material || m.children?.[0]?.material; return m; }

// hinged lower jaw: pivot near the back of the mouth; open(k) 0..1
function addJaw(ch, o) { const jaw = new THREE.Group(); jaw.position.set(0, o.y * U, o.z0 * U); ch.head.add(jaw); ch.jaw = jaw;
  bx(o.w, o.h, o.d, o.col, 0, -o.h / 2, o.d / 2, jaw); bx(o.w - 0.6, 0.25, o.d - 0.6, '#1a0606', 0, 0.14, o.d / 2, jaw); if (o.under) bx(o.w - 1, o.h * 0.5, o.d - 1, o.under, 0, -o.h + 0.05, o.d / 2 + 0.2, jaw);
  teethRow(jaw, o.w, o.d, 0.05, 0, 1, o.n || 6, o.ns || 3, o.th || 1.0, o.tcol);
  ch.jawOpen = k => { jaw.rotation.x = (o.min ?? 0.12) + k * (o.max ?? 0.7); }; return jaw; }

const finish = ch => { ch.root.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); const r0 = ch.reset.bind(ch); ch.reset = () => { r0(); if (ch.jawOpen) ch.jawOpen(0); if (ch.hookPiv) ch.hookPiv.rotation.set(0, 0, 0); }; ch.reset(); return ch; };

// ===================== NIGHTMARE FOXY =====================
export function buildNFoxy(src, name = 'nfoxy') {
  const A = cleanSkin(src, { headRows: [14, 16], neckRows: [19.5, 22] });
  const ch = new Character(name, A); const H = ch.head; const red = '#7e0a08', redD = '#560504', redL = '#9a1c14', beige = '#c97a55', endo = '#3a3a40', black = '#120c0c';
  // long snout: red top, beige under-side, black nose, upper teeth all around (no overlapping/coplanar faces -> no z-fighting)
  const sn = new THREE.Group(); sn.position.set(0, 1.4 * U, 3.6 * U); H.add(sn); ch.snout = sn;
  bx(4.4, 1.58, 4.6, red, 0, 1.41, 2.3, sn); bx(3.8, 0.9, 4.45, beige, 0, 0.16, 2.33, sn); bx(4.6, 0.5, 1.2, redD, 0, 2.3, 0.7, sn); bx(1.6, 1.0, 0.8, black, 0, 1.9, 4.6, sn, { rough: 0.3 });
  bx(4.0, 0.3, 4.0, '#160404', 0, -0.42, 2.5, sn); teethRow(sn, 4.4, 4.6, -0.3, 0, -1, 8, 5, 1.25);
  // big hinged jaw, hangs open (Nightmare Foxy's mouth is huge)
  addJaw(ch, { y: 1.2, z0: 2.6, w: 4.0, h: 1.2, d: 5.4, col: beige, under: redD, n: 8, ns: 5, th: 1.2, min: 0.18, max: 0.75 });
  // ragged ears with endo rods, shifted up by half their height so they sit ON the head
  const P = { r: red, d: redD, l: redL, e: endo, b: black };
  const earA = () => voxelArt(['..r..', '.rr..', '.rrd.', 'rrldr', 'rlldr', 'rll.r', 'rdldr', 'rrbdr', '.e.e.', '.e.e.'], P, 0.55 * U, 1.0 * U);
  for (const sx of [-1, 1]) { const p = new THREE.Group(); p.position.set(sx * 2.4 * U, 8.0 * U, -0.8 * U); const e = earA(); e.position.y = 2.75 * U; p.add(e); p.rotation.z = -sx * 0.22; H.add(p); }
  // little wires on top of the head (as in the game model)
  for (const [x, z, h, r] of [[-0.6, 0.6, 1.6, -0.3], [0.7, -0.2, 1.3, 0.35]]) { const w = bx(0.22, h, 0.22, '#2a2a2a', x, 8 + h / 2, z, H); w.rotation.z = r; }
  eyeGlow(ch, A, (r, g, b) => r > 200 && g > 70 && g < 170 && b < 60, '#ff8a1a', 2.4);
  // the hook replaces his right hand
  const hp = new THREE.Group(); hp.position.set(0, -10 * U, 0); ch.armR.piv.add(hp); ch.hookPiv = hp; const steel = '#9aa0a8';
  bx(2.4, 1.0, 2.4, endo, 0, -0.5, 0, hp, { metal: 0.6, rough: 0.4 }); bx(0.7, 3.0, 0.7, steel, 0, -2.4, 0, hp, { metal: 0.85, rough: 0.25 });
  const hk = new THREE.Mesh(new THREE.TorusGeometry(1.25 * U, 0.33 * U, 8, 20, Math.PI * 1.25), new THREE.MeshStandardMaterial({ color: steel, metalness: 0.9, roughness: 0.22 })); hk.position.set(0, -5.0 * U, 1.2 * U); hk.rotation.set(0, Math.PI / 2, Math.PI * 1.0); hp.add(hk);
  // the painted grey right hand would sit under the hook: hide it by shrinking the hand rows? keep arm, hook starts below it
  return finish(ch); }

// ===================== NIGHTMARE FREDDY =====================
export function buildNFreddy(src) {
  const A = cleanSkin(src, { headRows: [14, 16], neckRows: [19.5, 22] }); const ch = new Character('nfreddy', A); const H = ch.head;
  const fur = '#3a200e', furD = '#22120a', tan = '#6a4418', endo = '#3a3a40';
  const sn = new THREE.Group(); sn.position.set(0, 1.3 * U, 3.6 * U); H.add(sn); ch.snout = sn;
  bx(5.4, 2.0, 2.6, tan, 0, 1.0, 1.3, sn); bx(1.8, 0.9, 0.7, '#0e0808', 0, 1.7, 2.75, sn, { rough: 0.3 }); bx(5.0, 0.3, 2.4, '#140606', 0, -0.2, 1.3, sn); teethRow(sn, 5.4, 2.6, -0.15, 0, -1, 8, 2, 1.15);
  addJaw(ch, { y: 1.15, z0: 2.6, w: 5.2, h: 1.3, d: 3.6, col: tan, under: fur, n: 8, ns: 3, th: 1.1, min: 0.15, max: 0.6 });
  const P = { o: fur, d: furD, l: tan, e: endo };
  const ear = () => voxelArt(['.oooo.', 'oddddo', 'odlldo', 'odlldo', 'oooooo', '..ee..'], P, 0.55 * U, 1.2 * U);
  for (const sx of [-1, 1]) { const e = ear(); e.position.set(sx * 3.2 * U, (8 + 1.6) * U, -0.6 * U); e.rotation.z = -sx * 0.22; H.add(e); }
  eyeGlow(ch, A, (r, g, b) => r > 110 && g < 90 && b < 50 && r - g > 50, '#ff7a20', 2.2);
  return finish(ch); }

// ===================== NIGHTMARE BONNIE =====================
export function buildNBonnie(src) {
  const A = cleanSkin(src, { headRows: [14, 16], neckRows: [19.5, 22] }); const ch = new Character('nbonnie', A); const H = ch.head;
  const fur = '#2a3656', furD = '#1a2238', furL = '#3c4c78', pink = '#b88aa6', endo = '#3a3a40';
  const sn = new THREE.Group(); sn.position.set(0, 1.3 * U, 3.6 * U); H.add(sn); ch.snout = sn;
  bx(5.6, 1.9, 2.4, furL, 0, 0.95, 1.2, sn); bx(1.6, 0.8, 0.6, '#c06a9a', 0, 1.6, 2.6, sn, { rough: 0.4 }); bx(5.2, 0.3, 2.2, '#140608', 0, -0.2, 1.2, sn); teethRow(sn, 5.6, 2.4, -0.15, 0, -1, 9, 2, 1.25);
  addJaw(ch, { y: 1.15, z0: 2.6, w: 5.4, h: 1.2, d: 3.5, col: furL, under: furD, n: 9, ns: 3, th: 1.15, min: 0.15, max: 0.6 });
  const P = { b: fur, d: furD, l: furL, p: pink, e: endo };
  const ear = bent => voxelArt(['.bb..', 'bdbb.', 'bdpb.', 'bdpbb', 'bdpdb', 'bd.db', 'bdpdb', 'bdpdb', 'bdpdb', 'bbdbb', '.bbb.', '..e..', '..e..'], P, 0.55 * U, 1.2 * U);
  for (const sx of [-1, 1]) { const p = new THREE.Group(); p.position.set(sx * 2.0 * U, 8.0 * U, -0.6 * U); const e = ear(); e.position.y = 3.6 * U; p.add(e); p.rotation.z = -sx * 0.12; if (sx > 0) p.rotation.x = -0.25; H.add(p); }
  eyeGlow(ch, A, (r, g, b) => (r > 70 && b > 70 && g < 60 && r - g > 25) || (r > 200 && g > 200 && b > 200), '#d070d0', 1.8);
  return finish(ch); }

// ===================== NIGHTMARE CHICA =====================
export function buildNChica(src) {
  const A = cleanSkin(src, { headRows: [13, 16] }); const ch = new Character('nchica', A); const H = ch.head;
  const yel = '#8a6a08', yelD = '#5e4806', orange = '#c8601a', orangeD = '#8a3a0c';
  const bk = new THREE.Group(); bk.position.set(0, 1.5 * U, 3.6 * U); H.add(bk); ch.snout = bk;
  bx(5.0, 1.8, 3.2, orange, 0, 0.9, 1.6, bk); bx(4.0, 0.8, 0.8, orangeD, 0, 1.6, 3.4, bk); bx(4.6, 0.3, 3.0, '#140604', 0, -0.2, 1.6, bk); teethRow(bk, 5.0, 3.2, -0.15, 0, -1, 8, 3, 1.1);
  addJaw(ch, { y: 1.3, z0: 2.6, w: 4.8, h: 1.3, d: 4.0, col: orange, under: orangeD, n: 8, ns: 3, th: 1.05, min: 0.15, max: 0.6 });
  // feather tuft
  const P = { y: yel, d: yelD };
  const tuft = voxelArt(['.y.y.', 'yy.yy', '.yyy.', '.dyd.'], P, 0.55 * U, 1.0 * U); tuft.position.set(0, (8 + 1.1) * U, 0.6 * U); H.add(tuft);
  eyeGlow(ch, A, (r, g, b) => (r > 160 && g < 40 && b < 40) || (r > 170 && g > 170 && b > 170), '#ffd0c0', 1.6);
  return finish(ch); }

// ===================== Foxy mask (worn by the older brother) =====================
// a 3D Foxy head shell (red fur, beige muzzle, yellow eyes, ears, snout, painted-on jaw line) that fits over a head
export function buildFoxyMask() {
  const g = new THREE.Group(); const red = '#a01814', redD = '#701010', beige = '#d8a070', black = '#160c0c';
  bx(8.8, 8.8, 8.8, red, 0, 4.0, 0, g); bx(8.9, 2.0, 0.4, redD, 0, 1.0, 4.45, g);
  for (const sx of [-1, 1]) { bx(1.8, 1.6, 0.3, '#f2f2e8', sx * 2.0, 5.2, 4.55, g); bx(0.8, 0.9, 0.3, '#f2c020', sx * 2.0, 5.1, 4.62, g, { em: '#f2c020', ei: 0.3 }); bx(2.4, 0.5, 0.3, black, sx * 2.0, 6.3, 4.6, g); }
  const sn = new THREE.Group(); sn.position.set(0, 1.6 * U, 4.4 * U); g.add(sn); bx(4.4, 2.4, 3.2, red, 0, 1.2, 1.6, sn); bx(4.0, 1.0, 3.0, beige, 0, 0.0, 1.7, sn); bx(1.6, 1.0, 0.6, black, 0, 2.0, 3.2, sn);
  for (let i = 0; i < 5; i++) bx(0.6, 0.6, 0.3, '#f2f2e8', -1.6 + i * 0.8, -0.7, 3.25, sn);
  const P = { r: red, d: redD, b: beige };
  for (const sx of [-1, 1]) { const e = voxelArt(['..r.', '.rr.', '.rbr', 'rbbr', 'rbbr', 'rrrr'], P, 0.6 * U, 1.0 * U); e.position.set(sx * 2.6 * U, (8.8 + 1.8) * U, -0.6 * U); e.rotation.z = -sx * 0.2; g.add(e); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; }

// ===================== Foxy mask v2: the REAL classic Foxy head (skin + 3D snout, jaw, ears) as a shell over the brother's head =====================
import { buildFoxy } from './skin.js';
export function buildFoxyMask2(foxyCanvas) { const fx = buildFoxy(foxyCanvas, 'maskfoxy', { hook: false }); const head = fx.head; head.removeFromParent(); head.rotation.set(0, 0, 0);
  const g = new THREE.Group(); head.scale.setScalar(1.16); head.position.set(0, -0.35 * U, 0.05 * U); g.add(head); if (fx.jaw) fx.jaw.rotation.x = 0.06;
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; }
