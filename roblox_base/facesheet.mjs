// node facesheet.mjs out.jpg -> grid of all expressions (labels underneath)
import http from 'http'; import fs from 'fs'; import path from 'path'; import { createRequire } from 'module'; import { execFileSync } from 'child_process';
const root = path.dirname(new URL(import.meta.url).pathname); const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); });
await new Promise(r => srv.listen(0, r)); const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const pg = await b.newPage({ viewport: { width: 360, height: 400 } });
pg.on('pageerror', e => console.log('PAGEERROR', e.message)); await pg.goto(`http://localhost:${srv.address().port}/facesheet.html`); await pg.waitForFunction(() => window.READY, null, { timeout: 120000 });
const L = [
  ['feliz', 'hero', { eyes: 'happy', mouth: 'laugh', brow: -0.2 }], ['choque O.O', 'hero', { eyes: 'shock', mouth: 'o' }], ['grito', 'hero', { eyes: 'circle', mouth: 'scream', brow: 0.5, browW: 1.4, sweat: 1 }],
  ['>.< vergonha', 'hero', { eyes: 'squeeze', mouth: 'wavy', blush: 1 }], ['choro', 'hero', { eyes: 'squeeze', mouth: 'wail', drops: 0.3, cry: 0.8, brow: 0.6 }], ['deboche', 'hero', { eyes: 'smug', mouth: 'tongue', brow: -0.5, browW: 1.3 }],
  ['raiva (pele morena)', 'tan', { eyes: 'angry', mouth: 'grimace', brow: -0.7, browW: 1.5 }], ['zíper', 'hero', { eyes: 'shock', mouth: 'zip' }], ['sorriso 30%', 'hero', { eyes: 'happy', mouth: 'mega', grin: 0.3 }],
  ['sorriso 65%', 'hero', { eyes: 'normal', mouth: 'mega', grin: 0.65, brow: -0.3 }], ['sorriso 100%', 'hero', { eyes: 'smug', mouth: 'mega', grin: 1, brow: -0.6, browW: 1.4 }], ['nervoso', 'hero', { eyes: 'wide', mouth: 'grimace', sweat: 1, brow: 0.4 }],
  ['menina feliz', 'girl', { eyes: 'happy', mouth: 'laugh', blush: 0.8 }], ['menina choque', 'girl', { eyes: 'wide', mouth: 'o', brow: 0.4 }], ['menina choro', 'girl', { eyes: 'squeeze', mouth: 'wail', drops: 0.6, brow: 0.6 }], ['menina deboche', 'girl', { eyes: 'smug', mouth: 'tongue', brow: -0.4 }],
];
fs.mkdirSync('/tmp/fs', { recursive: true }); const files = [];
for (let i = 0; i < L.length; i++) { const [lab, who, f] = L[i]; await pg.evaluate(([w, f]) => window.SHOW(w, f), [who, f]); const fn = `/tmp/fs/${String(i).padStart(2, '0')}.png`; fs.writeFileSync(fn, await pg.screenshot()); files.push([fn, lab]); }
fs.writeFileSync('/tmp/fs/list.json', JSON.stringify(files)); await b.close(); srv.close();
execFileSync('python3', ['-c', `
import json; from PIL import Image, ImageDraw, ImageFont
L = json.load(open('/tmp/fs/list.json')); F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22); cols = 4; w, h = 360, 400
S = Image.new('RGB', (cols * w, ((len(L) + cols - 1) // cols) * (h + 36)), (24, 24, 28)); d = ImageDraw.Draw(S)
for i, (f, lab) in enumerate(L):
    x, y = (i % cols) * w, (i // cols) * (h + 36); S.paste(Image.open(f), (x, y)); d.text((x + 10, y + h + 5), lab, font=F, fill=(255, 255, 255))
S.save('${process.argv[2] || 'out/FACES.jpg'}', quality=90)`]);
console.log('ok');
