// Shot list for "O Glamrock Bonnie REALMENTE existe?". Pure function of time.
import * as THREE from 'three';
import { rng } from './sets.js';
import { gesture, holdPose, wave, laugh, startle, shiver as shiv, nod, headShake, alive, walkPath, gestW, springE } from './act.js';

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
const hp = (c, up = 4) => tp(c, 'head', [0, up, 0]);
function closeOn(x, c, d0, d1, side = 0.25, dy = -0.15, fov = 42, e = eo) { const h = hp(c, 3); const k = e(x.u); const d = mix(d0, d1, k); const fw = new V3(Math.sin(c.root.rotation.y), 0, Math.cos(c.root.rotation.y)); const rt = new V3(fw.z, 0, -fw.x);
  cam(x, [h.x + fw.x * d + rt.x * side * d, h.y + dy, h.z + fw.z * d + rt.z * side * d], [h.x, h.y + dy * 0.6 - 0.12 * c.root.scale.x, h.z], fov); }
function punch(x, at, amt = 0.2, dur = 0.25) { const k = eo(seg(x.L, at, at + dur)); if (k > 0) x.camera.fov *= 1 - amt * k; }
// Mimic helpers
const mface = m => { m.root.updateMatrixWorld(true); return m.mimicHead.localToWorld(new V3(0, 0.6 * x_U, 0)); };
function mimicOn(m, glow = 1, pupil = 1, chatter = 0, t = 0) { m.setEyeGlow(null, glow); m.setPupil(pupil); if (chatter > 0) m.jaw.rotation.x = chatter * (0.18 + 0.18 * Math.abs(Math.sin(t * 22))); }
function faceCam(x, m, d0, d1, side = 0.15, dy = -0.1, fov = 42, e = eo) { const f = mface(m); const k = e(x.u); const d = mix(d0, d1, k); const a = m.root.rotation.y; cam(x, [f.x + Math.sin(a) * d + Math.cos(a) * side * d, f.y + dy, f.z + Math.cos(a) * d - Math.sin(a) * side * d], [f.x, f.y - 0.1, f.z], fov); }
function ruin(x) { const s = x.S.atrium; x.out.scene = s; x.S.ruinMode('atrium', x.t); x.post.vig.value = 1.0; return s; }
function waves(x, s, p, sp = 1, col = '#ffd0c0') { x.FX.waves.forEach((w, i) => { const r = ((x.t * 0.9 * sp + i / 4) % 1); s.add(w); w.position.copy(p); w.quaternion.copy(x.camera.quaternion); w.scale.setScalar(0.12 + 0.45 * r); w.material.opacity = 0.4 * (1 - r); w.material.color.set(col); }); }
// iceberg
const iceRad = y => y > 0 ? 1.2 + Math.max(0, 7 - y) * 0.75 : 6 + (-y) * 0.32;
let DEEP = null;
function ice(x, opts = {}) { const s = x.S.ice; x.out.scene = s; const cp = x.camera.position; const y = cp.y; const under = y < 0; const d = cl(-y / 56);
  if (!under) { s.background.set('#060f1e'); s.fog.color.set('#0a1830'); s.fog.density = 0.006; } else { const c = new THREE.Color('#0d4e78').lerp(new THREE.Color('#010205'), Math.pow(d, 0.6)); s.background.copy(c); s.fog.color.copy(c); s.fog.density = mix(0.028, 0.06, d); }
  x.S.iceUnder.position.set(cp.x * 0.5, y + 4, cp.z * 0.5 - 6); x.S.iceUnder.intensity = under ? mix(60, 10, d) : 0; x.S.iceMoon.intensity = under ? mix(1.4, 0, cl(-y / 14)) : 2.4;
  x.S.iceBubbles.forEach(b => { const u = b.userData; const yy = y - 5 + ((x.t * u.sp * 1.3 * (opts.rush || 1) + u.ph * 10) % 10); b.position.set(cp.x + u.x * 1.6, yy, cp.z - 5 + u.z * 1.4); b.scale.setScalar(0.45); b.visible = under && yy < -0.25; });
  if (under) x.post.tint.value.set(mix(0.85, 0.7, d), mix(1.0, 0.82, d), mix(1.12, 1.05, d));
  if (opts.red) { if (!DEEP) DEEP = new x.THREE.PointLight('#ff2020', 0, 60, 1.2); s.add(DEEP); DEEP.position.set(0, -66, -14); DEEP.intensity = opts.red * 900; }
  x.post.vig.value = under ? 0.95 : 0.6; return s; }
function iceCam(x, y, a, off = 9, lookDy = 0, fov = 44) { const R = iceRad(y) + off; cam(x, [Math.sin(a) * R, y, -14 + Math.cos(a) * R * 0.85], [0, y + lookDy, -14], fov); }
function title(x, i, a0, dist = 6.5) { x.S.iceTitles.forEach(t => t.visible = false); if (x.L < a0) return; const tg = x.S.iceTitles[i]; tg.visible = true; const k = back(seg(x.L, a0, a0 + 0.45));
  const f = new V3(); x.camera.getWorldDirection(f); tg.position.copy(x.camera.position).addScaledVector(f, dist); tg.quaternion.copy(x.camera.quaternion); tg.rotateY(0.06 * Math.sin(x.L * 1.3)); tg.scale.setScalar(0.5 * k); }

// ======================================================================================
// O QUE SIGNIFICA O NOME "LEFTY" — FNAF 6. Times = real word timestamps (faster-whisper).
// ======================================================================================
function lefty(x, s, px, py, pz, ry) { const c = put(x, 'lefty', s, px, py, pz, ry); return c; }
// mic-hold pose (left arm forward so the mic stands upright, ball on top)
function micHold(c, k = 1) { c.armL.piv.rotation.x += -1.05 * k; c.armL.piv.rotation.z += 0.12 * k; }
function stageSet(x) { const s = x.S.stage; x.out.scene = s; x.S.stageSpot.intensity = 46; x.post.vig.value = 0.9; return s; }
function wordUI(x, i) { const c = x.C.lefty; const p = proj(x, new V3(...headTop(c, 0.95))); x.out.ui = { type: 'word', txt: ['ATRAIR', 'PRENDER', 'FUNDIR', 'TRANSPORTAR', 'EXTRAIR'][i], k: back(seg(x.L, 0, 0.22)), a: Math.min(1, x.L / 0.08), u: Math.min(0.72, Math.max(0.28, p[0])), v: Math.max(0.09, Math.min(0.4, p[1])) }; }
function bigLetter(x, s, i, p, a0, glow = 1) { const L = x.L; if (L < a0) return; const g = x.BIGL[i]; s.add(g); const k = back(seg(L, a0, a0 + 0.3)); g.position.copy(p); g.position.y += 0.04 * Math.sin(L * 5); g.quaternion.copy(x.camera.quaternion); g.scale.setScalar(Math.max(0.001, k)); g.userData.mat.color.setRGB(0.85 + 0.15 * glow, 0.9 + 0.1 * glow, 1); }
function bpOn(x, s, p, ry = 0, lit = 0) { const b = x.BP; s.add(b); b.position.copy(p); b.rotation.set(-0.15, ry, 0); b.userData.letters.forEach((l, i) => l.userData.mat.color.set(i < lit ? '#ffffff' : '#6f85b8')); return b; }

// 0.00 "O nome Lefty não tem nada a ver com ele ser canhoto" — Lefty on the dark stage, shakes his head on "não", lifts the mic on "canhoto"
at(0.00, 'intro', x => {
  const s = stageSet(x); const L = x.L; const c = lefty(x, s, 0, 0.65, -1.5, 0); alive(c, x.t, 1); micHold(c, 0.6 + 0.4 * gestW(L, 1.98, 9)); lookAtCam(x, c, 0.7); headShake(c, L, 0.62, 2, 0.28);
  c.setFace({ lidL: 0.15, lidR: 0 }); staticIn(x, 0.15); closeOn(x, c, 3.8, 3.0, 0.2, -0.3, 46, eio); punch(x, 0.32, 0.15);
});
// 2.50 "você foi enganado pela própria aparência do robô" — face close, "!" on "enganado", tilt down the body on "aparência"
at(2.50, 'fooled', x => {
  const s = stageSet(x); const L = x.L; const c = lefty(x, s, 0, 0.65, -1.5, 0); alive(c, x.t, 1); micHold(c); lookAtCam(x, c, 0.8); c.setFace({ lidR: 0, lidL: 0.1 }); c.jaw.rotation.x = 0.15 * Math.max(0, Math.sin(L * 6)) * (L < 1.3 ? 1 : 0);
  const h = hp(c, 3); const k = eio(seg(L, 1.25, 2.2)); cam(x, [h.x + 0.35, h.y - 0.2 - 0.9 * k, h.z + mix(2.1, 2.7, k)], [h.x, h.y - 0.25 - 0.9 * k, h.z], 44); pop(x, x.FX.ex1, s, headTop(c, 0.55), 0.42, 0.6); punch(x, 0.4, 0.14);
});
// 4.86 "Quando você olha para aquele urso preto em FNAF 6" — slow orbit around him on stage, punch on "urso preto"
at(4.86, 'orbit', x => {
  const s = stageSet(x); const L = x.L; const c = lefty(x, s, 0, 0.65, -1.5, 0); alive(c, x.t, 1); micHold(c); lookAtCam(x, c, 0.5); c.setFace({ lidR: 0 });
  const a = -0.6 + 1.0 * eio(x.u); const h = hp(c, 0); cam(x, [Math.sin(a) * 3.4, h.y - 0.5, -1.5 + Math.cos(a) * 3.4], [0, h.y - 0.7, -1.5], 46); punch(x, 0.96, 0.15);
});
// 7.16 "tudo parece fazer sentido na hora" — the night guard thinks and nods
at(7.16, 'sense', x => {
  const s = x.S.office; x.out.scene = s; const L = x.L; x.post.vig.value = 0.85; x.S.officeLamp.intensity = 6; const g = put(x, 'guard', s, 0, 0, 0.6, Math.PI); alive(g, x.t, 1); lookAtCam(x, g, 0.6);
  gesture(g, 'think', L, 0.1, 9); nod(g, L, 0.96, 2, 0.2); const h = hp(g, 3); camMove(x, [h.x - 0.3, h.y, h.z - 3.0], [h.x, h.y - 0.3, h.z], [h.x - 0.2, h.y + 0.05, h.z - 2.5], [h.x, h.y - 0.25, h.z], eo, 46); hand(x);
});
// 9.30 "Ele segura o microfone com a mão esquerda" — close on the left hand raising the mic, punch on "esquerda"
at(9.30, 'mic', x => {
  const s = stageSet(x); const L = x.L; const c = lefty(x, s, 0, 0.65, -1.5, 0.2); alive(c, x.t, 1); micHold(c, 0.55 + 0.45 * springE(seg(L, 0.5, 0.95))); lookAt(c, c.handL.getWorldPosition(new V3()), 0.5); c.setFace({ lidR: 0 });
  c.root.updateMatrixWorld(true); const hpos = c.handL.getWorldPosition(new V3()); camMove(x, [hpos.x + 1.4, hpos.y + 0.2, hpos.z + 1.9], [hpos.x, hpos.y + 0.15, hpos.z], [hpos.x + 1.0, hpos.y + 0.15, hpos.z + 1.4], [hpos.x, hpos.y + 0.2, hpos.z], eo, 44); punch(x, 1.4, 0.15);
});
// 11.32 "tem o olho esquerdo totalmente apagado" — face close: the right eye glows, the left eye shuts dark on "apagado"
at(11.32, 'eye', x => {
  const s = stageSet(x); x.S.stageSpot.intensity = 30; const L = x.L; const c = lefty(x, s, 0, 0.65, -1.5, 0); alive(c, x.t, 0.6); micHold(c); lookAtCam(x, c, 0.85);
  const k = eo(seg(L, 1.1, 1.3)); c.setFace({ lidR: 0, lidL: 0, slope: 0 }); const h = hp(c, 4); cam(x, [h.x + 0.1, h.y, h.z + mix(1.9, 1.5, eio(x.u))], [h.x + 0.05, h.y + 0.02, h.z], 40); punch(x, 1.14, 0.12);
});
// 13.06 "e não custa quase nada no catálogo da loja" — the FNAF 6 catalog on a real monitor; the price drops to $5 on "nada"
at(13.06, 'catalog', x => {
  const s = x.S.screenroom; x.out.scene = s; const L = x.L; x.out.screen = 'catalog'; x.S.screenLamp.intensity = 2.5; x.S.neonMat.opacity = 0; x.S.neonLight.intensity = 0; x.post.vig.value = 0.8; x.S.crtLight.intensity = 3;
  x._catL = L - 0.1; const p = x.S.crtScreenPos; const k = eio(x.u); cam(x, [p.x + mix(0.6, 0.15, k), p.y + 0.12, p.z + mix(2.2, 1.35, k)], [p.x + 0.05 * k, p.y, p.z], 46); punch(x, 0.76, 0.12);
});
// 15.56 "A maioria dos jogadores achou que era só um apelido simples" — the guard shrugs, "?" on "apelido"
at(15.56, 'nickname', x => {
  const s = x.S.office; x.out.scene = s; const L = x.L; x.post.vig.value = 0.85; x.S.officeLamp.intensity = 6; const g = put(x, 'guard', s, 0, 0, 0.6, Math.PI); alive(g, x.t, 1); lookAtCam(x, g, 0.75);
  gesture(g, 'shrug', L, 1.8, 9); headShake(g, L, 2.6, 2, 0.2); const h = hp(g, 3); camMove(x, [h.x + 0.35, h.y, h.z - 3.2], [h.x, h.y - 0.35, h.z], [h.x + 0.2, h.y + 0.05, h.z - 2.6], [h.x, h.y - 0.3, h.z], eo, 46); pop(x, x.FX.q1, s, headTop(g, 0.5), 1.8, 0.6);
});
// 19.88 "Mas se você procurar os arquivos secretos escondidos do jogo" — dark workshop; the lamp clicks on on "secretos", revealing the blueprint
at(19.88, 'files', x => {
  const s = shop(x); const L = x.L; const on = L > 1.44; x.S.shopLamp.intensity = on ? 22 : 2; x.post.tint.value.set(0.85, 0.9, 1.1); const b = bpOn(x, s, new V3(-1.5, 1.62, -3.05), 0, 0);
  const k = eio(x.u); cam(x, [-1.5 + mix(1.0, 0.35, k), 1.7, -3.05 + mix(3.2, 1.9, k)], [-1.5, 1.6, -3.05], 46); if (L > 1.44 && L < 1.5) x.post.flash.value = 0.04; hand(x);
});
// 22.80 "vai descobrir um projeto criado pelo próprio Henry" — Henry at the blueprint, turns to us on "Henry"
at(22.80, 'henry', x => {
  const s = shop(x); const L = x.L; x.S.shopLamp.intensity = 22; bpOn(x, s, new V3(-1.5, 1.62, -3.05), 0, 0); const h = put(x, 'henry', s, -0.35, 0, -2.45, -0.9); alive(h, x.t, 1);
  const turn = eio(seg(L, 1.9, 2.4)); h.root.rotation.y = mix(-0.9, -0.2, turn); lookAt(h, turn > 0.5 ? x.camera.position : new V3(-1.5, 1.6, -3.05), 0.75); gesture(h, 'point', L, 0.2, 1.9, 0.9, { face: false });
  camMove(x, [0.9, 1.7, 0.6], [-0.9, 1.55, -2.8], [0.6, 1.7, 0.1], [-0.7, 1.6, -2.7], eo, 50); punch(x, 2.14, 0.12);
});
// 25.46 "Ali fica claro que Lefty não é um apelido" — push into the blueprint, the title lights up on "Lefty"
at(25.46, 'proof', x => {
  const s = shop(x); const L = x.L; x.S.shopLamp.intensity = 18; const lit = L > 0.92 ? 5 : 0; const b = bpOn(x, s, new V3(-1.5, 1.62, -3.05), 0, lit);
  const k = eio(x.u); cam(x, [-1.5 + mix(0.3, 0.1, k), 1.68, -3.05 + mix(1.6, 1.05, k)], [-1.5 - 0.15 * k, 1.66 + 0.1 * k, -3.05], 44); punch(x, 0.92, 0.12);
});
// 27.72 "cada letra do nome dele forma uma sigla que significa" — L, E, F, T, E light up one by one
at(27.72, 'letters', x => {
  const s = shop(x); const L = x.L; x.S.shopLamp.intensity = 16; const lit = Math.min(5, Math.floor(seg(L, 0.2, 2.3) * 5.99)); bpOn(x, s, new V3(-1.5, 1.62, -3.05), 0, lit);
  cam(x, [-1.5 - 0.62 + 0.64 * eio(seg(L, 0.2, 2.4)), 1.98, -3.05 + 0.75], [-1.5 - 0.62 + 0.64 * eio(seg(L, 0.2, 2.4)), 1.98, -3.05], 40);
});
// 30.34 "atrair" — L: Lefty sings into the mic, sound waves; the Puppet drifts towards him (kept well apart)
at(30.34, 'lure', x => {
  const s = voidMood(x, '#a05aff', 44); const L = x.L; const c = lefty(x, s, -0.6, 0, 0, 0.35); alive(c, x.t, 1); micHold(c); c.jaw.rotation.x = 0.25 * Math.abs(Math.sin(x.t * 9)); c.setFace({ lidR: 0, lidL: 0.4 });
  const p = put(x, 'puppet', s, 0, 0, 0, -1.2); walkPath(p, L, -0.3, 0.84, [1.55, 0.4], [1.0, 0.25], { stride: 1.4, face: false }); p.root.rotation.y = -1.25; p.head.rotation.x = 0.2;
  waves(x, s, c.handL.getWorldPosition(new V3()).add(new V3(0.25, 0.3, 0.1)), 1.5, '#d8b0ff'); cam(x, [0.25, 1.95, 5.9 - 0.5 * x.u], [0.25, 1.55, 0], 48); wordUI(x, 0);
});
// 31.18 "prender" — E: arms close in, a cage-like hug
at(31.18, 'trap', x => {
  const s = voidMood(x, '#a05aff', 44); const L = x.L; const c = lefty(x, s, 0, 0, 0, 0); alive(c, x.t, 1); lookAtCam(x, c, 0.7); gesture(c, 'reach', L, 0, 9, 1, { face: false }); c.setFace({ lidR: 0, lidL: 0.5, slope: 1 });
  closeOn(x, c, 3.9, 3.4, 0.15, -0.3, 46); wordUI(x, 1);
});
// 31.82 "fundir" — F: the Puppet's soul spirals into his chest, shrinking, with a flash in the eye
at(31.82, 'fuse', x => {
  const s = voidMood(x, '#a05aff', 44); const L = x.L; const c = lefty(x, s, 0, 0, 0, 0); alive(c, x.t, 1); micHold(c, 0.5); c.setFace({ lidR: 0, lidL: 0.2 * (1 - sm(seg(L, 0.4, 0.5))) }); const ch = tp(c, 'torso', [0, 6, 2]);
  const k = eio(seg(L, 0, 0.45)); const a = k * 9; orbAt(x, 0, s, new V3(ch.x + Math.cos(a) * 0.9 * (1 - k), ch.y + 0.6 * (1 - k), ch.z + 0.3 + Math.sin(a) * 0.9 * (1 - k)), 0.32 * (1 - sm(seg(L, 0.38, 0.5))));
  sparkles(x, s, ch.toArray(), 0.4, 6, 0.6 * sm(seg(L, 0.35, 0.5))); if (L > 0.44 && L < 0.5) x.post.flash.value = 0.04; closeOn(x, c, 3.5, 3.1, -0.15, -0.35, 46); wordUI(x, 2);
});
// 32.40 "transportar" — T: he walks, carrying her inside
at(32.40, 'carry', x => {
  const s = x.S.hall; x.out.scene = s; const L = x.L; x.post.vig.value = 0.9; x.S.hallLamps.forEach((l, i) => { l.intensity = 8 * flicker(x.t, i); l.color.set('#ffd8c0'); });
  const c = lefty(x, s, 0, 0, 0, 0); walkPath(c, L, -0.4, 1.2, [0.1, -7.0], [0.1, -4.6], { stride: 1.0 }); micHold(c, 0.6); c.setFace({ lidR: 0 });
  camMove(x, [0.7, 1.4, -1.6], [0, 1.6, -6], [0.5, 1.45, -2.0], [0, 1.65, -5.5], (u) => u, 50); wordUI(x, 3);
});
// 33.22 "extrair" — E: a light is pulled out of his chest
at(33.22, 'extract', x => {
  const s = voidMood(x, '#3ad8ff', 44); const L = x.L; const c = lefty(x, s, 0, 0, 0, 0); alive(c, x.t, 1); lookAtCam(x, c, 0.6); c.setFace({ lidR: 0 }); const ch = tp(c, 'torso', [0, 6, 2]);
  const k = eo(seg(L, 0.05, 0.6)); orbAt(x, 0, s, new V3(ch.x, ch.y + 0.9 * k, ch.z + 0.6 * k), 0.12 + 0.25 * k); gesture(c, 'agony', L, 0.05, 9, 0.6, { face: false });
  closeOn(x, c, 3.8, 3.3, 0, -0.3, 46); wordUI(x, 4); x.post.tint.value.set(0.9, 1.0, 1.1);
});
// 33.98 "O que faz total sentido pro seu único objetivo" — Henry, determined, nods
at(33.98, 'goal', x => {
  const s = shop(x); const L = x.L; x.S.shopLamp.intensity = 20; bpOn(x, s, new V3(-1.5, 1.62, -3.05), 0, 5); const h = put(x, 'henry', s, -0.35, 0, -2.4, -0.2); alive(h, x.t, 1); lookAtCam(x, h, 0.8);
  nod(h, L, 0.65, 2, 0.18); h.setFace({ lid: 0.3, slope: -0.5 }); closeOn(x, h, 2.6, 2.1, 0.25, -0.15, 46);
});
// 36.54 "capturar a Puppet sem destruir" — Lefty in the dark, the Puppet's glow inside his chest
at(36.54, 'capture', x => {
  const s = voidMood(x, '#a05aff', 34); const L = x.L; const c = lefty(x, s, 0, 0, 0, 0); alive(c, x.t, 0.8); micHold(c); lookAtCam(x, c, 0.75); c.setFace({ lidR: 0, lidL: 0.3, slope: 1 }); x.setXray && 0;
  const ch = tp(c, 'torso', [0, 6, 2.6]); orbAt(x, 0, s, ch, 0.16 * (1 + 0.2 * Math.sin(x.t * 6))); c.setStripes(0.6, 0.5); closeOn(x, c, 4.0, 3.2, 0.2, -0.4, 46, eio); punch(x, 0.6, 0.12);
});
// 38.36 "para finalmente libertar a alma da própria filha" — the burning maze: Charlotte's soul rises free from Lefty on "alma"
at(38.36, 'free', x => {
  const s = maze(x); const L = x.L; const c = lefty(x, s, 0.1, 0, -4.6, 0); alive(c, x.t, 0.6); c.setFace({ lid: 0.6, slope: -1 }); fireAt(x, s, 0.1, -5.6, 4.0, 1.0, 3.0, 9); x.bloom.strength = 0.15;
  const gch = put(x, 'charlotteGhost', s, 0.1, 0, -4.2, 0); const k = eio(seg(L, 1.25, 2.2)); gch.root.position.y = 0.4 + 2.0 * k; gch.ghostMat.opacity = 0.75 * sm(seg(L, 1.25, 1.55)); gch.root.scale.setScalar(gch.baseScale * mix(0.4, 1, k)); gch.idle(x.t, 1); gch.head.rotation.x = -0.25 * k;
  if (gch.ghostMat.opacity < 0.02) gch.root.visible = false;
  camMove(x, [0.4, 1.6, -1.2], [0.1, 1.8, -4.6], [0.25, 2.0, -1.6], [0.1, 2.6, -4.4], eio, 50); x.post.tint.value.set(1.08, 0.95, 0.88);
});
// 40.62 "no incêndio final" — flames rise around him
at(40.62, 'fire', x => {
  const s = maze(x); const L = x.L; const c = lefty(x, s, 0.1, 0, -4.6, 0); alive(c, x.t, 0.4); c.setFace({ lid: 1 }); const k = sm(seg(L, 0.05, 0.5)); fireAt(x, s, 0.1, -4.9, 3.4, 1.8, 3.0 * (0.4 + 0.6 * k), 12); x.bloom.strength = 0.15;
  x.FX.fire.userData.fl.forEach(m => { m.visible = Math.hypot(m.position.x - 0.1, m.position.z + 4.6) > 0.8; }); camMove(x, [0.6, 1.5, -1.0], [0.1, 1.6, -4.6], [0.35, 1.6, -1.8], [0.1, 1.8, -4.6], eo, 50); x.post.tint.value.set(1.12, 0.92, 0.82);
});
// 41.70 "E se você olhar bem de perto para os braços do robô no jogo" — slow push onto his right arm, punch on "braços"
at(41.70, 'arms', x => {
  const s = stageSet(x); x.S.stageSpot.intensity = 52; const L = x.L; const c = lefty(x, s, 0, 0.65, -1.5, -0.35); alive(c, x.t, 0.7); micHold(c); c.setFace({ lidR: 0 }); c.setStripes(0.3);
  c.root.updateMatrixWorld(true); const a = c.armR.piv.localToWorld(new V3(0, -1.0 / 16, 0)); const k = eio(x.u); const cp = rootPt(c, mix(-1.2, -1.3, k), mix(2.0, 1.4, k), mix(3.4, 2.4, k)); cam(x, cp.toArray(), [mix(hp(c, 0).x, a.x, k), mix(hp(c, 0).y - 0.7, a.y, k), a.z], 46); punch(x, 1.62, 0.15);
});
// 44.36 "dá até para ver as listras da Puppet presa lá dentro" — the stripes show and glow in the seam on "listras"
at(44.36, 'stripes', x => {
  const s = stageSet(x); x.S.stageSpot.intensity = 52; const L = x.L; const c = lefty(x, s, 0, 0.65, -1.5, -0.35); alive(c, x.t, 0.5); micHold(c); c.setFace({ lidR: 0 });
  const k = springE(seg(L, 0.84, 1.2)); c.setStripes(0.3 + 0.9 * k, k); if (L > 1.8) { c.armR.piv.rotation.z += 0.03 * Math.sin(x.t * 30) * (1 - seg(L, 1.8, 2.3)); }
  c.root.updateMatrixWorld(true); const a = c.armR.piv.localToWorld(new V3(0, -1.0 / 16, 0)); const cp = rootPt(c, -1.35, 1.35, mix(2.3, 2.0, eio(x.u))); cam(x, cp.toArray(), a.toArray(), 42); punch(x, 0.84, 0.15);
});
// 47.34 "Você já tinha reparado nisso?" — he leans his head towards us, "?"
at(47.34, 'noticed', x => {
  const s = stageSet(x); const L = x.L; const c = lefty(x, s, 0, 0.65, -1.5, 0); alive(c, x.t, 1); micHold(c); lookAtCam(x, c, 0.85); c.head.rotation.z += 0.24 * springE(seg(L, 0.5, 0.9)); c.setFace({ lidR: 0 });
  closeOn(x, c, 2.9, 2.4, 0.15, -0.2, 44); pop(x, x.FX.q1, s, headTop(c, 0.55), 0.98, 0.6);
});
// 48.82 "Comenta aí e me segue para mais mistérios" — Lefty and the Puppet wave with their OUTER arms, well apart
at(48.82, 'outro', x => {
  const s = stageSet(x); const L = x.L; const c = lefty(x, s, -0.85, 0.65, -1.5, 0.2); alive(c, x.t, 1); lookAtCam(x, c, 0.6); c.setFace({ lidR: 0 }); micHold(c, 0.8);
  const p = put(x, 'puppet', s, 0.95, 0.65, -1.5, -0.2); alive(p, x.t, 1, 2); lookAtCam(x, p, 0.6); wave(c, 'R', L, 0.05, 9, x.t); wave(p, 'L', L, 0.15, 9, x.t + 0.4);
  camMove(x, [0, 2.0, 3.9], [0, 1.75, -1.5], [0, 2.0, 3.3], [0, 1.8, -1.5], eo, 50);
});

export const SHOTS = shots;
export const DURATION = 51.40;
