// Shot list for "O segredo do Blob (FNAF Security Breach)". Pure function of time.
import * as THREE from 'three';
import { rng } from './sets.js';

const V3 = THREE.Vector3;
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = x => { x = cl(x); return x * x * (3 - 2 * x); };
const eio = x => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eo = x => { x = cl(x); return 1 - Math.pow(1 - x, 3); };
const ei = x => { x = cl(x); return x * x * x; };
const back = x => { x = cl(x); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const seg = (t, a, b) => cl((t - a) / (b - a));
const mix = (a, b, k) => a + (b - a) * k;
const mixv = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const DOWN = new V3(0, -1, 0);

function cam(x, p, l, fov) { x.camera.position.set(...p); x.camera.up.set(0, 1, 0); x.camera.lookAt(...l); if (fov) x.camera.fov = fov; }
function camMove(x, p0, l0, p1, l1, e = eo, fov0, fov1) { const k = e(x.u); cam(x, mixv(p0, p1, k), mixv(l0, l1, k)); if (fov0) x.camera.fov = mix(fov0, fov1 ?? fov0, k); }
function hand(x, amp = 1) { // subtle handheld wobble (rotation)
  const t = x.t, c = x.camera;
  c.rotateX(amp * 0.006 * (Math.sin(t * 1.9) + 0.5 * Math.sin(t * 3.7 + 1)));
  c.rotateY(amp * 0.006 * (Math.sin(t * 1.4 + 2) + 0.5 * Math.sin(t * 3.1)));
  c.rotateZ(amp * 0.004 * Math.sin(t * 1.1 + 4));
}
function shake(x, amp) { const t = x.t, c = x.camera; c.rotateX(amp * 0.03 * Math.sin(t * 61)); c.rotateY(amp * 0.03 * Math.sin(t * 47 + 1)); c.rotateZ(amp * 0.02 * Math.sin(t * 53 + 2)); }

function put(x, name, scene, px, py, pz, ry = 0, s = 1) {
  const c = x.C[name]; scene.add(c.root); c.root.position.set(px, py, pz); c.root.rotation.set(0, ry, 0); c.root.scale.setScalar(s * (c.baseScale || 1)); c.root.visible = true; return c;
}
function rootPt(c, a, b, d) { c.root.updateMatrixWorld(true); return c.root.localToWorld(new V3(a, b, d)); }
function aim(c, side, wp, w = 1) {
  if (w <= 0) return; const arm = side === 'R' ? c.armR : c.armL; c.root.updateMatrixWorld(true);
  const local = c.torso.worldToLocal(wp.clone()).sub(arm.piv.position).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(DOWN, local); arm.piv.quaternion.slerp(q, cl(w));
}
function lookAtCam(x, c, w = 1, dyaw = 0, dpitch = 0) {
  c.root.updateMatrixWorld(true); const hp = c.neck.getWorldPosition(new V3()); const cp = x.camera.position;
  const s = c.root.scale.x; const dx = cp.x - hp.x, dz = cp.z - hp.z, dy = cp.y - (hp.y + 0.25 * s);
  const yaw = wrap(Math.atan2(dx, dz) - c.root.rotation.y - c.torso.rotation.y) + dyaw;
  const pitch = cl(-Math.atan2(dy, Math.hypot(dx, dz)), -0.6, 0.6) + dpitch;
  c.head.rotation.y = mix(c.head.rotation.y, cl(yaw, -1.2, 1.2), w); c.head.rotation.x = mix(c.head.rotation.x, pitch, w);
}
// Beak: blend between face anchor (w=0) and hand anchor (w=1)
function beakBlend(x, w) {
  const c = x.C.chica; if (w <= 0) return; c.root.updateMatrixWorld(true);
  const a = c.beakHeadAnchor, b = c.beakHandAnchor;
  const pa = a.getWorldPosition(new V3()), pb = b.getWorldPosition(new V3());
  const qa = a.getWorldQuaternion(new THREE.Quaternion()), qb = b.getWorldQuaternion(new THREE.Quaternion());
  const bk = c.beak; bk.removeFromParent(); x.out.scene.add(bk);
  bk.position.lerpVectors(pa, pb, cl(w)); bk.quaternion.slerpQuaternions(qa, qb, cl(w)); bk.scale.setScalar(c.root.scale.x);
}
function beakFree(x, p, r) { const bk = x.C.chica.beak; bk.removeFromParent(); x.out.scene.add(bk); bk.position.set(...p); bk.rotation.set(...r); bk.scale.setScalar(1); }
function noBeak(x) { x.C.chica.setBeak(false); x.C.chica.beak.visible = false; }

// Pull the beak off the face. L = time since the action starts, k = slowness factor.
function removeBeak(x, c, L, k = 1, opts = {}) {
  const s = v => v * k;
  if (L < 0) return;
  const reach = eio(seg(L, 0, s(0.3))), pull = eio(seg(L, s(0.38), s(0.62))), out = opts.throw ? eio(seg(L, s(0.62), s(0.85))) : 0;
  const hold = opts.hold ? eio(seg(L, s(0.7), s(1.0))) : 0;
  c.head.rotation.x += -0.14 * pull * (1 - out) + 0.06 * out; c.head.rotation.z += 0.09 * pull * (1 - hold);
  c.torso.rotation.x += -0.04 * pull;
  c.root.updateMatrixWorld(true);
  const fwd = new V3(0, 0, 1).applyQuaternion(c.root.quaternion);
  const tGrab = c.beakHeadAnchor.getWorldPosition(new V3()).addScaledVector(fwd, 0.1 * c.root.scale.x);
  const tPull = rootPt(c, -0.3, 1.62, 0.8), tOut = rootPt(c, -1.1, 1.0, 0.25), tHold = rootPt(c, -0.55, 1.3, 0.5);
  const target = tGrab.clone().lerp(tPull, pull).lerp(tOut, out).lerp(tHold, hold);
  aim(c, 'R', target, reach);
  if (L >= s(0.42)) c.setBeak(false);
  const w = sm(seg(L, s(0.3), s(0.44)));
  if (opts.throw && L > s(0.82)) c.beak.visible = false; else beakBlend(x, w);
}

function pop(x, obj, scene, p, a, s = 1, bob = true) {
  if (x.L < a) return; scene.add(obj); const k = back(seg(x.L, a, a + 0.28));
  obj.scale.setScalar(s * k); obj.position.set(p[0], p[1] + (bob ? 0.03 * Math.sin((x.L - a) * 6) : 0), p[2]); obj.quaternion.copy(x.camera.quaternion);
}
function headTop(c, up = 0.55) { c.root.updateMatrixWorld(true); return c.neck.getWorldPosition(new V3()).add(new V3(0, up * c.root.scale.x, 0)).toArray(); }
function sparkles(x, scene, center, rad, n = 6, s = 1) {
  for (let i = 0; i < n; i++) { const sp = x.FX.sparkles[i]; const ph = x.t * 1.6 + i * 1.7; const a = i * 2.39 + x.t * 0.6;
    sp.position.set(center[0] + Math.cos(a) * rad, center[1] + Math.sin(a * 1.3) * rad * 0.7, center[2] + Math.sin(a) * rad * 0.4);
    sp.scale.setScalar(s * Math.max(0, Math.sin(ph)) ** 1.5); sp.quaternion.copy(x.camera.quaternion); sp.rotateZ(x.t * 2 + i); scene.add(sp); }
}
function staticIn(x, len = 0.22, base = 0) { x.post.stat.value = Math.max(base, 1 - seg(x.L, 0, len)); }
function idleAll(x, list) { list.forEach((n, i) => x.C[n].idle(x.t, 1, i * 1.7)); }
function stageChars(x, chicaBeak = true) {
  const s = x.S.stage; put(x, 'bonnie', s, -1.3, 0.65, -1.7, 0.12); put(x, 'freddy', s, 0, 0.65, -1.9); put(x, 'chica', s, 1.3, 0.65, -1.7, -0.12);
  if (!chicaBeak) noBeak(x);
}
function walkTo(c, p0, p1, k, stride = 1.15) { const d = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]); c.root.position.set(mix(p0[0], p1[0], k), mix(p0[1], p1[1], k), mix(p0[2], p1[2], k)); c.walk(d * k / stride, 1); }
function flicker(t, seed = 0) { const a = Math.sin(t * 37 + seed) + Math.sin(t * 23.3 + seed * 2) + Math.sin(t * 71.1); return a > 2.0 ? 0.15 : a > 1.6 ? 0.55 : 1; }

// ---------- helpers specific to this video ----------
const PIX = x => 9 * x.post.res.value.x / 1080; // minigame pixel size, resolution independent
function proj(x, wp) { x.camera.updateMatrixWorld(); x.camera.updateProjectionMatrix(); const p = wp.clone().project(x.camera); return [(p.x + 1) / 2, (1 - p.y) / 2]; }
function chest(c, up = 0.3) { c.root.updateMatrixWorld(true); return c.torso.localToWorld(new V3(0, 7 * x_U, 2.2 * x_U)); }
const x_U = 1 / 16;
function orbAt(x, i, scene, p, s = 1) { const o = x.FX.orbs[i]; scene.add(o); o.position.copy(p); o.scale.setScalar(s * (1 + 0.12 * Math.sin(x.t * 9 + i))); o.userData.halo.material.opacity = 0.45; return o; }
function bez(a, b, c, k) { return a.clone().multiplyScalar((1 - k) * (1 - k)).add(b.clone().multiplyScalar(2 * (1 - k) * k)).add(c.clone().multiplyScalar(k * k)); }
function lie(x, name, scene, px, pz, ry, s = 0.72) { const c = put(x, name, scene, px, 0.09, pz, 0, s); c.root.rotation.set(-Math.PI / 2, 0, ry, 'YXZ'); c.root.rotation.set(-Math.PI / 2, ry, 0, 'YXZ');
  c.armR.piv.rotation.z = -0.5; c.armL.piv.rotation.z = 0.6; c.legR.piv.rotation.z = -0.12; c.legL.piv.rotation.z = 0.15; c.head.rotation.y = 0.4; return c; }
function droop(c, k) { c.head.rotation.x += 0.55 * k; c.torso.rotation.x += 0.12 * k; c.armR.piv.rotation.z += 0.08 * k; c.armL.piv.rotation.z -= 0.08 * k; }
function screenCam(x, center, d0, d1, side = 0.15, fov = 55) { const k = eio(x.u); const d = mix(d0, d1, k); cam(x, [center.x + side * d, center.y + 0.06 * d, center.z + d], [center.x, center.y, center.z], fov); }
function sparksAt(x, scene, p, b, n = 26) { const g = x.FX.sparks; scene.add(g); g.position.copy(p);
  g.children.forEach((m, i) => { const d = m.userData.dir; const tt = Math.max(0, b); m.visible = b > 0 && b < 0.7; m.position.set(d.x * tt * 0.9, d.y * tt * 0.9 - 2.2 * tt * tt, d.z * tt * 0.9); }); }

// --------------------------------------------------------------------------------------
// ---------- helpers for this video ----------
function guardSit(x, scene, z = 0.15) { const g = put(x, 'guard', scene, 0, -0.02, z, Math.PI); g.legR.piv.rotation.x = -1.5; g.legL.piv.rotation.x = -1.5; g.armR.piv.rotation.x = -1.1; g.armL.piv.rotation.x = -1.1; g.idle(x.t, 1); return g; }
function logoCard(x, i) { const L = x.L; x.out.ui = { type: 'logo', i, k: 0.7 + 0.3 * back(seg(L, 0, 0.35)), a: Math.min(1, L / 0.12) * (1 - seg(L, x.d - 0.1, x.d)) }; x.post.vig.value = 0.9; }
// lunge at the camera: character placed in front of cam, rushing in, jaw open, shake/flash/static
function jumpscare(x, c, L, opts = {}) {
  const k = eo(seg(L, 0, 0.18)); const fwd = new V3(); x.camera.getWorldDirection(fwd);
  const base = x.camera.position.clone().addScaledVector(fwd, mix(opts.from || 2.6, opts.to || 1.5, k));
  x.out.scene.add(x.FX.jsLight); x.FX.jsLight.position.copy(x.camera.position).add(new V3(0.15, 0.35, 0)); x.FX.jsLight.intensity = (opts.js || 1.2) * k;
  c.root.position.set(base.x, base.y - (opts.headY || 1.75) * c.root.scale.x, base.z);
  c.root.rotation.y = Math.atan2(-fwd.x, -fwd.z);
  aim(c, 'R', rootPt(c, -0.35, 1.8, 0.9), k); aim(c, 'L', rootPt(c, 0.35, 1.8, 0.9), k);
  c.head.rotation.x = -0.15 * k + 0.08 * Math.sin(L * 45) * k; c.head.rotation.z = 0.1 * Math.sin(L * 37) * k; c.torso.rotation.x = 0.2 * k;
  if (c.jaw) c.jaw.rotation.x = 0.75 * k + 0.12 * Math.sin(L * 50) * k;
  if (L > 0.1) shake(x, 1.3 * (1 - seg(L, 0.1, 0.9)));
  x.post.flash.value = L > 0.12 && L < 0.22 ? 0.3 : 0; x.post.chroma.value = 0.8 * k;
  if (opts.js < 1) { x.bloom.strength = 0.06; x.post.tint.value.set(0.72, 0.72, 0.76); }
  x.post.stat.value = L > (opts.statAt || 0.85) ? 0.7 : (L > 0.14 && L < 0.2 ? 0.4 : 0);
}
function fillOn(x, c, I = 3, h = 1.6) { const p = c.root.position; const cp = x.camera.position; x.out.scene.add(x.FX.fill); x.FX.fill.position.set(mix(p.x, cp.x, 0.45), p.y + h, mix(p.z, cp.z, 0.45)); x.FX.fill.intensity = I; }
function silhouette(x, scene, name, col, ry = 0) { const c = put(x, name, scene, 0, 0, 0, ry); return c; }
function stopwatch(x, v, red = false) { x.out.ui = { type: 'stopwatch', v, red }; }

const shots = [];
const at = (t, name, fn) => shots.push({ t, name, fn });
// ---------- helpers for the Blob video ----------
function headOnly(c) { c.body.visible = false; c.bodyO.visible = false; for (const L of [c.armR, c.armL, c.legR, c.legL]) L.piv.visible = false; }
const MASKS = [['chicaB', 'chica', 0.25, 0.1], ['babyB', 'baby', -0.2, -0.15], ['puppetB', 'puppet', 0.05, 0.08], ['ffoxyB', 'ffoxy', -0.5, 0.2]];
function blobMasks(x, tilt = 1) { const B = x.S.blob, A = B.userData.anchors; B.updateMatrixWorld(true);
  return MASKS.map(([n, an, ry, rz], i) => { const a = A[an]; const c = x.C[n]; B.add(c.root); headOnly(c); c.root.position.set(0, 0, 0); c.root.rotation.set(0, ry, 0); c.root.scale.setScalar(1); c.root.updateMatrixWorld(true);
    const hp = c.head.localToWorld(new V3(0, 4 / 16, 0)); const lp = B.worldToLocal(hp); c.root.position.set(a.x - lp.x, a.y - lp.y, a.z - lp.z - 0.12);
    c.head.rotation.z = rz * tilt; c.head.rotation.x = 0.08 * Math.sin(x.t * 1.3 + i) * tilt; return c; }); }
function maskPt(x, an) { x.S.blob.updateMatrixWorld(true); return x.S.blob.localToWorld(x.S.blob.userData.anchors[an].clone()); }
function ugBase(x, amt = 1) { const s = x.S.ug; x.out.scene = s; x.animateBlob(x.S.blob, x.t, amt); blobMasks(x); x.S.ugRed.forEach((l, i) => l.intensity = 14 * (0.75 + 0.25 * Math.sin(x.t * 3 + i))); x.post.vig.value = 0.85; return s; }
function maskCam(x, an, d0, d1, side = 0.12, up = 0.05, fov = 40, e = eo) { const p = maskPt(x, an); const k = e(x.u); const d = mix(d0, d1, k); cam(x, [p.x + side * d, p.y + up * d, p.z + d], [p.x, p.y, p.z], fov); }
function torch(x, s, from, to, I = 40) { const l = x.FX.torch; s.add(l, l.target); l.position.copy(from); l.target.position.copy(to); l.intensity = I; }
function lensOn(x, wps, r, a, mark) { if (!Array.isArray(wps)) wps = [wps]; const P = wps.map(w => proj(x, w)); const u = P.reduce((s, p) => s + p[0], 0) / P.length, v = Math.min(...P.map(p => p[1]));
  x.out.ui = { type: 'lens', pts: P.map(([a1, b1]) => [a1, b1, r]), a, mark: mark ? [u, v - r * 1.25 * 9 / 16, mark === 'ok'] : null }; }
function agonyAt(x, s, center, rad = 1, inward = 0) { const g = x.FX.agony; s.add(g); g.position.copy(center);
  g.children.forEach(m => { const d = m.userData; const k = (x.t * d.sp * 0.5 + d.ph) % 1; const rr = d.rr * rad * (inward ? (1 - k) : 1); const a = d.a + x.t * d.sp * 1.4;
    m.position.set(Math.cos(a) * rr, d.y * rad * 0.8 * (inward ? (1 - k * 0.5) : 1) + 0.2 * Math.sin(x.t * 2 + d.ph * 6), Math.sin(a) * rr); m.scale.setScalar(d.sz * (1.2 - 0.6 * k)); m.rotation.set(x.t * d.sp, x.t, 0); }); }
function orbsAt(x, s, pts, sc = 1) { pts.forEach((p, i) => { const o = x.FX.orbs[i]; s.add(o); o.position.copy(p); o.scale.setScalar(sc * (1 + 0.12 * Math.sin(x.t * 9 + i))); if (o.userData.halo) o.userData.halo.material.opacity = 0.45; }); }
function shrug(c, k) { c.armR.piv.rotation.x = -0.6 * k; c.armL.piv.rotation.x = -0.6 * k; c.armR.piv.rotation.z = -0.7 * k; c.armL.piv.rotation.z = 0.7 * k; c.head.rotation.z = 0.15 * k; }
function freddyBy(x, s, p, ry) { const f = put(x, 'gfreddy', s, p[0], 0, p[2], ry); f.idle(x.t, 1, 3); return f; }

// ===== HOOK =====
// "Você foi enganado pelo monstro gigante"
at(0.00, 'blob_reveal', x => {
  const s = ugBase(x, 1.3); camMove(x, [1.4, 0.35, 4.2], [0, 2.4, -3.2], [0.6, 1.4, 3.0], [0, 2.3, -3.2], eo, 50); hand(x); staticIn(x, 0.18);
  if (x.L < 0.12) shake(x, 0.5);
});
// "de FNAF Security Breach"
at(1.88, 'plex_sign', x => { const s = x.S.plex; x.out.scene = s; const k = eio(x.u); cam(x, [mix(-2.5, 1.5, k), mix(2.0, 3.2, k), mix(4.5, 3.0, k)], [0, mix(5.6, 6.3, k), -9.9], 52); x.post.vig.value = 0.8; staticIn(x, 0.12); });
// "esse tempo todo."
at(3.24, 'greg_fooled', x => {
  const s = ugBase(x); const g = put(x, 'gregory', s, 0.3, 0, 2.6, Math.PI + 0.2); g.idle(x.t, 1); g.head.rotation.x = -0.35; g.head.rotation.y = 0.5 * eo(seg(x.L, 0.3, 0.7));
  const a = 0.5 - 0.7 * x.u; cam(x, [0.3 + Math.sin(a) * 2.6, 1.25, 2.6 + Math.cos(a) * 2.6], [0.3, 1.45, 2.6], 46); hand(x); pop(x, x.FX.ex1, s, headTop(g, 0.75), 0.4, 0.4); fillOn(x, g, 2.5, 1.8);
});
// "Quando a gente dá de cara com o Blob"
at(4.34, 'face_to_face', x => {
  const s = ugBase(x); const g = put(x, 'gregory', s, 0.4, 0, 7, Math.PI); walkTo(g, [0.4, 0, 7], [0.2, 0, 3.4], eo(seg(x.L, 0, 1.0)), 0.9); g.head.rotation.x = -0.3 * seg(x.L, 0.8, 1.2);
  camMove(x, [0.9, 1.5, 9.5], [0, 2.0, -3], [0.7, 1.4, 6.0], [0, 2.3, -3], eio, 48); hand(x); fillOn(x, g, 3, 1.8);
});
// "no subsolo da Pizzaplex,"
at(5.80, 'subsolo', x => {
  const s = ugBase(x); const g = put(x, 'gregory', s, 0.2, 0, 3.2, Math.PI); g.idle(x.t, 1); g.head.rotation.x = -0.35; const f = freddyBy(x, s, [-0.9, 0, 3.6], Math.PI - 0.1); f.head.rotation.x = -0.3;
  camMove(x, [5.5, 6.8, 9], [0, 1.5, -1.5], [4.2, 5.2, 7.8], [0, 1.6, -1.8], eo, 46); hand(x, 0.5);
});
// "logo reconhecemos as máscaras"
at(7.40, 'masks_pan', x => {
  const s = ugBase(x, 0.6); const k = eio(x.u); cam(x, [mix(-2.2, 2.4, k), 2.1, 1.9], [mix(-1.3, 1.6, k), 2.0, -1.8], 44); hand(x);
});
// "da Chica,"
at(8.84, 'm_chica', x => { ugBase(x, 0.5); maskCam(x, 'chica', 1.6, 1.25, -0.2); hand(x); x.out.scene.add(x.FX.fill); x.FX.fill.position.copy(maskPt(x, 'chica')).add(new V3(0, 0.4, 1.0)); x.FX.fill.intensity = 0.7; });
// "da Circus Baby"
at(9.48, 'm_baby', x => { ugBase(x, 0.5); maskCam(x, 'baby', 1.6, 1.2, 0.2); hand(x); x.out.scene.add(x.FX.fill); x.FX.fill.position.copy(maskPt(x, 'baby')).add(new V3(0, 0.4, 1.0)); x.FX.fill.intensity = 0.7; });
// "e da Puppet."
at(10.44, 'm_puppet', x => { ugBase(x, 0.5); maskCam(x, 'puppet', 1.7, 1.3, -0.1, 0.1); hand(x); x.out.scene.add(x.FX.fill); x.FX.fill.position.copy(maskPt(x, 'puppet')).add(new V3(0, 0.4, 1.0)); x.FX.fill.intensity = 0.5; });

// ===== THE OBVIOUS THEORY =====
// "A primeira coisa que vem na cabeça"
at(11.34, 'think', x => {
  const s = ugBase(x); const g = put(x, 'gregory', s, 0.2, 0, 3.0, 0.3); g.idle(x.t, 1); aim(g, 'R', rootPt(g, -0.2, 1.95, 0.25), eo(seg(x.L, 0.1, 0.4))); g.head.rotation.z = 0.15;
  const f = freddyBy(x, s, [-0.85, 0, 3.2], 0.5); f.head.rotation.y = 0.5;
  camMove(x, [0.5, 1.9, 6.6], [-0.3, 1.55, 3.0], [0.4, 1.9, 6.0], [-0.3, 1.6, 3.0], eo, 44); hand(x); pop(x, x.FX.q1, s, headTop(g, 0.75), 0.3, 0.4);
});
// "é que as almas originais se juntaram"
at(12.94, 'souls_join', x => {
  const s = ugBase(x, 0.8); const k = eio(seg(x.L, 0, 1.3)); const tg = ['chica', 'baby', 'puppet', 'ffoxy'].map(n => maskPt(x, n));
  orbsAt(x, s, tg.map((p, i) => new V3(mix(-3 + i * 2, p.x, k), mix(4.5 - (i % 2), p.y, k) + 0.3 * Math.sin(x.t * 3 + i) * (1 - k), mix(2.5, p.z + 0.3, k))), 1 - 0.5 * seg(x.L, 1.3, 1.56));
  cam(x, [0, 2.2, 4.6], [0, 2.1, -2], 50); hand(x); sparkles(x, s, [0, 2.4, -1.4], 1.6, 6, 1.2);
});
// "para uma última vingança."
at(14.50, 'revenge', x => {
  const s = ugBase(x, 2.2); const L = x.L; const k = back(seg(L, 0.15, 0.55)); x.S.blob.position.z = -3.2 + 0.9 * k; x.S.blob.scale.setScalar(1 + 0.06 * k);
  const g = put(x, 'gregory', s, 0.2, 0, mix(2.8, 3.6, eo(seg(L, 0.2, 0.6))), Math.PI); g.walk(-L * 2, 1); g.armR.piv.rotation.x = -1.2; g.armL.piv.rotation.x = -1.0;
  cam(x, [0.8, 0.5, 6.2], [0, 2.2, -1], 52); if (L > 0.15 && L < 0.8) shake(x, 0.7); x.post.flash.value = L > 0.15 && L < 0.22 ? 0.3 : 0; x.S.ugRed.forEach(l => l.intensity = 16);
});

// ===== THE DETAIL =====
// "Mas tem um detalhe bizarro"
at(15.88, 'detail', x => {
  const s = ugBase(x, 0); const L = x.L; const z = eo(seg(L, 0.05, 0.3)); const p = maskPt(x, 'baby'); cam(x, [mix(1.5, p.x + 0.2, z), mix(1.8, p.y, z), mix(4.5, p.z + 1.3, z)], [p.x, p.y, p.z], mix(50, 38, z));
  x.post.tint.value.set(0.72, 0.72, 0.75); x.post.stat.value = L < 0.12 ? 0.6 : 0; if (L < 0.3) shake(x, 0.4);
});
// "que quase ninguém notou."
at(17.38, 'nobody', x => {
  const s = ugBase(x, 0.4); const g = put(x, 'gregory', s, 0.5, 0, mix(3.4, 2.4, x.u), Math.PI); g.walk(x.L * 1.2, 0.6); aim(g, 'R', rootPt(g, -0.3, 1.5, 1.2), 1);
  torch(x, s, rootPt(g, -0.25, 1.45, 0.4), maskPt(x, 'baby'), 25);
  cam(x, [1.3, 1.85, mix(5.0, 4.2, x.u)], [0.2, 1.8, -1.5], 46); hand(x); x.S.ugKey.intensity = 22;
});
// "Olha bem de perto para a máscara da Circus Baby"
at(18.74, 'baby_close', x => {
  ugBase(x, 0.4); maskCam(x, 'baby', 2.6, 1.15, 0.15, 0.03, 40, eio); hand(x, 0.6); torch(x, x.S.ug, x.camera.position.clone().add(new V3(0.2, 0.1, 0)), maskPt(x, 'baby'), 3); x.S.ugKey.intensity = 20;
  if (x.L > 1.6) lensOn(x, maskPt(x, 'baby'), 0.36, eo(seg(x.L, 1.6, 1.9)));
});
// "grudada no monstro."
at(21.28, 'baby_side', x => {
  ugBase(x, 0.8); const p = maskPt(x, 'baby'); cam(x, [p.x + 1.5, p.y + 0.4, p.z + 0.6], [p.x - 0.2, p.y - 0.1, p.z], 44); hand(x); torch(x, x.S.ug, new V3(p.x + 1.2, p.y + 0.6, p.z + 1.2), p, 4);
});
// "Os olhos delas estão totalmente apagados."
at(22.04, 'eyes_compare', x => {
  const L = x.L;
  if (L < 1.0) { const s = x.S.void; x.out.scene = s; const c = put(x, 'baby', s, 0, 0, 0, 0); c.idle(x.t, 0.5); c.head.updateMatrixWorld(true); const hp = c.head.localToWorld(new V3(0, 4 / 16, 0)); cam(x, [hp.x, hp.y + 0.02, hp.z + 1.45], [hp.x, hp.y, hp.z], 40); x.S.voidSpot.intensity = 16;
    lensOn(x, [c.head.localToWorld(new V3(-1.75 / 16, 4.4 / 16, 4.3 / 16)), c.head.localToWorld(new V3(1.75 / 16, 4.4 / 16, 4.3 / 16))], 0.16, eo(seg(L, 0.1, 0.35)), L > 0.4 ? 'ok' : null); }
  else { ugBase(x, 0.3); const p = maskPt(x, 'baby'); cam(x, [p.x + 0.05, p.y, p.z + 1.15], [p.x, p.y - 0.02, p.z], 40); torch(x, x.S.ug, new V3(p.x + 0.2, p.y + 0.3, p.z + 1.3), p, 3);
    x.C.babyB.head.updateMatrixWorld(true); lensOn(x, [x.C.babyB.head.localToWorld(new V3(-1.75 / 16, 4.4 / 16, 4.3 / 16)), x.C.babyB.head.localToWorld(new V3(1.75 / 16, 4.4 / 16, 4.3 / 16))], 0.16, eo(seg(L, 1.05, 1.3)), L > 1.4 ? 'no' : null); x.post.stat.value = L < 1.06 ? 0.5 : 0; }
});

// ===== THE PROOF =====
// "E a prova definitiva,"
at(24.22, 'proof', x => {
  const s = ugBase(x, 0.5); const g = put(x, 'gregory', s, -0.3, 0, 2.6, Math.PI); g.idle(x.t, 1); const sw = Math.sin(x.L * 3.2) * 1.4;
  aim(g, 'R', rootPt(g, -0.3 + sw * 0.4, 1.6, 1.2), 1); torch(x, s, rootPt(g, -0.25, 1.45, 0.4), new V3(sw, 1.8, -1.6), 25);
  cam(x, [-1.6, 1.2, 4.6], [0, 1.9, -1.5], 48); hand(x); x.S.ugKey.intensity = 22;
});
// "olha bem para o rosto da Puppet no meio daqueles fios."
at(25.38, 'puppet_push', x => {
  ugBase(x, 0.5); const L = x.L; if (L < 1.2) maskCam(x, 'puppet', 2.6, 1.3, -0.25, 0.1, 44, eo); else { const p = maskPt(x, 'puppet'); const k = eio(seg(L, 1.2, x.d)); cam(x, [p.x + 0.4 - 0.35 * k, p.y + 0.25, p.z + mix(1.6, 1.2, k)], [p.x, p.y, p.z], 40); }
  hand(x, 0.6); torch(x, x.S.ug, x.camera.position.clone().add(new V3(0.2, 0.2, 0)), maskPt(x, 'puppet'), 0.8); x.S.ugKey.intensity = 20; x.S.ugFill.intensity = 4;
});
// "Cadê as famosas lágrimas roxas dela?"
at(27.84, 'tears_compare', x => {
  const L = x.L;
  if (L < 1.3) { const s = x.S.void; x.out.scene = s; const c = put(x, 'puppet', s, 0, 0, 0, 0); c.idle(x.t, 0.4); c.head.updateMatrixWorld(true); const hp = c.head.localToWorld(new V3(0, 4 / 16, 0));
    cam(x, [hp.x, hp.y, hp.z + 1.3], [hp.x, hp.y, hp.z], 40); x.S.voidSpot.intensity = 12; x.S.voidRim.intensity = 8; x.S.voidRim.color.set('#a050ff');
    lensOn(x, [c.head.localToWorld(new V3(-2.5 / 16, 2.6 / 16, 5.3 / 16)), c.head.localToWorld(new V3(2.5 / 16, 2.6 / 16, 5.3 / 16))], 0.15, eo(seg(L, 0.15, 0.45)), L > 0.55 ? 'ok' : null); }
  else { ugBase(x, 0.3); const p = maskPt(x, 'puppet'); cam(x, [p.x, p.y, p.z + 1.3], [p.x, p.y, p.z], 40); torch(x, x.S.ug, new V3(p.x + 0.2, p.y + 0.3, p.z + 1.4), p, 0.8); x.S.ugFill.intensity = 4;
    x.C.puppetB.head.updateMatrixWorld(true); lensOn(x, [x.C.puppetB.head.localToWorld(new V3(-2.5 / 16, 2.6 / 16, 5.3 / 16)), x.C.puppetB.head.localToWorld(new V3(2.5 / 16, 2.6 / 16, 5.3 / 16))], 0.15, eo(seg(L, 1.35, 1.6)), L > 1.75 ? 'no' : null); x.post.stat.value = L < 1.36 ? 0.5 : 0; }
});
// "Ela sempre foi uma grande marca de que a alma de Charlotte estava ali."
at(30.54, 'charlotte', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L; const p = put(x, 'puppet', s, 0, 0, 0, 0); p.idle(x.t, 0.6);
  const ch = put(x, 'charlotte', s, 0, 0, 0.05, 0, 0.62); ch.idle(x.t, 1); ch.root.position.y = 0.5 + 0.6 * eo(seg(L, 0.3, 1.6)); x.C.charlotte.ghostMat.opacity = 0.5 * sm(seg(L, 0.2, 0.8));
  orbsAt(x, s, [new V3(0, 1.75 + 0.1 * Math.sin(x.t * 2), 0.4)], 1.2 * sm(seg(L, 1.2, 1.8)));
  camMove(x, [1.4, 1.6, 3.6], [0, 1.6, 0], [0.4, 1.9, 2.6], [0, 1.8, 0], eio, 46); x.S.voidSpot.intensity = 22; x.S.voidRim.intensity = 12; x.S.voidRim.color.set('#b070ff'); x.post.vig.value = 0.95;
  sparkles(x, s, [0, 1.8, 0.2], 0.8, 6, 0.8);
});
// "Sabe o que isso significa?"
at(33.74, 'means', x => {
  const s = ugBase(x, 0.5); const L = x.L; const g = put(x, 'gregory', s, 0.35, 0, 3.0, -1.0); g.idle(x.t, 1); const f = freddyBy(x, s, [-0.55, 0, 3.0], 1.0); f.head.rotation.x = 0.25;
  if (L < 0.7) cam(x, [1.2, 1.8, 5.8], [-0.1, 1.7, 3.0], 42); else cam(x, [1.9, 1.5, 4.6], [-0.2, 1.75, 3.0], 44); hand(x); fillOn(x, g, 2, 1.8);
});
// "Que as crianças originais não estão mais lá."
at(35.14, 'not_there', x => {
  ugBase(x, 0.2); const k = eio(x.u); const a = maskPt(x, 'chica'), b = maskPt(x, 'puppet'), c = maskPt(x, 'baby'); const p = k < 0.5 ? a.clone().lerp(b, k * 2) : b.clone().lerp(c, (k - 0.5) * 2);
  cam(x, [p.x + 0.2, p.y + 0.05, p.z + 1.3], [p.x, p.y, p.z], 42); hand(x); x.post.tint.value.set(0.78, 0.78, 0.82); x.S.ugKey.intensity = 14;
  orbsAt(x, x.S.ug, [p.clone().add(new V3(0, 0.2 + 1.5 * x.u, 0.2))], 0.7 * (1 - x.u));
});
// "Elas finalmente descansaram no incêndio antigo."
at(37.36, 'fire_rest', x => {
  const s = x.S.party; x.out.scene = s; x.animateFire(x.S, x.t, true); const L = x.L;
  orbsAt(x, s, [0, 1, 2, 3].map(i => new V3(-1.5 + i, 1.2 + L * 1.4 + 0.3 * Math.sin(x.t * 2 + i), -1 + (i % 2))), 1);
  if (L < 1.4) camMove(x, [0, 1.6, 5.5], [0, 1.8, -2], [0, 2.0, 4.8], [0, 2.6, -2], eo, 52); else cam(x, [1.5, 1.2, 3.6], [0, 3.2 + (L - 1.4) * 0.6, -1], 52);
  hand(x); x.post.vig.value = 0.9; x.post.tint.value.set(1.08, 0.95, 0.85); sparkles(x, s, [0, 2.8 + L, -0.5], 1.4, 8, 1);
});

// ===== AGONY =====
// "O que controla o Blob hoje não é um fantasma,"
at(40.10, 'not_ghost', x => {
  const s = ugBase(x, 0.7); const L = x.L; const ch = put(x, 'charlotte', s, 0, 0, -0.2, 0, 0.62); ch.idle(x.t, 1); ch.root.position.y = 0.4;
  x.C.charlotte.ghostMat.opacity = 0.5 * (1 - seg(L, 1.4, 2.1)); x.FX.xmark && L > 1.0 && L < 2.2 && pop(x, x.FX.xmark, s, [0, 1.6, 0.3], 1.0, 0.9, false);
  camMove(x, [0.3, 1.6, 4.0], [0, 1.4, -0.5], [0.2, 1.6, 3.4], [0, 1.5, -0.5], eo, 46); hand(x);
});
// "é a pura agonia."
at(42.48, 'agony', x => {
  const s = ugBase(x, 2); agonyAt(x, s, new V3(0, 0.4, -3.0), 2.4, 1); x.S.ugRed.forEach(l => l.intensity = 18);
  cam(x, [0, 1.6, 5], [0, 2.0, -2], 52); shake(x, 0.35); x.post.flash.value = x.L < 0.08 ? 0.3 : 0; x.post.tint.value.set(1.2, 0.8, 0.8); x.post.chroma.value = 0.6;
});
// "Uma energia ruim criada por anos de tragédias na pizzaria"
at(43.50, 'bad_energy', x => {
  const L = x.L;
  if (L < 1.6) { const s = x.S.hall; x.out.scene = s; agonyAt(x, s, new V3(0, 0.6, -6 + L * 3), 1.4, 0); for (const l of s.children.filter(o => o.isLight)) {} x.S.hallLamps.forEach((l, i) => { l.intensity = 9 * flicker(x.t, i); l.color.set('#ff6a5a'); });
    camMove(x, [0.6, 1.4, 3], [0, 1.4, -8], [0.2, 1.5, 1.2], [0, 1.5, -8], eo, 50); }
  else { const s = x.S.stage; x.out.scene = s; agonyAt(x, s, new V3(0, 0.8, -1.4), 2.0, 0); x.S.stageSpot.intensity = 12 * flicker(x.t, 3); cam(x, [1.5, 2.2, 5.5], [0, 1.6, -1.5], 48); x.post.tint.value.set(1.15, 0.8, 0.8); }
  hand(x); x.post.vig.value = 0.95;
});
// "que ganhou vida própria e roubou essas carcaças vazias"
at(46.76, 'stole_shells', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L; const up = eo(seg(L, 1.0, 1.6));
  const list = [['babyB', -1.0, 0.2], ['chicaB', 0, 0], ['ffoxyB', 1.0, -0.2]].map(([n, px, ry], i) => { const c = put(x, n, s, px, 0, -0.2 * Math.abs(px), ry); droop(c, 1.6 * (1 - up)); c.armR.piv.rotation.z = -0.2; c.armL.piv.rotation.z = 0.2; if (up > 0) { c.head.rotation.z = 0.15 * Math.sin(x.t * 23 + i) * up; } return c; });
  agonyAt(x, s, new V3(0, 0.3, 0), 1.6, 1); camMove(x, [0, 1.6, 4.6], [0, 1.3, 0], [0, 1.5, 3.6], [0, 1.4, 0], eo, 46); hand(x);
  x.S.voidSpot.intensity = 24; x.S.voidSpot.color.set('#ffb0a0'); x.S.voidRim.intensity = 12; x.S.voidRim.color.set('#ff2020'); x.post.tint.value.set(1.1, 0.85, 0.85); if (L > 1.0 && L < 1.08) x.post.flash.value = 0.3;
});
// "para rastejar por aí."
at(49.16, 'crawl', x => {
  const s = ugBase(x, 2.4); const L = x.L; x.S.blob.position.z = -3.2 + 1.4 * x.u + 0.08 * Math.sin(x.t * 8); x.S.blob.rotation.z = 0.04 * Math.sin(x.t * 5);
  const g = put(x, 'gregory', s, 0.4, 0, mix(2.8, 6.0, x.u), 0); g.walk(L * 3, 1.3, 1.2);
  if (L < 0.7) cam(x, [0.2, 0.4, 3.0], [0, 2.4, -2], 56); else cam(x, [1.4, 1.5, 8.4], [0.3, 1.4, 3.5], 46);
  hand(x); shake(x, 0.25);
});
// "Bizarro, né?"
at(50.54, 'bizarro', x => {
  const s = x.S.plex; x.out.scene = s; const g = put(x, 'gregory', s, 0.3, 0, 0, -0.15); g.idle(x.t, 1); lookAtCam(x, g, 1); const f = freddyBy(x, s, [-0.6, 0, -0.3], 0.25); shrug(f, eo(seg(x.L, 0.1, 0.4)));
  cam(x, [0.1, 1.85, 4.0], [-0.15, 1.65, 0], 44); hand(x);
});
// "Comenta o que você acha e me segue para mais mistérios."
at(51.28, 'outro', x => {
  const s = x.S.plex; x.out.scene = s; const L = x.L;
  [['ffoxy', -1.45, 0.2], ['gfreddy', -0.5, 0.08], ['gregory', 0.45, -0.05], ['baby', 1.4, -0.2]].forEach(([n, px, ry], i) => { const c = put(x, n, s, px, 0, -0.25 * Math.abs(px), ry); c.idle(x.t, 1, i); if (n === 'gfreddy') { aim(c, 'R', rootPt(c, -0.5, 2.1, 0.4), eo(seg(L, 0.3, 0.6))); c.armR.piv.rotation.z += 0.25 * Math.sin(x.t * 9) * seg(L, 0.6, 0.8); } });
  camMove(x, [0, 1.6, 8.0], [0, 1.4, 0], [0, 1.6, 7.2], [0, 1.45, 0], eo, 42); hand(x); x.post.fade.value = seg(L, x.d - 0.35, x.d);
});

export const SHOTS = shots;
export const DURATION = 53.76;
