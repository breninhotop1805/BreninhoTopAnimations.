// QUANTOS MINECRAFTS CABEM DENTRO DE UM GTA 6? — shot list v2. Times = real word timestamps (faster-whisper).
// Settings rotate: Ocean Drive street / rooftop with neon / convertible on the beach road / promenade at sunset /
// inside the PS5's SSD (data hall) / Minecraft today / Minecraft Classic 2009. Grass only in the Minecraft worlds
// (plus the single block that falls in the hook).
import * as THREE from 'three';
import { gesture, wave, startle, nod, headShake, alive, walkPath, springE } from './act.js';

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
function bubble(x, which, scene, c, a0, s = 1) { const L = x.L; if (L < a0) return; const b = x.FX[which]; scene.add(b); const k = back(seg(L, a0, a0 + 0.3)); const h = hp(c); const r = new V3().setFromMatrixColumn(x.camera.matrixWorld, 0);
  b.position.copy(h).addScaledVector(r, 0.45).add(new V3(0, 0.55 + 0.03 * Math.sin((L - a0) * 6), 0)); b.scale.setScalar(Math.max(0.001, s * k)); b.quaternion.copy(x.camera.quaternion); }
const num = (x, txt, a0, v = 0.17, px = 26, u = 0.5) => { if (x.L < a0) return null; return { type: 'num', txt, u, v, px, k: back(seg(x.L, a0, a0 + 0.3)), a: Math.min(1, (x.L - a0) / 0.06) }; };
const ui = (x, ...items) => { const it = items.filter(Boolean); x.out.ui = it.length ? it : null; };
const dots = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
function city(x) { const s = x.S.city; x.out.scene = s; x.post.vig.value = 0.55; x.bloom.strength = 0.5; return s; }
function mcw(x) { const s = x.S.mc; x.out.scene = s; x.post.vig.value = 0.35; x.bloom.strength = 0.2; return s; }
function classic(x) { const s = x.S.classic; x.out.scene = s; x.post.vig.value = 0.3; x.bloom.strength = 0.15; x.post.tint.value.set(1.02, 1.03, 1.0); return s; }
function ssd(x, fill = 1, field = 0) { const s = x.S.ssd; x.out.scene = s; x.post.vig.value = 0.7; x.bloom.strength = 0.7; x.S.updateSSD(fill); x.S.updateField(field); return s; }
function landBlock(x, s, b, p, t0, t1, h0 = 9, parts = 'parts') { const L = x.L; s.add(b); const k = seg(L, t0, t1); const yy = p.y + h0 * (1 - k) * (1 - k); b.position.set(p.x, L < t0 ? p.y + h0 : yy, p.z); b.rotation.set(2.5 * (1 - k), 1.8 * (1 - k), 0);
  if (L >= t1) { const sq = Math.sin(seg(L, t1, t1 + 0.22) * Math.PI) * 0.12; b.scale.set(1 + sq, 1 - sq, 1 + sq); const P = x.FX[parts]; s.add(P); P.userData.update(seg(L, t1, t1 + 0.9), new V3(p.x, p.y - 0.4, p.z)); } }
// seated pose (convertible): thighs forward, pelvis on the seat
function sit(c) { c.legR.piv.rotation.set(-Math.PI / 2, 0, 0.04); c.legL.piv.rotation.set(-Math.PI / 2, 0, -0.04); }
// the convertible driving east on the beach-side lane; Jason drives (left seat), Lucia rides
function drive(x, s, x0, v) { const cv = x.S.conv; cv.visible = true; const cx = x0 + v * x.L; cv.position.set(cx, 0.02 * Math.sin(x.t * 9), -0.9); cv.userData.wheels.forEach(w => { w.rotation.z = -cx / 0.36; });
  const U = x.U; const y = 1.09 + 2 * U - 12 * U + cv.position.y; const j = put(x, 'jason', s, cx - 0.15, y, -0.9 - 0.52, Math.PI / 2); const l = put(x, 'lucia', s, cx - 0.15, y, -0.9 + 0.52, Math.PI / 2);
  alive(j, x.t, 0.6); alive(l, x.t, 0.6, 2); sit(j); sit(l);
  for (const A of [j.armR, j.armL]) A.piv.rotation.x = -0.9 + 0.04 * Math.sin(x.t * 2); j.armR.piv.rotation.z = 0.12; j.armL.piv.rotation.z = -0.12;
  l.armR.piv.rotation.x = -0.55; l.armL.piv.rotation.x = -0.55; l.armL.piv.rotation.z = -0.08; return { cx, j, l }; }
const R = x => x.S.roof;
function topAt(x, px, pz) { let top = 0; for (const c of x.S.classicCells) if (c[0] === Math.floor(px) && c[2] === Math.floor(pz) && c[3] !== 'water' && c[1] + 1 > top) top = c[1] + 1; return top; }

const shots = []; const at = (t, name, fn) => shots.push({ t, name, fn });

// 0.00 "Quantos Minecrafts" — crane down from the sunset sky onto Ocean Drive (traffic, neon); a grass block crashes on the sidewalk
at(0.00, 'hook', x => {
  const s = city(x); const L = x.L; const st = put(x, 'steve', s, 0, 0.2, 0, Math.PI / 2); walkPath(st, L, -0.4, 1.32, [2.2, -5.0], [5.6, -5.0], { stride: 0.95 }); if (L > 0.72) lookAt(st, new V3(7.6, 0.7, -4.4), eo(seg(L, 0.72, 1.0)));
  landBlock(x, s, x.FX.block, new V3(7.6, 0.7, -4.4), 0.3, 0.62, 14); if (L > 0.66) startle(st, L, 0.66, 0.7);
  const k = eio(seg(L, 0, 1.0)); cam(x, [mix(4, 8.8, k), mix(20, 1.7, k), mix(22, 0.4, k)], [mix(4, 6.0, k), mix(9, 1.3, k), mix(-25, -4.6, k)], 48); if (L > 0.62 && L < 0.8) shake(x, 0.35);
});
// 1.32 "cabem dentro de um único" — Steve looks at the block, then at us; "?" pops
at(1.32, 'cabem', x => {
  const s = city(x); const L = x.L; const st = put(x, 'steve', s, 5.6, 0.2, -5.0, 1.0); alive(st, x.t, 1); const bp = new V3(7.6, 0.7, -4.4); s.add(x.FX.block); x.FX.block.position.copy(bp);
  lookAt(st, bp, 0.9); if (L > 0.45) lookAt(st, x.camera.position, eo(seg(L, 0.45, 0.9)) * 0.85); gesture(st, 'point', L, 0.05, 0.8, 0.9, { face: false });
  camMove(x, [9.6, 1.6, -0.6], [6.4, 1.2, -4.6], [9.0, 1.7, -1.2], [6.2, 1.4, -4.8], eo, 46); bubble(x, 'q', s, st, 0.6);
});
// 2.42 "GTA 6?" — Jason & Lucia next to their pink convertible under the neon; GTA VI logo over the blurred street
at(2.42, 'gta6', x => {
  const s = city(x); const L = x.L; const cv = x.S.conv; cv.visible = true; cv.position.set(-46.6, 0, -2.45); cv.userData.wheels.forEach(w => w.rotation.z = 0);
  const j = put(x, 'jason', s, -41.2, 0.2, -4.6, 1.0); const l = put(x, 'lucia', s, -43.1, 0.2, -4.7, 1.1); alive(j, x.t, 1); alive(l, x.t, 1, 2);
  lookCam(x, j, 0.7); lookCam(x, l, 0.7); j.setFace({ lid: 0.25, slope: 1 }); l.setFace({ lid: 0.2, slope: 1 });
  camMove(x, [-37.4, 1.6, -2.3], [-42.0, 1.35, -4.6], [-38.0, 1.65, -2.6], [-42.1, 1.45, -4.6], eo, 46);
  const k = back(seg(L, 0, 0.32)); x.post.blur.value = 0.35 * eo(seg(L, 0, 0.25)); ui(x, { type: 'logo', which: 'gta', v: 0.25, w: 0.78, k: 0.6 + 0.4 * k, a: Math.min(1, L / 0.06) });
});
// 3.54 "E o número que deu no final simplesmente" — ROOFTOP at dusk: Steve thinking, hotel neon sign beside him, skyline behind
at(3.54, 'numero', x => {
  const s = city(x); const L = x.L; const r = R(x); const st = put(x, 'steve', s, r.x, r.y, r.z, 0.15); alive(st, x.t, 1); lookCam(x, st, 0.7); gesture(st, 'think', L, 0.15, 9);
  const h = hp(st); const k = eio(x.u); cam(x, [h.x + mix(1.6, 1.0, k), h.y - mix(0.6, 0.5, k), h.z + mix(4.2, 2.9, k)], [h.x + 0.25, h.y - 0.1, h.z], 44); hand(x);
});
// 4.98 "vai bugar a sua mente" — same rooftop: hands to the head, screen glitches exactly on "bugar"
at(4.98, 'bug', x => {
  const s = city(x); const L = x.L; const r = R(x); const st = put(x, 'steve', s, r.x, r.y, r.z, 0.15); alive(st, x.t, 1); lookCam(x, st, 0.8); gesture(st, 'cower', L, 0.36, 9, 0.85, { face: false }); st.setFace({ mouth: L > 0.42 ? 1 : 0, lid: 0 }); st.noBlink = true;
  const gl = seg(L, 0.4, 0.5) * (1 - seg(L, 0.9, 1.4)); x.post.glitch.value = 0.9 * gl; x.post.chroma.value = 1.2 * gl; if (L > 0.4) shake(x, 0.4 * gl);
  const h = hp(st); const k = eo(x.u); cam(x, [h.x - mix(1.4, 0.8, k), h.y - 0.1, h.z + mix(3.2, 2.6, k)], [h.x, h.y - 0.35, h.z], 42); punch(x, 0.4, 0.2);
});
// 6.54 "Hoje o GTA 6 chegou pedindo 212 GB" — a giant PS5 rises out of the beach on "chegou"; storage board fills; "212 GB" on "212"
at(6.54, 'ps5', x => {
  const s = city(x); const L = x.L; x.S.ps5.visible = x.S.board.visible = true; const rise = eo(seg(L, 0.8, 1.35)); x.S.ps5.position.y = 0.2 - 8 * (1 - rise); x.S.board.position.y = -10 * (1 - eo(seg(L, 1.0, 1.5)));
  x.drawBoard(x.S, eo(seg(L, 1.05, 2.2)) * 0.98, L < 1.42 ? '' : '212 GB', false); if (L > 0.8 && L < 1.4) shake(x, 0.25 * Math.sin(seg(L, 0.8, 1.4) * Math.PI));
  const P = x.FX.parts; s.add(P); P.userData.update(seg(L, 0.8, 1.8), new V3(-3.6, 0.3, 11.6));
  const j = put(x, 'jason', s, 1.0, 0.05, 15.6, 0.1); const l = put(x, 'lucia', s, -0.9, 0.05, 15.8, -0.1); alive(j, x.t, 1); alive(l, x.t, 1, 2); const ps = new V3(-3.6, 6, 10.8);
  lookAt(j, x.camera.position, 0.8); lookAt(l, x.camera.position, 0.8); if (L > 0.85) { lookAt(j, ps, eo(seg(L, 0.85, 1.3)) * 0.85); lookAt(l, ps, eo(seg(L, 0.85, 1.3)) * 0.85); startle(l, L, 0.85, 0.5); }
  camMove(x, [1.0, 2.0, 25.0], [0, 4.6, 11.0], [0.5, 2.4, 22.6], [0, 5.0, 11.0], eo, 52); ui(x, num(x, '212 GB', 1.42, 0.12, 26));
});
// 9.18 "do seu console" — close on the PS5: the blue light strip, camera rising
at(9.18, 'console', x => {
  const s = city(x); const L = x.L; x.S.ps5.visible = x.S.board.visible = true; x.S.ps5.position.y = 0.2; x.S.board.position.y = 0; x.drawBoard(x.S, 0.98, '212 GB', false);
  camMove(x, [2.6, 2.6, 21.0], [-3.2, 4.0, 10.8], [1.0, 4.2, 18.6], [-3.4, 4.6, 10.8], eo, 50);
});
// 10.48 "Simplesmente o jogo mais pesado da história" — the PS5 sinks with a heavy thud on "pesado", sand bursts; both jump back
at(10.48, 'heavy', x => {
  const s = city(x); const L = x.L; x.S.ps5.visible = x.S.board.visible = true; const thud = eo(seg(L, 0.92, 1.08)); x.S.ps5.position.y = 0.2 - 0.35 * thud; x.drawBoard(x.S, 1, 'CHEIO', L > 0.92);
  if (L > 0.92 && L < 1.5) shake(x, 0.6 * (1 - seg(L, 0.92, 1.5))); const P = x.FX.parts; s.add(P); P.userData.update(seg(L, 0.92, 1.8), new V3(-6.0, 0.3, 11.6)); const P2 = x.FX.parts2; s.add(P2); P2.userData.update(seg(L, 0.92, 1.8), new V3(-1.2, 0.3, 11.6));
  const j = put(x, 'jason', s, 1.0, 0.05, 15.6, 0.1); const l = put(x, 'lucia', s, -0.9, 0.05, 15.8, -0.1); alive(j, x.t, 1); alive(l, x.t, 1, 2); startle(j, L, 0.94, 0.8); startle(l, L, 0.96, 0.8); lookAt(j, new V3(-3.6, 4, 10.8), 0.8); lookAt(l, new V3(-3.6, 4, 10.8), 0.8);
  j.setFace({ mouth: L > 0.95 ? 1 : 0 }); l.setFace({ mouth: L > 0.97 ? 1 : 0 });
  camMove(x, [1.4, 2.0, 26.0], [-0.6, 4.0, 11.4], [0.8, 1.9, 23.6], [-0.6, 3.6, 11.4], eo, 52); bubble(x, 'ex', s, l, 0.95); punch(x, 0.92, 0.15);
});
// 13.64 "O Minecraft de hoje" — the Minecraft world (real textures); Steve waves; Minecraft logo pops on "Minecraft"
at(13.64, 'mc', x => {
  const s = mcw(x); const L = x.L; const gy = x.S.mcHeight(0.5, -6.5); const st = put(x, 'steve', s, 0.5, gy, -6.5, 0.3); alive(st, x.t, 1); lookCam(x, st, 0.7); wave(st, 'L', L, 0.35, 1.2, x.t);
  const k = eio(x.u); cam(x, [mix(5, 2.5, k), gy + mix(3.5, 2.2, k), mix(2, -0.5, k)], [0.5, gy + 1.4, -7], 50);
  const lk = back(seg(L, 0.16, 0.46)); const a = Math.min(1, (L - 0.16) / 0.06) * (1 - sm(seg(L, 1.0, 1.25))); x.post.blur.value = 0.5 * a; if (L > 0.16) ui(x, { type: 'logo', which: 'mc', v: 0.28, w: 0.42, k: 0.6 + 0.4 * lk, a });
});
// 14.92 "com tudo instalado, tem por volta de 1 GB" — a single grass block spins like a dropped item; "1 GB" on "1"
at(14.92, 'onegb', x => {
  const s = mcw(x); const L = x.L; const gy = x.S.mcHeight(0.5, -6.5); const st = put(x, 'steve', s, -0.3, gy, -6.5, 0.6); alive(st, x.t, 1); const b = x.FX.block; s.add(b); b.scale.setScalar(0.45); b.position.set(1.1, gy + 0.7 + 0.1 * Math.sin(x.t * 3), -6.2); b.rotation.y = x.t * 1.6;
  lookAt(st, b.position, 0.8); gesture(st, 'point', L, 0.4, 9, 0.8, { face: false }); camMove(x, [3.0, gy + 1.7, -2.4], [0.4, gy + 1.0, -6.4], [2.5, gy + 1.6, -3.0], [0.5, gy + 0.9, -6.3], eo, 46); punch(x, 1.72, 0.15);
  ui(x, num(x, '1 GB', 1.72, 0.15, 30));
});
// 17.44 "Então, de cara," — INSIDE THE PS5's SSD: a dark data hall; Steve walks in and looks around at the empty glowing pedestals
at(17.44, 'ssdIn', x => {
  const s = ssd(x, 0, 0); const L = x.L; const st = put(x, 'steve', s, 0, 0, 0, 0); walkPath(st, L, 0, 0.9, [-2.6, 3.6], [-0.6, 2.9], { stride: 0.9 }); if (L > 0.85) lookAt(st, new V3(4, 1, -4), eo(seg(L, 0.85, 1.1)) * 0.9);
  const k = eio(x.u); cam(x, [mix(2.4, 1.6, k), mix(1.8, 1.7, k), mix(7.8, 6.6, k)], [mix(-1.6, -0.6, k), 1.2, 1.6], 50); x.post.flash.value = 0.04 * (1 - seg(L, 0, 0.12));
});
// 18.86 "cabem os 212 Minecrafts" — crane over the hall: 212 pedestals light up one by one, each with a mini Minecraft world; counter
at(18.86, 'count', x => {
  const L = x.L; const n = Math.min(212, Math.round(212 * seg(L, 0.0, 1.4))); const s = ssd(x, seg(L, 0.0, 1.4), 0);
  const k = eio(x.u); cam(x, [mix(-6, 6, k), mix(5, 11, k), mix(6, 8, k)], [mix(-2, 2, k), 0, mix(-6, -12, k)], 54); hand(x, 0.5);
  ui(x, { type: 'num', txt: String(n), v: 0.15, px: 34, k: 1 + 0.06 * Math.sin(x.t * 20) * (n < 212 ? 1 : 0), a: 1 }); if (L > 1.4 && L < 1.46) x.post.flash.value = 0.04;
});
// 20.52 "dentro do GTA 6" — Steve in front of the full hall throws his arms up; punch-in on "GTA 6"
at(20.52, 'ssdFull', x => {
  const s = ssd(x, 1, 0); const L = x.L; const st = put(x, 'steve', s, -0.6, 0, 2.9, 0.2); alive(st, x.t, 1); lookCam(x, st, 0.7); gesture(st, 'cheer', L, 0.3, 9, 0.9); st.setFace({ mouth: L > 0.4 ? 0.8 : 0 });
  const h = hp(st); const k = eo(x.u); cam(x, [h.x + mix(1.2, 0.8, k), h.y - 0.2, h.z + mix(4.6, 3.6, k)], [h.x, h.y - 0.5, h.z - 1], 48); punch(x, 0.34, 0.12);
  ui(x, num(x, '212', 0, 0.13, 30));
});
// 22.34 "212 mundos infinitos" — dive into one pedestal: inside it, an endless Minecraft world
at(22.34, 'inside', x => {
  const L = x.L;
  if (L < 0.46) { ssd(x, 1, 0); const p = x.S.ssdP[5]; const k = eio(seg(L, 0, 0.46)); cam(x, [p.x + mix(2.0, 0.05, k), mix(2.6, 0.95, k), p.z + mix(3.4, 0.4, k)], [p.x, 0.85, p.z], 50); x.post.flash.value = 0.8 * sm(seg(L, 0.34, 0.46)); }
  else { mcw(x); const k = eo(seg(L, 0.46, 1.54)); cam(x, [mix(-10, 8, k), 16 - 5 * k, mix(10, -6, k)], [mix(-4, 12, k), 4, mix(-14, -22, k)], 60); x.post.flash.value = 0.8 * (1 - sm(seg(L, 0.46, 0.66))); }
  ui(x, num(x, '212', 0.0, 0.14, 30));
});
// 23.88 "dentro de uma cidade só" — out of the console: an aerial crane over Vice City at sunset, the convertible cruising below
at(23.88, 'onecity', x => {
  const s = city(x); const L = x.L; drive(x, s, -40, 11); const k = eio(x.u);
  cam(x, [mix(-30, -8, k), mix(30, 18, k), mix(40, 30, k)], [mix(-20, 0, k), 2, mix(-10, -8, k)], 52);
});
// 25.52 "Parece muito, né?" — riding along in the convertible: Jason driving, Lucia turns to us, nods, hand in the wind
at(25.52, 'muito', x => {
  const s = city(x); const L = x.L; const { cx, j, l } = drive(x, s, -3.0, 9.5);
  lookAt(j, new V3(cx + 20, 1.6, -1.4), 0.8); if (L > 0.5) lookCam(x, j, eo(seg(L, 0.5, 0.95)) * 0.6); lookCam(x, l, 0.85); l.setFace({ lid: 0.3, slope: 0.5 }); nod(l, L, 0.45, 2, 0.16);
  wave(l, 'R', L, 0.15, 9, x.t);
  cam(x, [cx + mix(4.4, 3.8, eo(x.u)), 1.9, -3.0], [cx - 0.3, 1.5, -0.9], 44); hand(x, 0.6); bubble(x, 'q', s, l, 0.9);
});
// 26.68 "Mas isso não é nada" — on the promenade at sunset (sea behind): Steve shakes his head on "não", waves it off
at(26.68, 'nada', x => {
  const s = city(x); x.S.traffic.forEach(c => c.visible = false); const L = x.L; const st = put(x, 'steve', s, 6.0, 0.2, 5.3, Math.PI + 0.25); alive(st, x.t, 1); lookCam(x, st, 0.8); headShake(st, L, 0.5, 2, 0.32); gesture(st, 'shrug', L, 0.75, 9);
  const h = hp(st); const k = eo(x.u); cam(x, [h.x + mix(1.0, 0.7, k), h.y - 0.25, h.z - mix(3.3, 2.6, k)], [h.x, h.y - 0.35, h.z], 44); punch(x, 0.52, 0.12);
});
// 27.80 "Porque o Minecraft não nasceu desse tamanho" — in Minecraft, the block in front of Steve shrinks
at(27.80, 'shrink', x => {
  const s = mcw(x); const L = x.L; const gy = x.S.mcHeight(0.5, -6.5); const st = put(x, 'steve', s, -0.3, gy, -6.5, 0.6); alive(st, x.t, 1); const b = x.FX.block; s.add(b);
  const sc = mix(1, 0.25, eio(seg(L, 0.9, 1.9))); b.scale.setScalar(sc * 0.6); b.position.set(1.0, gy + 0.9 + 0.08 * Math.sin(x.t * 3), -6.1); b.rotation.y = x.t * 1.4; lookAt(st, b.position, 0.8); gesture(st, 'think', L, 0.0, 9, 0.8);
  camMove(x, [3.2, gy + 1.8, -2.2], [0.5, gy + 0.9, -6.3], [2.7, gy + 1.6, -2.8], [0.5, gy + 0.7, -6.2], eo, 46);
});
// 30.22 "Em 2009, a primeira versão do jogo" — the Classic world: pale sky, flat lime grass, strong blue water; "2009"
at(30.22, 'y2009', x => {
  const s = classic(x); const L = x.L; const k = eio(x.u); cam(x, [mix(-12, -4, k), mix(14, 9, k), mix(12, 8, k)], [mix(-2, 0, k), 2, -8], 56); ui(x, num(x, '2009', 0.1, 0.15, 34));
});
// 32.08 "era só grama" — low over the lime grass
at(32.08, 'grama', x => { const s = classic(x); const L = x.L; const k = eio(x.u); cam(x, [mix(-10, -6, k), 7.5, mix(6, 4, k)], [mix(-4, -1, k), 2.5, -10], 52); punch(x, 0.22, 0.12); });
// 32.78 "pedra" — the stone outcrop
at(32.78, 'pedra', x => { const s = classic(x); const L = x.L; const k = eio(x.u); cam(x, [mix(3.5, 2.0, k), 7.2, mix(5.5, 3.8, k)], [-2.5, 3.6, -4.5], 48); punch(x, 0.0, 0.12); });
// 33.24 "e um Steve parado" — the original 2009 Steve, totally still (no idle — that's the joke)
at(33.24, 'parado', x => {
  const s = classic(x); const L = x.L; const st = put(x, 'oldsteve', s, 1.5, 4.0, -2.5, 0.4); st.root.position.y = topAt(x, 1.5, -2.5); const h = hp(st);
  cam(x, [h.x + mix(2.6, 1.8, eio(x.u)), h.y - 0.3, h.z + mix(2.8, 2.0, eio(x.u))], [h.x, h.y - 0.6, h.z], 44); punch(x, 0.48, 0.15);
});
// 34.46 "E ela tinha menos de 1 mega" — a classic block shrinks to a speck; "< 1 MB"
at(34.46, 'mb', x => {
  const s = classic(x); const L = x.L; const b = x.FX.block; s.add(b); const sc = mix(1, 0.12, eio(seg(L, 0.4, 1.2))); b.scale.setScalar(sc); const gy = topAt(x, 0.5, -1.5); b.position.set(0.5, gy + 0.6 + 0.08 * Math.sin(x.t * 3), -1.5); b.rotation.y = x.t * 1.4;
  cam(x, [0.5 + 0.8, gy + 1.2, -1.5 + mix(3.2, 2.2, eio(x.u))], [0.5, gy + 0.6, -1.5], 40); ui(x, num(x, '< 1 MB', 0.54, 0.16, 30));
});
// 36.12 "Agora refaz a conta comigo" — Ocean Drive sidewalk: Steve walks under the neon, slows down, stops and thinks, looking at us
at(36.12, 'refaz', x => {
  const s = city(x); const L = x.L; const st = put(x, 'steve', s, 0, 0.2, 0, Math.PI / 2); walkPath(st, L, 0, 0.95, [4.0, -5.0], [6.4, -5.0], { stride: 0.95 });
  if (L > 0.9) st.root.rotation.y = mix(Math.PI / 2, 0.55, eio(seg(L, 0.9, 1.3))); lookCam(x, st, 0.4 + 0.4 * seg(L, 0.6, 1.1)); gesture(st, 'think', L, 1.0, 9); st.setFace({ lid: 0.2, slope: 0.4 });
  const h = hp(st); const k = eio(x.u); cam(x, [h.x + mix(2.6, 1.6, k), h.y - 0.2, h.z + mix(3.4, 2.6, k)], [h.x, h.y - 0.4, h.z], 44); bubble(x, 'q', s, st, 1.15);
});
// 37.60 "se cada Minecraft tem menos de 1 mega" — back in the SSD: one pedestal, one tiny world; "< 1 MB" on "menos de 1"
at(37.60, 'one', x => {
  const s = ssd(x, 1, 0); const L = x.L; const p = x.S.ssdP[5]; const k = eio(x.u); cam(x, [p.x + mix(1.6, 1.1, k), mix(1.5, 1.25, k), p.z + mix(2.4, 1.6, k)], [p.x, 0.95, p.z], 40);
  ui(x, num(x, '< 1 MB', 1.32, 0.16, 30));
});
// 39.72 "dentro de um único GTA 6" — the PS5 on the beach, the storage board says 212 GB; the division appears
at(39.72, 'math', x => {
  const s = city(x); const L = x.L; x.S.ps5.visible = x.S.board.visible = true; x.S.ps5.position.y = -0.15; x.drawBoard(x.S, 1, '212 GB', false);
  const k = eio(x.u); cam(x, [mix(4, 1, k), mix(3.0, 3.8, k), mix(28, 25.5, k)], [0.3, 6.0, 11], 50); punch(x, 0.84, 0.1);
  ui(x, num(x, '212 GB', 0.1, 0.085, 22), num(x, '÷ 1 MB', 0.84, 0.215, 22));
});
// 41.22 "cabem mais de 200 mil Minecrafts" — CLIMAX in the SSD: an endless field of glowing micro-worlds rains down; crane up; "200.000+"
at(41.22, 'avalanche', x => {
  const L = x.L; const s = ssd(x, 1, eo(seg(L, 0.1, 1.8))); const k = eio(x.u); cam(x, [mix(0, 6, k), mix(2.5, 30, k), mix(9, 26, k)], [0, 0, mix(-6, -30, k)], mix(52, 60, k)); if (L > 0.7 && L < 1.8) shake(x, 0.08);
  const n = Math.round(200000 * eo(seg(L, 0.7, 1.44))); ui(x, L > 0.7 ? { type: 'num', txt: (n >= 200000 ? '200.000+' : dots(n)), v: 0.15, px: 20, k: 1 + 0.05 * Math.sin(x.t * 22) * (n < 200000 ? 1 : 0), a: 1 } : null);
  if (L > 1.44 && L < 1.5) x.post.flash.value = 0.05;
});
// 43.36 "originais" — the original 2009 Steve standing in that sea of glowing worlds
at(43.36, 'originais', x => {
  const s = ssd(x, 1, 1); const L = x.L; const st = put(x, 'oldsteve', s, 0, 0, 4.2, 0.0); const h = hp(st); const a = mix(0.5, -0.1, eio(x.u)); cam(x, [h.x + Math.sin(a) * 3.0, h.y - 0.2, h.z + Math.cos(a) * 3.0], [h.x, h.y - 0.5, h.z], 46);
  ui(x, { type: 'num', txt: '200.000+', v: 0.15, px: 20, k: 1, a: 1 });
});
// 44.26 "E o mais bizarro é que esse joguinho, com esse tamanho" — Classic world: today's Steve looks at 2009 Steve, puzzled
at(44.26, 'pile', x => {
  const s = classic(x); const L = x.L; const o = put(x, 'oldsteve', s, 1.5, 0, -2.5, 0.4); o.root.position.y = topAt(x, 1.5, -2.5); const st = put(x, 'steve', s, 3.6, 0, -2.5, -0.5); st.root.position.y = topAt(x, 3.6, -2.5); alive(st, x.t, 1);
  lookAt(st, hp(o), 0.85); if (L > 1.1) lookCam(x, st, eo(seg(L, 1.1, 1.5)) * 0.7); gesture(st, 'point', L, 0.3, 1.2, 0.8, { face: false }); gesture(st, 'think', L, 1.25, 9, 0.8);
  const m = new V3().addVectors(hp(o), hp(st)).multiplyScalar(0.5); const a = mix(0.35, -0.05, eio(x.u)); cam(x, [m.x + Math.sin(a) * 4.6, m.y - 0.1, m.z + Math.cos(a) * 4.6], [m.x, m.y - 0.6, m.z], 46); bubble(x, 'q', s, st, 1.5);
});
// 46.52 "virou o mais vendido da história" — Minecraft hilltop: Steve cheers, fireworks, a golden block spins; "#1"
at(46.52, 'top', x => {
  const s = mcw(x); const L = x.L; const gy = x.S.mcHeight(0.5, -6.5); const st = put(x, 'steve', s, 0.5, gy, -6.5, 0.35); alive(st, x.t, 1); lookCam(x, st, 0.7); gesture(st, 'cheer', L, 0.62, 9); st.setFace({ mouth: L > 0.7 ? 0.8 : 0 });
  if (L > 0.66) startle(st, L, 0.66, 0.5);
  const gb = x.FX.gold; s.add(gb); gb.scale.setScalar(0.4); gb.position.set(1.6, gy + 1.0 + 0.08 * Math.sin(x.t * 3), -6.0); gb.rotation.y = x.t * 2;
  const F = x.FX.sparks; s.add(F); F.position.set(0.5, gy + 3.6, -8); const k = seg(L, 0.74, 1.5); F.children.forEach(m => { const v = m.userData.v; m.position.set(v.x * k * 1.6, v.y * k * 1.2 - 2 * k * k, v.z * k * 0.6); m.scale.setScalar(k > 0 ? 1 - sm(seg(k, 0.75, 1)) + 0.001 : 0.001); });
  const h = hp(st); const k2 = eo(x.u); cam(x, [h.x + mix(2.2, 1.6, k2), h.y - mix(1.0, 0.7, k2), h.z + mix(4.2, 3.4, k2)], [h.x, h.y + 0.3, h.z], 50); ui(x, num(x, '#1', 0.74, 0.13, 34)); punch(x, 0.74, 0.12);
});
// 48.44 "E se você pudesse escolher, levava um GTA 6" — Jason & Lucia on Ocean Drive; GTA VI logo on "GTA 6"
at(48.44, 'chooseA', x => {
  const s = city(x); const L = x.L; const cv = x.S.conv; cv.visible = true; cv.position.set(-46.6, 0, -2.45); cv.userData.wheels.forEach(w => w.rotation.z = 0);
  const j = put(x, 'jason', s, -41.2, 0.2, -4.6, 1.0); const l = put(x, 'lucia', s, -43.1, 0.2, -4.7, 1.1); alive(j, x.t, 1); alive(l, x.t, 1, 2); lookCam(x, j, 0.75); lookCam(x, l, 0.75);
  gesture(j, 'point', L, 1.32, 9, 0.75, { face: false }); if (L < 1.2) lookAt(l, hp(j), 0.6);
  camMove(x, [-37.6, 1.6, -2.4], [-42.1, 1.45, -4.6], [-38.2, 1.6, -2.7], [-42.1, 1.5, -4.6], eo, 44); punch(x, 1.84, 0.1);
  ui(x, L > 1.84 ? { type: 'logo', which: 'gta', v: 0.16, w: 0.46, k: 0.6 + 0.4 * back(seg(L, 1.84, 2.1)), a: Math.min(1, (L - 1.84) / 0.06) } : null);
});
// 51.06 "ou 200 mil Minecrafts?" — the Minecraft world: Steve, arms up, "200.000+"; "?" on "Minecrafts"
at(51.06, 'chooseB', x => {
  const s = mcw(x); const L = x.L; const gy = x.S.mcHeight(0.5, -6.5); const st = put(x, 'steve', s, 0.5, gy, -6.5, 0.3); alive(st, x.t, 1); lookCam(x, st, 0.75); gesture(st, 'cheer', L, 0.3, 9, 0.85); st.setFace({ mouth: L > 0.4 ? 0.7 : 0 });
  const h = hp(st); const k = eo(x.u); cam(x, [h.x + mix(1.8, 1.2, k), h.y - 0.3, h.z + mix(4.4, 3.4, k)], [h.x, h.y - 0.1, h.z], 48); bubble(x, 'q', s, st, 1.12);
  ui(x, num(x, '200.000+', 0.3, 0.13, 20));
});
// 52.84 "Comenta aí" — promenade at sunset: Steve and Jason, well apart, wave with their OUTER arms
at(52.84, 'outro', x => {
  const s = city(x); x.S.traffic.forEach(c => c.visible = false); const L = x.L; const st = put(x, 'steve', s, 5.05, 0.2, 5.3, Math.PI - 0.15); const j = put(x, 'jason', s, 6.95, 0.2, 5.3, Math.PI + 0.15); alive(st, x.t, 1); alive(j, x.t, 1, 2); lookCam(x, st, 0.7); lookCam(x, j, 0.7);
  wave(st, 'L', L, 0.05, 9, x.t); wave(j, 'R', L, 0.1, 9, x.t + 0.4); camMove(x, [6.0, 1.45, -2.0], [6.0, 1.4, 5.4], [6.0, 1.5, -1.1], [6.0, 1.45, 5.4], eo, 48);
});

export const SHOTS = shots;
export const DURATION = 53.70;
