// EP03 cast — official R15 bodies + classic clothes; boys = HAIR6, girls = HAIR4. FIXED scale per category:
// kids 1.0 (narrator, the other, friend, sister, classmates), adults 1.12, flashback little kids 0.72.
// NARRADOR and O OUTRO are both the protagonist (heroStd): same look — only the wristwatch differs (the narrator's face is MIRRORED).
import * as THREE from 'three';
import { realChar, heroStd } from './realbody.js';
import { HAIR4 } from './hair4.js';
import { HAIR6 } from './hair6.js';
import { plastic } from './rbx.js';
import { watch } from './props3.js';
export const KID = 1.0, ADULT = 1.12, TODDLER = 0.72;
const h6 = (st, col) => head => { const g = new THREE.Group(); head.add(g); HAIR6[st](g, col, null, {}); };
const h4 = (st, col, o) => head => { const g = new THREE.Group(); head.add(g); HAIR4[st](g, col, null, o || {}); };
const glasses = (col = '#151515') => head => { const fm = plastic(col); const g = new THREE.Group(); head.add(g); for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.03, 8, 24), fm); r.position.set(s * 0.18, 0.72, 0.64); g.add(r);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.5), fm); arm.position.set(s * 0.31, 0.74, 0.4); g.add(arm); } const br = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.03, 0.03), fm); br.position.set(0, 0.74, 0.65); g.add(br); };
const both = (...fs) => (head, c) => fs.forEach(f => f(head, c));
const F = o => realChar({ body: 'fem', ...o, face: { anime: true, lashes: true, ...(o.face || {}) } });
const M = o => realChar({ body: 'masc', ...o });
// watch on the LEFT wrist (face outward)
function wear(c, mirrored) { const w = watch(mirrored); c.armL.wrist.add(w); w.position.set(0.0, -0.06, 0.0); w.scale.setScalar(1.0); c.watch = w; return w; }
export function buildCast() { const C = {};
  C.N = heroStd(); C.N.name = 'narrador'; C.N.baseScale = KID; wear(C.N, true);
  C.O = heroStd(); C.O.name = 'outro'; C.O.baseScale = KID; wear(C.O, false);
  C.Np = heroStd(); C.Np.name = 'narradorPeq'; C.Np.baseScale = TODDLER; C.Op = heroStd(); C.Op.name = 'outroPeq'; C.Op.baseScale = TODDLER;
  C.mae = F({ name: 'mae', skin: '#f3d6c0', top: { type: 'sweater', color: '#e84a6a' }, bottom: { type: 'pants', color: '#2a3a6a' }, shoesO: { color: '#4a2a1a', sole: '#2a1a10' }, hat: h4('ponytail', '#5a3420', { tieCol: '#f4c03a' }), face: { eyeColor: '#3a7a3a' }, scale: ADULT });
  C.pai = M({ name: 'pai', skin: '#f0c8a0', top: { type: 'plaid', color: '#3a6ac8', color2: '#f2e8d8' }, bottom: { type: 'jeans', color: '#2a3a6a' }, shoesO: { color: '#3a2a1a' }, hat: h6('curtains', '#3a2414'), scale: ADULT });
  C.irma = F({ name: 'irma', skin: '#f6dcc4', top: { type: 'tee', color: '#8a3ad8', print: 'star' }, bottom: { type: 'skirt', color: '#f07aa8' }, shoesO: { color: '#f2f2f2', stripe: '#8a3ad8' }, hat: h4('pigtails', '#5a3420', { tieCol: '#ffd040' }), face: { eyeColor: '#3a7a3a' }, scale: KID });
  C.amigo = M({ name: 'amigo', skin: '#8a5a3a', top: { type: 'jersey', color: '#1f8a4a', color2: '#ffffff', number: 9 }, bottom: { type: 'shorts', color: '#1f8a4a' }, shoesO: { color: '#f2f2f2', stripe: '#1f8a4a' }, hat: h6('curly', '#15110e'), scale: KID });
  const PROF = () => M({ name: 'professor', skin: '#e8b890', top: { type: 'suit', color: '#5a4a3a', tie: '#3a62d8' }, bottom: { type: 'pants', color: '#3a3028' }, shoesO: { color: '#151515', sole: '#151515' }, hat: both(h6('buzz', '#2a2a2a'), glasses('#2a2a2a')), scale: ADULT }); C.professor = PROF();
  C.prof = F({ name: 'professora', skin: '#c88a5a', top: { type: 'blouse', color: '#f6f2ee' }, bottom: { type: 'skirt', color: '#2a3a6a' }, shoesO: { color: '#4a2a1a', sole: '#2a1a10' }, hat: both(h4('bun', '#15110e'), glasses('#8a2a2a')), face: { eyeColor: '#5a3a1a' }, scale: ADULT });
  C.dentista = F({ name: 'dentista', skin: '#f3d6c0', top: { type: 'plain', color: '#7ad0c8', sleeves: 'short' }, bottom: { type: 'pants', color: '#7ad0c8' }, shoesO: { color: '#f2f2f2' }, hat: h4('bob', '#e8c070'), face: { eyeColor: '#3aa8e8' }, scale: ADULT });
  C.medico = M({ name: 'medico', skin: '#6a4028', top: { type: 'jacket', color: '#f8f8f8', inner: '#5ab0e8' }, bottom: { type: 'pants', color: '#3a4a6a' }, shoesO: { color: '#151515' }, hat: both(h6('boy', '#15110e'), glasses('#3a3a3a')), scale: ADULT });
  const PREF = () => M({ name: 'prefeito', skin: '#f3d6c0', top: { type: 'suit', color: '#2a2e44', tie: '#c81e2a' }, bottom: { type: 'pants', color: '#2a2e44' }, shoesO: { color: '#151515', sole: '#151515' }, hat: both(h4('old', '#c8c8c8'), glasses('#2a2a2a')), scale: ADULT }); C.prefeito = PREF();
  const KD = [
    () => M({ name: 'k1', skin: '#f0c8a0', top: { type: 'pajama', color: '#3a62d8' }, bottom: { type: 'pajama', color: '#3a62d8' }, hat: h6('messy', '#5a3420') }),
    () => F({ name: 'k2', skin: '#c88a5a', top: { type: 'sweater', color: '#f07aa8' }, bottom: { type: 'jeans', color: '#2a3a6a' }, hat: h4('long', '#2a1a10', { tieCol: '#ff7aa8' }), face: { eyeColor: '#5a3a1a' } }),
    () => M({ name: 'k3', skin: '#6a4028', top: { type: 'stripes', color: '#f4c03a', color2: '#2a62d8' }, bottom: { type: 'shorts', color: '#2a2a30' }, hat: h6('spiky', '#15110e') }),
    () => F({ name: 'k4', skin: '#f6e0d0', top: { type: 'tee', color: '#3ab0e8', print: 'heart' }, bottom: { type: 'skirt', color: '#f4c03a' }, hat: h4('bob', '#c0501a'), face: { eyeColor: '#3a7a3a' } }),
    () => M({ name: 'k5', skin: '#e8b890', top: { type: 'hoodie', color: '#e8743a', color2: '#f4c03a', fade: true }, bottom: { type: 'jeans', color: '#1a2a5a' }, hat: h6('quiff', '#e8c070') }),
    () => F({ name: 'k6', skin: '#8a5a3a', top: { type: 'polo', color: '#2ab0a0' }, bottom: { type: 'pants', color: '#3a3a40' }, hat: h4('ponytail', '#15110e', { tieCol: '#e84a8a' }), face: { eyeColor: '#2a1a10' } }),
  ]; const kids = KD.map(f => f()); kids.forEach(k => k.baseScale = KID); C.kids = kids;
  const AD = [
    () => F({ name: 'a1', skin: '#f3d6c0', top: { type: 'blouse', color: '#f6f2ee' }, bottom: { type: 'pants', color: '#3a2a6a' }, hat: h4('ponytail', '#7a4a2a', { tieCol: '#3a62d8' }), face: { eyeColor: '#3a7a3a' } }),
    () => M({ name: 'a2', skin: '#8a5a3a', top: { type: 'jacket', color: '#3a6a3a', inner: '#f4f4f4' }, bottom: { type: 'jeans', color: '#2a3a6a' }, hat: h6('surfer', '#2a1a10') }),
    () => M({ name: 'a3', skin: '#f0c8a0', top: { type: 'polo', color: '#e84a4a' }, bottom: { type: 'pants', color: '#6a4a2a' }, hat: h6('boy', '#1c1612') }),
    () => F({ name: 'a4', skin: '#c88a5a', top: { type: 'tee', color: '#f4c03a' }, bottom: { type: 'skirt', color: '#2a62d8' }, hat: h4('long', '#15110e', { buns: true, tieCol: '#e84a8a' }), face: { eyeColor: '#5a3a1a' } }),
  ]; const adults = AD.map(f => f()); adults.forEach(k => k.baseScale = ADULT); C.adults = adults;
  // TWINS: doubles that exist ONLY inside mirrors (layer 2) — same look, their own animation
  const tw = (c, name) => { c.name = name; return c; };
  C.T = { k1: tw(KD[0](), 'k1T'), k2: tw(KD[1](), 'k2T'), k5: tw(KD[4](), 'k5T'), a1: tw(AD[0](), 'a1T'), a3: tw(AD[2](), 'a3T'), professor: tw(PROF(), 'professorT'), prefeito: tw(PREF(), 'prefeitoT') };
  for (const c of [C.T.k1, C.T.k2, C.T.k5]) c.baseScale = KID; for (const c of [C.T.a1, C.T.a3]) c.baseScale = ADULT;
  C.all = [C.N, C.O, C.Np, C.Op, C.mae, C.pai, C.irma, C.amigo, C.professor, C.prof, C.dentista, C.medico, C.prefeito, ...kids, ...adults, ...Object.values(C.T)];
  for (const c of C.all) c.reset(); return C; }
