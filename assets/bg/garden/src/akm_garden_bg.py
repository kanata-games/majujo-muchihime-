import sys; sys.path.insert(0,'/workspace')
from akm_common import *
from akm_kq import kq
F='/workspace/game-assets/akumajo/bg/garden/'
W,H,K=480,270,40
def seam(a):  # a: (H, W+K) -> (H,W) crossfade wrap
    out=a[:,:W].astype(float).copy()
    t=np.linspace(0,1,K)[None,:,None]
    out[:,:K]=a[:,W:W+K]*(1-t)+a[:,:K]*t
    return out
# sky
sky=Image.open(F+'src/sky_raw.jpg').convert('RGB').resize((W+K,round(576*(W+K)/1024)),Image.LANCZOS)
s=np.array(sky)[-H:]; s=seam(s)
q=kq([np.dstack([s,np.full((H,W),255)]).astype(np.uint8)],16)[0]
Image.fromarray(q,'RGBA').save(F+'bg_sky.png')
# hedge: content x 8..1016 of raw
hr=Image.open(F+'src/hedge_raw.jpg').convert('RGB').crop((8,0,1016,576))
k=np.array(key(hr)); im=Image.fromarray(k,'RGBA')
sc=(W+K)/im.width; sm=shrink(im,sc)   # (h,520)
h=sm.shape[0]; ys=np.where(sm[...,3].any(1))[0]; bot=ys.max()
sm=sm[max(0,bot+1-H):bot+1]
if sm.shape[0]<H: sm=np.pad(sm,((H-sm.shape[0],0),(0,0),(0,0)))
rgb=seam(sm[...,:3].astype(float)); al=sm[...,3].copy()
alpha=np.maximum(al[:,:W],np.pad(al[:,W:W+K],((0,0),(0,W-K))))
# for overlap: where one side transparent, take other side colour
o=sm[:,:W,:3].astype(float); oo=sm[:,W:W+K,:3].astype(float)
A=al[:,:K]>0; B=al[:,W:W+K]>0
rgb[:,:K]=np.where((A&~B)[...,None],o[:,:K],np.where((B&~A)[...,None],oo,rgb[:,:K]))
L=np.dstack([np.clip(rgb,0,255),alpha]).astype(np.uint8)
L=kq([L],15)[0]; L[...,3]=np.where(alpha>0,255,0)
L=outline(L)
# ground strip must stay opaque at bottom: fill any gaps in bottom 20 rows
Image.fromarray(L,'RGBA').save(F+'bg_garden.png')
json.dump({'size':[W,H],'layers':[{'name':'sky','file':'bg_sky.png','order':0,'parallax':0.15,'repeat_x':True},
  {'name':'garden','file':'bg_garden.png','order':1,'parallax':0.45,'repeat_x':True}],
  'note':'sky is opaque (16 colours); garden is transparent above the hedges/iron arches (binary alpha, 15 colours + black outline) and is drawn over sky. Both loop horizontally at 480px.'},open(F+'bg.json','w'),indent=1,ensure_ascii=False)
sk=Image.open(F+'bg_sky.png'); ga=Image.open(F+'bg_garden.png')
pv=Image.new('RGBA',(W*2,H)); pv.paste(sk,(0,0)); pv.paste(sk,(W,0)); pv.alpha_composite(ga,(0,0)); pv.alpha_composite(ga,(W,0))
pv.convert('RGB').resize((W*2*2,H*2),0).save(F+'preview_tile2x.png')
p2=Image.new('RGBA',(W,H*2+8),BG+(255,)); p2.paste(sk,(0,0)); p2.alpha_composite(ga,(0,H+8))
p2.convert('RGB').resize((W*3,(H*2+8)*3),0).save(F+'preview.png')
