import * as THREE from 'three';
import { loadBodies, realChar } from './realbody.js';
import { HAIR4 } from './hair4.js';
import { topHat } from './rbx.js';
import { alive } from './act.js';
import { pose15 } from './poses15.js';
import { loadFonts, room, sky, interiorLight } from './kit.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.shadowMap.enabled = true; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
await loadFonts(); await loadBodies();
const s = new THREE.Scene(); s.background = new THREE.Color('#222'); room(s, { w: 26, d: 20, wall: '#cfe0f0' }); interiorLight(s, { pos: [0, 10.5, 4], i: 160 });
const h4 = (st, col, c2, o) => head => { const g = new THREE.Group(); head.add(g); HAIR4[st](g, col, c2, o || {}); };
const C = [realChar({ name: 'heroi', body: 'bloco', skin: '#f2f2f2', top: { type: 'plain', color: '#d4141a', sleeves: 'none' }, bottom: { type: 'pants', color: '#141416', belt: '#141416', buckle: false }, shoesO: { color: '#141416' }, hat: topHat() }),
  realChar({ name: 'menina', body: 'fem', skin: '#f6dcc4', top: { type: 'sweater', color: '#f07aa8' }, bottom: { type: 'pants', color: '#1a2a6a' }, shoesO: { color: '#1a1a1a' }, hat: h4('ponytail', '#f0c860', null, { tieCol: '#ff4a8a' }), face: { anime: true, eyeColor: '#3aa8e8', lashes: true } })];
const P = ['coverFace', 'handsHead', 'crossArms', 'laugh', 'fistUp', 'think', 'shrug', 'cheer', 'scared', 'facepalm', 'hips', 'sad', 'chest', 'clap', 'phone', 'holdFront'];
window.APP = { ready: true, duration: 40, renderAt(t) { const i = Math.floor(t) % P.length, ci = Math.floor(t / P.length); for (const c of C) c.root.removeFromParent(); const c = C[ci]; c.reset(); s.add(c.root); c.root.position.set(0, 0, 0); c.root.rotation.set(0, 0.25, 0);
  alive(c, 1.2, 1, 2); pose15(c, P[i], 1, 0.7); c.applyFace(); const cam = new THREE.PerspectiveCamera(40, W / H, 0.1, 200); cam.position.set(1.5, 4.2, 12.5); cam.lookAt(0, 3.7, 0); renderer.render(s, cam); } };
