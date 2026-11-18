// Facial acting for the Minecraft skins WITHOUT adding geometry: every expression is a modified copy of the skin
// (face + hat layer pixels) swapped in as the texture. Nothing floats, nothing z-fights, nothing can clip.
// lid: 0 open .. 1 closed, slope: -1 sad .. +1 angry (inner corner lower), mouth: 0 closed .. 1 open (rows, pixel steps)
import * as THREE from 'three';
import { pixelTexture } from './skin.js';

const hex = c => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

// eye rects / mouth in hi-res texels of the 8x8 face (k = skin width / 64)
export const FACES = {
  springtrap: { eyes: [[1, 4, 5, 4], [10, 4, 5, 4]], lid: '#49471d', lash: '#22200c', mouth: { row: 13, x0: 1, x1: 14, max: 1, shift: true } },
  scraptrap: { eyes: [[1, 4, 5, 4], [10, 4, 5, 4]], lid: '#523d2d', lash: '#24180f', mouth: { row: 13, x0: 1, x1: 14, max: 1, shift: true } },
  glitchtrap: { eyes: [[1, 4, 5, 4], [10, 4, 5, 4]], lid: '#9e7d35', lash: '#5a4318', mouth: { row: 13, x0: 2, x1: 13, max: 1, shift: true } },
  springbonnie: { eyes: [[1, 2, 2, 2], [5, 2, 2, 2]], lid: '#b59932', lash: '#5d3d1c' },
  william: { eyes: [[2, 8, 4, 4], [10, 8, 4, 4]], lid: '#d3a789', lash: '#201e1d', mouth: { row: 13, x0: 6, x1: 9, max: 2, dark: '#4a1a16', paint: true } },
  purpleguy: { eyes: [[0, 3, 3, 1], [4, 3, 3, 1]], lid: '#8c00e1', lash: '#3c0060', mouth: { row: 6, x0: 2, x1: 5, max: 1, shift: true, dark: '#000000' } },
  child: { eyes: [[1, 4, 2, 2], [5, 4, 2, 2]], lid: '#f7c79d', lash: '#5a3020', mouth: { row: 6, x0: 3, x1: 4, max: 1, dark: '#6a2a20', paint: true } },
  edwin: { eyes: [[2, 9, 4, 3], [10, 9, 4, 3]], lid: '#f3c1a0', lash: '#2a1810', mouth: { row: 14, x0: 6, x1: 9, max: 1, dark: '#5a2a22', paint: true } },
  cassie: { eyes: [[2, 8, 4, 3], [10, 8, 4, 3]], lid: '#ac7a50', lash: '#241812', mouth: { row: 14, x0: 6, x1: 9, max: 2, dark: '#3a1410', paint: true } },
  henry: { eyes: [[2, 9, 4, 2], [10, 9, 4, 2]], lid: '#f0bf92', lash: '#392a21', mouth: { row: 14, x0: 6, x1: 9, max: 1, dark: '#4a1a14', paint: true } },
  lefty: { eyes: [[2, 4, 4, 4], [10, 4, 4, 4]], lid: '#343434', lash: '#d41b1b' },
  guard: { eyes: [[1, 4, 2, 1], [5, 4, 2, 1]], lid: '#ffb27f', lash: '#4c270f', mouth: { row: 7, x0: 3, x1: 4, max: 1, dark: '#5a1a10', paint: true } },
};

export function addFace(ch, cfg) {
  const base = ch.canvas; const k = base.width / 64; const cache = new Map(); ch.faceCfg = cfg; ch.face = { lid: 0, slope: 0, mouth: 0 };
  const baseTex = ch.mat.map;
  function variant(lidRowsL, lidRowsR, slope, mo) {
    const key = [lidRowsL, lidRowsR, slope, mo].join(','); if (cache.has(key)) return cache.get(key);
    const c = document.createElement('canvas'); c.width = base.width; c.height = base.height; const g = c.getContext('2d'); g.drawImage(base, 0, 0);
    const F = g.getImageData(8 * k, 8 * k, 8 * k, 8 * k), Hh = g.getImageData(40 * k, 8 * k, 8 * k, 8 * k); const W = 8 * k;
    const set = (D, x, y, rgb, a = 255) => { const i = (y * W + x) * 4; D.data[i] = rgb[0]; D.data[i + 1] = rgb[1]; D.data[i + 2] = rgb[2]; D.data[i + 3] = a; };
    const get = (D, x, y) => { const i = (y * W + x) * 4; return [D.data[i], D.data[i + 1], D.data[i + 2], D.data[i + 3]]; };
    const lid = hex(cfg.lid), lash = hex(cfg.lash);
    cfg.eyes.forEach(([x0, y0, w, h], e) => { const rows = e === 0 ? lidRowsL : lidRowsR; if (rows <= 0) return;
      for (let i = 0; i < w; i++) { // inner corner = towards the face centre
        const inner = e === 0 ? i / Math.max(1, w - 1) : 1 - i / Math.max(1, w - 1);
        const r = Math.max(0, Math.min(h, rows + Math.round(slope * (inner - 0.5) * 2 * Math.min(2, h / 2)))); const x = x0 + i;
        for (let y = 0; y < r; y++) { set(F, x, y0 + y, lid); set(Hh, x, y0 + y, [0, 0, 0], 0); }
        if (r > 0) set(F, x, y0 + r - 1, lash);
      } });
    const M = cfg.mouth; if (M && mo > 0) { const dark = hex(M.dark || '#0a0606');
      for (let x = M.x0; x <= M.x1; x++) {
        if (M.shift) { for (let y = W - 1; y >= M.row + mo; y--) { const p = get(F, x, y - mo); set(F, x, y, p, p[3]); } }
        for (let y = M.row; y < Math.min(W, M.row + mo); y++) { set(F, x, y, dark); set(Hh, x, y, [0, 0, 0], 0); }
      } }
    g.putImageData(F, 8 * k, 8 * k); g.putImageData(Hh, 40 * k, 8 * k);
    const t = pixelTexture(c); cache.set(key, t); return t;
  }
  ch.setFace = (o = {}) => { Object.assign(ch.face, o); };
  ch.applyFace = () => { const f = ch.face; const eh = cfg.eyes[0][3];
    const rl = Math.round(Math.max(0, Math.min(1, f.lidL ?? f.lid)) * eh), rr = Math.round(Math.max(0, Math.min(1, f.lidR ?? f.lid)) * eh);
    const sl = Math.round(Math.max(-1, Math.min(1, f.slope)) * 2) / 2; const mo = cfg.mouth ? Math.round(Math.max(0, Math.min(1, f.mouth)) * cfg.mouth.max) : 0;
    const t = rl || rr || mo ? variant(rl, rr, rl || rr ? sl : 0, mo) : baseTex;
    for (const m of [ch.mat, ch.matO, ch.headMat, ch.headMatO]) if (m && m.map !== t) { m.map = t; m.needsUpdate = true; } };
  const r0 = ch.reset.bind(ch); ch.reset = () => { r0(); ch.face.lid = 0; ch.face.lidL = undefined; ch.face.lidR = undefined; ch.face.slope = 0; ch.face.mouth = 0; };
  return ch;
}
// natural blink: quick close/open (~0.16 s), deterministic per character seed, never during a held expression
export function blinkAt(t, seed = 0, every = 3.1) { const ph = ((t + seed * 0.77) % every); return ph < 0.16 ? Math.sin(ph / 0.16 * Math.PI) : 0; }
