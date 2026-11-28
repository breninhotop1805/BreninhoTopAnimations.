import * as THREE from 'three';
import { loadBodies, realChar } from './realbody.js';
import { HAIR6 } from './hair6.js';
import { HAIR4 } from './hair4.js';
import { alive } from './act.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.shadowMap.enabled = true; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
await loadBodies();
const s = new THREE.Scene(); s.background = new THREE.Color('#e9edf2'); s.add(new THREE.HemisphereLight('#ffffff', '#9a9088', 1.3)); const k = new THREE.DirectionalLight('#fff4e8', 2.3); k.position.set(4, 10, 8); s.add(k); const r = new THREE.DirectionalLight('#dfe8ff', 1.0); r.position.set(-6, 6, -6); s.add(r);
const H6 = (st, col) => head => { const g = new THREE.Group(); head.add(g); HAIR6[st](g, col, null, {}); };
const H4 = (st, col, o) => head => { const g = new THREE.Group(); head.add(g); HAIR4[st](g, col, null, o || {}); };
const M = (skin, top, hat, face) => realChar({ name: 'x', body: 'masc', skin, top, bottom: { type: 'jeans', color: '#2a3a6a' }, hat, face });
const F = (skin, top, hat, face) => realChar({ name: 'y', body: 'fem', skin, top, bottom: { type: 'jeans', color: '#2a3a6a' }, hat, face: Object.assign({ lashes: true }, face || {}) });
window.L = [
  M('#f0c8a0', { type: 'tee', color: '#2a62d8' }, H6('boy', '#5a3420')), M('#c88a5a', { type: 'hoodie', color: '#1a1a1e' }, H6('quiff', '#1c1612')), M('#f6e0d0', { type: 'stripes', color: '#e83a3a', color2: '#ffffff' }, H6('curtains', '#e8c070')),
  M('#8a5a3a', { type: 'jersey', color: '#1f8a4a', color2: '#ffffff', number: 10 }, H6('buzz', '#1a1410')), M('#f3d6c0', { type: 'plaid', color: '#3a6ac8', color2: '#f2e8d8' }, H6('messy', '#c0501a')), M('#e8b890', { type: 'tee', color: '#f4c03a' }, H6('spiky', '#20242e')),
  M('#d8a070', { type: 'polo', color: '#2ab0a0' }, H6('surfer', '#8a6a44')), M('#6a4028', { type: 'tee', color: '#e8743a' }, H6('curly', '#15110e')),
  F('#f6dcc4', { type: 'sweater', color: '#f07aa8' }, H4('ponytail', '#f0c860', { tieCol: '#ff4a8a' }), { anime: true, eyeColor: '#3aa8e8' }), F('#f3d6c0', { type: 'tee', color: '#8a3ad8' }, H4('long', '#4a1c12', { buns: true, tieCol: '#e84a8a' })),
  F('#c88a5a', { type: 'tee', color: '#2ab0a0' }, H4('pigtails', '#2a1a10', { tieCol: '#ffd040' })), F('#f6e0d0', { type: 'blouse', color: '#f6f2ee' }, H4('bob', '#151515')), F('#e8b890', { type: 'dress', color: '#5a9a4a' }, H4('bun', '#7a4a2a')),
];
window.APP = { ready: true, duration: 40, renderAt(t) { const i = Math.floor(t / 2), v = Math.round(t % 2); for (const c of window.L) c.root.removeFromParent(); const c = window.L[i]; c.reset(); s.add(c.root); c.root.rotation.y = v ? 0.9 : 0.12; alive(c, 1, 1, 2); c.applyFace();
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 100); if (q.get('full')) { cam.position.set(0, 3.0, 15.5); cam.lookAt(0, 2.75, 0); } else { cam.position.set(0, 4.5, 8.6); cam.lookAt(0, 3.85, 0); } renderer.render(s, cam); } };
