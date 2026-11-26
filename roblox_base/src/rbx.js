// Roblox R6 character (studs = 1 unit): soft plastic parts with rounded edges, the classic rounded-cylinder head,
// a 2D face DECAL drawn on a canvas (expressions = redraw, never extra geometry), accessories as real 3D meshes.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// subtle mottled "plastic" texture (the references have a soft grain on every part)
const NOISE = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const d = g.createImageData(128, 128);
  for (let i = 0; i < d.data.length; i += 4) { const v = 235 + Math.random() * 20; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0);
  g.filter = 'blur(2px)'; g.drawImage(c, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; })();
const MATS = new Map();
export function plastic(color, o = {}) { const k = color + JSON.stringify(o); if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial({ color, map: NOISE, roughness: o.rough ?? 0.5, metalness: o.metal ?? 0, emissive: o.em || '#000', emissiveIntensity: o.ei || 0 })); return MATS.get(k); }
export const rbox = (w, h, d, r = 0.07, s = 3) => new RoundedBoxGeometry(w, h, d, s, r);
function mesh(geo, mat, p, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m; }

// classic head: a vertical cylinder with rounded top/bottom edges (lathe profile)
function headGeo(r = 0.62, h = 1.22, e = 0.2) { const pts = [new THREE.Vector2(0, -h / 2)]; const N = 8;
  for (let i = 0; i <= N; i++) { const a = -Math.PI / 2 + i / N * Math.PI / 2; pts.push(new THREE.Vector2(r - e + Math.cos(a) * e, -h / 2 + e + Math.sin(a) * e)); }
  for (let i = 0; i <= N; i++) { const a = i / N * Math.PI / 2; pts.push(new THREE.Vector2(r - e + Math.cos(a) * e, h / 2 - e + Math.sin(a) * e)); }
  pts.push(new THREE.Vector2(0, h / 2)); return new THREE.LatheGeometry(pts, 48); }

// ---------------- face decal ----------------
// f = { eyes: 'normal'|'wide'|'closed'|'happy'|'angry'|'sad'|'dot', brow: -1..1 (sad..angry) or null, mouth: 'smile'|'grin'|'o'|'frown'|'flat'|'open'|'wavy'|'smirk'|'teeth',
//       talk: 0..1 (mouth opening while speaking), look: [-1..1, -1..1] pupils offset, blink: 0..1, tears: 0..1, blush: 0..1 }
export function drawFace(g, f, S = 512) { g.clearRect(0, 0, S, S); const cx = S / 2, ey = S * 0.47, ex = S * 0.13; const k = '#111';
  const lx = (f.look?.[0] || 0) * S * 0.02, ly = (f.look?.[1] || 0) * S * 0.015; const bl = Math.min(1, f.blink || 0);
  g.lineCap = 'round'; g.lineJoin = 'round';
  // blush
  if (f.blush) { g.fillStyle = `rgba(255,120,140,${0.45 * f.blush})`; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * S * 0.2, S * 0.61, S * 0.07, S * 0.035, 0, 0, 7); g.fill(); } }
  // eyes
  for (const s of [-1, 1]) { const x = cx + s * ex + lx, y = ey + ly; g.fillStyle = k; g.strokeStyle = k;
    const type = bl > 0.6 ? 'closed' : f.eyes || 'normal';
    if (type === 'closed') { g.lineWidth = S * 0.022; g.beginPath(); g.arc(x, y - S * 0.01, S * 0.04, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
    else if (type === 'happy') { g.lineWidth = S * 0.024; g.beginPath(); g.arc(x, y + S * 0.025, S * 0.045, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); }
    else { const big = type === 'wide' ? 1.45 : type === 'dot' ? 0.7 : 1; const rx = S * 0.032 * big, ry = S * 0.055 * big * (1 - bl * 0.8);
      g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill();
      if (type === 'wide') { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x - rx * 0.3, y - ry * 0.35, rx * 0.3, ry * 0.22, 0, 0, 7); g.fill(); }
      else { g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(x - rx * 0.25, y - ry * 0.45, rx * 0.28, ry * 0.18, 0, 0, 7); g.fill(); }
      if (type === 'angry' || type === 'sad') { g.fillStyle = '#f4f4f4'; g.save(); g.translate(x, y); g.rotate(s * (type === 'angry' ? -0.45 : 0.45)); g.fillRect(-rx * 1.6, -ry * 1.9, rx * 3.2, ry * 1.1); g.restore(); } } }
  // eyebrows
  if (f.brow != null) { g.strokeStyle = k; g.lineWidth = S * 0.02; for (const s of [-1, 1]) { const a = f.brow * 0.45 * s; const x = cx + s * ex + lx, y = ey - S * 0.11 + ly; const dx = Math.cos(a) * S * 0.05, dy = Math.sin(a) * S * 0.05;
    g.beginPath(); g.moveTo(x - dx, y + dy); g.lineTo(x + dx, y - dy); g.stroke(); } }
  // tears
  if (f.tears) { g.fillStyle = `rgba(80,160,255,${0.9 * f.tears})`; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * ex + s * S * 0.01, ey + S * 0.1, S * 0.018, S * 0.04 * f.tears, 0, 0, 7); g.fill(); } }
  // mouth
  const my = S * 0.67, t = Math.max(0, Math.min(1, f.talk || 0)); g.strokeStyle = k; g.fillStyle = k; g.lineWidth = S * 0.024; const m = f.mouth || 'smile';
  if (t > 0.05 && (m === 'smile' || m === 'flat' || m === 'frown')) { // talking: an open rounded mouth whose height follows t
    g.beginPath(); g.ellipse(cx, my, S * 0.07, S * 0.012 + S * 0.05 * t, 0, 0, 7); g.fill(); g.fillStyle = '#c0394a'; g.beginPath(); g.ellipse(cx, my + S * 0.03 * t, S * 0.04, S * 0.02 * t, 0, 0, 7); g.fill(); return; }
  g.beginPath();
  if (m === 'smile') { g.arc(cx, my - S * 0.1, S * 0.13, 0.22 * Math.PI, 0.78 * Math.PI); g.stroke(); }
  else if (m === 'smirk') { g.moveTo(cx - S * 0.08, my); g.quadraticCurveTo(cx + S * 0.03, my + S * 0.03, cx + S * 0.1, my - S * 0.04); g.stroke(); }
  else if (m === 'frown') { g.arc(cx, my + S * 0.11, S * 0.1, 1.25 * Math.PI, 1.75 * Math.PI); g.stroke(); }
  else if (m === 'flat') { g.moveTo(cx - S * 0.07, my); g.lineTo(cx + S * 0.07, my); g.stroke(); }
  else if (m === 'wavy') { g.moveTo(cx - S * 0.09, my); for (let i = 1; i <= 6; i++) g.lineTo(cx - S * 0.09 + i * S * 0.03, my + (i % 2 ? -1 : 1) * S * 0.015); g.stroke(); }
  else if (m === 'o') { g.ellipse(cx, my, S * 0.045 * (1 + t * 0.3), S * 0.06 * (1 + t * 0.4), 0, 0, 7); g.fill(); }
  else if (m === 'open') { g.ellipse(cx, my, S * 0.09, S * 0.07, 0, 0, 7); g.fill(); g.fillStyle = '#c0394a'; g.beginPath(); g.ellipse(cx, my + S * 0.035, S * 0.05, S * 0.025, 0, 0, 7); g.fill(); }
  else if (m === 'grin' || m === 'teeth') { g.moveTo(cx - S * 0.13, my - S * 0.03); g.quadraticCurveTo(cx, my + S * 0.16, cx + S * 0.13, my - S * 0.03); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(cx - S * 0.11, my - S * 0.02); g.lineTo(cx + S * 0.11, my - S * 0.02); g.lineTo(cx + S * 0.09, my + S * 0.025); g.lineTo(cx - S * 0.09, my + S * 0.025); g.closePath(); g.fill();
    if (m === 'grin') { g.fillStyle = '#c0394a'; g.beginPath(); g.ellipse(cx, my + S * 0.07, S * 0.05, S * 0.022, 0, 0, 7); g.fill(); } }
}

// ---------------- character ----------------
// o = { head, torso, arms, legs (colors), hat: fn(headGroup), faceDefault }
export class Rbx {
  constructor(name, o = {}) {
    this.name = name; this.o = o; this.root = new THREE.Group(); this.root.name = name;
    const C = { head: o.head || '#f2f2f2', torso: o.torso || '#d4141a', armL: o.armL || o.arms || '#f2f2f2', armR: o.armR || o.arms || '#f2f2f2', legL: o.legL || o.legs || '#151518', legR: o.legR || o.legs || '#151518' };
    this.hip = new THREE.Group(); this.hip.position.y = 2; this.root.add(this.hip);          // pelvis (legs hang from here)
    this.torso = new THREE.Group(); this.hip.add(this.torso);                                 // torso pivots at the hips
    this.torsoMesh = mesh(rbox(2, 2, 1, 0.08), plastic(C.torso), this.torso, 0, 1, 0);
    this.neck = new THREE.Group(); this.neck.position.y = 2; this.torso.add(this.neck);
    this.head = new THREE.Group(); this.neck.add(this.head);
    this.headMesh = mesh(headGeo(), plastic(C.head), this.head, 0, 0.66, 0);
    // face decal on a thin cylinder shell in front of the head
    this.faceCanvas = document.createElement('canvas'); this.faceCanvas.width = this.faceCanvas.height = 512; this.faceG = this.faceCanvas.getContext('2d');
    this.faceTex = new THREE.CanvasTexture(this.faceCanvas); this.faceTex.colorSpace = THREE.SRGBColorSpace; this.faceTex.anisotropy = 8;
    const fg = new THREE.CylinderGeometry(0.624, 0.624, 1.0, 40, 1, true, -Math.PI / 2.4 + Math.PI / 2 - Math.PI / 2, Math.PI / 1.2);
    this.faceMesh = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ map: this.faceTex, transparent: true, roughness: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    this.faceMesh.position.y = 0.66; this.faceMesh.rotation.y = 0; this.head.add(this.faceMesh); this.faceMesh.renderOrder = 2;
    // limbs: pivot at the top
    const limb = (col, x, y, parent) => { const piv = new THREE.Group(); piv.position.set(x, y, 0); parent.add(piv); const m = mesh(rbox(1, 2, 1, 0.08), plastic(col), piv, 0, -1, 0); const hand = new THREE.Group(); hand.position.y = -1.9; piv.add(hand); return { piv, mesh: m, hand }; };
    this.armR = limb(C.armR, -1.5, 1.9, this.torso); this.armL = limb(C.armL, 1.5, 1.9, this.torso);   // character's right = screen left when facing the camera
    this.legR = limb(C.legR, -0.5, 0, this.hip); this.legL = limb(C.legL, 0.5, 0, this.hip);
    this.armR.piv.position.y = 1.9; this.armL.piv.position.y = 1.9;
    if (o.hat) o.hat(this.head, this);
    this.face = Object.assign({ eyes: 'normal', mouth: 'smile', brow: null }, o.faceDefault || {}); this._fk = ''; this.applyFace();
    this.reset();
  }
  reset() { for (const o of [this.hip, this.torso, this.neck, this.head, this.armR.piv, this.armL.piv, this.legR.piv, this.legL.piv]) o.rotation.set(0, 0, 0);
    this.hip.position.set(0, 2, 0); this.root.scale.setScalar(1); this.face = Object.assign({ eyes: 'normal', mouth: 'smile', brow: null }, this.o.faceDefault || {}); }
  setFace(f) { Object.assign(this.face, f); }
  applyFace() { const f = this.face; const key = JSON.stringify(f); if (key === this._fk) return; this._fk = key; drawFace(this.faceG, f); this.faceTex.needsUpdate = true; }
}

// ---------------- accessories ----------------
// blue top hat with red band (protagonist): lathe crown slightly flared, rolled brim
// worn LOW and snug (the head top goes inside the crown), shorter crown: less forehead, comfortable look
export function topHat(color = '#1f5fb8', band = '#d21a1a') { return (head) => { const g = new THREE.Group(); g.position.set(0, 1.0, 0); head.add(g);
  const crown = [new THREE.Vector2(0.655, 0.0), new THREE.Vector2(0.665, 0.4), new THREE.Vector2(0.7, 0.78), new THREE.Vector2(0.68, 0.84), new THREE.Vector2(0, 0.86)];
  mesh(new THREE.LatheGeometry(crown, 48), plastic(color, { rough: 0.6 }), g, 0, 0.1, 0);
  mesh(new THREE.CylinderGeometry(0.672, 0.668, 0.15, 48), plastic(band, { rough: 0.55 }), g, 0, 0.25, 0);
  const brim = [new THREE.Vector2(0.62, 0.06), new THREE.Vector2(1.02, 0.04), new THREE.Vector2(1.1, 0.1), new THREE.Vector2(1.08, 0.16), new THREE.Vector2(1.02, 0.14), new THREE.Vector2(0.62, 0.14)];
  mesh(new THREE.LatheGeometry(brim, 48), plastic(color, { rough: 0.6 }), g, 0, 0.02, 0);
  g.rotation.z = -0.03; return g; }; }

export function protagonist() { return new Rbx('heroi', { head: '#f2f2f2', torso: '#d4141a', arms: '#f2f2f2', legs: '#141416', hat: topHat() }); }

// ======================= cast builder: many Roblox characters in the same quality =======================
// person({ name, skin, shirt, pants, shoes, hair: { style, color }, top: 'tshirt'|'hoodie'|'suit'|'dress'|'uniform'|'polo', accent, tie, glasses, cap, face })
const HEAD_TOP = 1.27, HR = 0.62;
function hairCap(g, col, o = {}) { const m = plastic(col, { rough: 0.75 }); // a rounded shell hugging the top/back of the head
  const cap = new THREE.Mesh(new THREE.SphereGeometry(HR + 0.06, 40, 20, 0, Math.PI * 2, 0, Math.PI * (o.depth || 0.42)), m); cap.scale.set(1, o.flat || 0.62, 1); cap.position.y = HEAD_TOP - 0.38; cap.castShadow = true; g.add(cap);
  const back = new THREE.Mesh(rbox(1.3, o.backH || 0.7, 0.3, 0.12, 3), m); back.position.set(0, HEAD_TOP - 0.25 - (o.backH || 0.7) / 2 + 0.2, -0.5); back.castShadow = true; g.add(back); return m; }
export const HAIR = {
  short: (g, c) => { const m = hairCap(g, c); const f = new THREE.Mesh(rbox(1.22, 0.24, 0.3, 0.1, 3), m); f.position.set(0.05, HEAD_TOP - 0.12, 0.47); f.rotation.z = -0.08; f.castShadow = true; g.add(f); },
  spiky: (g, c) => { const m = hairCap(g, c); for (let i = 0; i < 7; i++) { const a = -1.2 + i * 0.4; const s = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 6), m); s.position.set(Math.sin(a) * 0.45, HEAD_TOP + 0.08, Math.cos(a) * 0.3 - 0.05); s.rotation.set(-0.5 + Math.cos(a) * 0.2, 0, -Math.sin(a) * 0.6); s.castShadow = true; g.add(s); } },
  swoop: (g, c) => { const m = hairCap(g, c); const q = new THREE.Mesh(rbox(1.3, 0.5, 0.9, 0.22, 4), m); q.position.set(0.15, HEAD_TOP + 0.05, 0.12); q.rotation.set(0.25, 0, -0.25); q.castShadow = true; g.add(q); },
  long: (g, c) => { const m = hairCap(g, c, { backH: 2.0 }); for (const s of [-1, 1]) { const l = new THREE.Mesh(rbox(0.28, 1.5, 0.5, 0.12, 3), m); l.position.set(s * 0.66, HEAD_TOP - 0.85, 0.1); l.castShadow = true; g.add(l); }
    const f = new THREE.Mesh(rbox(1.24, 0.26, 0.3, 0.1, 3), m); f.position.set(0, HEAD_TOP - 0.14, 0.47); g.add(f); },
  ponytail: (g, c) => { const m = hairCap(g, c); const f = new THREE.Mesh(rbox(1.22, 0.22, 0.3, 0.1, 3), m); f.position.set(0, HEAD_TOP - 0.12, 0.47); g.add(f);
    const t = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.9, 6, 12), m); t.position.set(0, HEAD_TOP - 0.55, -0.85); t.rotation.x = 0.35; t.castShadow = true; g.add(t); },
  buns: (g, c) => { const m = hairCap(g, c); for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), m); b.position.set(s * 0.5, HEAD_TOP + 0.05, -0.1); b.castShadow = true; g.add(b); } },
  curly: (g, c) => { const m = plastic(c, { rough: 0.85 }); const r = rng2(5); for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, e = r() * 1.1; const b = new THREE.Mesh(new THREE.SphereGeometry(0.17 + r() * 0.06, 12, 10), m);
    b.position.set(Math.cos(a) * Math.cos(e) * 0.66, HEAD_TOP - 0.35 + Math.sin(e) * 0.5, Math.sin(a) * Math.cos(e) * 0.66 * (Math.sin(a) > 0.3 ? 0.6 : 1)); if (b.position.z > 0.4 && b.position.y < HEAD_TOP - 0.15) continue; b.castShadow = true; g.add(b); } },
  bald: () => {},
};
function rng2(seed) { let s = seed; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const deco = (p, w, h, d, col, x, y, z, r = 0.03) => mesh(rbox(w, h, d, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001), 2), plastic(col), p, x, y, z);
export function person(o = {}) {
  const c = new Rbx(o.name || 'npc', { head: o.skin || '#f3c99a', torso: o.shirt || '#3a7ae8', arms: o.sleeves || (o.top === 'tshirt' || o.top === 'dress' || o.top === 'polo' ? o.skin || '#f3c99a' : o.shirt || '#3a7ae8'), legs: o.pants || '#2a3a6a', faceDefault: o.face,
    hat: (head) => { const g = new THREE.Group(); head.add(g); (HAIR[o.hair?.style || 'short'])(g, o.hair?.color || '#3a2414');
      if (o.glasses) { const fm = plastic('#151515'); for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 8, 20), fm); r.position.set(s * 0.17, 0.72, 0.635); g.add(r); } const br = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.025, 0.025), fm); br.position.set(0, 0.74, 0.64); g.add(br); }
      if (o.cap) { const cm = plastic(o.cap); const cp = new THREE.Mesh(new THREE.SphereGeometry(0.68, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45), cm); cp.scale.y = 0.7; cp.position.y = HEAD_TOP - 0.3; g.add(cp); const v = new THREE.Mesh(rbox(1.0, 0.07, 0.6, 0.03, 2), cm); v.position.set(0, HEAD_TOP - 0.22, 0.72); g.add(v); } } });
  // half sleeves: the upper part of the arm in the shirt colour when the arms are bare
  if (o.top === 'tshirt' || o.top === 'polo') for (const A of [c.armR, c.armL]) deco(A.piv, 1.04, 0.7, 1.04, o.shirt || '#3a7ae8', 0, -0.33, 0, 0.08);
  // shoes on the leg ends
  for (const Lg of [c.legR, c.legL]) deco(Lg.piv, 1.04, 0.32, 1.1, o.shoes || '#f2f2f2', 0, -1.84, 0.04, 0.08);
  const T = c.torso;
  if (o.top === 'hoodie') { deco(T, 1.2, 0.5, 0.06, shadeHex(o.shirt, 0.85), 0, 0.45, 0.52, 0.08); for (const s of [-1, 1]) deco(T, 0.06, 0.5, 0.05, '#f2f2f2', s * 0.2, 1.55, 0.53, 0.02); deco(T, 1.9, 0.25, 1.06, shadeHex(o.shirt, 0.9), 0, 1.9, 0, 0.1); }
  if (o.top === 'suit') { deco(T, 0.5, 1.9, 0.05, o.accent || '#f4f4f4', 0, 1.0, 0.51, 0.02); deco(T, 0.16, 1.2, 0.06, o.tie || '#c81e2a', 0, 1.25, 0.53, 0.03); for (const y of [0.5, 0.8]) deco(T, 0.08, 0.08, 0.04, '#101010', 0.4, y, 0.52, 0.03); }
  if (o.top === 'polo') { deco(T, 0.7, 0.2, 0.06, '#f2f2f2', 0, 1.88, 0.5, 0.04); for (const y of [1.6, 1.4]) deco(T, 0.07, 0.07, 0.04, '#f2f2f2', 0, y, 0.52, 0.03); }
  if (o.top === 'uniform') { deco(T, 2.02, 0.22, 1.02, '#1a1a1a', 0, 0.2, 0, 0.04); deco(T, 0.28, 0.3, 0.05, '#e8c040', 0.5, 1.5, 0.52, 0.04); }
  if (o.top === 'dress') { const sk = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.35, 1.2, 24), plastic(o.shirt)); sk.position.y = -0.4; sk.castShadow = true; c.hip.add(sk); }
  if (o.logo) deco(T, 0.6, 0.6, 0.05, o.logo, 0, 1.15, 0.52, 0.1);
  return c; }
function shadeHex(hex, k) { const c = new THREE.Color(hex || '#888'); c.multiplyScalar(k); return '#' + c.getHexString(); }
export const CAST = {
  menina: () => person({ name: 'menina', skin: '#f6d2b0', shirt: '#e85a9a', top: 'tshirt', pants: '#3a4ab0', shoes: '#ffffff', hair: { style: 'long', color: '#3a1e12' }, face: { eyes: 'normal', mouth: 'smile', blush: 0.6 } }),
  amigo: () => person({ name: 'amigo', skin: '#8a5a3a', shirt: '#2ab07a', top: 'polo', pants: '#3a3a40', shoes: '#e83a2a', hair: { style: 'curly', color: '#1a120c' } }),
  valentao: () => person({ name: 'valentao', skin: '#f0c08a', shirt: '#3a6ae8', top: 'hoodie', pants: '#1a1a22', shoes: '#101010', hair: { style: 'spiky', color: '#e8a020' } }),
  chefe: () => person({ name: 'chefe', skin: '#f3c99a', shirt: '#1e2230', top: 'suit', pants: '#1e2230', shoes: '#101010', tie: '#c81e2a', hair: { style: 'swoop', color: '#5a5a5a' }, glasses: true }),
  policial: () => person({ name: 'policial', skin: '#c88a5a', shirt: '#1f3a8a', top: 'uniform', pants: '#152a60', shoes: '#101010', hair: { style: 'short', color: '#20140c' }, cap: '#152a60' }),
  vovo: () => person({ name: 'vovo', skin: '#f3d0b0', shirt: '#8a6ab0', top: 'dress', pants: '#8a6ab0', shoes: '#5a3a2a', hair: { style: 'buns', color: '#e8e8e8' }, glasses: true }),
};
