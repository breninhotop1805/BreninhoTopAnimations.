// Word-by-word subtitles (KOMIKAX): white with a thick black outline + soft drop shadow; every word APPROACHES the viewer
// growing from its BOTTOM edge upwards, on a fast professional elastic curve (~6% overshoot, settles in ~0.32 s), thick black outline, with a
// short subtle blur (max ~2 px at 1080 wide, gone in 0.1 s).
// All words WHITE (no red). One word on screen at a time, exactly on its timestamp.
export const approach = x => { if (x <= 0) return 0; if (x >= 1) return 1; return 1 - Math.exp(-8 * x) * Math.cos(9 * x); };   // ~6% overshoot
export async function loadSubFont() { const f = new FontFace('Komikax', 'url(/assets/komikax.ttf)'); await f.load(); document.fonts.add(f); }
// words: [{ w, t0, t1, red }]
export function drawSubs(ui, W, H, words, t, o = {}) { if (!words || !words.length) return; let cur = null; for (const w of words) { if (w.t0 <= t + 1e-4) cur = w; else break; }
  if (!cur || t > cur.t1 + (o.hold ?? 0.25)) return; const age = t - cur.t0; const k = approach(Math.min(1, age / 0.32)); const s = 0.45 + 0.55 * k; const a = Math.min(1, age / 0.03);
  const size = (o.size || 0.088) * W; const y = (o.y ?? 0.69) * H; const txt = cur.w;
  const blur = Math.max(0, 1 - age / 0.1) * 2.2 * (W / 1080);   // short, subtle blur that clears as the word lands
  // origin = BOTTOM centre of the word: it grows from the bottom upwards
  ui.save(); ui.globalAlpha = a; ui.translate(W / 2, y + size * 0.42); ui.scale(s, s); ui.translate(0, -size * 0.42); if (blur > 0.15) ui.filter = `blur(${blur.toFixed(2)}px)`;
  ui.font = `${Math.round(size)}px Komikax`; ui.textAlign = 'center'; ui.textBaseline = 'middle'; ui.lineJoin = 'round'; ui.miterLimit = 2;
  ui.shadowColor = 'rgba(0,0,0,0.55)'; ui.shadowBlur = size * 0.12; ui.shadowOffsetY = size * 0.07;
  ui.lineWidth = size * 0.3; ui.strokeStyle = '#000'; ui.strokeText(txt, 0, 0); ui.shadowColor = 'transparent';
  ui.fillStyle = '#ffffff'; /* ALL WHITE (his rule: no red words) */ ui.fillText(txt, 0, 0); ui.restore(); }
