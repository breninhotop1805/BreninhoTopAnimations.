import * as THREE from 'three';
import { loadImage, imgToCanvas, buildWilliam } from './skin.js';
import { buildMimicV2 } from './mimic.js';
import { addFace, FACES } from './face.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 1080, H = +q.get('h') || 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.shadowMap.enabled = true; document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#14121a'); const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 100);
scene.add(new THREE.HemisphereLight('#c8c0d8', '#2a2020', 0.7)); const d = new THREE.DirectionalLight('#ffe8d8', 2.2); d.position.set(2, 6, 6); d.castShadow = true; scene.add(d); const rim = new THREE.DirectionalLight('#ff8a5a', 1.2); rim.position.set(-4, 4, -5); scene.add(rim);
const fl = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: '#2a2630', roughness: 0.9 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
const m = buildMimicV2(imgToCanvas(await loadImage('/skins/mimic.png'))); scene.add(m.root); m.root.scale.setScalar(m.baseScale);
const w = addFace(buildWilliam(imgToCanvas(await loadImage('/skins/william.png'))), FACES.william); scene.add(w.root);
window.APP = { ready: true, duration: 99, renderAt: t => { const v = Math.floor(t); m.reset(); w.reset(); m.idle(t, 1); w.root.visible = false; m.root.position.set(0, 0, 0);
  if (v < 4) { m.root.rotation.y = [0, 0.7, Math.PI / 2, Math.PI][v]; camera.fov = 30; camera.position.set(0, 1.9, 9); camera.lookAt(0, 1.75, 0); }
  else if (v === 4) { m.root.rotation.y = 0.25; const hy = m.head.getWorldPosition(new THREE.Vector3()).y; camera.fov = 30; camera.position.set(0.3, hy + 0.4, 2.6); camera.lookAt(0, hy + 0.25, 0); }
  else { m.root.rotation.y = 0.3; m.root.position.x = -0.9; w.root.visible = true; w.root.position.set(1.0, 0, 0.3); w.root.rotation.y = -0.3; camera.fov = 30; camera.position.set(0, 1.8, 9.5); camera.lookAt(0, 1.6, 0); m.jaw.rotation.x = 0.35; }
  if (v === 6) { w.root.visible = false; m.root.rotation.y = 0.35; m.root.position.x = 0; m.jaw.rotation.x = 0.3; m.armR.piv.rotation.set(-1.2, 0, -0.2); m.armL.piv.rotation.set(-1.0, 0, 0.25); m.head.rotation.set(0.1, 0.25, 0.22); camera.fov = 30; camera.position.set(1.2, 2.0, 6.6); camera.lookAt(0, 2.1, 0); }
  camera.aspect = W / H; camera.updateProjectionMatrix(); renderer.render(scene, camera); } };
