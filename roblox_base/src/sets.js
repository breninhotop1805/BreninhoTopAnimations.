// Roblox-style sets: chunky, colourful, rounded plastic parts, warm sun + soft sky light.
import * as THREE from 'three';
import { plastic, rbox } from './rbx.js';
export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const P = (g, geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; g.add(m); return m; };
const B = (g, w, h, d, col, x, y, z, r = 0.05, o) => P(g, rbox(w, h, d, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001), 2), plastic(col, o), x, y, z);
function skyTex(top = '#5aa8f0', bot = '#cfe8ff') { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function cloud(g, x, y, z, s) { const m = plastic('#ffffff', { rough: 0.9 }); const cg = new THREE.Group(); cg.position.set(x, y, z); cg.scale.setScalar(s); g.add(cg);
  for (const [dx, dy, r] of [[0, 0, 1.2], [1.3, -0.2, 0.9], [-1.3, -0.25, 0.85], [0.6, 0.5, 0.8], [-0.6, 0.45, 0.75]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m); b.position.set(dx, dy, 0); cg.add(b); } }

// a two-storey row house: plaster wall, door with frame and steps, windows with white frames, balcony with rails, cornice
function house(g, x, z, w, col, trim, door, seed) { const r = rng(seed); const H = 7.5 + r() * 1.5;
  B(g, w, H, 1, col, x, H / 2, z, 0.06); B(g, w + 0.3, 0.4, 1.3, trim, x, H + 0.2, z + 0.1, 0.08); B(g, w + 0.1, 0.6, 1.1, shade(col, 0.85), x, 0.3, z + 0.05, 0.05);
  // door
  const dx = x + (r() - 0.5) * (w - 3); B(g, 2.0, 3.4, 0.25, '#f4f1ea', dx, 1.7, z + 0.55, 0.05); B(g, 1.6, 3.1, 0.3, door, dx, 1.6, z + 0.6, 0.05);
  B(g, 1.2, 1.1, 0.12, shade(door, 0.8), dx, 2.3, z + 0.78, 0.04); B(g, 1.2, 1.0, 0.12, shade(door, 0.8), dx, 1.0, z + 0.78, 0.04);
  const kn = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), plastic('#d8b040', { metal: 0.6, rough: 0.3 })); kn.position.set(dx + 0.55, 1.6, z + 0.8); g.add(kn);
  B(g, 2.4, 0.2, 0.7, '#b8b8c0', dx, 0.1, z + 0.85, 0.04);
  // windows (ground floor beside the door + upper floor)
  const win = (wx, wy) => { B(g, 1.7, 1.9, 0.2, '#f6f4ee', wx, wy, z + 0.55, 0.05); B(g, 1.3, 1.5, 0.22, '#7ec4f0', wx, wy, z + 0.56, 0.03, { rough: 0.15 }); B(g, 0.1, 1.5, 0.26, '#f6f4ee', wx, wy, z + 0.58, 0.02); B(g, 1.3, 0.1, 0.26, '#f6f4ee', wx, wy, z + 0.58, 0.02); B(g, 1.9, 0.18, 0.5, '#f6f4ee', wx, wy - 1.0, z + 0.65, 0.04); };
  for (const wx of [x - w / 2 + 1.4, x + w / 2 - 1.4]) if (Math.abs(wx - dx) > 1.9) win(wx, 2.2);
  for (const wx of [x - w / 4, x + w / 4]) win(wx, 5.4);
  // balcony
  B(g, w - 0.6, 0.18, 1.2, '#f2f0ea', x, 4.25, z + 1.1, 0.05); B(g, w - 0.6, 0.1, 0.1, trim, x, 5.15, z + 1.65, 0.04);
  for (let i = 0; i <= Math.floor((w - 0.8) / 0.32); i++) B(g, 0.06, 0.9, 0.06, trim, x - (w - 0.8) / 2 + i * 0.32, 4.7, z + 1.65, 0.02);
  return H; }
function shade(hex, k) { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); }

export function buildStreet(S) {
  const s = new THREE.Scene(); s.background = skyTex(); s.fog = new THREE.Fog('#cfe6ff', 30, 70); const g = new THREE.Group(); s.add(g); const r = rng(7);
  // cobblestone street: instanced rounded stones in a running bond
  const stoneGeo = rbox(0.95, 0.2, 0.62, 0.08, 2); const stones = []; for (let zz = -4.2; zz < 14; zz += 0.68) for (let xx = -22; xx < 22; xx += 1.0) stones.push([xx + ((Math.round(zz / 0.68) % 2) ? 0.5 : 0), zz]);
  const im = new THREE.InstancedMesh(stoneGeo, plastic('#ffffff', { rough: 0.8 }), stones.length); const m4 = new THREE.Matrix4(); const col = new THREE.Color();
  stones.forEach(([xx, zz], i) => { m4.makeRotationY((r() - 0.5) * 0.06); m4.setPosition(xx, 0.02 + r() * 0.04, zz); im.setMatrixAt(i, m4); col.set(['#9aa3b5', '#a8b0c0', '#8e97aa', '#b3b9c6'][Math.floor(r() * 4)]); im.setColorAt(i, col); });
  im.castShadow = false; im.receiveShadow = true; g.add(im);
  const base = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), plastic('#6a7080')); base.rotation.x = -Math.PI / 2; base.position.y = -0.01; base.receiveShadow = true; g.add(base);
  // sidewalk + curb
  B(g, 60, 0.35, 2.4, '#d8d4cc', 0, 0.17, -5.4, 0.05); B(g, 60, 0.4, 0.3, '#b8b4ac', 0, 0.2, -4.2, 0.06);
  // houses
  const cols = [['#8fd47a', '#2f7fd0', '#a0522d'], ['#f2a4c8', '#7a3fb0', '#8b4a2a'], ['#7ec8f0', '#1f5fb8', '#9a3020'], ['#f6c25a', '#d84a2a', '#6a3a1a'], ['#b89cf0', '#3a8a5a', '#7a2a2a'], ['#f08a5a', '#2a6ab0', '#5a3a20']];
  let x = -21; let i = 0; while (x < 21) { const w = 6 + Math.round(r() * 2); const [c, t, d] = cols[i % cols.length]; house(g, x + w / 2, -7.2, w, c, t, d, 11 + i); x += w; i++; }
  // lamp posts + plants
  for (const lx of [-7, 7]) { B(g, 0.25, 5, 0.25, '#1a1a1e', lx, 2.5, -4.9, 0.08); B(g, 0.7, 0.9, 0.7, '#202024', lx, 5.4, -4.9, 0.1); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), new THREE.MeshStandardMaterial({ color: '#fff4d0', emissive: '#ffe8a0', emissiveIntensity: 0.6 })); bulb.position.set(lx, 5.3, -4.9); g.add(bulb); }
  for (const px of [-11, -3.5, 3.6, 11]) { B(g, 0.9, 0.8, 0.9, '#c8643a', px, 0.75, -5.5, 0.12); const bush = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), plastic('#3ea84a', { rough: 0.8 })); bush.position.set(px, 1.5, -5.5); bush.castShadow = true; g.add(bush); }
  cloud(g, -10, 16, -30, 2.2); cloud(g, 8, 19, -34, 2.8); cloud(g, 22, 15, -28, 1.8);
  // light: warm sun (soft shadows), sky/ground bounce
  const sun = new THREE.DirectionalLight('#fff1dc', 3.2); sun.position.set(-12, 22, 16); sun.target.position.set(0, 0, -2); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 6; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -10, near: 1, far: 60 }); s.add(sun, sun.target); S.sun = sun;
  s.add(new THREE.HemisphereLight('#cfe6ff', '#b89a7a', 1.4)); const fill = new THREE.DirectionalLight('#dfe8ff', 0.6); fill.position.set(10, 8, 12); s.add(fill);
  S.street = s; return s; }
