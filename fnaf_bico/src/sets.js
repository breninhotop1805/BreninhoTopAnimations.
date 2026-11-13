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
