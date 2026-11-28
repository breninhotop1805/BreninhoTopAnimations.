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
const CS = 0.75; // Charlotte / child scale
function rainOn(x, scene, cx, cz, sx = 7, sz = 7, top = 6, gy = 0) { scene.add(x.RAIN.group); x.RAIN.update(x.t, cx, cz, sx, sz, top, gy, 0.12, x.camera.position); }
// lightning: list of strike times (absolute seconds) -> flash + light spike
function lightning(x, strikes, light, k = 1) {
  let f = 0; for (const s of strikes) { const d = x.t - s; if (d >= 0 && d < 0.35) f = Math.max(f, (d < 0.06 ? 1 : d < 0.12 ? 0.3 : d < 0.18 ? 0.8 : 1 - (d - 0.18) / 0.17) * k); }
  if (light) light.intensity = 4 * f; x.post.flash.value = Math.max(x.post.flash.value, 0.12 * f); return f;
}
function standOut(c) { c.root.position.y = 0.1; } // on the sidewalk
function puppetGlide(x, c, amt = 1) { c.idle(x.t, 1.3 * amt); c.root.position.y += 0.04 * Math.sin(x.t * 2.2) * amt; c.armR.piv.rotation.z -= 0.12; c.armL.piv.rotation.z += 0.12; }
function lieSide(c) { c.root.rotation.set(-Math.PI / 2, 0, -Math.PI / 2, 'ZXY'); }
function ghostRise(x, scene, base, k, op = 0.7) { const g = put(x, 'ghostCharlotte', scene, base.x, base.y, base.z, base.ry || 0, CS); g.idle(x.t, 1, 4); g.ghostMat.opacity = op * k; return g; }

// --------------------------------------------------------------------------------------
const shots = [];
const at = (t, name, fn) => shots.push({ t, name, fn });

// 0.00 "Você sabe a verdadeira história de Puppet,"
at(0.00, 'puppet_turn', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L; const c = put(x, 'puppet', s, 0, 0, 0, Math.PI);
  const turn = eio(seg(L, 1.15, 1.95)); c.root.rotation.y = mix(Math.PI, 0, turn); puppetGlide(x, c);
  camMove(x, [0.35, 1.9, 3.4], [0, 1.85, 0], [0.18, 2.1, 2.3], [0, 2.05, 0], eo, 40); hand(x, 0.6);
  x.S.voidSpot.intensity = 34; x.S.voidSpot.color.set('#efe0ff'); x.S.voidFill.color.set('#9a70ff'); x.S.voidFill.intensity = 3.5;
  x.post.fade.value = 1 - sm(seg(L, 0, 0.4)); x.post.vig.value = 0.7;
});
// 2.30 "a personagem mais importante"
at(2.30, 'prize_rise', x => {
  const s = x.S.prize; x.out.scene = s; const L = x.L;
  x.S.giftLid.rotation.x = -1.95 * back(seg(L, 0.0, 0.3));
  const rise = eo(seg(L, 0.15, 0.95)); const c = put(x, 'puppet', s, 1.8, mix(-1.9, 0, rise), -1.6, 0); c.idle(x.t, 1);
  c.armR.piv.rotation.z -= 0.35 * rise; c.armL.piv.rotation.z += 0.35 * rise;
  camMove(x, [2.9, 1.0, 1.5], [1.8, 2.0, -1.6], [2.5, 1.35, 0.8], [1.8, 2.2, -1.6], eo, 46); hand(x, 0.6);
  x.S.giftSpot.intensity = 40; sparkles(x, s, [1.8, 2.3, -1.6], 0.8, 6, rise);
});
// 3.70 "de FNaF?"
at(3.70, 'facade_logo', x => {
  const s = x.S.facade; x.out.scene = s; const L = x.L;
  camMove(x, [0.6, 2.2, 7.6], [0, 3.9, 0], [0.25, 2.8, 5.6], [0, 4.1, 0], eo, 50); hand(x, 0.6);
  rainOn(x, s, 0, 4, 12, 9, 7, 0.1); lightning(x, [3.95], x.S.facadeLightning);
});
// 4.54 "A alma dentro dela é de uma garotinha"
at(4.54, 'soul_inside', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L; const c = put(x, 'puppet', s, 0, 0, 0, 0); puppetGlide(x, c, 0.6);
  camMove(x, [0.3, 1.8, 3.6], [0, 1.6, 0], [0.15, 1.75, 3.0], [0, 1.65, 0], eo, 42); hand(x, 0.6);
  const k = sm(seg(L, 0.2, 0.7)); const g = put(x, 'ghostCharlotte', s, 0, 0.35, 0.12, 0, CS); g.idle(x.t, 1, 2); g.ghostMat.opacity = 0.42 * k;
  orbAt(x, 0, s, chest(c), 0.9 * k);
  x.S.voidSpot.intensity = 22; x.S.voidFill.color.set('#9fd0ff'); x.S.voidFill.intensity = 3 + 2 * k; x.bloom.strength = 0.35 + 0.5 * k;
});
// 6.10 "chamada Charlotte."
at(6.10, 'charlotte_intro', x => {
  const s = x.S.shop; x.out.scene = s; const L = x.L; const c = put(x, 'charlotte', s, -0.4, 0, -1.2, 0.2, CS); c.idle(x.t, 1);
  camMove(x, [0.0, 1.45, 0.6], [-0.4, 1.3, -1.2], [-0.2, 1.4, 0.1], [-0.4, 1.32, -1.2], eo, 40); hand(x, 0.5);
  lookAtCam(x, c, 0.85); c.head.rotation.z += 0.12 * sm(seg(L, 0.3, 0.7));
  const w = sm(seg(L, 0.35, 0.6)); c.armL.piv.rotation.z += 2.3 * w + 0.3 * Math.sin(L * 10) * w;
  sparkles(x, s, headTop(c, 0.5), 0.35, 5, 0.6);
});
// 7.38 "Ela era a filha do Henry,"
at(7.38, 'henry_intro', x => {
  const s = x.S.shop; x.out.scene = s; const L = x.L;
  const h = put(x, 'henry', s, 0.25, 0, -1.6, -0.35); h.idle(x.t, 1); const c = put(x, 'charlotte', s, -0.45, 0, -1.2, 0.35, CS); c.idle(x.t, 1, 2);
  camMove(x, [0.5, 1.55, 1.4], [-0.1, 1.35, -1.4], [0.3, 1.6, 0.8], [-0.1, 1.45, -1.4], eo, 42); hand(x);
  const turn = eio(seg(L, 0.6, 0.95)); h.root.rotation.y = mix(-1.2, -0.35, turn); lookAtCam(x, h, turn * 0.7);
  c.root.updateMatrixWorld(true); const top = new V3(...headTop(c, 0.62)); aim(h, 'R', top, sm(seg(L, 0.9, 1.25)));
  c.head.rotation.y += 0.5; c.head.rotation.x -= 0.2;
});
// 8.76 "o gênio que construiu"
at(8.76, 'henry_weld', x => {
  const s = x.S.shop; x.out.scene = s; const L = x.L;
  const h = put(x, 'henry', s, -1.5, 0, -2.25, Math.PI); h.idle(x.t, 1); h.head.rotation.x = 0.35;
  const bp = x.S.benchPos; const m = x.MASKS[0]; s.add(m); m.position.set(bp.x, bp.y, bp.z); m.rotation.y = 0.5;
  aim(h, 'R', new V3(bp.x + 0.15, bp.y + 0.3, bp.z + 0.35), 1); aim(h, 'L', new V3(bp.x - 0.2, bp.y + 0.2, bp.z + 0.3), 0.8);
  h.armR.piv.rotateX(0.08 * Math.sin(L * 25));
  camMove(x, [0.1, 1.65, -2.7], [-1.55, 1.15, -3.15], [-0.2, 1.55, -2.85], [-1.55, 1.15, -3.15], eo, 44); hand(x, 0.5);
  const tip = new V3(bp.x + 0.12, bp.y + 0.32, bp.z + 0.12); sparksAt(x, s, tip, ((L * 2.2) % 1) * 0.7);
  x.S.shopFill.intensity = 3.5 + 3 * Math.max(0, Math.sin(x.t * 30)); x.bloom.strength = 0.55;
});
// 9.66 "os primeiros animatrônicos."
at(9.66, 'originals_line', x => {
  const s = x.S.shop; x.out.scene = s; const L = x.L;
  [['oldBonnie', -1.6], ['oldFreddy', -0.35], ['oldChica', 0.9]].forEach(([n, px], i) => { const c = put(x, n, s, px, 0, -2.9, 0.1 * (1 - i)); c.idle(x.t, 0.4, i); droop(c, 1 - 0.7 * sm(seg(L, 0.5, 0.9))); });
  const k = eio(x.u); cam(x, [mix(-2.3, 1.4, k), 1.75, mix(0.6, 0.9, k)], [mix(-1.4, 0.6, k), 1.55, -2.9], 46); hand(x);
  const on = L > 0.56; x.S.shopLamp.intensity = on ? 40 : 14; x.post.flash.value = L > 0.56 && L < 0.68 ? 0.18 : 0;
});
// 11.24 "Ela também foi a primeira vítima"
at(11.24, 'first_victim', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L; const c = put(x, 'charlotte', s, 0, 0, 0, 0, CS); c.idle(x.t, 0.8);
  camMove(x, [0.2, 1.3, 1.9], [0, 1.25, 0], [0.1, 1.28, 1.45], [0, 1.27, 0], eo, 40); hand(x, 0.4);
  c.head.rotation.x = 0.25; x.S.voidSpot.intensity = mix(40, 16, x.u); x.S.voidFill.color.set('#6a80c0'); x.S.voidFill.intensity = 2; x.post.vig.value = mix(0.6, 1.0, x.u);
});
// 12.44 "de todas."
at(12.44, 'alone_wide', x => {
  const s = x.S.hall; x.out.scene = s; const L = x.L; const c = put(x, 'charlotte', s, 0, 0, -8.5, 0, CS); c.idle(x.t, 0.6); c.head.rotation.x = 0.2;
  camMove(x, [0.25, 1.6, -1.0], [0, 0.9, -8.5], [0.15, 1.5, -2.2], [0, 0.9, -8.5], eo, 40); hand(x, 0.5);
  const offAt = [1.1, 0.85, 99, 0.35]; x.S.hallLamps.forEach((l, i) => { l.intensity = L > offAt[i] ? 0.4 : (i === 2 ? 5 : 8) * flicker(x.t, i); });
  x.post.vig.value = 0.85;
});
// 13.88 "William Afton"
at(13.88, 'william_reveal', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L; const c = put(x, 'william', s, 0, 0, 0, 0); c.idle(x.t, 0.6);
  camMove(x, [0.35, 1.25, 1.9], [0, 1.75, 0], [0.2, 1.3, 1.55], [0, 1.78, 0], eo, 42); hand(x, 0.5); lookAtCam(x, c, 0.8);
  x.S.voidSpot.intensity = 26; x.S.voidSpot.color.set('#e0d0ff'); x.S.voidFill.color.set('#8a30ff'); x.S.voidFill.intensity = 2.5; x.S.voidFill.position.set(0.6, 0.6, 1.2);
  x.post.tint.value.set(1.05, 0.9, 1.12);
});
// 14.66 "não a pegou em uma sala secreta,"
at(14.66, 'secret_room', x => {
  const s = x.S.facade; x.out.scene = s; const L = x.L;
  camMove(x, [0.9, 1.35, -4.2], [2.6, 1.35, -8.1], [1.5, 1.35, -5.2], [2.6, 1.3, -8.1], eo, 50); hand(x, 0.5);
  x.S.secretDoor.rotation.y = -1.3 * (1 - eo(seg(L, 0.25, 0.55)));
  if (L > 0.55 && L < 0.65) shake(x, 0.25);
  x.S.inLamps.forEach(l => l.intensity = 10); x.S.inGlow.intensity = 6; x.S.inGlow.position.set(2.0, 2.2, -6.2);
  pop(x, x.FX.xmark, s, [2.6, 1.55, -7.6], 0.75, 0.42, false);
});
// 16.48 "ele simplesmente a trancou pra fora"
at(16.48, 'locks_door', x => {
  const s = x.S.facade; x.out.scene = s; const L = x.L;
  const ch = put(x, 'charlotte', s, -0.25, 0.1, 0.75, Math.PI, CS); ch.idle(x.t, 1); ch.head.rotation.x = -0.2;
  const w = put(x, 'william', s, 0.25, 0, -0.55, 0.05); w.idle(x.t, 0.6); lookAtCam(x, w, 0.3);
  const lk = sm(seg(L, 0.45, 0.8)); aim(w, 'L', x.S.lock.getWorldPosition(new V3()).add(new V3(0, 0, -0.08)), lk);
  if (L > 0.6) x.S.lock.rotation.z = Math.PI / 2;
  camMove(x, [0.9, 1.45, 3.0], [0, 1.3, 0], [0.6, 1.4, 2.3], [0, 1.35, 0], eo, 44); hand(x);
  rainOn(x, s, 0, 3.5, 9, 7, 6, 0.1); lightning(x, [17.3], x.S.facadeLightning, 0.7);
  x.S.inLamps.forEach(l => l.intensity = 7);
});
// 18.34 "do restaurante,"
at(18.34, 'charlotte_knock', x => {
  const s = x.S.facade; x.out.scene = s; const L = x.L;
  const ch = put(x, 'charlotte', s, 0.0, 0.1, 0.45, 0, CS); ch.idle(x.t, 1);
  const k = Math.max(0, Math.sin(L * 16)); aim(ch, 'R', rootPt(ch, -0.1, 1.25, 0.9 - 0.15 * k), 1);
  ch.head.rotation.x = -0.1; lookAtCam(x, ch, 0.5);
  cam(x, [0.15, 1.05, -1.4], [0, 1.0, 0.6], 42); hand(x, 0.5);
  rainOn(x, s, 0, 3.0, 7, 6, 6, 0.1); lightning(x, [18.75], x.S.facadeLightning, 0.8);
  x.S.inLamps.forEach(l => l.intensity = 7); x.post.tint.value.set(0.92, 0.95, 1.08);
});
// 19.08 "no meio de uma forte tempestade."
at(19.08, 'storm_wide', x => {
  const s = x.S.facade; x.out.scene = s; const L = x.L;
  const ch = put(x, 'charlotte', s, -0.2, 0.1, 0.55, Math.PI * 0.92, CS); ch.idle(x.t, 1); ch.armR.piv.rotation.x = -1.2;
  camMove(x, [3.2, 2.0, 9.5], [0, 2.3, 0], [2.4, 1.6, 8.0], [0, 2.1, 0], eo, 48); hand(x);
  rainOn(x, s, 0.5, 5, 14, 11, 7, 0.0);
  const f = lightning(x, [19.55, 20.0, 20.15], x.S.facadeLightning, 1); x.S.facade.background.set(f > 0.5 ? '#3a4a6a' : '#04060c');
  if (x.t > 20.0 && x.t < 20.3) shake(x, 0.2);
});
// 20.90 "O que poucos lembram é que a Marionete original"
at(20.90, 'puppet_origin', x => {
  const s = x.S.shop; x.out.scene = s; const L = x.L;
  const p = put(x, 'puppet', s, 0.9, 0.05, -2.4, 0); droop(p, 1); p.armR.piv.rotation.z = -0.12; p.armL.piv.rotation.z = 0.12;
  const h = put(x, 'henry', s, -0.1, 0, -1.7, 0.9); h.idle(x.t, 1); aim(h, 'L', rootPt(p, -0.1, 1.9, 0.3), 1); h.armL.piv.rotateX(0.05 * Math.sin(L * 8));
  const k = eio(x.u); cam(x, [mix(-0.8, 0.5, k), mix(1.6, 2.15, k), mix(0.8, -0.6, k)], [mix(0.4, 0.9, k), mix(1.6, 2.15, k), -2.4], 44); hand(x, 0.5);
});
// 22.98 "era um robô de segurança,"
at(22.98, 'security', x => {
  const s = x.S.shop; x.out.scene = s; const L = x.L; x.BR_P.visible = true;
  const p = put(x, 'puppet', s, 0.9, 0.05, -2.4, 0); const wake = sm(seg(L, 0.3, 0.8)); droop(p, 1 - wake);
  p.armL.piv.rotation.x = -1.0 * wake; p.armL.piv.rotation.z = 0.12;
  const led = x.BR_P.userData.led; led.material.color.set(Math.floor(L * 4) % 2 ? '#3cff7a' : '#0a3a1a');
  p.root.updateMatrixWorld(true); const wp = x.BR_P.getWorldPosition(new V3());
  const z = eio(x.u); cam(x, [wp.x + mix(1.3, 0.95, z), wp.y + 0.35, wp.z + mix(1.6, 1.2, z)], [wp.x - 0.15, wp.y + 0.35 * z, wp.z], 44); hand(x, 0.4); x.S.shopLamp.intensity = 22;
  if (wake > 0.5) orbAt(x, 0, s, p.head.localToWorld(new V3(0, 4 * x_U, 4.6 * x_U)), 0.25);
  x.bloom.strength = 0.55;
});
// 24.48 "programado pelo pai dela,"
at(24.48, 'henry_program', x => {
  const s = x.S.shop; x.out.scene = s; x.out.screen = 'code'; const L = x.L;
  const h = put(x, 'henry', s, 1.95, 0, -0.55, Math.PI - 0.55); h.idle(x.t, 0.5); h.head.rotation.x = 0.2; h.head.rotation.y = -0.3;
  const k = Math.sin(L * 18); aim(h, 'R', new V3(2.35, 1.0, -0.95 + 0.02 * k), 1); aim(h, 'L', new V3(2.6, 1.0, -0.95 - 0.02 * k), 1);
  const c = x.S.shopCrt; camMove(x, [c.x + 0.95, c.y + 0.2, c.z + 1.25], [c.x - 0.15, c.y - 0.05, c.z], [c.x + 0.6, c.y + 0.12, c.z + 0.85], [c.x - 0.05, c.y, c.z], eo, 46); hand(x, 0.4);
  x.S.shopCrtLight.intensity = 3;
});
// 25.80 "justamente pra protegê-la."
at(25.80, 'protect', x => {
  const s = x.S.shop; x.out.scene = s; const L = x.L; x.BR_P.visible = true; x.BR_C.visible = true;
  const ch = put(x, 'charlotte', s, -0.3, 0, -0.9, 0, CS); ch.idle(x.t, 1); lookAtCam(x, ch, 0.6);
  const p = put(x, 'puppet', s, -0.3, 0, -1.35, 0); p.idle(x.t, 1);
  ch.root.updateMatrixWorld(true); const sh = new V3(...headTop(ch, 0.0)); const k = sm(seg(L, 0.05, 0.5));
  aim(p, 'R', sh.clone().add(new V3(-0.18, -0.02, 0.05)), k); aim(p, 'L', sh.clone().add(new V3(0.18, -0.02, 0.05)), k); p.head.rotation.x = 0.35 * k;
  for (const b of [x.BR_P, x.BR_C]) b.userData.led.material.color.set(Math.floor(L * 4) % 2 ? '#3cff7a' : '#1a6a3a');
  camMove(x, [0.4, 1.6, 1.6], [-0.3, 1.5, -1.1], [0.2, 1.65, 1.1], [-0.3, 1.55, -1.1], eo, 44); hand(x);
  sparkles(x, s, [-0.3, 1.6, -1.0], 0.6, 6, 0.7); x.S.shopFill.intensity = 5;
});
// 27.28 "Quando a Puppet percebeu"
at(27.28, 'puppet_alert', x => {
  const s = x.S.facade; x.out.scene = s; const L = x.L; x.BR_P.visible = true;
  const p = put(x, 'puppet', s, -2.2, 0, -3.2, Math.PI * 0.85); puppetGlide(x, p, 0.5);
  const snap = eo(seg(L, 0.72, 0.85)); p.head.rotation.y = mix(0, 0.9, snap);
  p.root.rotation.y = mix(Math.PI * 0.85, Math.PI * 0.85 + 0.6 * snap, snap);
  x.BR_P.userData.led.material.color.set(snap > 0 && Math.floor(L * 8) % 2 ? '#ff3030' : '#3cff7a');
  camMove(x, [-1.0, 1.95, -5.6], [-2.2, 2.0, -3.2], [-1.3, 2.1, -5.0], [-2.2, 2.1, -3.2], eo, 42); hand(x);
  x.S.inLamps.forEach(l => l.intensity = 7); x.S.inGlow.intensity = 3; x.S.inGlow.position.set(-1.6, 2.2, -4.6);
  pop(x, x.FX.ex1, s, headTop(p, 0.75), 0.8, 0.6);
  lightning(x, [28.3], x.S.facadeLightning, 0.8);
});
// 28.84 "que a Charlotte estava lá fora,"
at(28.84, 'window_view', x => {
  const s = x.S.facade; x.out.scene = s; const L = x.L;
  const ch = put(x, 'charlotte', s, 3.4, 0.1, 2.0, Math.PI * 0.8, CS); ch.idle(x.t, 1); ch.head.rotation.x = 0.2; ch.armR.piv.rotation.x = -0.5; ch.armL.piv.rotation.x = -0.5;
  camMove(x, [3.0, 1.6, -1.6], [3.45, 0.9, 2.0], [3.2, 1.55, -1.1], [3.4, 0.95, 2.0], eo, 40); hand(x, 0.5);
  rainOn(x, s, 3.4, 3.2, 7, 5, 6, 0.1); lightning(x, [29.4], x.S.facadeLightning, 0.7);
  x.S.inLamps.forEach(l => l.intensity = 2.5); x.S.inGlow.intensity = 0.8; x.post.tint.value.set(0.9, 0.95, 1.1);
});
// 30.22 "ela saiu no meio da chuva."
at(30.22, 'puppet_exit', x => {
  const s = x.S.alley; x.out.scene = s; const L = x.L;
  const p = put(x, 'puppet', s, -1.3, 0, -3.0, Math.PI / 2); const k = seg(L, 0.0, x.d);
  walkTo(p, [-1.25, 0, -3.0], [-0.1, 0, -1.6], eo(k), 1.3); p.root.rotation.y = mix(Math.PI / 2, 0.5, sm(seg(L, 0.3, 0.9)));
  camMove(x, [0.6, 1.3, 1.2], [-0.8, 1.6, -2.8], [0.5, 1.4, 0.6], [-0.3, 1.7, -2.0], eo, 46); hand(x);
  rainOn(x, s, 0, -2, 3.6, 8, 6.5, 0); lightning(x, [31.2], x.S.alleyLightning, 0.8);
});
// 31.88 "A água causou um curto-circuito"
at(31.88, 'short_circuit', x => {
  const s = x.S.alley; x.out.scene = s; const L = x.L; const p = put(x, 'puppet', s, -0.1, 0, -1.6, 0.4); p.idle(x.t, 1);
  const zap = L > 0.8; const j = Math.floor(L * 9), jr = rng(j * 3 + 1);
  if (zap) { p.head.rotation.z += (jr() - 0.5) * 0.6; p.head.rotation.x += (jr() - 0.5) * 0.4; p.armR.piv.rotation.z += (jr() - 0.5) * 0.8; p.armL.piv.rotation.x += (jr() - 0.5) * 0.8; }
  p.root.updateMatrixWorld(true); sparksAt(x, s, p.armL.piv.getWorldPosition(new V3()), zap ? ((L * 3) % 1) * 0.6 : -1);
  camMove(x, [0.7, 2.0, 0.4], [-0.1, 1.85, -1.6], [0.45, 2.05, -0.1], [-0.1, 1.9, -1.6], eo, 42); hand(x, 0.6);
  rainOn(x, s, 0, -1.5, 3.6, 5, 6.5, 0);
  x.S.alleyLamp.intensity = zap ? 7 * flicker(x.t * 2, 3) : 7; if (zap && (L * 3) % 1 < 0.15) { x.post.flash.value = 0.25; x.post.stat.value = 0.15; }
  x.post.chroma.value = zap ? 0.4 : 0;
});
// 33.56 "e ela caiu abraçada"
at(33.56, 'collapse', x => {
  const s = x.S.alley; x.out.scene = s; const L = x.L;
  const ch = put(x, 'charlotte', s, 0.25, 0.094, -1.2, 0, CS); ch.root.rotation.set(-Math.PI / 2, 0.15, 0, 'YXZ'); ch.armR.piv.rotation.z = -0.4; ch.armL.piv.rotation.z = 0.5; ch.head.rotation.y = 0.4;
  const p = put(x, 'puppet', s, -0.35, 0, 0.2, Math.PI * 0.85); const fall = ei(seg(L, 0.35, 1.25)); p.root.rotation.set(1.35 * fall, Math.PI * 0.85, 0, 'YXZ');
  p.idle(x.t, 1 - fall); p.armR.piv.rotation.x = -1.2 * fall; p.armL.piv.rotation.x = -1.2 * fall; p.head.rotation.x = 0.3 * fall;
  camMove(x, [1.6, 1.3, 1.6], [-0.1, 0.7, -0.5], [1.4, 1.1, 1.3], [-0.1, 0.6, -0.5], eo, 46); hand(x, 0.6);
  if (L > 1.25 && L < 1.4) shake(x, 0.35);
  rainOn(x, s, 0, -0.5, 3.6, 5, 6.5, 0); x.S.alleyLamp.intensity = 9 * flicker(x.t, 6);
});
// 35.12 "ao corpo da filha de Henry no beco."
at(35.12, 'embrace', x => {
  const s = x.S.alley; x.out.scene = s; const L = x.L;
  const ch = put(x, 'charlotte', s, 0.2, 0.094, 0.1, 0, CS); ch.root.rotation.set(-Math.PI / 2, 0, 0, 'YXZ'); ch.armR.piv.rotation.z = -0.35; ch.armL.piv.rotation.z = 0.4; ch.head.rotation.y = -0.35;
  const p = put(x, 'puppet', s, -0.3, 0.2, 1.3, 0); lieSide(p); p.head.rotation.z = 0; p.root.updateMatrixWorld(true);
  aim(p, 'R', ch.torso.localToWorld(new V3(1.5 * x_U, 8 * x_U, 2 * x_U)), 1); p.legR.piv.rotation.x = -0.4; p.legL.piv.rotation.x = -0.2;
  const k = eo(x.u); cam(x, [mix(0.4, 0.9, k), mix(3.2, 4.4, k), mix(1.2, 1.9, k)], [0, 0.1, -0.4], 46);
  rainOn(x, s, 0, 0, 3.6, 6, 6.5, 0); x.S.alleyLamp.intensity = 7; x.post.tint.value.set(0.9, 0.96, 1.08); x.post.vig.value = 0.7;
});
// 37.10 "Foi nesse exato momento em que a alma de Charlotte Emily"
at(37.10, 'soul_rise', x => {
  const s = x.S.alley; x.out.scene = s; const L = x.L;
  const ch = put(x, 'charlotte', s, 0.2, 0.094, 0.1, 0, CS); ch.root.rotation.set(-Math.PI / 2, 0, 0, 'YXZ'); ch.armR.piv.rotation.z = -0.35; ch.armL.piv.rotation.z = 0.4; ch.head.rotation.y = -0.35;
  const p = put(x, 'puppet', s, -0.3, 0.2, 1.3, 0); lieSide(p); p.root.updateMatrixWorld(true); aim(p, 'R', ch.torso.localToWorld(new V3(1.5 * x_U, 8 * x_U, 2 * x_U)), 1);
  const k = sm(seg(L, 0.9, 2.2)); const g = ghostRise(x, s, { x: 0.2, y: mix(-0.2, 0.55, k), z: -0.4 }, sm(seg(L, 0.8, 1.4)), 0.5); lookAtCam(x, g, 0.5);
  orbAt(x, 0, s, new V3(0.2, mix(0.2, 1.2, k), -0.3), 0.6 * sm(seg(L, 0.8, 1.2)));
  camMove(x, [1.4, 0.5, 2.3], [0.1, 0.9, -0.3], [1.1, 0.55, 1.9], [0.1, 1.1, -0.3], eo, 46); hand(x, 0.5);
  rainOn(x, s, 0, 0, 3.6, 6, 6.5, 0); x.S.alleyLamp.intensity = 6; x.bloom.strength = 0.35 + 0.25 * k; x.post.tint.value.set(0.9, 0.97, 1.12);
});
// 39.66 "possuiu a Puppet."
at(39.66, 'soul_enter', x => {
  const s = x.S.alley; x.out.scene = s; const L = x.L;
  const ch = put(x, 'charlotte', s, 0.2, 0.094, 0.1, 0, CS); ch.root.rotation.set(-Math.PI / 2, 0, 0, 'YXZ'); ch.armR.piv.rotation.z = -0.35; ch.armL.piv.rotation.z = 0.4; ch.head.rotation.y = -0.35;
  const p = put(x, 'puppet', s, -0.3, 0.2, 1.3, 0); lieSide(p); p.root.updateMatrixWorld(true); aim(p, 'R', ch.torso.localToWorld(new V3(1.5 * x_U, 8 * x_U, 2 * x_U)), 1);
  const head = p.head.localToWorld(new V3(0, 4 * x_U, 2 * x_U)); const k = ei(seg(L, 0.0, 0.8));
  const start = new V3(0.2, 1.1, -0.3); const pos = start.clone().lerp(head, k);
  if (k < 1) { const g = ghostRise(x, s, { x: pos.x, y: pos.y - 0.6, z: pos.z }, 1 - k, 0.5); g.root.scale.setScalar(CS * (1 - 0.6 * k)); orbAt(x, 0, s, pos, 0.6); }
  else orbAt(x, 0, s, head, 0.45 * (1 - seg(L, 0.8, 1.4)) + 0.15);
  if (L > 0.8 && L < 0.95) { x.post.flash.value = 0.55; } if (L > 0.8 && L < 1.1) shake(x, 0.3);
  p.head.rotation.y = 0.3 * sm(seg(L, 1.0, 1.5));
  camMove(x, [-1.4, 1.1, 2.6], [-0.4, 0.3, 0.2], [-1.1, 0.95, 2.1], [-0.4, 0.3, 0.2], eo, 44); hand(x, 0.5);
  rainOn(x, s, 0, 0.5, 3.6, 6, 6.5, 0); x.S.alleyLamp.intensity = 7; x.bloom.strength = 0.5;
});
// 41.20 "Diferente dos outros que atacam por puro instinto,"
at(41.20, 'others_attack', x => {
  const s = x.S.hall; x.out.scene = s; const L = x.L;
  camMove(x, [0.05, 1.0, -1.4], [0, 1.6, -7], [0.05, 0.95, -0.9], [0, 1.6, -7], eo, 46); hand(x);
  const lunge = eo(seg(L, 1.05, 1.35));
  [['oldBonnie', -0.9, -5.4], ['oldChica', 0.0, -4.8], ['oldFreddy', 0.95, -5.9]].forEach(([n, px, pz], i) => {
    const c = put(x, n, s, px, 0, pz, 0); walkTo(c, [px, 0, pz], [px, 0, pz + 1.2 + (i === 1 ? 1.2 * lunge : 0)], x.u, 1.0); c.root.rotation.y = 0; lookAtCam(x, c, 0.6); c.head.rotation.x -= 0.12; });
  const ch = x.C.oldChica; aim(ch, 'R', rootPt(ch, -0.3, 1.9, 1.0), lunge); aim(ch, 'L', rootPt(ch, 0.3, 1.9, 1.0), lunge);
  x.S.hallLamps.forEach((l, i) => { l.color.set('#ff3a30'); l.intensity = 9 * flicker(x.t, i + 1); });
  if (L > 1.1 && L < 1.5) shake(x, 0.6); x.post.flash.value = L > 1.12 && L < 1.22 ? 0.3 : 0; x.post.tint.value.set(1.15, 0.85, 0.85); x.post.vig.value = 0.75;
});
// 43.46 "a Marionete tem consciência."
at(43.46, 'puppet_aware', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L; const c = put(x, 'puppet', s, 0, 0, 0, 0); puppetGlide(x, c, 0.7);
  camMove(x, [0.3, 2.2, 2.4], [0, 2.15, 0], [0.12, 2.2, 1.8], [0, 2.2, 0], eo, 40); hand(x, 0.5); lookAtCam(x, c, 0.85);
  c.head.rotation.z += 0.2 * sm(seg(L, 0.75, 1.2));
  const g = put(x, 'ghostCharlotte', s, 0, 0.3, 0.15, 0, CS); g.ghostMat.opacity = 0.25; g.idle(x.t, 1);
  x.S.voidSpot.intensity = 18; x.S.voidSpot.color.set('#efe0ff'); x.S.voidFill.color.set('#a070ff'); x.S.voidFill.intensity = 2.5; sparkles(x, s, [0, 2.2, 0.1], 0.6, 5, 0.6);
});
// 45.34 "Foi ela quem colocou"
at(45.34, 'gg_gifts', x => {
  const s = x.S.gg; x.out.scene = s; x.post.pix.value = PIX(x); const L = x.L;
  const p = put(x, 'puppet', s, 0, 0, 0, 0); puppetGlide(x, p, 0.6);
  const spots = [[-1.6, -0.6, 0.6], [1.6, -0.6, -0.6], [0, 1.4, 3.1]];
  spots.forEach(([kx, kz, r], i) => lie(x, 'kid' + i, s, kx, kz, r, CS));
  const turn = mix(-0.6, 0.6, sm(seg(L, 0.2, 1.4))); p.root.rotation.y = turn; aim(p, 'R', rootPt(p, -0.4, 1.4, 1.0), sm(seg(L, 0.3, 0.7)));
  const k = eo(x.u); cam(x, [mix(0, 0.6, k), mix(5.5, 4.6, k), mix(4.2, 3.6, k)], [0, 0.6, 0], 50);
  x.post.flash.value = 0.6 * (1 - seg(L, 0, 0.15));
});
// 46.94 "as máscaras nas outras crianças mortas,"
at(46.94, 'gg_masks', x => {
  const s = x.S.gg; x.out.scene = s; x.post.pix.value = PIX(x); const L = x.L;
  const p = put(x, 'puppet', s, 0, 0, 0, 0); puppetGlide(x, p, 0.6);
  const spots = [[-1.6, -0.6, 0.6], [1.6, -0.6, -0.6], [0, 1.4, 3.1]];
  spots.forEach(([kx, kz, r], i) => { const c = lie(x, 'kid' + i, s, kx, kz, r, CS); const k = eo(seg(L, 0.1 + i * 0.35, 0.55 + i * 0.35));
    if (k <= 0) return; c.root.updateMatrixWorld(true); const hp = c.head.localToWorld(new V3(0, 0, 0)); const m = x.MASKS[i]; s.add(m);
    m.position.set(hp.x, mix(hp.y + 1.6, hp.y, k), hp.z); m.quaternion.copy(c.head.getWorldQuaternion(new THREE.Quaternion())); m.scale.setScalar(CS * 1.08); });
  aim(p, 'R', rootPt(p, -0.5, 1.6, 0.8), 1); aim(p, 'L', rootPt(p, 0.5, 1.6, 0.8), 1);
  const a = mix(0.4, -0.4, x.u); cam(x, [Math.sin(a) * 4.2, 5.2, Math.cos(a) * 4.2], [0, 0.4, 0], 48);
});
// 48.66 "dando vida aos robôs originais"
at(48.66, 'gg_life', x => {
  const s = x.S.gg; x.out.scene = s; const L = x.L; const real = L > 0.55;
  x.post.pix.value = real ? 0 : PIX(x);
  const p = put(x, 'puppet', s, 0, 0, -0.6, 0); puppetGlide(x, p, 0.6);
  const spots = [[-1.4, 0.6], [1.4, 0.6], [0, 1.3]]; const names = ['oldFreddy', 'oldBonnie', 'oldChica'];
  spots.forEach(([kx, kz], i) => { if (!real) { const c = put(x, 'kid' + i, s, kx, 0, kz, 0, CS); c.idle(x.t, 1, i); const hp = c.head.localToWorld(new V3()); const m = x.MASKS[i]; s.add(m); c.root.updateMatrixWorld(true);
      m.position.copy(c.head.localToWorld(new V3())); m.quaternion.copy(c.head.getWorldQuaternion(new THREE.Quaternion())); m.scale.setScalar(CS * 1.08); }
    else { const c = put(x, names[i], s, kx, 0, kz, 0); c.idle(x.t, 1, i); lookAtCam(x, c, 0.7); } });
  camMove(x, [0, 1.6, 5.2], [0, 1.3, 0.3], [0, 1.7, 4.4], [0, 1.45, 0.3], eo, 46); hand(x);
  x.post.flash.value = L > 0.5 && L < 0.66 ? 0.8 : 0; if (L > 0.55 && L < 0.8) shake(x, 0.3);
  if (real) sparkles(x, s, [0, 1.8, 0.8], 1.6, 8, 1.2);
});
// 50.18 "no famoso minigame de FNaF 2."
at(50.18, 'arcade_gg', x => {
  const s = x.S.screenroom; x.out.scene = s; x.out.screen = 'givegifts'; const c = x.S.arcScreenPos;
  const k = eo(x.u); const d = mix(0.35, 2.2, k);
  cam(x, [c.x - 0.35 * k, c.y + 0.05 * d - 0.1 * k, c.z + d], [c.x, c.y - 0.15 * k, c.z], 50); hand(x, 0.4);
  x.S.arcLight.intensity = 4; x.S.crtLight.intensity = 0.4; x.S.screenLamp.intensity = 0.8; x.bloom.strength = 0.55;
});
// 52.24 "Mas e aí? Sabia dessa história?"
at(52.24, 'question', x => {
  const s = x.S.void; x.out.scene = s; const L = x.L;
  const p = put(x, 'puppet', s, -0.35, 0, 0, 0.15); puppetGlide(x, p, 0.7); lookAtCam(x, p, 0.8); p.head.rotation.z += 0.18 * sm(seg(L, 0.6, 1.1));
  const g = put(x, 'ghostCharlotte', s, 0.45, 0.05 * Math.sin(x.t * 2), 0.2, -0.2, CS); g.idle(x.t, 1); g.ghostMat.opacity = 0.42; lookAtCam(x, g, 0.8);
  camMove(x, [0.2, 1.75, 3.5], [0.05, 1.6, 0], [0.1, 1.8, 2.9], [0.05, 1.65, 0], eo, 42); hand(x);
  pop(x, x.FX.q1, s, headTop(p, 0.75).map((v, i) => v + (i === 0 ? 0.25 : 0)), 0.5, 0.45);
  x.S.voidSpot.intensity = 22; x.S.voidSpot.color.set('#efe0ff'); x.S.voidFill.color.set('#a070ff'); x.S.voidFill.intensity = 3; x.bloom.strength = 0.6;
});
// 53.90 "Comente e segue pra mais mistérios."
at(53.90, 'finale', x => {
  const s = x.S.stage; x.out.scene = s; const L = x.L;
  [['oldBonnie', -1.3, -1.7, 0.12], ['oldFreddy', 0, -1.9, 0], ['oldChica', 1.3, -1.7, -0.12]].forEach(([n, px, pz, ry], i) => { const c = put(x, n, s, px, 0.65, pz, ry); c.idle(x.t, 1, i); lookAtCam(x, c, 0.7);
    c.armL.piv.rotation.z += (2.5 + 0.3 * Math.sin(L * 11 + i)) * sm(seg(L, 0.15 + i * 0.12, 0.45 + i * 0.12)); });
  const p = put(x, 'puppet', s, -0.3, 0, 0.6, 0.1); puppetGlide(x, p, 0.7); lookAtCam(x, p, 0.7); p.armL.piv.rotation.z += (2.4 + 0.3 * Math.sin(L * 10)) * sm(seg(L, 0.1, 0.35));
  const g = put(x, 'ghostCharlotte', s, 0.45, 0.05 * Math.sin(x.t * 2), 0.8, -0.1, CS); g.idle(x.t, 1); g.ghostMat.opacity = 0.42; lookAtCam(x, g, 0.8);
  camMove(x, [0.3, 2.0, 2.8], [0, 1.85, -1.0], [0, 2.2, 6.4], [0, 1.65, -1.0], eio, 46); hand(x);
  sparkles(x, s, [0, 2.6, -0.8], 1.6, 8, 1.4); x.post.fade.value = sm(seg(L, x.d - 0.3, x.d));
});

export const SHOTS = shots;
export const DURATION = 55.968;
