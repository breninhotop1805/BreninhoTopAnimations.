// EP02 "Amigo imaginário" — shot list. Each shot illustrates its phrase literally (table in STORYBOARD.md); cut ~1 frame before the word.
import * as THREE from 'three';
import { walkPath, alive, gestW, eio, eo, sm, seg, mix, cl, startle, talk, sit15, reach, gesture, springE } from './act.js';
import { pose15, POSE15 } from './poses15.js';
import { SC } from './kit.js';
import { doodle } from './sets.js';
const HD = () => doodle({ ink: '#1a3a8a', size: 256 });
export const RED_WORDS = new Set([3, 6, 9, 26, 36, 48, 54, 60, 74, 83, 88, 89, 90, 95, 117, 118, 121, 127, 130, 139, 145, 148, 157, 161, 171, 173, 177, 190, 193, 211, 216, 231, 234, 237, 264, 267, 273, 281, 292, 300, 310, 312, 316, 320, 331, 337, 340, 341, 346, 357]);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// extra poses for this episode (IK targets in the character's own head/torso space)
POSE15.shout = { arms: c => [[c.armR, c.head, V(-0.5, 0.26, 0.82)], [c.armL, c.head, V(0.5, 0.26, 0.82)]], head: [-0.18, 0, 0], torso: [-0.1, 0, 0], face: { eyes: 'squeeze', mouth: 'scream', brow: 1 } };
POSE15.present = { arms: c => [[c.armL, c.torso, V(1.45, 1.25, 1.0)]], head: [0, 0.25, 0.08], face: { eyes: 'happy', mouth: 'grin' } };
POSE15.stretch = { arms: c => [[c.armR, c.torso, V(-1.25, 3.2, 0.1)], [c.armL, c.torso, V(1.25, 3.2, 0.1)]], head: [-0.2, 0, 0.08], torso: [-0.08, 0, 0], face: { eyes: 'closed', mouth: 'o' } };
POSE15.wipe = { arms: c => [[c.armR, c.head, V(-0.22, 0.62, 0.85)]], head: [0.1, 0, 0.1], face: { eyes: 'happy', mouth: 'laugh', tears: 1 } };
POSE15.handUp = { arms: c => [[c.armR, c.head, V(-0.15, 0.55, 1.5)]], head: [0.12, 0, 0] };
POSE15.lookHand = { arms: c => [[c.armL, c.torso, V(0.12, 1.15, 1.05)]], head: [0.42, 0.0, 0] };
POSE15.pointAt = { arms: c => [[c.armR, c.torso, V(-0.6, 1.5, 2.0)]], head: [0, 0, 0] };
POSE15.handsChest = { arms: c => [[c.armR, c.torso, V(-0.12, 1.3, 0.62)], [c.armL, c.torso, V(0.12, 1.3, 0.62)]], head: [0.1, 0, 0.1], face: { eyes: 'sad', mouth: 'smile', tears: 1 } };
POSE15.armsOpen = { arms: c => [[c.armR, c.torso, V(-1.3, 1.9, 0.8)], [c.armL, c.torso, V(1.3, 1.9, 0.8)]], head: [-0.15, 0, 0], face: { eyes: 'happy', mouth: 'laugh' } };
const _m4 = new THREE.Matrix4(), _qq = new THREE.Quaternion();
function flex(c, w) { if (w <= 0) return; c.root.updateMatrixWorld(true); // double biceps: hands beside the head, elbows OUT at shoulder height
  reach(c, c.armR, c.torso.localToWorld(V(-1.3, 2.5, 0.65)), w, { out: 8, back: 0 }); reach(c, c.armL, c.torso.localToWorld(V(1.3, 2.5, 0.65)), w, { out: 8, back: 0 }); }
export function makeShots(ctx) { const { C, S, P, FX, camera, grade, bloom } = ctx; const SH = []; const at = (t, name, fn, o = {}) => SH.push({ t, name, fn, ...o });
  const RY = -0.3; // road top (street)
  // ---------- helpers ----------
  const put = (x, s, c, px, pz, ry = 0, y = 0) => { s.add(c.root); c.root.position.set(px, y, pz); c.root.rotation.y = ry; x.live.push(c); return c; };
  const bface = b => { b.updateMatrixWorld(true); return b.parts.body.localToWorld(V(0, 0.15, b.parts.R * 0.95)); };
  const putB = (x, s, b, px, pz, ry = 0, y = 0, o = {}) => { s.add(b); b.position.set(px, y, pz); b.rotation.y = ry; x.blobs.push({ obj: b, r: b.parts.R * b.scale.x * 0.95, center: () => b.parts.body.getWorldPosition(V(0, 0, 0)), face: () => bface(b), ...o }); return b; };
  const headP = (c, dy = 0) => { c.root.updateMatrixWorld(true); return c.head.localToWorld(V(0, 0.66 + dy, 0.3)); };
  const camLook = c => Math.atan2(camera.position.x - c.root.position.x, camera.position.z - c.root.position.z);
  const faceCam = (o, k = 1) => { const p = o.root ? o.root.position : o.position; const r = o.root ? o.root : o; r.rotation.y = mix(r.rotation.y, Math.atan2(camera.position.x - p.x, camera.position.z - p.z), k); };
  function shot(x, target, dir, dist, fov = 40, o = {}) { const k = eio(x.u); const d = dist * (1 - (o.push ?? 0.05) * x.d * k); const P_ = target.clone().add(dir.clone().normalize().multiplyScalar(d)); if (o.drift) P_.add(V(o.drift * (k - 0.5), 0, 0).applyAxisAngle(V(0, 1, 0), Math.atan2(dir.x, dir.z)));
    if (o.rise) P_.y += o.rise * (k - 0.5); camera.position.copy(P_); camera.lookAt(target); camera.fov = fov; if (o.punch != null) camera.fov *= 1 - (o.pk ?? 0.12) * eo(seg(x.L, o.punch, o.punch + 0.25)); x.focus = d; }
  // constant-speed progress with short ramps (same law as walkPath)
  const prog = (L, t0, t1, ramp = 0.15) => { const u = seg(L, t0, t1), D = Math.max(0.05, t1 - t0); const r = Math.min(0.3, ramp / D), vm = 1 / (1 - r); let k, sp; if (u < r) { k = vm * u * u / (2 * r); sp = u / r; } else if (u > 1 - r) { k = 1 - vm * (1 - u) * (1 - u) / (2 * r); sp = (1 - u) / r; } else { k = vm * (u - r / 2); sp = 1; } if (u <= 0 || u >= 1) sp = 0; return { k, sp: Math.sqrt(Math.max(0, sp)) }; };
  // Bolota walking = little hops, constant speed
  function bWalk(b, L, t, t0, t1, a, bb, o = {}) { const { k, sp } = prog(L, t0, t1); b.position.x = mix(a[0], bb[0], k); b.position.z = mix(a[1], bb[1], k); const d = Math.hypot(bb[0] - a[0], bb[1] - a[1]); if (o.face !== false && d > 0.01) b.rotation.y = Math.atan2(bb[0] - a[0], bb[1] - a[1]); b.alive(t, 1 - sp); b.hop(d * k / (o.stride || 2.2) * Math.PI, sp); return sp; }
  const bArm = (b, side, ang, w = 1) => { const A = b.parts.arms[side].piv; A.rotation.z = mix(A.rotation.z, (side === 'L' ? 1 : -1) * ang, w); };
  const bWave = (b, L, a, t) => { const w = Math.max(0, gestW(L, a, 99)); bArm(b, 'L', 0.35 + 2.0 * w + 0.25 * Math.sin(t * 11) * cl(w), 1); };
  const lap = (c, w = 1) => { c.root.updateMatrixWorld(true); for (const [A, Lg] of [[c.armR, c.legR], [c.armL, c.legL]]) { const a = Lg.piv.getWorldPosition(V(0, 0, 0)), k = Lg.knee.getWorldPosition(V(0, 0, 0)); reach(c, A, a.lerp(k, 0.62).add(V(0, 0.42 * c.root.scale.y, 0)), w); } };
  // FX
  const sparks = (x, s, c, o = {}) => { const g = FX.sparks; s.add(g); g.position.copy(c); for (const h of g.children) { const ph = (h.userData.ph + x.t * (o.speed || 0.35)) % 1; const r = (o.r || 2.5) * h.userData.r * (o.inward ? 1 - ph : 0.4 + ph * 0.6); h.position.set(Math.cos(h.userData.a + ph * 2) * r, (o.up ?? 3.5) * ph - 1, Math.sin(h.userData.a + ph * 2) * r);
      const sz = (o.size || 0.35) * (1 - ph * 0.6); h.scale.setScalar(sz); h.material.opacity = (o.amt ?? 1) * Math.sin(ph * Math.PI); } };
  const zzz = (x, s, p, amt = 1) => { const g = FX.zzz; s.add(g); g.position.copy(p); for (const z of g.children) { const ph = (z.userData.ph + x.t * 0.45) % 1; z.position.set(0.9 * ph + 0.3 * Math.sin(ph * 6), 2.2 * ph, 0); z.scale.setScalar((0.5 + ph * 0.7) * amt); z.material.opacity = Math.sin(ph * Math.PI) * amt; } };
  const bubble = (x, s, spr, p, a, sz = 1.3) => { if (x.L < a) return; s.add(spr); spr.position.copy(p); const k = springE(seg(x.L, a, a + 0.35)); spr.scale.setScalar(sz * k); spr.position.y += 0.15 * Math.sin(x.t * 3); };
  const sepia = (x, k = 1) => { grade.sepia.value = k; grade.sat.value = mix(1.12, 0.85, k); };
  // ---------- shot list (time = word onset − 0.04) ----------
  // 1 "Nesta cidade," — hero + Bolota walking down the colourful street, straight at the camera
  at(0.0, 'abertura', x => { const s = S.street; const h = put(x, s, C.hero, 0, 14, 0, RY); walkPath(h, x.L, -0.6, 1.4, [-9.5, 14.4], [-3.2, 14.4], { stride: 2.5 }); h.setFace({ eyes: 'happy', mouth: 'grin' }); alive(h, x.t, 0.5);
    const b = putB(x, s, P.bol, 0, 9.4, 0, RY); bWalk(b, x.L, x.t, -0.6, 1.4, [-13.5, 9.4], [-7.2, 9.4]); b.set({ face: 'grin' });
    shot(x, V(h.root.position.x - 1.4, 3.6, 12.6), V(0.95, 0.02, 0.6), 17.0, 42, { push: 0.07 }); return s; });
  // 2 "amigos imaginários são de verdade" — Bolota waves to camera, hero presents him; punch on "verdade"
  at(1.06, 'apresenta', x => { const s = S.street; const h = put(x, s, C.hero, -3.0, 14.6, 0.55, RY); alive(h, x.t, 1, 1); pose15(h, 'present', gestW(x.L, 0.1, 99), x.t);
    const b = putB(x, s, P.bol, -6.8, 10.6, 0.35, RY); b.alive(x.t); bWave(b, x.L, 0.2, x.t); b.set({ face: x.L > 1.3 ? 'grin' : 'smile', look: [0.2, 0] });
    shot(x, V(-4.6, 3.9, 12.6), V(0.2, 0.06, 1), 16.5, 42, { push: 0.05, punch: 1.42 }); return s; });
  // 3 "e eles somem" — a girl hugs her little purple friend: it shrinks into sparkles
  at(3.33, 'somem', x => { const s = S.street; const g = put(x, s, C.menina, 22, 13.5, -0.25, RY); alive(g, x.t, 1, 3); const m = P.minis[0]; const k = sm(seg(x.L, 0.25, 0.95));
    const mp = V(24.5, RY + 0.0, 15.2); putB(x, s, m, mp.x, mp.z, -0.6, RY, { noFrame: true }); m.scale.setScalar(0.42 * (1 - 0.85 * k)); m.alive(x.t); m.set({ body: 1 - k, face: 'smile', eyes: 1 - k, mouth: 1 - k * 0.8 });
    g.setFace({ eyes: k > 0.2 ? 'wide' : 'happy', mouth: k > 0.2 ? 'o' : 'smile', brow: k > 0.2 ? -0.5 : null }); if (x.L > 0.5) g.head.rotation.y += -0.3 * sm(seg(x.L, 0.5, 0.9));
    sparks(x, s, V(mp.x, RY + 1.2, mp.z), { r: 1.2, up: 2.5, amt: sm(seg(x.L, 0.2, 0.5)) * (1 - sm(seg(x.L, 0.8, 0.96))), size: 0.3 });
    shot(x, V(22.6, 3.2, 14.0), V(-0.15, 0.02, 1), 9.5, 40, { push: 0.07 }); return s; });
  // 4 "no dia em que você não precisa mais deles" — she runs off to play with a real friend; last sparkles fade
  at(4.29, 'nao_precisa', x => { const s = S.street; const g = put(x, s, C.menina, 22, 13.5, 0, RY); const a = put(x, s, C.amiga, 27.6, 15.6, -1.4, RY); walkPath(g, x.L, 0.3, 1.9, [22, 13.5], [25.0, 14.3], { stride: 2.4, run: 0.6 }); g.setFace({ eyes: 'happy', mouth: 'laugh' });
    alive(a, x.t, 1, 4); a.root.rotation.y = -1.6; pose15(a, 'armsOpen', gestW(x.L, 0.4, 99), x.t, { mirror: true });
    sparks(x, s, V(23.4, RY + 2.0, 14.6), { r: 0.8, up: 3.0, amt: 0.6 * (1 - sm(seg(x.L, 0.2, 1.4))), size: 0.22 });
    shot(x, V(25.0, 3.5, 14.5), V(0.1, 0.12, 1), 14.0, 42, { push: -0.05 }); return s; });
  // 5 "Hoje de manhã" — bedroom, sun through the window, hero wakes up stretching in bed
  at(6.52, 'manha', x => { const s = S.bed; const h = put(x, s, C.hero, 6.5, -8.3, 0, 0); sit15(h, SC.bed + 0.15); h.root.position.z = -8.6; pose15(h, 'stretch', gestW(x.L, 0.05, 99, 0.5), x.t); h.allowObst = new Set(['cama']);
    shot(x, V(6.0, 4.6, -7.6), V(-0.35, 0.05, 1), 9.0, 40, { push: 0.06 }); return s; });
  // 6 "eu consegui ver a parede" — he looks over and freezes: startle
  at(7.42, 've', x => { const s = S.bed; const h = put(x, s, C.hero, 6.5, -8.6, 0, 0); sit15(h, SC.bed + 0.15); h.allowObst = new Set(['cama']); h.root.rotation.y = mix(0, -0.9, sm(seg(x.L, 0, 0.45))); startle(h, x.L, 0.45, 0.8); h.hip.position.y = Math.max(h.hip.position.y, SC.bed + 0.2);
    shot(x, headP(h, -0.4), V(-0.75, 0.05, 1), 7.0, 40, { push: 0.06, punch: 0.45 }); return s; });
  // 7 "através do meu" — POV: Bolota semi-transparent, the rocket picture visible through him
  at(8.25, 'transparente_manha', x => { const s = S.bed; const b = putB(x, s, P.bol, -2.5, -6.0, 0.15, 0); b.alive(x.t); b.set({ body: 0.42, belly: 0.42, face: 'smile', look: [0.4, 0] }); bArm(b, 'L', 0.5 + 0.1 * Math.sin(x.t * 2));
    shot(x, V(-2.5, 4.3, -6.0), V(0.3, 0.02, 1), 13.0, 40, { push: 0.04 }); return s; });
  // 8 "Aqui, todo mundo tem um" — street wide: everybody walks with a little friend
  at(9.54, 'todo_mundo', x => { const s = S.street; const pp = [[C.adults[0], -5.0, 11.2, 1.3, 0], [C.kids[2], -1.5, 18.0, -1.4, 1], [C.adults[1], 2.5, 11.4, 1.4, 2], [C.kids[1], 5.5, 18.6, -1.3, 3]];
    pp.forEach(([c, px, pz, ry, i]) => { pz += 0;  const dir = Math.sign(Math.sin(ry)); const p0 = [px - dir * 1.5, pz], p1 = [px + dir * 1.5, pz]; put(x, s, c, px, pz, ry, RY); c.noFrame = true; walkPath(c, x.L, -0.2, 1.8, p0, p1, { stride: 2.3 }); c.setFace({ eyes: 'happy', mouth: 'smile' });
      const m = P.minis[i]; const fx = c.root.position.x - dir * 0.3, fz = pz + 3.4; putB(x, s, m, fx, fz, ry, RY, { noFrame: true }); m.alive(x.t + i); m.hop(x.t * 7 + i, 0.6); });
    shot(x, V(0.2, 3.0, 15.0), V(0.1, 0.5, 1), 17.0, 44, { push: -0.045 }); return s; });
  // 9 "O fisiculturista mais forte da cidade" — low angle, flexing (punch on "forte")
  at(11.05, 'maromba', x => { const s = S.street; const m = put(x, s, C.maromba, 8, 14.5, 0.15, RY); alive(m, x.t, 1, 5); flex(m, gestW(x.L, 0.08, 99)); m.setFace({ eyes: 'angry', mouth: 'grin', brow: 1 }); m.hip.position.y += 0.04 * Math.abs(Math.sin(x.t * 6));
    shot(x, V(8, 4.6, 14.5), V(0.15, -0.28, 1), 10.5, 42, { push: 0.06, punch: 1.15 }); return s; });
  // 10 "ainda anda de mão dada" — tracking close on the hands, walking
  const marombaUni = (x, s, z0, xa, xb) => { const m = put(x, s, C.maromba, 0, z0, Math.PI / 2, RY); const sp = walkPath(m, x.L, -0.6, x.d + 0.6, [xa, z0], [xb, z0], { stride: 2.7 }); m.setFace({ eyes: 'happy', mouth: 'smile' }); m.armL.piv.rotation.set(0, 0, 0);
    const u = P.uni; s.add(u); u.position.set(m.root.position.x, RY, z0 - 3.55); u.rotation.y = Math.PI / 2; const ph = (m.root.position.x - xa) / 2.7 * Math.PI * 2; u.walk(ph, sp); u.parts.arms.R.rotation.z = -0.95; u.parts.headG.rotation.y = 0.25 + 0.1 * Math.sin(x.t * 2);
    u.updateMatrixWorld(true); const hp = u.parts.arms.R.localToWorld(V(0, -1.35, 0)); reach(m, m.armL, hp, 1); x.blobs.push({ obj: u, r: 1.25, center: () => u.parts.body.getWorldPosition(V(0, 0, 0)), allow: new Set(['maromba']) }); return { m, u }; };
  at(13.13, 'mao_dada', x => { const s = S.street; const { m } = marombaUni(x, s, 14, -6, 2); const hp = m.armL.handMesh.getWorldPosition(V(0, 0, 0)); shot(x, hp.clone().add(V(0, 1.6, 0)), V(1, 0.12, -0.3), 12.5, 42, { push: 0.06 }); return s; });
  // 11 "com um unicórnio rosa" — wide 3/4: the big guy and the pink unicorn walking happily
  at(14.88, 'unicornio', x => { const s = S.street; const { m } = marombaUni(x, s, 14, -1.0, 3.8); m.head.rotation.y += -0.5; m.setFace({ eyes: 'happy', mouth: 'grin' }); shot(x, V(m.root.position.x + 0.5, 3.9, 12.2), V(1, 0.08, 0.35), 15.0, 42, { push: 0.06 }); return s; });
  // 12 "O prefeito tem um dragão" — mayor at the city hall steps, proud, points up on "dragão"
  at(15.92, 'prefeito', x => { const s = S.hall; const m = put(x, s, C.prefeito, 2, 4.8, -0.2, 0); alive(m, x.t, 1, 6); pose15(m, 'hips', gestW(x.L, 0.0, 0.95), x.t); pose15(m, 'fistUp', gestW(x.L, 1.0, 99), x.t, { face: false }); m.setFace({ eyes: 'happy', mouth: 'grin' }); if (x.L > 1.0) m.head.rotation.x += -0.35 * sm(seg(x.L, 1.0, 1.4));
    shot(x, headP(m, -0.8), V(-0.25, 0.02, 1), 9.5, 40, { push: 0.05, punch: 1.05 }); return s; });
  // 13 "que dorme em cima da prefeitura" — tilt up on the building: dragon asleep on the roof, Z z z
  at(17.40, 'dragao', x => { const s = S.hall; const d = s.userData.dragon; d.breathe(x.t); const hp = d.parts.head.getWorldPosition(V(0, 0, 0)); zzz(x, s, hp.clone().add(V(1.5, 2.0, 1.5)), 2.2); const k = eio(x.u);
    camera.position.set(mix(10, 7, k), mix(3.5, 5, k), 36 - 3 * k); camera.lookAt(0, mix(14, 24.5, k), -10); camera.fov = 48; x.focus = 44; return s; });
  // 14 "E a professora de matemática" — classroom, board MATEMÁTICA, she turns to the class
  at(19.30, 'professora', x => { const s = S.class; const p = put(x, s, C.prof, 1.6, -8.9, mix(-2.6, -0.25, sm(seg(x.L, 0.05, 0.6))), 0); alive(p, x.t, 1, 7); pose15(p, 'present', gestW(x.L, 0.45, 99), x.t, { mirror: true, face: false }); p.setFace({ eyes: 'happy', mouth: 'smile' });
    shot(x, V(0.4, 5.3, -9.5), V(0.12, 0.0, 1), 18.5, 42, { push: 0.06 }); return s; });
  // 15 "tem um amigo que só sabe contar" — the tiny yellow friend on her desk, waving
  at(20.56, 'contador', x => { const s = S.class; const p = put(x, s, C.prof, 2.0, -7.8, 0.35, 0); alive(p, x.t, 1, 7); pose15(p, 'chest', gestW(x.L, 0.1, 99), x.t); const n = P.cnt; s.add(n); n.position.set(5.4, SC.table, -6.2); n.rotation.y = -0.3; n.count(1); n.parts.hand.rotation.z = 0.3 * Math.sin(x.t * 8); n.position.y += 0.15 * Math.abs(Math.sin(x.t * 5));
    shot(x, V(4.0, 4.2, -6.8), V(0.1, 0.06, 1), 10.0, 40, { push: 0.05 }); return s; });
  // 16 "até três" — close: fingers 1… 2… 3 on the words
  at(21.98, 'conta_3', x => { const s = S.class; const n = P.cnt; s.add(n); n.position.set(5.4, SC.table, -6.2); n.rotation.y = -0.15; const c = x.L < 0.32 ? 1 : x.L < 0.56 ? 2 : 3; n.count(c); n.position.y += 0.1 * Math.abs(Math.sin(x.L * 9)); n.parts.hand.rotation.z = 0.05 * Math.sin(x.t * 6);
    shot(x, n.position.clone().add(V(0.3, 1.9, 0)), V(0.15, 0.05, 1), 4.8, 40, { push: 0.07 }); return s; });
  // 17 "Por isso, nenhuma prova dela" — insert: the test paper on a desk
  at(23.22, 'prova', x => { const s = S.class; const pp = s.userData.paper.getWorldPosition(V(0, 0, 0)); camera.position.copy(pp.clone().add(V(0.3, 5.2 - 0.6 * eio(x.u), 1.6))); camera.lookAt(pp); camera.fov = 40; x.focus = 5; return s; });
  // 18 "tem a questão quatro" — pan down the sheet to where 4 should be… nothing. "?" pops
  at(24.74, 'sem_4', x => { const s = S.class; const pp = s.userData.paper.getWorldPosition(V(0, 0, 0)); const k = eio(seg(x.L, 0, 0.6)); const tg = pp.clone().add(V(0, 0, mix(-0.2, 0.75, k))); camera.position.copy(tg.clone().add(V(0.1, 2.8, 0.7))); camera.lookAt(tg); camera.fov = 40; x.focus = 2.9;
    bubble(x, s, FX.q, tg.clone().add(V(0.45, 0.6, 0.1)), 0.55, 0.7); return s; });
  // 19 "O meu se chama Bolota" — hero presents him; Bolota grins and waves (punch on "Bolota")
  at(25.72, 'bolota', x => { const s = S.plaza; const h = put(x, s, C.hero, 3.0, 7.2, -0.35, 0); alive(h, x.t, 1, 1); pose15(h, 'present', gestW(x.L, 0.05, 99), x.t, { mirror: true }); const b = putB(x, s, P.bol, -2.8, 5.4, 0.25, 0); b.alive(x.t); bWave(b, x.L, 0.95, x.t); b.set({ face: x.L > 1.0 ? 'grin' : 'smile' });
    shot(x, V(0.3, 4.1, 6.2), V(0, 0.05, 1), 19.5, 42, { push: 0.05, punch: 1.1, pk: 0.06 }); return s; });
  // 20 "redondo" — Bolota bounces (squash & stretch), camera orbits
  at(27.63, 'redondo', x => { const s = S.plaza; const b = putB(x, s, P.bol, 0, 5.5, 0, 0); b.alive(x.t); const u = seg(x.L, 0.05, 0.7); const hgt = Math.sin(u * Math.PI); b.position.y = 1.4 * hgt; const sq = u <= 0 || u >= 1 ? 1 - 0.12 * Math.exp(-(x.L - 0.7) * 6) * (x.L > 0.7 ? 1 : 0) : 1 + 0.08 * hgt;
    b.parts.body.scale.set(1 / Math.sqrt(sq), 0.98 * sq, 0.92 / Math.sqrt(sq)); b.parts.face.scale.copy(b.parts.body.scale); b.set({ face: 'grin' }); const a = mix(-0.5, 0.35, eio(x.u)); shot(x, V(0, 3.6, 5.5), V(Math.sin(a), 0.1, Math.cos(a)), 13.5, 40, { push: 0.0 }); return s; });
  // 21 "azul" — close on the blue face, soft blue glow
  at(28.40, 'azul', x => { const s = S.plaza; const b = putB(x, s, P.bol, 0, 5.5, 0, 0); b.alive(x.t); b.set({ face: 'smile', look: [0, 0.2] }); bloom.strength = 0.35; shot(x, bface(b).add(V(0, 0.1, 0)), V(0.1, 0.02, 1), 7.5, 40, { push: 0.08 }); return s; });
  // 22 "do tamanho de uma geladeira" — kitchen: Bolota next to the fridge — same height (pan fridge → Bolota)
  at(29.05, 'geladeira', x => { const s = S.kitchen; const b = putB(x, s, P.bol, 1.8, -6.2, -0.15, 0, { noFrame: x.L < 0.7 }); b.alive(x.t, 0.4); b.set({ face: 'grin', look: [-0.6, 0] }); bArm(b, 'R', 0.6 + 0.4 * sm(seg(x.L, 0.5, 0.9)));
    const k = eio(x.u); camera.position.set(mix(-4.5, -0.2, k), 3.6, 11.5); camera.lookAt(mix(-2.8, -0.4, k), 3.4, -7.0); camera.fov = 42; x.focus = 17; return s; });
  // 23 "e ele me acompanha desde que eu me entendo por gente" — sepia flashback: little hero holding Bolota's hand
  at(30.42, 'flash_peq', x => { const s = S.plaza; sepia(x); const h = put(x, s, C.heroP, 0, 7.5, Math.PI / 2, 0); walkPath(h, x.L, -0.4, 1.9, [-7, 7.5], [-1.5, 7.5], { stride: 1.8 }); h.setFace({ eyes: 'happy', mouth: 'grin' });
    const b = putB(x, s, P.bol, 0, 3.6, Math.PI / 2, 0); bWalk(b, x.L, x.t, -0.4, 1.9, [-7, 3.6], [-1.5, 3.6]); b.set({ face: 'smile' }); if (x.L > 2.0) { b.rotation.y = mix(Math.PI / 2, 0.6, sm(seg(x.L, 2.0, 2.4))); h.root.rotation.y = mix(Math.PI / 2, 2.6, sm(seg(x.L, 2.0, 2.4))); }
    bArm(b, 'R', 1.25); b.updateMatrixWorld(true); const hp = b.parts.arms.R.meshes[1].getWorldPosition(V(0, 0, 0)); if (x.L < 2.0) reach(h, h.armL, hp, 1); x.blobs[0].allow = new Set(['heroiPeq']);
    shot(x, V(h.root.position.x + 0.3, 3.0, 4.0), V(0.25, 0.08, 1), 17.5, 42, { push: 0.04 }); return s; });
  // 24 "Quando eu mudei de escola" — new school: hero walks up to the door, Bolota beside
  at(33.22, 'escola_nova', x => { const s = S.school; const h = put(x, s, C.hero, 0, 0, 0, 0); walkPath(h, x.L, -0.6, 1.1, [-1.8, 13], [-1.4, 7.0], { stride: 2.4 }); h.setFace({ eyes: 'normal', mouth: 'flat', brow: -0.3, look: [0, -0.4] });
    const b = putB(x, s, P.bol, 0, 0, 0, 0); bWalk(b, x.L, x.t, -0.6, 1.1, [3.4, 14.5], [3.4, 9.0]); b.set({ face: 'smile' }); shot(x, V(0.8, 6.5, 2), V(0.05, 0.12, 1), 25.0, 42, { push: 0.06 }); return s; });
  // 25 "e ninguém sentava comigo" — cafeteria: alone at the table, the others at another table
  const cafeKids = (x, s, laugh = false) => { const K = C.kids; [[K[0], -10, -9.0, 0], [K[1], -6, -9.0, 0], [K[4], -2, -9.0, 0], [K[3], -8, -4.0, Math.PI], [K[5], -3.5, -4.0, Math.PI]].forEach(([c, px, pz, ry], i) => { put(x, s, c, px, pz, ry, 0); c.noFrame = true; sit15(c, SC.seat); alive(c, x.t, 1, i); c.root.position.z = pz + (ry ? 0.3 : -0.3); talk(c, x.t + i, laugh ? 0 : (i % 2) * 0.8); if (laugh) pose15(c, 'laugh', 0.8, x.t); c.allowObst = new Set(['mesa']); }); };
  at(34.20, 'sozinho_cantina', x => { const s = S.cafe; cafeKids(x, s); const h = put(x, s, C.hero, -1.0, -0.75, 0, 0); sit15(h, SC.seat); h.root.position.z = -0.8; h.allowObst = new Set(['mesa']); alive(h, x.t, 0.6, 1); pose15(h, 'sad', gestW(x.L, 0.1, 99), x.t);
    shot(x, headP(h, -0.6), V(0.25, 0.12, 1), 12.5, 42, { push: 0.05 }); return s; });
  // 26 "o Bolota sentava" — Bolota plops down beside him (lands on "sentava"); hero smiles
  at(35.80, 'bolota_senta', x => { const s = S.cafe; cafeKids(x, s); const h = put(x, s, C.hero, -1.0, -0.8, 0, 0); sit15(h, SC.seat); h.root.position.z = -0.8; h.allowObst = new Set(['mesa']); alive(h, x.t, 0.6, 1); h.head.rotation.y += -0.5 * sm(seg(x.L, 0.5, 0.9)); h.setFace(x.L > 0.62 ? { eyes: 'happy', mouth: 'grin' } : { eyes: 'sad', mouth: 'frown' });
    const b = putB(x, s, P.bol, 4.6, -1.3, -0.2, 0, { allowObst: new Set(['mesa']), noFrame: x.L < 0.4 }); const u = seg(x.L, 0.05, 0.58); b.alive(x.t); const land = SC.seat - 0.35 + 0.0; b.position.y = land + 2.2 * Math.sin(u * Math.PI) * (1 - u * 0.4) + (1 - u) * 0.0; b.position.x = mix(7.0, 4.6, sm(u));
    if (x.L > 0.58) { const sq = 1 - 0.12 * Math.exp(-(x.L - 0.58) * 7) * Math.cos((x.L - 0.58) * 18); b.parts.body.scale.set(1 / Math.sqrt(sq), 0.98 * sq, 0.92); b.parts.face.scale.copy(b.parts.body.scale); } b.set({ face: 'grin' });
    shot(x, V(1.9, 3.8, -1.0), V(0.1, 0.1, 1), 17.5, 42, { push: 0.05 }); return s; });
  // 27 "Quando eu chorava de noite" — night, moonlight: crying in bed
  at(37.05, 'chora', x => { const s = S.bedN; const h = put(x, s, C.hero, 6.5, -8.6, 0, 0); sit15(h, SC.bed + 0.15); h.allowObst = new Set(['cama']); pose15(h, 'coverFace', gestW(x.L, 0.05, 99), x.t);
    shot(x, headP(h, -0.5), V(-0.3, 0.08, 1), 8.5, 40, { push: 0.06 }); return s; });
  // 28 "ele fingia que roncava" — Bolota "asleep" on the floor, giant snore, Z z z
  at(38.39, 'ronca', x => { const s = S.bedN; const b = putB(x, s, P.bol, 2.0, -2.0, 0.5, 0); b.alive(x.t * 0.6, 2.5); const br = Math.sin(x.t * 3.2); b.parts.body.scale.set(1 + 0.04 * br, 0.98 + 0.05 * br, 0.92); b.parts.face.scale.copy(b.parts.body.scale); b.set({ face: br > 0 ? 'snore' : 'closed' }); b.rotation.z = 0.06 * Math.sin(x.t * 1.6);
    zzz(x, s, bface(b).add(V(1.5, 1.5, 0)), 1.4); shot(x, bface(b), V(0.35, 0.06, 1), 10.0, 40, { push: 0.05 }); return s; });
  // 29 "pra eu rir" — hero laughs (wiping a tear)
  at(39.65, 'ri', x => { const s = S.bedN; const h = put(x, s, C.hero, 6.5, -8.6, -0.5, 0); sit15(h, SC.bed + 0.15); h.allowObst = new Set(['cama']); pose15(h, 'laugh', gestW(x.L, 0.05, 99), x.t); h.setFace({ eyes: 'happy', mouth: 'laugh', tears: 1 });
    shot(x, headP(h, -0.5), V(-0.5, 0.05, 1), 7.5, 40, { push: 0.06 }); return s; });
  // calendar insert helper (page flip on the word)
  const cal = (x, oldD, oldN, newD, newN, flipAt = 0.15) => { const s = S.bed; const c = s.userData.cal; c.set(oldD, oldN, newD, newN, eio(seg(x.L, flipAt, flipAt + 0.4))); const p = c.getWorldPosition(V(0, 0, 0)); shot(x, p, V(0.12, -0.04, 1), 6.2, 40, { push: 0.08 }); return s; };
  // 30 "Mas na segunda-feira" — calendar page flips to SEGUNDA
  at(40.31, 'segunda', x => cal(x, 'DOMINGO', 7, 'SEGUNDA', 8, 0.2));
  // 31 "o braço dele ficou transparente" — Bolota looks at his raised arm as it fades (on "transparente")
  at(41.62, 'braco', x => { const s = S.bed; const b = putB(x, s, P.bol, -2.5, -5.4, 0.25, 0); b.alive(x.t, 0.6); const k = sm(seg(x.L, 0.85, 1.3)); bArm(b, 'R', mix(0.35, 1.5, sm(seg(x.L, 0.0, 0.5)))); b.set({ armR: 1 - 0.8 * k, face: k > 0.3 ? 'worried' : 'smile', look: [-0.9, 0.1] });
    const h = put(x, s, C.hero, 2.6, -2.0, -0.8, 0); alive(h, x.t, 1, 2); if (k > 0.2) { pose15(h, 'scared', gestW(x.L, 1.0, 99), x.t); }
    shot(x, V(0.0, 4.0, -4.0), V(0.3, 0.05, 1), 17.0, 42, { push: 0.05, punch: 0.95, pk: 0.08 }); return s; });
  // 32 "Na quarta"
  at(43.61, 'quarta', x => cal(x, 'SEGUNDA', 8, 'QUARTA', 10, 0.05));
  // 33 "eu enxergava a parede através da barriga dele" — belly see-through: the picture shows through; hero hands on head
  at(44.30, 'barriga', x => { const s = S.bed; const b = putB(x, s, P.bol, -2.5, -6.0, 0.1, 0); b.alive(x.t, 0.5); b.set({ armR: 0.25, body: 0.3, belly: 0.15, face: 'worried', look: [0, -0.8] });
    const h = put(x, s, C.hero, 2.6, -2.0, -0.75, 0); alive(h, x.t, 1, 2); pose15(h, 'handsHead', gestW(x.L, 0.35, 99), x.t);
    shot(x, V(-0.4, 3.7, -4.5), V(0.3, 0.04, 1), 16.5, 42, { push: 0.04, punch: 1.72, pk: 0.08 }); return s; });
  // 34 "Na sexta"
  at(46.92, 'sexta', x => cal(x, 'QUARTA', 10, 'SEXTA', 12, 0.05));
  // 35 "só dava pra ver o sorriso" — only the smile floats in the air
  at(47.74, 'sorriso', x => { const s = S.bed; const b = putB(x, s, P.bol, -2.5, -6.0, 0.1, 0, { noFrame: true }); b.alive(x.t, 0.5); b.set({ armR: 0, armL: 0, body: 0.04, belly: 0.0, eyes: 0.15, mouth: 1, face: 'smile' }); for (const f of b.parts.feet) f.visible = false;
    const h = put(x, s, C.hero, 2.6, -2.0, -0.75, 0); alive(h, x.t, 1, 2); pose15(h, 'sad', gestW(x.L, 0.2, 99), x.t);
    shot(x, bface(b).add(V(2.3, -0.6, 1.0)), V(0.3, 0.02, 1), 14.5, 42, { push: 0.05 }); return s; });
  // 36 "Eu tentei de tudo" — determination: fist up
  at(49.33, 'tentei', x => { const s = S.bed; const h = put(x, s, C.hero, 2.0, -1.0, 0.2, 0); alive(h, x.t, 1, 3); h.setFace({ eyes: 'angry', mouth: 'grin', brow: 1 }); reach(h, h.armR, h.torso.localToWorld(V(-1.5, 3.0, 0.7)), gestW(x.L, 0.25, 99)); h.head.rotation.x += -0.1; h.setFace({ eyes: 'angry', mouth: 'open', brow: 1 }); shot(x, headP(h, -0.2).add(V(-0.4, 0, 0)), V(0.15, -0.1, 1), 10.5, 40, { push: 0.07, punch: 0.55 }); return s; });
  // 37 "Brinquei com ele o dia inteiro" — plaza: playing tag around Bolota, the day passes (time-lapse sky)
  at(50.56, 'brinca', x => { const s = S.plaza; s.userData.setTime(sm(x.u) * 0.85); const a = x.t * 2.4; const h = put(x, s, C.hero, 0, 0, 0, 0); h.root.position.set(Math.sin(a) * 5.0, 0, 10 + Math.cos(a) * 5.4); h.root.rotation.y = a + Math.PI / 2;
    { const p = x.t * 7.5; h.legR.piv.rotation.x = 0.8 * Math.sin(p); h.legL.piv.rotation.x = -0.8 * Math.sin(p); h.armR.piv.rotation.x = -0.7 * Math.sin(p); h.armL.piv.rotation.x = 0.7 * Math.sin(p); h.root.position.y = 0.15 * Math.abs(Math.cos(p)); }
    h.setFace({ eyes: 'happy', mouth: 'laugh' }); const b = putB(x, s, P.bol, 0, 10, 0, 0); b.alive(x.t); b.hop(x.t * 8, 1); b.rotation.y = Math.atan2(h.root.position.x, h.root.position.z - 10); b.set({ face: 'grin' });
    shot(x, V(-0.4, 2.5, 10), V(0.15, 0.75, 1), 30, 42, { push: 0.03 }); return s; });
  // 38 "Desenhei ele no caderno" — top close: the pencil draws Bolota on the notebook
  at(52.02, 'caderno', x => { const s = S.bed; const nb = s.userData.nb; const k = seg(x.L, 0.0, 1.5); nb.draw(k); const book = s.userData.book; const bp = book.getWorldPosition(V(0, 0, 0));
    const h = put(x, s, C.hero, -8.0, -1.6, -Math.PI / 2, 0); sit15(h, SC.seat); h.root.position.x = -8.3; h.allowObst = new Set(['carteira', 'cadeira']); h.head.rotation.x += 0.45; h.setFace({ eyes: 'normal', mouth: 'flat', brow: 0.6, look: [0, -1] });
    const ang = -Math.PI / 2 + Math.PI * 2 * Math.min(1, k / 0.45); const R = 0.45; const tgt = bp.clone().add(V(Math.sin(ang) * R * 0.95, 0.35, -Math.cos(ang) * R)); reach(h, h.armR, tgt, 1); pose15(h, 'holdFront', 0.0, x.t);
    camera.position.copy(bp.clone().add(V(1.9, 3.2, 0.9))); camera.lookAt(bp.clone().add(V(0.1, 0, 0))); camera.fov = 40; x.focus = 3.7; return s; }, { noQA: true });
  // 39 "na parede" — big doodle on the wall, crayon in hand
  at(53.69, 'parede_desenho', x => { const s = S.bed; const wd = s.userData.wd; const k = seg(x.L, -0.4, 0.8); wd.draw(k); const h = put(x, s, C.hero, -10.0, 4.0, -Math.PI / 2, 0); alive(h, x.t, 0.5, 2); h.setFace({ eyes: 'normal', mouth: 'grin', brow: 0.4 });
    const ang = -Math.PI / 2 + Math.PI * 2 * Math.min(1, k / 0.45); const tgt = V(-12.2, 5.6 - Math.cos(ang) * 1.05, 4.0 + Math.sin(ang) * 1.05); reach(h, h.armR, tgt, 1); h.head.rotation.y += -0.2;
    shot(x, V(-11.2, 5.0, 4.6), V(0.9, 0.02, 0.6), 9.0, 42, { push: 0.04 }); return s; });
  // 40 "na minha própria mão" — close on his palm: tiny Bolota drawn on it
  at(54.46, 'mao', x => { const s = S.bed; const book = s.userData.book; const bp = book.getWorldPosition(V(0, 0, 0));
    const h = put(x, s, C.hero, -8.3, -1.6, -Math.PI / 2, 0); sit15(h, SC.seat); h.allowObst = new Set(['carteira', 'cadeira']); h.head.rotation.x += 0.5; h.head.rotation.y += -0.2; h.setFace({ eyes: 'normal', mouth: 'grin', brow: 0.4, look: [0.4, -1] });
    reach(h, h.armL, V(-10.0, SC.table + 0.32, -0.15), 1); h.root.updateMatrixWorld(true); const hb = new THREE.Box3().setFromObject(h.armL.handMesh); const hp = hb.getCenter(V(0, 0, 0));
    const k = seg(x.L, 0.0, 0.9); const ang = Math.PI * 2 * Math.min(1, k / 0.45); reach(h, h.armR, hp.clone().add(V(-0.05 + Math.sin(ang) * 0.1, 0.55, -0.55 + Math.cos(ang) * 0.1)), 1);
    const dd = s.userData.hd ||= (() => { const d = HD(); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), new THREE.MeshBasicMaterial({ map: d.tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 })); m.rotation.x = -Math.PI / 2; m.rotation.z = Math.PI / 4; m.scale.setScalar(0.8); m.renderOrder = 4; d.m = m; return d; })(); dd.draw(k); s.add(dd.m); { const top = hp.clone().add(V(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize().multiplyScalar(-0.1)).add(V(0, 0, 0)); top.y = hb.min.y + (hb.max.y - hb.min.y) * 0.72; const ry = new THREE.Raycaster(top.clone().add(V(0, 2, 0)), V(0, -1, 0)); const hit = ry.intersectObject(h.armL.handMesh, false)[0]; dd.m.position.copy(hit ? hit.point.add(V(0, 0.012, 0)) : top); }
    camera.position.copy(hp.clone().add(V(1.1, 2.3, 0.9))); camera.lookAt(hp.clone().add(V(0, 0, -0.05))); camera.fov = 40; x.focus = 2.7; return s; }, { noQA: true });
  // 41 "Gritei o nome dele no meio do pátio" — schoolyard: hands around the mouth, shouting (punch)
  at(55.66, 'grita', x => { const s = S.school; const h = put(x, s, C.hero, 0, 18, 0.1, 0); alive(h, x.t, 0.6, 1); pose15(h, 'shout', gestW(x.L, 0.05, 99), x.t); h.hip.position.y += 0.03 * Math.sin(x.t * 30) * (x.L > 0.1 ? 1 : 0);
    shot(x, headP(h, -0.4), V(0.75, -0.18, 1), 8.0, 42, { push: 0.04, punch: 0.05, pk: 0.15 }); return s; });
  // 42 "e a escola inteira riu de mim" — kids all around laughing and pointing at him
  at(57.59, 'riem', x => { const s = S.school; const h = put(x, s, C.hero, 0, 18, 0.0, 0); alive(h, x.t, 0.6, 1); pose15(h, 'sad', gestW(x.L, 0.3, 99), x.t); h.setFace({ eyes: 'sad', mouth: 'frown', brow: -1, sweat: 1 });
    const K = C.kids; [[K[0], -6.2, 14.4], [K[1], -2.3, 11.6], [K[2], 2.3, 11.8], [K[3], 5.6, 13.8], [K[4], -6.2, 9.4], [K[6], -2.4, 8.0], [K[7], 2.6, 8.2], [K[5], 6.8, 10.6]].forEach(([c, px, pz], i) => { put(x, s, c, px, pz, Math.atan2(-px, 18 - pz), 0); c.noFrame = true; alive(c, x.t, 1, i);
      if (i % 2) pose15(c, 'laugh', gestW(x.L, 0.05 + i * 0.05, 99), x.t + i); else { gesture(c, 'point', x.L, 0.05 + i * 0.05, 99, 1); c.setFace({ eyes: 'happy', mouth: 'laugh' }); c.hip.position.y += 0.03 * Math.abs(Math.sin(x.t * 12 + i)); } });
    shot(x, V(0, 3.2, 13.5), V(0.0, 0.32, 1), 22.0, 44, { push: 0.05 }); return s; });
  // 43 "Nada funcionou" — sitting alone on the low wall, faded Bolota at his side
  at(59.86, 'nada', x => { const s = S.school; const h = put(x, s, C.hero, 10.0, 4.3, 0.1, 0); sit15(h, SC.seat); h.root.position.z = 3.6; h.allowObst = new Set(['muretinha']); alive(h, x.t, 0.5, 1); pose15(h, 'sad', gestW(x.L, 0.0, 99), x.t);
    const b = putB(x, s, P.bol, 15.4, 7.6, -0.5, 0); b.alive(x.t, 0.5); b.set({ body: 0.25, belly: 0.2, armR: 0.2, armL: 0.2, face: 'worried', eyes: 0.6, mouth: 0.6, look: [-0.8, -0.3] }); shot(x, V(12.6, 3.4, 5.0), V(0.1, 0.1, 1), 16.5, 42, { push: 0.05 }); return s; });
  // 44 "E todo dia, depois da aula" — the school door opens, he walks out
  at(60.95, 'saida', x => { const s = S.school; const d = s.userData.school.door; d.set(sm(seg(x.L, -0.45, 0.3))); const h = put(x, s, C.hero, 0, -3, 0, 0); walkPath(h, x.L, 0.25, 1.85, [0, -6.0], [0, 3.6], { stride: 2.4 }); h.setFace({ eyes: 'normal', mouth: 'flat' }); shot(x, V(0, 4.4, 1.0), V(0.3, 0.06, 1), 15.0, 42, { push: 0.06 }); return s; });
  // 45 "ele fazia a mesma coisa" — faded Bolota takes his hand and pulls him along
  at(62.76, 'leva', x => { const s = S.school; const h = put(x, s, C.hero, 0, 6, 0, 0); const b = putB(x, s, P.bol, 4.8, 6, Math.PI / 2, 0, { allow: new Set(['heroi']) }); b.set({ body: 0.45, belly: 0.4, face: 'smile' });
    bWalk(b, x.L, x.t, 0.25, x.d + 0.5, [4.8, 6.2], [10.5, 6.2]); walkPath(h, x.L, 0.35, x.d + 0.6, [0.2, 6.6], [5.7, 6.6], { stride: 2.4 }); if (x.L < 0.35) h.root.rotation.y = mix(0, Math.PI / 2, sm(seg(x.L, 0, 0.35)));
    bArm(b, 'R', 1.1); b.updateMatrixWorld(true); const hp = b.parts.arms.R.meshes[1].getWorldPosition(V(0, 0, 0)); reach(h, h.armL, hp, sm(seg(x.L, 0.05, 0.35))); h.setFace({ eyes: 'normal', mouth: 'smallo' });
    shot(x, V((h.root.position.x + b.position.x) / 2 + 1.6, 3.8, 6.2), V(0.3, 0.05, 1), 21.0, 42, { push: 0.04 }); return s; });
  // 46 "Me levava até o mesmo banco da praça" — plaza: walking to THE bench (it lands in the centre on "banco")
  at(64.39, 'banco', x => { const s = S.plaza; const h = put(x, s, C.hero, 0, 0, 0, 0); const b = putB(x, s, P.bol, 0, 0, 0, 0, { allow: new Set(['heroi']) }); b.set({ body: 0.45, belly: 0.4, face: 'smile' });
    bWalk(b, x.L, x.t, -0.3, 1.6, [-13.5, 4.6], [-7.4, 4.6]); walkPath(h, x.L, -0.3, 1.6, [-12.0, 8.2], [-5.6, 8.2], { stride: 2.4 }); bArm(b, 'R', 1.1); b.updateMatrixWorld(true); const hp = b.parts.arms.R.meshes[1].getWorldPosition(V(0, 0, 0)); reach(h, h.armL, hp, 1);
    const k = eio(x.u); const mx = (h.root.position.x + b.position.x) / 2; camera.position.set(mx + 2 + 3 * k, 5.0, 22); camera.lookAt(mx + 2.2 * k, 3.0, 4); camera.fov = 42; x.focus = 18; return s; });
  // 47 "e dizia, espera mais um pouco" — Bolota (faded) talking, hand raised: "wait"; hero seated
  at(66.39, 'espera', x => { const s = S.plaza; const h = put(x, s, C.hero, 1.6, -0.3, 0, 0); sit15(h, SC.seat); h.root.position.z = -0.25; h.allowObst = new Set(['banco']); h.noFrame = true; alive(h, x.t, 0.5, 1); h.head.rotation.y += -0.5; h.setFace({ eyes: 'normal', mouth: 'flat', look: [-0.8, 0.3] });
    const b = putB(x, s, P.bol, -6.6, 3.2, 0.5, 0); b.alive(x.t); b.set({ body: 0.5, belly: 0.45, face: 'talk', talk: Math.max(0, Math.sin(x.t * 16)) * (x.L > 0.85 ? 1 : 0) }); bArm(b, 'R', mix(0.35, 1.9, springE(seg(x.L, 0.8, 1.2)))); b.parts.arms.R.piv.rotation.x = -0.6 * springE(seg(x.L, 0.8, 1.2));
    shot(x, bface(b).add(V(1.6, -0.6, 0)), V(0.15, 0.04, 1), 12.5, 42, { push: 0.05 }); return s; });
  // 48 "Eu nunca entendi por quê" — on the bench: shrug + "?"
  at(68.20, 'por_que', x => { const s = S.plaza; const h = put(x, s, C.hero, 1.6, -0.25, 0, 0); sit15(h, SC.seat); h.allowObst = new Set(['banco']); alive(h, x.t, 0.5, 1); pose15(h, 'shrug', gestW(x.L, 0.2, 99), x.t); bubble(x, s, FX.q, headP(h, 1.4).add(V(0.5, 0, 0)), 0.9, 1.1);
    shot(x, headP(h, -0.7), V(0.2, 0.05, 1), 9.0, 40, { push: 0.06 }); return s; });
  // 49 "Até o dia em que um menino novo" — a new boy walks into the plaza, alone, head down
  at(69.81, 'menino_novo', x => { const s = S.plaza; const n = put(x, s, C.novo, 0, 0, 0, 0); walkPath(n, x.L, -0.3, x.d + 0.2, [13, 7.5], [6.2, 3.2], { stride: 2.2 }); n.setFace({ eyes: 'sad', mouth: 'frown', brow: -0.8, look: [0, -0.8] }); n.head.rotation.x += 0.25;
    shot(x, headP(n, -1.2), V(-0.55, 0.08, 1), 12.0, 42, { push: 0.04 }); return s; });
  // 50 "sentou naquele banco" — he sits at the other end of the bench; hero looks
  at(71.52, 'senta', x => { const s = S.plaza; const h = put(x, s, C.hero, -1.9, -0.25, 0, 0); sit15(h, SC.seat); h.allowObst = new Set(['banco']); alive(h, x.t, 0.5, 1); h.head.rotation.y += 0.5 * sm(seg(x.L, 0.3, 0.8)); h.setFace({ eyes: 'normal', mouth: 'smallo', look: [0.8, 0] });
    const n = put(x, s, C.novo, 1.9, -0.25, 0, 0); const k = sm(seg(x.L, -0.15, 0.35)); sit15(n, SC.seat, k); n.root.position.z = mix(1.3, -0.25, k); n.allowObst = new Set(['banco']); alive(n, x.t, 0.5, 2); pose15(n, 'sad', 1, x.t); n.root.rotation.y = mix(0.6, 0, k);
    shot(x, V(0, 3.6, 0), V(0.05, 0.12, 1), 14.0, 42, { push: 0.05 }); return s; });
  // 51 "Ele estava sozinho" — close: the new boy alone, no friend beside him
  at(72.84, 'sozinho_novo', x => { const s = S.plaza; const n = put(x, s, C.novo, 1.9, -0.25, 0, 0); sit15(n, SC.seat); n.allowObst = new Set(['banco']); alive(n, x.t, 0.5, 2); pose15(n, 'sad', 1, x.t); shot(x, headP(n, -0.6), V(0.35, 0.05, 1), 7.5, 40, { push: 0.06 }); return s; });
  // 52 "igual eu ficava" — sepia callback: hero alone at the cafeteria table
  at(74.02, 'igual_eu', x => { const s = S.cafe; sepia(x); cafeKids(x, s); const h = put(x, s, C.hero, -1.0, -0.8, 0, 0); sit15(h, SC.seat); h.allowObst = new Set(['mesa']); pose15(h, 'sad', 1, x.t); shot(x, headP(h, -0.6), V(-0.25, 0.12, 1), 10.0, 42, { push: 0.07 }); return s; });
  // bench pair helper
  const pair = (x, s, o = {}) => { const h = put(x, s, C.hero, -2.1, -0.25, 0, 0), n = put(x, s, C.novo, 2.1, -0.25, 0, 0); for (const c of [h, n]) { sit15(c, SC.seat); c.allowObst = new Set(['banco']); lap(c); } alive(h, x.t, 0.5, 1); alive(n, x.t, 0.5, 2); return { h, n }; };
  // 53 "A gente começou a conversar" — they turn to each other and talk (outer-arm gestures)
  at(74.86, 'conversa', x => { const s = S.plaza; const { h, n } = pair(x, s); h.root.rotation.y = 0.25; n.root.rotation.y = -0.25; talk(h, x.t, x.L < 0.8 ? 1 : 0); talk(n, x.t + 1, x.L > 0.7 ? 1 : 0); h.setFace({ eyes: 'normal', mouth: 'smile' }); n.setFace({ eyes: 'normal', mouth: 'smallo' }); pose15(h, 'chest', gestW(x.L, 0.2, 1.1) * 0.8, x.t, { face: false });
    shot(x, V(0, 3.5, -0.25), V(0.6, 0.08, 1), 12.5, 40, { push: 0.06 }); return s; });
  // 54 "depois a rir" — both laughing
  at(76.55, 'rindo', x => { const s = S.plaza; const { h, n } = pair(x, s); h.root.rotation.y = 0.25; n.root.rotation.y = -0.25; pose15(h, 'laugh', gestW(x.L, 0.05, 99), x.t); pose15(n, 'laugh', gestW(x.L, 0.12, 99), x.t + 0.5); shot(x, V(-0.4, 3.6, -0.25), V(-0.6, 0.06, 1), 12.5, 40, { push: 0.07, punch: 0.5, pk: 0.06 }); return s; });
  // 55 "Depois, a gente nem viu a hora passar" — wide time-lapse: sky to sunset, plaza clock spinning
  at(77.44, 'hora_passa', x => { const s = S.plaza; s.userData.setTime(sm(x.u)); const hh = 3 + 3 * x.u; for (const ck of [s.userData.pclock, s.userData.pclock2]) ck.set(hh, (hh % 1) * 60 + x.u * 160);
    const { h, n } = pair(x, s); h.root.rotation.y = 0.25; n.root.rotation.y = -0.25; talk(h, x.t, Math.sin(x.t * 2) > 0 ? 1 : 0); talk(n, x.t + 1, Math.sin(x.t * 2) <= 0 ? 1 : 0); n.head.rotation.z += 0.15 * Math.sin(x.t * 3); h.setFace({ eyes: 'happy', mouth: 'smile' }); n.setFace({ eyes: 'happy', mouth: 'smile' });
    const k = eio(x.u); camera.position.set(mix(-4, 4, k), 6.5, 24); camera.lookAt(2, 5.5, -2); camera.fov = 42; x.focus = 24; return s; });
  // 56 "Quando eu olhei pro lado" — hero turns his head (slow, 0.5 s)
  at(79.70, 'olha_lado', x => { const s = S.plaza; s.userData.setTime(1); const { h, n } = pair(x, s); n.noFrame = true; h.root.rotation.y = 0.3; n.root.rotation.y = -0.35; talk(n, x.t, 0.6); n.setFace({ eyes: 'happy', mouth: 'smile' }); h.head.rotation.y += mix(0.1, -1.1, sm(seg(x.L, 0.35, 0.95))); h.setFace({ eyes: 'normal', mouth: 'smile', look: [-0.9 * sm(seg(x.L, 0.35, 0.95)), 0] });
    shot(x, headP(h, -0.4), V(-0.25, 0.04, 1), 7.5, 40, { push: 0.06 }); return s; });
  // 57 "o Bolota estava quase sumindo" — behind the bench, almost gone, sparkles rising off him
  at(81.12, 'quase_sumindo', x => { const s = S.plaza; s.userData.setTime(1); const { h, n } = pair(x, s); n.noFrame = true; h.head.rotation.y += -0.9; h.setFace({ eyes: 'wide', mouth: 'o' }); n.setFace({ eyes: 'happy', mouth: 'smile' });
    const b = putB(x, s, P.bol, -8.5, -3.6, 0.5, 0); b.alive(x.t, 0.6); b.set({ body: 0.16, belly: 0.1, armR: 0.16, armL: 0.16, eyes: 0.7, mouth: 0.8, face: 'smile' }); sparks(x, s, b.parts.body.getWorldPosition(V(0, 0, 0)).add(V(0, -1.5, 0)), { r: 3.0, up: 6, amt: 0.6, size: 0.4 });
    shot(x, V(-4.4, 3.8, -2.2), V(0.15, 0.06, 1), 17.5, 42, { push: 0.05 }); return s; });
  // 58 "Ele não estava triste" — close: soft, peaceful face
  at(82.97, 'nao_triste', x => { const s = S.plaza; s.userData.setTime(1); const b = putB(x, s, P.bol, -8.5, -3.6, 0.5, 0); b.alive(x.t, 0.6); b.set({ body: 0.2, belly: 0.12, armR: 0.2, armL: 0.2, face: 'smile', look: [0.5, -0.2] }); sparks(x, s, bface(b).add(V(0, -2, -1)), { r: 2.6, up: 5, amt: 0.4, size: 0.3 });
    shot(x, bface(b), V(0.5, 0.0, 1), 8.0, 40, { push: 0.05 }); return s; });
  // 59 "Estava sorrindo" — punch-in: big smile
  at(84.24, 'sorrindo', x => { const s = S.plaza; s.userData.setTime(1); const b = putB(x, s, P.bol, -8.5, -3.6, 0.5, 0); b.alive(x.t, 0.6); b.set({ body: 0.2, belly: 0.12, armR: 0.2, armL: 0.2, face: x.L > 0.2 ? 'grin' : 'smile', look: [0.5, -0.2] }); sparks(x, s, bface(b).add(V(0, -2, -1)), { r: 2.6, up: 5, amt: 0.4, size: 0.3 });
    shot(x, bface(b), V(0.4, 0.0, 1), 6.2, 40, { push: 0.04, punch: 0.2 }); return s; });
  // 60 "Ele não sumiu porque eu parei de acreditar" — hero close: realisation, eyes wet
  at(85.25, 'acreditar', x => { const s = S.plaza; s.userData.setTime(1); const { h, n } = pair(x, s); n.noFrame = true; h.head.rotation.y += -0.6 + 0.4 * sm(seg(x.L, 0.8, 1.5)); h.setFace({ eyes: 'sad', mouth: 'flat', brow: -0.6, tears: x.L > 1.0 ? 1 : 0 }); shot(x, headP(h, -0.3), V(-0.3, 0.03, 1), 6.0, 40, { push: 0.05 }); return s; });
  // 61 "Ele sumiu porque, pela primeira vez" — wide: the two boys on the bench, faint Bolota behind them
  at(87.47, 'primeira_vez', x => { const s = S.plaza; s.userData.setTime(1); const { h, n } = pair(x, s); h.root.rotation.y = 0.3; n.root.rotation.y = -0.3; talk(n, x.t, 0.8); h.setFace({ eyes: 'happy', mouth: 'smile' }); n.setFace({ eyes: 'happy', mouth: 'grin' }); pose15(n, 'chest', gestW(x.L, 0.6, 99), x.t, { face: false, mirror: true });
    const b = putB(x, s, P.bol, -8.5, -3.6, 0.5, 0); b.alive(x.t, 0.6); b.set({ body: 0.14, belly: 0.1, armR: 0.14, armL: 0.14, eyes: 0.6, mouth: 0.7, face: 'smile' }); shot(x, V(-2.0, 4.4, -0.8), V(0.45, 0.1, 1), 23.5, 42, { push: 0.05 }); return s; });
  // 62 "eu não estava mais sozinho" — the two laughing together, close two-shot
  at(89.99, 'nao_sozinho', x => { const s = S.plaza; s.userData.setTime(1); const { h, n } = pair(x, s); h.root.rotation.y = 0.25; n.root.rotation.y = -0.25; pose15(h, 'laugh', gestW(x.L, 0.1, 99), x.t); pose15(n, 'laugh', gestW(x.L, 0.2, 99), x.t + 0.5); shot(x, V(0.4, 3.7, -0.25), V(0.5, 0.05, 1), 13.0, 40, { push: 0.07 }); return s; });
  // 63 "Ele passou meses me levando até aquele banco" — sepia montage: leaves falling, they walk to the bench again and again
  at(91.61, 'meses', x => { const s = S.plaza; sepia(x, 0.85); const h = put(x, s, C.hero, 0, 0, 0, 0); const b = putB(x, s, P.bol, 0, 0, 0, 0, { allow: new Set(['heroi']) }); b.set({ face: 'smile' });
    bWalk(b, x.L, x.t, -0.3, x.d + 0.2, [-13, 3.4], [-6.0, 3.4]); walkPath(h, x.L, -0.3, x.d + 0.2, [-11.6, 6.7], [-4.6, 6.7], { stride: 2.4 }); bArm(b, 'R', 1.1); b.updateMatrixWorld(true); reach(h, h.armL, b.parts.arms.R.meshes[1].getWorldPosition(V(0, 0, 0)), 1);
    const L_ = FX.leaves; s.add(L_); for (const l of L_.children) { const ph = (l.userData.ph + x.t * 0.25) % 1; l.position.set(-14 + ((l.userData.a * 7.3) % 18) + Math.sin(ph * 6 + l.userData.a) * 1.2, 14 - ph * 14, 9 - (l.userData.a % 9)); l.rotation.set(ph * 9, l.userData.a, ph * 5); }
    const k = eio(x.u); camera.position.set(mix(-9, -4, k), 4.6, 19); camera.lookAt(mix(-9, -3.5, k), 3.2, 2); camera.fov = 42; x.focus = 17; return s; });
  // 64 "Ele só estava esperando eu encontrar" — Bolota (faint) watching the two boys, hands on his heart-side, happy
  at(94.12, 'esperando', x => { const s = S.plaza; s.userData.setTime(1); const { h, n } = pair(x, s); h.root.rotation.y = 0.25; n.root.rotation.y = -0.25; talk(h, x.t, 0.7); h.setFace({ eyes: 'happy', mouth: 'smile' }); n.setFace({ eyes: 'happy', mouth: 'laugh' });
    h.noFrame = n.noFrame = true; const b = putB(x, s, P.bol, -8.5, -3.6, 0.8, 0); b.alive(x.t, 0.6); b.set({ body: 0.16, belly: 0.1, armR: 0.16, armL: 0.16, eyes: 0.8, mouth: 0.9, face: 'smile', look: [0.8, -0.3] }); bArm(b, 'R', 0.9); bArm(b, 'L', 0.9);
    shot(x, V(-4.0, 4.2, -2.6), V(-0.55, 0.05, 1), 17.0, 42, { push: 0.05 }); return s; });
  // 65 "um amigo de verdade" — close two-shot, new boy laughs, hero beaming (punch on "verdade")
  at(95.92, 'amigo_verdade', x => { const s = S.plaza; s.userData.setTime(1); const { h, n } = pair(x, s); h.root.rotation.y = 0.25; n.root.rotation.y = -0.25; pose15(n, 'laugh', gestW(x.L, 0.05, 99), x.t); h.setFace({ eyes: 'happy', mouth: 'grin' }); pose15(h, 'chest', gestW(x.L, 0.3, 99), x.t, {});
    shot(x, V(-0.4, 3.7, -0.25), V(-0.5, 0.05, 1), 12.5, 40, { push: 0.06, punch: 0.42, pk: 0.08 }); return s; });
  // 66 "Ele piscou pra mim" — Bolota winks (on "piscou")
  at(97.07, 'piscou', x => { const s = S.plaza; s.userData.setTime(1); const b = putB(x, s, P.bol, -8.5, -3.6, 0.5, 0); b.alive(x.t, 0.6); b.set({ body: 0.2, belly: 0.12, armR: 0.2, armL: 0.2, face: x.L > 0.22 && x.L < 0.75 ? 'wink' : 'smile', look: [0.4, -0.2] });
    shot(x, bface(b), V(0.4, 0.0, 1), 6.5, 40, { push: 0.05, punch: 0.22, pk: 0.08 }); return s; });
  // 67 "e desapareceu" — he dissolves into sparkles that float up into the sunset (no hard cut)
  at(97.96, 'desapareceu', x => { const s = S.plaza; s.userData.setTime(1); const k = sm(seg(x.L, 0.05, 0.9)); const b = putB(x, s, P.bol, -8.5, -3.6, 0.5, 0, { noFrame: true }); b.alive(x.t, 0.6); b.set({ body: 0.2 * (1 - k), belly: 0.12 * (1 - k), armR: 0.2 * (1 - k), armL: 0.2 * (1 - k), eyes: 1 - k, mouth: 1 - k, face: 'smile' }); b.scale.setScalar(1 + 0.08 * k);
    sparks(x, s, b.parts.body.getWorldPosition(V(0, 0, 0)).add(V(0, -1.0 + 3 * k, 0)), { r: 3.0 * (1 - 0.4 * k), up: 7, amt: 1 - sm(seg(x.L, 0.8, 1.15)), size: 0.45, speed: 0.6 }); grade.flash.value = 0.04 * Math.sin(seg(x.L, 0.3, 0.9) * Math.PI);
    shot(x, V(-8.3, 4.6, -3.6), V(0.25, 0.1, 1), 12.5, 42, { push: -0.04 }); return s; });
  // 68 "Aí o menino novo olhou pro lugar onde ele estava" — the new boy turns to the empty spot
  at(99.14, 'novo_olha', x => { const s = S.plaza; s.userData.setTime(1); const { h, n } = pair(x, s); h.noFrame = true; h.root.rotation.y = 0.2; h.setFace({ eyes: 'sad', mouth: 'smile' }); n.root.rotation.y = -0.2; n.head.rotation.y += mix(0, -1.0, sm(seg(x.L, 0.9, 1.5))); n.torso.rotation.y += mix(0, -0.25, sm(seg(x.L, 0.9, 1.5))); n.setFace({ eyes: 'normal', mouth: 'smallo', look: [-0.8 * sm(seg(x.L, 0.9, 1.5)), 0] });
    sparks(x, s, V(-8.5, 5, -3.6), { r: 2.0, up: 6, amt: 0.25 * (1 - x.u), size: 0.3 }); shot(x, headP(n, -0.5), V(0.35, 0.04, 1), 8.5, 40, { push: 0.05 }); return s; });
  // 69 "e disse: que estranho" — close: puzzled, hand on chin, "?"
  at(101.68, 'estranho', x => { const s = S.plaza; s.userData.setTime(1); const { h, n } = pair(x, s); h.noFrame = true; n.root.rotation.y = -0.3; pose15(n, 'think', gestW(x.L, 0.05, 99), x.t, { mirror: true }); n.setFace({ eyes: 'normal', mouth: 'wavy', brow: 0.5, look: [-0.5, 0.3] }); bubble(x, s, FX.q, headP(n, 1.3).add(V(0.6, 0, 0)), 0.75, 1.0);
    shot(x, headP(n, -0.3), V(0.1, 0.03, 1), 7.0, 40, { push: 0.06 }); return s; });
  // 70 "Eu tive um amigo imaginário igualzinho a esse" — sepia flashback: little NEW BOY walking with… Bolota!
  at(103.32, 'twist', x => { const s = S.plaza; sepia(x); const n = put(x, s, C.novoP, 0, 7.5, Math.PI / 2, 0); walkPath(n, x.L, -0.4, x.d + 0.3, [-7.5, 7.5], [-1.4, 7.5], { stride: 1.8 }); n.setFace({ eyes: 'happy', mouth: 'grin' });
    const b = putB(x, s, P.bol, 0, 3.6, Math.PI / 2, 0, { allow: new Set(['novoPeq']) }); bWalk(b, x.L, x.t, -0.4, x.d + 0.3, [-7.5, 3.6], [-1.4, 3.6]); b.set({ face: 'grin' }); bArm(b, 'R', 1.25); b.updateMatrixWorld(true); reach(n, n.armL, b.parts.arms.R.meshes[1].getWorldPosition(V(0, 0, 0)), 1);
    shot(x, V(n.root.position.x + 1.0, 3.0, 5.6), V(0.4, 0.1, 1), 18.5, 42, { push: 0.04, punch: 1.26, pk: 0.08 }); return s; });
  // 71 "Redondo" — sepia: the same bounce
  at(105.96, 'redondo2', x => { const s = S.plaza; sepia(x); const b = putB(x, s, P.bol, 0, 5.5, 0, 0); b.alive(x.t); const u = seg(x.L, 0.05, 0.6); b.position.y = 1.2 * Math.sin(u * Math.PI); b.set({ face: 'grin' }); const a = mix(0.4, -0.3, eio(x.u)); shot(x, V(0, 3.6, 5.5), V(Math.sin(a), 0.1, Math.cos(a)), 13.5, 40, { push: 0 }); return s; });
  // 72 "azul" — the colour comes back (sepia → full blue)
  at(106.72, 'azul2', x => { const s = S.plaza; sepia(x, 1 - sm(seg(x.L, 0.0, 0.45))); const b = putB(x, s, P.bol, 0, 5.5, 0, 0); b.alive(x.t); b.set({ face: 'smile' }); bloom.strength = 0.35; shot(x, bface(b).add(V(0, 0.1, 0)), V(-0.1, 0.02, 1), 7.5, 40, { push: 0.08 }); return s; });
  // 73 "do tamanho de uma geladeira" — kitchen again (callback), this time with the little new boy beside them
  at(107.40, 'geladeira2', x => { const s = S.kitchen; const b = putB(x, s, P.bol, 1.8, -6.2, -0.15, 0); b.alive(x.t, 0.4); b.set({ face: 'grin', look: [0.6, -0.4] }); const n = put(x, s, C.novoP, -0.6, -1.4, -0.35, 0); alive(n, x.t, 1, 3); pose15(n, 'cheer', gestW(x.L, 0.2, 99), x.t);
    const k = eio(x.u); camera.position.set(mix(1.5, -0.5, k), 3.8, 13.0); camera.lookAt(mix(0.9, 0.2, k), 3.2, -4.5); camera.fov = 42; x.focus = 17; return s; });
  // 74 "Ele sumiu no dia em que me mandou sentar nesse banco" — the boy points at the bench; hero's jaw drops
  at(108.60, 'mandou_sentar', x => { const s = S.plaza; s.userData.setTime(1); const { h, n } = pair(x, s); h.root.rotation.y = 0.45; n.root.rotation.y = -0.3; pose15(n, 'pointAt', gestW(x.L, 1.5, 99), x.t, { mirror: true }); talk(n, x.t, 1); n.setFace({ eyes: 'normal', mouth: 'smile' });
    startle(h, x.L, 0.35, 0.6); h.hip.position.y = Math.max(h.hip.position.y, SC.seat + 0.05); shot(x, V(-0.1, 3.6, -0.25), V(-0.5, 0.05, 1), 13.0, 40, { push: 0.06, punch: 0.4, pk: 0.08 }); return s; });
  // 75 final: crane up — the two friends on THE bench, and Bolota's smile fading in the sunset sky
  at(110.30, 'final', x => { const s = S.plaza; s.userData.setTime(1); const { h, n } = pair(x, s); h.noFrame = n.noFrame = x.L > 1.0; h.root.rotation.y = 0.3; n.root.rotation.y = -0.3; h.head.rotation.x += -0.5 * sm(seg(x.L, 0.2, 0.8)); n.head.rotation.x += -0.5 * sm(seg(x.L, 0.3, 0.9)); h.setFace({ eyes: 'happy', mouth: 'smile' }); n.setFace({ eyes: 'happy', mouth: 'smile' });
    const b = putB(x, s, P.bol, 0, -14, 0, 14, { noFrame: true, allowObst: new Set(['árvore']) }); b.scale.setScalar(2.2); b.set({ body: 0.0, belly: 0, armR: 0, armL: 0, eyes: 0, mouth: 0.6 * sm(seg(x.L, 0.3, 1.0)) * (1 - sm(seg(x.L, 1.5, 2.1))), face: 'smile' }); for (const f of b.parts.feet) f.visible = false;
    const k = eio(x.u); camera.position.set(0, mix(4.5, 8, k), mix(14, 22, k)); camera.lookAt(0, mix(3.5, 14, k), -4); camera.fov = 44; x.focus = 18; grade.fade.value = sm(seg(x.L, 1.6, 2.1)); return s; });
  return { SHOTS: SH, DUR: 112.4 }; }
