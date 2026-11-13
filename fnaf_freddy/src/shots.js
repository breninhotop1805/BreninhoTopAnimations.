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

// ---------- helpers for the Glamrock Freddy / Michael video ----------
function pp(x) { const s = x.S.pizzaplace; x.out.scene = s; x.post.vig.value = 0.85; x.S.ppBulbs.forEach((b, i) => b.visible = Math.sin(x.t * 3 + i * 1.3) > -0.7); x.S.ppNeon.color.set('#ff2a4a').multiplyScalar(flicker(x.t, 3) > 0.5 ? 1 : 0.3); return s; }
function voidMood(x, rim = '#8a5aff', spot = 34) { const s = x.S.void; x.out.scene = s; x.S.voidSpot.intensity = spot; x.S.voidFill.intensity = 5; x.S.voidRim.intensity = 14; x.S.voidRim.color.set(rim); x.post.vig.value = 1.0; return s; }
function glitchIn(x, c, amt = 1) { const j = Math.floor(x.t * 24); const r = rng(j * 7 + 3); if (r() < 0.45 * amt) { c.root.position.x += (r() - 0.5) * 0.18 * amt; c.root.position.y += (r() - 0.5) * 0.06 * amt; } x.post.chroma.value = Math.max(x.post.chroma.value, 0.7 * amt); if (r() < 0.25 * amt) x.post.stat.value = Math.max(x.post.stat.value, 0.3 * amt); }
function holdHands(x, f, g) { aim(f, 'L', g.handR.getWorldPosition(new V3()).add(new V3(0, 0.08, 0)), 0.85); aim(g, 'R', f.handL.getWorldPosition(new V3()).add(new V3(0, -0.05, 0)), 0.5); }
function shieldRings(x, s, p, col = '#5ad8ff', sc = 1) { x.FX.waves.forEach((w, i) => { const k = (x.t * 0.9 + i / 4) % 1; s.add(w); w.position.copy(p); w.scale.setScalar((0.4 + 2.2 * k) * sc); w.material.opacity = 0.7 * (1 - k); w.material.color.set(col); w.quaternion.copy(x.camera.quaternion); }); }

// ===== HOOK =====
at(0.00, 'hook', x => {
  const s = atrium(x); const L = x.L; const k = seg(L, 0, 2.86);
  const f = put(x, 'gfreddy', s, 0, 0, 0, 0); walkTo(f, [-0.5, 0, -3.5], [-0.5, 0, 2.6], k, 1.0); const g = put(x, 'gregory', s, 0, 0, 0, 0); walkTo(g, [0.45, 0, -3.3], [0.45, 0, 2.8], k, 0.62);
  f.root.updateMatrixWorld(true); g.root.updateMatrixWorld(true); holdHands(x, f, g); if (L > 2.0) lookAtCam(x, f, sm(seg(L, 2.0, 2.5)));
  camMove(x, [0.0, 1.5, 5.6], [0, 1.6, -2], [0.2, 1.9, 6.2], [0, 1.8, 2.6], (u) => u, 50); hand(x); staticIn(x, 0.12); fillOn(x, f, 2.5, 2.2);
});
at(2.86, 'logo_sb', x => { const s = atrium(x); const f = put(x, 'gfreddy', s, -0.5, 0, 2.6, 0); f.idle(x.t, 1); const g = put(x, 'gregory', s, 0.45, 0, 2.8, 0); g.idle(x.t, 1, 2);
  cam(x, [0.1, 1.8, 6.6 - 0.4 * x.u], [0, 1.9, 2.6], 52); logoCard(x, 0); x.post.blur.value = 1; x.post.vig.value = 1.0; });

// ===== SAFE MODE =====
at(4.50, 'collapse', x => {
  const s = stage(x); const L = x.L; const f = put(x, 'gfreddy', s, 1.2, 1.0, -3.4, -0.1); f.idle(x.t, 1);
  [['roxy', -1.4, 0.15], ['gchica', 3.4, -0.2], ['monty', 5.4, -0.35]].forEach(([n, px, ry], i) => { const c = put(x, n, s, px, 1.0, -3.6, ry); c.idle(x.t, 1, i); aim(c, 'R', rootPt(c, -0.6, 2.2 + 0.15 * Math.sin(x.t * 7 + i), 0.4), 1 - seg(L, 1.4, 1.8)); });
  aim(f, 'R', rootPt(f, -0.7, 2.3 + 0.15 * Math.sin(x.t * 7), 0.4), 1 - seg(L, 1.3, 1.6));
  const k = eo(seg(L, 1.4, 2.0)); droop(f, 1.6 * k); f.torso.rotation.x += 0.35 * k; f.root.position.y = 1.0 - 0.3 * k; f.legR.piv.rotation.x = -1.2 * k; f.legL.piv.rotation.x = -1.3 * k; f.armR.piv.rotation.z -= 0.3 * k; f.armL.piv.rotation.z += 0.3 * k;
  x.S.stageSpots.forEach(l => l.intensity = L > 1.4 ? 55 * (1 - seg(L, 1.4, 1.9)) + 8 : 55);
  camMove(x, [1.6, 2.4, 6.5], [1.2, 2.4, -3.5], [1.5, 2.0, 2.4], [1.2, 1.6, -3.4], eio, 50); if (L > 1.45 && L < 1.8) shake(x, 0.5);
});
at(7.12, 'safe_mode', x => {
  const s = stage(x); const L = x.L; const f = put(x, 'gfreddy', s, 1.2, 0.7, -3.4, -0.1); const k = 1 - eo(seg(L, 0.9, 1.9));
  droop(f, 1.6 * k); f.torso.rotation.x += 0.35 * k; f.legR.piv.rotation.x = -1.2; f.legL.piv.rotation.x = -1.3; f.head.rotation.z = 0.1 * Math.sin(x.t * 2) * (1 - k);
  f.setEyeGlow('#5ad8ff', L > 0.7 ? (Math.sin(x.t * 40) > 0 || L > 1.0 ? 0.85 : 0.1) : 0); x.S.stageSpots.forEach(l => l.intensity = 6); x.S.stageKey.intensity = 22; x.S.stageFloorLight.intensity = 4;
  const hp = tp(f, 'head', [0, 3, 3]); camMove(x, [hp.x + 0.6, hp.y - 0.5, hp.z + 4.6], hp.toArray(), [hp.x + 0.2, hp.y - 0.3, hp.z + 2.3], hp.toArray(), eio, 46);
  if (L > 1.2) x.out.ui = { type: 'vision', box: [0.12, 0.26, 0.76, 0.44], label: 'MODO DE SEGURANÇA', id: 'REINICIANDO... ' + Math.min(100, Math.floor(seg(L, 1.2, 2.2) * 100)) + '%', col: '#5ad8ff' };
});
at(9.46, 'virus_fail', x => {
  const s = voidMood(x, '#8a5aff'); const L = x.L; const f = put(x, 'gfreddy', s, 0.35, 0, 0, -0.3); f.idle(x.t, 1); f.setEyeGlow('#5ad8ff', 0.85);
  const gt = put(x, 'glitchtrap', s, mix(-2.6, -1.2, eo(seg(L, 0, 1.2))) - 0.8 * eo(seg(L, 1.5, 2.0)), 0, -0.4, 0.8); gt.idle(x.t, 1); aim(gt, 'R', rootPt(f, 0, 1.9, 0.5), eo(seg(L, 0.3, 1.2)) * (1 - seg(L, 1.5, 1.9)));
  glitchIn(x, gt, 1); if (L > 1.4) shieldRings(x, s, tp(f, 'torso', [0, 6, 2]), '#5ad8ff', 1.2); if (L > 1.45 && L < 1.6) { x.post.flash.value = 0.3; shake(x, 0.4); }
  camMove(x, [0.2, 1.9, 5.4], [-0.4, 1.8, 0], [0.0, 2.0, 4.4], [-0.3, 1.9, 0], eo, 50);
});
function infected(x, who, L) { const s = stage(x); x.S.stageSpots.forEach(l => l.intensity = 14); x.S.stageKey.intensity = 25; const c = put(x, who, s, 0, 1.0, -3.4, 0); c.idle(x.t, 1);
  const k = sm(seg(L, 0.25, 0.5)); c.head.rotation.x = -0.2 * k + 0.12 * Math.sin(x.t * 31) * k; c.head.rotation.z = 0.25 * Math.sin(x.t * 17) * k; if (c.jaw) c.jaw.rotation.x = 0.5 * k;
  const gt = put(x, 'glitchtrap', s, 0.95, 1.0, -4.6, -0.3); gt.idle(x.t, 1); glitchIn(x, gt, 0.8 * k); gt.root.visible = k > 0.05 && Math.sin(x.t * 37) > -0.5;
  x.post.tint.value.set(1 + 0.4 * k, 1 - 0.2 * k, 1 - 0.15 * k); glitchIn(x, c, 0.5 * k); const hp = tp(c, 'head', [0, 4, 3]);
  camMove(x, [hp.x + 0.6, hp.y - 0.4, hp.z + 3.2], hp.toArray(), [hp.x + 0.25, hp.y - 0.2, hp.z + 2.3], hp.toArray(), eo, 46); }
at(12.02, 'chica', x => infected(x, 'gchica', x.L));
at(14.38, 'monty_inf', x => infected(x, 'monty', x.L));
at(14.92, 'roxy_inf', x => infected(x, 'roxy', x.L + 0.2));

// ===== PROTECTION =====
at(15.38, 'care', x => {
  const s = atrium(x); const L = x.L; const g = put(x, 'gregory', s, 0.5, 0, 3.2, -0.6); g.idle(x.t, 1); g.head.rotation.x = -0.3;
  const f = put(x, 'gfreddy', s, 0, 0, 0, 0); walkTo(f, [-1.4, 0, 1.4], [-0.35, 0, 2.7], eo(seg(L, 0, 1.6)), 1.0); f.root.rotation.y = mix(0.6, 0.85, eo(seg(L, 1.4, 2.0)));
  const kn = eo(seg(L, 1.6, 2.4)); f.legL.piv.rotation.x = -1.3 * kn; f.legR.piv.rotation.x = 0.5 * kn; f.root.position.y = -0.38 * kn; f.torso.rotation.x = 0.15 * kn; f.head.rotation.x = 0.25 * kn;
  if (L > 2.2) aim(f, 'R', tp(g, 'torso', [-3, 11, 0]), eo(seg(L, 2.2, 2.8))); if (L > 2.6) g.head.rotation.x = -0.3 + 0.1 * Math.sin(x.t * 3);
  const a = -0.35 + 0.6 * eio(x.u); cam(x, [0.1 + Math.sin(a) * 4.4, 1.7, 3.0 + Math.cos(a) * 4.4], [0.05, 1.35, 2.9], 48); fillOn(x, g, 2.2, 1.6); sparkles(x, s, [0.1, 2.0, 3.0], 0.8, 6, 0.5 * seg(L, 2.4, 3.0));
});
at(20.12, 'shield', x => {
  const s = atrium(x, true); const L = x.L;
  const g = put(x, 'gregory', s, 0.65, 0, 2.7, Math.PI + 0.2); g.idle(x.t, 1); g.armR.piv.rotation.x = -0.5; g.torso.rotation.x = -0.08;
  const m = put(x, 'monty', s, 0, 0, 0, 0); walkTo(m, [1.15, 0, -2.4], [1.0, 0, -0.5], eo(seg(L, 0, 2.2)), 1.2); m.root.rotation.y = -0.15; m.jaw.rotation.x = 0.4 + 0.2 * Math.sin(x.t * 9); aim(m, 'R', rootPt(m, -0.4, 1.8, 1.0), 0.7); aim(m, 'L', rootPt(m, 0.4, 1.8, 1.0), 0.7);
  const f = put(x, 'gfreddy', s, 0, 0, 0, Math.PI); walkTo(f, [-0.55, 0, 2.6], [0.1, 0, 1.45], eo(seg(L, 0, 1.0)), 1.0); f.root.rotation.y = Math.PI + 0.15; f.setEyeGlow('#5ad8ff', 0.85);
  const ao = eo(seg(L, 1.2, 1.7)); f.armR.piv.rotation.set(0, 0, -1.3 * ao); f.armL.piv.rotation.set(0, 0, 1.3 * ao);
  camMove(x, [-1.6, 1.8, -2.6], [0.3, 1.6, 1.4], [-1.3, 1.75, -2.0], [0.3, 1.7, 1.4], eo, 54); fillOn(x, f, 2.5, 2.0);
  if (L > 1.4) shieldRings(x, s, tp(f, 'torso', [0, 6, 2]), '#5ad8ff', 1.3);
});
at(23.88, 'hatch', x => {
  const s = atrium(x); const L = x.L; x.S.atKey.intensity = 10; const f = put(x, 'gfreddy', s, 0, 0, 0, 0); f.idle(x.t, 0.5); f.setEyeGlow('#5ad8ff', 0.85); f.setHatch(eo(seg(L, 0.3, 1.2)));
  const g = put(x, 'gregory', s, 0, 0, 0, 0); walkTo(g, [2.6, 0, 1.6], [0.95, 0, 1.1], eo(seg(L, 0.9, 2.4)), 0.62); g.root.rotation.y = -1.25; g.head.rotation.x = -0.3;
  const hp = tp(f, 'torso', [0, 6, 2]); camMove(x, [-0.9, 1.7, 4.6], [0, 1.9, 0], [-0.4, 1.75, 3.6], [hp.x + 0.4, hp.y - 0.1, hp.z], eio, 48); fillOn(x, f, 3, 2.0);
  if (L > 1.0) sparkles(x, s, [hp.x, hp.y, hp.z + 0.2], 0.4, 6, 0.4);
});

// ===== THE SECRET ENDING =====
at(26.78, 'tunnel', x => {
  const s = pp(x); const L = x.L; const k = seg(L, 0, 3.1);
  const f = put(x, 'gfreddy', s, 0, 0, 0, Math.PI); walkTo(f, [-0.5, 0, 1.4], [-0.5, 0, -5.0], k, 1.0); f.root.rotation.y = Math.PI;
  const g = put(x, 'gregory', s, 0, 0, 0, Math.PI); walkTo(g, [0.45, 0, 1.5], [0.45, 0, -4.9], k, 0.62); g.root.rotation.y = Math.PI; f.root.updateMatrixWorld(true); g.root.updateMatrixWorld(true); holdHands(x, f, g);
  const z = mix(1.4, -5.0, k); camMove(x, [0.2, 1.8, 4.6], [0, 1.8, -6], [0.2, 2.0, z + 4.2], [0, 2.4, -11], (u) => u, 52); hand(x); fillOn(x, f, 4, 2.4);
});
at(29.88, 'arrive', x => {
  const s = pp(x); const L = x.L; const f = put(x, 'gfreddy', s, -0.5, 0, -6.6, Math.PI); f.idle(x.t, 1); const g = put(x, 'gregory', s, 0.45, 0, -6.4, Math.PI); g.idle(x.t, 1, 2); g.head.rotation.x = -0.35;
  const turn = eo(seg(L, 2.2, 3.0)); f.root.rotation.y = Math.PI - 1.6 * turn; f.setEyeGlow('#5ad8ff', 0.85 * (1 - turn));
  camMove(x, [0.1, 0.6, -2.2], [0, 3.6, -11.6], [0.4, 1.6, -3.6], [-0.3, 2.2, -6.6], eio, 54); fillOn(x, f, 3.5, 2.2);
});
at(33.16, 'not_me', x => {
  const s = pp(x); const L = x.L; const f = put(x, 'gfreddy', s, -0.5, 0, -6.6, Math.PI - 1.6); f.idle(x.t, 0.4); f.head.rotation.x = 0.15; f.head.rotation.y = 0.15 * Math.sin(x.t * 1.5);
  const fl = Math.sin(x.t * 23) > 0.3; f.setEyeGlow(L > 1.6 ? '#b070ff' : (fl ? '#b070ff' : '#5ad8ff'), 0.9);
  const hp = tp(f, 'head', [0, 4, 4]); camMove(x, [hp.x + 2.4, hp.y - 0.3, hp.z + 0.5], hp.toArray(), [hp.x + 1.8, hp.y - 0.15, hp.z + 0.35], hp.toArray(), eio, 44); fillOn(x, f, 0.8, 2.2);
  if (L > 1.6) { x.post.tint.value.set(1.05, 0.9, 1.2); x.post.chroma.value = 0.5; } if (L > 2.2 && L < 2.32) x.post.stat.value = 0.4;
});
at(36.20, 'not_program', x => {
  const s = voidMood(x, '#b070ff', 30); const L = x.L; const f = put(x, 'gfreddy', s, 0, 0, 0, 0); f.idle(x.t, 0.6); f.setEyeGlow('#b070ff', 0.9);
  const a = 0.5 - 1.0 * eio(x.u); cam(x, [Math.sin(a) * 3.6, 2.0, Math.cos(a) * 3.6], [0, 1.9, 0], 46);
  x.out.ui = { type: 'vision', box: [0.14, 0.22, 0.72, 0.5], label: L < 1.4 ? 'PROGRAMA: ???' : 'PROGRAMA: NÃO ENCONTRADO', id: 'SISTEMA', locked: L > 1.4, col: L > 1.4 ? '#ff4a6a' : '#b070ff' };
  if (L > 1.4 && L < 1.5) x.post.stat.value = 0.4;
});
at(39.04, 'michael_soul', x => {
  const s = voidMood(x, '#b070ff', 32); const L = x.L; const f = put(x, 'gfreddy', s, -0.55, 0, 0, 0.25); f.idle(x.t, 0.6); f.setEyeGlow('#b070ff', 0.9);
  const m = put(x, 'mghost', s, mix(-0.55, 0.75, eo(seg(L, 0, 0.9))), 0.05 + 0.04 * Math.sin(x.t * 2), mix(-0.4, 0.3, eo(seg(L, 0, 0.9))), -0.3); m.idle(x.t, 1); x.C.mghost.ghostMat.opacity = 0.55 * sm(seg(L, 0, 0.4));
  lookAtCam(x, m, 0.6); camMove(x, [0.2, 1.7, 4.2], [0.1, 1.5, 0], [0.15, 1.6, 3.4], [0.2, 1.5, 0], eo, 46); sparkles(x, s, [0.75, 1.4, 0.3], 0.6, 8, 0.7);
});
at(40.58, 'soul_enters', x => {
  const s = voidMood(x, '#b070ff', 32); const L = x.L; const f = put(x, 'gfreddy', s, 0, 0, 0, 0); f.idle(x.t, 0.5); f.setHatch(eo(seg(L, 0.3, 1.0)) * (1 - eo(seg(L, 3.4, 4.0))));
  const ch = tp(f, 'torso', [0, 6, 2.5]); const k = eio(seg(L, 1.0, 3.0));
  const m = put(x, 'mghost', s, 0, 0, 0, 0); m.root.position.set(mix(1.3, 0, k), mix(0.1, 0.6, k), mix(1.6, 0.5, k)); m.root.scale.setScalar(mix(1.0, 0.25, k)); m.root.rotation.y = -0.6 + 0.6 * k; m.idle(x.t, 1); x.C.mghost.ghostMat.opacity = 0.55 * (1 - seg(L, 2.6, 3.0));
  orbAt(x, 0, s, ch, 0.5 * sm(seg(L, 2.5, 3.0)) * (1 - seg(L, 3.4, 3.9)));
  f.setEyeGlow('#b070ff', L > 3.0 ? 1 : 0.5); if (L > 3.0 && L < 3.1) x.post.flash.value = 0.3;
  const a = -0.4 + 0.6 * eio(x.u); cam(x, [Math.sin(a) * 3.8, 1.8, Math.cos(a) * 3.8], [0.2, 1.6, 0.3], 46);
});
at(44.74, 'son', x => {
  const s = pp(x); const L = x.L; const k = seg(L, 0, 3.2);
  const f = put(x, 'gfreddy', s, 0, 0, 0, 0); walkTo(f, [-0.5, 0, -6.4], [-0.5, 0, -2.0], k, 1.0); f.root.rotation.y = 0; f.setEyeGlow('#b070ff', 0.8);
  const g = put(x, 'gregory', s, 0, 0, 0, 0); walkTo(g, [0.45, 0, -6.2], [0.45, 0, -1.8], k, 0.62); g.root.rotation.y = 0; f.root.updateMatrixWorld(true); g.root.updateMatrixWorld(true); holdHands(x, f, g);
  const m = put(x, 'mghost', s, 0, 0, 0, 0); m.root.position.copy(f.root.position).add(new V3(-0.05, 0.05, -0.05)); m.root.scale.setScalar(1.08); m.walk(k * 4.4 / 1.0, 1); x.C.mghost.ghostMat.opacity = 0.18 + 0.1 * Math.sin(x.t * 3);
  const z = mix(-6.4, -2.0, k); camMove(x, [0.3, 1.7, -0.2], [0, 1.6, -6], [0.3, 1.8, z + 3.0], [0, 1.6, z], (u) => u, 52); fillOn(x, f, 4, 2.2);
});
at(47.94, 'brothers', x => {
  const s = voidMood(x, '#7ab8ff', 38); const L = x.L; const g = put(x, 'gregory', s, -0.5, 0, 0, 0.3); g.idle(x.t, 1); const c = put(x, 'cchild', s, 0.5, 0, 0, -0.3); c.idle(x.t, 1, 2); c.head.rotation.x = 0.25;
  const m = put(x, 'mghost', s, 0, 0.1, -1.3, 0); m.idle(x.t, 1); m.head.rotation.x = 0.4; x.C.mghost.ghostMat.opacity = 0.35 * sm(seg(L, 2.0, 2.8));
  const k = eio(x.u); cam(x, [mix(-1.6, 1.6, k), 1.25, 2.6], [mix(-0.6, 0.6, k), 1.0, 0], 42); x.S.voidFill.intensity = 7;
  if (L > 2.6) sparkles(x, s, [0, 1.6, -1.0], 0.9, 6, 0.6);
});
at(52.08, 'bug', x => {
  const s = atrium(x); const L = x.L; const f = put(x, 'gfreddy', s, -0.35, 0, 2.6, 0.1); f.idle(x.t, 1); f.head.rotation.z = 0.28 * eo(seg(L, 0.2, 0.7)); lookAtCam(x, f, 0.7);
  const g = put(x, 'gregory', s, 0.55, 0, 3.0, -0.2); g.idle(x.t, 1, 2); lookAtCam(x, g, 0.7); if (Math.floor(x.t * 6) % 7 === 0) f.setEyeGlow('#b070ff', 0.9);
  camMove(x, [0.2, 1.9, 7.6], [0, 1.9, 2.6], [0.1, 2.0, 6.6], [0, 2.0, 2.6], eo, 50); pop(x, x.FX.q1, s, headTop(f, 0.9), 0.35, 0.8); fillOn(x, f, 2.5, 2.2);
});
at(54.22, 'outro', x => {
  const s = atrium(x); const L = x.L; const f = put(x, 'gfreddy', s, -0.35, 0, 2.6, 0.1); f.idle(x.t, 1); lookAtCam(x, f, 0.8); aim(f, 'R', rootPt(f, -0.6, 2.3 + 0.12 * Math.sin(x.t * 9), 0.4), eo(seg(L, 0, 0.3)));
  const g = put(x, 'gregory', s, 0.55, 0, 3.0, -0.2); g.idle(x.t, 1, 2); lookAtCam(x, g, 0.8); aim(g, 'L', rootPt(g, 0.5, 1.7 + 0.1 * Math.sin(x.t * 9 + 1), 0.3), eo(seg(L, 0.1, 0.4)));
  camMove(x, [0.2, 1.9, 7.2], [0, 1.9, 2.6], [0.1, 1.8, 6.4], [0, 1.8, 2.6], eo, 50); fillOn(x, f, 2.5, 2.2);
});

export const SHOTS = shots;
export const DURATION = 56.26;
