// Shot list for "Por isso o Withered Foxy te ignora no FNAF 2". Pure function of time.
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
// ---------- helpers for the Withered Foxy video ----------
function headOnly(c) { c.body.visible = false; c.bodyO.visible = false; for (const L of [c.armR, c.armL, c.legR, c.legL]) L.piv.visible = false; }
function torch(x, s, from, to, I = 40) { const l = x.FX.torch; s.add(l, l.target); l.position.set(...from); l.target.position.set(...to); l.intensity = I; }
function office(x) { const s = x.S.office2; x.out.scene = s; x.post.vig.value = 0.9; return s; }
const GZ = 0.75; // guard seat z
function guard2(x, s, who = 'guard') { const g = put(x, who, s, 0, -0.02, GZ, Math.PI); g.legR.piv.rotation.x = -1.5; g.legL.piv.rotation.x = -1.5; g.armR.piv.rotation.x = -0.9; g.armL.piv.rotation.x = -0.9; g.idle(x.t, 0.6); return g; }
// Freddy mask on a character's head; k=1 fully on, k<1 coming down from above/in front
function wearMask(x, c, k = 1) {
  const m = x.C.fmask; c.root.updateMatrixWorld(true); x.out.scene.add(m.root); headOnly(m); m.root.visible = k > 0.02;
  const sc = c.root.scale.x * 1.18; if (k > 0.85 && c.hat) c.hat.visible = false; m.root.scale.setScalar(sc);
  const q = c.head.getWorldQuaternion(new THREE.Quaternion()); m.root.quaternion.copy(q);
  const up = new V3(0, 1, 0).applyQuaternion(q), fw = new V3(0, 0, 1).applyQuaternion(q);
  const target = c.head.getWorldPosition(new V3()).addScaledVector(up, -0.25 * 0.18 * c.root.scale.x + (1 - k) * 0.45).addScaledVector(fw, (1 - k) * 0.35);
  m.root.position.set(0, 0, 0); m.root.updateMatrixWorld(true); const hp = m.head.getWorldPosition(new V3()); m.root.position.copy(target.sub(hp));
  if (k < 1) m.root.rotateX(-(1 - k) * 0.6);
}
function maskOnGuard(x, g, k) { wearMask(x, g, k); if (k < 1) { const hp = g.head.getWorldPosition(new V3()); const a = eo(seg(k, 0, 0.3)) * (1 - seg(k, 0.85, 1)); aim(g, 'R', hp.clone().add(new V3(-0.18, 0.15, -0.15)), a); aim(g, 'L', hp.clone().add(new V3(0.18, 0.15, -0.15)), a); } }
function foxHall(x, s, z, ry = 0, xx = 0) { const f = put(x, 'wfoxy', s, xx, 0, z, ry); f.idle(x.t, 1); return f; }
function twitch(x, f, amt = 1, seed = 0) { const t = x.t; const j = (a, b) => (Math.sin(t * a + seed) > 0.82 ? 1 : 0) * Math.sin(t * b) * amt;
  f.head.rotation.z += 0.35 * j(13, 70); f.head.rotation.x += 0.25 * j(9.3, 55); f.armR.piv.rotation.x += -0.8 * j(7.7, 40); f.jaw.rotation.x = Math.max(f.jaw.rotation.x, 0.5 * Math.abs(j(11, 30))); }
function mg(x, spec) { x.out.scene = x.S.void; x.out.ui = { type: 'mg', mg: spec }; }
function ringWaves(x, s, p, col) { x.FX.waves.forEach((w, i) => { const k = (x.t * 1.3 + i / 4) % 1; s.add(w); w.position.copy(p); w.scale.setScalar(0.12 + 0.55 * k); w.material.opacity = 0.85 * (1 - k); w.material.color.set(col || '#ff6060'); w.quaternion.copy(x.camera.quaternion); }); }
function soulsAround(x, s, c, rad = 0.9, n = 5, h = 1.4) { for (let i = 0; i < n; i++) { const a = x.t * 0.9 + i * 6.283 / n; orbAt(x, i, s, new V3(c[0] + Math.cos(a) * rad, h + 0.2 * Math.sin(x.t * 2 + i), c[2] + Math.sin(a) * rad), 0.55); } }
function vision(x, wp, w, h, spec = {}) { const [u, v] = proj(x, wp); x.out.ui = Object.assign({ type: 'vision', box: [u - w / 2, v - h / 2, w, h] }, spec); }
function voidSet(x, rim = '#ff4030') { const s = x.S.void; x.out.scene = s; x.S.voidRim.intensity = 14; x.S.voidRim.color.set(rim); x.post.vig.value = 1.0; return s; }

// ===== HOOK =====
// "Todo mundo acha que o Foxy ignora sua máscara"
at(0.00, 'hook_mask', x => {
  const s = office(x); const L = x.L; const g = guard2(x, s); maskOnGuard(x, g, eo(seg(L, 0.15, 0.95)));
  const f = foxHall(x, s, mix(-7.5, -5.2, eo(seg(L, 0, 1.6))), 0); f.walk(L * 1.6, 0.8 * (1 - seg(L, 1.3, 1.6)));
  torch(x, s, [0.35, 1.45, 0.3], [0, 1.4, -6], 26); x.S.officeLamp2.intensity = 6.2;
  camMove(x, [0.85, 1.8, 2.25], [0.05, 1.3, -5], [0.65, 1.7, 1.95], [0, 1.35, -5], eo, 52); hand(x); staticIn(x, 0.15);
});
// "...no FNAF 2"
at(1.66, 'ignored', x => {
  const s = office(x); const L = x.L; const g = guard2(x, s); wearMask(x, g, 1); g.head.rotation.x = 0.05 * Math.sin(x.t * 9);
  const f = foxHall(x, s, -1.55, 0.08); f.head.rotation.x = 0.25; f.head.rotation.y = 0.25 * Math.sin(x.t * 1.3); f.head.rotation.z = 0.25 * eo(seg(L, 0.2, 0.6)); f.jaw.rotation.x = 0.25;
  torch(x, s, [0.3, 1.45, 0.4], [0, 1.6, -1.6], 14); x.S.officeLamp2.intensity = 9;
  camMove(x, [0.95, 2.3, 2.0], [0, 1.65, -1.3], [0.75, 2.2, 1.7], [0, 1.7, -1.4], eo, 50); hand(x);
});
at(2.58, 'logo_fnaf2', x => { const s = office(x); foxHall(x, s, -6.5, 0); torch(x, s, [0.3, 1.45, 0.4], [0, 1.4, -6.5], 10); cam(x, [0, 1.5, 1.5], [0, 1.4, -6], 48); logoCard(x, 0); x.post.vig.value = 1.1; });
// "porque o sistema dele quebrou."
at(3.22, 'system_broken', x => {
  const s = office(x); const L = x.L; const f = foxHall(x, s, -4.2, 0); twitch(x, f, 1.2); x.S.hallLights2.forEach((l, i) => l.intensity = 4 * flicker(x.t, i));
  torch(x, s, [0.3, 1.5, -0.5], [0, 1.6, -4.2], 18 * flicker(x.t * 1.3, 3));
  const hp = f.neck.getWorldPosition(new V3()); sparksAt(x, s, hp.clone().add(new V3(0.15, 0, 0.1)), (L % 0.8) / 0.8 * 1.2);
  camMove(x, [0.7, 1.9, -1.1], [0, 1.75, -4.2], [0.45, 1.9, -1.6], [0, 1.8, -4.2], eo, 46); shake(x, 0.12);
  vision(x, hp.clone().add(new V3(0, 0.3, 0)), 0.55, 0.32, { label: 'SYSTEM ERROR', id: 'FOXY.EXE', col: Math.floor(x.t * 6) % 2 ? '#ff2a2a' : '#ff9a9a' });
  x.post.stat.value = (Math.sin(x.t * 31) > 0.85) ? 0.5 : 0; x.post.chroma.value = 0.4;
});
// "Mas o verdadeiro motivo não é nenhum defeito"
at(4.94, 'real_reason', x => {
  const s = office(x); const L = x.L; const f = foxHall(x, s, -3.6, 0); f.head.rotation.x = 0.12; f.head.rotation.y = -0.1 + 0.2 * eo(seg(L, 0.4, 1.2)); f.jaw.rotation.x = 0.12;
  torch(x, s, [0.2, 1.55, -1.2], [0, 1.85, -3.6], 10); x.S.hallLights2.forEach(l => l.intensity = 1.0); x.S.officeLamp2.intensity = 2.2;
  const hp = f.neck.getWorldPosition(new V3()).add(new V3(0, 0.3, 0)); camMove(x, [0.25, 1.95, -1.6], hp.toArray(), [0.12, 1.95, -2.15], hp.toArray(), eio, 44); hand(x);
});
// "...mecânico," — endoskeleton x-ray: everything works
at(6.42, 'no_defect', x => {
  const s = voidSet(x, '#40ff70'); const L = x.L; const f = put(x, 'wfoxy', s, 0, 0, 0, 0); f.idle(x.t, 1); x.setXray(f, 1, 0.9 + 0.3 * Math.sin(x.t * 6), '#40ff70');
  const a = -0.6 + 0.9 * eio(x.u); cam(x, [Math.sin(a) * 3.4, 1.6, Math.cos(a) * 3.4], [0, 1.35, 0], 42); x.S.voidSpot.intensity = 26;
  vision(x, new V3(0, 1.3, 0), 0.7, 0.62, { label: 'SENSORES: OK', id: 'DIAGNÓSTICO 100%', col: '#5aff7a' });
});
// "na verdade é um trauma bizarro."
at(7.74, 'trauma', x => {
  const s = voidSet(x, '#ff2030'); const L = x.L; const f = put(x, 'wfoxy', s, 0, 0, 0, 0.15); f.idle(x.t, 0.5); f.head.rotation.x = 0.35 * eo(seg(L, 0.2, 0.9)); droop(f, 0.6 * eo(seg(L, 0.2, 0.9)));
  x.setXray(f, 0.75 * sm(seg(L, 0.5, 1.0)), 0.3, '#ff4040');
  const ch = f.torso.localToWorld(new V3(0, 6 * x_U, 1 * x_U)); orbAt(x, 0, s, ch, 0.6 * sm(seg(L, 0.6, 1.1)) * (1 + 0.15 * Math.sin(x.t * 12)));
  const k = put(x, 'kidghost', s, 0.9, 0, 0.6, -0.5, 0.95); k.idle(x.t, 1); x.C.kidghost.ghostMat.opacity = 0.45 * sm(seg(L, 0.9, 1.4)) * (Math.sin(x.t * 40) > -0.6 ? 1 : 0.2);
  camMove(x, [0.9, 1.9, 2.6], [0.2, 1.6, 0], [0.6, 1.85, 2.0], [0.25, 1.55, 0], eo, 46); x.S.voidSpot.intensity = 14; x.S.voidSpot.color.set('#ffb0a0');
  x.post.stat.value = (L > 0.9 && L < 1.0) || (L > 1.3 && L < 1.36) ? 0.6 : 0; x.post.tint.value.set(1.15, 0.85, 0.85);
});
// "O Phone Guy tenta te convencer..."
at(9.38, 'phone', x => {
  const s = office(x); const L = x.L; const ring = Math.floor(x.t * 2.2) % 2 === 0 && L < 1.0; const lift = eo(seg(L, 1.0, 1.35));
  x.S.phoneHandset2.position.set(0, 0.17 + (ring ? 0.012 * Math.sin(x.t * 90) : 0) + 0.22 * lift, 0.05 * lift); x.S.phoneHandset2.rotation.set(-0.5 * lift, 0, (ring ? 0.05 * Math.sin(x.t * 70) : 0) + 0.3 * lift);
  x.S.phoneLight2.intensity = ring ? 1.1 : 0.5 * (1 - lift);
  ringWaves(x, s, new V3(-0.75, 1.25, -0.72), lift > 0.5 ? '#b8ffc0' : '#ff6060');
  camMove(x, [0.05, 1.9, 0.95], [-0.75, 1.05, -0.75], [-0.1, 1.8, 0.65], [-0.75, 1.08, -0.75], eo, 40); hand(x);
  const g = guard2(x, s); g.root.visible = false;
});
// "de que o robô só é instável e cheio de falhas."
at(11.20, 'unstable', x => {
  const s = office(x); const L = x.L; const f = foxHall(x, s, -7.0, 0.1); twitch(x, f, 1.4, 2); x.S.hallLights2.forEach((l, i) => l.intensity = 4.5 * flicker(x.t, i + 2));
  const hp = f.neck.getWorldPosition(new V3()); sparksAt(x, s, f.armR.piv.getWorldPosition(new V3()), ((L + 0.2) % 0.75) / 0.75 * 1.2);
  torch(x, s, [0.3, 1.45, -1.5], [0, 1.4, -7], 16 * flicker(x.t * 0.8, 5));
  camMove(x, [0.7, 1.3, -3.2], [0, 1.5, -7], [0.45, 1.45, -4.0], [0, 1.55, -7], eo, 44); hand(x, 1.5);
  x.post.stat.value = Math.sin(x.t * 23) > 0.93 ? 0.4 : 0;
});
// "Mas a resposta real está bem na nossa cara,"
at(13.44, 'in_your_face', x => {
  const s = office(x); const L = x.L; const k = eo(seg(L, 0, 1.5)); const f = foxHall(x, s, mix(-7, -2.7, k), 0); f.walk(L * 1.9, 1 - seg(L, 1.2, 1.5)); f.head.rotation.x = 0.1; f.jaw.rotation.x = 0.35 * seg(L, 1.4, 1.8);
  torch(x, s, [0.25, 1.6, -0.5], [0, 1.6, -3], 12 + 10 * k); x.S.officeLamp2.intensity = 4.2;
  cam(x, [0, 1.95, -0.75], [0, 1.9, -3.2], 46); hand(x); if (L > 1.45 && L < 1.6) shake(x, 0.6);
});
// "no minigame clássico do próprio Foxy."
at(15.72, 'arcade', x => {
  const s = x.S.screenroom; x.out.scene = s; const L = x.L; x.out.screen = 'mg';
  x.out.mg = { cx: 58, cy: 112, z: 1.4, curtain: 0, text: 'GET READY!', textSc: 1, textY: 6, blink: 1, foxy: { x: 55, y: 148, run: 0 } };
  x.S.screenLamp.intensity = 1.2; x.S.arcLight.intensity = 4; x.S.neonLight.intensity = 0; x.S.neonMat.opacity = 0;
  const p = x.S.arcScreenPos; const k = eio(seg(L, 0, 1.9)); cam(x, [p.x + mix(-1.6, 0, k), p.y + mix(0.2, 0.0, k), p.z + mix(3.2, 0.52, k)], [p.x, p.y, p.z], mix(50, 48, k));
  x.post.flash.value = L > 1.85 ? (L - 1.85) / 0.15 : 0;
});

// ===== PIXEL MINIGAME (2D) =====
// "Nesse minigame você sai da cortina"
at(17.72, 'mg_curtain', x => { const L = x.L; const run = L > 0.45; const fx = run ? 55 + (L - 0.45) * 75 : 55, fy = 148 + 28 * eo(seg(L, 0.5, 0.85));
  mg(x, { cx: Math.max(56, fx), cy: 116, z: 2, curtain: eo(seg(L, 0.05, 0.4)), text: 'GO! GO! GO!', blink: 1, foxy: { x: fx, y: fy, run, ph: L * 15, jaw: L < 0.45 ? 1 : undefined }, flash: L < 0.12 ? 1 - L / 0.12 : 0 }); });
// "correndo pra animar as crianças."
at(18.70, 'mg_run', x => { const L = x.L; const fx = 96 + L * 150; mg(x, { cx: fx + 14, cy: 140, z: 2, foxy: { x: fx, y: 176, run: 1, ph: x.t * 16 } }); });
at(20.04, 'mg_kids', x => { const L = x.L; const k = eo(seg(L, 0, 0.5)); const fx = mix(297, 352, k), fy = mix(176, 212, k);
  mg(x, { cx: mix(320, 375, eo(seg(L, 0, 0.6))), cy: 150, z: 1.6, kids: L > 0.25 ? 'cheer' : 'sit', confetti: L > 0.25, text: L > 0.25 ? 'HURRAY!' : null, textCol: r => r < 3 ? '#ffffff' : '#ffd23a', foxy: { x: fx, y: fy, run: k < 1, ph: x.t * 16, jaw: 1 } }); });
// "Tudo parece normal,"
at(21.00, 'mg_normal', x => { const L = x.L; const a = L < 0.7; const k = eo(seg(L, a ? 0 : 0.7, a ? 0.7 : 1.4));
  mg(x, { cx: a ? mix(372, 384, k) : mix(458, 470, k), cy: a ? 100 : 166, z: 3, kids: 'cheer', confetti: 1, foxy: { x: 352, y: 212, run: 0, jaw: Math.floor(x.t * 5) % 2 } }); });
// "porém na terceira vez que você corre para o salão"
at(22.40, 'mg_third', x => { const L = x.L;
  if (L < 0.52) { mg(x, { cx: 58, cy: 116, z: 2, curtain: 0, third: 1, fadeBlack: 0.85, glitch: 0.5 }); return; }
  if (L < 1.22) { mg(x, { cx: 58, cy: 116, z: 2, curtain: 1, third: 1, foxy: { x: 55, y: 148, run: 0, eyeGlow: 1 }, big: '3', bigK: 0.8 + 0.2 * back(seg(L, 0.52, 0.75)), glitch: 0.25 }); return; }
  const fx = 120 + (L - 1.22) * 140; mg(x, { cx: fx + 14, cy: 140, z: 2, third: 1, foxy: { x: fx, y: 176, run: 1, ph: x.t * 14 }, glitch: 0.12 + 0.3 * (Math.sin(x.t * 9) > 0.7) }); });
// "a festa acabou."
at(24.88, 'mg_over', x => { const L = x.L; const k = eo(seg(L, 0, 0.4));
  mg(x, { cx: mix(300, 345, eo(x.u)), cy: 150, z: 2, third: 1, kids: 'dead', foxy: { x: mix(296, 318, k), y: 180, run: k < 1, ph: x.t * 14 }, glitch: L < 0.15 ? 0.9 : 0.1 }); });
// "O William Afton está lá no canto sorrindo"
at(25.76, 'mg_afton', x => { const L = x.L; const k = eio(seg(L, 0, 1.0)), z = L < 1.15 ? 2 : 3;
  mg(x, { cx: z === 2 ? mix(360, 500, k) : 516, cy: z === 2 ? mix(150, 90, k) : mix(78, 72, seg(L, 1.15, 2.2)), z, third: 1, kids: 'dead', pg: 1, pgGlint: 1, glitch: (L > 1.1 && L < 1.2) ? 0.9 : (Math.sin(x.t * 7) > 0.92 ? 0.35 : 0.05) }); });
// "e as cinco crianças estão caídas no chão."
at(28.00, 'mg_dead', x => { const L = x.L; const k = eio(seg(L, 0, 2.0));
  mg(x, { cx: mix(352, 470, k), cy: mix(140, 200, k), z: 2.5, third: 1, kids: 'dead', pg: 1, glitch: 0.06 + 0.9 * seg(L, 1.8, 2.2), fadeBlack: seg(L, 2.0, 2.22) }); });

// ===== THE TRICK =====
// "E o truque usado pelo assassino"
at(30.22, 'killer_door', x => {
  const s = x.S.party; x.out.scene = s; const L = x.L; s.children.forEach(o => { if (o.isPointLight && o !== x.S.backDoorLight && o !== x.S.partyRed) o.intensity *= 1; });
  const p = put(x, 'purpleguy', s, -4.6, 0, -4.55, 0.35); p.idle(x.t, 1); lookAtCam(x, p, 0.7);
  [[0, -1.2, -1.0, 0.4], [1, 0.2, -1.4, -0.5], [2, -2.3, 0.4, 2.4]].forEach(([i, px, pz, ry]) => { const k = put(x, 'kid' + i, s, px, 0, pz, ry); k.idle(x.t, 1, i); k.head.rotation.z = 0.15 * Math.sin(x.t * 6 + i); });
  x.S.backDoorLight.intensity = 3; staticIn(x, 0.15);
  camMove(x, [1.8, 1.7, 3.8], [-4.2, 1.5, -4.5], [0.9, 1.75, 2.6], [-4.4, 1.6, -4.5], eo, 46); hand(x);
});
// "para atrair as crianças para a morte"
at(31.96, 'lure', x => {
  const s = x.S.party; x.out.scene = s; const L = x.L; const b = put(x, 'springbonnie', s, -4.6, 0, -4.4, 0.3); b.idle(x.t, 1);
  aim(b, 'R', rootPt(b, -0.6, 1.9 + 0.15 * Math.sin(x.t * 7), 0.4), 1); b.head.rotation.z = 0.15 * Math.sin(x.t * 3);
  [[0, -4.0, 0.6], [1, -4.9, 1.3], [2, -4.4, 2.1]].forEach(([i, px, pz], j) => { const k = put(x, 'kid' + i, s, 0, 0, 0, 0); const tx = -4.4 + 0.5 * (j - 1), tz = -3.3 + 0.3 * j; const kk = sm(seg(L, 0.1 * j, 1.7)); walkTo(k, [px, 0, pz], [tx, 0, tz], kk, 0.6); k.root.rotation.y = Math.atan2(tx - px, tz - pz); });
  x.S.backDoorLight.intensity = 3;
  camMove(x, [-0.6, 2.1, 3.4], [-4.5, 1.0, -2.0], [-1.0, 2.0, 2.8], [-4.5, 1.1, -2.4], eo, 50); hand(x);
});
// "foi justamente usar um traje de mascote."
at(33.68, 'suit', x => {
  const s = x.S.party; x.out.scene = s; const L = x.L; const reveal = L > 1.15 && Math.sin(x.t * 38) > 0.2 && L < 1.75;
  const b = put(x, reveal ? 'purpleguy' : 'springbonnie', s, -4.6, 0, -4.2, 0.35); b.idle(x.t, 0.6); if (!reveal) { aim(b, 'R', rootPt(b, -0.5, 1.7, 0.5), 0.6); b.head.rotation.z = 0.12 * Math.sin(x.t * 2.5); }
  x.S.backDoorLight.intensity = 5; x.S.backDoorLight.color.set('#b070ff'); x.S.backDoorLight.position.set(-4.6, 2.9, -4.85);
  const a = 0.5 - 0.6 * eio(x.u); const hp = new V3(-4.6, 1.75, -4.2); cam(x, [hp.x + Math.sin(a) * 2.2, 1.65, hp.z + Math.cos(a) * 2.2], [hp.x, 1.6, hp.z], 44); hand(x);
  x.post.stat.value = reveal ? 0.35 : 0; x.post.tint.value.set(1, 0.95, 1.08);
});

// ===== THE SOUL =====
// "A alma dentro do Foxy lembra perfeitamente disso."
at(35.66, 'soul_inside', x => {
  const s = voidSet(x, '#7ac8ff'); const L = x.L; const f = put(x, 'wfoxy', s, 0, 0, 0, 0); f.idle(x.t, 0.7); x.setXray(f, 0.8, 0.25, '#7ac8ff');
  const k = put(x, 'kidghost', s, 0, 0.95 + 0.03 * Math.sin(x.t * 2), 0.05, 0, 0.62); k.idle(x.t, 1); k.armR.piv.rotation.x = -0.3; k.armL.piv.rotation.x = -0.3; x.C.kidghost.ghostMat.opacity = 0.42 * sm(seg(L, 0.2, 0.8));
  orbAt(x, 0, s, f.torso.localToWorld(new V3(0, 6 * x_U, 1 * x_U)), 0.5);
  const a = 0.4 - 0.5 * eio(x.u); cam(x, [Math.sin(a) * 3.0, 1.7, Math.cos(a) * 3.0], [0, 1.35, 0], 44); x.S.voidSpot.intensity = 20;
  // memory flashes of the minigame
  const fl = (L > 1.5 && L < 1.62) || (L > 1.85 && L < 1.95) || (L > 2.2 && L < 2.28);
  if (fl) x.out.ui = { type: 'mg', mg: { cx: 516, cy: 74, z: 3, third: 1, kids: 'dead', pg: 1, glitch: 0.5 } };
});

// ===== THE MASK =====
// "Ele não ignora sua máscara"
at(38.36, 'approach', x => {
  const s = office(x); const L = x.L; const g = guard2(x, s); wearMask(x, g, 1); g.head.rotation.x = 0.05 * Math.sin(x.t * 11);
  const f = foxHall(x, s, mix(-7.5, -2.5, eo(seg(L, 0, 1.5))), 0); f.walk(L * 1.8, 1 - seg(L, 1.3, 1.6)); f.head.rotation.x = 0.15;
  torch(x, s, [0.3, 1.45, 0.4], [0, 1.4, -4.5], 18); x.S.officeLamp2.intensity = 5.6;
  cam(x, [0.9, 2.15, 2.7], [0, 1.3, -4.5], 50); hand(x);
});
// "por causa do sensor pifado."
const POV = [0, 2.05, -2.35];
function foxPOV(x, s, who, k = 0) { const g = guard2(x, s, who); wearMask(x, g, 1); g.head.rotation.x = 0.05 * Math.sin(x.t * 11); g.head.rotation.y = 0.08 * Math.sin(x.t * 3);
  x.S.officeLamp2.intensity = 8.4; cam(x, [mix(POV[0], 0, k), mix(POV[1], 1.85, k), mix(POV[2], -1.3, k)], [0, 1.4, GZ], 50); hand(x, 0.8); return g; }
at(40.02, 'sensor_ok', x => { const s = office(x); const g = foxPOV(x, s, 'guard', eo(x.u) * 0.3);
  vision(x, g.head.getWorldPosition(new V3()).add(new V3(0, 0.3, 0)), 0.42, 0.24, { label: 'SENSOR: OK', id: 'VISÃO: 100%', col: '#5aff7a' }); x.post.tint.value.set(0.9, 1.05, 0.9); });
// "E sim porque na cabeça dele qualquer adulto que veste uma fantasia de animatrônico"
at(41.22, 'costume', x => { const s = office(x); const L = x.L; const g = foxPOV(x, s, 'guard', 0.3 + 0.3 * eo(seg(L, 0, 2.4)));
  vision(x, g.head.getWorldPosition(new V3()).add(new V3(0, 0.3, 0)), 0.44, 0.26, { label: 'FANTASIA DETECTADA', id: 'ADULTO', col: '#ffb030' }); x.post.tint.value.set(1.05, 0.98, 0.9); });
at(43.70, 'flicker_killer', x => { const s = office(x); const L = x.L; const pgOn = (Math.sin(x.t * 26) > 0.1) || L > 1.5;
  const g = foxPOV(x, s, pgOn ? 'purpleguy' : 'guard', 0.6 + 0.2 * eo(x.u));
  vision(x, g.head.getWorldPosition(new V3()).add(new V3(0, 0.3, 0)), 0.46, 0.27, { label: 'ANALISANDO...', id: 'ID: ????', col: '#ff6a4a' });
  x.post.stat.value = pgOn !== (Math.sin((x.t - 1 / 30) * 26) > 0.1) ? 0.6 : 0.05; x.post.tint.value.set(1.15 + 0.15 * seg(L, 0, 1.8), 0.85, 0.85); x.post.chroma.value = 0.5; });
// "É o assassino tentando fazer outra vítima."
at(45.54, 'killer_lock', x => { const s = office(x); const L = x.L; const g = foxPOV(x, s, 'purpleguy', 0.8 + 0.2 * eo(x.u));
  vision(x, g.head.getWorldPosition(new V3()).add(new V3(0, 0.3, 0)), 0.48, 0.28, { locked: true, label: 'ASSASSINO', id: 'ID: WILLIAM AFTON' }); x.post.tint.value.set(1.35, 0.75, 0.75); x.post.chroma.value = 0.7;
  if (L < 0.08) x.post.flash.value = 0.3; });
at(46.80, 'lunge', x => { const s = office(x); const L = x.L; cam(x, [0, 1.5, GZ - 0.05], [0, 1.55, -3], 52); x.S.officeLamp2.intensity = 4.2;
  const f = put(x, 'wfoxy', s, 0, 0, -3, 0); f.idle(x.t, 1); if (L < 0.12) { f.root.position.z = -3.2; } else jumpscare(x, f, L - 0.12, { from: 2.8, to: 1.4 }); torch(x, s, [0.2, 1.45, 0.5], [0, 1.6, -2], 10); });

// ===== CONCLUSION =====
// "Ele é o único que não cai no mesmo truque"
at(47.94, 'hero', x => {
  const s = office(x); const L = x.L; const f = foxHall(x, s, -4.2, 0); f.head.rotation.x = -0.1; aim(f, 'R', rootPt(f, -0.4, 1.3, 0.6), 0.6);
  soulsAround(x, s, [0, 0, -4.2], 0.62, 5, 1.7); x.S.hallLights2.forEach(l => l.intensity = 1.2); torch(x, s, [0.3, 0.4, -1.4], [0, 1.7, -4.2], 20);
  camMove(x, [0.5, 0.5, -0.9], [0, 1.7, -4.2], [0.35, 0.6, -1.3], [0, 1.75, -4.2], eo, 52);
});
// "duas vezes."
at(49.28, 'no_no', x => {
  const s = voidSet(x, '#ff8040'); const L = x.L; const f = put(x, 'wfoxy', s, 0, 0, 0, 0); f.idle(x.t, 0.6);
  const w = eo(seg(L, 0, 0.25)); aim(f, 'R', rootPt(f, -0.25 + 0.18 * Math.sin(x.t * 14) * w, 1.95, 0.55), w); f.head.rotation.y = 0.28 * Math.sin(x.t * 10) * w; f.jaw.rotation.x = 0.15;
  cam(x, [0.35, 1.85, 2.0], [0, 1.75, 0], 44); x.S.voidSpot.intensity = 30; x.S.voidSpot.color.set('#ffe6cc');
});
// "Você já tinha pensado por esse lado?"
at(50.28, 'think', x => {
  const s = voidSet(x, '#7ac8ff'); const L = x.L; const f = put(x, 'wfoxy', s, 0, 0, 0, 0.1); f.idle(x.t, 1); f.head.rotation.z = 0.3 * eo(seg(L, 0.1, 0.5)); lookAtCam(x, f, 0.8);
  aim(f, 'L', rootPt(f, 0.15, 1.55, 0.45), eo(seg(L, 0.2, 0.6)));
  camMove(x, [0.5, 1.95, 2.6], [0, 1.7, 0], [0.3, 1.9, 2.1], [0, 1.75, 0], eo, 44); x.S.voidSpot.intensity = 30; x.S.voidSpot.color.set('#ffe6cc');
  pop(x, x.FX.q1, s, headTop(f, 0.85), 0.35, 0.9);
});
// "Comenta aí e me segue para mais mistérios."
at(52.32, 'outro', x => {
  const s = office(x); const L = x.L; const f = foxHall(x, s, -2.6, 0); lookAtCam(x, f, 1);
  aim(f, 'R', rootPt(f, -0.45, 2.0 + 0.12 * Math.sin(x.t * 9), 0.35), eo(seg(L, 0, 0.3))); f.jaw.rotation.x = 0.2 + 0.15 * Math.sin(x.t * 8);
  x.S.officeLamp2.intensity = 14.0; torch(x, s, [0.3, 1.5, 0.2], [0, 1.6, -2.6], 8);
  camMove(x, [0.35, 1.85, 1.5], [0, 1.85, -2.6], [0.2, 1.85, 1.2], [0, 1.85, -2.6], eo, 50);
});

export const SHOTS = shots;
export const DURATION = 54.26;
