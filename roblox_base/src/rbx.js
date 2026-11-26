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
