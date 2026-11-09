// Shot list, timed to the narration (Por que ela não tem o bico?). Every shot is a pure function of time.
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
const shots = [];
const at = (t, name, fn) => shots.push({ t, name, fn });

// 0.00 "Você acha que os Toy animatronics"
at(0.00, 'toys_reveal', x => {
  const s = x.S.stage; x.out.scene = s; stageChars(x); const L = x.L;
  const on = L > 0.84 ? 1 : 0.0;
  x.S.stageSpot.intensity = on ? 40 : 3;
  camMove(x, [0, 1.2, 6.6], [0, 1.75, -1.7], [0, 1.35, 5.4], [0, 1.75, -1.7], eo, 50); hand(x);
  ['bonnie', 'freddy', 'chica'].forEach((n, i) => { const c = x.C[n]; c.idle(x.t, 1, i); droop(c, 1 - sm(seg(L, 0.9, 1.25))); });
  x.post.flash.value = on ? 0.35 * (1 - seg(L, 0.84, 1.0)) : 0;
  x.post.vig.value = on ? 0.55 : 0.9;
});
// 1.40 "de FNAF 2"
at(1.40, 'logo_neon', x => {
  const s = x.S.screenroom; x.out.scene = s; const L = x.L;
  camMove(x, [-4.2, 2.55, 3.2], [-4.2, 2.85, -2.95], [-4.0, 2.65, 2.3], [-4.2, 2.85, -2.95], eo, 58); hand(x, 0.5);
  const fl = L < 0.3 ? (Math.sin(L * 90) > 0 ? 1 : 0.15) : 1;
  x.S.neonMat.color.setScalar(fl * 1.35); x.S.neonLight.intensity = 7 * fl; x.S.crtLight.intensity = 0.4; x.S.arcLight.intensity = 0.4; x.S.screenLamp.intensity = 0.6;
  x.bloom.strength = 0.8;
});
// 2.26 "são apenas robôs"
at(2.26, 'bonnie_glitch', x => {
  const s = x.S.stage; x.out.scene = s; stageChars(x); const L = x.L; const c = x.C.bonnie;
  camMove(x, [-0.95, 2.45, 0.25], [-1.3, 2.38, -1.7], [-1.05, 2.42, -0.05], [-1.3, 2.38, -1.7], eo, 40); hand(x, 0.6);
  c.idle(x.t, 1); lookAtCam(x, c, 0.6);
  const j = Math.floor(L * 7); const jr = rng(j * 7 + 3); const glitch = (L * 7) % 1 < 0.35;
  if (glitch) { c.head.rotation.z += (jr() - 0.5) * 0.7; c.head.rotation.y += (jr() - 0.5) * 0.6; c.earL.rotation.z += (jr() - 0.5) * 0.8; x.post.stat.value = 0.12; x.post.chroma.value = 0.6; }
  x.C.freddy.idle(x.t, 1, 1); x.C.chica.idle(x.t, 1, 2);
});
// 3.48 "com defeito"
at(3.48, 'defeito_sparks', x => {
  const s = x.S.stage; x.out.scene = s; stageChars(x); const L = x.L; const c = x.C.freddy;
  camMove(x, [0.6, 2.05, 1.2], [0, 1.85, -1.9], [0.45, 2.0, 0.85], [0, 1.85, -1.9], eo, 42); hand(x);
  c.idle(x.t, 1); const tw = Math.sin(L * 60) * (L < 0.4 ? 1 : 0.2);
  c.armL.piv.rotation.z += 0.9 + 0.25 * tw; c.armL.piv.rotation.x -= 0.4; c.head.rotation.z += 0.12 * tw; c.head.rotation.x += 0.1;
  c.root.updateMatrixWorld(true); const sh = c.armL.piv.getWorldPosition(new V3()); sparksAt(x, s, sh, L - 0.05);
  if (L > 0.05 && L < 0.18) x.post.flash.value = 0.25; x.post.stat.value = L < 0.2 ? 0.2 : 0;
  x.C.bonnie.idle(x.t, 1); x.C.chica.idle(x.t, 1, 2);
});
// 4.12 "ou eles também têm almas?"
at(4.12, 'chica_soul', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L; const c = put(x, 'chica', s, 0, 0, 0);
  camMove(x, [0.25, 1.72, 2.4], [0, 1.6, 0], [0.12, 1.7, 1.75], [0, 1.64, 0], eo, 40); hand(x, 0.6);
  c.idle(x.t, 0.8); lookAtCam(x, c, 0.5);
  const k = sm(seg(L, 0.95, 1.4)); // "almas"
  if (k > 0) { const g = put(x, 'ghost0', s, 0, 0, -0.35, 0, 0.95); g.idle(x.t, 1, 3); g.ghostMat.opacity = 0.55 * k; g.root.position.y = 0.05 * Math.sin(x.t * 2); orbAt(x, 0, s, chest(c), 0.9 * k); }
  x.S.voidFill.color.set('#9fd0ff'); x.S.voidFill.intensity = 2.5 + 2 * k; x.bloom.strength = 0.35 + 0.5 * k; x.post.tint.value.set(1 - 0.08 * k, 1, 1 + 0.1 * k);
});
// 5.84 "A maioria dos jogadores"
at(5.84, 'guard_players', x => {
  const s = x.S.office; x.out.scene = s; const L = x.L;
  camMove(x, [1.15, 2.2, -2.95], [0, 1.4, 0.15], [0.85, 2.05, -2.35], [0, 1.45, 0.15], eo, 40); hand(x);
  const g = put(x, 'guard', s, 0, -0.02, 0.15, Math.PI); g.legR.piv.rotation.x = -1.5; g.legL.piv.rotation.x = -1.5;
  g.idle(x.t, 1); g.armR.piv.rotation.x = -1.15; g.armL.piv.rotation.x = -1.1; g.armR.piv.rotation.z = 0.15; g.armL.piv.rotation.z = -0.15;
  g.head.rotation.y += 0.45 * Math.sin(L * 3.5); x.S.officeLamp.intensity = 7 * flicker(x.t, 9);
});
// 7.46 "acreditam cegamente"
at(7.46, 'guard_believe', x => {
  const s = x.S.office; x.out.scene = s; const L = x.L;
  camMove(x, [0.35, 1.85, -1.75], [0, 1.7, 0.15], [0.22, 1.8, -1.35], [0, 1.72, 0.15], eo, 40); hand(x, 0.6);
  const g = put(x, 'guard', s, 0, -0.02, 0.15, Math.PI); g.legR.piv.rotation.x = -1.5; g.legL.piv.rotation.x = -1.5;
  g.idle(x.t, 1); g.armR.piv.rotation.x = -1.15; g.armL.piv.rotation.x = -1.1;
  g.head.rotation.x += 0.18 * Math.max(0, Math.sin(L * 9)); // nodding, believing
  pop(x, x.FX.ex1, s, headTop(g, 0.7), 0.12, 0.45);
});
// 8.38 "na desculpa do Phone Guy"
at(8.38, 'red_phone', x => {
  const s = x.S.office; x.out.scene = s; const L = x.L;
  camMove(x, [1.75, 1.6, 0.15], [0.85, 1.1, -0.78], [1.5, 1.48, -0.1], [0.85, 1.1, -0.78], eo, 40); hand(x, 0.5);
  const ring = (L * 2.2) % 1 < 0.6; const v = ring ? Math.sin(x.t * 70) : 0;
  x.S.phone.rotation.z = 0.04 * v; x.S.phoneHandset.position.y = 0.16 + (ring ? 0.012 * Math.abs(Math.sin(x.t * 55)) : 0); x.S.phoneHandset.rotation.z = 0.05 * v;
  x.S.phoneLight.intensity = ring ? 0.8 + 0.6 * Math.abs(v) : 0.2;
  const g = put(x, 'guard', s, 0, -0.02, 0.15, Math.PI); g.legR.piv.rotation.x = -1.5; g.legL.piv.rotation.x = -1.5; g.armR.piv.rotation.x = -1.15; g.armL.piv.rotation.x = -1.1;
});
// 9.52 "Ele diz que os Toy têm um sistema"
at(9.52, 'toy_eye_scan', x => {
  const s = x.S.stage; x.out.scene = s; stageChars(x); const L = x.L; const c = x.C.freddy;
  camMove(x, [0.35, 2.48, 0.35], [0, 2.4, -1.9], [0.2, 2.45, -0.05], [0, 2.4, -1.9], eo, 40); hand(x, 0.5);
  c.idle(x.t, 0.6); lookAtCam(x, c, 0.85);
  const lz = s; const ls = x.FX.laser; s.add(ls); ls.position.set(0, 2.4 + 0.22 * Math.sin(L * 4.2), -1.25); ls.rotation.z = 0.06 * Math.sin(L * 3);
  ls.userData.mat.opacity = 0.55 + 0.3 * Math.sin(x.t * 40);
  x.S.stageSpot.intensity = 26; x.post.tint.value.set(1.08, 0.94, 0.94); x.bloom.strength = 0.6;
  x.C.bonnie.idle(x.t, 1); x.C.chica.idle(x.t, 1, 2);
});
// 11.34 "de reconhecimento facial"
at(11.34, 'crt_scan', x => {
  const s = x.S.screenroom; x.out.scene = s; x.out.screen = 'scan';
  screenCam(x, x.S.crtScreenPos, 1.55, 1.05, 0.18); hand(x, 0.4); x.S.crtLight.color.set('#5dffa6'); x.S.screenLamp.intensity = 1.5;
});
// 12.60 "ligado a um banco de dados"
at(12.60, 'crt_db', x => {
  const s = x.S.screenroom; x.out.scene = s; x.out.screen = 'db'; const k = eio(x.u); const c = x.S.crtScreenPos;
  cam(x, [c.x + mix(-0.45, 0.35, k), c.y + 0.1, c.z + 1.25], [c.x, c.y, c.z], 55); hand(x, 0.4); x.S.crtLight.color.set('#6fa8ff'); x.S.screenLamp.intensity = 1.5;
});
// 14.26 "da polícia"
at(14.26, 'police', x => {
  const s = x.S.screenroom; x.out.scene = s; x.out.screen = 'db'; const L = x.L;
  camMove(x, [1.9, 2.0, 1.8], [0, 1.3, -1.6], [1.55, 1.85, 1.3], [0, 1.35, -1.6], eo, 44); hand(x);
  const ph = Math.floor(L * 9) % 2; x.S.policeR.intensity = ph ? 14 : 0.5; x.S.policeB.intensity = ph ? 0.5 : 14; x.S.screenLamp.intensity = 0.8;
  shake(x, 0.12); x.bloom.strength = 0.6;
  const g = put(x, 'guard', s, -1.2, 0, -0.6, 0.6); g.idle(x.t, 1); g.head.rotation.y += 0.4 * Math.sin(L * 8);
});
// 14.92 "Segundo ele, um erro de programação"
at(14.92, 'crt_error', x => {
  const s = x.S.screenroom; x.out.scene = s; x.out.screen = 'error'; const L = x.L;
  screenCam(x, x.S.crtScreenPos, 1.5, 0.98, -0.12); x.camera.rotateZ(0.08 * eo(x.u)); hand(x, 0.5);
  x.S.crtLight.color.set('#ff4a4a'); x.S.crtLight.intensity = 3.5; x.S.screenLamp.intensity = 1.2;
  const b = (L * 3) % 1; if (b < 0.12) x.post.stat.value = 0.35; x.post.chroma.value = 0.3;
});
// 16.72 "faz os robôs verem o guarda noturno"
at(16.72, 'robot_vision', x => {
  const s = x.S.hall; x.out.scene = s; const L = x.L;
  const g = put(x, 'guard', s, 0, 0, -6.2, 0); g.idle(x.t, 1); g.armR.piv.rotation.x = -1.3; g.head.rotation.y = 0.35 * Math.sin(L * 2.6);
  cam(x, [0.05, 1.95, -1.4], [0, 1.6, -6.2], mix(40, 24, eo(x.u))); hand(x, 0.7);
  g.root.updateMatrixWorld(true); const hp = g.head.localToWorld(new V3(0, 4 * x_U, 0)); const [px, py] = proj(x, hp);
  const bw = 0.36 * 40 / x.camera.fov, bh = 0.2 * 40 / x.camera.fov; x.out.ui = { type: 'vision', box: [px - bw / 2, py - bh / 2, bw, bh], locked: L > 1.5 };
  x.post.tint.value.set(1.3, 0.55, 0.55); x.post.cctv.value = 0.35; x.post.grain.value = 0.06; x.post.vig.value = 0.8;
  x.S.hallLamps.forEach((l, i) => l.intensity = 7 * flicker(x.t, i));
});
// 18.76 "como um criminoso"
at(18.76, 'crt_match', x => {
  const s = x.S.screenroom; x.out.scene = s; x.out.screen = 'match'; const L = x.L;
  screenCam(x, x.S.crtScreenPos, 1.25, 0.95, 0.1); hand(x, 0.4);
  x.S.crtLight.color.set('#ff3030'); x.S.crtLight.intensity = 4; x.S.screenLamp.intensity = 0.8;
  x.post.flash.value = L < 0.12 ? 0.3 : 0; if (L > 0.1 && L < 0.3) shake(x, 0.3);
});
// 19.88 "e por isso eles atacam"
at(19.88, 'attack', x => {
  const s = x.S.office; x.out.scene = s; const L = x.L;
  cam(x, [0, 1.62, -1.75], [0, 1.55, -5], 52);
  const c = put(x, 'freddy', s, 0.1, 0, -5.4, 0);
  const run = ei(seg(L, 0.0, 0.5)); c.root.position.z = mix(-5.4, -3.05, run); c.root.position.x = mix(0.1, 0, run);
  if (L < 0.5) c.walk(L * 3.6, 1.2);
  const lunge = eo(seg(L, 0.4, 0.58));
  aim(c, 'R', rootPt(c, -0.3, 1.9, 1.2), lunge); aim(c, 'L', rootPt(c, 0.3, 1.9, 1.2), lunge);
  c.torso.rotation.x = 0.25 * lunge; c.head.rotation.x = -0.25 * lunge + 0.06 * Math.sin(L * 40) * lunge; c.head.rotation.z = 0.08 * Math.sin(L * 33) * lunge;
  x.S.doorLight.intensity = 5; x.S.officeLamp.intensity = 7 * (L > 0.5 ? flicker(x.t * 2, 4) : 1);
  if (L > 0.5) shake(x, 1.3 * (1 - seg(L, 0.5, 1.2)));
  x.post.flash.value = L > 0.52 ? 0.65 * (1 - seg(L, 0.52, 0.66)) : 0;
  x.post.stat.value = L > 1.15 ? 0.6 * seg(L, 1.15, 1.38) : (L > 0.55 && L < 0.62 ? 0.4 : 0);
  x.post.chroma.value = lunge * 0.8;
});
// 21.26 "Mas a verdade é bem mais sombria"
at(21.26, 'dark_truth', x => {
  const s = x.S.hall; x.out.scene = s; const L = x.L;
  camMove(x, [0.4, 1.5, 0.5], [0, 1.6, -9], [0.2, 1.55, -0.6], [0, 1.65, -9], eo, 40); hand(x, 0.7);
  const c = put(x, 'bonnie', s, 0, 0, -7.2, 0); c.idle(x.t, 0.5);
  const offAt = [1.05, 0.8, 0.55, 0.3]; // lamps at z 2,-4,-10,-16 switch off far-to-near
  x.S.hallLamps.forEach((l, i) => { l.intensity = L > offAt[i] ? 0 : 9 * flicker(x.t, i); });
  const dark = sm(seg(L, 1.0, 1.3));
  if (dark > 0) { c.root.updateMatrixWorld(true); for (const [i, ex] of [[0, 0.11], [1, -0.11]]) { const p = c.head.localToWorld(new V3(ex * 16 * x_U, 4.6 * x_U, 4.2 * x_U)); orbAt(x, i, s, p, 0.22 * dark); } }
  x.post.vig.value = mix(0.55, 0.95, dark);
});
// 23.04 "eles têm almas sim"
at(23.04, 'souls_stage', x => {
  const s = x.S.stage; x.out.scene = s; stageChars(x); const L = x.L;
  camMove(x, [0, 1.6, 5.4], [0, 1.75, -1.7], [0, 1.65, 4.6], [0, 1.8, -1.7], eo, 46); hand(x);
  idleAll(x, ['bonnie', 'freddy', 'chica']);
  const k = sm(seg(L, 0.4, 0.75));
  [['bonnie', -1.3, -1.7], ['freddy', 0, -1.9], ['chica', 1.3, -1.7]].forEach(([n, gx, gz], i) => {
    if (k <= 0) return; const g = put(x, 'ghost' + i, s, gx, 0.65, gz + 0.35, 0, 0.78); g.idle(x.t, 1, i); g.ghostMat.opacity = 0.6 * k;
    orbAt(x, i, s, chest(x.C[n]), 0.8 * k); });
  x.S.stageSpot.intensity = mix(40, 18, k); x.bloom.strength = 0.35 + 0.55 * k; x.post.tint.value.set(1 - 0.1 * k, 1, 1 + 0.12 * k);
});
// 24.40 "E a prova definitiva que muita gente ignora"
at(24.40, 'arcade', x => {
  const s = x.S.screenroom; x.out.scene = s; x.out.screen = 'savethem';
  camMove(x, [2.9, 1.25, 1.9], [4.5, 1.45, -1.6], [3.85, 1.5, 0.35], [4.5, 1.55, -1.6], eo, 44); hand(x);
  x.S.arcLight.intensity = 4; x.S.crtLight.intensity = 0.5; x.S.screenLamp.intensity = 0.8; x.bloom.strength = 0.55;
});
// 26.42 "está escondida no minigame Save Them"
at(26.42, 'arcade_enter', x => {
  const s = x.S.screenroom; x.out.scene = s; x.out.screen = 'savethem'; const L = x.L; const c = x.S.arcScreenPos;
  const k = ei(seg(L, 0.2, x.d)); const d = mix(1.25, 0.08, k);
  cam(x, [c.x, c.y + 0.03 * d, c.z + d], [c.x, c.y - 0.02, c.z], 50); hand(x, 0.3 * (1 - k));
  x.S.arcLight.intensity = 4; x.S.screenLamp.intensity = 0.6; x.bloom.strength = 0.5 + 0.6 * k;
  x.post.pix.value = k > 0.6 ? PIX(x) * seg(k, 0.6, 1) : 0; x.post.flash.value = 0.6 * seg(L, x.d - 0.15, x.d);
});
// 28.64 "Nele, nós andamos pela nova pizzaria"
at(28.64, 'mini_walk', x => {
  const s = x.S.mini; x.out.scene = s; x.post.pix.value = PIX(x); const L = x.L;
  const c = put(x, 'oldFreddy', s, 1.4, 0, -7.6, 0); const k = x.u; walkTo(c, [1.4, 0, -7.6], [0.6, 0, -4.9], k, 1.0); c.root.rotation.y = -0.25;
  const p = c.root.position; cam(x, [p.x + 2.4, 5.2, p.z + 4.6], [p.x, 0.8, p.z + 0.4], 46);
  lie(x, 'kid4', s, 0.4, -3.2, -0.2);
  x.post.flash.value = 0.6 * (1 - seg(L, 0, 0.15)); x.post.vig.value = 0.7;
});
// 30.88 "e encontramos cinco novos corpos"
at(30.88, 'mini_find', x => {
  const s = x.S.mini; x.out.scene = s; x.post.pix.value = PIX(x); const L = x.L;
  const c = put(x, 'oldFreddy', s, 0.6, 0, -4.9, -0.25); c.idle(x.t, 1); c.head.rotation.x = 0.5 * sm(seg(L, 0.1, 0.5));
  lie(x, 'kid4', s, 0.4, -3.2, -0.2);
  camMove(x, [-1.6, 3.0, -1.0], [0.5, 0.5, -3.9], [-1.2, 2.6, -1.5], [0.5, 0.45, -3.9], eo, 46);
  x.post.vig.value = 0.8; if (L > 0.55 && L < 0.66) x.post.stat.value = 0.25;
});
// 32.80 "espalhados pelo chão"
at(32.80, 'mini_overview', x => {
  const s = x.S.mini; x.out.scene = s; x.post.pix.value = PIX(x); const a = mix(0.25, -0.15, x.u);
  for (let i = 0; i < 5; i++) { const [kx, kz] = x.S.miniKidSpots[i]; lie(x, 'kid' + i, s, kx, kz, x.S.miniKidRot[i]); }
  cam(x, [Math.sin(a) * 6, mix(22, 20, eo(x.u)), Math.cos(a) * 6 + 1.5], [0, 0, 0.2], 62);
  x.post.vig.value = 0.6;
});
// 34.18 "Eles são vítimas recentes do William"
at(34.18, 'mini_william', x => {
  const s = x.S.mini; x.out.scene = s; x.post.pix.value = PIX(x); const L = x.L;
  const c = put(x, 'purple', s, -7.8, 0, -3.2, Math.PI / 2); const k = seg(L, 0, 1.25); walkTo(c, [-7.8, 0, -3.2], [-5.4, 0, -3.2], eo(k), 1.0);
  lie(x, 'kid0', s, -6.2, -6, 0.4);
  const turn = sm(seg(L, 1.15, 1.45)); c.root.rotation.y = mix(Math.PI / 2, 0.3, turn);
  const p = c.root.position; const z = eio(seg(L, 1.15, 1.6));
  cam(x, [mix(p.x + 1.2, p.x + 0.35, z), mix(4.6, 2.1, z), mix(p.z + 4.2, p.z + 1.6, z)], [p.x, mix(0.9, 1.75, z), p.z], mix(46, 40, z));
  x.post.vig.value = 0.75; if (L > 1.6) x.post.chroma.value = 0.3;
});
// 36.00 "e quem está ativa passeando pelo cenário"
at(36.00, 'mini_puppet', x => {
  const s = x.S.mini; x.out.scene = s; x.post.pix.value = PIX(x); const L = x.L;
  const c = put(x, 'puppet', s, 4.0, 0.12 + 0.05 * Math.sin(x.t * 2.5), -5.6, -Math.PI / 2 + 0.3);
  c.root.position.x = mix(7.6, 4.2, eio(x.u)); c.idle(x.t, 1.4); c.armR.piv.rotation.z -= 0.15; c.armL.piv.rotation.z += 0.15; c.legR.piv.rotation.x = 0.1; c.legL.piv.rotation.x = -0.1;
  lie(x, 'kid1', s, 5.8, -6.2, -0.9);
  const p = c.root.position; cam(x, [p.x - 1.0, 4.0, p.z + 4.4], [p.x, 1.1, p.z], 44);
  x.post.vig.value = 0.75; if (L > x.d - 0.18) x.post.stat.value = 0.6;
});
// 38.28 "é justamente a Puppet"
at(38.28, 'puppet_box', x => {
  const s = x.S.prize; x.out.scene = s; const L = x.L;
  x.S.giftLid.rotation.x = -1.95 * back(seg(L, 0.05, 0.4));
  const rise = eo(seg(L, 0.3, 1.0)); const c = put(x, 'puppet', s, 1.8, mix(-1.9, 0.0, rise), -1.6, 0); c.idle(x.t, 1);
  c.armR.piv.rotation.z -= 0.25 * rise; c.armL.piv.rotation.z += 0.25 * rise; c.head.rotation.x = 0.25 * (1 - rise);
  const z = eio(seg(L, 0.75, 1.15));
  cam(x, [mix(2.8, 2.05, z), mix(1.2, 2.3, z), mix(1.4, -0.05, z)], [1.8, mix(2.0, 2.28, z), -1.6], mix(46, 40, z)); hand(x, 0.6);
  if (L > 0.05 && L < 0.2) shake(x, 0.25);
  x.S.giftSpot.intensity = 40; x.post.flash.value = L > 1.05 && L < 1.15 ? 0.2 : 0;
});
// 39.98 "Nós sabemos que ela deu vida"
at(39.98, 'puppet_life', x => {
  const s = x.S.prize; x.out.scene = s; const L = x.L; x.S.giftLid.rotation.x = -1.95;
  const c = put(x, 'puppet', s, 1.8, 0, -0.3, -0.15); c.idle(x.t, 1);
  camMove(x, [1.0, 1.85, 3.4], [1.7, 1.75, -0.3], [1.25, 1.95, 2.6], [1.7, 1.85, -0.3], eo, 42); hand(x);
  const up = eio(seg(L, 0.05, 0.6)); c.root.updateMatrixWorld(true);
  const pc = rootPt(c, 0, 1.75, 0.55); aim(c, 'R', pc.clone().add(new V3(-0.05, 0, 0)), up); aim(c, 'L', pc.clone().add(new V3(0.05, 0, 0)), up);
  c.head.rotation.x = 0.25 * up; const g = sm(seg(L, 0.5, 1.2)); if (g > 0) orbAt(x, 0, s, pc, 1.6 * g);
  sparkles(x, s, pc.toArray(), 0.4, 6, 0.8 * g);
  x.S.prizeFill.intensity = 3 + 4 * g; x.bloom.strength = 0.35 + 0.6 * g;
});
// 41.50 "aos animatrônicos originais do primeiro jogo"
at(41.50, 'originals', x => {
  const s = x.S.stage; x.out.scene = s; const L = x.L; const c = put(x, 'oldFreddy', s, 0, 0.65, -1.9, 0);
  camMove(x, [1.1, 2.05, 1.9], [0, 1.9, -1.9], [0.6, 2.0, 1.2], [0, 1.95, -1.9], eo, 42); hand(x);
  const hit = 0.85; const k = seg(L, 0, hit); const target = chest(c);
  c.idle(x.t, 0.6); droop(c, 1 - sm(seg(L, hit, hit + 0.4)));
  if (L < hit) orbAt(x, 0, s, bez(new V3(-3, 4, 1), new V3(-1.2, 3.2, 0), target, sm(k)), 1.0);
  else orbAt(x, 0, s, target, 0.9 * (1 - seg(L, hit, hit + 0.5)));
  x.post.flash.value = L > hit && L < hit + 0.12 ? 0.4 : 0; if (L > hit && L < hit + 0.25) shake(x, 0.3);
  x.S.stageSpot.intensity = 26; x.post.tint.value.set(0.95, 0.92, 0.88); x.bloom.strength = 0.6;
});
// 43.64 "e ela fez exatamente o mesmo"
at(43.64, 'puppet_send', x => {
  const s = x.S.prize; x.out.scene = s; const L = x.L; x.S.giftLid.rotation.x = -1.95;
  const c = put(x, 'puppet', s, 1.8, 0, -0.3, -0.15); c.idle(x.t, 1);
  camMove(x, [0.9, 1.6, 2.9], [1.7, 1.9, -0.3], [0.7, 1.55, 3.4], [1.7, 1.9, -0.3], eo, 46); hand(x);
  const push = eo(seg(L, 0.1, 0.45)); const pc = rootPt(c, 0, 1.8, 0.4 + 0.4 * push);
  aim(c, 'R', pc.clone().add(new V3(-0.15, 0, 0)), 1); aim(c, 'L', pc.clone().add(new V3(0.15, 0, 0)), 1);
  for (let i = 0; i < 3; i++) { const k = seg(L, 0.3 + i * 0.12, 1.3 + i * 0.12); if (k <= 0 || k >= 1) continue;
    const end = new V3(-1.6 + i * 1.6, 2.2 + 0.3 * (i % 2), 4.5); orbAt(x, i, s, bez(pc, new V3(1 + (i - 1) * 1.2, 2.6, 1.5), end, eo(k)), 1.0); }
  x.S.prizeFill.intensity = 6; x.bloom.strength = 0.8;
});
// 45.30 "com essa nova geração"
at(45.30, 'new_gen', x => {
  const s = x.S.stage; x.out.scene = s; stageChars(x); const L = x.L;
  camMove(x, [0, 1.75, 5.6], [0, 1.8, -1.7], [0, 1.8, 4.7], [0, 1.85, -1.7], eo, 46); hand(x);
  [['bonnie', 0.1], ['freddy', 0.35], ['chica', 0.6]].forEach(([n, a], i) => { const c = x.C[n]; c.idle(x.t, 1, i);
    const hit = a + 0.45; const target = chest(c);
    if (L < hit) { const k = seg(L, a, hit); if (k > 0) orbAt(x, i, s, bez(new V3(target.x * 0.5, 3.6, 4.2), new V3(target.x, 3.0, 1.0), target, sm(k)), 0.9); }
    else orbAt(x, i, s, target, 0.8 * (1 - seg(L, hit, hit + 0.4)));
    droop(c, 1 - sm(seg(L, hit, hit + 0.35))); });
  x.S.stageSpot.intensity = 34; x.bloom.strength = 0.65;
  for (const h of [0.55, 0.8, 1.05]) if (L > h && L < h + 0.08) x.post.flash.value = 0.18;
});
// 46.76 "Aquele comportamento assustador da Toy Chica"
at(46.76, 'chica_scary', x => {
  const s = x.S.hall; x.out.scene = s; const L = x.L;
  const c = put(x, 'chica', s, 0, 0, -6.4, 0); c.idle(x.t, 0.6);
  camMove(x, [0.35, 1.78, -4.2], [0, 1.68, -6.4], [0.15, 1.74, -4.65], [0, 1.68, -6.4], eio, 40); hand(x, 0.6);
  removeBeak(x, c, L - 0.35, 1.0, { throw: true });
  const after = seg(L, 1.25, 1.6); c.head.rotation.z += -0.14 * eo(after); c.head.rotation.x += 0.06 * eo(after);
  x.S.hallLamps.forEach((l, i) => { l.intensity = 8 * flicker(x.t, i); if (L > 0.75) l.color.set('#ff8070'); });
  if (L > 0.75 && L < 0.95) shake(x, 0.35);
});
// 49.26 "ou a Mangle subindo pelo teto"
at(49.26, 'mangle_ceiling', x => {
  const s = x.S.cove; x.out.scene = s; const L = x.L; const m = x.MANGLE; s.add(m.root);
  m.reset(); m.root.rotation.set(0, Math.PI / 2, Math.PI); m.root.position.set(mix(-1.5, 0.5, x.u), x.S.coveCeilY + 0.2, 0.2);
  m.crawl(L * 1.2, 1); m.idle(x.t, 0.6);
  camMove(x, [1.0, 0.75, 2.6], [-0.6, 2.55, 0.2], [0.8, 0.8, 2.2], [0.3, 2.5, 0.2], eo, 52); hand(x, 0.8);
  x.S.coveLamps.forEach((l, i) => l.intensity = 5 * flicker(x.t, i + 4));
});
// 50.94 "não são simples bugs do sistema"
at(50.94, 'mangle_close', x => {
  const s = x.S.cove; x.out.scene = s; const L = x.L; const m = x.MANGLE; s.add(m.root);
  m.reset(); m.root.rotation.set(0, Math.PI / 2, Math.PI); m.root.position.set(0.2, x.S.coveCeilY + 0.2, 0.2); m.idle(x.t, 1);
  const j = Math.floor(L * 6), jr = rng(j * 11 + 5), glitch = (L * 6) % 1 < 0.3;
  if (glitch) { m.neck.rotation.y += (jr() - 0.5) * 0.9; m.neck.rotation.x += (jr() - 0.5) * 0.5; x.post.stat.value = 0.14; x.post.chroma.value = 0.7; }
  m.root.updateMatrixWorld(true); const hp = m.headGroup.getWorldPosition(new V3());
  const z = eo(x.u); cam(x, [hp.x + mix(1.4, 0.95, z), hp.y - mix(1.35, 0.95, z), hp.z + mix(1.9, 1.4, z)], [hp.x, hp.y + 0.05, hp.z], 44); hand(x, 0.7);
  x.S.coveRed.intensity = 3 + 2 * Math.sin(x.t * 6); x.S.coveLamps.forEach((l, i) => l.intensity = 4 * flicker(x.t, i + 7));
});
// 53.08 "é o puro instinto de vingança"
at(53.08, 'revenge', x => {
  const s = x.S.hall; x.out.scene = s; const L = x.L;
  camMove(x, [0.1, 0.95, -1.2], [0, 1.6, -7], [0.05, 0.9, -0.6], [0, 1.55, -7], eo, 46); hand(x);
  [['bonnie', -0.95, -5.6], ['chica', 0.0, -5.0], ['freddy', 0.95, -5.7]].forEach(([n, px, pz], i) => {
    const c = put(x, n, s, px, 0, pz, 0); walkTo(c, [px, 0, pz], [px, 0, pz + 1.3], x.u, 1.1); c.root.rotation.y = 0; c.head.rotation.x -= 0.15; lookAtCam(x, c, 0.6); });
  noBeak(x);
  x.S.hallLamps.forEach((l, i) => { l.color.set('#ff3a30'); l.intensity = 9 * flicker(x.t, i + 1); });
  x.post.vig.value = 0.75; x.post.tint.value.set(1.15, 0.85, 0.85);
});
// 54.86 "dessas novas crianças"
at(54.86, 'ghost_kids', x => {
  const s = x.S.stage; x.out.scene = s; stageChars(x, false); const L = x.L;
  camMove(x, [0, 1.4, 5.2], [0, 1.5, -1.7], [0, 1.45, 4.4], [0, 1.55, -1.7], eo, 46); hand(x);
  idleAll(x, ['bonnie', 'freddy', 'chica']);
  const k = sm(seg(L, 0, 0.3)), merge = eio(seg(L, 0.55, 1.1));
  [[-1.3, -1.7], [0, -1.9], [1.3, -1.7]].forEach(([gx, gz], i) => { const g = put(x, 'ghost' + (i + 2), s, gx, 0.65, mix(gz + 1.3, gz + 0.2, merge), 0, 0.74); g.idle(x.t, 1, i); g.ghostMat.opacity = 0.7 * k * (1 - 0.6 * merge); });
  x.S.stageSpot.intensity = 20; x.bloom.strength = 0.8; x.post.tint.value.set(0.9, 1, 1.15);
});
// 56.02 "E aí, você já sabia dessa segunda tragédia"
at(56.02, 'puppet_question', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L; const c = put(x, 'puppet', s, 0, 0, 0);
  camMove(x, [0.35, 2.2, 2.6], [0, 2.15, 0], [0.12, 2.2, 1.85], [0, 2.2, 0], eo, 40); hand(x, 0.6);
  c.idle(x.t, 1); lookAtCam(x, c, 0.85); c.head.rotation.z += 0.18 * sm(seg(L, 0.6, 1.2));
  x.S.voidSpot.color.set('#efe0ff'); x.S.voidSpot.intensity = 18; x.S.voidFill.color.set('#a070ff'); x.S.voidFill.intensity = 2.5; sparkles(x, s, [0, 2.2, 0.1], 0.6, 5, 0.6);
});
// 58.74 "ou achava que era só um vírus no sistema?"
at(58.74, 'crt_virus', x => {
  const s = x.S.screenroom; x.out.scene = s; x.out.screen = 'virus'; const L = x.L;
  screenCam(x, x.S.crtScreenPos, 1.6, 1.0, -0.15); hand(x, 0.5);
  x.S.crtLight.color.set('#c050ff'); x.S.crtLight.intensity = 4; x.S.screenLamp.intensity = 0.6;
  if ((L * 2.5) % 1 < 0.1) x.post.stat.value = 0.3; x.post.chroma.value = 0.35;
});
// 60.52 "Comenta aí e me segue para mais segredos."
at(60.52, 'finale', x => {
  const s = x.S.stage; x.out.scene = s; stageChars(x, false); const L = x.L;
  camMove(x, [0.4, 2.0, 2.6], [0, 1.9, -1.2], [0, 2.2, 6.2], [0, 1.65, -1.2], eio, 46); hand(x);
  const p = put(x, 'puppet', s, 0, 0, 0.6, 0); p.idle(x.t, 1); lookAtCam(x, p, 0.7); p.armL.piv.rotation.z += (2.4 + 0.3 * Math.sin(L * 10)) * sm(seg(L, 0.1, 0.35));
  ['bonnie', 'freddy', 'chica'].forEach((n, i) => { const c = x.C[n]; c.idle(x.t, 1, i); const w = sm(seg(L, 0.15 + i * 0.12, 0.45 + i * 0.12)); lookAtCam(x, c, 0.8);
    c.armL.piv.rotation.z += (2.6 + 0.3 * Math.sin(L * 11 + i)) * w; });
  sparkles(x, s, [0, 2.6, -1.0], 1.6, 8, 1.4);
  x.post.fade.value = sm(seg(L, x.d - 0.3, x.d));
});

export const SHOTS = shots;
export const DURATION = 62.496;
