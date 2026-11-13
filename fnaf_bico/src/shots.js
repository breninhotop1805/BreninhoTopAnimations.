// Shot list, timed to the narration (Por que ela não tem o bico?). Every shot is a pure function of time.
import * as THREE from 'three';

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
  const s = x.S.stage; put(x, 'bonnie', s, -2.1, 0.65, -1.7, 0.1); put(x, 'freddy', s, 0, 0.65, -1.9); put(x, 'chica', s, 2.1, 0.65, -1.7, -0.1);
  if (!chicaBeak) noBeak(x);
}
function walkTo(c, p0, p1, k, stride = 1.15) { const d = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]); c.root.position.set(mix(p0[0], p1[0], k), mix(p0[1], p1[1], k), mix(p0[2], p1[2], k)); c.walk(d * k / stride, 1); }
function flicker(t, seed = 0) { const a = Math.sin(t * 37 + seed) + Math.sin(t * 23.3 + seed * 2) + Math.sin(t * 71.1); return a > 2.0 ? 0.15 : a > 1.6 ? 0.55 : 1; }
function bedroomBase(x) { const S = x.S; if (!S.bedSpot) { S.bedSpot = new THREE.SpotLight('#ffe8c8', 0, 12, 0.7, 0.4, 1.2); S.bedSpot.castShadow = true; S.bedSpot.shadow.mapSize.set(1024, 1024); S.bedSpot.shadow.bias = -0.001; S.bedroom.add(S.bedSpot, S.bedSpot.target); }
  S.bedSpot.intensity = 0; x.out.scene = S.bedroom; }
function plushHold(x, girl, plush, lp, rot = [0, 0, 0]) { // plush held in both hands at girl-local point lp
  const p = rootPt(girl, ...lp); x.out.scene.add(plush.root); plush.root.position.copy(p).add(new V3(0, -0.2, 0));
  plush.root.rotation.set(rot[0], girl.root.rotation.y + rot[1], rot[2]); plush.root.scale.setScalar(0.2); plush.root.visible = true;
  plush.legR.piv.rotation.x = -1.2; plush.legL.piv.rotation.x = -1.2; plush.armR.piv.rotation.z = -0.4; plush.armL.piv.rotation.z = 0.4;
  aim(girl, 'R', p.clone().add(new V3(0.08, 0, 0)), 1); aim(girl, 'L', p.clone().add(new V3(-0.08, 0, 0)), 1);
}

// --------------------------------------------------------------------------------------
const shots = [];
const at = (t, name, fn) => shots.push({ t, name, fn });

// 0.00 "Você já reparou que em fnaf dois,"
at(0.00, 'hall_walk', x => {
  const s = x.S.hall; x.out.scene = s;
  camMove(x, [0.7, 1.15, -3.2], [0, 1.45, -10], [0.35, 1.35, -4.4], [0, 1.6, -9], eo); hand(x);
  const c = put(x, 'chica', s, 0, 0, -10.5); walkTo(c, [0, 0, -10.6], [0, 0, -8.4], x.u); c.idle(x.t, 0.5); lookAtCam(x, c, 0.35);
  x.S.hallLamps.forEach((l, i) => l.intensity = 9 * flicker(x.t, i));
});
// 1.52 "quando a chica sai do palco,"
at(1.52, 'stage_exit', x => {
  const s = x.S.stage; x.out.scene = s; stageChars(x);
  camMove(x, [-0.6, 1.45, 6.6], [1.5, 1.4, -1], [0.3, 1.25, 5.0], [1.9, 1.2, 0], eio); hand(x);
  const c = x.C.chica; const L = x.L;
  const k1 = seg(L, 0, 0.45), k2 = seg(L, 0.45, 0.85), k3 = seg(L, 0.85, 1.45);
  c.root.position.set(2.1 + 0.1 * k1, 0.65, -1.7 + 1.5 * k1); c.walk(L * 1.6, 1 - k2 * 0.6);
  if (k2 > 0) { const z = mix(-0.2, 0.6, k2); c.root.position.set(2.2, 0.65 * (1 - k2) + 0.35 * Math.sin(k2 * Math.PI), z); c.armR.piv.rotation.x -= 0.9 * Math.sin(k2 * Math.PI); c.armL.piv.rotation.x -= 0.9 * Math.sin(k2 * Math.PI); c.legR.piv.rotation.x = -0.4 * Math.sin(k2 * Math.PI); }
  if (k3 > 0) { c.root.position.set(2.2 - 0.3 * k3, 0, 0.6 + 0.9 * k3); c.walk(1.2 + k3 * 1.4, 1); c.root.rotation.y = -0.25 * k3; }
  if (k2 > 0.85 && k2 < 1) c.pelvis.position.y -= 0.05;
  ['bonnie', 'freddy'].forEach((n, i) => { const o = x.C[n]; o.idle(x.t, 1, i); o.head.rotation.y += 0.6 * sm(seg(L, 0.2, 0.7)) * (i ? 1 : 0.8); });
  c.idle(x.t, 0.4);
});
// 2.97 "ela perde o seu bico do nada?"
at(2.97, 'void_rip', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L;
  const punch = eo(seg(L, 0.42, 0.55)) * 0.12;
  cam(x, [0.08, 1.74, 2.05 - x.u * 0.2 - punch * 2.2], [0, 1.66, 0], 40); hand(x, 0.6);
  if (L > 0.42 && L < 0.7) shake(x, 0.5 * (1 - seg(L, 0.42, 0.7)));
  const c = put(x, 'chica', s, 0, 0, 0); c.idle(x.t, 0.6);
  removeBeak(x, c, L - 0.12, 0.85, { throw: true });
  const after = seg(L, 0.75, 1.1);
  c.head.rotation.z += -0.12 * eo(after); c.head.rotation.x += 0.05 * eo(after);
  S_red(x, sm(seg(L, 0.45, 0.8)) * 6);
  x.post.flash.value = 0.35 * (1 - seg(L, 0.48, 0.62)) * (L > 0.48 ? 1 : 0);
});
function S_red(x, v) { x.S.voidRim.intensity = v; }

// 4.69 "Quando a gente olha na câmera do palco principal,"
at(4.69, 'cam_stage', x => {
  const s = x.S.stage; x.out.scene = s; stageChars(x); idleAll(x, ['bonnie', 'freddy', 'chica']);
  cam(x, [4.8 - x.u * 0.5, 3.7, 4.6], [mix(0.4, 0.9, x.u), 1.4, -1.6], 50);
  x.out.ui = 'CAM 09'; x.post.cctv.value = 1; staticIn(x, 0.3, 0.05);
});
// 6.10 zoomed camera on Chica, friendly wave
at(6.10, 'cam_zoom', x => {
  const s = x.S.stage; x.out.scene = s; stageChars(x); idleAll(x, ['bonnie', 'freddy', 'chica']);
  cam(x, [4.3, 3.7, 4.6], [mix(1.4, 2.0, eo(x.u)), mix(1.7, 2.1, eo(x.u)), -1.7], mix(30, 17, eo(x.u * 1.3)));
  const c = x.C.chica; const w = sm(seg(x.L, 0.25, 0.55)); c.armL.piv.rotation.z += 2.5 * w; c.armL.piv.rotation.x += 0; c.armL.piv.rotation.z += 0.35 * Math.sin(x.L * 11) * w;
  lookAtCam(x, c, sm(seg(x.L, 0.1, 0.4))); c.head.rotation.z += 0.15 * w;
  x.out.ui = 'CAM 09'; x.post.cctv.value = 1; staticIn(x, 0.18, 0.05);
});
// 7.46 "ela está com seu visual perfeito e amigável."
at(7.46, 'chica_cute', x => {
  const s = x.S.stage; x.out.scene = s; stageChars(x); idleAll(x, ['bonnie', 'freddy']);
  camMove(x, [2.75, 2.35, 0.45], [2.1, 2.22, -1.7], [2.55, 2.38, 0.2], [2.1, 2.25, -1.7], eo, 40); hand(x, 0.6);
  const c = x.C.chica; c.idle(x.t, 1);
  c.head.rotation.z += 0.16 * Math.sin(x.L * 4.2); lookAtCam(x, c, 0.9);
  c.armR.piv.rotation.z -= 0.35; c.armL.piv.rotation.z += 0.35;
  sparkles(x, s, headTop(c, 0.22), 0.36, 6, 0.9);
});
// 8.75 medium friendly dance
at(8.75, 'chica_wave', x => {
  const s = x.S.stage; x.out.scene = s; stageChars(x); idleAll(x, ['bonnie', 'freddy']);
  camMove(x, [0.6, 1.7, 3.3], [1.4, 1.65, -1.6], [1.2, 1.75, 2.7], [1.7, 1.75, -1.6], eio); hand(x);
  const c = x.C.chica; const b = Math.sin(x.L * 9);
  c.pelvis.position.y += 0.03 * Math.abs(b); c.torso.rotation.z += 0.08 * b; c.root.rotation.y = -0.1 + 0.15 * Math.sin(x.L * 4.5);
  c.armR.piv.rotation.z -= 2.5 + 0.3 * b; c.armL.piv.rotation.z += 2.5 - 0.3 * b; lookAtCam(x, c, 0.8);
  x.C.bonnie.head.rotation.y += 0.5; x.C.freddy.head.rotation.y += 0.35;
});
// 9.98 "Mas logo que ela sai pra caçar o guarda noturno,"
at(9.98, 'hall_hunt', x => {
  const s = x.S.hall; x.out.scene = s; const c = put(x, 'chica', s, 0, 0, 0, Math.PI);
  const z = mix(-1.0, -2.6, x.u); walkTo(c, [0.3, 0, -1.0], [0.1, 0, -2.6], x.u, 1.0); c.root.rotation.y = Math.PI + 0.1;
  cam(x, [1.6, 0.8, z + 2.7], [0.1, 1.4, z - 0.4], 46); hand(x, 1.2);
  x.S.hallLamps.forEach((l, i) => l.intensity = 8 * flicker(x.t * 1.3, i + 3)); x.post.tint.value.set(0.85, 0.88, 1.05);
  c.head.rotation.y += 0.25 * Math.sin(x.L * 2.5);
});
// 11.25 guard in the office
at(11.25, 'office_guard', x => {
  const s = x.S.office; x.out.scene = s;
  camMove(x, [1.1, 2.15, -2.9], [0, 1.4, 0.2], [0.85, 2.05, -2.4], [0, 1.45, 0.2], eo, 40); hand(x);
  const g = put(x, 'guard', s, 0, -0.02, 0.15, Math.PI); g.legR.piv.rotation.x = -1.5; g.legL.piv.rotation.x = -1.5;
  g.idle(x.t, 1); g.armR.piv.rotation.x = -1.15; g.armL.piv.rotation.x = -1.1; g.armR.piv.rotation.z = 0.15; g.armL.piv.rotation.z = -0.15;
  g.head.rotation.y += 0.5 * Math.sin(x.L * 4.2) * sm(seg(x.L, 0.2, 0.5)); g.head.rotation.x -= 0.1;
  x.S.officeLamp.intensity = 7 * flicker(x.t, 9);
});
// 12.45 "os olhos e o bico desaparecem."
at(12.45, 'cam_party', x => {
  const s = x.S.party; x.out.scene = s; const c = put(x, 'chica', s, 0, 0, -0.4, 0.9); noBeak(x);
  cam(x, [5.2, 4.3, 5.2], [0.2, 1.1, -0.5], 46);
  c.idle(x.t, 0.4); const snap = eo(seg(x.L, 0.45, 0.55)); c.head.rotation.y -= 0.4 * (1 - snap); lookAtCam(x, c, snap);
  x.out.ui = 'CAM 04'; x.post.cctv.value = 1; staticIn(x, 0.25, 0.06); if (x.L > 0.45 && x.L < 0.6) x.post.stat.value = 0.6;
});
// 13.40 close no-beak face
at(13.40, 'void_face', x => {
  const s = x.S.void; x.out.scene = s; const c = put(x, 'chica', s, 0, 0, 0); noBeak(x);
  cam(x, [0, 1.74, mix(2.4, 1.8, eo(x.u))], [0, 1.68, 0], 40); hand(x, 0.8);
  c.idle(x.t, 0.8); c.head.rotation.z = -0.1 + 0.05 * Math.sin(x.L * 3);
  x.S.voidRim.intensity = 7 * flicker(x.t, 2); x.S.voidSpot.intensity = 40; x.post.chroma.value = 0.3;
});
// 14.29 "Pra onde vai esse bico"
at(14.29, 'beak_floor', x => {
  const s = x.S.hall; x.out.scene = s; const a = 0.6 + x.u * 0.7;
  cam(x, [0.3 + Math.sin(a) * 1.35, 0.5, -3.0 + Math.cos(a) * 1.35], [0.3, 0.18, -3.0], 42); hand(x, 0.5);
  beakFree(x, [0.3, 0.07, -3.0], [-Math.PI / 2, 0, 0.5]);
  pop(x, x.FX.q1, s, [0.3, 0.36, -3.0], 0.25, 0.38);
  x.S.hallLamps.forEach(l => l.intensity = 8);
});
// 15.51 "e por que ela tira?"
at(15.51, 'party_shrug', x => {
  const s = x.S.party; x.out.scene = s; const c = put(x, 'chica', s, 0, 0, -0.4, 0); noBeak(x);
  camMove(x, [0.6, 1.8, 3.4], [0, 1.45, -0.4], [0.4, 1.75, 2.9], [0, 1.5, -0.4], eo, 42); hand(x);
  c.idle(x.t, 1); const k = back(seg(x.L, 0.05, 0.4));
  c.armR.piv.rotation.z -= 0.7 * k; c.armR.piv.rotation.x -= 0.7 * k; c.armL.piv.rotation.z += 0.7 * k; c.armL.piv.rotation.x -= 0.7 * k;
  c.head.rotation.z += 0.22 * k; lookAtCam(x, c, 0.7);
  beakBlend(x, 1);
  pop(x, x.FX.q1, s, headTop(c, 0.8), 0.15, 0.75);
});
// 16.66 "Dentro do universo do jogo,"
at(16.66, 'party_wide', x => {
  const s = x.S.party; x.out.scene = s;
  camMove(x, [0.5, 6.0, 8.5], [0, 1.0, -1.0], [2.8, 3.0, 6.0], [0, 1.3, -1.0], eio, 44);
  const c = put(x, 'chica', s, 0, 0, -0.4, 0.2); noBeak(x); c.idle(x.t, 1);
  const f = put(x, 'freddy', s, -4.6, 0, -3.3, 0.5); f.idle(x.t, 1, 1); const b = put(x, 'bonnie', s, 4.6, 0, -3.3, -0.5); b.idle(x.t, 1, 2);
  lookAtCam(x, c, 0.5);
});
// 18.18 "a explicação mais aceita e assustadora"  (looks at the beak in her hand)
at(18.18, 'hall_hold', x => {
  const s = x.S.hall; x.out.scene = s; const c = put(x, 'chica', s, 0, 0, -7, 0); noBeak(x); c.beak.visible = true;
  camMove(x, [0.9, 1.25, -4.6], [0, 1.55, -7], [0.6, 1.35, -5.0], [0, 1.6, -7], eo, 42); hand(x);
  c.idle(x.t, 0.8); aim(c, 'R', rootPt(c, -0.05, 1.45, 0.62), 1); beakBlend(x, 1);
  c.head.rotation.x = 0.35; c.head.rotation.y = -0.2; c.head.rotation.z = 0.1 * Math.sin(x.L * 2);
  x.S.hallLamps.forEach((l, i) => l.intensity = 7 * flicker(x.t, i));
});
at(19.35, 'hall_ots', x => {
  const s = x.S.hall; x.out.scene = s; const c = put(x, 'chica', s, 0, 0, -7, 0); noBeak(x); c.beak.visible = true;
  camMove(x, [0.8, 2.4, -8.4], [-0.05, 1.4, -6.3], [0.7, 2.35, -8.2], [-0.05, 1.38, -6.35], eo, 45); hand(x, 0.7);
  c.idle(x.t, 0.8); aim(c, 'R', rootPt(c, -0.05, 1.45 + 0.04 * Math.sin(x.L * 3), 0.62), 1); c.armR.piv.rotateY(0.6 * Math.sin(x.L * 2.4));
  beakBlend(x, 1); c.head.rotation.x = 0.4; c.head.rotation.y = -0.15;
});
// 20.52 "é que ela remove a peça de propósito."
at(20.52, 'void_slowrip', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L;
  camMove(x, [0.75, 1.8, 2.2], [0, 1.66, 0], [0.35, 1.76, 1.75], [0, 1.68, 0], eio, 40); hand(x, 0.6);
  const c = put(x, 'chica', s, 0, 0, 0, 0.12); c.idle(x.t, 0.6);
  removeBeak(x, c, L - 0.2, 1.7, { hold: true });
  const turn = eio(seg(L, 1.75, 2.3)); c.head.rotation.y += -0.25 * (1 - turn); c.head.rotation.z += -0.14 * turn; c.head.rotation.x += 0.08 * turn;
  x.S.voidRim.intensity = 6 * sm(seg(L, 1.0, 1.6)); x.S.voidSpot.intensity = mix(42, 32, sm(seg(L, 1.0, 1.6)));
});
// 23.01 "Sem o bico de plástico," (thrown beak bounces on the floor, slow motion)
at(23.01, 'beak_bounce', x => {
  const s = x.S.hall; x.out.scene = s; const L = x.L;
  cam(x, [0.45, 0.42, -1.55], [-0.05, 0.25, -3.15], 56); hand(x, 0.5);
  const hits = [0.38, 0.72, 0.95]; let p, r;
  if (L < hits[0]) { const k = L / hits[0]; p = [mix(-1.3, -0.35, k), 1.3 * (1 - k * k) + 0.07, mix(-3.6, -3.1, k)]; r = [k * 5, k * 3, k * 2]; }
  else if (L < hits[1]) { const k = seg(L, hits[0], hits[1]); p = [mix(-0.35, 0.15, k), 0.07 + 0.35 * Math.sin(k * Math.PI), mix(-3.1, -3.0, k)]; r = [5 + k * 4, 3 + k * 2, 2]; }
  else if (L < hits[2]) { const k = seg(L, hits[1], hits[2]); p = [mix(0.15, 0.35, k), 0.07 + 0.1 * Math.sin(k * Math.PI), -3.0]; r = [9 + k * 2, 5 + k, 2]; }
  else { const k = eo(seg(L, hits[2], 1.25)); p = [0.35 + 0.05 * k, 0.07, -3.0]; r = [-Math.PI / 2 * 3 - 0 * k, 6 + 0.3 * k, 2]; r[0] = mix(11, 3 * Math.PI * 1.5 * 0 + 11 + 0.0, 0); r = [mix(11, 4.71 * 2.5, 0), 0, 0]; r = [-Math.PI / 2, 0, 0.5 + k * 0.6]; }
  beakFree(x, p, r);
  for (const h of hits) if (L > h && L < h + 0.12) shake(x, 0.25 * (1 - (L - h) / 0.12));
});
// 24.27 "ela revela os dentes afiados do endoesqueleto,"
at(24.27, 'teeth_ecu', x => {
  const s = x.S.void; x.out.scene = s; const c = put(x, 'chica', s, 0, 0, 0); noBeak(x);
  cam(x, [0, 1.66, mix(1.15, 0.88, eio(x.u))], [0, 1.66, 0], 36); hand(x, 0.5);
  c.idle(x.t, 0.3); c.head.rotation.x = -0.04;
  x.S.voidRim.intensity = 8 * flicker(x.t, 5); x.S.voidFill.color.set('#ff4050'); x.S.voidFill.intensity = 2.5; x.post.chroma.value = 0.4 + 0.4 * Math.max(0, Math.sin(x.t * 9));
});
at(25.60, 'face_snap', x => {
  const s = x.S.void; x.out.scene = s; const c = put(x, 'chica', s, 0, 0, 0); noBeak(x);
  cam(x, [1.35, 1.2, 1.35], [0, 1.66, 0], 40); hand(x);
  const snap = eo(seg(x.L, 0.35, 0.47)); c.idle(x.t, 0.5); c.head.rotation.y = -0.7 * (1 - snap); lookAtCam(x, c, snap);
  x.S.voidRim.intensity = 7; if (x.L > 0.35 && x.L < 0.5) x.post.stat.value = 0.35; x.post.chroma.value = snap * 0.4;
});
// 26.90 "o que facilita na hora de dar o jumpscare"
at(26.90, 'office_ots', x => {
  const s = x.S.office; x.out.scene = s; const L = x.L;
  camMove(x, [0.55, 1.78, 1.35], [0, 1.25, -5], [0.4, 1.72, 1.0], [0, 1.3, -5], eo, 44); hand(x);
  const g = put(x, 'guard', s, 0, -0.02, 0.15, Math.PI); g.legR.piv.rotation.x = -1.5; g.legL.piv.rotation.x = -1.5; g.idle(x.t, 1);
  g.armR.piv.rotation.x = -1.1; g.armL.piv.rotation.x = -1.1;
  const c = put(x, 'chica', s, 0.1, 0, -5.4, 0); noBeak(x); c.idle(x.t, 0.3);
  const on = L > 0.75 ? flicker(x.t * 1.6, 3) : 0; x.S.doorLight.intensity = 5 * on; x.S.officeLamp.intensity = 7 * flicker(x.t, 1);
  g.head.rotation.x = 0.05 * sm(seg(L, 0.9, 1.2));
});
// 28.40 "e atacar o jogador." -> jumpscare
at(28.40, 'jumpscare', x => {
  const s = x.S.office; x.out.scene = s; const L = x.L;
  cam(x, [0, 1.62, -1.75], [0, 1.55, -5], 52);
  const c = put(x, 'chica', s, 0.1, 0, -5.4, 0); noBeak(x);
  const run = ei(seg(L, 0.35, 0.82)); c.root.position.z = mix(-5.4, -2.45, run); c.root.position.x = mix(0.1, 0, run);
  if (L > 0.35 && L < 0.82) c.walk(L * 3.2, 1.2);
  const lunge = eo(seg(L, 0.72, 0.9));
  aim(c, 'R', rootPt(c, -0.3, 1.9, 1.2), lunge); aim(c, 'L', rootPt(c, 0.3, 1.9, 1.2), lunge);
  c.torso.rotation.x = 0.25 * lunge; c.head.rotation.x = -0.25 * lunge + 0.06 * Math.sin(L * 40) * lunge; c.head.rotation.z = 0.08 * Math.sin(L * 33) * lunge;
  x.S.doorLight.intensity = 5; x.S.officeLamp.intensity = 7 * (L > 0.8 ? flicker(x.t * 2, 4) : 1);
  if (L > 0.8) shake(x, 1.4 * (1 - seg(L, 0.8, 1.7)));
  x.post.flash.value = L > 0.82 ? 0.7 * (1 - seg(L, 0.82, 0.98)) : 0;
  x.post.stat.value = L > 1.25 ? 0.25 + 0.75 * seg(L, 1.6, 1.95) : (L > 0.85 && L < 0.95 ? 0.4 : 0);
  x.post.chroma.value = lunge * 0.8; x.post.fade.value = sm(seg(L, 1.85, 2.1));
});
// 30.50 "Mas o buraco é mais embaixo." -> dolly zoom on the guard
at(30.50, 'dolly_guard', x => {
  const s = x.S.office; x.out.scene = s; const k = eio(x.u);
  const fov = mix(62, 24, k); const dist = 0.62 / Math.tan(THREE.MathUtils.degToRad(fov / 2));
  cam(x, [0, 1.72, 0.15 - dist], [0, 1.72, 0.15], fov);
  const g = put(x, 'guard', s, 0, -0.02, 0.15, Math.PI); g.legR.piv.rotation.x = -1.5; g.legL.piv.rotation.x = -1.5;
  g.idle(x.t, 0.5); g.head.rotation.x = -0.12; g.torso.rotation.x = -0.08;
  aim(g, 'R', rootPt(g, -0.3, 1.72, 0.3), 0.9); aim(g, 'L', rootPt(g, 0.3, 1.72, 0.3), 0.9);
  x.post.fade.value = 1 - seg(x.L, 0, 0.18); x.post.vig.value = 0.9; x.S.officeLamp.intensity = 5;
});
// 32.08 "O próprio criador, Scott Cawthon,"
at(32.08, 'scott_wave', x => {
  const s = x.S.studio; x.out.scene = s; x.S.studioScreenMat.emissiveIntensity = 0.0;
  camMove(x, [0.4, 1.55, 2.5], [-0.5, 1.45, -0.8], [0.2, 1.6, 1.9], [-0.5, 1.5, -0.8], eo, 42); hand(x);
  const c = put(x, 'scott', s, -0.5, 0, -0.8, 0.15); c.idle(x.t, 1); lookAtCam(x, c, 0.85);
  const w = sm(seg(x.L, 0.1, 0.35)); c.armL.piv.rotation.z += 2.6 * w + 0.35 * Math.sin(x.L * 12) * w; c.head.rotation.z += 0.08 * w;
  x.S.screenGlow.intensity = 0;
});
// 33.32 "já provocou os fãs com isso."
at(33.32, 'scott_tease', x => {
  const s = x.S.studio; x.out.scene = s; x.S.studioScreenMat.emissiveIntensity = 0.0; x.S.screenGlow.intensity = 0;
  camMove(x, [0.15, 1.85, 1.15], [-0.5, 1.68, -0.8], [0.0, 1.82, 0.9], [-0.5, 1.7, -0.8], eo, 42); hand(x, 0.7);
  const c = put(x, 'scott', s, -0.5, 0, -0.8, 0.3); c.idle(x.t, 1); lookAtCam(x, c, 0.9);
  const k = back(seg(x.L, 0.05, 0.35)); aim(c, 'R', rootPt(c, -0.25, 2.05, 0.35), k); c.head.rotation.z += -0.15 * k;
  c.armR.piv.rotateY(0.3 * Math.sin(x.L * 10) * k);
  pop(x, x.FX.ex1, s, headTop(c, 0.6).map((v, i) => v + (i === 0 ? 0.3 : 0)), 0.3, 0.45);
});
// 34.78 "Ele apontou para um minigame de fnaf quatro"
at(34.78, 'scott_point', x => {
  const s = x.S.studio; x.out.scene = s; const L = x.L;
  const on = seg(L, 0.3, 0.45); x.S.studioScreenMat.emissiveIntensity = on > 0 ? (L < 0.5 ? 0.5 + 0.5 * Math.sin(L * 90) : 1.1) : 0; x.S.screenGlow.intensity = 4 * on;
  const k = eio(seg(L, 0.55, 1.7));
  cam(x, mixv([-0.1, 1.7, 2.3], [1.6, 2.4, 0.55], k), mixv([-0.3, 1.6, -0.8], [1.6, 2.4, -2.8], k), mix(42, 40, k)); hand(x, 0.6);
  const c = put(x, 'scott', s, -0.5, 0, -0.8, 0.2); c.idle(x.t, 1);
  const pt = sm(seg(L, 0.0, 0.25)); aim(c, 'L', new V3(1.6, 2.4, -2.8), pt); c.head.rotation.y += 0.8 * pt; c.head.rotation.x -= 0.15 * pt;
  if (L > 0.3 && L < 0.5) x.post.stat.value = 0.25;
});
// 36.62 "onde vemos uma garotinha brincando com a miniatura da toy chica,"
at(36.62, 'girl_play', x => {
  bedroomBase(x); const s = x.S.bedroom; x.S.bedLamp.intensity = 10;
  camMove(x, [1.5, 1.15, 3.2], [0.6, 0.95, 0.6], [1.2, 1.05, 2.6], [0.6, 1.0, 0.6], eo, 42); hand(x);
  const g = put(x, 'girl', s, 0.6, 0, 0.6, 0.2, 0.78); g.idle(x.t, 1);
  const sw = Math.sin(x.L * 5); g.torso.rotation.z += 0.06 * sw; g.root.rotation.y = 0.2 + 0.12 * sw;
  plushHold(x, g, x.C.plushChica, [0.0, 1.05 + 0.08 * Math.sin(x.L * 7), 0.42], [0, 0.25 * sw, 0.2 * sw]);
  g.head.rotation.x = 0.25; g.head.rotation.y = 0.1 * sw;
});
at(38.00, 'girl_lift', x => {
  bedroomBase(x); const s = x.S.bedroom; x.S.bedLamp.intensity = 10;
  camMove(x, [0.25, 0.55, 1.95], [0.6, 1.3, 0.6], [0.35, 0.6, 1.75], [0.6, 1.35, 0.6], eo, 44); hand(x);
  const g = put(x, 'girl', s, 0.6, 0, 0.6, 0, 0.78); g.idle(x.t, 1);
  const up = eio(seg(x.L, 0.0, 0.6)); const a = x.L * 3.2;
  plushHold(x, g, x.C.plushChica, [0.12 * Math.sin(a), mix(1.05, 1.62, up), mix(0.42, 0.3, up)], [0, Math.PI * 0 + 0.4 * Math.sin(a), 0.3 * Math.sin(a * 1.3)]);
  g.head.rotation.x = -0.35 * up;
});
// 39.31 "que também está sem o bico."
at(39.31, 'plush_ecu', x => {
  bedroomBase(x); const s = x.S.bedroom; const L = x.L;
  const g = put(x, 'girl', s, 0.6, 0, 0.6, 0, 0.78); g.idle(x.t, 0.4);
  plushHold(x, g, x.C.plushChica, [0, 1.05, 0.42], [0, 0, 0]);
  const p = x.C.plushChica.neck.getWorldPosition(new V3()).add(new V3(0, 0.05, 0));
  cam(x, [p.x + 0.05, p.y + 0.02, p.z + mix(0.7, 0.45, eio(x.u))], [p.x, p.y - 0.02, p.z], 38); hand(x, 0.4);
  x.S.bedLamp.intensity = 6 * (1 - 0.6 * sm(seg(L, 0.9, 1.3))) * (L > 1.0 ? flicker(x.t, 8) : 1);
  x.post.vig.value = mix(0.55, 1.1, sm(seg(L, 0.9, 1.4)));
});
// 41.00 "Isso explodiu a cabeça da comunidade na época,"
at(41.00, 'mind_blown', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L;
  cam(x, [0.15, 1.7, 2.3 - x.u * 0.3], [0, 1.55, 0], 42); hand(x);
  x.S.voidSpot.color.set('#ffe8ff'); x.S.voidFill.color.set('#ff5fd0'); x.S.voidFill.intensity = 4;
  const g = put(x, 'guard', s, 0, 0, 0, 0); g.idle(x.t, 1);
  const k = back(seg(L, 0.0, 0.3)); aim(g, 'R', rootPt(g, -0.32, 1.95, 0.05), k); aim(g, 'L', rootPt(g, 0.32, 1.95, 0.05), k);
  g.head.rotation.z = 0.15 * Math.sin(L * 14) * (1 - seg(L, 0.35, 1.2)); g.torso.rotation.x = -0.1 * k;
  const b = L - 0.35; if (b > 0) { const cf = x.FX.confetti; s.add(cf); cf.position.set(0, 2.05, 0);
    cf.children.forEach(m => { const d = m.userData.dir; m.position.set(d.x * b, d.y * b - 1.6 * b * b, d.z * b); m.rotation.set(b * m.userData.spin, b * 3, 0); m.visible = true; }); }
  x.post.flash.value = b > 0 ? 0.55 * (1 - seg(b, 0, 0.18)) : 0; if (b > 0 && b < 0.3) shake(x, 0.7 * (1 - b / 0.3));
  bonus(x, s, b);
});
function bonus(x, s, b) { if (b > 0) sparkles(x, s, [0, 2.1, 0], 0.55 + b * 0.4, 8, 1.3); }
at(42.60, 'react_row', x => {
  const s = x.S.party; x.out.scene = s; const L = x.L;
  const k = eio(x.u); cam(x, [mix(-2.2, 2.2, k), 1.7, 3.2], [mix(-1.4, 1.4, k), 1.55, -0.5], 44); hand(x);
  const b = put(x, 'bonnie', s, -1.6, 0, -0.5, 0.25), f = put(x, 'freddy', s, 0, 0, -0.6, 0), g = put(x, 'guard', s, 1.6, 0, -0.5, -0.25);
  noBeak(x);
  [b, f, g].forEach((c, i) => { c.idle(x.t, 1, i); const a = 0.12 + i * 0.32; const kk = eo(seg(L, a, a + 0.12)); lookAtCam(x, c, kk);
    c.pelvis.position.y += 0.06 * Math.sin(seg(L, a, a + 0.25) * Math.PI); c.armR.piv.rotation.z -= 0.5 * kk; c.armL.piv.rotation.z += 0.5 * kk; c.head.rotation.x -= 0.1 * kk;
    pop(x, [x.FX.ex1, x.FX.ex2, x.FX.ex3][i], s, headTop(c, c === b ? 0.95 : 0.75), a, 0.85); });
});
// 44.14 "servindo de base para a famosa teoria do sonho,"
at(44.14, 'girl_sleep', x => {
  bedroomBase(x); const s = x.S.bedroom; x.S.bedLamp.intensity = 5; x.S.bedHemi.intensity = 0.85;
  camMove(x, [-0.6, 2.2, 1.6], [-2.6, 0.75, -1.5], [-1.1, 1.85, 0.7], [-2.6, 0.75, -1.6], eo, 42); hand(x, 0.6);
  const g = put(x, 'girl', s, -2.6, 0.83, -1.95, 0, 0.78); g.root.rotation.x = -Math.PI / 2; g.root.position.z = -2.25 + 1.25; g.root.position.y = 0.8;
  g.torso.rotation.x += 0.012 * Math.sin(x.t * 2);
  x.FX.z.forEach((z, i) => { const ph = (x.L * 0.6 + i / 3) % 1; s.add(z); z.position.set(-2.4 + ph * 0.5, 1.15 + ph * 1.1, -2.1); z.scale.setScalar(0.4 + ph * 0.8); z.quaternion.copy(x.camera.quaternion); z.visible = ph < 0.92; });
  x.post.tint.value.set(0.95, 0.9, 1.15);
});
at(45.50, 'dream_dive', x => {
  bedroomBase(x); const s = x.S.bedroom; const k = ei(x.u); x.S.bedLamp.intensity = 4;
  const g = put(x, 'girl', s, -2.6, 0.8, -1.0, 0, 0.78); g.root.rotation.x = -Math.PI / 2;
  const hp = g.neck.getWorldPosition(new V3());
  x.camera.position.set(hp.x + 0.02, hp.y + mix(2.2, 0.35, k), hp.z + 0.25); x.camera.up.set(Math.sin(k * 2.5), 0, -Math.cos(k * 2.5)); x.camera.lookAt(hp.x, hp.y, hp.z + 0.1); x.camera.fov = 45;
  s.add(x.FX.dreamStars); x.FX.dreamStars.children.forEach(st => { st.quaternion.copy(x.camera.quaternion); });
  s.fog.color.set('#2a0f5a'); s.background.set('#2a0f5a'); s.fog.near = mix(8, 2, k); s.fog.far = mix(20, 9, k);
  x.post.tint.value.set(mix(1, 1.2, k), mix(1, 0.85, k), mix(1, 1.35, k)); x.bloom.strength = mix(0.45, 1.2, k);
  x.post.flash.value = sm(seg(x.L, x.d - 0.3, x.d)) * 0.9;
});
// 46.84 "sugerindo que os jogos anteriores eram apenas pesadelos daquela criança,"
function dreamWorld(x) {
  bedroomBase(x); const s = x.S.bedroom; x.S.bedWalls.visible = false; s.fog.color.set('#1e0a44'); s.background.set('#1e0a44'); s.fog.near = 3; s.fog.far = 14;
  x.S.bedLamp.intensity = 1.5; x.S.moon.intensity = 0.6; x.S.bedHemi.intensity = 0.9;
  s.add(x.FX.dreamStars); x.FX.dreamStars.children.forEach((st, i) => { st.quaternion.copy(x.camera.quaternion); st.rotateZ(x.t + i); st.position.y += 0; });
  x.S.bedSpot.position.set(-1.2, 2.5, 2.5); x.S.bedSpot.target.position.set(-2.6, 1.8, -2.5); x.S.bedSpot.color.set('#d890ff'); x.S.bedSpot.intensity = 30;
  x.post.tint.value.set(1.08, 0.92, 1.22); x.bloom.strength = 0.6; return s;
}
at(46.84, 'nightmare_rise', x => {
  const s = dreamWorld(x); const L = x.L;
  const g = put(x, 'girl', s, -2.6, 0.8, -1.0, 0, 0.78); g.root.rotation.x = -Math.PI / 2;
  camMove(x, [-2.6, 1.0, 2.3], [-2.6, 2.6, -3.0], [-2.45, 1.1, 1.8], [-2.6, 2.9, -3.0], eo, 62); hand(x, 0.7);
  const giants = [['freddy', -2.6, -4.6, 0], ['bonnie', -4.6, -3.6, 0.5], ['chica', -0.6, -3.6, -0.5]];
  giants.forEach(([n, gx, gz, ry], i) => { const k = eo(seg(L, 0.1 + i * 0.25, 0.9 + i * 0.25)); const c = put(x, n, s, gx, mix(-5.5, 0, k), gz, ry, 2.3); c.idle(x.t, 1, i); lookAtCam(x, c, 0.7); if (n === 'chica') noBeak(x); });
});
at(48.90, 'nightmare_wake', x => {
  bedroomBase(x); const s = x.S.bedroom; const L = x.L;
  s.fog.color.set('#12082a'); s.background.set('#12082a');
  const g = put(x, 'girl', s, -2.6, 0.62, -0.35, 0, 0.78); g.legR.piv.rotation.x = -Math.PI / 2; g.legL.piv.rotation.x = -Math.PI / 2;
  camMove(x, [-1.9, 1.85, 2.2], [-2.6, 1.6, -0.5], [-2.1, 1.82, 1.8], [-2.6, 1.65, -0.5], eo, 44); hand(x, 1.2);
  g.idle(x.t, 1); g.head.rotation.y = 0.6 * Math.sin(L * 3.2); g.head.rotation.x = -0.1; const k = back(seg(L, 0.05, 0.35));
  aim(g, 'R', rootPt(g, -0.32, 1.2, 0.35), k); aim(g, 'L', rootPt(g, 0.32, 1.2, 0.35), k);
  const fl = flicker(x.t * 1.4, 6); x.S.bedLamp.intensity = 9 * fl; x.S.bedLamp.color.set(fl < 1 ? '#ff4030' : '#ffcf8a');
  x.post.tint.value.set(1.1, 0.92, 1.05);
});
// 50.97 "baseados nos brinquedos que ela via."
at(50.97, 'shelf_pan', x => {
  bedroomBase(x); const s = x.S.bedroom; x.S.bedLamp.intensity = 10;
  x.S.bedSpot.position.set(1.4, 2.6, 0.5); x.S.bedSpot.target.position.set(1.4, 1.6, -2.8); x.S.bedSpot.color.set('#ffe0b8'); x.S.bedSpot.intensity = 6;
  const k = eio(x.u); cam(x, [mix(2.2, 0.6, k), 1.85, -1.05], [mix(1.75, 1.05, k), 1.68, -2.75], 40); hand(x, 0.5);
  [['plushFreddy', 0.75], ['plushBonnie', 1.4], ['plushChica2', 2.05]].forEach(([n, px], i) => {
    const c = put(x, n, s, px, x.S.shelfY + 0.22 * 0.0, -2.72, 0.12 * (i - 1), 0.22); c.legR.piv.rotation.x = -1.4; c.legL.piv.rotation.x = -1.4; c.root.position.y = x.S.shelfY - 0.03;
    c.armR.piv.rotation.z = -0.35; c.armL.piv.rotation.z = 0.35; c.head.rotation.z = 0.12 * (i - 1); });
});
// 52.72 "E você, acha que é tudo um sonho"
at(52.72, 'dream_chica', x => {
  const s = x.S.void; x.out.scene = s; const a = 0.35 - x.u * 0.6;
  cam(x, [Math.sin(a) * 1.5, 1.7, Math.cos(a) * 1.5], [0, 1.6, 0], 40); hand(x, 0.6);
  x.S.voidSpot.color.set('#f0d8ff'); x.S.voidFill.color.set('#b070ff'); x.S.voidFill.intensity = 5;
  const c = put(x, 'chica', s, 0, 0, 0); c.idle(x.t, 1); c.head.rotation.z += 0.15 * Math.sin(x.L * 2.5); lookAtCam(x, c, 0.7);
  sparkles(x, s, [0, 1.75, 0], 0.55, 8, 1.0);
  s.add(x.FX.dreamStars); x.FX.dreamStars.position.set(0, -1, -2); x.FX.dreamStars.children.forEach((st, i) => { st.quaternion.copy(x.camera.quaternion); });
  x.post.tint.value.set(1.05, 0.95, 1.15); x.bloom.strength = 0.8;
});
// 54.60 "ou ela só tira o bico pra ficar assustadora mesmo?"
at(54.60, 'fast_rip', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L;
  cam(x, [0.1, 1.74, 2.0 - eo(seg(L, 0.35, 0.5)) * 0.35], [0, 1.66, 0], 40); hand(x);
  const c = put(x, 'chica', s, 0, 0, 0); c.idle(x.t, 0.5);
  removeBeak(x, c, L - 0.08, 0.7, { throw: true });
  const red = L > 0.37 ? 1 : 0; x.S.voidRim.intensity = 8 * red; x.S.voidFill.color.set(red ? '#ff3040' : '#b070ff'); x.S.voidFill.intensity = red ? 3 : 5; x.S.voidSpot.intensity = red ? 32 : 42;
  if (L > 0.37 && L < 0.65) shake(x, 0.8 * (1 - seg(L, 0.37, 0.65)));
  x.post.flash.value = L > 0.37 ? 0.5 * (1 - seg(L, 0.37, 0.5)) : 0; x.post.chroma.value = red * 0.5;
  c.head.rotation.z += -0.14 * eo(seg(L, 0.7, 1.0));
});
at(56.10, 'lean_in', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L;
  camMove(x, [0.4, 1.6, 2.5], [0, 1.55, 0], [0.15, 1.72, 1.65], [0, 1.66, 0.1], eo, 40); hand(x);
  const c = put(x, 'chica', s, 0, 0, 0); noBeak(x); c.beak.visible = true; c.idle(x.t, 1);
  const lean = eio(seg(L, 0.1, 0.9)); c.torso.rotation.x = 0.28 * lean; c.head.rotation.x = -0.2 * lean; c.head.rotation.z = -0.18 * lean;
  aim(c, 'R', rootPt(c, -0.6, 0.85, 0.3), 1); beakBlend(x, 1); lookAtCam(x, c, 0.6 * lean);
  x.S.voidRim.intensity = 7; x.S.voidFill.color.set('#ff3040'); x.S.voidFill.intensity = 2.5; x.S.voidSpot.intensity = 38;
});
// 57.56 "Comenta aí e me segue para mais mistérios."
at(57.56, 'finale', x => {
  const s = x.S.stage; x.out.scene = s; stageChars(x, false); const L = x.L;
  camMove(x, [1.7, 2.05, 1.4], [2.0, 2.1, -1.7], [0.2, 2.2, 5.4], [0.2, 1.6, -1.6], eio, 42); hand(x);
  const list = ['bonnie', 'freddy', 'chica']; idleAll(x, list);
  list.forEach((n, i) => { const c = x.C[n]; const w = sm(seg(L, 0.15 + i * 0.15, 0.45 + i * 0.15)); lookAtCam(x, c, 0.8);
    c.armL.piv.rotation.z += (2.6 + 0.3 * Math.sin(L * 11 + i)) * w; c.head.rotation.z += 0.1 * w * Math.sin(L * 5 + i); });
  sparkles(x, s, [0.5, 2.6, -1.4], 1.6, 8, 1.6);
  x.post.fade.value = sm(seg(L, x.d - 0.25, x.d));
});

export const SHOTS = shots;
export const DURATION = 60.0;
