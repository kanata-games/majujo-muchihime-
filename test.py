from playwright.sync_api import sync_playwright
import time
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=2)
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  pg.goto('file://'+__import__('os').path.dirname(__import__('os').path.abspath(__file__))+'/index.html');time.sleep(1.2)
  pg.screenshot(path='screenshots/01_title.png')
  pg.evaluate('__G.startGame()');time.sleep(.5)
  pg.evaluate('__G.K.r=1');time.sleep(2.5);pg.evaluate('__G.K.r=0;__G.K.a=1');time.sleep(0.22)
  pg.screenshot(path='screenshots/02_gameplay_whip.png');pg.evaluate('__G.K.a=0')
  # stairs test
  pg.evaluate('__G.s.pl.inv=9999;__G.setX(32*16,176);__G.K.u=1');time.sleep(1.6);print('stair',pg.evaluate('[__G.s.pl.x,__G.s.pl.y,!!__G.s.pl.stair]'))
  pg.screenshot(path='screenshots/03_stairs.png');time.sleep(1);pg.evaluate('__G.K.u=0');print('after',pg.evaluate('[__G.s.pl.x,__G.s.pl.y,__G.s.pl.g]'))
  pg.evaluate('__G.setX(117*16,176);__G.s.pl.inv=9999;__G.s.pl.stair=null');time.sleep(3.5)
  pg.evaluate('__G.K.a=1');time.sleep(.2);pg.screenshot(path='screenshots/04_boss.png');pg.evaluate('__G.K.a=0')
  for i in range(40):
    if pg.evaluate('__G.s.boss.dead'):break
    pg.evaluate('__G.s.boss.iv=0;__G.s.boss.hp-=2;__G.s.boss.hp<=0&&(__G.s.boss.dead=1,__G.s.boss.t=0)')
  time.sleep(3);pg.evaluate('__G.setX(__G.s.boss.x,176)');time.sleep(3)
  print(pg.evaluate('__G.s.scene'));pg.screenshot(path='screenshots/05_clear.png')
  pg.evaluate('__G.startGame();__G.s.pl.hp=1;__G.s.pl.inv=0');pg.evaluate('__G.s.ents.push({t:"bat",x:__G.s.pl.x,y:__G.s.pl.y-10,w:12,h:8,hp:1,st:0,flash:0})');time.sleep(.3)
  print('dead',pg.evaluate('__G.s.pl.dead'));print('errors',errs);b.close()
