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
    // FNAF4 additions: closet (back wall), hallway door (right wall), Halloween pumpkins, flashlight
    const closet = new THREE.Group(); closet.position.set(-0.6, 0, -2.65); g.add(closet); S.closet = closet;
    const cw = std({ map: tex(T.wood, 1, 2), roughness: 0.8 });
    box(1.6, 2.5, 0.08, '#120c08', 0, 1.25, -0.25, closet); box(0.08, 2.5, 0.6, cw, -0.8, 1.25, 0, closet); box(0.08, 2.5, 0.6, cw, 0.8, 1.25, 0, closet); box(1.68, 0.1, 0.6, cw, 0, 2.5, 0, closet);
    S.closetDoors = [];
    for (const sx of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sx * 0.78, 0, 0.3); closet.add(piv);
      box(0.76, 2.38, 0.05, cw, -sx * 0.38, 1.22, 0, piv); box(0.05, 0.25, 0.06, '#c8b060', -sx * 0.7, 1.25, 0.04, piv); S.closetDoors.push(piv); }
    const dpiv = new THREE.Group(); dpiv.position.set(3.96, 0, 0.4); g.add(dpiv); S.bedDoor = dpiv;
    box(0.06, 2.4, 1.2, std({ color: '#6a4a34', roughness: 0.7 }), 0, 1.2, 0.6, dpiv); box(0.08, 0.08, 0.08, '#c8b060', -0.05, 1.2, 1.05, dpiv);
    box(0.05, 2.4, 1.2, '#040404', 3.99, 1.2, 1.0, g); // dark hallway behind the door
    T.pumpkin = canvas(6, 5, c2 => { c2.fillStyle = '#e8701a'; c2.fillRect(0, 0, 6, 5); c2.fillStyle = '#ffd040'; c2.fillRect(1, 1, 1, 1); c2.fillRect(4, 1, 1, 1); c2.fillRect(1, 3, 4, 1); });
    S.pumpkins = [];
    for (const [x, y, z, sc] of [[1.0, 0, 1.2, 1], [2.1, 1.56, -2.75, 0.6], [-1.6, 0, 1.6, 0.8]]) { const pg = new THREE.Group(); pg.position.set(x, y, z); pg.scale.setScalar(sc); g.add(pg);
      box(0.5, 0.42, 0.5, std({ map: tex(T.pumpkin), roughness: 0.6, emissive: '#ff8a20', emissiveMap: tex(T.pumpkin), emissiveIntensity: 0.9 }), 0, 0.21, 0, pg); box(0.07, 0.12, 0.07, '#3a6a20', 0, 0.48, 0, pg);
      const pl = new THREE.PointLight('#ff8a30', 1.5, 2.5, 1.6); pl.position.set(0, 0.35, 0.35); pg.add(pl); S.pumpkins.push(pl); }
    S.flash = new THREE.SpotLight('#fff4d8', 0, 12, 0.45, 0.5, 1.2); S.flash.castShadow = true; S.flash.shadow.mapSize.set(1024, 1024); S.flash.shadow.bias = -0.001; s.add(S.flash, S.flash.target);
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


  // FACADE: the pizzeria at night seen from the street (with a lit interior behind glass) — storm scenes.
  {
    const s = mkScene('#04060c', '#06080f', 10, 30); const g = new THREE.Group(); s.add(g);
    T.asphalt = canvas(16, 16, c2 => { const r = rng(41); c2.fillStyle = '#1c1e24'; c2.fillRect(0, 0, 16, 16); for (let i = 0; i < 40; i++) { c2.fillStyle = `rgba(${60 + r() * 40 | 0},${60 + r() * 40 | 0},${70 + r() * 40 | 0},0.5)`; c2.fillRect(r() * 16 | 0, r() * 16 | 0, 1, 1); } });
    const wet = (map, rep) => std({ map: tex(map, rep, rep), roughness: 0.18, metalness: 0.25 });
    const street = plane(30, 16, wet(T.asphalt, 12), g); street.rotation.x = -Math.PI / 2; street.position.set(0, 0, 9);
    T.sidewalk = canvas(8, 8, c2 => { c2.fillStyle = '#5e6068'; c2.fillRect(0, 0, 8, 8); c2.fillStyle = '#44464e'; c2.fillRect(0, 0, 8, 1); c2.fillRect(0, 0, 1, 8); });
    box(30, 0.1, 2.6, std({ map: tex(T.sidewalk, 15, 1.3), roughness: 0.2, metalness: 0.2 }), 0, 0.05, 1.3, g);
    T.redBricks = canvas(32, 16, c2 => { c2.fillStyle = '#3a2420'; c2.fillRect(0, 0, 32, 16); const r = rng(13); for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? -4 : 0; x < 32; x += 8) { c2.fillStyle = `rgb(${110 + r() * 40 | 0},${48 + r() * 20 | 0},${40 + r() * 16 | 0})`; c2.fillRect(x + 1, y + 1, 7, 3); } });
    const bm = std({ map: tex(T.redBricks, 4, 2), roughness: 0.8 });
    const wallPiece = (x0, x1, y0, y1) => { const w = x1 - x0, h = y1 - y0; const m = box(w, h, 0.3, std({ map: tex(T.redBricks, w / 1.6, h / 1.6), roughness: 0.75 }), (x0 + x1) / 2, (y0 + y1) / 2, -0.15, g); return m; };
    // front wall with door (|x|<0.8, y<2.6) and two windows (x 2.4..4.8 / -4.8..-2.4, y 0.9..2.4)
    wallPiece(-8, -4.8, 0, 5.5); wallPiece(4.8, 8, 0, 5.5); wallPiece(-2.4, -0.8, 0, 5.5); wallPiece(0.8, 2.4, 0, 5.5);
    wallPiece(-0.8, 0.8, 2.6, 5.5); for (const sx of [-1, 1]) { wallPiece(sx < 0 ? -4.8 : 2.4, sx < 0 ? -2.4 : 4.8, 0, 0.9); wallPiece(sx < 0 ? -4.8 : 2.4, sx < 0 ? -2.4 : 4.8, 2.4, 5.5); }
    const glass = new THREE.MeshStandardMaterial({ color: '#9ec4e0', transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.3, depthWrite: false });
    const frameM = std({ color: '#22242a', roughness: 0.4, metalness: 0.6 });
    // glass door (two panes) with frame
    S.doorPanes = [];
    for (const sx of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sx * 0.8, 0, 0.0); g.add(piv);
      const pane = new THREE.Mesh(new THREE.BoxGeometry(0.78, 2.5, 0.03), glass); pane.position.set(-sx * 0.4, 1.3, 0); piv.add(pane);
      box(0.06, 2.55, 0.08, frameM, -sx * 0.03, 1.3, 0, piv); box(0.06, 2.55, 0.08, frameM, -sx * 0.77, 1.3, 0, piv); box(0.8, 0.07, 0.08, frameM, -sx * 0.4, 2.55, 0, piv); box(0.8, 0.07, 0.08, frameM, -sx * 0.4, 0.05, 0, piv);
      box(0.04, 0.35, 0.06, '#c8c8d0', -sx * 0.68, 1.25, 0.06, piv); S.doorPanes.push(piv); }
    S.lock = box(0.08, 0.08, 0.05, '#d0b040', -0.12, 1.25, 0.05, g);
    for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 0.03), glass); w.position.set(sx * 3.6, 1.65, 0); g.add(w);
      box(2.5, 0.08, 0.12, frameM, sx * 3.6, 0.92, 0.02, g); box(2.5, 0.08, 0.12, frameM, sx * 3.6, 2.38, 0.02, g); box(0.08, 1.5, 0.12, frameM, sx * 3.6, 1.65, 0.02, g); }
    // awning + logo sign
    T.awning = canvas(8, 2, c2 => { for (let x = 0; x < 8; x++) { c2.fillStyle = x % 2 ? '#e8e2d8' : '#b8202a'; c2.fillRect(x, 0, 1, 2); } });
    const aw = box(3.4, 0.08, 1.0, std({ map: tex(T.awning, 3, 1), roughness: 0.6 }), 0, 2.95, 0.55, g); aw.rotation.x = 0.25;
    S.logoMat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.04, toneMapped: false, fog: false });
    const logo = plane(4.6, 1.92, S.logoMat, g); logo.position.set(0, 4.25, 0.05);
    S.logoLight = new THREE.PointLight('#ff6a2a', 9, 8, 1.4); S.logoLight.position.set(0, 4.2, 1.4); s.add(S.logoLight);
    // street light
    box(0.12, 4.6, 0.12, frameM, 4.6, 2.3, 3.2, g); box(0.9, 0.1, 0.12, frameM, 4.2, 4.6, 3.2, g); box(0.4, 0.12, 0.3, emis('#ffe0a0', 2.5), 3.85, 4.52, 3.2, g);
    S.streetLamp = new THREE.SpotLight('#ffd9a0', 30, 12, 0.7, 0.5, 1.2); S.streetLamp.position.set(3.85, 4.45, 3.2); S.streetLamp.target.position.set(3.0, 0, 2.6); S.streetLamp.castShadow = true; S.streetLamp.shadow.mapSize.set(1024, 1024); S.streetLamp.shadow.bias = -0.001; s.add(S.streetLamp, S.streetLamp.target);
    // interior (behind the front wall): floor, back wall with the "secret room" door, warm lights, a party table
    floor(g, 16, 8, 0, -4.2, 0.5, 0.3);
    const iw = std({ map: tex(T.hallWall, 4, 1), roughness: 0.8 });
    const ib = plane(16, 5.5, iw, g); ib.position.set(0, 2.75, -8.2);
    for (const sx of [-1, 1]) { const w = plane(8, 5.5, iw, g); w.position.set(sx * 8, 2.75, -4.1); w.rotation.y = -sx * Math.PI / 2; }
    const ic = plane(16, 8, std({ color: '#141018' }), g); ic.rotation.x = Math.PI / 2; ic.position.set(0, 5.5, -4.1);
    box(1.4, 2.5, 0.12, '#141016', 2.6, 1.25, -8.12, g); // secret room doorway (dark)
    const sdPiv = new THREE.Group(); sdPiv.position.set(1.9, 0, -8.05); g.add(sdPiv); S.secretDoor = sdPiv;
    box(1.4, 2.45, 0.08, std({ color: '#5a3a2a', roughness: 0.7 }), 0.7, 1.23, 0, sdPiv); box(0.08, 0.08, 0.06, '#c8b060', 1.25, 1.2, 0.06, sdPiv);
    box(1.6, 0.35, 0.06, std({ map: tex(T.banner('PARTS & SERVICE', '#2a2a32', '#d0d0d8', 96, 14)) }), 2.6, 2.85, -8.1, g);
    table(g, -3.6, -2.4, 2.0);
    S.inLamps = [lamp(g, -2.5, 5.45, -3, '#ffd8a8', 10, 10, true), lamp(g, 2.5, 5.45, -3, '#ffd8a8', 10, 10, false)];
    S.inGlow = new THREE.PointLight('#ffc890', 4, 6, 1.5); S.inGlow.position.set(0, 1.8, -1.0); s.add(S.inGlow);
    S.facadeLightning = new THREE.DirectionalLight('#c8d8ff', 0); S.facadeLightning.position.set(-4, 10, 8); s.add(S.facadeLightning);
    S.facadeHemi = new THREE.HemisphereLight('#4a5a90', '#0a0a10', 0.55); s.add(S.facadeHemi);
    S.facade = s;
  }

  // ALLEY: narrow wet brick alley behind the pizzeria (back door + lamp), runs along -z.
  {
    const s = mkScene('#03050a', '#05070d', 6, 18); const g = new THREE.Group(); s.add(g);
    const ground = plane(5, 20, std({ map: tex(T.asphalt, 3, 12), roughness: 0.15, metalness: 0.3 }), g); ground.rotation.x = -Math.PI / 2; ground.position.z = -5;
    for (const sx of [-1, 1]) { const w = plane(20, 7, std({ map: tex(T.redBricks, 10, 3.5), roughness: 0.85 }), g); w.position.set(sx * 1.8, 3.5, -5); w.rotation.y = -sx * Math.PI / 2; }
    // puddles
    const pud = std({ color: '#0a0c12', roughness: 0.02, metalness: 0.9 });
    for (const [x, z, w, d] of [[-0.4, -1.2, 1.2, 0.8], [0.5, -3.6, 0.9, 1.3], [-0.6, -6.2, 1.1, 0.9], [0.3, 0.8, 0.8, 0.6]]) { const p2 = plane(w, d, pud, g); p2.rotation.x = -Math.PI / 2; p2.position.set(x, 0.005, z); }
    // back door on the left wall with a lamp above
    box(0.08, 2.3, 1.2, std({ color: '#3a3e46', roughness: 0.5, metalness: 0.5 }), -1.76, 1.15, -3.0, g); box(0.1, 0.1, 0.1, '#c8c8d0', -1.7, 1.15, -2.55, g);
    box(0.25, 0.12, 0.3, emis('#ffd090', 2.4), -1.68, 2.65, -3.0, g);
    S.alleyLamp = new THREE.PointLight('#ffc070', 10, 7, 1.4); S.alleyLamp.position.set(-1.35, 2.5, -3.0); S.alleyLamp.castShadow = true; S.alleyLamp.shadow.bias = -0.002; S.alleyLamp.shadow.normalBias = 0.03; s.add(S.alleyLamp);
    // dumpster + trash
    box(1.0, 1.0, 1.8, std({ color: '#2f5a3a', roughness: 0.6, metalness: 0.3 }), 1.2, 0.5, -5.2, g); box(1.05, 0.1, 1.85, std({ color: '#244630' }), 1.2, 1.04, -5.2, g);
    for (const [x, z] of [[1.3, -3.9], [1.1, -4.3], [-1.3, -7.5]]) box(0.45, 0.4, 0.45, '#111114', x, 0.2, z, g);
    box(0.06, 7, 0.06, '#444', 1.7, 3.5, -2.0, g); // drain pipe
    S.alleyEnd = new THREE.PointLight('#5a7ac0', 6, 14, 1.2); S.alleyEnd.position.set(0, 3, -13); s.add(S.alleyEnd);
    S.alleyLightning = new THREE.DirectionalLight('#c8d8ff', 0); S.alleyLightning.position.set(1, 10, 2); s.add(S.alleyLightning);
    s.add(new THREE.HemisphereLight('#4a5a90', '#0a0a14', 0.95));
    S.alleyFill = new THREE.PointLight('#8aa0d8', 3.5, 7, 1.4); S.alleyFill.position.set(1.0, 1.8, 1.5); s.add(S.alleyFill);
    S.alley = s;
  }

  // WORKSHOP: Henry's workshop — bench, blueprints, parts, CRT computer, the Puppet stand.
  {
    const s = mkScene('#0a0806', '#0a0806', 10, 22); const g = new THREE.Group(); s.add(g);
    T.concrete = canvas(16, 16, c2 => { const r = rng(55); c2.fillStyle = '#6a6660'; c2.fillRect(0, 0, 16, 16); for (let i = 0; i < 50; i++) { c2.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.12})`; c2.fillRect(r() * 16 | 0, r() * 16 | 0, 2, 1); } });
    const fl = plane(12, 12, std({ map: tex(T.concrete, 6, 6), roughness: 0.8 }), g); fl.rotation.x = -Math.PI / 2;
    T.panel = canvas(16, 16, c2 => { c2.fillStyle = '#6a4a30'; c2.fillRect(0, 0, 16, 16); c2.fillStyle = '#5a3c24'; for (let x = 0; x < 16; x += 4) c2.fillRect(x, 0, 1, 16); });
    const wm = std({ map: tex(T.panel, 6, 2), roughness: 0.85 });
    const back = plane(12, 5, wm, g); back.position.set(0, 2.5, -4);
    for (const sx of [-1, 1]) { const w = plane(12, 5, wm, g); w.position.set(sx * 6, 2.5, 2); w.rotation.y = -sx * Math.PI / 2; }
    // blueprints
    T.blueprint = (seed) => canvas(32, 24, c2 => { c2.fillStyle = '#1e4a8a'; c2.fillRect(0, 0, 32, 24); c2.strokeStyle = 'rgba(200,220,255,0.35)'; c2.lineWidth = 1; for (let x = 0; x < 32; x += 4) { c2.beginPath(); c2.moveTo(x + 0.5, 0); c2.lineTo(x + 0.5, 24); c2.stroke(); }
      c2.strokeStyle = '#e8f0ff'; c2.lineWidth = 1; if (seed === 0) { c2.strokeRect(10.5, 4.5, 11, 9); c2.strokeRect(9.5, 2.5, 3, 3); c2.strokeRect(19.5, 2.5, 3, 3); c2.strokeRect(12.5, 14.5, 7, 7); }
      else { c2.strokeRect(13.5, 2.5, 5, 6); c2.beginPath(); c2.moveTo(16, 9); c2.lineTo(16, 20); c2.moveTo(11, 11); c2.lineTo(21, 11); c2.moveTo(16, 20); c2.lineTo(12, 23); c2.moveTo(16, 20); c2.lineTo(20, 23); c2.stroke(); } });
    const bp1 = plane(1.6, 1.2, std({ map: tex(T.blueprint(0)), roughness: 0.9 }), g); bp1.position.set(-2.4, 2.6, -3.97);
    const bp2 = plane(1.6, 1.2, std({ map: tex(T.blueprint(1)), roughness: 0.9 }), g); bp2.position.set(-0.6, 2.7, -3.97); bp2.rotation.z = 0.04;
    // workbench + tools
    const wood = std({ map: tex(T.wood, 2, 1), roughness: 0.7 });
    box(3.0, 0.12, 1.0, wood, -1.5, 0.95, -3.2, g); for (const dx of [-1.4, 1.4]) box(0.12, 0.95, 0.9, wood, -1.5 + dx, 0.47, -3.2, g);
    box(0.5, 0.06, 0.12, '#888892', -2.4, 1.04, -3.0, g); box(0.08, 0.06, 0.35, '#c03030', -2.15, 1.04, -3.1, g); box(0.35, 0.05, 0.05, '#9a9aa4', -0.6, 1.03, -2.95, g);
    S.benchPos = new THREE.Vector3(-1.5, 1.01, -3.2);
    // shelves with parts
    for (const y of [1.2, 2.0, 2.8]) box(1.8, 0.08, 0.45, wood, 3.4, y, -3.75, g);
    const r = rng(77); for (let i = 0; i < 12; i++) { const y = [1.2, 2.0, 2.8][i % 3] + 0.12; box(0.18 + r() * 0.2, 0.15 + r() * 0.2, 0.2, ['#7a7a84', '#4a4a52', '#a0602a', '#5a5a64'][i % 4], 2.7 + (i / 3 | 0) * 0.45, y, -3.7, g); }
    // computer desk (shares the animated screen canvas)
    box(1.6, 0.1, 0.8, wood, 2.6, 0.9, -1.2, g); for (const dx of [-0.7, 0.7]) box(0.08, 0.9, 0.7, wood, 2.6 + dx, 0.45, -1.2, g);
    const crt = new THREE.Group(); crt.position.set(2.6, 0.95, -1.35); g.add(crt);
    box(0.8, 0.66, 0.66, '#c9c2b0', 0, 0.33, 0, crt); const sc2 = plane(0.66, 0.5, new THREE.MeshBasicMaterial({ map: S.screenTex, color: '#e8e8e8' }), crt); sc2.position.set(0, 0.35, 0.335);
    S.shopCrt = new THREE.Vector3(2.6, 1.3, -1.015);
    S.shopCrtLight = new THREE.PointLight('#7affb0', 1.5, 3, 1.6); S.shopCrtLight.position.set(2.6, 1.35, -0.7); s.add(S.shopCrtLight);
    // Puppet stand (metal frame) on the right
    for (const dx of [-0.5, 0.5]) box(0.08, 3.0, 0.08, '#55555e', 0.9 + dx, 1.5, -2.4, g); box(1.08, 0.08, 0.08, '#55555e', 0.9, 3.0, -2.4, g);
    S.shopLamp = new THREE.SpotLight('#ffd8a0', 35, 10, 0.75, 0.5, 1.3); S.shopLamp.position.set(-0.5, 4.6, 0.5); S.shopLamp.target.position.set(-0.5, 0.8, -2.5); S.shopLamp.castShadow = true; S.shopLamp.shadow.mapSize.set(2048, 2048); S.shopLamp.shadow.bias = -0.0005; s.add(S.shopLamp, S.shopLamp.target);
    box(0.5, 0.25, 0.5, emis('#ffd8a0', 2.2), -0.5, 4.75, 0.5, g);
    S.shopFill = new THREE.PointLight('#ffb070', 3.5, 9, 1.5); S.shopFill.position.set(0, 2, 2.5); s.add(S.shopFill);
    s.add(new THREE.HemisphereLight('#ffe0c0', '#2a1a10', 0.6));
    S.shop = s;
  }

  // GIVE GIFTS minigame: black void with a faint 8-bit floor grid.
  {
    const s = mkScene('#000000'); const g = new THREE.Group(); s.add(g);
    T.ggFloor = canvas(8, 8, c2 => { c2.fillStyle = '#050508'; c2.fillRect(0, 0, 8, 8); c2.fillStyle = '#12121a'; c2.fillRect(0, 0, 8, 1); c2.fillRect(0, 0, 1, 8); });
    const fl = plane(20, 20, new THREE.MeshBasicMaterial({ map: tex(T.ggFloor, 20, 20) }), g); fl.rotation.x = -Math.PI / 2;
    s.add(new THREE.AmbientLight('#ffffff', 2.2)); const d = new THREE.DirectionalLight('#ffffff', 1.2); d.position.set(2, 8, 6); s.add(d);
    S.gg = s;
  }


  // FNAF 1 OFFICE: two steel doors with buttons, the West Hall to the left ending at Pirate Cove.
  {
    const s = mkScene('#030306', '#030306', 9, 22); const g = new THREE.Group(); s.add(g);
    floor(g, 5.2, 4.6, 0, -0.2, 0.5, 0.35);
    const wm = std({ map: tex(T.officeWall, 2, 1) });
    const backW = plane(5.2, 3.2, wm, g); backW.position.set(0, 1.6, 2.1); backW.rotation.y = Math.PI;
    const frontW = plane(5.2, 3.2, wm, g); frontW.position.set(0, 1.6, -2.5);
    for (const sx of [-1, 1]) { // side walls with a 1.4 wide doorway at z in [-0.7, 0.7]
      const a1 = plane(1.4, 3.2, wm, g); a1.position.set(sx * 2.6, 1.6, 1.4); a1.rotation.y = -sx * Math.PI / 2;
      const a2 = plane(1.8, 3.2, wm, g); a2.position.set(sx * 2.6, 1.6, -1.6); a2.rotation.y = -sx * Math.PI / 2;
      const a3 = plane(1.4, 0.7, wm, g); a3.position.set(sx * 2.6, 2.85, 0); a3.rotation.y = -sx * Math.PI / 2;
      box(0.12, 2.5, 0.12, '#2a2a30', sx * 2.58, 1.25, -0.72, g); box(0.12, 2.5, 0.12, '#2a2a30', sx * 2.58, 1.25, 0.72, g);
      // button panel (door = red, light = white)
      const bp = new THREE.Group(); bp.position.set(sx * 2.55, 1.35, -1.0); bp.rotation.y = -sx * Math.PI / 2; g.add(bp);
      box(0.28, 0.6, 0.06, '#3a3a40', 0, 0, 0, bp); const bD = box(0.14, 0.14, 0.06, emis('#ff2a2a', 0.6), 0, 0.14, 0.05, bp); const bL = box(0.14, 0.14, 0.06, emis('#f0f0f0', 0.4), 0, -0.14, 0.05, bp);
      if (sx < 0) { S.btnDoorL = bD; S.btnLightL = bL; } else { S.btnDoorR = bD; S.btnLightR = bL; }
    }
    const ceil = plane(5.2, 4.6, std({ color: '#0a0a0e' }), g); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3.2, -0.2);
    T.metalDoor = canvas(8, 16, c2 => { c2.fillStyle = '#5a5e66'; c2.fillRect(0, 0, 8, 16); c2.fillStyle = '#4a4e56'; for (let y = 0; y < 16; y += 3) c2.fillRect(0, y, 8, 1); c2.fillStyle = '#c8b040'; for (let y = 1; y < 16; y += 6) { c2.fillRect(0, y, 8, 1); } });
    S.doorL = box(0.1, 2.5, 1.4, std({ map: tex(T.metalDoor), roughness: 0.4, metalness: 0.6 }), -2.6, 3.75, 0, g);
    S.doorR = box(0.1, 2.5, 1.4, std({ map: tex(T.metalDoor), roughness: 0.4, metalness: 0.6 }), 2.6, 3.75, 0, g);
    // desk, monitors, fan, cups, poster
    const wood = std({ map: tex(T.wood, 2, 1), roughness: 0.7 });
    box(2.6, 0.1, 0.9, wood, 0, 0.92, -1.3, g); box(2.6, 0.9, 0.08, wood, 0, 0.46, -1.72, g);
    box(0.6, 0.48, 0.42, '#2a2a30', -0.7, 1.21, -1.45, g); box(0.5, 0.36, 0.02, emis('#4f8f7a', 1.2), -0.7, 1.22, -1.23, g);
    box(0.5, 0.44, 0.4, '#2a2a30', 0.75, 1.19, -1.45, g); box(0.42, 0.32, 0.02, emis('#4f8f7a', 1.2), 0.75, 1.2, -1.24, g);
    const fan = new THREE.Group(); fan.position.set(0.1, 1.2, -1.35); g.add(fan); box(0.1, 0.24, 0.1, '#333', 0, -0.12, 0, fan);
    const blades = new THREE.Group(); blades.position.z = 0.08; fan.add(blades); for (let i = 0; i < 3; i++) { const p2 = new THREE.Group(); p2.rotation.z = i * 2.09; blades.add(p2); box(0.06, 0.22, 0.02, '#555', 0, 0.11, 0, p2); } S.fan1 = blades;
    box(1.6, 0.6, 0.04, std({ map: tex(T.banner('CELEBRATE!', '#d8d0c0', '#c21b22', 80, 20)) }), 0.3, 2.3, -2.47, g);
    S.office1Lamp = lamp(g, 0, 3.15, 0, '#ffe0b0', 9, 8, true);
    s.add(new THREE.HemisphereLight('#6a7cff', '#100a06', 0.8));
    // WEST HALL: from the left doorway (x=-2.6) out to x=-15 ; Pirate Cove curtain at the end
    const hf = plane(12.6, 1.9, std({ map: tex(T.checker, 12.6, 1.9), roughness: 0.3 }), g); hf.rotation.x = -Math.PI / 2; hf.position.set(-8.9, 0.005, 0);
    const hw = std({ map: tex(T.hallWall, 3, 1) });
    for (const sz of [-1, 1]) { const w = plane(12.6, 3.0, hw, g); w.position.set(-8.9, 1.5, sz * 0.95); w.rotation.y = sz > 0 ? Math.PI : 0; }
    const hc = plane(12.6, 1.9, std({ color: '#0a0a0e' }), g); hc.rotation.x = Math.PI / 2; hc.position.set(-8.9, 3.0, 0);
    for (let i = 0; i < 5; i++) { const pp = plane(0.5, 0.5, std({ map: tex(T.drawing(i + 1)) }), g); pp.position.set(-4 - i * 2.2, 1.8, (i % 2 ? 0.93 : -0.93)); pp.rotation.y = i % 2 ? Math.PI : 0; }
    S.west = [lamp(g, -6, 2.95, 0, '#ffe2c0', 4, 6, false), lamp(g, -11, 2.95, 0, '#ffe2c0', 4, 6, false)];
    S.westDoorLight = new THREE.PointLight('#ffe8c8', 0, 4, 1.5); S.westDoorLight.position.set(-3.2, 2.4, 0); s.add(S.westDoorLight);
    const cm = std({ map: tex(T.stars('#3a1a6a', 9), 1, 2), roughness: 0.95 });
    S.curtains = [];
    for (const sz of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(-15.0, 0, sz * 0.95); g.add(piv);
      const c = box(0.08, 3.0, 0.98, cm, 0, 1.5, -sz * 0.49, piv); S.curtains.push(piv); }
    box(0.1, 0.35, 1.0, std({ map: tex(T.banner('SORRY! OUT OF ORDER', '#e8e2d0', '#222', 112, 14)) }), -14.9, 2.4, 0, g);
    S.coveSpot = new THREE.PointLight('#c8a0ff', 3, 5, 1.5); S.coveSpot.position.set(-13.8, 2.6, 0); s.add(S.coveSpot);
    S.office1 = s;
  }

  // FNAF 3 OFFICE (Fazbear's Fright): dark, green tint, big window to the hall, old monitor.
  {
    const s = mkScene('#020402', '#020402', 7, 16); const g = new THREE.Group(); s.add(g);
    T.f3floor = canvas(8, 8, c2 => { c2.fillStyle = '#2a2a26'; c2.fillRect(0, 0, 8, 8); c2.fillStyle = '#1a1a18'; c2.fillRect(0, 0, 4, 4); c2.fillRect(4, 4, 4, 4); });
    const fl = plane(8, 8, std({ map: tex(T.f3floor, 8, 8), roughness: 0.6 }), g); fl.rotation.x = -Math.PI / 2;
    T.f3wall = canvas(16, 16, c2 => { const r = rng(61); c2.fillStyle = '#2e3a2e'; c2.fillRect(0, 0, 16, 16); for (let i = 0; i < 30; i++) { c2.fillStyle = `rgba(0,0,0,${0.15 + r() * 0.3})`; c2.fillRect(r() * 16 | 0, r() * 16 | 0, 1 + (r() * 3 | 0), 1); } });
    const wm = std({ map: tex(T.f3wall, 3, 1.5), roughness: 0.9 });
    for (const sx of [-1, 1]) { const w = plane(8, 3.4, wm, g); w.position.set(sx * 3, 1.7, 0); w.rotation.y = -sx * Math.PI / 2; }
    const bw = plane(6, 3.4, wm, g); bw.position.set(0, 1.7, 3); bw.rotation.y = Math.PI;
    // front wall with big window (x -1.6..1.6, y 1.0..2.5)
    const fw = (x0, x1, y0, y1) => { const m = plane(x1 - x0, y1 - y0, std({ map: tex(T.f3wall, (x1 - x0) / 2, (y1 - y0) / 2), roughness: 0.9 }), g); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, -2.4); };
    fw(-3, -1.6, 0, 3.4); fw(1.6, 3, 0, 3.4); fw(-1.6, 1.6, 0, 1.0); fw(-1.6, 1.6, 2.5, 3.4);
    const glass = new THREE.MeshStandardMaterial({ color: '#4a6a5a', transparent: true, opacity: 0.18, roughness: 0.1, depthWrite: false }); const gl = plane(3.2, 1.5, glass, g); gl.position.set(0, 1.75, -2.4);
    box(3.3, 0.08, 0.1, '#1a1a1a', 0, 1.0, -2.38, g); box(3.3, 0.08, 0.1, '#1a1a1a', 0, 2.5, -2.38, g);
    const hf2 = plane(3.2, 5, std({ color: '#0e100e' }), g); hf2.rotation.x = -Math.PI / 2; hf2.position.set(0, 0.01, -5);
    box(0.6, 0.6, 0.6, '#3a3022', -1.0, 0.3, -5.5, g); box(0.5, 0.5, 0.5, '#2e2618', 0.9, 0.25, -6.2, g);
    const wood = std({ map: tex(T.wood, 2, 1), roughness: 0.8, color: '#7a6a58' });
    box(2.4, 0.08, 0.8, wood, 0, 0.9, -1.6, g); box(2.4, 0.86, 0.06, wood, 0, 0.45, -1.98, g);
    box(0.7, 0.55, 0.5, '#2a2a28', 0.5, 1.22, -1.75, g); box(0.6, 0.45, 0.02, emis('#3a7a4a', 1.0), 0.5, 1.23, -1.49, g);
    box(0.14, 0.18, 0.14, '#c8c0a8', -0.6, 1.03, -1.4, g); box(0.14, 0.18, 0.14, '#8a3a2a', -0.4, 1.03, -1.5, g);
    for (let i = 0; i < 3; i++) { const pp = plane(0.6, 0.7, std({ map: tex(T.drawing(i + 7)), color: '#8a9a7a' }), g); pp.position.set(-2.98, 1.9 + (i % 2) * 0.25, -1 + i * 0.9); pp.rotation.y = Math.PI / 2; pp.rotation.z = (i - 1) * 0.1; }
    S.f3Lamp = new THREE.PointLight('#a8ffb0', 9, 8, 1.4); S.f3Lamp.position.set(0, 3.0, 0.2); S.f3Lamp.castShadow = true; S.f3Lamp.shadow.bias = -0.002; s.add(S.f3Lamp);
    S.f3Glow = new THREE.PointLight('#5aff7a', 1.5, 3, 1.6); S.f3Glow.position.set(0.5, 1.3, -1.2); s.add(S.f3Glow);
    s.add(new THREE.HemisphereLight('#6a9a7a', '#0a0c0a', 0.95));
    S.office3 = s;
  }

  // FNAF SL CUSTOM NIGHT OFFICE (Private Room): riveted steel, big dark window, desk, red alarm light.
  {
    const s = mkScene('#020306', '#020306', 7, 16); const g = new THREE.Group(); s.add(g);
    T.steel = canvas(16, 16, c2 => { c2.fillStyle = '#4a5058'; c2.fillRect(0, 0, 16, 16); c2.fillStyle = '#3a4048'; c2.fillRect(0, 7, 16, 1); c2.fillRect(7, 0, 1, 16); c2.fillStyle = '#7a8088'; for (const [x, y] of [[2, 2], [12, 2], [2, 12], [12, 12]]) c2.fillRect(x, y, 1, 1); });
    const sm = std({ map: tex(T.steel, 3, 2), roughness: 0.45, metalness: 0.55 });
    const fl = plane(7, 7, std({ map: tex(T.steel, 5, 5), roughness: 0.5, metalness: 0.4, color: '#8a8a90' }), g); fl.rotation.x = -Math.PI / 2;
    for (const sx of [-1, 1]) { const w = plane(7, 3.4, sm, g); w.position.set(sx * 3, 1.7, 0); w.rotation.y = -sx * Math.PI / 2; }
    const bw = plane(6, 3.4, sm, g); bw.position.set(0, 1.7, 3); bw.rotation.y = Math.PI;
    const fw = (x0, x1, y0, y1) => { const m = plane(x1 - x0, y1 - y0, std({ map: tex(T.steel, (x1 - x0) / 2, (y1 - y0) / 2), roughness: 0.45, metalness: 0.55 }), g); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, -2.4); };
    fw(-3, -2.0, 0, 3.4); fw(2.0, 3, 0, 3.4); fw(-2.0, 2.0, 0, 0.9); fw(-2.0, 2.0, 2.7, 3.4);
    const glass = new THREE.MeshStandardMaterial({ color: '#2a3a5a', transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.4, depthWrite: false }); const gl = plane(4, 1.8, glass, g); gl.position.set(0, 1.8, -2.4);
    const hf2 = plane(4, 4, std({ color: '#06070a' }), g); hf2.rotation.x = -Math.PI / 2; hf2.position.set(0, 0.01, -4.4);
    box(4.1, 0.1, 0.14, '#2a2e34', 0, 0.9, -2.38, g); box(4.1, 0.1, 0.14, '#2a2e34', 0, 2.7, -2.38, g);
    const dm = std({ color: '#3a3e46', roughness: 0.4, metalness: 0.6 });
    box(2.6, 0.08, 0.8, dm, 0, 0.88, -1.6, g); box(2.6, 0.84, 0.06, dm, 0, 0.44, -1.98, g);
    box(0.8, 0.55, 0.12, '#14161a', -0.5, 1.25, -1.85, g); box(0.7, 0.45, 0.02, emis('#3a7aff', 1.0), -0.5, 1.25, -1.78, g);
    box(0.5, 0.5, 0.06, '#1a1c20', 2.94, 0.45, -1.0, g); // vent
    S.slLamp = new THREE.PointLight('#c8d8ff', 11, 8, 1.4); S.slLamp.position.set(0, 3.1, 0.3); S.slLamp.castShadow = true; S.slLamp.shadow.bias = -0.002; s.add(S.slLamp);
    S.slRed = new THREE.PointLight('#ff2020', 0, 7, 1.4); S.slRed.position.set(0, 2.9, 1.5); s.add(S.slRed);
    box(0.25, 0.12, 0.25, emis('#ff2020', 0.6), 0, 3.35, 1.5, g);
    s.add(new THREE.HemisphereLight('#7a8aba', '#08080c', 1.0));
    S.officeSL = s;
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
export function likeIcon() {
  const rows = ['..ww...', '.wbw....', 'wbbw....', 'wbbwwwww', 'wbbbbbbw', 'wbbbbbbw', 'wbbbbbbw', '.wwwwww.'];
  const m = voxelArt(rows, { w: '#1b63d8', b: '#ffffff' }, 0.045, 0.05);
  m.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }); o.castShadow = false; } });
  return m;
}
export function bellIcon() {
  const rows = ['...ww...', '..wrrw..', '.wrrrrw.', '.wrrrrw.', 'wrrrrrrw', 'wrrrrrrw', '.wwwwww.', '...ww...'];
  const m = voxelArt(rows, { w: '#e0242f', r: '#ff5a66' }, 0.045, 0.05);
  m.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }); o.castShadow = false; } });
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
  } else if (mode === 'static') {
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const v = r() * 150 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 2, 2); }
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(10, 10, 60, 22); txt('CAM', 40, 21, 14, '#ffffff');
  } else if (mode === 'code') {
    g.fillStyle = '#020a04'; g.fillRect(0, 0, W, H);
    const lines = ['> PUPPET_OS v1.0', '> load security.mod', '> target: CHARLOTTE', '> track bracelet ID 01', '> mode = PROTECT', '> if (!near) seek()', '> status: ONLINE'];
    const shown = Math.min(lines.length, Math.floor(L * 6) + 1);
    for (let i = 0; i < shown; i++) txt(lines[i] + (i === shown - 1 && Math.floor(L * 4) % 2 ? '_' : ''), 12, 22 + i * 22, 13, i === 4 ? '#ffd040' : '#4dff8a', 'left');
  } else if (mode === 'givegifts') {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    // 8-bit Puppet in the middle, four grey kids around, masks/gifts appear over time
    const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    P(120, 70, 16, 18, '#f0f0f0'); P(123, 76, 3, 3, '#000'); P(130, 76, 3, 3, '#000'); P(122, 82, 12, 2, '#000'); P(119, 88, 18, 34, '#111'); for (let k = 0; k < 4; k++) P(119, 92 + k * 8, 18, 2, '#ddd');
    const kids = [[50, 70], [190, 70], [50, 130], [190, 130]], masks = ['#8a5a3a', '#6a5ab0', '#e0c040', '#c84a2a'];
    kids.forEach(([x, y], i) => { P(x, y + 10, 14, 20, '#9a9aa2'); const on = L * 2 > i * 0.5 + 0.5; P(x - 1, y - 4, 16, 14, on ? masks[i] : '#b8b8c0'); if (on) { P(x + 3, y + 1, 3, 3, '#000'); P(x + 9, y + 1, 3, 3, '#000'); } });
    if (Math.floor(L * 3) % 3 !== 2) { txt('GIVE GIFTS', W / 2, 22, 22, '#ffffff'); txt('GIVE LIFE', W / 2, H - 18, 22, '#ffffff'); }
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


// ---------- rain: instanced falling streaks + ground splashes, a pure function of time ----------
export class Rain {
  constructor(n = 2600, splashes = 220) {
    this.group = new THREE.Group();
    const m = new THREE.MeshBasicMaterial({ color: '#a8bcd8', transparent: true, opacity: 0.3, depthWrite: false, fog: false });
    this.drops = new THREE.InstancedMesh(new THREE.BoxGeometry(0.006, 0.3, 0.006), m, n); this.drops.frustumCulled = false;
    const sm2 = new THREE.MeshBasicMaterial({ color: '#c8d8f0', transparent: true, opacity: 0.35, depthWrite: false, fog: false });
    this.spl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 0.006, 0.09), sm2, splashes); this.spl.frustumCulled = false;
    this.group.add(this.drops, this.spl);
    const r = rng(99); this.seed = Array.from({ length: n }, () => [r(), r(), r()]); this.sseed = Array.from({ length: splashes }, () => [r(), r(), r()]);
    this.n = n; this.ns = splashes; this.m4 = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.v = new THREE.Vector3(); this.sc = new THREE.Vector3();
  }
  // center/size: box the rain fills; groundY; wind tilts the streaks
  update(t, cx, cz, sx = 6, sz = 6, top = 6, groundY = 0, wind = 0.12, camPos = null) {
    const H = top - groundY, speed = 11; this.cam = camPos;
    this.q.setFromEuler(new THREE.Euler(0, 0, wind));
    for (let i = 0; i < this.n; i++) { const [a, b, c] = this.seed[i]; const y = groundY + ((c * H - t * speed) % H + H) % H;
      this.v.set(cx + (a - 0.5) * sx + wind * (y - groundY), y, cz + (b - 0.5) * sz); this.sc.set(1, 1, 1);
      if (camPos && this.v.distanceTo(camPos) < 2.6) this.v.y = -50; /* never let streaks cross the lens */ this.m4.compose(this.v, this.q, this.sc); this.drops.setMatrixAt(i, this.m4); }
    this.drops.instanceMatrix.needsUpdate = true;
    const q0 = new THREE.Quaternion();
    for (let i = 0; i < this.ns; i++) { const [a, b, c] = this.sseed[i]; const ph = ((t * 2.2 + c) % 1); const k = ph < 0.35 ? ph / 0.35 : 0;
      this.v.set(cx + (a - 0.5) * sx, groundY + 0.004, cz + (b - 0.5) * sz); const sz2 = (k > 0 && !(this.cam && this.v.distanceTo(this.cam) < 2.2)) ? 0.3 + 1.0 * k : 0.0001; this.sc.set(sz2, 1, sz2); this.m4.compose(this.v, q0, this.sc); this.spl.setMatrixAt(i, this.m4); }
    this.spl.instanceMatrix.needsUpdate = true;
  }
}

// big red X (voxel) for "not in a secret room"
export function redX() {
  const rows = ['xx....xx', 'xxx..xxx', '.xxxxxx.', '..xxxx..', '..xxxx..', '.xxxxxx.', 'xxx..xxx', 'xx....xx'];
  const m = voxelArt(rows, { x: '#e01a24' }, 0.12, 0.1);
  m.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ color: '#ff2a34', toneMapped: false, fog: false }); o.castShadow = false; } });
  return m;
}

// ======================= Springtrap video sets =======================
export function buildSpringSets(S, dinerLogo) {
  // FREDBEAR'S FAMILY DINER (golden era): warm yellow walls, red trim, stage with red curtains + logo sign.
  {
    const s = mkScene('#1a1006', '#1a1006', 14, 30); const g = new THREE.Group(); s.add(g);
    T.dinerFloor = canvas(2, 2, c2 => { c2.fillStyle = '#efe6d0'; c2.fillRect(0, 0, 2, 2); c2.fillStyle = '#2a1a12'; c2.fillRect(0, 0, 1, 1); c2.fillRect(1, 1, 1, 1); });
    const fl = plane(16, 16, std({ map: tex(T.dinerFloor, 16, 16), roughness: 0.35 }), g); fl.rotation.x = -Math.PI / 2; fl.position.z = 2;
    T.dinerWall = canvas(32, 32, c2 => { c2.fillStyle = '#e8b84a'; c2.fillRect(0, 0, 32, 32); c2.fillStyle = '#d8a63a'; for (let x = 0; x < 32; x += 8) c2.fillRect(x, 0, 3, 32);
      c2.fillStyle = '#b8282a'; c2.fillRect(0, 22, 32, 3); c2.fillStyle = '#7a1a1a'; c2.fillRect(0, 25, 32, 7); c2.fillStyle = '#f2d27a'; for (let x = 2; x < 32; x += 8) c2.fillRect(x, 27, 3, 3); });
    const wm = std({ map: tex(T.dinerWall, 5, 1), roughness: 0.85 });
    const back = plane(16, 6, wm, g); back.position.set(0, 3, -6);
    for (const sx of [-1, 1]) { const w = plane(16, 6, wm, g); w.position.set(sx * 8, 3, 2); w.rotation.y = -sx * Math.PI / 2; }
    const ceil = plane(16, 16, std({ color: '#3a2412' }), g); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 6, 2);
    // stage
    box(8, 0.7, 3.0, std({ color: '#6a3a1e', roughness: 0.6 }), 0, 0.35, -4.4, g); box(8.1, 0.12, 3.1, '#c8a040', 0, 0.71, -4.4, g);
    for (let i = 0; i < 16; i++) box(0.5, 0.6, 0.06, i % 2 ? '#f2d27a' : '#b8282a', -3.75 + i * 0.5, 0.36, -2.88, g);
    const curtM = std({ color: '#a01a22', roughness: 0.95 });
    S.dinerCurtains = [];
    for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) { const c = box(0.5, 4.6, 0.18, curtM, sx * (3.8 - k * 0.45), 3.0, -5.6 + (k % 2) * 0.12, g); S.dinerCurtains.push(c); }
    box(8.6, 0.7, 0.3, std({ color: '#a01a22', roughness: 0.95 }), 0, 5.4, -5.4, g); box(8.6, 0.12, 0.32, '#e8c050', 0, 5.02, -5.38, g);
    // logo sign above the stage
    if (dinerLogo) { const t = new THREE.CanvasTexture(dinerLogo); t.colorSpace = THREE.SRGBColorSpace; const lw = 3.6, lh = lw * dinerLogo.height / dinerLogo.width;
      const lg = new THREE.Mesh(new THREE.PlaneGeometry(lw, lh), new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.2, roughness: 0.6, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.35 }));
      lg.position.set(0, 3.9, -5.75); g.add(lg); S.dinerLogoMesh = lg; }
    // tables, balloons, lights
    table(g, -3.2, 0.8, 2.2); table(g, 3.2, 0.8, 2.2); table(g, -3.2, 3.6, 2.2); table(g, 3.2, 3.6, 2.2);
    const r = rng(31); const bcols = ['#e83a3a', '#3a78e8', '#36b34a', '#f2c230', '#b048e0'];
    for (let i = 0; i < 12; i++) { const x = (r() - 0.5) * 13, z = -5 + r() * 9, y = 4.2 + r() * 1.4; const bl = voxelArt(['.xx.', 'xxxx', 'xxxx', '.xx.', '..x.'], { x: bcols[i % 5] }, 0.11, 0.4); bl.position.set(x, y, z); g.add(bl); box(0.015, 1.0, 0.015, '#ddd', x, y - 0.75, z, g); }
    for (let i = 0; i < 3; i++) stringLights(g, -7.5, 7.5, 5.7 - i * 0.3, -2 + i * 3, 0.4, i);
    bunting(g, -7.5, 7.5, 5.2, -5.8, 0.5, 3);
    S.dinerSpot = new THREE.SpotLight('#ffe6b0', 45, 16, 0.6, 0.55, 1.4); S.dinerSpot.position.set(0, 5.6, 1.5); S.dinerSpot.target.position.set(0, 1.6, -4.4);
    S.dinerSpot.castShadow = true; S.dinerSpot.shadow.mapSize.set(2048, 2048); S.dinerSpot.shadow.bias = -0.0005; s.add(S.dinerSpot, S.dinerSpot.target);
    S.dinerLamps = [lamp(g, -3.2, 5.9, 2.2, '#ffd8a0', 10, 11, true), lamp(g, 3.2, 5.9, 2.2, '#ffd8a0', 10, 11, false)];
    s.add(new THREE.HemisphereLight('#ffe0a0', '#3a2010', 0.9));
    S.diner = s;
  }

  // FAZBEAR'S FRIGHT HALL: grimy horror-attraction corridor along -z with a junction, wall speaker, ceiling camera.
  {
    const s = mkScene('#020302', '#020302', 6, 18); const g = new THREE.Group(); s.add(g);
    T.frFloor = canvas(8, 8, c2 => { const r = rng(17); c2.fillStyle = '#26261f'; c2.fillRect(0, 0, 8, 8); c2.fillStyle = '#171712'; c2.fillRect(0, 0, 4, 4); c2.fillRect(4, 4, 4, 4); for (let i = 0; i < 8; i++) { c2.fillStyle = 'rgba(0,0,0,0.3)'; c2.fillRect(r() * 8 | 0, r() * 8 | 0, 1, 1); } });
    const fl = plane(3.4, 30, std({ map: tex(T.frFloor, 3.4, 30), roughness: 0.55 }), g); fl.rotation.x = -Math.PI / 2; fl.position.z = -10;
    T.frWall = canvas(32, 32, c2 => { const r = rng(23); c2.fillStyle = '#34402f'; c2.fillRect(0, 0, 32, 32); for (let i = 0; i < 70; i++) { c2.fillStyle = `rgba(0,0,0,${0.12 + r() * 0.3})`; c2.fillRect(r() * 32 | 0, r() * 32 | 0, 1 + (r() * 4 | 0), 1 + (r() * 2 | 0)); }
      c2.fillStyle = '#22281e'; c2.fillRect(0, 24, 32, 8); for (let x = 0; x < 32; x += 4) { c2.fillStyle = (x / 4) % 2 ? '#3a3a32' : '#1e1e1a'; c2.fillRect(x, 26, 4, 4); }
      for (let i = 0; i < 6; i++) { c2.fillStyle = 'rgba(60,20,10,0.45)'; c2.fillRect(r() * 32 | 0, (r() * 18) | 0, 1, 3 + (r() * 6 | 0)); } });
    const wm = std({ map: tex(T.frWall, 10, 1), roughness: 0.92 });
    for (const sx of [-1, 1]) { const w = plane(30, 3.2, wm, g); w.position.set(sx * 1.7, 1.6, -10); w.rotation.y = -sx * Math.PI / 2; }
    const ceil = plane(3.4, 30, std({ color: '#0a0c0a' }), g); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3.2, -10);
    const back = plane(3.4, 3.2, wm, g); back.position.set(0, 1.6, -24.5); const front = plane(3.4, 3.2, wm, g); front.position.set(0, 1.6, 4.5); front.rotation.y = Math.PI;
    // dark side openings (junctions)
    for (const z of [-6, -15]) box(0.05, 2.5, 1.6, '#010101', -1.68, 1.25, z, g);
    box(0.05, 2.5, 1.6, '#010101', 1.68, 1.25, -11, g);
    // pipes + hanging wires
    box(0.12, 0.12, 30, '#3a3a34', -1.4, 3.0, -10, g); box(0.08, 0.08, 30, '#5a3a24', -1.2, 3.05, -10, g);
    const r = rng(41); for (let i = 0; i < 9; i++) { const z = 2 - i * 3.1, x = (r() - 0.5) * 2.4, l = 0.4 + r() * 0.9; box(0.025, l, 0.025, i % 2 ? '#1a1a1a' : '#5a1a1a', x, 3.2 - l / 2, z, g); }
    // junk: boxes, old arcade, cardboard cut-outs (drawings), a mangled head on a shelf
    box(0.6, 0.6, 0.6, '#3a3022', 1.2, 0.3, -3.2, g); box(0.45, 0.45, 0.45, '#2e2618', 1.25, 0.82, -3.1, g); box(0.5, 0.4, 0.5, '#3a3022', -1.2, 0.2, -8.5, g);
    box(0.7, 1.8, 0.6, '#1e1e24', 1.3, 0.9, -13, g); box(0.5, 0.4, 0.04, emis('#3a6a4a', 0.6), 1.0, 1.4, -13, g).rotation.y = -Math.PI / 2;
    for (let i = 0; i < 5; i++) { const pp = plane(0.55, 0.6, std({ map: tex(T.drawing(i + 3)), color: '#7a8a6a' }), g); const sx = i % 2 ? 1 : -1; pp.position.set(sx * 1.68, 1.8, 0.5 - i * 4.4); pp.rotation.y = -sx * Math.PI / 2; pp.rotation.z = (i % 3 - 1) * 0.12; }
    // wall speaker (left wall, z = -12) where the Balloon Boy audio plays
    const sp = new THREE.Group(); sp.position.set(-1.62, 2.35, -12); sp.rotation.y = Math.PI / 2; g.add(sp);
    box(0.55, 0.45, 0.14, '#1e1e1c', 0, 0, 0, sp); for (let k = 0; k < 4; k++) box(0.4, 0.03, 0.02, '#4a4a44', 0, -0.12 + k * 0.08, 0.075, sp);
    S.speaker = sp; S.speakerPos = new THREE.Vector3(-1.5, 2.35, -12);
    S.speakerLed = box(0.05, 0.05, 0.03, std({ color: '#222', emissive: '#40ff60', emissiveIntensity: 0 }), 0.22, 0.17, 0.08, sp);
    // ceiling camera
    const cm = new THREE.Group(); cm.position.set(1.4, 3.0, -4); g.add(cm); box(0.1, 0.25, 0.1, '#2a2a2a', 0, -0.1, 0, cm); box(0.18, 0.14, 0.3, '#3a3a3a', 0, -0.26, 0.05, cm).rotation.x = 0.4;
    S.camLed = box(0.03, 0.03, 0.03, std({ color: '#300', emissive: '#ff2020', emissiveIntensity: 2 }), 0, -0.24, 0.22, cm);
    S.frLamps = [];
    for (const z of [1, -5, -11, -17, -22]) S.frLamps.push(lamp(g, 0, 3.15, z, '#c8ffc0', 8, 8, z === -5 || z === -11));
    s.add(new THREE.HemisphereLight('#7aaa8a', '#101410', 1.1));
    S.fright = s;
  }
  return S;
}

// ======================= Blob (Security Breach) sets =======================
// The Blob: a mound of tangled cables (instanced boxes), blinking red LEDs and waving cable tentacles.
export function buildBlob() {
  const g = new THREE.Group(); const r = rng(808);
  const N = 2600; const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.25 });
  const im = new THREE.InstancedMesh(geo, mat, N); im.castShadow = true; im.receiveShadow = true;
  const cols = ['#2a1a14', '#1a1210', '#3a2418', '#4a2a1c', '#5a1a14', '#222226', '#6a3a22', '#3a3a3e', '#7a2a1a'].map(c => new THREE.Color(c));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
  const RX = 2.7, RY = 3.3, RZ = 2.2;
  for (let i = 0; i < N; i++) {
    const u = r() * Math.PI * 2, v = Math.acos(1 - r() * 1.05); const layer = 0.78 + 0.22 * Math.sqrt(r());
    p.set(Math.sin(v) * Math.cos(u) * RX * layer, Math.cos(v) * RY * layer, Math.sin(v) * Math.sin(u) * RZ * layer);
    p.y += (r() - 0.5) * 0.15; if (p.y < 0.03) p.y = 0.03 + r() * 0.1; if (Math.abs(p.x) < 1.3 && p.y > 2.2 && p.z > 0.05) p.z = -p.z; // keep Funtime Freddy's face (top) clear
    e.set(r() * Math.PI, r() * Math.PI, r() * Math.PI); q.setFromEuler(e);
    const th = 0.05 + r() * 0.07; sc.set(th, th, 0.35 + r() * 1.0);
    m4.compose(p, q, sc); im.setMatrixAt(i, m4); im.setColorAt(i, cols[(r() * cols.length) | 0]);
  }
  g.add(im);
  // cable 'neck' holding Funtime Freddy's head on the very top (below the head, never in front of the face)
  { const nk = new THREE.InstancedMesh(geo, mat, 46); for (let i = 0; i < 46; i++) { p.set((r() - 0.5) * 0.8, 2.95 + r() * 0.38, -0.25 + r() * 0.6); e.set(r() * Math.PI, r() * Math.PI, r() * Math.PI); q.setFromEuler(e); const th = 0.05 + r() * 0.06; sc.set(th, th, 0.3 + r() * 0.45); m4.compose(p, q, sc); nk.setMatrixAt(i, m4); nk.setColorAt(i, cols[(r() * cols.length) | 0]); } nk.castShadow = true; g.add(nk); }
  // inner dark core (hides gaps)
  const core = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshStandardMaterial({ color: '#0e0806', roughness: 1 }));
  core.scale.set(RX * 0.8, RY * 0.8, RZ * 0.8); g.add(core);
  // LEDs
  const ledMat = new THREE.MeshBasicMaterial({ color: '#ff2a2a', toneMapped: false });
  const leds = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), ledMat, 70);
  const ledPos = [];
  for (let i = 0; i < 70; i++) { const u = r() * Math.PI * 2, v = Math.acos(1 - r() * 0.95); p.set(Math.sin(v) * Math.cos(u) * RX * 1.01, Math.cos(v) * RY * 1.01, Math.sin(v) * Math.sin(u) * RZ * 1.01); ledPos.push(p.clone()); m4.makeTranslation(p.x, p.y, p.z); leds.setMatrixAt(i, m4); }
  g.add(leds); g.userData.leds = leds; g.userData.ledPos = ledPos;
  // tentacles: chains of cable segments
  const tents = []; const tm = new THREE.MeshStandardMaterial({ color: '#2a1a14', roughness: 0.6, metalness: 0.3 }); const tm2 = new THREE.MeshStandardMaterial({ color: '#5a1a14', roughness: 0.6, metalness: 0.3 });
  for (let k = 0; k < 9; k++) {
    const a = -Math.PI * 0.85 + k * (Math.PI * 1.7 / 8); const root = new THREE.Group(); root.position.set(Math.sin(a) * RX * 0.92, 0.25 + (k % 3) * 0.5, Math.cos(a) * RZ * 0.92); root.rotation.y = a; g.add(root);
    let par = root; const segs = []; for (let s = 0; s < 12; s++) { const n = new THREE.Group(); n.position.z = s ? 0.32 : 0; par.add(n); const b = new THREE.Mesh(new THREE.BoxGeometry(0.16 - s * 0.008, 0.16 - s * 0.008, 0.36), s % 3 ? tm : tm2); b.position.z = 0.16; b.castShadow = true; n.add(b); segs.push(n); par = n; }
    tents.push({ root, segs, k });
  }
  g.userData.tents = tents;
  // mask anchors (front, z+) — local coords
  g.userData.anchors = { chica: new THREE.Vector3(-1.05, 2.25, 1.55), baby: new THREE.Vector3(0.95, 2.75, 1.35), puppet: new THREE.Vector3(0.05, 1.45, 2.0), ffreddy: new THREE.Vector3(0.0, 3.68, 0.3) };
  return g;
}
export function animateBlob(blob, t, amt = 1, reach = 0) {
  for (const { segs, k } of blob.userData.tents) segs.forEach((n, s) => { n.rotation.x = (0.1 + 0.06 * s * 0) + 0.18 * Math.sin(t * 1.6 + k * 1.3 + s * 0.45) * amt - 0.02 * s * (1 - reach); n.rotation.y = 0.14 * Math.sin(t * 1.1 + k + s * 0.3) * amt; });
  const leds = blob.userData.leds, m4 = new THREE.Matrix4();
  blob.userData.ledPos.forEach((p, i) => { const on = Math.sin(t * (2 + (i % 5)) + i * 1.7) > -0.2; m4.makeScale(on ? 1 : 0.001, on ? 1 : 0.001, on ? 1 : 0.001); m4.setPosition(p); leds.setMatrixAt(i, m4); });
  leds.instanceMatrix.needsUpdate = true;
}

export function buildBlobSets(S, sbLogo) {
  // PIZZAPLEX ATRIUM: dark hall, colourful floor, neon PIZZAPLEX sign, neon columns.
  {
    const s = mkScene('#04020a', '#04020a', 14, 34); const g = new THREE.Group(); s.add(g);
    T.plexFloor = canvas(16, 16, c2 => { c2.fillStyle = '#14101e'; c2.fillRect(0, 0, 16, 16); const cc = ['#ff3aa0', '#3ad8ff', '#ffd23a', '#8a4aff']; const r = rng(5); for (let i = 0; i < 10; i++) { c2.fillStyle = cc[i % 4]; c2.fillRect(r() * 16 | 0, r() * 16 | 0, 2, 1); } c2.fillStyle = '#1e1830'; c2.fillRect(0, 0, 16, 1); c2.fillRect(0, 0, 1, 16); });
    const fl = plane(30, 30, std({ map: tex(T.plexFloor, 15, 15), roughness: 0.25, metalness: 0.2 }), g); fl.rotation.x = -Math.PI / 2;
    const wall = plane(30, 14, std({ color: '#0c0a16', roughness: 0.8 }), g); wall.position.set(0, 7, -10);
    T.neonText = (txt, col, w, h) => canvas(w, h, c2 => { c2.font = `bold ${h * 0.7}px "DejaVu Sans", sans-serif`; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillStyle = col; c2.fillText(txt, w / 2, h / 2); });
    const neon = (txt, col, x, y, z, w, h, cw = 512, chh = 96) => { const t = new THREE.CanvasTexture(T.neonText(txt, col, cw, chh)); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, color: '#ffffff' })); m.position.set(x, y, z); g.add(m); return m; };
    S.plexSign = neon('PIZZAPLEX', '#ff5ad0', 0, 6.4, -9.9, 9, 1.7);
    for (let i = 0; i < 9; i++) { const c = ['#ff3aa0', '#3ad8ff', '#ffd23a', '#8a4aff'][i % 4]; box(0.12, 2.6 + (i % 3) * 0.6, 0.12, new THREE.MeshBasicMaterial({ color: c, toneMapped: false }), -4 + i, 2.8, -9.8, g); }
    box(9, 0.3, 0.3, new THREE.MeshBasicMaterial({ color: '#ffd23a', toneMapped: false }), 0, 1.5, -9.8, g);
    for (const x of [-7, -3.5, 3.5, 7]) for (const z of [-6, 0]) { box(0.7, 9, 0.7, '#181424', x, 4.5, z, g); box(0.74, 0.12, 0.74, new THREE.MeshBasicMaterial({ color: ['#ff3aa0', '#3ad8ff'][(x > 0) | 0], toneMapped: false }), x, 3.2, z, g); box(0.74, 0.12, 0.74, new THREE.MeshBasicMaterial({ color: '#8a4aff', toneMapped: false }), x, 6.2, z, g); }
    if (sbLogo) { const t = new THREE.CanvasTexture(sbLogo); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2 * sbLogo.height / sbLogo.width), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, depthWrite: false })); m.position.set(0, 3.6, -9.85); g.add(m); }
    for (const [c, x] of [['#ff3aa0', -5], ['#3ad8ff', 5], ['#8a4aff', 0]]) { const l = new THREE.PointLight(c, 14, 14, 1.5); l.position.set(x, 4, -5); s.add(l); }
    S.plexKey = new THREE.SpotLight('#ffe8f0', 30, 20, 0.6, 0.6, 1.3); S.plexKey.position.set(0, 9, 6); S.plexKey.target.position.set(0, 1, -2); S.plexKey.castShadow = true; S.plexKey.shadow.mapSize.set(2048, 2048); S.plexKey.shadow.bias = -0.0005; s.add(S.plexKey, S.plexKey.target);
    s.add(new THREE.HemisphereLight('#8a6aff', '#1a0a1a', 0.7));
    S.plex = s;
  }
  // UNDERGROUND (subsolo): big concrete chamber lit red, pipes, cables on walls; the Blob sits at z=-3.
  {
    const s = mkScene('#070202', '#070202', 9, 26); const g = new THREE.Group(); s.add(g);
    T.ugFloor = canvas(16, 16, c2 => { const r = rng(91); c2.fillStyle = '#3a3634'; c2.fillRect(0, 0, 16, 16); for (let i = 0; i < 60; i++) { c2.fillStyle = `rgba(0,0,0,${0.08 + r() * 0.2})`; c2.fillRect(r() * 16 | 0, r() * 16 | 0, 1 + (r() * 3 | 0), 1); } c2.fillStyle = 'rgba(0,0,0,0.35)'; c2.fillRect(0, 0, 16, 1); c2.fillRect(0, 0, 1, 16); });
    const fl = plane(16, 26, std({ map: tex(T.ugFloor, 8, 13), roughness: 0.6, metalness: 0.1 }), g); fl.rotation.x = -Math.PI / 2; fl.position.z = 3;
    T.ugWall = canvas(32, 32, c2 => { const r = rng(92); c2.fillStyle = '#2e2a28'; c2.fillRect(0, 0, 32, 32); for (let i = 0; i < 90; i++) { c2.fillStyle = `rgba(0,0,0,${0.1 + r() * 0.25})`; c2.fillRect(r() * 32 | 0, r() * 32 | 0, 1 + (r() * 4 | 0), 1 + (r() * 2 | 0)); } c2.fillStyle = '#c8a020'; for (let x = 0; x < 32; x += 8) { c2.fillRect(x, 28, 4, 4); } c2.fillStyle = '#1a1a1a'; for (let x = 4; x < 32; x += 8) c2.fillRect(x, 28, 4, 4); });
    const wm = std({ map: tex(T.ugWall, 6, 1.6), roughness: 0.9 });
    const back = plane(16, 8, wm, g); back.position.set(0, 4, -8);
    for (const sx of [-1, 1]) { const w = plane(26, 8, wm, g); w.position.set(sx * 8, 4, 3); w.rotation.y = -sx * Math.PI / 2; }
    const ceil = plane(16, 26, std({ color: '#0a0606' }), g); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 8, 3);
    const r = rng(93);
    for (let i = 0; i < 7; i++) box(0.25, 0.25, 26, ['#4a4440', '#5a3a22', '#3a3a40'][i % 3], -7.5 + (i % 2) * 0.4, 6.4 - i * 0.45, 3, g);
    for (let i = 0; i < 7; i++) box(0.2, 0.2, 26, ['#4a4440', '#3a3a40'][i % 2], 7.5 - (i % 2) * 0.3, 6.8 - i * 0.5, 3, g);
    for (let i = 0; i < 30; i++) { const x = (r() - 0.5) * 15, z = -7 + r() * 18, l = 0.5 + r() * 2.5; box(0.04, l, 0.04, r() > 0.5 ? '#1a1a1a' : '#5a1a14', x, 8 - l / 2, z, g); }
    for (let i = 0; i < 40; i++) { const sx = i % 2 ? 1 : -1; box(0.05, 0.05, 0.4 + r() * 1.4, '#2a1a14', sx * 7.95, 0.5 + r() * 5, -7 + r() * 18, g).rotation.x = r() * 3; }
    box(1.6, 3, 0.1, '#020101', 0, 1.5, 15.9, g); // exit
    S.ugRed = [];
    for (const [x, z] of [[-7.6, -4], [7.6, -4], [-7.6, 4], [7.6, 4], [0, -7.6]]) { box(0.3, 0.2, 0.2, new THREE.MeshBasicMaterial({ color: '#ff2020', toneMapped: false }), x, 5.4, z, g); const l = new THREE.PointLight('#ff3020', 14, 12, 1.3); l.position.set(x * 0.9, 5.2, z); s.add(l); S.ugRed.push(l); }
    S.ugKey = new THREE.SpotLight('#ffd0c0', 45, 22, 0.7, 0.6, 1.3); S.ugKey.position.set(2, 7.5, 6); S.ugKey.target.position.set(0, 1.5, -3); S.ugKey.castShadow = true; S.ugKey.shadow.mapSize.set(2048, 2048); S.ugKey.shadow.bias = -0.0006; s.add(S.ugKey, S.ugKey.target);
    S.ugFill = new THREE.PointLight('#ffd8c8', 10, 12, 1.3); S.ugFill.position.set(0.5, 3.4, 2.4); s.add(S.ugFill);
    s.add(new THREE.HemisphereLight('#b08080', '#200a0a', 1.35));
    S.ug = s;
  }
  // FIRE: the old pizzeria burning (party room + flames + smoke + orange lights)
  {
    const s = S.party; const g = new THREE.Group(); g.visible = false; s.add(g); S.fireGroup = g;
    const fm = [new THREE.MeshBasicMaterial({ color: '#ffd040', toneMapped: false, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }), new THREE.MeshBasicMaterial({ color: '#ff6a10', toneMapped: false, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }), new THREE.MeshBasicMaterial({ color: '#ff2a08', toneMapped: false, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })];
    const r = rng(77); S.flames = [];
    for (let i = 0; i < 260; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), fm[i % 3]); m.userData = { x: (r() - 0.5) * 13, z: -4.8 + r() * 10, ph: r(), sp: 0.6 + r() * 0.9, sz: 0.12 + r() * 0.3 }; g.add(m); S.flames.push(m); }
    const sm2 = new THREE.MeshBasicMaterial({ color: '#100806', transparent: true, opacity: 0.45, depthWrite: false }); S.smoke = [];
    for (let i = 0; i < 60; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), sm2); m.userData = { x: (r() - 0.5) * 13, z: -4.5 + r() * 9, ph: r(), sp: 0.25 + r() * 0.3 }; g.add(m); S.smoke.push(m); }
    S.fireLights = []; for (const [x, z] of [[-3, -2], [3, -1], [0, 2.5]]) { const l = new THREE.PointLight('#ff7a20', 0, 10, 1.4); l.position.set(x, 1.6, z); s.add(l); S.fireLights.push(l); }
  }
  return S;
}
export function animateFire(S, t, on) {
  S.fireGroup.visible = on; S.fireLights.forEach((l, i) => l.intensity = on ? 14 * (0.75 + 0.25 * Math.sin(t * 13 + i * 2) * Math.sin(t * 7.7 + i)) : 0); if (!on) return;
  S.flames.forEach(m => { const d = m.userData; const k = (t * d.sp + d.ph) % 1; m.position.set(d.x + 0.15 * Math.sin(t * 3 + d.ph * 9), k * 3.2, d.z); m.scale.setScalar(d.sz * (1 - k) * 1.6 + 0.02); m.rotation.set(t + d.ph, t * 0.7, 0); });
  S.smoke.forEach(m => { const d = m.userData; const k = (t * d.sp + d.ph) % 1; m.position.set(d.x, 2 + k * 4, d.z); m.scale.setScalar(0.4 + k * 1.2); });
}

// ======================= Glamrock Bonnie (Security Breach / Ruin) video =======================
const NM = (c, o = 1) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: o < 1, opacity: o });
function neonCanvas(w, h, draw) { return canvas(w, h, g => { g.lineCap = 'round'; g.lineJoin = 'round'; draw(g, w, h); }); }
function glowStroke(g, col, wd, path) { for (const [blur, lw, a] of [[18, wd * 2.2, 0.35], [8, wd * 1.4, 0.6], [0, wd, 1]]) { g.save(); g.shadowColor = col; g.shadowBlur = blur; g.strokeStyle = col; g.globalAlpha = a; g.lineWidth = lw; g.beginPath(); path(g); g.stroke(); g.restore(); } g.save(); g.strokeStyle = '#ffffff'; g.globalAlpha = 0.8; g.lineWidth = wd * 0.35; g.beginPath(); path(g); g.stroke(); g.restore(); }
function glowText(g, txt, x, y, size, col, font = 'bold') { g.font = `${font} ${size}px "DejaVu Sans", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const [blur, a] of [[22, 0.5], [10, 0.8]]) { g.save(); g.shadowColor = col; g.shadowBlur = blur; g.globalAlpha = a; g.fillStyle = col; g.fillText(txt, x, y); g.restore(); }
  g.fillStyle = col; g.fillText(txt, x, y); g.save(); g.globalAlpha = 0.65; g.fillStyle = '#ffffff'; g.font = `${font} ${size * 0.92}px "DejaVu Sans", sans-serif`; g.fillText(txt, x, y); g.restore(); }
function signPlane(cv, w, h, parent, o = 1) { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, depthWrite: false, opacity: o })); if (parent) parent.add(m); return m; }
// ---- real 3D neon: polylines -> thin emissive tubes; voxel letters; stars ----
function tubes(parent, lines, mat, th = 0.06) { const g = new THREE.Group(); if (parent) parent.add(g);
  for (const P of lines) for (let i = 0; i < P.length - 1; i++) { const [x0, y0] = P[i], [x1, y1] = P[i + 1]; const len = Math.hypot(x1 - x0, y1 - y0); if (len < 1e-4) continue;
    const b = new THREE.Mesh(new THREE.BoxGeometry(len + th * 0.9, th, th), mat); b.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); b.rotation.z = Math.atan2(y1 - y0, x1 - x0); g.add(b); }
  return g; }
const arcPts = (cx, cy, r, a0, a1, n = 18) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
const ellPts = (cx, cy, rx, ry, n = 28) => Array.from({ length: n + 1 }, (_, i) => { const a = i / n * Math.PI * 2; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
const starPts = (cx, cy, R, r) => Array.from({ length: 11 }, (_, i) => { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; });
const bezPts = (p0, p1, p2, p3, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [0, 1].map(k => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]); });
function voxelText(parent, txt, mat, px, size = 11) { const c = document.createElement('canvas'); let g2 = c.getContext('2d'); const font = `bold ${size}px "DejaVu Sans", sans-serif`; g2.font = font;
  const w = Math.ceil(g2.measureText(txt).width) + 2, h = Math.ceil(size * 1.25); c.width = w; c.height = h; g2 = c.getContext('2d'); g2.font = font; g2.textBaseline = 'middle'; g2.fillStyle = '#fff'; g2.fillText(txt, 1, h / 2 + 1);
  const d = g2.getImageData(0, 0, w, h).data; const pts = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 120) pts.push([x, y]);
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(px * 0.94, px * 0.94, px * 0.7), mat, pts.length); const m4 = new THREE.Matrix4();
  pts.forEach(([x, y], i) => { m4.makeTranslation((x - w / 2) * px, (h / 2 - y) * px, 0); im.setMatrixAt(i, m4); }); const grp = new THREE.Group(); grp.add(im); if (parent) parent.add(grp); return grp; }
function palm(parent, x, z, h = 3.2, leaf = '#b8d23a') { const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g); const r = rng((x * 13 + z * 7) | 0);
  for (let i = 0; i < 7; i++) box(0.28 - i * 0.015, h / 7 + 0.02, 0.28 - i * 0.015, i % 2 ? '#6a4a2a' : '#5a3a1e', Math.sin(i * 0.5) * 0.06, h / 14 + i * h / 7, 0, g);
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + r() * 0.3; const lf = new THREE.Group(); lf.position.set(0, h, 0); lf.rotation.y = a; g.add(lf);
    for (let j = 0; j < 4; j++) { const b = box(0.32 - j * 0.04, 0.05, 0.42, std({ color: leaf, emissive: leaf, emissiveIntensity: 0.12 }), 0, -j * j * 0.06, 0.3 + j * 0.38, lf); b.rotation.x = 0.25 + j * 0.12; } }
  return g; }
function pin(parent, x, z, s = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g); box(0.09, 0.16, 0.09, '#f4f4f4', 0, 0.08, 0, g); box(0.12, 0.08, 0.12, '#f4f4f4', 0, 0.2, 0, g); box(0.07, 0.05, 0.07, '#d82a2a', 0, 0.27, 0, g); box(0.08, 0.08, 0.08, '#f4f4f4', 0, 0.33, 0, g); return g; }

export function buildBonnieSets(S) {
  const neonMats = []; const nm = (c, o) => { const m = NM(c, o); neonMats.push([m, new THREE.Color(c)]); return m; };
  // ---------------- MEGA PIZZAPLEX ATRIUM ----------------
  {
    const s = mkScene('#07020c', '#0a0312', 18, 46); const g = new THREE.Group(); s.add(g); S.atRoot = g;
    const flT = canvas(32, 32, c2 => { c2.fillStyle = '#060608'; c2.fillRect(0, 0, 32, 32); c2.fillStyle = '#0e0e14'; c2.fillRect(1, 1, 14, 14); c2.fillRect(17, 17, 14, 14); c2.fillStyle = '#12303a'; c2.fillRect(0, 0, 32, 1); c2.fillRect(0, 16, 32, 1); c2.fillRect(0, 0, 1, 32); c2.fillRect(16, 0, 1, 32); });
    const fl = plane(36, 50, std({ map: tex(flT, 18, 25), roughness: 0.12, metalness: 0.35 }), g); fl.rotation.x = -Math.PI / 2; fl.position.z = -6;
    // neon strip lines along the walkway
    for (const x of [-2.4, 2.4]) box(0.06, 0.02, 22, nm('#3ae8ff'), x, 0.01, -3, g);
    const mag = std({ color: '#6a0e3e', roughness: 0.55 }), magD = std({ color: '#3a0624', roughness: 0.6 });
    for (const sx of [-1, 1]) {
      const blk = new THREE.Group(); blk.position.set(sx * 5.6, 0, 3); g.add(blk);
      box(5, 8, 10, mag, 0, 4, 0, blk); box(5.2, 0.4, 10.2, magD, 0, 8.1, 0, blk);
      // curved neon bands on the inner face + front
      for (const [y, c] of [[2.1, '#cfe8ff'], [2.9, '#ff5ad8'], [3.7, '#cfe8ff']]) { box(0.12, 0.42, 10.1, nm(c), -sx * 2.52, y, 0, blk); box(5.1, 0.42, 0.12, nm(c), 0, y, 5.03, blk); }
      box(0.1, 8, 0.1, nm('#ff5ad8'), -sx * 2.55, 4, -5.0, blk);
      const pl = new THREE.PointLight(sx < 0 ? '#ff3ac8' : '#8a5aff', 22, 13, 1.4); pl.position.set(sx * 2.2, 4.5, 4); s.add(pl);
    }
    // neon signs on the block fronts
    for (const sx of [-1, 1]) { const sg = new THREE.Group(); sg.position.set(sx * 5.4, 6.2, 8.2); g.add(sg);
      box(4.5, 2.3, 0.12, '#1a0414', 0, 0, -0.08, sg);
      tubes(sg, [arcPts(0, -0.55, 1.75, Math.PI * 0.12, Math.PI * 0.88, 22)], nm('#ff6ad8'), 0.07);
      const t1 = voxelText(sg, "FREDDY FAZBEAR'S", nm('#ff8ae0'), 0.026, 11); t1.position.set(0, 0.62, 0.02);
      const t2 = voxelText(sg, 'MEGA PIZZAPLEX', nm('#ffffff'), 0.031, 11); t2.position.set(0, -0.1, 0.02);
      tubes(sg, [[[-0.65, -0.45], [0.65, -0.45]]], nm('#3ae8ff'), 0.05);
      for (const bx of [-1, 1]) tubes(sg, [[[bx * 2.15, 0.05], [bx * 1.85, 0.25], [bx * 1.95, -0.05], [bx * 1.6, 0.15]]], nm('#ffd23a'), 0.07); }
    // back wall + big video screens
    const back = plane(36, 14, std({ color: '#140818', roughness: 0.7 }), g); back.position.set(0, 7, -18);
    box(14, 2.8, 0.2, '#0c0610', 0, 5.6, -17.95, g);
    { const cols = ['#ff3ac8', '#a05aff', '#3ae8ff', '#ff6ad8']; for (let i = 0; i < 36; i++) { const x = -6.7 + i * 0.383; const h = 0.6 + 1.6 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.23)); box(0.22, h, 0.05, nm(cols[i % 4]), x, 5.6, -17.82, g); }
      box(14, 0.06, 0.06, nm('#ffffff'), 0, 7.0, -17.8, g); box(14, 0.06, 0.06, nm('#ffffff'), 0, 4.2, -17.8, g); }
    // escalators to the upper floor
    for (const sx of [-1, 1]) { const e = new THREE.Group(); e.position.set(sx * 3.3, 0, -13.5); g.add(e); const len = 6.2; const a = Math.atan2(4, 5);
      const ramp = box(1.3, 0.3, len, std({ color: '#2a2a30', metalness: 0.6, roughness: 0.3 }), 0, 2, 0, e); ramp.rotation.x = a;
      for (const dx of [-0.75, 0.75]) { const side = box(0.15, 0.9, len, mag, dx, 2.45, 0, e); side.rotation.x = a; const strip = box(0.06, 0.06, len, nm('#3ae8ff'), dx, 2.95, 0, e); strip.rotation.x = a; } }
    box(36, 0.4, 4, magD, 0, 4.0, -16.5, g); box(36, 0.08, 0.08, nm('#ff5ad8'), 0, 4.25, -14.5, g);
    for (let x = -14; x <= 14; x += 1.2) box(0.05, 0.8, 0.05, '#888', x, 4.6, -14.5, g);
    // central glass column + statue pedestal
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 11, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#3a1a4a', transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.4 })); col.position.set(0, 5.5, -13.2); g.add(col);
    for (const a of [0, 1.57, 3.14, 4.71]) box(0.06, 11, 0.06, nm('#ff6ad8'), Math.cos(a) * 0.9, 5.5, -13.2 + Math.sin(a) * 0.9, g);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.2, 0.7, 32), std({ color: '#121216', roughness: 0.3, metalness: 0.5 })); ped.position.set(0, 0.35, -10); g.add(ped);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.04, 6, 48), nm('#3ae8ff')); ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.7, -10); g.add(ring);
    S.statuePos = new THREE.Vector3(0, 0.7, -10);
    for (const [x, z] of [[-3.0, -9.2], [3.0, -9.2], [-3.4, -11.6], [3.4, -11.6]]) palm(g, x, z, 3.4);
    // hanging banners
    const banner = (col, face) => canvas(32, 96, c2 => { for (let y = 0; y < 96; y += 8) for (let x = 0; x < 32; x += 8) { c2.fillStyle = ((x + y) / 8) % 2 ? '#e83a7a' : '#a8104a'; c2.fillRect(x, y, 8, 8); } });
    [[-2.6, '#e8e8f0', '#6a2ad8'], [2.6, '#9aa0b8', '#ffd23a']].forEach(([x, c, f]) => { const p = plane(1.0, 3.0, std({ map: tex(banner(c, f)), side: THREE.DoubleSide, emissive: '#ffffff', emissiveMap: tex(banner(c, f)), emissiveIntensity: 0.35 }), g); p.position.set(x * 0.75, 7.6, -7.5); });
    // ceiling with ring of round lights
    const ceil = plane(36, 50, std({ color: '#050307' }), g); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 10, -6);
    const ringC = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.5, 40, 1, true), std({ color: '#1a1020', side: THREE.DoubleSide })); ringC.position.set(0, 9.6, -9); g.add(ringC);
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; box(0.18, 0.04, 0.18, nm('#fff2c8'), Math.cos(a) * 4.1, 9.33, -9 + Math.sin(a) * 4.1, g); }
    for (let i = 0; i < 10; i++) for (const sx of [-1, 1]) box(0.16, 0.04, 0.16, nm('#fff2c8'), sx * 5.2, 9.9, 6 - i * 2.2, g);
    // stanchions with cyan bands + rope
    for (let x = -2.9; x <= 2.91; x += 0.95) { if (Math.abs(x) < 1.0) continue; const p = new THREE.Group(); p.position.set(x, 0, -6.6); g.add(p);
      box(0.32, 1.0, 0.32, '#141418', 0, 0.5, 0, p); for (const y of [0.55, 0.72, 0.89]) box(0.34, 0.06, 0.34, nm('#7af0ff'), 0, y, 0, p); }
    for (const sx of [-1, 1]) box(1.9, 0.04, 0.04, '#5a4a2a', sx * 1.95, 0.85, -6.6, g);
    // side checker floor
    for (const sx of [-1, 1]) { const cf = plane(6, 14, std({ map: tex(T.checker, 6, 14), roughness: 0.2, color: '#9a9aa8' }), g); cf.rotation.x = -Math.PI / 2; cf.position.set(sx * 13, 0.005, -4); }
    // lights
    S.atStatueSpot = new THREE.SpotLight('#ffe0a0', 60, 18, 0.45, 0.5, 1.2); S.atStatueSpot.position.set(0, 9, -5); S.atStatueSpot.target.position.set(0, 2.5, -10); S.atStatueSpot.castShadow = true; S.atStatueSpot.shadow.mapSize.set(1024, 1024); s.add(S.atStatueSpot, S.atStatueSpot.target);
    S.atKey = new THREE.PointLight('#ffd8f0', 18, 18, 1.3); S.atKey.position.set(0, 6, 4); s.add(S.atKey);
    const cy = new THREE.PointLight('#3ae8ff', 3, 12, 1.5); cy.position.set(0, 3.0, -4); s.add(cy); S.atCyan = cy;
    S.atHemi = new THREE.HemisphereLight('#a05ac8', '#1a0a20', 1.4); s.add(S.atHemi);
    // RUIN overlay: debris, fallen banner, broken neon, water puddles
    const ru = new THREE.Group(); ru.visible = false; s.add(ru); S.atRuinG = ru; const r = rng(77);
    for (let i = 0; i < 70; i++) { const b = box(0.2 + r() * 0.9, 0.1 + r() * 0.4, 0.2 + r() * 0.9, ['#2a2228', '#3a2a32', '#4a3a3a', '#1a1a1e'][i % 4], (r() - 0.5) * 16, 0.1, -16 + r() * 22, ru); b.rotation.set(r() * 0.6, r() * 3, r() * 0.6); }
    for (let i = 0; i < 6; i++) { const b = box(2 + r() * 2, 0.15, 0.6, '#2a2a30', (r() - 0.5) * 10, 0.4 + r() * 0.6, -12 + r() * 14, ru); b.rotation.set(r() - 0.5, r() * 3, r() - 0.5); }
    const fb = plane(1.5, 4.4, std({ map: tex(banner('#e8e8f0', '#6a2ad8')), side: THREE.DoubleSide, color: '#777' }), ru); fb.rotation.set(-Math.PI / 2 + 0.15, 0, 0.6); fb.position.set(-1.6, 0.08, -6.5);
    for (let i = 0; i < 5; i++) { const pd = plane(1.5 + r() * 2.5, 1 + r() * 2, std({ color: '#0a0a12', roughness: 0.02, metalness: 0.6, transparent: true, opacity: 0.85 }), ru); pd.rotation.x = -Math.PI / 2; pd.position.set((r() - 0.5) * 8, 0.012, -12 + r() * 16); }
    S.atrium = s;
  }
  // ---------------- MAIN STAGE (Rockstar Row) ----------------
  {
    const s = mkScene('#05020a', '#07030e', 14, 34); const g = new THREE.Group(); s.add(g);
    const fl = plane(30, 24, std({ color: '#0a0a10', roughness: 0.15, metalness: 0.35 }), g); fl.rotation.x = -Math.PI / 2;
    const st = std({ color: '#1a1020', roughness: 0.4 });
    box(16, 1.0, 6, st, 0, 0.5, -4, g); box(16.2, 0.12, 0.12, nm('#ff5ad8'), 0, 1.0, -1.0, g); box(16.2, 0.12, 0.12, nm('#3ae8ff'), 0, 0.15, -0.98, g);
    for (let i = 0; i < 3; i++) box(3, 0.33, 0.6, st, 0, 0.17 + i * 0.33 - 0.33 * i * 0 , -0.7 + i * -0.0, g);
    // back LED wall
    box(15, 6.4, 0.2, '#0a0610', 0, 4.2, -7.1, g);
    { const bg = new THREE.Group(); bg.position.set(0, 1.0, -6.95); g.add(bg); S.stageNeon = bg;
      [['#ff3ac8', 5.2], ['#a05aff', 4.4], ['#3ae8ff', 3.6], ['#ffd23a', 2.8]].forEach(([c, r]) => tubes(bg, [arcPts(0, 0.1, r, 0.08, Math.PI - 0.08, 30)], nm(c), 0.09));
      for (let i = 0; i < 12; i++) { const a = 0.2 + i * (Math.PI - 0.4) / 11; tubes(bg, [[[Math.cos(a) * 1.2, 0.1 + Math.sin(a) * 1.2], [Math.cos(a) * 2.4, 0.1 + Math.sin(a) * 2.4]]], nm(i % 2 ? '#ffffff' : '#ff9ae8'), 0.05); }
      for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) box(0.12, 5.6, 0.08, nm(['#ff3ac8', '#3ae8ff'][k % 2]), sx * (5.9 + k * 0.32), 2.8, 0, bg); }
    // star logo + truss + speakers
    { const sg = tubes(g, [starPts(0, 0, 1.25, 0.5)], nm('#ffd23a'), 0.1); sg.position.set(0, 8.3, -6.85); }
    box(17, 0.3, 0.3, '#3a3a44', 0, 9.2, -2.5, g); box(17, 0.3, 0.3, '#3a3a44', 0, 9.2, -5.5, g);
    for (const sx of [-1, 1]) { box(0.3, 9.2, 0.3, '#3a3a44', sx * 8.3, 4.6, -2.5, g); for (let k = 0; k < 3; k++) { box(1.3, 1.3, 1.1, '#141418', sx * 7.1, 1.65 + k * 1.32, -5.2, g); const cone = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), std({ color: '#2a2a30' })); cone.position.set(sx * 7.1, 1.65 + k * 1.32, -4.64); g.add(cone); } }
    S.stageSpots = []; const cols = ['#ff3ac8', '#3ae8ff', '#ffd23a', '#8a5aff', '#5aff7a'];
    for (let i = 0; i < 5; i++) { const x = -6 + i * 3; box(0.35, 0.45, 0.35, '#222', x, 8.9, -2.5, g); box(0.25, 0.04, 0.25, nm(cols[i]), x, 8.66, -2.5, g);
      const sp = new THREE.SpotLight(cols[i], 40, 16, 0.32, 0.5, 1.2); sp.position.set(x, 8.8, -2.5); sp.target.position.set(x * 0.4, 1, -3.5); s.add(sp, sp.target); S.stageSpots.push(sp); }
    // instruments: mic stand (centre), keytar stand, drum riser, bass stand (Bonnie's spot)
    const mic = (x, z) => { box(0.04, 1.6, 0.04, '#aaa', x, 1.8, z, g); box(0.1, 0.18, 0.1, '#222', x, 2.65, z + 0.05, g); box(0.5, 0.04, 0.5, '#222', x, 1.02, z, g); };
    mic(0, -2.2); mic(4.6, -2.4);
    box(3, 0.5, 2.0, st, 0, 1.25, -5.3, g); for (const [x, r] of [[-0.7, 0.4], [0.7, 0.4], [0, 0.55]]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.4, 20), std({ color: '#e83a7a', metalness: 0.4, roughness: 0.3 })); d.position.set(x, 1.85, -5.0 + (x ? 0.3 : -0.4)); g.add(d); }
    S.stageFloorLight = new THREE.PointLight('#ff6ad8', 12, 12, 1.3); S.stageFloorLight.position.set(0, 3.5, 2); s.add(S.stageFloorLight);
    S.stageKey = new THREE.SpotLight('#fff0e0', 70, 20, 0.5, 0.5, 1.2); S.stageKey.position.set(0, 7, 6); S.stageKey.target.position.set(0, 1.5, -3.5); S.stageKey.castShadow = true; S.stageKey.shadow.mapSize.set(1024, 1024); s.add(S.stageKey, S.stageKey.target);
    s.add(new THREE.HemisphereLight('#8a5ad8', '#140a18', 0.7));
    S.mainstage = s;
  }
  // ---------------- BONNIE BOWL ----------------
  {
    const s = mkScene('#04030a', '#05040c', 12, 36); const g = new THREE.Group(); s.add(g);
    const woodT = canvas(16, 64, c2 => { const r = rng(31); for (let y = 0; y < 64; y++) { const v = 150 + r() * 30 | 0; c2.fillStyle = `rgb(${v},${v * 0.72 | 0},${v * 0.45 | 0})`; c2.fillRect(0, y, 16, 1); } for (let x = 0; x < 16; x += 4) { c2.fillStyle = 'rgba(0,0,0,0.18)'; c2.fillRect(x, 0, 1, 64); } });
    const wood = std({ map: tex(woodT, 1, 8), roughness: 0.25, metalness: 0.05 });
    const N = 6, LW = 1.15, GW = 0.32; S.lanesX = [];
    for (let i = 0; i < N; i++) { const x = (i - (N - 1) / 2) * (LW + GW); S.lanesX.push(x); const l = box(LW, 0.1, 18, wood, x, 0.05, -9, g);
      for (const sx of [-1, 1]) { box(GW * 0.5, 0.06, 18, '#a01020', x + sx * (LW / 2 + GW * 0.25), 0.02, -9, g); box(0.04, 0.04, 18, nm(i % 2 ? '#ff7ae0' : '#ffffff'), x + sx * (LW / 2 + 0.02), 0.12, -9, g); }
      for (let r = 0; r < 4; r++) for (let k = 0; k <= r; k++) pin(g, x + (k - r / 2) * 0.24, -16.8 - r * 0.22, 1); }
    // approach area: red/white checker carpet + red chairs + ball returns
    const ck = canvas(2, 2, c2 => { c2.fillStyle = '#c81a2a'; c2.fillRect(0, 0, 2, 2); c2.fillStyle = '#e8e2e8'; c2.fillRect(0, 0, 1, 1); c2.fillRect(1, 1, 1, 1); });
    const cp = plane(14, 6, std({ map: tex(ck, 7, 3), roughness: 0.8 }), g); cp.rotation.x = -Math.PI / 2; cp.position.set(0, 0.004, 3);
    for (let i = 0; i < 8; i++) { const x = -5 + i * 1.4; box(0.5, 0.08, 0.5, '#c81a2a', x, 0.45, 4.6, g); box(0.5, 0.5, 0.08, '#c81a2a', x, 0.7, 4.85, g); box(0.06, 0.45, 0.06, '#222', x, 0.22, 4.6, g); }
    for (let i = 0; i < 3; i++) { const x = -3.0 + i * 3.0; box(0.6, 0.6, 1.2, '#2a2a34', x, 0.3, 1.0, g); for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), std({ color: ['#3a7ae8', '#e83a7a', '#5ae87a'][k], roughness: 0.2, metalness: 0.3 })); b.position.set(x - 0.2 + k * 0.2, 0.7, 1.0); g.add(b); } }
    // walls with neon tubes (diagonal) + strings
    const wallM = std({ color: '#0e0a18', roughness: 0.8 });
    for (const sx of [-1, 1]) { const w = plane(26, 6, wallM, g); w.position.set(sx * 5.4, 3, -7); w.rotation.y = -sx * Math.PI / 2;
      for (let k = 0; k < 9; k++) { const z = 2 - k * 2.2, c = ['#7aff9a', '#ff9af0', '#f4f4ff'][k % 3]; const b = box(0.09, 2.6, 0.09, nm(c), sx * 5.3, 1.6, z, g); b.rotation.x = (k % 2 ? 0.35 : -0.3); b.rotation.z = sx * 0.15; } }
    const backW = plane(12, 6, wallM, g); backW.position.set(0, 3, -19.5);
    // scoreboards
    for (let i = 0; i < N; i += 2) { const x = (S.lanesX[i] + S.lanesX[i + 1]) / 2; box(2.4, 0.95, 0.12, '#141420', x, 3.0, -15.55, g);
      for (let r = 0; r < 3; r++) box(1.9 - r * 0.4, 0.1, 0.03, nm(['#3ae8ff', '#ff5ad8', '#ffd23a'][(i / 2 + r) % 3]), x - r * 0.2, 3.25 - r * 0.25, -15.47, g); }
    { const tg = new THREE.Group(); tg.position.set(0, 4.5, -19.4); g.add(tg); const t = voxelText(tg, 'BONNIE BOWL', nm('#7ab8ff'), 0.075, 11); tubes(tg, [arcPts(0, -0.2, 3.6, 0.15, Math.PI - 0.15, 24)], nm('#ff7ae0'), 0.07); }
    box(11, 1.1, 0.4, '#0a0a10', 0, 1.6, -15.7, g); // masking unit over the pins
    // ceiling neon stars
    S.bowlStars = []; [['#ff5ad8', -3, -3], ['#ffd23a', 2.5, -5], ['#a07aff', -1, -9], ['#7aff9a', 3, -11], ['#ffffff', -3.5, -13], ['#ff9a3a', 0.5, -15]].forEach(([c, x, z]) => { const m = tubes(g, [starPts(0, 0, 0.8, 0.33)], nm(c), 0.07); m.position.set(x, 5.6, z); m.rotation.x = Math.PI / 2 - 0.25; S.bowlStars.push(m); });
    const ceil = plane(12, 26, std({ color: '#06050a' }), g); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 6, -7);
    // big Bonnie head at the end of the centre lane
    { const h = new THREE.Group(); h.position.set(S.lanesX[2] + 0.7, 0, -18.4); g.add(h); S.bigHead = h; const bl = '#8aa8d8', bd = '#5a78b0';
      box(3.2, 2.6, 2.4, bl, 0, 1.6, 0, h); box(2.4, 1.0, 0.6, '#c8d6ee', 0, 0.9, 1.3, h); box(0.5, 0.35, 0.2, '#111', 0, 1.35, 1.62, h);
      for (const sx of [-1, 1]) { box(0.95, 0.95, 0.15, '#f4f0f0', sx * 0.75, 2.2, 1.22, h); box(0.6, 0.6, 0.1, nm('#ff5aa0'), sx * 0.75, 2.2, 1.31, h); box(0.28, 0.28, 0.1, '#111', sx * 0.75, 2.2, 1.37, h); box(0.9, 0.12, 0.1, '#1a1a2a', sx * 0.75, 2.8, 1.25, h);
        const ear = new THREE.Group(); ear.position.set(sx * 0.9, 2.9, -0.2); ear.rotation.z = -sx * 0.25; h.add(ear); box(0.8, 2.6, 0.5, bd, 0, 1.3, 0, ear); box(0.5, 2.1, 0.1, '#a8c0e8', 0, 1.35, 0.27, ear); } }
    // secret wall panel (right wall, near the end) with status light
    { const p = new THREE.Group(); p.position.set(5.32, 0, -16.6); g.add(p); S.secretPanel = p; const pm = std({ color: '#1a1622', roughness: 0.7 });
      box(0.12, 2.6, 1.6, pm, 0, 1.3, 0, p); for (let k = 0; k < 4; k++) box(0.13, 0.04, 1.4, '#2a2632', 0, 0.4 + k * 0.6, 0, p);
      S.panelLed = box(0.08, 0.16, 0.16, NM('#ff2a2a'), -0.08, 1.6, 0.6, p); for (const [yy, hh, zz, ww] of [[2.62, 0.05, 0, 1.62], [0.02, 0.05, 0, 1.62]]) box(0.07, hh, ww, S.panelLed.material, -0.07, yy, zz, p); for (const zz of [-0.8, 0.8]) box(0.07, 2.62, 0.05, S.panelLed.material, -0.07, 1.31, zz, p);
      S.panelPL = new THREE.PointLight('#ff2a2a', 2.5, 3, 1.6); S.panelPL.position.set(-0.6, 1.4, 0); p.add(S.panelPL); box(1.0, 2.5, 1.5, '#010102', 5.9 - 5.32 + 0.0, 1.25, -16.6 + 16.6, null); }
    { const dark = box(0.5, 2.5, 1.5, '#000000', 5.65, 1.25, -16.6, g); }
    S.headLight = new THREE.PointLight('#ff8ad8', 7, 6, 1.5); S.headLight.position.set(S.lanesX[2] + 0.7, 3.2, -15.8); s.add(S.headLight);
    S.bowlKey = new THREE.PointLight('#f0e0ff', 9, 16, 1.3); S.bowlKey.position.set(0, 5.2, -4); s.add(S.bowlKey);
    S.bowlLights = [['#ff5ad8', -4, -6], ['#7aff9a', 4, -10], ['#a07aff', 0, -15]].map(([c, x, z]) => { const l = new THREE.PointLight(c, 8, 10, 1.4); l.position.set(x, 4, z); s.add(l); return l; });
    S.bowlHemi = new THREE.HemisphereLight('#7a6ad8', '#140a18', 0.8); s.add(S.bowlHemi);
    // RUIN overlay
    const ru = new THREE.Group(); ru.visible = false; s.add(ru); S.bowlRuinG = ru; const r = rng(41);
    for (let i = 0; i < 26; i++) { const b = box(0.15, 0.05, 1 + r() * 2, wood, (r() - 0.5) * 9, 0.15 + r() * 0.2, -16 + r() * 18, ru); b.rotation.set(r() * 0.5, r() * 3, r() * 0.5); }
    for (let i = 0; i < 40; i++) { const b = box(0.2 + r() * 0.7, 0.1 + r() * 0.4, 0.2 + r() * 0.7, ['#2a2228', '#3a3a40', '#4a4038'][i % 3], (r() - 0.5) * 10, 0.12, -17 + r() * 20, ru); b.rotation.set(r(), r() * 3, r()); }
    for (let i = 0; i < 5; i++) { const b = box(3 + r() * 3, 0.2, 1.2, '#1a1a20', (r() - 0.5) * 6, 1.5 + r() * 3, -14 + r() * 12, ru); b.rotation.set(r() - 0.5, r() * 3, r() * 1.2 - 0.6); }
    for (let i = 0; i < 6; i++) { const w = box(0.03, 3, 0.03, '#2a2a2a', (r() - 0.5) * 8, 4.5, -15 + r() * 14, ru); w.rotation.z = r() - 0.5; }
    ru.children.slice().forEach(o => { if (o.position.x > 2.6 && o.position.z < -12) ru.remove(o); }); // keep the secret-wall corner clear
    S.bowl = s;
  }
  // ---------------- MONTY GOLF ----------------
  {
    const s = mkScene('#020604', '#030805', 10, 28); const g = new THREE.Group(); s.add(g);
    const flT = canvas(32, 32, c2 => { const r = rng(5); c2.fillStyle = '#1a2230'; c2.fillRect(0, 0, 32, 32); for (let i = 0; i < 140; i++) { c2.fillStyle = r() > 0.5 ? '#2a3448' : '#10141c'; c2.fillRect(r() * 32 | 0, r() * 32 | 0, 1, 1); } });
    const fl = plane(16, 30, std({ map: tex(flT, 8, 15), roughness: 0.9 }), g); fl.rotation.x = -Math.PI / 2; fl.position.z = -8;
    const path = std({ color: '#2ac83a', emissive: '#0a4a10', emissiveIntensity: 0.6, roughness: 0.95 });
    box(2.2, 0.06, 22, path, 0, 0.03, -8, g);
    for (const sx of [-1, 1]) { for (let z = 2; z > -19; z -= 2) box(0.05, 1.0, 0.05, '#c8a83a', sx * 1.3, 0.5, z, g); box(0.05, 0.05, 22, std({ color: '#d8b84a', metalness: 0.7, roughness: 0.3 }), sx * 1.3, 1.0, -8, g); }
    // greens
    for (const [x, z, w] of [[-3.2, -4, 2.6], [3.4, -9, 2.4], [-3.0, -13, 2.8]]) { box(w, 0.12, 2.0, std({ color: '#3ae84a', emissive: '#0a5a14', emissiveIntensity: 0.7 }), x, 0.06, z, g); box(w + 0.2, 0.04, 0.06, nm('#7aff7a'), x, 0.13, z + 1.03, g); for (let k = 0; k < 3; k++) box(0.3, 0.2, 0.3, '#1ad8e8', x - w / 2 + 0.4 + k * 0.6, 0.2, z - 1.3, g); }
    // red rock walls
    const rockT = canvas(32, 32, c2 => { const r = rng(9); c2.fillStyle = '#3a1410'; c2.fillRect(0, 0, 32, 32); for (let i = 0; i < 200; i++) { const v = r(); c2.fillStyle = v > 0.6 ? '#5a2018' : v > 0.3 ? '#2a0c0a' : '#4a1a12'; c2.fillRect(r() * 32 | 0, r() * 32 | 0, 2, 2); } });
    for (const sx of [-1, 1]) { const w = box(1, 7, 30, std({ map: tex(rockT, 6, 2), roughness: 1 }), sx * 6, 3.5, -8, g); }
    box(14, 1, 30, std({ map: tex(rockT, 6, 6), roughness: 1, color: '#7a6a6a' }), 0, 7, -8, g);
    // glowing green dots
    { const r = rng(12); const dots = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), NM('#7aff6a'), 160); const m4 = new THREE.Matrix4();
      for (let i = 0; i < 160; i++) { const side = r(); let p; if (side < 0.5) p = [(r() - 0.5) * 11, 6.45, -22 + r() * 28]; else p = [(r() > 0.5 ? 1 : -1) * 5.45, 1 + r() * 5, -22 + r() * 28]; m4.makeTranslation(...p); dots.setMatrixAt(i, m4); } g.add(dots); }
    for (const [x, z] of [[-4.3, -2], [4.4, -6], [-4.4, -11], [4.2, -15]]) palm(g, x, z, 3.6, '#2a8a2a');
    // giant gator head (open jaws)
    { const h = new THREE.Group(); h.position.set(3.4, 0, -12.5); h.rotation.y = -0.6; g.add(h); const gr = '#3ad83a', gd = '#1a8a1a';
      box(2.4, 1.6, 2.2, gr, 0, 1.0, 0, h); const up = new THREE.Group(); up.position.set(0, 1.5, 0.8); up.rotation.x = -0.5; h.add(up); box(2.2, 0.7, 2.8, gr, 0, 0.3, 1.3, up); for (let k = 0; k < 6; k++) for (const sx of [-1, 1]) box(0.18, 0.35, 0.18, '#ffffff', sx * 0.95, -0.15, 0.3 + k * 0.45, up);
      for (const sx of [-1, 1]) { box(0.6, 0.6, 0.5, '#f4f4e0', sx * 0.6, 0.95, 0.1, up); box(0.25, 0.4, 0.1, '#111', sx * 0.6, 0.95, 0.38, up); }
      box(2.2, 0.5, 2.6, gd, 0, 0.35, 1.9, h); for (let k = 0; k < 5; k++) for (const sx of [-1, 1]) box(0.18, 0.3, 0.18, '#ffffff', sx * 0.95, 0.75, 1.0 + k * 0.45, h); box(1.6, 0.06, 2.0, std({ color: '#c81a2a', roughness: 0.6 }), 0, 0.62, 1.8, h);
      S.gatorHead = h; }
    // neon fish skeleton + hole sign 13 + gator neon
    { const fg = new THREE.Group(); fg.position.set(-5.42, 4.2, -7); fg.rotation.y = Math.PI / 2; g.add(fg); const m = nm('#f0fff0');
      const lines = [[[-1.4, 0], [1.1, 0]], ellPts(-1.6, 0, 0.25, 0.22, 16), [[1.1, 0], [1.6, 0.45]], [[1.1, 0], [1.6, -0.45]]]; for (let i = 0; i < 8; i++) { const x = -1.0 + i * 0.28, hh = 0.55 - Math.abs(i - 3.5) * 0.06; lines.push([[x, hh], [x + 0.08, 0], [x, -hh]]); } tubes(fg, lines, m, 0.06); }
    { const hg = new THREE.Group(); hg.position.set(-1.9, 1.0, -6.2); hg.rotation.y = 0.5; g.add(hg); tubes(hg, [[[-0.5, -0.75], [-0.5, 0.15], ...arcPts(0, 0.15, 0.5, Math.PI, 0, 14).slice(1), [0.5, -0.75]]], nm('#3ae8c8'), 0.06); box(0.9, 1.5, 0.08, '#2a1a10', 0, -0.05, -0.06, hg); const t = voxelText(hg, '13', nm('#7aff7a'), 0.05, 11); t.position.set(0, -0.15, 0.04); box(0.9, 0.9, 0.5, '#4a3018', -1.9, 0.45, -6.4, g); }
    { const gg = new THREE.Group(); gg.position.set(-5.42, 3.0, -1.5); gg.rotation.y = Math.PI / 2; g.add(gg); tubes(gg, [[[0, 1.25], [-0.4, 0.1], [0, -1.25], [0.4, 0.1], [0, 1.25]]], nm('#7aff3a'), 0.07); tubes(gg, [starPts(0, 0.65, 0.22, 0.09)], nm('#ffd23a'), 0.05); tubes(gg, [[[-0.12, -0.05], [0.1, 0.15], [-0.05, -0.3], [0.15, -0.1]]], nm('#ff5ad8'), 0.05); }
    S.golfLights = [['#3aff5a', 0, 5, -4], ['#3aff5a', 0, 5, -12], ['#ff5ad8', -3, 3, -1], ['#3ae8c8', 3, 3, -8]].map(([c, x, y, z]) => { const l = new THREE.PointLight(c, 9, 10, 1.4); l.position.set(x, y, z); s.add(l); return l; });
    s.add(new THREE.HemisphereLight('#4a8a6a', '#0a0a08', 0.7));
    S.golf = s;
  }
  // ---------------- SECRET ROOM (Ruin) ----------------
  {
    const s = mkScene('#010102', '#020203', 6, 14); const g = new THREE.Group(); s.add(g);
    const plT = canvas(128, 64, c2 => { const r = rng(17); c2.fillStyle = '#b4b4ac'; c2.fillRect(0, 0, 128, 64); for (let i = 0; i < 60; i++) { c2.fillStyle = `rgba(30,30,32,${0.25 + r() * 0.35})`; const x = r() * 128, y = r() * 64, w = 2 + r() * 7, h = 1 + r() * 5; c2.fillRect(x, y, w, h); c2.fillRect(x + 1, y + h, w * 0.5, 1); } for (let i = 0; i < 300; i++) { c2.fillStyle = `rgba(0,0,0,${r() * 0.15})`; c2.fillRect(r() * 64 | 0, r() * 32 | 0, 1, 1); } });
    const wm = std({ map: tex(plT, 1, 1), roughness: 0.95 });
    const back = plane(6, 3.2, wm, g); back.position.set(0, 1.6, -2.5);
    for (const sx of [-1, 1]) { const w = plane(6, 3.2, wm, g); w.position.set(sx * 3, 1.6, 0.5); w.rotation.y = -sx * Math.PI / 2; }
    const flT = canvas(16, 64, c2 => { const r = rng(23); for (let x = 0; x < 16; x += 4) { const v = 90 + r() * 40 | 0; c2.fillStyle = `rgb(${v},${v * 0.75 | 0},${v * 0.5 | 0})`; c2.fillRect(x, 0, 4, 64); c2.fillStyle = 'rgba(0,0,0,0.4)'; c2.fillRect(x, 0, 1, 64); } for (let i = 0; i < 90; i++) { c2.fillStyle = `rgba(10,8,6,${0.3 + r() * 0.4})`; c2.fillRect(r() * 16 | 0, r() * 64 | 0, 2, 2); } });
    const fl = plane(6, 6, std({ map: tex(flT, 4, 1), roughness: 0.6 }), g); fl.rotation.x = -Math.PI / 2; fl.position.z = 0.5;
    const rugT = canvas(32, 32, c2 => { const r = rng(29); c2.fillStyle = '#2a2a2e'; c2.fillRect(0, 0, 32, 32); for (let i = 0; i < 120; i++) { c2.fillStyle = r() > 0.7 ? 'rgba(90,200,90,0.5)' : 'rgba(0,0,0,0.4)'; c2.fillRect(r() * 32 | 0, r() * 32 | 0, 1 + (r() * 2 | 0), 1); } });
    const rug = plane(3.4, 2.6, std({ map: tex(rugT), roughness: 1 }), g); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.006, 0.2);
    // wood plank ceiling + beams
    const ceil = plane(6, 6, std({ map: tex(flT, 4, 1), color: '#6a5a4a' }), g); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3.2, 0.5);
    for (const z of [-1.5, 0.5, 2.5]) box(6, 0.2, 0.25, '#3a2a1a', 0, 3.05, z, g);
    // Bonnie neon sign (outline head + star glasses)
    { const bs = new THREE.Group(); bs.position.set(-1.1, 1.8, -2.42); g.add(bs); S.bunnySign = bs; S.bunnyMats = [];
      const mk = (c, o = 1) => { const m = new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: o < 1, opacity: o, depthWrite: o >= 1, blending: o < 1 ? THREE.AdditiveBlending : THREE.NormalBlending }); m.userData.on = new THREE.Color(c); S.bunnyMats.push(m); return m; };
      // smooth round neon tube (+ soft additive glow sleeve) along a curve through 2D points
      const tube = (pts, c, r = 0.017, closed = false, smooth = true) => { const v = pts.map(p => new THREE.Vector3(p[0], p[1], 0));
        let curve; if (smooth) curve = new THREE.CatmullRomCurve3(v, closed, 'centripetal'); else { curve = new THREE.CurvePath(); const vv = closed ? [...v, v[0]] : v; for (let i = 0; i < vv.length - 1; i++) curve.add(new THREE.LineCurve3(vv[i], vv[i + 1])); }
        const n = Math.max(24, pts.length * 10); const m1 = new THREE.Mesh(new THREE.TubeGeometry(curve, n, r, 8, closed && smooth), mk(c)); const m2 = new THREE.Mesh(new THREE.TubeGeometry(curve, n, r * 2.8, 8, closed && smooth), mk(c, 0.22)); bs.add(m1, m2);
        if (!closed) for (const e of [v[0], v[v.length - 1]]) { const cap = new THREE.Mesh(new THREE.SphereGeometry(r * 1.05, 8, 6), m1.material); cap.position.copy(e); bs.add(cap); } };
      const mint = '#9af8e2', orange = '#ffb03a', pink = '#ff6aa0', lblue = '#a8c8ff';
      const earL = [[-0.13, 0.30], [-0.15, 0.62], [-0.16, 0.95], [-0.22, 1.16], [-0.31, 1.18], [-0.38, 1.02], [-0.37, 0.68], [-0.31, 0.38], [-0.28, 0.30]];
      tube(earL, mint); tube(earL.map(([x, y]) => [-x, y]), mint);
      tube([[-0.14, 0.33], [-0.07, 0.47], [-0.02, 0.36], [0.04, 0.5], [0.08, 0.36], [0.15, 0.44], [0.16, 0.33]], mint, 0.015);
      tube([[-0.36, 0.98], [-0.2, 0.98], [-0.2, 0.92], [-0.36, 0.92]], pink, 0.013, true, false);
      tube(Array.from({ length: 30 }, (_, i) => { const a = i / 30 * Math.PI * 2; const r = 0.5 + 0.035 * Math.cos(2 * a); return [Math.cos(a) * r * 1.02, -0.13 + Math.sin(a) * r * 0.9]; }), mint, 0.018, true);
      const star = (cx, cy) => starPts(cx, cy, 0.15, 0.065).slice(0, 10); tube(star(-0.17, -0.06), orange, 0.014, true, false); tube(star(0.17, -0.06), orange, 0.014, true, false); tube([[-0.03, -0.05], [0.03, -0.05]], orange, 0.012);
      for (const sx of [-1, 1]) { tube([[sx * 0.34, -0.27], [sx * 0.52, -0.25], [sx * 0.68, -0.2]], lblue, 0.011); tube([[sx * 0.34, -0.33], [sx * 0.52, -0.34], [sx * 0.7, -0.35]], lblue, 0.011); tube([[sx * 0.34, -0.39], [sx * 0.5, -0.44], [sx * 0.65, -0.5]], lblue, 0.011); }
      tube([[-0.27, -0.33], [-0.21, -0.46], [-0.1, -0.5], [0, -0.42], [0.1, -0.5], [0.21, -0.46], [0.27, -0.33]], mint, 0.016);
      tube([[-0.05, -0.46], [0.05, -0.46], [0.05, -0.59], [-0.05, -0.59]], lblue, 0.011, true, false);
      tube(Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return [Math.cos(a) * 0.045, -0.33 + Math.sin(a) * 0.03]; }), lblue, 0.011, true); }
    // neon star with bulbs
    { const st = new THREE.Group(); st.position.set(1.4, 1.95, -2.4); g.add(st); S.neonStar = st; const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 0.32 : 0.78; pts.push([Math.cos(a) * rr, -Math.sin(a) * rr]); }
      const sm = NM('#e8f2ff'); S.starMat = sm; for (let i = 0; i < 10; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % 10]; const len = Math.hypot(x1 - x0, y1 - y0); const b = new THREE.Mesh(new THREE.BoxGeometry(len, 0.09, 0.08), sm); b.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); b.rotation.z = Math.atan2(y1 - y0, x1 - x0); st.add(b);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), sm); bulb.position.set(x0, y0, 0.06); st.add(bulb); } }
    S.starLight = new THREE.PointLight('#dfe8ff', 4, 5, 1.6); S.starLight.position.set(1.4, 1.9, -1.8); s.add(S.starLight);
    S.signLight = new THREE.PointLight('#7af0e0', 3, 5, 1.6); S.signLight.position.set(-1.1, 1.9, -1.8); s.add(S.signLight);
    // dresser + bottles + small Freddy figure, poster, wet floor signs
    box(1.8, 0.9, 0.5, '#141418', 1.5, 0.45, -2.2, g); for (let i = 0; i < 4; i++) box(0.08, 0.22 + (i % 2) * 0.08, 0.08, ['#c8c8c0', '#e8e0d0', '#8a8a90', '#d0c8a0'][i], 0.8 + i * 0.13, 1.02, -2.15, g);
    box(0.12, 0.35, 0.1, '#8a6a2a', 1.6, 1.08, -2.15, g);
    { const cv = canvas(96, 128, c2 => { c2.fillStyle = '#2a3a2a'; c2.fillRect(0, 0, 96, 128); c2.fillStyle = '#5a3a1a'; c2.fillRect(10, 10, 76, 60); c2.fillStyle = '#e8e8e8'; c2.font = 'bold 12px "DejaVu Sans", sans-serif'; c2.fillText('YOU & ME', 10, 86); c2.fillText('FOREVER &', 10, 100); c2.fillText('EVER!', 10, 114); c2.font = 'italic 10px "DejaVu Sans", sans-serif'; c2.fillText('Love, Freddy', 30, 125); });
      const p = plane(0.9, 1.2, std({ map: tex(cv), roughness: 0.9 }), g); p.position.set(-2.97, 1.7, -1.2); p.rotation.y = Math.PI / 2; }
    const wet = (x, z, ry) => { const w = new THREE.Group(); w.position.set(x, 0, z); w.rotation.y = ry; g.add(w); const cv = canvas(32, 48, c2 => { c2.fillStyle = '#f2d21a'; c2.fillRect(0, 0, 32, 48); c2.fillStyle = '#111'; c2.beginPath(); c2.moveTo(16, 6); c2.lineTo(28, 26); c2.lineTo(4, 26); c2.fill(); c2.font = 'bold 7px sans-serif'; c2.fillText('WET', 8, 36); c2.fillText('FLOOR', 4, 44); });
      for (const sx of [-1, 1]) { const p = plane(0.4, 0.62, std({ map: tex(cv), side: THREE.DoubleSide }), w); p.position.set(0, 0.3, sx * 0.12); p.rotation.x = sx * 0.2; if (sx < 0) p.rotation.y = Math.PI; } };
    wet(-1.7, -0.8, 0.4); wet(1.6, 1.0, -0.6);
    { const r = rng(19); for (let i = 0; i < 18; i++) { const b = box(0.1 + r() * 0.3, 0.05 + r() * 0.12, 0.1 + r() * 0.3, ['#3a3a40', '#5a5048', '#2a2a2e'][i % 3], (r() - 0.5) * 5, 0.05, -2 + r() * 4.5); g.add(b); } }
    S.secretHemi = new THREE.HemisphereLight('#3a4a6a', '#0a0806', 0.35); s.add(S.secretHemi);
    S.secret = s;
  }
  S.neonMats = neonMats;
  S.setBunny = k => { for (const m of S.bunnyMats) m.color.copy(m.userData.on).multiplyScalar(Math.max(0.04, k)); };
  S.resetBonnie = () => { for (const [m, c] of neonMats) m.color.copy(c); S.atRuinG.visible = false; S.bowlRuinG.visible = false; S.secretPanel.position.set(5.32, 0, -16.6); S.panelLed.material.color.set('#ff2a2a'); S.panelPL.color.set('#ff2a2a');
    S.atKey.intensity = 18; S.atCyan.intensity = 3; S.atHemi.intensity = 1.4; S.atStatueSpot.intensity = 60; S.bowlKey.intensity = 9; S.bowlHemi.intensity = 0.8; S.bowlLights.forEach(l => l.intensity = 8);
    S.starLight.intensity = 4; S.signLight.intensity = 3; S.starMat.color.set('#e8f2ff'); S.setBunny(1); S.stageSpots.forEach(l => l.intensity = 40); S.stageKey.intensity = 70; S.stageFloorLight.intensity = 12; S.headLight.intensity = 7; };
  S.ruinMode = (scene, t) => { // darken neon/lights, flicker
    const f = (Math.sin(t * 37) + Math.sin(t * 23.3) > 1.5) ? 0.2 : 1;
    for (const [m, c] of neonMats) m.color.copy(c).multiplyScalar(0.12 * f);
    if (scene === 'atrium') { S.atRuinG.visible = true; S.atKey.intensity = 2; S.atCyan.intensity = 0.4; S.atHemi.intensity = 0.45; S.atStatueSpot.intensity = 6 * f; }
    if (scene === 'bowl') { S.bowlRuinG.visible = true; S.bowlKey.intensity = 1.6; S.bowlHemi.intensity = 0.45; S.bowlLights.forEach(l => l.intensity = 1.6 * f); S.headLight.intensity = 3 * f; }
  };
}
