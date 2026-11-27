#!/bin/bash
# storyboard stills: frame at FRAC of each shot. usage: FRAC=0.5 bash sb.sh outdir [scale]
cd "$(dirname "$0")"; OUTD=${1:-out/sb}; SC=${2:-0.3}; FRAC=${FRAC:-0.55}
TS=$(node -e "
const s=require('fs').readFileSync('src/shots.js','utf8'); const re=/at\((\d+\.\d+), '([a-z_0-9]+)'/g; let m, a=[]; while((m=re.exec(s))) a.push(+m[1]); a.push(108.4);
console.log(a.slice(0,-1).map((t,i)=>(t+(a[i+1]-t)*$FRAC).toFixed(2)).join(','))")
node render.mjs stills $TS $OUTD $SC
