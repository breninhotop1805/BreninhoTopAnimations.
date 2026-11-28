// EP04 "Na minha escola" — shot list. Each shot illustrates its phrase literally; cut ~1 frame before the word (word onset − 0.04).
// HIS model never changes: "his hair turns green" = his top hat turns emerald and glows (C.N.hatGreen). Eye colours only in the eye close-ups.
import * as THREE from 'three';
import { walkPath, alive, gestW, eio, eo, sm, seg, mix, cl, startle, talk, sit15, reach, springE } from './act.js';
import { pose15, POSE15 } from './poses15.js';
import { SC } from './kit.js';
import { COL } from './cast.js';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
POSE15.armsCross = { arms: c => [[c.armR, c.torso, V(0.3, 1.18, 0.7)], [c.armL, c.torso, V(-0.3, 1.3, 0.82)]], head: [0.04, 0, 0.12], face: { eyes: 'smug', mouth: 'smirk', brow: -0.3 } };
POSE15.hatDown = { arms: c => [[c.armR, c.head, V(-1.0, 1.12, 0.2)], [c.armL, c.head, V(1.0, 1.12, 0.2)]], head: [0.18, 0, 0], torso: [0.1, 0, 0], shake: 0.012, face: { eyes: 'squeeze', mouth: 'wavy', sweat: 1, blush: 0.6 } };
POSE15.beanieHold = { arms: c => [[c.armR, c.head, V(-0.88, 1.15, 0.15)], [c.armL, c.head, V(0.88, 1.15, 0.15)]], head: [0.1, 0, 0], face: { eyes: 'sad', mouth: 'wavy', blush: 0.8 } };
POSE15.offer = { arms: c => [[c.armR, c.torso, V(-0.3, 1.35, 1.35)]], head: [0.05, 0, 0] };
POSE15.pointFwd = { arms: c => [[c.armR, c.torso, V(-0.4, 1.9, 1.9)]], head: [0, 0, 0] };
POSE15.pointAt = { arms: c => [[c.armR, c.torso, V(-0.6, 1.6, 2.0)]], head: [0, 0, 0] };
POSE15.hug = { arms: c => [[c.armR, c.torso, V(-0.4, 1.2, 0.9)], [c.armL, c.torso, V(0.2, 1.25, 0.95)]], head: [0, 0, 0.15], face: { eyes: 'happy', mouth: 'smile', blush: 1 } };
POSE15.fan = { arms: c => [[c.armR, c.head, V(-0.4, 0.5, 0.95)]], head: [-0.1, 0, 0], face: { eyes: 'tired', mouth: 'o', sweat: 1 } };
POSE15.jack = { arms: c => [[c.armR, c.torso, V(-1.1, 3.25, 0.2)], [c.armL, c.torso, V(1.1, 3.25, 0.2)]], head: [-0.1, 0, 0] };
POSE15.gavelUp = { arms: c => [[c.armR, c.torso, V(-0.55, 2.7, 0.75)]], head: [0, 0, 0], face: { eyes: 'angry', mouth: 'open', brow: 1 } };
POSE15.gavelDown = { arms: c => [[c.armR, c.torso, V(-0.45, 1.0, 1.35)]], head: [0.15, 0, 0], face: { eyes: 'angry', mouth: 'scream', brow: 1 } };
POSE15.lift = { arms: c => [[c.armR, c.torso, V(-0.45, 3.0, 0.95)], [c.armL, c.torso, V(0.45, 3.0, 0.95)]], head: [-0.25, 0, 0] };
POSE15.whisper = { arms: c => [[c.armR, c.head, V(-0.35, 0.3, 0.8)]], head: [0, 0, 0.18], face: { eyes: 'normal', mouth: 'smallo', brow: 0.4 } };
POSE15.toss = { arms: c => [[c.armR, c.torso, V(-0.9, 2.6, 0.9)]], head: [-0.1, 0, 0] };
export function makeShots(ctx) { const { C, S, P, FX, camera, grade, bloom } = ctx; const SH = []; const at = (t, name, fn, o = {}) => SH.push({ t, name, fn, ...o });
  const N = C.N, G = C.G, Gs = C.Gs, B = C.B, BG = C.BG, K = C.kids;
  // ---------- helpers ----------
  const put = (x, s, c, px, pz, ry = 0, y = 0) => { x.scene = s; s.add(c.root); c.root.position.set(px, y, pz); c.root.rotation.y = ry; x.live.push(c); return c; };
  const headP = (c, dy = 0) => { c.root.updateMatrixWorld(true); return c.head.localToWorld(V(0, 0.66 + dy, 0.3)); };
  const hatP = (dy = 0) => { N.root.updateMatrixWorld(true); return N.head.localToWorld(V(0, 1.45 + dy, 0)); };
  function shot(x, target, dir, dist, fov = 40, o = {}) { const k = eio(x.u); const d = dist * (1 - (o.push ?? 0.05) * x.d * k); const P_ = target.clone().add(dir.clone().normalize().multiplyScalar(d)); if (o.drift) P_.add(V(o.drift * (k - 0.5), 0, 0).applyAxisAngle(V(0, 1, 0), Math.atan2(dir.x, dir.z)));
    if (o.rise) P_.y += o.rise * (k - 0.5); camera.position.copy(P_); camera.lookAt(target); camera.fov = fov; if (o.punch != null) camera.fov *= 1 - (o.pk ?? 0.12) * eo(seg(x.L, o.punch, o.punch + 0.25)); x.focus = d; }
  const frame = (x, pts, dir, o = {}) => { const c = pts.reduce((a, p) => a.add(p), V(0, 0, 0)).multiplyScalar(1 / pts.length).add(o.off || V(0, 0, 0)); const dn = dir.clone().normalize(); camera.fov = o.fov || 42; camera.updateProjectionMatrix(); const m = o.m ?? 0.72;
    const rm = x.scene?.userData.room, inside = p => !rm || (Math.abs(p.x) < rm.W / 2 - 0.9 && Math.abs(p.z - (rm.CZ || 0)) < rm.D / 2 - 0.9 && p.y < rm.H - 0.9);
    const fits = () => { camera.updateProjectionMatrix(); camera.updateMatrixWorld(true); return pts.every(p => { const q = p.clone().project(camera); return Math.abs(q.x) < m && Math.abs(q.y) < m && q.z < 1; }); };
    let d = o.min ?? 3, entered = false; for (; d < 90; d += 0.2) { camera.position.copy(c).addScaledVector(dn, d); const ins = inside(camera.position); if (ins) entered = true; if (!ins && !entered) continue; if (!ins) { d -= 0.2; camera.position.copy(c).addScaledVector(dn, d); camera.lookAt(c); while (!fits() && camera.fov < 78) camera.fov += 1; break; } camera.lookAt(c); if (fits()) break; }
    d *= 1 - (o.push ?? 0.05) * x.d * eio(x.u); camera.position.copy(c).addScaledVector(dn, d); if (o.rise) camera.position.y += o.rise * (eio(x.u) - 0.5); camera.lookAt(c); if (o.punch != null) camera.fov *= 1 - (o.pk ?? 0.1) * eo(seg(x.L, o.punch, o.punch + 0.25)); x.focus = d; };
  const camAt = (x, pos, look, fov = 42) => { camera.position.copy(pos); camera.lookAt(look); camera.fov = fov; x.focus = pos.distanceTo(look); };
  const front = (x, c, dist, h = 4.2, ly = 3.0) => { camera.position.set(c.root.position.x, h, c.root.position.z - dist); camera.lookAt(c.root.position.x, ly, c.root.position.z); camera.fov = 42; x.focus = dist; };
  const lap = (c, w = 1) => { c.root.updateMatrixWorld(true); for (const [A, Lg] of [[c.armR, c.legR], [c.armL, c.legL]]) { const a = Lg.piv.getWorldPosition(V(0, 0, 0)), k = Lg.knee.getWorldPosition(V(0, 0, 0)); reach(c, A, a.lerp(k, 0.62).add(V(0, 0.42 * c.root.scale.y, 0)), w); } };
  const palm = (c, side = 'R') => { c.root.updateMatrixWorld(true); return new THREE.Box3().setFromObject(c['arm' + side].handMesh).getCenter(V(0, 0, 0)); };
  const lookTo = (c, p, w = 1) => { c.root.updateMatrixWorld(true); const hp = c.head.getWorldPosition(V(0, 0, 0)).add(V(0, 0.66 * c.root.scale.y, 0)); const d = p.clone().sub(hp); let yaw = Math.atan2(d.x, d.z) - c.root.rotation.y; yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
    c.head.rotation.y += cl(yaw, -1.0, 1.0) * w; c.torso.rotation.y += (cl(yaw - 1.0, 0, 0.4) + cl(yaw + 1.0, -0.4, 0)) * w; c.head.rotation.x += cl(-Math.atan2(d.y, Math.hypot(d.x, d.z)), -0.45, 0.45) * w; };
  const seat = (x, s, c, st, w = 1) => { put(x, s, c, st.x, st.z, Math.PI, 0); sit15(c, SC.seat, w); c.allowObst = new Set(['cadeira', 'carteira']); lap(c, w); return c; };
  const sparks = (x, s, p, o = {}) => { const g = FX.sparks; s.add(g); g.position.copy(p); for (const h of g.children) { const ph = (h.userData.ph + x.t * (o.speed || 0.4)) % 1; const r = (o.r || 1.6) * h.userData.r * (0.4 + ph * 0.6); h.position.set(Math.cos(h.userData.a + ph * 2) * r, (o.up ?? 2.2) * ph - 0.6, Math.sin(h.userData.a + ph * 2) * r);
      h.scale.setScalar((o.size || 0.3) * (1 - ph * 0.6)); h.material.opacity = (o.amt ?? 1) * Math.sin(ph * Math.PI); h.material.color.set(o.col || '#ffffff'); } };
  const hearts = (x, s, p, o = {}) => { const g = FX.hearts; s.add(g); g.position.copy(p); const a = o.a ?? 0; const k = cl((x.L - a) / 0.25); for (const h of g.children) { const ph = (h.userData.ph + Math.max(0, x.L - a) * (o.speed || 0.45)) % 1; const r = (o.r || 1.2) * (0.3 + 0.7 * ((h.userData.a * 0.37) % 1));
      h.position.set(Math.cos(h.userData.a) * r, ph * (o.up ?? 2.6), Math.sin(h.userData.a) * r * 0.4); const sz = (o.size || 0.55) * springE(k) * (0.6 + 0.4 * Math.sin(ph * Math.PI)); h.scale.setScalar(Math.max(0.001, sz)); h.material.opacity = (x.L < a ? 0 : 1) * Math.min(1, Math.sin(ph * Math.PI) * 1.6) * (o.amt ?? 1); } };
  const conf = (x, s, p, a) => { const g = FX.conf; s.add(g); g.position.copy(p); const u = Math.max(0, x.L - a); for (const l of g.children) { const ang = l.userData.a, v = 3 + 3 * l.userData.ph; l.position.set(Math.cos(ang) * v * u * 0.6, 4 * u - 4.5 * u * u + 0.5, Math.sin(ang) * v * u * 0.6); l.rotation.set(u * 9 + ang, u * 7, ang); l.visible = x.L > a && l.position.y > -3; } };
  const bubble = (x, s, spr, p, a, sz = 1.3) => { if (x.L < a) return; s.add(spr); spr.position.copy(p); const k = springE(seg(x.L, a, a + 0.35)); spr.scale.setScalar(sz * k); spr.position.y += 0.15 * Math.sin(x.t * 3); };
  // hair colour change on any NPC (sweep crown -> tips with a bright band) + sparks
  const hairTo = (x, s, c, col, a, dur = 0.5, glow = 0.4) => { const k = sm(seg(x.L, a, a + dur)); c.hfx.set({ a: col, sweep: k, band: k > 0 && k < 1 ? 1 : 0, glow: glow * k }); if (x.L > a - 0.05 && x.L < a + dur + 0.5) sparks(x, s, headP(c, 0.4), { r: 1.1, up: 1.8, amt: 1 - sm(seg(x.L, a + dur, a + dur + 0.5)), col }); };
  // HIS "hair": the top hat goes green (k) and glows
  const hatTo = (x, s, a, dur = 0.45, glow = 1) => { const k = sm(seg(x.L, a, a + dur)); N.hatGreen(k, glow); if (x.L > a - 0.05 && x.L < a + dur + 0.6) sparks(x, s, hatP(-0.2), { r: 1.0, up: 1.6, amt: 1 - sm(seg(x.L, a + dur, a + dur + 0.6)), col: '#7affb0' }); return k; };
  const greenHat = (x, s, glow = 1) => { N.hatGreen(1, glow * (0.85 + 0.15 * Math.sin(x.t * 5))); };
  const crowdWalk = (x, s, list, z0, z1, xs, sp = 1, o = {}) => list.forEach((c, i) => { const ph = ((x.t * 0.16 * sp + i * 0.37) % 1); put(x, s, c, 0, 0, 0, 0); walkPath(c, ph * 6, 0, 6, [xs[i], z0 + (i % 3)], [xs[i], z1 + (i % 3)], { stride: 2.3, linear: true }); c.noFrame = true; if (o.cap) c.wear('cap'); });
  const tint = (r, g, b) => grade.tint.value.set(r, g, b);
  // ======================= SHOTS =======================
  // 1 "Na minha escola," — HIM walking toward camera in the colourful school yard; kids with coloured hair cross behind
  at(0.0, 'abertura', x => { const s = S.school; const h = put(x, s, N, -1.6, 14, Math.PI, 0); walkPath(h, x.L + 0.6, 0, 3.5, [-1.6, 16.0], [-1.6, 9.5], { stride: 2.4 }); h.setFace({ eyes: 'happy', mouth: 'grin' });
    crowdWalk(x, s, [K[0], K[3], K[7]], 26, 17, [-6.5, 7.0, -4.5]); front(x, h, 8.6, 4.0, 3.4); return s; });
  // 2 "quando você se apaixona," — a boy and a girl on the low wall look at each other; hearts pop between them
  const bench = (x, s) => { const b = put(x, s, K[4], 12.0, 4.1, 0.55, 0); sit15(b, SC.seat); b.allowObst = new Set(['muretinha']); lap(b); const g = put(x, s, K[1], 16.4, 4.1, -0.55, 0); sit15(g, SC.seat); g.allowObst = new Set(['muretinha']); lap(g); return { b, g }; };
  at(0.94, 'apaixona', x => { const s = S.school; const { b, g } = bench(x, s); b.setFace({ eyes: 'happy', mouth: 'smile', blush: 0.8 }); g.setFace({ eyes: 'happy', mouth: 'smile', blush: 1 }); b.head.rotation.z += 0.12 * sm(seg(x.L, 0.2, 0.6)); g.head.rotation.z -= 0.12 * sm(seg(x.L, 0.3, 0.7));
    hearts(x, s, V(14.2, 4.3, 4.3), { a: 0.35, r: 0.9, size: 0.6 }); frame(x, [headP(b), headP(g), headP(b, -2.2)], V(0, 0.12, 1), { fov: 40, m: 0.62 }); return s; });
  // 3 "o seu cabelo fica" — close: HIS hair sweeps from black to the girl's purple, glowing band + sparks
  at(2.25, 'cabelo', x => { const s = S.school; const { b, g } = bench(x, s); g.noFrame = true; b.setFace({ eyes: 'happy', mouth: 'smile', blush: 1 }); hairTo(x, s, b, '#9a5ae8', 0.2, 0.7, 0.5); if (x.L > 0.6) b.setFace({ eyes: 'shock', mouth: 'o', blush: 1 });
    frame(x, [headP(b, 0.8), headP(b, -0.6)], V(0.3, 0.05, 1), { fov: 36, m: 0.5, push: 0.08 }); return s; });
  // 4 "da cor dos olhos da pessoa" — close on her PURPLE anime eyes; she blinks shyly
  at(3.62, 'olhos', x => { const s = S.school; const { b, g } = bench(x, s); b.noFrame = true; b.hfx.set({ a: '#9a5ae8', sweep: 1, glow: 0.3 }); g.setFace({ eyes: x.L > 0.55 && x.L < 0.7 ? 'closed' : 'normal', mouth: 'smallo', blush: 1 });
    frame(x, [headP(g, 0.25), headP(g, -0.2)], V(-0.35, 0.02, 1), { fov: 32, m: 0.45, push: 0.1 }); return s; });
  // 5 "Hoje, no meio da aula de matemática," — class from the board: the teacher writing, kids; push in to HIM, bored
  const classKids = (x, s, o = {}) => { const st = s.userData.seats; const order = [0, 2, 3, 4, 6, 7, 8, 9, 10, 11];
    K.forEach((c, i) => { seat(x, s, c, st[order[i]]); c.noFrame = true; alive(c, x.t, 1, i); if (o.look) lookTo(c, o.look, o.lw ?? 1); }); const h = seat(x, s, N, st[1]); return h; };
  const teacher = (x, s, writing) => { const p = put(x, s, C.PROF, -2.0, -9.6, Math.PI, 0); p.allowObst = new Set(['mesa da professora']); if (writing != null) { const tip = s.userData.chalk.tipAt(writing); reach(p, p.armR, tip.clone().add(V(0, 0, 0.25)), 1); } return p; };
  at(4.84, 'matematica', x => { const s = S.class; const h = classKids(x, s); h.setFace({ eyes: 'tired', mouth: 'flat' }); h.head.rotation.x += 0.1; const k = 0.3 + 0.45 * x.u; s.userData.chalk.set(k); const p = teacher(x, s, k); p.noFrame = true;
    frame(x, [headP(h, 0.9), headP(h, -2.0)], V(0.15, 0.25, -1), { fov: 42, m: 0.6, push: 0.08 }); return s; });
  // 6 "o meu ficou verde-esmeralda." — close on HIM: the top hat goes EMERALD and glows (sparks), his face O.O
  at(6.98, 'verde', x => { const s = S.class; const h = classKids(x, s); s.userData.chalk.set(0.75); teacher(x, s, 0.75).noFrame = true; hatTo(x, s, 0.42, 0.45); h.setFace(x.L < 0.5 ? { eyes: 'tired', mouth: 'flat' } : { eyes: 'shock', mouth: 'o' }); startle(h, x.L, 0.5, 0.6);
    frame(x, [hatP(0.3), headP(h, -0.5)], V(0.1, 0.12, -1), { fov: 36, m: 0.55, push: 0.1, punch: 0.45, pk: 0.1 }); return s; });
  // 7 "Aqui é impossível esconder." — he pulls the glowing hat down with both hands; it shines anyway; classmates behind giggle
  at(8.84, 'esconder', x => { const s = S.class; const h = classKids(x, s, { look: V(-4.3, 5.6, 2.85), lw: 0.8 }); [K[2], K[3]].forEach(c => c.setFace({ eyes: 'happy', mouth: 'laugh' })); s.userData.chalk.set(0.75); teacher(x, s, 0.75).noFrame = true; greenHat(x, s, 1.2);
    pose15(h, 'hatDown', gestW(x.L, 0.15, 99), x.t); N.hatG.position.y = 1.04 - 0.12 * sm(seg(x.L, 0.2, 0.6)); sparks(x, s, hatP(-0.3), { r: 0.9, up: 1.2, amt: 0.6, col: '#7affb0', size: 0.22 });
    frame(x, [hatP(0.3), headP(h, -1.8)], V(-0.35, 0.15, -1), { fov: 40, m: 0.55 }); return s; });
  // 8 "O professor de química está de cabelo azul" — lab: the chemistry teacher (BLUE hair) behind the bench of glowing flasks; push to his hair
  const chem = (x, s) => { const q = put(x, s, C.QUI, 0.8, -7.6, 0, 0); q.allowObst = new Set(['bancada']); alive(q, x.t, 1, 2); q.hfx.set({ a: COL.blue, sweep: 1, glow: 0.25 }); reach(q, q.armR, V(-1.0, 3.4, -5.6), 1); reach(q, q.armL, V(1.4, 3.1, -5.5), 0.8); return q; };
  at(10.57, 'quimico', x => { const s = S.lab; const q = chem(x, s); q.setFace({ eyes: 'happy', mouth: 'smile' }); q.head.rotation.x += 0.25; frame(x, [headP(q, 0.8), headP(q, -1.6), V(0, 3.2, -5)], V(0.1, 0.1, 1), { fov: 40, m: 0.66, push: 0.07, punch: 1.72, pk: 0.12 }); return s; });
  // 9 "há 20 anos," — the lab YEAR sign spins 2006 -> 2026
  at(12.53, 'vinte', x => { const s = S.lab; const q = chem(x, s); q.noFrame = true; const yr = Math.round(2006 + 20 * eo(seg(x.L, 0.15, 0.95))); s.userData.year.set(yr); shot(x, V(4.6, 8.4, -10.6), V(-0.12, -0.05, 1), 7.5, 40, { push: 0.07 }); return s; });
  // 10 "exatamente da cor dos olhos" — cafeteria: he waits in line with his tray, BLUE hair; she serves
  const lunch = (x, s) => { const m = put(x, s, C.MER, 1.0, -9.6, 0, 0); m.allowObst = new Set(['balcão']); alive(m, x.t, 1, 3); const q = put(x, s, C.QUI, 1.4, -4.4, Math.PI, 0); q.hfx.set({ a: COL.blue, sweep: 1, glow: 0.25 }); alive(q, x.t, 1, 5); pose15(q, 'holdFront', 1, x.t); return { m, q }; };
  at(13.86, 'merendeira', x => { const s = S.caf; const { m, q } = lunch(x, s); m.setFace({ eyes: 'normal', mouth: 'smile' }); reach(m, m.armR, V(0.2, 3.6, -7.2), gestW(x.L, 0.3, 99)); frame(x, [headP(m, 0.8), headP(q, 0.6), headP(m, -2)], V(0.5, 0.15, 1), { fov: 42, m: 0.7 }); return s; });
  // 11 "da merendeira." — close on HER BLUE eyes (same blue as his hair)
  at(15.37, 'olhosmer', x => { const s = S.caf; const { m, q } = lunch(x, s); q.noFrame = true; m.setFace({ eyes: 'normal', mouth: 'smallo' }); lookTo(m, headP(q), 0.8); frame(x, [headP(m, 0.25), headP(m, -0.25)], V(0.25, 0.02, 1), { fov: 32, m: 0.42, push: 0.1 }); return s; });
  // 12 "Os dois nunca se falaram." — tray handed over in silence: both look away blushing, "..."
  at(16.46, 'nunca', x => { const s = S.caf; const { m, q } = lunch(x, s); m.setFace({ eyes: 'happy', mouth: 'wavy', blush: 1, look: [0.9, 0.3] }); q.setFace({ eyes: 'normal', mouth: 'wavy', blush: 1, look: [-0.9, 0.3] }); m.head.rotation.y += 0.55 * sm(seg(x.L, 0.1, 0.5)); q.head.rotation.y -= 0.5 * sm(seg(x.L, 0.1, 0.5));
    bubble(x, s, FX.dots, headP(q, 1.7), 0.5, 1.1); frame(x, [headP(q, 0.9), headP(m, 0.9), headP(q, -1.8)], V(-1, 0.12, 0.1), { fov: 40, m: 0.8, min: 4 }); return s; });
  // 13 "O garoto mais popular da escola" — hallway: he walks toward camera, girls around him with hearts
  const popWalk = (x, s) => { const p = put(x, s, C.POP, 0, -6, 0, 0); walkPath(p, x.L, 0, 3.5, [0, -14], [0, -4], { stride: 2.4 }); p.setFace({ eyes: 'smug', mouth: 'smirk', brow: -0.3 });
    const fans = [[K[3], -4.4, -12.5], [K[5], 4.2, -11.5], [K[7], -4.0, -6.2]]; fans.forEach(([c, fx, fz], i) => { put(x, s, c, fx, fz, fx < 0 ? 0.9 : -0.9, 0); alive(c, x.t, 1, i); lookTo(c, headP(p)); c.setFace({ eyes: 'happy', mouth: 'smile', blush: 1 }); c.noFrame = true; }); return p; };
  at(18.16, 'popular', x => { const s = S.hall; const p = popWalk(x, s); hearts(x, s, headP(p, 0.8), { a: 0.2, r: 2.2, size: 0.5 }); frame(x, [headP(p, 0.9), headP(p, -4.0)], V(0, 0.08, 1), { fov: 42, m: 0.62, push: 0.04 }); return s; });
  // 14 "trocou de cor sete vezes num mês só." — his hair flips through 7 colours, a pop + sparks on each
  const SEVEN = ['#e8283a', '#ff8a1a', '#ffd21a', '#3ad85a', '#1fc8e8', '#3a5ae8', '#c84ae8', '#ff5ab0'];
  at(19.66, 'sete', x => { const s = S.hall; const p = put(x, s, C.POP, 0, -6.5, 0, 0); alive(p, x.t, 1, 1); p.setFace({ eyes: 'happy', mouth: 'grin' }); const i = cl(Math.floor((x.L - 0.05) / 0.36), -1, 6); const u = (x.L - 0.05 - i * 0.36) / 0.36;
    if (i < 0) p.hfx.set({ old: SEVEN[0], a: SEVEN[0], sweep: 1 }); else { p.hfx.set({ old: SEVEN[i], a: SEVEN[i + 1], sweep: sm(cl(u / 0.6)), band: u < 0.6 ? 1 : 0, glow: 0.3 }); sparks(x, s, headP(p, 0.4), { r: 1.1, up: 1.5, amt: 0.9, col: SEVEN[i + 1], size: 0.25 }); }
    p.head.rotation.z += 0.08 * Math.sin(x.L * 17) * (x.L < 2.6 ? 1 : 0); frame(x, [headP(p, 0.8), headP(p, -1.2)], V(0.25, 0.05, 1), { fov: 36, m: 0.5, push: 0.06 }); return s; });
  // 15 "E no dia dos namorados," — calendar FEVEREIRO 14 with a heart; hearts float up
  at(22.41, 'namorados', x => { const s = S.class; const c = s.userData.cal; c.updateMatrixWorld(true); const p = c.getWorldPosition(V(0, 0, 0)); hearts(x, s, p.clone().add(V(-0.6, -1.6, 0)), { a: 0.25, r: 1.4, size: 0.45, up: 3.4 }); shot(x, p, V(-1, -0.05, 0.12), 6.4, 40, { push: 0.09 }); return s; });
  // 16 "todo mundo vem de boné." — the yard: everybody walks in wearing caps (punch on "boné")
  at(23.74, 'bone', x => { const s = S.school; const L = [K[0], K[1], K[2], K[3], K[5], K[6], K[7], K[9]]; const xs = [-6.6, -2.2, 2.2, 6.6, -4.4, 0, 4.4, 8.8];
    L.forEach((c, i) => { put(x, s, c, xs[i], 0, Math.PI, 0); const z0 = i < 4 ? 18 : 22; walkPath(c, x.L + 0.3, 0, 4, [xs[i], z0], [xs[i], z0 - 6], { stride: 2.3, linear: true }); c.wear('cap'); c.setFace({ eyes: 'happy', mouth: 'grin' }); c.noFrame = i !== 5; });
    camAt(x, V(0, 5.0, 7.0 - 0.6 * eio(x.u)), V(0, 3.6, 16), 48); camera.fov *= 1 - 0.1 * eo(seg(x.L, 0.9, 1.15)); return s; });
  // 17 "Até os professores." — three teachers in caps at the school door, the chemistry one fixing his
  at(25.24, 'professores', x => { const s = S.school; const T = [[C.QUI, -5.0], [C.PROF, -0.8], [C.DIR, 3.4]]; T.forEach(([c, px], i) => { put(x, s, c, px, 4.4, 0, 0); c.wear('cap'); alive(c, x.t, 1, i); c.setFace({ eyes: 'happy', mouth: 'smile', blush: 0.6 }); });
    C.QUI.hfx.set({ a: COL.blue, sweep: 1 }); reach(C.QUI, C.QUI.armR, C.QUI.head.localToWorld(V(-0.62, 1.3, 0.45)), gestW(x.L, 0.25, 0.95)); C.QUI.setFace({ eyes: 'squeeze', mouth: 'wavy', blush: 1 });
    frame(x, [headP(C.QUI, 0.9), headP(C.DIR, 0.9), headP(C.PROF, -2.4)], V(0, 0.1, 1), { fov: 42, m: 0.66 }); return s; });
  // 18 "Eu sempre achei que comigo nunca ia acontecer." — HIM, arms crossed and smug in the yard; a couple with hearts behind; he shakes his head
  at(26.60, 'comigo', x => { const s = S.school; const h = put(x, s, N, 0, 8.0, 0, 0); alive(h, x.t, 1, 1); pose15(h, 'armsCross', gestW(x.L, 0.15, 99), x.t); h.head.rotation.y += 0.25 * Math.sin(x.L * 6) * sm(seg(x.L, 0.9, 1.2)) * (1 - sm(seg(x.L, 1.8, 2.1)));
    const c1 = put(x, s, K[4], -5.4, 3.6, 0.6, 0); const c2 = put(x, s, K[1], -1.2, 3.6, -0.6, 0); c1.hfx.set({ a: '#9a5ae8', sweep: 1 }); [c1, c2].forEach((c, i) => { c.setFace({ eyes: 'happy', mouth: 'smile', blush: 1 }); c.noFrame = true; alive(c, x.t, 1, i + 3); }); hearts(x, s, V(-4.8, 5.2, 3.6), { r: 0.8, size: 0.45 });
    frame(x, [headP(h, 0.9), headP(h, -2.6)], V(0.2, 0.08, 1), { fov: 42, m: 0.6, push: 0.04 }); return s; });
  // 19 "Até a professora parar de escrever no quadro," — she writes on the board, the chalk moving; she STOPS on "parar"
  at(28.94, 'quadro', x => { const s = S.class; classKids(x, s).noFrame = true; const k = 0.4 + 0.5 * Math.min(x.L, 0.95) / 0.95; s.userData.chalk.set(k); const p = teacher(x, s, k); p.setFace({ eyes: 'normal', mouth: 'flat' }); if (x.L > 0.95) p.setFace({ eyes: 'shock', mouth: 'smallo' });
    frame(x, [headP(p, 0.8), s.userData.chalk.tipAt(0.3), s.userData.chalk.tipAt(1)], V(0.55, 0.05, 1), { fov: 42, m: 0.66 }); return s; });
  // 20 "virar pra turma" — she turns to the class, eyes O.O
  at(31.64, 'virar', x => { const s = S.class; classKids(x, s).noFrame = true; s.userData.chalk.set(0.9); const p = put(x, s, C.PROF, -2.0, -9.6, Math.PI, 0); p.root.rotation.y = Math.PI * (1 - eio(seg(x.L, 0.0, 0.45))); p.setFace({ eyes: 'shock', mouth: 'o' }); reach(p, p.armR, p.torso.localToWorld(V(-0.4, 1.45, 0.75)), 1);
    frame(x, [headP(p, 0.8), headP(p, -1.8)], V(0.05, 0.08, 1), { fov: 38, m: 0.55, push: 0.08 }); return s; });
  // 21 "e soltar o giz no chão." — the chalk slips out of her hand and breaks on the floor (insert)
  at(32.46, 'giz', x => { const s = S.class; const p = put(x, s, C.PROF, -2.0, -9.6, 0, 0); p.setFace({ eyes: 'shock', mouth: 'o' }); const hand = p.torso.localToWorld(V(-0.4, 1.45, 0.75)); reach(p, p.armR, hand, 1); p.noFrame = true;
    const u = Math.max(0, x.L - 0.15); const y = Math.max(0.08, hand.y - 0.3 - 9.8 * u * u * 0.5); s.add(P.chalk); P.chalk.position.set(hand.x, y, hand.z + 0.4 + u * 0.4); P.chalk.rotation.set(u * 9, 0, u * 6 + 0.4);
    if (y <= 0.08) { P.chalk.rotation.set(0, 0, Math.PI / 2); P.chalk.scale.set(1, 0.5, 1); P.chalk.position.x -= 0.25; s.add(P.chalk2); P.chalk2.scale.set(1, 0.5, 1); P.chalk2.rotation.set(0, 0.7, Math.PI / 2); P.chalk2.position.set(hand.x + 0.35 + Math.min(0.4, Math.max(0, x.L - 1.0) * 1.2), 0.08, hand.z + 0.55); }
    shot(x, V(hand.x, Math.max(0.8, y * 0.6 + 0.4), hand.z + 0.4), V(0.3, 0.15, 1), 4.2, 42, { push: 0.04 }); return s; }, { noQA: true });
  // 22 "A sala inteira olhou pra minha cabeça." — every kid turns to look at HIS glowing green hat
  at(34.01, 'olhou', x => { const s = S.class; const hp = V(-4.3, 5.6, 2.85); const lw = sm(seg(x.L, 0.15, 0.7)); const h = classKids(x, s, { look: hp, lw }); greenHat(x, s, 1); h.setFace({ eyes: 'shock', mouth: 'wavy', sweat: 1 }); K.forEach(c => c.setFace({ eyes: 'shock', mouth: 'o' }));
    sparks(x, s, hatP(-0.2), { r: 0.9, up: 1.3, amt: 0.5, col: '#7affb0', size: 0.2 }); frame(x, [hatP(0.5), headP(h, -1.6), headP(K[3], 0.4)], V(0.25, 0.35, -1), { fov: 42, m: 0.62 }); return s; });
  // 23 "Verde." — extreme close on the emerald hat
  at(36.53, 'verde2', x => { const s = S.class; const h = classKids(x, s); greenHat(x, s, 1.2); h.setFace({ eyes: 'shock', mouth: 'wavy', sweat: 1 }); frame(x, [hatP(0.5), hatP(-0.7)], V(0.2, 0.1, -1), { fov: 34, m: 0.45, push: 0.1 }); return s; });
  // 24 "Brilhando." — the glow blooms, sparks everywhere; he grins awkwardly
  at(37.13, 'brilhando', x => { const s = S.class; const h = classKids(x, s); const k = sm(seg(x.L, 0.05, 0.4)); greenHat(x, s, 1 + 1.4 * k); bloom.strength = 0.2 + 0.22 * k; h.setFace({ eyes: 'squeeze', mouth: 'grimace', blush: 1, sweat: 1 }); sparks(x, s, hatP(-0.2), { r: 1.6, up: 2.2, amt: k, col: '#7affb0', size: 0.32 });
    frame(x, [hatP(0.4), headP(h, -0.8)], V(-0.2, 0.08, -1), { fov: 38, m: 0.5, push: 0.1 }); return s; });
  // 25 "E o problema é que, na escola inteira," — aerial over the school yard, rising
  at(37.86, 'problema', x => { const s = S.school; crowdWalk(x, s, [K[0], K[1], K[2], K[3], K[5], K[6]], 24, 10, [-8, -4, 4, 8, -1, 2]); const k = eio(x.u); camAt(x, V(0, 30 + 8 * k, 46 - 6 * k), V(0, 4, 2), 46); return s; }, { noQA: true });
  // 26 "só três pessoas têm olhos verdes." — the stage: three spotlights snap on, three figures
  const spotOn = (s, i, k) => { const p = s.userData.spots[i]; p.sp.intensity = 380 * k; p.cone.material.opacity = 0.1 * k; p.disc.material.opacity = 0.3 * k; };
  const three = (x, s) => { const L = [[B, -5.5], [C.DIR, 0], [G, 5.5]]; L.forEach(([c, px], i) => { put(x, s, c, px, -5.6, 0, 1.19); alive(c, x.t, 1, i); c.allowObst = new Set(['palco']); }); B.setFace({ eyes: 'normal', mouth: 'smirk', brow: -0.5, iris: '#1fb85a' }); pose15(B, 'crossArms', 1, x.t, { face: false }); C.DIR.setFace({ eyes: 'normal', mouth: 'flat' }); G.setFace({ eyes: 'normal', mouth: 'wavy', blush: 0.6 }); return L; };
  at(40.07, 'tres', x => { const s = S.stage; three(x, s); for (let i = 0; i < 3; i++) spotOn(s, i, x.L > 0.05 + i * 0.12 ? 1 : 0); frame(x, [headP(B, 0.9), headP(G, 0.9), V(0, 1.2, -5.6)], V(0, 0.18, 1), { fov: 42, m: 0.72, punch: 1.45, pk: 0.08 }); return s; });
  // 27 "O valentão do nono ano." — low angle on the bully in his spotlight, arms crossed, green eyes
  at(42.08, 'valentao', x => { const s = S.stage; three(x, s); spotOn(s, 0, 1); for (const c of [C.DIR, G]) c.noFrame = true; frame(x, [headP(B, 0.7), headP(B, -2.6)], V(0.15, -0.12, 1), { fov: 38, m: 0.55, push: 0.07 }); return s; });
  // 28 "A diretora." — she pushes up her glasses (green eyes)
  at(43.63, 'diretora', x => { const s = S.stage; three(x, s); spotOn(s, 1, 1); for (const c of [B, G]) c.noFrame = true; reach(C.DIR, C.DIR.armR, C.DIR.head.localToWorld(V(-0.36, 0.98, 0.72)), gestW(x.L, 0.1, 99)); frame(x, [headP(C.DIR, 0.6), headP(C.DIR, -1.4)], V(-0.1, 0.05, 1), { fov: 36, m: 0.5, push: 0.08 }); return s; });
  // 29 "E a menina nova," — the new girl in her beanie, shy, in the light
  at(44.26, 'menina', x => { const s = S.stage; three(x, s); spotOn(s, 2, 1); for (const c of [B, C.DIR]) c.noFrame = true; pose15(G, 'beanieHold', gestW(x.L, 0.2, 99) * 0.6, x.t, { face: false }); frame(x, [headP(G, 0.9), headP(G, -1.6)], V(-0.2, 0.06, 1), { fov: 36, m: 0.5, push: 0.08 }); return s; });
  // 30 "que chegou faz duas semanas." — her first day: she walks in through the school yard, looking around
  at(45.25, 'chegou', x => { const s = S.school; const g = put(x, s, G, 0, 0, Math.PI, 0); walkPath(g, x.L, 0, 2.2, [-3, 16], [-1.5, 8.5], { stride: 2.2 }); g.head.rotation.y += 0.45 * Math.sin(x.L * 2.6); g.setFace({ eyes: 'normal', mouth: 'smallo', blush: 0.5 }); front(x, g, 8.2, 4.2, 3.0); return s; });
  // 31 "Na hora do recreio," — recess: kids running on the court
  at(47.18, 'recreio', x => { const s = S.school; const L = [K[0], K[2], K[3], K[6], K[7], K[8]]; L.forEach((c, i) => { const ph = (x.t * 0.25 + i * 0.29) % 1; const z = 15 + (i % 3) * 3.2; put(x, s, c, 0, 0, 0, 0); walkPath(c, ph * 3, 0, 3, [-11 + (i % 2) * 2, z], [11 - (i % 2) * 2, z], { stride: 3.2, run: 1, linear: true }); c.setFace({ eyes: 'happy', mouth: 'laugh' }); c.noFrame = true; });
    shot(x, V(0, 3.5, 18), V(-0.3, 0.35, 1), 20, 44, { push: 0.05 }); return s; }, { noQA: true });
  // 32 "a escola virou um tribunal." — a kid bangs a gavel on the bets table: BANG on "tribunal"
  const court = (x, s) => { const j = put(x, s, K[2], -10.5, 3.4, 0, 0); j.allowObst = new Set(['mesa']); const ring = [[K[0], -15.9, 10.8, Math.PI + 0.3], [K[3], -12.3, 11.4, Math.PI], [K[7], -8.7, 11.4, Math.PI], [K[9], -5.1, 10.8, Math.PI - 0.3]];
    ring.forEach(([c, px, pz, ry], i) => { put(x, s, c, px, pz, ry, 0); alive(c, x.t, 1, i); c.noFrame = true; }); return j; };
  at(48.28, 'tribunal', x => { const s = S.school; const j = court(x, s); const hit = 0.82; const up = x.L < hit ? gestW(x.L, 0.1, hit) : 0; pose15(j, 'gavelUp', up, x.t); if (x.L >= hit) reach(j, j.armR, V(-10.5, SC.table + 0.6, 5.4), 1); if (x.L >= hit) j.setFace({ eyes: 'angry', mouth: 'scream', brow: 1 }); const pp = palm(j); s.add(P.gavel); P.gavel.position.copy(pp); P.gavel.rotation.set(x.L >= hit ? 1.3 : 0.2, 0, 0);
    frame(x, [headP(j, 0.9), V(-10.5, SC.table, 6.0), headP(K[3], 0.5)], V(1, 0.3, 0.25), { fov: 42, m: 0.66 }); if (x.L > hit && x.L < hit + 0.25) camera.position.y += 0.05 * Math.sin(x.L * 90); return s; });
  // 33 "Fizeram um quadro de suspeitos no mural," — the cork board on the easel; a kid pins the last photo
  const boardP = (s, dx = 0, dy = 0) => { const b = s.userData.board; b.updateMatrixWorld(true); return b.localToWorld(V(dx, dy, 0.3)); };
  at(49.82, 'suspeitos', x => { const s = S.school; const k = put(x, s, K[5], 25.0, 14.7, Math.PI, 0); k.allowObst = new Set(['mural']); alive(k, x.t, 1, 2); reach(k, k.armR, boardP(s, 3.0, 0.3).add(V(0, 0, 0.3)), gestW(x.L, 0.2, 1.4)); k.setFace({ eyes: 'happy', mouth: 'grin' });
    const k2 = put(x, s, K[0], 18.0, 18.2, Math.PI - 0.3, 0); pose15(k2, 'pointAt', gestW(x.L, 0.6, 99) * 0.8, x.t, { face: false }); k2.setFace({ eyes: 'shock', mouth: 'o' }); k2.noFrame = true;
    frame(x, [boardP(s, -4.6, 3), boardP(s, 4.6, -3.0), headP(k)], V(-0.25, 0.06, 1), { fov: 42, m: 0.7 }); return s; });
  // 34 "com foto e tudo." — close on the polaroids (real portraits) and the red strings
  at(52.06, 'foto', x => { const s = S.school; const c = boardP(s, 0, 0.2); shot(x, c, V(-0.15, 0, 1), 7.0, 40, { push: 0.08, drift: -1.2 }); return s; });
  // 35 "Abriram apostas." — kids slap lunches on the table in front of the odds board
  const betters = (x, s) => { const a = put(x, s, K[6], -12.6, 3.6, 0.15, 0); const b2 = put(x, s, K[1], -8.4, 3.6, -0.15, 0); [a, b2].forEach((c, i) => { alive(c, x.t, 1, i); c.allowObst = new Set(['mesa']); }); return { a, b: b2 }; };
  at(53.12, 'apostas', x => { const s = S.school; const { a, b } = betters(x, s); reach(a, a.armR, V(-11.6, SC.table + 0.5, 5.6), gestW(x.L, 0.15, 99)); reach(b, b.armL, V(-9.4, SC.table + 0.5, 5.6), gestW(x.L, 0.35, 99)); a.setFace({ eyes: 'happy', mouth: 'laugh' }); b.setFace({ eyes: 'angry', mouth: 'grin', brow: -0.6 });
    [[0, -11.6, 0.15], [1, -9.4, 0.35]].forEach(([i, px, a0]) => { const k = springE(seg(x.L, a0 + 0.1, a0 + 0.4)); if (x.L > a0 + 0.1) { s.add(P.sand[i]); P.sand[i].position.set(px, SC.table + 0.05 + (1 - k) * 0.8, 5.9); } });
    frame(x, [headP(a, 0.8), headP(b, 0.8), V(-10.5, 6.6, -1.4)], V(0, 0.25, 1), { fov: 42, m: 0.7 }); return s; });
  // 36 "A diretora era a favorita." — the odds board on the wall: DIRETORA 3 x 1 (punch); a kid points at it
  at(54.37, 'favorita', x => { const s = S.school; const { a, b } = betters(x, s); a.noFrame = b.noFrame = true; reach(a, a.armR, V(-13.4, 6.2, 0.8), gestW(x.L, 0.3, 99) * 0.8); shot(x, V(-10.5, 6.1, -1.45), V(0.05, 0.25, 1), 5.0, 40, { push: 0.06, punch: 1.05, pk: 0.12 }); return s; });
  // 37 "Três lanches contra um." — three sandwiches pop on one side, one on the other
  at(56.11, 'lanches', x => { const s = S.school; [[0, -11.4, 6.4, 0.05], [1, -10.7, 6.2, 0.18], [2, -11.1, 6.9, 0.31], [3, -9.0, 6.6, 0.98]].forEach(([i, px, pz, a0]) => { const k = springE(seg(x.L, a0, a0 + 0.3)); if (x.L > a0) { s.add(P.sand[i]); P.sand[i].position.set(px, SC.table + 0.05 + (1 - k) * 0.6, pz); P.sand[i].scale.setScalar(1.3); } });
    shot(x, V(-10.4, SC.table + 0.4, 6.6), V(0, 0.55, 1), 6.0, 40, { push: 0.06 }); return s; }, { noQA: true });
  // 38 "O valentão começou a me olhar estranho no corredor." — hallway: HE walks past; the bully on the lockers follows him with his eyes
  const hallPass = (x, s) => { const h = put(x, s, N, 0, 0, 0, 0); walkPath(h, x.L, 0, 3.0, [-1.2, -20], [-1.2, -11], { stride: 2.3 }); h.setFace({ eyes: 'normal', mouth: 'flat', look: [0.8, 0] }); const b = put(x, s, B, 5.0, -13.5, -Math.PI / 2, 0); alive(b, x.t, 1, 3); pose15(b, 'crossArms', 1, x.t, { face: false }); lookTo(b, headP(h), 1); b.setFace({ eyes: 'smug', mouth: 'flat', brow: 0.4, iris: '#1fb85a' }); return { h, b }; };
  at(57.34, 'corredor', x => { const s = S.hall; const { h, b } = hallPass(x, s); frame(x, [headP(h, 0.8), headP(b, 0.8), headP(h, -2.5)], V(0.15, 0.12, 1), { fov: 42, m: 0.8 }); return s; });
  // 39 "estranho no corredor" — close on the bully's squinting stare
  at(58.76, 'estranho', x => { const s = S.hall; const { h, b } = hallPass(x, s); h.noFrame = true; b.setFace({ eyes: 'smug', mouth: 'wavy', brow: 0.6, blush: 0.5, iris: '#1fb85a' }); frame(x, [headP(b, 0.4), headP(b, -0.4)], V(-1, 0.02, 0.5), { fov: 34, m: 0.5, push: 0.08 }); return s; });
  // 40 "E no dia seguinte," — morning light in the hallway: HE opens his locker, yawning
  at(60.12, 'seguinte', x => { const s = S.hall; const h = put(x, s, N, -4.6, 2.0, -Math.PI / 2 + 0.2, 0); alive(h, x.t, 1, 1); h.setFace({ eyes: 'tired', mouth: 'o' }); reach(h, h.armR, V(-5.8, 4.8, 2.6), gestW(x.L, 0.2, 99) * 0.8);
    tint(1.06, 1.02, 0.92); frame(x, [headP(h, 0.8), headP(h, -2.6)], V(0.55, 0.1, 1), { fov: 42, m: 0.62, push: 0.05 }); return s; });
  // 41 "ele apareceu com um buquê de flores." — the bully steps in holding a bouquet out; HE jumps O.O
  const bouquetScene = (x, s, offerW = 1) => { const h = put(x, s, N, -3.2, -4.0, Math.PI / 2, 0); alive(h, x.t, 1, 1); const b = put(x, s, B, 0.9, -4.0, -Math.PI / 2, 0); alive(b, x.t, 1, 4); pose15(b, 'offer', offerW, x.t, { face: false }); const pp = palm(b); s.add(P.bouquet); P.bouquet.position.copy(pp).add(V(-0.12, -0.25, 0)); P.bouquet.rotation.set(0, 0, 0.35); return { h, b }; };
  at(61.21, 'buque', x => { const s = S.hall; const { h, b } = bouquetScene(x, s, gestW(x.L, 0.2, 99)); b.setFace({ eyes: 'angry', mouth: 'frown', brow: 0.8, blush: 0.8, iris: '#1fb85a' }); startle(h, x.L, 0.95, 0.8); if (x.L > 0.95) h.setFace({ eyes: 'shock', mouth: 'o' });
    frame(x, [headP(h, 0.8), headP(b, 0.8), V(-1.0, 2.6, -4)], V(0.1, 0.1, 1), { fov: 42, m: 0.62, punch: 0.95, pk: 0.1 }); return s; });
  // 42 "Pra me pedir pra parar, ele disse." — he pushes the bouquet at him, talking angrily, pointing
  at(63.22, 'parar', x => { const s = S.hall; const { h, b } = bouquetScene(x, s, 1); talk(b, x.t, x.L < 1.2 ? 1 : 0); b.setFace({ eyes: 'angry', mouth: 'frown', brow: 1, blush: 1, iris: '#1fb85a' }); reach(b, b.armL, b.torso.localToWorld(V(0.4, 1.9, 1.7)), gestW(x.L, 0.3, 99) * 0.8); h.setFace({ eyes: 'shock', mouth: 'wavy', sweat: 1 });
    frame(x, [headP(b, 0.8), headP(h, 0.6), headP(b, -1.6)], V(0.2, 0.1, 1), { fov: 40, m: 0.62 }); return s; });
  // 43 "Mas o cabelo dele estava amarelo," — he lifts his cap: YELLOW hair (tilt up; punch on "amarelo")
  at(65.23, 'amarelo', x => { const s = S.hall; const { h, b } = bouquetScene(x, s, 1); h.noFrame = true; const lift = sm(seg(x.L, 0.15, 0.7)); reach(b, b.armL, b.head.localToWorld(V(0.3, 1.3 + 1.0 * lift, 0.2)), 1); if (lift > 0.12) { b.wear('none'); b.capG.visible = true; } b.capG.position.y = 1.0 * lift; b.capG.rotation.x = -0.4 * lift; b.hfx.set({ a: COL.yellow, sweep: 1, glow: 0.35 * lift });
    b.setFace({ eyes: 'squeeze', mouth: 'wavy', blush: 1 }); if (lift > 0.5) sparks(x, s, headP(b, 0.5), { r: 1.0, up: 1.4, amt: 0.7, col: '#fff27a', size: 0.25 }); frame(x, [headP(b, 1.2), headP(b, -1.0)], V(-0.8, -0.05, 0.6), { fov: 38, m: 0.55, rise: 1.2, punch: 1.26, pk: 0.1 }); return s; });
  // 44 "da cor dos olhos da namorada dele." — his girlfriend hugs his arm: close on her YELLOW eyes, hearts
  at(67.37, 'namorada', x => { const s = S.hall; const b = put(x, s, B, 1.6, -5.2, 0.25, 0); b.wear('none'); b.hfx.set({ a: COL.yellow, sweep: 1, glow: 0.3 }); alive(b, x.t, 1, 4); b.setFace({ eyes: 'happy', mouth: 'smile', blush: 1, iris: '#1fb85a' }); const g = put(x, s, BG, -0.7, -5.0, 0.5, 0); g.noCollide = new Set(['valentao']); alive(g, x.t, 1, 7); pose15(g, 'hug', gestW(x.L, 0.1, 99), x.t);
    hearts(x, s, V(0.4, 5.6, -5.0), { a: 0.3, r: 1.0, size: 0.45 }); if (x.L > 0.62) { b.noFrame = true; g.setFace({ eyes: 'normal', mouth: 'smile', blush: 1 }); frame(x, [headP(g, 0.25), headP(g, -0.2)], V(-0.15, 0.03, 1), { fov: 32, m: 0.42, push: 0.08 }); } else frame(x, [headP(b, 0.9), headP(g, 0.9), headP(b, -2.2)], V(0, 0.1, 1), { fov: 42, m: 0.62 }); return s; });
  // 45 "Sobrou a menina nova." — on the board two photos come unpinned and fall; NOVATA stays
  at(69.51, 'sobrou', x => { const s = S.school; const ph = s.userData.board.userData.photos; [0, 1].forEach(i => { const u = Math.max(0, x.L - 0.1 - i * 0.18); const p = ph[i]; p.position.y = p.userData.home.y - 4.9 * u * u * 1.3; p.rotation.z = p.userData.rz + u * 2.2 * (i ? -1 : 1); p.position.z = p.userData.home.z + u * 0.6; p.visible = p.position.y > -6; });
    const c = boardP(s, 3.0 * eio(seg(x.L, 0.5, 1.1)), -0.2); shot(x, c, V(-0.15, 0, 1), mix(9.5, 5.6, eio(seg(x.L, 0.45, 1.1))), 40, { push: 0.0 }); return s; }, { noQA: true });
  // 46 "E tinha uma coisa nela" — the new girl at her locker; kids whisper about her
  const whisper = (x, s) => { const g = put(x, s, G, 4.6, 2.5, Math.PI / 2 - 0.2, 0); alive(g, x.t, 1, 2); g.setFace({ eyes: 'normal', mouth: 'flat' });
    const a = put(x, s, K[3], -2.6, -2.5, 0.9, 0); const b2 = put(x, s, K[7], 0.8, -5.4, 0.5, 0); pose15(a, 'whisper', 1, x.t); lookTo(b2, headP(g), 1); b2.setFace({ eyes: 'normal', mouth: 'smallo', brow: 0.4 }); a.noFrame = b2.noFrame = true; return { g, a, b: b2 }; };
  at(70.70, 'coisa', x => { const s = S.hall; const { g, a } = whisper(x, s); frame(x, [headP(g, 0.8), headP(g, -2.6), headP(a, 0.5)], V(-0.3, 0.12, 1), { fov: 42, m: 0.8 }); return s; });
  // 47 "que ninguém entendia." — "?" pops over the whispering kids
  at(72.17, 'ninguem', x => { const s = S.hall; const { g, a, b } = whisper(x, s); g.noFrame = true; a.noFrame = b.noFrame = false; bubble(x, s, FX.q, headP(a, 1.7), 0.15, 1.1); bubble(x, s, FX.q, headP(b, 1.7).add(V(0.3, 0.2, 0)), 0.3, 1.1); a.setFace({ eyes: 'normal', mouth: 'smallo', brow: 0.6 });
    frame(x, [headP(a, 0.8), headP(b, 0.8), headP(a, -1.8)], V(0.15, 0.1, 1), { fov: 40, m: 0.62 }); return s; });
  // 48 "Ela nunca tirava o gorro." — close on her: she straightens the beanie with both hands
  at(73.48, 'gorro', x => { const s = S.hall; const g = put(x, s, G, 0, -6, 0, 0); alive(g, x.t, 1, 2); pose15(g, 'beanieHold', gestW(x.L, 0.25, 1.4), x.t); frame(x, [headP(g, 1.2), headP(g, -1.2)], V(0.15, 0.05, 1), { fov: 36, m: 0.5, push: 0.08 }); return s; });
  // 49 "Nem no calor de 40 graus." — yard under a blazing sun: thermometer 40°C, a kid fanning; she keeps the beanie
  at(75.32, 'calor', x => { const s = S.school; s.userData.thermo.set(0.2 + 0.8 * eo(seg(x.L, 0.05, 0.9))); tint(1.12, 1.0, 0.86); const g = put(x, s, G, -14.6, 12.5, 0.3, 0); alive(g, x.t, 1, 2); g.setFace({ eyes: 'tired', mouth: 'wavy', sweat: 1 });
    const a = put(x, s, K[6], -20.8, 12.0, 0.6, 0); pose15(a, 'fan', 1, x.t); a.noFrame = true; frame(x, [headP(g, 1.0), headP(g, -3.4), V(-17.6, 10.5, 9.3)], V(0.2, 0.12, 1), { fov: 44, m: 0.7 }); return s; });
  // 50 "Nem na educação física." — the court: jumping jacks; she jumps with the beanie on
  at(77.26, 'educacao', x => { const s = S.school; const L = [[G, -6], [K[2], 0], [K[8], 6], [K[5], 11.6]]; L.forEach(([c, px], i) => { put(x, s, c, px, 22, Math.PI, 0); const ph = (x.t * 2.3 + i * 0.1) % 1; const up = Math.sin(ph * Math.PI); c.hip.position.y += 0.45 * up; pose15(c, 'jack', up, x.t, { face: false }); c.legR.piv.rotation.z -= 0.3 * up; c.legL.piv.rotation.z += 0.3 * up; c.setFace({ eyes: 'happy', mouth: 'open' }); if (i) c.noFrame = true; });
    frame(x, [headP(G, 2.0), headP(G, -4.2)], V(0.05, 0.12, -1), { fov: 42, m: 0.6 }); return s; });
  // 51 "Nem quando a diretora mandou." — the principal points at the beanie; she shakes her head, holding it
  at(78.71, 'mandou', x => { const s = S.hall; const d = put(x, s, C.DIR, 1.8, -6.0, -Math.PI / 2 + 0.25, 0); alive(d, x.t, 1, 1); pose15(d, 'pointFwd', gestW(x.L, 0.1, 99), x.t); d.setFace({ eyes: 'angry', mouth: 'frown', brow: 1 }); talk(d, x.t, x.L < 0.9 ? 1 : 0);
    const g = put(x, s, G, -2.4, -6.0, Math.PI / 2 - 0.25, 0); pose15(g, 'beanieHold', gestW(x.L, 0.3, 99), x.t); g.head.rotation.y += 0.35 * Math.sin(x.L * 11) * sm(seg(x.L, 0.5, 0.7)); g.setFace({ eyes: 'squeeze', mouth: 'wavy', blush: 0.7 });
    frame(x, [headP(d, 0.9), headP(g, 0.9), headP(g, -2.2)], V(0, 0.1, 1), { fov: 42, m: 0.62 }); return s; });
  // 52 "E toda vez que eu passava," — HE walks past; she is at her locker
  const passBy = (x, s) => { const h = put(x, s, N, 0, 0, 0, 0); walkPath(h, x.L + 0.3, 0, 3.2, [-1.6, -15], [-1.6, -6], { stride: 2.3 }); h.setFace({ eyes: 'happy', mouth: 'smile' }); const g = put(x, s, G, 4.6, -9.0, -Math.PI / 2 + 0.6, 0); alive(g, x.t, 1, 2); lookTo(g, headP(h), 0.7); return { h, g }; };
  at(80.01, 'passava', x => { const s = S.hall; const { h, g } = passBy(x, s); g.setFace({ eyes: 'normal', mouth: 'smallo', blush: 0.6 }); frame(x, [headP(h, 0.8), headP(g, 0.8), headP(h, -2.5)], V(0.2, 0.12, 1), { fov: 42, m: 0.66 }); return s; });
  // 53 "ela puxava o gorro mais pra baixo." — close: she pulls the beanie down over her eyes, blushing
  at(81.94, 'puxava', x => { const s = S.hall; const { h, g } = passBy(x, s); h.noFrame = true; const k = sm(seg(x.L, 0.25, 0.85)); pose15(g, 'beanieHold', gestW(x.L, 0.1, 99), x.t, { face: false }); g.beanieG.position.y = -0.28 * k; g.setFace({ eyes: 'squeeze', mouth: 'wavy', blush: 1 });
    frame(x, [headP(g, 1.0), headP(g, -0.7)], V(-0.35, 0.05, 1), { fov: 34, m: 0.48, push: 0.08 }); return s; });
  // 54 "Até que chegou a aula de natação." — the indoor pool: water shimmering, the coach whistling, kids on the bleachers
  const bleach = (x, s, list, o = {}) => { const T = s.userData.tiers; list.forEach(([c, tier, z], i) => { const t = T[tier]; put(x, s, c, t.x - 0.25, z, -Math.PI / 2, 0); sit15(c, t.y); c.allowObst = new Set(['arquibancada']); lap(c); alive(c, x.t, 0.6, i); c.noFrame = o.noFrame ?? true; if (o.look) lookTo(c, o.look, o.lw ?? 1); }); };
  const crowdPool = [[K[0], 1, -12], [K[1], 1, -8.6], [K[2], 1, -5.2], [K[3], 1, -1.8], [K[5], 2, -10.3], [K[6], 2, -6.9], [K[7], 2, -3.5], [K[8], 1, 1.6], [K[9], 2, -0.1]];
  at(84.02, 'natacao', x => { const s = S.pool; s.userData.water.tick(x.t); bleach(x, s, crowdPool); const c = put(x, s, C.COACH, -13.0, 2.0, 0.8, 0); c.noFrame = true; alive(c, x.t, 1, 1); reach(c, c.armR, c.head.localToWorld(V(-0.05, 0.25, 0.8)), 1); c.setFace({ eyes: 'squeeze', mouth: 'smallo' });
    const k = eio(x.u); camAt(x, V(-8 + 4 * k, 9 - 1 * k, 16 - 2 * k), V(9, 2.5, -6), 50); return s; });
  // 55 "Gorro na piscina é proibido." — the sign PROIBIDO GORRO (punch); the coach points at it
  at(85.89, 'proibido', x => { const s = S.pool; s.userData.water.tick(x.t); const c = put(x, s, C.COACH, -5.8, -16.0, 0.4, 0); pose15(c, 'pointAt', gestW(x.L, 0.15, 99), x.t, { face: false }); c.setFace({ eyes: 'angry', mouth: 'open', brow: 0.6 }); c.noFrame = true; shot(x, V(-0.4, 7.0, -17.4), V(0.12, -0.05, 1), 13.0, 40, { push: 0.06, punch: 1.23, pk: 0.12 }); return s; });
  // 56 "Ela ficou parada na borda," — the girl (swimsuit + beanie) frozen at the pool edge; slow orbit
  const edge = (x, s) => { const g = put(x, s, Gs, -3.0, 1.6, Math.PI, 0); alive(g, x.t, 0.5, 2); return g; };
  at(87.89, 'borda', x => { const s = S.pool; s.userData.water.tick(x.t); const g = edge(x, s); g.setFace({ eyes: 'sad', mouth: 'wavy', blush: 0.6 }); const a = 0.5 - 0.5 * eio(x.u); frame(x, [headP(g, 1.2), headP(g, -3.8)], V(Math.sin(a), 0.15, -Math.cos(a)), { fov: 42, m: 0.62 }); return s; });
  // 57 "segurando o gorro com as duas mãos." — close: both hands on the beanie
  at(89.43, 'segurando', x => { const s = S.pool; s.userData.water.tick(x.t); const g = edge(x, s); pose15(g, 'beanieHold', gestW(x.L, 0.1, 99), x.t); frame(x, [headP(g, 1.3), headP(g, -1.3)], V(0.1, 0.05, -1), { fov: 36, m: 0.5, push: 0.08 }); return s; });
  // 58 "A escola inteira assistindo." — the bleachers: every kid stares (O.O), HE among them
  at(91.52, 'assistindo', x => { const s = S.pool; s.userData.water.tick(x.t); const look = V(-3.0, 4.0, 1.6); bleach(x, s, crowdPool, { look, lw: 1 }); K.forEach(c => c.setFace({ eyes: 'shock', mouth: 'o' })); const T = s.userData.tiers; const h = put(x, s, N, T[2].x - 0.25, -12.5, -Math.PI / 2, 0); h.root.position.z = -14.5; sit15(h, T[2].y); h.allowObst = new Set(['arquibancada']); lap(h); lookTo(h, look, 1); h.setFace({ eyes: 'shock', mouth: 'o' });
    frame(x, [headP(K[0], 0.8), headP(K[3], 0.8), headP(h, 0.8), headP(K[9], 0.5)], V(-1, 0.18, 0.12), { fov: 46, m: 0.72 }); return s; });
  // 59 "E aí ela tirou." — she pulls the beanie OFF: the hair drops out with a bounce, sparkles
  const reveal = (x, s, a) => { const g = edge(x, s); const k = sm(seg(x.L, a, a + 0.5)); pose15(g, 'lift', x.L < a + 0.9 ? gestW(x.L, a - 0.1, a + 0.9) : 0, x.t, { face: false }); if (x.L > a + 0.08) { g.wear('none'); g.beanieG.visible = x.L < a + 0.9; g.beanieG.position.set(0, 1.4 * k, -0.1 * k); const hk = springE(seg(x.L, a + 0.08, a + 0.6)); g.hairG.scale.set(1, 0.55 + 0.45 * hk, 1); g.hairG.position.y = 0.45 * (1 - hk); }
    g.setFace(x.L > a + 0.3 ? { eyes: 'squeeze', mouth: 'wavy', blush: 1 } : { eyes: 'sad', mouth: 'wavy', blush: 0.6 }); return g; };
  at(93.21, 'tirou', x => { const s = S.pool; s.userData.water.tick(x.t); const g = reveal(x, s, 0.75); if (x.L > 0.8) sparks(x, s, headP(g, 0.6), { r: 1.4, up: 2.0, amt: 1 - sm(seg(x.L, 1.2, 1.4)), col: '#a8d8ff', size: 0.3 }); frame(x, [headP(g, 2.2), headP(g, -2.0)], V(0.2, 0.08, -1), { fov: 40, m: 0.56, push: 0.06 }); return s; });
  // 60 "O cabelo dela era metade azul" — orbit around her hair: the BLUE side (punch on "azul")
  const revealed = (x, s) => { const g = edge(x, s); g.wear('none'); g.setFace({ eyes: 'normal', mouth: 'wavy', blush: 1 }); return g; };
  at(94.59, 'azul', x => { const s = S.pool; s.userData.water.tick(x.t); const g = revealed(x, s); const a = 1.0 - 0.6 * eio(x.u); frame(x, [headP(g, 1.0), headP(g, -1.2)], V(Math.sin(a), 0.08, -Math.cos(a)), { fov: 36, m: 0.5, punch: 1.6, pk: 0.1 }); return s; });
  // 61 "e metade castanho." — the orbit continues to the BROWN side
  at(96.52, 'castanho', x => { const s = S.pool; s.userData.water.tick(x.t); const g = revealed(x, s); const a = -0.35 - 0.6 * eio(x.u); frame(x, [headP(g, 1.0), headP(g, -1.2)], V(Math.sin(a), 0.08, -Math.cos(a)), { fov: 36, m: 0.5 }); return s; });
  // 62 "E eu sou a única pessoa da cidade" — HE stands up alone on the bleachers (everyone else seated)
  at(97.94, 'unica', x => { const s = S.pool; s.userData.water.tick(x.t); bleach(x, s, crowdPool, { look: V(17.5, 6, -14.5), lw: 0.8 }); const T = s.userData.tiers; const up = eio(seg(x.L, 0.1, 0.6)); const h = put(x, s, N, T[2].x - 0.25 - 0.6 * up, -14.5, -Math.PI / 2, 0); sit15(h, T[2].y, 1 - up); h.root.position.y = T[2].y * up; h.allowObst = new Set(['arquibancada']);
    h.setFace({ eyes: 'normal', mouth: 'wavy' }); frame(x, [headP(h, 0.9), headP(h, -3.0)], V(-1, 0.08, 0.2), { fov: 40, m: 0.6, push: 0.06 }); return s; });
  // 63 "com um olho de cada cor." — extreme close on HIS face: the two eye colours (only in these close-ups)
  const eyes = (x, s) => { s.userData.water.tick(x.t); const T = s.userData.tiers; const h = put(x, s, N, T[2].x - 0.85, -14.5, -Math.PI / 2, T[2].y); h.setFace({ eyes: 'normal', mouth: 'smallo', iris: ['#2a8af0', '#8a5020'] }); h.allowObst = new Set(['arquibancada']); return h; };
  at(99.82, 'olho', x => { const s = S.pool; const h = eyes(x, s); frame(x, [headP(h, 0.35), headP(h, -0.35)], V(-1, 0.02, 0), { fov: 30, m: 0.36, push: 0.1 }); return s; });
  // 64 "Um azul." — on the blue eye
  at(101.60, 'umazul', x => { const s = S.pool; const h = eyes(x, s); h.root.updateMatrixWorld(true); const e = h.head.localToWorld(V(-0.17, 0.72, 0.62)); camAt(x, e.clone().add(V(-2.2 + 0.4 * x.u, 0.05, 0)), e, 26); return s; }, { noQA: true });
  // 65 "Um castanho." — on the brown eye
  at(102.28, 'umcastanho', x => { const s = S.pool; const h = eyes(x, s); h.root.updateMatrixWorld(true); const e = h.head.localToWorld(V(0.17, 0.72, 0.62)); camAt(x, e.clone().add(V(-2.2 + 0.4 * x.u, 0.05, 0)), e, 26); return s; }, { noQA: true });
  // 66 "Ela não estava escondendo o cabelo." — she hugs the beanie to her chest, blushing
  at(103.09, 'escondendo', x => { const s = S.pool; s.userData.water.tick(x.t); const g = revealed(x, s); g.root.rotation.y = Math.PI + 0.9; pose15(g, 'holdFront', 1, x.t); const pp = palm(g); s.add(P.beanieG); P.beanieG.position.copy(pp).add(V(0, -1.5, 0.15)); g.setFace({ eyes: 'happy', mouth: 'wavy', blush: 1 });
    frame(x, [headP(g, 1.2), headP(g, -2.2)], V(-0.78, 0.06, -0.62), { fov: 40, m: 0.56 }); return s; });
  // 67 "Estava escondendo que gostava de mim desde o primeiro dia." — FLASHBACK (warm, saturated): first day, she sees HIM, hearts pop,
  //    her hair turns half blue / half brown — she panics and pulls a beanie on
  at(104.84, 'gostava', x => { const s = S.hall; tint(1.1, 1.0, 0.86); grade.vig.value = 0.55; const h = put(x, s, N, 0, 0, 0, 0); walkPath(h, x.L, 0, 3.0, [-1.5, -4], [-1.5, -9.5], { stride: 2.3 }); h.setFace({ eyes: 'happy', mouth: 'smile' });
    const g = put(x, s, G, 2.4, -14.0, -0.2, 0); g.wear('none'); lookTo(g, headP(h), 1); const ch = 0.55; g.hfx.set({ old: '#2a1a12', a: COL.blue, b: COL.brown, two: true, sweep: sm(seg(x.L, ch, ch + 0.5)), band: x.L > ch && x.L < ch + 0.5 ? 1 : 0, glow: 0.3 });
    hearts(x, s, headP(g, 1.0), { a: 0.3, r: 0.8, size: 0.4 }); g.setFace(x.L < ch ? { eyes: 'happy', mouth: 'smallo', blush: 1 } : { eyes: 'shock', mouth: 'o', blush: 1 });
    const b0 = 1.6; if (x.L > b0) { const k = sm(seg(x.L, b0, b0 + 0.45)); pose15(g, 'beanieHold', gestW(x.L, b0 - 0.1, 99), x.t, { face: false }); g.beanieG.visible = true; g.beanieG.position.y = 1.4 * (1 - k); g.hairG.scale.set(1, 1 - 0.45 * k, 1); if (k >= 1) { g.wear('beanie'); g.beanieG.position.y = 0; } }
    frame(x, [headP(g, 1.3), headP(g, -2.6), headP(h, 0.6)], V(0.12, 0.12, 1), { fov: 40, m: 0.66 }); return s; });
  // 68 "Ninguém na piscina falou nada." — the silent bleachers, "..." over the kids
  at(107.86, 'silencio', x => { const s = S.pool; s.userData.water.tick(x.t); bleach(x, s, crowdPool, { look: V(-3, 4, 1.6), lw: 1, noFrame: false }); K.forEach(c => c.setFace({ eyes: 'normal', mouth: 'flat' })); for (const c of [K[0], K[2], K[6], K[7], K[8]]) c.noFrame = true; bubble(x, s, FX.dots, headP(K[5], 1.8), 0.4, 1.2);
    frame(x, [headP(K[1], 0.8), headP(K[3], 0.8), headP(K[5], 0.8), headP(K[9], 0.5)], V(-1, 0.12, 0.05), { fov: 44, m: 0.85, push: 0.03 }); return s; });
  // 69 "Até o professor de química" — chemistry teacher and lunch lady side by side on the deck
  const pair = (x, s) => { const q = put(x, s, C.QUI, -14.8, 6.5, 0.55, 0); q.hfx.set({ a: COL.blue, sweep: 1, glow: 0.2 }); alive(q, x.t, 1, 2); const m = put(x, s, C.MER, -10.6, 6.5, -0.55, 0); alive(m, x.t, 1, 5); return { q, m }; };
  at(110.11, 'quimico2', x => { const s = S.pool; s.userData.water.tick(x.t); const { q, m } = pair(x, s); q.setFace({ eyes: 'normal', mouth: 'flat' }); m.setFace({ eyes: 'normal', mouth: 'flat' }); frame(x, [headP(q, 0.9), headP(m, 0.9), headP(q, -2.6)], V(0, 0.1, 1), { fov: 42, m: 0.62 }); return s; });
  // 70 "sorrir pra merendeira." — he SMILES at her; she blushes; hearts
  at(111.40, 'sorrir', x => { const s = S.pool; s.userData.water.tick(x.t); const { q, m } = pair(x, s); lookTo(q, headP(m), sm(seg(x.L, 0, 0.3))); q.setFace({ eyes: 'happy', mouth: 'grin', blush: 0.8 }); m.setFace(x.L > 0.5 ? { eyes: 'happy', mouth: 'smile', blush: 1 } : { eyes: 'shock', mouth: 'smallo', blush: 0.6 }); lookTo(m, headP(q), sm(seg(x.L, 0.4, 0.7)));
    hearts(x, s, V(-12.7, 6.4, 6.5), { a: 0.55, r: 0.8, size: 0.45 }); frame(x, [headP(q, 0.6), headP(m, 0.6), headP(q, -1.0)], V(0.1, 0.06, 1), { fov: 38, m: 0.55 }); return s; });
  // 71 "No dia seguinte," — warm morning over the school (crane down)
  at(112.72, 'manha', x => { const s = S.school; tint(1.08, 1.0, 0.9); const k = eio(x.u); crowdWalk(x, s, [K[0], K[3], K[7]], 22, 8, [-6, 6, -3]); camAt(x, V(0, 16 - 7 * k, 36 - 4 * k), V(0, 8 - 3 * k, 0), 46); return s; }, { noQA: true });
  // 72 "eu cheguei na escola de gorro." — HE walks in with the top hat pulled down low, shy (blue hat)
  at(113.67, 'chegueigorro', x => { const s = S.school; const h = put(x, s, N, -2.0, 15, Math.PI, 0); walkPath(h, x.L + 0.4, 0, 3.0, [-2.0, 15], [-2.0, 8.6], { stride: 2.2 }); N.hatG.position.y = 0.86; h.setFace({ eyes: 'tired', mouth: 'wavy', blush: 0.6 }); h.head.rotation.x += 0.2; front(x, h, 8.4, 4.3, 3.1); return s; });
  // 73 "Ela veio até mim," — she walks up to him (hair out, two-tone)
  const finale = (x, s, gx) => { const h = put(x, s, N, 2.6, 6.2, -Math.PI / 2, 0); alive(h, x.t, 1, 1); N.hatG.position.y = 0.86; const g = put(x, s, G, gx, 6.2, Math.PI / 2, 0); g.wear('none'); return { h, g }; };
  at(115.30, 'veio', x => { const s = S.school; const { h, g } = finale(x, s, 0.4); walkPath(g, x.L, 0, 0.95, [-3.4, 6.2], [0.4, 6.2], { stride: 2.2 }); g.setFace({ eyes: 'happy', mouth: 'smile', blush: 0.8 }); h.setFace({ eyes: 'shock', mouth: 'smallo', blush: 0.8 });
    frame(x, [headP(h, 0.9), headP(g, 0.9), headP(h, -2.6)], V(0.15, 0.1, 1), { fov: 42, m: 0.75 }); return s; });
  // 74 "tirou o meu gorro devagar," — she lifts HIS top hat slowly with both hands
  const lifted = (x, s, k) => { const { h, g } = finale(x, s, 0.4); h.root.updateMatrixWorld(true); N.hatG.position.y = mix(0.86, 2.2, k); N.hatG.position.z = -0.5 * k; const hp = N.head.localToWorld(V(0, N.hatG.position.y + 0.25, N.hatG.position.z)); reach(g, g.armR, hp.clone().add(V(0, 0, 0.75)), 1); reach(g, g.armL, hp.clone().add(V(0, 0, -0.75)), 1); g.noCollide = new Set(['narrador']); return { h, g }; };
  at(116.32, 'tirou2', x => { const s = S.school; const k = sm(seg(x.L, 0.15, 1.5)); const { h, g } = lifted(x, s, k); g.setFace({ eyes: 'happy', mouth: 'smallo', blush: 1 }); h.setFace({ eyes: 'squeeze', mouth: 'wavy', blush: 1 });
    frame(x, [headP(h, 1.6), headP(g, 0.9), headP(h, -1.6)], V(0.3, 0.08, 1), { fov: 40, m: 0.66 }); return s; });
  // 75 "olhou pro meu cabelo verde..." — the hat in her hands turns EMERALD and glows; she smiles; hearts
  at(117.95, 'cabeloverde', x => { const s = S.school; const { h, g } = lifted(x, s, 1); hatTo(x, s, 0.35, 0.5, 1.2); g.setFace({ eyes: 'happy', mouth: 'smile', blush: 1 }); h.setFace({ eyes: 'happy', mouth: 'wavy', blush: 1 }); hearts(x, s, headP(g, 1.2), { a: 0.6, r: 0.9, size: 0.4 });
    frame(x, [hatP(0.6), headP(g, 0.6), headP(g, -1.0)], V(0.9, 0.12, 0.45), { fov: 38, m: 0.6, push: 0.07 }); return s; });
  // 76 "e jogou os dois gorros na lixeira." — she tosses her beanie into the trash can (arc); his green hat back on; confetti + hearts; crane up
  at(119.27, 'lixeira', x => { const s = S.school; const { h, g } = finale(x, s, -0.6); N.hatG.position.y = 1.04; greenHat(x, s, 1); const ta = 0.3, tb = 1.3; pose15(g, 'toss', gestW(x.L, ta - 0.15, ta + 0.5), x.t); g.setFace({ eyes: 'happy', mouth: 'laugh' }); h.setFace({ eyes: 'happy', mouth: 'grin', blush: 1 });
    const top = V(6.2, 2.1, 2.6); const st = headP(g, 0.9).add(V(0.4, 0.3, 0.2)); const u = seg(x.L, ta, tb); s.add(P.beanieG); if (x.L < ta) { P.beanieG.position.copy(palm(g)).add(V(0, -1.1, 0)); } else { const p = st.clone().lerp(top, u); p.y += 4.2 * u * (1 - u); P.beanieG.position.copy(p).add(V(0, -1.1 * (1 - u), 0)); P.beanieG.rotation.set(u * 5, u * 3, 0); P.beanieG.scale.setScalar(1 - 0.3 * sm(seg(u, 0.85, 1))); P.beanieG.visible = u < 0.99; }
    if (x.L > tb) conf(x, s, top.clone().add(V(0, 0.2, 0)), tb); hearts(x, s, V(1.5, 5.4, 6.2), { a: tb, r: 1.6, size: 0.55 }); const k = eio(x.u); frame(x, [headP(h, 0.9), headP(g, 0.9), top, headP(h, -2.6)], V(0.15, 0.25 + 0.6 * k, 1), { fov: 44, m: 0.72 }); return s; });
  return { SHOTS: SH, DUR: 121.8 }; }
