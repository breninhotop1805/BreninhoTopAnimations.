import * as THREE from 'three';
// Acting kit for the Roblox R6 rig — cartoon timing: anticipation (torso/head only), overshoot + settle, follow-through,
// walk with weight and a smooth stop, living idle. Everything is a pure function of local time L.
export const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const sm = x => { x = cl(x); return x * x * (3 - 2 * x); };
export const eio = x => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const eo = x => { x = cl(x); return 1 - Math.pow(1 - x, 3); };
export const seg = (t, a, b) => cl((t - a) / (b - a));
export const mix = (a, b, k) => a + (b - a) * k;
export const springE = x => { x = cl(x); if (x >= 1) return 1; return 1 - Math.exp(-6 * x) * Math.cos(9.5 * x) * (1 - x * 0.15); };
export const elastic = x => { x = cl(x); if (x === 0 || x === 1) return x; return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1; };

// poses added on top of neutral. aR/aL arm [x,y,z], lR/lL legs, h head, t torso, y hip lift
export const POSES = {
  wave: { aL: [-0.2, 0, 2.3], eL: -0.6, h: [0, 0, 0.12] },
  point: { aR: [-1.5, 0, 0.05], t: [0, -0.1, 0] },
  think: { aR: [-0.75, 0, 0.35], eR: -2.0, aL: [-0.35, 0, -0.25], eL: -1.3, h: [0.08, 0.15, 0.16] },
  shrug: { aR: [-0.25, 0, -0.55], eR: -1.1, aL: [-0.25, 0, 0.55], eL: -1.1, h: [0.05, 0, 0.2], y: 0.04 },
  cheer: { aR: [-0.15, 0, -2.5], eR: -0.35, aL: [-0.15, 0, 2.5], eL: -0.35, h: [-0.25, 0, 0], t: [-0.06, 0, 0], y: 0.06 },
  chest: { aR: [-0.55, 0, 0.3], eR: -1.6, h: [0.08, 0, 0.1] },
  scared: { aR: [-0.9, 0, 0.3], eR: -1.2, aL: [-0.9, 0, -0.3], eL: -1.2, h: [0.12, 0, 0], t: [-0.15, 0, 0], y: -0.04 },
  facepalm: { aR: [-1.0, 0, 0.35], eR: -2.1, h: [0.3, 0, 0], t: [0.08, 0, 0] },
  angry: { aR: [-0.3, 0, -0.35], eR: -0.9, aL: [-0.3, 0, 0.35], eL: -0.9, h: [0.18, 0, 0], t: [0.08, 0, 0] },
  sad: { aR: [-0.1, 0, 0.05], aL: [-0.1, 0, -0.05], h: [0.35, 0, 0.08], t: [0.12, 0, 0], y: -0.03 },
  reach: { aR: [-1.45, 0, 0.12], aL: [-1.45, 0, -0.12], t: [0.12, 0, 0] },
  holdFront: { aR: [-0.55, 0, 0.12], eR: -1.05, aL: [-0.55, 0, -0.12], eL: -1.05 },
  hips: { aR: [-0.1, 0, -0.75], eR: -1.2, aL: [-0.1, 0, 0.75], eL: -1.2, h: [-0.05, 0, 0.1] },
};
export const FACES = { wave: { mouth: 'grin', eyes: 'happy' }, cheer: { mouth: 'open', eyes: 'happy' }, scared: { mouth: 'o', eyes: 'wide', brow: -0.6 }, angry: { mouth: 'frown', eyes: 'angry', brow: 1 },
  sad: { mouth: 'frown', eyes: 'sad', brow: -1 }, think: { mouth: 'flat', brow: 0.4, look: [0.6, -0.8] }, shrug: { mouth: 'flat', brow: -0.5 }, facepalm: { mouth: 'frown', eyes: 'closed' } };
function addPose(c, P, w) { if (!P || !w) return; const add = (o, v) => { if (v) { o.rotation.x += v[0] * w; o.rotation.y += v[1] * w; o.rotation.z += v[2] * w; } };
  add(c.armR.piv, P.aR); add(c.armL.piv, P.aL); add(c.legR.piv, P.lR); add(c.legL.piv, P.lL); add(c.head, P.h); add(c.torso, P.t); if (P.y) c.hip.position.y += P.y * w;
  if (c.armR.elbow) { if (P.eR) c.armR.elbow.rotation.x += P.eR * w; if (P.eL) c.armL.elbow.rotation.x += P.eL * w; if (P.kR) c.legR.knee.rotation.x += P.kR * w; if (P.kL) c.legL.knee.rotation.x += P.kL * w; } }
export function gestW(L, a, b, inT = 0.35, outT = 0.35) { if (L < a - 0.12 || L > b) return 0; const ant = L < a ? -0.12 * Math.sin(seg(L, a - 0.12, a) * Math.PI) : 0; return (L < a ? ant : springE(seg(L, a, a + inT))) * (1 - sm(seg(L, b - outT, b))); }
export function gesture(c, name, L, a, b = 99, amt = 1, o = {}) { const P = POSES[name]; const w = gestW(L, a, b, o.inT, o.outT) * amt, wl = gestW(L, a + 0.07, b + 0.05, o.inT, o.outT) * amt;
  addPose(c, { aR: P.aR, aL: P.aL, lR: P.lR, lL: P.lL, y: P.y, eR: P.eR, eL: P.eL, kR: P.kR, kL: P.kL }, Math.max(0, w)); addPose(c, { h: P.h, t: P.t }, wl);
  if (FACES[name] && o.face !== false && w > 0.3) c.setFace(FACES[name]); return w; }
export function wave(c, L, a, b, t) { const w = Math.max(0, gestW(L, a, b)); if (!w) return; c.armL.piv.rotation.z += 2.55 * w + 0.3 * Math.sin(t * 10) * cl(w); c.armL.piv.rotation.x += -0.2 * w; c.head.rotation.z += 0.1 * w; if (w > 0.3) c.setFace({ mouth: 'grin', eyes: 'happy' }); }
export function alive(c, t, a = 1, seed = 0) { const b = Math.sin(t * 2.1 + seed); c.torso.rotation.x += 0.012 * b * a; c.hip.position.y += 0.012 * Math.abs(b) * a; c.head.rotation.x += -0.015 * b * a;
  c.head.rotation.y += 0.07 * Math.sin(t * 0.6 + seed * 2) * a; c.armR.piv.rotation.z += -0.03 - 0.02 * b * a; c.armL.piv.rotation.z += 0.03 + 0.02 * b * a; c.torso.rotation.z += 0.012 * Math.sin(t * 0.8 + seed) * a; if (c.armR.elbow) { c.armR.elbow.rotation.x += -0.12 * a; c.armL.elbow.rotation.x += -0.12 * a; } }
// mouth movement while speaking (syllable-ish rhythm)
export function talk(c, t, on = 1) { if (on <= 0) return; const v = Math.max(0, Math.sin(t * 17) * 0.6 + Math.sin(t * 11.3 + 1) * 0.5); c.setFace({ talk: v * on }); c.head.rotation.x += 0.03 * Math.sin(t * 9) * on; }
// Roblox-style walk: CONSTANT speed (straight progress, no S-curve), with only a short ~0.15 s ramp at start/end so it never
// jerks; legs/arms amplitude follows the speed and the last step lands in the neutral pose. o.ease = old S-curve if wanted.
export function walkPath(c, L, t0, t1, a, b, o = {}) { const u = seg(L, t0, t1), D = Math.max(0.05, t1 - t0); const d = Math.hypot(b[0] - a[0], b[1] - a[1]); const stride = o.stride || 2.0;
  const r = o.linear ? 0 : Math.min(0.3, (o.ramp ?? 0.15) / D); const vm = 1 / (1 - r); let k, sp;
  if (o.ease) { k = eio(u); sp = u > 0 && u < 1 ? Math.min(1, 6 * u * (1 - u) * 1.15) : 0; }
  else if (r === 0) { k = u; sp = u > 0 && u < 1 ? 1 : 0; }
  else if (u < r) { k = vm * u * u / (2 * r); sp = u / r; } else if (u > 1 - r) { k = 1 - vm * (1 - u) * (1 - u) / (2 * r); sp = (1 - u) / r; } else { k = vm * (u - r / 2); sp = 1; }
  if (u <= 0 || u >= 1) sp = 0; sp = Math.sqrt(Math.max(0, sp));
  c.root.position.x = mix(a[0], b[0], k); c.root.position.z = mix(a[1], b[1], k);
  if (o.face !== false && d > 0.01) c.root.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]); const p = d * k / stride * Math.PI * 2, s = Math.sin(p), amp = sp * (1 + 0.4 * (o.run || 0));
  const aw = c.body === 'bloco' ? 0.45 : 0.6; c.legR.piv.rotation.x += 0.7 * s * amp; c.legL.piv.rotation.x -= 0.7 * s * amp; c.armR.piv.rotation.x -= aw * s * amp; c.armL.piv.rotation.x += aw * s * amp;
  if (c.legR.knee) { c.legR.knee.rotation.x += Math.max(0, -Math.sin(p - 0.9)) * 0.9 * amp; c.legL.knee.rotation.x += Math.max(0, Math.sin(p - 0.9)) * 0.9 * amp; c.armR.elbow.rotation.x += (-0.35 - 0.25 * Math.max(0, -s)) * amp; c.armL.elbow.rotation.x += (-0.35 - 0.25 * Math.max(0, s)) * amp; }
  c.hip.position.y += (Math.abs(Math.cos(p)) * 0.12 - 0.06) * amp; c.torso.rotation.y += 0.08 * s * amp; c.torso.rotation.x += 0.08 * sp; c.head.rotation.y -= 0.06 * s * amp; return sp; }
// hop of surprise with squash & stretch
export function startle(c, L, a, amt = 1) { if (L < a) return; const u = L - a; c.hip.position.y += Math.max(0, Math.sin(cl(u / 0.3) * Math.PI)) * 0.35 * amt;
  const sq = u < 0.08 ? 1 - 0.08 * Math.sin(u / 0.08 * Math.PI) : 1 + 0.05 * Math.sin(cl((u - 0.08) / 0.3) * Math.PI) * Math.exp(-u * 3); c.root.scale.y *= sq; c.root.scale.x *= 2 - sq; c.root.scale.z *= 2 - sq;
  addPose(c, POSES.scared, springE(seg(u, 0, 0.35)) * amt * (1 - sm(seg(u, 1.2, 1.7)))); c.setFace({ eyes: 'wide', mouth: 'o', brow: -0.7 }); }
// sit on a seat of height seatY (R15): thighs horizontal, shins vertical, hands resting on the thighs
export function sit15(c, seatY, w = 1) { c.hip.position.y = mix(c.hip.position.y, seatY + 0.05, w) ; c.root.position.y = 0; for (const L of [c.legR, c.legL]) { L.piv.rotation.x += -1.55 * w; if (L.knee) L.knee.rotation.x += 1.55 * w; }
  c.armR.piv.rotation.x += -0.35 * w; c.armL.piv.rotation.x += -0.35 * w; if (c.armR.elbow) { c.armR.elbow.rotation.x += -0.5 * w; c.armL.elbow.rotation.x += -0.5 * w; } }
// ---- 2-bone IK for R15 arms: put the HAND exactly at a world point (chin, chest, an object, someone's shoulder).
// The elbow bends forward/down naturally (never into the body); w blends from the current pose.
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4();
export function reach(c, A, target, w = 1, o = {}) { if (w <= 0 || !A.elbow) return; c.root.updateMatrixWorld(true);
  const par = A.piv.parent; const inv = new THREE.Matrix4().copy(par.matrixWorld).invert(); const T = target.clone().applyMatrix4(inv); const S = A.piv.position.clone();
  const a = A.elbow.position.length(), b = A.wrist ? A.wrist.position.length() + (o.palm ?? 0.3) : 0.9;
  const D = T.clone().sub(S); let d = D.length(); d = Math.min(Math.max(d, Math.abs(a - b) + 0.05), a + b - 0.02); const dir = D.normalize(); const Tc = S.clone().addScaledVector(dir, d);
  const alpha = Math.acos(Math.min(1, Math.max(-1, (a * a + d * d - b * b) / (2 * a * d))));
  // elbow pole: down and a bit outward (side of this arm) and back -> natural, never into the chest
  const side = Math.sign(S.x) || 1; const pole = new THREE.Vector3(side * (o.out ?? 0.45), -1, o.back ?? -0.25).normalize(); const po = pole.sub(dir.clone().multiplyScalar(pole.dot(dir))); if (po.lengthSq() < 1e-4) po.set(side, 0, 0); po.normalize();
  const E = S.clone().addScaledVector(dir, a * Math.cos(alpha)).addScaledVector(po, a * Math.sin(alpha));
  const y = S.clone().sub(E).normalize(); const fz = Tc.clone().sub(E); const z = fz.sub(y.clone().multiplyScalar(fz.dot(y))); if (z.lengthSq() < 1e-6) z.set(0, 0, 1); z.normalize(); const x = new THREE.Vector3().crossVectors(y, z).normalize();
  _m.makeBasis(x, y, z); _q.setFromRotationMatrix(_m);
  const rest = A.elbow.position.clone().normalize(); _q.multiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), rest).invert());
  const bend = Math.acos(Math.min(1, Math.max(-1, E.clone().sub(S).normalize().dot(Tc.clone().sub(E).normalize()))));
  A.piv.quaternion.slerp(_q, w); A.elbow.rotation.x = A.elbow.rotation.x * (1 - w) + (-bend) * w; }
