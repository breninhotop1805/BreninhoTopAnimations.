// Linha do tempo: "Ele perdeu tudo NO MINECRAFT..." — cada cena cortada no início exato da palavra-chave
import * as THREE from 'three';
import { World, BLOCKS } from './world.js';
import { TILE, ATLAS_SIZE, atlasTex } from './textures.js';
import { Character, loadSkin, zombieSkin, goldArmor, nameTag } from './character.js';
import { drawText } from './font.js';
import { drawHearts, drawBigHeart, drawDeath, vignette } from './hud.js';
import { E, seg, clamp, lerp, V, lv, noise, blink, P, mixP, idle, walk, shake, camLook, punch, faceTo } from './anim.js';
import { swordInHand, torchInHand, torchModel, creeper, enderDragon, warden, particles, balloon, itemMesh } from './models.js';
import { makeOverworld, makeCave, makeEnd, makeDeep, lightingPreset, aimSun, hOW, buildSiteBlocks, CAVE_FLOOR } from './sets.js';

let OW, CV, EN, DD, cam, W, H;
const PHIL_FACE = { eyes: [[9, 12, 2, 2], [13, 12, 2, 2]], skin: [249, 221, 200], lash: [96, 64, 44], mouth: [10, 14, 4] };

// bloco isolado centralizado na origem (com textura do atlas)
function singleBlock(id) { const w = new World(); w.set(0, 0, 0, id); const g = w.build(); g.children.forEach(m => m.geometry.translate(-.5, -.5, -.5)); return g; }

// ------------------------------------------------------------------ setup
export async function setup(ctx) {
  W = ctx.W; H = ctx.H;
  cam = new THREE.PerspectiveCamera(40, W / H, 0.05, 900);
  const philSkin = await loadSkin('../assets/philza.png');
  const mkPhil = () => { const c = new Character({ skin: philSkin, face: PHIL_FACE }); const tag = nameTag('Philza', drawText); tag.position.y = c.height + 0.32; c.root.add(tag); c.tag = tag; return c; };

  // ---- Superfície
  OW = makeOverworld();
  // separa o castelo num mundo próprio (para a cena em que ele é apagado)
  const castle = new World(); const keep = [];
  OW.world.forEach((x, y, z, id) => { if (x >= -25 && x <= 25 && z >= -44 && z <= -1 && y >= 7) keep.push([x, y, z, id]); });
  OW.world.forEach((x, y, z, id) => { if (y === 6 && id === 'cobblestone' && x >= -19 && x <= 19 && z >= -37 && z <= -7) keep.push([x, y, z, id]); });
  for (const [x, y, z, id] of keep) { castle.set(x, y, z, id); OW.world.set(x, y, z, y === 6 && id === 'cobblestone' ? 'grass' : null); }
  // poço vertical que leva à escuridão (transição "até que...")
  { const cx = 52, cz = -40, top = hOW(cx, cz); let r = 5; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    for (let y = -30; y <= top; y++) for (let x = cx - 3; x <= cx + 3; x++) for (let z = cz - 3; z <= cz + 3; z++) { const edge = x === cx - 3 || x === cx + 3 || z === cz - 3 || z === cz + 3; OW.world.set(x, y, z, edge ? (y < top - 3 ? (rnd() < .1 ? 'coal_ore' : (y < -10 ? 'deepslate' : 'stone')) : OW.world.get(x, y, z) || 'dirt') : null); }
    OW.shaft = [cx + .5, top, cz + .5]; }
  OW.scene.remove(OW.mesh); OW.mesh = OW.world.build(); OW.scene.add(OW.mesh);
  OW.castleWorld = castle; OW.castleMesh = castle.build(); OW.scene.add(OW.castleMesh);
  OW.castleList = keep;
  OW.phil = mkPhil(); OW.scene.add(OW.phil.root);
  OW.sword = swordInHand(); OW.phil.rHand.add(OW.sword);
  OW.z1 = new Character({ skin: zombieSkin() }); OW.z2 = new Character({ skin: zombieSkin() });
  OW.scene.add(OW.z1.root, OW.z2.root);
  OW.cr = creeper(); OW.scene.add(OW.cr.root);
  OW.boom = particles('smoke', 46, 11); OW.scene.add(OW.boom);
  OW.poof = particles('smoke', 22, 12); OW.scene.add(OW.poof);
  OW.dust = particles('dust', 30, 13); OW.scene.add(OW.dust);
  OW.flash = new THREE.PointLight(0xfff0d0, 0, 25, 1.5); OW.scene.add(OW.flash);
  // canteiro de obra
  const site = buildSiteBlocks(); OW.site = site; OW.siteBlocks = site.list.map(([x, y, z, id]) => { const b = singleBlock(id); b.position.set(x + .5, y + .5, z + .5); OW.scene.add(b); return b; });
  // castelo em instâncias (para encolher bloco a bloco)
  { const byId = {}; for (const b of keep) (byId[b[3]] = byId[b[3]] || []).push(b);
    OW.inst = [];
    for (const id in byId) {
      const geo = new THREE.BoxGeometry(1, 1, 1); const B = BLOCKS[id]; const uv = geo.attributes.uv; const S = ATLAS_SIZE;
      for (let f = 0; f < 6; f++) { const key = f === 2 ? (B.top || id) : f === 3 ? (B.bottom || B.side || id) : (B.side || id); const tk = TILE[key] ? key : (TILE[id] ? id : 'stone'); const [tx, ty] = TILE[tk]; for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, (tx + uv.getX(i) * 16) / S, 1 - (ty + (1 - uv.getY(i)) * 16) / S); } }
      const mat = B.t === 'c' || B.t === 'x' ? new THREE.MeshStandardMaterial({ map: atlasTex, roughness: .9, alphaTest: .5 }) : new THREE.MeshStandardMaterial({ map: atlasTex, roughness: .92 });
      const im = new THREE.InstancedMesh(geo, mat, byId[id].length); im.castShadow = im.receiveShadow = true; im.visible = false; im.userData.blocks = byId[id]; OW.scene.add(im); OW.inst.push(im);
    } }

  // ---- Caverna
  CV = makeCave();
  CV.phil = mkPhil(); CV.scene.add(CV.phil.root);
  CV.sword = swordInHand(); CV.phil.rHand.add(CV.sword);
  CV.torch = torchInHand(); CV.phil.lHand.add(CV.torch);
  CV.bz = new Character({ skin: zombieSkin(), headScale: 0.75, bodyScale: 0.5 }); goldArmor(CV.bz); CV.scene.add(CV.bz.root);
  CV.poof = particles('smoke', 26, 21); CV.scene.add(CV.poof);
  CV.dust = particles('dust', 30, 22); CV.scene.add(CV.dust);
  CV.gold = particles('gold', 18, 23); CV.scene.add(CV.gold);
  CV.webp = particles('web', 12, 24); CV.scene.add(CV.webp);
  CV.bal = balloon('!'); CV.scene.add(CV.bal);
  CV.glint = new THREE.PointLight(0xfff2c0, 0, 6, 1.5); CV.scene.add(CV.glint);
  CV.fill = new THREE.PointLight(0xffb066, 0, 10, 1.6); CV.scene.add(CV.fill);
  CV.rim = new THREE.SpotLight(0x8fb4ff, 0, 20, 0.6, 0.6, 1.2); CV.scene.add(CV.rim, CV.rim.target);
  // itens que caem na morte
  CV.drops = new THREE.Group(); CV.scene.add(CV.drops);
  { const s = itemMesh(...swordRows()); s.scale.setScalar(1 / 16 * 0.55); const sg = new THREE.Group(); sg.add(s); s.position.set(-0.25, 0, 0); CV.drops.add(sg);
    for (const id of ['gold_block', 'cobblestone', 'oak_planks', 'diamond_ore', 'oak_log']) { const b = singleBlock(id); b.scale.setScalar(0.25); const g = new THREE.Group(); g.add(b); CV.drops.add(g); } }

  EN = makeEnd(); EN.dragon = enderDragon(); EN.scene.add(EN.dragon.root);
  DD = makeDeep(); DD.warden = warden(); DD.scene.add(DD.warden.root);
}
function swordRows() {
  return [['.............ooo', '............oaao', '...........oabbo', '..........oabbo.', '.........oabbo..', '........oabbo...', '.......oabbo....', '......oabbo.....', '..oo.oabbo......', '..ogoabbo.......', '...oggbo........', '...ohgo.........', '..ohooog........', '.ohh...oo.......', 'ohh.............', 'oo..............'], { o: '#0b3a35', a: '#c9fff6', b: '#2fd9c3', g: '#1d5e57', h: '#6b4a24' }];
}

// ------------------------------------------------------------- helpers
const place = (ch, x, y, z, yaw = 0, rx = 0, rz = 0) => { ch.root.position.set(x, y, z); ch.root.rotation.set(rx, yaw, rz, 'YXZ'); ch.root.visible = true; };
const headAt = (ch, h = 1.6) => ch.root.position.clone().add(V(0, h, 0));
function hearts(t) { // vida (em corações) ao longo do vídeo
  const hits = [[33.2, 8.5], [34.48, 7], [35.52, 5], [36.08, 3.5], [38.7, 2.5], [45.6, 0]];
  let v = 10; for (const [tt, val] of hits) if (t >= tt) v = val; return v;
}
function lastHit(t) { const hits = [14.3, 33.2, 34.48, 35.52, 36.08, 38.7, 45.6]; let l = -9; for (const h of hits) if (t >= h) l = h; return t - l; }
const bump = (x, a, b) => { const k = clamp((x - a) / (b - a)); return Math.sin(Math.PI * k); }; // 0→1→0 suave
const hurtA = dt => dt >= 0 && dt < 0.5 ? (1 - dt / 0.5) * 0.9 : 0;
// golpe (swing) do braço direito: p 0..1 com preparação (levanta), golpe (overshoot) e volta suave
function swing(p) {
  p = clamp(p); let a;
  if (p < .25) a = -0.3 - 1.9 * E.out(p / .25);           // prepara: braço sobe
  else if (p < .55) a = -2.2 + 2.4 * E.out((p - .25) / .3); // golpe para frente/baixo
  else a = 0.2 - 0.55 * E.inOut((p - .55) / .45);           // acomoda
  return { rArm: [a, 0, -0.12], body: [0, -0.3 * Math.sin(Math.PI * p), 0] };
}
function zombiePose(t, seed = 0, run = 0, amp = .6) { const ph = t * (run ? 15 : 7) + seed; return P({ rArm: [-Math.PI / 2 + 0.1 + Math.sin(t * 2 + seed) * .06, 0, -0.06], lArm: [-Math.PI / 2 + 0.1 - Math.sin(t * 2 + seed) * .06, 0, 0.06], head: [0, Math.sin(t * .9 + seed) * .2, 0] }, run !== null ? { rLeg: [Math.sin(ph) * amp, 0, 0], lLeg: [-Math.sin(ph) * amp, 0, 0], bob: -Math.abs(Math.cos(ph)) * 0.5 } : {}); }
function hideAll(set) {
  const S = set; for (const k of ['phil', 'z1', 'z2', 'bz']) if (S[k]) S[k].root.visible = false;
  if (S.cr) S.cr.root.visible = false;
  for (const k of ['boom', 'poof', 'dust', 'gold', 'webp']) if (S[k]) S[k].userData.update(-1);
  if (S.bal) S.bal.visible = false; if (S.drops) S.drops.visible = false;
  if (S.flash) S.flash.intensity = 0; if (S.glint) S.glint.intensity = 0; if (S.fill) S.fill.intensity = 0; if (S.rim) S.rim.intensity = 0;
  if (S.sword) S.sword.visible = true; if (S.torch) S.torch.visible = true;
  if (S.siteBlocks) S.siteBlocks.forEach(b => b.visible = false);
  if (S.inst) { S.inst.forEach(i => i.visible = false); S.castleMesh.visible = true; }
  if (S.phil) { S.phil.hurt(0); S.phil.tag.visible = true; }
  if (S.bz) S.bz.hurt(0); if (S.z1) { S.z1.hurt(0); S.z2.hurt(0); }
}
function owFrame(focus, rad, extra = {}) { aimSun(OW, focus, rad, cam); return { scene: OW.scene, camera: cam, exposure: OW.exposure, ...extra }; }
function bubble(set, ch, u, at, h) { // balão "!" que pula
  if (u < at) return; const k = u - at; const s = k < .35 ? E.back(k / .35) : 1; set.bal.visible = true;
  set.bal.position.copy(ch.root.position).add(V(0, h + 0.62 + Math.sin(k * 7) * 0.025, 0)); set.bal.scale.set(0.26 * s, 0.33 * s, 1);
}
// tocha na mão do Philza (luz que tremula)
function torchFlicker(t) { const L = CV.torch.userData.torch.userData.light; L.intensity = 2.6 * (0.9 + 0.1 * noise(t * 9, 4)); }

// ===================================================== LISTA DE CENAS
// u = tempo local da cena, t = tempo global
const SH = [];
const shot = (t0, fn) => SH.push({ t0, fn });

// --- 01 "Imagine dedicar" — gancho: câmera voa até o Philza no topo do império (golden hour)
shot(0.00, (u, t) => {
  lightingPreset(OW, 'golden'); hideAll(OW);
  const ph = OW.phil; place(ph, 0.5, 35, -18.2, 0);
  const look = seg(u, 0.35, 0.95);
  ph.pose(P(idle(t, 1), { head: [0.05 - 0.1 * look, -0.55 + 0.55 * look, 0], blink: blink(t, 1), rArm: [-0.25, 0, -0.08] }));
  const k = seg(u, 0, 0.9, E.out);
  const p0 = V(9, 41, 10), p1 = V(1.6, 36.75, -14.6);
  const pos = lv(p0, p1, k); pos.y += Math.sin(u * 2) * 0.03;
  camLook(cam, pos, lv(V(0.5, 34, -18), V(0.4, 36.5, -18.2), k), 34 + (1 - k) * 18);
  return owFrame(ph.root.position, 14, { dof: k > .7 ? { focus: pos.distanceTo(headAt(ph)), aperture: 0.00018 } : null });
});
// --- 02 "5 anos de vida" — timelapse: sol e lua cruzam o céu várias vezes
shot(1.20, (u, t) => {
  hideAll(OW); lightingPreset(OW, 'day');
  const x = -30, z = 24, y = hOW(x, z) + 1; const ph = OW.phil; place(ph, x + .5, y, z + .5, 0.35);
  OW.sword.visible = false;
  ph.pose(P(idle(t, 2), { head: [-0.25 + 0.05 * Math.sin(u * 3), 0.3 * Math.sin(u * 2.2), 0], blink: blink(t, 2), rArm: [-0.2, 0, -0.08] }));
  const a = -0.6 + u * 4.3; // ângulo do sol
  const d = V(Math.cos(a), Math.sin(a), -0.35).normalize();
  const day = clamp(d.y * 3 + 0.3);
  OW.skyO.u.top.value.setHex(0x050914).lerp(new THREE.Color(0x3f78e0), day); OW.skyO.u.hor.value.setHex(0x1a2648).lerp(new THREE.Color(0xa9cdf5), day);
  OW.skyO.u.hor.value.lerp(new THREE.Color(0xff9a5a), clamp(1 - Math.abs(d.y) * 4) * 0.6);
  OW.sun.intensity = 0.3 + 3 * day; OW.sun.color.setHex(0xffe3b8); OW.hemi.intensity = 0.3 + 0.7 * day; OW.scene.fog.color.copy(OW.skyO.u.hor.value);
  OW.skyO.stars.material.opacity = 1 - day; OW.skyO.sun.visible = OW.skyO.halo.visible = true;
  OW.sunDir = d.y > 0 ? d : d.clone().negate();
  const pos = V(x + 2.6 - u * 0.35, y + 0.9, z + 4.4); camLook(cam, pos, V(x + 0.3, y + 1.9, z), 46);
  aimSun(OW, ph.root.position, 10, cam); OW.skyO.place(cam, d, d.clone().negate());
  return { scene: OW.scene, camera: cam, exposure: 1, dof: { focus: 4.6, aperture: 0.00012 } };
});
// --- 03 "a um único mundo" — guindaste: do rosto dele até revelar o mundo inteiro atrás
shot(2.40, (u, t) => {
  hideAll(OW); lightingPreset(OW, 'golden');
  const z = 9, y = hOW(0, z) + 1; const ph = OW.phil; place(ph, 0.5, y, z + .5, 0); OW.sword.visible = false;
  ph.pose(P(idle(t, 3), { head: [0.1 - 0.35 * seg(u, 0, 1.1), 0, 0], blink: blink(t, 3) }));
  const k = seg(u, 0, 1.28, E.inOut);
  const pos = lv(V(0.9, y + 1.6, z + 3.3), V(2.0, y + 4.6, z + 7.2), k);
  camLook(cam, pos, lv(V(0.5, y + 1.55, z), V(0.3, y + 2.5, z - 20), k), 48);
  return owFrame(V(0, y, z - 10), 30);
});
// --- 04 "Construindo" — Philza erguendo um muro bloco a bloco
shot(3.68, (u, t) => {
  hideAll(OW); lightingPreset(OW, 'golden'); const { list, by } = OW.site; const ph = OW.phil;
  OW.sword.visible = false;
  const B = V(-41.5, by + 1.5, 30.5); const pp = V(-38.9, by, 31.7); const yb = faceTo(pp, B);
  place(ph, pp.x, pp.y, pp.z, yb + 0.35);
  const rate = 0.13, n0 = 10; const shown = Math.min(list.length, n0 + Math.floor(u / rate));
  OW.siteBlocks.forEach((b, i) => { b.visible = i < shown; const age = u - (i - n0) * rate; const s = i < n0 ? 1 : clamp(E.back(clamp(age / 0.12))); b.scale.setScalar(Math.max(0.001, s)); });
  const sp = (u % rate) / rate; const sw = Math.sin(sp * Math.PI);
  ph.pose(P(idle(t, 4, .6), { rArm: [-0.75 - sw * 0.55, 0, -0.12], head: [0.22, -0.45, 0], body: [0, -0.35 - 0.1 * sw, 0], blink: blink(t, 4) }));
  const camP = V(-42.3, by + 1.45, 35.2);
  camLook(cam, camP.clone().add(V(u * 0.25, u * 0.06, -u * 0.15)), V(-40.3, by + 1.25, 31.2), 46);
  return owFrame(pp, 10, { dof: { focus: 4.0, aperture: 0.00015 } });
});
// --- 05 "impérios colossais" — contra-plongée: castelo gigante atrás dele
shot(4.88, (u, t) => {
  hideAll(OW); lightingPreset(OW, 'golden'); const ph = OW.phil;
  const y = hOW(4, 1) + 1; place(ph, 4.5, y, 1.5, 0.35); OW.sword.visible = false;
  ph.pose(P(idle(t, 5), { head: [-0.42, 0.55, 0], blink: blink(t, 5), rArm: [0, 0, -0.12], lArm: [0, 0, 0.12] }));
  const pos = V(5.9 - u * 0.3, y + 0.45, 4.6 + u * 0.25);
  camLook(cam, pos, V(2.4, y + 6.5 + u * 1.5, -12), 56, -0.04);
  return owFrame(V(0, 10, -18), 32);
});
// --- 06 "e sobrevivendo" — noite: zumbis e creeper cercando, espada pronta
shot(5.68, (u, t) => {
  hideAll(OW); lightingPreset(OW, 'night'); const ph = OW.phil;
  const x = -52, z = -16, y = hOW(x, z) + 1; place(ph, x + .5, y, z + .5, 0);
  const look = Math.sin(u * 3.2) * 0.5;
  ph.pose(P(idle(t, 6, 1.4), { rArm: [-0.55, 0, -0.12], head: [0.05, look, 0], body: [0.06, 0, 0], brow: 'angry', blink: blink(t, 6), rLeg: [-0.15, 0, 0], lLeg: [0.2, 0, 0] }));
  const z1p = V(x + 3.2 - u * 0.55, y, z + 1.2 + u * 0.1), z2p = V(x - 2.6 + u * 0.5, y, z - 0.3 + u * 0.15);
  place(OW.z1, z1p.x, hOW(Math.floor(z1p.x), Math.floor(z1p.z)) + 1, z1p.z, faceTo(z1p, ph.root.position)); OW.z1.pose(zombiePose(t, 1));
  place(OW.z2, z2p.x, hOW(Math.floor(z2p.x), Math.floor(z2p.z)) + 1, z2p.z, faceTo(z2p, ph.root.position)); OW.z2.pose(zombiePose(t, 2));
  const cp = V(x - 1.2, 0, z - 3.6 + u * 0.4); OW.cr.root.visible = true; OW.cr.root.position.set(cp.x, hOW(Math.floor(cp.x), Math.floor(cp.z)) + 1, cp.z); OW.cr.root.rotation.y = faceTo(cp, ph.root.position);
  const cw = Math.sin(t * 9) * .5; OW.cr.legs.forEach((l, i) => l.rotation.x = (i % 2 ? cw : -cw)); OW.cr.swell(0);
  const pos = V(x + 0.5 + Math.sin(u * .5) * .3, y + 1.25, z + 5.2 - u * 0.5);
  camLook(cam, pos, V(x + 0.5, y + 1.15, z), 50);
  shake(cam, t, 0.004);
  return owFrame(ph.root.position, 12, { bloom: 0.5 });
});
// --- 07 "impossível" — golpe de espada + explosão do creeper (flash, fumaça)
shot(6.80, (u, t) => {
  hideAll(OW); lightingPreset(OW, 'night'); const ph = OW.phil;
  const x = -52, z = -16, y = hOW(x, z) + 1;
  const jump = seg(u, 0.32, 0.62, E.out);
  const pp = V(x + .5 + 0.6 * jump, y + Math.sin(Math.PI * clamp((u - .32) / .4)) * 0.55, z + .5 + 1.4 * jump);
  place(ph, pp.x, pp.y, pp.z, -0.25 + 0.4 * jump);
  const sw = swing(clamp(u / 0.32));
  ph.pose(P(idle(t, 7, 1.4), sw, { head: [0.1 - 0.25 * jump, 0.4 * jump, 0], brow: 'angry', mouth: u > .3 ? 1 : 0, lArm: [-0.6 * jump, 0, 0.12 + 0.4 * jump], rLeg: [-0.5 * jump, 0, 0], lLeg: [0.4 * jump, 0, 0] }));
  // zumbi atingido
  const zh = u - 0.18; const zp = V(x + 1.9 + (zh > 0 ? E.out(clamp(zh / .4)) * 1.3 : 0), y + (zh > 0 ? Math.sin(Math.PI * clamp(zh / .4)) * .35 : 0), z + 1.5);
  place(OW.z1, zp.x, zp.y, zp.z, faceTo(zp, ph.root.position)); OW.z1.pose(zombiePose(t, 1)); OW.z1.hurt(hurtA(zh));
  // explosão do creeper atrás
  const ex = u - 0.36; const ec = V(x - 1.2, y + 0.8, z - 2.6);
  OW.cr.root.visible = ex < 0; if (ex < 0) { OW.cr.root.position.set(ec.x, y, ec.z); OW.cr.root.rotation.y = faceTo(ec, pp); OW.cr.swell(clamp((u - 0.05) / 0.31)); }
  OW.boom.position.copy(ec); OW.boom.userData.update(ex, 3.2, 1.6);
  OW.flash.position.copy(ec).add(V(0, 1, 0)); OW.flash.intensity = ex > 0 ? 40 * Math.exp(-ex * 9) : 0;
  const pos = V(x + 0.9, y + 1.25, z + 5.6 - u * 0.4); camLook(cam, pos, V(x + 0.3, y + 1.0, z - 0.4), 50);
  shake(cam, t, ex > 0 ? 0.09 * Math.exp(-ex * 5) : 0.003);
  return owFrame(pp, 12, { bloom: 0.6, exposure: OW.exposure + (ex > 0 ? 0.25 * Math.exp(-ex * 8) : 0) });
});
// --- 08 "sob a regra" — close sério, corações do hardcore surgem no HUD
const keepPos = () => V(0.5, 35, -18.2);
function hudHearts(t, from, opts = {}) {
  return (g, W, H) => { const a = clamp((t - from) / 0.25); if (a <= 0) return; g.globalAlpha = a; const pop = 1 + 0.2 * (1 - E.back(a));
    drawHearts(g, W / 2, H * 0.80, 7 * pop, hearts(t), { hardcore: true, ...opts }); g.globalAlpha = 1; };
}
shot(7.52, (u, t) => {
  hideAll(OW); lightingPreset(OW, 'golden'); const ph = OW.phil; const p = keepPos(); place(ph, p.x, p.y, p.z, 0.15);
  ph.pose(P(idle(t, 8), { head: [0.06, -0.12 + 0.12 * seg(u, 0, .6), 0], brow: u > .4 ? 'angry' : null, blink: blink(t, 8), rArm: [-0.2, 0, -0.08] }));
  const pos = V(1.1, 36.6, -15.3).add(V(0, 0, -u * 0.35)); camLook(cam, pos, V(0.55, 36.62, -18.2), 32);
  return owFrame(p, 10, { dof: { focus: pos.distanceTo(headAt(ph, 1.62)), aperture: 0.0002 }, hud: hudHearts(t, 7.92) });
});
// --- 09 "mais cruel de todas" — punch-in, corações pulsando
shot(8.64, (u, t) => {
  hideAll(OW); lightingPreset(OW, 'golden'); const ph = OW.phil; const p = keepPos(); place(ph, p.x, p.y, p.z, 0.15);
  ph.pose(P(idle(t, 8, .5), { head: [0.12, 0.02, 0], brow: 'angry', blink: blink(t, 9) }));
  const pos = V(0.85, 36.65, -15.75 - 0.25 * seg(u, 0, 1.2)); camLook(cam, pos, V(0.55, 36.62, -18.2), 30 * punch(u, 0, 0.22));
  const pulse = Math.max(0, Math.sin((u * 2.4) * Math.PI * 2));
  return owFrame(p, 10, { dof: { focus: 2.35, aperture: 0.00025 }, hud: (g, W, H) => { vignette(g, W, H, 0.45, '40,0,0'); drawHearts(g, W / 2, H * 0.80, 7, 10, { hardcore: true, pulse }); } });
});
// --- 10 "Uma única vida" — um único coração do hardcore gigante pulsando
shot(9.92, (u, t) => {
  hideAll(OW); lightingPreset(OW, 'golden'); const ph = OW.phil; const p = keepPos(); place(ph, p.x, p.y, p.z, 0.15);
  ph.pose(P(idle(t, 8, .5), { head: [0.1, 0, 0], blink: blink(t, 10) }));
  camLook(cam, V(0.85, 36.5, -15.6), V(0.55, 36.5, -18.2), 36);
  const beat = k => { const x = (k % 0.62) / 0.62; return Math.exp(-x * 9) + 0.5 * Math.exp(-Math.abs(x - 0.22) * 22); };
  return owFrame(p, 10, { dof: { focus: 0.6, aperture: 0.0012, maxblur: 0.012 }, exposure: 0.75, hud: (g, W, H) => {
    vignette(g, W, H, 0.7); const a = clamp(u / 0.18); const s = (26 + 4 * beat(u + 0.2)) * (0.6 + 0.4 * E.back(a)); g.globalAlpha = a; drawBigHeart(g, W / 2, H * 0.47, s); g.globalAlpha = 1; } });
});
// --- 11 "se sentia invencível" — ergue a espada, contra-luz dourada
shot(11.20, (u, t) => {
  hideAll(OW); lightingPreset(OW, 'golden'); const ph = OW.phil; const p = keepPos(); place(ph, p.x, p.y, p.z, -0.2);
  const up = seg(u, 0.62, 1.05, E.back);
  ph.pose(P(idle(t, 11), { rArm: [-0.3 - 2.55 * up, 0, -0.1 - 0.15 * up], head: [-0.25 * up, -0.1, 0], body: [-0.05 * up, 0, 0], mouth: up > .5 ? 1 : 0, blink: blink(t, 11), lArm: [0, 0, 0.12 + 0.1 * up] }));
  const pos = V(2.2 - u * 0.5, 34.6, -14.6); camLook(cam, pos, V(0.4, 36.6, -18.4), 46, 0.04);
  return owFrame(p, 10, { bloom: 0.55, dof: { focus: 4.4, aperture: 0.00012 } });
});
// --- 12 "uma verdadeira lenda" — órbita no topo da torre
shot(12.80, (u, t) => {
  hideAll(OW); lightingPreset(OW, 'golden'); const ph = OW.phil; const p = keepPos(); place(ph, p.x, p.y, p.z, 0);
  ph.pose(P(idle(t, 12), { rArm: [-0.35, 0, -0.1], lArm: [0.15, 0, 0.5], head: [-0.05, 0.1 * Math.sin(u), 0], blink: blink(t, 12) }));
  const a = 0.95 - u * 0.75; const r = 4.1;
  const pos = V(p.x + Math.sin(a) * r, 36.4 + u * 0.15, p.z + Math.cos(a) * r); camLook(cam, pos, V(p.x, 36.15, p.z), 44);
  return owFrame(p, 12, { dof: { focus: r, aperture: 0.00012 } });
});
// --- 13 "nada poderia derrubar" — zumbi ataca, ele nem se abala e derruba o zumbi
shot(14.00, (u, t) => {
  hideAll(OW); lightingPreset(OW, 'golden'); const ph = OW.phil;
  const x = 8.5, z = 4.5, y = hOW(8, 4) + 1;
  const turn = seg(u, 0.36, 0.62); place(ph, x, y, z, 0.2 - 1.25 * turn);
  const hitT = u - 0.3, slash = clamp((u - 0.5) / 0.35);
  ph.hurt(hurtA(hitT) * 0.5);
  ph.pose(P(idle(t, 13), u > 0.5 ? swing(slash) : { rArm: [-0.35, 0, -0.1] }, { head: [0, -0.5 * turn + 0.4 * (1 - turn) * seg(u, 0.25, .36), 0], brow: u > .4 ? 'angry' : null, blink: blink(t, 13), body: [hitT > 0 && hitT < .15 ? 0.04 : 0, 0, 0] }));
  const zk = seg(u, 0, 0.3, E.lin); const kt = u - 0.72;
  const zp = V(x - 3.2 + 1.7 * zk - (kt > 0 ? E.out(clamp(kt / .4)) * 1.4 : 0), y, z + 0.4);
  const die = clamp((u - 0.95) / 0.32);
  place(OW.z1, zp.x, y + (kt > 0 ? Math.sin(Math.PI * clamp(kt / .35)) * .3 : 0), zp.z, Math.PI / 2, 0, -Math.PI / 2 * E.in(die));
  const za = bump(u, 0.18, 0.42); OW.z1.pose(P(zombiePose(t, 3, 1, 0.6 * (1 - seg(u, 0.22, 0.4))), { rArm: [-0.3 * za, 0, 0], lArm: [-0.3 * za, 0, 0] })); OW.z1.hurt(Math.max(hurtA(kt), die > 0 ? 0.9 : 0));
  OW.z1.root.visible = u < 1.3;
  OW.poof.position.set(zp.x, y + .3, zp.z); OW.poof.userData.update(u - 1.27, 0.8, 1);
  const pos = V(x + 1.1, y + 1.35, z + 4.0 - u * 0.3); camLook(cam, pos, V(x - 0.6, y + 1.0, z + 0.2), 52);
  shake(cam, t, kt > 0 && kt < .3 ? 0.03 : 0);
  return owFrame(ph.root.position, 10, { dof: { focus: 5, aperture: 0.0001 } });
});
// --- 14 "Até que," — mergulho no poço escuro
shot(15.36, (u, t) => {
  hideAll(OW); lightingPreset(OW, 'golden'); const [sx, top, sz] = OW.shaft;
  const k = seg(u, 0, 0.64, E.in);
  const pos = V(sx + 0.3, top + 6 - k * 24, sz + 3 - k * 3); camLook(cam, pos, V(sx, top - 30, sz - 0.3), 60, k * 0.6);
  return owFrame(V(sx, top, sz), 20, { fade: clamp((u - 0.2) / 0.44) });
});
// --- 15 "no fundo de uma caverna escura" — caminhando com a tocha
const tz = x => 2.5 * Math.sin(x * 0.12) + 0.5;
function cvFrame(extra = {}) { return { scene: CV.scene, camera: cam, exposure: CV.exposure, bloom: 0.55, bloomThreshold: 0.8, ...extra }; }
shot(16.00, (u, t) => {
  hideAll(CV); const ph = CV.phil; const Y = CAVE_FLOOR;
  const x = -20 + u * 2.3; const z = tz(x); place(ph, x, Y, z, Math.PI / 2 + Math.atan(0.3 * Math.cos(x * 0.12)) * 0.6);
  ph.pose(P(walk(u * 7.8, 0.55, 0.0), { lArm: [-0.75, 0, 0.32], rArm: [-0.25 - Math.sin(u * 7.8) * .3, 0, -0.08], head: [0.08, 0.25 * Math.sin(u * 1.6), 0], blink: blink(t, 15) }));
  torchFlicker(t);
  const cx = x + 3.4 - u * 0.25; const pos = V(cx, Y + 1.5, tz(cx) - 0.6); camLook(cam, pos, V(x, Y + 1.3, z), 46);
  return cvFrame({ dof: { focus: 3.4, aperture: 0.00015 }, fade: 1 - clamp(u / 0.3) });
});
// --- 16 "e esquecida" — teias, trilhos e suportes de mina abandonada
shot(17.52, (u, t) => {
  hideAll(CV); const ph = CV.phil; const Y = CAVE_FLOOR;
  const x = -17.5 + u * 2.3; const z = tz(x); place(ph, x, Y, z, Math.PI / 2);
  ph.pose(P(walk((u + 1.52) * 7.8, 0.55, 0.0), { lArm: [-0.75, 0, 0.32], rArm: [-0.25, 0, -0.08], head: [0.05, -0.4, 0], blink: blink(t, 16) }));
  torchFlicker(t);
  const cx = -11.2 - u * 0.5; const pos = V(cx, Y + 2.3, tz(cx) + 1.1); camLook(cam, pos, V(x, Y + 1.2, z), 50);
  return cvFrame({ dof: { focus: 3, aperture: 0.0001 } });
});
// --- 17 "o impensável aconteceu" — ele para, escuta algo e vira a cabeça; "!" salta
shot(18.32, (u, t) => {
  hideAll(CV); const ph = CV.phil; const Y = CAVE_FLOOR;
  const dec = clamp(u / 0.45); const x = 13.2 + 0.9 * E.out(dec); place(ph, x, Y, 1.6, Math.PI / 2 - 0.3 * seg(u, 0.1, 0.5));
  const wp = u * 7.8 * (1 - dec * 0.5); const wa = 0.5 * (1 - E.out(dec));
  const turn = seg(u, 0.5, 0.95);
  ph.pose(P(walk(wp, wa, 0), idle(t, 17, dec), { lArm: [-0.75, 0, 0.32], rArm: [-0.35, 0, -0.08], head: [0.05, -0.75 * turn, 0], blink: u > 0.85 && u < 0.92 ? 1 : 0, brow: turn > .5 ? 'sad' : null }));
  torchFlicker(t); bubble(CV, ph, u, 0.88, ph.height);
  const pos = V(x + 2.0, Y + 1.8, 4.3); camLook(cam, pos, V(x, Y + 1.85, 1.6), 40 * punch(u, 0.88, 0.15));
  CV.fill.position.set(x + 1.5, Y + 2.2, 3.8); CV.fill.intensity = 1.6;
  return cvFrame({ dof: { focus: 2.7, aperture: 0.00025 } });
});
// --- 18 "O fim não veio por um dragão" — no End, o dragão vem rugindo
shot(19.92, (u, t) => {
  const D = EN.dragon; D.root.visible = true;
  const k = u / 1.52;
  D.animate(t, seg(u, 1.0, 1.25, E.back));
  const C = V(-15.5, 25 + u * 0.4, 38.5); const P0 = V(4, 31, -12), P1 = C.clone().add(V(4, 2, -16));
  D.root.position.copy(lv(P0, P1, E.out(k * 0.95))); D.root.position.y += Math.sin(t * 4.2 + 1.2) * 0.25; D.root.rotation.set(0.12, faceTo(D.root.position, C) + 0.25, -0.12 + 0.1 * Math.sin(u * 2), 'YXZ');
  camLook(cam, C, D.root.position.clone().add(V(0, 0.5, 2)), 52 * punch(u, 1.12, 0.15));
  shake(cam, t, u > 1.12 ? 0.05 : 0.008);
  return { scene: EN.scene, camera: cam, exposure: EN.exposure, bloom: 0.8, bloomThreshold: 0.7 };
});
// --- 19 "ou um monstro gigante" — o Warden ruge (Deep Dark)
shot(21.44, (u, t) => {
  const Wd = DD.warden; Wd.root.position.set(0, 0, -4); Wd.root.rotation.y = 0.15;
  const roar = seg(u, 0.55, 0.8, E.back) * (1 - seg(u, 1.05, 1.2));
  Wd.animate(t, roar);
  const pos = V(1.4, 1.2 + u * 0.1, 3.2 - u * 0.3); camLook(cam, pos, V(0, 2.4, -4), 54 * punch(u, 0.64, 0.14), -0.05);
  shake(cam, t, roar * 0.05);
  return { scene: DD.scene, camera: cam, exposure: DD.exposure, bloom: 0.9, bloomThreshold: 0.6 };
});
// --- 20 "mas sim das sombras" — corredor escuro, um brilho dourado lá no fundo
shot(22.64, (u, t) => {
  hideAll(CV); const Y = CAVE_FLOOR; const bz = CV.bz;
  place(bz, 19.9, Y, 15.5, Math.PI); bz.pose(P(zombiePose(t, 4, null), { head: [0.1, 0, 0] }));
  CV.glint.position.set(19.9, Y + 0.9, 14.6); CV.glint.intensity = u > 0.6 ? 1.6 * Math.pow(Math.max(0, Math.sin((u - 0.6) * 5)), 6) : 0;
  CV.fill.position.set(18.5, Y + 1.6, 6.5); CV.fill.intensity = 0.35;
  const pos = V(19.6, Y + 1.15, 6.4 + u * 1.1); camLook(cam, pos, V(19.9, Y + 0.85, 15), 40);
  return cvFrame({ exposure: 1.1, bloom: 0.9, bloomThreshold: 0.55 });
});
// --- 21 "de onde saltou" — o zumbi bebê pula da escuridão
shot(23.84, (u, t) => {
  hideAll(CV); const Y = CAVE_FLOOR; const bz = CV.bz;
  const run = clamp(u / 0.4); const jp = clamp((u - 0.4) / 0.4);
  const zp = V(19.6 + 0.4 * jp, Y + Math.sin(Math.PI * jp) * 0.9, 14.5 - run * 5.2 - jp * 3.2);
  place(bz, zp.x, zp.y, zp.z, Math.PI);
  const jj = Math.sin(Math.PI * jp); bz.pose(P(zombiePose(t, 5, 1, .9 * (1 - seg(u, 0.32, 0.45))), { rLeg: [-0.6 * jj, 0, 0], lLeg: [0.5 * jj, 0, 0], rArm: [-0.75 * jj, 0, 0], lArm: [-0.75 * jj, 0, 0] }));
  CV.fill.position.set(19, Y + 1.6, 6); CV.fill.intensity = 2.2;
  CV.dust.position.set(19.8, Y, 10.2); CV.dust.userData.update(u - 0.38, 0.7, 0.4);
  const pos = V(18.9, Y + 0.65, 5.4); camLook(cam, pos, zp.clone().add(V(0, 0.55, 0)), 52 * punch(u, 0.4, 0.2));
  shake(cam, t, jp > 0.85 ? 0.03 : 0.004);
  return cvFrame({ bloom: 0.7 });
});
// --- 22 "o maior terror de qualquer jogador" — susto: pulo pra trás, queixo cai, "!"
shot(24.64, (u, t) => {
  hideAll(CV); const ph = CV.phil; const Y = CAVE_FLOOR;
  const jb = seg(u, 0.12, 0.42, E.out); const hop = Math.sin(Math.PI * clamp((u - .12) / .3)) * 0.35;
  place(ph, 15.5, Y + hop, 2.6 - 0.7 * jb, 0.25);
  const scare = seg(u, 0.1, 0.32, E.back); const tremble = u > .5 ? Math.sin(t * 38) * 0.02 : 0;
  ph.pose(P(idle(t, 22, 1.6), { rArm: [-0.4 - 1.2 * scare, 0, -0.25 * scare], lArm: [-1.0 - 0.8 * scare, 0, 0.25 * scare], head: [0.35 * seg(u, 0.6, 1.1) - 0.15 * scare + tremble, tremble, 0], body: [-0.12 * scare, 0, 0], mouth: scare > .3 ? 2 : 0, brow: 'sad', blink: 0, rLeg: [0.25 * jb, 0, 0], lLeg: [-0.2 * jb, 0, 0] }));
  torchFlicker(t); bubble(CV, ph, u, 0.15, ph.height); CV.fill.position.set(16.4, Y + 2.2, 4.2); CV.fill.intensity = 4.5;
  const pos = V(16.4, Y + 1.6, 6.4 - 0.3 * seg(u, 0.32, 0.6)); camLook(cam, pos, V(15.5, Y + 1.75, 2.1), 42 * punch(u, 0.32, 0.2));
  shake(cam, t, u > .12 && u < .5 ? 0.025 : 0.004);
  return cvFrame({ dof: { focus: 3.2, aperture: 0.0002 } });
});
// --- 23 "Um minúsculo filhote de zumbi" — câmera no chão, zumbi pequenino encarando
shot(26.56, (u, t) => {
  hideAll(CV); const ph = CV.phil; const bz = CV.bz; const Y = CAVE_FLOOR;
  place(ph, 14.4, Y, 0.2, 0.5); ph.pose(P(idle(t, 23, 1.3), { rArm: [-0.6, 0, -0.1], lArm: [-0.9, 0, 0.1], head: [0.45, 0, 0], brow: 'sad', blink: blink(t, 23) }));
  torchFlicker(t); ph.tag.visible = false;
  place(bz, 15.9, Y, 3.4, Math.PI - 0.15 + 0.1 * Math.sin(u * 2)); bz.pose(P(zombiePose(t, 6, null), { head: [0.15 * Math.sin(u * 2.4), 0.3 * Math.sin(u * 1.7), 0.18 * Math.sin(u * 3.1)], bob: Math.abs(Math.sin(u * 5)) * 0.6 }));
  CV.fill.position.set(16.6, Y + 1.5, 1.6); CV.fill.intensity = 1.3;
  const s = seg(u, 0.72, 2.0);
  const pos = V(15.6 + 0.7 * s, Y + 0.32, 1.25 + 0.1 * s); camLook(cam, pos, V(15.9, Y + 0.72, 3.4), 50 * punch(u, 0.16, 0.2));
  return cvFrame({ dof: { focus: pos.distanceTo(V(15.9, Y + .5, 3.4)), aperture: 0.00028 } });
});
// --- 24 "incrivelmente rápido" — corrida em alta velocidade, travelling lateral
shot(28.56, (u, t) => {
  hideAll(CV); const bz = CV.bz; const Y = CAVE_FLOOR;
  const x = -2 + u * 7.2; const z = tz(x); place(bz, x, Y, z, Math.PI / 2);
  bz.pose(P(zombiePose(t, 7, 1, 0.75), { body: [0.18, 0, 0], head: [-0.15, 0, 0] }));
  CV.dust.position.set(-2 + 0.55 * 7.2 - 0.6, Y, tz(-2 + 0.55 * 7.2)); CV.dust.userData.update(u - 0.55, 0.6, 0.35);
  CV.fill.position.set(x + 1, Y + 1.5, z + 1.5); CV.fill.intensity = 1.6;
  const pos = V(x + 0.35, Y + 0.55, z + 2.7); camLook(cam, pos, V(x + 0.2, Y + 0.6, z), 48);
  shake(cam, t, 0.01);
  return cvFrame({ dof: { focus: 2.7, aperture: 0.00025 } });
});
// --- 25 "brilhando em uma armadura de ouro" — close, reflexo correndo pelo ouro
shot(29.68, (u, t) => {
  hideAll(CV); const bz = CV.bz; const Y = CAVE_FLOOR;
  place(bz, 16, Y, 3.3, Math.PI - 0.35); bz.pose(P(zombiePose(t, 8, null), { head: [-0.12, 0.25 * Math.sin(u * 1.3), 0] }));
  const sweep = -1.5 + u * 2.2; CV.glint.position.set(16 + sweep, Y + 1.0, 2.2); CV.glint.intensity = 2.2;
  CV.fill.position.set(15.2, Y + 1.2, 1.9); CV.fill.intensity = 0.9;
  CV.gold.position.set(16, Y + 0.6, 3.3); CV.gold.userData.update(u - 1.26, 0.6, 0.8);
  const pos = V(16.6 - u * 0.15, Y + 0.78, 1.9); camLook(cam, pos, V(16.05, Y + 0.68, 3.3), 40 * punch(u, 1.28, 0.12));
  return cvFrame({ bloom: 0.7, bloomThreshold: 0.75, dof: { focus: 1.5, aperture: 0.0004 } });
});
// --- 26 "O que parecia uma piada" — Philza ri e aponta
shot(31.36, (u, t) => {
  hideAll(CV); const ph = CV.phil; const Y = CAVE_FLOOR;
  place(ph, 15.4, Y, 1.4, 0.3);
  const laugh = seg(u, 0.25, 0.5); const ha = Math.sin(t * 26);
  ph.pose(P(idle(t, 26), { rArm: [-0.4 + 0.2 * ha * laugh, 0, -0.1 - 0.3 * laugh], lArm: [-1.25 * laugh, 0, 0.12 + 0.2 * laugh], head: [-0.25 * laugh + 0.06 * ha * laugh, 0.15, 0], body: [-0.12 * laugh + 0.03 * ha * laugh, 0, 0], mouth: laugh > .3 ? (ha > 0 ? 2 : 1) : 0, blink: laugh > .3 ? 1 : blink(t, 26), bob: 0.4 * Math.abs(ha) * laugh }));
  CV.torch.visible = false; torchFlicker(t);
  CV.fill.position.set(16.2, Y + 1.8, 3.6); CV.fill.intensity = 3.5;
  const pos = V(16.1, Y + 1.45, 4.6 - u * 0.25); camLook(cam, pos, V(15.4, Y + 1.35, 1.4), 40);
  return cvFrame({ dof: { focus: 3.3, aperture: 0.0002 } });
});
// --- 27 "virou um pesadelo em poucos segundos" — o zumbi avança e acerta
shot(32.72, (u, t) => {
  hideAll(CV); const ph = CV.phil; const bz = CV.bz; const Y = CAVE_FLOOR;
  const h1 = t - 33.2, h2 = t - 34.48;
  const kb = (h1 > 0 ? E.out(clamp(h1 / .3)) * 0.45 : 0) + (h2 > 0 ? E.out(clamp(h2 / .3)) * 0.4 : 0);
  place(ph, 15.4, Y, 1.4 - kb, 0.1); ph.hurt(Math.max(hurtA(h1), hurtA(h2)));
  const shock = seg(u, 0.4, 0.65);
  ph.pose(P(idle(t, 27, 1.5), { rArm: [-0.5, 0, -0.15], lArm: [-0.9, 0, 0.15], head: [0.4 * shock, 0, 0], mouth: shock > .5 ? 2 : 0, brow: 'sad', blink: 0, body: [(h1 > 0 && h1 < .15) || (h2 > 0 && h2 < .15) ? -0.1 : 0, 0, 0] }));
  torchFlicker(t);
  const run = seg(u, 0, 0.45, E.lin); const zp = V(15.6, Y, 4.6 - 2.0 * run - kb * 0.8);
  const lg = Math.max(bump(h1, -0.15, 0.2), bump(h2, -0.15, 0.2));
  place(bz, zp.x, Y + 0.18 * lg, zp.z, Math.PI);
  bz.pose(P(zombiePose(t, 9, 1, .9 * (1 - seg(u, 0.38, 0.5))), { rArm: [-0.55 * lg, 0, 0], lArm: [-0.55 * lg, 0, 0] }));
  CV.fill.position.set(17, Y + 1.8, 4.5); CV.fill.intensity = 2.5;
  const pos = V(17.4 - u * 0.2, Y + 1.2, 5.2); camLook(cam, pos, V(15.5, Y + 0.95, 2.4), 46, 0.12 * seg(u, 0.4, 0.8));
  shake(cam, t, (h1 > 0 && h1 < .3) || (h2 > 0 && h2 < .3) ? 0.05 : 0.004);
  return cvFrame({ hud: hudHearts(t, 32.72, { flash: hurtA(lastHit(t)) > .5 ? 1 : 0 }), dof: { focus: 3.6, aperture: 0.00015 } });
});
// --- 28 "Cada golpe doía" — close; cada golpe com flash vermelho e corações caindo
shot(35.20, (u, t) => {
  hideAll(CV); const ph = CV.phil; const bz = CV.bz; const Y = CAVE_FLOOR;
  const h = lastHit(t); const hit = h < 0.3 ? Math.sin(Math.PI * h / 0.3) : 0;
  place(ph, 15.4, Y, 0.55, 0.15); ph.hurt(hurtA(h));
  ph.pose(P(idle(t, 28, 1.6), { rArm: [-0.5, 0, -0.15], lArm: [-0.9, 0, 0.15], head: [0.25 - 0.25 * hit, 0.35 * hit, 0.1 * hit], body: [-0.12 * hit, 0, 0], mouth: hit > 0.2 ? 2 : 1, brow: 'sad', blink: hit > .6 ? 1 : 0 }));
  torchFlicker(t);
  const lg = bump(h, -0.12, 0.3) * (h < 0.3 ? 1 : 0) + bump(h - 0.56, -0.12, 0.0) ; place(bz, 15.6, Y + hit * 0.15, 1.95, Math.PI); bz.pose(P(zombiePose(t, 10, null), { rArm: [-0.6 * hit, 0, 0], lArm: [-0.6 * hit, 0, 0] }));
  const pos = V(16.75, Y + 1.7, 3.0); camLook(cam, pos, V(15.4, Y + 1.55, 0.55), 32);
  shake(cam, t, hit * 0.06);
  return cvFrame({ hud: hudHearts(t, 30, { flash: hurtA(h) > .5 ? 1 : 0, shakeT: h < .3 ? t : 0 }), dof: { focus: 2.85, aperture: 0.00025 } });
});
// --- 29 "o pânico tomou conta" — olhar desesperado pros lados, respiração rápida
shot(36.48, (u, t) => {
  hideAll(CV); const ph = CV.phil; const Y = CAVE_FLOOR;
  place(ph, 15.6, Y, 0.3, 0.2);
  const look = Math.sin(u * 5.2) * 0.7 * seg(u, 0, 0.3); const br = Math.sin(t * 14);
  ph.pose(P({ head: [0.12 + 0.02 * br, look, 0.08 * Math.sin(u * 3.1)], body: [0.03 * br, 0, 0], rArm: [-0.5, 0, -0.15], lArm: [-0.9, 0, 0.15], mouth: 1 + (br > 0 ? 1 : 0), brow: 'sad', bob: 0.25 * br, blink: blink(t, 29) }));
  torchFlicker(t);
  const pos = V(16.45 - u * 0.1, Y + 1.7, 2.5 - u * 0.12); camLook(cam, pos, V(15.6, Y + 1.66, 0.3), 32, 0.03 * Math.sin(u * 2));
  shake(cam, t, 0.008);
  return cvFrame({ hud: (g, W, H) => { vignette(g, W, H, 0.75); hudHearts(t, 30)(g, W, H); }, dof: { focus: 2.35, aperture: 0.00035 } });
});
// --- 30 "ao tentar recuar desesperado" — recuando e golpeando o ar
shot(37.84, (u, t) => {
  hideAll(CV); const ph = CV.phil; const bz = CV.bz; const Y = CAVE_FLOOR;
  const k = u / 1.6; const pp = V(15.6 + 1.2 * k, Y, 0.6 - 1.4 * k); place(ph, pp.x, Y, pp.z, -0.55);
  const sp = (u % 0.42) / 0.42; const h = t - 38.7; ph.hurt(hurtA(h));
  ph.pose(P(walk(-u * 9, 0.5, 0), swing(sp), { lArm: [-0.9, 0, 0.12], head: [0.4, 0, 0], brow: 'sad', mouth: 2 }));
  torchFlicker(t);
  const zz = Math.sin(u * 9) * 0.45; const zp = V(pp.x - 0.7 * Math.sin(-0.55) + zz * 0.6, Y, pp.z + 1.25 + zz * 0.2);
  place(bz, zp.x, Y + Math.abs(Math.sin(u * 9)) * 0.08, zp.z, faceTo(zp, pp)); bz.pose(zombiePose(t, 11, 1, 0.9));
  CV.fill.position.set(pp.x - 1.5, Y + 2.2, pp.z + 2.5); CV.fill.intensity = 2.5;
  const pos = V(pp.x - 2.4, Y + 1.35, pp.z + 2.9); camLook(cam, pos, V(pp.x - 0.3, Y + 0.95, pp.z + 0.6), 48);
  shake(cam, t, h > 0 && h < .3 ? 0.04 : 0.006);
  return cvFrame({ hud: hudHearts(t, 30, { flash: hurtA(lastHit(t)) > .5 ? 1 : 0 }) });
});
// --- 31 "um passo em falso" — câmera nos pés: o pé entra na teia
const TRAPC = () => V(CV.TRAP[0] + 0.5, CAVE_FLOOR, CV.TRAP[2] + 0.5);
shot(39.44, (u, t) => {
  hideAll(CV); const ph = CV.phil; const Y = CAVE_FLOOR; const T = TRAPC();
  const k = seg(u, 0, 0.64, E.out); const pp = V(T.x - 0.55 * (1 - k), Y, T.z + 0.9 * (1 - k)); place(ph, pp.x, Y, pp.z, -0.55);
  const step = Math.sin(Math.PI * clamp(u / 0.64));
  ph.pose(P(idle(t, 31), { rLeg: [0.55 * step, 0, 0], lLeg: [-0.25 * step, 0, 0], rArm: [-0.6, 0, -0.1], lArm: [-0.9, 0, 0.1], head: [0.4, 0, 0] }));
  ph.tag.visible = false; torchFlicker(t);
  CV.webp.position.set(T.x, Y + 0.3, T.z); CV.webp.userData.update(u - 0.64, 0.5, 0.4);
  const pos = V(T.x + 1.7, Y + 0.32, T.z + 1.7); camLook(cam, pos, V(T.x - 0.1, Y + 0.35, T.z + 0.2), 46 * punch(u, 0.64, 0.2));
  return cvFrame({ dof: { focus: 2.3, aperture: 0.0004 } });
});
// --- 32 "o prendeu em uma teia" — preso, se debatendo em câmera lenta
shot(40.48, (u, t) => {
  hideAll(CV); const ph = CV.phil; const Y = CAVE_FLOOR; const T = TRAPC();
  place(ph, T.x, Y, T.z, -0.5);
  const st = Math.sin(u * 3.2);
  ph.pose({ rArm: [-0.7 - 0.5 * st, 0, -0.2], lArm: [-0.9 + 0.4 * st, 0, 0.25], rLeg: [0.2 * st, 0, 0], lLeg: [-0.2 * st, 0, 0], head: [0.2, 0.35 * Math.sin(u * 2.2), 0], body: [0.05 * st, 0.1 * st, 0], mouth: 2, brow: 'sad', blink: blink(t, 32) });
  torchFlicker(t);
  CV.webp.position.set(T.x, Y + 0.6, T.z); CV.webp.userData.update(u * 0.8, 0.6, 0.5);
  const pos = V(T.x + 2.6 - u * 0.35, Y + 1.4, T.z + 2.1 - u * 0.3); camLook(cam, pos, V(T.x, Y + 1.2, T.z), 42 * punch(u, 0.88, 0.2));
  return cvFrame({ dof: { focus: 3, aperture: 0.0002 }, hud: hudHearts(t, 30) });
});
// --- 33 "no breu" — a câmera recua e a escuridão engole tudo
shot(41.60, (u, t) => {
  hideAll(CV); const ph = CV.phil; const Y = CAVE_FLOOR; const T = TRAPC();
  place(ph, T.x, Y, T.z, -0.5); const st = Math.sin((u + 1.12) * 3.2);
  ph.pose({ rArm: [-0.7 - 0.5 * st, 0, -0.2], lArm: [-0.9 + 0.4 * st, 0, 0.25], head: [0.2, 0.3, 0], mouth: 2, brow: 'sad' });
  torchFlicker(t); CV.torch.userData.torch.userData.light.intensity *= 1 - 0.6 * seg(u, 0, 0.56);
  const k = seg(u, 0, 0.56, E.out); const pos = V(T.x + 2.4 + 4 * k, Y + 1.5 + 1.5 * k, T.z + 2 + 3.5 * k); camLook(cam, pos, V(T.x, Y + 1.0, T.z), 42);
  return cvFrame({ exposure: 1 - 0.55 * k });
});
// --- 34 "Encurralado por um erro bobo" — o zumbi se aproxima devagar
shot(42.16, (u, t) => {
  hideAll(CV); const ph = CV.phil; const bz = CV.bz; const Y = CAVE_FLOOR; const T = TRAPC();
  place(ph, T.x, Y, T.z, -0.5); const st = Math.sin((u + 2) * 3.2);
  ph.pose({ rArm: [-0.7 - 0.4 * st, 0, -0.2], lArm: [-0.9 + 0.3 * st, 0, 0.25], head: [0.38, 0.12 * Math.sin(u * 2), 0], mouth: 1, brow: 'sad', blink: blink(t, 34) });
  torchFlicker(t);
  const k = u / 1.6; const zp = V(T.x - 1.35 + 0.55 * k, Y, T.z + 3.3 - 1.35 * k);
  place(bz, zp.x, Y, zp.z, faceTo(zp, T)); bz.pose(zombiePose(t, 12, 0, 0.5));
  const pos = V(zp.x - 1.4, Y + 0.95, zp.z + 1.9); camLook(cam, pos, lv(V(T.x, Y + 1.1, T.z), zp, 0.3), 44);
  return cvFrame({ exposure: 0.85, hud: hudHearts(t, 30), dof: { focus: pos.distanceTo(T), aperture: 0.00018 } });
});
// --- 35 "um único segundo de distração" — câmera lenta, último coração piscando
shot(43.76, (u, t) => {
  hideAll(CV); const ph = CV.phil; const Y = CAVE_FLOOR; const T = TRAPC();
  place(ph, T.x, Y, T.z, -0.5);
  const look = seg(u, 0.3, 0.9);
  ph.pose(P(idle(t * 0.4, 35), { head: [0.15 + 0.18 * look, 0.25 * look, 0.05 * look], rArm: [-0.7, 0, -0.2], lArm: [-0.9, 0, 0.25], brow: look > .5 ? null : 'sad', mouth: 1, blink: u > 1.0 && u < 1.12 ? 1 : 0 }));
  torchFlicker(t);
  const pos = V(T.x - 1.1 - u * 0.04, Y + 1.7, T.z + 2.0 + u * 0.05); camLook(cam, pos, V(T.x, Y + 1.6, T.z), 34);
  CV.fill.position.set(T.x - 0.8, Y + 2.2, T.z + 1.6); CV.fill.intensity = 0.9;
  const blinkH = Math.sin(u * 12) > 0;
  return cvFrame({ exposure: 0.85, dof: { focus: 2.3, aperture: 0.00035 }, hud: (g, W, H) => { vignette(g, W, H, 0.8); drawHearts(g, W / 2, H * 0.80, 7, 0.5, { hardcore: true, flash: blinkH ? 1 : 0 }); } });
});
// --- 36 "foi o suficiente" — o golpe final; ele tomba (morte do jogo) e vira fumaça
function layoutDrops(T, k) { // itens espalhados flutuando levemente (como no jogo)
  const offs = [[-0.55, -0.15], [0.45, -0.55], [-0.75, 0.45], [-0.1, -0.75], [0.75, -0.2], [-0.45, -0.65]];
  CV.drops.children.forEach((g, i) => { const [ox, oz] = offs[i]; const e = E.out(clamp(k / 0.5)); g.position.set(T.x + ox * e, CAVE_FLOOR + 0.14 + Math.max(0, Math.sin(Math.PI * clamp(k / .5)) * 0.4) + 0.04 * Math.sin(k * 3 + i), T.z + oz * e); g.rotation.y = k * 1.2 + i; });
}
shot(45.28, (u, t) => {
  hideAll(CV); const ph = CV.phil; const bz = CV.bz; const Y = CAVE_FLOOR; const T = TRAPC();
  const h = t - 45.6; const fallK = clamp(h / 0.42);
  place(ph, T.x, Y, T.z, -0.5, 0, Math.PI / 2 * Math.sqrt(fallK) * 0.98);
  ph.root.visible = u < 1.05; ph.hurt(h > 0 ? 0.85 : 0); ph.tag.visible = h < 0.25;
  ph.pose({ rArm: [-0.7, 0, -0.2], lArm: [-0.9, 0, 0.25], head: [0.25, 0, 0], mouth: h > 0 ? 2 : 1, brow: 'sad', blink: h > 0.15 ? 1 : 0 });
  torchFlicker(t);
  const jp = clamp((u - 0.05) / 0.3); const zp = V(T.x - 0.75, Y + Math.sin(Math.PI * jp) * 0.55, T.z + 1.9 - 0.8 * jp);
  place(bz, zp.x, zp.y, zp.z, faceTo(zp, T)); bz.pose(P(zombiePose(t, 13, null), { rArm: [-0.75 * Math.sin(Math.PI * jp), 0, 0], lArm: [-0.75 * Math.sin(Math.PI * jp), 0, 0] }));
  CV.poof.position.set(T.x + 0.6, Y + 0.3, T.z); CV.poof.userData.update(u - 1.0, 1.0, 1.1);
  CV.drops.visible = u > 1.02; layoutDrops(T, u - 1.02);
  CV.fill.position.set(T.x + 1, Y + 2, T.z + 2.5); CV.fill.intensity = 1.5;
  const pos = V(T.x + 2.2, Y + 1.1, T.z + 2.9); camLook(cam, pos, V(T.x - 0.2, Y + 0.7, T.z + 0.5), 46 * punch(u, 0.32, 0.18));
  shake(cam, t, h > 0 && h < .35 ? 0.06 : 0.003);
  return cvFrame({ exposure: 0.9, hud: hudHearts(t, 30, { flash: hurtA(h) > .5 ? 1 : 0 }) });
});
// --- 37 "O silêncio absoluto dominou" — tudo parado; itens no chão; zumbi olhando
shot(46.64, (u, t) => {
  hideAll(CV); const bz = CV.bz; const Y = CAVE_FLOOR; const T = TRAPC();
  CV.drops.visible = true; layoutDrops(T, 2 + u);
  const zp = V(T.x + 0.75, Y, T.z + 0.9); place(bz, zp.x, Y, zp.z, faceTo(zp, V(T.x + 2.9, Y, T.z + 3.3)) - 0.6 + 0.25 * Math.sin(u * 0.8)); bz.pose(P(zombiePose(t * 0.6, 14, null), { head: [0.3, 0.3 * Math.sin(u * 1.1), 0] }));
  CV.fill.position.set(T.x + 1.2, Y + 1.4, T.z + 1.8); CV.fill.intensity = 1.2;
  const pos = V(T.x + 2.9 - u * 0.35, Y + 1.5 - u * 0.12, T.z + 3.3 - u * 0.35); camLook(cam, pos, V(T.x + 0.2, Y + 0.35, T.z + 0.3), 44);
  return cvFrame({ exposure: 0.8, dof: { focus: pos.distanceTo(T), aperture: 0.00015 } });
});
// --- 38 "a tela escureceu" — escurece até vermelho
shot(48.40, (u, t) => {
  hideAll(CV); const bz = CV.bz; const Y = CAVE_FLOOR; const T = TRAPC();
  CV.drops.visible = true; layoutDrops(T, 3.8 + u);
  const zp = V(T.x + 0.75, Y, T.z + 0.9); place(bz, zp.x, Y, zp.z, faceTo(zp, V(T.x + 2.9, Y, T.z + 3.3)) - 0.6); bz.pose(P(zombiePose(t * 0.6, 14, null), { head: [0.3, 0.2, 0] }));
  CV.fill.position.set(T.x + 1.2, Y + 1.4, T.z + 1.8); CV.fill.intensity = 1.2;
  const pos = V(T.x + 2.1, Y + 1.35, T.z + 2.5); camLook(cam, pos, V(T.x - 0.3, Y + 0.3, T.z + 0.6), 44);
  const k = seg(u, 0, 0.96);
  return cvFrame({ exposure: 0.8 * (1 - 0.7 * k), hud: (g, W, H) => { g.fillStyle = `rgba(60,0,0,${0.75 * k})`; g.fillRect(0, 0, W, H); } });
});
// --- 39/40 tela de morte — "Você morreu!"
function deathFrame(u, t, title, msg, buttons) {
  hideAll(CV); const bz = CV.bz; const Y = CAVE_FLOOR; const T = TRAPC();
  CV.drops.visible = true; layoutDrops(T, 5 + u);
  const zp = V(T.x + 0.75, Y, T.z + 0.9); place(bz, zp.x, Y, zp.z, faceTo(zp, V(T.x + 2.9, Y, T.z + 3.3)) - 0.6); bz.pose(P(zombiePose(t * 0.6, 14, null), { head: [0.3, 0.2, 0] }));
  CV.fill.position.set(T.x + 1.2, Y + 1.4, T.z + 1.8); CV.fill.intensity = 1.2;
  const pos = V(T.x + 2.1 - (t - 49.36) * 0.06, Y + 1.35, T.z + 2.5); camLook(cam, pos, V(T.x - 0.3, Y + 0.3, T.z + 0.6), 44);
  return cvFrame({ exposure: 0.45, dof: { focus: 0.5, aperture: 0.002, maxblur: 0.01 }, hud: (g, W, H) => drawDeath(g, W, H, { a: 1, title, msg, buttons }) });
}
shot(49.36, (u, t) => deathFrame(u, t, seg(t, 51.44, 51.62, E.out), seg(t, 51.7, 51.9), 0));
shot(52.32, (u, t) => deathFrame(u, t, 1, 1, seg(t, 52.64, 52.8)));
// --- 41 "Cinco anos de glória e dedicação" — o castelo ao pôr do sol, vazio
shot(53.36, (u, t) => {
  hideAll(OW); lightingPreset(OW, 'golden');
  const k = u / 1.76; const pos = V(26 - 8 * k, 30 - 3 * k, 16 - 4 * k); camLook(cam, pos, V(0, 22, -22), 48);
  return owFrame(V(0, 15, -22), 32, { exposure: 0.95 });
});
// --- 42 "foram apagados pra sempre" — os blocos do castelo somem em onda (encolhendo)
const dummy = new THREE.Object3D();
function vanishCastle(tt) {
  const wave = -2 + (tt - 55.12) * 30;
  for (const im of OW.inst) { im.visible = true; im.userData.blocks.forEach(([x, y, z], i) => { const d = (40 - y) - wave + Math.sin(x * 1.7 + z * 2.3) * 2; const s = clamp(1 - (-d) / 3); dummy.position.set(x + .5, y + .5, z + .5); dummy.scale.setScalar(Math.max(0.0001, s)); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); }); im.instanceMatrix.needsUpdate = true; }
  return wave;
}
shot(55.12, (u, t) => {
  hideAll(OW); lightingPreset(OW, 'golden'); OW.castleMesh.visible = false;
  const wave = vanishCastle(t);
  OW.dust.position.set(0, 18, -22); OW.dust.userData.update(u * 0.7, 9, 3);
  const pos = V(18 - u * 0.8, 24, 10 - u * 0.6); camLook(cam, pos, V(0, 18 - u * 3, -22), 52);
  return owFrame(V(0, 15, -22), 32, { exposure: 0.95 });
});
// --- 43 "em um piscar de olhos" — piscada: abre num terreno vazio
shot(56.80, (u, t) => {
  hideAll(OW); lightingPreset(OW, 'golden'); OW.castleMesh.visible = false;
  if (t < 57.4) vanishCastle(t);
  const pos = V(16.6 - u * 0.4, 24 - u * 0.5, 8.9 - u * 0.3); camLook(cam, pos, V(0, 13, -22), 52);
  const lid = t < 57.2 ? 0 : t < 57.42 ? E.in(clamp((t - 57.2) / 0.22)) : t < 57.6 ? 1 : 1 - E.out(clamp((t - 57.6) / 0.25));
  return owFrame(V(0, 10, -22), 32, { exposure: 0.95, hud: (g, W, H) => { if (lid <= 0) return; g.fillStyle = '#000'; const hh = H / 2 * lid; g.fillRect(0, 0, W, hh); g.fillRect(0, H - hh, W, hh); } });
});
// --- 44 "Provando que, no fim das contas" — o zumbi bebê sobre os itens, encara a câmera
shot(58.40, (u, t) => {
  hideAll(CV); const bz = CV.bz; const Y = CAVE_FLOOR; const T = TRAPC();
  CV.drops.visible = true; layoutDrops(T, 8 + u);
  place(bz, T.x + 0.75, Y, T.z + 0.95, 0.75); bz.pose(P(zombiePose(t, 15, null), { head: [0.05 * Math.sin(u * 2), 0.12 * Math.sin(u * 1.4), 0.25 * seg(u, 0.6, 1.2)], bob: Math.abs(Math.sin(u * 3)) * 0.4 }));
  CV.fill.position.set(T.x + 2.0, Y + 1.5, T.z + 2.6); CV.fill.intensity = 1.6;
  CV.rim.position.set(T.x - 1.5, Y + 3, T.z - 1.5); CV.rim.target.position.set(T.x + 0.75, Y + 0.5, T.z + 0.95); CV.rim.intensity = 6;
  const pos = V(T.x + 2.3 - u * 0.12, Y + 0.8, T.z + 3.2 - u * 0.25); camLook(cam, pos, V(T.x + 0.75, Y + 0.6, T.z + 0.95), 44);
  return cvFrame({ exposure: 1, dof: { focus: pos.distanceTo(T), aperture: 0.0003 } });
});
// --- 45 "Ninguém é intocável" — punch-in final; ele dá um pulinho
shot(60.56, (u, t) => {
  hideAll(CV); const bz = CV.bz; const Y = CAVE_FLOOR; const T = TRAPC();
  CV.drops.visible = true; layoutDrops(T, 10 + u);
  const hop = Math.sin(Math.PI * clamp((t - 60.96) / 0.35)) * 0.3;
  place(bz, T.x + 0.75, Y + hop, T.z + 0.95, 0.75); bz.pose(P(zombiePose(t, 15, null), { head: [-0.1, 0.05, 0.12] }));
  CV.fill.position.set(T.x + 2.0, Y + 1.5, T.z + 2.6); CV.fill.intensity = 1.6;
  CV.rim.position.set(T.x - 1.5, Y + 3, T.z - 1.5); CV.rim.target.position.set(T.x + 0.75, Y + 0.5, T.z + 0.95); CV.rim.intensity = 6;
  const pos = V(T.x + 1.95, Y + 0.72, T.z + 2.65); camLook(cam, pos, V(T.x + 0.75, Y + 0.68, T.z + 0.95), 44 * punch(u, 0, 0.2) - u * 1.5);
  return cvFrame({ exposure: 1, dof: { focus: 1.4, aperture: 0.0005 } });
});

export const SHOTS = SH;
export function frame(t) {
  let i = SH.length - 1; while (i > 0 && SH[i].t0 > t) i--;
  const s = SH[i]; const f = s.fn(t - s.t0, t);
  for (const S of [OW, CV]) if (S.phil.root.visible && S.phil.tag.visible) { const hp = S.phil.root.position.clone().add(V(0, 1.9, 0)); const o = clamp((cam.position.distanceTo(hp) - 3.0) / 0.9); S.phil.tag.material.opacity = o; S.phil.tag.visible = o > 0.01; }
  f.shot = i + 1; return f;
}
export const SETS = () => ({ OW, CV });
