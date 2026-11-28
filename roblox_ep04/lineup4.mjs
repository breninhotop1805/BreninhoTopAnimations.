import http from 'http'; import fs from 'fs'; import path from 'path'; import { createRequire } from 'module'; import { execFileSync } from 'child_process';
const root = path.dirname(new URL(import.meta.url).pathname); const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); });
await new Promise(r => srv.listen(0, r)); const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const pg = await b.newPage({ viewport: { width: 360, height: 480 } });
pg.on('pageerror', e => console.log('PAGEERROR', e.message)); pg.on('console', m => { if (m.type() === 'error') console.log(m.text()); });
await pg.goto(`http://localhost:${srv.address().port}/lineup4.html`); await pg.waitForFunction(() => window.READY, null, { timeout: 180000 });
const L = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const out = process.argv[3]; fs.mkdirSync('/tmp/l4', { recursive: true }); const files = [];
for (let i = 0; i < L.length; i++) { const [lab, name, o] = L[i]; await pg.evaluate(([n, o]) => window.SHOW(n, o), [name, o]); const fn = `/tmp/l4/${String(i).padStart(2, '0')}.png`; fs.writeFileSync(fn, await pg.screenshot()); files.push([fn, lab]); }
fs.writeFileSync('/tmp/l4/list.json', JSON.stringify(files)); await b.close(); srv.close();
execFileSync('python3', ['-c', `
import json; from PIL import Image, ImageDraw, ImageFont
L = json.load(open('/tmp/l4/list.json')); F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20); cols = 6; w, h = 360, 480
S = Image.new('RGB', (cols * w, ((len(L) + cols - 1) // cols) * (h + 32)), (24, 24, 28)); d = ImageDraw.Draw(S)
for i, (f, lab) in enumerate(L):
    x, y = (i % cols) * w, (i // cols) * (h + 32); S.paste(Image.open(f), (x, y)); d.text((x + 8, y + h + 4), lab, font=F, fill=(255, 255, 255))
S.save('${out}', quality=88)`]); console.log('ok');
