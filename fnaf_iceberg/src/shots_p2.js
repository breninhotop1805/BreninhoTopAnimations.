
// ================================ PART 2: CAMADA 2 — ABAIXO D'ÁGUA ================================
// masks for the FNAF 4 bullies: real copies of the animatronic heads, worn over the kids' heads
const MASKS = {}; const MASKED = [];
function wearMask(x, c, n, off = 0) { if (!MASKS[c.name + n]) { const h = x.C[n].head.clone(true); h.rotation.set(0, 0, 0); h.traverse(o => { if (o.userData.endo) o.visible = false; }); MASKS[c.name + n] = h; }
  const m = MASKS[c.name + n]; c.head.add(m); m.position.set(0, off * 0.12, off * 0.35); m.rotation.set(-0.5 * off, 0, 0); m.scale.setScalar(1.1); c.headMesh.visible = off > 0.6; c.hat.visible = off > 0.6; MASKED.push([c, m]); return m; }
function unmask() { while (MASKED.length) { const [c, m] = MASKED.pop(); m.removeFromParent(); c.headMesh.visible = true; c.hat.visible = true; } }
const ICE = (() => { const g = new THREE.Group(); const cone = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 10), new THREE.MeshStandardMaterial({ color: '#c88a3a', roughness: 0.8 })); cone.rotation.x = Math.PI; g.add(cone);
  const sc = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), new THREE.MeshStandardMaterial({ color: '#ff9ac8', roughness: 0.5 })); sc.position.y = 0.12; g.add(sc); return g; })();
const TEARM = new THREE.MeshBasicMaterial({ color: '#8ad0ff', toneMapped: false, transparent: true, opacity: 0.85 });
const TEARS = Array.from({ length: 2 }, () => new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), TEARM));
EXTRA.push(ICE, ...TEARS);
const _cleanup1 = cleanup;
cleanup = function (x) { _cleanup1(x); unmask(); x.S.giftLid.rotation.x = 0; x.C.gWilliam.ghostMat.color.set('#ff6a5a'); KEY.color.set('#fff2e0'); x.S.iceBubbles.forEach(b => b.scale.setScalar(1)); };
function tears(x, c, k) { TEARS.forEach((d, i) => { c.head.add(d); const l = 0.4 + 3.2 * k; d.position.set((i ? 1.9 : -1.9) * U16, (3.4 - l / 2) * U16, 4.66 * U16); d.scale.set(0.45 * U16, l * U16, 0.2 * U16); }); }
function diner(x, dim = 1) { const s = x.S.diner; x.out.scene = s; x.post.vig.value = 0.85; x.post.tint.value.set(1.06, 1.0, 0.9); x.S.dinerLamps.forEach(l => l.intensity *= dim); x.S.dinerSpot.intensity *= dim; return s; }
function partyR(x) { const s = x.S.party; x.out.scene = s; x.post.vig.value = 0.9; return s; }
function bedroom(x, lamp = 1) { const s = x.S.bedroom; x.out.scene = s; x.S.bedLamp.intensity = 9 * lamp; x.post.vig.value = 0.95; return s; }
function fright(x, flick = 0.5) { const s = x.S.fright; x.out.scene = s; x.S.frLamps.forEach((l, i) => l.intensity = 8 * mix(1, flicker(x.t, i * 3), flick)); x.post.tint.value.set(0.92, 1.05, 0.92); x.post.vig.value = 0.9; return s; }
function tankAt(x, s, p, lv, glow = 1) { const t = x.FX.tank; s.add(t); t.position.set(...p); t.userData.liq.scale.y = Math.max(0.02, 1.1 * lv); t.userData.liq.position.y = 0.2 + 0.55 * lv; t.userData.light.intensity = 6 * glow; t.userData.liqM.opacity = 0.85; t.userData.bits.forEach(b => b.visible = false); return t; }
function kneel(c, k = 1) { const s = c.root.scale.x; c.root.position.y -= 0.42 * k * s; c.legR.piv.rotation.x = -1.4 * k; c.legL.piv.rotation.x = 0.1 * k; c.torso.rotation.x = 0.15 * k; }

// "Camada 2, abaixo d'água," — through the surface, down to the second layer
at(156.3333, 'dive2', x => { dive(x, 1, ICE_DEPTHS[0], ICE_DEPTHS[1]); });
// "agora começa de verdade" — FNAF 4 bedroom, the closet doors creak open
at(161.42, 'for_real', x => {
  const s = bedroom(x, 0.45); const L = x.L; x.S.closetDoors.forEach((d, i) => d.rotation.y = (i ? -1 : 1) * 0.5 * eo(seg(L, 0.2, 1.2)));
  camMove(x, [1.6, 1.4, 2.6], [-0.6, 1.2, -2.6], [1.1, 1.35, 1.8], [-0.6, 1.25, -2.6], eo, 42); hand(x, 0.6); x.post.tint.value.set(0.85, 0.9, 1.1);
});
// "No FNAF 4, você joga como uma criança terrorizada,"
at(162.82, 'fnaf4', x => {
  const s = bedroom(x, 0.6); const L = x.L; const c = put(x, 'cchild', s, -2.55, 0.62, -0.9, 0.35); c.legR.piv.rotation.x = -1.5; c.legL.piv.rotation.x = -1.5; c.root.position.y = 0.62 - 0.56 * 0.76 + 0.09;
  c.head.rotation.x = 0.25; c.head.rotation.y = 0.35 * Math.sin(x.t * 2.2); c.armR.piv.rotation.x = -1.2; c.armL.piv.rotation.x = -1.2; c.torso.rotation.z = 0.02 * Math.sin(x.t * 18);
  tears(x, c, 0.5 + 0.5 * seg(L, 0, 3));
  camMove(x, [-0.6, 1.35, 2.4], [-2.5, 0.95, -0.7], [-1.3, 1.2, 1.5], [-2.5, 1.0, -0.7], eio, 40); fillOn(x, c, 1.4, 1.2);
});
// "perseguida por pesadelos" — the band, twisted in the dark
at(166.24, 'nightmares', x => {
  const s = voidS(x, 10, 40, '#ff2a1a', 0.4); const L = x.L; s.fog = null;
  ['bonnie', 'freddy', 'chica', 'foxy'].forEach((n, i) => { const c = put(x, n, s, (i - 1.5) * 1.25, 0, -0.3 * Math.abs(i - 1.5), -(i - 1.5) * 0.15); c.idle(x.t, 1, i); twitch(c, x.t + i, 1.2); lookAtCam(x, c, 0.6); });
  x.C.freddy.setEyeGlow('#ff3020', 1); rimOn(x, s, [0, 3.8, -3], [0, 1.5, 0], 60, '#ff2a1a');
  camMove(x, [0, 1.2, 7.0], [0, 1.6, 0], [0, 1.4, 5.4], [0, 1.7, 0], eio, 36); x.post.tint.value.set(1.1, 0.8, 0.85); x.post.chroma.value = 0.4;
});
// "No final, o irmão mais velho e os amigos dele usando máscaras"
at(167.68, 'bullies', x => {
  const [s, f] = (() => { const s = diner(x, 0.8); const f = put(x, 'fredbear', s, 0, 0.77, -4.4, 0); f.idle(x.t, 1); return [s, f]; })(); const L = x.L;
  const m = put(x, 'michael', s, 0, 0, -1.6, 0), a = put(x, 'kid3', s, -0.85, 0, -1.4, 0.3, 1.2), b = put(x, 'kid4', s, 0.85, 0, -1.4, -0.3, 1.2);
  wearMask(x, m, 'foxy'); wearMask(x, a, 'freddy'); wearMask(x, b, 'bonnie');
  [m, a, b].forEach((k, i) => { k.idle(x.t, 1, i); k.root.position.y = Math.max(0, Math.sin(x.t * 6 + i * 2)) * 0.12; k.head.rotation.z = 0.15 * Math.sin(x.t * 4 + i); aim(k, i ? 'L' : 'R', rootPt(k, i === 2 ? -0.5 : 0.5, 1.8, 0.4), 0.5 + 0.3 * Math.sin(x.t * 6 + i)); });
  camMove(x, [0.6, 1.25, 2.2], [0, 1.2, -1.6], [0.3, 1.2, 1.2], [0, 1.25, -1.6], eo, 42); fillOn(x, m, 1.6, 1.6);
});
// "levantam o menino até a boca do Freddy" — on the stage, they lift him to Fredbear's mouth
function biteSetup(x, lift, bend) {
  const s = diner(x, 0.85); const f = put(x, 'fredbear', s, 0, 0.77, -4.6, 0); f.idle(x.t, 0.5); f.torso.rotation.x = 0.38 * bend; f.head.rotation.x = 0.25 * bend;
  const m = put(x, 'michael', s, -0.42, 0.77, -3.15, 0.6), a = put(x, 'kid3', s, 0.42, 0.77, -3.2, -0.6, 1.2); wearMask(x, m, 'foxy'); wearMask(x, a, 'freddy');
  const c = put(x, 'cchild', s, 0, 0, 0, 0); c.root.rotation.set(-Math.PI / 2, 0, 0); c.root.position.set(0, mix(1.55, 2.25, lift), mix(-1.7, -2.0, lift));
  c.armR.piv.rotation.z = -0.4 + 0.3 * Math.sin(x.t * 9); c.armL.piv.rotation.z = 0.4 - 0.3 * Math.sin(x.t * 9 + 1); c.legR.piv.rotation.x = 0.3 * Math.sin(x.t * 11); c.legL.piv.rotation.x = -0.3 * Math.sin(x.t * 11);
  aim(m, 'R', tp(c, 'torso', [0, 9, 0]), 1); aim(m, 'L', tp(c, 'legL', [0, -4, 0]), 1); aim(a, 'L', tp(c, 'torso', [0, 3, 0]), 1); aim(a, 'R', tp(c, 'legR', [0, -6, 0]), 1);
  return [s, f, c, m, a];
}
at(171.50, 'lift', x => {
  const L = x.L; const [s, f, c, m] = biteSetup(x, eo(seg(L, 0, 1.6)), eo(seg(L, 0.6, 2.0)));
  camMove(x, [3.6, 2.0, -2.6], [0, 2.0, -3.7], [3.0, 2.15, -2.9], [0, 2.2, -3.8], eo, 40); fillOn(x, f, 2, 2.4);
});
// "pra ele dar um beijo"
at(173.70, 'kiss', x => {
  const L = x.L; const [s, f, c, m] = biteSetup(x, 1, 1); m.head.rotation.z = 0.2 * Math.sin(x.t * 9);
  const hp = tp(f, 'head', [0, 3, 4]); camMove(x, [hp.x + 2.6, hp.y - 0.1, hp.z + 0.9], [hp.x, hp.y - 0.2, hp.z + 0.6], [hp.x + 2.1, hp.y, hp.z + 0.8], [hp.x, hp.y - 0.2, hp.z + 0.6], eo, 40); fillOn(x, f, 1.5, 2.6);
});
// "A boca fecha," — the head slams down; red; black
at(174.86, 'crunch', x => {
  const L = x.L; const k = ei(seg(L, 0.12, 0.3)); const [s, f, c] = biteSetup(x, 1, 1); f.head.rotation.x += 0.45 * k; f.torso.rotation.x += 0.12 * k;
  const hp = tp(f, 'head', [0, 3, 4]); cam(x, [hp.x + 2.1, hp.y, hp.z + 0.8], [hp.x, hp.y - 0.2, hp.z + 0.6], 40); if (L > 0.3) shake(x, 1.2 * (1 - seg(L, 0.3, 1.0)));
  if (L > 0.3) { x.post.tint.value.set(1.5, 0.4, 0.4); x.post.flash.value = L < 0.4 ? 0.35 : 0; } x.post.fade.value = sm(seg(L, 0.9, 1.5)); x.post.chroma.value = 0.8 * k;
});
// "ele está morto" — on the floor, alone under one lamp
at(176.38, 'dead', x => {
  const s = voidS(x, 26, 0, '#ffffff', 0.4); const L = x.L; const c = lie(x, 'cchild', s, 0, 0, 0.2, 0.76); c.head.rotation.y = 0.6;
  camMove(x, [0.3, 2.6, 1.6], [0, 0.1, -0.2], [0.15, 2.2, 1.2], [0, 0.1, -0.2], eo, 40); x.post.tint.value.set(0.85, 0.85, 0.95); x.post.fade.value = 1 - seg(L, 0, 0.35);
});
// "Esse menino é o filho mais novo do William Afton"
at(177.40, 'youngest', x => {
  const s = voidS(x, 34, 12, '#9ab8ff', 2); const L = x.L; s.fog = null; const w = put(x, 'william', s, 0, 0, -0.9, 0); w.idle(x.t, 0.5); w.head.rotation.x = 0.55;
  const c = lie(x, 'cchild', s, 0, 0.3, 0.2, 0.76); c.head.rotation.y = 0.6;
  const a = mix(-0.5, 0.2, eio(x.u)); cam(x, [Math.sin(a) * 3.6, 1.6, 0.2 + Math.cos(a) * 3.6], [0, 0.8, -0.3], 38);
});
// "e o irmão que fez a brincadeira é o filho mais velho, o Michael" — the Foxy mask comes off
at(179.94, 'michael', x => {
  const s = voidS(x, 36, 14, '#ff6a3a', 2); const L = x.L; const m = put(x, 'michael', s, 0, 0, 0, 0); m.idle(x.t, 0.6);
  const off = eo(seg(L, 1.2, 2.4)); wearMask(x, m, 'foxy', off); aim(m, 'R', rootPt(m, -0.1, 1.85 + 0.15 * off, 0.45 + 0.1 * off), 1 - 0.5 * seg(L, 2.4, 3.2)); lookAtCam(x, m, off);
  const mk = MASKED[MASKED.length - 1][1]; if (off > 0.6) { mk.removeFromParent(); m.handR.add(mk); mk.position.set(0, -0.12, 0.15); mk.rotation.set(-1.2, 0, 0); mk.scale.setScalar(1.1 / 0.92); }
  const hp = tp(m, 'head', [0, 4, 4]); camMove(x, [0.5, 1.4, 3.8], [0, 1.4, 0], [hp.x + 0.2, hp.y - 0.05, hp.z + 1.6], hp.toArray(), eio, 36);
});
// "É aqui que a família Afton começa a apodrecer" — the family portrait loses its colour
at(183.34, 'rot', x => {
  const s = voidS(x, 40, 10, '#ffd0a0', 3); const L = x.L; s.fog = null; const k = sm(seg(L, 0.4, 2.8));
  const w = put(x, 'william', s, 0, 0, -0.4, 0), m = put(x, 'michael', s, -0.95, 0, 0, 0.2), e = put(x, 'elizabeth', s, 1.0, 0, 0.1, -0.2), c = put(x, 'cchild', s, 0.4, 0, 0.6, -0.1);
  [w, m, e, c].forEach((p, i) => { p.idle(x.t, 1, i); p.head.rotation.x = 0.35 * k; });
  x.S.voidSpot.intensity = 40 * (1 - 0.6 * k) * (k > 0.5 ? flicker(x.t, 5) : 1); x.post.tint.value.set(mix(1, 1.05, k), mix(1, 0.75, k), mix(1, 0.7, k));
  camMove(x, [0, 1.6, 3.6], [0, 1.2, 0], [0, 1.9, 5.2], [0, 1.2, 0], eio, 38);
});
// "O William tinha uma filha, a Elizabeth,"
at(186.30, 'daughter', x => {
  const s = voidS(x, 44, 10, '#ffb0d0', 3); const L = x.L; s.fog = null; const w = put(x, 'william', s, -0.45, 0, 0, 0.25), e = put(x, 'elizabeth', s, 0.45, 0, 0.1, -0.3); w.idle(x.t, 1); e.idle(x.t, 1, 2);
  const hand = rootPt(e, -0.55, 0.62, 0.15); aim(w, 'L', hand, 0.9); aim(e, 'R', hand, 0.9); lookAtCam(x, e, 0.8); w.head.rotation.y = -0.5; w.head.rotation.x = 0.3;
  camMove(x, [0.6, 1.3, 3.4], [0, 1.15, 0], [0.2, 1.25, 2.7], [0, 1.15, 0], eo, 38);
});
// "ele avisou pra ela nunca chegar perto da"
at(189.28, 'warned', x => {
  const s = voidS(x, 40, 10, '#ffb0d0', 3); const L = x.L; s.fog = null; const w = put(x, 'william', s, -0.5, 0, 0, 0.5), e = put(x, 'elizabeth', s, 0.5, 0, 0.2, -0.6); w.idle(x.t, 1); e.idle(x.t, 1, 2);
  aim(w, 'L', rootPt(w, 0.35, 1.55 + 0.08 * Math.sin(x.t * 14), 0.6), eo(seg(L, 0.1, 0.5))); w.head.rotation.x = 0.35; e.head.rotation.x = -0.25; e.head.rotation.y = 0.25 * Math.sin(x.t * 1.3);
  const a = mix(0.9, 0.5, eio(x.u)); cam(x, [Math.sin(a) * 3.2, 1.45, 0.1 + Math.cos(a) * 3.2], [0, 1.3, 0.1], 38);
});
// "circus baby" — Baby under the party lights
at(191.24, 'baby', x => {
  const s = partyR(x); const L = x.L; const b = put(x, 'baby', s, 0, 0, -3.0, 0); b.idle(x.t, 1); b.setEyes('#5aff6a'); lookAtCam(x, b, 0.8);
  camMove(x, [0.4, 1.4, 1.6], [0, 2.0, -3.0], [0.2, 1.6, 0.6], [0, 2.2, -3.0], eo, 42); fillOn(x, b, 2, 2.6); if (L < 0.06) x.post.flash.value = 0.15;
});
// "Mas ela chegou" — Elizabeth walks up to her
at(191.84, 'but_she', x => {
  const s = partyR(x); const L = x.L; const b = put(x, 'baby', s, 0, 0, -3.0, 0); b.idle(x.t, 1); b.setEyes('#5aff6a'); b.head.rotation.x = 0.3;
  const e = put(x, 'elizabeth', s, 0, 0, 0, Math.PI); walkTo(e, [0.4, 0, 0.6], [0.1, 0, -1.7], eo(seg(L, 0, 1.2)), 0.5);
  camMove(x, [1.0, 1.0, 2.6], [0, 1.6, -2.4], [0.7, 1.1, 1.9], [0, 1.7, -2.6], eo, 42); fillOn(x, b, 1.5, 2.4);
});
// "A baby ofereceu um sorvete" — an ice cream held out in her hand
function babyScene(x, opts = {}) { const s = partyR(x); const b = put(x, 'baby', s, 0, 0, -3.0, 0); b.idle(x.t, 1); b.setEyes('#5aff6a'); b.head.rotation.x = 0.35;
  const e = put(x, 'elizabeth', s, 0.05, 0, -1.75 + (opts.pull || 0) * -0.7, Math.PI); e.idle(x.t, 1); e.head.rotation.x = -0.3; return [s, b, e]; }
at(193.06, 'icecream', x => {
  const L = x.L; const [s, b, e] = babyScene(x); const k = eo(seg(L, 0.1, 0.8)); aim(b, 'R', rootPt(b, -0.25, 1.15, 0.75), k); b.root.updateMatrixWorld(true);
  s.add(ICE); ICE.position.copy(b.handR.getWorldPosition(new V3())).add(new V3(0, 0.12, 0)); ICE.rotation.set(0, 0, 0); ICE.scale.setScalar(1.2);
  aim(e, 'R', ICE.position, eo(seg(L, 1.0, 1.6)) * 0.7);
  camMove(x, [2.9, 1.5, -1.0], [0, 1.3, -2.4], [2.5, 1.45, -1.3], [0, 1.3, -2.4], eo, 40); fillOn(x, b, 1.8, 2.2);
});
// "e puxou a menina pra dentro" — the belly opens, the claw takes her
at(195.00, 'pulled', x => {
  const L = x.L; const open = eo(seg(L, 0, 0.4)), ext = eo(seg(L, 0.35, 0.75)), grip = eo(seg(L, 0.75, 0.9)), back_ = ei(seg(L, 1.0, 1.4));
  const [s, b, e] = babyScene(x); b.setClaw(open, ext * (1 - back_), grip); e.root.position.z = mix(-1.75, -2.6, back_); e.root.position.y = 0.15 * back_; e.root.visible = L < 1.42;
  e.armR.piv.rotation.x = -1.2 * grip; e.armL.piv.rotation.x = -1.2 * grip; if (L > 1.4) { b.setClaw(1 - eo(seg(L, 1.4, 1.7)), 0, 0); }
  camMove(x, [2.9, 1.45, -1.1], [0, 1.25, -2.5], [2.6, 1.4, -1.4], [0, 1.25, -2.5], eo, 40); fillOn(x, b, 1.8, 2.2); if (L > 1.4 && L < 1.5) { x.post.flash.value = 0.25; shake(x, 0.4); }
});
// "Agora repara no detalhe que dá calafrio" — Baby's face, cold light
at(196.84, 'detail', x => {
  const s = partyR(x); const L = x.L; const b = put(x, 'baby', s, 0, 0, -3.0, 0); b.idle(x.t, 0.5); b.setEyes('#5aff6a'); lookAtCam(x, b, 1);
  const hp = tp(b, 'head', [0, 4, 4]); camMove(x, [hp.x + 0.5, hp.y - 0.2, hp.z + 2.3], hp.toArray(), [hp.x + 0.15, hp.y - 0.05, hp.z + 1.3], hp.toArray(), eio, 34); fillOn(x, b, 1.2, 2.6);
  x.post.tint.value.set(0.85, 0.95, 1.15);
});
// "Ela foi projetada pelo próprio William"
at(199.08, 'designed', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 0.85; const L = x.L; const b = put(x, 'baby', s, 1.4, 0, -2.6, -0.5); b.setEyes('#2a2a2a'); b.head.rotation.x = 0.4; droop(b, 0.4);
  const w = put(x, 'william', s, 0.2, 0, -1.6, 2.2); w.idle(x.t, 0.8); aim(w, 'R', tp(b, 'torso', [0, 6, 3]), 0.8 + 0.1 * Math.sin(x.t * 8)); w.head.rotation.x = 0.2;
  camMove(x, [2.6, 1.7, 0.4], [0.7, 1.5, -2.2], [2.1, 1.65, -0.2], [0.7, 1.5, -2.3], eo, 42); x.S.shopLamp.intensity = 14; fillOn(x, w, 1.5, 1.8);
});
// "pra atrair e capturar crianças" — the claw reaches out for a kid
at(201.74, 'lure', x => {
  const s = partyR(x); const L = x.L; const b = put(x, 'baby', s, 0, 0, -3.0, 0.15); b.idle(x.t, 1); b.setEyes('#5aff6a'); b.head.rotation.x = 0.3;
  b.setClaw(eo(seg(L, 0, 0.3)), 0.6 + 0.2 * Math.sin(x.t * 3), 0.2); const k = put(x, 'kid1', s, 0.4, 0, -1.4, Math.PI + 0.3); k.idle(x.t, 1); k.head.rotation.x = -0.35;
  const a = mix(0.9, 0.6, eio(x.u)); cam(x, [Math.sin(a) * 3.0, 1.2, -2.4 + Math.cos(a) * 3.0], [0, 1.2, -2.4], 40); x.post.tint.value.set(0.9, 1.0, 1.05);
});
// "O monstro que ele criou matou a filha dele" — William on his knees in front of her
at(203.36, 'killed', x => {
  const s = voidS(x, 18, 40, '#ff2a1a', 0.6); const L = x.L; s.fog = null; const b = put(x, 'baby', s, 0, 0, -1.6, 0); b.idle(x.t, 0.4); b.setEyes('#5aff6a'); b.head.rotation.x = 0.35;
  const w = put(x, 'william', s, 0, 0, 0.4, Math.PI); kneel(w, eo(seg(L, 0.2, 0.8))); w.head.rotation.x = 0.5; aim(w, 'R', rootPt(w, 0.1, 1.55, 0.35), eo(seg(L, 0.6, 1.2)));
  rimOn(x, s, [0, 3.8, -3.2], [0, 1.6, -1.6], 70, '#ff2a1a'); camMove(x, [3.4, 1.3, 1.4], [0, 1.4, -0.6], [2.8, 1.35, 1.0], [0, 1.5, -0.6], eo, 38); fillOn(x, w, 1.0, 1.4);
});
// "As fantasias com trava de mola podiam ser usadas por pessoas,"
at(205.90, 'springlocks', x => {
  const s = diner(x, 0.9); const L = x.L; const sb = put(x, 'springbonnie', s, -0.6, 0, -2.2, 0.3); sb.idle(x.t, 0.4); const w = put(x, 'william', s, 0.6, 0, -1.9, -0.4); w.idle(x.t, 1); lookAtCam(x, w, 0.6);
  aim(w, 'R', tp(sb, 'torso', [0, 8, 2]), eo(seg(L, 0.6, 1.2))); x.setXray(sb, 0.8 * sm(seg(L, 1.6, 2.4)), 0.4, '#ffd040');
  camMove(x, [0.4, 1.6, 2.0], [0, 1.6, -2.1], [0.2, 1.6, 1.0], [0, 1.65, -2.1], eo, 40); fillOn(x, sb, 1.5, 2.2);
});
// "mas eram instáveis" — the locks shiver
at(209.58, 'unstable', x => {
  const s = voidS(x, 30, 20, '#ffd040', 2); const L = x.L; const sb = put(x, 'springbonnie', s, 0, 0, 0, 0); sb.idle(x.t, 0.4); x.setXray(sb, 0.85, 0.5 + 0.5 * Math.sin(x.t * 20), '#ffd040');
  sb.root.position.x = 0.012 * Math.sin(x.t * 70); const tp_ = tp(sb, 'torso', [0, 7, 0]); camMove(x, [tp_.x + 0.8, tp_.y + 0.2, tp_.z + 3.0], tp_.toArray(), [tp_.x + 0.4, tp_.y + 0.2, tp_.z + 2.3], tp_.toArray(), eo, 38);
});
// "Era um pouco de umidade, um movimento brusco"
at(210.82, 'humidity', x => {
  const s = voidS(x, 30, 16, '#6ab0ff', 2); const L = x.L; const sb = put(x, 'springbonnie', s, 0, 0, 0, 0); sb.idle(x.t, 0.4); x.setXray(sb, 0.5, 0.3, '#ffd040'); rain(x, s, 0, 0); RAIN.group.scale.set(1, 1, 1);
  const j = eo(seg(L, 2.0, 2.15)) * (1 - seg(L, 2.15, 2.6)); sb.torso.rotation.z = 0.35 * j; sb.head.rotation.z = -0.3 * j; sb.armR.piv.rotation.z = -0.6 * j; if (L > 2.0 && L < 2.4) shake(x, 0.4);
  const a = mix(-0.5, 0.3, eio(x.u)); cam(x, [Math.sin(a) * 3.4, 1.7, Math.cos(a) * 3.4], [0, 1.5, 0], 38); x.post.tint.value.set(0.85, 0.95, 1.1);
});
// "e as travas soltavam, perfurando quem estivesse dentro"
at(213.66, 'snap', x => {
  const s = voidS(x, 26, 40, '#ff2a1a', 1); const L = x.L; const sb = put(x, 'springbonnie', s, 0, 0, 0, 0); x.setXray(sb, 0.85, Math.max(0, Math.sin(x.t * 25)), '#ff3a2a');
  const hits = [0.2, 0.5, 0.75, 1.1, 1.5]; let h = 0; hits.forEach(a => { const d = L - a; if (d > 0 && d < 0.15) h = 1 - d / 0.15; });
  sb.torso.rotation.x = 0.15 * h; sb.head.rotation.x = -0.3 * h; sb.armR.piv.rotation.z = -0.4 * h; sb.armL.piv.rotation.z = 0.4 * h; if (h > 0.5) { shake(x, 0.5 * h); x.post.flash.value = 0.1 * h; }
  sparksAt(x, s, tp(sb, 'torso', [0, 7, 3]), (L % 0.5) * 1.6); drips(x, sb, seg(L, 0.6, 2.6), [[-2.0, 3.4], [2.0, 3.4]], 3.2);
  const hp = tp(sb, 'head', [0, 0, 4]); camMove(x, [0.5, 1.8, 3.2], [0, 1.6, 0], [0.25, hp.y - 0.2, 2.2], [0, hp.y - 0.4, 0], eo, 38); x.post.tint.value.set(1.15, 0.85, 0.85);
});
// "William foi se esconder dos espíritos das crianças que ele matou"
at(216.64, 'ghosts', x => {
  const s = hall(x, 0.7, '#c0d0ff'); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); walkTo(w, [0.0, 0, -3.0], [0.1, 0, -0.6], eo(seg(L, 0, 2.6)), 0.9); w.walk(-L * 2.4, 1); lookAtCam(x, w, 0); w.head.rotation.y = 0.3 * Math.sin(x.t * 3);
  for (let i = 0; i < 5; i++) { const gz = mix(-8.0, -4.2, eo(seg(L, 0, 2.6))) - Math.abs(i - 2) * 0.5; ghostKid(x, i, s, [(i - 2) * 0.5, 0.15 + 0.1 * Math.sin(x.t * 2 + i), gz], 0, 0.6); }
  camMove(x, [0.5, 1.5, 3.2], [0, 1.4, -3], [0.3, 1.6, 2.0], [0, 1.4, -3], eo, 40); fillOn(x, w, 1.5, 1.8);
});
// "dentro da fantasia." — he slips into the Spring Bonnie suit; the head turns
at(219.42, 'into_suit', x => {
  const s = voidS(x, 28, 18, '#9ad8ff', 1.5); const L = x.L; const sb = put(x, 'springbonnie', s, 0, 0, 0, 0); sb.idle(x.t, 0.4);
  const w = put(x, 'william', s, 0, 0, 0, 0); walkTo(w, [-1.2, 0, 0.6], [0, 0, 0], eo(seg(L, 0, 1.0)), 0.8); w.root.rotation.y = 1.3; w.root.visible = L < 1.0;
  if (L > 1.0) { sb.head.rotation.y = 0.35 * eo(seg(L, 1.3, 1.8)); lookAtCam(x, sb, eo(seg(L, 1.3, 1.8))); }
  camMove(x, [0.8, 1.5, 4.2], [0, 1.5, 0], [0.4, 1.6, 3.4], [0, 1.6, 0], eo, 38); fillOn(x, sb, 1.2, 2.2);
});
// "E as travas soltaram," — the ghosts watch while the locks fire
at(221.62, 'locks_fire', x => {
  const s = voidS(x, 22, 46, '#ff2a1a', 1); const L = x.L; s.fog = null; const sb = put(x, 'springbonnie', s, 0, 0, 0, 0); x.setXray(sb, 0.6, Math.max(0, Math.sin(x.t * 30)), '#ff3a2a');
  const j = Math.sin(x.t * 40) * (1 - seg(L, 1.2, 1.7)); sb.torso.rotation.z = 0.12 * j; sb.head.rotation.x = -0.25 + 0.15 * j; aim(sb, 'R', rootPt(sb, -0.5, 2.2, 0.4), 0.8); aim(sb, 'L', rootPt(sb, 0.6, 1.9, 0.5), 0.7);
  for (let i = 0; i < 5; i++) ghostKid(x, i, s, [(i - 2) * 1.0 + (i < 2 ? -0.6 : i > 2 ? 0.6 : 0), 0, i === 2 ? -1.4 : 0.9 - Math.abs(i - 2) * 0.4], i === 2 ? 0 : Math.PI + (i < 2 ? -0.6 : 0.6), 0.5);
  if (L % 0.3 < 0.05) x.post.flash.value = 0.12; cam(x, [0.3, 2.1, 5.2], [0, 1.4, 0], 40); shake(x, 0.25);
});
// "ele morreu do jeito mais lento e doloroso possível"
at(223.32, 'died_slow', x => {
  const s = voidS(x, 16, 30, '#ff2a1a', 0.5); const L = x.L; s.fog = null; const sb = put(x, 'springbonnie', s, 0, 0, 0, 0); const k = eio(seg(L, 0, 1.8));
  sb.root.position.y = -(sb.hipY - 2 * U16) * sb.root.scale.x * k; sb.legR.piv.rotation.x = -1.5 * k; sb.legL.piv.rotation.x = -1.5 * k; sb.head.rotation.x = 0.5 * k; sb.head.rotation.z = 0.22 * k; sb.armR.piv.rotation.z = -0.3 * k; sb.armL.piv.rotation.z = 0.3 * k;
  drips(x, sb, 0.5 + 0.5 * seg(L, 0, 2.5), [[-2.0, 3.4], [2.0, 3.4], [-0.6, 1.0], [0.6, 1.0]], 3.6);
  for (let i = 0; i < 5; i++) ghostKid(x, i, s, [(i - 2) * 0.9, 0.2 * seg(L, 1, 2.6), 1.5 + Math.abs(i - 2) * 0.3], Math.PI, 0.5 * (1 - sm(seg(L, 1.2, 2.4))));
  camMove(x, [0.6, 2.2, 3.4], [0, 0.9, 0], [0.3, 1.6, 2.4], [0, 0.7, 0], eio, 38); x.post.tint.value.set(1.1, 0.85, 0.85);
});
// "Só que ele não ficou morto" — the slumped suit opens its eyes
at(225.96, 'not_dead', x => {
  const s = voidS(x, 8, 20, '#7aff5a', 0.4); const L = x.L; const c = put(x, 'spring', s, 0, 0, 0, 0); slump(c, 1); twitch(c, x.t, sm(seg(L, 1.0, 1.6)));
  c.head.rotation.x = mix(0.5, 0.15, eo(seg(L, 1.1, 1.6))); const hp = tp(c, 'head', [0, 4, 4]);
  camMove(x, [hp.x + 0.4, hp.y + 0.1, hp.z + 1.9], hp.toArray(), [hp.x + 0.15, hp.y, hp.z + 1.2], hp.toArray(), eio, 34); keyOn(x, s, [0.8, 3, 2.5], hp.toArray(), 6 + 10 * sm(seg(L, 1.1, 1.4)), 0.35);
  if (L > 1.1 && L < 1.2) x.post.flash.value = 0.15;
});
// "30 anos depois, ele voltou como Springtrap"
at(227.68, 'springtrap', x => {
  const s = fright(x, 0.6); const L = x.L; const c = put(x, 'spring', s, 0, 0, -6.0, 0); const k = eo(seg(L, 0.0, 1.5));
  c.root.position.y = -0.25 * (1 - k); c.torso.rotation.x = 1.1 * (1 - k); c.legR.piv.rotation.x = -1.4 * (1 - k); c.legL.piv.rotation.x = -1.2 * (1 - k); c.head.rotation.x = 0.5 * (1 - k); twitch(c, x.t, 1.2);
  if (L > 1.5) { walkTo(c, [0, 0, -6.0], [0, 0, -4.8], eo(seg(L, 1.5, 2.84)), 1.1); lookAtCam(x, c, 0.7); }
  camMove(x, [0.6, 0.7, -3.0], [0, 1.0, -6], [0.3, 1.4, -2.6], [0, 1.9, -5.4], eio, 44); fillOn(x, c, 2, 1.8);
});
// "A carne dele ainda tá lá dentro, presa ao metal" — X-ray: the body inside the suit
at(230.52, 'flesh', x => {
  const s = voidS(x, 30, 30, '#ff3a2a', 1); const L = x.L; const c = put(x, 'spring', s, 0, 0, 0, 0); c.idle(x.t, 0.5); x.setXray(c, 0.75 * sm(seg(L, 0.2, 0.9)), 0.4, '#ff4040');
  const g = put(x, 'gWilliam', s, 0, 0.12, 0, 0); g.idle(x.t, 0.5); g.ghostMat.opacity = 0.45 * sm(seg(L, 0.4, 1.0));
  const a = mix(0.6, -0.3, eio(x.u)); cam(x, [Math.sin(a) * 3.6, 1.7, Math.cos(a) * 3.6], [0, 1.6, 0], 38); x.post.tint.value.set(1.12, 0.88, 0.88);
});
// "Num dos minijogos do FNAF 3, tem uma criança sozinha na chuva, do lado de fora da pizzaria" — 8-bit look
at(233.16, 'rain_mini', x => {
  const s = facade(x, 0.4); const L = x.L; x.post.pix.value = PIX(x); const k = put(x, 'kid0', s, 0.4, 0, 2.2, 0.15); k.idle(x.t, 1); k.head.rotation.x = 0.4;
  k.armR.piv.rotation.x = -1.2; k.armL.piv.rotation.x = -1.2; k.armR.piv.rotation.z = 0.5; k.armL.piv.rotation.z = -0.5; k.torso.rotation.x = 0.1 + 0.03 * Math.sin(x.t * 9);
  cam(x, [mix(0.4, 0.2, x.u), 1.5, mix(6.8, 5.6, eio(x.u))], [0.3, 1.2, 1.0], 40); x.post.vig.value = 0.7; x.post.grain.value = 0; x.S.streetLamp.intensity = 40;
});
at(235.54, 'rain_kid', x => {
  const s = facade(x, 0.4); const L = x.L; const k = put(x, 'kid0', s, 0.4, 0, 2.2, 0.15); k.idle(x.t, 1); k.head.rotation.x = 0.45;
  k.armR.piv.rotation.x = -1.2; k.armL.piv.rotation.x = -1.2; k.armR.piv.rotation.z = 0.5; k.armL.piv.rotation.z = -0.5; k.torso.rotation.x = 0.1 + 0.03 * Math.sin(x.t * 9); tears(x, k, 0.8);
  const hp = tp(k, 'head', [0, 4, 4]); camMove(x, [hp.x + 1.4, hp.y + 0.1, hp.z + 2.6], hp.toArray(), [hp.x + 0.8, hp.y, hp.z + 1.7], hp.toArray(), eio, 36); rain(x, s, 0.4, 3); fillOn(x, k, 1.2, 1.4); x.S.streetLamp.intensity = 40;
});
// "Essa criança era a filha do Henry,"
at(238.80, 'henry_daughter', x => {
  const s = diner(x); const L = x.L; const h = put(x, 'henry', s, -0.4, 0, -1.6, 0.4), c = put(x, 'charlotte', s, 0.4, 0, -1.4, -0.3); h.idle(x.t, 1); c.idle(x.t, 1, 2);
  aim(h, 'L', tp(c, 'head', [0, 9, 0]), 0.8); h.head.rotation.x = 0.35; h.head.rotation.y = -0.4; lookAtCam(x, c, 0.8); c.root.position.y = Math.max(0, Math.sin(x.t * 5)) * 0.06;
  camMove(x, [0.5, 1.3, 1.6], [0, 1.15, -1.5], [0.2, 1.25, 0.8], [0, 1.15, -1.5], eo, 40); fillOn(x, c, 1.4, 1.5);
});
// "o sócio e o melhor amigo do assassino"
at(241.04, 'partner', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 0.85; const L = x.L; const h = put(x, 'henry', s, -0.6, 0, -1.4, 0.35), w = put(x, 'william', s, 0.6, 0, -1.4, -0.35); h.idle(x.t, 1); w.idle(x.t, 1, 2);
  aim(h, 'L', tp(w, 'armR', [0, -1, 0]), 0.8); lookAtCam(x, h, 0.6); w.head.rotation.y = 0.5 * eo(seg(L, 0.8, 1.3)); w.head.rotation.x = 0.1;
  camMove(x, [0.2, 1.6, 1.6], [0, 1.5, -1.4], [0.0, 1.65, 0.9], [0.2, 1.6, -1.4], eo, 40); x.S.shopLamp.intensity = 14; fillOn(x, w, 1.4, 1.8);
});
// "Segundo a lore, ela foi a primeira" — the alley behind the pizzeria, in the rain
at(242.94, 'first', x => {
  const s = x.S.alley; x.out.scene = s; x.post.vig.value = 1.0; const L = x.L; const c = lie(x, 'charlotte', s, 0.4, -4.2, -0.4, 0.76);
  const p = put(x, 'purpleguy', s, 0, 0, 0, Math.PI); walkTo(p, [-0.2, 0, -5.4], [-0.3, 0, -8.6], seg(L, 0, 2.36), 0.9); p.root.rotation.y = Math.PI;
  camMove(x, [0.6, 1.8, -0.8], [0, 0.6, -5], [0.4, 1.6, -1.8], [0, 0.5, -5], eo, 42); rain(x, s, 0, -4); x.post.tint.value.set(0.85, 0.9, 1.05);
});
// "e o espírito dela foi parar dentro da marionete"
at(245.30, 'puppet_soul', x => {
  const s = x.S.prize; x.out.scene = s; x.post.vig.value = 0.9; const L = x.L; const p = put(x, 'puppet', s, -0.6, 0, -1.4, 0.3); p.idle(x.t, 1);
  const k = eio(seg(L, 0.1, 1.6)); const g = put(x, 'gCharlotte', s, mix(1.2, -0.6, k), mix(0.2, 0.6, k), mix(0.4, -1.3, k), -1.0); g.ghostMat.opacity = 0.55 * (1 - seg(L, 1.4, 1.9)); g.idle(x.t, 1);
  if (L > 1.6) { lookAtCam(x, p, eo(seg(L, 1.7, 2.2))); } if (L > 1.55 && L < 1.65) x.post.flash.value = 0.12;
  camMove(x, [1.2, 1.7, 2.4], [-0.2, 1.6, -1.2], [0.8, 1.75, 1.7], [-0.4, 1.7, -1.3], eo, 42); fillOn(x, p, 1.3, 2.2);
});
// "Aquela que dava presentes e dava vida" — the gift box opens
at(247.82, 'gifts', x => {
  const s = x.S.prize; x.out.scene = s; x.post.vig.value = 0.9; const L = x.L; x.S.giftLid.rotation.x = -1.95 * eo(seg(L, 0.1, 0.7));
  const p = put(x, 'puppet', s, 1.8, 0, -1.6, 0); p.root.position.y = mix(-1.6, 0, eo(seg(L, 0.4, 1.5))); p.idle(x.t, 1); lookAtCam(x, p, 0.7);
  aim(p, 'R', rootPt(p, -0.9, 1.6, 0.6), eo(seg(L, 1.4, 1.9))); aim(p, 'L', rootPt(p, 0.9, 1.6, 0.6), eo(seg(L, 1.4, 1.9))); sparkles(x, s, [1.8, 2.0, -1.2], 0.7, 8, 0.6 * seg(L, 1.4, 1.8));
  camMove(x, [1.3, 1.6, 1.8], [1.8, 1.6, -1.6], [1.6, 1.8, 1.0], [1.8, 1.8, -1.6], eo, 42); fillOn(x, p, 1.3, 2.4);
});
// "Aquele minigame do FNAF 2 em que ela põe máscara nas crianças mortas"
at(250.32, 'gg', x => {
  const s = x.S.gg; x.out.scene = s; x.post.pix.value = PIX(x); const L = x.L; const names = ['freddy', 'bonnie', 'chica', 'foxy'];
  const spots = [[-2.2, -1.0], [-0.7, -1.6], [0.8, -1.6], [2.3, -1.0]];
  spots.forEach(([px, pz], i) => { const k = lie(x, 'kid' + i, s, px, pz, 0.2 * (i - 1.5), 0.74); if (L > 0.6 + i * 0.75) wearMask(x, k, names[i]); });
  const i = Math.min(3, Math.floor(Math.max(0, L - 0.2) / 0.75)); const p = put(x, 'puppet', s, 0, 0, 0, 0); const sp = spots[i]; const ph = (Math.max(0, L - 0.2) % 0.75) / 0.75;
  p.root.position.set(sp[0] + 0.15, 0.25 + 0.1 * Math.sin(x.t * 3), sp[1] + 0.9 - 0.2 * Math.sin(ph * Math.PI)); p.root.rotation.y = Math.PI * 0.9; p.idle(x.t, 1); aim(p, 'R', new V3(sp[0], 0.3, sp[1]), Math.sin(ph * Math.PI));
  cam(x, [mix(-0.3, 0.3, x.u), 3.0, 2.4], [0, 0.3, -1.3], 44); x.post.vig.value = 0.6; x.post.grain.value = 0;
});
// "Ela não estava enfeitando ninguém,"
at(254.36, 'not_decorating', x => {
  const s = voidS(x, 12, 20, '#c8d0ff', 1.2); const L = x.L; const p = put(x, 'puppet', s, 0, 0, 0, 0); p.idle(x.t, 0.8); p.head.rotation.y = 0.35 * Math.sin(x.t * 4) * seg(L, 0.4, 0.8); lookAtCam(x, p, 0.6);
  const hp = tp(p, 'head', [0, 4, 4]); camMove(x, [hp.x + 0.4, hp.y - 0.2, hp.z + 2.4], hp.toArray(), [hp.x + 0.15, hp.y - 0.1, hp.z + 1.6], hp.toArray(), eio, 34);
});
// "tava dando corpos novos a elas" — the ghosts become the band
at(256.70, 'new_bodies', x => {
  const s = voidS(x, 40, 18, '#9ad8ff', 3); const L = x.L; s.fog = null;
  ['foxy', 'bonnie', 'freddy', 'chica'].forEach((n, i) => { const px = (i - 1.5) * 1.4; const k = sm(seg(L, 0.3 + i * 0.25, 0.9 + i * 0.25));
    ghostKid(x, i, s, [px, 0, 0.2], 0, 0.55 * (1 - k)); const c = put(x, n, s, px, 0, 0, -(i - 1.5) * 0.1); c.idle(x.t, 1, i); c.root.visible = k > 0.05; c.root.scale.setScalar(c.baseScale * mix(0.6, 1, back(k))); if (k > 0 && k < 1) x.post.chroma.value = 0.5; });
  camMove(x, [0, 1.5, 7.0], [0, 1.3, 0], [0, 1.6, 6.0], [0, 1.4, 0], eo, 36);
});
// "E foi aí que tudo começou a ficar estranho,"
at(258.64, 'strange', x => {
  const s = hall(x, 1.0, '#c0ffd0'); const L = x.L; const f = put(x, 'freddy', s, 0, 0, -4.4, 0); f.idle(x.t, 0.5); twitch(f, x.t, 1); if (Math.sin(x.t * 7) > 0.8) glitchIn(x, f, 0.8);
  camMove(x, [0.4, 1.7, 0.6], [0, 1.9, -4.4], [0.2, 1.9, -1.6], [0, 2.0, -4.4], eo, 40); x.camera.rotateZ(mix(0, 0.12, eio(x.u))); x.post.chroma.value = 0.3; fillOn(x, f, 1.5, 2.2);
});
// "porque o espírito não deveria conseguir viver dentro do metal" — a weak, flickering soul inside the endoskeleton
at(261.52, 'not_live', x => {
  const s = voidS(x, 22, 20, '#9ad8ff', 1); const L = x.L; const f = put(x, 'freddy', s, 0, 0, 0, 0); f.idle(x.t, 0.4); x.setXray(f, 0.85, 0.2, '#9ad8ff');
  const ch = tp(f, 'torso', [0, 6, 1]); const fl = 0.5 + 0.5 * Math.sin(x.t * 13) * Math.sin(x.t * 3.1); const o = orbAt(x, 0, s, ch, 0.3 * (0.4 + 0.6 * fl) * (1 - 0.6 * seg(L, 1.5, 2.9)));
  camMove(x, [ch.x + 0.6, ch.y + 0.2, ch.z + 3.4], ch.toArray(), [ch.x + 0.3, ch.y + 0.1, ch.z + 2.3], ch.toArray(), eio, 36);
});
// "A não ser que tivesse alguma coisa ajudando" — something glowing in a tank
at(264.56, 'unless', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 1.0; const L = x.L; x.S.shopLamp.intensity = 3; const t = tankAt(x, s, [-1.5, 1.01, -3.2], 0.7 + 0.05 * Math.sin(x.t * 2), 1.4);
  t.userData.bits.forEach((b, i) => { const a = x.t * 2 + i * 0.45; b.visible = true; b.position.set(Math.cos(a) * 0.2, 0.35 + ((i * 0.07 + x.t * 0.2) % 0.8), Math.sin(a) * 0.2); });
  const c = t.position; camMove(x, [c.x + 1.6, c.y + 0.9, c.z + 3.2], [c.x, c.y + 0.7, c.z], [c.x + 0.4, c.y + 0.8, c.z + 1.4], [c.x, c.y + 0.75, c.z], eio, 42);
});
