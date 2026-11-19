// GTA 6 side: Vice City / Ocean Drive at sunset, built in blocks but with GTA materials (smooth pastel concrete,
// asphalt, tinted glass, 3D neon tubes, palms, voxel cars) — clearly different from the Minecraft textures.
import * as THREE from 'three';

function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const cvTex = (w, h, draw, rep = [1, 1]) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 4; return t; };
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0, ...o });
function box(w, h, d, m, x, y, z, p) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; if (p) p.add(b); return b; }
const neonM = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
function tube(pts, c, r, p) { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(q => new THREE.Vector3(...q)), false, 'catmullrom', 0), Math.max(8, pts.length * 6), r, 8), neonM(c)); p.add(m); return m; }
// neon letters made of 3D tubes, stacked vertically (hotel sign) — simple stroke font
const STROKES = { H: [[[0, 0], [0, 1]], [[1, 0], [1, 1]], [[0, .5], [1, .5]]], O: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]], T: [[[0, 1], [1, 1]], [[.5, 1], [.5, 0]]], E: [[[1, 1], [0, 1], [0, 0], [1, 0]], [[0, .5], [.7, .5]]],
  L: [[[0, 1], [0, 0], [1, 0]]], R: [[[0, 0], [0, 1], [1, 1], [1, .5], [0, .5], [1, 0]]], P: [[[0, 0], [0, 1], [1, 1], [1, .5], [0, .5]]], I: [[[.5, 0], [.5, 1]]], C: [[[1, 1], [0, 1], [0, 0], [1, 0]]],
  A: [[[0, 0], [0, 1], [1, 1], [1, 0]], [[0, .5], [1, .5]]], V: [[[0, 1], [.5, 0], [1, 1]]], D: [[[0, 0], [0, 1], [.7, 1], [1, .7], [1, .3], [.7, 0], [0, 0]]], X: [[[0, 0], [1, 1]], [[0, 1], [1, 0]]], N: [[[0, 0], [0, 1], [1, 0], [1, 1]]],
  S: [[[1, 1], [0, 1], [0, .5], [1, .5], [1, 0], [0, 0]]], B: [[[0, 0], [0, 1], [.8, 1], [.8, .55], [0, .55], [1, .45], [1, 0], [0, 0]]], W: [[[0, 1], [.25, 0], [.5, .6], [.75, 0], [1, 1]]], K: [[[0, 0], [0, 1]], [[1, 1], [0, .5], [1, 0]]], G: [[[1, 1], [0, 1], [0, 0], [1, 0], [1, .5], [.5, .5]]] };
function neonWord(word, c, size, vertical, p) { const g = new THREE.Group(); p.add(g); [...word].forEach((ch, i) => { const S = STROKES[ch]; if (!S) return; const ox = vertical ? 0 : i * size * 1.4, oy = vertical ? -i * size * 1.35 : 0;
  S.forEach(st => tube(st.map(([x, y]) => [ox + (x - 0.5) * size * 0.75, oy + (y - 0.5) * size, 0]), c, size * 0.075, g)); }); return g; }

// cars: rounded-ish voxel bodies with chrome, glass, real wheels, head/tail lights; 'convertible' has open seats
export function car(p, x, z, ry, body, roof = body, style = 'classic') { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; p.add(g);
  const paint = std({ color: body, roughness: 0.22, metalness: 0.55 }), top = std({ color: roof, roughness: 0.3, metalness: 0.4 }), chrome = std({ color: '#d8dce4', roughness: 0.12, metalness: 0.95 }), glass = std({ color: '#1a2a40', roughness: 0.05, metalness: 0.7 }), tire = std({ color: '#111114', roughness: 0.9 }), dark = std({ color: '#1a1a1e', roughness: 0.6 });
  box(4.2, 0.5, 1.8, paint, 0, 0.6, 0, g); box(4.0, 0.14, 1.7, paint, 0, 0.9, 0, g); box(4.32, 0.14, 1.86, chrome, 0, 0.36, 0, g); box(0.05, 0.28, 1.2, dark, 2.11, 0.62, 0, g);
  for (const zz of [0.91, -0.91]) box(4.0, 0.04, 0.03, chrome, 0, 0.82, zz, g);
  if (style === 'classic') { box(2.1, 0.55, 1.6, top, -0.2, 1.24, 0, g); box(2.16, 0.42, 1.5, glass, -0.2, 1.2, 0, g); box(0.06, 0.42, 1.52, glass, 0.86, 1.2, 0, g).rotation.z = 0.3; }
  else if (style === 'sport') { box(1.8, 0.44, 1.5, glass, -0.4, 1.17, 0, g); box(1.6, 0.06, 1.55, top, -0.45, 1.41, 0, g); box(0.5, 0.06, 1.6, paint, -1.95, 1.05, 0, g); }
  else { // convertible: windshield frame, seats, dashboard, steering wheel
    const fr = box(0.06, 0.5, 1.6, chrome, 0.75, 1.2, 0, g); fr.rotation.z = 0.45; const ws = box(0.03, 0.44, 1.5, std({ color: '#9ac8e8', roughness: 0.02, metalness: 0.3, transparent: true, opacity: 0.35 }), 0.73, 1.2, 0, g); ws.rotation.z = 0.45; ws.castShadow = false;
    box(3.6, 0.1, 1.5, std({ color: '#e8dcc8', roughness: 0.7 }), -0.2, 0.92, 0, g); 
    const seat = std({ color: '#f2e8d8', roughness: 0.7 }); for (const zz of [0.52, -0.52]) { box(0.6, 0.18, 0.66, seat, -0.15, 1.0, zz, g); box(0.16, 0.7, 0.66, seat, -0.5, 1.3, zz, g); }
    box(0.3, 0.14, 1.5, dark, 0.5, 1.3, 0, g); const sw = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.03, 6, 16), dark); sw.position.set(0.4, 1.42, -0.52); sw.rotation.y = Math.PI / 2; sw.rotation.x = 0.0; sw.rotation.z = 0.5; g.add(sw); g.userData.seats = [new THREE.Vector3(-0.15, 1.09, -0.52), new THREE.Vector3(-0.15, 1.09, 0.52)]; }
  g.userData.wheels = [];
  for (const [dx, dz] of [[-1.35, 0.9], [1.35, 0.9], [-1.35, -0.9], [1.35, -0.9]]) { const w = new THREE.Group(); w.position.set(dx, 0.36, dz); g.add(w); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.3, 16), tire); t.rotation.x = Math.PI / 2; w.add(t); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.32, 8), chrome); c.rotation.x = Math.PI / 2; w.add(c); g.userData.wheels.push(w); }
  for (const dz of [-0.6, 0.6]) { box(0.06, 0.18, 0.34, neonM('#fff2c0'), 2.12, 0.66, dz, g); box(0.06, 0.14, 0.34, neonM('#ff2a2a'), -2.12, 0.68, dz, g); }
  g.traverse(o => { if (o.isMesh && o.castShadow !== false) o.castShadow = true; }); return g; }

// ---------- geometry buckets: every building piece is real geometry, merged per material (fast) ----------
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
class Bucket { constructor() { this.m = new Map(); }
  add(mat, geo, x, y, z, ry = 0, rx = 0, rz = 0) { const g = geo.clone(); const m4 = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz)); m4.setPosition(x, y, z); g.applyMatrix4(m4); if (!this.m.has(mat)) this.m.set(mat, []); this.m.get(mat).push(g); }
  box(mat, w, h, d, x, y, z, ry = 0, rx = 0, rz = 0) { this.add(mat, new THREE.BoxGeometry(w, h, d), x, y, z, ry, rx, rz); }
  cyl(mat, r, h, x, y, z, seg = 16, r2 = r) { this.add(mat, new THREE.CylinderGeometry(r, r2, h, seg), x, y, z); }
  build(parent, shadow = true) { for (const [mat, gs] of this.m) { const mesh = new THREE.Mesh(mergeGeometries(gs.map(g => g.index ? g.toNonIndexed() : g)), mat); mesh.castShadow = shadow && !mat.userData.noShadow; mesh.receiveShadow = true; parent.add(mesh); } } }

const glassDark = std({ color: '#1a2438', roughness: 0.08, metalness: 0.85 });
const litM = ['#ffd27a', '#ffbf6a', '#fff0c8', '#ff9ac8'].map(c => { const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.85, roughness: 0.4 }); return m; });
const litFar = ['#ffd27a', '#ffe8b0', '#9ad8ff'].map(c => new THREE.MeshStandardMaterial({ color: '#000', emissive: c, emissiveIntensity: 0.45 }));
const MCACHE = {}; const pm = (c, o = {}) => MCACHE[c + JSON.stringify(o)] || (MCACHE[c + JSON.stringify(o)] = std({ color: c, roughness: 0.82, ...o }));

// Miami art-deco building: plinth with lit shopfronts, window grid with frames + eyebrow ledges, pilasters,
// rounded corner tower with bands, stepped central fin with a vertical 3D neon sign, rooftop details, neon edges.
function decoBuilding(B, p, x, z, w, d, floors, pal, seed, sign, r) {
  const fh = 1.15, base = 1.4, H = base + floors * fh + 0.3; const wall = pm(pal[0]), trim = pm(pal[1], { roughness: 0.6 }), acc = pm(pal[2], { roughness: 0.6 }), dark = pm('#2a2a32');
  const f = z; // front plane
  B.box(wall, w, H, d, x, H / 2, f - d / 2);                                     // body
  B.box(acc, w + 0.1, base, d + 0.1, x, base / 2, f - d / 2 + 0.05);             // plinth
  // shopfronts (lit) + door
  const nShop = Math.max(2, Math.floor(w / 2.2));
  for (let k = 0; k < nShop; k++) { const sx = x - w / 2 + (k + 0.5) * w / nShop; B.box(r() < 0.75 ? litM[k % 2] : glassDark, w / nShop - 0.5, base - 0.45, 0.06, sx, base / 2 - 0.05, f + 0.03); B.box(trim, w / nShop - 0.35, 0.08, 0.12, sx, base - 0.3, f + 0.07); }
  // windows per floor with frames + eyebrows
  const cols = Math.max(3, Math.round((w - 1.2) / 1.05));
  for (let fl = 0; fl < floors; fl++) { const y = base + fl * fh + fh * 0.48;
    B.box(trim, w + 0.2, 0.08, 0.5, x, y + 0.48, f + 0.22);                       // eyebrow ledge
    for (let c = 0; c < cols; c++) { const wx = x - (w - 1.2) / 2 + (c + 0.5) * (w - 1.2) / cols; const lit = r() < 0.42;
      B.box(lit ? litM[(c + fl) % 3] : glassDark, 0.62, 0.62, 0.05, wx, y, f + 0.01);
      B.box(trim, 0.74, 0.06, 0.1, wx, y + 0.34, f + 0.04); B.box(trim, 0.74, 0.06, 0.1, wx, y - 0.34, f + 0.04); B.box(trim, 0.06, 0.74, 0.1, wx - 0.34, y, f + 0.04); B.box(trim, 0.06, 0.74, 0.1, wx + 0.34, y, f + 0.04); B.box(trim, 0.04, 0.62, 0.06, wx, y, f + 0.04); } }
  for (const px2 of [x - w / 2 + 0.25, x + w / 2 - 0.25]) B.box(acc, 0.35, H - base, 0.3, px2, base + (H - base) / 2, f + 0.12); // pilasters
  // rounded corner tower (left corner) with bands
  const cr = 1.0; B.cyl(wall, cr, H + 0.8, x - w / 2 + 0.6, (H + 0.8) / 2, f - 0.6, 20); for (let fl = 0; fl <= floors; fl++) B.cyl(trim, cr + 0.06, 0.08, x - w / 2 + 0.6, base + fl * fh, f - 0.6, 20);
  // stepped central fin (ziggurat crown)
  const fx = x + (sign ? w * 0.18 : 0); B.box(acc, 0.9, H + 1.6, 0.7, fx, (H + 1.6) / 2, f + 0.2); B.box(trim, 1.4, 0.3, 1.0, fx, H + 1.75, f + 0.1); B.box(acc, 0.6, 0.6, 0.5, fx, H + 2.2, f + 0.1);
  for (const sx of [-1, 1]) { B.box(wall, w * 0.22, 0.6, d * 0.6, fx + sx * (0.45 + w * 0.11), H + 0.3, f - d * 0.3); B.box(trim, w * 0.24, 0.1, d * 0.62, fx + sx * (0.45 + w * 0.11), H + 0.62, f - d * 0.3); }
  // rooftop: parapet, AC units, water tank
  B.box(pm('#6a6470', { roughness: 0.95 }), w - 0.1, 0.16, d - 0.1, x, H + 0.08, f - d / 2); for (const [ww, dd, ox, oz] of [[w + 0.1, 0.25, 0, 0.05], [w + 0.1, 0.25, 0, -d - 0.05], [0.25, d, -w / 2, -d / 2], [0.25, d, w / 2, -d / 2]]) B.box(trim, ww, 0.42, dd, x + ox, H + 0.21, f + oz); for (let k = 0; k < 2; k++) B.box(pm('#c8ccd4', { metalness: 0.5, roughness: 0.4 }), 0.7, 0.5, 0.6, x + w * 0.25 + k * 0.8, H + 0.43, f - d * 0.7);
  if (r() < 0.5) { B.cyl(pm('#8a7a6a'), 0.5, 0.9, x - w * 0.2, H + 1.2, f - d * 0.65, 12); for (const sx of [-1, 1]) B.box(dark, 0.06, 0.8, 0.06, x - w * 0.2 + sx * 0.35, H + 0.4, f - d * 0.65); }
  // neon: roof edge, corners, ground-floor band, vertical sign on the fin (3D tubes)
  const nc = sign ? sign.col : (seed % 2 ? '#ff4fb0' : '#3ae8ff'), nc2 = sign ? sign.col2 : (seed % 2 ? '#3ae8ff' : '#ff4fb0');
  tube([[x - w / 2, H + 0.22, f + 0.06], [x + w / 2, H + 0.22, f + 0.06]], nc, 0.04, p); tube([[x - w / 2 + 0.1, base + 0.02, f + 0.3], [x + w / 2 - 0.1, base + 0.02, f + 0.3]], nc2, 0.035, p);
  tube([[x + w / 2 + 0.02, 0.4, f + 0.02], [x + w / 2 + 0.02, H, f + 0.02]], nc, 0.035, p);
  if (sign) { const sz = Math.min(0.6, (H - 0.6) / (sign.word.length * 1.35)); const g = neonWord(sign.word, sign.col, sz, true, p); g.position.set(fx, H + 0.9 - sz * 0.5, f + 0.6); B.box(pm('#1a1a24'), sz * 0.95, sign.word.length * sz * 1.35 + 0.2, 0.08, fx, H + 0.9 - sign.word.length * sz * 0.675, f + 0.56); }
  // awning + cafe tables
  B.box(pm(pal[2]), w * 0.6, 0.08, 1.4, x, base + 0.05, f + 0.75, 0, 0.18);
  return H; }

function palmTree(B, x, z, h, r, mats) { const lean = (r() - 0.5) * 0.6, lz = (r() - 0.5) * 0.3; const n = 12;
  for (let i = 0; i < n; i++) { const k = i / n, k2 = (i + 1) / n; const px2 = x + lean * k * k * h * 0.35, pz = z + lz * k * k * h * 0.35; B.cyl(i % 2 ? mats.bark : mats.bark2, 0.17 - k * 0.05, h / n + 0.02, px2, (i + 0.5) * h / n, pz, 8, 0.19 - k * 0.05); }
  const tx = x + lean * h * 0.35, tz = z + lz * h * 0.35; B.cyl(mats.bark2, 0.22, 0.4, tx, h, tz, 8);
  for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2 + r() * 0.4; const L = 1.6 + r() * 0.8;
    for (let sgm = 0; sgm < 7; sgm++) { const t2 = sgm / 7; const dist = t2 * L; const droop = -0.15 - t2 * t2 * 1.1; const cx = tx + Math.sin(a) * dist, cz = tz + Math.cos(a) * dist, cy = h + 0.1 + droop * 0.9 + 0.25 * (1 - t2);
      const wdt = 0.55 * Math.sin(Math.PI * (0.15 + 0.85 * (1 - t2))) + 0.1; B.add(i % 3 ? mats.leaf : mats.leaf2, new THREE.BoxGeometry(wdt, 0.03, L / 7 + 0.05), cx, cy, cz, a, -0.35 - t2 * 0.9); } } }

export function buildCity(S) {
  const s = new THREE.Scene(); const g = new THREE.Group(); s.add(g); s.fog = new THREE.FogExp2('#8a5a9a', 0.0075); const B = new Bucket(); const r = rng(77);
  // sunset sky dome (sun over the sea, +z)
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec3 p; void main(){ float y = p.y; vec3 sd = normalize(vec3(0.25,0.06,1.0)); float sdn = max(0.0, dot(p, sd)); vec3 top = vec3(0.13,0.10,0.36), mid = vec3(0.86,0.30,0.60), hor = vec3(1.0,0.58,0.30); vec3 c = mix(hor, mid, smoothstep(-0.02,0.16,y)); c = mix(c, top, smoothstep(0.14,0.6,y)); c += vec3(1.0,0.55,0.25)*pow(sdn,8.0)*0.45 + vec3(1.0,0.8,0.5)*smoothstep(0.996,0.999,sdn)*2.0; c = mix(c, vec3(0.2,0.12,0.25), smoothstep(0.0,-0.2,y)); gl_FragColor = vec4(c,1.0); }' }));
  s.add(sky); S.skyMesh = sky;
  // road: dark asphalt, slightly wet (reflects neon via env map), markings, crosswalk, curbs
  const asph = cvTex(128, 128, (c, w, h) => { c.fillStyle = '#26252c'; c.fillRect(0, 0, w, h); const rr = rng(4); for (let i = 0; i < 4000; i++) { const v = 30 + rr() * 30; c.fillStyle = `rgba(${v},${v},${v + 6},0.5)`; c.fillRect(rr() * w, rr() * h, 1, 1); } }, [40, 2]);
  const road = new THREE.Mesh(new THREE.BoxGeometry(170, 0.1, 7), std({ map: asph, roughness: 0.32, metalness: 0.35, envMapIntensity: 1.2 })); road.position.y = -0.05; road.receiveShadow = true; g.add(road);
  const paint = pm('#e8d07a', { roughness: 0.5 }), white = pm('#e8e8ec', { roughness: 0.5 });
  for (let x2 = -80; x2 < 82; x2 += 3.2) B.box(paint, 1.6, 0.02, 0.1, x2, 0.01, 0); for (const zz of [-3.1, 3.1]) B.box(white, 170, 0.02, 0.1, 0, 0.01, zz);
  for (let k = 0; k < 9; k++) B.box(white, 0.5, 0.02, 6.2, -14 + k * 0.9, 0.012, 0);
  const curb = pm('#b8b0b8'); for (const zz of [-3.55, 3.55]) B.box(curb, 170, 0.22, 0.2, 0, 0.11, zz);
  // sidewalks (tile texture is fine-scale, reads as pavers)
  const pave = cvTex(64, 64, (c, w, h) => { c.fillStyle = '#d8a8b8'; c.fillRect(0, 0, w, h); c.fillStyle = '#c898a8'; for (let i = 0; i < 64; i += 16) for (let j = 0; j < 64; j += 16) if ((i + j) / 16 % 2) c.fillRect(i, j, 16, 16); c.strokeStyle = 'rgba(80,40,60,0.35)'; for (let i = 0; i <= 64; i += 16) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); } }, [85, 2]);
  const sw1 = new THREE.Mesh(new THREE.BoxGeometry(170, 0.2, 3.4), std({ map: pave, roughness: 0.6 })); sw1.position.set(0, 0.1, -5.3); sw1.receiveShadow = true; g.add(sw1);
  const sw2 = new THREE.Mesh(new THREE.BoxGeometry(170, 0.2, 3.6), std({ map: pave, roughness: 0.6 })); sw2.position.set(0, 0.1, 5.4); sw2.receiveShadow = true; g.add(sw2);
  // promenade wall + rail
  B.box(pm('#f2eee8'), 170, 0.6, 0.35, 0, 0.5, 7.3); B.box(pm('#3ab8d8', { metalness: 0.4, roughness: 0.4 }), 170, 0.08, 0.1, 0, 1.05, 7.3); for (let x2 = -84; x2 < 85; x2 += 1.4) B.box(pm('#3ab8d8', { metalness: 0.4 }), 0.06, 0.45, 0.06, x2, 0.82, 7.3);
  // beach (fine sand texture), lifeguard towers, umbrellas, loungers
  const sandT = cvTex(64, 64, (c, w, h) => { c.fillStyle = '#f4d8b0'; c.fillRect(0, 0, w, h); const rr = rng(8); for (let i = 0; i < 1800; i++) { c.fillStyle = rr() < 0.5 ? 'rgba(255,240,215,0.6)' : 'rgba(200,160,120,0.35)'; c.fillRect(rr() * w, rr() * h, 1, 1); } }, [60, 8]);
  const beach = new THREE.Mesh(new THREE.BoxGeometry(170, 0.1, 22), std({ map: sandT, roughness: 1 })); beach.position.set(0, 0.0, 18.4); beach.receiveShadow = true; g.add(beach);
  for (const [lx, lc] of [[-22, '#ff8ac8'], [9, '#3ae8ff'], [36, '#ffd23a']]) { const lz = 17; B.box(pm('#d8d0c8'), 0.12, 1.6, 0.12, lx - 0.8, 0.8, lz - 0.8); B.box(pm('#d8d0c8'), 0.12, 1.6, 0.12, lx + 0.8, 0.8, lz - 0.8); B.box(pm('#d8d0c8'), 0.12, 1.6, 0.12, lx - 0.8, 0.8, lz + 0.8); B.box(pm('#d8d0c8'), 0.12, 1.6, 0.12, lx + 0.8, 0.8, lz + 0.8);
    B.box(pm(lc), 2.2, 1.3, 2.0, lx, 2.25, lz); B.box(pm('#f2f2f2'), 2.5, 0.12, 2.3, lx, 1.55, lz); B.add(pm(lc), new THREE.CylinderGeometry(0.2, 1.7, 0.7, 4), lx, 3.25, lz, Math.PI / 4); B.box(pm('#1a2a3a', { metalness: 0.6, roughness: 0.2 }), 1.6, 0.6, 0.05, lx, 2.35, lz + 1.02);
    for (let k = 0; k < 6; k++) B.box(pm('#c8b8a8'), 0.6, 0.06, 0.25, lx, 0.2 + k * 0.25, lz - 1.3, 0, 0.6); }
  const umC = ['#ff5a6a', '#ffd23a', '#3ab8ff', '#ff8ac8'];
  for (let k = 0; k < 26; k++) { const ux = -70 + k * 5.6 + r() * 2, uz = 11 + r() * 8; if (Math.abs(ux) < 11 || Math.abs(ux - 9) < 3 || Math.abs(ux + 22) < 3 || Math.abs(ux - 36) < 3) continue; B.cyl(pm('#f2f2f2'), 0.04, 2.0, ux, 1.0, uz, 6); B.add(pm(umC[k % 4], { side: THREE.DoubleSide }), new THREE.ConeGeometry(1.2, 0.5, 10, 1, true), ux, 2.05, uz);
    B.box(pm('#f2f2f2'), 0.7, 0.08, 1.8, ux + 0.9, 0.3, uz + 0.4); B.box(pm('#f2f2f2'), 0.7, 0.08, 0.6, ux + 0.9, 0.5, uz - 0.4, 0, -0.6); }
  // sea with gentle waves + shore foam
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(500, 300, 160, 60), std({ color: '#2a6ab8', roughness: 0.06, metalness: 0.75, envMapIntensity: 1.4 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.05, 179); g.add(sea); S.sea = sea; S.seaBase = sea.geometry.attributes.position.array.slice();
  const foam = new THREE.Mesh(new THREE.BoxGeometry(170, 0.04, 0.6), new THREE.MeshStandardMaterial({ color: '#f2f6ff', transparent: true, opacity: 0.8, roughness: 0.6 })); foam.position.set(0, 0.03, 29.4); g.add(foam); S.foam = foam;
  // buildings
  const pals = [['#f6c4d6', '#ffffff', '#5ac8d8'], ['#bfe4f2', '#ffffff', '#ff8ab8'], ['#fff0d6', '#f2f2f2', '#ffb06a'], ['#ffd6b8', '#ffffff', '#3aa8c8'], ['#d6ccf6', '#ffffff', '#ff6ab0'], ['#c8f2e2', '#ffffff', '#ff8a9a'], ['#f2e6b8', '#ffffff', '#4a9ad8']];
  const signs = [['HOTEL', '#ff3ab0', '#3ae8ff'], ['TROPICO', '#3ae8ff', '#ff4fb0'], ['VICE', '#ff6ad8', '#ffe060'], ['COLONY', '#7affd8', '#ff4fb0'], ['CARLYLE', '#ffb34a', '#3ae8ff'], ['BREAKWATER', '#ff3ab0', '#7affd8'], ['DIXON', '#3ae8ff', '#ffb34a'], ['BOARDWALK', '#ff6ad8', '#3ae8ff']];
  let x = -78, i = 0; S.buildings = [];
  while (x < 78) { const w = 7 + r() * 3.5, d = 8 + r() * 3, fl = 3 + Math.floor(r() * 4); const sg = i % 2 === 0 ? (([a, b, c]) => ({ word: a, col: b, col2: c }))(signs[(i / 2) % signs.length]) : null;
    const Hh = decoBuilding(B, g, x + w / 2, -7.0, w, d, fl, pals[i % pals.length], i, sg, r); S.buildings.push([x + w / 2, w, Hh]); x += w + 0.35; i++; }
  const pole = pm('#2a2a32', { metalness: 0.7, roughness: 0.35 }), lampM = new THREE.MeshStandardMaterial({ color: '#fff2d0', emissive: '#ffd8a0', emissiveIntensity: 3 });
  // the rooftop used for close-ups: a signed building (even index) wide enough, near x=0; its sign spills light on the roof
  { let best = null; S.buildings.forEach((b, k) => { if (k % 2 === 0 && b[1] >= 8.8 && (!best || Math.abs(b[0] - 2) < Math.abs(best[0] - 2))) best = b; }); const [cx, w, H] = best; const fx = cx + w * 0.18;
    S.roof = { cx, w, H, y: H + 0.18, x: cx - w * 0.5 + 1.6 + (fx - 0.45 - w * 0.22 - (cx - w * 0.5 + 1.6)) / 2, z: -7.9, fx };
    const l = new THREE.PointLight('#ff6ad0', 9, 7, 1.6); l.position.set(fx - 0.6, H + 1.4, -6.2); g.add(l); const lx = S.roof.x + 1.4; B.cyl(pole, 0.05, 2.0, lx, H + 1.18, -8.9, 8); B.box(lampM, 0.3, 0.12, 0.3, lx, H + 2.2, -8.9); const l2 = new THREE.PointLight('#ffd9a0', 6, 7, 1.6); l2.position.set(lx, H + 2.0, -8.7); g.add(l2); }
  // second row (taller, behind) and downtown towers with glass + lit window strips (far away)
  for (let k = 0; k < 22; k++) { const tx = -80 + k * 7.6 + r() * 2, w = 6 + r() * 3, h = 8 + r() * 5; const tz = -20 - r() * 4; B.box(pm(pals[k % pals.length][0]), w, h, 6, tx, h / 2, tz); B.box(pm('#ffffff'), w + 0.2, 0.2, 6.2, tx, h, tz);
    const nc = Math.floor((w - 1) / 0.9); for (let fl = 0; fl < Math.floor((h - 2) / 1.3); fl++) for (let c = 0; c < nc; c++) B.box(r() < 0.35 ? litFar[(k + c) % 3] : glassDark, 0.5, 0.6, 0.05, tx - (nc - 1) * 0.45 + c * 0.9, 1.6 + fl * 1.3, tz + 3.01); }
  for (let k = 0; k < 26; k++) { const h = 16 + r() * 22, w = 5 + r() * 6; const tx = -110 + k * 9 + r() * 3, tz = -70 - r() * 40; const gm = pm(['#2a3a5a', '#3a3060', '#24324a'][k % 3], { metalness: 0.7, roughness: 0.18 }); B.box(gm, w, h, w, tx, h / 2, tz);
    for (let fl = 0; fl < Math.floor(h / 1.6); fl++) for (let c = 0; c < 4; c++) if (r() < 0.4) B.box(litFar[(k + fl) % 3], w * 0.18, 0.3, 0.05, tx - w * 0.33 + c * w * 0.22, 1 + fl * 1.6, tz + w / 2 + 0.02);
    if (r() < 0.45) tube([[tx - w / 2, h, tz + w / 2 + 0.05], [tx + w / 2, h, tz + w / 2 + 0.05]], ['#3ae8ff', '#ff4fb0', '#7affd8'][k % 3], 0.12, g); }
  { const fw = new THREE.Group(); fw.position.set(38, 15, -42); g.add(fw); fw.add(new THREE.Mesh(new THREE.TorusGeometry(9, 0.14, 8, 72), neonM('#ff6ad8'))); for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; tube([[0, 0, 0], [Math.cos(a) * 9, Math.sin(a) * 9, 0]], k % 2 ? '#7affd8' : '#ff6ad8', 0.06, fw); } S.ferris = fw; }
  // palms (promenade + inland sidewalk gaps)
  const pmats = { bark: pm('#7a5a3c', { roughness: 0.95 }), bark2: pm('#6a4a30', { roughness: 0.95 }), leaf: pm('#2f6e2c', { side: THREE.DoubleSide }), leaf2: pm('#3e8a34', { side: THREE.DoubleSide }) };
  for (let k = -78; k <= 78; k += 7.5) { if (k > -11 && k < 9) continue; palmTree(B, k + r(), 6.2 + r() * 0.4, 6 + r() * 2.5, r, pmats); }
  // streetlights (curved arm, lamp head) on both sides; real light pools near the action
  for (let k = -72; k <= 72; k += 12) for (const zz of [-3.9, 3.9]) { const sx = -Math.sign(zz); B.cyl(pole, 0.07, 4.6, k, 2.3, zz, 8, 0.1); B.box(pole, 0.08, 0.08, 1.2, k, 4.6, zz + sx * 0.55); B.box(lampM, 0.4, 0.12, 0.25, k, 4.5, zz + sx * 1.1); }
  S.lamps = []; for (const k of [-24, -12, 0, 12, 24]) for (const zz of [-3.9, 3.9]) { const l = new THREE.PointLight('#ffd09a', 10, 9, 1.7); l.position.set(k, 4.2, zz - Math.sign(zz) * 1.1); g.add(l); S.lamps.push(l); }
  // parked cars + moving traffic
  S.cars = [];
  [[-30, -2.45, 0, '#f2c43a', '#f2f2f2', 'classic'], [-20, -2.45, 0, '#4ab8ff', '#4ab8ff', 'sport'], [-8, -2.45, 0, '#d82a3a', '#d82a3a', 'sport'], [18, -2.45, 0, '#f2f2f2', '#f2f2f2', 'sport'], [30, -2.45, 0, '#3a8a5a', '#f2f2f2', 'classic'],
   [-38, 2.45, Math.PI, '#ff8ac8', '#f2f2f2', 'classic'], [-14, 2.45, Math.PI, '#2a2a40', '#2a2a40', 'sport'], [24, 2.45, Math.PI, '#f2c43a', '#f2f2f2', 'classic'], [40, 2.45, Math.PI, '#7a4aff', '#7a4aff', 'sport']].forEach(c => S.cars.push(car(g, ...c)));
  S.traffic = [[-0.9, '#ff6a3a', 'sport', 9, 0], [-0.9, '#3ae8c8', 'classic', 7, 60], [0.9, '#ffffff', 'sport', -8, 25], [0.9, '#ffb0d8', 'classic', -6.5, 90]].map(([zz, col, st, v, off]) => { const c = car(g, 0, zz, v > 0 ? 0 : Math.PI, col, st === 'classic' ? '#f2f2f2' : col, st); c.userData = { v, off, zz }; return c; });
  S.updateTraffic = t => S.traffic.forEach(c => { const u = c.userData; c.position.x = ((u.off + u.v * t) % 180 + 180) % 180 - 90; });
  B.build(g);
  // lights: warm low sun from the sea, soft sky fill, neon spill at street level
  const sun = new THREE.DirectionalLight('#ffb27a', 1.5); sun.position.set(12, 22, 60); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 30, bottom: -10, far: 160 }); sun.target.position.set(0, 0, -5); s.add(sun, sun.target); S.citySun = sun;
  s.add(new THREE.HemisphereLight('#7a6ad8', '#5a3a3a', 0.55));
  for (const [nx, c] of [[-30, '#ff4fb0'], [-12, '#3ae8ff'], [6, '#ff6ad8'], [22, '#3ae8ff'], [40, '#ff4fb0']]) { const l = new THREE.PointLight(c, 5, 8, 1.8); l.position.set(nx, 2.0, -5.9); g.add(l); }
  { const l = new THREE.PointLight('#ffb48a', 30, 14, 1.5); l.position.set(6, 3.2, -1.0); g.add(l); } // shop glow across the street lights the promenade side
  S.city = s; return s; }

// the SSD inside the console: dark hall, neon grid floor, 212 pedestals each holding a mini Minecraft world
export function buildSSD(S, blockMats) {
  const s = new THREE.Scene(); s.background = new THREE.Color('#05060e'); s.fog = new THREE.FogExp2('#05060e', 0.035); const g = new THREE.Group(); s.add(g);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), std({ color: '#0a0c18', roughness: 0.25, metalness: 0.6 })); floor.rotation.x = -Math.PI / 2; g.add(floor);
  const gm = neonM('#2a6aff'); for (let k = -40; k <= 40; k += 2) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.01, 160), gm); a.position.set(k, 0.005, -40); g.add(a); const b = new THREE.Mesh(new THREE.BoxGeometry(80, 0.01, 0.03), gm); b.position.set(0, 0.005, -k - 40); g.add(b); }
  const N = 212, cols = 12; const ped = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.5, 0.9), std({ color: '#1a1e30', metalness: 0.7, roughness: 0.3 }), N); const rim = new THREE.InstancedMesh(new THREE.BoxGeometry(0.96, 0.05, 0.96), neonM('#3ae8ff'), N);
  const top = new THREE.InstancedMesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), blockMats('grass'), N); const lg = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), blockMats('log'), N); const lv = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.26, 0.34), blockMats('leaves'), N);
  const P = []; for (let i = 0; i < N; i++) { const c = i % cols, rr = Math.floor(i / cols); P.push(new THREE.Vector3((c - (cols - 1) / 2) * 1.6, 0, -rr * 1.6)); }
  for (const m of [ped, rim, top, lg, lv]) { m.castShadow = true; g.add(m); }
  S.ssdP = P; S.ssd = s; S.ssdInst = { ped, rim, top, lg, lv };
  S.updateSSD = k => { const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(); const n = Math.round(k * N);
    P.forEach((p, i) => { const on = i < n ? 1 : 0.0001; const pop = i < n ? Math.min(1, (k * N - i) / 6) : 0; const e = 1 + 0.25 * Math.sin(Math.min(1, pop) * Math.PI);
      m4.compose(new THREE.Vector3(p.x, 0.25, p.z), q, sc.set(1, 1, 1)); ped.setMatrixAt(i, m4); m4.compose(new THREE.Vector3(p.x, 0.5, p.z), q, sc.set(1, 1, 1)); rim.setMatrixAt(i, m4);
      const s2 = on * e; m4.compose(new THREE.Vector3(p.x, 0.8 + 0.4 * (1 - Math.min(1, pop)), p.z), q, sc.set(s2, s2, s2)); top.setMatrixAt(i, m4);
      m4.compose(new THREE.Vector3(p.x + 0.12, 1.25, p.z + 0.1), q, sc.set(s2, s2, s2)); lg.setMatrixAt(i, m4); m4.compose(new THREE.Vector3(p.x + 0.12, 1.45, p.z + 0.1), q, sc.set(s2, s2, s2)); lv.setMatrixAt(i, m4); });
    for (const m of [ped, rim, top, lg, lv]) m.instanceMatrix.needsUpdate = true; return n; };
  // the 200k field: endless glowing micro-cubes
  const M = 42000; const field = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshStandardMaterial({ color: '#6aff8a', emissive: '#2aff6a', emissiveIntensity: 0.9 }), M); const rr = rng(5); const m4 = new THREE.Matrix4(); const FP = [];
  for (let i = 0; i < M; i++) { const a = rr() * Math.PI * 2, d = 3 + Math.pow(rr(), 0.6) * 90; FP.push([Math.cos(a) * d, Math.sin(a) * d - 40, rr()]); }
  field.userData.FP = FP; g.add(field); S.field = field;
  S.updateField = k => { const q = new THREE.Quaternion(), sc = new THREE.Vector3(); FP.forEach((p, i) => { const on = p[2] < k ? 1 : 0.0001; const y = 0.06 + (p[2] < k ? Math.max(0, 1 - (k - p[2]) * 30) * 6 : 0); m4.compose(new THREE.Vector3(p[0], y, p[1]), q, sc.set(on, on, on)); field.setMatrixAt(i, m4); }); field.instanceMatrix.needsUpdate = true; };
  s.add(new THREE.HemisphereLight('#8aa8ff', '#101020', 1.6)); const key = new THREE.SpotLight('#cfe0ff', 400, 40, 0.6, 0.6, 1.2); key.position.set(0, 14, 6); key.target.position.set(0, 0, -6); s.add(key, key.target);
  for (const [lx, c] of [[-8, '#ff4fb0'], [8, '#3ae8ff']]) { const l = new THREE.PointLight(c, 18, 18, 1.6); l.position.set(lx, 3, -10); s.add(l); }
  { const f = new THREE.PointLight('#cfe0ff', 30, 16, 1.4); f.position.set(0, 7, 9); s.add(f); }
  return s; }

// giant PS5 (voxel, white side wings, black core, blue light) + LED billboard screen in a real frame
export function buildPS5(S, parent) {
  const g0 = new THREE.Group(); parent.add(g0); S.ps5 = g0; const g = new THREE.Group(); g.rotation.y = Math.PI / 2; g0.add(g); const white = std({ color: '#f2f4fa', roughness: 0.35 }), black = std({ color: '#121218', roughness: 0.4, metalness: 0.3 }), blue = neonM('#3a6aff');
  g.rotation.y = 0; const H = 7.2; box(1.3, H, 3.8, black, 0, H / 2 + 0.3, -0.4, g);
  for (const sx of [-1, 1]) { const w = box(0.5, H + 0.5, 4.0, white, sx * 0.9, H / 2 + 0.35, -0.4, g); w.rotation.z = sx * 0.04; const st = box(0.08, H * 0.92, 0.08, blue, sx * 0.6, H / 2 + 0.35, 1.53, g); }
  for (let k = 0; k < 3; k++) box(0.9, 0.06, 0.04, std({ color: '#2a2a34', metalness: 0.6, roughness: 0.3 }), 0, 0.9 + k * 0.12, 1.52, g); // vents
  g0.rotation.y = 0.45;
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 0.3, 24), std({ color: '#c8ccd4', metalness: 0.8, roughness: 0.25 })); stand.position.y = 0.15; g.add(stand);
  // billboard
  const bb = new THREE.Group(); parent.add(bb); S.board = bb; const c = document.createElement('canvas'); c.width = 512; c.height = 384; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; S.boardCanvas = c; S.boardTex = tex;
  box(0.25, 7, 0.25, std({ color: '#2a2a30', metalness: 0.7 }), 0, 3.5, -0.2, bb); box(6.6, 5.0, 0.35, std({ color: '#1a1a20', metalness: 0.5 }), 0, 8.4, 0, bb);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 4.5), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.position.set(0, 8.4, 0.18); bb.add(scr);
  return g0; }
export function drawBoard(S, fill, label, warn) { const c = S.boardCanvas, g = c.getContext('2d'), W = c.width, H = c.height;
  const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#1a0e3a'); grd.addColorStop(1, '#3a0e3a'); g.fillStyle = grd; g.fillRect(0, 0, W, H);
  g.fillStyle = '#ffffff'; g.font = 'bold 34px "DejaVu Sans", sans-serif'; g.textAlign = 'center'; g.fillText('ARMAZENAMENTO', W / 2, 70);
  g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.strokeRect(40, 150, W - 80, 70); const k = Math.max(0, Math.min(1, fill)); const bar = g.createLinearGradient(40, 0, W - 40, 0); bar.addColorStop(0, '#3a6aff'); bar.addColorStop(0.6, '#ff4fb0'); bar.addColorStop(1, '#ff8a3a');
  g.fillStyle = warn ? '#ff2a3a' : bar; g.fillRect(46, 156, (W - 92) * k, 58); g.font = 'bold 64px "DejaVu Sans", sans-serif'; g.fillStyle = warn ? '#ff4a5a' : '#ffffff'; g.fillText(label, W / 2, 310);
  for (let y = 0; y < H; y += 3) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, y, W, 1); } S.boardTex.needsUpdate = true; }
