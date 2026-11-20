// Ultimate Custom Night office, FNAF 6 stage, fire room — all real 3D geometry (screens are screens in real frames).
import * as THREE from 'three';
import { voxelArt } from './skin.js';
import { star } from './rockstar.js';
export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const cvTex = (w, h, draw, rep = [1, 1], near = false) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 4; if (near) t.magFilter = THREE.NearestFilter; return t; };
const std = o => new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0, ...o });
function box(w, h, d, m, x, y, z, p, ry = 0) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.rotation.y = ry; b.castShadow = b.receiveShadow = true; p.add(b); return b; }
function cyl(r, h, m, x, y, z, p, seg = 16, rx = 0, rz = 0) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m); c.position.set(x, y, z); c.rotation.set(rx, 0, rz); c.castShadow = c.receiveShadow = true; p.add(c); return c; }
const glow = c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
const hazardTex = () => cvTex(32, 8, (g, w, h) => { g.fillStyle = '#e8b818'; g.fillRect(0, 0, w, h); g.fillStyle = '#141414'; for (let x = -8; x < w + 8; x += 8) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 4, 0); g.lineTo(x + 8, 0); g.lineTo(x + 4, h); g.fill(); } }, [1, 1], true);
function hazardFrame(p, w, h, x, y, z, ry, th = 0.14) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g); const t = hazardTex(); const mk = (len, rot) => { const tt = t.clone(); tt.needsUpdate = true; tt.repeat.set(len / 0.5, 1); return std({ map: tt, roughness: 0.6 }); };
  box(th, h, 0.06, mk(h, 1), -w / 2, h / 2, 0, g).rotation.z = 0; box(th, h, 0.06, mk(h, 1), w / 2, h / 2, 0, g); box(w + th, th, 0.06, mk(w, 0), 0, h, 0, g); return g; }
// voxel letters (5x5 font) for signs: EXIT, 25¢
const FONT = { E: ['111', '100', '110', '100', '111'], X: ['101', '101', '010', '101', '101'], I: ['1', '1', '1', '1', '1'], T: ['111', '010', '010', '010', '010'], 2: ['111', '001', '111', '100', '111'], 5: ['111', '100', '111', '001', '111'], c: ['000', '011', '100', '100', '011'], '!': ['1', '1', '1', '0', '1'] };
export function voxText(txt, col, px, depth, emissive = true) { const g = new THREE.Group(); const m = emissive ? glow(col) : std({ color: col }); let x0 = 0; const geo = new THREE.BoxGeometry(px * 0.92, px * 0.92, depth);
  for (const ch of txt) { const F = FONT[ch]; if (!F) { x0 += 2; continue; } F.forEach((r, y) => [...r].forEach((b, x) => { if (b === '1') { const v = new THREE.Mesh(geo, m); v.position.set((x0 + x) * px, (4 - y) * px, 0); g.add(v); } })); x0 += F[0].length + 1; }
  g.children.forEach(v => v.position.x -= (x0 - 1) * px / 2); return g; }

export function buildOffice(S) {
  const s = new THREE.Scene(); s.background = new THREE.Color('#030203'); s.fog = new THREE.Fog('#030203', 9, 22); const g = new THREE.Group(); s.add(g); const r = rng(7);
  const W = 9, Z0 = -4, Hh = 4.3;
  // floor: black/white checker with confetti stars
  const floorT = cvTex(128, 128, (c, w, h) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.fillStyle = (i + j) % 2 ? '#e8e0d0' : '#121212'; c.fillRect(i * 32, j * 32, 32, 32); } const rr = rng(3); const cols = ['#ff5aa8', '#5ac8ff', '#ffd23a', '#9a6aff'];
    for (let k = 0; k < 40; k++) { c.fillStyle = cols[k % 4]; const x = rr() * 128, y = rr() * 128; c.fillRect(x, y, 2, 2); c.fillRect(x - 1, y + 0.5, 4, 1); } }, [W / 1.0, 4]);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(W, 8), std({ map: floorT, roughness: 0.25, metalness: 0.2 })); fl.rotation.x = -Math.PI / 2; fl.position.z = 0; fl.receiveShadow = true; g.add(fl);
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(W, 8), std({ color: '#141012' })); ce.rotation.x = Math.PI / 2; ce.position.y = Hh; g.add(ce);
  // walls: grimy upper, checker band with red stripe, dark lower
  const grime = cvTex(128, 128, (c, w, h) => { c.fillStyle = '#3a302c'; c.fillRect(0, 0, w, h); const rr = rng(11); for (let k = 0; k < 220; k++) { c.fillStyle = `rgba(0,0,0,${0.15 + rr() * 0.3})`; const x = rr() * w; c.fillRect(x, rr() * h * 0.3, 1 + rr() * 2, 10 + rr() * 50); } for (let k = 0; k < 1500; k++) { c.fillStyle = `rgba(255,255,255,${rr() * 0.04})`; c.fillRect(rr() * w, rr() * h, 1, 1); } }, [3, 1]);
  const checkT = cvTex(32, 8, (c) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#e8e0d0' : '#121212'; c.fillRect(i * 4, j * 4, 4, 4); } }, [W / 1.0, 1], true);
  const wallSet = (len, x, z, ry) => { const w = new THREE.Group(); w.position.set(x, 0, z); w.rotation.y = ry; g.add(w); box(len, Hh - 1.7, 0.1, std({ map: grime }), 0, 1.7 + (Hh - 1.7) / 2, 0, w); const ck = checkT.clone(); ck.needsUpdate = true; ck.repeat.set(len / 1.0, 1);
    box(len, 0.24, 0.12, std({ map: ck, roughness: 0.5 }), 0, 1.45, 0.01, w); box(len, 0.07, 0.13, std({ color: '#b01818', roughness: 0.5 }), 0, 1.6, 0.01, w); box(len, 1.33, 0.1, std({ color: '#1e1a1a' }), 0, 0.665, 0, w); return w; };
  wallSet(W, 0, Z0, 0); wallSet(W, 0, 4.0, Math.PI);
  for (const sx of [-1, 1]) { const ry = sx < 0 ? Math.PI / 2 : -Math.PI / 2; wallSet(2.0, sx * W / 2, Z0 + 1.0, ry); wallSet(4.2, sx * W / 2, 1.9, ry); const top = box(0.1, Hh - 3.2, 2.0, std({ map: grime }), sx * W / 2, 3.2 + (Hh - 3.2) / 2, -1.2, g);
    // door opening (dark) with hazard frame
    const dk = box(0.05, 3.2, 2.0, std({ color: '#020202', roughness: 1 }), sx * (W / 2 + 0.4), 1.6, -1.2, g); hazardFrame(g, 2.0, 3.2, sx * (W / 2 - 0.06), 0, -1.2, ry); }
  // back wall details: screen frame with hazard border above the desk, pipes, panel, clown mask, warning sign
  { const fr = hazardFrame(g, 1.9, 1.1, -0.9, 2.55, Z0 + 0.07, 0, 0.12); box(1.8, 1.0, 0.04, std({ color: '#0a0a0c', roughness: 0.85 }), -0.9, 3.1, Z0 + 0.06, g);
    const pipe = std({ color: '#2a2624', metalness: 0.5, roughness: 0.5 }); for (const [x0, x1, y] of [[-3.6, -1.9, 2.3], [-1.9, 1.6, 2.15], [0.5, 2.2, 2.4]]) cyl(0.07, x1 - x0, pipe, (x0 + x1) / 2, y, Z0 + 0.15, g, 10, 0, Math.PI / 2);
    for (const x of [-1.9, 0.4, 1.6]) cyl(0.07, 1.4, pipe, x, 2.5, Z0 + 0.15, g, 10); for (const [x, y] of [[-1.9, 2.15], [1.6, 2.15]]) { const v = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 14), pipe); v.position.set(x, y, Z0 + 0.25); g.add(v); }
    box(0.36, 0.42, 0.06, std({ color: '#5a5450' }), -0.6, 1.95, Z0 + 0.07, g); for (let i = 0; i < 9; i++) box(0.07, 0.07, 0.03, std({ color: '#a8a098' }), -0.68 + (i % 3) * 0.08, 2.05 - Math.floor(i / 3) * 0.08, Z0 + 0.11, g);
    box(0.36, 0.42, 0.06, std({ color: '#5a5450' }), -0.15, 1.95, Z0 + 0.07, g); const rb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), std({ color: '#c81818', emissive: '#600', emissiveIntensity: 0.6 })); rb.position.set(-0.15, 1.97, Z0 + 0.14); g.add(rb);
    // clown mask (Ennard's mask) on the wall
    const mk = new THREE.Group(); mk.position.set(0.95, 3.0, Z0 + 0.12); g.add(mk); const face = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), std({ color: '#e8e4dc', roughness: 0.4 })); face.scale.set(0.85, 1.05, 0.35); mk.add(face);
    for (const sx of [-1, 1]) { box(0.1, 0.05, 0.02, std({ color: '#111' }), sx * 0.1, 0.06, 0.09, mk); box(0.02, 0.08, 0.02, std({ color: '#2a5ad8' }), sx * 0.1, -0.03, 0.09, mk); }
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), std({ color: '#d81818' })); nose.position.set(0, -0.02, 0.1); mk.add(nose); box(0.18, 0.03, 0.02, std({ color: '#d81818' }), 0, -0.13, 0.085, mk);
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 12), std({ color: '#e8c818' })); hat.position.set(0.04, 0.33, 0); hat.rotation.z = -0.2; mk.add(hat);
    // warning triangle
    const tri = new THREE.Shape(); tri.moveTo(-0.24, 0); tri.lineTo(0.24, 0); tri.lineTo(0, 0.42); tri.lineTo(-0.24, 0); const tm = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.03, bevelEnabled: false }), std({ color: '#d81c1c' })); tm.position.set(1.6, 3.35, Z0 + 0.06); g.add(tm);
    const ti = new THREE.Shape(); ti.moveTo(-0.17, 0.04); ti.lineTo(0.17, 0.04); ti.lineTo(0, 0.33); ti.lineTo(-0.17, 0.04); const tw = new THREE.Mesh(new THREE.ShapeGeometry(ti), std({ color: '#f0ece4' })); tw.position.set(1.6, 3.35, Z0 + 0.1); g.add(tw); const ex = voxText('!', '#141414', 0.035, 0.02, false); ex.position.set(1.6, 3.4, Z0 + 0.11); g.add(ex); }
  // back desk with CRTs, cups, papers, plush toys, cupcake
  { const dk = std({ color: '#1a1c22', roughness: 0.5, metalness: 0.3 }); box(2.8, 0.06, 0.9, dk, 0, 0.95, Z0 + 0.55, g); for (const sx of [-1, 1]) box(0.06, 0.95, 0.85, dk, sx * 1.37, 0.475, Z0 + 0.55, g); box(1.0, 0.8, 0.85, dk, -0.85, 0.5, Z0 + 0.55, g); for (const y of [0.3, 0.65]) box(0.9, 0.3, 0.02, std({ color: '#262a32' }), -0.85, y, Z0 + 0.985, g);
    const crt = (x, y, sc) => { const cg = new THREE.Group(); cg.position.set(x, y, Z0 + 0.5); cg.scale.setScalar(sc); g.add(cg); box(0.5, 0.42, 0.45, std({ color: '#2a2a2e', roughness: 0.5 }), 0, 0.21, 0, cg); box(0.4, 0.32, 0.02, std({ color: '#0c1418', emissive: '#0a1a20', emissiveIntensity: 0.6, roughness: 0.2 }), 0, 0.23, 0.23, cg); };
    crt(-0.9, 0.98, 1.0); crt(-0.35, 0.98, 0.8); crt(-0.4, 1.32, 0.75); crt(0.6, 0.98, 0.9); crt(0.95, 1.36, 0.65);
    const stripe = cvTex(16, 16, (c) => { for (let i = 0; i < 16; i += 4) { c.fillStyle = '#c81818'; c.fillRect(i, 0, 2, 16); c.fillStyle = '#f2f2f2'; c.fillRect(i + 2, 0, 2, 16); } }, [3, 1], true);
    for (const [x, col] of [[0.0, 0], [1.25, 1]]) { const cup = cyl(0.06, 0.2, std({ map: stripe }), x, 1.08, Z0 + 0.7, g, 14); }
    for (const [x, z] of [[-0.15, 0.75], [0.25, 0.8], [0.9, 0.85]]) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 0), std({ color: '#e8e8ec', roughness: 0.9 })); p.position.set(x, 1.02, Z0 + z); g.add(p); }
    // little plush toys on the desk (voxel): Bonnie, Freddy, Chica, a green toy
    [[0.35, '#4a5ac8'], [0.55, '#8a5a2a'], [0.75, '#e8c818'], [0.15, '#3ac83a']].forEach(([x, c], i) => { const t = voxelArt(['.c.c.', 'ccccc', 'cwcwc', 'ccccc', '.ccc.', 'cc.cc'], { c, w: '#f2f2f2' }, 0.025, 0.08); t.position.set(x, 1.06, Z0 + 0.85); g.add(t); });
    const cup = new THREE.Group(); cup.position.set(1.0, 0.98, Z0 + 0.75); g.add(cup); cyl(0.07, 0.06, std({ color: '#3ab8d8' }), 0, 0.03, 0, cup); const ck = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: '#ff6ab0' })); ck.position.y = 0.06; cup.add(ck);
    cyl(0.006, 0.06, std({ color: '#f2f2f2' }), 0, 0.17, 0, cup); const fl = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.03, 6), glow('#ffb040')); fl.position.y = 0.215; cup.add(fl); }
  // hanging lamp, star string lights, big ducts with red rings
  { const lamp = new THREE.Group(); lamp.position.set(0, Hh, -1.6); g.add(lamp); cyl(0.01, 0.5, std({ color: '#111' }), 0, -0.25, 0, lamp, 6); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.32, 0.18, 18, 1, true), std({ color: '#1a1a1a', side: THREE.DoubleSide })); sh.position.y = -0.55; lamp.add(sh);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), glow('#ffd890')); bulb.position.y = -0.62; lamp.add(bulb); S.lampBulb = bulb;
    const key = new THREE.SpotLight('#ffcf8a', 46, 12, 0.75, 0.6, 1.3); key.position.set(0, Hh - 0.5, 0.9); key.target.position.set(0, 1.3, -0.9); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); s.add(key, key.target); S.officeKey = key;
    const sm = new THREE.MeshBasicMaterial({ color: '#f0f0f6', toneMapped: false }); for (let i = 0; i < 26; i++) { const k = i / 25; const x = -4.3 + k * 8.6; const y = Hh - 0.35 - Math.sin(k * Math.PI * 2) * 0.12 - 0.15 * Math.sin(k * Math.PI); const st = star(0.05, 0.01, '#f0f0f6', '#f0f0f6', 1.2); st.position.set(x, y, Z0 + 0.4); g.add(st); }
    const duct = std({ color: '#1e1e22', roughness: 0.7 }), red = std({ color: '#a01818', emissive: '#300', emissiveIntensity: 0.4 }); for (const sx of [-1, 1]) { const d = new THREE.Group(); d.position.set(sx * 2.2, Hh, Z0 + 0.8); g.add(d);
      for (let i = 0; i < 9; i++) { const rg = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 8, 20), duct); rg.rotation.x = Math.PI / 2; rg.position.y = -0.08 - i * 0.1; d.add(rg); } cyl(0.4, 0.9, duct, 0, -0.45, 0, d, 20);
      for (let i = 0; i < 3; i++) { const rg = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.05, 8, 20), red); rg.rotation.x = Math.PI / 2; rg.position.y = -0.95 - i * 0.07; d.add(rg); } } }
  // left side: EXIT sign, security camera, fire extinguishers, prize machine with 25¢ slots
  { const ex = new THREE.Group(); ex.position.set(-4.4, 3.2, -0.6); ex.rotation.y = Math.PI / 2; g.add(ex); box(0.7, 0.32, 0.08, std({ color: '#1a0a0a' }), 0, 0, 0, ex); const t = voxText('EXIT', '#ff2a2a', 0.045, 0.03); t.position.set(0, -0.09, 0.05); ex.add(t); const el = new THREE.PointLight('#ff2020', 2.5, 3, 1.6); el.position.set(-4.1, 3.0, -0.6); g.add(el);
    const cam = new THREE.Group(); cam.position.set(-4.3, 3.7, -2.8); g.add(cam); box(0.14, 0.14, 0.3, std({ color: '#2a2a2e' }), 0.1, 0, 0, cam); box(0.38, 0.18, 0.18, std({ color: '#3a3a40' }), 0.25, -0.08, 0.1, cam).rotation.y = 0.6; const led = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), glow('#ff2020')); led.position.set(0.44, -0.08, 0.18); cam.add(led);
    for (const z of [2.3, 2.6]) { const e = cyl(0.11, 0.7, std({ color: '#a01818', roughness: 0.4 }), -4.2, 0.35, z, g, 14); cyl(0.04, 0.12, std({ color: '#2a2a2a' }), -4.2, 0.76, z, g, 8); }
    const pm = new THREE.Group(); pm.position.set(-3.3, 0, Z0 + 0.7); pm.rotation.y = 0.35; g.add(pm); S.prizeMachine = pm; box(0.9, 0.9, 0.6, std({ color: '#2a2a30', metalness: 0.4, roughness: 0.4 }), 0, 0.45, 0, pm);
    const cols = ['#ff3a3a', '#ffd23a', '#3ae83a', '#3ab8ff', '#b05aff', '#ff6ad8'];
    for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; box(0.12, 0.1, 0.03, new THREE.MeshStandardMaterial({ color: cols[i % 6], emissive: cols[i % 6], emissiveIntensity: 0.6 }), Math.sin(a) * 0.42, 1.25 + ring * 0.35, Math.cos(a) * 0.42, pm, a); }
    cyl(0.45, 0.06, std({ color: '#8a3a2a' }), 0, 1.12, 0, pm, 20); cyl(0.45, 0.06, std({ color: '#8a3a2a' }), 0, 1.65, 0, pm, 20); cyl(0.2, 0.25, std({ color: '#3a3a40' }), 0, 0.98, 0, pm, 12);
    for (const sx of [-1, 1]) { box(0.28, 0.32, 0.04, std({ color: '#c8c4bc', metalness: 0.5 }), sx * 0.2, 0.5, 0.31, pm); box(0.05, 0.12, 0.02, std({ color: '#050505' }), sx * 0.2, 0.58, 0.335, pm); const t = voxText('25c', '#1a1a1a', 0.02, 0.01, false); t.position.set(sx * 0.2, 0.38, 0.335); pm.add(t); } }
  // right side: balloons (string to the floor weight), speaker
  { const cols = ['#9a3ad8', '#e83a8a', '#3a6ae8', '#c83ab8']; [[3.3, 2.6, -3.3], [3.7, 2.9, -3.5], [3.0, 3.0, -3.6], [3.55, 2.3, -3.0]].forEach(([x, y, z], i) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), std({ color: cols[i], roughness: 0.25, metalness: 0.1 })); b.scale.y = 1.15; b.position.set(x, y, z); g.add(b);
      const pts = [new THREE.Vector3(x, y - 0.32, z), new THREE.Vector3(3.4, 0.1, -3.3)]; const st = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 4, 0.004, 4), std({ color: '#ddd' })); g.add(st); }); box(0.16, 0.1, 0.16, std({ color: '#333' }), 3.4, 0.05, -3.3, g);
    box(0.55, 0.65, 0.1, std({ color: '#1a1a1c' }), 2.6, 2.7, Z0 + 0.07, g); for (let i = 0; i < 4; i++) { const rg = new THREE.Mesh(new THREE.TorusGeometry(0.06 + i * 0.05, 0.008, 4, 20), std({ color: '#3a3a3e' })); rg.position.set(2.6, 2.7, Z0 + 0.13); g.add(rg); } }
  // FRONT desk (the player's): big black desk fan, Freddy plush, crumpled paper, microphone, striped cup, papers
  { const fd = new THREE.Group(); fd.position.set(0, 0, 1.7); g.add(fd); S.frontDesk = fd; const dm = std({ color: '#141418', roughness: 0.4, metalness: 0.3 }); box(3.6, 0.08, 1.0, dm, 0, 0.98, 0, fd); box(3.6, 0.94, 0.06, dm, 0, 0.47, 0.47, fd);
    const fan = new THREE.Group(); fan.position.set(1.15, 1.02, -0.1); fd.add(fan); S.fan = fan; cyl(0.2, 0.05, dm, 0, 0.025, 0, fan, 20); cyl(0.04, 0.4, dm, 0, 0.22, 0, fan, 10); const head = new THREE.Group(); head.position.y = 0.72; fan.add(head);
    const cage = std({ color: '#0e0e10', metalness: 0.6, roughness: 0.4 }); head.add(new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.015, 6, 36), cage)); for (let i = 0; i < 14; i++) { const sp = box(0.008, 0.68, 0.008, cage, 0, 0, 0.04, head); sp.rotation.z = i / 14 * Math.PI; }
    for (const rr of [0.12, 0.24]) head.add(new THREE.Mesh(new THREE.TorusGeometry(rr, 0.006, 4, 30), cage)); cyl(0.06, 0.12, cage, 0, 0, -0.06, head, 12, Math.PI / 2); const bl = new THREE.Group(); head.add(bl); S.fanBlades = bl;
    for (let i = 0; i < 4; i++) { const pv = new THREE.Group(); pv.rotation.z = i * Math.PI / 2; bl.add(pv); const b = box(0.13, 0.28, 0.012, std({ color: '#1a1a1e', metalness: 0.5 }), 0, 0.16, -0.02, pv); b.rotation.y = 0.3; }
    const plush = voxelArt(['.b..b.', 'bbbbbb', 'bwbbwb', 'bbnnbb', '.bbbb.', 'bbbbbb', 'bb..bb'], { b: '#6a3e1a', w: '#5aa8ff', n: '#1a0e08' }, 0.04, 0.2); plush.position.set(-0.55, 1.16, 0.1); fd.add(plush);
    for (const [x, z] of [[-1.0, 0.0], [-0.85, 0.15]]) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), std({ color: '#d8d8dc', roughness: 0.9 })); p.position.set(x, 1.07, z); fd.add(p); }
    for (const [x, ry] of [[-1.2, 0.1], [-0.9, -0.05]]) box(0.42, 0.005, 0.3, std({ color: '#e8e6e0' }), x, 1.025, 0.15, fd, ry);
    const mic = new THREE.Group(); mic.position.set(0.25, 1.06, 0.2); mic.rotation.set(0, 0.5, Math.PI / 2 - 0.15); fd.add(mic); cyl(0.03, 0.4, std({ color: '#2a2a2e', metalness: 0.5 }), 0, 0, 0, mic, 10); const mb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), std({ color: '#4a4a50', metalness: 0.7 })); mb.position.y = 0.24; mic.add(mb);
    const stripe = cvTex(16, 16, (c) => { for (let i = 0; i < 16; i += 4) { c.fillStyle = '#2a5ad8'; c.fillRect(i, 0, 2, 16); c.fillStyle = '#f2f2f2'; c.fillRect(i + 2, 0, 2, 16); } }, [3, 1], true);
    const cp = cyl(0.07, 0.24, std({ map: stripe }), 1.15, 1.14, 0.1, fd, 14); cyl(0.004, 0.18, std({ color: '#f2f2f2' }), 1.17, 1.32, 0.1, fd, 6); }
  // the monitor/tablet with the system panel (UCN-style UI drawn on its screen), in a real frame
  { const tg = new THREE.Group(); g.add(tg); S.tablet = tg; tg.visible = false; const c = document.createElement('canvas'); c.width = 640; c.height = 360; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; S.panelCanvas = c; S.panelTex = tex;
    box(0.7, 0.43, 0.04, std({ color: '#1a1a1c', roughness: 0.5 }), 0, 0, -0.02, tg); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.36), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.position.z = 0.002; tg.add(scr); const L = new THREE.PointLight('#8ad8ff', 0.6, 2.5, 2); L.position.z = 0.4; tg.add(L); }
  // lights: hanging lamp key (above), dim ambience, monitor glow, EXIT glow
  s.add(new THREE.HemisphereLight('#6a5a68', '#100c0a', 1.1)); const wash = new THREE.SpotLight('#ffcf8a', 45, 10, 1.0, 0.7, 1.2); wash.position.set(0, Hh - 0.7, -1.6); wash.target.position.set(0, 2.2, Z0); s.add(wash, wash.target); S.officeWash = wash;
  for (const sx of [-1, 1]) { const sl = new THREE.PointLight('#ffb070', 6, 6, 1.5); sl.position.set(sx * 3.2, 3.2, -2.4); s.add(sl); }
  const dl = new THREE.PointLight('#ffc890', 9, 5, 1.5); dl.position.set(-0.9, 2.6, 0.9); s.add(dl); S.deskLight = dl; // spill of the hanging lamp onto the player's desk
  const fill = new THREE.PointLight('#5a6aa0', 4, 8, 1.6); fill.position.set(0, 2.2, 0.6); s.add(fill); S.officeFill = fill;
  S.office = s; return s; }

// UCN system panel on the monitor (k = heater on 0..1, temp in degrees)
export function drawPanel(S, heater, temp) { const c = S.panelCanvas, g = c.getContext('2d'), W = c.width, H = c.height;
  g.fillStyle = '#0a0a0c'; g.fillRect(0, 0, W, H); const rr = rng(Math.floor(temp * 7)); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${rr() * 0.06})`; g.fillRect(rr() * W, rr() * H, 2, 1); }
  g.strokeStyle = 'rgba(200,200,210,0.12)'; g.lineWidth = 1; for (let x = 40; x < 380; x += 14) { g.beginPath(); g.moveTo(x, 40); g.lineTo(x, 300); g.stroke(); } for (let y = 40; y < 300; y += 14) { g.beginPath(); g.moveTo(40, y); g.lineTo(380, y); g.stroke(); }
  g.strokeStyle = '#f0f0f0'; g.lineWidth = 3; g.strokeRect(90, 110, 240, 120); g.beginPath(); g.moveTo(210, 110); g.lineTo(210, 170); g.moveTo(90, 170); g.lineTo(330, 170); g.moveTo(150, 60); g.lineTo(150, 110); g.moveTo(270, 60); g.lineTo(270, 110); g.stroke();
  g.font = 'bold 15px "DejaVu Sans Mono", monospace'; g.textBaseline = 'middle';
  [['CAM SYSTEM', 0], ['VENT SYSTEM', 0], ['DUCT SYSTEM', 1]].forEach(([t, on], i) => { const y = 50 + i * 52; g.fillStyle = on ? '#4ac8b8' : '#0a0a0c'; g.fillRect(420, y, 130, 38); g.strokeStyle = '#f0f0f0'; g.lineWidth = 2; g.strokeRect(420, y, 130, 38); g.fillStyle = on ? '#0a0a0c' : '#f0f0f0'; g.fillText(t, 432, y + 19); });
  g.font = '11px "DejaVu Sans Mono", monospace'; ['Power Generator', 'Sil. Ventilation', 'Heater', 'Power A/C', 'Global Music Box', 'OFF'].forEach((t, i) => { const y = 48 + i * 22; const on = i === 2 ? heater > 0.5 : i === 5 ? heater <= 0.5 : false;
    g.strokeStyle = '#c8c8c8'; g.lineWidth = 1; g.strokeRect(565, y, 70, 17); g.fillStyle = on ? '#e8f0e8' : '#2a2a2a'; g.fillRect(568, y + 4, 9, 9); g.fillStyle = '#d8d8d8'; g.fillText(t, 580, y + 9); });
  g.font = 'bold 30px "DejaVu Sans Mono", monospace'; g.fillStyle = temp > 80 ? '#ff3a2a' : '#e8e8e8'; g.textAlign = 'right'; g.fillText(Math.round(temp) + '°', W - 16, H - 26); g.textAlign = 'left';
  g.fillStyle = '#e8e8e8'; g.font = 'bold 22px "DejaVu Sans Mono", monospace'; g.fillText('12 AM', W - 110, 24);
  if (heater > 0.5) { const gr = g.createRadialGradient(W / 2, H, 10, W / 2, H, H); gr.addColorStop(0, `rgba(255,80,20,${0.25 * heater})`); gr.addColorStop(1, 'rgba(255,80,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  for (let y = 0; y < H; y += 3) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, y, W, 1); } S.panelTex.needsUpdate = true; }

// FNAF 6 pizzeria stage: wooden stage, purple curtains, 3D stars, checker floor, two tables with party hats, spotlights
export function buildStage6(S) {
  const s = new THREE.Scene(); s.background = new THREE.Color('#05030a'); s.fog = new THREE.Fog('#05030a', 10, 24); const g = new THREE.Group(); s.add(g);
  const floorT = cvTex(64, 64, (c) => { for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#e8e0d0' : '#141414'; c.fillRect(i * 32, j * 32, 32, 32); } }, [10, 10]);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), std({ map: floorT, roughness: 0.3, metalness: 0.1 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
  const wood = std({ color: '#5a3418', roughness: 0.6 }); box(8, 1.0, 3.4, wood, 0, 0.5, -4.0, g); box(8.1, 0.08, 3.5, std({ color: '#3a2010' }), 0, 1.0, -4.0, g);
  box(9, 5.5, 0.2, std({ color: '#140a1e' }), 0, 2.75, -5.8, g);
  const cur = std({ color: '#5a1a7a', roughness: 0.9 }); for (const sx of [-1, 1]) for (let i = 0; i < 7; i++) { const c = cyl(0.16, 4.6, cur, sx * (3.0 + i * 0.22), 3.3, -5.5 + i * 0.02, g, 10); }
  box(8.4, 0.6, 0.3, std({ color: '#4a1260' }), 0, 5.3, -5.4, g);
  for (let i = 0; i < 9; i++) { const st = star(0.2 + (i % 3) * 0.08, 0.05, ['#ffd23a', '#ff6ad8', '#5ac8ff'][i % 3], ['#ffd23a', '#ff6ad8', '#5ac8ff'][i % 3], 0.8); st.position.set(-2.4 + (i % 5) * 1.2, 2.4 + Math.floor(i / 5) * 1.3 + (i % 2) * 0.3, -5.65); g.add(st); }
  for (const x of [-3.5, 3.5]) { const t = new THREE.Group(); t.position.set(x, 0, 0.2); g.add(t); cyl(0.6, 0.06, std({ color: '#e8e8ec' }), 0, 0.78, 0, t, 24); cyl(0.05, 0.78, std({ color: '#3a3a40' }), 0, 0.39, 0, t, 8);
    for (const [hx, hz] of [[-0.25, 0.1], [0.2, -0.15]]) { const h = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 12), std({ color: hx < 0 ? '#e83a8a' : '#3ab8e8' })); h.position.set(hx, 0.92, hz); t.add(h); } }
  const key = new THREE.SpotLight('#fff0d8', 80, 16, 0.42, 0.5, 1.2); key.position.set(0, 7, 3); key.target.position.set(0, 1.5, -4); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); s.add(key, key.target); S.stageKey = key;
  for (const [x, c] of [[-3, '#ff4fd0'], [3, '#4fc8ff']]) { const sp = new THREE.SpotLight(c, 40, 14, 0.3, 0.5, 1.2); sp.position.set(x, 6.5, 0); sp.target.position.set(0, 1.5, -4); s.add(sp, sp.target); }
  const house = new THREE.PointLight('#ffe0c0', 14, 10, 1.4); house.position.set(0, 3.6, 2.2); s.add(house); const lampG = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), glow('#ffe8c0')); lampG.position.set(0, 4.2, 2.2); g.add(lampG); cyl(0.01, 1.6, std({ color: '#111' }), 0, 5.0, 2.2, g, 6);
  s.add(new THREE.HemisphereLight('#4a3a6a', '#0a0608', 0.5)); S.stage6 = s; return s; }

// the burning room (FNAF 6 ending): dark, scorched walls, embers; the fire FX is added by the shots
export function buildFireRoom(S) {
  const s = new THREE.Scene(); s.background = new THREE.Color('#050201'); s.fog = new THREE.Fog('#0a0402', 6, 18); const g = new THREE.Group(); s.add(g);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), std({ color: '#1a1210', roughness: 0.9 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
  const wall = std({ color: '#1e1612', roughness: 0.95 }); box(12, 5, 0.2, wall, 0, 2.5, -4, g); for (const sx of [-1, 1]) box(0.2, 5, 10, wall, sx * 5, 2.5, 0, g);
  const r = rng(4); for (let i = 0; i < 18; i++) { const b = box(0.3 + r() * 0.8, 0.1 + r() * 0.3, 0.3 + r() * 0.6, std({ color: '#140e0c' }), (r() - 0.5) * 8, 0.08, -3.4 + r() * 1.2, g, r() * 3); }
  for (let i = 0; i < 6; i++) box(0.12, 3.4, 0.12, std({ color: '#100a08' }), -3.5 + i * 1.4, 3.2, -3.8, g).rotation.z = (r() - 0.5) * 0.6;
  s.add(new THREE.HemisphereLight('#5a2a10', '#000', 0.3)); S.fireRoom = s; return s; }
