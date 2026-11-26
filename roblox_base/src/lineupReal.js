import * as THREE from 'three';
import { loadBodies, realChar } from './realbody.js';
import { HAIR2, HAIR3 } from './chars.js';
import { topHat } from './rbx.js';
import { buildStreet } from './sets.js';
import { gesture, walkPath, sit15, alive, reach } from './act.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
const S = {}; const scene = buildStreet(S); const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
await loadBodies();
const hair = (style, col, c2) => head => { const g = new THREE.Group(); head.add(g); (HAIR3[style] || HAIR2[style])(g, col, c2); };
const list = [
  realChar({ name: 'heroi', body: 'bloco', skin: '#f2f2f2', shirt: '#d4141a', sleeves: 'none', pants: '#141416', shoes: '#141416', hat: topHat() }),
  realChar({ name: 'menina', body: 'fem', skin: '#f6dcc4', shirt: '#f07aa8', pants: '#f2efe8', shoes: '#1a1a1a', hat: hair('ponytail2', '#f0c860', '#ff4a8a'), face: { anime: true, eyeColor: '#3aa8e8', lashes: true } }),
  realChar({ name: 'garoto', body: 'masc', skin: '#8a5a3a', shirt: '#2a62d8', sleeves: 'short', pants: '#2a2a3a', shoes: '#f2f2f2', hat: hair('quiff', '#151515') }),
  realChar({ name: 'morena', body: 'fem', skin: '#f3d6c0', shirt: '#a888e8', pants: '#a888e8', shoes: '#f2e0d8', hat: hair('long', '#2a1410'), face: { lashes: true } }),
];
const bench = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, 1.6), new THREE.MeshStandardMaterial({ color: '#8a5a3a' })); bench.position.set(0, 0.8, -0.85); bench.castShadow = bench.receiveShadow = true;
window.APP = { ready: true, duration: 100, renderAt(t) { const i = Math.floor(t / 5), v = Math.round(t % 5); list.forEach(c => c.root.removeFromParent()); bench.removeFromParent(); const c = list[i]; c.reset(); scene.add(c.root); c.root.position.set(0, 0, 0); c.root.rotation.set(0, 0, 0);
  alive(c, 1.3, 1, 2);
  if (v === 1) { walkPath(c, 0.83, 0, 2, [-1, 0], [1, 0], { linear: true, stride: 2.2 }); c.root.position.set(0, 0, 0); c.root.rotation.y = 0.9; }
  if (v === 2) { c.root.rotation.y = 0.25; c.head.rotation.x = 0.1; c.head.rotation.z = 0.12; c.setFace({ mouth: 'flat', brow: 0.4, look: [0.6, -0.8] }); c.root.updateMatrixWorld(true); const TT = c.head.localToWorld(new THREE.Vector3(0.0, -0.02, 0.78)); reach(c, c.armR, TT, 1); c.root.updateMatrixWorld(true); const hw = c.armR.wrist.getWorldPosition(new THREE.Vector3()); const ew = c.armR.elbow.getWorldPosition(new THREE.Vector3()); const sw = c.armR.piv.getWorldPosition(new THREE.Vector3()); console.log('LOG IK target', TT.toArray().map(v=>v.toFixed(2)), 'wrist', hw.toArray().map(v=>v.toFixed(2)), 'elbow', ew.toArray().map(v=>v.toFixed(2)), 'sh', sw.toArray().map(v=>v.toFixed(2)), 'elb.rx', c.armR.elbow.rotation.x.toFixed(2)); c.armL.piv.rotation.z += 0.1; }
  if (v === 3) { scene.add(bench); c.root.position.z = -0.45; sit15(c, 1.6, 1); c.setFace({ mouth: 'grin', eyes: 'happy' }); c.root.rotation.y = 0.35; }
  if (v === 4) { c.root.rotation.y = 0.2; c.root.updateMatrixWorld(true); reach(c, c.armR, c.torso.localToWorld(new THREE.Vector3(-0.3, 1.0, 0.9)), 1); reach(c, c.armL, c.torso.localToWorld(new THREE.Vector3(0.3, 1.0, 0.9)), 1); c.setFace({ mouth: 'o', eyes: 'wide' }); }
  c.applyFace(); cam.aspect = W / H; if (q.get('close')) { cam.position.set(0.3, 4.6, 6.0); cam.lookAt(0, 4.3, 0); } else { cam.position.set(0.4, 3.0, 13.5); cam.lookAt(0, 2.9, 0); } cam.updateProjectionMatrix(); renderer.render(scene, cam); } };
