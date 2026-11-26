import * as THREE from 'three';
import { loadBodies, realChar } from './realbody.js';
import { HAIR2, HAIR3 } from './chars.js';
import { HAIR4 } from './hair4.js';
import { topHat } from './rbx.js';
import { buildStreet } from './sets.js';
import { gesture, walkPath, sit15, alive, reach } from './act.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
const S = {}; const scene = buildStreet(S); const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
await loadBodies();
const hair = (style, col, c2) => head => { const g = new THREE.Group(); head.add(g); (HAIR3[style] || HAIR2[style])(g, col, c2); };
const h4 = (style, col, c2, o) => head => { const g = new THREE.Group(); head.add(g); HAIR4[style](g, col, c2, o || {}); };
const list = [
  realChar({ name: 'heroi', body: 'bloco', skin: '#f2f2f2', top: { type: 'plain', color: '#d4141a', sleeves: 'none' }, bottom: { type: 'pants', color: '#141416', belt: '#141416', buckle: false }, shoesO: { color: '#141416', sole: '#e8e8e8' }, hat: topHat() }),
  realChar({ name: 'jogador', body: 'masc', skin: '#8a5a3a', top: { type: 'jersey', color: '#1f4fd8', color2: '#ffffff', number: 7 }, bottom: { type: 'shorts', color: '#1f4fd8' }, shoesO: { color: '#f2f2f2', stripe: '#1f4fd8' }, hat: h4('boy', '#151515') }),
  realChar({ name: 'menina', body: 'fem', skin: '#f6dcc4', top: { type: 'sweater', color: '#f07aa8' }, bottom: { type: 'pants', color: '#1a2a6a' }, shoesO: { color: '#1a1a1a', sole: '#1a1a1a' }, hat: h4('ponytail', '#f0c860', null, { tieCol: '#ff4a8a' }), face: { anime: true, eyeColor: '#3aa8e8', lashes: true } }),
  realChar({ name: 'xadrez', body: 'masc', skin: '#f0c8a0', top: { type: 'plaid', color: '#c83a3a', color2: '#f2e8d8' }, bottom: { type: 'jeans', color: '#2a4a8a' }, shoesO: { color: '#5a3a20', sole: '#2a1a10' }, hat: h4('spiky', '#c0501a') }),
  realChar({ name: 'pijama', body: 'fem', skin: '#f6e0d0', top: { type: 'pajama', color: '#a888e8', color2: '#fff2a0' }, bottom: { type: 'pajama', color: '#a888e8', color2: '#fff2a0' }, shoesO: { color: '#f2e0d8', sole: '#e8d0c8' }, hat: h4('long', '#4a1c12', null, { buns: true, tieCol: '#e84a8a' }), face: { eyes: 'closed', lashes: true } }),
  realChar({ name: 'terno', body: 'masc', skin: '#d8a070', top: { type: 'suit', color: '#1a1a22', inner: '#f4f4f4', tie: '#c81a1a' }, bottom: { type: 'pants', color: '#1a1a22' }, shoesO: { color: '#101010', sole: '#101010' }, hat: h4('bacon', '#5a3420') }),
  realChar({ name: 'preso', body: 'masc', skin: '#c88a5a', top: { type: 'prison', color: '#f07a1a', number: '2410' }, bottom: { type: 'pants', color: '#f07a1a', belt: '#e06a10' }, shoesO: { color: '#f2f2f2' }, hat: h4('messy', '#2a1a10') }),
  realChar({ name: 'moletom', body: 'masc', skin: '#e8b890', top: { type: 'hoodie', color: '#2a62d8', color2: '#8a3ad8', fade: true }, bottom: { type: 'track', color: '#1a1a1e', color2: '#f2f2f2' }, shoesO: { color: '#f2f2f2', stripe: '#2a62d8' }, hat: h4('bob', '#151515') }),
  realChar({ name: 'soldado', body: 'masc', skin: '#a8704a', top: { type: 'military', color: '#4a6a2a', badge: true }, bottom: { type: 'pants', color: '#4a6a2a', belt: '#2a2a1a' }, shoesO: { color: '#2a1a10', sole: '#1a1a1a', type: 'boot' }, hat: h4('old', '#d8d8d8') }),
];
const bench = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, 1.6), new THREE.MeshStandardMaterial({ color: '#8a5a3a' })); bench.position.set(0, 0.8, -0.85); bench.castShadow = bench.receiveShadow = true;
window.APP = { ready: true, duration: 100, renderAt(t) { const i = Math.floor(t / 5), v = Math.round(t % 5); list.forEach(c => c.root.removeFromParent()); bench.removeFromParent(); const c = list[i]; c.reset(); if (v === 4) { scene.add(c.root); c.root.position.set(0, 0, 0); c.root.rotation.set(0, Math.PI, 0); alive(c, 1.3, 1, 2); c.applyFace(); cam.aspect = W / H; cam.position.set(0.3, 3.2, 9.5); cam.lookAt(0, 3.0, 0); cam.updateProjectionMatrix(); renderer.render(scene, cam); return; } scene.add(c.root); c.root.position.set(0, 0, 0); c.root.rotation.set(0, 0, 0);
  alive(c, 1.3, 1, 2);
  if (v === 1) { walkPath(c, 0.83, 0, 2, [-1, 0], [1, 0], { linear: true, stride: 2.2 }); c.root.position.set(0, 0, 0); c.root.rotation.y = 0.9; }
  if (v === 2) { c.root.rotation.y = 0.25; c.head.rotation.x = 0.1; c.head.rotation.z = 0.12; c.setFace({ mouth: 'flat', brow: 0.4, look: [0.6, -0.8] }); c.root.updateMatrixWorld(true); const TT = c.head.localToWorld(new THREE.Vector3(0.0, -0.02, 0.78)); reach(c, c.armR, TT, 1); c.root.updateMatrixWorld(true); const hw = c.armR.wrist.getWorldPosition(new THREE.Vector3()); const ew = c.armR.elbow.getWorldPosition(new THREE.Vector3()); const sw = c.armR.piv.getWorldPosition(new THREE.Vector3()); console.log('LOG IK target', TT.toArray().map(v=>v.toFixed(2)), 'wrist', hw.toArray().map(v=>v.toFixed(2)), 'elbow', ew.toArray().map(v=>v.toFixed(2)), 'sh', sw.toArray().map(v=>v.toFixed(2)), 'elb.rx', c.armR.elbow.rotation.x.toFixed(2)); c.armL.piv.rotation.z += 0.1; }
  if (v === 3) { scene.add(bench); c.root.position.z = -0.45; sit15(c, 1.6, 1); c.setFace({ mouth: 'grin', eyes: 'happy' }); c.root.rotation.y = 0.35; }
  if (v === 4) { c.root.rotation.y = Math.PI; c.root.updateMatrixWorld(true); reach(c, c.armR, c.torso.localToWorld(new THREE.Vector3(-0.3, 1.0, 0.9)), 1); reach(c, c.armL, c.torso.localToWorld(new THREE.Vector3(0.3, 1.0, 0.9)), 1); c.setFace({ mouth: 'o', eyes: 'wide' }); }
  c.applyFace(); cam.aspect = W / H; if (q.get('close')) { const a = +(q.get('ang') || 0); cam.position.set(Math.sin(a) * 5.2, 4.75, Math.cos(a) * 5.2); cam.lookAt(0, 4.55, 0); } else { cam.position.set(0.4, 3.0, 13.5); cam.lookAt(0, 2.9, 0); } cam.updateProjectionMatrix(); renderer.render(scene, cam); } };
