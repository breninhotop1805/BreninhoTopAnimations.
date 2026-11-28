// Usage: node render.mjs stills <t1,t2,...> [outdir] [scale]   |   node render.mjs video <out.mp4> [from] [to]
import http from 'http'; import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const root = path.dirname(new URL(import.meta.url).pathname);
const types = { '.js': 'text/javascript', '.html': 'text/html', '.png': 'image/png', '.json': 'application/json', '.ttf': 'font/ttf', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); });
await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
const [mode, a1, a2, a3] = process.argv.slice(2);
const W = 1080, H = 1920; const scale = (mode === 'stills' || mode === 'view') ? parseFloat(a3 || '0.5') : parseFloat(process.env.RS || '1');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Math.round(W * scale), height: Math.round(H * scale) } });
page.on('console', m => { if (m.type() === 'error' || m.text().startsWith('LOG')) console.log('[page]', m.text()); });
page.on('pageerror', e => { console.log('[pageerror]', e.message); process.exit(3); });
await page.goto(`http://localhost:${port}/${process.env.PAGE||'index.html'}?${process.env.QX||''}&w=${Math.round(W * scale)}&h=${Math.round(H * scale)}`);
await page.waitForFunction(() => window.APP && window.APP.ready, null, { timeout: 120000 }); if (process.env.DBG) await page.evaluate(() => window.DBG = 1);
const FPS = 30;
async function grab(t) { for (let k = 0; ; k++) { try { await page.evaluate(t => window.APP.renderAt(t), t); return await page.screenshot({ type: 'jpeg', quality: 95 }); } catch (e) { if (k >= 4) throw e; console.log('retry', t, e.message); await new Promise(r => setTimeout(r, 2000)); } } }
if (mode === 'stills') {
  const out = a2 || 'stills'; fs.mkdirSync(out, { recursive: true });
  for (const t of a1.split(',').map(Number)) { const b = await grab(t); fs.writeFileSync(`${out}/t${t.toFixed(2).padStart(6, '0')}.jpg`, b); }
} else if (mode === 'view') {
  await page.evaluate(t => window.VIEW(t), parseFloat(a2 || '0')); fs.writeFileSync(a1, await page.screenshot({ type: 'jpeg', quality: 92 }));
} else if (mode === 'check') {
  await page.evaluate(() => window.NORENDER = 1); const dur = await page.evaluate(() => window.APP.duration); const from = parseFloat(a1 || '0'), to = parseFloat(a2 || dur);
  for (let i = Math.round(from * FPS); i < Math.round(to * FPS); i++) await page.evaluate(t => window.APP.renderAt(t), i / FPS);
} else if (mode === 'video') {
  const dur = await page.evaluate(() => window.APP.duration);
  const from = parseFloat(a2 || '0'), to = parseFloat(a3 || dur);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-vf', 'scale=1080:1920:flags=lanczos', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', a1], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n0 = Math.round(from * FPS), n1 = Math.round(to * FPS); const t0 = Date.now();
  for (let i = n0; i < n1; i++) {
    const b = await grab(i / FPS); if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(`frame ${i}/${n1}  ${((Date.now() - t0) / 1000 / (i - n0 + 1)).toFixed(2)}s/f`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await browser.close(); srv.close();
