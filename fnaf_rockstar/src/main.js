import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadImage, imgToCanvas, Character, U, buildWilliam, buildSpring, addEndo, buildFreddy, makeGhost, recolorChild } from './skin.js';
import { addFace, blinkAt, FACES } from './face.js';
import { collisionCheck } from './act.js';
import { buildRockstar, fazCoin } from './rockstar.js';
import { buildOffice, buildStage6, buildFireRoom, drawPanel, rng } from './ucn.js';
import { SHOTS, DURATION } from './shots.js';

const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(42, W / H, 0.03, 80);

// ---------- assets ----------
const sk = {}; for (const n of ['rockstar', 'william', 'springtrap', 'child', 'goldenfreddy']) sk[n] = imgToCanvas(await loadImage(`/skins/${n}.png`));
const S = {}; buildOffice(S); buildStage6(S); buildFireRoom(S);

// ---------- characters: animatronics 1.35, William 1.0 (adult), kids 0.74 (ghosts) ----------
const KIDPAL = [{ shirt: '#d84a6a', accent: '#f2c230', pants: '#2a4a9a', hair: '#5a3a1a' }, { shirt: '#3a7ae8', accent: '#ffffff', pants: '#3a3a3a', hair: '#2a1a0a' }, { shirt: '#36c04a', accent: '#f2f2f2', pants: '#5a3a22', hair: '#c8902a' }, { shirt: '#f0a020', accent: '#ffffff', pants: '#3a2a5a', hair: '#7a3a1a' }, { shirt: '#9a5ad8', accent: '#ffffff', pants: '#2a2a2a', hair: '#3a2a1a' }];
const C = { rockstar: buildRockstar(sk.rockstar), william: buildWilliam(sk.william), spring: addEndo(buildSpring(sk.springtrap, 'springtrap', { bent: true, endo: true, clearJunk: true })),
  golden: makeGhost(buildFreddy(sk.goldenfreddy, { name: 'golden' }), '#ffd860') };
C.golden.name = 'golden'; C.william.baseScale = 1.0; C.spring.baseScale = 1.35; C.golden.baseScale = 1.35; C.golden.ghostMat.opacity = 0.55;
for (let i = 0; i < 5; i++) { C['soul' + i] = makeGhost(new Character('soul' + i, recolorChild(sk.child, KIDPAL[i])), ['#bfe8ff', '#ffd0e8', '#d0ffd8', '#fff0c0', '#e0d0ff'][i]); C['soul' + i].baseScale = 0.74; C['soul' + i].ghostMat.opacity = 0.6; }
addFace(C.william, FACES.william); addFace(C.spring, FACES.springtrap);
const BLINKERS = new Set(['william']);
for (const c of Object.values(C)) if (!c.baseScale) c.baseScale = 1;

// ---------- FX ----------
const FX = {};
FX.parts = (() => { const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: '#ffe8a0', transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false }); for (let i = 0; i < 40; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), m); b.userData.v = new THREE.Vector3(Math.cos(i * 2.4) * (0.4 + (i % 5) * 0.15), 0.3 + (i % 7) * 0.12, Math.sin(i * 2.4) * (0.4 + (i % 3) * 0.15)); g.add(b); }
  g.userData.update = (k, o) => { g.position.copy(o); m.opacity = 0.8 * (1 - k); g.children.forEach(b => { const v = b.userData.v; b.position.set(v.x * k, v.y * k * 1.5, v.z * k); }); }; return g; })();
FX.q = bubbleSprite('?'); FX.ex = bubbleSprite('!');
function bubbleSprite(sym) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.arc(32, 28, 24, 0, 7); g.fill(); g.beginPath(); g.moveTo(26, 48); g.lineTo(22, 62); g.lineTo(38, 50); g.fill();
  g.fillStyle = '#1a1a2a'; g.font = 'bold 34px "DejaVu Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sym, 32, 30); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: t, color: '#9a9aa4', transparent: true, toneMapped: false, depthTest: false })); m.renderOrder = 10; return m; }
FX.coins = []; for (let i = 0; i < 5; i++) FX['coin' + i] = fazCoin();
FX.rain = (() => { const g = new THREE.Group(); for (let i = 0; i < 40; i++) { const c = fazCoin(); c.userData.p = [Math.sin(i * 12.9) * 0.5 + 0.5, Math.sin(i * 7.3) * 0.5 + 0.5, Math.sin(i * 3.1) * 0.5 + 0.5]; g.add(c); } return g; })();
FX.fire = (() => { const g = new THREE.Group(); const r = rng(55); const fm = ['#ffd040', '#ff6a10', '#ff2a08'].map(c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  g.userData.fl = []; for (let i = 0; i < 260; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), fm[i % 3]); m.userData = { u: r(), v: r(), ph: r(), sp: 0.6 + r() * 0.9, sz: 0.1 + r() * 0.28 }; g.add(m); g.userData.fl.push(m); }
  const smm = new THREE.MeshBasicMaterial({ color: '#100806', transparent: true, opacity: 0.4, depthWrite: false }); g.userData.sm = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), smm); m.userData = { u: r(), v: r(), ph: r(), sp: 0.25 + r() * 0.3 }; g.add(m); g.userData.sm.push(m); }
  g.userData.lights = [0, 1].map(i => { const l = new THREE.PointLight('#ff7a20', 0, 9, 1.4); g.add(l); return l; }); return g; })();

// ---------- post ----------
const composer = new EffectComposer(renderer); const renderPass = new RenderPass(S.bedroom, camera); composer.addPass(renderPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.35, 0.45, 0.88); composer.addPass(bloom);
const uiCanvas = document.createElement('canvas'); uiCanvas.width = W; uiCanvas.height = H; const ui = uiCanvas.getContext('2d'); ui.imageSmoothingEnabled = false; const uiTex = new THREE.CanvasTexture(uiCanvas); uiTex.colorSpace = THREE.NoColorSpace;
const post = new ShaderPass({ uniforms: { tDiffuse: { value: null }, time: { value: 0 }, vig: { value: 0.6 }, grain: { value: 0.03 }, glitch: { value: 0 }, flash: { value: 0 }, fade: { value: 0 }, chroma: { value: 0 }, blur: { value: 0 }, tint: { value: new THREE.Vector3(1, 1, 1) }, res: { value: new THREE.Vector2(W, H) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time, vig, grain, glitch, flash, fade, chroma, blur; uniform vec3 tint; uniform vec2 res; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    void main(){ vec2 uv=vUv; float fr=floor(time*30.0); float line=floor(uv.y*res.y/14.0);
      uv.x += (hash(vec2(line, fr))-0.5)*0.06*glitch*step(0.6, hash(vec2(line*0.37, fr+3.0)));
      float ca = chroma*0.006 + glitch*0.01; vec3 col = vec3(texture2D(tDiffuse, uv+vec2(ca,0.)).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv-vec2(ca,0.)).b);
      if (blur > 0.0) { vec3 acc = vec3(0.0); float ws = 0.0; vec2 bp = blur * 5.0 / res; for (int i = -4; i <= 4; i++) for (int j = -4; j <= 4; j++) { float w = exp(-float(i*i+j*j)/12.0); acc += texture2D(tDiffuse, uv + vec2(float(i), float(j))*bp).rgb*w; ws += w; } col = mix(col, acc/ws*0.85, clamp(blur,0.,1.)); }
      col += (hash(floor(vUv*res/2.0) + fr*vec2(13.1,7.7))-0.5)*grain; col *= tint;
      vec2 d = (vUv-0.5)*vec2(1.0,0.82); col *= clamp(1.0 - vig*dot(d,d)*2.6, 0.0, 1.0);
      col = mix(col, vec3(1.0), clamp(flash,0.,1.)); col *= 1.0 - clamp(fade,0.,1.);
      gl_FragColor = vec4(col, 1.0); }` });
composer.addPass(post); composer.addPass(new OutputPass());
const uiPass = new ShaderPass({ uniforms: { tDiffuse: { value: null }, tUI: { value: uiTex }, uiOn: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse, tUI; uniform float uiOn; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); vec4 u = texture2D(tUI, vUv); gl_FragColor = vec4(mix(c.rgb, u.rgb, u.a*uiOn), 1.0); }' });
composer.addPass(uiPass); uiPass.uniforms.tUI.value = uiTex;
function logo(img, cx, cy, w, a, k) { const h = w * img.height / img.width; ui.save(); ui.globalAlpha = a; ui.translate(cx, cy); ui.scale(k, k); ui.shadowColor = 'rgba(0,0,0,0.85)'; ui.shadowBlur = 40; ui.shadowOffsetY = 14; ui.imageSmoothingEnabled = true; ui.drawImage(img, -w / 2, -h / 2, w, h); ui.restore(); }
// UCN-style Faz-Coin counter: coin icon (drawn pixel art) + white pixel digits, top-left
const DG = { 0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '111', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'], 6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '111'], '-': ['000', '000', '111', '000', '000'] };
function coinHud(it) { const s = W / 1080; const x = W * (it.u ?? 0.5), y = H * (it.v ?? 0.16), k = it.k ?? 1; ui.save(); ui.translate(x, y); ui.scale(k, k); ui.globalAlpha = it.a ?? 1;
  const R = 70 * s; ui.shadowColor = 'rgba(255,200,60,0.8)'; ui.shadowBlur = 30 * s; ui.fillStyle = '#e8b830'; ui.beginPath(); ui.arc(-R * 1.4, 0, R, 0, 7); ui.fill(); ui.shadowBlur = 0; ui.fillStyle = '#c89018'; ui.beginPath(); ui.arc(-R * 1.4, 0, R * 0.8, 0, 7); ui.fill();
  const p = R * 0.22; [['1111', '1...', '111.', '1...', '1...']][0].forEach((r, j) => [...r].forEach((b, i) => { if (b === '1') { ui.fillStyle = '#fff2b0'; ui.fillRect(-R * 1.4 - 2 * p + i * p, -2.5 * p + j * p, p * 0.92, p * 0.92); } }));
  const txt = String(it.txt), q = 26 * s; let x0 = R * 0.2; ui.shadowColor = 'rgba(0,0,0,0.9)'; ui.shadowBlur = 12 * s; for (const ch of txt) { const g = DG[ch]; if (!g) { x0 += q * 2; continue; } g.forEach((r, j) => [...r].forEach((b, i) => { if (b === '1') { ui.fillStyle = '#f4f4f4'; ui.fillRect(x0 + i * q, -2.5 * q + j * q, q * 0.92, q * 0.92); } })); x0 += q * 4; }
  ui.restore(); }
function drawUI(spec, t) { ui.clearRect(0, 0, W, H); if (!spec) { uiTex.needsUpdate = true; return; }
  for (const it of spec) { if (it.type === 'coins') coinHud(it); }
  uiTex.needsUpdate = true; }

// ---------- frame ----------
const allChars = Object.values(C);
const ctx = { THREE, C, S, FX, camera, U };
function resetWorld() {
  for (const c of allChars) { c.reset(); c.root.visible = true; c.root.scale.setScalar(c.baseScale); c.root.position.set(0, 0, 0); c.root.rotation.set(0, 0, 0); c.root.removeFromParent(); c.noBlink = false; if (c.setFace) c.setFace({ lid: 0, slope: 0, mouth: 0 }); if (c.ghostMat) c.ghostMat.opacity = c.name === 'golden' ? 0.55 : 0.6; }
  for (const o of Object.values(FX)) { if (!o || !o.isObject3D) continue; o.removeFromParent(); o.visible = true; o.scale.setScalar(1); o.rotation.set(0, 0, 0); }
  S.tablet.visible = false; S.officeKey.intensity = 46; S.officeKey.color.set('#ffcf8a'); S.officeKey.position.set(0, 3.8, 0.9); S.officeWash.intensity = 45; S.lampBulb.visible = true; C.rockstar.star.material.emissiveIntensity = 0.35; S.officeFill.intensity = 3; if (C.rockstar.eyeRed) C.rockstar.eyeRed(0); camera.fov = 42; camera.up.set(0, 1, 0);
  const P = post.uniforms; P.vig.value = 0.6; P.grain.value = 0.03; P.glitch.value = 0; P.flash.value = 0; P.fade.value = 0; P.chroma.value = 0; P.blur.value = 0; P.tint.value.set(1, 1, 1); bloom.strength = 0.35;
}
function renderAt(t) {
  let i = SHOTS.length - 1; while (i > 0 && SHOTS[i].t > t) i--; const shot = SHOTS[i]; const end = i + 1 < SHOTS.length ? SHOTS[i + 1].t : DURATION; const L = t - shot.t, d = end - shot.t;
  const run = () => { resetWorld(); const out = { scene: S.bedroom, ui: null }; const live = []; shot.fn(Object.assign(ctx, { t, L, d, u: Math.min(1, L / d), out, live, post: post.uniforms, bloom })); return { out, live }; };
  run(); const cp = camera.position.clone(), cq = camera.quaternion.clone(), cf = camera.fov; const { out, live } = run(); camera.position.copy(cp); camera.quaternion.copy(cq); camera.fov = cf;
  for (const c of allChars) { if (!c.applyFace) continue; if (BLINKERS.has(c.name) && c.face.lid < 0.05 && !c.noBlink) c.face.lid = blinkAt(t, c.name.length); c.applyFace(); }
  collisionCheck(t, live);
  if (S.fanBlades) S.fanBlades.rotation.z = -t * 16; C.rockstar.micUp();
  camera.aspect = W / H; camera.updateProjectionMatrix(); renderPass.scene = out.scene; drawUI(out.ui, t); uiPass.uniforms.uiOn.value = out.ui ? 1 : 0; post.uniforms.time.value = t; composer.render();
}
if (q.get('view')) { const v = q.get('view').split(',').map(Number); window.VIEW = t => { resetWorld(); camera.position.set(v[0], v[1], v[2]); camera.lookAt(v[3], v[4], v[5]); camera.fov = v[6] || 50; camera.aspect = W / H; camera.updateProjectionMatrix();
  const sc = q.get('sc') || 'office'; renderPass.scene = S[sc];
  if (q.get('dbg')) renderPass.scene.add(new THREE.AmbientLight('#ffffff', 2.5)); drawUI(null); uiPass.uniforms.uiOn.value = 0; composer.render(); }; }
window.APP = { ready: true, duration: DURATION, renderAt, shots: SHOTS.map(s => [s.t, s.name]) };
