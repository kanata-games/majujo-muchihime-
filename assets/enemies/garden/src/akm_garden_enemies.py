from akm_garden_chars import *
F=G+'enemies/garden/'
a,cs=comps(F+'src/enemies_raw.jpg')
def at(x,y):
    for (cx,cy),mm in cs:
        if abs(cx-x)<12 and abs(cy-y)<12: return mm
rose=[cut(a,at(*p)) for p in [(22,19),(249,23),(478,24),(715,33)]]
garg=[cut(a,at(*p)) for p in [(28,283),(246,267),(560,283)]]
crow=[cut(a,at(*p)) for p in [(47,497),(355,546)]]
for c in crow: c[...,:3]=np.clip(c[...,:3].astype(int)*1.8+20,0,255).astype(np.uint8)
s1=at(2,705); s2=at(240,708); s34=at(472,710)
sold=[cut(a,s1),cut(a,s2),cut(a,s34,(0,0,706,1024)),cut(a,s34,(706,0,1024,1024))]
seedraw=crop(a[115:170,950:1010].copy())
R,_=group(rose,32,32); Ga,_=group(garg,32,32); C,_=group(crow,16,16,ncol=10)
# soldier: scale so height 48 ; thrust frames need width -> 48 wide cells, anchor at body
S,_=group(sold,48,48)
Sd,_=group([seedraw],8,8,ncol=6)
fr=[('rose_idle_1',R[0]),('rose_idle_2',R[1]),('rose_spit_1',R[2]),('rose_spit_2',R[3]),('seed',Sd[0]),
    ('gargoyle_statue_1',Ga[0]),('gargoyle_fly_1',Ga[1]),('gargoyle_fly_2',Ga[2]),('crow_flap_1',C[0]),('crow_flap_2',C[1]),
    ('thornsoldier_walk_1',S[0]),('thornsoldier_walk_2',S[1]),('thornsoldier_thrust_1',S[2]),('thornsoldier_thrust_2',S[3])]
anims={'rose_idle':{'frames':['rose_idle_1','rose_idle_2'],'ms':300,'loop':True},
 'rose_spit':{'frames':['rose_spit_1','rose_spit_2'],'ms':150,'loop':False},
 'seed':{'frames':['seed'],'ms':100,'loop':True},
 'gargoyle_statue':{'frames':['gargoyle_statue_1'],'ms':100,'loop':False},
 'gargoyle_fly':{'frames':['gargoyle_fly_1','gargoyle_fly_2'],'ms':150,'loop':True},
 'crow_flap':{'frames':['crow_flap_1','crow_flap_2'],'ms':120,'loop':True},
 'thornsoldier_walk':{'frames':['thornsoldier_walk_1','thornsoldier_walk_2'],'ms':250,'loop':True},
 'thornsoldier_thrust':{'frames':['thornsoldier_thrust_1','thornsoldier_thrust_2'],'ms':150,'loop':False}}
anc=lambda n,im:[im.width//2,im.height//2] if n=='seed' else [im.width//2,im.height-1]
write_folder(F,fr,anims,anc,{'notes':'all face right; anchor = bottom centre (seed: centre). thornsoldier cells are 48x48 (spear thrust needs width); body is centred on x=24, so anchor (24,47). rose spits from the mouth at about (28,8) of rose_spit_2.'})
