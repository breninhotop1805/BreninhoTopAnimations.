// POR QUE O GLAMROCK FREDDY TEM UM COMPARTIMENTO PRA CRIANÇAS? — shot list. Times = real word timestamps (faster-whisper).
// Sets: mainstage (stage top y=1, z=-3.4), atrium (floor 0), party (floor 0), gallery (SL stage y=1, z=-3.4), control (SL), ug (tunnels).
import * as THREE from 'three';
import { gesture, startle, headShake, nod, wave, alive, walkPath, springE } from './act.js';

const V3 = THREE.Vector3;
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = x => { x = cl(x); return x * x * (3 - 2 * x); };
const eio = x => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eo = x => { x = cl(x); return 1 - Math.pow(1 - x, 3); };
const back = x => { x = cl(x); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const seg = (t, a, b) => cl((t - a) / (b - a));
const mix = (a, b, k) => a + (b - a) * k;
const mixv = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

function cam(x, p, l, fov) { x.camera.position.set(...p); x.camera.up.set(0, 1, 0); x.camera.lookAt(...l); if (fov) x.camera.fov = fov; }
function camMove(x, p0, l0, p1, l1, e = eio, fov = 42) { const k = e(x.u); cam(x, mixv(p0, p1, k), mixv(l0, l1, k), fov); }
function punch(x, at, amt = 0.18, dur = 0.25) { const k = eo(seg(x.L, at, at + dur)); if (k > 0) x.camera.fov *= 1 - amt * k; }
function hand(x, a = 1) { const t = x.t, c = x.camera; c.rotateX(a * 0.004 * (Math.sin(t * 1.9) + 0.5 * Math.sin(t * 3.7 + 1))); c.rotateY(a * 0.004 * (Math.sin(t * 1.4 + 2) + 0.5 * Math.sin(t * 3.1))); c.rotateZ(a * 0.003 * Math.sin(t * 1.1 + 4)); }
function shake(x, a) { const t = x.t, c = x.camera; c.rotateX(a * 0.03 * Math.sin(t * 61)); c.rotateY(a * 0.03 * Math.sin(t * 47 + 1)); c.rotateZ(a * 0.02 * Math.sin(t * 53 + 2)); }
function put(x, name, scene, px, py, pz, ry = 0) { const c = x.C[name]; scene.add(c.root); c.root.position.set(px, py, pz); c.root.rotation.set(0, ry, 0); c.root.scale.setScalar(c.baseScale); x.live.push(c); return c; }
function lookAt(c, P, w = 1) { c.root.updateMatrixWorld(true); const hp = c.neck.getWorldPosition(new V3()); const dx = P.x - hp.x, dz = P.z - hp.z, dy = P.y - (hp.y + 0.25 * c.root.scale.y);
  const yaw = wrap(Math.atan2(dx, dz) - c.root.rotation.y - c.torso.rotation.y); c.head.rotation.y = mix(c.head.rotation.y, cl(yaw, -1.1, 1.1), w); c.head.rotation.x = mix(c.head.rotation.x, cl(-Math.atan2(dy, Math.hypot(dx, dz)), -0.6, 0.6), w); }
const lookCam = (x, c, w = 1) => lookAt(c, x.camera.position, w);
const hp = c => { c.root.updateMatrixWorld(true); return c.head.localToWorld(new V3(0, 4 / 16, 0)); };
function bubble(x, which, scene, c, a0, s = 1) { const L = x.L; if (L < a0) return; const b = x.FX[which]; scene.add(b); const k = back(seg(L, a0, a0 + 0.3)); const h = hp(c); const r = new V3().setFromMatrixColumn(x.camera.matrixWorld, 0);
  b.position.copy(h).addScaledVector(r, 0.35).add(new V3(0, 0.42 + 0.03 * Math.sin((L - a0) * 6), 0)); b.scale.setScalar(Math.max(0.001, s * k)); b.quaternion.copy(x.camera.quaternion); }
// aim an arm (pivot) at a world point
function aimArm(c, A, P, w = 1) { c.root.updateMatrixWorld(true); const sh = A.piv.getWorldPosition(new V3()); const d = P.clone().sub(sh); const q = new THREE.Quaternion(); A.piv.parent.getWorldQuaternion(q); d.applyQuaternion(q.invert()).normalize();
  const cz = Math.asin(cl(d.x, -1, 1)), ax = Math.atan2(-d.z, -d.y); A.piv.rotation.x = mix(A.piv.rotation.x, ax, w); A.piv.rotation.z = mix(A.piv.rotation.z, cz, w); }

const U = 1 / 16;
const scene = (x, n, vig = 0.65) => { const s = x.S[n]; x.out.scene = s; x.post.vig.value = vig; if (n === 'atrium') { x.S.atKey.color.set('#fff0e2'); x.S.atKey.intensity = 22; } return s; };
const stage = x => { const s = scene(x, 'mainstage', 0.7); x.S.stageSpots.forEach((l, i) => l.target.position.set(Math.sin(x.t * 1.3 + i * 1.7) * 3, 1.5, -3.4)); return s; };
const gallery = x => { const s = scene(x, 'gallery', 0.8); x.S.SL.bulbs.forEach((b, i) => b.visible = Math.sin(x.t * 6 + i * 0.9) > -0.6); return s; };
// world point inside Freddy's cavity (local units in skin pixels)
const cavPt = (c, x, y, z) => { c.root.updateMatrixWorld(true); return c.cav.localToWorld(new V3(x * U, y * U, z * U)); };
// POV from inside the cavity looking out through the doors
function povInside(x, c) { const e = cavPt(c, 0, 0.6, -0.8), f = cavPt(c, 0, 0.3, 40); cam(x, [e.x, e.y, e.z], [f.x, f.y, f.z], 70); }
function cakeIn(x, s, c, k) { // the cavity floor slides out as a tray carrying the cake, then back in (k 0 out .. 1 in)
  const [W, H] = c.cavSize; const z = mix(10, 0.4, k); const base = cavPt(c, 0, -H / 2 + 0.2, z); const ck = x.FX.cake; s.add(ck); ck.scale.setScalar(0.58); ck.position.copy(base); ck.rotation.y = c.root.rotation.y;
  const tr = x.FX.tray || (x.FX.tray = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: '#b8bcc6', metalness: 0.8, roughness: 0.3 }))); s.add(tr); const sc = c.root.scale.x;
  tr.scale.set((W - 0.6) * U * sc, 0.25 * U * sc, 3.2 * U * sc); tr.position.copy(base).add(new V3(0, -0.13 * U * sc, 0)); tr.rotation.y = c.root.rotation.y; }

const shots = []; const at = (t, name, fn) => shots.push({ t, name, fn });

// 0.00 "O Glamrock Freddy" — main stage, spots sweep; Freddy hits a rock-star pose; punch-in on "Freddy"
at(0.00, 'hook', x => {
  const s = stage(x); const L = x.L; const f = put(x, 'gfreddy', s, 0, 1.0, -3.4, 0); alive(f, x.t, 1); gesture(f, 'cheer', L, 0.3, 9, 0.9); lookCam(x, f, 0.6);
  const k = eio(seg(L, 0, 0.84)); cam(x, [mix(-2.2, 0.4, k), mix(1.0, 2.0, k), mix(7.5, 3.4, k)], [0, mix(2.4, 3.6, k), -3.4], 52); punch(x, 0.5, 0.14); x.post.flash.value = 0.03 * (1 - seg(L, 0, 0.15));
});
// 0.84 "nunca foi projetado pra salvar" — close: Freddy shakes his head, a little sad
at(0.84, 'nunca', x => {
  const s = stage(x); const L = x.L; const f = put(x, 'gfreddy', s, 0, 1.0, -3.4, 0); alive(f, x.t, 1); lookCam(x, f, 0.7); headShake(f, L, 0.05, 2, 0.25); f.head.rotation.x += 0.12 * seg(L, 0.6, 1.0);
  const h = hp(f); const k = eo(x.u); cam(x, [h.x + mix(1.2, 0.8, k), h.y - 0.3, h.z + mix(3.6, 2.9, k)], [h.x, h.y - 0.35, h.z], 44);
});
// 2.08 "pra salvar o Gregory" — atrium: Gregory runs to Freddy, who opens his arms
at(2.08, 'salvar', x => {
  const s = scene(x, 'atrium'); const L = x.L; const f = put(x, 'gfreddy', s, 0, 0, -1.2, 0.15); alive(f, x.t, 1); gesture(f, 'shrug', L, 0.25, 9, 0.8, { face: false });
  const g = put(x, 'gregory', s, 0, 0, 2, Math.PI); walkPath(g, L, -0.2, 0.75, [1.6, 3.4], [0.5, 0.75], { stride: 1.0, run: 1 }); lookAt(g, hp(f), seg(L, 0.5, 0.8) * 0.8); lookAt(f, hp(g), 0.7);
  camMove(x, [-2.4, 1.6, 5.6], [0.3, 1.5, 0.2], [-2.0, 1.6, 5.0], [0.3, 1.6, 0.1], eo, 50);
});
// 3.18 "Na verdade, aquele compartimento na barriga dele" — on the belly; the hatch opens on "barriga"
at(3.18, 'barriga', x => {
  const s = scene(x, 'atrium'); const L = x.L; const f = put(x, 'gfreddy', s, 0, 0, -1.2, 0); alive(f, x.t, 0.6); f.setHatch(springE(seg(L, 1.74, 2.2))); lookAt(f, cavPt(f, 0, 0, 8), 0.5 * seg(L, 1.4, 1.8));
  const c = cavPt(f, 0, 0, 4); const k = eio(x.u); cam(x, [c.x + mix(0.8, 0.25, k), c.y + mix(0.6, 0.15, k), c.z + mix(3.6, 1.9, k)], [c.x, c.y + mix(0.6, 0.05, k), c.z], 46); punch(x, 1.74, 0.1);
});
// 5.52 "esconde uma origem bem mais sombria" — push into the open cavity; the light turns red on "sombria"
at(5.52, 'sombria', x => {
  const s = scene(x, 'atrium', 0.9); const L = x.L; const f = put(x, 'gfreddy', s, 0, 0, -1.2, 0); f.setHatch(1); alive(f, x.t, 0.4); const r = seg(L, 1.1, 1.4); f.hatchLight.color.set(r > 0.5 ? '#ff3030' : '#8ad8ff'); f.hatchLight.intensity = 0.35 + 0.2 * r;
  const c = cavPt(f, 0, 0, 2); const k = eio(x.u); cam(x, [c.x + 0.1, c.y + 0.05, c.z + mix(1.6, 0.75, k)], [c.x, c.y, c.z - 0.2], 48); x.post.tint.value.set(1, 1 - 0.25 * r, 1 - 0.25 * r); x.post.vig.value = 0.9 + 0.3 * r;
});
// 7.44 "Quando você se esconde dentro do Freddy" — Gregory's POV from INSIDE: the doors close in front of us
at(7.44, 'dentro1', x => {
  const s = scene(x, 'atrium'); const L = x.L; const f = put(x, 'gfreddy', s, 0, 0, 2.0, Math.PI); f.setHatch(1 - 0.7 * eio(seg(L, 0.84, 1.5))); alive(f, x.t, 0.3); povInside(x, f); f.hatchLight.intensity = 0.12;
  x.post.vig.value = 1.0; hand(x, 0.5);
});
// 9.24 "Security Breach" — logo over the blurred atrium (Freddy + Gregory)
at(9.24, 'sb', x => {
  const s = scene(x, 'atrium'); const L = x.L; const f = put(x, 'gfreddy', s, -0.7, 0, -0.6, 0.2); alive(f, x.t, 1); const g = put(x, 'gregory', s, 0.9, 0, 0.6, -0.2); alive(g, x.t, 1, 2); lookCam(x, f, 0.6); lookCam(x, g, 0.6);
  cam(x, [0.1, 1.6, 6.0 - 0.4 * x.u], [0.1, 1.7, 0], 50); x.post.blur.value = 0.8 * eo(seg(L, 0, 0.2)); x.out.ui = [{ type: 'logo', which: 'sb', v: 0.3, w: 0.78, k: 0.6 + 0.4 * back(seg(L, 0, 0.3)), a: Math.min(1, L / 0.06) }];
});
// 10.08 "ele mesmo avisa que aquele espaço existe apenas" — Freddy explains, hand on his belly; Gregory looks up
at(10.08, 'avisa1', x => {
  const s = scene(x, 'atrium'); const L = x.L; const f = put(x, 'gfreddy', s, -0.6, 0, -1.0, 0.45); alive(f, x.t, 1); gesture(f, 'chest', L, 0.2, 9, 0.55, { face: false }); nod(f, L, 1.2, 2, 0.12);
  const g = put(x, 'gregory', s, 0.9, 0, 0.5, -2.4); alive(g, x.t, 1, 2); lookAt(g, hp(f), 0.85); lookAt(f, hp(g), 0.8);
  camMove(x, [1.9, 1.9, 3.4], [-0.2, 1.7, -0.5], [1.6, 1.9, 3.0], [-0.2, 1.8, -0.5], eo, 48);
});
// 12.24 "pra carregar bolos gigantes durante as festas" — the cavity floor slides out as a tray with a big cake, then back in; "gigantes" punch
at(12.24, 'bolo1', x => {
  const s = scene(x, 'atrium'); const L = x.L; const f = put(x, 'gfreddy', s, 0, 0, -1.2, 0); alive(f, x.t, 0.5); f.setHatch(1 - eio(seg(L, 1.6, 2.1))); lookAt(f, cavPt(f, 0, -2, 9), 0.6);
  cakeIn(x, s, f, eio(seg(L, 0.32, 1.3)));
  const c = cavPt(f, 0, -1, 4); const k = eo(x.u); cam(x, [c.x + mix(1.4, 0.9, k), c.y + 0.35, c.z + mix(2.4, 1.9, k)], [c.x, c.y, c.z], 46); punch(x, 0.66, 0.12);
});
// 14.54 "Quando você se esconde dentro do Freddy" — he walks the dark Pizzaplex with the hatch closed, a faint blue line glowing at the seam
at(14.54, 'dentro2', x => {
  const s = scene(x, 'atrium', 0.8); const L = x.L; const f = put(x, 'gfreddy', s, 0, 0, 0, 0); walkPath(f, L, -0.6, 1.6, [-1.6, -2.6], [0.2, 0.2], { stride: 0.9 }); f.setHatch(0.04); f.hatchLight.intensity = 0.3;
  const h = hp(f); cam(x, [h.x + 2.2, 1.7, h.z + 3.2], [h.x, 1.8, h.z], 46); punch(x, 0.92, 0.1);
});
// 16.44 "Security Breach" — wide crane over the neon atrium
at(16.44, 'sb2', x => { const s = scene(x, 'atrium'); const k = eio(x.u); cam(x, [mix(-3, 2, k), mix(7, 4.5, k), mix(9, 7, k)], [0, 2, -5], 56); });
// 17.22 "ele mesmo avisa que aquele espaço..." — from Gregory's height: Freddy leans in and taps his chest
at(17.22, 'avisa2', x => {
  const s = scene(x, 'atrium'); const L = x.L; const f = put(x, 'gfreddy', s, 0, 0, -1.0, 0); alive(f, x.t, 1); f.torso.rotation.x += 0.12 * eo(seg(L, 0.1, 0.5)); gesture(f, 'chest', L, 0.4, 9, 0.55, { face: false }); lookCam(x, f, 0.8);
  const k = eo(x.u); cam(x, [0.35, 1.25, mix(2.4, 1.9, k)], [0, 2.5, -1.0], 50);
});
// 19.36 "carregar bolos de aniversário durante as festas" — a birthday party: cake with candles on the table, confetti on "aniversário"
at(19.36, 'bolo2', x => {
  const s = scene(x, 'party', 0.6); const L = x.L; const T = x.FX.table; s.add(T); T.position.set(0.9, 0, -1.6); const B = x.FX.bday; s.add(B); B.position.set(0.9, T.userData.top, -1.6);
  const f = put(x, 'gfreddy', s, -0.5, 0, -2.6, 0.3); alive(f, x.t, 1); gesture(f, 'cheer', L, 0.78, 9, 0.85); lookCam(x, f, 0.6);
  const F = x.FX.confetti; s.add(F); F.position.set(0, 0, -1.5); F.userData.update(x.t, 5, 4 * seg(L, 0.75, 1.2) + 0.01, 3); F.visible = L > 0.75;
  camMove(x, [1.6, 1.6, 2.6], [0.1, 1.5, -2.0], [1.3, 1.6, 2.0], [0.1, 1.6, -2.0], eo, 52);
});
// 21.80 "Parece uma desculpa bem inocente de empresa, né?" — Gregory, unconvinced: hand on chin, "?" on "né"
at(21.80, 'desculpa', x => {
  const s = scene(x, 'atrium'); const L = x.L; const g = put(x, 'gregory', s, 0, 0, 0.8, 0.2); alive(g, x.t, 1); gesture(g, 'think', L, 0.3, 9); lookCam(x, g, 0.6); g.setFace({ lid: 0.3, slope: 0.6 });
  const h = hp(g); const k = eo(x.u); cam(x, [h.x + mix(0.9, 0.6, k), h.y - 0.05, h.z + mix(2.2, 1.6, k)], [h.x, h.y - 0.25, h.z], 44); bubble(x, 'q', s, g, 2.26);
});
// 24.40 "Só que quem conhece o passado da franquia" — down in the dark tunnels; glitch on "passado"
at(24.40, 'passado', x => {
  const s = scene(x, 'ug', 0.95); const L = x.L; const k = eio(x.u); cam(x, [0, 1.6, mix(6, 2, k)], [0, 1.5, -8], 52); const gl = seg(L, 0.88, 0.95) * (1 - seg(L, 1.1, 1.4)); x.post.glitch.value = 0.7 * gl; x.post.chroma.value = gl;
});
// 26.18 "sabe exatamente que essa engenharia não nasceu ali" — orbit around the open mechanism; Freddy shakes his head on "não"
at(26.18, 'engenharia', x => {
  const s = scene(x, 'atrium'); const L = x.L; const f = put(x, 'gfreddy', s, 0, 0, -1.2, 0); alive(f, x.t, 0.5); f.setHatch(1); headShake(f, L, 1.62, 2, 0.22);
  const c = cavPt(f, 0, 0, 2); const a = mix(-0.7, 0.5, eio(x.u)); cam(x, [c.x + Math.sin(a) * 1.5, c.y + 0.2, c.z + Math.cos(a) * 1.5], [c.x, c.y + 0.1, c.z], 46);
});
// 28.56 "Se você voltar no tempo até Sister Location" — rewind glitch, then the Circus Gallery; SL logo on "Sister Location"
at(28.56, 'voltar', x => {
  const L = x.L; if (L < 0.8) { const s = scene(x, 'atrium'); const f = put(x, 'gfreddy', s, 0, 0, -1.2, 0); f.setHatch(1); const c = cavPt(f, 0, 0, 2); cam(x, [c.x, c.y, c.z + 1.4 - L], [c.x, c.y, c.z], 46 + 30 * L);
    x.post.glitch.value = seg(L, 0.3, 0.8); x.post.chroma.value = 2 * seg(L, 0.3, 0.8); x.post.tint.value.set(1, 1, 1 + 0.4 * seg(L, 0.3, 0.8)); }
  else { const s = gallery(x); const k = eo(seg(L, 0.8, 2.26)); cam(x, [0, 2.0, mix(7.5, 6.2, k)], [0, 2.4, -3.4], 50); x.post.glitch.value = 0.8 * (1 - seg(L, 0.8, 1.1));
    if (L > 1.6) { x.post.blur.value = 0.8; x.out.ui = [{ type: 'logo', which: 'sl', v: 0.3, w: 0.8, k: 0.6 + 0.4 * back(seg(L, 1.6, 1.9)), a: Math.min(1, (L - 1.6) / 0.06) }]; } }
});
// 30.82 "vai lembrar que os robôs Funtime também" — Funtime Freddy and Funtime Foxy on stage; punch on "Funtime"
at(30.82, 'funtimes', x => {
  const s = gallery(x); const L = x.L; const a = put(x, 'ffreddy', s, -1.05, 1.0, -3.4, 0.2); const b = put(x, 'ffoxy', s, 1.05, 1.0, -3.4, -0.2); alive(a, x.t, 1); alive(b, x.t, 1, 2); lookCam(x, a, 0.6); lookCam(x, b, 0.6);
  wave(a, 'R', L, 0.4, 9, x.t); x.S.SL.galSpot.intensity = 40;
  camMove(x, [0.3, 2.0, 4.6], [0, 2.6, -3.4], [0.1, 2.1, 3.8], [0, 2.7, -3.4], eo, 50); punch(x, 1.14, 0.12);
});
// 32.32 "tinham exatamente essa mesma" — Funtime Foxy close, her chest hatch swings open
at(32.32, 'mesma', x => {
  const s = gallery(x); const L = x.L; const b = put(x, 'ffoxy', s, 0, 1.0, -3.4, 0); alive(b, x.t, 0.8); b.setHatch(springE(seg(L, 0.7, 1.2))); lookCam(x, b, 0.6); x.S.SL.galSpot.intensity = 40;
  const c = cavPt(b, 0, 0, 2); const k = eo(x.u); cam(x, [c.x + mix(1.2, 0.7, k), c.y + 0.4, c.z + mix(2.8, 2.1, k)], [c.x, c.y + 0.3, c.z], 46);
});
// 34.08 "abertura gigante no peito" — Funtime Freddy: the chest opens on "abertura", punch on "gigante"
at(34.08, 'abertura', x => {
  const s = gallery(x); const L = x.L; const a = put(x, 'ffreddy', s, 0, 1.0, -3.4, 0); alive(a, x.t, 0.8); a.setHatch(springE(seg(L, 0.0, 0.45))); lookCam(x, a, 0.5); x.S.SL.galSpot.intensity = 40;
  const c = cavPt(a, 0, 0, 2); const k = eio(x.u); cam(x, [c.x - mix(0.9, 0.3, k), c.y + 0.2, c.z + mix(2.6, 1.5, k)], [c.x, c.y + 0.1, c.z], 46); punch(x, 0.4, 0.14);
});
// 35.74 "Mas naquela época eles não carregavam doces" — Ballora turns on her toes, her chest opens: empty, dark
at(35.74, 'doces', x => {
  const s = gallery(x); const L = x.L; const b = put(x, 'ballora', s, 0, 1.0, -3.4, 0); b.root.rotation.y = Math.PI * 2 * eio(seg(L, 0, 0.9)); b.armR.piv.rotation.set(-0.2, 0, -2.5 + 0.1 * Math.sin(x.t * 3)); b.armL.piv.rotation.set(-0.2, 0, 2.5 - 0.1 * Math.sin(x.t * 3));
  b.setHatch(springE(seg(L, 1.0, 1.4))); headShake(b, L, 1.0, 2, 0.15); x.S.SL.galSpot.intensity = 40;
  const k = eo(x.u); cam(x, [0.5, 2.3, mix(3.2, 2.6, k)], [0, 2.4, -3.4], 50);
});
// 38.16 "Aqueles compartimentos foram criados pelo próprio William Afton" — Circus Control: William at the console; Funtime Freddy open behind the glass
at(38.16, 'william', x => {
  const s = scene(x, 'control', 0.8); const L = x.L; const w = put(x, 'william', s, 0.5, 0, 0.6, 0.1); alive(w, x.t, 1); if (L > 1.6) lookCam(x, w, eo(seg(L, 1.6, 2.0)) * 0.8); else lookAt(w, new V3(-0.4, 2, -4), 0.7);
  const a = put(x, 'ffreddy', s, -0.5, 0, -4.2, 0); a.setHatch(1); alive(a, x.t, 0.4); w.setFace({ lid: 0.3, slope: 1 }); x.S.SL.ctrlKey.intensity = 14;
  const k = eo(x.u); cam(x, [mix(1.4, 0.9, k), 1.8, mix(3.6, 3.0, k)], [0.0, 1.7, -0.8], 48); punch(x, 2.24, 0.14);
});
// 41.02 "com um único objetivo" — William, close, sinister
at(41.02, 'objetivo', x => {
  const s = scene(x, 'control', 0.85); const L = x.L; const w = put(x, 'william', s, 0.2, 0, 0.7, 0.2); alive(w, x.t, 1); gesture(w, 'evil', L, 0.15, 9, 0.9, { face: false }); lookCam(x, w, 0.8); w.setFace({ lid: 0.35, slope: 1, mouth: 0.6 });
  x.S.SL.ctrlKey.intensity = 14; const h = hp(w); const k = eo(x.u); cam(x, [h.x + 0.4, h.y - 0.1, h.z + mix(1.9, 1.4, k)], [h.x, h.y - 0.2, h.z], 44);
});
// 42.38 "capturar e prender crianças escondidas" — a kid walks past Ballora; her chest opens, the kid jumps back on "prender"
at(42.38, 'capturar', x => {
  const s = gallery(x); const L = x.L; const b = put(x, 'ballora', s, -0.9, 1.0, -3.4, 0.35); b.armR.piv.rotation.set(-0.2, 0, -2.5); b.armL.piv.rotation.set(-0.2, 0, 2.5); b.setHatch(springE(seg(L, 0.0, 0.4))); b.hatchLight.color.set("#ff3040"); b.hatchLight.intensity = 0.5;
  const k = put(x, 'kid', s, 0, 1.0, -2.0, Math.PI); walkPath(k, L, -0.6, 0.62, [1.6, -2.0], [0.8, -2.1], { stride: 0.9 }); k.root.rotation.y = -Math.PI / 2 + mix(0, -0.9, seg(L, 0.62, 0.8)); lookAt(k, cavPt(b, 0, 0, 2), seg(L, 0.4, 0.7));
  if (L > 0.64) { startle(k, L, 0.64, 1); k.setFace({ mouth: 1 }); k.noBlink = true; }
  x.S.SL.galSpot.intensity = 30; x.post.tint.value.set(1, 0.85, 0.85); camMove(x, [1.6, 2.0, 1.2], [-0.2, 2.0, -2.8], [1.3, 2.0, 0.8], [-0.2, 2.0, -2.8], eo, 50); if (L > 0.64 && L < 0.9) shake(x, 0.2);
});
// 44.80 "A nova empresa simplesmente reaproveitou" — side by side: Funtime Freddy and Glamrock Freddy open their chests together on "reaproveitou"
at(44.80, 'reaproveitou', x => {
  const s = scene(x, 'atrium'); const L = x.L; const a = put(x, 'ffreddy', s, -1.15, 0, -1.6, 0.25); const f = put(x, 'gfreddy', s, 1.15, 0, -1.6, -0.25); alive(a, x.t, 0.6); alive(f, x.t, 0.6, 2);
  const o = springE(seg(L, 1.2, 1.6)); a.setHatch(o); f.setHatch(o); lookCam(x, a, 0.5); lookCam(x, f, 0.5);
  camMove(x, [0, 2.0, 6.6], [0, 1.9, -1.6], [0, 2.0, 5.9], [0, 1.95, -1.6], eo, 50); punch(x, 1.2, 0.06);
});
// 47.24 "o projeto macabro do assassino" — William laughing in the dark control room
at(47.24, 'macabro', x => {
  const s = scene(x, 'control', 0.9); const L = x.L; const w = put(x, 'william', s, 0.2, 0, 0.7, 0.15); alive(w, x.t, 1); gesture(w, 'evil', L, 0.2, 9, 1, { face: false }); w.head.rotation.x -= 0.18 * Math.abs(Math.sin(x.t * 9)) * seg(L, 0.3, 0.5); w.setFace({ lid: 0.2, slope: 1, mouth: 1 }); lookCam(x, w, 0.6);
  x.S.SL.ctrlKey.intensity = 14; x.post.tint.value.set(1.1, 0.85, 0.9); const h = hp(w); cam(x, [h.x - 0.3, h.y - 0.35, h.z + 1.6 - 0.3 * x.u], [h.x, h.y - 0.1, h.z], 46);
});
// 48.26 "dizendo que era pra festas" — the party: Freddy cheers by the birthday cake, confetti
at(48.26, 'festas', x => {
  const s = scene(x, 'party', 0.6); const L = x.L; const T = x.FX.table; s.add(T); T.position.set(-0.9, 0, -1.4); const B = x.FX.bday; s.add(B); B.position.set(-0.9, T.userData.top, -1.4);
  const f = put(x, 'gfreddy', s, 1.1, 0, -2.4, -0.35); alive(f, x.t, 1); wave(f, 'L', L, 0.2, 9, x.t); lookCam(x, f, 0.7);
  const F = x.FX.confetti; s.add(F); F.position.set(0, 0, -1.6); F.userData.update(x.t, 5, 4, 3);
  camMove(x, [-1.5, 1.4, 1.4], [0.1, 1.5, -1.8], [-1.1, 1.4, 1.0], [0.1, 1.6, -1.8], eo, 50);
});
// 50.04 "A ironia bizarra é que a mesma armadilha" — Freddy's hatch opening slowly in the dark, blue light
at(50.04, 'ironia', x => {
  const s = scene(x, 'atrium', 0.95); const L = x.L; const f = put(x, 'gfreddy', s, 0, 0, -1.2, 0); alive(f, x.t, 0.4); f.setHatch(eio(seg(L, 0.1, 1.2))); f.hatchLight.intensity = 0.5;
  const c = cavPt(f, 0, 0, 2); const k = eio(x.u); cam(x, [c.x - 0.6 + 0.4 * k, c.y + 0.1, c.z + 2.2 - 0.5 * k], [c.x, c.y, c.z], 46);
});
// 51.48 "inventada pra capturar crianças" — Funtime Freddy's scooper in red light, spinning
at(51.48, 'armadilha', x => {
  const s = gallery(x); const L = x.L; const a = put(x, 'ffreddy', s, 0, 1.0, -3.4, 0); alive(a, x.t, 0.5); a.setHatch(1); a.scoop.rotation.z = x.t * 2; a.hatchLight.color.set("#ff3040"); a.hatchLight.intensity = 0.5; x.S.SL.galSpot.intensity = 20;
  x.post.tint.value.set(1.1, 0.8, 0.85); const c = cavPt(a, 0, 0, 2); const k = eio(x.u); cam(x, [c.x + 0.6 - 0.5 * k, c.y + 0.1, c.z + 2.0 - 0.6 * k], [c.x, c.y, c.z], 46); punch(x, 1.4, 0.1);
});
// 53.44 "acabou virando o único lugar seguro" — inside again (Gregory's view): the doors close softly, warm blue light; "seguro"
at(53.44, 'seguro', x => {
  const s = scene(x, 'atrium'); const L = x.L; const f = put(x, 'gfreddy', s, 0, 0, 2.0, Math.PI); f.setHatch(1 - 0.7 * eio(seg(L, 0.6, 1.5))); alive(f, x.t, 0.3); povInside(x, f); f.hatchLight.color.set('#8ad8ff'); f.hatchLight.intensity = 0.12; x.post.vig.value = 0.9;
});
// 55.20 "pra salvar a vida do Gregory" — Freddy, protective, pats the closed belly; Gregory's face lit by the seam glow is implied
at(55.20, 'vida', x => {
  const s = scene(x, 'atrium'); const L = x.L; const f = put(x, 'gfreddy', s, 0, 0, -1.0, 0); alive(f, x.t, 1); gesture(f, 'chest', L, 0.2, 9, 0.55, { face: false }); f.setHatch(0.04); f.hatchLight.intensity = 0.3; lookCam(x, f, 0.7); nod(f, L, 0.7, 1, 0.12);
  const h = hp(f); const k = eo(x.u); cam(x, [h.x + 0.6, h.y - 0.9, h.z + mix(3.2, 2.6, k)], [h.x, h.y - 0.7, h.z], 46);
});
// 56.50 "Você já tinha ligado esses projetos?" — Gregory next to Freddy, "?" and a shrug
at(56.50, 'ligado', x => {
  const s = scene(x, 'atrium'); const L = x.L; const f = put(x, 'gfreddy', s, -0.95, 0, -1.0, 0.3); alive(f, x.t, 1); f.setHatch(1); lookCam(x, f, 0.6);
  const g = put(x, 'gregory', s, 1.0, 0, -0.2, -0.3); alive(g, x.t, 1, 2); gesture(g, 'shrug', L, 0.6, 9, 0.9); lookCam(x, g, 0.7); g.setFace({ slope: -0.5 });
  camMove(x, [0.2, 1.7, 5.4], [0, 1.6, -0.6], [0.1, 1.7, 4.8], [0, 1.65, -0.6], eo, 50); bubble(x, 'q', s, g, 1.1);
});
// 58.58 "Comenta aí e me segue pra mais mistérios" — both wave with their OUTER arms, confetti
at(58.58, 'comenta', x => {
  const s = scene(x, 'atrium'); const L = x.L; const f = put(x, 'gfreddy', s, -1.0, 0, -1.0, 0.25); const g = put(x, 'gregory', s, 1.0, 0, -0.3, -0.25); alive(f, x.t, 1); alive(g, x.t, 1, 2); lookCam(x, f, 0.7); lookCam(x, g, 0.7);
  wave(f, 'R', L, 0.05, 9, x.t); wave(g, 'L', L, 0.1, 9, x.t + 0.4); const F = x.FX.confetti; s.add(F); F.position.set(0, 0, -0.6); F.userData.update(x.t, 5, 4, 3);
  camMove(x, [0, 1.7, 5.6], [0, 1.6, -0.6], [0, 1.7, 5.0], [0, 1.65, -0.6], eo, 50);
});

export const SHOTS = shots;
export const DURATION = 60.74;
