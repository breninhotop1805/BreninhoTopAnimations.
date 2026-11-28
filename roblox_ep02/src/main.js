// EP02 "Amigo imaginário" — engine: post (GTAO + bokeh + bloom + grade w/ sepia/flash/fade), KOMIKAX subtitles, 2-pass camera, QA every frame.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadBodies } from './realbody.js';
import { loadFonts, charCheck, obstacleCheck, cameraCheck } from './kit.js';
import { loadSubFont, drawSubs } from './subs.js';
import { buildCast } from './cast.js';
import { buildSets } from './sets.js';
import { bolota, unicorn, counter } from './props.js';
import { makeShots, RED_WORDS } from './shots.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
await loadFonts(); await loadSubFont(); await loadBodies();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 700);
const C = buildCast(); const S = buildSets();
// ---- props / imaginary friends
const P = { bol: bolota(), uni: unicorn(), cnt: counter(), minis: ['#b06aff', '#f4c03a', '#3ab04a', '#ff7aa8', '#e8743a'].map((c, i) => { const b = bolota(c, { name: 'mini' + i }); b.userData.mini = 0.42; return b; }) };
// ---- FX sprites (kept OUT of the AO pass)
const spriteTex = (draw, s = 128) => { const c = document.createElement('canvas'); c.width = c.height = s; draw(c.getContext('2d'), s); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const sparkTex = spriteTex((g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); g.fillStyle = '#ffffff'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = i % 2 ? s * 0.06 : s * 0.42; g.lineTo(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r); } g.fill(); });
const bubbleTex = sym => spriteTex((g, s) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(s / 2, s * 0.44, s * 0.38, 0, 7); g.fill(); g.beginPath(); g.moveTo(s * 0.42, s * 0.75); g.lineTo(s * 0.36, s * 0.96); g.lineTo(s * 0.6, s * 0.78); g.fill(); g.lineWidth = s * 0.05; g.strokeStyle = '#111'; g.beginPath(); g.arc(s / 2, s * 0.44, s * 0.38, 0, 7); g.stroke();
  g.fillStyle = sym === '!' ? '#e8282a' : '#2a62d8'; g.font = `${s * 0.5}px Komikax`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sym, s / 2, s * 0.47); }, 256);
const zTex = spriteTex((g, s) => { g.font = `${s * 0.8}px Komikax`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = s * 0.1; g.strokeStyle = '#ffffff'; g.strokeText('Z', s / 2, s / 2); g.fillStyle = '#8a3ad8'; g.fillText('Z', s / 2, s / 2); });
const SP = (tex, o = {}) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: o.depthTest ?? true, color: o.color || '#ffffff', toneMapped: o.toneMapped ?? true, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending })); if (o.order) m.renderOrder = o.order; return m; };
const FX = { q: SP(bubbleTex('?'), { depthTest: false, order: 20 }), ex: SP(bubbleTex('!'), { depthTest: false, order: 20 }), zzz: new THREE.Group(), sparks: new THREE.Group(), dust: new THREE.Group(), leaves: new THREE.Group(), glow: SP(sparkTex, { add: true, toneMapped: false, color: '#9ad0ff' }) };
for (let i = 0; i < 3; i++) { const z = SP(zTex); z.userData.ph = i / 3; FX.zzz.add(z); }
for (let i = 0; i < 40; i++) { const h = SP(sparkTex, { add: true, toneMapped: false, color: i % 3 ? '#9ad8ff' : '#fff2a0' }); h.userData.ph = (i * 0.618) % 1; h.userData.a = i * 2.4; h.userData.r = 0.4 + ((i * 0.37) % 1); FX.sparks.add(h); }
for (let i = 0; i < 26; i++) { const h = SP(sparkTex, { add: true, toneMapped: false, color: '#b8e0ff' }); h.userData.ph = (i * 0.618) % 1; h.userData.a = i * 2.4; FX.dust.add(h); }
for (let i = 0; i < 40; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), new THREE.MeshStandardMaterial({ color: ['#e8743a', '#f4c03a', '#c83a2a'][i % 3], side: THREE.DoubleSide })); l.userData.ph = (i * 0.618) % 1; l.userData.a = i * 1.7; FX.leaves.add(l); }
// ---- post
const composer = new EffectComposer(renderer); const rp = new RenderPass(S.street, camera); composer.addPass(rp);
const gtao = new GTAOPass(S.street, camera, W, H); { const ov = gtao.overrideVisibility.bind(gtao); gtao.overrideVisibility = function () { ov(); this.scene.traverse(o => { if (o.isSprite || o.name === 'ceu' || (o.isMesh && o.material && o.material.transparent && o.material.opacity < 0.97)) o.visible = false; }); }; }
{ const ss = gtao.setSize.bind(gtao); gtao.setSize = (w, h) => ss(Math.round(w / 2), Math.round(h / 2)); } gtao.blendIntensity = 0.8; gtao.updateGtaoMaterial({ radius: 1.2, distanceExponent: 1.5, thickness: 1.0, scale: 1.1, samples: 6 }); composer.addPass(gtao);
const bokeh = new BokehPass(S.street, camera, { focus: 10, aperture: 0.0009, maxblur: 0.005 }); composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.2, 0.5, 0.9); composer.addPass(bloom); composer.addPass(new OutputPass());
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, vig: { value: 0.3 }, sat: { value: 1.12 }, sepia: { value: 0 }, flash: { value: 0 }, fade: { value: 0 }, tint: { value: new THREE.Vector3(1, 1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float vig, sat, sepia, flash, fade; uniform vec3 tint; varying vec2 vUv;
    void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; float l=dot(c,vec3(0.299,0.587,0.114)); c=mix(vec3(l),c,sat); c=mix(c, vec3(l*1.1,l*0.94,l*0.74), sepia); c*=tint;
      vec2 d=(vUv-0.5)*vec2(1.0,0.8); c*=clamp(1.0-(vig+0.25*sepia)*dot(d,d)*2.2,0.0,1.0); c=mix(c,vec3(1.0),flash); c*=1.0-fade; gl_FragColor=vec4(c,1.0); }` }); composer.addPass(grade);
const uiCanvas = document.createElement('canvas'); uiCanvas.width = W; uiCanvas.height = H; const ui = uiCanvas.getContext('2d'); const uiTex = new THREE.CanvasTexture(uiCanvas);
const uiPass = new ShaderPass({ uniforms: { tDiffuse: { value: null }, tUI: { value: uiTex } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse, tUI; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); vec4 u = texture2D(tUI, vUv); gl_FragColor = vec4(c.rgb*(1.0-u.a) + u.rgb, 1.0); }' }); uiPass.uniforms.tUI.value = uiTex; composer.addPass(uiPass);
// ---- subtitles
const WJ = await (await fetch('/assets/words.json')).json(); const clean = s => s.replace(/[.,;:!?]+$/g, '').replace(/^-/, '');
const WORDS = []; WJ.forEach((w, i) => { const t = clean(w[2]); if (!t) return; if (w[2].startsWith('-') && WORDS.length) { WORDS[WORDS.length - 1].w += '-' + t.toUpperCase(); return; } WORDS.push({ w: t.toUpperCase(), t0: w[0], t1: i + 1 < WJ.length ? Math.min(WJ[i + 1][0], w[1] + 0.35) : w[1] + 0.6, red: RED_WORDS.has(i) }); });
// ---- QA for the round friends (spheres) vs people parts / obstacles + their face framing
const _b = new THREE.Box3(), _c = new THREE.Vector3();
function blobQA(t, s, x) { let n = 0; const O = s.userData.obst || []; for (const B of x.blobs) { const o = B.obj; if (!o.parent || !o.visible) continue; o.updateMatrixWorld(true); const c = B.center(); const r = B.r;
    for (const ch of x.live) { if (!ch.root.visible || B.allow?.has(ch.name)) continue; ch.root.updateMatrixWorld(true); for (const pm of [ch.torsoMesh, ch.headMesh, ch.lowerTorso, ch.armR.mesh, ch.armL.mesh, ch.armR.lower, ch.armL.lower, ch.armR.handMesh, ch.armL.handMesh, ch.legR.mesh, ch.legL.mesh, ch.legR.lower, ch.legL.lower, ch.legR.foot, ch.legL.foot]) { if (!pm) continue; _b.setFromObject(pm).expandByScalar(-0.06); if (_b.distanceToPoint(c) < r * 0.93) { n++; console.log(`LOG ATRAVESSA t=${t.toFixed(2)} ${o.name} x ${ch.name}`); break; } } }
    for (const ob of O) { if (B.allowObst?.has(ob.name)) continue; ob.obj.updateMatrixWorld(true); const box = ob.dyn ? _b.setFromObject(ob.obj) : (ob.box ||= new THREE.Box3().setFromObject(ob.obj)); if (box.distanceToPoint(c) < r * 0.9) { n++; console.log(`LOG ATRAVESSA t=${t.toFixed(2)} ${o.name} x ${ob.name}`); } }
    if (B.face && !B.noFrame) { const f = B.face().project(camera); if (f.z > 1 || Math.abs(f.x) > 0.95 || f.y > 0.95 || f.y < -0.92) { n++; console.log(`LOG FORA_DO_QUADRO t=${t.toFixed(2)} ${o.name} ndc=${f.x.toFixed(2)},${f.y.toFixed(2)}`); } } } return n; }
// ---- shots
const ctx = { THREE, C, S, P, FX, camera, grade: grade.uniforms, bloom, bokeh };
const { SHOTS, DUR } = makeShots(ctx);
function resetWorld() { for (const c of C.all) { c.root.removeFromParent(); c.reset(); c.root.position.set(0, 0, 0); c.root.rotation.set(0, 0, 0); c.root.visible = true; c.noCollide = null; c.allowObst = null; c.noFrame = false; c.noQA = false; }
  for (const b of [P.bol, ...P.minis]) { b.removeFromParent(); b.reset(); if (b.userData.mini) b.scale.setScalar(b.userData.mini); } for (const o of [P.uni, P.cnt]) { o.removeFromParent(); o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.setScalar(1); }
  for (const o of Object.values(FX)) { o.removeFromParent(); o.visible = true; o.scale.setScalar(1); o.rotation.set(0, 0, 0); if (o.material) o.material.opacity = 1; o.children?.forEach(k => { k.visible = true; if (k.material) k.material.opacity = 1; }); }
  if (S.plaza.userData.setTime) S.plaza.userData.setTime(0); const G = grade.uniforms; G.vig.value = 0.3; G.sat.value = 1.12; G.sepia.value = 0; G.flash.value = 0; G.fade.value = 0; G.tint.value.set(1, 1, 1); bloom.strength = 0.2; bokeh.uniforms.aperture.value = 0.0009; camera.fov = 40; camera.up.set(0, 1, 0); }
let qaCount = 0;
function renderAt(t) { let i = SHOTS.length - 1; while (i > 0 && SHOTS[i].t > t) i--; const sh = SHOTS[i]; const end = i + 1 < SHOTS.length ? SHOTS[i + 1].t : DUR;
  const run = () => { resetWorld(); const x = { t, L: t - sh.t, d: end - sh.t, live: [], blobs: [], focus: null }; x.u = Math.min(1, x.L / x.d); const s = sh.fn(x); return { s, x }; };
  run(); const cp = camera.position.clone(), cq = camera.quaternion.clone(), cf = camera.fov; const { s, x } = run(); camera.position.copy(cp); camera.quaternion.copy(cq); camera.fov = cf;
  for (const c of C.all) c.applyFace(); camera.aspect = W / H; camera.updateProjectionMatrix();
  if (!sh.noQA) { const L = x.live.filter(c => !c.noQA); qaCount += charCheck(t, L) + obstacleCheck(t, s, L) + cameraCheck(t, s, camera, L.filter(c => !c.noFrame)) + blobQA(t, s, x); }
  if (window.NORENDER) return; rp.scene = s; gtao.scene = s; bokeh.scene = s; bokeh.uniforms.focus.value = x.focus || 10; ui.clearRect(0, 0, W, H); drawSubs(ui, W, H, WORDS, t); uiTex.needsUpdate = true; composer.render(); }
window.APP = { ready: true, duration: DUR, renderAt, shots: SHOTS.map(s => [s.t, s.name]), qa: () => qaCount };
