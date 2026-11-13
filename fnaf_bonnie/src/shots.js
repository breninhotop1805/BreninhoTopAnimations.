// Shot list for "O Glamrock Bonnie REALMENTE existe?". Pure function of time.
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
// ---------- helpers for the Glamrock Bonnie video ----------
const shots = [];
const at = (t, name, fn) => shots.push({ t, name, fn });
function lensOn(x, wps, r, a, mark, col) { if (!Array.isArray(wps)) wps = [wps]; const P = wps.map(w => proj(x, w)); const u = P.reduce((s, p) => s + p[0], 0) / P.length, v = Math.min(...P.map(p => p[1]));
  x.out.ui = { type: 'lens', pts: P.map(([a1, b1]) => [a1, b1, r]), a, col, mark: mark ? [u, v - r * 1.25 * 9 / 16, mark === 'ok'] : null }; }
function atrium(x, ruin = false) { const s = x.S.atrium; x.out.scene = s; put(x, 'statue', s, 0, 0.7, -10, 0); if (ruin) x.S.ruinMode('atrium', x.t); x.post.vig.value = ruin ? 1.0 : 0.7; return s; }
function bowl(x, ruin = false) { const s = x.S.bowl; x.out.scene = s; if (ruin) x.S.ruinMode('bowl', x.t); x.post.vig.value = ruin ? 1.0 : 0.7; return s; }
function secret(x) { const s = x.S.secret; x.out.scene = s; x.post.vig.value = 1.0; return s; }
function stage(x) { const s = x.S.mainstage; x.out.scene = s; x.post.vig.value = 0.75; x.S.stageSpots.forEach((l, i) => { l.target.position.set(Math.sin(x.t * 1.3 + i * 1.7) * 4, 1, -3.5); }); return s; }
// Cassie holding the flashlight in her right hand, beam to `target`
function flashlight(x, c, s, target, I = 32, w = 1) {
  aim(c, 'R', target, w); c.root.updateMatrixWorld(true); const hp = c.handR.getWorldPosition(new V3());
  const f = x.FX.flashlight; s.add(f); f.position.copy(hp); f.lookAt(target); f.scale.setScalar(c.root.scale.x * 1.4);
  const l = x.FX.torch; s.add(l, l.target); l.position.copy(hp).add(new V3().subVectors(target, hp).normalize().multiplyScalar(0.2)); l.target.position.copy(target); l.intensity = I; l.angle = 0.38; return hp; }
// destroyed Bonnie lying on its back on the rug
function bonnieBody(x, s, eyes = 0.2) {
  const c = put(x, 'ruinbonnie', s, 0, 0.2, 0.15, 0); c.root.rotation.set(-Math.PI / 2, 0.15, 0, 'YXZ');
  c.armR.piv.rotation.set(0.2, 0, -1.25); c.armL.piv.rotation.set(-0.3, 0.4, 1.9); c.armL.piv.position.x += 0.35 / c.root.scale.x * 0.5; c.armL.piv.position.y -= 0.12;
  c.legR.piv.rotation.set(0.15, 0, -0.45); c.legL.piv.rotation.set(0.5, 0, 0.3); c.head.rotation.set(-0.15, 0.55, 0.25); c.jaw.rotation.x = 0.45;
  c.eyes.forEach(e => { e.material.emissiveIntensity = 2.2 * eyes; e.material.color.set(eyes > 0.05 ? '#fff2c0' : '#2a2a28'); });
  return c; }
const tp = (c, part, v) => { c.root.updateMatrixWorld(true); return c[part].localToWorld(new V3(v[0] * x_U, v[1] * x_U, v[2] * x_U)); };

// ===== HOOK =====
// "O Glamrock Bonnie realmente"
at(0.00, 'hook', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L; const b = put(x, 'gbonnie', s, 0, 0, 0, 0); b.idle(x.t, 1); b.head.rotation.x = 0.1;
  x.S.voidSpot.intensity = 30 * sm(seg(L, 0.05, 0.6)); x.S.voidRim.intensity = 18; x.S.voidRim.color.set('#3a7aff'); x.S.voidFill.intensity = 2;
  camMove(x, [0.5, 1.4, 4.4], [0, 1.6, 0], [0.25, 1.9, 2.7], [0, 2.0, 0], eo, 44); staticIn(x, 0.2); x.post.vig.value = 1.0;
});
// "está escondido dentro do"
at(1.16, 'hidden', x => {
  const s = atrium(x, true); const L = x.L; const b = put(x, 'gbonnie', s, -2.25, 0, 9.0, 0.55); b.idle(x.t, 0.6); b.torso.rotation.z = -0.15 * eo(seg(L, 0.1, 0.6)); b.head.rotation.y = 0.35; b.head.rotation.z = -0.2 * eo(seg(L, 0.2, 0.7));
  cam(x, [-0.6, 2.2, 12.6], [-2.1, 2.1, 9.0], 42); fillOn(x, b, 5, 2.2); hand(x); x.S.atKey.intensity = 3; x.S.atHemi.intensity = 0.5;
});
// "Pizza Plex até hoje?"
at(2.56, 'plex', x => {
  const s = atrium(x); const L = x.L; camMove(x, [0, 1.2, 13.5], [0, 3.6, -10], [0, 1.6, 9.5], [0, 3.4, -10], eio, 58);
  x.S.atScreenCv && (x.post.vig.value = 0.6); pop(x, x.FX.q1, s, [0, 6.8, -10], 0.65, 1.6);
});
// "Durante o jogo base de"
at(3.90, 'base_game', x => {
  const s = atrium(x); const L = x.L; const k = seg(L, 0, 1.4);
  const g = put(x, 'gregory', s, 0, 0, 0, Math.PI); walkTo(g, [0.45, 0, 0.5], [0.45, 0, -3.2], k, 0.9); g.root.rotation.y = Math.PI; g.head.rotation.x = -0.25;
  const f = put(x, 'gfreddy', s, 0, 0, 0, Math.PI); walkTo(f, [-0.65, 0, 0.0], [-0.65, 0, -3.6], k, 1.25); f.root.rotation.y = Math.PI;
  camMove(x, [1.0, 1.7, 6.8], [0, 2.0, -6], [0.7, 1.8, 5.2], [0, 2.2, -8], eo, 52); hand(x);
});
at(5.30, 'logo_sb', x => { const s = atrium(x); cam(x, [0, 1.6, 9.8 - 0.4 * x.u], [0, 3.6, -10], 56); logoCard(x, 0); });
// "a desculpa oficial da empresa é que"
at(6.12, 'excuse', x => {
  const s = stage(x); const L = x.L; put(x, 'gfreddy', s, 0, 1.0, -3.4, 0).idle(x.t, 1);
  put(x, 'roxy', s, -2.6, 1.0, -3.4, 0.15).idle(x.t, 1, 2); put(x, 'gchica', s, 2.6, 1.0, -3.4, -0.15).idle(x.t, 1, 4);
  camMove(x, [0, 2.6, 9.5], [0, 3.6, -5], [0, 3.2, 6.5], [0, 4.0, -6], eo, 52); x.S.stageSpots.forEach(l => l.intensity = 18);
});
// "ele simplesmente sumiu"
at(7.82, 'vanish', x => {
  const s = stage(x); const L = x.L; const k = sm(seg(L, 0.35, 0.75)); const b = put(x, 'gbonnie', s, 4.6, 1.0, -3.4, -0.3, 1 - k); b.idle(x.t, 1); b.root.visible = k < 0.99;
  sparkles(x, s, [4.6, 2.3, -3.1], 0.9, 8, 1.4 * sm(seg(L, 0.3, 0.55)) * (1 - seg(L, 0.85, 1.06)));
  x.post.flash.value = L > 0.38 && L < 0.48 ? 0.35 : 0;
  cam(x, [3.5, 2.3, 0.6], [4.6, 2.2, -3.4], 46); hand(x); x.S.stageSpots.forEach((l, i) => { l.target.position.set(4.6, 1, -3.4); l.intensity = i % 2 ? 40 : 10; });
});
// "e precisou ser substituído"
at(8.88, 'replaced', x => {
  const s = stage(x); const L = x.L; const k = seg(L, 0.15, 0.45); const m = put(x, 'monty', s, 4.6, 1.0 + 5 * (1 - eo(k)) * (k < 1 ? 1 : 0), -3.4, -0.35); m.idle(x.t, 1);
  if (k < 1) { m.armR.piv.rotation.z = -2.6; m.armL.piv.rotation.z = 2.6; } else { aim(m, 'R', rootPt(m, -0.9, 2.2, 0.6), eo(seg(L, 0.5, 0.8))); m.jaw.rotation.x = 0.35 * sm(seg(L, 0.5, 0.8)); }
  if (L > 0.45 && L < 0.8) shake(x, 0.8 * (1 - seg(L, 0.45, 0.8)));
  x.post.flash.value = L > 0.44 && L < 0.52 ? 0.25 : 0;
  cam(x, [2.4, 2.0, 3.0], [4.6, 2.6, -3.4], 50); x.S.stageSpots.forEach((l, i) => { l.target.position.set(4.6, 1, -3.4); l.intensity = 45; });
});
// "pelo Monty às pressas."
at(10.28, 'monty_golf', x => {
  const s = x.S.golf; x.out.scene = s; const L = x.L; const m = put(x, 'monty', s, 0, 0, -4.2, 0.1); m.idle(x.t, 1);
  aim(m, 'R', rootPt(m, -0.7, 2.3, 0.6), eo(seg(L, 0.1, 0.4))); aim(m, 'L', rootPt(m, 0.7, 1.5, 0.7), eo(seg(L, 0.2, 0.5))); m.jaw.rotation.x = 0.5 * sm(seg(L, 0.3, 0.6)); m.head.rotation.z = 0.15 * Math.sin(x.t * 6);
  camMove(x, [0.6, 0.9, 0.2], [0, 2.3, -4.2], [0.35, 1.0, -0.6], [0, 2.4, -4.2], eo, 52); x.post.vig.value = 0.8; fillOn(x, m, 7, 2.2);
});
// "Muita gente acreditou que ele era apenas uma arte conceitual"
at(11.68, 'concept', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L; const p = x.FX.paper; s.add(p); p.position.set(0, 2.1, -0.9);
  const b = put(x, 'gbonnie', s, 0, 0, 0, 0); b.idle(x.t, 0.5); x.S.voidSpot.intensity = 45; x.S.voidFill.intensity = 8;
  camMove(x, [1.4, 1.9, 5.4], [0, 1.9, 0], [0.6, 1.9, 4.6], [0, 1.9, 0], eo, 44); x.post.tint.value.set(1.05, 1.0, 0.92);
});
// "cortada da história"
at(14.52, 'cut', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L; const p = x.FX.paper; s.add(p); p.position.set(0, 2.1, -0.9);
  const b = put(x, 'gbonnie', s, 0, 0, 0, 0); b.idle(x.t, 0.5); x.S.voidSpot.intensity = 45; x.S.voidFill.intensity = 8;
  const k = sm(seg(L, 0.25, 0.8)); b.root.visible = Math.sin(x.t * 50) > -0.2 || k < 0.2; b.root.scale.setScalar(b.baseScale * (1 - 0.0 * k)); if (k > 0.95) b.root.visible = false;
  x.post.stat.value = k > 0.05 && k < 0.95 ? 0.5 : 0; cam(x, [0.6, 1.9, 4.6], [0, 1.9, 0], 44);
  pop(x, x.FX.xmark, s, [0, 2.1, 0.9], 0.1, 1.2, false);
});
// "e que nunca veríamos o robô de verdade."
at(15.54, 'never', x => {
  const s = bowl(x); const L = x.L; const g = put(x, 'gregory', s, x.S.lanesX[2] + 0.7, 0.1, -4.5, 0.25); g.idle(x.t, 1);
  const k = eo(seg(L, 0.3, 0.8)); g.armR.piv.rotation.set(-0.6 * k, 0, -0.7 * k); g.armL.piv.rotation.set(-0.6 * k, 0, 0.7 * k); g.head.rotation.z = 0.15 * k; g.head.rotation.y = 0.5 * Math.sin(x.t * 1.5);
  camMove(x, [0.7, 1.5, -0.6], [-0.1, 1.2, -14], [0.5, 1.5, -1.2], [-0.1, 1.2, -14], eo, 54); hand(x);
});
// ===== RUIN =====
// "Mas o segredo dele estava muito bem enterrado."
at(17.32, 'buried', x => {
  const s = atrium(x, true); const L = x.L; const k = eio(x.u);
  cam(x, [mix(0.5, 0.2, k), mix(6.5, 1.0, k), mix(6, 1.5, k)], [0, mix(4.0, 0.2, k), mix(-10, -6, k)], 56); hand(x, 1.5);
  const l = x.FX.torch; s.add(l, l.target); l.position.set(1.5, 4, 2); l.target.position.set(0, 0, -6); l.intensity = 14; l.angle = 0.5;
});
// "No DLC Ruin,"
at(19.98, 'ruin', x => {
  const s = atrium(x, true); const L = x.L; const c = put(x, 'cassie', s, 0, 0, 0, Math.PI); walkTo(c, [0.3, 0, 3.5], [0.3, 0, 1.2], seg(L, 0, 1.26), 0.7); c.root.rotation.y = Math.PI;
  flashlight(x, c, s, new V3(0, 1.5, -8), 40); camMove(x, [1.1, 1.0, 6.6], [0, 1.6, -4], [0.9, 1.1, 5.4], [0, 1.6, -4], eo, 50); hand(x);
});
// "se você for até o fundo da velha pista de boliche"
at(21.24, 'bowl_walk', x => {
  const s = bowl(x, true); const L = x.L; const lx = x.S.lanesX[2] + 0.7; const c = put(x, 'cassie', s, 0, 0.1, 0, Math.PI);
  walkTo(c, [lx, 0.1, -5.5], [lx, 0.1, -11.5], seg(L, 0, 2.24), 0.7); c.root.rotation.y = Math.PI;
  flashlight(x, c, s, new V3(lx, 1.6, -18.4), 90);
  camMove(x, [lx + 0.5, 1.4, -2.8], [lx, 1.4, -18], [lx + 0.35, 1.4, -8.0], [lx, 1.6, -18], (k) => k, 56); hand(x, 1.2);
});
// "e desativar uma parede secreta,"
at(23.48, 'panel', x => {
  const s = bowl(x, true); const L = x.L; const c = put(x, 'cassie', s, 4.45, 0.1, -15.05, Math.PI / 2 + 0.55); c.idle(x.t, 0.5);
  const press = eo(seg(L, 0.2, 0.55)) * (1 - seg(L, 0.75, 1.0)); aim(c, 'L', new V3(5.25, 1.5, -15.95), press);
  const on = L > 0.6; x.S.panelLed.material.color.set(on ? '#2aff5a' : '#ff2a2a'); x.S.panelPL.color.set(on ? '#2aff5a' : '#ff2a2a'); const op = eo(seg(L, 0.85, 1.6)); x.S.secretPanel.position.z = -16.6 - 1.55 * op;
  flashlight(x, c, s, new V3(5.3, 1.3, -16.6), 30); if (L > 0.85 && L < 1.4) shake(x, 0.15);
  camMove(x, [1.0, 1.9, -13.4], [4.9, 1.35, -16.0], [1.3, 1.85, -13.7], [4.9, 1.35, -16.1], eo, 54); fillOn(x, c, 4, 1.8);
});
// "vai acessar uma área que ninguém deveria ver."
at(25.20, 'enter', x => {
  const s = secret(x); const L = x.L; const on = L > 0.7 ? (Math.sin(x.t * 31) > -0.5 || L > 1.3 ? 1 : 0.1) : 0;
  x.S.setBunny(on); x.S.signLight.intensity = 3 * on; x.S.starMat.color.set(L > 1.1 ? '#e8f2ff' : '#151515'); x.S.starLight.intensity = L > 1.1 ? 4 : 0; x.S.secretHemi.intensity = 0.15;
  camMove(x, [2.6, 1.55, 2.8], [-0.6, 1.6, -2.5], [1.6, 1.5, 1.9], [-0.8, 1.7, -2.5], eo, 54); hand(x, 1.2);
});
// "É exatamente lá que o corpo oficial do Glamrock Bonnie está largado,"
at(27.24, 'reveal', x => {
  const s = secret(x); const L = x.L; const b = bonnieBody(x, s, 0); const c = put(x, 'cassie', s, 1.25, 0, 2.0, Math.PI + 0.5); c.idle(x.t, 0.6);
  const sweep = eio(seg(L, 0, 1.3)); flashlight(x, c, s, new V3(mix(-2.0, 0.0, sweep), mix(1.0, 0.2, sweep), mix(-1.5, 0.15, sweep)), 70); x.S.secretHemi.intensity = 0.3;
  camMove(x, [1.9, 1.95, 3.2], [0, 0.4, 0.0], [1.6, 1.85, 2.9], [0, 0.35, 0.1], eo, 52); hand(x);
  x.post.flash.value = L > 1.25 && L < 1.32 ? 0.2 : 0;
});
// "totalmente destruído e esquecido no escuro."
at(30.72, 'destroyed', x => {
  const s = secret(x); const L = x.L; bonnieBody(x, s, 0.15); x.S.secretHemi.intensity = 0.25;
  const a = 0.6 - 0.9 * eio(x.u); cam(x, [Math.sin(a) * 2.3, 3.4, 0.15 + Math.cos(a) * 2.3], [0, 0.2, 0.15], 56);
  const l = x.FX.torch; s.add(l, l.target); l.position.set(1.0, 2.6, 1.6); l.target.position.set(0, 0, 0.15); l.intensity = 22 * (1 - 0.6 * seg(L, 1.0, 2.0)); l.angle = 0.42;
});
// "E o detalhe mais pesado dessa história é que a carcaça dele está destruída"
at(32.78, 'detail', x => {
  const s = secret(x); const L = x.L; const b = bonnieBody(x, s, 0.15 + 0.1 * Math.sin(x.t * 5)); const c = put(x, 'cassie', s, -0.95, 0, 1.25, Math.PI - 0.6); c.idle(x.t, 0.5); c.torso.rotation.x = 0.35; c.head.rotation.x = 0.4;
  flashlight(x, c, s, tp(b, 'head', [0, 4, 2]), 18);
  const hp = tp(b, 'head', [0, 4, 3]); camMove(x, [hp.x + 1.3, hp.y + 1.5, hp.z + 1.9], hp.toArray(), [hp.x + 1.0, hp.y + 1.15, hp.z + 1.4], hp.toArray(), eio, 48); hand(x);
});
// "com marcas gigantes de garras"
at(36.64, 'claws', x => {
  const s = secret(x); const L = x.L; const b = bonnieBody(x, s, 0.1); const p = tp(b, 'torso', [-0.5, 6.5, 2.5]);
  cam(x, [p.x + 0.25, p.y + 1.25, p.z + 0.35], p.toArray(), 46); hand(x);
  const l = x.FX.torch; s.add(l, l.target); l.position.set(p.x + 0.6, p.y + 1.4, p.z + 0.6); l.target.position.copy(p); l.intensity = 25; l.angle = 0.35;
  lensOn(x, p, 0.2, sm(seg(L, 0.15, 0.4)), null, '#ff5050');
});
// "e restos de tinta verde."
at(38.14, 'paint', x => {
  const s = secret(x); const L = x.L; const b = bonnieBody(x, s, 0.1); const p = tp(b, 'torso', [1.6, 8.5, 2.3]);
  cam(x, [p.x - 0.2, p.y + 1.1, p.z + 0.45], p.toArray(), 46); hand(x);
  const l = x.FX.torch; s.add(l, l.target); l.position.set(p.x - 0.5, p.y + 1.4, p.z + 0.7); l.target.position.copy(p); l.intensity = 25; l.angle = 0.35;
  lensOn(x, p, 0.16, sm(seg(L, 0.1, 0.35)), null, '#5aff6a');
});
// ===== FLASHBACK =====
// "Ou seja, o Monty realmente destruiu ele pelas costas"
at(39.42, 'backstab', x => {
  const s = stage(x); const L = x.L; x.S.stageSpots.forEach(l => l.intensity = 0); x.S.stageKey.intensity = 12; x.S.stageFloorLight.intensity = 3; x.post.tint.value.set(1.25, 0.82, 0.86); x.post.vig.value = 1.05; x.post.grain.value = 0.07;
  const b = put(x, 'gbonnie', s, 0.4, 1.0, -3.6, -Math.PI * 0.5); b.idle(x.t, 1);
  const hit = L > 2.32; const fall = eo(seg(L, 2.4, 2.9));
  if (fall > 0) { b.root.rotation.x = 0; b.root.rotation.z = -1.35 * fall; b.root.position.y = 1.0 + 0.1 * fall; b.armR.piv.rotation.z = -1.2 * fall; }
  const m = put(x, 'monty', s, 0, 1.0, -3.6, -Math.PI * 0.5); walkTo(m, [2.6, 1.0, -3.6], [1.55, 1.0, -3.6], eo(seg(L, 0.2, 1.6)), 1.2); m.root.rotation.y = -Math.PI * 0.5;
  const raise = eo(seg(L, 1.5, 2.15)), swing = eo(seg(L, 2.15, 2.4)); m.armR.piv.rotation.set(-2.8 * raise + 2.6 * swing, 0, -0.3); m.armL.piv.rotation.set(-2.6 * raise + 2.4 * swing, 0, 0.3); m.jaw.rotation.x = 0.6 * raise;
  if (hit && L < 2.5) { x.post.flash.value = 0.55; x.post.tint.value.set(1.6, 0.6, 0.6); } if (L > 2.32 && L < 2.9) shake(x, 1 - seg(L, 2.32, 2.9));
  cam(x, [mix(1.0, 1.2, x.u), 2.0, 0.6], [1.0, 2.0, -3.6], 50);
});
// "só para roubar o lugar dele no palco principal."
at(42.84, 'steal', x => {
  const s = stage(x); const L = x.L; const m = put(x, 'monty', s, 4.6, 1.0, -3.4, -0.35); m.idle(x.t, 1); aim(m, 'R', rootPt(m, -0.8, 2.4, 0.5), 1); m.jaw.rotation.x = 0.35 + 0.15 * Math.sin(x.t * 8);
  put(x, 'gfreddy', s, 0, 1.0, -3.4, 0).idle(x.t, 1, 1); put(x, 'roxy', s, -2.6, 1.0, -3.4, 0.2).idle(x.t, 1, 2); put(x, 'gchica', s, 2.4, 1.0, -3.6, -0.2).idle(x.t, 1, 3);
  camMove(x, [3.0, 1.9, 3.4], [3.8, 2.6, -3.4], [2.0, 2.2, 5.0], [2.6, 2.8, -3.4], eio, 50); x.S.stageSpots.forEach(l => l.intensity = 55); sparkles(x, s, [4.6, 3.2, -3.2], 1.2, 8, 1.1);
});
// ===== ENDING =====
// "Mas e você? Já tinha visto ele lá no escuro?"
at(44.94, 'eyes', x => {
  const s = secret(x); const L = x.L; const on = L > 1.4 ? (Math.sin(x.t * 29) > -0.3 ? 1 : 0.2) : 0.05; const b = bonnieBody(x, s, on); x.S.secretHemi.intensity = 0.12; x.S.signLight.intensity = 1; x.S.starLight.intensity = 1.2;
  if (L > 1.45) { b.head.rotation.y = 0.55 - 0.3 * eo(seg(L, 1.45, 1.75)); b.jaw.rotation.x = 0.45 + 0.1 * Math.sin(x.t * 30); }
  const hp = tp(b, 'head', [0, 4, 3]); camMove(x, [hp.x + 0.8, hp.y + 1.3, hp.z + 1.2], hp.toArray(), [hp.x + 0.6, hp.y + 1.0, hp.z + 0.9], hp.toArray(), eio, 46);
  const tl = x.FX.torch; s.add(tl, tl.target); tl.position.set(hp.x + 1.0, hp.y + 1.6, hp.z + 1.2); tl.target.position.copy(hp); tl.intensity = 6; tl.angle = 0.4;
  pop(x, x.FX.q1, s, [hp.x + 0.2, hp.y + 0.6, hp.z + 0.1], 1.6, 0.35); if (L > 1.4 && L < 1.5) x.post.stat.value = 0.4;
});
// "Comenta aí e me segue para mais mistérios."
at(47.66, 'outro', x => {
  const s = secret(x); const L = x.L; bonnieBody(x, s, 0.3); const c = put(x, 'cassie', s, 0.55, 0, 1.75, -0.15); c.idle(x.t, 1);
  camMove(x, [1.1, 2.0, 4.6], [0.1, 0.95, 0.6], [0.9, 1.9, 4.1], [0.1, 1.0, 0.6], eo, 52); lookAtCam(x, c, 1); fillOn(x, c, 8, 1.6);
  flashlight(x, c, s, new V3(-0.3, 0.2, 0.2), 25, 0.8);
});

export const SHOTS = shots;
export const DURATION = 49.68;
