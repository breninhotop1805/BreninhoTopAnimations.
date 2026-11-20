// "Por que o Glamrock Freddy tem um compartimento pra crianças?" — models.
// Belly hatches use the skin's OWN belly pixels (base + overlay) extruded into two 3D doors: closed, the belly looks exactly
// like the skin; open, the doors swing out and reveal a real cavity (the torso front gets a hole via alpha, with an
// inner open box behind it). Same idea for the Funtime faceplates. Painted ears/hats on the hat layer are erased.
import * as THREE from 'three';
import { Character, U, imgCopy, voxelArt, extrudePixels, vbox, avgColor, recolorWhere, eraseRect } from './skin.js';

const sc = A => A.width / 64;
function region(A, x, y, w, h, ox = null, oy = null) { const s = sc(A); const c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s); const g = c.getContext('2d');
  g.drawImage(A, x * s, y * s, w * s, h * s, 0, 0, c.width, c.height); if (ox !== null) g.drawImage(A, ox * s, oy * s, w * s, h * s, 0, 0, c.width, c.height); return c; }
function hole(A, x, y, w, h) { const s = sc(A); A.getContext('2d').clearRect(x * s, y * s, w * s, h * s); }
function solidify(c) { const g = c.getContext('2d'); const d = g.getImageData(0, 0, c.width, c.height); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 40 ? 255 : 0; g.putImageData(d, 0, 0); return c; }
function slab(c, s, depth, rough = 0.5) { const m = extrudePixels(c, 0, 0, c.width, c.height, U / s, depth * U); m.traverse(o => { if (o.isMesh) { o.material.roughness = rough; o.castShadow = true; o.receiveShadow = true; } }); return m; }
const finish = ch => { ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return ch; };

// ---------- belly hatch ----------
// rect on the torso FRONT in skin units (front = cols 20..28, rows 20..32); overlay front = same rect + 16 rows.
export function prepHatch(A, r) { const c = solidify(region(A, r.x, r.y, r.w, r.h, r.x, r.y + 16)); const s = sc(A); const hw = Math.round(r.w / 2 * s);
  const L = document.createElement('canvas'); L.width = hw; L.height = c.height; L.getContext('2d').drawImage(c, 0, 0);
  const R = document.createElement('canvas'); R.width = c.width - hw; R.height = c.height; R.getContext('2d').drawImage(c, -hw, 0);
  hole(A, r.x, r.y, r.w, r.h); hole(A, r.x, r.y + 16, r.w, r.h); return { L, R, s, r }; }
export function attachHatch(ch, P, o = {}) { const { L, R, s, r } = P; const h = new THREE.Group(); ch.torso.add(h); ch.hatchG = h;
  const x0 = (r.x - 24) * U, x1 = (r.x + r.w - 24) * U, yc = (32 - (r.y + r.h / 2)) * U, W = r.w, Hh = r.h, zF = 2 * U; const D = 0.45;
  // cavity (open box inside the torso)
  const cav = new THREE.Group(); cav.position.set((x0 + x1) / 2, yc, 0); h.add(cav); ch.cav = cav; ch.cavSize = [W, Hh, 3.45]; const wall = o.wall || '#1a1c22', dk = o.dark || '#0c0d10';
  vbox(W, Hh, 0.2, dk, 0, 0, -1.5, cav, 0.9); for (const sx of [-1, 1]) vbox(0.2, Hh, 3.45, wall, sx * (W / 2 - 0.1), 0, 0.22, cav, 0.8); for (const sy of [-1, 1]) vbox(W, 0.2, 3.45, wall, 0, sy * (Hh / 2 - 0.1), 0.22, cav, 0.8);
  if (o.kind === 'glam') { // endoskeleton torso: back plate with ribs, spine, two pistons, cables, collar ring, small blue status light
    const met = '#8a909c', d2 = '#2a2d34', d3 = '#3a3e48';
    for (let i = 0; i < 5; i++) vbox(W - 1.0, 0.22, 0.25, d3, 0, -Hh / 2 + 1.2 + i * (Hh - 2.4) / 4, -1.3, cav, 0.4);
    vbox(0.7, Hh - 1.0, 0.6, met, 0, 0, -1.05, cav, 0.3);
    for (const sx of [-1, 1]) { const pg = new THREE.Group(); pg.position.set(sx * (W / 2 - 1.3) * U, 0, -0.9 * U); cav.add(pg);
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.42 * U, 0.42 * U, (Hh - 3.2) * U, 10), new THREE.MeshStandardMaterial({ color: '#5a606c', metalness: 0.7, roughness: 0.3 })); cyl.rotation.z = sx * 0.12; pg.add(cyl);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * U, 0.2 * U, (Hh - 2.0) * U, 8), new THREE.MeshStandardMaterial({ color: '#c8ccd4', metalness: 0.9, roughness: 0.2 })); rod.rotation.z = sx * 0.12; pg.add(rod);
      vbox(1.2, 1.0, 0.8, d2, sx * (W / 2 - 1.0), Hh / 2 - 1.2, -0.9, cav, 0.4); vbox(1.2, 1.0, 0.8, d2, sx * (W / 2 - 1.0), -Hh / 2 + 1.2, -0.9, cav, 0.4); }
    for (const [x, c] of [[-0.9, '#c83a2a'], [0.9, '#2a6ac8'], [1.3, '#d8b030']]) vbox(0.18, Hh - 2.6, 0.18, c, x, -0.3, -0.6, cav, 0.5);
    vbox(2.0, 0.8, 0.4, '#3a3d44', 0, -Hh / 2 + 0.8, -0.8, cav, 0.5); vbox(1.2, 0.25, 0.42, '#5ad8ff', 0, -Hh / 2 + 0.8, -0.58, cav, 0.3, '#2a98c8');
    const ring = new THREE.Mesh(new THREE.TorusGeometry(W / 2 * U * 0.9, 0.3 * U, 6, 24, Math.PI), new THREE.MeshStandardMaterial({ color: '#f2ece2', roughness: 0.4 })); ring.position.set(0, (Hh / 2 - 0.6) * U, 1.4 * U); ring.scale.y = 0.35; cav.add(ring); }
  if (o.kind === 'funtime') { // the Funtime "scooper" cavity: black drum with radial ribs and a hub
    const g2 = new THREE.Group(); g2.position.z = -1.35 * U; cav.add(g2); const rr = Math.min(W, Hh) / 2 - 0.4;
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; const b = vbox(rr, 0.12, 0.15, i % 2 ? '#3a3a44' : '#26262e', Math.cos(a) * rr / 2, Math.sin(a) * rr / 2, 0.1, g2, 0.4); b.rotation.z = a; }
    vbox(1.6, 1.6, 0.4, '#141418', 0, 0, 0.3, g2, 0.4); const rim = new THREE.Mesh(new THREE.TorusGeometry(rr * U, 0.18 * U, 6, 32), new THREE.MeshStandardMaterial({ color: '#4a4a56', metalness: 0.6, roughness: 0.35 })); rim.position.z = 0.1 * U; g2.add(rim); ch.scoop = g2; }
  ch.hatchColor = o.light || '#8ad8ff'; ch.hatchLight = new THREE.PointLight(ch.hatchColor, 0, 1.4, 2); ch.hatchLight.position.set((x0 + x1) / 2, yc, 0.6 * U); h.add(ch.hatchLight);
  // doors: the skin's belly pixels, extruded; hinged at the outer edges, swing forward/outward
  const dl = new THREE.Group(); dl.position.set(x0, yc, zF + D / 2 * U); h.add(dl); const ml = slab(L, s, D); ml.position.x = (W / 4) * U; dl.add(ml);
  const dr = new THREE.Group(); dr.position.set(x1, yc, zF + D / 2 * U); h.add(dr); const mr = slab(R, s, D); mr.position.x = -(W / 4) * U; dr.add(mr);
  ch.doors = [dl, dr]; ch.setHatch = k => { k = Math.max(0, Math.min(1, k)); dl.rotation.y = -1.75 * k; dr.rotation.y = 1.75 * k; cav.visible = true; ch.hatchLight.intensity = (o.lightI ?? 0.35) * k; if (ch.scoop) ch.scoop.rotation.z = k * 0.6; };
  ch.setHatch(0); return ch; }

// ---------- faceplates (Funtimes) — NOT USED: he rejected the open faces (round 3D eyes + painted eyes moving with the plates): the upper face splits into two plates; endo face with eyes behind ----------
export function prepPlates(A, r) { const c = solidify(region(A, r.x, r.y, r.w, r.h, r.x + 32, r.y)); const s = sc(A); const hw = Math.round(r.w / 2 * s);
  const L = document.createElement('canvas'); L.width = hw; L.height = c.height; L.getContext('2d').drawImage(c, 0, 0); const R = document.createElement('canvas'); R.width = c.width - hw; R.height = c.height; R.getContext('2d').drawImage(c, -hw, 0);
  hole(A, r.x, r.y, r.w, r.h); hole(A, r.x + 32, r.y, r.w, r.h); return { L, R, s, r }; }
export function attachPlates(ch, P, o = {}) { const { L, R, s, r } = P; const H = ch.head; const x0 = (r.x - 12) * U, x1 = (r.x + r.w - 12) * U, yc = (16 - (r.y + r.h / 2)) * U, W = r.w, Hh = r.h;
  const cav = new THREE.Group(); cav.position.set((x0 + x1) / 2, yc, 0); H.add(cav); const endo = '#2a2c32', dk = '#0e0f12';
  vbox(W, Hh, 0.3, dk, 0, 0, 0.6, cav, 0.9); for (const sx of [-1, 1]) vbox(0.25, Hh, 3.4, endo, sx * (W / 2 - 0.12), 0, 2.3, cav, 0.6); vbox(W, 0.25, 3.4, endo, 0, Hh / 2 - 0.12, 2.3, cav, 0.6); vbox(W, 0.25, 3.4, endo, 0, -Hh / 2 + 0.12, 2.3, cav, 0.6);
  vbox(W - 1.2, 0.5, 0.6, '#5a5e68', 0, -Hh / 2 + 0.7, 2.6, cav, 0.4); vbox(0.6, Hh - 1, 0.6, '#5a5e68', 0, 0, 1.2, cav, 0.4);
  ch.endoEyes = []; for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(1.15 * U, 16, 12), new THREE.MeshStandardMaterial({ color: '#f2f2f6', roughness: 0.25 })); e.position.set(sx * 1.9 * U, 0.2 * U, 2.6 * U); cav.add(e);
    const ir = new THREE.Mesh(new THREE.CircleGeometry(0.6 * U, 16), new THREE.MeshStandardMaterial({ color: o.iris || '#7a5ad8', emissive: o.iris || '#7a5ad8', emissiveIntensity: 0.4 })); ir.position.set(sx * 1.9 * U, 0.2 * U, 3.76 * U); cav.add(ir);
    const pu = new THREE.Mesh(new THREE.CircleGeometry(0.28 * U, 12), new THREE.MeshBasicMaterial({ color: '#050505' })); pu.position.set(sx * 1.9 * U, 0.2 * U, 3.77 * U); cav.add(pu); ch.endoEyes.push(e); }
  const pl = new THREE.Group(); pl.position.set(x0, yc, (4 + 0.25) * U); H.add(pl); const ml = slab(L, s, 0.5); ml.position.x = (W / 4) * U; pl.add(ml);
  const pr = new THREE.Group(); pr.position.set(x1, yc, (4 + 0.25) * U); H.add(pr); const mr = slab(R, s, 0.5); mr.position.x = -(W / 4) * U; pr.add(mr);
  ch.plates = [pl, pr]; ch.setPlates = k => { k = Math.max(0, Math.min(1, k)); pl.rotation.y = -1.25 * k; pr.rotation.y = 1.25 * k; pl.rotation.z = 0.25 * k; pr.rotation.z = -0.25 * k; }; ch.setPlates(0); return ch; }

// ===================== GLAMROCK FREDDY =====================
export function buildGFreddy2(canvas) {
  const A = imgCopy(canvas); const fur = avgColor(A, 12, 4, 4, 3); const isDT = (r, g, b) => (r < 70 && g < 70 && b < 80) || (b > r + 20);
  recolorWhere(A, 8, 0, 8, 8, () => true, fur);                                   // head top: painted hat brim/ears gone
  for (const x of [0, 16, 24]) recolorWhere(A, x, 8, 8, 6, isDT, fur);              // painted ear arcs on the sides/back
  recolorWhere(A, 8, 8, 8, 1.5, isDT, fur);
  eraseRect(A, 32, 0, 32, 8); eraseRect(A, 32, 8, 8, 8); eraseRect(A, 48, 8, 16, 8); eraseRect(A, 40, 8, 8, 1.5); // hat layer: only the face overlay stays
  const muz = solidify(region(A, 10, 12.5, 4, 3.5, 42, 12.5));                       // the painted muzzle (nose + teeth) -> 3D, same pixels
  const hp = prepHatch(A, { x: 20.5, y: 22.5, w: 7, h: 8 });
  const ch = new Character('gfreddy', A); const H = ch.head;
  const m = slab(muz, sc(A), 1.3, 0.55); m.position.set(0, (16 - 14.25) * U, (4 + 0.65) * U); H.add(m); ch.muzzle = m;
  // small black top hat with the teal band
  const hat = new THREE.Group(); const blk = '#0a0a0e', teal = '#2ad8d0'; vbox(5.0, 0.45, 5.0, blk, 0, 0.22, 0, hat, 0.4); vbox(3.5, 0.7, 3.5, teal, 0, 0.8, 0, hat, 0.35, '#0a4a48'); vbox(3.3, 2.6, 3.3, blk, 0, 2.35, 0, hat, 0.4);
  hat.position.set(0.4 * U, 8.0 * U, 0.2 * U); hat.rotation.z = -0.12; H.add(hat); ch.topHat = hat;
  // round ears (orange rim, lighter inner) + the earring on his left ear
  const P = { o: fur, d: '#8a4a1a', l: '#f2c08a' }; const ear = () => voxelArt(['.oooo.', 'oolloo', 'ollllo', 'ollllo', 'oolloo', '.oooo.'], P, 0.6 * U, 1.2 * U);
  for (const sx of [-1, 1]) { const e = ear(); e.position.set(sx * 3.7 * U, (8 + 1.4) * U, -0.6 * U); e.rotation.z = -sx * 0.3; H.add(e);
    if (sx > 0) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55 * U, 0.16 * U, 6, 14), new THREE.MeshStandardMaterial({ color: '#e84a2a', metalness: 0.5, roughness: 0.3 })); ring.position.set(sx * 4.3 * U, 8.3 * U, 0.2 * U); ring.rotation.y = Math.PI / 2; H.add(ring); } }
  // shoulder pads (red-orange, angled) and spiked wristbands — on the arm pivots, so they move with the arms
  for (const [A2, sx] of [[ch.armR, -1], [ch.armL, 1]]) { const pd = new THREE.Group(); pd.position.set(sx * 0.4 * U, 1.9 * U, 0); A2.piv.add(pd);
    vbox(4.6, 1.2, 4.8, '#e8502a', 0, 0.3, 0, pd, 0.45); vbox(3.6, 1.0, 4.0, '#c83a1a', sx * 0.6, 1.1, 0, pd, 0.45).rotation.z = -sx * 0.35;
    const wb = new THREE.Group(); wb.position.y = -6.6 * U; A2.piv.add(wb); vbox(4.5, 1.4, 4.5, '#141418', 0, 0, 0, wb, 0.4);
    for (const [fx, fz] of [[0, 2.3], [0, -2.3], [2.3, 0], [-2.3, 0]]) for (const dy of [-0.35, 0.35]) vbox(fx ? 0.35 : 0.5, 0.35, fz ? 0.35 : 0.5, '#d8d8e0', fx + (fx ? 0 : (dy > 0 ? 0.9 : -0.9)), dy, fz, wb, 0.25); }
  attachHatch(ch, hp, { kind: 'glam', wall: '#22252c', light: '#8ad8ff' }); ch.baseScale = 1.55; return finish(ch); }

// ===================== FUNTIME FREDDY =====================
export function buildFFreddy2(canvas) {
  const A = imgCopy(canvas); const W0 = '#f0eaf4'; const isEar = (r, g, b) => (r < 90 && g < 90 && b < 90) || (r > 180 && g < 120 && b > 120);
  recolorWhere(A, 8, 0, 8, 8, isEar, W0); for (const x of [0, 16, 24]) recolorWhere(A, x, 8, 8, 4, isEar, W0);
  eraseRect(A, 32, 0, 32, 8); eraseRect(A, 32, 8, 8, 8); eraseRect(A, 48, 8, 16, 8);
  const hp = prepHatch(A, { x: 21, y: 22.5, w: 6, h: 7 });
  const ch = new Character('ffreddy', A, { prop: { limbW: 1.05 } }); const H = ch.head;
  const Wt = '#f4eef6', Wd = '#ddd2e2', mag = '#e0309a', pk = '#ff7ac8', blk = '#18141c';
  const sn = new THREE.Group(); sn.position.set(0, 2.2 * U, 4 * U); H.add(sn); ch.snout = sn; vbox(5.0, 2.0, 1.6, Wt, 0, 0.1, 0.8, sn, 0.5); vbox(1.6, 1.3, 1.4, mag, -2.0, 0.2, 1.0, sn, 0.4); vbox(1.6, 1.3, 1.4, mag, 2.0, 0.2, 1.0, sn, 0.4);
  vbox(1.8, 0.9, 0.6, blk, 0, 0.8, 1.75, sn, 0.3); vbox(1.0, 0.4, 0.3, pk, 0, 1.0, 2.05, sn, 0.3); vbox(4.6, 0.3, 0.3, blk, 0, -0.85, 1.55, sn, 0.4); for (let i = -2; i <= 2; i++) vbox(0.55, 0.55, 0.4, '#fff', i * 0.85, -0.55, 1.55, sn, 0.3);
  const ear = () => voxelArt(['.kkkk.', 'kkkkkk', 'kkppkk', 'kppppk', 'kkppkk', '.kkkk.'], { k: blk, p: mag }, 0.6 * U, 1.0 * U);
  for (const sx of [-1, 1]) { const e = ear(); e.position.set(sx * 3.3 * U, (8 + 1.5) * U, -0.4 * U); e.rotation.z = -sx * 0.25; H.add(e); }
  // pink/magenta top hat (Funtime Freddy) — small
  const hat = new THREE.Group(); vbox(4.4, 0.4, 4.4, '#2a1a2a', 0, 0.2, 0, hat, 0.4); vbox(3.0, 2.0, 3.0, mag, 0, 1.4, 0, hat, 0.4); vbox(3.1, 0.5, 3.1, '#2a1a2a', 0, 0.8, 0, hat, 0.4); hat.position.set(-0.3 * U, 8 * U, 0.4 * U); hat.rotation.z = 0.12; H.add(hat);
  attachHatch(ch, hp, { kind: 'funtime', wall: '#18161c', light: '#c06aff', lightI: 0.3 }); ch.baseScale = 1.4; return finish(ch); }

// ===================== FUNTIME FOXY =====================
export function buildFFoxy2(canvas) {
  const A = imgCopy(canvas); eraseRect(A, 32, 0, 32, 8); eraseRect(A, 32, 8, 8, 8); eraseRect(A, 48, 8, 16, 8); eraseRect(A, 32, 32, 24, 16);
  const muz = solidify(region(A, 9, 12, 6, 3.6, 41, 12)); const hp = prepHatch(A, { x: 21, y: 21.5, w: 6, h: 6.5 });
  const ch = new Character('ffoxy', A); const H = ch.head; const Wt = '#f4eef4', pk = '#e8608a', pkD = '#c0406a';
  const m = slab(muz, sc(A), 1.4, 0.5); m.position.set(0, (16 - 13.8) * U, (4 + 0.7) * U); H.add(m); ch.muzzle = m;
  const P = { w: Wt, p: pk, d: pkD }; const ear = () => voxelArt(['..w..', '.wpw.', '.wpw.', 'wwppw', 'wpppw', 'wpppw', 'wwwww'], P, 0.6 * U, 1.0 * U);
  for (const sx of [-1, 1]) { const p = new THREE.Group(); p.position.set(sx * 2.6 * U, 8 * U, -0.6 * U); const e = ear(); e.position.y = 2.1 * U; p.add(e); p.rotation.z = -sx * 0.22; H.add(p); }
  // tail: curved pink/white blocks at the lower back (behind the legs, never crossing them)
  const tail = new THREE.Group(); tail.position.set(0, 1.5 * U, -2.2 * U); ch.torso.add(tail); ch.tail = tail;
  [[0, 0, -0.8, 2.4, pk], [0.6, 1.4, -2.4, 2.8, pk], [1.4, 3.2, -3.4, 2.8, pk], [2.0, 5.2, -3.6, 2.4, Wt], [2.2, 6.8, -3.0, 1.8, Wt]].forEach(([x, y, z, w, c]) => vbox(w, w, w, c, x, y, z, tail, 0.6));
  attachHatch(ch, hp, { kind: 'funtime', wall: '#18161c', light: '#ff6aa0', lightI: 0.3 }); ch.baseScale = 1.4; return finish(ch); }

// ===================== BALLORA =====================
export function buildBallora(canvas) {
  const A = imgCopy(canvas); for (const [x, y, w, h] of [[0, 0, 8, 8], [24, 0, 8, 8], [56, 0, 8, 8], [0, 16, 4, 4], [12, 16, 8, 4], [36, 16, 8, 4], [52, 16, 4, 4], [56, 16, 8, 16], [0, 32, 64, 16], [0, 48, 16, 16], [48, 48, 16, 16]]) eraseRect(A, x, y, w, h);
  eraseRect(A, 32, 0, 32, 8); eraseRect(A, 32, 8, 8, 8); eraseRect(A, 48, 8, 16, 8);
  const hp = prepHatch(A, { x: 21, y: 21, w: 6, h: 5.5 });
  const ch = new Character('ballora', A, { prop: { limbW: 0.9, legW: 0.9 } }); const H = ch.head; const pur = '#6a5cc0', purD = '#4a3c98', pink = '#d860c8', pinkL = '#f090e0';
  const bun = voxelArt(['.pppp.', 'pPPPPp', 'pPPPPp', '.pppp.'], { p: purD, P: pur }, 0.8 * U, 4.0 * U); bun.position.set(0, 9.5 * U, -0.8 * U); H.add(bun);
  vbox(8.6, 1.0, 8.6, pur, 0, 8.3, 0, H, 0.6); vbox(8.6, 2.0, 1.0, pur, 0, 7.4, 3.9, H, 0.6);
  // tutu: flared ring at the hips (her arms stay raised in ballet poses, so nothing crosses it)
  const tutu = new THREE.Group(); tutu.position.y = 0.6 * U; ch.torso.add(tutu); ch.tutu = tutu;
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const b = vbox(3.2, 0.6, 2.6, i % 2 ? pink : pinkL, Math.sin(a) * 5.4, -0.2 + 0.2 * (i % 2), Math.cos(a) * 3.6, tutu, 0.5); b.rotation.y = a; b.rotation.x = 0.25; }
  attachHatch(ch, hp, { kind: 'funtime', wall: '#16141e', light: '#9a8aff', lightI: 0.3 }); ch.baseScale = 1.4; return finish(ch); }

// ===================== props =====================
// giant 3-tier party cake (fits Freddy's cavity: ~0.55 wide) and a birthday cake with candles (flames are emissive)
export function bigCake() { const g = new THREE.Group(); const C = (r, h, col, y) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24), new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 })); m.position.y = y; m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  C(0.26, 0.16, '#f2d8e8', 0.08); C(0.27, 0.03, '#e8508a', 0.165); C(0.19, 0.13, '#fff4f8', 0.245); C(0.2, 0.025, '#2ad8d0', 0.315); C(0.12, 0.11, '#f2d8e8', 0.38); C(0.125, 0.02, '#e8508a', 0.44);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const b = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshStandardMaterial({ color: '#d8202a', roughness: 0.3 })); b.position.set(Math.cos(a) * 0.22, 0.19, Math.sin(a) * 0.22); g.add(b); }
  const ch = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshStandardMaterial({ color: '#d8202a', roughness: 0.3 })); ch.position.y = 0.47; g.add(ch); return g; }
export function bdayCake() { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 24), new THREE.MeshStandardMaterial({ color: '#f6efe2', roughness: 0.6 })); m.position.y = 0.08; m.castShadow = true; g.add(m);
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.025, 24), new THREE.MeshStandardMaterial({ color: '#4a2a1a', roughness: 0.5 })); t.position.y = 0.17; g.add(t);
  const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.015, 24), new THREE.MeshStandardMaterial({ color: '#f2f2f6', roughness: 0.3, metalness: 0.2 })); g.add(pl); g.userData.flames = [];
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const c = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 6), new THREE.MeshStandardMaterial({ color: ['#2ad8d0', '#e8508a', '#f2c030'][i % 3] })); c.position.set(Math.cos(a) * 0.13, 0.215, Math.sin(a) * 0.13); g.add(c);
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.03, 6), new THREE.MeshBasicMaterial({ color: '#ffc040', toneMapped: false })); f.position.set(Math.cos(a) * 0.13, 0.265, Math.sin(a) * 0.13); g.add(f); g.userData.flames.push(f); }
  const L = new THREE.PointLight('#ffb050', 0.6, 2.5, 2); L.position.y = 0.4; g.add(L); g.userData.light = L; return g; }
// round party table with a checkered cloth (the birthday cake sits ON it)
export function partyTable() { const g = new THREE.Group(); const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d'); for (let i = 0; i < 16; i += 2) for (let j = 0; j < 16; j += 2) { x.fillStyle = (i + j) % 4 ? '#f2f2f2' : '#d82a3a'; x.fillRect(i, j, 2, 2); }
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 28), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 })); top.position.y = 0.78; g.add(top);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.6, 0.3, 28, 1, true), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8, side: THREE.DoubleSide })); skirt.position.y = 0.63; g.add(skirt);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.78, 10), new THREE.MeshStandardMaterial({ color: '#2a2a30', metalness: 0.6 })); leg.position.y = 0.39; g.add(leg);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.userData.top = 0.805; return g; }
