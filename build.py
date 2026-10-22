import base64,glob,os,json
R=os.path.dirname(os.path.abspath(__file__))+'/'
d=R+'assets/rosalinde/'
spr={os.path.basename(f)[:-4]:'data:image/png;base64,'+base64.b64encode(open(f,'rb').read()).decode() for f in sorted(glob.glob(d+'rosalinde_*_*.png'))+sorted(glob.glob(R+'assets/celestia/celestia_*_*.png'))+[R+'assets/celestia/celestia_face.png']+[f for dd in ['objects','enemies','boss','items'] for f in sorted(glob.glob(R+'assets/'+dd+'/*.png')) if 'preview' not in f and 'sheet' not in f]+sorted(glob.glob(R+'assets/effects/effect_*.png'))+[R+'assets/bg/bg_far.png',R+'assets/bg/bg_wall.png',R+'assets/tiles/tiles.png']}
G=R+'assets/'
def add(pat,prefix=''):
  for f in sorted(glob.glob(G+pat)):
    n=os.path.basename(f)[:-4]
    if n in('preview','sheet') or n.startswith('preview'):continue
    spr[prefix+n]='data:image/png;base64,'+base64.b64encode(open(f,'rb').read()).decode()
add('tiles/garden/tiles.png','garden_');add('bg/garden/*.png','garden_');add('enemies/garden/*.png');add('boss/witch/*.png');add('dialog/*.png');add('objects/garden/*.png')
tj=json.load(open(R+'assets/tiles/tiles.json'))['tiles']
gt=json.load(open(G+'tiles/garden/tiles.json'))['tiles'];gtjs=json.dumps({int(k):[v['x'],v['y']] for k,v in gt.items()})
tjs=json.dumps({int(k):[v['x'],v['y']] for k,v in tj.items()})
js=open(R+'game.src.js').read()
html='''<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes"><title>魔獣城の鞭姫</title><style>
html,body{margin:0;height:100%;background:#000;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none}
#c{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);image-rendering:pixelated}
.pad{position:absolute;bottom:4vh;display:flex;gap:2vw;z-index:2}.pad.l{left:3vw}.pad.r{right:3vw}
.b{width:13vh;height:13vh;border-radius:50%;background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.4);color:#fff;font:bold 3.6vh sans-serif;display:flex;align-items:center;justify-content:center;touch-action:none}
.b.on{background:rgba(255,80,80,.45)}#dp{position:absolute;left:3vw;bottom:4vh;width:40vh;height:40vh;z-index:2}
#dp{touch-action:none}#dp .b{position:absolute;border-radius:20%;pointer-events:none}
body.menu #dp,body.menu .pad{display:none}
#rot{display:none;position:fixed;inset:0;background:#000;color:#fff;z-index:9;align-items:center;justify-content:center;font:20px sans-serif;text-align:center}
@media (orientation:portrait) and (pointer:coarse){#rot{display:flex}}
@media (pointer:fine){#dp,.pad{opacity:.5}}
</style></head><body><canvas id="c" width="427" height="240"></canvas>
<div id="dp"><div class="b" data-d="u" style="left:13.5vh;top:0">▲</div><div class="b" data-d="l" style="left:0;top:13.5vh">◀</div><div class="b" data-d="r" style="left:27vh;top:13.5vh">▶</div><div class="b" data-d="d" style="left:13.5vh;top:27vh">▼</div></div>
<div class="pad r"><div class="b" data-k="s" style="margin-top:-6vh">サブ</div><div class="b" data-k="a">鞭</div><div class="b" data-k="j" style="margin-top:-12vh">跳</div></div>
<div id="rot">画面を横向きにしてください<br>📱↻</div>
<script>const SPR='''+json.dumps(spr)+''';const TILEJSON='''+tjs+''';const GTJ='''+gtjs+''';const FXJ='''+open(R+'assets/effects/sheet.json').read().replace('\n','')+''';
'''+js+'''</script></body></html>'''
open(R+'index.html','w').write(html)
print(len(spr),len(html))
