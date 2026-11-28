// EP04 cast — official R15 bodies + classic clothes; boys = HAIR6, girls = HAIR4. FIXED scale per category: kids 1.0, adults 1.12.
// In this school the HAIR takes the colour of the loved one's EYES -> lots of coloured hair (and a colourful video).
// Every character gets: c.hairG (hair group) + c.hfx (colour change/glow/two-tone, hairfx.js) + c.wear('none'|'hat'|'beanie'|'cap').
import * as THREE from 'three';
import { realChar, heroStd } from './realbody.js';
import { HAIR4 } from './hair4.js';
import { HAIR6 } from './hair6.js';
import { plastic, topHat } from './rbx.js';
import { hairFX } from './hairfx.js';
import { beanie, cap } from './props4.js';
export const KID = 1.0, ADULT = 1.12;
const glasses = (col = '#151515') => head => { const fm = plastic(col); const g = new THREE.Group(); head.add(g); for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.03, 8, 24), fm); r.position.set(s * 0.18, 0.72, 0.64); g.add(r);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.5), fm); arm.position.set(s * 0.31, 0.74, 0.4); g.add(arm); } const br = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.03, 0.03), fm); br.position.set(0, 0.74, 0.65); g.add(br); };
// build a character with hair + optional head wear (all toggled later with c.wear)
function mk(o) { const P = {}; const hat = head => { const hg = new THREE.Group(); head.add(hg); P.hair = hg;
    if (o.h6) HAIR6[o.h6](hg, o.hc, null, {}); else if (o.h4) HAIR4[o.h4](hg, o.hc, null, o.h4o || {});
    if (o.glasses) glasses(o.glasses)(head); if (o.top) { const g = new THREE.Group(); head.add(g); topHat()(g); P.top = g; }
    P.beanie = beanie(...(o.beanie || ['#e84a6a', '#f4f4f0', '#ffffff'])); head.add(P.beanie); P.cap = cap(...(o.cap || ['#2a62d8'])); head.add(P.cap); if (o.capBack) P.cap.rotation.y = Math.PI; };
  const c = realChar({ name: o.name, body: o.body, skin: o.skin, top: o.topW, bottom: o.bottom, shoesO: o.shoes, hat, face: o.face, scale: o.scale });
  c.hairG = P.hair; c.topG = P.top; c.beanieG = P.beanie; c.capG = P.cap; c.hfx = hairFX(c, P.hair, { old: o.hc, a: o.hc, sweep: 0, ...(o.fx || {}) }); c.hideUnderBeanie = !!o.hideUnderBeanie;
  c.defWear = o.wear || (o.top ? 'hat' : 'none');
  c.wear = w => { c.worn = w; if (c.topG) c.topG.visible = w === 'hat'; c.beanieG.visible = w === 'beanie'; c.capG.visible = w === 'cap';
    c.hfx.U.uClip.value = w === 'hat' ? 1.16 : w === 'beanie' ? 0.98 : w === 'cap' ? 1.0 : 99; c.hairG.visible = !((w === 'beanie' && c.hideUnderBeanie) || (w === 'cap' && o.hideUnderCap)); };
  const r0 = c.reset.bind(c); c.reset = () => { r0(); if (!c.hfx) return; c.hfx.reset(); c.hairG.scale.set(1, 1, 1); c.hairG.position.set(0, 0, 0); for (const g of [c.beanieG, c.capG]) { g.position.set(0, 0, 0); g.rotation.set(0, g === c.capG && o.capBack ? Math.PI : 0, 0); g.scale.setScalar(1); } c.wear(c.defWear); };
  return c; }
const F = o => mk({ body: 'fem', ...o, face: { anime: true, lashes: true, ...(o.face || {}) } });
const Mm = o => mk({ body: 'masc', ...o });
export const COL = { green: '#1fd26a', blue: '#2a7ae8', brown: '#7a4a22', yellow: '#ffd21a', heroOld: '#3a2414' };
export function buildCast() { const C = {};
  // HIM: EXACTLY the protagonist (heroStd: white, red tank top, blue top hat) — his model NEVER changes (user rule).
  // Story: "his hair turns green" = his TOP HAT turns emerald and glows (c.hatGreen(k, glow)). Eye colours only in the eye close-ups.
  C.N = heroStd(); C.N.name = 'narrador'; C.N.baseScale = KID; { const hm = []; C.N.head.traverse(m => { if (m.isMesh && m.geometry.type === 'LatheGeometry' && m.material.color && m.material.color.getHexString() === '1f5fb8') { m.material = m.material.clone(); hm.push(m.material); } });
    const blue = new THREE.Color('#1f5fb8'), green = new THREE.Color('#12d86a');
    C.N.hatGreen = (k = 0, glow = 0) => { for (const m of hm) { m.color.copy(blue).lerp(green, k); if (m.emissive) m.emissive.copy(green).multiplyScalar(0.6 * glow * k); } }; C.N.hatMats = hm;
    C.N.hatG = C.N.head.children.find(g => g.isGroup && g.position.y > 1); const r0 = C.N.reset.bind(C.N); C.N.reset = () => { r0(); C.N.hatGreen(0, 0); if (C.N.hatG) { C.N.hatG.position.set(0, 1.04, 0); C.N.hatG.rotation.set(0, 0, -0.03); } }; }
  // the NEW GIRL: green eyes, beanie always on (hair tucked inside), hair = half blue, half brown (his eyes)
  const girl = (name, topW, bottom, shoes) => F({ name, skin: '#f6dcc4', topW, bottom, shoes, h4: 'long', hc: '#2a1a12', h4o: { tieCol: '#ffd040' }, beanie: ['#e84a6a', '#f4f4f0', '#ffffff'], wear: 'beanie', hideUnderBeanie: true,
    face: { eyeColor: '#1fb85a' }, fx: { old: '#2a1a12', a: COL.blue, b: COL.brown, two: true, sweep: 1 }, scale: KID });
  C.G = girl('nova', { type: 'sweater', color: '#9a7ae8' }, { type: 'skirt', color: '#2a3a7a' }, { color: '#f2f2f2', stripe: '#9a7ae8' });
  C.Gs = girl('novaPiscina', { type: 'plain', color: '#1f4fd8', sleeves: 'none' }, { type: 'shorts', color: '#1f4fd8' }, { color: '#f4f4f4', sole: '#f4f4f4' });
  // the 9th-grade BULLY: green eyes, cap backwards; YELLOW hair (his girlfriend's eyes)
  C.B = Mm({ name: 'valentao', skin: '#e8b890', topW: { type: 'jacket', color: '#26262e', inner: '#d83a3a' }, bottom: { type: 'jeans', color: '#2a3a6a' }, shoes: { color: '#f2f2f2', stripe: '#d83a3a' },
    h6: 'spiky', hc: COL.yellow, cap: ['#d83a3a', '#26262e'], capBack: true, wear: 'cap', hideUnderCap: true, face: { iris: '#1fb85a', brow: -0.4 }, scale: KID });
  C.BG = F({ name: 'namorada', skin: '#c88a5a', topW: { type: 'tee', color: '#ff7ab8', print: 'heart' }, bottom: { type: 'skirt', color: '#f4c03a' }, shoes: { color: '#ffffff', stripe: '#ff7ab8' }, h4: 'pigtails', hc: '#2a1a10', h4o: { tieCol: '#ffd040' }, face: { eyeColor: '#f4c010' }, scale: KID });
  // the most popular boy (hair changes colour 7 times)
  C.POP = Mm({ name: 'popular', skin: '#c88a5a', topW: { type: 'jacket', color: '#2a62d8', inner: '#f4f4f4' }, bottom: { type: 'jeans', color: '#1a2a5a' }, shoes: { color: '#f2f2f2', stripe: '#2a62d8' }, h6: 'quiff', hc: '#e8283a', scale: KID });
  // adults
  C.QUI = Mm({ name: 'quimico', skin: '#f0c8a0', topW: { type: 'jacket', color: '#f8f8f8', inner: '#2ab0a0' }, bottom: { type: 'pants', color: '#3a4a6a' }, shoes: { color: '#3a2a1a' }, h6: 'curtains', hc: COL.blue, glasses: '#2a2a30', face: { iris: '#6a4020' }, cap: ['#2a62d8'], scale: ADULT });
  C.MER = F({ name: 'merendeira', skin: '#e8b890', topW: { type: 'polo', color: '#3ab0e8' }, bottom: { type: 'pants', color: '#2a3a6a' }, shoes: { color: '#ffffff' }, h4: 'bun', hc: '#a8481a', face: { eyeColor: '#2a8af0' }, cap: ['#ff5ab0'], scale: ADULT });
  C.PROF = F({ name: 'professora', skin: '#c88a5a', topW: { type: 'blouse', color: '#f08a3a' }, bottom: { type: 'skirt', color: '#2a3a6a' }, shoes: { color: '#4a2a1a', sole: '#2a1a10' }, h4: 'bun', hc: '#15110e', glasses: '#8a2a2a', face: { eyeColor: '#5a3a1a' }, cap: ['#f4c03a'], scale: ADULT });
  C.DIR = F({ name: 'diretora', skin: '#f3d6c0', topW: { type: 'blouse', color: '#8a3ad8' }, bottom: { type: 'pants', color: '#3a2a6a' }, shoes: { color: '#151515', sole: '#151515' }, h4: 'bun', hc: '#c8c8cc', glasses: '#2a2a30', face: { eyeColor: '#1fb85a' }, cap: ['#8a3ad8'], scale: ADULT });
  C.COACH = Mm({ name: 'treinador', skin: '#8a5a3a', topW: { type: 'polo', color: '#e83a3a' }, bottom: { type: 'shorts', color: '#1a2a5a' }, shoes: { color: '#ffffff', stripe: '#e83a3a' }, h6: 'buzz', hc: '#15110e', cap: ['#e8283a'], scale: ADULT });
  // students (many with "love" hair colours)
  const KD = [
    ['k1', 'm', '#f0c8a0', { type: 'hoodie', color: '#ff7ab8', color2: '#ffd0e8', fade: true }, { type: 'jeans', color: '#2a3a6a' }, 'messy', '#ff5ab0', '#3a5ad8'],
    ['k2', 'f', '#c88a5a', { type: 'sweater', color: '#3ab04a' }, { type: 'skirt', color: '#2a3a6a' }, 'ponytail', '#3a2414', '#8a4ad8'],
    ['k3', 'm', '#6a4028', { type: 'stripes', color: '#f4c03a', color2: '#2a62d8' }, { type: 'shorts', color: '#2a2a30' }, 'spiky', '#ff8a1a', '#2a62d8'],
    ['k4', 'f', '#f6e0d0', { type: 'tee', color: '#f4c03a', print: 'star' }, { type: 'skirt', color: '#e84a6a' }, 'bob', '#1fc8c0', '#e86a2a'],
    ['k5', 'm', '#e8b890', { type: 'plaid', color: '#3a6ac8', color2: '#f2e8d8' }, { type: 'jeans', color: '#1a2a5a' }, 'curly', '#15110e', '#3a7a3a'],
    ['k6', 'f', '#8a5a3a', { type: 'polo', color: '#e84a4a' }, { type: 'pants', color: '#3a3a40' }, 'long', '#f0c860', '#5a3a1a'],
    ['k7', 'm', '#f3d6c0', { type: 'jersey', color: '#1f8a4a', color2: '#ffffff', number: 7 }, { type: 'shorts', color: '#1f8a4a' }, 'surfer', '#e8282a', '#2a62d8'],
    ['k8', 'f', '#e8b890', { type: 'tee', color: '#2a8ad8', print: 'heart' }, { type: 'jeans', color: '#2a3a6a' }, 'pigtails', '#5ae8a0', '#d83a8a'],
    ['k9', 'm', '#c88a5a', { type: 'hoodie', color: '#f4a03a', color2: '#e8503a', fade: true }, { type: 'pants', color: '#2a2a30' }, 'buzz', '#3a2414', '#3a7a3a'],
    ['k10', 'f', '#f6dcc4', { type: 'sweater', color: '#e84a8a' }, { type: 'jeans', color: '#1a2a5a' }, 'bun', '#c8a0ff', '#3a8af0'],
  ];
  const capCols = ['#e8283a', '#2a62d8', '#f4c03a', '#3ab04a', '#b84ae8', '#ff8a2a', '#1fc8c0', '#ff5ab0', '#ffffff', '#26262e'];
  C.kids = KD.map(([name, sx, skin, topW, bottom, st, hc, eye], i) => sx === 'm' ? Mm({ name, skin, topW, bottom, shoes: { color: '#f2f2f2', stripe: hc }, h6: st, hc, cap: [capCols[i]], face: { iris: eye }, scale: KID })
    : F({ name, skin, topW, bottom, shoes: { color: '#f2f2f2', stripe: hc }, h4: st, hc, h4o: { tieCol: '#ffd040' }, cap: [capCols[i]], face: { eyeColor: eye }, scale: KID }));
  C.adults = [C.QUI, C.MER, C.PROF, C.DIR, C.COACH];
  C.all = [C.N, C.G, C.Gs, C.B, C.BG, C.POP, ...C.adults, ...C.kids];
  for (const c of C.all) { c.baseScale = C.adults.includes(c) ? ADULT : KID; c.reset(); } return C; }
