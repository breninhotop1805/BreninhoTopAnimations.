import * as THREE from 'three';
import { loadImage, imgToCanvas, Character } from './skin.js';
import { buildNFoxy, buildNFreddy, buildNBonnie, buildNChica, buildFoxyMask } from './nightmare.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
const cam = new THREE.PerspectiveCamera(30, W / H, 0.05, 100);
const sk = {}; for (const n of ['nfoxy_src', 'nfreddy_src', 'nbonnie_src', 'nchica_src', 'michael', 'cchild']) sk[n] = imgToCanvas(await loadImage(`/skins/${n}.png`));
const C = [buildNFoxy(sk.nfoxy_src), buildNFreddy(sk.nfreddy_src), buildNBonnie(sk.nbonnie_src), buildNChica(sk.nchica_src), new Character('michael', sk.michael), new Character('cchild', sk.cchild)];
const mask = buildFoxyMask(); C[4].head.add(mask);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#5a6070'); scene.add(new THREE.HemisphereLight('#ffffff', '#404050', 1.6)); const d = new THREE.DirectionalLight('#fff', 2); d.position.set(3, 5, 6); scene.add(d);
window.APP = { ready: true, duration: 100, renderAt(t) { const i = Math.floor(t / 10), a = Math.round(t % 10); const c = C[i]; scene.children.filter(o => o.isGroup).forEach(o => scene.remove(o)); scene.add(c.root); c.reset();
  if (a === 2 && c.jawOpen) c.jawOpen(1); if (a === 3) { c.armR.piv.rotation.x = -1.2; }
  const ang = [0, 0.9, 0.35, -0.6][a] || 0; const dist = a === 2 ? 2.2 : 5.2; const ty = a === 2 ? 1.75 : 1.05; cam.position.set(Math.sin(ang) * dist, ty + 0.2, Math.cos(ang) * dist); cam.lookAt(0, ty, 0); renderer.render(scene, cam); } };
