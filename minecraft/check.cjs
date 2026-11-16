// roda a checagem de atravessamento em TODOS os quadros
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname; const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.png': 'image/png' };
const srv = http.createServer((q, a) => { if (q.method === 'POST') { q.resume(); q.on('end', () => { a.writeHead(200); a.end(); }); return; } const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { a.writeHead(404); a.end(); return; } a.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); a.end(d); }); }).listen(0, async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 216, height: 384 } });
  page.on('pageerror', e => console.error(e));
  await page.goto(`http://localhost:${srv.address().port}/engine/index.html?w=216&h=384`);
  await page.waitForFunction('window.READY === true && window.checkFrame', null, { timeout: 180000 });
  const N = Math.round(62 * 30); const res = await page.evaluate(async (N) => { const r = []; for (let f = 0; f < N; f++) { const c = window.checkFrame(f / 30); if (c.hits.length) r.push([f, c.shot, c.hits.join(' ')]); } return r; }, N);
  const byShot = {}; for (const [f, s, h] of res) { (byShot[s] = byShot[s] || []).push(`${(f / 30).toFixed(2)}: ${h}`); }
  let total = 0; for (const s in byShot) { total += byShot[s].length; console.log(`cena ${s}: ${byShot[s].length} quadros`); console.log('   ' + byShot[s].slice(0, 3).join('\n   ')); }
  console.log('TOTAL de quadros com atravessamento:', total);
  await browser.close(); srv.close();
});
