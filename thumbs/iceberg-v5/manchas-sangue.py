import numpy as np, random
from PIL import Image, ImageDraw, ImageFilter
from collections import deque
src='/home/user/BreninhoTopAnimations./thumbs/iceberg-v5/original.png'
im=Image.open(src).convert('RGB');a=np.asarray(im).astype(np.int32);H,W,_=a.shape
r,g,b=a[...,0],a[...,1],a[...,2]
# sky flood fill
skylike=(b>235)&(g>220)&(r<225)&(r>150)
sky=np.zeros((H,W),bool);q=deque()
for s in [(20,480),(60,900),(200,1000),(30,700),(120,960)]:
    if skylike[s]: sky[s]=True;q.append(s)
while q:
    y,x=q.popleft()
    for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
        ny,nx=y+dy,x+dx
        if 0<=ny<H and 0<=nx<W and not sky[ny,nx] and skylike[ny,nx] and abs(a[ny,nx]-a[y,x]).max()<7:
            sky[ny,nx]=True;q.append((ny,nx))
ice=(~sky)&(b>=r+5)|((r>200)&(g>200)&(b>200)&~sky)
region=np.zeros((H,W),bool);region[0:400,480:1010]=True;region[250:,540:1000]=False
ice&=region
# erode mask edge slightly so nothing bleeds onto sky
m=Image.fromarray((ice*255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1.5))
Image.fromarray((sky*255).astype(np.uint8)).save('/tmp/claude-0/-home-user-BreninhoTopAnimations-/e3d6da08-2ec0-540f-9547-e38573bf48f8/scratchpad/sky.png')
m.save('/tmp/claude-0/-home-user-BreninhoTopAnimations-/e3d6da08-2ec0-540f-9547-e38573bf48f8/scratchpad/icemask.png')
# blood splatters
random.seed(4)
bl=Image.new('L',(W,H),0);d=ImageDraw.Draw(bl)
def splat(cx,cy,R,n=14,drips=2):
    d.ellipse((cx-R,cy-R*.7,cx+R,cy+R*.7),fill=235)
    for _ in range(n):
        ang=random.uniform(0,6.28);dist=random.uniform(R*.8,R*2.4);rr=random.uniform(2,R*.28)
        x=cx+np.cos(ang)*dist;y=cy+np.sin(ang)*dist*.7;d.ellipse((x-rr,y-rr,x+rr,y+rr),fill=random.randint(170,240))
    for _ in range(drips):
        x=cx+random.uniform(-R*.6,R*.6);L=random.uniform(R*1.5,R*4);w=random.uniform(3,6)
        d.line((x,cy,x+random.uniform(-6,6),cy+L),fill=210,width=int(w));d.ellipse((x-w,cy+L-w,x+w,cy+L+w),fill=220)
def smear(x0,y0,x1,y1,w):
    for t in np.linspace(0,1,40):
        x=x0+(x1-x0)*t;y=y0+(y1-y0)*t;ww=w*(1-t*.7)*random.uniform(.7,1.1)
        d.ellipse((x-ww,y-ww*.6,x+ww,y+ww*.6),fill=int(220-90*t))
for (cx,cy,R) in [(600,70,15),(705,175,20),(860,215,24),(520,300,16),(930,300,18),(655,235,10)]:
    splat(cx,cy,R,n=8,drips=2)
smear(600,75,560,150,9);smear(860,220,905,290,12);smear(705,180,672,250,8);smear(520,305,505,370,7)
bl=bl.filter(ImageFilter.GaussianBlur(1.6))
noise=Image.effect_noise((W,H),70).filter(ImageFilter.GaussianBlur(2))
nz=np.asarray(noise)/255.0
alpha=(np.asarray(bl)/255.0)*(np.asarray(m)/255.0)*(0.78+0.22*nz)
lum=(0.3*r+0.59*g+0.11*b)/255.0
blood=np.stack([55+115*lum,3+5*lum,6+6*lum],-1)
out=a*(1-alpha[...,None])+blood*alpha[...,None]
Image.fromarray(out.clip(0,255).astype(np.uint8)).save('/home/user/BreninhoTopAnimations./thumbs/iceberg-v5/thumb-iceberg-sangue.png')
print('done',sky.sum(),ice.sum())
