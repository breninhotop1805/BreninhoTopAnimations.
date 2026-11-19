// QUANTOS MINECRAFTS CABEM DENTRO DE UM GTA 6? — shot list. Times = real word timestamps (faster-whisper).
import * as THREE from 'three';
import { gesture, holdPose, wave, laugh, startle, nod, headShake, alive, walkPath, gestW, springE } from './act.js';

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
function lookAt(c, P, w = 1) { c.root.updateMatrixWorld(true); const hp = c.neck.getWorldPosition(new V3()); const dx = P.x - hp.x, dz = P.z - hp.z, dy = P.y - (hp.y + 0.25);
  const yaw = wrap(Math.atan2(dx, dz) - c.root.rotation.y - c.torso.rotation.y); c.head.rotation.y = mix(c.head.rotation.y, cl(yaw, -1.1, 1.1), w); c.head.rotation.x = mix(c.head.rotation.x, cl(-Math.atan2(dy, Math.hypot(dx, dz)), -0.6, 0.6), w); }
const lookCam = (x, c, w = 1) => lookAt(c, x.camera.position, w);
const hp = c => { c.root.updateMatrixWorld(true); return c.head.localToWorld(new V3(0, 4 / 16, 0)); };
function closeOn(x, c, d0, d1, side = 0.25, dy = -0.15, fov = 40, e = eo) { const h = hp(c); const k = e(x.u); const d = mix(d0, d1, k); const a = c.root.rotation.y; const fw = new V3(Math.sin(a), 0, Math.cos(a)), rt = new V3(fw.z, 0, -fw.x);
  cam(x, [h.x + fw.x * d + rt.x * side * d, h.y + dy, h.z + fw.z * d + rt.z * side * d], [h.x, h.y + dy * 0.6 - 0.12, h.z], fov); }
function bubble(x, which, scene, c, a0, s = 1) { const L = x.L; if (L < a0) return; const b = x.FX[which]; scene.add(b); const k = back(seg(L, a0, a0 + 0.3)); const h = hp(c); const r = new V3().setFromMatrixColumn(x.camera.matrixWorld, 0);
  b.position.copy(h).addScaledVector(r, 0.45).add(new V3(0, 0.55 + 0.03 * Math.sin((L - a0) * 6), 0)); b.scale.setScalar(Math.max(0.001, s * k)); b.quaternion.copy(x.camera.quaternion); }
const num = (x, txt, a0, v = 0.17, px = 26, u = 0.5) => { if (x.L < a0) return null; return { type: 'num', txt, u, v, px, k: back(seg(x.L, a0, a0 + 0.3)), a: Math.min(1, (x.L - a0) / 0.06) }; };
const ui = (x, ...items) => { const it = items.filter(Boolean); x.out.ui = it.length ? it : null; };
function city(x) { const s = x.S.city; x.out.scene = s; x.post.vig.value = 0.55; x.S.sea.material.color.setHSL(0.6, 0.55, 0.42 + 0.03 * Math.sin(x.t * 2)); return s; }
function mcw(x) { const s = x.S.mc; x.out.scene = s; x.post.vig.value = 0.35; x.bloom.strength = 0.2; return s; }
function classic(x) { const s = x.S.classic; x.out.scene = s; x.post.vig.value = 0.3; x.bloom.strength = 0.15; x.post.tint.value.set(1.02, 1.03, 1.0); return s; }
function landBlock(x, s, b, p, t0, t1, h0 = 9, parts = 'parts') { const L = x.L; s.add(b); const k = seg(L, t0, t1); const yy = p.y + h0 * (1 - k) * (1 - k); b.position.set(p.x, L < t0 ? p.y + h0 : yy, p.z); b.rotation.set(2.5 * (1 - k), 1.8 * (1 - k), 0);
  if (L >= t1) { const sq = Math.sin(seg(L, t1, t1 + 0.22) * Math.PI) * 0.12; b.scale.set(1 + sq, 1 - sq, 1 + sq); const P = x.FX[parts]; s.add(P); P.userData.update(seg(L, t1, t1 + 0.9), new V3(p.x, p.y - 0.4, p.z)); } }

const shots = []; const at = (t, name, fn) => shots.push({ t, name, fn });

// 0.00 "Quantos Minecrafts" — crane down from the sunset sky onto Ocean Drive; a grass block drops from the sky on "Minecrafts"
at(0.00, 'hook', x => {
  const s = city(x); const L = x.L; const st = put(x, 'steve', s, 0, 0, 0, Math.PI / 2); walkPath(st, L, -0.4, 1.4, [2.6, -5.0], [5.4, -5.0], { stride: 0.95 }); if (L > 0.75) lookAt(st, new V3(7.4, 0.6, -2.6), eo(seg(L, 0.75, 1.0)));
  landBlock(x, s, x.FX.block, new V3(7.4, 0.5, -2.6), 0.3, 0.62, 14); if (L > 0.72) startle(st, L, 0.72, 0.7);
  const k = eio(seg(L, 0, 1.0)); cam(x, [mix(3, 6.6, k), mix(18, 1.8, k), mix(20, 3.6, k)], [mix(4, 5.4, k), mix(8, 1.2, k), mix(-25, -3.8, k)], 48); if (L > 0.62 && L < 0.8) shake(x, 0.35);
});
// 1.32 "cabem dentro de um único" — Steve looks at the block, then to us; "?" pops
at(1.32, 'cabem', x => {
  const s = city(x); const L = x.L; const st = put(x, 'steve', s, 5.4, 0.2, -4.9, 0.9); alive(st, x.t, 1); const bp = new V3(7.4, 0.5, -2.6); s.add(x.FX.block); x.FX.block.position.copy(bp);
  lookAt(st, L < 0.5 ? bp : x.camera.position, L < 0.5 ? 0.9 : 0.6 + 0.3 * eo(seg(L, 0.5, 0.8))); gesture(st, 'point', L, 0.05, 0.75, 0.9, { face: false });
  camMove(x, [9.0, 1.5, 2.2], [6.2, 1.1, -3.8], [8.4, 1.6, 1.4], [6.0, 1.3, -4.0], eo, 46); bubble(x, 'q', s, st, 0.6);
});
// 2.42 "GTA 6?" — Jason & Lucia by the classic yellow car under the neon; the GTA VI logo slams in over the blurred city
at(2.42, 'gta6', x => {
  const s = city(x); const L = x.L; const j = put(x, 'jason', s, -34.0, 0.2, -4.2, 0.35); const l = put(x, 'lucia', s, -35.5, 0.2, -4.5, 0.5); alive(j, x.t, 1); alive(l, x.t, 1, 2);
  lookCam(x, j, 0.7); lookCam(x, l, 0.7); j.setFace({ lid: 0.25, slope: 1 }); l.setFace({ lid: 0.2, slope: 1 });
  camMove(x, [-31.4, 1.7, 3.4], [-33.6, 1.45, -3.8], [-32.0, 1.75, 2.2], [-34.0, 1.5, -3.9], eo, 46);
  const k = back(seg(L, 0, 0.32)); x.post.blur.value = 0.35 * eo(seg(L, 0, 0.25)); ui(x, { type: 'logo', which: 'gta', v: 0.26, w: 0.78, k: 0.6 + 0.4 * k, a: Math.min(1, L / 0.06) });
});
// 3.54 "E o número que deu no final simplesmente" — Steve thinking, close, slow push
at(3.54, 'numero', x => {
  const s = city(x); const L = x.L; const st = put(x, 'steve', s, 6.0, 0.2, -5.0, 0.85); alive(st, x.t, 1); lookCam(x, st, 0.7); gesture(st, 'think', L, 0.1, 9);
  closeOn(x, st, 3.8, 2.7, 0.15, -0.15, 42); hand(x);
});
// 4.98 "vai bugar a sua mente" — hands to the head, screen glitches on "bugar"
at(4.98, 'bug', x => {
  const s = city(x); const L = x.L; const st = put(x, 'steve', s, 6.0, 0.2, -5.0, 0.85); alive(st, x.t, 1); lookCam(x, st, 0.8); gesture(st, 'cower', L, 0.32, 9, 0.85, { face: false }); st.setFace({ mouth: L > 0.4 ? 1 : 0, lid: 0 }); st.noBlink = true;
  const gl = seg(L, 0.4, 0.5) * (1 - seg(L, 0.9, 1.4)); x.post.glitch.value = 0.9 * gl; x.post.chroma.value = 1.2 * gl; if (L > 0.4) shake(x, 0.4 * gl);
  closeOn(x, st, 3.2, 2.7, 0.15, -0.15, 42); punch(x, 0.4, 0.2);
});
// 6.54 "Hoje o GTA 6 chegou pedindo 212 GB do seu console" — a giant PS5 rises from the park on "chegou"; storage board fills; "212 GB" on "212"
at(6.54, 'ps5', x => {
  const s = city(x); const L = x.L; x.S.ps5.visible = x.S.board.visible = true; const rise = eo(seg(L, 0.8, 1.35)); x.S.ps5.position.y = 0.2 - 8 * (1 - rise); x.S.board.position.y = -10 * (1 - eo(seg(L, 1.0, 1.5)));
  x.drawBoard(x.S, eo(seg(L, 1.05, 2.2)) * 0.98, L < 1.42 ? '' : '212 GB', false); if (L > 0.8 && L < 1.4) shake(x, 0.25 * Math.sin(seg(L, 0.8, 1.4) * Math.PI));
  const j = put(x, 'jason', s, 1.0, 0.05, 12.0, 0.1); const l = put(x, 'lucia', s, -0.8, 0.05, 12.2, -0.1); alive(j, x.t, 1); alive(l, x.t, 1, 2); const ps = new V3(-3.6, 6, 8.3); lookAt(j, L < 0.9 ? x.camera.position : ps, 0.8); lookAt(l, L < 0.9 ? x.camera.position : ps, 0.8);
  if (L > 0.85) { startle(l, L, 0.85, 0.5); }
  camMove(x, [1.0, 2.2, 24.0], [0, 4.6, 8.4], [0.5, 2.6, 21.0], [0, 5.0, 8.4], eo, 50); ui(x, num(x, '212 GB', 1.42, 0.13, 26));
});
// 9.18 "do seu console" — close on the PS5 and its glowing blue light; board full
at(9.18, 'console', x => {
  const s = city(x); const L = x.L; x.S.ps5.visible = x.S.board.visible = true; x.S.ps5.position.y = 0.2; x.S.board.position.y = 0; x.drawBoard(x.S, 0.98, '212 GB', false);
  camMove(x, [2.2, 6.6, 26.0], [1.6, 6.4, 8.5], [3.2, 7.4, 23.0], [2.8, 7.4, 8.5], eo, 46);
});
// 10.48 "Simplesmente o jogo mais pesado da história" — the PS5 sinks with a heavy thud on "pesado", dust; Jason & Lucia jump back
at(10.48, 'heavy', x => {
  const s = city(x); const L = x.L; x.S.ps5.visible = x.S.board.visible = true; const thud = eo(seg(L, 0.92, 1.08)); x.S.ps5.position.y = 0.2 - 0.35 * thud; x.drawBoard(x.S, 1, 'CHEIO', L > 0.92);
  if (L > 0.92 && L < 1.5) shake(x, 0.6 * (1 - seg(L, 0.92, 1.5))); const P = x.FX.parts; s.add(P); P.userData.update(seg(L, 0.92, 1.8), new V3(-6.2, 0.3, 9.2)); const P2 = x.FX.parts2; s.add(P2); P2.userData.update(seg(L, 0.92, 1.8), new V3(-1.0, 0.3, 9.2));
  const j = put(x, 'jason', s, 1.0, 0.05, 12.0, 0.1); const l = put(x, 'lucia', s, -0.8, 0.05, 12.2, -0.1); alive(j, x.t, 1); alive(l, x.t, 1, 2); startle(j, L, 0.94, 0.8); startle(l, L, 0.96, 0.8); lookAt(j, new V3(-3.6, 4, 8.3), 0.8); lookAt(l, new V3(-3.6, 4, 8.3), 0.8);
  camMove(x, [1.4, 2.2, 25.0], [-0.6, 4.0, 9.0], [0.8, 2.0, 22.5], [-0.6, 3.8, 9.0], eo, 52); bubble(x, 'ex', s, l, 0.95); punch(x, 0.92, 0.15);
});
// 13.64 "O Minecraft de hoje" — the Minecraft world (real textures); Steve on a hill; Minecraft logo pops on "Minecraft"
at(13.64, 'mc', x => {
  const s = mcw(x); const L = x.L; const gy = x.S.mcHeight(0.5, -6.5); const st = put(x, 'steve', s, 0.5, gy, -6.5, 0.3); alive(st, x.t, 1); lookCam(x, st, 0.7); wave(st, 'L', L, 0.35, 1.2, x.t);
  const k = eio(x.u); cam(x, [mix(5, 2.5, k), gy + mix(3.5, 2.2, k), mix(2, -0.5, k)], [0.5, gy + 1.4, -7], 50);
  const lk = back(seg(L, 0.16, 0.46)); const a = Math.min(1, (L - 0.16) / 0.06) * (1 - sm(seg(L, 1.0, 1.25))); x.post.blur.value = 0.5 * a; if (L > 0.16) ui(x, { type: 'logo', which: 'mc', v: 0.28, w: 0.42, k: 0.6 + 0.4 * lk, a });
});
// 14.92 "com tudo instalado, tem por volta de 1 GB" — a single grass block spins like a dropped item next to Steve; "1 GB" on "1"
at(14.92, 'onegb', x => {
  const s = mcw(x); const L = x.L; const gy = x.S.mcHeight(0.5, -6.5); const st = put(x, 'steve', s, -0.3, gy, -6.5, 0.6); alive(st, x.t, 1); const b = x.FX.block; s.add(b); b.scale.setScalar(0.45); b.position.set(1.1, gy + 0.7 + 0.1 * Math.sin(x.t * 3), -6.2); b.rotation.y = x.t * 1.6;
  lookAt(st, b.position, 0.8); gesture(st, 'point', L, 0.4, 9, 0.8, { face: false }); camMove(x, [3.0, gy + 1.7, -2.4], [0.4, gy + 1.0, -6.4], [2.5, gy + 1.6, -3.0], [0.5, gy + 0.9, -6.3], eo, 46); punch(x, 1.72, 0.15);
  ui(x, num(x, '1 GB', 1.72, 0.15, 30));
});
// 17.44 "Então, de cara, cabem os 212 Minecrafts dentro do GTA 6" — 212 grass blocks rain onto Vice City's beach, counter counts up
at(17.44, 'rain212', x => {
  const s = city(x); const L = x.L; const R = x.FX.rainCity; s.add(R); const shown = x.updateRain(R, eo(seg(L, 0.5, 2.6)), 0.7);
  const k = eio(x.u); cam(x, [mix(-6, 4, k), mix(9, 14, k), mix(30, 34, k)], [mix(-2, 2, k), 1.5, 10], 50); hand(x, 0.6);
  ui(x, L > 0.5 ? { type: 'num', txt: String(Math.min(212, Math.round(212 * seg(L, 0.5, 1.96)))), v: 0.15, px: 34, k: 1 + 0.06 * Math.sin(x.t * 20) * (L < 2 ? 1 : 0), a: 1 } : null);
  if (L > 1.96 && L < 2.04) x.post.flash.value = 0.04;
});
// 22.34 "212 mundos infinitos" — dive into one block: inside it, an endless Minecraft world
at(22.34, 'inside', x => {
  const L = x.L;
  if (L < 0.42) { const s = city(x); const R = x.FX.rainCity; s.add(R); x.updateRain(R, 1, 0.7); const b = R.userData.P[100]; const k = eio(seg(L, 0, 0.42)); cam(x, [b.x + mix(2.5, 0.0, k), b.y + mix(2.0, 0.1, k), b.z + mix(4.0, 0.62, k)], [b.x, b.y, b.z], 50); x.post.flash.value = 0.8 * sm(seg(L, 0.3, 0.42)); }
  else { const s = mcw(x); const k = eo(seg(L, 0.42, 1.54)); cam(x, [mix(-10, 8, k), 16 - 5 * k, mix(10, -6, k)], [mix(-4, 12, k), 4, mix(-14, -22, k)], 60); x.post.flash.value = 0.8 * (1 - sm(seg(L, 0.42, 0.62))); }
  ui(x, num(x, '212', 0.0, 0.14, 30));
});
// 23.88 "dentro de uma cidade só" — pull back out over Vice City full of blocks
at(23.88, 'onecity', x => {
  const s = city(x); const L = x.L; const R = x.FX.rainCity; s.add(R); x.updateRain(R, 1, 0.7); const k = eio(x.u);
  cam(x, [mix(1, 6, k), mix(6, 26, k), mix(24, 44, k)], [0, mix(2, 4, k), mix(8, -6, k)], 52);
});
// 25.52 "Parece muito, né?" — Jason, unimpressed, nods
at(25.52, 'muito', x => {
  const s = city(x); const L = x.L; const j = put(x, 'jason', s, 6.0, 0.2, -5.0, 0.85); alive(j, x.t, 1); lookCam(x, j, 0.8); nod(j, L, 0.4, 2, 0.2); j.setFace({ lid: 0.3, slope: 0.5 });
  closeOn(x, j, 3.8, 2.8, 0.15, -0.15, 42); bubble(x, 'q', s, j, 0.9);
});
// 26.68 "Mas isso não é nada" — Steve shakes his head, waves it off
at(26.68, 'nada', x => {
  const s = city(x); const L = x.L; const st = put(x, 'steve', s, 6.0, 0.2, -5.0, 0.85); alive(st, x.t, 1); lookCam(x, st, 0.8); headShake(st, L, 0.45, 2, 0.32); gesture(st, 'shrug', L, 0.75, 9);
  closeOn(x, st, 3.6, 2.7, 0.15, -0.15, 42); punch(x, 0.52, 0.12);
});
// 27.80 "Porque o Minecraft não nasceu desse tamanho" — in Minecraft, the block in front of Steve shrinks
at(27.80, 'shrink', x => {
  const s = mcw(x); const L = x.L; const gy = x.S.mcHeight(0.5, -6.5); const st = put(x, 'steve', s, -0.4, gy, -6.6, 0.45); alive(st, x.t, 1); const b = x.FX.block; s.add(b);
  const sc = mix(1, 0.25, eio(seg(L, 0.9, 1.9))); b.scale.setScalar(sc); b.position.set(1.0, gy + sc / 2, -6.0); lookAt(st, b.position, 0.8); gesture(st, 'think', L, 0.0, 9, 0.8);
  camMove(x, [2.6, gy + 1.6, -3.4], [0.4, gy + 0.9, -6.3], [2.2, gy + 1.3, -3.9], [0.6, gy + 0.6, -6.2], eo, 44);
});
// 30.22 "Em 2009, a primeira versão do jogo" — the Classic world: pale sky, flat lime grass, strong blue water; "2009"
at(30.22, 'y2009', x => {
  const s = classic(x); const L = x.L; const k = eio(x.u); cam(x, [mix(-12, -4, k), mix(14, 9, k), mix(12, 8, k)], [mix(-2, 0, k), 2, -8], 56); ui(x, num(x, '2009', 0.1, 0.15, 34));
});
// 32.08 "era só grama" — low over the lime grass
at(32.08, 'grama', x => { const s = classic(x); const L = x.L; const k = eio(x.u); cam(x, [mix(-10, -6, k), 7.5, mix(6, 4, k)], [mix(-4, -1, k), 2.5, -10], 52); punch(x, 0.22, 0.12); });
// 32.78 "pedra" — the stone outcrop
at(32.78, 'pedra', x => { const s = classic(x); const L = x.L; const k = eio(x.u); cam(x, [mix(3.5, 2.0, k), 5.2, mix(5.5, 3.8, k)], [-2.5, 3.6, -4.5], 48); punch(x, 0.0, 0.12); });
// 33.24 "e um Steve parado" — the original Steve, totally still (no idle — that's the joke)
at(33.24, 'parado', x => {
  const s = classic(x); const L = x.L; const st = put(x, 'oldsteve', s, 1.5, 4.0, -2.5, 0.4); const gy = 3; st.root.position.y = topAt(x, 1.5, -2.5); const h = hp(st);
  cam(x, [h.x + mix(2.6, 1.8, eio(x.u)), h.y - 0.3, h.z + mix(2.8, 2.0, eio(x.u))], [h.x, h.y - 0.6, h.z], 44); punch(x, 0.48, 0.15);
});
function topAt(x, px, pz) { let top = 0; for (const c of x.S.classicCells) if (c[0] === Math.floor(px) && c[2] === Math.floor(pz) && c[3] !== 'water' && c[1] + 1 > top) top = c[1] + 1; return top; }
// 34.46 "E ela tinha menos de 1 mega" — a classic block shrinks to a speck; "< 1 MB"
at(34.46, 'mb', x => {
  const s = classic(x); const L = x.L; const b = x.FX.block; s.add(b); const sc = mix(1, 0.12, eio(seg(L, 0.4, 1.2))); b.scale.setScalar(sc); const gy = topAt(x, 0.5, -1.5); b.position.set(0.5, gy + 0.6 + 0.08 * Math.sin(x.t * 3), -1.5); b.rotation.y = x.t * 1.4;
  b.material = b.userData.classicM || (b.userData.classicM = b.material); cam(x, [0.5 + 0.8, gy + 1.2, -1.5 + mix(3.2, 2.2, eio(x.u))], [0.5, gy + 0.6, -1.5], 40); ui(x, num(x, '< 1 MB', 1.16, 0.16, 30));
});
// 36.12 "Agora refaz a conta comigo" — Steve in Vice City at dusk, hand on chin
at(36.12, 'refaz', x => {
  const s = city(x); const L = x.L; const st = put(x, 'steve', s, 6.0, 0.2, -5.0, 0.85); alive(st, x.t, 1); lookCam(x, st, 0.8); gesture(st, 'think', L, 0.2, 9); st.setFace({ lid: 0.25, slope: 0.5 });
  closeOn(x, st, 4.0, 2.8, 0.15, -0.15, 42, eio); bubble(x, 'q', s, st, 0.7);
});
// 37.60 "se cada Minecraft tem menos de 1 mega, dentro de um único GTA 6" — the maths in neon over the PS5
at(37.60, 'math', x => {
  const s = city(x); const L = x.L; x.S.ps5.visible = x.S.board.visible = true; x.S.ps5.position.y = -0.15; x.drawBoard(x.S, 1, '212 GB', false);
  const k = eio(x.u); cam(x, [mix(3, 0, k), mix(3.6, 4.4, k), mix(30, 27, k)], [0.3, 6.0, 8.4], 50);
  ui(x, num(x, '212 GB', 2.96, 0.085, 22), x.L > 2.96 ? num(x, '÷ 1 MB', 2.96, 0.215, 22) : num(x, '< 1 MB', 1.32, 0.215, 22));
});
// 41.22 "cabem mais de 200 mil Minecrafts originais" — CLIMAX: an avalanche of tiny blocks buries the coast; "200.000+"
at(41.22, 'avalanche', x => {
  const s = city(x); const L = x.L; const R = x.FX.rainMany; s.add(R); x.updateRain(R, eo(seg(L, 0.2, 2.4)), 0.8); const R2 = x.FX.rainCity; s.add(R2); x.updateRain(R2, 1, 0.7);
  const k = eio(x.u); cam(x, [mix(0, 8, k), mix(3, 32, k), mix(16, 46, k)], [0, mix(2, 0, k), mix(6, 0, k)], mix(50, 58, k)); if (L > 0.7 && L < 2.0) shake(x, 0.12);
  const n = Math.round(200000 * eo(seg(L, 0.7, 1.6))); ui(x, L > 0.7 ? { type: 'num', txt: (n >= 200000 ? '200.000+' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')), v: 0.15, px: 20, k: 1 + 0.05 * Math.sin(x.t * 22) * (n < 200000 ? 1 : 0), a: 1 } : null);
  if (L > 1.6 && L < 1.66) x.post.flash.value = 0.05;
});
// 44.26 "E o mais bizarro é que esse joguinho, com esse tamanho" — Steve on top of a block pile on the beach
at(44.26, 'pile', x => {
  const s = city(x); const L = x.L; const P = x.FX.pyr; s.add(P); P.position.set(2, 0.05, 14); const st = put(x, 'steve', s, 2, 4.05, 14, 0.3); alive(st, x.t, 1); lookCam(x, st, 0.7); gesture(st, 'think', L, 0.3, 9, 0.6);
  const a = 0.6 - 0.9 * eio(x.u); cam(x, [2 + Math.sin(a) * 8.5, 4.2, 14 + Math.cos(a) * 8.5], [2, 3.6, 14], 50);
});
// 46.52 "virou o mais vendido da história" — he throws his arms up, golden block shines, neon fireworks; "#1"
at(46.52, 'top', x => {
  const s = city(x); const L = x.L; const P = x.FX.pyr; s.add(P); P.position.set(2, 0.05, 14); const st = put(x, 'steve', s, 2, 4.05, 14, 0.2); alive(st, x.t, 1); lookCam(x, st, 0.7); gesture(st, 'cheer', L, 0.4, 9); st.setFace({ mouth: L > 0.5 ? 0.8 : 0 });
  const gb = x.FX.gold; s.add(gb); gb.scale.setScalar(0.5); gb.position.set(1.1, 4.3 + 0.08 * Math.sin(x.t * 3), 14.3); gb.rotation.y = x.t * 2;
  const F = x.FX.sparks; s.add(F); F.position.set(2, 7.5, 13); const k = seg(L, 0.56, 1.3); F.children.forEach(m => { const v = m.userData.v; m.position.set(v.x * k * 1.6, v.y * k * 1.2 - 2 * k * k, v.z * k * 0.6); m.visible = k > 0 && k < 1; });
  closeOn(x, st, 4.4, 3.6, 0.3, -0.3, 46); ui(x, num(x, '#1', 0.56, 0.13, 34)); punch(x, 0.56, 0.12);
});
// 48.44 "E se você pudesse escolher, levava um GTA 6 ou 200 mil Minecrafts?" — pan from Jason & Lucia (GTA) to Steve on the pile (Minecraft)
at(48.44, 'choose', x => {
  const s = city(x); const L = x.L; const P = x.FX.pyr; s.add(P); P.position.set(3.5, 0.05, 14); const st = put(x, 'steve', s, 3.5, 4.05, 14, -0.2); alive(st, x.t, 1);
  const j = put(x, 'jason', s, -2.8, 0.05, 13.5, 0.25); const l = put(x, 'lucia', s, -4.3, 0.05, 13.3, 0.35); alive(j, x.t, 1); alive(l, x.t, 1, 2); lookCam(x, j, 0.7); lookCam(x, l, 0.7); lookCam(x, st, 0.7);
  gesture(j, 'chest', L, 1.84, 2.6, 0.8, { face: false }); gesture(st, 'cheer', L, 2.92, 9, 0.8, { face: false });
  const p = eio(seg(L, 1.84, 2.4)) * 0.5 + eio(seg(L, 2.92, 3.4)) * 0.5; const cx = mix(-3.4, 3.5, p); cam(x, [cx, 3.2, 21.0], [cx, mix(1.6, 3.4, p), 13.8], 46);
  if (L > 3.74) bubble(x, 'q', s, st, 3.74); ui(x, L > 1.84 && L < 2.92 ? { type: 'logo', which: 'gta', v: 0.13, w: 0.36, k: back(seg(L, 1.84, 2.1)), a: 1 - sm(seg(L, 2.7, 2.92)) } : (L > 2.92 ? num(x, '200.000+', 2.92, 0.13, 20) : null));
});
// 52.84 "Comenta aí" — Steve and Jason wave with their OUTER arms, well apart
at(52.84, 'outro', x => {
  const s = city(x); const L = x.L; const st = put(x, 'steve', s, 7.0, 0.2, -5.0, -0.2); const j = put(x, 'jason', s, 5.0, 0.2, -5.0, 0.2); alive(st, x.t, 1); alive(j, x.t, 1, 2); lookCam(x, st, 0.7); lookCam(x, j, 0.7);
  wave(st, 'L', L, 0.05, 9, x.t); wave(j, 'R', L, 0.1, 9, x.t + 0.4); camMove(x, [7.4, 1.5, 1.6], [5.8, 1.9, -5], [6.9, 1.5, 0.8], [5.9, 1.9, -5], eo, 48);
});

export const SHOTS = shots;
export const DURATION = 53.70;
