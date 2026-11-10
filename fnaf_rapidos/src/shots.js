// Shot list for "A verdadeira história da Puppet", cut on word-level timestamps (words.json). Pure function of time.
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
  const c = x.C[name]; scene.add(c.root); c.root.position.set(px, py, pz); c.root.rotation.set(0, ry, 0); c.root.scale.setScalar(s); c.root.visible = true; return c;
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

// --------------------------------------------------------------------------------------
const shots = [];
const at = (t, name, fn) => shots.push({ t, name, fn });

// ===== INTRO: "Esses são os animatronics mais rápidos de cada FNaF." =====
at(0.00, 'mont_foxy', x => {
  const s = x.S.office1; x.out.scene = s; const L = x.L; const c = put(x, 'foxy', s, -12, 0, 0, Math.PI / 2);
  walkTo(c, [-13, 0, 0], [-10.6, 0, 0], eo(x.u), 0.9); c.root.rotation.y = Math.PI / 2; c.torso.rotation.x = 0.3;
  cam(x, [-8.2, 0.9, 0.55], [-11.5, 1.5, 0], 52); hand(x, 1.2); x.S.west.forEach(l => l.intensity = 0.6); x.S.coveSpot.intensity = 8; x.S.coveSpot.color.set('#ff3040');
  x.post.vig.value = 0.9; x.post.fade.value = 1 - seg(L, 0, 0.12);
});
at(0.58, 'mont_puppet', x => {
  const s = x.S.void; x.out.scene = s; const c = put(x, 'puppet', s, 0, mix(-0.8, 0, eo(x.u)), 0, 0); c.idle(x.t, 1);
  cam(x, [0.2, 1.4, 2.8], [0, 1.9, 0], 46); hand(x); x.S.voidSpot.intensity = 6; x.S.voidRim.intensity = 10; x.S.voidRim.color.set('#a050ff'); x.S.voidFill.intensity = 0.5; x.post.vig.value = 0.95;
});
at(1.06, 'mont_pfoxy', x => {
  const s = x.S.office3; x.out.scene = s; const L = x.L; const c = put(x, 'pfoxy', s, 0, 0, -0.9, 0); c.idle(x.t, 1); c.jaw.rotation.x = 0.3;
  cam(x, [0.3, 1.6, 1.2], [0, 1.6, -0.9], 46); hand(x); c.root.visible = (L * 14 | 0) % 3 !== 0; x.post.stat.value = 0.1; fillOn(x, c, 3); x.post.tint.value.set(0.95, 1.07, 0.95); x.S.f3Lamp.intensity = 1.5;
});
at(1.50, 'mont_nm', x => {
  const s = x.S.bedroom; x.out.scene = s; const c = put(x, 'nightm', s, 0.4, 0, -0.6, -0.2); c.idle(x.t, 1); x.waveTendrils(c, x.t);
  cam(x, [0.9, 1.2, 2.6], [0.4, 2.0, -0.6], 50); hand(x); x.S.bedLamp.intensity = 1; x.S.bedHemi.intensity = 0.4; x.S.flash.position.set(0.9, 1.3, 2.6); x.S.flash.target.position.set(0.4, 1.8, -0.6); x.S.flash.intensity = 25; x.post.vig.value = 0.9;
});
at(2.00, 'mont_yenndo', x => {
  const s = x.S.officeSL; x.out.scene = s; const c = put(x, 'yenndo', s, 0, 0, -1.0, 0); c.idle(x.t, 1);
  cam(x, [0.15, 1.75, 0.9], [0, 1.75, -1.0], 44); hand(x); x.S.slLamp.intensity = 0.6; x.post.vig.value = 0.95;
});
at(2.36, 'lineup', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L;
  [['foxy', -1.4], ['puppet', -0.7], ['pfoxy', 0], ['nightm', 0.72], ['yenndo', 1.42]].forEach(([n, px], i) => { const c = put(x, n, s, px, 0, -0.3 * Math.abs(px), -px * 0.14); c.idle(x.t, 1, i); if (c.tendrils) x.waveTendrils(c, x.t); });
  const on = L > 0.06; x.S.voidSpot.intensity = on ? 45 : 4; x.S.voidSpot.color.set('#fff0e0'); x.S.voidFill.intensity = 3;
  camMove(x, [0, 1.5, 8.0], [0, 1.4, 0], [0, 1.55, 7.2], [0, 1.45, 0], eo, 46); hand(x); x.post.flash.value = L > 0.06 && L < 0.16 ? 0.4 : 0;
});
// "O último é tão rápido que ele te mata em menos de um segundo."
at(3.18, 'yenndo_tease', x => {
  const s = x.S.officeSL; x.out.scene = s; const L = x.L; const c = put(x, 'yenndo', s, 0, 0, -3.6, 0); c.idle(x.t, 0.5);
  camMove(x, [0.2, 1.6, 0.6], [0, 1.6, -3.6], [0.1, 1.6, 0.2], [0, 1.65, -3.6], eo, 40); hand(x, 0.6);
  x.S.slLamp.intensity = 1.4 * flicker(x.t, 2); stopwatch(x, 0); x.post.vig.value = 0.85;
});
at(4.46, 'yenndo_jump', x => {
  const s = x.S.officeSL; x.out.scene = s; const L = x.L; cam(x, [0, 1.6, 0.4], [0, 1.6, -3], 48);
  const c = put(x, 'yenndo', s, 0, 0, -1, 0); jumpscare(x, c, L - 0.04, { statAt: 9 });
  stopwatch(x, Math.min(0.8, Math.max(0, (L - 0.04) * 1.6)), L > 0.55); x.S.slRed.intensity = 6;
});
// "Mas o Freddy vai invadir a casa de quem não deixou o like e não se inscrever no canal."
at(5.86, 'freddy_door', x => {
  const s = x.S.bedroom; x.out.scene = s; const L = x.L; const k = back(seg(L, 0.75, 1.0));
  x.S.bedDoor.rotation.y = -1.6 * k; if (L > 0.78 && L < 1.0) shake(x, 0.6); x.post.flash.value = L > 0.78 && L < 0.86 ? 0.25 : 0;
  const f = put(x, 'freddy', s, 4.3, 0, 1.0, -Math.PI / 2); const w = seg(L, 0.82, 1.32); walkTo(f, [4.4, 0, 1.0], [3.0, 0, 1.0], eo(w), 0.9); f.root.rotation.y = -Math.PI / 2 + 0.5 * w;
  aim(f, 'R', rootPt(f, -0.4, 1.7, 0.8), sm(seg(L, 0.8, 1.0)) * (1 - w));
  cam(x, [1.0, 1.55, 2.4], [3.6, 1.45, 1.0], 48); hand(x); x.S.bedLamp.intensity = 6;
});
at(7.18, 'freddy_like', x => {
  const s = x.S.bedroom; x.out.scene = s; const L = x.L; const f = put(x, 'freddy', s, 2.6, 0, 1.0, -Math.PI / 2 + 0.7); f.idle(x.t, 1);
  camMove(x, [0.6, 1.7, 2.6], [2.6, 1.45, 1.0], [0.9, 1.72, 2.3], [2.6, 1.5, 1.0], eo, 44); hand(x); lookAtCam(x, f, 0.9);
  const p = back(seg(L, 0.05, 0.35)); aim(f, 'R', x.camera.position.clone().add(new V3(0, -0.15, 0)), p);
  pop(x, x.FX.like, s, headTop(f, 0.85), 0.62, 0.9); x.S.bedLamp.intensity = 8;
});
at(8.20, 'freddy_bell', x => {
  const s = x.S.bedroom; x.out.scene = s; const L = x.L; const f = put(x, 'freddy', s, 2.6, 0, 1.0, -Math.PI / 2 + 0.7); f.idle(x.t, 1);
  camMove(x, [0.95, 1.72, 2.3], [2.6, 1.5, 1.0], [1.15, 1.74, 2.1], [2.6, 1.52, 1.0], eo, 44); hand(x); lookAtCam(x, f, 0.9);
  const wv = Math.sin(L * 10); f.armL.piv.rotation.z += 2.3 + 0.3 * wv; f.head.rotation.z += 0.12 * wv;
  pop(x, x.FX.bell, s, headTop(f, 0.85), 0.25, 0.9); sparkles(x, s, headTop(f, 0.6), 0.5, 5, 0.8); x.S.bedLamp.intensity = 8;
});

// ===== FNAF 1: Foxy =====
at(9.40, 'logo1', x => {
  const s = x.S.office1; x.out.scene = s; cam(x, [-9 + 0.4 * x.u, 1.5, 0.5], [-15, 1.6, 0], 50); x.S.west.forEach(l => l.intensity = 2);
  logoCard(x, 0);
});
at(10.48, 'cove_peek', x => {
  const s = x.S.office1; x.out.scene = s; const L = x.L; const op = eo(seg(L, 0.05, 0.35));
  x.S.curtains[0].rotation.y = -1.0 * op * 0.6; x.S.curtains[1].rotation.y = 1.0 * op * 0.25;
  const c = put(x, 'foxy', s, -14.6, 0, -0.3, Math.PI / 2 - 0.3); c.idle(x.t, 1); c.root.position.x = mix(-15.2, -14.6, op); lookAtCam(x, c, 0.8); c.jaw.rotation.x = 0.15;
  camMove(x, [-12.0, 1.6, 0.5], [-14.8, 1.75, -0.2], [-12.6, 1.7, 0.4], [-14.8, 1.8, -0.2], eo, 42); hand(x); x.S.coveSpot.intensity = 6;
});
at(11.20, 'foxy_sprint', x => {
  const s = x.S.office1; x.out.scene = s; const L = x.L; const c = put(x, 'foxy', s, -14, 0, 0, Math.PI / 2);
  const k = ei(seg(L, 0, 0.4)) * 0.4 + eo(seg(L, 0.4, x.d)) * 0.6; walkTo(c, [-14.2, 0, 0], [-6.5, 0, 0], k, 1.0); c.root.rotation.y = Math.PI / 2;
  c.torso.rotation.x = 0.35; c.armR.piv.rotation.x -= 0.2; c.jaw.rotation.x = 0.25 + 0.1 * Math.sin(L * 20);
  const p = c.root.position; cam(x, [p.x + 2.3, 0.85, 0.45], [p.x, 1.3, 0], 56); hand(x, 1.5);
  x.post.chroma.value = 0.3; x.S.west.forEach(l => l.intensity = 4);
});
at(12.52, 'hall_pov', x => {
  const s = x.S.office1; x.out.scene = s; const L = x.L; const c = put(x, 'foxy', s, -10, 0, 0, Math.PI / 2);
  walkTo(c, [-11, 0, 0], [-4.2, 0, 0], ei(x.u), 1.0); c.root.rotation.y = Math.PI / 2; c.torso.rotation.x = 0.35; c.jaw.rotation.x = 0.35;
  cam(x, [-1.6, 1.6, 0.1], [-8, 1.55, 0], 50); hand(x, 1.2); x.S.westDoorLight.intensity = 5; x.S.west.forEach(l => l.intensity = 3);
});
at(13.18, 'foxy_stopwatch', x => {
  const s = x.S.office1; x.out.scene = s; const L = x.L; const c = put(x, 'foxy', s, -9, 0, 0, Math.PI / 2);
  walkTo(c, [-10.5, 0, 0], [-5, 0, 0], x.u, 1.0); c.root.rotation.y = Math.PI / 2; c.torso.rotation.x = 0.35; c.jaw.rotation.x = 0.3;
  const p = c.root.position; cam(x, [p.x - 2.4, 1.5, -0.45], [p.x, 1.3, 0], 54); hand(x, 1.4); stopwatch(x, 2.6 * x.u);
});
at(14.06, 'guard_reflex', x => {
  const s = x.S.office1; x.out.scene = s; const L = x.L; const g = guardSit(x, s);
  const turn = eo(seg(L, 0.15, 0.35)); g.head.rotation.y = 1.2 * turn; g.root.rotation.y = Math.PI + 0.4 * turn;
  const reach = eo(seg(L, 0.75, 1.05)); aim(g, 'L', new V3(-2.5, 1.45, -1.0), reach);
  camMove(x, [0.6, 1.75, -1.6], [0, 1.65, 0.15], [0.35, 1.72, -1.2], [0, 1.68, 0.15], eo, 44); hand(x);
  pop(x, x.FX.ex1, s, headTop(g, 0.75), 0.35, 0.5); x.S.westDoorLight.intensity = 3; fillOn(x, g, 0.9, 1.9);
});
at(15.56, 'door_slam', x => {
  const s = x.S.office1; x.out.scene = s; const L = x.L; const k = ei(seg(L, 0.2, 0.4));
  x.S.doorL.position.y = mix(3.75, 1.25, k); x.S.btnDoorL.material.emissiveIntensity = L > 0.2 ? 2.5 : 0.6;
  const c = put(x, 'foxy', s, -4.2, 0, 0, Math.PI / 2); walkTo(c, [-5.6, 0, 0], [-3.55, 0, 0], ei(seg(L, 0, 0.55)), 1.0); c.root.rotation.y = Math.PI / 2; c.jaw.rotation.x = 0.4;
  cam(x, [-0.8, 1.55, 1.5], [-2.6, 1.3, 0], 50); hand(x);
  for (const hit of [0.55, 0.78]) if (L > hit && L < hit + 0.12) shake(x, 0.5);
  x.S.westDoorLight.intensity = 2;
});

// ===== FNAF 2: Puppet =====
at(16.66, 'logo2', x => {
  const s = x.S.prize; x.out.scene = s; cam(x, [1.8 + 0.3 * x.u, 1.5, 2.5], [1.8, 1.2, -1.6], 48); logoCard(x, 1);
});
at(17.62, 'puppet_reveal', x => {
  const s = x.S.prize; x.out.scene = s; const L = x.L; x.S.giftLid.rotation.x = -1.95 * back(seg(L, 0, 0.25));
  const r = eo(seg(L, 0.1, 0.65)); const c = put(x, 'puppet', s, 1.8, mix(-1.9, 0, r), -1.6, 0); c.idle(x.t, 1);
  camMove(x, [2.7, 1.3, 1.0], [1.8, 2.0, -1.6], [2.4, 1.7, 0.4], [1.8, 2.2, -1.6], eo, 46); hand(x); x.S.giftSpot.intensity = 40;
});
at(18.46, 'wfoxy_hall', x => {
  const s = x.S.office; x.out.scene = s; const L = x.L; const c = put(x, 'wfoxy', s, 0.1, 0, -5.7, 0); c.idle(x.t, 0.5); c.jaw.rotation.x = 0.2;
  cam(x, [0, 1.6, -1.8], [0, 1.5, -5.7], mix(46, 34, eo(x.u))); hand(x, 0.7);
  x.S.doorLight.intensity = 6 * (Math.floor(L * 7) % 3 === 0 ? 0.15 : 1); x.S.officeLamp.intensity = 3; lookAtCam(x, c, 0.6); fillOn(x, c, 4, 1.9);
});
at(20.20, 'wfoxy_x', x => {
  const s = x.S.office; x.out.scene = s; const L = x.L; const c = put(x, 'wfoxy', s, 0.1, 0, -5.7, 0); c.idle(x.t, 0.5); c.jaw.rotation.x = 0.2;
  cam(x, [0, 1.6, -3.2], [0, 1.55, -5.7], 40); hand(x, 0.6); x.S.doorLight.intensity = 6; x.S.officeLamp.intensity = 3;
});
at(21.36, 'no_run', x => {
  const s = x.S.hall; x.out.scene = s; const L = x.L; const step = Math.min(3, Math.floor(L / 0.42));
  const zs = [-12, -8.5, -5.5, -3.2]; const c = put(x, 'puppet', s, 0, 0.05, zs[step], 0); c.idle(x.t, 0.4); c.armR.piv.rotation.z = -0.12; c.armL.piv.rotation.z = 0.12;
  cam(x, [0.25, 1.7, 1.0], [0, 1.8, -6], 44); hand(x, 0.6);
  const ph = (L % 0.42); x.post.stat.value = ph < 0.06 ? 0.6 : 0; x.S.hallLamps.forEach((l, i) => l.intensity = 7 * flicker(x.t, i));
});
at(23.00, 'musicbox', x => {
  const s = x.S.prize; x.out.scene = s; const L = x.L; x.post.cctv.value = 1;
  cam(x, [4.6, 3.6, 3.4], [1.8, 1.0, -1.6], 44); x.S.giftLid.rotation.x = -0.06 * Math.max(0, Math.sin(L * 30)) * seg(L, 0.6, 1.2);
  x.out.ui = { type: 'musicbox', v: Math.max(0, 1 - L / 1.02) }; x.post.stat.value = 0.06 + (L > 1.0 ? 0.3 : 0);
});
at(24.46, 'puppet_pop', x => {
  const s = x.S.office; x.out.scene = s; const L = x.L; cam(x, [0, 1.6, -0.2], [0, 1.6, -5], 50); hand(x);
  const c = put(x, 'puppet', s, 0, 0.05, -2.2, 0); c.idle(x.t, 0.4); c.root.visible = L > 0.06; lookAtCam(x, c, 0.9);
  x.post.flash.value = L > 0.06 && L < 0.14 ? 0.4 : 0; x.post.stat.value = L < 0.08 ? 0.5 : 0; x.S.officeLamp.intensity = 6 * flicker(x.t, 3); x.S.doorLight.intensity = 3;
});
at(25.72, 'puppet_jump', x => {
  const s = x.S.office; x.out.scene = s; const L = x.L; cam(x, [0, 1.6, -0.2], [0, 1.6, -5], 50);
  const c = put(x, 'puppet', s, 0, 0, -2, 0); jumpscare(x, c, L, { headY: 2.3, statAt: 0.95, js: 0.3 }); x.S.doorLight.intensity = 1.2; x.S.officeLamp.intensity = 2;
});

// ===== FNAF 3: Phantom Foxy =====
at(26.88, 'logo3', x => { const s = x.S.office3; x.out.scene = s; cam(x, [0.3, 1.6, 2.2 - 0.3 * x.u], [0, 1.6, -2.4], 50); logoCard(x, 2); });
at(27.86, 'pfoxy_reveal', x => {
  const s = x.S.office3; x.out.scene = s; const L = x.L; const c = put(x, 'pfoxy', s, 0, 0, -4.2, 0); c.idle(x.t, 0.6); c.jaw.rotation.x = 0.2 + 0.15 * Math.sin(L * 9);
  camMove(x, [0.4, 1.7, 0.4], [0, 1.7, -4.2], [0.25, 1.72, -0.5], [0, 1.75, -4.2], eo, 40); hand(x);
  const g = (L * 12 | 0) % 4 === 0; c.root.visible = !g; x.post.stat.value = g ? 0.3 : 0.05; fillOn(x, c, 5, 1.8); x.post.tint.value.set(0.95, 1.07, 0.95); lookAtCam(x, c, 0.7);
});
at(28.82, 'f3_monitor', x => {
  const s = x.S.office3; x.out.scene = s; x.out.screen = 'static'; cam(x, [0, 1.55, 0.6], [0, 1.45, -2.4], 48); hand(x, 0.5);
  const tb = x.FX.tablet; s.add(tb); const f = new V3(); x.camera.getWorldDirection(f); tb.position.copy(x.camera.position).addScaledVector(f, 0.45).add(new V3(0, -0.02, 0)); tb.quaternion.copy(x.camera.quaternion);
  x.post.tint.value.set(0.9, 1.08, 0.9);
});
at(29.84, 'pfoxy_appear', x => {
  const s = x.S.office3; x.out.scene = s; x.out.screen = 'static'; const L = x.L; cam(x, [0, 1.55, 0.6], [0, 1.45, -2.4], 48); hand(x, 0.5);
  const down = ei(seg(L, 0.0, 0.18)); const tb = x.FX.tablet; s.add(tb); const f = new V3(); x.camera.getWorldDirection(f);
  tb.position.copy(x.camera.position).addScaledVector(f, 0.45).add(new V3(0, -0.02 - 0.55 * down, 0)); tb.quaternion.copy(x.camera.quaternion); tb.rotateX(-0.9 * down);
  const c = put(x, 'pfoxy', s, 0.15, 0, -1.35, -0.1); c.idle(x.t, 0.4); lookAtCam(x, c, 0.9); c.jaw.rotation.x = 0.15; fillOn(x, c, 0.8);
  x.post.tint.value.set(0.95, 1.07, 0.95); if (L > 0.18 && L < 0.3) { x.post.flash.value = 0.25; shake(x, 0.4); } x.post.stat.value = 0.06;
});
at(31.06, 'pfoxy_jump', x => {
  const s = x.S.office3; x.out.scene = s; const L = x.L; cam(x, [0, 1.55, 0.6], [0, 1.5, -2.4], 50);
  const c = put(x, 'pfoxy', s, 0, 0, -1, 0); jumpscare(x, c, L, { statAt: 1.15 }); x.post.tint.value.set(0.95, 1.07, 0.95);
});
at(32.40, 'pfoxy_vanish', x => {
  const s = x.S.office3; x.out.scene = s; const L = x.L; cam(x, [0, 1.55, 0.6], [0, 1.5, -2.4], 48); hand(x);
  const c = put(x, 'pfoxy', s, 0.15, 0, -0.8, 0); c.root.visible = L < 0.25 && (L * 30 | 0) % 2 === 0; fillOn(x, c, 2.5); x.post.stat.value = L < 0.3 ? 0.55 : 0.05; x.post.tint.value.set(0.95, 1.06, 0.95);
});

// ===== FNAF 4: Nightmarionne =====
at(33.02, 'logo4', x => { const s = x.S.bedroom; x.out.scene = s; cam(x, [0.5, 1.7, 2.6], [-0.6, 1.3, -2.6], 50); x.S.bedLamp.intensity = 3; logoCard(x, 3); });
at(34.12, 'nm_reveal', x => {
  const s = x.S.bedroom; x.out.scene = s; const L = x.L; const c = put(x, 'nightm', s, 0.5, 0, -1.2, -0.25); c.idle(x.t, 1); x.waveTendrils(c, x.t, 1.6);
  camMove(x, [1.0, 1.0, 1.6], [0.5, 2.1, -1.2], [0.8, 1.1, 1.1], [0.5, 2.3, -1.2], eo, 50); hand(x); lookAtCam(x, c, 0.7);
  x.S.bedLamp.intensity = 1.5; x.S.flash.position.copy(x.camera.position); x.S.flash.target.position.set(0.5, 2.0, -1.2); x.S.flash.intensity = 30; x.post.vig.value = 0.85;
});
at(35.18, 'halloween', x => {
  const s = x.S.bedroom; x.out.scene = s; const k = eio(x.u);
  cam(x, [mix(-2.2, 1.4, k), 1.4, 2.2], [mix(-1.5, 1.8, k), 0.6, -0.5], 52); hand(x); x.S.bedLamp.intensity = 2; x.S.pumpkins.forEach(l => l.intensity = 3); x.post.tint.value.set(1.08, 0.95, 0.9);
});
at(36.84, 'nm_closet', x => {
  const s = x.S.bedroom; x.out.scene = s; const L = x.L; const op = back(seg(L, 0.65, 0.95));
  x.S.closetDoors[0].rotation.y = -1.4 * op; x.S.closetDoors[1].rotation.y = 1.4 * op;
  const c = put(x, 'nightm', s, -0.6, 0, -2.75, 0); c.root.scale.setScalar(0.92); c.idle(x.t, 0.5); x.waveTendrils(c, x.t); c.root.visible = op > 0.05;
  cam(x, [-0.4, 1.5, 0.6], [-0.6, 1.7, -2.6], 48); hand(x, 0.7); x.S.flash.position.copy(x.camera.position); x.S.flash.target.position.set(-0.6, 1.7, -2.6); x.S.flash.intensity = 30; x.S.bedLamp.intensity = 1;
  if (L > 0.65 && L < 0.8) shake(x, 0.4);
});
at(38.04, 'nm_bed', x => {
  const s = x.S.bedroom; x.out.scene = s; const L = x.L; const c = put(x, 'nightm', s, -2.6, 0.62, -1.0, 0.3); c.idle(x.t, 1); x.waveTendrils(c, x.t, 1.5);
  c.legR.piv.rotation.x = -0.3; c.legL.piv.rotation.x = 0.2; c.root.visible = L > 0.1; lookAtCam(x, c, 0.8);
  cam(x, [-1.2, 1.7, 2.2], [-2.6, 2.2, -1.0], 48); hand(x); x.S.flash.position.copy(x.camera.position); x.S.flash.target.position.set(-2.6, 2.0, -1.0); x.S.flash.intensity = 30; x.S.bedLamp.intensity = 1;
  x.post.flash.value = L > 0.1 && L < 0.18 ? 0.3 : 0;
});
at(38.94, 'half_second', x => {
  const s = x.S.bedroom; x.out.scene = s; const L = x.L;
  cam(x, [1.4, 1.6, 2.6], [3.9, 1.3, 1.0], 48); hand(x, 0.8); x.S.bedDoor.rotation.y = -0.6;
  x.S.flash.position.copy(x.camera.position); x.S.flash.target.position.set(3.9, 1.3, 1.0); x.S.flash.intensity = 30 * (Math.sin(L * 25) > -0.6 ? 1 : 0.2); x.S.bedLamp.intensity = 1;
  stopwatch(x, Math.min(0.5, L * 0.45), L > 1.1);
});
at(40.52, 'door_close', x => {
  const s = x.S.bedroom; x.out.scene = s; const L = x.L; x.S.bedDoor.rotation.y = -0.6 * (1 - ei(seg(L, 0.15, 0.5)));
  cam(x, [2.4, 1.5, 2.6], [3.9, 1.3, 1.0], 46); hand(x); if (L > 0.5 && L < 0.62) shake(x, 0.5);
  x.S.flash.position.copy(x.camera.position); x.S.flash.target.position.set(3.9, 1.3, 1.0); x.S.flash.intensity = 25; x.S.bedLamp.intensity = 1;
});
at(41.40, 'flash_off', x => {
  const s = x.S.bedroom; x.out.scene = s; const L = x.L; cam(x, [0, 1.5, 1.5], [-0.6, 1.4, -2.6], 48); hand(x, 0.6);
  const on = L < 0.32; x.S.flash.position.copy(x.camera.position); x.S.flash.target.position.set(-0.6, 1.4, -2.6); x.S.flash.intensity = on ? 30 : 0; x.S.bedLamp.intensity = on ? 1 : 0.15; x.S.bedHemi.intensity = on ? 1.1 : 0.15; x.S.moon.intensity = on ? 1.8 : 0.3; x.S.pumpkins.forEach(l => l.intensity = on ? 1.5 : 0.6);
  x.post.vig.value = on ? 0.6 : 0.95;
});
at(42.24, 'nm_jump', x => {
  const s = x.S.bedroom; x.out.scene = s; const L = x.L; cam(x, [0, 1.6, 1.5], [-0.6, 1.5, -2.6], 50);
  x.S.bedLamp.intensity = 0.3; x.S.bedHemi.intensity = 0.3; x.S.flash.position.copy(x.camera.position); x.S.flash.target.position.set(-0.6, 1.5, -2.6); x.S.flash.intensity = 5;
  const c = put(x, 'nightm', s, 0, 0, -1, 0); jumpscare(x, c, L, { headY: 2.3, statAt: 0.75, js: 0.3 }); x.waveTendrils(c, x.t, 2.5);
});

// ===== FNAF SL: Yenndo =====
at(43.32, 'logoSL', x => { const s = x.S.officeSL; x.out.scene = s; cam(x, [0.3, 1.6, 2.2 - 0.3 * x.u], [0, 1.6, -2.4], 50); logoCard(x, 4); });
at(44.54, 'yenndo_reveal', x => {
  const s = x.S.officeSL; x.out.scene = s; const L = x.L; const c = put(x, 'yenndo', s, 0, 0, -3.4, 0); c.idle(x.t, 0.6);
  camMove(x, [0.3, 1.7, 0.6], [0, 1.75, -3.4], [0.15, 1.75, -0.6], [0, 1.8, -3.4], eo, 40); hand(x); lookAtCam(x, c, 0.6);
  const lit = L > 1.6; x.S.slLamp.intensity = lit ? 3 : 0.5; x.post.flash.value = L > 1.6 && L < 1.7 ? 0.25 : 0; x.post.vig.value = 0.85;
});
at(46.74, 'cn_office', x => {
  const s = x.S.officeSL; x.out.scene = s; guardSit(x, s, 0.2);
  camMove(x, [1.6, 2.6, 2.4], [0, 1.1, -0.8], [1.2, 2.3, 1.9], [0, 1.15, -0.8], eo, 50); hand(x); x.out.ui = { type: 'oxygen', v: 1 };
});
at(49.32, 'cn_wait', x => {
  const s = x.S.officeSL; x.out.scene = s; const L = x.L; const g = guardSit(x, s, 0.2); g.head.rotation.y = 0.3 * Math.sin(L * 2);
  camMove(x, [0.5, 1.7, -1.5], [0, 1.6, 0.2], [0.35, 1.68, -1.2], [0, 1.62, 0.2], eo, 44); hand(x); x.out.ui = { type: 'oxygen', v: 1 - 0.05 * x.u };
});
at(50.70, 'yenndo_instant', x => {
  const s = x.S.officeSL; x.out.scene = s; const L = x.L; const g = guardSit(x, s, 0.2);
  const c = put(x, 'yenndo', s, 0.75, 0, -0.6, -0.6); c.idle(x.t, 0.4); c.root.visible = L > 0.06;
  cam(x, [1.6, 1.8, -1.9], [0.4, 1.6, -0.2], 46); hand(x); lookAtCam(x, c, 0.85);
  if (L > 0.06 && L < 0.14) { x.post.flash.value = 0.35; x.post.stat.value = 0.4; } if (L > 0.06 && L < 0.3) shake(x, 0.4);
  g.head.rotation.y = 0.7 * sm(seg(L, 0.3, 0.6)); x.out.ui = { type: 'oxygen', v: 0.95 - 0.25 * seg(L, 0.3, x.d) }; x.S.slLamp.intensity = 4 * flicker(x.t, 5);
});
at(52.42, 'oxygen_drain', x => {
  const s = x.S.officeSL; x.out.scene = s; const L = x.L; guardSit(x, s, 0.2); const c = put(x, 'yenndo', s, 0.75, 0, -0.6, -0.6); c.idle(x.t, 0.4);
  cam(x, [-1.2, 2.2, 1.6], [0.2, 1.3, -0.4], 50); hand(x, 0.8);
  x.out.ui = { type: 'oxygen', v: Math.max(0, 0.7 - 0.7 * eo(seg(L, 0, 1.0))) }; x.S.slRed.intensity = 5 * (Math.floor(x.t * 5) % 2); x.S.slLamp.intensity = 2;
});
at(53.62, 'guard_blink', x => {
  const s = x.S.officeSL; x.out.scene = s; const L = x.L; const g = guardSit(x, s, 0.2); g.head.rotation.y = 0.15; g.head.rotation.x = -0.05;
  camMove(x, [0.25, 1.78, -1.2], [0, 1.72, 0.2], [0.15, 1.76, -0.95], [0, 1.73, 0.2], eo, 40); hand(x, 0.6);
  x.out.ui = { type: 'oxygen', v: 0.04 }; x.S.slRed.intensity = 5 * (Math.floor(x.t * 5) % 2); x.post.vig.value = mix(0.6, 1.1, x.u);
});
at(54.70, 'yenndo_jump', x => {
  const s = x.S.officeSL; x.out.scene = s; const L = x.L; cam(x, [0, 1.6, 0.4], [0, 1.6, -3], 48);
  const c = put(x, 'yenndo', s, 0, 0, -1, 0); jumpscare(x, c, L - 0.42, { statAt: 0.75 }); if (L < 0.42) { c.root.visible = false; x.post.fade.value = 0.85; }
  x.S.slRed.intensity = 6;
});

// ===== OUTRO: "Mas e aí? Faltou algum? Comenta aí embaixo." =====
at(55.74, 'outro', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L;
  [['foxy', -1.4], ['puppet', -0.7], ['pfoxy', 0], ['nightm', 0.72], ['yenndo', 1.42]].forEach(([n, px], i) => { const c = put(x, n, s, px, 0, -0.3 * Math.abs(px), -px * 0.14); c.idle(x.t, 1, i); lookAtCam(x, c, 0.6); if (c.tendrils) x.waveTendrils(c, x.t); });
  x.C.foxy.armL.piv.rotation.z += (2.4 + 0.3 * Math.sin(L * 10)) * sm(seg(L, 0.3, 0.6));
  x.S.voidSpot.intensity = 45; x.S.voidFill.intensity = 3;
  camMove(x, [0, 1.6, 7.0], [0, 1.5, 0], [0, 1.7, 8.2], [0, 1.45, 0], eo, 46); hand(x);
  pop(x, x.FX.q1, s, [0, 3.1, 0.2], 1.15, 0.8); sparkles(x, s, [0, 2.6, 0], 2.0, 8, 1.3);
  x.post.fade.value = sm(seg(L, x.d - 0.3, x.d));
});

export const SHOTS = shots;
export const DURATION = 58.488;
