// EP04 "Na minha escola" — engine: post (GTAO + bokeh + bloom + grade w/ flash/fade/tint), KOMIKAX subtitles, 2-pass camera, full QA every frame
// (characters, obstacles, camera framing/occlusion, VISIBLE flicker, camera inside objects).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadBodies } from './realbody.js';
import { loadFonts, charCheck, obstacleCheck, cameraCheck, sceneCheck, flickerCheck, cameraInsideCheck } from './kit.js';
import { loadSubFont, drawSubs } from './subs.js';
import { buildCast } from './cast.js';
import { buildSets } from './sets.js';
import { makeShots } from './shots.js';
import { beanie, bouquet, chalk, sandwich, gavel } from './props4.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.86; document.body.appendChild(renderer.domElement);
await loadFonts(); await loadSubFont(); await loadBodies();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 700); 
const C = buildCast(); const S = buildSets();
// ---- hand props (re-parented each frame by the shots; marked dyn = not part of the static scene scan)
const P = { chalk: chalk(), chalk2: chalk(), bouquet: bouquet(), beanieG: beanie('#e84a6a', '#f4f4f0', '#ffffff'), beanieN: beanie('#2a4ab8', '#1a2a6a', '#f4f4f0'), gavel: gavel(), sand: [sandwich(), sandwich(), sandwich(), sandwich()] };
for (const o of Object.values(P).flat()) o.traverse(m => { m.userData.dyn = true; m.userData.noOcc = true; if (m.isMesh) { m.castShadow = true; } });
// ---- portraits for the suspects board (real renders of the 3 green-eyed characters)
{ const rt = (c, bg) => { const sc = new THREE.Scene(); sc.background = new THREE.Color(bg); sc.add(new THREE.HemisphereLight('#ffffff', '#8a7a6a', 1.6)); const k = new THREE.DirectionalLight('#fff1dc', 2.2); k.position.set(2, 4, 6); sc.add(k); c.reset(); sc.add(c.root); c.applyFace(); c.root.updateMatrixWorld(true);
    const hp = c.headMesh.getWorldPosition(new THREE.Vector3()); const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50); cam.position.set(hp.x, hp.y - 0.1, hp.z + 4.6); cam.lookAt(hp.x, hp.y - 0.35, hp.z); const T = new THREE.WebGLRenderTarget(256, 256, { colorSpace: THREE.SRGBColorSpace }); T.texture.colorSpace = THREE.SRGBColorSpace;
    renderer.setRenderTarget(T); renderer.render(sc, cam); renderer.setRenderTarget(null); c.root.removeFromParent(); return T.texture; };
  const ph = S.school.userData.board.userData.photos; [[C.B, '#f4c03a'], [C.DIR, '#7ad0f4'], [C.G, '#ff9ac8']].forEach(([c, bg], i) => { const m = ph[i].userData.photo.material; m.map = rt(c, bg); m.color.set('#ffffff'); m.needsUpdate = true; }); }
// ---- FX sprites (kept OUT of the AO pass)
const spriteTex = (draw, s = 128) => { const c = document.createElement('canvas'); c.width = c.height = s; draw(c.getContext('2d'), s); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const sparkTex = spriteTex((g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); g.fillStyle = '#ffffff'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = i % 2 ? s * 0.06 : s * 0.42; g.lineTo(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r); } g.fill(); });
const bubbleTex = sym => spriteTex((g, s) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(s / 2, s * 0.44, s * 0.38, 0, 7); g.fill(); g.beginPath(); g.moveTo(s * 0.42, s * 0.75); g.lineTo(s * 0.36, s * 0.96); g.lineTo(s * 0.6, s * 0.78); g.fill(); g.lineWidth = s * 0.05; g.strokeStyle = '#111'; g.beginPath(); g.arc(s / 2, s * 0.44, s * 0.38, 0, 7); g.stroke();
  g.fillStyle = sym === '!' ? '#e8282a' : '#2a62d8'; g.font = `${s * 0.5}px Komikax`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sym, s / 2, s * 0.47); }, 256);
const heartTex = spriteTex((g, s) => { g.fillStyle = '#ff3a7a'; g.strokeStyle = '#ffffff'; g.lineWidth = s * 0.06; g.beginPath(); const x = s / 2, y = s * 0.3; g.moveTo(x, s * 0.85); g.bezierCurveTo(s * 0.02, s * 0.5, s * 0.12, s * 0.08, x, y); g.bezierCurveTo(s * 0.88, s * 0.08, s * 0.98, s * 0.5, x, s * 0.85); g.closePath(); g.stroke(); g.fill(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(s * 0.33, s * 0.33, s * 0.08, s * 0.05, -0.6, 0, 7); g.fill(); });
const dotsTex = spriteTex((g, s) => { g.fillStyle = '#fff'; g.beginPath(); g.roundRect(s * 0.08, s * 0.22, s * 0.84, s * 0.46, s * 0.2); g.fill(); g.beginPath(); g.moveTo(s * 0.36, s * 0.66); g.lineTo(s * 0.3, s * 0.86); g.lineTo(s * 0.52, s * 0.67); g.fill(); g.lineWidth = s * 0.04; g.strokeStyle = '#111'; g.beginPath(); g.roundRect(s * 0.08, s * 0.22, s * 0.84, s * 0.46, s * 0.2); g.stroke(); g.fillStyle = '#111'; for (const k of [-1, 0, 1]) { g.beginPath(); g.arc(s / 2 + k * s * 0.2, s * 0.45, s * 0.06, 0, 7); g.fill(); } }, 256);
const zTex = spriteTex((g, s) => { g.font = `${s * 0.8}px Komikax`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = s * 0.1; g.strokeStyle = '#ffffff'; g.strokeText('Z', s / 2, s / 2); g.fillStyle = '#8a3ad8'; g.fillText('Z', s / 2, s / 2); });
const SP = (tex, o = {}) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: o.depthTest ?? true, color: o.color || '#ffffff', toneMapped: o.toneMapped ?? true, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending })); if (o.order) m.renderOrder = o.order; return m; };
const FX = { q: SP(bubbleTex('?'), { depthTest: false, order: 20 }), ex: SP(bubbleTex('!'), { depthTest: false, order: 20 }), zzz: new THREE.Group(), sparks: new THREE.Group(), dust: new THREE.Group(), leaves: new THREE.Group(), glow: SP(sparkTex, { add: true, toneMapped: false, color: '#9ad0ff' }), dots: SP(dotsTex, { depthTest: false, order: 20 }), hearts: new THREE.Group(), conf: new THREE.Group() };
for (let i = 0; i < 14; i++) { const h = SP(heartTex); h.userData.ph = (i * 0.618) % 1; h.userData.a = i * 2.4; FX.hearts.add(h); }
for (let i = 0; i < 60; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.18), new THREE.MeshStandardMaterial({ color: ['#e8283a', '#f4c03a', '#3ab04a', '#2a8ad8', '#ff5ab0', '#b84ae8'][i % 6], side: THREE.DoubleSide })); l.userData.ph = (i * 0.618) % 1; l.userData.a = i * 1.7; l.userData.dyn = true; FX.conf.add(l); }
for (const g of Object.values(FX)) g.traverse(o => { o.userData.dyn = true; });
for (let i = 0; i < 3; i++) { const z = SP(zTex); z.userData.ph = i / 3; FX.zzz.add(z); }
for (let i = 0; i < 40; i++) { const h = SP(sparkTex, { add: true, toneMapped: false, color: i % 3 ? '#9ad8ff' : '#fff2a0' }); h.userData.ph = (i * 0.618) % 1; h.userData.a = i * 2.4; h.userData.r = 0.4 + ((i * 0.37) % 1); FX.sparks.add(h); }
for (let i = 0; i < 26; i++) { const h = SP(sparkTex, { add: true, toneMapped: false, color: '#b8e0ff' }); h.userData.ph = (i * 0.618) % 1; h.userData.a = i * 2.4; FX.dust.add(h); }
for (let i = 0; i < 40; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), new THREE.MeshStandardMaterial({ color: ['#e8743a', '#f4c03a', '#c83a2a'][i % 3], side: THREE.DoubleSide })); l.userData.ph = (i * 0.618) % 1; l.userData.a = i * 1.7; FX.leaves.add(l); }
// ---- post
const composer = new EffectComposer(renderer); const rp = new RenderPass(S.school, camera); composer.addPass(rp);
const gtao = new GTAOPass(S.school, camera, W, H); { const ov = gtao.overrideVisibility.bind(gtao); gtao.overrideVisibility = function () { ov(); this.scene.traverse(o => { if (o.isSprite || o.name === 'ceu' || (o.isMesh && o.material && o.material.transparent && o.material.opacity < 0.97)) o.visible = false; }); }; }
{ const ss = gtao.setSize.bind(gtao); gtao.setSize = (w, h) => ss(Math.round(w / 2), Math.round(h / 2)); } gtao.blendIntensity = 0.8; gtao.updateGtaoMaterial({ radius: 1.2, distanceExponent: 1.5, thickness: 1.0, scale: 1.1, samples: 6 }); composer.addPass(gtao);
const bokeh = new BokehPass(S.school, camera, { focus: 10, aperture: 0.0009, maxblur: 0.005 }); composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.2, 0.5, 0.9); composer.addPass(bloom); composer.addPass(new OutputPass());
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, vig: { value: 0.3 }, sat: { value: 1.28 }, sepia: { value: 0 }, flash: { value: 0 }, fade: { value: 0 }, tint: { value: new THREE.Vector3(1, 1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float vig, sat, sepia, flash, fade; uniform vec3 tint; varying vec2 vUv;
    void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; float l=dot(c,vec3(0.299,0.587,0.114)); c=mix(vec3(l),c,sat); c=mix(c, vec3(l*1.1,l*0.94,l*0.74), sepia); c*=tint;
      vec2 d=(vUv-0.5)*vec2(1.0,0.8); c*=clamp(1.0-(vig+0.25*sepia)*dot(d,d)*2.2,0.0,1.0); c=mix(c,vec3(1.0),flash); c*=1.0-fade; gl_FragColor=vec4(c,1.0); }` }); composer.addPass(grade);
const uiCanvas = document.createElement('canvas'); uiCanvas.width = W; uiCanvas.height = H; const ui = uiCanvas.getContext('2d'); const uiTex = new THREE.CanvasTexture(uiCanvas);
const uiPass = new ShaderPass({ uniforms: { tDiffuse: { value: null }, tUI: { value: uiTex } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse, tUI; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); vec4 u = texture2D(tUI, vUv); gl_FragColor = vec4(c.rgb*(1.0-u.a) + u.rgb, 1.0); }' }); uiPass.uniforms.tUI.value = uiTex; composer.addPass(uiPass);
// ---- subtitles
const WJ = await (await fetch('/assets/words.json')).json(); const clean = s => s.replace(/[.,;:!?]+$/g, '').replace(/^-/, '');
const WORDS = []; WJ.forEach((w, i) => { const t = clean(w[2]); if (!t) return; if (w[2].startsWith('-') && WORDS.length) { WORDS[WORDS.length - 1].w += '-' + t.toUpperCase(); return; } WORDS.push({ w: t.toUpperCase(), t0: w[0], t1: i + 1 < WJ.length ? Math.min(WJ[i + 1][0], w[1] + 0.35) : w[1] + 0.6 }); });
// ---- QA for the round friends (spheres) vs people parts / obstacles + their face framing
const _b = new THREE.Box3(), _c = new THREE.Vector3();  // (kept: generic sphere QA for round props)
function blobQA(t, s, x) { let n = 0; const O = s.userData.obst || []; for (const B of x.blobs) { const o = B.obj; if (!o.parent || !o.visible) continue; o.updateMatrixWorld(true); const c = B.center(); const r = B.r;
    for (const ch of x.live) { if (!ch.root.visible || B.allow?.has(ch.name)) continue; ch.root.updateMatrixWorld(true); for (const pm of [ch.torsoMesh, ch.headMesh, ch.lowerTorso, ch.armR.mesh, ch.armL.mesh, ch.armR.lower, ch.armL.lower, ch.armR.handMesh, ch.armL.handMesh, ch.legR.mesh, ch.legL.mesh, ch.legR.lower, ch.legL.lower, ch.legR.foot, ch.legL.foot]) { if (!pm) continue; _b.setFromObject(pm).expandByScalar(-0.06); if (_b.distanceToPoint(c) < r * 0.93) { n++; console.log(`LOG ATRAVESSA t=${t.toFixed(2)} ${o.name} x ${ch.name}`); break; } } }
    for (const ob of O) { if (B.allowObst?.has(ob.name)) continue; ob.obj.updateMatrixWorld(true); const box = ob.dyn ? _b.setFromObject(ob.obj) : (ob.box ||= new THREE.Box3().setFromObject(ob.obj)); if (box.distanceToPoint(c) < r * 0.9) { n++; console.log(`LOG ATRAVESSA t=${t.toFixed(2)} ${o.name} x ${ob.name}`); } }
    if (B.face && !B.noFrame) { const f = B.face().project(camera); if (f.z > 1 || Math.abs(f.x) > 0.95 || f.y > 0.95 || f.y < -0.92) { n++; console.log(`LOG FORA_DO_QUADRO t=${t.toFixed(2)} ${o.name} ndc=${f.x.toFixed(2)},${f.y.toFixed(2)}`); } } } return n; }
// ---- shots
const ctx = { THREE, C, S, P, FX, camera, grade: grade.uniforms, bloom, bokeh, renderer };
const { SHOTS, DUR } = makeShots(ctx);
function resetWorld() { for (const c of C.all) { c.root.removeFromParent(); c.reset(); c.root.position.set(0, 0, 0); c.root.rotation.set(0, 0, 0); c.root.visible = true; c.noCollide = null; c.allowObst = null; c.noFrame = false; c.noQA = false; c.mirrorOnly = false; }
  for (const o of Object.values(P).flat()) { o.removeFromParent(); o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.setScalar(1); o.visible = true; }
  for (const sp of S.stage.userData.spots) { sp.sp.intensity = 0; sp.cone.material.opacity = 0; sp.disc.material.opacity = 0; } S.class.userData.chalk.set(1); S.lab.userData.year.set(2026); S.school.userData.thermo.set(1);
  for (const p of S.school.userData.board.userData.photos) { p.position.copy(p.userData.home ||= p.position.clone()); p.rotation.z = p.userData.rz ??= p.rotation.z; p.rotation.x = 0; p.visible = true; }
  for (const o of Object.values(FX)) { o.removeFromParent(); o.visible = true; o.scale.setScalar(1); o.rotation.set(0, 0, 0); if (o.material) o.material.opacity = 1; o.children?.forEach(k => { k.visible = true; if (k.material) k.material.opacity = 1; }); }
  const G = grade.uniforms; G.vig.value = 0.3; G.sat.value = 1.28; G.sepia.value = 0; G.flash.value = 0; G.fade.value = 0; G.tint.value.set(1, 1, 1); bloom.strength = 0.2; bokeh.uniforms.aperture.value = 0.0009; camera.fov = 40; camera.up.set(0, 1, 0); }
let qaCount = 0;
function renderAt(t) { let i = SHOTS.length - 1; while (i > 0 && SHOTS[i].t > t) i--; const sh = SHOTS[i]; const end = i + 1 < SHOTS.length ? SHOTS[i + 1].t : DUR;
  const run = () => { resetWorld(); const x = { t, L: t - sh.t, d: end - sh.t, live: [], blobs: [], focus: null }; x.u = Math.min(1, x.L / x.d); const s = sh.fn(x); return { s, x }; };
  const clampCam = s => { const r = s.userData.room; if (!r) return; const m = 0.8, inside = p => Math.abs(p.x) < r.W / 2 - m && Math.abs(p.z - (r.CZ || 0)) < r.D / 2 - m && p.y > 0.8 && p.y < r.H - 0.8; if (inside(camera.position)) return;
    const f = camera.getWorldDirection(new THREE.Vector3()); for (let k = 1; k < 400; k++) { const p = camera.position.clone().addScaledVector(f, k * 0.1); if (inside(p)) { camera.position.copy(p); window.CAMCLAMP = (window.CAMCLAMP || 0) + 1; return; } } };
  const r1 = run(); clampCam(r1.s); const cp = camera.position.clone(), cq = camera.quaternion.clone(), cf = camera.fov; const { s, x } = run(); camera.position.copy(cp); camera.quaternion.copy(cq); camera.fov = cf;
  for (const c of C.all) c.applyFace(); camera.aspect = W / H; camera.updateProjectionMatrix();
  if (!sh.noQA) { const L = x.live.filter(c => !c.noQA); const Lc = L.filter(c => !c.mirrorOnly); if (!s.userData.zchecked) { s.userData.zchecked = true; const roots = new Set(C.all.map(c => c.root)); sceneCheck(s, { quiet: true, debug: false, skip: m => { for (let p = m; p; p = p.parent) if (roots.has(p) || p.userData.dyn) return true; return false; } }); }
    qaCount += charCheck(t, L) + obstacleCheck(t, s, L) + cameraCheck(t, s, camera, L.filter(c => !c.noFrame)) + blobQA(t, s, x) + flickerCheck(t, s, camera) + cameraInsideCheck(t, s, camera); }
  if (window.NORENDER) return; rp.scene = s; gtao.scene = s; bokeh.scene = s; bokeh.uniforms.focus.value = x.focus || 10; ui.clearRect(0, 0, W, H); drawSubs(ui, W, H, WORDS, t); uiTex.needsUpdate = true; composer.render(); }
window.APP = { ready: true, duration: DUR, renderAt, shots: SHOTS.map(s => [s.t, s.name]), qa: () => qaCount };
