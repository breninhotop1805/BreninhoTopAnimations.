// EP01 — "NESTA CIDADE, TUDO SE PAGA COM TEMPO DE VIDA" — one shot per spoken idea; times = word starts of the cut narration.
import * as THREE from 'three';
import { gesture, wave, alive, talk, walkPath, startle, eo, eio, sm, seg, mix, springE, gestW } from './act.js';
const V3 = THREE.Vector3; const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const cam = (x, p, l, fov) => { x.camera.position.set(...p); x.camera.lookAt(...l); if (fov) x.camera.fov = fov; };
const camMove = (x, p0, l0, p1, l1, e = eio, fov = 40) => { const k = e(x.u); cam(x, p0.map((v, i) => mix(v, p1[i], k)), l0.map((v, i) => mix(v, l1[i], k)), fov); };
const punch = (x, a, amt = 0.12, dur = 0.25) => { const k = eo(seg(x.L, a, a + dur)); x.camera.fov *= 1 - amt * k; };
const scn = (x, n) => { x.out.scene = x.S[n]; return x.S[n]; };
const put = (x, n, s, px, pz, ry = 0, py = 0) => { const c = x.C[n]; s.add(c.root); c.root.position.set(px, py, pz); c.root.rotation.y = ry; x.live.push(c); alive(c, x.t, 1, n.length); return c; };
const headP = c => { c.root.updateMatrixWorld(true); return c.head.localToWorld(new V3(0, 0.66, 0)); };
const chestP = c => { c.root.updateMatrixWorld(true); return c.torso.localToWorld(new V3(0, 1.0, 0)); };
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
function lookAtP(c, P, w = 1) { const h = headP(c); const yaw = wrap(Math.atan2(P.x - h.x, P.z - h.z) - c.root.rotation.y - c.torso.rotation.y); c.head.rotation.y = mix(c.head.rotation.y, cl(yaw, -1, 1), w);
  c.head.rotation.x = mix(c.head.rotation.x, cl(-Math.atan2(P.y - h.y, Math.hypot(P.x - h.x, P.z - h.z)), -0.5, 0.5), w); }
const lookCam = (x, c, w = 1) => lookAtP(c, x.camera.position, w);
const focus = (x, P) => { x.out.focus = x.camera.position.distanceTo(P); };
// check-the-watch pose: left forearm raised across the chest, screen up toward the eyes
function checkWatch(c, w = 1) { c.armL.piv.rotation.x += -0.95 * w; c.armL.piv.rotation.z += -0.5 * w; c.head.rotation.x += 0.28 * w; }
// holo readout above a point, facing the camera, popping in with a small elastic
// holo readout pinned to the SCREEN (sx -1..1, sy -1..1 from the centre) at the focus distance: always readable, never cut, never behind anyone
function holoS(x, s, sx, sy, txt, a0, col = '#5af0ff', sub = '', which = 'holo', wfrac = 0.5) { if (x.L < a0) return null; const h = x.FX[which]; s.add(h); h.set(txt, col, sub); const k = springE(seg(x.L, a0, a0 + 0.35));
  const D = x.out.focus || 7; const c = x.camera; c.updateMatrixWorld(true); const th = Math.tan(c.fov * Math.PI / 360), asp = 9 / 16; const fw = new V3(); c.getWorldDirection(fw);
  const r = new V3().setFromMatrixColumn(c.matrixWorld, 0), u = new V3().setFromMatrixColumn(c.matrixWorld, 1); h.position.copy(c.position).addScaledVector(fw, D).addScaledVector(r, sx * D * th * asp).addScaledVector(u, sy * D * th);
  h.quaternion.copy(c.quaternion); h.scale.setScalar(Math.max(0.001, k * wfrac * 2 * D * th * asp / 1.6)); return h; }
// holo readout: camera-facing panel; its size is set from the camera distance so it always fills ~40% of the frame width
function holo(x, s, P, txt, a0, col = '#5af0ff', sub = '', which = 'holo', scale = 1) { if (x.L < a0) return null; const h = x.FX[which]; s.add(h); h.set(txt, col, sub); const k = springE(seg(x.L, a0, a0 + 0.35));
  const d = x.camera.position.distanceTo(P); h.position.copy(P); h.quaternion.copy(x.camera.quaternion); h.scale.setScalar(Math.max(0.001, k * scale * d * 0.1)); return h; }
function bubble(x, which, s, c, a0) { if (x.L < a0) return; const b = x.FX[which]; s.add(b); const k = springE(seg(x.L, a0, a0 + 0.3)); const h = headP(c); const r = new V3().setFromMatrixColumn(x.camera.matrixWorld, 0);
  b.position.copy(h).addScaledVector(r, 0.9).add(new V3(0, 1.0 + 0.05 * Math.sin((x.L - a0) * 6), 0)); b.scale.setScalar(Math.max(0.001, 0.9 * k)); }
function hearts(x, s, P, a = 1) { const g = x.FX.hearts; s.add(g); g.position.copy(P); g.children.forEach((h, i) => { const u = (h.userData.ph + x.t * 0.35) % 1; h.position.set(Math.sin(i * 2.1 + x.t) * 0.7, u * 2.2, Math.cos(i * 1.7) * 0.3); h.scale.setScalar(0.45 * Math.sin(u * Math.PI) * a); h.material.opacity = Math.sin(u * Math.PI) * a; }); }
function sparks(x, s, P, a = 1, R = 1.6, col = '#ffe680') { const g = x.FX.sparks; s.add(g); g.position.copy(P); g.children.forEach(h => { const u = (h.userData.ph + x.t * 0.6) % 1; const an = h.userData.a + x.t * 0.8; h.position.set(Math.cos(an) * R * (0.5 + u * 0.6), (u - 0.3) * 2.4, Math.sin(an) * R * 0.5); h.scale.setScalar(0.35 * Math.sin(u * Math.PI) * a); h.material.color.set(col); }); }
function stream(x, s, A, B, a = 1, col = '#9af6ff', which = 'stream', size = 0.24, rate = 0.9) { const st = x.FX[which]; s.add(st); st.update(A, B, x.t, a, col, size, rate); }
function hold(c, obj, hand = 'R', o = [0, -0.3, 0.12], rot = [0, 0, 0]) { const A = hand === 'R' ? c.armR : c.armL; A.handMesh.add(obj); obj.position.set(...o); obj.rotation.set(...rot); }
// aim an arm (pivot) at a world point (R6 straight arm)
function aimArm(c, A, P, w = 1) { c.root.updateMatrixWorld(true); const sh = A.piv.getWorldPosition(new V3()); const d = P.clone().sub(sh); const q = new THREE.Quaternion(); A.piv.parent.getWorldQuaternion(q); d.applyQuaternion(q.invert()).normalize();
  const cz = Math.asin(cl(d.x, -1, 1)), ax = Math.atan2(-d.z, -d.y); A.piv.rotation.x = mix(A.piv.rotation.x, ax, w); A.piv.rotation.z = mix(A.piv.rotation.z, cz, w); }
// lying on the back in the bed (feet at the foot end): root at the feet, face pointing up
function lie(c, x, z, bedTop) { c.root.position.set(x, bedTop + 0.5, z); c.root.rotation.set(-Math.PI / 2, 0, 0); c.armR.piv.rotation.set(0, 0, 0); c.armL.piv.rotation.set(0, 0, 0); }
function sitW(c, seatY, w) { c.root.position.y = mix(c.root.position.y, seatY - 2.0, w); c.legR.piv.rotation.x += -1.5 * w; c.legL.piv.rotation.x += -1.5 * w; }
function sit(c, seatY) { c.root.position.y = seatY - 2.0; c.legR.piv.rotation.x = -1.5; c.legL.piv.rotation.x = -1.5; c.legR.piv.rotation.z = 0.05; c.legL.piv.rotation.z = -0.05; }
// ---- standard framings (like the references): the camera is placed FROM the character, at eye level, with a slow push-in
// kind: 'full' (whole body), 'med' (waist up), 'close' (head + shoulders), 'wide' (two people / set). ang = orbit angle around
// the character's facing (0 = in front), side = small lateral drift, push = how much the distance shrinks over the shot.
const KD = { wide: [15, 2.7], full: [11, 2.7], med: [7.2, 3.7], close: [4.6, 4.4] };
function frame(x, P, ry, kind = 'med', o = {}) { const [d0, ly] = KD[kind]; const d = d0 * (o.d || 1) * mix(1.06, 0.96, eio(x.u) * (o.push ?? 1)); const a = ry + (o.ang || 0) + (o.drift || 0.06) * (x.u - 0.5);
  const look = new V3(P.x + (o.lx || 0), (o.ly ?? ly), P.z); const camY = (o.cy ?? look.y + (o.up ?? 0.2)); cam(x, [P.x + Math.sin(a) * d, camY, P.z + Math.cos(a) * d], [look.x, look.y, look.z], o.fov || 40); x.out.focus = d; }
const fmt = v => v;
function blanket(x, s) { return; if (!x.FX.blanket) { x.FX.blanket = new THREE.Mesh(new (x.THREE.BoxGeometry)(3.0, 0.9, 2.3), new THREE.MeshStandardMaterial({ color: '#5ab0d8', roughness: 0.8 })); x.FX.blanket.castShadow = true; x.FX.blanket.receiveShadow = true; } s.add(x.FX.blanket); x.FX.blanket.position.set(-1.0, 2.3, -1.6); } // readout texts are written literally per shot

const shots = []; const at = (t, name, fn) => shots.push({ t, name, fn });

// ===== 1. THE CITY =====
// 0.00 "Nesta cidade," — frame 0: the hero already walking toward us down the colourful street, the clock tower behind; the camera backs away
at(0.00, 'cidade', x => { const s = scn(x, 'street'); const c = put(x, 'heroi', s, 0, -1.5); walkPath(c, x.L, -0.6, 1.4, [0.2, -2.4], [0, 0.6], { stride: 2.3, linear: true }); c.setFace({ mouth: 'grin', eyes: 'happy' }); lookCam(x, c, 0.4);
  frame(x, c.root.position, 0, 'full', { d: 1.05, ly: 4.0, cy: 2.6, ang: 0.12 }); });
// 1.04 "tudo se paga com tempo de vida." — the neighbour pays at a street terminal: wrist to the reader, glowing numbers fly out of her watch; "-1 HORA" on "vida"
at(1.04, 'paga', x => { const s = scn(x, 'street'); const c = put(x, 'vizinha', s, -1.55, 1.5, -Math.PI / 2 + 0.35); const r = springE(seg(x.L, 0.1, 0.5)); c.armL.piv.rotation.x += -1.45 * r; c.armL.piv.rotation.z += 0.1 * r; lookAtP(c, x.S.term.top, 0.8);
  c.setFace({ mouth: x.L > 1.4 ? 'frown' : 'flat', eyes: 'normal', brow: x.L > 1.4 ? -0.4 : null, lashes: true }); frame(x, new V3(-2.4, 0, 1.4), -0.75, 'med', { ly: 3.4, d: 1.05 });
  const wp = c.wristPt(); const a = sm(seg(x.L, 0.45, 0.7)) * (1 - sm(seg(x.L, 1.7, 2.0))); if (a > 0) stream(x, s, wp, x.S.term.top, a, '#9af6ff', 'stream', 0.2, 1.4);
  holoS(x, s, 0, 0.8, '-1 HORA', 1.46, '#ff5a5a'); });
// 3.12 "Todo mundo tem um relógio no pulso," — lateral travelling down the street: three people, each raising a glowing wrist as we pass
at(3.12, 'pulso', x => { const s = scn(x, 'street'); const L = x.L; const k = eio(x.u); const cx = mix(-6, 6, k); cam(x, [cx, 3.6, 9.5], [cx, 3.2, 0.4], 42); x.out.focus = 9;
  [['avo', -6, 0.0, '2 ANOS'], ['padeiro', 0, 0.55, '3 DIAS'], ['crianca', 6, 1.1, '8 MESES']].forEach(([n, px, a0, txt], i) => { const c = put(x, n, s, px, 0.4, 0); const w = springE(seg(L, a0, a0 + 0.4)); checkWatch(c, w); c.setFace({ mouth: 'smile' });
    if (Math.abs(px - cx) < 3.0) holoS(x, s, (px - cx) / 6, 0.8, txt, a0 + 0.15, '#5af0ff', '', i % 2 ? 'holo2' : 'holo', 0.42); }); });
// 4.88 "e cada compra desconta um pedaço." — the baker checks his watch: 3 DIAS ... a chunk breaks off on "desconta" -> 2 DIAS (he gasps)
at(4.88, 'pedaco', x => { const s = scn(x, 'street'); const c = put(x, 'padeiro', s, 0, 0.4, 0); checkWatch(c, 1); const cut = x.L > 0.87; c.setFace(cut ? { mouth: 'o', eyes: 'wide', brow: -0.6, mustache: '#3a2414' } : { mouth: 'flat', mustache: '#3a2414' }); c.setWatch(cut ? '2 DIAS' : '3 DIAS');
  frame(x, c.root.position, 0, 'med', { ang: 0.15 }); punch(x, 0.87, 0.1); holoS(x, s, 0, 0.8, cut ? '2 DIAS' : '3 DIAS', 0, cut ? '#ffb84a' : '#5af0ff', '', 'holo', 0.55);
  if (cut) { const h2 = holoS(x, s, 0.35, 0.35 - 0.9 * eo(seg(x.L, 0.95, 1.9)), '-1 DIA', 0.87, '#ff4a4a', '', 'holo2', 0.32); if (h2) h2.rotateZ(-0.5 * seg(x.L, 0.95, 1.9)); } });

// ===== 2. MOM'S WATCH =====
// 7.10 "Hoje de manhã," — morning sun in the kitchen: mum at the stove, the hero walks in
at(7.10, 'manha', x => { const s = scn(x, 'home'); const m = put(x, 'mae', s, 2.2, -2.8, mix(Math.PI - 0.3, -0.55, sm(seg(x.L, 0.0, 0.32)))); m.setFace({ lashes: true, mouth: 'grin', eyes: 'happy' }); wave(m, x.L, 0.3, 9, x.t);
  const c = put(x, 'heroi', s, -1, -1); walkPath(c, x.L, -0.5, 0.7, [-4.0, -1.0], [-1.8, -1.7], { stride: 2.2 }); c.setFace({ eyes: 'happy', mouth: 'smile' }); frame(x, new V3(0.2, 0, -2.2), 0, 'wide', { d: 0.95, ly: 3.0 }); });
// 7.90 "o relógio da minha mãe marcou um dia." — mum checks her wrist; the readout lands on "1 DIA" (orange) on "dia"; her smile fades
at(7.90, 'mae1dia', x => { const s = scn(x, 'home'); const m = put(x, 'mae', s, 0.6, -1.4, 0.25); const w = springE(seg(x.L, 0.2, 0.6)); checkWatch(m, w); m.setWatch('1 DIA', '#ffa040');
  m.setFace(x.L > 1.8 ? { mouth: 'frown', eyes: 'sad', brow: -0.8, lashes: true } : { mouth: 'flat', lashes: true }); frame(x, m.root.position, 0.25, 'med', { ang: 0.1 }); punch(x, 1.78, 0.1);
  holoS(x, s, 0, 0.8, '1 DIA', 1.78, '#ffa040', '', 'holo', 0.5); });
// 10.19 "Um pão custa 10 minutos," — bakery: the baker holds out a loaf over the counter; the hero taps his wrist on the terminal: "-10 MIN"
at(10.19, 'pao', x => { const s = scn(x, 'bakery'); const b = put(x, 'padeiro', s, -1.4, -3.9, 0.25); const g = springE(seg(x.L, 0.05, 0.45)); b.armR.piv.rotation.x += -1.45 * g; hold(b, x.FX.bread, 'R', [0, -0.4, 0.3], [0, 0, Math.PI / 2]); b.setFace({ mouth: 'grin', eyes: 'happy', mustache: '#3a2414' });
  const c = put(x, 'heroi', s, 2.2, -0.6, Math.PI / 2); const tp = springE(seg(x.L, 0.7, 1.05)); c.armL.piv.rotation.x += -1.5 * tp; lookAtP(c, x.S.bakeryTerminal, 0.6); c.setFace({ mouth: 'smile' });
  frame(x, new V3(0.4, 0, -1.8), 0, 'wide', { d: 0.9, ly: 3.4, ang: -0.1 }); holoS(x, s, 0.25, 0.8, '-10 MIN', 1.0, '#ff5a5a', '', 'holo', 0.45); });
// 12.07 "um sorvete, uma hora." — the ice-cream cart (sign SORVETE 1 HORA): a kid licks his cone, happy
at(12.07, 'sorvete', x => { const s = scn(x, 'street'); const c = put(x, 'crianca', s, 1.6, 4.6, 0.35); const r = springE(seg(x.L, 0.0, 0.4)); c.armR.piv.rotation.x += -1.75 * r; c.armR.piv.rotation.z += 0.3 * r; hold(c, x.FX.ice, 'R', [0, -0.35, 0.15], [Math.PI / 2, 0, 0]);
  c.head.rotation.x += 0.08 * Math.sin(x.t * 9); c.setFace({ eyes: 'happy', mouth: 'open' }); frame(x, new V3(3.3, 0, 3.6), 0, 'wide', { d: 0.85, ly: 2.6, ang: -0.1 }); });
// 13.46 "Por isso, o meu avô só bebe chá," — grandpa sips his tea, eyes closed, content
at(13.46, 'cha', x => { const s = scn(x, 'home'); const a = put(x, 'avo', s, 0.9, -0.6, -0.2); const sip = sm(seg(x.L, 0.3, 0.7)) * (1 - sm(seg(x.L, 1.4, 1.8))); a.armR.piv.rotation.x += -1.0 - 0.65 * sip; a.armR.piv.rotation.z += 0.42 * sip; hold(a, x.FX.cup, 'R', [0, -0.3, 0.3]);
  a.head.rotation.x += -0.12 * sip; a.setFace({ eyes: sip > 0.5 ? 'closed' : 'normal', mouth: 'smile', mustache: '#d8d8dc', wrinkles: true }); frame(x, a.root.position, -0.2, 'med', { ang: 0.2 }); });
// 15.32 "porque café custa um dia inteiro." — he looks at the coffee machine (CAFÉ 1 DIA), sighs and looks down
at(15.32, 'cafe', x => { const s = scn(x, 'home'); const a = put(x, 'avo', s, 3.4, -2.9, 0.25); lookAtP(a, x.S.coffee, 0.9 * (1 - sm(seg(x.L, 1.2, 1.7)))); if (x.L > 1.2) gesture(a, 'sad', x.L, 1.2, 9, 0.8, { face: false });
  a.setFace(x.L > 1.2 ? { eyes: 'sad', mouth: 'frown', brow: -1, mustache: '#d8d8dc', wrinkles: true } : { eyes: 'normal', mouth: 'o', mustache: '#d8d8dc', wrinkles: true });
  frame(x, new V3(4.4, 0, -3.3), 0, 'med', { d: 1.25, ang: 0.15, ly: 3.4 }); punch(x, 0.85, 0.08); });

// ===== 3. THE RICH KID =====
// 17.36 "O filho do dono do banco" — the Time Bank: the rich kid swaggers down the steps toward us
at(17.36, 'banco', x => { const s = scn(x, 'bank'); const c = put(x, 'rico', s, 0, -6.5); walkPath(c, x.L, -0.3, 1.36, [0, -7.4], [0, -3.8], { stride: 2.3, linear: true }); c.torso.rotation.z += 0.05 * Math.sin(x.t * 5); c.setFace({ mouth: 'smirk', eyes: 'normal', brow: 0.5 });
  frame(x, c.root.position, 0, 'full', { d: 1.15, ly: 5.2, cy: 2.8 }); });
// 18.72 "tem 900 anos guardados," — he lifts his golden watch: "900 ANOS" in gold, sparkles; punch on "900"
at(18.72, 'novecentos', x => { const s = scn(x, 'bank'); const c = put(x, 'rico', s, 0, -3.8); const w = springE(seg(x.L, 0.0, 0.35)); checkWatch(c, w); c.head.rotation.x -= 0.25 * w; c.setFace({ mouth: 'grin', eyes: 'happy', brow: 0.6 }); c.setWatch('900 ANOS', '#ffd040');
  frame(x, c.root.position, 0, 'med', { ang: 0.12 }); lookCam(x, c, 0.6); punch(x, 0.0, 0.1); const wp = c.wristPt(); holoS(x, s, 0, 0.8, '900 ANOS', 0.05, '#ffd040', '', 'holo', 0.6); sparks(x, s, wp.clone().add(new V3(0, -0.3, 0.3)), 0.8, 0.7); });
// 20.60 "e compra figurinha com semanas, só por diversão." — at the newsstand he pays with weeks and throws sticker packs in the air, laughing
at(20.60, 'figurinha', x => { const s = scn(x, 'bank'); const c = put(x, 'rico', s, 3.4, 1.4, 0.75); const tap = springE(seg(x.L, 0.15, 0.5)) * (1 - sm(seg(x.L, 1.2, 1.5))); c.armL.piv.rotation.x += -1.4 * tap; lookAtP(c, new V3(6.5, 2.5, -1.3), 0.6 * tap);
  if (x.L > 1.3) { gesture(c, 'cheer', x.L, 1.35, 9, 0.9, { face: false }); c.setFace({ mouth: 'open', eyes: 'happy' }); } else c.setFace({ mouth: 'smirk' });
  frame(x, new V3(4.6, 0, -0.2), 0, 'wide', { d: 0.85, ly: 3.4, ang: -0.25 }); holoS(x, s, 0.1, 0.8, '-2 SEMANAS', 0.6, '#ff5a5a', '', 'holo', 0.5);
  [x.FX.pack, x.FX.pack2, x.FX.pack3].forEach((p, i) => { const k = seg(x.L, 1.4 + i * 0.08, 2.6); if (k <= 0) return; s.add(p); p.position.set(3.4 + (i - 1) * 1.1 * k, 4.6 + 3.2 * k - 4.2 * k * k, 2.0 + 0.6 * k); p.rotation.set(k * 6 + i, k * 4, k * 3); }); });

// ===== 4. THE STRANGE WATCH =====
// 23.55 "A gente nunca teve muito." — side by side behind the kitchen table, one single loaf: mum breaks it and hands him half
at(23.55, 'pouco', x => { const s = scn(x, 'home'); const m = put(x, 'mae', s, -3.9, -2.75, 0.2); sit(m, 1.5); m.setFace({ lashes: true, mouth: 'smile' }); const c = put(x, 'heroi', s, 0.3, -2.75, -0.2); sit(c, 1.5); c.setFace({ mouth: 'smile' });
  const give = springE(seg(x.L, 0.5, 0.95)); aimArm(m, m.armL, new V3(-2.4, 2.75, -1.3), give); if (give > 0.05) hold(m, x.FX.bread, 'L', [0, -0.35, 0.2], [0, 0, Math.PI / 2]); else { s.add(x.FX.bread); x.FX.bread.position.set(-2.4, 2.6, -1.3); }
  lookAtP(m, headP(c), 0.5); lookAtP(c, new V3(-1.6, 2.8, -1.4), 0.6); frame(x, new V3(-1.8, 0, -2.2), 0, 'med', { d: 1.6, ly: 3.4 }); });
// 25.18 "Mas o meu relógio tinha uma coisa estranha." — the hero checks his watch, puzzled: "?" on "estranha"
at(25.18, 'estranho', x => { const s = scn(x, 'bedroom'); const c = put(x, 'heroi', s, -2.6, 0.6, 0.3); checkWatch(c, springE(seg(x.L, 0.1, 0.5))); c.head.rotation.z += 0.2 * sm(seg(x.L, 1.3, 1.7)); c.setFace(x.L > 1.4 ? { mouth: 'flat', brow: -0.4, eyes: 'normal', look: [0.5, 0.6] } : { mouth: 'flat' });
  frame(x, c.root.position, 0.3, 'med', { ang: 0.05 }); bubble(x, 'q', s, c, 1.55); });
// 27.44 "Toda manhã, ele tinha subido um pouco." — morning: he sits up in bed, stretches, checks: "+1 DIA" (green) rising
at(27.44, 'subiu', x => { const s = scn(x, 'bedroom'); const c = put(x, 'heroi', s, 0.5, -5.3, 0); sit(c, 1.72); const st = gestW(x.L, 0.0, 0.9, 0.3, 0.3); c.armR.piv.rotation.z += -2.6 * Math.max(0, st); c.armL.piv.rotation.z += 2.6 * Math.max(0, st); c.setFace(x.L < 0.9 ? { eyes: 'closed', mouth: 'o' } : { eyes: 'normal', mouth: 'smile' });
  if (x.L > 0.9) checkWatch(c, springE(seg(x.L, 0.9, 1.3))); frame(x, new V3(0.5, 0, -5.3), 0, 'med', { d: 1.1, ly: 3.6, cy: 4.4 }); holoS(x, s, 0, 0.8, '+1 DIA', 1.35, '#5aff8a', '', 'holo', 0.45); });
// 29.47 "Um dia, dois dias, às vezes uma semana inteira." — close on his wrist: the readout climbs on each word, he grins wider each time
at(29.47, 'dias', x => { const s = scn(x, 'bedroom'); const c = put(x, 'heroi', s, -1.0, 0.8, 0.15); checkWatch(c, 1); const step = x.L < 0.94 ? 0 : x.L < 2.54 ? 1 : 2; const txt = ['+1 DIA', '+2 DIAS', '+1 SEMANA'][step]; c.setWatch(txt, '#5aff8a');
  c.setFace([{ mouth: 'smile' }, { mouth: 'grin', eyes: 'happy' }, { mouth: 'open', eyes: 'wide', brow: -0.3 }][step]); c.head.rotation.z += 0.12 * Math.sin(step * 2 + 1) * sm(seg(x.L, 0.37, 0.7));
  frame(x, c.root.position, 0.15, 'med', { d: 0.82, ly: 3.6, ang: 0.1 }); for (const a of [0.37, 0.94, 2.54]) punch(x, a, 0.06, 0.2); holoS(x, s, 0, 0.8, txt, [0.37, 0.94, 2.54][step], '#5aff8a', '', step % 2 ? 'holo2' : 'holo', 0.55); });
// 33.04 "Minha mãe dizia que eu era uma criança de sorte." — living room: mum pats his head, he beams; golden sparkles
at(33.04, 'sorte', x => { const s = scn(x, 'home'); const m = put(x, 'mae', s, -1.3, 2.2, 0.7); const c = put(x, 'heroi', s, 1.3, 2.5, -0.5); m.noCollide = new Set(['heroi']); const pat = springE(seg(x.L, 0.25, 0.7));
  aimArm(m, m.armL, headP(c).add(new V3(-0.3, 1.32 + 0.06 * Math.sin(x.t * 12) * pat, 0)), pat); m.setFace({ lashes: true, mouth: 'grin', eyes: 'happy' }); c.setFace({ mouth: 'grin', eyes: 'happy', blush: 0.6 }); lookCam(x, c, 0.5);
  frame(x, new V3(0, 0, 2.3), 0, 'wide', { d: 0.72, ly: 3.4 }); sparks(x, s, headP(c).add(new V3(0, 0.6, 0)), sm(seg(x.L, 1.6, 2.0)), 1.0); });
// 35.64 "E ela sempre repetia a mesma frase." — mum lifts her index finger, teaching him; he listens looking up
at(35.64, 'frase', x => { const s = scn(x, 'home'); const m = put(x, 'mae', s, -2.1, 2.1, 0.6); const c = put(x, 'heroi', s, 2.1, 2.5, -0.55); m.armR.piv.rotation.x += -2.4 * springE(seg(x.L, 0.2, 0.55)); m.armR.piv.rotation.z += -0.25 * sm(seg(x.L, 0.2, 0.55)); talk(m, x.t, seg(x.L, 0.1, 0.3)); m.setFace({ lashes: true, brow: 0.2, eyes: 'normal' }); lookAtP(c, headP(m), 0.8); c.setFace({ mouth: 'o', eyes: 'normal' });
  frame(x, new V3(0, 0, 2.3), 0, 'wide', { d: 0.9, ly: 3.4, ang: 0.15 }); });
// 38.08 "Tempo não se conta, filho." — close on mum, warm smile, saying it
at(38.08, 'conta', x => { const s = scn(x, 'home'); const m = put(x, 'mae', s, -2.0, 2.0, 0.4); talk(m, x.t, 1 - sm(seg(x.L, 1.25, 1.4))); m.setFace({ lashes: true, eyes: 'happy', brow: -0.2 }); m.head.rotation.z += 0.12 * sm(seg(x.L, 0.2, 0.8));
  frame(x, m.root.position, 0.4, 'close', { ang: 0.1 }); });
// 39.49 "Tempo se dá." — she puts her hand on his heart; small hearts float up; he smiles
at(39.49, 'sedá', x => { const s = scn(x, 'home'); const m = put(x, 'mae', s, -1.6, 2.1, 0.75); const c = put(x, 'heroi', s, 1.6, 2.5, -0.6); m.noCollide = new Set(['heroi']); const h = springE(seg(x.L, 0.05, 0.4)); aimArm(m, m.armL, chestP(c).add(new V3(-0.95, 0.2, 0.45)), h);
  talk(m, x.t, 1 - sm(seg(x.L, 0.6, 0.8))); m.setFace({ lashes: true, eyes: 'happy' }); c.setFace({ eyes: 'happy', mouth: 'smile', blush: 0.5 }); frame(x, new V3(0.0, 0, 2.3), 0, 'wide', { d: 0.85, ly: 3.6 }); hearts(x, s, chestP(c).add(new V3(-0.8, 0.8, 0.6)), sm(seg(x.L, 0.3, 0.6))); });

// ===== 5. MUM IS GETTING OLD =====
// 40.51 "Ela usava manga comprida até no verão." — scorching summer street: the neighbour fans herself in a T-shirt; mum walks by in long sleeves, tugging one sleeve down over the watch
at(40.51, 'verao', x => { const s = scn(x, 'street'); x.grade.tint.value.set(1.12, 1.0, 0.86); x.bloom.strength = 0.4; const v = put(x, 'vizinha', s, 3.9, -1.7, -0.35); v.armR.piv.rotation.x += -2.0; v.armR.piv.rotation.z += 0.6 + 0.25 * Math.sin(x.t * 16); v.setFace({ lashes: true, mouth: 'open', eyes: 'closed' });
  const m = put(x, 'mae', s, -1, 0.8); walkPath(m, x.L, -0.5, 2.6, [-2.6, -1.6], [-0.2, 1.4], { stride: 2.2, linear: true }); const tug = sm(seg(x.L, 0.8, 1.2)); m.armR.piv.rotation.x += -0.9 * tug; m.armR.piv.rotation.z += 0.35 * tug; m.setFace({ lashes: true, mouth: 'flat', eyes: 'normal' });
  frame(x, new V3(0.2, 0, -0.2), 0, 'wide', { d: 0.9, ly: 3.2 }); });
// 42.84 "Dormia cada vez menos." — night kitchen: mum alone at the table, eyes heavy, nodding off and jerking awake
at(42.84, 'dormia', x => { const s = scn(x, 'homeNight'); const m = put(x, 'mae', s, -1.8, -2.75, 0); sit(m, 1.5); m.armR.piv.rotation.x += -1.25; m.armL.piv.rotation.x += -1.25; const nod = Math.max(0, Math.sin(x.L * 3.2)); m.head.rotation.x += 0.35 * nod;
  m.setFace({ lashes: true, eyes: nod > 0.6 ? 'closed' : 'sad', mouth: 'flat', brow: -0.6 }); frame(x, new V3(-1.8, 0, -2.75), 0.1, 'med', { d: 1.15, ly: 3.4 }); });
// 44.58 "O cabelo dela ficou branco em um ano." — she touches her hair while it turns white in front of us; calendar pages fly past
at(44.58, 'branco', x => { const s = scn(x, 'home'); const m = put(x, 'mae', s, -1.6, 1.6, 0.25); const g = sm(seg(x.L, 0.5, 1.8)); x.C.mae.setGray(g); const tch = springE(seg(x.L, 0.1, 0.5)); aimArm(m, m.armR, headP(m).add(new V3(-0.95, 0.55, 0.1)), tch * 0.85);
  m.head.rotation.z += -0.12 * tch; m.setFace({ lashes: true, eyes: g > 0.5 ? 'sad' : 'normal', mouth: g > 0.5 ? 'frown' : 'flat', brow: -0.6 * g, look: [-0.6, -0.5] }); frame(x, m.root.position, 0.25, 'close', { ang: 0.1, d: 1.05 });
  const P = x.FX.calPages; s.add(P); P.children.forEach((p, i) => { const u = (p.userData.ph + x.L * 0.8) % 1; p.position.set(-4.4 + u * 6.0, 7.0 - u * 3.2 + Math.sin(i) * 0.4, -0.6 + Math.cos(i * 2) * 0.5); p.rotation.set(u * 5 + i, u * 3, u * 2); p.scale.setScalar(0.5); }); });
// 46.79 "E toda noite, às três da manhã," — the bedside clock: 03:00, push-in
at(46.79, 'tres', x => { const s = scn(x, 'bedNight'); const p = x.S.bedClockPos; camMove(x, [p.x + 0.5, p.y + 0.6, p.z + 3.4], [p.x, p.y, p.z], [p.x + 0.25, p.y + 0.35, p.z + 2.2], [p.x, p.y, p.z], eo, 40); x.out.focus = 2.6; punch(x, 1.02, 0.08); });
// 48.95 "eu ouvia a porta do meu quarto ranger." — in bed, he opens his eyes and turns his head toward the door, which creaks open a crack (warm light)
at(48.95, 'ranger', x => { const s = scn(x, 'bedNight'); const c = x.C.heroi; s.add(c.root); x.live.push(c); lie(c, -1.0, -0.7, 1.7); const k = sm(seg(x.L, 0.9, 1.6)); x.S.bedDoor(0.2 * k); x.S.doorLight.intensity = 30 * k; x.S.doorLight.target.position.set(-1.0, 2.2, -5.4);
  c.head.rotation.y = -0.6 * sm(seg(x.L, 0.4, 1.0)); c.setFace({ eyes: x.L < 0.3 ? 'closed' : 'wide', mouth: 'flat', brow: -0.5 }); blanket(x, s); x.camera.up.set(0, 0, -1); const k2 = eo(x.u); cam(x, [-0.8, mix(6.3, 5.6, k2), -4.6], [-1.0, 2.2, -5.55], 44); x.out.focus = 3.6; });

// ===== 6. COUNTDOWN WEEK =====
// 51.16 "Na segunda, o relógio dela marcava um ano." — by the kitchen calendar (SEGUNDA): white-haired mum checks her watch: "1 ANO"
at(51.16, 'segunda', x => { const s = scn(x, 'home'); x.S.homeCal.set('SEGUNDA'); const m = put(x, 'mae', s, -4.3, -3.6, 0.35); x.C.mae.setGray(1); checkWatch(m, springE(seg(x.L, 0.4, 0.8))); m.setWatch('1 ANO', '#ffd040');
  m.setFace({ lashes: true, mouth: 'flat', eyes: 'normal', brow: -0.3 }); frame(x, new V3(-5.0, 0, -3.8), 0, 'med', { d: 1.2, ly: 3.9 }); holoS(x, s, 0, 0.8, '1 ANO', 0.78, '#ffd040', 'SEGUNDA', 'holo', 0.5); });
// 53.84 "Na quarta, um mês." — at the stove, slower: "1 MÊS"
at(53.84, 'quarta', x => { const s = scn(x, 'home'); const m = put(x, 'mae', s, 2.6, -3.2, -0.25); x.C.mae.setGray(1); m.torso.rotation.x += 0.12; checkWatch(m, springE(seg(x.L, 0.2, 0.6))); m.setWatch('1 MÊS', '#ffa040');
  m.setFace({ lashes: true, mouth: 'frown', eyes: 'sad', brow: -0.6 }); frame(x, m.root.position, -0.25, 'med', { ang: -0.2 }); holoS(x, s, 0, 0.8, '1 MÊS', 0.55, '#ffa040', 'QUARTA', 'holo2', 0.5); });
// 55.24 "Na sexta, uma semana." — sitting at the table, a hand on her forehead: "1 SEMANA"
at(55.24, 'sexta', x => { const s = scn(x, 'home'); const m = put(x, 'mae', s, -1.8, -2.75, 0); sit(m, 1.5); x.C.mae.setGray(1); aimArm(m, m.armR, headP(m).add(new V3(-0.25, 0.25, 0.75)), springE(seg(x.L, 0.15, 0.5)) * 0.9); m.armL.piv.rotation.x += -1.25;
  m.setFace({ lashes: true, mouth: 'frown', eyes: 'closed', brow: -0.8 }); m.setWatch('1 SEMANA', '#ff7a40'); frame(x, new V3(-1.8, 0, -2.75), 0.15, 'med', { d: 1.05, ly: 3.4 }); holoS(x, s, 0, 0.8, '1 SEMANA', 0.15, '#ff7a40', 'SEXTA', 'holo', 0.5); });
// 56.84 "Hoje, um dia." — close: "1 DIA" blinking red; she sways, exhausted
at(56.84, 'hoje', x => { const s = scn(x, 'home'); const m = put(x, 'mae', s, -1.0, 0.8, 0.2); x.C.mae.setGray(1); m.torso.rotation.z += 0.08 * Math.sin(x.t * 3); m.head.rotation.z += 0.1 * Math.sin(x.t * 3 + 0.5); gesture(m, 'chest', x.L, 0.1, 9, 0.8, { face: false });
  m.setFace({ lashes: true, mouth: 'wavy', eyes: 'sad', brow: -1 }); frame(x, m.root.position, 0.2, 'close', { d: 1.1 }); x.grade.tint.value.set(1 + 0.12 * Math.max(0, Math.sin(x.L * 14)), 0.95, 0.95);
  holoS(x, s, 0, 0.8, Math.sin(x.L * 14) > -0.3 ? '1 DIA' : ' ', 0.0, '#ff3a3a', 'HOJE', 'holo2', 0.5); });

// ===== 7. 3 A.M. =====
// 57.80 "Então, essa noite, eu fingi que estava dormindo." — in bed, eyes shut... one quick peek on "fingi", then shut again
at(57.80, 'fingi', x => { const s = scn(x, 'bedNight'); const c = x.C.heroi; s.add(c.root); x.live.push(c); lie(c, -1.0, -0.7, 1.7); blanket(x, s); const pk = x.L > 1.6 && x.L < 2.05; c.setFace({ eyes: pk ? 'normal' : 'closed', mouth: 'flat', look: pk ? [0.8, 0] : [0, 0] });
  x.camera.up.set(0, 0, -1); const k = eo(x.u); cam(x, [mix(0.1, -0.5, k), mix(6.4, 5.8, k), -4.7], [-1.0, 2.2, -5.55], 44); x.out.focus = 3.8; });
// 60.95 "Às três da manhã, a porta rangeu." — from the bed: the door creaks open, warm light, mum's silhouette in the doorway
at(60.95, 'porta', x => { const s = scn(x, 'bedNight'); const k = eio(seg(x.L, 0.6, 1.6)); x.S.bedDoor(0.15 + 0.75 * k); x.S.doorLight.intensity = 70 * (0.3 + 0.7 * k); x.S.doorLight.target.position.set(4, 1.5, -1);
  const m = put(x, 'mae', s, 7.4, -1.0, -Math.PI / 2 + 0.25); x.C.mae.setGray(1); m.setFace({ lashes: true, mouth: 'flat', eyes: 'sad' }); m.watch.visible = true;
  camMove(x, [-0.8, 3.0, 1.6], [6.8, 3.0, -1.0], [-0.4, 3.1, 1.2], [6.8, 3.2, -1.0], eo, 44); x.out.focus = 8; });
// 63.06 "Minha mãe sentou na minha cama," — she tiptoes to the bed and sits on its edge beside him
const MSIT = [4.0, -3.2]; const MROT = Math.PI;
at(63.06, 'sentou', x => { const s = scn(x, 'bedNight'); x.S.bedDoor(0.9); x.S.doorLight.intensity = 90; x.S.doorLight.target.position.set(3.4, 3.4, -3.4); const c = x.C.heroi; s.add(c.root); x.live.push(c); lie(c, -1.0, -0.7, 1.7); blanket(x, s); c.setFace({ eyes: 'closed', mouth: 'flat' });
  const m = put(x, 'mae', s, 5.4, -1.8, 0); x.C.mae.setGray(1); walkPath(m, x.L, 0.0, 0.85, [5.6, -1.6], [MSIT[0] + 0.4, MSIT[1]], { stride: 1.6 }); const tw = sm(seg(x.L, 0.75, 1.15));
  if (x.L > 0.75) { m.root.rotation.y = mix(m.root.rotation.y, MROT, tw); m.root.position.x = mix(MSIT[0] + 0.4, MSIT[0], tw); } sitW(m, 1.72, sm(seg(x.L, 0.95, 1.4))); lookAtP(m, headP(c), 0.6 * tw);
  m.setFace({ lashes: true, mouth: 'flat', eyes: 'sad' }); camMove(x, [5.0, 5.9, 2.2], [0.6, 2.1, -3.9], [4.5, 5.8, 1.4], [0.9, 2.3, -3.9], eo, 54); x.out.focus = 6.5; });
// 64.75 "segurou o meu pulso contra o dela," — close from above: her hand takes his wrist and lays it against her watch
// camera across the bed from the mom: her face looks down at the wrist, toward us; wrist in the lower third
function pairCam(x, m, w, k, extra = 0) { const H = headP(m); const dist = mix(4.2, 3.5, k) - extra * k;
  x.camera.up.set(0, 1, 0); const T = new V3(mix(w.x, H.x, 0.5), mix(w.y, H.y, 0.5), mix(w.z, H.z, 0.5)); const f = (dist / 4.2) * 1.55; cam(x, [T.x - 2.2 * f, T.y + 1.3 * f, T.z + 2.6 * f], [T.x, T.y, T.z], 44); x.out.focus = dist; }
function bedPair(x) { const s = scn(x, 'bedNight'); x.S.bedDoor(0.9); x.S.doorLight.intensity = 90; x.S.doorLight.target.position.set(3.4, 3.4, -3.4); const c = x.C.heroi; s.add(c.root); x.live.push(c); lie(c, -1.0, -0.7, 1.7); blanket(x, s);
  const m = put(x, 'mae', s, MSIT[0], MSIT[1], MROT); x.C.mae.setGray(1); sit(m, 1.72); m.torso.rotation.y += 0.4; m.noCollide = new Set(['heroi']); return { s, c, m }; }
at(64.75, 'pulso', x => { const { s, c, m } = bedPair(x); const g = springE(seg(x.L, 0.1, 0.6)); c.armL.piv.rotation.z = 0.1 * g; c.setFace({ eyes: 'closed', mouth: 'flat' });
  const w = c.wristPt(); aimArm(m, m.armL, w.clone().add(new V3(1.0, 0.25, -0.2)), g); m.setFace({ lashes: true, mouth: 'flat', eyes: 'sad' }); lookAtP(m, w.clone().add(new V3(0, 1.1, 0.4)), 0.6);
  m.setWatch('23 H', '#ff9a40'); c.setWatch('0 H', '#ff3a3a'); x.camera.up.set(0, 0, -1); cam(x, [w.x - 0.25, 5.75, w.z + 0.7], [w.x + 0.15, w.y, w.z - 0.15], mix(66, 58, eo(x.u))); x.out.focus = 2.9; punch(x, 0.3, 0.06); });
// 66.52 "e os números começaram a passar. Do relógio dela para o meu." — the glowing digits stream from her watch into his: her time drains, his rises
at(66.52, 'numeros', x => { const { s, c, m } = bedPair(x); c.armL.piv.rotation.z = 0.1; c.setFace({ eyes: 'closed', mouth: 'flat' }); const w = c.wristPt(); aimArm(m, m.armL, w.clone().add(new V3(1.0, 0.25, -0.2)), 1);
  m.setFace({ lashes: true, mouth: 'smile', eyes: 'sad' }); lookAtP(m, w.clone().add(new V3(0, 1.1, 0.4)), 0.6); const mw = m.wristPt(); const k = seg(x.L, 0.3, 3.4); const hm = Math.round(mix(23, 6, k)), hh = Math.round(mix(0, 17, k));
  const mw0 = m.wristPt(); const mid = w.clone().lerp(mw0, 0.5); x.camera.up.set(0, 0, -1); m.setWatch(hm + ' H', '#ff9a40'); c.setWatch(hh + ' H', '#5aff8a'); cam(x, [mid.x - 0.2, 5.75, mid.z + 0.9], [mid.x + 0.1, mid.y, mid.z - 0.2], mix(58, 66, eo(x.u))); x.out.focus = 2.9;
  stream(x, s, mw, w, sm(seg(x.L, 0.25, 0.5)), '#9af6ff', 'stream2', 0.2, 1.1); holoS(x, s, -0.45, 0.8, hm + ' H', 0.3, '#ff7a40', 'MÃE', 'holo', 0.4); holoS(x, s, 0.45, 0.8, '+' + hh + ' H', 1.6, '#5aff8a', 'EU', 'holo2', 0.4); });
// 70.07 "Eu abri os olhos." — top-down on his face: eyes snap open
at(70.07, 'olhos', x => { const { s, c, m } = bedPair(x); const op = x.L > 0.15; c.setFace({ eyes: op ? 'wide' : 'closed', mouth: op ? 'o' : 'flat', brow: op ? -0.6 : null }); x.camera.up.set(0, 0, -1); cam(x, [-0.9, 5.3, -4.9], [-1.0, 2.2, -5.55], 44); x.out.focus = 3.2; punch(x, 0.15, 0.12, 0.2); });
// 71.15 "Ela tentou esconder o braço, mas eu vi." — she snatches her arm behind her back; he sits up and points at it on "vi"
at(71.15, 'esconde', x => { const s = scn(x, 'bedNight'); x.S.bedDoor(0.9); x.S.doorLight.intensity = 90; x.S.doorLight.target.position.set(4.3, 4.2, -4.6); const c = put(x, 'heroi', s, 0.1, -5.0, -0.3); sit(c, 1.72); const m = put(x, 'mae', s, 4.3, -4.6, 0.3); x.C.mae.setGray(1); sit(m, 1.72);
  const hid = springE(seg(x.L, 0.0, 0.35)); m.armL.piv.rotation.x += 0.95 * hid; m.armL.piv.rotation.z += -0.12 * hid; m.torso.rotation.y += -0.25 * hid; m.setFace({ lashes: true, mouth: 'o', eyes: 'wide', brow: -0.6 }); lookAtP(m, headP(c), 0.7);
  startle(c, x.L, 1.42, 0.3); c.torso.rotation.x += 0.12 * springE(seg(x.L, 1.4, 1.75)); punch(x, 1.45, 0.1); c.setFace({ eyes: 'wide', mouth: x.L > 1.45 ? 'open' : 'o', brow: -0.4 }); lookAtP(c, new V3(4.3, 4.2, -4.6), 0.7);
  cam(x, [2.3, 4.5, mix(6.3, 5.5, eo(x.u))], [2.3, 3.6, -4.6], 54); x.out.focus = 10.5; punch(x, 1.55, 0.08); });
// 73.33 "E ela me contou tudo." — close on her, tears, telling him everything
at(73.33, 'contou', x => { const s = scn(x, 'bedNight'); x.S.bedDoor(0.9); x.S.doorLight.intensity = 90; x.S.doorLight.target.position.set(3.4, 3.4, -3.4); const m = put(x, 'mae', s, MSIT[0], MSIT[1], Math.PI / 2 - 0.9); x.C.mae.setGray(1); sit(m, 1.72); talk(m, x.t, 1);
  m.setFace({ lashes: true, eyes: 'sad', brow: -0.9, tears: sm(seg(x.L, 0.2, 0.7)) }); frame(x, m.root.position, Math.PI / 2 - 0.9, 'close', { ang: -0.5, d: 1.0, ly: 3.7 }); });

// ===== 8. THE TRUTH (flashback, sepia) =====
// newborn = the hero at baby size, lying in the incubator (head toward -x)
function baby(x, s) { const c = x.C.heroi; s.add(c.root); x.live.push(c); c.root.scale.setScalar(0.42); c.root.rotation.order = 'YXZ'; c.root.rotation.set(-Math.PI / 2, Math.PI / 2, 0); c.root.position.set(1.0, 2.55 + 0.21, -2.5);
  c.armR.piv.rotation.z += 0.15 * Math.sin(x.t * 2.3); c.legL.piv.rotation.x += 0.12 * Math.sin(x.t * 1.9); return c; }
const flash = x => { x.grade.sepia.value = 0.85; x.grade.vig.value = 0.55; x.grade.tint.value.set(0.74, 0.74, 0.74); };
// 74.68 "Que eu nasci com zero." — the incubator: a tiny newborn (top hat and all), his watch at 0
at(74.68, 'zero', x => { const s = scn(x, 'hospital'); flash(x); x.S.incDome.position.y = 40; const b = baby(x, s); b.setFace({ eyes: 'closed', mouth: 'o' }); b.setWatch('0', '#ff3a3a'); x.S.monitorDraw(x.t);
  const h = headP(b); x.camera.up.set(-1, 0, 0); camMove(x, [h.x + 0.5, h.y + 2.9, h.z + 0.9], [h.x + 0.55, h.y, h.z], [h.x + 0.3, h.y + 2.3, h.z + 0.5], [h.x + 0.45, h.y, h.z], eo, 44); x.out.focus = 2.6;
  holoS(x, s, 0, 0.8, '0', 0.45, '#ff3a3a', 'AO NASCER', 'holo', 0.42); });
// 75.89 "Que os médicos disseram que eu não ia passar" — the two doctors look at the chart and shake their heads
at(75.89, 'medicos', x => { const s = scn(x, 'hospital'); flash(x); baby(x, s).setFace({ eyes: 'closed', mouth: 'flat' }); x.S.monitorDraw(x.t);
  const a = put(x, 'medico', s, -2.15, -4.6, 0.25), b = put(x, 'medica', s, 2.15, -4.6, -0.25); for (const [c, ph] of [[a, 0], [b, 1.3]]) { const w = sm(seg(x.L, 0.5, 0.8)) * (1 - sm(seg(x.L, 1.6, 1.9))); c.head.rotation.y += 0.32 * Math.sin(x.t * 8 + ph) * w; c.setFace({ mouth: 'frown', eyes: 'sad', brow: -0.6 }); lookAtP(c, new V3(0, 2.6, -2.5), 0.6); }
  gesture(a, 'think', x.L, 0.0, 0.9, 1, { face: false }); gesture(b, 'chest', x.L, 1.2, 9, 1, { face: false }); talk(b, x.t, seg(x.L, 0.2, 0.4) * (1 - seg(x.L, 1.8, 2.0)));
  cam(x, [mix(0.4, 0.0, eo(x.u)), 4.6, mix(6.2, 5.2, eo(x.u))], [0, 3.6, -3.4], 50); x.out.focus = 8.2; });
// 77.78 "da primeira noite." — night outside the window, the heart line on the monitor weakens
at(77.78, 'noite', x => { const s = scn(x, 'hospital'); flash(x); x.grade.tint.value.set(0.78, 0.82, 1.0); baby(x, s).setFace({ eyes: 'closed', mouth: 'flat' }); x.S.monitorDraw(x.t * 0.4);
  camMove(x, [1.6, 4.6, 0.8], [3.6, 4.4, -4.8], [2.2, 4.5, -1.0], [3.6, 4.4, -4.8], eo, 40); x.out.focus = 4.2; });
// 79.02 "E que ela me deu a primeira hora." — young mum (dark hair) reaches over the open incubator: time flows from her watch into his: "+1 HORA"
at(79.02, 'hora', x => { const s = scn(x, 'hospital'); flash(x); x.S.incDome.position.y = 40; const b = baby(x, s); b.setFace({ eyes: x.L > 1.2 ? 'happy' : 'closed', mouth: x.L > 1.2 ? 'smile' : 'flat' });
  const m = put(x, 'mae', s, 0.4, -4.6, 0); m.setFace({ lashes: true, eyes: 'sad', mouth: 'smile', tears: 0.6 }); const r = springE(seg(x.L, 0.05, 0.45)); m.armL.piv.rotation.x += -1.25 * r; lookAtP(m, headP(b), 0.8);
  const k = seg(x.L, 0.4, 1.2); b.setWatch(k >= 1 ? '1 HORA' : '0', k >= 1 ? '#5aff8a' : '#ff3a3a'); m.setWatch('?', '#9af6ff'); x.S.monitorDraw(x.t);
  stream(x, s, m.wristPt(), b.wristPt(), sm(seg(x.L, 0.35, 0.6)) * (1 - sm(seg(x.L, 1.5, 1.8))), '#9af6ff', 'stream', 0.16, 1.2);
  camMove(x, [-0.6, 4.4, 3.6], [0.2, 3.4, -3.2], [-0.4, 4.3, 2.8], [0.2, 3.5, -3.2], eo, 48); x.out.focus = 6.4; holoS(x, s, 0, 0.8, '+1 HORA', 1.1, '#5aff8a', '', 'holo', 0.45); });
// 80.91 "Depois, o primeiro dia." — top-down on the baby, eyes open, smiling: "+1 DIA"
at(80.91, 'dia', x => { const s = scn(x, 'hospital'); flash(x); x.S.incDome.position.y = 40; const b = baby(x, s); b.setFace({ eyes: 'happy', mouth: 'grin', blush: 0.6 }); b.setWatch('1 DIA', '#5aff8a'); x.S.monitorDraw(x.t);
  const h = headP(b); x.camera.up.set(-1, 0, 0); cam(x, [h.x + 0.5, h.y + mix(2.4, 2.0, eo(x.u)), h.z + 0.25], [h.x + 0.45, h.y, h.z], 46); x.out.focus = 2.0; holoS(x, s, 0, 0.8, '+1 DIA', 0.2, '#5aff8a', '', 'holo2', 0.45); });
// 82.58 "E nunca mais parou." — years flying: calendar pages swirl while she keeps feeding him time; she greys a bit each page
at(82.58, 'parou', x => { const s = scn(x, 'home'); const g = 0.6 * seg(x.L, 0, 1.3); x.C.mae.setGray(g); const m = put(x, 'mae', s, -2.4, 1.6, 0.25); const c = put(x, 'heroi', s, 2.2, 2.0, -0.35);
  const days = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']; x.S.homeCal.set(days[Math.floor(x.L * 9) % 7]); m.armL.piv.rotation.x += -0.9; c.armL.piv.rotation.x += -0.9; lookAtP(m, headP(c), 0.6); lookAtP(c, headP(m), 0.6);
  m.setFace({ lashes: true, mouth: 'smile', eyes: 'happy' }); c.setFace({ mouth: 'grin', eyes: 'happy' }); stream(x, s, m.wristPt(), c.wristPt(), 1, '#9af6ff', 'stream', 0.2, 1.4);
  const P = x.FX.calPages; s.add(P); P.children.forEach((p, i) => { const u = (p.userData.ph + x.L * 1.1) % 1; p.position.set(-4.0 + u * 8.0, 7.2 - u * 2.6 + Math.sin(i) * 0.4, -1.2 + Math.cos(i * 2) * 0.6); p.rotation.set(u * 5 + i, u * 3, u * 2); p.scale.setScalar(0.5); });
  cam(x, [mix(-0.4, 0.2, eio(x.u)), 4.2, 11.5], [0, 3.6, 1.8], 46); x.out.focus = 9.8; });
// 83.93 "Eu nunca tive sorte. Eu tive ela." — back to the bedroom: he throws his arms around her; hearts on "ela"
function hug(x, s, k) { const HZ = -0.2; const c = put(x, 'heroi', s, 0.0, HZ, Math.PI / 2), m = put(x, 'mae', s, 1.45, HZ, -Math.PI / 2); c.noCollide = new Set(['mae']);
  for (const z of [-1.1, 1.1]) { aimArm(c, z < 0 ? c.armL : c.armR, new V3(1.75, 4.05, HZ + z * -0.95), k); aimArm(m, z < 0 ? m.armR : m.armL, new V3(-0.3, 2.9, HZ + z * -0.95), k); }
  c.head.rotation.x += 0.12 * k; m.head.rotation.x += 0.12 * k; return { c, m }; }
at(83.93, 'sorte', x => { const s = scn(x, 'bedNight'); x.S.bedDoor(0.9); x.S.doorLight.intensity = 90; x.S.doorLight.target.position.set(0.7, 3.6, -0.2); x.C.mae.setGray(1); const k = springE(seg(x.L, 1.0, 1.4));
  const { c, m } = hug(x, s, k); c.setFace({ eyes: x.L > 1.1 ? 'closed' : 'sad', mouth: x.L > 1.1 ? 'smile' : 'frown', tears: 0.8 }); m.setFace({ lashes: true, eyes: 'closed', mouth: 'smile', tears: 0.8 });
  cam(x, [mix(1.2, 0.9, eo(x.u)), 4.6, 6.3], [0.72, 3.7, -0.2], mix(58, 52, eo(x.u))); x.out.focus = 6.5; if (x.L > 1.5) hearts(x, s, new V3(0.75, 5.4, -0.2), sm(seg(x.L, 1.5, 1.8))); });
// ===== 9. GIVING IT BACK =====
// 86.11 "Encostei meu pulso no dela para devolver tudo." — he presses his watch against hers, determined
at(86.11, 'devolver', x => { const s = scn(x, 'bedNight'); x.S.bedDoor(0.9); x.S.doorLight.intensity = 90; x.S.doorLight.target.position.set(0.7, 3.4, 1.2); x.C.mae.setGray(1);
  const c = put(x, 'heroi', s, -0.6, 3.7, Math.PI / 2), m = put(x, 'mae', s, 2.9, 0.7, -Math.PI / 2); c.noCollide = new Set(['mae']); const r = springE(seg(x.L, 0.1, 0.5)); c.armL.piv.rotation.x += -1.35 * r; m.armL.piv.rotation.x += -1.35 * r;
  c.setFace({ eyes: 'normal', mouth: 'flat', brow: 0.5 }); m.setFace({ lashes: true, eyes: 'wide', mouth: 'o' }); lookAtP(c, c.wristPt(), 0.5); lookAtP(m, headP(c), 0.7); c.setWatch('20 ANOS', '#5aff8a'); m.setWatch('19 MIN', '#ff3a3a');
  const A = c.wristPt(), B = m.wristPt(); const mid = A.clone().lerp(B, 0.5); cam(x, [mid.x - 0.4, mid.y + 1.6, mid.z + mix(4.6, 3.6, eo(x.u))], [mid.x, mid.y + 0.3, mid.z], 44); x.out.focus = 4.2;
  if (x.L > 1.3) stream(x, s, A, B, sm(seg(x.L, 1.3, 1.6)), '#5aff8a', 'stream', 0.16, 1.2); });
// 88.81 "Mas o relógio travou." — close on his watch: glitch, red "TRAVADO", the stream snaps back
at(88.81, 'travou', x => { const s = scn(x, 'bedNight'); x.S.bedDoor(0.9); x.S.doorLight.intensity = 90; x.S.doorLight.target.position.set(0.7, 3.4, 1.2); x.C.mae.setGray(1);
  const c = put(x, 'heroi', s, 0.0, 1.2, Math.PI / 2 - 0.25); c.armL.piv.rotation.x += -1.35; const gl = x.L > 0.35 && Math.sin(x.L * 40) > 0; c.setWatch(x.L < 0.35 ? '20 ANOS' : gl ? 'TRAVADO' : 'ERRO', x.L < 0.35 ? '#5aff8a' : '#ff3a3a');
  c.setFace({ eyes: x.L > 0.4 ? 'wide' : 'normal', mouth: x.L > 0.4 ? 'o' : 'flat', brow: -0.6 }); const A = c.wristPt(); lookAtP(c, A, 0.6);
  cam(x, [A.x + 1.0, A.y + 1.5, A.z + 1.4], [A.x, A.y, A.z], mix(40, 34, eo(x.u))); x.out.focus = 2.4; if (x.L > 0.35) { x.grade.tint.value.set(1.25, 0.8, 0.8); x.camera.position.x += 0.03 * Math.sin(x.t * 60) * (1 - seg(x.L, 0.35, 0.9)); }
  holoS(x, s, 0, 0.8, 'TRAVADO', 0.4, '#ff3a3a', '', 'holo', 0.5); });
// 90.03 "Uma mensagem apareceu." — a holographic message pops over the watch, lighting his face blue
at(90.03, 'mensagem', x => { const s = scn(x, 'bedNight'); x.S.bedDoor(0.9); x.S.doorLight.intensity = 120; x.S.doorLight.target.position.set(0, 4.4, 1.2); const c = put(x, 'heroi', s, 0.0, 1.2, 0.75); c.armL.piv.rotation.x += -1.2;
  c.setFace({ eyes: 'wide', mouth: 'o', brow: -0.3, look: [0, -0.4] }); c.setWatch('!', '#9af6ff'); frame(x, c.root.position, 0.75, 'close', { d: 1.0, ang: -0.3 }); holoS(x, s, 0, 0.78, 'MENSAGEM', 0.2, '#9af6ff', 'NOVA', 'holo', 0.55); });
// 91.43 "Tempo só pode ser dado por quem ama." — the message itself, big, over his face
at(91.43, 'ama', x => { const s = scn(x, 'bedNight'); x.S.bedDoor(0.9); x.S.doorLight.intensity = 120; x.S.doorLight.target.position.set(0, 4.4, 1.2); const c = put(x, 'heroi', s, 0.0, 1.2, 0.75); c.armL.piv.rotation.x += -1.2; c.setWatch('!', '#9af6ff');
  c.setFace({ eyes: 'sad', mouth: 'frown', brow: -0.8, look: [0, -0.4] }); frame(x, c.root.position, 0.75, 'close', { d: 1.15, ang: -0.45 }); holoS(x, s, 0, 0.78, 'SÓ QUEM AMA', 0.0, '#ff7ab0', 'PODE DAR TEMPO', 'holo', 0.62); });
// 93.81 "Ela já estava com 19 minutos." — her watch: 19 MIN, blinking; she sinks on the bed edge
at(93.81, 'dezenove', x => { const s = scn(x, 'bedNight'); x.S.bedDoor(0.9); x.S.doorLight.intensity = 90; x.S.doorLight.target.position.set(4.3, 4.2, -4.6); const m = put(x, 'mae', s, 4.3, -4.6, 0.3); x.C.mae.setGray(1); sit(m, 1.72);
  m.torso.rotation.x += 0.18 * sm(seg(x.L, 0.2, 1.4)); m.head.rotation.x += 0.15; checkWatch(m, 0.8); m.setWatch(Math.sin(x.L * 10) > -0.4 ? '19 MIN' : '', '#ff3a3a'); m.setFace({ lashes: true, eyes: 'sad', mouth: 'wavy', brow: -1 });
  frame(x, m.root.position, 0.3, 'close', { d: 1.15, ang: -0.3, ly: 3.4 }); holoS(x, s, 0, 0.8, '19 MIN', 0.1, '#ff3a3a', 'MÃE', 'holo2', 0.5); });
// ===== 10. THE NIGHT RUN =====
const doorAt = (x, name, tx) => x.S.doors[name].reduce((a, d) => Math.abs(d.x - tx) < Math.abs(a.x - tx) ? d : a);
// 96.12 "Saí correndo pela rua," — running full speed down the night street toward us, the camera tracking back
at(96.12, 'correndo', x => { const s = scn(x, 'streetNight'); const c = put(x, 'heroi', s, 0, 0); const zz = mix(-8, 3.0, x.u); c.root.position.set(0.3, 0, zz); walkPath(c, x.L, -1, 99, [0.3, zz - 0.1], [0.3, zz], { stride: 3.0, linear: true }); c.root.position.set(0.3, 0, zz); c.root.rotation.y = 0;
  const ph = x.t * 11; c.legR.piv.rotation.x = 0.9 * Math.sin(ph); c.legL.piv.rotation.x = -0.9 * Math.sin(ph); c.armR.piv.rotation.x = -0.9 * Math.sin(ph); c.armL.piv.rotation.x = 0.9 * Math.sin(ph); c.torso.rotation.x = 0.18; c.hip.position.y = 2 + 0.12 * Math.abs(Math.cos(ph));
  c.setFace({ eyes: 'wide', mouth: 'open', brow: -0.7 }); cam(x, [0.3, 4.0, zz + 7.0], [0.3, 3.4, zz], 46); x.out.focus = 7; });
// 97.61 "batendo em todas as portas." — knocking: fist on a door, then the next one (cut on "todas")
at(97.61, 'portas', x => { const s = scn(x, 'streetNight'); const d = freeDoor(x, x.L < 0.6 ? -1 : 8); const c = put(x, 'heroi', s, d.x + 0.9, d.z + 1.35, Math.PI + 0.35, 0.35);
  const kn = Math.max(0, Math.sin((x.L % 0.6) / 0.6 * Math.PI * 3)); c.armR.piv.rotation.x += -1.55 - 0.25 * kn; c.torso.rotation.x += 0.05 * kn; c.setFace({ eyes: 'wide', mouth: 'open', brow: -0.6 });
  cam(x, [d.x - 3.2, 4.4, d.z + 9.0], [d.x + 0.6, 3.4, d.z + 0.9], 40); x.out.focus = 9.6; });
// giver scenes: the neighbour opens the door and holds out the wrist, time streams to his watch
const OBST = [-11, -7, -3.5, 3.6, 7, 11];
const freeDoor = (x, tx) => { const D = x.S.doors.streetNight.filter(d => OBST.every(o => o < d.x - 2.2 || o > d.x + 5.2)); return D.reduce((a, d) => Math.abs(d.x - tx) < Math.abs(a.x - tx) ? d : a); };
function give(x, who, tx, txt, col, faceG, o = {}) { const s = scn(x, 'streetNight'); const d = freeDoor(x, tx); const z = d.z + 0.95; const g = put(x, who, s, d.x, z, 0.9, 0.35); const c = put(x, 'heroi', s, d.x + 3.2, z, -0.9, 0.35); g.noCollide = new Set(['heroi']);
  const r = springE(seg(x.L, 0.15, 0.5)); g.armL.piv.rotation.x += -0.95 * r; c.armL.piv.rotation.x += -0.95 * r; lookAtP(g, headP(c), 0.6); lookAtP(c, headP(g), 0.5);
  g.setFace(Object.assign({ eyes: 'happy', mouth: 'smile' }, faceG)); c.setFace({ eyes: x.L > 0.9 ? 'happy' : 'sad', mouth: x.L > 0.9 ? 'smile' : 'frown', tears: 0.4 });
  stream(x, s, g.wristPt(), c.wristPt(), sm(seg(x.L, 0.35, 0.6)), col, 'stream', 0.2, 1.2);
  cam(x, [d.x + 1.6, 4.2, z + mix(8.6, 7.6, eo(x.u))], [d.x + 1.6, 3.7, z], 48); x.out.focus = 8; holoS(x, s, 0, 0.8, txt, 0.55, col, o.sub || '', 'holo', 0.5); return { g, c }; }
// 99.28 "A vizinha deu uma hora."
at(99.28, 'vizinha', x => give(x, 'vizinha', -9, '+1 HORA', '#5aff8a', { lashes: true }, { sub: 'VIZINHA' }));
// 100.69 "O padeiro deu um dia."
at(100.69, 'padeiro', x => give(x, 'padeiro', 1, '+1 DIA', '#5aff8a', { mustache: '#3a2414' }, { sub: 'PADEIRO' }));
// 102.15 "O meu avô deu um ano."
at(102.15, 'avo', x => give(x, 'avo', 9, '+1 ANO', '#ffd040', { mustache: '#f0f0f0', wrinkles: true }, { sub: 'VOVÔ' }));
// 103.75 "Até o filho do banqueiro apareceu" — the rich kid in the white suit walks out of the dark into the lamp light
at(103.75, 'rico', x => { const s = scn(x, 'streetNight'); const g = put(x, 'rico', s, 0, 0, 0); walkPath(g, x.L, 0, 1.3, [5.5, -1.2], [2.2, 0.4], { stride: 2.0 }); g.setFace({ eyes: 'normal', mouth: 'smirk' }); lookCam(x, g, sm(seg(x.L, 1.0, 1.4)) * 0.7);
  const c = put(x, 'heroi', s, -1.6, 1.0, 0.9); lookAtP(c, headP(g), 0.8); c.setFace({ eyes: 'wide', mouth: 'o', brow: -0.4 }); sparks(x, s, new V3(g.root.position.x, 2.0, g.root.position.z), 0.7, 1.4, '#ffd040');
  cam(x, [mix(1.6, 0.8, eo(x.u)), 4.0, 9.6], [0.4, 3.3, 0.6], 46); x.out.focus = 9; });
// 105.43 "e deu um século inteiro." — golden flood: +1 SÉCULO
at(105.43, 'seculo', x => { const s = scn(x, 'streetNight'); x.bloom.strength = 0.5; const g = put(x, 'rico', s, 2.2, 0.4, -Math.PI / 2 + 0.4); const c = put(x, 'heroi', s, -0.4, 0.9, Math.PI / 2 - 0.3); c.noCollide = new Set(['rico']);
  const r = springE(seg(x.L, 0.0, 0.35)); g.armL.piv.rotation.x += -1.0 * r; c.armL.piv.rotation.x += -1.0 * r; g.setFace({ eyes: 'happy', mouth: 'grin' }); c.setFace({ eyes: 'wide', mouth: 'grin', brow: 0.3 }); lookAtP(g, headP(c), 0.6);
  stream(x, s, g.wristPt(), c.wristPt(), sm(seg(x.L, 0.1, 0.35)), '#ffd040', 'stream', 0.28, 2.2); sparks(x, s, new V3(0.9, 2.2, 0.6), 1, 2.0, '#ffd040'); c.setWatch('+100 ANOS', '#ffd040');
  cam(x, [0.9, 4.0, mix(7.4, 6.2, eo(x.u))], [0.9, 3.4, 0.6], 46); x.out.focus = 6.6; punch(x, 0.62, 0.1); holoS(x, s, 0, 0.8, '+1 SÉCULO', 0.6, '#ffd040', '', 'holo', 0.55); });
// ===== 11. THE CLOCK CLIMBS =====
// 106.92 "O relógio da minha mãe começou a subir." — back home: her watch climbs, her hair gets its colour back, gold sparks
at(106.92, 'subir', x => { const s = scn(x, 'bedNight'); x.S.bedDoor(0.9); x.S.doorLight.intensity = 90; x.S.doorLight.target.position.set(4.3, 4.2, -4.6); x.bloom.strength = 0.4; const m = put(x, 'mae', s, 4.3, -4.6, 0.3); sit(m, 1.72);
  const k = sm(seg(x.L, 0.3, 2.4)); x.C.mae.setGray(1 - k); checkWatch(m, 0.9); const vals = ['19 MIN', '1 H', '1 DIA', '1 ANO', '50 ANOS', '100 ANOS']; const v = vals[Math.min(5, Math.floor(k * 6))]; m.setWatch(v, k > 0.5 ? '#ffd040' : '#5aff8a');
  m.setFace({ lashes: true, eyes: k > 0.4 ? 'wide' : 'sad', mouth: k > 0.4 ? 'o' : 'flat', brow: 0.3 * k }); sparks(x, s, new V3(4.3, 3.0, -4.6), sm(seg(x.L, 0.2, 0.6)), 1.5, '#ffd040');
  frame(x, m.root.position, 0.3, 'med', { d: 1.0, ang: -0.35, ly: 3.4 }); holoS(x, s, 0, 0.8, v, 0.25, k > 0.5 ? '#ffd040' : '#5aff8a', 'MÃE', 'holo2', 0.5); });
// 109.64 "E ela, chorando, só conseguiu dizer:" — close, happy tears, colour back in her hair
at(109.64, 'chorando', x => { const s = scn(x, 'bedNight'); x.S.bedDoor(0.9); x.S.doorLight.intensity = 90; x.S.doorLight.target.position.set(4.3, 4.2, -4.6); const m = put(x, 'mae', s, 4.3, -4.6, 0.3); sit(m, 1.72);
  gesture(m, 'chest', x.L, 0.2, 9, 0.9, { face: false }); m.setFace({ lashes: true, eyes: 'closed', mouth: 'wavy', brow: -0.8, tears: sm(seg(x.L, 0.1, 0.5)), blush: 0.4 }); m.head.rotation.z += 0.06 * Math.sin(x.t * 3);
  frame(x, m.root.position, 0.3, 'close', { d: 1.05, ly: 3.4 }); });
// 112.07 "Vocês não precisavam." — she looks at all of them (off camera, toward the door), talking through the tears
at(112.07, 'precisavam', x => { const s = scn(x, 'bedNight'); x.S.bedDoor(0.9); x.S.doorLight.intensity = 90; x.S.doorLight.target.position.set(4.3, 4.2, -4.6); const m = put(x, 'mae', s, 4.3, -4.6, 0.3); sit(m, 1.72);
  talk(m, x.t, seg(x.L, 0.05, 0.2) * (1 - seg(x.L, 1.2, 1.4))); gesture(m, 'shrug', x.L, 0.1, 9, 0.7, { face: false }); m.setFace({ lashes: true, eyes: 'sad', brow: 0.4, tears: 1 }); lookAtP(m, new V3(8, 4, 0), 0.5);
  frame(x, m.root.position, 0.3, 'close', { d: 1.15, ang: -0.4, ly: 3.4 }); });
// 113.56 "E o meu avô respondeu:" — grandpa in the doorway, warm smile, answering
at(113.56, 'respondeu', x => { const s = scn(x, 'bedNight'); x.S.bedDoor(0.9); x.S.doorLight.intensity = 90; x.S.doorLight.target.position.set(3.0, 4.2, 1.0); const a = put(x, 'avo', s, 3.0, 1.0, 1.3);
  talk(a, x.t, seg(x.L, 0.6, 0.8)); a.head.rotation.x += 0.1 * Math.sin(x.L * 5) * sm(seg(x.L, 0.5, 0.8)); a.head.rotation.z += 0.08 * sm(seg(x.L, 0.1, 0.5)); a.setFace({ eyes: 'happy', mouth: 'smile', mustache: '#f0f0f0', wrinkles: true }); frame(x, a.root.position, 1.3, 'close', { d: 1.0, ang: -0.55 }); });
// 114.91 "Tempo não se conta. Tempo se dá." — the hug again, now in colour, hearts; the camera rises away on "dá"
at(114.91, 'tempo', x => { const s = scn(x, 'bedNight'); x.S.bedDoor(0.9); x.S.doorLight.intensity = 90; x.S.doorLight.target.position.set(0.7, 3.6, -0.2); x.bloom.strength = 0.35;
  const { c, m } = hug(x, s, 1); c.setFace({ eyes: 'closed', mouth: 'smile', blush: 0.5 }); m.setFace({ lashes: true, eyes: 'closed', mouth: 'smile', blush: 0.5 }); m.setWatch('100 ANOS', '#ffd040'); hearts(x, s, new V3(0.75, 5.4, -0.2), 1);
  const k = eio(x.u); cam(x, [mix(0.9, 1.4, k), mix(4.4, 5.8, k), 6.3], [0.72, mix(3.7, 3.4, k), -0.2], mix(52, 62, k)); x.out.focus = 6.5; });

export const SHOTS = shots;
export const DURATION = 117.1;
export const RED = new Set([6, 8, 13, 32, 36, 37, 41, 51, 63, 64, 86, 101, 112, 127, 131, 143, 151, 161, 169, 173, 177, 180, 188, 211, 224, 242, 262, 274, 277, 289, 300, 305, 315, 320, 325, 331, 341, 350, 353, 371]);
