import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { protagonist } from './rbx.js';
import { buildStreet } from './sets.js';
import { loadSubFont, drawSubs } from './subs.js';
import { SHOTS, DURATION, WORDS } from './shots.js';

const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 200);
await loadSubFont();
const S = {}; buildStreet(S);
const C = { heroi: protagonist() };

// ---------- post: AO (contact shadows like the references), depth of field, bloom, grade, subtitles ----------
const composer = new EffectComposer(renderer); const renderPass = new RenderPass(S.street, camera); composer.addPass(renderPass);
const gtao = new GTAOPass(S.street, camera, W, H); gtao.output = GTAOPass.OUTPUT.Default; gtao.blendIntensity = 0.85; gtao.updateGtaoMaterial({ radius: 0.9, distanceExponent: 1.5, thickness: 1.0, scale: 1.2, samples: 12 }); composer.addPass(gtao);
const bokeh = new BokehPass(S.street, camera, { focus: 8, aperture: 0.0012, maxblur: 0.006 }); composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.18, 0.5, 0.92); composer.addPass(bloom);
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, vig: { value: 0.35 }, sat: { value: 1.12 }, fade: { value: 0 }, flash: { value: 0 }, res: { value: new THREE.Vector2(W, H) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float vig, sat, fade, flash; varying vec2 vUv;
    void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(0.299,0.587,0.114)); c = mix(vec3(l), c, sat);
      vec2 d = (vUv-0.5)*vec2(1.0,0.8); c *= clamp(1.0 - vig*dot(d,d)*2.2, 0.0, 1.0); c = mix(c, vec3(1.0), flash); c *= 1.0 - fade; gl_FragColor = vec4(c,1.0); }` });
composer.addPass(new OutputPass()); composer.addPass(grade);
const uiCanvas = document.createElement('canvas'); uiCanvas.width = W; uiCanvas.height = H; const ui = uiCanvas.getContext('2d'); const uiTex = new THREE.CanvasTexture(uiCanvas);
const uiPass = new ShaderPass({ uniforms: { tDiffuse: { value: null }, tUI: { value: uiTex } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse, tUI; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); vec4 u = texture2D(tUI, vUv); gl_FragColor = vec4(c.rgb*(1.0-u.a) + u.rgb, 1.0); }' });
uiPass.uniforms.tUI.value = uiTex; composer.addPass(uiPass);

const ctx = { THREE, C, S, camera };
function resetWorld() { for (const c of Object.values(C)) { c.reset(); c.root.removeFromParent(); c.root.position.set(0, 0, 0); c.root.rotation.set(0, 0, 0); }
  camera.fov = 40; camera.up.set(0, 1, 0); const G = grade.uniforms; G.vig.value = 0.35; G.sat.value = 1.12; G.fade.value = 0; G.flash.value = 0; bloom.strength = 0.18; bokeh.uniforms.aperture.value = 0.0012; }
function renderAt(t) { let i = SHOTS.length - 1; while (i > 0 && SHOTS[i].t > t) i--; const shot = SHOTS[i]; const end = i + 1 < SHOTS.length ? SHOTS[i + 1].t : DURATION; const L = t - shot.t, d = end - shot.t;
  const run = () => { resetWorld(); const out = { scene: S.street, focus: null }; const live = []; shot.fn(Object.assign(ctx, { t, L, d, u: Math.min(1, L / d), out, live, grade: grade.uniforms, bloom })); return out; };
  run(); const cp = camera.position.clone(), cq = camera.quaternion.clone(), cf = camera.fov; const out = run(); camera.position.copy(cp); camera.quaternion.copy(cq); camera.fov = cf;
  for (const c of Object.values(C)) c.applyFace();
  camera.aspect = W / H; camera.updateProjectionMatrix(); renderPass.scene = out.scene; gtao.scene = out.scene; bokeh.scene = out.scene;
  bokeh.uniforms.focus.value = out.focus ?? 8; ui.clearRect(0, 0, W, H); drawSubs(ui, W, H, WORDS, t); uiTex.needsUpdate = true; composer.render(); }
window.APP = { ready: true, duration: DURATION, renderAt };
