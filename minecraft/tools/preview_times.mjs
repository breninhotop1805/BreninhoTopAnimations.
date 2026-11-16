// gera os tempos 15%/50%/90% de cada cena a partir dos inícios
const starts=[0,1.2,2.4,3.68,4.88,5.68,6.8,7.52,8.64,9.92,11.2,12.8,14,15.36,16,17.52,18.32,19.92,21.44,22.64,23.84,24.64,26.56,28.56,29.68,31.36,32.72,35.2,36.48,37.84,39.44,40.48,41.6,42.16,43.76,45.28,46.64,48.4,49.36,52.32,53.36,55.12,56.8,58.4,60.56,62.0];
const a=process.argv[2]|0, b=process.argv[3]|0; const out=[];
for(let i=a;i<Math.min(b,starts.length-1);i++){const d=starts[i+1]-starts[i]; for(const f of [.15,.5,.9]) out.push((starts[i]+d*f).toFixed(2));}
console.log(out.join(','));
