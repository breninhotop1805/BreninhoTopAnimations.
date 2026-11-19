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
  S.forEach(st => tube(st.map(([x, y]) => [ox + (x - 0.5) * size * 0.75, oy + (y - 0.5) * size, 0]), c, size * 0.06, g)); }); return g; }

// art-deco facade texture: pastel wall, window grid (some lit warm), dark horizontal bands
function facade(col, floors, cols, seed) { const r = rng(seed); return cvTex(cols * 16, floors * 16, (g, w, h) => {
  g.fillStyle = col; g.fillRect(0, 0, w, h); for (let i = 0; i < w * h / 40; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.05})`; g.fillRect(r() * w, r() * h, 2, 2); }
  for (let f = 0; f < floors; f++) for (let c2 = 0; c2 < cols; c2++) { const lit = r() < 0.55; g.fillStyle = lit ? (r() < 0.5 ? '#ffd68a' : '#ffbf6a') : '#2c3550'; g.fillRect(c2 * 16 + 4, f * 16 + 3, 8, 9); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(c2 * 16 + 4, f * 16 + 3, 8, 1); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(c2 * 16 + 7.5, f * 16 + 3, 1, 9); }
}); }
function decoBuilding(p, x, z, w, d, floors, col, trim, seed, sign) {
  const g = new THREE.Group(); g.position.set(x, 0, z); p.add(g); const fh = 1.05, H = floors * fh + 0.6; const cols = Math.max(2, Math.round(w / 1.2));
  const ft = facade(col, floors, cols, seed); const wall = std({ color: col, roughness: 0.85 }); const front = std({ map: ft, roughness: 0.8, emissive: '#ffffff', emissiveMap: ft, emissiveIntensity: 0.18 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, H, d), [wall, wall, wall, wall, front, wall]); b.position.set(0, H / 2, -d / 2); b.castShadow = b.receiveShadow = true; g.add(b);
  const tm = std({ color: trim, roughness: 0.6 });
  for (let f = 1; f <= floors; f++) box(w + 0.18, 0.1, 0.45, tm, 0, f * fh + 0.15, 0.2, g);                    // "eyebrow" ledges
  box(w * 0.4, 1.4, 0.5, std({ color: col }), 0, H + 0.7, -0.4, g); box(w * 0.4 + 0.2, 0.12, 0.6, tm, 0, H + 1.45, -0.4, g); // stepped parapet
  box(w * 0.7, 0.5, 0.4, std({ color: col }), 0, H + 0.25, -0.2, g);
  box(w + 0.3, 0.12, 1.4, std({ color: '#2a2440' }), 0, 1.25, 0.7, g);                                            // awning
  const ground = std({ color: '#ffd9a8', emissive: '#ffb060', emissiveIntensity: 0.6 }); box(w - 0.6, 0.9, 0.05, ground, 0, 0.6, 0.02, g);
  if (sign) { const fin = box(0.5, H * 0.75, 0.6, std({ color: trim }), w / 2 - 0.6, H * 0.55, 0.35, g); const s = neonWord(sign.word, sign.col, 0.42, true, g); s.position.set(w / 2 - 0.6, H * 0.85, 0.7); }
  const strip = neonWord('', '#fff', 1, false, g); tube([[-w / 2 + 0.1, 1.42, 0.45], [w / 2 - 0.1, 1.42, 0.45]], sign ? sign.col2 || '#3ae8ff' : '#ff4fb0', 0.035, g);
  for (const sx of [-1, 1]) tube([[sx * (w / 2 + 0.06), 0.3, 0.06], [sx * (w / 2 + 0.06), H, 0.06]], sign ? sign.col : '#ff4fb0', 0.03, g);
  tube([[-w / 2, H + 0.05, 0.08], [w / 2, H + 0.05, 0.08]], sign ? (sign.col2 || '#3ae8ff') : '#3ae8ff', 0.035, g);
  return g; }
function palm(p, x, z, h, r) { const g = new THREE.Group(); g.position.set(x, 0, z); p.add(g); const bark = std({ color: '#7a5a3c', roughness: 0.95 }); const lean = (r() - 0.5) * 0.5;
  for (let i = 0; i < 9; i++) { const k = i / 9; box(0.24 - k * 0.06, h / 9 + 0.02, 0.24 - k * 0.06, bark, lean * k * k * h * 0.4, (i + 0.5) * h / 9, 0, g); }
  const top = new THREE.Vector3(lean * 0.4 * h, h, 0); const leaf = std({ color: '#2f6a2a', roughness: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + r(); const f = new THREE.Group(); f.position.copy(top); f.rotation.y = a; g.add(f);
    for (let s = 0; s < 6; s++) { const seg = box(0.32 - s * 0.03, 0.04, 0.42, leaf, 0, -0.02 * s * s, 0.2 + s * 0.38, f); seg.rotation.x = 0.25 + s * 0.12; } }
  return g; }
function car(p, x, z, ry, body, roof = body, style = 'classic') { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; p.add(g);
  const paint = std({ color: body, roughness: 0.25, metalness: 0.5 }), top = std({ color: roof, roughness: 0.3, metalness: 0.4 }), chrome = std({ color: '#d8dce4', roughness: 0.15, metalness: 0.95 }), glass = std({ color: '#1a2a40', roughness: 0.05, metalness: 0.6 }), tire = std({ color: '#111114', roughness: 0.9 });
  box(4.2, 0.6, 1.8, paint, 0, 0.55, 0, g); box(4.25, 0.12, 1.85, chrome, 0, 0.32, 0, g);
  if (style === 'classic') { box(2.1, 0.55, 1.6, top, -0.2, 1.12, 0, g); box(2.0, 0.42, 1.62, glass, -0.2, 1.1, 0, g); box(4.0, 0.08, 0.9, chrome, 0, 0.88, 0, g).position.y = 0.86; }
  else { box(1.7, 0.42, 1.55, glass, -0.4, 1.02, 0, g); box(1.6, 0.06, 1.6, top, -0.4, 1.25, 0, g); }
  for (const [dx, dz] of [[-1.35, 0.9], [1.35, 0.9], [-1.35, -0.9], [1.35, -0.9]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.3, 14), tire); w.rotation.x = Math.PI / 2; w.position.set(dx, 0.36, dz); g.add(w); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.32, 10), chrome); c.rotation.x = Math.PI / 2; c.position.set(dx, 0.36, dz); g.add(c); }
  for (const dz of [-0.6, 0.6]) { box(0.06, 0.2, 0.3, neonM('#fff2c0'), 2.12, 0.6, dz, g); box(0.06, 0.16, 0.3, neonM('#ff2a2a'), -2.12, 0.62, dz, g); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }

export function buildCity(S) {
  const s = new THREE.Scene(); const g = new THREE.Group(); s.add(g); s.fog = new THREE.Fog('#b0609a', 70, 260);
  // sunset sky dome
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: {},
    vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec3 p; void main(){ float y = p.y; vec3 top = vec3(0.16,0.12,0.42), mid = vec3(0.95,0.32,0.58), hor = vec3(1.0,0.62,0.32); vec3 c = mix(hor, mid, smoothstep(0.0,0.14,y)); c = mix(c, top, smoothstep(0.12,0.55,y)); float sun = smoothstep(0.985,0.999, dot(p, normalize(vec3(-0.35,0.05,1.0)))); c += vec3(1.0,0.75,0.45)*sun*1.4 + vec3(1.0,0.5,0.3)*pow(max(0.0,dot(p, normalize(vec3(-0.35,0.05,1.0)))),40.0)*0.5; gl_FragColor = vec4(c,1.0); }' }));
  s.add(sky);
  // ground: asphalt road (x along), sidewalks, grass strip, beach, ocean
  const asphalt = cvTex(64, 64, (c, w, h) => { c.fillStyle = '#2a2a30'; c.fillRect(0, 0, w, h); const r = rng(4); for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${r() < 0.5 ? 255 : 0},${r() < 0.5 ? 255 : 0},255,${r() * 0.06})`; c.fillRect(r() * w, r() * h, 1, 1); } }, [60, 4]);
  box(160, 0.1, 7, std({ map: asphalt, roughness: 0.55, metalness: 0.15 }), 0, -0.05, 0, g);
  const dash = neonM('#f2c84a'); for (let x = -78; x < 80; x += 3) box(1.4, 0.02, 0.12, std({ color: '#e8c040', roughness: 0.6 }), x, 0.01, 0, g);
  for (const zz of [-3.4, 3.4]) box(160, 0.2, 0.25, std({ color: '#d8d0d8' }), 0, 0.1, zz, g);
  const pave = cvTex(32, 32, (c, w, h) => { c.fillStyle = '#e8b8c8'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(120,70,100,0.25)'; for (let i = 0; i <= 32; i += 8) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); } }, [80, 2]);
  box(160, 0.2, 3.2, std({ map: pave, roughness: 0.7 }), 0, 0.1, -5.1, g); box(160, 0.2, 3.0, std({ map: pave, roughness: 0.7 }), 0, 0.1, 5.0, g);
  box(160, 0.15, 3.5, std({ color: '#4a8a3a', roughness: 0.95 }), 0, 0.07, 8.2, g);                         // park strip (smooth, NOT a Minecraft block)
  box(160, 0.1, 16, std({ color: '#ffe4bc', roughness: 1 }), 0, 0.0, 17.9, g);                                 // beach sand (smooth)
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 260), std({ color: '#3a7ac8', roughness: 0.08, metalness: 0.55 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.08, 155); g.add(sea); S.sea = sea;
  // buildings along the inland side (fronts at z = -6.7)
  const r = rng(77); const pal = [['#ffc3d8', '#3ae8ff'], ['#bfe8ff', '#ff4fb0'], ['#fff2d8', '#ffb34a'], ['#ffd2b0', '#3ae8ff'], ['#d8c8ff', '#ff4fb0'], ['#c8ffe8', '#ff6ad8']];
  const signs = ['HOTEL', 'TROPICO', 'VICE', 'COLONY', 'BREAKWATER', 'CARLYLE'].map((w, i) => ({ word: w.replace(/[^A-Z]/g, ''), col: ['#ff3ab0', '#3ae8ff', '#ff6ad8', '#7affd8', '#ffb34a', '#ff3ab0'][i], col2: ['#3ae8ff', '#ff4fb0', '#ffe060', '#ff4fb0', '#3ae8ff', '#7affd8'][i] }));
  let x = -70; let i = 0; S.buildings = [];
  while (x < 70) { const w = 6 + r() * 4; const [c, t] = pal[i % pal.length]; const b = decoBuilding(g, x + w / 2, -6.7, w, 7 + r() * 3, 3 + Math.floor(r() * 4), c, t === '#3ae8ff' ? '#f2f2f2' : '#ffffff', 10 + i, i % 2 === 0 ? signs[(i / 2) % signs.length] : null); S.buildings.push(b); x += w + 0.4; i++; }
  // downtown skyline far behind (towers with lit windows)
  for (let k = 0; k < 26; k++) { const h = 18 + r() * 34, w = 5 + r() * 6; const tx = -90 + k * 7 + r() * 3, tz = -45 - r() * 40; const ft = facade(['#3a3a5a', '#4a3a6a', '#2a3a5a'][k % 3], Math.round(h / 1.4), Math.round(w / 1.2), 300 + k);
    const m = std({ map: ft, emissive: '#ffffff', emissiveMap: ft, emissiveIntensity: 0.55, roughness: 0.4, metalness: 0.3 }); box(w, h, w, m, tx, h / 2, tz, g); if (r() < 0.4) { const n2 = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.25, w + 0.1), neonM(['#3ae8ff', '#ff4fb0', '#7affd8'][k % 3])); n2.position.set(tx, h, tz); g.add(n2); } }
  // ferris wheel (neon tube ring + spokes) on the skyline
  { const fw = new THREE.Group(); fw.position.set(34, 16, -40); g.add(fw); const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 0.12, 8, 64), neonM('#ff6ad8')); fw.add(ring); for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; tube([[0, 0, 0], [Math.cos(a) * 9, Math.sin(a) * 9, 0]], k % 2 ? '#7affd8' : '#ff6ad8', 0.05, fw); } S.ferris = fw; }
  // palms + street lamps
  for (let k = -70; k <= 70; k += 6.5) { const x1 = k + r() * 1.2, x2 = k + 3 + r(); const r1 = r(), r2 = r(), h1 = r(), h2 = r(); if (Math.abs(x1) > 6) palm(g, x1, 4.4 + r1 * 0.6, 5.5 + h1 * 2.5, r); if (x2 < -10 || x2 > 9) palm(g, x2, 9.5 + r2 * 1.5, 6 + h2 * 2, r); }
  S.lamps = [];
  for (let k = -60; k <= 60; k += 12) { for (const zz of [-3.9, 3.9]) { box(0.12, 4.2, 0.12, std({ color: '#2a2a30', metalness: 0.7 }), k, 2.1, zz, g); const h2 = box(0.5, 0.12, 0.3, neonM('#ffe2b0'), k, 4.2, zz - Math.sign(zz) * 0.25, g); } }
  for (const k of [-24, -8, 8, 24]) { const l = new THREE.PointLight('#ffcf90', 14, 12, 1.6); l.position.set(k, 4.0, -3.6); g.add(l); S.lamps.push(l); }
  // parked cars along both curbs
  S.cars = [];
  [[-30, -2.4, 0, '#f2c43a', '#f2f2f2', 'classic'], [-20, -2.4, 0, '#4ab8ff', '#4ab8ff', 'sport'], [-6, -2.4, Math.PI, '#d82a3a', '#d82a3a', 'sport'], [14, -2.4, 0, '#f2f2f2', '#f2f2f2', 'sport'], [28, -2.4, 0, '#3a8a5a', '#f2f2f2', 'classic'],
   [-38, 2.4, Math.PI, '#ff8ac8', '#f2f2f2', 'classic'], [-14, 2.4, Math.PI, '#2a2a40', '#2a2a40', 'sport'], [20, 2.4, Math.PI, '#f2c43a', '#f2f2f2', 'classic'], [36, 2.4, Math.PI, '#7a4aff', '#7a4aff', 'sport']].forEach(c => S.cars.push(car(g, ...c)));
  // lights: low orange sun from the sea, purple sky fill, neon spill lights at street level
  const sun = new THREE.DirectionalLight('#ffb88a', 1.7); sun.position.set(-25, 42, 50); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 30, bottom: -10, far: 160 }); sun.target.position.set(0, 0, -5); s.add(sun, sun.target); S.citySun = sun;
  s.add(new THREE.HemisphereLight('#9a8aff', '#6a4a3a', 0.6));
  for (const [nx, c] of [[-40, '#ff4fb0'], [-12, '#3ae8ff'], [16, '#ff6ad8'], [44, '#3ae8ff']]) { const l = new THREE.PointLight(c, 18, 14, 1.6); l.position.set(nx, 2.5, -5.5); g.add(l); }
  S.city = s; return s; }

// giant PS5 (voxel, white side wings, black core, blue light) + LED billboard screen in a real frame
export function buildPS5(S, parent) {
  const g0 = new THREE.Group(); parent.add(g0); S.ps5 = g0; const g = new THREE.Group(); g.rotation.y = Math.PI / 2; g0.add(g); const white = std({ color: '#f2f4fa', roughness: 0.35 }), black = std({ color: '#121218', roughness: 0.4, metalness: 0.3 }), blue = neonM('#3a6aff');
  const H = 7.2; box(1.4, H, 4.6, black, 0, H / 2 + 0.3, 0.3, g);
  for (const sx of [-1, 1]) { const w = box(0.5, H + 0.5, 4.0, white, sx * 0.95, H / 2 + 0.35, -0.4, g); w.rotation.z = sx * 0.04; box(0.1, H, 0.1, blue, sx * 0.7, H / 2 + 0.35, 1.62, g); }
  for (let k = 0; k < 5; k++) box(2.4, 0.12, 4.9, black, 0, H * 0.55 + k * 0.22 - 0.4, 0.1, g).rotation.x = 0.0;
  { const band = box(4.4, 0.8, 0.1, black, 0, 4.3, 1.27, g0); band.rotation.z = -0.32; for (const dy of [0.75, -0.75]) { const l = box(4.4, 0.12, 0.1, black, 0, 4.3 + dy, 1.27, g0); l.rotation.z = -0.32; } const pl = box(0.12, H * 0.8, 0.12, blue, 2.15, H / 2, 1.0, g0); }
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
