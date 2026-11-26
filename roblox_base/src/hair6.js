// ======================= HAIR v6 — Roblox-style hair as ONE SMOOTH VOLUME (no loose locks) =======================
// The hair is a single closed shell that hugs the head (offset of the classic head profile) with a designed outline:
// hairline/fringe in front (soft scallops, never spikes), ears at the sides, nape or long panels at the back.
// Lock divisions and strands are PAINTED in the texture (like Roblox catalog hair), not modelled as separate pieces.
import * as THREE from 'three';
const HT = 1.27, R = 0.62, E = 0.28;
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
const TEX = new Map();
function hairTex(n = 18) { if (TEX.has(n)) return TEX.get(n); const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 1024, 512);
  let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 420; i++) { const x = r() * 1024; g.strokeStyle = `rgba(0,0,0,${0.03 + r() * 0.05})`; g.lineWidth = 0.8 + r() * 1.6; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 10, 170, x + (r() - 0.5) * 10, 340, x + (r() - 0.5) * 8, 512); g.stroke(); }
  for (let k = 0; k < n; k++) { const x = (k + 0.5) / n * 1024 + (r() - 0.5) * 12; const gr = g.createLinearGradient(x - 22, 0, x + 22, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 22, 0, 44, 512);
    const hl = g.createLinearGradient(x + 14, 0, x + 50, 0); hl.addColorStop(0, 'rgba(255,255,255,0)'); hl.addColorStop(0.5, 'rgba(255,255,255,0.10)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = hl; g.fillRect(x + 14, 0, 36, 512); }
  const vg = g.createLinearGradient(0, 0, 0, 512); vg.addColorStop(0, 'rgba(0,0,0,0.16)'); vg.addColorStop(0.18, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.04)'); g.fillStyle = vg; g.fillRect(0, 0, 1024, 512);
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; TEX.set(n, t); return t; }
const MAT = new Map();
export function hairMat6(col, n = 18) { const k = col + n; if (!MAT.has(k)) MAT.set(k, new THREE.MeshPhysicalMaterial({ color: col, map: hairTex(n), roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.45, side: THREE.DoubleSide })); return MAT.get(k); }
// torso clearance for anything hanging below the neck (head space: neck ≈ y 0)
const torsoR = th => 1 / Math.sqrt((Math.sin(th) / 1.0) ** 2 + (Math.cos(th) / 0.62) ** 2) + 0.08;
// outer profile point at arc parameter s (0 = top centre) for thickness T; returns [r, y]
function prof(s, T, th, flare, yLow) { const a = R - E, top = HT + T, rc = E + T; const L1 = a, L2 = Math.PI / 2 * rc;
  if (s <= L1) return [s, top]; if (s <= L1 + L2) { const ang = (s - L1) / rc; return [a + Math.sin(ang) * rc, (HT - E) + Math.cos(ang) * rc]; }
  const d = s - L1 - L2; const y = HT - E - d; let r = R + T; if (y < 0.15) { const k = Math.min(1, (0.15 - y) / 0.5); r = Math.max(r, (R + T) * (1 - sm(0, 1, k)) + torsoR(th) * sm(0, 1, k)) + flare * Math.max(0, 0.15 - y) * 0.25; } return [r, y]; }
const sOfY = (y, T) => { const L1 = R - E, L2 = Math.PI / 2 * (E + T); if (y >= HT - E) { const ang = Math.acos(Math.min(1, Math.max(-1, (y - (HT - E)) / (E + T)))); return L1 + ang * (E + T); } return L1 + L2 + (HT - E - y); };
// o: { T thickness, yb(th) -> bottom y of the outline, puff(th, s) extra volume, flare, n (lock grooves), panel (thickness of hanging parts) }
export function shell(o) { const NU = 128, NV = 48, T = o.T ?? 0.1; const pos = [], uv = [], idx = []; const flare = o.flare || 0;
  const cols = []; for (let i = 0; i <= NU; i++) { const th = -Math.PI + i / NU * Math.PI * 2; cols.push({ th, smax: sOfY(o.yb(th), T) }); }
  const P = (c, v, inner) => { const s = c.smax * v; const [r0, y] = prof(s, T, c.th, flare, 0); let r = r0 + (o.puff ? o.puff(c.th, s, y) : 0);
    if (o.relief && !inner) { const f = ((wrapA(c.th) + Math.PI) / (Math.PI * 2) * o.locks) % 1; r += o.relief * Math.pow(Math.sin(Math.PI * f), 0.7) * sm(0.15, 0.7, s); }
    if (inner) { const hang = y < 0.25; r = hang ? r - (o.panel ?? 0.13) : Math.max(0.05, r - T - (o.puff ? o.puff(c.th, s, y) : 0) + 0.01); }
    const ly = (!inner && o.liftY) ? o.liftY(c.th, s) : 0;
    const ws = o.sweep ? o.sweep * Math.min(1, s / 0.9) : 0; const th = c.th + ws * (Math.abs(wrapA(c.th)) < 1.3 ? 1 : 0); return [Math.sin(th) * r, y + ly, Math.cos(th) * r, s]; };
  for (const inner of [false, true]) for (let j = 0; j <= NV; j++) for (const [i, c] of cols.entries()) { const v = j / NV; const p = P(c, v, inner); pos.push(p[0], p[1], p[2]); uv.push(i / NU, p[3] / 3.2); }
  const id = (k, i, j) => k * (NV + 1) * (NU + 1) + j * (NU + 1) + i;
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = id(0, i, j), b = id(0, i + 1, j), c = id(0, i, j + 1), d = id(0, i + 1, j + 1); idx.push(a, b, c, b, d, c);
    const a2 = id(1, i, j), b2 = id(1, i + 1, j), c2 = id(1, i, j + 1), d2 = id(1, i + 1, j + 1); idx.push(a2, c2, b2, b2, c2, d2); }
  for (let i = 0; i < NU; i++) { const a = id(0, i, NV), b = id(0, i + 1, NV), c = id(1, i, NV), d = id(1, i + 1, NV); idx.push(a, b, c, b, d, c); }   // rim
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; }
// smooth tapered capsule (ponytail, buns' tails)
export function tail(pts, r0, r1) { const curve = new THREE.CatmullRomCurve3(pts); const N = 40, Rn = 24; const pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) { const s = i / N; const p = curve.getPoint(s), Tn = curve.getTangent(s).normalize(); let n = new THREE.Vector3(1, 0, 0); if (Math.abs(Tn.x) > 0.9) n.set(0, 0, 1); const b = new THREE.Vector3().crossVectors(Tn, n).normalize(); n.crossVectors(b, Tn).normalize();
    const w = (r0 + (r1 - r0) * s) * Math.sqrt(Math.max(0, Math.sin(Math.min(1, s * 6) * Math.PI / 2))) * (s > 0.85 ? Math.max(0.15, 1 - (s - 0.85) / 0.15 * 0.85) : 1);
    for (let j = 0; j <= Rn; j++) { const a = j / Rn * Math.PI * 2; const q = p.clone().addScaledVector(n, Math.cos(a) * w).addScaledVector(b, Math.sin(a) * w * 0.85); pos.push(q.x, q.y, q.z); uv.push(j / Rn, s); } }
  for (let i = 0; i < N; i++) for (let j = 0; j < Rn; j++) { const a = i * (Rn + 1) + j, bb = a + 1, c = a + Rn + 1, d = c + 1; idx.push(a, c, bb, bb, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; }
const add = (g, geo, m) => { const me = new THREE.Mesh(geo, m); me.castShadow = true; me.receiveShadow = true; g.add(me); return me; };
// outline helpers: front (|th|<f) / sides / back with smooth blends; soft scallops on the fringe
const lerpA = (th, f, yF, yS, yB) => { const a = Math.abs(wrapA(th)); if (a < f) return yF; if (a < Math.PI / 2) return yF + (yS - yF) * sm(f, Math.PI / 2, a); return yS + (yB - yS) * sm(Math.PI / 2, Math.PI * 0.8, a); };
const scallop = (th, f, n, d, off = 0) => { const a = wrapA(th); if (Math.abs(a) > f) return 0; const w = 1 - sm(f * 0.75, f, Math.abs(a)); return d * (0.5 - 0.5 * Math.cos((a + off) * n)) * w; };
export const HAIR6 = {
  // short neat boy hair: soft side-swept fringe, covers the top of the ears, short nape
  boy: (g, col, c2, o = {}) => { add(g, shell({ T: 0.1, n: 16, sweep: 0.12, relief: 0.035, locks: 22, yb: th => lerpA(th, 0.55, 1.03, 0.6, 0.36) - scallop(th, 0.62, 9, 0.085, 0.2) - 0.03 * Math.max(0, Math.sin(th * 11)), puff: (th, s, y) => 0.06 * Math.exp(-((s - 0.55) ** 2) / 0.12) * (Math.cos(th) * 0.5 + 0.5) }), hairMat6(col, 16)); },
  // ---- more boy shapes (same clean method: one smooth volume + light 3D relief) ----
  // quiff / topete: short sides, front swept UP with volume
  quiff: (g, col, c2, o = {}) => { add(g, shell({ T: 0.08, n: 16, relief: 0.03, locks: 20, sweep: -0.05, yb: th => lerpA(th, 0.55, 1.12, 0.68, 0.42) - scallop(th, 0.5, 7, 0.04),
    liftY: (th, s) => 0.32 * Math.exp(-((s - 0.42) ** 2) / 0.05) * Math.max(0, Math.cos(th)) ** 3, puff: (th, s, y) => 0.12 * Math.exp(-((s - 0.5) ** 2) / 0.05) * Math.max(0, Math.cos(th)) ** 3 + 0.04 * Math.exp(-((s - 0.5) ** 2) / 0.2) }), hairMat6(col, 16)); },
  // curtains / middle part: fringe parted in the middle falling to both sides, covers the ears
  curtains: (g, col, c2, o = {}) => { add(g, shell({ T: 0.1, n: 18, relief: 0.03, locks: 22, yb: th => { const a = Math.abs(wrapA(th)); return (a < 0.6 ? 1.12 - 0.2 * sm(0.0, 0.6, a) : lerpA(th, 0.6, 0.92, 0.5, 0.34)) - 0.025 * Math.max(0, Math.sin(th * 13)); },
    puff: (th, s, y) => 0.05 * Math.exp(-((s - 0.55) ** 2) / 0.12) }), hairMat6(col, 18)); },
  // buzz cut: very short, hugs the head, clean hairline
  buzz: (g, col, c2, o = {}) => { add(g, shell({ T: 0.035, n: 30, yb: th => lerpA(th, 0.55, 1.1, 0.72, 0.42) }), hairMat6(col, 30)); },
  // messy (tidy): longer, soft wavy outline at the nape and fringe, more volume and relief
  messy: (g, col, c2, o = {}) => { add(g, shell({ T: 0.11, n: 16, relief: 0.05, locks: 18, sweep: 0.2, yb: th => lerpA(th, 0.55, 0.98, 0.5, 0.26) - 0.07 * Math.max(0, Math.sin(th * 9 + 0.5)) - scallop(th, 0.6, 8, 0.06),
    puff: (th, s, y) => 0.08 * Math.exp(-((s - 0.5) ** 2) / 0.15) }), hairMat6(col, 16)); },
  // soft spiky: a few rounded peaks on top (not horns)
  spiky: (g, col, c2, o = {}) => { add(g, shell({ T: 0.09, n: 14, relief: 0.04, locks: 14, yb: th => lerpA(th, 0.55, 1.04, 0.62, 0.38) - scallop(th, 0.6, 8, 0.08),
    liftY: (th, s) => 0.22 * Math.pow(Math.max(0, Math.sin(th * 3.5 + 0.6)), 4) * Math.exp(-((s - 0.2) ** 2) / 0.05), puff: (th, s, y) => 0.05 * Math.exp(-((s - 0.5) ** 2) / 0.15) }), hairMat6(col, 14)); },
  // shoulder-length (surfer): center-ish part, ends above the shoulders, rounded
  surfer: (g, col, c2, o = {}) => { add(g, shell({ T: 0.1, n: 20, relief: 0.035, locks: 24, sweep: 0.08, yb: th => { const a = Math.abs(wrapA(th)); return (a < 0.55 ? 1.0 - 0.12 * sm(0, 0.55, a) : lerpA(th, 0.55, 0.88, 0.12, 0.02)) - 0.04 * Math.max(0, Math.sin(th * 15)); },
    puff: (th, s, y) => 0.05 * Math.exp(-((s - 0.6) ** 2) / 0.2) }), hairMat6(col, 20)); },
  // curly / afro: rounded curl bumps all over a fuller volume
  curly: (g, col, c2, o = {}) => { add(g, shell({ T: 0.18, n: 1, yb: th => lerpA(th, 0.55, 1.06, 0.62, 0.36),
    puff: (th, s, y) => 0.06 * Math.max(0, Math.sin(th * 9) * Math.sin(s * 11)) + 0.08 * Math.exp(-((s - 0.5) ** 2) / 0.2) }), hairMat6(col, 1)); },
  // long straight girl hair: straight soft bangs, face open, panels over the chest + long back; sides stop at the shoulders
  long: (g, col, c2, o = {}) => { const yEnd = o.yEnd ?? -1.6;
    const yb = th => { const a = Math.abs(wrapA(th)); let y; if (a < 0.5) y = 0.92 - scallop(th, 0.5, 11, 0.045); else if (a < 0.62) y = 0.92 + (yEnd + 0.5 - 0.92) * sm(0.5, 0.62, a); else if (a < 1.15) y = yEnd + 0.5; else if (a < 1.3) y = (yEnd + 0.5) + (0.3 - (yEnd + 0.5)) * sm(1.15, 1.3, a); else if (a < 1.95) y = 0.3; else if (a < 2.15) y = 0.3 + (yEnd - 0.3) * sm(1.95, 2.15, a); else y = yEnd; return y - 0.04 * Math.sin(a * 23) * (y < 0 ? 1 : 0); };
    add(g, shell({ T: 0.1, n: 22, yb, flare: 0.25, panel: 0.14, puff: (th, s, y) => 0.04 * Math.exp(-((s - 0.6) ** 2) / 0.15) }), hairMat6(col, 22)); },
  // ponytail: neat cap (fringe swept), smooth ponytail with a tie at the back of the head
  ponytail: (g, col, c2, o = {}) => { add(g, shell({ T: 0.08, n: 18, sweep: -0.1, yb: th => lerpA(th, 0.55, 0.98, 0.55, 0.42) - scallop(th, 0.6, 8, 0.06, -0.2), puff: (th, s, y) => 0.04 * Math.exp(-((s - 0.5) ** 2) / 0.1) * (Math.cos(th) * 0.5 + 0.5) }), hairMat6(col, 18));
    const root = new THREE.Vector3(0, 1.08, -0.74); add(g, tail([root, root.clone().add(new THREE.Vector3(0, 0.05, -0.22)), root.clone().add(new THREE.Vector3(0, -0.35, -0.42)), root.clone().add(new THREE.Vector3(0, -0.95, -0.38)), root.clone().add(new THREE.Vector3(0, -1.35, -0.28))], 0.2, 0.12), hairMat6(col, 10));
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.055, 12, 24), new THREE.MeshStandardMaterial({ color: o.tieCol || '#ff4a8a', roughness: 0.4 })); tie.position.copy(root).add(new THREE.Vector3(0, 0.03, -0.12)); tie.rotation.x = Math.PI / 2 - 0.4; g.add(tie); },
};
