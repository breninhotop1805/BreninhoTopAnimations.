// Modelos extras: itens extrudados, creeper, Ender Dragon, Warden, partículas, céu, nuvens, balão "!"
import * as THREE from 'three';
import { skinBox } from './character.js';
import { nearestTex, rng } from './textures.js';
import { drawText } from './font.js';

const PXU = 1 / 16;

// ---- Itens: sprite 16x16 extrudado em voxels (como no jogo) --------------
const SWORD = [
  '.............ooo',
  '............oaao',
  '...........oabbo',
  '..........oabbo.',
  '.........oabbo..',
  '........oabbo...',
  '.......oabbo....',
  '......oabbo.....',
  '..oo.oabbo......',
  '..ogoabbo.......',
  '...oggbo........',
  '...ohgo.........',
  '..ohooog........',
  '.ohh...oo.......',
  'ohh.............',
  'oo..............',
];
const SWORD_C = { o: '#0b3a35', a: '#c9fff6', b: '#2fd9c3', g: '#1d5e57', h: '#6b4a24' };
export function itemMesh(rows, colors, emissiveKeys = '') {
  const cubes = []; const H = rows.length;
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') cubes.push([x, H - 1 - y, ch]); }));
  const has = new Set(cubes.map(([x, y]) => x + ',' + y));
  const p = [], n = [], c = [], idx = [];
  const F = [[[1, 0, 0], [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]]], [[-1, 0, 0], [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]]], [[0, 1, 0], [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]]], [[0, -1, 0], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]]], [[0, 0, 1], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]]], [[0, 0, -1], [[0, 1, 0], [1, 1, 0], [1, 0, 0], [0, 0, 0]]]];
  for (const [x, y, ch] of cubes) {
    const col = new THREE.Color(colors[ch]).convertSRGBToLinear();
    for (const [nn, cs] of F) {
      if (nn[2] === 0 && has.has((x + nn[0]) + ',' + (y + nn[1]))) continue;
      const b = p.length / 3; cs.forEach(v => { p.push(x + v[0], y + v[1], v[2] - 0.5); n.push(...nn); c.push(col.r, col.g, col.b); });
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); g.setIndex(idx);
  g.computeBoundingBox();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.1 }));
  m.castShadow = true; m.scale.setScalar(PXU); return m;
}
export function swordInHand() {
  // segurado como no jogo em 3ª pessoa: cabo na mão, lâmina apontando para frente/cima
  const pivot = new THREE.Group(); const m = itemMesh(SWORD, SWORD_C);
  m.position.set(-2.5 * PXU, -2.5 * PXU, 0); // ponto do cabo ~ (2,2) do sprite
  const r = new THREE.Group(); r.add(m); r.rotation.set(0, Math.PI / 2, -Math.PI / 4 - 0.25); // lâmina para frente
  r.scale.setScalar(13); pivot.add(r);
  const holder = new THREE.Group(); holder.add(pivot); holder.rotation.x = -Math.PI / 2 + 0.15; holder.position.set(0, -1.0, 0.6);
  holder.userData.isItem = true; return holder;
}
// Tocha 3D (bastão + chama) com luz
export function torchModel(withLight = true, intensity = 6) {
  const g = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.BoxGeometry(2 * PXU, 10 * PXU, 2 * PXU), new THREE.MeshStandardMaterial({ color: 0x6b4a24, roughness: 0.9 }));
  stick.position.y = 5 * PXU; g.add(stick);
  const flame = new THREE.Mesh(new THREE.BoxGeometry(2.2 * PXU, 2.4 * PXU, 2.2 * PXU), new THREE.MeshBasicMaterial({ color: 0xffd36a }));
  flame.position.y = 11 * PXU; g.add(flame);
  const core = new THREE.Mesh(new THREE.BoxGeometry(1.2 * PXU, 1.2 * PXU, 1.2 * PXU), new THREE.MeshBasicMaterial({ color: 0xfffbe0 }));
  core.position.y = 10.6 * PXU; g.add(core);
  if (withLight) { const L = new THREE.PointLight(0xffa64d, intensity, 14, 1.6); L.position.y = 11.5 * PXU; g.add(L); g.userData.light = L; }
  g.userData.flame = flame; return g;
}
export function torchInHand() {
  const h = new THREE.Group(); const t = torchModel(true, 2.2); t.scale.setScalar(13); t.position.set(0, -1.2, 0.8); t.rotation.x = Math.PI / 2 * 0.75; h.add(t); t.userData.light.position.set(0, 0.95, 0.15); t.userData.light.distance = 16; h.userData.torch = t; return h;
}

// ---- Creeper (skin desenhada pixel a pixel) -----------------------------
export function creeper() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 32; const g = c.getContext('2d'); const R = rng(77);
  const pal = ['#5bb54a', '#4ea33f', '#6ac459', '#3f8a33', '#78d066', '#9be08c'];
  for (let y = 0; y < 32; y++) for (let x = 0; x < 64; x++) { g.fillStyle = pal[R() * pal.length | 0]; g.fillRect(x, y, 1, 1); }
  g.fillStyle = '#0b0b0b'; // rosto: frente da cabeça (8..16, 8..16)
  g.fillRect(9, 12, 2, 2); g.fillRect(13, 12, 2, 2); g.fillRect(11, 14, 2, 3); g.fillRect(10, 15, 1, 3); g.fillRect(13, 15, 1, 3);
  const tex = nearestTex(c); const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
  const root = new THREE.Group(); const sg = new THREE.Group(); sg.scale.setScalar(PXU * 0.9375); root.add(sg);
  const mk = (geo, x, y, z, parent = sg) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.position.set(x, y, z); parent.add(m); return m; };
  const legs = [];
  for (const [x, z] of [[-2, 4], [2, 4], [-2, -4], [2, -4]]) { const p = new THREE.Group(); p.position.set(x, 6, z); sg.add(p); mk(skinBox(4, 6, 4, 0, 16, 64, 32), 0, -6, 0, p); legs.push(p); }
  const body = new THREE.Group(); body.position.y = 6; sg.add(body); mk(skinBox(8, 12, 4, 16, 16, 64, 32), 0, 0, 0, body);
  const head = new THREE.Group(); head.position.y = 12; body.add(head); mk(skinBox(8, 8, 8, 0, 0, 64, 32), 0, 0, 0, head);
  return { root, legs, body, head, mat, swell(a) { sg.scale.setScalar(PXU * 0.9375 * (1 + a * 0.15)); mat.emissive = mat.emissive || new THREE.Color(); mat.emissive.setScalar(a > 0 ? a * 0.6 : 0); } };
}

// ---- Ender Dragon (blocos) ----------------------------------------------
function solidTex(pal, seed, w = 16, h = 16, extra) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); const R = rng(seed);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { g.fillStyle = pal[R() * pal.length | 0]; g.fillRect(x, y, 1, 1); }
  if (extra) extra(g, R); return nearestTex(c);
}
export function enderDragon() {
  const scale = solidTex(['#121212', '#1a1a1a', '#232323', '#0c0c0c', '#2b2b2b'], 5);
  const M = new THREE.MeshStandardMaterial({ map: scale, roughness: 0.6, metalness: 0.15 });
  const memb = new THREE.MeshStandardMaterial({ map: solidTex(['#2a2a2e', '#323238', '#24242a'], 6), roughness: 0.8, side: THREE.DoubleSide });
  const eye = new THREE.MeshBasicMaterial({ color: 0xe36bff });
  const B = (w, h, d, mat = M) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.castShadow = true; return m; };
  const root = new THREE.Group();
  const body = B(3, 2.6, 6.5); root.add(body);
  for (let i = 0; i < 3; i++) { const sp = B(0.35, 0.7, 0.9); sp.position.set(0, 1.6, -2 + i * 2); root.add(sp); }
  // pescoço + cabeça
  const neck = []; let parent = root; let off = new THREE.Vector3(0, 0.4, 3.4);
  for (let i = 0; i < 5; i++) { const g = new THREE.Group(); g.position.copy(off); parent.add(g); const s = B(1.1, 1.1, 1.1); s.position.z = 0.55; g.add(s); const sp = B(0.25, 0.45, 0.5); sp.position.set(0, 0.75, 0.55); g.add(sp); neck.push(g); parent = g; off = new THREE.Vector3(0, 0, 1.1); }
  const head = new THREE.Group(); head.position.set(0, 0, 1.1); parent.add(head);
  const skull = B(2, 1.5, 2); skull.position.set(0, 0.1, 0.9); head.add(skull);
  const snout = B(1.4, 0.8, 1.8); snout.position.set(0, -0.05, 2.7); head.add(snout);
  const jaw = new THREE.Group(); jaw.position.set(0, -0.45, 1.8); head.add(jaw); const jm = B(1.35, 0.4, 1.9); jm.position.set(0, 0, 0.9); jaw.add(jm);
  for (const sx of [-1, 1]) { const e = B(0.55, 0.22, 0.12, eye); e.position.set(sx * 0.55, 0.35, 1.91); head.add(e); const horn = B(0.3, 0.6, 0.5); horn.position.set(sx * 0.6, 1.0, 0.4); horn.rotation.x = -0.4; head.add(horn); const nos = B(0.25, 0.15, 0.3); nos.position.set(sx * 0.4, 0.4, 3.4); head.add(nos); }
  // cauda
  const tail = []; parent = root; off = new THREE.Vector3(0, 0.2, -3.25);
  for (let i = 0; i < 10; i++) { const g = new THREE.Group(); g.position.copy(off); parent.add(g); const s = B(1.0 - i * 0.04, 1.0 - i * 0.04, 1.1); s.position.z = -0.55; g.add(s); const sp = B(0.22, 0.4, 0.5); sp.position.set(0, 0.6, -0.55); g.add(sp); tail.push(g); parent = g; off = new THREE.Vector3(0, 0, -1.1); }
  // asas
  const wings = [];
  for (const sx of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(sx * 1.5, 0.9, 1.2); root.add(sh);
    const bone = B(7, 0.45, 0.45); bone.position.x = sx * 3.5; sh.add(bone);
    const m1 = B(7, 0.06, 4.5, memb); m1.position.set(sx * 3.5, 0, -2.4); sh.add(m1);
    const tip = new THREE.Group(); tip.position.x = sx * 7; sh.add(tip);
    const bone2 = B(7, 0.35, 0.35); bone2.position.x = sx * 3.5; tip.add(bone2);
    const m2 = B(7, 0.06, 4.0, memb); m2.position.set(sx * 3.5, 0, -2.1); tip.add(m2);
    wings.push({ sh, tip, sx });
  }
  // pernas
  for (const [x, z] of [[-1.2, 2], [1.2, 2], [-1.3, -2.2], [1.3, -2.2]]) { const l = B(0.7, 2.2, 0.7); l.position.set(x, -2.2, z); l.rotation.x = 0.7; root.add(l); }
  return {
    root, neck, head, jaw, tail, wings,
    animate(t, roar = 0) {
      const f = Math.sin(t * 4.2);
      for (const w of wings) { w.sh.rotation.z = w.sx * (f * 0.55 + 0.05); w.tip.rotation.z = w.sx * (Math.sin(t * 4.2 - 0.8) * 0.5); }
      neck.forEach((n, i) => { n.rotation.x = -0.12 + Math.sin(t * 2 + i * 0.5) * 0.05 + (i < 2 ? -0.1 : 0.06); });
      tail.forEach((n, i) => { n.rotation.y = Math.sin(t * 2.4 - i * 0.6) * 0.09; n.rotation.x = 0.03; });
      jaw.rotation.x = 0.1 + roar * 0.6;
      root.position.y = Math.sin(t * 4.2 + 1.2) * 0.25;
    }
  };
}

// ---- Warden ------------------------------------------------------------
export function warden() {
  const skin = ['#0c3a45', '#0e4552', '#0a2f39', '#124e5c', '#08262e'];
  const body = solidTex(skin, 8, 32, 32, (g, R) => {
    // "almas" brilhantes no peito
    g.fillStyle = '#41f1e8'; for (let i = 0; i < 26; i++) g.fillRect(8 + (R() * 16 | 0), 6 + (R() * 18 | 0), 1, 1);
    g.fillStyle = '#c2fffb'; for (let i = 0; i < 8; i++) g.fillRect(12 + (R() * 8 | 0), 10 + (R() * 10 | 0), 1, 1);
    g.fillStyle = '#071e24'; for (let y = 6; y < 26; y += 4) g.fillRect(6, y, 20, 1); // costelas
  });
  const M = new THREE.MeshStandardMaterial({ map: body, roughness: 0.8, emissiveMap: body, emissive: new THREE.Color(0x0a2a2a) });
  const plain = new THREE.MeshStandardMaterial({ map: solidTex(skin, 9), roughness: 0.85 });
  const glow = new THREE.MeshBasicMaterial({ color: 0x47f5ea });
  const mouth = new THREE.MeshBasicMaterial({ color: 0x050a0c });
  const U = PXU * 0.9375;
  const B = (w, h, d, mat = plain) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w * U, h * U, d * U), mat); m.castShadow = true; return m; };
  const root = new THREE.Group();
  const legs = []; for (const sx of [-1, 1]) { const p = new THREE.Group(); p.position.set(sx * 5.5 * U, 13 * U, 0); root.add(p); const l = B(6, 13, 6); l.position.y = -6.5 * U; p.add(l); legs.push(p); }
  const torso = new THREE.Group(); torso.position.y = 13 * U; root.add(torso);
  const t = B(18, 21, 11, M); t.position.y = 10.5 * U; torso.add(t);
  const head = new THREE.Group(); head.position.y = 21 * U; torso.add(head);
  const h = B(16, 16, 10); h.position.y = 8 * U; head.add(h);
  const mo = B(10, 3, 0.6, mouth); mo.position.set(0, 4 * U, 5.1 * U); head.add(mo);
  const tendrils = []; for (const sx of [-1, 1]) { const tg = new THREE.Group(); tg.position.set(sx * 8 * U, 13 * U, 0); head.add(tg); const tm = B(1, 10, 10, glow); tm.position.set(sx * 0.5 * U, 5 * U, 0); tg.add(tm); tendrils.push({ tg, sx }); }
  const arms = []; for (const sx of [-1, 1]) { const a = new THREE.Group(); a.position.set(sx * 13 * U, 19 * U, 0); torso.add(a); const am = B(8, 28, 8); am.position.y = -12 * U; a.add(am); arms.push({ a, sx }); }
  return {
    root, head, torso, arms, tendrils, mo,
    animate(tt, roar = 0) {
      torso.rotation.x = -0.25 * roar + Math.sin(tt * 1.5) * 0.03;
      head.rotation.x = -0.5 * roar; mo.scale.y = 1 + roar * 2.4; mo.position.y = (4 - roar * 2.5) * U;
      for (const { tg, sx } of tendrils) tg.rotation.z = sx * (0.25 + roar * 0.5 + Math.sin(tt * 18) * 0.12 * roar);
      for (const { a, sx } of arms) { a.rotation.z = sx * (0.1 + roar * 0.6); a.rotation.x = -0.2 * roar; }
    }
  };
}

// ---- Partículas (quadradinhos pixelados, como no jogo) --------------------
function puffTex(col) { const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d'); const R = rng(col.length * 13); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const d = Math.hypot(x - 3.5, y - 3.5); if (d < 3.8) { g.fillStyle = col[R() * col.length | 0]; g.fillRect(x, y, 1, 1); } } return nearestTex(c); }
const PT = {};
export function particles(kind, n, seed) {
  const cols = { smoke: ['#e8e8e8', '#cfcfcf', '#b5b5b5', '#ffffff'], dark: ['#5a5a5a', '#3f3f3f', '#6e6e6e'], dust: ['#7d6a52', '#6a573f', '#8f7b60'], gold: ['#fff3a1', '#ffe14f', '#ffffff'], red: ['#ff3a3a', '#c41f1f'], web: ['#ffffff', '#dddddd'] }[kind];
  PT[kind] = PT[kind] || puffTex(cols);
  const g = new THREE.Group(); const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const m = new THREE.SpriteMaterial({ map: PT[kind], transparent: true, depthWrite: false, color: kind === 'gold' ? 0xffffff : 0xffffff });
    const s = new THREE.Sprite(m);
    s.userData = { v: new THREE.Vector3(R() - .5, R() * .8 + .2, R() - .5), size: (kind === 'smoke' ? 0.12 + R() * 0.18 : 0.04 + R() * 0.07), life: 0.6 + R() * 0.6, rot: R() };
    if (kind === 'gold' || kind === 'web') m.color.setScalar(0.7);
    g.add(s);
  }
  g.userData.update = (u, spread = 1, rise = 1) => { // u = tempo desde o início (s)
    for (const s of g.children) { const d = s.userData; const k = Math.min(1, u / d.life); s.position.set(d.v.x * spread * (1 - Math.pow(1 - k, 2)) * 1.6, d.v.y * rise * k * 1.4, d.v.z * spread * (1 - Math.pow(1 - k, 2)) * 1.6); s.scale.setScalar(d.size * (1 - k * 0.6)); s.material.opacity = u < 0 ? 0 : 1 - k * k; s.visible = u >= 0 && k < 1; }
  };
  return g;
}

// ---- Céu: gradiente, sol/lua quadrados, nuvens de blocos -----------------
export function sky() {
  const u = { top: { value: new THREE.Color(0x3d6fd1) }, hor: { value: new THREE.Color(0xf2b27a) }, bot: { value: new THREE.Color(0x2a2a3a) }, sunDir: { value: new THREE.Vector3(0, .2, -1) }, glow: { value: new THREE.Color(0xffc27a) } };
  const m = new THREE.ShaderMaterial({ uniforms: u, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vd; void main(){ vd = normalize((modelMatrix*vec4(position,1.)).xyz - cameraPosition); gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); gl_Position.z = gl_Position.w; }',
    fragmentShader: 'uniform vec3 top,hor,bot,glow,sunDir; varying vec3 vd; void main(){ vec3 d=normalize(vd); float h=d.y; vec3 c = h>0. ? mix(hor, top, pow(clamp(h*1.6,0.,1.),0.7)) : mix(hor, bot, clamp(-h*4.,0.,1.)); float s = max(dot(d, normalize(sunDir)),0.); c += glow*pow(s,8.)*0.55 + glow*pow(s,64.)*0.6; gl_FragColor=vec4(c,1.);\n#include <colorspace_fragment>\n}' });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), m); mesh.renderOrder = -10; mesh.frustumCulled = false;
  // sol quadrado
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ color: 0xfff6c8, fog: false, depthWrite: false })); sun.renderOrder = -9;
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(54, 54), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.25, fog: false, depthWrite: false })); halo.renderOrder = -9.5;
  const moonC = document.createElement('canvas'); moonC.width = moonC.height = 16; const mg = moonC.getContext('2d'); const R = rng(4);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { if (x < 3 || x > 12 || y < 3 || y > 12) continue; const v = 190 + R() * 50 | 0; mg.fillStyle = `rgb(${v},${v},${v + 15})`; mg.fillRect(x, y, 1, 1); }
  mg.fillStyle = '#9aa0b5'; mg.fillRect(5, 5, 2, 2); mg.fillRect(9, 8, 2, 2); mg.fillRect(6, 10, 1, 1);
  const moon = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshBasicMaterial({ map: nearestTex(moonC), transparent: true, fog: false, depthWrite: false })); moon.renderOrder = -9;
  // estrelas
  const sp = []; const R2 = rng(9); for (let i = 0; i < 700; i++) { const v = new THREE.Vector3(R2() - .5, R2() * .9 + .05, R2() - .5).normalize().multiplyScalar(380); sp.push(v.x, v.y, v.z); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0 }));
  const group = new THREE.Group(); group.add(mesh, sun, halo, moon, stars);
  return {
    group, u, sun, moon, stars, halo,
    place(cam, dir, moonDir) { // sol/lua seguem a câmera (infinitos)
      group.position.copy(cam.position);
      sun.position.copy(dir).normalize().multiplyScalar(350); sun.lookAt(0, 0, 0); halo.position.copy(sun.position).multiplyScalar(0.99); halo.lookAt(0, 0, 0);
      u.sunDir.value.copy(dir).normalize();
      const md = moonDir || dir.clone().negate(); moon.position.copy(md).normalize().multiplyScalar(345); moon.lookAt(0, 0, 0);
    }
  };
}
export function clouds(seed = 3, y = 70) {
  const R = rng(seed); const geo = new THREE.BoxGeometry(12, 4, 12);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, roughness: 1, emissive: 0x666666 });
  const cells = []; for (let x = -18; x < 18; x++) for (let z = -18; z < 18; z++) { const v = Math.sin(x * 0.7 + R() * 0.5) + Math.cos(z * 0.55) + Math.sin((x + z) * 0.31) + R() * 0.9; if (v > 1.5) cells.push([x, z]); }
  const im = new THREE.InstancedMesh(geo, mat, cells.length); const o = new THREE.Object3D();
  cells.forEach(([x, z], i) => { o.position.set(x * 12, y, z * 12); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
  im.frustumCulled = false; return im;
}

// ---- Balão "!" / "?" sobre a cabeça --------------------------------------
export function balloon(ch = '!') {
  const c = document.createElement('canvas'); c.width = 14; c.height = 18; const g = c.getContext('2d');
  g.fillStyle = '#111'; g.fillRect(1, 0, 12, 14); g.fillRect(0, 1, 14, 12); g.fillRect(5, 14, 4, 2); g.fillRect(6, 16, 2, 1);
  g.fillStyle = '#fff'; g.fillRect(2, 1, 10, 12); g.fillRect(1, 2, 12, 10); g.fillRect(6, 13, 2, 2);
  drawText(g, ch, ch === '!' ? 6 : 5, 3, 1, ch === '!' ? '#e01b1b' : '#111', false);
  const m = new THREE.SpriteMaterial({ map: nearestTex(c), transparent: true, depthTest: false, color: 0xb8b8b8 }); const s = new THREE.Sprite(m); s.renderOrder = 20;
  s.userData.base = [0.36, 0.46]; return s;
}
