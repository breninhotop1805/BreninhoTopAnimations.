import * as THREE from 'three';
import { loadImage, imgToCanvas, Character } from './skin.js';
import { buildNFoxy, buildFoxyMask2 } from './nightmare.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
const cam = new THREE.PerspectiveCamera(30, W / H, 0.05, 100);
const sk = {}; for (const n of ['nfoxy_src', 'michael', 'foxy_classic']) sk[n] = imgToCanvas(await loadImage(`/skins/${n}.png`));
const F = buildNFoxy(sk.nfoxy_src); const M = new Character('michael', sk.michael); const mask = buildFoxyMask2(sk.foxy_classic); M.head.add(mask);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#4a5060'); scene.add(new THREE.HemisphereLight('#ffffff', '#404050', 1.5)); const d = new THREE.DirectionalLight('#fff', 2); d.position.set(3, 5, 6); scene.add(d);
// t: 0 front closed, 1 3/4 closed, 2 profile closed, 3 front open, 4 3/4 open, 5 profile open, 6 full body front, 7 full 3/4, 8 michael mask front, 9 mask 3/4
window.APP = { ready: true, duration: 100, renderAt(t) { const a = Math.round(t); scene.remove(F.root); scene.remove(M.root); const c = a >= 8 ? M : F; scene.add(c.root); c.reset(); c.root.scale.setScalar(a >= 8 ? 1 : 1.35);
  if (c.jawOpen) c.jawOpen(a >= 3 && a <= 5 ? 1 : 0.15); const ang = [0, 0.7, 1.57, 0, 0.7, 1.57, 0, 0.7, 0, 0.7][a]; const full = a === 6 || a === 7; const dist = full ? 6 : 1.8; const ty = full ? 1.3 : (a >= 8 ? 1.75 : 2.3); const dd = a >= 8 ? 2.4 : dist;
  cam.position.set(Math.sin(ang) * dd, ty + 0.1, Math.cos(ang) * dd); cam.lookAt(0, ty, 0); renderer.render(scene, cam); } };
