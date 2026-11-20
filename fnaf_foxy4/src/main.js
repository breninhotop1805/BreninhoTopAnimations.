import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadImage, imgToCanvas, Character, U } from './skin.js';
import { addFace, blinkAt } from './face.js';
import { collisionCheck } from './act.js';
import { buildNFoxy, buildNFreddy, buildNBonnie, buildNChica, buildFoxyMask } from './nightmare.js';
import { buildBedroom, buildHall } from './sets.js';
import { drawMinigame } from './minigame.js';
import { SHOTS, DURATION } from './shots.js';

const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(42, W / H, 0.03, 80);

// ---------- assets ----------
const sk = {}; for (const n of ['nfoxy_src', 'nfreddy_src', 'nbonnie_src', 'nchica_src', 'michael', 'cchild', 'foxy_classic', 'freddy_classic']) sk[n] = imgToCanvas(await loadImage(`/skins/${n}.png`));
let LOGO = null; try { LOGO = await loadImage('/assets/fnaf4_logo.png'); } catch (e) { LOGO = null; }
const S = {}; buildBedroom(S); buildHall(S, 'L'); buildHall(S, 'R');

// ---------- characters: animatronics 1.35, the brother 1.0, the crying child 0.78, plushies 0.3 ----------
const C = { nfoxy: buildNFoxy(sk.nfoxy_src), nfreddy: buildNFreddy(sk.nfreddy_src), nbonnie: buildNBonnie(sk.nbonnie_src), nchica: buildNChica(sk.nchica_src),
  michael: new Character('michael', sk.michael), cchild: new Character('cchild', sk.cchild), pfoxy: new Character('pfoxy', sk.foxy_classic), pfreddy: new Character('pfreddy', sk.freddy_classic) };
for (const n of ['nfoxy', 'nfreddy', 'nbonnie', 'nchica']) C[n].baseScale = 1.35; C.michael.baseScale = 1.0; C.cchild.baseScale = 0.78; C.pfoxy.baseScale = 0.3; C.pfreddy.baseScale = 0.3;
C.michael.mask = buildFoxyMask(); C.michael.head.add(C.michael.mask);
addFace(C.cchild, { eyes: [[1, 4, 2, 2], [5, 4, 2, 2]], lid: '#fbcc83', lash: '#3b2700', mouth: { row: 7, x0: 3, x1: 4, max: 1, dark: '#5a1a10', paint: true } });
addFace(C.michael, { eyes: [[2, 12, 4, 1], [10, 12, 4, 1]], lid: '#f6cdb8', lash: '#140b09', mouth: { row: 14, x0: 6, x1: 9, max: 1, dark: '#4a1a16', paint: true } });
const BLINKERS = new Set(['cchild', 'michael']);
for (const c of Object.values(C)) if (!c.baseScale) c.baseScale = 1;

// ---------- FX ----------
const FX = {};
FX.parts = (() => { const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: '#c8c0d8', transparent: true, opacity: 0.6, depthWrite: false }); for (let i = 0; i < 40; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), m); b.userData.v = new THREE.Vector3(Math.cos(i * 2.4) * (0.6 + (i % 5) * 0.2), 0.4 + (i % 7) * 0.15, Math.sin(i * 2.4) * (0.6 + (i % 3) * 0.2)); g.add(b); }
  g.userData.update = (k, o) => { g.position.copy(o); m.opacity = 0.6 * (1 - k); g.children.forEach(b => { const v = b.userData.v; b.position.set(v.x * k * 1.4, v.y * k * 2 - 1.2 * k * k, v.z * k * 1.4); b.scale.setScalar(Math.max(0.001, 1 - k * 0.6)); }); }; return g; })();
FX.q = bubbleSprite('?'); FX.ex = bubbleSprite('!');
function bubbleSprite(sym) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.arc(32, 28, 24, 0, 7); g.fill(); g.beginPath(); g.moveTo(26, 48); g.lineTo(22, 62); g.lineTo(38, 50); g.fill();
  g.fillStyle = '#1a1a2a'; g.font = 'bold 34px "DejaVu Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sym, 32, 30); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: t, color: '#9a9aa4', transparent: true, toneMapped: false, depthTest: false })); m.renderOrder = 10; return m; }
// flashlight prop for the child (small torch)
FX.torch = (() => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.26, 12), new THREE.MeshStandardMaterial({ color: '#3a3a44', metalness: 0.6, roughness: 0.4 })); b.rotation.x = Math.PI / 2; g.add(b);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12), new THREE.MeshBasicMaterial({ color: '#fff8e0', toneMapped: false })); lens.rotation.x = Math.PI / 2; lens.position.z = 0.14; g.add(lens); g.userData.lens = lens; return g; })();

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
function drawUI(spec, t) { ui.clearRect(0, 0, W, H); if (!spec) { uiTex.needsUpdate = true; return; }
  for (const it of spec) { if (it.type === 'logo' && LOGO) logo(LOGO, W * 0.5, H * (it.v ?? 0.3), W * (it.w ?? 0.8), it.a ?? 1, it.k ?? 1);
    else if (it.type === 'game') drawMinigame(ui, W, H, it, t); }
  uiTex.needsUpdate = true; }

// ---------- frame ----------
const allChars = Object.values(C);
const ctx = { THREE, C, S, FX, camera, U };
function resetWorld() {
  for (const c of allChars) { c.reset(); c.root.visible = true; c.root.scale.setScalar(c.baseScale); c.root.position.set(0, 0, 0); c.root.rotation.set(0, 0, 0); c.root.removeFromParent(); c.noBlink = false; if (c.setFace) c.setFace({ lid: 0, slope: 0, mouth: 0 }); }
  C.michael.mask.visible = true; C.michael.mask.removeFromParent(); C.michael.head.add(C.michael.mask); C.michael.mask.position.set(0, 0, 0); C.michael.mask.rotation.set(0, 0, 0); C.michael.mask.scale.setScalar(1); S.hallLightsL.forEach(l => l.intensity = 2.2); S.hallLightsR.forEach(l => l.intensity = 2.2);
  for (const n of ['nfoxy', 'nfreddy', 'nbonnie', 'nchica']) { const m = C[n].eyeMesh; if (m) m.traverse(o => { if (o.isMesh) o.material.emissiveIntensity = 1.3; }); }
  for (const o of Object.values(FX)) { o.removeFromParent(); o.visible = true; o.scale.setScalar(1); o.rotation.set(0, 0, 0); }
  S.flash.intensity = 0; S.hallFlashL.intensity = 0; S.hallFlashR.intensity = 0; S.setCloset(0.35); S.lamp.intensity = 1.2; S.lamp.color.set('#ffc070'); camera.fov = 42; camera.up.set(0, 1, 0);
  const P = post.uniforms; P.vig.value = 0.6; P.grain.value = 0.03; P.glitch.value = 0; P.flash.value = 0; P.fade.value = 0; P.chroma.value = 0; P.blur.value = 0; P.tint.value.set(1, 1, 1); bloom.strength = 0.35; S.moon.intensity = 3; S.moon.target.position.set(0, 0.5, -3.5);
}
function renderAt(t) {
  let i = SHOTS.length - 1; while (i > 0 && SHOTS[i].t > t) i--; const shot = SHOTS[i]; const end = i + 1 < SHOTS.length ? SHOTS[i + 1].t : DURATION; const L = t - shot.t, d = end - shot.t;
  const run = () => { resetWorld(); const out = { scene: S.bedroom, ui: null }; const live = []; shot.fn(Object.assign(ctx, { t, L, d, u: Math.min(1, L / d), out, live, post: post.uniforms, bloom })); return { out, live }; };
  run(); const cp = camera.position.clone(), cq = camera.quaternion.clone(), cf = camera.fov; const { out, live } = run(); camera.position.copy(cp); camera.quaternion.copy(cq); camera.fov = cf;
  for (const c of allChars) { if (!c.applyFace) continue; if (BLINKERS.has(c.name) && c.face.lid < 0.05 && !c.noBlink) c.face.lid = blinkAt(t, c.name.length); c.applyFace(); }
  collisionCheck(t, live);
  if (S.fanBlades) S.fanBlades.rotation.z = -t * 14;
  const sec = Math.floor(t); if (S.clockDigits) S.clockDigits.material.color.set(sec % 2 ? '#ff2a1a' : '#e0241a');
  camera.aspect = W / H; camera.updateProjectionMatrix(); renderPass.scene = out.scene; drawUI(out.ui, t); uiPass.uniforms.uiOn.value = out.ui ? 1 : 0; post.uniforms.time.value = t; composer.render();
}
if (q.get('view')) { const v = q.get('view').split(',').map(Number); window.VIEW = t => { resetWorld(); camera.position.set(v[0], v[1], v[2]); camera.lookAt(v[3], v[4], v[5]); camera.fov = v[6] || 50; camera.aspect = W / H; camera.updateProjectionMatrix();
  const sc = q.get('sc') || 'bedroom'; renderPass.scene = S[sc]; if (q.get('fl')) { const f = sc === 'bedroom' ? S.flash : S['hallFlash' + sc.slice(-1)]; f.intensity = 40; f.position.copy(camera.position); f.target.position.set(v[3], v[4], v[5]); }
  if (q.get('dbg')) renderPass.scene.add(new THREE.AmbientLight('#ffffff', 2.5)); drawUI(null); uiPass.uniforms.uiOn.value = 0; composer.render(); }; }
window.APP = { ready: true, duration: DURATION, renderAt, shots: SHOTS.map(s => [s.t, s.name]) };
