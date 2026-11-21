// Acting kit for the Minecraft rigs (straight limbs). Smooth, curved, cartoony motion:
//  - poses are blended with eased curves; arm targets combine X+Z rotations so the hands travel on arcs
//  - every gesture has anticipation (small counter-move), overshoot on arrival and a soft settle
//  - follow-through: head and torso lag the gesture a little
//  - emotions = face (lids/mouth) + body; walk/run with weight (bob, lean, sway) and smooth stop
// All functions are pure functions of local time L (renders can start at any frame).
import * as THREE from 'three';

export const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const sm = x => { x = cl(x); return x * x * (3 - 2 * x); };
export const eio = x => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const eo = x => { x = cl(x); return 1 - Math.pow(1 - x, 3); };
export const seg = (t, a, b) => cl((t - a) / (b - a));
export const mix = (a, b, k) => a + (b - a) * k;
// overshoot with damped settle (spring-like), 0->1
export const springE = (x, k = 1) => { x = cl(x); if (x >= 1) return 1; return 1 - Math.exp(-6 * x) * Math.cos(9.5 * x * k) * (1 - x * 0.15); };

// ---------------- poses (Minecraft rig: armR = character's right = screen-left when facing camera) ----------------
// values ADDED on top of the neutral/idle pose. a* = arm pivot [x,y,z], l* = leg, h = head, t = torso, p = pelvis rot, y = pelvis lift
export const POSES = {
  think:   { aR: [-1.4, 0, 0.18], aL: [-0.55, 0, 0.22], h: [0.05, 0.18, 0.18], t: [0.04, 0, 0] },        // hand to chin, head tilted
  point:   { aR: [-1.45, 0, -0.05], h: [-0.05, 0, 0], t: [0.05, -0.12, 0] },                               // right arm points forward
  pointL:  { aL: [-1.45, 0, 0.05], h: [-0.05, 0, 0], t: [0.05, 0.12, 0] },
  shrug:   { aR: [-0.35, 0, -0.75], aL: [-0.35, 0, 0.75], h: [0.05, 0, 0.22], y: 0.03 },                   // arms out, palms up, head tilt
  cheer:   { aR: [-0.2, 0, -2.6], aL: [-0.2, 0, 2.6], h: [-0.3, 0, 0], t: [-0.08, 0, 0], y: 0.04 },         // both arms up
  chest:   { aR: [-0.95, 0, 0.42], h: [0.08, 0, 0.12] },                                                    // hand on chest ("eu")
  scared:  { aR: [-1.25, 0, 0.18], aL: [-1.25, 0, -0.18], h: [0.18, 0, 0], t: [-0.18, 0, 0], y: -0.03 },  // hands up in front, leaning back
  cower:   { aR: [-1.55, 0, 0.12], aL: [-1.55, 0, -0.12], h: [0.12, 0, 0], t: [0.16, 0, 0], y: -0.05 },        // arms over the head, hunched
  sad:     { aR: [-0.14, 0, 0.03], aL: [-0.14, 0, -0.03], h: [0.3, 0, 0.08], t: [0.12, 0, 0] },
  angry:   { aR: [-0.35, 0, -0.32], aL: [-0.35, 0, 0.32], h: [0.22, 0, 0], t: [0.1, 0, 0] },               // fists out, head down
  laugh:   { aR: [-0.7, 0, 0.22], aL: [-0.7, 0, -0.22], h: [-0.45, 0, 0], t: [-0.14, 0, 0] },              // hands on belly, head thrown back
  evil:    { aR: [-0.85, 0, 0.16], aL: [-0.85, 0, -0.16], h: [0.25, 0, 0.12], t: [0.08, 0, 0] },             // rubbing hands, head down, grin
  reach:   { aR: [-1.35, 0, 0.1], aL: [-1.35, 0, -0.1], t: [0.18, 0, 0], h: [-0.1, 0, 0] },                // both arms forward (grab)
  flex:    { aR: [0, 0, -1.55], aL: [0, 0, 1.55], h: [-0.12, 0, 0], t: [-0.05, 0, 0], y: 0.02 },           // strong pose
  wave:    { aR: [-0.25, 0, -2.45], h: [0, 0, -0.12] },
  waveL:   { aL: [-0.25, 0, 2.45], h: [0, 0, 0.12] },
  agony:   { aR: [-0.5, 0, -1.2], aL: [-0.5, 0, 1.2], h: [-0.55, 0, 0], t: [-0.2, 0, 0] },                 // arms out, head back screaming
  slump:   { aR: [-0.3, 0, -0.04], aL: [-0.3, 0, 0.04], h: [0.55, 0, 0.2], t: [0.3, 0, 0], y: -0.05 },
};
// face presets that go with the emotions (only for rigs with addFace)
export const FACE = {
  think: { lid: 0.25, slope: 0.5 }, shrug: { lid: 0.1, slope: -1, mouth: 0.4 }, cheer: { mouth: 1 }, scared: { mouth: 1 }, cower: { lid: 0.5, slope: -1, mouth: 0.6 },
  sad: { lid: 0.45, slope: -1 }, angry: { lid: 0.5, slope: 1 }, laugh: { lid: 0.6, slope: -0.5, mouth: 1 }, evil: { lid: 0.5, slope: 1, mouth: 0.5 }, agony: { lid: 0.3, slope: -1, mouth: 1 },
};

function addPose(c, P, w) { if (!P || w === 0) return;
  const add = (o, v) => { if (v) { o.rotation.x += v[0] * w; o.rotation.y += v[1] * w; o.rotation.z += v[2] * w; } };
  add(c.armR.piv, P.aR); add(c.armL.piv, P.aL); add(c.legR.piv, P.lR); add(c.legL.piv, P.lL); add(c.head, P.h); add(c.torso, P.t); add(c.pelvis, P.p);
  if (P.y) c.pelvis.position.y += P.y * w * (c.root.scale.y > 0 ? 1 : 1); }

// gesture envelope with anticipation + overshoot + settle; returns weight (can be slightly <0 or >1)
export function gestW(L, a, b, inT = 0.38, outT = 0.4) { if (L < a - 0.12 || L > b) return 0;
  const ant = L < a ? -0.12 * Math.sin(seg(L, a - 0.12, a) * Math.PI) : 0;                     // anticipation dip
  const inn = springE(seg(L, a, a + inT)); const out = 1 - sm(seg(L, b - outT, b)); return (L < a ? ant : inn) * out; }

// play a gesture: pose + matching face, with follow-through on head/torso (they arrive a bit later)
export function gesture(c, name, L, a, b, amt = 1, o = {}) { const P = POSES[name]; if (!P) return 0;
  const w = gestW(L, a, b, o.inT, o.outT) * amt, wl = gestW(L, a + 0.07, b + 0.05, o.inT, o.outT) * amt;
  addPose(c, { aR: P.aR, aL: P.aL, lR: P.lR, lL: P.lL, y: P.y }, Math.max(0, w)); // limbs never anticipate inward (no clipping); torso/head do addPose(c, { h: P.h, t: P.t, p: P.p }, wl);
  if (c.setFace && FACE[name] && o.face !== false) { const f = FACE[name], k = cl(w); c.face.lid = Math.max(c.face.lid, (f.lid || 0) * k); if (f.slope) c.face.slope = f.slope * (k > 0.3 ? 1 : 0); c.face.mouth = Math.max(c.face.mouth, (f.mouth || 0) * k); }
  return w; }

// hold a pose for the whole shot (already in place on frame 0 -> no popping), with a living wobble
export function holdPose(c, name, t, amt = 1) { const P = POSES[name]; addPose(c, P, amt * (1 + 0.04 * Math.sin(t * 2.3)));
  if (c.setFace && FACE[name]) { const f = FACE[name]; c.face.lid = Math.max(c.face.lid, (f.lid || 0) * amt); if (f.slope) c.face.slope = f.slope; c.face.mouth = Math.max(c.face.mouth, (f.mouth || 0) * amt); } }

// waving: arm up (outer arm!) with a rocking hand on a curve
export function wave(c, side, L, a, b, t) { const w = Math.max(0, gestW(L, a, b, 0.35, 0.35)); if (w === 0) return; const A = side === 'R' ? c.armR : c.armL, s = side === 'R' ? -1 : 1;
  A.piv.rotation.z += s * 2.45 * w; A.piv.rotation.x += -0.25 * w; A.piv.rotation.z += s * 0.28 * Math.sin(t * 9) * cl(w); A.piv.rotation.x += 0.12 * Math.cos(t * 9) * cl(w); c.head.rotation.z += -s * 0.1 * w; }

// laugh: shoulders bounce + head back + mouth chatter
export function laugh(c, L, a, b, t) { const w = gesture(c, 'laugh', L, a, b); if (w <= 0) return; const k = cl(w);
  c.torso.rotation.x += -0.05 * Math.abs(Math.sin(t * 15)) * k; c.pelvis.position.y += 0.025 * Math.abs(Math.sin(t * 15)) * k; c.head.rotation.x += -0.06 * Math.sin(t * 15) * k;
  if (c.setFace) c.face.mouth = k * (0.5 + 0.5 * Math.abs(Math.sin(t * 15))); }
// surprise: quick hop back with squash & stretch, mouth pops open
export function startle(c, L, a, amt = 1) { if (L < a) return; const u = L - a; const hop = Math.max(0, Math.sin(cl(u / 0.32) * Math.PI)) * 0.12 * amt;
  c.pelvis.position.y += hop; c.root.position.z -= 0.18 * eo(seg(u, 0, 0.3)) * amt * Math.cos(c.root.rotation.y); c.root.position.x -= 0.18 * eo(seg(u, 0, 0.3)) * amt * Math.sin(c.root.rotation.y);
  const sq = u < 0.08 ? 1 - 0.06 * Math.sin(u / 0.08 * Math.PI) : 1 + 0.035 * Math.sin(cl((u - 0.08) / 0.3) * Math.PI) * Math.exp(-u * 3); c.root.scale.y *= sq; c.root.scale.x *= 2 - sq;
  addPose(c, POSES.scared, springE(seg(u, 0, 0.35)) * amt * (1 - sm(seg(u, 1.4, 1.9)))); if (c.setFace) { c.face.mouth = Math.max(c.face.mouth, eo(seg(u, 0, 0.12)) * amt); } }
export function shiver(c, t, a = 1) { c.root.position.x += 0.01 * a * Math.sin(t * 57); c.head.rotation.z += 0.025 * a * Math.sin(t * 43); }
export function nod(c, L, a, n = 2, amt = 0.18) { if (L < a || L > a + n * 0.32) return; c.head.rotation.x += amt * Math.sin((L - a) / 0.32 * Math.PI * 2) * Math.sin(seg(L, a, a + n * 0.32) * Math.PI); }
export function headShake(c, L, a, n = 2, amt = 0.3) { if (L < a || L > a + n * 0.3) return; c.head.rotation.y += amt * Math.sin((L - a) / 0.3 * Math.PI * 2) * Math.sin(seg(L, a, a + n * 0.3) * Math.PI); }

// living idle: breathing, weight shift, head drift (bigger than the rig's idle) + human blinks are handled in main
export function alive(c, t, amt = 1, seed = 0) { c.idle(t, amt, seed); const b = Math.sin(t * 1.7 + seed);
  c.pelvis.rotation.z += 0.018 * Math.sin(t * 0.8 + seed) * amt; c.torso.rotation.z -= 0.012 * Math.sin(t * 0.8 + seed) * amt; c.head.rotation.y += 0.06 * Math.sin(t * 0.55 + seed * 3) * amt; c.torso.rotation.x += 0.01 * b * amt; }

// walk/run a->b over [t0,t1]: eased speed, stride and bob follow the speed -> smooth start and smooth stop (no freeze)
export function walkPath(c, L, t0, t1, a, b, o = {}) { const stride = o.stride || 0.95, run = o.run || 0; const u = seg(L, t0, t1), k = o.linear ? u : eio(u); const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
  c.root.position.x = mix(a[0], b[0], k); c.root.position.z = mix(a[1], b[1], k); const sp = u > 0 && u < 1 ? (o.linear ? 1 : Math.min(1, 6 * u * (1 - u) * 1.15)) : 0;
  if (o.face !== false) c.root.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
  const ph = d * k / stride; const p = ph * Math.PI * 2, s = Math.sin(p), amp = sp * (1 + 0.5 * run);
  c.legR.piv.rotation.x += 0.6 * s * amp; c.legL.piv.rotation.x -= 0.6 * s * amp;
  c.armR.piv.rotation.x -= 0.55 * s * amp; c.armL.piv.rotation.x += 0.55 * s * amp; c.armR.piv.rotation.z -= 0.06 * amp; c.armL.piv.rotation.z += 0.06 * amp;
  c.pelvis.position.y += (Math.abs(Math.cos(p)) * 0.05 - 0.025) * amp; c.pelvis.rotation.z += 0.03 * Math.cos(p) * amp;
  c.torso.rotation.y += 0.07 * s * amp; c.torso.rotation.x += (0.07 + 0.12 * run) * sp; c.head.rotation.y -= 0.05 * s * amp; c.head.rotation.x += 0.03 * Math.cos(p * 2) * amp - 0.04 * run * sp;
  return sp; }

// ---------------- collision check (others + own body), oriented: points tested in the body/head mesh's own space ----------------
const _p = new THREE.Vector3();
function inside(mesh, wp, shrink) { if (!mesh || !mesh.visible) return false; if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox(); const bb = mesh.geometry.boundingBox;
  _p.copy(wp); mesh.worldToLocal(_p); return _p.x > bb.min.x + shrink && _p.x < bb.max.x - shrink && _p.y > bb.min.y + shrink && _p.y < bb.max.y - shrink && _p.z > bb.min.z + shrink && _p.z < bb.max.z - shrink; }
// points along an arm (shoulder->hand) in world space
function armPts(c, A) { const out = []; for (const f of [0.4, 0.6, 0.8, 1.0]) for (const [dx, dz] of [[0, 0], [1.6, 1.6], [-1.6, 1.6], [1.6, -1.6], [-1.6, -1.6]]) out.push(A.piv.localToWorld(new THREE.Vector3(dx / 16, -11.5 * f / 16, dz / 16))); return out; }
const SH = 0.6 / 16; // tolerance: a touch is fine, going in is not
export function collisionCheck(t, live) {
  for (const c of live) { if (!c.root.visible) continue; c.root.updateMatrixWorld(true);
    for (const [nm, A] of [['braçoD', c.armR], ['braçoE', c.armL]]) for (const p of armPts(c, A)) {
      if (inside(c.body, p, SH)) console.log(`LOG ATRAVESSA t=${t.toFixed(2)} ${c.name} ${nm} dentro do próprio corpo`);
      if (inside(c.headMesh, p, SH)) console.log(`LOG ATRAVESSA t=${t.toFixed(2)} ${c.name} ${nm} dentro da própria cabeça`); }
    for (const b of live) { if (b === c || !b.root.visible || b.root.parent !== c.root.parent) continue; b.root.updateMatrixWorld(true);
      for (const [nm, A] of [['braçoD', c.armR], ['braçoE', c.armL]]) for (const p of armPts(c, A)) {
        if (inside(b.body, p, SH) || inside(b.headMesh, p, SH)) console.log(`LOG ATRAVESSA t=${t.toFixed(2)} ${c.name} ${nm} dentro de ${b.name}`);
        for (const B of [b.armR, b.armL]) for (const p2 of armPts(b, B)) if (p.distanceTo(p2) < 0.12 * c.root.scale.x) console.log(`LOG ATRAVESSA t=${t.toFixed(2)} ${c.name} ${nm} encosta no braço de ${b.name}`); }
      const hp = c.head.getWorldPosition(new THREE.Vector3()); if (inside(b.body, hp, SH) || inside(b.headMesh, hp, SH)) console.log(`LOG ATRAVESSA t=${t.toFixed(2)} ${c.name} cabeça dentro de ${b.name}`); } } }
