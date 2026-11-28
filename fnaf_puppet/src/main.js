import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadImage, imgToCanvas, Character, buildBonnie, buildFreddy, buildPuppet, buildClassicChica, buildWilliam, bracelet, recolorChild, makeGhost, U } from './skin.js';
import { buildSets, bubble, sparkle, rng, drawScreen, soulOrb, Rain, redX } from './sets.js';
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
for (const n of ['puppet', 'charlotte', 'henry', 'william', 'freddy_classic', 'bonnie_classic', 'chica_classic', 'child', 'guard']) sk[n] = imgToCanvas(await loadImage(`/skins/${n}.png`));
const logoImg = await loadImage('/assets/fnaf_logo.png');
const S = buildSets();
const logoTex = new THREE.Texture(logoImg); logoTex.colorSpace = THREE.SRGBColorSpace; logoTex.needsUpdate = true;
S.logoMat.map = logoTex; S.logoMat.needsUpdate = true;
// guard face (front of head, 8x8 skin units) for the CRT scanner
{ const s = sk.guard.width / 64; const c = document.createElement('canvas'); c.width = 8 * s; c.height = 8 * s; c.getContext('2d').drawImage(sk.guard, 8 * s, 8 * s, 8 * s, 8 * s, 0, 0, 8 * s, 8 * s); S.guardFace = c; }

const FREDDY_EARS = { o: '#7a4a28', d: '#4a2a18', l: '#a8743e' };
const BONNIE_PAL = { b: '#5a4a9a', l: '#7a6ab8', d: '#3a2e6a', w: '#b8a8d8', p: '#c8a0c8' };
const GREY_KID = { shirt: '#8a8a92', accent: '#b0b0b8', pants: '#5a5a62', hair: '#4a4a50' };
const C = {
  puppet: buildPuppet(sk.puppet),
  charlotte: new Character('charlotte', sk.charlotte),
  ghostCharlotte: makeGhost(new Character('ghostCharlotte', sk.charlotte), '#bfe6ff'),
  henry: new Character('henry', sk.henry),
  william: buildWilliam(sk.william),
  oldFreddy: buildFreddy(sk.freddy_classic, { earPalette: FREDDY_EARS }),
  oldBonnie: buildBonnie(sk.bonnie_classic, { name: 'oldBonnie', palette: BONNIE_PAL }),
  oldChica: buildClassicChica(sk.chica_classic),
};
for (let i = 0; i < 3; i++) C['kid' + i] = new Character('kid' + i, recolorChild(sk.child, GREY_KID));
// mask heads for the Give Gifts minigame: detached heads of extra animatronic instances
const MASKS = [buildFreddy(sk.freddy_classic, { earPalette: FREDDY_EARS }), buildBonnie(sk.bonnie_classic, { name: 'mB', palette: BONNIE_PAL }), buildClassicChica(sk.chica_classic, 'mC')].map(c => { const h = c.head; h.removeFromParent(); return h; });
// security bracelets (Puppet's wrist + Charlotte's wrist)
const BR_P = bracelet('#3cff7a'); C.puppet.armL.piv.add(BR_P); BR_P.position.y = -8.2 * U;
const BR_C = bracelet('#3cff7a'); C.charlotte.armL.piv.add(BR_C); BR_C.position.y = -8.2 * U; BR_C.scale.set(1.02, 1, 1.02);
const RAIN = new Rain();

// fx objects
const FX = {
  q1: bubble('?'), ex1: bubble('!'), xmark: redX(),
  sparkles: Array.from({ length: 8 }, (_, i) => sparkle(i % 2 ? '#fff6c0' : '#cfeeff')),
  orbs: Array.from({ length: 6 }, () => soulOrb()),
  sparks: (() => { const g = new THREE.Group(); const r = rng(9); for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.025), new THREE.MeshBasicMaterial({ color: i % 3 ? '#ffe070' : '#ffffff', toneMapped: false, fog: false }));
    m.userData.dir = new THREE.Vector3(r() - 0.5, r() * 0.8 + 0.2, r() - 0.3).normalize().multiplyScalar(1 + r() * 1.8); g.add(m); } return g; })(),
  laser: (() => { const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: '#ff2030', transparent: true, opacity: 0.85, toneMapped: false, fog: false, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.006, 0.006), m); b.position.y = (i - 3) * 0.05; g.add(b); } g.userData.mat = m; return g; })(),
};

// ---------- post processing ----------
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(S.hall, camera); composer.addPass(renderPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.35, 0.45, 0.96); composer.addPass(bloom);
const uiCanvas = document.createElement('canvas'); uiCanvas.width = W; uiCanvas.height = H; const ui = uiCanvas.getContext('2d');
const uiTex = new THREE.CanvasTexture(uiCanvas); uiTex.colorSpace = THREE.SRGBColorSpace;
const post = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, tUI: { value: uiTex }, time: { value: 0 }, vig: { value: 0.55 }, grain: { value: 0.035 }, stat: { value: 0 }, cctv: { value: 0 },
    flash: { value: 0 }, fade: { value: 0 }, chroma: { value: 0 }, uiOn: { value: 0 }, pix: { value: 0 }, tint: { value: new THREE.Vector3(1, 1, 1) }, res: { value: new THREE.Vector2(W, H) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse, tUI; uniform float time, vig, grain, stat, cctv, flash, fade, chroma, uiOn, pix; uniform vec3 tint; uniform vec2 res; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 uv=vUv; float fr=floor(time*30.0);
      if (pix > 0.5) { vec2 cell = vec2(pix) / res; uv = (floor(uv / cell) + 0.5) * cell; }
      float line=floor(uv.y*res.y/6.0);
      uv.x += (hash(vec2(line, fr))-0.5)*0.035*stat*step(0.55, hash(vec2(line*0.37, fr+3.0)));
      float ca = chroma*0.006 + stat*0.006;
      vec3 col = vec3(texture2D(tDiffuse, uv+vec2(ca,0.)).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv-vec2(ca,0.)).b);
      if (pix > 0.5) col = floor(col * 6.0 + 0.5) / 6.0;
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
post.uniforms.tUI.value = uiTex; // ShaderPass clones uniforms; point back at the live canvas texture
composer.addPass(new OutputPass());

let uiKey = '';
function drawUI(spec, t) {
  const blink = Math.floor(t * 2) % 2 === 0; const key = JSON.stringify(spec) + blink + (spec && spec.type === 'vision' ? Math.floor(t * 30) : '');
  if (key === uiKey) return; uiKey = key;
  ui.clearRect(0, 0, W, H); if (!spec) { uiTex.needsUpdate = true; return; }
  const s = W / 1080;
  if (typeof spec === 'string') { // security camera HUD
    ui.strokeStyle = 'rgba(255,255,255,0.92)'; ui.lineWidth = 7 * s; const m = 70 * s, L = 110 * s;
    for (const [x, y, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { ui.beginPath(); ui.moveTo(x, y + dy * L); ui.lineTo(x, y); ui.lineTo(x + dx * L, y); ui.stroke(); }
    ui.font = `bold ${52 * s}px "DejaVu Sans Mono", monospace`; ui.fillStyle = 'rgba(255,255,255,0.95)'; ui.textBaseline = 'top'; ui.fillText('REC', m + 85 * s, m + 30 * s);
    if (blink) { ui.fillStyle = '#ff2a2a'; ui.beginPath(); ui.arc(m + 50 * s, m + 56 * s, 18 * s, 0, 7); ui.fill(); }
    ui.fillStyle = 'rgba(255,255,255,0.95)'; ui.textAlign = 'right'; ui.textBaseline = 'bottom'; ui.fillText(spec, W - m - 30 * s, H - m - 30 * s); ui.textAlign = 'left';
  } else if (spec.type === 'vision') { // robot "facial recognition" vision
    const [bx, by, bw, bh] = spec.box.map((v, i) => v * (i % 2 ? H : W)); const col = spec.locked ? '#ff2a2a' : '#ff8a8a';
    ui.strokeStyle = col; ui.lineWidth = 6 * s; const br = 60 * s;
    for (const [x, y, dx, dy] of [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]]) { ui.beginPath(); ui.moveTo(x, y + dy * br); ui.lineTo(x, y); ui.lineTo(x + dx * br, y); ui.stroke(); }
    ui.strokeStyle = 'rgba(255,60,60,0.35)'; ui.lineWidth = 2 * s; ui.beginPath(); ui.moveTo(W / 2, 0); ui.lineTo(W / 2, H); ui.moveTo(0, H / 2); ui.lineTo(W, H / 2); ui.stroke();
    ui.font = `bold ${46 * s}px "DejaVu Sans Mono", monospace`; ui.fillStyle = col; ui.textAlign = 'center'; ui.textBaseline = 'bottom';
    ui.fillText(spec.locked ? 'TARGET' : 'SCANNING', bx + bw / 2, by - 16 * s);
    ui.textAlign = 'left'; ui.textBaseline = 'top'; ui.font = `bold ${36 * s}px "DejaVu Sans Mono", monospace`; ui.fillStyle = 'rgba(255,80,80,0.9)';
    ui.fillText('ID: ' + (spec.locked ? 'MATCH' : '----'), 70 * s, 90 * s);
    if (blink) { ui.fillStyle = '#ff2a2a'; ui.beginPath(); ui.arc(W - 100 * s, 110 * s, 16 * s, 0, 7); ui.fill(); }
  }
  uiTex.needsUpdate = true;
}

// ---------- frame ----------
const allChars = Object.values(C);
const ctx = { THREE, C, S, FX, MASKS, RAIN, BR_P, BR_C, camera, U };
function resetWorld() {
  for (const c of allChars) {
    c.reset(); c.root.visible = true; c.root.scale.setScalar(1); c.root.position.set(0, 0, 0); c.root.rotation.set(0, 0, 0);
    c.root.removeFromParent();
  }
  C.ghostCharlotte.ghostMat.opacity = 0.5;
  for (const m of MASKS) { m.removeFromParent(); m.scale.setScalar(1); m.rotation.set(0, 0, 0); }
  RAIN.group.removeFromParent(); FX.xmark.removeFromParent();
  BR_P.visible = false; BR_C.visible = false;
  for (const k of ['q1', 'ex1']) { FX[k].removeFromParent(); FX[k].visible = true; FX[k].scale.setScalar(1); FX[k].rotation.set(0, 0, 0); }
  for (const s of FX.sparkles) s.removeFromParent(); for (const o of FX.orbs) { o.removeFromParent(); o.scale.setScalar(1); }
  FX.sparks.removeFromParent(); FX.laser.removeFromParent();
  S.partyRed.intensity = 0; S.voidRim.intensity = 0; S.voidSpot.intensity = 42; S.voidSpot.color.set('#fff4e0'); S.voidFill.intensity = 2.5; S.voidFill.color.set('#7f8cff');
  S.stageSpot.intensity = 40; S.crtLight.intensity = 2.5; S.arcLight.intensity = 2.5; S.screenLamp.intensity = 4; S.crtLight.color.set('#9fe6ff');
  S.giftLid.rotation.set(0, 0, 0); S.giftSpot.intensity = 30; S.prizeFill.intensity = 3;
  for (const l of S.hallLamps) { l.intensity = 9; l.color.set('#ffe9c4'); }
  S.doorPanes.forEach(p => p.rotation.set(0, 0, 0)); S.secretDoor.rotation.set(0, 0, 0); S.facadeLightning.intensity = 0; S.alleyLightning.intensity = 0; S.logoLight.intensity = 9;
  S.inLamps.forEach(l => l.intensity = 10); S.inGlow.intensity = 4; S.inGlow.position.set(0, 1.8, -1.0); S.streetLamp.intensity = 30; S.alleyLamp.intensity = 10; S.shopLamp.intensity = 35; S.shopFill.intensity = 3.5; S.shopCrtLight.intensity = 1.5;
  S.facade.background.set('#04060c'); S.alley.background.set('#03050a');
  camera.fov = 42; camera.up.set(0, 1, 0);
  const P = post.uniforms; P.vig.value = 0.55; P.grain.value = 0.035; P.stat.value = 0; P.cctv.value = 0; P.flash.value = 0; P.fade.value = 0; P.chroma.value = 0; P.uiOn.value = 0; P.pix.value = 0; P.tint.value.set(1, 1, 1);
  bloom.strength = 0.35;
}

function renderAt(t) {
  resetWorld();
  let i = SHOTS.length - 1; while (i > 0 && SHOTS[i].t > t) i--;
  const shot = SHOTS[i]; const end = i + 1 < SHOTS.length ? SHOTS[i + 1].t : DURATION;
  const L = t - shot.t, d = end - shot.t;
  const out = { scene: S.hall, ui: null, screen: 'off' };
  shot.fn(Object.assign(ctx, { t, L, d, u: Math.min(1, L / d), out, post: post.uniforms, bloom }));
  if (out.scene === S.screenroom || out.scene === S.shop) drawScreen(S, out.screen, L, t);
  if (S.fanBlades) S.fanBlades.rotation.z = t * 25;
  camera.aspect = W / H; camera.updateProjectionMatrix();
  renderPass.scene = out.scene;
  drawUI(out.ui, t); post.uniforms.uiOn.value = out.ui ? 1 : 0; post.uniforms.time.value = t;
  composer.render();
}

window.APP = { ready: true, duration: DURATION, renderAt, shots: SHOTS.map(s => [s.t, s.name]) };
