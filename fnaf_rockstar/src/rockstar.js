// Rockstar Freddy (FNAF 6 / UCN): every painted bit that sticks out becomes 3D and is erased from the skin:
// top hat, ears, muzzle (same pixels as the skin), purple bowtie, the raised coin box on the chest (same pixels) with a
// 3D gold star and a real coin slot. Microphone held in his right hand, always ball-up.
import * as THREE from 'three';
import { Character, U, imgCopy, voxelArt, vbox, avgColor, recolorWhere, eraseRect } from './skin.js';
import { region, solidify, slab } from './sb.js';

export function star(r, depth, col, em = '#000', ei = 0) { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? r * 0.45 : r; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.3, bevelSize: r * 0.08, bevelSegments: 1 }), new THREE.MeshStandardMaterial({ color: col, metalness: 0.8, roughness: 0.3, emissive: em, emissiveIntensity: ei })); m.castShadow = true; return m; }

// Faz-Coin: gold disc with a raised "F" on both faces
export function fazCoin() { const g = new THREE.Group(); const gold = new THREE.MeshStandardMaterial({ color: '#e8b830', metalness: 0.9, roughness: 0.25, emissive: '#5a3a00', emissiveIntensity: 0.3 });
  const d = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 28), gold); d.rotation.x = Math.PI / 2; d.castShadow = true; g.add(d);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.008, 6, 28), gold); g.add(rim);
  const F = voxelArt(['FFFF', 'F...', 'FFF.', 'F...', 'F...'], { F: '#f8d860' }, 0.025, 0.012); for (const z of [0.012, -0.012]) { const f = F.clone(); f.position.z = z; if (z < 0) f.rotation.y = Math.PI; g.add(f); }
  return g; }

export function buildRockstar(canvas) {
  const A = imgCopy(canvas); const fur = avgColor(A, 12, 9, 4, 1); const isPur = (r, g, b) => b > g + 20 && r > g;
  recolorWhere(A, 8, 0, 8, 8, isPur, fur); for (const x of [0, 16, 24]) recolorWhere(A, x, 8, 8, 6, isPur, fur);   // painted purple ears on the head
  recolorWhere(A, 8, 0, 8, 8, (r, g, b) => r < 60 && g < 60, fur);
  eraseRect(A, 32, 0, 32, 8); eraseRect(A, 32, 8, 8, 8); eraseRect(A, 48, 8, 16, 8); eraseRect(A, 40, 8, 8, 2.5);   // hat layer: only the muzzle overlay stays
  const muz = solidify(region(A, 9.5, 12, 5, 2, 41.5, 12));                     // muzzle (nose + snout) -> 3D, same pixels
  const bow = solidify(region(A, 21.5, 36, 5, 2.5)); eraseRect(A, 20, 36, 8, 2.5); // purple bowtie -> 3D
  const box = solidify(region(A, 21, 22.5, 6, 6.5, 21, 38.5));                   // coin box panel (base + overlay) -> raised 3D plate
  eraseRect(A, 21, 38.5, 6, 6.5);
  { const g = box.getContext('2d'); const d = g.getImageData(0, 0, box.width, box.height); for (let i = 0; i < d.data.length; i += 4) { const r = d.data[i], gg = d.data[i + 1], b = d.data[i + 2]; if (r > 190 && gg > 150 && b < 90) d.data.set([0xa8, 0x6d, 0x3c, 255], i); } g.putImageData(d, 0, 0); } // painted star removed (the 3D star replaces it)
  const ch = new Character('rockstar', A); const H = ch.head; const s = A.width / 64;
  const m = slab(muz, s, 1.3, 0.55); m.position.set(0, (16 - 13) * U, (4 + 0.65) * U); H.add(m); ch.muzzle = m;
  const hat = new THREE.Group(); vbox(4.8, 0.45, 4.8, '#0c0c10', 0, 0.22, 0, hat, 0.35); vbox(3.3, 2.6, 3.3, '#101014', 0, 1.75, 0, hat, 0.35); vbox(3.4, 0.5, 3.4, '#8a8e98', 0, 3.2, 0, hat, 0.25);
  hat.position.set(0.3 * U, 8 * U, 0.3 * U); hat.rotation.z = -0.08; H.add(hat);
  const P = { o: fur, d: '#4a1a06', t: '#3a8a90' }; const ear = () => voxelArt(['.oooo.', 'oottoo', 'ottto'.padEnd(6, 'o'), 'otttto', 'oottoo', '.oooo.'], P, 0.6 * U, 1.2 * U);
  for (const sx of [-1, 1]) { const e = ear(); e.position.set(sx * 3.7 * U, (8 + 1.5) * U, -0.6 * U); e.rotation.z = -sx * 0.28; H.add(e); }
  const b = slab(bow, s, 1.0, 0.4); b.position.set(0, (32 - 37.25 + 16) * U, (2 + 0.6) * U); ch.torso.add(b);
  // coin box: raised plate (skin pixels) + gold star + coin slot
  const cb = new THREE.Group(); cb.position.set(0, (32 - 25.75) * U, 2 * U); ch.torso.add(cb); ch.coinBox = cb;
  const pl = slab(box, s, 0.7, 0.45); pl.position.z = 0.35 * U; cb.add(pl);
  const st = star(1.75 * U, 0.35 * U, '#f8d040', '#6a4a00', 0.35); st.position.set(0, 1.35 * U, 0.72 * U); cb.add(st); ch.star = st;
  vbox(1.3, 2.0, 0.3, '#5a5e68', 0, -1.75, 0.8, cb, 0.25); const slot = vbox(0.55, 1.5, 0.3, '#020203', 0, -1.75, 0.86, cb, 0.9); ch.slot = slot;
  ch.slotPt = () => { ch.root.updateMatrixWorld(true); return cb.localToWorld(new THREE.Vector3(0, -1.75 * U, 1.0 * U)); };
  // microphone (handle + mesh ball) in the right hand; kept vertical (ball up) each frame by ch.micUp()
  const mic = new THREE.Group(); ch.handR.add(mic); ch.mic = mic; const mh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.26, 10), new THREE.MeshStandardMaterial({ color: '#1a1a20', roughness: 0.4 })); mh.position.y = 0.06; mic.add(mh);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), new THREE.MeshStandardMaterial({ color: '#c8ccd4', metalness: 0.8, roughness: 0.35 })); ball.position.y = 0.21; mic.add(ball);
  ch.micUp = () => { ch.root.updateMatrixWorld(true); const q = new THREE.Quaternion(); ch.handR.getWorldQuaternion(q); mic.quaternion.copy(q.invert()); mic.scale.setScalar(1 / ch.root.scale.x); };
  // angry red eyes (UCN): emissive plates over the painted eyes, faded in by k
  const em = new THREE.MeshBasicMaterial({ color: '#ff1a1a', toneMapped: false, transparent: true, opacity: 0 }); for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(1.7 * U, 1.0 * U, 0.08 * U), em); e.position.set(sx * 2.0 * U, 5.0 * U, 4.06 * U); H.add(e); }
  ch.eyeRed = k => { em.opacity = Math.max(0, Math.min(1, k)); };
  ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); ch.baseScale = 1.35; return ch; }
