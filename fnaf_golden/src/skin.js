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
    this.head.rotation.set(0, 0, 0); this.torso.rotation.set(0, 0, 0); this.pelvis.position.y = 12 * U;
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

export function buildBonnie(canvas) {
  const A = imgCopy(canvas);
  // erase flat painted ear art on the hat top so the 3D ears are the only ears
  eraseRect(A, 40, 0, 8, 8);
  const ch = new Character('bonnie', A);
  const P = { b: '#2f7fd8', l: '#5aa6f0', d: '#1d5fb0', w: '#e8eef6', p: '#f2a7c3' };
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

export function buildFreddy(canvas) {
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
  const P = { o: '#d86a20', d: '#a8501a', l: '#f2a65a' };
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

// Generic bear-shaped rig (Freddy, Golden Freddy, Withered Golden Freddy): 3D ears,
// an optional 3D top hat, and a detachable face mask over a dark glowing cavity.
export function buildBear(canvas, name, opts = {}) {
  const A = imgCopy(canvas);
  const s = A.width / 64; const g = A.getContext('2d');
  const earHex = opts.earColor || sampleColor(A, 20, 12);
  if (opts.hat !== false) {
    g.fillStyle = earHex;
    g.fillRect(8 * s, 0, 8 * s, 8 * s); // top of head
    for (const [x] of [[0], [16], [24]]) {
      const d = g.getImageData(x * s, 8 * s, 8 * s, 8 * s);
      for (let i = 0; i < d.data.length; i += 4) {
        const r = d.data[i], gg = d.data[i + 1], b = d.data[i + 2];
        const darkOrRed = (r < 90 && gg < 90 && b < 90) || (r > 150 && gg < 60 && b < 60);
        if (darkOrRed) { const c = hexToRgb(g.fillStyle); d.data.set([c[0], c[1], c[2], 255], i); }
      }
      g.putImageData(d, x * s, 8 * s);
    }
    eraseRect(A, 32, 0, 32, 8); eraseRect(A, 32, 8, 8, 8); eraseRect(A, 48, 8, 16, 8);
  }
  // carve a dark cavity where the face mask sits (front 8x8 of the head, UV 8,8)
  const fx = 8 * s, fy = 8 * s, fw = 8 * s, fh = 8 * s;
  const maskCanvas = document.createElement('canvas'); maskCanvas.width = fw; maskCanvas.height = fh;
  maskCanvas.getContext('2d').drawImage(A, fx, fy, fw, fh, 0, 0, fw, fh);
  const fd = g.getImageData(fx, fy, fw, fh);
  for (let i = 0; i < fd.data.length; i += 4) { fd.data[i] = 6; fd.data[i + 1] = 5; fd.data[i + 2] = 8; fd.data[i + 3] = 255; }
  g.putImageData(fd, fx, fy);

  const ch = new Character(name, A);
  if (opts.hat !== false) {
    const hat = new THREE.Group();
    const hc = opts.hatColors || { crown: '#1b1b1f', band: '#c81e2a', brim: '#1b1b1f' };
    const crown = solidBox(4, 3.2, 4, hc.crown, 0.55); crown.position.y = 1.6 * U + 0.8 * U;
    const band = solidBox(4.2, 0.8, 4.2, hc.band, 0.5); band.position.y = 1.2 * U;
    const brim = solidBox(6, 0.6, 6, hc.brim, 0.55); brim.position.y = 0.3 * U;
    hat.add(brim, band, crown); hat.position.set(0.4 * U, 8.05 * U, 0.3 * U); hat.rotation.z = -0.08;
    ch.head.add(hat); ch.topHat = hat;
  }
  const P = opts.earPalette || { o: earHex, d: shade(earHex, 0.65), l: shade(earHex, 1.25) };
  const ear = () => voxelArt(['.oooo.', 'oddddo', 'odlldo', 'odlldo', 'oooooo'], P, 0.5 * U, 1.2 * U);
  const eL = ear(), eR = ear();
  eL.position.set(3.3 * U, 8.9 * U, -0.6 * U); eR.position.set(-3.3 * U, 8.9 * U, -0.6 * U);
  eL.rotation.z = -0.2; eR.rotation.z = 0.2;
  ch.head.add(eL, eR); ch.earL = eL; ch.earR = eR;

  // detachable face mask + cavity with glowing eye dots
  const px = U / s;
  const mask = new THREE.Mesh(
    new THREE.PlaneGeometry(fw * px, fh * px),
    new THREE.MeshStandardMaterial({ map: pixelTexture(maskCanvas), roughness: 0.78, alphaTest: 0.5, side: THREE.DoubleSide })
  );
  mask.castShadow = true; mask.receiveShadow = true;
  const maskGroup = new THREE.Group(); maskGroup.add(mask); maskGroup.position.set(0, 4 * U, 4 * U + 0.06 * U);
  ch.head.add(maskGroup); ch.mask = maskGroup; ch.maskMesh = mask;
  ch.maskHome = { parent: ch.head, pos: maskGroup.position.clone() };

  const glowMat = new THREE.MeshBasicMaterial({ color: '#bfe8ff', toneMapped: false });
  const eyeGlowL = new THREE.Mesh(new THREE.CircleGeometry(0.6 * px, 10), glowMat);
  const eyeGlowR = eyeGlowL.clone();
  eyeGlowL.position.set(1.4 * px, 1.2 * px, 4 * U + 0.03 * U); eyeGlowR.position.set(-1.4 * px, 1.2 * px, 4 * U + 0.03 * U);
  eyeGlowL.visible = eyeGlowR.visible = false;
  ch.head.add(eyeGlowL, eyeGlowR); ch.eyeGlow = [eyeGlowL, eyeGlowR];
  const cavityLight = new THREE.PointLight('#bfe8ff', 0, 0.9, 2); cavityLight.position.set(0, 4 * U, 4 * U);
  ch.head.add(cavityLight); ch.cavityLight = cavityLight;

  ch.root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return ch;
}
function shade(hex, f) { const [r, g2, b] = hexToRgb(hex); const c = v => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(r)},${c(g2)},${c(b)})`; }
