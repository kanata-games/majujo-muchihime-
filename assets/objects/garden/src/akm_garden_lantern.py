import sys; sys.path.insert(0,'/workspace')
from akm_common import *
F='/workspace/game-assets/akumajo/objects/garden/'
P={'K':(0,0,0),'I':(52,50,66),'i':(90,88,110),'Y':(255,224,120),'O':(240,150,50),'R':(190,60,30),'G':(120,140,90),'g':(200,210,150),'w':(255,250,220)}
def draw(rows):
    a=np.zeros((32,16,4),np.uint8)
    for y,r in enumerate(rows):
        for x,c in enumerate(r.ljust(16,'.')[:16]):
            if c!='.': a[y,x]=P[c]+(255,)
    m=a[...,3]>0; d=ndimage.binary_dilation(m,structure=[[0,1,0],[1,1,1],[0,1,0]])&~m; a[d]=[0,0,0,255]
    return Image.fromarray(a,'RGBA')
top=["","       ii","      iIIi","     iIIIIi","    IIIIIIII"]
body1=["    IgYYYYgI","    IgYwOYgI","    IgYOOYgI","    IgOYYOgI","    IgYYYYgI","    IIIIIIII","      iI"]
body2=["    IgYYYYgI","    IgYOwYgI","    IgYOOYgI","    IgYOOYgI","    IgOYYOgI","    IIIIIIII","      iI"]
pole=["      iI"]*14+["     iIIi","    iIIIIi"]
def full(body,sh=0):
    rows=top+body+pole
    rows=[(' '*sh+r) if 5<=i<12+0 or i<5 else r for i,r in enumerate(rows)]
    return draw([r.replace(' ','.') for r in rows][:32])
l1=full(body1,0); l2=full(body2,0)
# sway: shift lantern head 1px right in frame 2
a2=np.array(l2); head=a2[:13].copy(); a2[:13]=0; a2[:13,1:]=head[:,:-1]; l2=Image.fromarray(a2,'RGBA')
broken=draw([r.replace(' ','.') for r in (["","","","","","","","","","",""," ","    I  i"," i  iI  "," ii i I","   ii"," "]+pole[1:])][:32])
fr=[('lantern_1',l1),('lantern_2',l2),('lantern_broken',broken)]
write_folder(F,fr,{'lantern':{'frames':['lantern_1','lantern_2'],'ms':200,'loop':True},'lantern_broken':{'frames':['lantern_broken'],'ms':100,'loop':False}},lambda n,i:[8,31],
 {'notes':'garden replacement for candle: same size/anchor as objects/candle (16x32, anchor (8,31)). Use effect_flame on break, then show lantern_broken.'})
Image.open(F+'preview.png').resize((Image.open(F+'preview.png').width*4//3,Image.open(F+'preview.png').height*4//3),0).save(F+'preview.png')
