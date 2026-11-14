// Shot list for "O BIZARRO ICEBERG DE FNAF" (16:9). One global timeline; parts are rendered by time range. Pure function of time.
import * as THREE from 'three';
import { rng, Rain, ICE_DEPTHS } from './sets.js';

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
const at = (t, name, fn) => shots.push({ t, name, fn: x => { cleanup(x); fn(x); } });
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
const tp = (c, part, v) => { c.root.updateMatrixWorld(true); return (c[part].isObject3D ? c[part] : c[part].piv).localToWorld(new V3(v[0] * x_U, v[1] * x_U, v[2] * x_U)); };

function glitchIn(x, c, amt = 1) { const j = Math.floor(x.t * 24); const r = rng(j * 7 + 3); if (r() < 0.45 * amt) { c.root.position.x += (r() - 0.5) * 0.18 * amt; c.root.position.y += (r() - 0.5) * 0.06 * amt; } x.post.chroma.value = Math.max(x.post.chroma.value, 0.7 * amt); if (r() < 0.25 * amt) x.post.stat.value = Math.max(x.post.stat.value, 0.3 * amt); }
function twitch(c, t, a = 1) { c.head.rotation.z += 0.25 * a * (Math.sin(t * 13) > 0.85 ? Math.sin(t * 61) : 0); c.head.rotation.x += 0.15 * a * (Math.sin(t * 9.1) > 0.9 ? 1 : 0); }
function agonyAt(x, s, center, rad = 1, inward = 0) { const g = x.FX.agony; s.add(g); g.position.copy(center);
  g.children.forEach(m => { const d = m.userData; const k = (x.t * d.sp * 0.5 + d.ph) % 1; const rr = d.rr * rad * (inward ? (1 - k) : 1); const a = d.a + x.t * d.sp * 1.4;
    m.position.set(Math.cos(a) * rr, d.y * rad * 0.8 * (inward ? (1 - k * 0.5) : 1) + 0.2 * Math.sin(x.t * 2 + d.ph * 6), Math.sin(a) * rr); m.scale.setScalar(d.sz * (1.2 - 0.6 * k)); m.rotation.set(x.t * d.sp, x.t, 0); }); }
function fireAt(x, s, cx, cz, w, d, h = 3.0, I = 12) { const g = x.FX.fire; s.add(g); const t = x.t;
  g.userData.fl.forEach(m => { const q = m.userData; const k = (t * q.sp + q.ph) % 1; m.position.set(cx + (q.u - 0.5) * w + 0.12 * Math.sin(t * 3 + q.ph * 9), k * h, cz + (q.v - 0.5) * d); m.scale.setScalar(q.sz * (1 - k) * 1.6 + 0.02); m.rotation.set(t + q.ph, t * 0.7, 0); });
  g.userData.sm.forEach(m => { const q = m.userData; const k = (t * q.sp + q.ph) % 1; m.position.set(cx + (q.u - 0.5) * w, h * 0.6 + k * 2.5, cz + (q.v - 0.5) * d); m.scale.setScalar(0.3 + k * 1.0); });
  g.userData.lights.forEach((l, i) => { l.position.set(cx + (i ? 0.6 : -0.6) * w * 0.3, 1.4, cz); l.intensity = I * (0.75 + 0.25 * Math.sin(t * 13 + i * 2) * Math.sin(t * 7.7 + i)); }); }

// ================================ ICEBERG: shared helpers ================================
const RAIN = new Rain(2200, 160);
const POL = ['#ff2030', '#2050ff'].map(c => new THREE.PointLight(c, 0, 14, 1.2));
const DRIPM = new THREE.MeshStandardMaterial({ color: '#7a0808', roughness: 0.15, metalness: 0.2, emissive: '#3a0000' });
const DRIPS = Array.from({ length: 12 }, () => new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), DRIPM));
const RIM = new THREE.SpotLight('#ffffff', 0, 16, 0.55, 0.6, 1.1);
const DEEP = new THREE.PointLight('#ff2a1a', 0, 60, 1.2);
const KEY = new THREE.SpotLight('#fff2e0', 0, 16, 0.5, 0.7, 1.2);
const EXTRA = [RAIN.group, ...POL, ...DRIPS, RIM, RIM.target, DEEP, KEY, KEY.target];
let SNAP = null;
function cleanup(x) {
  const S = x.S;
  if (!SNAP) { const L = []; for (const sc of [S.facade, S.hall, S.stage, S.party, S.office, S.office1, S.cove, S.diner, S.shop, S.void, S.mini, S.ice]) sc.traverse(o => { if (o.isLight) L.push([o, o.intensity, o.color.clone()]); });
    // no canvas-text banners anywhere (channel rule): hide every wide, short canvas-textured mesh (LET'S PARTY, CELEBRATE, KID'S COVE...)
    for (const sc of [S.facade, S.hall, S.stage, S.party, S.office, S.office1, S.cove, S.diner, S.shop, S.prize, S.screenroom, S.alley, S.bedroom]) sc && sc.traverse(o => { const im = o.isMesh && o.material && o.material.map && o.material.map.image; if (im && im.width >= 64 && im.height <= 24) o.visible = false; });
    SNAP = { voidFog: S.void.fog, lights: L, objs: [S.doorL, S.doorR, S.phone, S.phoneHandset, ...S.doorPanes].map(o => [o, o.position.clone(), o.rotation.clone()]) }; }
  for (const [l, i, c] of SNAP.lights) { l.intensity = i; l.color.copy(c); }
  for (const [o, p, r] of SNAP.objs) { o.position.copy(p); o.rotation.copy(r); }
  for (const o of EXTRA) o.removeFromParent(); S.void.fog = SNAP.voidFog; S.iceBubbles[0].material.opacity = 0.32;
  for (let i = 0; i < 5; i++) { x.C['gk' + i].ghostMat.opacity = 0.5; x.C['kid' + i].root.visible = true; }
  x.C.mimic.eyeLight.intensity = 1.2;
}
const U16 = 1 / 16;
// light rig: a key spot from the front-top and a rim from behind (silhouettes)
function keyOn(x, s, from, to, I = 30, ang = 0.5) { s.add(KEY, KEY.target); KEY.position.set(...from); KEY.target.position.set(...to); KEY.intensity = I; KEY.angle = ang; }
function rimOn(x, s, from, to, I = 40, col = '#ffffff') { s.add(RIM, RIM.target); RIM.position.set(...from); RIM.target.position.set(...to); RIM.intensity = I; RIM.color.set(col); }
function rain(x, s, cx, cz) { s.add(RAIN.group); RAIN.update(x.t, cx, cz, 9, 9, 7, 0, 0.12, x.camera.position); }
function facade(x, lights = 1) { const s = x.S.facade; x.out.scene = s; x.post.vig.value = 0.85; x.S.inLamps.forEach(l => l.intensity *= lights); x.S.inGlow.intensity *= lights; return s; }
function bolt(x, s, at, len = 0.25) { const k = x.L - at; if (k < 0 || k > len) return; const f = (k < 0.06 || (k > 0.12 && k < 0.16)) ? 1 : 0.25; x.S.facadeLightning.intensity = 6 * f; x.post.flash.value = 0.18 * f; }
function office(x) { const s = x.S.office; x.out.scene = s; x.post.vig.value = 0.9; return s; }
function office1(x, lamp = 1) { const s = x.S.office1; x.out.scene = s; x.S.office1Lamp.intensity = 9 * lamp; x.post.vig.value = 0.9; return s; }
function hall(x, fl = 1, col = '#ffe9c4') { const s = x.S.hall; x.out.scene = s; x.S.hallLamps.forEach((l, i) => { l.intensity = 9 * mix(1, flicker(x.t, i * 2), fl); l.color.set(col); }); x.post.vig.value = 0.9; return s; }
function stageS(x) { const s = x.S.stage; x.out.scene = s; x.post.vig.value = 0.8; return s; }
function band(x, look = 0) { const s = stageS(x); const b = put(x, 'bonnie', s, -1.4, 0.65, -1.7, 0.12), f = put(x, 'freddy', s, 0, 0.65, -1.9, 0), c = put(x, 'chica', s, 1.4, 0.65, -1.7, -0.12);
  [b, f, c].forEach((k, i) => { k.idle(x.t, 1, i * 1.3); if (look > 0) lookAtCam(x, k, look); }); return [s, f, b, c]; }
function voidS(x, spot = 40, rim = 0, rimCol = '#ff4a2a', fill = 2.5) { const s = x.S.void; x.out.scene = s; x.S.voidSpot.intensity = spot; x.S.voidFill.intensity = fill; x.S.voidRim.intensity = rim; x.S.voidRim.color.set(rimCol); x.post.vig.value = 1.0; return s; }
function slump(c, k = 1) { const s = c.root.scale.x; c.root.position.y -= (c.hipY - 2 * U16) * s; for (const [L, z] of [[c.legR, -0.18], [c.legL, 0.18]]) { L.piv.rotation.x = -1.5; L.piv.rotation.z = z; }
  c.armR.piv.rotation.set(-0.15, 0, -0.32); c.armL.piv.rotation.set(-0.15, 0, 0.32); c.head.rotation.x = 0.5 * k; c.head.rotation.z = 0.22 * k; c.torso.rotation.x = 0.12 * k; }
// blood/oil running down the face from head-local points [x, y] (pixels on the front face)
function drips(x, c, k, srcs, len = 4.5) { if (k <= 0) return;
  srcs.forEach(([ux, uy, z = 4.55], i) => { const d = DRIPS[i]; c.head.add(d); const kk = cl(k * (0.85 + 0.3 * Math.abs(Math.sin(i * 2.7)))); const l = 0.25 + len * kk;
    d.position.set(ux * U16, (uy - l / 2) * U16, (z + 0.13) * U16); d.scale.set(0.5 * U16, l * U16, 0.22 * U16); }); }
function ghostKid(x, i, scene, p, ry = 0, op = 0.5) { const g = put(x, 'gk' + i, scene, p[0], p[1], p[2], ry); g.ghostMat.opacity = op; g.idle(x.t, 1, i); return g; }
function vision(x, c, label, locked, id) { const top = proj(x, rootPt(c, 0, 2.08, 0)), bot = proj(x, rootPt(c, 0, -0.02, 0)); const h = bot[1] - top[1], w = h * 0.36 * 9 / 16 * 1.0;
  x.out.ui = { type: 'vision', box: [top[0] - w / 2, top[1] - 0.02, w, h + 0.04], label, locked, id }; x.post.tint.value.set(1.15, 0.82, 0.82); }
function phoneRing(x, on = 1) { const v = Math.sin(x.t * 55) * on; x.S.phone.rotation.z = 0.05 * v; x.S.phoneHandset.position.y = 0.16 + 0.014 * Math.abs(Math.sin(x.t * 70)) * on; x.S.phoneHandset.rotation.z = 0.06 * v; x.S.phoneLight.intensity = on ? 0.8 + 0.7 * Math.abs(Math.sin(x.t * 9)) : 0.2; }
function waves(x, s, p, sp = 1, col = '#ffd0c0') { x.FX.waves.forEach((w, i) => { const r = ((x.t * 0.9 * sp + i / 4) % 1); s.add(w); w.position.copy(p); w.quaternion.copy(x.camera.quaternion); w.scale.setScalar(0.2 + 0.75 * r); w.material.opacity = 0.6 * (1 - r); w.material.color.set(col); }); }

// ---------- ICEBERG ----------
const iceRad = y => y > 0 ? 1.2 + Math.max(0, 7 - y) * 0.75 : 6 + (-y) * 0.32;
function ice(x, opts = {}) {
  const s = x.S.ice; x.out.scene = s; const cp = x.camera.position; const y = cp.y; const under = y < 0; const d = cl(-y / 56);
  if (!under) { s.background.set('#060f1e'); s.fog.color.set('#0a1830'); s.fog.density = 0.006; }
  else { const c = new THREE.Color('#0d4e78').lerp(new THREE.Color('#010205'), Math.pow(d, 0.6)); s.background.copy(c); s.fog.color.copy(c); s.fog.density = mix(0.028, 0.06, d); }
  x.S.iceUnder.position.set(cp.x * 0.5, y + 4, cp.z * 0.5 - 6); x.S.iceUnder.intensity = under ? mix(60, 10, d) : 0;
  x.S.iceMoon.intensity = under ? mix(1.4, 0, cl(-y / 14)) : 2.4;
  const rush = opts.rush || 1;
  x.S.iceBubbles.forEach((b, i) => { const u = b.userData; const yy = y - 5 + ((x.t * u.sp * 1.3 * rush + u.ph * 10) % 10); b.position.set(cp.x + u.x * 1.6, yy, cp.z - 5 + u.z * 1.4); b.scale.setScalar(0.45); b.visible = under && yy < -0.25; });
  if (under) x.post.tint.value.set(mix(0.85, 0.7, d), mix(1.0, 0.82, d), mix(1.12, 1.05, d));
  if (opts.red) { s.add(DEEP); DEEP.position.set(0, -66, -14); DEEP.intensity = opts.red * 900; }
  x.post.vig.value = under ? 0.95 : 0.6; x.post.grain.value = 0.03; return s;
}
// camera standing off the iceberg flank at height y, angle a (0 = in front, +x to the right)
function iceCam(x, y, a, off = 9, lookDy = 0, fov = 44, side = 0) { const R = iceRad(y) + off; const cx = Math.sin(a) * R, cz = -14 + Math.cos(a) * R * 0.85; cam(x, [cx, y, cz], [side * Math.cos(a), y + lookDy, -14 - side * Math.sin(a)], fov); }
// voxel layer title, fixed in the world between the camera and the ice, popping in at local time a0
function title(x, i, a0, dist = 7) { if (x.L < a0) return; const tg = x.S.iceTitles[i]; tg.visible = true; const k = back(seg(x.L, a0, a0 + 0.45));
  const f = new V3(); x.camera.getWorldDirection(f); tg.position.copy(x.camera.position).addScaledVector(f, dist); tg.position.y += 0.05 * Math.sin(x.L * 2); tg.quaternion.copy(x.camera.quaternion); tg.rotateY(0.06 * Math.sin(x.L * 1.3)); tg.scale.setScalar(0.85 * k); }
// layer transition: water whoosh + camera dive from y0 to y1 + title (i = 0..5)
function dive(x, i, y0, y1, a0 = 1.55) {
  const L = x.L; const k = eio(seg(L, 0, 2.4)); const y = mix(y0, y1, k); const a = mix(i % 2 ? -0.7 : 0.7, i % 2 ? -0.18 : 0.18, eo(seg(L, 0, 2.6)));
  iceCam(x, y, a, mix(18, 13, k), mix(-2, 0.4, k), 46); if (L < 2.4) shake(x, 0.25 * Math.sin(Math.PI * k));
  ice(x, { rush: 1 + 4 * (1 - seg(L, 1.8, 2.6)), red: i >= 4 ? 1 : 0 });
  if (y0 > 0 && y1 < 0) { const c = Math.abs(y); if (c < 1.2) { x.post.flash.value = 0.35 * (1 - c / 1.2); x.post.blur.value = 0.8 * (1 - c / 1.2); } }
  title(x, i, a0, 6.5); x.post.chroma.value = 0.4 * (1 - seg(L, 0, 1.2));
}

// ================================ PART 1: INTRO ================================
// "Em 1985," — a stormy night, five kids run up to the pizzeria
at(0.00, 'y1985', x => {
  const s = facade(x); const L = x.L; bolt(x, s, 0.1, 0.3); bolt(x, s, 1.7, 0.2); x.S.logoLight.intensity = 2; x.S.facadeHemi.intensity = 1.4; keyOn(x, s, [2.5, 5, 10], [0, 0.8, 4], 40, 0.5);
  [[-1.1, 5.6], [-0.4, 6.4], [0.35, 5.9], [1.0, 6.7], [0.0, 7.3]].forEach(([px, pz], i) => { const k = put(x, 'kid' + i, s, 0, 0, 0, Math.PI + 0.1 * Math.sin(i)); walkTo(k, [px, 0, pz - 0.8], [px * 0.6, 0, pz - 4.0], seg(L, 0, 2.6), 0.42); k.walk(L * 2.6 + i * 0.3, 1); });
  camMove(x, [1.6, 1.5, 12.5], [0, 1.3, 1], [0.8, 1.5, 9.8], [0, 1.4, 1], eo, 36); hand(x, 0.8); rain(x, s, 0, 6); x.post.fade.value = 1 - seg(L, 0, 0.5);
});
// "cinco crianças entraram numa pizzaria" — from inside: the glass doors swing open and they come in
at(2.58, 'enter', x => {
  const s = facade(x); const L = x.L; const op = eo(seg(L, 0, 0.5)); x.S.doorPanes.forEach((p, i) => p.rotation.y = (i ? -1 : 1) * 1.35 * op);
  [[-0.45, 0], [0.4, 0.25], [0, 0.55], [-0.4, 0.85], [0.35, 1.1]].forEach(([px, d], i) => { const k = put(x, 'kid' + i, s, 0, 0, 0, Math.PI); walkTo(k, [px, 0, 1.6 + d * 2], [px * 1.8, 0, -1.4 + d * 0.9], eo(seg(L, 0.15 + d * 0.5, 2.3)), 0.42); k.head.rotation.y = 0.4 * Math.sin(x.t * 1.5 + i); });
  camMove(x, [1.3, 1.2, -6.2], [0, 1.0, 1.0], [0.7, 1.2, -5.4], [0, 1.0, 0.6], eo, 40); hand(x, 0.6); rain(x, s, 0, 4);
});
// "e nunca mais saíram" — doors shut, the lights inside die
at(4.88, 'never_left', x => {
  const s = facade(x); const L = x.L; const cls = eo(seg(L, 0, 0.35)); x.S.doorPanes.forEach((p, i) => p.rotation.y = (i ? -1 : 1) * 1.35 * (1 - cls));
  const off = L > 0.95 ? (L < 1.05 ? 0.4 : 0) : 1; x.S.inLamps.forEach(l => l.intensity = 10 * off); x.S.inGlow.intensity = 4 * off;
  [[-0.9, -3.0], [-0.2, -3.4], [0.5, -3.1], [1.1, -3.6], [0.2, -3.9]].forEach(([px, pz], i) => { const k = put(x, 'kid' + i, s, px, 0, pz, Math.PI); walkTo(k, [px, 0, pz], [px * 1.2, 0, pz - 2.6], seg(L, 0, 1.76), 0.42); });
  camMove(x, [0, 1.45, 6.2], [0, 1.4, 0], [0, 1.5, 4.2], [0, 1.45, -1], eio, 38); bolt(x, s, 1.0, 0.25); rain(x, s, 0, 4);
});
// "A polícia prendeu um suspeito," — the man in purple under the red/blue lights
at(6.64, 'police', x => {
  const s = facade(x, 0.15); const L = x.L; const p = put(x, 'purpleguy', s, 0.4, 0, 2.6, -0.1); p.idle(x.t, 0.5);
  p.armR.piv.rotation.set(0.55, 0, 0.32); p.armL.piv.rotation.set(0.55, 0, -0.32); p.head.rotation.x = -0.05; lookAtCam(x, p, eo(seg(L, 0.9, 1.6)) * 0.8); p.head.rotation.z = 0.12 * eo(seg(L, 1.2, 1.8));
  const ph = Math.floor(x.t * 5) % 2; POL.forEach((l, i) => { s.add(l); l.position.set(i ? 3.5 : -3.0, 1.6, 6.5); l.intensity = (i === ph ? 26 : 3); });
  camMove(x, [1.6, 1.55, 7.6], [0.4, 1.6, 2.6], [0.75, 1.7, 5.3], [0.4, 1.75, 2.6], eo, 34); hand(x, 0.6); rain(x, s, 0.4, 5); fillOn(x, p, 1.2, 1.8);
});
// "os corpos nunca foram encontrados" — the empty hall; little ghosts fade at the far end
at(8.76, 'no_bodies', x => {
  const s = hall(x, 0.8, '#d8e0ff'); const L = x.L;
  for (let i = 0; i < 5; i++) ghostKid(x, i, s, [(i - 2) * 0.55, 0, -10.5 - (i % 2) * 0.6], 0, 0.42 * (1 - sm(seg(L, 0.6, 1.8))));
  camMove(x, [0.35, 1.35, 2.0], [0, 1.15, -12], [0.1, 1.3, -2.0], [0, 1.1, -12], (u) => u, 38); hand(x, 0.6);
});
// "Meses depois," — the band on stage, business as usual
at(10.76, 'months', x => {
  const [s, f] = band(x); const L = x.L; const a = mix(-0.45, 0.35, eio(x.u)); cam(x, [Math.sin(a) * 6.2, 1.85, -1.8 + Math.cos(a) * 6.2], [0, 1.95, -1.8], 34);
});
// "os clientes começaram a reclamar de um cheiro estranho" — party room, kids holding their noses
at(12.30, 'smell', x => {
  const s = x.S.party; x.out.scene = s; const L = x.L; x.post.vig.value = 0.8;
  const a = put(x, 'kid1', s, 1.6, 0, -1.2, -0.5), b = put(x, 'kid2', s, 2.6, 0, -0.6, -0.9), h = put(x, 'henry', s, 3.3, 0, -1.8, -1.1);
  [a, b].forEach((k, i) => { k.idle(x.t, 1, i); const nose = rootPt(k, 0, 1.68, 0.3); aim(k, 'R', nose, eo(seg(L, 0.3 + i * 0.4, 0.8 + i * 0.4))); k.head.rotation.y += 0.25 * Math.sin(x.t * 7 + i) * seg(L, 0.8, 1.2); k.head.rotation.x = 0.1; });
  aim(b, 'L', rootPt(b, -0.6, 1.4, 0.6), eo(seg(L, 1.4, 1.8))); h.idle(x.t, 1); h.head.rotation.y = 0.5 * eo(seg(L, 0.8, 1.6)); aim(h, 'R', rootPt(h, -0.2, 1.75, 0.35), eo(seg(L, 1.6, 2.2)));
  camMove(x, [-0.6, 1.4, 3.2], [2.2, 1.1, -1.2], [0.1, 1.3, 2.3], [2.2, 1.1, -1.2], eo, 38); x.post.tint.value.set(1.0, 1.04, 0.92);
});
// "vindo dos animatrônicos" — push in on the band, sickly green haze
at(15.24, 'smell_band', x => {
  const [s, f, b, c] = band(x); const L = x.L; f.head.rotation.x = 0.12; camMove(x, [0.3, 1.8, 4.6], [0, 2.3, -1.9], [0.1, 2.3, 1.8], [0, 2.7, -1.9], eio, 34);
  x.post.tint.value.set(0.92, 1.08, 0.82); x.S.stageSpot.intensity = 26;
});
// "Algo como sangue e muco escorrendo nos olhos" — Freddy close-up, dark fluid runs from the eyes
at(16.56, 'blood_eyes', x => {
  const [s, f] = band(x); const L = x.L; x.S.stageSpot.intensity = 14; f.head.rotation.x = 0.06; f.head.rotation.y = 0.04 * Math.sin(x.t);
  drips(x, f, eio(seg(L, 1.5, 3.3)), [[-2.0, 3.4], [2.0, 3.4], [-1.6, 3.3], [1.5, 3.3]], 3.6);
  const hp = tp(f, 'head', [0, 4, 4]); camMove(x, [hp.x + 0.35, hp.y - 0.05, hp.z + 1.9], hp.toArray(), [hp.x + 0.1, hp.y - 0.05, hp.z + 1.25], hp.toArray(), eio, 30); fillOn(x, f, 1.6, 2.4);
  x.post.tint.value.set(1.05, 0.95, 0.92);
});
// "e da boca dos bonecos" — Bonnie, from the mouth
at(19.84, 'blood_mouth', x => {
  const [s, f, b] = band(x); const L = x.L; x.S.stageSpot.intensity = 14; b.head.rotation.x = 0.08;
  drips(x, b, 1, [[-1.9, 3.6], [1.9, 3.6]], 2.6);
  [[-0.8, 1.0], [0.6, 1.0], [0.0, 0.9]].forEach(([ux, uy], j) => { const d = DRIPS[4 + j]; b.head.add(d); const l = 0.25 + 3.2 * eio(seg(L, 0.1 + j * 0.2, 1.3)); d.position.set(ux * U16, (uy - l / 2) * U16, 4.68 * U16); d.scale.set(0.5 * U16, l * U16, 0.22 * U16); });
  const hp = tp(b, 'head', [0, 3, 4]); const a = mix(-0.35, -0.1, eio(x.u)); cam(x, [hp.x + Math.sin(a) * 1.4, hp.y - 0.08, hp.z + Math.cos(a) * 1.4], hp.toArray(), 30); fillOn(x, b, 1.6, 2.4);
});
// "Isso não é teoria," — the night guard at his desk
at(21.22, 'not_theory', x => {
  const s = office(x); const L = x.L; const g = guardSit(x, s); g.head.rotation.x = 0.2; g.head.rotation.y = 0.25 * Math.sin(x.t * 0.8);
  camMove(x, [2.3, 1.75, -0.6], [0, 1.45, 0.0], [1.8, 1.7, -0.9], [0, 1.45, 0.0], eo, 40); fillOn(x, g, 1.2, 1.6); hand(x, 0.6);
});
// "isso tá escrito no primeiro jogo" — the FNAF 1 office: two doors, the fan, the poster
at(23.32, 'first_game', x => {
  const s = office1(x); const L = x.L; camMove(x, [0.0, 1.75, 1.95], [0, 1.45, -2.5], [0.1, 1.62, 1.1], [0, 1.4, -2.5], eo, 50); hand(x, 0.5);
});
// "E isso é só a ponta" — the iceberg tip under the moon
at(24.94, 'tip', x => {
  const L = x.L; const a = mix(0.9, 0.35, eio(x.u)); const R = 17; cam(x, [Math.sin(a) * R, mix(8, 5.5, eio(x.u)), -14 + Math.cos(a) * R], [0, 4.0, -14], 40); ice(x);
});
// "Hoje a gente vai descer o iceberg de FNAF," — the camera sinks along the ice and goes under
at(27.58, 'descend', x => {
  const L = x.L; const k = eio(seg(L, 0.2, 2.96)); const y = mix(7, -6, k); iceCam(x, y, mix(0.35, 0.1, k), mix(13, 20, k), mix(-1.5, -1.5, k), 44, 7 * k); ice(x, { rush: 2 });
  if (Math.abs(y) < 1) { x.post.flash.value = 0.3 * (1 - Math.abs(y)); x.post.blur.value = 0.7 * (1 - Math.abs(y)); }
});
// "começa nas coisas que a maioria dos fãs sabem" — the famous four, in a warm spotlight
at(30.54, 'fans_know', x => {
  const s = voidS(x, 50, 10, '#ffb070', 4); const L = x.L; s.fog = null;
  ['bonnie', 'freddy', 'chica', 'foxy'].forEach((n, i) => { const c = put(x, n, s, (i - 1.5) * 1.35, 0, -0.25 * Math.abs(i - 1.5), -(i - 1.5) * 0.12); c.idle(x.t, 1, i); lookAtCam(x, c, 0.5); });
  camMove(x, [-2.2, 1.7, 7.4], [0, 1.5, 0], [1.4, 1.75, 6.4], [0, 1.55, 0], eio, 34);
});
// "E termina em teorias tão pesadas, tão escondidas," — deep under, the light fades
at(33.64, 'deep', x => {
  const L = x.L; const k = eio(x.u); iceCam(x, mix(-12, -40, k), mix(-0.3, 0.35, k), 24, -3, 46, 9); ice(x, { rush: 1.5, red: k * 0.4 });
});
// "que a maioria das pessoas que jogou nunca nem ouviu falar" — two orange eyes open in the dark
at(37.56, 'never_heard', x => {
  const s = voidS(x, 0, 0, '#ff8a3a', 0.6); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); m.idle(x.t, 0.6); m.head.rotation.x = 0.1;
  const on = sm(seg(L, 1.9, 2.4)); m.eyeLight.intensity = 3 * on; rimOn(x, s, [0, 3.5, -3], [0, 1.6, 0], 30 * on, '#ff8a3a');
  const hp = tp(m, 'head', [0, 4, 3]); camMove(x, [0.2, hp.y - 0.15, 4.4], hp.toArray(), [0.05, hp.y - 0.05, 2.4], hp.toArray(), eio, 32);
  x.post.vig.value = 1.2; if (L > 1.9 && L < 2.0) x.post.flash.value = 0.12;
});
// "E eu já aviso uma coisa," — the bottom glows red
at(41.06, 'warn', x => {
  const L = x.L; iceCam(x, mix(-44, -50, eio(x.u)), 0.25, 26, -10, 46, -8); ice(x, { red: 1 });
});
// "tem uma informação lá no fundo que muda o jeito que você vê um dos personagens mais famosos da franquia"
at(43.22, 'info', x => {
  const s = voidS(x, 0, 30, '#ff3a2a', 0.4); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.6);
  rimOn(x, s, [0.5, 3.8, -3.2], [0, 1.4, 0], 70, '#ff3a2a'); const turn = eo(seg(L, 3.3, 4.0)); w.head.rotation.y = mix(-0.6, 0, turn); w.head.rotation.x = mix(0.25, 0.05, turn);
  keyOn(x, s, [1.6, 3.5, 3.5], [0, 1.7, 0], 10 * sm(seg(L, 3.3, 4.2)), 0.3);
  camMove(x, [0.6, 1.4, 6.5], [0, 1.4, 0], [0.12, 1.72, 2.2], [0, 1.72, 0], eio, 34); x.post.vig.value = 1.15;
});
// "Então fica até o final, se você tiver coragem" — the left light reveals Bonnie... the door slams
at(48.70, 'courage', x => {
  const s = office1(x, 0.55); const L = x.L; const b = put(x, 'bonnie', s, -3.35, 0, 0, Math.PI / 2); b.idle(x.t, 0.5); lookAtCam(x, b, 0.9);
  const lt = L > 1.0 && L < 3.3; x.S.westDoorLight.intensity = lt ? 7 * mix(1, flicker(x.t, 4), 0.5) : 0; b.root.visible = L > 1.0;
  const slam = ei(seg(L, 3.34, 3.5)); x.S.doorL.position.y = mix(3.75, 1.25, slam); if (L > 3.5 && L < 3.62) shake(x, 0.6);
  camMove(x, [0.6, 1.6, 0.9], [-3, 1.5, -0.2], [0.1, 1.6, 0.5], [-3, 1.55, 0], eo, 42); hand(x, 0.8);
});

// ================================ TRANSITION 1 + CAMADA 1 ================================
at(52.76, 'dive1', x => {
  const L = x.L; const k = eio(seg(L, 0, 2.6)); const a = mix(1.1, 0.12, k); const R = mix(46, 15, k); const y = mix(28, 4.5, k);
  cam(x, [Math.sin(a) * R, y, -14 + Math.cos(a) * R], [0, mix(2, 4.2, k), -14], 44); if (L < 2.6) shake(x, 0.2 * Math.sin(Math.PI * k)); ice(x); title(x, 0, 1.75, 6.5);
  x.post.fade.value = 0.6 * (1 - seg(L, 0, 0.4));
});
// "Os animatrônicos não te atacam porque você está com defeito" — Bonnie comes down the hall
at(57.54, 'not_defect', x => {
  const s = hall(x, 1); const L = x.L; const b = put(x, 'bonnie', s, 0, 0, 0, 0); walkTo(b, [0.1, 0, -11], [0.05, 0, -5.2], eo(seg(L, 0, 3.4)), 1.0); lookAtCam(x, b, 0.5);
  camMove(x, [0.4, 1.6, 0.8], [0, 1.9, -8], [0.25, 1.75, -1.0], [0, 2.0, -5], eo, 40); fillOn(x, b, 1.6, 2.2); hand(x, 0.5);
});
// "Eles são possuídos," — a child's ghost slips into Freddy
at(60.98, 'possessed', x => {
  const s = voidS(x, 34, 18, '#9ad8ff'); const L = x.L; const f = put(x, 'freddy', s, 0, 0, 0, 0); f.idle(x.t, 0.6);
  const k = eio(seg(L, 0.1, 1.1)); const g = ghostKid(x, 0, s, [0, mix(0, 0.5, k), mix(1.3, 0.05, k)], Math.PI, 0.55 * (1 - seg(L, 0.9, 1.3)));
  f.setEyeGlow('#e8f6ff', sm(seg(L, 1.0, 1.25)) * (L > 1.3 ? 0.6 : 1)); if (L > 1.05 && L < 1.12) x.post.flash.value = 0.08;
  const a = mix(0.7, 0.25, eio(x.u)); cam(x, [Math.sin(a) * 4.4, 1.9, Math.cos(a) * 4.4], [0, 1.8, 0], 36);
});
// "as crianças assassinadas de 85 ficaram presas dentro deles"
at(62.78, 'kids85', x => {
  const s = voidS(x, 46, 16, '#9ad8ff', 3); const L = x.L; s.fog = null;
  ['foxy', 'bonnie', 'freddy', 'chica', 'golden'].forEach((n, i) => { const c = put(x, n, s, (i - 2) * 1.5, 0, -0.35 * Math.abs(i - 2), -(i - 2) * 0.12); c.idle(x.t, 0.7, i);
    const k = eio(seg(L, 0.6 + i * 0.35, 1.9 + i * 0.35)); const gp = rootPt(c, 0, mix(0, 0.35, k), mix(1.2, 0.05, k)); ghostKid(x, (i + 1) % 5, s, gp.toArray(), Math.PI + c.root.rotation.y, 0.55 * (1 - seg(L, 1.7 + i * 0.35, 2.1 + i * 0.35)));
    if (c.setEyeGlow) c.setEyeGlow('#e8f6ff', 0.7 * sm(seg(L, 1.8 + i * 0.35, 2.0 + i * 0.35))); });
  camMove(x, [1.5, 1.6, 9.0], [0, 1.4, 0], [-0.6, 1.7, 7.6], [0, 1.5, 0], eio, 36);
});
// "E o phone guy explica porque eles te atacam," — the phone rings in the office
at(66.42, 'phone', x => {
  const s = office(x); const L = x.L; phoneRing(x, 1); const g = guardSit(x, s); g.head.rotation.y = -0.5 * eo(seg(L, 0.5, 1.0)); g.head.rotation.x = 0.25;
  const pp = x.S.phone.position; waves(x, s, new V3(pp.x, pp.y + 0.25, pp.z), 1.2);
  camMove(x, [2.0, 1.55, 0.2], [0.85, 1.1, -0.78], [1.45, 1.4, -0.25], [0.85, 1.1, -0.78], eo, 40);
});
// "à noite eles acham que você é um endoesqueleto sem roupa" — robot vision locks on the guard
at(69.08, 'endo_scan', x => {
  const s = office(x); const L = x.L; const g = guardSit(x, s); g.head.rotation.x = -0.05; lookAtCam(x, g, eo(seg(L, 1.2, 1.6))); x.S.officeLamp.intensity = 5;
  camMove(x, [0.1, 2.0, -4.3], [0, 1.4, 0.15], [0.05, 1.9, -3.0], [0, 1.45, 0.15], eo, 40); hand(x, 0.7);
  const lock = L > 1.75; vision(x, g, lock ? 'ENDOESQUELETO' : 'ANALISANDO...', lock, lock ? 'TRAJE: NENHUM' : 'ID: ----');
});
// "E tentam te enfiar à força dentro de uma fantasia do Freddy"
at(72.28, 'stuff', x => {
  const s = voidS(x, 44, 14, '#ff4a2a', 3); const L = x.L; s.fog = null;
  const f = put(x, 'freddy', s, 0, 0, -1.6, 0); slump(f, 1); f.head.rotation.x = 0.6;
  const g = put(x, 'guard', s, 0, 0, mix(0.9, 0.3, eo(seg(L, 0, 2.6))), 0); g.walk(L * 3.2, 0.7, 0); g.head.rotation.y = 0.45 * Math.sin(x.t * 9); g.torso.rotation.x = -0.1;
  const b = put(x, 'bonnie', s, -0.95, 0, g.root.position.z - 0.15, 0.25), c = put(x, 'chica', s, 0.95, 0, g.root.position.z - 0.15, -0.25); b.walk(L * 1.6, 0.6, 0); c.walk(L * 1.6 + 0.5, 0.6, 0);
  aim(g, 'R', rootPt(g, -0.75, 1.35, -0.1), 1); aim(g, 'L', rootPt(g, 0.75, 1.35, -0.1), 1);
  aim(b, 'L', tp(g, 'armR', [0, -7, 0]), 1); aim(c, 'R', tp(g, 'armL', [0, -7, 0]), 1); aim(b, 'R', tp(g, 'torso', [-3, 9, -2]), 0.8); aim(c, 'L', tp(g, 'torso', [3, 9, -2]), 0.8);
  lookAtCam(x, b, 0.3); lookAtCam(x, c, 0.3);
  camMove(x, [0.6, 1.55, 5.6], [0, 1.4, 0], [0.2, 1.6, 4.3], [0, 1.45, -0.2], eo, 38); hand(x, 0.6);
});
// "O problema é que a fantasia é cheia de vigas, fios e peças de metal" — X-ray Freddy
at(75.22, 'beams', x => {
  const s = voidS(x, 36, 20, '#3ad8ff', 3); const L = x.L; const f = put(x, 'freddy', s, 0, 0, 0, 0); f.idle(x.t, 0.6);
  x.setXray(f, 0.85 * sm(seg(L, 0.4, 1.2)), sm(seg(L, 2.2, 3.0)) * (0.6 + 0.4 * Math.sin(x.t * 8)), '#ffb040');
  const a = mix(-0.7, 0.6, eio(x.u)); cam(x, [Math.sin(a) * 4.0, 1.7, Math.cos(a) * 4.0], [0, 1.5, 0], 38);
});
// "Só que pense comigo, e se não for uma confusão" — Freddy in the dark hall slowly tilts his head
at(79.58, 'think', x => {
  const s = hall(x, 0.5, '#c8d0ff'); const L = x.L; const f = put(x, 'freddy', s, 0, 0, -4.6, 0); f.idle(x.t, 0.4);
  f.head.rotation.z = 0.3 * eio(seg(L, 0.4, 2.4)); f.setEyeGlow('#ffffff', 0.9 * sm(seg(L, 2.0, 2.3)));
  camMove(x, [0.5, 1.75, 0.4], [0, 2.0, -4.6], [0.2, 2.0, -1.6], [0, 2.15, -4.6], eio, 36); fillOn(x, f, 1.2, 2.2);
});
// "E se eles soubessem exatamente o que estão fazendo" — the whole band turns to us at once
at(82.86, 'they_knew', x => {
  const [s, f, b, c] = band(x); const L = x.L; const k = eo(seg(L, 0.5, 0.8)); [f, b, c].forEach(ch => { const y0 = ch.head.rotation.y; ch.head.rotation.y = mix(y0 - 0.7, y0, 1); lookAtCam(x, ch, k); });
  [f, b, c].forEach(ch => { if (k < 1) ch.head.rotation.y += (1 - k) * 0.8; });
  f.setEyeGlow('#ffffff', 0.8 * k); x.S.stageSpot.intensity = 22;
  camMove(x, [0, 1.9, 6.0], [0, 2.0, -1.8], [0, 2.1, 4.2], [0, 2.2, -1.8], eio, 34);
});
// "E se estivessem procurando uma pessoa específica" — robot vision sweeping the hall
at(85.90, 'searching', x => {
  const s = hall(x, 0.6); const L = x.L; const ppl = [['guard', -0.9, -4.0, 0.15], ['jeremy', 0.8, -6.2, -0.2], ['henry', -0.3, -8.6, 0.1]];
  const cs = ppl.map(([n, px, pz, ry], i) => { const c = put(x, n, s, px, 0, pz, ry); c.idle(x.t, 1, i); lookAtCam(x, c, 0.5); return c; });
  camMove(x, [0.0, 2.15, 1.5], [0, 1.5, -8], [0.0, 2.15, -0.6], [0, 1.5, -8], (u) => u, 40); x.camera.position.y += 0.03 * Math.abs(Math.sin(x.t * 5)); x.camera.rotateZ(0.012 * Math.sin(x.t * 2.5));
  const i = Math.min(2, Math.floor(L / 1.35)); vision(x, cs[i], 'PROCURANDO...', false, 'ID: ' + ['NÃO', 'NÃO', 'NÃO'][i]);
});
// "Um homem roxo," — he steps into the light
at(89.94, 'purple_man', x => {
  const s = voidS(x, 40, 30, '#a040ff'); const L = x.L; const p = put(x, 'purpleguy', s, 0, 0, 0, 0); walkTo(p, [0, 0, -2.2], [0, 0, 0], eo(seg(L, 0, 1.2)), 0.9);
  rimOn(x, s, [0, 3.5, -3], [0, 1.5, 0], 50, '#a040ff'); camMove(x, [0.4, 1.4, 4.6], [0, 1.4, -0.5], [0.2, 1.55, 3.6], [0, 1.5, 0], eo, 38);
});
// "o purple guy, o cara roxo" — orbit; he grins and waves
at(91.36, 'purple_guy', x => {
  const s = voidS(x, 40, 30, '#a040ff'); const L = x.L; const p = put(x, 'purpleguy', s, 0, 0, 0, 0); p.idle(x.t, 1); lookAtCam(x, p, 0.9); p.head.rotation.z = 0.15 * eo(seg(L, 0.8, 1.2));
  aim(p, 'R', rootPt(p, -0.55, 2.0 + 0.1 * Math.sin(x.t * 10), 0.4), eo(seg(L, 0.9, 1.3))); rimOn(x, s, [0, 3.5, -3], [0, 1.5, 0], 50, '#a040ff');
  const a = mix(0.6, -0.4, eio(x.u)); cam(x, [Math.sin(a) * 3.2, 1.75, Math.cos(a) * 3.2], [0, 1.65, 0], 36);
});
// "Nos minigames escondidos dos jogos ele aparece como um bonequinho roxo de pixel"
at(93.90, 'minigame', x => {
  const s = x.S.mini; x.out.scene = s; x.post.pix.value = PIX(x); const L = x.L; const p = put(x, 'purpleguy', s, 0, 0, 0, 0);
  walkTo(p, [-1.6, 0, 1.4], [0.6, 0, -2.4], seg(L, 0, 4.7), 0.8); p.root.rotation.y = Math.atan2(2.2, -3.8);
  for (let i = 0; i < 3; i++) { const sp = x.S.miniKidSpots[i + 2]; const k = put(x, 'kid' + i, s, sp[0] * 0.45, 0, sp[1] * 0.45 - 1, 0.4 + i); k.idle(x.t, 1, i); }
  const pp = p.root.position; cam(x, [pp.x + 2.0, 5.4, pp.z + 5.0], [pp.x, 0.6, pp.z], 42); x.post.vig.value = 0.6;
});
// "Hoje a gente sabe o nome dele, William Afton" — the spotlight slams on
at(98.68, 'name', x => {
  const s = voidS(x, 0, 24, '#a040ff', 1); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.6); const on = L > 1.98 ? 1 : 0.08;
  x.S.voidSpot.intensity = 46 * on; lookAtCam(x, w, on ? eo(seg(L, 2.0, 2.4)) : 0); w.head.rotation.x += on ? 0 : 0.3;
  camMove(x, [0.5, 1.5, 5.4], [0, 1.5, 0], [0.15, 1.7, 2.6], [0, 1.72, 0], eio, 36); if (L > 1.98 && L < 2.08) x.post.flash.value = 0.25;
});
// "Cofundador da Fazbear Entertainment," — William and Henry at Fredbear's Family Diner
at(101.48, 'cofounder', x => {
  const s = x.S.diner; x.out.scene = s; const L = x.L; x.post.vig.value = 0.8; x.post.tint.value.set(1.06, 1.0, 0.9);
  const f = put(x, 'fredbear', s, 0.9, 0.77, -4.4, -0.15); f.idle(x.t, 1); const sb = put(x, 'springbonnie', s, -0.9, 0.77, -4.4, 0.15); sb.idle(x.t, 1, 2);
  const w = put(x, 'william', s, -0.55, 0, -1.6, 0.45), h = put(x, 'henry', s, 0.55, 0, -1.6, -0.45); w.idle(x.t, 1); h.idle(x.t, 1, 1);
  const sh = eo(seg(L, 0.3, 0.8)); const mid = new V3(0, 1.0 + 0.04 * Math.sin(x.t * 9) * seg(L, 0.8, 1.6), -1.25); aim(w, 'L', mid, sh); aim(h, 'R', mid, sh); lookAtCam(x, w, 0.5); lookAtCam(x, h, 0.5);
  camMove(x, [0.4, 1.6, 2.6], [0, 1.6, -2.4], [0.15, 1.55, 1.4], [0, 1.55, -2.4], eo, 40); fillOn(x, w, 1.5, 1.8);
});
// "engenheiro," — at the workbench
at(103.78, 'engineer', x => {
  const s = x.S.shop; x.out.scene = s; const L = x.L; x.post.vig.value = 0.85; const w = put(x, 'william', s, -0.2, 0, -1.9, -2.2); w.idle(x.t, 0.6);
  aim(w, 'R', new V3(-1.0, 1.05 + 0.08 * Math.sin(x.t * 12), -2.9), 0.9); aim(w, 'L', new V3(-0.4, 1.05, -3.0), 0.7); w.head.rotation.x = 0.4;
  camMove(x, [-2.3, 1.8, -0.4], [-0.5, 1.35, -2.2], [-1.9, 1.75, -0.8], [-0.5, 1.35, -2.3], eo, 42); fillOn(x, w, 1.5, 1.8); x.S.shopLamp.intensity = 14;
});
// "pai" — with his three kids
at(105.02, 'father', x => {
  const s = voidS(x, 46, 12, '#ffd0a0', 4); const L = x.L; s.fog = null; const w = put(x, 'william', s, 0, 0, -0.3, 0); w.idle(x.t, 1);
  const m = put(x, 'michael', s, -0.95, 0, 0.1, 0.2), e = put(x, 'elizabeth', s, 1.1, 0, 0.2, -0.25), c = put(x, 'cchild', s, 0.45, 0, 0.75, -0.1); [m, e, c].forEach((k, i) => { k.idle(x.t, 1, i); lookAtCam(x, k, 0.6); });
  aim(w, 'L', tp(e, 'head', [0, 9, 0]), 0.8); lookAtCam(x, w, 0.4); camMove(x, [0.0, 1.9, 4.6], [0, 1.25, 0], [-0.1, 1.85, 4.0], [0, 1.3, 0], eo, 38);
});
// "e o maior assassino em série da história dos games" — red light, five little ghosts behind him
at(105.90, 'killer', x => {
  const s = voidS(x, 18, 40, '#ff2a1a', 0.6); const L = x.L; s.fog = null; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.5); lookAtCam(x, w, 0.7);
  for (let i = 0; i < 5; i++) ghostKid(x, i, s, [(i - 2) * 0.75, 0, -1.6 - 0.3 * Math.abs(i - 2)], 0, 0.7 * sm(seg(L, 0.3 + i * 0.15, 1.0 + i * 0.15)));
  rimOn(x, s, [0, 3.8, -3.5], [0, 1.4, 0], 60, '#ff2a1a'); camMove(x, [0.3, 0.7, 4.8], [0, 1.6, 0], [0.1, 0.95, 3.2], [0, 1.7, 0], eio, 38); x.post.tint.value.set(1.15, 0.85, 0.85);
});
// "Guarde esse detalhe," — tight on his face
at(108.52, 'keep', x => {
  const s = voidS(x, 30, 26, '#ff6a3a', 1); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.4); lookAtCam(x, w, 1);
  const hp = tp(w, 'head', [0, 4, 4]); camMove(x, [hp.x + 0.3, hp.y, hp.z + 1.6], hp.toArray(), [hp.x + 0.08, hp.y, hp.z + 0.95], hp.toArray(), eio, 30); fillOn(x, w, 0.8, 1.9);
});
// "pai, ele vai ser muito importante lá embaixo" — hand on his son's head, then the camera sinks below
at(110.04, 'pai_down', x => {
  const s = voidS(x, 40, 14, '#ffd0a0', 3); const L = x.L; s.fog = null; const w = put(x, 'william', s, -0.3, 0, 0, 0.15); w.idle(x.t, 0.8); const c = put(x, 'cchild', s, 0.35, 0, 0.25, -0.1); c.idle(x.t, 1); lookAtCam(x, c, 0.5);
  aim(w, 'L', tp(c, 'head', [0, 9, 0]), eo(seg(L, 0.1, 0.6))); w.head.rotation.x = 0.35; w.head.rotation.y = -0.3;
  const k = eio(seg(L, 1.0, 2.8)); cam(x, [0.3, mix(1.5, -1.2, k), mix(3.6, 4.4, k)], [0, mix(1.25, -2.5, k), 0], 38); x.post.fade.value = 0.6 * sm(seg(L, 2.1, 2.8));
});
// "No primeiro jogo o phone guy solta, quase sem querer"
at(112.84, 'phone87', x => {
  const s = office(x); const L = x.L; phoneRing(x, L < 1.2 ? 1 : 0); const g = guardSit(x, s); g.head.rotation.y = -0.35; g.head.rotation.x = 0.2; aim(g, 'L', rootPt(g, 0.5, 1.2, 0.8), eo(seg(L, 1.0, 1.6)) * 0.6);
  const pp = x.S.phone.position; if (L > 1.2) waves(x, s, new V3(pp.x, pp.y + 0.25, pp.z), 0.8, '#ffe8c0');
  const a = mix(2.6, 2.1, eio(x.u)); cam(x, [Math.sin(a) * 2.6, 1.9, 0.15 + Math.cos(a) * 2.6], [0.3, 1.25, -0.4], 42);
});
// "A mordida de 87," — Foxy's jaw snaps shut
at(116.36, 'bite87', x => {
  const s = voidS(x, 30, 30, '#ff2a1a', 1); const L = x.L; const f = put(x, 'foxy', s, 0, 0, 0, 0); f.idle(x.t, 0.5); lookAtCam(x, f, 0.8);
  const o = eo(seg(L, 0, 0.6)) * (1 - ei(seg(L, 0.82, 0.92))); f.jaw.rotation.x = 0.8 * o; if (L > 0.92 && L < 1.3) shake(x, 0.8 * (1 - seg(L, 0.92, 1.3)));
  if (L > 0.92 && L < 1.0) x.post.flash.value = 0.3; const hp = tp(f, 'head', [0, 3, 6]); camMove(x, [hp.x + 0.5, hp.y - 0.1, hp.z + 1.9], hp.toArray(), [hp.x + 0.2, hp.y - 0.05, hp.z + 1.2], hp.toArray(), eo, 32);
  x.post.tint.value.set(1.12, 0.9, 0.9);
});
// "é incrível que o corpo humano consiga viver sem o lobo frontal" — a victim on the floor
at(118.66, 'lobe', x => {
  const s = x.S.party; x.out.scene = s; const L = x.L; x.post.vig.value = 1.0; x.S.partyRed.intensity = 6; const j = lie(x, 'jeremy', s, 0.2, -0.4, 0.3, 1);
  j.head.rotation.y = 0.5; const a = mix(0.4, -0.2, eio(x.u)); cam(x, [Math.sin(a) * 2.6, mix(3.4, 2.4, eio(x.u)), -0.4 + Math.cos(a) * 2.6], [0.1, 0.2, -0.4], 40); x.post.tint.value.set(0.9, 0.85, 0.95);
});
// "Alguém foi mordido por um animatrônico e perdeu parte do cérebro" — Mangle drops from the ceiling
at(121.70, 'bitten', x => {
  const s = x.S.cove; x.out.scene = s; const L = x.L; x.post.vig.value = 0.95; const m = x.MANGLE; s.add(m.root); m.reset(); m.root.scale.setScalar(1.25);
  m.root.rotation.set(0, 0, Math.PI); m.root.position.set(0, x.S.coveCeilY, mix(-3.0, -0.6, eo(seg(L, 0, 2.2)))); m.crawl(L * 1.4, 1 - seg(L, 1.9, 2.3)); m.idle(x.t, 0.6); m.setJaw(0.1 + 0.4 * eo(seg(L, 2.4, 2.9)));
  x.S.coveLamps.forEach((l, i) => l.intensity = 2.5 * flicker(x.t, i)); x.S.coveRed.intensity = 6 * sm(seg(L, 2.2, 2.8));
  const mz = m.root.position.z; camMove(x, [0.4, 1.55, 3.8], [0, 2.0, mz], [0.2, 1.65, 3.0], [0, 1.95, mz], eo, 44); hand(x, 0.6);
});
// "Quem mordeu," — a question in the dark
at(125.32, 'who', x => {
  const s = voidS(x, 10, 26, '#ff4a2a', 0.5); const L = x.L; const f = put(x, 'foxy', s, 0, 0, 0, 0); f.idle(x.t, 0.6); f.head.rotation.x = 0.25;
  rimOn(x, s, [0, 3.6, -3], [0, 1.6, 0], 50, '#ff6a3a'); camMove(x, [0.6, 1.5, 5.4], [0, 1.6, 0], [0.3, 1.6, 4.6], [0, 1.6, 0], eo, 36); pop(x, x.FX.q1, s, headTop(f, 0.85), 0.3, 0.8);
});
// "Foxy," — spot on Foxy
at(126.52, 'foxy', x => {
  const s = voidS(x, 46, 26, '#ff4a2a', 3); const L = x.L; const f = put(x, 'foxy', s, 0, 0, 0, 0); f.idle(x.t, 1); lookAtCam(x, f, 1); f.jaw.rotation.x = 0.35 * eo(seg(L, 0.1, 0.4));
  const hp = tp(f, 'head', [0, 3, 4]); camMove(x, [hp.x - 0.4, hp.y - 0.2, hp.z + 2.3], hp.toArray(), [hp.x - 0.2, hp.y - 0.1, hp.z + 1.7], hp.toArray(), eo, 34); if (L < 0.07) x.post.flash.value = 0.2;
});
// "Mangle," — Mangle hanging from the cove ceiling, face to the camera
at(127.30, 'mangle', x => {
  const s = x.S.cove; x.out.scene = s; const L = x.L; x.post.vig.value = 0.95; const m = x.MANGLE; s.add(m.root); m.reset(); m.root.scale.setScalar(1.25);
  m.root.rotation.set(0, 0, Math.PI); m.root.position.set(0, x.S.coveCeilY, -0.9); m.idle(x.t, 1); m.setJaw(0.25 + 0.1 * Math.sin(x.t * 5));
  camMove(x, [0.25, 1.6, 2.8], [0, 1.6, -0.9], [0.1, 1.6, 2.1], [0, 1.6, -0.9], eo, 42); x.S.coveLamps.forEach(l => l.intensity = 2); if (L < 0.07) x.post.flash.value = 0.2;
});
// "por mais de uma década a comunidade brigou por causa disso" — Foxy below, Mangle above: who did it?
at(128.34, 'debate', x => {
  const s = x.S.cove; x.out.scene = s; const L = x.L; x.post.vig.value = 0.95; const m = x.MANGLE; s.add(m.root); m.reset(); m.root.scale.setScalar(1.25);
  m.root.rotation.set(0, 0, Math.PI); m.root.position.set(1.3, x.S.coveCeilY, -1.4); m.idle(x.t, 1); m.setJaw(0.2 + 0.1 * Math.sin(x.t * 3));
  const f = put(x, 'foxy', s, -1.3, 0, -1.3, 0.25); f.idle(x.t, 1); f.head.rotation.y = 0.5 * Math.sin(x.t * 1.4); f.jaw.rotation.x = 0.2 + 0.15 * Math.sin(x.t * 6);
  const a = mix(-0.3, 0.3, eio(x.u)); cam(x, [Math.sin(a) * 4.6, 1.6, -1.2 + Math.cos(a) * 4.6], [0, 1.8, -1.3], 42); x.S.coveRed.intensity = 3;
});
// "Mas o que pouca gente percebe é que essa mordida não foi a primeira" — Fredbear
at(130.52, 'not_first', x => {
  const s = x.S.diner; x.out.scene = s; const L = x.L; x.post.vig.value = 1.0; x.S.dinerLamps.forEach((l, i) => l.intensity = 4 * flicker(x.t, i)); x.S.dinerSpot.intensity = 24;
  const f = put(x, 'fredbear', s, 0, 0.77, -4.4, 0); f.idle(x.t, 0.6); const k = eo(seg(L, 2.4, 2.8)); lookAtCam(x, f, k); f.head.rotation.x += 0.1 * (1 - k);
  const hp = tp(f, 'head', [0, 4, 4]); camMove(x, [0.6, 1.6, 0.6], hp.toArray(), [hp.x + 0.2, hp.y - 0.1, hp.z + 1.6], hp.toArray(), eio, 40); if (L > 2.5 && L < 2.6) x.post.flash.value = 0.2;
  x.post.tint.value.set(1.1, 0.95, 0.85);
});
// "Noite 4," — the office in the dark, the light trembling
at(133.92, 'night4', x => {
  const s = office1(x, 0.5 * flicker(x.t, 7)); const L = x.L; camMove(x, [0.0, 1.7, 1.9], [0, 1.45, -2.5], [0.4, 1.62, 1.2], [-0.4, 1.45, -2.5], eo, 46); hand(x, 1.0); x.post.tint.value.set(0.85, 0.9, 1.05);
});
// "o phone guy liga mais nervoso que o normal"
at(135.42, 'nervous', x => {
  const s = office(x); const L = x.L; phoneRing(x, 1); x.S.officeLamp.intensity = 4; const pp = x.S.phone.position; waves(x, s, new V3(pp.x, pp.y + 0.25, pp.z), 1.8, '#ff9a8a');
  camMove(x, [1.5, 1.5, 0.3], [0.85, 1.1, -0.78], [1.15, 1.3, -0.3], [0.85, 1.1, -0.78], eo, 40); shake(x, 0.15); x.post.tint.value.set(1.1, 0.92, 0.9);
});
// "Tem alguém batendo na porta dele," — the steel door shudders
at(137.28, 'knock', x => {
  const s = office1(x, 0.6); const L = x.L; x.S.doorL.position.y = 1.25; let hit = 0; for (const a of [0.35, 0.75, 1.15, 1.6]) { const d = L - a; if (d > 0 && d < 0.2) hit = Math.max(hit, 1 - d / 0.2); }
  x.S.doorL.position.x = -2.6 + 0.04 * hit; x.S.btnDoorL.material.emissiveIntensity = 1.5; if (hit > 0.7) shake(x, 0.25 * hit);
  camMove(x, [0.4, 1.6, 0.6], [-2.6, 1.4, 0], [0.0, 1.6, 0.3], [-2.6, 1.35, 0], eo, 46); hand(x, 0.6);
});
// "toca a musiquinha do Freddy" — blackout: Freddy's face flashes in the doorway
at(139.46, 'tune', x => {
  const s = office1(x, 0); const L = x.L; const f = put(x, 'freddy', s, -3.3, 0, 0.05, Math.PI / 2); f.idle(x.t, 0.3); lookAtCam(x, f, 0.8);
  const on = Math.sin(x.t * 9.5) > 0.1 ? 1 : 0; f.setEyeGlow('#ffffff', on); x.S.westDoorLight.intensity = 6 * on; if (on) fillOn(x, f, 1.5, 2.2); x.S.west.forEach(l => l.intensity = 0);
  camMove(x, [0.6, 1.55, 0.9], [-3.3, 2.0, 0], [0.2, 1.6, 0.6], [-3.3, 2.1, 0], eo, 40); x.post.tint.value.set(0.8, 0.85, 1.0);
});
// "e um rugido corta a ligação" — jumpscare
at(141.14, 'roar', x => {
  const s = office1(x, 0.2); const L = x.L; cam(x, [0, 1.65, 0.6], [-1.0, 1.7, -0.3], 46); const f = put(x, 'freddy', s, 0, 0, 0, 0); f.setEyeGlow('#ffffff', 1); jumpscare(x, f, L, { from: 2.4, to: 1.25, headY: 1.78 });
});
// "O cara que te ensinou a sobreviver" — empty chair, the handset hanging
at(142.52, 'teacher', x => {
  const s = office(x); const L = x.L; x.S.officeLamp.intensity = 3 * flicker(x.t, 3); x.S.phoneHandset.position.set(0.25, -0.35, 0.18); x.S.phoneHandset.rotation.set(0.2, 0, 1.45 + 0.08 * Math.sin(x.t * 1.8));
  camMove(x, [1.7, 1.45, 1.8], [0.4, 0.9, -0.6], [1.2, 1.3, 1.2], [0.5, 0.9, -0.7], eo, 42); x.post.tint.value.set(0.85, 0.9, 1.0);
});
// "morreu do jeito que ele mesmo descreveu" — an empty-looking Freddy suit, slumped, leaking
at(144.54, 'died', x => {
  const s = voidS(x, 26, 22, '#ff2a1a', 1); const L = x.L; const f = put(x, 'freddy', s, 0, 0, 0, 0.1); slump(f, 1); f.head.rotation.x = 0.55;
  drips(x, f, 0.6 + 0.4 * eio(x.u), [[-2.0, 3.4], [2.0, 3.4], [-1.6, 3.3], [1.5, 3.3]], 3.4);
  const hp = tp(f, 'head', [0, 4, 4]); const a = mix(0.5, 0.1, eio(x.u)); cam(x, [hp.x + Math.sin(a) * 3.0, hp.y + 0.4, hp.z + Math.cos(a) * 3.0], [hp.x, hp.y - 0.5, hp.z], 38); x.post.tint.value.set(1.1, 0.85, 0.85);
});
// "E tem gente que jura que no meio do barulho dá pra ouvir o grito do"
at(147.00, 'swear', x => {
  const s = office(x); const L = x.L; x.S.officeLamp.intensity = 3; x.S.phoneHandset.position.set(0.25, -0.35, 0.18); x.S.phoneHandset.rotation.set(0.2, 0, 1.45);
  const hp = x.S.phone.localToWorld(new V3(0.25, -0.35, 0.18)); waves(x, s, hp, 1.0, '#ffd0a0');
  camMove(x, [hp.x + 1.4, hp.y + 0.5, hp.z + 1.4], hp.toArray(), [hp.x + 0.7, hp.y + 0.25, hp.z + 0.7], hp.toArray(), eio, 40); if (Math.sin(x.t * 3.1) > 0.97) x.post.stat.value = 0.2;
});
// "Golden Freddy" — slumped in the office
at(151.22, 'golden', x => {
  const s = office1(x, 0.7); const L = x.L; const g = put(x, 'golden', s, 0, 0, -0.55, 0); slump(g, 1); g.head.rotation.x = mix(0.5, 0.3, eo(seg(L, 0.6, 1.4)));
  if (L < 0.06) x.post.stat.value = 0.6; camMove(x, [0.5, 1.9, 1.95], [0, 0.75, -0.45], [0.25, 1.8, 1.7], [0, 0.8, -0.45], eo, 56); fillOn(x, g, 1.0, 1.4);
});
// "Um animatrônico que oficialmente nem deveria existir" — glitching in and out of reality
at(153.48, 'not_exist', x => {
  const s = voidS(x, 34, 20, '#ffd040', 2); const L = x.L; const g = put(x, 'golden', s, 0, 0, 0, 0); g.idle(x.t, 0.4); lookAtCam(x, g, 0.8); g.head.rotation.z = 0.25;
  g.setEyeGlow('#000000', 0); glitchIn(x, g, 0.4 + 0.6 * seg(L, 1.8, 2.8)); g.root.visible = L < 2.75 && Math.sin(x.t * 37) > -0.6 + 1.2 * seg(L, 1.8, 2.8);
  const hp = tp(g, 'head', [0, 4, 4]); camMove(x, [0.4, 1.6, 4.6], [0, 1.7, 0], [hp.x + 0.15, hp.y, hp.z + 1.8], hp.toArray(), eio, 36);
  x.post.chroma.value = 0.5 + 0.5 * seg(L, 1.8, 2.8); x.post.stat.value = L > 2.75 ? 0.8 : 0.1 * seg(L, 1.8, 2.8);
});

// ================================ PART 2: CAMADA 2 — ABAIXO D'ÁGUA ================================
// masks for the FNAF 4 bullies: real copies of the animatronic heads, worn over the kids' heads
const MASKS = {}; const MASKED = [];
function wearMask(x, c, n, off = 0) { if (!MASKS[c.name + n]) { const h = x.C[n].head.clone(true); h.rotation.set(0, 0, 0); h.traverse(o => { if (o.userData.endo) o.visible = false; }); MASKS[c.name + n] = h; }
  const m = MASKS[c.name + n]; c.head.add(m); m.position.set(0, off * 0.12, off * 0.35); m.rotation.set(-0.5 * off, 0, 0); m.scale.setScalar(1.1); c.headMesh.visible = off > 0.6; c.hat.visible = off > 0.6; MASKED.push([c, m]); return m; }
function unmask() { while (MASKED.length) { const [c, m] = MASKED.pop(); m.removeFromParent(); c.headMesh.visible = true; c.hat.visible = true; } }
const ICE = (() => { const g = new THREE.Group(); const cone = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 10), new THREE.MeshStandardMaterial({ color: '#c88a3a', roughness: 0.8 })); cone.rotation.x = Math.PI; g.add(cone);
  const sc = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), new THREE.MeshStandardMaterial({ color: '#ff9ac8', roughness: 0.5 })); sc.position.y = 0.12; g.add(sc); return g; })();
const TEARM = new THREE.MeshBasicMaterial({ color: '#8ad0ff', toneMapped: false, transparent: true, opacity: 0.85 });
const TEARS = Array.from({ length: 2 }, () => new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), TEARM));
EXTRA.push(ICE, ...TEARS);
const _cleanup1 = cleanup;
cleanup = function (x) { _cleanup1(x); unmask(); x.S.gg.background.set('#000000'); x.S.giftLid.rotation.x = 0; x.C.gWilliam.ghostMat.color.set('#ff6a5a'); KEY.color.set('#fff2e0'); x.S.iceBubbles.forEach(b => b.scale.setScalar(1)); };
function tears(x, c, k) { TEARS.forEach((d, i) => { c.head.add(d); const l = 0.4 + 3.2 * k; d.position.set((i ? 1.9 : -1.9) * U16, (3.4 - l / 2) * U16, 4.66 * U16); d.scale.set(0.45 * U16, l * U16, 0.2 * U16); }); }
function diner(x, dim = 1) { const s = x.S.diner; x.out.scene = s; x.post.vig.value = 0.85; x.post.tint.value.set(1.06, 1.0, 0.9); x.S.dinerLamps.forEach(l => l.intensity *= dim); x.S.dinerSpot.intensity *= dim; return s; }
function partyR(x) { const s = x.S.party; x.out.scene = s; x.post.vig.value = 0.9; return s; }
function bedroom(x, lamp = 1) { const s = x.S.bedroom; x.out.scene = s; x.S.bedLamp.intensity = 9 * lamp; x.post.vig.value = 0.95; return s; }
function fright(x, flick = 0.5) { const s = x.S.fright; x.out.scene = s; x.S.frLamps.forEach((l, i) => l.intensity = 8 * mix(1, flicker(x.t, i * 3), flick)); x.post.tint.value.set(0.92, 1.05, 0.92); x.post.vig.value = 0.9; return s; }
function tankAt(x, s, p, lv, glow = 1) { const t = x.FX.tank; s.add(t); t.position.set(...p); t.userData.liq.scale.y = Math.max(0.02, 1.1 * lv); t.userData.liq.position.y = 0.2 + 0.55 * lv; t.userData.light.intensity = 6 * glow; t.userData.liqM.opacity = 0.85; t.userData.bits.forEach(b => b.visible = false); return t; }
function kneel(c, k = 1) { const s = c.root.scale.x; c.root.position.y -= 0.42 * k * s; c.legR.piv.rotation.x = -1.4 * k; c.legL.piv.rotation.x = 0.1 * k; c.torso.rotation.x = 0.15 * k; }

// "Camada 2, abaixo d'água," — through the surface, down to the second layer
at(156.3333, 'dive2', x => { dive(x, 1, ICE_DEPTHS[0], ICE_DEPTHS[1]); });
// "agora começa de verdade" — FNAF 4 bedroom, the closet doors creak open
at(161.42, 'for_real', x => {
  const s = bedroom(x, 0.45); const L = x.L; x.S.closetDoors.forEach((d, i) => d.rotation.y = (i ? -1 : 1) * 0.5 * eo(seg(L, 0.2, 1.2)));
  camMove(x, [1.6, 1.4, 2.6], [-0.6, 1.2, -2.6], [1.1, 1.35, 1.8], [-0.6, 1.25, -2.6], eo, 42); hand(x, 0.6); x.post.tint.value.set(0.85, 0.9, 1.1);
});
// "No FNAF 4, você joga como uma criança terrorizada,"
at(162.82, 'fnaf4', x => {
  const s = bedroom(x, 0.6); const L = x.L; const c = put(x, 'cchild', s, -2.75, 0.62, -0.9, 1.25); c.legR.piv.rotation.x = -1.5; c.legL.piv.rotation.x = -1.5; c.root.position.y = 0.62 - 0.56 * 0.76 + 0.09;
  c.head.rotation.x = 0.25; c.head.rotation.y = 0.35 * Math.sin(x.t * 2.2); c.armR.piv.rotation.x = -1.2; c.armL.piv.rotation.x = -1.2; c.torso.rotation.z = 0.02 * Math.sin(x.t * 18);
  tears(x, c, 0.5 + 0.5 * seg(L, 0, 3));
  camMove(x, [-0.6, 1.35, 2.4], [-2.5, 0.95, -0.7], [-1.3, 1.2, 1.5], [-2.5, 1.0, -0.7], eio, 40); fillOn(x, c, 1.4, 1.2);
});
// "perseguida por pesadelos" — the band, twisted in the dark
at(166.24, 'nightmares', x => {
  const s = voidS(x, 10, 40, '#ff2a1a', 0.4); const L = x.L; s.fog = null;
  ['bonnie', 'freddy', 'chica', 'foxy'].forEach((n, i) => { const c = put(x, n, s, (i - 1.5) * 1.25, 0, -0.3 * Math.abs(i - 1.5), -(i - 1.5) * 0.15); c.idle(x.t, 1, i); twitch(c, x.t + i, 1.2); lookAtCam(x, c, 0.6); });
  x.C.freddy.setEyeGlow('#ff3020', 1); rimOn(x, s, [0, 3.8, -3], [0, 1.5, 0], 60, '#ff2a1a');
  camMove(x, [0, 1.2, 7.0], [0, 1.6, 0], [0, 1.4, 5.4], [0, 1.7, 0], eio, 36); x.post.tint.value.set(1.1, 0.8, 0.85); x.post.chroma.value = 0.4;
});
// "No final, o irmão mais velho e os amigos dele usando máscaras"
at(167.68, 'bullies', x => {
  const [s, f] = (() => { const s = diner(x, 0.8); const f = put(x, 'fredbear', s, 0, 0.77, -4.4, 0); f.idle(x.t, 1); return [s, f]; })(); const L = x.L;
  const m = put(x, 'michael', s, 0, 0, -1.6, 0), a = put(x, 'kid3', s, -0.85, 0, -1.4, 0.3, 1.2), b = put(x, 'kid4', s, 0.85, 0, -1.4, -0.3, 1.2);
  wearMask(x, m, 'foxy'); wearMask(x, a, 'freddy'); wearMask(x, b, 'bonnie');
  [m, a, b].forEach((k, i) => { k.idle(x.t, 1, i); k.root.position.y = Math.max(0, Math.sin(x.t * 6 + i * 2)) * 0.12; k.head.rotation.z = 0.15 * Math.sin(x.t * 4 + i); aim(k, i ? 'L' : 'R', rootPt(k, i === 2 ? -0.5 : 0.5, 1.8, 0.4), 0.5 + 0.3 * Math.sin(x.t * 6 + i)); });
  camMove(x, [0.6, 1.25, 2.2], [0, 1.2, -1.6], [0.3, 1.2, 1.2], [0, 1.25, -1.6], eo, 42); fillOn(x, m, 1.6, 1.6);
});
// "levantam o menino até a boca do Freddy" — on the stage, they lift him to Fredbear's mouth
function biteSetup(x, lift, bend) {
  const s = diner(x, 0.85); const f = put(x, 'fredbear', s, 0, 0.77, -4.8, 0); f.idle(x.t, 0.5); f.torso.rotation.x = 0.38 * bend; f.head.rotation.x = 0.25 * bend;
  const m = put(x, 'michael', s, -0.8, 0.77, -3.3, 1.3), a = put(x, 'kid3', s, 0.8, 0.77, -3.35, -1.3, 1.2); wearMask(x, m, 'foxy'); wearMask(x, a, 'freddy');
  const c = put(x, 'cchild', s, 0, 0, 0, 0); c.root.rotation.set(-Math.PI / 2, 0, 0); c.root.position.set(0, mix(1.9, 2.72, lift), mix(-2.2, -2.5, lift));
  c.armR.piv.rotation.z = -0.4 + 0.3 * Math.sin(x.t * 9); c.armL.piv.rotation.z = 0.4 - 0.3 * Math.sin(x.t * 9 + 1); c.legR.piv.rotation.x = 0.3 * Math.sin(x.t * 11); c.legL.piv.rotation.x = -0.3 * Math.sin(x.t * 11);
  aim(m, 'R', tp(c, 'torso', [0, 9, 0]), 1); aim(m, 'L', tp(c, 'legL', [0, -4, 0]), 1); aim(a, 'L', tp(c, 'torso', [0, 3, 0]), 1); aim(a, 'R', tp(c, 'legR', [0, -6, 0]), 1);
  return [s, f, c, m, a];
}
at(171.50, 'lift', x => {
  const L = x.L; const [s, f, c, m] = biteSetup(x, eo(seg(L, 0, 1.6)), eo(seg(L, 0.6, 2.0)));
  camMove(x, [2.2, 1.5, 0.9], [0, 2.2, -3.6], [1.8, 1.6, 0.4], [0, 2.4, -3.8], eo, 42); fillOn(x, f, 2, 2.4);
});
// "pra ele dar um beijo"
at(173.70, 'kiss', x => {
  const L = x.L; const [s, f, c, m] = biteSetup(x, 1, 1); m.head.rotation.z = 0.2 * Math.sin(x.t * 9);
  const hp = tp(f, 'head', [0, 3, 4]); camMove(x, [0.6, 3.1, -1.4], [0, 2.6, -4.0], [0.4, 3.0, -1.9], [0, 2.65, -4.05], eo, 42); fillOn(x, f, 1.5, 2.6);
});
// "A boca fecha," — the head slams down; red; black
at(174.86, 'crunch', x => {
  const L = x.L; const k = ei(seg(L, 0.12, 0.3)); const [s, f, c] = biteSetup(x, 1, 1); f.head.rotation.x += 0.45 * k; f.torso.rotation.x += 0.12 * k;
  const hp = tp(f, 'head', [0, 3, 4]); cam(x, [0.4, 3.0, -1.9], [0, 2.65, -4.05], 42); if (L > 0.3) shake(x, 1.2 * (1 - seg(L, 0.3, 1.0)));
  if (L > 0.3) { x.post.tint.value.set(1.5, 0.4, 0.4); x.post.flash.value = L < 0.4 ? 0.35 : 0; } x.post.fade.value = sm(seg(L, 0.9, 1.5)); x.post.chroma.value = 0.8 * k;
});
// "ele está morto" — on the floor, alone under one lamp
at(176.38, 'dead', x => {
  const s = voidS(x, 26, 0, '#ffffff', 0.4); const L = x.L; const c = lie(x, 'cchild', s, 0, 0, 0.2, 0.76); c.head.rotation.y = 0.6;
  camMove(x, [0.3, 2.6, 1.6], [0, 0.1, -0.2], [0.15, 2.2, 1.2], [0, 0.1, -0.2], eo, 40); x.post.tint.value.set(0.85, 0.85, 0.95); x.post.fade.value = 1 - seg(L, 0, 0.35);
});
// "Esse menino é o filho mais novo do William Afton"
at(177.40, 'youngest', x => {
  const s = voidS(x, 34, 12, '#9ab8ff', 2); const L = x.L; s.fog = null; const w = put(x, 'william', s, 0, 0, -0.9, 0); w.idle(x.t, 0.5); w.head.rotation.x = 0.55;
  const c = lie(x, 'cchild', s, 0, 0.3, 0.2, 0.76); c.head.rotation.y = 0.6;
  const a = mix(-0.5, 0.2, eio(x.u)); cam(x, [Math.sin(a) * 3.6, 1.6, 0.2 + Math.cos(a) * 3.6], [0, 0.8, -0.3], 38);
});
// "e o irmão que fez a brincadeira é o filho mais velho, o Michael" — the Foxy mask comes off
at(179.94, 'michael', x => {
  const s = voidS(x, 36, 14, '#ff6a3a', 2); const L = x.L; const m = put(x, 'michael', s, 0, 0, 0, 0); m.idle(x.t, 0.6);
  const off = eo(seg(L, 1.2, 2.4)); wearMask(x, m, 'foxy', off); aim(m, 'R', rootPt(m, -0.1, 1.85 + 0.15 * off, 0.45 + 0.1 * off), 1 - 0.5 * seg(L, 2.4, 3.2)); lookAtCam(x, m, off);
  const mk = MASKED[MASKED.length - 1][1]; if (off > 0.6) { mk.removeFromParent(); m.handR.add(mk); mk.position.set(0, -0.12, 0.15); mk.rotation.set(-1.2, 0, 0); mk.scale.setScalar(1.1 / 0.92); }
  const hp = tp(m, 'head', [0, 4, 4]); camMove(x, [0.5, 1.4, 3.8], [0, 1.4, 0], [hp.x + 0.2, hp.y - 0.05, hp.z + 1.6], hp.toArray(), eio, 36);
});
// "É aqui que a família Afton começa a apodrecer" — the family portrait loses its colour
at(183.34, 'rot', x => {
  const s = voidS(x, 40, 10, '#ffd0a0', 3); const L = x.L; s.fog = null; const k = sm(seg(L, 0.4, 2.8));
  const w = put(x, 'william', s, 0, 0, -0.4, 0), m = put(x, 'michael', s, -0.95, 0, 0, 0.2), e = put(x, 'elizabeth', s, 1.0, 0, 0.1, -0.2), c = put(x, 'cchild', s, 0.4, 0, 0.6, -0.1);
  [w, m, e, c].forEach((p, i) => { p.idle(x.t, 1, i); p.head.rotation.x = 0.35 * k; });
  x.S.voidSpot.intensity = 40 * (1 - 0.6 * k) * (k > 0.5 ? flicker(x.t, 5) : 1); x.post.tint.value.set(mix(1, 1.05, k), mix(1, 0.75, k), mix(1, 0.7, k));
  camMove(x, [0, 1.6, 3.6], [0, 1.2, 0], [0, 1.9, 5.2], [0, 1.2, 0], eio, 38);
});
// "O William tinha uma filha, a Elizabeth,"
at(186.30, 'daughter', x => {
  const s = voidS(x, 44, 10, '#ffb0d0', 3); const L = x.L; s.fog = null; const w = put(x, 'william', s, -0.45, 0, 0, 0.25), e = put(x, 'elizabeth', s, 0.45, 0, 0.1, -0.3); w.idle(x.t, 1); e.idle(x.t, 1, 2);
  const hand = rootPt(e, -0.55, 0.62, 0.15); aim(w, 'L', hand, 0.9); aim(e, 'R', hand, 0.9); lookAtCam(x, e, 0.8); w.head.rotation.y = -0.5; w.head.rotation.x = 0.3;
  camMove(x, [0.6, 1.3, 3.4], [0, 1.15, 0], [0.2, 1.25, 2.7], [0, 1.15, 0], eo, 38);
});
// "ele avisou pra ela nunca chegar perto da"
at(189.28, 'warned', x => {
  const s = voidS(x, 40, 10, '#ffb0d0', 3); const L = x.L; s.fog = null; const w = put(x, 'william', s, -0.5, 0, 0, 0.5), e = put(x, 'elizabeth', s, 0.5, 0, 0.2, -0.6); w.idle(x.t, 1); e.idle(x.t, 1, 2);
  aim(w, 'L', rootPt(w, 0.35, 1.55 + 0.08 * Math.sin(x.t * 14), 0.6), eo(seg(L, 0.1, 0.5))); w.head.rotation.x = 0.35; e.head.rotation.x = -0.25; e.head.rotation.y = 0.25 * Math.sin(x.t * 1.3);
  const a = mix(0.9, 0.5, eio(x.u)); cam(x, [Math.sin(a) * 3.2, 1.45, 0.1 + Math.cos(a) * 3.2], [0, 1.3, 0.1], 38);
});
// "circus baby" — Baby under the party lights
at(191.24, 'baby', x => {
  const s = partyR(x); const L = x.L; const b = put(x, 'baby', s, 0, 0, -3.0, 0); b.idle(x.t, 1); b.setEyes('#5aff6a'); lookAtCam(x, b, 0.8);
  camMove(x, [0.4, 1.4, 1.6], [0, 2.0, -3.0], [0.2, 1.6, 0.6], [0, 2.2, -3.0], eo, 42); fillOn(x, b, 2, 2.6); if (L < 0.06) x.post.flash.value = 0.15;
});
// "Mas ela chegou" — Elizabeth walks up to her
at(191.84, 'but_she', x => {
  const s = partyR(x); const L = x.L; const b = put(x, 'baby', s, 0, 0, -3.0, 0); b.idle(x.t, 1); b.setEyes('#5aff6a'); b.head.rotation.x = 0.3;
  const e = put(x, 'elizabeth', s, 0, 0, 0, Math.PI); walkTo(e, [0.4, 0, 0.6], [0.1, 0, -1.7], eo(seg(L, 0, 1.2)), 0.5);
  camMove(x, [1.0, 1.0, 2.6], [0, 1.6, -2.4], [0.7, 1.1, 1.9], [0, 1.7, -2.6], eo, 42); fillOn(x, b, 1.5, 2.4);
});
// "A baby ofereceu um sorvete" — an ice cream held out in her hand
function babyScene(x, opts = {}) { const s = partyR(x); const b = put(x, 'baby', s, 0, 0, -3.0, 0); b.idle(x.t, 1); b.setEyes('#5aff6a'); b.head.rotation.x = 0.35;
  const e = put(x, 'elizabeth', s, 0.05, 0, -1.75 + (opts.pull || 0) * -0.7, Math.PI); e.idle(x.t, 1); e.head.rotation.x = -0.3; return [s, b, e]; }
at(193.06, 'icecream', x => {
  const L = x.L; const [s, b, e] = babyScene(x); const k = eo(seg(L, 0.1, 0.8)); aim(b, 'R', rootPt(b, -0.25, 1.15, 0.75), k); b.root.updateMatrixWorld(true);
  s.add(ICE); ICE.position.copy(b.handR.getWorldPosition(new V3())).add(new V3(0, 0.12, 0)); ICE.rotation.set(0, 0, 0); ICE.scale.setScalar(1.2);
  aim(e, 'R', ICE.position, eo(seg(L, 1.0, 1.6)) * 0.7);
  camMove(x, [2.9, 1.5, -1.0], [0, 1.3, -2.4], [2.5, 1.45, -1.3], [0, 1.3, -2.4], eo, 40); fillOn(x, b, 1.8, 2.2);
});
// "e puxou a menina pra dentro" — the belly opens, the claw takes her
at(195.00, 'pulled', x => {
  const L = x.L; const open = eo(seg(L, 0, 0.4)), ext = eo(seg(L, 0.35, 0.75)), grip = eo(seg(L, 0.75, 0.9)), back_ = ei(seg(L, 1.0, 1.4));
  const [s, b, e] = babyScene(x); b.setClaw(open, ext * (1 - back_), grip); e.root.position.z = mix(-1.75, -2.6, back_); e.root.position.y = 0.15 * back_; e.root.visible = L < 1.42;
  e.armR.piv.rotation.x = -1.2 * grip; e.armL.piv.rotation.x = -1.2 * grip; if (L > 1.4) { b.setClaw(1 - eo(seg(L, 1.4, 1.7)), 0, 0); }
  camMove(x, [2.9, 1.45, -1.1], [0, 1.25, -2.5], [2.6, 1.4, -1.4], [0, 1.25, -2.5], eo, 40); fillOn(x, b, 1.8, 2.2); if (L > 1.4 && L < 1.5) { x.post.flash.value = 0.25; shake(x, 0.4); }
});
// "Agora repara no detalhe que dá calafrio" — Baby's face, cold light
at(196.84, 'detail', x => {
  const s = partyR(x); const L = x.L; const b = put(x, 'baby', s, 0, 0, -3.0, 0); b.idle(x.t, 0.5); b.setEyes('#5aff6a'); lookAtCam(x, b, 1);
  const hp = tp(b, 'head', [0, 4, 4]); camMove(x, [hp.x + 0.5, hp.y - 0.2, hp.z + 2.3], hp.toArray(), [hp.x + 0.15, hp.y - 0.05, hp.z + 1.3], hp.toArray(), eio, 34); fillOn(x, b, 1.2, 2.6);
  x.post.tint.value.set(0.85, 0.95, 1.15);
});
// "Ela foi projetada pelo próprio William"
at(199.08, 'designed', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 0.85; const L = x.L; const b = put(x, 'baby', s, 1.4, 0, -2.6, -0.5); b.setEyes('#2a2a2a'); b.head.rotation.x = 0.4; droop(b, 0.4);
  const w = put(x, 'william', s, -0.3, 0, -1.5, 2.1); w.idle(x.t, 0.8); aim(w, 'R', tp(b, 'torso', [0, 6, 3]), 0.8 + 0.1 * Math.sin(x.t * 8)); w.head.rotation.x = 0.2;
  camMove(x, [1.5, 1.65, 1.6], [0.6, 1.4, -2.1], [1.2, 1.6, 1.2], [0.6, 1.4, -2.1], eo, 42); x.S.shopLamp.intensity = 14; fillOn(x, w, 1.5, 1.8);
});
// "pra atrair e capturar crianças" — the claw reaches out for a kid
at(201.74, 'lure', x => {
  const s = partyR(x); const L = x.L; const b = put(x, 'baby', s, 0, 0, -3.0, 0.15); b.idle(x.t, 1); b.setEyes('#5aff6a'); b.head.rotation.x = 0.3;
  b.setClaw(eo(seg(L, 0, 0.3)), 0.6 + 0.2 * Math.sin(x.t * 3), 0.2); const k = put(x, 'kid1', s, 0.4, 0, -1.4, Math.PI + 0.3); k.idle(x.t, 1); k.head.rotation.x = -0.35;
  const a = mix(0.9, 0.6, eio(x.u)); cam(x, [Math.sin(a) * 3.0, 1.2, -2.4 + Math.cos(a) * 3.0], [0, 1.2, -2.4], 40); x.post.tint.value.set(0.9, 1.0, 1.05);
});
// "O monstro que ele criou matou a filha dele" — William on his knees in front of her
at(203.36, 'killed', x => {
  const s = voidS(x, 18, 40, '#ff2a1a', 0.6); const L = x.L; s.fog = null; const b = put(x, 'baby', s, 0, 0, -1.6, 0); b.idle(x.t, 0.4); b.setEyes('#5aff6a'); b.head.rotation.x = 0.35;
  const w = put(x, 'william', s, 0, 0, 0.4, Math.PI); kneel(w, eo(seg(L, 0.2, 0.8))); w.head.rotation.x = 0.5; aim(w, 'R', rootPt(w, 0.1, 1.55, 0.35), eo(seg(L, 0.6, 1.2)));
  rimOn(x, s, [0, 3.8, -3.2], [0, 1.6, -1.6], 70, '#ff2a1a'); camMove(x, [3.4, 1.3, 1.4], [0, 1.4, -0.6], [2.8, 1.35, 1.0], [0, 1.5, -0.6], eo, 38); fillOn(x, w, 1.0, 1.4);
});
// "As fantasias com trava de mola podiam ser usadas por pessoas,"
at(205.90, 'springlocks', x => {
  const s = diner(x, 0.9); const L = x.L; const sb = put(x, 'springbonnie', s, -0.6, 0, -2.2, 0.3); sb.idle(x.t, 0.4); const w = put(x, 'william', s, 0.6, 0, -1.9, -0.4); w.idle(x.t, 1); lookAtCam(x, w, 0.6);
  aim(w, 'R', tp(sb, 'torso', [0, 8, 2]), eo(seg(L, 0.6, 1.2))); x.setXray(sb, 0.8 * sm(seg(L, 1.6, 2.4)), 0.4, '#ffd040');
  camMove(x, [0.4, 1.6, 2.0], [0, 1.6, -2.1], [0.2, 1.6, 1.0], [0, 1.65, -2.1], eo, 40); fillOn(x, sb, 1.5, 2.2);
});
// "mas eram instáveis" — the locks shiver
at(209.58, 'unstable', x => {
  const s = voidS(x, 30, 20, '#ffd040', 2); const L = x.L; const sb = put(x, 'springbonnie', s, 0, 0, 0, 0); sb.idle(x.t, 0.4); x.setXray(sb, 0.85, 0.5 + 0.5 * Math.sin(x.t * 20), '#ffd040');
  sb.root.position.x = 0.012 * Math.sin(x.t * 70); const tp_ = tp(sb, 'torso', [0, 7, 0]); camMove(x, [tp_.x + 0.8, tp_.y + 0.2, tp_.z + 3.0], tp_.toArray(), [tp_.x + 0.4, tp_.y + 0.2, tp_.z + 2.3], tp_.toArray(), eo, 38);
});
// "Era um pouco de umidade, um movimento brusco"
at(210.82, 'humidity', x => {
  const s = voidS(x, 30, 16, '#6ab0ff', 2); const L = x.L; const sb = put(x, 'springbonnie', s, 0, 0, 0, 0); sb.idle(x.t, 0.4); x.setXray(sb, 0.5, 0.3, '#ffd040'); rain(x, s, 0, 0); RAIN.group.scale.set(1, 1, 1);
  const j = eo(seg(L, 2.0, 2.15)) * (1 - seg(L, 2.15, 2.6)); sb.torso.rotation.z = 0.35 * j; sb.head.rotation.z = -0.3 * j; sb.armR.piv.rotation.z = -0.6 * j; if (L > 2.0 && L < 2.4) shake(x, 0.4);
  const a = mix(-0.5, 0.3, eio(x.u)); cam(x, [Math.sin(a) * 3.4, 1.7, Math.cos(a) * 3.4], [0, 1.5, 0], 38); x.post.tint.value.set(0.85, 0.95, 1.1);
});
// "e as travas soltavam, perfurando quem estivesse dentro"
at(213.66, 'snap', x => {
  const s = voidS(x, 26, 40, '#ff2a1a', 1); const L = x.L; const sb = put(x, 'springbonnie', s, 0, 0, 0, 0); x.setXray(sb, 0.85, Math.max(0, Math.sin(x.t * 25)), '#ff3a2a');
  const hits = [0.2, 0.5, 0.75, 1.1, 1.5]; let h = 0; hits.forEach(a => { const d = L - a; if (d > 0 && d < 0.15) h = 1 - d / 0.15; });
  sb.torso.rotation.x = 0.15 * h; sb.head.rotation.x = -0.3 * h; sb.armR.piv.rotation.z = -0.4 * h; sb.armL.piv.rotation.z = 0.4 * h; if (h > 0.5) { shake(x, 0.5 * h); x.post.flash.value = 0.1 * h; }
  sparksAt(x, s, tp(sb, 'torso', [0, 7, 3]), (L % 0.5) * 1.6); drips(x, sb, seg(L, 0.6, 2.6), [[-2.0, 3.4], [2.0, 3.4]], 3.2);
  const hp = tp(sb, 'head', [0, 0, 4]); camMove(x, [0.5, 1.8, 3.2], [0, 1.6, 0], [0.25, hp.y - 0.2, 2.2], [0, hp.y - 0.4, 0], eo, 38); x.post.tint.value.set(1.15, 0.85, 0.85);
});
// "William foi se esconder dos espíritos das crianças que ele matou"
at(216.64, 'ghosts', x => {
  const s = hall(x, 0.7, '#c0d0ff'); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); walkTo(w, [0.0, 0, -3.0], [0.1, 0, -0.6], eo(seg(L, 0, 2.6)), 0.9); w.walk(-L * 2.4, 1); lookAtCam(x, w, 0); w.head.rotation.y = 0.3 * Math.sin(x.t * 3);
  for (let i = 0; i < 5; i++) { const gz = mix(-8.0, -4.2, eo(seg(L, 0, 2.6))) - Math.abs(i - 2) * 0.5; ghostKid(x, i, s, [(i - 2) * 0.5, 0.15 + 0.1 * Math.sin(x.t * 2 + i), gz], 0, 0.6); }
  camMove(x, [0.5, 1.5, 3.2], [0, 1.4, -3], [0.3, 1.6, 2.0], [0, 1.4, -3], eo, 40); fillOn(x, w, 1.5, 1.8);
});
// "dentro da fantasia." — he slips into the Spring Bonnie suit; the head turns
at(219.42, 'into_suit', x => {
  const s = voidS(x, 28, 18, '#9ad8ff', 1.5); const L = x.L; const sb = put(x, 'springbonnie', s, 0, 0, 0, 0); sb.idle(x.t, 0.4);
  const w = put(x, 'william', s, 0, 0, 0, 0); walkTo(w, [-1.2, 0, 0.6], [0, 0, 0], eo(seg(L, 0, 1.0)), 0.8); w.root.rotation.y = 1.3; w.root.visible = L < 1.0;
  if (L > 1.0) { sb.head.rotation.y = 0.35 * eo(seg(L, 1.3, 1.8)); lookAtCam(x, sb, eo(seg(L, 1.3, 1.8))); }
  camMove(x, [0.8, 1.5, 4.2], [0, 1.5, 0], [0.4, 1.6, 3.4], [0, 1.6, 0], eo, 38); fillOn(x, sb, 1.2, 2.2);
});
// "E as travas soltaram," — the ghosts watch while the locks fire
at(221.62, 'locks_fire', x => {
  const s = voidS(x, 22, 46, '#ff2a1a', 1); const L = x.L; s.fog = null; const sb = put(x, 'springbonnie', s, 0, 0, 0, 0); x.setXray(sb, 0.6, Math.max(0, Math.sin(x.t * 30)), '#ff3a2a');
  const j = Math.sin(x.t * 40) * (1 - seg(L, 1.2, 1.7)); sb.torso.rotation.z = 0.12 * j; sb.head.rotation.x = -0.25 + 0.15 * j; aim(sb, 'R', rootPt(sb, -0.5, 2.2, 0.4), 0.8); aim(sb, 'L', rootPt(sb, 0.6, 1.9, 0.5), 0.7);
  for (let i = 0; i < 5; i++) ghostKid(x, i, s, [(i - 2) * 1.0 + (i < 2 ? -0.6 : i > 2 ? 0.6 : 0), 0, i === 2 ? -1.4 : 0.9 - Math.abs(i - 2) * 0.4], i === 2 ? 0 : Math.PI + (i < 2 ? -0.6 : 0.6), 0.5);
  if (L % 0.3 < 0.05) x.post.flash.value = 0.12; cam(x, [0.3, 2.1, 5.2], [0, 1.4, 0], 40); shake(x, 0.25);
});
// "ele morreu do jeito mais lento e doloroso possível"
at(223.32, 'died_slow', x => {
  const s = voidS(x, 16, 30, '#ff2a1a', 0.5); const L = x.L; s.fog = null; const sb = put(x, 'springbonnie', s, 0, 0, 0, 0); const k = eio(seg(L, 0, 1.8));
  sb.root.position.y = -(sb.hipY - 2 * U16) * sb.root.scale.x * k; sb.legR.piv.rotation.x = -1.5 * k; sb.legL.piv.rotation.x = -1.5 * k; sb.head.rotation.x = 0.5 * k; sb.head.rotation.z = 0.22 * k; sb.armR.piv.rotation.z = -0.3 * k; sb.armL.piv.rotation.z = 0.3 * k;
  drips(x, sb, 0.5 + 0.5 * seg(L, 0, 2.5), [[-2.0, 3.4], [2.0, 3.4], [-0.6, 1.0], [0.6, 1.0]], 3.6);
  for (let i = 0; i < 5; i++) ghostKid(x, i, s, [(i - 2) * 0.9, 0.2 * seg(L, 1, 2.6), 1.5 + Math.abs(i - 2) * 0.3], Math.PI, 0.5 * (1 - sm(seg(L, 1.2, 2.4))));
  camMove(x, [0.6, 2.2, 3.4], [0, 0.9, 0], [0.3, 1.6, 2.4], [0, 0.7, 0], eio, 38); x.post.tint.value.set(1.1, 0.85, 0.85);
});
// "Só que ele não ficou morto" — the slumped suit opens its eyes
at(225.96, 'not_dead', x => {
  const s = voidS(x, 8, 20, '#7aff5a', 0.4); const L = x.L; const c = put(x, 'spring', s, 0, 0, 0, 0); slump(c, 1); twitch(c, x.t, sm(seg(L, 1.0, 1.6)));
  c.head.rotation.x = mix(0.5, 0.15, eo(seg(L, 1.1, 1.6))); const hp = tp(c, 'head', [0, 4, 4]);
  camMove(x, [hp.x + 0.4, hp.y + 0.1, hp.z + 1.9], hp.toArray(), [hp.x + 0.15, hp.y, hp.z + 1.2], hp.toArray(), eio, 34); keyOn(x, s, [0.8, 3, 2.5], hp.toArray(), 6 + 10 * sm(seg(L, 1.1, 1.4)), 0.35);
  if (L > 1.1 && L < 1.2) x.post.flash.value = 0.15;
});
// "30 anos depois, ele voltou como Springtrap"
at(227.68, 'springtrap', x => {
  const s = fright(x, 0.6); const L = x.L; const c = put(x, 'spring', s, 0, 0, -6.0, 0); const k = eo(seg(L, 0.0, 1.5));
  c.root.position.y = -0.25 * (1 - k); c.torso.rotation.x = 1.1 * (1 - k); c.legR.piv.rotation.x = -1.4 * (1 - k); c.legL.piv.rotation.x = -1.2 * (1 - k); c.head.rotation.x = 0.5 * (1 - k); twitch(c, x.t, 1.2);
  if (L > 1.5) { walkTo(c, [0, 0, -6.0], [0, 0, -4.8], eo(seg(L, 1.5, 2.84)), 1.1); lookAtCam(x, c, 0.7); }
  camMove(x, [0.6, 0.7, -3.0], [0, 1.0, -6], [0.3, 1.4, -2.6], [0, 1.9, -5.4], eio, 44); fillOn(x, c, 2, 1.8);
});
// "A carne dele ainda tá lá dentro, presa ao metal" — X-ray: the body inside the suit
at(230.52, 'flesh', x => {
  const s = voidS(x, 30, 30, '#ff3a2a', 1); const L = x.L; const c = put(x, 'spring', s, 0, 0, 0, 0); c.idle(x.t, 0.5); x.setXray(c, 0.75 * sm(seg(L, 0.2, 0.9)), 0.4, '#ff4040');
  const g = put(x, 'gWilliam', s, 0, 0.12, 0, 0); g.idle(x.t, 0.5); g.ghostMat.opacity = 0.45 * sm(seg(L, 0.4, 1.0));
  const a = mix(0.6, -0.3, eio(x.u)); cam(x, [Math.sin(a) * 3.6, 1.7, Math.cos(a) * 3.6], [0, 1.6, 0], 38); x.post.tint.value.set(1.12, 0.88, 0.88);
});
// "Num dos minijogos do FNAF 3, tem uma criança sozinha na chuva, do lado de fora da pizzaria" — 8-bit look
at(233.16, 'rain_mini', x => {
  const s = facade(x, 1.0); const L = x.L; x.post.pix.value = PIX(x) * 0.55; const k = put(x, 'charlotte', s, 0.4, 0, 2.2, 0.15); k.idle(x.t, 1); k.head.rotation.x = 0.4;
  k.armR.piv.rotation.x = -1.2; k.armL.piv.rotation.x = -1.2; k.armR.piv.rotation.z = 0.5; k.armL.piv.rotation.z = -0.5; k.torso.rotation.x = 0.1 + 0.03 * Math.sin(x.t * 9);
  x.S.inLamps.forEach(l => l.intensity = 10); x.S.facadeHemi.intensity = 1.6; cam(x, [0.3, 1.7, mix(9.4, 8.0, eio(x.u))], [0.2, 1.5, 1.0], 40); x.post.vig.value = 0.7; x.post.grain.value = 0; x.S.streetLamp.intensity = 40;
});
at(235.54, 'rain_kid', x => {
  const s = facade(x, 0.4); const L = x.L; const k = put(x, 'charlotte', s, 0.4, 0, 2.2, 0.15); k.idle(x.t, 1); k.head.rotation.x = 0.45;
  k.armR.piv.rotation.x = -1.2; k.armL.piv.rotation.x = -1.2; k.armR.piv.rotation.z = 0.5; k.armL.piv.rotation.z = -0.5; k.torso.rotation.x = 0.1 + 0.03 * Math.sin(x.t * 9); tears(x, k, 0.8);
  const hp = tp(k, 'head', [0, 4, 4]); camMove(x, [hp.x + 1.4, hp.y + 0.1, hp.z + 2.6], hp.toArray(), [hp.x + 0.8, hp.y, hp.z + 1.7], hp.toArray(), eio, 36); rain(x, s, 0.4, 3); fillOn(x, k, 1.2, 1.4); x.S.streetLamp.intensity = 40;
});
// "Essa criança era a filha do Henry,"
at(238.80, 'henry_daughter', x => {
  const s = diner(x); const L = x.L; const h = put(x, 'henry', s, -0.4, 0, -1.6, 0.4), c = put(x, 'charlotte', s, 0.4, 0, -1.4, -0.3); h.idle(x.t, 1); c.idle(x.t, 1, 2);
  aim(h, 'L', tp(c, 'head', [0, 9, 0]), 0.8); h.head.rotation.x = 0.35; h.head.rotation.y = -0.4; lookAtCam(x, c, 0.8); c.root.position.y = Math.max(0, Math.sin(x.t * 5)) * 0.06;
  camMove(x, [0.5, 1.3, 1.6], [0, 1.15, -1.5], [0.2, 1.25, 0.8], [0, 1.15, -1.5], eo, 40); fillOn(x, c, 1.4, 1.5);
});
// "o sócio e o melhor amigo do assassino"
at(241.04, 'partner', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 0.85; const L = x.L; const h = put(x, 'henry', s, -0.6, 0, -1.4, 0.35), w = put(x, 'william', s, 0.6, 0, -1.4, -0.35); h.idle(x.t, 1); w.idle(x.t, 1, 2);
  aim(h, 'L', tp(w, 'armR', [0, -1, 0]), 0.8); lookAtCam(x, h, 0.6); w.head.rotation.y = 0.5 * eo(seg(L, 0.8, 1.3)); w.head.rotation.x = 0.1;
  camMove(x, [0.2, 1.6, 1.6], [0, 1.5, -1.4], [0.0, 1.65, 0.9], [0.2, 1.6, -1.4], eo, 40); x.S.shopLamp.intensity = 14; fillOn(x, w, 1.4, 1.8);
});
// "Segundo a lore, ela foi a primeira" — the alley behind the pizzeria, in the rain
at(242.94, 'first', x => {
  const s = x.S.alley; x.out.scene = s; x.post.vig.value = 1.0; const L = x.L; const c = lie(x, 'charlotte', s, 0.4, -4.2, -0.4, 0.76);
  const p = put(x, 'purpleguy', s, 0, 0, 0, Math.PI); walkTo(p, [-0.2, 0, -5.4], [-0.3, 0, -8.6], seg(L, 0, 2.36), 0.9); p.root.rotation.y = Math.PI;
  camMove(x, [0.6, 1.8, -0.8], [0, 0.6, -5], [0.4, 1.6, -1.8], [0, 0.5, -5], eo, 42); rain(x, s, 0, -4); x.post.tint.value.set(0.85, 0.9, 1.05);
});
// "e o espírito dela foi parar dentro da marionete"
at(245.30, 'puppet_soul', x => {
  const s = x.S.prize; x.out.scene = s; x.post.vig.value = 0.9; const L = x.L; const p = put(x, 'puppet', s, -0.6, 0, -1.4, 0.3); p.idle(x.t, 1);
  const k = eio(seg(L, 0.1, 1.6)); const g = put(x, 'gCharlotte', s, mix(1.2, -0.6, k), mix(0.2, 0.6, k), mix(0.4, -1.3, k), -1.0); g.ghostMat.opacity = 0.55 * (1 - seg(L, 1.4, 1.9)); g.idle(x.t, 1);
  if (L > 1.6) { lookAtCam(x, p, eo(seg(L, 1.7, 2.2))); } if (L > 1.55 && L < 1.65) x.post.flash.value = 0.12;
  camMove(x, [1.2, 1.7, 2.4], [-0.2, 1.6, -1.2], [0.8, 1.75, 1.7], [-0.4, 1.7, -1.3], eo, 42); fillOn(x, p, 1.3, 2.2);
});
// "Aquela que dava presentes e dava vida" — the gift box opens
at(247.82, 'gifts', x => {
  const s = x.S.prize; x.out.scene = s; x.post.vig.value = 0.9; const L = x.L; x.S.giftLid.rotation.x = -1.95 * eo(seg(L, 0.1, 0.7));
  const p = put(x, 'puppet', s, 1.8, 0, -1.6, 0); p.root.position.y = mix(-1.6, 0, eo(seg(L, 0.4, 1.5))); p.idle(x.t, 1); lookAtCam(x, p, 0.7);
  aim(p, 'R', rootPt(p, -0.9, 1.6, 0.6), eo(seg(L, 1.4, 1.9))); aim(p, 'L', rootPt(p, 0.9, 1.6, 0.6), eo(seg(L, 1.4, 1.9))); sparkles(x, s, [1.8, 2.0, -1.2], 0.7, 8, 0.6 * seg(L, 1.4, 1.8));
  camMove(x, [1.3, 1.6, 1.8], [1.8, 1.6, -1.6], [1.6, 1.8, 1.0], [1.8, 1.8, -1.6], eo, 42); fillOn(x, p, 1.3, 2.4);
});
// "Aquele minigame do FNAF 2 em que ela põe máscara nas crianças mortas"
at(250.32, 'gg', x => {
  const s = x.S.gg; x.out.scene = s; s.background.set('#2c2c50'); x.post.pix.value = PIX(x); const L = x.L; const names = ['freddy', 'bonnie', 'chica', 'foxy'];
  const spots = [[-2.2, -1.0], [-0.7, -1.6], [0.8, -1.6], [2.3, -1.0]];
  spots.forEach(([px, pz], i) => { const k = lie(x, 'kid' + i, s, px, pz, 0.2 * (i - 1.5), 0.74); if (L > 0.6 + i * 0.75) wearMask(x, k, names[i]); });
  const i = Math.min(3, Math.floor(Math.max(0, L - 0.2) / 0.75)); const p = put(x, 'puppet', s, 0, 0, 0, 0); const sp = spots[i]; const ph = (Math.max(0, L - 0.2) % 0.75) / 0.75;
  p.root.position.set(sp[0] + 0.35, 0.05 * Math.sin(x.t * 3), sp[1] - 0.6); p.root.rotation.y = -0.3; p.idle(x.t, 1); aim(p, 'R', new V3(sp[0], 0.3, sp[1]), Math.sin(ph * Math.PI));
  cam(x, [mix(-0.3, 0.3, x.u), 4.0, 3.6], [0, 0.4, -0.9], 46); x.post.vig.value = 0.6; x.post.grain.value = 0;
});
// "Ela não estava enfeitando ninguém,"
at(254.36, 'not_decorating', x => {
  const s = voidS(x, 12, 20, '#c8d0ff', 1.2); const L = x.L; const p = put(x, 'puppet', s, 0, 0, 0, 0); p.idle(x.t, 0.8); p.head.rotation.y = 0.35 * Math.sin(x.t * 4) * seg(L, 0.4, 0.8); lookAtCam(x, p, 0.6);
  const hp = tp(p, 'head', [0, 4, 4]); camMove(x, [hp.x + 0.4, hp.y - 0.2, hp.z + 2.4], hp.toArray(), [hp.x + 0.15, hp.y - 0.1, hp.z + 1.6], hp.toArray(), eio, 34);
});
// "tava dando corpos novos a elas" — the ghosts become the band
at(256.70, 'new_bodies', x => {
  const s = voidS(x, 40, 18, '#9ad8ff', 3); const L = x.L; s.fog = null;
  ['foxy', 'bonnie', 'freddy', 'chica'].forEach((n, i) => { const px = (i - 1.5) * 1.4; const k = sm(seg(L, 0.3 + i * 0.25, 0.9 + i * 0.25));
    ghostKid(x, i, s, [px, 0, 0.2], 0, 0.55 * (1 - k)); const c = put(x, n, s, px, 0, 0, -(i - 1.5) * 0.1); c.idle(x.t, 1, i); c.root.visible = k > 0.05; c.root.scale.setScalar(c.baseScale * mix(0.6, 1, back(k))); if (k > 0 && k < 1) x.post.chroma.value = 0.5; });
  camMove(x, [0, 1.5, 7.0], [0, 1.3, 0], [0, 1.6, 6.0], [0, 1.4, 0], eo, 36);
});
// "E foi aí que tudo começou a ficar estranho,"
at(258.64, 'strange', x => {
  const s = hall(x, 1.0, '#c0ffd0'); const L = x.L; const f = put(x, 'freddy', s, 0, 0, -4.4, 0); f.idle(x.t, 0.5); twitch(f, x.t, 1); if (Math.sin(x.t * 7) > 0.8) glitchIn(x, f, 0.8);
  camMove(x, [0.4, 1.7, 0.6], [0, 1.9, -4.4], [0.2, 1.9, -1.6], [0, 2.0, -4.4], eo, 40); x.camera.rotateZ(mix(0, 0.12, eio(x.u))); x.post.chroma.value = 0.3; fillOn(x, f, 1.5, 2.2);
});
// "porque o espírito não deveria conseguir viver dentro do metal" — a weak, flickering soul inside the endoskeleton
at(261.52, 'not_live', x => {
  const s = voidS(x, 22, 20, '#9ad8ff', 1); const L = x.L; const f = put(x, 'freddy', s, 0, 0, 0, 0); f.idle(x.t, 0.4); x.setXray(f, 0.85, 0.2, '#9ad8ff');
  const ch = tp(f, 'torso', [0, 6, 1]); const fl = 0.5 + 0.5 * Math.sin(x.t * 13) * Math.sin(x.t * 3.1); const o = orbAt(x, 0, s, ch, 0.3 * (0.4 + 0.6 * fl) * (1 - 0.6 * seg(L, 1.5, 2.9)));
  camMove(x, [ch.x + 0.6, ch.y + 0.2, ch.z + 3.4], ch.toArray(), [ch.x + 0.3, ch.y + 0.1, ch.z + 2.3], ch.toArray(), eio, 36);
});
// "A não ser que tivesse alguma coisa ajudando" — something glowing in a tank
at(264.56, 'unless', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 1.0; const L = x.L; x.S.shopLamp.intensity = 3; const t = tankAt(x, s, [-1.5, 1.01, -3.2], 0.7 + 0.05 * Math.sin(x.t * 2), 1.4);
  t.userData.bits.forEach((b, i) => { const a = x.t * 2 + i * 0.45; b.visible = true; b.position.set(Math.cos(a) * 0.2, 0.35 + ((i * 0.07 + x.t * 0.2) % 0.8), Math.sin(a) * 0.2); });
  const c = t.position; camMove(x, [c.x + 1.6, c.y + 0.9, c.z + 3.2], [c.x, c.y + 0.7, c.z], [c.x + 0.4, c.y + 0.8, c.z + 1.4], [c.x, c.y + 0.75, c.z], eio, 42);
});

// ================================ PART 3: CAMADA 3 — O ESCURO ================================
// Fazbear Entertainment files desk (all real 3D: desk, folders, papers, stamp, books, lamp) — lives in the void scene
const FILES = (() => { const g = new THREE.Group(); const M = (c, r = 0.7, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const B = (w, h, d, mat, x, y, z, p = g) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; p.add(b); return b; };
  const wood = M('#4a2e1c', 0.6); B(2.6, 0.08, 1.2, wood, 0, 0.94, 0); for (const sx of [-1.2, 1.2]) for (const sz of [-0.5, 0.5]) B(0.08, 0.92, 0.08, wood, sx, 0.46, sz);
  B(2.5, 0.5, 0.05, wood, 0, 0.66, -0.55);
  const folderM = [M('#c8a868'), M('#b89858'), M('#d2b478')]; const paper = M('#eeeae0', 0.9); const r = rng(77);
  for (let i = 0; i < 9; i++) { const f = B(0.42, 0.025, 0.32, folderM[i % 3], -0.9 + r() * 0.5, 0.995 + i * 0.026, -0.25 + r() * 0.2); f.rotation.y = (r() - 0.5) * 0.4; }
  for (let i = 0; i < 6; i++) { const p = B(0.3, 0.004, 0.4, paper, 0.1 + r() * 0.6, 0.985 + i * 0.002, 0.05 + r() * 0.25); p.rotation.y = (r() - 0.5) * 0.9; }
  // open folder (animated): cover pivot + photo + red stamp marks
  const of = new THREE.Group(); of.position.set(0.2, 0.99, 0.1); g.add(of); B(0.42, 0.012, 0.32, folderM[0], 0.21, 0, 0, of); const pp = B(0.3, 0.004, 0.26, paper, 0.21, 0.01, 0, of);
  B(0.1, 0.005, 0.12, M('#3a3a44'), 0.12, 0.014, -0.05, of); for (let i = 0; i < 5; i++) B(0.14, 0.004, 0.012, M('#5a5a66'), 0.27, 0.014, -0.08 + i * 0.03, of);
  const stampMark = B(0.16, 0.005, 0.06, new THREE.MeshStandardMaterial({ color: '#c01818', roughness: 0.8, transparent: true, opacity: 0.9 }), 0.24, 0.016, 0.09, of); stampMark.rotation.y = 0.25;
  const cover = new THREE.Group(); of.add(cover); B(0.42, 0.012, 0.32, folderM[0], -0.21, 0, 0, cover); g.userData.cover = cover; g.userData.mark = stampMark;
  // rubber stamp
  const st = new THREE.Group(); g.add(st); B(0.1, 0.05, 0.06, M('#8a1010', 0.5), 0, 0.025, 0, st); B(0.03, 0.09, 0.03, M('#2a1a10'), 0, 0.09, 0, st); const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), M('#2a1a10')); knob.position.y = 0.15; st.add(knob); g.userData.stamp = st;
  // books
  const bookC = ['#7a1a1a', '#1a3a6a', '#2a5a2a', '#5a3a1a'];
  for (let i = 0; i < 4; i++) { const b = B(0.34, 0.07, 0.26, M(bookC[i]), -0.3 + i * 0.02, 1.02 + i * 0.07, 0.3, g); b.rotation.y = 0.2 * (i % 2 ? 1 : -1); }
  const ob = new THREE.Group(); ob.position.set(0.8, 0.985, 0.25); g.add(ob); const pageL = new THREE.Group(), pageR = new THREE.Group(); ob.add(pageL, pageR);
  B(0.24, 0.03, 0.32, M('#7a1a1a'), -0.12, 0, 0, pageL); B(0.22, 0.02, 0.3, paper, -0.12, 0.02, 0, pageL); B(0.24, 0.03, 0.32, M('#7a1a1a'), 0.12, 0, 0, pageR); B(0.22, 0.02, 0.3, paper, 0.12, 0.02, 0, pageR);
  for (let i = 0; i < 6; i++) { B(0.16, 0.003, 0.01, M('#555'), -0.12, 0.032, -0.1 + i * 0.04, pageL); B(0.16, 0.003, 0.01, M('#555'), 0.12, 0.032, -0.1 + i * 0.04, pageR); }
  g.userData.book = [pageL, pageR];
  // desk lamp
  const lp = new THREE.Group(); lp.position.set(-1.0, 0.98, -0.35); g.add(lp); B(0.2, 0.03, 0.2, M('#1a3a2a', 0.4, 0.5), 0, 0, 0, lp); const arm = B(0.03, 0.5, 0.03, M('#1a3a2a', 0.4, 0.5), 0, 0.25, 0, lp); const sh = B(0.32, 0.12, 0.16, M('#1a5a3a', 0.4, 0.4), 0.12, 0.52, 0.05, lp);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff2c0', toneMapped: false })); bulb.position.set(0.12, 0.46, 0.05); lp.add(bulb);
  const L = new THREE.SpotLight('#ffe2a8', 12, 4, 0.9, 0.6, 1.2); L.position.set(-0.88, 1.44, -0.3); L.target.position.set(0.2, 0.95, 0.15); L.castShadow = true; L.shadow.mapSize.set(1024, 1024); L.shadow.bias = -0.002; g.add(L, L.target); g.userData.lamp = L;
  return g; })();
EXTRA.push(FILES);
function files(x, red = 0) { const s = voidS(x, 0, 0, '#ff2a1a', 0.8); s.add(FILES); FILES.userData.lamp.intensity = 12; x.S.voidRim.intensity = 30 * red; x.S.voidRim.color.set('#ff2a1a');
  FILES.userData.cover.rotation.z = 0; FILES.userData.stamp.position.set(0.55, 0.98, -0.3); FILES.userData.mark.visible = false; FILES.userData.book.forEach((p, i) => p.rotation.z = 0); return s; }
// a plain seated pose for anyone at the S.office desk
function sitAt(x, name, scene, z = 0.15) { const g = put(x, name, scene, 0, -0.02, z, Math.PI); g.legR.piv.rotation.x = -1.5; g.legL.piv.rotation.x = -1.5; g.armR.piv.rotation.x = -1.1; g.armL.piv.rotation.x = -1.1; g.idle(x.t, 1); return g; }
// Fredbear plush: the real Fredbear model at plush size, sitting
function plush(x, s, p, ry = 0) { const f = put(x, 'fredbear', s, p[0], p[1], p[2], ry, 0.32 / 1.22); slump(f, 0); f.head.rotation.x = 0; return f; }
const SPK = (() => { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: '#1a1a1e', roughness: 0.4, metalness: 0.5 }); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16), m); c.rotation.x = Math.PI / 2; g.add(c);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.012, 0.02, 16), new THREE.MeshStandardMaterial({ color: '#3a3a42', roughness: 0.6 })); cone.rotation.x = Math.PI / 2; cone.position.z = 0.02; g.add(cone);
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.008), new THREE.MeshBasicMaterial({ color: '#ff2a2a', toneMapped: false })); led.position.set(0.026, 0.026, 0.017); g.add(led); return g; })();
EXTRA.push(SPK);

// "Camada 3, o escuro"
at(267.9333, 'dive3', x => { dive(x, 2, ICE_DEPTHS[1], ICE_DEPTHS[2]); });
// "No FNAF 2, o Phone Guy fala uma coisa que quase todo mundo ignora"
at(272.64, 'fnaf2_phone', x => {
  const s = office(x); const L = x.L; phoneRing(x, L < 1.4 ? 1 : 0); const j = sitAt(x, 'jeremy', s); j.head.rotation.y = -0.45; j.head.rotation.x = 0.25;
  const pp = x.S.phone.position; if (L > 1.4) waves(x, s, new V3(pp.x, pp.y + 0.25, pp.z), 0.8, '#ffe8c0');
  camMove(x, [2.0, 1.55, 0.2], [0.85, 1.1, -0.78], [1.45, 1.4, -0.25], [0.85, 1.1, -0.78], eo, 40); fillOn(x, j, 1.2, 1.6);
});
// "Os novos animatrônicos tinham reconhecimento facial"
at(276.44, 'facial', x => {
  const s = x.S.screenroom; x.out.scene = s; x.out.screen = 'scan'; const c = x.S.crtScreenPos; const k = eio(x.u); x.S.crtLight.intensity = 3;
  cam(x, [c.x + mix(0.9, 0.25, k), c.y + mix(0.25, 0.08, k), c.z + mix(2.2, 0.95, k)], [c.x, c.y, c.z], 46); x.post.vig.value = 0.9;
});
// "ligado a um banco de dados criminal"
at(279.26, 'database', x => {
  const s = x.S.screenroom; x.out.scene = s; x.out.screen = 'db'; const c = x.S.crtScreenPos; const k = eio(x.u); x.S.crtLight.intensity = 3;
  cam(x, [c.x - mix(0.6, 0.2, k), c.y + 0.1, c.z + mix(1.3, 0.85, k)], [c.x, c.y, c.z], 46); x.post.vig.value = 0.9;
});
// "Uma pizzaria infantil" — kids jumping in the party room
function partyKids(x, s, n = 4) { const P = [[-1.6, -1.0], [-0.5, -0.3], [0.6, -0.8], [1.7, -0.2], [0.1, 0.6]];
  return P.slice(0, n).map(([px, pz], i) => { const k = put(x, 'kid' + i, s, px, Math.max(0, Math.sin(x.t * 6 + i * 1.7)) * 0.2, pz, 0.3 * Math.sin(i * 2)); k.idle(x.t, 1, i);
    aim(k, 'R', rootPt(k, -0.4, 1.9, 0.2), 0.5 + 0.5 * Math.sin(x.t * 6 + i)); aim(k, 'L', rootPt(k, 0.4, 1.9, 0.2), 0.5 + 0.5 * Math.sin(x.t * 6 + i + 1)); return k; }); }
at(281.02, 'kids_place', x => {
  const s = partyR(x); const L = x.L; partyKids(x, s, 5); camMove(x, [-1.4, 1.7, 5.0], [0, 0.8, -0.4], [0.8, 1.6, 4.4], [0, 0.8, -0.4], eo, 40); x.post.vig.value = 0.7;
});
// "ligada à polícia," — red and blue wash over the party
at(282.58, 'police_link', x => {
  const s = partyR(x); const L = x.L; partyKids(x, s, 5).forEach(k => k.root.position.y *= 0.3); const ph = Math.floor(x.t * 5) % 2; POL.forEach((l, i) => { s.add(l); l.position.set(i ? 3 : -3, 2.6, 2); l.intensity = i === ph ? 30 : 4; });
  camMove(x, [0.8, 1.9, 5.2], [0, 0.8, -0.4], [0.4, 1.8, 4.6], [0, 0.8, -0.4], eo, 40);
});
// "por quê?"
at(284.02, 'why', x => {
  const s = partyR(x); const L = x.L; const k = put(x, 'kid1', s, 0, 0, -0.3, 0); k.idle(x.t, 1); lookAtCam(x, k, 0.8); k.head.rotation.z = 0.25 * eo(seg(L, 0, 0.3));
  camMove(x, [0.3, 1.2, 1.9], [0, 1.15, -0.3], [0.15, 1.2, 1.5], [0, 1.2, -0.3], eo, 40); pop(x, x.FX.q1, s, headTop(k, 0.7), 0.15, 0.5);
});
// "Porque a empresa já sabia que tinha um assassino rodando" — the company's files
at(284.64, 'knew_files', x => {
  const s = files(x, 0.3); const L = x.L; FILES.userData.cover.rotation.z = -2.9 * eo(seg(L, 0.4, 1.1));
  const p = put(x, 'purpleguy', s, 0, 0, 0, Math.PI / 2); walkTo(p, [-3.5, 0, -2.4], [2.5, 0, -2.4], seg(L, 0, 3.0), 0.9); p.root.rotation.y = Math.PI / 2;
  camMove(x, [1.2, 1.6, 1.4], [0.2, 1.0, 0.1], [0.75, 1.45, 0.9], [0.3, 1.0, 0.1], eo, 40);
});
// "e mesmo assim continuou aberta" — the pizzeria, lit and open
at(287.64, 'stayed_open', x => {
  const s = facade(x, 1.4); const L = x.L; x.S.doorPanes.forEach((p, i) => p.rotation.y = (i ? -1 : 1) * 1.2); x.S.logoLight.intensity = 3;
  camMove(x, [0.4, 1.7, 4.5], [0, 1.6, 0], [0.8, 2.6, 9.5], [0, 1.9, 0], eio, 40);
});
// "E é aqui que nasce uma das teorias mais perturbadoras" — back in the dark water
at(289.70, 'born', x => { const L = x.L; iceCam(x, mix(-20, -24, eio(x.u)), mix(0.5, 0.1, eio(x.u)), 22, -2, 46, 8); ice(x, { rush: 0.8 }); });
// "O verdadeiro vilão de FNAF não é só o William"
at(292.72, 'villain', x => {
  const s = voidS(x, 34, 26, '#a040ff', 1.5); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.6); lookAtCam(x, w, 0.6);
  camMove(x, [0.2, 1.65, 2.4], [0, 1.6, 0], [0.4, 2.2, 6.2], [0, 1.4, 0], eio, 36);
});
// "É a Fazbear Entertainment," — the files, red light
at(295.08, 'company', x => {
  const s = files(x, 1); const L = x.L; FILES.userData.cover.rotation.z = -2.9; FILES.userData.mark.visible = true; x.post.tint.value.set(1.1, 0.88, 0.85);
  const a = mix(-0.5, 0.4, eio(x.u)); cam(x, [Math.sin(a) * 2.4, 1.9, Math.cos(a) * 2.4], [0, 1.0, 0], 40);
});
// "uma empresa que passou décadas acobertando mortes para proteger a marca" — close the file, STAMP
at(296.88, 'coverup', x => {
  const s = files(x, 0.6); const L = x.L; const cv = FILES.userData.cover; cv.rotation.z = -2.9 * (1 - eio(seg(L, 0.3, 1.0)));
  const st = FILES.userData.stamp; const k1 = eio(seg(L, 1.3, 1.8)), k2 = ei(seg(L, 1.8, 1.95)), k3 = eo(seg(L, 2.2, 2.7));
  st.position.set(mix(0.55, 0.24 + 0.2, k1), 0.98 + mix(0.0, 0.35, k1) - 0.35 * k2 + 0.3 * k3, mix(-0.3, 0.12, k1)); FILES.userData.mark.visible = false;
  const mk = FILES.userData.mark; if (L > 1.95) { mk.visible = true; mk.removeFromParent(); FILES.add(mk); mk.position.set(0.44, 1.03, 0.12); }
  if (L > 1.95 && L < 2.15) shake(x, 0.4); camMove(x, [0.9, 1.6, 0.9], [0.3, 1.0, 0.1], [0.65, 1.45, 0.7], [0.35, 1.0, 0.1], eo, 40);
});
// "Nos livros e nas histórias oficiais aparece um conceito chamado"
at(300.66, 'books', x => {
  const s = files(x, 0); const L = x.L; FILES.userData.book.forEach((p, i) => p.rotation.z = (i ? -1 : 1) * 0.15 * (1 - eo(seg(L, 0.2, 1.0))));
  const b = FILES.userData.book[0].parent.position; camMove(x, [b.x + 0.7, 1.6, b.z + 0.9], [b.x, 1.0, b.z], [b.x + 0.3, 1.35, b.z + 0.55], [b.x, 1.0, b.z], eio, 40);
});
// "remanescente" — the glowing tank
at(303.98, 'remnant', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 1.0; x.S.shopLamp.intensity = 3; const t = tankAt(x, s, [-1.5, 1.01, -3.2], 0.85, 1.6); const c = t.position;
  [0, 1, 2].forEach(i => { const a = x.t * 1.6 + i * 2.1; orbAt(x, i, s, new V3(c.x + Math.cos(a) * 0.18, c.y + 0.55 + 0.2 * Math.sin(x.t * 2 + i), c.z + Math.sin(a) * 0.18), 0.25); });
  const a = mix(-0.4, 0.3, eio(x.u)); cam(x, [c.x + Math.sin(a) * 2.0, c.y + 0.9, c.z + Math.cos(a) * 2.0], [c.x, c.y + 0.7, c.z], 42);
});
// "Uma espécie de resto de alma que fica grudado no metal depois de uma morte cheia de dor"
at(305.00, 'soul_rest', x => {
  const s = voidS(x, 24, 20, '#3ad8ff', 1); const L = x.L; const f = put(x, 'freddy', s, 0, 0, 0, 0); f.idle(x.t, 0.4); x.setXray(f, 0.85, 0.5, '#3ad8ff');
  f.root.updateMatrixWorld(true); f.endoParts.slice(0, 8).forEach((m, i) => { if (i < x.FX.sparkles.length) { const sp = x.FX.sparkles[i]; s.add(sp); m.getWorldPosition(sp.position); sp.position.x += 0.04 * Math.sin(i); sp.quaternion.copy(x.camera.quaternion); sp.scale.setScalar(0.5 * Math.max(0, Math.sin(x.t * 2 + i * 1.3)) ** 1.5); } });
  if (L > 3.2) { x.post.tint.value.set(1.15, 0.85, 0.85); } const a = mix(0.6, -0.4, eio(x.u)); cam(x, [Math.sin(a) * 3.0, 1.7, Math.cos(a) * 3.0], [0, 1.5, 0], 38);
});
// "E a teoria macabra é essa, o Afton descobriu isso"
at(309.82, 'discovered', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 1.0; x.S.shopLamp.intensity = 4; const t = tankAt(x, s, [-1.5, 1.01, -3.2], 0.85, 1.6);
  const w = put(x, 'william', s, -0.5, 0, -1.9, -2.45); w.idle(x.t, 0.6); w.head.rotation.x = 0.1; aim(w, 'R', new V3(-1.3, 1.6, -2.95), eo(seg(x.L, 0.6, 1.2)));
  const hp = tp(w, 'head', [0, 4, 4]); camMove(x, [-2.6, 1.9, -1.6], hp.toArray(), [-2.3, 1.85, -1.8], hp.toArray(), eo, 46); keyOn(x, s, [-1.5, 1.8, -3.1], hp.toArray(), 2.5, 0.6); KEY.color.set('#3ad8ff');
});
// "e ele não matava só por matar"
at(312.72, 'not_just', x => {
  const s = voidS(x, 14, 40, '#ff2a1a', 0.5); const L = x.L; s.fog = null; const p = put(x, 'purpleguy', s, 0, 0, 0, 0); p.idle(x.t, 0.6); lookAtCam(x, p, 0.8);
  for (let i = 0; i < 5; i++) ghostKid(x, i, s, [(i - 2) * 0.7, 0, -1.6], 0, 0.45); rimOn(x, s, [0, 3.8, -3.2], [0, 1.4, 0], 50, '#ff2a1a');
  camMove(x, [0.3, 1.1, 4.4], [0, 1.4, 0], [0.15, 1.3, 3.4], [0, 1.5, 0], eo, 38);
});
// "Ele também estava estudando,"
at(314.26, 'studying', x => {
  const s = x.S.screenroom; x.out.scene = s; x.out.screen = 'code'; const c = x.S.crtScreenPos; x.S.crtLight.intensity = 3; const L = x.L;
  const w = put(x, 'william', s, c.x + 0.1, 0, c.z + 1.25, Math.PI); w.idle(x.t, 0.6); w.head.rotation.x = 0.1; aim(w, 'R', new V3(c.x - 0.15, 0.95, c.z + 0.35), 0.9); aim(w, 'L', new V3(c.x + 0.25, 0.95, c.z + 0.35), 0.9);
  w.armR.piv.rotation.x += 0.08 * Math.sin(x.t * 22); w.armL.piv.rotation.x += 0.08 * Math.sin(x.t * 19 + 1);
  camMove(x, [c.x + 3.0, 1.75, c.z + 1.9], [c.x, 1.3, c.z + 0.8], [c.x + 2.7, 1.72, c.z + 1.7], [c.x, 1.3, c.z + 0.8], eo, 44); fillOn(x, w, 0.8, 1.8);
});
// "querendo entender como prender a alma de alguém numa máquina" — a soul pulled into an endoskeleton
at(317.20, 'trap_soul', x => {
  const s = voidS(x, 24, 26, '#3ad8ff', 1); const L = x.L; const sb = put(x, 'springbonnie', s, 0, 0, 0, 0); sb.idle(x.t, 0.4); x.setXray(sb, 0.85, 0.3 + 0.7 * seg(L, 0.9, 1.3), '#3ad8ff');
  const ch = tp(sb, 'torso', [0, 6, 1]); const k = eio(seg(L, 0, 1.1)); orbAt(x, 0, s, new V3(mix(1.4, ch.x, k), mix(2.2, ch.y, k), mix(1.0, ch.z, k)), 0.35);
  const a = mix(0.5, 0.1, eio(x.u)); cam(x, [Math.sin(a) * 3.0, 1.7, Math.cos(a) * 3.0], [0, 1.6, 0], 38); if (L > 1.05 && L < 1.12) x.post.flash.value = 0.06;
});
// "A pergunta que ninguém consegue responder é, por que isso?"
at(318.96, 'question', x => {
  const s = voidS(x, 36, 20, '#a040ff', 1.5); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.8); w.head.rotation.x = 0.3; w.head.rotation.y = -0.4 * eo(seg(L, 0.5, 1.5));
  const a = mix(-0.6, 0.6, eio(x.u)); cam(x, [Math.sin(a) * 3.2, 1.7, Math.cos(a) * 3.2], [0, 1.6, 0], 36); pop(x, x.FX.q1, s, headTop(w, 0.75), 2.5, 0.7);
});
// "Bem, segura essa pergunta que a resposta tá lá no fundo" — looking down into the red abyss
at(322.88, 'hold_q', x => {
  const L = x.L; const y = mix(-22, -27, eio(x.u)); iceCam(x, y, 0.3, 22, -14, 50, 10); ice(x, { red: 1 });
});
// "No FNAF 4, a pelúcia do Fredbear fala com a criança"
function bedKid(x, s) { const c = put(x, 'cchild', s, -2.4, 0.62, -0.7, 0.9); c.legR.piv.rotation.x = -1.5; c.legL.piv.rotation.x = -1.5; c.root.position.y = 0.62 - 0.56 * 0.76 + 0.09; c.idle(x.t, 0.5); return c; }
at(325.78, 'plush', x => {
  const s = bedroom(x, 0.8); const L = x.L; const c = bedKid(x, s); const p = plush(x, s, [-2.15, 0.71, 0.05], -0.6); p.head.rotation.y = -0.5 * eo(seg(L, 0.8, 1.3));
  c.head.rotation.y = 0.5 * eo(seg(L, 1.5, 2.0)); c.head.rotation.x = 0.25;
  camMove(x, [0.4, 1.9, 2.8], [-2.4, 1.2, -0.6], [-0.2, 1.8, 2.3], [-2.4, 1.2, -0.6], eo, 40); fillOn(x, c, 1.3, 1.2);
});
// "Ele conforta, dá conselho, sempre tá perto" — the boy hugs the plush
at(329.10, 'comforts', x => {
  const s = bedroom(x, 0.8); const L = x.L; const c = bedKid(x, s); const k = eo(seg(L, 0.2, 0.9)); const pp = [mix(-2.15, -2.13, k), mix(0.71, 0.86, k), mix(0.05, -0.25, k)];
  const p = plush(x, s, pp, mix(-0.6, -0.7, k)); const ch = tp(p, 'torso', [0, 6, 0]); aim(c, 'R', ch, k); aim(c, 'L', ch, k); c.head.rotation.x = 0.4 * k; c.head.rotation.y = 0.3 * k;
  camMove(x, [0.1, 1.85, 2.5], [-2.4, 1.2, -0.6], [-0.3, 1.8, 2.2], [-2.4, 1.2, -0.6], eo, 40); fillOn(x, c, 1.3, 1.2);
});
// "Mas tem fã que pergunta, brinquedo nenhum fala, então quem tá falando?"
at(331.72, 'who_talks', x => {
  const s = bedroom(x, 0.6); const L = x.L; const p = plush(x, s, [-2.15, 0.71, 0.05], 0.75); p.head.rotation.y = 0.1 * Math.sin(x.t * 2) * seg(L, 2.8, 3.4); const hp = tp(p, 'head', [0, 4, 4]);
  camMove(x, [hp.x + 1.1, hp.y + 0.35, hp.z + 0.8], hp.toArray(), [hp.x + 0.55, hp.y + 0.2, hp.z + 0.4], hp.toArray(), eio, 40); pop(x, x.FX.q1, s, [hp.x, hp.y + 0.22, hp.z], 3.2, 0.25);
  if (L > 3.2) waves(x, s, hp, 0.9, '#ffd080'); x.FX.waves.forEach(w => w.scale.multiplyScalar(0.3));
});
// "Uma teoria diz que a pelúcia tinha um alto-falante" — inside the plush: a speaker
at(336.08, 'speaker', x => {
  const s = bedroom(x, 0.6); const L = x.L; const p = plush(x, s, [-2.15, 0.71, 0.05], 0.75); const k = sm(seg(L, 0.3, 0.9)); p.body.visible = k < 0.5; p.bodyO.visible = k < 0.5;
  p.torso.add(SPK); SPK.position.set(0, 6 * U16, 0.6 * U16); SPK.scale.setScalar(1 / p.root.scale.x * 0.24 * k + 0.001); const ch = tp(p, 'torso', [0, 6, 2]);
  if (k > 0.5) waves(x, s, ch, 1.2, '#ff6a5a'); x.FX.waves.forEach(w => w.scale.multiplyScalar(0.25));
  camMove(x, [ch.x + 1.0, ch.y + 0.35, ch.z + 0.7], ch.toArray(), [ch.x + 0.6, ch.y + 0.22, ch.z + 0.4], ch.toArray(), eio, 40);
});
// "e que do outro lado tinha um pai ouvindo e observando o filho o tempo todo"
at(338.78, 'listening', x => {
  const s = x.S.screenroom; x.out.scene = s; x.out.screen = 'static'; const c = x.S.crtScreenPos; x.S.crtLight.intensity = 3; const L = x.L;
  const w = put(x, 'william', s, c.x + 0.1, 0, c.z + 1.25, Math.PI); w.idle(x.t, 0.4); w.head.rotation.x = 0.05; aim(w, 'L', rootPt(w, 0.35, 1.7, 0.2), 0.9);
  camMove(x, [c.x - 3.0, 1.75, c.z + 1.9], [c.x, 1.3, c.z + 0.8], [c.x - 2.7, 1.72, c.z + 1.7], [c.x, 1.3, c.z + 0.8], eo, 44); fillOn(x, w, 1.2, 1.8);
  x.post.tint.value.set(0.9, 0.95, 1.1);
});
// "Alguns dizem que isso era cuidado,"
at(342.36, 'care', x => {
  const s = voidS(x, 40, 10, '#ffd0a0', 3); const L = x.L; s.fog = null; const w = put(x, 'william', s, -0.3, 0, 0, 0.2), c = put(x, 'cchild', s, 0.35, 0, 0.25, -0.15); w.idle(x.t, 0.8); c.idle(x.t, 1);
  aim(w, 'L', tp(c, 'head', [0, 9, 0]), eo(seg(L, 0.1, 0.6))); w.head.rotation.x = 0.35; w.head.rotation.y = -0.3; lookAtCam(x, c, 0.5); c.head.rotation.z = 0.15;
  camMove(x, [0.5, 1.3, 3.0], [0, 1.15, 0], [0.3, 1.3, 2.5], [0, 1.2, 0], eo, 38); x.post.tint.value.set(1.08, 1.0, 0.88);
});
// "outros chamam de experimento" — the bedroom seen through a security camera
at(344.44, 'experiment', x => {
  const s = bedroom(x, 0.7); const L = x.L; const c = bedKid(x, s); c.head.rotation.x = 0.3; plush(x, s, [-2.15, 0.71, 0.05], -0.6);
  cam(x, [1.6, 3.0, 2.6], [-2.2, 0.7, -0.5], mix(46, 34, eio(x.u))); x.post.cctv.value = 0.9; x.out.ui = 'CAM 04'; x.post.tint.value.set(1.05, 0.85, 0.85);
});

// ================================ PART 4: CAMADA 4 — A FOSSA ================================
const SM = (c, r = 0.7, m = 0, e) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: m }, e ? { emissive: e, emissiveIntensity: 1.2 } : {}));
const BX = (p, w, h, d, mat, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; p.add(b); return b; };
function tileTex(a, b, n) { const c = document.createElement('canvas'); c.width = c.height = 2; const g = c.getContext('2d'); g.fillStyle = a; g.fillRect(0, 0, 2, 2); g.fillStyle = b; g.fillRect(0, 0, 1, 1); g.fillRect(1, 1, 1, 1);
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(n, n); t.colorSpace = THREE.SRGBColorSpace; return t; }
// ---------- ULTIMATE CUSTOM NIGHT office (after refs/ucn.webp): checker floor, hazard-striped doorways, desk + monitors + fan, extinguishers, plush pile, balloons, pipes ----------
const UCN = (() => { const s = new THREE.Scene(); s.background = new THREE.Color('#040306'); s.fog = new THREE.Fog('#040306', 8, 18); const g = new THREE.Group(); s.add(g); const r = rng(404);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), new THREE.MeshStandardMaterial({ map: tileTex('#d8d8d8', '#111114', 10), roughness: 0.35, metalness: 0.1 })); fl.rotation.x = -Math.PI / 2; fl.position.z = -0.5; fl.receiveShadow = true; g.add(fl);
  const wall = SM('#2a2a2e', 0.85), dark = SM('#141418', 0.9), metal = SM('#5a5e66', 0.4, 0.6), yel = SM('#e8c020', 0.6), blk = SM('#121212', 0.7);
  BX(g, 10, 4, 0.2, wall, 0, 2, -4.4); BX(g, 10, 0.2, 8, dark, 0, 4, -0.5); // back wall + ceiling
  for (const sx of [-1, 1]) { BX(g, 0.2, 4, 3.2, wall, sx * 4.4, 2, -3.0); BX(g, 0.2, 4, 2.6, wall, sx * 4.4, 2, 2.2); BX(g, 0.2, 1.3, 1.6, wall, sx * 4.4, 3.35, -0.6); BX(g, 0.05, 2.7, 1.6, SM('#000000', 1), sx * 4.5, 1.35, -0.6);
    for (let i = 0; i < 9; i++) for (const dz of [-1.45, 0.25]) BX(g, 0.24, 0.3, 0.12, i % 2 ? yel : blk, sx * 4.28, 0.15 + i * 0.3, -0.6 + dz + 0.6); // hazard stripes on the door frame
    for (let i = 0; i < 6; i++) BX(g, 0.24, 0.12, 0.27, i % 2 ? yel : blk, sx * 4.28, 2.76, -1.35 + i * 0.27); }
  for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4, 10), metal); p.position.set(-3.5 + i * 1.7 + r() * 0.3, 2, -4.2); g.add(p); }
  for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 10, 10), metal); p.rotation.z = Math.PI / 2; p.position.set(0, 3.5 + i * 0.18, -4.15); g.add(p); }
  BX(g, 1.4, 0.8, 0.1, blk, -2.4, 2.6, -4.28); BX(g, 1.2, 0.9, 0.1, blk, 2.2, 2.4, -4.28); BX(g, 0.8, 0.5, 0.1, SM('#3a3a40', 0.5, 0.5), 0.2, 3.2, -4.28); // dark frames + vent
  for (let i = 0; i < 5; i++) BX(g, 0.7, 0.03, 0.12, metal, 0.2, 3.02 + i * 0.09, -4.22);
  // desk + monitors + fan + cup + papers
  const wood = SM('#3a2a20', 0.7); BX(g, 3.0, 0.1, 1.0, wood, 0, 0.95, -1.3); BX(g, 3.0, 0.9, 0.06, wood, 0, 0.47, -1.78); for (const sx of [-1.45, 1.45]) BX(g, 0.08, 0.9, 1.0, wood, sx, 0.45, -1.3);
  for (const [mx, w] of [[-0.75, 0.62], [0.55, 0.5], [1.15, 0.4]]) { BX(g, w, w * 0.78, 0.4, SM('#22242a', 0.6), mx, 1.0 + w * 0.39, -1.5); BX(g, w * 0.84, w * 0.62, 0.02, SM('#0a1a14', 0.5, 0, '#1a6a4a'), mx, 1.0 + w * 0.39, -1.29); }
  const fan = new THREE.Group(); fan.position.set(-0.1, 1.0, -1.25); g.add(fan); BX(fan, 0.1, 0.24, 0.1, metal, 0, 0.12, 0); const blades = new THREE.Group(); blades.position.set(0, 0.3, 0.08); fan.add(blades); for (let i = 0; i < 3; i++) { const b = new THREE.Group(); b.rotation.z = i * 2.09; blades.add(b); BX(b, 0.07, 0.22, 0.02, SM('#6a6a72', 0.5, 0.4), 0, 0.11, 0); }
  s.userData.fan = blades; const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.12, 12), SM('#e8e2d8', 0.5)); cup.position.set(0.95, 1.06, -1.0); g.add(cup);
  for (let i = 0; i < 4; i++) { const p = BX(g, 0.24, 0.004, 0.32, SM('#ece6d8', 0.9), -0.3 + i * 0.12, 1.005 + i * 0.002, -1.05); p.rotation.y = (r() - 0.5) * 0.8; }
  // extinguishers, plush pile, balloons
  for (let i = 0; i < 3; i++) { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.6, 12), SM('#c81818', 0.4, 0.2)); e.position.set(-3.9 + i * 0.28, 0.3, -1.9 - i * 0.1); g.add(e); BX(g, 0.06, 0.12, 0.06, blk, -3.9 + i * 0.28, 0.66, -1.9 - i * 0.1); }
  const plushC = ['#8a5a30', '#5a4a9a', '#e8c030', '#c83a2a', '#e8e8f0', '#d8a020']; for (let i = 0; i < 14; i++) { const sz = 0.22 + r() * 0.16; BX(g, sz, sz, sz, SM(plushC[i % 6], 0.95), -3.6 + r() * 1.2, sz / 2 + (i > 8 ? 0.25 : 0), -0.2 + r() * 1.0); }
  const balC = ['#7a2ad8', '#d82a4a', '#2a6ad8']; for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), SM(balC[i], 0.3, 0.1)); b.scale.y = 1.2; b.position.set(2.8 + i * 0.35, 2.4 + i * 0.25, -3.6 + i * 0.1); g.add(b); BX(g, 0.008, 1.6, 0.008, SM('#ddd'), 2.8 + i * 0.35, 1.5 + i * 0.12, -3.6 + i * 0.1); }
  // lights: hanging bulb over the desk, dim cold fill, red alarm glow
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff0c8', toneMapped: false })); bulb.position.set(0, 3.2, -1.0); g.add(bulb); BX(g, 0.01, 0.8, 0.01, blk, 0, 3.6, -1.0);
  const L = new THREE.SpotLight('#ffe6c0', 30, 9, 0.9, 0.6, 1.3); L.position.set(0, 3.15, -1.0); L.target.position.set(0, 0, -0.6); L.castShadow = true; L.shadow.mapSize.set(1024, 1024); L.shadow.bias = -0.002; s.add(L, L.target);
  s.add(new THREE.HemisphereLight('#7a7a9a', '#140c0c', 1.3)); { const f = new THREE.PointLight('#c8d0ff', 6, 10, 1.5); f.position.set(0, 2.2, 2.5); s.add(f); } const red = new THREE.PointLight('#ff2a1a', 0, 9, 1.4); red.position.set(0, 2.6, 1.5); s.add(red);
  s.userData.lamp = L; s.userData.red = red; return s; })();
function ucn(x, red = 0) { const s = UCN; x.out.scene = s; s.userData.fan.rotation.z = x.t * 25; s.userData.lamp.intensity = 18 * (red > 0.5 ? 0.6 + 0.4 * flicker(x.t, 2) : 1); s.userData.red.intensity = 14 * red; x.post.vig.value = 0.95; return s; }
// ---------- THE PIT: dark ball pit (after refs/pit.jpg) ----------
const PIT = (() => { const s = new THREE.Scene(); s.background = new THREE.Color('#05030a'); s.fog = new THREE.Fog('#05030a', 6, 16); const r = rng(1985);
  const cols = ['#c8202a', '#2050d8', '#e8c020', '#20a040', '#e86a10', '#8a2ad8']; const geo = new THREE.SphereGeometry(1, 12, 9); const m4 = new THREE.Matrix4();
  cols.forEach((c, k) => { const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.05 }), 520); let n = 0;
    for (let i = 0; i < 520; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 6.5; const px = Math.cos(a) * d, pz = -1 + Math.sin(a) * d * 0.8; const rad = 0.13 + r() * 0.03;
      const top = 0.3 + 0.06 * Math.sin(px * 3) * Math.cos(pz * 2.5); const py = top - r() * 0.35; m4.compose(new V3(px, py, pz), new THREE.Quaternion(), new V3(rad, rad, rad)); im.setMatrixAt(n++, m4); }
    im.count = n; im.receiveShadow = true; s.add(im); });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), SM('#0a0810', 0.9)); fl.rotation.x = -Math.PI / 2; fl.position.y = -0.1; s.add(fl);
  // netting + padded walls behind
  const net = SM('#1a1a22', 0.8); for (let i = 0; i < 26; i++) BX(s, 0.015, 3.2, 0.015, net, -6.5 + i * 0.5, 1.6, -5.2); for (let j = 0; j < 7; j++) BX(s, 13, 0.015, 0.015, net, 0, 0.4 + j * 0.5, -5.2);
  BX(s, 13, 0.5, 0.4, SM('#2a1a4a', 0.9), 0, 0.25, -5.0);
  const rim = new THREE.SpotLight('#b060ff', 60, 14, 0.7, 0.5, 1.2); rim.position.set(0, 3.5, -4.5); rim.target.position.set(0, 0.6, 0); s.add(rim, rim.target);
  const key = new THREE.SpotLight('#ff8a5a', 8, 12, 0.6, 0.7, 1.3); key.position.set(1.5, 2.6, 5); key.target.position.set(0, 0.6, -0.5); s.add(key, key.target);
  s.add(new THREE.HemisphereLight('#3a2a6a', '#05030a', 0.5)); s.userData.rim = rim; s.userData.key = key; return s; })();
function pit(x, band = 1) { const s = PIT; x.out.scene = s; x.post.vig.value = 1.0; s.userData.rim.intensity = 60; s.userData.key.intensity = 8;
  if (band > 0) [['freddy', -1.65, '#5ab0ff'], ['chica', -0.55, '#ff8a2a'], ['bonnie', 0.55, '#ff8a2a'], ['foxy', 1.65, '#ffd040']].forEach(([n, px, ec], i) => {
    const c = put(x, n, s, px, mix(-2.4, -1.75, band) + 0.04 * Math.sin(x.t * 1.3 + i), -0.8 - 0.15 * Math.abs(px), -px * 0.08); c.idle(x.t, 0.6, i); c.setEyeGlow(ec, band); c.head.rotation.x = -0.05; });
  return s; }
// ---------- props: VR headset, circuit boards ----------
const VR = (() => { const g = new THREE.Group(); BX(g, 0.24, 0.13, 0.12, SM('#18181c', 0.3, 0.3), 0, 0, 0); BX(g, 0.22, 0.11, 0.01, SM('#0a0a10', 0.1, 0.6), 0, 0, 0.065);
  for (const sx of [-1, 1]) { const l = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), new THREE.MeshBasicMaterial({ color: '#7a3aff', toneMapped: false })); l.position.set(sx * 0.05, 0, -0.061); l.rotation.y = Math.PI; g.add(l); }
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 6, 24), SM('#222', 0.8)); strap.rotation.x = Math.PI / 2; strap.scale.set(1, 1.35, 1); strap.position.z = -0.15; g.add(strap); return g; })();
const PCB = (() => { const g = new THREE.Group(); const r = rng(5); for (let b = 0; b < 3; b++) { const bd = new THREE.Group(); bd.position.set(-0.55 + b * 0.55, b * 0.012, (b % 2) * 0.1); bd.rotation.y = (b - 1) * 0.15; g.add(bd);
    BX(bd, 0.46, 0.012, 0.32, SM('#1a5a2a', 0.5, 0.1), 0, 0, 0); for (let i = 0; i < 10; i++) BX(bd, 0.3 * r() + 0.05, 0.002, 0.004, SM('#d8b040', 0.3, 0.8), (r() - 0.5) * 0.3, 0.008, (r() - 0.5) * 0.26);
    for (let i = 0; i < 4; i++) BX(bd, 0.06 + r() * 0.04, 0.012, 0.05, SM('#111', 0.4, 0.3), (r() - 0.5) * 0.3, 0.012, (r() - 0.5) * 0.22);
    for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8), SM('#2a4aa8', 0.4)); c.position.set((r() - 0.5) * 0.3, 0.02, (r() - 0.5) * 0.22); bd.add(c); } }
  return g; })();
EXTRA.push(VR, PCB);
const BAND_JS = ['freddy', 'chica', 'foxy', 'baby'];

// "Camada 4, a fossa"
at(346.6, 'dive4', x => { dive(x, 3, ICE_DEPTHS[2], ICE_DEPTHS[3]); });
// "Daqui pra baixo eu aviso, tudo é teoria pesada, escondida e que a maioria dos fãs nunca viu"
at(351.42, 'warning4', x => { const L = x.L; const k = eio(x.u); iceCam(x, mix(-31, -37, k), mix(-0.2, 0.3, k), 24, -3, 46, mix(14, -14, k)); ice(x, { rush: 0.7, red: 0.25 }); });
// "Respira fundo" — a burst of bubbles
at(358.56, 'breathe', x => { const L = x.L; iceCam(x, -37.5, 0.3, 20, 0.5, 50, -12); ice(x, { rush: 5 * (1 - seg(L, 0, 1.0)) + 0.6, red: 0.25 }); x.S.iceBubbles.forEach(b => b.scale.setScalar(0.7)); });
// "Depois do incêndio da Fazbear's Fright, William deveria estar acabado"
at(359.56, 'fire', x => {
  const s = fright(x, 0.8); const L = x.L; const c = put(x, 'spring', s, 0, 0, -5.2, 0); const k = eio(seg(L, 1.6, 3.4)); twitch(c, x.t, 1.4); c.idle(x.t, 1);
  c.root.position.y = -(c.hipY - 2 * U16) * c.root.scale.x * k; c.legR.piv.rotation.x = -1.5 * k; c.legL.piv.rotation.x = -1.5 * k; c.head.rotation.x = 0.5 * k; aim(c, 'R', rootPt(c, -0.5, 2.0, 0.5), 0.8 * (1 - k));
  fireAt(x, s, -1.7, -6.0, 0.5, 3, 2.2, 6); x.FX.fire.userData.fl.forEach((m, i) => { if (i % 2) m.position.x += 3.4; }); x.S.frLamps.forEach(l => l.intensity = 1.5);
  camMove(x, [0.5, 1.6, -1.6], [0, 1.6, -5.2], [0.25, 1.4, -2.6], [0, 1.1, -5.2], eio, 44); x.post.tint.value.set(1.15, 0.92, 0.8); fillOn(x, c, 1.2, 1.8);
});
// "Mas a Fazbear Entertainment decidiu fazer um jogo de" — a VR headset on the company desk
at(363.46, 'vr', x => {
  const s = files(x, 0); const L = x.L; s.add(VR); VR.position.set(0.25, 1.05 + 0.02 * Math.sin(x.t * 2), 0.15); VR.rotation.set(0.15, mix(2.4, 3.3, eio(x.u)), 0);
  camMove(x, [1.0, 1.4, 1.1], [0.25, 1.05, 0.15], [0.62, 1.25, 0.7], [0.25, 1.05, 0.15], eio, 40);
});
// "realidade virtual" — Help Wanted logo over the blurred desk
at(366.54, 'logo_hw', x => {
  const s = files(x, 0); s.add(VR); VR.position.set(0.25, 1.07, 0.15); VR.rotation.set(0.15, 3.3, 0); cam(x, [0.62, 1.25, 0.7 - 0.1 * x.u], [0.25, 1.05, 0.15], 40); logoCard(x, 2); x.post.blur.value = 1;
});
// "Usando placas de circuito dos animatrônicos antigos"
at(367.48, 'boards', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 0.9; const L = x.L; s.add(PCB); PCB.position.set(-0.7, 1.02, -2.75); PCB.rotation.set(0, 0.2, 0); x.S.shopLamp.intensity = 12;
  const c = put(x, 'freddy', s, 1.6, 0, -2.9, -0.6); droop(c, 0.8); x.setXray(c, 0.7, 0.2, '#40ff70');
  camMove(x, [-1.6, 1.5, -1.6], [-0.7, 1.02, -2.75], [-1.1, 1.35, -2.05], [-0.6, 1.02, -2.75], eo, 40);
});
// "Placas que carregavam pedaços do remanescente" — cyan specks rising off the boards
at(370.56, 'boards_glow', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 1.0; const L = x.L; s.add(PCB); PCB.position.set(-0.7, 1.02, -2.75); PCB.rotation.set(0, 0.2, 0); x.S.shopLamp.intensity = 4;
  sparkles(x, s, [-0.7, 1.25 + 0.1 * Math.sin(x.t), -2.7], 0.35, 8, 0.18); keyOn(x, s, [-0.7, 1.6, -2.4], [-0.7, 1.0, -2.75], 8 * sm(seg(L, 0.2, 0.8)), 0.8); KEY.color.set('#3ad8ff');
  camMove(x, [-1.1, 1.4, -2.0], [-0.7, 1.1, -2.75], [-0.95, 1.3, -2.25], [-0.7, 1.12, -2.75], eio, 40);
});
// "Pedaços dele, e ele voltou, agora como um vírus,"
at(373.48, 'virus', x => {
  const s = x.S.screenroom; x.out.scene = s; const L = x.L; x.out.screen = L > 1.6 ? 'virus' : 'static'; x.S.screenLamp.intensity = 1.0; x.S.neonMat.opacity = 0; x.S.neonLight.intensity = 0;
  const p = x.S.crtScreenPos; const k = eio(seg(L, 0.2, 1.7)); orbAt(x, 0, s, new V3(mix(1.6, p.x, k), mix(1.1, p.y, k), mix(1.4, p.z + 0.05, k)), 0.4 * (1 - seg(L, 1.6, 1.9)));
  x.S.crtLight.intensity = L > 1.6 ? 4 : 1.5; cam(x, [p.x + mix(1.4, 0.4, eio(x.u)), p.y + 0.15, p.z + mix(2.6, 1.2, eio(x.u))], [p.x, p.y, p.z], 46); if (L > 1.6 && L < 1.7) x.post.flash.value = 0.25;
});
// "o Glitchtrap"
at(377.18, 'glitchtrap', x => {
  const s = voidS(x, 36, 30, '#a05aff'); const L = x.L; const g = put(x, 'glitchtrap', s, 0, 0, 0, 0); g.idle(x.t, 1); glitchIn(x, g, 1 - 0.6 * seg(L, 0.2, 0.6)); lookAtCam(x, g, 0.6);
  const hp = tp(g, 'head', [0, 4, 4]); camMove(x, [0.6, 1.6, 3.4], [0, 1.8, 0], [hp.x + 0.2, hp.y, hp.z + 1.8], hp.toArray(), eio, 40); staticIn(x, 0.12);
});
// "Pedaços de Afton, e ele voltou, agora como um vírus," — he dances out of the static
at(377.86, 'glitch_dance', x => {
  const s = voidS(x, 30, 34, '#a05aff', 2); const L = x.L; const g = put(x, 'glitchtrap', s, 0, 0, 0, 0); g.idle(x.t, 1); lookAtCam(x, g, 0.7);
  const sw = Math.sin(x.t * 3); g.torso.rotation.z = 0.12 * sw; aim(g, 'R', rootPt(g, -0.6, 1.9 + 0.2 * sw, 0.4), 0.8); aim(g, 'L', rootPt(g, 0.55, 1.4 - 0.2 * sw, 0.5), 0.6); g.head.rotation.z = -0.2 * sw;
  if (Math.sin(x.t * 5.3) > 0.85) glitchIn(x, g, 0.8); const a = mix(-0.7, 0.7, eio(x.u)); cam(x, [Math.sin(a) * 3.6, 1.6, Math.cos(a) * 3.6], [0, 1.6, 0], 38); x.post.chroma.value = 0.3;
});
// "o Glitchtrap" (again)
at(381.78, 'glitch2', x => {
  const s = voidS(x, 30, 34, '#a05aff', 2); const L = x.L; const g = put(x, 'glitchtrap', s, 0, 0, 0, 0); g.idle(x.t, 1); lookAtCam(x, g, 1); g.head.rotation.z = 0.25 * eo(seg(L, 0, 0.3));
  const hp = tp(g, 'head', [0, 4, 4]); camMove(x, [hp.x + 0.3, hp.y, hp.z + 1.4], hp.toArray(), [hp.x + 0.1, hp.y, hp.z + 1.0], hp.toArray(), eo, 36); staticIn(x, 0.1); glitchIn(x, g, 0.3);
});
// "Uma consciência digital que se infiltrou na mente de uma funcionária, a Vanessa," — a faceless worker with the headset, him whispering behind
at(382.48, 'vanessa', x => {
  const s = voidS(x, 0, 40, '#a05aff', 0.15); const L = x.L; s.fog = null; const v = put(x, 'guard', s, 0, 0, 0, 0); v.idle(x.t, 0.5); v.head.rotation.x = 0.1;
  v.root.updateMatrixWorld(true); s.add(VR); v.head.getWorldPosition(VR.position); VR.position.y += 0.27; VR.position.z += 0.2; VR.rotation.set(0, Math.PI, 0); VR.scale.setScalar(1.6);
  const g = put(x, 'glitchtrap', s, 0.75, 0, -0.9, -0.5); g.idle(x.t, 1); g.ghostish = true; glitchIn(x, g, 0.4); g.head.rotation.y = -0.4; g.head.rotation.x = 0.2; aim(g, 'R', tp(v, 'head', [4, 4, 0]), 0.7);
  rimOn(x, s, [0, 3.5, -3], [0, 1.6, 0], 60, '#a05aff'); camMove(x, [-0.6, 1.6, 3.4], [0.2, 1.6, 0], [-0.4, 1.65, 2.6], [0.25, 1.65, 0], eo, 38);
});
// "e transformou ela na Vanny"
at(387.10, 'vanny', x => {
  const s = voidS(x, 34, 30, '#ff3a6a', 2); const L = x.L; const v = put(x, 'vanny', s, 0, 0, 0, 0); v.idle(x.t, 1); lookAtCam(x, v, eo(seg(L, 0.3, 0.7))); v.head.rotation.z = 0.3 * eo(seg(L, 0.5, 0.9));
  staticIn(x, 0.15); camMove(x, [0.5, 1.4, 3.6], [0, 1.4, 0], [0.2, 1.55, 2.6], [0, 1.6, 0], eo, 38); fillOn(x, v, 0.6, 1.8);
});
// "William Afton não precisa mais de corpo, ele vive agora em qualquer lugar onde existe um fio"
at(388.40, 'no_body', x => {
  const s = x.S.screenroom; x.out.scene = s; const L = x.L; x.out.screen = 'virus'; x.S.crtLight.intensity = 3; x.S.neonMat.opacity = 0; x.S.neonLight.intensity = 0;
  const spots = [[1.2, -0.6], [-1.4, -0.2], [0.2, 0.6]]; const i = Math.floor(L / 1.7) % 3; const g = put(x, 'glitchtrap', s, spots[i][0], 0, spots[i][1], -spots[i][0] * 0.3); g.idle(x.t, 1); glitchIn(x, g, 0.7); lookAtCam(x, g, 0.6);
  if ((L % 1.7) < 0.06) x.post.stat.value = 0.3; const c = x.S.crtScreenPos; camMove(x, [c.x + 0.2, 1.7, c.z + 4.4], [c.x, 1.3, c.z], [c.x - 0.3, 1.6, c.z + 3.4], [c.x, 1.3, c.z], eo, 44); fillOn(x, g, 1.2, 1.8);
});
// "Ultimate Custom Night" — UCN logo over the office
at(393.46, 'logo_ucn', x => { const s = ucn(x); cam(x, [0, 1.75, 2.6 - 0.2 * x.u], [0, 1.4, -1.5], 50); logoCard(x, 1); x.post.blur.value = 1; });
// "é um jogo sem história... Aparentemente"
at(395.00, 'ucn_office', x => {
  const s = ucn(x); const L = x.L; camMove(x, [0.2, 1.8, 3.4], [0, 1.3, -1.6], [0.0, 1.65, 1.7], [0, 1.25, -1.8], eio, 50); if (L > 2.4) x.camera.rotateZ(0.05 * eo(seg(L, 2.4, 2.9)));
});
// "Mas uma das teorias mais aceitas diz que esse escritório é um purgatório" — William at the desk, red creeping in
function ucnWill(x, s) { const w = put(x, 'william', s, 0, 0, -2.1, 0); w.legR.piv.rotation.x = -1.5; w.legL.piv.rotation.x = -1.5; w.root.position.y = -0.02; w.armR.piv.rotation.x = -1.2; w.armL.piv.rotation.x = -1.2; w.idle(x.t, 1); return w; }
at(397.88, 'purgatory', x => {
  const L = x.L; const s = ucn(x, sm(seg(L, 1.0, 3.6))); const w = ucnWill(x, s); w.head.rotation.x = 0.15; w.head.rotation.y = 0.2 * Math.sin(x.t * 0.9);
  camMove(x, [-0.4, 1.7, 1.6], [0, 1.4, -2.0], [-0.2, 1.62, 0.6], [0, 1.45, -2.0], eio, 44); x.post.tint.value.set(1, mix(1, 0.85, seg(L, 1, 3.6)), mix(1, 0.85, seg(L, 1, 3.6)));
});
// "William preso numa noite que nunca acaba," — figures in both doorways
at(401.96, 'trapped', x => {
  const s = ucn(x, 1); const L = x.L; const w = ucnWill(x, s); w.head.rotation.y = 0.6 * Math.sin(x.t * 2.5); w.torso.rotation.z = 0.03 * Math.sin(x.t * 9);
  const a = put(x, 'freddy', s, -4.2, 0, -0.6, Math.PI / 2 - 0.2); a.idle(x.t, 0.4); a.setEyeGlow('#ffffff', 0.8); const b = put(x, 'bonnie', s, 4.2, 0, -0.6, -Math.PI / 2 + 0.2); b.idle(x.t, 0.4, 1); b.setEyeGlow('#ff3020', 0.8);
  camMove(x, [0, 2.2, 3.6], [0, 1.4, -1.6], [0, 2.0, 2.8], [0, 1.4, -1.6], eo, 54); x.post.tint.value.set(1.05, 0.88, 0.88);
});
// "atacado pra sempre por todas as vítimas" — jumpscare after jumpscare
at(404.26, 'attacked', x => {
  const s = ucn(x, 1); const L = x.L; const i = Math.min(3, Math.floor(L / 0.57)); const l = L - i * 0.57; cam(x, [0, 1.6, -0.6], [0, 1.55, -3], 50);
  const c = put(x, BAND_JS[i], s, 0, 0, 0, 0); if (c.setEyeGlow) c.setEyeGlow('#ffffff', 1); if (c.setEyes) c.setEyes('#5aff6a'); jumpscare(x, c, l, { from: 2.2, to: 1.15, headY: c === x.C.baby ? 1.85 : 1.78 }); x.post.stat.value = l > 0.45 ? 0.6 : x.post.stat.value;
});
// "E quem estaria mantendo ele lá?"
at(406.54, 'who_keeps', x => {
  const s = ucn(x, 0.4); const L = x.L; const w = ucnWill(x, s); w.head.rotation.y = 0.9 * eo(seg(L, 0.4, 1.0)); const g = put(x, 'golden', s, 4.25, 0, -0.6, -Math.PI / 2); g.idle(x.t, 0.3); g.root.visible = Math.sin(x.t * 23) > -0.2 && L > 1.3;
  camMove(x, [-1.4, 1.8, 1.6], [1.0, 1.4, -1.6], [-1.0, 1.75, 1.0], [2.5, 1.5, -1.0], eio, 46);
});
// "O espírito mais antigo, mais quieto e mais poderoso de todos"
at(408.94, 'oldest', x => {
  const s = voidS(x, 10, 40, '#ffd040', 1); const L = x.L; const g = put(x, 'golden', s, 0, 0, 0, 0); slump(g, 1); g.root.position.y += 0.25 * sm(seg(L, 1.0, 3.4)); g.head.rotation.x = mix(0.5, 0.2, sm(seg(L, 1.6, 3.2)));
  sparkles(x, s, [0, 1.0, 0], 1.0, 8, 0.5 * seg(L, 0.5, 1.5)); rimOn(x, s, [0, 3.6, -3], [0, 0.8, 0], 60, '#ffd040'); camMove(x, [0.4, 1.0, 4.4], [0, 0.9, 0], [0.2, 1.2, 3.0], [0, 1.0, 0], eio, 38);
});
// "O Golden Freddy" — eyes ignite
at(412.40, 'golden2', x => {
  const s = voidS(x, 30, 40, '#ffd040', 2); const L = x.L; const g = put(x, 'golden', s, 0, 0, 0, 0); g.idle(x.t, 0.4); lookAtCam(x, g, 1); g.setEyeGlow('#ffffff', sm(seg(L, 0.4, 0.7)));
  const hp = tp(g, 'head', [0, 4, 4]); camMove(x, [hp.x + 0.3, hp.y - 0.1, hp.z + 2.0], hp.toArray(), [hp.x + 0.1, hp.y, hp.z + 1.2], hp.toArray(), eio, 34); if (L > 0.4 && L < 0.5) x.post.flash.value = 0.15;
});
// "Só que tem uma teoria rival que diz que não é ele,"
at(413.82, 'rival', x => {
  const s = voidS(x, 26, 30, '#ffd040', 1.5); const L = x.L; const g = put(x, 'golden', s, -0.6, 0, 0, 0.3); g.idle(x.t, 0.4); g.root.visible = L < 2.0 || Math.sin(x.t * 31) > 0.4;
  glitchIn(x, g, seg(L, 1.0, 2.6)); x.S.voidRim.color.lerp(new THREE.Color('#a040ff'), seg(L, 1.4, 2.8));
  camMove(x, [0.4, 1.6, 4.4], [-0.3, 1.5, 0], [0.8, 1.6, 3.8], [0.2, 1.5, 0], eo, 38);
});
// "que tem outra criança cheia de ódio ainda mais vingativa" — a purple, burning little ghost
at(416.70, 'hate', x => {
  const s = voidS(x, 6, 40, '#a040ff', 0.4); const L = x.L; s.fog = null; const a = put(x, 'gAndrew', s, 0, 0.2 + 0.08 * Math.sin(x.t * 2), 0, 0); a.idle(x.t, 1); a.ghostMat.opacity = 0.65; lookAtCam(x, a, 0.7);
  agonyAt(x, s, new V3(0, 0.3, 0), 0.8, 1);
  camMove(x, [0.3, 1.0, 3.2], [0, 1.0, 0], [0.15, 1.05, 2.3], [0, 1.05, 0], eio, 38); x.post.tint.value.set(1.05, 0.85, 1.15);
});
// "Uma criança cujo nome os livros revelam,"
at(419.70, 'books_name', x => {
  const s = files(x, 0); const L = x.L; FILES.userData.book.forEach((p, i) => p.rotation.z = (i ? -1 : 1) * 0.15 * (1 - eo(seg(L, 0.2, 1.0))));
  const b = FILES.userData.book[0].parent.position; camMove(x, [b.x - 0.5, 1.55, b.z + 0.8], [b.x, 1.0, b.z], [b.x - 0.2, 1.3, b.z + 0.45], [b.x, 1.0, b.z], eio, 40); x.post.tint.value.set(1.0, 0.92, 1.1);
});
// "Andrew"
at(422.52, 'andrew', x => {
  const s = voidS(x, 26, 40, '#a040ff', 1.5); const L = x.L; const a = put(x, 'andrew', s, 0, 0, 0, 0); a.idle(x.t, 0.6); lookAtCam(x, a, 1); a.head.rotation.x -= 0.1;
  const hp = tp(a, 'head', [0, 4, 0]); camMove(x, [hp.x + 0.2, hp.y, hp.z + 2.0], hp.toArray(), [hp.x + 0.08, hp.y, hp.z + 1.6], hp.toArray(), eo, 34); if (L < 0.06) x.post.flash.value = 0.15;
});
// "Seja quem for a ideia é a mesma, a vítima virou o carcereiro" — William behind bars, the guardians outside
at(422.94, 'jailer', x => {
  const s = voidS(x, 30, 30, '#ffd040', 1.5); const L = x.L; s.fog = null; s.add(x.FX.cage); x.FX.cage.position.set(0, 0, -0.6); x.FX.cage.scale.set(1.0, 0.95, 1);
  const w = put(x, 'william', s, 0, 0, -1.0, 0); w.idle(x.t, 1); aim(w, 'R', new V3(-0.2, 1.5, -0.62), 0.9); aim(w, 'L', new V3(0.2, 1.45, -0.62), 0.9); w.head.rotation.x = 0.15;
  const g = put(x, 'golden', s, -1.4, 0, 0.5, 0.5), a = put(x, 'gAndrew', s, 1.3, 0.1, 0.6, -0.5); g.idle(x.t, 0.4); a.idle(x.t, 1); a.ghostMat.opacity = 0.6; g.setEyeGlow('#ffffff', 0.6);
  camMove(x, [0.4, 1.6, 4.6], [0, 1.3, -0.4], [0.2, 1.55, 3.6], [0, 1.35, -0.4], eo, 40);
});
// "e o carcereiro não vai soltar ele nunca" — the lights go out on him
at(426.58, 'never_free', x => {
  const s = voidS(x, 30 * (1 - sm(seg(x.L, 1.2, 1.9))), 30, '#ffd040', 1); const L = x.L; s.fog = null; s.add(x.FX.cage); x.FX.cage.position.set(0, 0, -0.6); x.FX.cage.scale.set(1.0, 0.95, 1);
  const w = put(x, 'william', s, 0, 0, -1.0, 0); w.idle(x.t, 1); aim(w, 'R', new V3(-0.2, 1.5, -0.62), 1); aim(w, 'L', new V3(0.2, 1.45, -0.62), 1); w.head.rotation.x = -0.1; w.root.position.x = 0.02 * Math.sin(x.t * 30) * seg(L, 0.3, 1.2);
  const hp = tp(w, 'head', [0, 4, 4]); camMove(x, [hp.x + 0.4, hp.y - 0.1, 1.8], hp.toArray(), [hp.x + 0.2, hp.y - 0.05, 1.2], hp.toArray(), eo, 38);
});
// "Nos livros, existe um lugar chamado O Fosso" — the ball pit
at(428.58, 'pit', x => {
  const s = pit(x, 0); const L = x.L; camMove(x, [0.6, 1.9, 5.6], [0, 0.4, -1.5], [0.2, 1.3, 3.6], [0, 0.5, -1.5], eio, 40);
});
// "É uma piscina de bolinhas abandonada aqui, quando você mergulha" — a kid jumps in
at(431.26, 'dive_pit', x => {
  const s = pit(x, 0); const L = x.L; const k = put(x, 'kid2', s, 0, 0, 0, Math.PI); const j = seg(L, 2.4, 3.1);
  k.root.position.set(0.2, 0.3 + 1.2 * Math.sin(Math.PI * j * 0.7) - 2.2 * ei(seg(L, 2.8, 3.14)), mix(1.2, -0.6, j)); k.root.rotation.x = -0.6 * j; k.walk(L * 2.2 * (1 - j), 1); k.root.visible = L < 3.1;
  if (L < 2.4) walkTo(k, [0.6, 0.3, 2.6], [0.2, 0.3, 1.2], seg(L, 0, 2.4), 0.5);
  camMove(x, [2.4, 1.8, 4.8], [0, 0.6, 0], [1.9, 1.6, 4.0], [0, 0.4, -0.4], eo, 42);
});
// "te leva de volta pra 1985" — under the balls, a flash, warm light
at(434.40, 'back85', x => {
  const L = x.L; if (L < 0.8) { const s = pit(x, 0); cam(x, [0, mix(0.7, 0.05, eio(seg(L, 0, 0.8))), 0.3], [0, -0.6, -1], 50); x.post.blur.value = seg(L, 0.4, 0.8); }
  else { const [s] = (() => { const s = diner(x, 1.1); return [s]; })(); const k = seg(L, 0.8, 1.9); cam(x, [0, mix(4.0, 1.7, eio(k)), mix(-1.0, 1.6, eio(k))], [0, 1.6, -4.4], 46); put(x, 'fredbear', s, 0.9, 0.77, -4.4, -0.15).idle(x.t, 1); put(x, 'springbonnie', s, -0.9, 0.77, -4.4, 0.15).idle(x.t, 1, 2);
    x.post.flash.value = 0.8 * (1 - seg(L, 0.8, 1.3)); x.post.tint.value.set(1.15, 1.02, 0.82); x.post.chroma.value = 0.6 * (1 - seg(L, 0.8, 1.6)); }
});
// "Pro dia em que tudo começou" — the diner in its golden days
at(436.30, 'the_day', x => {
  const [s, f, b] = (() => { const s = diner(x, 1.1); const f = put(x, 'fredbear', s, 0.9, 0.77, -4.4, -0.15); f.idle(x.t, 1); const b = put(x, 'springbonnie', s, -0.9, 0.77, -4.4, 0.15); b.idle(x.t, 1, 2); return [s, f, b]; })(); const L = x.L;
  [[-1.4, -1.6], [-0.4, -1.2], [0.7, -1.5], [1.6, -1.1]].forEach(([px, pz], i) => { const k = put(x, 'kid' + i, s, px, Math.max(0, Math.sin(x.t * 6 + i)) * 0.15, pz, Math.PI); k.idle(x.t, 1, i); aim(k, 'R', rootPt(k, -0.4, 2.0, -0.2), 0.6 + 0.4 * Math.sin(x.t * 6 + i)); });
  aim(f, 'R', rootPt(f, -0.6, 2.0, 0.4), 0.5 + 0.3 * Math.sin(x.t * 3)); camMove(x, [-0.8, 1.4, 1.4], [0, 1.5, -3.4], [0.6, 1.5, 1.2], [0, 1.6, -3.4], eio, 42); x.post.tint.value.set(1.12, 1.02, 0.85);
});
// "e sabe quem te espera lá do outro lado?" — a dark back corridor
at(438.62, 'other_side', x => {
  const s = hall(x, 0.3, '#ffd8a8'); const L = x.L; camMove(x, [0.2, 1.5, 0.5], [0, 1.4, -12], [0.1, 1.5, -3.0], [0, 1.4, -12], (u) => u, 40); hand(x, 0.8); x.post.tint.value.set(1.1, 1.0, 0.85);
});
// "Ele." — a yellow rabbit in the dark
at(440.96, 'him', x => {
  const s = hall(x, 0.0); x.S.hallLamps.forEach(l => l.intensity = 0); const L = x.L; const b = put(x, 'springbonnie', s, 0, 0, -6.6, 0); b.idle(x.t, 0.3); lookAtCam(x, b, 0.9);
  rimOn(x, s, [0, 3.0, -8.5], [0, 1.6, -6.6], 90, '#b060ff'); keyOn(x, s, [0.8, 2.6, -4.0], [0, 1.8, -6.6], 10, 0.4); cam(x, [0.1, 1.6, -3.0 + 0.2 * x.u], [0, 1.9, -6.6], 40); b.setEyeGlow('#ffffff', 0.5);
});
// "De roxo, num traje de coelho amarelo, sorrindo"
at(441.54, 'purple_suit', x => {
  const s = voidS(x, 26, 40, '#a040ff', 1.5); const L = x.L; const b = put(x, 'springbonnie', s, 0, 0, 0, 0); b.idle(x.t, 0.6); lookAtCam(x, b, 1); b.head.rotation.z = 0.25 * eo(seg(L, 2.3, 2.9));
  rimOn(x, s, [0, 3.6, -3], [0, 1.6, 0], 70, '#a040ff');
  const hp = tp(b, 'head', [0, 4, 4]); camMove(x, [0.6, 1.5, 4.2], [0, 1.7, 0], [hp.x + 0.15, hp.y - 0.05, hp.z + 1.6], hp.toArray(), eio, 36);
});
// "Sabe o que isso significa?" — he reaches out to you
at(444.60, 'means', x => {
  const s = voidS(x, 26, 40, '#a040ff', 1.5); const L = x.L; const b = put(x, 'springbonnie', s, 0, 0, 0, 0); b.idle(x.t, 0.6); lookAtCam(x, b, 1); aim(b, 'R', rootPt(b, -0.1, 1.5, 1.2), eo(seg(L, 0.2, 0.9)));
  camMove(x, [0.3, 1.6, 3.4], [0, 1.6, 0], [0.15, 1.65, 2.4], [0, 1.7, 0], eo, 38);
});
// "Se o tempo dentro de FNAF pode ser quebrado, então nada do que a gente viu tá garantido" — frozen, glitching in time
at(446.40, 'time_broken', x => {
  const s = voidS(x, 34, 26, '#ff3a2a', 2); const L = x.L; s.fog = null;
  ['spring', 'golden', 'glitchtrap', 'baby'].forEach((n, i) => { const c = put(x, n, s, (i - 1.5) * 1.5, 0, -0.4 * Math.abs(i - 1.5), -(i - 1.5) * 0.12); const fr = Math.floor(x.t * 4 + i) % 3 === 0; c.idle(fr ? Math.floor(x.t) : x.t, 1, i); if (fr) glitchIn(x, c, 0.6); if (c.setEyes) c.setEyes('#5aff6a'); });
  const a = mix(-0.5, 0.5, eio(x.u)); cam(x, [Math.sin(a) * 7.0, 1.7, Math.cos(a) * 7.0], [0, 1.5, 0], 36); x.post.chroma.value = 0.5; if (Math.sin(x.t * 2.3) > 0.9) x.post.stat.value = 0.25;
});
// "Nenhuma morte," — Springtrap rises again
at(451.16, 'no_death', x => {
  const s = fright(x, 0.6); const L = x.L; const c = put(x, 'spring', s, 0, 0, -5.4, 0); const k = eo(seg(L, 0.0, 1.0)); c.root.position.y = -0.25 * (1 - k); c.torso.rotation.x = 1.1 * (1 - k);
  c.legR.piv.rotation.x = -1.4 * (1 - k); c.legL.piv.rotation.x = -1.2 * (1 - k); twitch(c, x.t, 1.2); camMove(x, [0.5, 0.8, -2.8], [0, 1.2, -5.4], [0.3, 1.3, -3.0], [0, 1.9, -5.4], eio, 44); fillOn(x, c, 2, 1.8);
});
// "nenhum final,"
at(452.40, 'no_final', x => {
  const s = voidS(x, 30, 30, '#ffd040', 1); const L = x.L; const g = put(x, 'golden', s, 0, 0, 0, 0); g.idle(x.t, 0.4); lookAtCam(x, g, 1); glitchIn(x, g, 0.6); g.setEyeGlow('#ffffff', 0.8);
  const hp = tp(g, 'head', [0, 4, 4]); camMove(x, [hp.x + 0.2, hp.y, hp.z + 1.8], hp.toArray(), [hp.x + 0.05, hp.y, hp.z + 1.3], hp.toArray(), eo, 34); staticIn(x, 0.1);
});
// "nenhum fim" — only Glitchtrap's grin in the dark, then black
at(453.38, 'no_end', x => {
  const s = voidS(x, 8, 30, '#a05aff', 0.3); const L = x.L; const g = put(x, 'glitchtrap', s, 0, 0, 0, 0); g.idle(x.t, 0.4); lookAtCam(x, g, 1); g.head.rotation.z = 0.25;
  const hp = tp(g, 'head', [0, 4, 4]); cam(x, [hp.x, hp.y, hp.z + 1.1 - 0.15 * x.u], hp.toArray(), 34); x.post.fade.value = sm(seg(L, 0.4, 0.92)); glitchIn(x, g, 0.3);
});

// ================================ PART 5: CAMADA 5 — O FUNDO ================================
let MIMIC_EYES = null;
function mimicEyes(x, k = 1, col = '#ffb84a') { const m = x.C.mimic; if (!MIMIC_EYES) { MIMIC_EYES = []; m.root.traverse(o => { if (o.isMesh && o.material.isMeshBasicMaterial && o.material.color.getHexString() === 'ffb84a') MIMIC_EYES.push(o.material); }); }
  MIMIC_EYES.forEach(mt => mt.color.set(col).multiplyScalar(Math.max(0.02, k))); m.eyeLight.intensity = 2.5 * k; m.eyeLight.color.set(col); }
const _cleanup2 = cleanup;
cleanup = function (x) { _cleanup2(x); if (MIMIC_EYES) mimicEyes(x, 1); x.FX.agony.visible = true; };
function ruinAtrium(x) { const s = x.S.atrium; x.out.scene = s; x.S.ruinMode('atrium', x.t); x.post.vig.value = 1.0; return s; }
// pose B copies pose A (mirror)
function mirrorPose(a, b) { for (const k of ['armR', 'armL', 'legR', 'legL']) { const o = k.endsWith('R') ? k.replace('R', 'L') : k.replace('L', 'R'); b[o].piv.quaternion.copy(a[k].piv.quaternion); b[o].piv.rotation.y *= -1; b[o].piv.rotation.z *= -1; }
  b.head.rotation.set(a.head.rotation.x, -a.head.rotation.y, -a.head.rotation.z); }

// "Camada 5, o fundo"
at(454.3, 'dive5', x => { dive(x, 4, ICE_DEPTHS[3], ICE_DEPTHS[4]); });
// "Aqui ninguém deveria chegar"
at(458.98, 'nobody', x => { const L = x.L; iceCam(x, mix(-42, -45, eio(x.u)), 0.1, 18, -6, 46, -5); ice(x, { red: 1, rush: 0.5 }); });
// "Os jogos mais novos trouxeram uma coisa" — Secret of the Mimic logo over a dark silhouette
at(460.50, 'logo_sotm', x => {
  const s = voidS(x, 0, 30, '#ff8a3a', 0.5); const m = put(x, 'mimic', s, 0, 0, 0, 0); m.idle(x.t, 0.5); mimicEyes(x, 0.8); cam(x, [0, 1.7, 4.6 - 0.3 * x.u], [0, 1.8, 0], 38); logoCard(x, 0); x.post.blur.value = 1;
});
// "que fez a comunidade inteira entrar em pânico" — alarm lights in the hall
at(462.90, 'panic', x => {
  const s = hall(x, 0, '#ff2a1a'); const L = x.L; const on = Math.floor(x.t * 3) % 2; x.S.hallLamps.forEach((l, i) => l.intensity = on ? 12 : 1.5);
  ['bonnie', 'chica'].forEach((n, i) => { const c = put(x, n, s, i ? 0.9 : -0.9, 0, -5.5 - i, i ? -0.3 : 0.3); c.idle(x.t, 1, i); twitch(c, x.t + i, 1.5); c.setEyeGlow('#ff3020', on); });
  camMove(x, [0.4, 1.5, 1.0], [0, 1.8, -6], [0.1, 1.6, -0.8], [0, 1.9, -6], eo, 44); shake(x, 0.12); x.post.tint.value.set(1.15, 0.85, 0.85);
});
// "O Mimic"
at(465.16, 'mimic', x => {
  const s = voidS(x, 18, 36, '#ff8a3a', 1); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); m.idle(x.t, 0.6); lookAtCam(x, m, 0.8); mimicEyes(x, sm(seg(L, 0.1, 0.35)));
  const hp = tp(m, 'head', [0, 4, 3]); camMove(x, [0.4, hp.y - 0.4, 4.0], hp.toArray(), [0.15, hp.y - 0.1, 2.6], hp.toArray(), eo, 34); if (L > 0.12 && L < 0.2) x.post.flash.value = 0.15;
});
// "Um robô criado por um inventor chamado Edwin Murray" — the workshop
at(466.00, 'edwin', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 0.9; const L = x.L; x.S.shopLamp.intensity = 14; const m = put(x, 'mimic', s, 1.3, 0, -2.6, -0.4); m.idle(x.t, 0.2); m.head.rotation.x = 0.35; mimicEyes(x, 0.05);
  const e = put(x, 'edwin', s, 0.1, 0, -1.6, 1.2); e.idle(x.t, 1); aim(e, 'R', tp(m, 'torso', [0, 7, 3]), 0.8 + 0.1 * Math.sin(x.t * 9)); e.head.rotation.x = 0.1; if (L > 1.9) lookAtCam(x, e, eo(seg(L, 1.9, 2.4)));
  camMove(x, [-1.2, 1.7, 1.2], [0.7, 1.5, -2.1], [-0.8, 1.65, 0.6], [0.7, 1.55, -2.2], eo, 42); fillOn(x, e, 1.4, 1.8);
});
// "Feito para aprender e copiar o comportamento humano" — it mirrors Edwin's every move
at(468.88, 'learn', x => {
  const s = voidS(x, 36, 18, '#ff8a3a', 3); const L = x.L; s.fog = null; const e = put(x, 'edwin', s, -0.9, 0, 0, 0.5), m = put(x, 'mimic', s, 0.9, 0, 0, -0.5); mimicEyes(x, 1);
  e.idle(x.t, 1); aim(e, 'L', rootPt(e, 0.55, 1.6 + 0.35 * Math.sin(x.t * 2.4), 0.4), 0.9); e.head.rotation.y = 0.3 * Math.sin(x.t * 1.2); e.head.rotation.z = 0.15 * Math.sin(x.t * 1.7);
  m.idle(x.t, 1); mirrorPose(e, m);
  camMove(x, [0, 1.6, 5.0], [0, 1.5, 0], [0, 1.65, 4.2], [0, 1.55, 0], eo, 38);
});
// "Mas ele não aprendeu amor nem alegria"
at(471.52, 'not_love', x => {
  const s = voidS(x, 20, 20, '#6ab0ff', 1); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); m.idle(x.t, 0.5); mimicEyes(x, 0.7); m.head.rotation.z = 0.3 * eo(seg(L, 0.6, 1.4)); m.head.rotation.x = 0.15;
  const a = mix(0.8, 0.2, eio(x.u)); cam(x, [Math.sin(a) * 4.0, 1.9, Math.cos(a) * 4.0], [0, 1.8, 0], 38); x.post.tint.value.set(0.85, 0.92, 1.12);
});
// "Depois de uma tragédia com a família do criador,"
at(474.06, 'tragedy', x => {
  const s = voidS(x, 22, 26, '#ff2a1a', 0.6); const L = x.L; const e = put(x, 'edwin', s, 0, 0, 0, 0); kneel(e, 1); e.head.rotation.x = 0.6; aim(e, 'R', rootPt(e, 0.05, 1.5, 0.35), 0.9); aim(e, 'L', rootPt(e, -0.05, 1.5, 0.35), 0.9);
  e.torso.rotation.x += 0.03 * Math.sin(x.t * 8); camMove(x, [0.6, 1.0, 3.2], [0, 1.0, 0], [0.3, 1.1, 2.4], [0, 1.05, 0], eo, 38); x.post.tint.value.set(1.0, 0.85, 0.88);
});
// "ele aprendeu a dor. Raiva." — the eyes burn, it shakes
at(476.70, 'rage', x => {
  const s = voidS(x, 16, 44, '#ff2a1a', 0.6); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); m.idle(x.t, 1); lookAtCam(x, m, 0.8); const k = sm(seg(L, 0.9, 1.3));
  mimicEyes(x, 1 + 1.5 * k, k > 0.5 ? '#ff3a1a' : '#ffb84a'); twitch(m, x.t, 1 + k); m.torso.rotation.x = -0.15 * k; aim(m, 'R', rootPt(m, -0.7, 1.5, 0.3), k); aim(m, 'L', rootPt(m, 0.7, 1.5, 0.3), k);
  agonyAt(x, s, new V3(0, 0.3, 0), 1.0, 0); x.FX.agony.visible = k > 0.1; if (k > 0.2) shake(x, 0.35 * k);
  const hp = tp(m, 'head', [0, 4, 3]); camMove(x, [0.3, hp.y - 0.4, 3.6], hp.toArray(), [0.1, hp.y - 0.3, 2.4], hp.toArray(), eo, 36); x.post.tint.value.set(1.1, 0.88, 0.85);
});
// "E começou a copiar exatamente isso" — stalking through the ruined Pizzaplex
at(478.54, 'copy_that', x => {
  const s = ruinAtrium(x); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); walkTo(m, [0.2, 0, -6.5], [0.1, 0, -3.4], eo(seg(L, 0, 2.4)), 1.0); lookAtCam(x, m, 0.5); mimicEyes(x, 1.3);
  camMove(x, [0.6, 1.2, 1.2], [0, 2.0, -6], [0.3, 1.4, 0.2], [0, 2.1, -4], eo, 42); fillOn(x, m, 2.4, 2.4); hand(x, 0.7);
});
// "O Mimic imita vozes, imita pessoas" — sound rings at its head, then it takes a person's pose
at(480.98, 'voices', x => {
  const s = voidS(x, 30, 26, '#ff8a3a', 2); const L = x.L; s.fog = null; const m = put(x, 'mimic', s, 0.7, 0, 0, -0.3); m.idle(x.t, 1); mimicEyes(x, 1);
  const hp = tp(m, 'head', [0, 2, 5]); waves(x, s, hp, 1.4, '#ffb84a'); const p = put(x, 'guard', s, -0.8, 0, 0.1, 0.3); p.idle(x.t, 1); aim(p, 'R', rootPt(p, -0.45, 1.8, 0.4), 0.8 + 0.2 * Math.sin(x.t * 6)); p.head.rotation.z = 0.2;
  if (L > 1.0) { mirrorPose(p, m); } camMove(x, [0, 1.6, 4.8], [0, 1.5, 0], [0.2, 1.7, 4.0], [0, 1.6, 0], eo, 38);
});
// "Em Ruin, ele chega a fingir ser alguém que você confia" — a friendly Freddy... that isn't
at(483.32, 'ruin_fake', x => {
  const s = ruinAtrium(x); const L = x.L; const sw = L > 2.6; const n = sw ? 'mimic' : 'freddy'; const c = put(x, n, s, 0, 0, -4.2, 0); c.idle(x.t, 1); lookAtCam(x, c, 0.8);
  if (!sw) { aim(c, 'R', rootPt(c, -0.6, 2.0 + 0.15 * Math.sin(x.t * 9), 0.3), eo(seg(L, 0.3, 0.7))); } else { mimicEyes(x, 1.5); }
  if (L > 2.45 && L < 2.85) { glitchIn(x, c, 1); x.post.stat.value = 0.5; x.post.chroma.value = 1; }
  camMove(x, [0.3, 1.5, -0.4], [0, 1.9, -4.2], [0.15, 1.7, -1.6], [0, 2.0, -4.2], eo, 42); fillOn(x, c, 2.2, 2.2);
});
// "E aí nasce a teoria mais perturbadora dos últimos anos"
at(486.56, 'theory5', x => { const L = x.L; iceCam(x, mix(-44, -47, eio(x.u)), mix(-0.4, 0.2, eio(x.u)), 20, -5, 46, 6); ice(x, { red: 1, rush: 0.6 }); });
// "E se algumas das vezes em que a gente achou que o William tinha voltado"
at(489.64, 'what_if', x => {
  const s = fright(x, 0.8); const L = x.L; const c = put(x, 'spring', s, 0, 0, -5.0, 0); c.idle(x.t, 1); twitch(c, x.t, 1); lookAtCam(x, c, 0.5);
  camMove(x, [0.6, 1.5, -1.4], [0, 1.9, -5], [0.3, 1.7, -2.6], [0, 2.0, -5], eio, 42); fillOn(x, c, 2, 2);
});
// "Não era ele." — Springtrap flickers into the Mimic
at(493.70, 'not_him', x => {
  const s = fright(x, 0.8); const L = x.L; const sw = L > 0.5; const c = put(x, sw ? 'mimic' : 'spring', s, 0, 0, -5.0, 0); c.idle(x.t, 1); lookAtCam(x, c, 0.8); if (sw) mimicEyes(x, 1.4);
  if (L > 0.35 && L < 0.75) { glitchIn(x, c, 1); x.post.stat.value = 0.45; x.post.chroma.value = 1; }
  const hp = tp(c, 'head', [0, 4, 4]); cam(x, [hp.x + 0.2, hp.y - 0.1, hp.z + 2.2 - 0.3 * x.u], hp.toArray(), 38); fillOn(x, c, 2, 2);
});
// "E se fosse uma máquina que aprendeu a ser o William Afton"
at(495.14, 'machine', x => {
  const s = voidS(x, 26, 36, '#a040ff', 1.5); const L = x.L; s.fog = null; const m = put(x, 'mimic', s, 0, 0, 0, 0); m.idle(x.t, 0.8); lookAtCam(x, m, 0.8); mimicEyes(x, 1);
  const g = put(x, 'gWilliam', s, 0, 0.05, 0.15, 0); g.idle(x.t, 0.8); lookAtCam(x, g, 0.8); g.ghostMat.color.set('#c070ff'); g.ghostMat.opacity = 0.4 * sm(seg(L, 1.4, 2.4)); g.root.scale.setScalar(1.3);
  const a = mix(0.5, -0.2, eio(x.u)); cam(x, [Math.sin(a) * 4.0, 1.9, Math.cos(a) * 4.0], [0, 1.8, 0], 38);
});
// "Tão bem, que nem dá mais para saber a diferença" — William and the Mimic, one light switching between them
at(497.92, 'difference', x => {
  const s = voidS(x, 0, 20, '#a040ff', 1); const L = x.L; s.fog = null; const w = put(x, 'william', s, -0.85, 0, 0, 0.25), m = put(x, 'mimic', s, 0.85, 0, 0, -0.25);
  w.idle(x.t, 1); aim(w, 'R', rootPt(w, -0.5, 1.7, 0.4), 0.7); lookAtCam(x, w, 0.8); m.idle(x.t, 1); mirrorPose(w, m); mimicEyes(x, 1);
  const side = Math.floor(x.t * 2.2) % 2; keyOn(x, s, [side ? 1.6 : -1.6, 3.4, 2.6], [side ? 0.85 : -0.85, 1.4, 0], 30, 0.35);
  camMove(x, [0, 1.6, 5.4], [0, 1.6, 0], [0, 1.65, 4.6], [0, 1.65, 0], eo, 38); if (L > 2.9) { x.post.stat.value = 0.5 * seg(L, 2.9, 3.14); }
});

// ================================ PART 6: CAMADA 6 — SEM NOME (+ final, animation only) ================================
function seabed(x, y = -56) { const L = x.L; return ice(x, { red: 1, rush: 0.4 }); }
function plushBand(x, s, cx, cz) { [['freddy', -0.55, 0.35], ['bonnie', 0.55, 0.3], ['chica', -0.35, -0.55], ['foxy', 0.45, -0.5]].forEach(([n, dx, dz], i) => {
  const p = put(x, n, s, cx + dx, 0.0, cz + dz, Math.atan2(-dx, -dz), 0.24 / 1.22); slump(p, 0.2); p.head.rotation.x = 0.1; p.head.rotation.y = 0.1 * Math.sin(x.t * 0.8 + i); }); }
function lyingKid(x, s, a = 0.25) { const c = lie(x, 'cchild', s, 0, 0, 0.25, 0.76); c.head.rotation.y = 0.5; return c; }

// "Camada 6, sem nome"
at(501.0667, 'dive6', x => { dive(x, 5, ICE_DEPTHS[4], ICE_DEPTHS[5]); });
// "Se você chegou até aqui, merece escutar essa" — the very bottom; one small soul glowing on the floor
at(506.00, 'reached', x => {
  const L = x.L; const y = mix(-53, -58, eio(x.u)); cam(x, [3, y, 6], [0, y - 3, -6], 48); seabed(x); const s = x.S.ice; orbAt(x, 0, s, new V3(0, y - 3.2, -6), 0.5);
});
// "Lembra da pergunta que eu mandei você guardar?"
at(509.58, 'remember', x => {
  const s = voidS(x, 30, 26, '#a040ff', 1); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.4); lookAtCam(x, w, 1);
  const hp = tp(w, 'head', [0, 4, 4]); camMove(x, [hp.x - 0.3, hp.y, hp.z + 1.7], hp.toArray(), [hp.x - 0.1, hp.y, hp.z + 1.0], hp.toArray(), eio, 30); fillOn(x, w, 0.8, 1.9);
});
// "Por que o William estudava como prender almas em máquinas?"
at(512.22, 'why_souls', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 1.0; const L = x.L; x.S.shopLamp.intensity = 4; const t = tankAt(x, s, [-1.5, 1.01, -3.2], 0.85, 1.6); const c = t.position;
  [0, 1, 2].forEach(i => { const a = x.t * 1.6 + i * 2.1; orbAt(x, i, s, new V3(c.x + Math.cos(a) * 0.18, c.y + 0.55 + 0.2 * Math.sin(x.t * 2 + i), c.z + Math.sin(a) * 0.18), 0.25); });
  const w = put(x, 'william', s, -0.5, 0, -1.9, -2.45); w.idle(x.t, 0.6); aim(w, 'R', new V3(-1.3, 1.6, -2.95), 0.9); const hp = tp(w, 'head', [0, 4, 4]); keyOn(x, s, [-1.5, 1.8, -3.1], hp.toArray(), 8, 0.6); KEY.color.set('#3ad8ff');
  camMove(x, [-2.6, 1.8, -1.6], [-1.0, 1.55, -2.5], [-2.3, 1.8, -1.9], [-1.0, 1.55, -2.6], eo, 44);
});
// "Essa é uma das teorias mais antigas e mais tristes do fundo do iceberg"
at(515.20, 'saddest', x => { const L = x.L; const y = -57; const a = mix(-0.3, 0.3, eio(x.u)); cam(x, [Math.sin(a) * 4, y + 0.5, -6 + Math.cos(a) * 4], [0, y - 2.6, -6], 46); seabed(x); orbAt(x, 0, x.S.ice, new V3(0, y - 3.0 + 0.1 * Math.sin(x.t), -6), 0.45); x.post.tint.value.set(0.7, 0.8, 1.1); });
// "O filho caçula dele foi mordido pelo Fredbear"
at(519.68, 'son', x => {
  const s = diner(x, 0.7); const L = x.L; const f = put(x, 'fredbear', s, 0, 0.77, -4.4, 0); f.idle(x.t, 0.6); const k = ei(seg(L, 2.4, 2.6)); f.head.rotation.x = 0.2 + 0.4 * k; f.torso.rotation.x = 0.3 * k;
  if (L > 2.6) { x.post.tint.value.set(1.5, 0.4, 0.4); shake(x, 0.6 * (1 - seg(L, 2.6, 3.0))); } const hp = tp(f, 'head', [0, 3, 4]); camMove(x, [0.4, 1.7, -1.0], hp.toArray(), [0.2, 2.0, -2.2], hp.toArray(), eio, 42); fillOn(x, f, 1.5, 2.4);
});
// "A filha foi morta pela Baby"
at(522.74, 'daughter_baby', x => {
  const L = x.L; const [s, b, e] = babyScene(x); const open = eo(seg(L, 0, 0.3)), ext = eo(seg(L, 0.3, 0.6)), grip = eo(seg(L, 0.6, 0.7)), back_ = ei(seg(L, 0.8, 1.2));
  b.setClaw(open, ext * (1 - back_), grip); e.root.position.z = mix(-1.75, -2.6, back_); e.root.visible = L < 1.2; if (L > 1.2) b.setClaw(1 - eo(seg(L, 1.2, 1.5)), 0, 0);
  cam(x, [1.7, 1.35, -0.6], [0, 1.3, -2.5], 40); x.post.tint.value.set(0.9, 0.9, 1.05); if (L > 1.2 && L < 1.3) x.post.flash.value = 0.2;
});
// "A família dele inteira foi destruída pelas máquinas que ele mesmo construiu"
at(524.80, 'family_gone', x => {
  const s = voidS(x, 26, 30, '#ff2a1a', 0.8); const L = x.L; s.fog = null; const w = put(x, 'william', s, 0, 0, 0.6, 0); w.idle(x.t, 0.6); w.head.rotation.x = 0.4;
  const gc = put(x, 'gCchild', s, -0.8, 0.1, 0.4, 0.2), ge = put(x, 'gCharlotte', s, 0.8, 0.1, 0.4, -0.2); [gc, ge].forEach((g, i) => { g.idle(x.t, 1, i); g.ghostMat.opacity = 0.45 * (1 - sm(seg(L, 1.5, 3.6))); });
  const f = put(x, 'fredbear', s, -1.5, 0, -1.8, 0.4), b = put(x, 'baby', s, 1.5, 0, -1.8, -0.4); f.idle(x.t, 0.5); b.idle(x.t, 0.5); b.setEyes('#5aff6a'); rimOn(x, s, [0, 4, -4], [0, 1.6, -1.8], 70, '#ff2a1a');
  camMove(x, [0, 1.3, 5.6], [0, 1.6, -0.5], [0, 1.5, 4.6], [0, 1.7, -0.6], eio, 40);
});
// "E se o Afton não estava só matando"
at(528.88, 'not_only', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 0.95; const L = x.L; x.S.shopLamp.intensity = 10; const sb = put(x, 'springbonnie', s, 1.3, 0, -2.6, -0.4); droop(sb, 0.3); x.setXray(sb, 0.8, 0.3, '#3ad8ff');
  const w = put(x, 'william', s, 0.1, 0, -1.7, 1.2); w.idle(x.t, 1); aim(w, 'R', tp(sb, 'torso', [0, 6, 3]), 0.85 + 0.1 * Math.sin(x.t * 9)); w.head.rotation.x = 0.2;
  camMove(x, [-1.3, 1.6, 1.0], [0.7, 1.5, -2.1], [-0.9, 1.6, 0.4], [0.8, 1.55, -2.2], eo, 42); fillOn(x, w, 1.4, 1.8);
});
// "E se ele estava tentando descobrir um jeito de trazer os filhos de volta" — the children's shadows behind the glowing tank
at(531.34, 'bring_back', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 1.0; const L = x.L; x.S.shopLamp.intensity = 3; const t = tankAt(x, s, [-1.5, 1.01, -3.2], 0.85, 1.6);
  const w = put(x, 'william', s, -0.4, 0, -1.8, -2.45); w.idle(x.t, 0.5); aim(w, 'L', new V3(-1.2, 1.4, -2.9), 0.9); w.head.rotation.x = 0.15;
  const gc = put(x, 'gCchild', s, -2.3, 0.1, -3.4, 0.6), ge = put(x, 'gCharlotte', s, -0.7, 0.1, -3.6, -0.3); [gc, ge].forEach((g, i) => { g.idle(x.t, 1, i); g.ghostMat.opacity = 0.4 * sm(seg(L, 0.8, 2.4)); });
  camMove(x, [0.9, 1.6, 0.6], [-1.3, 1.4, -3.0], [0.5, 1.55, -0.1], [-1.4, 1.4, -3.1], eo, 42);
});
// "De colocar a alma do menino num corpo de metal" — the little ghost steps into the endoskeleton
at(535.58, 'soul_metal', x => {
  const s = voidS(x, 26, 26, '#3ad8ff', 1.5); const L = x.L; s.fog = null; const f = put(x, 'freddy', s, 0, 0, 0, 0); f.idle(x.t, 0.4); x.setXray(f, 0.85, 0.3 + 0.7 * seg(L, 1.6, 2.2), '#3ad8ff');
  const k = eio(seg(L, 0.2, 1.8)); const g = put(x, 'gCchild', s, 0, mix(0, 0.5, k), mix(1.4, 0.05, k), Math.PI); g.idle(x.t, 1); g.ghostMat.opacity = 0.55 * (1 - seg(L, 1.6, 2.1));
  const a = mix(0.7, 0.3, eio(x.u)); cam(x, [Math.sin(a) * 3.6, 1.6, Math.cos(a) * 3.6], [0, 1.4, 0.3], 38); if (L > 1.75 && L < 1.85) x.post.flash.value = 0.12;
});
// "Num corpo que não morre"
at(538.34, 'never_dies', x => {
  const s = voidS(x, 30, 26, '#3ad8ff', 2); const L = x.L; const f = put(x, 'freddy', s, 0, 0, 0, 0); f.idle(x.t, 0.4); x.setXray(f, 0.85, 0.6 + 0.3 * Math.sin(x.t * 3), '#3ad8ff'); lookAtCam(x, f, 0.5);
  const a = mix(-0.6, 0.2, eio(x.u)); cam(x, [Math.sin(a) * 3.8, 2.4, Math.cos(a) * 3.8], [0, 1.4, 0], 38);
});
// "Num corpo que ele mesmo pudesse consertar" — William repairing it, sparks
at(540.06, 'fix', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 0.95; const L = x.L; x.S.shopLamp.intensity = 12; const f = put(x, 'freddy', s, 1.2, 0, -2.6, -0.5); droop(f, 0.5); x.setXray(f, 0.6, 0.3, '#3ad8ff');
  const w = put(x, 'william', s, 0.1, 0, -1.8, 1.0); w.idle(x.t, 1); const tgt = tp(f, 'torso', [0, 7, 3]); aim(w, 'R', tgt, 0.95); aim(w, 'L', tp(f, 'torso', [3, 5, 3]), 0.8); w.head.rotation.x = 0.25;
  sparksAt(x, s, tgt, (L % 0.7) * 1.4); camMove(x, [-0.6, 1.5, 0.6], [0.7, 1.4, -2.2], [-0.3, 1.45, 0.0], [0.75, 1.4, -2.3], eo, 42); fillOn(x, w, 1.2, 1.8);
});
// "Cada criança que ele matou teria sido um teste" — a scanning light passes each little ghost
at(543.56, 'tests', x => {
  const s = voidS(x, 6, 30, '#ff2a1a', 0.4); const L = x.L; s.fog = null; const scan = mix(-3, 3, seg(L, 0.2, 2.6));
  for (let i = 0; i < 5; i++) { const px = (i - 2) * 1.2; ghostKid(x, i, s, [px, 0.05 * Math.sin(x.t * 2 + i), 0], 0, 0.15 + 0.55 * Math.exp(-((px - scan) ** 2) * 3)); }
  keyOn(x, s, [scan, 3.5, 2.2], [scan, 0.6, 0], 30, 0.25); KEY.color.set('#ff4a3a'); camMove(x, [0, 1.3, 6.2], [0, 0.9, 0], [0, 1.2, 5.4], [0, 0.95, 0], eo, 36);
});
// "Não tem nada confirmado"
at(546.34, 'unconfirmed', x => {
  const s = files(x, 0); const L = x.L; FILES.userData.cover.rotation.z = -2.9 * (1 - eio(seg(L, 0.2, 0.9))); camMove(x, [0.8, 1.55, 0.8], [0.3, 1.0, 0.1], [0.6, 1.45, 0.6], [0.3, 1.0, 0.1], eo, 40);
});
// "Mas se for verdade"
at(547.90, 'if_true', x => {
  const s = voidS(x, 0, 30, '#a040ff', 0.4); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.4); lookAtCam(x, w, 1); rimOn(x, s, [0.6, 3.2, -2.4], [0, 1.7, 0], 50, '#a040ff');
  const hp = tp(w, 'head', [0, 4, 4]); cam(x, [hp.x + 0.3, hp.y, hp.z + 1.3 - 0.2 * x.u], hp.toArray(), 32);
});
// "O maior monstro de FNAF não nasceu monstro" — once, just a father
at(549.02, 'born_man', x => {
  const s = voidS(x, 44, 10, '#ffd0a0', 3); const L = x.L; s.fog = null; const w = put(x, 'william', s, 0, 0, -0.3, 0), m = put(x, 'michael', s, -0.95, 0, 0.1, 0.2), e = put(x, 'elizabeth', s, 1.05, 0, 0.2, -0.25), c = put(x, 'cchild', s, 0.45, 0, 0.75, -0.1);
  [w, m, e, c].forEach((p, i) => { p.idle(x.t, 1, i); lookAtCam(x, p, 0.5); }); aim(w, 'L', tp(e, 'head', [0, 9, 0]), 0.8);
  camMove(x, [0.0, 1.8, 4.4], [0, 1.25, 0], [0.0, 1.75, 3.9], [0, 1.25, 0], eo, 38); x.post.tint.value.set(1.12, 1.0, 0.85); x.post.fade.value = 0.5 * sm(seg(L, 2.3, 2.98));
});
// "Ele virou monstro tentando desfazer o próprio erro" — William becomes Springtrap
at(552.02, 'became', x => {
  const s = voidS(x, 26, 36, '#ff2a1a', 1); const L = x.L; const sw = L > 0.75; const c = put(x, sw ? 'spring' : 'william', s, 0, 0, 0, 0); c.idle(x.t, 0.6); lookAtCam(x, c, 0.8); if (sw) twitch(c, x.t, 0.8);
  if (L > 0.55 && L < 0.95) { glitchIn(x, c, 1); x.post.stat.value = 0.4; x.post.chroma.value = 1; }
  camMove(x, [0.5, 1.5, 4.4], [0, 1.6, 0], [0.2, 1.7, 3.2], [0, 1.75, 0], eio, 38); x.post.tint.value.set(1.1, 0.88, 0.85);
});
// "E cometendo mil erros piores no caminho"
at(554.92, 'worse', x => {
  const s = fright(x, 0.8); const L = x.L; const c = put(x, 'spring', s, 0, 0, 0, 0); walkTo(c, [0, 0, -7], [0, 0, -4.6], eo(seg(L, 0, 2.2)), 1.1); twitch(c, x.t, 0.8);
  for (let i = 0; i < 5; i++) ghostKid(x, i, s, [(i - 2) * 0.6, 0.2, -2.6 - (i % 2) * 0.4], Math.PI, 0.35);
  camMove(x, [0.4, 1.4, -0.6], [0, 1.8, -6], [0.2, 1.5, -1.4], [0, 1.9, -5], eo, 44); fillOn(x, c, 2, 2);
});
// "No final de FNAF 4, depois da mordida"
at(557.20, 'f4_end', x => {
  const s = voidS(x, 18, 0, '#ffffff', 0.4); const L = x.L; s.fog = null; const c = lyingKid(x, s); camMove(x, [0.4, 3.2, 2.0], [0, 0.1, -0.2], [0.2, 2.6, 1.4], [0, 0.1, -0.2], eo, 40); x.post.tint.value.set(0.85, 0.85, 0.95);
});
// "Depois que a criança está morrendo na escuridão" — the light dies
at(559.92, 'dying', x => {
  const s = voidS(x, 18 * (1 - 0.8 * sm(seg(x.L, 0.4, 2.1))), 0, '#ffffff', 0.3); const L = x.L; s.fog = null; const c = lyingKid(x, s); const hp = tp(c, 'head', [0, 4, 4]);
  camMove(x, [hp.x + 0.9, hp.y + 1.3, hp.z + 0.6], hp.toArray(), [hp.x + 0.5, hp.y + 0.9, hp.z + 0.35], hp.toArray(), eio, 40);
});
// "Uma voz fala com ela"
at(562.22, 'a_voice', x => {
  const s = voidS(x, 5, 0, '#ffffff', 0.3); const L = x.L; s.fog = null; const c = lyingKid(x, s); const hp = tp(c, 'head', [0, 4, 4]); waves(x, s, new V3(hp.x, hp.y + 0.6, hp.z), 0.6, '#ffe8c0');
  cam(x, [hp.x + 0.7, hp.y + 1.1, hp.z + 0.5], hp.toArray(), 40);
});
// "Ela diz que a criança ainda consegue ouvir, que ela ainda está lá dentro"
at(563.66, 'can_hear', x => {
  const s = voidS(x, 8, 0, '#ffffff', 0.4); const L = x.L; s.fog = null; const c = lyingKid(x, s); const hp = tp(c, 'head', [0, 4, 4]); sparkles(x, s, [hp.x, hp.y + 0.3, hp.z], 0.4, 6, 0.3);
  const ch = tp(c, 'torso', [0, 6, 2]); orbAt(x, 0, s, ch, 0.18 * (0.7 + 0.3 * Math.sin(x.t * 3)));
  camMove(x, [hp.x + 0.6, hp.y + 0.7, hp.z + 0.6], hp.toArray(), [hp.x + 0.35, hp.y + 0.45, hp.z + 0.35], hp.toArray(), eio, 40);
});
// "E que os amigos ainda são amigos dela" — the plushies gathered around him
at(567.22, 'friends', x => {
  const s = voidS(x, 14, 0, '#ffffff', 0.5); const L = x.L; s.fog = null; lyingKid(x, s); plushBand(x, s, 0, 0.2);
  const a = mix(0.9, 0.3, eio(x.u)); cam(x, [Math.sin(a) * 2.6, 1.5, Math.cos(a) * 2.6], [0, 0.15, 0], 40); x.post.tint.value.set(1.0, 0.95, 1.05);
});
// "E termina dizendo"
at(569.40, 'ends_saying', x => {
  const s = voidS(x, 10, 0, '#ffffff', 0.4); const L = x.L; s.fog = null; lyingKid(x, s); plushBand(x, s, 0, 0.2); cam(x, [0, mix(2.0, 3.6, eio(x.u)), 1.2], [0, 0.1, 0], 40);
});
// "Eu ainda estou aqui" — a soft white light opens over him
at(570.54, 'still_here', x => {
  const s = voidS(x, mix(4, 30, sm(seg(x.L, 0.2, 1.3))), 0, '#ffffff', 0.4); const L = x.L; s.fog = null; x.S.voidSpot.color.set('#e8f0ff'); lyingKid(x, s);
  cam(x, [0.2, 3.8, 1.4], [0, 0.1, 0], 40); x.post.flash.value = 0.1 * sm(seg(L, 0.4, 1.3)); x.bloom.strength = 0.6;
});
// "Eu vou te montar de novo" — a figure kneels beside him
at(572.04, 'put_together', x => {
  const s = voidS(x, 22, 30, '#a040ff', 0.5); const L = x.L; s.fog = null; const c = lyingKid(x, s); const w = put(x, 'william', s, 0.75, 0, -0.4, -1.2); kneel(w, 1); w.head.rotation.x = 0.5;
  aim(w, 'R', tp(c, 'torso', [0, 6, 3]), eo(seg(L, 0.3, 1.1))); camMove(x, [-1.4, 1.4, 1.6], [0.3, 0.6, -0.2], [-1.1, 1.3, 1.2], [0.3, 0.6, -0.2], eo, 40);
});
// "A franquia inteira," — the whole iceberg
at(573.84, 'franchise', x => { const L = x.L; const a = mix(0.8, 0.4, eio(x.u)); const R = 60; cam(x, [Math.sin(a) * R, -10, -14 + Math.cos(a) * R], [0, -18, -14], 46); ice(x, { red: 0.3 }); });
// "Novos jogos principais," — the UCN office
at(575.20, 'games', x => { const s = ucn(x); cam(x, [mix(-0.6, 0.4, x.u), 1.8, 2.6], [0, 1.3, -1.6], 50); });
// "Dezenas de livros,"
at(576.64, 'books6', x => { const s = files(x, 0); const b = FILES.userData.book[0].parent.position; cam(x, [b.x - 0.6 + 0.3 * x.u, 1.4, b.z + 0.7], [b.x - 0.4, 1.05, b.z], 40); });
// "Filmes começam com uma criança desmontada" — the band under a cinema spotlight
at(577.62, 'films', x => { const [s, f] = band(x, 0.6); const L = x.L; x.S.stageSpot.intensity = 30; camMove(x, [-2.2, 1.6, 4.8], [0, 2.0, -1.8], [2.0, 1.7, 4.4], [0, 2.0, -1.8], eio, 34); });
at(578.28, 'disassembled', x => {
  const s = voidS(x, 22, 20, '#ffffff', 0.6); const L = x.L; s.fog = null; const c = lyingKid(x, s); s.add(PCB); PCB.position.set(0.5, 0.02, 0.35); PCB.rotation.set(0, 0.8, 0); PCB.scale.setScalar(0.7);
  const a = mix(-0.4, 0.4, eio(x.u)); cam(x, [Math.sin(a) * 2.2, 2.1, Math.cos(a) * 2.2], [0, 0.15, 0], 40);
});
// "E alguém prometendo montá-la de novo"
at(580.50, 'promise', x => {
  const s = voidS(x, 22, 26, '#a040ff', 0.6); const L = x.L; s.fog = null; const c = lyingKid(x, s); const w = put(x, 'william', s, 0.75, 0, -0.4, -1.2); kneel(w, 1); w.head.rotation.x = 0.55;
  aim(w, 'R', tp(c, 'head', [0, 6, 2]), 1); aim(w, 'L', tp(c, 'torso', [0, 6, 3]), 0.8); camMove(x, [1.6, 1.0, 1.5], [0.2, 0.6, -0.1], [1.3, 1.0, 1.1], [0.2, 0.6, -0.1], eo, 40);
});
// "Talvez o iceberg de FNAF não seja sobre robôs assassinos" — from far below, looking up at the ice and the light
at(583.26, 'maybe', x => { const L = x.L; const y = mix(-50, -44, eio(x.u)); cam(x, [10, y, 24], [0, y + 30, -14], 50); ice(x, { red: 0.4 }); });
// "Talvez seja sobre pais e filhos"
at(587.06, 'parents', x => {
  const s = voidS(x, 20, 40, '#ffb070', 1); const L = x.L; s.fog = null; const w = put(x, 'william', s, -0.35, 0, 0, 0), c = put(x, 'cchild', s, 0.35, 0, 0, 0); w.idle(x.t, 1); c.idle(x.t, 1, 1);
  const hd = rootPt(c, -0.45, 0.65, 0.05); aim(w, 'L', hd, 0.9); aim(c, 'R', hd, 0.9); rimOn(x, s, [0, 3.5, -3.5], [0, 1.2, 0], 60, '#ffb070'); camMove(x, [0.3, 1.1, 4.2], [0, 1.1, 0], [0.15, 1.15, 3.4], [0, 1.15, 0], eo, 38);
});
// "Sobre culpa"
at(589.06, 'guilt', x => {
  const s = voidS(x, 20, 20, '#6a8aff', 0.5); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.4); w.head.rotation.x = 0.6; aim(w, 'R', rootPt(w, 0.05, 1.55, 0.35), 0.9);
  rain(x, s, 0, 0); const hp = tp(w, 'head', [0, 4, 4]); cam(x, [hp.x + 0.6, hp.y + 0.2, hp.z + 1.6], hp.toArray(), 36); x.post.tint.value.set(0.85, 0.9, 1.1);
});
// "Sobre um homem que nunca aceitou perder alguém"
at(590.08, 'never_accept', x => {
  const s = voidS(x, 18, 26, '#6a8aff', 0.5); const L = x.L; s.fog = null; const c = lyingKid(x, s); const w = put(x, 'william', s, 0.75, 0, -0.4, -1.2); kneel(w, 1); w.head.rotation.x = 0.65;
  aim(w, 'R', rootPt(w, 0.05, 1.5, 0.35), 0.9); const a = mix(1.2, 0.6, eio(x.u)); cam(x, [Math.sin(a) * 3.0, 1.6, Math.cos(a) * 3.0], [0.3, 0.6, -0.2], 38); x.post.tint.value.set(0.85, 0.9, 1.1);
});
// "E sobre o preço de um monte de crianças que pagaram por isso" — every little ghost
at(592.60, 'price', x => {
  const s = voidS(x, 20, 20, '#9ad8ff', 2); const L = x.L; s.fog = null; const G = ['gk0', 'gk1', 'gCharlotte', 'gk2', 'gCchild', 'gk3', 'gAndrew', 'gk4'];
  G.forEach((n, i) => { const g = put(x, n, s, (i - 3.5) * 0.75, 0.05 * Math.sin(x.t * 1.5 + i), -0.25 * Math.abs(i - 3.5), 0); g.idle(x.t, 1, i); g.ghostMat.opacity = 0.5 * sm(seg(L, i * 0.12, 0.6 + i * 0.12)); g.head.rotation.x = 0.25; });
  camMove(x, [0, 1.0, 6.6], [0, 0.9, 0], [0, 1.1, 5.4], [0, 0.95, 0], eo, 36);
});
// "E sabe o pior?"
at(595.98, 'worst', x => { const L = x.L; const y = -55; cam(x, [2, y, 8], [0, y - 12, -8], 50); seabed(x); x.post.vig.value = 1.1; });
// "Esse iceberg ainda não acabou" — it keeps going down
at(597.24, 'not_over', x => { const L = x.L; iceCam(x, mix(-56, -64, eio(x.u)), 0.2, 16, -6, 46, -4); ice(x, { red: 1, rush: 1.5 }); });
// "Toda vez que sai um jogo novo, ele fica mais fundo" — something opens its eyes far below
at(598.74, 'deeper', x => {
  const L = x.L; const y = mix(-64, -70, eio(x.u)); iceCam(x, y, 0.1, 14, -8, 46, -2); ice(x, { red: 1, rush: 1.2 }); const s = x.S.ice;
  const m = put(x, 'mimic', s, 0, y - 9, -1, 0); m.idle(x.t, 0.5); mimicEyes(x, sm(seg(L, 1.4, 2.0)) * 1.5); m.root.scale.setScalar(3);
});
// "Se você chegou até aqui, parabéns. Você desceu até o fundo do iceberg de FNAF" — all the way back up
at(601.98, 'congrats', x => {
  const L = x.L; const k = eio(seg(L, 0, 4.9)); const y = mix(-55, 9, k); const a = mix(0.1, 0.9, k); const R = iceRad(Math.min(y, 6)) + mix(14, 26, k); cam(x, [Math.sin(a) * R, y, -14 + Math.cos(a) * R * 0.9], [0, y - mix(2, -1, k), -14], 46);
  ice(x, { rush: 2.5 * (1 - k), red: 1 - k }); if (Math.abs(y) < 1.2) { x.post.flash.value = 0.3 * (1 - Math.abs(y) / 1.2); x.post.blur.value = 0.6 * (1 - Math.abs(y) / 1.2); }
});
// "Agora me fala nos comentários qual camada mais te perturbou" — every layer's title down the side of the ice
at(607.06, 'all_layers', x => {
  const L = x.L; const k = eio(seg(L, 0, 3.3)); const y = mix(4, -50, k); iceCam(x, y, 0.15, 14, -0.5, 46); ice(x, { red: seg(L, 2, 3.3) });
  x.S.iceTitles.forEach((tg, i) => { tg.visible = true; const ty = ICE_DEPTHS[i] + 0.3; const R = iceRad(ty) + 6.5; tg.position.set(Math.sin(0.15) * R, ty, -14 + Math.cos(0.15) * R * 0.85); tg.quaternion.copy(x.camera.quaternion); tg.scale.setScalar(0.85); });
});
// "E qual teoria você acha que é verdade: O Mimic,"
at(610.48, 'opt_mimic', x => {
  const s = voidS(x, 26, 36, '#ff8a3a', 1.5); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); m.idle(x.t, 0.8); lookAtCam(x, m, 0.8); mimicEyes(x, sm(seg(L, 2.3, 2.6)) * 1.2 + 0.1);
  camMove(x, [0.6, 1.6, 5.6], [0, 1.7, 0], [0.2, 1.75, 3.8], [0, 1.8, 0], eio, 36);
});
// "o purgatório do William,"
at(613.48, 'opt_ucn', x => { const s = ucn(x, 0.6); const w = ucnWill(x, s); w.head.rotation.y = 0.5 * Math.sin(x.t * 2); camMove(x, [0.3, 1.75, 1.4], [0, 1.4, -2], [0.1, 1.65, 0.7], [0, 1.45, -2], eo, 46); });
// "Ou o verdadeiro motivo dele"
at(614.66, 'opt_motive', x => {
  const s = voidS(x, 40, 10, '#ffd0a0', 3); const L = x.L; s.fog = null; const w = put(x, 'william', s, -0.3, 0, 0, 0.2), c = put(x, 'cchild', s, 0.35, 0, 0.25, -0.15); w.idle(x.t, 0.8); c.idle(x.t, 1);
  aim(w, 'L', tp(c, 'head', [0, 9, 0]), 0.9); w.head.rotation.x = 0.35; w.head.rotation.y = -0.3; lookAtCam(x, c, 0.5); camMove(x, [0.5, 1.3, 3.0], [0, 1.15, 0], [0.3, 1.3, 2.5], [0, 1.2, 0], eo, 38); x.post.tint.value.set(1.08, 1.0, 0.88);
});
// ending (animation only, no icons): everyone together, waving goodbye
at(616.18, 'outro', x => {
  const s = voidS(x, 60, 18, '#ffb070', 5); const L = x.L; s.fog = null;
  const back_ = ['spring', 'golden', 'freddy', 'bonnie', 'chica', 'foxy', 'baby', 'mimic'], front = ['william', 'michael', 'cchild', 'elizabeth', 'henry', 'charlotte', 'guard'];
  back_.forEach((n, i) => { const c = put(x, n, s, (i - 3.5) * 1.3, 0, -1.4 - 0.25 * Math.abs(i - 3.5), -(i - 3.5) * 0.06); c.idle(x.t, 1, i); lookAtCam(x, c, 0.5); if (n === 'baby') c.setEyes('#5aff6a'); });
  front.forEach((n, i) => { const c = put(x, n, s, (i - 3) * 0.95, 0, 0.4, -(i - 3) * 0.06); c.idle(x.t, 1, i); lookAtCam(x, c, 0.7); aim(c, i % 2 ? 'L' : 'R', rootPt(c, i % 2 ? 0.55 : -0.55, 1.95 + 0.12 * Math.sin(x.t * 9 + i), 0.3), eo(seg(L, 0.3 + i * 0.1, 0.8 + i * 0.1))); });
  camMove(x, [0, 1.8, 11.5], [0, 1.4, -0.5], [0, 1.9, 9.8], [0, 1.45, -0.5], eo, 34); mimicEyes(x, 1);
});
// "Obrigado por me acompanharem nessa jornada profunda" — the iceberg under the moon
at(620.28, 'thanks', x => { const L = x.L; const a = mix(0.2, 0.9, eio(x.u)); const R = 30; cam(x, [Math.sin(a) * R, mix(6, 10, eio(x.u)), -14 + Math.cos(a) * R], [0, 3, -14], 42); ice(x); });
// "E até a próxima noite" — back where it started: the pizzeria in the rain
at(623.24, 'next_night', x => { const s = facade(x, 0.6); const L = x.L; camMove(x, [0.5, 1.6, 6.5], [0, 1.8, 0], [0.8, 1.9, 9.5], [0, 2.0, 0], eio, 36); rain(x, s, 0, 5); bolt(x, s, 0.8, 0.25); });
// "Se você sobreviver" — Freddy's eyes in the dark doorway... and black
at(625.42, 'survive', x => {
  const s = office1(x, 0); const L = x.L; const f = put(x, 'freddy', s, -3.3, 0, 0.05, Math.PI / 2); f.idle(x.t, 0.3); lookAtCam(x, f, 0.9); f.setEyeGlow('#ffffff', L > 0.3 && L < 1.4 ? 1 : 0);
  x.S.west.forEach(l => l.intensity = 0); x.S.westDoorLight.intensity = L > 0.3 && L < 1.4 ? 1.5 : 0; cam(x, [0.2, 1.6, 0.6], [-3.3, 2.0, 0], mix(40, 30, eio(x.u))); x.post.fade.value = sm(seg(L, 1.4, 1.8));
});
const _cleanup3 = cleanup;
cleanup = function (x) { _cleanup3(x); PCB.scale.setScalar(1); VR.scale.setScalar(1); };

export const SHOTS = shots;
export const DURATION = 627.2667;
