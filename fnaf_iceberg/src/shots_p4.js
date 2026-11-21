
// ================================ PART 4: CAMADA 4 — A FOSSA ================================
const SM = (c, r = 0.7, m = 0, e) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: m }, e ? { emissive: e, emissiveIntensity: 1.2 } : {}));
const BX = (p, w, h, d, mat, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; p.add(b); return b; };
function tileTex(a, b, n) { const c = document.createElement('canvas'); c.width = c.height = 2; const g = c.getContext('2d'); g.fillStyle = a; g.fillRect(0, 0, 2, 2); g.fillStyle = b; g.fillRect(0, 0, 1, 1); g.fillRect(1, 1, 1, 1);
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(n, n); t.colorSpace = THREE.SRGBColorSpace; return t; }
// ---------- ULTIMATE CUSTOM NIGHT office (after refs/ucn.webp): checker floor, hazard-striped doorways, desk + monitors + fan, extinguishers, plush pile, balloons, pipes ----------
const UCN = (() => { const s = new THREE.Scene(); s.background = new THREE.Color('#040306'); s.fog = new THREE.Fog('#040306', 8, 18); const g = new THREE.Group(); s.add(g); const r = rng(404);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), new THREE.MeshStandardMaterial({ map: tileTex('#d8d8d8', '#111114', 10), roughness: 0.35, metalness: 0.1 })); fl.rotation.x = -Math.PI / 2; fl.position.z = -0.5; fl.receiveShadow = true; g.add(fl);
  const wall = SM('#2a2a2e', 0.85), dark = SM('#141418', 0.9), metal = SM('#5a5e66', 0.4, 0.6), yel = SM('#e8c020', 0.6), blk = SM('#121212', 0.7);
  BX(g, 10, 4, 0.2, wall, 0, 2, -4.4); BX(g, 10, 0.2, 8, dark, 0, 4, -0.5); // back wall + ceiling
  for (const sx of [-1, 1]) { BX(g, 0.2, 4, 3.2, wall, sx * 4.4, 2, -3.0); BX(g, 0.2, 4, 2.6, wall, sx * 4.4, 2, 2.2); BX(g, 0.2, 1.3, 1.6, wall, sx * 4.4, 3.35, -0.6); BX(g, 0.05, 2.7, 1.6, SM('#000000', 1), sx * 4.5, 1.35, -0.6);
    for (let i = 0; i < 9; i++) for (const dz of [-1.45, 0.25]) BX(g, 0.24, 0.3, 0.12, i % 2 ? yel : blk, sx * 4.28, 0.15 + i * 0.3, -0.6 + dz + 0.6); // hazard stripes on the door frame
    for (let i = 0; i < 6; i++) BX(g, 0.24, 0.12, 0.27, i % 2 ? yel : blk, sx * 4.28, 2.76, -1.35 + i * 0.27); }
  for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4, 10), metal); p.position.set(-3.5 + i * 1.7 + r() * 0.3, 2, -4.2); g.add(p); }
  for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 10, 10), metal); p.rotation.z = Math.PI / 2; p.position.set(0, 3.5 + i * 0.18, -4.15); g.add(p); }
  BX(g, 1.4, 0.8, 0.1, blk, -2.4, 2.6, -4.28); BX(g, 1.2, 0.9, 0.1, blk, 2.2, 2.4, -4.28); BX(g, 0.8, 0.5, 0.1, SM('#3a3a40', 0.5, 0.5), 0.2, 3.2, -4.28); // dark frames + vent
  for (let i = 0; i < 5; i++) BX(g, 0.7, 0.03, 0.12, metal, 0.2, 3.02 + i * 0.09, -4.22);
  // desk + monitors + fan + cup + papers
  const wood = SM('#3a2a20', 0.7); BX(g, 3.0, 0.1, 1.0, wood, 0, 0.95, -1.3); BX(g, 3.0, 0.9, 0.06, wood, 0, 0.47, -1.78); for (const sx of [-1.45, 1.45]) BX(g, 0.08, 0.9, 1.0, wood, sx, 0.45, -1.3);
  for (const [mx, w] of [[-0.75, 0.62], [0.55, 0.5], [1.15, 0.4]]) { BX(g, w, w * 0.78, 0.4, SM('#22242a', 0.6), mx, 1.0 + w * 0.39, -1.5); BX(g, w * 0.84, w * 0.62, 0.02, SM('#0a1a14', 0.5, 0, '#1a6a4a'), mx, 1.0 + w * 0.39, -1.29); }
  const fan = new THREE.Group(); fan.position.set(-0.1, 1.0, -1.25); g.add(fan); BX(fan, 0.1, 0.24, 0.1, metal, 0, 0.12, 0); const blades = new THREE.Group(); blades.position.set(0, 0.3, 0.08); fan.add(blades); for (let i = 0; i < 3; i++) { const b = new THREE.Group(); b.rotation.z = i * 2.09; blades.add(b); BX(b, 0.07, 0.22, 0.02, SM('#6a6a72', 0.5, 0.4), 0, 0.11, 0); }
  s.userData.fan = blades; const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.12, 12), SM('#e8e2d8', 0.5)); cup.position.set(0.95, 1.06, -1.0); g.add(cup);
  for (let i = 0; i < 4; i++) { const p = BX(g, 0.24, 0.004, 0.32, SM('#ece6d8', 0.9), -0.3 + i * 0.12, 1.005 + i * 0.002, -1.05); p.rotation.y = (r() - 0.5) * 0.8; }
  // extinguishers, plush pile, balloons
  for (let i = 0; i < 3; i++) { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.6, 12), SM('#c81818', 0.4, 0.2)); e.position.set(-3.9 + i * 0.28, 0.3, -1.9 - i * 0.1); g.add(e); BX(g, 0.06, 0.12, 0.06, blk, -3.9 + i * 0.28, 0.66, -1.9 - i * 0.1); }
  const plushC = ['#8a5a30', '#5a4a9a', '#e8c030', '#c83a2a', '#e8e8f0', '#d8a020']; for (let i = 0; i < 14; i++) { const sz = 0.22 + r() * 0.16; BX(g, sz, sz, sz, SM(plushC[i % 6], 0.95), -3.6 + r() * 1.2, sz / 2 + (i > 8 ? 0.25 : 0), -0.2 + r() * 1.0); }
  const balC = ['#7a2ad8', '#d82a4a', '#2a6ad8']; for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), SM(balC[i], 0.3, 0.1)); b.scale.y = 1.2; b.position.set(2.8 + i * 0.35, 2.4 + i * 0.25, -3.6 + i * 0.1); g.add(b); BX(g, 0.008, 1.6, 0.008, SM('#ddd'), 2.8 + i * 0.35, 1.5 + i * 0.12, -3.6 + i * 0.1); }
  // lights: hanging bulb over the desk, dim cold fill, red alarm glow
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff0c8', toneMapped: false })); bulb.position.set(0, 3.2, -1.0); g.add(bulb); BX(g, 0.01, 0.8, 0.01, blk, 0, 3.6, -1.0);
  const L = new THREE.SpotLight('#ffe6c0', 30, 9, 0.9, 0.6, 1.3); L.position.set(0, 3.15, -1.0); L.target.position.set(0, 0, -0.6); L.castShadow = true; L.shadow.mapSize.set(1024, 1024); L.shadow.bias = -0.002; s.add(L, L.target);
  s.add(new THREE.HemisphereLight('#7a7a9a', '#140c0c', 1.3)); { const f = new THREE.PointLight('#c8d0ff', 6, 10, 1.5); f.position.set(0, 2.2, 2.5); s.add(f); } const red = new THREE.PointLight('#ff2a1a', 0, 9, 1.4); red.position.set(0, 2.6, 1.5); s.add(red);
  s.userData.lamp = L; s.userData.red = red; return s; })();
function ucn(x, red = 0) { const s = UCN; x.out.scene = s; s.userData.fan.rotation.z = x.t * 25; s.userData.lamp.intensity = 18 * (red > 0.5 ? 0.6 + 0.4 * flicker(x.t, 2) : 1); s.userData.red.intensity = 14 * red; x.post.vig.value = 0.95; return s; }
// ---------- THE PIT: dark ball pit (after refs/pit.jpg) ----------
const PIT = (() => { const s = new THREE.Scene(); s.background = new THREE.Color('#05030a'); s.fog = new THREE.Fog('#05030a', 6, 16); const r = rng(1985);
  const cols = ['#c8202a', '#2050d8', '#e8c020', '#20a040', '#e86a10', '#8a2ad8']; const geo = new THREE.SphereGeometry(1, 12, 9); const m4 = new THREE.Matrix4();
  cols.forEach((c, k) => { const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.05 }), 520); let n = 0;
    for (let i = 0; i < 520; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 6.5; const px = Math.cos(a) * d, pz = -1 + Math.sin(a) * d * 0.8; const rad = 0.13 + r() * 0.03;
      const top = 0.3 + 0.06 * Math.sin(px * 3) * Math.cos(pz * 2.5); const py = top - r() * 0.35; m4.compose(new V3(px, py, pz), new THREE.Quaternion(), new V3(rad, rad, rad)); im.setMatrixAt(n++, m4); }
    im.count = n; im.receiveShadow = true; s.add(im); });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), SM('#0a0810', 0.9)); fl.rotation.x = -Math.PI / 2; fl.position.y = -0.1; s.add(fl);
  // netting + padded walls behind
  const net = SM('#1a1a22', 0.8); for (let i = 0; i < 26; i++) BX(s, 0.015, 3.2, 0.015, net, -6.5 + i * 0.5, 1.6, -5.2); for (let j = 0; j < 7; j++) BX(s, 13, 0.015, 0.015, net, 0, 0.4 + j * 0.5, -5.2);
  BX(s, 13, 0.5, 0.4, SM('#2a1a4a', 0.9), 0, 0.25, -5.0);
  const rim = new THREE.SpotLight('#b060ff', 60, 14, 0.7, 0.5, 1.2); rim.position.set(0, 3.5, -4.5); rim.target.position.set(0, 0.6, 0); s.add(rim, rim.target);
  const key = new THREE.SpotLight('#ff8a5a', 8, 12, 0.6, 0.7, 1.3); key.position.set(1.5, 2.6, 5); key.target.position.set(0, 0.6, -0.5); s.add(key, key.target);
  s.add(new THREE.HemisphereLight('#3a2a6a', '#05030a', 0.5)); s.userData.rim = rim; s.userData.key = key; return s; })();
function pit(x, band = 1) { const s = PIT; x.out.scene = s; x.post.vig.value = 1.0; s.userData.rim.intensity = 60; s.userData.key.intensity = 8;
  if (band > 0) [['freddy', -1.65, '#5ab0ff'], ['chica', -0.55, '#ff8a2a'], ['bonnie', 0.55, '#ff8a2a'], ['foxy', 1.65, '#ffd040']].forEach(([n, px, ec], i) => {
    const c = put(x, n, s, px, mix(-2.4, -1.75, band) + 0.04 * Math.sin(x.t * 1.3 + i), -0.8 - 0.15 * Math.abs(px), -px * 0.08); c.idle(x.t, 0.6, i); c.setEyeGlow(ec, band); c.head.rotation.x = -0.05; });
  return s; }
// ---------- props: VR headset, circuit boards ----------
const VR = (() => { const g = new THREE.Group(); BX(g, 0.24, 0.13, 0.12, SM('#18181c', 0.3, 0.3), 0, 0, 0); BX(g, 0.22, 0.11, 0.01, SM('#0a0a10', 0.1, 0.6), 0, 0, 0.065);
  for (const sx of [-1, 1]) { const l = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), new THREE.MeshBasicMaterial({ color: '#7a3aff', toneMapped: false })); l.position.set(sx * 0.05, 0, -0.061); l.rotation.y = Math.PI; g.add(l); }
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 6, 24), SM('#222', 0.8)); strap.rotation.x = Math.PI / 2; strap.scale.set(1, 1.35, 1); strap.position.z = -0.15; g.add(strap); return g; })();
const PCB = (() => { const g = new THREE.Group(); const r = rng(5); for (let b = 0; b < 3; b++) { const bd = new THREE.Group(); bd.position.set(-0.55 + b * 0.55, b * 0.012, (b % 2) * 0.1); bd.rotation.y = (b - 1) * 0.15; g.add(bd);
    BX(bd, 0.46, 0.012, 0.32, SM('#1a5a2a', 0.5, 0.1), 0, 0, 0); for (let i = 0; i < 10; i++) BX(bd, 0.3 * r() + 0.05, 0.002, 0.004, SM('#d8b040', 0.3, 0.8), (r() - 0.5) * 0.3, 0.008, (r() - 0.5) * 0.26);
    for (let i = 0; i < 4; i++) BX(bd, 0.06 + r() * 0.04, 0.012, 0.05, SM('#111', 0.4, 0.3), (r() - 0.5) * 0.3, 0.012, (r() - 0.5) * 0.22);
    for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8), SM('#2a4aa8', 0.4)); c.position.set((r() - 0.5) * 0.3, 0.02, (r() - 0.5) * 0.22); bd.add(c); } }
  return g; })();
EXTRA.push(VR, PCB);
const BAND_JS = ['freddy', 'chica', 'foxy', 'baby'];

// "Camada 4, a fossa"
at(346.6, 'dive4', x => { dive(x, 3, ICE_DEPTHS[2], ICE_DEPTHS[3]); });
// "Daqui pra baixo eu aviso, tudo é teoria pesada, escondida e que a maioria dos fãs nunca viu"
at(351.42, 'warning4', x => { const L = x.L; const k = eio(x.u); iceCam(x, mix(-31, -37, k), mix(-0.2, 0.3, k), 24, -3, 46, mix(14, -14, k)); ice(x, { rush: 0.7, red: 0.25 }); });
// "Respira fundo" — a burst of bubbles
at(358.56, 'breathe', x => { const L = x.L; iceCam(x, -37.5, 0.3, 20, 0.5, 50, -12); ice(x, { rush: 5 * (1 - seg(L, 0, 1.0)) + 0.6, red: 0.25 }); x.S.iceBubbles.forEach(b => b.scale.setScalar(0.7)); });
// "Depois do incêndio da Fazbear's Fright, William deveria estar acabado"
at(359.56, 'fire', x => {
  const s = fright(x, 0.8); const L = x.L; const c = put(x, 'spring', s, 0, 0, -5.2, 0); const k = eio(seg(L, 1.6, 3.4)); twitch(c, x.t, 1.4); c.idle(x.t, 1);
  c.root.position.y = -(c.hipY - 2 * U16) * c.root.scale.x * k; c.legR.piv.rotation.x = -1.5 * k; c.legL.piv.rotation.x = -1.5 * k; c.head.rotation.x = 0.5 * k; aim(c, 'R', rootPt(c, -0.5, 2.0, 0.5), 0.8 * (1 - k));
  fireAt(x, s, -1.7, -6.0, 0.5, 3, 2.2, 6); x.FX.fire.userData.fl.forEach((m, i) => { if (i % 2) m.position.x += 3.4; }); x.S.frLamps.forEach(l => l.intensity = 1.5);
  camMove(x, [0.5, 1.6, -1.6], [0, 1.6, -5.2], [0.25, 1.4, -2.6], [0, 1.1, -5.2], eio, 44); x.post.tint.value.set(1.15, 0.92, 0.8); fillOn(x, c, 1.2, 1.8);
});
// "Mas a Fazbear Entertainment decidiu fazer um jogo de" — a VR headset on the company desk
at(363.46, 'vr', x => {
  const s = files(x, 0); const L = x.L; s.add(VR); VR.position.set(0.25, 1.05 + 0.02 * Math.sin(x.t * 2), 0.15); VR.rotation.set(0.15, mix(2.4, 3.3, eio(x.u)), 0);
  camMove(x, [1.0, 1.4, 1.1], [0.25, 1.05, 0.15], [0.62, 1.25, 0.7], [0.25, 1.05, 0.15], eio, 40);
});
// "realidade virtual" — Help Wanted logo over the blurred desk
at(366.54, 'logo_hw', x => {
  const s = files(x, 0); s.add(VR); VR.position.set(0.25, 1.07, 0.15); VR.rotation.set(0.15, 3.3, 0); cam(x, [0.62, 1.25, 0.7 - 0.1 * x.u], [0.25, 1.05, 0.15], 40); logoCard(x, 2); x.post.blur.value = 1;
});
// "Usando placas de circuito dos animatrônicos antigos"
at(367.48, 'boards', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 0.9; const L = x.L; s.add(PCB); PCB.position.set(-0.7, 1.02, -2.75); PCB.rotation.set(0, 0.2, 0); x.S.shopLamp.intensity = 12;
  const c = put(x, 'freddy', s, 1.6, 0, -2.9, -0.6); droop(c, 0.8); x.setXray(c, 0.7, 0.2, '#40ff70');
  camMove(x, [-1.6, 1.5, -1.6], [-0.7, 1.02, -2.75], [-1.1, 1.35, -2.05], [-0.6, 1.02, -2.75], eo, 40);
});
// "Placas que carregavam pedaços do remanescente" — cyan specks rising off the boards
at(370.56, 'boards_glow', x => {
  const s = x.S.shop; x.out.scene = s; x.post.vig.value = 1.0; const L = x.L; s.add(PCB); PCB.position.set(-0.7, 1.02, -2.75); PCB.rotation.set(0, 0.2, 0); x.S.shopLamp.intensity = 4;
  sparkles(x, s, [-0.7, 1.25 + 0.1 * Math.sin(x.t), -2.7], 0.35, 8, 0.18); keyOn(x, s, [-0.7, 1.6, -2.4], [-0.7, 1.0, -2.75], 8 * sm(seg(L, 0.2, 0.8)), 0.8); KEY.color.set('#3ad8ff');
  camMove(x, [-1.1, 1.4, -2.0], [-0.7, 1.1, -2.75], [-0.95, 1.3, -2.25], [-0.7, 1.12, -2.75], eio, 40);
});
// "Pedaços dele, e ele voltou, agora como um vírus,"
at(373.48, 'virus', x => {
  const s = x.S.screenroom; x.out.scene = s; const L = x.L; x.out.screen = L > 1.6 ? 'virus' : 'static'; x.S.screenLamp.intensity = 1.0; x.S.neonMat.opacity = 0; x.S.neonLight.intensity = 0;
  const p = x.S.crtScreenPos; const k = eio(seg(L, 0.2, 1.7)); orbAt(x, 0, s, new V3(mix(1.6, p.x, k), mix(1.1, p.y, k), mix(1.4, p.z + 0.05, k)), 0.4 * (1 - seg(L, 1.6, 1.9)));
  x.S.crtLight.intensity = L > 1.6 ? 4 : 1.5; cam(x, [p.x + mix(1.4, 0.4, eio(x.u)), p.y + 0.15, p.z + mix(2.6, 1.2, eio(x.u))], [p.x, p.y, p.z], 46); if (L > 1.6 && L < 1.7) x.post.flash.value = 0.25;
});
// "o Glitchtrap"
at(377.18, 'glitchtrap', x => {
  const s = voidS(x, 36, 30, '#a05aff'); const L = x.L; const g = put(x, 'glitchtrap', s, 0, 0, 0, 0); g.idle(x.t, 1); glitchIn(x, g, 1 - 0.6 * seg(L, 0.2, 0.6)); lookAtCam(x, g, 0.6);
  const hp = tp(g, 'head', [0, 4, 4]); camMove(x, [0.6, 1.6, 3.4], [0, 1.8, 0], [hp.x + 0.2, hp.y, hp.z + 1.8], hp.toArray(), eio, 40); staticIn(x, 0.12);
});
// "Pedaços de Afton, e ele voltou, agora como um vírus," — he dances out of the static
at(377.86, 'glitch_dance', x => {
  const s = voidS(x, 30, 34, '#a05aff', 2); const L = x.L; const g = put(x, 'glitchtrap', s, 0, 0, 0, 0); g.idle(x.t, 1); lookAtCam(x, g, 0.7);
  const sw = Math.sin(x.t * 3); g.torso.rotation.z = 0.12 * sw; aim(g, 'R', rootPt(g, -0.6, 1.9 + 0.2 * sw, 0.4), 0.8); aim(g, 'L', rootPt(g, 0.55, 1.4 - 0.2 * sw, 0.5), 0.6); g.head.rotation.z = -0.2 * sw;
  if (Math.sin(x.t * 5.3) > 0.85) glitchIn(x, g, 0.8); const a = mix(-0.7, 0.7, eio(x.u)); cam(x, [Math.sin(a) * 3.6, 1.6, Math.cos(a) * 3.6], [0, 1.6, 0], 38); x.post.chroma.value = 0.3;
});
// "o Glitchtrap" (again)
at(381.78, 'glitch2', x => {
  const s = voidS(x, 30, 34, '#a05aff', 2); const L = x.L; const g = put(x, 'glitchtrap', s, 0, 0, 0, 0); g.idle(x.t, 1); lookAtCam(x, g, 1); g.head.rotation.z = 0.25 * eo(seg(L, 0, 0.3));
  const hp = tp(g, 'head', [0, 4, 4]); camMove(x, [hp.x + 0.3, hp.y, hp.z + 1.4], hp.toArray(), [hp.x + 0.1, hp.y, hp.z + 1.0], hp.toArray(), eo, 36); staticIn(x, 0.1); glitchIn(x, g, 0.3);
});
// "Uma consciência digital que se infiltrou na mente de uma funcionária, a Vanessa," — a faceless worker with the headset, him whispering behind
at(382.48, 'vanessa', x => {
  const s = voidS(x, 0, 50, '#a05aff', 0.04); const L = x.L; s.fog = null; const v = put(x, 'guard', s, 0, 0, 0, 0); x.post.tint.value.set(0.6, 0.55, 0.75); v.idle(x.t, 0.5); v.head.rotation.x = 0.1;
  v.root.updateMatrixWorld(true); s.add(VR); v.head.getWorldPosition(VR.position); VR.position.y += 0.27; VR.position.z += 0.2; VR.rotation.set(0, Math.PI, 0); VR.scale.setScalar(1.6);
  const g = put(x, 'glitchtrap', s, 0.75, 0, -0.9, -0.5); g.idle(x.t, 1); x.post.chroma.value = 0.35; g.head.rotation.y = -0.4; g.head.rotation.x = 0.2; aim(g, 'R', tp(v, 'head', [4, 4, 0]), 0.7);
  rimOn(x, s, [0, 3.5, -3], [0, 1.6, 0], 60, '#a05aff'); camMove(x, [-0.6, 1.6, 3.4], [0.2, 1.6, 0], [-0.4, 1.65, 2.6], [0.25, 1.65, 0], eo, 38);
});
// "e transformou ela na Vanny"
at(387.10, 'vanny', x => {
  const s = voidS(x, 34, 30, '#ff3a6a', 2); const L = x.L; const v = put(x, 'vanny', s, 0, 0, 0, 0); v.idle(x.t, 1); lookAtCam(x, v, eo(seg(L, 0.3, 0.7))); v.head.rotation.z = 0.3 * eo(seg(L, 0.5, 0.9));
  staticIn(x, 0.15); camMove(x, [0.5, 1.4, 3.6], [0, 1.4, 0], [0.2, 1.55, 2.6], [0, 1.6, 0], eo, 38); fillOn(x, v, 0.6, 1.8);
});
// "William Afton não precisa mais de corpo, ele vive agora em qualquer lugar onde existe um fio"
at(388.40, 'no_body', x => {
  const s = x.S.screenroom; x.out.scene = s; const L = x.L; x.out.screen = 'virus'; x.S.crtLight.intensity = 3; x.S.neonMat.opacity = 0; x.S.neonLight.intensity = 0;
  const spots = [[1.2, -0.6], [-1.4, -0.2], [0.2, 0.6]]; const i = Math.floor(L / 1.7) % 3; const g = put(x, 'glitchtrap', s, spots[i][0], 0, spots[i][1], -spots[i][0] * 0.3); g.idle(x.t, 1); glitchIn(x, g, 0.7); lookAtCam(x, g, 0.6);
  if ((L % 1.7) < 0.06) x.post.stat.value = 0.3; const c = x.S.crtScreenPos; camMove(x, [c.x + 0.2, 1.7, c.z + 4.4], [c.x, 1.3, c.z], [c.x - 0.3, 1.6, c.z + 3.4], [c.x, 1.3, c.z], eo, 44); fillOn(x, g, 1.2, 1.8);
});
// "Ultimate Custom Night" — UCN logo over the office
at(393.46, 'logo_ucn', x => { const s = ucn(x); cam(x, [0, 1.75, 2.6 - 0.2 * x.u], [0, 1.4, -1.5], 50); logoCard(x, 1); x.post.blur.value = 1; });
// "é um jogo sem história... Aparentemente"
at(395.00, 'ucn_office', x => {
  const s = ucn(x); const L = x.L; camMove(x, [0.2, 1.8, 3.4], [0, 1.3, -1.6], [0.0, 1.65, 1.7], [0, 1.25, -1.8], eio, 50); if (L > 2.4) x.camera.rotateZ(0.05 * eo(seg(L, 2.4, 2.9)));
});
// "Mas uma das teorias mais aceitas diz que esse escritório é um purgatório" — William at the desk, red creeping in
function ucnWill(x, s) { const w = put(x, 'william', s, 0, 0, -2.1, 0); w.legR.piv.rotation.x = -1.5; w.legL.piv.rotation.x = -1.5; w.root.position.y = -0.02; w.armR.piv.rotation.x = -1.2; w.armL.piv.rotation.x = -1.2; w.idle(x.t, 1); return w; }
at(397.88, 'purgatory', x => {
  const L = x.L; const s = ucn(x, sm(seg(L, 1.0, 3.6))); const w = ucnWill(x, s); w.head.rotation.x = 0.15; w.head.rotation.y = 0.2 * Math.sin(x.t * 0.9);
  camMove(x, [-0.4, 1.7, 1.6], [0, 1.4, -2.0], [-0.2, 1.62, 0.6], [0, 1.45, -2.0], eio, 44); x.post.tint.value.set(1, mix(1, 0.85, seg(L, 1, 3.6)), mix(1, 0.85, seg(L, 1, 3.6)));
});
// "William preso numa noite que nunca acaba," — figures in both doorways
at(401.96, 'trapped', x => {
  const s = ucn(x, 1); const L = x.L; const w = ucnWill(x, s); w.head.rotation.y = 0.6 * Math.sin(x.t * 2.5); w.torso.rotation.z = 0.03 * Math.sin(x.t * 9);
  const a = put(x, 'freddy', s, -4.2, 0, -0.6, Math.PI / 2 - 0.2); a.idle(x.t, 0.4); a.setEyeGlow('#ffffff', 0.8); const b = put(x, 'bonnie', s, 4.2, 0, -0.6, -Math.PI / 2 + 0.2); b.idle(x.t, 0.4, 1); b.setEyeGlow('#ff3020', 0.8);
  camMove(x, [0, 2.2, 3.6], [0, 1.4, -1.6], [0, 2.0, 2.8], [0, 1.4, -1.6], eo, 54); x.post.tint.value.set(1.05, 0.88, 0.88);
});
// "atacado pra sempre por todas as vítimas" — jumpscare after jumpscare
at(404.26, 'attacked', x => {
  const s = ucn(x, 1); const L = x.L; const i = Math.min(3, Math.floor(L / 0.57)); const l = L - i * 0.57; cam(x, [0, 1.6, -0.6], [0, 1.55, -3], 50);
  const c = put(x, BAND_JS[i], s, 0, 0, 0, 0); if (c.setEyeGlow) c.setEyeGlow('#ffffff', 1); if (c.setEyes) c.setEyes('#5aff6a'); jumpscare(x, c, l, { from: 2.2, to: 1.15, headY: c === x.C.baby ? 1.85 : 1.78 }); x.post.stat.value = l > 0.45 ? 0.6 : x.post.stat.value;
});
// "E quem estaria mantendo ele lá?"
at(406.54, 'who_keeps', x => {
  const s = ucn(x, 0.4); const L = x.L; const w = ucnWill(x, s); w.head.rotation.y = 0.9 * eo(seg(L, 0.4, 1.0)); const g = put(x, 'golden', s, 4.25, 0, -0.6, -Math.PI / 2); g.idle(x.t, 0.3); g.root.visible = Math.sin(x.t * 23) > -0.2 && L > 1.3;
  camMove(x, [-1.4, 1.8, 1.6], [1.0, 1.4, -1.6], [-1.0, 1.75, 1.0], [2.5, 1.5, -1.0], eio, 46);
});
// "O espírito mais antigo, mais quieto e mais poderoso de todos"
at(408.94, 'oldest', x => {
  const s = voidS(x, 10, 40, '#ffd040', 1); const L = x.L; const g = put(x, 'golden', s, 0, 0, 0, 0); slump(g, 1); g.root.position.y += 0.25 * sm(seg(L, 1.0, 3.4)); g.head.rotation.x = mix(0.5, 0.2, sm(seg(L, 1.6, 3.2)));
  sparkles(x, s, [0, 1.0, 0], 1.0, 8, 0.5 * seg(L, 0.5, 1.5)); rimOn(x, s, [0, 3.6, -3], [0, 0.8, 0], 60, '#ffd040'); camMove(x, [0.4, 1.0, 4.4], [0, 0.9, 0], [0.2, 1.2, 3.0], [0, 1.0, 0], eio, 38);
});
// "O Golden Freddy" — eyes ignite
at(412.40, 'golden2', x => {
  const s = voidS(x, 30, 40, '#ffd040', 2); const L = x.L; const g = put(x, 'golden', s, 0, 0, 0, 0); g.idle(x.t, 0.4); lookAtCam(x, g, 1); g.setEyeGlow('#ffffff', sm(seg(L, 0.4, 0.7)));
  const hp = tp(g, 'head', [0, 4, 4]); camMove(x, [hp.x + 0.3, hp.y - 0.1, hp.z + 2.0], hp.toArray(), [hp.x + 0.1, hp.y, hp.z + 1.2], hp.toArray(), eio, 34); if (L > 0.4 && L < 0.5) x.post.flash.value = 0.15;
});
// "Só que tem uma teoria rival que diz que não é ele,"
at(413.82, 'rival', x => {
  const s = voidS(x, 26, 30, '#ffd040', 1.5); const L = x.L; const g = put(x, 'golden', s, -0.6, 0, 0, 0.3); g.idle(x.t, 0.4); g.root.visible = L < 2.0 || Math.sin(x.t * 31) > 0.4;
  glitchIn(x, g, seg(L, 1.0, 2.6)); x.S.voidRim.color.lerp(new THREE.Color('#a040ff'), seg(L, 1.4, 2.8));
  camMove(x, [0.4, 1.6, 4.4], [-0.3, 1.5, 0], [0.8, 1.6, 3.8], [0.2, 1.5, 0], eo, 38);
});
// "que tem outra criança cheia de ódio ainda mais vingativa" — a purple, burning little ghost
at(416.70, 'hate', x => {
  const s = voidS(x, 6, 40, '#a040ff', 0.4); const L = x.L; s.fog = null; const a = put(x, 'gAndrew', s, 0, 0.2 + 0.08 * Math.sin(x.t * 2), 0, 0); a.idle(x.t, 1); a.ghostMat.opacity = 0.65; lookAtCam(x, a, 0.7);
  agonyAt(x, s, new V3(0, 0.3, 0), 0.8, 1);
  camMove(x, [0.3, 1.0, 3.2], [0, 1.0, 0], [0.15, 1.05, 2.3], [0, 1.05, 0], eio, 38); x.post.tint.value.set(1.05, 0.85, 1.15);
});
// "Uma criança cujo nome os livros revelam,"
at(419.70, 'books_name', x => {
  const s = files(x, 0); const L = x.L; FILES.userData.book.forEach((p, i) => p.rotation.z = (i ? -1 : 1) * 0.15 * (1 - eo(seg(L, 0.2, 1.0))));
  const b = FILES.userData.book[0].parent.position; camMove(x, [b.x - 0.5, 1.55, b.z + 0.8], [b.x, 1.0, b.z], [b.x - 0.2, 1.3, b.z + 0.45], [b.x, 1.0, b.z], eio, 40); x.post.tint.value.set(1.0, 0.92, 1.1);
});
// "Andrew"
at(422.52, 'andrew', x => {
  const s = voidS(x, 26, 40, '#a040ff', 1.5); const L = x.L; const a = put(x, 'andrew', s, 0, 0, 0, 0); a.idle(x.t, 0.6); lookAtCam(x, a, 1); a.head.rotation.x -= 0.1;
  const hp = tp(a, 'head', [0, 3, 0]); camMove(x, [hp.x + 0.25, hp.y + 0.05, hp.z + 2.8], hp.toArray(), [hp.x + 0.1, hp.y + 0.05, hp.z + 2.2], hp.toArray(), eo, 34); if (L < 0.06) x.post.flash.value = 0.15;
});
// "Seja quem for a ideia é a mesma, a vítima virou o carcereiro" — William behind bars, the guardians outside
at(422.94, 'jailer', x => {
  const s = voidS(x, 30, 30, '#ffd040', 1.5); const L = x.L; s.fog = null; s.add(x.FX.cage); x.FX.cage.position.set(0, 0, -0.6); x.FX.cage.scale.set(1.0, 0.95, 1);
  const w = put(x, 'william', s, 0, 0, -1.0, 0); w.idle(x.t, 1); aim(w, 'R', new V3(-0.2, 1.5, -0.62), 0.9); aim(w, 'L', new V3(0.2, 1.45, -0.62), 0.9); w.head.rotation.x = 0.15;
  const g = put(x, 'golden', s, -1.4, 0, 0.5, 0.5), a = put(x, 'gAndrew', s, 1.3, 0.1, 0.6, -0.5); g.idle(x.t, 0.4); a.idle(x.t, 1); a.ghostMat.opacity = 0.6; g.setEyeGlow('#ffffff', 0.6);
  camMove(x, [0.4, 1.6, 4.6], [0, 1.3, -0.4], [0.2, 1.55, 3.6], [0, 1.35, -0.4], eo, 40);
});
// "e o carcereiro não vai soltar ele nunca" — the lights go out on him
at(426.58, 'never_free', x => {
  const s = voidS(x, 30 * (1 - sm(seg(x.L, 1.2, 1.9))), 30, '#ffd040', 1); const L = x.L; s.fog = null; s.add(x.FX.cage); x.FX.cage.position.set(0, 0, -0.6); x.FX.cage.scale.set(1.0, 0.95, 1);
  const w = put(x, 'william', s, 0, 0, -1.0, 0); w.idle(x.t, 1); aim(w, 'R', new V3(-0.2, 1.5, -0.62), 1); aim(w, 'L', new V3(0.2, 1.45, -0.62), 1); w.head.rotation.x = -0.1; w.root.position.x = 0.02 * Math.sin(x.t * 30) * seg(L, 0.3, 1.2);
  const hp = tp(w, 'head', [0, 4, 4]); camMove(x, [hp.x + 0.4, hp.y - 0.1, 1.8], hp.toArray(), [hp.x + 0.2, hp.y - 0.05, 1.2], hp.toArray(), eo, 38);
});
// "Nos livros, existe um lugar chamado O Fosso" — the ball pit
at(428.58, 'pit', x => {
  const s = pit(x, 0); const L = x.L; camMove(x, [0.6, 1.9, 5.6], [0, 0.4, -1.5], [0.2, 1.3, 3.6], [0, 0.5, -1.5], eio, 40);
});
// "É uma piscina de bolinhas abandonada aqui, quando você mergulha" — a kid jumps in
at(431.26, 'dive_pit', x => {
  const s = pit(x, 0); const L = x.L; const k = put(x, 'kid2', s, 0, 0, 0, Math.PI); const j = seg(L, 2.4, 3.1);
  k.root.position.set(0.2, 0.3 + 1.2 * Math.sin(Math.PI * j * 0.7) - 2.2 * ei(seg(L, 2.8, 3.14)), mix(1.2, -0.6, j)); k.root.rotation.x = -0.6 * j; k.walk(L * 2.2 * (1 - j), 1); k.root.visible = L < 3.1;
  if (L < 2.4) walkTo(k, [0.6, 0.3, 2.6], [0.2, 0.3, 1.2], seg(L, 0, 2.4), 0.5);
  camMove(x, [2.4, 1.8, 4.8], [0, 0.6, 0], [1.9, 1.6, 4.0], [0, 0.4, -0.4], eo, 42);
});
// "te leva de volta pra 1985" — under the balls, a flash, warm light
at(434.40, 'back85', x => {
  const L = x.L; if (L < 0.8) { const s = pit(x, 0); cam(x, [0, mix(0.7, 0.05, eio(seg(L, 0, 0.8))), 0.3], [0, -0.6, -1], 50); x.post.blur.value = seg(L, 0.4, 0.8); }
  else { const [s] = (() => { const s = diner(x, 1.1); return [s]; })(); const k = seg(L, 0.8, 1.9); cam(x, [0, mix(4.0, 1.7, eio(k)), mix(-1.0, 1.6, eio(k))], [0, 1.6, -4.4], 46); put(x, 'fredbear', s, 0.9, 0.77, -4.4, -0.15).idle(x.t, 1); put(x, 'springbonnie', s, -0.9, 0.77, -4.4, 0.15).idle(x.t, 1, 2);
    x.post.flash.value = 0.8 * (1 - seg(L, 0.8, 1.3)); x.post.tint.value.set(1.15, 1.02, 0.82); x.post.chroma.value = 0.6 * (1 - seg(L, 0.8, 1.6)); }
});
// "Pro dia em que tudo começou" — the diner in its golden days
at(436.30, 'the_day', x => {
  const [s, f, b] = (() => { const s = diner(x, 1.1); const f = put(x, 'fredbear', s, 0.9, 0.77, -4.4, -0.15); f.idle(x.t, 1); const b = put(x, 'springbonnie', s, -0.9, 0.77, -4.4, 0.15); b.idle(x.t, 1, 2); return [s, f, b]; })(); const L = x.L;
  [[-1.4, -1.6], [-0.4, -1.2], [0.7, -1.5], [1.6, -1.1]].forEach(([px, pz], i) => { const k = put(x, 'kid' + i, s, px, Math.max(0, Math.sin(x.t * 6 + i)) * 0.15, pz, Math.PI); k.idle(x.t, 1, i); aim(k, 'R', rootPt(k, -0.4, 2.0, -0.2), 0.6 + 0.4 * Math.sin(x.t * 6 + i)); });
  aim(f, 'R', rootPt(f, -0.6, 2.0, 0.4), 0.5 + 0.3 * Math.sin(x.t * 3)); camMove(x, [-0.8, 1.4, 1.4], [0, 1.5, -3.4], [0.6, 1.5, 1.2], [0, 1.6, -3.4], eio, 42); x.post.tint.value.set(1.12, 1.02, 0.85);
});
// "e sabe quem te espera lá do outro lado?" — a dark back corridor
at(438.62, 'other_side', x => {
  const s = hall(x, 0.3, '#ffd8a8'); const L = x.L; camMove(x, [0.2, 1.5, 0.5], [0, 1.4, -12], [0.1, 1.5, -3.0], [0, 1.4, -12], (u) => u, 40); hand(x, 0.8); x.post.tint.value.set(1.1, 1.0, 0.85);
});
// "Ele." — a yellow rabbit in the dark
at(440.96, 'him', x => {
  const s = hall(x, 0.0); x.S.hallLamps.forEach(l => l.intensity = 0); const L = x.L; const b = put(x, 'springbonnie', s, 0, 0, -6.6, 0); b.idle(x.t, 0.3); lookAtCam(x, b, 0.9);
  rimOn(x, s, [0, 3.0, -8.5], [0, 1.6, -6.6], 90, '#b060ff'); keyOn(x, s, [0.8, 2.6, -4.0], [0, 1.8, -6.6], 10, 0.4); cam(x, [0.1, 1.6, -3.0 + 0.2 * x.u], [0, 1.9, -6.6], 40); b.setEyeGlow('#ffffff', 0.5);
});
// "De roxo, num traje de coelho amarelo, sorrindo"
at(441.54, 'purple_suit', x => {
  const s = voidS(x, 26, 40, '#a040ff', 1.5); const L = x.L; const b = put(x, 'springbonnie', s, 0, 0, 0, 0); b.idle(x.t, 0.6); lookAtCam(x, b, 1); b.head.rotation.z = 0.25 * eo(seg(L, 2.3, 2.9));
  rimOn(x, s, [0, 3.6, -3], [0, 1.6, 0], 70, '#a040ff');
  const hp = tp(b, 'head', [0, 4, 4]); camMove(x, [0.6, 1.5, 4.2], [0, 1.7, 0], [hp.x + 0.15, hp.y - 0.05, hp.z + 1.6], hp.toArray(), eio, 36);
});
// "Sabe o que isso significa?" — he reaches out to you
at(444.60, 'means', x => {
  const s = voidS(x, 26, 40, '#a040ff', 1.5); const L = x.L; const b = put(x, 'springbonnie', s, 0, 0, 0, 0); b.idle(x.t, 0.6); lookAtCam(x, b, 1); aim(b, 'R', rootPt(b, -0.1, 1.5, 1.2), eo(seg(L, 0.2, 0.9)));
  camMove(x, [0.3, 1.6, 3.4], [0, 1.6, 0], [0.15, 1.65, 2.4], [0, 1.7, 0], eo, 38);
});
// "Se o tempo dentro de FNAF pode ser quebrado, então nada do que a gente viu tá garantido" — frozen, glitching in time
at(446.40, 'time_broken', x => {
  const s = voidS(x, 34, 26, '#ff3a2a', 2); const L = x.L; s.fog = null;
  ['spring', 'golden', 'glitchtrap', 'baby'].forEach((n, i) => { const c = put(x, n, s, (i - 1.5) * 1.5, 0, -0.4 * Math.abs(i - 1.5), -(i - 1.5) * 0.12); const fr = Math.floor(x.t * 4 + i) % 3 === 0; c.idle(fr ? Math.floor(x.t) : x.t, 1, i); if (fr) glitchIn(x, c, 0.6); if (c.setEyes) c.setEyes('#5aff6a'); });
  const a = mix(-0.5, 0.5, eio(x.u)); cam(x, [Math.sin(a) * 7.0, 1.7, Math.cos(a) * 7.0], [0, 1.5, 0], 36); x.post.chroma.value = 0.5; if (Math.sin(x.t * 2.3) > 0.9) x.post.stat.value = 0.25;
});
// "Nenhuma morte," — Springtrap rises again
at(451.16, 'no_death', x => {
  const s = fright(x, 0.6); const L = x.L; const c = put(x, 'spring', s, 0, 0, -5.4, 0); const k = eo(seg(L, 0.0, 1.0)); c.root.position.y = -0.25 * (1 - k); c.torso.rotation.x = 1.1 * (1 - k);
  c.legR.piv.rotation.x = -1.4 * (1 - k); c.legL.piv.rotation.x = -1.2 * (1 - k); twitch(c, x.t, 1.2); camMove(x, [0.5, 0.8, -2.8], [0, 1.2, -5.4], [0.3, 1.3, -3.0], [0, 1.9, -5.4], eio, 44); fillOn(x, c, 2, 1.8);
});
// "nenhum final,"
at(452.40, 'no_final', x => {
  const s = voidS(x, 30, 30, '#ffd040', 1); const L = x.L; const g = put(x, 'golden', s, 0, 0, 0, 0); g.idle(x.t, 0.4); lookAtCam(x, g, 1); glitchIn(x, g, 0.6); g.setEyeGlow('#ffffff', 0.8);
  const hp = tp(g, 'head', [0, 4, 4]); camMove(x, [hp.x + 0.2, hp.y, hp.z + 1.8], hp.toArray(), [hp.x + 0.05, hp.y, hp.z + 1.3], hp.toArray(), eo, 34); staticIn(x, 0.1);
});
// "nenhum fim" — only Glitchtrap's grin in the dark, then black
at(453.38, 'no_end', x => {
  const s = voidS(x, 8, 30, '#a05aff', 0.3); const L = x.L; const g = put(x, 'glitchtrap', s, 0, 0, 0, 0); g.idle(x.t, 0.4); lookAtCam(x, g, 1); g.head.rotation.z = 0.25;
  const hp = tp(g, 'head', [0, 4, 4]); cam(x, [hp.x, hp.y, hp.z + 1.1 - 0.15 * x.u], hp.toArray(), 34); x.post.fade.value = sm(seg(L, 0.4, 0.92)); glitchIn(x, g, 0.3);
});
