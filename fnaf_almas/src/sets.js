// Voxel / pixel-art sets: hallway, stage, party room, office, studio, bedroom, void.
import * as THREE from 'three';
import { pixelTexture, voxelArt, extrudePixels } from './skin.js';

// deterministic RNG
export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export function canvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; draw(g, w, h); return c; }
function tex(c, rx = 1, ry = 1) { const t = pixelTexture(c); if (rx !== 1 || ry !== 1) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); } return t; }
export function std(opts) { return new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85, metalness: 0 }, opts)); }
export function box(w, h, d, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat.isMaterial ? mat : std({ color: mat }));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; if (parent) parent.add(m); return m;
}
function plane(w, h, mat, parent) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.receiveShadow = true; if (parent) parent.add(m); return m; }
const emis = (c, i = 1.6) => std({ color: c, emissive: c, emissiveIntensity: i });

// ---------- textures ----------
export const T = {};
function buildTextures() {
  T.checker = canvas(2, 2, g => { g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, 2, 2); g.fillStyle = '#141418'; g.fillRect(0, 0, 1, 1); g.fillRect(1, 1, 1, 1); });
  T.stars = (bg = '#1a1d4d', seed = 3) => canvas(64, 64, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); const r = rng(seed);
    const cols = ['#e8d36a', '#9fb6ff', '#ffffff', '#c58cff'];
    for (let i = 0; i < 26; i++) { const x = Math.floor(r() * 31) * 2, y = Math.floor(r() * 31) * 2; g.fillStyle = cols[i % 4]; g.globalAlpha = 0.55 + r() * 0.45;
      if (i % 3 === 0) { g.fillRect(x, y + 1, 3, 1); g.fillRect(x + 1, y, 1, 3); } else g.fillRect(x, y, 1, 1); }
    g.globalAlpha = 1; });
  T.hallWall = canvas(64, 64, (g, w, h) => {
    g.drawImage(T.stars('#1b1f4f', 7), 0, 0);
    // lower checker band
    for (let y = 44; y < 64; y += 4) for (let x = 0; x < 64; x += 4) { g.fillStyle = ((x + y) / 4) % 2 ? '#111' : '#eee'; g.fillRect(x, y, 4, 4); }
    g.fillStyle = '#c42a2a'; g.fillRect(0, 41, 64, 3); g.fillStyle = '#8a1a1a'; g.fillRect(0, 43, 64, 1);
  });
  T.bricks = canvas(32, 16, (g) => { g.fillStyle = '#6f6f78'; g.fillRect(0, 0, 32, 16); const r = rng(9);
    for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? -4 : 0; x < 32; x += 8) { g.fillStyle = `rgb(${120 + r() * 30 | 0},${120 + r() * 30 | 0},${132 + r() * 30 | 0})`; g.fillRect(x + 1, y + 1, 7, 3); } });
  T.wood = canvas(32, 32, (g) => { const r = rng(4); for (let y = 0; y < 32; y += 4) { const b = 90 + r() * 30 | 0; g.fillStyle = `rgb(${b + 40},${b - 5},${b - 40})`; g.fillRect(0, y, 32, 4); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, y + 3, 32, 1); g.fillRect((r() * 32) | 0, y, 1, 3); } });
  T.tablecloth = canvas(8, 8, g => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#f4f4f4' : '#d42a3a'; g.fillRect(x, y, 1, 1); } });
  T.wallpaper = canvas(16, 16, g => { g.fillStyle = '#5b4a8a'; g.fillRect(0, 0, 16, 16); g.fillStyle = '#6c5aa0'; for (let x = 0; x < 16; x += 4) g.fillRect(x, 0, 2, 16); g.fillStyle = '#e7c46a'; g.fillRect(1, 3, 1, 1); g.fillRect(9, 11, 1, 1); });
  T.officeWall = canvas(32, 32, g => { g.fillStyle = '#2e3446'; g.fillRect(0, 0, 32, 32); const r = rng(11); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(0,0,0,${0.1 + r() * 0.2})`; g.fillRect(r() * 32 | 0, r() * 32 | 0, 2, 2); }
    for (let y = 24; y < 32; y += 2) for (let x = 0; x < 32; x += 2) { g.fillStyle = ((x + y) / 2) % 2 ? '#15151a' : '#d8d8d8'; g.fillRect(x, y, 2, 2); } });
  T.banner = (text, bg, fg, w = 128, h = 20) => canvas(w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, h - 2, w, 2);
    g.font = `bold ${h - 6}px "DejaVu Sans Mono", monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillText(text, w / 2 + 1, h / 2 + 1); g.fillStyle = fg; g.fillText(text, w / 2, h / 2);
    // hard-threshold alpha so the text stays crisp pixels
    const d = g.getImageData(0, 0, w, h); g.putImageData(d, 0, 0); });
  T.drawing = (seed) => canvas(16, 16, g => { const r = rng(seed); g.fillStyle = '#f4f1e6'; g.fillRect(0, 0, 16, 16); const c = ['#e33', '#39f', '#fc3', '#3b5', '#a5f'][seed % 5];
    g.fillStyle = c; g.fillRect(4, 3, 8, 7); g.fillStyle = '#222'; g.fillRect(6, 5, 1, 1); g.fillRect(9, 5, 1, 1); g.fillRect(6, 8, 4, 1); g.fillStyle = c; g.fillRect(5, 10, 6, 4); g.fillRect(3, 11, 2, 1); g.fillRect(11, 11, 2, 1); });
}

// ---------- reusable props ----------
function bunting(parent, x0, x1, y, z, sag = 0.35, seed = 1, axis = 'x') {
  const cols = ['#e83a3a', '#f2c230', '#36b34a', '#3a78e8', '#b048e0'];
  const n = Math.max(3, Math.round(Math.abs(x1 - x0) / 0.45));
  for (let i = 0; i <= n; i++) {
    const u = i / n, p = x0 + (x1 - x0) * u, yy = y - Math.sin(u * Math.PI) * sag;
    const flag = voxelArt(['xxxx', 'xxxx', '.xx.', '.xx.'], { x: cols[(i + seed) % 5] }, 0.06, 0.03);
    if (axis === 'x') flag.position.set(p, yy - 0.12, z); else { flag.position.set(z, yy - 0.12, p); flag.rotation.y = Math.PI / 2; }
    parent.add(flag);
  }
}
function stringLights(parent, x0, x1, y, z, sag, seed) {
  const n = Math.round(Math.abs(x1 - x0) / 0.35); const m = emis('#fff3c0', 2.2);
  for (let i = 0; i <= n; i++) { const u = i / n; box(0.07, 0.07, 0.07, m, x0 + (x1 - x0) * u, y - Math.sin(u * Math.PI) * sag, z, parent).castShadow = false; }
}
function partyHat(col, parent, x, y, z) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.32, 4), std({ color: col, roughness: 0.6 })); m.position.set(x, y + 0.16, z); m.rotation.y = Math.PI / 4; m.castShadow = true; parent.add(m);
  box(0.05, 0.05, 0.05, '#fff', x, y + 0.33, z, parent); return m;
}
function table(parent, x, z, len = 2.4) {
  const cloth = std({ map: tex(T.tablecloth, len * 2, 2) });
  box(len, 0.08, 1.0, cloth, x, 0.78, z, parent);
  box(len, 0.25, 1.02, std({ map: tex(T.tablecloth, len * 2, 0.3) }), x, 0.66, z, parent);
  for (const dx of [-len / 2 + 0.15, len / 2 - 0.15]) box(0.12, 0.7, 0.12, '#5a5a62', x + dx, 0.35, z, parent);
  const r = rng(Math.abs(x * 13 + z * 7) | 0); const cols = ['#e83a3a', '#36b34a', '#3a78e8', '#f2c230', '#b048e0'];
  for (let i = 0; i < 4; i++) partyHat(cols[(i + (r() * 5 | 0)) % 5], parent, x - len / 2 + 0.35 + i * (len - 0.7) / 3, 0.82, z + (r() - 0.5) * 0.5);
}
function floor(parent, w, d, x = 0, z = 0, tile = 0.5, rough = 0.3) {
  const m = plane(w, d, std({ map: tex(T.checker, w / (tile * 2), d / (tile * 2)), roughness: rough, metalness: 0.05 }), parent); m.rotation.x = -Math.PI / 2; m.position.set(x, 0, z); return m;
}
function lamp(parent, x, y, z, color = '#fff6d8', intensity = 6, dist = 7, shadow = false) {
  box(0.5, 0.08, 0.5, emis(color, 2.4), x, y, z, parent).castShadow = false;
  const l = new THREE.PointLight(color, intensity, dist, 1.6); l.position.set(x, y - 0.25, z); l.castShadow = shadow;
  if (shadow) { l.shadow.mapSize.set(1024, 1024); l.shadow.bias = -0.002; l.shadow.normalBias = 0.03; }
  parent.add(l); return l;
}
function keyLight(scene, color, intensity, pos, target = [0, 1, 0], size = 6) {
  const d = new THREE.DirectionalLight(color, intensity); d.position.set(...pos); d.target.position.set(...target); scene.add(d, d.target);
  d.castShadow = true; d.shadow.mapSize.set(2048, 2048); d.shadow.bias = -0.0004; d.shadow.normalBias = 0.025;
  Object.assign(d.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 0.5, far: 40 }); return d;
}
function mkScene(bg, fogColor, fogNear, fogFar) { const s = new THREE.Scene(); s.background = new THREE.Color(bg); if (fogColor) s.fog = new THREE.Fog(fogColor, fogNear, fogFar); return s; }

// ---------- sets ----------
export function buildSets(extra) {
  buildTextures();
  const S = {};

  // HALLWAY: runs along -z. Floor 5 wide, from z=+6 to z=-22, door at the end.
  {
    const s = mkScene('#05060c', '#05060c', 9, 26); const g = new THREE.Group(); s.add(g);
    floor(g, 5, 28, 0, -8, 0.5, 0.28);
    const wallMat = std({ map: tex(T.hallWall, 7, 1) });
    for (const sx of [-1, 1]) { const w = plane(28, 4, wallMat, g); w.position.set(sx * 2.5, 2, -8); w.rotation.y = -sx * Math.PI / 2; }
    const ceil = plane(5, 28, std({ color: '#0d0e18' }), g); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 4, -8);
    const back = plane(5, 4, std({ map: tex(T.hallWall, 1.25, 1) }), g); back.position.set(0, 2, -22);
    box(1.6, 2.6, 0.1, '#020203', 0, 1.3, -21.95, g); // dark doorway
    box(1.8, 0.15, 0.2, '#30323c', 0, 2.65, -21.9, g); box(0.12, 2.7, 0.2, '#30323c', -0.86, 1.35, -21.9, g); box(0.12, 2.7, 0.2, '#30323c', 0.86, 1.35, -21.9, g);
    for (let z = 4; z > -22; z -= 3.2) { bunting(g, -2.45, 2.45, 3.75, z, 0.4, (z * 3) | 0); }
    for (let i = 0; i < 9; i++) { const z = 2 - i * 2.6, sx = i % 2 ? 1 : -1; const p = plane(0.55, 0.55, std({ map: tex(T.drawing(i)) }), g); p.position.set(sx * 2.48, 1.9 + (i % 3) * 0.15, z); p.rotation.y = -sx * Math.PI / 2; p.rotation.z = (i % 3 - 1) * 0.08; }
    S.hallLamps = [];
    for (let z = 2; z > -22; z -= 6) S.hallLamps.push(lamp(g, 0, 3.95, z, '#ffe9c4', 9, 9, z === 2 || z === -4));
    s.add(new THREE.HemisphereLight('#7f8cff', '#201810', 0.55));
    S.hall = s;
  }

  // STAGE: platform x -4..4, z -3..0 (top y=0.6). Characters stand at z ~ -1.6.
  {
    const s = mkScene('#04050b', '#04050b', 12, 30); const g = new THREE.Group(); s.add(g);
    floor(g, 16, 14, 0, 4, 0.5, 0.3);
    const wall = plane(16, 8, std({ map: tex(T.stars('#1c1a52', 5), 5, 2.5) }), g); wall.position.set(0, 4, -3);
    box(9, 0.6, 3.2, std({ map: tex(T.bricks, 4, 0.6) }), 0, 0.3, -1.5, g);
    box(9, 0.06, 3.2, '#3a3a44', 0, 0.62, -1.5, g);
    const banner = box(4.4, 0.8, 0.08, std({ map: tex(T.banner('HAPPY BIRTHDAY', '#6b3fd0', '#ffffff', 128, 22)) }), 1.2, 4.1, -2.9, g);
    banner.rotation.z = 0.02;
    for (let i = 0; i < 4; i++) stringLights(g, -7, 7, 5.8 - i * 0.5, -2.95, 0.35, i);
    bunting(g, -7.5, 7.5, 6.6, -2.8, 0.5, 2);
    for (const x of [-6.5, 6.5]) { box(0.9, 1.4, 0.9, '#2b2b36', x, 0.7, -2.2, g); box(0.7, 0.5, 0.05, emis('#ff4fa0', 1.2), x, 1.0, -1.74, g); } // speakers
    const spot = new THREE.SpotLight('#fff1d6', 40, 18, 0.55, 0.6, 1.4); spot.position.set(0, 6.5, 6); spot.target.position.set(0, 1.4, -1.6);
    spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -0.0005; spot.shadow.normalBias = 0.02; s.add(spot, spot.target);
    const pink = new THREE.PointLight('#ff5fb8', 6, 8, 1.5); pink.position.set(-4, 3, 1); s.add(pink);
    const blue = new THREE.PointLight('#5f8bff', 6, 8, 1.5); blue.position.set(4, 3, 1); s.add(blue);
    s.add(new THREE.HemisphereLight('#8090ff', '#1a1010', 0.7));
    S.stage = s; S.stageSpot = spot;
  }

  // PARTY ROOM: room 12x12, banner on back wall z=-5, tables.
  {
    const s = mkScene('#05040a', '#05040a', 11, 26); const g = new THREE.Group(); s.add(g);
    floor(g, 14, 16, 0, 1, 0.5, 0.3);
    const wm = std({ map: tex(T.stars('#2a1c5e', 12), 4, 1.5) });
    const back = plane(14, 6, wm, g); back.position.set(0, 3, -5);
    for (const sx of [-1, 1]) { const w = plane(16, 6, wm, g); w.position.set(sx * 7, 3, 1); w.rotation.y = -sx * Math.PI / 2; }
    box(7, 1.1, 0.1, std({ map: tex(T.banner("LET'S PARTY!", '#c9152b', '#ffd23a', 112, 18)) }), 0, 3.8, -4.9, g);
    bunting(g, -6.8, 6.8, 5.4, -4.8, 0.5, 4);
    stringLights(g, -6.8, 6.8, 5.0, -4.9, 0.4, 1);
    table(g, -2.6, -2.2); table(g, 2.6, -2.2); table(g, -2.6, 1.4); table(g, 2.6, 1.4);
    for (const [x, c] of [[-5.6, '#e83a3a'], [5.6, '#3a78e8'], [-5.2, '#36b34a']]) { box(0.5, 0.5, 0.5, c, x, 0.25, -3.8, g); box(0.52, 0.08, 0.1, '#ffd23a', x, 0.5, -3.8, g); }
    lamp(g, -2.6, 5.9, -0.5, '#ffe2c0', 10, 11, true); lamp(g, 2.6, 5.9, -0.5, '#ffe2c0', 10, 11, false);
    const red = new THREE.PointLight('#ff3050', 0, 9, 1.5); red.position.set(0, 3, 3); s.add(red); S.partyRed = red; const pf = new THREE.PointLight('#fff0e0', 5, 9, 1.4); pf.position.set(0.5, 2.6, 4); s.add(pf);
    s.add(new THREE.HemisphereLight('#9a88ff', '#20140c', 0.6));
    S.party = s;
  }

  // OFFICE: guard desk at origin; guard sits facing -z (towards the door at z=-4.5)
  {
    const s = mkScene('#030306', '#030306', 7, 18); const g = new THREE.Group(); s.add(g);
    floor(g, 8, 12, 0, 0, 0.5, 0.35);
    const wm = std({ map: tex(T.officeWall, 2, 1) });
    const back = plane(8, 4, wm, g); back.position.set(0, 2, 3.5); back.rotation.y = Math.PI;
    for (const sx of [-1, 1]) { const w = plane(12, 4, wm, g); w.position.set(sx * 4, 2, 0); w.rotation.y = -sx * Math.PI / 2; }
    // front wall with dark doorway
    const fw = std({ map: tex(T.officeWall, 0.75, 1) });
    for (const sx of [-1, 1]) { const w = plane(3, 4, fw, g); w.position.set(sx * 2.5, 2, -4.5); }
    const top = plane(2, 1.2, fw, g); top.position.set(0, 3.4, -4.5);
    box(2, 2.8, 0.1, '#000000', 0, 1.4, -6.5, g); // deep darkness behind door
    const hallFloor = plane(2, 2, std({ color: '#060608' }), g); hallFloor.rotation.x = -Math.PI / 2; hallFloor.position.set(0, 0.01, -5.5);
    const ceil = plane(8, 12, std({ color: '#0a0a0e' }), g); ceil.rotation.x = Math.PI / 2; ceil.position.y = 4;
    // desk in front of guard (between guard and door)
    const wood = std({ map: tex(T.wood, 2, 1), roughness: 0.7 });
    box(3.2, 0.12, 1.1, wood, 0, 0.95, -1.0, g); box(3.2, 0.9, 0.08, wood, 0, 0.47, -1.5, g);
    for (const dx of [-1.5, 1.5]) box(0.12, 0.9, 1.0, wood, dx, 0.45, -1.0, g);
    // monitors
    const scr = emis('#4f8f7a', 1.4);
    box(0.7, 0.55, 0.35, '#2a2a30', -0.9, 1.3, -1.25, g); box(0.6, 0.45, 0.02, scr, -0.9, 1.3, -1.07, g).rotation.y = Math.PI;
    box(0.6, 0.5, 0.35, '#2a2a30', 1.0, 1.28, -1.25, g); box(0.5, 0.4, 0.02, scr, 1.0, 1.28, -1.07, g);
    // fan
    const fan = new THREE.Group(); fan.position.set(0.25, 1.25, -1.2); g.add(fan); box(0.1, 0.25, 0.1, '#333', 0, -0.12, 0, fan);
    const blades = new THREE.Group(); fan.add(blades); for (let i = 0; i < 3; i++) { const b = box(0.06, 0.24, 0.02, '#555', 0, 0.12, 0, null); const p = new THREE.Group(); p.rotation.z = i * 2.09; p.add(b); blades.add(p); }
    S.fanBlades = blades; blades.position.z = -0.08;
    box(0.12, 0.14, 0.12, '#e8e8e8', -0.3, 1.08, -0.8, g); // cup
    for (let i = 0; i < 4; i++) { const p = plane(0.5, 0.5, std({ map: tex(T.drawing(i + 3)) }), g); p.position.set(-3.98, 2.1 + (i % 2) * 0.3, -2 + i * 0.6); p.rotation.y = Math.PI / 2; }
    // chair
    box(0.8, 0.1, 0.8, '#3a3a44', 0, 0.55, 0.15, g); box(0.8, 0.9, 0.1, '#3a3a44', 0, 1.05, 0.55, g); box(0.1, 0.5, 0.1, '#222', 0, 0.27, 0.15, g);
    S.officeLamp = lamp(g, 0, 3.95, 0.3, '#ffe0b0', 7, 8, true);
    const mon = new THREE.PointLight('#9fe0c8', 4, 4, 1.5); mon.position.set(0, 1.5, -0.75); s.add(mon);
    S.doorLight = new THREE.PointLight('#c8d8ff', 0, 5, 1.5); S.doorLight.position.set(0, 2.4, -5.0); s.add(S.doorLight);
    s.add(new THREE.HemisphereLight('#5a6cff', '#100a06', 0.4));
    // FNAF2-style red phone (Phone Guy)
    const ph = new THREE.Group(); ph.position.set(0.85, 1.01, -0.78); g.add(ph); S.phone = ph;
    const redM = std({ color: '#c21b22', roughness: 0.45 });
    box(0.28, 0.08, 0.22, redM, 0, 0.04, 0, ph); box(0.2, 0.06, 0.12, redM, 0, 0.1, 0.02, ph);
    const hs = new THREE.Group(); hs.position.set(0, 0.16, 0); ph.add(hs); S.phoneHandset = hs;
    box(0.34, 0.06, 0.08, redM, 0, 0, 0, hs); box(0.08, 0.08, 0.1, redM, 0.15, -0.03, 0, hs); box(0.08, 0.08, 0.1, redM, -0.15, -0.03, 0, hs);
    for (let i = 0; i < 9; i++) box(0.035, 0.012, 0.035, '#f2f2f2', (i % 3 - 1) * 0.05, 0.081, (Math.floor(i / 3) - 1) * 0.045 - 0.02, ph);
    S.phoneLight = new THREE.PointLight('#ff3a3a', 0, 1.8, 2); S.phoneLight.position.set(0.85, 1.3, -0.6); s.add(S.phoneLight);
    S.office = s;
  }

  // STUDIO (Scott): wooden floor, monitor on back wall with logo.
  {
    const s = mkScene('#0b0a10', '#0b0a10', 10, 22); const g = new THREE.Group(); s.add(g);
    const fl = plane(12, 12, std({ map: tex(T.wood, 6, 6), roughness: 0.6 }), g); fl.rotation.x = -Math.PI / 2;
    const wm = std({ map: tex(T.wallpaper, 8, 3), roughness: 0.9 });
    const back = plane(12, 6, wm, g); back.position.set(0, 3, -3);
    for (const sx of [-1, 1]) { const w = plane(12, 6, wm, g); w.position.set(sx * 6, 3, 3); w.rotation.y = -sx * Math.PI / 2; }
    // big monitor (screen texture swapped at runtime)
    box(3.4, 2.0, 0.15, '#111116', 1.6, 2.4, -2.9, g);
    S.studioScreenMat = std({ color: '#000', emissive: '#ffffff', emissiveIntensity: 1.0, roughness: 0.4 });
    const scr = plane(3.2, 1.8, S.studioScreenMat, g); scr.position.set(1.6, 2.4, -2.81);
    S.studioScreen = scr;
    // desk + pc
    const wood = std({ map: tex(T.wood, 2, 1), roughness: 0.6 });
    box(2.4, 0.1, 1.0, wood, -2.2, 0.9, -2.2, g); for (const dx of [-1.1, 1.1]) box(0.1, 0.9, 0.9, wood, -2.2 + dx, 0.45, -2.2, g);
    box(0.9, 0.6, 0.12, '#1a1a20', -2.2, 1.35, -2.5, g); box(0.8, 0.5, 0.02, emis('#3d6bd8', 1.3), -2.2, 1.35, -2.43, g);
    box(0.7, 0.04, 0.25, '#2a2a30', -2.2, 0.97, -2.0, g);
    // bookshelf
    box(1.4, 2.6, 0.5, wood, -5.2, 1.3, -2.6, g); const r = rng(21);
    for (let y = 0; y < 4; y++) for (let i = 0; i < 5; i++) box(0.18, 0.4, 0.3, ['#c33', '#36c', '#3a5', '#db3', '#a4d'][(i + y) % 5], -5.7 + i * 0.24, 0.4 + y * 0.6, -2.45, g);
    // plushies on shelf top
    S.studioShelfTop = new THREE.Vector3(-5.2, 2.6, -2.5);
    S.studioLamp = lamp(g, 0, 5.5, 0.5, '#ffd9a8', 12, 12, true);
    const screenGlow = new THREE.PointLight('#ff4a2a', 3, 6, 1.5); screenGlow.position.set(1.6, 2.4, -1.8); s.add(screenGlow); S.screenGlow = screenGlow;
    s.add(new THREE.HemisphereLight('#c0a8ff', '#2a1a10', 0.8));
    S.studio = s;
  }

  // BEDROOM: bed along -x wall, shelf with plushies on back wall, window.
  {
    const s = mkScene('#07051a', '#07051a', 8, 20); const g = new THREE.Group(); s.add(g);
    const fl = plane(10, 10, std({ map: tex(T.wood, 5, 5), roughness: 0.7 }), g); fl.rotation.x = -Math.PI / 2;
    const wm = std({ map: tex(T.wallpaper, 6, 2.5), roughness: 0.9 });
    const back = plane(10, 5, wm, g); back.position.set(0, 2.5, -3);
    for (const sx of [-1, 1]) { const w = plane(10, 5, wm, g); w.position.set(sx * 4, 2.5, 2); w.rotation.y = -sx * Math.PI / 2; }
    // rug
    const rug = plane(3, 2, std({ map: tex(canvas(12, 8, g2 => { g2.fillStyle = '#d9578f'; g2.fillRect(0, 0, 12, 8); g2.fillStyle = '#f2a0c2'; g2.fillRect(1, 1, 10, 6); g2.fillStyle = '#d9578f'; g2.fillRect(3, 3, 6, 2); })) }), g);
    rug.rotation.x = -Math.PI / 2; rug.position.set(0.6, 0.01, 0.6);
    // bed (head at back wall)
    const bed = new THREE.Group(); bed.position.set(-2.6, 0, -1.2); g.add(bed); S.bed = bed;
    box(1.6, 0.45, 2.8, std({ map: tex(T.wood, 1, 2) }), 0, 0.225, 0, bed);
    box(1.5, 0.22, 2.7, '#f0f0f6', 0, 0.56, 0, bed);
    box(1.55, 0.18, 1.9, '#e2589a', 0, 0.68, 0.42, bed);
    box(1.0, 0.18, 0.45, '#ffffff', 0, 0.74, -1.05, bed);
    box(1.7, 1.2, 0.15, std({ map: tex(T.wood, 1, 1) }), 0, 0.6, -1.45, bed);
    const rw = new THREE.Group(); g.add(rw); S.bedWalls = rw; rw.add(back); for (const w of g.children.filter(o => o !== rw && o.geometry && o.geometry.type === 'PlaneGeometry' && o !== fl && o !== rug)) rw.add(w);
    // window with moon
    box(1.4, 1.4, 0.06, '#0a0f2a', 1.6, 2.6, -2.97, rw); box(1.5, 0.08, 0.1, '#e8e2d0', 1.6, 2.6, -2.93, rw); box(0.08, 1.5, 0.1, '#e8e2d0', 1.6, 2.6, -2.93, rw);
    box(1.55, 0.1, 0.15, '#e8e2d0', 1.6, 1.88, -2.92, rw); box(0.35, 0.35, 0.02, emis('#fff6c8', 2), 2.0, 3.0, -2.95, rw);
    // shelf with plushies
    box(2.2, 0.1, 0.4, std({ map: tex(T.wood, 1, 1) }), 1.4, 1.5, -2.8, rw);
    S.shelfY = 1.55; S.shelfZ = -2.8;
    // toy blocks
    for (const [x, z, c] of [[0.9, 1.5, '#e83a3a'], [1.15, 1.6, '#3a78e8'], [1.0, 1.35, '#f2c230']]) box(0.2, 0.2, 0.2, c, x, 0.1, z, g);
    S.bedLamp = new THREE.PointLight('#ffcf8a', 9, 8, 1.4); S.bedLamp.position.set(-1.2, 1.4, -2.3); S.bedLamp.castShadow = true; S.bedLamp.shadow.bias = -0.002; S.bedLamp.shadow.normalBias = 0.03; s.add(S.bedLamp);
    box(0.4, 0.5, 0.4, std({ map: tex(T.wood, 1, 1) }), -1.3, 0.25, -2.6, g); box(0.25, 0.25, 0.25, emis('#ffcf8a', 1.8), -1.3, 0.65, -2.6, g);
    S.moon = keyLight(s, '#a8b4ff', 1.8, [3, 6, 5], [0, 0, -1], 6);
    S.bedHemi = new THREE.HemisphereLight('#9a8cff', '#2a1a30', 1.1); s.add(S.bedHemi);
    S.bedroom = s;
  }

  // VOID: black studio, spotlight, used for close-ups.
  {
    const s = mkScene('#000000'); const g = new THREE.Group(); s.add(g);
    const fl = plane(30, 30, std({ map: tex(T.checker, 30, 30), roughness: 0.25 }), g); fl.rotation.x = -Math.PI / 2;
    fl.material.color = new THREE.Color('#3a3a44');
    s.fog = new THREE.Fog('#000000', 4, 11);
    const spot = new THREE.SpotLight('#fff4e0', 55, 14, 0.42, 0.75, 1.3); spot.position.set(0, 5, 5); spot.target.position.set(0, 1.4, 0); spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -0.0005; spot.shadow.normalBias = 0.02;
    s.add(spot, spot.target); S.voidSpot = spot;
    S.voidFill = new THREE.PointLight('#7f8cff', 2.5, 8, 1.5); S.voidFill.position.set(-2, 2, 3); s.add(S.voidFill);
    S.voidRim = new THREE.PointLight('#ff2a3a', 0, 8, 1.5); S.voidRim.position.set(2, 2.5, -1.5); s.add(S.voidRim);
    S.voidHemi = new THREE.HemisphereLight('#a0a8ff', '#100808', 0.35); s.add(S.voidHemi);
    S.void = s;
  }


  // SCREEN ROOM: dark brick room with a CRT on a desk, an arcade cabinet and the neon FNAF 2 sign.
  {
    const s = mkScene('#030306', '#030306', 8, 20); const g = new THREE.Group(); s.add(g);
    const fl = plane(16, 12, std({ map: tex(T.checker, 16, 12), roughness: 0.35 }), g); fl.rotation.x = -Math.PI / 2; fl.material.color = new THREE.Color('#77777f');
    const bw = std({ map: tex(T.bricks, 6, 4), color: '#5a5a6a' });
    const back = plane(16, 6, bw, g); back.position.set(0, 3, -3);
    for (const sx of [-1, 1]) { const w = plane(12, 6, bw, g); w.position.set(sx * 8, 3, 3); w.rotation.y = -sx * Math.PI / 2; }
    // desk + CRT (screen canvas drawn per frame)
    const wood = std({ map: tex(T.wood, 2, 1), roughness: 0.7 });
    box(2.2, 0.1, 1.0, wood, 0, 0.95, -1.6, g); for (const dx of [-1, 1]) box(0.1, 0.95, 0.9, wood, dx, 0.47, -1.6, g);
    S.screenCanvas = canvas(256, 192, c2 => { c2.fillStyle = '#000'; c2.fillRect(0, 0, 256, 192); });
    S.screenTex = new THREE.CanvasTexture(S.screenCanvas); S.screenTex.colorSpace = THREE.SRGBColorSpace; S.screenTex.magFilter = THREE.NearestFilter; S.screenTex.minFilter = THREE.LinearFilter;
    const scrMat = new THREE.MeshBasicMaterial({ map: S.screenTex, color: '#e8e8e8' });
    const crt = new THREE.Group(); crt.position.set(0, 1.0, -1.7); g.add(crt);
    box(0.95, 0.78, 0.8, '#c9c2b0', 0, 0.39, 0, crt); box(0.6, 0.5, 0.3, '#b8b09d', 0, 0.39, -0.5, crt);
    const scr = plane(0.78, 0.585, scrMat, crt); scr.position.set(0, 0.42, 0.405);
    box(0.06, 0.06, 0.02, '#e33', 0.38, 0.06, 0.41, crt);
    S.crtScreenPos = new THREE.Vector3(0, 1.42, -1.29);
    S.crtLight = new THREE.PointLight('#9fe6ff', 2.5, 3.5, 1.6); S.crtLight.position.set(0, 1.45, -0.9); s.add(S.crtLight);
    // keyboard
    box(0.7, 0.04, 0.24, '#bdb6a4', 0, 1.02, -1.15, g);
    // arcade cabinet (to the right)
    const arc = new THREE.Group(); arc.position.set(4.5, 0, -2.0); g.add(arc);
    const arcM = std({ color: '#1d1530', roughness: 0.6 });
    box(1.1, 2.3, 0.9, arcM, 0, 1.15, 0, arc); box(1.12, 0.35, 0.2, emis('#7a2ae0', 1.8), 0, 2.2, 0.36, arc);
    box(1.1, 0.25, 0.5, arcM, 0, 1.05, 0.55, arc);
    const arcScr = plane(0.8, 0.6, scrMat, arc); arcScr.position.set(0, 1.6, 0.455); arcScr.rotation.x = -0.12;
    box(0.06, 0.12, 0.06, '#e33', -0.2, 1.22, 0.7, arc); box(0.06, 0.06, 0.06, '#ee3', 0.15, 1.2, 0.7, arc); box(0.06, 0.06, 0.06, '#3e5', 0.28, 1.2, 0.7, arc);
    S.arcScreenPos = new THREE.Vector3(4.5, 1.6, -1.54);
    S.arcLight = new THREE.PointLight('#c08cff', 2.5, 4, 1.6); S.arcLight.position.set(4.5, 1.7, -1.0); s.add(S.arcLight);
    // neon FNAF 2 sign on the left wall (texture set from main)
    S.neonMat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.05, color: '#ffffff', toneMapped: false });
    const neon = plane(3.6, 1.85, S.neonMat, g); neon.position.set(-4.2, 2.9, -2.95); S.neon = neon;
    S.neonLight = new THREE.PointLight('#ff6a2a', 0, 7, 1.5); S.neonLight.position.set(-4.2, 2.6, -1.8); s.add(S.neonLight);
    // police lights
    S.policeR = new THREE.PointLight('#ff2030', 0, 9, 1.4); S.policeR.position.set(-2, 2.6, 1.5); s.add(S.policeR);
    S.policeB = new THREE.PointLight('#2050ff', 0, 9, 1.4); S.policeB.position.set(2, 2.6, 1.5); s.add(S.policeB);
    S.screenLamp = lamp(g, 0, 4.2, 0.5, '#ffe2c0', 4, 9, true);
    s.add(new THREE.HemisphereLight('#6a70a0', '#100808', 0.45));
    S.screenroom = s;
  }

  // PRIZE CORNER: counter, plush shelves and the Puppet's giant gift box.
  {
    const s = mkScene('#04030a', '#04030a', 9, 22); const g = new THREE.Group(); s.add(g);
    floor(g, 14, 14, 0, 1, 0.5, 0.3);
    const wm = std({ map: tex(T.stars('#2a1650', 21), 4, 1.5) });
    const back = plane(14, 6, wm, g); back.position.set(0, 3, -4.5);
    for (const sx of [-1, 1]) { const w = plane(14, 6, wm, g); w.position.set(sx * 7, 3, 1); w.rotation.y = -sx * Math.PI / 2; }
    box(6, 0.42, 0.8, std({ map: tex(T.banner('PRIZE CORNER', '#f2c230', '#c21b22', 128, 20)) }), 0, 4.3, -4.4, g);
    stringLights(g, -6.5, 6.5, 5.3, -4.4, 0.4, 3);
    // counter
    const cm = std({ color: '#d63a6a', roughness: 0.5 }), ct = std({ color: '#f2e6c8', roughness: 0.5 });
    box(4.4, 1.0, 0.8, cm, -3.6, 0.5, -2.6, g); box(4.6, 0.1, 0.95, ct, -3.6, 1.05, -2.6, g);
    // shelves with voxel plush
    const shelfM = std({ map: tex(T.wood, 2, 1) });
    for (const y of [1.8, 2.7, 3.6]) box(5, 0.1, 0.5, shelfM, -3.6, y, -4.2, g);
    const pc = ['#d86a20', '#2f7fd8', '#f2c230', '#e8e2dc', '#7a2ae0'];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { const c = pc[(i + r * 2) % 5], x = -5.7 + i * 0.85, y = 1.85 + r * 0.9;
      box(0.34, 0.3, 0.3, c, x, y + 0.15, -4.15, g); box(0.26, 0.24, 0.26, c, x, y + 0.42, -4.15, g); box(0.08, 0.08, 0.02, '#111', x - 0.06, y + 0.45, -4.01, g); box(0.08, 0.08, 0.02, '#111', x + 0.06, y + 0.45, -4.01, g); }
    // the gift box (centre-right), lid can open
    const gift = new THREE.Group(); gift.position.set(1.8, 0, -1.6); g.add(gift); S.gift = gift;
    T.giftPaper = canvas(16, 16, c2 => { c2.fillStyle = '#ece6f2'; c2.fillRect(0, 0, 16, 16); c2.fillStyle = '#7a2ae0'; for (let x = 0; x < 16; x += 4) c2.fillRect(x, 0, 2, 16); });
    const paper = std({ map: tex(T.giftPaper, 2, 2), roughness: 0.6 }), rib = std({ color: '#c21b22', roughness: 0.5 });
    box(1.6, 1.5, 1.6, paper, 0, 0.75, 0, gift); box(0.24, 1.52, 1.62, rib, 0, 0.75, 0, gift); box(1.62, 1.52, 0.24, rib, 0, 0.75, 0, gift);
    box(1.4, 0.05, 1.4, '#0a0510', 0, 1.49, 0, gift);
    const lidPiv = new THREE.Group(); lidPiv.position.set(0, 1.5, -0.82); gift.add(lidPiv); S.giftLid = lidPiv;
    const lid = new THREE.Group(); lid.position.set(0, 0.11, 0.82); lidPiv.add(lid);
    box(1.72, 0.22, 1.72, paper, 0, 0, 0, lid); box(0.26, 0.24, 1.74, rib, 0, 0, 0, lid); box(1.74, 0.24, 0.26, rib, 0, 0, 0, lid);
    const bow = voxelArt(['rr.rr', 'rrrrr', '.rrr.'], { r: '#c21b22' }, 0.12, 0.12); bow.position.y = 0.3; lid.add(bow);
    // music box on the counter
    const mb = new THREE.Group(); mb.position.set(-2.4, 1.1, -2.5); g.add(mb); box(0.4, 0.28, 0.3, '#5a2a8a', 0, 0.14, 0, mb); box(0.06, 0.06, 0.2, '#e8d070', 0.24, 0.14, 0, mb);
    S.giftSpot = new THREE.SpotLight('#e0c8ff', 30, 12, 0.45, 0.6, 1.3); S.giftSpot.position.set(1.8, 5.5, 2); S.giftSpot.target.position.set(1.8, 1, -1.6);
    S.giftSpot.castShadow = true; S.giftSpot.shadow.mapSize.set(1024, 1024); S.giftSpot.shadow.bias = -0.0006; s.add(S.giftSpot, S.giftSpot.target);
    lamp(g, -3.6, 5.8, -1.5, '#ffd8b0', 6, 9, false);
    S.prizeFill = new THREE.PointLight('#a080ff', 3, 9, 1.5); S.prizeFill.position.set(0, 2.5, 3); s.add(S.prizeFill);
    s.add(new THREE.HemisphereLight('#8a78d0', '#140a10', 0.55));
    S.prize = s;
  }

  // KID'S COVE: pastel room with a low tiled ceiling for Mangle.
  {
    const s = mkScene('#05040a', '#05040a', 8, 18); const g = new THREE.Group(); s.add(g);
    floor(g, 12, 12, 0, 0, 0.5, 0.35);
    T.coveWall = canvas(16, 16, c2 => { c2.fillStyle = '#d9a0c8'; c2.fillRect(0, 0, 16, 16); c2.fillStyle = '#9ad0e6'; for (let x = 0; x < 16; x += 8) c2.fillRect(x, 0, 4, 16); c2.fillStyle = '#f2e270'; c2.fillRect(2, 5, 1, 1); c2.fillRect(10, 12, 1, 1); });
    const wm = std({ map: tex(T.coveWall, 6, 2), roughness: 0.9 });
    const back = plane(12, 3.4, wm, g); back.position.set(0, 1.7, -4);
    for (const sx of [-1, 1]) { const w = plane(12, 3.4, wm, g); w.position.set(sx * 6, 1.7, 1); w.rotation.y = -sx * Math.PI / 2; }
    T.ceilTile = canvas(8, 8, c2 => { c2.fillStyle = '#c8c8cc'; c2.fillRect(0, 0, 8, 8); c2.fillStyle = '#8a8a92'; c2.fillRect(0, 0, 8, 1); c2.fillRect(0, 0, 1, 8); c2.fillStyle = '#b4b4ba'; c2.fillRect(3, 3, 1, 1); c2.fillRect(5, 6, 1, 1); });
    const ceil = plane(12, 12, std({ map: tex(T.ceilTile, 12, 12), roughness: 0.9 }), g); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3.2, 1); S.coveCeilY = 3.2;
    box(3.6, 0.5, 0.08, std({ map: tex(T.banner("KID'S COVE", '#3a9ad8', '#ffffff', 112, 18)) }), 0, 2.6, -3.94, g);
    for (const [x, z, c] of [[-2, -1.5, '#e83a3a'], [-1.6, -1.2, '#3a78e8'], [-1.8, -0.8, '#f2c230'], [2.2, -2, '#36b34a']]) box(0.3, 0.3, 0.3, c, x, 0.15, z, g);
    S.coveLamps = [lamp(g, -2, 3.15, 0, '#fff0e0', 5, 7, false), lamp(g, 2, 3.15, 0, '#fff0e0', 5, 7, false)];
    S.coveFill = new THREE.PointLight('#c0d8ff', 4, 8, 1.5); S.coveFill.position.set(0, 1.0, 3); s.add(S.coveFill);
    S.coveRed = new THREE.PointLight('#ff2a3a', 0, 6, 1.6); S.coveRed.position.set(0.5, 1.5, 1.5); s.add(S.coveRed);
    s.add(new THREE.HemisphereLight('#c0b0ff', '#20141a', 0.75));
    S.cove = s;
  }

  // SAVE THEM minigame: flat, unlit Atari-style maze (pixelated in post).
  {
    const s = mkScene('#000000'); const g = new THREE.Group(); s.add(g);
    T.miniFloor = canvas(8, 8, c2 => { c2.fillStyle = '#0a0612'; c2.fillRect(0, 0, 8, 8); c2.fillStyle = '#160c26'; c2.fillRect(0, 0, 8, 1); c2.fillRect(0, 0, 1, 8); });
    const fm = new THREE.MeshBasicMaterial({ map: tex(T.miniFloor, 24, 24) });
    const fl = plane(24, 24, fm, g); fl.rotation.x = -Math.PI / 2;
    const wallM = new THREE.MeshLambertMaterial({ color: '#5a2ab8' }), topM = new THREE.MeshBasicMaterial({ color: '#8a5ae8' });
    const wall = (x, z, w, d) => { box(w, 1.3, d, wallM, x, 0.65, z, g); box(w, 0.06, d, topM, x, 1.32, z, g); };
    // outer frame + inner walls forming rooms
    wall(0, -9, 18, 0.5); wall(0, 9, 18, 0.5); wall(-9, 0, 0.5, 18); wall(9, 0, 0.5, 18);
    wall(-3, -4, 0.5, 9); wall(3, 4, 0.5, 9); wall(-5.5, 2, 6.5, 0.5); wall(5.5, -2, 6.5, 0.5); wall(0, 0.5, 4, 0.5);
    S.miniKidSpots = [[-6.2, -6], [5.8, -6.2], [-6.5, 5.6], [6.2, 6.4], [0.4, -3.2]];
    S.miniKidRot = [0.4, -0.9, 1.6, 2.4, -0.2];
    s.add(new THREE.AmbientLight('#ffffff', 2.4));
    const d = new THREE.DirectionalLight('#ffffff', 1.2); d.position.set(3, 8, 5); s.add(d);
    S.mini = s;
  }

  return S;
}

// ---------- icons / fx ----------
export function bubble(symbol) { // speech bubble with ? or !
  const q = symbol === '?' ? [
    '..wwwwwwwww..', '.wwwwwwwwwww.', 'wwwwkkkkkwwww', 'wwwkkwwwkkwww', 'wwwwwwwwkkwww', 'wwwwwwwkkwwww', 'wwwwwwkkwwwww', 'wwwwwwkkwwwww', 'wwwwwwwwwwwww', 'wwwwwwkkwwwww', '.wwwwwkkwwww.', '..wwwwwwwww..', '....www......', '.....ww......', '......w......'
  ] : [
    '..wwwwwwwww..', '.wwwwwwwwwww.', 'wwwwwrrrwwwww', 'wwwwwrrrwwwww', 'wwwwwrrrwwwww', 'wwwwwrrrwwwww', 'wwwwwwrwwwwww', 'wwwwwwrwwwwww', 'wwwwwwwwwwwww', 'wwwwwwrwwwwww', '.wwwwwwwwwww.', '..wwwwwwwww..', '....www......', '.....ww......', '......w......'
  ];
  const m = voxelArt(q, { w: '#d9d9de', k: '#16161c', r: '#e0242f' }, 0.03, 0.06);
  m.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }); o.castShadow = false; } });
  return m;
}
export function sparkle(color = '#fff6c0') {
  const m = voxelArt(['...x...', '...x...', '..xxx..', 'xxxxxxx', '..xxx..', '...x...', '...x...'], { x: color }, 0.03, 0.03);
  m.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ color, fog: false }); o.castShadow = false; } });
  return m;
}
export function zzz() {
  const m = voxelArt(['xxxxx', '...x.', '..x..', '.x...', 'xxxxx'], { x: '#d8d0ff' }, 0.05, 0.05);
  m.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ color: '#d8d0ff', fog: false }); o.castShadow = false; } });
  return m;
}
export { tex, emis, plane };

// ---------- animated CRT / arcade screen ----------
// mode: 'off' | 'scan' | 'db' | 'error' | 'match' | 'virus' | 'savethem'
export function drawScreen(S, mode, L, t) {
  const c = S.screenCanvas, g = c.getContext('2d'), W = c.width, H = c.height; g.imageSmoothingEnabled = false;
  const r = rng(Math.floor(t * 30) + 7);
  const txt = (s, x, y, size, col, align = 'center') => { g.font = `bold ${size}px "DejaVu Sans Mono", monospace`; g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(s, x, y); };
  const face = (x, y, sz, tint) => { g.drawImage(S.guardFace, 0, 0, S.guardFace.width, S.guardFace.height, x, y, sz, sz); if (tint) { g.fillStyle = tint; g.fillRect(x, y, sz, sz); } };
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (mode === 'off') { S.screenTex.needsUpdate = true; return; }
  if (mode === 'scan' || mode === 'match') {
    g.fillStyle = mode === 'match' ? '#1a0204' : '#02140c'; g.fillRect(0, 0, W, H);
    g.strokeStyle = mode === 'match' ? 'rgba(255,60,60,0.25)' : 'rgba(60,255,150,0.18)'; g.lineWidth = 1;
    for (let x = 0; x < W; x += 16) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, H); g.stroke(); }
    for (let y = 0; y < H; y += 16) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(W, y + 0.5); g.stroke(); }
    const fx = 78, fy = 34, fs = 100; face(fx, fy, fs, mode === 'match' ? 'rgba(255,0,0,0.18)' : 'rgba(0,255,120,0.12)');
    const col = mode === 'match' ? '#ff3030' : '#3dff96'; g.strokeStyle = col; g.lineWidth = 3;
    const br = 16; for (const [x, y, dx, dy] of [[fx - 6, fy - 6, 1, 1], [fx + fs + 6, fy - 6, -1, 1], [fx - 6, fy + fs + 6, 1, -1], [fx + fs + 6, fy + fs + 6, -1, -1]]) { g.beginPath(); g.moveTo(x, y + dy * br); g.lineTo(x, y); g.lineTo(x + dx * br, y); g.stroke(); }
    if (mode === 'scan') {
      const sy = fy + ((L * 1.6) % 1) * fs; g.fillStyle = 'rgba(60,255,150,0.75)'; g.fillRect(fx - 10, sy, fs + 20, 3);
      for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(60,255,150,0.9)'; g.fillRect(fx + 10 + r() * (fs - 20), fy + 10 + r() * (fs - 20), 4, 4); }
      txt('SCANNING' + '.'.repeat(1 + Math.floor(L * 3) % 3), W / 2, 16, 14, col); txt('FACE ID', W / 2, H - 14, 12, col);
    } else {
      const on = Math.floor(L * 6) % 2 === 0; g.fillStyle = on ? 'rgba(255,30,30,0.9)' : 'rgba(255,30,30,0.6)'; g.fillRect(16, H - 44, W - 32, 34);
      txt('MATCH 99%', W / 2, H - 27, 22, '#fff'); txt('CRIMINAL', W / 2, 16, 15, '#ff4040');
    }
  } else if (mode === 'db') {
    g.fillStyle = '#04081a'; g.fillRect(0, 0, W, H); txt('POLICE DATABASE', W / 2, 14, 13, '#6fa8ff');
    const cols = 5, rows = 3, cw = 44, ch = 44, ox = (W - cols * cw) / 2 + 2, oy = 32; const sel = Math.floor(L * 9) % (cols * rows);
    const pal = ['#d8a080', '#b07850', '#f0c8a0', '#8a5a3a', '#e0b090'];
    for (let i = 0; i < cols * rows; i++) { const x = ox + (i % cols) * cw, y = oy + Math.floor(i / cols) * ch; const rr = rng(i * 13 + Math.floor(L * 9));
      g.fillStyle = '#10162e'; g.fillRect(x, y, cw - 6, ch - 6);
      if (i === sel) { face(x + 3, y + 3, cw - 12); } else { g.fillStyle = pal[i % 5]; g.fillRect(x + 8, y + 6, cw - 22, cw - 20); g.fillStyle = ['#2a1a10', '#111', '#5a3a1a', '#d0b060'][Math.floor(rr() * 4)]; g.fillRect(x + 8, y + 6, cw - 22, 6); g.fillStyle = '#111'; g.fillRect(x + 13, y + 16, 4, 4); g.fillRect(x + cw - 23, y + 16, 4, 4); }
      if (i === sel) { g.strokeStyle = '#ffd040'; g.lineWidth = 2; g.strokeRect(x - 1, y - 1, cw - 4, ch - 4); }
    }
    txt('SEARCHING ' + String(1000 + Math.floor(L * 731) % 9000), W / 2, H - 14, 12, '#6fa8ff');
  } else if (mode === 'error' || mode === 'virus') {
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const v = r() * (mode === 'virus' ? 200 : 60) | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 2, 2); }
    for (let i = 0; i < 6; i++) { const y = r() * H | 0; g.fillStyle = mode === 'virus' ? `rgba(${100 + r() * 155 | 0},0,${r() * 255 | 0},0.7)` : 'rgba(255,40,40,0.5)'; g.fillRect(0, y, W, 3 + r() * 10); }
    const blink = Math.floor(L * 5) % 2 === 0;
    if (mode === 'error') { g.fillStyle = '#200000'; g.fillRect(28, 62, W - 56, 68); g.strokeStyle = '#ff3030'; g.lineWidth = 3; g.strokeRect(28, 62, W - 56, 68); if (blink) txt('ERROR', W / 2, 88, 30, '#ff3030'); txt('PROGRAM FAULT', W / 2, 116, 12, '#ff9090'); }
    else { g.fillStyle = 'rgba(0,0,0,0.75)'; g.fillRect(20, 66, W - 40, 60); if (blink) txt('SYSTEM ERROR', W / 2, 86, 22, '#ff3030'); txt('VIRUS?', W / 2, 112, 16, '#ffffff'); }
  } else if (mode === 'savethem') {
    g.fillStyle = '#05020c'; g.fillRect(0, 0, W, H); g.fillStyle = '#5a2ab8';
    for (const [x, y, w, h] of [[10, 10, 236, 6], [10, 176, 236, 6], [10, 10, 6, 172], [240, 10, 6, 172], [80, 40, 6, 90], [170, 70, 6, 100], [80, 120, 60, 6]]) g.fillRect(x, y, w, h);
    g.fillStyle = '#8a5a3a'; g.fillRect(120 + Math.sin(L * 3) * 20, 140, 10, 14); g.fillStyle = '#ccc'; g.fillRect(40, 150, 12, 6); g.fillRect(200, 40, 12, 6);
    if (Math.floor(L * 4) % 4 !== 3) txt('SAVE THEM', W / 2, 92, 26, '#ff2a2a');
  }
  // CRT scanlines + vignette
  g.fillStyle = 'rgba(0,0,0,0.22)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  S.screenTex.needsUpdate = true;
}

// glowing soul orb (core + halo), unlit so bloom picks it up
export function soulOrb(color = '#cfeeff') {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 1), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, fog: false }));
  const halo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 1), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
  g.add(core, halo); g.userData.halo = halo; return g;
}
