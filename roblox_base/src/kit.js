// ======================= SET KIT in Roblox proportions (refs) =======================
// Scale: character ≈ 5.2 tall (official R15 body + classic head). Door 4.0 × 7.6 (≈1.45× the character), ceiling 12,
// storey 12, window sill 3.4, table 2.4, chair seat 1.15, bed top 1.8, locker 7.2. Everything solid registers an OBSTACLE
// (s.userData.obst) so the automatic check catches anyone walking through walls, doors or furniture.
// World text (signs, boards, clocks) uses MONTSERRAT 900 — KOMIKAX is ONLY for the subtitles.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export const SC = { char: 5.2, doorW: 4.6, doorH: 7.8, ceil: 12, storey: 12, wallT: 0.6, sill: 3.4, table: 2.4, seat: 1.15, bed: 1.8 };
export const WORLD_FONT = 'Montserrat';
export async function loadFonts(base = '/assets/fonts/') { for (const [w, f] of [[900, 'montserrat-latin-900-normal.woff2'], [800, 'montserrat-latin-800-normal.woff2']]) { const ff = new FontFace('Montserrat', `url(${base}${f})`, { weight: String(w) }); await ff.load(); document.fonts.add(ff); } }
const MATS = new Map();
export function mat(color, o = {}) { const k = color + JSON.stringify(o, (k, v) => (v && v.isTexture ? v.uuid : v)); if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.6, metalness: o.metal ?? 0, map: o.map || null, emissive: o.em || '#000', emissiveIntensity: o.ei ?? 1, transparent: !!o.opacity, opacity: o.opacity ?? 1 })); return MATS.get(k); }
const rb = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
export function obst(s, obj, name, dyn = false) { (s.userData.obst ||= []).push({ obj, name, dyn, box: null }); }
// box: (parent, w,h,d, material|color, x,y,z, {r, ry, obst:scene, name})
export function bx(g, w, h, d, m, x, y, z, o = {}) { const me = new THREE.Mesh(o.r === 0 ? new THREE.BoxGeometry(w, h, d) : rb(w, h, d, o.r ?? 0.05), typeof m === 'string' ? mat(m) : m); me.position.set(x, y, z); if (o.ry) me.rotation.y = o.ry; me.castShadow = o.cast ?? true; me.receiveShadow = true; g.add(me); return me; }
// ---------------- canvas textures ----------------
export function canvasTex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; }
const rnd = seed => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const shade = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
export const TEX = {
  planks: (col = '#b07a4a', rep = [1, 1]) => canvasTex(512, 512, (g, w, h) => { const r = rnd(5); for (let i = 0; i < 8; i++) { g.fillStyle = shade(col, 0.88 + r() * 0.2); g.fillRect(0, i * 64, w, 64); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, i * 64, w, 3);
    const off = r() * w; g.fillRect(off, i * 64, 3, 64); for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(60,30,10,${0.05 + r() * 0.06})`; g.fillRect(r() * w, i * 64 + 8 + r() * 48, 40 + r() * 120, 2); } } }, rep),
  cobble: (col = '#c8c4bc', rep = [1, 1]) => canvasTex(512, 512, (g, w, h) => { g.fillStyle = shade(col, 0.7); g.fillRect(0, 0, w, h); const r = rnd(9); for (let y = 0; y < 8; y++) for (let x = 0; x < 6; x++) { const ox = (y % 2) * 42; g.fillStyle = shade(col, 0.9 + r() * 0.2); g.beginPath(); g.roundRect(x * 85 + ox + 4, y * 64 + 4, 77, 56, 18); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.roundRect(x * 85 + ox + 10, y * 64 + 8, 60, 14, 8); g.fill(); } }, rep),
  plaster: (col, rep = [1, 1]) => canvasTex(256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); const r = rnd(3); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.02 + r() * 0.03})`; g.fillRect(r() * w, r() * h, 2 + r() * 4, 2 + r() * 4); } }, rep),
  stripes: (a, b, rep = [1, 1]) => canvasTex(256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 32, 0, 32, h); } }, rep),
  dots: (a, b, rep = [1, 1]) => canvasTex(256, 256, (g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.beginPath(); g.arc(x * 64 + 32 + (y % 2) * 32, y * 64 + 32, 7, 0, 7); g.fill(); } }, rep),
  tiles: (a, b, rep = [1, 1]) => canvasTex(256, 256, (g, w, h) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? a : b; g.fillRect(x * 64, y * 64, 64, 64); } g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } }, rep),
  roof: (col = '#c8502a', rep = [1, 1]) => canvasTex(256, 256, (g, w, h) => { g.fillStyle = shade(col, 0.75); g.fillRect(0, 0, w, h); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = shade(col, 0.95 + ((x * 7 + y * 3) % 5) * 0.03); g.beginPath(); g.arc(x * 32 + 16 + (y % 2) * 16, y * 32 + 30, 16, Math.PI, 0); g.fill(); } }, rep),
  asphalt: (rep = [1, 1]) => canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#4a4c52'; g.fillRect(0, 0, w, h); const r = rnd(2); for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.05})`; g.fillRect(r() * w, r() * h, 2, 2); } }, rep),
};
// text on a canvas (world signs: Montserrat 900)
export function textTex(lines, o = {}) { const W = o.w || 1024, H = o.h || 512; return canvasTex(W, H, (g, w, h) => { if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, w, h); }
  if (o.border) { g.strokeStyle = o.border; g.lineWidth = h * 0.05; g.strokeRect(h * 0.04, h * 0.04, w - h * 0.08, h * 0.08 > 0 ? h - h * 0.08 : h); }
  const L = Array.isArray(lines) ? lines : [lines]; const n = L.length; g.textAlign = 'center'; g.textBaseline = 'middle';
  L.forEach((ln, i) => { const txt = typeof ln === 'string' ? ln : ln.t; const col = (typeof ln === 'object' && ln.c) || o.color || '#111'; let fs = (typeof ln === 'object' && ln.s ? ln.s : 1) * h * (o.size || 0.62) / n; g.font = `900 ${fs}px ${WORLD_FONT}`;
    while (g.measureText(txt).width > w * 0.9 && fs > 8) { fs -= 4; g.font = `900 ${fs}px ${WORLD_FONT}`; } const y = h * (i + 0.5) / n + (o.dy || 0) * h; if (o.shadow) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillText(txt, w / 2 + fs * 0.04, y + fs * 0.05); } g.fillStyle = col; g.fillText(txt, w / 2, y); }); }); }
// ---------------- walls with holes ----------------
// wall along local +x from x=0..len, height H, thickness T; holes [{x0,x1,y0,y1}] -> boxes around the holes
export function wall(g, s, len, H, T, m, holes = [], o = {}) { const grp = new THREE.Group(); g.add(grp); if (o.pos) grp.position.set(...o.pos); grp.rotation.y = o.ry || 0;
  const xs = [0, len, ...holes.flatMap(h => [h.x0, h.x1])].sort((a, b) => a - b).filter((v, i, a) => i === 0 || v > a[i - 1] + 1e-4);
  for (let i = 0; i < xs.length - 1; i++) { const a = xs[i], b = xs[i + 1], cx = (a + b) / 2; const hs = holes.filter(h => h.x0 <= a + 1e-4 && h.x1 >= b - 1e-4).sort((p, q) => p.y0 - q.y0); let y = 0;
    for (const h of [...hs, { y0: H, y1: H }]) { if (h.y0 > y + 1e-4) { const me = bx(grp, b - a, h.y0 - y, T, m, cx, (y + h.y0) / 2, 0, { r: 0 }); if (s) obst(s, me, o.name || 'parede'); } y = Math.max(y, h.y1); } }
  return grp; }
// ---------------- door (frame + leaf on a hinge) ----------------
// placed in a wall hole: centre x (wall local), opens toward +z (into the camera side) by default. d.set(k) 0..1
export function door(parent, s, o = {}) { const W = o.w || SC.doorW, H = o.h || SC.doorH, col = o.color || '#8a4a2a', fr = o.frame || '#f4f0e8'; const g = new THREE.Group(); parent.add(g); g.position.set(o.x || 0, 0, o.z || 0); g.rotation.y = o.ry || 0;
  for (const sx of [-1, 1]) { const j = bx(g, 0.35, H + 0.35, 0.8, fr, sx * (W / 2 + 0.17), (H + 0.35) / 2, 0); if (s) obst(s, j, 'batente'); } bx(g, W + 0.7, 0.35, 0.8, fr, 0, H + 0.17, 0);
  const side = o.hinge === 'right' ? 1 : -1; const hinge = new THREE.Group(); hinge.position.set(side * W / 2, 0, 0); g.add(hinge);
  const leaf = new THREE.Group(); leaf.position.set(-side * W / 2, 0, 0); hinge.add(leaf); const LW = W - 0.06;
  const slab = bx(leaf, LW, H - 0.06, 0.24, col, 0, H / 2, 0, { r: 0.04 }); slab.name = 'door';
  for (const [py, ph] of [[H * 0.72, H * 0.34], [H * 0.28, H * 0.34]]) for (const zz of [0.13, -0.13]) bx(leaf, LW * 0.62, ph, 0.05, shade(col, 0.82), 0, py, zz, { r: 0.03 });
  for (const zz of [0.24, -0.24]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), mat('#d8b040', { metal: 0.6, rough: 0.3 })); k.position.set(-side * (LW / 2 - 0.42), H * 0.47, zz); /* knob on the side OPPOSITE the hinge */ k.castShadow = true; leaf.add(k); }
  if (o.sign) { const t = textTex(o.sign, { bg: '#f2f2f2', color: '#222', w: 256, h: 128 }); const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshStandardMaterial({ map: t })); p.position.set(0, H * 0.82, 0.13); leaf.add(p); }
  const open = (o.open ?? 1.75) * (o.inward ? 1 : -1) * -side; const d = { group: g, hinge, leaf, set(k) { hinge.rotation.y = open * k; } }; d.set(0); if (s) obst(s, slab, o.name || 'porta', true); return d; }
// ---------------- window ----------------
export function win(parent, o = {}) { const W = o.w || 3.4, H = o.h || 4.0; const g = new THREE.Group(); parent.add(g); g.position.set(o.x || 0, o.y ?? SC.sill, o.z || 0); g.rotation.y = o.ry || 0; const fr = o.frame || '#f6f4ee';
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W, H), o.opaque ? new THREE.MeshStandardMaterial({ color: '#8fc6ea', roughness: 0.12, metalness: 0.25, emissive: '#26445a', emissiveIntensity: 0.25 }) : o.night ? mat('#ffd890', { em: '#ffb860', ei: 0.9 }) : new THREE.MeshPhysicalMaterial({ color: '#9fd0f0', roughness: 0.05, metalness: 0, transmission: 0, opacity: 0.55, transparent: true })); glass.position.set(0, H / 2, 0); g.add(glass);
  for (const [w, h, x, y] of [[W + 0.5, 0.28, 0, -0.1], [W + 0.5, 0.28, 0, H + 0.1], [0.28, H + 0.4, -W / 2 - 0.1, H / 2], [0.28, H + 0.4, W / 2 + 0.1, H / 2], [0.14, H, 0, H / 2], [W, 0.14, 0, H * 0.55]]) bx(g, w, h, 0.32, fr, x, y, 0.05);
  bx(g, W + 0.9, 0.22, 0.75, fr, 0, -0.25, 0.25);
  if (o.shutters) for (const sd of [-1, 1]) { const sw = W * 0.3, sx = sd * (W / 2 + 0.2 + sw / 2); bx(g, sw, H + 0.2, 0.12, o.shutters, sx, H / 2, 0.15); for (let i = 0; i < 9; i++) bx(g, sw * 0.9, 0.06, 0.06, shade(o.shutters, 0.8), sx, 0.3 + i * H / 9, 0.24, { r: 0 }); }
  g.userData.halfW = o.shutters ? W / 2 + 0.2 + W * 0.3 : W / 2 + 0.25;  /* total half-width incl. shutters (used to keep it INSIDE the facade) */
  if (o.curtains) for (const sd of [-1, 1]) bx(g, W * 0.26, H + 0.6, 0.18, o.curtains, sd * (W / 2 - W * 0.06), H / 2, 0.45, { r: 0.08 });
  if (o.flowers) { bx(g, W, 0.5, 0.6, '#b0603a', 0, -0.6, 0.55); for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), mat(['#e84a6a', '#f4c03a', '#ff7aa8', '#e8743a'][i % 4])); f.position.set(-W / 2 + 0.4 + i * (W - 0.8) / 4, -0.2, 0.55); g.add(f); } }
  return g; }
// ---------------- furniture (all with obstacles) ----------------
export const FURN = {
  bed(p, s, x, z, ry = 0, o = {}) { const g = new THREE.Group(); p.add(g); g.position.set(x, 0, z); g.rotation.y = ry; const L = 6.6, W = o.w || 4.2, wood = o.wood || '#9a5a32';
    bx(g, W, 0.9, L, wood, 0, 0.75, 0); bx(g, W - 0.2, 0.6, L - 0.3, '#ffffff', 0, 1.45, 0.1, { r: 0.2 }); const q = bx(g, W + 0.1, 0.32, L * 0.62, o.quilt || '#5ab0d8', 0, 1.78, L * 0.18, { r: 0.12 }); bx(g, W * 0.7, 0.45, 1.1, '#ffffff', 0, 1.95, -L / 2 + 0.9, { r: 0.22 });
    bx(g, W + 0.5, 3.8, 0.45, wood, 0, 1.9, -L / 2, { r: 0.15 }); bx(g, W + 0.5, 1.7, 0.4, wood, 0, 0.85, L / 2, { r: 0.12 }); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, 0.4, 0.5, 0.4, shade(wood, 0.8), sx * (W / 2 - 0.25), 0.25, sz * (L / 2 - 0.3));
    if (s) obst(s, g, 'cama'); g.userData.top = 1.75; return g; },
  nightstand(p, s, x, z, ry = 0, o = {}) { const g = new THREE.Group(); p.add(g); g.position.set(x, 0, z); g.rotation.y = ry; bx(g, 1.8, 2.2, 1.6, o.wood || '#b07040', 0, 1.1, 0); bx(g, 1.5, 0.7, 0.06, shade(o.wood || '#b07040', 0.82), 0, 1.4, 0.81); const k = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mat('#d8b040', { metal: 0.6 })); k.position.set(0, 1.4, 0.86); g.add(k);
    if (o.lamp !== false) { bx(g, 0.5, 0.15, 0.5, '#e8e0d0', -0.3, 2.28, -0.1); bx(g, 0.12, 0.9, 0.12, '#e8e0d0', -0.3, 2.7, -0.1); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 0.75, 20, 1, true), mat(o.shade || '#f6e2b0', { em: o.lit ? '#ffcf80' : '#000', ei: 0.6 })); sh.material.side = THREE.DoubleSide; sh.position.set(-0.3, 3.3, -0.1); g.add(sh); }
    if (s) obst(s, g, 'criado-mudo'); return g; },
  table(p, s, x, z, ry = 0, o = {}) { const g = new THREE.Group(); p.add(g); g.position.set(x, 0, z); g.rotation.y = ry; const W = o.w || 5, D = o.d || 3.2; bx(g, W, 0.25, D, o.wood || '#b07a4a', 0, SC.table - 0.12, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, 0.28, SC.table - 0.25, 0.28, shade(o.wood || '#b07a4a', 0.8), sx * (W / 2 - 0.3), (SC.table - 0.25) / 2, sz * (D / 2 - 0.3));
    if (o.cloth) { const cl = bx(g, W + 0.2, 0.06, D + 0.2, mat('#ffffff', { map: TEX.tiles(o.cloth, '#ffffff', [3, 2]) }), 0, SC.table + 0.02, 0, { r: 0 }); } if (s) obst(s, g, 'mesa'); g.userData.top = SC.table; return g; },
  chair(p, s, x, z, ry = 0, o = {}) { const g = new THREE.Group(); p.add(g); g.position.set(x, 0, z); g.rotation.y = ry; const c = o.color || '#c8864a'; bx(g, 1.8, 0.2, 1.7, c, 0, SC.seat - 0.1, 0); bx(g, 1.8, 2.2, 0.2, c, 0, SC.seat + 1.1, -0.78); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, 0.18, SC.seat - 0.2, 0.18, shade(c, 0.8), sx * 0.75, (SC.seat - 0.2) / 2, sz * 0.7);
    if (s) obst(s, g, 'cadeira'); g.userData.seat = SC.seat; return g; },
  sofa(p, s, x, z, ry = 0, o = {}) { const g = new THREE.Group(); p.add(g); g.position.set(x, 0, z); g.rotation.y = ry; const c = o.color || '#e0702a', W = o.w || 6.4; bx(g, W, 1.0, 2.6, c, 0, 0.6, 0, { r: 0.25 }); bx(g, W, 2.4, 0.8, c, 0, 1.6, -1.0, { r: 0.3 }); for (const sx of [-1, 1]) bx(g, 0.7, 1.9, 2.6, shade(c, 0.92), sx * (W / 2 - 0.3), 1.0, 0, { r: 0.3 });
    for (const sx of [-1, 1]) bx(g, W / 2 - 0.75, 0.42, 2.0, shade(c, 1.08), sx * (W / 4 - 0.02), 1.3, 0.15, { r: 0.2 }); if (s) obst(s, g, 'sofá'); g.userData.seat = 1.3; return g; },
  rug(p, x, z, w, d, a = '#e04a4a', b = '#f4c03a') { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), mat('#ffffff', { map: canvasTex(256, 256, (g, W, H) => { g.fillStyle = a; g.fillRect(0, 0, W, H); g.strokeStyle = b; g.lineWidth = 14; g.strokeRect(20, 20, W - 40, H - 40); g.fillStyle = b; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { g.beginPath(); g.arc(50 + i * 39, 50 + j * 39, 6, 0, 7); g.fill(); } }) })); m.position.set(x, 0.04, z); m.receiveShadow = true; p.add(m); return m; },
  wallClock(p, x, y, z, ry = 0, o = {}) { const g = new THREE.Group(); p.add(g); g.position.set(x, y, z); g.rotation.y = ry; const R = o.r || 1.1;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.14, 12, 48), mat(o.rim || '#d83a3a')); g.add(rim); const face = new THREE.Mesh(new THREE.CircleGeometry(R, 48), mat('#ffffff')); face.position.z = -0.02; g.add(face);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const tk = bx(g, i % 3 ? 0.06 : 0.1, i % 3 ? 0.18 : 0.28, 0.04, '#222', Math.sin(a) * R * 0.82, Math.cos(a) * R * 0.82, 0.01, { r: 0 }); tk.rotation.z = -a; }
    const mk = (L, w) => { const h = new THREE.Group(); g.add(h); bx(h, w, L, 0.05, '#151515', 0, L / 2 - 0.1, 0.04, { r: 0 }); return h; }; const hh = mk(R * 0.5, 0.12), mh = mk(R * 0.78, 0.08); const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 12), mat('#151515')); pin.rotation.x = Math.PI / 2; pin.position.z = 0.08; g.add(pin);
    g.set = (h, m) => { mh.rotation.z = -m / 60 * Math.PI * 2; hh.rotation.z = -((h % 12) + m / 60) / 12 * Math.PI * 2; }; g.set(o.h ?? 3, o.m ?? 0); return g; },
  shelf(p, s, x, z, ry = 0, o = {}) { const g = new THREE.Group(); p.add(g); g.position.set(x, 0, z); g.rotation.y = ry; const W = o.w || 4, H = o.h || 7; const wd = o.wood || '#9a6a3a'; bx(g, W, H, 0.2, shade(wd, 0.85), 0, H / 2, -0.6); for (const sx of [-1, 1]) bx(g, 0.2, H, 1.4, wd, sx * W / 2, H / 2, 0);
    const r = rnd(o.seed || 4); for (let k = 0; k < 4; k++) { const y = 0.3 + k * (H / 4); bx(g, W, 0.15, 1.4, wd, 0, y, 0); let xx = -W / 2 + 0.3; while (xx < W / 2 - 0.4) { const bw = 0.22 + r() * 0.25, bh = 1.0 + r() * 0.5; bx(g, bw, bh, 0.9, ['#d83a3a', '#2a62d8', '#3ab04a', '#f4c03a', '#8a3ad8', '#e8743a'][Math.floor(r() * 6)], xx + bw / 2, y + 0.08 + bh / 2, 0.05, { r: 0.02 }); xx += bw + 0.03; } }
    if (s) obst(s, g, 'estante'); return g; },
  tv(p, x, z, ry = 0, o = {}) { const g = new THREE.Group(); p.add(g); g.position.set(x, 0, z); g.rotation.y = ry; bx(g, 4.6, 2.0, 1.4, o.wood || '#6a4028', 0, 1.0, 0); bx(g, 4.2, 2.5, 0.25, '#141418', 0, 3.3, 0); const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 2.2), new THREE.MeshBasicMaterial({ color: '#0a0a10', toneMapped: false })); scr.position.set(0, 3.3, 0.13); g.add(scr); g.screen = scr; return g; },
  lockers(p, s, x, z, ry = 0, o = {}) { const g = new THREE.Group(); p.add(g); g.position.set(x, 0, z); g.rotation.y = ry; const n = o.n || 8, w = 1.5, H = 7.2; const cols = o.colors || ['#e83a3a', '#f4a03a', '#f4d03a', '#3ab04a', '#2a8ad8', '#6a3ad8', '#d83aa8'];
    for (let i = 0; i < n; i++) { const c = cols[i % cols.length]; const lx = (i - (n - 1) / 2) * w; bx(g, w - 0.06, H, 1.6, c, lx, H / 2, 0, { r: 0.04 }); for (let v = 0; v < 4; v++) bx(g, w * 0.55, 0.06, 0.05, shade(c, 0.7), lx, H * 0.86 - v * 0.2, 0.82, { r: 0 }); bx(g, 0.1, 0.45, 0.1, '#c8c8c8', lx + w * 0.3, H * 0.52, 0.84, { r: 0.02 }); }
    if (s) obst(s, g, 'armários'); return g; },
  desk(p, s, x, z, ry = 0, o = {}) { const g = new THREE.Group(); p.add(g); g.position.set(x, 0, z); g.rotation.y = ry; bx(g, 3.2, 0.2, 2.2, o.top || '#d8a060', 0, SC.table - 0.1, 0); bx(g, 3.0, 0.9, 1.9, '#4a6aa8', 0, SC.table - 0.65, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, 0.15, SC.table - 0.2, 0.15, '#606a78', sx * 1.4, (SC.table - 0.2) / 2, sz * 0.9);
    if (s) obst(s, g, 'carteira'); g.userData.top = SC.table; return g; },
  board(p, x, y, z, ry = 0, o = {}) { const g = new THREE.Group(); p.add(g); g.position.set(x, y, z); g.rotation.y = ry; const W = o.w || 10, H = o.h || 4.5; bx(g, W + 0.5, H + 0.5, 0.2, '#b07a4a', 0, 0, -0.05); const t = textTex(o.text || '', { bg: o.bg || '#2a5a3a', color: '#f4f4f0', w: 1024, h: Math.round(1024 * H / W), size: 0.5 });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 })); pl.position.z = 0.07; g.add(pl); bx(g, W * 0.9, 0.18, 0.5, '#b07a4a', 0, -H / 2 - 0.2, 0.25); return g; },
};
// ---------------- interior room (back + side walls, floor, ceiling, lamp) ----------------
// o = { w, d, h, wall, wallTex, floor, doors:[{wall:'back'|'left'|'right', x, ...doorOpts}], windows:[{wall, x, y, ...}], night }
export function room(s, o = {}) { const g = new THREE.Group(); s.add(g); const W = o.w || 24, D = o.d || 20, H = o.h || SC.ceil, T = SC.wallT;
  const wm = new THREE.MeshStandardMaterial({ color: '#ffffff', map: o.wallTex || TEX.plaster(o.wall || '#cfe0f0', [2, 2]), roughness: 0.85 });
  const fl = new THREE.Mesh(new THREE.BoxGeometry(W, 0.3, D), new THREE.MeshStandardMaterial({ map: o.floorTex || TEX.planks(o.floor || '#c08a5a', [W / 8, D / 8]), roughness: 0.7 })); fl.position.set(0, -0.15, 0); fl.receiveShadow = true; g.add(fl);
  const doorsOn = w => (o.doors || []).filter(d => d.wall === w), winOn = w => (o.windows || []).filter(d => d.wall === w);
  const holes = w => [...doorsOn(w).map(d => ({ x0: d.x - (d.w || SC.doorW) / 2 - 0.35, x1: d.x + (d.w || SC.doorW) / 2 + 0.35, y0: 0, y1: (d.h || SC.doorH) + 0.35 })), ...winOn(w).map(d => ({ x0: d.x - (d.w || 3.4) / 2 - 0.25, x1: d.x + (d.w || 3.4) / 2 + 0.25, y0: (d.y ?? SC.sill) - 0.25, y1: (d.y ?? SC.sill) + (d.h || 4) + 0.25 }))];
  const walls = { back: { len: W, pos: [-W / 2, H / 2 * 0, -D / 2], ry: 0, off: W / 2 }, left: { len: D, pos: [-W / 2, 0, D / 2], ry: Math.PI / 2, off: D / 2 }, right: { len: D, pos: [W / 2, 0, -D / 2], ry: -Math.PI / 2, off: D / 2 } };
  const D_ = {}; for (const [k, wd] of Object.entries(walls)) { if (o.open?.includes(k)) continue; const hs = holes(k).map(h => ({ ...h, x0: h.x0 + wd.off, x1: h.x1 + wd.off }));
    const wg = wall(g, s, wd.len, H, T, wm, hs, { pos: [wd.pos[0], 0, wd.pos[2]], ry: wd.ry, name: 'parede' });
    bx(wg, wd.len, 0.5, 0.25, o.trim || '#ffffff', wd.len / 2, 0.25, T / 2 + 0.12, { r: 0 }); bx(wg, wd.len, 0.35, 0.3, o.trim || '#ffffff', wd.len / 2, H - 0.18, T / 2 + 0.12, { r: 0 });
    for (const d of doorsOn(k)) { const dd = door(wg, s, { ...d, x: d.x + wd.off, z: 0 }); D_[d.name || k] = dd;
      const hx = d.x + wd.off, hw = (d.w || SC.doorW) + 3; const hm = mat(o.hall || '#e8dcc8'); bx(wg, hw, 0.2, 7, mat('#a07850'), hx, -0.1, -3.8, { r: 0 }); for (const sx of [-1, 1]) bx(wg, 0.3, H, 7, hm, hx + sx * hw / 2, H / 2, -3.8, { r: 0 }); bx(wg, hw, H, 0.3, hm, hx, H / 2, -7.2, { r: 0 }); bx(wg, hw, 0.3, 7, hm, hx, H, -3.8, { r: 0 });
      const hl = new THREE.PointLight('#ffe8c8', 30, 14, 1.5); hl.position.set(hx, H - 2, -4); wg.add(hl); }
    for (const w_ of winOn(k)) win(wg, { ...w_, x: w_.x + wd.off, z: 0.05, night: o.night }); }
  if (o.ceiling !== false) { const c = new THREE.Mesh(new THREE.BoxGeometry(W, 0.3, D), mat(o.ceil || '#f4f2ee')); c.position.set(0, H + 0.15, 0); g.add(c);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.2, 24), mat('#fffbe8', { em: '#fff4d0', ei: 1.0 })); lamp.position.set(o.lampX || 0, H - 0.1, o.lampZ || 0); g.add(lamp); }
  return { group: g, doors: D_, W, D, H }; }
// ---------------- Mediterranean row house (2 storeys, door module, shutters, balcony, roof) ----------------
export function house(p, s, o = {}) { const g = new THREE.Group(); p.add(g); g.position.set(o.x || 0, 0, o.z || 0); const W = o.w || 14, H = o.storeys === 1 ? 13 : 25.5, Dp = 10; const col = o.color || '#f2a4c8', trim = o.trim || '#ffffff';
  const wm = new THREE.MeshStandardMaterial({ color: '#ffffff', map: TEX.plaster(col, [W / 8, H / 8]), roughness: 0.9 }); const dx = o.doorX ?? 0;
  const holes = [{ x0: W / 2 + dx - SC.doorW / 2 - 0.35, x1: W / 2 + dx + SC.doorW / 2 + 0.35, y0: 0, y1: SC.doorH + 0.35 }];
  const reach = 1.7 + 0.2 + 3.4 * 0.3; /* half-width of a window WITH its shutters */
  const wx = Math.max(reach + 0.1, Math.min(W * 0.3, W / 2 - 0.35 - reach)); /* inside the house (never over the neighbour's) and the two windows never touching */
  if (W / 2 - 0.35 - reach < reach + 0.1) console.log(`LOG SOBREPOSTO casa estreita demais (W=${W}) pra 2 janelas com persianas`);
  const wins = []; for (const fx of [-wx, wx]) if (Math.abs(fx - dx) > reach + SC.doorW / 2 + 0.35 + 0.3) wins.push({ x: fx, y: SC.sill }); /* no shutter over the door frame */ if (o.storeys !== 1) for (const fx of [-wx, wx]) wins.push({ x: fx, y: SC.storey + 2.2 });
  for (const w_ of wins) holes.push({ x0: W / 2 + w_.x - 1.95, x1: W / 2 + w_.x + 1.95, y0: w_.y - 0.25, y1: w_.y + 4.25 });
  wall(g, s, W, H, 0.6, wm, holes, { pos: [-W / 2, 0, 0], name: 'casa' }); const back = bx(g, W, H, Dp - 5, wm, 0, H / 2, -5.3 - (Dp - 5) / 2, { r: 0 }); if (s) obst(s, back, 'casa');
  { const hx = o.doorX ?? 0; const dm = mat('#3a2c24'); bx(g, SC.doorW + 2.6, 0.2, 5.0, mat('#6a4a34'), hx, 0.0, -2.8, { r: 0 }); for (const sx of [-1, 1]) { const sw = bx(g, 0.4, SC.doorH + 1, 5.0, dm, hx + sx * (SC.doorW / 2 + 1.1), (SC.doorH + 1) / 2, -2.8, { r: 0 }); if (s) obst(s, sw, 'casa'); }
    bx(g, SC.doorW + 2.6, 0.4, 5.0, dm, hx, SC.doorH + 1, -2.8, { r: 0 }); const lamp = new THREE.PointLight('#ffd8a0', 12, 9, 1.5); lamp.position.set(hx, SC.doorH - 0.5, -3.5); g.add(lamp); }
  const d = door(g, s, { x: dx, z: 0, color: o.doorColor || '#8a3a2a', frame: trim, name: 'porta-casa', inward: true });
  for (const w_ of wins) { const wg = win(g, { x: w_.x, y: w_.y, z: 0.3, /* on the wall FACE: shutters/frame never buried in the wall */ w: 3.4, h: 4, shutters: o.shutters || '#3a8a5a', flowers: w_.y < 5 && o.flowers, night: o.night }); if (Math.abs(w_.x) + wg.userData.halfW > W / 2 + 1e-3) console.log(`LOG SOBREPOSTO janela/persiana passa da borda da casa (x=${w_.x.toFixed(2)})`); }
  bx(g, W + 0.8, 0.6, 1.0, trim, 0, SC.storey - 0.1, 0.3); bx(g, W + 1.2, 0.9, 1.4, trim, 0, H - 0.2, 0.4);
  if (o.storeys !== 1 && o.balcony !== false) { const by = SC.storey + 0.3; bx(g, W * 0.55, 0.35, 2.4, trim, dx, by, 1.2); for (let i = 0; i <= 10; i++) bx(g, 0.12, 2.6, 0.12, o.rail || '#2a3a6a', dx - W * 0.27 + i * W * 0.054, by + 1.4, 2.3, { r: 0 }); bx(g, W * 0.55, 0.16, 0.2, o.rail || '#2a3a6a', dx, by + 2.75, 2.3, { r: 0 }); }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(W + 1.6, 0.8, Dp + 2), new THREE.MeshStandardMaterial({ map: TEX.roof(o.roof || '#c8502a', [3, 3]) })); roof.position.set(0, H + 0.6, -Dp / 2 + 0.5); roof.castShadow = true; g.add(roof);
  bx(g, 1.2, 0.6, 0.6, '#c0c4cc', -W / 2 + 1.2, SC.doorH + 1.2, 0.6); // lamp box
  return { group: g, door: d, W, H }; }
// ---------------- street (cobblestone, sidewalks, curb, lamps, trees, benches) ----------------
export function street(s, o = {}) { const g = new THREE.Group(); s.add(g); const L = o.len || 120;
  const road = new THREE.Mesh(new THREE.BoxGeometry(L, 0.3, 16), new THREE.MeshStandardMaterial({ map: TEX.cobble('#b8b4ae', [L / 8, 2]) })); road.position.set(0, -0.45, 16.25); road.receiveShadow = true; g.add(road);
  const walk = new THREE.Mesh(new THREE.BoxGeometry(L, 0.3, 8.25), new THREE.MeshStandardMaterial({ map: TEX.tiles('#e8e2d8', '#d8d0c4', [L / 4, 2]) })); walk.position.set(0, -0.15, 4.1); walk.receiveShadow = true; g.add(walk);
  bx(g, L, 0.4, 0.5, '#c8c4bc', 0, -0.15, 8.2, { r: 0.08 });
  const cols = [['#f2a4c8', '#3a8a5a'], ['#7ec8f0', '#2a5ab0'], ['#f6c25a', '#c83a2a'], ['#8fd47a', '#2a6ab0'], ['#f08a5a', '#2a8a8a'], ['#b89cf0', '#3a6a3a']]; const H_ = [];
  let x = -L / 2 + 2; let i = 0; while (x < L / 2 - 8) { const w = 13 + (i % 3) * 2; const [c, sh] = cols[(i + (o.seed || 0)) % cols.length]; H_.push(house(g, s, { x: x + w / 2, z: 0, w, color: c, shutters: sh, doorX: ((i % 2) ? -1 : 1) * (w * 0.18), night: o.night, flowers: i % 2 === 0, roof: ['#c8502a', '#a84a3a', '#d8603a'][i % 3] })); x += w; i++; }
  for (const lx of o.lamps || [-30, -10, 10, 30]) { const lp = new THREE.Group(); g.add(lp); lp.position.set(lx, 0, 7); bx(lp, 0.35, 11, 0.35, '#2a2a30', 0, 5.5, 0); bx(lp, 1.0, 1.3, 1.0, '#2a2a30', 0, 11.4, 0); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10), mat('#fff4d0', { em: '#ffe8a0', ei: o.night ? 2.5 : 0.4 })); bulb.position.set(0, 10.8, 0); lp.add(bulb); if (s) obst(s, lp.children[0], 'poste'); if (o.night) { const pl = new THREE.PointLight('#ffd8a0', 60, 26, 1.6); pl.position.set(lx, 10.4, 7.6); g.add(pl); } }
  for (const tx of o.trees || [-20, 20]) { const t = new THREE.Group(); g.add(t); t.position.set(tx, 0, 6.2); bx(t, 0.7, 5, 0.7, '#7a4a2a', 0, 2.5, 0); for (const [px, py, r] of [[0, 6.5, 2.6], [1.4, 5.6, 1.8], [-1.4, 5.7, 1.9]]) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat('#3ea84a', { rough: 0.8 })); m.position.set(px, py, 0); m.castShadow = true; t.add(m); } if (s) obst(s, t.children[0], 'árvore'); }
  return { group: g, houses: H_ }; }
// ---------------- lighting ----------------
export function sky(s, top = '#4a9ae8', bot = '#cfe8ff') { s.background = canvasTex(4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, w, h); }); s.background.wrapS = s.background.wrapT = THREE.ClampToEdgeWrapping; s.background.repeat.set(1, 1); }
export function daylight(s, o = {}) { const sun = new THREE.DirectionalLight(o.sun || '#fff1dc', o.sunI ?? 3.0); sun.position.set(...(o.sunPos || [-30, 50, 40])); sun.target.position.set(0, 0, 0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); const c = sun.shadow.camera; c.left = -40; c.right = 40; c.top = 40; c.bottom = -40; c.near = 1; c.far = 160; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05; sun.shadow.radius = 4; s.add(sun, sun.target);
  s.add(new THREE.HemisphereLight(o.sky || '#cfe6ff', o.ground || '#b89a7a', o.hemi ?? 1.3)); return sun; }
export function interiorLight(s, o = {}) { const p = new THREE.PointLight(o.color || '#fff0d8', o.i ?? 120, o.dist ?? 40, 1.4); p.position.set(...(o.pos || [0, SC.ceil - 1.2, 0])); p.castShadow = true; p.shadow.mapSize.set(1024, 1024); p.shadow.bias = -0.001; p.shadow.normalBias = 0.05; s.add(p);
  s.add(new THREE.HemisphereLight(o.sky || '#fff6ea', o.ground || '#8a7060', o.hemi ?? 0.9)); return p; }
// ---------------- obstacle check (character parts vs walls/doors/furniture) ----------------
const _a = new THREE.Box3(), _b = new THREE.Box3();
export function obstacleCheck(t, s, live, log = console.log) { const O = s.userData.obst || []; let n = 0; s.updateMatrixWorld(true); for (const c of live) { if (!c.root.visible) continue; c.root.updateMatrixWorld(true);
    const parts = [c.torsoMesh, c.headMesh, c.lowerTorso, c.armR.mesh, c.armL.mesh, c.armR.lower, c.armL.lower, c.armR.handMesh, c.armL.handMesh, c.legR.mesh, c.legL.mesh, c.legR.lower, c.legL.lower, c.legR.foot, c.legL.foot].filter(Boolean);
    for (const ob of O) { if (c.allowObst?.has(ob.name)) continue; ob.obj.updateMatrixWorld(true); if (!ob.dyn && !ob.box) ob.box = new THREE.Box3().setFromObject(ob.obj); const box = ob.dyn ? _b.setFromObject(ob.obj) : ob.box;
      for (const pm of parts) { _a.setFromObject(pm).expandByScalar(-0.08); if (_a.intersectsBox(box)) { n++; if (n < 4) log(`LOG ATRAVESSA t=${t.toFixed(2)} ${c.name} x ${ob.name} (${pm === c.headMesh ? 'cabeça' : pm === c.torsoMesh ? 'tronco' : 'membro'})`); break; } } } } return n; }
// ---------------- camera QA: occlusion (something between camera and a face) + framing (face inside the vertical frame) ----------------
const _ray = new THREE.Raycaster();
export function cameraCheck(t, s, cam, live, log = console.log) { let n = 0; s.updateMatrixWorld(true); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
  const charMeshes = new Set(); for (const c of live) c.root.traverse(o => charMeshes.add(o));
  const targets = []; s.traverse(o => { if (o.isMesh && !charMeshes.has(o) && !(o.material && o.material.transparent)) targets.push(o); });
  for (const c of live) { if (!c.root.visible) continue; const hp = c.head.localToWorld(new THREE.Vector3(0, 0.66, 0.4)); const ndc = hp.clone().project(cam);
    if (ndc.z > 1 || Math.abs(ndc.x) > 0.92 || ndc.y > 0.95 || ndc.y < -0.9) { n++; log(`LOG FORA_DO_QUADRO t=${t.toFixed(2)} ${c.name} ndc=${ndc.x.toFixed(2)},${ndc.y.toFixed(2)}`); continue; }
    const dir = hp.clone().sub(cam.position); const dist = dir.length(); _ray.set(cam.position, dir.normalize()); _ray.far = dist - 0.6; const hit = _ray.intersectObjects(targets, false)[0];
    if (hit) { n++; log(`LOG OCLUSAO t=${t.toFixed(2)} ${c.name} tapado por ${hit.object.name || hit.object.parent?.name || 'objeto'} a ${hit.distance.toFixed(1)}`); } } return n; }
// ---------------- character x character check (all R15 parts: torso, head, upper/lower arms, hands, legs, feet) ----------------
const _p = new THREE.Box3(), _q = new THREE.Box3();
export function charCheck(t, live, log = console.log) { let n = 0; const parts = c => [c.torsoMesh, c.lowerTorso, c.headMesh, c.armR.mesh, c.armL.mesh, c.armR.lower, c.armL.lower, c.armR.handMesh, c.armL.handMesh, c.legR.mesh, c.legL.mesh, c.legR.lower, c.legL.lower, c.legR.foot, c.legL.foot].filter(Boolean);
  for (const c of live) c.root.updateMatrixWorld(true);
  for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) { const A = live[i], B = live[j]; if (!A.root.visible || !B.root.visible || A.noCollide?.has(B.name) || B.noCollide?.has(A.name)) continue;
    for (const pa of parts(A)) { _p.setFromObject(pa).expandByScalar(-0.05); for (const pb of parts(B)) { _q.setFromObject(pb).expandByScalar(-0.05); if (_p.intersectsBox(_q)) { n++; if (n < 4) log(`LOG ATRAVESSA t=${t.toFixed(2)} ${A.name} x ${B.name}`); break; } } } } return n; }
// one call per frame before rendering: people x people, people x walls/doors/furniture, camera occlusion/framing
export function qa(t, s, cam, live, log = console.log) { return charCheck(t, live, log) + obstacleCheck(t, s, live, log) + cameraCheck(t, s, cam, live, log); }
