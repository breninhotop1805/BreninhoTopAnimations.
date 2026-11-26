import * as THREE from 'three';
import { protagonist, CAST } from './rbx.js';
import { buildStreet } from './sets.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
const S = {}; const scene = buildStreet(S); const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
const list = [protagonist(), ...Object.values(CAST).map(f => f())]; list.forEach((c, i) => { scene.add(c.root); c.root.position.set((i - 3) * 4.2, 0, 0); c.applyFace(); });
window.APP = { ready: true, duration: 100, renderAt(t) { const a = Math.round(t); if (a === 0) { cam.aspect = W / H; cam.position.set(0, 3.5, 60); cam.lookAt(0, 2.6, 0); } else { const c = list[a - 1]; const ang = 0.5; cam.position.set(c.root.position.x + Math.sin(ang) * 13, 3.4, Math.cos(ang) * 13); cam.lookAt(c.root.position.x, 2.9, 0); }
  cam.updateProjectionMatrix(); renderer.render(scene, cam); } };
