import * as THREE from 'three';
import { loadBodies, realChar } from './realbody.js';
import { HAIR5 } from './hair4.js';
import { topHat } from './rbx.js';
import { alive } from './act.js';
import { loadFonts, room, interiorLight } from './kit.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.shadowMap.enabled = true; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
await loadFonts(); await loadBodies();
const s = new THREE.Scene(); s.background = new THREE.Color('#9aa8b8'); s.add(new THREE.HemisphereLight('#ffffff', '#8a8070', 1.4)); const k = new THREE.DirectionalLight('#fff4e8', 2.4); k.position.set(4, 10, 8); k.castShadow = true; s.add(k); const r = new THREE.DirectionalLight('#dfe8ff', 1.0); r.position.set(-6, 6, -6); s.add(r);
const h5 = (st, col, c2, o) => head => { const g = new THREE.Group(); head.add(g); HAIR5[st](g, col, c2, o || {}); };
const L = [
  ['heroi', realChar({ name: 'heroi', body: 'masc', skin: '#f2f2f2', top: { type: 'plain', color: '#d4141a', sleeves: 'none' }, bottom: { type: 'pants', color: '#141416', belt: '#141416', buckle: false }, shoesO: { color: '#141416', sole: '#e8e8e8' }, hat: topHat() })],
  ['pal', realChar({ name: 'a', body: 'masc', skin: '#f0c8a0', top: { type: 'tee', color: '#2a62d8' }, bottom: { type: 'jeans', color: '#2a3a6a' }, hat: h5('pal', '#c88a2a') })],
  ['messy5', realChar({ name: 'b', body: 'masc', skin: '#f3d6c0', top: { type: 'hoodie', color: '#1a1a1e' }, bottom: { type: 'jeans', color: '#1a1a20' }, hat: h5('messy5', '#18181c') })],
  ['spiky5', realChar({ name: 'c', body: 'masc', skin: '#c88a5a', top: { type: 'tee', color: '#e83a3a' }, bottom: { type: 'pants', color: '#2a2a2a' }, hat: h5('spiky5', '#2a2018') })],
  ['bacon5', realChar({ name: 'd', body: 'masc', skin: '#e8d2c0', top: { type: 'jacket', color: '#1c1c22', inner: '#3a9ee0' }, bottom: { type: 'jeans', color: '#25333a' }, hat: h5('bacon5', '#b8501a') })],
  ['quiff5', realChar({ name: 'e', body: 'masc', skin: '#c88a5a', top: { type: 'hoodie', color: '#1a1a1e', color2: '#f2f2f2', fade: true }, bottom: { type: 'pants', color: '#1a1a1a' }, hat: h5('quiff5', '#3a2418') })],
  ['longStraight', realChar({ name: 'f', body: 'fem', skin: '#f6e0d0', top: { type: 'tee', color: '#f2f2f2' }, bottom: { type: 'jeans', color: '#2a3a6a' }, hat: h5('longStraight', '#141418'), face: { lashes: true } })],
  ['longWavy', realChar({ name: 'g', body: 'fem', skin: '#f6dcc4', top: { type: 'sweater', color: '#f07aa8' }, bottom: { type: 'pants', color: '#f2efe8' }, hat: h5('longWavy', '#f0d0b0'), face: { anime: true, eyeColor: '#3aa8e8', lashes: true } })],
  ['twoTone', realChar({ name: 'h', body: 'fem', skin: '#e8b890', top: { type: 'tee', color: '#8a3ad8' }, bottom: { type: 'jeans', color: '#2a3a6a' }, hat: h5('twoTone', '#6a4a34', '#f0d8b0'), face: { lashes: true } })],
  ['acorn', realChar({ name: 'i', body: 'fem', skin: '#f6f0ea', top: { type: 'jacket', color: '#2a5a8a', inner: '#f4e040' }, bottom: { type: 'jeans', color: '#6a2a3a' }, hat: h5('acorn', '#d8501a') })],
  ['spaceBuns', realChar({ name: 'j', body: 'fem', skin: '#d8a070', top: { type: 'tee', color: '#f6f2ee' }, bottom: { type: 'shorts', color: '#f2ece6' }, hat: h5('spaceBuns', '#e8c890'), face: { lashes: true } })],
];
window.APP = { ready: true, duration: 40, renderAt(t) { const i = Math.floor(t / 3), v = Math.round(t % 3); for (const [, c] of L) c.root.removeFromParent(); const c = L[i][1]; c.reset(); s.add(c.root); c.root.rotation.y = [0, 1.0, Math.PI][v]; alive(c, 1, 1, 2); c.applyFace();
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 100); cam.position.set(0, 4.2, 11.5); cam.lookAt(0, 3.4, 0); renderer.render(s, cam); } };
