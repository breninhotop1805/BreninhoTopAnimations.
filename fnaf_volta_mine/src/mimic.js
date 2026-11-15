// The Mimic (Secret of the Mimic look), built on the Minecraft Character rig (skin meshes hidden).
// Reference: lanky rusty endoskeleton; small head made of a pipe cage with a silver strap over the top, two lamp-like
// eyes at different heights (glowing lens, white iris, tiny pupil), chattering-teeth mouth; shoulder bar with gear ends,
// crate on the chest with an X, bundle of orange/red/yellow cables, segmented spine, triangular pelvis frame,
// bellows (corrugated) upper limbs, hinge elbows/knees, long claw hands, flat plated 3-toed feet.
import * as THREE from 'three';
import { Character, U } from './skin.js';

let SEEDP = 3; const rnd = () => ((SEEDP = (SEEDP * 1664525 + 1013904223) >>> 0) / 4294967296);
function pixTex(n = 8) { const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d');
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = Math.round(200 + 55 * rnd() - (x === 0 || y === 0 ? 30 : 0)); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 1, 1); }
  const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace; return t; }
const M = (c, metal = 0.6, rough = 0.55, em = null, ei = 0) => new THREE.MeshStandardMaterial({ color: c, map: pixTex(), metalness: metal, roughness: rough, emissive: em || '#000000', emissiveIntensity: ei });
export function buildMimicV2(canvas) {
  const ch = new Character('mimic', canvas, { prop: { leg: 1.32, arm: 1.42, torso: 1.12 } });
  for (const m of [ch.body, ch.bodyO, ch.headMesh, ch.hat]) m.visible = false; for (const L of [ch.armR, ch.armL, ch.legR, ch.legL]) { L.a.visible = false; L.o.visible = false; }
  const met = M('#5a4844'), met2 = M('#6e5650', 0.7, 0.5), dk = M('#2a2222', 0.6, 0.55), rust = M('#7a4a38', 0.55, 0.6), silver = M('#c8c4c8', 0.35, 0.4), plate = M('#4a3e3e', 0.7, 0.5);
  const cab = ['#e8742a', '#c8402a', '#e8b24a', '#8a2a2a', '#3a2a2a'].map(c => M(c, 0.1, 0.55, c, 0.12));
  const add = (m, p) => { m.castShadow = true; m.receiveShadow = true; p.add(m); return m; };
  const cyl = (r, h, mat, x, y, z, p, rx = 0, rz = 0, ry = 0, seg = 12) => { const m = add(new THREE.Mesh(new THREE.BoxGeometry(2 * r * U * 0.9, h * U, 2 * r * U * 0.9), mat), p); m.position.set(x * U, y * U, z * U); m.rotation.set(rx, ry, rz); return m; };
  const box = (w, h, d, mat, x, y, z, p) => { const m = add(new THREE.Mesh(new THREE.BoxGeometry(w * U, h * U, d * U), mat), p); m.position.set(x * U, y * U, z * U); return m; };
  const ball = (r, mat, x, y, z, p) => { const m = add(new THREE.Mesh(new THREE.BoxGeometry(1.8 * r * U, 1.8 * r * U, 1.8 * r * U), mat), p); m.position.set(x * U, y * U, z * U); return m; };
  const tube = (pts, mat, p, r = 0.2) => { const cv = new THREE.CatmullRomCurve3(pts.map(q => new THREE.Vector3(q[0] * U, q[1] * U, q[2] * U))); const s2 = Math.max(0.5, 2.2 * r) * U; const n = Math.max(3, Math.ceil(cv.getLength() / s2));
    const g = new THREE.Group(); p.add(g); const geo = new THREE.BoxGeometry(s2 * 1.05, s2 * 1.05, s2 * 1.05); for (let i = 0; i <= n; i++) { const v = cv.getPointAt(i / n); const m = add(new THREE.Mesh(geo, mat), g); m.position.copy(v); } return g; };
  const bellows = (r, h, y0, p, mat = dk, n = 9) => { cyl(r * 0.72, h, met, 0, y0 - h / 2, 0, p); for (let i = 0; i < n; i++) cyl(r, h / n * 0.62, mat, 0, y0 - (i + 0.5) * h / n, 0, p); };
  const gear = (x, y, z, r, p) => { const g = new THREE.Group(); g.position.set(x * U, y * U, z * U); p.add(g); cyl(r, 0.7, dk, 0, 0, 0, g, 0, Math.PI / 2); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; box(0.6, 0.45, 0.45, dk, 0, Math.cos(a) * (r + 0.25), Math.sin(a) * (r + 0.25), g).rotation.x = a; } cyl(0.4, 0.9, silver, 0, 0, 0, g, 0, Math.PI / 2); return g; };

  // ---------------- torso ----------------
  const T = ch.torso;
  cyl(0.55, 13.6, met, 0, 11.4, 0, T, 0, Math.PI / 2);                                 // shoulder bar
  gear(-6.6, 11.4, 0, 1.15, T); gear(6.6, 11.4, 0, 1.15, T);
  tube([[0, 13.4, 0], [2.4, 12.6, 0.4], [5.2, 11.6, 0.2]], met2, T, 0.38);              // slanted pipe neck -> shoulder
  tube([[0, 13.4, 0], [-1.8, 12.4, 0.5], [-4.6, 11.7, 0.3]], met2, T, 0.3);
  for (const sx of [-1, 1]) box(1.1, 1.4, 1.4, rust, sx * 3.4, 11.4, 0, T);             // clamps on the bar
  const crate = box(3.4, 3.2, 2.6, rust, 0, 9.0, 0.3, T);                               // chest crate with an X
  for (const s of [1, -1]) { const d = box(4.2, 0.35, 0.2, dk, 0, 9.0, 1.65, T); d.rotation.z = s * 0.75; }
  box(3.6, 0.3, 2.8, dk, 0, 10.65, 0.3, T); box(3.6, 0.3, 2.8, dk, 0, 7.35, 0.3, T);
  // cable bundle from the crate to both shoulders (drooping), and down the spine
  [[0, -1], [1, -1], [2, 1], [3, 1], [0, 1], [2, -1]].forEach(([c, sx], i) => tube([[sx * 1.6, 9.4 - i * 0.2, 0.9], [sx * 3.4, 8.2 - (i % 3) * 0.4, 1.0 + (i % 2) * 0.3], [sx * 5.4, 10.6, 0.5]], cab[c], T, 0.22));
  tube([[0.8, 7.4, 0.9], [1.6, 5.0, 1.1], [0.9, 2.6, 1.0]], cab[2], T, 0.2); tube([[-0.6, 7.4, 0.8], [-1.2, 4.6, 0.9], [-0.7, 2.2, 0.8]], cab[1], T, 0.18);
  // segmented spine
  cyl(0.55, 6, met, 0, 4.6, 0, T); for (let i = 0; i < 6; i++) cyl(i % 2 ? 0.95 : 0.8, 0.55, i % 2 ? dk : met2, 0, 2.6 + i * 0.85, 0, T);
  box(2.6, 1.5, 1.6, rust, 0, 1.7, 0, T); box(2.9, 0.35, 1.9, dk, 0, 2.5, 0, T);          // clamp/bracket
  // pelvis: triangle of pipes + T joint + hip balls
  const P = ch.pelvis; cyl(0.45, 7.2, met, 0, 0.6, 0, P, 0, Math.PI / 2); tube([[0, 2.6, 0], [-1.8, 1.6, 0.2], [-3.4, 0.6, 0]], met, P, 0.4); tube([[0, 2.6, 0], [1.8, 1.6, 0.2], [3.4, 0.6, 0]], met, P, 0.4);
  box(1.4, 1.0, 1.0, dk, 0, 0.6, 0, P); tube([[0.6, 2.6, 0.6], [2.2, 1.4, 1.0], [1.4, 0.2, 0.8]], cab[0], P, 0.3);
  // ---------------- head ----------------
  const H = new THREE.Group(); H.position.set(0, 4.9 * U, 0.2 * U); ch.head.add(H); ch.mimicHead = H;
  cyl(0.36, 4.8, met, 0, -3.0, -0.2, H); cyl(0.75, 0.45, dk, 0, -5.2, -0.2, H); cyl(0.6, 0.35, dk, 0, -3.0, -0.2, H); tube([[0.4, -5.0, 0.2], [0.7, -3.6, 0.4], [0.3, -2.4, 0.3]], cab[1], H, 0.16);  // long thin neck + collars
  box(2.6, 2.4, 2.2, dk, 0, 1.0, -0.4, H);                                              // small core
  // silver strap loop over the top (tilted) + a second bent pipe
  tube([[-1.4, 1.2, -1.2], [-1.6, 3.6, -0.6], [-0.4, 4.6, 0.2], [1.6, 4.0, 0.2], [2.0, 2.0, -0.4]], silver, H, 0.45, 32);
  tube([[-1.0, 1.6, -1.8], [0.2, 3.8, -1.6], [1.4, 1.6, -1.6]], silver, H, 0.35, 24);
  tube([[-2.4, 0.2, -0.4], [-2.9, 1.8, -0.8], [-1.6, 3.0, -1.4]], cab[3], H, 0.3); tube([[2.4, -0.4, -0.6], [2.8, 1.4, -1.2], [1.0, 2.4, -1.8]], cab[4], H, 0.3);
  tube([[-2.0, -1.0, 0.8], [-2.6, 0.6, 0.4], [-2.2, 2.4, -0.2]], cab[1], H, 0.22); tube([[2.0, -1.4, 0.6], [2.7, 0.2, 0.2]], cab[0], H, 0.22);
  // lamp eyes at different heights (character's right eye higher), glowing lens + white iris + tiny pupil
  ch.eyeMats = []; ch.pupils = [];
  const eye = (x, y, z, ry, rz) => { const g = new THREE.Group(); g.position.set(x * U, y * U, z * U); g.rotation.set(0, ry, rz); H.add(g);
    cyl(1.0, 1.5, dk, 0, 0, 0, g, Math.PI / 2); cyl(1.12, 0.3, met2, 0, 0, 0.7, g, Math.PI / 2);
    const lens = new THREE.MeshBasicMaterial({ color: '#ffc86a', toneMapped: false }); ch.eyeMats.push(lens); cyl(0.86, 0.2, lens, 0, 0, 0.82, g, Math.PI / 2, 0, 0, 20);
    const iris = new THREE.MeshBasicMaterial({ color: '#fff4dc', toneMapped: false }); ch.eyeMats.push(iris); cyl(0.55, 0.2, iris, 0, 0, 0.9, g, Math.PI / 2, 0, 0, 18);
    const pu = cyl(0.2, 0.2, new THREE.MeshBasicMaterial({ color: '#1a0c06' }), 0, 0, 0.98, g, Math.PI / 2, 0, 0, 12); ch.pupils.push(pu); return g; };
  ch.eyeR = eye(-1.3, 1.3, 1.0, -0.12, 0.1); ch.eyeL = eye(1.4, 0.0, 0.9, 0.15, -0.08);
  ch.eyeLight = new THREE.PointLight('#ffa040', 1.0, 1.8, 2); ch.eyeLight.position.set(0, 0.6 * U, 3.2 * U); H.add(ch.eyeLight);
  // chattering-teeth mouth: upper gum + teeth on the head, lower gum + teeth on the jaw (opens)
  const gum = M('#7a2a22', 0.3, 0.5, '#ff5a2a', 0.1), tooth = M('#e8dcc0', 0.1, 0.4, '#ffe0a0', 0.06);
  box(2.4, 0.45, 1.0, gum, 0.1, -1.55, 1.1, H); for (let i = 0; i < 6; i++) box(0.3, 0.42, 0.24, tooth, -0.72 + i * 0.34, -1.95, 1.55, H);
  const jaw = new THREE.Group(); jaw.position.set(0.1 * U, -2.1 * U, 0.6 * U); H.add(jaw); ch.jaw = jaw;
  box(2.4, 0.45, 1.1, gum, 0, -0.55, 0.45, jaw); for (let i = 0; i < 6; i++) box(0.3, 0.42, 0.24, tooth, -0.85 + i * 0.34, -0.1, 0.95, jaw);
  tube([[-1.7, -0.4, 0.2], [-2.1, -1.0, 0.8], [-1.4, -1.2, 1.3]], met, jaw, 0.2); tube([[1.7, -0.4, 0.2], [2.1, -1.0, 0.8], [1.4, -1.2, 1.3]], met, jaw, 0.2);
  tube([[-1.8, -1.0, 1.2], [-2.4, -1.6, 0.4], [-1.6, -2.6, -0.2]], silver, H, 0.22); // jaw spring/bracket
  // ---------------- limbs ----------------
  const limb = (L, arm, side, variant) => { const p = L.piv; const g = new THREE.Group(); p.add(g);
    ball(1.0, met2, 0, -0.2, 0, g);
    if (variant) bellows(1.0, 5.2, -0.9, g); else { cyl(0.55, 5.4, met, 0, -3.6, 0, g); cyl(0.85, 1.4, dk, 0.35, -2.2, 0.2, g); cyl(0.85, 1.4, dk, -0.35, -2.4, -0.2, g); cyl(0.3, 2.4, silver, 0.5, -4.4, 0.3, g); }
    tube([[0.8, -1.0, 0.6], [1.0, -3.5, 0.8], [0.7, -6.0, 0.5]], cab[arm ? (variant ? 1 : 2) : 0], g, 0.2);
    // hinge joint
    const j = new THREE.Group(); j.position.y = -6.4 * U; g.add(j); cyl(0.85, 1.9, dk, 0, 0, 0, j, 0, Math.PI / 2); for (const s of [-1, 1]) cyl(0.45, 0.4, silver, s * 1.05, 0, 0, j, 0, Math.PI / 2);
    const f = new THREE.Group(); j.add(f); if (arm) f.rotation.x = -0.18; else f.rotation.x = 0.08; L.fore = f;
    if (variant) { for (const s of [-1, 1]) cyl(0.28, 5.0, met, s * 0.6, -2.6, 0, f); for (let i = 0; i < 4; i++) box(1.6, 0.3, 0.6, dk, 0, -0.8 - i * 1.3, 0, f); tube([[0.2, -0.4, 0.3], [-0.3, -2.6, 0.5], [0.3, -4.8, 0.2]], cab[2], f, 0.18); tube([[-0.3, -0.4, -0.2], [0.3, -2.8, -0.3]], cab[1], f, 0.16); }
    else { bellows(0.85, 4.8, -0.4, f, dk, 8); box(1.4, 3.0, 1.0, plate, 0, -2.2, 0.55, f); }
    if (arm) { // long claw hand
      const h = new THREE.Group(); h.position.y = -5.6 * U; f.add(h); box(1.5, 1.1, 0.9, plate, 0, -0.2, 0, h);
      for (let k = 0; k < 3; k++) { const fx = -0.55 + k * 0.55; const s1 = new THREE.Group(); s1.position.set(fx * U, -0.8 * U, 0.1 * U); s1.rotation.x = 0.2; h.add(s1); box(0.36, 2.0, 0.36, met2, 0, -1.0, 0, s1);
        const s2 = new THREE.Group(); s2.position.y = -2.0 * U; s2.rotation.x = 0.35; s1.add(s2); box(0.32, 1.6, 0.32, met, 0, -0.8, 0, s2); box(0.3, 0.7, 0.3, dk, 0, -1.8, 0.1, s2); }
      const th = new THREE.Group(); th.position.set(side * -0.8 * U, -0.4 * U, 0.3 * U); th.rotation.set(0.5, 0, side * 0.4); h.add(th); box(0.34, 1.8, 0.34, met2, 0, -0.9, 0, th);
      const a = new THREE.Group(); a.position.y = -6.4 * U; f.add(a); L.handAnchor = a;
    } else { // flat plated foot with 3 toes
      const ft = new THREE.Group(); ft.position.y = -5.3 * U; f.add(ft); f.rotation.x = 0.08; ft.rotation.x = -0.16; box(2.6, 0.9, 4.6, plate, 0, -0.35, 1.0, ft); for (let i = 0; i < 4; i++) box(2.4, 0.15, 0.2, dk, 0, 0.12, -0.6 + i * 0.9, ft);
      for (let k = -1; k <= 1; k++) { box(0.6, 0.6, 1.3, met2, k * 0.8, -0.5, 3.8, ft); box(0.5, 0.4, 0.5, dk, k * 0.8, -0.55, 4.6, ft); } box(1.2, 0.8, 1.0, dk, 0, -0.3, -1.6, ft); cyl(0.5, 1.4, met, 0, 0.6, 0, ft); } };
  limb(ch.armR, true, -1, 1); limb(ch.armL, true, 1, 0); limb(ch.legR, false, -1, 0); limb(ch.legL, false, 1, 1);
  // joints placed on the frame: shoulders at the bar ends, hips at the pelvis triangle corners
  ch.armR.piv.position.x = -6.6 * U; ch.armL.piv.position.x = 6.6 * U; ch.armR.piv.position.y = ch.armL.piv.position.y = 10.4 * U; ch.neck.position.y = 12.2 * U;
  ch.legR.piv.position.x = -3.0 * U; ch.legL.piv.position.x = 3.0 * U;
  // hand anchors for props follow the claw
  ch.handR.removeFromParent(); ch.handL.removeFromParent(); ch.handR = ch.armR.handAnchor; ch.handL = ch.armL.handAnchor;
  ch.setEyeGlow = (c, k = 1) => { ch.eyeMats[0].color.set(c || '#ffb84a').multiplyScalar(0.25 + 0.75 * k); ch.eyeMats[2].color.set(c || '#ffb84a').multiplyScalar(0.25 + 0.75 * k); ch.eyeLight.intensity = 1.0 * k; };
  ch.setPupil = s => ch.pupils.forEach(p => p.scale.set(s, 1, s));        // 1 = normal, 0.5 = focused, 1.6 = wide
  ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const r0 = ch.reset.bind(ch); ch.reset = () => { r0(); if (ch.jaw) ch.jaw.rotation.x = 0; ch.setPupil(1); ch.mimicHead.rotation.set(0, 0, 0); };
  ch.baseScale = 1.45; return ch;
}
