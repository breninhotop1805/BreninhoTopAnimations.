
// ================================ PART 5: CAMADA 5 — O FUNDO ================================
let MIMIC_EYES = null;
function mimicEyes(x, k = 1, col = '#ffb84a') { const m = x.C.mimic; if (!MIMIC_EYES) { MIMIC_EYES = []; m.root.traverse(o => { if (o.isMesh && o.material.isMeshBasicMaterial && o.material.color.getHexString() === 'ffb84a') MIMIC_EYES.push(o.material); }); }
  MIMIC_EYES.forEach(mt => mt.color.set(col).multiplyScalar(Math.max(0.02, k))); m.eyeLight.intensity = 2.5 * k; m.eyeLight.color.set(col); }
const _cleanup2 = cleanup;
cleanup = function (x) { _cleanup2(x); if (MIMIC_EYES) mimicEyes(x, 1); x.FX.agony.visible = true; };
function ruinAtrium(x) { const s = x.S.atrium; x.out.scene = s; x.S.ruinMode('atrium', x.t); x.post.vig.value = 1.0; return s; }
// pose B copies pose A (mirror)
function mirrorPose(a, b) { for (const k of ['armR', 'armL', 'legR', 'legL']) { const o = k.endsWith('R') ? k.replace('R', 'L') : k.replace('L', 'R'); b[o].piv.quaternion.copy(a[k].piv.quaternion); b[o].piv.rotation.y *= -1; b[o].piv.rotation.z *= -1; }
  b.head.rotation.set(a.head.rotation.x, -a.head.rotation.y, -a.head.rotation.z); }

// "Camada 5, o fundo"
at(454.3, 'dive5', x => { dive(x, 4, ICE_DEPTHS[3], ICE_DEPTHS[4]); });
// "Aqui ninguém deveria chegar"
at(458.98, 'nobody', x => { const L = x.L; iceCam(x, mix(-42, -45, eio(x.u)), 0.1, 26, -6, 46, -15); ice(x, { red: 1, rush: 0.5 }); });
// "Os jogos mais novos trouxeram uma coisa" — Secret of the Mimic logo over a dark silhouette
at(460.50, 'logo_sotm', x => {
  const s = voidS(x, 0, 30, '#ff8a3a', 0.5); const m = put(x, 'mimic', s, 0, 0, 0, 0); m.idle(x.t, 0.5); mimicEyes(x, 0.8); cam(x, [0, 1.7, 4.6 - 0.3 * x.u], [0, 1.8, 0], 38); logoCard(x, 0); x.post.blur.value = 1;
});
// "que fez a comunidade inteira entrar em pânico" — alarm lights in the hall
at(462.90, 'panic', x => {
  const s = hall(x, 0, '#ff2a1a'); const L = x.L; const on = Math.floor(x.t * 3) % 2; x.S.hallLamps.forEach((l, i) => l.intensity = on ? 12 : 1.5);
  ['bonnie', 'chica'].forEach((n, i) => { const c = put(x, n, s, i ? 0.9 : -0.9, 0, -5.5 - i, i ? -0.3 : 0.3); c.idle(x.t, 1, i); twitch(c, x.t + i, 1.5); c.setEyeGlow('#ff3020', on); });
  camMove(x, [0.4, 1.5, 1.0], [0, 1.8, -6], [0.1, 1.6, -0.8], [0, 1.9, -6], eo, 44); shake(x, 0.12); x.post.tint.value.set(1.15, 0.85, 0.85);
});
// "O Mimic"
at(465.16, 'mimic', x => {
  const s = voidS(x, 18, 36, '#ff8a3a', 1); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); m.idle(x.t, 0.6); lookAtCam(x, m, 0.8); mimicEyes(x, sm(seg(L, 0.1, 0.35)));
  const hp = tp(m, 'head', [0, 4, 3]); camMove(x, [0.4, hp.y - 0.4, 4.0], hp.toArray(), [0.15, hp.y - 0.1, 2.6], hp.toArray(), eo, 34); if (L > 0.12 && L < 0.2) x.post.flash.value = 0.15;
});
// "Um robô criado por um inventor chamado Edwin Murray" — the workshop
at(466.00, 'edwin', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 0.9; const L = x.L; x.S.shopLamp.intensity = 14; const m = put(x, 'mimic', s, 1.3, 0, -2.6, -0.4); m.idle(x.t, 0.2); m.head.rotation.x = 0.35; mimicEyes(x, 0.05);
  const e = put(x, 'edwin', s, 0.1, 0, -1.6, 1.2); e.idle(x.t, 1); aim(e, 'R', tp(m, 'torso', [0, 7, 3]), 0.8 + 0.1 * Math.sin(x.t * 9)); e.head.rotation.x = 0.1; if (L > 1.9) lookAtCam(x, e, eo(seg(L, 1.9, 2.4)));
  camMove(x, [1.2, 1.7, 1.4], [0.7, 1.5, -2.1], [1.0, 1.65, 0.9], [0.7, 1.55, -2.2], eo, 44); fillOn(x, e, 1.4, 1.8);
});
// "Feito para aprender e copiar o comportamento humano" — it mirrors Edwin's every move
at(468.88, 'learn', x => {
  const s = voidS(x, 36, 18, '#ff8a3a', 3); const L = x.L; s.fog = null; const e = put(x, 'edwin', s, -0.9, 0, 0, 0.5), m = put(x, 'mimic', s, 0.9, 0, 0, -0.5); mimicEyes(x, 1);
  e.idle(x.t, 1); aim(e, 'L', rootPt(e, 0.55, 1.6 + 0.35 * Math.sin(x.t * 2.4), 0.4), 0.9); e.head.rotation.y = 0.3 * Math.sin(x.t * 1.2); e.head.rotation.z = 0.15 * Math.sin(x.t * 1.7);
  m.idle(x.t, 1); mirrorPose(e, m);
  camMove(x, [0, 1.6, 5.0], [0, 1.5, 0], [0, 1.65, 4.2], [0, 1.55, 0], eo, 38);
});
// "Mas ele não aprendeu amor nem alegria"
at(471.52, 'not_love', x => {
  const s = voidS(x, 20, 20, '#6ab0ff', 1); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); m.idle(x.t, 0.5); mimicEyes(x, 0.7); m.head.rotation.z = 0.3 * eo(seg(L, 0.6, 1.4)); m.head.rotation.x = 0.15;
  const a = mix(0.8, 0.2, eio(x.u)); cam(x, [Math.sin(a) * 4.0, 1.9, Math.cos(a) * 4.0], [0, 1.8, 0], 38); x.post.tint.value.set(0.85, 0.92, 1.12);
});
// "Depois de uma tragédia com a família do criador,"
at(474.06, 'tragedy', x => {
  const s = voidS(x, 22, 26, '#ff2a1a', 0.6); const L = x.L; const e = put(x, 'edwin', s, 0, 0, 0, 0); kneel(e, 1); e.head.rotation.x = 0.6; aim(e, 'R', rootPt(e, 0.05, 1.5, 0.35), 0.9); aim(e, 'L', rootPt(e, -0.05, 1.5, 0.35), 0.9);
  e.torso.rotation.x += 0.03 * Math.sin(x.t * 8); camMove(x, [0.9, 1.0, 3.8], [0, 0.9, 0], [0.6, 1.05, 3.2], [0, 0.95, 0], eo, 38); fillOn(x, e, 1.0, 1.4); x.post.tint.value.set(1.0, 0.85, 0.88);
});
// "ele aprendeu a dor. Raiva." — the eyes burn, it shakes
at(476.70, 'rage', x => {
  const s = voidS(x, 16, 44, '#ff2a1a', 0.6); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); m.idle(x.t, 1); lookAtCam(x, m, 0.8); const k = sm(seg(L, 0.9, 1.3));
  mimicEyes(x, 1 + 1.5 * k, k > 0.5 ? '#ff3a1a' : '#ffb84a'); twitch(m, x.t, 1 + k); m.torso.rotation.x = -0.15 * k; aim(m, 'R', rootPt(m, -0.7, 1.5, 0.3), k); aim(m, 'L', rootPt(m, 0.7, 1.5, 0.3), k);
  agonyAt(x, s, new V3(0, 0.3, 0), 1.0, 0); x.FX.agony.visible = k > 0.1; if (k > 0.2) shake(x, 0.35 * k);
  const hp = tp(m, 'head', [0, 4, 3]); camMove(x, [0.3, hp.y - 0.4, 3.6], hp.toArray(), [0.1, hp.y - 0.3, 2.4], hp.toArray(), eo, 36); x.post.tint.value.set(1.1, 0.88, 0.85);
});
// "E começou a copiar exatamente isso" — stalking through the ruined Pizzaplex
at(478.54, 'copy_that', x => {
  const s = ruinAtrium(x); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); walkTo(m, [0.2, 0, -6.5], [0.1, 0, -3.4], eo(seg(L, 0, 2.4)), 1.0); lookAtCam(x, m, 0.5); mimicEyes(x, 1.3);
  camMove(x, [0.6, 1.3, -0.4], [0, 2.0, -6], [0.3, 1.5, -1.0], [0, 2.1, -4], eo, 42); fillOn(x, m, 2.4, 2.4); hand(x, 0.7);
});
// "O Mimic imita vozes, imita pessoas" — sound rings at its head, then it takes a person's pose
at(480.98, 'voices', x => {
  const s = voidS(x, 30, 26, '#ff8a3a', 2); const L = x.L; s.fog = null; const m = put(x, 'mimic', s, 0.7, 0, 0, -0.3); m.idle(x.t, 1); mimicEyes(x, 1);
  const hp = tp(m, 'head', [0, 2, 5]); waves(x, s, hp, 1.4, '#ffb84a'); const p = put(x, 'guard', s, -0.8, 0, 0.1, 0.3); p.idle(x.t, 1); aim(p, 'R', rootPt(p, -0.45, 1.8, 0.4), 0.8 + 0.2 * Math.sin(x.t * 6)); p.head.rotation.z = 0.2;
  if (L > 1.0) { mirrorPose(p, m); } camMove(x, [0, 1.6, 4.8], [0, 1.5, 0], [0.2, 1.7, 4.0], [0, 1.6, 0], eo, 38);
});
// "Em Ruin, ele chega a fingir ser alguém que você confia" — a friendly Freddy... that isn't
at(483.32, 'ruin_fake', x => {
  const s = ruinAtrium(x); const L = x.L; const sw = L > 2.6; const n = sw ? 'mimic' : 'freddy'; const c = put(x, n, s, 0, 0, -4.2, 0); c.idle(x.t, 1); lookAtCam(x, c, 0.8);
  if (!sw) { aim(c, 'R', rootPt(c, -0.6, 2.0 + 0.15 * Math.sin(x.t * 9), 0.3), eo(seg(L, 0.3, 0.7))); } else { mimicEyes(x, 1.5); }
  if (L > 2.45 && L < 2.85) { glitchIn(x, c, 1); x.post.stat.value = 0.5; x.post.chroma.value = 1; }
  camMove(x, [0.3, 1.5, -0.4], [0, 1.9, -4.2], [0.15, 1.7, -1.6], [0, 2.0, -4.2], eo, 42); fillOn(x, c, 2.2, 2.2);
});
// "E aí nasce a teoria mais perturbadora dos últimos anos"
at(486.56, 'theory5', x => { const L = x.L; iceCam(x, mix(-44, -47, eio(x.u)), mix(-0.4, 0.2, eio(x.u)), 26, -5, 46, 15); ice(x, { red: 1, rush: 0.6 }); });
// "E se algumas das vezes em que a gente achou que o William tinha voltado"
at(489.64, 'what_if', x => {
  const s = fright(x, 0.8); const L = x.L; const c = put(x, 'spring', s, 0, 0, -5.0, 0); c.idle(x.t, 1); twitch(c, x.t, 1); lookAtCam(x, c, 0.5);
  camMove(x, [0.6, 1.5, -1.4], [0, 1.9, -5], [0.3, 1.7, -2.6], [0, 2.0, -5], eio, 42); fillOn(x, c, 2, 2);
});
// "Não era ele." — Springtrap flickers into the Mimic
at(493.70, 'not_him', x => {
  const s = fright(x, 0.8); const L = x.L; const sw = L > 0.5; const c = put(x, sw ? 'mimic' : 'spring', s, 0, 0, -5.0, 0); c.idle(x.t, 1); lookAtCam(x, c, 0.8); if (sw) mimicEyes(x, 1.0); x.S.frLamps.forEach(l => l.intensity *= 0.4);
  if (L > 0.35 && L < 0.75) { glitchIn(x, c, 1); x.post.stat.value = 0.45; x.post.chroma.value = 1; }
  const hp = tp(c, 'head', [0, 4, 4]); cam(x, [hp.x + 0.2, hp.y - 0.1, hp.z + 2.2 - 0.3 * x.u], hp.toArray(), 38); fillOn(x, c, 2, 2);
});
// "E se fosse uma máquina que aprendeu a ser o William Afton"
at(495.14, 'machine', x => {
  const s = voidS(x, 26, 36, '#a040ff', 1.5); const L = x.L; s.fog = null; const m = put(x, 'mimic', s, 0, 0, 0, 0); m.idle(x.t, 0.8); lookAtCam(x, m, 0.8); mimicEyes(x, 1);
  const g = put(x, 'gWilliam', s, 0, 0.05, 0.15, 0); g.idle(x.t, 0.8); lookAtCam(x, g, 0.8); g.ghostMat.color.set('#c070ff'); g.ghostMat.opacity = 0.4 * sm(seg(L, 1.4, 2.4)); g.root.scale.setScalar(1.3);
  const a = mix(0.5, -0.2, eio(x.u)); cam(x, [Math.sin(a) * 4.0, 1.9, Math.cos(a) * 4.0], [0, 1.8, 0], 38); keyOn(x, s, [1.2, 3.6, 3.0], [0, 1.6, 0], 18, 0.4);
});
// "Tão bem, que nem dá mais para saber a diferença" — William and the Mimic, one light switching between them
at(497.92, 'difference', x => {
  const s = voidS(x, 0, 20, '#a040ff', 1); const L = x.L; s.fog = null; const w = put(x, 'william', s, -0.85, 0, 0, 0.25), m = put(x, 'mimic', s, 0.85, 0, 0, -0.25);
  w.idle(x.t, 1); aim(w, 'R', rootPt(w, -0.5, 1.7, 0.4), 0.7); lookAtCam(x, w, 0.8); m.idle(x.t, 1); mirrorPose(w, m); mimicEyes(x, 1);
  const side = Math.floor(x.t * 2.2) % 2; keyOn(x, s, [side ? 1.6 : -1.6, 3.4, 2.6], [side ? 0.85 : -0.85, 1.4, 0], 30, 0.35);
  camMove(x, [0, 1.6, 5.4], [0, 1.6, 0], [0, 1.65, 4.6], [0, 1.65, 0], eo, 38); if (L > 2.9) { x.post.stat.value = 0.5 * seg(L, 2.9, 3.14); }
});
