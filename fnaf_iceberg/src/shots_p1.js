
// ================================ ICEBERG: shared helpers ================================
const RAIN = new Rain(2200, 160);
const POL = ['#ff2030', '#2050ff'].map(c => new THREE.PointLight(c, 0, 14, 1.2));
const DRIPM = new THREE.MeshStandardMaterial({ color: '#7a0808', roughness: 0.15, metalness: 0.2, emissive: '#3a0000' });
const DRIPS = Array.from({ length: 12 }, () => new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), DRIPM));
const RIM = new THREE.SpotLight('#ffffff', 0, 16, 0.55, 0.6, 1.1);
const DEEP = new THREE.PointLight('#ff2a1a', 0, 60, 1.2);
const KEY = new THREE.SpotLight('#fff2e0', 0, 16, 0.5, 0.7, 1.2);
const EXTRA = [RAIN.group, ...POL, ...DRIPS, RIM, RIM.target, DEEP, KEY, KEY.target];
let SNAP = null;
function cleanup(x) {
  const S = x.S;
  if (!SNAP) { const L = []; for (const sc of [S.facade, S.hall, S.stage, S.party, S.office, S.office1, S.cove, S.diner, S.shop, S.void, S.mini, S.ice]) sc.traverse(o => { if (o.isLight) L.push([o, o.intensity, o.color.clone()]); });
    // no canvas-text banners anywhere (channel rule): hide every wide, short canvas-textured mesh (LET'S PARTY, CELEBRATE, KID'S COVE...)
    for (const sc of [S.facade, S.hall, S.stage, S.party, S.office, S.office1, S.cove, S.diner, S.shop, S.prize, S.screenroom, S.alley, S.bedroom]) sc && sc.traverse(o => { const im = o.isMesh && o.material && o.material.map && o.material.map.image; if (im && im.width >= 64 && im.height <= 24) o.visible = false; });
    SNAP = { voidFog: S.void.fog, lights: L, objs: [S.doorL, S.doorR, S.phone, S.phoneHandset, ...S.doorPanes].map(o => [o, o.position.clone(), o.rotation.clone()]) }; }
  for (const [l, i, c] of SNAP.lights) { l.intensity = i; l.color.copy(c); }
  for (const [o, p, r] of SNAP.objs) { o.position.copy(p); o.rotation.copy(r); }
  for (const o of EXTRA) o.removeFromParent(); S.void.fog = SNAP.voidFog; S.iceBubbles[0].material.opacity = 0.32;
  for (let i = 0; i < 5; i++) { x.C['gk' + i].ghostMat.opacity = 0.5; x.C['kid' + i].root.visible = true; }
  x.C.mimic.eyeLight.intensity = 1.2;
}
const U16 = 1 / 16;
// light rig: a key spot from the front-top and a rim from behind (silhouettes)
function keyOn(x, s, from, to, I = 30, ang = 0.5) { s.add(KEY, KEY.target); KEY.position.set(...from); KEY.target.position.set(...to); KEY.intensity = I; KEY.angle = ang; }
function rimOn(x, s, from, to, I = 40, col = '#ffffff') { s.add(RIM, RIM.target); RIM.position.set(...from); RIM.target.position.set(...to); RIM.intensity = I; RIM.color.set(col); }
function rain(x, s, cx, cz) { s.add(RAIN.group); RAIN.update(x.t, cx, cz, 9, 9, 7, 0, 0.12, x.camera.position); }
function facade(x, lights = 1) { const s = x.S.facade; x.out.scene = s; x.post.vig.value = 0.85; x.S.inLamps.forEach(l => l.intensity *= lights); x.S.inGlow.intensity *= lights; return s; }
function bolt(x, s, at, len = 0.25) { const k = x.L - at; if (k < 0 || k > len) return; const f = (k < 0.06 || (k > 0.12 && k < 0.16)) ? 1 : 0.25; x.S.facadeLightning.intensity = 6 * f; x.post.flash.value = 0.18 * f; }
function office(x) { const s = x.S.office; x.out.scene = s; x.post.vig.value = 0.9; return s; }
function office1(x, lamp = 1) { const s = x.S.office1; x.out.scene = s; x.S.office1Lamp.intensity = 9 * lamp; x.post.vig.value = 0.9; return s; }
function hall(x, fl = 1, col = '#ffe9c4') { const s = x.S.hall; x.out.scene = s; x.S.hallLamps.forEach((l, i) => { l.intensity = 9 * mix(1, flicker(x.t, i * 2), fl); l.color.set(col); }); x.post.vig.value = 0.9; return s; }
function stageS(x) { const s = x.S.stage; x.out.scene = s; x.post.vig.value = 0.8; return s; }
function band(x, look = 0) { const s = stageS(x); const b = put(x, 'bonnie', s, -1.4, 0.65, -1.7, 0.12), f = put(x, 'freddy', s, 0, 0.65, -1.9, 0), c = put(x, 'chica', s, 1.4, 0.65, -1.7, -0.12);
  [b, f, c].forEach((k, i) => { k.idle(x.t, 1, i * 1.3); if (look > 0) lookAtCam(x, k, look); }); return [s, f, b, c]; }
function voidS(x, spot = 40, rim = 0, rimCol = '#ff4a2a', fill = 2.5) { const s = x.S.void; x.out.scene = s; x.S.voidSpot.intensity = spot; x.S.voidFill.intensity = fill; x.S.voidRim.intensity = rim; x.S.voidRim.color.set(rimCol); x.post.vig.value = 1.0; return s; }
function slump(c, k = 1) { const s = c.root.scale.x; c.root.position.y -= (c.hipY - 2 * U16) * s; for (const [L, z] of [[c.legR, -0.18], [c.legL, 0.18]]) { L.piv.rotation.x = -1.5; L.piv.rotation.z = z; }
  c.armR.piv.rotation.set(-0.15, 0, -0.32); c.armL.piv.rotation.set(-0.15, 0, 0.32); c.head.rotation.x = 0.5 * k; c.head.rotation.z = 0.22 * k; c.torso.rotation.x = 0.12 * k; }
// blood/oil running down the face from head-local points [x, y] (pixels on the front face)
function drips(x, c, k, srcs, len = 4.5) { if (k <= 0) return;
  srcs.forEach(([ux, uy, z = 4.55], i) => { const d = DRIPS[i]; c.head.add(d); const kk = cl(k * (0.85 + 0.3 * Math.abs(Math.sin(i * 2.7)))); const l = 0.25 + len * kk;
    d.position.set(ux * U16, (uy - l / 2) * U16, (z + 0.13) * U16); d.scale.set(0.5 * U16, l * U16, 0.22 * U16); }); }
function ghostKid(x, i, scene, p, ry = 0, op = 0.5) { const g = put(x, 'gk' + i, scene, p[0], p[1], p[2], ry); g.ghostMat.opacity = op; g.idle(x.t, 1, i); return g; }
function vision(x, c, label, locked, id) { const top = proj(x, rootPt(c, 0, 2.08, 0)), bot = proj(x, rootPt(c, 0, -0.02, 0)); const h = bot[1] - top[1], w = h * 0.36 * 9 / 16 * 1.0;
  x.out.ui = { type: 'vision', box: [top[0] - w / 2, top[1] - 0.02, w, h + 0.04], label, locked, id }; x.post.tint.value.set(1.15, 0.82, 0.82); }
function phoneRing(x, on = 1) { const v = Math.sin(x.t * 55) * on; x.S.phone.rotation.z = 0.05 * v; x.S.phoneHandset.position.y = 0.16 + 0.014 * Math.abs(Math.sin(x.t * 70)) * on; x.S.phoneHandset.rotation.z = 0.06 * v; x.S.phoneLight.intensity = on ? 0.8 + 0.7 * Math.abs(Math.sin(x.t * 9)) : 0.2; }
function waves(x, s, p, sp = 1, col = '#ffd0c0') { x.FX.waves.forEach((w, i) => { const r = ((x.t * 0.9 * sp + i / 4) % 1); s.add(w); w.position.copy(p); w.quaternion.copy(x.camera.quaternion); w.scale.setScalar(0.2 + 0.75 * r); w.material.opacity = 0.6 * (1 - r); w.material.color.set(col); }); }

// ---------- ICEBERG ----------
const iceRad = y => y > 0 ? 1.2 + Math.max(0, 7 - y) * 0.75 : 6 + (-y) * 0.32;
function ice(x, opts = {}) {
  const s = x.S.ice; x.out.scene = s; const cp = x.camera.position; const y = cp.y; const under = y < 0; const d = cl(-y / 56);
  if (!under) { s.background.set('#060f1e'); s.fog.color.set('#0a1830'); s.fog.density = 0.006; }
  else { const c = new THREE.Color('#0d4e78').lerp(new THREE.Color('#010205'), Math.pow(d, 0.6)); s.background.copy(c); s.fog.color.copy(c); s.fog.density = mix(0.028, 0.06, d); }
  x.S.iceUnder.position.set(cp.x * 0.5, y + 4, cp.z * 0.5 - 6); x.S.iceUnder.intensity = under ? mix(60, 10, d) : 0;
  x.S.iceMoon.intensity = under ? mix(1.4, 0, cl(-y / 14)) : 2.4;
  const rush = opts.rush || 1;
  x.S.iceBubbles.forEach((b, i) => { const u = b.userData; const yy = y - 5 + ((x.t * u.sp * 1.3 * rush + u.ph * 10) % 10); b.position.set(cp.x + u.x * 1.6, yy, cp.z - 5 + u.z * 1.4); b.scale.setScalar(0.45); b.visible = under && yy < -0.25; });
  if (under) x.post.tint.value.set(mix(0.85, 0.7, d), mix(1.0, 0.82, d), mix(1.12, 1.05, d));
  if (opts.red) { s.add(DEEP); DEEP.position.set(0, -66, -14); DEEP.intensity = opts.red * 900; }
  x.post.vig.value = under ? 0.95 : 0.6; x.post.grain.value = 0.03; return s;
}
// camera standing off the iceberg flank at height y, angle a (0 = in front, +x to the right)
function iceCam(x, y, a, off = 9, lookDy = 0, fov = 44, side = 0) { const R = iceRad(y) + off; const cx = Math.sin(a) * R, cz = -14 + Math.cos(a) * R * 0.85; cam(x, [cx, y, cz], [side * Math.cos(a), y + lookDy, -14 - side * Math.sin(a)], fov); }
// voxel layer title, fixed in the world between the camera and the ice, popping in at local time a0
function title(x, i, a0, dist = 7) { if (x.L < a0) return; const tg = x.S.iceTitles[i]; tg.visible = true; const k = back(seg(x.L, a0, a0 + 0.45));
  const f = new V3(); x.camera.getWorldDirection(f); tg.position.copy(x.camera.position).addScaledVector(f, dist); tg.position.y += 0.05 * Math.sin(x.L * 2); tg.quaternion.copy(x.camera.quaternion); tg.rotateY(0.06 * Math.sin(x.L * 1.3)); tg.scale.setScalar(0.85 * k); }
// layer transition: water whoosh + camera dive from y0 to y1 + title (i = 0..5)
function dive(x, i, y0, y1, a0 = 1.55) {
  const L = x.L; const k = eio(seg(L, 0, 2.4)); const y = mix(y0, y1, k); const a = mix(i % 2 ? -0.7 : 0.7, i % 2 ? -0.18 : 0.18, eo(seg(L, 0, 2.6)));
  iceCam(x, y, a, mix(18, 13, k), mix(-2, 0.4, k), 46); if (L < 2.4) shake(x, 0.25 * Math.sin(Math.PI * k));
  ice(x, { rush: 1 + 4 * (1 - seg(L, 1.8, 2.6)), red: i >= 4 ? 1 : 0 });
  if (y0 > 0 && y1 < 0) { const c = Math.abs(y); if (c < 1.2) { x.post.flash.value = 0.35 * (1 - c / 1.2); x.post.blur.value = 0.8 * (1 - c / 1.2); } }
  title(x, i, a0, 6.5); x.post.chroma.value = 0.4 * (1 - seg(L, 0, 1.2));
}

// ================================ PART 1: INTRO ================================
// "Em 1985," — a stormy night, five kids run up to the pizzeria
at(0.00, 'y1985', x => {
  const s = facade(x); const L = x.L; bolt(x, s, 0.1, 0.3); bolt(x, s, 1.7, 0.2); x.S.logoLight.intensity = 2; x.S.facadeHemi.intensity = 1.4; keyOn(x, s, [2.5, 5, 10], [0, 0.8, 4], 40, 0.5);
  [[-1.1, 5.6], [-0.4, 6.4], [0.35, 5.9], [1.0, 6.7], [0.0, 7.3]].forEach(([px, pz], i) => { const k = put(x, 'kid' + i, s, 0, 0, 0, Math.PI + 0.1 * Math.sin(i)); walkTo(k, [px, 0, pz - 0.8], [px * 0.6, 0, pz - 4.0], seg(L, 0, 2.6), 0.42); k.walk(L * 2.6 + i * 0.3, 1); });
  camMove(x, [1.6, 1.5, 12.5], [0, 1.3, 1], [0.8, 1.5, 9.8], [0, 1.4, 1], eo, 36); hand(x, 0.8); rain(x, s, 0, 6); x.post.fade.value = 1 - seg(L, 0, 0.5);
});
// "cinco crianças entraram numa pizzaria" — from inside: the glass doors swing open and they come in
at(2.58, 'enter', x => {
  const s = facade(x); const L = x.L; const op = eo(seg(L, 0, 0.5)); x.S.doorPanes.forEach((p, i) => p.rotation.y = (i ? -1 : 1) * 1.35 * op);
  [[-0.45, 0], [0.4, 0.25], [0, 0.55], [-0.4, 0.85], [0.35, 1.1]].forEach(([px, d], i) => { const k = put(x, 'kid' + i, s, 0, 0, 0, Math.PI); walkTo(k, [px, 0, 1.6 + d * 2], [px * 1.8, 0, -1.4 + d * 0.9], eo(seg(L, 0.15 + d * 0.5, 2.3)), 0.42); k.head.rotation.y = 0.4 * Math.sin(x.t * 1.5 + i); });
  camMove(x, [1.3, 1.2, -6.2], [0, 1.0, 1.0], [0.7, 1.2, -5.4], [0, 1.0, 0.6], eo, 40); hand(x, 0.6); rain(x, s, 0, 4);
});
// "e nunca mais saíram" — doors shut, the lights inside die
at(4.88, 'never_left', x => {
  const s = facade(x); const L = x.L; const cls = eo(seg(L, 0, 0.35)); x.S.doorPanes.forEach((p, i) => p.rotation.y = (i ? -1 : 1) * 1.35 * (1 - cls));
  const off = L > 0.95 ? (L < 1.05 ? 0.4 : 0) : 1; x.S.inLamps.forEach(l => l.intensity = 10 * off); x.S.inGlow.intensity = 4 * off;
  [[-0.9, -3.0], [-0.2, -3.4], [0.5, -3.1], [1.1, -3.6], [0.2, -3.9]].forEach(([px, pz], i) => { const k = put(x, 'kid' + i, s, px, 0, pz, Math.PI); walkTo(k, [px, 0, pz], [px * 1.2, 0, pz - 2.6], seg(L, 0, 1.76), 0.42); });
  camMove(x, [0, 1.45, 6.2], [0, 1.4, 0], [0, 1.5, 4.2], [0, 1.45, -1], eio, 38); bolt(x, s, 1.0, 0.25); rain(x, s, 0, 4);
});
// "A polícia prendeu um suspeito," — the man in purple under the red/blue lights
at(6.64, 'police', x => {
  const s = facade(x, 0.15); const L = x.L; const p = put(x, 'purpleguy', s, 0.4, 0, 2.6, -0.1); p.idle(x.t, 0.5);
  p.armR.piv.rotation.set(0.55, 0, 0.32); p.armL.piv.rotation.set(0.55, 0, -0.32); p.head.rotation.x = -0.05; lookAtCam(x, p, eo(seg(L, 0.9, 1.6)) * 0.8); p.head.rotation.z = 0.12 * eo(seg(L, 1.2, 1.8));
  const ph = Math.floor(x.t * 5) % 2; POL.forEach((l, i) => { s.add(l); l.position.set(i ? 3.5 : -3.0, 1.6, 6.5); l.intensity = (i === ph ? 26 : 3); });
  camMove(x, [1.6, 1.55, 7.6], [0.4, 1.6, 2.6], [0.75, 1.7, 5.3], [0.4, 1.75, 2.6], eo, 34); hand(x, 0.6); rain(x, s, 0.4, 5); fillOn(x, p, 1.2, 1.8);
});
// "os corpos nunca foram encontrados" — the empty hall; little ghosts fade at the far end
at(8.76, 'no_bodies', x => {
  const s = hall(x, 0.8, '#d8e0ff'); const L = x.L;
  for (let i = 0; i < 5; i++) ghostKid(x, i, s, [(i - 2) * 0.55, 0, -10.5 - (i % 2) * 0.6], 0, 0.42 * (1 - sm(seg(L, 0.6, 1.8))));
  camMove(x, [0.35, 1.35, 2.0], [0, 1.15, -12], [0.1, 1.3, -2.0], [0, 1.1, -12], (u) => u, 38); hand(x, 0.6);
});
// "Meses depois," — the band on stage, business as usual
at(10.76, 'months', x => {
  const [s, f] = band(x); const L = x.L; const a = mix(-0.45, 0.35, eio(x.u)); cam(x, [Math.sin(a) * 6.2, 1.85, -1.8 + Math.cos(a) * 6.2], [0, 1.95, -1.8], 34);
});
// "os clientes começaram a reclamar de um cheiro estranho" — party room, kids holding their noses
at(12.30, 'smell', x => {
  const s = x.S.party; x.out.scene = s; const L = x.L; x.post.vig.value = 0.8;
  const a = put(x, 'kid1', s, 1.6, 0, -1.2, -0.5), b = put(x, 'kid2', s, 2.6, 0, -0.6, -0.9), h = put(x, 'henry', s, 3.3, 0, -1.8, -1.1);
  [a, b].forEach((k, i) => { k.idle(x.t, 1, i); const nose = rootPt(k, 0, 1.68, 0.3); aim(k, 'R', nose, eo(seg(L, 0.3 + i * 0.4, 0.8 + i * 0.4))); k.head.rotation.y += 0.25 * Math.sin(x.t * 7 + i) * seg(L, 0.8, 1.2); k.head.rotation.x = 0.1; });
  aim(b, 'L', rootPt(b, -0.6, 1.4, 0.6), eo(seg(L, 1.4, 1.8))); h.idle(x.t, 1); h.head.rotation.y = 0.5 * eo(seg(L, 0.8, 1.6)); aim(h, 'R', rootPt(h, -0.2, 1.75, 0.35), eo(seg(L, 1.6, 2.2)));
  camMove(x, [-0.6, 1.4, 3.2], [2.2, 1.1, -1.2], [0.1, 1.3, 2.3], [2.2, 1.1, -1.2], eo, 38); x.post.tint.value.set(1.0, 1.04, 0.92);
});
// "vindo dos animatrônicos" — push in on the band, sickly green haze
at(15.24, 'smell_band', x => {
  const [s, f, b, c] = band(x); const L = x.L; f.head.rotation.x = 0.12; camMove(x, [0.3, 1.8, 4.6], [0, 2.3, -1.9], [0.1, 2.3, 1.8], [0, 2.7, -1.9], eio, 34);
  x.post.tint.value.set(0.92, 1.08, 0.82); x.S.stageSpot.intensity = 26;
});
// "Algo como sangue e muco escorrendo nos olhos" — Freddy close-up, dark fluid runs from the eyes
at(16.56, 'blood_eyes', x => {
  const [s, f] = band(x); const L = x.L; x.S.stageSpot.intensity = 14; f.head.rotation.x = 0.06; f.head.rotation.y = 0.04 * Math.sin(x.t);
  drips(x, f, eio(seg(L, 1.5, 3.3)), [[-2.0, 3.4], [2.0, 3.4], [-1.6, 3.3], [1.5, 3.3]], 3.6);
  const hp = tp(f, 'head', [0, 4, 4]); camMove(x, [hp.x + 0.35, hp.y - 0.05, hp.z + 1.9], hp.toArray(), [hp.x + 0.1, hp.y - 0.05, hp.z + 1.25], hp.toArray(), eio, 30); fillOn(x, f, 1.6, 2.4);
  x.post.tint.value.set(1.05, 0.95, 0.92);
});
// "e da boca dos bonecos" — Bonnie, from the mouth
at(19.84, 'blood_mouth', x => {
  const [s, f, b] = band(x); const L = x.L; x.S.stageSpot.intensity = 14; b.head.rotation.x = 0.08;
  drips(x, b, 1, [[-1.9, 3.6], [1.9, 3.6]], 2.6);
  [[-0.8, 1.0], [0.6, 1.0], [0.0, 0.9]].forEach(([ux, uy], j) => { const d = DRIPS[4 + j]; b.head.add(d); const l = 0.25 + 3.2 * eio(seg(L, 0.1 + j * 0.2, 1.3)); d.position.set(ux * U16, (uy - l / 2) * U16, 4.68 * U16); d.scale.set(0.5 * U16, l * U16, 0.22 * U16); });
  const hp = tp(b, 'head', [0, 3, 4]); const a = mix(-0.35, -0.1, eio(x.u)); cam(x, [hp.x + Math.sin(a) * 1.4, hp.y - 0.08, hp.z + Math.cos(a) * 1.4], hp.toArray(), 30); fillOn(x, b, 1.6, 2.4);
});
// "Isso não é teoria," — the night guard at his desk
at(21.22, 'not_theory', x => {
  const s = office(x); const L = x.L; const g = guardSit(x, s); g.head.rotation.x = 0.2; g.head.rotation.y = 0.25 * Math.sin(x.t * 0.8);
  camMove(x, [2.3, 1.75, -0.6], [0, 1.45, 0.0], [1.8, 1.7, -0.9], [0, 1.45, 0.0], eo, 40); fillOn(x, g, 1.2, 1.6); hand(x, 0.6);
});
// "isso tá escrito no primeiro jogo" — the FNAF 1 office: two doors, the fan, the poster
at(23.32, 'first_game', x => {
  const s = office1(x); const L = x.L; camMove(x, [0.0, 1.75, 1.95], [0, 1.45, -2.5], [0.1, 1.62, 1.1], [0, 1.4, -2.5], eo, 50); hand(x, 0.5);
});
// "E isso é só a ponta" — the iceberg tip under the moon
at(24.94, 'tip', x => {
  const L = x.L; const a = mix(0.9, 0.35, eio(x.u)); const R = 17; cam(x, [Math.sin(a) * R, mix(8, 5.5, eio(x.u)), -14 + Math.cos(a) * R], [0, 4.0, -14], 40); ice(x);
});
// "Hoje a gente vai descer o iceberg de FNAF," — the camera sinks along the ice and goes under
at(27.58, 'descend', x => {
  const L = x.L; const k = eio(seg(L, 0.2, 2.96)); const y = mix(7, -6, k); iceCam(x, y, mix(0.35, 0.1, k), mix(13, 20, k), mix(-1.5, -1.5, k), 44, 7 * k); ice(x, { rush: 2 });
  if (Math.abs(y) < 1) { x.post.flash.value = 0.3 * (1 - Math.abs(y)); x.post.blur.value = 0.7 * (1 - Math.abs(y)); }
});
// "começa nas coisas que a maioria dos fãs sabem" — the famous four, in a warm spotlight
at(30.54, 'fans_know', x => {
  const s = voidS(x, 50, 10, '#ffb070', 4); const L = x.L; s.fog = null;
  ['bonnie', 'freddy', 'chica', 'foxy'].forEach((n, i) => { const c = put(x, n, s, (i - 1.5) * 1.35, 0, -0.25 * Math.abs(i - 1.5), -(i - 1.5) * 0.12); c.idle(x.t, 1, i); lookAtCam(x, c, 0.5); });
  camMove(x, [-2.2, 1.7, 7.4], [0, 1.5, 0], [1.4, 1.75, 6.4], [0, 1.55, 0], eio, 34);
});
// "E termina em teorias tão pesadas, tão escondidas," — deep under, the light fades
at(33.64, 'deep', x => {
  const L = x.L; const k = eio(x.u); iceCam(x, mix(-12, -40, k), mix(-0.3, 0.35, k), 24, -3, 46, 9); ice(x, { rush: 1.5, red: k * 0.4 });
});
// "que a maioria das pessoas que jogou nunca nem ouviu falar" — two orange eyes open in the dark
at(37.56, 'never_heard', x => {
  const s = voidS(x, 0, 0, '#ff8a3a', 0.6); const L = x.L; const m = put(x, 'mimic', s, 0, 0, 0, 0); m.idle(x.t, 0.6); m.head.rotation.x = 0.1;
  const on = sm(seg(L, 1.9, 2.4)); m.eyeLight.intensity = 3 * on; rimOn(x, s, [0, 3.5, -3], [0, 1.6, 0], 30 * on, '#ff8a3a');
  const hp = tp(m, 'head', [0, 4, 3]); camMove(x, [0.2, hp.y - 0.15, 4.4], hp.toArray(), [0.05, hp.y - 0.05, 2.4], hp.toArray(), eio, 32);
  x.post.vig.value = 1.2; if (L > 1.9 && L < 2.0) x.post.flash.value = 0.12;
});
// "E eu já aviso uma coisa," — the bottom glows red
at(41.06, 'warn', x => {
  const L = x.L; iceCam(x, mix(-44, -50, eio(x.u)), 0.25, 26, -10, 46, -8); ice(x, { red: 1 });
});
// "tem uma informação lá no fundo que muda o jeito que você vê um dos personagens mais famosos da franquia"
at(43.22, 'info', x => {
  const s = voidS(x, 0, 30, '#ff3a2a', 0.4); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.6);
  rimOn(x, s, [0.5, 3.8, -3.2], [0, 1.4, 0], 70, '#ff3a2a'); const turn = eo(seg(L, 3.3, 4.0)); w.head.rotation.y = mix(-0.6, 0, turn); w.head.rotation.x = mix(0.25, 0.05, turn);
  keyOn(x, s, [1.6, 3.5, 3.5], [0, 1.7, 0], 10 * sm(seg(L, 3.3, 4.2)), 0.3);
  camMove(x, [0.6, 1.4, 6.5], [0, 1.4, 0], [0.12, 1.72, 2.2], [0, 1.72, 0], eio, 34); x.post.vig.value = 1.15;
});
// "Então fica até o final, se você tiver coragem" — the left light reveals Bonnie... the door slams
at(48.70, 'courage', x => {
  const s = office1(x, 0.55); const L = x.L; const b = put(x, 'bonnie', s, -3.35, 0, 0, Math.PI / 2); b.idle(x.t, 0.5); lookAtCam(x, b, 0.9);
  const lt = L > 1.0 && L < 3.3; x.S.westDoorLight.intensity = lt ? 7 * mix(1, flicker(x.t, 4), 0.5) : 0; b.root.visible = L > 1.0;
  const slam = ei(seg(L, 3.34, 3.5)); x.S.doorL.position.y = mix(3.75, 1.25, slam); if (L > 3.5 && L < 3.62) shake(x, 0.6);
  camMove(x, [0.6, 1.6, 0.9], [-3, 1.5, -0.2], [0.1, 1.6, 0.5], [-3, 1.55, 0], eo, 42); hand(x, 0.8);
});

// ================================ TRANSITION 1 + CAMADA 1 ================================
at(52.76, 'dive1', x => {
  const L = x.L; const k = eio(seg(L, 0, 2.6)); const a = mix(1.1, 0.12, k); const R = mix(46, 15, k); const y = mix(28, 4.5, k);
  cam(x, [Math.sin(a) * R, y, -14 + Math.cos(a) * R], [0, mix(2, 4.2, k), -14], 44); if (L < 2.6) shake(x, 0.2 * Math.sin(Math.PI * k)); ice(x); title(x, 0, 1.75, 6.5);
  x.post.fade.value = 0.6 * (1 - seg(L, 0, 0.4));
});
// "Os animatrônicos não te atacam porque você está com defeito" — Bonnie comes down the hall
at(57.54, 'not_defect', x => {
  const s = hall(x, 1); const L = x.L; const b = put(x, 'bonnie', s, 0, 0, 0, 0); walkTo(b, [0.1, 0, -11], [0.05, 0, -5.2], eo(seg(L, 0, 3.4)), 1.0); lookAtCam(x, b, 0.5);
  camMove(x, [0.4, 1.6, 0.8], [0, 1.9, -8], [0.25, 1.75, -1.0], [0, 2.0, -5], eo, 40); fillOn(x, b, 1.6, 2.2); hand(x, 0.5);
});
// "Eles são possuídos," — a child's ghost slips into Freddy
at(60.98, 'possessed', x => {
  const s = voidS(x, 34, 18, '#9ad8ff'); const L = x.L; const f = put(x, 'freddy', s, 0, 0, 0, 0); f.idle(x.t, 0.6);
  const k = eio(seg(L, 0.1, 1.1)); const g = ghostKid(x, 0, s, [0, mix(0, 0.5, k), mix(1.3, 0.05, k)], Math.PI, 0.55 * (1 - seg(L, 0.9, 1.3)));
  f.setEyeGlow('#e8f6ff', sm(seg(L, 1.0, 1.25)) * (L > 1.3 ? 0.6 : 1)); if (L > 1.05 && L < 1.12) x.post.flash.value = 0.08;
  const a = mix(0.7, 0.25, eio(x.u)); cam(x, [Math.sin(a) * 4.4, 1.9, Math.cos(a) * 4.4], [0, 1.8, 0], 36);
});
// "as crianças assassinadas de 85 ficaram presas dentro deles"
at(62.78, 'kids85', x => {
  const s = voidS(x, 46, 16, '#9ad8ff', 3); const L = x.L; s.fog = null;
  ['foxy', 'bonnie', 'freddy', 'chica', 'golden'].forEach((n, i) => { const c = put(x, n, s, (i - 2) * 1.5, 0, -0.35 * Math.abs(i - 2), -(i - 2) * 0.12); c.idle(x.t, 0.7, i);
    const k = eio(seg(L, 0.6 + i * 0.35, 1.9 + i * 0.35)); const gp = rootPt(c, 0, mix(0, 0.35, k), mix(1.2, 0.05, k)); ghostKid(x, (i + 1) % 5, s, gp.toArray(), Math.PI + c.root.rotation.y, 0.55 * (1 - seg(L, 1.7 + i * 0.35, 2.1 + i * 0.35)));
    if (c.setEyeGlow) c.setEyeGlow('#e8f6ff', 0.7 * sm(seg(L, 1.8 + i * 0.35, 2.0 + i * 0.35))); });
  camMove(x, [1.5, 1.6, 9.0], [0, 1.4, 0], [-0.6, 1.7, 7.6], [0, 1.5, 0], eio, 36);
});
// "E o phone guy explica porque eles te atacam," — the phone rings in the office
at(66.42, 'phone', x => {
  const s = office(x); const L = x.L; phoneRing(x, 1); const g = guardSit(x, s); g.head.rotation.y = -0.5 * eo(seg(L, 0.5, 1.0)); g.head.rotation.x = 0.25;
  const pp = x.S.phone.position; waves(x, s, new V3(pp.x, pp.y + 0.25, pp.z), 1.2);
  camMove(x, [2.0, 1.55, 0.2], [0.85, 1.1, -0.78], [1.45, 1.4, -0.25], [0.85, 1.1, -0.78], eo, 40);
});
// "à noite eles acham que você é um endoesqueleto sem roupa" — robot vision locks on the guard
at(69.08, 'endo_scan', x => {
  const s = office(x); const L = x.L; const g = guardSit(x, s); g.head.rotation.x = -0.05; lookAtCam(x, g, eo(seg(L, 1.2, 1.6))); x.S.officeLamp.intensity = 5;
  camMove(x, [0.1, 2.0, -4.3], [0, 1.4, 0.15], [0.05, 1.9, -3.0], [0, 1.45, 0.15], eo, 40); hand(x, 0.7);
  const lock = L > 1.75; vision(x, g, lock ? 'ENDOESQUELETO' : 'ANALISANDO...', lock, lock ? 'TRAJE: NENHUM' : 'ID: ----');
});
// "E tentam te enfiar à força dentro de uma fantasia do Freddy"
at(72.28, 'stuff', x => {
  const s = voidS(x, 44, 14, '#ff4a2a', 3); const L = x.L; s.fog = null;
  const f = put(x, 'freddy', s, 0, 0, -1.6, 0); slump(f, 1); f.head.rotation.x = 0.6;
  const g = put(x, 'guard', s, 0, 0, mix(0.9, 0.3, eo(seg(L, 0, 2.6))), 0); g.walk(L * 3.2, 0.7, 0); g.head.rotation.y = 0.45 * Math.sin(x.t * 9); g.torso.rotation.x = -0.1;
  const b = put(x, 'bonnie', s, -0.95, 0, g.root.position.z - 0.15, 0.25), c = put(x, 'chica', s, 0.95, 0, g.root.position.z - 0.15, -0.25); b.walk(L * 1.6, 0.6, 0); c.walk(L * 1.6 + 0.5, 0.6, 0);
  aim(g, 'R', rootPt(g, -0.75, 1.35, -0.1), 1); aim(g, 'L', rootPt(g, 0.75, 1.35, -0.1), 1);
  aim(b, 'L', tp(g, 'armR', [0, -7, 0]), 1); aim(c, 'R', tp(g, 'armL', [0, -7, 0]), 1); aim(b, 'R', tp(g, 'torso', [-3, 9, -2]), 0.8); aim(c, 'L', tp(g, 'torso', [3, 9, -2]), 0.8);
  lookAtCam(x, b, 0.3); lookAtCam(x, c, 0.3);
  camMove(x, [0.6, 1.55, 5.6], [0, 1.4, 0], [0.2, 1.6, 4.3], [0, 1.45, -0.2], eo, 38); hand(x, 0.6);
});
// "O problema é que a fantasia é cheia de vigas, fios e peças de metal" — X-ray Freddy
at(75.22, 'beams', x => {
  const s = voidS(x, 36, 20, '#3ad8ff', 3); const L = x.L; const f = put(x, 'freddy', s, 0, 0, 0, 0); f.idle(x.t, 0.6);
  x.setXray(f, 0.85 * sm(seg(L, 0.4, 1.2)), sm(seg(L, 2.2, 3.0)) * (0.6 + 0.4 * Math.sin(x.t * 8)), '#ffb040');
  const a = mix(-0.7, 0.6, eio(x.u)); cam(x, [Math.sin(a) * 4.0, 1.7, Math.cos(a) * 4.0], [0, 1.5, 0], 38);
});
// "Só que pense comigo, e se não for uma confusão" — Freddy in the dark hall slowly tilts his head
at(79.58, 'think', x => {
  const s = hall(x, 0.5, '#c8d0ff'); const L = x.L; const f = put(x, 'freddy', s, 0, 0, -4.6, 0); f.idle(x.t, 0.4);
  f.head.rotation.z = 0.3 * eio(seg(L, 0.4, 2.4)); f.setEyeGlow('#ffffff', 0.9 * sm(seg(L, 2.0, 2.3)));
  camMove(x, [0.5, 1.75, 0.4], [0, 2.0, -4.6], [0.2, 2.0, -1.6], [0, 2.15, -4.6], eio, 36); fillOn(x, f, 1.2, 2.2);
});
// "E se eles soubessem exatamente o que estão fazendo" — the whole band turns to us at once
at(82.86, 'they_knew', x => {
  const [s, f, b, c] = band(x); const L = x.L; const k = eo(seg(L, 0.5, 0.8)); [f, b, c].forEach(ch => { const y0 = ch.head.rotation.y; ch.head.rotation.y = mix(y0 - 0.7, y0, 1); lookAtCam(x, ch, k); });
  [f, b, c].forEach(ch => { if (k < 1) ch.head.rotation.y += (1 - k) * 0.8; });
  f.setEyeGlow('#ffffff', 0.8 * k); x.S.stageSpot.intensity = 22;
  camMove(x, [0, 1.9, 6.0], [0, 2.0, -1.8], [0, 2.1, 4.2], [0, 2.2, -1.8], eio, 34);
});
// "E se estivessem procurando uma pessoa específica" — robot vision sweeping the hall
at(85.90, 'searching', x => {
  const s = hall(x, 0.6); const L = x.L; const ppl = [['guard', -0.9, -4.0, 0.15], ['jeremy', 0.8, -6.2, -0.2], ['henry', -0.3, -8.6, 0.1]];
  const cs = ppl.map(([n, px, pz, ry], i) => { const c = put(x, n, s, px, 0, pz, ry); c.idle(x.t, 1, i); lookAtCam(x, c, 0.5); return c; });
  camMove(x, [0.0, 2.15, 1.5], [0, 1.5, -8], [0.0, 2.15, -0.6], [0, 1.5, -8], (u) => u, 40); x.camera.position.y += 0.03 * Math.abs(Math.sin(x.t * 5)); x.camera.rotateZ(0.012 * Math.sin(x.t * 2.5));
  const i = Math.min(2, Math.floor(L / 1.35)); vision(x, cs[i], 'PROCURANDO...', false, 'ID: ' + ['NÃO', 'NÃO', 'NÃO'][i]);
});
// "Um homem roxo," — he steps into the light
at(89.94, 'purple_man', x => {
  const s = voidS(x, 40, 30, '#a040ff'); const L = x.L; const p = put(x, 'purpleguy', s, 0, 0, 0, 0); walkTo(p, [0, 0, -2.2], [0, 0, 0], eo(seg(L, 0, 1.2)), 0.9);
  rimOn(x, s, [0, 3.5, -3], [0, 1.5, 0], 50, '#a040ff'); camMove(x, [0.4, 1.4, 4.6], [0, 1.4, -0.5], [0.2, 1.55, 3.6], [0, 1.5, 0], eo, 38);
});
// "o purple guy, o cara roxo" — orbit; he grins and waves
at(91.36, 'purple_guy', x => {
  const s = voidS(x, 40, 30, '#a040ff'); const L = x.L; const p = put(x, 'purpleguy', s, 0, 0, 0, 0); p.idle(x.t, 1); lookAtCam(x, p, 0.9); p.head.rotation.z = 0.15 * eo(seg(L, 0.8, 1.2));
  aim(p, 'R', rootPt(p, -0.55, 2.0 + 0.1 * Math.sin(x.t * 10), 0.4), eo(seg(L, 0.9, 1.3))); rimOn(x, s, [0, 3.5, -3], [0, 1.5, 0], 50, '#a040ff');
  const a = mix(0.6, -0.4, eio(x.u)); cam(x, [Math.sin(a) * 3.2, 1.75, Math.cos(a) * 3.2], [0, 1.65, 0], 36);
});
// "Nos minigames escondidos dos jogos ele aparece como um bonequinho roxo de pixel"
at(93.90, 'minigame', x => {
  const s = x.S.mini; x.out.scene = s; x.post.pix.value = PIX(x); const L = x.L; const p = put(x, 'purpleguy', s, 0, 0, 0, 0);
  walkTo(p, [-1.6, 0, 1.4], [0.6, 0, -2.4], seg(L, 0, 4.7), 0.8); p.root.rotation.y = Math.atan2(2.2, -3.8);
  for (let i = 0; i < 3; i++) { const sp = x.S.miniKidSpots[i + 2]; const k = put(x, 'kid' + i, s, sp[0] * 0.45, 0, sp[1] * 0.45 - 1, 0.4 + i); k.idle(x.t, 1, i); }
  const pp = p.root.position; cam(x, [pp.x + 2.0, 5.4, pp.z + 5.0], [pp.x, 0.6, pp.z], 42); x.post.vig.value = 0.6;
});
// "Hoje a gente sabe o nome dele, William Afton" — the spotlight slams on
at(98.68, 'name', x => {
  const s = voidS(x, 0, 24, '#a040ff', 1); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.6); const on = L > 1.98 ? 1 : 0.08;
  x.S.voidSpot.intensity = 46 * on; lookAtCam(x, w, on ? eo(seg(L, 2.0, 2.4)) : 0); w.head.rotation.x += on ? 0 : 0.3;
  camMove(x, [0.5, 1.5, 5.4], [0, 1.5, 0], [0.15, 1.7, 2.6], [0, 1.72, 0], eio, 36); if (L > 1.98 && L < 2.08) x.post.flash.value = 0.25;
});
// "Cofundador da Fazbear Entertainment," — William and Henry at Fredbear's Family Diner
at(101.48, 'cofounder', x => {
  const s = x.S.diner; x.out.scene = s; const L = x.L; x.post.vig.value = 0.8; x.post.tint.value.set(1.06, 1.0, 0.9);
  const f = put(x, 'fredbear', s, 0.9, 0.77, -4.4, -0.15); f.idle(x.t, 1); const sb = put(x, 'springbonnie', s, -0.9, 0.77, -4.4, 0.15); sb.idle(x.t, 1, 2);
  const w = put(x, 'william', s, -0.55, 0, -1.6, 0.45), h = put(x, 'henry', s, 0.55, 0, -1.6, -0.45); w.idle(x.t, 1); h.idle(x.t, 1, 1);
  const sh = eo(seg(L, 0.3, 0.8)); const mid = new V3(0, 1.0 + 0.04 * Math.sin(x.t * 9) * seg(L, 0.8, 1.6), -1.25); aim(w, 'L', mid, sh); aim(h, 'R', mid, sh); lookAtCam(x, w, 0.5); lookAtCam(x, h, 0.5);
  camMove(x, [0.4, 1.6, 2.6], [0, 1.6, -2.4], [0.15, 1.55, 1.4], [0, 1.55, -2.4], eo, 40); fillOn(x, w, 1.5, 1.8);
});
// "engenheiro," — at the workbench
at(103.78, 'engineer', x => {
  const s = x.S.shop; x.out.scene = s; const L = x.L; x.post.vig.value = 0.85; const w = put(x, 'william', s, -0.2, 0, -1.9, -2.2); w.idle(x.t, 0.6);
  aim(w, 'R', new V3(-1.0, 1.05 + 0.08 * Math.sin(x.t * 12), -2.9), 0.9); aim(w, 'L', new V3(-0.4, 1.05, -3.0), 0.7); w.head.rotation.x = 0.4;
  camMove(x, [-2.3, 1.8, -0.4], [-0.5, 1.35, -2.2], [-1.9, 1.75, -0.8], [-0.5, 1.35, -2.3], eo, 42); fillOn(x, w, 1.5, 1.8); x.S.shopLamp.intensity = 14;
});
// "pai" — with his three kids
at(105.02, 'father', x => {
  const s = voidS(x, 46, 12, '#ffd0a0', 4); const L = x.L; s.fog = null; const w = put(x, 'william', s, 0, 0, -0.3, 0); w.idle(x.t, 1);
  const m = put(x, 'michael', s, -0.95, 0, 0.1, 0.2), e = put(x, 'elizabeth', s, 1.1, 0, 0.2, -0.25), c = put(x, 'cchild', s, 0.45, 0, 0.75, -0.1); [m, e, c].forEach((k, i) => { k.idle(x.t, 1, i); lookAtCam(x, k, 0.6); });
  aim(w, 'L', tp(e, 'head', [0, 9, 0]), 0.8); lookAtCam(x, w, 0.4); camMove(x, [0.0, 1.9, 4.6], [0, 1.25, 0], [-0.1, 1.85, 4.0], [0, 1.3, 0], eo, 38);
});
// "e o maior assassino em série da história dos games" — red light, five little ghosts behind him
at(105.90, 'killer', x => {
  const s = voidS(x, 18, 40, '#ff2a1a', 0.6); const L = x.L; s.fog = null; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.5); lookAtCam(x, w, 0.7);
  for (let i = 0; i < 5; i++) ghostKid(x, i, s, [(i - 2) * 0.75, 0, -1.6 - 0.3 * Math.abs(i - 2)], 0, 0.7 * sm(seg(L, 0.3 + i * 0.15, 1.0 + i * 0.15)));
  rimOn(x, s, [0, 3.8, -3.5], [0, 1.4, 0], 60, '#ff2a1a'); camMove(x, [0.3, 0.7, 4.8], [0, 1.6, 0], [0.1, 0.95, 3.2], [0, 1.7, 0], eio, 38); x.post.tint.value.set(1.15, 0.85, 0.85);
});
// "Guarde esse detalhe," — tight on his face
at(108.52, 'keep', x => {
  const s = voidS(x, 30, 26, '#ff6a3a', 1); const L = x.L; const w = put(x, 'william', s, 0, 0, 0, 0); w.idle(x.t, 0.4); lookAtCam(x, w, 1);
  const hp = tp(w, 'head', [0, 4, 4]); camMove(x, [hp.x + 0.3, hp.y, hp.z + 1.6], hp.toArray(), [hp.x + 0.08, hp.y, hp.z + 0.95], hp.toArray(), eio, 30); fillOn(x, w, 0.8, 1.9);
});
// "pai, ele vai ser muito importante lá embaixo" — hand on his son's head, then the camera sinks below
at(110.04, 'pai_down', x => {
  const s = voidS(x, 40, 14, '#ffd0a0', 3); const L = x.L; s.fog = null; const w = put(x, 'william', s, -0.3, 0, 0, 0.15); w.idle(x.t, 0.8); const c = put(x, 'cchild', s, 0.35, 0, 0.25, -0.1); c.idle(x.t, 1); lookAtCam(x, c, 0.5);
  aim(w, 'L', tp(c, 'head', [0, 9, 0]), eo(seg(L, 0.1, 0.6))); w.head.rotation.x = 0.35; w.head.rotation.y = -0.3;
  const k = eio(seg(L, 1.0, 2.8)); cam(x, [0.3, mix(1.5, -1.2, k), mix(3.6, 4.4, k)], [0, mix(1.25, -2.5, k), 0], 38); x.post.fade.value = 0.6 * sm(seg(L, 2.1, 2.8));
});
// "No primeiro jogo o phone guy solta, quase sem querer"
at(112.84, 'phone87', x => {
  const s = office(x); const L = x.L; phoneRing(x, L < 1.2 ? 1 : 0); const g = guardSit(x, s); g.head.rotation.y = -0.35; g.head.rotation.x = 0.2; aim(g, 'L', rootPt(g, 0.5, 1.2, 0.8), eo(seg(L, 1.0, 1.6)) * 0.6);
  const pp = x.S.phone.position; if (L > 1.2) waves(x, s, new V3(pp.x, pp.y + 0.25, pp.z), 0.8, '#ffe8c0');
  const a = mix(2.6, 2.1, eio(x.u)); cam(x, [Math.sin(a) * 2.6, 1.9, 0.15 + Math.cos(a) * 2.6], [0.3, 1.25, -0.4], 42);
});
// "A mordida de 87," — Foxy's jaw snaps shut
at(116.36, 'bite87', x => {
  const s = voidS(x, 30, 30, '#ff2a1a', 1); const L = x.L; const f = put(x, 'foxy', s, 0, 0, 0, 0); f.idle(x.t, 0.5); lookAtCam(x, f, 0.8);
  const o = eo(seg(L, 0, 0.6)) * (1 - ei(seg(L, 0.82, 0.92))); f.jaw.rotation.x = 0.8 * o; if (L > 0.92 && L < 1.3) shake(x, 0.8 * (1 - seg(L, 0.92, 1.3)));
  if (L > 0.92 && L < 1.0) x.post.flash.value = 0.3; const hp = tp(f, 'head', [0, 3, 6]); camMove(x, [hp.x + 0.5, hp.y - 0.1, hp.z + 1.9], hp.toArray(), [hp.x + 0.2, hp.y - 0.05, hp.z + 1.2], hp.toArray(), eo, 32);
  x.post.tint.value.set(1.12, 0.9, 0.9);
});
// "é incrível que o corpo humano consiga viver sem o lobo frontal" — a victim on the floor
at(118.66, 'lobe', x => {
  const s = x.S.party; x.out.scene = s; const L = x.L; x.post.vig.value = 1.0; x.S.partyRed.intensity = 6; const j = lie(x, 'jeremy', s, 0.2, -0.4, 0.3, 1);
  j.head.rotation.y = 0.5; const a = mix(0.4, -0.2, eio(x.u)); cam(x, [Math.sin(a) * 2.6, mix(3.4, 2.4, eio(x.u)), -0.4 + Math.cos(a) * 2.6], [0.1, 0.2, -0.4], 40); x.post.tint.value.set(0.9, 0.85, 0.95);
});
// "Alguém foi mordido por um animatrônico e perdeu parte do cérebro" — Mangle drops from the ceiling
at(121.70, 'bitten', x => {
  const s = x.S.cove; x.out.scene = s; const L = x.L; x.post.vig.value = 0.95; const m = x.MANGLE; s.add(m.root); m.reset(); m.root.scale.setScalar(1.25);
  m.root.rotation.set(0, 0, Math.PI); m.root.position.set(0, x.S.coveCeilY, mix(-3.0, -0.6, eo(seg(L, 0, 2.2)))); m.crawl(L * 1.4, 1 - seg(L, 1.9, 2.3)); m.idle(x.t, 0.6); m.setJaw(0.1 + 0.4 * eo(seg(L, 2.4, 2.9)));
  x.S.coveLamps.forEach((l, i) => l.intensity = 2.5 * flicker(x.t, i)); x.S.coveRed.intensity = 6 * sm(seg(L, 2.2, 2.8));
  const mz = m.root.position.z; camMove(x, [0.4, 1.55, 3.8], [0, 2.0, mz], [0.2, 1.65, 3.0], [0, 1.95, mz], eo, 44); hand(x, 0.6);
});
// "Quem mordeu," — a question in the dark
at(125.32, 'who', x => {
  const s = voidS(x, 10, 26, '#ff4a2a', 0.5); const L = x.L; const f = put(x, 'foxy', s, 0, 0, 0, 0); f.idle(x.t, 0.6); f.head.rotation.x = 0.25;
  rimOn(x, s, [0, 3.6, -3], [0, 1.6, 0], 50, '#ff6a3a'); camMove(x, [0.6, 1.5, 5.4], [0, 1.6, 0], [0.3, 1.6, 4.6], [0, 1.6, 0], eo, 36); pop(x, x.FX.q1, s, headTop(f, 0.85), 0.3, 0.8);
});
// "Foxy," — spot on Foxy
at(126.52, 'foxy', x => {
  const s = voidS(x, 46, 26, '#ff4a2a', 3); const L = x.L; const f = put(x, 'foxy', s, 0, 0, 0, 0); f.idle(x.t, 1); lookAtCam(x, f, 1); f.jaw.rotation.x = 0.35 * eo(seg(L, 0.1, 0.4));
  const hp = tp(f, 'head', [0, 3, 4]); camMove(x, [hp.x - 0.4, hp.y - 0.2, hp.z + 2.3], hp.toArray(), [hp.x - 0.2, hp.y - 0.1, hp.z + 1.7], hp.toArray(), eo, 34); if (L < 0.07) x.post.flash.value = 0.2;
});
// "Mangle," — Mangle hanging from the cove ceiling, face to the camera
at(127.30, 'mangle', x => {
  const s = x.S.cove; x.out.scene = s; const L = x.L; x.post.vig.value = 0.95; const m = x.MANGLE; s.add(m.root); m.reset(); m.root.scale.setScalar(1.25);
  m.root.rotation.set(0, 0, Math.PI); m.root.position.set(0, x.S.coveCeilY, -0.9); m.idle(x.t, 1); m.setJaw(0.25 + 0.1 * Math.sin(x.t * 5));
  camMove(x, [0.25, 1.6, 2.8], [0, 1.6, -0.9], [0.1, 1.6, 2.1], [0, 1.6, -0.9], eo, 42); x.S.coveLamps.forEach(l => l.intensity = 2); if (L < 0.07) x.post.flash.value = 0.2;
});
// "por mais de uma década a comunidade brigou por causa disso" — Foxy below, Mangle above: who did it?
at(128.34, 'debate', x => {
  const s = x.S.cove; x.out.scene = s; const L = x.L; x.post.vig.value = 0.95; const m = x.MANGLE; s.add(m.root); m.reset(); m.root.scale.setScalar(1.25);
  m.root.rotation.set(0, 0, Math.PI); m.root.position.set(1.3, x.S.coveCeilY, -1.4); m.idle(x.t, 1); m.setJaw(0.2 + 0.1 * Math.sin(x.t * 3));
  const f = put(x, 'foxy', s, -1.3, 0, -1.3, 0.25); f.idle(x.t, 1); f.head.rotation.y = 0.5 * Math.sin(x.t * 1.4); f.jaw.rotation.x = 0.2 + 0.15 * Math.sin(x.t * 6);
  const a = mix(-0.3, 0.3, eio(x.u)); cam(x, [Math.sin(a) * 4.6, 1.6, -1.2 + Math.cos(a) * 4.6], [0, 1.8, -1.3], 42); x.S.coveRed.intensity = 3;
});
// "Mas o que pouca gente percebe é que essa mordida não foi a primeira" — Fredbear
at(130.52, 'not_first', x => {
  const s = x.S.diner; x.out.scene = s; const L = x.L; x.post.vig.value = 1.0; x.S.dinerLamps.forEach((l, i) => l.intensity = 4 * flicker(x.t, i)); x.S.dinerSpot.intensity = 24;
  const f = put(x, 'fredbear', s, 0, 0.77, -4.4, 0); f.idle(x.t, 0.6); const k = eo(seg(L, 2.4, 2.8)); lookAtCam(x, f, k); f.head.rotation.x += 0.1 * (1 - k);
  const hp = tp(f, 'head', [0, 4, 4]); camMove(x, [0.6, 1.6, 0.6], hp.toArray(), [hp.x + 0.2, hp.y - 0.1, hp.z + 1.6], hp.toArray(), eio, 40); if (L > 2.5 && L < 2.6) x.post.flash.value = 0.2;
  x.post.tint.value.set(1.1, 0.95, 0.85);
});
// "Noite 4," — the office in the dark, the light trembling
at(133.92, 'night4', x => {
  const s = office1(x, 0.5 * flicker(x.t, 7)); const L = x.L; camMove(x, [0.0, 1.7, 1.9], [0, 1.45, -2.5], [0.4, 1.62, 1.2], [-0.4, 1.45, -2.5], eo, 46); hand(x, 1.0); x.post.tint.value.set(0.85, 0.9, 1.05);
});
// "o phone guy liga mais nervoso que o normal"
at(135.42, 'nervous', x => {
  const s = office(x); const L = x.L; phoneRing(x, 1); x.S.officeLamp.intensity = 4; const pp = x.S.phone.position; waves(x, s, new V3(pp.x, pp.y + 0.25, pp.z), 1.8, '#ff9a8a');
  camMove(x, [1.5, 1.5, 0.3], [0.85, 1.1, -0.78], [1.15, 1.3, -0.3], [0.85, 1.1, -0.78], eo, 40); shake(x, 0.15); x.post.tint.value.set(1.1, 0.92, 0.9);
});
// "Tem alguém batendo na porta dele," — the steel door shudders
at(137.28, 'knock', x => {
  const s = office1(x, 0.6); const L = x.L; x.S.doorL.position.y = 1.25; let hit = 0; for (const a of [0.35, 0.75, 1.15, 1.6]) { const d = L - a; if (d > 0 && d < 0.2) hit = Math.max(hit, 1 - d / 0.2); }
  x.S.doorL.position.x = -2.6 + 0.04 * hit; x.S.btnDoorL.material.emissiveIntensity = 1.5; if (hit > 0.7) shake(x, 0.25 * hit);
  camMove(x, [0.4, 1.6, 0.6], [-2.6, 1.4, 0], [0.0, 1.6, 0.3], [-2.6, 1.35, 0], eo, 46); hand(x, 0.6);
});
// "toca a musiquinha do Freddy" — blackout: Freddy's face flashes in the doorway
at(139.46, 'tune', x => {
  const s = office1(x, 0); const L = x.L; const f = put(x, 'freddy', s, -3.3, 0, 0.05, Math.PI / 2); f.idle(x.t, 0.3); lookAtCam(x, f, 0.8);
  const on = Math.sin(x.t * 9.5) > 0.1 ? 1 : 0; f.setEyeGlow('#ffffff', on); x.S.westDoorLight.intensity = 6 * on; if (on) fillOn(x, f, 1.5, 2.2); x.S.west.forEach(l => l.intensity = 0);
  camMove(x, [0.6, 1.55, 0.9], [-3.3, 2.0, 0], [0.2, 1.6, 0.6], [-3.3, 2.1, 0], eo, 40); x.post.tint.value.set(0.8, 0.85, 1.0);
});
// "e um rugido corta a ligação" — jumpscare
at(141.14, 'roar', x => {
  const s = office1(x, 0.2); const L = x.L; cam(x, [0, 1.65, 0.6], [-1.0, 1.7, -0.3], 46); const f = put(x, 'freddy', s, 0, 0, 0, 0); f.setEyeGlow('#ffffff', 1); jumpscare(x, f, L, { from: 2.4, to: 1.25, headY: 1.78 });
});
// "O cara que te ensinou a sobreviver" — empty chair, the handset hanging
at(142.52, 'teacher', x => {
  const s = office(x); const L = x.L; x.S.officeLamp.intensity = 3 * flicker(x.t, 3); x.S.phoneHandset.position.set(0.25, -0.35, 0.18); x.S.phoneHandset.rotation.set(0.2, 0, 1.45 + 0.08 * Math.sin(x.t * 1.8));
  camMove(x, [1.7, 1.45, 1.8], [0.4, 0.9, -0.6], [1.2, 1.3, 1.2], [0.5, 0.9, -0.7], eo, 42); x.post.tint.value.set(0.85, 0.9, 1.0);
});
// "morreu do jeito que ele mesmo descreveu" — an empty-looking Freddy suit, slumped, leaking
at(144.54, 'died', x => {
  const s = voidS(x, 26, 22, '#ff2a1a', 1); const L = x.L; const f = put(x, 'freddy', s, 0, 0, 0, 0.1); slump(f, 1); f.head.rotation.x = 0.55;
  drips(x, f, 0.6 + 0.4 * eio(x.u), [[-2.0, 3.4], [2.0, 3.4], [-1.6, 3.3], [1.5, 3.3]], 3.4);
  const hp = tp(f, 'head', [0, 4, 4]); const a = mix(0.5, 0.1, eio(x.u)); cam(x, [hp.x + Math.sin(a) * 3.0, hp.y + 0.4, hp.z + Math.cos(a) * 3.0], [hp.x, hp.y - 0.5, hp.z], 38); x.post.tint.value.set(1.1, 0.85, 0.85);
});
// "E tem gente que jura que no meio do barulho dá pra ouvir o grito do"
at(147.00, 'swear', x => {
  const s = office(x); const L = x.L; x.S.officeLamp.intensity = 3; x.S.phoneHandset.position.set(0.25, -0.35, 0.18); x.S.phoneHandset.rotation.set(0.2, 0, 1.45);
  const hp = x.S.phone.localToWorld(new V3(0.25, -0.35, 0.18)); waves(x, s, hp, 1.0, '#ffd0a0');
  camMove(x, [hp.x + 1.4, hp.y + 0.5, hp.z + 1.4], hp.toArray(), [hp.x + 0.7, hp.y + 0.25, hp.z + 0.7], hp.toArray(), eio, 40); if (Math.sin(x.t * 3.1) > 0.97) x.post.stat.value = 0.2;
});
// "Golden Freddy" — slumped in the office
at(151.22, 'golden', x => {
  const s = office1(x, 0.7); const L = x.L; const g = put(x, 'golden', s, 0, 0, -0.55, 0); slump(g, 1); g.head.rotation.x = mix(0.5, 0.3, eo(seg(L, 0.6, 1.4)));
  if (L < 0.06) x.post.stat.value = 0.6; camMove(x, [0.5, 1.9, 1.95], [0, 0.75, -0.45], [0.25, 1.8, 1.7], [0, 0.8, -0.45], eo, 56); fillOn(x, g, 1.0, 1.4);
});
// "Um animatrônico que oficialmente nem deveria existir" — glitching in and out of reality
at(153.48, 'not_exist', x => {
  const s = voidS(x, 34, 20, '#ffd040', 2); const L = x.L; const g = put(x, 'golden', s, 0, 0, 0, 0); g.idle(x.t, 0.4); lookAtCam(x, g, 0.8); g.head.rotation.z = 0.25;
  g.setEyeGlow('#000000', 0); glitchIn(x, g, 0.4 + 0.6 * seg(L, 1.8, 2.8)); g.root.visible = L < 2.75 && Math.sin(x.t * 37) > -0.6 + 1.2 * seg(L, 1.8, 2.8);
  const hp = tp(g, 'head', [0, 4, 4]); camMove(x, [0.4, 1.6, 4.6], [0, 1.7, 0], [hp.x + 0.15, hp.y, hp.z + 1.8], hp.toArray(), eio, 36);
  x.post.chroma.value = 0.5 + 0.5 * seg(L, 1.8, 2.8); x.post.stat.value = L > 2.75 ? 0.8 : 0.1 * seg(L, 1.8, 2.8);
});
