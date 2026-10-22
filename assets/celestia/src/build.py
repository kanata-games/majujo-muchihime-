from PIL import Image, ImageFilter
import numpy as np, json
from scipy import ndimage
im=np.array(Image.open('src/celestia_raw.jpg').convert('RGB')).astype(int)
r,g,b=im[...,0],im[...,1],im[...,2]
fg=~((g>120)&(g-np.maximum(r,b)>60))
fg=ndimage.binary_opening(fg,iterations=2)
lab,n=ndimage.label(fg); sizes=ndimage.sum(fg,lab,range(1,n+1))
keep=np.isin(lab,[i+1 for i,s in enumerate(sizes) if s>2000]); fg=keep
cols=fg.any(0); segs=[];x=0
while x<len(cols):
    if cols[x]:
        s=x
        while x<len(cols) and cols[x]: x+=1
        segs.append((s,x))
    x+=1
segs=[s for s in segs if s[1]-s[0]>40]
cnt=fg.sum(0); sp=440+int(np.argmin(cnt[440:520])); print('split',sp,cnt[sp])
segs=[segs[0],(segs[1][0],sp),(sp,segs[1][1])]+segs[2:]; print(segs)
# despill
im2=im.copy(); im2[...,1]=np.minimum(g,np.maximum(r,b)+10)
rgba=np.dstack([im2,fg*255]).astype(np.uint8)
crops=[]
for (a,bx) in segs:
    sub=fg[:,a:bx].copy(); lab2,n2=ndimage.label(sub); szs=ndimage.sum(sub,lab2,range(1,n2+1)); sub=lab2==(np.argmax(szs)+1); fg[:,a:bx]=sub; rows=np.where(sub.any(1))[0]; crops.append((a,rows[0],bx,rows[-1]+1))
print(crops)
body=crops[:4]; H=max(c[3]-c[1] for c in body); sc=52/H
def down(c,scale,W=None,Hh=None):
    t=Image.fromarray(rgba).crop(c)
    w,h=max(1,round(t.width*scale)),max(1,round(t.height*scale))
    rgb=t.convert('RGB').resize((w,h),Image.BOX)
    al=t.getchannel('A').resize((w,h),Image.BOX)
    return rgb,np.array(al)>128
smalls=[down(c,sc) for c in body]
# face
fc=crops[4]; fw=fc[2]-fc[0]; fh=fc[3]-fc[1]; s=max(fw,fh)
fsc=62/s; face=down(fc,fsc)
# shared palette
allpx=np.concatenate([np.array(rg)[m] for rg,m in smalls+[face]]).astype(float)
seeds=np.array([[30,15,40],[55,25,75],[85,45,110],[120,80,140],[95,85,130],[150,140,185],[200,195,225],[235,235,245],[120,70,55],[195,135,105],[240,190,155],[140,100,40],[215,170,70],[180,175,180],[60,40,40]],float)
C=seeds.copy()
for it in range(15):
    d=((allpx[:,None]-C)**2).sum(-1); l=d.argmin(1)
    for k in range(len(C)):
        if (l==k).any(): C[k]=0.7*allpx[l==k].mean(0)+0.3*seeds[k]
pal=[tuple(int(v) for v in c) for c in C]
P=np.array(pal); 
def quant(rgb,m):
    a=np.array(rgb).astype(int); d=((a[...,None,:]-P)**2).sum(-1); q=P[d.argmin(-1)]
    return q,m
def finish(q,m,W,Hh,ox,oy):
    canvas=np.zeros((Hh,W,4),np.uint8); h,w=m.shape
    for y in range(h):
        for x in range(w):
            if m[y,x]:
                X,Y=x+ox,y+oy
                if 0<=X<W and 0<=Y<Hh: canvas[Y,X,:3]=q[y,x];canvas[Y,X,3]=255
    al=canvas[...,3]>0
    lab,n=ndimage.label(al)
    if n>1:
        sz=ndimage.sum(al,lab,range(1,n+1)); 
        for i,s_ in enumerate(sz):
            if s_<4: canvas[lab==i+1]=0
    al=canvas[...,3]>0
    ring=ndimage.binary_dilation(al)&~al
    canvas[ring]=(0,0,0,255)
    return canvas
outs=[]
# align on lower body: centre of bottom 15 rows
for (rgb,m),name in zip(smalls,['idle_1','idle_2','talk_1','talk_2']):
    h,w=m.shape; ys,xs=np.where(m[int(h*0.6):]); cx=xs.mean()
    ox=round(23.5-cx); oy=61-(h-1)  # outline adds 1px -> lowest at 62
    q,_=quant(rgb,m); outs.append((name,finish(q,m,48,64,ox,oy)))
d=np.abs(outs[0][1].astype(int)-outs[1][1].astype(int)).sum(); print('idle diff',d)
if d<3000:
    a=outs[0][1].copy(); cut=30; up=np.zeros_like(a); up[:cut-1]=a[1:cut]; up[cut-1:]=a[cut-1:]
    outs[1]=('idle_2',up)
q,m=quant(*face); h,w=m.shape
fcv=finish(q,m,64,64,(64-w)//2,63-1-(h-1)+0)
for name,a in outs: Image.fromarray(a).save(f'celestia_{name}.png')
Image.fromarray(fcv).save('celestia_face.png')
sheet=np.concatenate([a for _,a in outs],1); Image.fromarray(sheet).save('celestia_sheet.png')
json.dump({'frameSize':[48,64],'anchor':[24,62],'facing':'left','frames':{n:{'x':i*48,'y':0,'w':48,'h':64} for i,(n,_) in enumerate(outs)},'animations':{'idle':['idle_1','idle_2'],'talk':['talk_1','talk_2']},'face':'celestia_face.png','palette':['#000000']+['#%02x%02x%02x'%p for p in pal]},open('celestia_sheet.json','w'),indent=1)
pv=Image.new('RGBA',(48*4*3+64*3+24,64*3+12),(0x1c,0x18,0x28,255))
for i,(_,a) in enumerate(outs): t=Image.fromarray(a).resize((144,192),Image.NEAREST); pv.alpha_composite(t,(i*144,6))
pv.alpha_composite(Image.fromarray(fcv).resize((192,192),Image.NEAREST),(576+12,6)); pv.save('preview.png')
for n,a in outs: ys,xs=np.where(a[...,3]>0); print(n,xs.min(),xs.max(),ys.min(),ys.max())
print(len(np.unique(sheet[sheet[...,3]>0][:,:3],axis=0)))
