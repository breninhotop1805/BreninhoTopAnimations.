// Shot list for "Por que o Golden Freddy não aparece em FNAF UCN?", timed to the narration.
import * as THREE from 'three';
import { tex, T } from './sets.js';

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
function hand(x, amp = 1) {
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
function flicker(t, seed = 0) { const a = Math.sin(t * 37 + seed) + Math.sin(t * 23.3 + seed * 2) + Math.sin(t * 71.1); return a > 2.0 ? 0.15 : a > 1.6 ? 0.55 : 1; }
function walkTo(c, p0, p1, k, stride = 1.15) { const d = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]); c.root.position.set(mix(p0[0], p1[0], k), mix(p0[1], p1[1], k), mix(p0[2], p1[2], k)); c.walk(d * k / stride, 1); }

const ncCache = {};
function nightcardTex(key, time, label) { if (!ncCache[key]) ncCache[key] = tex(T.nightcard(time, label)); return ncCache[key]; }

const shots = [];
const at = (t, name, fn) => shots.push({ t, name, fn });

// 0.00 "E se eu te falar"
at(0.00, 'backstage_tease', x => {
  const s = x.S.backstage; x.out.scene = s;
  camMove(x, [0.4, 1.35, -1.2], [0, 1.6, -5.5], [0.15, 1.5, -2.3], [0, 1.65, -5.2], eo, 42); hand(x, 0.7);
  const c = put(x, 'withered', s, 0, 0, -6.3, 0.12); walkTo(c, [0, 0, -6.3], [0, 0, -4.4], x.u, 1.1); c.idle(x.t, 0.5);
  x.S.backstageLamps.forEach((l, i) => l.intensity = 13 * flicker(x.t, i));
  x.S.backstageFill.intensity = 7;
  x.post.vig.value = 0.6;
});
// 1.02 "que eu sei porque o Golden Freddy não aparece em FNAF Ultimate Custom Night,"
at(1.02, 'ucn_logo', x => {
  const s = x.S.studio; x.out.scene = s; x.S.screenGlow.intensity = 5;
  camMove(x, [1.6, 2.4, 0.9], [1.6, 2.4, -2.8], [1.6, 2.4, 0.15], [1.6, 2.4, -2.8], eo, 42, 30); hand(x, 0.6);
  x.post.stat.value = 0.08 + 0.1 * Math.max(0, Math.sin(x.t * 5));
  sparkles(x, s, [1.6, 2.4, -1.5], 0.6, 4, 0.7);
});
at(2.75, 'ucn_logo_glitch', x => {
  const s = x.S.studio; x.out.scene = s; x.S.screenGlow.intensity = 6;
  cam(x, [1.6 + 0.08 * Math.sin(x.t * 9), 2.4, -1.5 + Math.cos(x.t * 9) * 0.02], [1.6, 2.4, -2.8], mix(26, 20, eo(x.u))); hand(x, 0.4);
  if (x.L > 0.1 && x.L < 0.22) x.post.stat.value = 0.7; x.post.chroma.value = 0.3 * Math.max(0, Math.sin(x.t * 6));
});
// 4.91 "mas o Freddy vai invadir a casa"
at(4.91, 'freddy_lunge', x => {
  const s = x.S.office; x.out.scene = s; const L = x.L;
  cam(x, [0, 1.5, mix(0.2, -1.3, eo(seg(L, 0.25, 0.75)))], [0, 1.45, -4.8], mix(40, 56, eo(seg(L, 0.25, 0.75))));
  const c = put(x, 'freddy', s, 0, 0, -5.2, 0);
  const run = ei(seg(L, 0.2, 0.75)); c.root.position.z = mix(-5.2, -1.3, run); if (run > 0 && run < 1) c.walk(L * 3.5, 1.3);
  const lunge = eo(seg(L, 0.62, 0.85));
  aim(c, 'R', rootPt(c, -0.3, 2.0, 1.1), lunge); aim(c, 'L', rootPt(c, 0.3, 2.0, 1.1), lunge);
  c.torso.rotation.x = 0.2 * lunge; c.head.rotation.x = -0.18 * lunge;
  x.S.officeLamp.intensity = 7 * flicker(x.t, 4); x.S.doorLight.intensity = L > 0.2 ? 4 : 0;
  if (L > 0.75) shake(x, 0.8 * (1 - seg(L, 0.75, 1.3)));
  x.post.flash.value = L > 0.8 ? 0.4 * (1 - seg(L, 0.8, 0.95)) : 0;
});
// 7.15 "de quem não deixar o like"
at(7.15, 'cta_like', x => {
  const s = x.S.backstage; x.out.scene = s;
  camMove(x, [0.55, 1.85, 2.0], [0, 1.7, -2], [0.3, 1.78, 1.55], [0, 1.72, -2], eo, 38); hand(x);
  const c = put(x, 'freddy', s, 0, 0, -3, 0); c.idle(x.t, 1); lookAtCam(x, c, 0.9);
  const k = back(seg(x.L, 0.08, 0.38)); aim(c, 'R', rootPt(c, -0.1, 2.3, 0.7), k); c.head.rotation.z += 0.1 * k;
  pop(x, x.FX.like, s, [0.0, 2.15, -2.35], 0.1, 1.1);
  x.S.backstageLamps.forEach(l => l.intensity = 8);
});
// 8.31 "e não se inscrever no canal."
at(8.31, 'cta_bell', x => {
  const s = x.S.backstage; x.out.scene = s;
  camMove(x, [0.3, 1.9, 1.55], [0, 1.72, -2], [0.12, 1.82, 1.2], [0, 1.74, -2], eo, 38); hand(x);
  const c = put(x, 'freddy', s, 0, 0, -3, 0); c.idle(x.t, 1); lookAtCam(x, c, 0.9);
  const wv = Math.sin(x.L * 10); c.armL.piv.rotation.z += 2.2 + 0.3 * wv; c.head.rotation.z += 0.12 * wv;
  pop(x, x.FX.bell, s, headTop(c, 0.85), 0.08, 1.0);
  sparkles(x, s, headTop(c, 0.6), 0.5, 5, 0.8);
});
// 9.73 "Bom, pra começar,"
at(9.73, 'backstage_wide', x => {
  const s = x.S.backstage; x.out.scene = s;
  camMove(x, [0.3, 3.2, 3.2], [0, 1.3, -4], [1.6, 1.9, 1.6], [0, 1.4, -4.5], eio, 44); hand(x);
  const c = put(x, 'withered', s, -1.2, 0, -5.5, 0.3); c.idle(x.t, 1);
  const g = put(x, 'freddy', s, 1.2, 0, -5.5, -0.3); g.idle(x.t, 1, 1);
});
// 10.23 "esse aqui não é o Golden Freddy,"
at(10.23, 'withered_no', x => {
  const s = x.S.void; x.out.scene = s; const c = put(x, 'withered', s, 0, 0, 0); c.idle(x.t, 0.8);
  camMove(x, [0.5, 1.85, 1.8], [0, 1.72, 0], [0.22, 1.78, 1.15], [0, 1.74, 0], eo, 40); hand(x);
  const shk = Math.sin(x.L * 10) * sm(seg(x.L, 0.1, 0.3)); c.head.rotation.y += 0.3 * shk; lookAtCam(x, c, 0.7);
  x.S.voidSpot.color.set('#d8e8ff');
});
// 12.29 "mas sim o Withered Golden Freddy de FNAF 2,"
at(12.29, 'withered_confirm', x => {
  const s = x.S.void; x.out.scene = s; const c = put(x, 'withered', s, 0, 0, 0, 0.1); c.idle(x.t, 1);
  camMove(x, [0.2, 1.65, 1.35], [0, 1.68, 0], [0.08, 1.7, 0.95], [0, 1.7, 0], eo, 36); hand(x, 0.6);
  const k = back(seg(x.L, 0.05, 0.35)); aim(c, 'R', rootPt(c, -0.1, 2.1, 0.5), k * 0.6); c.head.rotation.z += 0.08 * k;
  lookAtCam(x, c, 0.8); sparkles(x, s, headTop(c, 0.5), 0.5, 5, 0.9);
  x.S.voidFill.color.set('#6f90ff'); x.S.voidFill.intensity = 3;
});
// 14.29 "e o que eu to falando não é ele,"
at(14.29, 'withered_away', x => {
  const s = x.S.void; x.out.scene = s; const c = put(x, 'withered', s, 0, 0, 0); c.idle(x.t, 0.6);
  const back3 = eo(x.u);
  cam(x, [0.15, 1.7, mix(1.1, 1.9, back3)], [0, 1.7, 0], mix(38, 44, back3)); hand(x);
  c.head.rotation.x -= 0.1 * back3; x.post.vig.value = mix(0.55, 0.85, back3);
});
// 16.13 "mas sim esse clássico do FNAF 1."
at(16.13, 'golden_reveal', x => {
  const s = x.S.void; x.out.scene = s; const c = put(x, 'golden', s, 0, 0, 0, -0.1);
  camMove(x, [1.1, 2.2, 1.9], [0, 1.1, 0], [0.4, 1.7, 1.2], [0, 1.2, 0], eo, 42); hand(x, 0.6);
  c.pelvis.rotation.x = 0.18; c.torso.rotation.x = 0.22; c.head.rotation.x = 0.1 + 0.02 * Math.sin(x.t * 2);
  c.armR.piv.rotation.x = -0.35; c.armL.piv.rotation.x = -0.35; c.legR.piv.rotation.x = -0.5; c.legL.piv.rotation.x = -0.5;
  c.pelvis.position.y -= 0.35 * sm(seg(x.L, 0, 0.3));
  x.S.voidSpot.color.set('#fff0c0'); x.S.voidFill.color.set('#e8c060'); x.S.voidFill.intensity = 2;
  if (x.L > 0.55 && x.L < 0.7) x.post.stat.value = 0.3;
});
// 18.36 "Mas enfim,"
at(18.36, 'golden_glitch_beat', x => {
  const s = x.S.void; x.out.scene = s; const c = put(x, 'golden', s, 0, 0, 0, -0.1);
  cam(x, [0.3, 1.3, 0.95], [0, 1.0, 0], 42); hand(x, 0.5); x.S.voidFill.intensity = 4.5;
  c.pelvis.rotation.x = 0.18; c.torso.rotation.x = 0.22; c.armR.piv.rotation.x = -0.35; c.armL.piv.rotation.x = -0.35; c.legR.piv.rotation.x = -0.5; c.legL.piv.rotation.x = -0.5;
  c.pelvis.position.y -= 0.35;
  x.post.stat.value = flicker(x.t * 2, 1) < 1 ? 0.5 : 0; x.S.voidSpot.color.set('#fff0c0');
});
// 18.70 "até hoje muita gente se pergunta"
at(18.70, 'scott_wonder', x => {
  const s = x.S.studio; x.out.scene = s; x.S.studioScreenMat.emissiveIntensity = 0.3; x.S.screenGlow.intensity = 1.5;
  camMove(x, [0.35, 1.6, 2.3], [-0.5, 1.5, -0.8], [0.15, 1.65, 1.8], [-0.5, 1.52, -0.8], eo, 42); hand(x);
  const c = put(x, 'scott', s, -0.5, 0, -0.8, 0.15); c.idle(x.t, 1); lookAtCam(x, c, 0.8);
  const k = sm(seg(x.L, 0.1, 0.4)); aim(c, 'R', rootPt(c, -0.1, 2.05, 0.1), k * 0.7); c.head.rotation.z -= 0.06 * k;
  pop(x, x.FX.q1, s, headTop(c, 0.75), 0.15, 0.7);
});
// 20.65 "porque que o Phone Guy ta ali"
at(20.65, 'office_phone', x => {
  const s = x.S.office; x.out.scene = s;
  camMove(x, [0.65, 1.15, -0.95], [0, 0.95, -1.5], [0.42, 1.08, -0.72], [0, 0.92, -1.5], eo, 38); hand(x, 0.6);
  const ring = Math.max(0, Math.sin(x.t * 26)); x.S.phoneLight.intensity = 2.5 + ring * 2;
  x.S.phoneGroup.rotation.z = 0.04 * Math.sin(x.t * 26);
  x.S.officeLamp.intensity = 6 * flicker(x.t, 7);
});
// 22.39 "e o amarelão não,"
at(22.39, 'office_empty_chair', x => {
  const s = x.S.office; x.out.scene = s;
  camMove(x, [0, 1.95, 0.75], [0, 0.7, 0.1], [0.55, 1.5, 0.95], [0, 0.65, 0.05], eo, 40); hand(x);
  const flashIn = eo(seg(x.L, 0.55, 0.7)); x.post.flash.value = flashIn * 0.25 * (1 - seg(x.L, 0.7, 0.85));
});
// 23.29 "e a resposta pra isso na verdade"
at(23.29, 'scott_explain', x => {
  const s = x.S.studio; x.out.scene = s; x.S.studioScreenMat.emissiveIntensity = 0.3; x.S.screenGlow.intensity = 1.5;
  camMove(x, [1.1, 1.45, 0.7], [-0.5, 1.4, -0.8], [0.5, 1.5, 1.2], [-0.5, 1.45, -0.8], eo, 40); hand(x);
  const c = put(x, 'scott', s, -0.5, 0, -0.8, 0); c.idle(x.t, 1); lookAtCam(x, c, 0.85);
  const k = sm(seg(x.L, 0.1, 0.4)); c.armR.piv.rotation.z -= 0.5 * k; c.armR.piv.rotation.x -= 0.3 * k; c.head.rotation.z += 0.05 * Math.sin(x.L * 5) * k;
});
// 25.56 "é bem mais simples do que parece."
at(25.56, 'scott_shrug', x => {
  const s = x.S.studio; x.out.scene = s; x.S.studioScreenMat.emissiveIntensity = 0.3; x.S.screenGlow.intensity = 1.5;
  camMove(x, [-0.05, 1.7, 0.95], [-0.5, 1.6, -0.8], [-0.2, 1.75, 0.65], [-0.5, 1.62, -0.8], eo, 38); hand(x, 0.6);
  const c = put(x, 'scott', s, -0.5, 0, -0.8, 0.1); c.idle(x.t, 1); lookAtCam(x, c, 0.85);
  const k = sm(seg(x.L, 0.05, 0.3)); c.armR.piv.rotation.z -= 1.3 * k; c.armL.piv.rotation.z += 1.3 * k; c.pelvis.position.y += 0.03 * k;
});
// 27.01 "Primeiramente que essa versão do segundo jogo"
at(27.01, 'nightcard_fnaf2', x => {
  const s = x.S.nightcard; x.out.scene = s;
  x.S.nightcardMat.map = nightcardTex('fnaf2', 'FNAF 2', '1987');
  cam(x, [0, 1.7, mix(1.1, 0.55, eo(x.u))], [0, 1.7, -2], 36); hand(x, 0.4);
  if (x.L < 0.12) x.post.flash.value = 0.5 * (1 - x.L / 0.12);
});
// 29.69 "nem existiria se não fosse o sucesso"
at(29.69, 'stage_nostalgia', x => {
  const s = x.S.stage; x.out.scene = s; x.S.stageSpot.intensity = 30;
  camMove(x, [1.5, 2.2, 3.4], [0, 1.3, -1.6], [0.5, 1.8, 2.3], [0, 1.4, -1.6], eo, 40); hand(x);
  const c = put(x, 'freddy', s, 0, 0.65, -1.7, 0); c.idle(x.t, 0.7);
  x.post.tint.value.set(1.06, 0.98, 0.85);
});
// 31.99 "dessa primeira do FNAF 1,"
at(31.99, 'stage_close', x => {
  const s = x.S.stage; x.out.scene = s; x.S.stageSpot.intensity = 32;
  camMove(x, [0.5, 1.85, 0.3], [0.1, 1.75, -1.7], [0.25, 1.8, -0.15], [0.1, 1.76, -1.7], eo, 36); hand(x, 0.6);
  const c = put(x, 'freddy', s, 0, 0.65, -1.7, 0); c.idle(x.t, 0.8); lookAtCam(x, c, 0.5);
  x.post.tint.value.set(1.06, 0.98, 0.85);
});
// 33.23 "já que o Scott Cawthon tinha adicionado ele"
at(33.23, 'scott_studio_type', x => {
  const s = x.S.studio; x.out.scene = s; x.S.studioScreenMat.emissiveIntensity = 0.6; x.S.screenGlow.intensity = 3;
  camMove(x, [-1.2, 1.5, -1.6], [-0.5, 1.3, -1.9], [-1.8, 1.4, -1.8], [-0.5, 1.3, -2.0], eo, 38); hand(x);
  const c = put(x, 'scott', s, -2.2, 0, -2.2, 0.6); c.idle(x.t, 1); c.head.rotation.x = 0.2;
  const k = Math.sin(x.L * 14); c.armR.piv.rotation.x = -0.6 + 0.05 * k; c.armL.piv.rotation.x = -0.6 - 0.05 * k;
});
// 35.49 "apenas como um easter egg,"
at(35.49, 'golden_teleport_in', x => {
  const s = x.S.backstage; x.out.scene = s;
  cam(x, [0.4, 1.7, 1.6], [0, 1.4, -2], 40); hand(x);
  const inT = sm(seg(x.L, 0.15, 0.35));
  const c = put(x, 'golden', s, 0, 0, -2.6, 0.1); c.idle(x.t, 0.5); c.root.scale.setScalar(0.85 + 0.15 * cl(inT)); c.root.visible = inT > 0.05;
  c.armR.piv.rotation.x = -0.3; c.armL.piv.rotation.x = -0.3;
  if (x.L > 0.1 && x.L < 0.4) x.post.stat.value = 0.6 * (1 - seg(x.L, 0.1, 0.4));
  x.post.flash.value = x.L > 0.15 && x.L < 0.3 ? 0.4 * (1 - seg(x.L, 0.15, 0.3)) : 0;
  sparkles(x, s, [0, 1.6, -2.6], 0.5, 5, 0.9);
});
// 37.13 "tendo uma aparição extremamente rara."
at(37.13, 'golden_teleport_out', x => {
  const s = x.S.backstage; x.out.scene = s;
  cam(x, [0.2, 1.65, 1.3], [0, 1.4, -2.6], 38); hand(x, 0.5);
  const outT = sm(seg(x.L, 0.45, 0.68));
  const c = put(x, 'golden', s, 0, 0, -2.6, 0.1); c.idle(x.t, 0.5); c.armR.piv.rotation.x = -0.3; c.armL.piv.rotation.x = -0.3;
  c.root.visible = outT < 0.95; c.root.scale.setScalar(1 - 0.1 * outT);
  if (x.L > 0.42 && x.L < 0.7) x.post.stat.value = 0.7 * sm(1 - seg(x.L, 0.42, 0.7));
  x.post.flash.value = x.L > 0.58 && x.L < 0.72 ? 0.5 * (1 - seg(x.L, 0.58, 0.72)) : 0;
});
// 39.41 "Mas como a galera gostou,"
at(39.41, 'fans_like', x => {
  const s = x.S.backstage; x.out.scene = s;
  camMove(x, [0.6, 1.9, 0.3], [0, 1.4, -3], [0.25, 1.8, -0.2], [0, 1.4, -3], eo, 38); hand(x);
  const f = put(x, 'freddy', s, 0, 0, -3, 0); f.idle(x.t, 1);
  sparkles(x, s, [0, 1.7, -2.6], 0.7, 8, 1.3);
  pop(x, x.FX.like, s, [0.4, 2.2, -2.6], 0.05, 1.2);
  x.S.backstageFill.intensity = 8;
});
// 41.41 "ele oficializou um novo modelo na sequência do game,"
at(41.41, 'withered_official', x => {
  const s = x.S.backstage; x.out.scene = s;
  const c = put(x, 'withered', s, 0, 0, -3, 0);
  cam(x, [1.2, 1.9, 0.4], [0, 1.5, -2.6], 38); hand(x, 0.6);
  c.idle(x.t, 1); c.torso.rotation.y = 0.3 * sm(seg(x.L, 0.1, 0.5));
  const k = back(seg(x.L, 0.1, 0.4)); c.armR.piv.rotation.z -= 0.4 * k; c.armR.piv.rotation.x -= 0.25 * k;
  x.S.backstageLamps.forEach((l, i) => l.intensity = 9 * flicker(x.t, i + 2));
});
at(43.00, 'withered_official_orbit', x => {
  const s = x.S.backstage; x.out.scene = s;
  const c = put(x, 'withered', s, 0, 0, -3, 0); c.idle(x.t, 1);
  const a = mix(0.3, -0.6, eo(x.u)); cam(x, [Math.sin(a) * 1.6, 1.75, -3 + Math.cos(a) * 1.6], [0, 1.6, -3], 36); hand(x);
  lookAtCam(x, c, 0.7); x.S.backstageLamps.forEach((l, i) => l.intensity = 9 * flicker(x.t, i + 2));
});
// 44.69 "e é por esse motivo de o Golden Freddy clássico"
at(44.69, 'golden_void_close', x => {
  const s = x.S.void; x.out.scene = s; const c = put(x, 'golden', s, 0, 0, 0, -0.1);
  camMove(x, [0.4, 1.3, 1.1], [0, 1.0, 0], [0.18, 1.2, 0.75], [0, 1.0, 0], eo, 36); hand(x, 0.6);
  c.pelvis.rotation.x = 0.18; c.torso.rotation.x = 0.22; c.armR.piv.rotation.x = -0.35; c.armL.piv.rotation.x = -0.35; c.legR.piv.rotation.x = -0.5; c.legL.piv.rotation.x = -0.5;
  c.pelvis.position.y -= 0.35; x.S.voidSpot.color.set('#fff0c0');
});
// 47.54 "não ser considerado um animatronic real"
at(47.54, 'golden_ghostly', x => {
  const s = x.S.void; x.out.scene = s; const c = put(x, 'golden', s, 0, 0, 0, -0.1);
  cam(x, [0.15, 1.5, 1.0], [0, 1.1, 0], 38); hand(x, 0.5);
  c.pelvis.rotation.x = 0.18; c.torso.rotation.x = 0.22; c.armR.piv.rotation.x = -0.35; c.armL.piv.rotation.x = -0.35; c.legR.piv.rotation.x = -0.5; c.legL.piv.rotation.x = -0.5;
  c.pelvis.position.y -= 0.35;
  const flick = 0.4 + 0.6 * Math.max(0, Math.sin(x.t * 8));
  c.root.traverse(o => { if (o.isMesh) { o.material.transparent = true; o.material.opacity = flick; } });
  x.post.chroma.value = 0.25; x.S.voidFill.color.set('#6f90ff'); x.S.voidFill.intensity = 2.5;
});
// 49.57 "que ele não está na lista de Ultimate Custom Night."
at(49.57, 'finale_gap', x => {
  const s = x.S.backstage; x.out.scene = s; const L = x.L;
  camMove(x, [0.9, 1.85, 0.2], [0, 1.6, -2.6], [0.3, 1.78, 0.75], [0, 1.6, -2.6], eo, 38); hand(x);
  const c = put(x, 'withered', s, -1.1, 0, -3, 0.25); c.idle(x.t, 1, 0); lookAtCam(x, c, 0.6);
  const f = put(x, 'freddy', s, 1.1, 0, -3, -0.25); f.idle(x.t, 1, 1); lookAtCam(x, f, 0.6);
  c.eyeGlow.forEach(e => { e.visible = true; e.scale.setScalar(0.8); }); c.cavityLight.intensity = 0.3;
  sparkles(x, s, [0, 1.6, -3], 0.55, 6, 0.8 * sm(seg(L, 0.3, 0.7)));
  x.S.backstageLamps.forEach((l, i) => l.intensity = 7 * flicker(x.t, i));
  x.post.fade.value = sm(seg(L, x.d - 0.3, x.d));
});

export const SHOTS = shots;
export const DURATION = 52.608;
