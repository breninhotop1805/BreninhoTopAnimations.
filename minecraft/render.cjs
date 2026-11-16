// Driver: abre a página do motor no Chromium headless e exporta quadros para o ffmpeg
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const ROOT = __dirname;
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.png': 'image/png', '.json': 'application/json', '.mjs':'text/javascript' };
let onFrame = null;
function serve() {
  return new Promise(r => {
    const s = http.createServer((q, a) => {
      if (q.method === 'POST') { const ch = []; q.on('data', d => ch.push(d)); q.on('end', () => { const b = Buffer.concat(ch); a.writeHead(200); a.end('ok'); onFrame && onFrame(q.url, b); }); return; }
      const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
      fs.readFile(p, (e, d) => { if (e) { a.writeHead(404); a.end(); return; } a.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); a.end(d); });
    }).listen(0, () => r(s));
  });
}
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
(async () => {
  const W = +(args.w || 1080), H = +(args.h || 1920), FPS = 30;
  const srv = await serve(); const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => { console.error('[pageerror]', e); process.exit(1); });
  await page.goto(`http://localhost:${port}/engine/index.html?w=${W}&h=${H}`);
  await page.waitForFunction('window.READY === true', null, { timeout: 120000 });
  if (args.stills) { // lista de tempos -> PNGs
    const times = args.stills.split(',').map(Number); fs.mkdirSync(args.out, { recursive: true });
    for (const t of times) {
      const got = new Promise(r => onFrame = (u, b) => r(b));
      await page.evaluate(t => window.renderFrame(t, 'png'), t);
      fs.writeFileSync(path.join(args.out, `t${t.toFixed(2).padStart(6, '0')}.png`), await got);
    }
  } else { // intervalo de quadros -> vídeo
    const f0 = +(args.f0 || 0), f1 = +args.f1;
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', '' + FPS, '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', args.out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = f0; f < f1; f++) {
      const got = new Promise(r => onFrame = (u, b) => r(b));
      await page.evaluate(t => window.renderFrame(t, 'raw'), f / FPS);
      const buf = await got;
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if ((f - f0) % 30 === 0) console.log(`frame ${f} (${((Date.now() - t0) / (f - f0 + 1)).toFixed(0)} ms/f)`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await browser.close(); srv.close();
})();
