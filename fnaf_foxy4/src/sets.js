// FNAF 4 sets, all real 3D geometry: the child's bedroom (louvered bi-fold closet, two blue dressers, side doors,
// damask wallpaper + dark wainscot, wall stars, toys, fan/lava lamp/clock, yellow lamp), the bed with the patchwork
// quilt, the closet interior, and the two hallways (orange wallpaper, ceiling dome lights, lamp table, windows).
import * as THREE from 'three';
export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const cvTex = (w, h, draw, rep = [1, 1]) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 4; return t; };
export const std = o => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...o });
export function box(w, h, d, m, x, y, z, p) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; if (p) p.add(b); return b; }

// ---------- materials ----------
function damask(base, motif, seed) { return (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); const r = rng(seed); g.fillStyle = motif;
  for (let k = 0; k < 2; k++) { const cx = k * w / 2 + w / 4, cy = k * h / 2 + h / 4; g.save(); g.translate(cx, cy);
    for (let a = 0; a < 4; a++) { g.rotate(Math.PI / 2); g.beginPath(); g.ellipse(0, -h * 0.12, w * 0.05, h * 0.11, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(w * 0.07, -h * 0.07, w * 0.03, h * 0.05, 0.8, 0, 7); g.fill(); }
    g.beginPath(); g.arc(0, 0, w * 0.04, 0, 7); g.fill(); g.restore(); }
  for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},0.05)`; g.fillRect(r() * w, r() * h, 1, 1); } }; }
let M = null;
function mats() { if (M) return M; M = {
  wall: std({ map: cvTex(128, 128, damask('#9ea2ae', '#b2b6c2', 3), [12, 3.4]) }),
  wain: std({ map: cvTex(64, 64, (g, w, h) => { g.fillStyle = '#3c3e48'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 8) { g.fillStyle = '#2a2c34'; g.fillRect(x, 0, 2, h); g.fillStyle = '#4a4c58'; g.fillRect(x + 2, 0, 1, h); } }, [10, 1]) }),
  hallWall: std({ map: cvTex(64, 64, (g, w, h) => { g.fillStyle = '#9a3c1c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7a2a12'; g.lineWidth = 2; for (let i = -64; i < 128; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke(); g.beginPath(); g.moveTo(i + 64, 0); g.lineTo(i, 64); g.stroke(); } g.fillStyle = '#b04a26'; for (let x = 8; x < 64; x += 16) for (let y = 8; y < 64; y += 16) g.fillRect(x - 2, y - 2, 4, 4); }, [8, 2]) }),
  hallWall2: std({ map: cvTex(64, 64, (g, w, h) => { g.fillStyle = '#3a4048'; g.fillRect(0, 0, w, h); const r = rng(5); for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.05})`; g.fillRect(r() * w, r() * h, 2, 1); } }, [6, 2]) }),
  carpet: std({ map: cvTex(64, 64, (g, w, h) => { g.fillStyle = '#1c2348'; g.fillRect(0, 0, w, h); const r = rng(9); for (let i = 0; i < 1500; i++) { g.fillStyle = r() < 0.5 ? 'rgba(60,70,130,0.5)' : 'rgba(5,8,25,0.5)'; g.fillRect(r() * w, r() * h, 1, 1); } }, [10, 10]), roughness: 1 }),
  hallFloor: std({ map: cvTex(64, 64, (g, w, h) => { g.fillStyle = '#4a3020'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) { g.fillStyle = '#3a2416'; g.fillRect(0, y, w, 1); } }, [10, 2]), roughness: 0.6 }),
  ceil: std({ map: cvTex(64, 64, (g, w, h) => { g.fillStyle = '#5a5c66'; g.fillRect(0, 0, w, h); const r = rng(2); for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},0.08)`; g.fillRect(r() * w, r() * h, 1, 1); } }, [6, 6]) }),
  white: std({ color: '#d8dce4', roughness: 0.6 }), whiteD: std({ color: '#b8bcc6', roughness: 0.6 }), blue: std({ color: '#3a5088', roughness: 0.55 }), blueD: std({ color: '#2a3a68', roughness: 0.55 }),
  knob: std({ color: '#e8e8ec', roughness: 0.3, metalness: 0.3 }), brass: std({ color: '#b08a3a', metalness: 0.8, roughness: 0.3 }), black: std({ color: '#060608', roughness: 1 }), wood: std({ color: '#7a4a2a', roughness: 0.6 }), woodD: std({ color: '#5a321a', roughness: 0.6 }),
  star: std({ color: '#2a3048', roughness: 0.6 }), frame: std({ color: '#2a2018', roughness: 0.5 }), purple: std({ color: '#6a3aa8', roughness: 0.5 }), yellow: std({ color: '#d8b830', roughness: 0.35 }), shade: std({ color: '#2a3a78', roughness: 0.8, side: THREE.DoubleSide }),
}; return M; }

// six-panel door with raised panels, brass knob; hinge at the origin, door along +x
function door(p, w, h, open) { const m = mats(); const piv = new THREE.Group(); p.add(piv); piv.rotation.y = open; box(w, h, 0.08, m.white, w / 2, h / 2, 0, piv);
  for (const [px, py, pw, ph] of [[0.26, 0.82, 0.36, 0.22], [0.74, 0.82, 0.36, 0.22], [0.26, 0.52, 0.36, 0.34], [0.74, 0.52, 0.36, 0.34], [0.26, 0.17, 0.36, 0.24], [0.74, 0.17, 0.36, 0.24]]) for (const sz of [-1, 1]) box(pw * w, ph * h, 0.03, m.whiteD, px * w, py * h, sz * 0.05, piv);
  for (const sz of [-1, 1]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), m.brass); k.position.set(w - 0.15, h * 0.47, sz * 0.09); piv.add(k); } return piv; }

// louvered bi-fold closet door panel (frame + real slats)
function louverPanel(p, w, h) { const m = mats(); const g = new THREE.Group(); p.add(g); box(0.08, h, 0.07, m.white, 0.04, h / 2, 0, g); box(0.08, h, 0.07, m.white, w - 0.04, h / 2, 0, g); box(w, 0.1, 0.07, m.white, w / 2, h - 0.05, 0, g); box(w, 0.1, 0.07, m.white, w / 2, 0.05, 0, g); box(w, 0.08, 0.07, m.white, w / 2, h * 0.5, 0, g);
  for (let y = 0.16; y < h - 0.12; y += 0.085) { if (Math.abs(y - h * 0.5) < 0.07) continue; const s = box(w - 0.14, 0.012, 0.075, m.white, w / 2, y, 0, g); s.rotation.x = 0.55; } return g; }

function dresser(p, x, z, w, h, d, rows, cols = 1, broken = -1) { const m = mats(); const g = new THREE.Group(); g.position.set(x, 0, z); p.add(g); box(w, h - 0.12, d, m.blue, 0, (h - 0.12) / 2 + 0.12, 0, g); box(w + 0.06, 0.06, d + 0.04, m.blueD, 0, h + 0.03, 0, g);
  for (const sx of [-1, 1]) box(0.08, 0.14, 0.08, m.blueD, sx * (w / 2 - 0.08), 0.07, d / 2 - 0.08, g);
  const dh = (h - 0.2) / rows; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const dw = (w - 0.12) / cols; const cx = -w / 2 + 0.06 + (c + 0.5) * dw, cy = 0.16 + (r + 0.5) * dh; box(dw - 0.06, dh - 0.06, 0.04, m.blueD, cx, cy, d / 2 + 0.01, g); box(dw - 0.12, dh - 0.12, 0.04, m.blue, cx, cy, d / 2 + 0.03, g);
    const nk = rows > 3 && cols === 1 ? [-dw * 0.28, dw * 0.28] : [0]; for (const kx of nk) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), m.knob); k.position.set(cx + kx, cy, d / 2 + 0.08); g.add(k); }
    if (r === broken) { const hole = new THREE.Mesh(new THREE.CircleGeometry(0.22, 7), m.black); hole.scale.set(1.3, 0.6, 1); hole.position.set(cx - 0.05, cy + 0.02, d / 2 + 0.056); g.add(hole); } }
  return g; }

function star5(m, s) { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + Math.PI / 2, r = i % 2 ? s * 0.42 : s; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? sh.lineTo(x, y) : sh.moveTo(x, y); } const g = new THREE.ExtrudeGeometry(sh, { depth: 0.015, bevelEnabled: false }); return new THREE.Mesh(g, m); }
function frameArt(p, w, h, x, y, z, ry, seed) { const m = mats(); const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g); box(w, h, 0.04, m.frame, 0, 0, 0, g); box(w - 0.08, h - 0.08, 0.01, std({ color: ['#2a2e3a', '#3a3428', '#24282e'][seed % 3] }), 0, 0, 0.022, g);
  box(w * 0.3, h * 0.45, 0.01, std({ color: '#151518' }), (seed % 2 ? 0.1 : -0.08) * w, -0.08 * h, 0.03, g); return g; }

// small voxel toys
function voxels(p, cells, px, x, y, z, ry = 0) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g); for (const [cx, cy, cz, sx, sy, sz, col] of cells) box(sx * px, sy * px, sz * px, std({ color: col, roughness: 0.6 }), cx * px, cy * px, cz * px, g); return g; }

export function buildBedroom(S) {
  const m = mats(); const s = new THREE.Scene(); s.background = new THREE.Color('#020205'); const g = new THREE.Group(); s.add(g); s.fog = new THREE.Fog('#020205', 9, 26);
  const W = 8, D = 9, Hh = 4.2, z0 = -4.5;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), m.carpet); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), m.ceil); ceil.rotation.x = Math.PI / 2; ceil.position.y = Hh; g.add(ceil);
  const wallSeg = (w, x, z, ry, y0 = 0, y1 = Hh) => { const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = ry; g.add(grp); const wh = 1.45;
    if (y0 < wh) { const lo = Math.min(wh, y1); box(w, lo - y0, 0.1, m.wain, 0, (y0 + lo) / 2, 0, grp); }
    if (y1 > wh) { const a = Math.max(wh, y0); box(w, y1 - a, 0.1, m.wall, 0, (a + y1) / 2, 0, grp); }
    if (y0 < wh && y1 > wh) { box(w, 0.07, 0.06, m.whiteD, 0, wh, 0.07, grp); } if (y0 === 0) box(w, 0.14, 0.04, m.whiteD, 0, 0.07, 0.06, grp); return grp; };
  // back wall (closet opening 3.2 wide x 3.4 tall at the centre)
  const cw = 2.8, ch = 3.4; wallSeg((W - cw) / 2, -(W + cw) / 4, z0, 0); wallSeg((W - cw) / 2, (W + cw) / 4, z0, 0); wallSeg(cw, 0, z0, 0, ch, Hh);
  // front wall (bed wall)
  wallSeg(W, 0, -z0, Math.PI);
  // side walls with doors (opening z 0.4..2.4, height 3.4)
  const dz0 = 0.4, dz1 = 2.4, dh = 3.4;
  for (const sx of [-1, 1]) { const ry = sx < 0 ? Math.PI / 2 : -Math.PI / 2; wallSeg(dz0 - z0, sx * W / 2, (z0 + dz0) / 2, ry); wallSeg(-z0 - dz1, sx * W / 2, (dz1 - z0) / 2, ry); wallSeg(dz1 - dz0, sx * W / 2, (dz0 + dz1) / 2, ry, dh, Hh);
    // door casing
    for (const zz of [dz0 - 0.06, dz1 + 0.06]) box(0.06, dh + 0.1, 0.14, m.white, sx * (W / 2 - 0.05), (dh + 0.1) / 2, zz, g); box(0.06, 0.14, dz1 - dz0 + 0.26, m.white, sx * (W / 2 - 0.05), dh + 0.07, (dz0 + dz1) / 2, g);
    // door open into the room against the wall side (hinge at dz0 inner edge)
    const hinge = new THREE.Group(); hinge.position.set(sx * (W / 2 - 0.1), 0, dz1); g.add(hinge); const d = door(hinge, dz1 - dz0 - 0.05, dh - 0.05, 0); d.rotation.y = sx < 0 ? -Math.PI / 2 + 0.55 : -Math.PI / 2 - 0.55; d.position.x = 0; S['door' + (sx < 0 ? 'L' : 'R')] = d;
    // dark doorway gap fill (hallway is its own scene; keep the gap dark)
  }
  // closet: frame, interior box, rod with clothes, 4 louvered panels (2 folded open at the centre)
  const cz = z0 - 1.7; box(cw, ch, 0.05, m.black, 0, ch / 2, cz, g); box(cw, 0.05, 1.7, std({ color: '#0e0e12' }), 0, ch, z0 - 0.85, g); for (const sx of [-1, 1]) box(0.05, ch, 1.7, std({ color: '#121218' }), sx * cw / 2, ch / 2, z0 - 0.85, g);
  const cfl = new THREE.Mesh(new THREE.PlaneGeometry(cw, 1.7), std({ color: '#141420', roughness: 1 })); cfl.rotation.x = -Math.PI / 2; cfl.position.set(0, 0.002, z0 - 0.85); g.add(cfl);
  box(cw - 0.1, 0.04, 0.04, m.brass, 0, ch - 0.25, z0 - 1.35, g); const clothCols = ['#3a2a2a', '#2a3448', '#4a4a3a', '#2a2a2a', '#5a3a3a'];
  for (const [i, x] of [[0, -1.28], [1, -1.12], [2, -0.96], [3, 1.0], [4, 1.18]]) box(0.08, 1.0, 0.6, std({ color: clothCols[i] }), x, ch - 0.8, z0 - 1.35, g);
  for (const sx of [-1, 1]) box(0.1, ch + 0.1, 0.12, m.white, sx * (cw / 2 + 0.05), (ch + 0.1) / 2, z0 + 0.04, g); box(cw + 0.3, 0.12, 0.12, m.white, 0, ch + 0.06, z0 + 0.04, g);
  const pw = cw / 4; S.closet = [];
  for (const side of [-1, 1]) { const hinge = new THREE.Group(); hinge.position.set(side * (cw / 2 - 0.02), 0, z0 + 0.03); g.add(hinge); louverPanel(hinge, pw - 0.02, ch - 0.05);
    const h2 = new THREE.Group(); h2.position.x = pw - 0.01; hinge.add(h2); louverPanel(h2, pw - 0.02, ch - 0.05); S.closet.push({ side, hinge, h2 }); }
  S.closetZ = z0; S.closetW = cw; S.closetH = ch;
  // bi-fold: f = 0 closed; each pair folds into a V toward the room, opening a gap in the middle
  S.setCloset = k => { const f = k * 1.2 + Math.max(0, k - 0.85) * 2.4;   // fully open (k=1): both pairs folded flat against the sides -> the whole opening is free
    S.closet.forEach(({ side, hinge, h2 }) => { hinge.rotation.y = side < 0 ? -f : Math.PI + f; h2.rotation.y = side < 0 ? 2 * f : -2 * f; }); };
  S.setCloset(0.35);
  // left tall dresser (5 drawers, broken 3rd) + lava lamp, clock, purple fan
  const dl = dresser(g, -2.4, z0 + 0.45, 1.5, 2.3, 0.8, 5, 1, 2); dl.rotation.y = 0;
  { const ll = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.11, 0.55, 12), std({ color: '#3a3a44', metalness: 0.6, roughness: 0.3 })); ll.position.set(-2.92, 2.6, z0 + 0.4); g.add(ll);
    const clk = box(0.36, 0.18, 0.16, std({ color: '#1a1a20' }), -2.45, 2.42, z0 + 0.55, g); S.clockDigits = box(0.28, 0.09, 0.01, new THREE.MeshBasicMaterial({ color: '#ff2a1a', toneMapped: false }), -2.45, 2.43, z0 + 0.635, g);
    const fan = new THREE.Group(); fan.position.set(-1.95, 2.33, z0 + 0.45); g.add(fan); box(0.3, 0.06, 0.24, m.purple, 0, 0.03, 0, fan); box(0.06, 0.3, 0.06, m.purple, 0, 0.2, 0, fan);
    const head = new THREE.Group(); head.position.y = 0.48; fan.add(head); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 6, 24), m.purple); head.add(ring); const blades = new THREE.Group(); head.add(blades); S.fanBlades = blades;
    for (let k = 0; k < 4; k++) { const b = box(0.07, 0.17, 0.01, m.purple, 0, 0.09, 0, null); const pv = new THREE.Group(); pv.rotation.z = k * Math.PI / 2; pv.add(b); blades.add(pv); } }
  // right short dresser (3 drawers, 2 cols? game: 3 rows) + yellow lamp with blue shade
  dresser(g, 2.3, z0 + 0.45, 1.2, 1.5, 0.8, 3, 1);
  { const base = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.13, 0.02], [0.17, 0.12], [0.15, 0.3], [0.07, 0.42], [0.04, 0.5]].map(([a, b]) => new THREE.Vector2(a, b)), 16), m.yellow); base.position.set(2.3, 1.56, z0 + 0.45); base.castShadow = true; g.add(base);
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.36, 0.42, 20, 1, true), m.shade); sh.position.set(2.3, 2.24, z0 + 0.45); g.add(sh);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd890' })); bulb.position.set(2.3, 2.12, z0 + 0.45); g.add(bulb); S.lampBulb = bulb;
    const L = new THREE.PointLight('#ffc070', 1.2, 7, 1.6); L.position.set(2.3, 2.05, z0 + 0.7); g.add(L); S.lamp = L; }
  // wall stars (dark, as in the game) above the dressers/closet, pictures, vent, switch
  { const r = rng(4); for (let i = 0; i < 9; i++) { const st = star5(m.star, 0.07 + r() * 0.05); const left = i < 5; st.position.set(left ? -3.5 + i * 0.4 + r() * 0.15 : 1.75 + (i - 5) * 0.45, 3.35 + r() * 0.45, z0 + 0.06); st.rotation.z = r(); g.add(st); } }
  frameArt(g, 0.42, 0.52, -3.94, 2.55, -2.9, Math.PI / 2, 0); frameArt(g, 0.36, 0.5, -3.94, 2.4, -2.3, Math.PI / 2, 1); frameArt(g, 0.36, 0.46, -3.94, 1.85, -2.6, Math.PI / 2, 2); frameArt(g, 0.36, 0.42, 3.2, 2.5, z0 + 0.06, 0, 1);
  box(0.04, 0.5, 0.6, std({ color: '#7a7e88', metalness: 0.5 }), -3.95, 3.3, -3.6, g); for (let k = 0; k < 6; k++) box(0.05, 0.03, 0.55, std({ color: '#3a3c44' }), -3.94, 3.12 + k * 0.07, -3.6, g);
  box(0.03, 0.18, 0.12, m.white, -3.95, 1.9, -0.2, g);
  // toys on the floor: purple robot, blue car, brown plush
  voxels(g, [[0, 3, 0, 4, 3, 3, '#6a3aa8'], [0, 6, 0, 3, 2.4, 2.4, '#7a4ab8'], [0, 7.6, 0, 0.6, 1.2, 0.6, '#ff3a3a'], [-1, 6.2, 1.25, 0.7, 0.7, 0.2, '#ffd23a'], [1, 6.2, 1.25, 0.7, 0.7, 0.2, '#ffd23a'], [-2.6, 3.4, 0, 1.2, 2.4, 1.2, '#5a2a98'], [2.6, 3.4, 0, 1.2, 2.4, 1.2, '#5a2a98'], [-1, 0.8, 0, 1.4, 1.6, 2, '#3a2a68'], [1, 0.8, 0, 1.4, 1.6, 2, '#3a2a68']], 0.07, 1.6, 0, z0 + 0.65, -0.3);
  voxels(g, [[0, 1.2, 0, 7, 1.6, 3.6, '#2a4ad8'], [-0.4, 2.6, 0, 4, 1.4, 3.2, '#3a5ae8'], [1.6, 2.7, 1.6, 0.8, 0.5, 0.1, '#f2f2f2'], [3.2, 2.7, 1.62, 0.8, 0.5, 0.1, '#f2f2f2'], [-2.4, 0.5, 1.9, 1.2, 1.2, 0.3, '#111'], [2.4, 0.5, 1.9, 1.2, 1.2, 0.3, '#111'], [-2.4, 0.5, -1.9, 1.2, 1.2, 0.3, '#111'], [2.4, 0.5, -1.9, 1.2, 1.2, 0.3, '#111']], 0.06, -0.9, 0, z0 + 1.1, 0.2);
  voxels(g, [[0, 1.5, 0, 4, 3, 3, '#5a4a1a'], [0, 4.2, 0.3, 3.4, 2.6, 2.6, '#6a5a22'], [-1.2, 5.8, 0, 0.9, 0.9, 0.5, '#5a4a1a'], [1.2, 5.8, 0, 0.9, 0.9, 0.5, '#5a4a1a'], [-0.7, 4.6, 1.65, 0.6, 0.6, 0.1, '#f2f2f2'], [0.7, 4.6, 1.65, 0.6, 0.6, 0.1, '#f2f2f2'], [-2.4, 2.4, 0.6, 1.2, 0.8, 0.8, '#5a4a1a'], [2.4, 2.4, 0.6, 1.2, 0.8, 0.8, '#5a4a1a']], 0.06, -1.85, 0, z0 + 1.15, 0.5);
  // BED (front wall): headboard with slats, mattress, patchwork quilt, pillow
  { const bz = -z0 - 0.75, bw = 2.2, bl = 2.6; const quilt = std({ map: cvTex(96, 96, (q, w, h) => { const cols = ['#f2efe2', '#2a5aa8', '#d8c040', '#7a9ac8', '#f2efe2', '#c8b860']; const r = rng(12); for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) { const a = cols[Math.floor(r() * 6)], b = cols[Math.floor(r() * 6)]; q.fillStyle = a; q.fillRect(x * 16, y * 16, 16, 16); q.fillStyle = b; q.beginPath(); if ((x + y) % 2) { q.moveTo(x * 16, y * 16); q.lineTo(x * 16 + 16, y * 16); q.lineTo(x * 16, y * 16 + 16); } else { q.moveTo(x * 16 + 16, y * 16); q.lineTo(x * 16 + 16, y * 16 + 16); q.lineTo(x * 16, y * 16 + 16); } q.fill(); } q.strokeStyle = 'rgba(0,0,0,0.15)'; for (let i = 0; i <= 96; i += 16) { q.beginPath(); q.moveTo(i, 0); q.lineTo(i, 96); q.stroke(); q.beginPath(); q.moveTo(0, i); q.lineTo(96, i); q.stroke(); } }, [2, 2]), roughness: 0.95 });
    const bed = new THREE.Group(); bed.position.set(0, 0, bz); g.add(bed); S.bedPos = new THREE.Vector3(0, 0, bz);
    box(bw, 0.35, bl, m.woodD, 0, 0.3, -bl / 2 + 0.3, bed); box(bw - 0.1, 0.3, bl - 0.2, std({ color: '#e8e4da' }), 0, 0.62, -bl / 2 + 0.3, bed); box(bw + 0.1, 0.14, bl - 0.7, quilt, 0, 0.82, -bl / 2 + 0.05, bed);
    box(bw * 0.8, 0.22, 0.6, std({ color: '#f2f0ea' }), 0, 0.88, 0.0, bed);
    box(bw + 0.2, 0.14, 0.12, m.wood, 0, 1.9, 0.62, bed); box(bw + 0.2, 0.1, 0.12, m.wood, 0, 0.95, 0.62, bed); for (const sx of [-1, 1]) box(0.14, 2.0, 0.14, m.wood, sx * (bw / 2 + 0.05), 1.0, 0.62, bed); for (let i = 0; i < 9; i++) box(0.08, 0.95, 0.06, m.wood, -bw / 2 + 0.25 + i * (bw - 0.5) / 8, 1.42, 0.62, bed);
    S.bedTop = 0.89; S.bedZ = bz; }
  // lights: very dim cool night ambience + the lamp; the flashlight spot (player / child) is positioned by the shots
  s.add(new THREE.HemisphereLight('#3a4a78', '#05060c', 0.22));
  const fl = new THREE.SpotLight('#e8f0ff', 0, 18, 0.32, 0.55, 1.2); fl.castShadow = true; fl.shadow.mapSize.set(1024, 1024); fl.shadow.bias = -0.0005; s.add(fl, fl.target); S.flash = fl;
  const moon = new THREE.SpotLight('#6a80c8', 3, 16, 0.7, 0.8, 1.3); moon.position.set(3.6, 3.6, 1.4); moon.target.position.set(0, 0.5, -3.5); s.add(moon, moon.target); S.moon = moon; // spill from the right hallway window
  S.bedroom = s; return s; }

// hallway scene: a long corridor running from the bedroom door along -x (left) or +x (right); the bedroom doorway at x=0
export function buildHall(S, side) {
  const m = mats(); const s = new THREE.Scene(); s.background = new THREE.Color('#010103'); s.fog = new THREE.Fog('#010103', 6, 20); const g = new THREE.Group(); s.add(g);
  const L = 12, Wd = 2.4, Hh = 3.8; // corridor along -z (away from the door frame at z=0)
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(Wd, L), m.hallFloor); fl.rotation.x = -Math.PI / 2; fl.position.z = -L / 2; g.add(fl); const ce = new THREE.Mesh(new THREE.PlaneGeometry(Wd, L), m.ceil); ce.rotation.x = Math.PI / 2; ce.position.set(0, Hh, -L / 2); g.add(ce);
  const wA = side === 'L' ? m.hallWall : m.hallWall2, wB = side === 'L' ? m.hallWall2 : m.hallWall;
  box(0.1, Hh, L, wA, Wd / 2, Hh / 2, -L / 2, g); box(0.1, Hh, L, wB, -Wd / 2, Hh / 2, -L / 2, g); box(Wd, Hh, 0.1, std({ color: '#0a0a0e' }), 0, Hh / 2, -L, g);
  for (const sx of [-1, 1]) { box(0.04, 0.14, L, m.whiteD, sx * (Wd / 2 - 0.05), 0.07, -L / 2, g); }
  // door frame in the foreground (the bedroom doorway)
  for (const sx of [-1, 1]) box(0.2, 3.5, 0.2, m.white, sx * 1.0, 1.75, 0.15, g); box(2.2, 0.2, 0.2, m.white, 0, 3.5, 0.15, g);
  // ceiling dome lights (dim, warm) + lamp table + pictures (+ windows on the right hall)
  S['hallLights' + side] = [];
  for (const zz of [-3, -7.5]) { const dome = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: '#d8b060', emissive: '#a07020', emissiveIntensity: 0.6, roughness: 0.4 })); dome.rotation.x = Math.PI; dome.position.set(0, Hh - 0.01, zz); g.add(dome);
    const l = new THREE.PointLight('#ffb860', 2.2, 6, 1.6); l.position.set(0, Hh - 0.4, zz); g.add(l); S['hallLights' + side].push(l); }
  const tx = side === 'L' ? 0.85 : -0.85; const tz = -5.2; const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 16), m.woodD); tb.position.set(tx, 0.45, tz); tb.castShadow = true; g.add(tb);
  const lb = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.14, 0.03], [0.16, 0.15], [0.1, 0.3], [0.04, 0.38]].map(([a, b]) => new THREE.Vector2(a, b)), 14), std({ color: '#c88a3a', roughness: 0.4 })); lb.position.set(tx, 0.9, tz); g.add(lb);
  const ls = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 0.32, 16, 1, true), std({ color: '#e8d8a0', emissive: '#b08a40', emissiveIntensity: 0.5, side: THREE.DoubleSide })); ls.position.set(tx, 1.42, tz); g.add(ls);
  const ll = new THREE.PointLight('#ffc070', 2.5, 5, 1.6); ll.position.set(tx, 1.4, tz + 0.2); g.add(ll);
  const wallX = side === 'L' ? Wd / 2 - 0.06 : -Wd / 2 + 0.06, ry = side === 'L' ? -Math.PI / 2 : Math.PI / 2;
  frameArt(g, 0.5, 0.65, wallX, 2.3, -4.2, ry, 0); frameArt(g, 0.3, 0.4, wallX, 2.1, -5.6, ry, 1); frameArt(g, 0.3, 0.4, wallX, 2.6, -6.1, ry, 2);
  if (side === 'R') for (const zz of [-2.4, -8.2]) { const wx = Wd / 2 - 0.04; box(0.04, 1.6, 1.2, std({ color: '#0a1428', emissive: '#14244a', emissiveIntensity: 0.4 }), wx, 2.0, zz, g); for (const [w, h, y, z] of [[0.08, 1.7, 2.0, zz - 0.62], [0.08, 1.7, 2.0, zz + 0.62], [0.08, 0.08, 2.85, zz], [0.08, 0.08, 1.15, zz], [0.06, 1.6, 2.0, zz], [0.06, 0.06, 2.0, zz]]) box(0.07, h, w === 0.08 && h > 1 ? 0.08 : (h < 0.1 ? 1.24 : 0.06), m.white, wx - 0.03, y, z, g);
    const mo = new THREE.SpotLight('#5a74c8', 6, 8, 0.6, 0.7, 1.4); mo.position.set(wx + 0.5, 2.8, zz); mo.target.position.set(-1, 0, zz - 0.6); s.add(mo, mo.target); }
  s.add(new THREE.HemisphereLight('#3a3048', '#060404', 0.25));
  const fl2 = new THREE.SpotLight('#e8f0ff', 0, 16, 0.34, 0.55, 1.2); fl2.castShadow = true; fl2.shadow.mapSize.set(1024, 1024); s.add(fl2, fl2.target); S['hallFlash' + side] = fl2;
  S['hall' + side] = s; return s; }
