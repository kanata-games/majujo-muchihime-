from playwright.sync_api import sync_playwright
import time
def tap(pg,k,d=.12):pg.evaluate(f'__G.K.{k}=1');time.sleep(d);pg.evaluate(f'__G.K.{k}=0');time.sleep(d)
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=2)
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  pg.goto('file:///workspace/akumajo/index.html');time.sleep(1)
  pg.evaluate('__G.startGame()');time.sleep(.3)
  print('bossbar-check scene',pg.evaluate('__G.s.boss'))
  # stair loose entry: 12px off
  pg.evaluate('__G.s.pl.inv=9999;__G.setX(32*16-12,176);__G.K.u=1');time.sleep(.4);print('stair mounted',pg.evaluate('!!__G.s.pl.stair'));pg.evaluate('__G.K.u=0')
  pg.evaluate('__G.s.pl.stair=null;__G.setX(109*16-32,176);__G.s.pl.f=1;__G.setGold(1200);__G.s.pl.hearts=25');time.sleep(2.2);pg.evaluate('__G.s.pl.inv=0')
  pg.screenshot(path='screenshots/06_safe_room.png')
  tap(pg,'u');time.sleep(.3);pg.screenshot(path='screenshots/07_npc_talk.png');print(pg.evaluate('__G.s.scene'))
  tap(pg,'a');tap(pg,'a');tap(pg,'a');tap(pg,'d');tap(pg,'a');time.sleep(.2)
  pg.screenshot(path='screenshots/08_upgrade_menu.png');print(pg.evaluate('[__G.s.gold,__G.s.up,__G.s.talk.msg]'))
  tap(pg,'u');tap(pg,'a');tap(pg,'d');tap(pg,'d');tap(pg,'a');print(pg.evaluate('[__G.s.gold,__G.s.up,__G.s.pl.maxhp,__G.s.pl.hearts]'))
  tap(pg,'j');print(pg.evaluate('__G.s.scene'))
  pg.evaluate('__G.s.pl.inv=0;__G.setX(103*16,176);__G.s.pl.f=1;__G.K.a=1');time.sleep(.22);pg.screenshot(path='screenshots/09_whip_lv2.png');pg.evaluate('__G.K.a=0')
  print(errs);b.close()
