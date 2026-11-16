// Mundo de voxels com culling de faces e oclusão de ambiente (AO) por vértice, igual ao "smooth lighting" do Minecraft
import * as THREE from 'three';
import { TILE, ATLAS_SIZE, atlasTex } from './textures.js';

// tipo: o=opaco, c=cutout (folhas/vidro), x=cruz (teia), w=água, e=emissivo
export const BLOCKS = {
  stone: { t: 'o' }, dirt: { t: 'o' }, grass: { t: 'o', top: 'grass_top', side: 'grass_side', bottom: 'dirt' },
  cobblestone: { t: 'o' }, deepslate: { t: 'o', top: 'deepslate_top' }, oak_planks: { t: 'o' }, spruce_planks: { t: 'o' },
  oak_log: { t: 'o', top: 'oak_log_top', bottom: 'oak_log_top' }, dark_oak_log: { t: 'o', top: 'oak_log_top', bottom: 'oak_log_top' },
  oak_leaves: { t: 'c' }, stone_bricks: { t: 'o' }, gold_block: { t: 'o' }, diamond_ore: { t: 'o' }, iron_ore: { t: 'o' },
  coal_ore: { t: 'o' }, gold_ore: { t: 'o' }, gravel: { t: 'o' }, sand: { t: 'o' }, water: { t: 'w' }, lava: { t: 'e' },
  obsidian: { t: 'o' }, end_stone: { t: 'o' }, bedrock: { t: 'o' }, cobweb: { t: 'x' }, glass: { t: 'c' }, sculk: { t: 'o' },
  red_wool: { t: 'o' }, glowstone: { t: 'e' }, chest: { t: 'o', top: 'chest_side', side: 'chest_side' }, black: { t: 'o' },
  netherrack: { t: 'o' }, mossy: { t: 'o' }, rail: { t: 'x' },
};
const FACES = [
  { n: [0, 0, 1], c: [[0, 1, 1], [1, 1, 1], [1, 0, 1], [0, 0, 1]], k: 'side' },
  { n: [0, 0, -1], c: [[1, 1, 0], [0, 1, 0], [0, 0, 0], [1, 0, 0]], k: 'side' },
  { n: [1, 0, 0], c: [[1, 1, 1], [1, 1, 0], [1, 0, 0], [1, 0, 1]], k: 'side' },
  { n: [-1, 0, 0], c: [[0, 1, 0], [0, 1, 1], [0, 0, 1], [0, 0, 0]], k: 'side' },
  { n: [0, 1, 0], c: [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], k: 'top' },
  { n: [0, -1, 0], c: [[0, 0, 1], [1, 0, 1], [1, 0, 0], [0, 0, 0]], k: 'bottom' },
];
// garante a ordem anti-horária vista de fora
for (const f of FACES) {
  const [a, b, c] = [f.c[0], f.c[3], f.c[2]].map(v => new THREE.Vector3(...v));
  const nn = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
  f.flip = nn.dot(new THREE.Vector3(...f.n)) < 0;
}
const AO = [0.42, 0.62, 0.8, 1.0];

export class World {
  constructor() { this.m = new Map(); }
  key(x, y, z) { return (x + 512) * 1048576 + (y + 256) * 1024 + (z + 512); }
  set(x, y, z, id) { if (id) this.m.set(this.key(x, y, z), id); else this.m.delete(this.key(x, y, z)); }
  get(x, y, z) { return this.m.get(this.key(x, y, z)); }
  box(x0, y0, z0, x1, y1, z1, id) { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) this.set(x, y, z, id); }
  hollow(x0, y0, z0, x1, y1, z1, id) { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) if (x === x0 || x === x1 || z === z0 || z === z1) this.set(x, y, z, id); }
  opaque(x, y, z) { const id = this.get(x, y, z); return !!id && (BLOCKS[id].t === 'o' || BLOCKS[id].t === 'e'); }
  forEach(fn) { for (const [k, id] of this.m) { const z = (k % 1024) - 512, y = (Math.floor(k / 1024) % 1024) - 256, x = Math.floor(k / 1048576) - 512; fn(x, y, z, id); } }

  // filtro opcional: (x,y,z,id) => bool, para gerar só parte do mundo (ex.: animação de construção)
  build(filter) {
    const buf = { o: mk(), c: mk(), w: mk(), e: mk(), x: mk() };
    function mk() { return { p: [], n: [], u: [], c: [], i: [] }; }
    const S = ATLAS_SIZE;
    this.forEach((x, y, z, id) => {
      if (filter && !filter(x, y, z, id)) return;
      const B = BLOCKS[id]; const t = B.t; const b = buf[t];
      if (t === 'x') { // planos em X
        const [tx, ty] = TILE[id]; const u0 = tx / S, u1 = (tx + 16) / S, v1 = 1 - ty / S, v0 = 1 - (ty + 16) / S;
        const quads = id === 'rail' ? [[[0, .02, 1], [1, .02, 1], [1, .02, 0], [0, .02, 0]]] : [[[0, 1, 0], [1, 1, 1], [1, 0, 1], [0, 0, 0]], [[1, 1, 0], [0, 1, 1], [0, 0, 1], [1, 0, 0]]];
        for (const q of quads) {
          const base = b.p.length / 3; const uv = [[u0, v1], [u1, v1], [u1, v0], [u0, v0]];
          q.forEach((c, i) => { b.p.push(x + c[0], y + c[1], z + c[2]); b.n.push(0, 1, 0); b.u.push(...uv[i]); b.c.push(1, 1, 1); });
          b.i.push(base, base + 3, base + 2, base, base + 2, base + 1);
        }
        return;
      }
      for (const f of FACES) {
        const nx = x + f.n[0], ny = y + f.n[1], nz = z + f.n[2];
        const nid = this.get(nx, ny, nz);
        if (nid) { const nt = BLOCKS[nid].t; if (nt === 'o' || nt === 'e') continue; if (nid === id && (t === 'c' || t === 'w')) continue; if (t === 'w' && nt !== 'x') continue; }
        if (t === 'w' && f.n[1] !== 1 && nid !== undefined) continue;
        const tex = (B[f.k] || (f.k === 'side' ? null : B.side)) || id;
        const [tx, ty] = TILE[tex]; const u0 = tx / S, u1 = (tx + 16) / S, v1 = 1 - ty / S, v0 = 1 - (ty + 16) / S;
        const uv = [[u0, v1], [u1, v1], [u1, v0], [u0, v0]];
        const ao = [];
        const ax = f.n.findIndex(v => v !== 0);
        for (const c of f.c) {
          const d = [0, 0, 0].map((_, i) => i === ax ? f.n[i] : (c[i] ? 1 : -1));
          const o = [nx, ny, nz];
          const others = [0, 1, 2].filter(i => i !== ax);
          const s1 = [...o]; s1[others[0]] += d[others[0]];
          const s2 = [...o]; s2[others[1]] += d[others[1]];
          const cc = [...o]; cc[others[0]] += d[others[0]]; cc[others[1]] += d[others[1]];
          const a = this.opaque(...s1) ? 1 : 0, bb = this.opaque(...s2) ? 1 : 0, cr = this.opaque(...cc) ? 1 : 0;
          ao.push(AO[a && bb ? 0 : 3 - (a + bb + cr)]);
        }
        const base = b.p.length / 3;
        const wy = t === 'w' && f.n[1] === 1 ? -0.12 : 0;
        f.c.forEach((c, i) => { b.p.push(x + c[0], y + c[1] + (c[1] ? wy : 0), z + c[2]); b.n.push(...f.n); b.u.push(...uv[i]); const v = t === 'e' ? 1 : ao[i]; b.c.push(v, v, v); });
        // 0=TL 1=TR 2=BR 3=BL
        let tri = ao[0] + ao[2] < ao[1] + ao[3] ? [1, 0, 3, 1, 3, 2] : [0, 3, 2, 0, 2, 1];
        if (f.flip) tri = [tri[0], tri[2], tri[1], tri[3], tri[5], tri[4]];
        b.i.push(...tri.map(i => base + i));
      }
    });
    const group = new THREE.Group();
    const mats = World.materials();
    for (const k of Object.keys(buf)) {
      const b = buf[k]; if (!b.i.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(b.u, 2));
      g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3));
      g.setIndex(b.i);
      const mesh = new THREE.Mesh(g, mats[k]);
      mesh.castShadow = k !== 'w' && k !== 'e'; mesh.receiveShadow = k !== 'e';
      if (k === 'x') mesh.customDepthMaterial = mats.xDepth;
      if (k === 'c') mesh.customDepthMaterial = mats.cDepth;
      group.add(mesh);
    }
    return group;
  }
  static materials() {
    if (World._m) return World._m;
    const std = (o = {}) => new THREE.MeshStandardMaterial({ map: atlasTex, vertexColors: true, roughness: 0.92, metalness: 0, ...o });
    World._m = {
      o: std(),
      c: std({ alphaTest: 0.5, side: THREE.DoubleSide }),
      x: std({ alphaTest: 0.5, side: THREE.DoubleSide }),
      w: std({ transparent: true, opacity: 0.82, roughness: 0.15, metalness: 0.1, depthWrite: false }),
      e: new THREE.MeshBasicMaterial({ map: atlasTex, vertexColors: true }),
      xDepth: new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: atlasTex, alphaTest: 0.5 }),
      cDepth: new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: atlasTex, alphaTest: 0.5 }),
    };
    return World._m;
  }
}
