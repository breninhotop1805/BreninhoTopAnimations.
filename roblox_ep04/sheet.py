import sys, os, re, json
from PIL import Image, ImageDraw, ImageFont
d = sys.argv[1]; out = sys.argv[2]; per = int(sys.argv[3]) if len(sys.argv) > 3 else 40
src = open('src/shots.js').read(); shots = [(float(a), b) for a, b in re.findall(r"at\((\d+\.\d+), '([a-z_0-9]+)'", src)]
fs = sorted(os.listdir(d)); F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
W, H = 200, 356; cols = 10
for part in range(0, len(fs), per):
    L = fs[part:part + per]; rows = (len(L) + cols - 1) // cols; S = Image.new('RGB', (cols * W, rows * (H + 22)), (20, 20, 20)); dr = ImageDraw.Draw(S)
    for i, f in enumerate(L):
        t = float(f[1:-4]); nm = [b for a, b in shots if a <= t][-1]; im = Image.open(os.path.join(d, f)).resize((W, H), Image.LANCZOS)
        x, y = (i % cols) * W, (i // cols) * (H + 22); S.paste(im, (x, y)); dr.text((x + 3, y + H + 2), f'{part + i + 1} {nm} {t:.1f}', font=F, fill=(255, 255, 0))
    S.save(f'{out}_{part // per + 1}.jpg', quality=85); print(f'{out}_{part // per + 1}.jpg')
