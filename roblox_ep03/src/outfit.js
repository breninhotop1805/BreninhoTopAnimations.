// ======================= CLASSIC ROBLOX CLOTHING baked into the official R15 texture atlas =======================
// The official meshes (exported from Roblox Studio) carry the R15 composited-texture UVs (torso top-left, arms top-right,
// legs bottom-right). We rasterise every triangle of every part in UV space and colour each texel from its REST-POSE 3D
// position + normal with a clothing "pattern" (tee, plaid, stripes, jersey with number, hoodie, suit, pajama, prison…),
// exactly like a classic Shirt/Pants template is composited by Roblox. One 1024² texture per character, shared by all parts.
import * as THREE from 'three';
const hex = h => { const c = new THREE.Color(h); return [c.r * 255, c.g * 255, c.b * 255]; };
const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const sat = x => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function noise(x, y) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy; const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function starIn(px, py, R) { const k = Math.PI / 5; const a = Math.atan2(px, py); const r = Math.hypot(px, py); if (r > R) return false; const ri = R * 0.42;
  let m = ((a % (2 * k)) + 2 * k) % (2 * k); m = Math.abs(m - k); const t = k - m; const x1 = R, y1 = 0, x2 = ri * Math.cos(k), y2 = ri * Math.sin(k);
  const dx = x2 - x1, dy = y2 - y1; const den = Math.cos(t) * dy - Math.sin(t) * dx; return r <= (x1 * dy - y1 * dx) / den; }
// little canvas used for printed text/numbers (jersey number, prison ID), sampled by the front/back of the torso
function printCanvas(txt, fg, bg) { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d'); if (bg) { g.fillStyle = bg; g.fillRect(0, 0, 256, 256); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = 200; g.font = `bold ${fs}px Komikax, Arial Black, sans-serif`; while (g.measureText(txt).width > 230 && fs > 20) { fs -= 8; g.font = `bold ${fs}px Komikax, Arial Black, sans-serif`; }
  if (fg) { g.lineWidth = fs * 0.08; g.strokeStyle = 'rgba(0,0,0,0.35)'; g.strokeText(txt, 128, 136); } g.fillText(txt, 128, 136); return g.getImageData(0, 0, 256, 256); }
const sampleP = (I, u, v) => { if (u < 0 || v < 0 || u >= 1 || v >= 1) return null; const x = (u * 256) | 0, y = (v * 256) | 0, i = (y * 256 + x) * 4; return I.data[i + 3] > 20 ? [I.data[i], I.data[i + 1], I.data[i + 2], I.data[i + 3] / 255] : null; };

// o = { skin, top: { type, color, color2, accent, number, sleeves: 'short'|'long'|'none' }, bottom: { type, color, color2 }, shoes: { color, sole }, body }
export function makePattern(P, o) {
  const skin = hex(o.skin || '#f3c99a'); const top = o.top || {}; const bot = o.bottom || {}; const sh = o.shoes || {};
  const tc = hex(top.color || '#3a7ae8'), tc2 = hex(top.color2 || '#ffffff'), acc = hex(top.accent || '#ffffff');
  const bc = hex(bot.color || '#2a3a6a'), bc2 = hex(bot.color2 || '#ffffff'); const shc = hex(sh.color || '#f2f2f2'), sole = hex(sh.sole || '#ffffff');
  const W = Math.abs(P.LeftShoulderRig.x) || 0.9; const yW = P.WaistRig.y, yN = P.NeckRig.y, yH = P.RootRig.y; const yS = P.LeftShoulderRig.y, yWr = P.LeftWristRig.y;
  const yHip = P.LeftHipRig.y, yK = P.LeftKneeRig.y, yA = P.LeftAnkleRig.y;
  const sleeves = top.sleeves || ({ tee: 'short', jersey: 'short', prison: 'short', stripes: 'short', polo: 'short', tank: 'none', plain: 'long' })[top.type] || 'long';
  const num = top.number != null ? printCanvas(String(top.number), top.numberColor || '#ffffff') : null;
  const prisonId = top.type === 'prison' ? printCanvas(String(top.number || '4021'), '#151515', '#f2f2f2') : null;
  const shirtBottom = yW - (yW - yH) * (top.tucked ? 0.15 : 0.55);   // where the shirt hem sits on the lower torso
  const sleeveEnd = sleeves === 'short' ? 0.4 : sleeves === 'long' ? 1.02 : -1;  // 0 = shoulder .. 1 = wrist
  // ---- shirt fabric at a point of the torso/arms (fx, fy = fabric coords; front/back/side flags)
  function shirt(x, y, z, nx, ny, nz, arm) {
    let c = tc.slice(); const ty = (y - yW) / (yN - yW), tx = x / W; const front = nz > 0.55, back = nz < -0.55;
    const fx = arm ? (x + z * (nx > 0 ? 1 : -1)) : (Math.abs(nx) > 0.6 ? z : x);   // horizontal fabric coord
    switch (top.type) {
      case 'stripes': { const w = top.w || 0.16; if (Math.floor((y + 10) / w) % 2) c = tc2.slice(); break; }
      case 'plaid': { const w = top.w || 0.34; const a = ((fx + 10) / w) % 1, b = ((y + 10) / w) % 1; const ba = a < 0.38, bb = b < 0.38; const dark = mul(tc, 0.62);
        if (ba && bb) c = mixc(dark, tc2, 0.25); else if (ba || bb) c = mixc(tc, dark, 0.55);
        const fa = Math.abs(((fx + 10) / w) % 1 - 0.7) < 0.035, fb = Math.abs(((y + 10) / w) % 1 - 0.7) < 0.035; if (fa || fb) c = mixc(c, tc2, 0.55); break; }
      case 'jersey': { if (arm ? false : Math.abs(nx) > 0.6) c = tc2.slice(); if (arm) { const s = (yS - y) / (yS - yWr); if (s > 0.28 && s < 0.36) c = tc2.slice(); }
        if (!arm && ty > 0.9 && Math.abs(tx) < 0.45 && front) c = tc2.slice(); break; }
      case 'pajama': { const g = 0.36; const cx = Math.round(fx / g) * g, cy = Math.round(y / g) * g; const off = (Math.round(y / g) % 2) * g * 0.5;
        if (starIn(fx - cx - off * 0 , y - cy, 0.085) || starIn(fx - cx - g * 0.5, y - cy - g * 0.5, 0.06)) c = tc2.slice(); break; }
      case 'prison': break;
      case 'hoodie': { if (top.fade) c = mixc(tc, tc2, sstep(0.9, -0.2, ty)); break; }
      case 'sweater': { if (((fx * 40) % 1) < 0.22) c = mul(c, 0.94); break; }
      case 'camo': { const n = noise(fx * 2.2 + 3, y * 2.2) + 0.5 * noise(fx * 5, y * 5); const cols = [tc, tc2, acc, mul(tc, 0.6)]; c = cols[Math.min(3, Math.floor(n * 2.7))].slice(); break; }
      case 'military': { if (!arm && front && ty > 0.45 && ty < 0.72 && Math.abs(Math.abs(tx) - 0.42) < 0.2) { c = mul(tc, 0.88); if (Math.abs(ty - 0.71) < 0.02) c = mul(tc, 0.7); } break; }
      default: break;
    }
    if (!arm) {
      // collars / fronts per type
      if (front && (top.type === 'tee' || top.type === 'stripes' || top.type === 'jersey' || top.type === 'sweater')) {
        const yc = 0.985 - 0.14 * (1 - Math.min(1, (tx / 0.36) ** 2)); if (Math.abs(tx) < 0.36 && Math.abs(ty - yc) < 0.025) c = mixc(c, top.type === 'jersey' ? tc2 : mul(tc, 0.75), 0.9); }
      if (top.type === 'prison' && front) { const vd = 0.98 - ty; if (Math.abs(tx) < vd * 0.55 && ty > 0.72) c = mul(tc, 0.78); if (Math.abs(Math.abs(tx) - (0.98 - ty) * 0.55) < 0.03 && ty > 0.72) c = mul(tc, 0.6);
        const s = sampleP(prisonId, (tx - 0.12) / 0.5, (0.74 - ty) / 0.25 * 1.0); if (s) c = mixc(c, s, s[3]); }
      if (top.type === 'suit' || top.type === 'jacket' || top.type === 'military') {
        const inner = hex(top.inner || '#f4f4f4'); const vw = top.type === 'jacket' ? 0.24 : (ty > 0.4 ? (ty - 0.4) * 0.62 + 0.03 : 0.0);
        if (front && Math.abs(tx) < vw && top.type !== 'military') { c = inner.slice(); if (top.tie && top.type === 'suit' && Math.abs(tx) < 0.075 + (ty < 0.85 ? 0.02 : 0) && ty > 0.2) c = hex(top.tie); }
        if (front && top.type !== 'military' && Math.abs(Math.abs(tx) - vw) < 0.03 && ty > 0.35) c = mul(tc, 0.72);
        if (front && top.type === 'suit') { for (const by of [0.3, 0.15]) if (Math.hypot(tx - 0.0, ty - by) < 0.035 && Math.abs(tx) >= vw) c = mul(tc, 0.55); if (tx > 0.38 && tx < 0.68 && Math.abs(ty - 0.62) < 0.022) c = mul(tc, 0.7); }
        if (front && top.type === 'military') { if (Math.abs(tx) < 0.02) c = mul(tc, 0.7); for (const by of [0.85, 0.65, 0.45, 0.25]) if (Math.hypot(tx, ty - by) < 0.03) c = hex('#e0c060'); if (top.badge && Math.hypot(tx + 0.45, ty - 0.78) < 0.07) c = hex('#f0d040'); }
        if (top.type === 'jacket' && front && Math.abs(Math.abs(tx) - vw) < 0.018) c = hex('#c8c8c8');
      }
      if (top.type === 'hoodie' && front) { if (ty > 0.06 && ty < 0.38 && Math.abs(tx) < 0.5 - (ty - 0.06) * 0.35) { c = mul(c, 0.93); if (Math.abs(Math.abs(tx) - (0.5 - (ty - 0.06) * 0.35)) < 0.025 || Math.abs(ty - 0.375) < 0.012) c = mul(c, 0.75); }
        for (const sx of [-0.13, 0.13]) if (Math.abs(tx - sx) < 0.022 && ty > 0.66 && ty < 0.97) c = hex(top.strings || '#f2f2f2'); }
      if (top.type === 'hoodie' && back && ty > 0.72) { c = mul(c, 0.86); if (Math.abs(ty - 0.725) < 0.02) c = mul(c, 0.8); }
      if (top.type === 'polo' && front) { if (Math.abs(tx) < 0.1 && ty > 0.68) c = mul(tc, 0.85); for (const by of [0.9, 0.78]) if (Math.hypot(tx, ty - by) < 0.025) c = hex('#ffffff'); }
      if (top.type === 'pajama' && front) { if (Math.abs(tx) < 0.02 + (ty > 0.75 ? (ty - 0.75) * 0.6 : 0) && ty > 0.05) c = mul(tc, 0.75); for (const by of [0.7, 0.5, 0.3, 0.1]) if (Math.hypot(tx + 0.07, ty - by) < 0.03) c = tc2.slice(); }
      if (num && (back || (front && top.type === 'jersey'))) { const sc = back ? 0.9 : 0.42; const s = sampleP(num, 0.5 + tx / (sc * 1.2) * (back ? -1 : 1), 0.5 - (ty - (back ? 0.5 : 0.62)) / (sc * 0.95)); if (s) c = mixc(c, s, s[3]); }
      if (top.print === 'star' && front) { if (starIn(tx * W * (nz > 0 ? 1 : -1), (ty - 0.55) * (yN - yW), 0.32)) c = hex(top.printColor || '#ffd040'); }
      if (top.print === 'heart' && front) { const px = tx * 1.6, py = (ty - 0.55) * 2.1; const q = px * px + (py - Math.sqrt(Math.abs(px)) * 0.8) ** 2; if (q < 0.14) c = hex(top.printColor || '#ff4a7a'); }
      if (top.print === 'circle' && front) { const r = Math.hypot(tx * W, (ty - 0.55) * (yN - yW)); if (r < 0.3) c = hex(top.printColor || '#ffd040'); if (Math.abs(r - 0.3) < 0.03) c = mul(hex(top.printColor || '#ffd040'), 0.7); }
      // shoulder seam + soft fabric shading: darker toward the sides and the hem, lighter on the chest
      if (ty > 0.97) c = mul(c, 0.92);
      const side = Math.abs(nx); c = mul(c, 1.0 - side * 0.06 + (front ? 0.02 : 0) - sstep(0.25, -0.4, ty) * 0.06);
      if (front) { const f1 = Math.abs((tx * 0.8 + ty * 1.4 + 0.2) % 0.5 - 0.25); if (ty < 0.35 && f1 < 0.012) c = mul(c, 0.9); }
    } else {
      const s = (yS - y) / (yS - yWr); if (sleeves === 'long' && s > 0.9 && s < 1.02) c = mul(c, top.type === 'hoodie' || top.type === 'sweater' ? 0.85 : 0.9);
      if (sleeves === 'short' && s > sleeveEnd - 0.06) c = mul(c, 0.86);
      c = mul(c, 1.0 - Math.max(0, -nx * (x > 0 ? 1 : -1)) * 0.06);   // inner side of the arm a bit darker
    }
    return c;
  }
  function pants(x, y, z, nx, ny, nz, leg) {
    let c = bc.slice(); const t = bot.type || 'jeans';
    if (t === 'jeans') { c = mul(c, 0.94 + 0.12 * noise(x * 30 + z * 30, y * 6)); }
    if (t === 'pajama') { const g = 0.36; const fx = Math.abs(nx) > 0.6 ? z : x; const cx = Math.round(fx / g) * g, cy = Math.round(y / g) * g; if (starIn(fx - cx, y - cy, 0.08)) c = bc2.slice(); }
    if (t === 'plaid') { const w = 0.34; const fx = Math.abs(nx) > 0.6 ? z : x; const a = ((fx + 10) / w) % 1, b = ((y + 10) / w) % 1; const dark = mul(bc, 0.62); if (a < 0.38 && b < 0.38) c = mixc(dark, bc2, 0.25); else if (a < 0.38 || b < 0.38) c = mixc(bc, dark, 0.55); }
    if (t === 'track' && leg && Math.abs(nx) > 0.55 && Math.abs(z) < 0.07) c = bc2.slice();
    if (leg) {
      const l = (yHip - y) / (yHip - yA);
      if (t === 'shorts' && l > 0.46) return skinAt(nx, nz);
      if (t === 'shorts' && l > 0.42) c = mul(c, 0.82);
      if (t === 'skirt' && l > 0.12) return skinAt(nx, nz);
      if (t === 'jeans' || t === 'pants') { if (Math.abs(nx) > 0.62 && Math.abs(z) < 0.025) c = mul(c, 0.72); if (l > 0.93) c = mul(c, 0.86); const kn = Math.abs(l - 0.52); if (kn < 0.06 && nz > 0.3) c = mul(c, 0.93 + kn); }
      if (t === 'pants' && nz > 0.5 && Math.abs(x - (x > 0 ? 1 : -1) * Math.abs(P.LeftHipRig.x)) < 0.015) c = mul(c, 0.82);
    } else {
      const top0 = shirtBottom; if (y > top0) return null;   // shirt covers above
      if (y > top0 - 0.1) { const belt = bot.belt || (t === 'jeans' ? '#3a2a1a' : t === 'pants' ? '#222222' : null); c = belt ? hex(belt) : mul(c, 0.85); if (belt && bot.buckle !== false && nz > 0.6 && Math.abs(x) < 0.09) c = hex('#d8c070'); }
      if (t === 'jeans' && nz > 0.6 && y < top0 - 0.1) { const px = Math.abs(x) - 0.42, py = top0 - 0.1 - y; if (Math.abs(Math.hypot(px, py) - 0.22) < 0.018 && px < 0) c = mul(c, 0.75); if (Math.abs(x) < 0.015) c = mul(c, 0.75); }
    }
    return c;
  }
  function skinAt(nx, nz) { return mul(skin, 1 - Math.abs(nx) * 0.04); }
  function shoe(x, y, z, nx, ny, nz) { let c = shc.slice(); if (y < 0.085) return sole.slice(); if (y < 0.11) return mul(sole, 0.85);
    if (sh.type !== 'boot' && nz > 0.2 && ny > 0.3 && Math.abs(((z * 18) % 1)) < 0.2) c = hex(sh.laces || '#f8f8f8');
    if (sh.stripe && Math.abs(nx) > 0.6 && Math.abs(y - 0.2) < 0.035) c = hex(sh.stripe);
    if (z > 0 && nz > 0.6 && y < 0.2) c = mixc(c, sole, sh.toecap ? 0.85 : 0); return c; }
  return (part, x, y, z, nx, ny, nz) => {
    if (/Hand/.test(part)) return o.gloves ? hex(o.gloves) : skinAt(nx, nz);
    if (/Foot/.test(part)) return shoe(x, y, z, nx, ny, nz);
    if (/Arm/.test(part)) { const s = (yS - y) / (yS - yWr); if (s > sleeveEnd) return skinAt(nx, nz); return shirt(x, y, z, nx, ny, nz, true); }
    if (/Leg/.test(part)) return pants(x, y, z, nx, ny, nz, true);
    if (part === 'LowerTorso') { const p = pants(x, y, z, nx, ny, nz, false); if (p) return p; return shirt(x, y, z, nx, ny, nz, false); }
    return shirt(x, y, z, nx, ny, nz, false);
  };
}
// rasterise all parts into the atlas
export function bakeOutfit(parts, P, o, S = 1024) {
  const pat = makePattern(P, o); const cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
  const img = g.createImageData(S, S); const D = img.data; const filled = new Uint8Array(S * S); const sk = hex(o.skin || '#f3c99a');
  for (let i = 0; i < S * S; i++) { D[i * 4] = sk[0]; D[i * 4 + 1] = sk[1]; D[i * 4 + 2] = sk[2]; D[i * 4 + 3] = 255; }
  for (const [name, geo] of Object.entries(parts)) { const pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv; if (!uv) continue; const ix = geo.index; const n = ix ? ix.count : pos.count;
    for (let t = 0; t < n; t += 3) { const id = [0, 1, 2].map(k => ix ? ix.getX(t + k) : t + k);
      const U = id.map(i => uv.getX(i) * S), V = id.map(i => uv.getY(i) * S);
      const x0 = Math.max(0, Math.floor(Math.min(...U) - 1)), x1 = Math.min(S - 1, Math.ceil(Math.max(...U) + 1)), y0 = Math.max(0, Math.floor(Math.min(...V) - 1)), y1 = Math.min(S - 1, Math.ceil(Math.max(...V) + 1));
      const den = (V[1] - V[2]) * (U[0] - U[2]) + (U[2] - U[1]) * (V[0] - V[2]); if (Math.abs(den) < 1e-9) continue;
      for (let py = y0; py <= y1; py++) for (let px = x0; px <= x1; px++) { const cx = px + 0.5, cy = py + 0.5;
        const w0 = ((V[1] - V[2]) * (cx - U[2]) + (U[2] - U[1]) * (cy - V[2])) / den, w1 = ((V[2] - V[0]) * (cx - U[2]) + (U[0] - U[2]) * (cy - V[2])) / den, w2 = 1 - w0 - w1;
        if (w0 < -0.02 || w1 < -0.02 || w2 < -0.02) continue; const W3 = [w0, w1, w2];
        let X = 0, Y = 0, Z = 0, NX = 0, NY = 0, NZ = 0; for (let k = 0; k < 3; k++) { X += pos.getX(id[k]) * W3[k]; Y += pos.getY(id[k]) * W3[k]; Z += pos.getZ(id[k]) * W3[k]; NX += nor.getX(id[k]) * W3[k]; NY += nor.getY(id[k]) * W3[k]; NZ += nor.getZ(id[k]) * W3[k]; }
        const nl = Math.hypot(NX, NY, NZ) || 1; const col = pat(name, X, Y, Z, NX / nl, NY / nl, NZ / nl); const o4 = (py * S + px) * 4;
        D[o4] = Math.max(0, Math.min(255, col[0])); D[o4 + 1] = Math.max(0, Math.min(255, col[1])); D[o4 + 2] = Math.max(0, Math.min(255, col[2])); filled[py * S + px] = 1; } } }
  for (let pass = 0; pass < 6; pass++) { const nf = filled.slice(); for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) { const i = y * S + x; if (filled[i]) continue;
      for (const j of [i - 1, i + 1, i - S, i + S]) if (filled[j]) { D[i * 4] = D[j * 4]; D[i * 4 + 1] = D[j * 4 + 1]; D[i * 4 + 2] = D[j * 4 + 2]; nf[i] = 1; break; } } filled.set(nf); }
  g.putImageData(img, 0, 0); const tex = new THREE.CanvasTexture(cv); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true; return tex; }
