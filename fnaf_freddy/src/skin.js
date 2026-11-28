// Minecraft-style character rig built from a standard skin layout (64x64 or HD 128x128).
// Units: 1 skin "pixel unit" (1/64 of the skin width) = 1/16 world unit. A character is 2 units tall.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const U = 1 / 16;

export function loadImage(url) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
}

export function imgToCanvas(img) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0); return c;
}

export function pixelTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 1;
  return t;
}

// Is the skin a slim (3px arm) model? classic arms paint the back face column (x 52..56) of the right arm.
export function detectSlim(canvas) {
  const s = canvas.width / 64, g = canvas.getContext('2d');
  const d = g.getImageData(Math.floor(54.5 * s), 20 * s, Math.ceil(1.5 * s), 12 * s).data;
  let opaque = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 128) opaque++;
  const total = d.length / 4;
  // also treat solid black filler (Bonnie skin) as unused
  let black = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128 && d[i] < 8 && d[i + 1] < 8 && d[i + 2] < 8) black++;
  return opaque < total * 0.3 || black > total * 0.8;
}

// Build a box geometry with Minecraft skin UVs. (u,v) is the texture origin in 64-units.
function skinBox(w, h, d, u, v, inflate = 0, texScale = 64, bottomFlip = true) {
  const g = new THREE.BoxGeometry((w + inflate * 2) * U, (h + inflate * 2) * U, (d + inflate * 2) * U);
  const S = texScale;
  const rects = [
    [u + d + w, v + d, d, h], // +x  left side of character
    [u, v + d, d, h],         // -x  right side
    [u + d, v, w, d],         // +y  top
    [u + d + w, v, w, d],     // -y  bottom
    [u + d, v + d, w, h],     // +z  front
    [u + 2 * d + w, v + d, w, h], // -z back
  ];
  const uv = g.attributes.uv; const e = 0.02; // tiny inset (in skin units) to avoid texel bleeding
  for (let f = 0; f < 6; f++) {
    let [x, y, rw, rh] = rects[f];
    let u0 = (x + e) / S, u1 = (x + rw - e) / S, vTop = 1 - (y + e) / S, vBot = 1 - (y + rh - e) / S;
    if (f === 3 && bottomFlip) [vTop, vBot] = [vBot, vTop];
    const o = f * 4;
    uv.setXY(o + 0, u0, vTop); uv.setXY(o + 1, u1, vTop); uv.setXY(o + 2, u0, vBot); uv.setXY(o + 3, u1, vBot);
  }
  uv.needsUpdate = true;
  return g;
}

// Voxel-extrude opaque pixels of a canvas region into a merged mesh (like Minecraft held items).
export function extrudePixels(canvas, sx, sy, sw, sh, pxSize, depth, opts = {}) {
  const g = canvas.getContext('2d'); const d = g.getImageData(sx, sy, sw, sh).data;
  const geos = []; const col = new THREE.Color();
  const filter = opts.filter || (() => true);
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    const i = (y * sw + x) * 4; if (d[i + 3] < 128) continue;
    if (!filter(d[i], d[i + 1], d[i + 2], x, y)) continue;
    const b = new THREE.BoxGeometry(pxSize, pxSize, depth);
    b.translate((x - sw / 2 + 0.5) * pxSize, (sh / 2 - y - 0.5) * pxSize, 0);
    col.setRGB(d[i] / 255, d[i + 1] / 255, d[i + 2] / 255, THREE.SRGBColorSpace);
    const n = b.attributes.position.count; const c = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) { c[k * 3] = col.r; c[k * 3 + 1] = col.g; c[k * 3 + 2] = col.b; }
    b.setAttribute('color', new THREE.BufferAttribute(c, 3)); b.deleteAttribute('uv');
    geos.push(b);
  }
  if (!geos.length) return new THREE.Group();
  const m = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0 }));
  m.castShadow = true; m.receiveShadow = true; return m;
}

// Box made of colored voxels from a tiny pixel-art description (array of strings + palette).
export function voxelArt(rows, palette, px, depth) {
  const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length;
  const g = c.getContext('2d');
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (palette[ch]) { g.fillStyle = palette[ch]; g.fillRect(x, y, 1, 1); } }));
  return extrudePixels(c, 0, 0, c.width, c.height, px, depth);
}

function solidBox(w, h, d, color, rough = 0.8) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w * U, h * U, d * U), new THREE.MeshStandardMaterial({ color, roughness: rough }));
  m.castShadow = true; m.receiveShadow = true; return m;
}

// Pixel-textured box (each face gets the same small canvas texture)
function texBox(w, h, d, canvas, rough = 0.8) {
  const t = pixelTexture(canvas);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w * U, h * U, d * U), new THREE.MeshStandardMaterial({ map: t, roughness: rough }));
  m.castShadow = true; m.receiveShadow = true; return m;
}

function eraseRect(canvas, x, y, w, h) { // in 64-units
  const s = canvas.width / 64; canvas.getContext('2d').clearRect(x * s, y * s, w * s, h * s);
}

function sampleColor(canvas, x, y) { // 64-units
  const s = canvas.width / 64; const d = canvas.getContext('2d').getImageData(Math.floor(x * s), Math.floor(y * s), 1, 1).data;
  return `rgb(${d[0]},${d[1]},${d[2]})`;
}

/**
 * Character rig. Hierarchy:
 * root (feet on ground, faces +z)
 *   hips (y=12)  -> legs pivots
 *   torso (y=12, rotates for lean) -> body, neck(head), shoulders(arms)
 */
export class Character {
  constructor(name, canvas, opts = {}) {
    this.name = name; this.opts = opts;
    this.root = new THREE.Group(); this.root.name = name;
    this.canvas = canvas;
    const slim = opts.slim ?? detectSlim(canvas);
    this.slim = slim;
    this.tex = pixelTexture(canvas);
    this.mat = new THREE.MeshStandardMaterial({ map: this.tex, roughness: 0.78, metalness: 0.0, alphaTest: 0.5 });
    this.matO = new THREE.MeshStandardMaterial({ map: this.tex, roughness: 0.78, metalness: 0.0, alphaTest: 0.5, side: THREE.DoubleSide });
    const M = (g, overlay) => { const m = new THREE.Mesh(g, overlay ? this.matO : this.mat); m.castShadow = true; m.receiveShadow = true; return m; };
    const aw = slim ? 3 : 4;

    // pelvis group: everything moves with it (bob)
    this.pelvis = new THREE.Group(); this.pelvis.position.y = 12 * U; this.root.add(this.pelvis);
    this.torso = new THREE.Group(); this.pelvis.add(this.torso);
    const body = M(skinBox(8, 12, 4, 16, 16)); body.position.y = 6 * U; this.torso.add(body);
    const bodyO = M(skinBox(8, 12, 4, 16, 32, 0.25), true); bodyO.position.y = 6 * U; this.torso.add(bodyO);

    this.neck = new THREE.Group(); this.neck.position.y = 12 * U; this.torso.add(this.neck);
    this.head = new THREE.Group(); this.neck.add(this.head);
    const hd = M(skinBox(8, 8, 8, 0, 0)); hd.position.y = 4 * U; this.head.add(hd);
    this.hat = M(skinBox(8, 8, 8, 32, 0, 0.5), true); this.hat.position.y = 4 * U; this.head.add(this.hat);
    this.headMesh = hd;

    // Arms: pivot at shoulder (y=22 world -> torso local 10), box spans y 12..24 => center 18 => offset -4 from pivot
    const ax = slim ? 5.5 : 6;
    this.armR = this._limb(M, aw, 40, 16, 40, 32, -ax + 0, 10, -4, this.torso, -1);
    this.armL = this._limb(M, aw, 32, 48, 48, 48, ax, 10, -4, this.torso, 1);
    // Legs: pivot at hip (pelvis local y=0), box spans 0..12 => center 6 => offset -6
    this.legR = this._limb(M, 4, 0, 16, 0, 32, -2, 0, -6, this.pelvis, -1);
    this.legL = this._limb(M, 4, 16, 48, 0, 48, 2, 0, -6, this.pelvis, 1);
    // nudge arm x so the arm's inner face touches the body exactly
    this.armR.piv.position.x = -(4 + aw / 2) * U; this.armL.piv.position.x = (4 + aw / 2) * U;

    // hand anchors (for holding items)
    this.handR = new THREE.Group(); this.handR.position.set(0, -10.5 * U, 0); this.armR.piv.add(this.handR);
    this.handL = new THREE.Group(); this.handL.position.set(0, -10.5 * U, 0); this.armL.piv.add(this.handL);

    // optional proportions (e.g. the tall, thin Puppet): stretch limbs/torso without touching the head
    const P = Object.assign({ leg: 1, arm: 1, torso: 1, limbW: 1 }, opts.prop || {}); if (P.legW === undefined) P.legW = P.limbW;
    this.hipY = 12 * P.leg * U;
    if (P.torso !== 1) { for (const m of [body, bodyO]) { m.scale.y = P.torso; m.position.y = 6 * P.torso * U; } this.neck.position.y = 12 * P.torso * U; }
    for (const L of [this.legR, this.legL]) L.piv.scale.set(P.legW, P.leg, P.legW);
    for (const A of [this.armR, this.armL]) { A.piv.scale.set(P.limbW, P.arm, P.limbW); A.piv.position.y = (12 * P.torso - 2) * U; }
    this.armR.piv.position.x = -(4 + aw * P.limbW / 2) * U; this.armL.piv.position.x = (4 + aw * P.limbW / 2) * U;
    this.body = body; this.bodyO = bodyO;

    this.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.pose = {}; this.reset();
  }

  _limb(M, w, u, v, uo, vo, px, py, off, parent) {
    const piv = new THREE.Group(); piv.position.set(px * U, py * U, 0); parent.add(piv);
    const a = M(skinBox(w, 12, 4, u, v)); a.position.y = off * U; piv.add(a);
    const o = M(skinBox(w, 12, 4, uo, vo, 0.25), true); o.position.y = off * U; piv.add(o);
    return { piv, a, o };
  }

  setSkin(canvas) { // swap texture keeping geometry (same layout); textures cached per canvas
    this._texCache = this._texCache || new Map([[this.canvas, this.tex]]);
    if (!this._texCache.has(canvas)) this._texCache.set(canvas, pixelTexture(canvas));
    const t = this._texCache.get(canvas); if (this.mat.map !== t) { this.mat.map = t; this.matO.map = t; }
  }

  reset() {
    for (const k of ['armR', 'armL', 'legR', 'legL']) this[k].piv.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0); this.torso.rotation.set(0, 0, 0); this.pelvis.position.y = this.hipY;
    this.pelvis.rotation.set(0, 0, 0);
  }

  // Idle breathing + tiny sway; t seconds; amt scales
  idle(t, amt = 1, seed = 0) {
    const s = Math.sin(t * 2.1 + seed), c = Math.sin(t * 1.3 + seed * 2);
    this.torso.rotation.x += 0.012 * s * amt;
    this.torso.rotation.z += 0.012 * c * amt;
    this.head.rotation.z += 0.025 * Math.sin(t * 1.1 + seed) * amt;
    this.head.rotation.x += 0.02 * Math.sin(t * 1.7 + seed) * amt;
    this.armR.piv.rotation.z += -0.035 - 0.02 * s * amt; this.armL.piv.rotation.z += 0.035 + 0.02 * s * amt;
    this.armR.piv.rotation.x += 0.03 * c * amt; this.armL.piv.rotation.x -= 0.03 * c * amt;
    this.pelvis.position.y += 0.004 * Math.sin(t * 4.2 + seed) * amt;
  }

  // Walk cycle: phase in cycles
  walk(phase, amt = 1, armAmt = 1) {
    const p = phase * Math.PI * 2, s = Math.sin(p);
    this.legR.piv.rotation.x += 0.55 * s * amt; this.legL.piv.rotation.x -= 0.55 * s * amt;
    this.armR.piv.rotation.x -= 0.5 * s * amt * armAmt; this.armL.piv.rotation.x += 0.5 * s * amt * armAmt;
    this.pelvis.position.y += Math.abs(Math.cos(p)) * 0.045 * amt - 0.02 * amt;
    this.torso.rotation.y += 0.06 * s * amt; this.head.rotation.y -= 0.05 * s * amt;
    this.torso.rotation.z += 0.025 * Math.cos(p) * amt;
  }
}

// ---------- Character-specific extras ----------

export function buildChica(beakCanvas, nobeakCanvas) {
  // Copy textures, remove the painted beak from the overlay so it can be a real 3D piece.
  const s = beakCanvas.width / 64;
  const A = imgCopy(beakCanvas), B = imgCopy(nobeakCanvas);
  const g = A.getContext('2d');
  const fx = 40 * s, fy = 8 * s, fw = 8 * s, fh = 8 * s;
  const d = g.getImageData(fx, fy, fw, fh).data;
  // beak = orange pixels (r high, g mid, b low)
  const isBeak = (r, gg, b) => r > 180 && gg > 60 && gg < 190 && b < 90;
  const beakCanvas2 = document.createElement('canvas'); beakCanvas2.width = fw; beakCanvas2.height = fh;
  const bg = beakCanvas2.getContext('2d'); const out = bg.createImageData(fw, fh);
  let minx = 99, maxx = -1, miny = 99, maxy = -1;
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const i = (y * fw + x) * 4;
    if (d[i + 3] > 128 && isBeak(d[i], d[i + 1], d[i + 2])) {
      out.data.set([d[i], d[i + 1], d[i + 2], 255], i);
      minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y);
    }
  }
  bg.putImageData(out, 0, 0);
  // clear beak pixels from overlay
  const od = g.getImageData(fx, fy, fw, fh);
  for (let i = 0; i < od.data.length; i += 4) if (od.data[i + 3] > 128 && isBeak(od.data[i], od.data[i + 1], od.data[i + 2])) od.data[i + 3] = 0;
  g.putImageData(od, fx, fy);

  for (const cv of [A, B]) eraseRect(cv, 16, 32, 24, 16);
  const ch = new Character('chica', A);
  ch.texA = A; ch.texB = B;
  // 3D beak: extruded pixels, 2 skin-units deep, sitting on the face
  const px = U / s; // one texture pixel in world units
  const beak = new THREE.Group();
  const upper = extrudePixels(beakCanvas2, 0, 0, fw, fh, px, 2.2 * U, {});
  beak.add(upper);
  beak.position.set(0, 4 * U, 4 * U + 1.1 * U);
  ch.head.add(beak);
  ch.beak = beak; ch.beakAttached = true;
  ch.beakHome = { parent: ch.head, pos: beak.position.clone() };
  ch.setBeak = (on) => { // on=true -> friendly face with beak attached
    ch.setSkin(on ? A : B);
  };
  ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return ch;
}

export function imgCopy(c) { const n = document.createElement('canvas'); n.width = c.width; n.height = c.height; n.getContext('2d').drawImage(c, 0, 0); return n; }

export function buildBonnie(canvas, opts = {}) {
  const A = imgCopy(canvas);
  // erase flat painted ear art on the hat top so the 3D ears are the only ears
  eraseRect(A, 40, 0, 8, 8);
  const ch = new Character(opts.name || 'bonnie', A);
  const P = opts.palette || { b: '#2f7fd8', l: '#5aa6f0', d: '#1d5fb0', w: '#e8eef6', p: '#f2a7c3' };
  const ear = () => voxelArt([
    '.dbbd.', 'dbllbd', 'dblwbd', 'dblwbd', 'dblwbd', 'dblwbd', 'dblwbd', 'dblwbd', 'dblwbd', 'dblwbd', 'dblwbd', 'dbllbd', 'dbbbbd', '.dbbd.'
  ], P, 0.5 * U, 1.5 * U);
  const eL = ear(), eR = ear();
  const pivL = new THREE.Group(), pivR = new THREE.Group();
  pivL.position.set(2.2 * U, 8.4 * U, 0); pivR.position.set(-2.2 * U, 8.4 * U, 0);
  eL.position.y = 3.3 * U; eR.position.y = 3.3 * U;
  pivL.add(eL); pivR.add(eR); pivL.rotation.z = -0.12; pivR.rotation.z = 0.12;
  ch.head.add(pivL, pivR); ch.earL = pivL; ch.earR = pivR;
  return ch;
}

export function buildFreddy(canvas, opts = {}) {
  const A = imgCopy(canvas);
  const s = A.width / 64; const g = A.getContext('2d');
  // Repaint the flat hat drawing on the head (top + upper corners of sides) with fur colour
  const fur = sampleColor(A, 12, 13), furD = sampleColor(A, 1, 15);
  g.fillStyle = sampleColor(A, 20, 12);
  // top face of the head
  g.fillRect(8 * s, 0, 8 * s, 8 * s);
  // painted hat/ears on head sides: right side (0,8) and left side (16,8)? and back (24,8)
  for (const [x] of [[0], [16], [24]]) {
    const d = g.getImageData(x * s, 8 * s, 8 * s, 8 * s);
    for (let i = 0; i < d.data.length; i += 4) {
      const r = d.data[i], gg = d.data[i + 1], b = d.data[i + 2];
      const darkOrRed = (r < 90 && gg < 90 && b < 90) || (r > 150 && gg < 60 && b < 60);
      if (darkOrRed) { const c = hexToRgb(g.fillStyle); d.data.set([c[0], c[1], c[2], 255], i); }
    }
    g.putImageData(d, x * s, 8 * s);
  }
  // hat overlay: keep only the front (muzzle/eyes) - remove painted ear discs from other faces
  eraseRect(A, 32, 0, 32, 8); eraseRect(A, 32, 8, 8, 8); eraseRect(A, 48, 8, 16, 8);
  const ch = new Character('freddy', A);
  // 3D top hat
  const hat = new THREE.Group();
  const black = '#1b1b1f', red = '#c81e2a';
  const crown = solidBox(4, 3.2, 4, black, 0.55); crown.position.y = 1.6 * U + 0.8 * U;
  const band = solidBox(4.2, 0.8, 4.2, red, 0.5); band.position.y = 1.2 * U;
  const brim = solidBox(6, 0.6, 6, black, 0.55); brim.position.y = 0.3 * U;
  hat.add(brim, band, crown); hat.position.set(0.4 * U, 8.05 * U, 0.3 * U); hat.rotation.z = -0.08;
  ch.head.add(hat); ch.topHat = hat;
  // 3D ears
  const P = opts.earPalette || { o: '#d86a20', d: '#a8501a', l: '#f2a65a' };
  const ear = () => voxelArt(['.oooo.', 'oddddo', 'odlldo', 'odlldo', 'oooooo'], P, 0.5 * U, 1.2 * U);
  const eL = ear(), eR = ear();
  eL.position.set(3.3 * U, 8.9 * U, -0.6 * U); eR.position.set(-3.3 * U, 8.9 * U, -0.6 * U);
  eL.rotation.z = -0.2; eR.rotation.z = 0.2;
  ch.head.add(eL, eR);
  ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return ch;
}

function hexToRgb(h) {
  if (h.startsWith('rgb')) return h.match(/\d+/g).map(Number);
  const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ======================= New characters (Toy souls video) =======================

// Extract the opaque pixels of a 64-unit rect into its own canvas (optionally erasing them from src).
function cutRegion(src, x, y, w, h, erase = false, filter = null) {
  const s = src.width / 64, g = src.getContext('2d');
  const X = Math.round(x * s), Y = Math.round(y * s), W = Math.round(w * s), H = Math.round(h * s);
  const d = g.getImageData(X, Y, W, H);
  const out = document.createElement('canvas'); out.width = W; out.height = H; const og = out.getContext('2d'); const od = og.createImageData(W, H);
  for (let i = 0; i < d.data.length; i += 4) {
    if (d.data[i + 3] < 128) continue;
    if (filter && !filter(d.data[i], d.data[i + 1], d.data[i + 2])) continue;
    od.data.set([d.data[i], d.data[i + 1], d.data[i + 2], 255], i);
    if (erase) d.data[i + 3] = 0;
  }
  og.putImageData(od, 0, 0); if (erase) g.putImageData(d, X, Y);
  return out;
}

// The Puppet: tall, thin, with a 3D extruded mask.
export function buildPuppet(canvas, extra = {}) {
  const A = imgCopy(canvas); const s = A.width / 64;
  const mask = cutRegion(A, 40, 8, 8, 8, true);
  const ch = new Character('puppet', A, Object.assign({ prop: { leg: 1.4, arm: 1.45, torso: 1.15, limbW: 0.7 } }, extra));
  const m = extrudePixels(mask, 0, 0, mask.width, mask.height, U * 8 / mask.width * 1.06, 1.3 * U);
  m.position.set(0, 4 * U, 4 * U + 0.9 * U); ch.head.add(m); ch.mask3d = m;
  // thin long head: slightly narrower and taller
  ch.head.scale.set(0.92, 1.08, 0.92);
  ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return ch;
}

// Purple Guy: 3D gold badge on the chest.
export function buildPurpleGuy(canvas) {
  const A = imgCopy(canvas);
  const isGold = (r, g, b) => r > 140 && g > 120 && b < 90;
  const badge = cutRegion(A, 20, 20, 8, 12, false, isGold);
  const ch = new Character('purpleguy', A);
  const px = U * 8 / badge.width;
  const b = extrudePixels(badge, 0, 0, badge.width, badge.height, px, 0.7 * U, { filter: isGold });
  b.position.set(0, 6 * U, 2 * U + 0.45 * U); ch.torso.add(b);
  b.traverse(o => { if (o.isMesh) { o.material.metalness = 0.7; o.material.roughness = 0.3; } });
  return ch;
}

// Child, recoloured into minigame-style palettes (shirt / accent / pants / hair).
export function recolorChild(canvas, pal) {
  const A = imgCopy(canvas); const g = A.getContext('2d'); const d = g.getImageData(0, 0, A.width, A.height);
  const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const P = { shirt: hex(pal.shirt), accent: hex(pal.accent), pants: hex(pal.pants), hair: hex(pal.hair) };
  const ref = { shirt: 0.24, accent: 0.42, pants: 0.32, hair: 0.42 };
  for (let i = 0; i < d.data.length; i += 4) {
    if (d.data[i + 3] < 128) continue;
    const r = d.data[i], gg = d.data[i + 1], b = d.data[i + 2]; const lum = (0.3 * r + 0.59 * gg + 0.11 * b) / 255;
    let key = null;
    if (r > 120 && gg < 50 && b < 50) key = 'shirt';
    else if (r > 170 && gg > 50 && gg < 110 && b < 40) key = 'accent';
    else if (b > 140 && r < 80 && gg < 110) key = 'pants';
    else if (r > 90 && r < 190 && gg > 40 && gg < 120 && b > 15 && b < 90 && r - b > 50 && !(r > 215)) key = 'hair';
    if (!key) continue;
    const k = Math.min(1.5, Math.max(0.55, lum / ref[key]));
    const c = P[key]; d.data[i] = Math.min(255, c[0] * k); d.data[i + 1] = Math.min(255, c[1] * k); d.data[i + 2] = Math.min(255, c[2] * k);
  }
  g.putImageData(d, 0, 0); return A;
}

// Spectral copy of a character: additive glowing silhouette.
export function makeGhost(ch, color = '#9fdcff') {
  const gm = new THREE.MeshBasicMaterial({ map: ch.tex, color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, alphaTest: 0.5, fog: false });
  ch.root.traverse(o => { if (o.isMesh) { o.material = gm; o.castShadow = false; o.receiveShadow = false; } });
  ch.ghostMat = gm; return ch;
}

// ---------- Mangle: broken, spider-like endoskeleton built from voxels + the skin's head ----------
const mStd = (color, rough = 0.5, metal = 0.55) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
function mBox(w, h, d, mat, x = 0, y = 0, z = 0, parent) { const m = new THREE.Mesh(new THREE.BoxGeometry(w * U, h * U, d * U), mat); m.position.set(x * U, y * U, z * U); m.castShadow = true; m.receiveShadow = true; if (parent) parent.add(m); return m; }

export class MangleRig {
  constructor(canvas) {
    this.name = 'mangle';
    const A = imgCopy(canvas); const s = A.width / 64;
    const muzzle = cutRegion(A, 10, 14, 4, 2, false); // lower-centre of the face: nose + mouth
    this.root = new THREE.Group(); this.root.name = 'mangle';
    const metal = mStd('#3c414d'), dark = mStd('#1b1d22', 0.6, 0.4), coil = mStd('#6a7182', 0.35, 0.8), pale = mStd('#ddd7cf', 0.7, 0.05), red = mStd('#c42a34', 0.6, 0.05);
    this.mats = { metal, dark, coil, pale, red };
    // body frame (quadruped, facing +z, belly down). Flipped later for the ceiling.
    this.body = new THREE.Group(); this.body.position.y = 11 * U; this.root.add(this.body);
    for (let i = 0; i < 6; i++) { const z = -6 + i * 2.4; mBox(1.6, 1.6, 1.8, metal, 0, 0, z, this.body); mBox(2.2, 0.8, 0.6, dark, 0, 0, z + 1.2, this.body); }
    const chest = new THREE.Group(); chest.position.set(0, 0.6 * U, 5 * U); this.body.add(chest); this.chest = chest;
    mBox(5, 1, 3.5, metal, 0, 0, 0, chest); mBox(5, 1, 3.5, metal, 0, 2, 0, chest);
    const lights = voxelArt(['yry.y', '.y.ry', 'ry.y.'], { y: '#f2c94c', r: '#e23c3c' }, 0.8 * U, 0.6 * U);
    lights.rotation.x = -Math.PI / 2; lights.position.set(0, 1.1 * U, 0); chest.add(lights);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1.6 * U, 10, 8), pale); ball.position.set(2.8 * U, 0, -5 * U); ball.castShadow = true; this.body.add(ball);
    // limbs: front = arms with pale hands, back = legs with feet
    this.limbs = [];
    const mk = (side, z, front) => {
      const piv = new THREE.Group(); piv.position.set(side * 2.4 * U, 0, z * U); this.body.add(piv);
      const L1 = front ? 8 : 7, L2 = front ? 11 : 10.5;
      const upper = new THREE.Group(); piv.add(upper);
      mBox(1.1, L1, 1.1, metal, 0, -L1 / 2, 0, upper);
      for (let k = 1; k < L1 - 0.5; k += 1.4) { const ring = new THREE.Group(); ring.position.y = -k * U; upper.add(ring);
        mBox(2.6, 0.35, 0.35, coil, 0, 0, 1.15, ring); mBox(2.6, 0.35, 0.35, coil, 0, 0, -1.15, ring); mBox(0.35, 0.35, 2.6, coil, 1.15, 0, 0, ring); mBox(0.35, 0.35, 2.6, coil, -1.15, 0, 0, ring); }
      const knee = new THREE.Group(); knee.position.y = -L1 * U; upper.add(knee);
      mBox(1.8, 1.8, 1.8, dark, 0, 0, 0, knee);
      const lower = new THREE.Group(); knee.add(lower);
      mBox(1.0, L2, 1.0, metal, 0, -L2 / 2, 0, lower);
      for (let k = 2; k < L2 - 1; k += 2.6) mBox(1.6, 1.0, 1.6, dark, 0, -k, 0, lower);
      const endG = new THREE.Group(); endG.position.y = -L2 * U; lower.add(endG);
      if (front) { mBox(3, 1.2, 3.2, pale, 0, -0.4, 0.6, endG); for (let f = -1; f <= 1; f++) mBox(0.7, 0.7, 2, pale, f * 0.9, -0.6, 2.6, endG); }
      else { mBox(3.2, 1.6, 4.5, pale, 0, -0.6, 0.8, endG); for (let f = -1; f <= 1; f++) mBox(0.8, 0.6, 0.8, red, f * 1.0, -0.9, 3.1, endG); }
      const limb = { side, front, piv, upper, knee, lower, L1, L2 }; this.limbs.push(limb); return limb;
    };
    mk(-1, 5, true); mk(1, 5, true); mk(-1, -5.5, false); mk(1, -5.5, false);
    // neck + head (skin head, 3D ears, 3D muzzle, bow tie)
    this.neck = new THREE.Group(); this.neck.position.set(0, 1 * U, 6.5 * U); this.body.add(this.neck);
    mBox(1, 1, 7, metal, 0, 0, 3.5, this.neck);
    for (let k = 1; k < 7; k += 1.5) mBox(2.2, 0.35, 0.35, coil, 0, 0, k, this.neck);
    this.head = new THREE.Group(); this.head.position.z = 7.5 * U; this.neck.add(this.head);
    this.tex = pixelTexture(A);
    const hm = new THREE.MeshStandardMaterial({ map: this.tex, roughness: 0.7, alphaTest: 0.5 });
    const hmO = new THREE.MeshStandardMaterial({ map: this.tex, roughness: 0.7, alphaTest: 0.5, side: THREE.DoubleSide });
    const headBox = new THREE.Mesh(skinBoxPublic(8, 8, 8, 0, 0), hm); headBox.castShadow = true;
    const hatBox = new THREE.Mesh(skinBoxPublic(8, 8, 8, 32, 0, 0.5), hmO);
    const hg = new THREE.Group(); hg.add(headBox, hatBox); hg.rotation.set(0, 0, Math.PI); hg.position.set(0, 0, 3.5 * U); // floor frame: face up, crown forward -> on the ceiling the face hangs down
    this.head.add(hg); this.headGroup = hg;
    const mz = extrudePixels(muzzle, 0, 0, muzzle.width, muzzle.height, U / s, 2.2 * U); mz.position.set(0, -3 * U, 4 * U + 1.1 * U); hg.add(mz);
    const earP = { w: '#ece6de', r: '#c4303c', d: '#9a2630' };
    const ear = () => voxelArt(['.ww.', 'wrrw', 'wrrw', 'wrrw', 'wrrw', 'wrdw', 'wwww'], earP, 0.75 * U, 0.8 * U);
    const eL = ear(), eR = ear(); eL.position.set(2.6 * U, 6.6 * U, -1 * U); eR.position.set(-2.6 * U, 6.6 * U, -1 * U); eL.rotation.z = -0.25; eR.rotation.z = 0.25; hg.add(eL, eR);
    const bow = voxelArt(['rr...rr', 'rrr.rrr', 'rrrrrrr', 'rrr.rrr', 'rr...rr'], { r: '#d02a36' }, 0.55 * U, 0.8 * U);
    bow.position.set(0, -1.2 * U, 1 * U); bow.rotation.x = -Math.PI / 2; this.neck.add(bow);
    // extra arm holding the endoskeleton head
    this.extra = new THREE.Group(); this.extra.position.set(-1.5 * U, 1.5 * U, 2 * U); this.body.add(this.extra);
    mBox(1, 12, 1, metal, 0, 6, 0, this.extra);
    for (let k = 2; k < 11; k += 1.6) { const ring = new THREE.Group(); ring.position.y = k * U; this.extra.add(ring); mBox(2.4, 0.35, 0.35, coil, 0, 0, 1, ring); mBox(2.4, 0.35, 0.35, coil, 0, 0, -1, ring); }
    this.endo = new THREE.Group(); this.endo.position.y = 12.5 * U; this.extra.add(this.endo);
    mBox(4.6, 4, 4.6, dark, 0, 2, 0, this.endo); mBox(4, 1, 2.5, metal, 0, -0.2, 1.4, this.endo);
    const eye = voxelArt(['.oo.', 'oyko', 'oyyo', '.oo.'], { o: '#e6e0d6', y: '#f0a020', k: '#111' }, 0.7 * U, 0.6 * U); eye.position.set(0.6 * U, 2.4 * U, 2.5 * U); this.endo.add(eye);
    for (let t = -1.5; t <= 1.5; t += 1) mBox(0.5, 0.8, 0.5, pale, t, 0.3, 2.6, this.endo);
    this.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.reset();
  }
  reset() {
    this.root.rotation.set(0, 0, 0); this.body.rotation.set(0, 0, 0); this.body.position.y = 11 * U;
    for (const l of this.limbs) {
      const out = l.side; // splay: upper points outward & up, lower back down
      l.piv.rotation.set(0, 0, 0);
      l.upper.rotation.set(0, 0, out * (l.front ? 2.05 : 1.95));
      l.lower.rotation.set(0, 0, -out * (l.front ? 2.05 : 1.95) - out * 0.12);
    }
    this.neck.rotation.set(-0.8, 0, 0); this.head.rotation.set(0, 0, 0);
    this.extra.rotation.set(0.35, 0, 0.4); this.endo.rotation.set(0, 0, 0);
  }
  // crawl gait, phase in cycles
  crawl(phase, amt = 1) {
    const order = [0, 0.5, 0.5, 0];
    this.limbs.forEach((l, i) => {
      const p = (phase + order[i]) * Math.PI * 2;
      l.piv.rotation.x += 0.45 * Math.sin(p) * amt;
      const lift = Math.max(0, Math.cos(p)) * 0.35 * amt; l.upper.rotation.z += l.side * lift; l.lower.rotation.z -= l.side * lift * 0.6;
    });
    this.body.position.y += 0.02 * Math.sin(phase * Math.PI * 4) * amt;
    this.body.rotation.z += 0.05 * Math.sin(phase * Math.PI * 2) * amt;
    this.neck.rotation.y += 0.15 * Math.sin(phase * Math.PI * 2 + 1) * amt;
  }
  idle(t, amt = 1) {
    this.neck.rotation.y += 0.12 * Math.sin(t * 1.3) * amt; this.neck.rotation.x += 0.08 * Math.sin(t * 1.9) * amt;
    this.extra.rotation.z += 0.18 * Math.sin(t * 1.6) * amt; this.extra.rotation.x += 0.1 * Math.sin(t * 2.3) * amt;
    this.endo.rotation.y += 0.4 * Math.sin(t * 1.1) * amt;
  }
}
export function skinBoxPublic(...a) { return skinBox(...a); }


// ======================= Puppet's story video =======================
// Classic (FNAF 1) Chica: the painted beak becomes a 3D extruded piece; duplicated bib text overlay removed.
export function buildClassicChica(canvas, name = 'oldChica') {
  const A = imgCopy(canvas);
  eraseRect(A, 16, 32, 24, 16);
  const isBeak = (r, g, b) => r > 170 && g > 50 && g < 170 && b < 80;
  const beak = cutRegion(A, 40, 8, 8, 8, true, isBeak);
  const ch = new Character(name, A);
  const px = U * 8 / beak.width;
  const m = extrudePixels(beak, 0, 0, beak.width, beak.height, px, 2.0 * U, { filter: isBeak });
  m.position.set(0, 4 * U, 4 * U + 1.0 * U); ch.head.add(m); ch.beak3d = m;
  ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return ch;
}

// William Afton (human): 3D badge on the shirt.
export function buildWilliam(canvas) {
  const A = imgCopy(canvas);
  const isGold = (r, g, b) => r > 110 && g > 90 && b < 110 && r - b > 40;
  const badge = cutRegion(A, 20, 20, 8, 12, false, isGold);
  const ch = new Character('william', A);
  const b = extrudePixels(badge, 0, 0, badge.width, badge.height, U * 8 / badge.width, 0.6 * U, { filter: isGold });
  b.position.set(0, 6 * U, 2 * U + 0.4 * U); ch.torso.add(b);
  b.traverse(o => { if (o.isMesh) { o.material.metalness = 0.7; o.material.roughness = 0.3; } });
  return ch;
}

// Security bracelet (voxel band with a blinking light) attached around a forearm.
export function bracelet(color = '#3cff7a') {
  const g = new THREE.Group();
  const band = new THREE.MeshStandardMaterial({ color: '#2a2a32', roughness: 0.4, metalness: 0.6 });
  const mk = (w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w * U, h * U, d * U), m); b.position.set(x * U, y * U, z * U); g.add(b); return b; };
  mk(4.9, 1.4, 0.6, 0, 0, 2.3, band); mk(4.9, 1.4, 0.6, 0, 0, -2.3, band); mk(0.6, 1.4, 4.9, 2.3, 0, 0, band); mk(0.6, 1.4, 4.9, -2.3, 0, 0, band);
  const led = mk(1, 0.8, 0.5, 0, 0, 2.75, new THREE.MeshBasicMaterial({ color, toneMapped: false })); g.userData.led = led; g.userData.color = color;
  return g;
}


// ======================= Fastest animatronics video =======================
function avgColor(canvas, x, y, w, h, filter = null) { // 64-units -> '#rrggbb'
  const s = canvas.width / 64; const d = canvas.getContext('2d').getImageData(x * s, y * s, w * s, h * s).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; if (filter && !filter(d[i], d[i + 1], d[i + 2])) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
  if (!n) return '#808080'; const h2 = v => Math.round(v / n).toString(16).padStart(2, '0'); return '#' + h2(r) + h2(g) + h2(b);
}
function shadeHex(hex, f) { const n = parseInt(hex.slice(1), 16); const c = v => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, '0'); return '#' + c((n >> 16) & 255) + c((n >> 8) & 255) + c(n & 255); }
function vbox(w, h, d, color, x, y, z, parent, rough = 0.75, emissive = null) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w * U, h * U, d * U), new THREE.MeshStandardMaterial({ color, roughness: rough, ...(emissive ? { emissive, emissiveIntensity: 2.2 } : {}) }));
  m.position.set(x * U, y * U, z * U); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}

// Foxy family (FNAF1 Foxy, Withered Foxy, Phantom Foxy): real 3D snout with an opening jaw,
// 3D ears, hook hand and thin endoskeleton legs.
export function buildFoxy(canvas, name, opts = {}) {
  const A = imgCopy(canvas);
  const fur = opts.fur || avgColor(A, 0, 8, 8, 8, (r, g, b) => r > 60 && r > g + 15);
  // remove flat painted ears (hat top) and the painted muzzle/teeth on the hat-front overlay
  eraseRect(A, 40, 0, 8, 8); eraseRect(A, 40, 12, 8, 4);
  const ch = new Character(name, A, { prop: { legW: 0.55, limbW: 0.9 } });
  const furD = shadeHex(fur, 0.72), furL = shadeHex(fur, 1.15), tooth = '#ece8dc', inner = opts.inner || '#d9b48a';
  // upper snout
  const sn = new THREE.Group(); sn.position.set(0, 2.6 * U, 4 * U); ch.head.add(sn); ch.snout = sn;
  vbox(5.2, 2.4, 4.6, fur, 0, 0, 2.3, sn); vbox(4.4, 0.5, 4.2, furL, 0, 1.3, 2.1, sn);
  vbox(2.0, 1.2, 1.0, '#141216', 0, 0.75, 4.75, sn, 0.4); // nose
  for (let i = -2; i <= 2; i++) vbox(0.55, 0.8, 0.5, tooth, i * 0.95, -1.5, 4.25, sn, 0.4);
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) vbox(0.5, 0.75, 0.5, tooth, sx * 2.35, -1.45, 3.3 - k * 1.1, sn, 0.4);
  // lower jaw (pivots at the back)
  const jaw = new THREE.Group(); jaw.position.set(0, -1.3 * U, 0.2 * U); sn.add(jaw); ch.jaw = jaw;
  vbox(4.6, 1.1, 4.2, furD, 0, -0.55, 2.1, jaw);
  for (let i = -2; i <= 2; i++) vbox(0.5, 0.7, 0.5, tooth, i * 0.9, 0.3, 3.9, jaw, 0.4);
  for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) vbox(0.45, 0.65, 0.45, tooth, sx * 2.05, 0.3, 2.8 - k * 1.1, jaw, 0.4);
  // ears
  const earRows = opts.tornEar ? ['.o.', 'oio', 'oio', 'oio', 'oo.'] : ['.o.', 'oio', 'oio', 'oio', 'oio', 'ooo'];
  const ear = (torn) => voxelArt(torn ? ['.o.', 'oio', 'oi.', 'o..'] : ['.o.', 'oio', 'oio', 'oio', 'oio', 'ooo'], { o: fur, i: inner }, 0.85 * U, 1.0 * U);
  const eL = ear(false), eR = ear(!!opts.tornEar);
  eL.position.set(2.7 * U, 10.4 * U, -0.5 * U); eR.position.set(-2.7 * U, 10.0 * U, -0.5 * U); eL.rotation.z = -0.22; eR.rotation.z = 0.22;
  ch.head.add(eL, eR);
  // hook on the right hand
  if (opts.hook !== false) {
    // small metal cuff + compact curved hook
    const metal = new THREE.MeshStandardMaterial({ color: '#b8bcc8', roughness: 0.22, metalness: 0.9 });
    const cuff = new THREE.Mesh(new THREE.BoxGeometry(4.3 * U, 1.2 * U, 4.3 * U), metal); cuff.position.set(0, 1.0 * U, 0); cuff.castShadow = true; ch.handR.add(cuff);
    const rod = new THREE.Mesh(new THREE.BoxGeometry(0.8 * U, 1.4 * U, 0.8 * U), metal); rod.position.set(0, -0.3 * U, 0); rod.castShadow = true; ch.handR.add(rod);
    const hk = voxelArt(['.xxx.', 'x...x', 'x....', '.x...', '..x..'], { x: '#c8ccd8' }, 0.5 * U, 0.8 * U);
    hk.position.set(0.5 * U, -2.0 * U, 0.4 * U); ch.handR.add(hk); ch.hook = hk;
    hk.traverse(o => { if (o.isMesh) { o.material.metalness = 0.9; o.material.roughness = 0.2; } });
  }
  // metal endoskeleton feet on the thin legs (counter-scaled so they keep full width)
  const fm = new THREE.MeshStandardMaterial({ color: '#8a8e98', roughness: 0.3, metalness: 0.85 }), fd = new THREE.MeshStandardMaterial({ color: '#4a4e58', roughness: 0.4, metalness: 0.8 });
  for (const leg of [ch.legR, ch.legL]) {
    const ft = new THREE.Group(); ft.position.set(0, -11.0 * U, 0); ft.scale.set(1 / 0.55, 1, 1 / 0.55); leg.piv.add(ft);
    const mk = (w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w * U, h * U, d * U), m); b.position.set(x * U, y * U, z * U); b.castShadow = true; b.receiveShadow = true; ft.add(b); };
    mk(1.6, 1.0, 1.6, 0, 0.2, 0, fd);                // ankle joint
    mk(3.6, 1.0, 4.4, 0, -0.5, 0.6, fm);             // sole plate
    for (const x of [-1.1, 0, 1.1]) mk(0.9, 0.8, 1.4, x, -0.6, 3.4, fd); // toes
    mk(1.2, 0.8, 1.2, 0, -0.6, -1.9, fd);            // heel
  }
  ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return ch;
}

// Nightmarionne: tall Puppet build + 3D mask + black tendrils on the back.
export function buildNightmarionne(canvas) {
  const ch = buildPuppet(canvas, { slim: true }); ch.name = 'nightmarionne'; ch.root.name = 'nightmarionne';
  const m = new THREE.MeshStandardMaterial({ color: '#0c0c10', roughness: 0.6 });
  ch.tendrils = [];
  for (let i = 0; i < 6; i++) {
    const root = new THREE.Group(); root.position.set((i - 2.5) * 1.3 * U, (9 - (i % 2) * 2) * U, -2.2 * U); ch.torso.add(root);
    let parent = root; const segs = 7;
    for (let k = 0; k < segs; k++) { const g = new THREE.Group(); g.position.y = k ? 1.6 * U : 0; parent.add(g);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.7 * U, 1.7 * U, 0.7 * U), m); b.position.y = 0.85 * U; b.castShadow = true; g.add(b); parent = g; ch.tendrils.push({ g, i, k }); }
    root.rotation.set(-0.9, 0, (i - 2.5) * 0.35);
  }
  return ch;
}
export function waveTendrils(ch, t, amt = 1) { for (const { g, i, k } of ch.tendrils) { g.rotation.x = -0.12 * amt - 0.06 * Math.sin(t * 2.2 + i + k * 0.7) * amt; g.rotation.z = 0.12 * Math.sin(t * 1.7 + i * 1.3 + k * 0.5) * amt; } }

// Yenndo: endoskeleton with glowing 3D yellow eyes.
export function buildYenndo(canvas) {
  const A = imgCopy(canvas);
  const isEye = (r, g, b) => r > 170 && g > 130 && b < 110;
  const ch = new Character('yenndo', A);
  for (const [x, y] of [[8, 8], [40, 8]]) {
    const eyes = cutRegion(A, x, y, 8, 8, false, isEye);
    const e = extrudePixels(eyes, 0, 0, eyes.width, eyes.height, U * 8 / eyes.width, 0.6 * U, { filter: isEye });
    e.position.set(0, 4 * U, 4 * U + (x === 40 ? 0.75 : 0.32) * U); ch.head.add(e);
    e.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ color: '#ffd640', toneMapped: false }); o.castShadow = false; } });
  }
  return ch;
}

// ======================= Springtrap / Balloon Boy video =======================
// Spring Bonnie / Springtrap: flat painted ears removed, real 3D voxel ears (Springtrap: one ear bent + torn),
// optional exposed endoskeleton / wires peeking from the suit.
export function buildSpring(canvas, name, opts = {}) {
  const A = imgCopy(canvas);
  eraseRect(A, 40, 0, 8, 8); eraseRect(A, 48, 0, 8, 8);           // hat top/bottom (painted ears / junk)
  // painted flat/droopy ears on the hat layer: whole back face, upper part of both sides, top strip of the front
  eraseRect(A, 56, 8, 8, 8); eraseRect(A, 32, 8, 8, 5.5); eraseRect(A, 48, 8, 8, 5.5); eraseRect(A, 40, 8, 8, 2.5);
  if (opts.clearJunk) { eraseRect(A, 24, 0, 8, 8); eraseRect(A, 32, 0, 8, 8); eraseRect(A, 56, 0, 8, 8); }
  const ch = new Character(name, A, { prop: opts.prop || { limbW: 0.95 } });
  const fur = opts.fur || avgColor(A, 8, 8, 8, 2), furD = shadeHex(fur, 0.68), furL = shadeHex(fur, 1.18), inner = opts.inner || shadeHex(fur, 1.3);
  const P = { o: fur, d: furD, l: furL, i: inner, w: '#2a2a2a' };
  const tall = ['.oo.', 'oddo', 'odio', 'odio', 'odio', 'odio', 'odio', 'odio', 'odio', 'odio', 'odio', 'oddo', '.oo.'];
  const torn = ['.o..', 'oddo', 'odio', 'odio', 'o.io', 'odio', 'odd.', '.oo.'];
  const mkEar = rows => voxelArt(rows, P, 0.75 * U, 1.1 * U);
  const pivL = new THREE.Group(), pivR = new THREE.Group();
  pivL.position.set(2.1 * U, 8.0 * U, -0.6 * U); pivR.position.set(-2.1 * U, 8.0 * U, -0.6 * U);
  const eL = mkEar(tall); eL.position.y = 4.6 * U; pivL.add(eL);
  if (opts.bent) {
    // right ear: lower half up, upper half folded forward/down (Springtrap's broken ear)
    const low = mkEar(tall.slice(6)); low.position.y = 2.6 * U; pivR.add(low);
    const hinge = new THREE.Group(); hinge.position.y = 5.0 * U; pivR.add(hinge);
    const up = mkEar(torn); up.position.y = 2.7 * U; hinge.add(up); hinge.rotation.x = 1.9; hinge.rotation.z = 0.35; ch.earHinge = hinge;
  } else { const eR = mkEar(tall); eR.position.y = 4.6 * U; pivR.add(eR); }
  pivL.rotation.z = -0.1; pivR.rotation.z = 0.14; pivL.rotation.x = -0.12; pivR.rotation.x = -0.1;
  ch.head.add(pivL, pivR); ch.earL = pivL; ch.earR = pivR;
  if (opts.endo) {
    // exposed endoskeleton bits + wires (Springtrap)
    const metal = '#6c6a64', wire = ['#7a1e1e', '#2a3a6a', '#1a1a1a'];
    vbox(1.2, 0.8, 0.6, metal, 2.2, 1.6, 2.3, ch.torso, 0.35); vbox(0.8, 1.6, 0.6, metal, -2.4, 8.4, 2.25, ch.torso, 0.35);
    wire.forEach((c, i) => { vbox(0.35, 2.4 - i * 0.5, 0.35, c, -1.2 + i * 0.6, 4.2 - i * 0.4, 2.25, ch.torso, 0.6); });
    vbox(0.35, 1.6, 0.35, '#7a1e1e', 0.6, -0.6, 2.2, ch.armL.piv, 0.6); vbox(0.35, 1.3, 0.35, '#1a1a1a', -0.8, -1.4, 2.2, ch.legR.piv, 0.6);
    // gaping torso hole with a (dim) silhouette of the body inside
    vbox(2.2, 2.6, 0.2, '#120d0a', 1.3, 6.4, 2.12, ch.torso, 0.9);
    ch.springlocks = [];
    for (const [x, y, p] of [[-2.6, 9.5, ch.torso], [2.6, 9.5, ch.torso], [-2.4, 3.2, ch.torso], [2.4, 3.2, ch.torso]]) {
      const l = vbox(0.9, 0.9, 0.4, '#3a3a40', x, y, 2.22, p, 0.3, '#000000'); ch.springlocks.push(l);
    }
  }
  ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return ch;
}

// Fredbear: 3D purple top hat + 3D round ears; painted hat/ears erased.
export function buildFredbear(canvas) {
  const A = imgCopy(canvas); const s = A.width / 64; const g = A.getContext('2d');
  const fur = avgColor(A, 8, 10, 8, 2, (r, gg, b) => r > 120 && gg > 70 && b < 90);
  // purple painted hat on head top + sides -> fur
  const isPurple = (r, gg, b) => b > gg + 10 && r > gg && b > 40;
  for (const [x, y, w, h] of [[0, 0, 32, 16]]) {
    const d = g.getImageData(x * s, y * s, w * s, h * s); const c = hexToRgb(fur);
    for (let i = 0; i < d.data.length; i += 4) if (d.data[i + 3] > 128 && isPurple(d.data[i], d.data[i + 1], d.data[i + 2])) d.data.set([c[0], c[1], c[2], 255], i);
    g.putImageData(d, x * s, y * s);
  }
  eraseRect(A, 32, 0, 32, 8);
  // hat-layer side pixels that were purple (brim drawing) -> remove
  { const d = g.getImageData(32 * s, 8 * s, 32 * s, 8 * s); for (let i = 0; i < d.data.length; i += 4) if (isPurple(d.data[i], d.data[i + 1], d.data[i + 2])) d.data[i + 3] = 0; g.putImageData(d, 32 * s, 8 * s); }
  const ch = new Character('fredbear', A);
  const purple = '#5a2a8a', purpleD = '#3e1a64', band = '#2a1240';
  const hat = new THREE.Group();
  const brim = solidBox(5.6, 0.6, 5.6, purpleD, 0.55); brim.position.y = 0.3 * U;
  const bandM = solidBox(3.9, 0.7, 3.9, band, 0.5); bandM.position.y = 0.95 * U;
  const crown = solidBox(3.7, 3.0, 3.7, purple, 0.55); crown.position.y = 2.6 * U;
  hat.add(brim, bandM, crown); hat.position.set(0, 8.02 * U, 0.2 * U); hat.rotation.z = 0.06; ch.head.add(hat); ch.topHat = hat;
  const P = { o: fur, d: shadeHex(fur, 0.62), l: shadeHex(fur, 1.15) };
  const ear = () => voxelArt(['.oooo.', 'oddddo', 'odlldo', 'odlldo', 'oooooo'], P, 0.5 * U, 1.2 * U);
  const eL = ear(), eR = ear(); eL.position.set(3.4 * U, 8.8 * U, -0.8 * U); eR.position.set(-3.4 * U, 8.8 * U, -0.8 * U); eL.rotation.z = -0.25; eR.rotation.z = 0.25;
  ch.head.add(eL, eR);
  ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return ch;
}

// Balloon Boy: much shorter and chubbier than the others, 3D propeller beanie, balloon + sign.
export function buildBB(canvas, opts = {}) {
  const A = imgCopy(canvas);
  const prop = cutRegion(A, 40, 0, 8, 8, true);  // painted propeller on the hat top
  eraseRect(A, 48, 0, 8, 8);
  const ch = new Character('bb', A, { prop: { leg: 0.55, arm: 0.72, torso: 0.78, limbW: 1.05, legW: 1.15 } });
  // chubby torso
  for (const m of [ch.body, ch.bodyO]) { m.scale.x = 1.32; m.scale.z = 1.55; }
  const aw = ch.slim ? 3 : 4; const bodyHalf = 4 * 1.32;
  ch.armR.piv.position.x = -(bodyHalf + aw * 1.05 / 2) * U; ch.armL.piv.position.x = (bodyHalf + aw * 1.05 / 2) * U;
  for (const L of [ch.legR, ch.legL]) L.piv.position.x *= 1.25;
  ch.head.scale.setScalar(1.12);
  // 3D propeller beanie: cap stem + spinning blades
  const dark = opts.cap || '#24361c', blade = opts.blade || '#2c4a22';
  const top = new THREE.Group(); top.position.set(0, 8.0 * U, 0); ch.head.add(top);
  vbox(0.8, 1.4, 0.8, dark, 0, 0.7, 0, top, 0.6);
  const spin = new THREE.Group(); spin.position.y = 1.5 * U; top.add(spin); ch.propeller = spin;
  for (const a of [0, Math.PI / 2]) { const b = vbox(6.2, 0.3, 1.0, blade, 0, 0, 0, spin, 0.6); b.rotation.y = a; }
  vbox(1.0, 0.5, 1.0, '#3a3a1a', 0, 0.3, 0, spin, 0.5);
  // balloon (right hand) on a string, sign (left hand)
  if (opts.balloon !== false) {
    const bg = new THREE.Group(); ch.handR.add(bg); ch.balloon = bg;
    vbox(0.25, 9, 0.25, '#d8d8d0', 0, 4.5, 1.0, bg, 0.8);
    const ball = voxelArt(['..rrr..', '.rrrrr.', 'rrrlrrr', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: opts.balloonCol || '#7a2a22', l: '#c06a5a' }, 0.75 * U, 4.2 * U);
    ball.position.set(0, 11.6 * U, 1.0 * U); bg.add(ball);
    const sg = new THREE.Group(); ch.handL.add(sg); ch.sign = sg;
    vbox(0.4, 5, 0.4, '#5a3a20', 0, 1.6, 1.0, sg, 0.8);
    const c = document.createElement('canvas'); c.width = 32; c.height = 14; const g2 = c.getContext('2d');
    g2.fillStyle = opts.signBg || '#b8b0a0'; g2.fillRect(0, 0, 32, 14); g2.fillStyle = '#6a1a18'; g2.font = 'bold 9px monospace'; g2.textBaseline = 'middle'; g2.fillText('BALL', 3, 5); g2.fillText('OONS', 3, 11);
    const sm = texBox(6.4, 2.8, 0.3, c); sm.position.set(0, 5.2 * U, 1.0 * U); sg.add(sm);
  }
  ch.baseScale = opts.scale || 0.78; ch.root.scale.setScalar(ch.baseScale);
  ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return ch;
}

// X-ray rig for Springtrap / Spring Bonnie: hidden endoskeleton + motors, revealed by making the suit see-through.
export function addEndo(ch) {
  ch.headMat = ch.mat.clone(); ch.headMatO = ch.matO.clone(); ch.headMesh.material = ch.headMat; ch.hat.material = ch.headMatO;
  const g = new THREE.Group(); g.visible = false; ch.endo = g; ch.motors = [];
  const metal = new THREE.MeshStandardMaterial({ color: '#9aa0aa', roughness: 0.3, metalness: 0.8 });
  const motorM = () => new THREE.MeshStandardMaterial({ color: '#30343a', roughness: 0.3, metalness: 0.7, emissive: '#000000', emissiveIntensity: 2.5, toneMapped: false });
  const mk = (w, h, d, x, y, z, p, m = metal) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w * U, h * U, d * U), m); b.position.set(x * U, y * U, z * U); p.add(b); b.userData.endo = true; return b; };
  mk(1.0, 11, 1.0, 0, 6, 0, ch.torso); mk(6, 0.8, 0.8, 0, 10, 0, ch.torso); mk(5, 0.8, 0.8, 0, 1, 0, ch.torso);
  mk(3.5, 3, 3.5, 0, 4, 0, ch.head); 
  for (const L of [ch.armR, ch.armL, ch.legR, ch.legL]) { mk(0.8, 11, 0.8, 0, -6, 0, L.piv); const mo = mk(2.0, 2.0, 2.0, 0, -6, 0, L.piv, motorM()); ch.motors.push(mo); const mo2 = mk(1.6, 1.6, 1.6, 0, -0.6, 0, L.piv, motorM()); ch.motors.push(mo2); }
  const core = mk(2.4, 2.4, 1.6, 0, 6, 0.6, ch.torso, motorM()); ch.motors.push(core);
  ch.endoParts = []; ch.root.traverse(o => { if (o.userData.endo) ch.endoParts.push(o); });
  for (const o of ch.endoParts) o.visible = false;
  return ch;
}
export function setXray(ch, k, glow = 0, col = '#40ff70') {
  const on = k > 0.01;
  for (const o of ch.endoParts) o.visible = on;
  for (const m of [ch.mat, ch.matO]) { m.transparent = on; m.opacity = on ? 1 - 0.62 * k : 1; m.depthWrite = !on; m.alphaTest = on ? 0.01 : 0.5; m.needsUpdate = true; }
  for (const mo of ch.motors) { mo.material.emissive.set(glow > 0 ? col : '#000000'); mo.material.emissiveIntensity = 2.5 * glow; }
}

// ======================= Blob (Security Breach) video =======================
function recolorWhere(canvas, rx, ry, rw, rh, test, color) { // 64-unit rect; test(r,g,b,px,py) with px,py in 64-units
  const s = canvas.width / 64, g = canvas.getContext('2d'); const X = Math.round(rx * s), Y = Math.round(ry * s), W = Math.round(rw * s), H = Math.round(rh * s);
  const d = g.getImageData(X, Y, W, H); const c = color ? hexToRgb(color) : null;
  for (let i = 0; i < d.data.length; i += 4) { if (d.data[i + 3] < 128) continue; const p = i / 4, px = (p % W) / s, py = Math.floor(p / W) / s;
    if (test(d.data[i], d.data[i + 1], d.data[i + 2], px, py)) { if (c) d.data.set([c[0], c[1], c[2], 255], i); else d.data[i + 3] = 0; } }
  g.putImageData(d, X, Y);
}
const isDarkOrTeal = (r, g, b) => (r < 60 && g < 60 && b < 70) || (b > r + 20);

// Gregory: voxel messy hair on top of the head + fringe.
export function buildGregory(canvas) {
  const ch = new Character('gregory', imgCopy(canvas));
  const hair = avgColor(ch.canvas, 8, 0, 8, 8), hd = shadeHex(hair, 0.8);
  const g = new THREE.Group(); ch.head.add(g); ch.hair = g;
  // low, close-fitting hair: thin cap, a few shallow tufts, short fringe
  vbox(8.7, 0.7, 8.7, hair, 0, 8.3, 0, g, 0.9);
  [[-2.2, -1.5, 2.6], [1.6, -0.6, 2.4], [-0.6, 1.8, 2.2], [2.4, 2.0, 2.0], [-2.6, 2.4, 1.8]].forEach(([x, z, w], i) => vbox(w, 0.35 + (i % 2) * 0.15, w, i % 2 ? hd : hair, x, 8.75, z, g, 0.9));
  vbox(8.7, 0.8, 0.5, hair, 0, 7.6, 4.3, g, 0.9);
  for (let i = 0; i < 4; i++) vbox(1.4, 0.5, 0.5, i % 2 ? hd : hair, -2.6 + i * 1.8, 7.0, 4.3, g, 0.9);
  ch.baseScale = 0.88;
  ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return ch;
}

// Glamrock Freddy: painted hat/ears removed, 3D black top hat with teal band + 3D round ears.
export function buildGFreddy(canvas) {
  const A = imgCopy(canvas);
  const fur = avgColor(A, 12, 4, 4, 3);
  recolorWhere(A, 8, 0, 8, 8, () => true, fur);                        // head top
  for (const x of [0, 16, 24]) recolorWhere(A, x, 8, 8, 5.8, isDarkOrTeal, fur); // upper sides/back
  recolorWhere(A, 8, 8, 8, 1.5, isDarkOrTeal, fur);                     // ear tips on the front corners
  eraseRect(A, 32, 0, 32, 8);
  const ch = new Character('gfreddy', A);
  const hat = new THREE.Group(); const blk = '#060608', teal = '#2ad8d0';
  vbox(5.2, 0.5, 5.2, blk, 0, 0.25, 0, hat, 0.4); vbox(3.6, 0.8, 3.6, teal, 0, 0.9, 0, hat, 0.35, '#0a5a58'); vbox(3.4, 2.6, 3.4, blk, 0, 2.5, 0, hat, 0.4);
  hat.position.set(0.3 * U, 8.0 * U, 0.4 * U); hat.rotation.z = -0.1; ch.head.add(hat); ch.topHat = hat;
  const P = { o: fur, k: '#1a1a22', t: '#2ab8b0' };
  const ear = () => voxelArt(['.kkkk.', 'koooOk'.replace('O', 'o'), 'kottok', 'kottok', 'kooook', '.kkkk.'], P, 0.55 * U, 1.2 * U);
  const eL = ear(), eR = ear(); eL.position.set(3.6 * U, 9.0 * U, -0.6 * U); eR.position.set(-3.6 * U, 9.0 * U, -0.6 * U); eL.rotation.z = -0.3; eR.rotation.z = 0.3; ch.head.add(eL, eR);
  ch.baseScale = 1.32;
  ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return ch;
}

// Funtime Freddy: painted hat layer (flat ears/muzzle) removed; 3D white muzzle with magenta cheeks + opening jaw, round black/pink ears.
export function buildFFreddy(canvas) {
  const A = imgCopy(canvas);
  eraseRect(A, 32, 0, 32, 16);
  const ch = new Character('ffreddy', A, { prop: { limbW: 1.05, legW: 1.0, torso: 1.0 } });
  const W = '#f4eef6', Wd = '#ddd2e2', mag = '#e0309a', pk = '#ff7ac8', blk = '#18141c', tooth = '#ffffff';
  const sn = new THREE.Group(); sn.position.set(0, 2.3 * U, 4 * U); ch.head.add(sn); ch.snout = sn;
  vbox(5.0, 2.0, 1.6, W, 0, 0.1, 0.8, sn, 0.5);
  vbox(1.6, 1.3, 1.4, mag, -2.0, 0.2, 1.0, sn, 0.4); vbox(1.6, 1.3, 1.4, mag, 2.0, 0.2, 1.0, sn, 0.4);
  vbox(1.8, 0.9, 0.6, blk, 0, 0.8, 1.75, sn, 0.3); vbox(1.0, 0.4, 0.3, pk, 0, 1.0, 2.05, sn, 0.3);
  vbox(4.6, 0.3, 0.3, blk, 0, -0.85, 1.55, sn, 0.4);
  for (let i = -2; i <= 2; i++) vbox(0.55, 0.55, 0.4, tooth, i * 0.85, -0.55, 1.55, sn, 0.3);
  const jaw = new THREE.Group(); jaw.position.set(0, -1.0 * U, 0.2 * U); sn.add(jaw); ch.jaw = jaw;
  vbox(4.6, 0.9, 1.4, Wd, 0, -0.45, 0.6, jaw, 0.5); for (let i = -2; i <= 2; i++) vbox(0.5, 0.5, 0.35, tooth, i * 0.85, 0.2, 1.1, jaw, 0.3);
  const ear = () => voxelArt(['.kkkk.', 'kkkkkk', 'kkppkk', 'kppppk', 'kkppkk', '.kkkk.'], { k: blk, p: mag }, 0.6 * U, 1.0 * U);
  const eL = ear(), eR = ear(); eL.position.set(3.3 * U, 9.4 * U, -0.4 * U); eR.position.set(-3.3 * U, 9.4 * U, -0.4 * U); eL.rotation.z = -0.25; eR.rotation.z = 0.25; ch.head.add(eL, eR);
  ch.baseScale = 1.32;
  ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return ch;
}

// Circus Baby: painted pigtails removed from the hat sides, real 3D pigtails; eyes either lit (glowing green) or dead.
export function buildBaby(canvas, opts = {}) {
  const A = imgCopy(canvas);
  eraseRect(A, 32, 8, 8, 8); eraseRect(A, 48, 8, 8, 8);
  const isEye = (r, g, b) => g > r + 15 && g > b;
  if (opts.dead) recolorWhere(A, 8, 8, 8, 8, isEye, '#26282a');
  const ch = new Character(opts.name || 'baby', A, { prop: { limbW: 1.15, legW: 1.2, torso: 1.05 } });
  for (const m of [ch.body, ch.bodyO]) { m.scale.x = 1.28; m.scale.z = 1.45; }
  { const aw = ch.slim ? 3 : 4; ch.armR.piv.position.x = -(4 * 1.28 + aw * 1.15 / 2) * U; ch.armL.piv.position.x = (4 * 1.28 + aw * 1.15 / 2) * U; for (const L of [ch.legR, ch.legL]) L.piv.position.x *= 1.25; }
  ch.baseScale = 1.34;
  const hair = '#e2622a', hd = '#b8481c', hl = '#f2884a';
  for (const sx of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(sx * 4.3 * U, 6.0 * U, -0.6 * U); ch.head.add(g);
    vbox(1.6, 1.8, 1.8, hd, sx * 0.4, 0, 0, g, 0.8);                            // tie
    const curl = [[1.2, -0.6, 2.4, 2.6], [1.9, -2.6, 2.2, 2.4], [1.6, -4.5, 2.0, 2.2], [0.8, -6.1, 1.7, 1.8], [0.2, -7.3, 1.3, 1.4]];
    curl.forEach(([dx, dy, w, h], i) => vbox(w, h, w, i % 2 ? hl : hair, sx * dx, dy, 0, g, 0.8));
    g.rotation.z = sx * 0.12; (sx < 0 ? (ch.tailR = g) : (ch.tailL = g));
  }
  if (!opts.dead) {
    const eyes = cutRegion(A, 8, 8, 8, 8, false, isEye);
    const e = extrudePixels(eyes, 0, 0, eyes.width, eyes.height, U * 8 / eyes.width, 0.4 * U, { filter: isEye });
    e.position.set(0, 4 * U, 4 * U + 0.22 * U); ch.head.add(e); ch.eyeGlow = e;
    e.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ color: '#6aff6a', toneMapped: false }); o.castShadow = false; } });
  }
  ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return ch;
}

// Puppet with/without the purple tear streaks on the 3D mask.
export function puppetTears(canvas, tears) {
  const A = imgCopy(canvas); const g = A.getContext('2d'); const s = A.width / 64;
  const isP = (r, gg, b) => b > r + 10 && r > gg + 20;
  if (tears) { g.fillStyle = '#7a2ad0'; for (const x of [41, 46]) for (const y of [12, 13, 14]) g.fillRect(x * s, y * s, s, s); }
  else recolorWhere(A, 40, 8, 8, 8, isP, '#f4f4f4');
  return A;
}

// ======================= Glamrock Bonnie (Security Breach / Ruin) video =======================
const lum = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b;
function earPair(ch, rows, P, px, depth, x, y, z, tilt = 0.12, fold = 0) {
  const mk = () => voxelArt(rows, P, px * U, depth * U);
  const L = new THREE.Group(), R = new THREE.Group(); L.position.set(x * U, y * U, z * U); R.position.set(-x * U, y * U, z * U);
  const eL = mk(), eR = mk(); const hh = rows.length * px / 2 * U; eL.position.y = hh; eR.position.y = hh; L.add(eL); R.add(eR); L.rotation.z = -tilt; R.rotation.z = tilt; if (fold) { R.rotation.x = -fold; }
  ch.head.add(L, R); ch.earL = L; ch.earR = R; return [L, R];
}
const finish = ch => { ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return ch; };

// Glamrock Bonnie: flat painted ears (head top + hat) removed; tall 3D ears, muzzle with nose, hair tuft.
export function buildGBonnie(canvas, name = 'gbonnie') {
  const A = imgCopy(canvas);
  const blue = avgColor(A, 0, 9, 8, 3), lb = '#9ad6f2', db = shadeHex(blue, 0.7);
  recolorWhere(A, 8, 0, 8, 8, () => true, blue);       // head top: painted ears
  eraseRect(A, 32, 0, 32, 16);                         // hat layer (flat ears / outlines)
  eraseRect(A, 56, 16, 8, 16);                         // "Darkness" text strip (unused area)
  const ch = new Character(name, A);
  const P = { o: blue, d: db, i: lb };
  earPair(ch, ['.oo.', 'oiio', 'oiio', 'oiio', 'oiio', 'oiio', 'oiio', 'oiio', 'oiio', 'oddo', '.oo.'], P, 0.62, 1.0, 2.0, 8.0, -0.6, 0.14);
  // muzzle
  const sn = new THREE.Group(); sn.position.set(0, 2.5 * U, 4 * U); ch.head.add(sn); ch.snout = sn;
  vbox(4.6, 2.2, 1.3, lb, 0, 0, 0.65, sn, 0.6); vbox(1.6, 0.9, 0.5, '#1a2a6a', 0, 0.8, 1.35, sn, 0.4);
  for (let i = -1; i <= 1; i += 2) vbox(1.4, 0.35, 0.3, '#ffffff', i * 0.75, -0.95, 1.3, sn, 0.4);
  const jaw = new THREE.Group(); jaw.position.set(0, -1.2 * U, 0); sn.add(jaw); ch.jaw = jaw; vbox(4.0, 0.8, 1.1, shadeHex(lb, 0.85), 0, -0.4, 0.5, jaw, 0.6);
  // hair tuft
  for (const [x, h, z, r] of [[-0.8, 2.0, 3.2, 0.3], [0.4, 2.4, 3.0, -0.1], [1.4, 1.6, 3.3, -0.4]]) { const b = vbox(1.1, h, 1.0, db, x, 8 + h / 2 - 0.3, z, ch.head, 0.7); b.rotation.z = r; }
  ch.baseScale = 1.32;
  return finish(ch);
}

// Destroyed Glamrock Bonnie (Ruin): discoloured shell, claw gashes, green paint, loose parts, dim glowing eyes.
export function buildRuinBonnie(canvas) {
  const A = imgCopy(canvas); const g = A.getContext('2d'); const s = A.width / 64;
  // grime + discolour (pinkish/purple shell like the Ruin model)
  const d = g.getImageData(0, 0, A.width, A.height);
  for (let i = 0; i < d.data.length; i += 4) { if (d.data[i + 3] < 128) continue; const p = i / 4, x = p % A.width, y = Math.floor(p / A.width);
    const n = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1; const k = 0.62 + 0.25 * Math.abs(n);
    d.data[i] = Math.min(255, d.data[i] * k + 30); d.data[i + 1] *= k * 0.85; d.data[i + 2] *= k; }
  g.putImageData(d, 0, 0);
  const ch = buildGBonnie(A, 'ruinbonnie');
  // claw gashes on the chest/back: 3 deep dark slashes each
  const gash = (parent, x0, y0, z, rot) => { for (let k = 0; k < 3; k++) { const b = vbox(0.7, 7.5, 0.5, '#0c0608', x0 + k * 1.6, y0, z, parent, 0.9); b.rotation.z = rot; const e = vbox(0.3, 7.5, 0.55, '#4a1a10', x0 + k * 1.6 + 0.35, y0, z, parent, 0.9); e.rotation.z = rot; } };
  gash(ch.torso, -2.0, 6.5, 2.1, 0.55); gash(ch.torso, -2.6, 5.5, -2.1, -0.5);
  // green paint smears (Monty's colour)
  const gp = (parent, x, y, z, w, h, r) => { const b = vbox(w, h, 0.2, '#3ed04a', x, y, z, parent, 0.5); b.rotation.z = r; b.material.emissive = new THREE.Color('#0a3a0e'); return b; };
  gp(ch.torso, 1.6, 8.5, 2.12, 3.6, 1.5, 0.5); gp(ch.torso, 2.2, 7.4, 2.13, 2.0, 1.0, 0.9); gp(ch.torso, -1.0, 3.0, 2.12, 2.4, 0.8, -0.3); gp(ch.head, 2.0, 6.5, 4.12, 2.0, 0.7, 0.2); gp(ch.torso, 0.5, 7.0, -2.12, 3.0, 0.9, -0.6);
  ch.greenMarks = new THREE.Vector3(1.6, 8.5, 2.2).multiplyScalar(U);
  // dim eyes
  ch.eyes = []; for (const x of [-1.7, 1.7]) { const e = vbox(1.2, 1.2, 0.3, '#fff2c0', x, 4.6, 4.15, ch.head, 0.3, '#fff2c0'); ch.eyes.push(e); }
  // broken ear: right ear drops (folded), left ear snapped short
  ch.earR.rotation.set(-1.4, 0, 0.6); ch.earL.scale.y = 0.45;
  // exposed wires from the neck
  for (let k = 0; k < 4; k++) { const w = vbox(0.25, 3.5, 0.25, ['#c83a2a', '#2a5ad8', '#e8c03a', '#222'][k], -1 + k * 0.7, 1.0, 1 - k * 0.5, ch.neck, 0.5); w.rotation.set(0.6 - k * 0.3, 0, 0.4 - k * 0.25); }
  ch.baseScale = 1.32;
  return finish(ch);
}

// Roxanne Wolf: keep the white hair overlay (+ green streak), remove grey painted ear shapes; 3D ears + muzzle.
export function buildRoxy(canvas) {
  const A = imgCopy(canvas);
  const fur = avgColor(A, 0, 10, 8, 4);
  recolorWhere(A, 0, 8, 32, 5, (r, g, b) => lum(r, g, b) > 120 && b > r, fur); // painted ear bumps on the head sides
  recolorWhere(A, 32, 0, 32, 16, (r, g, b) => !(lum(r, g, b) > 200) && !(g > r + 60 && g > b + 60), null); // hat: keep only white hair + green streak
  const ch = new Character('roxy', A);
  earPair(ch, ['.o..', 'ooo.', 'oioo', 'oiio', 'oiio', 'oooo'], { o: fur, i: '#9a6ad0' }, 0.75, 1.0, 2.9, 8.2, -0.8, 0.28);
  const sn = new THREE.Group(); sn.position.set(0, 2.4 * U, 4 * U); ch.head.add(sn); ch.snout = sn;
  vbox(3.8, 2.0, 1.8, '#c8ccd8', 0, 0, 0.9, sn, 0.6); vbox(1.4, 0.8, 0.5, '#7a3ac8', 0, 0.75, 1.85, sn, 0.4);
  for (const x of [-1.2, 1.2]) vbox(0.45, 0.8, 0.4, '#ffffff', x, -1.1, 1.6, sn, 0.4);
  const jaw = new THREE.Group(); jaw.position.set(0, -1.1 * U, 0); sn.add(jaw); ch.jaw = jaw; vbox(3.4, 0.7, 1.5, '#b0b4c2', 0, -0.35, 0.75, jaw, 0.6);
  ch.baseScale = 1.3;
  return finish(ch);
}

// Montgomery Gator: long 3D snout with teeth, red mohawk, purple star glasses, claws.
export function buildMonty(canvas) {
  const A = imgCopy(canvas);
  const green = avgColor(A, 0, 10, 8, 3), gd = shadeHex(green, 0.7), yel = '#e8d23a';
  recolorWhere(A, 8, 0, 8, 8, (r, g, b) => r > g, green); recolorWhere(A, 8, 8, 8, 1.5, (r, g, b) => r > g, green); recolorWhere(A, 16, 8, 8, 2, (r, g, b) => r > g, green); recolorWhere(A, 0, 8, 8, 2, (r, g, b) => r > g, green); recolorWhere(A, 24, 8, 8, 2, (r, g, b) => r > g, green);
  eraseRect(A, 32, 0, 32, 16);
  const ch = new Character('monty', A, { prop: { limbW: 1.15, legW: 1.1, torso: 1.05 } });
  const sn = new THREE.Group(); sn.position.set(0, 2.6 * U, 4 * U); ch.head.add(sn); ch.snout = sn;
  vbox(6.0, 1.8, 4.6, green, 0, 0, 2.3, sn, 0.6); vbox(5.2, 0.4, 4.2, shadeHex(green, 1.12), 0, 1.0, 2.3, sn, 0.6);
  for (const x of [-1.3, 1.3]) vbox(0.8, 0.5, 0.8, '#1a2a0a', x, 1.05, 4.2, sn, 0.4);
  for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) vbox(0.5, 0.8, 0.5, '#ffffff', sx * 2.7, -1.15, 0.8 + i * 0.85, sn, 0.4);
  for (let i = -2; i <= 2; i++) vbox(0.5, 0.8, 0.5, '#ffffff', i * 1.05, -1.15, 4.35, sn, 0.4);
  const jaw = new THREE.Group(); jaw.position.set(0, -1.4 * U, 0.3 * U); sn.add(jaw); ch.jaw = jaw;
  vbox(5.6, 1.1, 4.3, green, 0, -0.45, 2.15, jaw, 0.6); vbox(5.7, 0.5, 4.4, yel, 0, -1.05, 2.15, jaw, 0.6); vbox(4.6, 0.2, 3.6, '#b8202a', 0, 0.12, 2.1, jaw, 0.6);
  for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) vbox(0.45, 0.7, 0.45, '#ffffff', sx * 2.4, 0.45, 1.0 + i * 0.95, jaw, 0.4);
  // mohawk
  const mo = ['#e83a1a', '#ff6a2a', '#c8201a'];
  for (let i = 0; i < 6; i++) { const h = [2.2, 3.0, 3.4, 3.0, 2.4, 1.8][i]; const b = vbox(1.2, h, 1.3, mo[i % 3], 0, 8 + h / 2 - 0.3, 3.2 - i * 1.4, ch.head, 0.6); b.rotation.x = -0.25; }
  // star glasses
  const star = ['..g..', '.gpg.', 'gpppg', '.gpg.', 'g...g'];
  for (const x of [-2.1, 2.1]) { const st = voxelArt(star, { g: '#e8b02a', p: '#5a1a9a' }, 0.75 * U, 0.6 * U); st.position.set(x * U, 5.0 * U, 4.3 * U); ch.head.add(st); }
  vbox(1.6, 0.4, 0.4, '#e8b02a', 0, 5.4, 4.3, ch.head, 0.4); for (const sx of [-1, 1]) vbox(0.4, 0.4, 3.0, '#e8b02a', sx * 4.1, 5.2, 2.8, ch.head, 0.4);
  // claws
  for (const hand of [ch.handR, ch.handL]) for (let k = -1; k <= 1; k++) { const c = vbox(0.6, 1.8, 0.6, '#f2f0d8', k * 1.2, -1.2, 1.4, hand, 0.4); c.rotation.x = 0.5; }
  ch.baseScale = 1.4;
  return finish(ch);
}

// Glamrock Chica: 3D beak (opening), white head tuft with pink clip, green earrings.
export function buildGChica(canvas) {
  const A = imgCopy(canvas);
  eraseRect(A, 32, 0, 32, 16);
  const ch = new Character('gchica', A);
  const sn = new THREE.Group(); sn.position.set(0, 2.6 * U, 4 * U); ch.head.add(sn); ch.snout = sn;
  vbox(4.4, 1.4, 2.4, '#f0a020', 0, 0.3, 1.2, sn, 0.5); vbox(3.2, 0.6, 1.0, '#d88010', 0, 0.9, 2.2, sn, 0.5);
  const jaw = new THREE.Group(); jaw.position.set(0, -0.6 * U, 0); sn.add(jaw); ch.jaw = jaw; vbox(3.8, 0.9, 2.0, '#e89018', 0, -0.4, 1.0, jaw, 0.5); vbox(2.4, 0.3, 1.2, '#ff7ab0', 0, 0.05, 0.9, jaw, 0.5);
  for (const [x, h, r] of [[-0.9, 2.2, 0.35], [0.1, 2.8, 0], [1.1, 2.0, -0.4]]) { const b = vbox(1.0, h, 1.0, '#f6f6f6', x, 8 + h / 2 - 0.3, 2.2, ch.head, 0.7); b.rotation.z = r; }
  const bow = voxelArt(['p.p', 'ppp', 'p.p'], { p: '#d8287a' }, 0.6 * U, 0.6 * U); bow.position.set(2.0 * U, 8.6 * U, 2.4 * U); ch.head.add(bow);
  for (const sx of [-1, 1]) { vbox(0.4, 1.0, 0.4, '#e8c03a', sx * 4.25, 2.6, 0.5, ch.head, 0.3); vbox(1.0, 1.0, 1.0, '#6ac83a', sx * 4.35, 1.6, 0.5, ch.head, 0.4); }
  ch.baseScale = 1.3;
  return finish(ch);
}

// Cassie: painted puffs (hat layer) removed; two modest 3D hair puffs + thin cap.
export function buildCassie(canvas) {
  const A = imgCopy(canvas);
  const hair = avgColor(A, 8, 0, 8, 8);
  eraseRect(A, 32, 0, 32, 16);
  const ch = new Character('cassie', A);
  const hd = shadeHex(hair, 0.8), hl = shadeHex(hair, 1.15);
  vbox(8.5, 0.5, 8.5, hair, 0, 8.25, 0, ch.head, 0.9);
  for (const sx of [-1, 1]) { const p = new THREE.Group(); p.position.set(sx * 2.7 * U, 9.3 * U, -0.8 * U); ch.head.add(p);
    vbox(3.0, 2.2, 3.0, hair, 0, 0, 0, p, 0.95); vbox(2.2, 0.8, 2.2, hl, 0, 1.3, 0, p, 0.95); vbox(3.4, 1.2, 2.2, hd, 0, -0.2, 0, p, 0.95); vbox(2.6, 0.5, 2.6, '#7a3ac8', 0, -1.2, 0, p, 0.5); }
  ch.baseScale = 0.86;
  return finish(ch);
}

// Golden Freddy statue (atrium): gold-tinted Glamrock Freddy, metallic.
export function goldSkin(canvas) {
  const A = imgCopy(canvas); const g = A.getContext('2d'); const d = g.getImageData(0, 0, A.width, A.height);
  for (let i = 0; i < d.data.length; i += 4) { if (d.data[i + 3] < 128) continue; const l = lum(d.data[i], d.data[i + 1], d.data[i + 2]) / 255; const k = 0.35 + 0.75 * l;
    d.data[i] = Math.min(255, 235 * k); d.data[i + 1] = Math.min(255, 168 * k); d.data[i + 2] = Math.min(255, 52 * k); }
  g.putImageData(d, 0, 0); return A;
}
export function metalize(ch, m = 0.85, r = 0.32) { ch.root.traverse(o => { if (o.isMesh && o.material) { o.material.metalness = m; o.material.roughness = r; if (o.material.color && o.material !== ch.mat && o.material !== ch.matO) o.material.color.set('#c89a30'); } }); return ch; }

// ======================= Glamrock Freddy / Michael video =======================
// Chest hatch on Glamrock Freddy: dark cavity + endo + two curved doors that swing open (hidden when closed).
export function addChestHatch(ch) {
  const h = new THREE.Group(); h.position.set(0, 5.6 * U, 2.02 * U); ch.torso.add(h); ch.hatch = h;
  const cav = new THREE.Group(); h.add(cav);
  vbox(6.4, 7.6, 0.2, '#0c0d10', 0, 0, 0.05, cav, 0.9);
  const met = '#7a808c', dk = '#2a2d34';
  vbox(0.8, 6.4, 0.4, met, 0, -0.2, 0.25, cav, 0.35); vbox(4.6, 0.6, 0.4, met, 0, 1.6, 0.25, cav, 0.35); vbox(4.0, 0.6, 0.4, met, 0, -1.8, 0.25, cav, 0.35);
  for (const sx of [-1, 1]) { vbox(0.5, 3.2, 0.3, met, sx * 1.6, 0, 0.3, cav, 0.35).rotation.z = sx * 0.35; vbox(1.0, 1.0, 0.5, dk, sx * 2.2, 2.6, 0.3, cav, 0.4); }
  vbox(2.0, 1.0, 0.3, '#3a3d44', 0, -3.1, 0.3, cav, 0.5); vbox(1.2, 0.3, 0.32, '#5ad8ff', 0, -3.1, 0.47, cav, 0.3, '#5ad8ff');
  vbox(6.8, 0.7, 0.6, '#f2ece2', 0, 3.95, 0.25, cav, 0.4); // white collar ring
  ch.hatchLight = new THREE.PointLight('#8ad8ff', 0, 1.6, 2); ch.hatchLight.position.set(0, 0, 0.3 * U); h.add(ch.hatchLight);
  ch.doors = [];
  for (const sx of [-1, 1]) { const d = new THREE.Group(); d.position.set(sx * 3.3 * U, 0, 0.3 * U); h.add(d); ch.doors.push(d);
    const p = vbox(3.3, 7.4, 0.5, '#e8843a', -sx * 1.65, 0, 0, d, 0.5); vbox(3.1, 7.0, 0.1, '#d87430', -sx * 1.65, 0, 0.3, d, 0.5); vbox(0.4, 7.4, 0.55, '#f2ece2', -sx * 0.2, 0, 0.02, d, 0.4); }
  ch.setHatch = k => { h.visible = k > 0.01; ch.doors[0].rotation.y = -1.9 * k; ch.doors[1].rotation.y = 1.9 * k; ch.hatchLight.intensity = 1.6 * k; };
  ch.setHatch(0); ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return ch;
}
// Freddy eye glow overlay (two thin emissive plates over the painted eyes) — colour for safe mode / Michael.
export function addEyeGlow(ch, y = 4.6, dx = 1.9, z = 4.08) {
  const m = new THREE.MeshBasicMaterial({ color: '#000000', toneMapped: false, transparent: true, opacity: 0 }); ch.eyeMat = m;
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(1.2 * U, 1.2 * U, 0.1 * U), m); e.position.set(sx * dx * U, y * U, z * U); ch.head.add(e); }
  ch.setEyeGlow = (c, k) => { m.color.set(c); m.opacity = k; }; ch.setEyeGlow('#000', 0); return ch;
}
// Glitchtrap: painted ears (hat top + ear stubs) removed, tall 3D rabbit ears.
export function buildGlitchtrap(canvas) {
  const A = imgCopy(canvas);
  eraseRect(A, 32, 0, 32, 8); eraseRect(A, 48, 8, 16, 3); eraseRect(A, 32, 8, 8, 3);
  const ch = new Character('glitchtrap', A);
  const P = { o: '#b88a3a', d: '#8a6428', i: '#e2c288' };
  earPair(ch, ['.oo.', 'oiio', 'oiio', 'oiio', 'oiio', 'oiio', 'oiio', 'oiio', 'oddo', '.oo.'], P, 0.62, 1.0, 2.0, 8.0, -0.6, 0.18);
  ch.earR.rotation.x = -0.35; ch.baseScale = 1.25;
  return finish(ch);
}
