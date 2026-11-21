// O NIGHTMARE FOXY É O IRMÃO DO JOGADOR — shot list. Times = real word timestamps (faster-whisper).
// Bedroom coords: closet front z=-4.5 (opening x ±1.4, inside to z=-6.2), side doors at x=±4 (z 0.4..2.4), bed against z=+4.5.
import * as THREE from 'three';
import { gesture, startle, headShake, alive, walkPath, springE } from './act.js';

const V3 = THREE.Vector3;
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = x => { x = cl(x); return x * x * (3 - 2 * x); };
const eio = x => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eo = x => { x = cl(x); return 1 - Math.pow(1 - x, 3); };
const back = x => { x = cl(x); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const seg = (t, a, b) => cl((t - a) / (b - a));
const mix = (a, b, k) => a + (b - a) * k;
const mixv = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

function cam(x, p, l, fov) { x.camera.position.set(...p); x.camera.up.set(0, 1, 0); x.camera.lookAt(...l); if (fov) x.camera.fov = fov; }
function camMove(x, p0, l0, p1, l1, e = eio, fov = 42) { const k = e(x.u); cam(x, mixv(p0, p1, k), mixv(l0, l1, k), fov); }
function punch(x, at, amt = 0.18, dur = 0.25) { const k = eo(seg(x.L, at, at + dur)); if (k > 0) x.camera.fov *= 1 - amt * k; }
function hand(x, a = 1) { const t = x.t, c = x.camera; c.rotateX(a * 0.004 * (Math.sin(t * 1.9) + 0.5 * Math.sin(t * 3.7 + 1))); c.rotateY(a * 0.004 * (Math.sin(t * 1.4 + 2) + 0.5 * Math.sin(t * 3.1))); c.rotateZ(a * 0.003 * Math.sin(t * 1.1 + 4)); }
function shake(x, a) { const t = x.t, c = x.camera; c.rotateX(a * 0.03 * Math.sin(t * 61)); c.rotateY(a * 0.03 * Math.sin(t * 47 + 1)); c.rotateZ(a * 0.02 * Math.sin(t * 53 + 2)); }
function put(x, name, scene, px, py, pz, ry = 0) { const c = x.C[name]; scene.add(c.root); c.root.position.set(px, py, pz); c.root.rotation.set(0, ry, 0); c.root.scale.setScalar(c.baseScale); x.live.push(c); return c; }
function lookAt(c, P, w = 1) { c.root.updateMatrixWorld(true); const hp = c.neck.getWorldPosition(new V3()); const dx = P.x - hp.x, dz = P.z - hp.z, dy = P.y - (hp.y + 0.25 * c.root.scale.y);
  const yaw = wrap(Math.atan2(dx, dz) - c.root.rotation.y - c.torso.rotation.y); c.head.rotation.y = mix(c.head.rotation.y, cl(yaw, -1.1, 1.1), w); c.head.rotation.x = mix(c.head.rotation.x, cl(-Math.atan2(dy, Math.hypot(dx, dz)), -0.6, 0.6), w); }
const lookCam = (x, c, w = 1) => lookAt(c, x.camera.position, w);
const hp = c => { c.root.updateMatrixWorld(true); return c.head.localToWorld(new V3(0, 4 / 16, 0)); };
function bubble(x, which, scene, c, a0, s = 1) { const L = x.L; if (L < a0) return; const b = x.FX[which]; scene.add(b); const k = back(seg(L, a0, a0 + 0.3)); const h = hp(c); const r = new V3().setFromMatrixColumn(x.camera.matrixWorld, 0);
  b.position.copy(h).addScaledVector(r, 0.35).add(new V3(0, 0.42 + 0.03 * Math.sin((L - a0) * 6), 0)); b.scale.setScalar(Math.max(0.001, s * k)); b.quaternion.copy(x.camera.quaternion); }
// aim an arm (pivot) at a world point
function aimArm(c, A, P, w = 1) { c.root.updateMatrixWorld(true); const sh = A.piv.getWorldPosition(new V3()); const d = P.clone().sub(sh); const q = new THREE.Quaternion(); A.piv.parent.getWorldQuaternion(q); d.applyQuaternion(q.invert()).normalize();
  const cz = Math.asin(cl(d.x, -1, 1)), ax = Math.atan2(-d.z, -d.y); A.piv.rotation.x = mix(A.piv.rotation.x, ax, w); A.piv.rotation.z = mix(A.piv.rotation.z, cz, w); }

const bedroom = x => { const s = x.S.bedroom; x.out.scene = s; return s; };
const hallS = (x, side) => { const s = x.S['hall' + side]; x.out.scene = s; return s; };
// the player's flashlight (POV shots): held just below/right of the eye
function povFlash(x, target, I = 34, ang = 0.32) { I *= 0.3; const f = x.out.scene === x.S.bedroom ? x.S.flash : x.S['hallFlash' + (x.out.scene === x.S.hallL ? 'L' : 'R')]; const c = x.camera; c.updateMatrixWorld(true);
  const r = new V3().setFromMatrixColumn(c.matrixWorld, 0), u = new V3().setFromMatrixColumn(c.matrixWorld, 1); f.position.copy(c.position).addScaledVector(r, 0.22).addScaledVector(u, -0.25); f.target.position.copy(target); f.intensity = I; f.angle = ang; return f; }
function spot(x, p, tg, I, ang) { I *= 0.3; const f = x.S.flash; f.position.set(...p); f.target.position.copy(tg instanceof V3 ? tg : new V3(...tg)); f.intensity = I; f.angle = ang; }
// the child's torch: in his right hand, beam along the arm
function torch(x, c, P, on = 1, armW = 1) { aimArm(c, c.armR, P, armW); const T = x.FX.torch; c.handR.add(T); T.position.set(0, -0.6 / 16, 0.0); T.rotation.set(Math.PI / 2, 0, 0); T.scale.setScalar(1 / c.root.scale.x);
  c.root.updateMatrixWorld(true); const lens = T.userData.lens.getWorldPosition(new V3()); const f = x.S.flash; const dir = lens.clone().sub(c.handR.getWorldPosition(new V3())).normalize();
  f.position.copy(lens).addScaledVector(dir, 0.05); f.target.position.copy(lens).addScaledVector(dir, 6); f.intensity = 9 * on; f.angle = 0.3; T.userData.lens.material.color.set(on > 0.5 ? '#fff8e0' : '#3a3a3a'); return f; }
function nfIn(x, s, z = -5.35, ry = 0) { const n = put(x, 'nfoxy', s, 0, 0, z, ry); alive(n, x.t, 0.8); n.jawOpen(0.15 + 0.05 * Math.sin(x.t * 1.3)); return n; }
function eyes(c, k) { if (c.eyeMesh) c.eyeMesh.traverse(o => { if (o.isMesh) o.material.emissiveIntensity = 0.05 + 1.3 * k; }); }
// soft moonlight from the right doorway onto a character (the room's only ambient source)
// the yellow lamp on the short dresser (by the closet) lights a face that looks toward the closet
function lampOn(x, I = 30) { x.S.lamp.intensity = I * 0.6; x.S.lamp.color.set('#ffd8b0'); }
function moonOn(x, c, I = 5) { I = 85 + I * 2; x.S.moon.color.set('#a8b4e0'); x.S.moon.target.position.copy(hp(c)); x.S.moon.intensity = I; }
function sitPose(c) { c.legR.piv.rotation.set(-Math.PI / 2, 0, 0.08); c.legL.piv.rotation.set(-Math.PI / 2, 0, -0.08); c.armR.piv.rotation.x = -0.6; c.armL.piv.rotation.x = -0.6; }
function hugKnees(c) { sitPose(c); c.armR.piv.rotation.set(-1.35, 0, 0.22); c.armL.piv.rotation.set(-1.35, 0, -0.22); }
const game = (x, o) => { x.out.ui = [Object.assign({ type: 'game', L: x.L }, o)]; x.post.vig.value = 0; x.post.grain.value = 0.015; };
// mask held/raised/worn: P = where the mask's pivot (the head pivot) is, in world space
function maskAt(x, m, s, P) { const M = m.mask; M.removeFromParent(); s.add(M); M.position.copy(P); M.rotation.set(0, m.root.rotation.y, 0); M.scale.setScalar(m.root.scale.x);
  const c = P.clone().add(new V3(0, 0.27, 0)); for (const [A, sx] of [[m.armR, -1], [m.armL, 1]]) aimArm(m, A, c.clone().add(new V3(sx * 0.46, 0, 0)), 1); }
// the Nightmare as a small plush (same 3D model at plush scale): sitting on the floor, lights off; w 0..1
function plushSit(n, w = 1) { n.legR.piv.rotation.x = -1.45 * w; n.legL.piv.rotation.x = -1.45 * w; n.legR.piv.rotation.z = 0.1 * w; n.legL.piv.rotation.z = -0.1 * w; n.pelvis.position.y -= 10 / 16 * w; n.armR.piv.rotation.x = -0.5 * w; n.armL.piv.rotation.x = -0.5 * w; n.armR.piv.rotation.z = -0.15 * w; n.armL.piv.rotation.z = 0.15 * w; }
// the torch lying on the quilt next to the child (prop resting on the bed, not held)
function bedTorch(x, s) { const T = x.FX.torch; s.add(T); T.position.set(0.75, x.S.bedTop + 0.07, 2.35); T.rotation.set(0, -0.6, 0); T.userData.lens.material.color.set('#3a3a3a'); return T.position.clone(); }
const bedY = (x, c) => x.S.bedTop + (2 - 12) / 16 * c.baseScale + 0.01;

const shots = []; const at = (t, name, fn) => shots.push({ t, name, fn });

// 0.00 "Existe um motivo perturbador" — FRAME 0 = Nightmare Foxy's face in the closet gap, already in the beam; fast push-in; on "perturbador" the jaw SNAPS open (shake + chroma)
at(0.00, 'abre', x => { const s = bedroom(x); const L = x.L; x.S.setCloset(0.62); const n = nfIn(x, s, -5.2); eyes(n, 0.4 + 0.6 * eo(seg(L, 0.05, 0.25)));
  n.jawOpen(0.15 + 0.85 * eo(seg(L, 0.76, 0.92)) * (1 - 0.25 * sm(seg(L, 1.1, 1.5)))); n.head.rotation.z += 0.12 * eo(seg(L, 0.3, 0.7)); lookCam(x, n, 0.8);
  const h = hp(n); const k = eo(x.u); cam(x, [h.x + mix(0.4, 0.15, k), h.y - mix(0.3, 0.2, k), h.z + mix(3.4, 2.3, k)], [h.x, h.y - 0.25, h.z], 46);
  povFlash(x, h, 14, 0.35); punch(x, 0.76, 0.16); if (L > 0.76 && L < 1.2) shake(x, 0.35 * (1 - seg(L, 0.76, 1.2))); x.post.chroma.value = 1.2 * Math.max(0, 1 - Math.abs(L - 0.82) / 0.2); x.post.vig.value = 0.85; });
// 1.50 "pelo qual o Nightmare Foxy" — the bi-fold doors fold open, he steps out into the beam; jaw drops on "Foxy"
at(1.50, 'reveal', x => {
  const s = bedroom(x); const L = x.L; x.S.setCloset(mix(0.62, 1, eo(seg(L, 0.4, 0.62)))); const n = put(x, 'nfoxy', s, 0, 0, -5.35); walkPath(n, L, 0.4, 1.0, [0, -5.35], [0, -4.25], { stride: 0.8 }); alive(n, x.t, 0.6);
  n.jawOpen(eo(seg(L, 0.92, 1.12)) * (1 + 0.15 * springE(seg(L, 1.12, 1.3)))); lookCam(x, n, 0.6 + 0.3 * seg(L, 0.8, 1.0)); eyes(n, 1);
  const k = eo(x.u); cam(x, [mix(0.5, 0.25, k), mix(1.2, 1.3, k), mix(0.2, -1.2, k)], [0, mix(2.0, 2.35, k), -4.6], 50); povFlash(x, new V3(0, 2.2, -4.4), 30); punch(x, 0.94, 0.14); if (L > 0.94 && L < 1.2) shake(x, 0.25);
});
// 2.86 "é o único monstro que se esconde dentro do armário" — he backs into the closet, hunching, and the doors fold shut on "armário"
at(2.86, 'esconde', x => {
  const s = bedroom(x); const L = x.L; const n = put(x, 'nfoxy', s, 0, 0, -4.25); walkPath(n, L, 0.2, 1.0, [0, -4.25], [0, -5.55], { stride: 0.6, face: false }); alive(n, x.t, 0.6); eyes(n, 1); n.jawOpen(0.3 * (1 - seg(L, 0.8, 1.2)));
  n.torso.rotation.x += 0.1 * eo(seg(L, 0.4, 1.0)); lookCam(x, n, 0.7); x.S.setCloset(mix(1, 0.3, eio(seg(L, 1.25, 1.75))));
  camMove(x, [-1.6, 1.4, -1.2], [0, 1.9, -4.8], [-1.0, 1.6, -1.6], [0, 1.9, -5.0], eo, 46); povFlash(x, new V3(0, 1.9, -4.8), 26); punch(x, 1.7, 0.08);
});
// 4.84 "em FNAF 4" — the FNAF 4 bedroom: the child hugging his knees on the bed, staring at the closet where two eyes glow
at(4.84, 'fnaf4', x => { const s = bedroom(x); const L = x.L; x.S.setCloset(0.32); const n = nfIn(x, s); eyes(n, 1); const c = put(x, 'cchild', s, 0.2, 0, 2.6, Math.PI + 0.15); c.root.position.y = bedY(x, c); hugKnees(c); lookAt(c, new V3(0, 2, -4.5), 0.7); c.setFace({ lid: 0.1, slope: -0.8 }); c.root.position.x += 0.004 * Math.sin(x.t * 30); moonOn(x, c, 4); lampOn(x);
  const h = hp(c); const k = eio(x.u); cam(x, [mix(1.6, 1.1, k), mix(3.0, 2.6, k), mix(-1.4, -0.6, k)], [h.x, h.y - 0.35, h.z], 54); });
// 5.92 "Repara bem na diferença de comportamento" — the crying child in the middle of the room, torch sweeping left... right
at(5.92, 'repara', x => {
  const s = bedroom(x); const L = x.L; const c = put(x, 'cchild', s, 0, 0, 0.6, Math.PI); alive(c, x.t, 1);
  const tgt = new V3(-2.2 + 4.4 * eio(seg(L, 0.1, 1.6)), 1.4, -2.6); c.root.rotation.y = Math.PI - 0.2 * (tgt.x / 2.2); torch(x, c, tgt); lookAt(c, tgt, 0.8); c.setFace({ lid: 0.1, slope: -0.6 }); moonOn(x, c); lampOn(x);
  const h = hp(c); const k = eo(x.u); const ry = c.root.rotation.y, d = mix(2.4, 1.8, k); cam(x, [h.x + Math.sin(ry) * d + 0.3 * Math.cos(ry), h.y + 0.1, h.z + Math.cos(ry) * d - 0.3 * Math.sin(ry)], [h.x, h.y - 0.25, h.z], 46); bubble(x, 'q', s, c, 1.2);
});
// 7.72 "entre os animatrônicos durante a noite" — the four Nightmares lined up down the dark hallway, camera backs away
at(7.72, 'noite', x => {
  const s = hallS(x, 'L'); const L = x.L; const order = [['nfreddy', -3.2, 0.4], ['nbonnie', -5.2, -0.4], ['nchica', -7.2, 0.4], ['nfoxy', -9.2, -0.4]];
  order.forEach(([nm, z, px], i) => { const c = put(x, nm, s, px, 0, z, 0); alive(c, x.t, 0.7, i); lookCam(x, c, 0.5); c.jawOpen(0.15); eyes(c, seg(L, 0.35 + i * 0.12, 0.45 + i * 0.12)); });
  const k = eio(x.u); cam(x, [mix(0.0, 0.2, k), mix(1.9, 2.2, k), mix(0.6, 1.6, k)], [0, 2.0, -6], 50); povFlash(x, new V3(0, 1.8, -5), 22, 0.3);
});
// 9.80 "Enquanto o Bonnie" — left hall: Nightmare Bonnie walking toward the door; the beam catches him on "Bonnie"
at(9.80, 'bonnie', x => {
  const s = hallS(x, 'L'); const L = x.L; const c = put(x, 'nbonnie', s, 0, 0, -7); walkPath(c, L, -0.4, 1.04, [0.1, -7.5], [0.1, -4.6], { stride: 0.85, linear: true }); lookCam(x, c, 0.6); c.jawOpen(0.25); eyes(c, 1);
  camMove(x, [0.3, 1.7, 1.4], [0, 2.1, -6], [0.2, 1.75, 0.9], [0, 2.3, -5], eo, 46); povFlash(x, new V3(0, 2.0, -5.5), L > 0.36 ? 30 : 0); hand(x);
});
// 10.84 "a Chica" — right hall, Chica close, beak-jaw snapping
at(10.84, 'chica', x => {
  const s = hallS(x, 'R'); const L = x.L; const c = put(x, 'nchica', s, -0.1, 0, -3.6, 0.1); alive(c, x.t, 1); lookCam(x, c, 0.8); c.jawOpen(0.3 + 0.5 * Math.max(0, Math.sin(L * 18))); eyes(c, 1);
  camMove(x, [0.2, 1.8, 0.9], [-0.1, 2.4, -3.6], [0.1, 1.85, 0.6], [-0.1, 2.45, -3.6], eo, 44); povFlash(x, new V3(0, 2.3, -3.6), 30); punch(x, 0.0, 0.1);
});
// 11.30 "e o Freddy vêm" — Nightmare Freddy lumbering out of the dark
at(11.30, 'freddy', x => {
  const s = hallS(x, 'R'); const L = x.L; const c = put(x, 'nfreddy', s, 0, 0, -6); walkPath(c, L, -0.5, 0.72, [0, -6.4], [0, -4.4], { stride: 0.8, linear: true }); lookCam(x, c, 0.6); c.jawOpen(0.3); eyes(c, 1);
  camMove(x, [-0.3, 1.5, 1.0], [0, 2.3, -5], [-0.2, 1.6, 0.6], [0, 2.4, -4.6], eo, 46); povFlash(x, new V3(0, 2.2, -5), 30); hand(x);
});
// 12.02 "pelos corredores" — low tracking shot down the right hallway: Chica in front, Freddy behind, both marching toward the room
at(12.02, 'corredores', x => { const s = hallS(x, 'R'); const L = x.L; const c = put(x, 'nchica', s, -0.2, 0, -6); walkPath(c, L, -0.6, 1.2, [-0.25, -6.6], [-0.25, -4.6], { stride: 0.8, linear: true }); c.jawOpen(0.25); eyes(c, 1);
  const f = put(x, 'nfreddy', s, 0.45, 0, -8); walkPath(f, L, -0.9, 1.4, [0.45, -9.2], [0.45, -7.2], { stride: 0.8, linear: true }); f.jawOpen(0.2); eyes(f, 1);
  camMove(x, [-0.8, 0.75, -1.4], [0.1, 2.0, -6.5], [-0.75, 0.8, -1.9], [0.1, 2.1, -6.0], eo, 52); povFlash(x, new V3(0, 1.8, -5.5), 22, 0.45); });
// 12.70 "tentando invadir o quarto" — the child's POV at the left door: Nightmare Bonnie reaches the doorway and leans in on "quarto"; the torch shakes
at(12.70, 'invadir', x => { const s = bedroom(x); const L = x.L; const b = put(x, 'nbonnie', s, -5.2, 0, 1.4, Math.PI / 2); walkPath(b, L, -0.4, 0.75, [-6.2, 1.4], [-4.75, 1.4], { stride: 0.7, face: false }); b.root.rotation.y = Math.PI / 2; alive(b, x.t, 0.6);
  b.torso.rotation.x += 0.2 * eo(seg(L, 0.7, 1.0)); b.jawOpen(0.2 + 0.7 * eo(seg(L, 0.8, 0.95))); eyes(b, 1); lookCam(x, b, 0.8);
  cam(x, [-1.6, 1.1, 1.5], [-4.6, 1.95, 1.35], 52); hand(x, 1.4); povFlash(x, new V3(-4.6, 1.9, 1.4), 26, 0.35); punch(x, 0.84, 0.12); if (L > 0.84 && L < 1.2) shake(x, 0.25); });
// 14.06 "Foxy já tá lá dentro" — slow push into the closet slit; his eyes light up on "dentro"
at(14.06, 'dentro', x => {
  const s = bedroom(x); const L = x.L; x.S.setCloset(0.38); const n = nfIn(x, s); eyes(n, eo(seg(L, 0.8, 0.95)));
  camMove(x, [0.1, 2.1, -0.4], [0, 2.2, -5], [0.02, 2.25, -3.1], [0, 2.35, -5], eio, 44); povFlash(x, new V3(0, 1.6, -4.4), 18, 0.4); x.post.vig.value = 0.85;
});
// 15.50 "Trancado no escuro" — inside the closet with him: hunched, breathing, head turning slowly; light leaks through the louvers
at(15.50, 'trancado', x => {
  const s = bedroom(x); const L = x.L; x.S.setCloset(0.26); const n = nfIn(x, s, -5.7); eyes(n, 1); n.torso.rotation.x = 0.06; n.head.rotation.y = mix(-0.3, 0.1, eio(x.u));
  camMove(x, [-0.7, 2.2, -2.6], [0, 2.4, -5.3], [-0.45, 2.3, -3.2], [0, 2.4, -5.3], eo, 40);
  spot(x, [0.4, 1.3, -1.2], [0, 2, -5.4], 12, 0.2); x.post.vig.value = 0.9;
});
// 16.54 "só esperando você baixar a guarda" — from inside the closet, through the slit: the child lowers his torch on "baixar", eyes heavy
at(16.54, 'guarda', x => {
  const s = bedroom(x); const L = x.L; x.S.setCloset(0.42); const c = put(x, 'cchild', s, 0.2, 0, 0.6, Math.PI); alive(c, x.t, 1); const low = eio(seg(L, 0.8, 1.3));
  torch(x, c, new V3(0.1, mix(1.6, 0.0, low), mix(-4.4, -1.2, low))); lookAt(c, new V3(0, mix(1.8, 0.2, low), -4.4), 0.7); c.setFace({ lid: 0.45 * low, slope: -0.3 }); c.noBlink = low > 0.3;
  moonOn(x, c, 6); lampOn(x); const h = hp(c); const k = eo(x.u); cam(x, [h.x - mix(0.8, 0.6, k), h.y - 0.1, h.z - mix(2.2, 1.6, k)], [h.x, h.y - 0.35, h.z], 46);
});
// 18.20 "pra abrir a fresta da porta" — close on the louvers: the panel creaks open on "fresta"; the eye and the hook in the gap
at(18.20, 'fresta', x => {
  const s = bedroom(x); const L = x.L; x.S.setCloset(mix(0.3, 0.62, eio(seg(L, 0.5, 1.1)))); const n = nfIn(x, s, -5.6); eyes(n, 1); n.head.rotation.y = 0.15;
  camMove(x, [0.5, 2.0, -2.2], [0, 2.1, -4.6], [0.35, 2.1, -2.6], [0, 2.2, -4.6], eo, 44); povFlash(x, new V3(0, 1.8, -4.5), 14, 0.5); x.post.vig.value = 0.85;
});
// 19.46 "e pular na sua cara" — JUMPSCARE on "pular": doors burst open, he lunges at the camera, jaw wide
at(19.46, 'pular', x => {
  const s = bedroom(x); const L = x.L; const k = eo(seg(L, 0.14, 0.42)); x.S.setCloset(mix(0.62, 1, eo(seg(L, 0.1, 0.25)))); const n = put(x, 'nfoxy', s, 0, mix(0, 0.15, k), mix(-5.0, -1.25, k)); eyes(n, 1);
  n.jawOpen(eo(seg(L, 0.14, 0.3))); for (const [A, sx] of [[n.armR, -1], [n.armL, 1]]) { A.piv.rotation.x = -1.9 * k; A.piv.rotation.z = sx * 0.35 * k; } n.torso.rotation.x = 0.25 * k; n.head.rotation.x = -0.15 * k + 0.05 * Math.sin(x.t * 40) * k;
  cam(x, [0, 1.85, 0.6], [0, 2.1, -3], 56); povFlash(x, new V3(0, 2.2, -2), 36, 0.42); if (L > 0.14) shake(x, 0.5 * (1 - seg(L, 0.5, 1.2)));
  x.post.chroma.value = 1.5 * seg(L, 0.14, 0.3) * (1 - seg(L, 0.6, 1.2)); x.post.tint.value.set(1 + 0.2 * k * (1 - seg(L, 0.6, 1.2)), 1, 1); x.post.fade.value = sm(seg(L, 0.95, 1.24));
});
// 20.70 "E tem outro detalhe bizarro" — calm again: the child sits on his bed, his torch lying beside him, staring at the closet; his head tilts, "?" on "bizarro"
at(20.70, 'detalhe', x => { const s = bedroom(x); const L = x.L; x.S.setCloset(0.35); const n = nfIn(x, s); eyes(n, 0.6); const c = put(x, 'cchild', s, 0.2, 0, 2.6, Math.PI); c.root.position.y = bedY(x, c); sitPose(c); c.armR.piv.rotation.x = -0.35; c.armL.piv.rotation.x = -0.35;
  bedTorch(x, s); lookAt(c, new V3(0, 1.8, -4.5), 0.8); c.head.rotation.z += 0.25 * eio(seg(L, 0.6, 1.0)); c.setFace({ lid: 0.15, slope: 0.4 }); moonOn(x, c, 5); lampOn(x);
  bubble(x, 'q', s, c, 0.8); x.post.fade.value = 1 - sm(seg(L, 0, 0.2)); const h = hp(c); const k = eo(x.u); cam(x, [h.x - mix(1.3, 1.0, k), h.y + 0.05, h.z - mix(2.0, 1.5, k)], [h.x, h.y - 0.25, h.z], 46); });
// 22.04 "que quase ninguém conecta" — the camera CONNECTS the two clues: from the torch lying on the bed it races across the room to the closet gap
at(22.04, 'conecta', x => { const s = bedroom(x); const L = x.L; x.S.setCloset(0.4); const n = nfIn(x, s); eyes(n, 1); const c = put(x, 'cchild', s, 0.2, 0, 2.6, Math.PI); c.root.position.y = bedY(x, c); sitPose(c); c.armR.piv.rotation.x = -0.35; c.armL.piv.rotation.x = -0.35; lookAt(c, new V3(0, 1.8, -4.5), 0.8); moonOn(x, c, 5); lampOn(x);
  const tp = bedTorch(x, s); const cp = new V3(0, 2.3, -4.8); const k = eio(seg(L, 0.45, 1.05)); const look = tp.clone().lerp(cp, k);
  cam(x, [mix(tp.x + 0.5, -0.3, k), mix(tp.y + 0.35, 2.05, k), mix(tp.z - 0.7, -2.0, k)], [look.x, look.y, look.z], mix(40, 46, k)); x.post.blur.value = 0.7 * Math.sin(k * Math.PI); povFlash(x, cp, 14 * k, 0.4); punch(x, 1.15, 0.1); });
// 23.48 "Se você apontar a lanterna na hora certa" — over his shoulder: the torch snaps up on "apontar", beam on the closet
at(23.48, 'apontar', x => {
  const s = bedroom(x); const L = x.L; x.S.setCloset(0.42); const n = nfIn(x, s); eyes(n, 1); const c = put(x, 'cchild', s, 0.5, 0, 0.0, Math.PI); alive(c, x.t, 1); const up = springE(seg(L, 0.32, 0.62));
  torch(x, c, new V3(0, mix(0.2, 2.0, up), mix(-1.5, -4.5, up)), L > 0.32 ? 1 : 0.0); lookAt(c, new V3(0, 2, -4.5), 0.8);
  const h = hp(c); camMove(x, [2.1, 1.2, -0.5], [h.x, h.y - 0.3, h.z - 0.3], [1.85, 1.2, -0.35], [h.x, h.y - 0.25, h.z - 0.3], eo, 50); moonOn(x, c, -20); lampOn(x);
});
// 25.38 "pra dentro do armário" — the beam pours into the closet: he flinches from the light
at(25.38, 'luz', x => {
  const s = bedroom(x); const L = x.L; x.S.setCloset(0.55); const n = nfIn(x, s, -5.3); eyes(n, 1); const fl = springE(seg(L, 0.3, 0.6)); n.head.rotation.y = 0.35 * fl; n.head.rotation.x = 0.15 * fl; n.torso.rotation.y = 0.2 * fl; aimArm(n, n.armL, new V3(0.9, 2.8, -4.0), eo(seg(L, 0.3, 0.6)) * 0.7);
  camMove(x, [-0.5, 1.6, -3.0], [0, 2.2, -5.3], [-0.35, 1.7, -3.4], [0, 2.3, -5.3], eo, 48); spot(x, [0.5, 1.4, 0.0], [0, 2.1, -5.3], 34, 0.18);
});
// 26.46 "aquele monstro gigante" — low angle: he towers, jaw wide
at(26.46, 'gigante', x => {
  const s = bedroom(x); const L = x.L; x.S.setCloset(0.9); const n = nfIn(x, s, -4.9); eyes(n, 1); n.jawOpen(0.4 + 0.5 * eo(seg(L, 0.2, 0.5))); n.head.rotation.x = 0.25; aimArm(n, n.armR, new V3(-0.2, 2.4, -2.6), 0.5);
  camMove(x, [0.6, 0.35, -2.2], [0, 2.4, -4.9], [0.45, 0.3, -2.5], [0, 2.6, -4.9], eo, 56); spot(x, [0.4, 1.2, -0.6], [0, 2.3, -4.9], 30, 0.25);
});
// 27.54 "simplesmente encolhe" — the SAME model shrinks down to plush size in a puff, sitting down on the closet floor as it lands
at(27.54, 'encolhe', x => { const s = bedroom(x); const L = x.L; x.S.setCloset(0.9); const k = eio(seg(L, 0.4, 1.15)); const n = put(x, 'nfoxy', s, 0, 0, -4.9); n.root.scale.setScalar(mix(1.35, 0.3, k)); eyes(n, 1 - 0.85 * k); n.jawOpen(0.6 * (1 - k)); n.root.rotation.y = 0.5 * Math.sin(k * Math.PI);
  plushSit(n, sm(seg(L, 0.85, 1.2))); const P = x.FX.parts; s.add(P); P.userData.update(seg(L, 0.45, 1.25), new V3(0, mix(1.6, 0.35, k), -4.8));
  camMove(x, [0.3, 1.5, -2.2], [0, 1.9, -4.9], [0.2, 0.9, -3.1], [0, 0.45, -4.9], eio, 50); spot(x, [0.3, 1.2, -0.4], [0, 1.0, -4.9], 30, 0.28); });
// 28.82 "e vira uma pelúcia inofensiva" — just a Foxy plush on the closet floor, in the beam
at(28.82, 'pelucia', x => {
  const s = bedroom(x); const L = x.L; x.S.setCloset(0.9); const p = put(x, 'pfoxy', s, 0, 0, -4.9); plushSit(p); eyes(p, 0.15); p.jawOpen(0); p.head.rotation.z = 0.15 * eio(seg(L, 0.3, 0.9)); p.head.rotation.x = 0.1;
  const P = x.FX.parts; s.add(P); P.userData.update(0.5 + seg(L, 0, 0.6) * 0.5, new V3(0, 0.35, -4.8));
  const h = hp(p); const k = eo(x.u); cam(x, [h.x + mix(0.5, 0.25, k), h.y + 0.05, h.z + mix(1.4, 0.9, k)], [h.x, h.y - 0.12, h.z], 40); spot(x, [0.3, 1.2, -1.2], [0, 0.3, -4.9], 26, 0.25);
});
// 30.46 "Mas por que ele é o único que funciona assim?" — the child, close: "?" and a shrug on "assim"
at(30.46, 'porque', x => {
  const s = bedroom(x); const L = x.L; const c = put(x, 'cchild', s, 0.3, 0, -1.5, Math.PI + 0.25); alive(c, x.t, 1); lookAt(c, new V3(0, 0.3, -4.9), mix(0.8, 0, seg(L, 0.6, 1.0))); spot(x, [0.6, 1.0, -1.6], new V3(0, 0.3, -4.9), 18, 0.3); if (L > 0.8) lookCam(x, c, eo(seg(L, 0.8, 1.2)) * 0.8);
  gesture(c, 'shrug', L, 1.7, 9, 0.9, { face: false }); c.setFace({ lid: 0.15, slope: -0.5 }); moonOn(x, c, 6); lampOn(x, 40);
  const h = hp(c); const k = eo(x.u); cam(x, [h.x - mix(1.1, 0.7, k), h.y, h.z - mix(2.0, 1.5, k)], [h.x, h.y - 0.3, h.z], 46); bubble(x, 'q', s, c, 0.5);
});
// 32.84 "A resposta está escondida" — into the darkness of the closet; static creeps in
at(32.84, 'resposta', x => {
  const s = bedroom(x); const L = x.L; x.S.setCloset(0.9); const p = put(x, 'pfoxy', s, 0, 0, -4.9); plushSit(p); eyes(p, 0.15); p.jawOpen(0); const k = eio(x.u);
  cam(x, [0, mix(0.7, 0.55, k), mix(-3.0, -4.3, k)], [0, 0.5, -5.2], 46); spot(x, [0.3, 1.2, -1.2], [0, 0.3, -4.9], 26 * (1 - k * 0.8), 0.25);
  x.post.glitch.value = 0.6 * seg(L, 0.9, 1.4); x.post.chroma.value = 1.5 * seg(L, 0.8, 1.4);
});
// 34.24 "nos minigames do próprio jogo" — the 8-bit living room (TV, sofa with Fredbear, rug), static clearing
at(34.24, 'mg_room', x => { game(x, { scene: 'room', walk: 1, stat: 0.5 * (1 - seg(x.L, 0, 0.35)) }); });
// 35.94 "Se você lembrar bem" — the crying child walking up the gray hallway
at(35.94, 'mg_hall', x => { game(x, { scene: 'hall' }); });
// 37.06 "o irmão mais velho" — the older brother, in the Foxy mask, peeks over the TV
at(37.06, 'mg_bro', x => { game(x, { scene: 'room', peek: eo(seg(x.L, 0.0, 0.35)) }); });
// 37.68 "atormentava a criança chorando" — he jumps out, the child cries
at(37.68, 'mg_scare', x => { const L = x.L; game(x, { scene: 'roomScare', jump: eo(seg(L, 0.0, 0.3)), cry: L > 0.84 ? 1 : 0 }); });
// 39.20 "o dia inteiro fazendo" — again, in the hallway
at(39.20, 'mg_again', x => { const L = x.L; game(x, { scene: 'hallScare', jump: eo(seg(L, 0.1, 0.35)), cry: L > 0.35 ? 1 : 0 }); });
// 39.86 "fazendo exatamente" — the Nightmare does it: bursting out of the closet, arms up, jaw wide (the minigame's pose)
at(39.86, 'mesma', x => {
  const s = bedroom(x); const L = x.L; x.S.setCloset(1); const k = eo(seg(L, 0.05, 0.35)); const n = put(x, 'nfoxy', s, 0, 0, mix(-5.0, -3.6, k)); eyes(n, 1); n.jawOpen(k);
  for (const [A, sx] of [[n.armR, -1], [n.armL, 1]]) { A.piv.rotation.x = -2.55 * k; A.piv.rotation.z = sx * 0.5 * k; } n.head.rotation.x = -0.1 * k; lookCam(x, n, 0.5);
  cam(x, [mix(0.45, 0.3, eo(x.u)), 1.55, mix(-0.6, -0.9, eo(x.u))], [0, 1.8, -3.7], 54); punch(x, 0.28, 0.12); spot(x, [1.0, 1.4, -0.4], new V3(0, 1.8, -3.6), 30, 0.4); if (L > 0.1 && L < 0.5) shake(x, 0.2);
});
// 41.06 "a mesma coisa" — MATCH CUT: same spot, same pose, same light: it's the older brother in the Foxy mask
at(41.06, 'mesma2', x => {
  const s = bedroom(x); const L = x.L; x.S.setCloset(1); const m = put(x, 'michael', s, 0, 0, -3.6); alive(m, x.t, 0.6); const k = 1 - 0.15 * Math.sin(Math.min(1, L / 0.3) * Math.PI);
  for (const [A, sx] of [[m.armR, -1], [m.armL, 1]]) { A.piv.rotation.x = -2.55 * k; A.piv.rotation.z = sx * 0.5 * k; } m.pelvis.position.y += 0.03 * Math.abs(Math.sin(x.t * 8));
  cam(x, [mix(0.3, 0.2, eo(x.u)), 1.55, mix(-0.9, -1.1, eo(x.u))], [0, 1.6, -3.7], 54); spot(x, [1.0, 1.4, -0.4], new V3(0, 1.5, -3.6), 30, 0.4);
  const gl = Math.max(0, 1 - L / 0.12); x.post.glitch.value = 0.6 * gl; x.post.chroma.value = 1.5 * gl;
});
// 42.04 "Ele colocava uma máscara do Foxy" — the older brother in the hallway lifts the Foxy mask and pulls it over his head on "máscara"
at(42.04, 'pemask', x => {
  const s = hallS(x, 'L'); const L = x.L; const m = put(x, 'michael', s, 0, 0, -2.4, 0); alive(m, x.t, 0.8); const k1 = eio(seg(L, 0.4, 0.84)), k2 = eio(seg(L, 0.84, 1.3));
  m.root.updateMatrixWorld(true); const head = m.head.getWorldPosition(new V3()); const chest = head.clone().add(new V3(0, -0.85, 0.5)); const above = head.clone().add(new V3(0, 0.62, 0.02));
  if (k2 < 1) maskAt(x, m, s, k2 > 0 ? above.clone().lerp(head, k2) : chest.clone().lerp(above, k1));
  lookAt(m, chest, k1 > 0 ? 0 : 0.5); m.setFace({ lid: 0.1, slope: 0.6 });
  const k = eo(x.u); cam(x, [mix(0.7, 0.5, k), 1.6, mix(0.6, 0.0, k)], [0, 1.65, -2.4], 48); povFlash(x, new V3(0, 1.6, -2.4), 18, 0.4);
});
// 43.86 "se escondia no escuro do quarto" — masked, he waits inside the closet, the doors ajar: the same picture as the Nightmare
at(43.86, 'escondia', x => {
  const s = bedroom(x); const L = x.L; x.S.setCloset(0.45); const m = put(x, 'michael', s, 0, 0, -5.3, 0); alive(m, x.t, 0.6); m.torso.rotation.x = 0.12; lookCam(x, m, 0.4);
  camMove(x, [0.1, 1.9, -0.6], [0, 1.6, -5], [0.05, 1.75, -2.2], [0, 1.7, -5], eio, 44); povFlash(x, new V3(0, 1.4, -4.4), 14, 0.45); x.post.vig.value = 0.85;
});
// 45.02 "e pulava gritando" — he bursts out with his arms up; the child jumps back
at(45.02, 'pulava', x => {
  const s = bedroom(x); const L = x.L; x.S.setCloset(mix(0.45, 1, eo(seg(L, 0.1, 0.25)))); const k = eo(seg(L, 0.18, 0.45)); const m = put(x, 'michael', s, 0, 0, mix(-5.3, -3.1, k)); alive(m, x.t, 0.6);
  for (const [A, sx] of [[m.armR, -1], [m.armL, 1]]) { A.piv.rotation.x = -0.3 * k; A.piv.rotation.z = sx * 2.5 * k; } m.torso.rotation.x = -0.1 * k;
  lookCam(x, m, 0.7); cam(x, [0.35, 1.12, -0.6], [0, 1.6, -3.6], 54); hand(x, 1.5); if (L > 0.2 && L < 0.7) shake(x, 0.3 * (1 - seg(L, 0.2, 0.7))); povFlash(x, new V3(0, 1.6, -3.4), 22, 0.4); punch(x, 0.46, 0.12);
});
// 46.08 "só pra assustar a criança" — the child, close, crying; behind him the brother doubles over laughing
at(46.08, 'assustar', x => {
  const s = bedroom(x); const L = x.L; const c = put(x, 'cchild', s, 0.5, 0, -0.6, 0.15); alive(c, x.t, 1); gesture(c, 'cower', L, 0.1, 9, 0.9, { face: false }); c.setFace({ lid: 0.5, slope: -1, mouth: 1 }); c.noBlink = true; c.root.position.x += 0.01 * Math.sin(x.t * 50);
  const m = put(x, 'michael', s, -0.7, 0, -3.2, 0.25); alive(m, x.t, 1); gesture(m, 'laugh', L, 0.2, 9, 1, { face: false }); m.torso.rotation.x += 0.15 * Math.max(0, Math.sin(x.t * 14)) * seg(L, 0.2, 0.4);
  const h = hp(c); const k = eo(x.u); cam(x, [h.x + mix(0.4, 0.3, k), h.y - 0.1, h.z + mix(1.9, 1.4, k)], [h.x - 0.2, h.y - 0.2, h.z - 1], 46); spot(x, [1.2, 0.5, 1.4], [0, 1, -1.8], 20, 0.55);
});
// 47.68 "Ou seja, o Nightmare Foxy" — back to the nightmare: in the closet doorway, his eyes flare on "Foxy"
at(47.68, 'ouseja', x => {
  const s = bedroom(x); const L = x.L; x.S.setCloset(1); const n = put(x, 'nfoxy', s, 0, 0, -4.6); alive(n, x.t, 0.8); eyes(n, L < 0.68 ? 0.2 : 1); n.jawOpen(0.2 + 0.5 * eo(seg(L, 0.7, 0.9))); lookCam(x, n, 0.7);
  camMove(x, [0.6, 1.5, -1.0], [0, 2.3, -4.6], [0.4, 1.6, -1.6], [0, 2.4, -4.6], eo, 46); povFlash(x, new V3(0, 2.1, -4.6), 28); punch(x, 0.7, 0.12);
});
// 49.16 "não é um monstro aleatório" — a 'random' roulette: Freddy, Bonnie, Chica flash by in the closet doorway... and it always stops on Foxy
at(49.16, 'aleatorio', x => { const s = bedroom(x); const L = x.L; x.S.setCloset(1); const seq = ['nfreddy', 'nbonnie', 'nchica']; const i = Math.floor(L / 0.22); const nm = i < 3 ? seq[i] : 'nfoxy'; const c = put(x, nm, s, 0, 0, -4.6); alive(c, x.t, 0.8); eyes(c, 1);
  c.jawOpen(nm === 'nfoxy' ? 0.2 + 0.6 * eo(seg(L, 0.7, 0.85)) : 0.3); lookCam(x, c, 0.8);
  const h = hp(c); const k = eo(x.u); cam(x, [h.x + 0.3, h.y - 0.4, h.z + mix(2.7, 2.1, k)], [h.x, h.y - 0.35, h.z], 46); povFlash(x, h, 22, 0.4);
  const b = i < 3 ? Math.max(0, 1 - ((L % 0.22) / 0.08)) : Math.max(0, 1 - (L - 0.66) / 0.1); x.post.glitch.value = 0.5 * b; x.post.chroma.value = 1.2 * b; if (i >= 3) punch(x, 0.66, 0.14); });
// 50.34 "ele é o trauma real do garoto" — the child cowers, crying, shaking; behind him the Nightmare's eyes burn in the closet
at(50.34, 'trauma', x => { const s = bedroom(x); const L = x.L; x.S.setCloset(0.45); const n = nfIn(x, s); eyes(n, 1); const c = put(x, 'cchild', s, 0.35, 0, -0.6, 0.15); alive(c, x.t, 1); gesture(c, 'cower', L, 0.05, 9, 0.9, { face: false });
  c.setFace({ lid: 0.5, slope: -1, mouth: 0.6 }); c.noBlink = true; c.root.position.x += 0.008 * Math.sin(x.t * 40); moonOn(x, c, -30);
  const h = hp(c); const k = eo(x.u); cam(x, [h.x + 0.25, h.y + 0.05, h.z + mix(2.0, 1.55, k)], [h.x - 0.15, h.y - 0.1, h.z - 1.0], 48); spot(x, [1.0, 1.0, 1.5], h, 2.5, 0.4); punch(x, 0.32, 0.1); });
// 51.64 "ganhando vida no pesadelo" — the plush on the closet floor comes to life: eyes ignite, it GROWS back into the giant Nightmare and stands up (callback)
at(51.64, 'vida', x => { const s = bedroom(x); const L = x.L; x.S.setCloset(1); const k = eio(seg(L, 0.2, 1.0)); const n = put(x, 'nfoxy', s, 0, 0, -4.9); n.root.scale.setScalar(mix(0.3, 1.35, k)); plushSit(n, 1 - sm(seg(L, 0.1, 0.45)));
  eyes(n, eo(seg(L, 0.05, 0.2))); n.jawOpen(0.2 + 0.6 * eo(seg(L, 1.0, 1.15))); lookCam(x, n, 0.7 * k); const P = x.FX.parts; s.add(P); P.userData.update(seg(L, 0.15, 0.95), new V3(0, mix(0.4, 1.6, k), -4.8));
  camMove(x, [0.25, 0.75, -3.1], [0, 0.5, -4.9], [0.3, 1.2, -1.5], [0, 2.3, -4.8], eio, 52); spot(x, [-1, 0.6, 0.4], [0, 1.4, -4.7], 22, 0.4); x.post.glitch.value = 0.25 * Math.max(0, Math.sin(L * 9)) * seg(L, 0.4, 0.8); punch(x, 1.0, 0.1); });
// 53.12 "Na mente dele" — extreme close on the child's face: eyes shut tight, then open wide
at(53.12, 'mente', x => {
  const s = bedroom(x); const L = x.L; const c = put(x, 'cchild', s, 0.0, 0, 2.6, Math.PI); c.root.position.y = bedY(x, c); hugKnees(c);
  c.head.rotation.x = mix(0.3, 0.0, eo(seg(L, 0.5, 0.8))); c.setFace({ lid: L < 0.55 ? 1 : 0, slope: -1 }); c.noBlink = true;
  const h = hp(c); const k = eo(x.u); cam(x, [h.x + 0.2, h.y + 0.1, h.z - mix(1.5, 1.15, k)], [h.x, h.y - 0.05, h.z], 38); moonOn(x, c, 5); spot(x, [0.8, 1.2, 0.6], h, 6, 0.4);
});
// 54.10 "o verdadeiro terror daquela casa" — the empty hallway; the lights flicker on "terror"
at(54.10, 'terror', x => {
  const s = hallS(x, 'L'); const L = x.L; const fl = L > 0.42 && L < 0.8 ? (Math.sin(L * 70) > 0 ? 0.15 : 1) : 1; x.S.hallLightsL.forEach(l => l.intensity = 2.2 * fl);
  camMove(x, [0.2, 1.7, 0.8], [0, 1.6, -9], [0.0, 1.6, -1.2], [0, 1.7, -9], eio, 50);
});
// 55.46 "nunca foi um robô assassino" — the Nightmare in the hallway; glitch on "robô"
at(55.46, 'robo', x => {
  const s = hallS(x, 'L'); x.S.hallLightsL.forEach(l => l.intensity = 2.2); const L = x.L; const n = put(x, 'nfoxy', s, 0, 0, -4.2); alive(n, x.t, 0.8); eyes(n, 1); n.jawOpen(0.35); lookCam(x, n, 0.7); headShake(n, L, 0.1, 2, 0.15);
  camMove(x, [0.4, 1.7, 0.2], [0, 2.4, -4.2], [0.25, 1.8, -0.6], [0, 2.45, -4.2], eo, 46); povFlash(x, new V3(0, 2.2, -4.2), 26);
  const gl = seg(L, 0.62, 0.7) * (1 - seg(L, 0.95, 1.2)); x.post.glitch.value = 0.8 * gl; x.post.chroma.value = 1.2 * gl;
});
// 56.94 "mas o próprio irmão" — glitch: the Nightmare becomes the brother in the Foxy mask, same spot
at(56.94, 'irmao', x => {
  const s = hallS(x, 'L'); x.S.hallLightsL.forEach(l => l.intensity = 2.2); const L = x.L; const sw = L > 0.4; const gl = Math.max(0, 1 - Math.abs(L - 0.4) / 0.14);
  if (!sw) { const n = put(x, 'nfoxy', s, 0, 0, -3.6); alive(n, x.t, 0.8); eyes(n, 1); n.jawOpen(0.35); lookCam(x, n, 0.7); }
  else { const m = put(x, 'michael', s, 0, 0, -3.6); alive(m, x.t, 0.8); lookCam(x, m, 0.7); }
  camMove(x, [0.2, 1.65, -0.4], [0, 2.0, -3.6], [0.15, 1.6, -1.0], [0, 1.8, -3.6], eo, 46); povFlash(x, new V3(0, 1.9, -3.6), 26);
  x.post.glitch.value = 1.2 * gl; x.post.chroma.value = 2 * gl; x.post.flash.value = 0.05 * gl;
});
// 57.82 "escondido atrás daquela máscara" — he slowly lifts the mask off: it was his brother all along
at(57.82, 'tiramask', x => {
  const s = hallS(x, 'L'); x.S.hallLightsL.forEach(l => l.intensity = 2.2); const L = x.L; const m = put(x, 'michael', s, 0, 0, -3.6); alive(m, x.t, 0.6); const k = eio(seg(L, 0.7, 1.12)), k2 = eio(seg(L, 1.12, 1.6));
  m.root.updateMatrixWorld(true); const head = m.head.getWorldPosition(new V3()); const above = head.clone().add(new V3(0, 0.62, 0.02)); const chest = head.clone().add(new V3(0, -0.85, 0.5));
  if (k > 0) maskAt(x, m, s, k2 > 0 ? above.clone().lerp(chest, k2) : head.clone().lerp(above, k));
  lookCam(x, m, k2 > 0.3 ? 0.8 : 0.5); m.setFace({ lid: 0.3, slope: 1, mouth: k2 > 0.6 ? 0.6 : 0 }); m.noBlink = true;
  const h = hp(m); const kk = eo(x.u); cam(x, [h.x + 0.2, h.y - 0.1, h.z + mix(2.3, 1.7, kk)], [h.x, h.y - 0.2, h.z], 44); povFlash(x, h, 18, 0.4);
});

export const SHOTS = shots;
export const DURATION = 59.64;
