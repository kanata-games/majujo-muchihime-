# Procedural NES-style effects for akumajo. Run: python3 src/build.py
import numpy as np, json, math, os
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BG=(0x1c,0x18,0x28); OUT=(16,8,16)
W=(252,252,252); Y=(252,216,96); O=(248,120,32); R=(200,40,24); DR=(112,16,24)
FIRE=[W,Y,O,R]                        # defeat flame ramp (swap these 4 for colour variants)
HOLY=[(232,248,252),(132,220,252),(40,140,248),(16,64,176)]
SMK=[W,(188,188,200),(124,120,144),(76,70,96)]
ST=[(200,200,212),(140,136,156),(88,84,108)]; GD=[(252,224,120),(208,148,40),(128,76,24)]
def canvas(w,h): return np.zeros((h,w,4),np.uint8)
def setp(a,x,y,c):
    if 0<=y<a.shape[0] and 0<=x<a.shape[1]: a[y,x]=list(c)+[255]
def outline(a,diag=False):
    m=a[...,3]>0; s=np.ones((3,3)) if diag else [[0,1,0],[1,1,1],[0,1,0]]
    d=ndimage.binary_dilation(m,structure=s)&~m; a=a.copy(); a[d]=list(OUT)+[255]; return a
def fill_field(a,f,ramp,th):
    # f: field array (h,w) higher=hotter; th thresholds descending for ramp[0..]
    for y in range(a.shape[0]):
        for x in range(a.shape[1]):
            v=f[y,x]
            for c,t in zip(ramp,th):
                if v>=t: setp(a,x,y,c); break
    return a
def flame_field(w,h,top,width,seed,phase,base=None):
    rng=np.random.default_rng(seed); f=np.zeros((h,w))
    base=h-2 if base is None else base
    for y in range(h):
        t=(base-y)/max(1,base-top)            # 0 at base,1 at tip
        if t<0 or t>1.05: continue
        hw=width*(math.sin(min(1,t*1.6+0.15)*math.pi/1.15+0.1))*(1-t**1.6)+0.3
        cx=w/2-0.5+math.sin(t*5+phase)*t*2.2
        for x in range(w):
            d=abs(x-cx)/max(hw,0.01)
            f[y,x]=(1-d)*(1-0.55*t)+rng.uniform(-.08,.08)
    return f
frames=[]; anims={}
def add(name,a,anchor): frames.append((name,Image.fromarray(a,'RGBA'),anchor))
# 1 hit spark 16x16
for i in range(3):
    a=canvas(16,16); c=7.5
    L=[4,7,5][i]; Ld=[2,5,6][i]
    for k in range(-L,L+1):
        col=W if abs(k)<=L-2 else Y
        if i==2 and abs(k)<3: continue
        setp(a,int(c+k+.5),7,col); setp(a,int(c+k+.5),8,col) if i<2 else None
        setp(a,7,int(c+k+.5),col); setp(a,8,int(c+k+.5),col) if i<2 else None
    for k in range(1,Ld+1):
        col=Y if k<Ld else O
        if i==2 and k<4: continue
        for sx,sy in((1,1),(-1,1),(1,-1),(-1,-1)): setp(a,int(c+sx*(k+.5)),int(c+sy*(k+.5)),col)
    if i==0:
        for y in range(6,10):
            for x in range(6,10): setp(a,x,y,W)
    add(f'effect_hit_{i+1}',outline(a),'center')
anims['hit']={'frames':[f'effect_hit_{i}' for i in (1,2,3)],'ms':[50,50,60],'loop':False}
# 2 defeat flame 16x32
spec=[(20,4.5,0),(8,6.5,1.5),(4,6,3),(14,4,4.5)]
for i,(top,wd,ph) in enumerate(spec):
    a=canvas(16,32); f=flame_field(16,32,top,wd,10+i,ph,base=29)
    if i==3: f-=0.15
    fill_field(a,f,FIRE,[.62,.42,.2,.02])
    if i==3:   # embers rising
        for x,y in((4,6),(11,3),(7,1)): setp(a,x,y,Y)
    add(f'effect_flame_{i+1}',outline(a),'bottom')
anims['flame']={'frames':[f'effect_flame_{i}' for i in (1,2,3,4)],'ms':[70,80,80,90],'loop':False,
 'palette_swap':{'ramp':[list(c) for c in FIRE],'note':'replace these 4 RGB values for colour variants; outline stays'}}
# 3 holy water fire 16x32 loop
for i in range(3):
    a=canvas(16,32); f=flame_field(16,32,[6,9,7][i],[6.5,6,7][i],30+i,i*2.1,base=30)
    fill_field(a,f,HOLY,[.6,.4,.18,.03])
    add(f'effect_holyfire_{i+1}',outline(a),'bottom')
anims['holyfire']={'frames':[f'effect_holyfire_{i}' for i in (1,2,3)],'ms':[80,80,80],'loop':True}
# 4 smoke 16x16
puffs=[[(8,11,4)],[(5,10,3),(11,10,3),(8,7,3.2)],[(4,8,2.2),(12,7,2.2),(8,4,2.5)]]
for i,P in enumerate(puffs):
    a=canvas(16,16)
    for y in range(16):
        for x in range(16):
            best=None
            for px,py,r in P:
                d=math.hypot(x-px,y-py)/r
                if d<=1 and (best is None or d<best[0]): best=(d,x-px,y-py)
            if best:
                d,dx,dy=best; lit=-(dx+dy)/ (2*P[0][2])  # light from top-left
                v=(1-d)*0.6+lit*0.8 - i*0.15
                setp(a,x,y,SMK[0] if v>.45 else SMK[1] if v>.1 else SMK[2] if v>-.3 else SMK[3])
    if i==2:  # thin out
        a[(np.indices((16,16)).sum(0)%2==0)&(a[...,3]>0)&(np.indices((16,16))[0]%4==0)]=0
    add(f'effect_smoke_{i+1}',outline(a),'bottom')
anims['smoke']={'frames':[f'effect_smoke_{i}' for i in (1,2,3)],'ms':[70,80,90],'loop':False}
# 5 boss explosion 32x32
for i in range(4):
    a=canvas(32,32); rng=np.random.default_rng(50+i); c=15.5
    R0=[6,11,14,15][i]
    ang=rng.uniform(0,6.28,9)
    for y in range(32):
        for x in range(32):
            dx,dy=x-c,y-c; r=math.hypot(dx,dy); th=math.atan2(dy,dx)
            edge=R0*(1+0.18*sum(math.cos(3*th+p)*0.33 for p in ang[:3])+0.12*math.cos(7*th+ang[4]))
            if r>edge: continue
            t=r/edge
            if i==3:  # hollow, dissipating ring of smoke
                if t<0.55: continue
                col=SMK[1] if t<.75 else SMK[2] if t<.9 else SMK[3]
                if rng.random()<0.25: continue
            elif i==2:
                if t<0.3: continue
                col=Y if t<.5 else O if t<.75 else R if t<.9 else DR
            else:
                col=W if t<[.5,.3][i] else Y if t<[.75,.55][i] else O if t<.8 else R
            setp(a,x,y,col)
    if i in(1,2):
        for k in range(6):
            th=ang[k]; rr=R0+rng.uniform(1,3)
            setp(a,int(c+math.cos(th)*rr),int(c+math.sin(th)*rr),Y)
    add(f'effect_explode_{i+1}',outline(a),'center')
anims['explode']={'frames':[f'effect_explode_{i}' for i in (1,2,3,4)],'ms':[60,80,90,110],'loop':False}
# 6 sparkle 8x8 and altar
for i in range(2):
    a=canvas(8,8)
    if i==0:
        for k in range(-3,4): setp(a,3+k,3,W if abs(k)<2 else HOLY[1]); setp(a,3,3+k,W if abs(k)<2 else HOLY[1])
    else:
        for x,y in((3,2),(2,3),(4,3),(3,4)): setp(a,x,y,HOLY[1])
        setp(a,3,3,W)
    add(f'effect_sparkle_{i+1}',a,'center')
anims['sparkle']={'frames':['effect_sparkle_1','effect_sparkle_2'],'ms':[200,200],'loop':True}
a=canvas(32,32)
def rect(x0,y0,x1,y1,c):
    for y in range(y0,y1+1):
        for x in range(x0,x1+1): setp(a,x,y,c)
rect(3,27,28,30,ST[1]); rect(3,27,28,27,ST[0]); rect(3,30,28,30,ST[2])     # base step
rect(7,15,24,26,ST[1]); rect(7,15,8,26,ST[0]); rect(23,15,24,26,ST[2])     # pedestal
for y in (19,23): rect(9,y,22,y,ST[2])
rect(5,13,26,14,ST[0]); rect(5,14,26,14,ST[2])                               # top slab
rect(15,18,16,24,GD[1]); rect(13,20,18,21,GD[1]); setp(a,15,18,GD[0]); setp(a,13,20,GD[0])  # cross
rect(15,4,16,12,GD[1]); rect(12,6,19,7,GD[1]); rect(15,4,15,12,GD[0]); rect(12,6,19,6,GD[0]); rect(16,8,16,12,GD[2])
for x in (6,25):  # candles
    rect(x,9,x,12,W); setp(a,x,8,Y); setp(a,x,7,O)
add('effect_altar_1',outline(a),'bottom')
anims['altar']={'frames':['effect_altar_1'],'ms':[1000],'loop':True}
# write files, sheet (row per animation), json
order=list(anims); rows={k:[f for f in frames if f[0] in anims[k]['frames']] for k in order}
SW=max(sum(f[1].width for f in r) for r in rows.values()); SH=sum(max(f[1].height for f in r) for r in rows.values())
sheet=Image.new('RGBA',(SW,SH)); js={'frames':{},'animations':anims}; y=0
for k in order:
    x=0; rh=max(f[1].height for f in rows[k])
    for n,im,an in rows[k]:
        im.save(f'{D}/{n}.png'); sheet.paste(im,(x,y))
        ax,ay=(im.width//2,im.height-1) if an=='bottom' else (im.width//2,im.height//2)
        js['frames'][n]={'x':x,'y':y,'w':im.width,'h':im.height,'anchor':{'x':ax,'y':ay,'type':an}}; x+=im.width
    y+=rh
sheet.save(f'{D}/sheet.png'); json.dump(js,open(f'{D}/sheet.json','w'),indent=1,ensure_ascii=False)
# preview x4
S=4; pad=6; lab=70
PW=lab+SW+pad*12; PH=sum(max(f[1].height for f in r)+pad for r in rows.values())+pad
pv=Image.new('RGB',(PW*S,PH*S),BG); dr=ImageDraw.Draw(pv); y=pad
try: font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
except: font=None
for k in order:
    rh=max(f[1].height for f in rows[k]); x=lab
    dr.text((8,(y+rh/2)*S-12),f"{k} ({len(rows[k])})",fill=(220,220,230),font=font)
    for n,im,an in rows[k]:
        pv.paste(im.resize((im.width*S,im.height*S),Image.NEAREST),(x*S,y*S),im.resize((im.width*S,im.height*S),Image.NEAREST)); x+=im.width+pad
    y+=rh+pad
pv.save(f'{D}/preview.png')
cols=set(); [cols.update(map(tuple,np.array(im)[np.array(im)[...,3]>0][:,:3].tolist())) for _,im,_ in frames]
print(len(frames),'frames',len(cols),'colours',sheet.size)
