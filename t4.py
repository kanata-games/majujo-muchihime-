from playwright.sync_api import sync_playwright
import time
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=2)
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  pg.goto('file://'+__import__('os').path.dirname(__import__('os').path.abspath(__file__))+'/index.html');time.sleep(1);pg.evaluate('__G.startGame()');time.sleep(2.2)
  # hit spark: skeleton with hp high near player
  pg.evaluate('__G.s.pl.inv=9999;__G.setX(380,176);__G.s.pl.f=1;const e=__G.s.ents.find(e=>e.t=="skel");e.x=440;e.mn=430;e.mx=450;e.hp=99;__G.K.a=1')
  time.sleep(.17);pg.screenshot(path='screenshots/10_hit_spark.png');pg.evaluate('__G.K.a=0')
  time.sleep(.3);pg.evaluate('const e=__G.s.ents.find(e=>e.t=="skel");e.hp=1;__G.K.a=1');time.sleep(.2);pg.evaluate('__G.K.a=0');time.sleep(.15)
  pg.screenshot(path='screenshots/11_death_flame.png')
  pg.evaluate('__G.s.pl.sub="holy";__G.s.pl.hearts=20;__G.setX(600,176);__G.K.s=1');time.sleep(.1);pg.evaluate('__G.K.s=0');time.sleep(.6)
  pg.screenshot(path='screenshots/12_holy_water.png')
  pg.evaluate('__G.setX(117*16,176)');time.sleep(3.5)
  pg.evaluate('__G.s.boss.hp=0;__G.s.boss.dead=1;__G.s.boss.t=0');time.sleep(1.0)
  pg.screenshot(path='screenshots/13_boss_explosion.png');print(errs);b.close()
