import * as THREE from 'three';
import { CAST3, hero } from './chars.js';
import { buildStreet } from './sets.js';
import { gesture, walkPath, sit15, alive } from './act.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
const S = {}; const scene = buildStreet(S); const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
const bench = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, 1.6), new THREE.MeshStandardMaterial({ color: '#8a5a3a' })); bench.position.set(0, 0.8, -0.7); bench.castShadow = bench.receiveShadow = true;
const list = [hero(), ...Object.values(CAST3).map(f => f())];
// t = i*4 + v : v 0 front idle, 1 walking (3/4), 2 think, 3 sitting
window.APP = { ready: true, duration: 200, renderAt(t) { const i = Math.floor(t / 4), v = Math.round(t % 4); list.forEach(c => c.root.removeFromParent()); bench.removeFromParent(); const c = list[i]; c.reset(); scene.add(c.root); c.root.position.set(0, 0, 0); c.root.rotation.set(0, 0, 0);
  alive(c, 1.3, 1, 2);
  if (v === 1) { walkPath(c, 0.83, 0, 2, [-1, 0], [1, 0], { linear: true, stride: 2.2 }); c.root.position.set(0, 0, 0); c.root.rotation.y = 0.9; }
  if (v === 2) { gesture(c, 'think', 2, 0, 99, 1); c.root.rotation.y = 0.25; }
  if (v === 3) { scene.add(bench); c.root.position.z = -0.35; sit15(c, 1.6 - 2 + 2, 1); c.setFace({ mouth: 'grin', eyes: 'happy' }); c.root.rotation.y = 0.35; }
  c.applyFace(); cam.aspect = W / H; if (q.get('close')) { cam.position.set(0.3, 4.6, 6.0); cam.lookAt(0, 4.3, 0); } else { cam.position.set(0.4, 3.3, 12.5); cam.lookAt(0, 2.8, 0); } cam.updateProjectionMatrix(); renderer.render(scene, cam); } };
