// ======================= R15 acting poses (refs): body language + face, hands placed by IK on real targets =======================
// Each pose: torso/head rotations, optional hip lift/bounce/shake, and arm targets given in the character's OWN frames
// (c.head = head space: face front z≈0.62, eyes y≈0.69, chin y≈0.2; c.torso = torso space: chest y≈1.3, belly y≈0.8, front z≈0.45).
// pose15(c, name, w, t, o): w = weight 0..1 (use gestW for anticipation + overshoot), t = time (for shake/bounce),
// o.mirror swaps the arms (use the OUTER arm when two people stand side by side), o.face=false keeps the current face.
import * as THREE from 'three';
import { reach } from './act.js';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const POSE15 = {
  coverFace: { arms: c => [[c.armR, c.head, V(-0.2, 0.7, 0.86)], [c.armL, c.head, V(0.2, 0.7, 0.86)]], head: [0.32, 0, 0], torso: [0.14, 0, 0], shake: 0.025, face: { eyes: 'closed', mouth: 'frown', cry: 1, brow: -1 } },
  handsHead: { arms: c => [[c.armR, c.head, V(-0.74, 0.95, 0.12)], [c.armL, c.head, V(0.74, 0.95, 0.12)]], head: [-0.08, 0, 0], torso: [-0.05, 0, 0], face: { eyes: 'circle', mouth: 'scream', brow: -0.8 } },
  crossArms: { arms: c => [[c.armR, c.torso, V(0.3, 1.18, 0.7)], [c.armL, c.torso, V(-0.3, 1.3, 0.82)]], head: [0.06, 0, 0.1], face: { mouth: 'frown', eyes: 'angry', brow: 1 } },
  laugh: { arms: c => [[c.armR, c.torso, V(-0.28, 0.78, 0.66)], [c.armL, c.torso, V(0.28, 0.78, 0.66)]], head: [-0.38, 0, 0.05], torso: [-0.12, 0, 0], bounce: 0.035, face: { eyes: 'happy', mouth: 'laugh' } },
  fistUp: { arms: c => [[c.armR, c.torso, V(-0.75, 2.9, 0.35)]], head: [-0.12, 0, 0], torso: [-0.04, 0, 0.05], face: { eyes: 'angry', mouth: 'open', brow: 1 } },
  think: { arms: c => c.body === 'bloco' ? [[c.armR, c.head, V(-0.1, -0.3, 0.8)]] : [[c.armR, c.head, V(-0.04, -0.42, 0.8)], [c.armL, c.torso, V(0.06, 1.0, 0.72)]], head: [0.1, 0.16, 0.12], face: { mouth: 'flat', brow: 0.4, look: [0.6, -0.8] } },
  shrug: { arms: c => [[c.armR, c.torso, V(-1.2, 1.25, 0.55)], [c.armL, c.torso, V(1.2, 1.25, 0.55)]], head: [0.06, 0, 0.22], lift: 0.05, face: { mouth: 'flat', brow: -0.5 } },
  cheer: { arms: c => [[c.armR, c.torso, V(-1.05, 3.3, 0.25)], [c.armL, c.torso, V(1.05, 3.3, 0.25)]], head: [-0.25, 0, 0], torso: [-0.05, 0, 0], bounce: 0.06, face: { eyes: 'happy', mouth: 'laugh' } },
  scared: { arms: c => [[c.armR, c.head, V(-0.55, 0.45, 0.95)], [c.armL, c.head, V(0.55, 0.45, 0.95)]], head: [0.06, 0, 0], torso: [-0.16, 0, 0], shake: 0.018, face: { eyes: 'circle', mouth: 'grimace', brow: -0.8, sweat: 1 } },
  holdFront: { arms: c => [[c.armR, c.torso, V(-0.26, 1.2, 0.9)], [c.armL, c.torso, V(0.26, 1.2, 0.9)]] },
  phone: { arms: c => [[c.armR, c.head, V(-0.7, 0.55, 0.12)]], head: [0, 0, -0.12] },
  facepalm: { arms: c => [[c.armR, c.head, V(0.02, 0.78, 0.8)]], head: [0.32, 0, 0], face: { eyes: 'closed', mouth: 'frown' } },
  hips: { arms: c => [[c.armR, c.torso, V(-0.78, 0.6, 0.18)], [c.armL, c.torso, V(0.78, 0.6, 0.18)]], head: [-0.06, 0, 0.1], face: { mouth: 'smirk' } },
  sad: { arms: null, head: [0.42, 0, 0.08], torso: [0.12, 0, 0], lift: -0.03, face: { mouth: 'frown', eyes: 'sad', brow: -1 } },
  chest: { arms: c => [[c.armR, c.torso, V(-0.15, 1.45, 0.62)]], head: [0.08, 0, 0.1], face: { eyes: 'happy', mouth: 'smile' } },
  clap: { arms: c => [[c.armR, c.torso, V(-0.05, 1.35, 1.0)], [c.armL, c.torso, V(0.05, 1.35, 1.0)]], head: [-0.05, 0, 0], face: { eyes: 'happy', mouth: 'grin' } },
};
export function pose15(c, name, w, t = 0, o = {}) { if (!(w > 0)) return 0; const P = POSE15[name]; if (!P) return 0;
  const R = (obj, v) => { if (v) { obj.rotation.x += v[0] * w; obj.rotation.y += v[1] * w; obj.rotation.z += v[2] * w; } };
  R(c.torso, P.torso); R(c.head, P.head); if (P.lift) c.hip.position.y += P.lift * w; if (P.bounce) c.hip.position.y += P.bounce * Math.abs(Math.sin(t * 13)) * w;
  if (P.shake) { c.torso.rotation.z += P.shake * Math.sin(t * 38) * w; c.head.rotation.z += P.shake * 0.8 * Math.sin(t * 31 + 1) * w; }
  if (P.arms) { c.root.updateMatrixWorld(true); const list = P.arms(c, o).map(([A, F, p]) => { const q = p.clone(); if (c.body === 'bloco') { q.x *= 1.5; q.z += F === c.head ? 0.3 : 0.45; } return [A, F.localToWorld(q)]; });
    for (const [A, T] of list) { const B = o.mirror ? (A === c.armR ? c.armL : c.armR) : A; if (o.mirror) { const lp = (B === c.armL ? c.armR : c.armL); } reach(c, B, o.mirror ? mirrorT(c, T) : T, w); } }
  if (P.face && w > 0.35 && o.face !== false) c.setFace(P.face); return w; }
function mirrorT(c, T) { const inv = new THREE.Matrix4().copy(c.root.matrixWorld).invert(); const L = T.clone().applyMatrix4(inv); L.x = -L.x; return L.applyMatrix4(c.root.matrixWorld); }
