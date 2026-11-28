// EP03 "O reflexo no espelho" — shot list. Each shot illustrates its phrase literally; cut ~1 frame before the word.
// Mirrors are REAL (Reflector). Layers: 0 = normal (also reflected), 1 = camera only (no reflection), 2 = ONLY inside mirrors.
import * as THREE from 'three';
import { walkPath, alive, gestW, eio, eo, sm, seg, mix, cl, startle, talk, sit15, reach, gesture, springE } from './act.js';
import { pose15, POSE15 } from './poses15.js';
import { SC } from './kit.js';
import { setLayer, ripple } from './mirror.js';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
POSE15.stretch = { arms: c => [[c.armR, c.torso, V(-1.25, 3.2, 0.1)], [c.armL, c.torso, V(1.25, 3.2, 0.1)]], head: [-0.2, 0, 0.08], torso: [-0.08, 0, 0], face: { eyes: 'closed', mouth: 'o' } };
POSE15.lookHands = { arms: c => [[c.armR, c.torso, V(-0.36, 1.15, 1.3)], [c.armL, c.torso, V(0.36, 1.15, 1.3)]], head: [0.5, 0, 0], face: { eyes: 'circle', mouth: 'o', brow: -0.8 } };
POSE15.pointAt = { arms: c => [[c.armR, c.torso, V(-0.6, 1.6, 2.0)]], head: [0, 0, 0] };
POSE15.bow = { arms: c => [[c.armR, c.torso, V(-0.12, 0.75, 0.7)], [c.armL, c.torso, V(0.12, 0.75, 0.7)]], head: [0.35, 0, 0], torso: [0.45, 0, 0], face: { eyes: 'sad', mouth: 'frown', brow: -1 } };
POSE15.handsBack = { arms: c => [[c.armR, c.head, V(-0.55, 0.55, -0.45)], [c.armL, c.head, V(0.55, 0.55, -0.45)]], head: [-0.15, 0, 0.1], torso: [-0.15, 0, 0], face: { eyes: 'closed', mouth: 'smile' } };
POSE15.handUp = { arms: c => [[c.armR, c.torso, V(-0.55, 3.4, 0.35)]], head: [-0.1, 0, 0.05], face: { eyes: 'happy', mouth: 'grin' } };
POSE15.carry = { arms: c => [[c.armR, c.torso, V(-0.76, 1.05, 1.05)], [c.armL, c.torso, V(0.76, 1.05, 1.05)]], torso: [0.08, 0, 0] };
POSE15.oneFinger = { arms: c => [[c.armR, c.torso, V(-0.45, 2.15, 1.1)]], head: [0, 0, 0.1], face: { eyes: 'happy', mouth: 'grin' } };
POSE15.palmGlass = { arms: c => [[c.armR, c.torso, V(-0.45, 1.9, 1.35)], [c.armL, c.torso, V(0.45, 1.9, 1.35)]], head: [0.05, 0, 0] };
POSE15.wave = { arms: c => [[c.armL, c.torso, V(1.25, 2.9, 0.4)]], head: [0, 0, -0.1], face: { eyes: 'happy', mouth: 'grin' } };
POSE15.waveR = { arms: c => [[c.armR, c.torso, V(-1.25, 2.9, 0.4)]], head: [0, 0, 0.1], face: { eyes: 'happy', mouth: 'grin' } };
POSE15.raiseR = { arms: c => [[c.armR, c.torso, V(-0.5, 3.45, 0.45)]], head: [-0.08, 0, 0.06], face: { eyes: 'happy', mouth: 'grin' } };
POSE15.raiseL = { arms: c => [[c.armL, c.torso, V(0.5, 3.45, 0.45)]], head: [-0.08, 0, -0.06] };
POSE15.armsOpenL = { arms: c => [[c.armR, c.torso, V(-1.2, 1.9, 0.8)], [c.armL, c.torso, V(1.2, 1.9, 0.8)]], head: [-0.1, 0, 0] };
export function makeShots(ctx) { const { C, S, P, FX, camera, grade, bloom } = ctx; const SH = []; const at = (t, name, fn, o = {}) => SH.push({ t, name, fn, ...o });
  // ---------- helpers ----------
  const put = (x, s, c, px, pz, ry = 0, y = 0) => { x.scene = s; s.add(c.root); c.root.position.set(px, y, pz); c.root.rotation.y = ry; x.live.push(c); return c; };
  const layer = (c, n) => { setLayer(c.root, n); c.layer = n; if (n === 2) c.mirrorOnly = true; return c; };
  const layerP = (o, n) => { setLayer(o, n); o.layerSet = n; };
  const headP = (c, dy = 0) => { c.root.updateMatrixWorld(true); return c.head.localToWorld(V(0, 0.66 + dy, 0.3)); };
  function shot(x, target, dir, dist, fov = 40, o = {}) { const k = eio(x.u); const d = dist * (1 - (o.push ?? 0.05) * x.d * k); const P_ = target.clone().add(dir.clone().normalize().multiplyScalar(d)); if (o.drift) P_.add(V(o.drift * (k - 0.5), 0, 0).applyAxisAngle(V(0, 1, 0), Math.atan2(dir.x, dir.z)));
    if (o.rise) P_.y += o.rise * (k - 0.5); camera.position.copy(P_); camera.lookAt(target); camera.fov = fov; if (o.punch != null) camera.fov *= 1 - (o.pk ?? 0.12) * eo(seg(x.L, o.punch, o.punch + 0.25)); x.focus = d; }
  // AUTO-FRAMING: every point in pts lands inside the frame (|ndc| < m); camera on direction dir from their centre; then the push-in
  const frame = (x, pts, dir, o = {}) => { const c = pts.reduce((a, p) => a.add(p), V(0, 0, 0)).multiplyScalar(1 / pts.length).add(o.off || V(0, 0, 0)); const dn = dir.clone().normalize(); camera.fov = o.fov || 42; camera.updateProjectionMatrix(); const m = o.m ?? 0.72;
    const rm = x.scene?.userData.room, inside = p => !rm || (Math.abs(p.x) < rm.W / 2 - 0.9 && Math.abs(p.z - (rm.CZ || 0)) < rm.D / 2 - 0.9 && p.y < rm.H - 0.9);
    const fits = () => { camera.updateProjectionMatrix(); camera.updateMatrixWorld(true); return pts.every(p => { const q = p.clone().project(camera); return Math.abs(q.x) < m && Math.abs(q.y) < m && q.z < 1; }); };
    let d = o.min ?? 3, entered = false; for (; d < 80; d += 0.2) { camera.position.copy(c).addScaledVector(dn, d); const ins = inside(camera.position); if (ins) entered = true; if (!ins && !entered) continue; if (!ins) { d -= 0.2; camera.position.copy(c).addScaledVector(dn, d); camera.lookAt(c); while (!fits() && camera.fov < 78) camera.fov += 1; break; } camera.lookAt(c); if (fits()) break; }
    d *= 1 - (o.push ?? 0.05) * x.d * eio(x.u); camera.position.copy(c).addScaledVector(dn, d); camera.lookAt(c); if (o.punch != null) camera.fov *= 1 - (o.pk ?? 0.1) * eo(seg(x.L, o.punch, o.punch + 0.25)); x.focus = d; };
  // where p APPEARS inside mirror g (its mirror image) — used so the reflection is always inside the frame
  const refl = (g, p) => { g.updateMatrixWorld(true); const c = g.m.getWorldPosition(V(0, 0, 0)); const n = V(0, 0, 1).applyQuaternion(g.m.getWorldQuaternion(new THREE.Quaternion())); return p.clone().addScaledVector(n, -2 * p.clone().sub(c).dot(n)); };
  const camAt = (x, pos, look, fov = 42) => { camera.position.copy(pos); camera.lookAt(look); camera.fov = fov; x.focus = pos.distanceTo(look); };
  const mir = s => s.userData.mir; const mc = (g, dy = 0) => { g.updateMatrixWorld(true); return g.m.getWorldPosition(V(0, 0, 0)).add(V(0, dy, 0)); };
  const lap = (c, w = 1) => { c.root.updateMatrixWorld(true); for (const [A, Lg] of [[c.armR, c.legR], [c.armL, c.legL]]) { const a = Lg.piv.getWorldPosition(V(0, 0, 0)), k = Lg.knee.getWorldPosition(V(0, 0, 0)); reach(c, A, a.lerp(k, 0.62).add(V(0, 0.42 * c.root.scale.y, 0)), w); } };
  const palm = (c, side = 'R') => { c.root.updateMatrixWorld(true); return new THREE.Box3().setFromObject(c['arm' + side].handMesh).getCenter(V(0, 0, 0)); };
  // a hand prop held IN the fist, pointing at a target (axis +1 = prop +y toward the target, -1 = prop -y toward it)
  const holdAt = (s, prop, c, side, target, axis = 1, off = 0) => { const p = palm(c, side); s.add(prop); prop.position.copy(p); const d = target.clone().sub(p).normalize().multiplyScalar(axis); prop.quaternion.setFromUnitVectors(V(0, 1, 0), d); prop.position.addScaledVector(d, off); };
  const carryBox = (s, c, box) => { c.root.updateMatrixWorld(true); c.torso.add(box); box.position.set(0, 1.08, 1.08); pose15(c, 'carry', 1, 0, { face: false }); };
  const sparks = (x, s, c, o = {}) => { const g = FX.sparks; s.add(g); g.position.copy(c); for (const h of g.children) { const ph = (h.userData.ph + x.t * (o.speed || 0.35)) % 1; const r = (o.r || 2.5) * h.userData.r * (o.inward ? 1 - ph : 0.4 + ph * 0.6); h.position.set(Math.cos(h.userData.a + ph * 2) * r, (o.up ?? 3.5) * ph - 1, Math.sin(h.userData.a + ph * 2) * r * (o.flat ?? 1));
      const sz = (o.size || 0.35) * (1 - ph * 0.6); h.scale.setScalar(sz); h.material.opacity = (o.amt ?? 1) * Math.sin(ph * Math.PI); } };
  const zzz = (x, s, p, amt = 1) => { const g = FX.zzz; s.add(g); g.position.copy(p); for (const z of g.children) { const ph = (z.userData.ph + x.t * 0.45) % 1; z.position.set(0.9 * ph + 0.3 * Math.sin(ph * 6), 2.2 * ph, 0); z.scale.setScalar((0.5 + ph * 0.7) * amt); z.material.opacity = Math.sin(ph * Math.PI) * amt; } };
  const bubble = (x, s, spr, p, a, sz = 1.3) => { if (x.L < a) return; s.add(spr); spr.position.copy(p); const k = springE(seg(x.L, a, a + 0.35)); spr.scale.setScalar(sz * k); spr.position.y += 0.15 * Math.sin(x.t * 3); };
  const sepia = (x, k = 1) => { grade.sepia.value = k; grade.sat.value = mix(1.12, 0.85, k); };
  const sleepIn = (x, s, c, bx_, bz, top) => { put(x, s, c, bx_, bz, 0, 0); c.root.rotation.set(-Math.PI / 2, 0, 0); c.root.position.set(bx_, top + 0.5, bz); c.allowObst = new Set(['cama']); c.setFace({ eyes: 'closed', mouth: 'smallo' }); c.torso.rotation.x += 0.03 * Math.sin(x.t * 2);
    s.add(P.blanket); P.blanket.position.set(bx_, top + 0.55, bz - 1.8); };
  const cal = (x, oldD, oldN, newD, newN, flipAt = 0.15) => { const s = S.bed; const c = s.userData.cal; c.set(oldD, oldN, newD, newN, eio(seg(x.L, flipAt, flipAt + 0.4))); const p = c.getWorldPosition(V(0, 0, 0)); shot(x, p, V(0.12, -0.04, 1), 6.2, 40, { push: 0.08 }); return s; };
  const SM = () => S.street.userData.mirX;
  // canonical mirror framings
  const camA = (x, o = {}) => shot(x, V(-2.2, 4.0, -8.6), V(3.6, 0.5, 7.0), 7.9 * (o.dist ?? 1), 42, { push: 0.04, punch: o.punch, pk: 0.08 });   // bedroom: over his shoulder into the mirror
  const camB = (x, o = {}) => shot(x, V(-1.6, 3.8, -8.8), V(1.4, 0.55, 8.0), 8.2 * (o.dist ?? 1), 42, { push: o.push ?? 0.04, punch: o.punch, pk: 0.08 });   // bedroom: mirror centre-left, boy on the right
  const camBath_unused = (x, o = {}) => shot(x, V(-0.3, 4.9, -9.6), V(-4.0, 1.2, 6.0), 8.3 * (o.d ?? 1), 42, { push: 0.04, punch: o.punch, pk: 0.1 });
  // ======================= SHOTS (time = word onset − 0.04) =======================
  // 1 "Nesta cidade," — the boy walking down the street; the shop mirror (REFLEXOS & CIA) reflects him as he passes
  at(0.0, 'abertura', x => { const s = S.street; const X = SM(); const h = put(x, s, C.N, 0, 5.2, Math.PI / 2, 0); walkPath(h, x.L, -0.6, 1.4, [X - 7.5, 5.2], [X - 1.4, 5.2], { stride: 2.5 }); h.setFace({ eyes: 'happy', mouth: 'grin' });
    shot(x, V(h.root.position.x + 1.2, 4.0, 4.0), V(0.75, 0.06, 1), 13.0, 42, { push: 0.07 }); return s; });
  // 2 "todo mundo tem um reflexo" — in front of the mirror two people chill; INSIDE it, their reflections carry boxes
  const streetPair = (x, s) => { const X = SM(); const a = put(x, s, C.adults[0], X - 3.9, 4.4, 0.35, 0); layer(a, 1); alive(a, x.t, 1, 1); pose15(a, 'handsBack', 1, x.t); const b = put(x, s, C.adults[2], X + 3.9, 4.6, -0.35, 0); layer(b, 1); alive(b, x.t, 1, 2); pose15(b, 'hips', 1, x.t); b.setFace({ eyes: 'happy', mouth: 'smile' });
    const ta = put(x, s, C.T.a1, 0, 0, 0, 0); layer(ta, 2); walkPath(ta, (x.t * 0.8) % 3.2, 0, 3.0, [X - 3.0, 3.2], [X + 3.0, 3.2], { stride: 2.2, linear: true }); carryBox(s, ta, P.boxes[0]); layerP(P.boxes[0], 2); ta.setFace({ eyes: 'tired', mouth: 'flat', sweat: 1 });
    const tb = put(x, s, C.T.a3, 0, 0, 0, 0); layer(tb, 2); walkPath(tb, (x.t * 0.8 + 1.6) % 3.2, 0, 3.0, [X - 3.0, 7.4], [X + 3.0, 7.4], { stride: 2.2, linear: true }); carryBox(s, tb, P.boxes[1]); layerP(P.boxes[1], 2); tb.setFace({ eyes: 'tired', mouth: 'frown', sweat: 1 }); return { a, b }; };
  at(1.10, 'reflexos', x => { const s = S.street; const { a, b } = streetPair(x, s); frame(x, [headP(a), headP(b), mc(mir(s), 3.8), mc(mir(s), -3.6)], V(0.1, 0.06, 1), { fov: 42, m: 0.8 }); return s; });
  // 3 "que trabalha por você dentro do espelho" — closer: the mirror full of working reflections (punch on "espelho")
  at(2.54, 'trabalha', x => { const s = S.street; const { a, b } = streetPair(x, s); a.noFrame = b.noFrame = true; shot(x, mc(mir(s), -0.2), V(0.18, 0.02, 1), 10.5, 40, { push: 0.07, punch: 1.6, pk: 0.08 }); return s; });
  // 4 "Hoje de manhã," — he wakes up stretching; the bedroom mirror reflects him
  at(4.72, 'manha', x => { const s = S.bed; const h = put(x, s, C.N, 6.5, -8.6, 0, 0); sit15(h, SC.bed + 0.15); h.allowObst = new Set(['cama']); pose15(h, 'stretch', gestW(x.L, 0.05, 99, 0.5), x.t);
    shot(x, V(5.0, 4.6, -7.6), V(-0.35, 0.05, 1), 10.0, 40, { push: 0.06 }); return s; });
  // 5 "o meu pediu demissão" — in the mirror his reflection holds up a letter DEMISSÃO (it is not copying him any more)
  const bedMirrorPair = (x, s) => { const n = put(x, s, C.N, 0.9, -6.2, Math.PI + 0.5, 0); layer(n, 1); alive(n, x.t, 1, 1); return n; };
  at(5.74, 'demissao', x => { const s = S.bed; const n = put(x, s, C.N, 2.0, -6.0, Math.PI + 0.7, 0); layer(n, 1); alive(n, x.t, 1, 1); startle(n, x.L, 0.55, 0.7); n.setFace({ eyes: 'wide', mouth: 'o' }); const o = put(x, s, C.O, -3.0, -6.4, Math.PI, 0); layer(o, 2); alive(o, x.t, 1, 4); o.setFace({ eyes: 'angry', mouth: 'flat', brow: 1 });
    const up = 0.25 * springE(seg(x.L, 0.25, 0.6)); o.root.updateMatrixWorld(true); o.torso.add(P.letterM); layerP(P.letterM, 2); P.letterM.position.set(-0.3, 1.55 + up, 1.0); P.letterM.rotation.set(-0.08, 0, 0.06); reach(o, o.armR, o.torso.localToWorld(V(-0.85, 1.0 + up, 1.0)), 1); reach(o, o.armL, o.torso.localToWorld(V(0.25, 1.0 + up, 1.0)), 1);
    const m = mir(s); frame(x, [headP(n), refl(m, headP(o)), refl(m, headP(o, -2.6))], V(-0.15, 0.12, 1), { fov: 42, punch: 0.55, m: 0.62 }); return s; });
  // 6 "e saiu andando do espelho" — the reflection walks to the glass, RIPPLE, and steps OUT into the room, past him
  at(7.00, 'sai_do_espelho', x => { const s = S.bed; const n = bedMirrorPair(x, s); pose15(n, 'scared', gestW(x.L, 0.5, 99), x.t); const m = mir(s); const swap = 0.62; let o;
    if (x.L < swap) { o = put(x, s, C.O, -2.5, -5.0, Math.PI, 0); layer(o, 2); o.allowObst = new Set(['espelho-quarto']); walkPath(o, x.L, -0.2, swap, [-2.5, -6.0], [-2.5, -8.9], { stride: 2.3 }); o.setFace({ eyes: 'angry', mouth: 'flat', brow: 1 }); }
    else { o = put(x, s, C.O, -2.5, -10.4, 0, 0); walkPath(o, x.L, swap, x.d + 0.5, [-2.5, -10.45], [-2.8, -5.2], { stride: 2.3 }); o.setFace({ eyes: 'angry', mouth: 'flat', brow: 1 }); if (o.root.position.z < -8.4) { o.allowObst = new Set(['espelho-quarto', 'parede']); o.noFrame = true; } if (x.L > 1.2) o.noFrame = true; }
    ripple(m, x.L - swap + 0.08, 1.0, 0.5, 0.42); m.u.flash.value = 0.35 * Math.exp(-Math.pow((x.L - swap) / 0.1, 2)); sparks(x, s, mc(m, -0.6).add(V(0, 0, 0.3)), { r: 1.6, up: 3, amt: sm(seg(x.L, swap - 0.1, swap)) * (1 - sm(seg(x.L, swap + 0.4, swap + 0.8))), size: 0.3, flat: 0.3 });
    frame(x, [headP(n), mc(m, 3.6), mc(m, -3.4)], V(0.45, 0.12, 1), { fov: 42, push: 0.03 }); return s; });
  // 7 "Aqui, o reflexo faz a sua lição de casa" — night: the kid sleeps; the DESK is empty… but in the mirror his reflection does the homework
  const homework = (x, s, twin) => { const tw = put(x, s, twin, -8.6, -1.5, -Math.PI / 2, 0); layer(tw, 2); sit15(tw, SC.seat); tw.allowObst = new Set(['cadeira', 'carteira']); tw.head.rotation.x += 0.35; tw.setFace({ eyes: 'tired', mouth: 'flat', brow: 0.5 });
    const tip = V(-11.0 + 0.2 * Math.sin(x.t * 9), SC.table + 0.06, -1.3 + 0.25 * Math.sin(x.t * 6.3)); reach(tw, tw.armR, tip.clone().add(V(0.15, 0.38, 0.0)), 1); holdAt(s, P.pen, tw, 'R', tip, -1, 0.05); layerP(P.pen, 2); return tw; };
  at(8.53, 'licao', x => { const s = S.bedN; const k = C.kids[0]; sleepIn(x, s, k, 6.5, -5.4, SC.bed); layer(k, 1); k.noFrame = true; const tw = homework(x, s, C.T.k1); zzz(x, s, V(6.5, SC.bed + 2.6, -9.0), 1.1); const m = mir(s);
    frame(x, [mc(m, 3.8), mc(m, -3.8), V(4.6, 2.6, -6.0)], V(0.55, 0.12, 1), { fov: 42 }); return s; });
  // 8 "enquanto você dorme" — close on the sleeping kid (Z z z), the reflection still working in the mirror behind
  at(10.81, 'dorme', x => { const s = S.bedN; const k = C.kids[0]; sleepIn(x, s, k, 6.5, -5.4, SC.bed); layer(k, 1); homework(x, s, C.T.k1); zzz(x, s, V(6.5, SC.bed + 2.6, -9.0), 1.3);
    shot(x, V(6.5, SC.bed + 1.0, -9.2), V(-0.25, 0.55, 1), 7.5, 40, { push: 0.06 }); return s; });
  // 9 "Vai no dentista no seu lugar" — the dentist works on an EMPTY chair… in the mirror the boy's reflection is in it, mouth open
  const dentistScene = (x, s, twin) => { const c = s.userData.chair; const d = put(x, s, C.dentista, 4.9, -2.6, -Math.PI / 2, 0); d.noCollide = new Set(['k5T', 'outro']); alive(d, x.t, 1, 3); d.setFace({ eyes: 'normal', mouth: 'smile' }); reach(d, d.armR, V(2.55, 4.3, -2.6), 1); holdAt(s, P.pen2, d, 'R', V(2.5, 4.2, -2.7), 1, 0.05);
    const tw = put(x, s, twin, 2.5, -3.1, 0, 0); layer(tw, 2); sit15(tw, c.seatY); tw.allowObst = new Set(['cadeira-dentista']); tw.torso.rotation.x += -0.3; tw.head.rotation.x += -0.25; lap(tw); tw.setFace({ eyes: 'squeeze', mouth: 'scream', sweat: 1 }); return { d, tw }; };
  at(12.06, 'dentista', x => { const s = S.dentist; const { d, tw } = dentistScene(x, s, C.T.k5); const m = mir(s); frame(x, [headP(d), V(2.5, 4.0, -3.0), refl(m, headP(tw, 0.5)), refl(m, headP(tw, -2.0))], V(0.25, 0.15, 1), { fov: 44 }); return s; });
  // 10 "pede desculpa quando você erra" — broken plate; the girl whistles innocently… her reflection bows apologising to the mom
  const apology = (x, s, twinFn) => { s.add(P.shards); P.shards.position.set(-7.0, 0, 3.2); const mom = put(x, s, C.mae, -7.6, -0.6, 0.15, 0); alive(mom, x.t, 1, 2); pose15(mom, 'hips', 1, x.t); mom.setFace({ eyes: 'angry', mouth: 'frown', brow: 1 }); return twinFn(); };
  at(13.54, 'desculpa', x => { const s = S.kitchen; let tw; apology(x, s, () => { const g = put(x, s, C.kids[1], -4.6, 1.0, 0.9, 0); layer(g, 1); alive(g, x.t, 1, 4); g.setFace({ eyes: 'happy', mouth: 'smallo', look: [0.8, 0.6] });
      tw = put(x, s, C.T.k2, -7.9, 3.8, Math.PI, 0); layer(tw, 2); alive(tw, x.t, 1, 5); pose15(tw, 'bow', gestW(x.L, 0.2, 99), x.t); return tw; }); const m = mir(s);
    frame(x, [headP(C.mae), headP(C.kids[1]), refl(m, headP(tw, 0.4)), refl(m, headP(tw, -2.4))], V(0.75, 0.15, 1), { fov: 44 }); return s; });
  // 11 "O reflexo do professor corrige as provas" — the teacher naps in his chair; the little desk mirror shows his reflection grading
  const profScene = (x, s) => { const p = put(x, s, C.professor, 7.7, -8.9, 0, 0); layer(p, 1); sit15(p, SC.seat); p.allowObst = new Set(['cadeira', 'mesa da professora']); p.torso.rotation.x += -0.25; pose15(p, 'handsBack', 1, x.t); p.setFace({ eyes: 'closed', mouth: 'smallo' });
    const tw = put(x, s, C.T.professor, 7.7, -8.9, 0, 0); layer(tw, 2); sit15(tw, SC.seat); tw.allowObst = new Set(['cadeira', 'mesa da professora']); tw.torso.rotation.x += 0.3; tw.head.rotation.x += 0.35; tw.setFace({ eyes: 'tired', mouth: 'flat', brow: 0.6, sweat: 1 });
    const tip = V(8.3 + 0.18 * Math.sin(x.t * 8), SC.table + 0.12, -7.15 + 0.12 * Math.sin(x.t * 5)); reach(tw, tw.armR, tip.clone().add(V(0, 0.4, -0.05)), 1); holdAt(s, P.pen2, tw, 'R', tip, -1, 0.05); layerP(P.pen2, 2); return { p, tw }; };
  at(15.27, 'professor', x => { const s = S.class; const { p, tw } = profScene(x, s); zzz(x, s, headP(p, 0.9), 0.8); const m = mir(s); frame(x, [headP(p), headP(p, -2.0), refl(m, headP(tw, 0.5)), refl(m, headP(tw, -1.8))], V(-0.55, 0.15, 1), { fov: 42 }); return s; });
  // 12 "e por isso, ele nunca sabe a nota de ninguém" — a student asks; the teacher shrugs, "?"
  at(17.56, 'nota', x => { const s = S.class; const p = put(x, s, C.professor, 3.0, -9.2, 0.35, 0); alive(p, x.t, 1, 2); pose15(p, 'shrug', gestW(x.L, 0.6, 99), x.t); bubble(x, s, FX.q, headP(p, 1.6).add(V(0.5, 0, 0)), 0.9, 1.2);
    const k = put(x, s, C.kids[2], 1.6, -3.2, Math.PI - 0.5, 0); alive(k, x.t, 1, 4); talk(k, x.t, x.L < 0.7 ? 1 : 0); pose15(k, 'pointAt', gestW(x.L, 0.15, 0.9) * 0.7, x.t, { face: false }); k.setFace({ eyes: 'normal', mouth: 'o', browUp: 1 }); k.noFrame = true;
    frame(x, [headP(p), headP(p, -2.6), headP(k, 0.4)], V(-1.0, 0.25, 0.35), { fov: 42, min: 6 }); return s; });
  // 13 "O do prefeito faz todos os discursos" — the mayor stands silent at the podium; in the big mirror his reflection gives the speech
  const mayor = (x, s) => { const m = put(x, s, C.prefeito, -2.5, 3.7, 0, 0); layer(m, 1); alive(m, x.t, 0.6, 1); m.setFace({ eyes: 'normal', mouth: 'flat', look: [0.6, 0] });
    const tw = put(x, s, C.T.prefeito, -2.5, 3.7, 0, 0); layer(tw, 2); alive(tw, x.t, 1, 3); talk(tw, x.t, 1); pose15(tw, x.t % 2.4 < 1.2 ? 'fistUp' : 'armsOpenL', 0.9, x.t, { face: false }); tw.setFace({ eyes: 'happy', brow: 0.6 }); return { m, tw }; };
  const crowd = (x, s) => { [[C.adults[1], -11.5, 11.4], [C.kids[3], -7.0, 14.6], [C.adults[3], -2.0, 16.4], [C.kids[5], 9.0, 13.0]].forEach(([c, px, pz], i) => { put(x, s, c, px, pz, Math.atan2(-2.5 - px, 4.8 - pz), 0); c.noFrame = true; alive(c, x.t, 1, i); if (i % 2) pose15(c, 'clap', 0.9, x.t + i); else pose15(c, 'cheer', 0.7 + 0.3 * Math.sin(x.t * 6 + i), x.t + i); }); };
  at(20.09, 'discurso', x => { const s = S.hall; const { m: may, tw } = mayor(x, s); crowd(x, s); const m = mir(s); camAt(x, V(mix(12.8, 12.0, eio(x.u)), 5.2, mix(12.4, 11.6, eio(x.u))), V(0.4, 4.4, 4.6), 46); return s; });
  // 14 "e o prefeito de verdade não abre a boca" — close: lips sealed, eyes darting, a drop of sweat
  at(22.46, 'boca_fechada', x => { const s = S.hall; const { m } = mayor(x, s); m.setFace({ eyes: 'normal', mouth: 'flat', sweat: 1, look: [Math.sin(x.t * 3) * 0.8, 0] }); m.head.rotation.y += 0.15 * Math.sin(x.t * 3);
    shot(x, headP(m, -0.3), V(0.2, 0.03, 1), 6.0, 40, { push: 0.06 }); return s; });
  // 15 "faz 20 anos" — calendar years flying by: ANOS 1 … 20
  at(24.53, 'vinte_anos', x => { const s = S.bed; const c = s.userData.cal; const f = seg(x.L, 0, 0.95) * 19; const n = Math.min(19, Math.floor(f)); if (n >= 19) c.set('ANOS', 19, 'ANOS', 20, 1); else c.set('ANOS', n + 1, 'ANOS', n + 2, eio(f % 1));
    const p = c.getWorldPosition(V(0, 0, 0)); shot(x, p, V(0.12, -0.04, 1), 6.2, 40, { push: 0.08, punch: 0.95, pk: 0.1 }); return s; });
  // 16 "O meu sempre foi o melhor" — boy and reflection perfectly in sync, proud pose (normal mirror: layer 0)
  at(25.84, 'o_melhor', x => { const s = S.bed; const n = put(x, s, C.N, -1.0, -6.6, Math.PI + 0.25, 0); alive(n, x.t, 1, 1); pose15(n, 'chest', gestW(x.L, 0.15, 99), x.t); const m = mir(s); frame(x, [headP(n), refl(m, headP(n)), refl(m, headP(n, -2.4))], V(0.5, 0.12, 1), { fov: 42 }); return s; });
  // 17 "nunca reclamou de nada" — in the mirror the reflection carries his boxes, smiling; he relaxes on the bed
  at(27.50, 'nunca_reclamou', x => { const s = S.bed; const n = put(x, s, C.N, 6.5, -8.6, 0, 0); layer(n, 1); sit15(n, SC.bed + 0.15); n.allowObst = new Set(['cama']); pose15(n, 'handsBack', 1, x.t); n.noFrame = true;
    const o = put(x, s, C.O, 0, 0, 0, 0); layer(o, 2); walkPath(o, x.L + 0.3, 0, 2.2, [-4.6, -6.4], [-1.4, -6.4], { stride: 2.3 }); carryBox(s, o, P.boxes[2]); layerP(P.boxes[2], 2); o.setFace({ eyes: 'happy', mouth: 'grin' }); const m = mir(s);
    frame(x, [mc(m, 3.4), mc(m, -3.2), headP(n)], V(0.35, 0.12, 1), { fov: 42 }); return s; });
  // 18 "até hoje" — the reflection stops, the smile drops, the box falls
  at(28.90, 'ate_hoje', x => { const s = S.bed; const o = put(x, s, C.O, -3.0, -6.4, Math.PI, 0); layer(o, 2); alive(o, x.t, 1, 3); o.setFace(x.L > 0.15 ? { eyes: 'angry', mouth: 'frown', brow: 1 } : { eyes: 'happy', mouth: 'grin' });
    const b = P.boxes[2]; s.add(b); layerP(b, 2); const k = eio(seg(x.L, 0.15, 0.45)); b.position.set(-3.0, mix(3.3, 0.55, k), -7.5 + 0.3 * k); b.rotation.set(0.6 * k, 0, 0.5 * k); pose15(o, 'crossArms', gestW(x.L, 0.3, 99), x.t, { face: false });
    const m = mir(s); frame(x, [mc(m, 3.8), mc(m, -3.8)], V(0.3, 0.05, 1), { fov: 40, punch: 0.15, m: 0.8 }); return s; });
  // 19 "Eu acordei" — morning, he sits up in bed
  at(29.52, 'acordei', x => { const s = S.bed; const h = put(x, s, C.N, 6.5, -8.6, 0, 0); sit15(h, SC.bed + 0.15); h.allowObst = new Set(['cama']); alive(h, x.t, 1, 1); h.setFace({ eyes: x.L < 0.4 ? 'closed' : 'tired', mouth: 'o' }); h.head.rotation.z += 0.1 * Math.sin(x.t * 2);
    shot(x, headP(h, -0.5), V(-0.45, 0.06, 1), 7.5, 40, { push: 0.06 }); return s; });
  // 20 "fui escovar os dentes" — bathroom: brushing, the reflection copies (layer 0)
  const brushing = (x, s, h) => { h.root.updateMatrixWorld(true); const mouth = h.head.localToWorld(V(-0.05, 0.43, 0.72)); const tip = mouth.clone().add(V(0.12 * Math.sin(x.t * 14), 0, 0)); reach(h, h.armR, tip.clone().add(V(-0.45, -0.25, 0.25)), 1); holdAt(s, P.brush, h, 'R', tip, 1, 0.02); };
  at(30.66, 'escovar', x => { const s = S.bath; const h = put(x, s, C.N, 1.2, -6.9, Math.PI, 0); alive(h, x.t, 0.4, 1); brushing(x, s, h); h.setFace({ eyes: 'tired', mouth: 'grin' }); const m = mir(s); frame(x, [headP(h, 0.5), headP(h, -1.4), refl(m, headP(h, 0.5)), refl(m, headP(h, -1.2))], V(-0.55, 0.2, 0.8), { fov: 42 }); return s; });
  // 21 "e ele não estava no espelho" — over the shoulder: the mirror shows the bathroom… without him
  at(31.93, 'sem_reflexo', x => { const s = S.bath; const h = put(x, s, C.N, 1.2, -6.6, Math.PI, 0); layer(h, 1); alive(h, x.t, 0.4, 1); brushing(x, s, h); layerP(P.brush, 1); startle(h, x.L, 0.35, 0.5); h.noFrame = true; camAt(x, V(mix(-2.0, -1.7, eio(x.u)), 5.8, mix(-1.0, -1.6, eio(x.u))), V(0.2, 4.9, -10.0), 40); if (x.L > 0.36) camera.fov *= 1 - 0.1 * eo(seg(x.L, 0.36, 0.6)); return s; });
  // 22 "Estava em pé, atrás de mim" — in the mirror: the OTHER one standing behind him (no reflection of the boy himself)
  const bathBehind = (x, s) => { const o = put(x, s, C.O, 0.8, -1.6, Math.PI, 0); alive(o, x.t, 0.6, 2); pose15(o, 'crossArms', 1, x.t); o.setFace({ eyes: 'angry', mouth: 'flat', brow: 1 }); return o; };
  at(33.34, 'atras', x => { const s = S.bath; const h = put(x, s, C.N, 1.2, -6.9, Math.PI, 0); layer(h, 1); alive(h, x.t, 0.4, 1); h.setFace({ eyes: 'circle', mouth: 'o' }); h.noFrame = true; bathBehind(x, s).noFrame = true; camAt(x, V(mix(-1.9, -1.6, eio(x.u)), 5.9, mix(1.4, 0.8, eio(x.u))), V(-0.2, 4.9, -10.0), 40); return s; });
  // 23 "no meio do banheiro" — wide: he turns around (smooth) and sees him in the middle of the bathroom
  at(35.03, 'meio_banheiro', x => { const s = S.bath; const h = put(x, s, C.N, 1.2, -6.3, Math.PI, 0); h.root.rotation.y = mix(Math.PI, 0.35, eio(seg(x.L, 0.0, 0.5))); h.setFace({ eyes: 'circle', mouth: 'scream', brow: -0.8 }); pose15(h, 'scared', gestW(x.L, 0.5, 99), x.t); bathBehind(x, s);
    camAt(x, V(mix(6.5, 6.0, eio(x.u)), 5.5, mix(4.0, 3.4, eio(x.u))), V(0.9, 3.6, -4.4), 44); return s; });
  // 24 "Ele só disse: eu me demito" — close on him, arms crossed, firm
  at(36.12, 'me_demito', x => { const s = S.bath; const o = bathBehind(x, s); talk(o, x.t, seg(x.L, 0.8, 0.9) * (1 - seg(x.L, 1.3, 1.4))); shot(x, headP(o, -0.4), V(-0.35, 0.04, -1), 7.0, 40, { push: 0.06 }); return s; });
  // 25 "e saiu pela porta" — he walks out through the bathroom door (it swings away from him)
  at(37.74, 'saiu_porta', x => { const s = S.bath; const r = s.userData.room; r.doors.banheiro.set(sm(seg(x.L, -0.3, 0.35))); const o = put(x, s, C.O, 0.8, -1.6, 0, 0); walkPath(o, x.L, 0.05, x.d + 0.6, [0.8, -1.6], [-11.6, 3.0], { stride: 2.4 }); o.setFace({ eyes: 'angry', mouth: 'flat' }); if (o.root.position.x < -6.5) o.noFrame = true;
    const h = put(x, s, C.N, 1.2, -7.2, 0.35, 0); h.noFrame = true; alive(h, x.t, 1, 2); h.head.rotation.y += -0.6 * sm(seg(x.L, 0.2, 0.8)); h.setFace({ eyes: 'wide', mouth: 'o' });
    camAt(x, V(4.5, 5.0, 6.5), V(mix(-0.5, -6.0, eio(seg(x.L, 0, x.d))), 3.6, mix(-0.8, 1.5, eio(x.u))), 44); return s; });
  at(38.87, 'dia1', x => cal(x, 'DIA', 0, 'DIA', 1, 0.05));
  // 27 "ele foi para a escola no meu lugar" — the other one walks into the school, confident
  at(39.91, 'escola', x => { const s = S.school; const o = put(x, s, C.O, 0, 0, 0, 0); walkPath(o, x.L, -0.6, x.d + 0.2, [-1.4, 17.0], [-0.9, 9.5], { stride: 2.4 }); o.root.rotation.y = Math.PI + 0.05; o.setFace({ eyes: 'happy', mouth: 'grin' });
    shot(x, V(o.root.position.x, 4.2, o.root.position.z), V(-0.2, 0.08, -1), 9.5, 42, { push: 0.03 }); return s; });
  // 28 "respondeu todas as perguntas" — classroom: hand up again and again
  const classKids = (x, s, laugh = false) => { [[C.kids[2], -11, 0.5], [C.kids[3], -0.6, 0.5], [C.kids[4], -0.6, 5.1], [C.kids[5], -11, 5.1]].forEach(([c, px, pz], i) => { put(x, s, c, px, pz + 1.55, Math.PI, 0); c.noFrame = true; sit15(c, SC.seat); c.allowObst = new Set(['carteira']); alive(c, x.t, 1, i); lap(c); if (laugh) pose15(c, 'laugh', 0.9, x.t + i * 0.3); }); };
  const oDesk = (x, s) => { const o = put(x, s, C.O, -5.8, 6.65, Math.PI, 0); sit15(o, SC.seat); o.allowObst = new Set(['carteira']); alive(o, x.t, 1, 2); lap(o); return o; };
  at(41.53, 'respondeu', x => { const s = S.class; const o = oDesk(x, s); { const w = gestW(x.L, 0.08, 99); o.armR.piv.rotation.set(0, 0, 0); o.armR.piv.rotation.z = -2.75 * w; o.armR.piv.rotation.x = -0.25 * w; o.armR.elbow.rotation.x = -0.25 * w - 0.15 * Math.sin(x.t * 9) * w; o.setFace({ eyes: 'happy', mouth: 'grin' }); } talk(o, x.t, x.L > 0.9 ? 1 : 0);
    const p = put(x, s, C.prof, 0.5, -8.4, 0.25, 0); alive(p, x.t, 1, 3); p.noFrame = true; pose15(p, 'pointAt', gestW(x.L, 0.3, 99) * 0.8, x.t, { face: false }); p.setFace({ eyes: 'happy', mouth: 'smile' });
    shot(x, headP(o, -0.4), V(0.25, 0.12, -1), 9.0, 42, { push: 0.06 }); return s; });
  // 29 "fez a turma inteira rir" — the whole class laughing at his joke
  at(43.38, 'turma_ri', x => { const s = S.class; classKids(x, s, true); const o = oDesk(x, s); pose15(o, 'shrug', gestW(x.L, 0.05, 99), x.t, { face: false }); o.setFace({ eyes: 'happy', mouth: 'grin' }); talk(o, x.t, 1);
    camAt(x, V(mix(-2.0, -2.8, eio(x.u)), 6.0, mix(-6.5, -7.4, eio(x.u))), V(-6.0, 3.0, 4.0), 46); return s; });
  // 30 "e a professora deu parabéns pra ele" — she claps for him, sparkles
  at(44.72, 'parabens', x => { const s = S.class; const p = put(x, s, C.prof, -3.3, 2.25, -0.15, 0); alive(p, x.t, 1, 3); pose15(p, 'clap', gestW(x.L, 0.1, 99), x.t); p.setFace({ eyes: 'happy', mouth: 'grin' }); p.hip.position.y += 0.03 * Math.abs(Math.sin(x.t * 12));
    const o = oDesk(x, s); o.setFace({ eyes: 'happy', mouth: 'grin' }); o.head.rotation.y += 0.4; sparks(x, s, headP(o, 1.0), { r: 1.5, up: 2.5, amt: 0.8, size: 0.28 });
    frame(x, [headP(p), headP(o), headP(o, 1.0)], V(1, 0.2, 0.1), { fov: 44 }); return s; });
  at(46.84, 'dia3', x => cal(x, 'DIA', 2, 'DIA', 3, 0.05));
  // 31 "o meu melhor amigo parou de falar comigo" — schoolyard: the friend turns his back, arms crossed
  at(47.94, 'amigo_vira', x => { const s = S.school; const a = put(x, s, C.amigo, 2.3, 12.5, mix(-1.4, 2.6, eio(seg(x.L, 0.35, 0.95))), 0); alive(a, x.t, 1, 2); pose15(a, 'crossArms', gestW(x.L, 0.7, 99), x.t);
    const n = put(x, s, C.N, -2.4, 12.8, 1.4, 0); alive(n, x.t, 1, 1); pose15(n, 'wave', gestW(x.L, 0.05, 0.9), x.t); if (x.L > 0.9) n.setFace({ eyes: 'sad', mouth: 'frown' });
    frame(x, [headP(a), headP(n), headP(a, -3.0)], V(0.1, 0.08, 1), { fov: 42 }); return s; });
  // 32 "Disse que eu estava estranho" — the friend looks over his shoulder and points at him
  at(50.18, 'estranho', x => { const s = S.school; const a = put(x, s, C.amigo, 2.3, 12.5, -1.1, 0); alive(a, x.t, 1, 2); gesture(a, 'point', x.L, 0.15, 99, 1); talk(a, x.t, 1); a.setFace({ eyes: 'angry', mouth: 'flat', brow: 0.8 });
    const n = put(x, s, C.N, -2.4, 12.8, 1.2, 0); n.noFrame = true; alive(n, x.t, 1, 1); n.setFace({ eyes: 'sad', mouth: 'o' }); shot(x, headP(a, -0.6), V(-0.35, 0.04, 1), 8.5, 40, { push: 0.06 }); return s; });
  // 33 "que o outro era mais legal" — the friend runs to the other one; both laughing — he stays alone
  at(51.49, 'mais_legal', x => { const s = S.school; const o = put(x, s, C.O, 6.6, 12.0, -1.2, 0); alive(o, x.t, 1, 3); const a = put(x, s, C.amigo, 0, 0, 0, 0); walkPath(a, x.L, -0.1, 0.75, [2.3, 12.5], [3.8, 12.3], { stride: 2.4, run: 0.5 }); if (x.L > 0.75) { a.root.rotation.y = 1.4; pose15(a, 'laugh', gestW(x.L, 0.8, 99), x.t); }
    pose15(o, 'laugh', gestW(x.L, 0.85, 99), x.t + 1); const n = put(x, s, C.N, -2.4, 12.8, 1.2, 0); alive(n, x.t, 1, 1); pose15(n, 'sad', gestW(x.L, 0.3, 99), x.t);
    frame(x, [headP(o), headP(n), headP(a), headP(o, -3.0)], V(0.0, 0.1, 1), { fov: 44, m: 0.75 }); return s; });
  at(52.83, 'dia5', x => cal(x, 'DIA', 4, 'DIA', 5, 0.05));
  // 34 "a minha mãe abraçou ele na cozinha" — the mom hugs the other one (hands around his back, no clipping)
  const momHug = (x, s, w) => { const o = put(x, s, C.O, 1.4, 5.6, Math.PI / 2 + 0.2, 0); alive(o, x.t, 1, 1); o.setFace({ eyes: 'happy', mouth: 'smile' }); const m = put(x, s, C.mae, 3.25, 5.35, -Math.PI / 2 + 0.2, 0); alive(m, x.t, 1, 3);
    o.root.updateMatrixWorld(true); m.root.updateMatrixWorld(true); reach(m, m.armR, o.torso.localToWorld(V(0.82, 1.2, -0.25)), w); reach(m, m.armL, o.torso.localToWorld(V(-0.82, 1.2, -0.25)), w); m.torso.rotation.x += 0.12 * w; m.head.rotation.x += 0.15 * w; m.setFace({ eyes: 'happy', mouth: 'smile' });
    reach(o, o.armR, m.torso.localToWorld(V(0.7, 0.95, 0.2)), w * 0.8); reach(o, o.armL, m.torso.localToWorld(V(-0.7, 0.95, 0.2)), w * 0.8); m.noCollide = new Set(['outro']); return { o, m }; };
  at(53.85, 'abraco', x => { const s = S.kitchen; const { o, m } = momHug(x, s, springE(seg(x.L, 0.1, 0.55))); frame(x, [headP(o), headP(m), headP(o, -3.0)], V(0.2, 0.08, 1), { fov: 42, m: 0.62 }); return s; });
  // 35 "e passou por mim como se eu não existisse" — she walks straight past him; he waves, she doesn't look
  at(55.67, 'ignorado', x => { const s = S.kitchen; const m = put(x, s, C.mae, 0, 0, 0, 0); walkPath(m, x.L, 0.0, x.d + 0.3, [8.0, 6.8], [-5.0, 7.0], { stride: 2.6 }); m.setFace({ eyes: 'happy', mouth: 'smile' }); m.noFrame = true;
    const n = put(x, s, C.N, -2.6, 3.0, 0.5, 0); alive(n, x.t, 1, 1); if (Math.abs(m.root.position.x + 2.6) < 2.6) n.noFrame = true; /* she walks right in front of him: momentary cover is the point of the shot */ n.root.rotation.y = Math.atan2(m.root.position.x + 2.6, m.root.position.z - 3.0); pose15(n, 'waveR', gestW(x.L, 0.2, 1.4), x.t); if (x.L > 1.4) { n.setFace({ eyes: 'sad', mouth: 'frown', brow: -1 }); pose15(n, 'sad', gestW(x.L, 1.4, 99), x.t); }
    frame(x, [headP(n), headP(n, -3.2), V(-1.2, 5.6, 6.9), V(2.6, 5.6, 6.9), V(-4.6, 5.6, 6.9)], V(-0.6, 0.18, 1), { fov: 44, push: 0 }); return s; });
  // 36 "Então eu comecei a perceber coisas" — thinking, "?"
  at(57.72, 'perceber', x => { const s = S.bed; const n = put(x, s, C.N, 0.2, -4.2, 0.35, 0); alive(n, x.t, 1, 1); pose15(n, 'think', gestW(x.L, 0.1, 99), x.t); bubble(x, s, FX.q, headP(n, 1.5).add(V(0.6, 0, 0)), 0.9, 1.2);
    shot(x, headP(n, -0.7), V(0.35, 0.06, 1), 10.0, 42, { push: 0.06 }); return s; });
  // 37 "Eu sempre escrevi com a mão esquerda" — close: the pen in his LEFT hand
  at(60.03, 'mao_esquerda', x => { const s = S.bed; const n = put(x, s, C.N, -8.6, -1.5, -Math.PI / 2, 0); sit15(n, SC.seat); n.allowObst = new Set(['cadeira', 'carteira']); n.head.rotation.x += 0.4; n.setFace({ eyes: 'normal', mouth: 'flat', brow: 0.5, look: [0, -1] });
    const tip = V(-10.9 + 0.15 * Math.sin(x.t * 9), SC.table + 0.06, -1.15 + 0.18 * Math.sin(x.t * 6)); reach(n, n.armL, tip.clone().add(V(0.15, 0.4, 0.1)), 1); holdAt(s, P.pen, n, 'L', tip, -1, 0.05);
    const p = palm(n, 'L'); camAt(x, p.clone().add(V(mix(2.2, 1.9, eio(x.u)), 1.6, 1.9)), p.clone().add(V(-0.2, -0.3, 0)), 40); return s; }, { noQA: true });
  // 38 "e todo mundo na minha família é destro" — the family waves with the RIGHT hand… he waves with the left
  at(61.68, 'destros', x => { const s = S.kitchen; const F = [[C.pai, -6.3, 2.6, 0.05], [C.mae, -2.2, 3.0, 0.25], [C.irma, 1.3, 3.8, 0.45]]; F.forEach(([c, px, pz, a], i) => { put(x, s, c, px, pz, 0.15, 0); alive(c, x.t, 1, i); const w = gestW(x.L, a, 99); pose15(c, 'raiseR', w, x.t); c.armR.wrist.rotation.z += 0.35 * Math.sin(x.t * 9 + i) * w; });
    const n = put(x, s, C.N, 4.9, 4.8, -0.25, 0); alive(n, x.t, 1, 4); pose15(n, 'raiseL', gestW(x.L, 0.9, 99), x.t, { face: false }); n.armL.wrist.rotation.z += 0.35 * Math.sin(x.t * 9) * gestW(x.L, 0.9, 99); n.setFace({ eyes: 'normal', mouth: 'smallo', browUp: 1 });
    frame(x, [headP(C.pai, 1.4), headP(C.irma), headP(n, 1.4), headP(C.mae, -3.4)], V(0.3, 0.1, 1), { fov: 52, m: 0.62, push: 0 }); return s; });
  // 39 "Nas minhas fotos de bebê" — the photo album on the bed
  const albumOn = s => { const a = P.album; s.add(a); a.position.set(6.5, SC.bed + 0.35, -5.6); a.rotation.y = 0.2; a.updateMatrixWorld(true); return a; };
  at(64.17, 'fotos', x => { const s = S.bed; const a = albumOn(s); for (const ph of a.photos) { ph.scale.x = 1; ph.position.y = 0.17; } const p = a.getWorldPosition(V(0, 0, 0)); camAt(x, p.clone().add(V(0.6, mix(6.0, 5.0, eio(x.u)), 2.4)), p, 40); return s; });
  // 40 "o meu cabelo era repartido pro outro lado" — the photo flips like a mirror: the hair part changes sides
  at(65.54, 'repartido', x => { const s = S.bed; const a = albumOn(s); for (const q of a.photos) { q.scale.x = 1; q.position.y = 0.17; } const ph = a.photos[2]; const k = eio(seg(x.L, 0.7, 1.3)); ph.scale.x = Math.cos(k * Math.PI) || 0.001; ph.position.y = 0.17 + 0.5 * Math.sin(k * Math.PI);
    a.updateMatrixWorld(true); const p = ph.getWorldPosition(V(0, 0, 0)); camAt(x, p.clone().add(V(0.3, 2.8, 1.3)), p, 40); return s; });
  // 41 "O médico já tinha estranhado uma vez" — doctor, stethoscope, puzzled "?"
  const exam = (x, s, side = 1) => { const b = s.userData.bed; const n = put(x, s, C.N, -3.2, -6.5, Math.PI / 2, 0); sit15(n, b.top); n.allowObst = new Set(['maca']); lap(n);
    const d = put(x, s, C.medico, 0.1, -6.5, -Math.PI / 2, 0); d.noCollide = new Set(['narrador']); alive(d, x.t, 1, 3); n.root.updateMatrixWorld(true); const spot = n.torso.localToWorld(V(side * 0.32, 1.3, 0.62)); reach(d, d.armR, spot.clone().add(V(0.2, -0.05, 0.05)), 1); d.root.updateMatrixWorld(true);
    s.add(P.steth); P.steth.update(d.head.localToWorld(V(-0.4, 0.15, 0.25)), d.head.localToWorld(V(0.4, 0.15, 0.25)), spot.clone().add(V(0.12, 0, 0.0))); return { n, d }; };
  at(67.79, 'medico', x => { const s = S.doctor; const { n, d } = exam(x, s, 1); d.setFace({ eyes: 'normal', mouth: 'flat', brow: 0.4 }); d.head.rotation.x += 0.2; bubble(x, s, FX.q, headP(d, 1.8).add(V(0, 0, 0.6)), 0.9, 1.1); n.setFace({ eyes: 'normal', mouth: 'smallo' });
    shot(x, V(-1.6, 4.4, -6.5), V(0.1, 0.08, 1), 9.5, 42, { push: 0.05 }); return s; });
  // 42 "O meu coração bate do lado direito" — the heart glows on the RIGHT side of his chest; the doctor jumps
  at(69.76, 'coracao', x => { const s = S.doctor; const { n, d } = exam(x, s, -1); n.root.updateMatrixWorld(true); n.torso.add(P.heart); P.heart.position.set(-0.32, 1.32, 0.66); const beat = 1 + 0.18 * Math.pow(Math.max(0, Math.sin(x.t * 7.5)), 4); P.heart.scale.setScalar(0.42 * beat * Math.max(0.001, sm(seg(x.L, 0.25, 0.55))));
    startle(d, x.L, 0.95, 0.6); d.noFrame = true; n.setFace({ eyes: 'wide', mouth: 'o' }); n.head.rotation.x += 0.35 * sm(seg(x.L, 0.3, 0.7)); bloom.strength = 0.35; shot(x, n.torso.localToWorld(V(-0.1, 1.5, 0.6)), V(0.6, 0.05, 1), 6.0, 40, { push: 0.05, punch: 1.3, pk: 0.08 }); return s; });
  // 43 "E o meu relógio" — close on the watch on his wrist
  const wrist = (x, s, n) => { n.root.updateMatrixWorld(true); reach(n, n.armL, n.torso.localToWorld(V(0.15, 1.45, 1.15)), 1); n.root.updateMatrixWorld(true); const f = n.watch.face; const w = f.getWorldPosition(V(0, 0, 0)); const nrm = w.clone().sub(n.watch.getWorldPosition(V(0, 0, 0))).normalize(); x.wn = nrm; return w; };
  at(72.00, 'relogio', x => { const s = S.bed; const n = put(x, s, C.N, 1.2, -2.4, 0.2, 0); alive(n, x.t, 0.4, 1); const w = wrist(x, s, n); n.head.rotation.x += 0.35; n.setFace({ eyes: 'normal', mouth: 'flat', look: [0, -1] }); n.watch.set(7 + x.L * 0.2, (15 + x.L * 60) % 60); n.noFrame = true;
    camAt(x, w.clone().addScaledVector(x.wn, mix(2.4, 1.8, eio(x.u))).add(V(0, 0.15, 0)), w, 38); return s; });
  // 44 "eu sempre li ele ao contrário" — mirrored numbers, the hands run backwards; he tilts his head trying to read it
  at(72.92, 'ao_contrario', x => { const s = S.bed; const n = put(x, s, C.N, 1.2, -2.4, 0.2, 0); alive(n, x.t, 0.4, 1); const w = wrist(x, s, n); n.watch.set(7.25 - x.L * 1.2, (15 - x.L * 140 + 6000) % 60); n.noFrame = true; n.head.rotation.z += 0.35 * sm(seg(x.L, 0.3, 0.9)); n.head.rotation.x += 0.3; n.setFace({ eyes: 'normal', mouth: 'wavy', brow: 0.5 });
    camAt(x, w.clone().addScaledVector(x.wn, 1.3).add(V(0, 0.1, 0)), w, 38); return s; });
  // 45 "Naquela noite" — night, the dark bedroom, moonlight, the mirror shining softly; someone on the bed
  const onBed = (x, s, look = 0) => { const o = put(x, s, C.O, 4.25, -6.2, -Math.PI / 2, 0); sit15(o, SC.bed + 0.15); o.allowObst = new Set(['cama']); lap(o); alive(o, x.t, 0.5, 2); o.head.rotation.y += look; o.setFace({ eyes: 'normal', mouth: 'flat' }); return o; };
  at(74.76, 'noite', x => { const s = S.bedN; camAt(x, V(mix(2.0, 1.0, eio(x.u)), 6.0, mix(9.6, 8.6, eio(x.u))), V(-1.0, 3.6, -8.0), 46); const o = onBed(x, s); o.noFrame = true; return s; });
  // 46 "eu encontrei ele sentado na minha cama" — he opens the door and finds him sitting on his bed
  at(75.62, 'na_cama', x => { const s = S.bedN; s.userData.room.doors.quarto.set(sm(seg(x.L, -0.3, 0.5))); const o = onBed(x, s, -0.3); const n = put(x, s, C.N, 0, 0, 0, 0); walkPath(n, x.L, 0.35, 1.3, [17.0, 4.0], [11.0, 4.0], { stride: 2.3 }); n.noFrame = true; n.setFace({ eyes: 'wide', mouth: 'o' });
    frame(x, [headP(o), headP(o, -3.0), V(13.7, 7.0, 4.0), V(13.7, 1.0, 4.0)], V(-0.75, 0.15, 0.6), { fov: 46 }); return s; });
  // 47 "Ele me olhou e perguntou" — he turns his head slowly toward him
  at(77.71, 'olhou', x => { const s = S.bedN; const o = onBed(x, s, mix(0, 1.05, eio(seg(x.L, 0.1, 0.7)))); o.setFace({ eyes: 'normal', mouth: 'flat', brow: 0.4 }); shot(x, headP(o, -0.4), V(-1, 0.05, 0.55), 7.5, 40, { push: 0.06 }); return s; });
  // 48 "você ainda não lembrou?" — close, talking, serious
  at(79.27, 'lembrou', x => { const s = S.bedN; const o = onBed(x, s, 1.05); talk(o, x.t, x.L < 0.6 ? 1 : 0); o.setFace({ eyes: 'sad', brow: -0.4 }); bubble(x, s, FX.q, headP(o, 1.5).add(V(-0.3, 0, 0.6)), 0.62, 1.0); shot(x, headP(o, -0.3), V(-0.4, 0.03, 1), 5.6, 40, { push: 0.05, punch: 0.55, pk: 0.08 }); return s; });
  // 49 "Há 10 anos" — sepia: a little boy in front of the same mirror, his reflection copying him (normal)
  at(80.38, 'dez_anos', x => { const s = S.bed; sepia(x); const b = put(x, s, C.Op, -2.0, -6.4, Math.PI - 0.1, 0); alive(b, x.t, 1, 2); pose15(b, 'waveR', gestW(x.L, 0.2, 99), x.t); shot(x, mc(mir(s), -1.4).add(V(0.8, 0, 2.0)), V(0.5, 0.04, 1), 9.5, 42, { push: 0.06 }); return s; });
  // 50 "a gente trocou de lugar" — hands on the glass… flash and ripple… the one in the mirror is now outside
  at(81.44, 'trocou', x => { const s = S.bed; sepia(x); const m = mir(s); const sw = 0.55; const outside = x.L < sw ? C.Op : C.Np, inside = x.L < sw ? C.Np : C.Op;
    const b = put(x, s, outside, -2.5, -8.75, Math.PI, 0); layer(b, 1); pose15(b, 'palmGlass', 1, x.t); b.allowObst = new Set(['espelho-quarto']); b.setFace({ eyes: 'wide', mouth: 'smallo' });
    const t = put(x, s, inside, -2.5, -8.75, Math.PI, 0); layer(t, 2); pose15(t, 'palmGlass', 1, x.t); t.allowObst = new Set(['espelho-quarto']); t.setFace({ eyes: 'happy', mouth: 'smile' });
    ripple(m, x.L - sw + 0.05, 1.0, 0.5, 0.33); m.u.flash.value = 0.5 * Math.exp(-Math.pow((x.L - sw) / 0.09, 2)); grade.flash.value = 0.05 * Math.exp(-Math.pow((x.L - sw) / 0.08, 2));
    sparks(x, s, mc(m, -1.5).add(V(0, 0, 0.4)), { r: 1.4, up: 2.6, amt: Math.exp(-Math.pow((x.L - sw) / 0.3, 2)), size: 0.25, flat: 0.3 }); shot(x, mc(m, -1.2).add(V(0.8, 0, 1.0)), V(0.65, 0.05, 1), 8.0, 42, { push: 0.05 }); return s; });
  // 51 "Você me pediu pra brincar um pouco do lado de fora" — sepia: the little one outside, playing in the yard, jumping happy
  at(82.78, 'brincar', x => { const s = S.school; sepia(x); const b = put(x, s, C.Np, 0, 16, 0, 0); const a = x.t * 2.2; b.root.position.set(Math.sin(a) * 3.0, 0.5 * Math.abs(Math.sin(x.t * 7)), 16 + Math.cos(a) * 2.0); b.root.rotation.y = a + Math.PI / 2; { const p = x.t * 8; b.legR.piv.rotation.x = 0.8 * Math.sin(p); b.legL.piv.rotation.x = -0.8 * Math.sin(p); } pose15(b, 'cheer', 0.8, x.t, { face: false }); b.setFace({ eyes: 'happy', mouth: 'laugh' });
    shot(x, V(0, 2.4, 16), V(0.1, 0.35, 1), 19.0, 44, { push: 0.03 }); return s; });
  // 52 "Só um dia, você prometeu" — sepia: outside he holds up ONE finger; inside the mirror the boy nods, hands on the glass
  at(85.06, 'um_dia', x => { const s = S.bed; sepia(x); const b = put(x, s, C.Np, -0.6, -6.6, Math.PI + 0.35, 0); layer(b, 1); alive(b, x.t, 1, 1); pose15(b, 'oneFinger', gestW(x.L, 0.08, 99), x.t);
    const t = put(x, s, C.Op, -3.0, -8.75, Math.PI, 0); layer(t, 2); pose15(t, 'palmGlass', 1, x.t); t.allowObst = new Set(['espelho-quarto']); t.setFace({ eyes: 'sad', mouth: 'smile' }); t.head.rotation.x += 0.12 * Math.sin(x.t * 6) * sm(seg(x.L, 0.9, 1.3));
    shot(x, mc(mir(s), -1.3).add(V(1.0, 0, 1.6)), V(0.6, 0.05, 1), 9.0, 42, { push: 0.05 }); return s; });
  // 53 "e nunca mais voltou" — sepia: inside the mirror the boy sits alone on the floor, waiting; the calendar runs
  const floorSit = (t) => { sit15(t, 0.0, 0.9); t.hip.position.y = 0.85; for (const L of [t.legR, t.legL]) L.knee.rotation.x += 0.9; };
  at(86.92, 'nunca_voltou', x => { const s = S.bed; sepia(x); const t = put(x, s, C.Op, -2.5, -7.4, Math.PI, 0); layer(t, 2); floorSit(t); t.setFace({ eyes: 'sad', mouth: 'frown', brow: -1 }); pose15(t, 'sad', 1, x.t); lap(t, 0.8);
    shot(x, mc(mir(s), -1.6), V(0.35, 0.05, 1), 8.5, 40, { push: 0.06 }); return s; });
  // 54 "Eu não era o menino" — present: he looks at his own hands, horrified
  at(88.36, 'nao_era', x => { const s = S.bed; const n = put(x, s, C.N, 0.4, -4.6, 0.3, 0); alive(n, x.t, 0.5, 1); pose15(n, 'lookHands', gestW(x.L, 0.05, 99), x.t); shot(x, headP(n, -0.7), V(0.3, 0.12, 1), 7.0, 40, { push: 0.06 }); return s; });
  // 55 "eu era o reflexo" — punch-in; he FLIPS like an image in a mirror (sparkles) — the watch jumps to the other wrist
  at(89.41, 'era_reflexo', x => { const s = S.bed; const n = put(x, s, C.N, 0.4, -4.6, 0.3, 0); alive(n, x.t, 0.5, 1); n.setFace({ eyes: 'circle', mouth: 'o', brow: -0.8 }); const k = eio(seg(x.L, 0.2, 0.75)); let sx = Math.cos(k * Math.PI); if (Math.abs(sx) < 0.08) sx = 0.08 * (k < 0.5 ? 1 : -1); n.root.scale.x = sx * n.baseScale;
    sparks(x, s, headP(n, -2.2), { r: 1.5, up: 4.5, amt: Math.sin(k * Math.PI), size: 0.3 }); grade.flash.value = 0.04 * Math.sin(k * Math.PI); n.noQA = x.L > 0.15 && x.L < 0.8;
    shot(x, headP(n, -0.8), V(0.25, 0.08, 1), 8.0, 40, { push: 0.04, punch: 0.15, pk: 0.12 }); return s; });
  // 56 "Ele passou 10 anos dentro do espelho" — inside the mirror: the other one alone, sitting (desaturated)
  at(90.48, 'dez_anos_dentro', x => { const s = S.bed; grade.sat.value = 0.6; const t = put(x, s, C.O, -2.5, -7.0, Math.PI, 0); layer(t, 2); floorSit(t); pose15(t, 'sad', 1, x.t); lap(t, 0.8); t.setFace({ eyes: 'sad', mouth: 'frown' });
    shot(x, mc(mir(s), -1.4), V(0.3, 0.05, 1), 9.5, 40, { push: 0.07 }); return s; });
  // 57 "fazendo a minha lição" — inside the mirror: doing HIS homework at the desk
  at(92.61, 'fazendo_licao', x => { const s = S.bed; grade.sat.value = 0.7; const tw = homework(x, s, C.O); const m = mir(s); frame(x, [mc(m, 3.8), mc(m, -3.8)], V(0.5, 0.1, 1), { fov: 42, m: 0.8 }); return s; });
  // 58 "indo no meu dentista" — dentist mirror: it's him in the chair
  at(93.79, 'meu_dentista', x => { const s = S.dentist; grade.sat.value = 0.7; const { d, tw } = dentistScene(x, s, C.O); const m = mir(s); frame(x, [headP(d), V(2.5, 4.0, -3.0), refl(m, headP(tw, 0.5)), refl(m, headP(tw, -2.0))], V(0.2, 0.15, 1), { fov: 44 }); return s; });
  // 59 "pedindo as minhas desculpas" — kitchen mirror: him bowing to the mom
  at(95.05, 'minhas_desculpas', x => { const s = S.kitchen; grade.sat.value = 0.7; let tw; apology(x, s, () => { tw = put(x, s, C.O, -7.9, 3.8, Math.PI, 0); layer(tw, 2); alive(tw, x.t, 1, 5); pose15(tw, 'bow', gestW(x.L, 0.15, 99), x.t); return tw; }); const m = mir(s);
    frame(x, [headP(C.mae), refl(m, headP(tw, 0.4)), refl(m, headP(tw, -2.4))], V(0.75, 0.15, 1), { fov: 44 }); return s; });
  // 60 "esperando eu devolver a vida dele" — close: inside the mirror, both hands on the glass, waiting; the glass trembles
  at(96.63, 'esperando', x => { const s = S.bed; grade.sat.value = 0.8; const m = mir(s); const t = put(x, s, C.O, -2.5, -8.75, Math.PI, 0); layer(t, 2); pose15(t, 'palmGlass', 1, x.t); t.allowObst = new Set(['espelho-quarto']); t.setFace({ eyes: 'sad', mouth: 'frown', brow: -0.8 }); t.head.rotation.x += 0.05 * Math.sin(x.t * 2);
    ripple(m, (x.L % 0.9), 0.35, 0.5, 0.33); shot(x, mc(m, -1.5), V(0.15, 0.02, 1), 6.0, 40, { push: 0.06 }); return s; });
  // 61 "E agora" — night: he stands up from the bed
  at(98.49, 'e_agora', x => { const s = S.bedN; const o = put(x, s, C.O, 4.25, -6.2, -Math.PI / 2, 0); const k = 1 - eio(seg(x.L, 0.0, 0.5)); sit15(o, SC.bed + 0.15, k); o.root.position.x = mix(3.6, 4.25, k); o.allowObst = new Set(['cama']); o.setFace({ eyes: 'angry', mouth: 'flat', brow: 1 }); alive(o, x.t, 0.4, 2);
    shot(x, headP(o, -0.8), V(-1, 0.0, 0.45), 8.0, 40, { push: 0.05 }); return s; });
  // 62 "ele quer o lugar dele de volta" — he points at the mirror; the boy backs away, scared
  at(99.12, 'de_volta', x => { const s = S.bedN; const o = put(x, s, C.O, 1.8, -5.0, -2.4, 0); alive(o, x.t, 1, 2); pose15(o, 'pointAt', gestW(x.L, 0.25, 99), x.t, { face: false }); o.setFace({ eyes: 'angry', mouth: 'flat', brow: 1 });
    const n = put(x, s, C.N, 0, 0, 0, 0); walkPath(n, x.L, 0.4, 1.6, [4.0, -1.4], [5.4, 0.4], { stride: 2.0, face: false }); n.root.rotation.y = -2.2; pose15(n, 'scared', gestW(x.L, 0.35, 99), x.t);
    frame(x, [headP(o), headP(n), mc(mir(s), 0.5)], V(-0.55, 0.15, 0.85), { fov: 44 }); return s; });
  // 63 "Eu corri para o meu quarto" — he runs in through the door from the hallway
  at(100.99, 'correu', x => { const s = S.bed; s.userData.room.doors.quarto.set(sm(seg(x.L, -0.4, 0.15))); const n = put(x, s, C.N, 0, 0, 0, 0); walkPath(n, x.L, 0.0, x.d + 0.2, [17.5, 4.0], [10.6, 4.0], { stride: 2.6, run: 0.8 }); n.setFace({ eyes: 'circle', mouth: 'scream', brow: -0.8, sweat: 1 }); if (n.root.position.x > 12.0) n.noFrame = true;
    camAt(x, V(4.0, 5.0, 7.5), V(n.root.position.x - 1.0, 3.6, 3.6), 44); return s; });
  // 64 "E o espelho" — the mirror alone, reflecting the room
  at(102.08, 'o_espelho', x => { const s = S.bed; shot(x, mc(mir(s), -0.2), V(0.2, 0.0, 1), 10.0, 42, { push: 0.07 }); return s; });
  // 65 "pela primeira vez na vida" — he stands in front of it… and is NOT there
  at(103.02, 'primeira_vez', x => { const s = S.bed; const n = put(x, s, C.N, -1.0, -6.6, Math.PI + 0.25, 0); layer(n, 1); alive(n, x.t, 1, 1); pose15(n, 'waveR', gestW(x.L, 0.3, 99), x.t, { face: false }); n.setFace({ eyes: 'wide', mouth: 'o' }); const m = mir(s); frame(x, [headP(n), refl(m, headP(n)), refl(m, headP(n, -2.6))], V(0.5, 0.12, 1), { fov: 42 }); return s; });
  // 66 "estava completamente vazio" — he touches the glass: ripple, still nothing
  at(104.60, 'vazio', x => { const s = S.bed; const m = mir(s); const n = put(x, s, C.N, -2.5, -8.6, Math.PI, 0); layer(n, 1); pose15(n, 'palmGlass', gestW(x.L, 0.1, 99), x.t); n.allowObst = new Set(['espelho-quarto']); n.setFace({ eyes: 'sad', mouth: 'o' }); ripple(m, x.L - 0.45, 0.8, 0.5, 0.33);
    shot(x, mc(m, -1.0).add(V(0.5, 0, 0.6)), V(0.55, 0.03, 1), 7.5, 40, { push: 0.05 }); return s; });
  // 67 "esperando por mim" — slow push into the empty mirror; it glows, inviting… fade
  at(106.53, 'esperando_mim', x => { const s = S.bedN; const m = mir(s); m.u.flash.value = 0.08 + 0.1 * sm(seg(x.L, 0.6, 1.8)); ripple(m, (x.L % 1.4) * 0.8, 0.25, 0.5, 0.45); shot(x, mc(m, -0.2), V(0.0, 0.0, 1), 9.0, 42, { push: 0.22 }); grade.fade.value = sm(seg(x.L, 1.4, 1.85)); return s; });
  return { SHOTS: SH, DUR: 108.4 }; }
