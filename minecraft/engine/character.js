// Boneco de Minecraft a partir de uma skin 64x64 (layout padrão, braços clássicos de 4px)
import * as THREE from 'three';
import { nearestTex } from './textures.js';
import { obbOf, sat } from './collide.js';

const PX = 1 / 16 * 0.9375;

// Caixa com UV de skin. dims em px, origem (u,v) do layout. inflate em px. Frente = +z.
export function skinBox(w, h, d, u, v, TW, TH, inflate = 0, mirror = false) {
  const x0 = -w / 2 - inflate, x1 = w / 2 + inflate, y0 = -inflate, y1 = h + inflate, z0 = -d / 2 - inflate, z1 = d / 2 + inflate;
  const R = (ru, rv, rw, rh) => [ru / TW, 1 - rv / TH, (ru + rw) / TW, 1 - (rv + rh) / TH]; // u0, vTop, u1, vBot
  const faces = [
    { n: [0, 0, 1], c: [[x0, y1, z1], [x1, y1, z1], [x1, y0, z1], [x0, y0, z1]], r: R(u + d, v + d, w, h) },
    { n: [0, 0, -1], c: [[x1, y1, z0], [x0, y1, z0], [x0, y0, z0], [x1, y0, z0]], r: R(u + 2 * d + w, v + d, w, h) },
    { n: [-1, 0, 0], c: [[x0, y1, z0], [x0, y1, z1], [x0, y0, z1], [x0, y0, z0]], r: R(u, v + d, d, h) },
    { n: [1, 0, 0], c: [[x1, y1, z1], [x1, y1, z0], [x1, y0, z0], [x1, y0, z1]], r: R(u + d + w, v + d, d, h) },
    { n: [0, 1, 0], c: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], r: R(u + d, v, w, d) },
    { n: [0, -1, 0], c: [[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]], r: R(u + d + w, v, w, d) },
  ];
  const p = [], n = [], uv = [], idx = [];
  for (const f of faces) {
    let [u0, vt, u1, vb] = f.r; if (mirror) [u0, u1] = [u1, u0];
    const b = p.length / 3;
    const uvs = [[u0, vt], [u1, vt], [u1, vb], [u0, vb]];
    f.c.forEach((c, i) => { p.push(...c); n.push(...f.n); uv.push(...uvs[i]); });
    const A = new THREE.Vector3(...f.c[0]), B = new THREE.Vector3(...f.c[3]), C = new THREE.Vector3(...f.c[2]);
    const nn = B.clone().sub(A).cross(C.clone().sub(A));
    if (nn.dot(new THREE.Vector3(...f.n)) >= 0) idx.push(b, b + 3, b + 2, b, b + 2, b + 1); else idx.push(b, b + 2, b + 3, b, b + 1, b + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); return g;
}

// Carrega skin; overlays com preto puro (sem alpha no PNG) viram transparentes
export async function loadSkin(url) {
  const img = await new Promise((r, e) => { const i = new Image(); i.onload = () => r(i); i.onerror = e; i.src = url; });
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, 64, 64);
  const overlay = [[32, 0, 32, 16], [16, 32, 24, 16], [40, 32, 16, 16], [0, 32, 16, 16], [0, 48, 16, 16], [48, 48, 16, 16]];
  for (const [x, y, w, h] of overlay) for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { const k = (j * 64 + i) * 4; if (d.data[k] + d.data[k + 1] + d.data[k + 2] < 6) d.data[k + 3] = 0; }
  g.putImageData(d, 0, 0); return c;
}

export class Character {
  // opts: {skin: canvas, name, headScale, bodyScale, face:{eyes:[[x,y,w,h]..], skin:[r,g,b], lash:[r,g,b], mouth:[x,y,w]}, zombieArms}
  constructor(opts) {
    this.o = opts; this.base = opts.skin;
    this.canvas = document.createElement('canvas'); this.canvas.width = 64; this.canvas.height = 64;
    this.ctx = this.canvas.getContext('2d'); this.ctx.drawImage(this.base, 0, 0);
    this.tex = nearestTex(this.canvas);
    const mat = new THREE.MeshStandardMaterial({ map: this.tex, roughness: 0.85 });
    const omat = new THREE.MeshStandardMaterial({ map: this.tex, roughness: 0.85, alphaTest: 0.5 });
    this.mats = [mat, omat];
    const s = opts.bodyScale || 1, hs = opts.headScale || 1;
    const root = this.root = new THREE.Group();
    const scaleG = this.scaleG = new THREE.Group(); scaleG.scale.setScalar(PX); root.add(scaleG);
    const part = (parent, geo, m) => { const mesh = new THREE.Mesh(geo, m); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh; };
    const G = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
    // pernas
    this.rHip = G(scaleG, -2 * s, 12 * s, 0); this.lHip = G(scaleG, 2 * s, 12 * s, 0);
    for (const [hip, u, v, ou, ov] of [[this.rHip, 0, 16, 0, 32], [this.lHip, 16, 48, 0, 48]]) {
      const g = G(hip, 0, -12 * s, 0); g.scale.setScalar(s);
      part(g, skinBox(4, 12, 4, u, v, 64, 64), mat); part(g, skinBox(4, 12, 4, ou, ov, 64, 64, 0.25), omat); hip.userData.inner = g;
    }
    // quadril/torso
    this.hips = G(scaleG, 0, 12 * s, 0);
    const torso = G(this.hips, 0, 0, 0); torso.scale.setScalar(s); this.torsoG = torso;
    part(torso, skinBox(8, 12, 4, 16, 16, 64, 64), mat); part(torso, skinBox(8, 12, 4, 16, 32, 64, 64, 0.25), omat);
    this.neck = G(this.hips, 0, 12 * s, 0);
    const head = G(this.neck, 0, 0, 0); head.scale.setScalar(hs); this.headG = head;
    part(head, skinBox(8, 8, 8, 0, 0, 64, 64), mat); part(head, skinBox(8, 8, 8, 32, 0, 64, 64, 0.5), omat);
    this.rSh = G(this.hips, -5 * s, 10 * s, 0); this.lSh = G(this.hips, 5 * s, 10 * s, 0);
    for (const [sh, u, v, ou, ov, dx] of [[this.rSh, 40, 16, 40, 32, -1], [this.lSh, 32, 48, 48, 48, 1]]) {
      const g = G(sh, dx * s, -10 * s, 0); g.scale.setScalar(s);
      part(g, skinBox(4, 12, 4, u, v, 64, 64), mat); part(g, skinBox(4, 12, 4, ou, ov, 64, 64, 0.25), omat); sh.userData.inner = g;
    }
    // mão: ponto para segurar itens (no fim do braço)
    this.rHand = G(this.rSh.userData.inner, 0, 1, 0); this.lHand = G(this.lSh.userData.inner, 0, 1, 0);
    this.s = s; this.hs = hs;
    this.height = (24 * s + 8 * hs) * PX;
    this.faceState = { blink: 0, mouth: 0, brow: null };
    this.lastFace = '';
  }
  // pose: valores em radianos; campos opcionais
  pose(P) {
    const z = (g, r) => g.rotation.set(r?.[0] || 0, r?.[1] || 0, r?.[2] || 0, 'XYZ');
    z(this.neck, P.head); z(this.hips, P.body); z(this.rSh, P.rArm); z(this.lSh, P.lArm); z(this.rHip, P.rLeg); z(this.lHip, P.lLeg);
    this.hips.position.y = 12 * this.s + (P.bob || 0);
    this.rHip.position.y = this.lHip.position.y = 12 * this.s + (P.bob || 0);
    this.face(P.blink || 0, P.mouth || 0, P.brow || null);
    this.solve();
  }
  // solver: nenhum braço atravessa torso, cabeça ou pernas (afasta/abaixa o braço o mínimo necessário)
  solve() {
    const first = g => g.children.find(c => c.isMesh);
    if (!this._p) this._p = { torso: first(this.torsoG), head: first(this.headG), rArm: first(this.rSh.userData.inner), lArm: first(this.lSh.userData.inner), rLeg: first(this.rHip.userData.inner), lLeg: first(this.lHip.userData.inner) };
    const p = this._p; const sh = 0.003; // solver mais rígido que a checagem
    for (const [arm, sh_, sign] of [['rArm', this.rSh, -1], ['lArm', this.lSh, 1]]) {
      for (let it = 0; it < 60; it++) {
        this.root.updateWorldMatrix(true, true);
        const A = obbOf(p[arm], sh, 3); // parte visível do braço (sem a junta do ombro)
        const hitT = sat(A, obbOf(p.torso, sh)), hitH = sat(A, obbOf(p.head, sh));
        const hitL = sat(A, obbOf(p.rLeg, sh, 1)) || sat(A, obbOf(p.lLeg, sh, 1));
        if (!hitT && !hitH && !hitL) break;
        if (hitH && sh_.rotation.x < -0.2) sh_.rotation.x += 0.02; // braço erguido: abaixa um pouco
        else sh_.rotation.z += sign * 0.02; // abre o braço para fora
      }
    }
  }
  face(blink, mouth, brow) {
    const key = `${blink > .5}|${Math.round(mouth * 2)}|${brow}`; if (key === this.lastFace) return; this.lastFace = key;
    const g = this.ctx, F = this.o.face; g.clearRect(0, 0, 64, 64); g.drawImage(this.base, 0, 0);
    if (F) {
      const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
      if (blink > .5) for (const [x, y, w, h] of F.eyes) { g.fillStyle = rgb(F.skin); g.fillRect(x, y, w, h); g.fillStyle = rgb(F.lash); g.fillRect(x, y + h - 1, w, 1); }
      if (brow && !(blink > .5)) {
        g.fillStyle = rgb(F.lash);
        const [l, r] = F.eyes; // sobrancelha: pixel escuro no topo do olho (canto interno = raiva, externo = medo/tristeza)
        if (brow === 'angry') { g.fillRect(l[0] + l[2] - 1, l[1], 1, 1); g.fillRect(r[0], r[1], 1, 1); }
        if (brow === 'sad') { g.fillRect(l[0], l[1], 1, 1); g.fillRect(r[0] + r[2] - 1, r[1], 1, 1); }
      }
      const m = Math.round(mouth * 2);
      if (m > 0) { const [x, y, w] = F.mouth; g.fillStyle = 'rgb(60,18,18)'; if (m === 1) g.fillRect(x + 1, y, w - 2, 1); else { g.fillRect(x, y - 1, w, 2); g.fillStyle = 'rgb(150,40,40)'; g.fillRect(x + 1, y, w - 2, 1); } }
    }
    this.tex.needsUpdate = true;
  }
  // tinta vermelha de dano (igual ao Minecraft)
  hurt(a) { for (const m of this.mats) { m.emissive = m.emissive || new THREE.Color(); m.emissive.setRGB(0.75 * a, 0, 0); m.color.setRGB(1, 1 - 0.6 * a, 1 - 0.6 * a); } if (this.armorMats) for (const m of this.armorMats) { m.emissive.setRGB(.75 * a, 0, 0); } }
}

// ---- Skin de zumbi (desenhada pixel a pixel) -----------------------------
export function zombieSkin() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
  let s = 7; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const fill = (x, y, w, h, pal) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { g.fillStyle = pal[Math.floor(R() * pal.length)]; g.fillRect(i, j, 1, 1); } };
  const GREEN = ['#4c7a34', '#467030', '#52843a', '#3f6a2c', '#5a8d41'];
  const SHIRT = ['#00a6a6', '#009b9b', '#00afaf', '#0a9191'];
  const PANTS = ['#463aa5', '#3f3496', '#4b40b0', '#382e87'];
  fill(0, 0, 32, 16, GREEN); // cabeça
  // rosto (frente 8..16, 8..16)
  g.fillStyle = '#1b2a12'; g.fillRect(9, 12, 2, 1); g.fillRect(13, 12, 2, 1); // olhos fundos
  g.fillStyle = '#0d150a'; g.fillRect(9, 13, 2, 1); g.fillRect(13, 13, 2, 1);
  g.fillStyle = '#2f5221'; g.fillRect(11, 13, 2, 1); g.fillRect(11, 14, 2, 1); // nariz
  g.fillStyle = '#2a4a1e'; g.fillRect(10, 15, 4, 1); // boca
  fill(16, 16, 24, 16, SHIRT); fill(16, 16, 24, 1, SHIRT); // tronco
  fill(20, 16, 8, 4, SHIRT);
  fill(0, 16, 16, 16, PANTS); fill(16, 48, 16, 16, PANTS); // pernas
  fill(0, 16 + 4 + 9, 16, 3, ['#2d2668', '#332b73']); fill(16, 48 + 4 + 9, 16, 3, ['#2d2668', '#332b73']); // pés mais escuros
  fill(40, 16, 16, 16, GREEN); fill(32, 48, 16, 16, GREEN); // braços
  fill(40, 20, 16, 3, SHIRT); fill(32, 52, 16, 3, SHIRT); fill(44, 16, 4, 4, SHIRT); fill(36, 48, 4, 4, SHIRT); // mangas
  // calça: cintura/barra inferior do tronco
  fill(16, 20 + 9, 24, 3, PANTS);
  return c;
}

// ---- Armadura de ouro (texturas próprias, estilo Minecraft) ---------------
function goldCanvas(w, h, holes) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  let s = 99; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const pal = ['#e3b026', '#d49e1d', '#eec23a', '#bf8a16'];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { g.fillStyle = pal[Math.floor(R() * pal.length)]; g.fillRect(x, y, 1, 1); }
  return c;
}
export function goldArmor(ch) {
  // Cada peça é uma caixa simples, ligeiramente maior que a parte do corpo, com textura dourada e bordas sombreadas
  const mk = (w, h, d, opts = {}) => {
    const tw = 2 * (w + d), th = h + d; const c = goldCanvas(tw, th); const g = c.getContext('2d');
    // bordas: claras em cima/esquerda, escuras embaixo
    g.fillStyle = '#f5da6a'; g.fillRect(0, d, tw, 1);
    g.fillStyle = '#b37a1a'; g.fillRect(0, th - 1, tw, 1);
    for (const x of [d, d + w, 2 * d + w]) { g.fillStyle = 'rgba(160,110,20,.6)'; g.fillRect(x - 1, d, 1, h); }
    if (opts.helmetFront) { // abertura do rosto na frente
      g.clearRect(d + 1, d + opts.helmetFront, w - 2, h - opts.helmetFront);
      g.fillStyle = '#a06a14'; g.fillRect(d + 1, d + opts.helmetFront - 1, w - 2, 1);
      for (const side of [0, d + w]) g.clearRect(side, d + h - 2, d, 2); // laterais abertas embaixo
      g.clearRect(2 * d + w, d + h - 1, w, 1);
    }
    if (opts.openBottom) g.clearRect(d + w, 0, w, d);
    if (opts.openTop) g.clearRect(d, 0, w, d);
    const t = nearestTex(c);
    return { geo: skinBox(w, h, d, 0, 0, tw, th), tex: t };
  };
  const env = window.ENV_MAP;
  const mats = [];
  const add = (parent, piece, y, inflate = 1.0, scl = 1) => {
    const m = new THREE.MeshStandardMaterial({ map: piece.tex, metalness: 0.55, roughness: 0.42, envMap: env, envMapIntensity: 0.22, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color(0, 0, 0) });
    mats.push(m);
    const mesh = new THREE.Mesh(piece.geo, m); mesh.castShadow = true; mesh.position.y = y; parent.add(mesh); return mesh;
  };
  // capacete: cabeça 8x8x8 -> 9x9x9
  const helm = mk(9, 9, 9, { helmetFront: 3, openBottom: true });
  const hm = add(ch.headG, helm, -0.5); hm.position.y = -0.5;
  // peitoral
  const chest = mk(9, 12.6, 5, { openBottom: true }); add(ch.torsoG, chest, -0.1);
  // ombreiras/braços
  for (const sh of [ch.rSh, ch.lSh]) { const a = mk(5, 6.5, 5, { openBottom: true }); add(sh.userData.inner, a, 6); }
  // botas e perneiras
  for (const hip of [ch.rHip, ch.lHip]) { const b = mk(5, 5, 5, {}); add(hip.userData.inner, b, -0.5); const l = mk(4.6, 7, 4.6, { openBottom: true, openTop: true }); add(hip.userData.inner, l, 5); }
  ch.armorMats = mats;
}

// Nome flutuante (nametag) estilo Minecraft
export function nameTag(text, drawText) {
  const scale = 4; const w = (drawText.measure(text) + 2) * scale, h = 10 * scale;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, w, h);
  drawText(g, text, scale, scale, scale, '#ffffff', false);
  const t = nearestTex(c);
  const m = new THREE.SpriteMaterial({ map: t, depthWrite: false, transparent: true, color: 0xd8d8d8 });
  const sp = new THREE.Sprite(m); sp.scale.set(w / h * 0.2, 0.2, 1); sp.renderOrder = 10;
  return sp;
}
