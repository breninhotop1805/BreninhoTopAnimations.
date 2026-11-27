from PIL import Image, ImageDraw
import glob, sys
fs=sorted(glob.glob('out/sb/*.jpg')); cols=10; w2,h2=162,288
for part in range(0,len(fs),40):
  sub=fs[part:part+40]; rows=(len(sub)+cols-1)//cols
  im=Image.new('RGB',(cols*w2,rows*h2),'black')
  for i,f in enumerate(sub):
    t=Image.open(f).resize((w2,h2)); d=ImageDraw.Draw(t); d.text((4,4),str(part+i+1),fill='yellow'); im.paste(t,((i%cols)*w2,(i//cols)*h2))
  im.save(f'out/sheet{part//40}.jpg',quality=85)
