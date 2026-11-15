#!/bin/bash
# contact sheet: 3 frames per shot (15/50/90 %) -> $1 (dir), labels with shot name
set -e; cd "$(dirname "$0")"; OUT=$1; rm -rf $OUT; mkdir -p $OUT
TS=$(node -e "
const fs=require('fs');const s=fs.readFileSync('src/shots.js','utf8');const re=/^at\(([\d.]+), '([^']+)'/gm;let m,a=[];while(m=re.exec(s))a.push([+m[1],m[2]]);const D=52.40;
const out=[];a.forEach(([t,n],i)=>{const e=i+1<a.length?a[i+1][0]:D;for(const f of [0.15,0.5,0.9])out.push((t+(e-t)*f).toFixed(2));});console.log(out.join(','));")
node render.mjs stills $TS $OUT ${2:-0.25} 2>&1 | grep -v "^\s*$" | sort | uniq -c | sort -rn | head -40
python3 - "$OUT" <<'PY'
import sys,glob
from PIL import Image, ImageDraw
d=sys.argv[1]; fs=sorted(glob.glob(d+'/t*.jpg'), key=lambda f: float(f.split('/t')[-1][:-4]))
ims=[Image.open(f) for f in fs]; w,h=ims[0].size; cols=12
rows=(len(ims)+cols-1)//cols
for part in range(0, rows, 4):
  sub=ims[part*cols:(part+4)*cols]; r=(len(sub)+cols-1)//cols
  sh=Image.new('RGB',(w*cols,h*r)); dr=ImageDraw.Draw(sh)
  for i,im in enumerate(sub):
    x,y=(i%cols)*w,(i//cols)*h; sh.paste(im,(x,y)); dr.text((x+4,y+4), fs[part*cols+i].split('/t')[-1][:-4], fill='yellow')
  sh.save(f'{d}/sheet{part//4}.jpg', quality=85)
PY
ls $OUT/sheet*
