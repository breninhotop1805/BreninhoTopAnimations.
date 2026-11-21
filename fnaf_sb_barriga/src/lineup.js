import * as THREE from 'three';
import { loadImage, imgToCanvas, buildGregory, buildWilliam } from './skin.js';
import { buildGFreddy2, buildFFreddy2, buildFFoxy2, buildBallora } from './sb.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
const cam = new THREE.PerspectiveCamera(30, W / H, 0.05, 100);
const sk = {}; for (const n of ['gfreddy', 'ffreddy', 'ffoxy', 'ballora', 'gregory', 'william']) sk[n] = imgToCanvas(await loadImage(`/skins/${n}.png`));
const C = [buildGFreddy2(sk.gfreddy), buildFFreddy2(sk.ffreddy), buildFFoxy2(sk.ffoxy), buildBallora(sk.ballora), buildGregory(sk.gregory), buildWilliam(sk.william)];
const scene = new THREE.Scene(); scene.background = new THREE.Color('#5a6070'); scene.add(new THREE.HemisphereLight('#ffffff', '#404050', 1.6)); const d = new THREE.DirectionalLight('#fff', 2); d.position.set(3, 5, 6); scene.add(d);
// t = char*10 + view: 0 front closed, 1 3/4 closed, 2 front open, 3 3/4 open, 4 side open, 5 close face open, 6 back
window.APP = { ready: true, duration: 100, renderAt(t) { const i = Math.floor(t / 10), a = Math.round(t % 10); const c = C[i]; scene.children.filter(o => o.isGroup).forEach(o => scene.remove(o)); scene.add(c.root); c.reset(); c.root.scale.setScalar(c.baseScale || 1);
  const open = (a >= 2 && a <= 4) || a === 8 ? 1 : 0; if (c.setHatch) c.setHatch(open); if (c.setPlates) c.setPlates(open); if (i === 3) { c.armR.piv.rotation.set(-0.2, 0, -2.6); c.armL.piv.rotation.set(-0.2, 0, 2.6); }
  const ang = [0, 0.8, 0, 0.8, 1.5, 0, Math.PI, 0.6, 1.4][a]; const close = a >= 5 && a !== 6; const s = c.baseScale || 1; const dist = (close ? 1.3 : 4.2) * s; const ty = (close ? 1.72 : 1.15) * s; cam.position.set(Math.sin(ang) * dist, ty + 0.1, Math.cos(ang) * dist); cam.lookAt(0, ty, 0); renderer.render(scene, cam); } };
