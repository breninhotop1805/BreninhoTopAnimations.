// Word-by-word subtitles (KOMIKAX): white with a thick black outline + soft drop shadow, elastic POP on every word with a
// short blur that clears as it lands; key words in red. One word on screen at a time, exactly on its timestamp.
export const elasticOut = x => { if (x <= 0) return 0; if (x >= 1) return 1; return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1; };
export async function loadSubFont() { const f = new FontFace('Komikax', 'url(/assets/komikax.ttf)'); await f.load(); document.fonts.add(f); }
// words: [{ w, t0, t1, red }]
export function drawSubs(ui, W, H, words, t, o = {}) { if (!words || !words.length) return; let cur = null; for (const w of words) { if (w.t0 <= t + 1e-4) cur = w; else break; }
  if (!cur || t > cur.t1 + (o.hold ?? 0.25)) return; const age = t - cur.t0; const k = elasticOut(Math.min(1, age / 0.38)); const s = 0.45 + 0.55 * k; const blur = Math.max(0, 1 - age / 0.12) * 6 * (W / 1080);
  const size = (o.size || 0.088) * W; const y = (o.y ?? 0.69) * H; const txt = cur.w.toUpperCase ? (o.upper ? cur.w.toUpperCase() : cur.w) : cur.w;
  ui.save(); ui.translate(W / 2, y); ui.scale(s, s); ui.rotate((1 - k) * -0.06); if (blur > 0.2) ui.filter = `blur(${blur.toFixed(1)}px)`;
  ui.font = `${Math.round(size)}px Komikax`; ui.textAlign = 'center'; ui.textBaseline = 'middle'; ui.lineJoin = 'round'; ui.miterLimit = 2;
  ui.shadowColor = 'rgba(0,0,0,0.55)'; ui.shadowBlur = size * 0.12; ui.shadowOffsetY = size * 0.07;
  ui.lineWidth = size * 0.2; ui.strokeStyle = '#000'; ui.strokeText(txt, 0, 0); ui.shadowColor = 'transparent';
  ui.fillStyle = cur.red ? '#ff2a2a' : '#ffffff'; ui.fillText(txt, 0, 0); ui.restore(); }
