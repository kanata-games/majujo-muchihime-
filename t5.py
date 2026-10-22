from playwright.sync_api import sync_playwright
import time
def tap(pg,k,d=.12):pg.evaluate(f'__G.K.{k}=1');time.sleep(d);pg.evaluate(f'__G.K.{k}=0');time.sleep(d)
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=2)
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  pg.goto('file://'+__import__('os').path.dirname(__import__('os').path.abspath(__file__))+'/index.html');time.sleep(1);pg.evaluate('__G.startGame()');time.sleep(.3)
  # stage 1 boss -> orb -> stage clear
  pg.evaluate('__G.s.pl.inv=99999;__G.s.pl.sub="axe";__G.s.pl.hearts=33;__G.setGold(777);__G.s.up.whip=2;__G.s.pl.stair=null;__G.setX(117*16,176)');time.sleep(2.5)
  pg.evaluate('__G.s.boss.hp=0;__G.s.boss.dead=1;__G.s.boss.t=0');time.sleep(3)
  pg.evaluate('const o=__G.s.boss;__G.s.pl.stair=null;__G.setX(o.x,176)');time.sleep(2.5)
  print('after s1 boss:',pg.evaluate('__G.s.scene'));pg.screenshot(path='screenshots/s1_stage_clear.png')
  tap(pg,'a');time.sleep(.6)
  st=pg.evaluate('[__G.s.scene,__G.s.SI,__G.s.gold,__G.s.up.whip,__G.s.pl.sub,__G.s.pl.hearts,__G.s.lives]');print('stage2 start:',st)
  assert st[:6]==['play',1,777,2,'axe',33],st
  pg.screenshot(path='screenshots/s2_intro.png')
  time.sleep(2.5);pg.evaluate('__G.s.pl.inv=99999;__G.s.pl.stair=null;__G.setX(56*16,176)');time.sleep(1.4);pg.evaluate('__G.K.a=1');time.sleep(.2);pg.evaluate('__G.K.a=0')
  pg.screenshot(path='screenshots/s2_gameplay.png')
  pg.evaluate('__G.s.pl.stair=null;__G.setX(118*16,176)');time.sleep(1.2);pg.screenshot(path='screenshots/s2_gameplay2.png')
  # stairs stage 2
  pg.evaluate('__G.s.pl.stair=null;__G.setX(22*16,176);__G.K.u=1');time.sleep(3.2);pg.evaluate('__G.K.u=0');print('s2 stair top',pg.evaluate('[__G.s.pl.x,__G.s.pl.y]'))
  # thorns damage test
  pg.evaluate('__G.s.pl.inv=0;__G.s.pl.hp=10;__G.s.pl.stair=null;__G.setX(15*16,176)');time.sleep(.3);print('thorn hp',pg.evaluate('__G.s.pl.hp'));pg.evaluate('__G.s.pl.inv=99999;__G.s.pl.hp=__G.s.pl.maxhp')
  # boss
  pg.evaluate('__G.s.pl.stair=null;__G.setX(177*16,176)');time.sleep(.6);print('boss scene:',pg.evaluate('__G.s.scene'));pg.screenshot(path='screenshots/s2_boss_talk.png')
  tap(pg,'a');tap(pg,'a');print('after talk',pg.evaluate('__G.s.scene'),pg.evaluate('__G.s.boss.hp'))
  seen=set()
  for i in range(60):
    time.sleep(.25);st=pg.evaluate('__G.s.boss.st');seen.add(st)
    if st=='pillar' and pg.evaluate('__G.s.pillars.length')>0 and 'shot' not in seen:
      time.sleep(.9);pg.screenshot(path='screenshots/s2_boss.png');seen.add('shot')
    if {'bullets','pillar','dash','shot'}<=seen:break
  print('witch states',seen)
  pg.evaluate('__G.K.a=1');time.sleep(.3);pg.evaluate('__G.K.a=0')
  pg.evaluate('__G.s.boss.hp=0;__G.s.boss.dead=1;__G.s.boss.t=0');time.sleep(3)
  pg.evaluate('const o=__G.s.boss;__G.s.pl.stair=null;__G.setX(o.x,176)');time.sleep(2.5);print('final:',pg.evaluate('__G.s.scene'))
  pg.screenshot(path='screenshots/s2_final_clear.png')
  # game over -> continue on stage 2
  pg.evaluate('__G.startGame();__G.nextStage()');time.sleep(.5)
  pg.evaluate('__G.s.pl.inv=0;__G.s.pl.hp=1;__G.s.pl.stair=null;__G.setX(15*16,176)');time.sleep(.3)
  pg.evaluate('window.__lv=()=>__G.s.lives');
  for k in range(4):
    time.sleep(3.2);sc=pg.evaluate('__G.s.scene')
    if sc=='over':break
    pg.evaluate('__G.s.pl.inv=0;__G.s.pl.hp=1;__G.s.pl.stair=null;__G.setX(15*16,176)')
  print('over?',sc);time.sleep(1.2);pg.screenshot(path='screenshots/s2_gameover.png');tap(pg,'a');time.sleep(.3)
  print('continue:',pg.evaluate('[__G.s.scene,__G.s.SI,__G.s.lives]'))
  print('errors',errs);b.close()
