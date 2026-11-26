import { loadSubFont, drawSubs } from './subs.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const c = document.createElement('canvas'); c.width = W; c.height = H; document.body.appendChild(c); const g = c.getContext('2d');
await loadSubFont(); const bg = new Image(); bg.src = '/assets/subtest_bg.jpg'; await bg.decode();
const w = (s, t0, t1, red) => ({ w: s, t0, t1, red: !!red });
const WORDS = [w('Esse', 0.2, 0.55), w('é', 0.55, 0.75), w('o', 0.75, 0.9), w('novo', 0.9, 1.3), w('TESTE', 1.3, 1.9, true), w('das', 1.95, 2.2), w('legendas', 2.2, 2.85), w('sem', 2.9, 3.15), w('desfoque!', 3.15, 3.9, true)];
window.APP = { ready: true, duration: 4, renderAt(t) { g.drawImage(bg, 0, 0, W, H); drawSubs(g, W, H, WORDS, t); } };
