import * as THREE from 'three';
import { CAST2, hero } from './chars.js';
import { buildStreet } from './sets.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
const S = {}; const scene = buildStreet(S); const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
// ONE character on screen at a time (never overlapping anything): each stands alone in the middle of the street
const list = [hero(), ...Object.values(CAST2).map(f => f())]; list.forEach(c => c.applyFace());
window.APP = { ready: true, duration: 100, renderAt(t) { const i = Math.floor(t / 2), v = Math.round(t % 2); list.forEach(c => c.root.removeFromParent()); const c = list[i]; scene.add(c.root); c.root.position.set(0, 0, 0); c.root.rotation.y = v ? 0.55 : 0;
  c.armR.piv.rotation.z = -0.06; c.armL.piv.rotation.z = 0.06; cam.aspect = W / H; if (q.get('close')) { cam.position.set(0.3, 4.9, 6.5); cam.lookAt(0, 4.75, 0); } else { cam.position.set(0.4, 3.3, 14); cam.lookAt(0, 2.9, 0); } cam.updateProjectionMatrix(); renderer.render(scene, cam); } };
