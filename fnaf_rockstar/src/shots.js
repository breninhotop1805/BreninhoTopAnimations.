// POR QUE O ROCKSTAR FREDDY PEDE 5 MOEDAS NA UCN? — shot list. Times = real word timestamps (faster-whisper).
// Office: back wall z=-4 (desk at z≈-3.45), front desk z=1.7 (top y≈1.02, fan at x 0.15), front wall z=4. Rockstar stands at z≈-0.7.
// Stage6: stage top y=1, z=-4. Fire room: back wall z=-4.
import * as THREE from 'three';
import { gesture, startle, headShake, nod, wave, laugh, alive, walkPath, springE, gestW } from './act.js';
import { drawPanel, officeCode } from './ucn.js';

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
function rock(x, s, px, py, pz, ry = 0) { const r = put(x, 'rockstar', s, px, py, pz, ry); alive(r, x.t, 0.9); r.armR.piv.rotation.x += -1.3; r.armR.piv.rotation.z += 0.1; return r; }
// ---- Rockstar acting kit ----
function sing(r, w, t) { w = cl(w); r.armR.piv.rotation.x += -0.6 * w; r.armR.piv.rotation.z += 0.04 * w; r.head.rotation.x += -0.12 * w + 0.05 * Math.sin(t * 8) * w; r.torso.rotation.z += 0.07 * Math.sin(t * 4) * w; }
function palmOut(r, L, a, amt = 1) { const w = Math.max(0, gestW(L, a, 9)) * amt; r.armL.piv.rotation.x += -1.35 * w; r.armL.piv.rotation.z += -0.1 * w; r.head.rotation.z += 0.16 * w; r.torso.rotation.x += 0.06 * w; return w; }
function tapFoot(r, t, w) { r.legL.piv.rotation.x += -0.22 * Math.max(0, Math.sin(t * 11)) * w; }
function cheer(r, L, a) { const w = Math.max(0, gestW(L, a, 9)); r.armL.piv.rotation.z += 2.5 * w; r.armL.piv.rotation.x += -0.25 * w; sing(r, w, 0); r.head.rotation.x += -0.15 * w; return w; }
function fanSelf(r, t, w) { r.armL.piv.rotation.x += -1.55 * w; r.armL.piv.rotation.z += (0.55 + 0.3 * Math.sin(t * 16)) * w * w * w * -1; r.head.rotation.x += -0.1 * w; r.torso.rotation.x += -0.05 * w; }
function bounceWalk(r, t, w) { r.torso.rotation.z += 0.06 * Math.sin(t * 7) * w; r.head.rotation.z += 0.08 * Math.sin(t * 7 + 0.5) * w; }
const DESK_Y = 1.03, DESK_Z = 1.7;
const coinX = i => -1.25 + i * 0.3;
function coinOnDesk(x, s, i, k = 1) { const c = x.FX['coin' + i]; s.add(c); c.position.set(coinX(i), DESK_Y + 0.012, DESK_Z - 0.05); c.rotation.set(Math.PI / 2, 0, i * 0.7); c.scale.setScalar(Math.max(0.001, back(k))); return c; }
// coin flight from the desk into the slot (k 0..1): arc over, turns edge-on, shrinks to fit the slot, slides INTO the gray slot
function coinToSlot(x, s, i, r, k) { const c = x.FX['coin' + i]; s.add(c); const a = new V3(coinX(i), DESK_Y + 0.012, DESK_Z - 0.05); const sp = r.slotPt(); const fw = new V3(Math.sin(r.root.rotation.y), 0, Math.cos(r.root.rotation.y));
  const front = sp.clone().addScaledVector(fw, 0.18); const k1 = eio(seg(k, 0, 0.75)), k2 = eio(seg(k, 0.75, 1));
  const p = a.clone().lerp(front, k1); p.y += Math.sin(k1 * Math.PI) * 0.6; if (k2 > 0) p.copy(front).lerp(sp.clone().addScaledVector(fw, -0.07), k2); c.position.copy(p);
  c.rotation.set(mix(Math.PI / 2, 0, k1), r.root.rotation.y + Math.PI / 2 * k1, 0); c.scale.setScalar(mix(1, 0.5, k1)); c.visible = k < 1; return c; }
function fireAt(x, s, cx, cz, w, d, h = 3.0, I = 12) { const g = x.FX.fire; s.add(g); const t = x.t;
  g.userData.fl.forEach(m => { const q = m.userData; const k = (t * q.sp + q.ph) % 1; m.position.set(cx + (q.u - 0.5) * w + 0.12 * Math.sin(t * 3 + q.ph * 9), k * h, cz + (q.v - 0.5) * d); m.scale.setScalar(q.sz * (1 - k) * 1.6 + 0.02); m.rotation.set(t + q.ph, t * 0.7, 0); });
  g.userData.sm.forEach(m => { const q = m.userData; const k = (t * q.sp + q.ph) % 1; m.position.set(cx + (q.u - 0.5) * w, h * 0.6 + k * 2.5, cz + (q.v - 0.5) * d); m.scale.setScalar(0.3 + k * 1.0); });
  g.userData.lights.forEach((l, i) => { l.position.set(cx + (i ? 0.6 : -0.6) * w * 0.3, 1.4, cz + 1.6); l.intensity = I * (0.75 + 0.25 * Math.sin(t * 13 + i * 2) * Math.sin(t * 7.7 + i)); }); }
const WX = -0.95, WZ = 2.65;
const ring5 = (c, R, i, a0 = 0) => { const a = a0 + i / 5 * Math.PI * 2; return new V3(c.x + Math.sin(a) * R, 0, c.z + Math.cos(a) * R); }; // William at the front desk (left of the fan)

const stage6 = x => scene(x, 'stage6', 0.65);
const corp = x => scene(x, 'corp', 0.7);
function voidS(x, vig = 0.8) { const s = scene(x, 'void', vig); x.S.voidDust(x.t); return s; }
function nightmare(x, c) { const s = scene(x, 'nightmare', 0.9); x.S.updateNightmare(x.t, c || new V3(0, 0, 0)); return s; }
function rainCoins(x, s, cx, cz, w, d, rate = 1, top = 5.5) { const R = x.FX.rain; s.add(R); R.children.forEach((c, i) => { const [a, b, e] = c.userData.p; const k = ((x.t * (0.9 + b) * rate + e) % 1); c.position.set(cx + (a - 0.5) * w, top - k * (top - 0.1), cz + (e - 0.5) * d); c.rotation.set(x.t * 5 + i, x.t * 3 + i * 2, 0); }); }
const kid = (x, s, i, px, pz, ry) => { const k = put(x, 'kid' + i, s, px, 0, pz, ry); alive(k, x.t, 1, i * 1.3); return k; };
const starPos = r => { r.root.updateMatrixWorld(true); return r.star.getWorldPosition(new V3()).add(new V3(0, 0.05, 0)); };
// sitting slumped on the floor (Golden Freddy's iconic pose); lift 0..1 raises the head
function sitSlump(c, lift) { c.pelvis.position.y -= 10 / 16; c.legR.piv.rotation.x += -1.45; c.legL.piv.rotation.x += -1.45; c.legR.piv.rotation.z += 0.12; c.legL.piv.rotation.z -= 0.12;
  c.torso.rotation.x += 0.28 * (1 - 0.6 * lift); c.head.rotation.x += 0.55 * (1 - lift); c.head.rotation.z += 0.32 * (1 - lift); c.armR.piv.rotation.x += -0.25; c.armL.piv.rotation.x += -0.25; c.armR.piv.rotation.z += -0.12; c.armL.piv.rotation.z += 0.12; }

const shots = []; const at = (t, name, fn) => shots.push({ t, name, fn });

// ================= 1. HOOK =================
// 0.00 "Por que o Rockstar Freddy" — frame 0 = Rockstar himself, mid-spin on the FNAF 6 stage under the spotlight; on "Freddy" he thrusts the mic at us (punch-in)
at(0.00, 'abre', x => { const s = stage6(x); const L = x.L; const r = rock(x, s, 0, 1.0, -4.0); r.root.rotation.y = -0.85 * (1 - springE(seg(L, 0.0, 0.55))); sing(r, 1, x.t); tapFoot(r, x.t, 0.6);
  const th = eo(seg(L, 0.66, 0.86)) * (1 - sm(seg(L, 0.95, 1.12))); r.armR.piv.rotation.x += -0.3 * th; r.torso.rotation.x += 0.08 * th; lookCam(x, r, 0.55 * sm(seg(L, 0.1, 0.6)));
  x.S.stageKey.intensity = 80 + 90 * (1 - eo(seg(L, 0, 0.25))); x.bloom.strength = 0.35 + 0.3 * (1 - eo(seg(L, 0, 0.3)));
  const h = hp(r); const k = eo(x.u); cam(x, [h.x + mix(1.0, 0.35, k), h.y - mix(0.55, 0.35, k), h.z + mix(3.0, 2.3, k)], [h.x, h.y - 0.3, h.z], 46); punch(x, 0.78, 0.15); });
// 1.12 "pede 5 moedas" — UCN office, the guard's view over the desk: he holds out his palm (asks), and on "5 moedas" five Faz-Coins rain onto the desk
at(1.12, 'pede', x => { const s = office(x); const L = x.L; const r = rock(x, s, 0, 0, -0.7); palmOut(r, L, 0.0); lookCam(x, r, 0.7);
  for (let i = 0; i < 5; i++) { const k = seg(L, 0.32 + i * 0.07, 0.32 + i * 0.07 + 0.35); const c = coinOnDesk(x, s, i, 1); const b = Math.abs(Math.cos(k * Math.PI * 2.5)) * (1 - k) * (1 - k); c.position.y = DESK_Y + 0.012 + (k <= 0 ? 3 : b * 0.7); c.rotation.z += (1 - k) * 6; c.visible = k > 0; }
  const k = eo(x.u); cam(x, [mix(0.55, 0.3, k), mix(1.6, 1.65, k), mix(3.4, 3.0, k)], [0, mix(1.75, 1.6, k), 0], 50); ui(x, hud(x, '5', 0.6)); });
// 2.18 "na Ultimate Custom Night?" — establishing travelling across the UCN office (fan, CRTs, ducts): he turns to us, foot tapping
at(2.18, 'ucn', x => { const s = office(x); const L = x.L; const r = rock(x, s, 0, 0, -0.7); sing(r, 0.6, x.t); tapFoot(r, x.t, 0.8); lookCam(x, r, 0.6 * sm(seg(L, 0.3, 0.9)));
  const k = eio(x.u); cam(x, [mix(-2.2, 0.6, k), mix(1.8, 1.85, k), mix(2.4, 3.3, k)], [mix(-0.6, 0.0, k), mix(1.6, 1.85, k), mix(-0.8, -0.9, k)], 58); });
// ================= 2. "people think it's a silly joke" =================
// 3.76 "Muita gente acha que isso é" — the audience of the FNAF 6 pizzeria (seen from the stage): three kids laugh and point at him
at(3.76, 'gente', x => { const s = stage6(x); const L = x.L; x.S.stageSpill.intensity = 14; x.S.stageSpill.position.set(0.2, 2.6, -0.9); const T = new V3(0.2, 2.6, -3.6);
  const k0 = kid(x, s, 0, -0.4, -0.1, Math.PI + 0.12), k1 = kid(x, s, 1, 0.2, 0.55, Math.PI), k2 = kid(x, s, 2, 0.8, -0.05, Math.PI - 0.12);
  gesture(k0, 'pointL', L, 0.15, 9, 0.9); lookAt(k0, T, 0.7); laugh(k1, L, 0.05, 9, x.t); gesture(k2, 'point', L, 0.4, 9, 0.9); lookAt(k2, T, 0.6);
  for (const k of [k0, k2]) { k.setFace({ mouth: 0.6 + 0.4 * Math.abs(Math.sin(x.t * 14)), lid: 0.3, slope: -0.5 }); k.noBlink = true; k.pelvis.position.y += 0.012 * Math.abs(Math.sin(x.t * 14)); }
  const k = eio(x.u); cam(x, [mix(0.45, 0.25, k), 1.32, mix(-2.55, -2.3, k)], [0.2, 1.02, 0.2], 62); });
// 5.12 "só uma piada boba do jogo" — he answers the laughter with a goofy shrug and laughs along; punch on "piada"
at(5.12, 'piada', x => { const s = stage6(x); const L = x.L; const r = rock(x, s, 0, 1.0, -4.0); lookCam(x, r, 0.7);
  const w = Math.max(0, gestW(L, 0.05, 0.75, 0.3, 0.25)); r.armL.piv.rotation.x += -0.35 * w; r.armL.piv.rotation.z += 0.8 * w; r.head.rotation.z += 0.22 * w; r.pelvis.position.y += 0.03 * w;
  const lw = sm(seg(L, 0.6, 0.85)); r.head.rotation.x -= (0.22 + 0.12 * Math.abs(Math.sin(x.t * 12))) * lw; r.torso.rotation.x -= 0.07 * Math.abs(Math.sin(x.t * 12)) * lw; r.armL.piv.rotation.x += -0.6 * lw; r.armL.piv.rotation.z += 0.3 * lw; r.pelvis.position.y += 0.02 * Math.abs(Math.sin(x.t * 12)) * lw;
  const h = hp(r); cam(x, [h.x + 0.55, h.y - 0.6, h.z + mix(3.1, 2.5, eo(x.u))], [h.x, h.y - 0.3, h.z], 46); punch(x, 0.0, 0.1); punch(x, 0.26, 0.08); });
// ================= 3. the hidden criticism =================
// 6.36 "mas essa mecânica esconde" — office: the camera cranes from his face down to the coin box; on "esconde" his hand covers it
at(6.36, 'esconde', x => { const s = office(x, 0.85); const L = x.L; const r = rock(x, s, 0, 0, -0.7); x.S.officeKey.intensity = 34; lookCam(x, r, 0.4); r.star.material.emissiveIntensity = 0.35 + 1.0 * Math.max(0, 1 - Math.abs(L - 0.55) / 0.3);
  const cw = Math.max(0, gestW(L, 0.82, 9, 0.35)); r.armL.piv.rotation.x += -0.95 * cw; r.armL.piv.rotation.z += -0.42 * cw; r.head.rotation.x += 0.15 * cw;
  const h = hp(r), p = starPos(r); const k = eio(seg(L, 0.0, 0.85)); cam(x, [0.4, mix(h.y - 0.1, p.y + 0.15, k), mix(h.z + 1.9, p.z + 1.25, k)], [0, mix(h.y - 0.15, p.y - 0.05, k), -0.7], 44); });
// 7.74 "uma crítica pesada" — macro on the slot: a coin falls in with a heavy THUD, the frame shakes
at(7.74, 'pesada', x => { const s = office(x, 0.9); const L = x.L; const r = rock(x, s, 0, 0, -0.7); const sp = r.slotPt(); const c = x.FX.coin0; s.add(c); const k = eio(seg(L, 0.1, 0.42));
  c.rotation.set(0, Math.PI / 2, 0); c.scale.setScalar(0.5); c.position.set(sp.x, sp.y, sp.z + mix(0.35, -0.08, k)); c.visible = L < 0.5; cam(x, [sp.x - 0.45, sp.y + 0.05, sp.z + 0.55], [sp.x, sp.y + 0.03, sp.z], 40); if (L > 0.42 && L < 0.8) shake(x, 0.45 * (1 - seg(L, 0.42, 0.8))); punch(x, 0.42, 0.12); });
// 8.64 "e um recado macabro" — the hanging lamp swings, light sweeping over him; he leans in slowly, head tilting (cold, low angle)
at(8.64, 'macabro', x => { const s = office(x, 1.1); const L = x.L; const r = rock(x, s, 0, 0, -0.7); r.armR.piv.rotation.x += 0.55; const sw = 0.5 * Math.sin(x.t * 2.6); x.S.lamp.rotation.z = sw * 0.5; x.S.officeKey.position.x = -sw * 1.6; x.S.officeKey.intensity = 26; x.S.officeWash.intensity = 14; x.S.deskLight.intensity = 3;
  r.torso.rotation.x += 0.16 * eio(x.u); r.head.rotation.z += 0.3 * eio(seg(L, 0.15, 1.1)); lookCam(x, r, 0.85); x.post.tint.value.set(0.88, 0.94, 1.1);
  const h = hp(r); cam(x, [h.x + 0.2, h.y - 0.7, h.z + mix(2.9, 2.1, eio(x.u))], [h.x, h.y - 0.1, h.z], 44); x.camera.rotateZ(0.1); });
// ================= 4. FNAF 6 =================
// 9.96 "Se você olhar bem para o peito dele" — on the FNAF 6 stage the camera "looks closer": a slow dolly from his full figure into his chest, landing on "peito"
at(9.96, 'peito', x => { const s = stage6(x); const L = x.L; const r = rock(x, s, 0, 1.0, -4.0); sing(r, 1, x.t); tapFoot(r, x.t, 0.6); lookCam(x, r, 0.4); const p = starPos(r); const k = eio(seg(L, 0.1, 1.25));
  r.star.material.emissiveIntensity = 0.35 + 1.4 * Math.max(0, 1 - Math.abs(L - 1.25) / 0.3); cam(x, [mix(0.5, 0.2, k), mix(2.3, p.y + 0.05, k), mix(-0.6, p.z + 1.3, k)], [0, mix(2.35, p.y - 0.05, k), mix(-4, p.z, k)], 50); punch(x, 1.2, 0.1); });
// 11.66 "no final de 6" — fast pull-back: the whole FNAF 6 stage, he throws his free arm up (showman pose)
at(11.66, 'fnaf6', x => { const s = stage6(x); const L = x.L; const r = rock(x, s, 0, 1.0, -4.0); sing(r, 1, x.t); const w = Math.max(0, gestW(L, 0.05, 9, 0.35)); r.armL.piv.rotation.z += 2.3 * w; r.armL.piv.rotation.x += -0.2 * w; r.head.rotation.x += -0.12 * w; lookCam(x, r, 0.5);
  const k = eo(x.u); cam(x, [mix(0.2, 0.0, k), mix(2.5, 2.8, k), mix(-1.2, 3.4, k)], [0, 2.3, -4], 52); });
// 12.48 "vai ver uma entrada de moedas" — side macro: a coin glides along and slides into the slot on "moedas"
at(12.48, 'entrada', x => { const s = stage6(x); const L = x.L; const r = rock(x, s, 0, 1.0, -4.0); r.armR.piv.rotation.x += 0.5; const sp = r.slotPt(); const c = x.FX.coin0; s.add(c); const k1 = eio(seg(L, 0.2, 0.9)), k2 = eio(seg(L, 0.9, 1.1));
  c.rotation.set(0, Math.PI / 2, 0); c.scale.setScalar(0.5); c.position.set(sp.x + mix(0.6, 0, k1), sp.y + 0.25 * Math.sin(k1 * Math.PI), sp.z + mix(0.3, 0.12, k1) - 0.2 * k2); c.visible = L < 1.15;
  cam(x, [sp.x + 0.75, sp.y + 0.15, sp.z + 0.65], [sp.x + 0.15, sp.y + 0.05, sp.z], 42); });
// 13.84 "bem no meio da carcaça" — orbit around his torso, the slot dead centre; punch on "meio"
at(13.84, 'meio', x => { const s = stage6(x); const L = x.L; const r = rock(x, s, 0, 1.0, -4.0); sing(r, 0.6, x.t); const p = r.slotPt(); const a = mix(0.45, -0.3, eio(x.u)); cam(x, [p.x + Math.sin(a) * 1.5, p.y + 0.25, p.z - 0.25 + Math.cos(a) * 1.5], [p.x, p.y + 0.1, p.z - 0.2], 46); punch(x, 0.32, 0.14); });
// ================= 5. GREED =================
// 15.28 "A Fazbear Entertainment chegou" — the company itself: the camera rises over mountains of coins as the voxel sign FAZBEAR ENTERTAINMENT lights up letter by letter
at(15.28, 'fazbear', x => { const s = corp(x); const L = x.L; x.S.signOn(seg(L, 0.05, 1.05)); x.S.signLight.intensity = 8 * seg(L, 0.1, 1.1); rainCoins(x, s, 0, -4.5, 6, 3, 0.6, 6.5);
  const k = eio(x.u); cam(x, [mix(0.3, 0, k), mix(0.7, 2.7, k), mix(2.6, -2.2, k)], [0, mix(1.2, 3.55, k), mix(-3, -6.5, k)], 56); });
// 16.92 "a um nível tão absurdo de ganância" — the "level" of coins rises: the mountains grow out of the floor, coins pouring; punch on "ganância"
at(16.92, 'nivel', x => { const s = corp(x); const L = x.L; x.S.corpPile.position.y = -0.7 * (1 - eo(seg(L, 0.0, 1.15))); rainCoins(x, s, 0, -2.5, 7, 4, 1 + seg(L, 1.0, 1.2));
  const k = eio(x.u); cam(x, [mix(1.0, -0.9, k), mix(0.6, 0.9, k), mix(2.0, 1.7, k)], [mix(-2.4, 2.4, k), mix(0.9, 1.5, k), -2.7], 58); punch(x, 1.08, 0.14); });
// 18.38 "que transformou o mascote principal" — Rockstar in the spotlight: on "transformou" the coin box grows out of his chest and the star spins in; he looks down, then poses proudly
at(18.38, 'transformou', x => { const s = corp(x); const L = x.L; const r = rock(x, s, 0, 0, -1.0); const g = back(seg(L, 0.18, 0.6)); r.coinBox.scale.setScalar(Math.max(0.001, g)); r.star.rotation.z = (1 - eo(seg(L, 0.18, 0.75))) * Math.PI * 4;
  r.star.material.emissiveIntensity = 0.35 + 1.6 * Math.max(0, 1 - Math.abs(L - 0.6) / 0.3); const P = x.FX.parts; s.add(P); P.userData.update(seg(L, 0.5, 1.2), starPos(r));
  const dn = sm(seg(L, 0.1, 0.35)) * (1 - sm(seg(L, 0.7, 0.95))); r.head.rotation.x += 0.4 * dn; const pr = Math.max(0, gestW(L, 0.85, 9, 0.35)); sing(r, pr, x.t); r.armL.piv.rotation.z += 1.6 * pr; r.armL.piv.rotation.x += -0.3 * pr; lookCam(x, r, 0.6 * pr);
  const k = eio(x.u); const p = starPos(r), h = hp(r); cam(x, [mix(0.5, -0.9, k), mix(p.y + 0.1, h.y - 0.3, k), mix(p.z + 1.3, h.z + 2.8, k)], [0, mix(p.y, h.y - 0.6, k), -1.0], 48); });
// 20.06 "em um cofre ambulante" — he walks at us through the coins (tracking back); the star flashes on "cofre"
at(20.06, 'ambulante', x => { const s = corp(x); const L = x.L; const r = rock(x, s, 0, 0, 0); walkPath(r, L, -0.3, 1.8, [0, -1.8], [0, 0.4], { stride: 0.85, linear: true }); r.armR.piv.rotation.x += -1.3; bounceWalk(r, x.t, 1); r.star.material.emissiveIntensity = 0.35 + 1.6 * Math.max(0, 1 - Math.abs(L - 0.26) / 0.25);
  const h = hp(r); cam(x, [h.x + 0.4, h.y - 0.6, h.z + 2.8], [h.x, h.y - 0.8, h.z], 50); });
// ================= 6. UCN: a darker meaning =================
// 21.46 "Só que na Ultimate Custom Night" — back in the UCN office, eye-level dolly over the guard's desk towards him
at(21.46, 'ucn2', x => { const s = office(x, 0.9); const L = x.L; const r = rock(x, s, 0, 0, -0.7); sing(r, 0.3, x.t); lookCam(x, r, 0.5 * sm(seg(L, 0.4, 1.2))); x.S.lamp.rotation.z = 0.08 * Math.sin(x.t * 2); x.S.officeKey.intensity = 36;
  const k = eio(x.u); cam(x, [mix(1.0, 0.45, k), mix(1.7, 1.85, k), mix(3.5, 2.3, k)], [0, mix(1.8, 2.0, k), -0.7], 50); });
// 23.10 "essa programação ganha um sentido" — the office CRT runs his "program": green code lines + the coin and the "5"; push in until the whole screen fills the frame
at(23.10, 'programa', x => { const s = office(x, 0.95); const L = x.L; officeCode(x.S, x.t); x.S.officeKey.intensity = 22; const k = eio(x.u);
  cam(x, [mix(-0.45, -0.9, k), mix(1.45, 1.22, k), mix(-1.0, -2.05, k)], [-0.9, 1.21, -3.27], 40); x.post.glitch.value = L > 0.95 && L < 1.05 ? 0.3 : 0; });
// 24.32 "muito mais sombrio" — the lamp fails; flicker... and when the light comes back he is much closer, leaning, head tilted (no glowing eyes: just darkness)
at(24.32, 'sombrio', x => { const s = office(x, 1.15); const L = x.L; const near = L > 0.45; const r = rock(x, s, 0, 0, near ? -0.1 : -0.7); r.armR.piv.rotation.x += 0.6; lookCam(x, r, 0.9);
  if (near) { r.torso.rotation.x += 0.2; r.head.rotation.z += 0.32; r.head.rotation.x += -0.05; r.root.position.y = 0; }
  const fl = L < 0.22 ? 1 : L < 0.55 ? ((Math.sin(L * 90) > 0.3 && L < 0.36) ? 0.6 : 0.0) : 0.75 + 0.12 * Math.sin(x.t * 31) * (L < 0.7 ? 1 : 0); x.S.officeKey.intensity = 40 * fl; x.S.officeWash.intensity = 30 * fl; x.S.deskLight.intensity = (near ? 14 : 4) * fl; if (near) { x.S.deskLight.position.set(-0.3, 1.6, 1.5); x.S.deskLight.color.set('#a8c0ff'); } x.S.lampBulb.material.color.set(fl > 0.2 ? '#ffd890' : '#2a2010');
  x.post.fade.value = 0.9 * (1 - Math.min(1, fl * 2)); x.post.tint.value.set(0.9, 0.93, 1.08); const k = eio(x.u); const h = hp(r); cam(x, [0.2, 2.35, mix(3.5, 3.25, k)], [0, h.y - 0.15, h.z], 46); punch(x, 0.6, 0.12); });
// ================= 7. WILLIAM =================
// 25.50 "Ali você não é um guarda comum" — the guard at the desk, nervous, glancing around; the camera circles him
at(25.50, 'guarda', x => { const s = office(x); const L = x.L; const w = put(x, 'william', s, WX, 0, WZ, Math.PI); alive(w, x.t, 1); w.head.rotation.y = 0.55 * Math.sin(L * 3.4); w.setFace({ lid: 0.1, slope: -0.6 }); const h = hp(w); const a = mix(Math.PI + 0.7, Math.PI - 0.4, eio(x.u));
  cam(x, [h.x + Math.sin(a) * 2.5, h.y + 0.1, h.z + Math.cos(a) * 2.5], [h.x, h.y - 0.05, h.z], 48); });
// 27.04 "mas sim o próprio William Afton" — punch-in: the nervous face turns into his evil grin (purple tint)
at(27.04, 'afton', x => { const s = office(x); const L = x.L; const w = put(x, 'william', s, WX, 0, WZ, Math.PI); alive(w, x.t, 1); lookCam(x, w, 0.8); const ev = seg(L, 0.75, 0.95); w.setFace({ lid: 0.1 + 0.25 * ev, slope: ev > 0.5 ? 1 : -0.6, mouth: 0 }); gesture(w, 'evil', L, 0.8, 9, 0.6, { face: false });
  const h = hp(w); cam(x, [h.x - 0.3, h.y + 0.1, h.z - mix(2.3, 1.8, eo(x.u))], [h.x, h.y + 0.02, h.z], 46); punch(x, 0.8, 0.16); const pt = sm(seg(L, 0.9, 1.2)); x.post.tint.value.set(1 - 0.02 * pt, 1 - 0.12 * pt, 1 + 0.1 * pt); });
// 28.44 "preso em um pesadelo eterno" — the nightmare: William trapped in the dark, static TVs circling him; the camera spins
at(28.44, 'pesadelo', x => { const s = nightmare(x); const L = x.L; x.S.nmKey.intensity = 60; x.S.nmRim.intensity = 35; const w = put(x, 'william', s, 0, 0, 0, 0); alive(w, x.t, 1); gesture(w, 'scared', L, 0.2, 9, 0.9, { face: false }); w.setFace({ lid: 0, slope: -1, mouth: 0.6 }); w.noBlink = true; lookCam(x, w, 0.6);
  const a = 0.6 + L * 0.7; cam(x, [Math.sin(a) * 2.4, 1.8, Math.cos(a) * 2.4], [0, 1.45, 0], 56); });
// 29.94 "criado pela alma vingativa" — behind him, Golden Freddy flickers into existence, slumped on the floor; on "vingativa" his head rises to stare at William, who turns and jumps
at(29.94, 'alma', x => { const s = nightmare(x, new V3(0, 0, 0.6)); const L = x.L; x.S.nmKey.intensity = 40; const w = put(x, 'william', s, 0.5, 0, 0.6, -0.1); alive(w, x.t, 1); w.setFace({ lid: 0, slope: -1 }); w.noBlink = true;
  const g = put(x, 'golden', s, -0.8, 0, -1.7, 0.25); const fk = sm(seg(L, 0.1, 0.55)); const flick = L < 0.55 && Math.sin(L * 75) < -0.2 ? 0.25 : 1; g.fadeIn(fk * flick); const lift = eio(seg(L, 0.75, 1.35));
  g.head.rotation.x += 0.55 * (1 - lift); g.head.rotation.z += 0.3 * (1 - lift); g.torso.rotation.x += 0.15 * (1 - lift); g.armR.piv.rotation.z += -0.06; g.armL.piv.rotation.z += 0.06; lookAt(g, hp(w), 0.55 * lift);
  const gl = x.S.nmGold; gl.intensity = 2.2 * fk * flick; gl.position.set(-0.4, 2.8, -0.3);
  lookAt(w, new V3(-0.6, 2.2, -1.7), eo(seg(L, 1.0, 1.4)) * 0.9); startle(w, L, 1.15, 0.7); x.post.glitch.value = L < 0.55 ? 0.12 * Math.max(0, Math.sin(L * 40)) : 0;
  camMove(x, [0.15, 1.6, 3.0], [-0.1, 1.5, -0.6], [0.1, 1.6, 2.6], [-0.15, 1.55, -0.6], eo, 56); x.post.tint.value.set(1.05, 1.0, 0.9); });
// ================= 8. THE SPIRIT TAKES THE ROBOT =================
// 31.58 "O espírito pegou essa função gananciosa" — in the office Golden Freddy appears beside Rockstar and reaches out: a stream of golden light flows into the coin slot,
//        the star flares on "gananciosa", Rockstar jolts... and Golden Freddy fades away
at(31.58, 'pegou', x => { const s = office(x, 0.95); const L = x.L; const r = rock(x, s, 0.15, 0, -0.75); r.armR.piv.rotation.x += 0.75; x.S.officeKey.intensity = 30; const sp = r.slotPt();
  const g = put(x, 'golden', s, -1.45, 0, -0.9, 1.45); alive(g, x.t, 0.5); g.fadeIn(sm(seg(L, 0.0, 0.3)) * (1 - sm(seg(L, 1.55, 2.0)))); const rw = eo(seg(L, 0.15, 0.55)) * (1 - sm(seg(L, 1.5, 1.9)));
  aimArm(g, g.armR, sp.clone().add(new V3(-0.25, 0.1, 0.55)), rw); lookAt(g, sp, 0.7); g.root.updateMatrixWorld(true); const hand = g.handR.getWorldPosition(new V3());
  const st = x.FX.stream; const sa = sm(seg(L, 0.4, 0.6)) * (1 - sm(seg(L, 1.35, 1.6))); if (sa > 0) { s.add(st); st.userData.update(hand, sp, x.t, sa); }
  r.star.material.emissiveIntensity = 0.35 + 2.2 * Math.max(0, 1 - Math.abs(L - 1.22) / 0.3); const j = Math.max(0, 1 - Math.abs(L - 1.25) / 0.2); r.torso.rotation.x += -0.12 * j; r.head.rotation.x += -0.15 * j;
  lookAt(r, hp(g), 0.5 * (1 - sm(seg(L, 1.3, 1.7)))); lookCam(x, r, 0.6 * sm(seg(L, 1.3, 1.7))); r.head.rotation.z += 0.18 * sm(seg(L, 1.4, 1.9));
  camMove(x, [-0.8, 1.8, 3.4], [-0.72, 1.6, -0.8], [-0.7, 1.85, 2.9], [-0.66, 1.65, -0.8], eo, 54); punch(x, 1.2, 0.08); });
// 33.58 "do robô e transformou em tortura" — two-shot from the side: Rockstar leans over the desk, palm out, foot tapping; William cowers
at(33.58, 'tortura', x => { const s = office(x, 1.0); const L = x.L; const r = rock(x, s, 0.0, 0, mix(-0.7, -0.05, eo(seg(L, 0, 0.8)))); r.torso.rotation.x += 0.18 * eo(seg(L, 0, 0.8)); r.armR.piv.rotation.x += 0.5;
  palmOut(r, L, 0.3, 0.9); tapFoot(r, x.t, 1); lookCam(x, r, 0.9); r.head.rotation.z += 0.15 * sm(seg(L, 0.9, 1.5)); x.S.officeKey.intensity = 30;   // William's point of view: the robot leans over his desk, demanding
  cam(x, [WX + 0.35, 1.72, WZ - 0.15], [-0.1, 2.25, -0.3], 54); x.post.tint.value.set(1.06, 0.92, 0.9); hand(x, 1.4); punch(x, 1.18, 0.12); });
// ================= 9. PAYING =================
// 35.46 "O assassino é obrigado a pagar" — William trembling, eyes darting; on "obrigado" he looks up at the robot and swallows
at(35.46, 'obrigado', x => { const s = office(x); const L = x.L; const w = put(x, 'william', s, WX, 0, WZ, Math.PI); alive(w, x.t, 1); w.root.position.x += 0.008 * Math.sin(x.t * 47); w.setFace({ lid: 0.2, slope: -1 }); w.head.rotation.y = 0.22 * Math.sin(L * 9) * (1 - sm(seg(L, 0.55, 0.8)));
  lookAt(w, new V3(0, 2.5, -0.7), 0.8 * sm(seg(L, 0.55, 0.85))); const h = hp(w); cam(x, [h.x + 0.5, h.y - 0.05, h.z - mix(2.0, 1.6, eo(x.u))], [h.x, h.y, h.z], 44); });
// 36.88 "exatamente cinco moedas" — top-down over the desk: his hand slides the five coins forward one by one, the counter reaches 5 on "cinco"
at(36.88, 'cinco2', x => { const s = office(x); const L = x.L; const w = put(x, 'william', s, WX, 0, WZ, Math.PI); alive(w, x.t, 0.6); const n = Math.min(4, Math.floor(L / 0.1));
  for (let i = 0; i < 5; i++) { const c = coinOnDesk(x, s, i, 1); const k = eio(seg(L, i * 0.1, i * 0.1 + 0.14)); c.position.z = DESK_Z + 0.35 - 0.4 * k; }
  const cur = x.FX['coin' + n]; aimArm(w, cur.position.x < WX ? w.armL : w.armR, cur.position.clone().add(new V3(0, 0.08, 0.1)), sm(seg(L, 0, 0.12)));
  cam(x, [-0.65, 3.3, 1.6], [-0.65, DESK_Y, 1.95], 54); ui(x, { type: 'coins', txt: String(Math.min(5, n + 1)), u: 0.3, v: 0.075, k: 1 + 0.15 * Math.max(0, 1 - ((L % 0.1) / 0.08)), a: 1 }); });
// 38.40 "para comprar mais alguns minutos" — the coins fly into the slot one after another (wide, from the side), the counter drains
at(38.40, 'paga', x => { const s = office(x); const L = x.L; const r = rock(x, s, 0, 0, -0.7); palmOut(r, L, -1, 0.6); lookAt(r, new V3(-1, 1.1, 1.7), 0.6);
  for (let i = 0; i < 5; i++) { const k = seg(L, i * 0.12, i * 0.12 + 0.6); if (k <= 0) coinOnDesk(x, s, i, 1); else coinToSlot(x, s, i, r, k); }
  cam(x, [-2.6, 1.6, 0.9], [0.0, 1.35, -0.3], 54); ui(x, { type: 'coins', txt: String(Math.max(0, 5 - Math.floor(L / 0.12 + 0.01))), u: 0.3, v: 0.075, k: 1, a: 1 }); });
// 39.38 "de vida" — relief: William closes his eyes, hand on his chest, breathes out
at(39.38, 'vida', x => { const s = office(x); const L = x.L; const w = put(x, 'william', s, WX, 0, WZ, Math.PI); alive(w, x.t, 1); gesture(w, 'chest', L, 0.1, 9, 1, { face: false }); const rl = sm(seg(L, 0.15, 0.45));
  w.setFace({ lid: 0.85 * rl * (1 - sm(seg(L, 0.8, 1.0))), slope: -0.5, mouth: 0.4 * rl }); w.noBlink = true; w.torso.rotation.x += 0.08 * rl; w.head.rotation.x += 0.12 * rl;
  const h = hp(w); cam(x, [h.x - 0.45, h.y, h.z - mix(2.0, 1.6, eo(x.u))], [h.x, h.y - 0.1, h.z], 44); });
// ================= 10. THE FIVE CHILDREN =================
// 40.42 "O mesmo número das cinco crianças" — five Faz-Coins float in the dark, lighting up one by one (counting to five)
const VC = i => new V3(-0.6 + i * 0.3, 1.55 + 0.04 * Math.sin(i * 1.7), 0);
function voidCoins(x, s, glow) { for (let i = 0; i < 5; i++) { const c = x.FX['coin' + i]; s.add(c); const p = VC(i); c.position.set(p.x, p.y + 0.03 * Math.sin(x.t * 2 + i), p.z); c.rotation.set(0, Math.sin(x.t * 0.8 + i) * 0.5, 0); c.scale.setScalar(1.3); c.children[0].material.emissiveIntensity = 0.3 + 2.6 * glow(i); } }
at(40.42, 'brilho', x => { const s = voidS(x); const L = x.L; voidCoins(x, s, i => seg(L, 0.25 + i * 0.13, 0.4 + i * 0.13)); x.S.voidLight.intensity = 4 + 4 * seg(L, 0.3, 1.0);
  const k = eio(x.u); cam(x, [mix(-0.5, 0.0, k), 1.6, mix(1.6, 2.2, k)], [mix(-0.3, 0, k), 1.55, 0], 50); });
// 41.56 "crianças originais" — one at a time a child's soul rises out of each coin and lands in its own place in a row (no overlap); the camera pulls back on the five
at(41.56, 'sobe', x => { const s = voidS(x); const L = x.L; voidCoins(x, s, () => 1); x.S.voidLight.intensity = 8;
  for (let i = 0; i < 5; i++) { const k = seg(L, i * 0.15, i * 0.15 + 0.4); if (k <= 0) continue; const a = VC(i), b = new V3(-1.4 + i * 0.7, -0.4, -0.9); const e = eio(k);
    const sl = put(x, 'soul' + i, s, mix(a.x, b.x, e), mix(a.y - 0.2, b.y, e) + Math.sin(e * Math.PI) * 0.35, mix(a.z, b.z, e), 0); x.live.pop(); sl.root.scale.setScalar(mix(0.06, 0.74, eo(seg(k, 0, 0.7)))); sl.ghostMat.opacity = 0.62 * sm(seg(k, 0, 0.3)); alive(sl, x.t, 0.5, i); lookCam(x, sl, 0.5);
    if (k < 0.6) { const P = x.FX.parts; s.add(P); P.userData.update(k / 0.6, a); } }
  const k = eio(x.u); cam(x, [0, mix(1.6, 1.4, k), mix(2.3, 5.0, k)], [0, mix(1.5, 0.75, k), mix(0, -0.6, k)], 54); x.post.tint.value.set(0.95, 0.98, 1.08); });
// 42.58 "que ele matou no passado" — the nightmare: the five souls appear around William, one at a time, and stare; crane up
at(42.58, 'cerco', x => { const s = nightmare(x); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); alive(w, x.t, 1); w.setFace({ lid: 0, slope: -1, mouth: 0.6 }); w.noBlink = true; startle(w, L, 0.16, 0.6); const ct = new V3(0, 0, 0);
  for (let i = 0; i < 5; i++) { const p = ring5(ct, 2.1, i, 0.4); const sl = put(x, 'soul' + i, s, p.x, 0.12 + 0.05 * Math.sin(x.t * 2 + i), p.z, Math.atan2(-p.x, -p.z)); sl.ghostMat.opacity = 0.6 * sm(seg(L, i * 0.08, i * 0.08 + 0.3)); alive(sl, x.t, 0.5, i); lookAt(sl, hp(w), 0.8); }
  x.S.nmKey.intensity = 55; const k = eio(x.u); cam(x, [0.4, mix(1.6, 4.0, k), mix(4.0, 3.4, k)], [0, 0.8, 0], 56); x.post.tint.value.set(0.95, 0.98, 1.08); });
// ================= 11. THE HEATER =================
// 43.96 "E o único jeito de burlar essa cobrança" — William thinks (hand on chin)... "!" — he gets the idea and turns to the monitor on the desk
at(43.96, 'burlar', x => { const s = office(x); const L = x.L; const w = put(x, 'william', s, WX, 0, WZ, Math.PI); alive(w, x.t, 1); const T = x.S.tablet; T.visible = true; T.position.set(WX + 0.1, 1.455, 1.5); T.rotation.set(-0.2, 0, 0); drawPanel(x.S, 0, 60);
  gesture(w, 'think', L, 0.0, 0.85, 1); const id = Math.max(0, gestW(L, 0.84, 1.45, 0.3, 0.3)); w.armR.piv.rotation.x += -2.7 * id; w.armR.piv.rotation.z += -0.3 * id; w.head.rotation.x += -0.12 * id; if (L > 0.84 && L < 1.4) w.setFace({ mouth: 0.5, lid: 0 });
  bubble(x, 'ex', s, w, 0.84); lookAt(w, T.position, sm(seg(L, 1.35, 1.7))); 
  x.S.deskLight.color.set('#c8e0ff'); x.S.deskLight.intensity = 7; const h = hp(w); const k = eio(x.u); cam(x, [mix(-2.6, -2.3, k), h.y + 0.1, mix(0.9, 1.1, k)], [h.x + 0.05, h.y - 0.2, h.z - 0.3], 50); });
// 45.76 "é ligando o aquecedor no máximo" — over his shoulder onto the monitor: Heater ON on "aquecedor", temperature climbs to the max on "máximo"
at(45.76, 'aquecedor', x => { const s = office(x); const L = x.L; const T = x.S.tablet; T.visible = true; T.position.set(WX + 0.1, 1.455, 1.5); T.rotation.set(-0.2, 0, 0);
  drawPanel(x.S, L > 0.48 ? 1 : 0, 60 + 45 * eio(seg(L, 0.5, 1.0))); const c = T.position; const k = eo(x.u);   // William's POV (he is the camera)
  cam(x, [c.x + 0.02, mix(1.66, 1.62, k), mix(2.42, 2.36, k)], [c.x, c.y + 0.0, c.z], 72); hand(x, 0.6); punch(x, 0.48, 0.06); x.post.tint.value.set(1 + 0.12 * seg(L, 0.5, 1.1), 1, 1 - 0.1 * seg(L, 0.5, 1.1)); });
// 47.00 "e usando o mesmo" — the office heats up (orange): Rockstar fans himself, sweating, and storms off
at(47.00, 'calor', x => { const s = office(x, 0.85); const L = x.L; const r = rock(x, s, 0, 0, -0.7); fanSelf(r, x.t, eo(seg(L, 0.0, 0.25)) * (1 - sm(seg(L, 0.45, 0.7)))); walkPath(r, L, 0.5, 1.4, [0, -0.7], [-2.6, -0.7], { stride: 0.9, face: false }); r.root.rotation.y = -Math.PI / 2 * sm(seg(L, 0.4, 0.68)); lookCam(x, r, 0.6 * (1 - sm(seg(L, 0.4, 0.6)))); x.S.officeKey.color.set('#ff7a40');
  x.post.tint.value.set(1.18, 0.92, 0.8); bubble(x, 'ex', s, r, 0.1, 0.9); const h = hp(r); cam(x, [mix(0.5, 0.1, eo(x.u)), 2.0, 3.5], [h.x * 0.8, 1.9, h.z], 50); });
// ================= 12. FIRE =================
// 47.80 "fogo" — the burning room of the FNAF 6 ending: the flames burst up around Springtrap
at(47.80, 'fogo', x => { const s = scene(x, 'fireRoom', 0.9); const L = x.L; const sp = put(x, 'spring', s, 0, 0, -1.8, 0); alive(sp, x.t, 1); gesture(sp, 'agony', L, 0.05, 9, 0.9, { face: false }); lookCam(x, sp, 0.5);
  const k = sm(seg(L, 0.0, 0.2)); fireAt(x, s, 0, -2.6, 5.0, 1.6, 3.0 * (0.35 + 0.65 * k), 3 + 6 * k); x.FX.fire.userData.fl.forEach(m => { m.visible = Math.hypot(m.position.x, m.position.z + 1.8) > 0.75; }); x.FX.fire.userData.lights.forEach(l => l.position.z = -0.6); x.bloom.strength = 0.18;
  const h = hp(sp); cam(x, [h.x - 0.5, h.y - 0.5, h.z + mix(3.6, 3.1, eo(x.u))], [h.x, h.y - 0.7, h.z], 50); punch(x, 0.0, 0.1); });
// 48.24 "que acabou com ele" — close: he collapses in the flames
at(48.24, 'acabou', x => { const s = scene(x, 'fireRoom', 0.95); const L = x.L; const sp = put(x, 'spring', s, 0, 0, -1.8, 0); gesture(sp, 'slump', L, 0.2, 9, 1, { face: false }); sp.root.position.y -= 0.25 * eio(seg(L, 0.3, 1.0));
  fireAt(x, s, 0, -2.6, 5.0, 1.6, 3.2, 9); x.FX.fire.userData.fl.forEach(m => { m.visible = Math.hypot(m.position.x, m.position.z + 1.8) > 0.75; }); x.FX.fire.userData.lights.forEach(l => l.position.z = -0.6); x.bloom.strength = 0.18;
  const h = hp(sp); cam(x, [h.x + 0.4, h.y + 0.2, h.z + mix(2.2, 1.7, eo(x.u))], [h.x, h.y - 0.2, h.z], 46); });
// ================= 13. ENDING =================
// 49.32 "Você já tinha ligado esses pontos?" — the five coins float in a circle; on "ligado" lines of light connect them into a STAR (Rockstar's star); on "pontos" it flashes
const PC = i => { const a = Math.PI / 2 + i * Math.PI * 2 / 5; return new V3(Math.cos(a) * 0.62, 1.55 + Math.sin(a) * 0.62, 0); };
at(49.32, 'pontos', x => { const s = voidS(x); const L = x.L; const ord = [0, 2, 4, 1, 3]; const pts = ord.map(PC);
  for (let i = 0; i < 5; i++) { const c = x.FX['coin' + i]; s.add(c); const p = PC(i); c.position.copy(p); c.rotation.set(0, 0.3 * Math.sin(x.t + i), 0); c.scale.setScalar(1.3); c.children[0].material.emissiveIntensity = 1.2 + 1.5 * sm(seg(L, 1.15, 1.3)); }
  const ln = x.FX.lines; s.add(ln); ln.userData.update(pts, 5 * eio(seg(L, 0.55, 1.2))); x.S.voidLight.intensity = 6 + 6 * Math.max(0, 1 - Math.abs(L - 1.22) / 0.25); x.bloom.strength = 0.35 + 0.35 * Math.max(0, 1 - Math.abs(L - 1.22) / 0.3);
  const k = eio(x.u); cam(x, [mix(0.35, 0, k), mix(1.45, 1.55, k), mix(1.9, 3.2, k)], [0, 1.55, 0], 46); x.camera.rotateZ(0.12 * (1 - k)); });
// 51.14 "Comenta aí e me segue pra mais mistérios" — back on the FNAF 6 stage: he points at us ("comenta"), then waves us in ("me segue") while coins rain
at(51.14, 'final', x => { const s = stage6(x); const L = x.L; const r = rock(x, s, 0, 1.0, -4.0); sing(r, 0.5, x.t); const pw = Math.max(0, gestW(L, 0.0, 0.45, 0.25, 0.2)); r.armL.piv.rotation.x += -1.45 * pw; r.torso.rotation.y += 0.12 * pw;
  wave(r, 'L', L, 0.5, 9, x.t); lookCam(x, r, 0.75); rainCoins(x, s, 0, -3.6, 6, 2.5, 0.8);
  const k = eio(x.u); cam(x, [mix(0.4, 0, k), mix(2.7, 3.0, k), mix(-1.0, 1.8, k)], [0, mix(2.95, 2.5, k), -4], 50); punch(x, 0.0, 0.08); });

export const SHOTS = shots;
export const DURATION = 53.11;
