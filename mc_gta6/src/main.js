import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadImage, imgToCanvas, imgCopy, Character, U } from './skin.js';
import { addFace, blinkAt } from './face.js';
import { collisionCheck } from './act.js';
import { buildWorld, loadTextures, modernWorld, classicWorld, block, blockRain, updateRain, particles, TEX } from './mc.js';
import { buildCity, buildPS5, drawBoard } from './city.js';
import { SHOTS, DURATION } from './shots.js';

const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(42, W / H, 0.05, 600);

// ---------- assets ----------
await loadTextures();
const sk = {}; for (const n of ['steve_a', 'steve_b', 'lucia', 'jason']) sk[n] = imgToCanvas(await loadImage(`/skins/${n}.png`));
const LOGO = { gta: await loadImage('/assets/gta6_logo.png'), mc: await loadImage('/assets/minecraft_logo.png') };
const S = {}; buildCity(S); buildPS5(S, S.city.children[0]); S.ps5.position.set(-3.6, 0.2, 8.3); S.board.position.set(3.8, 0, 8.6); S.ps5.visible = S.board.visible = false;
modernWorld(S); classicWorld(S);

// ---------- characters (Minecraft skins). Adults all scale 1. ----------
const C = {};
C.steve = new Character('steve', sk.steve_a);
C.oldsteve = new Character('oldsteve', sk.steve_b);
C.lucia = new Character('lucia', sk.lucia);
{ // Jason: backwards cap -> painted brim line on the hat layer erased, real 3D brim at the BACK of the head
  const A = imgCopy(sk.jason); A.getContext('2d').clearRect(56, 12, 8, 2); C.jason = new Character('jason', A);
  const capM = new THREE.MeshStandardMaterial({ color: '#4f462b', roughness: 0.8 }); const brim = new THREE.Mesh(new THREE.BoxGeometry(7.2 * U, 0.55 * U, 3.0 * U), capM);
  brim.position.set(0, 4.6 * U, -5.4 * U); brim.rotation.x = -0.12; brim.castShadow = true; C.jason.head.add(brim);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(7.4 * U, 0.6 * U, 0.3 * U), capM); strap.position.set(0, 4.85 * U, -4.15 * U); C.jason.head.add(strap); }
addFace(C.steve, { eyes: [[1, 4, 2, 1], [5, 4, 2, 1]], lid: '#b4846d', lash: '#2b1e0d', mouth: { row: 6, x0: 3, x1: 4, max: 1, dark: '#3a1a10', paint: true } });
addFace(C.lucia, { eyes: [[1, 4, 2, 3], [5, 4, 2, 3]], lid: '#c28f82', lash: '#160f0d', mouth: { row: 7, x0: 3, x1: 4, max: 1, dark: '#5a2020', paint: true } });
addFace(C.jason, { eyes: [[1, 4, 2, 3], [5, 4, 2, 3]], lid: '#e8b085', lash: '#221c15', mouth: { row: 7, x0: 3, x1: 4, max: 1, dark: '#4a1a10', paint: true } });
const BLINKERS = new Set(['steve', 'lucia', 'jason']);
for (const c of Object.values(C)) c.baseScale = 1;

// ---------- FX ----------
const FX = { block: block('grass', 1), stone: block('stone', 1), parts: particles(28), parts2: particles(28),
  rainCity: blockRain(212, 1.0, [60, 10, -30, 6.8], 21), rainMany: blockRain(2400, 0.35, [70, 16, -35, 4], 33), pile: blockRain(140, 1.0, [6, 6, -3, -3], 51),
  gold: block('grass', 1) };
{ const cells = []; for (let l = 0; l < 4; l++) { const n = 4 - l; for (let x = 0; x < n; x++) for (let z = 0; z < n; z++) cells.push([x - n / 2, l, z - n / 2, 'grass']); } FX.pyr = new THREE.Group(); buildWorld(cells, FX.pyr); }
FX.gold.material = new THREE.MeshStandardMaterial({ color: '#ffcf3a', metalness: 0.9, roughness: 0.25, emissive: '#7a4a00', emissiveIntensity: 0.4 });
FX.q = bubbleSprite('?'); FX.ex = bubbleSprite('!');
FX.sparks = (() => { const g = new THREE.Group(); for (let i = 0; i < 60; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: ['#ff4fb0', '#3ae8ff', '#ffe060', '#7affd8'][i % 4], toneMapped: false })); m.userData.v = new THREE.Vector3(Math.cos(i * 2.4) * (1 + (i % 7) * 0.3), 1 + (i % 5) * 0.5, Math.sin(i * 2.4) * (1 + (i % 3) * 0.3)); g.add(m); } return g; })();
function bubbleSprite(sym) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.arc(32, 28, 24, 0, 7); g.fill(); g.beginPath(); g.moveTo(26, 48); g.lineTo(22, 62); g.lineTo(38, 50); g.fill();
  g.fillStyle = '#1a1a2a'; g.font = 'bold 34px "DejaVu Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sym, 32, 30); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, depthTest: false })); m.renderOrder = 10; return m; }

// ---------- post ----------
const composer = new EffectComposer(renderer); const renderPass = new RenderPass(S.city, camera); composer.addPass(renderPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.45, 0.5, 0.85); composer.addPass(bloom);
const uiCanvas = document.createElement('canvas'); uiCanvas.width = W; uiCanvas.height = H; const ui = uiCanvas.getContext('2d'); const uiTex = new THREE.CanvasTexture(uiCanvas); uiTex.colorSpace = THREE.NoColorSpace;
const post = new ShaderPass({ uniforms: { tDiffuse: { value: null }, tUI: { value: uiTex }, time: { value: 0 }, vig: { value: 0.5 }, grain: { value: 0.02 }, glitch: { value: 0 }, flash: { value: 0 }, fade: { value: 0 }, chroma: { value: 0 }, uiOn: { value: 0 }, blur: { value: 0 }, tint: { value: new THREE.Vector3(1, 1, 1) }, res: { value: new THREE.Vector2(W, H) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse, tUI; uniform float time, vig, grain, glitch, flash, fade, chroma, uiOn, blur; uniform vec3 tint; uniform vec2 res; varying vec2 vUv;
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

// ---------- UI: Vice-City neon pixel numbers + logos ----------
const GL = { '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'], '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'], '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'], '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'], '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'], '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'], 'G': ['01110', '10001', '10000', '10111', '10001', '10001', '01111'], 'B': ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  'M': ['10001', '11011', '10101', '10101', '10001', '10001', '10001'], '<': ['00010', '00100', '01000', '10000', '01000', '00100', '00010'], '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '.': ['0', '0', '0', '0', '0', '1', '1'], '#': ['01010', '01010', '11111', '01010', '11111', '01010', '01010'], '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'], ' ': ['000', '000', '000', '000', '000', '000', '000'],
  '÷': ['00000', '00100', '00000', '11111', '00000', '00100', '00000'], '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'], 'x': ['00000', '00000', '10001', '01010', '00100', '01010', '10001'] };
function neonText(txt, cx, cy, px, a = 1, k = 1) { const chars = [...txt]; const cols = chars.reduce((n, c) => n + (GL[c] || GL[' '])[0].length + 1, -1); const tw = cols * px, th = 7 * px;
  ui.save(); ui.translate(cx, cy); ui.scale(k, k); ui.translate(-tw / 2, -th / 2); ui.globalAlpha = a;
  const each = fn => { let x0 = 0; for (const c of chars) { const g = GL[c] || GL[' ']; g.forEach((row, y) => [...row].forEach((b, x) => { if (b === '1') fn((x0 + x) * px, y * px, y); })); x0 += g[0].length + 1; } };
  ui.shadowColor = 'rgba(255,60,170,0.95)'; ui.shadowBlur = px * 2.4; ui.fillStyle = 'rgba(255,80,190,0.5)'; each((x, y) => ui.fillRect(x - 1, y - 1, px + 2, px + 2)); ui.shadowBlur = 0;
  const d = Math.max(2, Math.round(px * 0.32)); ui.fillStyle = '#3a0858'; each((x, y) => ui.fillRect(x + d, y + d, px, px));
  const gr = ui.createLinearGradient(0, 0, 0, th); gr.addColorStop(0, '#5a7aff'); gr.addColorStop(0.5, '#ff5fc8'); gr.addColorStop(1, '#ffa24a'); ui.fillStyle = gr; each((x, y) => ui.fillRect(x, y, px - 1, px - 1));
  ui.fillStyle = 'rgba(255,255,255,0.35)'; each((x, y) => ui.fillRect(x, y, px - 1, Math.max(1, px * 0.22))); ui.restore(); }
function logo(img, cx, cy, w, a, k, round = 0) { const h = w * img.height / img.width; ui.save(); ui.globalAlpha = a; ui.translate(cx, cy); ui.scale(k, k);
  ui.shadowColor = 'rgba(0,0,0,0.75)'; ui.shadowBlur = 34; ui.shadowOffsetY = 14; if (round) { ui.beginPath(); ui.roundRect(-w / 2, -h / 2, w, h, round); ui.fillStyle = '#000'; ui.fill(); ui.shadowColor = 'transparent'; ui.clip(); }
  ui.drawImage(img, -w / 2, -h / 2, w, h); ui.restore(); }
function drawUI(spec, t) { ui.clearRect(0, 0, W, H); if (!spec) { uiTex.needsUpdate = true; return; } const s = W / 1080;
  for (const it of spec) { if (it.type === 'num') neonText(it.txt, W * (it.u ?? 0.5), H * (it.v ?? 0.18), (it.px ?? 22) * s, it.a ?? 1, it.k ?? 1);
    else if (it.type === 'logo') logo(LOGO[it.which], W * 0.5, H * (it.v ?? 0.3), W * (it.w ?? 0.8), it.a ?? 1, it.k ?? 1, it.which === 'mc' ? 60 * s : 0); }
  uiTex.needsUpdate = true; }

// ---------- frame ----------
const allChars = Object.values(C);
const ctx = { THREE, C, S, FX, camera, U, updateRain, drawBoard, TEX };
function resetWorld() {
  for (const c of allChars) { c.reset(); c.root.visible = true; c.root.scale.setScalar(c.baseScale); c.root.position.set(0, 0, 0); c.root.rotation.set(0, 0, 0); c.root.removeFromParent(); c.noBlink = false; }
  for (const o of [FX.pyr, FX.block, FX.stone, FX.parts, FX.parts2, FX.rainCity, FX.rainMany, FX.pile, FX.gold, FX.q, FX.ex, FX.sparks]) { o.removeFromParent(); o.visible = true; o.scale.setScalar(1); o.rotation.set(0, 0, 0); }
  S.ps5.visible = S.board.visible = false; camera.fov = 42; camera.up.set(0, 1, 0);
  const P = post.uniforms; P.vig.value = 0.5; P.grain.value = 0.02; P.glitch.value = 0; P.flash.value = 0; P.fade.value = 0; P.chroma.value = 0;  P.blur.value = 0; P.tint.value.set(1, 1, 1); bloom.strength = 0.45;
}
function renderAt(t) {
  let i = SHOTS.length - 1; while (i > 0 && SHOTS[i].t > t) i--; const shot = SHOTS[i]; const end = i + 1 < SHOTS.length ? SHOTS[i + 1].t : DURATION; const L = t - shot.t, d = end - shot.t;
  const run = () => { resetWorld(); const out = { scene: S.city, ui: null }; const live = []; shot.fn(Object.assign(ctx, { t, L, d, u: Math.min(1, L / d), out, live, post: post.uniforms, bloom })); return { out, live }; };
  run(); const cp = camera.position.clone(), cq = camera.quaternion.clone(), cf = camera.fov; const { out, live } = run(); camera.position.copy(cp); camera.quaternion.copy(cq); camera.fov = cf;
  for (const c of allChars) { if (!c.applyFace) continue; if (BLINKERS.has(c.name) && c.face.lid < 0.05 && !c.noBlink) c.face.lid = blinkAt(t, c.name.length); c.applyFace(); }
  collisionCheck(t, live);
  if (S.ferris) S.ferris.rotation.z = t * 0.12;
  camera.aspect = W / H; camera.updateProjectionMatrix(); renderPass.scene = out.scene; drawUI(out.ui, t); uiPass.uniforms.uiOn.value = out.ui ? 1 : 0; post.uniforms.time.value = t; composer.render();
}
window.APP = { ready: true, duration: DURATION, renderAt, shots: SHOTS.map(s => [s.t, s.name]) };
