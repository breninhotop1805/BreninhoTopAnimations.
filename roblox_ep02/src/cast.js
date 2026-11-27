// EP02 cast — official R15 bodies + classic clothes; boys = HAIR6, girls = HAIR4 (approved catalogue). FIXED scale per category:
// kids 1.0 (hero, new boy, classmates), adults 1.12 (bodybuilder, mayor, teacher, street adults), flashback toddlers 0.72.
import * as THREE from 'three';
import { realChar, heroStd } from './realbody.js';
import { HAIR4 } from './hair4.js';
import { HAIR6 } from './hair6.js';
import { plastic, topHat } from './rbx.js';
export const KID = 1.0, ADULT = 1.12, TODDLER = 0.72;
const h6 = (st, col) => head => { const g = new THREE.Group(); head.add(g); HAIR6[st](g, col, null, {}); };
const h4 = (st, col, o) => head => { const g = new THREE.Group(); head.add(g); HAIR4[st](g, col, null, o || {}); };
const glasses = (col = '#151515') => head => { const fm = plastic(col); const g = new THREE.Group(); head.add(g); for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.03, 8, 24), fm); r.position.set(s * 0.18, 0.72, 0.64); g.add(r);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.5), fm); arm.position.set(s * 0.31, 0.74, 0.4); g.add(arm); } const br = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.03, 0.03), fm); br.position.set(0, 0.74, 0.65); g.add(br); };
const both = (...fs) => (head, c) => fs.forEach(f => f(head, c));
const F = o => realChar({ body: 'fem', ...o, face: { anime: true, lashes: true, ...(o.face || {}) } });
const M = o => realChar(Object.assign({ body: 'masc' }, o));
export function buildCast() { const C = {};
  C.hero = heroStd(); C.hero.baseScale = KID;
  C.heroP = heroStd(); C.heroP.name = 'heroiPeq'; C.heroP.baseScale = TODDLER;
  const novoO = { skin: '#c88a5a', top: { type: 'hoodie', color: '#f08a2a', color2: '#f4c03a', fade: true }, bottom: { type: 'jeans', color: '#2a3a6a' }, shoesO: { color: '#f2f2f2', stripe: '#f08a2a' }, hat: h6('quiff', '#1c1612') };
  C.novo = M({ name: 'novo', ...novoO, scale: KID }); C.novoP = M({ name: 'novoPeq', ...novoO, scale: TODDLER });
  C.maromba = M({ name: 'maromba', skin: '#d8a070', top: { type: 'plain', color: '#1f1f24', sleeves: 'none' }, bottom: { type: 'shorts', color: '#d83a3a' }, shoesO: { color: '#f2f2f2', stripe: '#d83a3a' }, hat: h6('buzz', '#1a1410'), face: { brow: 0.5 }, scale: ADULT });
  C.prefeito = M({ name: 'prefeito', skin: '#f3d6c0', top: { type: 'suit', color: '#2a2e44', tie: '#c81e2a' }, bottom: { type: 'pants', color: '#2a2e44' }, shoesO: { color: '#151515', sole: '#151515' }, hat: both(h4('old', '#c8c8c8'), glasses('#2a2a2a')), scale: ADULT });
  C.prof = F({ name: 'professora', skin: '#e8b890', top: { type: 'sweater', color: '#5a9a4a' }, bottom: { type: 'skirt', color: '#2a3a6a' }, shoesO: { color: '#4a2a1a', sole: '#2a1a10' }, hat: both(h4('bun', '#5a3420'), glasses('#8a2a2a')), face: { eyeColor: '#3a7a3a' }, scale: ADULT });
  // girl of the opening (her friend disappears) + her real friend
  C.menina = F({ name: 'menina', skin: '#f6dcc4', top: { type: 'tee', color: '#8a3ad8', print: 'star' }, bottom: { type: 'skirt', color: '#f07aa8' }, shoesO: { color: '#f2f2f2', stripe: '#8a3ad8' }, hat: h4('pigtails', '#2a1a10', { tieCol: '#ffd040' }), face: { eyeColor: '#8a3ad8' }, scale: KID });
  C.amiga = F({ name: 'amiga', skin: '#8a5a3a', top: { type: 'stripes', color: '#2ab0a0', color2: '#ffffff' }, bottom: { type: 'shorts', color: '#1a2a6a' }, shoesO: { color: '#f4c03a' }, hat: h4('ponytail', '#15110e', { tieCol: '#ff4a8a' }), face: { eyeColor: '#6a3a1a' }, scale: KID });
  // classmates / extras (varied skin, hair shape + colour, clothes)
  const kids = [
    M({ name: 'k1', skin: '#f0c8a0', top: { type: 'tee', color: '#2a62d8' }, bottom: { type: 'shorts', color: '#2a2a30' }, hat: h6('boy', '#5a3420') }),
    F({ name: 'k2', skin: '#f3d6c0', top: { type: 'sweater', color: '#f07aa8' }, bottom: { type: 'jeans', color: '#2a3a6a' }, hat: h4('long', '#e8c070', { tieCol: '#ff7aa8' }), face: { eyeColor: '#3aa8e8' } }),
    M({ name: 'k3', skin: '#6a4028', top: { type: 'jersey', color: '#1f8a4a', color2: '#ffffff', number: 10 }, bottom: { type: 'shorts', color: '#1f8a4a' }, hat: h6('curly', '#15110e') }),
    F({ name: 'k4', skin: '#c88a5a', top: { type: 'plaid', color: '#c83a3a', color2: '#f2e8d8' }, bottom: { type: 'jeans', color: '#2a3a6a' }, hat: h4('bob', '#151515'), face: { eyeColor: '#5a3a1a' } }),
    M({ name: 'k5', skin: '#f6e0d0', top: { type: 'stripes', color: '#f4c03a', color2: '#2a62d8' }, bottom: { type: 'pants', color: '#3a3a40' }, hat: h6('spiky', '#c0501a') }),
    M({ name: 'k6', skin: '#e8b890', top: { type: 'polo', color: '#e83a5a' }, bottom: { type: 'jeans', color: '#1a2a5a' }, hat: h6('curtains', '#e8c070') }),
    F({ name: 'k7', skin: '#8a5a3a', top: { type: 'tee', color: '#3ab0e8', print: 'heart' }, bottom: { type: 'skirt', color: '#f4c03a' }, hat: h4('long', '#2a1a10', { buns: true, tieCol: '#e84a8a' }), face: { eyeColor: '#2a1a10' } }),
    M({ name: 'k8', skin: '#d8a070', top: { type: 'hoodie', color: '#3a3a8a', color2: '#8a3ad8', fade: true }, bottom: { type: 'track', color: '#151515' }, hat: h6('messy', '#1a1a1a') }),
  ]; kids.forEach(k => k.baseScale = KID); C.kids = kids;
  const adults = [
    F({ name: 'a1', skin: '#f3d6c0', top: { type: 'blouse', color: '#f6f2ee' }, bottom: { type: 'pants', color: '#3a2a6a' }, hat: h4('ponytail', '#7a4a2a', { tieCol: '#3a62d8' }), face: { eyeColor: '#3a7a3a' } }),
    M({ name: 'a2', skin: '#8a5a3a', top: { type: 'jacket', color: '#3a6a3a', inner: '#f4f4f4' }, bottom: { type: 'jeans', color: '#2a3a6a' }, hat: h6('surfer', '#2a1a10') }),
    M({ name: 'a3', skin: '#f0c8a0', top: { type: 'plaid', color: '#3a6ac8', color2: '#f2e8d8' }, bottom: { type: 'pants', color: '#6a4a2a' }, hat: h6('boy', '#1c1612') }),
  ]; adults.forEach(k => k.baseScale = ADULT); C.adults = adults;
  C.all = [C.hero, C.heroP, C.novo, C.novoP, C.maromba, C.prefeito, C.prof, C.menina, C.amiga, ...kids, ...adults];
  for (const c of C.all) c.reset(); return C; }
