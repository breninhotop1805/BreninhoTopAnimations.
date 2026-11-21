import * as THREE from 'three';
import { loadImage, imgToCanvas } from './skin.js';
import { buildRockstar, fazCoin } from './rockstar.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
const cam = new THREE.PerspectiveCamera(30, W / H, 0.05, 100);
const c = buildRockstar(imgToCanvas(await loadImage('/skins/rockstar.png'))); const coin = fazCoin();
const scene = new THREE.Scene(); scene.background = new THREE.Color('#5a6070'); scene.add(new THREE.HemisphereLight('#ffffff', '#404050', 1.6)); const d = new THREE.DirectionalLight('#fff', 2); d.position.set(3, 5, 6); scene.add(d); scene.add(c.root); c.root.scale.setScalar(1.35);
window.APP = { ready: true, duration: 100, renderAt(t) { c.reset(); const a = Math.round(t); c.armR.piv.rotation.x = a === 5 ? -1.3 : a === 7 ? -2.05 : -1.3; if (a === 7) c.armR.piv.rotation.z = 0.35; c.eyeRed(a === 8 ? 1 : 0); c.micUp(); scene.remove(coin);
  const ang = [0, 0.8, 1.57, Math.PI, 0, 0.3, 0, -0.5, 0][a] || 0; const close = a === 4 || a === 6 || a === 7 || a === 8; const dist = close ? (a === 7 ? 2.6 : 1.8) : 5.4; const ty = a === 4 || a === 8 ? 2.3 : a === 6 ? 1.5 : a === 7 ? 2.2 : 1.4;
  if (a === 6) { scene.add(coin); const p = c.slotPt(); coin.position.copy(p).add(new THREE.Vector3(0, 0.18, 0.12)); coin.rotation.y = Math.PI / 2; }
  cam.position.set(Math.sin(ang) * dist, ty + 0.1, Math.cos(ang) * dist); cam.lookAt(0, ty, 0); renderer.render(scene, cam); } };
