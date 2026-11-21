import * as THREE from 'three';
import { loadImage, imgToCanvas, buildPuppet } from './skin.js';
import { buildLefty } from './lefty.js';
import { addFace } from './face.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 1080, H = +q.get('h') || 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.shadowMap.enabled = true; document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#22202c'); const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 100);
scene.add(new THREE.HemisphereLight('#d8d0e8', '#2a2020', 0.9)); const d = new THREE.DirectionalLight('#fff0e0', 2.4); d.position.set(2, 6, 6); d.castShadow = true; scene.add(d); const rim = new THREE.DirectionalLight('#ff8a7a', 1.0); rim.position.set(-4, 4, -5); scene.add(rim);
const fl = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: '#3a3644' })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
const L = addFace(buildLefty(imgToCanvas(await loadImage('/skins/lefty.png'))), { eyes: [[2, 4, 4, 4], [10, 4, 4, 4]], lid: '#343434', lash: '#d41b1b' }); scene.add(L.root);
window.APP = { ready: true, duration: 99, renderAt: t => { const v = Math.floor(t); L.reset(); L.root.scale.setScalar(1.15); L.idle(t, 1); L.armL.piv.rotation.x = -1.0; L.armL.piv.rotation.z = 0.1;
  if (v < 4) { L.root.rotation.y = [0, 0.7, Math.PI / 2, Math.PI][v]; camera.position.set(0, 1.6, 7.5); camera.lookAt(0, 1.3, 0); }
  else if (v === 4) { L.root.rotation.y = 0.35; L.jaw.rotation.x = 0.35; camera.position.set(0.4, 2.25, 2.4); camera.lookAt(0, 2.05, 0); }
  else if (v === 5) { L.root.rotation.y = -0.3; L.setStripes(1, 1); camera.position.set(-1.9, 1.5, 2.6); camera.lookAt(-0.45, 1.25, 0); }
  else { L.root.rotation.y = 0.2; L.setFace({ lid: 1 }); camera.position.set(0.2, 2.25, 2.0); camera.lookAt(0, 2.1, 0); }
  L.applyFace(); camera.aspect = W / H; camera.updateProjectionMatrix(); renderer.render(scene, camera); } };
