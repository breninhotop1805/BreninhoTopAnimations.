import * as THREE from 'three';
import { loadBodies, realChar } from './realbody.js';
import { HAIR6 } from './hair6.js';
import { HAIR4 } from './hair4.js';
import { alive } from './act.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.shadowMap.enabled = true; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
await loadBodies();
const s = new THREE.Scene(); s.background = new THREE.Color('#aab6c4'); s.add(new THREE.HemisphereLight('#ffffff', '#8a8070', 1.3)); const k = new THREE.DirectionalLight('#fff4e8', 2.4); k.position.set(4, 10, 8); k.castShadow = true; s.add(k); const r = new THREE.DirectionalLight('#dfe8ff', 1.0); r.position.set(-6, 6, -6); s.add(r);
const h6 = (st, col, o) => head => { const g = new THREE.Group(); head.add(g); HAIR6[st](g, col, null, o || {}); };
const L = [realChar({ name: 'a', body: 'masc', skin: '#f0c8a0', top: { type: 'tee', color: '#2a62d8' }, bottom: { type: 'jeans', color: '#2a3a6a' }, hat: h6('boy', '#5a3420') }),
  realChar({ name: 'b', body: 'fem', skin: '#f6e0d0', top: { type: 'sweater', color: '#f07aa8' }, bottom: { type: 'jeans', color: '#2a3a6a' }, hat: head => { const g = new THREE.Group(); head.add(g); HAIR4.long(g, '#4a1c12', null, {}); }, face: { lashes: true } }),
  realChar({ name: 'c', body: 'fem', skin: '#f6dcc4', top: { type: 'tee', color: '#3ab0a0' }, bottom: { type: 'pants', color: '#f2efe8' }, hat: head => { const g = new THREE.Group(); head.add(g); HAIR4.ponytail(g, '#f0c860', null, { tieCol: '#ff4a8a' }); }, face: { anime: true, eyeColor: '#3aa8e8', lashes: true } })];
window.APP = { ready: true, duration: 20, renderAt(t) { const i = Math.floor(t / 3), v = Math.round(t % 3); for (const c of L) c.root.removeFromParent(); const c = L[i]; c.reset(); s.add(c.root); c.root.rotation.y = [0, 1.25, Math.PI][v]; alive(c, 1, 1, 2); c.applyFace();
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 100); cam.position.set(0, 4.3, 10.5); cam.lookAt(0, 3.4, 0); renderer.render(s, cam); } };
