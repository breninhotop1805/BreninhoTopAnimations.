import * as THREE from 'three';
import { loadImage, imgToCanvas, buildBonnie, buildGBonnie } from './skin.js';
import { toBlue, purpleTint, buildWitheredBonnie, guitar, buildPoster } from './bonnie.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 1080, H = +q.get('h') || 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.shadowMap.enabled = true; document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#202430'); const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 100);
scene.add(new THREE.HemisphereLight('#e8e8f0', '#302828', 1.0)); const d = new THREE.DirectionalLight('#ffffff', 2.2); d.position.set(2, 6, 6); d.castShadow = true; scene.add(d);
const sk = {}; for (const n of ['bonnie_classic', 'toybonnie', 'gbonnie', 'wbonnie']) sk[n] = imgToCanvas(await loadImage(`/skins/${n}.png`));
const BL = { b: '#3a62c8', l: '#5a82e0', d: '#24408a', w: '#c8d4f6', p: '#f2a7c3' };
const C = [buildBonnie(toBlue(sk.bonnie_classic), { name: 'bonnie', palette: BL }), buildWitheredBonnie(sk.wbonnie), buildBonnie(sk.toybonnie, { name: 'toy' }), buildGBonnie(sk.gbonnie)]; guitar(C[0]);
const B2 = buildBonnie(toBlue(sk.bonnie_classic), { name: 'bonnie2', palette: BL }); guitar(B2); C.push(B2);
const P = buildPoster(); scene.add(P);
C.forEach((c, i) => { scene.add(c.root); c.root.scale.setScalar(1.15); c.root.position.x = (i - 2) * 0.95; });
window.APP = { ready: true, duration: 99, renderAt: t => { const v = Math.floor(t); C.forEach(c => { c.reset(); c.root.visible = v < 2; c.root.rotation.y = v === 1 ? 0.6 : 0; }); purpleTint(C[4], 1); P.visible = false;
  if (v < 2) { camera.position.set(0, 1.8, 14); camera.lookAt(0, 1.4, 0); camera.fov = 34; }
  else if (v === 2) { C[1].root.visible = true; C[1].root.position.x = 0; C[1].root.rotation.y = 0.5; C[1].jaw.rotation.x = 0.3; camera.position.set(0.3, 2.55, 2.0); camera.lookAt(0, 2.35, 0); camera.fov = 34; }
  else { P.visible = true; P.position.set(0, 1.5, 0); camera.position.set(0, 1.5, 2.0); camera.lookAt(0, 1.5, 0); camera.fov = 40; }
  camera.aspect = W / H; camera.updateProjectionMatrix(); renderer.render(scene, camera); } };
