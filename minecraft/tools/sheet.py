# junta PNGs de um diretório em uma folha de contato com rótulo de tempo
import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4; tw = int(sys.argv[4]) if len(sys.argv) > 4 else 270
fs = sorted(glob.glob(os.path.join(d, '*.png')))
ims = []
for f in fs:
    im = Image.open(f).convert('RGB'); th = int(im.height * tw / im.width); im = im.resize((tw, th))
    ImageDraw.Draw(im).text((4, 4), os.path.basename(f)[1:-4], fill=(255, 255, 0)); ims.append(im)
rows = (len(ims) + cols - 1) // cols
o = Image.new('RGB', (cols * tw, rows * ims[0].height))
for i, im in enumerate(ims): o.paste(im, ((i % cols) * tw, (i // cols) * im.height))
o.save(out)
