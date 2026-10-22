# full touch playthrough test (iPhone landscape, real touch events via CDP)
from playwright.sync_api import sync_playwright
import time,sys
R=[]
def ok(n,c,info=''):R.append((n,c));print(('PASS ' if c else 'FAIL ')+n,info)
with sync_playwright() as p:
  b=p.chromium.launch();ctx=b.new_context(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=2)
  pg=ctx.new_page();cdp=ctx.new_cdp_session(pg)
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('file:///workspace/akumajo/index.html');time.sleep(1)
  def box(sel):return pg.evaluate(f"(()=>{{const r=document.querySelector('{sel}').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}})()")
  touches={}
  def send(t):
    pts=[{'x':x,'y':y,'id':i} for i,(x,y) in touches.items()]
    cdp.send('Input.dispatchTouchEvent',{'type':t,'touchPoints':pts})
  def down(i,xy):
    touches[i]=xy;send('touchStart')
  def move(i,xy):touches[i]=xy;send('touchMove')
  def up(i):
    del touches[i];cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd' if not touches else 'touchEnd','touchPoints':[{'x':x,'y':y,'id':k} for k,(x,y) in touches.items()]})
  S=lambda e:pg.evaluate(e)
  # start by tapping screen
  pg.touchscreen.tap(420,150);time.sleep(.4);ok('title->play by tap',S('__G.s.scene')=='play');time.sleep(.2)
  D={k:box(f'[data-d="{k}"]') for k in 'udlr'};BJ=box('[data-k="j"]');BA=box('[data-k="a"]');print(D,BJ)
  S('__G.s.pl.inv=999999;window.__noBlink=1')
  # walk right with touch D-pad
  down(0,D['r']);time.sleep(.6);f=S('__G.s.pl.f');x1=S('__G.s.pl.x');pg.screenshot(path='screenshots/t6_walk_right.png');up(0)
  ok('walk right moves right & faces right',x1>60 and f==1,(x1,f))
  down(0,D['l']);time.sleep(.3);f=S('__G.s.pl.f');pg.screenshot(path='screenshots/t6_walk_left.png');up(0);ok('walk left faces left',f==-1)
  # whip right
  down(0,D['r']);time.sleep(.1);up(0);down(1,BA);time.sleep(.2);pg.screenshot(path='screenshots/t6_whip_right.png');up(1);time.sleep(.3)
  # walk to first stair foot (x=512) then press up
  def walk_to(tx,tol=6):
    for _ in range(400):
      x=S('__G.s.pl.x')
      if abs(x-tx)<tol:break
      k='r' if x<tx else 'l';down(0,D[k]);time.sleep(.05);up(0)
  walk_to(32*16-14,10)  # deliberately a bit short of the foot
  down(0,D['u']);time.sleep(.5);on=S('!!__G.s.pl.stair');ok('stage1 stair mount with touch up (14px short)',on)
  time.sleep(3.0);up(0);time.sleep(.2);pos=S('[__G.s.pl.x,__G.s.pl.y,!!__G.s.pl.stair]');pg.screenshot(path='screenshots/t6_stairs.png');ok('climbed to upper floor',pos[1]==96 and not pos[2],pos)
  # back to ground; ledge jump at 70-74 row 8 (feet 128): stand at x=66*16+?; use direct position then touch jump right
  S('__G.s.pl.stair=null;__G.setX(68*16,176);__G.s.pl.g=1');time.sleep(.3)
  down(0,D['r']);down(1,BJ);time.sleep(.08);up(1);time.sleep(1.1);up(0);time.sleep(.3)
  y=S('__G.s.pl.y');print('on ledge x',S('__G.s.pl.x'));pg.screenshot(path='screenshots/t6_ledge.png');ok('jumped onto 3-tile ledge (row 8)',y==128,y)
  S('__G.setX(74*16,128)');time.sleep(.2);down(0,D['r']);down(1,BJ);time.sleep(.08);up(1);time.sleep(.9);up(0);time.sleep(.4);y2=S('__G.s.pl.y');ok('jump to 4-tile ledge (row 7)',y2==112,y2)
  # head-bump check: walk under the upper floor (row 6, 40-57) from ground: must not be blocked
  S('__G.setX(38*16,176)');time.sleep(.2);down(0,D['r']);time.sleep(2.0);up(0);x=S('__G.s.pl.x');ok('walk under upper floor without bump',x>44*16,x)
  # jump up through one-way upper floor from below
  down(1,BJ);time.sleep(.08);up(1);time.sleep(1.2);print('under-floor jump y',S('__G.s.pl.y'))
  # safe room
  S('__G.s.pl.stair=null;__G.setX(105*16,176)');time.sleep(.2);walk_to(109*16-30);down(0,D['u']);time.sleep(.2);up(0);time.sleep(.3)
  ok('safe room talk via touch up',S('__G.s.scene')=='talk');pg.screenshot(path='screenshots/t6_safe_room.png')
  for _ in range(6):down(1,BJ);time.sleep(.1);up(1);time.sleep(.1)
  S('__G.s.scene=="talk"&&0');time.sleep(.2)
  # boss
  if S('__G.s.scene')!='play':
    for _ in range(4):down(1,BJ);time.sleep(.1);up(1);time.sleep(.1)
  print('scene before boss',S('__G.s.scene'));S('__G.s.scene="play"');walk_to(118*16,12);time.sleep(2);ok('stage1 boss reached',S('!!__G.s.boss'));pg.screenshot(path='screenshots/t6_boss1.png')
  # stage 2 stairs via touch
  S('__G.nextStage();__G.s.pl.inv=999999');time.sleep(2.6)
  for bx,dr in [(22,1),(78,1)]:
    S(f'__G.s.pl.stair=null;__G.setX({bx}*16-16,176);__G.s.pl.g=1');time.sleep(.2)
    down(0,D['u']);time.sleep(.4);on=S('!!__G.s.pl.stair');time.sleep(3);up(0);time.sleep(.2)
    ok(f'stage2 stair at {bx} mount+climb',on and S('__G.s.pl.y')==96,S('[__G.s.pl.x,__G.s.pl.y]'))
  pg.screenshot(path='screenshots/t6_s2_stairs.png')
  # down stair 102 from top (97)
  S('__G.s.pl.stair=null;__G.setX(97*16-14,96);__G.s.pl.g=1');time.sleep(.2);down(0,D['d']);time.sleep(.4);on=S('!!__G.s.pl.stair');time.sleep(3);up(0);time.sleep(.2)
  ok('stage2 stair down mount',on and S('__G.s.pl.y')==176,S('[__G.s.pl.x,__G.s.pl.y]'))
  ok('no JS errors',not errs,errs)
  b.close()
print('RESULT',sum(c for _,c in R),'/',len(R))
