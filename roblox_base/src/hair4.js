// ======================= HAIR v4 — Roblox catalog-style hair (smooth, glossy, THICK pointed locks) =======================
// Each hair = a smooth scalp cap + "lock sheets": closed, thick shells that follow the head (cylindrical coords around the
// head axis), split across their width into convex locks (ridges + creases) whose ends are POINTED (zig-zag edge), like the
// anime/catalog hair in the references. Paths are given as (r, y) control points; r is never allowed inside the head.
import * as THREE from 'three';
const HC = 0.66, HT = 1.27;
const hash = k => { const s = Math.sin(k * 91.17 + 7.3) * 43758.5453; return s - Math.floor(s); };
const sm = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
// minimum radius at height y that clears the classic head (rounded cylinder r 0.62, top rounded with radius 0.28)
export function headR(y) { const R = 0.62, E = 0.28, top = HT; if (y > top) return 0; if (y < top - E) return R; const k = (y - (top - E)) / E; return R - E + Math.sqrt(Math.max(0, 1 - k * k)) * E; }
const STRANDS = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 18; i++) { const x = (i * 37.3) % 256; g.fillStyle = `rgba(0,0,0,${0.025 + hash(i) * 0.035})`; g.fillRect(x, 0, 2 + hash(i + 3) * 3, 64); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; })();
const MATS = new Map();
export function hairMat(col) { if (!MATS.has(col)) MATS.set(col, new THREE.MeshPhysicalMaterial({ color: col, map: STRANDS, vertexColors: true, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.3, sheen: 0.4, sheenRoughness: 0.5, sheenColor: new THREE.Color(col).lerp(new THREE.Color('#ffffff'), 0.4), side: THREE.DoubleSide })); return MATS.get(col); }
function catmull(P, t) { const n = P.length - 1; const f = Math.min(n - 1e-6, Math.max(0, t * n)); const i = Math.floor(f), u = f - i; const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
  const u2 = u * u, u3 = u2 * u; return [0, 1].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3)); }
// sheet: o = { th0, th1 (angles), path: [[r,y],...] root->tip, locks, tip (0..1 pointiness), vary (length variation), bulge, thick, lift, sweep (radians added along length), outFlare }
export function lockSheet(o) { if (o.th1 < o.th0) { const t = o.th0; o.th0 = o.th1; o.th1 = t; } const NU = Math.max(24, o.locks * 10), NV = o.nv || 26; const L = o.locks; const pos = [], uv = [], col = [], idx = [];
  const P = o.path; const th = o.thick ?? 0.09, lift = o.lift ?? 0.05, bulge = o.bulge ?? 0.035;
  const vEnd = u => { const k = Math.min(L - 1, Math.floor(u * L)); const fr = u * L - k; const tri = 1 - Math.abs(2 * fr - 1); return 1 - (o.vary ?? 0.12) * hash(k + (o.seed || 0)) - (o.tip ?? 0.35) * (1 - Math.pow(tri, 0.85)); };
  const point = (u, v, inner) => { const th_ = o.th0 + (o.th1 - o.th0) * u + (o.sweep || 0) * sm(v) * (o.sweepEase === false ? 1 : 1); const k = Math.min(L - 1, Math.floor(u * L)); const fr = u * L - k;
    const [r0, y] = catmull(P, v); const ridge = Math.pow(Math.sin(Math.PI * fr), 0.55); const thick = th * (1 - 0.65 * v) * (0.55 + 0.45 * ridge);
    let r = Math.max(r0, headR(y) + lift) + bulge * ridge * (0.4 + 0.6 * Math.min(1, v * 3)) + (o.outFlare || 0) * v * v; if (inner) r -= thick;
    return [Math.sin(th_) * r, y, Math.cos(th_) * r]; };
  const add = (p, uu, vv, c) => { pos.push(...p); uv.push(uu * (o.uvRepeat || 3), vv); col.push(c, c, c); return pos.length / 3 - 1; };
  const grid = inner => { const base = pos.length / 3; for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const u = i / NU, ve = vEnd(u), v = (j / NV) * ve; const shade = (0.8 + 0.2 * sm(v * 4)) * (1 - 0.08 * sm((v - 0.75) * 4)); add(point(u, v, inner), u, v, inner ? shade * 0.75 : shade); } return base; };
  const A = grid(false), B = grid(true); const id = (b, i, j) => b + j * (NU + 1) + i;
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = id(A, i, j), b = id(A, i + 1, j), c = id(A, i, j + 1), d = id(A, i + 1, j + 1); idx.push(a, c, b, b, c, d);
    const a2 = id(B, i, j), b2 = id(B, i + 1, j), c2 = id(B, i, j + 1), d2 = id(B, i + 1, j + 1); idx.push(a2, b2, c2, b2, d2, c2); }
  // stitch the tip edge (j = NV) and the two side edges so the sheet is a closed, thick shell
  for (let i = 0; i < NU; i++) { const a = id(A, i, NV), b = id(A, i + 1, NV), c = id(B, i, NV), d = id(B, i + 1, NV); idx.push(a, c, b, b, c, d); }
  for (const i of [0, NU]) for (let j = 0; j < NV; j++) { const a = id(A, i, j), b = id(A, i, j + 1), c = id(B, i, j), d = id(B, i, j + 1); if (i === 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, c, b, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
// smooth cap over the scalp with a hairline: front edge at yF, side at yS, nape at yN
export function cap(yF = 1.02, yS = 0.72, yN = 0.42, lift = 0.035) { const pos = [], col = [], uv = [], idx = []; const NA = 64, NE = 18;
  for (let j = 0; j <= NE; j++) for (let i = 0; i <= NA; i++) { const a = -Math.PI + (i / NA) * Math.PI * 2; const fr = Math.cos(a); const yl = fr > 0.6 ? yF : fr > 0.1 ? yS + (yF - yS) * sm((fr - 0.1) / 0.5) : fr > -0.5 ? yN + (yS - yN) * sm((fr + 0.5) / 0.6) : yN;
    const y = yl + (HT + 0.06 - yl) * (j / NE); const r = (headR(Math.min(y, HT)) + lift) * (y > HT ? 0 : 1); const rr = j === NE ? 0 : r; pos.push(Math.sin(a) * rr, Math.min(y, HT + lift), Math.cos(a) * rr); col.push(0.86, 0.86, 0.86); uv.push(i / NA * 4, j / NE); }
  for (let j = 0; j < NE; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; }
// thick tapered tube lock (ponytails, spikes, pigtails): pts in head space, w0 -> w1 radius
export function tube(pts, r0, r1, flat = 0.8, tip = 0.3) { const curve = new THREE.CatmullRomCurve3(pts); const N = 24, R = 14; const pos = [], col = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) { const s = i / N; const p = curve.getPoint(s), T = curve.getTangent(s).normalize(); let nrm = new THREE.Vector3(0, 0, 1); if (Math.abs(T.z) > 0.9) nrm.set(1, 0, 0); const side = new THREE.Vector3().crossVectors(T, nrm).normalize(); nrm.crossVectors(side, T).normalize();
    const taper = s < 1 - tip ? 1 : Math.max(0.0, (1 - s) / tip); const w = (r0 + (r1 - r0) * s) * Math.pow(taper, 0.8); const shade = 0.82 + 0.18 * Math.min(1, s * 4);
    for (let j = 0; j < R; j++) { const a = j / R * Math.PI * 2; const q = p.clone().addScaledVector(side, Math.cos(a) * w).addScaledVector(nrm, Math.sin(a) * w * flat); pos.push(q.x, q.y, q.z); col.push(shade, shade, shade); uv.push(j / R * 2, s); } }
  for (let i = 0; i < N; i++) for (let j = 0; j < R; j++) { const a = i * R + j, b = i * R + (j + 1) % R, c = (i + 1) * R + j, d = (i + 1) * R + (j + 1) % R; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; }
export function ball(r, ws = 24, hs = 18) { const g = new THREE.SphereGeometry(r, ws, hs); const n = g.attributes.position.count; g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(n * 3).fill(0.95), 3)); return g; }
const M = (g, geo, col) => { const m = new THREE.Mesh(geo, hairMat(col)); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
const tie = (g, col, p, r = 0.1) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), new THREE.MeshStandardMaterial({ color: col, roughness: 0.35 })); m.position.copy(p); m.castShadow = true; g.add(m); return m; };
// ---------------- styles ----------------
const FR = (yTip) => [[0.12, HT + 0.07], [0.5, HT - 0.02], [0.69, 1.08], [0.73, yTip + 0.07], [0.75, yTip]];   // fringe path
const LONG = (yEnd, flare = 0.05) => [[0.1, HT + 0.07], [0.48, HT - 0.02], [0.7, 1.05], [0.74, 0.72], [0.76 + flare * 0.3, 0.3], [0.78 + flare * 0.6, -0.2], [0.8 + flare, yEnd]];
export const HAIR4 = {
  // long straight girl hair with straight pointed fringe + side locks framing the face (refs: "Única garota", sonâmbula)
  long: (g, c, c2, o = {}) => { M(g, cap(1.02, 0.6, 0.3), c);
    M(g, lockSheet({ th0: Math.PI * 0.42, th1: Math.PI * 1.58, path: LONG(o.yEnd ?? -0.9, 0.06), locks: 7, tip: 0.22, vary: 0.1, thick: 0.13, bulge: 0.06, lift: 0.06, seed: 1 }), c);
    M(g, lockSheet({ th0: -0.62, th1: 0.62, path: FR(o.fringe ?? 0.86), locks: 5, tip: 0.5, vary: 0.22, thick: 0.1, bulge: 0.06, lift: 0.05, seed: 3 }), c);
    for (const s of [-1, 1]) M(g, lockSheet({ th0: s * 0.62, th1: s * 1.32, path: LONG(o.side ?? -0.35, 0.02), locks: 3, tip: 0.3, vary: 0.1, thick: 0.1, bulge: 0.035, lift: 0.055, seed: 5 + s }), c2 || c);
    if (o.buns) for (const s of [-1, 1]) { const b = new THREE.Mesh(ball(0.26), hairMat(c)); b.position.set(s * 0.42, HT - 0.02, -0.12); b.scale.set(1, 0.9, 0.95); b.castShadow = true; g.add(b);
      if (o.tieCol) tie(g, o.tieCol, new THREE.Vector3(s * 0.52, HT - 0.12, 0.05), 0.07); } },
  // side/top ponytail with a big bow/ties, straight fringe, short side locks (ref: bunker blonde girl)
  ponytail: (g, c, c2, o = {}) => { M(g, cap(1.02, 0.66, 0.42), c);
    M(g, lockSheet({ th0: -0.7, th1: 0.7, path: FR(o.fringe ?? 0.88), locks: 5, tip: 0.52, vary: 0.22, thick: 0.1, bulge: 0.06, lift: 0.05, seed: 11 }), c);
    for (const s of [-1, 1]) M(g, lockSheet({ th0: s * 0.7, th1: s * 1.45, path: LONG(0.42, 0.0), locks: 2, tip: 0.3, thick: 0.09, lift: 0.05, seed: 13 + s }), c);
    M(g, lockSheet({ th0: Math.PI * 0.46, th1: Math.PI * 1.54, path: LONG(0.38, 0.0), locks: 8, tip: 0.25, vary: 0.08, thick: 0.08, lift: 0.05, seed: 15 }), c);
    const sx = o.side ?? 0.55; const root = new THREE.Vector3(sx * 0.7, HT - 0.02, -0.35);
    for (let k = 0; k < 4; k++) { const dz = (k - 1.5) * 0.07; M(g, tube([root.clone().add(new THREE.Vector3(0, 0, dz)), root.clone().add(new THREE.Vector3(sx * 0.38, 0.12, -0.12 + dz)), root.clone().add(new THREE.Vector3(sx * 0.62, -0.25, -0.18 + dz)), root.clone().add(new THREE.Vector3(sx * 0.6 - 0.05 * k, -0.75 - hash(k) * 0.15, -0.1 + dz))], 0.13, 0.1, 0.75, 0.45), k % 2 ? c : (c2 || c)); }
    if (o.tieCol !== null) { tie(g, o.tieCol || '#ff4a8a', root.clone().add(new THREE.Vector3(sx * 0.06, 0.06, 0.06)), 0.085); tie(g, o.tieCol || '#ff4a8a', root.clone().add(new THREE.Vector3(sx * 0.04, -0.05, 0.12)), 0.075); } },
  // two low pigtails with ties
  pigtails: (g, c, c2, o = {}) => { M(g, cap(1.02, 0.66, 0.42), c); { const cr = new THREE.Mesh(ball(0.5), hairMat(c)); cr.position.set(0, HT - 0.1, 0.0); cr.scale.set(1.3, 0.48, 1.3); cr.castShadow = true; g.add(cr); } M(g, lockSheet({ th0: -0.66, th1: 0.66, path: FR(o.fringe ?? 0.9), locks: 5, tip: 0.5, vary: 0.2, thick: 0.1, bulge: 0.06, lift: 0.05, seed: 21 }), c);
    M(g, lockSheet({ th0: Math.PI * 0.4, th1: Math.PI * 1.6, path: LONG(0.42, 0), locks: 9, tip: 0.2, thick: 0.08, lift: 0.05, seed: 23 }), c);
    for (const s of [-1, 1]) { const r = new THREE.Vector3(s * 0.66, 0.62, -0.18); for (let k = 0; k < 3; k++) M(g, tube([r, r.clone().add(new THREE.Vector3(s * 0.25, -0.15, -0.05 + k * 0.05)), r.clone().add(new THREE.Vector3(s * 0.32, -0.6, k * 0.06 - 0.06)), r.clone().add(new THREE.Vector3(s * 0.26, -1.0 - hash(k + s) * 0.15, k * 0.05))], 0.12, 0.09, 0.8, 0.45), c);
      tie(g, o.tieCol || '#ff4a8a', r.clone().add(new THREE.Vector3(s * 0.06, 0.02, 0.02)), 0.08); } },
  // chin-length bob with straight fringe
  bob: (g, c, c2, o = {}) => { M(g, cap(1.02, 0.6, 0.3), c); M(g, lockSheet({ th0: -0.66, th1: 0.66, path: FR(o.fringe ?? 0.9), locks: 5, tip: 0.4, vary: 0.18, thick: 0.1, bulge: 0.06, lift: 0.05, seed: 31 }), c);
    M(g, lockSheet({ th0: 0.62, th1: Math.PI * 2 - 0.62, path: LONG(0.2, 0.04), locks: 11, tip: 0.18, vary: 0.06, thick: 0.1, lift: 0.06, seed: 33 }), c); },
  // neat short boy hair, fringe swept to one side (ref: BrownNeatBoyHair, most boys)
  boy: (g, c, c2, o = {}) => { const sw = o.sweep ?? 0.35; M(g, cap(1.08, 0.78, 0.55), c);
    M(g, lockSheet({ th0: -0.75, th1: 0.75, path: FR(o.fringe ?? 1.0), locks: 4, tip: 0.55, vary: 0.22, thick: 0.12, bulge: 0.07, lift: 0.05, sweep: sw, seed: 41 }), c);
    M(g, lockSheet({ th0: 0.7, th1: Math.PI * 2 - 0.7, path: [[0.12, HT + 0.07], [0.5, HT - 0.02], [0.7, 1.04], [0.72, 0.72], [0.72, 0.56]], locks: 10, tip: 0.4, vary: 0.15, thick: 0.09, bulge: 0.04, lift: 0.05, seed: 43 }), c); },
  // spiky anime hair (refs: orange spiky boy) — tall pointed spikes swept back
  spiky: (g, c, c2, o = {}) => { HAIR4.boy(g, c, c2, { fringe: 0.98, sweep: 0.1 }); const out = [];
    for (let k = 0; k < 9; k++) { const a = -1.6 + k * 0.4 + (hash(k) - 0.5) * 0.2; if (Math.abs(a) < 0.3) continue; const base = new THREE.Vector3(Math.sin(a) * 0.45, HT - 0.06, Math.cos(a) * 0.45 - 0.1);
      const dir = new THREE.Vector3(Math.sin(a) * 0.5, 0.75, Math.cos(a) * 0.2 - 0.55).normalize(); const len = 0.38 + hash(k + 9) * 0.22;
      M(g, tube([base, base.clone().addScaledVector(dir, len * 0.5).add(new THREE.Vector3(0, 0.05, 0)), base.clone().addScaledVector(dir, len)], 0.17, 0.1, 0.75, 0.75), c); } },
  // classic "Bacon" swoop
  bacon: (g, c, c2, o = {}) => { HAIR4.boy(g, c, c2, { fringe: 0.95, sweep: 0.55 }); },
  // messy longer boy hair (ref: bunker boy "Fabi")
  messy: (g, c, c2, o = {}) => { M(g, cap(1.04, 0.62, 0.42), c); M(g, lockSheet({ th0: -0.8, th1: 0.8, path: FR(0.92), locks: 6, tip: 0.5, vary: 0.25, thick: 0.1, bulge: 0.05, lift: 0.05, sweep: -0.2, seed: 51 }), c);
    M(g, lockSheet({ th0: 0.7, th1: Math.PI * 2 - 0.7, path: LONG(0.3, 0.04), locks: 10, tip: 0.45, vary: 0.25, thick: 0.1, bulge: 0.05, lift: 0.055, outFlare: 0.08, seed: 53 }), c); },
  // grey older hair: thinner top, fuller sides
  old: (g, c, c2, o = {}) => { M(g, cap(1.14, 0.7, 0.5), c); M(g, lockSheet({ th0: -0.6, th1: 0.6, path: FR(1.1), locks: 4, tip: 0.35, thick: 0.07, lift: 0.04, sweep: 0.4, seed: 61 }), c);
    M(g, lockSheet({ th0: 0.6, th1: Math.PI * 2 - 0.6, path: [[0.12, HT + 0.06], [0.5, HT - 0.02], [0.7, 1.04], [0.74, 0.74], [0.74, 0.5]], locks: 9, tip: 0.35, thick: 0.1, bulge: 0.05, lift: 0.055, seed: 63 }), c); },
  // granny bun
  bun: (g, c, c2, o = {}) => { HAIR4.bob(g, c, c2, { fringe: 1.0 }); const b = new THREE.Mesh(ball(0.33), hairMat(c)); b.position.set(0, HT + 0.12, -0.34); b.scale.set(1, 0.88, 0.95); b.castShadow = true; g.add(b); },
};

// ======================= HAIR v5 — the catalog hairs he sent (Pal, Messy, Spiky, Bacon, Quiff, Long straight, Long wavy,
// Two-tone, Acorn bun, Space buns): layered lock sheets with a fine catalog STRAND texture, wavy ends, long hair draped OVER
// the shoulders (torso-clearance radius, never through the body) =======================
const STR5 = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 260; i++) { const x = hash(i * 3.1) * 512, w = 0.6 + hash(i + 1.7) * 1.8; const dark = hash(i + 9.2) < 0.7; g.strokeStyle = dark ? `rgba(0,0,0,${0.05 + hash(i + 2) * 0.12})` : `rgba(255,255,255,${0.08 + hash(i + 4) * 0.15})`; g.lineWidth = w; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (hash(i + 5) - 0.5) * 8, 90, x + (hash(i + 6) - 0.5) * 8, 170, x + (hash(i + 7) - 0.5) * 6, 256); g.stroke(); }
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(0,0,0,0.18)'); gr.addColorStop(0.25, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.05)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
const M5 = new Map(); function mat5(col) { if (!M5.has(col)) M5.set(col, new THREE.MeshPhysicalMaterial({ color: col, map: STR5, vertexColors: true, roughness: 0.48, clearcoat: 0.45, clearcoatRoughness: 0.35, sheen: 0.5, sheenRoughness: 0.45, sheenColor: new THREE.Color(col).lerp(new THREE.Color('#ffffff'), 0.2), side: THREE.DoubleSide })); return M5.get(col); }
// torso clearance (head space, neck at y≈0): hair below the neck must stay outside an ellipse around the chest/back
const torsoR = th => 1 / Math.sqrt((Math.sin(th) / 1.0) ** 2 + (Math.cos(th) / 0.62) ** 2) + 0.07;
export function lockSheet5(o) { if (o.th1 < o.th0) { const t = o.th0; o.th0 = o.th1; o.th1 = t; } const L = o.locks, NU = Math.max(30, L * 8), NV = o.nv || 34; const pos = [], uv = [], col = [], idx = [];
  const P = o.path, th = o.thick ?? 0.08, lift = o.lift ?? 0.05, bulge = o.bulge ?? 0.04, wave = o.wave || 0, wn = o.waves || 2.2;
  const vEnd = u => { const k = Math.min(L - 1, Math.floor(u * L)); const fr = u * L - k; const tri = 1 - Math.abs(2 * fr - 1); return 1 - (o.vary ?? 0.12) * hash(k * 1.7 + (o.seed || 0)) - (o.tip ?? 0.3) * (1 - Math.pow(tri, o.tipPow ?? 0.7)); };
  const point = (u, v, inner) => { const k = Math.min(L - 1, Math.floor(u * L)); const fr = u * L - k; const ph = hash(k + 3.3 + (o.seed || 0)) * 6.28;
    let th_ = o.th0 + (o.th1 - o.th0) * u + (o.sweep || 0) * sm(v) + wave * 0.5 * Math.sin(v * Math.PI * wn + ph) * v * v;
    const [r0, y] = catmull(P, v); const ridge = Math.pow(Math.sin(Math.PI * fr), 0.6); const thick = th * (1 - 0.6 * v) * (0.5 + 0.5 * ridge);
    let r = Math.max(r0, headR(y) + lift); const tb = sm((0.12 - y) / 0.35); if (tb > 0) r = Math.max(r, r * (1 - tb) + torsoR(th_) * tb);
    r += bulge * ridge * (0.4 + 0.6 * Math.min(1, v * 3)) + (o.outFlare || 0) * v * v + wave * 0.12 * Math.cos(v * Math.PI * wn * 1.3 + ph) * v * v; if (inner) r -= thick;
    return [Math.sin(th_) * r, y - (o.curlUp || 0) * Math.pow(Math.max(0, v - 0.85) / 0.15, 2) * -1, Math.cos(th_) * r]; };
  const cfn = o.colors; const add = (p, uu, vv, c) => { pos.push(...p); uv.push(uu * (o.uvRepeat || L * 0.6), vv); col.push(...c); return pos.length / 3 - 1; };
  const grid = inner => { const base = pos.length / 3; for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const u = i / NU, ve = vEnd(u), v = (j / NV) * ve; const k = Math.min(L - 1, Math.floor(u * L));
      const sh = (0.78 + 0.22 * sm(v * 5)) * (1 - 0.06 * sm((v - 0.8) * 5)) * (inner ? 0.72 : 1); const cc = cfn ? cfn(k, u) : [1, 1, 1]; add(point(u, v, inner), u, v, [cc[0] * sh, cc[1] * sh, cc[2] * sh]); } return base; };
  const A = grid(false), B = grid(true); const id = (b, i, j) => b + j * (NU + 1) + i;
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = id(A, i, j), b = id(A, i + 1, j), c = id(A, i, j + 1), d = id(A, i + 1, j + 1); idx.push(a, c, b, b, c, d); const a2 = id(B, i, j), b2 = id(B, i + 1, j), c2 = id(B, i, j + 1), d2 = id(B, i + 1, j + 1); idx.push(a2, b2, c2, b2, d2, c2); }
  for (let i = 0; i < NU; i++) { const a = id(A, i, NV), b = id(A, i + 1, NV), c = id(B, i, NV), d = id(B, i + 1, NV); idx.push(a, c, b, b, c, d); }
  for (const i of [0, NU]) for (let j = 0; j < NV; j++) { const a = id(A, i, j), b = id(A, i, j + 1), c = id(B, i, j), d = id(B, i, j + 1); if (i === 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, c, b, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
const S5 = (g, o, c) => { const m = new THREE.Mesh(lockSheet5(o), mat5(c)); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
const C5 = (g, c, a, b, cc) => { const m = new THREE.Mesh(cap(a, b, cc, 0.04), mat5(c)); m.castShadow = true; g.add(m); return m; };
const T5 = (g, c, pts, r0, r1, fl, tip) => { const m = new THREE.Mesh(tube(pts, r0, r1, fl, tip), mat5(c)); m.castShadow = true; g.add(m); return m; };
const B5 = (g, c, r, p, sc = [1, 1, 1]) => { const m = new THREE.Mesh(ball(r, 28, 20), mat5(c)); m.position.copy(p); m.scale.set(...sc); m.castShadow = true; g.add(m); return m; };
const rgb = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
// long hair paths (head space): crown -> over the head -> past the ear -> over the shoulder -> down the chest/back
const LONG5 = (yEnd, rEnd = 0.95) => [[0.08, HT + 0.08], [0.45, HT + 0.0], [0.68, 1.08], [0.74, 0.7], [0.8, 0.25], [0.9, -0.2], [rEnd, (yEnd - 0.2) / 2 - 0.1], [rEnd + 0.02, yEnd]];
const CURT5 = (yEnd) => [[0.1, HT + 0.08], [0.5, HT - 0.02], [0.7, 1.02], [0.74, 0.6], [0.76, 0.2], [0.8, -0.3], [0.82, yEnd]];
export const HAIR5 = {
  // long straight black hair, centre part, curtains framing the face, cut straight at the waist (ref 2679fb73)
  longStraight: (g, c, c2, o = {}) => HAIR5._long(g, c, c2, Object.assign({ yEnd: -2.3, wave: 0, tip: 0.05, vary: 0.04, flare: 0 }, o)),
  // long wavy light-blonde hair, layered wavy ends (ref 18904fc1)
  longWavy: (g, c, c2, o = {}) => HAIR5._long(g, c, c2, Object.assign({ yEnd: -2.0, wave: 0.32, tip: 0.13, vary: 0.1, flare: 0.14, locks: 9 }, o)),
  // two-tone brown with blonde "money piece" (ref e7607e1a)
  twoTone: (g, c, c2, o = {}) => HAIR5._long(g, c, c2, Object.assign({ yEnd: -1.8, wave: 0.25, tip: 0.12, vary: 0.1, flare: 0.12, locks: 9, hl: c2 || '#f0d8b0' }, o)),
  _long: (g, c, c2, o) => { C5(g, c, 1.06, 0.62, 0.3); const yE = o.yEnd; const base = { thick: 0.12, bulge: 0.015, lift: 0.06, wave: o.wave, waves: 2.3, tip: o.tip, vary: o.vary, tipPow: 0.8 };
    // top: from the centre part swept to each side, ending at the hairline (never over the face)
    for (const s of [-1, 1]) S5(g, { ...base, th0: s * 0.04, th1: s * 0.7, path: [[0.08, HT + 0.08], [0.5, HT + 0.02], [0.71, 1.1], [0.73, 1.0]], locks: 4, tip: 0.1, vary: 0.05, wave: 0, sweep: s * 0.35, seed: 5 + s }, c);
    // curtains beside the face (in front of the ears) falling over the shoulders onto the chest
    const hlc = o.hl ? rgb(o.hl) : null, bc = rgb(c);
    const CP = [[0.2, HT + 0.06], [0.62, HT - 0.06], [0.74, 1.0], [0.76, 0.5], [0.8, 0.0], [0.86, -0.5], [0.88, yE + 0.25]];
    for (const s of [-1, 1]) { if (o.hl) { S5(g, { ...base, th0: s * 0.66, th1: s * 0.88, path: CP, locks: 1, thick: 0.15, outFlare: o.flare * 0.6, seed: 8 + s }, o.hl); S5(g, { ...base, th0: s * 0.86, th1: s * 1.25, path: CP, locks: 2, thick: 0.14, outFlare: o.flare * 0.6, seed: 9 + s }, c); }
      else S5(g, { ...base, th0: s * 0.68, th1: s * 1.25, path: CP, locks: 3, thick: 0.14, outFlare: o.flare * 0.6, seed: 9 + s }, c); }
    // back mass (behind the shoulders) down to yEnd
    S5(g, { ...base, th0: Math.PI * 0.42, th1: Math.PI * 1.58, path: LONG5(yE, 0.95), locks: o.locks || 12, thick: 0.15, outFlare: o.flare, seed: 13 }, c); },
  // Pal Hair: thick layered swept locks over the forehead to one side, covering the ears, nape-length back (ref 0236fb1b)
  pal: (g, c, c2, o = {}) => { C5(g, c, 1.04, 0.62, 0.4);
    S5(g, { th0: -0.95, th1: 0.95, path: [[0.08, HT + 0.12], [0.5, HT + 0.06], [0.72, 1.1], [0.78, 0.84], [0.8, 0.74]], locks: 7, tip: 0.4, vary: 0.25, thick: 0.13, bulge: 0.06, lift: 0.07, sweep: 0.45, seed: 31 }, c);
    S5(g, { th0: 0.8, th1: Math.PI * 2 - 0.8, path: [[0.08, HT + 0.12], [0.5, HT + 0.06], [0.74, 1.0], [0.8, 0.6], [0.8, 0.3], [0.78, 0.18]], locks: 12, tip: 0.35, vary: 0.22, thick: 0.13, bulge: 0.06, lift: 0.07, outFlare: 0.06, seed: 33 }, c); },
  // Messy black emo hair: dozens of thin sharp locks pointing out and down, a few up on the crown (ref 0ba8502d)
  messy5: (g, c, c2, o = {}) => { C5(g, c, 1.0, 0.6, 0.38);
    for (let L = 0; L < 3; L++) S5(g, { th0: -Math.PI + L * 0.2, th1: Math.PI + L * 0.2, path: [[0.08, HT + 0.1 - L * 0.04], [0.48, HT + 0.04 - L * 0.06], [0.74, 1.06 - L * 0.1], [0.84 + L * 0.03, 0.72 - L * 0.1], [0.9 + L * 0.05, 0.55 - L * 0.12]], locks: 18 - L * 3, tip: 0.6, vary: 0.35, thick: 0.08, bulge: 0.04, lift: 0.06 + L * 0.02, outFlare: 0.12 + L * 0.05, seed: 41 + L * 7, tipPow: 0.5 }, c);
    for (let k = 0; k < 7; k++) { const a = -2.4 + k * 0.8 + hash(k) * 0.3; const b = new THREE.Vector3(Math.sin(a) * 0.3, HT + 0.05, Math.cos(a) * 0.3 - 0.1); const d = new THREE.Vector3(Math.sin(a) * 0.6, 0.5 + hash(k + 2) * 0.4, Math.cos(a) * 0.5).normalize(); T5(g, c, [b, b.clone().addScaledVector(d, 0.25), b.clone().addScaledVector(d, 0.48).add(new THREE.Vector3(0, -0.06, 0))], 0.1, 0.05, 0.35, 0.8); }
    // front fringe falling over the forehead (pointed)
    S5(g, { th0: -0.7, th1: 0.7, path: [[0.1, HT + 0.08], [0.55, HT - 0.02], [0.76, 1.02], [0.8, 0.86]], locks: 8, tip: 0.55, vary: 0.3, thick: 0.08, bulge: 0.04, lift: 0.07, sweep: 0.2, seed: 61, tipPow: 0.5 }, c); },
  // Short dark spiky swept back (ref 2d28f5a7)
  spiky5: (g, c, c2, o = {}) => { C5(g, c, 1.1, 0.72, 0.5);
    S5(g, { th0: -0.95, th1: 0.95, path: [[0.1, HT + 0.12], [0.5, HT + 0.12], [0.72, 1.18], [0.76, 1.08]], locks: 6, tip: 0.5, vary: 0.2, thick: 0.1, bulge: 0.04, lift: 0.07, sweep: -0.15, seed: 71 }, c);
    S5(g, { th0: 0.9, th1: Math.PI * 2 - 0.9, path: [[0.1, HT + 0.1], [0.5, HT + 0.06], [0.72, 1.0], [0.74, 0.68], [0.74, 0.55]], locks: 10, tip: 0.45, vary: 0.2, thick: 0.1, bulge: 0.04, lift: 0.06, seed: 73 }, c);
    for (let k = 0; k < 9; k++) { const a = Math.PI + (k - 4) * 0.32; const r0 = 0.2 + (k % 3) * 0.12; const b = new THREE.Vector3(Math.sin(a) * r0 * 0.6, HT + 0.08, -0.05 - (k % 3) * 0.12);
      const d = new THREE.Vector3(Math.sin(a) * 0.35, 0.55, Math.cos(a) * 0.75).normalize(); const L = 0.45 + hash(k) * 0.25; T5(g, c, [b, b.clone().addScaledVector(d, L * 0.5).add(new THREE.Vector3(0, -0.02, 0)), b.clone().addScaledVector(d, L)], 0.2, 0.12, 0.4, 0.75); } },
  // Bacon hair: puffy brown/ginger swoop, side part, locks over the right forehead, covering the ears (ref 5de7ccef)
  bacon5: (g, c, c2, o = {}) => { C5(g, c, 1.04, 0.62, 0.42);
    S5(g, { th0: -1.05, th1: 0.85, path: [[0.08, HT + 0.18], [0.5, HT + 0.16], [0.8, 1.12], [0.84, 0.86], [0.84, 0.76]], locks: 6, tip: 0.35, vary: 0.2, thick: 0.18, bulge: 0.09, lift: 0.1, sweep: 0.5, seed: 81 }, c);
    S5(g, { th0: 0.8, th1: Math.PI * 2 - 1.0, path: [[0.08, HT + 0.18], [0.55, HT + 0.12], [0.84, 0.96], [0.86, 0.55], [0.82, 0.35]], locks: 11, tip: 0.3, vary: 0.15, thick: 0.18, bulge: 0.08, lift: 0.1, outFlare: 0.04, seed: 83 }, c); },
  // Quiff: short sides, front swept up and back (ref e31eccc6)
  quiff5: (g, c, c2, o = {}) => { C5(g, c, 1.12, 0.78, 0.5);
    S5(g, { th0: 0.85, th1: Math.PI * 2 - 0.85, path: [[0.08, HT + 0.06], [0.5, HT - 0.02], [0.7, 1.0], [0.72, 0.72], [0.72, 0.58]], locks: 10, tip: 0.3, thick: 0.08, lift: 0.05, seed: 91 }, c);
    for (let k = 0; k < 6; k++) { const a = -0.5 + k * 0.2; const b = new THREE.Vector3(Math.sin(a) * 0.62, 1.12, Math.cos(a) * 0.62); T5(g, c, [b, b.clone().add(new THREE.Vector3(0.02, 0.22, 0.04)), b.clone().add(new THREE.Vector3(0.0, 0.36 + hash(k) * 0.1, -0.22)), b.clone().add(new THREE.Vector3(-0.02, 0.26, -0.62))], 0.17, 0.11, 0.35, 0.45); } },
  // Acorn: ginger messy top bun + loose strands framing the face, short bob around (ref dc9e08fc)
  acorn: (g, c, c2, o = {}) => { C5(g, c, 1.06, 0.6, 0.35);
    S5(g, { th0: -0.75, th1: 0.75, path: [[0.1, HT + 0.08], [0.55, HT - 0.02], [0.74, 1.02], [0.78, 0.86]], locks: 6, tip: 0.5, vary: 0.25, thick: 0.1, bulge: 0.05, lift: 0.06, sweep: 0.15, seed: 101 }, c);
    S5(g, { th0: 0.7, th1: Math.PI * 2 - 0.7, path: [[0.1, HT + 0.08], [0.55, HT - 0.02], [0.78, 0.95], [0.84, 0.45], [0.86, 0.22]], locks: 11, tip: 0.45, vary: 0.25, thick: 0.12, bulge: 0.06, lift: 0.07, outFlare: 0.1, seed: 103 }, c);
    B5(g, c, 0.38, new THREE.Vector3(0, HT + 0.22, -0.1), [1, 0.9, 1]); for (let k = 0; k < 6; k++) { const a = k * 1.05; const b = new THREE.Vector3(Math.cos(a) * 0.25, HT + 0.35, -0.1 + Math.sin(a) * 0.25); T5(g, c, [b, b.clone().add(new THREE.Vector3(Math.cos(a) * 0.14, 0.12, Math.sin(a) * 0.14)), b.clone().add(new THREE.Vector3(Math.cos(a) * 0.24, 0.04, Math.sin(a) * 0.24))], 0.07, 0.04, 0.45, 0.7); } },
  // Space buns: long blonde hair + two buns on top + small bows (ref e3ed3a0e)
  spaceBuns: (g, c, c2, o = {}) => { HAIR5.longWavy(g, c, c2, { yEnd: -1.6 }); for (const s of [-1, 1]) { B5(g, c, 0.3, new THREE.Vector3(s * 0.45, HT + 0.08, -0.05), [1, 0.92, 1]); if (o.bow !== false) B5(g, o.bowCol || '#8ad0f0', 0.09, new THREE.Vector3(s * 0.62, HT + 0.2, 0.12)); } },
};
