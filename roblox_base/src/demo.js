// DEMO of the new standard (no narration): official bodies + classic clothes + hair v4 + R15 poses + proportional sets,
// shots of ~1.5 s, push-in ~5%/s, inserts, door walk-through, world text in Montserrat, post (AO + DOF + bloom + grade).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadBodies, realChar, heroStd } from './realbody.js';
import { HAIR4, HAIR5 } from './hair4.js';
import { topHat } from './rbx.js';
import { walkPath, alive, gestW, eio, eo, sm, seg, mix, startle } from './act.js';
import { pose15 } from './poses15.js';
import { loadFonts, street, room, FURN, sky, daylight, interiorLight, obstacleCheck, cameraCheck, SC } from './kit.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
await loadFonts(); await loadBodies();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 400);
const h4 = (st, col, c2, o) => head => { const g = new THREE.Group(); head.add(g); HAIR4[st](g, col, c2, o || {}); };
const hero = heroStd();
const girl = realChar({ name: 'menina', body: 'fem', skin: '#f6dcc4', top: { type: 'sweater', color: '#f07aa8' }, bottom: { type: 'pants', color: '#1a2a6a' }, shoesO: { color: '#1a1a1a', sole: '#1a1a1a' }, hat: h4('ponytail', '#f0c860', null, { tieCol: '#ff4a8a' }), face: { anime: true, eyeColor: '#3aa8e8', lashes: true } });
const boy = realChar({ name: 'garoto', body: 'masc', skin: '#8a5a3a', top: { type: 'jersey', color: '#1f4fd8', color2: '#ffffff', number: 7 }, bottom: { type: 'shorts', color: '#1f4fd8' }, shoesO: { color: '#f2f2f2', stripe: '#1f4fd8' }, hat: h4('boy', '#1a1a1a') });
const ALL = [hero, girl, boy];
// ---- sets
const SS = {};
{ const s = new THREE.Scene(); sky(s); daylight(s, { sunPos: [-30, 45, 50] }); s.userData.st = street(s, { len: 110, trees: [-34, -12, 40] }); SS.street = s; }
{ const s = new THREE.Scene(); s.background = new THREE.Color('#202028'); const r = room(s, { w: 26, d: 22, wall: '#bcd8f0', doors: [{ wall: 'right', x: 2, name: 'quarto', color: '#9a5a32' }], windows: [{ wall: 'back', x: -6, curtains: '#f4c03a' }] });
  FURN.bed(r.group, s, 2, -6.4, 0, { quilt: '#7ac05a' }); FURN.nightstand(r.group, s, -2.2, -9, 0, { lit: true }); FURN.rug(r.group, 1, 2.5, 9, 6); s.userData.clock = FURN.wallClock(r.group, 7.5, 8.5, -10.65, 0, { h: 2, m: 0 }); FURN.shelf(r.group, s, -9.5, -8.6, 0, {});
  interiorLight(s, { pos: [0, 10.5, 2], i: 150 }); const sun = new THREE.DirectionalLight('#fff4e0', 1.1); sun.position.set(-10, 20, 25); s.add(sun); s.userData.room = r; SS.bed = s; }
{ const s = new THREE.Scene(); s.background = new THREE.Color('#202028'); const r = room(s, { w: 30, d: 18, wall: '#f4e8c8', floor: '#9aa4b0', doors: [{ wall: 'back', x: 8, name: 'sala', color: '#c8763a', sign: 'SALA 3', inward: true }] });
  FURN.lockers(r.group, s, -5, -8.2, 0, { n: 9 }); FURN.wallClock(r.group, 8, 9.9, -8.65, 0, { h: 7, m: 55, rim: '#2a2a2a' }); interiorLight(s, { pos: [0, 10.5, 2], i: 170 }); s.userData.room = r; SS.school = s; }
// ---- post
const composer = new EffectComposer(renderer); const rp = new RenderPass(SS.street, camera); composer.addPass(rp);
const gtao = new GTAOPass(SS.street, camera, W, H); { const ss = gtao.setSize.bind(gtao); gtao.setSize = (w, h) => ss(Math.round(w / 2), Math.round(h / 2)); } gtao.blendIntensity = 0.8; gtao.updateGtaoMaterial({ radius: 1.2, distanceExponent: 1.5, thickness: 1.0, scale: 1.1, samples: 6 }); composer.addPass(gtao);
const bokeh = new BokehPass(SS.street, camera, { focus: 10, aperture: 0.0009, maxblur: 0.005 }); composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.2, 0.5, 0.9); composer.addPass(bloom); composer.addPass(new OutputPass());
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, vig: { value: 0.3 }, sat: { value: 1.12 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse; uniform float vig, sat; varying vec2 vUv; void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; float l=dot(c,vec3(0.299,0.587,0.114)); c=mix(vec3(l),c,sat); vec2 d=(vUv-0.5)*vec2(1.0,0.8); c*=clamp(1.0-vig*dot(d,d)*2.2,0.0,1.0); gl_FragColor=vec4(c,1.0); }' }); composer.addPass(grade);
// ---- camera helpers: push-in ~5%/s (distance shrinks), eased; punch-in on a beat
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function shot(x, target, dir, dist, fov = 40, o = {}) { const k = eio(x.u); const d = dist * (1 - (o.push ?? 0.05) * x.d * k); const P = target.clone().add(dir.clone().normalize().multiplyScalar(d)).add(V(0, o.up ?? 0, 0)); if (o.drift) P.addScaledVector(V(1, 0, 0), o.drift * (k - 0.5));
  camera.position.copy(P); camera.lookAt(target); camera.fov = fov; if (o.punch != null) camera.fov *= 1 - 0.12 * eo(seg(x.L, o.punch, o.punch + 0.25)); x.focus = d; }
const head = c => { c.root.updateMatrixWorld(true); return c.head.localToWorld(V(0, 0.66, 0.3)); };
// ---- shots
const SH = []; const at = (t, fn) => SH.push({ t, fn });
const ST = () => SS.street.userData.st; const HX = () => { const h = ST().houses[3]; return h.group.position.x + h.door.group.position.x; };
at(0.0, x => { const s = SS.street; const c = hero; s.add(c.root); x.live.push(c); const X = HX() + 6; walkPath(c, x.L, -0.4, 1.9, [X, 2.6], [X, 5.2], { stride: 2.4 }); c.setFace({ eyes: 'happy', mouth: 'grin' });
  shot(x, V(X, 3.8, 4.6), V(0.12, 0.08, 1), 16, 40, { push: 0.06 }); return s; });
at(1.6, x => { const s = SS.street; const c = hero; s.add(c.root); x.live.push(c); const X = HX() + 6; c.root.position.set(X, 0, 4.8); c.root.rotation.y = 0.15; alive(c, x.t, 1, 2); pose15(c, 'think', gestW(x.L, 0.15, 99), x.t);
  shot(x, head(c).add(V(0, -0.6, 0)), V(0.25, 0.02, 1), 8.5, 40, { push: 0.05 }); return s; });
at(3.0, x => { const s = SS.bed; const ck = s.userData.clock; ck.set(2, x.L * 40); ck.updateMatrixWorld(true); const p = ck.getWorldPosition(V(0, 0, 0)); shot(x, p, V(0.12, -0.05, 1), 4.6, 40, { push: 0.07 }); return s; });
at(4.2, x => { const s = SS.bed; const r = s.userData.room; r.doors.quarto.set(sm(seg(x.L, -0.25, 0.45))); const c = girl; s.add(c.root); x.live.push(c); walkPath(c, x.L, 0.25, 1.6, [16.5, 2], [6.5, 2.2], { stride: 2.2 }); c.setFace({ anime: true, eyeColor: '#3aa8e8', lashes: true, mouth: 'smile' });
  const k = eio(x.u); camera.position.set(mix(1.5, 2.6, k), 5.0, mix(10.5, 9.5, k)); camera.lookAt(mix(13.2, 7.6, k), 4.0, 2); camera.fov = 42; x.focus = 9; return s; });
at(5.8, x => { const s = SS.bed; s.userData.room.doors.quarto.set(1); const c = girl; s.add(c.root); x.live.push(c); c.root.position.set(6.5, 0, 2.2); c.root.rotation.y = -1.1; alive(c, x.t, 1, 3); c.root.rotation.y = mix(-1.3, -0.35, sm(seg(x.L, 0, 0.5)));
  startle(c, x.L, 0.35, 0.5); pose15(c, 'scared', gestW(x.L, 0.35, 99), x.t); shot(x, head(c).add(V(0, -0.5, 0)), V(0.15, 0.0, 1), 6.5, 40, { push: 0.05, punch: 0.4 }); return s; });
at(7.2, x => { const s = SS.bed; const c = hero; s.add(c.root); x.live.push(c); c.root.position.set(-1.5, 0, 3); c.root.rotation.y = 0.3; alive(c, x.t, 1, 2); pose15(c, 'laugh', gestW(x.L, 0.1, 99), x.t);
  shot(x, head(c).add(V(0, -0.8, 0)), V(0.3, 0.05, 1), 8.0, 40, { push: 0.06 }); return s; });
at(8.6, x => { const s = SS.school; const r = s.userData.room; r.doors.sala.set(sm(seg(x.L, 0.5, 1.1))); const c = boy; s.add(c.root); x.live.push(c); walkPath(c, x.L, 0.0, 1.9, [-2, 3], [8, -6.5], { stride: 2.3 });
  shot(x, V(mix(2, 6, eio(x.u)), 4.6, -3), V(-0.45, 0.06, 1), 17, 42, { push: 0.04 }); return s; });
at(10.2, x => { const s = SS.school; s.userData.room.doors.sala.set(0); const c = boy; s.add(c.root); x.live.push(c); c.root.position.set(1, 0, 1); c.root.rotation.y = 0.2; alive(c, x.t, 1, 4); pose15(c, 'crossArms', gestW(x.L, 0.15, 99), x.t);
  shot(x, head(c).add(V(0, -0.9, 0)), V(-0.2, 0.05, 1), 8.0, 40, { push: 0.05 }); return s; });
at(11.6, x => { const s = SS.street; const X = HX(); const cs = [[girl, X - 4.0, 'cheer', 0.15], [hero, X, 'hips', 0.0], [boy, X + 4.0, 'cheer', 0.3]];
  for (const [c, px, p, a] of cs) { s.add(c.root); x.live.push(c); c.root.position.set(px, 0, 4.2); c.root.rotation.y = (X - px) * 0.04; alive(c, x.t, 1, px); pose15(c, p, gestW(x.L, a, 99), x.t); }
  shot(x, V(X, 5.2, 4.2), V(0, 0.1, 1), 21, 42, { push: -0.05 }); return s; });
const DUR = 13.2;
window.APP = { ready: true, duration: DUR, renderAt(t) { let i = SH.length - 1; while (i > 0 && SH[i].t > t) i--; const sh = SH[i]; const end = i + 1 < SH.length ? SH[i + 1].t : DUR;
  const run = () => { for (const c of ALL) { c.root.removeFromParent(); c.reset(); c.root.position.set(0, 0, 0); c.root.rotation.set(0, 0, 0); } const x = { t, L: t - sh.t, d: end - sh.t, live: [] }; x.u = Math.min(1, x.L / x.d); const s = sh.fn(x); return { s, x }; };
  run(); const { s, x } = run(); for (const c of ALL) c.applyFace(); obstacleCheck(t, s, x.live); camera.aspect = W / H; cameraCheck(t, s, camera, x.live);
  if (window.NORENDER) return; camera.aspect = W / H; camera.updateProjectionMatrix(); rp.scene = s; gtao.scene = s; bokeh.scene = s; bokeh.uniforms.focus.value = x.focus || 10; composer.render(); } };
