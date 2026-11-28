// The life-time wrist watch (left wrist of every character) + its holographic readout and the flowing "time" numbers.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const rb = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 3, r);
function screenCanvas() { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { c, g: c.getContext('2d'), t }; }
export function drawReadout(g, W, H, txt, col = '#5af0ff', sub = '') { g.clearRect(0, 0, W, H); g.fillStyle = '#071018'; g.beginPath(); g.roundRect(4, 4, W - 8, H - 8, H * 0.18); g.fill();
  g.strokeStyle = col; g.globalAlpha = 0.6; g.lineWidth = 4; g.stroke(); g.globalAlpha = 1; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 14; g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = H * (sub ? 0.46 : 0.6); g.font = `${fs}px Komikax`; while (g.measureText(txt).width > W * 0.86 && fs > 10) { fs -= 2; g.font = `${fs}px Komikax`; } g.fillText(txt, W / 2, sub ? H * 0.42 : H * 0.53);
  if (sub) { g.font = `${H * 0.2}px Komikax`; g.fillText(sub, W / 2, H * 0.78); } g.shadowBlur = 0; }
export function addWatch(ch, o = {}) { const g = new THREE.Group(); g.position.set(0, -1.42, 0); ch.armL.piv.add(g); ch.watch = g;
  const band = new THREE.Mesh(rb(1.08, 0.26, 1.08, 0.08), new THREE.MeshStandardMaterial({ color: o.band || '#26262c', roughness: 0.4, metalness: 0.3 })); band.castShadow = true; g.add(band);
  const face = new THREE.Mesh(rb(0.78, 0.4, 0.14, 0.05), new THREE.MeshStandardMaterial({ color: o.frame || '#3a3a44', metalness: 0.6, roughness: 0.3 })); face.position.z = 0.56; g.add(face);
  const S = screenCanvas(); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.31), new THREE.MeshBasicMaterial({ map: S.t, toneMapped: false })); scr.position.z = 0.635; g.add(scr);
  ch.setWatch = (txt, col = '#5af0ff', sub = '') => { const k = txt + col + sub; if (ch._wk === k) return; ch._wk = k; drawReadout(S.g, 256, 128, txt, col, sub); S.t.needsUpdate = true; };
  ch.setWatch(o.txt || '1 DIA'); ch.wristPt = () => { ch.root.updateMatrixWorld(true); return scr.getWorldPosition(new THREE.Vector3()); }; return g; }
// big holographic panel above a wrist / anywhere (camera-facing), e.g. "1 DIA", "-10 MIN"
export function makeHolo() { const S = screenCanvas(); S.c.width = 512; S.c.height = 220; const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.69), new THREE.MeshBasicMaterial({ map: S.t, transparent: true, toneMapped: false, depthTest: false, depthWrite: true }));
  m.set = (txt, col = '#5af0ff', sub = '') => { const k = txt + col + sub; if (m._k === k) return; m._k = k; drawReadout(S.g, 512, 220, txt, col, sub); S.t.needsUpdate = true; }; m.renderOrder = 50; return m; }
// flowing time: glowing digits travelling on an arc from A to B (k = 0..1 progress of the stream, t = time)
export function makeStream(n = 26) { const g = new THREE.Group(); const glyph = ch => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.font = '52px Komikax'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ffffff'; x.shadowColor = '#5af0ff'; x.shadowBlur = 12; x.fillText(ch, 32, 34); const t = new THREE.CanvasTexture(c); return t; };
  const chars = '0123456789'; for (let i = 0; i < n; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glyph(chars[i % 10]), color: '#9af6ff', transparent: true, depthWrite: false, toneMapped: false })); sp.userData.ph = (i * 0.618) % 1; sp.userData.w = [Math.sin(i * 7.1), Math.cos(i * 3.3), Math.sin(i * 1.7)]; g.add(sp); }
  g.update = (A, B, t, alpha = 1, col = '#9af6ff', size = 0.22, rate = 0.9) => { const mid = A.clone().lerp(B, 0.5); mid.y += A.distanceTo(B) * 0.35; g.children.forEach(s => { const u = (s.userData.ph + t * rate) % 1; const w = s.userData.w;
    const p = A.clone().multiplyScalar((1 - u) * (1 - u)).add(mid.clone().multiplyScalar(2 * u * (1 - u))).add(B.clone().multiplyScalar(u * u)); const sp = 0.12 * Math.sin(u * Math.PI);
    s.position.set(p.x + w[0] * sp, p.y + w[1] * sp, p.z + w[2] * sp); s.scale.setScalar(size * (0.5 + 0.8 * Math.sin(u * Math.PI))); s.material.opacity = alpha * Math.min(1, Math.sin(u * Math.PI) * 2); s.material.color.set(col); }); }; return g; }
