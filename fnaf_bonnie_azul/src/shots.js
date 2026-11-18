// Shot list for "O Glamrock Bonnie REALMENTE existe?". Pure function of time.
import * as THREE from 'three';
import { rng } from './sets.js';
import { handsOut, gesture, holdPose, wave, laugh, startle, shiver as shiv, nod, headShake, alive, walkPath, gestW, springE } from './act.js';

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

function put(x, name, scene, px, py, pz, ry = 0) { // fixed size per character (no per-scene scale)
  const c = x.C[name]; scene.add(c.root); c.root.position.set(px, py, pz); c.root.rotation.set(0, ry, 0); c.root.scale.setScalar(c.baseScale || 1); c.root.visible = true; if (x.live) x.live.push(c); return c;
}
function rootPt(c, a, b, d) { c.root.updateMatrixWorld(true); return c.root.localToWorld(new V3(a, b, d)); }
function aim(c, side, wp, w = 1) {
  if (w <= 0) return; const arm = side === 'R' ? c.armR : c.armL; c.root.updateMatrixWorld(true);
  const local = c.torso.worldToLocal(wp.clone()).sub(arm.piv.position).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(DOWN, local); arm.piv.quaternion.slerp(q, cl(w));
}
function lookAt(c, P, w = 1) { c.root.updateMatrixWorld(true); const hp = c.neck.getWorldPosition(new V3()); const s = c.root.scale.x; const dx = P.x - hp.x, dz = P.z - hp.z, dy = P.y - (hp.y + 0.25 * s);
  const yaw = wrap(Math.atan2(dx, dz) - c.root.rotation.y - c.torso.rotation.y); c.head.rotation.y = mix(c.head.rotation.y, cl(yaw, -1.2, 1.2), w); c.head.rotation.x = mix(c.head.rotation.x, cl(-Math.atan2(dy, Math.hypot(dx, dz)), -0.6, 0.6), w); }
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
  g.userData.lights.forEach((l, i) => { l.position.set(cx + (i ? 0.6 : -0.6) * w * 0.3, 1.4, cz + 1.6); l.intensity = I * (0.75 + 0.25 * Math.sin(t * 13 + i * 2) * Math.sin(t * 7.7 + i)); }); }
function fright(x, flick = 0.5) { const s = x.S.fright; x.out.scene = s; x.S.frLamps.forEach((l, i) => l.intensity = 6 * mix(1, flicker(x.t, i * 3), flick)); x.post.tint.value.set(0.92, 1.05, 0.92); x.post.vig.value = 0.9; return s; }
function maze(x) { const s = x.S.maze; x.out.scene = s; x.S.mazeLights.forEach((l, i) => l.intensity = 10 * (0.7 + 0.3 * Math.sin(x.t * 11 + i))); x.post.vig.value = 0.9; return s; }
function shop(x) { const s = x.S.shop; x.out.scene = s; x.post.vig.value = 0.85; return s; }
function tankAt(x, s, lv, glow = 1) { const t = x.FX.tank; s.add(t); t.position.set(-1.5, 1.01, -3.2); t.userData.liq.scale.y = Math.max(0.02, 1.1 * lv); t.userData.liq.position.y = 0.2 + 0.55 * lv; t.userData.light.intensity = 3.5 * glow * lv;
  t.userData.liqM.color.set('#3ad8ff').multiplyScalar(0.8 + 0.2 * Math.sin(x.t * 6)); return t; }
function voidMood(x, rim = '#ff4a2a', spot = 34) { const s = x.S.void; x.out.scene = s; x.S.voidSpot.intensity = spot; x.S.voidFill.intensity = 5; x.S.voidRim.intensity = 14; x.S.voidRim.color.set(rim); x.post.vig.value = 1.0; return s; }
function glitchIn(x, c, amt = 1) { const j = Math.floor(x.t * 24); const r = rng(j * 7 + 3); if (r() < 0.45 * amt) { c.root.position.x += (r() - 0.5) * 0.18 * amt; c.root.position.y += (r() - 0.5) * 0.06 * amt; } x.post.chroma.value = Math.max(x.post.chroma.value, 0.7 * amt); if (r() < 0.25 * amt) x.post.stat.value = Math.max(x.post.stat.value, 0.3 * amt); }
function twitch(c, t, a = 1) { c.head.rotation.z += 0.25 * a * (Math.sin(t * 13) > 0.85 ? Math.sin(t * 61) : 0); c.head.rotation.x += 0.15 * a * (Math.sin(t * 9.1) > 0.9 ? 1 : 0); }

// ======================================================================================
// O MIMIC — gancho pro Iceberg. Minecraft rigs + acting kit; cut on the key word; camera always moving; zero clipping.
// ======================================================================================
// O BONNIE É AZUL — FNAF 1. Times = real word timestamps. Colour change = smooth light/tint, never a texture swap.
// ======================================================================================
const hp = (c, up = 4) => tp(c, 'head', [0, up, 0]);
function closeOn(x, c, d0, d1, side = 0.25, dy = -0.15, fov = 42, e = eo) { const h = hp(c, 3); const k = e(x.u); const d = mix(d0, d1, k); const fw = new V3(Math.sin(c.root.rotation.y), 0, Math.cos(c.root.rotation.y)); const rt = new V3(fw.z, 0, -fw.x);
  cam(x, [h.x + fw.x * d + rt.x * side * d, h.y + dy, h.z + fw.z * d + rt.z * side * d], [h.x, h.y + dy * 0.6 - 0.12 * c.root.scale.x, h.z], fov); }
function punch(x, at, amt = 0.2, dur = 0.25) { const k = eo(seg(x.L, at, at + dur)); if (k > 0) x.camera.fov *= 1 - amt * k; }
const PURPLE = new THREE.Color('#b05aff'), WHITE = new THREE.Color('#fff6e8');
function tint(x, c, k) { x.purpleTint(c, cl(k)); }
let WHYL = null;
function stageLit(x, k, I = 46) { if (WHYL) WHYL.intensity = 0; const s = x.S.stage; x.out.scene = s; x.post.vig.value = 0.9; x.S.stageSpot.color.copy(WHITE).lerp(PURPLE, cl(k)); x.S.stageSpot.intensity = I; return s; }
function bonnieOn(x, s, px, py, pz, ry = 0) { const b = put(x, 'bonnie', s, px, py, pz, ry); return b; }
// strum: right hand bobs on the guitar
function strum(c, t, k = 1) { c.head.rotation.x += 0.06 * Math.sin(t * 6.5) * k; c.torso.rotation.z += 0.03 * Math.sin(t * 3.2) * k; c.armR.piv.rotation.z += -0.06 * k; c.armL.piv.rotation.z += 0.06 * k; } // groove to the music (no prop)
function hall(x, purple = 1) { const s = x.S.office1; x.out.scene = s; x.post.vig.value = 0.95; x.S.west.forEach((l, i) => { l.color.copy(WHITE).lerp(PURPLE, purple); l.intensity = 6 * flicker(x.t, i * 2); }); x.S.office1Lamp.intensity = 2; return s; }

// 0.00 "Qual é a verdadeira cor do Bonnie em FNAF?" — lights slam on the stage; Bonnie strums; his colour shimmers purple<->blue on "cor"; "?" on "FNAF"
at(0.00, 'intro', x => {
  const L = x.L; const on = L > 0.12; const s = stageLit(x, 1 - 0.5 * Math.sin(Math.max(0, L - 0.94) * 5) ** 2 * (L > 0.94 && L < 1.84 ? 1 : 0), on ? 46 : 0); staticIn(x, 0.12);
  const b = bonnieOn(x, s, 0, 0.65, -1.5, 0); alive(b, x.t, 1); strum(b, x.t, 1); lookAtCam(x, b, mix(0.2, 0.8, eio(seg(L, 0.9, 1.4))));
  tint(x, b, 1 - 0.85 * Math.sin(Math.max(0, L - 0.94) * Math.PI / 0.9) ** 2 * (L > 0.94 && L < 1.84 ? 1 : 0)); b.head.rotation.z += 0.22 * springE(seg(L, 1.84, 2.2));
  closeOn(x, b, 5.2, 3.0, 0.2, -0.3, 46, eo); punch(x, 1.3, 0.15); pop(x, x.FX.q1, s, headTop(b, 0.95), 1.84, 0.7); hand(x, 1.1);
});
// 2.58 "Durante anos a internet debateu sobre esse tema" — two kids arguing: one points, the other shakes his head
at(2.58, 'debate', x => {
  const s = x.S.party; x.out.scene = s; const L = x.L; x.post.vig.value = 0.8; const a = put(x, 'kid0', s, -0.7, 0, 0, 0.9); const b = put(x, 'kid1', s, 0.7, 0, 0, -0.9); alive(a, x.t, 1); alive(b, x.t, 1, 2);
  gesture(a, 'point', L, 1.1, 2.2, 1, { face: false }); a.setFace({ mouth: L > 1.1 && L < 2.1 ? 0.6 * Math.abs(Math.sin(x.t * 14)) : 0 }); headShake(b, L, 1.6, 2, 0.3); gesture(b, 'shrug', L, 2.1, 9);
  camMove(x, [0.2, 1.2, 3.2], [0, 0.95, 0], [0.1, 1.15, 2.6], [0, 0.95, 0], eo, 46); hand(x);
});
// 5.00 "e a maioria chamou ele de coelho roxo" — Bonnie in purple light, punch on "roxo"
at(5.00, 'purple', x => {
  const s = stageLit(x, 1, 46); const L = x.L; const b = bonnieOn(x, s, 0, 0.65, -1.5, 0); alive(b, x.t, 1); strum(b, x.t, 0.6); lookAtCam(x, b, 0.7); tint(x, b, 1);
  closeOn(x, b, 3.6, 2.6, -0.2, -0.25, 44, eio); punch(x, 1.6, 0.18);
});
// 7.20 "Nos corredores" — Bonnie standing in the purple-lit West Hall
at(7.20, 'hall', x => {
  const s = hall(x, 1); const L = x.L; const b = bonnieOn(x, s, -9.5, 0, 0, Math.PI / 2); alive(b, x.t, 0.6); tint(x, b, 1); lookAtCam(x, b, 0.4);
  camMove(x, [-4.0, 1.6, 0.25], [-9.5, 1.7, 0], [-5.2, 1.65, 0.15], [-9.5, 1.8, 0], eo, 46); staticIn(x, 0.12);
});
// 8.10 "nas câmeras" — CCTV view of the hall
at(8.10, 'cam', x => {
  const s = hall(x, 1); const L = x.L; const b = bonnieOn(x, s, -8.0, 0, 0, Math.PI / 2 + 0.3); alive(b, x.t, 0.5); tint(x, b, 1); lookAtCam(x, b, 0.8);
  cam(x, [-5.6, 2.8, 0.75], [-8.0, 1.6, 0], 52); x.camera.rotateZ(0.02 * Math.sin(L * 3)); x.post.cctv.value = 1; x.out.ui = 'CAM 1B'; staticIn(x, 0.2);
});
// 8.68 "e até no jumpscare" — short, controlled jumpscare on "jumpscare"
at(8.68, 'scare', x => {
  const s = x.S.office1; x.out.scene = s; const L = x.L; x.S.office1Lamp.intensity = 4; cam(x, [0, 1.6, 0.6], [0, 1.6, -2], 50); const b = bonnieOn(x, s, 0, 0, -1, 0); tint(x, b, 1);
  if (L < 0.38) { b.root.visible = false; x.post.vig.value = 1.0; } else jumpscare(x, b, L - 0.38, { from: 2.4, to: 1.25, headY: 1.95, js: 0.8, statAt: 0.85 });
});
// 9.64 "a cor dele parece totalmente roxa" — close, slow tilt, punch on "roxa"
at(9.64, 'totally', x => {
  const s = stageLit(x, 1, 40); const L = x.L; const b = bonnieOn(x, s, 0, 0.65, -1.5, 0.15); alive(b, x.t, 1); lookAtCam(x, b, 0.8); tint(x, b, 1); b.head.rotation.z += 0.2 * springE(seg(L, 0.4, 0.8));
  closeOn(x, b, 2.7, 2.2, 0.25, -0.2, 42); punch(x, 1.22, 0.16);
});
// 11.60 "Mas existem duas pistas escondidas bem na nossa cara" — the guard thinks; two fingers up on "duas"; "!" on "derrubam"
at(11.60, 'clues', x => {
  const s = x.S.office1; x.out.scene = s; const L = x.L; x.post.vig.value = 0.8; x.S.office1Lamp.intensity = 10; x.S.westDoorLight.color.set('#ffe2c0'); x.S.westDoorLight.position.set(0.3, 2.6, 1.9); x.S.westDoorLight.intensity = 9; const g = put(x, 'guard', s, 0, 0, 0.4, 0); alive(g, x.t, 1); lookAtCam(x, g, 0.75);
  gesture(g, 'think', L, 0.0, 0.9); const r = gestW(L, 0.48, 2.6); g.armR.piv.rotation.x += -1.6 * r; g.armR.piv.rotation.z += -0.35 * r; startle(g, L, 2.74, 0.6);
  closeOn(x, g, 2.6, 2.1, 0.2, -0.15, 46); pop(x, x.FX.ex1, s, headTop(g, 0.5), 2.74, 0.6); punch(x, 2.74, 0.12);
});
// 15.88 "A primeira está pendurada na parede do seu escritório no primeiro jogo" — slow pan across the FNAF 1 office to the poster
at(15.88, 'office', x => {
  const s = x.S.office1; x.out.scene = s; const L = x.L; x.post.vig.value = 0.9; x.S.office1Lamp.intensity = 7 + 3 * flicker(x.t, 1); x.S.posterLight.color.set('#ff5a7a'); x.S.posterLight.intensity = 5;
  const k = eio(x.u); cam(x, [mix(-1.6, 0.0, k), 1.75, mix(1.6, 0.8, k)], [mix(-2.4, 0.55, k), mix(1.6, 2.0, k), -2.46], 50); hand(x);
});
// 19.46 "Olha bem o poster escrito Celebrate" — push in on the poster, punch on "Celebrate"
at(19.46, 'poster', x => {
  const s = x.S.office1; x.out.scene = s; const L = x.L; x.post.vig.value = 0.9; x.S.office1Lamp.intensity = 2.5; x.S.posterLight.color.set('#ff5a7a'); x.S.posterLight.intensity = 3;
  const k = eio(x.u); cam(x, [0.55, 2.0, mix(-0.6, -1.15, k)], [0.55, 2.0, -2.46], 44); punch(x, 1.2, 0.15);
});
// 21.62 "Debaixo daquela luz branca, o Bonnie não tem nada de roxo" — the white lamp clicks on on "branca"; push onto Bonnie in the poster
at(21.62, 'white', x => {
  const s = x.S.office1; x.out.scene = s; const L = x.L; x.post.vig.value = 0.85; x.S.office1Lamp.intensity = 2; const w = sm(seg(L, 0.78, 0.92));
  x.S.posterLight.color.set('#ff5a7a').lerp(WHITE, w); x.S.posterLight.intensity = mix(3, 16, w); x.S.poster.userData.setBlue(sm(seg(L, 0.9, 1.6))); if (L > 0.8 && L < 0.86) x.post.flash.value = 0.04;
  const k = eio(seg(L, 0.6, 2.6)); cam(x, [mix(0.55, 0.22, k), mix(2.0, 1.95, k), mix(-1.15, -1.8, k)], [mix(0.55, 0.22, k), mix(2.0, 1.95, k), -2.46], 44); punch(x, 2.54, 0.12);
});
// 24.76 "E a segunda pista é ainda mais óbvia, repara nas outras versões dele" — Bonnie (blue, white light) looks around
at(24.76, 'second', x => {
  const s = stageLit(x, 0, 46); const L = x.L; const b = bonnieOn(x, s, 0, 0.65, -1.5, 0); alive(b, x.t, 1); b.head.rotation.y += 0.6 * Math.sin(seg(L, 0.3, 3.0) * Math.PI * 2); strum(b, x.t, 0.4);
  closeOn(x, b, 3.4, 2.8, 0.2, -0.3, 46); hand(x);
});
// 28.40 / 29.92 / 31.26 — Toy, Withered, Glamrock: each one enters on his name with a blue sparkle, punch on "azul"
function version(x, name, azul) { const s = stageLit(x, 0, 46); const L = x.L; const c = put(x, name, s, 0, 0.65, -1.5, 0); const k = back(seg(L, 0.0, 0.35));
  c.root.position.y = 0.65 - 0.5 * (1 - eo(seg(L, 0, 0.3))); alive(c, x.t, 1); lookAtCam(x, c, 0.7); if (c.jaw) c.jaw.rotation.x = 0.12 + 0.2 * Math.abs(Math.sin(x.t * 6));
  sparkles(x, s, hp(c, 0).toArray(), 0.7, 8, 0.9 * sm(seg(L, azul - 0.1, azul + 0.2))); closeOn(x, c, 3.6, 2.9, 0.15, -0.3, 46); punch(x, azul, 0.15); staticIn(x, 0.1); }
at(28.40, 'toy', x => version(x, 'toybonnie', 0.90));
at(29.92, 'withered', x => version(x, 'wbonnie', 0.64));
at(31.26, 'glam', x => version(x, 'gbonnie', 1.08));
// 32.94 "Por que todos eles seriam azuis se o original fosse roxo?" — the three blues in a row turn to the purple Bonnie; "?" on "roxo"
at(32.94, 'why', x => {
  const s = x.S.stage; x.out.scene = s; const L = x.L; x.post.vig.value = 0.9; x.S.stageSpot.color.copy(WHITE); x.S.stageSpot.intensity = 46;
  const ns = ['toybonnie', 'wbonnie', 'gbonnie'], xs = [-3.0, -1.5, 0]; ns.forEach((n, i) => { const c = put(x, n, s, xs[i], 0.65, -1.6, 0.25); alive(c, x.t, 1, i); });
  const b = bonnieOn(x, s, 1.6, 0.65, -1.2, -0.6); alive(b, x.t, 1); tint(x, b, 1); const look = eio(seg(L, 1.0, 1.4)); ns.forEach(n => { const c = x.C[n]; lookAt(c, hp(b, 0), look); });
  if (!WHYL) { WHYL = new THREE.PointLight('#b05aff', 0, 3.5, 1.5); WHYL.position.set(1.6, 2.6, -0.2); s.add(WHYL); } WHYL.intensity = 18;
  const k = eio(x.u); cam(x, [mix(-2.4, 0.6, k), 1.9, 3.8], [mix(-1.9, 0.6, k), 1.65, -1.4], 52); pop(x, x.FX.q1, s, headTop(b, 0.95), 2.44, 0.7);
});
// 36.08 "O próprio criador do jogo, Scott Cawthon" — Scott walks on stage under the spotlight
at(36.08, 'scott', x => {
  const s = stageLit(x, 0, 40); const L = x.L; const sc = put(x, 'scott', s, 0, 0.65, 0, 0); walkPath(sc, L, -0.3, 1.3, [1.1, -1.5], [0.0, -1.1], { stride: 0.75 }); if (L > 1.15) sc.root.rotation.y = mix(sc.root.rotation.y, 0, eio(seg(L, 1.15, 1.6)));
  sc.root.position.y = 0.65; lookAtCam(x, sc, 0.6 * eio(seg(L, 1.0, 1.4))); gesture(sc, 'chest', L, 1.32, 9, 0.9, { face: false }); sc.setFace({ mouth: L > 1.3 ? 0.5 * Math.abs(Math.sin(x.t * 13)) : 0 });
  camMove(x, [0.6, 1.9, 2.6], [0.4, 1.6, -1.3], [0.35, 1.9, 1.8], [0.1, 1.65, -1.1], eo, 46); punch(x, 1.32, 0.12);
});
// 38.24 "teve que vir a público acabar com essa confusão e confirmar a verdade" — calming hands, then a firm nod on "verdade"
at(38.24, 'confirm', x => {
  const s = stageLit(x, 0, 40); const L = x.L; const sc = put(x, 'scott', s, 0.0, 0.65, -1.1, 0); alive(sc, x.t, 1); lookAtCam(x, sc, 0.85);
  const r = gestW(L, 0.2, 2.4); sc.armR.piv.rotation.x += -1.25 * r; sc.armL.piv.rotation.x += -1.25 * r; sc.armR.piv.rotation.z += 0.18 * r; sc.armL.piv.rotation.z -= 0.18 * r; sc.armR.piv.rotation.x += 0.15 * Math.sin(x.t * 9) * cl(r); sc.armL.piv.rotation.x += 0.15 * Math.sin(x.t * 9 + 1) * cl(r);
  nod(sc, L, 2.9, 2, 0.22); sc.setFace({ mouth: 0.45 * Math.abs(Math.sin(x.t * 12)) }); closeOn(x, sc, 2.8, 2.2, -0.2, -0.15, 46); punch(x, 2.9, 0.12);
});
// 41.86 "O Bonnie original sempre foi azul" — THE reveal: purple light fades out, white light in, Bonnie turns blue smoothly; he looks at himself
at(41.86, 'blue', x => {
  const L = x.L; const k = 1 - eio(seg(L, 0.78, 1.42)); const s = stageLit(x, k, 46 + 10 * (1 - k)); const b = bonnieOn(x, s, 0, 0.65, -1.5, 0); alive(b, x.t, 1); tint(x, b, k);
  const look = gestW(L, 1.5, 9); b.head.rotation.x += 0.45 * look; handsOut(b, look); if (L < 1.5) lookAtCam(x, b, 0.8); sparkles(x, s, hp(b, 0).toArray(), 0.8, 8, 0.8 * sm(seg(L, 1.3, 1.5)) * (1 - sm(seg(L, 1.7, 1.9))));
  closeOn(x, b, 3.2, 2.4, 0.15, -0.3, 44, eio); punch(x, 1.42, 0.18); if (L > 1.4 && L < 1.46) x.post.flash.value = 0.04;
});
// 43.76 "você só enxergava ele em roxo por causa de um truque de iluminação da pizzaria" — he walks down the hall: purple under each lamp, blue between them
at(43.76, 'trick', x => {
  const s = hall(x, 1); const L = x.L; const b = bonnieOn(x, s, 0, 0, 0, 0); walkPath(b, L, 0, 3.4, [-13.0, 0], [-6.6, 0], { stride: 0.95, linear: true }); b.root.rotation.y = Math.PI / 2;
  const d = Math.min(...x.S.west.map(l => Math.abs(l.position.x - b.root.position.x))); tint(x, b, 1 - sm(seg(d, 0.5, 2.0)) * 0.95);
  camMove(x, [-3.6, 1.5, 0.45], [-10, 1.6, 0], [-4.4, 1.55, 0.35], [-8, 1.6, 0], (u) => u, 48); hand(x);
});
// 47.34 "que mistura luzes roxas com as sombras do corredor e engana o seu cérebro" — close: a purple lamp swings over him; glitch on "cérebro"
at(47.34, 'brain', x => {
  const s = hall(x, 1); const L = x.L; const b = bonnieOn(x, s, -8.0, 0, 0, Math.PI / 2 + 0.25); alive(b, x.t, 1); lookAtCam(x, b, 0.75);
  const sw = Math.sin(x.t * 2.2); x.S.west.forEach(l => { l.intensity = 2; }); const pl = x.S.westDoorLight; pl.color.copy(PURPLE); pl.position.set(-8.0 + 1.4 * sw, 2.6, 0.3); pl.intensity = 10;
  tint(x, b, 0.45 + 0.55 * (0.5 + 0.5 * Math.cos(x.t * 2.2))); closeOn(x, b, 2.8, 2.2, 0.2, -0.2, 44); if (L > 2.94) { x.post.chroma.value = 0.9 * (1 - seg(L, 2.94, 3.4)); } punch(x, 2.94, 0.16);
});
// 50.96 "Você também achava que ele era roxo?" — blue Bonnie tilts his head to us, "?"
at(50.96, 'askyou', x => {
  const s = stageLit(x, 0, 46); const L = x.L; const b = bonnieOn(x, s, 0, 0.65, -1.5, 0); alive(b, x.t, 1); lookAtCam(x, b, 0.85); b.head.rotation.z += 0.24 * springE(seg(L, 0.5, 0.9)); strum(b, x.t, 0.5);
  closeOn(x, b, 2.9, 2.4, 0.2, -0.2, 44); pop(x, x.FX.q1, s, headTop(b, 0.95), 1.24, 0.7);
});
// 52.76 "Comenta aí e me segue pra mais mistérios" — Bonnie and Toy Bonnie wave with their OUTER arms, well apart
at(52.76, 'outro', x => {
  const s = stageLit(x, 0, 50); const L = x.L; const b = bonnieOn(x, s, -0.95, 0.65, -1.5, 0.2); alive(b, x.t, 1); lookAtCam(x, b, 0.6); const t2 = put(x, 'toybonnie', s, 0.95, 0.65, -1.5, -0.2); alive(t2, x.t, 1, 2); lookAtCam(x, t2, 0.6);
  wave(b, 'R', L, 0.05, 9, x.t); wave(t2, 'L', L, 0.15, 9, x.t + 0.4); camMove(x, [0, 2.1, 4.0], [0, 1.85, -1.5], [0, 2.1, 3.4], [0, 1.9, -1.5], eo, 50);
});

export const SHOTS = shots;
export const DURATION = 54.76;
