from PIL import Image
import numpy as np, json, random
from scipy import ndimage
P={'K':(0,0,0),'M':(14,16,26),'S0':(30,36,52),'S1':(46,54,74),'S2':(66,76,100),'S3':(92,104,132),'L':(146,160,196),
   'g0':(16,34,28),'g1':(28,58,40),'g2':(48,88,56),'g3':(86,130,80),'R0':(110,16,30),'R1':(196,40,52),'b0':(60,36,22),'b1':(132,96,56),'I':(52,50,66)}
def T(): return np.zeros((16,16,4),np.uint8)
def px(a,x,y,c):
    if 0<=x<16 and 0<=y<16: a[y,x]=P[c]+(255,)
def rect(a,x0,y0,x1,y1,c):
    for y in range(y0,y1+1):
        for x in range(x0,x1+1): px(a,x,y,c)
def cobble(a,y0=0,seed=0,base='S1'):
    # irregular cobbles, periodic in 16 both ways
    rnd=random.Random(seed)
    pts=[(rnd.randrange(16),rnd.randrange(16)) for _ in range(7)]
    for y in range(y0,16):
        for x in range(16):
            ds=sorted(((min(abs(x-px_),16-abs(x-px_))**2+min(abs(y-py),16-abs(y-py))**2*1.4),i) for i,(px_,py) in enumerate(pts))
            e=ds[1][0]-ds[0][0]
            if e<5: c='M'
            elif e<11: c='S0'
            else: c=['S1','S2','S1'][ds[0][1]%3] if base=='S1' else 'S0'
            px(a,x,y,c)
    for y in range(y0,15):
        for x in range(16):
            if tuple(a[y,x,:3])==P['M'] and tuple(a[y+1,x,:3]) not in (P['M'],): pass
tiles=[]
def add(name,a,solid,stairs=None,damage=0): tiles.append((name,a,solid,stairs,damage))
a=T(); cobble(a,0,1); rect(a,0,0,15,0,'L'); rect(a,0,1,15,1,'S3')
for x in (1,2,6,9,10,13): px(a,x,0,'g3'); px(a,x,1,'g2')  # moss on top
add('floor_top',a,True)
a=T(); cobble(a,0,2,'S0'); add('floor_fill',a,True)
# hedge (periodic leaf clumps)
a=T(); rnd=random.Random(5)
for y in range(16):
    for x in range(16):
        v=(np.sin((x)*2*np.pi/8)+np.cos((y+x//8*4)*2*np.pi/8))
        c='g1' if v>0.3 else ('g0' if v<-0.8 else 'g1')
        if v>1.1: c='g2'
        if v>1.6: c='g3'
        px(a,x,y,c)
for (x,y) in [(3,4),(11,12)]:
    px(a,x,y,'R1');px(a,x+1,y,'R0');px(a,x,y+1,'R0');px(a,x+1,y+1,'R0')
add('hedge_wall',a,True)
# thorns
a=T()
for x in range(16):
    for y in range(10,16): px(a,x,y,'b0' if (x+y)%3 else 'b1')
for x in range(0,16,4):
    for i in range(6):
        px(a,x+1,9-i,'b1' if i<5 else 'L'); 
        if i<4: px(a,x+2,9-i,'b0')
    px(a,x,7,'b1'); px(a,x+3,5,'b1')
px(a,6,12,'R1');px(a,13,11,'R1')
m=a[...,3]>0; d=ndimage.binary_dilation(m,structure=[[0,1,0],[1,1,1],[0,1,0]])&~m; a[d]=P['K']+(255,)
add('thorns',a,False,None,1)
def stair(right):
    a=T()
    for i in range(4):
        top=16-4*(i+1); xs=range(4*i,4*i+4) if right else range(15-4*i-3,15-4*i+1)
        for x in xs:
            for y in range(top,16):
                c='S1'
                if y==top: c='L'
                elif y==top+1: c='S3'
                elif y==top+3 and y<15: c='S0'
                px(a,x,y,c)
        edge=(4*i+3) if right else (15-4*i-3)
        for y in range(top,16): px(a,edge,y,'M' if y>top else 'S3')
        px(a,(4*i+1) if right else (15-4*i-1),top,'g3')
    return a
add('stair_right_up',stair(True),False,'right_up'); add('stair_left_up',stair(False),False,'left_up')
def plat(kind):
    a=T()
    for y in range(8):
        for x in range(16):
            c='S2'
            if y==1: c='L'
            elif y==2: c='S3'
            elif y==6: c='S0'
            elif x%8==7 and 2<y<6: c='M'
            px(a,x,y,c)
    for x in (3,4,11): px(a,x,1,'g3'); px(a,x,7,'g2'); px(a,x,8,'g1')
    px(a,4,9,'g1')
    rect(a,0,0,15,0,'K'); rect(a,0,7,15,7,'K')
    if kind=='left':
        for y in range(8): px(a,0,y,'K')
        a[0,0]=0; a[7,0]=0; px(a,1,1,'K')
    if kind=='right':
        for y in range(8): px(a,15,y,'K')
        a[0,15]=0; a[7,15]=0; px(a,14,1,'K')
    return a
add('platform_left',plat('left'),True); add('platform_middle',plat('mid'),True); add('platform_right',plat('right'),True)
# statue pedestal (full 16x16 block)
a=T(); rect(a,1,0,14,2,'S3'); rect(a,1,0,14,0,'L'); rect(a,3,3,12,11,'S1'); rect(a,3,3,4,11,'S2'); rect(a,11,3,12,11,'S0')
rect(a,5,5,10,9,'S0'); rect(a,6,6,9,8,'S2'); rect(a,1,12,14,15,'S2'); rect(a,1,12,14,12,'S3'); rect(a,1,15,14,15,'S0')
m=a[...,3]>0; d=ndimage.binary_dilation(m,structure=[[0,1,0],[1,1,1],[0,1,0]])&~m; a[d]=P['K']+(255,)
add('statue_pedestal',a,True)
# iron fence (tileable horizontally, 2 bars per tile)
a=T()
for bx in (3,11):
    for y in range(3,16): px(a,bx,y,'I'); px(a,bx+1,y,'K')
    px(a,bx,1,'L'); px(a,bx,2,'I'); px(a,bx-1,3,'I'); px(a,bx+1,3,'I')
for x in range(16): px(a,x,5,'I'); px(a,x,12,'I'); px(a,x,6,'K'); px(a,x,13,'K')
px(a,7,8,'R1'); px(a,8,9,'g2'); px(a,6,9,'g2')
add('iron_fence',a,False)
n=len(tiles); cols=8; rows=(n+cols-1)//cols
sh=Image.new('RGBA',(cols*16,rows*16)); meta={'tile_size':16,'columns':cols,'tiles':{}}
for i,(name,a,s,st,dm) in enumerate(tiles):
    sh.paste(Image.fromarray(a,'RGBA'),((i%cols)*16,(i//cols)*16))
    meta['tiles'][str(i)]={'name':name,'x':(i%cols)*16,'y':(i//cols)*16,'solid':s,'stairs':st,'damage':dm}
meta['palette']=['#%02x%02x%02x'%v for v in P.values()]
meta['notes']='Area 2 garden. Same format as tiles/tiles.json plus "damage" (contact damage, thorns=1). stairs are non-solid, stairs field gives direction. platform_* are 8px slabs at the top. hedge_wall and statue_pedestal are solid blocks; iron_fence is a non-solid foreground/background decoration that tiles horizontally.'
import os; os.chdir('/workspace/game-assets/akumajo/tiles/garden')
sh.save('tiles.png'); sh.save('sheet.png'); json.dump(meta,open('tiles.json','w'),indent=1); json.dump(meta,open('sheet.json','w'),indent=1)
BG=(0x1c,0x18,0x28,255)
pv=Image.new('RGBA',sh.size,BG); pv.alpha_composite(sh); pv.convert('RGB').resize((sh.width*4,sh.height*4),0).save('preview.png')
g={t[0]:Image.fromarray(t[1],'RGBA') for t in tiles}
sc=Image.new('RGBA',(192,112),BG)
for c in range(12): sc.alpha_composite(g['floor_top'],(c*16,80)); sc.alpha_composite(g['floor_fill'],(c*16,96))
for r in range(2,5):
    for c in range(0,2): sc.alpha_composite(g['hedge_wall'],(c*16,r*16))
for i in range(3): sc.alpha_composite(g['stair_right_up'],(32+16*i,64-16*i))
for i,nm in enumerate(['platform_left','platform_middle','platform_right']): sc.alpha_composite(g[nm],(96+16*i,32))
for c in range(7,10): sc.alpha_composite(g['thorns'],(c*16,64))
sc.alpha_composite(g['statue_pedestal'],(160,64)); 
for c in range(10,12): sc.alpha_composite(g['iron_fence'],(c*16,48))
sc.alpha_composite(g['stair_left_up'],(176,64-0)) if False else None
sc.convert('RGB').resize((768,448),0).save('src/scene_test.png'); sc.convert('RGB').resize((768,448),0).save('scene_test.png')
