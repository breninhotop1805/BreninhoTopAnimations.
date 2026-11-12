// Shot list for "Por que os OLHOS DA CIRCUS BABY mudam de cor?". Pure function of time.
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
// ---------- helpers for the Circus Baby video ----------
const shots = [];
const at = (t, name, fn) => shots.push({ t, name, fn });
function lensOn(x, wps, r, a, mark, col) { if (!Array.isArray(wps)) wps = [wps]; const P = wps.map(w => proj(x, w)); const u = P.reduce((s, p) => s + p[0], 0) / P.length, v = Math.min(...P.map(p => p[1]));
  x.out.ui = { type: 'lens', pts: P.map(([a1, b1]) => [a1, b1, r]), a, col, mark: mark ? [u, v - r * 1.25 * 9 / 16, mark === 'ok'] : null }; }
const tp = (c, part, v) => { c.root.updateMatrixWorld(true); const o = c[part].isObject3D ? c[part] : c[part].piv; return o.localToWorld(new V3(v[0] * x_U, v[1] * x_U, v[2] * x_U)); };
const GREEN = '#5aff6a', BLUE = '#4aa8ff';
function gallery(x) { const s = x.S.gallery; x.out.scene = s; x.post.vig.value = 0.85; x.S.bulbs.forEach((b, i) => b.visible = Math.sin(x.t * 6 + i * 0.9) > -0.6); return s; }
function babyOn(x, s, eyes = GREEN, ry = 0) { const b = put(x, 'baby', s, 0, 1.0, -3.4, ry); b.idle(x.t, 1); b.setEyes(eyes); return b; }
function eyesPts(b) { return [tp(b, 'head', [-2.0, 4.4, 4.4]), tp(b, 'head', [2.0, 4.4, 4.4])]; }
function mg(x, spec) { x.out.scene = x.S.void; x.out.ui = { type: 'mg', mg: spec }; }
const KIDS = [{ x: 62, y: 150 }, { x: 226, y: 104 }, { x: 274, y: 150 }, { x: 322, y: 64 }];
function cakeArc(from, to, k) { return { x: from[0] + (to[0] - from[0]) * k, y: from[1] + (to[1] - from[1]) * k - Math.sin(Math.PI * k) * 40 }; }

// ===== HOOK =====
// "A Circus Baby não tem olhos verdes,"
at(0.00, 'eyes_green', x => {
  const s = gallery(x); const L = x.L; x.S.galKey.intensity = 2; x.S.galSpot.intensity = 14; const b = babyOn(x, s, GREEN); b.head.rotation.x = 0.05;
  const hp = tp(b, 'head', [0, 4.5, 4]); camMove(x, [hp.x + 0.25, hp.y + 0.1, hp.z + 1.9], hp.toArray(), [hp.x + 0.1, hp.y + 0.05, hp.z + 1.3], hp.toArray(), eo, 40); staticIn(x, 0.18);
  if (L > 1.0) lensOn(x, eyesPts(b), 0.075, sm(seg(L, 1.0, 1.25)), 'x', '#ff5050');
});
// "você foi enganado esse tempo todo."
at(2.14, 'fooled', x => {
  const s = gallery(x); const L = x.L; const b = babyOn(x, s, GREEN); b.head.rotation.z = 0.25 * eo(seg(L, 0.4, 1.0)); b.head.rotation.x = -0.05;
  x.S.galRed.intensity = (Math.sin(x.t * 9) > 0.6) ? 10 : 0; camMove(x, [0.6, 1.8, 5.2], [0, 2.6, -3.4], [0.3, 2.0, 3.8], [0, 2.7, -3.4], eo, 50); hand(x);
});
// "Se você jogar o minigame secreto"
at(4.08, 'arcade', x => {
  const s = x.S.arcade; x.out.scene = s; const L = x.L; x.out.screen = 'mg'; x.out.mg = { cx: 180, cy: 120, z: 0.5, baby: { x: 120 + L * 25, y: 196, walk: 1 }, kids: KIDS, counter: 0 };
  const p = x.S.cabScreenPos; const k = eio(seg(L, 0, 1.56)); cam(x, [p.x + mix(0.9, 0, k), p.y + mix(0.1, 0.0, k), p.z + mix(4.2, 1.85, k)], [p.x, p.y - 0.05 * (1 - k), p.z], 46);
  x.post.flash.value = L > 1.42 ? (L - 1.42) / 0.14 * 0.8 : 0;
});
at(5.64, 'logo_sl', x => { const s = gallery(x); babyOn(x, s, GREEN); cam(x, [0, 2.2, 6.5 - 0.4 * x.u], [0, 2.6, -3.4], 50); logoCard(x, 0); });

// ===== MINIGAME =====
// "vai notar um detalhe que muda toda a história."
at(6.78, 'mg_walk', x => { const L = x.L; const bx = 70 + L * 34; mg(x, { cx: bx + 8, cy: 150, z: 2, baby: { x: bx, y: 196, walk: 1, mic: 1 }, kids: KIDS.map(k => ({ ...k, note: 1 })), counter: 0 }); });
// "Quando a Baby entra no palco para entregar os bolinhos,"
at(8.98, 'mg_cakes', x => { const L = x.L; const bx = 150; const from = [bx - 14, 160]; const cakes = []; let cnt = 0;
  [[0.2, 1], [0.95, 2], [1.7, 0]].forEach(([t0, ki]) => { const k = seg(L, t0, t0 + 0.6); if (k > 0 && k < 1) cakes.push(cakeArc(from, [KIDS[ki].x, KIDS[ki].y - 18], eo(k))); if (k >= 1) cnt++; });
  mg(x, { cx: 190, cy: 132, z: 1.5, baby: { x: bx, y: 196, throw: Math.sin(x.t * 7) > 0 }, kids: KIDS.map((k, i) => ({ ...k, happy: 1, note: 1 })), cakes, counter: cnt }); });
// "os olhos dela são azuis."
at(11.42, 'mg_blue', x => { const L = x.L; const z = 2 + 2.2 * eo(seg(L, 0, 0.6)); mg(x, { cx: 150, cy: mix(150, 143, eo(seg(L, 0, 0.6))), z, baby: { x: 150, y: 196, mic: 1 }, kids: KIDS, counter: 3, ring: L > 0.6 ? [150, 143, 0.26, '#7ac8ff', sm(seg(L, 0.6, 0.85))] : null }); });

// ===== WILLIAM =====
// "William Afton construiu ela exatamente assim."
at(13.22, 'afton_build', x => {
  const s = x.S.shop; x.out.scene = s; const L = x.L; const b = put(x, 'baby', s, -0.9, 0, -2.6, 0.45); b.setEyes(BLUE, 0.35); droop(b, 0.4); b.armR.piv.rotation.z = -0.15; b.armL.piv.rotation.z = 0.15;
  const w = put(x, 'william', s, 0.55, 0, -1.4, -2.2); w.idle(x.t, 0.6); const tgt = tp(b, 'armL', [0, -6, 2]); aim(w, 'R', tgt, 1); w.head.rotation.x = 0.25;
  sparksAt(x, s, tgt, ((L * 1.7) % 1) * 1.1); x.S.shopLamp.intensity = 40;
  camMove(x, [0.6, 1.8, 2.7], [-0.25, 1.6, -2.2], [0.45, 1.8, 2.1], [-0.25, 1.65, -2.2], eo, 50); hand(x);
});
// "Mas então, por que no jogo principal"
at(15.78, 'control', x => {
  const s = x.S.control; x.out.scene = s; const L = x.L; x.S.ctrlLamps.forEach((l, i) => l.intensity = 1.5 * (Math.sin(x.t * 4 + i * 1.6) > 0 ? 1 : 0.3));
  camMove(x, [0.4, 1.7, 2.4], [0, 1.8, -2.5], [0.2, 1.75, 1.6], [0, 1.85, -2.5], eo, 56); hand(x);
});
// "ele encara a gente com aqueles olhos verdes brilhantes?"
at(17.62, 'stare', x => {
  const s = x.S.control; x.out.scene = s; const L = x.L; const b = put(x, 'baby', s, 0, 0, mix(-5.2, -3.2, eo(seg(L, 0, 1.2))), 0); b.idle(x.t, 0.5); b.setEyes(GREEN, 1 + 0.2 * Math.sin(x.t * 7));
  b.head.rotation.x = 0.12; x.S.ctrlBehindLight.intensity = 2.5; x.S.ctrlKey.intensity = 3; x.S.ctrlLamps.forEach(l => l.intensity = 0.4);
  camMove(x, [0.15, 1.8, 0.6], [0, 2.3, -3.5], [0.05, 1.85, -0.4], [0, 2.4, -3.5], eio, 48); pop(x, x.FX.q1, s, [0.55, 3.0, -2.2], 1.7, 0.45);
});
// "A resposta é um dos momentos mais cruéis do jogo."
at(20.34, 'cruel', x => {
  const s = gallery(x); const L = x.L; const b = babyOn(x, s, GREEN); b.head.rotation.x = 0.2; x.S.galWash.intensity = 2; x.S.galSpot.intensity = 0; x.S.galKey.intensity = 0.6; x.S.galRed.intensity = 6 + 6 * Math.sin(x.t * 5);
  x.S.bulbs.forEach(bb => bb.visible = false); camMove(x, [0, 1.2, 4.4], [0, 2.4, -3.4], [0, 1.4, 2.6], [0, 2.6, -3.4], eio, 50); x.post.tint.value.set(1.2, 0.85, 0.85); staticIn(x, 0.15);
});

// ===== THE CLAW =====
// "O Afton não construiu a Baby só para cantar e fazer balões."
at(23.00, 'sing', x => {
  const s = gallery(x); const L = x.L; const b = babyOn(x, s, BLUE); b.armL.piv.rotation.x = -1.15 * eo(seg(L, 0, 0.4)); b.armL.piv.rotation.z = -0.25 * eo(seg(L, 0, 0.4)); b.head.rotation.z = 0.1 * Math.sin(x.t * 4);
  const bl = x.FX.balloon; if (L > 2.2) { s.add(bl); const k = eo(seg(L, 2.2, 2.9)); bl.position.copy(tp(b, 'armR', [0, -11, 0])).add(new V3(0, 0.6 * k, 0)); bl.scale.setScalar(0.4 + 0.6 * k); aim(b, 'R', tp(b, 'torso', [-8, 10, 6]), k); }
  camMove(x, [0.9, 2.0, 3.6], [0, 2.5, -3.4], [0.5, 2.1, 2.6], [0, 2.5, -3.4], eo, 48); sparkles(x, s, [0, 3.6, -3.0], 1.0, 6, 0.6);
});
// "Ela tinha uma garra escondida na barriga,"
at(25.98, 'claw', x => {
  const s = gallery(x); const L = x.L; const b = babyOn(x, s, BLUE); b.setClaw(eo(seg(L, 0.9, 1.4)), eo(seg(L, 1.5, 2.2)), sm(seg(L, 2.2, 2.45)));
  const p = tp(b, 'torso', [0, 5, 3]); camMove(x, [p.x + 1.5, p.y + 0.5, p.z + 3.0], p.toArray(), [p.x + 1.1, p.y + 0.4, p.z + 2.4], p.toArray(), eo, 46); x.S.galRed.intensity = L > 1.4 ? 4 : 0; if (L > 1.5 && L < 1.9) shake(x, 0.2);
});
// "projetada para capturar crianças quando não tivesse nenhum adulto olhando."
at(28.52, 'scan_kids', x => {
  const s = x.S.party; x.out.scene = s; const L = x.L; const b = put(x, 'baby', s, 0, 0, -3.0, 0); b.setEyes(BLUE); b.idle(x.t, 1); b.head.rotation.x = 0.35;
  [[0, -1.0, -1.2, 0.3], [1, 0.1, -0.9, 0], [2, 1.1, -1.3, -0.3], [3, 0.6, -0.2, -0.1]].forEach(([i, px, pz, ry]) => { const k = put(x, 'kid' + i, s, px, 0, pz, Math.PI + ry); k.idle(x.t, 1, i); k.head.rotation.x = -0.35; });
  const hp = tp(b, 'head', [0, 4, 5]); cam(x, [hp.x, hp.y + 0.05, hp.z + 0.05], [0, 0.6, -0.6], 58); hand(x, 0.6);
  x.out.ui = { type: 'vision', box: [0.18, 0.5, 0.64, 0.36], label: L < 1.9 ? 'CRIANÇAS: 4' : 'ADULTOS: 0', id: 'ALVO: CAPTURAR', locked: L > 2.6, col: L > 1.9 ? '#ff4040' : '#7ac8ff' };
});
// "E um dia, a própria filha dele"
at(32.20, 'william_no', x => {
  const s = x.S.party; x.out.scene = s; const L = x.L; const w = put(x, 'william', s, 0, 0, 1.0, 0.15); w.idle(x.t, 0.6); lookAtCam(x, w, 0.8);
  aim(w, 'R', rootPt(w, -0.25, 1.95 + 0.05 * Math.sin(x.t * 9), 0.55), eo(seg(L, 0.15, 0.4))); w.head.rotation.y += 0.2 * Math.sin(x.t * 8) * seg(L, 0.4, 0.6);
  camMove(x, [0.3, 1.75, 3.6], [0, 1.6, 1.0], [0.2, 1.7, 3.1], [0, 1.65, 1.0], eo, 46);
});
// "desobedeceu as ordens e chegou perto demais da máquina."
at(33.50, 'approach', x => {
  const s = x.S.party; x.out.scene = s; const L = x.L; const b = put(x, 'baby', s, 0, 0, -3.0, 0); b.setEyes(BLUE); b.idle(x.t, 0.5); b.head.rotation.x = 0.3 * eo(seg(L, 0.8, 1.6));
  const e = put(x, 'elizabeth', s, 0, 0, 0, Math.PI); walkTo(e, [0.35, 0, 1.6], [0.1, 0, -1.9], eo(seg(L, 0, 2.2)), 0.6); e.root.rotation.y = Math.PI; e.head.rotation.x = -0.4;
  camMove(x, [1.2, 1.3, 2.8], [0, 1.4, -2.2], [0.9, 1.25, 2.0], [0, 1.4, -2.4], eo, 50); hand(x);
});
// "A garotinha que foi capturada"
at(35.94, 'grab', x => {
  const s = x.S.party; x.out.scene = s; const L = x.L; const b = put(x, 'baby', s, 0, 0, -3.0, 0); b.setEyes(BLUE); b.head.rotation.x = 0.3;
  b.setClaw(eo(seg(L, 0, 0.12)), eo(seg(L, 0.1, 0.3)), sm(seg(L, 0.28, 0.36)));
  const gone = L > 0.38; const e = put(x, 'elizabeth', s, 0.1, 0, -1.9, Math.PI); e.head.rotation.x = -0.4; e.root.visible = !gone;
  cam(x, [1.4, 1.5, 0.6], [0, 1.4, -2.5], 52); if (L > 0.2 && L < 0.7) shake(x, 0.9 * (1 - seg(L, 0.2, 0.7)));
  x.post.flash.value = L > 0.34 && L < 0.42 ? 0.5 : 0; if (L > 0.36) { x.post.tint.value.set(1.4, 0.7, 0.7); x.post.stat.value = L < 0.5 ? 0.5 : 0; }
});
// "...capturada" — the ice cream on the floor
at(36.62, 'bow_floor', x => {
  const s = x.S.party; x.out.scene = s; const L = x.L; const bw = x.FX.bow; s.add(bw); bw.position.set(0.1, 0.05, -1.8); bw.rotation.set(-Math.PI / 2 + 0.15, 0, 0.5);
  cam(x, [0.5, 0.5, -1.05], [0.1, 0.05, -1.8], 46); hand(x); x.post.tint.value.set(1.15, 0.8, 0.8); x.post.vig.value = 1.1; x.S.partyRed.intensity = 4;
});
// "se chamava Elizabeth."
at(38.40, 'elizabeth', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L; const e = put(x, 'elizabeth', s, 0, 0, 0, 0); e.idle(x.t, 1); lookAtCam(x, e, 0.7);
  x.S.voidSpot.intensity = 40; x.S.voidFill.intensity = 6; x.S.voidRim.intensity = 10; x.S.voidRim.color.set('#ffb070');
  camMove(x, [0.4, 1.4, 2.6], [0, 1.25, 0], [0.25, 1.35, 2.1], [0, 1.3, 0], eo, 44); sparkles(x, s, [0, 1.4, 0], 0.7, 6, 0.6);
});
// "E adivinha a cor dos olhos dela? Exatamente, verde."
at(39.34, 'liz_eyes', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L; const e = put(x, 'elizabeth', s, 0, 0, 0, 0); e.idle(x.t, 0.4); x.S.voidSpot.intensity = 40; x.S.voidFill.intensity = 8;
  const hp = tp(e, 'head', [0, 3.2, 4]); camMove(x, [hp.x + 0.1, hp.y + 0.05, hp.z + 1.4], hp.toArray(), [hp.x + 0.05, hp.y + 0.03, hp.z + 0.95], hp.toArray(), eio, 42);
  if (L > 0.9) lensOn(x, [tp(e, 'head', [-1.6, 2.4, 4.2]), tp(e, 'head', [1.6, 2.4, 4.2])], 0.07, sm(seg(L, 0.9, 1.2)), L > 1.75 ? 'ok' : null, '#5aff6a');
});
// "O momento em que os olhos da robô mudam de cor"
at(42.64, 'change', x => {
  const s = gallery(x); const L = x.L; x.S.galKey.intensity = 2; x.S.galSpot.intensity = 12; x.S.galWash.intensity = 8; const b = babyOn(x, s, BLUE); const k = sm(seg(L, 1.3, 2.0)); const c = new THREE.Color(BLUE).lerp(new THREE.Color(GREEN), k); b.setEyes('#' + c.getHexString(), 1 + 1.5 * Math.sin(Math.PI * k));
  const hp = tp(b, 'head', [0, 4.5, 4]); camMove(x, [hp.x + 0.15, hp.y + 0.05, hp.z + 1.6], hp.toArray(), [hp.x + 0.05, hp.y + 0.03, hp.z + 1.0], hp.toArray(), eio, 40);
  x.post.flash.value = k > 0.4 && k < 0.6 ? 0.15 : 0; if (k > 0.3 && k < 0.7) x.post.chroma.value = 0.6;
  if (L > 2.2) lensOn(x, eyesPts(b), 0.075, sm(seg(L, 2.2, 2.5)), 'ok', '#5aff6a');
});
// "é o instante exato em que a alma da menina toma o controle daquela carcaça de metal."
at(46.10, 'soul', x => {
  const s = gallery(x); const L = x.L; const k = eio(seg(L, 0.2, 1.6)); const b = babyOn(x, s, k > 0.9 ? GREEN : BLUE); if (k > 0.9) b.setEyes(GREEN, 1.6);
  const gz = mix(-0.6, -3.2, k); const gh = put(x, 'lizghost', s, 0, mix(0.2, 1.4, k), gz, 0, mix(1, 0.6, k)); gh.idle(x.t, 1); x.C.lizghost.ghostMat.opacity = 0.6 * (1 - seg(L, 1.4, 1.7));
  orbAt(x, 0, s, tp(b, 'torso', [0, 6, 2]), 0.5 * sm(seg(L, 1.4, 1.8)));
  camMove(x, [1.3, 2.0, 3.0], [0, 2.0, -2.2], [0.8, 2.2, 2.0], [0, 2.4, -3.0], eio, 50); if (L > 1.6 && L < 1.75) x.post.flash.value = 0.3;
});
// "Você já tinha reparado nesse detalhe?"
at(49.02, 'noticed', x => {
  const s = gallery(x); const L = x.L; const b = babyOn(x, s, GREEN); b.head.rotation.z = 0.25 * eo(seg(L, 0.1, 0.5)); lookAtCam(x, b, 0.6);
  camMove(x, [0.4, 2.4, 2.8], [0, 2.9, -3.4], [0.25, 2.5, 2.2], [0, 2.9, -3.4], eo, 46); pop(x, x.FX.q1, s, headTop(b, 0.8), 0.3, 0.7);
});
// "Comenta aí e me segue para mais mistérios."
at(50.84, 'outro', x => {
  const s = gallery(x); const L = x.L; const b = babyOn(x, s, GREEN); aim(b, 'R', rootPt(b, -0.6, 2.2 + 0.12 * Math.sin(x.t * 9), 0.4), eo(seg(L, 0, 0.3))); lookAtCam(x, b, 0.8);
  camMove(x, [0.3, 1.9, 5.6], [0, 2.4, -3.4], [0.2, 2.0, 4.8], [0, 2.4, -3.4], eo, 50);
});

export const SHOTS = shots;
export const DURATION = 52.9;
