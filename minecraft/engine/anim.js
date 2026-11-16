// Utilitários de animação: easing com preparação/overshoot, ciclos de caminhada, piscar, tremida de câmera
import * as THREE from 'three';
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const E = {
  lin: t => t,
  inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  smooth: t => t * t * (3 - 2 * t),
  back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  // preparação (antecipação) + overshoot + acomodação
  anticip: t => { const s = 1.4; return t * t * ((s + 1) * t - s); },
  elastic: t => t === 0 || t === 1 ? t : Math.pow(2, -9 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI / 3)) + 1,
};
export const seg = (u, a, b, e = E.inOut) => e(clamp((u - a) / (b - a)));
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const lv = (a, b, t) => a.clone().lerp(b, t);
// ruído suave 1D (value noise)
function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }
export function noise(t, seed = 0) { const i = Math.floor(t), f = t - i; const u = f * f * (3 - 2 * f); return lerp(hash(i + seed * 31.7), hash(i + 1 + seed * 31.7), u) * 2 - 1; }
// piscar: ~a cada 2,6–4 s, dura 0,12 s
export function blink(t, seed = 0) { let tt = 0.4 + hash(seed) * 1.5; let k = 0; while (tt < t + 1) { if (t >= tt && t < tt + 0.12) return 1; tt += 2.6 + hash(seed + ++k) * 1.4; } return 0; }
// soma de poses (arrays [x,y,z])
export function P(...poses) {
  const o = {};
  for (const p of poses) for (const k in p) {
    if (Array.isArray(p[k])) { o[k] = o[k] || [0, 0, 0]; for (let i = 0; i < 3; i++) o[k][i] += p[k][i] || 0; }
    else if (typeof p[k] === 'number' && (k === 'bob')) o[k] = (o[k] || 0) + p[k];
    else o[k] = p[k];
  }
  return o;
}
// mistura de poses: a -> b por t
export function mixP(a, b, t) {
  const o = {}; const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const va = a[k], vb = b[k];
    if (Array.isArray(va) || Array.isArray(vb)) { const A = va || [0, 0, 0], B = vb || [0, 0, 0]; o[k] = [0, 1, 2].map(i => lerp(A[i] || 0, B[i] || 0, t)); }
    else if (typeof va === 'number' || typeof vb === 'number') o[k] = lerp(va || 0, vb || 0, t);
    else o[k] = t < .5 ? va : vb;
  }
  return o;
}
// respiração / vida (nunca estátua)
export function idle(t, seed = 0, amt = 1) {
  const b = Math.sin(t * 2.2 + seed) * amt;
  return { body: [0.02 * b, 0, 0], head: [0.03 * Math.sin(t * 1.1 + seed) * amt, 0.12 * noise(t * 0.5, seed) * amt, 0.04 * noise(t * 0.4, seed + 3) * amt], rArm: [0.03 * b, 0, -0.06 - 0.02 * b], lArm: [-0.03 * b, 0, 0.06 + 0.02 * b], bob: 0.15 * b };
}
// ciclo de caminhada/corrida (fase em radianos)
export function walk(ph, amp = 0.7, armAmp = 0.6) {
  const s = Math.sin(ph);
  return { rLeg: [s * amp, 0, 0], lLeg: [-s * amp, 0, 0], rArm: [-s * armAmp, 0, -0.06], lArm: [s * armAmp, 0, 0.06], bob: -Math.abs(Math.cos(ph)) * 0.6 * amp };
}
// tremida de câmera
export function shake(cam, t, amp, freq = 22) {
  if (amp <= 0) return;
  cam.position.x += noise(t * freq, 1) * amp; cam.position.y += noise(t * freq, 2) * amp; cam.rotation.z += noise(t * freq, 3) * amp * 0.4;
}
// posiciona câmera olhando para alvo, com roll opcional
export function camLook(cam, pos, target, fov, roll = 0) {
  cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(target); if (roll) cam.rotateZ(roll);
  if (fov && cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
}
// punch-in rápido (~0,25 s) de FOV
export function punch(u, at, amount = 0.25, dur = 0.25) { return 1 - amount * E.out(clamp((u - at) / dur)); }
export function faceTo(from, to) { return Math.atan2(to.x - from.x, to.z - from.z); }
