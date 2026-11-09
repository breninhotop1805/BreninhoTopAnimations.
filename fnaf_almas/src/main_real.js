import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadImage, imgToCanvas, Character, buildChica, buildBonnie, buildFreddy, U } from './skin.js';
import { buildSets, bubble, sparkle, zzz, rng } from './sets.js';
import { SHOTS, DURATION } from './shots.js';

const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(42, W / H, 0.03, 80);

// ---------- assets ----------
const sk = {};
for (const n of ['chica_beak', 'chica_nobeak', 'bonnie', 'freddy', 'guard', 'scott', 'girl']) sk[n] = imgToCanvas(await loadImage(`/skins/${n}.png`));
const logoImg = await loadImage('/assets/fnaf4_logo.png');
const S = buildSets();
const logoTex = new THREE.Texture(logoImg); logoTex.colorSpace = THREE.SRGBColorSpace; logoTex.needsUpdate = true;
S.studioScreenMat.map = logoTex; S.studioScreenMat.emissiveMap = logoTex; S.studioScreenMat.color.set('#222'); S.studioScreenMat.needsUpdate = true;

const C = {
  chica: buildChica(sk.chica_beak, sk.chica_nobeak),
  bonnie: buildBonnie(sk.bonnie),
  freddy: buildFreddy(sk.freddy),
  guard: new Character('guard', sk.guard),
  scott: new Character('scott', sk.scott),
  girl: new Character('girl', sk.girl),
  plushChica: new Character('plushChica', sk.chica_nobeak),
  plushBonnie: buildBonnie(sk.bonnie),
  plushFreddy: buildFreddy(sk.freddy),
  plushChica2: new Character('plushChica2', sk.chica_nobeak),
};
// beak anchors for blending between face and hand
const ch = C.chica;
ch.beakHeadAnchor = new THREE.Object3D(); ch.beakHeadAnchor.position.copy(ch.beak.position); ch.head.add(ch.beakHeadAnchor);
ch.beakHandAnchor = new THREE.Object3D(); ch.beakHandAnchor.position.set(0, -1.2 * U, 2.6 * U); ch.beakHandAnchor.rotation.x = Math.PI / 2; ch.handR.add(ch.beakHandAnchor);

// fx objects
const FX = {
  q1: bubble('?'), q2: bubble('?'), ex1: bubble('!'), ex2: bubble('!'), ex3: bubble('!'),
  sparkles: Array.from({ length: 8 }, (_, i) => sparkle(i % 2 ? '#fff6c0' : '#ffd0f0')),
  z: [zzz(), zzz(), zzz()],
  confetti: (() => { const g = new THREE.Group(); const r = rng(77); const cols = ['#ffd23a', '#ff4fa0', '#4fd0ff', '#8cff6a', '#ffffff', '#ff7a2a'];
    for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: cols[i % 6], fog: false }));
      m.userData = { dir: new THREE.Vector3(r() - 0.5, r() * 0.9 + 0.1, r() - 0.5).normalize().multiplyScalar(1.4 + r() * 2.2), spin: r() * 10 }; g.add(m); } return g; })(),
  dreamStars: (() => { const g = new THREE.Group(); const r = rng(5);
    for (let i = 0; i < 60; i++) { const s = sparkle(['#fff6c0', '#c8b0ff', '#ffd0f0'][i % 3]); s.position.set((r() - 0.5) * 12, r() * 6, -6 + r() * 9); s.scale.setScalar(0.6 + r() * 1.2); s.userData.ph = r() * 6; g.add(s); } return g; })(),
};

// ---------- post processing ----------
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(S.hall, camera); composer.addPass(renderPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.35, 0.45, 0.96); composer.addPass(bloom);
const uiCanvas = document.createElement('canvas'); uiCanvas.width = W; uiCanvas.height = H; const ui = uiCanvas.getContext('2d');
const uiTex = new THREE.CanvasTexture(uiCanvas); uiTex.colorSpace = THREE.SRGBColorSpace;
const post = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, tUI: { value: uiTex }, time: { value: 0 }, vig: { value: 0.55 }, grain: { value: 0.035 }, stat: { value: 0 }, cctv: { value: 0 },
    flash: { value: 0 }, fade: { value: 0 }, chroma: { value: 0 }, uiOn: { value: 0 }, tint: { value: new THREE.Vector3(1, 1, 1) }, res: { value: new THREE.Vector2(W, H) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse, tUI; uniform float time, vig, grain, stat, cctv, flash, fade, chroma, uiOn; uniform vec3 tint; uniform vec2 res; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 uv=vUv; float fr=floor(time*30.0);
      float line=floor(uv.y*res.y/6.0);
      uv.x += (hash(vec2(line, fr))-0.5)*0.035*stat*step(0.55, hash(vec2(line*0.37, fr+3.0)));
      float ca = chroma*0.006 + stat*0.006;
      vec3 col = vec3(texture2D(tDiffuse, uv+vec2(ca,0.)).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv-vec2(ca,0.)).b);
      float l = dot(col, vec3(0.3,0.59,0.11));
      col = mix(col, l*vec3(0.85,1.0,0.92)*1.05, 0.5*cctv);
      col *= 1.0 - 0.12*cctv*step(0.5, fract(vUv.y*res.y/4.0));
      vec2 px = floor(vUv*res/2.0);
      float n = hash(px + fr*vec2(13.1,7.7));
      col = mix(col, vec3(n)*0.9, clamp(stat,0.,1.)*0.8);
      col += (n-0.5)*(grain + 0.05*cctv);
      col *= tint;
      vec2 d = (vUv-0.5)*vec2(1.0,0.82); col *= clamp(1.0 - vig*dot(d,d)*2.6, 0.0, 1.0);
      col = mix(col, vec3(1.0), clamp(flash,0.,1.));
      col *= 1.0 - clamp(fade,0.,1.);
      vec4 u = texture2D(tUI, vUv); col = mix(col, u.rgb, u.a*uiOn);
      gl_FragColor = vec4(col, 1.0);
    }`
});
composer.addPass(post);
composer.addPass(new OutputPass());

let uiKey = '';
function drawUI(label, t) {
  const blink = Math.floor(t * 2) % 2 === 0; const key = label + blink; if (key === uiKey) return; uiKey = key;
  ui.clearRect(0, 0, W, H); if (!label) { uiTex.needsUpdate = true; return; }
  const s = W / 1080; ui.strokeStyle = 'rgba(255,255,255,0.92)'; ui.lineWidth = 7 * s; const m = 70 * s, L = 110 * s;
  for (const [x, y, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { ui.beginPath(); ui.moveTo(x, y + dy * L); ui.lineTo(x, y); ui.lineTo(x + dx * L, y); ui.stroke(); }
  ui.font = `bold ${52 * s}px "DejaVu Sans Mono", monospace`; ui.fillStyle = 'rgba(255,255,255,0.95)'; ui.textBaseline = 'top';
  ui.fillText('REC', m + 85 * s, m + 30 * s);
  if (blink) { ui.fillStyle = '#ff2a2a'; ui.beginPath(); ui.arc(m + 50 * s, m + 56 * s, 18 * s, 0, 7); ui.fill(); }
  ui.fillStyle = 'rgba(255,255,255,0.95)'; ui.textAlign = 'right'; ui.textBaseline = 'bottom'; ui.fillText(label, W - m - 30 * s, H - m - 30 * s); ui.textAlign = 'left';
  ui.strokeStyle = 'rgba(255,255,255,0.7)'; ui.lineWidth = 4 * s; ui.strokeRect(W - m - 250 * s, H - m - 400 * s, 220 * s, 150 * s);
  ui.fillStyle = 'rgba(255,255,255,0.5)'; ui.fillRect(W - m - 210 * s, H - m - 360 * s, 50 * s, 30 * s); ui.fillStyle = 'rgba(80,255,120,0.9)'; ui.fillRect(W - m - 120 * s, H - m - 320 * s, 50 * s, 30 * s);
  uiTex.needsUpdate = true;
}

// ---------- frame ----------
const allChars = Object.values(C);
const ctx = { THREE, C, S, FX, camera, U };
function resetWorld() {
  for (const c of allChars) {
    c.reset(); c.root.visible = true; c.root.scale.setScalar(1); c.root.position.set(0, 0, 0); c.root.rotation.set(0, 0, 0);
    c.root.removeFromParent();
  }
  ch.setBeak(true); ch.beak.visible = true; ch.beak.removeFromParent(); ch.head.add(ch.beak); ch.beak.position.copy(ch.beakHome.pos); ch.beak.rotation.set(0, 0, 0); ch.beak.scale.setScalar(1);
  for (const k of ['q1', 'q2', 'ex1', 'ex2', 'ex3']) { FX[k].removeFromParent(); FX[k].visible = true; FX[k].scale.setScalar(1); FX[k].rotation.set(0, 0, 0); }
  for (const s of FX.sparkles) s.removeFromParent(); for (const z of FX.z) z.removeFromParent();
  FX.confetti.removeFromParent(); FX.dreamStars.removeFromParent();
  S.partyRed.intensity = 0; S.voidRim.intensity = 0; S.voidSpot.intensity = 42; S.voidSpot.color.set('#fff4e0'); S.voidFill.intensity = 2.5; S.voidFill.color.set('#7f8cff');
  S.doorLight.intensity = 0; S.officeLamp.intensity = 7; S.bedLamp.intensity = 9; S.bedroom.fog.color.set('#07051a'); S.bedroom.background.set('#07051a'); S.bedroom.fog.near = 8; S.bedroom.fog.far = 20;
  S.bedHemi.intensity = 1.1; S.moon.intensity = 1.8; S.bedWalls.visible = true; S.bedLamp.color.set('#ffcf8a'); S.stageSpot.intensity = 40;
  for (const l of S.hallLamps) l.intensity = 9;
  camera.fov = 42; camera.up.set(0, 1, 0);
  const P = post.uniforms; P.vig.value = 0.55; P.grain.value = 0.035; P.stat.value = 0; P.cctv.value = 0; P.flash.value = 0; P.fade.value = 0; P.chroma.value = 0; P.uiOn.value = 0; P.tint.value.set(1, 1, 1);
  bloom.strength = 0.35;
}

function renderAt(t) {
  resetWorld();
  let i = SHOTS.length - 1; while (i > 0 && SHOTS[i].t > t) i--;
  const shot = SHOTS[i]; const end = i + 1 < SHOTS.length ? SHOTS[i + 1].t : DURATION;
  const L = t - shot.t, d = end - shot.t;
  const out = { scene: S.hall, ui: null };
  shot.fn(Object.assign(ctx, { t, L, d, u: Math.min(1, L / d), out, post: post.uniforms, bloom }));
  if (S.fanBlades) S.fanBlades.rotation.z = t * 25;
  camera.aspect = W / H; camera.updateProjectionMatrix();
  renderPass.scene = out.scene;
  drawUI(out.ui, t); post.uniforms.uiOn.value = out.ui ? 1 : 0; post.uniforms.time.value = t;
  composer.render();
}

window.APP = { ready: true, duration: DURATION, renderAt, shots: SHOTS.map(s => [s.t, s.name]) };
