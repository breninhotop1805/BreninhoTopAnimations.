// EP03 — REAL mirrors (three Reflector = the scene rendered from the mirrored camera), with LAYERS so the reflection can disobey:
//   layer 0 = normal objects (seen by the camera AND in every mirror -> automatic, exact reflection)
//   layer 1 = seen by the camera only (e.g. the boy whose reflection is missing)
//   layer 2 = seen ONLY inside mirrors (the reflection acting on its own: working, waving, walking toward the glass)
// Custom glass shader: slight tint, soft sheen streak, edge darkening, RIPPLE (someone crossing the glass) and FLASH.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { bx, mat, obst } from './kit.js';
export const MIRRORS = [];
const MirrorShader = {
  name: 'MirrorShader',
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, tint: { value: new THREE.Color('#e9f1f4') }, rip: { value: 0 }, ripT: { value: 0 }, ripC: { value: new THREE.Vector2(0.5, 0.45) }, flash: { value: 0 }, sheen: { value: 0.06 }, aspect: { value: 0.5 } },
  vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec2 vL;
    #include <common>
    void main() { vUv = textureMatrix * vec4(position, 1.0); vL = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec3 tint; uniform float rip, ripT, flash, sheen, aspect; uniform vec2 ripC; varying vec4 vUv; varying vec2 vL;
    void main() {
      vec4 uv = vUv; vec2 d = (vL - ripC) * vec2(aspect, 1.0); float r = length(d);
      float wave = rip * sin(r * 46.0 - ripT * 16.0) * exp(-r * 3.2) * smoothstep(ripT * 0.42 + 0.05, ripT * 0.42 - 0.12, r);
      uv.xy += (d / max(r, 1e-3)) * wave * 0.018 * uv.w;
      vec3 c = texture2DProj(tDiffuse, uv).rgb * tint;
      float st = smoothstep(0.0, 0.08, 0.08 - abs(vL.x * 0.7 + vL.y * 0.55 - 0.78)) + 0.6 * smoothstep(0.0, 0.05, 0.05 - abs(vL.x * 0.7 + vL.y * 0.55 - 0.62));
      c += sheen * st;
      vec2 e = min(vL, 1.0 - vL); c *= 0.9 + 0.1 * smoothstep(0.0, 0.08, min(e.x, e.y));
      c += vec3(0.85, 0.92, 1.0) * (abs(wave) * 2.2 + flash);
      gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};
// mirror(parent, { w, h, frame, depth, res, name, standing, scene }) -> group (local +z = the reflecting side). g.m = the Reflector, g.u = uniforms
export function mirror(parent, o = {}) { const g = new THREE.Group(); parent.add(g); const W = o.w || 3.2, H = o.h || 4, fr = o.frame || '#c8a060', T = o.border ?? 0.28;
  if (o.pos) g.position.set(...o.pos); if (o.ry) g.rotation.y = o.ry;
  const res = o.res || 1024; const m = new Reflector(new THREE.PlaneGeometry(W, H), { textureWidth: Math.round(res * Math.min(1, W / H)), textureHeight: Math.round(res * Math.min(1, H / W)), clipBias: 0.003, multisample: 4, shader: MirrorShader });
  m.position.set(0, H / 2, 0.06); m.name = 'espelho'; g.add(m); m.camera.layers.set(0); m.camera.layers.enable(2);
  const u = m.material.uniforms; u.aspect.value = W / H;
  const ob = m.onBeforeRender; m.onBeforeRender = function (...a) { if (!MIRRORS.live) return; ob.apply(this, a); };
  // frame (4 rounded bars) + backing
  for (const [w, h, x, y] of [[W + 2 * T, T, 0, -T / 2], [W + 2 * T, T, 0, H + T / 2], [T, H + 2 * T, -W / 2 - T / 2, H / 2], [T, H + 2 * T, W / 2 + T / 2, H / 2]]) bx(g, w, h, 0.3, fr, x, y, 0.08, { r: 0.08 });
  const back = bx(g, W + 2 * T, H + 2 * T, 0.12, mat('#3a3a40'), 0, H / 2, -0.04, { r: 0.04 });
  if (o.standing) { for (const sx of [-1, 1]) { bx(g, 0.22, 0.22, 1.3, fr, sx * (W / 2 + T / 2), 0.11, 0.55, { r: 0.05 }); /* feet point FORWARD (never into the wall) */ } }
  if (o.scene && o.obst !== false) obst(o.scene, back, o.name || 'espelho');
  g.m = m; g.u = u; g.W = W; g.H = H; MIRRORS.push(g); return g; }
// layer helpers
export function setLayer(obj, n) { obj.traverse(o => { o.layers.set(n); }); }
export function mirrorReset() { for (const g of MIRRORS) { const u = g.u; u.rip.value = 0; u.ripT.value = 0; u.flash.value = 0; u.ripC.value.set(0.5, 0.45); } }
// ripple helper: L = time since the touch, cx/cy in 0..1 of the mirror
export function ripple(g, L, amt = 1, cx = 0.5, cy = 0.45) { if (L < 0) return; g.u.rip.value = amt * Math.exp(-L * 1.6); g.u.ripT.value = L * 2.2; g.u.ripC.value.set(cx, cy); }
