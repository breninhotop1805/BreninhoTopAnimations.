// Shot list for "A mordida de 87". Pure function of time.
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
// ---------- helpers for the Bite of '87 video ----------
const shots = [];
const at = (t, name, fn) => shots.push({ t, name, fn });
function lensOn(x, wps, r, a, mark, col) { if (!Array.isArray(wps)) wps = [wps]; const P = wps.map(w => proj(x, w)); const u = P.reduce((s, p) => s + p[0], 0) / P.length, v = Math.min(...P.map(p => p[1]));
  x.out.ui = { type: 'lens', pts: P.map(([a1, b1]) => [a1, b1, r]), a, col, mark: mark ? [u, v - r * 1.25 * 9 / 16, mark === 'ok'] : null }; }
const tp = (c, part, v) => { c.root.updateMatrixWorld(true); const o = c[part].isObject3D ? c[part] : c[part].piv; return o.localToWorld(new V3(v[0] * x_U, v[1] * x_U, v[2] * x_U)); };
function mg(x, spec) { x.out.scene = x.S.void; x.out.ui = { type: 'mg', mg: spec }; }
function diner(x) { const s = x.S.diner; x.out.scene = s; x.post.tint.value.set(1.06, 1.0, 0.9); x.post.vig.value = 0.8; const f = put(x, 'fredbear', s, 0.9, 0.77, -4.4, -0.15); f.idle(x.t, 1); const b = put(x, 'springbonnie', s, -0.9, 0.77, -4.4, 0.15); b.idle(x.t, 1, 2); return [s, f, b]; }
function office(x) { const s = x.S.office2; x.out.scene = s; x.post.vig.value = 0.9; return s; }
function party(x, day = true) { const s = x.S.party; x.out.scene = s; x.post.vig.value = 0.7; return s; }
function kidsParty(x, s, hats = true) { const P = [[0, -1.15, -1.25, 0.5], [1, -0.45, -1.5, 0.1], [2, 0.45, -1.5, -0.2], [3, 1.1, -1.25, -0.5]];
  return P.map(([i, px, pz, ry]) => { const k = put(x, 'kid' + i, s, px, 0, pz, ry); k.idle(x.t, 1, i); k.head.rotation.z = 0.12 * Math.sin(x.t * 5 + i);
    if (hats) { const h = x.FX.hats[i]; k.head.add(h); h.position.set(0, 8.3 * x_U, 0); h.scale.setScalar(1 / k.root.scale.x * 0.74); } return k; }); }
function cakeOn(x, s, p) { const t = x.FX.ctable; s.add(t); t.position.set(p[0], 0, p[2]); const c = x.FX.cake; s.add(c); c.position.set(p[0], 0.82, p[2]); return c; }
// Mangle hanging from a ceiling at height `ceil` (her body under it, head hanging)
function mangleCeil(x, s, px, ceil, pz, yaw = 0) { const m = x.MANGLE; s.add(m.root); m.reset(); m.root.scale.setScalar(1.25); m.root.rotation.set(0, yaw, Math.PI); m.root.position.set(px, ceil, pz); return m; }
const mangleHead = m => { m.root.updateMatrixWorld(true); return m.headGroup.getWorldPosition(new V3()); };
const KIDS = (walk, x0 = 0) => [{ x: 214 + x0, y: 200, type: 'foxy', walk }, { x: 238 + x0, y: 204, type: 'bonnie', walk }, { x: 262 + x0, y: 200, type: 'chica', walk }, { x: 286 + x0, y: 204, type: 'freddy', walk }];

function ringWaves(x, s, p) { x.FX.waves.forEach((w, i) => { const k = (x.t * 1.3 + i / 4) % 1; s.add(w); w.position.copy(p); w.scale.setScalar(0.12 + 0.55 * k); w.material.opacity = 0.85 * (1 - k); w.material.color.set('#ff6060'); w.quaternion.copy(x.camera.quaternion); }); }
// ===== HOOK =====
// "Você provavelmente passou a vida inteira acreditando" — lights snap on, camera rushes through the diner to the stage
at(0.00, 'hook', x => {
  const [s, f, b] = diner(x); const L = x.L; const on = L > 0.25 ? 1 : (Math.sin(x.t * 60) > 0 ? 0.6 : 0.05);
  x.S.dinerLamps.forEach(l => l.intensity = 10 * on); x.S.dinerSpot.intensity = 45 * on; f.head.rotation.y = -0.6 * (1 - eo(seg(L, 0.9, 1.6))); f.head.rotation.x = 0.1;
  aim(f, 'R', rootPt(f, -0.6, 1.9 + 0.15 * Math.sin(x.t * 5), 0.5), eo(seg(L, 0.6, 1.2))); b.armL.piv.rotation.x = -0.5 - 0.3 * Math.sin(x.t * 4);
  [[0, -1.2, 0.2], [1, 1.3, 0.6]].forEach(([i, px, pz]) => { const k = put(x, 'kid' + i, s, 0, 0, 0, Math.PI); walkTo(k, [px, 0, pz + 2.5], [px * 0.7, 0, pz - 1.0], seg(L, 0, 2.4), 0.7); k.root.rotation.y = Math.PI; });
  camMove(x, [0.2, 1.3, 7.0], [0.6, 2.2, -4.4], [0.6, 2.4, -0.6], [0.9, 2.6, -4.4], eio, 50); staticIn(x, 0.15);
});
// "na cena errada da mordida de 87."
at(2.48, 'wrong', x => {
  const [s, f] = diner(x); const L = x.L; f.head.rotation.y = 0.25 * Math.sin(x.t * 2); f.head.rotation.z = 0.35 * eo(seg(L, 0.5, 1.0)); f.head.rotation.x = -0.15;
  const hp = tp(f, 'head', [0, 4, 4]); camMove(x, [hp.x - 0.6, hp.y + 0.3, hp.z + 2.6], hp.toArray(), [hp.x + 0.3, hp.y + 0.1, hp.z + 1.6], hp.toArray(), eio, 44);
  if (L > 1.1) { x.post.tint.value.set(1.25, 0.8, 0.8); x.post.stat.value = L < 1.25 ? 0.5 : 0.04; x.post.chroma.value = 0.6; shake(x, 0.15); }
});
// "Quando se fala nesse evento, todo mundo se lembra daquele" — the show: kids jumping, Fredbear + Spring Bonnie performing
at(4.46, 'everyone', x => {
  const [s, f, b] = diner(x); const L = x.L; aim(f, 'R', rootPt(f, -0.7, 2.0 + 0.2 * Math.sin(x.t * 6), 0.4), 1); f.head.rotation.z = 0.12 * Math.sin(x.t * 3); aim(b, 'L', rootPt(b, 0.7, 1.9 + 0.2 * Math.sin(x.t * 6 + 1), 0.4), 1); b.head.rotation.z = -0.12 * Math.sin(x.t * 3);
  [[0, -1.4, -1.4], [1, -0.45, -1.0], [2, 0.5, -1.2], [3, 1.4, -1.5]].forEach(([i, px, pz]) => { const k = put(x, 'kid' + i, s, px, Math.max(0, Math.sin(x.t * 7 + i * 1.3)) * 0.18, pz, Math.PI); k.idle(x.t, 1, i);
    const up = Math.sin(x.t * 7 + i * 1.3) > 0; k.armR.piv.rotation.z = up ? -2.6 : -0.3; k.armL.piv.rotation.z = up ? 2.6 : 0.3; });
  const a = -0.5 + 0.9 * eio(x.u); cam(x, [Math.sin(a) * 4.6, 2.4 - 0.5 * x.u, 2.4 + Math.cos(a) * 1.6], [0, 1.6, -3.4], 54); sparkles(x, s, [0, 2.6, -4.2], 1.6, 8, 0.7);
});
// "minigame clássico do FNAF 4"
at(7.30, 'arcade', x => {
  const s = x.S.arcade; x.out.scene = s; const L = x.L; x.out.screen = 'mg'; x.out.mg = { cx: 240, cy: 120, z: 0.68, kids: KIDS(1, 40 - L * 30), child: { x: 205 + 40 - L * 30, y: 202 } };
  const p = x.S.cabScreenPos; const k = eio(seg(L, 0, 1.88)); cam(x, [p.x + mix(-1.2, 0, k), p.y + mix(0.4, 0.0, k), p.z + mix(3.6, 1.85, k)], [p.x, p.y - 0.05 * (1 - k), p.z], 46);
  x.post.flash.value = L > 1.72 ? (L - 1.72) / 0.16 * 0.8 : 0;
});

// ===== MINIGAME =====
at(9.18, 'mg_carry', x => { const L = x.L; const k = seg(L, 0, 2.42); const dx = -70 * k;
  mg(x, { cx: 220 + dx, cy: 150, z: 1.6, kids: KIDS(1, dx), child: { x: 192 + dx, y: 202 } }); });
at(11.60, 'mg_bite', x => { const L = x.L; const jaw = L < 0.35 ? 1 : 1 - sm(seg(L, 0.35, 0.45));
  mg(x, { cx: 140, cy: 122, z: 1.5, jaw, kids: [{ x: 152, y: 172, type: 'foxy', armsUp: 1 }, { x: 176, y: 172, type: 'bonnie', armsUp: 1 }], child: { x: 146, y: 108, flat: 1 },
    flash: L > 0.44 && L < 0.52 ? 1 : 0, black: L > 0.52 ? 0.85 : 0, glitch: L > 0.5 ? 0.8 : 0 }); });
// "A internet inteira jurou na época que essa era a famosa mordida,"
at(12.38, 'mg_famous', x => { const L = x.L; const z = mix(1.3, 2.4, eio(seg(L, 0, 2.4)));
  mg(x, { cx: mix(200, 128, eio(seg(L, 0, 2.4))), cy: mix(140, 108, eio(seg(L, 0, 2.4))), z, jaw: 0.2 + 0.15 * Math.max(0, Math.sin(x.t * 6)), kids: KIDS(0, -40).map((k, i) => ({ ...k, armsUp: Math.sin(x.t * 8 + i) > 0 })), q: L > 2.5 ? sm(seg(L, 2.5, 2.8)) : 0 }); });
// "mas tem um furo gigante aí."
at(15.52, 'hole', x => {
  const [s, f] = diner(x); const L = x.L; f.head.rotation.z = 0.25 * Math.sin(x.t * 11) * seg(L, 0.3, 0.6); f.head.rotation.y = 0.3 * Math.sin(x.t * 7) * seg(L, 0.3, 0.6); x.post.tint.value.set(1.25, 0.8, 0.8); x.post.chroma.value = 0.6;
  x.S.dinerLamps.forEach((l, i) => l.intensity = 10 * flicker(x.t, i)); x.post.stat.value = Math.sin(x.t * 23) > 0.85 ? 0.35 : 0;
  camMove(x, [-0.8, 1.2, 2.6], [0.9, 2.6, -4.4], [0.2, 1.8, 0.0], [0.9, 2.7, -4.4], eio, 46); shake(x, 0.12);
});
// "Essa tragédia do minigame aconteceu, na verdade, em 1983."
at(17.12, 'mg_1983', x => { const L = x.L; const st = L > 3.56 ? [mix(1.7, 1.0, eo(seg(L, 3.56, 3.72))), 1] : null;
  mg(x, { cx: mix(90, 330, eio(seg(L, 0, 3.4))), cy: 130, z: 1.2, jaw: 0.2 + 0.2 * Math.max(0, Math.sin(x.t * 5)), kids: KIDS(0, 0).map((k, i) => ({ ...k, armsUp: Math.sin(x.t * 7 + i) > 0.3 })), child: { x: 190, y: 202 }, stamp: st }); if (L > 3.56 && L < 3.72) shake(x, 0.4); });
// "A verdadeira mordida de 87 nunca foi mostrada na tela,"
at(21.58, 'no_screen', x => {
  const s = x.S.arcade; x.out.scene = s; const L = x.L; x.out.screen = 'static';
  const p = x.S.cabScreenPos; const a = 0.6 - 1.0 * eio(x.u); cam(x, [p.x + Math.sin(a) * 2.4, p.y + 0.3, p.z + Math.cos(a) * 2.4], [p.x, p.y - 0.1, p.z], 46); x.S.cabLight.intensity = 2 + 0.6 * Math.sin(x.t * 40);
});
// "mas o FNAF 2"
at(25.22, 'logo_fnaf2', x => { const s = office(x); const m = mangleCeil(x, s, 0, 2.66, -7.0); m.crawl(x.L, 1); cam(x, [0.3, 1.8, 2.6 - 0.6 * x.u], [0, 1.6, -6], 52); logoCard(x, 0); x.post.blur.value = 1; x.post.vig.value = 1.0; });
// "entregou todas as pistas de quem foi a vítima e quem atacou." — Mangle crawls along the hallway ceiling towards us
at(26.20, 'clues', x => {
  const s = office(x); const L = x.L; const m = mangleCeil(x, s, 0, 2.66, mix(-9.0, -4.2, eo(seg(L, 0, 2.6)))); m.crawl(L * 1.4, 1 - seg(L, 2.2, 2.6)); m.idle(x.t, 0.6); x.S.hallLights2.forEach((l, i) => l.intensity = 2.5 * flicker(x.t, i));
  const l = x.FX.torch; s.add(l, l.target); const hp = mangleHead(m); l.position.set(0.3, 1.5, 0.6); l.target.position.copy(hp); l.intensity = 7; l.angle = 0.3;
  camMove(x, [0.0, 1.6, 1.6], [0, 2.2, -6], [0.0, 1.7, 0.6], [0, 2.3, -5], eo, 48); hand(x);
});
// "No final do jogo, o guarda Jeremy" — Jeremy walks into the office
at(28.80, 'jeremy', x => {
  const s = office(x); const L = x.L; const j = put(x, 'jeremy', s, 0, 0, 0, 0); walkTo(j, [0.2, 0, -5.0], [0, 0, -1.6], eo(seg(L, 0, 1.9)), 0.75); j.root.rotation.y = 0;
  if (L > 1.7) lookAtCam(x, j, eo(seg(L, 1.7, 2.0)));
  camMove(x, [0.6, 1.7, 1.6], [0, 1.6, -3.5], [0.45, 1.7, 1.3], [0, 1.65, -1.6], eo, 48); fillOn(x, j, 0.6, 1.8); x.S.officeLamp2.intensity = 6;
});
// "é transferido para o turno do dia para vigiar uma festa de aniversário." — party in full swing
at(30.88, 'birthday', x => {
  const s = party(x); const L = x.L; const ks = kidsParty(x, s); ks.forEach((k, i) => { k.root.position.y = Math.max(0, Math.sin(x.t * 7 + i * 1.5)) * 0.16; const up = Math.sin(x.t * 7 + i * 1.5) > 0.2; k.armR.piv.rotation.z = up ? -2.5 : -0.2; k.armL.piv.rotation.z = up ? 2.5 : 0.2; });
  cakeOn(x, s, [0.0, 0.84, -2.2]);
  const j = put(x, 'jeremy', s, 0, 0, 0, -0.6); walkTo(j, [-1.2, 0, 1.0], [0.95, 0, 0.1], eo(seg(L, 0, 2.0)), 0.75); j.root.rotation.y = mix(Math.atan2(2.15, -0.9), -0.4, eo(seg(L, 1.9, 2.5)));
  const a = 0.4 - 0.7 * eio(x.u); cam(x, [Math.sin(a) * 4.0, 1.9, Math.cos(a) * 3.6], [0.4, 1.0, -1.4], 52); sparkles(x, s, [0, 1.4, -2.2], 0.6, 8, 0.7);
});
// "E o Phone Guy avisa claramente"
at(34.28, 'phone', x => {
  const s = office(x); const L = x.L; const ring = Math.floor(x.t * 2.2) % 2 === 0 && L < 1.0; const lift = eo(seg(L, 1.0, 1.35));
  x.S.phoneHandset2.position.set(0, 0.17 + (ring ? 0.012 * Math.sin(x.t * 90) : 0) + 0.22 * lift, 0.05 * lift); x.S.phoneHandset2.rotation.set(-0.5 * lift, 0, (ring ? 0.05 * Math.sin(x.t * 70) : 0) + 0.3 * lift); x.S.phoneLight2.intensity = ring ? 1.1 : 0.3;
  ringWaves(x, s, new V3(-0.75, 1.25, -0.72));
  camMove(x, [0.4, 2.0, 1.1], [-0.75, 1.05, -0.75], [-0.1, 1.75, 0.55], [-0.75, 1.1, -0.75], eio, 42); hand(x);
});
// "que os robôs estão agressivos apenas com adultos." — robot vision from the ceiling
at(36.66, 'robot_vision', x => {
  const s = party(x); const L = x.L; const ks = kidsParty(x, s); cakeOn(x, s, [0.0, 0.84, -2.2]); const j = put(x, 'jeremy', s, 1.15, 0, 0.1, -0.6); j.idle(x.t, 1);
  const a = -0.4 + 0.7 * eio(seg(L, 0, 1.0)); cam(x, [0.2 + Math.sin(a) * 1.2, 4.6, 1.8], [mix(-0.6, 1.4, eio(seg(L, 0, 1.0))), 0.8, -1.2], 54); hand(x, 0.5);
  const lock = L > 1.05; const hp = tp(j, 'head', [0, 4, 0]); const [u, v] = proj(x, hp);
  x.out.ui = { type: 'vision', box: lock ? [u - 0.12, v - 0.08, 0.24, 0.4] : [0.14, 0.42, 0.5, 0.3], label: lock ? 'ADULTO' : 'CRIANÇAS: OK', id: lock ? 'ALVO' : 'IGNORAR', locked: lock, col: lock ? '#ff3030' : '#5aff6a' };
  x.post.tint.value.set(1.1, 0.9, 0.9);
});
// "Ou seja, a verdadeira vítima dessa tragédia não foi uma criancinha,"
at(38.68, 'not_child', x => {
  const s = party(x); const L = x.L; const ks = kidsParty(x, s, false); ks.forEach((k, i) => { k.root.position.y = Math.max(0, Math.sin(x.t * 6 + i)) * 0.1; });
  const c = put(x, 'cchild', s, 0.1, 0, -0.3, 0); c.idle(x.t, 1); c.head.rotation.x = 0.35 + 0.05 * Math.sin(x.t * 9); c.armR.piv.rotation.x = -1.6; c.armL.piv.rotation.x = -1.6; c.armR.piv.rotation.z = 0.35; c.armL.piv.rotation.z = -0.35;
  const hp = tp(c, 'head', [0, 4, 0]); const a = -0.5 + 0.9 * eio(x.u); cam(x, [hp.x + Math.sin(a) * 2.0, hp.y + 0.35, hp.z + Math.cos(a) * 2.0], [hp.x, hp.y - 0.35, hp.z], 46); fillOn(x, c, 1.2, 1.4);
  if (L > 2.6) { x.post.tint.value.set(0.85, 0.85, 1.0); }
});
// "foi na verdade o próprio segurança tentando proteger a festa."
at(42.44, 'guard_protect', x => {
  const s = party(x); const L = x.L; kidsParty(x, s); cakeOn(x, s, [0.0, 0.84, -2.2]); const j = put(x, 'jeremy', s, 0, 0, 0, 0); walkTo(j, [1.0, 0, 2.6], [0.1, 0, 0.6], eo(seg(L, 0, 1.0)), 0.75); j.root.rotation.y = mix(-0.9, 0, eo(seg(L, 0.8, 1.2)));
  const k = eo(seg(L, 1.0, 1.5)); j.armR.piv.rotation.set(-0.2 * k, 0, -1.35 * k); j.armL.piv.rotation.set(-0.2 * k, 0, 1.35 * k);
  camMove(x, [0.9, 1.4, 4.2], [0.3, 1.3, 0.2], [0.3, 1.5, 2.8], [0.1, 1.45, 0.2], eio, 50); fillOn(x, j, 1.4, 1.8);
  if (L > 1.6) { const c = put(x, 'cchild', s, -0.5, 0, -0.4, 0.3); c.idle(x.t, 1); }
});
// "E o culpado não é o Fredbear," — Fredbear shakes his head "no"
at(45.50, 'not_fredbear', x => {
  const [s, f] = diner(x); const L = x.L; f.head.rotation.y = 0.45 * Math.sin(x.t * 9) * sm(seg(L, 0.4, 0.7)); aim(f, 'R', rootPt(f, -0.25, 1.95 + 0.04 * Math.sin(x.t * 12), 0.55), eo(seg(L, 0.3, 0.6)));
  const hp = tp(f, 'head', [0, 3, 3]); camMove(x, [hp.x + 1.2, hp.y - 0.4, hp.z + 3.2], hp.toArray(), [hp.x + 0.3, hp.y - 0.1, hp.z + 2.2], hp.toArray(), eio, 46);
});
// "a principal suspeita de arrancar o lobo frontal dele é a Mangle." — reveal: she crawls on the office ceiling straight at us
at(47.32, 'mangle', x => {
  const s = office(x); const L = x.L; const m = mangleCeil(x, s, 0, 3.15, mix(-4.5, -1.6, eo(seg(L, 0, 2.2)))); m.crawl(L * 1.3, 1 - seg(L, 1.9, 2.3)); m.idle(x.t, 0.5);
  const hp = mangleHead(m); const z = eo(seg(L, 1.8, 3.1)); cam(x, [0, mix(1.5, 1.6, z), mix(2.4, hp.z + 1.6, z)], [hp.x, hp.y + 0.1, hp.z], mix(55, 46, z)); hand(x, 0.6);
  x.S.officeLamp2.intensity = 2.5 * flicker(x.t, 3); x.S.officeFill2.intensity = 2; x.S.hallLights2.forEach((l, i) => l.intensity = 2 * flicker(x.t, i));
});
// "Se você reparar, o jumpscare dela é o único que ataca" — she hangs right above the guard
at(50.42, 'above_guard', x => {
  const s = office(x); const L = x.L; const m = mangleCeil(x, s, 0, 3.15, 1.6, Math.PI); m.idle(x.t, 1); m.neck.rotation.x += 0.15 * Math.sin(x.t * 2.2); m.setJaw(0.1 + 0.12 * Math.max(0, Math.sin(x.t * 3)));
  const j = put(x, 'jeremy', s, 0, -0.02, 0.75, Math.PI); j.legR.piv.rotation.x = -1.5; j.legL.piv.rotation.x = -1.5; j.armR.piv.rotation.x = -0.9; j.armL.piv.rotation.x = -0.9; j.idle(x.t, 0.5);
  camMove(x, [0.3, 1.55, -3.6], [0, 1.85, 0.6], [0.1, 1.6, -2.9], [0, 1.9, 0.6], eo, 52); x.S.officeLamp2.intensity = 4; x.S.officeLamp2.intensity = 3 * flicker(x.t, 8); x.S.officeFill2.intensity = 2;
});
// "pendurado no teto, com aquela mandíbula gigante" — side view: Mangle hangs in front of the seated guard, face to face, jaw opening
function mangleAt(x, s, hz) { const m = mangleCeil(x, s, 0, 3.15, 0, 0); m.root.updateMatrixWorld(true); const hp = mangleHead(m); m.root.position.z += hz - hp.z; m.root.position.x -= hp.x; return m; }
function guardChair(x, s, flinch = 0) { const j = put(x, 'jeremy', s, 0, -0.02, 0.75, Math.PI); j.legR.piv.rotation.x = -1.5; j.legL.piv.rotation.x = -1.5;
  j.armR.piv.rotation.x = -0.9 - 1.7 * flinch; j.armL.piv.rotation.x = -0.9 - 1.7 * flinch; j.armR.piv.rotation.z = -0.35 * flinch; j.armL.piv.rotation.z = 0.35 * flinch; j.head.rotation.x = -0.35 * flinch; j.torso.rotation.x = -0.25 * flinch; j.idle(x.t, 0.5 * (1 - flinch)); return j; }
at(53.14, 'jaw', x => {
  const s = office(x); const L = x.L; const m = mangleAt(x, s, -0.55 + 0.05 * Math.sin(x.t * 2)); m.idle(x.t, 0.4); m.setJaw(eo(seg(L, 0.6, 1.9)));
  guardChair(x, s, 0.15 * sm(seg(L, 1.2, 2.0)));
  camMove(x, [1.25, 2.5, 2.6], [-0.05, 1.45, -0.45], [1.05, 2.4, 2.15], [-0.05, 1.45, -0.45], eio, 48); hand(x, 0.6);
  x.S.officeLamp2.intensity = 3 * flicker(x.t, 8); x.S.officeFill2.intensity = 2;
});
// "caindo de cima para baixo, exatamente no alto da sua cabeça." — she lunges onto the guard
at(56.06, 'drop', x => {
  const s = office(x); const L = x.L; const k = ei(seg(L, 0.3, 0.6)); const m = mangleAt(x, s, mix(-0.55, 0.3, k)); m.idle(x.t, 0.3 * (1 - k)); m.setJaw(1 - 0.8 * sm(seg(L, 0.6, 0.72)));
  m.root.position.y += 0.25 * (1 - k); guardChair(x, s, eo(seg(L, 0.25, 0.55)));
  cam(x, [1.1, 2.45, 2.25], [-0.05, 1.45, -0.05], 50); hand(x, 0.8);
  x.S.officeLamp2.intensity = (L > 0.6 ? 1.5 : 3) * flicker(x.t, 6); x.S.officeFill2.intensity = 2;
  if (L > 0.6 && L < 1.4) shake(x, 1.0 * (1 - seg(L, 0.6, 1.4)));
  x.post.flash.value = L > 0.6 && L < 0.66 ? 0.3 : 0; x.post.stat.value = L > 0.7 && L < 0.95 ? 0.35 : (L > 2.3 ? 0.3 : 0); x.post.tint.value.set(1.2, 0.85, 0.85);
  x.post.fade.value = 0.75 * seg(L, 1.6, 2.6);
});
// "Você ainda confundia as duas tragédias?" — Fredbear on the left, Mangle hanging on the right
at(58.70, 'confused', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L; const f = put(x, 'fredbear', s, -1.0, 0, 0, 0.3); f.idle(x.t, 1); f.head.rotation.z = 0.2 * eo(seg(L, 0.2, 0.6));
  const m = mangleCeil(x, s, 1.05, 3.4, -0.6); m.idle(x.t, 1); m.setJaw(0.2 + 0.1 * Math.sin(x.t * 3));
  x.S.voidSpot.intensity = 26; x.S.voidFill.intensity = 5; const a = -0.25 + 0.5 * eio(x.u); cam(x, [Math.sin(a) * 5.4, 1.9, Math.cos(a) * 5.4], [0, 1.85, 0], 50);
  pop(x, x.FX.q1, s, [0.05, 3.1, 0.3], 0.5, 0.8);
});
// "Comenta aí e me segue para mais mistérios."
at(61.02, 'outro', x => {
  const s = office(x); const L = x.L; const j = put(x, 'jeremy', s, 0, 0, -1.4, 0.0); j.idle(x.t, 1);
  aim(j, 'R', rootPt(j, -0.5, 2.0 + 0.12 * Math.sin(x.t * 9), 0.4), eo(seg(L, 0, 0.3)));
  const m = mangleCeil(x, s, 0.0, 3.15, -3.8); m.idle(x.t, 1); m.setJaw(0.15 * Math.max(0, Math.sin(x.t * 2)));
  camMove(x, [0.2, 1.7, 1.6], [0, 1.95, -1.6], [0.1, 1.7, 1.0], [0, 2.0, -1.6], eo, 54); lookAtCam(x, j, 0.8); fillOn(x, j, 0.8, 1.8); x.S.officeLamp2.intensity = 7;
});

export const SHOTS = shots;
export const DURATION = 62.95;
