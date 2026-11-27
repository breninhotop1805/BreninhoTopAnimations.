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
export function room(s, o = {}) { const g = new THREE.Group(); s.add(g); const W = o.w || 24, D = o.d || 20, H = o.h || SC.ceil, T = SC.wallT; const CZ = o.cz || 0; /* room centre z (deeper rooms without moving the furniture) */
  const wm = new THREE.MeshStandardMaterial({ color: '#ffffff', map: o.wallTex || TEX.plaster(o.wall || '#cfe0f0', [2, 2]), roughness: 0.85 });
  const fl = new THREE.Mesh(new THREE.BoxGeometry(W, 0.3, D), new THREE.MeshStandardMaterial({ map: o.floorTex || TEX.planks(o.floor || '#c08a5a', [W / 8, D / 8]), roughness: 0.7 })); fl.position.set(0, -0.15, CZ); fl.receiveShadow = true; g.add(fl);
  const doorsOn = w => (o.doors || []).filter(d => d.wall === w), winOn = w => (o.windows || []).filter(d => d.wall === w);
  const holes = w => [...doorsOn(w).map(d => ({ x0: d.x - (d.w || SC.doorW) / 2 - 0.35, x1: d.x + (d.w || SC.doorW) / 2 + 0.35, y0: 0, y1: (d.h || SC.doorH) + 0.35 })), ...winOn(w).map(d => ({ x0: d.x - (d.w || 3.4) / 2 - 0.25, x1: d.x + (d.w || 3.4) / 2 + 0.25, y0: (d.y ?? SC.sill) - 0.25, y1: (d.y ?? SC.sill) + (d.h || 4) + 0.25 })), ...(o.holes || []).filter(h => h.wall === w).map(h => ({ x0: h.x - h.w / 2, x1: h.x + h.w / 2, y0: h.y, y1: h.y + h.h }))];
  const walls = { back: { len: W, pos: [-W / 2, H / 2 * 0, -D / 2 + CZ], ry: 0, off: W / 2 }, left: { len: D, pos: [-W / 2, 0, D / 2 + CZ], ry: Math.PI / 2, off: D / 2 }, right: { len: D, pos: [W / 2, 0, -D / 2 + CZ], ry: -Math.PI / 2, off: D / 2 } , ...(o.front ? { front: { len: W, pos: [W / 2, 0, D / 2 + CZ], ry: Math.PI, off: -W / 2 } } : {}) };
  const D_ = {}; for (const [k, wd] of Object.entries(walls)) { if (o.open?.includes(k)) continue; const hs = holes(k).map(h => ({ ...h, x0: h.x0 + wd.off, x1: h.x1 + wd.off }));
    const wg = wall(g, s, wd.len, H, T, wm, hs, { pos: [wd.pos[0], 0, wd.pos[2]], ry: wd.ry, name: 'parede' });
    bx(wg, wd.len, 0.5, 0.25, o.trim || '#ffffff', wd.len / 2, 0.25, T / 2 + 0.12, { r: 0 }); bx(wg, wd.len, 0.35, 0.3, o.trim || '#ffffff', wd.len / 2, H - 0.18, T / 2 + 0.12, { r: 0 });
    for (const d of doorsOn(k)) { const dd = door(wg, s, { ...d, x: d.x + wd.off, z: 0 }); D_[d.name || k] = dd;
      const hx = d.x + wd.off, hw = (d.w || SC.doorW) + 3; const hm = mat(o.hall || '#e8dcc8'); bx(wg, hw, 0.2, 7, mat('#a07850'), hx, -0.1, -3.8, { r: 0 }); for (const sx of [-1, 1]) bx(wg, 0.3, H, 7, hm, hx + sx * hw / 2, H / 2, -3.8, { r: 0 }); bx(wg, hw, H, 0.3, hm, hx, H / 2, -7.2, { r: 0 }); bx(wg, hw, 0.3, 7, hm, hx, H, -3.8, { r: 0 });
      const hl = new THREE.PointLight('#ffe8c8', 30, 14, 1.5); hl.position.set(hx, H - 2, -4); wg.add(hl); }
    for (const w_ of winOn(k)) win(wg, { ...w_, x: w_.x + wd.off, z: 0.05, night: o.night }); }
  if (o.ceiling !== false) { const c = new THREE.Mesh(new THREE.BoxGeometry(W, 0.3, D), mat(o.ceil || '#f4f2ee')); c.position.set(0, H + 0.15, CZ); g.add(c);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.2, 24), mat('#fffbe8', { em: '#fff4d0', ei: 1.0 })); lamp.position.set(o.lampX || 0, H - 0.1, o.lampZ || 0); g.add(lamp); }
  return { group: g, doors: D_, W, D, H, CZ }; }
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
  const alt = o.alt ? 1 : 0; /* neighbours: alternate offsets -> overlapping eaves/bands are NEVER coplanar (no z-fighting) */ bx(g, W + 0.8, 0.6, 1.0, trim, 0, SC.storey - 0.1 + alt * 0.12, 0.32 + alt * 0.08); bx(g, W + 1.2, 0.9, 1.4, trim, 0, H - 0.2 + alt * 0.15, 0.47 + alt * 0.1);
  if (o.storeys !== 1 && o.balcony !== false) { const by = SC.storey + 0.3; bx(g, W * 0.55, 0.35, 2.4, trim, dx, by, 1.2); for (let i = 0; i <= 10; i++) bx(g, 0.12, 2.6, 0.12, o.rail || '#2a3a6a', dx - W * 0.27 + i * W * 0.054, by + 1.4, 2.3, { r: 0 }); bx(g, W * 0.55, 0.16, 0.2, o.rail || '#2a3a6a', dx, by + 2.75, 2.3, { r: 0 }); }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(W + 1.6, 0.8, Dp + 2), new THREE.MeshStandardMaterial({ map: TEX.roof(o.roof || '#c8502a', [3, 3]) })); roof.position.set(0, H + 0.6 + alt * 0.35, -Dp / 2 + 0.5 + alt * 0.25); roof.castShadow = true; g.add(roof);
  bx(g, 1.2, 0.6, 0.6, '#c0c4cc', -W / 2 + 1.2, SC.doorH + 1.2, 0.6); // lamp box
  return { group: g, door: d, W, H }; }
// ---------------- street (cobblestone, sidewalks, curb, lamps, trees, benches) ----------------
export function street(s, o = {}) { const g = new THREE.Group(); s.add(g); const L = o.len || 120;
  const road = new THREE.Mesh(new THREE.BoxGeometry(L, 0.3, 16), new THREE.MeshStandardMaterial({ map: TEX.cobble('#b8b4ae', [L / 8, 2]) })); road.position.set(0, -0.45, 16.25); road.receiveShadow = true; g.add(road);
  const walk = new THREE.Mesh(new THREE.BoxGeometry(L, 0.3, 8.25), new THREE.MeshStandardMaterial({ map: TEX.tiles('#e8e2d8', '#d8d0c4', [L / 4, 2]) })); walk.position.set(0, -0.15, 4.1); walk.receiveShadow = true; g.add(walk);
  bx(g, L, 0.4, 0.5, '#c8c4bc', 0, -0.15, 8.2, { r: 0.08 });
  const cols = [['#f2a4c8', '#3a8a5a'], ['#7ec8f0', '#2a5ab0'], ['#f6c25a', '#c83a2a'], ['#8fd47a', '#2a6ab0'], ['#f08a5a', '#2a8a8a'], ['#b89cf0', '#3a6a3a']]; const H_ = [];
  let x = -L / 2 + 2; let i = 0; while (x < L / 2 - 8) { const w = 13 + (i % 3) * 2; const [c, sh] = cols[(i + (o.seed || 0)) % cols.length]; H_.push(house(g, s, { x: x + w / 2, z: 0, w, color: c, shutters: sh, doorX: ((i % 2) ? -1 : 1) * (w * 0.18), night: o.night, flowers: i % 2 === 0, roof: ['#c8502a', '#a84a3a', '#d8603a'][i % 3], alt: i % 2 })); x += w; i++; }
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
    const PA = parts(A), PB = parts(B); for (let ia = 0; ia < PA.length; ia++) { _p.setFromObject(PA[ia]).expandByScalar(-0.05); for (let ib = 0; ib < PB.length; ib++) { _q.setFromObject(PB[ib]).expandByScalar(-0.05); if (_p.intersectsBox(_q)) { n++; if (n < 4) log(`LOG ATRAVESSA t=${t.toFixed(2)} ${A.name} x ${B.name} [peça ${PN[ia]} x ${PN[ib]}]`); break; } } } } return n; }
const PN = ['tronco', 'quadril', 'cabeça', 'braçoD', 'braçoE', 'antebraçoD', 'antebraçoE', 'mãoD', 'mãoE', 'coxaD', 'coxaE', 'canelaD', 'canelaE', 'péD', 'péE'];
// one call per frame before rendering: people x people, people x walls/doors/furniture, camera occlusion/framing
export function qa(t, s, cam, live, log = console.log) { if (!s.userData.zchecked) { s.userData.zchecked = true; const roots = new Set(live.map(c => c.root)); sceneCheck(s, { quiet: true, skip: m => { for (let p = m; p; p = p.parent) if (roots.has(p) || p.userData.dyn || p.userData.isChar) return true; return false; } }); }
  return charCheck(t, live, log) + obstacleCheck(t, s, live, log) + cameraCheck(t, s, cam, live, log) + flickerCheck(t, s, cam, log) + cameraInsideCheck(t, s, cam, log); }
// ---------------- STATIC SCENE QA (run once per set, before the storyboard): flicker + objects inside objects ----------------
// sceneCheck(scene) -> number of problems. Logs:
//   LOG CINTILACAO  two DIFFERENT meshes with coplanar, overlapping, same-facing faces (z-fighting = flicker), or nearly coplanar (< eps)
//   LOG ATRAVESSA_OBJETO  a mesh of one obstacle (obst) sunk into a mesh of another obstacle deeper than `pen` (furniture through a wall, prop inside prop)
// Skips sprites, transparent/additive/no-depth-write materials, polygonOffset decals and meshes with userData.noQA / noZ.
const _v3 = () => new THREE.Vector3();
function meshLabel(m) { const n = []; for (let o = m; o && n.length < 3; o = o.parent) if (o.name) n.push(o.name); const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox(); const z = g.boundingBox.getSize(new THREE.Vector3());
  const mt = Array.isArray(m.material) ? m.material[0] : m.material; return `${n.join('<') || 'mesh'}(${z.x.toFixed(2)}x${z.y.toFixed(2)}x${z.z.toFixed(2)} #${mt.color ? mt.color.getHexString() : '?'}${mt.map ? '+tex' : ''})`; }
const sameLook = (a, b) => { const x = Array.isArray(a.material) ? a.material[0] : a.material, y = Array.isArray(b.material) ? b.material[0] : b.material; return x === y || (x.color && y.color && x.color.equals(y.color) && x.map === y.map && (x.emissive?.equals?.(y.emissive) ?? true)); };
function qaMeshes(s, skip) { const out = []; s.updateMatrixWorld(true);
  s.traverseVisible(m => { if (!m.isMesh || m.isSprite || m.isInstancedMesh || m.userData.noQA || m.userData.noZ || (skip && skip(m))) return; const mt = Array.isArray(m.material) ? m.material[0] : m.material;
    if (!mt || mt.polygonOffset || mt.depthWrite === false || mt.depthTest === false || (mt.transparent && mt.opacity < 0.98) || mt.blending === THREE.AdditiveBlending || m.name === 'ceu' || m.name === 'espelho') return; out.push(m); }); return out; }
export function sceneCheck(s, o = {}) { const log = o.log || console.log, eps = o.eps ?? 0.006, pen = o.pen ?? 0.08, tag = o.tag || s.name || 'cena'; let n = 0;
  const M = qaMeshes(s, o.skip); const B = new Map(); const q = 30, dq = 0.02; const P = [_v3(), _v3(), _v3()], e1 = _v3(), e2 = _v3(), nn = _v3();
  // 1) z-fighting: hash every triangle by (normal, plane offset); compare triangles of different meshes in the same/adjacent bucket
  M.forEach((m, mi) => { const g = m.geometry, pos = g.attributes.position; if (!pos) return; const idx = g.index; const nt = idx ? idx.count / 3 : pos.count / 3; if (nt > 20000) return;
    const two = (Array.isArray(m.material) ? m.material[0] : m.material).side === THREE.DoubleSide;
    for (let t = 0; t < nt; t++) { for (let k = 0; k < 3; k++) P[k].fromBufferAttribute(pos, idx ? idx.getX(t * 3 + k) : t * 3 + k).applyMatrix4(m.matrixWorld);
      e1.subVectors(P[1], P[0]); e2.subVectors(P[2], P[0]); nn.crossVectors(e1, e2); const A = nn.length() / 2; if (A < 0.004) continue; nn.normalize();
      for (const sg of two ? [1, -1] : [1]) { const nx = nn.x * sg, ny = nn.y * sg, nz = nn.z * sg; const d = nx * P[0].x + ny * P[0].y + nz * P[0].z;
        const key = `${Math.round(nx * q)},${Math.round(ny * q)},${Math.round(nz * q)}`; const bd = Math.floor(d / dq);
        const rec = { mi, n: [nx, ny, nz], d, p: P.map(p => p.clone()) }; const k2 = key + '|' + bd; if (!B.has(k2)) B.set(k2, []); B.get(k2).push(rec); } } });
  const basis = nv => { const a = Math.abs(nv[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]; const u = new THREE.Vector3(...a).cross(new THREE.Vector3(...nv)).normalize(); const v = new THREE.Vector3(...nv).cross(u); return [u, v]; };
  const P2 = (tri, u, v) => tri.map(p => [p.dot(u), p.dot(v)]);
  const area2 = poly => { let a = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q2 = poly[(i + 1) % poly.length]; a += p[0] * q2[1] - q2[0] * p[1]; } return a / 2; };
  const clip = (subj, clipT) => { let out = subj; const cw = area2(clipT) < 0 ? -1 : 1; for (let i = 0; i < 3 && out.length; i++) { const a = clipT[i], b = clipT[(i + 1) % 3]; const inside = p => cw * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) > 1e-9; const inp = out; out = [];
      for (let k = 0; k < inp.length; k++) { const P_ = inp[k], Q = inp[(k + 1) % inp.length]; const pi = inside(P_), qi = inside(Q); if (pi) out.push(P_); if (pi !== qi) { const d1 = (b[0] - a[0]) * (P_[1] - a[1]) - (b[1] - a[1]) * (P_[0] - a[0]), d2 = (b[0] - a[0]) * (Q[1] - a[1]) - (b[1] - a[1]) * (Q[0] - a[0]); const tt = d1 / (d1 - d2); out.push([P_[0] + (Q[0] - P_[0]) * tt, P_[1] + (Q[1] - P_[1]) * tt]); } } } return out; };
  const PR = new Map();  // mesh pair -> { area, best:{a,p,n,d} }
  for (const [k2, L] of B) { const [key, bd] = k2.split('|'); const cand = [...L, ...(B.get(key + '|' + (+bd + 1)) || [])];
    for (let i = 0; i < L.length; i++) for (let j = 0; j < cand.length; j++) { const a = L[i], b = cand[j]; if (a.mi === b.mi || (j < L.length && j <= i)) continue;
      if (Math.abs(a.d - b.d) > eps) continue; if (a.n[0] * b.n[0] + a.n[1] * b.n[1] + a.n[2] * b.n[2] < 0.9995) continue; if (!o.strict && sameLook(M[a.mi], M[b.mi])) continue;
      const [u, v] = basis(a.n); const poly = clip(P2(a.p, u, v), P2(b.p, u, v)); if (poly.length < 3) continue; const ar = Math.abs(area2(poly)); if (ar < 1e-4) continue;
      const pk = a.mi < b.mi ? a.mi + ':' + b.mi : b.mi + ':' + a.mi; const c2 = poly.reduce((s2, p) => [s2[0] + p[0] / poly.length, s2[1] + p[1] / poly.length], [0, 0]);
      const nv = new THREE.Vector3(...a.n); const c = u.clone().multiplyScalar(c2[0]).addScaledVector(v, c2[1]).addScaledVector(nv, a.d);
      const r = PR.get(pk) || { area: 0, a: Math.min(a.mi, b.mi), b: Math.max(a.mi, b.mi), best: null, bestA: 0, dz: Math.abs(a.d - b.d) }; r.area += ar; if (ar > r.bestA) { r.bestA = ar; r.best = { p: c, n: nv }; } PR.set(pk, r); } }
  const spots = (s.userData.zspots = []); if (o.quiet && o.debug !== false) log(`LOG ZSCAN [${tag}] ${PR.size} pares coplanares`);
  for (const r of PR.values()) { if (r.area < (o.minArea ?? 0.01)) continue; n++; spots.push({ p: r.best.p, n: r.best.n, a: M[r.a], b: M[r.b], area: r.area, lab: `${meshLabel(M[r.a])} x ${meshLabel(M[r.b])}` });
    if (!o.quiet) log(`LOG CINTILACAO [${tag}] ${meshLabel(M[r.a])} x ${meshLabel(M[r.b])} area=${r.area.toFixed(3)} @${r.best.p.x.toFixed(2)},${r.best.p.y.toFixed(2)},${r.best.p.z.toFixed(2)} dz=${r.dz.toFixed(4)}`); }
  // 2) interpenetration between DIFFERENT obstacles (oriented boxes of their meshes, SAT penetration depth)
  const O = s.userData.obst || []; const obb = m => { const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox; const c = bb.getCenter(_v3()).applyMatrix4(m.matrixWorld);
    const e = m.matrixWorld.elements; const ax = [_v3().set(e[0], e[1], e[2]), _v3().set(e[4], e[5], e[6]), _v3().set(e[8], e[9], e[10])]; const sz = bb.getSize(_v3()); const h = [sz.x / 2 * ax[0].length(), sz.y / 2 * ax[1].length(), sz.z / 2 * ax[2].length()]; ax.forEach(a => a.normalize()); return { c, ax, h }; };
  const depth = (A, Bo) => { const axes = [...A.ax, ...Bo.ax]; for (const a of A.ax) for (const b of Bo.ax) { const c = _v3().crossVectors(a, b); if (c.lengthSq() > 1e-6) axes.push(c.normalize()); } let best = Infinity; const d = _v3().subVectors(Bo.c, A.c);
    for (const L of axes) { const ra = A.h.reduce((s2, h, i) => s2 + h * Math.abs(A.ax[i].dot(L)), 0), rb2 = Bo.h.reduce((s2, h, i) => s2 + h * Math.abs(Bo.ax[i].dot(L)), 0); const ov = ra + rb2 - Math.abs(d.dot(L)); if (ov <= 0) return 0; best = Math.min(best, ov); } return best; };
  const OM = O.filter(ob => !ob.dyn && !o.allowObst?.has(ob.name)).map(ob => { const ms = []; ob.obj.updateMatrixWorld(true); ob.obj.traverse(m => { if (m.isMesh && !m.userData.noQA) ms.push({ m, b: obb(m), box: new THREE.Box3().setFromObject(m) }); }); return { ob, ms }; });
  const thinAx = b => { const k = b.h.indexOf(Math.min(...b.h)); const big = b.h.filter((h, i) => i !== k); return b.h[k] <= 0.45 && big.every(h => h > 1.2) ? k : -1; }; // wall-like slab -> index of its thin axis
  const pairs = new Set();
  for (let i = 0; i < OM.length; i++) for (let j = i + 1; j < OM.length; j++) { const A = OM[i], Bo = OM[j]; if (A.ob.obj === Bo.ob.obj || A.ob.name === Bo.ob.name) continue; if (o.allowPair && o.allowPair(A.ob.name, Bo.ob.name)) continue;
    for (const a of A.ms) for (const b of Bo.ms) { if (!a.box.intersectsBox(b.box)) continue; const wa = thinAx(a.b), wb = thinAx(b.b); if (wa >= 0 && wb >= 0) continue; // wall x wall corners: fine
      let dp; if (wa >= 0 || wb >= 0) { const [W_, X_, k] = wa >= 0 ? [a.b, b.b, wa] : [b.b, a.b, wb]; const other = wa >= 0 ? Bo.ob.name : A.ob.name; if (/batente|porta|janela|door/i.test(other)) continue; const L = W_.ax[k]; const r = X_.h.reduce((s2, h, i) => s2 + h * Math.abs(X_.ax[i].dot(L)), 0); const c = X_.c.clone().sub(W_.c).dot(L);
        // object sunk into a wall is hidden; only a PUNCH-THROUGH (sticks out of the other face) or an object centred inside the wall is a bug
        if (depth(a.b, b.b) <= 0) continue; const lo = c - r, hi = c + r; dp = (lo < -W_.h[k] + 0.02 && hi > W_.h[k] - 0.02) ? Math.min(hi - W_.h[k], -W_.h[k] - lo) + 2 * W_.h[k] : Math.abs(c) < W_.h[k] ? 1 : 0; if (dp <= 0.05) continue; } else dp = depth(a.b, b.b);
      if (dp > pen) { const pk = i + ':' + j; if (pairs.has(pk)) continue; pairs.add(pk); n++;
      log(`LOG ATRAVESSA_OBJETO [${tag}] ${A.ob.name} x ${Bo.ob.name} prof=${dp.toFixed(2)} @${a.b.c.x.toFixed(1)},${a.b.c.y.toFixed(1)},${a.b.c.z.toFixed(1)} / ${b.b.c.x.toFixed(1)},${b.b.c.y.toFixed(1)},${b.b.c.z.toFixed(1)}`); } } }
  return n; }
// camera inside / grazing an object (near-plane clipping): call per frame with the scene obstacles
export function cameraInsideCheck(t, s, cam, log = console.log) { const O = s.userData.obst || []; let n = 0; const p = cam.getWorldPosition(_v3()); const m = cam.near + 0.25;
  for (const ob of O) { ob.obj.updateMatrixWorld(true); const box = ob.dyn ? new THREE.Box3().setFromObject(ob.obj) : (ob.box ||= new THREE.Box3().setFromObject(ob.obj)); if (box.distanceToPoint(p) < m && !box.isEmpty()) {
      let hit = false; ob.obj.traverse(me => { if (hit || !me.isMesh) return; const bb = new THREE.Box3().setFromObject(me); if (bb.distanceToPoint(p) < m) hit = true; }); if (hit) { n++; log(`LOG CAMERA_DENTRO t=${t.toFixed(2)} ${ob.name}`); } } } return n; }
// per frame: only the flicker spots the camera REALLY sees (facing it, inside the frame, not hidden behind something, big enough on screen)
const _rc = new THREE.Raycaster();
export function flickerCheck(t, s, cam, log = console.log, o = {}) { const S = s.userData.zspots; if (!S || !S.length) return 0; let n = 0; const cp = cam.getWorldPosition(_v3()); cam.updateMatrixWorld(true); const f = (o.hpx || 1920) / 2 / Math.tan(cam.fov * Math.PI / 360);
  for (const z of S) { const toC = cp.clone().sub(z.p); const dist = toC.length(); if (toC.dot(z.n) <= 0 || dist > (o.maxDist || 90)) continue; const nd = z.p.clone().project(cam); if (nd.z > 1 || Math.abs(nd.x) > 1 || Math.abs(nd.y) > 1) continue;
    const px = z.area * (f / dist) ** 2 * Math.abs(toC.normalize().dot(z.n)); if (px < (o.minPx || 40)) continue;
    _rc.set(cp, z.p.clone().sub(cp).normalize()); _rc.camera = cam; _rc.far = dist + 0.05; _rc.layers.mask = cam.layers.mask; const hit = _rc.intersectObject(s, true).find(h => h.object.visible && !h.object.isSprite && (!h.object.material || h.object.material.opacity > 0.5));
    if (!hit || (hit.object !== z.a && hit.object !== z.b && hit.distance < dist - 0.03)) continue; n++; if (!z.lastLog || Math.abs(z.lastLog - t) > 1) { z.lastLog = t; log(`LOG CINTILACAO_VISIVEL t=${t.toFixed(2)} ${z.lab} ~${Math.round(px)}px`); } } return n; }
