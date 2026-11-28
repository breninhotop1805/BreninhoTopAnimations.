// ======================= Roblox cast v2 =======================
// Same R6 rig as rbx.js, but dressed like the references: C-shaped hands, painted clothing textures on every face
// (stripes, plaid, camo, open jacket over a tee, suit with lapels, hoodie...), 3D sneakers, and hair built from many
// curved, tapered 3D LOCKS with a strand texture (long straight / wavy / messy spiky / swoop / bun / space buns...).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Rbx, plastic } from './rbx.js';

const rnd = seed => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const col = (hex, k = 1) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
const mesh = (geo, mat, p, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m; };
const rb = (w, h, d, r = 0.08) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
function cv(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const mat = tex => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });

// ---------- fabric painting ----------
function fabric(g, w, h, base, seed = 1) { g.fillStyle = base; g.fillRect(0, 0, w, h); const r = rnd(seed);
  for (let i = 0; i < w * h / 18; i++) { const v = (r() - 0.5) * 18; g.fillStyle = v > 0 ? `rgba(255,255,255,${v / 255})` : `rgba(0,0,0,${-v / 255})`; g.fillRect(r() * w, r() * h, 2, 2); }
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0.06)'); gr.addColorStop(1, 'rgba(0,0,0,0.12)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
function fold(g, x0, y0, x1, y1, a = 0.12, wd = 3) { g.strokeStyle = `rgba(0,0,0,${a})`; g.lineWidth = wd; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 6, (y0 + y1) / 2, x1, y1); g.stroke(); }
function seam(g, x0, y0, x1, y1) { g.setLineDash([6, 5]); g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]); }
function pattern(g, w, h, s) { // full-face patterns
  if (s.type === 'stripes') { const n = s.n || 7; for (let i = 0; i < n; i++) if (i % 2) { g.fillStyle = s.color2 || '#ffffff'; g.fillRect(0, i * h / n, w, h / n); } }
  if (s.type === 'plaid') { const c2 = s.color2 || col(s.color, 0.6); g.globalAlpha = 0.45; for (let x = 0; x < w; x += 42) { g.fillStyle = c2; g.fillRect(x, 0, 16, h); } for (let y = 0; y < h; y += 42) { g.fillStyle = c2; g.fillRect(0, y, w, 16); }
    g.globalAlpha = 0.25; g.fillStyle = '#fff'; for (let x = 0; x < w; x += 42) g.fillRect(x + 26, 0, 3, h); for (let y = 0; y < h; y += 42) g.fillRect(0, y + 26, w, 3); g.globalAlpha = 1; }
  if (s.type === 'camo') { const r = rnd(9); for (let i = 0; i < 26; i++) { g.fillStyle = [s.color2 || '#3a5a2a', '#6a7a3a', '#2a3a1a'][i % 3]; g.beginPath(); const x = r() * w, y = r() * h; g.ellipse(x, y, 14 + r() * 26, 9 + r() * 16, r() * 3, 0, 7); g.fill(); } } }
// torso faces: [right(+x), left(-x), top, bottom, front, back]
function torsoMats(s, skin) { const base = s.color || '#3a7ae8'; const T = (W, H, draw) => mat(cv(W, H, (g, w, h) => { fabric(g, w, h, base, W + H); pattern(g, w, h, s); draw && draw(g, w, h); }));
  const front = (g, w, h) => { const t = s.type;
    if (t === 'jacket' || t === 'vest') { g.fillStyle = s.inner || '#3aa0e8'; g.fillRect(w * 0.3, 0, w * 0.4, h); fabric(g, 0, 0, base); g.fillStyle = s.inner || '#3aa0e8'; g.fillRect(w * 0.31, 0, w * 0.38, h * 0.92);
      if (s.print) { g.fillStyle = 'rgba(0,0,0,0.75)'; g.font = `bold ${w * 0.12}px sans-serif`; g.textAlign = 'center'; g.fillText(s.print, w / 2, h * 0.5); }
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 4; for (const x of [w * 0.31, w * 0.69]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } g.fillStyle = col(base, 0.8); g.fillRect(0, h * 0.9, w, h * 0.1); if (t === 'jacket') { g.fillStyle = col(base, 0.85); g.fillRect(w * 0.06, h * 0.55, w * 0.18, h * 0.05); g.fillRect(w * 0.76, h * 0.55, w * 0.18, h * 0.05); } }
    if (t === 'suit') { g.fillStyle = s.inner || '#f4f4f4'; g.beginPath(); g.moveTo(w * 0.3, 0); g.lineTo(w * 0.7, 0); g.lineTo(w * 0.56, h * 0.62); g.lineTo(w * 0.44, h * 0.62); g.closePath(); g.fill();
      g.fillStyle = s.tie || '#c81e2a'; g.beginPath(); g.moveTo(w * 0.46, h * 0.05); g.lineTo(w * 0.54, h * 0.05); g.lineTo(w * 0.56, h * 0.5); g.lineTo(w * 0.5, h * 0.58); g.lineTo(w * 0.44, h * 0.5); g.closePath(); g.fill();
      g.fillStyle = col(base, 0.75); for (const sx of [1, -1]) { g.beginPath(); g.moveTo(w / 2 - sx * w * 0.2, 0); g.lineTo(w / 2 - sx * w * 0.06, h * 0.62); g.lineTo(w / 2 - sx * w * 0.3, h * 0.35); g.closePath(); g.fill(); }
      g.fillStyle = '#111'; for (const y of [0.7, 0.82]) { g.beginPath(); g.arc(w * 0.56, h * y, 4, 0, 7); g.fill(); } if (s.badge) { g.fillStyle = '#e8c040'; g.beginPath(); g.arc(w * 0.28, h * 0.35, 9, 0, 7); g.fill(); } }
    if (t === 'hoodie') { g.fillStyle = col(base, 0.82); g.beginPath(); g.roundRect(w * 0.2, h * 0.55, w * 0.6, h * 0.3, 14); g.fill(); g.strokeStyle = '#f2f2f2'; g.lineWidth = 5; for (const x of [0.42, 0.58]) { g.beginPath(); g.moveTo(w * x, 0); g.lineTo(w * x, h * 0.32); g.stroke(); }
      g.fillStyle = col(base, 0.85); g.fillRect(0, h * 0.9, w, h * 0.1); if (s.fade) { const gr = g.createLinearGradient(0, h * 0.4, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.95)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } }
    if (t === 'tee' || t === 'stripes' || t === 'plaid' || t === 'camo' || t === 'polo' || t === 'blouse') { g.fillStyle = skin; g.beginPath(); g.ellipse(w / 2, 0, w * 0.17, h * 0.07, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3; g.stroke();
      if (t === 'plaid' || t === 'polo') { g.fillStyle = col(base, 0.75); g.beginPath(); g.moveTo(w * 0.32, 0); g.lineTo(w * 0.5, h * 0.12); g.lineTo(w * 0.68, 0); g.fill(); g.fillStyle = '#f0f0f0'; for (const y of [0.2, 0.38, 0.56, 0.74]) { if (t === 'polo' && y > 0.4) continue; g.beginPath(); g.arc(w / 2, h * y, 4, 0, 7); g.fill(); } seam(g, w / 2, h * 0.12, w / 2, h); }
      if (s.print) { g.font = `bold ${w * 0.22}px sans-serif`; g.textAlign = 'center'; g.fillStyle = s.printColor || 'rgba(255,255,255,0.9)'; g.fillText(s.print, w / 2, h * 0.58); }
      if (s.logo) { g.fillStyle = s.logo; g.beginPath(); g.arc(w / 2, h * 0.45, w * 0.12, 0, 7); g.fill(); } }
    if (t === 'blouse') { g.fillStyle = 'rgba(255,255,255,0.5)'; for (let x = w * 0.3; x < w * 0.72; x += 18) { g.beginPath(); g.arc(x, h * 0.12, 6, 0, 7); g.fill(); } }
    if (t === 'uniform') { g.fillStyle = col(base, 0.8); g.fillRect(w * 0.47, 0, w * 0.06, h); g.fillStyle = '#e8c040'; g.beginPath(); g.moveTo(w * 0.25, h * 0.3); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? 6 : 14; g.lineTo(w * 0.25 + Math.cos(a) * rr, h * 0.33 + Math.sin(a) * rr); } g.fill();
      g.fillStyle = '#151515'; g.fillRect(0, h * 0.86, w, h * 0.09); g.fillStyle = '#c8c8c8'; g.fillRect(w * 0.45, h * 0.86, w * 0.1, h * 0.09); }
    fold(g, w * 0.25, h * 0.6, w * 0.32, h * 0.95, 0.08); fold(g, w * 0.75, h * 0.62, w * 0.7, h * 0.95, 0.08); };
  const back = (g, w, h) => { if (s.type === 'hoodie') { g.fillStyle = col(base, 0.85); g.beginPath(); g.ellipse(w / 2, 0, w * 0.32, h * 0.2, 0, 0, 7); g.fill(); g.fillRect(0, h * 0.9, w, h * 0.1); } if (s.type === 'uniform') { g.fillStyle = '#151515'; g.fillRect(0, h * 0.86, w, h * 0.09); } };
  const side = (g, w, h) => { seam(g, w / 2, 0, w / 2, h); if (s.type === 'uniform') { g.fillStyle = '#151515'; g.fillRect(0, h * 0.86, w, h * 0.09); } if (s.type === 'hoodie' || s.type === 'jacket') { g.fillStyle = col(base, 0.85); g.fillRect(0, h * 0.9, w, h * 0.1); } };
  const sd = T(128, 256, side); return [sd, sd, T(256, 128), T(256, 128), T(256, 256, front), T(256, 256, back)]; }
// arm sleeve faces: sleeve length 0..1 (0 = bare arm); cuff at the end
function armMats(s, skin) { const base = s.color || '#3a7ae8'; const len = s.sleeve ?? (s.type === 'tee' || s.type === 'stripes' || s.type === 'polo' || s.type === 'blouse' || s.type === 'dress' ? 0.35 : s.type === 'tank' ? 0 : 1);
  const armColor = s.type === 'jacket' || s.type === 'suit' || s.type === 'hoodie' ? base : base;
  const face = (W, H) => mat(cv(W, H, (g, w, h) => { fabric(g, w, h, skin, 3); const sl = h * len; if (sl > 0) { g.save(); g.beginPath(); g.rect(0, 0, w, sl); g.clip(); fabric(g, w, sl, armColor, 7); pattern(g, w, h, s); g.restore();
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, sl - 6, w, 6); if (len >= 1) { g.fillStyle = col(armColor, 0.82); g.fillRect(0, h - 18, w, 18); } fold(g, w * 0.3, sl * 0.4, w * 0.6, sl * 0.55, 0.08); } }));
  const sd = face(128, 192); const top = mat(cv(64, 64, (g, w, h) => fabric(g, w, h, len > 0 ? armColor : skin)));
  return [sd, sd, top, top, sd, sd]; }
// pants faces
function legMats(p, side) { const base = p.color || '#2a3a6a'; const face = (front) => mat(cv(128, 192, (g, w, h) => { fabric(g, w, h, base, 11 + side); const t = p.type || 'jeans';
  if (t === 'shorts') { g.fillStyle = p.skin; g.fillRect(0, h * 0.5, w, h * 0.5); fabric(g, 0, 0, base); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, h * 0.47, w, 6); }
  if (t === 'jeans') { for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`; g.fillRect(Math.random() * w, Math.random() * h, 1, 6); } seam(g, side > 0 ? 8 : w - 8, 0, side > 0 ? 8 : w - 8, h); if (front) { fold(g, w * 0.3, h * 0.55, w * 0.7, h * 0.6, 0.1); fold(g, w * 0.3, h * 0.75, w * 0.7, h * 0.8, 0.1); } }
  if (t === 'skirt') { g.fillStyle = p.skin; g.fillRect(0, h * 0.42, w, h); }
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 0, w, 10); }));
  const f = face(true), sd = face(false); const top = mat(cv(64, 64, (g, w, h) => fabric(g, w, h, base))); return [sd, sd, top, top, f, sd]; }

// C-shaped Roblox hand (palm block, curled fingers in front, open slot between them, thumb on the inner side)
function cHand(p, skin, side) { const m = plastic(skin); const g = new THREE.Group(); p.add(g);
  mesh(rb(0.9, 0.22, 0.86, 0.08), m, g, 0, 0, 0); mesh(rb(0.9, 0.5, 0.34, 0.1), m, g, 0, -0.32, -0.25); mesh(rb(0.9, 0.42, 0.26, 0.1), m, g, 0, -0.28, 0.3);
  mesh(rb(0.24, 0.32, 0.3, 0.09), m, g, -side * 0.38, -0.2, 0.22); return g; }
// 3D sneaker
function shoe(p, c) { const g = new THREE.Group(); p.add(g); mesh(rb(1.04, 0.36, 1.18, 0.12), plastic(c.color || '#f2f2f2'), g, 0, 0.06, 0.06); mesh(rb(1.08, 0.14, 1.24, 0.06), plastic(c.sole || '#ffffff'), g, 0, -0.15, 0.08);
  if (c.stripe) mesh(rb(0.06, 0.2, 0.7, 0.02), plastic(c.stripe), g, 0.53, 0.05, 0.05); return g; }

// ---------- hair: curved tapered locks ----------
const STRAND = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#bdbdbd'; g.fillRect(0, 0, 64, 256); const r = rnd(4);
  for (let i = 0; i < 140; i++) { const x = r() * 64, v = 150 + r() * 105; g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = 0.6 + r() * 1.4; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 6, 80, x + (r() - 0.5) * 6, 170, x + (r() - 0.5) * 4, 256); g.stroke(); }
  const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(0,0,0,0.25)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0.25)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
const HM = new Map(); const hairMat = c => { if (!HM.has(c)) HM.set(c, new THREE.MeshStandardMaterial({ color: c, map: STRAND, roughness: 0.55, metalness: 0.0, side: THREE.DoubleSide })); return HM.get(c); };
// ribbon-tube along a curve: cross-section = flat ellipse (width w, thickness th) tapering toward the tip
export function lockGeo(pts, w0, w1, th = 0.14, out = null, tip = 0.15) { const curve = new THREE.CatmullRomCurve3(pts); const N = 18, R = 8; const pos = [], uv = [], idx = [];
  const up = new THREE.Vector3(0, 1, 0); for (let i = 0; i <= N; i++) { const s = i / N; const p = curve.getPoint(s), T = curve.getTangent(s).normalize();
    let nrm = out ? p.clone().sub(out).normalize() : new THREE.Vector3(p.x, 0, p.z).normalize(); if (nrm.lengthSq() < 0.01) nrm = new THREE.Vector3(0, 0, 1); const side = new THREE.Vector3().crossVectors(T, nrm).normalize(); nrm = new THREE.Vector3().crossVectors(side, T).normalize();
    const taper = s < 1 - tip ? 1 : Math.max(0.02, (1 - s) / tip); const w = (w0 + (w1 - w0) * s) * taper, t = th * (0.5 + 0.5 * taper);
    for (let j = 0; j < R; j++) { const a = j / R * Math.PI * 2; const q = p.clone().addScaledVector(side, Math.cos(a) * w / 2).addScaledVector(nrm, Math.sin(a) * t / 2); pos.push(q.x, q.y, q.z); uv.push(j / R, s * 2); } }
  for (let i = 0; i < N; i++) for (let j = 0; j < R; j++) { const a = i * R + j, b = i * R + (j + 1) % R, c = (i + 1) * R + j, d = (i + 1) * R + (j + 1) % R; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; }
const HT = 1.27, HC = 0.66; // head top / centre (head local)
// point on the hair "shell" around the head: azimuth a (0 = front, +x left side), elevation e (0 = equator at head centre, 1 = top), r = offset
function shellPt(a, e, r = 0.7) { const y = HC + Math.sin(e * Math.PI / 2) * (HT - HC + 0.08); const rr = r * Math.cos(e * Math.PI / 2 * 0.92); return new THREE.Vector3(Math.sin(a) * rr, y, Math.cos(a) * rr); }
function scalp(g, c, front = 0.55) { // shell over the top and the back; front edge (hairline) at elevation `front`
  // hugs the head top; HAIRLINE: in front it stops above the eyebrows (y >= 0.98 at the centre), at the sides it reaches the ears, at the back the nape
  // shell = the head's own rounded-cylinder profile, offset outward (so it really covers the head top), cut at the hairline
  const m = hairMat(c); const R = 0.7, Hh = 1.4, E = 0.28; const prof = [new THREE.Vector2(0, -Hh / 2)];
  for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + i / 8 * Math.PI / 2; prof.push(new THREE.Vector2(R - E + Math.cos(a) * E, -Hh / 2 + E + Math.sin(a) * E)); }
  for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; prof.push(new THREE.Vector2(R - E + Math.cos(a) * E, Hh / 2 - E + Math.sin(a) * E)); } prof.push(new THREE.Vector2(0, Hh / 2));
  const geo = new THREE.LatheGeometry(prof, 64); const p = geo.attributes.position; const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); v.y = v.y + 0.66 + 0.02; const az = Math.atan2(v.x, v.z); const fr = Math.max(0, Math.cos(az)); const line = 0.98 * fr * fr * fr + (HC - 0.25) * (1 - fr * fr * fr) + (front - 0.55);
    if (v.y < line) { v.y = line; const rr = Math.hypot(v.x, v.z), k = Math.min(1, 0.645 / Math.max(rr, 1e-3)); if (fr > 0.2) { v.x *= k; v.z *= k; } } p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals(); mesh(geo, m, g, 0, 0, -0.02); return m; }
function addLock(g, colr, pts, w0, w1, th, out) { mesh(lockGeo(pts, w0, w1, th, out), hairMat(colr), g); }
// locks lying ON the shell, from a parting/crown point down to the hairline (front) or the nape/ears: breaks the "helmet" look
// part: 'center' (centre parting, locks fall to both sides), 'crown' (radiate from the crown), 'side' (swept to one side)
const shellR = y => { const top = 1.38, e = 0.28; if (y < top - e) return 0.72; const k = (y - (top - e)) / e; return 0.72 - e + Math.sqrt(Math.max(0, 1 - k * k)) * e; };
const onShell = (a, y, lift = 0.0) => { const r = shellR(y) + lift; return new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r); };
function coverLocks(g, c, o = {}) { const r = rnd(o.seed || 7); const n = o.n || 30; const out = new THREE.Vector3(0, HC + 0.1, 0); const hl = o.hairline ?? 0.98;
  for (let i = 0; i < n; i++) { const a = -Math.PI + (i + 0.5) / n * Math.PI * 2 + (r() - 0.5) * 0.08; const fr = Math.max(0, Math.cos(a)); const endY = hl * fr * fr * fr + (o.nape ?? HC - 0.2) * (1 - fr * fr * fr) - (fr > 0.6 ? 0.06 + r() * 0.06 : 0.08 + r() * 0.12);
    let a0 = a; if (o.part === 'center') a0 = (a >= 0 ? 1 : -1) * 0.05; if (o.part === 'side') a0 = a - 0.7;
    const sweep = o.part === 'side' ? 0.45 : 0; const pts = [onShell(o.part === 'crown' ? a : a0, 1.37, 0.02), onShell(a - sweep * 0.5, 1.2, 0.03), onShell(a - sweep * 0.2, (1.2 + endY) / 2 + 0.05, 0.04), onShell(a, endY, 0.06 + (fr > 0.6 ? 0.04 : 0))];
    addLock(g, r() < (o.hi ?? 0.28) ? col(c, 1.18) : r() < 0.3 ? col(c, 0.88) : c, pts, 0.42 + r() * 0.08, 0.3, 0.11, out); } }
export const HAIR2 = {
  // long straight, centre part, falls to the chest (refs 1 & 3); c2 = highlight streaks framing the face
  long: (g, c, c2) => { scalp(g, c); coverLocks(g, c, { part: 'center', n: 34, seed: 3 }); const r = rnd(3); const out = new THREE.Vector3(0, HC + 0.2, 0);
    for (let i = 0; i < 34; i++) { const a = Math.PI * (0.3 + 1.4 * i / 33) + (r() - 0.5) * 0.05; const front = Math.cos(a) > 0.35; const len = 1.9 + r() * 0.3;
      const p0 = shellPt(a, 0.92, 0.6), p1 = shellPt(a, 0.45, 0.76), p2 = new THREE.Vector3(Math.sin(a) * 0.82, HC - 0.55, Math.cos(a) * 0.78), p3 = new THREE.Vector3(Math.sin(a) * 0.85, HC - len, Math.cos(a) * 0.8 - 0.05);
      const colr = c2 && (i === 2 || i === 3 || i === 30 || i === 31) ? c2 : (r() < 0.25 ? col(c, 1.12) : c); addLock(g, colr, [p0, p1, p2, p3], 0.44, 0.34, 0.13, out); }
    for (const s of [-1, 1]) { const a = s * 0.62; addLock(g, c2 || c, [shellPt(a * 0.2, 1, 0.55), shellPt(a * 0.8, 0.75, 0.74), shellPt(a, 0.3, 0.77), new THREE.Vector3(Math.sin(a) * 0.8, HC - 1.3, Math.cos(a) * 0.72)], 0.34, 0.22, 0.12, out); } },
  wavy: (g, c, c2) => { scalp(g, c); coverLocks(g, c, { part: 'center', n: 32, seed: 8 }); const r = rnd(8); const out = new THREE.Vector3(0, HC + 0.2, 0);
    for (let i = 0; i < 24; i++) { const a = Math.PI * (0.3 + 1.4 * i / 23); const pts = [shellPt(a, 0.92, 0.6), shellPt(a, 0.45, 0.76)]; for (let k = 1; k <= 4; k++) { const rr = 0.82 + 0.07 * Math.sin(k * 2 + i); pts.push(new THREE.Vector3(Math.sin(a + 0.06 * Math.sin(k * 1.7 + i)) * rr, HC - 0.4 * k - 0.1, Math.cos(a) * rr)); }
      addLock(g, r() < 0.3 ? col(c, 1.1) : c, pts, 0.36, 0.26, 0.12, out); }
    for (const s of [-1, 1]) addLock(g, c, [shellPt(s * 0.1, 1, 0.55), shellPt(s * 0.5, 0.75, 0.74), new THREE.Vector3(s * 0.58, HC + 0.15, 0.5), new THREE.Vector3(s * 0.72, HC - 0.8, 0.42)], 0.32, 0.2, 0.11, out); },
  // messy spiky (refs 5/6): tapered spikes all over, bangs above the eyes
  spiky: (g, c) => { scalp(g, c, 0.6); coverLocks(g, c, { part: 'crown', n: 30, seed: 12, hairline: 1.06 }); const r = rnd(12); const out = new THREE.Vector3(0, HC + 0.1, 0);
    for (let i = 0; i < 34; i++) { const a = (i / 34) * Math.PI * 2 + (r() - 0.5) * 0.2, e = 0.55 + r() * 0.45; if (Math.cos(a) > 0.55) continue; const p0 = shellPt(a, e, 0.64);
      const dir = new THREE.Vector3(Math.sin(a) * 0.8, 0.25 + e * 0.5, Math.cos(a) * 0.8 - 0.35).normalize(); const len = 0.5 + r() * 0.4; const mid = p0.clone().addScaledVector(dir, len * 0.55); const tip = p0.clone().addScaledVector(dir, len); tip.y -= 0.12 + r() * 0.1;
      addLock(g, r() < 0.3 ? col(c, 1.25) : c, [p0, mid, tip], 0.42, 0.26, 0.13, out); }
    for (let i = 0; i < 7; i++) { const a = -0.6 + i * 0.2; const p0 = shellPt(a * 0.6, 1, 0.5); addLock(g, i % 3 ? c : col(c, 1.2), [p0, shellPt(a, 0.75, 0.74), new THREE.Vector3(Math.sin(a * 1.1) * 0.74, HC + 0.42 - (i % 2) * 0.05, Math.cos(a) * 0.72)], 0.32, 0.2, 0.1, out); } },
  // side swoop fringe ("bacon"/Pal hair, ref 4/7)
  swoop: (g, c) => { scalp(g, c, 0.6); coverLocks(g, c, { part: 'side', n: 30, seed: 21 }); const r = rnd(21); const out = new THREE.Vector3(0, HC + 0.1, 0);
    for (let i = 0; i < 9; i++) { const a = -0.7 + i * 0.17; const p0 = shellPt(a - 0.25, 1, 0.5); addLock(g, r() < 0.35 ? col(c, 1.2) : c, [p0, shellPt(a, 0.8, 0.74), shellPt(a + 0.35, 0.5, 0.8), new THREE.Vector3(Math.sin(a + 0.55) * 0.78, HC + 0.08 + (i % 3) * 0.04, Math.cos(a + 0.55) * 0.74)], 0.38, 0.24, 0.13, out); }
    for (let i = 0; i < 14; i++) { const a = Math.PI * (0.45 + 1.1 * i / 13); addLock(g, c, [shellPt(a, 0.95, 0.6), shellPt(a, 0.5, 0.76), new THREE.Vector3(Math.sin(a) * 0.78, HC - 0.05, Math.cos(a) * 0.76)], 0.36, 0.26, 0.12, out); } },
  // short quiff (ref 10)
  quiff: (g, c) => { scalp(g, c, 0.62); coverLocks(g, c, { part: 'crown', n: 28, seed: 5, hairline: 1.16 }); const out = new THREE.Vector3(0, HC + 0.1, 0); const r = rnd(5);
    for (let i = 0; i < 7; i++) { const a = -0.45 + i * 0.15; const p0 = shellPt(a, 0.8, 0.66); addLock(g, c, [p0, p0.clone().add(new THREE.Vector3(0, 0.22, 0.05)), p0.clone().add(new THREE.Vector3(-0.05, 0.42 + r() * 0.12, -0.12))], 0.3, 0.16, 0.12, out); }
    for (let i = 0; i < 12; i++) { const a = Math.PI * (0.4 + 1.2 * i / 11); addLock(g, c, [shellPt(a, 0.9, 0.62), shellPt(a, 0.45, 0.74), new THREE.Vector3(Math.sin(a) * 0.74, HC - 0.1, Math.cos(a) * 0.72)], 0.36, 0.28, 0.1, out); } },
  // messy top bun with loose locks (ref 8)
  bun: (g, c) => { HAIR2.quiff(g, c); const b = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), hairMat(c)); b.position.set(0, HT + 0.32, -0.1); b.scale.set(1.1, 0.85, 1); b.castShadow = true; g.add(b);
    const out = new THREE.Vector3(0, HT + 0.3, -0.1); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; addLock(g, col(c, 1.15), [new THREE.Vector3(Math.cos(a) * 0.15, HT + 0.4, -0.1 + Math.sin(a) * 0.15), new THREE.Vector3(Math.cos(a) * 0.35, HT + 0.55, -0.1 + Math.sin(a) * 0.35), new THREE.Vector3(Math.cos(a) * 0.45, HT + 0.4, -0.1 + Math.sin(a) * 0.45)], 0.18, 0.1, 0.08, out); } },
  // long hair + two space buns (ref 9)
  spacebuns: (g, c, c2) => { HAIR2.long(g, c, c2); for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), hairMat(c)); b.position.set(s * 0.48, HT + 0.18, -0.08); b.castShadow = true; g.add(b); } },
  bald: () => {},
};

// ---------- the dressed character ----------
// o = { name, skin, shirt: {type,color,color2,inner,print,tie,sleeve}, pants: {type,color}, shoes: {color,sole,stripe}, hair: {style,color,color2}, face, extra(head, ch) }
export function dressed(o) {
  const skin = o.skin || '#f3c99a'; const c = new Rbx(o.name, { head: skin, torso: '#ffffff', arms: '#ffffff', legs: '#ffffff', faceDefault: o.face, hat: (head, ch) => { const g = new THREE.Group(); head.add(g); if (o.hair && HAIR2[o.hair.style]) HAIR2[o.hair.style](g, o.hair.color, o.hair.color2); if (o.extra) o.extra(head, ch); } });
  c.torsoMesh.material = torsoMats(o.shirt || {}, skin); const am = armMats(o.shirt || {}, skin);
  for (const [A, sd] of [[c.armR, -1], [c.armL, 1]]) { A.mesh.geometry = rb(1, 1.55, 1, 0.08); A.mesh.position.y = -0.78; A.mesh.material = am; const h = cHand(A.piv, skin, sd); h.position.y = -1.67; A.handMesh = h; }
  for (const [Lg, sd] of [[c.legR, -1], [c.legL, 1]]) { Lg.mesh.geometry = rb(1, 1.7, 1, 0.08); Lg.mesh.position.y = -0.85; Lg.mesh.material = legMats(Object.assign({ skin }, o.pants || {}), sd); const sh = shoe(Lg.piv, o.shoes || {}); sh.position.y = -1.82; }
  if (o.shirt?.type === 'dress') { const sk = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.4, 1.25, 32, 1, true), plastic(o.shirt.color)); sk.material.side = THREE.DoubleSide; sk.position.y = -0.45; sk.castShadow = true; c.hip.add(sk); }
  c.root.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return c; }

// the protagonist in the same quality: white head + arms (+ white C-hands), plain red torso, black legs, black sneakers, blue top hat
import { topHat } from './rbx.js';
export function hero() { return dressed({ name: 'heroi', skin: '#f2f2f2', shirt: { type: 'plain', color: '#d4141a', sleeve: 0 }, pants: { type: 'pants', color: '#141416' }, shoes: { color: '#141416', sole: '#e8e8e8' }, extra: (head, ch) => topHat()(head, ch) }); }
export const CAST2 = {
  bacon: () => dressed({ name: 'bacon', skin: '#e8d2c0', shirt: { type: 'jacket', color: '#1c1c22', inner: '#3a9ee0', print: '🏍' }, pants: { type: 'jeans', color: '#25333a' }, shoes: { color: '#f2ece4' }, hair: { style: 'swoop', color: '#b8501a' } }),
  ruiva: () => dressed({ name: 'ruiva', skin: '#f6f0ea', shirt: { type: 'jacket', color: '#2a5a8a', inner: '#e8e8e8' }, pants: { type: 'jeans', color: '#6a2a3a' }, shoes: { color: '#151515', sole: '#e0e0e0' }, hair: { style: 'bun', color: '#c8401a' } }),
  loira: () => dressed({ name: 'loira', skin: '#d8a070', shirt: { type: 'blouse', color: '#f6f2ee' }, pants: { type: 'shorts', color: '#f2ece6' }, shoes: { color: '#ffffff' }, hair: { style: 'spacebuns', color: '#e8c890', color2: '#f6e0b0' }, face: { eyes: 'normal', mouth: 'o', blush: 0.5 } }),
  moleton: () => dressed({ name: 'moleton', skin: '#e8b890', shirt: { type: 'hoodie', color: '#1a1a1e', fade: true }, pants: { type: 'jeans', color: '#1a1a20' }, shoes: { color: '#151515' }, hair: { style: 'quiff', color: '#3a2418' }, face: { mouth: 'grin', eyes: 'normal' } }),
  listrado: () => dressed({ name: 'listrado', skin: '#f3c99a', shirt: { type: 'stripes', color: '#2a62d8', color2: '#f4f4f4', n: 8 }, pants: { type: 'jeans', color: '#2a4ab8' }, shoes: { color: '#2a62d8', sole: '#f4f4f4' }, hair: { style: 'spiky', color: '#2a1a10' } }),
  xadrez: () => dressed({ name: 'xadrez', skin: '#e8b890', shirt: { type: 'plaid', color: '#2a9a4a', color2: '#155a28' }, pants: { type: 'jeans', color: '#b89a5a' }, shoes: { color: '#5a3a20' }, hair: { style: 'spiky', color: '#151515' } }),
  morena: () => dressed({ name: 'morena', skin: '#f3d0b0', shirt: { type: 'tee', color: '#e85a9a' }, pants: { type: 'jeans', color: '#2a3a8a' }, shoes: { color: '#ffffff', stripe: '#e85a9a' }, hair: { style: 'long', color: '#4a2c1c', color2: '#e8c8a0' }, face: { blush: 0.5 } }),
  seguranca: () => dressed({ name: 'seguranca', skin: '#c88a5a', shirt: { type: 'suit', color: '#151518', inner: '#f4f4f4', tie: '#151518', badge: true }, pants: { type: 'pants', color: '#151518' }, shoes: { color: '#101010' }, hair: { style: 'quiff', color: '#151515' } }),
};
