// Shot list for "Por que o Springtrap segue o audio do Balloon Boy". Pure function of time.
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

// ---------- helpers for the Springtrap video ----------
const shots = [];
const at = (t, name, fn) => shots.push({ t, name, fn });
function wavesAt(x, scene, p, s = 1, speed = 1.4) { x.FX.waves.forEach((w, i) => { const r = (x.t * speed + i / 4) % 1; scene.add(w); w.position.copy(p); w.quaternion.copy(x.camera.quaternion); w.scale.setScalar(s * (0.4 + 2.6 * r)); w.material.opacity = 0.85 * (1 - r) ** 1.3; }); }
function speakerOn(x, k = 1) { x.S.speakerLed.material.emissiveIntensity = 3 * k * (Math.floor(x.t * 8) % 2 ? 1 : 0.3); if (k > 0) wavesAt(x, x.S.fright, x.S.speakerPos.clone().add(new V3(0.12, 0, 0)), 0.6); }
function frFlicker(x, amt = 1) { x.S.frLamps.forEach((l, i) => l.intensity = 8 * mix(1, flicker(x.t, i * 3), amt)); }
function frightBase(x, flick = 0.6) { const s = x.S.fright; x.out.scene = s; frFlicker(x, flick); x.post.tint.value.set(0.92, 1.05, 0.92); x.post.vig.value = 0.85; return s; }
function laughBB(c, t, k = 1) { c.head.rotation.x += (-0.25 + 0.12 * Math.sin(t * 22)) * k; c.torso.rotation.x += -0.08 * k + 0.03 * Math.sin(t * 22) * k; c.pelvis.position.y += 0.012 * Math.abs(Math.sin(t * 11)) * k; c.armR.piv.rotation.x += -0.5 * k; c.armL.piv.rotation.x += -0.5 * k; c.armR.piv.rotation.z += -0.25 * k; c.armL.piv.rotation.z += 0.25 * k; }
function sit(c, lean = 0.15) { c.legR.piv.rotation.x = -1.45; c.legL.piv.rotation.x = -1.45; c.legR.piv.rotation.z = -0.12; c.legL.piv.rotation.z = 0.12; c.pelvis.position.y = 0.14; c.torso.rotation.x = lean; }
function twitch(c, t, k = 1) { const j = Math.sin(t * 31) * Math.sin(t * 7.3); c.head.rotation.z += 0.12 * j * k; c.head.rotation.x += 0.06 * Math.sin(t * 17) * k; c.torso.rotation.z += 0.03 * j * k; }
// suit drags the body: legs walk on their own, torso leans back, arms reach behind, head shakes
function dragged(c, t, phase, k = 1) { c.walk(phase, 0.9 * k, 0.15); c.torso.rotation.x += -0.28 * k; c.head.rotation.y += 0.5 * Math.sin(t * 9) * k; c.head.rotation.x += -0.15 * k;
  c.armR.piv.rotation.x += 0.9 * k + 0.25 * Math.sin(t * 7); c.armL.piv.rotation.x += 0.75 * k + 0.25 * Math.sin(t * 6 + 1); c.armR.piv.rotation.z += -0.5 * k; c.armL.piv.rotation.z += 0.5 * k; }
function kidsAt(x, s, tx, tz, k = 0) { const P = [[-0.75, 0.75, Math.PI], [0.75, 0.75, Math.PI], [-0.4, -0.75, 0], [0.5, -0.75, 0]];
  return P.map(([dx, dz, ry], i) => { const c = put(x, 'kid' + i, s, tx + dx, 0, tz + dz, ry, 0.68); c.idle(x.t, 1, i); if (k > 0) { c.pelvis.position.y += 0.03 * Math.abs(Math.sin(x.t * 9 + i)) * k; c.armR.piv.rotation.x -= (1.2 + 0.4 * Math.sin(x.t * 10 + i)) * k; c.armL.piv.rotation.x -= (0.6 + 0.3 * Math.sin(x.t * 8 + i)) * k; c.head.rotation.x -= 0.25 * k; } return c; }); }
function dinerStage(x, s, perform = 1) { const b = put(x, 'bonnie', s, -0.9, 0.77, -4.4, 0.15), f = put(x, 'fredbear', s, 0.9, 0.77, -4.4, -0.15);
  b.idle(x.t, 1); f.idle(x.t, 1, 2); if (perform) { b.armR.piv.rotation.x = -0.9 + 0.25 * Math.sin(x.t * 8); b.armL.piv.rotation.x = -0.7; b.head.rotation.z = 0.12 * Math.sin(x.t * 4); f.armR.piv.rotation.x = -1.3; f.armR.piv.rotation.z = -0.2; f.head.rotation.z = 0.1 * Math.sin(x.t * 4 + 1); f.torso.rotation.z = 0.04 * Math.sin(x.t * 4); } return [b, f]; }
function dinerBase(x) { const s = x.S.diner; x.out.scene = s; x.post.tint.value.set(1.06, 1.0, 0.9); x.post.vig.value = 0.7; return s; }
function xrayLook(x) { x.post.tint.value.set(0.75, 1.0, 1.15); x.post.cctv.value = 0.25; x.S.voidSpot.color.set('#9fd8ff'); x.S.voidSpot.intensity = 30; x.S.voidFill.color.set('#2a6aff'); x.S.voidFill.intensity = 3; }
function screenPt(x, wp) { return proj(x, wp); }

// ===== HOOK =====
// "Você já parou pra tentar entender"
at(0.00, 'open_walk', x => {
  const s = frightBase(x, 0.8); const c = put(x, 'spring', s, 0.1, 0, -9, 0); walkTo(c, [0.1, 0, -9], [0.1, 0, -6.2], sm(x.u), 1.1); twitch(c, x.t, 0.5);
  camMove(x, [0.45, 0.55, -2.6], [0.1, 1.6, -8], [0.35, 0.7, -3.3], [0.1, 1.75, -7], eo, 46); hand(x); staticIn(x, 0.2);
});
// "o porquê o Springtrap"
at(1.50, 'sp_face', x => {
  const s = frightBase(x, 0.3); const c = put(x, 'spring', s, 0, 0, -6, 0); c.idle(x.t, 1); c.head.rotation.z = -0.2 * eo(seg(x.L, 0.3, 0.8)); lookAtCam(x, c, 0.6);
  camMove(x, [0.5, 1.75, -3.6], [0, 1.65, -6], [0.25, 1.75, -4.3], [0, 1.7, -6], eo, 40); hand(x); fillOn(x, c, 1.2, 1.9);
});
// "segue a risada"
at(2.72, 'sp_follow', x => {
  const s = frightBase(x, 0.3); const c = put(x, 'spring', s, 0.3, 0, -7.5, Math.PI); walkTo(c, [0.3, 0, -7.5], [-0.2, 0, -10.2], x.u, 1.1); c.root.rotation.y = Math.PI + 0.15;
  speakerOn(x); cam(x, [1.0, 1.4, -6.0], [-0.4, 1.5, -10.5], 48); hand(x); fillOn(x, c, 3, 1.8);
});
// "do Balloon Boy"
at(3.86, 'bb_laugh', x => {
  const s = frightBase(x, 0.5); const c = put(x, 'bb', s, 0.1, 0, -4.2, -0.15); c.idle(x.t, 1); laughBB(c, x.t, 1);
  camMove(x, [0.5, 0.8, -2.4], [0, 1.0, -4.2], [0.3, 0.9, -2.9], [0, 1.0, -4.2], eo, 44); hand(x); fillOn(x, c, 2, 1.3);
  const g = (x.L * 10 | 0) % 5 === 0; c.root.visible = !g; x.post.stat.value = g ? 0.35 : 0.04; wavesAt(x, s, rootPt(c, 0.55, 1.75, 0.3), 0.1, 2);
});
// "no FNAF 3?"
at(4.66, 'logo3', x => { const s = x.S.office3; x.out.scene = s; cam(x, [0.3, 1.6, 2.2 - 0.3 * x.u], [0, 1.6, -2.4], 50); logoCard(x, 0); x.post.tint.value.set(0.9, 1.08, 0.9); });

// ===== THE COMMON THEORY =====
// "A comunidade inteira aceitou que,"
at(5.72, 'community', x => {
  const s = x.S.office3; x.out.scene = s; x.out.screen = 'static'; const g = guardSit(x, s, 0.3); g.head.rotation.x = 0.15; g.head.rotation.y = 0.1 * Math.sin(x.t * 2);
  if (x.L < 0.9) cam(x, [0.7, 1.75, 1.3], [0.3, 1.3, -1.6], 46); else cam(x, [-0.9, 1.45, -1.2], [0, 1.6, 0.3], 44);
  hand(x); x.post.tint.value.set(0.92, 1.06, 0.92); g.armR.piv.rotation.x = -1.3 + 0.1 * Math.sin(x.t * 3);
});
// "depois de 30 anos preso,"
at(7.54, 'thirty_years', x => {
  const s = x.S.void; x.out.scene = s; const c = put(x, 'spring', s, 0, 0, 0, 0.2); sit(c, 0.35); droop(c, 1); c.armR.piv.rotation.x = -0.5; c.armL.piv.rotation.x = -0.5; c.armR.piv.rotation.z = -0.2; c.armL.piv.rotation.z = 0.25;
  if (x.L > 1.0) { c.head.rotation.x -= 0.6 * eo(seg(x.L, 1.0, 1.3)); }
  camMove(x, [1.0, 1.3, 3.2], [0, 0.7, 0], [0.6, 1.1, 2.4], [0, 0.8, 0], eo, 44); hand(x); fillOn(x, c, 2.5, 1.2);
  x.S.voidSpot.intensity = 30 * mix(0.2, 1, sm(seg(x.L, 0, 0.6))) * flicker(x.t, 2); x.S.voidSpot.color.set('#c8ffc0'); x.S.voidFill.intensity = 0.6; x.post.vig.value = 1.0; x.post.grain.value = 0.06;
});
// "William Afton simplesmente enlouqueceu"
at(9.14, 'afton_mad', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L; const sw = (L > 0.95 && L < 1.08) || (L > 1.5 && L < 1.58);
  const c = put(x, sw ? 'spring' : 'william', s, 0, 0, 0, 0); c.idle(x.t, 1);
  const k = eo(seg(L, 0.1, 0.4)); aim(c, 'R', rootPt(c, -0.32, 1.85, 0.25), k); aim(c, 'L', rootPt(c, 0.32, 1.85, 0.25), k);
  c.head.rotation.x = 0.25 * k + 0.08 * Math.sin(x.t * 27) * k; c.head.rotation.z = 0.12 * Math.sin(x.t * 19) * k; c.torso.rotation.x = 0.15 * k;
  camMove(x, [0, 1.5, 3.4], [0, 1.3, 0], [0, 1.6, 2.5], [0, 1.45, 0], eo, 46); shake(x, 0.25 + 0.4 * k);
  x.S.voidRim.intensity = 14; x.S.voidRim.color.set('#ff2040'); x.S.voidSpot.color.set('#ffb0b0'); x.S.voidSpot.intensity = 26; x.post.chroma.value = 0.6 * k; x.post.stat.value = sw ? 0.45 : 0; x.post.tint.value.set(1.15, 0.85, 0.9);
});
// "e vai atrás do som por puro instinto."
at(11.00, 'instinct', x => {
  const s = frightBase(x, 0.5); const L = x.L; const c = put(x, 'spring', s, 0.4, 0, -6, Math.PI);
  walkTo(c, [0.4, 0, -6], [-0.4, 0, -10.6], x.u, 1.0); c.root.rotation.y = Math.PI + 0.12; twitch(c, x.t, 1); speakerOn(x);
  if (L < 1.1) cam(x, [1.2, 0.4, -5.0], [-0.1, 1.4, -8], 52); else cam(x, [-1.1, 2.4, -12.8], [0, 1.3, -9.5], 46);
  hand(x); fillOn(x, c, 3.5, 1.8);
});
// "Mas tem um furo gigante nessa história."
at(13.18, 'plot_hole', x => {
  const s = frightBase(x, 0); const L = x.L; const c = put(x, 'spring', s, -0.2, 0, -9.5, 0.5); c.walk(0.3, 1); c.head.rotation.y = -0.3;
  const z = eo(seg(L, 0.0, 0.25)); cam(x, [mix(1.3, 0.6, z), mix(1.4, 1.8, z), mix(-5.5, -7.6, z)], [-0.2, mix(1.3, 1.75, z), -9.5], mix(50, 38, z));
  x.post.tint.value.set(0.7, 0.7, 0.72); x.post.stat.value = L < 0.12 ? 0.6 : 0; x.post.vig.value = 1.1; if (L < 0.25) shake(x, 0.6);
  fillOn(x, c, 3, 1.8); pop(x, x.FX.q1, s, headTop(c, 0.7), 0.35, 0.45);
});

// ===== AFTON KNOWS =====
// "William Afton era um gênio da robótica,"
at(15.20, 'genius', x => {
  const s = x.S.shop; x.out.scene = s; const L = x.L; const w = put(x, 'william', s, -1.5, 0, -2.4, Math.PI); w.idle(x.t, 1);
  aim(w, 'R', new V3(-1.75, 1.05, -3.1), 1); aim(w, 'L', new V3(-1.2, 1.05, -3.0), 1); w.head.rotation.x = 0.45; w.armR.piv.rotation.x += 0.08 * Math.sin(x.t * 14);
  const b = put(x, 'bonnie', s, 0.9, 0, -2.4, 0); b.armR.piv.rotation.z = -0.35; b.armL.piv.rotation.z = 0.35; b.head.rotation.x = 0.25;
  if (L < 1.1) camMove(x, [0.4, 2.0, 0.4], [-1.5, 1.1, -3.0], [0.1, 1.9, 0.0], [-1.5, 1.05, -3.1], eo, 46);
  else { cam(x, [1.8, 1.5, -0.6], [0.9, 1.6, -2.4], 44); w.head.rotation.x = 0; w.head.rotation.y = 0.4; }
  hand(x); sparksAt(x, s, new V3(-1.5, 1.05, -3.05), ((x.t * 2) % 1) * 0.6);
});
// "foi ele quem construiu aquele lugar"
at(17.38, 'built', x => {
  const s = dinerBase(x); const w = put(x, 'william', s, 0, 0, 1.5, Math.PI); w.idle(x.t, 1); w.head.rotation.y = 0.5 * Math.sin(x.t * 1.5); w.armR.piv.rotation.z = -0.25; w.armL.piv.rotation.z = 0.25;
  camMove(x, [0.5, 1.4, 6.5], [0, 2.5, -4], [0, 3.4, 5.2], [0, 2.8, -5], eio, 52); hand(x, 0.6);
});
// "e ele sabe perfeitamente que aquela risada"
at(19.12, 'knows', x => {
  const s = x.S.shop; x.out.scene = s; const w = put(x, 'william', s, -0.5, 0, -1.5, 0.3); w.idle(x.t, 1); lookAtCam(x, w, eo(seg(x.L, 0.2, 0.6)));
  aim(w, 'R', rootPt(w, -0.15, 1.75, 0.35), eo(seg(x.L, 0.5, 0.9)));
  camMove(x, [0.4, 1.7, 0.9], [-0.5, 1.6, -1.5], [0.2, 1.72, 0.4], [-0.5, 1.65, -1.5], eo, 40); hand(x); x.S.shopFill.intensity = 5;
});
// "é só um arquivo de áudio."
at(20.52, 'audio_file', x => {
  const s = x.S.office3; x.out.scene = s; x.out.screen = 'static'; cam(x, [0.5, 1.35, -0.6], [0.5, 1.23, -1.49], 50); hand(x, 0.4);
  x.out.ui = { type: 'audiofile', a: eo(seg(x.L, 0, 0.3)), p: seg(x.L, 0.3, x.d - 0.1) }; x.post.tint.value.set(0.9, 1.06, 0.9);
});

// ===== THE QUESTION =====
// "E então, por que um assassino tão experiente"
at(22.80, 'assassin', x => {
  const s = frightBase(x, 0.2); const c = put(x, 'spring', s, 0, 0, -8, 0); c.idle(x.t, 1); lookAtCam(x, c, 0.8);
  if (x.L < 1.1) camMove(x, [0.2, 1.0, -5.0], [0, 1.6, -8], [0.1, 1.3, -6.0], [0, 1.7, -8], eo, 44); else cam(x, [-0.9, 2.3, -5.9], [0, 1.6, -8], 46);
  hand(x); fillOn(x, c, 2, 1.9); x.S.frLamps[2].color.set('#ff6a6a');
});
// "cairia num truque tão barato"
at(24.98, 'cheap_trick', x => {
  const s = frightBase(x, 0.2); const L = x.L; speakerOn(x);
  const bb = put(x, 'bb', s, -1.1, 0, -12.6, Math.PI / 2); bb.visible = true; laughBB(bb, x.t, 1); bb.root.visible = (L * 12 | 0) % 3 !== 0 && L < 0.8;
  if (L < 0.8) cam(x, [0.4, 2.0, -11.0], [-1.6, 2.1, -12], 46);
  else { const c = put(x, 'spring', s, 0.3, 0, -9, Math.PI); c.idle(x.t, 1); c.head.rotation.y = -0.9 * eo(seg(L, 0.9, 1.2)); cam(x, [0.6, 1.8, -10.6], [0.3, 1.7, -9], 44); }
  hand(x);
});
// "a noite inteira"
at(26.66, 'all_night', x => {
  const s = x.S.office3; x.out.scene = s; x.out.screen = 'static'; cam(x, [0.5, 1.35, -0.6], [0.5, 1.23, -1.49], 50);
  const ph = x.t * 1.5; const a = (Math.sin(ph) + 1) / 2; x.out.ui = { type: 'cammap', sel: (x.t * 2 | 0) % 2 ? 4 : 1, dot: [mix(0.15, 0.82, a), mix(0.25, 0.75, a)], wave: true, wavePos: a > 0.5 ? [0.82, 0.75] : [0.15, 0.25] };
  x.post.tint.value.set(0.9, 1.06, 0.9);
});
// "ao invés de ir direto em você?"
at(28.10, 'direct_you', x => {
  const s = x.S.office3; x.out.scene = s; const L = x.L; cam(x, [0, 1.65, 1.0], [0, 1.65, -3], 50); hand(x); x.post.tint.value.set(0.92, 1.06, 0.92);
  const c = put(x, 'spring', s, mix(-1.4, 0.2, eo(seg(L, 0, 0.5))), 0, -3.6, 0); c.walk(L * 1.6, 1);
  if (L > 0.55) jumpscare(x, c, L - 0.55, { js: 1.2, statAt: 0.6 }); else { lookAtCam(x, c, 1); fillOn(x, c, 2.5, 1.8); }
});

// ===== THE REAL ANSWER =====
// "A verdadeira explicação é agoniante."
at(29.34, 'agonizing', x => {
  const s = x.S.void; x.out.scene = s; const c = put(x, 'spring', s, 0, 0, 0, 0); c.idle(x.t, 1); twitch(c, x.t, 0.4);
  const a = -0.6 + 1.0 * x.u; cam(x, [Math.sin(a) * 2.0, 1.6, Math.cos(a) * 2.0], [0, 1.55, 0], 44);
  x.S.voidSpot.intensity = 26; x.S.voidSpot.color.set('#d0ffc8'); x.S.voidRim.intensity = 8; x.S.voidRim.color.set('#40ff70'); x.post.vig.value = 1.0;
  x.post.fade.value = 0.35 * Math.max(0, Math.sin(x.t * 7.5)) ** 8;
});
// "O segredo não está na mente do Afton,"
at(31.44, 'not_mind', x => {
  const s = x.S.void; x.out.scene = s; const c = put(x, 'spring', s, 0, 0, 0, 0); c.idle(x.t, 1);
  const k = sm(seg(x.L, 0.3, 0.9)); c.head.rotation.x = -0.1 * k; c.head.rotation.z = 0.05 * Math.sin(x.t * 9) * k;
  camMove(x, [0.3, 1.85, 1.3], [0, 1.78, 0], [0.15, 1.82, 0.95], [0, 1.78, 0], eo, 40); hand(x);
  x.S.voidSpot.intensity = 26; x.S.voidRim.intensity = 10; x.S.voidRim.color.set('#ff4060'); x.post.vig.value = 0.95;
  if (x.L > 1.6) { x.post.tint.value.set(1.0, 0.7, 0.7); }
});
// "mas sim na tecnologia de seu traje."
at(33.60, 'suit_tech', x => {
  const s = x.S.void; x.out.scene = s; const c = put(x, 'spring', s, 0, 0, 0, 0.3 + 0.3 * x.u); c.idle(x.t, 1); x.setXray(c, sm(seg(x.L, 0, 0.35)), sm(seg(x.L, 0.4, 0.8)));
  camMove(x, [0, 1.3, 3.8], [0, 1.1, 0], [0.2, 1.2, 3.2], [0, 1.1, 0], eo, 42); xrayLook(x); x.out.ui = { type: 'auto', scan: true, on: true, hide: true };
});

// ===== GOLDEN ERA =====
// "Na época de ouro da pizzaria,"
at(35.86, 'golden_era', x => {
  const s = dinerBase(x); dinerStage(x, s); kidsAt(x, s, -3.2, 0.8, 0.5);
  camMove(x, [-1.5, 2.8, 7.5], [0, 2.0, -3], [1.2, 2.3, 6.4], [0, 2.0, -3.5], eio, 50); hand(x, 0.5);
});
// "esses trajes possuíam um modo automático."
at(37.42, 'auto_mode', x => {
  const s = dinerBase(x); const L = x.L; const [b, f] = dinerStage(x, s, L < 1.5 ? 1 : 0); const on = x.t > 39.06;
  if (on) { b.armR.piv.rotation.set(0, 0, 0); b.armL.piv.rotation.set(0, 0, 0); b.head.rotation.set(0, 0, 0); }
  if (L < 1.0) cam(x, [-0.6, 1.9, -1.6], [-0.9, 2.3, -4.4], 42); else camMove(x, [-0.3, 2.35, -2.6], [-0.9, 2.5, -4.4], [-0.5, 2.45, -3.0], [-0.9, 2.5, -4.4], eo, 40);
  hand(x); x.setXray(b, on ? 0.25 : 0, on ? 1 : 0);
  if (L > 1.0) x.out.ui = { type: 'auto', on, blink: true }; if (on && x.t < 39.2) { x.post.flash.value = 0.25; }
});
// "A programação interna forçava o robô a caminhar sozinho"
at(40.28, 'walks_alone', x => {
  const s = dinerBase(x); const L = x.L; const f = put(x, 'fredbear', s, 0.9, 0.77, -4.4, -0.15); f.idle(x.t, 1);
  const b = put(x, 'bonnie', s, -0.9, 0.77, -4.4, 0); const k = seg(L, 0.1, x.d);
  const p = k < 0.25 ? [-0.9, 0.77, mix(-4.4, -2.7, k / 0.25)] : [mix(-0.9, -1.8, (k - 0.25) / 0.75), 0, mix(-2.7, 0.2, (k - 0.25) / 0.75)];
  b.root.position.set(...p); b.walk(L * 1.6, 0.7, 0); b.root.rotation.y = k < 0.25 ? 0 : -0.3; b.head.rotation.set(0, 0, 0);
  if (L < 1.4) cam(x, [-0.4, 0.3, -0.8], [-1.0, 1.6, -3.4], 52); else cam(x, [1.6, 2.4, 2.6], [-1.6, 1.0, -0.6], 44);
  hand(x);
});
// "na direção de qualquer barulho de criança."
at(43.24, 'child_noise', x => {
  const s = dinerBase(x); const L = x.L; const kids = kidsAt(x, s, -3.2, 0.8, 1);
  if (L < 1.2) { cam(x, [-1.8, 1.4, 3.4], [-3.2, 1.0, 0.8], 46); wavesAt(x, s, new V3(-3.2, 1.6, 1.0), 0.6, 1.8); }
  else { const b = put(x, 'bonnie', s, -0.6, 0, 0.5, Math.PI * 0.5); b.idle(x.t, 0.3); b.head.rotation.y = -0.8 * eo(seg(L, 1.25, 1.45)); cam(x, [0.4, 1.9, 2.0], [-0.6, 1.75, 0.5], 40);
    x.out.ui = { type: 'auto', on: true, target: proj(x, new V3(-3.0, 1.2, 0.9)) }; }
  hand(x);
});
// "Isso para garantir que o mascote sempre ficava perto do público."
at(45.58, 'near_public', x => {
  const s = dinerBase(x); const L = x.L; const kids = kidsAt(x, s, -3.2, 0.8, 0.6);
  const b = put(x, 'bonnie', s, -1.6, 0, 0.8, -Math.PI / 2); b.idle(x.t, 1); aim(b, 'R', rootPt(b, -0.6, 2.3, 0.5), 0.9); b.armR.piv.rotation.z += 0.3 * Math.sin(x.t * 8); lookAtCam(x, b, 0.3);
  const f = put(x, 'fredbear', s, 0.9, 0.77, -4.4, -0.15); f.idle(x.t, 1);
  if (L < 1.7) camMove(x, [0.6, 2.2, 4.6], [-2.4, 1.2, 0.8], [0.2, 2.6, 4.0], [-2.4, 1.2, 0.8], eo, 46); else cam(x, [-2.4, 4.6, 3.2], [-2.4, 0.8, 0.6], 50);
  hand(x);
});

// ===== STILL ACTIVE =====
// "E o detalhe que muda tudo"
at(49.10, 'detail', x => {
  const s = frightBase(x, 0); const L = x.L; const on = L > 0.45; x.S.frLamps.forEach(l => l.intensity = on ? 8 : 0.4);
  const c = put(x, 'spring', s, 0, 0, -6.5, 0); c.idle(x.t, 1); lookAtCam(x, c, on ? 1 : 0);
  cam(x, [0.3, 1.5, -3.2], [0, 1.6, -6.5], 46); hand(x); x.post.flash.value = L > 0.45 && L < 0.52 ? 0.3 : 0; x.post.stat.value = L < 0.15 ? 0.6 : 0;
});
// "é que esse sistema ainda está ativo."
at(50.44, 'still_active', x => {
  const s = x.S.void; x.out.scene = s; const c = put(x, 'spring', s, 0, 0, 0, 0.35); c.idle(x.t, 1); x.setXray(c, 1, 0.6 + 0.4 * Math.sin(x.t * 10));
  camMove(x, [0.6, 1.4, 1.8], [0, 1.1, 0], [0.4, 1.3, 1.4], [0, 1.1, 0], eo, 44); xrayLook(x); x.out.ui = { type: 'auto', on: true, blink: true };
});
// "Quando você está com áudio,"
at(52.38, 'play_audio', x => {
  const s = x.S.office3; x.out.scene = s; x.out.screen = 'static'; cam(x, [0.5, 1.35, -0.6], [0.5, 1.23, -1.49], 50); const L = x.L;
  const pr = L > 0.55 ? 1 : 0; x.out.ui = { type: 'cammap', sel: 4, press: pr, wave: pr > 0, wavePos: [0.48, 0.54], dot: [0.82, 0.3], cursor: [mix(0.75, 0.6, eo(seg(L, 0, 0.5))), mix(0.75, 0.47, eo(seg(L, 0, 0.5)))] };
  x.post.tint.value.set(0.9, 1.06, 0.9);
});
// "não é o Afton que escolhe ir até lá."
at(53.58, 'not_choose', x => {
  const s = frightBase(x, 0.3); const c = put(x, 'spring', s, 0.2, 0, -8, 0.2); c.idle(x.t, 1); speakerOn(x, 0.6);
  c.head.rotation.y = 0.5 * Math.sin(x.t * 7); c.head.rotation.x = 0.1; c.root.rotation.y = 0.2 - 2.8 * eo(seg(x.L, 0.6, 1.4));
  aim(c, 'L', rootPt(c, 0.6, 1.6, -0.2), 0.7); aim(c, 'R', rootPt(c, -0.6, 1.6, -0.2), 0.7);
  if (x.L < 0.85) cam(x, [0.5, 1.8, -6.4], [0.2, 1.7, -8], 40); else cam(x, [-0.9, 1.55, -10.6], [0.2, 1.5, -8], 46);
  hand(x); fillOn(x, c, 2.5, 1.9);
});
// "São os próprios motores da roupa que ligam sozinhos"
at(55.22, 'motors', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L; const c = put(x, 'spring', s, 0, 0, 0, Math.PI / 2 * 0.8); const on = L > 0.35;
  if (on) { c.walk((L - 0.35) * 1.4, 0.9, 0.1); c.torso.rotation.x -= 0.15; } x.setXray(c, 1, on ? 1 : 0.1);
  if (L < 1.3) cam(x, [1.6, 0.8, 1.4], [0, 0.6, 0], 44); else cam(x, [0.4, 1.3, 2.6], [0, 1.0, 0], 46);
  hand(x); xrayLook(x); if (on) x.out.ui = { type: 'auto', on: true }; if (L > 0.35 && L < 0.45) { x.post.flash.value = 0.25; shake(x, 0.4); }
});
// "e arrastam o corpo dele pelos corredores"
at(57.74, 'dragged', x => {
  const s = frightBase(x, 0.5); const L = x.L; const c = put(x, 'spring', s, 0.1, 0, -5.5, Math.PI); speakerOn(x);
  const k = x.u; c.root.position.set(mix(0.1, -0.3, k), 0, mix(-5.5, -8.2, k)); dragged(c, x.t, L * 1.5, 1); c.root.rotation.y = Math.PI + 0.1;
  if (L < 0.9) cam(x, [0.4, 1.7, -10.2], [0, 1.4, -6.5], 46); else cam(x, [1.25, 0.6, -6.0], [-0.2, 1.3, -7.5], 52);
  hand(x); shake(x, 0.15); fillOn(x, c, 3, 1.6);
});
// "totalmente contra a sua vontade."
at(59.54, 'against_will', x => {
  const s = frightBase(x, 0.6); const L = x.L; const c = put(x, 'spring', s, 0, 0, -8, Math.PI * 0.85); dragged(c, x.t, L * 1.5, 0.8);
  c.springlocks.forEach((l, i) => l.material.emissive.set(Math.floor(x.t * 6 + i) % 2 ? '#ff2020' : '#000000'));
  camMove(x, [0.7, 1.9, -9.6], [0, 1.7, -8], [0.4, 1.85, -9.2], [0, 1.75, -8], eo, 40); hand(x); shake(x, 0.25);
  sparksAt(x, s, rootPt(c, 0.25, 1.45, 0.2), ((x.t * 1.7) % 1) * 0.7); x.post.chroma.value = 0.4;
});

// ===== PRISONER =====
// "O maior vilão de FNAF virou um prisioneiro"
at(61.48, 'prisoner', x => {
  const s = x.S.void; x.out.scene = s; const c = put(x, 'spring', s, 0, 0, 0, 0); c.idle(x.t, 0.6); droop(c, 0.6);
  const cg = x.FX.cage; s.add(cg); cg.position.set(0, 0, 0.75);
  camMove(x, [0.2, 1.5, 3.4], [0, 1.4, 0], [0.1, 1.6, 2.4], [0, 1.5, 0], eo, 44); hand(x); fillOn(x, c, 2.5, 1.8);
  x.S.voidSpot.intensity = 34; x.S.voidSpot.color.set('#d8ffd0'); x.S.voidRim.intensity = 6; x.S.voidRim.color.set('#40ff70'); x.post.vig.value = 1.0;
});
// "da própria fantasia."
at(63.52, 'own_suit', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L; const c = put(x, 'spring', s, 0, 0, 0, 0); c.idle(x.t, 0.5);
  const snap = L > 0.3; c.springlocks.forEach(l => l.material.emissive.set(snap ? '#ff2020' : '#000000'));
  if (snap) { c.torso.rotation.x = -0.12; c.head.rotation.x = -0.35; c.armR.piv.rotation.z = -0.5; c.armL.piv.rotation.z = 0.5; shake(x, 0.8 * (1 - seg(L, 0.3, 1.0))); }
  camMove(x, [0, 1.75, 1.1], [0, 1.7, 0], [0, 1.5, 3.6], [0, 1.2, 0], eo, 44);
  x.S.voidRim.intensity = 12; x.S.voidRim.color.set('#ff2020'); x.post.flash.value = L > 0.3 && L < 0.38 ? 0.35 : 0; x.post.tint.value.set(snap ? 1.15 : 1, snap ? 0.8 : 1, snap ? 0.8 : 1); x.post.chroma.value = snap ? 0.6 : 0;
});

// ===== OUTRO =====
// "Você já tinha notado isso?"
at(64.88, 'noticed', x => {
  const s = frightBase(x, 0.3); const c = put(x, 'bb', s, 0, 0, -3.6, 0); c.idle(x.t, 1); laughBB(c, x.t, 0.6); lookAtCam(x, c, 0.5);
  camMove(x, [0.3, 1.0, -1.8], [0, 1.05, -3.6], [0.15, 1.05, -2.3], [0, 1.1, -3.6], eo, 44); hand(x); fillOn(x, c, 2.2, 1.2);
  pop(x, x.FX.q1, s, headTop(c, 0.75), 0.35, 0.45);
});
// "Comenta aí e me segue para mais mistérios."
at(66.34, 'outro', x => {
  const s = frightBase(x, 0.3); const L = x.L;
  const row = [['bonnie', -1.5, 0.1], ['spring', -0.5, 0.0], ['fredbear', 0.5, -0.05], ['bb', 1.35, -0.1]];
  row.forEach(([n, px, ry], i) => { const c = put(x, n, s, px * 0.85, 0, -6 + 0.2 * Math.abs(px), ry); c.idle(x.t, 1, i); if (n === 'bb') laughBB(c, x.t, 0.3); if (n === 'spring') twitch(c, x.t, 0.4); });
  camMove(x, [0, 1.25, 0.6], [0, 1.15, -6], [0, 1.3, -0.4], [0, 1.2, -6], eo, 46); hand(x); fillOn(x, x.C.spring, 4, 1.8); x.post.fade.value = seg(L, x.d - 0.35, x.d);
});

export const SHOTS = shots;
export const DURATION = 68.376;
