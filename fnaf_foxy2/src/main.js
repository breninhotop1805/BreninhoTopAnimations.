import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadImage, imgToCanvas, Character, buildFoxy, buildFreddy, buildPurpleGuy, buildSpring, freddyMaskSkin, addEndo, setXray, recolorChild, makeGhost, U } from './skin.js';
import { initMinigame, renderMinigame } from './minigame.js';
import { buildSets, buildBlobSets, buildFoxySets, animateFire, bubble, sparkle, rng, drawScreen, soulOrb, redX, likeIcon, bellIcon } from './sets.js';
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
for (const n of ['wfoxy', 'guard', 'freddy', 'purpleguy', 'springbonnie', 'child']) sk[n] = imgToCanvas(await loadImage(`/skins/${n}.png`));
const LOGOS = []; for (const n of ['fnaf2']) LOGOS.push(await loadImage(`/assets/${n}_logo.png`));
const PGIMG = await loadImage('/assets/pg_sprite.png'); initMinigame(PGIMG);
const S = buildSets(); buildBlobSets(S, null); buildFoxySets(S);
{ const s = sk.guard.width / 64; const c = document.createElement('canvas'); c.width = 8 * s; c.height = 8 * s; c.getContext('2d').drawImage(sk.guard, 8 * s, 8 * s, 8 * s, 8 * s, 0, 0, 8 * s, 8 * s); S.guardFace = c; }

// kids: same shirt colours as the pixel minigame
const KIDPAL = [{ shirt: '#e83a3a', accent: '#f2c230', pants: '#2a4a8a', hair: '#5a3a1a' }, { shirt: '#3a7ae8', accent: '#ffffff', pants: '#3a3a3a', hair: '#2a1a0a' },
  { shirt: '#36c04a', accent: '#f2f2f2', pants: '#5a3a22', hair: '#c8902a' }, { shirt: '#b048e0', accent: '#ffd23a', pants: '#2a2a5a', hair: '#1a1a1a' }, { shirt: '#f0a020', accent: '#ffffff', pants: '#3a2a5a', hair: '#7a3a1a' }];
const C = {
  wfoxy: addEndo(buildFoxy(sk.wfoxy, 'wfoxy', { tornEar: true })),
  guard: new Character('guard', sk.guard),
  fmask: buildFreddy(freddyMaskSkin(sk.freddy)),
  purpleguy: buildPurpleGuy(sk.purpleguy),
  springbonnie: buildSpring(sk.springbonnie, 'springbonnie', {}),
  kidghost: makeGhost(new Character('kidghost', recolorChild(sk.child, KIDPAL[0])), '#9fdcff'),
};
C.wfoxy.baseScale = 1.12; C.springbonnie.baseScale = 1.08;
for (let i = 0; i < 5; i++) C['kid' + i] = new Character('kid' + i, recolorChild(sk.child, KIDPAL[i]));
for (let i = 0; i < 5; i++) C['kid' + i].baseScale = 0.72;

// fx objects
const FX = {
  q1: bubble('?'), ex1: bubble('!'), xmark: redX(), like: likeIcon(), bell: bellIcon(),
  jsLight: new THREE.PointLight('#fff0e0', 0, 4, 1.4),
  orbs: Array.from({ length: 6 }, () => soulOrb()), xmark: redX(),
  torch: (() => { const l = new THREE.SpotLight('#fff4dc', 0, 14, 0.42, 0.5, 1.2); l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.bias = -0.001; return l; })(),
  agony: (() => { const g = new THREE.Group(); const r = rng(66); const ms = [new THREE.MeshBasicMaterial({ color: '#ff1a1a', transparent: true, opacity: 0.7, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }), new THREE.MeshBasicMaterial({ color: '#5a0000', transparent: true, opacity: 0.6, depthWrite: false })];
    for (let i = 0; i < 120; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), ms[i % 2]); m.userData = { a: r() * 6.283, rr: 0.4 + r() * 1.6, y: r() * 3, sp: 0.3 + r() * 0.9, ph: r(), sz: 0.04 + r() * 0.1 }; g.add(m); } return g; })(),
  waves: Array.from({ length: 4 }, () => new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.018, 6, 40), new THREE.MeshBasicMaterial({ color: '#b8ffc0', transparent: true, opacity: 0.8, toneMapped: false, fog: false, blending: THREE.AdditiveBlending, depthWrite: false }))),
  cage: (() => { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: '#2a2a2e', roughness: 0.35, metalness: 0.85 }); for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.045, 2.8, 0.045), m); b.position.set(-0.8 + i * 0.2, 1.4, 0); b.castShadow = true; g.add(b); } for (const y of [0.05, 2.75]) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.08, 0.08), m); b.position.y = y; g.add(b); } return g; })(),
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
  } else if (spec.type === 'mg') { // fullscreen pixel minigame
    renderMinigame(spec.mg, t, uiCanvas, W, H);
  } else if (spec.type === 'logo') { // game logo card
    const img = LOGOS[spec.i]; const k = spec.k; const w = W * 0.86 * k, h = w * img.height / img.width;
    const g = ui.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.9); g.addColorStop(0, `rgba(0,0,0,${0.55 * spec.a})`); g.addColorStop(1, `rgba(0,0,0,${0.15 * spec.a})`);
    ui.fillStyle = g; ui.fillRect(0, 0, W, H); ui.globalAlpha = spec.a; ui.drawImage(img, (W - w) / 2, H * 0.42 - h / 2, w, h); ui.globalAlpha = 1;
  } else if (spec.type === 'cammap') { // FNAF3 camera map + PLAY AUDIO button
    const x0 = W * 0.08, y0 = H * 0.6, mw = W * 0.84, mh = H * 0.3; const k = spec.a ?? 1; ui.globalAlpha = k;
    ui.fillStyle = 'rgba(0,10,0,0.55)'; ui.fillRect(x0 - 16 * s, y0 - 16 * s, mw + 32 * s, mh + 32 * s);
    ui.strokeStyle = 'rgba(190,255,190,0.9)'; ui.lineWidth = 5 * s;
    const R = [[0.05, 0.1, 0.3, 0.22], [0.4, 0.1, 0.25, 0.22], [0.72, 0.1, 0.24, 0.35], [0.05, 0.45, 0.22, 0.3], [0.32, 0.45, 0.32, 0.18], [0.32, 0.7, 0.38, 0.2], [0.75, 0.55, 0.21, 0.35]];
    R.forEach(([a, b, c, d]) => ui.strokeRect(x0 + a * mw, y0 + b * mh, c * mw, d * mh));
    ui.font = `bold ${30 * s}px "DejaVu Sans Mono", monospace`; ui.textAlign = 'center'; ui.textBaseline = 'middle';
    R.forEach(([a, b, c, d], i) => { const sel = i === spec.sel; ui.fillStyle = sel ? '#c8ffc0' : 'rgba(30,60,30,0.95)'; const bx = x0 + (a + c / 2) * mw, by = y0 + (b + d / 2) * mh; ui.fillRect(bx - 50 * s, by - 22 * s, 100 * s, 44 * s); ui.fillStyle = sel ? '#062006' : '#c8ffc0'; ui.fillText('0' + (i + 1), bx, by); });
    if (spec.dot) { const [dx, dy] = spec.dot; ui.fillStyle = '#ffe040'; ui.beginPath(); ui.arc(x0 + dx * mw, y0 + dy * mh, 16 * s, 0, 7); ui.fill(); }
    if (spec.wave) { const [wx, wy] = spec.wavePos || [0.5, 0.5]; for (let i = 0; i < 3; i++) { const r = ((t * 1.6 + i / 3) % 1); ui.strokeStyle = `rgba(200,255,200,${1 - r})`; ui.lineWidth = 4 * s; ui.beginPath(); ui.arc(x0 + wx * mw, y0 + wy * mh, (20 + 110 * r) * s, 0, 7); ui.stroke(); } }
    // PLAY AUDIO button
    const p = spec.press || 0; const bw = 380 * s, bh = 96 * s, bx = W / 2 - bw / 2, by = y0 - 150 * s;
    ui.fillStyle = p > 0.5 ? '#c8ffc0' : 'rgba(20,50,20,0.95)'; ui.fillRect(bx, by + 6 * s * p, bw, bh); ui.strokeStyle = '#c8ffc0'; ui.strokeRect(bx, by + 6 * s * p, bw, bh);
    ui.font = `bold ${48 * s}px "DejaVu Sans Mono", monospace`; ui.fillStyle = p > 0.5 ? '#062006' : '#c8ffc0'; ui.fillText('PLAY AUDIO', W / 2, by + bh / 2 + 6 * s * p);
    if (spec.cursor) { const [cx, cy] = spec.cursor; ui.fillStyle = '#fff'; ui.strokeStyle = '#000'; ui.lineWidth = 4 * s; ui.beginPath(); const X = cx * W, Y = cy * H; ui.moveTo(X, Y); ui.lineTo(X, Y + 70 * s); ui.lineTo(X + 18 * s, Y + 52 * s); ui.lineTo(X + 32 * s, Y + 80 * s); ui.lineTo(X + 44 * s, Y + 74 * s); ui.lineTo(X + 30 * s, Y + 48 * s); ui.lineTo(X + 52 * s, Y + 48 * s); ui.closePath(); ui.fill(); ui.stroke(); }
    ui.globalAlpha = 1;
  } else if (spec.type === 'audiofile') { // "it's just an audio file": file card + waveform + progress
    const k = spec.a ?? 1; ui.globalAlpha = k; const cw = W * 0.8, ch = 420 * s, cx = (W - cw) / 2, cy = H * 0.5 - ch / 2 + (1 - k) * 60 * s;
    ui.fillStyle = 'rgba(8,14,8,0.92)'; ui.fillRect(cx, cy, cw, ch); ui.strokeStyle = '#c8ffc0'; ui.lineWidth = 5 * s; ui.strokeRect(cx, cy, cw, ch);
    // file icon
    const ix = cx + 40 * s, iy = cy + 40 * s; ui.fillStyle = '#e8f0e0'; ui.beginPath(); ui.moveTo(ix, iy); ui.lineTo(ix + 70 * s, iy); ui.lineTo(ix + 100 * s, iy + 30 * s); ui.lineTo(ix + 100 * s, iy + 130 * s); ui.lineTo(ix, iy + 130 * s); ui.closePath(); ui.fill();
    ui.fillStyle = '#2a8a3a'; ui.fillRect(ix + 14 * s, iy + 70 * s, 72 * s, 36 * s); ui.fillStyle = '#fff'; ui.font = `bold ${24 * s}px "DejaVu Sans Mono", monospace`; ui.textAlign = 'center'; ui.textBaseline = 'middle'; ui.fillText('WAV', ix + 50 * s, iy + 89 * s);
    ui.textAlign = 'left'; ui.font = `bold ${40 * s}px "DejaVu Sans Mono", monospace`; ui.fillStyle = '#c8ffc0'; ui.fillText('bb_laugh.wav', ix + 130 * s, iy + 50 * s);
    ui.font = `${30 * s}px "DejaVu Sans Mono", monospace`; ui.fillStyle = 'rgba(200,255,200,0.6)'; ui.fillText('00:02 / 00:03', ix + 130 * s, iy + 100 * s);
    // waveform
    const wy = cy + 280 * s, ww = cw - 80 * s, n = 56, pr = spec.p || 0;
    for (let i = 0; i < n; i++) { const a = (0.25 + 0.75 * Math.abs(Math.sin(i * 0.9) * Math.sin(i * 0.37 + 1))) * 70 * s; ui.fillStyle = i / n < pr ? '#7aff8a' : 'rgba(200,255,200,0.35)'; ui.fillRect(cx + 40 * s + i * ww / n, wy - a, ww / n * 0.6, a * 2); }
    ui.fillStyle = '#fff'; ui.fillRect(cx + 40 * s + pr * ww - 2 * s, wy - 90 * s, 4 * s, 180 * s);
    ui.globalAlpha = 1;
  } else if (spec.type === 'auto') { // suit status: AUTO MODE
    const on = spec.on; const col = on ? '#5aff7a' : '#ff5050'; const y = H * 0.12;
    ui.font = `bold ${64 * s}px "DejaVu Sans Mono", monospace`; ui.textAlign = 'center'; ui.textBaseline = 'middle';
    if (!spec.hide) {
    const txt = 'AUTO MODE: ' + (on ? 'ON' : 'OFF'); const tw = ui.measureText(txt).width + 60 * s;
    ui.fillStyle = 'rgba(0,0,0,0.6)'; ui.fillRect(W / 2 - tw / 2, y - 50 * s, tw, 100 * s); ui.strokeStyle = col; ui.lineWidth = 5 * s; ui.strokeRect(W / 2 - tw / 2, y - 50 * s, tw, 100 * s);
    ui.fillStyle = (on && !blink && spec.blink) ? 'rgba(90,255,122,0.35)' : col; ui.fillText(txt, W / 2, y);
    }
    if (spec.scan) { const sy = H * (0.2 + 0.7 * ((t * 0.7) % 1)); const g2 = ui.createLinearGradient(0, sy - 40 * s, 0, sy + 4 * s); g2.addColorStop(0, 'rgba(90,255,122,0)'); g2.addColorStop(1, 'rgba(90,255,122,0.55)'); ui.fillStyle = g2; ui.fillRect(0, sy - 40 * s, W, 44 * s); }
    if (spec.target) { const [bx, by] = spec.target; const X = bx * W, Y = by * H, r = 70 * s; ui.strokeStyle = '#ff4040'; ui.lineWidth = 6 * s; ui.beginPath(); ui.arc(X, Y, r, 0, 7); ui.moveTo(X - r - 30 * s, Y); ui.lineTo(X + r + 30 * s, Y); ui.moveTo(X, Y - r - 30 * s); ui.lineTo(X, Y + r + 30 * s); ui.stroke(); }
  } else if (spec.type === 'lens') { // magnifier ring(s) on a detail; outside darkened; optional check / cross badge
    const k = spec.a ?? 1;
    ui.save(); ui.fillStyle = `rgba(0,0,0,${0.55 * k})`; ui.beginPath(); ui.rect(0, 0, W, H); for (const [x, y, r] of spec.pts) { ui.moveTo(x * W + r * W, y * H); ui.arc(x * W, y * H, r * W, 0, Math.PI * 2, true); } ui.fill('evenodd'); ui.restore();
    for (const [x, y, r] of spec.pts) { ui.strokeStyle = spec.col || '#ffffff'; ui.lineWidth = 10 * s; ui.globalAlpha = k; ui.beginPath(); ui.arc(x * W, y * H, r * W * (1 + 0.04 * Math.sin(t * 6)), 0, 7); ui.stroke(); ui.globalAlpha = 1; }
    if (spec.mark) { const [x, y, ok] = spec.mark; const R = 62 * s; const X = x * W, Y = y * H; ui.globalAlpha = k; ui.fillStyle = ok ? '#2ad05a' : '#e82a2a'; ui.beginPath(); ui.arc(X, Y, R, 0, 7); ui.fill(); ui.strokeStyle = '#fff'; ui.lineWidth = 14 * s; ui.lineCap = 'round'; ui.beginPath();
      if (ok) { ui.moveTo(X - 28 * s, Y + 2 * s); ui.lineTo(X - 6 * s, Y + 24 * s); ui.lineTo(X + 30 * s, Y - 22 * s); } else { ui.moveTo(X - 24 * s, Y - 24 * s); ui.lineTo(X + 24 * s, Y + 24 * s); ui.moveTo(X + 24 * s, Y - 24 * s); ui.lineTo(X - 24 * s, Y + 24 * s); }
      ui.stroke(); ui.lineCap = 'butt'; ui.globalAlpha = 1; }
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
    const [bx, by, bw, bh] = spec.box.map((v, i) => v * (i % 2 ? H : W)); const col = spec.col || (spec.locked ? '#ff2a2a' : '#ff8a8a');
    ui.strokeStyle = col; ui.lineWidth = 6 * s; const br = 60 * s;
    for (const [x, y, dx, dy] of [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]]) { ui.beginPath(); ui.moveTo(x, y + dy * br); ui.lineTo(x, y); ui.lineTo(x + dx * br, y); ui.stroke(); }
    ui.strokeStyle = 'rgba(255,60,60,0.35)'; ui.lineWidth = 2 * s; ui.beginPath(); ui.moveTo(W / 2, 0); ui.lineTo(W / 2, H); ui.moveTo(0, H / 2); ui.lineTo(W, H / 2); ui.stroke();
    ui.font = `bold ${46 * s}px "DejaVu Sans Mono", monospace`; ui.fillStyle = col; ui.textAlign = 'center'; ui.textBaseline = 'bottom';
    ui.fillText(spec.label || (spec.locked ? 'TARGET' : 'SCANNING'), bx + bw / 2, by - 16 * s);
    ui.textAlign = 'left'; ui.textBaseline = 'top'; ui.font = `bold ${36 * s}px "DejaVu Sans Mono", monospace`; ui.fillStyle = 'rgba(255,80,80,0.9)';
    ui.fillText(spec.id || ('ID: ' + (spec.locked ? 'MATCH' : '----')), 70 * s, 90 * s);
    if (blink) { ui.fillStyle = '#ff2a2a'; ui.beginPath(); ui.arc(W - 100 * s, 110 * s, 16 * s, 0, 7); ui.fill(); }
  }
  uiTex.needsUpdate = true;
}

// ---------- frame ----------
const allChars = Object.values(C);
const ctx = { THREE, C, S, FX, camera, U, setXray };
function resetWorld() {
  for (const c of allChars) {
    c.reset(); c.root.visible = true; c.root.scale.setScalar(c.baseScale || 1); c.root.position.set(0, 0, 0); c.root.rotation.set(0, 0, 0);
    c.root.removeFromParent(); if (c.hat) c.hat.visible = true; c.torso.visible = true; c.body.visible = true; c.bodyO.visible = true; for (const L of [c.armR, c.armL, c.legR, c.legL]) L.piv.visible = true;
  }
  C.wfoxy.jaw.rotation.x = 0; setXray(C.wfoxy, 0); C.kidghost.ghostMat.opacity = 0.55;
  S.phoneLight2.intensity = 0; S.phoneHandset2.position.set(0, 0.17, 0); S.phoneHandset2.rotation.set(0, 0, 0); S.hallLights2.forEach(l => l.intensity = 3); S.officeLamp2.intensity = 14; S.officeFill2.intensity = 6; S.ventLightL.intensity = 0; S.ventLightR.intensity = 0; S.backDoorLight.intensity = 0; S.backDoorLight.position.set(-4.6, 2.0, -3.8); S.backDoorLight.color.set('#a070ff');
  for (const k of ['q1', 'ex1']) { FX[k].removeFromParent(); FX[k].visible = true; FX[k].scale.setScalar(1); FX[k].rotation.set(0, 0, 0); }
  for (const s of FX.sparkles) s.removeFromParent(); for (const w of FX.waves) w.removeFromParent(); for (const o of FX.orbs) { o.removeFromParent(); o.scale.setScalar(1); }
  FX.sparks.removeFromParent(); FX.cage.removeFromParent(); FX.agony.removeFromParent(); FX.xmark.removeFromParent(); FX.torch.removeFromParent(); FX.torch.target.removeFromParent(); FX.torch.intensity = 0; for (const l of S.hallLamps) { l.intensity = 9; l.color.set('#ffe9c4'); } S.stageSpot.intensity = 40; FX.jsLight.removeFromParent(); FX.jsLight.intensity = 0; FX.fill.removeFromParent(); FX.fill.intensity = 0; FX.like.removeFromParent(); FX.bell.removeFromParent(); FX.tablet.removeFromParent();
  S.voidRim.intensity = 0; S.voidSpot.intensity = 42; S.voidSpot.color.set('#fff4e0'); S.voidFill.intensity = 2.5; S.voidFill.color.set('#7f8cff');
  
  S.partyRed.intensity = 0; animateFire(S, 0, false);
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
  if (out.screen === 'mg') { renderMinigame(out.mg, t, S.screenCanvas, 256, 192, { vw: 160, vh: 120, noCRT: true }); S.screenTex.needsUpdate = true; }
  else if (out.screen !== 'off' || out.scene === S.screenroom) drawScreen(S, out.screen, L, t);
  if (q.get('cam')) { const v = q.get('cam').split(',').map(Number); camera.position.set(v[0], v[1], v[2]); camera.up.set(0, 1, 0); camera.lookAt(v[3], v[4], v[5]); camera.fov = v[6] || 60; out.ui = null; }
  if (S.fanBlades) S.fanBlades.rotation.z = t * 25; S.fan1.rotation.z = t * 25;
  camera.aspect = W / H; camera.updateProjectionMatrix();
  renderPass.scene = out.scene;
  drawUI(out.ui, t); post.uniforms.uiOn.value = out.ui ? 1 : 0; post.uniforms.time.value = t;
  composer.render();
}

window.APP = { ready: true, duration: DURATION, renderAt, shots: SHOTS.map(s => [s.t, s.name]) };
