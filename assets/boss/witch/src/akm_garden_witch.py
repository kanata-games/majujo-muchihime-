from akm_garden_chars import *
F=G+'boss/witch/'
a,cs=comps(F+'src/witch_raw.jpg')
cs.sort(key=lambda c:c[0][0])
from PIL import ImageEnhance
def sat(r):
    im=Image.fromarray(r,'RGBA'); rgb=ImageEnhance.Color(im.convert('RGB')).enhance(1.8); rgb=ImageEnhance.Brightness(rgb).enhance(1.15)
    o=np.array(rgb.convert('RGBA')); o[...,3]=r[...,3]; return o
raws=[sat(cut(a,mm)) for _,mm in cs]
import akm_garden_chars as C
from scipy.cluster.vq import kmeans2
def kq(arrs,n=15):
    px=np.concatenate([a[a[...,3]>0][:,:3] for a in arrs]).astype(float)
    np.random.seed(1); cb,_=kmeans2(px,n,minit='++',iter=30)
    out=[]
    for a in arrs:
        f=a[...,:3].reshape(-1,3).astype(float); d=((f[:,None]-cb[None])**2).sum(-1); q=cb[d.argmin(1)].reshape(a.shape[:2]+(3,))
        out.append(np.dstack([q,a[...,3]]).astype(np.uint8))
    return out
C.quant=kq
Wf,s=C.group(raws,64,80)
print('scale',s,[c[0] for c in cs])
# procedural thorn bullet / pillar
P={'K':(0,0,0),'d':(40,22,18),'b':(92,56,30),'t':(150,104,58),'h':(206,170,110),'g':(34,60,30),'G':(70,110,52),'r':(120,16,30),'R':(196,40,52)}
def img(rows):
    h=len(rows); w=len(rows[0]); a=np.zeros((h,w,4),np.uint8)
    for y,r in enumerate(rows):
        for x,c in enumerate(r):
            if c!='.': a[y,x]=P[c]+(255,)
    return a
b1=img(["............",".....K......","....KhK.....","..K.KtK.K...","..KhKbKhK...","...KbbbbKKK.",".KKbbtbbhhK.","KhhbbtbbKK..","..KKbbbbK...","...KhKbKhK..","....K.KtK...","......KK...."])
b2=np.rot90(b1).copy()
def pillar(hh):
    a=np.zeros((64,16,4),np.uint8)
    for y in range(64-hh,64):
        t=y-(64-hh)
        for x in range(5,11):
            c='b' if x in (6,7) else ('t' if x==8 else 'd')
            if x in (5,10): c='K'
            a[y,x]=P[c]+(255,)
        # spikes
        if t%6==3:
            for dx,x0 in ((-1,4),(1,11)):
                xs=[x0,x0+dx,x0+2*dx] if (t//6)%2==(0 if dx<0 else 1) else []
                for i,x in enumerate(xs): a[y-i,x]=P['h' if i==len(xs)-1 else 't']+(255,); 
        if t%11==7 and hh>20:
            for (dx,dy) in ((0,0),(1,0),(0,1),(1,1)): a[y+dy-1,4+dx if (t//11)%2 else 10+dx]=P['R']+(255,)
    # tip
    top=64-hh
    for i,x in enumerate((7,8)): a[max(top-2,0):top,x]=P['h']+(255,)
    a=np.pad(a,((0,0),(0,0),(0,0))); m=a[...,3]>0
    d=ndimage.binary_dilation(m,structure=[[0,1,0],[1,1,1],[0,1,0]])&~m; a[d]=[0,0,0,255]
    return Image.fromarray(a,'RGBA')
fr=[('witch_float_1',Wf[0]),('witch_float_2',Wf[1]),('witch_summon_1',Wf[2]),('witch_summon_2',Wf[3]),('witch_charge_1',Wf[4]),('witch_defeat_1',Wf[5]),
    ('thornbullet_1',Image.fromarray(b1,'RGBA')),('thornbullet_2',Image.fromarray(b2,'RGBA')),
    ('thornpillar_1',pillar(16)),('thornpillar_2',pillar(40)),('thornpillar_3',pillar(62))]
anims={'witch_float':{'frames':['witch_float_1','witch_float_2'],'ms':250,'loop':True},
 'witch_summon':{'frames':['witch_summon_1','witch_summon_2'],'ms':200,'loop':False},
 'witch_charge':{'frames':['witch_charge_1'],'ms':100,'loop':False},
 'witch_defeat':{'frames':['witch_defeat_1'],'ms':100,'loop':False},
 'thornbullet':{'frames':['thornbullet_1','thornbullet_2'],'ms':80,'loop':True},
 'thornpillar_grow':{'frames':['thornpillar_1','thornpillar_2','thornpillar_3'],'ms':90,'loop':False}}
def anc(n,im):
    if n.startswith('thornbullet'): return [6,6]
    return [im.width//2,im.height-1]
write_folder(F,fr,anims,anc,{'notes':'witch faces right, 64x80, anchor bottom-centre (she floats: draw anchor above ground). thornpillar 16x64 anchored at ground (8,63); hitbox = opaque rows (grows 16->40->62 px). thornbullet anchor centre (6,6), frames are a 90deg rotation.'})
