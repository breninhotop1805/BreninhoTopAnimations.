
// ================================ PART 6: CAMADA 6 — SEM NOME (+ final, animation only) ================================
function seabed(x, y = -56) { const L = x.L; return ice(x, { red: 1, rush: 0.4 }); }
function plushBand(x, s, cx, cz) { [['freddy', -0.55, 0.35], ['bonnie', 0.55, 0.3], ['chica', -0.35, -0.55], ['foxy', 0.45, -0.5]].forEach(([n, dx, dz], i) => {
  const p = put(x, n, s, cx + dx, 0.0, cz + dz, Math.atan2(-dx, -dz), 0.24 / 1.22); slump(p, 0.2); p.head.rotation.x = 0.1; p.head.rotation.y = 0.1 * Math.sin(x.t * 0.8 + i); }); }
function lyingKid(x, s, a = 0.25) { const c = lie(x, 'cchild', s, 0, 0, 0.25, 0.76); c.head.rotation.y = 0.5; return c; }

// "Camada 6, sem nome"
at(501.0667, 'dive6', x => { dive(x, 5, ICE_DEPTHS[4], ICE_DEPTHS[5]); });
// "Se você chegou até aqui, merece escutar essa" — the very bottom; one small soul glowing on the floor
at(506.00, 'reached', x => {
  const L = x.L; const y = mix(-50, -55, eio(x.u)); iceCam(x, y, 0.2, 22, -1.5, 44, -10); seabed(x); soulAhead(x, 3.2 - 0.6 * eio(x.u), 1.0);
});
// "Lembra da pergunta que eu mandei você guardar?"
at(509.58, 'remember', x => {
  const s = voidS(x, 30, 26, '#a040ff', 1); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.4); lookAtCam(x, w, 1);
  const hp = tp(w, 'head', [0, 4, 4]); camMove(x, [hp.x - 0.4, hp.y - 0.1, hp.z + 2.6], hp.toArray(), [hp.x - 0.15, hp.y - 0.05, hp.z + 1.8], hp.toArray(), eio, 32); fillOn(x, w, 0.8, 1.9);
});
// "Por que o William estudava como prender almas em máquinas?"
at(512.22, 'why_souls', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 1.0; const L = x.L; x.S.shopLamp.intensity = 4; const t = tankAt(x, s, [-1.5, 1.01, -3.2], 0.85, 1.6); const c = t.position;
  [0, 1, 2].forEach(i => { const a = x.t * 1.6 + i * 2.1; orbAt(x, i, s, new V3(c.x + Math.cos(a) * 0.18, c.y + 0.55 + 0.2 * Math.sin(x.t * 2 + i), c.z + Math.sin(a) * 0.18), 0.25); });
  const w = put(x, 'william', s, -0.5, 0, -1.9, -2.45); w.idle(x.t, 0.6); aim(w, 'R', new V3(-1.3, 1.6, -2.95), 0.9); const hp = tp(w, 'head', [0, 4, 4]); keyOn(x, s, [-1.5, 1.8, -3.1], hp.toArray(), 2.5, 0.6); KEY.color.set('#3ad8ff');
  camMove(x, [-3.4, 1.9, -0.6], [-0.9, 1.45, -2.3], [-3.1, 1.85, -0.9], [-0.9, 1.45, -2.4], eo, 46);
});
// "Essa é uma das teorias mais antigas e mais tristes do fundo do iceberg"
at(515.20, 'saddest', x => { const L = x.L; iceCam(x, -56, mix(-0.2, 0.25, eio(x.u)), 22, -1, 44, 10); seabed(x); soulAhead(x, 2.6, 0.9); x.post.tint.value.set(0.7, 0.8, 1.1); });
// "O filho caçula dele foi mordido pelo Fredbear"
at(519.68, 'son', x => {
  const s = diner(x, 0.7); const L = x.L; const f = put(x, 'fredbear', s, 0, 0.77, -4.4, 0); f.idle(x.t, 0.6); const k = ei(seg(L, 2.4, 2.6)); f.head.rotation.x = 0.2 + 0.4 * k; f.torso.rotation.x = 0.3 * k;
  if (L > 2.6) { x.post.tint.value.set(1.5, 0.4, 0.4); shake(x, 0.6 * (1 - seg(L, 2.6, 3.0))); } const hp = tp(f, 'head', [0, 3, 4]); camMove(x, [0.4, 1.7, -1.0], hp.toArray(), [0.2, 2.0, -2.2], hp.toArray(), eio, 42); fillOn(x, f, 1.5, 2.4);
});
// "A filha foi morta pela Baby"
at(522.74, 'daughter_baby', x => {
  const L = x.L; const [s, b, e] = babyScene(x); const open = eo(seg(L, 0, 0.3)), ext = eo(seg(L, 0.3, 0.6)), grip = eo(seg(L, 0.6, 0.7)), back_ = ei(seg(L, 0.8, 1.2));
  b.setClaw(open, ext * (1 - back_), grip); e.root.position.z = mix(-1.75, -2.6, back_); e.root.visible = L < 1.2; if (L > 1.2) b.setClaw(1 - eo(seg(L, 1.2, 1.5)), 0, 0);
  cam(x, [1.7, 1.35, -0.6], [0, 1.3, -2.5], 40); x.post.tint.value.set(0.9, 0.9, 1.05); if (L > 1.2 && L < 1.27) x.post.flash.value = 0.06;
});
// "A família dele inteira foi destruída pelas máquinas que ele mesmo construiu"
at(524.80, 'family_gone', x => {
  const s = voidS(x, 26, 30, '#ff2a1a', 0.8); const L = x.L; s.fog = null; const w = put(x, 'william', s, 0, 0, 0.6, 0); w.idle(x.t, 0.6); w.head.rotation.x = 0.4;
  const gc = put(x, 'gCchild', s, -0.8, 0.1, 0.4, 0.2), ge = put(x, 'gCharlotte', s, 0.8, 0.1, 0.4, -0.2); [gc, ge].forEach((g, i) => { g.idle(x.t, 1, i); g.ghostMat.opacity = 0.45 * (1 - sm(seg(L, 1.5, 3.6))); });
  const f = put(x, 'fredbear', s, -1.5, 0, -1.8, 0.4), b = put(x, 'baby', s, 1.5, 0, -1.8, -0.4); f.idle(x.t, 0.5); b.idle(x.t, 0.5); b.setEyes('#5aff6a'); rimOn(x, s, [0, 4, -4], [0, 1.6, -1.8], 70, '#ff2a1a');
  camMove(x, [0, 1.3, 5.6], [0, 1.6, -0.5], [0, 1.5, 4.6], [0, 1.7, -0.6], eio, 40);
});
// "E se o Afton não estava só matando"
at(528.88, 'not_only', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 0.95; const L = x.L; x.S.shopLamp.intensity = 10; const sb = put(x, 'springbonnie', s, 1.3, 0, -2.6, -0.4); droop(sb, 0.3); x.setXray(sb, 0.8, 0.3, '#3ad8ff');
  const w = put(x, 'william', s, 0.1, 0, -1.7, 1.2); w.idle(x.t, 1); aim(w, 'R', tp(sb, 'torso', [0, 6, 3]), 0.85 + 0.1 * Math.sin(x.t * 9)); w.head.rotation.x = 0.2;
  camMove(x, [1.3, 1.7, 1.4], [0.7, 1.4, -2.1], [1.1, 1.65, 0.9], [0.7, 1.4, -2.2], eo, 44); fillOn(x, w, 1.4, 1.8);
});
// "E se ele estava tentando descobrir um jeito de trazer os filhos de volta" — the children's shadows behind the glowing tank
at(531.34, 'bring_back', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 1.0; const L = x.L; x.S.shopLamp.intensity = 3; const t = tankAt(x, s, [-1.5, 1.01, -3.2], 0.85, 1.6);
  const w = put(x, 'william', s, -0.4, 0, -1.8, -2.45); w.idle(x.t, 0.5); aim(w, 'L', new V3(-1.2, 1.4, -2.9), 0.9); w.head.rotation.x = 0.15;
  const gc = put(x, 'gCchild', s, -2.3, 0.1, -3.4, 0.6), ge = put(x, 'gCharlotte', s, -0.7, 0.1, -3.6, -0.3); [gc, ge].forEach((g, i) => { g.idle(x.t, 1, i); g.ghostMat.opacity = 0.4 * sm(seg(L, 0.8, 2.4)); });
  camMove(x, [-3.4, 1.9, -0.5], [-0.9, 1.45, -2.4], [-3.1, 1.85, -0.8], [-0.9, 1.45, -2.5], eo, 46);
});
// "De colocar a alma do menino num corpo de metal" — the little ghost steps into the endoskeleton
at(535.58, 'soul_metal', x => {
  const s = voidS(x, 26, 26, '#3ad8ff', 1.5); const L = x.L; s.fog = null; const f = put(x, 'freddy', s, 0, 0, 0, 0); f.idle(x.t, 0.4); x.setXray(f, 0.85, 0.3 + 0.7 * seg(L, 1.6, 2.2), '#3ad8ff');
  const k = eio(seg(L, 0.2, 1.8)); const g = put(x, 'gCchild', s, 0, mix(0, 0.5, k), mix(1.4, 0.05, k), Math.PI); g.idle(x.t, 1); g.ghostMat.opacity = 0.55 * (1 - seg(L, 1.6, 2.1));
  const a = mix(0.7, 0.3, eio(x.u)); cam(x, [Math.sin(a) * 3.6, 1.6, Math.cos(a) * 3.6], [0, 1.4, 0.3], 38); if (L > 1.75 && L < 1.85) x.post.flash.value = 0.12;
});
// "Num corpo que não morre"
at(538.34, 'never_dies', x => {
  const s = voidS(x, 30, 26, '#3ad8ff', 2); const L = x.L; const f = put(x, 'freddy', s, 0, 0, 0, 0); f.idle(x.t, 0.4); x.setXray(f, 0.85, 0.6 + 0.3 * Math.sin(x.t * 3), '#3ad8ff'); lookAtCam(x, f, 0.5);
  const a = mix(-0.6, 0.2, eio(x.u)); cam(x, [Math.sin(a) * 3.8, 2.4, Math.cos(a) * 3.8], [0, 1.4, 0], 38);
});
// "Num corpo que ele mesmo pudesse consertar" — William repairing it, sparks
at(540.06, 'fix', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 0.95; const L = x.L; x.S.shopLamp.intensity = 12; const f = put(x, 'freddy', s, 1.2, 0, -2.6, -0.5); droop(f, 0.5); x.setXray(f, 0.6, 0.3, '#3ad8ff');
  const w = put(x, 'william', s, 0.1, 0, -1.8, 1.0); w.idle(x.t, 1); const tgt = tp(f, 'torso', [0, 7, 3]); aim(w, 'R', tgt, 0.95); aim(w, 'L', tp(f, 'torso', [3, 5, 3]), 0.8); w.head.rotation.x = 0.25;
  sparksAt(x, s, tgt, (L % 0.7) * 1.4); camMove(x, [1.5, 1.6, 0.9], [0.6, 1.3, -2.2], [1.3, 1.55, 0.5], [0.6, 1.3, -2.3], eo, 44); fillOn(x, w, 1.2, 1.8);
});
// "Cada criança que ele matou teria sido um teste" — a scanning light passes each little ghost
at(543.56, 'tests', x => {
  const s = voidS(x, 6, 30, '#ff2a1a', 0.4); const L = x.L; s.fog = null; const scan = mix(-3, 3, seg(L, 0.2, 2.6));
  for (let i = 0; i < 5; i++) { const px = (i - 2) * 1.2; ghostKid(x, i, s, [px, 0.05 * Math.sin(x.t * 2 + i), 0], 0, 0.3 + 0.45 * Math.exp(-((px - scan) ** 2) * 3)); }
  keyOn(x, s, [scan, 3.5, 2.2], [scan, 0.6, 0], 40, 0.3); x.S.voidFill.intensity = 2; KEY.color.set('#ff4a3a'); camMove(x, [0, 1.3, 6.2], [0, 0.9, 0], [0, 1.2, 5.4], [0, 0.95, 0], eo, 36);
});
// "Não tem nada confirmado"
at(546.34, 'unconfirmed', x => {
  const s = files(x, 0); const L = x.L; FILES.userData.cover.rotation.z = -2.9 * (1 - eio(seg(L, 0.2, 0.9))); camMove(x, [0.8, 1.55, 0.8], [0.3, 1.0, 0.1], [0.6, 1.45, 0.6], [0.3, 1.0, 0.1], eo, 40);
});
// "Mas se for verdade"
at(547.90, 'if_true', x => {
  const s = voidS(x, 0, 30, '#a040ff', 0.4); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.4); lookAtCam(x, w, 1); rimOn(x, s, [0.6, 3.2, -2.4], [0, 1.7, 0], 50, '#a040ff');
  const hp = tp(w, 'head', [0, 4, 4]); cam(x, [hp.x + 0.3, hp.y - 0.05, hp.z + 2.2 - 0.3 * x.u], hp.toArray(), 32); keyOn(x, s, [1.2, 2.6, 2.5], hp.toArray(), 5, 0.3);
});
// "O maior monstro de FNAF não nasceu monstro" — once, just a father
at(549.02, 'born_man', x => {
  const s = voidS(x, 44, 10, '#ffd0a0', 3); const L = x.L; s.fog = null; const w = put(x, 'william', s, 0.3, 0, -0.3, -0.1), m = put(x, 'michael', s, -1.3, 0, 0.1, 0.25), e = put(x, 'elizabeth', s, 1.25, 0, 0.3, -0.25), c = put(x, 'cchild', s, -0.45, 0, 0.6, 0.1);
  [w, m, e, c].forEach((p, i) => { p.idle(x.t, 1, i); lookAtCam(x, p, 0.5); }); aim(w, 'L', tp(e, 'head', [0, 9, 0]), 0.8);
  camMove(x, [0.0, 1.8, 4.4], [0, 1.25, 0], [0.0, 1.75, 3.9], [0, 1.25, 0], eo, 38); x.post.tint.value.set(1.12, 1.0, 0.85); x.post.fade.value = 0.5 * sm(seg(L, 2.3, 2.98));
});
// "Ele virou monstro tentando desfazer o próprio erro" — William becomes Springtrap
at(552.02, 'became', x => {
  const s = voidS(x, 26, 36, '#ff2a1a', 1); const L = x.L; const sw = L > 0.75; const c = put(x, sw ? 'spring' : 'william', s, 0, 0, 0, 0); c.idle(x.t, 0.6); lookAtCam(x, c, 0.8); if (sw) twitch(c, x.t, 0.8);
  if (L > 0.55 && L < 0.95) { glitchIn(x, c, 1); x.post.stat.value = 0.4; x.post.chroma.value = 1; }
  camMove(x, [0.5, 1.5, 4.4], [0, 1.6, 0], [0.2, 1.7, 3.2], [0, 1.75, 0], eio, 38); x.post.tint.value.set(1.1, 0.88, 0.85);
});
// "E cometendo mil erros piores no caminho"
at(554.92, 'worse', x => {
  const s = fright(x, 0.8); const L = x.L; const c = put(x, 'spring', s, 0, 0, 0, 0); walkTo(c, [0, 0, -7], [0, 0, -4.6], eo(seg(L, 0, 2.2)), 1.1); twitch(c, x.t, 0.8);
  for (let i = 0; i < 5; i++) ghostKid(x, i, s, [(i - 2) * 0.6, 0.2, -2.6 - (i % 2) * 0.4], Math.PI, 0.35);
  camMove(x, [0.4, 1.4, -0.6], [0, 1.8, -6], [0.2, 1.5, -1.4], [0, 1.9, -5], eo, 44); fillOn(x, c, 2, 2);
});
// "No final de FNAF 4, depois da mordida"
at(557.20, 'f4_end', x => {
  const s = voidS(x, 18, 0, '#ffffff', 0.4); const L = x.L; s.fog = null; const c = lyingKid(x, s); camMove(x, [0.4, 3.2, 2.0], [0, 0.1, -0.2], [0.2, 2.6, 1.4], [0, 0.1, -0.2], eo, 40); x.post.tint.value.set(0.85, 0.85, 0.95);
});
// "Depois que a criança está morrendo na escuridão" — the light dies
at(559.92, 'dying', x => {
  const s = voidS(x, 18 * (1 - 0.8 * sm(seg(x.L, 0.4, 2.1))), 0, '#ffffff', 0.3); const L = x.L; s.fog = null; const c = lyingKid(x, s); const hp = tp(c, 'head', [0, 4, 4]);
  camMove(x, [hp.x + 0.9, hp.y + 1.3, hp.z + 0.6], hp.toArray(), [hp.x + 0.5, hp.y + 0.9, hp.z + 0.35], hp.toArray(), eio, 40);
});
// "Uma voz fala com ela"
at(562.22, 'a_voice', x => {
  const s = voidS(x, 5, 0, '#ffffff', 0.3); const L = x.L; s.fog = null; const c = lyingKid(x, s); const hp = tp(c, 'head', [0, 4, 4]); waves(x, s, new V3(hp.x, hp.y + 0.6, hp.z), 0.6, '#ffe8c0');
  cam(x, [hp.x + 0.7, hp.y + 1.1, hp.z + 0.5], hp.toArray(), 40);
});
// "Ela diz que a criança ainda consegue ouvir, que ela ainda está lá dentro"
at(563.66, 'can_hear', x => {
  const s = voidS(x, 8, 0, '#ffffff', 0.4); const L = x.L; s.fog = null; const c = lyingKid(x, s); const hp = tp(c, 'head', [0, 4, 4]); sparkles(x, s, [hp.x, hp.y + 0.3, hp.z], 0.4, 6, 0.3);
  const ch = tp(c, 'torso', [0, 6, 2]); orbAt(x, 0, s, ch, 0.18 * (0.7 + 0.3 * Math.sin(x.t * 3)));
  camMove(x, [hp.x + 0.6, hp.y + 0.7, hp.z + 0.6], hp.toArray(), [hp.x + 0.35, hp.y + 0.45, hp.z + 0.35], hp.toArray(), eio, 40);
});
// "E que os amigos ainda são amigos dela" — the plushies gathered around him
at(567.22, 'friends', x => {
  const s = voidS(x, 14, 0, '#ffffff', 0.5); const L = x.L; s.fog = null; lyingKid(x, s); plushBand(x, s, 0, 0.2);
  const a = mix(0.9, 0.3, eio(x.u)); cam(x, [Math.sin(a) * 2.6, 1.5, Math.cos(a) * 2.6], [0, 0.15, 0], 40); x.post.tint.value.set(1.0, 0.95, 1.05);
});
// "E termina dizendo"
at(569.40, 'ends_saying', x => {
  const s = voidS(x, 10, 0, '#ffffff', 0.4); const L = x.L; s.fog = null; lyingKid(x, s); plushBand(x, s, 0, 0.2); cam(x, [0, mix(2.0, 3.6, eio(x.u)), 1.2], [0, 0.1, 0], 40);
});
// "Eu ainda estou aqui" — a soft white light opens over him
at(570.54, 'still_here', x => {
  const s = voidS(x, mix(4, 18, sm(seg(x.L, 0.2, 1.3))), 0, '#ffffff', 0.4); const L = x.L; s.fog = null; x.S.voidSpot.color.set('#e8f0ff'); lyingKid(x, s);
  cam(x, [0.2, 3.8, 1.4], [0, 0.1, 0], 40); x.bloom.strength = 0.5;
});
// "Eu vou te montar de novo" — a figure kneels beside him
at(572.04, 'put_together', x => {
  const s = voidS(x, 22, 30, '#a040ff', 0.5); const L = x.L; s.fog = null; const c = lyingKid(x, s); const w = put(x, 'william', s, 0.75, 0, -0.4, -1.2); kneel(w, 1); w.head.rotation.x = 0.5;
  aim(w, 'R', tp(c, 'torso', [0, 6, 3]), eo(seg(L, 0.3, 1.1))); camMove(x, [-1.6, 1.9, 3.0], [0.2, 0.5, -0.2], [-1.3, 1.8, 2.6], [0.2, 0.5, -0.2], eo, 40);
});
// "A franquia inteira," — the whole iceberg
at(573.84, 'franchise', x => { const L = x.L; const a = mix(0.9, 0.4, eio(x.u)); const R = 38; cam(x, [Math.sin(a) * R, mix(14, 10, eio(x.u)), -14 + Math.cos(a) * R], [0, 1, -14], 44); ice(x); });
// "Novos jogos principais," — the UCN office
at(575.20, 'games', x => { const s = ucn(x); cam(x, [mix(-0.6, 0.4, x.u), 1.8, 2.6], [0, 1.3, -1.6], 50); });
// "Dezenas de livros,"
at(576.64, 'books6', x => { const s = files(x, 0); const b = FILES.userData.book[0].parent.position; cam(x, [b.x - 0.6 + 0.3 * x.u, 1.4, b.z + 0.7], [b.x - 0.4, 1.05, b.z], 40); });
// "Filmes começam com uma criança desmontada" — the band under a cinema spotlight
at(577.62, 'films', x => { const [s, f] = band(x, 0.6); const L = x.L; x.S.stageSpot.intensity = 30; camMove(x, [-2.2, 1.6, 4.8], [0, 2.0, -1.8], [2.0, 1.7, 4.4], [0, 2.0, -1.8], eio, 34); });
at(578.28, 'disassembled', x => {
  const s = voidS(x, 22, 20, '#ffffff', 0.6); const L = x.L; s.fog = null; const c = lyingKid(x, s); s.add(PCB); PCB.position.set(0.5, 0.02, 0.35); PCB.rotation.set(0, 0.8, 0); PCB.scale.setScalar(0.7);
  const a = mix(-0.4, 0.4, eio(x.u)); cam(x, [Math.sin(a) * 2.2, 2.1, Math.cos(a) * 2.2], [0, 0.15, 0], 40);
});
// "E alguém prometendo montá-la de novo"
at(580.50, 'promise', x => {
  const s = voidS(x, 22, 26, '#a040ff', 0.6); const L = x.L; s.fog = null; const c = lyingKid(x, s); const w = put(x, 'william', s, 0.75, 0, -0.4, -1.2); kneel(w, 1); w.head.rotation.x = 0.55;
  aim(w, 'R', tp(c, 'head', [0, 6, 2]), 1); aim(w, 'L', tp(c, 'torso', [0, 6, 3]), 0.8); camMove(x, [-1.2, 1.7, 3.0], [0.2, 0.5, -0.2], [-0.9, 1.6, 2.6], [0.2, 0.5, -0.2], eo, 40);
});
// "Talvez o iceberg de FNAF não seja sobre robôs assassinos" — from far below, looking up at the ice and the light
at(583.26, 'maybe', x => { const L = x.L; const y = mix(-14, -10, eio(x.u)); cam(x, [16, y, 14], [0, y + 9, -14], 52); ice(x); });
// "Talvez seja sobre pais e filhos"
at(587.06, 'parents', x => {
  const s = voidS(x, 20, 40, '#ffb070', 1); const L = x.L; s.fog = null; const w = put(x, 'william', s, -0.35, 0, 0, 0), c = put(x, 'cchild', s, 0.35, 0, 0, 0); w.idle(x.t, 1); c.idle(x.t, 1, 1);
  const hd = rootPt(c, -0.45, 0.65, 0.05); aim(w, 'L', hd, 0.9); aim(c, 'R', hd, 0.9); rimOn(x, s, [0, 3.5, -3.5], [0, 1.2, 0], 60, '#ffb070'); camMove(x, [0.3, 1.1, 4.2], [0, 1.1, 0], [0.15, 1.15, 3.4], [0, 1.15, 0], eo, 38);
});
// "Sobre culpa"
at(589.06, 'guilt', x => {
  const s = voidS(x, 20, 20, '#6a8aff', 0.5); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.4); w.head.rotation.x = 0.6; aim(w, 'R', rootPt(w, 0.05, 1.55, 0.35), 0.9);
  rain(x, s, 0, 0); const hp = tp(w, 'head', [0, 4, 4]); cam(x, [hp.x + 0.6, hp.y - 0.2, hp.z + 3.0 - 0.3 * x.u], [hp.x, hp.y - 0.25, hp.z], 38); x.post.tint.value.set(0.85, 0.9, 1.1);
});
// "Sobre um homem que nunca aceitou perder alguém"
at(590.08, 'never_accept', x => {
  const s = voidS(x, 18, 26, '#6a8aff', 0.5); const L = x.L; s.fog = null; const c = lyingKid(x, s); const w = put(x, 'william', s, 0.75, 0, -0.4, -1.2); kneel(w, 1); w.head.rotation.x = 0.65;
  aim(w, 'R', rootPt(w, 0.05, 1.5, 0.35), 0.9); const a = mix(1.2, 0.6, eio(x.u)); cam(x, [Math.sin(a) * 3.0, 1.6, Math.cos(a) * 3.0], [0.3, 0.6, -0.2], 38); x.post.tint.value.set(0.85, 0.9, 1.1);
});
// "E sobre o preço de um monte de crianças que pagaram por isso" — every little ghost
at(592.60, 'price', x => {
  const s = voidS(x, 20, 20, '#9ad8ff', 2); const L = x.L; s.fog = null; const G = ['gk0', 'gk1', 'gCharlotte', 'gk2', 'gCchild', 'gk3', 'gAndrew', 'gk4'];
  G.forEach((n, i) => { const g = put(x, n, s, (i - 3.5) * 0.75, 0.05 * Math.sin(x.t * 1.5 + i), -0.25 * Math.abs(i - 3.5), 0); g.idle(x.t, 1, i); g.ghostMat.opacity = 0.5 * sm(seg(L, i * 0.12, 0.6 + i * 0.12)); g.head.rotation.x = 0.25; });
  camMove(x, [0, 1.0, 6.6], [0, 0.9, 0], [0, 1.1, 5.4], [0, 0.95, 0], eo, 36);
});
// "E sabe o pior?"
at(595.98, 'worst', x => { const L = x.L; iceCam(x, -52, 0.3, 26, -8, 48, 14); seabed(x); x.post.vig.value = 1.1; });
// "Esse iceberg ainda não acabou" — it keeps going down
at(597.24, 'not_over', x => { const L = x.L; iceCam(x, mix(-56, -64, eio(x.u)), 0.2, 26, -6, 46, -14); ice(x, { red: 1, rush: 1.5 }); });
// "Toda vez que sai um jogo novo, ele fica mais fundo" — something opens its eyes far below
at(598.74, 'deeper', x => {
  const L = x.L; const y = mix(-64, -70, eio(x.u)); iceCam(x, y, 0.1, 24, -5, 46, -12); ice(x, { red: 1, rush: 1.2 }); const s = x.S.ice;
  const f = new V3(); x.camera.getWorldDirection(f); const mp = x.camera.position.clone().addScaledVector(f, 9); const m = put(x, 'mimic', s, mp.x, mp.y - 5, mp.z, Math.atan2(-f.x, -f.z)); m.idle(x.t, 0.5); mimicEyes(x, sm(seg(L, 1.4, 2.0)) * 1.5); m.root.scale.setScalar(3);
});
// "Se você chegou até aqui, parabéns. Você desceu até o fundo do iceberg de FNAF" — all the way back up
at(601.98, 'congrats', x => {
  const L = x.L; const k = eio(seg(L, 0, 4.9)); const y = mix(-55, 9, k); const a = mix(0.1, 0.9, k); const R = iceRad(Math.min(y, 6)) + mix(14, 26, k); cam(x, [Math.sin(a) * R, y, -14 + Math.cos(a) * R * 0.9], [0, y - mix(2, -1, k), -14], 46);
  ice(x, { rush: 2.5 * (1 - k), red: 1 - k }); if (Math.abs(y) < 1.2) { x.post.flash.value = 0.3 * (1 - Math.abs(y) / 1.2); x.post.blur.value = 0.6 * (1 - Math.abs(y) / 1.2); }
});
// "Agora me fala nos comentários qual camada mais te perturbou" — every layer's title down the side of the ice
at(607.06, 'all_layers', x => {
  const L = x.L; const k = eio(seg(L, 0, 3.3)); const y = mix(4, -50, k); iceCam(x, y, 0.15, 24, -0.5, 46); ice(x, { red: seg(L, 2, 3.3) });
  x.S.iceTitles.forEach((tg, i) => { tg.visible = true; const ty = ICE_DEPTHS[i] + 0.3; const R = iceRad(ty) + 15; tg.position.set(Math.sin(0.15) * R, ty, -14 + Math.cos(0.15) * R * 0.85); tg.quaternion.copy(x.camera.quaternion); tg.scale.setScalar(0.85); });
});
// "E qual teoria você acha que é verdade: O Mimic,"
at(610.48, 'opt_mimic', x => {
  const s = voidS(x, 26, 36, '#ff8a3a', 1.5); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); m.idle(x.t, 0.8); lookAtCam(x, m, 0.8); mimicEyes(x, sm(seg(L, 2.3, 2.6)) * 1.2 + 0.1);
  camMove(x, [0.6, 1.6, 5.6], [0, 1.7, 0], [0.2, 1.75, 3.8], [0, 1.8, 0], eio, 36);
});
// "o purgatório do William,"
at(613.48, 'opt_ucn', x => { const s = ucn(x, 0.6); const w = ucnWill(x, s); w.head.rotation.y = 0.5 * Math.sin(x.t * 2); camMove(x, [0.3, 1.75, 1.4], [0, 1.4, -2], [0.1, 1.65, 0.7], [0, 1.45, -2], eo, 46); });
// "Ou o verdadeiro motivo dele"
at(614.66, 'opt_motive', x => {
  const s = voidS(x, 40, 10, '#ffd0a0', 3); const L = x.L; s.fog = null; const w = put(x, 'william', s, -0.3, 0, 0, 0.2), c = put(x, 'cchild', s, 0.35, 0, 0.25, -0.15); w.idle(x.t, 0.8); c.idle(x.t, 1);
  aim(w, 'L', tp(c, 'head', [0, 9, 0]), 0.9); w.head.rotation.x = 0.35; w.head.rotation.y = -0.3; lookAtCam(x, c, 0.5); camMove(x, [0.6, 1.5, 3.8], [0, 1.2, 0], [0.4, 1.5, 3.3], [0, 1.25, 0], eo, 38); x.post.tint.value.set(1.08, 1.0, 0.88);
});
// ending (animation only, no icons): everyone together, waving goodbye
at(616.18, 'outro', x => {
  const s = voidS(x, 60, 18, '#ffb070', 5); const L = x.L; s.fog = null;
  const back_ = ['spring', 'golden', 'freddy', 'bonnie', 'chica', 'foxy', 'baby', 'mimic'], front = ['william', 'michael', 'cchild', 'elizabeth', 'henry', 'charlotte', 'guard'];
  back_.forEach((n, i) => { const c = put(x, n, s, (i - 3.5) * 1.3, 0, -1.4 - 0.25 * Math.abs(i - 3.5), -(i - 3.5) * 0.06); c.idle(x.t, 1, i); lookAtCam(x, c, 0.5); if (n === 'baby') c.setEyes('#5aff6a'); });
  front.forEach((n, i) => { const c = put(x, n, s, (i - 3) * 0.95, 0, 0.4, -(i - 3) * 0.06); c.idle(x.t, 1, i); lookAtCam(x, c, 0.7); aim(c, i % 2 ? 'L' : 'R', rootPt(c, i % 2 ? 0.55 : -0.55, 1.95 + 0.12 * Math.sin(x.t * 9 + i), 0.3), eo(seg(L, 0.3 + i * 0.1, 0.8 + i * 0.1))); });
  camMove(x, [0, 1.7, 10.0], [0, 1.45, -0.5], [0, 1.75, 8.6], [0, 1.5, -0.5], eo, 36); mimicEyes(x, 1); keyOn(x, s, [0, 4.5, 6], [0, 1.2, -0.5], 50, 0.7);
});
// "Obrigado por me acompanharem nessa jornada profunda" — the iceberg under the moon
at(620.28, 'thanks', x => { const L = x.L; const a = mix(0.2, 0.9, eio(x.u)); const R = 30; cam(x, [Math.sin(a) * R, mix(6, 10, eio(x.u)), -14 + Math.cos(a) * R], [0, 3, -14], 42); ice(x); });
// "E até a próxima noite" — back where it started: the pizzeria in the rain
at(623.24, 'next_night', x => { const s = facade(x, 0.6); const L = x.L; camMove(x, [0.5, 1.6, 6.5], [0, 1.8, 0], [0.8, 1.9, 9.5], [0, 2.0, 0], eio, 36); rain(x, s, 0, 5); bolt(x, s, 0.8, 0.25); });
// "Se você sobreviver" — Freddy's eyes in the dark doorway... and black
at(625.42, 'survive', x => {
  const s = office1(x, 0); const L = x.L; const f = put(x, 'freddy', s, -3.3, 0, 0.05, Math.PI / 2); f.idle(x.t, 0.3); lookAtCam(x, f, 0.9); f.setEyeGlow('#ffffff', L > 0.3 && L < 1.4 ? 1 : 0);
  x.S.west.forEach(l => l.intensity = 0); x.S.westDoorLight.intensity = L > 0.3 && L < 1.4 ? 1.5 : 0; cam(x, [0.2, 1.6, 0.6], [-3.3, 2.0, 0], mix(40, 30, eio(x.u))); x.post.fade.value = sm(seg(L, 1.4, 1.8));
});
const _cleanup3 = cleanup;
cleanup = function (x) { _cleanup3(x); PCB.scale.setScalar(1); VR.scale.setScalar(1); };
// a small soul glowing a few units in front of the camera (deep-water shots)
function soulAhead(x, d, sz) { const f = new V3(); x.camera.getWorldDirection(f); const p = x.camera.position.clone().addScaledVector(f, d); p.y += 0.12 * Math.sin(x.t * 1.3); orbAt(x, 0, x.S.ice, p, sz); }
