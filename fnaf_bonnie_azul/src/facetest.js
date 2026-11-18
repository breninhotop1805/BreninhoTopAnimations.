import * as THREE from 'three';
import { loadImage, imgToCanvas, Character, buildSpring, addEndo, scrapEars, buildWilliam, buildPurpleGuy, buildGlitchtrap, recolorChild } from './skin.js';
import { addFace, FACES } from './face.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 1080, H = +q.get('h') || 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#202430'); const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 100);
scene.add(new THREE.HemisphereLight('#dde', '#332', 1.2)); const d = new THREE.DirectionalLight('#fff', 2); d.position.set(2, 5, 6); scene.add(d);
const sk = {}; for (const n of ['springtrap', 'scraptrap', 'glitchtrap', 'william', 'purpleguy', 'child', 'guard']) sk[n] = imgToCanvas(await loadImage(`/skins/${n}.png`));
const C = [
  addFace(addEndo(buildSpring(sk.springtrap, 'springtrap', { bent: true, endo: true, clearJunk: true })), FACES.springtrap),
  addFace(scrapEars(addEndo(buildSpring(sk.scraptrap, 'scraptrap', { bent: true, endo: true, clearJunk: true, fur: '#4a3424', inner: '#6a4a34' }))), FACES.scraptrap),
  addFace(buildGlitchtrap(sk.glitchtrap), FACES.glitchtrap),
  addFace(buildWilliam(sk.william), FACES.william), addFace(buildPurpleGuy(sk.purpleguy), FACES.purpleguy),
  addFace(new Character('kid', recolorChild(sk.child, { shirt: '#3a7ae8', accent: '#ffffff', pants: '#3a3a3a', hair: '#2a1a0a' })), FACES.child),
  addFace(new Character('guard', sk.guard), FACES.guard)];
C.forEach((c, i) => { scene.add(c.root); });
const STATES = [{}, { lid: 1 }, { lid: 0.5, slope: 1 }, { lid: 0.5, slope: -1 }, { mouth: 1 }, { lid: 0.5, slope: 1, mouth: 1 }];
window.APP = { ready: true, duration: 99, renderAt: t => { const st = STATES[Math.floor(t / 10)]; const ci = Math.floor(t % 10); const side = t % 1 > 0.25;
  C.forEach((c, i) => { c.reset(); c.setFace(st); c.applyFace(); c.root.visible = i === ci; c.root.rotation.y = side ? 0.65 : 0; });
  const hy = C[ci].root.scale.y * 1.75; camera.aspect = W / H; camera.fov = 22; camera.position.set(0, hy + 0.1, 4.2); camera.lookAt(0, hy, 0); camera.updateProjectionMatrix(); renderer.render(scene, camera); } };
