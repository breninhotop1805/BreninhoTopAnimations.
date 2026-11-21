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
const tp = (c, part, v) => { c.root.updateMatrixWorld(true); const o = c[part].isObject3D ? c[part] : c[part].piv; return o.localToWorld(new V3(v[0] * x_U, v[1] * x_U, v[2] * x_U)); };

function agonyAt(x, s, center, rad = 1, inward = 0) { const g = x.FX.agony; s.add(g); g.position.copy(center);
  g.children.forEach(m => { const d = m.userData; const k = (x.t * d.sp * 0.5 + d.ph) % 1; const rr = d.rr * rad * (inward ? (1 - k) : 1); const a = d.a + x.t * d.sp * 1.4;
    m.position.set(Math.cos(a) * rr, d.y * rad * 0.8 * (inward ? (1 - k * 0.5) : 1) + 0.2 * Math.sin(x.t * 2 + d.ph * 6), Math.sin(a) * rr); m.scale.setScalar(d.sz * (1.2 - 0.6 * k)); m.rotation.set(x.t * d.sp, x.t, 0); }); }
// ---------- helpers for the Springtrap "always comes back" video ----------
function fireAt(x, s, cx, cz, w, d, h = 3.0, I = 12) { const g = x.FX.fire; s.add(g); const t = x.t;
  g.userData.fl.forEach(m => { const q = m.userData; const k = (t * q.sp + q.ph) % 1; m.position.set(cx + (q.u - 0.5) * w + 0.12 * Math.sin(t * 3 + q.ph * 9), k * h, cz + (q.v - 0.5) * d); m.scale.setScalar(q.sz * (1 - k) * 1.6 + 0.02); m.rotation.set(t + q.ph, t * 0.7, 0); });
  g.userData.sm.forEach(m => { const q = m.userData; const k = (t * q.sp + q.ph) % 1; m.position.set(cx + (q.u - 0.5) * w, h * 0.6 + k * 2.5, cz + (q.v - 0.5) * d); m.scale.setScalar(0.3 + k * 1.0); });
  g.userData.lights.forEach((l, i) => { l.position.set(cx + (i ? 0.6 : -0.6) * w * 0.3, 1.4, cz); l.intensity = I * (0.75 + 0.25 * Math.sin(t * 13 + i * 2) * Math.sin(t * 7.7 + i)); }); }
function fright(x, flick = 0.5) { const s = x.S.fright; x.out.scene = s; x.S.frLamps.forEach((l, i) => l.intensity = 8 * mix(1, flicker(x.t, i * 3), flick)); x.post.tint.value.set(0.92, 1.05, 0.92); x.post.vig.value = 0.9; return s; }
function maze(x) { const s = x.S.maze; x.out.scene = s; x.S.mazeLights.forEach((l, i) => l.intensity = 10 * (0.7 + 0.3 * Math.sin(x.t * 11 + i))); x.post.vig.value = 0.9; return s; }
function shop(x) { const s = x.S.shop; x.out.scene = s; x.post.vig.value = 0.85; return s; }
function tankAt(x, s, lv, glow = 1) { const t = x.FX.tank; s.add(t); t.position.set(-1.5, 1.01, -3.2); t.userData.liq.scale.y = Math.max(0.02, 1.1 * lv); t.userData.liq.position.y = 0.2 + 0.55 * lv; t.userData.light.intensity = 3.5 * glow * lv;
  t.userData.liqM.color.set('#3ad8ff').multiplyScalar(0.8 + 0.2 * Math.sin(x.t * 6)); return t; }
function voidMood(x, rim = '#ff4a2a', spot = 34) { const s = x.S.void; x.out.scene = s; x.S.voidSpot.intensity = spot; x.S.voidFill.intensity = 5; x.S.voidRim.intensity = 14; x.S.voidRim.color.set(rim); x.post.vig.value = 1.0; return s; }
function glitchIn(x, c, amt = 1) { const j = Math.floor(x.t * 24); const r = rng(j * 7 + 3); if (r() < 0.45 * amt) { c.root.position.x += (r() - 0.5) * 0.18 * amt; c.root.position.y += (r() - 0.5) * 0.06 * amt; } x.post.chroma.value = Math.max(x.post.chroma.value, 0.7 * amt); if (r() < 0.25 * amt) x.post.stat.value = Math.max(x.post.stat.value, 0.3 * amt); }
function twitch(c, t, a = 1) { c.head.rotation.z += 0.25 * a * (Math.sin(t * 13) > 0.85 ? Math.sin(t * 61) : 0); c.head.rotation.x += 0.15 * a * (Math.sin(t * 9.1) > 0.9 ? 1 : 0); }

// ===== HOOK =====
// "Por que o Springtrap sempre volta?" — he lurches out of the dark straight at us
at(0.00, 'hook', x => {
  const s = fright(x, 0.9); const L = x.L; const c = put(x, 'spring', s, 0.1, 0, 0, 0); walkTo(c, [0.1, 0, -9.5], [0.05, 0, -5.4], eo(seg(L, 0, 2.0)), 1.1); twitch(c, x.t, 1);
  aim(c, 'R', rootPt(c, -0.4, 1.7, 1.0), eo(seg(L, 1.4, 2.0))); camMove(x, [0.3, 1.5, -1.4], [0, 1.8, -8], [0.15, 1.75, -2.9], [0.05, 1.95, -5.4], eio, 50); hand(x, 1.2); staticIn(x, 0.2);
  fillOn(x, c, 2.5, 2.0); if (L > 1.95 && L < 2.05) x.post.flash.value = 0.25;
});
// "Ele é queimado vivo no FNaF 3,"
at(2.18, 'burn3', x => {
  const s = fright(x, 0.2); const L = x.L; const c = put(x, 'spring', s, 0, 0, -6.2, 0); c.idle(x.t, 1); twitch(c, x.t, 1.5); aim(c, 'R', rootPt(c, -0.5, 2.2, 0.6), 0.6 + 0.3 * Math.sin(x.t * 8)); aim(c, 'L', rootPt(c, 0.5, 2.0, 0.5), 0.6);
  fireAt(x, s, -1.1, -6.0, 0.8, 5, 2.8, 14); x.S.frLamps.forEach(l => l.intensity = 1);
  const a = 0.5 - 1.0 * eio(x.u); cam(x, [Math.sin(a) * 1.3, 1.4, -6.2 + Math.cos(a) * 3.3], [0, 1.6, -6.2], 52); x.post.tint.value.set(1.15, 0.9, 0.75);
});
// "no FNaF 6, e mesmo assim"
at(4.30, 'burn6', x => {
  const s = maze(x); const L = x.L; const c = put(x, 'scrap', s, 0.1, 0, -4.8, 0); c.idle(x.t, 1); twitch(c, x.t, 1); c.head.rotation.y = 0.3 * Math.sin(x.t * 1.5);
  fireAt(x, s, -1.2, -5.0, 0.6, 7, 3.0, 14); x.FX.fire.userData.fl.forEach((m, i) => { if (i % 2) m.position.x += 2.4; });
  camMove(x, [0.5, 1.6, -1.0], [0.1, 1.8, -4.8], [0.25, 1.75, -2.4], [0.1, 1.9, -4.8], eo, 50); hand(x); fillOn(x, c, 4, 2.0);
});
// "a famosa frase 'eu sempre volto' continua se repetindo."
at(5.78, 'always', x => {
  const s = voidMood(x, '#ff4a2a', 18); const L = x.L; const c = put(x, 'spring', s, 0, 0, 0, 0); c.idle(x.t, 0.5); c.head.rotation.x = 0.1; c.head.rotation.y = 0.15 * Math.sin(x.t * 1.2); twitch(c, x.t, 0.6);
  x.S.voidSpot.intensity = 10 + 10 * flicker(x.t, 2); const hp = tp(c, 'head', [0, 4, 4]);
  camMove(x, [hp.x + 0.8, hp.y - 0.5, hp.z + 3.6], hp.toArray(), [hp.x + 0.15, hp.y - 0.1, hp.z + 1.5], hp.toArray(), eio, 44);
  const rp = Math.floor(L / 0.9); if ((L % 0.9) < 0.07 && rp > 0) { x.post.stat.value = 0.4; x.post.flash.value = 0.12; }
});
// "Como o corpo de um cara normal"
at(8.86, 'normal_guy', x => {
  const s = voidMood(x, '#9ab8ff', 40); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 1); lookAtCam(x, w, 0.6); w.head.rotation.z = 0.15 * eo(seg(L, 0.6, 1.2));
  const a = -0.6 + 1.0 * eio(x.u); cam(x, [Math.sin(a) * 3.0, 1.6, Math.cos(a) * 3.0], [0, 1.5, 0], 46); pop(x, x.FX.q1, s, headTop(w, 0.8), 1.2, 0.8);
});
// "consegue resistir a tanto fogo e destruição sem virar cinzas?"
at(11.32, 'no_ash', x => {
  const s = maze(x); const L = x.L; const w = put(x, 'william', s, 0.05, 0, -4.0, 0); w.idle(x.t, 0.4); w.head.rotation.x = -0.15; lookAtCam(x, w, 0.5);
  fireAt(x, s, 0, -4.4, 3.0, 2.2, 3.0, 9); x.FX.fire.userData.fl.forEach((m, i) => { if (Math.abs(m.position.x - 0.05) < 0.55 && m.position.z > -4.5) m.visible = false; else m.visible = true; });
  camMove(x, [0.2, 1.5, 0.2], [0, 1.6, -4], [0.1, 1.6, -1.6], [0, 1.65, -4], eo, 50); fillOn(x, w, 1.5, 1.8); x.post.tint.value.set(1.15, 0.92, 0.8);
});
// "A verdade é que William Afton deixou de ser humano"
at(13.88, 'not_human', x => {
  const s = voidMood(x, '#3ad8ff', 30); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.6); lookAtCam(x, w, 0.8);
  const k = sm(seg(L, 1.2, 2.6)); x.S.voidRim.color.set('#3ad8ff'); x.S.voidRim.intensity = 14 + 30 * k; x.post.tint.value.set(1 - 0.2 * k, 1, 1 + 0.25 * k); if (L > 2.5) glitchIn(x, w, 0.4);
  const hp = tp(w, 'head', [0, 4, 4]); camMove(x, [0.3, 1.5, 3.4], [0, 1.4, 0], [hp.x + 0.15, hp.y, hp.z + 1.4], hp.toArray(), eio, 44);
});
// "muito antes de entrar naquela fantasia."
at(16.86, 'suit', x => {
  const s = x.S.diner; x.out.scene = s; const L = x.L; x.post.vig.value = 0.95; x.S.dinerLamps.forEach(l => l.intensity = 2); x.S.dinerSpot.intensity = 18;
  const b = put(x, 'springbonnie', s, 0.9, 0.77, -4.4, -0.2); droop(b, 0.4); b.armR.piv.rotation.z = -0.15; b.armL.piv.rotation.z = 0.15;
  const w = put(x, 'william', s, 0, 0, 0, 0); walkTo(w, [-1.2, 0, -1.6], [0.0, 0, -2.5], eo(seg(L, 0, 1.4)), 0.75); w.root.rotation.y = mix(Math.atan2(1.2, -0.9), 2.6, eo(seg(L, 1.2, 1.6))); if (L > 1.3) aim(w, 'R', tp(b, 'armL', [0, -8, 0]), eo(seg(L, 1.3, 1.7)));
  camMove(x, [0.2, 1.7, 1.6], [0.2, 1.5, -3.2], [0.35, 1.7, 0.7], [0.3, 1.6, -3.4], eo, 50); fillOn(x, w, 1.5, 1.8);
});
// "Enquanto caçava as crianças,"
at(18.60, 'hunt', x => {
  const s = x.S.hall; x.out.scene = s; const L = x.L; x.S.hallLamps.forEach((l, i) => { l.intensity = 9 * flicker(x.t, i); l.color.set('#ffb0a0'); });
  [[0, -0.5, 0.0], [1, 0.4, 0.4], [2, -0.1, 0.9]].forEach(([i, px, dz]) => { const k = put(x, 'kid' + i, s, 0, 0, 0, Math.PI); walkTo(k, [px, 0, -4 + dz], [px, 0, -9 + dz], seg(L, 0, 1.74), 0.5); k.root.rotation.y = Math.PI; k.walk(L * 6, 1); });
  const p = put(x, 'purpleguy', s, 0, 0, 0, Math.PI); walkTo(p, [0.1, 0, -0.5], [0.1, 0, -4.6], seg(L, 0, 1.74), 0.9); p.root.rotation.y = Math.PI;
  camMove(x, [0.6, 1.2, 2.6], [0, 1.4, -6], [0.5, 1.3, -1.0], [0, 1.3, -8], (u) => u, 52); hand(x);
});
// "ele descobriu como extrair uma substância bizarra chamada Remanescente,"
at(20.22, 'extract', x => {
  const s = shop(x); const L = x.L; const t = tankAt(x, s, eo(seg(L, 0.3, 3.4))); const w = put(x, 'william', s, -0.2, 0, -1.9, -2.2); w.idle(x.t, 0.6); aim(w, 'R', new V3(-1.2, 1.9, -3.0), 0.8);
  orbAt(x, 0, s, new V3(mix(0.6, -1.5, eio(seg(L, 0.2, 2.6))), mix(1.4, 2.0, eio(seg(L, 0.2, 2.6))), mix(-1.0, -3.2, eio(seg(L, 0.2, 2.6)))), 0.5 * (1 - seg(L, 2.4, 2.8)));
  camMove(x, [-0.5, 1.9, 1.9], [-0.8, 1.5, -2.6], [-0.6, 1.85, 1.1], [-0.85, 1.6, -2.7], eo, 50); fillOn(x, w, 1.5, 1.8); x.S.shopLamp.intensity = 18;
});
// "que é basicamente o metal dos robôs misturado com a energia das almas."
at(23.98, 'mix', x => {
  const s = shop(x); const L = x.L; const t = tankAt(x, s, 0.85); const c = t.position;
  t.userData.bits.forEach((b, i) => { const a = x.t * 2.2 + i * 0.45; b.visible = true; b.position.set(Math.cos(a) * 0.22, 0.35 + ((i * 0.07 + x.t * 0.2) % 0.8), Math.sin(a) * 0.22); b.rotation.set(a, a * 1.3, 0); });
  [0, 1, 2].forEach(i => { const a = x.t * 1.6 + i * 2.1; orbAt(x, i, s, new V3(c.x + Math.cos(a) * 0.2, c.y + 0.5 + 0.25 * Math.sin(x.t * 2 + i), c.z + Math.sin(a) * 0.2), 0.3); });
  const a = -0.5 + 1.0 * eio(x.u); cam(x, [c.x + Math.sin(a) * 2.4, c.y + 1.0, c.z + Math.cos(a) * 2.4], [c.x, c.y + 0.75, c.z], 46); x.S.shopLamp.intensity = 6;
});
// "O que quase ninguém percebe é a loucura que ele fez com essa descoberta."
at(27.68, 'madness', x => {
  const s = shop(x); const L = x.L; tankAt(x, s, 0.6); const w = put(x, 'william', s, -0.5, 0, -1.6, 0.5); w.idle(x.t, 0.8);
  const v = x.FX.vial; s.add(v); const hp = w.handR.getWorldPosition(new V3()); aim(w, 'R', rootPt(w, -0.45, 1.3, 0.5), eo(seg(L, 0.2, 0.8))); v.position.copy(w.handR.getWorldPosition(new V3())).add(new V3(0, 0.06, 0));
  w.head.rotation.x = 0.35 * eo(seg(L, 0.6, 1.2)); w.head.rotation.y = -0.3 * eo(seg(L, 0.6, 1.2));
  const hd = tp(w, 'head', [0, 4, 4]); const fw = new V3(Math.sin(w.root.rotation.y), 0, Math.cos(w.root.rotation.y)); camMove(x, [hd.x + fw.x * 2.4, hd.y - 0.1, hd.z + fw.z * 2.4], [hd.x, hd.y - 0.3, hd.z], [hd.x + fw.x * 2.0, hd.y - 0.15, hd.z + fw.z * 2.0], [hd.x, hd.y - 0.35, hd.z], eio, 46); fillOn(x, w, 0.6, 1.8); x.S.shopLamp.intensity = 10;
});
// "O segredo macabro é que o Afton usou essa substância no próprio corpo."
at(31.34, 'inject', x => {
  const s = voidMood(x, '#3ad8ff', 26); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.5);
  const raise = eo(seg(L, 0.1, 0.8)); aim(w, 'R', rootPt(w, -0.1, 1.9, 0.5), raise); const v = x.FX.vial; s.add(v); v.position.copy(w.handR.getWorldPosition(new V3())).add(new V3(0, 0.08, 0)); v.visible = L < 2.0;
  const k = sm(seg(L, 1.9, 3.2)); x.S.voidRim.intensity = 14 + 40 * k; x.post.tint.value.set(1 - 0.3 * k, 1 - 0.05 * k, 1 + 0.35 * k); if (L > 1.95 && L < 2.05) x.post.flash.value = 0.4; if (L > 2.0) glitchIn(x, w, 0.6 * k);
  w.torso.rotation.x = -0.15 * k; w.head.rotation.x = -0.35 * k; w.armL.piv.rotation.z = 0.5 * k;
  const a = 0.4 - 0.8 * eio(x.u); cam(x, [Math.sin(a) * 2.8, 1.6, Math.cos(a) * 2.8], [0, 1.5, 0], 46); sparkles(x, s, [0, 1.4, 0], 0.6, 8, 0.8 * k);
});
// "Ele não sobrevive porque é forte,"
at(35.32, 'rises', x => {
  const s = fright(x, 0.6); const L = x.L; const c = put(x, 'spring', s, 0, 0, -6.0, 0); const k = eo(seg(L, 0.2, 1.6));
  c.root.position.y = -0.25 * (1 - k); c.torso.rotation.x = 1.1 * (1 - k); c.legR.piv.rotation.x = -1.4 * (1 - k); c.legL.piv.rotation.x = -1.2 * (1 - k); c.head.rotation.x = 0.5 * (1 - k); twitch(c, x.t, 1.2);
  aim(c, 'R', rootPt(c, -0.5, 0.2 + 1.6 * k, 0.6), 1 - k); camMove(x, [0.6, 0.6, -3.4], [0, 1.0, -6], [0.3, 1.2, -3.8], [0, 1.8, -6], eio, 50); fillOn(x, c, 2, 1.8);
});
// "e sim porque a alma dele está grudada no metal pela pura força da agonia."
at(37.10, 'agony', x => {
  const s = voidMood(x, '#ff2a2a', 22); const L = x.L; const c = put(x, 'spring', s, 0, 0, 0, 0); c.idle(x.t, 0.4); x.setXray(c, 0.8 * sm(seg(L, 0.2, 0.8)), 0.6 + 0.4 * Math.sin(x.t * 7), '#ff4040');
  const ch = tp(c, 'torso', [0, 6, 1]); orbAt(x, 0, s, ch, 0.42 * (1 + 0.2 * Math.sin(x.t * 12))); agonyAt(x, s, new V3(0, 0.4, 0), 1.0, 1);
  const a = 0.6 - 1.2 * eio(x.u); cam(x, [Math.sin(a) * 3.2, 1.7, Math.cos(a) * 3.2], [0, 1.6, 0], 46); x.post.tint.value.set(1.2, 0.85, 0.85);
});
// "Ele virou a mesma aberração que criava."
at(41.16, 'monster', x => {
  const s = x.S.diner; x.out.scene = s; const L = x.L; x.post.vig.value = 1.0; x.S.dinerLamps.forEach((l, i) => l.intensity = 6 * flicker(x.t, i)); x.S.dinerSpot.intensity = 30;
  const b = put(x, 'springbonnie', s, 0.9, 0.77, -4.4, -0.15); b.idle(x.t, 0.4); const c = put(x, 'spring', s, -0.9, 0.77, -4.4, 0.15); c.idle(x.t, 0.6); twitch(c, x.t, 0.8);
  const k = eio(x.u); cam(x, [mix(1.2, -0.6, k), 1.9, mix(0.8, 0.2, k)], [mix(0.6, -0.6, k), 2.0, -4.4], 46); x.post.tint.value.set(1.1, 0.9, 0.85);
});
// "E quando o corpo físico finalmente não aguentou mais,"
at(43.60, 'collapse', x => {
  const s = maze(x); const L = x.L; const c = put(x, 'scrap', s, 0, 0, -4.4, 0); const k = eo(seg(L, 0.6, 1.8));
  c.root.position.y = -0.62 * k; c.torso.rotation.x = -0.35 * k; c.legR.piv.rotation.x = -1.5 * k; c.legL.piv.rotation.x = -1.45 * k; c.head.rotation.x = -0.25 * k; c.head.rotation.z = 0.35 * k; c.armR.piv.rotation.z = -0.5 * k; c.armL.piv.rotation.z = 0.5 * k; twitch(c, x.t, 1 - k);
  fireAt(x, s, -1.2, -4.6, 0.6, 6, 3.0, 16); x.FX.fire.userData.fl.forEach((m, i) => { if (i % 2) m.position.x += 2.4; });
  camMove(x, [0.4, 1.7, -0.4], [0, 1.6, -4.4], [0.25, 1.3, -1.9], [0, 1.0, -4.4], eio, 50); fillOn(x, c, 1.5, 1.4); if (L > 1.6 && L < 1.9) shake(x, 0.5);
});
// "ele transferiu a própria mente para um vírus de computador,"
at(46.26, 'virus', x => {
  const s = x.S.screenroom; x.out.scene = s; const L = x.L; x.out.screen = L > 1.4 ? 'static' : 'off'; x.S.screenLamp.intensity = 1.0; x.S.neonMat.opacity = 0; x.S.neonLight.intensity = 0;
  const p = x.S.crtScreenPos; const k = eio(seg(L, 0.2, 1.6)); orbAt(x, 0, s, new V3(mix(1.6, p.x, k), mix(1.1, p.y, k), mix(1.4, p.z + 0.05, k)), 0.45 * (1 - seg(L, 1.5, 1.8)));
  x.S.crtLight.intensity = L > 1.4 ? 4 : 1.5; cam(x, [p.x + mix(1.4, 0.4, eio(x.u)), p.y + 0.15, p.z + mix(2.6, 1.3, eio(x.u))], [p.x, p.y, p.z], 50); if (L > 1.45 && L < 1.55) x.post.flash.value = 0.3;
});
// "virando o Glitchtrap."
at(48.94, 'glitchtrap', x => {
  const s = voidMood(x, '#a05aff', 36); const L = x.L; const g = put(x, 'glitchtrap', s, 0, 0, 0, 0); g.idle(x.t, 1); glitchIn(x, g, 1 - 0.6 * seg(L, 0.3, 1.0)); lookAtCam(x, g, 0.6);
  g.root.visible = L > 0.1 && (L > 0.6 || Math.sin(x.t * 50) > -0.3); const hp = tp(g, 'head', [0, 4, 4]);
  camMove(x, [0.6, 1.5, 3.6], [0, 1.7, 0], [hp.x + 0.2, hp.y, hp.z + 1.8], hp.toArray(), eio, 46);
});
// "Mas e aí, sabia dessa?"
at(50.02, 'knew', x => {
  const s = voidMood(x, '#a05aff', 36); const L = x.L; const g = put(x, 'glitchtrap', s, 0, 0, 0, 0); g.idle(x.t, 1); g.head.rotation.z = 0.3 * eo(seg(L, 0.2, 0.6)); lookAtCam(x, g, 0.8);
  aim(g, 'R', rootPt(g, -0.3, 1.9, 0.6), eo(seg(L, 0.3, 0.7))); camMove(x, [0.3, 1.9, 3.8], [0, 1.85, 0], [0.2, 1.9, 3.2], [0, 1.9, 0], eo, 46); pop(x, x.FX.q1, s, headTop(g, 0.9), 0.5, 0.8); if (Math.sin(x.t * 9) > 0.95) glitchIn(x, g, 0.5);
});
// "Comenta aí e me segue pra mais mistérios."
at(51.76, 'outro', x => {
  const s = voidMood(x, '#ff6a3a', 36); const L = x.L; const c = put(x, 'spring', s, -0.75, 0, 0, 0.25); c.idle(x.t, 1); lookAtCam(x, c, 0.7);
  const g = put(x, 'glitchtrap', s, 0.75, 0, 0, -0.25); g.idle(x.t, 1, 2); lookAtCam(x, g, 0.7); aim(g, 'R', rootPt(g, -0.6, 2.2 + 0.12 * Math.sin(x.t * 9), 0.4), eo(seg(L, 0, 0.3)));
  aim(c, 'L', rootPt(c, 0.6, 2.2 + 0.12 * Math.sin(x.t * 9 + 1), 0.4), eo(seg(L, 0.1, 0.4))); camMove(x, [0, 1.8, 5.4], [0, 1.6, 0], [0, 1.8, 4.6], [0, 1.65, 0], eo, 48);
});

export const SHOTS = shots;
export const DURATION = 53.88;
