
// ================================ PART 3: CAMADA 3 — O ESCURO ================================
// Fazbear Entertainment files desk (all real 3D: desk, folders, papers, stamp, books, lamp) — lives in the void scene
const FILES = (() => { const g = new THREE.Group(); const M = (c, r = 0.7, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const B = (w, h, d, mat, x, y, z, p = g) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; p.add(b); return b; };
  const wood = M('#4a2e1c', 0.6); B(2.6, 0.08, 1.2, wood, 0, 0.94, 0); for (const sx of [-1.2, 1.2]) for (const sz of [-0.5, 0.5]) B(0.08, 0.92, 0.08, wood, sx, 0.46, sz);
  B(2.5, 0.5, 0.05, wood, 0, 0.66, -0.55);
  const folderM = [M('#c8a868'), M('#b89858'), M('#d2b478')]; const paper = M('#eeeae0', 0.9); const r = rng(77);
  for (let i = 0; i < 9; i++) { const f = B(0.42, 0.025, 0.32, folderM[i % 3], -0.9 + r() * 0.5, 0.995 + i * 0.026, -0.25 + r() * 0.2); f.rotation.y = (r() - 0.5) * 0.4; }
  for (let i = 0; i < 6; i++) { const p = B(0.3, 0.004, 0.4, paper, 0.1 + r() * 0.6, 0.985 + i * 0.002, 0.05 + r() * 0.25); p.rotation.y = (r() - 0.5) * 0.9; }
  // open folder (animated): cover pivot + photo + red stamp marks
  const of = new THREE.Group(); of.position.set(0.2, 0.99, 0.1); g.add(of); B(0.42, 0.012, 0.32, folderM[0], 0.21, 0, 0, of); const pp = B(0.3, 0.004, 0.26, paper, 0.21, 0.01, 0, of);
  B(0.1, 0.005, 0.12, M('#3a3a44'), 0.12, 0.014, -0.05, of); for (let i = 0; i < 5; i++) B(0.14, 0.004, 0.012, M('#5a5a66'), 0.27, 0.014, -0.08 + i * 0.03, of);
  const stampMark = B(0.16, 0.005, 0.06, new THREE.MeshStandardMaterial({ color: '#c01818', roughness: 0.8, transparent: true, opacity: 0.9 }), 0.24, 0.016, 0.09, of); stampMark.rotation.y = 0.25;
  const cover = new THREE.Group(); of.add(cover); B(0.42, 0.012, 0.32, folderM[0], -0.21, 0, 0, cover); g.userData.cover = cover; g.userData.mark = stampMark;
  // rubber stamp
  const st = new THREE.Group(); g.add(st); B(0.1, 0.05, 0.06, M('#8a1010', 0.5), 0, 0.025, 0, st); B(0.03, 0.09, 0.03, M('#2a1a10'), 0, 0.09, 0, st); const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), M('#2a1a10')); knob.position.y = 0.15; st.add(knob); g.userData.stamp = st;
  // books
  const bookC = ['#7a1a1a', '#1a3a6a', '#2a5a2a', '#5a3a1a'];
  for (let i = 0; i < 4; i++) { const b = B(0.34, 0.07, 0.26, M(bookC[i]), -0.3 + i * 0.02, 1.02 + i * 0.07, 0.3, g); b.rotation.y = 0.2 * (i % 2 ? 1 : -1); }
  const ob = new THREE.Group(); ob.position.set(0.8, 0.985, 0.25); g.add(ob); const pageL = new THREE.Group(), pageR = new THREE.Group(); ob.add(pageL, pageR);
  B(0.24, 0.03, 0.32, M('#7a1a1a'), -0.12, 0, 0, pageL); B(0.22, 0.02, 0.3, paper, -0.12, 0.02, 0, pageL); B(0.24, 0.03, 0.32, M('#7a1a1a'), 0.12, 0, 0, pageR); B(0.22, 0.02, 0.3, paper, 0.12, 0.02, 0, pageR);
  for (let i = 0; i < 6; i++) { B(0.16, 0.003, 0.01, M('#555'), -0.12, 0.032, -0.1 + i * 0.04, pageL); B(0.16, 0.003, 0.01, M('#555'), 0.12, 0.032, -0.1 + i * 0.04, pageR); }
  g.userData.book = [pageL, pageR];
  // desk lamp
  const lp = new THREE.Group(); lp.position.set(-1.0, 0.98, -0.35); g.add(lp); B(0.2, 0.03, 0.2, M('#1a3a2a', 0.4, 0.5), 0, 0, 0, lp); const arm = B(0.03, 0.5, 0.03, M('#1a3a2a', 0.4, 0.5), 0, 0.25, 0, lp); const sh = B(0.32, 0.12, 0.16, M('#1a5a3a', 0.4, 0.4), 0.12, 0.52, 0.05, lp);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff2c0', toneMapped: false })); bulb.position.set(0.12, 0.46, 0.05); lp.add(bulb);
  const L = new THREE.SpotLight('#ffe2a8', 12, 4, 0.9, 0.6, 1.2); L.position.set(-0.88, 1.44, -0.3); L.target.position.set(0.2, 0.95, 0.15); L.castShadow = true; L.shadow.mapSize.set(1024, 1024); L.shadow.bias = -0.002; g.add(L, L.target); g.userData.lamp = L;
  return g; })();
EXTRA.push(FILES);
function files(x, red = 0) { const s = voidS(x, 0, 0, '#ff2a1a', 0.8); s.add(FILES); FILES.userData.lamp.intensity = 12; x.S.voidRim.intensity = 30 * red; x.S.voidRim.color.set('#ff2a1a');
  FILES.userData.cover.rotation.z = 0; FILES.userData.stamp.position.set(0.55, 0.98, -0.3); FILES.userData.mark.visible = false; FILES.userData.book.forEach((p, i) => p.rotation.z = 0); return s; }
// a plain seated pose for anyone at the S.office desk
function sitAt(x, name, scene, z = 0.15) { const g = put(x, name, scene, 0, -0.02, z, Math.PI); g.legR.piv.rotation.x = -1.5; g.legL.piv.rotation.x = -1.5; g.armR.piv.rotation.x = -1.1; g.armL.piv.rotation.x = -1.1; g.idle(x.t, 1); return g; }
// Fredbear plush: the real Fredbear model at plush size, sitting
function plush(x, s, p, ry = 0) { const f = put(x, 'fredbear', s, p[0], p[1], p[2], ry, 0.32 / 1.22); slump(f, 0); f.head.rotation.x = 0; return f; }
const SPK = (() => { const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: '#1a1a1e', roughness: 0.4, metalness: 0.5 }); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16), m); c.rotation.x = Math.PI / 2; g.add(c);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.012, 0.02, 16), new THREE.MeshStandardMaterial({ color: '#3a3a42', roughness: 0.6 })); cone.rotation.x = Math.PI / 2; cone.position.z = 0.02; g.add(cone);
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.008), new THREE.MeshBasicMaterial({ color: '#ff2a2a', toneMapped: false })); led.position.set(0.026, 0.026, 0.017); g.add(led); return g; })();
EXTRA.push(SPK);

// "Camada 3, o escuro"
at(267.9333, 'dive3', x => { dive(x, 2, ICE_DEPTHS[1], ICE_DEPTHS[2]); });
// "No FNAF 2, o Phone Guy fala uma coisa que quase todo mundo ignora"
at(272.64, 'fnaf2_phone', x => {
  const s = office(x); const L = x.L; phoneRing(x, L < 1.4 ? 1 : 0); const j = sitAt(x, 'jeremy', s); j.head.rotation.y = -0.45; j.head.rotation.x = 0.25;
  const pp = x.S.phone.position; if (L > 1.4) waves(x, s, new V3(pp.x, pp.y + 0.25, pp.z), 0.8, '#ffe8c0');
  camMove(x, [2.0, 1.55, 0.2], [0.85, 1.1, -0.78], [1.45, 1.4, -0.25], [0.85, 1.1, -0.78], eo, 40); fillOn(x, j, 1.2, 1.6);
});
// "Os novos animatrônicos tinham reconhecimento facial"
at(276.44, 'facial', x => {
  const s = x.S.screenroom; x.out.scene = s; x.out.screen = 'scan'; const c = x.S.crtScreenPos; const k = eio(x.u); x.S.crtLight.intensity = 3;
  cam(x, [c.x + mix(0.9, 0.25, k), c.y + mix(0.25, 0.08, k), c.z + mix(2.2, 0.95, k)], [c.x, c.y, c.z], 46); x.post.vig.value = 0.9;
});
// "ligado a um banco de dados criminal"
at(279.26, 'database', x => {
  const s = x.S.screenroom; x.out.scene = s; x.out.screen = 'db'; const c = x.S.crtScreenPos; const k = eio(x.u); x.S.crtLight.intensity = 3;
  cam(x, [c.x - mix(0.6, 0.2, k), c.y + 0.1, c.z + mix(1.3, 0.85, k)], [c.x, c.y, c.z], 46); x.post.vig.value = 0.9;
});
// "Uma pizzaria infantil" — kids jumping in the party room
function partyKids(x, s, n = 4) { const P = [[-1.6, -1.0], [-0.5, -0.3], [0.6, -0.8], [1.7, -0.2], [0.1, 0.6]];
  return P.slice(0, n).map(([px, pz], i) => { const k = put(x, 'kid' + i, s, px, Math.max(0, Math.sin(x.t * 6 + i * 1.7)) * 0.2, pz, 0.3 * Math.sin(i * 2)); k.idle(x.t, 1, i);
    aim(k, 'R', rootPt(k, -0.4, 1.9, 0.2), 0.5 + 0.5 * Math.sin(x.t * 6 + i)); aim(k, 'L', rootPt(k, 0.4, 1.9, 0.2), 0.5 + 0.5 * Math.sin(x.t * 6 + i + 1)); return k; }); }
at(281.02, 'kids_place', x => {
  const s = partyR(x); const L = x.L; partyKids(x, s, 5); camMove(x, [-1.4, 1.7, 5.0], [0, 0.8, -0.4], [0.8, 1.6, 4.4], [0, 0.8, -0.4], eo, 40); x.post.vig.value = 0.7;
});
// "ligada à polícia," — red and blue wash over the party
at(282.58, 'police_link', x => {
  const s = partyR(x); const L = x.L; partyKids(x, s, 5).forEach(k => k.root.position.y *= 0.3); const ph = Math.floor(x.t * 5) % 2; POL.forEach((l, i) => { s.add(l); l.position.set(i ? 3 : -3, 2.6, 2); l.intensity = i === ph ? 30 : 4; });
  camMove(x, [0.8, 1.9, 5.2], [0, 0.8, -0.4], [0.4, 1.8, 4.6], [0, 0.8, -0.4], eo, 40);
});
// "por quê?"
at(284.02, 'why', x => {
  const s = partyR(x); const L = x.L; const k = put(x, 'kid1', s, 0, 0, -0.3, 0); k.idle(x.t, 1); lookAtCam(x, k, 0.8); k.head.rotation.z = 0.25 * eo(seg(L, 0, 0.3));
  camMove(x, [0.3, 1.2, 1.9], [0, 1.15, -0.3], [0.15, 1.2, 1.5], [0, 1.2, -0.3], eo, 40); pop(x, x.FX.q1, s, headTop(k, 0.7), 0.15, 0.5);
});
// "Porque a empresa já sabia que tinha um assassino rodando" — the company's files
at(284.64, 'knew_files', x => {
  const s = files(x, 0.3); const L = x.L; FILES.userData.cover.rotation.z = -2.9 * eo(seg(L, 0.4, 1.1));
  const p = put(x, 'purpleguy', s, 0, 0, 0, Math.PI / 2); walkTo(p, [-3.5, 0, -2.4], [2.5, 0, -2.4], seg(L, 0, 3.0), 0.9); p.root.rotation.y = Math.PI / 2;
  camMove(x, [1.2, 1.6, 1.4], [0.2, 1.0, 0.1], [0.75, 1.45, 0.9], [0.3, 1.0, 0.1], eo, 40);
});
// "e mesmo assim continuou aberta" — the pizzeria, lit and open
at(287.64, 'stayed_open', x => {
  const s = facade(x, 1.4); const L = x.L; x.S.doorPanes.forEach((p, i) => p.rotation.y = (i ? -1 : 1) * 1.2); x.S.logoLight.intensity = 3;
  camMove(x, [0.4, 1.7, 4.5], [0, 1.6, 0], [0.8, 2.6, 9.5], [0, 1.9, 0], eio, 40);
});
// "E é aqui que nasce uma das teorias mais perturbadoras" — back in the dark water
at(289.70, 'born', x => { const L = x.L; iceCam(x, mix(-20, -24, eio(x.u)), mix(0.5, 0.1, eio(x.u)), 22, -2, 46, 8); ice(x, { rush: 0.8 }); });
// "O verdadeiro vilão de FNAF não é só o William"
at(292.72, 'villain', x => {
  const s = voidS(x, 34, 26, '#a040ff', 1.5); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.6); lookAtCam(x, w, 0.6);
  camMove(x, [0.2, 1.65, 2.4], [0, 1.6, 0], [0.4, 2.2, 6.2], [0, 1.4, 0], eio, 36);
});
// "É a Fazbear Entertainment," — the files, red light
at(295.08, 'company', x => {
  const s = files(x, 1); const L = x.L; FILES.userData.cover.rotation.z = -2.9; FILES.userData.mark.visible = true; x.post.tint.value.set(1.1, 0.88, 0.85);
  const a = mix(-0.5, 0.4, eio(x.u)); cam(x, [Math.sin(a) * 2.4, 1.9, Math.cos(a) * 2.4], [0, 1.0, 0], 40);
});
// "uma empresa que passou décadas acobertando mortes para proteger a marca" — close the file, STAMP
at(296.88, 'coverup', x => {
  const s = files(x, 0.6); const L = x.L; const cv = FILES.userData.cover; cv.rotation.z = -2.9 * (1 - eio(seg(L, 0.3, 1.0)));
  const st = FILES.userData.stamp; const k1 = eio(seg(L, 1.3, 1.8)), k2 = ei(seg(L, 1.8, 1.95)), k3 = eo(seg(L, 2.2, 2.7));
  st.position.set(mix(0.55, 0.24 + 0.2, k1), 0.98 + mix(0.0, 0.35, k1) - 0.35 * k2 + 0.3 * k3, mix(-0.3, 0.12, k1)); FILES.userData.mark.visible = false;
  const mk = FILES.userData.mark; if (L > 1.95) { mk.visible = true; mk.removeFromParent(); FILES.add(mk); mk.position.set(0.44, 1.03, 0.12); }
  if (L > 1.95 && L < 2.15) shake(x, 0.4); camMove(x, [0.9, 1.6, 0.9], [0.3, 1.0, 0.1], [0.65, 1.45, 0.7], [0.35, 1.0, 0.1], eo, 40);
});
// "Nos livros e nas histórias oficiais aparece um conceito chamado"
at(300.66, 'books', x => {
  const s = files(x, 0); const L = x.L; FILES.userData.book.forEach((p, i) => p.rotation.z = (i ? -1 : 1) * 0.15 * (1 - eo(seg(L, 0.2, 1.0))));
  const b = FILES.userData.book[0].parent.position; camMove(x, [b.x + 0.7, 1.6, b.z + 0.9], [b.x, 1.0, b.z], [b.x + 0.3, 1.35, b.z + 0.55], [b.x, 1.0, b.z], eio, 40);
});
// "remanescente" — the glowing tank
at(303.98, 'remnant', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 1.0; x.S.shopLamp.intensity = 3; const t = tankAt(x, s, [-1.5, 1.01, -3.2], 0.85, 1.6); const c = t.position;
  [0, 1, 2].forEach(i => { const a = x.t * 1.6 + i * 2.1; orbAt(x, i, s, new V3(c.x + Math.cos(a) * 0.18, c.y + 0.55 + 0.2 * Math.sin(x.t * 2 + i), c.z + Math.sin(a) * 0.18), 0.25); });
  const a = mix(-0.4, 0.3, eio(x.u)); cam(x, [c.x + Math.sin(a) * 2.0, c.y + 0.9, c.z + Math.cos(a) * 2.0], [c.x, c.y + 0.7, c.z], 42);
});
// "Uma espécie de resto de alma que fica grudado no metal depois de uma morte cheia de dor"
at(305.00, 'soul_rest', x => {
  const s = voidS(x, 24, 20, '#3ad8ff', 1); const L = x.L; const f = put(x, 'freddy', s, 0, 0, 0, 0); f.idle(x.t, 0.4); x.setXray(f, 0.85, 0.5, '#3ad8ff');
  f.root.updateMatrixWorld(true); f.endoParts.slice(0, 8).forEach((m, i) => { if (i < x.FX.sparkles.length) { const sp = x.FX.sparkles[i]; s.add(sp); m.getWorldPosition(sp.position); sp.position.x += 0.04 * Math.sin(i); sp.quaternion.copy(x.camera.quaternion); sp.scale.setScalar(0.5 * Math.max(0, Math.sin(x.t * 2 + i * 1.3)) ** 1.5); } });
  if (L > 3.2) { x.post.tint.value.set(1.15, 0.85, 0.85); } const a = mix(0.6, -0.4, eio(x.u)); cam(x, [Math.sin(a) * 3.0, 1.7, Math.cos(a) * 3.0], [0, 1.5, 0], 38);
});
// "E a teoria macabra é essa, o Afton descobriu isso"
at(309.82, 'discovered', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 1.0; x.S.shopLamp.intensity = 4; const t = tankAt(x, s, [-1.5, 1.01, -3.2], 0.85, 1.6);
  const w = put(x, 'william', s, -0.5, 0, -1.9, -2.45); w.idle(x.t, 0.6); w.head.rotation.x = 0.1; aim(w, 'R', new V3(-1.3, 1.6, -2.95), eo(seg(x.L, 0.6, 1.2)));
  const hp = tp(w, 'head', [0, 4, 4]); camMove(x, [-2.6, 1.9, -1.6], hp.toArray(), [-2.3, 1.85, -1.8], hp.toArray(), eo, 46); keyOn(x, s, [-1.5, 1.8, -3.1], hp.toArray(), 2.5, 0.6); KEY.color.set('#3ad8ff');
});
// "e ele não matava só por matar"
at(312.72, 'not_just', x => {
  const s = voidS(x, 14, 40, '#ff2a1a', 0.5); const L = x.L; s.fog = null; const p = put(x, 'purpleguy', s, 0, 0, 0, 0); p.idle(x.t, 0.6); lookAtCam(x, p, 0.8);
  for (let i = 0; i < 5; i++) ghostKid(x, i, s, [(i - 2) * 0.7, 0, -1.6], 0, 0.45); rimOn(x, s, [0, 3.8, -3.2], [0, 1.4, 0], 50, '#ff2a1a');
  camMove(x, [0.3, 1.1, 4.4], [0, 1.4, 0], [0.15, 1.3, 3.4], [0, 1.5, 0], eo, 38);
});
// "Ele também estava estudando,"
at(314.26, 'studying', x => {
  const s = x.S.screenroom; x.out.scene = s; x.out.screen = 'code'; const c = x.S.crtScreenPos; x.S.crtLight.intensity = 3; const L = x.L;
  const w = put(x, 'william', s, c.x + 0.1, 0, c.z + 1.25, Math.PI); w.idle(x.t, 0.6); w.head.rotation.x = 0.1; aim(w, 'R', new V3(c.x - 0.15, 0.95, c.z + 0.35), 0.9); aim(w, 'L', new V3(c.x + 0.25, 0.95, c.z + 0.35), 0.9);
  w.armR.piv.rotation.x += 0.08 * Math.sin(x.t * 22); w.armL.piv.rotation.x += 0.08 * Math.sin(x.t * 19 + 1);
  camMove(x, [c.x + 3.0, 1.75, c.z + 1.9], [c.x, 1.3, c.z + 0.8], [c.x + 2.7, 1.72, c.z + 1.7], [c.x, 1.3, c.z + 0.8], eo, 44); fillOn(x, w, 0.8, 1.8);
});
// "querendo entender como prender a alma de alguém numa máquina" — a soul pulled into an endoskeleton
at(317.20, 'trap_soul', x => {
  const s = voidS(x, 24, 26, '#3ad8ff', 1); const L = x.L; const sb = put(x, 'springbonnie', s, 0, 0, 0, 0); sb.idle(x.t, 0.4); x.setXray(sb, 0.85, 0.3 + 0.7 * seg(L, 0.9, 1.3), '#3ad8ff');
  const ch = tp(sb, 'torso', [0, 6, 1]); const k = eio(seg(L, 0, 1.1)); orbAt(x, 0, s, new V3(mix(1.4, ch.x, k), mix(2.2, ch.y, k), mix(1.0, ch.z, k)), 0.35);
  const a = mix(0.5, 0.1, eio(x.u)); cam(x, [Math.sin(a) * 3.0, 1.7, Math.cos(a) * 3.0], [0, 1.6, 0], 38); if (L > 1.05 && L < 1.12) x.post.flash.value = 0.06;
});
// "A pergunta que ninguém consegue responder é, por que isso?"
at(318.96, 'question', x => {
  const s = voidS(x, 36, 20, '#a040ff', 1.5); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.8); w.head.rotation.x = 0.3; w.head.rotation.y = -0.4 * eo(seg(L, 0.5, 1.5));
  const a = mix(-0.6, 0.6, eio(x.u)); cam(x, [Math.sin(a) * 3.2, 1.7, Math.cos(a) * 3.2], [0, 1.6, 0], 36); pop(x, x.FX.q1, s, headTop(w, 0.75), 2.5, 0.7);
});
// "Bem, segura essa pergunta que a resposta tá lá no fundo" — looking down into the red abyss
at(322.88, 'hold_q', x => {
  const L = x.L; const y = mix(-22, -27, eio(x.u)); iceCam(x, y, 0.3, 22, -14, 50, 10); ice(x, { red: 1 });
});
// "No FNAF 4, a pelúcia do Fredbear fala com a criança"
function bedKid(x, s) { const c = put(x, 'cchild', s, -2.4, 0.62, -0.7, 0.9); c.legR.piv.rotation.x = -1.5; c.legL.piv.rotation.x = -1.5; c.root.position.y = 0.62 - 0.56 * 0.76 + 0.09; c.idle(x.t, 0.5); return c; }
at(325.78, 'plush', x => {
  const s = bedroom(x, 0.8); const L = x.L; const c = bedKid(x, s); const p = plush(x, s, [-2.15, 0.71, 0.05], -0.6); p.head.rotation.y = -0.5 * eo(seg(L, 0.8, 1.3));
  c.head.rotation.y = 0.5 * eo(seg(L, 1.5, 2.0)); c.head.rotation.x = 0.25;
  camMove(x, [0.4, 1.9, 2.8], [-2.4, 1.2, -0.6], [-0.2, 1.8, 2.3], [-2.4, 1.2, -0.6], eo, 40); fillOn(x, c, 1.3, 1.2);
});
// "Ele conforta, dá conselho, sempre tá perto" — the boy hugs the plush
at(329.10, 'comforts', x => {
  const s = bedroom(x, 0.8); const L = x.L; const c = bedKid(x, s); const k = eo(seg(L, 0.2, 0.9)); const pp = [mix(-2.15, -2.13, k), mix(0.71, 0.86, k), mix(0.05, -0.25, k)];
  const p = plush(x, s, pp, mix(-0.6, -0.7, k)); const ch = tp(p, 'torso', [0, 6, 0]); aim(c, 'R', ch, k); aim(c, 'L', ch, k); c.head.rotation.x = 0.4 * k; c.head.rotation.y = 0.3 * k;
  camMove(x, [0.1, 1.85, 2.5], [-2.4, 1.2, -0.6], [-0.3, 1.8, 2.2], [-2.4, 1.2, -0.6], eo, 40); fillOn(x, c, 1.3, 1.2);
});
// "Mas tem fã que pergunta, brinquedo nenhum fala, então quem tá falando?"
at(331.72, 'who_talks', x => {
  const s = bedroom(x, 0.6); const L = x.L; const p = plush(x, s, [-2.15, 0.71, 0.05], 0.75); p.head.rotation.y = 0.1 * Math.sin(x.t * 2) * seg(L, 2.8, 3.4); const hp = tp(p, 'head', [0, 4, 4]);
  camMove(x, [hp.x + 1.1, hp.y + 0.35, hp.z + 0.8], hp.toArray(), [hp.x + 0.55, hp.y + 0.2, hp.z + 0.4], hp.toArray(), eio, 40); pop(x, x.FX.q1, s, [hp.x, hp.y + 0.22, hp.z], 3.2, 0.25);
  if (L > 3.2) waves(x, s, hp, 0.9, '#ffd080'); x.FX.waves.forEach(w => w.scale.multiplyScalar(0.3));
});
// "Uma teoria diz que a pelúcia tinha um alto-falante" — inside the plush: a speaker
at(336.08, 'speaker', x => {
  const s = bedroom(x, 0.6); const L = x.L; const p = plush(x, s, [-2.15, 0.71, 0.05], 0.75); const k = sm(seg(L, 0.3, 0.9)); p.body.visible = k < 0.5; p.bodyO.visible = k < 0.5;
  p.torso.add(SPK); SPK.position.set(0, 6 * U16, 0.6 * U16); SPK.scale.setScalar(1 / p.root.scale.x * 0.24 * k + 0.001); const ch = tp(p, 'torso', [0, 6, 2]);
  if (k > 0.5) waves(x, s, ch, 1.2, '#ff6a5a'); x.FX.waves.forEach(w => w.scale.multiplyScalar(0.25));
  camMove(x, [ch.x + 1.0, ch.y + 0.35, ch.z + 0.7], ch.toArray(), [ch.x + 0.6, ch.y + 0.22, ch.z + 0.4], ch.toArray(), eio, 40);
});
// "e que do outro lado tinha um pai ouvindo e observando o filho o tempo todo"
at(338.78, 'listening', x => {
  const s = x.S.screenroom; x.out.scene = s; x.out.screen = 'static'; const c = x.S.crtScreenPos; x.S.crtLight.intensity = 3; const L = x.L;
  const w = put(x, 'william', s, c.x + 0.1, 0, c.z + 1.25, Math.PI); w.idle(x.t, 0.4); w.head.rotation.x = 0.05; aim(w, 'L', rootPt(w, 0.35, 1.7, 0.2), 0.9);
  camMove(x, [c.x - 3.0, 1.75, c.z + 1.9], [c.x, 1.3, c.z + 0.8], [c.x - 2.7, 1.72, c.z + 1.7], [c.x, 1.3, c.z + 0.8], eo, 44); fillOn(x, w, 1.2, 1.8);
  x.post.tint.value.set(0.9, 0.95, 1.1);
});
// "Alguns dizem que isso era cuidado,"
at(342.36, 'care', x => {
  const s = voidS(x, 40, 10, '#ffd0a0', 3); const L = x.L; s.fog = null; const w = put(x, 'william', s, -0.3, 0, 0, 0.2), c = put(x, 'cchild', s, 0.35, 0, 0.25, -0.15); w.idle(x.t, 0.8); c.idle(x.t, 1);
  aim(w, 'L', tp(c, 'head', [0, 9, 0]), eo(seg(L, 0.1, 0.6))); w.head.rotation.x = 0.35; w.head.rotation.y = -0.3; lookAtCam(x, c, 0.5); c.head.rotation.z = 0.15;
  camMove(x, [0.5, 1.3, 3.0], [0, 1.15, 0], [0.3, 1.3, 2.5], [0, 1.2, 0], eo, 38); x.post.tint.value.set(1.08, 1.0, 0.88);
});
// "outros chamam de experimento" — the bedroom seen through a security camera
at(344.44, 'experiment', x => {
  const s = bedroom(x, 0.7); const L = x.L; const c = bedKid(x, s); c.head.rotation.x = 0.3; plush(x, s, [-2.15, 0.71, 0.05], -0.6);
  cam(x, [1.6, 3.0, 2.6], [-2.2, 0.7, -0.5], mix(46, 34, eio(x.u))); x.post.cctv.value = 0.9; x.out.ui = 'CAM 04'; x.post.tint.value.set(1.05, 0.85, 0.85);
});
