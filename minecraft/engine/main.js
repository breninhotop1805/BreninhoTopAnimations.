import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const q = new URLSearchParams(location.search);
const W = +q.get('w') || 1080, H = +q.get('h') || 1920;
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const pm = new THREE.PMREMGenerator(renderer);
window.ENV_MAP = pm.fromScene(new RoomEnvironment(), 0.04).texture;

const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
const renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
const bokeh = new BokehPass(renderPass.scene, renderPass.camera, { focus: 5, aperture: 0.0006, maxblur: 0.006 });
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.35, 0.5, 0.88);
composer.addPass(renderPass); composer.addPass(bokeh); composer.addPass(bloom); composer.addPass(new OutputPass());

const out = document.createElement('canvas'); out.width = W; out.height = H;
const octx = out.getContext('2d', { willReadFrequently: true });

const { setup, frame } = await import('./shots.js');
await setup({ renderer, W, H });

window.renderFrame = async (t, mode) => {
  const f = frame(t); // {scene, camera, dof:{focus,aperture}|null, bloom, exposure, hud(g,W,H), fade}
  renderPass.scene = f.scene; renderPass.camera = f.camera;
  bokeh.enabled = !!f.dof;
  if (f.dof) { bokeh.scene = f.scene; bokeh.camera = f.camera; bokeh.uniforms.focus.value = f.dof.focus; bokeh.uniforms.aperture.value = f.dof.aperture; bokeh.uniforms.maxblur.value = f.dof.maxblur ?? 0.008; bokeh.uniforms.nearClip.value = f.camera.near; bokeh.uniforms.farClip.value = f.camera.far; bokeh.uniforms.aspect.value = W / H; }
  bloom.strength = f.bloom ?? 0.35; bloom.threshold = f.bloomThreshold ?? 0.88;
  renderer.toneMappingExposure = f.exposure ?? 1;
  composer.render();
  octx.globalAlpha = 1; octx.drawImage(renderer.domElement, 0, 0);
  if (f.hud) { octx.save(); f.hud(octx, W, H); octx.restore(); }
  if (f.fade) { octx.fillStyle = f.fadeColor || '#000'; octx.globalAlpha = f.fade; octx.fillRect(0, 0, W, H); octx.globalAlpha = 1; }
  if (mode === 'png') { const b = await new Promise(r => out.toBlob(r, 'image/png')); await fetch('/still', { method: 'POST', body: b }); }
  else { const d = octx.getImageData(0, 0, W, H).data; await fetch('/frame', { method: 'POST', body: d }); }
};
window.READY = true;

// ---- Checagem automática de atravessamento (OBB / SAT) -------------------
import('./shots.js').then(async ({ frame, SETS }) => {
  const { obbOf, sat } = await import('./collide.js');
  const parts = ch => { const P = {}; const first = g => g.children.find(c => c.isMesh);
    P.torso = first(ch.torsoG); P.head = first(ch.headG); P.rArm = first(ch.rSh.userData.inner); P.lArm = first(ch.lSh.userData.inner); P.rLeg = first(ch.rHip.userData.inner); P.lLeg = first(ch.lHip.userData.inner); return P; };
  window.checkFrame = (t) => {
    const f = frame(t); f.scene.updateMatrixWorld(true);
    const { OW, CV } = SETS(); const chars = [];
    for (const S of [OW, CV]) for (const k of ['phil', 'z1', 'z2', 'bz']) if (S[k] && S[k].root.visible && S[k].root.parent === f.scene) chars.push([k, S[k]]);
    const out = []; const sh = 0.01; // ~0,2 px de tolerância
    for (const [n, ch] of chars) {
      const P = parts(ch); const O = {}; for (const k in P) O[k] = obbOf(P[k], sh, k.endsWith('Arm') ? 3 : k.endsWith('Leg') ? 1 : 0);
      for (const arm of ['rArm', 'lArm']) { if (sat(O[arm], O.torso)) out.push(`${n}.${arm}~torso`); if (sat(O[arm], O.head)) out.push(`${n}.${arm}~head`); for (const leg of ['rLeg', 'lLeg']) if (sat(O[arm], O[leg])) out.push(`${n}.${arm}~${leg}`); }
      if (sat(O.rLeg, O.lLeg)) out.push(`${n}.legs`);
    }
    for (let i = 0; i < chars.length; i++) for (let j = i + 1; j < chars.length; j++) {
      const A = parts(chars[i][1]), B = parts(chars[j][1]);
      for (const a in A) for (const b in B) if (sat(obbOf(A[a], 0.02), obbOf(B[b], 0.02))) out.push(`${chars[i][0]}.${a}~${chars[j][0]}.${b}`);
    }
    return { shot: f.shot, hits: out };
  };
});
