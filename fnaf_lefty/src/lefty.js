// Lefty (FNAF 6) on the Minecraft rig. Every painted 2D part that becomes 3D is erased from the skin first
// (top hat, ears, muzzle, bow tie) so nothing is left behind. 3D: small red top hat, round ears, voxel muzzle with
// nose, opening jaw (lower teeth), bow tie, microphone in the LEFT hand (ball on top), Puppet stripes in the arm seams.
import * as THREE from 'three';
import { Character, U, imgCopy, extrudePixels, voxelArt, pixelTexture } from './skin.js';

const fur = [52, 52, 52];
function paint(A, x, y, w, h, fn) { const s = A.width / 64; const g = A.getContext('2d'); const d = g.getImageData(x * s, y * s, w * s, h * s);
  for (let j = 0; j < h * s; j++) for (let i = 0; i < w * s; i++) { const o = (j * w * s + i) * 4; const r = fn(d.data[o], d.data[o + 1], d.data[o + 2], d.data[o + 3], i, j); if (r) { d.data[o] = r[0]; d.data[o + 1] = r[1]; d.data[o + 2] = r[2]; d.data[o + 3] = r[3] ?? 255; } }
  g.putImageData(d, x * s, y * s); }
const isRed = (r, g, b) => r > 120 && g < 90 && b < 90;
const box = (w, h, d, c, x, y, z, p, o = {}) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w * U, h * U, d * U), new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? 0.6, metalness: o.metal ?? 0, emissive: o.em || '#000', emissiveIntensity: o.ei || 0 })); m.position.set(x * U, y * U, z * U); m.castShadow = m.receiveShadow = true; p.add(m); return m; };

export function buildLefty(canvas) {
  const A = imgCopy(canvas); const s = A.width / 64;
  // --- keep a copy of the face for the 3D muzzle/jaw before repainting
  const F = document.createElement('canvas'); F.width = 8 * s; F.height = 8 * s; F.getContext('2d').drawImage(canvas, 8 * s, 8 * s, 8 * s, 8 * s, 0, 0, 8 * s, 8 * s);
  // --- erase painted top hat (head top + upper sides), painted ears (face corners + hat layer), hat-layer muzzle
  paint(A, 8, 0, 8, 8, (r, g, b) => isRed(r, g, b) ? fur : null);                                  // head top
  for (const x of [0, 16, 24]) paint(A, x, 8, 8, 4, (r, g, b, a, i, j) => isRed(r, g, b) && j < 4 * s ? fur : null); // upper part of sides/back
  paint(A, 8, 8, 8, 2, (r, g, b, a, i, j) => (i < 3 * s / 2 || i >= 8 * s - 3 * s / 2) && j < 2 * s ? fur : null); // painted ear corners on the face
  A.getContext('2d').clearRect(32 * s, 0, 32 * s, 8 * s);                                          // hat layer top/bottom
  A.getContext('2d').clearRect(32 * s, 8 * s, 8 * s, 4 * s); A.getContext('2d').clearRect(48 * s, 8 * s, 16 * s, 4 * s); // hat-layer side tops (hat drawing)
  A.getContext('2d').clearRect(40 * s, 8 * s, 8 * s, 2 * s);                                         // hat-layer ears on the front
  A.getContext('2d').clearRect(41 * s, 12 * s, 6 * s, 4 * s);                                        // hat-layer muzzle (becomes 3D)
  // face behind the 3D muzzle/jaw -> dark mouth interior (seen only when the jaw opens)
  paint(A, 9, 12, 6, 4, (r, g, b, a, i, j) => j >= 2 * s ? [26, 10, 12] : [40, 40, 40]);
  // painted bow tie on the chest (base + overlay) -> fur / transparent
  paint(A, 20, 20, 8, 3, (r, g, b) => isRed(r, g, b) ? fur : null); paint(A, 20, 36, 8, 4, (r, g, b, a) => isRed(r, g, b) ? [0, 0, 0, 0] : null);
  const ch = new Character('lefty', A);

  // --- 3D muzzle (face rows 8..12 hi-res, cols 2..13 = upper muzzle + nose + upper teeth) and jaw (rows 13..15)
  const k = s; const px = U / k * 1.0; // one skin texel
  const mz = extrudePixels(F, 2 * k / 2, 8 * k / 2, 6 * k, 2.5 * k, px, 2.0 * U); mz.position.set(0, 2.75 * U, 4.0 * U + 1.0 * U); ch.head.add(mz);
  box(1.6, 0.9, 0.6, '#050505', 0, 3.75, 6.15, ch.head, { rough: 0.3 });                         // 3D nose on top of the muzzle
  const jaw = new THREE.Group(); jaw.position.set(0, 1.5 * U, 4.0 * U); ch.head.add(jaw); ch.jaw = jaw;
  const jw = extrudePixels(F, 2 * k / 2, 13 * k / 2, 6 * k, 1.5 * k, px, 2.0 * U); jw.position.set(0, -0.75 * U, 1.0 * U); jaw.add(jw);
  box(5.6, 0.25, 1.6, '#4a0e12', 0, 0.05, 1.0, jaw);                                               // tongue/mouth floor
  // --- round 3D ears (dark rim, grey inner), offset up so they are not buried
  const P = { o: '#2a2a2a', d: '#1c1c1c', l: '#6a6a6a' };
  for (const sx of [-1, 1]) { const e = voxelArt(['.oooo.', 'oddddo', 'odlldo', 'odlldo', 'oooooo'], P, 0.55 * U, 1.1 * U); const g = new THREE.Group(); g.position.set(sx * 3.3 * U, 8.0 * U, -0.6 * U); g.rotation.z = -sx * 0.18; e.position.y = 1.35 * U; g.add(e); ch.head.add(g); }
  // --- small red top hat (slightly tilted), red band darker
  const hat = new THREE.Group(); hat.position.set(1.2 * U, 8.0 * U, 0.4 * U); hat.rotation.z = -0.12; ch.head.add(hat); ch.topHat = hat;
  box(4.2, 0.5, 4.2, '#a80e14', 0, 0.25, 0, hat, { rough: 0.5 }); box(3.0, 0.7, 3.0, '#5a0608', 0, 0.85, 0, hat); box(3.0, 2.6, 3.0, '#c8161c', 0, 2.5, 0, hat, { rough: 0.5 });
  // --- 3D bow tie on the chest
  const bow = new THREE.Group(); bow.position.set(0, 11.0 * U, 2.25 * U); ch.torso.add(bow);
  for (const sx of [-1, 1]) { const w = box(2.0, 1.6, 0.6, '#d01a1e', sx * 1.25, 0, 0, bow); w.rotation.z = sx * 0.12; } box(0.9, 0.9, 0.8, '#8a0a0e', 0, 0, 0.1, bow);
  // --- microphone in the LEFT hand: handle along the fist, ball (mesh) on top
  const mic = new THREE.Group(); ch.handL.add(mic); mic.position.set(0, 0.6 * U, 1.6 * U); mic.rotation.x = 1.05; ch.mic = mic;
  box(0.9, 4.4, 0.9, '#1a1a1e', 0, 1.4, 0, mic, { metal: 0.6, rough: 0.35 }); box(1.1, 0.5, 1.1, '#c8a030', 0, 3.6, 0, mic, { metal: 0.8, rough: 0.3 });
  const ballT = (() => { const c = document.createElement('canvas'); c.width = c.height = 4; const g = c.getContext('2d'); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#8a8a92' : '#c8c8d0'; g.fillRect(x, y, 1, 1); } return pixelTexture(c); })();
  const ball = new THREE.Mesh(new THREE.BoxGeometry(2.2 * U, 2.2 * U, 2.2 * U), new THREE.MeshStandardMaterial({ map: ballT, metalness: 0.7, roughness: 0.35 })); ball.position.y = 4.9 * U; mic.add(ball);
  // --- Puppet stripes in the arm seams (between the upper arm and forearm plates); amount via setStripes
  const stripeT = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 4; const g = c.getContext('2d'); for (let y = 0; y < 4; y++) { g.fillStyle = y % 2 ? '#141414' : '#f2eee2'; g.fillRect(0, y, 4, 1); } return pixelTexture(c); })();
  ch.stripes = [];
  for (const A2 of [ch.armR, ch.armL]) { const band = new THREE.Mesh(new THREE.BoxGeometry(4.6 * U, 2.4 * U, 4.6 * U), new THREE.MeshStandardMaterial({ map: stripeT, emissiveMap: stripeT, roughness: 0.7, emissive: '#ffffff', emissiveIntensity: 0 }));
    band.position.y = -5.6 * U; band.castShadow = true; A2.piv.add(band); ch.stripes.push(band);
    const seam = new THREE.Mesh(new THREE.BoxGeometry(4.15 * U, 0.35 * U, 4.15 * U), new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.9 })); seam.position.y = -5.6 * U; A2.piv.add(seam); }
  ch.setStripes = (v, glow = 0) => ch.stripes.forEach(b => { b.scale.set(1, Math.max(0.001, v), 1); b.material.emissiveIntensity = 0.15 + 0.6 * glow; b.visible = v > 0.01; });
  ch.setStripes(0.3);
  ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const r0 = ch.reset.bind(ch); ch.reset = () => { r0(); jaw.rotation.x = 0; ch.setStripes(0.3); };
  return ch;
}
