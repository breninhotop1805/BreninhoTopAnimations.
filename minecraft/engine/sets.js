// Cenários construídos bloco a bloco
import * as THREE from 'three';
import { World } from './world.js';
import { rng } from './textures.js';
import { sky, clouds, torchModel } from './models.js';

// ======================= SUPERFÍCIE: o império do Philza ===================
export function hOW(x, z) {
  let h = 4 + Math.round(3 * Math.sin(x * 0.07) + 2.5 * Math.cos(z * 0.09) + 1.5 * Math.sin((x + z) * 0.13));
  const cx = Math.max(0, Math.abs(x) - 24), cz = Math.max(0, Math.max(-44 - z, z + 2));
  const d = Math.hypot(cx, cz); if (d < 8) h = Math.round(6 + (h - 6) * (d / 8)); // platô do castelo
  const ld = Math.hypot(x - 34, z - 22); if (ld < 14) h = Math.min(h, Math.round(1 + ld * 0.25)); // lago
  const sd = Math.max(0, Math.abs(x + 40) - 7, Math.abs(z - 31) - 6); if (sd < 6) h = Math.round(5 + (h - 5) * (sd / 6)); // canteiro
  return h;
}
export function buildOverworld() {
  const w = new World(); const R = rng(2024);
  for (let x = -80; x <= 80; x++) for (let z = -90; z <= 70; z++) {
    const h = hOW(x, z);
    for (let y = h - 4; y <= h; y++) {
      let id = y === h ? 'grass' : y > h - 3 ? 'dirt' : 'stone';
      if (h <= 3 && y >= h - 1 && Math.hypot(x - 34, z - 22) < 16) id = 'sand';
      w.set(x, y, z, id);
    }
    if (Math.hypot(x - 34, z - 22) < 14) for (let y = h + 1; y <= 3; y++) w.set(x, y, z, 'water');
  }
  // ---- castelo
  const Y0 = 7;
  const crenel = (x0, z0, x1, z1, y, id) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if ((x === x0 || x === x1 || z === z0 || z === z1) && ((x + z) % 2 === 0)) w.set(x, y, z, id); };
  w.hollow(-20, Y0, -38, 20, Y0 + 8, -6, 'stone_bricks'); crenel(-20, -38, 20, -6, Y0 + 9, 'stone_bricks');
  for (let x = -20; x <= 20; x++) for (let z = -38; z <= -6; z++) if (R() < 0.12 && (x === -20 || x === 20 || z === -38 || z === -6)) { const y = Y0 + (R() * 8 | 0); if (w.get(x, y, z)) w.set(x, y, z, R() < .5 ? 'cobblestone' : 'mossy'); }
  // portão
  w.box(-2, Y0, -6, 2, Y0 + 4, -6, null); w.box(-3, Y0 + 5, -6, 3, Y0 + 5, -6, 'dark_oak_log');
  // chão interno
  w.box(-19, Y0 - 1, -37, 19, Y0 - 1, -7, 'cobblestone');
  // torres de canto
  const tower = (cx, cz, top) => {
    w.hollow(cx - 3, Y0, cz - 3, cx + 3, top, cz + 3, 'stone_bricks');
    for (let y = Y0 + 3; y < top; y += 4) for (const [dx, dz] of [[0, -3], [0, 3], [-3, 0], [3, 0]]) w.set(cx + dx, y, cz + dz, 'glass');
    w.box(cx - 4, top + 1, cz - 4, cx + 4, top + 1, cz + 4, 'stone_bricks'); crenel(cx - 4, cz - 4, cx + 4, cz + 4, top + 2, 'stone_bricks');
    for (let k = 0; k < 5; k++) w.hollow(cx - 4 + k, top + 3 + k, cz - 4 + k, cx + 4 - k, top + 3 + k, cz + 4 - k, 'spruce_planks');
    w.set(cx, top + 8, cz, 'spruce_planks');
    for (let y = top - 6; y < top - 1; y++) { w.set(cx, y, cz + 4, 'red_wool'); } // estandarte
  };
  tower(-20, -38, 24); tower(20, -38, 24); tower(-20, -6, 22); tower(20, -6, 22);
  // torre principal (keep)
  w.hollow(-7, Y0, -30, 7, 33, -16, 'stone_bricks');
  for (let y = Y0 + 4; y < 33; y += 5) for (let x = -5; x <= 5; x += 5) { w.set(x, y, -16, 'glass'); w.set(x, y + 1, -16, 'glass'); w.set(x, y, -30, 'glass'); w.set(x, y + 1, -30, 'glass'); }
  for (let z = -27; z <= -19; z += 4) for (let y = Y0 + 4; y < 33; y += 5) { w.set(-7, y, z, 'glass'); w.set(7, y, z, 'glass'); }
  w.box(-8, 34, -31, 8, 34, -15, 'stone_bricks'); crenel(-8, -31, 8, -15, 35, 'stone_bricks');
  w.box(-7, 33, -30, 7, 33, -16, 'stone_bricks');
  for (let y = 12; y < 30; y++) { w.set(-3, y, -15, 'red_wool'); w.set(3, y, -15, 'red_wool'); }
  w.box(-1, 35, -24, 1, 35, -22, 'gold_block'); // pedestal de ouro no topo
  // casas
  const house = (x0, z0, wdt, dep, rot) => {
    const h = hOW(x0, z0) + 1;
    w.box(x0, h - 1, z0, x0 + wdt, h - 1, z0 + dep, 'cobblestone');
    w.hollow(x0, h, z0, x0 + wdt, h + 3, z0 + dep, 'oak_planks');
    for (const [x, z] of [[x0, z0], [x0 + wdt, z0], [x0, z0 + dep], [x0 + wdt, z0 + dep]]) w.box(x, h, z, x, h + 3, z, 'oak_log');
    w.set(x0 + 2, h + 1, z0 + dep, 'glass'); w.set(x0 + wdt - 2, h + 1, z0 + dep, 'glass'); w.box(x0 + (wdt >> 1), h, z0 + dep, x0 + (wdt >> 1), h + 1, z0 + dep, null);
    for (let k = 0; k <= (wdt >> 1) + 1; k++) for (let z = z0 - 1; z <= z0 + dep + 1; z++) { w.set(x0 - 1 + k, h + 4 + k, z, 'spruce_planks'); w.set(x0 + wdt + 1 - k, h + 4 + k, z, 'spruce_planks'); }
  };
  house(-26, 6, 6, 5); house(-14, 12, 7, 5); house(10, 10, 6, 6); house(22, 2, 6, 5); house(-34, -8, 6, 6);
  // caminho de cascalho
  for (let z = -5; z < 40; z++) for (let x = -1; x <= 1; x++) { const h = hOW(x, z); w.set(x, h, z, 'gravel'); }
  // árvores
  const tree = (tx, tz) => {
    const h = hOW(tx, tz); if (w.get(tx, h + 1, tz)) return; const th = 4 + (R() * 3 | 0);
    for (let y = 1; y <= th; y++) w.set(tx, h + y, tz, 'oak_log');
    for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) for (let y = th - 2; y <= th + 1; y++) {
      const top = y >= th; if (top && (Math.abs(x) === 2 || Math.abs(z) === 2)) continue; if (Math.abs(x) === 2 && Math.abs(z) === 2 && R() < .6) continue;
      if (!(x === 0 && z === 0 && y <= th)) if (!w.get(tx + x, h + y, tz + z)) w.set(tx + x, h + y, tz + z, 'oak_leaves');
    }
  };
  for (let i = 0; i < 160; i++) { const x = (R() * 160 - 80) | 0, z = (R() * 160 - 90) | 0; if (x > -28 && x < 28 && z > -46 && z < 2) continue; if (Math.abs(x) < 4 && z > -6 && z < 42) continue; if (Math.hypot(x - 34, z - 22) < 17) continue; if (x > -56 && x < -24 && z > 18 && z < 46) continue; if (x > -62 && x < -42 && z > -26 && z < -6) continue; tree(x, z); }
  // ---- área de construção (cena "construindo"): muro sendo erguido
  return w;
}
// blocos que surgem na cena de construção (lista em ordem)
export function buildSiteBlocks() {
  const list = []; const by = hOW(-40, 30) + 1;
  for (let y = 0; y < 4; y++) for (let x = 0; x < 7; x++) list.push([-44 + x, by + y, 30, y === 3 && x % 2 ? 'stone_bricks' : 'stone_bricks']);
  return { list, by };
}

export function lightingPreset(set, name) {
  const { sun, hemi, scene, skyO, amb } = set;
  const P = {
    golden: { sunCol: 0xffdcb4, sunI: 3.4, sunDir: [-0.62, 0.36, 0.7], top: 0x4a7fd6, hor: 0xffb27a, glow: 0xffa64d, hemiS: 0xd8d4ff, hemiG: 0x7a5a3a, hemiI: 1.1, fog: 0xe8b88e, fogN: 60, fogF: 230, exp: 1.12, stars: 0 },
    day: { sunCol: 0xfff3dd, sunI: 3.2, sunDir: [0.5, 0.85, 0.35], top: 0x3f78e0, hor: 0xa9cdf5, glow: 0xffffff, hemiS: 0xbfd8ff, hemiG: 0x5a4a30, hemiI: 1.0, fog: 0xb8d4f5, fogN: 70, fogF: 240, exp: 1.0, stars: 0 },
    night: { sunCol: 0xa8bcff, sunI: 1.8, sunDir: [0.35, 0.6, 0.72], top: 0x08102a, hor: 0x1f2f5a, glow: 0x6a7cbf, hemiS: 0x5a72c0, hemiG: 0x1a2030, hemiI: 1.0, fog: 0x15203d, fogN: 30, fogF: 140, exp: 1.3, stars: 1, moon: true },
  }[name];
  set.preset = P;
  sun.color.setHex(P.sunCol); sun.intensity = P.sunI; set.sunDir = new THREE.Vector3(...P.sunDir).normalize();
  skyO.u.top.value.setHex(P.top); skyO.u.hor.value.setHex(P.hor); skyO.u.glow.value.setHex(P.glow);
  hemi.color.setHex(P.hemiS); hemi.groundColor.setHex(P.hemiG); hemi.intensity = P.hemiI;
  scene.fog.color.setHex(P.fog); scene.fog.near = P.fogN; scene.fog.far = P.fogF;
  skyO.stars.material.opacity = P.stars; skyO.sun.visible = !P.moon; skyO.halo.visible = !P.moon; skyO.moon.visible = true;
  set.exposure = P.exp;
}
// enquadra a sombra do sol ao redor de um foco
export function aimSun(set, focus, radius = 14, cam) {
  const { sun } = set; const d = set.sunDir;
  sun.target.position.copy(focus); sun.position.copy(focus).addScaledVector(d, 80);
  const c = sun.shadow.camera; c.left = c.bottom = -radius; c.right = c.top = radius; c.near = 1; c.far = 200; c.updateProjectionMatrix();
  if (cam) set.skyO.place(cam, set.preset.moon ? new THREE.Vector3(0.3, 0.5, -1) : d, set.preset.moon ? new THREE.Vector3(0.3, 0.55, -1) : null);
}
export function makeOverworld() {
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xffffff, 60, 230);
  const world = buildOverworld(); const mesh = world.build(); scene.add(mesh);
  const sun = new THREE.DirectionalLight(0xffffff, 3); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1); scene.add(hemi);
  const skyO = sky(); scene.add(skyO.group); scene.add(clouds(3, 78));
  const set = { scene, world, mesh, sun, hemi, skyO };
  lightingPreset(set, 'golden'); return set;
}

// =============================== CAVERNA ===============================
export const CAVE_FLOOR = -32; // altura onde os personagens pisam
export function makeCave() {
  const w = new World(); const R = rng(66);
  const X0 = -40, X1 = 46, Y0 = -48, Y1 = -14, Z0 = -18, Z1 = 18;
  const carve = new Set(); const key = (x, y, z) => x + ',' + y + ',' + z;
  const F = CAVE_FLOOR - 1;
  const open = (x, y, z) => carve.add(key(x, y, z));
  // túnel principal ao longo de x
  for (let x = X0 + 2; x <= 30; x++) {
    const cz = Math.round(2.5 * Math.sin(x * 0.12)), r = 2.6 + 0.9 * Math.sin(x * 0.31) + 0.5 * Math.sin(x * 0.77);
    for (let z = cz - 5; z <= cz + 5; z++) for (let y = F + 1; y <= F + 8; y++) { const dy = (y - (F + 2.5)) / 1.5, dz = (z - cz) / 1.0; if (Math.hypot(dz, dy * 0.8) < r) open(x, y, z); }
  }
  // câmara do ataque: centro (14, F, 0)
  for (let x = 4; x <= 26; x++) for (let z = -10; z <= 10; z++) for (let y = F + 1; y <= F + 9; y++) {
    const d = Math.hypot((x - 15) / 10, (z) / 8.5, (y - (F + 1)) / 8.5); if (d < 1 + 0.08 * Math.sin(x * 1.3 + z)) open(x, y, z);
  }
  // corredor escuro de onde sai o zumbi (para +z, a partir da câmara)
  for (let z = 8; z <= 17; z++) for (let x = 18; x <= 21; x++) for (let y = F + 1; y <= F + 3; y++) open(x, y, z);
  const nearS = new Set();
  for (const k of carve) { const [cx, cy, cz] = k.split(',').map(Number); for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) for (let dz = -2; dz <= 2; dz++) nearS.add(key(cx + dx, cy + dy, cz + dz)); }
  for (const k of nearS) {
    if (carve.has(k)) continue; const [x, y, z] = k.split(',').map(Number);
    let id = y < F - 1 || (y < F + 3 && R() < 0.35) ? 'deepslate' : 'stone';
    const r = R();
    if (r < 0.025) id = 'coal_ore'; else if (r < 0.035) id = 'iron_ore'; else if (r < 0.04 && y < F + 3) id = 'diamond_ore'; else if (r < 0.06) id = 'gravel'; else if (r < 0.065) id = 'gold_ore';
    if (y === F && R() < 0.25) id = 'cobblestone';
    w.set(x, y, z, id);
  }
  // piso plano na câmara
  for (let x = 5; x <= 25; x++) for (let z = -8; z <= 8; z++) if (carve.has(key(x, F + 1, z))) w.set(x, F, z, w.get(x, F, z) || 'deepslate');
  // mina abandonada: suportes de madeira e trilhos
  for (const sx of [-14, -4, 6]) { const cz = Math.round(2.5 * Math.sin(sx * 0.12)); for (const dz of [-2, 2]) for (let y = F + 1; y <= F + 3; y++) if (carve.has(key(sx, y, cz + dz))) w.set(sx, y, cz + dz, 'oak_planks'); for (let dz = -2; dz <= 2; dz++) if (carve.has(key(sx, F + 4, cz + dz))) w.set(sx, F + 4, cz + dz, 'oak_planks'); }
  for (let x = -30; x <= 8; x++) { const cz = Math.round(2.5 * Math.sin(x * 0.12)); if (carve.has(key(x, F + 1, cz)) && w.get(x, F, cz) && R() < 0.85) w.set(x, F + 1, cz, 'rail'); }
  // teias pela caverna (esquecida)
  const webs = [[-12, F + 3, 1], [-11, F + 3, 2], [-5, F + 4, -2], [0, F + 3, 3], [9, F + 5, -6], [10, F + 6, -5], [22, F + 4, 6], [23, F + 5, -5], [24, F + 3, -4], [7, F + 2, 5], [20, F + 6, 2]];
  for (const [x, y, z] of webs) if (carve.has(key(x, y, z)) && !w.get(x, y, z)) w.set(x, y, z, 'cobweb');
  // a teia fatal (Philza fica preso): em (17, F+1, -2) e (17, F+2, -2)
  const TRAP = [17, F + 1, -2]; w.set(TRAP[0], TRAP[1], TRAP[2], 'cobweb');
  // baús/itens esquecidos
  w.set(-20, F + 1, Math.round(2.5 * Math.sin(-20 * 0.12)) - 2, 'chest');
  // poça de lava distante (luz quente)
  for (let x = 24; x <= 26; x++) for (let z = -7; z <= -5; z++) { w.set(x, F, z, 'lava'); }
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x020203); scene.fog = new THREE.Fog(0x020203, 6, 26);
  const mesh = w.build(); scene.add(mesh);
  const hemi = new THREE.HemisphereLight(0x50607a, 0x1a1410, 0.12); scene.add(hemi);
  // tochas de parede (com luz)
  const torches = [];
  for (const [x, y, z] of [[-24, F + 2, 3], [-9, F + 2, -3], [5, F + 2, -5], [25, F + 2, 6]]) { const t = torchModel(true, 4.5); t.position.set(x + .5, y, z + .5); scene.add(t); torches.push(t); }
  const lava = new THREE.PointLight(0xff6a1f, 6, 12, 1.5); lava.position.set(25.5, F + 1.5, -5.5); scene.add(lava);
  return { scene, world: w, mesh, hemi, torches, TRAP, F, exposure: 1.0 };
}

// ================================ END =================================
export function makeEnd() {
  const w = new World(); const R = rng(8);
  for (let x = -34; x <= 34; x++) for (let z = -34; z <= 34; z++) { const d = Math.hypot(x, z); if (d > 33 + 2 * Math.sin(x * 0.3) * Math.cos(z * 0.3)) continue; const h = Math.round(1.5 * Math.sin(x * 0.2) + 1.5 * Math.cos(z * 0.17)); const depth = Math.round((33 - d) * 0.5); for (let y = h - depth; y <= h; y++) w.set(x, y, z, 'end_stone'); }
  const pillars = [];
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = 22, px = Math.round(Math.cos(a) * r), pz = Math.round(Math.sin(a) * r), rad = 2 + (i % 3), top = 18 + (i * 7) % 22; for (let x = -rad; x <= rad; x++) for (let z = -rad; z <= rad; z++) if (Math.hypot(x, z) <= rad + 0.3) for (let y = 0; y <= top; y++) w.set(px + x, y, pz + z, 'obsidian'); w.set(px, top + 1, pz, 'bedrock'); pillars.push([px, top + 2, pz]); }
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0c0614); scene.fog = new THREE.Fog(0x140a22, 30, 140);
  scene.add(w.build());
  const sk = sky(); sk.u.top.value.setHex(0x120822); sk.u.hor.value.setHex(0x3c2160); sk.u.bot.value.setHex(0x05020a); sk.u.glow.value.setHex(0x000000); sk.stars.material.opacity = 0.8; sk.sun.visible = sk.halo.visible = sk.moon.visible = false; scene.add(sk.group);
  // cristais do End (brilho)
  for (const p of pillars) { const c = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.MeshBasicMaterial({ color: 0xff9fe8 })); c.position.set(p[0] + .5, p[1] + .6, p[2] + .5); c.rotation.set(.6, .6, 0); scene.add(c); const L = new THREE.PointLight(0xff7fe0, 5, 18, 1.5); L.position.copy(c.position); scene.add(L); }
  const sun = new THREE.DirectionalLight(0xd2c0ff, 2.2); sun.position.set(20, 40, 60); scene.add(sun);
  scene.add(new THREE.HemisphereLight(0x8a6ac0, 0x3a3a2a, 1.1));
  return { scene, skyO: sk, exposure: 1.05 };
}

// =============================== DEEP DARK ==============================
export function makeDeep() {
  const w = new World(); const R = rng(31);
  for (let x = -16; x <= 16; x++) for (let z = -16; z <= 10; z++) { w.set(x, -1, z, R() < 0.75 ? 'sculk' : 'deepslate'); w.set(x, -2, z, 'deepslate'); }
  for (let x = -16; x <= 16; x++) for (let y = 0; y < 14; y++) { w.set(x, y, -16, R() < 0.3 ? 'sculk' : 'deepslate'); }
  for (let z = -16; z <= 10; z++) for (let y = 0; y < 14; y++) { w.set(-16, y, z, R() < 0.3 ? 'sculk' : 'deepslate'); w.set(16, y, z, R() < 0.3 ? 'sculk' : 'deepslate'); }
  for (let i = 0; i < 14; i++) { const x = (R() * 28 - 14) | 0, z = -15 + (R() * 5 | 0); const h = 1 + (R() * 4 | 0); for (let y = 0; y < h; y++) w.set(x, y, z, 'deepslate'); }
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x010507); scene.fog = new THREE.Fog(0x02080b, 6, 30);
  scene.add(w.build());
  scene.add(new THREE.HemisphereLight(0x1f6a7a, 0x05080a, 0.35));
  const rim = new THREE.DirectionalLight(0x48d8e8, 1.4); rim.position.set(-6, 10, -8); scene.add(rim);
  const key = new THREE.PointLight(0x7fe8ff, 22, 18, 1.3); key.position.set(1.5, 4.5, 3); scene.add(key); const k2 = new THREE.DirectionalLight(0x9fdfff, 1.2); k2.position.set(4, 6, 10); scene.add(k2);
  return { scene, exposure: 1.1 };
}
