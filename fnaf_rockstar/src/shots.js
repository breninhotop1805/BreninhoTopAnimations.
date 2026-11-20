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
function rock(x, s, px, py, pz, ry = 0) { const r = put(x, 'rockstar', s, px, py, pz, ry); alive(r, x.t, 0.9); r.armR.piv.rotation.x += -1.3; r.armR.piv.rotation.z += 0.1; return r; }
// ---- Rockstar acting kit ----
function sing(r, w, t) { w = cl(w); r.armR.piv.rotation.x += -0.6 * w; r.armR.piv.rotation.z += 0.04 * w; r.head.rotation.x += -0.12 * w + 0.05 * Math.sin(t * 8) * w; r.torso.rotation.z += 0.07 * Math.sin(t * 4) * w; }
function palmOut(r, L, a, amt = 1) { const w = Math.max(0, gestW(L, a, 9)) * amt; r.armL.piv.rotation.x += -1.35 * w; r.armL.piv.rotation.z += -0.1 * w; r.head.rotation.z += 0.16 * w; r.torso.rotation.x += 0.06 * w; return w; }
function tapFoot(r, t, w) { r.legL.piv.rotation.x += -0.22 * Math.max(0, Math.sin(t * 11)) * w; }
function cheer(r, L, a) { const w = Math.max(0, gestW(L, a, 9)); r.armL.piv.rotation.z += 2.5 * w; r.armL.piv.rotation.x += -0.25 * w; sing(r, w, 0); r.head.rotation.x += -0.15 * w; return w; }
function fanSelf(r, t, w) { r.armL.piv.rotation.x += -1.55 * w; r.armL.piv.rotation.z += (0.55 + 0.3 * Math.sin(t * 16)) * w * -1; r.head.rotation.x += -0.1 * w; r.torso.rotation.x += -0.05 * w; }
function bounceWalk(r, t, w) { r.torso.rotation.z += 0.06 * Math.sin(t * 7) * w; r.head.rotation.z += 0.08 * Math.sin(t * 7 + 0.5) * w; }
const DESK_Y = 1.03, DESK_Z = 1.7;
const coinX = i => -1.75 + i * 0.62;
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

const vault = x => scene(x, 'vault', 0.7);
const stage6 = x => scene(x, 'stage6', 0.65);
function nightmare(x, c) { const s = scene(x, 'nightmare', 0.9); x.S.updateNightmare(x.t, c || new V3(0, 0, 0)); return s; }
function rainCoins(x, s, cx, cz, w, d, rate = 1) { const R = x.FX.rain; s.add(R); R.children.forEach((c, i) => { const [a, b, e] = c.userData.p; const k = ((x.t * (0.9 + b) * rate + e) % 1); c.position.set(cx + (a - 0.5) * w, 5.5 - k * 5.4, cz + (e - 0.5) * d); c.rotation.set(x.t * 5 + i, x.t * 3 + i * 2, 0); }); }
function pour(x, s) { const R = x.FX.rain; s.add(R); R.children.forEach((c, i) => { const [a, b, e] = c.userData.p; const ch = x.S.chutes[i % 3]; const k = ((x.t * (1.2 + b) + e) % 1); c.position.set(ch.x + (a - 0.5) * 0.4, ch.y - k * 4.4, ch.z + (e - 0.5) * 0.4); c.rotation.set(x.t * 6 + i, x.t * 4 + i, 0); }); }

const shots = []; const at = (t, name, fn) => shots.push({ t, name, fn });

// ===== 1. HOOK =====
// 0.00 "Por que o" — darkness; the hanging lamp flickers on (low angle from the floor, lamp swinging)
at(0.00, 'lampada', x => { const s = office(x, 0.95); const L = x.L; const fl = L < 0.3 ? (Math.sin(L * 70) > 0.2 ? 1 : 0.05) : 1; x.S.officeKey.intensity = 46 * fl; x.S.officeWash.intensity = 45 * fl; x.S.lampBulb.visible = fl > 0.5;
  const sw = 0.25 * Math.sin(x.t * 3); cam(x, [0.3 + sw, 0.35, 0.6], [0.1, 3.9, -1.6], 70); x.camera.rotateZ(0.15); });
// 0.48 "Rockstar Freddy" — he steps into the light singing into the mic; low dolly-in, punch on "Freddy"
at(0.48, 'entra', x => { const s = office(x); const L = x.L; const r = rock(x, s, 0, 0, -0.7); walkPath(r, L, -0.35, 0.45, [-1.0, -1.1], [0, -0.7], { stride: 0.8 }); sing(r, 1, x.t); bounceWalk(r, x.t, 1);
  const k = eo(x.u); cam(x, [mix(1.2, 0.6, k), mix(0.7, 0.95, k), mix(1.0, 0.7, k)], [0, 2.1, -0.8], 60); punch(x, 0.3, 0.14); });
// 1.12 "pede" — palm out, head tilted: "pay up"
at(1.12, 'pede', x => { const s = office(x); const L = x.L; const r = rock(x, s, 0, 0, -0.7); palmOut(r, L, 0.0); lookCam(x, r, 0.8); const h = hp(r);
  cam(x, [h.x - 0.9, h.y - 0.55, h.z + mix(2.4, 2.0, eo(x.u))], [h.x - 0.25, h.y - 0.6, h.z], 46); });
// 1.44 "5 moedas" — five Faz-Coins drop and bounce on the desk, counter "5" pops; camera slides along the desk
at(1.44, 'cinco', x => { const s = office(x); const L = x.L; for (let i = 0; i < 5; i++) { const k = seg(L, i * 0.07, i * 0.07 + 0.35); const c = coinOnDesk(x, s, i, 1); const b = Math.abs(Math.cos(k * Math.PI * 2.5)) * (1 - k) * (1 - k); c.position.y = DESK_Y + 0.012 + (k <= 0 ? 3 : b * 0.6); c.rotation.z += (1 - k) * 6; c.visible = k > 0; }
  cam(x, [mix(-2.2, -0.4, eio(x.u)), 1.35, 2.75], [mix(-1.6, -0.6, eio(x.u)), DESK_Y, DESK_Z], 48); ui(x, hud(x, '5', 0.0)); });
// 2.18 "na Ultimate Custom Night?" — top-down crane, spinning down onto the whole office
at(2.18, 'ucn', x => { const s = office(x); const L = x.L; const r = rock(x, s, 0, 0, -0.7); sing(r, 0.5, x.t); const k = eio(x.u); const a = mix(-0.6, 0.4, k);
  cam(x, [Math.sin(a) * mix(1.0, 3.2, k), mix(4.0, 2.6, k), 0.4 + Math.cos(a) * mix(1.0, 3.2, k)], [0, 0.8, -1.2], 66); });
// ===== 2. "it's a joke" =====
// 3.76 "Muita gente acha que isso é só uma" — he shows off: foot tapping, mic up, camera orbits half around him
at(3.76, 'show', x => { const s = office(x); const L = x.L; const r = rock(x, s, 0, 0, -0.7); sing(r, 0.8, x.t); tapFoot(r, x.t, 1); lookCam(x, r, 0.5); const a = mix(-0.9, 0.6, eio(x.u)); const h = hp(r);
  cam(x, [h.x + Math.sin(a) * 3.0, 1.7, h.z + Math.cos(a) * 3.0], [h.x, 1.8, h.z], 50); });
// 5.12 "piada boba do jogo" — close: he laughs, head back, bouncing
at(5.12, 'piada', x => { const s = office(x); const L = x.L; const r = rock(x, s, 0, 0, -0.7); lookCam(x, r, 0.7); const lw = seg(L, 0.05, 0.3); r.head.rotation.x -= (0.25 + 0.15 * Math.abs(Math.sin(x.t * 10))) * lw; r.torso.rotation.x -= 0.08 * Math.abs(Math.sin(x.t * 10)) * lw;
  r.armL.piv.rotation.x += -0.55 * lw; r.armL.piv.rotation.z += 0.35 * lw; const h = hp(r); cam(x, [h.x + 0.6, h.y - 0.35, h.z + mix(2.1, 1.6, eo(x.u))], [h.x, h.y - 0.3, h.z], 44); x.camera.rotateZ(-0.06); });
// ===== 3. "hidden criticism" =====
// 6.36 "mas essa mecânica esconde" — fast crane from his face down to the coin box; the star gleams
at(6.36, 'desce', x => { const s = office(x, 0.85); const L = x.L; const r = rock(x, s, 0, 0, -0.7); r.star.material.emissiveIntensity = 0.35 + 1.2 * Math.max(0, 1 - Math.abs(L - 1.0) / 0.3); const h = hp(r), p = r.slotPt(); const k = eio(seg(L, 0.1, 1.0));
  cam(x, [0.35, mix(h.y, p.y + 0.3, k), mix(h.z + 1.8, p.z + 1.0, k)], [0, mix(h.y - 0.1, p.y + 0.12, k), -0.7], 44); });
// 7.74 "uma crítica pesada" — macro on the slot: a coin drops in with a heavy THUD, the frame shakes
at(7.74, 'pesada', x => { const s = office(x, 0.9); const L = x.L; const r = rock(x, s, 0, 0, -0.7); const sp = r.slotPt(); const c = x.FX.coin0; s.add(c); const k = eio(seg(L, 0.1, 0.42));
  c.rotation.set(0, Math.PI / 2, 0); c.scale.setScalar(0.5); c.position.set(sp.x, sp.y, sp.z + mix(0.35, -0.08, k)); c.visible = L < 0.5; cam(x, [sp.x - 0.45, sp.y + 0.05, sp.z + 0.55], [sp.x, sp.y + 0.03, sp.z], 40); if (L > 0.42 && L < 0.8) shake(x, 0.45 * (1 - seg(L, 0.42, 0.8))); punch(x, 0.42, 0.12); });
// 8.64 "e um recado macabro" — the lamp dies; only his pupils glow red; dutch push-in from below
at(8.64, 'macabro', x => { const s = office(x, 1.1); const L = x.L; const r = rock(x, s, 0, 0, -0.7); lookCam(x, r, 0.9); r.eyeRed(eo(seg(L, 0.35, 0.6))); const d = 1 - 0.85 * seg(L, 0.0, 0.3); x.S.officeKey.intensity = 46 * d; x.S.officeWash.intensity = 45 * d; x.S.officeFill.intensity = 1.5;
  const h = hp(r); cam(x, [h.x + 0.25, h.y - 0.7, h.z + mix(2.2, 1.5, eio(x.u))], [h.x, h.y - 0.1, h.z], 44); x.camera.rotateZ(0.12); });
// ===== 4. FNAF 6 =====
// 9.96 "Se você olhar bem para o peito dele" — FNAF 6 pizzeria: he sings on stage; the camera cranes from the stage lights down to the chest on "peito"
at(9.96, 'palco', x => { const s = stage6(x); const L = x.L; const r = rock(x, s, 0, 1.0, -4.0); sing(r, 1, x.t); tapFoot(r, x.t, 0.6); const h = hp(r); const p = r.slotPt(); const k = eio(seg(L, 0.4, 1.3));
  cam(x, [mix(-1.2, 0.3, k), mix(5.2, p.y + 0.2, k), mix(1.0, p.z + 2.3, k)], [0, mix(h.y, p.y + 0.1, k), -4.0], 50); });
// 11.66 "no FNAF 6" — fast pull-back: the whole stage with the stars
at(11.66, 'fnaf6', x => { const s = stage6(x); const L = x.L; const r = rock(x, s, 0, 1.0, -4.0); sing(r, 1, x.t); r.armL.piv.rotation.z += 2.3 * eo(seg(L, 0, 0.3)); const k = eo(x.u); cam(x, [0, mix(2.6, 2.9, k), mix(0.6, 5.0, k)], [0, 2.4, -4], 52); });
// 12.48 "vai ver uma entrada de moedas" — side macro: a coin glides along and slides into the slot on "moedas"
at(12.48, 'entrada', x => { const s = stage6(x); const L = x.L; const r = rock(x, s, 0, 1.0, -4.0); const sp = r.slotPt(); const c = x.FX.coin0; s.add(c); const k1 = eio(seg(L, 0.1, 0.75)), k2 = eio(seg(L, 0.75, 1.0));
  c.rotation.set(0, Math.PI / 2, 0); c.scale.setScalar(0.5); c.position.set(sp.x + mix(0.6, 0, k1), sp.y + 0.25 * Math.sin(k1 * Math.PI), sp.z + mix(0.3, 0.12, k1) - 0.2 * k2); c.visible = L < 1.05;
  cam(x, [sp.x + 0.75, sp.y + 0.15, sp.z + 0.65], [sp.x + 0.15, sp.y + 0.05, sp.z], 42); });
// 13.84 "bem no meio da carcaça" — orbit around the torso, punch on "meio"
at(13.84, 'meio', x => { const s = stage6(x); const L = x.L; const r = rock(x, s, 0, 1.0, -4.0); sing(r, 0.6, x.t); const p = r.slotPt(); const a = mix(0.9, -0.5, eio(x.u)); cam(x, [p.x + Math.sin(a) * 1.4, p.y + 0.25, p.z - 0.25 + Math.cos(a) * 1.4], [p.x, p.y + 0.1, p.z - 0.2], 46); punch(x, 0.32, 0.14); });
// ===== 5. GREED =====
// 15.28 "A Fazbear Entertainment chegou" — the round vault door swings open: mountains of Faz-Coins; the camera flies in
at(15.28, 'cofreporta', x => { const s = vault(x); const L = x.L; x.S.vaultDoor.rotation.y = mix(0.0, 1.25, eio(seg(L, 0.0, 1.0))); x.S.vaultWheel.rotation.z = -L * 3; pour(x, s); const k = eio(x.u);
  cam(x, [mix(-0.6, 0.2, k), mix(2.4, 2.8, k), mix(6.0, 2.0, k)], [mix(-0.8, 0, k), 1.8, -4], 56); });
// 16.92 "a um nível tão absurdo de ganância" — Rockstar in the vault, coins pouring, arms up; punch on "ganância"
at(16.92, 'ganancia', x => { const s = vault(x); const L = x.L; const r = rock(x, s, 0, 0, -0.6, 0); cheer(r, L, 0.15); lookCam(x, r, 0.6); pour(x, s); const h = hp(r);
  cam(x, [h.x - 0.6, h.y - 0.9, h.z + mix(3.4, 2.7, eo(x.u))], [h.x, h.y - 0.6, h.z], 50); punch(x, 1.08, 0.14); });
// 18.38 "que transformou o mascote principal" — he poses with the mic while the camera circles him low; coins rain
at(18.38, 'mascote', x => { const s = vault(x); const L = x.L; const r = rock(x, s, 0, 0, -0.6, 0); sing(r, 1, x.t); tapFoot(r, x.t, 0.7); lookCam(x, r, 0.5); rainCoins(x, s, 0, -0.6, 5, 3); const a = mix(-1.0, 0.9, eio(x.u)); const h = hp(r);
  cam(x, [h.x + Math.sin(a) * 3.2, 1.0, h.z + Math.cos(a) * 3.2], [h.x, 1.9, h.z], 54); });
// 20.06 "em um cofre ambulante" — he walks at us (tracking back), the star flashes on "cofre"
at(20.06, 'ambulante', x => { const s = vault(x); const L = x.L; const r = rock(x, s, 0, 0, 0); walkPath(r, L, -0.3, 1.8, [0, -1.6], [0, 0.6], { stride: 0.85, linear: true }); r.armR.piv.rotation.x += -1.3; bounceWalk(r, x.t, 1); r.star.material.emissiveIntensity = 0.35 + 1.6 * Math.max(0, 1 - Math.abs(L - 0.26) / 0.25);
  const h = hp(r); cam(x, [h.x + 0.4, h.y - 0.6, h.z + 2.8], [h.x, h.y - 0.8, h.z], 50); });
// ===== 6. UCN darker meaning =====
// 21.46 "Só que na Ultimate Custom Night" — back in the office: dutch low angle under the red duct rings
at(21.46, 'ucn2', x => { const s = office(x, 0.9); const L = x.L; const r = rock(x, s, 0, 0, -0.7); lookCam(x, r, 0.6); x.S.officeKey.position.x = 0.5 * Math.sin(x.t * 2); x.S.officeKey.intensity = 30; const k = eio(x.u);
  cam(x, [mix(2.2, 1.6, k), 0.6, mix(1.8, 1.2, k)], [-0.4, 2.6, -1.8], 64); x.camera.rotateZ(-0.12); });
// 23.10 "essa programação ganha um sentido" — dolly along the back desk: the CRTs flicker with static
at(23.10, 'telas', x => { const s = office(x, 0.95); const L = x.L; x.S.officeNoise(); const k = eio(x.u); cam(x, [mix(-1.4, 0.9, k), 1.5, -2.2], [mix(-1.0, 1.1, k), 1.2, -3.6], 50); x.post.glitch.value = 0.15 * Math.max(0, Math.sin(L * 20)); });
// 24.32 "muito mais sombrio" — in the dark his head tilts; the pupils light red on "sombrio"
at(24.32, 'sombrio', x => { const s = office(x, 1.1); const L = x.L; const r = rock(x, s, 0, 0, -0.7); lookCam(x, r, 0.85); r.head.rotation.z += 0.25 * eio(seg(L, 0.0, 0.5)); r.eyeRed(eo(seg(L, 0.55, 0.75))); x.S.officeKey.intensity = 12; x.S.officeWash.intensity = 10;
  const h = hp(r); cam(x, [h.x - 0.2, h.y - 0.45, h.z + mix(2.0, 1.45, eio(x.u))], [h.x, h.y - 0.05, h.z], 42); });
// ===== 7. WILLIAM =====
// 25.50 "Ali você não é um guarda comum" — William at the desk, nervous; the camera orbits around him
at(25.50, 'guarda', x => { const s = office(x); const L = x.L; const w = put(x, 'william', s, WX, 0, WZ, Math.PI); alive(w, x.t, 1); w.head.rotation.y = 0.55 * Math.sin(L * 3.4); w.setFace({ lid: 0.1, slope: -0.6 }); const h = hp(w); const a = mix(Math.PI + 0.7, Math.PI - 0.4, eio(x.u));
  cam(x, [h.x + Math.sin(a) * 2.3, h.y + 0.05, h.z + Math.cos(a) * 2.3], [h.x, h.y - 0.15, h.z], 48); });
// 27.04 "mas sim o próprio William Afton" — punch-in: the nervous face turns into a smirk
at(27.04, 'afton', x => { const s = office(x); const L = x.L; const w = put(x, 'william', s, WX, 0, WZ, Math.PI); alive(w, x.t, 1); lookCam(x, w, 0.8); const ev = seg(L, 0.75, 0.95); w.setFace({ lid: 0.1 + 0.25 * ev, slope: ev > 0.5 ? 1 : -0.6, mouth: 0 }); gesture(w, 'evil', L, 0.8, 9, 0.6, { face: false });
  const h = hp(w); cam(x, [h.x - 0.3, h.y + 0.05, h.z - mix(2.2, 1.7, eo(x.u))], [h.x, h.y - 0.05, h.z], 46); punch(x, 0.8, 0.16); });
// 28.44 "preso em um pesadelo eterno" — the nightmare: William alone in the dark, static TVs circling him; the camera spins
at(28.44, 'pesadelo', x => { const s = nightmare(x); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); alive(w, x.t, 1); gesture(w, 'scared', L, 0.2, 9, 0.9, { face: false }); w.setFace({ lid: 0, slope: -1, mouth: 0.6 }); w.noBlink = true; lookCam(x, w, 0.6);
  const a = x.t * 0.6; cam(x, [Math.sin(a) * 2.5, 1.9, Math.cos(a) * 2.5], [0, 1.4, 0], 56); });
// 29.94 "criado pela alma vingativa" — the golden spirit fades in behind him with sparks; he turns slowly
at(29.94, 'alma', x => { const s = nightmare(x); const L = x.L; const w = put(x, 'william', s, 0, 0, 0.6, 0); alive(w, x.t, 1); lookAt(w, new V3(0, 2, -2), eo(seg(L, 0.5, 1.4)) * 0.9); w.setFace({ lid: 0, slope: -1 }); w.noBlink = true;
  const g = put(x, 'golden', s, 0, 0.3 + 0.08 * Math.sin(x.t * 2), -1.6); g.head.rotation.z = 0.2; g.ghostMat.opacity = 0.5 * sm(seg(L, 0.4, 0.9)); x.live.pop(); const P = x.FX.parts; s.add(P); P.userData.update(seg(L, 0.4, 1.4), new V3(0, 1.6, -1.6));
  camMove(x, [1.1, 1.3, 2.7], [0, 1.9, -0.6], [0.8, 1.35, 2.3], [0, 2.0, -0.6], eo, 54); x.post.tint.value.set(1.05, 1.0, 0.85); });
// ===== 8. THE SPIRIT → THE ROBOT =====
// 31.58 "O espírito pegou essa função gananciosa" — in the office: the spirit streaks into the coin slot, the star flashes, his eyes light up
at(31.58, 'possui', x => { const s = office(x, 0.95); const L = x.L; const r = rock(x, s, 0, 0, -0.7); lookCam(x, r, 0.5); x.S.officeKey.intensity = 26; const sp = r.slotPt(); const k = eio(seg(L, 0.2, 1.3));
  if (k < 1) { const g = put(x, 'golden', s, mix(-1.8, sp.x, k), mix(1.4, sp.y - 0.4 * 0.08, k), mix(-2.6, sp.z, k)); g.root.scale.setScalar(mix(1.35, 0.06, k)); g.ghostMat.opacity = 0.5 * (1 - sm(seg(k, 0.75, 1))); x.live.pop(); }
  const P = x.FX.parts; s.add(P); P.userData.update(seg(L, 1.2, 1.9), sp); r.eyeRed(Math.max(0, 1 - Math.abs(L - 1.4) / 0.3)); r.star.material.emissiveIntensity = 0.35 + 2 * Math.max(0, 1 - Math.abs(L - 1.3) / 0.25);
  camMove(x, [-1.6, 1.6, 2.4], [-0.5, 1.7, -1.0], [-1.2, 1.7, 2.0], [-0.1, 1.8, -0.8], eo, 52); });
// 33.58 "do robô e transformou em tortura" — William's POV: Rockstar leans over the desk, palm out, red pupils, foot tapping impatiently
at(33.58, 'tortura', x => { const s = office(x, 1.0); const L = x.L; const r = rock(x, s, 0.0, 0, mix(-0.7, -0.15, eo(seg(L, 0, 0.8)))); r.eyeRed(1); r.torso.rotation.x += 0.16 * eo(seg(L, 0, 0.8)); palmOut(r, L, 0.3, 0.9); tapFoot(r, x.t, 1); lookCam(x, r, 0.9); x.S.officeKey.intensity = 22;
  cam(x, [WX + 0.35, 1.75, WZ - 0.15], [-0.1, 2.2, -0.3], 54); x.post.tint.value.set(1.08, 0.9, 0.9); hand(x, 1.2); punch(x, 1.18, 0.12); });
// ===== 9. PAYING =====
// 35.46 "O assassino é obrigado a pagar" — William shivering, sweat, eyes darting
at(35.46, 'obrigado', x => { const s = office(x); const L = x.L; const w = put(x, 'william', s, WX, 0, WZ, Math.PI); alive(w, x.t, 1); w.root.position.x += 0.008 * Math.sin(x.t * 47); w.setFace({ lid: 0.2, slope: -1 }); w.head.rotation.y = 0.2 * Math.sin(L * 9); lookAt(w, new V3(0, 2.3, -0.7), 0.6);
  const h = hp(w); cam(x, [h.x + 0.5, h.y - 0.15, h.z - mix(1.9, 1.5, eo(x.u))], [h.x, h.y - 0.1, h.z], 44); });
// 36.88 "exatamente cinco moedas" — top-down over the desk: William's hand slides the five coins forward one by one; the counter goes 1..5 on "5"
at(36.88, 'cinco2', x => { const s = office(x); const L = x.L; const w = put(x, 'william', s, WX, 0, WZ, Math.PI); alive(w, x.t, 0.6); const n = Math.min(4, Math.floor(L / 0.24));
  for (let i = 0; i < 5; i++) { const c = coinOnDesk(x, s, i, 1); const k = eio(seg(L, i * 0.24, i * 0.24 + 0.2)); c.position.z = DESK_Z + 0.35 - 0.4 * k; }
  const cur = x.FX['coin' + n]; aimArm(w, cur.position.x < WX ? w.armL : w.armR, cur.position.clone().add(new V3(0, 0.08, 0.1)), 1);
  cam(x, [-0.6, 2.4, 0.2], [-0.6, DESK_Y, 1.8], 54); ui(x, { type: 'coins', txt: String(Math.min(5, n + 1)), u: 0.3, v: 0.075, k: 1 + 0.15 * Math.max(0, 1 - ((L % 0.24) / 0.12)), a: 1 }); });
// 38.40 "para comprar mais alguns minutos" — the coins fly into the slot one after another (wide, from the side)
at(38.40, 'paga', x => { const s = office(x); const L = x.L; const r = rock(x, s, 0, 0, -0.7); palmOut(r, L, -1, 0.6); lookAt(r, new V3(-1, 1.1, 1.7), 0.6);
  for (let i = 0; i < 5; i++) { const k = seg(L, i * 0.12, i * 0.12 + 0.6); if (k <= 0) coinOnDesk(x, s, i, 1); else coinToSlot(x, s, i, r, k); }
  const p = r.slotPt(); cam(x, [-2.6, 1.6, 0.9], [0.0, 1.35, -0.3], 54); ui(x, { type: 'coins', txt: String(Math.max(0, 5 - Math.floor(L / 0.12 + 0.01))), u: 0.3, v: 0.075, k: 1, a: 1 }); });
// 39.38 "minutos de vida" — satisfied, he cheers with the mic and dances off through the right door
at(39.38, 'vida', x => { const s = office(x); const L = x.L; const r = rock(x, s, 0, 0, -0.7); cheer(r, L, 0.0); walkPath(r, L, 0.45, 1.1, [0, -0.7], [2.6, -1.1], { stride: 0.9 }); lookCam(x, r, 0.5 * (1 - seg(L, 0.4, 0.7)));
  camMove(x, [-0.3, 1.6, 3.0], [0.4, 1.9, -0.8], [-0.2, 1.6, 2.8], [1.4, 1.9, -1.0], eo, 54); });
// ===== 10. THE FIVE CHILDREN =====
// 40.42 "O mesmo número das cinco crianças" — macro dolly along the five coins on the desk: they start glowing one by one
at(40.42, 'brilho', x => { const s = office(x, 0.95); const L = x.L; x.S.officeKey.intensity = 18; for (let i = 0; i < 5; i++) { const c = coinOnDesk(x, s, i, 1); const gw = seg(L, 0.3 + i * 0.12, 0.5 + i * 0.12); c.children[0].material.emissiveIntensity = 0.3 + 2.5 * gw; }
  const k = eio(x.u); cam(x, [mix(-2.0, -0.2, k), DESK_Y + 0.25, DESK_Z + 0.55], [mix(-1.6, 0.0, k), DESK_Y + 0.02, DESK_Z - 0.05], 46); });
// 41.56 "crianças originais" — one by one, a soul rises out of each coin (each in its own space; the one before drifts up and away)
at(41.56, 'sobe', x => { const s = office(x, 0.95); const L = x.L; x.S.officeKey.intensity = 18; for (let i = 0; i < 5; i++) { const c = coinOnDesk(x, s, i, 1); c.children[0].material.emissiveIntensity = 2.8;
    const k = seg(L, i * 0.19, i * 0.19 + 0.34); if (k > 0 && k < 1) { const up = Math.max(0, k - 0.55) / 0.45; const sl = put(x, 'soul' + i, s, c.position.x, DESK_Y + 0.02 + Math.min(k, 0.55) * 0.3 + up * up * 2.2, c.position.z - 0.15, Math.PI); x.live.pop();
      sl.root.scale.setScalar(mix(0.05, 0.74, eo(seg(k, 0, 0.5)))); sl.ghostMat.opacity = 0.65 * sm(seg(k, 0, 0.25)) * (1 - sm(seg(k, 0.6, 1))); alive(sl, x.t, 0.5, i);
      const P = x.FX.parts; if (k < 0.5) { s.add(P); P.userData.update(k * 2, c.position); } } }
  cam(x, [mix(-1.6, -0.2, eio(x.u)), DESK_Y + 1.2, DESK_Z - 2.9], [mix(-1.5, -0.1, eio(x.u)), DESK_Y + 0.6, DESK_Z], 56); x.post.tint.value.set(0.95, 0.98, 1.08); });
// 42.58 "que ele matou no passado" — the nightmare: the five souls stand in a circle around William and stare; crane up
at(42.58, 'cerco', x => { const s = nightmare(x); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); alive(w, x.t, 1); w.setFace({ lid: 0, slope: -1, mouth: 0.6 }); w.noBlink = true; startle(w, L, 0.16, 0.6); const ct = new V3(0, 0, 0);
  for (let i = 0; i < 5; i++) { const p = ring5(ct, 2.1, i, 0.4); const sl = put(x, 'soul' + i, s, p.x, 0.12 + 0.05 * Math.sin(x.t * 2 + i), p.z, Math.atan2(-p.x, -p.z)); sl.ghostMat.opacity = 0.6 * sm(seg(L, i * 0.08, i * 0.08 + 0.3)); alive(sl, x.t, 0.5, i); lookAt(sl, hp(w), 0.8); }
  const k = eio(x.u); cam(x, [0.4, mix(1.6, 6.0, k), mix(4.2, 3.0, k)], [0, 0.8, 0], 56); x.post.tint.value.set(0.95, 0.98, 1.08); });
// ===== 11. THE HEATER =====
// 43.96 "E o único jeito de burlar essa cobrança" — William spins to the monitor; fast over-the-shoulder push
at(43.96, 'burlar', x => { const s = office(x); const L = x.L; const w = put(x, 'william', s, WX, 0, WZ, Math.PI); alive(w, x.t, 1); const T = x.S.tablet; T.visible = true; T.position.set(WX, 1.55, WZ - 0.75); T.rotation.set(-0.12, 0, 0); drawPanel(x.S, 0, 60);
  lookAt(w, T.position, eo(seg(L, 0, 0.4))); x.S.deskLight.color.set('#8ad8ff'); x.S.deskLight.intensity = 12; const h = hp(w); const k = eio(x.u); cam(x, [h.x + mix(-1.9, -1.5, k), h.y + 0.1, h.z - mix(1.9, 1.5, k)], [h.x, h.y - 0.2, h.z], 46); });
// 45.76 "é ligando o aquecedor no máximo" — the screen fills the frame: Heater ON on "aquecedor", 105° on "máximo"
at(45.76, 'aquecedor', x => { const s = office(x); const L = x.L; const T = x.S.tablet; T.visible = true; T.position.set(WX, 1.55, WZ - 0.75); T.rotation.set(-0.12, 0, 0); drawPanel(x.S, L > 0.48 ? 1 : 0, 60 + 45 * eio(seg(L, 0.5, 1.0)));
  const c = T.position; cam(x, [c.x, c.y + 0.12, c.z + mix(1.75, 1.55, eo(x.u))], [c.x, c.y, c.z], 44); punch(x, 0.48, 0.06); x.post.tint.value.set(1 + 0.12 * seg(L, 0.5, 1.1), 1, 1 - 0.1 * seg(L, 0.5, 1.1)); });
// ===== 12. FIRE =====
// 47.00 "e usando o mesmo fogo" — Springtrap in the burning room; the flames burst up on "fogo"
at(47.00, 'fogo', x => { const s = scene(x, 'fireRoom', 0.9); const L = x.L; const sp = put(x, 'spring', s, 0, 0, -1.8, 0); alive(sp, x.t, 1); gesture(sp, 'agony', L, 0.7, 9, 0.9, { face: false }); lookCam(x, sp, 0.5);
  const k = sm(seg(L, 0.65, 0.95)); fireAt(x, s, 0, -2.6, 5.0, 1.6, 3.0 * (0.35 + 0.65 * k), 3 + 6 * k); x.FX.fire.userData.fl.forEach(m => { m.visible = Math.hypot(m.position.x, m.position.z + 1.8) > 0.75; }); x.FX.fire.userData.lights.forEach(l => l.position.z = -0.6); x.bloom.strength = 0.18;
  const h = hp(sp); cam(x, [h.x - 0.5, h.y - 0.5, h.z + mix(4.2, 3.2, eo(x.u))], [h.x, h.y - 0.7, h.z], 50); punch(x, 0.8, 0.1); });
// 48.24 "que acabou com ele" — close: he collapses in the flames; the five souls watch from above, then fade
at(48.24, 'acabou', x => { const s = scene(x, 'fireRoom', 0.95); const L = x.L; const sp = put(x, 'spring', s, 0, 0, -1.8, 0); gesture(sp, 'slump', L, 0.2, 9, 1, { face: false }); sp.root.position.y -= 0.25 * eio(seg(L, 0.3, 1.0));
  fireAt(x, s, 0, -2.6, 5.0, 1.6, 3.2, 9); x.FX.fire.userData.fl.forEach(m => { m.visible = Math.hypot(m.position.x, m.position.z + 1.8) > 0.75; }); x.FX.fire.userData.lights.forEach(l => l.position.z = -0.6); x.bloom.strength = 0.18;
  const h = hp(sp); cam(x, [h.x + 0.4, h.y + 0.2, h.z + mix(2.2, 1.7, eo(x.u))], [h.x, h.y - 0.2, h.z], 46); });
// ===== 13. ENDING =====
// 49.32 "Você já tinha ligado esses pontos?" — the office glows red-hot: Rockstar fans himself, sweating, and storms out; "?"
at(49.32, 'calor', x => { const s = office(x, 0.85); const L = x.L; const r = rock(x, s, 0, 0, -0.7); fanSelf(r, x.t, eo(seg(L, 0.0, 0.3)) * (1 - seg(L, 1.2, 1.5))); walkPath(r, L, 1.1, 1.82, [0, -0.7], [-2.6, -1.1], { stride: 0.9 }); x.S.officeKey.color.set('#ff7a40');
  x.post.tint.value.set(1.15, 0.92, 0.82); bubble(x, 'q', s, r, 0.25); camMove(x, [0.4, 1.9, 2.6], [0, 2.1, -0.7], [0.0, 1.9, 2.4], [-1.4, 2.0, -0.9], eo, 50); });
// 51.14 "Comenta aí e me segue pra mais mistérios" — back on the FNAF 6 stage: he sings, coins rain, waves goodbye; crane out
at(51.14, 'final', x => { const s = stage6(x); const L = x.L; const r = rock(x, s, 0, 1.0, -4.0); sing(r, 1, x.t); wave(r, 'L', L, 0.2, 9, x.t); lookCam(x, r, 0.7); rainCoins(x, s, 0, -3.6, 6, 2.5, 0.8);
  const k = eio(x.u); cam(x, [mix(0.5, 0, k), mix(2.2, 3.4, k), mix(-1.4, 2.4, k)], [0, mix(2.6, 2.4, k), -4], 52); ui(x, hud(x, '5', 0.3)); });

export const SHOTS = shots;
export const DURATION = 53.11;
