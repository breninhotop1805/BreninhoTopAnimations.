// Proportion + door test for the new set kit (street, bedroom, school) with the official bodies.
import * as THREE from 'three';
import { loadBodies, realChar } from './realbody.js';
import { HAIR4 } from './hair4.js';
import { topHat } from './rbx.js';
import { walkPath, alive, sit15, eo, seg, sm, mix } from './act.js';
import { pose15 } from './poses15.js';
import { loadFonts, street, room, FURN, sky, daylight, interiorLight, obstacleCheck, SC, textTex, bx, mat } from './kit.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
await loadFonts(); await loadBodies();
const cam = new THREE.PerspectiveCamera(40, W / H, 0.1, 400);
const h4 = (st, col, c2, o) => head => { const g = new THREE.Group(); head.add(g); HAIR4[st](g, col, c2, o || {}); };
const hero = realChar({ name: 'heroi', body: 'bloco', skin: '#f2f2f2', top: { type: 'plain', color: '#d4141a', sleeves: 'none' }, bottom: { type: 'pants', color: '#141416', belt: '#141416', buckle: false }, shoesO: { color: '#141416', sole: '#e8e8e8' }, hat: topHat() });
const girl = realChar({ name: 'menina', body: 'fem', skin: '#f6dcc4', top: { type: 'sweater', color: '#f07aa8' }, bottom: { type: 'pants', color: '#1a2a6a' }, shoesO: { color: '#1a1a1a', sole: '#1a1a1a' }, hat: h4('ponytail', '#f0c860', null, { tieCol: '#ff4a8a' }), face: { anime: true, eyeColor: '#3aa8e8', lashes: true } });
const boy = realChar({ name: 'garoto', body: 'masc', skin: '#8a5a3a', top: { type: 'jersey', color: '#1f4fd8', color2: '#ffffff', number: 7 }, bottom: { type: 'shorts', color: '#1f4fd8' }, shoesO: { color: '#f2f2f2', stripe: '#1f4fd8' }, hat: h4('boy', '#1a1a1a') });
// ---- scenes
const SS = {};
{ const s = new THREE.Scene(); sky(s); daylight(s); const st = street(s, { len: 110 }); s.userData.st = st; SS.street = s; }
{ const s = new THREE.Scene(); s.background = new THREE.Color('#202028'); const r = room(s, { w: 26, d: 22, wall: '#bcd8f0', wallTex: null, doors: [{ wall: 'right', x: 2, name: 'quarto', color: '#9a5a32' }], windows: [{ wall: 'back', x: -6, curtains: '#f4c03a' }] });
  FURN.bed(r.group, s, 2, -6.4, 0, { quilt: '#7ac05a' }); FURN.nightstand(r.group, s, -2.2, -9, 0, {}); FURN.rug(r.group, 1, 2.5, 9, 6); FURN.wallClock(r.group, 7.5, 8.5, -10.65, 0, { h: 2, m: 0 }); FURN.shelf(r.group, s, -9.5, -8.6, 0, {});
  interiorLight(s, { pos: [0, 10.5, 0], i: 140 }); const sun = new THREE.DirectionalLight('#fff4e0', 1.2); sun.position.set(-10, 20, 25); s.add(sun); s.userData.room = r; SS.bed = s; }
{ const s = new THREE.Scene(); s.background = new THREE.Color('#202028'); const r = room(s, { w: 30, d: 18, wall: '#f4e8c8', floorTex: null, floor: '#9aa4b0', doors: [{ wall: 'back', x: 8, name: 'sala', color: '#c8763a', sign: 'SALA 3' }] });
  FURN.lockers(r.group, s, -5, -8.2, 0, { n: 9 }); FURN.wallClock(r.group, 8, 9.6, -8.65, 0, { h: 7, m: 55, rim: '#2a2a2a' }); interiorLight(s, { pos: [0, 10.5, 0], i: 160 }); s.userData.room = r; SS.school = s; }
// ---- shots: t = 0..: 0 street proportion, 1-4 hero walks into the house, 5 bedroom wide, 6-9 girl enters bedroom, 10 school, 11-13 boy walks to class door
window.APP = { ready: true, duration: 20, renderAt(t) { for (const c of [hero, girl, boy]) { c.root.removeFromParent(); c.reset(); c.root.position.set(0, 0, 0); c.root.rotation.set(0, 0, 0); c.allowObst = null; }
  let s, live = [];
  if (t < 5) { s = SS.street; const hs = s.userData.st.houses[3]; const dX = hs.group.position.x + 0 + (hs.door.group.position.x); s.add(hero.root); live = [hero];
    if (t < 1) { hero.root.position.set(dX + 3.5, 0, 3.2); hero.root.rotation.y = -0.3; alive(hero, 1, 1, 2); hs.door.set(0); cam.position.set(dX + 2, 6.5, 30); cam.lookAt(dX + 1.5, 9, 0); cam.fov = 40; }
    else { const L = (t - 1) / 3 * 3.2; hs.door.set(sm(seg(L, 0.0, 0.8))); walkPath(hero, L, 0.5, 3.0, [dX, 5.5], [dX, -3.5], { stride: 2.4 }); cam.position.set(dX + 7, 5.5, 14); cam.lookAt(dX, 4, 0); cam.fov = 40; } }
  else if (t < 10) { s = SS.bed; const r = s.userData.room; const d = r.doors.quarto; s.add(girl.root); live = [girl];
    if (t < 6) { d.set(0); girl.root.position.set(-2, 0, 2); girl.root.rotation.y = 0.3; alive(girl, 1, 1, 3); cam.position.set(3, 6.5, 26); cam.lookAt(0, 5.5, -4); cam.fov = 42; }
    else { const L = (t - 6) / 3 * 3.0; d.set(sm(seg(L, 0, 0.7))); walkPath(girl, L, 0.4, 2.8, [17, 2], [5, 2], { stride: 2.2 }); cam.position.set(-2, 6, 20); cam.lookAt(9, 4.5, 1); cam.fov = 44; } }
  else { s = SS.school; const r = s.userData.room; const d = r.doors.sala; s.add(boy.root); live = [boy];
    if (t < 11) { d.set(0); boy.root.position.set(-1, 0, 0); alive(boy, 1, 1, 4); pose15(boy, 'hips', 1, 1); cam.position.set(1, 6, 24); cam.lookAt(0, 5.5, -4); cam.fov = 42; }
    else { const L = (t - 11) / 3 * 3.0; d.set(sm(seg(L, 0.9, 1.6))); walkPath(boy, L, 0.2, 2.9, [2, 2], [8, -11], { stride: 2.3 }); cam.position.set(-4, 6, 16); cam.lookAt(6, 4.5, -6); cam.fov = 44; } }
  for (const c of live) c.applyFace(); obstacleCheck(t, s, live); cam.aspect = W / H; cam.updateProjectionMatrix(); renderer.render(s, cam); } };
