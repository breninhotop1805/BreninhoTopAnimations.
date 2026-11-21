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

// ---------------- 0 – 1.38  "Você já viu o William Afton" — William smirks at us, slow push + punch on "William"
at(0.00, 'william', x => {
  const s = voidMood(x, '#ff4a3a', 40); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0.35); alive(w, x.t, 1); lookAtCam(x, w, 0.75); holdPose(w, 'evil', x.t, 0.9); w.noBlink = true; staticIn(x, 0.2);
  closeOn(x, w, 2.7, 2.1, 0.25, -0.2, 44); punch(x, 0.72, 0.16);
});
// "morrer quatro vezes" — four quick deaths (springlock, FNaF 3 fire, FNaF 6 fire, collapse), static between cuts
at(1.38, 'death1', x => { // springlocks snap inside the Spring Bonnie suit
  const s = x.S.diner; x.out.scene = s; const L = x.L; x.post.vig.value = 1; x.S.dinerLamps.forEach(l => l.intensity = 2); x.S.dinerSpot.intensity = 20; staticIn(x, 0.08);
  const b = put(x, 'springbonnie', s, 0, 0, -2.6, 0); alive(b, x.t, 0.5); gesture(b, 'agony', L, 0.05, 9, 1, { face: false }); shiv(b, x.t, 1.5); b.setFace({ lid: 0.6, slope: -1 });
  x.post.tint.value.set(1.2, 0.85, 0.85); closeOn(x, b, 3.4, 2.9, 0.2, -0.2, 46); shake(x, 0.3);
});
at(1.70, 'death2', x => { const s = fright(x, 0.2); const L = x.L; const c = put(x, 'spring', s, 0, 0, -6.2, 0); alive(c, x.t, 1); staticIn(x, 0.08);
  fireAt(x, s, 0, -7.0, 3.0, 1.2, 2.8, 8); x.bloom.strength = 0.15; gesture(c, 'agony', L, 0.0, 9); shiv(c, x.t, 1); closeOn(x, c, 3.6, 3.1, -0.2, -0.3, 48); x.post.tint.value.set(1.1, 0.94, 0.82); });
at(2.01, 'death3', x => { const s = maze(x); const L = x.L; const c = put(x, 'scrap', s, 0.1, 0, -4.8, 0); alive(c, x.t, 1); staticIn(x, 0.08);
  fireAt(x, s, 0.1, -5.7, 4.0, 1.2, 3.0, 9); x.bloom.strength = 0.15; gesture(c, 'cower', L, 0, 9); shiv(c, x.t, 1); closeOn(x, c, 3.4, 2.9, 0.2, -0.3, 48); });
at(2.34, 'death4', x => { const s = maze(x); const L = x.L; const c = put(x, 'scrap', s, 0, 0, -4.4, 0); const k = eo(seg(L, 0, 0.3)); staticIn(x, 0.08); c.setFace({ lid: 0.6 + 0.4 * k, slope: -1 });
  c.root.position.y = -0.5 * k; c.torso.rotation.x = -0.4 * k; c.legR.piv.rotation.x = -1.5 * k; c.legL.piv.rotation.x = -1.4 * k; c.head.rotation.x = 0.45 * k; c.head.rotation.z = 0.3 * k; fireAt(x, s, 0, -5.6, 4.0, 1.0, 3.0, 9); x.bloom.strength = 0.15;
  camMove(x, [0.4, 1.6, -1.4], [0, 1.4, -4.4], [0.3, 1.3, -1.9], [0, 1.1, -4.4], eo, 48); });
// "e ele sempre volta" — Springtrap rises in the dark corridor, eyes light up on "volta"
at(2.68, 'returns', x => {
  const s = fright(x, 0.6); const L = x.L; const c = put(x, 'spring', s, 0, 0, -6.3, 0); const k = eio(seg(L, 0.05, 0.75)); alive(c, x.t, k);
  c.root.position.y = -0.5 * (1 - k); c.torso.rotation.x = 0.6 * (1 - k); c.head.rotation.x = 0.5 * (1 - k); lookAtCam(x, c, 0.6 * k); c.setFace({ lid: 0.4 * eo(seg(L, 0.85, 1.05)), slope: 1 });
  camMove(x, [0.3, 1.0, -3.0], [0, 1.4, -6.3], [0.2, 1.6, -3.6], [0, 1.9, -6.3], eio, 48); punch(x, 0.88, 0.18); hand(x);
});
// "Mas e se, em alguma dessas vezes" — slow push on Springtrap, flicker
at(3.88, 'whatif', x => {
  const s = fright(x, 0.8); const L = x.L; const c = put(x, 'spring', s, 0, 0, -6.3, 0); alive(c, x.t, 1); lookAtCam(x, c, 0.8); c.head.rotation.z += 0.15 * springE(seg(L, 0.3, 0.8)); c.setFace({ lid: 0.3, slope: 1 });
  closeOn(x, c, 3.2, 2.5, 0.2, -0.25, 44, eio); hand(x);
});
// "quem voltou não era ele?" — glitch: for a split second the face is the Mimic's; "?" pops on "ele"
at(5.33, 'notHim', x => {
  const L = x.L; const flick = (L > 0.34 && L < 0.5) || (L > 0.62 && L < 0.7);
  if (!flick) { const s = fright(x, 0.8); const c = put(x, 'spring', s, 0, 0, -6.3, 0); alive(c, x.t, 1); lookAtCam(x, c, 0.85); c.head.rotation.z += 0.2 * springE(seg(L, 0.75, 1.1)); closeOn(x, c, 2.5, 2.2, 0.2, -0.25, 44); pop(x, x.FX.q1, s, headTop(c, 0.62), 0.77, 0.7); }
  else { const s = voidMood(x, '#ff6a2a', 22); const m = put(x, 'mimic', s, 0, 0, 0, 0); m.idle(x.t, 1); mimicOn(m, 1, 0.7); lookAtCam(x, m, 0.6); faceCam(x, m, 1.6, 1.5, 0.1, 0, 42); }
  if (flick) { x.post.chroma.value = 1; x.post.stat.value = 0.25; }
});
// "Existe um robô em FNAF chamado" — the Mimic in the dark, camera tilts up from the claws to the head
at(6.53, 'reveal', x => {
  const s = voidMood(x, '#ff7a3a', 26); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); alive(m, x.t, 0.8); mimicOn(m, 0.25 + 0.15 * Math.sin(x.t * 3), 1); m.head.rotation.x = 0.2;
  const k = eio(x.u); const f = mface(m); cam(x, [0.5, mix(0.8, f.y - 0.3, k), mix(2.4, 3.2, k)], [0, mix(1.0, f.y - 0.2, k), 0], 46); hand(x);
});
// "O Mímico" — eyes ignite, pupils snap, teeth chatter; punch-in
at(8.61, 'mimic', x => {
  const s = voidMood(x, '#ff7a3a', 30); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); alive(m, x.t, 1); const k = eo(seg(L, 0.15, 0.3)); mimicOn(m, 0.3 + 0.9 * k, mix(1, 0.6, k), L > 0.2 ? 1 : 0, x.t); lookAtCam(x, m, 0.8);
  faceCam(x, m, 2.2, 1.7, 0.1, -0.05, 44); punch(x, 0.19, 0.18); if (L > 0.18 && L < 0.24) x.post.flash.value = 0.04;
});
// "Ele foi construído por um inventor" — Edwin's workshop: Edwin works on the inactive Mimic (side by side, apart)
at(9.15, 'workshop', x => {
  const s = shop(x); const L = x.L; x.S.shopLamp.intensity = 28; const m = put(x, 'mimic', s, -1.25, 0, -2.4, 0.5); m.idle(x.t, 0.15); mimicOn(m, 0.08, 1); m.head.rotation.x = 0.35; m.setFace && 0;
  const e = put(x, 'edwin', s, 0.35, 0, -1.8, -0.9); alive(e, x.t, 1); const r = gestW(L, 0.2, 9); e.armR.piv.rotation.x += -1.3 * r + 0.15 * Math.sin(x.t * 9) * cl(r); e.armL.piv.rotation.x += -1.1 * r; e.torso.rotation.x += 0.15 * r; lookAt(e, mface(m), 0.6);
  camMove(x, [-0.1, 1.7, 1.6], [-0.45, 1.5, -2.2], [-0.25, 1.7, 1.1], [-0.5, 1.55, -2.3], eo, 50); hand(x);
});
// "Edwin Murray" — he turns to us, hand on chest (introducing himself)
at(11.50, 'edwin', x => {
  const s = shop(x); const L = x.L; x.S.shopLamp.intensity = 28; const e = put(x, 'edwin', s, 0.3, 0, -1.6, -0.4); alive(e, x.t, 1); const turn = eio(seg(L, 0, 0.35)); e.root.rotation.y = mix(-0.9, -0.15, turn); lookAtCam(x, e, 0.5 + 0.4 * turn);
  gesture(e, 'chest', L, 0.15, 9); e.setFace({ mouth: L > 0.25 && L < 0.7 ? 0.6 * Math.abs(Math.sin(L * 16)) : 0 }); closeOn(x, e, 2.4, 2.0, 0.2, -0.2, 46); punch(x, 0.28, 0.12);
});
// "para fazer uma coisa só" — finger up on "só"
at(12.31, 'onething', x => {
  const s = shop(x); const L = x.L; x.S.shopLamp.intensity = 28; const e = put(x, 'edwin', s, 0.3, 0, -1.6, -0.15); alive(e, x.t, 1); lookAtCam(x, e, 0.85);
  const r = gestW(L, 0.85, 9); e.armL.piv.rotation.x += -2.3 * r; e.armL.piv.rotation.z += 0.15 * r; e.head.rotation.z += 0.12 * r; e.setFace({ lid: 0.15 * cl(r), mouth: L < 0.9 ? 0.5 * Math.abs(Math.sin(L * 15)) : 0 });
  closeOn(x, e, 3.3, 2.8, -0.2, -0.05, 46); punch(x, 1.03, 0.14);
});
// "observar os humanos" — close on the Mimic's eyes: pupils follow and focus
at(13.57, 'observe', x => {
  const s = shop(x); const L = x.L; x.S.shopLamp.intensity = 18; const m = put(x, 'mimic', s, -1.25, 0, -2.4, 0.5); alive(m, x.t, 0.6); mimicOn(m, 0.9, mix(1.2, 0.55, eo(seg(L, 0.5, 0.8))));
  m.head.rotation.y += 0.25 * Math.sin(L * 2.5); m.head.rotation.z += 0.18 * springE(seg(L, 0.6, 1.0)); faceCam(x, m, 1.9, 1.5, 0.15, -0.05, 42);
});
// "copiar tudo" — Edwin raises an arm, the Mimic copies a beat later (side by side, far apart)
at(14.91, 'copy', x => {
  const s = shop(x); const L = x.L; x.S.shopLamp.intensity = 28; const e = put(x, 'edwin', s, 0.75, 0, -1.7, -0.35); const m = put(x, 'mimic', s, -0.95, 0, -2.2, 0.35); alive(e, x.t, 1); alive(m, x.t, 1, 2); mimicOn(m, 1, 0.8);
  wave(e, 'L', L, 0.0, 9, x.t); wave(m, 'R', L, 0.12, 9, x.t - 0.12); lookAt(m, hp(e, 2), 0.6); lookAtCam(x, e, 0.6);
  camMove(x, [-0.1, 1.85, 2.0], [-0.1, 1.85, -2.0], [-0.1, 1.85, 1.6], [-0.1, 1.9, -2.0], eo, 52);
});
// "a voz" — Edwin talks, the Mimic's jaw moves in sync
at(15.41, 'voice', x => {
  const s = shop(x); const L = x.L; x.S.shopLamp.intensity = 28; const e = put(x, 'edwin', s, 0.75, 0, -1.7, -0.35); const m = put(x, 'mimic', s, -0.95, 0, -2.2, 0.35); alive(e, x.t, 1); alive(m, x.t, 1, 2);
  const talk = Math.abs(Math.sin(x.t * 14)); e.setFace({ mouth: 0.8 * talk }); mimicOn(m, 1, 0.8); m.jaw.rotation.x = 0.32 * talk; lookAt(e, mface(m), 0.6); lookAt(m, hp(e, 2), 0.6);
  waves(x, s, mface(m).add(new V3(0.15, -0.15, 0.3)), 1.4, '#ffb070'); camMove(x, [-0.4, 2.0, 1.2], [-0.5, 2.0, -2.0], [-0.55, 2.05, 0.7], [-0.7, 2.1, -2.1], eo, 46);
});
// "o andar" — both walk in step, side by side (well apart)
at(15.93, 'walk', x => {
  const s = x.S.hall; x.out.scene = s; const L = x.L; x.post.vig.value = 0.8; x.S.hallLamps.forEach(l => { l.intensity = 9; l.color.set('#ffe9c4'); });
  const e = put(x, 'edwin', s, 0, 0, 0, 0); const m = put(x, 'mimic', s, 0, 0, 0, 0); walkPath(e, L, -0.5, 2.0, [0.7, -7.5], [0.7, -4.2], { stride: 0.8 }); walkPath(m, L, -0.5, 2.0, [-0.8, -7.7], [-0.8, -4.4], { stride: 0.8 }); mimicOn(m, 1, 0.9);
  camMove(x, [0.0, 1.6, -0.9], [0, 1.5, -6], [0.0, 1.6, -1.2], [0, 1.5, -6], (u) => u, 50); hand(x);
});
// "e até o jeito de sorrir" — Edwin smiles, then the Mimic copies with a creepy teeth grin on "sorrir"
at(16.66, 'smile', x => {
  const s = shop(x); const L = x.L; x.S.shopLamp.intensity = 24; const m = put(x, 'mimic', s, -0.4, 0, -2.0, 0.15); alive(m, x.t, 1); lookAtCam(x, m, 0.8);
  const g = springE(seg(L, 0.95, 1.2)); mimicOn(m, 0.9 + 0.3 * g, mix(0.9, 0.55, g)); m.jaw.rotation.x = 0.3 * g; m.head.rotation.z += 0.25 * g; m.mimicHead.scale.setScalar(1 + 0.05 * g);
  faceCam(x, m, 2.0, 1.6, -0.1, -0.05, 42); punch(x, 0.95, 0.15);
});
// "Só que o criador dele passou por uma tragédia terrível" — Edwin alone, kneeling, head down; punch on "terrível"
at(17.86, 'tragedy', x => {
  const s = shop(x); const L = x.L; x.S.shopLamp.intensity = 10 * (0.85 + 0.15 * flicker(x.t, 2)); x.post.tint.value.set(0.8, 0.88, 1.1); const e = put(x, 'edwin', s, 0.2, 0, -1.6, 0.1); alive(e, x.t, 0.5);
  const k = eio(seg(L, 0.2, 1.1)); e.root.position.y = -0.38 * k; e.legR.piv.rotation.x = -1.4 * k; e.legL.piv.rotation.x = -0.3 * k; e.legL.piv.rotation.z = 0.05 * k; gesture(e, 'sad', L, 0.2, 9); e.noBlink = true; e.setFace({ lid: 0.7 * k, slope: -1 });
  shiv(e, x.t, 0.3 * k); closeOn(x, e, 2.8, 2.2, 0.3, -0.45, 46, eio); punch(x, 2.38, 0.12);
});
// "e o Mimic estava lá, observando" — Edwin in front, the Mimic in the dark behind him, eyes glowing; pupils narrow on "observando"
at(20.65, 'watching', x => {
  const s = shop(x); const L = x.L; x.S.shopLamp.intensity = 7; x.post.tint.value.set(0.82, 0.88, 1.08); const e = put(x, 'edwin', s, 0.5, 0, -1.3, 0.2); e.root.position.y = -0.38; e.legR.piv.rotation.x = -1.4; e.legL.piv.rotation.x = -0.3; holdPose(e, 'sad', x.t, 1); e.noBlink = true; e.setFace({ lid: 0.7, slope: -1 });
  const m = put(x, 'mimic', s, -1.3, 0, -2.7, 0.35); alive(m, x.t, 0.5); mimicOn(m, 0.6 + 0.4 * eo(seg(L, 0.2, 0.6)), mix(1.1, 0.5, eo(seg(L, 1.15, 1.4)))); lookAt(m, hp(e, 2), 0.8);
  camMove(x, [1.7, 1.85, 2.1], [-0.4, 1.15, -2.2], [1.4, 1.9, 1.6], [-0.6, 1.4, -2.5], eio, 50); hand(x);
});
// "Ele não aprendeu carinho" — reaches out gently, then pulls the claw back and shakes his head
at(22.43, 'nolove', x => {
  const s = voidMood(x, '#ff7a3a', 55); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); alive(m, x.t, 1); lookAtCam(x, m, 0.6); mimicOn(m, 0.9, 1);
  const r = gestW(L, 0.0, 0.75, 0.35, 0.3); m.armR.piv.rotation.x += -1.35 * r; m.armR.piv.rotation.z += 0.12 * r; headShake(m, L, 0.68, 2, 0.28);
  closeOn(x, m, 3.8, 3.2, 0.2, -0.45, 46);
});
// "aprendeu a dor" / "a raiva" / "e a ferir as pessoas" — one strong pose per beat, eyes shift colour
at(23.58, 'pain', x => {
  const s = voidMood(x, '#ff3a2a', 55); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); alive(m, x.t, 1); gesture(m, 'agony', L, 0.95, 9); shiv(m, x.t, gestW(L, 0.95, 9)); mimicOn(m, 0.9, mix(1, 1.5, gestW(L, 0.95, 9)), L > 1.0 ? 0.6 : 0, x.t);
  closeOn(x, m, 3.9, 3.3, -0.2, -0.4, 46); x.post.tint.value.set(1.12, 0.9, 0.9);
});
at(24.96, 'rage', x => {
  const s = voidMood(x, '#ff2020', 30); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); alive(m, x.t, 1); lookAtCam(x, m, 0.85); gesture(m, 'angry', L, 0.0, 9); mimicOn(m, 1.2, 0.45); m.jaw.rotation.x = 0.12;
  faceCam(x, m, 2.4, 1.9, 0.1, -0.1, 44); punch(x, 0.05, 0.15); x.post.tint.value.set(1.2, 0.85, 0.85);
});
at(25.66, 'hurt', x => {
  const s = voidMood(x, '#ff2020', 55); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); walkPath(m, L, 0, 0.8, [0, -0.6], [0, 0.0], { stride: 0.9 }); lookAtCam(x, m, 0.8);
  gesture(m, 'reach', L, 0.1, 9, 1.0); mimicOn(m, 1.2, 0.5, 1, x.t); closeOn(x, m, 4.6, 3.6, 0, -0.3, 46, eio); x.post.tint.value.set(1.2, 0.85, 0.85); if (L > 0.12) shake(x, 0.15);
});
// "Em FNAF Ruin, ele chega a imitar a voz" — Cassie in the ruined atrium with her flashlight, walking carefully
at(26.76, 'cassie', x => {
  const s = ruin(x); const L = x.L; const c = put(x, 'cassie', s, 0, 0, 0, 0); walkPath(c, L, 0, 2.6, [0.3, -2.6], [0.1, -0.4], { stride: 0.7 }); c.head.rotation.y += 0.3 * Math.sin(L * 1.6); c.setFace({ lid: 0.1, slope: -1 });
  const tgt = rootPt(c, 0, 0.9, 3.0); flashlight(x, c, s, tgt, 30, 1);
  camMove(x, [1.0, 1.4, 2.6], [0.1, 1.2, -1.0], [0.7, 1.35, 1.8], [0.1, 1.25, -0.4], eo, 50); hand(x);
});
// "de alguém que você confia" — she hears a familiar voice behind her: sound waves, she turns, "?"
at(29.37, 'hears', x => {
  const s = ruin(x); const L = x.L; const c = put(x, 'cassie', s, 0.1, 0, -0.4, 0); alive(c, x.t, 1); const turn = eio(seg(L, 0.2, 0.7)); c.root.rotation.y = mix(0, 0.9, turn); lookAt(c, new V3(2.0, 1.4, -0.6), 0.7 * turn);
  c.setFace({ mouth: 0.4 * turn, lid: 0 }); const tgt = rootPt(c, 0, 0.9, 3.0); flashlight(x, c, s, tgt, 30, 1); waves(x, s, new V3(2.2, 1.5, -0.8), 1.2, '#cfe8ff');
  closeOn(x, c, 2.8, 2.3, -0.35, -0.1, 46); pop(x, x.FX.q1, s, headTop(c, 0.45), 0.6, 0.55);
});
// "Perfeito, sem um único erro" — in the dark, the Mimic is the one talking: jaw moving, waves from the mouth
at(30.99, 'perfect', x => {
  const s = ruin(x); const L = x.L; const m = put(x, 'mimic', s, 2.2, 0, -1.2, -1.1); alive(m, x.t, 0.6); lookAt(m, new V3(0, 1.5, -0.5), 0.6); const talk = Math.abs(Math.sin(x.t * 13)); mimicOn(m, 0.7, 0.7); m.jaw.rotation.x = 0.3 * talk;
  waves(x, s, mface(m).add(new V3(-0.3, -0.2, 0.2)), 1.3, '#cfe8ff'); faceCam(x, m, 2.4, 2.0, 0.2, -0.1, 44);
});
// "só para te atrair" — slow beckoning claw
at(31.88, 'lure', x => {
  const s = ruin(x); const L = x.L; const m = put(x, 'mimic', s, 2.2, 0, -1.2, -1.1); alive(m, x.t, 0.6); lookAtCam(x, m, 0.7); mimicOn(m, 0.8, 0.6);
  const r = gestW(L, 0.0, 9); m.armL.piv.rotation.x += -1.25 * r; m.armL.piv.rotation.z += -0.08 * r; if (m.armL.fore) m.armL.fore.rotation.x += -0.5 * cl(r) * (0.5 + 0.5 * Math.sin(x.t * 6));
  closeOn(x, m, 4.0, 3.4, 0.15, -0.35, 46, eio);
});
// "Agora pensa" — the Mimic tilts his head, thinking
at(32.92, 'think', x => {
  const s = voidMood(x, '#ff7a3a', 55); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); alive(m, x.t, 1); lookAtCam(x, m, 0.75); gesture(m, 'think', L, 0.75, 9); m.head.rotation.z += 0.2 * springE(seg(L, 0.8, 1.2)); mimicOn(m, 1, 0.8);
  closeOn(x, m, 4.2, 3.4, 0.2, -0.35, 46, eio); punch(x, 0.81, 0.12);
});
// "uma máquina que aprende a ser qualquer pessoa" — walking through the dark pizzeria hall, glitch flickers
at(34.49, 'anyone', x => {
  const s = x.S.hall; x.out.scene = s; const L = x.L; x.post.vig.value = 0.9; x.S.hallLamps.forEach((l, i) => { l.intensity = 7 * flicker(x.t, i); l.color.set('#ffc8b0'); });
  const m = put(x, 'mimic', s, 0, 0, 0, 0); walkPath(m, L, -0.6, 2.8, [0.1, -8.0], [0.1, -4.4], { stride: 0.95 }); mimicOn(m, 1, 0.8); if (Math.sin(x.t * 7) > 0.92) glitchIn(x, m, 0.4);
  camMove(x, [0.6, 1.3, -1.0], [0, 1.6, -6.5], [0.45, 1.35, -1.4], [0, 1.7, -6.0], eio, 50); hand(x);
});
// "perdida numa pizzaria" — he stops and looks around, lost
at(36.76, 'lost', x => {
  const s = x.S.hall; x.out.scene = s; const L = x.L; x.post.vig.value = 0.9; x.S.hallLamps.forEach((l, i) => { l.intensity = 7 * flicker(x.t, i); l.color.set('#ffc8b0'); });
  const m = put(x, 'mimic', s, 0.1, 0, -4.4, 0); alive(m, x.t, 1); m.head.rotation.y += 0.6 * Math.sin(L * 2.6); m.torso.rotation.y += 0.15 * Math.sin(L * 2.6); mimicOn(m, 0.9, 1.1);
  const a = 0.5 - 1.0 * eio(x.u); const f = mface(m); cam(x, [f.x + Math.sin(a) * 3.2, f.y - 0.6, f.z + Math.cos(a) * 3.2], [f.x, f.y - 0.5, f.z], 46);
});
// "onde a lenda mais famosa é de um assassino" — Springtrap's legend in the Fright corridor, punch on "assassino"
at(38.05, 'legend', x => {
  const s = fright(x, 0.7); const L = x.L; const c = put(x, 'spring', s, 0, 0, -6.4, 0); alive(c, x.t, 1); twitch(c, x.t, 0.6); lookAtCam(x, c, 0.7 * eo(seg(L, 0.8, 1.3))); c.setFace({ lid: 0.45 * eo(seg(L, 1.85, 2.05)), slope: 1 });
  closeOn(x, c, 3.8, 2.8, 0.25, -0.25, 46, eio); punch(x, 1.91, 0.18); hand(x);
});
// "que se recusa a morrer" — head snaps up, jaw grin
at(40.47, 'refuses', x => {
  const s = fright(x, 0.5); const L = x.L; const c = put(x, 'spring', s, 0, 0, -6.4, 0); alive(c, x.t, 1); lookAtCam(x, c, 0.85); c.head.rotation.z += 0.22 * springE(seg(L, 0.95, 1.3)); c.setFace({ lid: 0.45, slope: 1, mouth: L > 1.0 ? 1 : 0 });
  closeOn(x, c, 2.8, 2.3, -0.25, -0.25, 44);
});
// "Quem você acha que ele escolheu copiar?" — the Mimic close-up, head tilt, "?" on "copiar"
at(41.80, 'who', x => {
  const s = voidMood(x, '#ff6a2a', 34); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); alive(m, x.t, 1); lookAtCam(x, m, 0.85); m.head.rotation.z += 0.25 * springE(seg(L, 1.5, 1.9)); mimicOn(m, 1, mix(1, 0.7, eo(seg(L, 1.5, 1.8))));
  faceCam(x, m, 2.6, 1.9, 0.15, -0.1, 44, eio); pop(x, x.FX.q1, s, mface(m).add(new V3(0.15, 0.32, 0)).toArray(), 1.71, 0.6);
});
// "Exatamente" — he laughs William's laugh: head back, teeth chattering, red light; punch-in
at(43.88, 'exactly', x => {
  const s = voidMood(x, '#ff2020', 34); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); alive(m, x.t, 1); const k = gestW(L, 0.0, 9); gesture(m, 'cheer', L, 0.0, 9, 0.6, { face: false });
  m.head.rotation.x += -0.3 * k; mimicOn(m, 1.3, 0.5, 1, x.t); m.torso.rotation.x += -0.04 * Math.abs(Math.sin(x.t * 15)) * cl(k);
  faceCam(x, m, 2.8, 2.2, 0, -0.2, 46); punch(x, 0.02, 0.18); x.post.tint.value.set(1.2, 0.85, 0.85);
});
// "e essa é só a camada cinco do iceberg" — dive along the voxel iceberg to layer 5, title pops on "cinco"
at(44.58, 'layer5', x => {
  const L = x.L; const k = eio(seg(L, 0, 2.2)); const y = mix(3.0, -42, k); const a = mix(0.7, 0.18, eo(seg(L, 0, 2.4)));
  iceCam(x, y, a, mix(26, 22, k), mix(-2, 0.4, k), 46); ice(x, { rush: 1 + 4 * (1 - seg(L, 1.6, 2.4)), red: k > 0.8 ? 0.5 : 0 }); if (L < 2.2) shake(x, 0.2 * Math.sin(Math.PI * k));
  if (Math.abs(y) < 1.2) { x.post.flash.value = 0.25 * (1 - Math.abs(y) / 1.2); } title(x, 4, 1.71, 6.5);
});
// "A última com certeza é a pior de todas" — down to the black bottom, red glow from below
at(47.15, 'last', x => {
  const L = x.L; const k = eio(seg(L, 0, 1.9)); const y = mix(-42, -56, k); iceCam(x, y, mix(0.18, -0.3, k), mix(22, 20, k), mix(0.4, -1.5, k), 46); ice(x, { rush: 2, red: 1 + 0.6 * Math.sin(x.t * 4) });
  title(x, 5, 0.3, 6.5); x.post.chroma.value = 0.3 * seg(L, 1.4, 2.0);
});
// "O vídeo completo tá aí no canal" — end card: the full video's thumbnail over the blurred deep, arrows above and below pointing down
at(49.19, 'endcard', x => {
  const L = x.L; iceCam(x, -56, -0.3, 20, -1.5, 46); ice(x, { rush: 1, red: 1 + 0.4 * Math.sin(x.t * 4) }); x.S.iceTitles.forEach(t => t.visible = false);
  x.post.blur.value = eo(seg(L, 0, 0.4)) * 0.9; x.post.vig.value = 1.0;
  x.out.ui = { type: 'endcard', k: mix(0.6, 1, back(seg(L, 0, 0.45))), a: eo(seg(L, 0, 0.2)), ka: back(seg(L, 0.25, 0.6)) };
});

export const SHOTS = shots;
export const DURATION = 52.40;
