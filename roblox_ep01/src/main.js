import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildStreet } from './sets.js';
import { buildHome, buildBedroom, buildBakery, buildBank, buildHospital, iceCart, terminal, cup, bread, iceCream, stickerPack } from './sets2.js';
import { buildCast } from './cast.js';
import { makeHolo, makeStream } from './watch.js';
import { loadSubFont, drawSubs } from './subs.js';
import { SHOTS, DURATION, RED } from './shots.js';

const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 300);
await loadSubFont();
const S = {}; buildStreet(S); buildStreet(S, { night: true, name: 'streetNight' }); buildHome(S); buildHome(S, { night: true, name: 'homeNight' }); buildBedroom(S); buildBedroom(S, { night: true, name: 'bedNight' }); buildBakery(S); buildBank(S); buildHospital(S);
S.cart = iceCart(S.street.children[0], 5.0, 2.2); S.term = terminal(S.street.children[0], -3.2, 1.2);
const C = buildCast();
// ---------- FX + props ----------
const FX = { holo: makeHolo(), holo2: makeHolo(), stream: makeStream(28), stream2: makeStream(40), cup: cup(), coffee: cup('#3a2a20', '#2a160a'), bread: bread(), ice: iceCream(), pack: stickerPack('#e8282a'), pack2: stickerPack('#2a6ae8'), pack3: stickerPack('#f4c84a') };
const spriteTex = (draw, s = 128) => { const c = document.createElement('canvas'); c.width = c.height = s; draw(c.getContext('2d'), s); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const heartTex = spriteTex((g, s) => { g.fillStyle = '#ff4a7a'; g.beginPath(); g.moveTo(s / 2, s * 0.85); g.bezierCurveTo(s * 0.05, s * 0.55, s * 0.15, s * 0.1, s / 2, s * 0.32); g.bezierCurveTo(s * 0.85, s * 0.1, s * 0.95, s * 0.55, s / 2, s * 0.85); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(s * 0.33, s * 0.35, s * 0.08, s * 0.05, -0.6, 0, 7); g.fill(); });
const sparkTex = spriteTex((g, s) => { g.fillStyle = '#fff6b0'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = i % 2 ? s * 0.12 : s * 0.48; g.lineTo(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r); } g.fill(); });
const bubbleTex = sym => spriteTex((g, s) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(s / 2, s * 0.44, s * 0.38, 0, 7); g.fill(); g.beginPath(); g.moveTo(s * 0.42, s * 0.75); g.lineTo(s * 0.36, s * 0.96); g.lineTo(s * 0.6, s * 0.78); g.fill(); g.lineWidth = s * 0.05; g.strokeStyle = '#111'; g.beginPath(); g.arc(s / 2, s * 0.44, s * 0.38, 0, 7); g.stroke();
  g.fillStyle = sym === '!' ? '#e8282a' : '#2a62d8'; g.font = `${s * 0.5}px Komikax`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sym, s / 2, s * 0.47); });
FX.q = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex('?'), depthTest: false, depthWrite: false, transparent: true })); FX.ex = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex('!'), depthTest: false, depthWrite: false, transparent: true })); FX.q.renderOrder = FX.ex.renderOrder = 20;
FX.hearts = new THREE.Group(); for (let i = 0; i < 9; i++) { const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true, depthWrite: false })); h.userData.ph = i / 9; FX.hearts.add(h); }
FX.sparks = new THREE.Group(); for (let i = 0; i < 22; i++) { const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex, transparent: true, depthWrite: false, color: '#ffe680', toneMapped: false })); h.userData.ph = (i * 0.618) % 1; h.userData.a = i * 2.4; FX.sparks.add(h); }
FX.calPages = new THREE.Group(); for (let i = 0; i < 10; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.9), new THREE.MeshStandardMaterial({ color: '#f8f6f0', side: THREE.DoubleSide })); p.userData.ph = i / 10; FX.calPages.add(p); }

// ---------- post ----------
const composer = new EffectComposer(renderer); const renderPass = new RenderPass(S.street, camera); composer.addPass(renderPass);
const gtao = new GTAOPass(S.street, camera, W, H); { const ov = gtao.overrideVisibility.bind(gtao); gtao.overrideVisibility = function () { ov(); this.scene.traverse(o => { if (o.isSprite) o.visible = false; }); }; } gtao.blendIntensity = 0.8; gtao.updateGtaoMaterial({ radius: 0.8, distanceExponent: 1.5, thickness: 1.0, scale: 1.1, samples: 12 }); composer.addPass(gtao);
const bokeh = new BokehPass(S.street, camera, { focus: 8, aperture: 0.0010, maxblur: 0.005 }); composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.22, 0.5, 0.9); composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, vig: { value: 0.35 }, sat: { value: 1.12 }, fade: { value: 0 }, flash: { value: 0 }, sepia: { value: 0 }, tint: { value: new THREE.Vector3(1, 1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float vig, sat, fade, flash, sepia; uniform vec3 tint; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(0.299,0.587,0.114)); c = mix(vec3(l), c, sat); c = mix(c, vec3(l*1.08, l*0.95, l*0.78), sepia); c *= tint;
      vec2 d = (vUv-0.5)*vec2(1.0,0.8); c *= clamp(1.0 - vig*dot(d,d)*2.2, 0.0, 1.0); c = mix(c, vec3(1.0), flash); c *= 1.0 - fade; gl_FragColor = vec4(c,1.0); }` });
composer.addPass(grade);
const uiCanvas = document.createElement('canvas'); uiCanvas.width = W; uiCanvas.height = H; const ui = uiCanvas.getContext('2d'); const uiTex = new THREE.CanvasTexture(uiCanvas);
const uiPass = new ShaderPass({ uniforms: { tDiffuse: { value: null }, tUI: { value: uiTex } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse, tUI; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); vec4 u = texture2D(tUI, vUv); gl_FragColor = vec4(c.rgb*(1.0-u.a) + u.rgb, 1.0); }' });
uiPass.uniforms.tUI.value = uiTex; composer.addPass(uiPass);

// ---------- subtitles from the transcript (one word at a time, key words red) ----------
const WJ = await (await fetch('/assets/words.json')).json(); const clean = s => s.replace(/[.,;:]+$/g, '');
const WORDS = WJ.map((w, i) => ({ w: clean(w[2]), t0: w[0], t1: i + 1 < WJ.length ? Math.min(WJ[i + 1][0], w[1] + 0.35) : w[1] + 0.5, red: RED.has(i) }));

// ---------- collision check: body parts (AABB) of every live character vs every other live character ----------
const _a = new THREE.Box3(), _b = new THREE.Box3();
function parts(c) { const out = [c.torsoMesh, c.headMesh, c.armR.mesh, c.armL.mesh, c.legR.mesh, c.legL.mesh]; if (c.armR.handMesh) out.push(c.armR.handMesh, c.armL.handMesh); return out; }
function collisionCheck(t, live) { for (const c of live) c.root.updateMatrixWorld(true); for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) { const A = live[i], Bc = live[j]; if (A.root.parent !== Bc.root.parent || !A.root.visible || !Bc.root.visible) continue;
  if (A.noCollide?.has(Bc.name) || Bc.noCollide?.has(A.name)) continue;
  for (const pa of parts(A)) { _a.setFromObject(pa).expandByScalar(-0.06); for (const pb of parts(Bc)) { _b.setFromObject(pb).expandByScalar(-0.06); if (_a.intersectsBox(_b)) { const ca = _a.getCenter(new THREE.Vector3()), cb = _b.getCenter(new THREE.Vector3()); console.log(`LOG ATRAVESSA t=${t.toFixed(2)} ${A.name} x ${Bc.name} [${ca.toArray().map(v => v.toFixed(1))}] [${cb.toArray().map(v => v.toFixed(1))}] ${_a.getSize(new THREE.Vector3()).toArray().map(v => v.toFixed(1))}`); return; } } } } }

const ctx = { THREE, C, S, FX, camera };
function resetWorld() { if (S.doorLight) S.doorLight.target.position.set(4, 1.5, -1); for (const c of Object.values(C)) { c.reset(); c.root.removeFromParent(); c.root.visible = true; c.root.position.set(0, 0, 0); c.root.rotation.set(0, 0, 0); c.root.rotation.order = 'XYZ'; c.noCollide = null; if (c.watch) c.watch.visible = true; }
  C.mae.setGray(0); for (const o of Object.values(FX)) { if (o.isObject3D) { o.removeFromParent(); o.visible = true; o.scale.setScalar(1); o.rotation.set(0, 0, 0); } }
  S.bedDoor(0); if (S.incDome) S.incDome.position.y = 3.1; S.doorLight.intensity = 0; S.bedClock('03:00'); camera.fov = 40; camera.up.set(0, 1, 0);
  const G = grade.uniforms; G.vig.value = 0.35; G.sat.value = 1.12; G.fade.value = 0; G.flash.value = 0; G.sepia.value = 0; G.tint.value.set(1, 1, 1); bloom.strength = 0.22; bokeh.uniforms.aperture.value = 0.0010; }
function renderAt(t) { let i = SHOTS.length - 1; while (i > 0 && SHOTS[i].t > t) i--; const shot = SHOTS[i]; const end = i + 1 < SHOTS.length ? SHOTS[i + 1].t : DURATION; const L = t - shot.t, d = end - shot.t;
  const run = () => { resetWorld(); const out = { scene: S.street, focus: null }; const live = []; shot.fn(Object.assign(ctx, { t, L, d, u: Math.min(1, L / d), out, live, grade: grade.uniforms, bloom })); return { out, live }; };
  run(); const cp = camera.position.clone(), cq = camera.quaternion.clone(), cf = camera.fov; const { out, live } = run(); camera.position.copy(cp); camera.quaternion.copy(cq); camera.fov = cf;
  for (const c of Object.values(C)) c.applyFace(); collisionCheck(t, live); if (window.NORENDER) return;
  camera.aspect = W / H; camera.updateProjectionMatrix(); renderPass.scene = out.scene; gtao.scene = out.scene; bokeh.scene = out.scene;
  bokeh.uniforms.focus.value = out.focus ?? 8; ui.clearRect(0, 0, W, H); drawSubs(ui, W, H, WORDS, t); uiTex.needsUpdate = true; composer.render(); }
window.APP = { ready: true, duration: DURATION, renderAt, shots: SHOTS.map(s => [s.t, s.name]) };
