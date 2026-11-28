// EP04 props: beanie (gorro), cap (boné), bouquet, trash can, chalk, sandwich, gavel, lab glassware, suspects board, odds board,
// thermometer sign, "no beanie" sign, polaroid photo, pool. Every piece is solid 3D; texts are world objects (Montserrat).
import * as THREE from 'three';
import { mat, bx, obst, canvasTex, textTex, WORLD_FONT } from './kit.js';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const M = (g, geo, m, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; g.add(me); return me; };
const knitTex = (col) => canvasTex(256, 128, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, 'rgba(0,0,0,0.22)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.10)'); gr.addColorStop(1, 'rgba(0,0,0,0.22)'); g.fillStyle = gr; g.fillRect(x, 0, 16, h); }
  for (let y = 0; y < h; y += 8) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(0, y, w, 2); } }, [6, 1]);
// knitted beanie: fits the classic head (top ~1.30, radius ~0.62) — the cuff stops ABOVE the eyebrows. group local = head local.
export function beanie(col = '#e84a6a', cuff = '#f4f4f0', pom = '#ffffff') { const g = new THREE.Group(); g.name = 'gorro';
  const prof = [V(0.72, 0.0, 0), V(0.725, 0.2, 0), V(0.72, 0.36, 0), V(0.66, 0.5, 0), V(0.52, 0.62, 0), V(0.3, 0.69, 0), V(0, 0.71, 0)].map(v => new THREE.Vector2(v.x, v.y));
  const dome = M(g, new THREE.LatheGeometry(prof, 40), new THREE.MeshStandardMaterial({ color: '#ffffff', map: knitTex(col), roughness: 0.95 }), 0, 1.0, 0);
  const band = M(g, new THREE.CylinderGeometry(0.75, 0.76, 0.3, 40, 1, true), new THREE.MeshStandardMaterial({ color: '#ffffff', map: knitTex(cuff), roughness: 0.95, side: THREE.DoubleSide }), 0, 1.07, 0);
  M(g, new THREE.TorusGeometry(0.755, 0.035, 8, 40), cuff, 0, 1.22, 0).rotation.x = Math.PI / 2; M(g, new THREE.TorusGeometry(0.755, 0.035, 8, 40), cuff, 0, 0.92, 0).rotation.x = Math.PI / 2;
  if (pom) { const p = M(g, new THREE.IcosahedronGeometry(0.24, 2), mat(pom, { rough: 1 }), 0, 1.76, 0); p.name = 'pompom'; }
  g.userData.clip = 0.98; return g; }
// cap (boné): crown + visor; rot = Math.PI to wear it backwards
export function cap(col = '#2a62d8', visor) { const g = new THREE.Group(); g.name = 'bone';
  const prof = [new THREE.Vector2(0.71, 0), new THREE.Vector2(0.7, 0.18), new THREE.Vector2(0.6, 0.38), new THREE.Vector2(0.38, 0.52), new THREE.Vector2(0, 0.56)];
  M(g, new THREE.LatheGeometry(prof, 40), mat(col, { rough: 0.7 }), 0, 1.02, 0); M(g, new THREE.SphereGeometry(0.07, 10, 8), mat(visor || col), 0, 1.58, 0);
  const vis = M(g, new THREE.CylinderGeometry(0.62, 0.62, 0.06, 32, 1, false, -Math.PI / 2, Math.PI), mat(visor || col, { rough: 0.7 }), 0, 1.05, 0.38); vis.scale.set(1, 1, 1.05); vis.rotation.x = 0.12;
  g.userData.clip = 1.0; return g; }
// bouquet held by the stem (group origin = the hand grip; flowers along +y)
export function bouquet() { const g = new THREE.Group(); g.name = 'buque';
  const wrap = M(g, new THREE.ConeGeometry(0.62, 1.6, 20, 1, true), new THREE.MeshStandardMaterial({ color: '#f6a8c8', roughness: 0.8, side: THREE.DoubleSide }), 0, 0.55, 0); wrap.rotation.x = Math.PI;
  M(g, new THREE.TorusGeometry(0.2, 0.06, 8, 18), '#e83a5a', 0, 0.15, 0).rotation.x = Math.PI / 2;
  const cols = ['#e8283a', '#f4c03a', '#ff7ab8', '#ffffff', '#b84ae8', '#ff8a3a']; let s = 3; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, rr = r() * 0.5, y = 1.35 + r() * 0.45 - rr * 0.4; const f = new THREE.Group(); g.add(f); f.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr);
    for (let k = 0; k < 5; k++) { const p = M(f, new THREE.SphereGeometry(0.11, 8, 6), cols[i % cols.length]); const b = k / 5 * Math.PI * 2; p.position.set(Math.cos(b) * 0.1, 0, Math.sin(b) * 0.1); p.scale.set(1, 0.55, 1); }
    M(f, new THREE.SphereGeometry(0.07, 8, 6), '#f4d03a', 0, 0.03, 0); }
  for (let i = 0; i < 7; i++) { const l = M(g, new THREE.ConeGeometry(0.1, 0.6, 6), '#3aa84a', Math.cos(i) * 0.42, 1.2, Math.sin(i) * 0.42); l.rotation.set(Math.sin(i) * 0.6, 0, Math.cos(i) * 0.6); }
  return g; }
// green school trash can (open top, dark inside) — top at y 2.0
export function trashCan(p, s, x, z, name = 'lixeira') { const g = new THREE.Group(); p.add(g); g.position.set(x, 0, z);
  const body = M(g, new THREE.CylinderGeometry(0.95, 0.8, 2.0, 28, 1, true), new THREE.MeshStandardMaterial({ color: '#2aa84a', roughness: 0.5, side: THREE.DoubleSide }), 0, 1.0, 0);
  M(g, new THREE.CylinderGeometry(0.79, 0.79, 0.08, 28), '#1a5a2a', 0, 0.1, 0); M(g, new THREE.TorusGeometry(0.95, 0.07, 8, 28), '#1f8a3a', 0, 2.0, 0).rotation.x = Math.PI / 2;
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (q, w, h) => { q.fillStyle = '#2aa84a'; q.fillRect(0, 0, w, h); q.strokeStyle = '#ffffff'; q.lineWidth = 9; for (let k = 0; k < 3; k++) { q.beginPath(); q.arc(w / 2, h / 2, 36, k * 2.1 + 0.3, k * 2.1 + 1.6); q.stroke(); } }), transparent: false }));
  lab.position.set(0, 1.15, 0.9); lab.rotation.x = -0.075; g.add(lab); if (s) obst(s, body, name); g.userData.top = 2.0; return g; }
export function chalk() { const g = new THREE.Group(); M(g, new THREE.CylinderGeometry(0.08, 0.08, 0.6, 10), '#fbfbf4'); return g; }
export function sandwich() { const g = new THREE.Group(); bx(g, 0.9, 0.16, 0.9, '#e8b86a', 0, 0.08, 0, { r: 0.06 }); bx(g, 0.95, 0.06, 0.95, '#5ac84a', 0, 0.19, 0, { r: 0.02 }); bx(g, 0.92, 0.06, 0.92, '#f4c83a', 0, 0.25, 0, { r: 0.02 }); bx(g, 0.88, 0.08, 0.88, '#d8504a', 0, 0.31, 0, { r: 0.03 }); bx(g, 0.9, 0.16, 0.9, '#e8b86a', 0, 0.42, 0, { r: 0.06 }); return g; }
export function gavel() { const g = new THREE.Group(); M(g, new THREE.CylinderGeometry(0.06, 0.07, 1.2, 10), '#8a5a2a', 0, 0.6, 0); const h = M(g, new THREE.CylinderGeometry(0.2, 0.2, 0.7, 16), '#6a3a1a', 0, 1.25, 0); h.rotation.z = Math.PI / 2; return g; }
// glassware: Erlenmeyer flask with glowing liquid
export function flask(col = '#3ae86a', h = 1.2) { const g = new THREE.Group(); const prof = [new THREE.Vector2(0.01, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0.52, 0.06), new THREE.Vector2(0.16, 0.75 * h), new THREE.Vector2(0.15, h), new THREE.Vector2(0.18, h + 0.04)];
  M(g, new THREE.LatheGeometry(prof, 24), new THREE.MeshPhysicalMaterial({ color: '#e8f6ff', roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.45, thickness: 0.2 }));
  const liq = [new THREE.Vector2(0.01, 0.02), new THREE.Vector2(0.47, 0.02), new THREE.Vector2(0.3, 0.42 * h), new THREE.Vector2(0.01, 0.42 * h)];
  M(g, new THREE.LatheGeometry(liq, 24), mat(col, { em: col, ei: 0.6 })); return g; }
// photo (polaroid) — photo texture set later (rendered portrait of the real character)
export function polaroid(label) { const g = new THREE.Group(); bx(g, 2.2, 2.6, 0.06, '#fbfbf6', 0, 0, 0, { r: 0.02 });
  const ph = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshStandardMaterial({ color: '#888888', roughness: 0.7 })); ph.position.set(0, 0.2, 0.065); g.add(ph); g.userData.photo = ph;
  if (label) { const t = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.4), new THREE.MeshStandardMaterial({ map: textTex([label], { w: 512, h: 108, color: '#1a1a22', size: 0.7 }), transparent: true })); t.position.set(0, -1.0, 0.065); g.add(t); }
  const pin = M(g, new THREE.SphereGeometry(0.1, 10, 8), '#e8283a', 0, 1.15, 0.1); g.userData.pin = pin; return g; }
// suspects cork board: header + 3 polaroids + red strings to a "?" card
export function suspectsBoard(p, s, x, y, z, ry = 0) { const g = new THREE.Group(); p.add(g); g.position.set(x, y, z); g.rotation.y = ry; const W = 9.2, H = 6.2;
  bx(g, W + 0.5, H + 0.5, 0.24, '#8a5a2a', 0, 0, -0.08, { r: 0.05 }); const cork = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: canvasTex(512, 360, (q, w, h) => { q.fillStyle = '#c8945a'; q.fillRect(0, 0, w, h); let s2 = 5; const r = () => ((s2 = (s2 * 16807) % 2147483647) / 2147483647); for (let i = 0; i < 2600; i++) { q.fillStyle = `rgba(${r() > 0.5 ? '90,50,20' : '240,200,150'},${0.15 + r() * 0.2})`; q.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 3); } }), roughness: 1 }));
  cork.position.z = 0.05; g.add(cork);
  const head = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 0.95), new THREE.MeshStandardMaterial({ map: textTex(['SUSPEITOS'], { w: 1024, h: 190, bg: '#fbfbf4', color: '#d8283a', size: 0.72 }) })); head.position.set(0, H / 2 - 0.7, 0.09); g.add(head);
  const P = [['VALENTÃO', -3.0, -0.4, -0.08], ['DIRETORA', 0, -0.7, 0.05], ['NOVATA', 3.0, -0.4, 0.1]].map(([l, px, py, rz], i) => { const pp = polaroid(l); g.add(pp); pp.position.set(px, py, 0.12 + i * 0.02); pp.rotation.z = rz; return pp; });
  const q = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshStandardMaterial({ map: textTex(['?'], { w: 128, h: 128, bg: '#f4d03a', color: '#1a1a22', size: 0.8 }) })); q.position.set(0, 1.55, 0.1); g.add(q);
  for (const pp of P) { const a = q.position.clone().add(V(0, -0.35, 0.08)), b = pp.position.clone().add(V(0, 1.15, 0.12)); const d = b.clone().sub(a); const str = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, d.length(), 6), mat('#d8182a')); str.position.copy(a).addScaledVector(d, 0.5); str.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); g.add(str); }
  g.userData.photos = P; if (s) obst(s, g, 'mural'); return g; }
// small chalk board with the bets
export function oddsBoard(p, x, y, z, ry = 0) { const g = new THREE.Group(); p.add(g); g.position.set(x, y, z); g.rotation.y = ry; bx(g, 4.6, 3.4, 0.16, '#8a5a2a', 0, 0, -0.06);
  const t = canvasTex(768, 560, (q, w, h) => { q.fillStyle = '#2a5a3a'; q.fillRect(0, 0, w, h); q.fillStyle = '#ffffff'; q.font = `900 86px ${WORLD_FONT}`; q.textAlign = 'center'; q.fillText('APOSTAS', w / 2, 100); q.font = `800 62px ${WORLD_FONT}`; q.textAlign = 'left';
    [['DIRETORA', '3 x 1', '#f4d03a'], ['VALENTÃO', '2 x 1', '#ffffff'], ['NOVATA', '9 x 1', '#ffffff']].forEach(([n, o, c], i) => { q.fillStyle = c; q.fillText(n, 50, 230 + i * 110); q.textAlign = 'right'; q.fillText(o, w - 50, 230 + i * 110); q.textAlign = 'left'; }); });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.0), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 })); pl.position.z = 0.04; g.add(pl); return g; }
// street thermometer sign "40°C" (column rises with .set(k))
export function thermometer(p, s, x, z, ry = 0) { const g = new THREE.Group(); p.add(g); g.position.set(x, 0, z); g.rotation.y = ry; bx(g, 0.3, 6, 0.3, '#6a6a78', 0, 3, 0); bx(g, 2.6, 5.4, 0.3, '#ffffff', 0, 8.4, 0.1, { r: 0.2 });
  const tube = M(g, new THREE.CylinderGeometry(0.28, 0.28, 3.6, 16), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.1, transparent: true, opacity: 0.35 }), -0.5, 8.6, 0.42); tube.userData.noQA = true;
  M(g, new THREE.SphereGeometry(0.45, 16, 12), mat('#e8283a', { em: '#ff3a2a', ei: 0.5 }), -0.5, 6.6, 0.42); const col = M(g, new THREE.CylinderGeometry(0.17, 0.17, 1, 12), mat('#e8283a', { em: '#ff3a2a', ei: 0.5 }), -0.5, 6.9, 0.42);
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), new THREE.MeshStandardMaterial({ map: textTex(['40°C'], { w: 256, h: 160, color: '#d8283a', size: 0.7 }), transparent: true })); lab.position.set(0.55, 9.6, 0.27); g.add(lab);
  g.set = k => { const L = 0.3 + 3.1 * k; col.scale.y = L; col.position.y = 6.75 + L / 2; }; g.set(1); if (s) obst(s, g.children[0], 'poste'); return g; }
// pool sign "PROIBIDO GORRO" (beanie icon with a red circle-slash: a real school sign)
export function noBeanieSign(p, x, y, z, ry = 0) { const g = new THREE.Group(); p.add(g); g.position.set(x, y, z); g.rotation.y = ry; bx(g, 5.0, 3.6, 0.16, '#ffffff', 0, 0, -0.06, { r: 0.1 });
  const t = canvasTex(640, 460, (q, w, h) => { q.fillStyle = '#ffffff'; q.fillRect(0, 0, w, h); q.fillStyle = '#e84a6a'; q.beginPath(); q.ellipse(w / 2, 200, 110, 90, 0, Math.PI, 0); q.fill(); q.fillRect(w / 2 - 118, 196, 236, 44); q.fillStyle = '#ffffff'; q.beginPath(); q.arc(w / 2, 96, 26, 0, 7); q.fill(); q.strokeStyle = '#e84a6a'; q.lineWidth = 6; q.stroke();
    q.strokeStyle = '#d8182a'; q.lineWidth = 26; q.beginPath(); q.arc(w / 2, 180, 150, 0, 7); q.stroke(); q.beginPath(); q.moveTo(w / 2 - 106, 74); q.lineTo(w / 2 + 106, 286); q.stroke();
    q.fillStyle = '#1a1a22'; q.font = `900 64px ${WORLD_FONT}`; q.textAlign = 'center'; q.fillText('PROIBIDO GORRO', w / 2, 410); });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.3), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 })); pl.position.z = 0.04; g.add(pl); return g; }
// calendar sheet (no flip): month header + day (+ heart)
export function bigCalendar(p, x, y, z, ry, month, day, heart = false) { const g = new THREE.Group(); p.add(g); g.position.set(x, y, z); g.rotation.y = ry; bx(g, 3.2, 4.0, 0.12, '#c8a070', 0, 0, -0.05);
  const t = canvasTex(512, 640, (q, w, h) => { q.fillStyle = '#fbfaf6'; q.fillRect(0, 0, w, h); q.fillStyle = heart ? '#e8285a' : '#2a8ad8'; q.fillRect(0, 0, w, 150); q.fillStyle = '#ffffff'; q.font = `900 76px ${WORLD_FONT}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(month, w / 2, 80);
    q.fillStyle = '#1a1a22'; q.font = `900 300px ${WORLD_FONT}`; q.fillText(String(day), w / 2, 400); if (heart) { q.fillStyle = '#e8285a'; q.beginPath(); const hx = w - 95, hy = 560; q.moveTo(hx, hy + 30); q.bezierCurveTo(hx - 70, hy - 10, hx - 40, hy - 60, hx, hy - 25); q.bezierCurveTo(hx + 40, hy - 60, hx + 70, hy - 10, hx, hy + 30); q.fill(); } });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 3.6), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 })); pl.position.z = 0.04; g.add(pl); for (const sx of [-0.8, 0, 0.8]) M(g, new THREE.TorusGeometry(0.13, 0.04, 8, 16), mat('#888888', { metal: 0.6 }), sx, 1.85, 0.1); return g; }
// year counter (2006 -> 2026) as a flip-sign on the lab wall
export function yearSign(p, x, y, z, ry = 0) { const g = new THREE.Group(); p.add(g); g.position.set(x, y, z); g.rotation.y = ry; bx(g, 4.6, 1.9, 0.14, '#1a1a22', 0, 0, -0.05, { r: 0.08 });
  const c = document.createElement('canvas'); c.width = 512; c.height = 200; const q = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; let last = null;
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.6), new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.6 })); pl.position.z = 0.04; g.add(pl);
  g.set = yr => { if (yr === last) return; last = yr; q.fillStyle = '#101018'; q.fillRect(0, 0, 512, 200); q.fillStyle = '#4ae8ff'; q.font = `900 150px ${WORLD_FONT}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(String(yr), 256, 104); tex.needsUpdate = true; }; g.set(2006); return g; }
// lane rope (floating red/white/blue floats)
export function laneRope(p, x, y, z, L) { const g = new THREE.Group(); p.add(g); g.position.set(x, y, z); const n = Math.floor(L / 0.5); const cols = ['#e8283a', '#ffffff', '#2a62d8'];
  const geo = new THREE.CylinderGeometry(0.18, 0.18, 0.42, 12); geo.rotateX(Math.PI / 2); for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, mat(cols[Math.floor(i / 3) % 3])); m.position.z = -L / 2 + (i + 0.5) * (L / n); g.add(m); } return g; }
// bunting flags across a span
export function bunting(p, a, b, n = 14, sag = 1.2) { const g = new THREE.Group(); p.add(g); const cols = ['#e8283a', '#f4c03a', '#3ab04a', '#2a8ad8', '#b84ae8', '#ff8a3a'];
  const tri = new THREE.BufferGeometry().setFromPoints([V(-0.4, 0, 0), V(0.4, 0, 0), V(0, -0.9, 0)]); tri.computeVertexNormals();
  for (let i = 0; i < n; i++) { const k = (i + 0.5) / n; const pos = a.clone().lerp(b, k); pos.y -= sag * 4 * k * (1 - k); const f = new THREE.Mesh(tri, new THREE.MeshStandardMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide, roughness: 0.8 })); f.position.copy(pos); f.lookAt(pos.clone().add(V(0, 0, 1))); f.rotation.y = Math.atan2(b.x - a.x, b.z - a.z) - Math.PI / 2; g.add(f); }
  const cord = new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => { const k = i / 8; const p2 = a.clone().lerp(b, k); p2.y -= sag * 4 * k * (1 - k); return p2; }));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(cord, 30, 0.03, 5), mat('#f4f4f0'))); return g; }
