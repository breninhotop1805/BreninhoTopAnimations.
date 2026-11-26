// Interior + extra sets for EP01: home (kitchen/living), bedroom, bakery, bank plaza + newsstand, hospital. Props: card terminal,
// ice-cream cart, tea cup, coffee machine, bread, sticker packs, calendar, mirror, bedside clock, incubator.
import * as THREE from 'three';
import { plastic, rbox } from './rbx.js';
import { rng } from './sets.js';
const P = (g, geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; g.add(m); return m; };
export const B = (g, w, h, d, col, x, y, z, r = 0.05, o) => P(g, rbox(w, h, d, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001), 2), plastic(col, o), x, y, z);
const cyl = (g, r0, r1, h, col, x, y, z, o, seg = 24) => P(g, new THREE.CylinderGeometry(r0, r1, h, seg), plastic(col, o), x, y, z);
function cvTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
// a sign / label drawn by me on a real 3D board (Roblox-style in-world text)
export function sign(g, w, h, txt, o = {}) { const t = cvTex(512, Math.round(512 * h / w), (q, W, H) => { q.fillStyle = o.bg || '#fff8e8'; q.beginPath(); q.roundRect(0, 0, W, H, 30); q.fill(); q.lineWidth = 16; q.strokeStyle = o.border || '#3a2a1a'; q.stroke();
    q.fillStyle = o.color || '#2a1a10'; q.textAlign = 'center'; q.textBaseline = 'middle'; const lines = txt.split('\n'); let fs = H / (lines.length + 0.6); q.font = `${fs}px Komikax`; for (const l of lines) while (q.measureText(l).width > W * 0.88 && fs > 10) { fs -= 2; q.font = `${fs}px Komikax`; }
    lines.forEach((l, i) => q.fillText(l, W / 2, H * (i + 1) / (lines.length + 1) + fs * 0.05)); });
  const b = new THREE.Group(); g.add(b); const back = new THREE.Mesh(rbox(w + 0.12, h + 0.12, 0.12, 0.05, 2), plastic(o.frame || '#5a3a20')); back.castShadow = true; b.add(back);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, emissive: o.glow ? '#ffffff' : '#000', emissiveMap: o.glow ? t : null, emissiveIntensity: o.glow ? 0.4 : 0 })); f.position.z = 0.065; b.add(f); return b; }
function room(s, g, w, d, h, wall, floorCol, o = {}) { const fl = P(g, new THREE.BoxGeometry(w, 0.2, d), plastic(floorCol, { rough: 0.6 }), 0, -0.1, 0);
  const planks = cvTex(256, 256, (q, W, H) => { q.fillStyle = floorCol; q.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 32) { q.fillStyle = 'rgba(0,0,0,0.14)'; q.fillRect(0, y, W, 3); for (let x = (y / 32 % 2) * 64; x < W; x += 128) q.fillRect(x, y, 3, 32); } }); planks.wrapS = planks.wrapT = THREE.RepeatWrapping; planks.repeat.set(w / 4, d / 4);
  if (o.planks !== false) fl.material = new THREE.MeshStandardMaterial({ map: planks, roughness: 0.55 });
  const wp = cvTex(256, 256, (q, W, H) => { q.fillStyle = wall; q.fillRect(0, 0, W, H); if (o.stripes) for (let x = 0; x < W; x += 64) { q.fillStyle = 'rgba(255,255,255,0.18)'; q.fillRect(x, 0, 26, H); } if (o.dots) for (let y = 16; y < H; y += 48) for (let x = 16 + (y % 96 ? 24 : 0); x < W; x += 48) { q.fillStyle = 'rgba(255,255,255,0.35)'; q.beginPath(); q.arc(x, y, 6, 0, 7); q.fill(); } });
  wp.wrapS = wp.wrapT = THREE.RepeatWrapping; wp.repeat.set(w / 5, h / 5); const wm = new THREE.MeshStandardMaterial({ map: wp, roughness: 0.85 });
  P(g, new THREE.BoxGeometry(w, h, 0.3), wm, 0, h / 2, -d / 2); for (const sx of [-1, 1]) P(g, new THREE.BoxGeometry(0.3, h, d), wm, sx * w / 2, h / 2, 0);
  B(g, w, 0.5, 0.36, o.trim || '#f4f0e6', 0, 0.25, -d / 2 + 0.05, 0.04); for (const sx of [-1, 1]) B(g, 0.36, 0.5, d, o.trim || '#f4f0e6', sx * (w / 2 - 0.05), 0.25, 0, 0.04);
  P(g, new THREE.BoxGeometry(w, 0.2, d), plastic(o.ceil || '#f4f2ec'), 0, h + 0.1, 0); }
function windowOn(g, x, y, z, w, h, ry = 0, night) { const W = new THREE.Group(); W.position.set(x, y, z); W.rotation.y = ry; g.add(W); B(W, w + 0.3, h + 0.3, 0.3, '#f6f4ee', 0, 0, 0, 0.05);
  P(W, new THREE.BoxGeometry(w, h, 0.32), new THREE.MeshStandardMaterial({ color: night ? '#1a2a5a' : '#bfe4ff', emissive: night ? '#2a3a7a' : '#cfeaff', emissiveIntensity: night ? 0.5 : 0.9, roughness: 0.2 }), 0, 0, 0);
  B(W, 0.1, h, 0.36, '#f6f4ee', 0, 0, 0, 0.02); B(W, w, 0.1, 0.36, '#f6f4ee', 0, 0, 0, 0.02); for (const s of [-1, 1]) B(W, w * 0.35, h + 0.4, 0.12, '#e87a8a', s * (w / 2 + 0.25), 0.1, 0.25, 0.05); return W; }
function lights(s, o) { s.add(new THREE.HemisphereLight(o.sky || '#fff4e0', o.ground || '#8a6a5a', o.hemi ?? 1.1)); const k = new THREE.DirectionalLight(o.key || '#fff0d8', o.keyI ?? 2.4); k.position.set(...(o.keyPos || [-8, 12, 10])); k.target.position.set(0, 1, -2);
  k.castShadow = true; k.shadow.mapSize.set(2048, 2048); k.shadow.radius = 5; k.shadow.bias = -0.0008; k.shadow.normalBias = 0.06; Object.assign(k.shadow.camera, { left: -14, right: 14, top: 14, bottom: -6, near: 1, far: 50 }); s.add(k, k.target); return k; }

// ---------- props ----------
export function cup(col = '#f4f4f4', liquid = '#b06a3a') { const g = new THREE.Group(); cyl(g, 0.2, 0.17, 0.36, col, 0, 0, 0); const l = cyl(g, 0.18, 0.18, 0.02, liquid, 0, 0.17, 0); const h = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 16), plastic(col)); h.position.set(0.22, 0.02, 0); g.add(h); return g; }
export function bread() { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.6, 8, 16), plastic('#d89a4a', { rough: 0.7 })); b.rotation.z = Math.PI / 2; b.castShadow = true; g.add(b);
  for (let i = -1; i <= 1; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.3), plastic('#f0d0a0')); c.position.set(i * 0.2, 0.2, 0); c.rotation.y = 0.5; g.add(c); } return g; }
export function iceCream() { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 16), plastic('#d8a05a')); c.rotation.x = Math.PI; c.position.y = -0.1; c.castShadow = true; g.add(c);
  const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), plastic('#f4a0c0')); s1.position.y = 0.24; g.add(s1); const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), plastic('#fff0d8')); s2.position.y = 0.52; g.add(s2); return g; }
export function stickerPack(col) { const g = new THREE.Group(); const t = cvTex(64, 96, (q, W, H) => { q.fillStyle = col; q.fillRect(0, 0, W, H); q.fillStyle = '#fff'; q.font = '20px Komikax'; q.textAlign = 'center'; q.fillText('★', W / 2, H * 0.55); q.fillStyle = 'rgba(255,255,255,0.4)'; q.fillRect(0, 0, W, 8); });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.5, 0.03), new THREE.MeshStandardMaterial({ map: t, roughness: 0.3, metalness: 0.2 })); m.castShadow = true; g.add(m); return g; }
// card terminal on a little stand (where people pay with time)
export function terminal(g, x, z) { const T = new THREE.Group(); T.position.set(x, 0, z); g.add(T); B(T, 0.3, 3.0, 0.3, '#3a3a44', 0, 1.5, 0, 0.08); B(T, 1.2, 0.9, 0.5, '#26262e', 0, 3.2, 0, 0.12);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), new THREE.MeshBasicMaterial({ color: '#5af0ff', toneMapped: false })); scr.position.set(0, 3.25, 0.26); T.add(scr); T.screen = scr; T.top = new THREE.Vector3(x, 3.25, z + 0.3); return T; }
export function iceCart(g, x, z) { const C = new THREE.Group(); C.position.set(x, 0, z); g.add(C); B(C, 3.2, 1.6, 1.6, '#f4f4f4', 0, 1.25, 0, 0.15); B(C, 3.3, 0.3, 1.7, '#5ac8e8', 0, 2.1, 0, 0.1);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.12, 10, 24), plastic('#2a2a30')); w.position.set(s * 1.1, 0.45, 0.82); g.add(w); w.position.add(C.position); }
  B(C, 0.12, 2.6, 0.12, '#d8d8d8', -1.4, 3.3, -0.6, 0.04); const um = new THREE.Mesh(new THREE.ConeGeometry(2.2, 0.9, 12, 1, true), new THREE.MeshStandardMaterial({ color: '#f45a8a', side: THREE.DoubleSide, roughness: 0.6 })); um.position.set(-1.4, 4.8, -0.6); um.castShadow = true; C.add(um);
  for (const [col, x] of [['#f4a0c0', -0.8], ['#fff0d8', 0], ['#8ad870', 0.8]]) { const sc = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), plastic(col)); sc.position.set(x, 2.4, 0.2); C.add(sc); }
  const sg = sign(C, 2.6, 0.9, 'SORVETE\n1 HORA', { bg: '#fff2f6', border: '#f45a8a', color: '#d8285a' }); sg.position.set(0, 1.25, 0.84); return C; }
export function calendar(g, x, y, z, ry = 0) { const C = new THREE.Group(); C.position.set(x, y, z); C.rotation.y = ry; g.add(C); B(C, 1.6, 1.9, 0.1, '#f8f6f0', 0, 0, 0, 0.04); B(C, 1.6, 0.45, 0.12, '#d8282a', 0, 0.75, 0.01, 0.04);
  const S = { c: document.createElement('canvas') }; S.c.width = 256; S.c.height = 256; const t = new THREE.CanvasTexture(S.c); t.colorSpace = THREE.SRGBColorSpace; const f = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.3), new THREE.MeshStandardMaterial({ map: t })); f.position.set(0, -0.15, 0.06); C.add(f);
  C.set = txt => { if (C._t === txt) return; C._t = txt; const q = S.c.getContext('2d'); q.fillStyle = '#f8f6f0'; q.fillRect(0, 0, 256, 256); q.fillStyle = '#2a2a2a'; q.font = '62px Komikax'; q.textAlign = 'center'; q.textBaseline = 'middle'; let fs = 62; while (q.measureText(txt).width > 236) { fs -= 2; q.font = `${fs}px Komikax`; } q.fillText(txt, 128, 128); t.needsUpdate = true; }; C.set('SEGUNDA'); return C; }

// ---------- HOME: kitchen + living (morning sun) ----------
export function buildHome(S, o = {}) { const night = !!o.night; const s = new THREE.Scene(); s.background = new THREE.Color(night ? '#0a0c18' : '#f4e8d8'); const g = new THREE.Group(); s.add(g);
  room(s, g, 16, 12, 6, '#f6d6a8', '#b07a4a', { dots: true, trim: '#ffffff' });
  windowOn(g, -3.5, 3.2, -5.85, 3, 2.2, 0, night); windowOn(g, -7.85, 3.2, -1, 2.4, 2.2, Math.PI / 2, night);
  // kitchen counter + stove + fridge on the right of the back wall
  B(g, 5.5, 2.0, 1.4, '#ffffff', 4.0, 1.0, -5.1, 0.08); B(g, 5.7, 0.2, 1.6, '#5a8ad8', 4.0, 2.1, -5.05, 0.06); B(g, 1.6, 0.1, 1.0, '#2a2a30', 2.6, 2.24, -5.1, 0.03);
  for (const [cx, cz] of [[2.2, -5.3], [3.0, -4.9]]) cyl(g, 0.28, 0.28, 0.04, '#5a5a60', cx, 2.3, cz);
  B(g, 1.8, 4.2, 1.4, '#e8eef4', 7.0, 2.1, -5.1, 0.12); B(g, 0.12, 1.2, 0.12, '#b8b8c0', 6.3, 3.0, -4.35, 0.04);
  B(g, 4.5, 1.2, 0.8, '#d8f0e0', 4.0, 4.3, -5.4, 0.08);
  { const cm = new THREE.Group(); cm.position.set(5.6, 2.2, -5.1); g.add(cm); B(cm, 1.0, 1.3, 0.9, '#2a2a30', 0, 0.65, 0, 0.1); B(cm, 0.7, 0.2, 0.5, '#c8c8d0', 0, 1.2, 0.1, 0.05); const pot = cup('#3a2a20', '#2a160a'); pot.position.set(0, 0.25, 0.25); cm.add(pot);
    const tg = sign(cm, 1.3, 0.75, 'CAFÉ\n1 DIA', { bg: '#fff8e8', border: '#c8282a', color: '#c8282a' }); tg.position.set(0, 1.9, 0.2); S.coffee = new THREE.Vector3(5.6, 3.0, -4.6); }
  // table with 2 chairs (centre-left)
  const T = new THREE.Group(); T.position.set(-1.8, 0, -1.2); g.add(T); B(T, 3.2, 0.2, 2.0, '#c8864a', 0, 2.2, 0, 0.06); for (const [x, z] of [[-1.4, -0.8], [1.4, -0.8], [-1.4, 0.8], [1.4, 0.8]]) B(T, 0.2, 2.1, 0.2, '#a86a3a', x, 1.05, z, 0.05);
  const cloth = cvTex(128, 128, (q) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { q.fillStyle = (x + y) % 2 ? '#f4f4f4' : '#e85a5a'; q.fillRect(x * 16, y * 16, 16, 16); } }); P(T, new THREE.BoxGeometry(2.6, 0.03, 1.6), new THREE.MeshStandardMaterial({ map: cloth }), 0, 2.32, 0);
  S.homeTable = { x: -1.8, z: -1.2, top: 2.34 };
  // two chairs at the ends of the table (seat top y = 1.5)
  for (const [cx, ry] of [[-3.9, 0], [0.3, 0]]) { const ch = new THREE.Group(); ch.position.set(cx, 0, -2.75); ch.rotation.y = ry; g.add(ch); B(ch, 1.6, 0.2, 1.6, '#c8864a', 0, 1.4, 0, 0.05);
    for (const [x, z] of [[-0.65, -0.65], [0.65, -0.65], [-0.65, 0.65], [0.65, 0.65]]) B(ch, 0.16, 1.4, 0.16, '#a86a3a', x, 0.7, z, 0.04); B(ch, 1.6, 2.0, 0.18, '#c8864a', 0, 2.4, -0.72, 0.06); }
  S.chairs = { L: new THREE.Vector3(-3.9, 1.5, -2.75), R: new THREE.Vector3(0.3, 1.5, -2.75) };
  // wall clock + calendar + mirror (living side, left wall)
  const ck = new THREE.Group(); ck.position.set(0.8, 4.4, -5.84); g.add(ck); cyl(ck, 0.6, 0.6, 0.12, '#ffffff', 0, 0, 0).rotation.x = Math.PI / 2; const hand1 = B(ck, 0.06, 0.45, 0.04, '#222', 0, 0.18, 0.1, 0.02); S.clockHands = [hand1];
  S.homeCal = calendar(g, -6.0, 3.6, -5.8); const mir = new THREE.Group(); mir.position.set(-7.8, 3.0, 2.6); mir.rotation.y = Math.PI / 2; g.add(mir); B(mir, 2.0, 2.8, 0.15, '#c8a040', 0, 0, 0, 0.1);
  P(mir, new THREE.PlaneGeometry(1.7, 2.5), new THREE.MeshStandardMaterial({ color: '#cfe0f0', metalness: 0.9, roughness: 0.08 }), 0, 0, 0.08); S.mirror = new THREE.Vector3(-7.7, 3.0, 2.6);
  // plants + rug + sofa (far left)
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.03, 40), plastic('#e8c05a')); rug.position.set(-1.8, 0.02, 2.4); rug.receiveShadow = true; g.add(rug);
  cyl(g, 0.45, 0.35, 0.8, '#c8643a', -7.0, 0.4, -5.0); const pl = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 12), plastic('#3ea84a', { rough: 0.8 })); pl.position.set(-7.0, 1.5, -5.0); pl.castShadow = true; g.add(pl);
  const sun = lights(s, night ? { sky: '#3a4a8a', ground: '#1a1420', hemi: 0.35, key: '#8aa0ff', keyI: 0.5 } : { keyPos: [-10, 9, 2], keyI: 2.6 });
  if (night) { const lamp = new THREE.PointLight('#ffc888', 14, 12, 1.6); lamp.position.set(-1.8, 5.0, -1.2); s.add(lamp); const sh = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.6, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#f0d0a0', emissive: '#ffd090', emissiveIntensity: 0.6, side: THREE.DoubleSide })); sh.position.set(-1.8, 5.3, -1.2); g.add(sh); }
  else { const win = new THREE.SpotLight('#fff0d0', 120, 20, 0.6, 0.6, 1.4); win.position.set(-3.5, 4, -9); win.target.position.set(-1.5, 0, 1); s.add(win, win.target); }
  S[o.name || 'home'] = s; return s; }

// ---------- BEDROOM (hero's room): bed, nightstand + digital clock, door on hinge, window, wardrobe, posters ----------
export function buildBedroom(S, o = {}) { const night = !!o.night; const s = new THREE.Scene(); s.background = new THREE.Color(night ? '#05060e' : '#f0e6f0'); const g = new THREE.Group(); s.add(g);
  room(s, g, 16, 13, 6, night ? '#5a6ab0' : '#8ab4e8', '#9a6a44', { stripes: true, trim: '#ffffff', ceil: '#eef0f6' });
  windowOn(g, -4.5, 3.4, -6.35, 2.6, 2.2, 0, night);
  // bed (head against the back wall, centre)
  const bed = new THREE.Group(); bed.position.set(0.5, 0, -3.6); g.add(bed); B(bed, 7.6, 0.9, 5.4, '#7a4a2a', 0, 0.55, 0, 0.1); B(bed, 7.4, 0.6, 5.2, '#ffffff', 0, 1.2, 0, 0.18);
  const quilt = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const q = c.getContext('2d'); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { q.fillStyle = ['#e8743a', '#f4c25a', '#5ab0d8', '#e85a9a'][(x + y * 2) % 4]; q.fillRect(x * 32, y * 32, 32, 32); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  P(bed, rbox(7.6, 0.3, 3.4, 0.12, 2), new THREE.MeshStandardMaterial({ map: quilt, roughness: 0.8 }), 0, 1.55, 0.9); B(bed, 7.8, 2.4, 0.4, '#7a4a2a', 0, 1.2, -2.75, 0.12); B(bed, 2.2, 0.5, 1.0, '#ffffff', -1.5, 1.7, -1.9, 0.2); B(bed, 2.2, 0.5, 1.0, '#ffffff', 2.5, 1.7, -1.9, 0.2);
  S.bed = { x: 0.5, z: -3.6, top: 1.5, headZ: -5.5 };
  // nightstand + digital clock (shows 03:00)
  B(g, 1.4, 1.6, 1.2, '#a86a3a', -4.5, 0.8, -5.6, 0.08); const ct = document.createElement('canvas'); ct.width = 256; ct.height = 128; const cq = ct.getContext('2d'); const ctex = new THREE.CanvasTexture(ct);
  S.bedClock = txt => { cq.fillStyle = '#0a0a0e'; cq.fillRect(0, 0, 256, 128); cq.fillStyle = '#ff3a2a'; cq.shadowColor = '#ff3a2a'; cq.shadowBlur = 14; cq.font = '84px Komikax'; cq.textAlign = 'center'; cq.textBaseline = 'middle'; cq.fillText(txt, 128, 68); cq.shadowBlur = 0; ctex.needsUpdate = true; }; S.bedClock('03:00');
  B(g, 1.1, 0.6, 0.5, '#20202a', -4.5, 1.9, -5.6, 0.08); const cm = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.42), new THREE.MeshBasicMaterial({ map: ctex, toneMapped: false })); cm.position.set(-4.5, 1.92, -5.34); g.add(cm); S.bedClockPos = new THREE.Vector3(-4.5, 1.92, -5.34);
  if (night) { const cl = new THREE.PointLight('#ff4030', 1.0, 3, 2); cl.position.set(-4.5, 2.0, -5.0); s.add(cl);
    const nl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 10), new THREE.MeshBasicMaterial({ color: '#ffd9a0', toneMapped: false })); nl.position.set(3.4, 1.0, -6.3); nl.scale.z = 0.5; g.add(nl); B(g, 0.3, 0.42, 0.1, '#f0f0f0', 3.4, 1.0, -6.42, 0.03);
    const nll = new THREE.PointLight('#ffb878', 9, 10, 1.6); nll.position.set(3.4, 1.3, -5.9); s.add(nll); }
  // door on the right wall, hinge at its back edge -> S.bedDoor(k) opens it 0..1 (into the room, toward the camera side)
  const fr = new THREE.Group(); fr.position.set(7.85, 0, -1.0); g.add(fr); B(fr, 0.3, 4.4, 0.25, '#ffffff', 0, 2.2, -1.35, 0.04); B(fr, 0.3, 4.4, 0.25, '#ffffff', 0, 2.2, 1.35, 0.04); B(fr, 0.3, 0.3, 2.95, '#ffffff', 0, 4.3, 0, 0.04);
  const hall = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 4.2), new THREE.MeshBasicMaterial({ color: night ? '#ffe0b0' : '#f4e4c8', toneMapped: false })); hall.position.set(8.0, 2.1, -1.0); hall.rotation.y = -Math.PI / 2; g.add(hall);
  const hinge = new THREE.Group(); hinge.position.set(7.75, 0, -2.2); g.add(hinge); const dr = B(hinge, 0.18, 4.1, 2.35, '#c88a5a', 0, 2.05, 1.18, 0.05); const knob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), plastic('#d8b040', { metal: 0.6 })); knob.position.set(-0.15, 2.0, 2.1); hinge.add(knob);
  S.bedDoor = k => { hinge.rotation.y = -k * 1.3; }; S.bedDoor(0); S.doorLight = new THREE.SpotLight('#ffc888', 0, 14, 0.5, 0.6, 1.4); S.doorLight.position.set(8.6, 3.6, -1); S.doorLight.target.position.set(1, 0.5, -2); s.add(S.doorLight, S.doorLight.target);
  // wardrobe (left), rug, posters, toys
  B(g, 2.6, 4.6, 1.4, '#e8e0d0', -6.4, 2.3, -5.4, 0.1); for (const sx of [-1, 1]) B(g, 0.08, 0.6, 0.08, '#888', -6.4 + sx * 0.2, 2.5, -4.68, 0.03);
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.03, 40), plastic('#f4a0c0')); rug.position.set(-2.4, 0.02, 1.2); rug.receiveShadow = true; g.add(rug);
  sign(g, 1.4, 1.9, '★', { bg: '#2a3a8a', color: '#f4d04a', border: '#f4d04a' }).position.set(3.8, 3.8, -6.3); sign(g, 1.6, 1.2, 'GOL!', { bg: '#3ab04a', color: '#fff', border: '#ffffff' }).position.set(-1.8, 4.0, -6.3);
  const L = lights(s, night ? { sky: '#3a4ab0', ground: '#141020', hemi: 0.95, key: '#8a9cff', keyI: 1.5, keyPos: [-6, 10, -12] } : { keyPos: [-8, 10, -12], keyI: 2.2 });
  if (night) { const moon = new THREE.SpotLight('#9ab0ff', 120, 20, 0.5, 0.7, 1.4); moon.position.set(-4.5, 5, -9); moon.target.position.set(0.5, 1.5, -3); s.add(moon, moon.target); }
  else { const win = new THREE.SpotLight('#fff0d0', 110, 20, 0.55, 0.6, 1.4); win.position.set(-4.5, 4.5, -10); win.target.position.set(0.5, 1, -3); s.add(win, win.target); }
  S[o.name || 'bedroom'] = s; return s; }

// ---------- BAKERY ----------
export function buildBakery(S) { const s = new THREE.Scene(); s.background = new THREE.Color('#f8e8d0'); const g = new THREE.Group(); s.add(g);
  room(s, g, 16, 12, 6, '#f4c890', '#c8a070', { stripes: true, trim: '#8a4a2a' });
  // counter with glass display
  B(g, 8, 2.2, 1.6, '#8a4a2a', 0, 1.1, -2.0, 0.1); B(g, 8.2, 0.2, 1.8, '#f4f0e6', 0, 2.3, -2.0, 0.06); const gl = new THREE.Mesh(rbox(7.6, 1.2, 1.2, 0.08, 2), new THREE.MeshStandardMaterial({ color: '#d8f0ff', transparent: true, opacity: 0.35, roughness: 0.05 })); gl.position.set(0, 3.0, -2.0); g.add(gl);
  for (let i = 0; i < 6; i++) { const b = bread(); b.position.set(-3 + i * 1.2, 2.65, -2.0); b.rotation.y = 0.3; g.add(b); }
  // shelves with breads on the back wall
  for (const y of [2.2, 3.6]) { B(g, 10, 0.18, 1.0, '#a86a3a', 0, y, -5.4, 0.04); for (let i = 0; i < 7; i++) { const b = bread(); b.position.set(-4.2 + i * 1.4, y + 0.32, -5.3); b.scale.setScalar(1.1); g.add(b); } }
  const sg = sign(g, 3.6, 1.6, 'PÃO\n10 MIN', { bg: '#fff8e8', border: '#8a4a2a', color: '#c8401a' }); sg.position.set(0, 4.9, -5.75); S.bakerySign = sg;
  const sg2 = sign(g, 4.4, 1.0, 'PADARIA', { bg: '#8a4a2a', color: '#fff4d8', border: '#5a2a10' }); sg2.position.set(-4.6, 4.9, -5.75);
  terminal(g, 3.6, -1.2).position.y = -0.9; S.bakeryTerminal = new THREE.Vector3(3.6, 2.35, -0.9);
  lights(s, { keyPos: [-6, 12, 10], keyI: 2.2 }); const lamp = new THREE.PointLight('#ffd8a0', 18, 14, 1.5); lamp.position.set(0, 5.4, -1); s.add(lamp); S.bakery = s; return s; }

// ---------- BANK plaza (rich kid) + NEWSSTAND ----------
export function buildBank(S) { const s = new THREE.Scene(); s.background = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const q = c.getContext('2d'); const gr = q.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#4aa0f0'); gr.addColorStop(1, '#d8eeff'); q.fillStyle = gr; q.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const g = new THREE.Group(); s.add(g); const fl = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), plastic('#e8e2d4')); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
  const tiles = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshStandardMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const q = c.getContext('2d'); q.fillStyle = '#ece6d8'; q.fillRect(0, 0, 128, 128); q.strokeStyle = '#d0c8b4'; q.lineWidth = 4; q.strokeRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(20, 14); t.colorSpace = THREE.SRGBColorSpace; return t; })() }));
  tiles.rotation.x = -Math.PI / 2; tiles.position.y = 0.01; tiles.receiveShadow = true; g.add(tiles);
  // bank building: steps, columns, pediment, gold sign
  B(g, 22, 12, 4, '#f4ecdc', 0, 6, -12, 0.1); for (let i = 0; i < 3; i++) B(g, 16 - i * 0.8, 0.4, 2.0 - i * 0.4, '#e0d6c2', 0, 0.2 + i * 0.4, -8.6 - i * 0.3, 0.05);
  for (let i = 0; i < 6; i++) { const c = cyl(g, 0.5, 0.55, 8.0, '#ffffff', -6.25 + i * 2.5, 5.2, -9.4); } B(g, 17, 0.8, 1.6, '#f4ecdc', 0, 9.6, -9.6, 0.08);
  { const sh = new THREE.Shape(); sh.moveTo(-9, 0); sh.lineTo(9, 0); sh.lineTo(0, 2.6); sh.lineTo(-9, 0); const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 1.4, bevelEnabled: false }), plastic('#f4ecdc')); ped.position.set(0, 10.0, -10.3); ped.castShadow = true; g.add(ped); }
  const sg = sign(g, 8, 1.4, 'BANCO DO TEMPO', { bg: '#2a2a3a', color: '#f4c84a', border: '#f4c84a', glow: true }); sg.position.set(0, 8.4, -8.75);
  B(g, 3.4, 5.4, 0.3, '#5a3a20', 0, 2.9, -10.0, 0.06); const sh = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.25, 40), plastic('#f4c84a', { metal: 0.8, rough: 0.25 })); sh.rotation.x = Math.PI / 2; sh.position.set(0, 10.9, -9.0); g.add(sh);
  // newsstand on the right
  const N = new THREE.Group(); N.position.set(6.5, 0, -2.5); g.add(N); B(N, 4.4, 3.0, 2.4, '#2a8a5a', 0, 1.5, 0, 0.1); B(N, 4.8, 0.3, 3.0, '#f4c84a', 0, 3.6, 0.2, 0.1);
  for (let i = 0; i < 8; i++) { const p = stickerPack(['#e8282a', '#2a6ae8', '#f4c84a', '#8a3ac8'][i % 4]); p.position.set(-1.6 + (i % 4) * 1.05, 1.6 + Math.floor(i / 4) * 0.7, 1.22); N.add(p); }
  const ns = sign(N, 3.0, 0.8, 'FIGURINHAS', { bg: '#ffffff', color: '#2a8a5a', border: '#2a8a5a' }); ns.position.set(0, 4.25, 1.4);
  S.newsstand = new THREE.Vector3(6.5, 0, -1.0); lights(s, { keyPos: [-10, 18, 14], keyI: 3.0, sky: '#d8ecff', ground: '#b8a888', hemi: 1.3 }); S.bank = s; return s; }

// ---------- HOSPITAL (flashback) ----------
export function buildHospital(S) { const s = new THREE.Scene(); s.background = new THREE.Color('#e8f4f0'); const g = new THREE.Group(); s.add(g);
  room(s, g, 16, 12, 6, '#cfeee0', '#dfe6ea', { stripes: true, trim: '#ffffff', planks: false });
  // incubator: base + transparent dome, baby inside (added by the shots), monitor with heart line
  const I = new THREE.Group(); I.position.set(0, 0, -2.5); g.add(I); B(I, 3.0, 2.2, 1.8, '#f4f6f8', 0, 1.1, 0, 0.12); B(I, 3.1, 0.2, 1.9, '#5ab0d8', 0, 2.25, 0, 0.06);
  const dome = new THREE.Mesh(rbox(2.8, 1.5, 1.6, 0.3, 4), new THREE.MeshStandardMaterial({ color: '#e8f6ff', transparent: true, opacity: 0.22, roughness: 0.05, depthWrite: false })); dome.position.set(0, 3.1, 0); I.add(dome); S.incDome = dome;
  const mat = new THREE.Mesh(rbox(2.4, 0.2, 1.3, 0.08, 2), plastic('#ffffff')); mat.position.set(0, 2.45, 0); I.add(mat); S.incubator = { x: 0, z: -2.5, top: 2.55 };
  const mon = new THREE.Group(); mon.position.set(3.6, 0, -4.8); g.add(mon); B(mon, 0.2, 4.2, 0.2, '#b8c0c8', 0, 2.1, 0, 0.05); B(mon, 1.8, 1.3, 0.4, '#2a2e36', 0, 4.4, 0, 0.1);
  const mc = document.createElement('canvas'); mc.width = 256; mc.height = 160; const mt = new THREE.CanvasTexture(mc); S.monitorDraw = (t) => { const q = mc.getContext('2d'); q.fillStyle = '#061008'; q.fillRect(0, 0, 256, 160); q.strokeStyle = '#3aff6a'; q.lineWidth = 4; q.beginPath(); for (let x = 0; x < 256; x++) { const p = ((x + t * 120) % 256) / 256; const y = 80 - (Math.abs(p - 0.5) < 0.03 ? 50 * Math.sin((p - 0.47) / 0.06 * Math.PI * 2) : 0); x ? q.lineTo(x, y) : q.moveTo(x, y); } q.stroke(); mt.needsUpdate = true; }; S.monitorDraw(0);
  const ms = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), new THREE.MeshBasicMaterial({ map: mt, toneMapped: false })); ms.position.set(0, 4.4, 0.21); mon.add(ms);
  windowOn(g, -4.5, 3.4, -5.85, 3, 2.2, 0, true); B(g, 4, 0.1, 1.2, '#ffffff', 0, 5.95, -2.5, 0.03);
  const l = new THREE.PointLight('#ffffff', 30, 16, 1.5); l.position.set(0, 5.6, -1.5); s.add(l); lights(s, { keyPos: [6, 12, 8], keyI: 1.6, sky: '#f0fff8', ground: '#b8c8c0', hemi: 1.2 }); S.hospital = s; return s; }
