import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadImage, imgToCanvas, Character, buildFreddy, buildPuppet, buildFoxy, buildNightmarionne, buildYenndo, waveTendrils, U } from './skin.js';
import { buildSets, bubble, sparkle, rng, drawScreen, soulOrb, redX, likeIcon, bellIcon } from './sets.js';
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
for (const n of ['foxy', 'wfoxy', 'pfoxy', 'puppet', 'nightmarionne', 'yenndo', 'freddy_cta', 'toy_freddy', 'guard']) sk[n] = imgToCanvas(await loadImage(`/skins/${n}.png`));
const LOGOS = []; for (const n of ['fnaf1', 'fnaf2', 'fnaf3', 'fnaf4', 'fnafsl']) LOGOS.push(await loadImage(`/assets/${n}_logo.png`));
const S = buildSets();
// guard face (front of head, 8x8 skin units) for the CRT scanner
{ const s = sk.guard.width / 64; const c = document.createElement('canvas'); c.width = 8 * s; c.height = 8 * s; c.getContext('2d').drawImage(sk.guard, 8 * s, 8 * s, 8 * s, 8 * s, 0, 0, 8 * s, 8 * s); S.guardFace = c; }

const C = {
  foxy: buildFoxy(sk.foxy, 'foxy'),
  wfoxy: buildFoxy(sk.wfoxy, 'wfoxy', { tornEar: true }),
  pfoxy: buildFoxy(sk.pfoxy, 'pfoxy', { fur: '#3c4a2a', inner: '#6a7a4a' }),
  puppet: buildPuppet(sk.puppet),
  nightm: buildNightmarionne(sk.nightmarionne),
  yenndo: buildYenndo(sk.yenndo),
  freddy: buildFreddy(sk.freddy_cta, { earPalette: { o: '#7a4a28', d: '#4a2a18', l: '#a8743e' } }),
  guard: new Character('guard', sk.guard),
};

// fx objects
const FX = {
  q1: bubble('?'), ex1: bubble('!'), xmark: redX(), like: likeIcon(), bell: bellIcon(),
  jsLight: new THREE.PointLight('#fff0e0', 0, 4, 1.4),
  fill: new THREE.PointLight('#e8ffe8', 0, 5, 1.5),
  tablet: (() => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.44, 0.03), new THREE.MeshStandardMaterial({ color: '#1a1a1e', roughness: 0.5 }));
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.38), new THREE.MeshBasicMaterial({ map: S.screenTex })); sc.position.z = 0.016; g.add(b, sc); return g; })(),
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
  const blink = Math.floor(t * 2) % 2 === 0; const key = JSON.stringify(spec) + blink + Math.floor(t * 30);
  if (key === uiKey) return; uiKey = key;
  ui.clearRect(0, 0, W, H); if (!spec) { uiTex.needsUpdate = true; return; }
  const s = W / 1080;
  if (typeof spec === 'string') { // security camera HUD
    ui.strokeStyle = 'rgba(255,255,255,0.92)'; ui.lineWidth = 7 * s; const m = 70 * s, L = 110 * s;
    for (const [x, y, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { ui.beginPath(); ui.moveTo(x, y + dy * L); ui.lineTo(x, y); ui.lineTo(x + dx * L, y); ui.stroke(); }
    ui.font = `bold ${52 * s}px "DejaVu Sans Mono", monospace`; ui.fillStyle = 'rgba(255,255,255,0.95)'; ui.textBaseline = 'top'; ui.fillText('REC', m + 85 * s, m + 30 * s);
    if (blink) { ui.fillStyle = '#ff2a2a'; ui.beginPath(); ui.arc(m + 50 * s, m + 56 * s, 18 * s, 0, 7); ui.fill(); }
    ui.fillStyle = 'rgba(255,255,255,0.95)'; ui.textAlign = 'right'; ui.textBaseline = 'bottom'; ui.fillText(spec, W - m - 30 * s, H - m - 30 * s); ui.textAlign = 'left';
  } else if (spec.type === 'logo') { // game logo card
    const img = LOGOS[spec.i]; const k = spec.k; const w = W * 0.86 * k, h = w * img.height / img.width;
    const g = ui.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.9); g.addColorStop(0, `rgba(0,0,0,${0.55 * spec.a})`); g.addColorStop(1, `rgba(0,0,0,${0.15 * spec.a})`);
    ui.fillStyle = g; ui.fillRect(0, 0, W, H); ui.globalAlpha = spec.a; ui.drawImage(img, (W - w) / 2, H * 0.42 - h / 2, w, h); ui.globalAlpha = 1;
  } else if (spec.type === 'stopwatch') { // reaction-time stopwatch
    const cx = W / 2, cy = H * 0.14, r = 70 * s;
    ui.lineWidth = 9 * s; ui.strokeStyle = 'rgba(0,0,0,0.6)'; ui.beginPath(); ui.arc(cx, cy + 4 * s, r, 0, 7); ui.stroke();
    ui.strokeStyle = '#ffffff'; ui.beginPath(); ui.arc(cx, cy, r, 0, 7); ui.stroke(); ui.fillStyle = '#fff'; ui.fillRect(cx - 12 * s, cy - r - 26 * s, 24 * s, 18 * s);
    const ang = -Math.PI / 2 + (spec.v % 1) * Math.PI * 2; ui.strokeStyle = spec.red ? '#ff3030' : '#ffd040'; ui.lineWidth = 7 * s; ui.beginPath(); ui.moveTo(cx, cy); ui.lineTo(cx + Math.cos(ang) * r * 0.78, cy + Math.sin(ang) * r * 0.78); ui.stroke();
    ui.font = `bold ${78 * s}px "DejaVu Sans Mono", monospace`; ui.textAlign = 'center'; ui.textBaseline = 'top'; ui.lineWidth = 10 * s; ui.strokeStyle = '#000';
    const txt = spec.v.toFixed(1) + 's'; ui.strokeText(txt, cx, cy + r + 20 * s); ui.fillStyle = spec.red ? '#ff3030' : '#ffffff'; ui.fillText(txt, cx, cy + r + 20 * s);
  } else if (spec.type === 'musicbox') { // FNAF2 music box wind meter
    const cx = 150 * s, cy = H - 300 * s, r = 80 * s; const v = Math.max(0, Math.min(1, spec.v));
    ui.fillStyle = 'rgba(0,0,0,0.55)'; ui.beginPath(); ui.arc(cx, cy, r + 14 * s, 0, 7); ui.fill();
    ui.fillStyle = v < 0.25 ? '#ff3030' : '#f0f0f0'; ui.beginPath(); ui.moveTo(cx, cy); ui.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + v * Math.PI * 2); ui.closePath(); ui.fill();
    ui.fillStyle = '#7a2ae0'; ui.fillRect(cx - 26 * s, cy - 18 * s, 52 * s, 40 * s); ui.fillStyle = '#e0c040'; ui.fillRect(cx - 4 * s, cy - 18 * s, 8 * s, 40 * s); ui.fillRect(cx - 30 * s, cy - 26 * s, 60 * s, 10 * s);
    if (v < 0.25 && Math.floor(t * 6) % 2) { ui.strokeStyle = '#ff3030'; ui.lineWidth = 8 * s; ui.beginPath(); ui.arc(cx, cy, r + 22 * s, 0, 7); ui.stroke(); }
  } else if (spec.type === 'oxygen') { // SL custom night oxygen meter
    const x0 = 90 * s, y0 = 150 * s, bw = W - 180 * s, bh = 46 * s; const v = Math.max(0, Math.min(1, spec.v));
    ui.fillStyle = 'rgba(0,0,0,0.6)'; ui.fillRect(x0 - 8 * s, y0 - 8 * s, bw + 16 * s, bh + 16 * s);
    ui.fillStyle = v > 0.35 ? '#3ad0ff' : (Math.floor(t * 8) % 2 ? '#ff3030' : '#a01818'); ui.fillRect(x0, y0, bw * v, bh);
    ui.strokeStyle = '#ffffff'; ui.lineWidth = 4 * s; ui.strokeRect(x0, y0, bw, bh);
    ui.font = `bold ${50 * s}px "DejaVu Sans Mono", monospace`; ui.textAlign = 'left'; ui.textBaseline = 'bottom'; ui.lineWidth = 8 * s; ui.strokeStyle = '#000'; ui.strokeText('O₂', x0, y0 - 14 * s); ui.fillStyle = '#ffffff'; ui.fillText('O₂', x0, y0 - 14 * s);
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
const ctx = { THREE, C, S, FX, camera, U, waveTendrils };
function resetWorld() {
  for (const c of allChars) {
    c.reset(); c.root.visible = true; c.root.scale.setScalar(1); c.root.position.set(0, 0, 0); c.root.rotation.set(0, 0, 0);
    c.root.removeFromParent();
  }
  for (const c of [C.foxy, C.wfoxy, C.pfoxy]) c.jaw.rotation.x = 0;
  FX.xmark.removeFromParent(); FX.like.removeFromParent(); FX.bell.removeFromParent(); FX.tablet.removeFromParent();
  C.pfoxy.root.traverse(o => { if (o.isMesh && o.material.transparent && o.userData.ghostable) o.material.opacity = 1; });
  for (const k of ['q1', 'ex1']) { FX[k].removeFromParent(); FX[k].visible = true; FX[k].scale.setScalar(1); FX[k].rotation.set(0, 0, 0); }
  for (const s of FX.sparkles) s.removeFromParent(); for (const o of FX.orbs) { o.removeFromParent(); o.scale.setScalar(1); }
  FX.sparks.removeFromParent(); FX.laser.removeFromParent();
  S.partyRed.intensity = 0; S.voidRim.intensity = 0; S.voidSpot.intensity = 42; S.voidSpot.color.set('#fff4e0'); S.voidFill.intensity = 2.5; S.voidFill.color.set('#7f8cff');
  S.stageSpot.intensity = 40; S.crtLight.intensity = 2.5; S.arcLight.intensity = 2.5; S.screenLamp.intensity = 4; S.crtLight.color.set('#9fe6ff');
  S.giftLid.rotation.set(0, 0, 0); S.giftSpot.intensity = 30; S.prizeFill.intensity = 3;
  for (const l of S.hallLamps) { l.intensity = 9; l.color.set('#ffe9c4'); }
  S.doorL.position.y = 3.75; S.doorR.position.y = 3.75; S.curtains.forEach(c => c.rotation.set(0, 0, 0)); S.westDoorLight.intensity = 0; S.office1Lamp.intensity = 9; S.west.forEach(l => l.intensity = 4); S.coveSpot.intensity = 3;
  S.btnDoorL.material.emissiveIntensity = 0.6; S.btnLightL.material.emissiveIntensity = 0.4;
  S.f3Lamp.intensity = 9; S.f3Glow.intensity = 1.5; S.slLamp.intensity = 11; S.slRed.intensity = 0; FX.jsLight.removeFromParent(); FX.jsLight.intensity = 0; FX.fill.removeFromParent(); FX.fill.intensity = 0;
  S.closetDoors.forEach(d => d.rotation.set(0, 0, 0)); S.bedDoor.rotation.set(0, 0, 0); S.flash.intensity = 0; S.pumpkins.forEach(l => l.intensity = 1.5);
  S.doorLight.intensity = 0; S.officeLamp.intensity = 7; S.bedLamp.intensity = 9; S.bedHemi.intensity = 1.1; S.moon.intensity = 1.8; S.bedWalls.visible = true; S.bedLamp.color.set('#ffcf8a');
  S.bedroom.fog.color.set('#07051a'); S.bedroom.background.set('#07051a'); S.bedroom.fog.near = 8; S.bedroom.fog.far = 20;
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
  if (out.screen !== 'off' || out.scene === S.screenroom) drawScreen(S, out.screen, L, t);
  if (S.fanBlades) S.fanBlades.rotation.z = t * 25; S.fan1.rotation.z = t * 25;
  camera.aspect = W / H; camera.updateProjectionMatrix();
  renderPass.scene = out.scene;
  drawUI(out.ui, t); post.uniforms.uiOn.value = out.ui ? 1 : 0; post.uniforms.time.value = t;
  composer.render();
}

window.APP = { ready: true, duration: DURATION, renderAt, shots: SHOTS.map(s => [s.t, s.name]) };
