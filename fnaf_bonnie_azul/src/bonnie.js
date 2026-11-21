// "O Bonnie é azul": blue skins (hue shift of purple pixels), a smooth "purple light" tint that never swaps textures,
// the faceless Withered Bonnie (FNAF 2) and the FNAF 1 "CELEBRATE!" poster drawn as pixel art.
import * as THREE from 'three';
import { Character, U, imgCopy, voxelArt, pixelTexture } from './skin.js';

// purple-ish pixels -> Bonnie blue (keeps value/shading, no texture swap at runtime)
export function toBlue(canvas, hueTo = 226, satMul = 1.15) {
  const A = imgCopy(canvas); const g = A.getContext('2d'); const d = g.getImageData(0, 0, A.width, A.height);
  for (let i = 0; i < d.data.length; i += 4) { if (d.data[i + 3] < 10) continue; const r = d.data[i] / 255, gg = d.data[i + 1] / 255, b = d.data[i + 2] / 255;
    const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), dl = mx - mn; if (dl < 0.06) continue; let h;
    if (mx === r) h = 60 * (((gg - b) / dl) % 6); else if (mx === gg) h = 60 * ((b - r) / dl + 2); else h = 60 * ((r - gg) / dl + 4); if (h < 0) h += 360;
    if (h < 235 || h > 320) continue; const sat = Math.min(1, (dl / mx) * satMul), v = mx; const c = v * sat, hh = hueTo / 60, x = c * (1 - Math.abs(hh % 2 - 1)), m = v - c;
    let rr, g2, bb; if (hh < 1) [rr, g2, bb] = [c, x, 0]; else if (hh < 2) [rr, g2, bb] = [x, c, 0]; else if (hh < 3) [rr, g2, bb] = [0, c, x]; else if (hh < 4) [rr, g2, bb] = [0, x, c]; else if (hh < 5) [rr, g2, bb] = [x, 0, c]; else [rr, g2, bb] = [c, 0, x];
    d.data[i] = Math.round((rr + m) * 255); d.data[i + 1] = Math.round((g2 + m) * 255); d.data[i + 2] = Math.round((bb + m) * 255); }
  g.putImageData(d, 0, 0); return A; }

// "purple lighting" look: multiplies every material colour of the character smoothly (k 0 = true blue, 1 = purple)
export function purpleTint(ch, k) {
  if (!ch._tintMats) { ch._tintMats = []; ch.root.traverse(o => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.color && !m.isMeshBasicMaterial) ch._tintMats.push([m, m.color.clone()]); }); }); }
  const kr = 1 + 0.6 * k, kg = 1 - 0.3 * k, kb = 1 - 0.06 * k; ch._tintMats.forEach(([m, c]) => m.color.setRGB(c.r * kr, c.g * kg, c.b * kb));
}

const bx = (w, h, d, c, x, y, z, p, o = {}) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w * U, h * U, d * U), new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? 0.75, metalness: o.metal ?? 0, emissive: o.em || '#000', emissiveIntensity: o.ei || 0 })); m.position.set(x * U, y * U, z * U); m.castShadow = m.receiveShadow = true; p.add(m); return m; };

// Withered Bonnie: NO face. Thin back shell of the head + top, exposed dark endo plate with two red pinpoint eyes,
// lower jaw sticking forward in 3D (teeth on top), upper teeth on a metal bar, hanging wires, worn ears.
export function buildWitheredBonnie(canvas) {
  const A = toBlue(canvas); const ch = new Character('wbonnie', A); ch.headMesh.visible = false; ch.hat.visible = false;
  const fur = '#3b4ea6', furD = '#2a3880', furL = '#5468c0', metal = '#2a2a30', tooth = '#efe8d6'; const H = ch.head;
  bx(8, 6.6, 2.6, fur, 0, 4.7, -2.7, H); bx(8.2, 6.8, 0.4, furD, 0, 4.7, -1.35, H);                 // back shell (thin)
  bx(8, 1.4, 5.0, fur, 0, 7.3, -1.5, H); bx(1.2, 4.0, 3.0, fur, -3.4, 5.2, -0.4, H); bx(1.2, 4.0, 3.0, fur, 3.4, 5.2, -0.4, H); // top + cheek rims
  const plate = bx(5.4, 4.2, 0.6, metal, 0, 4.9, -1.0, H, { metal: 0.6, rough: 0.45 });
  for (const sx of [-1, 1]) { bx(1.3, 1.3, 0.4, '#141418', sx * 1.35, 5.4, -0.55, H, { metal: 0.5 }); bx(0.45, 0.45, 0.3, '#ff2020', sx * 1.35, 5.4, -0.32, H, { em: '#ff1a1a', ei: 2.6 }); }
  bx(0.7, 3.6, 0.7, '#3a3a42', 0, 4.4, -0.6, H, { metal: 0.7 });                                   // endo spine of the face
  // upper teeth on a metal bar
  bx(6.0, 0.5, 5.8, '#34343c', 0, 3.1, 1.9, H, { metal: 0.6 }); for (let i = 0; i < 7; i++) bx(0.7, 0.9, 0.5, tooth, -2.7 + i * 0.9, 2.5, 4.55, H, { rough: 0.4 });
  // lower jaw (opens), sticks forward, fur outside, teeth on top
  const jaw = new THREE.Group(); jaw.position.set(0, 2.2 * U, -1.2 * U); H.add(jaw); ch.jaw = jaw;
  bx(6.2, 2.0, 6.4, fur, 0, -0.8, 3.2, jaw); bx(5.0, 0.9, 5.0, furL, 0, -1.9, 3.5, jaw); bx(5.4, 0.3, 5.4, '#3a0e14', 0, 0.25, 3.3, jaw);
  for (let i = 0; i < 7; i++) bx(0.7, 0.9, 0.5, tooth, -2.7 + i * 0.9, 0.55, 6.25, jaw, { rough: 0.4 });
  // hanging wires
  [[-1.6, '#7a1e1e'], [-0.9, '#1a1a1a'], [1.2, '#2a3a6a'], [1.9, '#8a8a30']].forEach(([x, c], i) => bx(0.25, 1.6 + (i % 2) * 0.8, 0.25, c, x, 2.0 - (i % 2) * 0.4, 0.4 + i * 0.4, H));
  // worn ears, right ear bent
  const P = { b: fur, l: furL, d: furD, w: '#c8d0f0' };
  const ear = () => voxelArt(['.dbbd.', 'dbllbd', 'dblwbd', 'dblwbd', 'dblwbd', 'dblwbd', 'dblwbd', 'dblwbd', 'dbllbd', 'dbbbbd', '.dbbd.'], P, 0.5 * U, 1.4 * U);
  for (const sx of [-1, 1]) { const p = new THREE.Group(); p.position.set(sx * 2.2 * U, 8.0 * U, -1.4 * U); const e = ear(); e.position.y = 2.75 * U; p.add(e); p.rotation.z = -sx * 0.14; if (sx < 0) p.rotation.x = -0.35; H.add(p); }
  ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const r0 = ch.reset.bind(ch); ch.reset = () => { r0(); jaw.rotation.x = 0.12; }; ch.reset();
  return ch;
}

// red flying-V guitar held across the body (Bonnie)
export function guitar(ch) { // flying-V held across the belly: body on his right hip, neck rising to his left hand, flush on the suit
  const g = new THREE.Group(); g.position.set(-1.4 * U, 4.6 * U, 2.55 * U); g.rotation.z = 0.42; ch.torso.add(g); ch.guitar = g;
  const red = '#c2202a', wh = '#f2f2f2';
  bx(3.2, 2.4, 0.9, red, -1.0, 0, 0, g); bx(2.2, 0.8, 0.9, red, -2.8, 1.0, 0, g); bx(2.2, 0.8, 0.9, red, -2.8, -1.0, 0, g); bx(0.9, 1.8, 0.95, wh, -0.9, 0, 0.05, g);
  bx(5.2, 0.6, 0.7, '#3a2414', 3.0, 0, 0, g); bx(1.2, 0.9, 0.7, red, 6.1, 0, 0, g);
  return g; }

// FNAF 1 "CELEBRATE!" poster: the user's high-quality image in a real 3D frame. A second layer (same image with the
// purple pixels shifted to Bonnie blue) fades in under white light -> smooth, no swap.
export function buildPoster(img) {
  const src = document.createElement('canvas'); src.width = img.width; src.height = img.height; src.getContext('2d').drawImage(img, 0, 0);
  const mk = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const w = 0.96, h = w * img.height / img.width; const grp = new THREE.Group();
  const base = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: mk(src), roughness: 0.8 })); grp.add(base);
  const blueM = new THREE.MeshStandardMaterial({ map: mk(toBlue(src, 222, 1.25)), roughness: 0.8, transparent: true, opacity: 0, depthWrite: false });
  const blue = new THREE.Mesh(new THREE.PlaneGeometry(w, h), blueM); blue.position.z = 0.002; grp.add(blue); grp.userData.blue = blueM;
  const back = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, h + 0.02, 0.02), new THREE.MeshStandardMaterial({ color: '#111' })); back.position.z = -0.012; grp.add(back);
  const fm = new THREE.MeshStandardMaterial({ color: '#1a1a1e', roughness: 0.6 }); for (const [ww, hh, x, y] of [[w + 0.08, 0.04, 0, h / 2 + 0.02], [w + 0.08, 0.04, 0, -h / 2 - 0.02], [0.04, h + 0.08, w / 2 + 0.02, 0], [0.04, h + 0.08, -w / 2 - 0.02, 0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(ww, hh, 0.04), fm); m.position.set(x, y, 0.01); grp.add(m); }
  grp.userData.setBlue = k => { blueM.opacity = Math.max(0, Math.min(1, k)); };
  grp.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return grp;
}
