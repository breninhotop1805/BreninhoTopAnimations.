#!/bin/bash
# contact sheet: 3 frames per shot (15/50/90 %) between FROM and TO seconds -> $1
set -e; cd "$(dirname "$0")"; OUT=$1; FROM=${3:-0}; TO=${4:-999}; rm -rf $OUT; mkdir -p $OUT
TS=$(node -e "
const fs=require('fs');const s=fs.readFileSync('src/shots.js','utf8');const re=/^at\(([\d.]+), '([^']+)'/gm;let m,a=[];while(m=re.exec(s))a.push([+m[1],m[2]]);const D=117.1;
const out=[];a.forEach(([t,n],i)=>{const e=i+1<a.length?a[i+1][0]:D;if(t<$FROM||t>=$TO)return;for(const f of [0.15,0.5,0.9])out.push((t+(e-t)*f).toFixed(2));});console.log(out.join(','));")
node render.mjs stills $TS $OUT ${2:-0.25} 2>&1 | grep -v "^\s*$" | sort | uniq -c | sort -rn | head -30
python3 - "$OUT" <<'PY'
import sys,glob
from PIL import Image, ImageDraw
d=sys.argv[1]; fs=sorted(glob.glob(d+'/t*.jpg'), key=lambda f: float(f.split('/t')[-1][:-4]))
ims=[Image.open(f) for f in fs]; w,h=ims[0].size; cols=12; r=(len(ims)+cols-1)//cols
sh=Image.new('RGB',(w*cols,h*r)); dr=ImageDraw.Draw(sh)
for i,im in enumerate(ims): x,y=(i%cols)*w,(i//cols)*h; sh.paste(im,(x,y)); dr.text((x+4,y+4), fs[i].split('/t')[-1][:-4], fill='yellow')
sh.save(f'{d}/sheet.jpg', quality=85)
PY
