// Episode cast — "O RELÓGIO DA MINHA MÃE" (cidade onde tudo se paga com tempo de vida)
import * as THREE from 'three';
import { dressed, hero } from './chars.js';
import { plastic } from './rbx.js';
import { addWatch } from './watch.js';
const M = (geo, mat, p, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; p.add(m); return m; };
export function buildCast() {
  const C = {};
  C.heroi = hero(); addWatch(C.heroi, { band: '#1a1a20' });
  // mother: long brown hair (own colour -> can turn white), long sleeves ALWAYS (hides the watch), skirt-length jeans
  C.mae = dressed({ name: 'mae', skin: '#f3d0b0', shirt: { type: 'blouse', color: '#5a8ad8', sleeve: 1 }, pants: { type: 'jeans', color: '#3a3a5a' }, shoes: { color: '#8a3a2a' }, hair: { style: 'long', color: '#5b3521' }, face: { lashes: true, blush: 0.3 } });
  addWatch(C.mae, { band: '#3a2a3a' }); C.mae.hairMats = []; C.mae.head.traverse(o => { if (o.isMesh && o.material.map && o.material.side === THREE.DoubleSide && !C.mae.hairMats.includes(o.material)) C.mae.hairMats.push(o.material); });
  C.mae.hairMats = C.mae.hairMats.map(m => { const c = m.clone(); return [m, c]; }); C.mae.head.traverse(o => { if (o.isMesh) for (const [a, b] of C.mae.hairMats) if (o.material === a) o.material = b; }); C.mae.hairMats = C.mae.hairMats.map(p => p[1]); C.mae.hairBase = C.mae.hairMats.map(m => m.color.clone());
  C.mae.setGray = k => C.mae.hairMats.forEach((m, i) => m.color.copy(C.mae.hairBase[i]).lerp(new THREE.Color('#e8e8ec'), k));
  C.avo = dressed({ name: 'avo', skin: '#f0c8a0', shirt: { type: 'jacket', color: '#8a5a3a', inner: '#e8e0c8' }, pants: { type: 'pants', color: '#5a4a3a' }, shoes: { color: '#3a2a1a' }, hair: { style: 'quiff', color: '#d8d8dc' }, face: { mustache: '#d8d8dc', wrinkles: true },
    extra: head => { const fm = plastic('#202020'); for (const s of [-1, 1]) M(new THREE.TorusGeometry(0.13, 0.025, 8, 20), fm, head, s * 0.17, 0.73, 0.64); M(new THREE.BoxGeometry(0.1, 0.025, 0.025), fm, head, 0, 0.75, 0.645); } }); addWatch(C.avo);
  C.rico = dressed({ name: 'rico', skin: '#f6dcc0', shirt: { type: 'suit', color: '#f2f2f2', inner: '#e8c040', tie: '#d4a020' }, pants: { type: 'pants', color: '#f2f2f2' }, shoes: { color: '#d4a020', sole: '#ffffff' }, hair: { style: 'swoop', color: '#f0d070' }, face: { mouth: 'smirk' } });
  addWatch(C.rico, { band: '#d4a020', frame: '#f0c040' });
  C.vizinha = dressed({ name: 'vizinha', skin: '#c88a5a', shirt: { type: 'tee', color: '#e8743a' }, pants: { type: 'jeans', color: '#2a4a8a' }, shoes: { color: '#f2f2f2', stripe: '#e8743a' }, hair: { style: 'bun', color: '#2a1a12' }, face: { lashes: true } }); addWatch(C.vizinha);
  C.padeiro = dressed({ name: 'padeiro', skin: '#e8b890', shirt: { type: 'tee', color: '#f4f4f4' }, pants: { type: 'pants', color: '#3a3a44' }, shoes: { color: '#202020' }, hair: { style: 'bald', color: '#000' }, face: { mustache: '#3a2414' },
    extra: head => { const w = plastic('#ffffff', { rough: 0.8 }); M(new THREE.CylinderGeometry(0.66, 0.6, 0.32, 32), w, head, 0, 1.22, 0); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; M(new THREE.SphereGeometry(0.34, 16, 12), w, head, Math.sin(a) * 0.32, 1.55, Math.cos(a) * 0.32); } M(new THREE.SphereGeometry(0.4, 16, 12), w, head, 0, 1.7, 0); } });
  addWatch(C.padeiro); { const ap = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.4, 0.06), plastic('#f8f8f8')); ap.position.set(0, 0.0, 0.53); C.padeiro.torso.add(ap); }
  C.medico = dressed({ name: 'medico', skin: '#d8a070', shirt: { type: 'suit', color: '#f6f6f6', inner: '#5ab0d8', tie: '#5ab0d8' }, pants: { type: 'pants', color: '#5ab0d8' }, shoes: { color: '#f2f2f2' }, hair: { style: 'short' in {} ? 'quiff' : 'quiff', color: '#2a1a10' }, face: { mouth: 'flat' } }); addWatch(C.medico);
  C.medica = dressed({ name: 'medica', skin: '#f3d0b0', shirt: { type: 'suit', color: '#f6f6f6', inner: '#5ab0d8', tie: '#5ab0d8' }, pants: { type: 'pants', color: '#5ab0d8' }, shoes: { color: '#f2f2f2' }, hair: { style: 'ponytail' in {} ? 'bun' : 'bun', color: '#e8c070' }, face: { lashes: true, mouth: 'flat' } }); addWatch(C.medica);
  C.crianca = dressed({ name: 'crianca', skin: '#f3c99a', shirt: { type: 'stripes', color: '#2a62d8', color2: '#f4f4f4', n: 8 }, pants: { type: 'shorts', color: '#2a4ab8' }, shoes: { color: '#2a62d8', sole: '#f4f4f4' }, hair: { style: 'spiky', color: '#2a1a10' } }); addWatch(C.crianca);
  return C; }
