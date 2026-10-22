import sys;sys.path.insert(0,'/workspace')
from akm_common import *
from scipy import ndimage
G='/workspace/game-assets/akumajo/'
def comps(path):
    im=key(Image.open(path)); a=np.array(im); m=a[...,3]>0
    l,n=ndimage.label(ndimage.binary_dilation(m,iterations=4))
    out=[]
    for i,s in enumerate(ndimage.find_objects(l)):
        mm=(l==i+1)&m
        if mm.sum()>800: out.append(((s[1].start,s[0].start),mm))
    return a,out
def cut(a,mm,box=None):
    b=a.copy(); b[~mm]=0
    if box: x0,y0,x1,y1=box; z=np.zeros_like(b); z[y0:y1,x0:x1]=b[y0:y1,x0:x1]; b=z
    return crop(b)
def clean(a,minpx=3):
    m=a[...,3]>0; l,n=ndimage.label(m)
    for i in range(1,n+1):
        if (l==i).sum()<minpx: a[l==i]=0
    return a
def group(raws,W,H,ncol=15,fly=False):
    # common scale to fit (W-2,H-2)
    s=min(min((W-2)/r.shape[1],(H-2)/r.shape[0]) for r in raws)
    sm=[shrink(Image.fromarray(r,'RGBA'),s) for r in raws]
    q=quant(sm,ncol); out=[]
    for a in q:
        a=clean(crop(a)); a=np.pad(a,((1,1),(1,1),(0,0))); a=outline(a); a=crop(a)
        h,w=a.shape[:2]; m=a[...,3]>0
        if fly: cx=w//2
        else:
            rows=m[int(h*0.7):]; xs=np.where(rows)[1]; cx=int(xs.mean()) if len(xs) else w//2
        c=np.zeros((H,W,4),np.uint8); x=W//2-cx; x=min(max(x,0),W-w) if w<=W else (W-w)//2
        y=H-h if not fly else (H-h)//2 if False else H-h
        c[max(y,0):max(y,0)+min(h,H),x:x+w]=a[max(-y,0):max(-y,0)+min(h,H)] if w<=W else 0
        out.append(Image.fromarray(c,'RGBA'))
    return out,s
