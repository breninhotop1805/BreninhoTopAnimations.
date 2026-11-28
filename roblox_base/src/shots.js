// TEST REEL — shows the protagonist, the face decal expressions, the acting kit and the subtitles. Not a real episode.
import * as THREE from 'three';
import { gesture, wave, alive, talk, walkPath, startle, eo, eio, seg, mix, sm } from './act.js';
const V3 = THREE.Vector3;
const cam = (x, p, l, fov) => { x.camera.position.set(...p); x.camera.lookAt(...l); if (fov) x.camera.fov = fov; };
const put = (x, n, s, px, pz, ry = 0) => { const c = x.C[n]; s.add(c.root); c.root.position.set(px, 0, pz); c.root.rotation.y = ry; x.live.push(c); return c; };
const headP = c => { c.root.updateMatrixWorld(true); return c.head.localToWorld(new V3(0, 0.66, 0)); };
const lookCam = (x, c, w = 1) => { const h = headP(c); const dx = x.camera.position.x - h.x, dz = x.camera.position.z - h.z; const yaw = Math.atan2(dx, dz) - c.root.rotation.y - c.torso.rotation.y; c.head.rotation.y = mix(c.head.rotation.y, Math.max(-1, Math.min(1, Math.atan2(Math.sin(yaw), Math.cos(yaw)))), w); };
const punch = (x, a, amt = 0.15, dur = 0.25) => { const k = eo(seg(x.L, a, a + dur)); x.camera.fov *= 1 - amt * k; };
const shots = []; const at = (t, name, fn) => shots.push({ t, name, fn });

// 1) hero waves in the street, slow push-in
at(0.0, 'oi', x => { const s = x.S.street; const c = put(x, 'heroi', s, 0, 0); alive(c, x.t); wave(c, x.L, 0.25, 2.0, x.t); lookCam(x, c, 0.8);
  const k = eo(x.u); cam(x, [mix(1.2, 0.5, k), 3.4, mix(11, 8.5, k)], [0, 3.1, 0], 40); x.out.focus = x.camera.position.distanceTo(headP(c)); });
// 2) close-up: expressions — happy -> shocked (hop) -> angry -> sad
at(2.0, 'caras', x => { const s = x.S.street; const c = put(x, 'heroi', s, 0, 0); alive(c, x.t); lookCam(x, c, 1); const L = x.L;
  if (L < 0.5) c.setFace({ mouth: 'grin', eyes: 'happy' }); else if (L < 1.2) { startle(c, L, 0.5); } else if (L < 1.8) { gesture(c, 'angry', L, 1.2, 1.8); c.setFace({ eyes: 'angry', mouth: 'frown', brow: 1 }); } else { gesture(c, 'sad', L, 1.8); c.setFace({ eyes: 'sad', mouth: 'frown', brow: -1, tears: sm(seg(L, 2.0, 2.4)) }); }
  const h = headP(c); cam(x, [h.x + 0.5, h.y - 0.5, h.z + mix(7.2, 6.2, eo(x.u))], [h.x, h.y - 1.0, h.z], 38); punch(x, 0.5, 0.12); x.out.focus = x.camera.position.distanceTo(h); });
// 3) walks toward the camera talking, then stops and points at us
at(4.6, 'anda', x => { const s = x.S.street; const c = put(x, 'heroi', s, 0, -3); walkPath(c, x.L, 0, 1.4, [-1.5, -3], [0, 1], { stride: 2.2 }); talk(c, x.t, 1 - seg(x.L, 1.5, 1.6)); if (x.L > 1.4) { gesture(c, 'point', x.L, 1.5); c.setFace({ mouth: 'grin', eyes: 'normal', brow: 0.3 }); }
  lookCam(x, c, sm(seg(x.L, 1.2, 1.6)) * 0.9); const h = headP(c); cam(x, [0.6, 3.3, 9.5], [h.x * 0.5, 2.9, h.z], 40); x.out.focus = x.camera.position.distanceTo(h); });

export const SHOTS = shots; export const DURATION = 7.0;
const w = (s, t0, t1, red) => ({ w: s, t0, t1, red: !!red });
export const WORDS = [w('Olá', 0.3, 0.75), w('eu', 0.75, 1.0), w('sou', 1.0, 1.3), w('o', 1.3, 1.45), w('HERÓI', 1.45, 2.0, true), w('feliz,', 2.05, 2.5), w('assustado,', 2.5, 3.2), w('bravo', 3.2, 3.8, true), w('e', 3.8, 3.95), w('triste', 3.95, 4.6), w('bora', 4.7, 5.1), w('nessa', 5.1, 5.6), w('história?', 6.1, 6.9, true)];
