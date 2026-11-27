// EP02 sets (kit proportions: character 5.2, door 4.6×7.8, ceiling 12). Every solid thing is an obstacle for the QA.
import * as THREE from 'three';
import { SC, mat, bx, obst, canvasTex, TEX, textTex, wall, door, win, FURN, room, house, street, daylight, interiorLight, WORLD_FONT } from './kit.js';
import { fridge, cityHall, plaza, schoolFront, dragon } from './props.js';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// ---------- sky dome with animatable gradient (plaza time-lapse) ----------
export function skyDome(s, top = '#4a9ae8', bot = '#cfe8ff') { const u = { top: { value: new THREE.Color(top) }, bot: { value: new THREE.Color(bot) } };
  const m = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: u, vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top, bot; varying vec3 vP; void main(){ float k = smoothstep(-0.05, 0.55, vP.y); gl_FragColor = vec4(mix(bot, top, k), 1.0); }' })); m.name = 'ceu'; m.renderOrder = -10; s.add(m);
  m.set = (a, b) => { u.top.value.set(a); u.bot.value.set(b); }; s.userData.sky = m; return m; }
// clouds (low-poly puffs)
function clouds(s, list) { for (const [x, y, z, k] of list) { const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(k); s.add(g); for (const [px, py, r] of [[0, 0, 3], [3, -0.5, 2.3], [-3, -0.6, 2.2], [1.4, 1.2, 2.2]]) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat('#ffffff', { rough: 1 })); m.position.set(px, py, 0); g.add(m); } } }
// ---------- wall calendar: page flips (old page swings up around the top edge) ----------
const calCanvas = (day, num) => canvasTex(512, 640, (g, w, h) => { g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8342a'; g.fillRect(0, 0, w, 150); g.fillStyle = '#ffffff'; g.font = `900 92px ${WORLD_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = 92; while (g.measureText(day).width > w * 0.88) { fs -= 4; g.font = `900 ${fs}px ${WORLD_FONT}`; } g.fillText(day, w / 2, 80);
  g.fillStyle = '#1a1a22'; g.font = `900 300px ${WORLD_FONT}`; g.fillText(String(num), w / 2, 400); g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, h - 40, w, 40); });
export function calendar(p, x, y, z, ry = 0) { const g = new THREE.Group(); p.add(g); g.position.set(x, y, z); g.rotation.y = ry; bx(g, 3.0, 3.8, 0.12, '#c8a070', 0, 0, -0.05); const P = {};
  const mk = () => { const piv = new THREE.Group(); piv.position.set(0, 1.75, 0.04); g.add(piv); const m = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 3.4), new THREE.MeshStandardMaterial({ roughness: 0.9, side: THREE.DoubleSide })); m.position.y = -1.7; piv.add(m); return { piv, m }; };
  const back = mk(), front = mk(); front.piv.position.z = 0.07; for (const sx of [-0.8, 0, 0.8]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.04, 8, 16), mat('#888', { metal: 0.6 })); r.position.set(sx, 1.78, 0.1); g.add(r); }
  const tex = {}; const T = (d, n) => tex[d + n] ||= calCanvas(d, n);
  g.set = (oldD, oldN, newD, newN, k) => { back.m.material.map = T(newD, newN); back.m.material.needsUpdate = true; front.m.material.map = T(oldD, oldN); front.m.material.needsUpdate = true; front.piv.rotation.x = -Math.PI * 0.95 * k; front.m.visible = k < 0.999; };
  return g; }
// ---------- doodle of Bolota drawn progressively (notebook / wall / hand) ----------
export function doodle(o = {}) { const S = o.size || 512; const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; let last = -1;
  const draw = k => { k = Math.round(Math.min(1, Math.max(0, k)) * 60) / 60; if (k === last) return; last = k; g.clearRect(0, 0, S, S); if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, S, S); if (o.lines) { g.strokeStyle = 'rgba(80,120,200,0.35)'; g.lineWidth = S / 200; for (let y = S * 0.12; y < S; y += S * 0.075) { g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); } g.strokeStyle = 'rgba(220,60,60,0.5)'; g.beginPath(); g.moveTo(S * 0.12, 0); g.lineTo(S * 0.12, S); g.stroke(); } }
    g.lineCap = 'round'; g.lineJoin = 'round'; const cx = S / 2, cy = S * 0.52, R = S * 0.33; const seg = (a, b) => Math.min(1, Math.max(0, (k - a) / (b - a)));
    const c1 = seg(0, 0.45); if (c1 > 0) { if (o.fill) { g.globalAlpha = seg(0.4, 0.55) * 0.85; g.fillStyle = '#3a8ef0'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.globalAlpha = 1; } g.strokeStyle = o.ink || '#1a3a8a'; g.lineWidth = S * 0.028; g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * c1); g.stroke(); }
    const e = seg(0.45, 0.65); g.fillStyle = o.ink || '#1a3a8a'; for (const [s, a] of [[-1, 0.45], [1, 0.55]]) { const ee = seg(a, a + 0.1); if (ee > 0) { g.beginPath(); g.ellipse(cx + s * R * 0.35, cy - R * 0.2, R * 0.1 * ee, R * 0.15 * ee, 0, 0, 7); g.fill(); } }
    const m = seg(0.65, 0.85); if (m > 0) { g.beginPath(); g.arc(cx, cy, R * 0.5, 0.2 * Math.PI, 0.2 * Math.PI + 0.6 * Math.PI * m); g.stroke(); }
    const a = seg(0.85, 1); if (a > 0) for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * R, cy + R * 0.1); g.lineTo(cx + s * (R + R * 0.35 * a), cy + R * (0.1 + 0.3 * a)); g.stroke(); }
    t.needsUpdate = true; };
  draw(o.k ?? 0); return { tex: t, draw }; }
// ---------- math test paper: questions 1, 2, 3 ... and NO question 4 ----------
export function testPaper() { return canvasTex(768, 1024, (g, w, h) => { g.fillStyle = '#fbfaf4'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,120,200,0.3)'; g.lineWidth = 2; for (let y = 160; y < h; y += 56) { g.beginPath(); g.moveTo(40, y); g.lineTo(w - 40, y); g.stroke(); }
  g.fillStyle = '#1a1a22'; g.textAlign = 'center'; g.font = `900 78px ${WORLD_FONT}`; g.fillText('PROVA', w / 2, 100); g.textAlign = 'left'; g.font = `800 52px ${WORLD_FONT}`;
  const Q = ['1)  1 + 1 = ____', '2)  2 + 1 = ____', '3)  1 + 2 = ____']; Q.forEach((q, i) => g.fillText(q, 70, 280 + i * 168)); g.fillStyle = '#d83a3a'; g.font = `900 46px ${WORLD_FONT}`; g.fillText('FIM', w - 190, h - 90); }, [1, 1]); }
// ---------- simple cafeteria long table with two benches ----------
function longTable(p, s, x, z, o = {}) { const g = new THREE.Group(); p.add(g); g.position.set(x, 0, z); const L = o.len || 12, wood = o.wood || '#c89060';
  const top = bx(g, L, 0.25, 3.0, wood, 0, SC.table - 0.12, 0); for (const sx of [-1, 1]) bx(g, 0.35, SC.table - 0.25, 2.4, '#6a6a78', sx * (L / 2 - 0.8), (SC.table - 0.25) / 2, 0); if (s) obst(s, top, 'mesa');
  for (const sz of [-1, 1]) { const b = bx(g, L, 0.22, 1.3, o.bench || '#3a8ad8', 0, SC.seat - 0.11, sz * 2.45); for (const sx of [-1, 1]) bx(g, 0.25, SC.seat - 0.22, 1.0, '#6a6a78', sx * (L / 2 - 0.8), (SC.seat - 0.22) / 2, sz * 2.45); g.userData['bench' + (sz < 0 ? 'B' : 'F')] = b; }
  for (let k = 0; k < (o.trays ?? 0); k++) { const tx = -L / 2 + 1.5 + k * 2.6; bx(g, 1.6, 0.1, 1.1, ['#e8743a', '#3ab04a', '#f4c03a'][k % 3], tx, SC.table + 0.05, -0.6 * (k % 2 ? 1 : -1)); const ap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), mat('#d83a3a')); ap.position.set(tx + 0.4, SC.table + 0.3, -0.6 * (k % 2 ? 1 : -1)); g.add(ap); }
  return g; }
// ======================= build all sets =======================
export function buildSets() { const S = {};
  // ---- CITY STREET (day): pedestrian cobblestone street, people stand on the road (top at y=-0.3)
  { const s = new THREE.Scene(); skyDome(s); const sun = daylight(s, { sunPos: [-25, 50, 60] }); sun.shadow.camera.left = -60; sun.shadow.camera.right = 60; sun.shadow.camera.updateProjectionMatrix();
    s.userData.st = street(s, { len: 130, trees: [-46, 38], lamps: [-36, -14, 14, 36], seed: 2 }); clouds(s, [[-40, 60, -80, 2], [30, 70, -90, 2.4], [80, 55, -60, 1.8]]);
    // far end: houses closing the street on the right side of the road (so wide shots are never empty)
    const g = new THREE.Group(); s.add(g); g.position.set(0, -0.3, 34); g.rotation.y = Math.PI; let x = -60; let i = 0; while (x < 60) { const w = 14 + (i % 3) * 2; house(g, s, { x: x + w / 2, z: 0, w, color: ['#7ec8f0', '#f6c25a', '#b89cf0', '#f08a5a', '#8fd47a'][i % 5], shutters: ['#2a5ab0', '#c83a2a', '#3a6a3a'][i % 3], doorX: (i % 2 ? -1 : 1) * 2.4, roof: ['#c8502a', '#a84a3a'][i % 2] }); x += w; i++; }
    const fill = new THREE.Mesh(new THREE.BoxGeometry(130, 0.3, 10.5), new THREE.MeshStandardMaterial({ map: TEX.cobble('#c8c0b4', [16, 2]) })); fill.position.set(0, -0.45, 29.4); fill.receiveShadow = true; s.add(fill);
    S.street = s; }
  // ---- BEDROOM (day + night)
  for (const night of [false, true]) { const s = new THREE.Scene(); s.background = new THREE.Color(night ? '#0a1028' : '#bfe0ff');
    const wallTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#bcd8f0'; g.fillRect(0, 0, w, h); g.fillStyle = '#a8c8e8'; for (let i = 0; i < 4; i++) g.fillRect(i * 64, 0, 26, h); g.fillStyle = 'rgba(255,255,255,0.5)'; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.beginPath(); g.arc(x * 64 + 45, y * 64 + 32, 5, 0, 7); g.fill(); } }, [4, 2]);
    const r = room(s, { w: 28, d: 22, wallTex, floor: '#c08a5a', doors: [{ wall: 'right', x: 4, name: 'quarto', color: '#9a5a32' }], windows: [{ wall: 'back', x: 8.5, curtains: '#f4c03a', w: 4.2, h: 4.4 }], ceiling: true });
    const G = r.group; FURN.bed(G, s, 6.5, -7.6, 0, { quilt: '#e8743a' }); FURN.nightstand(G, s, 1.6, -9.6, 0, { lit: night }); FURN.rug(G, 2, 1, 10, 7, '#3a62d8', '#f4c03a');
    FURN.shelf(G, s, -11.6, -9.4, 0, { w: 3.4, h: 6.5, seed: 7 }); FURN.desk(G, s, -11.0, -1.5, Math.PI / 2, {}); FURN.chair(G, s, -8.6, -1.5, -Math.PI / 2, { color: '#3a8ad8' });
    // framed picture (rocket) on the back wall — the wall seen THROUGH Bolota
    const pic = canvasTex(256, 320, (g, w, h) => { g.fillStyle = '#20305a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff6b0'; for (let i = 0; i < 26; i++) { g.beginPath(); g.arc((i * 97) % w, (i * 61) % h, 2 + (i % 3), 0, 7); g.fill(); } g.fillStyle = '#e8e8f0'; g.beginPath(); g.moveTo(w / 2, 40); g.quadraticCurveTo(w / 2 + 55, 120, w / 2 + 40, 220); g.lineTo(w / 2 - 40, 220); g.quadraticCurveTo(w / 2 - 55, 120, w / 2, 40); g.fill();
      g.fillStyle = '#e8342a'; g.beginPath(); g.moveTo(w / 2, 40); g.quadraticCurveTo(w / 2 + 30, 70, w / 2 + 38, 100); g.lineTo(w / 2 - 38, 100); g.quadraticCurveTo(w / 2 - 30, 70, w / 2, 40); g.fill(); g.fillStyle = '#3aa8e8'; g.beginPath(); g.arc(w / 2, 150, 20, 0, 7); g.fill(); g.fillStyle = '#f4a03a'; g.beginPath(); g.moveTo(w / 2 - 30, 222); g.lineTo(w / 2, 300); g.lineTo(w / 2 + 30, 222); g.fill(); });
    bx(G, 3.6, 4.4, 0.18, '#f4f0e8', -2.5, 6.6, -10.62); const pm = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 3.9), new THREE.MeshStandardMaterial({ map: pic, roughness: 0.6 })); pm.position.set(-2.5, 6.6, -10.5); G.add(pm);
    s.userData.cal = calendar(G, -7.6, 6.8, -10.62); s.userData.clock = FURN.wallClock(G, 2.0, 9.6, -10.64, 0, { h: 7, m: 0 });
    // notebook on the desk + wall doodle surface (next to the picture)
    const nb = doodle({ bg: '#fbfaf4', lines: true }); const book = new THREE.Group(); G.add(book); book.position.set(-11.0, SC.table + 0.03, -1.6); bx(book, 1.9, 0.08, 1.5, '#e8342a', 0, 0, 0, { r: 0.02 }); const pg = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.35), new THREE.MeshStandardMaterial({ map: nb.tex, roughness: 0.9 })); pg.rotation.x = -Math.PI / 2; pg.rotation.z = -Math.PI / 2; pg.position.y = 0.05; book.add(pg); s.userData.nb = nb; s.userData.book = book;
    const wd = doodle({ ink: '#2a62d8', fill: true }); const wdm = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshStandardMaterial({ map: wd.tex, transparent: true, roughness: 0.9 })); wdm.position.set(-12.67, 5.6, 4.0); wdm.rotation.y = Math.PI / 2; G.add(wdm); s.userData.wd = wd;
    if (night) { const moon = new THREE.DirectionalLight('#8ab0ff', 1.3); moon.position.set(14, 18, -30); moon.target.position.set(4, 0, -4); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); s.add(moon, moon.target); s.add(new THREE.HemisphereLight('#3a4a8a', '#1a1a2a', 0.55));
      const lamp = new THREE.PointLight('#ffb870', 22, 14, 1.6); lamp.position.set(1.4, 3.6, -9.0); s.add(lamp); const fillL = new THREE.PointLight('#6a8ae8', 30, 30, 1.5); fillL.position.set(2, 9, 6); s.add(fillL); }
    else { interiorLight(s, { pos: [0, 10.4, 1], i: 140 }); const sun = new THREE.DirectionalLight('#fff0d0', 1.6); sun.position.set(18, 22, -30); sun.target.position.set(4, 0, -2); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); s.add(sun, sun.target); }
    s.userData.room = r; S[night ? 'bedN' : 'bed'] = s; }
  // ---- KITCHEN (fridge = Bolota's size)
  { const s = new THREE.Scene(); s.background = new THREE.Color('#bfe0ff'); const wallTex = TEX.tiles('#f6f0e0', '#eae2cc', [10, 5]);
    const r = room(s, { w: 26, d: 20, wallTex, floorTex: TEX.tiles('#e8e2d8', '#c84a3a', [8, 6]), windows: [{ wall: 'back', x: 7, curtains: '#e84a6a' }] }); const G = r.group;
    s.userData.fridge = fridge(G, s, -3.2, -8.2); { const cg = new THREE.Group(); G.add(cg); for (let k = 0; k < 2; k++) { const cx = 6.3 + k * 3.05; bx(cg, 3.0, 3.4, 2.6, '#f4f0e8', cx, 1.7, -8.6); bx(cg, 3.0, 0.2, 2.8, '#6a6a78', cx, 3.5, -8.5); for (const yy of [2.6, 1.0]) bx(cg, 2.4, 0.08, 0.1, '#a8acb4', cx, yy, -7.28); } obst(s, cg, 'balcão'); }
    for (let k = 0; k < 2; k++) bx(G, 3.0, 2.6, 1.6, '#f4f0e8', -9.0 + k * 3.05, 8.4, -9.8); FURN.wallClock(G, -9.8, 6.6, -10.64, 0, { h: 8, m: 15, rim: '#3a8ad8' }); FURN.table(G, s, 4, 1, 0, { cloth: '#e84a4a', w: 4.6, d: 3.0 });
    interiorLight(s, { pos: [0, 10.4, 2], i: 150 }); const sun = new THREE.DirectionalLight('#fff0d0', 1.2); sun.position.set(16, 22, -30); sun.target.position.set(0, 0, -4); s.add(sun, sun.target); S.kitchen = s; }
  // ---- CLASSROOM (math)
  { const s = new THREE.Scene(); s.background = new THREE.Color('#bfe0ff'); const r = room(s, { w: 32, d: 24, wall: '#f4e8c8', floor: '#b08a5a', windows: [{ wall: 'left', x: -2, w: 4, h: 4.4 }, { wall: 'left', x: 6, w: 4, h: 4.4 }], doors: [{ wall: 'right', x: -6, name: 'sala', color: '#3a8ad8' }] }); const G = r.group;
    FURN.board(G, -2, 6.6, -11.6, 0, { w: 9, h: 4.4, text: ['MATEMÁTICA', '1 + 2 = 3'] }); FURN.wallClock(G, 9, 8.6, -11.65, 0, { h: 10, m: 10 });
    const td = new THREE.Group(); G.add(td); td.position.set(6.5, 0, -6.5); bx(td, 5.4, 0.25, 2.6, '#9a6a3a', 0, SC.table - 0.12, 0); bx(td, 5.2, SC.table - 0.25, 0.2, '#7a4a2a', 0, (SC.table - 0.25) / 2, -1.1); for (const sx of [-1, 1]) bx(td, 0.25, SC.table - 0.25, 2.4, '#7a4a2a', sx * 2.5, (SC.table - 0.25) / 2, 0); obst(s, td, 'mesa da professora'); s.userData.tdesk = td;
    const apple = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), mat('#d83a3a')); apple.position.set(-1.8, SC.table + 0.3, 0.5); td.add(apple); for (let k = 0; k < 3; k++) bx(td, 1.2, 0.12, 1.6, ['#f4f4f0', '#e8e8e0', '#f4f4f0'][k], -0.6 + k * 0.08, SC.table + 0.06 + k * 0.12, 0.3, { r: 0.01 });
    for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) FURN.desk(G, s, -11 + col * 5.2, 0.5 + row * 4.6, 0, {});
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 3.0), new THREE.MeshStandardMaterial({ map: testPaper(), roughness: 0.9 })); paper.rotation.x = -Math.PI / 2; paper.position.set(-11 + 5.2, SC.table + 0.02, 0.5); G.add(paper); s.userData.paper = paper;
    const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8), mat('#f4c03a')); pen.rotation.set(0, 0, Math.PI / 2); pen.rotation.y = 0.5; pen.position.set(-11 + 5.2 + 1.2, SC.table + 0.06, 1.0); G.add(pen);
    interiorLight(s, { pos: [0, 10.4, 0], i: 170 }); const sun = new THREE.DirectionalLight('#fff0d0', 1.4); sun.position.set(-30, 20, 6); sun.target.position.set(0, 0, 0); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); s.add(sun, sun.target); s.userData.room = r; S.class = s; }
  // ---- CAFETERIA
  { const s = new THREE.Scene(); s.background = new THREE.Color('#bfe0ff'); const r = room(s, { w: 40, d: 28, wall: '#f8e8a8', floorTex: TEX.tiles('#f4f2ee', '#3a8ad8', [10, 7]), windows: [{ wall: 'left', x: 0, w: 4, h: 4.4 }, { wall: 'right', x: 4, w: 4, h: 4.4 }] }); const G = r.group;
    const ct = bx(G, 18, 3.4, 2.6, '#e8e4dc', 0, 1.7, -12.4); obst(s, ct, 'balcão'); bx(G, 18.4, 0.25, 2.9, '#a8acb4', 0, 3.5, -12.3); const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.8), new THREE.MeshStandardMaterial({ map: textTex('CANTINA', { bg: '#e8342a', color: '#ffffff', w: 1024, h: 200, size: 0.8 }) })); sign.position.set(0, 9.0, -13.65); G.add(sign);
    s.userData.tA = longTable(G, s, -2, 2, { len: 12, trays: 1 }); s.userData.tB = longTable(G, s, -6, -6.5, { len: 14, trays: 4, bench: '#e8743a' }); s.userData.tC = longTable(G, s, 14, -6.5, { len: 10, trays: 2, bench: '#3ab04a' });
    interiorLight(s, { pos: [0, 10.4, 0], i: 200 }); S.cafe = s; }
  // ---- SCHOOL (outside: facade + yard "pátio")
  { const s = new THREE.Scene(); skyDome(s, '#5aa8f0', '#d8f0ff'); const sun = daylight(s, { sunPos: [30, 55, 50] }); sun.shadow.camera.left = -50; sun.shadow.camera.right = 50; sun.shadow.camera.updateProjectionMatrix();
    const gr = new THREE.Mesh(new THREE.BoxGeometry(120, 0.2, 80), mat('#ffffff', { map: TEX.tiles('#d8d0c4', '#e4ddd2', [30, 20]) })); gr.position.set(0, -0.1, 20); gr.receiveShadow = true; s.add(gr);
    const court = new THREE.Mesh(new THREE.PlaneGeometry(26, 16), mat('#3a8a5a')); court.rotation.x = -Math.PI / 2; court.position.set(0, 0.01, 18); court.receiveShadow = true; s.add(court);
    const lines = canvasTex(512, 320, (g, w, h) => { g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20); g.beginPath(); g.moveTo(w / 2, 10); g.lineTo(w / 2, h - 10); g.stroke(); g.beginPath(); g.arc(w / 2, h / 2, 50, 0, 7); g.stroke(); });
    const ln = new THREE.Mesh(new THREE.PlaneGeometry(26, 16), new THREE.MeshStandardMaterial({ map: lines, transparent: true })); ln.rotation.x = -Math.PI / 2; ln.position.set(0, 0.02, 18); s.add(ln);
    s.userData.school = schoolFront(s, s, 0, -2); clouds(s, [[-30, 55, -70, 2], [40, 65, -80, 2.4]]);
    for (const tx of [-30, 30]) { const t = new THREE.Group(); s.add(t); t.position.set(tx, 0, 4); bx(t, 0.9, 6, 0.9, '#7a4a2a', 0, 3, 0); for (const [px, py, r] of [[0, 8, 3.4], [1.8, 6.6, 2.3], [-1.8, 6.8, 2.4]]) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat('#3ea84a', { rough: 0.8 })); m.position.set(px, py, 0); m.castShadow = true; t.add(m); } obst(s, t.children[0], 'árvore'); }
    for (const hx of [-14, 14]) { const hp = new THREE.Group(); s.add(hp); hp.position.set(hx, 0, 18); bx(hp, 0.35, 9, 0.35, '#e8e8e8', hx < 0 ? -1.2 : 1.2, 4.5, 0); bx(hp, 0.2, 2.6, 3.6, '#ffffff', hx < 0 ? -0.9 : 0.9, 9.2, 0); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.06, 8, 24), mat('#e8743a')); rim.rotation.x = Math.PI / 2; rim.position.set(hx < 0 ? 0 : 0, 8.4, 0); hp.add(rim); obst(s, hp.children[0], 'poste'); }
    // steps / low wall in front of the school (to sit on)
    const step = bx(s, 14, SC.seat, 1.6, '#e4ddd2', 12, SC.seat / 2, 3.2); obst(s, step, 'muretinha'); s.userData.step = step; S.school = s; }
  // ---- PLAZA with THE bench (recurring place) + time-lapse sky
  { const s = new THREE.Scene(); const sky = skyDome(s); const sun = daylight(s, { sunPos: [-30, 45, 45] }); s.userData.sun = sun; sun.shadow.camera.left = -45; sun.shadow.camera.right = 45; sun.shadow.camera.updateProjectionMatrix();
    s.userData.hemi = s.children.find(o => o.isHemisphereLight);
    const pz = plaza(s, { trees: [[-17, -4], [13, -10], [20, -15], [-27, -15], [24, 2]], lamps: [-15, 15], lampZ: 1, beds: [-24, 16], fx: -20, fz: -12 }); s.userData.pz = pz; s.userData.bench = pz.bench; clouds(s, [[-40, 55, -90, 2.2], [35, 62, -100, 2.6]]);
    const hg = new THREE.Group(); s.add(hg); hg.position.set(0, 0, -36); let x = -56, i = 0; while (x < 56) { const w = 14 + (i % 3) * 2; house(hg, s, { x: x + w / 2, z: 0, w, color: ['#f2a4c8', '#7ec8f0', '#f6c25a', '#8fd47a', '#f08a5a', '#b89cf0'][i % 6], shutters: ['#3a8a5a', '#2a5ab0', '#c83a2a'][i % 3], doorX: (i % 2 ? -1 : 1) * 2.4, flowers: true }); x += w; i++; }
    // plaza clock on a post (time-lapse "nem viu a hora passar")
    const cp = new THREE.Group(); s.add(cp); cp.position.set(7.5, 0, -3.5); bx(cp, 0.45, 10, 0.45, '#2a2a30', 0, 5, 0); bx(cp, 3.0, 3.0, 0.8, '#2a2a30', 0, 10.8, 0, { r: 0.3 }); obst(s, cp.children[0], 'relógio');
    s.userData.pclock = FURN.wallClock(cp, 0, 10.8, 0.45, 0, { r: 1.2, h: 3, m: 0, rim: '#f4c03a' }); s.userData.pclock2 = FURN.wallClock(cp, 0, 10.8, -0.45, Math.PI, { r: 1.2, h: 3, m: 0, rim: '#f4c03a' });
    s.userData.setTime = k => { // 0 = afternoon (blue) .. 1 = sunset (orange/pink)
      const c = (a, b) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString(); sky.set(c('#4a9ae8', '#5a4aa8'), c('#cfe8ff', '#ffa86a')); sun.color.set(c('#fff1dc', '#ffa060')); sun.intensity = 3.0 - 0.9 * k; sun.position.set(-30 - 20 * k, 45 - 25 * k, 45);
      s.userData.hemi.color.set(c('#cfe6ff', '#ffc8a8')); s.userData.hemi.intensity = 1.3 - 0.35 * k; }; s.userData.setTime(0); S.plaza = s; }
  // ---- CITY HALL + sleeping dragon on the roof
  { const s = new THREE.Scene(); skyDome(s, '#4a9ae8', '#d8eeff'); const sun = daylight(s, { sunPos: [-35, 60, 55] }); sun.shadow.camera.left = -50; sun.shadow.camera.right = 50; sun.shadow.camera.top = 50; sun.shadow.camera.far = 220; sun.shadow.camera.updateProjectionMatrix();
    const gr = new THREE.Mesh(new THREE.BoxGeometry(140, 0.2, 90), new THREE.MeshStandardMaterial({ map: TEX.cobble('#d8c8a8', [20, 13]) })); gr.position.set(0, -0.1, 10); gr.receiveShadow = true; s.add(gr);
    const ch = cityHall(s, s, 0, -6); s.userData.hall = ch; const dg = dragon(); dg.scale.setScalar(1.5); dg.position.set(0, ch.roofY, -13.5); s.add(dg); s.userData.dragon = dg; clouds(s, [[-50, 60, -90, 2.4], [45, 70, -100, 2.8]]);
    for (const tx of [-24, 24]) { const t = new THREE.Group(); s.add(t); t.position.set(tx, 0, 4); bx(t, 0.9, 6, 0.9, '#7a4a2a', 0, 3, 0); for (const [px, py, r] of [[0, 8, 3.4], [1.8, 6.6, 2.3], [-1.8, 6.8, 2.4]]) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat('#3ea84a', { rough: 0.8 })); m.position.set(px, py, 0); m.castShadow = true; t.add(m); } obst(s, t.children[0], 'árvore'); }
    S.hall = s; }
  return S; }
