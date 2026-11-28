// usage: node scenechk.mjs <episode dir>  -> prints LOG lines of the static scene QA (scenechk.html in that dir)
import http from 'http'; import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const root = path.resolve(process.argv[2]); const require = createRequire(path.join(root, 'package.json')); const { chromium } = require('playwright');
const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); });
await new Promise(r => srv.listen(0, r));
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const pg = await b.newPage();
pg.on('console', m => { if (m.text().startsWith('LOG') || m.type() === 'error') console.log(m.text()); }); pg.on('pageerror', e => console.log('PAGEERROR', e.message));
await pg.goto(`http://localhost:${srv.address().port}/scenechk.html`); await pg.waitForFunction(() => window.DONE, null, { timeout: 600000 }); await b.close(); srv.close();
