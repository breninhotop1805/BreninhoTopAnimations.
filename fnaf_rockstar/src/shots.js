// POR QUE O ROCKSTAR FREDDY PEDE 5 MOEDAS NA UCN? — shot list. Times = real word timestamps (faster-whisper).
// Office: back wall z=-4 (desk at z≈-3.45), front desk z=1.7 (top y≈1.02, fan at x 0.15), front wall z=4. Rockstar stands at z≈-0.7.
// Stage6: stage top y=1, z=-4. Fire room: back wall z=-4.
import * as THREE from 'three';
import { gesture, startle, headShake, nod, wave, alive, walkPath, springE, gestW } from './act.js';
import { drawPanel } from './ucn.js';

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

const scene = (x, n, vig = 0.65) => { const s = x.S[n]; x.out.scene = s; x.post.vig.value = vig; return s; };
const office = (x, vig = 0.7) => scene(x, 'office', vig);
const hud = (x, txt, a0, v = 0.075) => { if (x.L < a0) return null; return { type: 'coins', txt, u: 0.3, v, k: back(seg(x.L, a0, a0 + 0.3)), a: Math.min(1, (x.L - a0) / 0.06) }; };
const ui = (x, ...it) => { const a = it.filter(Boolean); x.out.ui = a.length ? a : null; };
// Rockstar always holds the mic in his right hand (forearm forward) — the mic is kept ball-up in main.js
function rock(x, s, px, py, pz, ry = 0) { const r = put(x, 'rockstar', s, px, py, pz, ry); alive(r, x.t, 0.9); r.armR.piv.rotation.x += -0.95; r.armR.piv.rotation.z += 0.08; return r; }
const DESK_Y = 1.03, DESK_Z = 1.7;
function coinOnDesk(x, s, i, k = 1) { const c = x.FX['coin' + i]; s.add(c); c.position.set(-1.45 + i * 0.22, DESK_Y + 0.012, DESK_Z - 0.05 + (i % 2) * 0.06); c.rotation.set(Math.PI / 2, 0, i * 0.7); c.scale.setScalar(Math.max(0.001, back(k))); return c; }
// coin flight from the desk into the slot (k 0..1): arc over, turns edge-on, shrinks to fit the slot, slides INTO the gray slot
function coinToSlot(x, s, i, r, k) { const c = x.FX['coin' + i]; s.add(c); const a = new V3(-1.45 + i * 0.22, DESK_Y + 0.012, DESK_Z - 0.05); const sp = r.slotPt(); const fw = new V3(Math.sin(r.root.rotation.y), 0, Math.cos(r.root.rotation.y));
  const front = sp.clone().addScaledVector(fw, 0.18); const k1 = eio(seg(k, 0, 0.75)), k2 = eio(seg(k, 0.75, 1));
  const p = a.clone().lerp(front, k1); p.y += Math.sin(k1 * Math.PI) * 0.6; if (k2 > 0) p.copy(front).lerp(sp.clone().addScaledVector(fw, -0.07), k2); c.position.copy(p);
  c.rotation.set(mix(Math.PI / 2, 0, k1), r.root.rotation.y + Math.PI / 2 * k1, 0); c.scale.setScalar(mix(1, 0.5, k1)); c.visible = k < 1; return c; }
function fireAt(x, s, cx, cz, w, d, h = 3.0, I = 12) { const g = x.FX.fire; s.add(g); const t = x.t;
  g.userData.fl.forEach(m => { const q = m.userData; const k = (t * q.sp + q.ph) % 1; m.position.set(cx + (q.u - 0.5) * w + 0.12 * Math.sin(t * 3 + q.ph * 9), k * h, cz + (q.v - 0.5) * d); m.scale.setScalar(q.sz * (1 - k) * 1.6 + 0.02); m.rotation.set(t + q.ph, t * 0.7, 0); });
  g.userData.sm.forEach(m => { const q = m.userData; const k = (t * q.sp + q.ph) % 1; m.position.set(cx + (q.u - 0.5) * w, h * 0.6 + k * 2.5, cz + (q.v - 0.5) * d); m.scale.setScalar(0.3 + k * 1.0); });
  g.userData.lights.forEach((l, i) => { l.position.set(cx + (i ? 0.6 : -0.6) * w * 0.3, 1.4, cz + 1.6); l.intensity = I * (0.75 + 0.25 * Math.sin(t * 13 + i * 2) * Math.sin(t * 7.7 + i)); }); }
const WX = -0.95, WZ = 2.65;
const soulPos = i => new V3(-0.9 + (i - 2) * 0.62, DESK_Y + 0.15, DESK_Z + 0.1 - (i % 2) * 0.55); // William at the front desk (left of the fan)

const shots = []; const at = (t, name, fn) => shots.push({ t, name, fn });

// 0.00 "Por que o Rockstar Freddy" — POV over the front desk: the lamp flickers on, Rockstar steps in behind the fan; punch on "Freddy"
at(0.00, 'hook', x => {
  const s = office(x, 0.8); const L = x.L; const r = rock(x, s, 0, 0, -0.7); walkPath(r, L, -0.3, 0.7, [-1.8, -0.9], [0.1, -0.7], { stride: 0.85 }); if (L > 0.6) r.root.rotation.y = mix(r.root.rotation.y, 0, eo(seg(L, 0.6, 0.95))); lookCam(x, r, 0.4 + 0.4 * seg(L, 0.5, 0.9));
  const fl = L < 0.35 ? (Math.sin(L * 90) > 0 ? 1 : 0.1) : 1; x.S.officeKey.intensity = 46 * fl; x.S.officeWash.intensity = 45 * fl; x.S.lampBulb.visible = fl > 0.5;
  camMove(x, [-0.3, 1.75, 3.4], [0, 1.9, -1], [-0.2, 1.8, 2.8], [0, 2.1, -0.9], eo, 50); punch(x, 0.78, 0.14);
});
// 1.12 "pede 5 moedas" — he holds out his free hand, palm up; the coin counter "5" pops on "5"
at(1.12, 'pede', x => {
  const s = office(x); const L = x.L; const r = rock(x, s, 0, 0, -0.7); lookCam(x, r, 0.8); const w = Math.max(0, gestW(L, 0.1, 9)) * 0.9; r.armL.piv.rotation.x += -1.35 * w; r.armL.piv.rotation.z += -0.12 * w; r.head.rotation.z += 0.12 * w;
  const h = hp(r); const k = eo(x.u); cam(x, [h.x - mix(0.9, 0.6, k), h.y - 0.6, h.z + mix(3.4, 2.8, k)], [h.x, h.y - 0.75, h.z], 46); ui(x, hud(x, '5', 0.32));
});
// 2.18 "na Ultimate Custom Night?" — crane back: the whole UCN office
at(2.18, 'ucn', x => { const s = office(x); const L = x.L; const r = rock(x, s, 0, 0, -0.7); lookCam(x, r, 0.6); const k = eio(x.u); cam(x, [mix(-0.2, -0.6, k), mix(2.0, 2.6, k), mix(2.4, 3.8, k)], [0, 1.9, -2.5], 60); });
// 3.76 "Muita gente acha que isso é só uma" — he sways with the mic like a show
at(3.76, 'show', x => { const s = office(x); const L = x.L; const r = rock(x, s, 0, 0, -0.7); r.torso.rotation.z += 0.12 * Math.sin(x.t * 5); r.head.rotation.z += 0.15 * Math.sin(x.t * 5 + 0.6); lookCam(x, r, 0.6); wave(r, 'L', L, 0.2, 9, x.t);
  const k = eo(x.u); cam(x, [mix(1.4, 1.0, k), 1.9, mix(2.6, 2.1, k)], [0, 2.1, -0.7], 48); });
// 5.12 "piada boba do jogo" — close: he laughs
at(5.12, 'piada', x => { const s = office(x); const L = x.L; const r = rock(x, s, 0, 0, -0.7); lookCam(x, r, 0.7); r.head.rotation.x -= 0.2 * Math.abs(Math.sin(x.t * 9)) * seg(L, 0.1, 0.3); r.torso.rotation.x -= 0.06 * Math.abs(Math.sin(x.t * 9));
  const h = hp(r); cam(x, [h.x + 0.5, h.y - 0.2, h.z + 2.2 - 0.3 * eo(x.u)], [h.x, h.y - 0.25, h.z], 44); });
// 6.36 "mas essa mecânica esconde uma crítica pesada" — slow push onto the coin box: the star, the slot
at(6.36, 'mecanica', x => { const s = office(x, 0.8); const L = x.L; const r = rock(x, s, 0, 0, -0.7); const p = r.slotPt(); const k = eio(x.u); cam(x, [p.x + mix(0.5, 0.15, k), p.y + mix(0.6, 0.25, k), p.z + mix(2.2, 0.85, k)], [p.x, p.y + 0.12, p.z], 46); });
// 8.64 "e um recado macabro" — the lamp dims; his eyes go red on "macabro"
at(8.64, 'macabro', x => { const s = office(x, 1.0); const L = x.L; const r = rock(x, s, 0, 0, -0.7); r.eyeRed(eo(seg(L, 0.4, 0.6))); lookCam(x, r, 0.8); x.S.officeKey.intensity = 46 * (1 - 0.7 * seg(L, 0.2, 0.6)); x.S.officeWash.intensity = 45 * (1 - 0.7 * seg(L, 0.2, 0.6));
  const h = hp(r); cam(x, [h.x - 0.3, h.y - 0.3, h.z + 1.9 - 0.4 * eo(x.u)], [h.x, h.y - 0.2, h.z], 44); x.post.tint.value.set(1.05, 0.9, 0.9); punch(x, 0.54, 0.12); });
// 9.96 "Se você olhar bem para o peito dele no FNAF 6" — FNAF 6 stage; the camera tilts from his face down to the chest on "peito"
at(9.96, 'peito6', x => { const s = scene(x, 'stage6', 0.65); const L = x.L; const r = rock(x, s, 0, 1.0, -4.0); lookCam(x, r, 0.6); const h = hp(r); const p = r.slotPt(); const k = eio(seg(L, 0.9, 1.6));
  cam(x, [0.3, mix(h.y - 0.1, p.y + 0.2, k), mix(h.z + 3.6, p.z + 2.0, k)], [0, mix(h.y - 0.2, p.y + 0.15, k), -4.0], 46); });
// 12.48 "vai ver uma entrada de moedas bem no meio da carcaça" — extreme close: a coin slides INTO the gray slot under the star
at(12.48, 'entrada', x => { const s = scene(x, 'stage6', 0.75); const L = x.L; const r = rock(x, s, 0, 1.0, -4.0); r.root.updateMatrixWorld(true); const sp = r.slotPt();
  const c = x.FX.coin0; s.add(c); const k = eio(seg(L, 0.5, 0.96)); c.rotation.set(0, Math.PI / 2, 0); c.scale.setScalar(0.5); c.position.set(sp.x, sp.y + 0.35 * (1 - eio(seg(L, 0.2, 0.5))), sp.z + mix(0.25, -0.07, k)); c.visible = L < 1.1;
  cam(x, [sp.x + 0.35, sp.y + 0.12, sp.z + mix(1.0, 0.7, eo(x.u))], [sp.x, sp.y + 0.05, sp.z], 44); punch(x, 1.68, 0.12); });
// 15.28 "A Fazbear Entertainment chegou a um nível tão" — coins rain on the stage; he throws an arm up
at(15.28, 'chuva', x => { const s = scene(x, 'stage6', 0.65); const L = x.L; const r = rock(x, s, 0, 1.0, -4.0); lookCam(x, r, 0.6); wave(r, 'L', L, 0.2, 9, x.t); const R = x.FX.rain; s.add(R);
  R.children.forEach((c, i) => { const [a, b, d] = c.userData.p; const y = 6 - ((x.t * (1.4 + b) + d) % 1) * 6.5; c.position.set((a - 0.5) * 6, Math.max(1.05, y), -4 + (d - 0.5) * 3); c.rotation.set(x.t * 4 + i, x.t * 3 + i, 0); });
  camMove(x, [0, 2.6, 3.4], [0, 2.4, -4], [0, 2.4, 2.4], [0, 2.5, -4], eo, 52); });
// 16.92 "absurdo de ganância" — close: he rubs his hands (greedy), punch on "ganância"
at(16.92, 'ganancia', x => { const s = scene(x, 'stage6', 0.7); const L = x.L; const r = rock(x, s, 0, 1.0, -4.0); lookCam(x, r, 0.7); const w = Math.max(0, gestW(L, 0.1, 9)); r.armL.piv.rotation.x += -1.0 * w; r.armL.piv.rotation.z += -0.05 * w + 0.04 * Math.sin(x.t * 14) * w;
  const R = x.FX.rain; s.add(R); R.children.forEach((c, i) => { const [a, b, d] = c.userData.p; const y = 6 - ((x.t * (1.4 + b) + d) % 1) * 6.5; c.position.set((a - 0.5) * 6, Math.max(1.05, y), -4 + (d - 0.5) * 3); c.rotation.set(x.t * 4 + i, x.t * 3 + i, 0); });
  const h = hp(r); cam(x, [h.x - 0.4, h.y - 0.4, h.z + 2.4 - 0.4 * eo(x.u)], [h.x, h.y - 0.5, h.z], 46); punch(x, 1.08, 0.12); });
// 18.38 "transformou o mascote principal em um cofre ambulante" — he walks off the stage area toward us, the star gleaming on "cofre"
at(18.38, 'cofre', x => { const s = scene(x, 'stage6', 0.65); const L = x.L; const r = rock(x, s, 0, 0, 0); walkPath(r, L, -0.4, 3.2, [-0.6, -1.4], [0.4, 1.2], { stride: 0.85, linear: true }); r.armR.piv.rotation.x += -0.95; r.armR.piv.rotation.z += 0.08;
  r.star.material.emissiveIntensity = 0.35 + 1.4 * Math.max(0, 1 - Math.abs(L - 1.94) / 0.3); const h = hp(r); cam(x, [h.x + 1.6, 1.9, h.z + 3.0], [h.x, 1.8, h.z], 46); });
// 21.46 "Só que na Ultimate Custom Night essa programação" — back in the UCN office, the lamp swinging; Rockstar silhouette behind the fan
at(21.46, 'ucn2', x => { const s = office(x, 0.9); const L = x.L; const r = rock(x, s, 0, 0, -0.7); lookCam(x, r, 0.6); x.S.officeKey.position.x = 0.4 * Math.sin(x.t * 2); x.S.officeKey.intensity = 30;
  camMove(x, [-0.4, 1.7, 3.6], [0, 1.9, -1], [-0.3, 1.75, 3.1], [0, 2.0, -1], eo, 48); });
// 23.70 "ganha um sentido muito mais sombrio" — close: his eyes turn red on "sombrio"
at(23.70, 'sombrio', x => { const s = office(x, 1.0); const L = x.L; const r = rock(x, s, 0, 0, -0.7); lookCam(x, r, 0.85); r.eyeRed(eo(seg(L, 1.1, 1.3))); x.S.officeKey.intensity = 46 * (1 - 0.6 * seg(L, 1.0, 1.3)); x.S.officeWash.intensity = 45 * (1 - 0.6 * seg(L, 1.0, 1.3));
  const h = hp(r); cam(x, [h.x + 0.2, h.y - 0.25, h.z + mix(2.4, 1.7, eio(x.u))], [h.x, h.y - 0.2, h.z], 44); x.post.tint.value.set(1, 1 - 0.12 * seg(L, 1.0, 1.3), 1 - 0.12 * seg(L, 1.0, 1.3)); });
// 25.50 "Ali você não é um guarda comum" — William at the front desk, nervous, looking around
at(25.50, 'guarda', x => { const s = office(x); const L = x.L; const w = put(x, 'william', s, WX, 0, WZ, Math.PI); alive(w, x.t, 1); w.head.rotation.y = 0.5 * Math.sin(L * 3.2); w.setFace({ lid: 0.1, slope: -0.6 });
  const h = hp(w); cam(x, [h.x + 0.5, h.y + 0.1, h.z - mix(2.6, 2.2, eo(x.u))], [h.x, h.y - 0.1, h.z], 46); });
// 27.04 "mas sim o próprio William Afton" — punch-in on his face on "William"
at(27.04, 'afton', x => { const s = office(x); const L = x.L; const w = put(x, 'william', s, WX, 0, WZ, Math.PI); alive(w, x.t, 1); lookCam(x, w, 0.8); w.setFace({ lid: 0.25, slope: 1 }); gesture(w, 'evil', L, 0.7, 9, 0.6, { face: false });
  const h = hp(w); cam(x, [h.x - 0.3, h.y + 0.05, h.z - 2.1], [h.x, h.y - 0.05, h.z], 46); punch(x, 0.8, 0.16); });
// 28.44 "preso em um pesadelo eterno" — the room darkens and tilts, William cowers
at(28.44, 'pesadelo', x => { const s = office(x, 1.1); const L = x.L; const w = put(x, 'william', s, WX, 0, WZ, Math.PI); alive(w, x.t, 1); gesture(w, 'scared', L, 0.3, 9, 0.9, { face: false }); w.setFace({ lid: 0, slope: -1, mouth: 0.6 }); w.noBlink = true;
  x.S.officeKey.intensity = 20; x.S.officeWash.intensity = 15; const h = hp(w); cam(x, [h.x + 0.6, h.y + 0.2, h.z - 2.6], [h.x, h.y - 0.2, h.z], 50); x.camera.rotateZ(0.12 * sm(x.u)); x.post.chroma.value = 0.6 * x.u; });
// 30.26 "criado pela alma vingativa" — the golden spirit fades in behind the fan, floating
at(30.26, 'alma', x => { const s = office(x, 1.0); const L = x.L; const g = put(x, 'golden', s, 0, 0.25 + 0.06 * Math.sin(x.t * 2), -0.9); g.head.rotation.z = 0.25; g.ghostMat.opacity = 0.42 * sm(seg(L, 0, 0.5)); x.S.officeKey.intensity = 22;
  camMove(x, [-0.4, 1.7, 3.0], [0, 2.1, -0.9], [-0.3, 1.75, 2.5], [0, 2.2, -0.9], eo, 48); x.post.tint.value.set(1.05, 1.0, 0.85); });
// 31.58 "O espírito pegou essa função gananciosa do robô" — the spirit flies into Rockstar: shrinks into his chest with a trail; his eyes flash
at(31.58, 'possui', x => { const s = office(x, 0.95); const L = x.L; const r = rock(x, s, 0, 0, -0.7); lookCam(x, r, 0.5); const k = eio(seg(L, 0.3, 1.5)); x.S.officeKey.intensity = 26;
  if (k < 1) { const g = put(x, 'golden', s, mix(-1.5, 0, k), mix(0.6, 1.4, k), mix(-1.4, -0.65, k)); g.root.scale.setScalar(mix(1.35, 0.08, k)); g.ghostMat.opacity = 0.55 * (1 - sm(seg(k, 0.7, 1))); x.live.pop(); } // the spirit is meant to flow INTO him (not a collision)
  const P = x.FX.parts; s.add(P); P.userData.update(seg(L, 1.3, 2.0), r.slotPt()); r.eyeRed(Math.max(0, 1 - Math.abs(L - 1.55) / 0.25)); if (L > 1.45 && L < 1.6) x.post.flash.value = 0.04;
  camMove(x, [-0.6, 1.9, 3.0], [-0.2, 2.0, -0.7], [-0.45, 1.9, 2.6], [-0.1, 2.0, -0.7], eo, 50); });
// 33.70 "e transformou em tortura" — William's POV: Rockstar leans in, red eyes
at(33.70, 'tortura', x => { const s = office(x, 1.0); const L = x.L; const r = rock(x, s, 0.0, 0, mix(-0.7, -0.2, eo(x.u))); r.eyeRed(1); r.torso.rotation.x += 0.18 * eo(x.u); lookCam(x, r, 0.9); x.S.officeKey.intensity = 24;
  cam(x, [WX + 0.3, 1.75, WZ - 0.1], [0, 2.3, -0.4], 52); x.post.tint.value.set(1.08, 0.88, 0.88); hand(x, 1); punch(x, 1.0, 0.1); });
// 35.46 "O assassino é obrigado a pagar exatamente cinco" — five coins pop onto the desk one by one; the counter counts down on "5"
at(35.46, 'pagar', x => { const s = office(x); const L = x.L; const w = put(x, 'william', s, WX, 0, WZ, Math.PI); alive(w, x.t, 1); w.setFace({ lid: 0.3, slope: -0.8 }); lookAt(w, new V3(-1.0, 1.0, 1.7), 0.7);
  for (let i = 0; i < 5; i++) coinOnDesk(x, s, i, seg(L, 0.3 + i * 0.25, 0.55 + i * 0.25)); camMove(x, [-0.4, 1.55, -0.2], [-1.0, 1.35, 2.0], [-0.5, 1.5, 0.1], [-1.0, 1.35, 2.0], eo, 50);
  ui(x, L > 0.3 ? { type: 'coins', txt: String(Math.min(5, Math.floor((L - 0.3) / 0.25) + 1)), u: 0.3, v: 0.075, k: 1, a: 1 } : null); });
// 37.30 "moedas" — they fly from the desk, one after another, edge-on INTO the slot under the star
at(37.30, 'paga', x => { const s = office(x); const L = x.L; const r = rock(x, s, 0, 0, -0.7); lookAt(r, new V3(-1, 1.1, 1.7), 0.5);
  for (let i = 0; i < 5; i++) { const k = seg(L, i * 0.13, i * 0.13 + 0.55); if (k <= 0) coinOnDesk(x, s, i, 1); else coinToSlot(x, s, i, r, k); }
  const p = r.slotPt(); cam(x, [-1.8, 1.7, 2.4], [p.x - 0.4, p.y - 0.1, p.z + 0.8], 54); ui(x, { type: 'coins', txt: String(Math.max(0, 5 - Math.floor(L / 0.13 + 0.01) )), u: 0.3, v: 0.075, k: 1, a: 1 }); });
// 38.40 "para comprar mais alguns minutos de vida" — he nods, satisfied, and walks out through the right door; William breathes out
at(38.40, 'vida', x => { const s = office(x); const L = x.L; const r = rock(x, s, 0, 0, -0.7); nod(r, L, 0.1, 1, 0.15); walkPath(r, L, 0.5, 2.2, [0, -0.7], [3.4, -1.2], { stride: 0.85, linear: true }); r.armR.piv.rotation.x += -0.95; lookCam(x, r, 0.4 * (1 - seg(L, 0.5, 0.8)));
  camMove(x, [-0.6, 1.8, 3.2], [0.6, 1.8, -0.8], [-0.5, 1.8, 3.0], [1.6, 1.8, -1.0], eo, 52); });
// 40.42 "O mesmo número das cinco crianças originais" — the five coins on the desk glow and five souls rise out of them
at(40.42, 'almas', x => { const s = office(x, 0.95); const L = x.L; x.S.officeKey.intensity = 20; x.S.officeWash.intensity = 18;
  for (let i = 0; i < 5; i++) { const c = coinOnDesk(x, s, i, 1); const k = eio(seg(L, 0.75 + i * 0.12, 1.75 + i * 0.12)); if (k > 0) { const tp = soulPos(i); const sl = put(x, 'soul' + i, s, mix(c.position.x, tp.x, k), mix(c.position.y, tp.y, k), mix(c.position.z, tp.z, k), Math.PI + (i - 2) * 0.1);
      sl.root.scale.setScalar(mix(0.05, 0.74, k)); sl.ghostMat.opacity = 0.6 * sm(k); alive(sl, x.t, 0.6, i); } if (L > 0.7 + i * 0.12 && L < 1.2 + i * 0.12) { const P = x.FX.parts; s.add(P); P.userData.update(seg(L, 0.7 + i * 0.12, 1.2 + i * 0.12), c.position); } }
  camMove(x, [-0.9, 1.75, -1.6], [-0.9, 1.6, 1.6], [-0.9, 1.8, -1.2], [-0.9, 1.7, 1.6], eo, 56); x.post.tint.value.set(0.95, 0.98, 1.08); });
// 42.58 "que ele matou no passado" — the souls turn and stare at William
at(42.58, 'matou', x => { const s = office(x, 1.0); const L = x.L; x.S.officeKey.intensity = 18; const w = put(x, 'william', s, WX, 0, WZ, Math.PI); alive(w, x.t, 1); w.setFace({ lid: 0, slope: -1, mouth: 0.6 }); w.noBlink = true; startle(w, L, 0.2, 0.6);
  for (let i = 0; i < 5; i++) { const tp = soulPos(i); const sl = put(x, 'soul' + i, s, tp.x, tp.y + 0.04 * Math.sin(x.t * 2 + i), tp.z, Math.PI + (i - 2) * 0.1); sl.root.scale.setScalar(0.74); alive(sl, x.t, 0.6, i); lookAt(sl, hp(w), 0.8); }
  cam(x, [2.4, 2.1, -1.2], [-1.0, 1.55, 2.0], 54); x.post.tint.value.set(0.95, 0.98, 1.08); });
// 43.96 "E o único jeito de burlar essa cobrança" — over William's shoulder: the monitor with the system panel
at(43.96, 'burlar', x => { const s = office(x); const L = x.L; const w = put(x, 'william', s, WX, 0, WZ, Math.PI); alive(w, x.t, 1); const T = x.S.tablet; T.visible = true; T.position.set(WX, 1.55, WZ - 0.75); T.rotation.set(-0.12, 0, 0); drawPanel(x.S, 0, 60);
  lookAt(w, T.position, 0.8); const k = eo(x.u); cam(x, [WX + 1.0, 2.05, WZ + mix(1.0, 0.75, k)], [WX - 0.1, 1.5, WZ - 0.75], 50); });
// 45.76 "é ligando o aquecedor no máximo" — the screen fills the frame: Heater ON on "aquecedor", temperature climbs to 105° by "máximo"
at(45.76, 'aquecedor', x => { const s = office(x); const L = x.L; const T = x.S.tablet; T.visible = true; T.position.set(WX, 1.55, WZ - 0.75); T.rotation.set(-0.12, 0, 0); drawPanel(x.S, L > 0.48 ? 1 : 0, 60 + 45 * eio(seg(L, 0.5, 1.0)));
  const c = T.position; cam(x, [c.x, c.y + 0.12, c.z + mix(1.75, 1.6, eo(x.u))], [c.x, c.y, c.z], 44); x.post.tint.value.set(1 + 0.12 * seg(L, 0.5, 1.1), 1, 1 - 0.1 * seg(L, 0.5, 1.1)); });
// 47.00 "e usando o mesmo fogo que acabou com ele" — Springtrap in the fire (FNAF 6 ending); the flames burst up on "fogo"
at(47.00, 'fogo', x => { const s = scene(x, 'fireRoom', 0.9); const L = x.L; const sp = put(x, 'spring', s, 0, 0, -1.8, 0); alive(sp, x.t, 1); gesture(sp, 'agony', L, 0.7, 9, 0.9, { face: false }); lookCam(x, sp, 0.5);
  const k = sm(seg(L, 0.6, 0.95)); fireAt(x, s, 0, -2.6, 5.0, 1.6, 3.0 * (0.35 + 0.65 * k), 3 + 6 * k); x.FX.fire.userData.fl.forEach(m => { m.visible = Math.hypot(m.position.x, m.position.z + 1.8) > 0.75; }); x.FX.fire.userData.lights.forEach(l => l.position.z = -0.6); x.bloom.strength = 0.18;
  const h = hp(sp); cam(x, [h.x + 0.4, h.y - 0.4, h.z + mix(4.0, 3.2, eo(x.u))], [h.x, h.y - 0.6, h.z], 50); punch(x, 0.8, 0.1); });
// 49.32 "Você já tinha ligado esses pontos?" — the office is red-hot; Rockstar gives up and walks out; "?"
at(49.32, 'ligado', x => { const s = office(x, 0.85); const L = x.L; const r = rock(x, s, 0, 0, -0.7); walkPath(r, L, 0.6, 1.8, [0, -0.7], [-2.8, -1.2], { stride: 0.8 }); r.armR.piv.rotation.x += -0.95; r.head.rotation.x += 0.15; x.S.officeKey.color.set('#ff7a40');
  x.post.tint.value.set(1.15, 0.9, 0.8); bubble(x, 'q', s, r, 0.2); camMove(x, [-0.4, 1.8, 3.0], [-0.4, 1.9, -1], [-0.5, 1.8, 2.6], [-1.0, 1.9, -1], eo, 50); });
// 51.14 "Comenta aí e me segue pra mais mistérios" — Rockstar waves with his free arm, counter "5"
at(51.14, 'comenta', x => { const s = office(x); const L = x.L; x.S.officeKey.color.set('#ffcf8a'); const r = rock(x, s, 0, 0, -0.7); lookCam(x, r, 0.8); wave(r, 'L', L, 0.1, 9, x.t);
  camMove(x, [-0.4, 1.8, 2.8], [0, 2.0, -0.7], [-0.3, 1.85, 2.3], [0, 2.05, -0.7], eo, 50); ui(x, hud(x, '5', 0.3)); });

export const SHOTS = shots;
export const DURATION = 53.11;
