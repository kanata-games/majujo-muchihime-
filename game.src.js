'use strict';
const W=427,H=240,TS=16,HUD=32;
const cv=document.getElementById('c'),cx=cv.getContext('2d');cx.imageSmoothingEnabled=false;
function fit(){const s=Math.min(innerWidth/W,innerHeight/H);cv.style.width=W*s+'px';cv.style.height=H*s+'px';}
addEventListener('resize',fit);fit();
const IMG={};for(const k in SPR){const i=new Image();i.src=SPR[k];IMG[k]=i;}
// ---- input
const K={};const keymap={ArrowLeft:'l',ArrowRight:'r',ArrowUp:'u',ArrowDown:'d',KeyZ:'j',Space:'j',KeyX:'a',KeyC:'s',Enter:'st'};
addEventListener('keydown',e=>{if(keymap[e.code]){K[keymap[e.code]]=1;e.preventDefault();}});
addEventListener('keyup',e=>{if(keymap[e.code])K[keymap[e.code]]=0;});
document.querySelectorAll('[data-k]').forEach(b=>{const k=b.dataset.k;
 const on=e=>{e.preventDefault();K[k]=1;b.classList.add('on');if(k!='st')K.st=1;};const off=e=>{e.preventDefault();K[k]=0;b.classList.remove('on');K.st=0;};
 b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);});
document.addEventListener('pointerdown',()=>{K.st=1;setTimeout(()=>K.st=0,100)});
let P={};function pressed(k){return K[k]&&!P[k];}
// ---- stages
let COLS=140;const ROWS=13;let map,stairs=[],SI=0,ST,thorns=[],props=[],pillars=[];
const STAGES=[
 {name:'城門と大広間',theme:'castle',cols:140,gate:112,npc:109,safe:[105,113],
  build(fill){fill(40,57,6,6);fill(70,74,8,8);fill(78,82,7,7);fill(88,90,9,10);},
  stairs:[{bx:32,by:11,dir:1,n:10},{bx:66,by:11,dir:-1,n:10}],
  candles:[[6,9,'h'],[12,9,'knife'],[18,9,'h'],[26,9,'H'],[36,9,'h'],[44,4,'axe'],[50,4,'h'],[56,4,'H'],[62,9,'h'],[72,6,'holy'],[80,5,'h'],[86,9,'H'],[96,9,'h'],[100,9,'money'],[104,9,'H']],
  spawn(E){E.sk(24,11,20,30);E.sk(48,6,42,56);E.sk(96,11,92,101);E.sk(84,11,76,87);[[30,4],[60,3],[76,3],[94,4],[102,3]].forEach(b=>E.bat(...b));
   E.z(8,22);E.z(58,70);E.z(90,104);},
  boss:'bat',bossName:'巨大コウモリ「ファントムバット」'},
 {name:'月夜の庭園',theme:'garden',cols:200,gate:172,npc:108,safe:[103,113],
  build(fill){fill(27,45,6,6);fill(47,49,8,8);fill(52,55,6,6);fill(83,97,6,6);fill(126,126,9,10);fill(130,133,8,8);fill(136,139,6,6);fill(146,146,9,10);fill(156,159,8,8);},
  stairs:[{bx:22,by:11,dir:1,n:10},{bx:78,by:11,dir:1,n:10},{bx:102,by:11,dir:-1,n:10}],
  thorns:[[14,16,11],[33,35,6],[66,68,11],[89,91,6],[120,122,11],[140,142,11],[163,165,11]],
  props:[['fence',20,30],['fence',122,128],['fence',160,170],['hedge',2,12],['statue',10],['hedge',36,44],['fountain',58],['arch',70],['hedge',108,118],['fountain',150],['statue',168],['hedge',176,196],['arch',186]],
  candles:[[5,9,'h'],[12,9,'H'],[19,9,'h'],[30,4,'knife'],[38,4,'h'],[44,4,'H'],[48,6,'h'],[54,4,'axe'],[62,9,'h'],[72,9,'money'],[86,4,'h'],[94,4,'holy'],[106,9,'H'],[116,9,'h'],[131,6,'h'],[138,4,'H'],[152,9,'h'],[158,6,'money'],[166,9,'H']],
  spawn(E){E.rose(18,11);E.rose(40,6);E.rose(64,11);E.rose(92,6);E.rose(124,11);E.rose(144,11);
   E.garg(60,8);E.garg(75,11);E.garg(150,8);E.garg(161,11);
   [[30,3],[50,4],[88,3],[134,3],[154,4]].forEach(c=>E.crow(...c));
   E.sold(8,11,4,12);E.sold(70,11,62,76);E.sold(118,11,114,124);E.sold(132,11,128,140);E.sold(160,11,152,166);},
  boss:'witch',bossName:'茨の魔女「ローゼンヘクセ」',
  bossLines:['……薔薇の香りに誘われて来たのかしら、獣使いのお嬢さん。','この庭の茨は、あなたの血を欲しがっているわ。さあ、踊りなさい！']},
];
function buildMap(){COLS=ST.cols;map=[];for(let y=0;y<ROWS;y++){map.push(new Array(COLS).fill(0));}
 const fill=(x0,x1,y0,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)map[y][x]=1;};
 fill(0,COLS-1,11,12);fill(0,0,0,10);fill(COLS-1,COLS-1,0,10);
 ST.build(fill);fill(ST.gate,ST.gate,0,7);fill(ST.gate+1,COLS-1,0,0);
 stairs=ST.stairs.map(s=>({bx:s.bx*TS,by:s.by*TS,dir:s.dir,n:s.n}));
 thorns=(ST.thorns||[]).map(t=>({x0:t[0]*TS,x1:(t[1]+1)*TS,y:t[2]*TS}));props=ST.props||[];pillars=[];}
// stair: bottom foot at (bx,by); each step +8x*dir, -8y. top = (bx+dir*8n, by-8n)
function solid(px,py){const x=Math.floor(px/TS),y=Math.floor(py/TS);if(x<0||x>=COLS)return 1;if(y<0)return 0;if(y>=ROWS)return 0;return map[y][x];}
// ---- state
let scene='title',tick=0,score=0,lives=3,stageTime=400,camX=0,bossLock=false,msgT=0,endT=0,hi=0;
let gold=0,up={hp:0,whip:1,cap:2},talk=null;
let NPCX=109*16;
let corpses=[];let SAFE0=105*16,SAFE1=113*16;
let pl,ents,fx,items,projs,boss,btalk=null,overSel=0;
function resetStage(mode){ST=STAGES[SI];buildMap();NPCX=ST.npc*TS;SAFE0=ST.safe[0]*TS;SAFE1=ST.safe[1]*TS;
 const old=pl;
 pl={x:40,y:176,vx:0,vy:0,f:1,g:1,hp:16+up.hp*4,maxhp:16+up.hp*4,hearts:5,sub:null,atk:0,crouch:0,hurt:0,inv:0,stair:null,dead:0,anim:0,jvx:0,throwT:0};
 if(mode=='next'&&old){pl.hearts=old.hearts;pl.sub=old.sub;}
 ents=[];fx=[];corpses=[];efx=[];deco=[];if(ST.theme=='castle')buildDeco();items=[];projs=[];boss=null;btalk=null;bossLock=false;camX=0;stageTime=400;
 ST.candles.forEach(([tx,ty,d])=>ents.push({t:'candle',x:tx*TS+8,y:ty*TS+16,w:8,h:14,hp:1,drop:d}));
 const E={sk:(tx,ty,mn,mx)=>ents.push({t:'skel',x:tx*TS,y:ty*TS,w:12,h:40,hp:3,mn:mn*TS,mx:mx*TS,f:-1,cd:90,vx:-.4,flash:0}),
  bat:(tx,ty)=>ents.push({t:'bat',x:tx*TS,y:ty*TS,w:12,h:8,hp:1,st:0,flash:0}),
  z:(a,b)=>ents.push({t:'zspawn',x:a*TS,x1:b*TS,cd:60}),
  rose:(tx,ty)=>ents.push({t:'rose',x:tx*TS+8,y:ty*TS,w:14,h:30,hp:3,cd:60+Math.random()*60,flash:0}),
  garg:(tx,ty)=>ents.push({t:'garg',x:tx*TS+8,y:ty*TS,w:20,h:20,hp:4,st:'statue',t2:0,flash:0,py:ty*TS}),
  crow:(tx,ty)=>ents.push({t:'crow',x:tx*TS,y:ty*TS,w:12,h:10,hp:1,st:0,flash:0}),
  sold:(tx,ty,mn,mx)=>ents.push({t:'sold',x:tx*TS,y:ty*TS,w:12,h:40,hp:4,mn:mn*TS,mx:mx*TS,f:-1,vx:-.45,th:0,cd:0,flash:0})};
 ST.spawn(E);}
function startGame(){score=0;gold=0;up={hp:0,whip:1,cap:2};talk=null;lives=3;SI=0;pl=null;resetStage('new');scene='play';msgT=150;}
function nextStage(){SI++;resetStage('next');scene='play';msgT=150;}
function continueGame(){lives=3;score=0;pl=null;resetStage('new');scene='play';msgT=150;}
function ov(a,b){return a.x-a.w/2<b.x+b.w/2&&a.x+a.w/2>b.x-b.w/2&&a.y-a.h<b.y&&a.y>b.y-b.h;}
function pbox(){const h=pl.crouch?34:48;return{x:pl.x,y:pl.y,w:14,h};}
function whipBox(){ // sync with whip_3/crouchwhip_3 frames: lash x +24..+96, y feet-36..-28
 if(!(pl.atk>=9&&pl.atk<17))return null;const yo=pl.crouch?-28:-31;
 const ex=(up.whip-1)*16;return{x:pl.x+pl.f*(60+ex/2),y:pl.y+yo+6,w:76+ex,h:16};}
function hurtPlayer(d,fromX){if(pl.inv||pl.dead)return;pl.hp-=d;pl.inv=100;
 if(pl.hp<=0){pl.hp=0;die();return;}
 if(!pl.stair){pl.hurt=1;pl.atk=0;pl.crouch=0;const dir=fromX>pl.x?-1:1;pl.f=-dir;pl.vx=dir*1.1;pl.vy=-3;pl.g=0;}}
function die(){pl.dead=1;pl.deadT=0;pl.stair=null;}
function spark(x,y,c){efx.push({a:'hit',x,y,t:0});}
const RAMP=FXJ.animations.flame.palette_swap.ramp;
const PAL={candle:null,skel:[[252,252,252],[220,228,236],[150,170,200],[70,80,120]],bat:[[252,220,252],[220,120,236],[150,50,180],[80,20,110]],zombie:[[236,252,200],[150,220,90],[70,150,50],[30,80,30]],boss:[[252,252,252],[252,120,140],[220,30,60],[110,0,30]]};
PAL.star=[[255,255,255],[255,255,236],[255,248,190],[236,236,200]];const palCache={};
function whipContact(e){const tip=pl.x+pl.f*(96+(up.whip-1)*16),l=e.x-e.w/2,r=e.x+e.w/2;const x=pl.f>0?Math.max(l,Math.min(r,Math.min(tip,l+6))):Math.min(r,Math.max(l,Math.max(tip,r-6)));return[x,pl.y+(pl.crouch?-31:-34)];}
function hitFx(x,y){fxA('hit',x,y,'star',{sc:2,flash:1});}
function palImg(name,pk){const im=IMG[name];if(!pk||!PAL[pk])return im;const key=name+'|'+pk;if(palCache[key])return palCache[key];if(!im||!im.complete||!im.width)return im;
 const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,c.width,c.height),p=d.data,to=PAL[pk];
 for(let i=0;i<p.length;i+=4){if(!p[i+3])continue;for(let k=0;k<4;k++){const r=RAMP[k];if(p[i]==r[0]&&p[i+1]==r[1]&&p[i+2]==r[2]){p[i]=to[k][0];p[i+1]=to[k][1];p[i+2]=to[k][2];break;}}}
 g.putImageData(d,0,0);return palCache[key]=c;}
let efx=[];
function fxA(a,x,y,pal,o){efx.push(Object.assign({a,x,y,t:0,pal},o||{}));}
function fxFrame(e){const an=FXJ.animations[e.a];let t=e.t*1000/60,tot=an.ms.reduce((a,b)=>a+b,0);if(an.loop)t%=tot;else if(t>=tot)return null;for(let i=0;i<an.ms.length;i++){if(t<an.ms[i])return an.frames[i];t-=an.ms[i];}return an.frames[an.frames.length-1];}
function updFx(){for(const e of efx){e.t++;if(e.vy){e.y+=e.vy;}if(e.delay>0){e.delay--;e.t=0;}} efx=efx.filter(e=>e.delay>0||fxFrame(e)!==null);}
function drawFxE(e,wx,wy,pal){const n=fxFrame(e);if(!n)return;const fr=FXJ.frames[n],im=palImg(n,pal);if(!im||(im.complete===false))return;const sc=e.sc||1;const X=Math.round(wx-camX),Y=Math.round(wy+HUD);
 if(e.flash&&e.t<5){cx.globalAlpha=(5-e.t)/5*.9;cx.fillStyle='#fff';const r=14-e.t*2;cx.fillRect(X-r,Y-2,r*2,4);cx.fillRect(X-2,Y-r,4,r*2);cx.fillRect(X-r/2,Y-r/2,r,r);cx.globalAlpha=1;}
 cx.drawImage(im,X-fr.anchor.x*sc,Y-fr.anchor.y*sc,fr.w*sc,fr.h*sc);}
function drawFx(){for(const e of efx)if(!(e.delay>0))drawFxE(e,e.x,e.y,e.pal);}
function drop(x,y,d){if(d)items.push({x,y,vy:0,d,l:600});}
function killEnt(e,pts){e.dead=1;if(e.t=='skel')corpses.push({k:'skel',x:e.x,y:e.y,f:e.f,l:24});score+=pts;gold+=Math.round(pts/5);fxA('flame',e.x-5,e.y,e.t,{delay:6});fxA('flame',e.x+5,e.y,e.t,{delay:9});if(Math.random()<.25)drop(e.x,e.y-8,'h');}
// ---- update
function update(){tick++;
 if(scene=='talk'){updTalk();return;}
 if(scene=='title'){if(pressed('st')||pressed('a')||pressed('j'))startGame();return;}
 if(scene=='btalk'){if(pressed('a')||pressed('j')||pressed('st')||pressed('u')){btalk.i++;if(btalk.i>=ST.bossLines.length){scene='play';btalk=null;}}return;}
 if(scene=='sclear'){endT++;if(endT>60&&(pressed('st')||pressed('a')||pressed('j')))nextStage();return;}
 if(scene=='over'){endT++;if(pressed('u')||pressed('d'))overSel^=1;if(endT>60&&(pressed('a')||pressed('j')||pressed('st'))){if(overSel==0)continueGame();else{hi=Math.max(hi,score);scene='title';camX=0;}}return;}
 if(scene=='clear'){endT++;if(endT>60&&(pressed('st')||pressed('a')||pressed('j'))){hi=Math.max(hi,score);scene='title';camX=0;}return;}
 if(msgT>0)msgT--;
 if(tick%60==0&&!pl.dead&&!(boss&&boss.dead)){stageTime--;if(stageTime<=0)die();}
 updPlayer();
 // camera
 if(!bossLock){camX=Math.max(0,Math.min(pl.x-W/2,COLS*TS-W));if(pl.x>(ST.gate+4)*TS){bossLock=true;startBoss();}}
 else camX+= ((COLS*TS-W)-camX)*.1;
 updEnts();updProjs();updItems();updHaz();
 corpses=corpses.filter(c=>--c.l>0);updFx();fx=fx.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.1;return --p.l>0;});
}
function startBoss(){const g=ST.gate+2;map[8][g]=map[9][g]=map[10][g]=1;// close gate
 const hp=ST.boss=='witch'?32:24;boss={kind:ST.boss,x:(COLS-14)*TS,y:60,w:40,h:24,hp,max:hp,st:'wake',t:0,flash:0,dead:0,tx:(COLS-14)*TS,ty:0,cyc:0};msgT=0;
 if(ST.bossLines){scene='btalk';btalk={i:0};pl.vx=0;pl.atk=0;}}
function onStairAt(){ // find stair to mount
 for(const s of stairs){const tx=s.bx+s.dir*8*s.n,ty=s.by-8*s.n;
  if(K.u&&Math.abs(pl.x-s.bx)<14&&Math.abs(pl.y-s.by)<8)return{s,i:0};
  if(K.d&&Math.abs(pl.x-tx)<14&&Math.abs(pl.y-ty)<8)return{s,i:s.n*8};}return null;}
function updPlayer(){const p=pl;if(p.inv)p.inv--;
 if(p.dead){p.deadT++;if(!p.g){p.vy+=.25;moveY();}
  if(p.deadT>150){lives--;if(lives<0){scene='over';endT=0;overSel=0;}else{resetStage('death');msgT=150;}}return;}
 if(p.throwT)p.throwT--;
 // stairs
 if(p.stair){const st=p.stair,s=st.s;
  if(p.atk){p.atk++;if(p.atk>22)p.atk=0;}
  else{ if(pressed('a')){if(K.u&&p.sub)throwSub();else p.atk=1;}
   else if(pressed('s')&&p.sub)throwSub();
   let m=0;if(K.u||(K.r&&s.dir==1)||(K.l&&s.dir==-1))m=1;if(K.d||(K.l&&s.dir==1)||(K.r&&s.dir==-1))m=-1;
   let mv=0;if(m&&tick%2==0){st.i+=m;mv=1;p.f=m>0?s.dir:-s.dir;p.anim++;}
   st.i=Math.max(0,Math.min(s.n*8,st.i));p.x=s.bx+s.dir*st.i;p.y=s.by-st.i;
   if(mv&&(st.i<=0||st.i>=s.n*8)){p.stair=null;p.g=1;}}
  return;}
 // attack progress
 if(p.atk){p.atk++;if(p.atk>22)p.atk=0;}
 if(p.hurt){p.vy+=.25;moveX(p.vx);moveY();if(p.g){p.hurt=0;p.vx=0;}return;}
 if(p.g){p.crouch=K.d&&!p.atk?1:(p.atk?p.crouch:0);
  if(pressed('u')&&Math.abs(p.x-NPCX)<36&&!p.atk){openTalk();return;}
  const ms=onStairAt();if(ms&&!p.atk){p.stair=ms;p.crouch=0;p.vx=0;return;}
  if(pressed('a')){if(K.u&&p.sub)throwSub();else{p.atk=1;}}
  else if(pressed('s')&&p.sub)throwSub();
  if(!p.atk&&!p.crouch&&!p.throwT){p.vx=K.l?-1:K.r?1:0;if(p.vx)p.f=p.vx;else p.anim=0;}else p.vx=0;
  if(pressed('j')&&!p.atk&&!p.crouch){p.vy=-4.3;p.g=0;p.jvx=K.l?-1:K.r?1:0;if(p.jvx)p.f=p.jvx;p.vx=p.jvx;}
 }else{ // stiff arc: horizontal locked
  if(pressed('a')){if(K.u&&p.sub)throwSub();else if(!p.atk)p.atk=1;}else if(pressed('s')&&p.sub)throwSub();
  p.vx=p.jvx;p.vy=Math.min(p.vy+.22,5);}
 if(p.vx)p.anim++;
 moveX(p.vx);if(p.g){ if(!solid(p.x-6,p.y+1)&&!solid(p.x+6,p.y+1)){p.g=0;p.vy=1;p.jvx=0;} }else moveY();
 if(p.y>ROWS*TS+40){p.hp=0;die();}
}
function moveX(vx){const p=pl;const nx=p.x+vx;const e=vx>0?7:-7;
 if(!solid(nx+e,p.y-2)&&!solid(nx+e,p.y-24)&&!solid(nx+e,p.y-44))p.x=nx;
 if(bossLock)p.x=Math.max(camX+8,Math.min(camX+W-8,p.x));}
function moveY(){const p=pl;const ny=p.y+p.vy;
 if(p.vy>0){if(solid(p.x-6,ny)||solid(p.x+6,ny)){p.y=Math.floor(ny/TS)*TS;if(p.vy>=3.5&&!p.dead){fxA('smoke',p.x-8,p.y);fxA('smoke',p.x+8,p.y);}p.vy=0;p.g=1;p.jvx=0;}else p.y=ny;}
 else{if(solid(p.x-5,ny-48)||solid(p.x+5,ny-48)){p.vy=0;}else p.y=ny;}}
function throwSub(){const p=pl;const cost=p.sub=='holy'?1:1;if(p.hearts<cost||projs.filter(q=>q.mine).length>=up.cap)return;p.hearts-=cost;p.throwT=14;p.atk=0;
 const y=p.y-(p.crouch?22:34);
 if(p.sub=='knife')projs.push({mine:1,k:'knife',x:p.x,y,vx:p.f*4.5,vy:0,w:12,h:4,dmg:2,l:120});
 if(p.sub=='axe')projs.push({mine:1,k:'axe',x:p.x,y,vx:p.f*1.6,vy:-5,w:14,h:14,dmg:3,l:200,g:.15,pierce:1});
 if(p.sub=='holy')projs.push({mine:1,k:'holy',x:p.x,y,vx:p.f*2,vy:-2,w:8,h:8,dmg:1,l:200,g:.2});}
function updProjs(){for(const q of projs){q.x+=q.vx;q.y+=q.vy;if(q.g)q.vy+=q.g;q.l--;if(!q.mine&&q.x>SAFE0&&q.x<SAFE1){q.l=0;fxA('smoke',q.x,q.y+6);}
 if(q.k=='holy'&&solid(q.x,q.y)){q.k='flame';q.vx=0;q.vy=0;q.g=0;q.y=Math.floor(q.y/TS)*TS;q.w=24;q.h=16;q.l=80;q.pierce=1;q.dmg=1;}
 if(q.k=='flame'&&tick%2)continue;
 if(q.k=='knife'&&solid(q.x,q.y)){q.l=0;fxA('smoke',q.x,q.y+6);}
 if(q.mine){for(const e of ents)if(!e.dead&&e.hp&&ov({x:q.x,y:q.y+q.h/2,w:q.w,h:q.h},e)&&!(q.hit&&q.hit.has(e))){hitEnt(e,q.dmg,q.x,q.y);if(q.pierce){(q.hit=q.hit||new Set()).add(e);}else{q.l=0;}}
  if(boss&&!boss.dead&&boss.st!='wake'&&ov({x:q.x,y:q.y+q.h/2,w:q.w,h:q.h},boss)&&!boss.iv){hitBoss(q.dmg,q.x,q.y);if(!q.pierce)q.l=0;}}
 else if(ov({x:q.x,y:q.y+q.h/2,w:q.w,h:q.h},pbox())){hurtPlayer(q.dmg,q.x);q.l=0;fxA('smoke',q.x,q.y+6);}
 if(q.x<camX-40||q.x>camX+W+40||q.y>H+40)q.l=0;}
 projs=projs.filter(q=>q.l>0);}
function hitEnt(e,d,hx,hy){e.hp-=d;e.flash=8;hitFx(hx??e.x,hy??e.y-e.h/2);if(e.hp<=0){if(e.t=='candle'){e.dead=1;corpses.push({k:'candle',x:e.x,y:e.y,l:20});fxA('flame',e.x,e.y-2,'candle',{delay:6});drop(e.x,e.y-8,e.drop);}else killEnt(e,{skel:300,bat:200,zombie:100,rose:300,garg:400,crow:200,sold:400}[e.t]||100);}}
function hitBoss(d,hx,hy){hitFx(hx??boss.x,hy??boss.y+12);boss.hp-=d;boss.flash=10;boss.iv=20;if(boss.hp<=0){boss.hp=0;boss.dead=1;boss.t=0;score+=3000;}}
function updEnts(){const wb=whipBox();
 for(const e of ents){if(e.dead)continue;if(e.flash)e.flash--;
  if(e.hp&&wb&&ov({x:wb.x,y:wb.y,w:wb.w,h:wb.h},e)&&e.lastHit!==pl.atkId){e.lastHit=pl.atkId;hitEnt(e,1+up.whip,...whipContact(e));}
  const near=Math.abs(e.x-pl.x)<W/2+30;
  if(e.t=='skel'&&near){e.x+=e.vx;if(e.x<e.mn||e.x>e.mx){e.vx=-e.vx;}e.f=pl.x<e.x?-1:1;
   if(pl.x>SAFE0&&pl.x<SAFE1&&e.cd<30)e.cd=30;if(--e.cd<=0){e.cd=110+Math.random()*60;projs.push({k:'bone',x:e.x,y:e.y-36,vx:e.f*1.4,vy:-3.6,g:.12,w:8,h:8,dmg:2,l:200});}}
  if(e.t=='bat'){if(e.st==0&&Math.abs(e.x-pl.x)<120){e.st=1;e.vx=pl.x<e.x?-1.3:1.3;e.by=pl.y-30;e.ph=0;}
   if(e.st==1){e.ph+=.08;e.x+=e.vx;e.y+=(e.by+Math.sin(e.ph)*14-e.y)*.08;if(e.x<camX-30||e.x>camX+W+30)e.dead=1;}}
  if(e.t=='zombie'){e.rise=Math.min(40,(e.rise||0)+1);if(e.rise>=40)e.x+=e.vx;if(e.x<camX-20||e.x>camX+W+20||solid(e.x+e.vx*8,e.y-8))e.dead=1;}
  if(e.t=='zspawn'){if(pl.x>e.x&&pl.x<e.x1&&--e.cd<=0&&ents.filter(z=>z.t=='zombie'&&!z.dead).length<3){e.cd=90+Math.random()*80;
    const side=Math.random()<.5?-1:1;let zx=pl.x+side*(90+Math.random()*80);zx=Math.max(camX+16,Math.min(camX+W-16,zx));
    ents.push({t:'zombie',x:zx,y:11*TS,w:12,h:40,hp:1,vx:zx>pl.x?-.5:.5,rise:0,flash:0});}}
  if(near)updGarden(e);
  if(e.hp&&e.t!='candle'&&(e.t!='zombie'||e.rise>=40)&&!(e.t=='garg'&&e.st=='statue')&&ov(pbox(),e)){hurtPlayer(e.t=='skel'||e.t=='sold'?3:2,e.x);if(e.t=='bat'||e.t=='crow')killEnt(e,0);}
 }
 ents=ents.filter(e=>!e.dead);
 if(boss)updBoss(wb);}
function updBoss(wb){const b=boss;b.t++;if(b.flash)b.flash--;if(b.iv)b.iv--;if(b.kind=='witch'&&!b.dead)return updWitch(b,wb);
 if(b.dead){if(b.t%7==0&&b.t<110)fxA('explode',b.x+(Math.random()-.5)*60,b.y+12+(Math.random()-.5)*40);if(b.t==100)for(let i=0;i<5;i++)fxA('flame',b.x-24+i*12,b.y+44,'boss',{delay:i*3});
  if(b.t==120){pillars=[];items.push({x:b.x,y:Math.min(b.y+20,170),vy:0,d:'orb',l:99999});}return;}
 if(b.st=='wake'){if(b.t>60){b.st='hover';b.t=0;}return;}
 if(b.st=='hover'){b.x+=(b.tx-b.x)*.03;b.y+=(60+Math.sin(b.t*.05)*20-b.y)*.05;if(b.t%90==1)b.tx=camX+60+Math.random()*(W-120);
  if(b.t%70==35)for(let i=-1;i<=1;i++){const a=Math.atan2(pl.y-30-b.y,pl.x-b.x)+i*.25;projs.push({k:'fire',x:b.x,y:b.y,vx:Math.cos(a)*2,vy:Math.sin(a)*2,w:8,h:8,dmg:2,l:200});}
  if(b.t>200){b.st='swoop';b.t=0;b.sx=b.x;b.sy=b.y;b.ex=pl.x;b.ey=pl.y-20;}}
 if(b.st=='swoop'){const k=b.t/70;b.x=b.sx+(b.ex-b.sx)*k*2;b.y=b.sy+Math.sin(k*Math.PI)*(b.ey-b.sy)*1.1;if(b.t>=70){b.st='hover';b.t=0;b.tx=b.x;}}
 b.x=Math.max(camX+20,Math.min(camX+W-20,b.x));
 const bb={x:b.x,y:b.y+16,w:56,h:30};
 if(wb&&ov(wb,bb)&&!b.iv)hitBoss(1+up.whip,...whipContact(bb));
 if(ov(pbox(),bb))hurtPlayer(3,b.x);}
function updItems(){for(const it of items){if(!solid(it.x,it.y+1)){it.vy=Math.min(it.vy+.15,2);it.y+=it.vy;if(solid(it.x,it.y))it.y=Math.floor(it.y/TS)*TS;}it.l--;
 if(ov(pbox(),{x:it.x,y:it.y,w:12,h:12})){it.l=0;const d=it.d;
  if(d=='h')pl.hearts+=1;else if(d=='H')pl.hearts+=5;else if(d=='money'){score+=1000;gold+=300;}
  else if(d=='orb'){pl.hp=pl.maxhp;endT=0;score+=stageTime*10+pl.hearts*100;hi=Math.max(hi,score);scene=SI<STAGES.length-1?'sclear':'clear';}
  else pl.sub=d;pl.hearts=Math.min(99,pl.hearts);score+=d=='h'||d=='H'?0:100;}}
 items=items.filter(i=>i.l>0);}
// ---- draw
const C={bg:'#0c0814',wall:'#2a1f3a',brick:'#3d2d55',brick2:'#55406f'};
function txt(s,x,y,c,sz,al){cx.fillStyle=c||'#fff';cx.font=(sz||10)+'px "MS Gothic","Noto Sans JP",monospace';cx.textAlign=al||'left';cx.textBaseline='top';cx.fillText(s,x,y);}
const TJ=TILEJSON;
function tile(id,sx,sy){const g=ST.theme=='garden'&&IMG.garden_tiles;const t=(g?GTJ:TJ)[id],im=tileSheet();if(!t)return;if(im&&im.complete)cx.drawImage(im,t[0],t[1],16,16,Math.round(sx),Math.round(sy),16,16);}
const INDOOR=28*TS;let deco=[];
function buildDeco(){deco=[];
 for(let tx=30;tx<112;tx+=6){if(tx>=40&&tx<=57)continue;deco.push([tx,1,9]);for(let y=2;y<10;y++)deco.push([tx,y,10]);deco.push([tx,10,11]);}
 for(let tx=33;tx<112;tx+=6){if(tx>=39&&tx<=58)continue;deco.push([tx,3,12]);deco.push([tx,4,13]);}
 for(const tx of[44,50,56]){deco.push([tx,2,12]);deco.push([tx,3,13]);}
 for(let tx=116;tx<139;tx+=5){deco.push([tx,2,12]);deco.push([tx,3,13]);if(tx%2)deco.push([tx+2,1,9]),[2,3,4,5,6,7,8,9].forEach(y=>deco.push([tx+2,y,10])),deco.push([tx+2,10,11]);}}
function drawBG(){if(ST.theme=='garden')return drawBG2();cx.fillStyle='#0c0814';cx.fillRect(0,0,W,H);
 const far=IMG.bg_far,wall=IMG.bg_wall;
 if(far&&far.complete){const o=Math.floor(camX*.2)%480;for(let x=-o;x<W;x+=480)cx.drawImage(far,x,HUD-30);}
 const ix=INDOOR-camX;
 if(wall&&wall.complete&&ix<W){cx.save();cx.beginPath();cx.rect(Math.max(0,ix),HUD,W,H);cx.clip();const o=Math.floor(camX*.5)%480;for(let x=-o;x<W;x+=480)cx.drawImage(wall,x,HUD-30);cx.restore();}}
function drawMap(){const x0=Math.floor(camX/TS),x1=x0+Math.ceil(W/TS)+1;drawProps();
 for(const d of deco)if(d[0]>=x0-1&&d[0]<=x1&&!map[d[1]][d[0]])tile(d[2],d[0]*TS-camX,d[1]*TS+HUD);
 for(let y=0;y<ROWS;y++)for(let x=x0;x<=x1&&x<COLS;x++)if(map[y][x]){const sx=x*TS-camX,sy=y*TS+HUD;
  const up=y>0&&map[y-1][x],dn=y<ROWS-1&&map[y+1][x],L=x>0&&map[y][x-1],R=x<COLS-1&&map[y][x+1];let id;
  if(x==0||x==COLS-1||(L+R==0&&(up||dn)))id=ST.theme=='garden'&&IMG.garden_tiles?2:3;else if(!dn&&!up&&y<11)id=!L?6:!R?8:7;else id=up?1:0;
  tile(id,sx,sy);}
 drawThorns();
 for(const s of stairs)for(let i=0;i<s.n/2;i++){const sx=s.bx+(s.dir>0?16*i:-16*(i+1))-camX,sy=s.by-16*(i+1)+HUD;tile(s.dir>0?4:5,sx,sy);}}
function sa(name,wx,wy,ax,ay,flip,rot,sc){const im=typeof name=='string'?IMG[name]:name;if(!im||im.complete===false)return;cx.save();cx.translate(Math.round(wx-camX),Math.round(wy+HUD));if(flip)cx.scale(-1,1);if(rot)cx.rotate(rot);if(sc)cx.scale(sc,sc);cx.drawImage(im,-ax,-ay);cx.restore();}
function spr(name,x,y,f,alpha){const im=IMG[name];if(!im||!im.complete)return;cx.save();cx.globalAlpha=alpha||1;cx.translate(Math.round(x-camX),Math.round(y+HUD));if(f<0)cx.scale(-1,1);cx.drawImage(im,-24,-62);cx.restore();}
function drawPlayer(){const p=pl;let n;
 if(p.dead)n=p.deadT<40?'death_1':'death_2';
 else if(p.hurt)n='hurt_1';
 else if(p.atk){const fr=p.atk<5?1:p.atk<9?2:p.atk<17?3:2;n=(p.crouch?'crouchwhip_':'whip_')+fr;}
 else if(p.throwT)n='throw_'+(p.throwT>7?1:2);
 else if(p.stair){const up=(p.f==p.stair.s.dir);n=(up?'stairup_':'stairdown_')+(Math.floor(p.anim/4)%2+1);}
 else if(!p.g)n=p.vy<0?'jump_1':'jump_2';
 else if(p.crouch)n='crouch_1';
 else if(p.vx)n='walk_'+(Math.floor(p.anim/8)%4+1);
 else n='idle_'+(Math.floor(tick/30)%2+1);
 if(p.inv&&!p.dead&&tick%4<2)return;
 spr('rosalinde_'+n,p.x,p.y+2,p.f);
 if(n.includes('whip_3')&&up.whip>1){const yy=p.y+2-62+(p.crouch?31:28)+HUD,x0=p.x+p.f*96-camX,len=(up.whip-1)*16;cx.fillStyle='#8a5a30';cx.fillRect(p.f>0?x0:x0-len,yy,len,2);cx.fillStyle=up.whip>2?'#fd4':'#ccc';cx.fillRect(p.f>0?x0+len-3:x0-len,yy-1,3,4);}}
function drawEnt(e){const fl=e.flash&&tick%4<2;if(fl){cx.save();cx.filter='brightness(2.5)';}
 if(e.t=='candle')sa(ST.theme=='garden'&&has('lantern_1')?'lantern_'+(Math.floor(tick/12)%2+1):'candle_'+(Math.floor(tick/8)%2+1),e.x,e.y,8,31);
 if(e.t=='skel'){const th=e.cd<20;sa('skeleton_'+(th?'throw_'+(e.cd<10?2:1):'walk_'+(Math.floor(tick/14)%2+1)),e.x,e.y,16,47,e.f<0);}
 if(e.t=='bat')sa('bat_flap_'+(e.st?Math.floor(tick/6)%2+1:1),e.x,e.y,8,15,e.vx<0);
 if(e.t=='zombie'){const r=e.rise||0;sa(r<40?'zombie_rise_'+(r<14?1:r<28?2:3):'zombie_walk_'+(Math.floor(tick/16)%2+1),e.x,e.y,16,47,e.vx<0);}
 drawGardenEnt(e);
 if(fl)cx.restore();}
function drawCorpse(c){if(c.k=='skel')sa('skeleton_crumble_'+(c.l>12?1:2),c.x,c.y,16,47,c.f<0);if(c.k=='candle')sa(ST.theme=='garden'&&has('lantern_broken')?'lantern_broken':'candle_broken',c.x,c.y,8,31);}
function drawBoss(){const b=boss;if(b.dead&&b.t>120)return;if(b.kind=='witch')return drawWitch(b);const fl=b.flash&&tick%4<2;cx.save();if(fl)cx.filter='brightness(2.5)';if(b.st=='wake'&&tick%8<4)cx.globalAlpha=.5;
 const n=b.dead?'phantombat_defeat_1':b.st=='swoop'?'phantombat_dive_1':'phantombat_flap_'+([1,2,3,2][Math.floor(tick/7)%4]);
 const im=IMG[n];if(im&&im.complete){cx.translate(Math.round(b.x-camX),Math.round(b.y+HUD+32));if(pl.x<b.x)cx.scale(-1,1);cx.drawImage(im,-48,-63);}cx.restore();}
const ITEMSPR={h:'heart_small',H:'heart_big',knife:'knife',axe:'axe',holy:'holywater',money:'goldbag',orb:'boss_orb'};
function drawProj(q){
 if(q.k=='knife')sa('knife',q.x,q.y+8,8,8,q.vx<0);
 if(q.k=='axe')sa('axe',q.x,q.y,8,8,q.vx<0,tick*.4*(q.vx<0?-1:1));
 if(q.k=='holy')sa('holywater',q.x,q.y,8,8,q.vx<0,tick*.3);
 if(q.k=='flame'){for(let i=0;i<3;i++)drawFxE({a:'holyfire',t:tick+i*4},q.x-10+i*10,q.y+1);}
 if(q.k=='bone')sa('bone',q.x,q.y,4,4,0,tick*.3);
 drawGardenProj(q);
 if(q.k=='fire')sa('fireball_'+(Math.floor(tick/5)%2+1),q.x,q.y,6,6);}
function drawItem(it){if(it.l<120&&tick%4<2)return;sa(ITEMSPR[it.d],it.x,it.y,8,15);}
let q;
function bar(x,y,v,max,c){const st=Math.min(5,84/max);for(let i=0;i<max;i++){cx.fillStyle=i<v?c:'#333';cx.fillRect(x+i*st,y,Math.max(2,st-1),7);}}
function drawHUD(){cx.fillStyle='#000';cx.fillRect(0,0,W,HUD);
 txt('スコア-'+String(score).padStart(6,'0'),4,2,'#fff',9);txt('タイム '+String(Math.max(0,stageTime)).padStart(4,'0'),130,2,'#fff',9);txt('ステージ '+String(SI+1).padStart(2,'0'),230,2,'#fff',9);
 txt('プレイヤー',4,12,'#fff',8);bar(52,13,pl.hp,pl.maxhp,'#f44');if(boss){txt('てき',4,22,'#fff',8);bar(52,23,Math.ceil(boss.hp/(boss.max/16)),16,'#f80');}txt('G-'+String(gold).padStart(4,'0'),300,12,'#fd4',9);txt('鞭Lv'+up.whip,300,22,'#ccc',8);
 cx.strokeStyle='#c22';cx.strokeRect(140.5,12.5,26,17);const sn={knife:'ナイフ',axe:'オノ',holy:'聖水'}[pl.sub];if(pl.sub){const im=IMG[ITEMSPR[pl.sub]];if(im&&im.complete)cx.drawImage(im,146,13);}
 txt('♥-'+String(pl.hearts).padStart(2,'0'),175,12,'#f66',9);txt('のこり-'+Math.max(0,lives),175,22,'#fff',8);if(sn)txt(sn,230,17,'#ccc',8);}
let lastMenu=null;function draw(){const mn=!(scene=='play'||scene=='talk'||scene=='btalk');if(mn!==lastMenu){document.body.classList.toggle('menu',mn);lastMenu=mn;}cx.setTransform(1,0,0,1,0,0);
 if(scene=='title'){cx.fillStyle='#000';cx.fillRect(0,0,W,H);if(IMG.bg_far.complete)cx.drawImage(IMG.bg_far,-26-(tick*.1)%10,-20);cx.fillStyle='rgba(0,0,0,.35)';cx.fillRect(0,0,W,H);
  // original layout: heroine left in crimson moon halo, ornate title panel right
  const g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(60,0,20,.55)');g.addColorStop(1,'rgba(0,0,0,.75)');cx.fillStyle=g;cx.fillRect(0,0,W,H);
  const hx=92,hy=118;const rg=cx.createRadialGradient(hx,hy,8,hx,hy,90);rg.addColorStop(0,'rgba(255,90,90,.55)');rg.addColorStop(.5,'rgba(160,20,40,.35)');rg.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=rg;cx.fillRect(0,0,220,H);
  cx.strokeStyle='rgba(255,200,120,.5)';cx.beginPath();cx.arc(hx,hy,62,0,7);cx.stroke();
  const ri=IMG['rosalinde_idle_'+(Math.floor(tick/40)%2+1)];if(ri.complete){cx.save();cx.imageSmoothingEnabled=false;cx.drawImage(ri,hx-48,212-124,96,128);cx.restore();}
  for(let i=0;i<14;i++){const px=(i*53+tick*.4*(1+i%3))%(W+20)-10,py=(i*37+tick*(.5+i%4*.15))%(H+10);cx.fillStyle=i%3?'#c0283a':'#ff7088';cx.fillRect(px+Math.sin(tick*.03+i)*6,py,2+i%2,2);}
  const px0=200,pw=210;cx.fillStyle='rgba(10,0,8,.72)';cx.fillRect(px0,28,pw,170);cx.strokeStyle='#c9a15a';cx.strokeRect(px0+.5,28.5,pw-1,169);cx.strokeRect(px0+3.5,31.5,pw-7,163);
  const cxm=px0+pw/2;const dia=(x,y)=>{cx.fillStyle='#e8c27a';cx.beginPath();cx.moveTo(x,y-4);cx.lineTo(x+4,y);cx.lineTo(x,y+4);cx.lineTo(x-4,y);cx.fill();};
  txt('魔獣城の',cxm,42,'#e8c27a',15,'center');
  cx.fillStyle='#e8c27a';cx.fillRect(px0+16,64,pw-32,1);dia(cxm,64);
  cx.font='bold 46px "Noto Serif JP","Noto Sans JP",serif';cx.textAlign='center';cx.textBaseline='top';cx.lineWidth=4;cx.strokeStyle='#1a0008';cx.strokeText('鞭姫',cxm,72);cx.fillStyle='#d8243c';cx.fillText('鞭姫',cxm,72);cx.lineWidth=1;
  cx.fillStyle='#e8c27a';cx.fillRect(px0+16,128,pw-32,1);dia(px0+16,128);dia(px0+pw-16,128);
  txt('― 獣を従えし 紅の令嬢 ―',cxm,136,'#f0d8b0',10,'center');
  if(tick%50<34){txt('▶ はじめる',cxm,160,'#fff',13,'center');}txt('タップ / ENTER',cxm,178,'#a88',8,'center');
  cx.fillStyle='rgba(0,0,0,.7)';cx.fillRect(0,H-18,W,18);txt('ハイスコア '+String(hi).padStart(6,'0'),8,H-14,'#c9a15a',9);txt('© 清掃員工房 / カナタゲームズ',W-8,H-14,'#bbb',9,'right');return;}
 drawBG();drawMap();drawNPC();corpses.forEach(drawCorpse);for(const e of ents)drawEnt(e);items.forEach(drawItem);drawPillars();if(boss)drawBoss();drawPlayer();projs.forEach(drawProj);
 drawFx();
 if(scene!='clear')drawHUD();
 if(scene=='talk')drawTalk();
 if(Math.abs(pl.x-NPCX)<36&&scene=='play'&&!pl.dead)txt('▲ 話す',NPCX-camX,HUD+88,'#ff8',9,'center');
 if(msgT>0&&scene=='play')stageBanner();
 if(scene=='btalk')drawBTalk();
 if(bossLock&&boss&&boss.st=='wake'&&scene=='play')txt(ST.bossName,W/2,90,'#f66',13,'center');
 if(scene=='over'){cx.fillStyle='rgba(0,0,0,.8)';cx.fillRect(0,0,W,H);txt('ゲームオーバー',W/2,80,'#c22',26,'center');txt('スコア '+score,W/2,125,'#fff',12,'center');if(endT>60){txt((overSel==0?'▶ ':'  ')+'コンティニュー',W/2,150,overSel==0?'#fff':'#888',11,'center');txt((overSel==1?'▶ ':'  ')+'タイトルへ',W/2,168,overSel==1?'#fff':'#888',11,'center');txt('▲▼:選ぶ  鞭/タップ:決定',W/2,196,'#777',9,'center');}}
 if(scene=='sclear'){cx.fillStyle='rgba(0,0,0,.92)';cx.fillRect(0,0,W,H);txt('ステージ '+String(SI+1).padStart(2,'0')+' クリア！',W/2,60,'#ffd040',22,'center');txt(ST.name,W/2,94,'#e8c27a',12,'center');txt('スコア '+score+'   G-'+gold+'   ♥-'+pl.hearts,W/2,124,'#fff',11,'center');txt('つぎは ステージ '+String(SI+2).padStart(2,'0')+'「'+STAGES[SI+1].name+'」',W/2,150,'#9cf',11,'center');if(endT>60&&tick%50<34)txt('タップでつぎへ',W/2,190,'#aaa',10,'center');}
 if(scene=='clear'){cx.fillStyle='rgba(0,0,0,.97)';cx.fillRect(0,0,W,H);txt('魔獣城の鞭姫',W/2,14,'#d8243c',15,'center');txt('全ステージ クリア！',W/2,40,'#ffd040',24,'center');txt('スコア '+score,W/2,80,'#fff',12,'center');
  txt('スタッフ',W/2,110,'#c8a',10,'center');txt('制作  清掃員工房 / カナタゲームズ',W/2,128,'#fff',11,'center');txt('主演  ロザリンデ',W/2,146,'#fff',11,'center');txt('つづく……',W/2,172,'#aaa',11,'center');if(endT>60)txt('タップでタイトルへ',W/2,200,'#aaa',10,'center');}}
// atk id for single hit per swing
let acc=0,last=performance.now();
function frame(now){acc+=Math.min(100,now-last);last=now;while(acc>=1000/60){const a=pl&&pl.atk;update();if(pl&&pl.atk==1&&!a)pl.atkId=(pl.atkId||0)+1;P={...K};acc-=1000/60;}draw();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
window.__G={get s(){return{scene,pl,boss,ents,score,camX,gold,up,talk,SI,lives,pillars,btalk,overSel}},nextStage,setSI(i){SI=i},setGold(g){gold=g},K,startGame,setX(x,y){pl.x=x;pl.y=y;}};

// ---- safe room NPC
const COST={hp:()=>300+up.hp*200,whip:()=>[0,500,900][up.whip],cap:()=>10+(up.cap-2)*10};
function openTalk(){scene='talk';talk={i:0,menu:0,sel:0,msg:''};pl.vx=0;
 pl.hp=pl.maxhp; }
const LINES=['……あら、こんな所まで来るなんて。\n私はセレスティア。この城の元・調教師よ。','ここは聖なる結界の中。魔物は入ってこないわ。\n体力も回復しておいたから、安心して。','その鞭、まだ伸びしろがありそうね。\nゴールドかハートをくれるなら、鍛えてあげる。'];
function menuItems(){return[
 {k:'hp',n:'最大HPアップ (+4)',c:COST.hp(),u:'G',ok:up.hp<3,lv:'Lv'+up.hp+'/3'},
 {k:'whip',n:'鞭強化 (威力・長さ)',c:COST.whip(),u:'G',ok:up.whip<3,lv:'Lv'+up.whip+'/3'},
 {k:'cap',n:'サブウェポン同時数 +1',c:COST.cap(),u:'♥',ok:up.cap<4,lv:up.cap+'/4'},
 {k:'x',n:'立ち去る'}];}
function updTalk(){const t=talk;
 if(!t.menu){if(pressed('a')||pressed('j')||pressed('u')||pressed('st')){t.i++;if(t.i>=LINES.length){t.menu=1;t.msg='どれにする？';}}return;}
 const m=menuItems();if(pressed('d'))t.sel=(t.sel+1)%m.length;if(pressed('u'))t.sel=(t.sel+m.length-1)%m.length;
 if(pressed('j')){scene='play';talk=null;return;}
 if(pressed('a')||pressed('st')){const it=m[t.sel];if(it.k=='x'){scene='play';talk=null;return;}
  if(!it.ok){t.msg='それ以上は無理よ。';return;}
  const have=it.u=='G'?gold:pl.hearts;if(have<it.c){t.msg=(it.u=='G'?'ゴールド':'ハート')+'が足りないわね。';return;}
  if(it.u=='G')gold-=it.c;else pl.hearts-=it.c;
  if(it.k=='hp'){up.hp++;pl.maxhp+=4;pl.hp=pl.maxhp;t.msg='体が軽くなったでしょう？';}
  if(it.k=='whip'){up.whip++;t.msg='鞭がLv'+up.whip+'になったわ。もっと遠くまで届くはずよ。';}
  if(it.k=='cap'){up.cap++;t.msg='サブウェポンを'+up.cap+'つまで同時に投げられるわ。';}}}
function drawNPC(){const x=NPCX-camX,y=11*TS+HUD;if(x<-60||x>W+60)return;
 // safe room: glowing circle + altar
 cx.fillStyle='rgba(120,200,255,'+(.12+Math.sin(tick*.05)*.05)+')';cx.fillRect(x-56,HUD+64,112,112);
 {const ai=IMG.effect_altar_1;if(ai&&ai.complete)cx.drawImage(ai,x+28-16,y-31);}for(let i=0;i<7;i++){const ph=(tick*.6+i*31)%110;const sx=x-48+((i*37)%96),sy=HUD+176-ph;cx.globalAlpha=Math.min(1,(110-ph)/30,ph/20);const si=IMG['effect_sparkle_'+((Math.floor(tick/12)+i)%2+1)];if(si&&si.complete)cx.drawImage(si,sx-4,sy-4);cx.globalAlpha=1;}
 const tk=scene=='talk'&&talk&&!talk.menu;const im=IMG[tk?'celestia_talk_'+(Math.floor(tick/10)%2+1):'celestia_idle_'+(Math.floor(tick/40)%2+1)];if(im&&im.complete){cx.save();cx.translate(Math.round(x),y+2);if(pl.x>NPCX)cx.scale(-1,1);cx.drawImage(im,-24,-62);cx.restore();}
 txt('セレスティア',x,y-74,'#9cf',8,'center');}
function face(x,y){const f=IMG.celestia_face;cx.fillStyle='#000';cx.fillRect(x-1,y-1,66,66);if(f&&f.complete)cx.drawImage(f,x,y);cx.strokeStyle='#9cf';cx.strokeRect(x-.5,y-.5,65,65);}
function wrap(s,x,y,c){s.split('\n').forEach((l,i)=>txt(l,x,y+i*14,c||'#fff',11));}
function drawTalk(){const t=talk;cx.fillStyle='rgba(0,0,20,.88)';cx.strokeStyle='#9cf';
 if(!t.menu){cx.fillRect(12,HUD+4,W-24,74);cx.strokeRect(12.5,HUD+4.5,W-25,73);face(17,HUD+9);txt('セレスティア',90,HUD+10,'#9cf',10);wrap(LINES[t.i],90,HUD+27);if(tick%40<25)txt('▼',W-28,HUD+64,'#fff',9);return;}
 cx.fillRect(40,40,W-80,180);cx.strokeRect(40.5,40.5,W-81,179);face(48,46);txt('セレスティアの調教所',W/2+34,46,'#9cf',12,'center');
 txt('所持  G-'+gold+'   ♥-'+pl.hearts,W/2+34,64,'#fd4',10,'center');
 menuItems().forEach((it,i)=>{const yy=84+i*22,s=i==t.sel;if(s){cx.fillStyle='rgba(150,200,255,.25)';cx.fillRect(114,yy-3,W-164,19);}
  txt((s?'▶ ':'  ')+it.n,118,yy,it.k=='x'||it.ok?'#fff':'#777',11);
  if(it.k!='x'){txt(it.lv,300,yy,'#aaa',10);txt(it.ok?(it.u=='G'?it.c+'G':'♥'+it.c):'MAX',W-56,yy,'#fd4',10,'right');}});
 txt(t.msg,W/2,176,'#fff',11,'center');txt('▲▼:選ぶ  鞭:決定  跳:やめる',W/2,200,'#aaa',9,'center');}

// ================= Stage 2: garden module (placeholders; real art drops in by file name) =================
// Real-art names (build.py embeds them automatically when present):
//  tiles/garden/tiles.png -> garden_tiles (same 14-slot layout as tiles.json)
//  bg/garden/bg_far.png, bg_mid.png -> garden_bg_far, garden_bg_mid
//  enemies/garden: rose_idle_1-2, rose_spit_1, gargoyle_statue_1, gargoyle_fly_1-2, crow_perch_1, crow_fly_1-2,
//                  soldier_walk_1-2, soldier_thrust_1-2, seed, thorn_hazard (16x16)
//  boss/witch: witch_float_1-3, witch_cast_1, witch_dash_1, witch_defeat_1, thorn_bullet, thorn_pillar (16x64), thorn_warn
//  dialog: witch_face (64x64)
const has=n=>!!IMG[n];
const recCache={};
function recol(name,key,fn){const k=name+'#'+key;if(recCache[k])return recCache[k];const im=IMG[name];if(!im||!im.complete||!im.width)return null;
 const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,c.width,c.height),p=d.data;
 for(let i=0;i<p.length;i+=4){if(!p[i+3])continue;const o=fn(p[i],p[i+1],p[i+2]);p[i]=o[0];p[i+1]=o[1];p[i+2]=o[2];}g.putImageData(d,0,0);return recCache[k]=c;}
const RC={
 garden:(r,g,b)=>[r*.55+b*.1,g*.9+b*.35+10,b*.55],            // stone -> mossy green-grey
 grey:(r,g,b)=>{const l=(r+g+b)/3;return[l*.9+20,l*.9+22,l+30];},
 black:(r,g,b)=>{const l=(r+g+b)/3;return[l*.35,l*.32,l*.45];},
 thorn:(r,g,b)=>{const l=(r+g+b)/3;return[l*.5,l*.9+20,l*.4];}, // bone -> green armour
 witch:(r,g,b)=>[g*.6,r*.75+20,b*.5+r*.2]};                    // celestia -> green/emerald witch
function tileSheet(){if(ST.theme!='garden')return IMG.tiles;return IMG.garden_tiles||recol('tiles','garden',RC.garden)||IMG.tiles;}
function drawBG2(){cx.fillStyle='#06121a';cx.fillRect(0,0,W,H);
 const far=IMG.garden_bg_sky||IMG.bg_far;if(far&&far.complete!==false){const o=Math.floor(camX*(IMG.garden_bg_sky?.15:.2))%480;for(let x=-o;x<W;x+=480)cx.drawImage(far,x,HUD-30);}
 if(!IMG.garden_bg_sky){cx.fillStyle='rgba(0,50,60,.35)';cx.fillRect(0,HUD,W,H);}
 if(has('garden_bg_garden')){const m=IMG.garden_bg_garden,o=Math.floor(camX*.45)%480;for(let x=-o;x<W;x+=480)cx.drawImage(m,x,HUD-30);return;}
 // placeholder mid layer: hedge maze silhouettes + cypress trees at parallax .5
 const o=camX*.5;cx.fillStyle='#0b2a22';for(let i=-1;i<12;i++){const x=i*48-(o%48);cx.fillRect(x,HUD+130,44,50);cx.beginPath();cx.arc(x+22,HUD+130,22,Math.PI,0);cx.fill();}
 cx.fillStyle='#08201a';for(let i=-1;i<8;i++){const x=i*80-(o*1.2%80)+30;cx.beginPath();cx.moveTo(x,HUD+70);cx.quadraticCurveTo(x+12,HUD+120,x+8,HUD+176);cx.lineTo(x-8,HUD+176);cx.quadraticCurveTo(x-12,HUD+120,x,HUD+70);cx.fill();}}
function drawProps(){if(!props.length)return;for(const p of props){if(IMG.garden_bg_garden&&p[0]!='fence')continue;const x=p[1]*TS-camX,gy=HUD+176;if((x<-140||x>W+140)&&p[0]!='hedge'&&p[0]!='fence')continue;
 if(p[0]=='hedge'){const x1=(p[2]+1)*TS-camX;cx.fillStyle='#174a2c';cx.fillRect(x,gy-36,x1-x,36);cx.fillStyle='#22603a';for(let xx=x;xx<x1;xx+=8){cx.beginPath();cx.arc(xx+4,gy-36,5,Math.PI,0);cx.fill();}cx.fillStyle='rgba(0,0,0,.25)';cx.fillRect(x,gy-10,x1-x,10);}
 if(p[0]=='fountain'){cx.fillStyle='#7d8a96';cx.fillRect(x-28,gy-14,56,14);cx.fillStyle='#5a6672';cx.fillRect(x-30,gy-16,60,4);cx.fillStyle='#8c99a6';cx.fillRect(x-4,gy-46,8,32);cx.fillRect(x-14,gy-48,28,4);
  cx.fillStyle='#6ec6ff';for(let i=0;i<6;i++){const ph=(tick*.8+i*9)%40;cx.globalAlpha=1-ph/40;cx.fillRect(x-12+((i*7)%24)+Math.sin(ph*.2)*2,gy-48+ph*0.8,2,3);}cx.globalAlpha=1;cx.fillStyle='#3a8ad0';cx.fillRect(x-26,gy-14,52,4);}
 if(p[0]=='fence'&&IMG.garden_tiles){const x1=(p[2]+1)*TS-camX;for(let xx=x;xx<x1;xx+=16)tile(10,xx,gy-16);}
 if(p[0]=='statue'){if(IMG.garden_tiles){tile(9,x-8,gy-16);const st=recol('celestia_idle_1','grey',RC.grey);if(st)cx.drawImage(st,Math.round(x-24),gy-16-62);continue;}cx.fillStyle='#4a5560';cx.fillRect(x-12,gy-12,24,12);const st=recol('celestia_idle_1','grey',RC.grey);if(st)cx.drawImage(st,Math.round(x-24),gy-12-62);}
 if(p[0]=='arch'){cx.strokeStyle='#2c5a30';cx.lineWidth=5;cx.beginPath();cx.arc(x,gy-50,30,Math.PI,0);cx.stroke();cx.fillStyle='#2c5a30';cx.fillRect(x-33,gy-50,5,50);cx.fillRect(x+28,gy-50,5,50);cx.lineWidth=1;
  for(let a=0;a<9;a++){const an=Math.PI+a*Math.PI/8;cx.fillStyle=a%2?'#c0283a':'#ff6080';cx.fillRect(x+Math.cos(an)*30-2,gy-50+Math.sin(an)*30-2,4,4);}}}}
function drawThorns(){for(const t of thorns){if(t.x1<camX||t.x0>camX+W)continue;for(let x=t.x0;x<t.x1;x+=8){const sx=x-camX,sy=t.y+HUD;
 if(IMG.garden_tiles){if(((x-t.x0)/8)%2==0)tile(3,sx,sy-16);continue;}
 cx.fillStyle='#1f5a2a';cx.fillRect(sx,sy-4,8,4);cx.fillStyle='#c8d8b0';cx.beginPath();cx.moveTo(sx,sy-3);cx.lineTo(sx+2,sy-11);cx.lineTo(sx+4,sy-3);cx.moveTo(sx+4,sy-3);cx.lineTo(sx+6,sy-9);cx.lineTo(sx+8,sy-3);cx.fill();
 if((x/8)%3==0){cx.fillStyle='#c0283a';cx.fillRect(sx+2,sy-7,4,3);}}}}
function updHaz(){const pb=pbox();for(const t of thorns)if(pb.x+6>t.x0&&pb.x-6<t.x1&&pl.y>t.y-10&&pl.y-pb.h<t.y)hurtPlayer(1,pl.x+(pl.f>0?4:-4));
 for(const p of pillars){p.t++;if(p.t>50&&p.t<95){const h=has('thornpillar_1')?(p.t<56?16:p.t<62?40:62):Math.min(64,(p.t-50)*8);if(ov(pb,{x:p.x,y:176,w:14,h}))hurtPlayer(3,p.x);}}
 pillars=pillars.filter(p=>p.t<100);}
function drawPillars(){for(const p of pillars){const x=p.x-camX,gy=HUD+176;
 if(p.t<=50){if(tick%8<5){cx.fillStyle='rgba(255,40,60,.8)';cx.fillRect(x-10,gy-3,20,3);cx.fillStyle='#ff8090';cx.fillRect(x-1,gy-12,2,6);cx.fillRect(x-1,gy-4,2,1);}continue;}
 const h=Math.min(64,(p.t-50)*8)*(p.t>85?(100-p.t)/15:1);
 if(has('thornpillar_1')){const fr=p.t<56?1:p.t<62?2:3;if(p.t>85&&tick%4<2)continue;cx.drawImage(IMG['thornpillar_'+fr],x-8,gy-63);continue;}
 cx.fillStyle='#1d5a2a';cx.fillRect(x-5,gy-h,10,h);cx.fillStyle='#2e7d3a';cx.fillRect(x-2,gy-h,3,h);
 for(let y=4;y<h;y+=8){cx.fillStyle='#d8e0c0';cx.fillRect(x+(y%16?5:-9),gy-y,4,2);}cx.fillStyle='#c0283a';cx.fillRect(x-3,gy-h-3,6,5);}}
// ---- garden enemies
function updGarden(e){const dx=pl.x-e.x,inSafe=pl.x>SAFE0&&pl.x<SAFE1;
 if(e.t=='rose'){e.f=dx<0?-1:1;if(Math.abs(dx)<220&&!inSafe&&--e.cd<=0){e.cd=110+Math.random()*50;e.spit=16;const a=Math.atan2(pl.y-30-(e.y-26),dx);projs.push({k:'seed',x:e.x,y:e.y-26,vx:Math.cos(a)*1.8,vy:Math.sin(a)*1.8,w:6,h:6,dmg:2,l:220});}if(e.spit)e.spit--;}
 if(e.t=='garg'){e.t2++;
  if(e.st=='statue'&&Math.abs(dx)<100){e.st='shake';e.t2=0;}
  else if(e.st=='shake'&&e.t2>36){e.st='dive';e.t2=0;const a=Math.atan2(pl.y-30-e.y,dx);e.vx=Math.cos(a)*2.4;e.vy=Math.sin(a)*2.4;e.f=dx<0?-1:1;}
  else if(e.st=='dive'){e.x+=e.vx;e.y+=e.vy;if(e.t2>55||e.y>170){e.st='rise';e.t2=0;e.vy=-1.4;}}
  else if(e.st=='rise'){e.x+=e.vx*.4;e.y+=e.vy;if(e.y<HUD+20||e.t2>50){e.st='hover';e.t2=0;}}
  else if(e.st=='hover'){e.x+=(pl.x-e.x)*.01;e.y+=Math.sin(e.t2*.1)*.5;if(e.t2>40){e.st='shake';e.t2=20;}}}
 if(e.t=='crow'){if(e.st==0&&Math.abs(dx)<150){e.st=1;e.vx=dx<0?-2.1:2.1;e.vy=2.2;}
  if(e.st==1){e.x+=e.vx;e.y+=e.vy;e.vy-=.045;if(e.y<-20||e.x<camX-40||e.x>camX+W+40)e.dead=1;}}
 if(e.t=='sold'){if(e.cd>0)e.cd--;
  if(e.th){e.th++;if(e.th>=20&&e.th<36&&ov(pbox(),{x:e.x+e.f*26,y:e.y-22,w:30,h:8}))hurtPlayer(3,e.x);if(e.th>44){e.th=0;e.cd=60;}}
  else{e.f=dx<0?-1:1;if(Math.abs(dx)<64&&Math.abs(pl.y-e.y)<20&&!e.cd&&!inSafe)e.th=1;else{e.x+=e.vx;if(e.x<e.mn||e.x>e.mx)e.vx=-e.vx;}}}}
function drawGardenEnt(e){
 if(e.t=='rose'){if(has('rose_idle_1')){sa(e.spit?(e.spit>8?'rose_spit_1':'rose_spit_2'):'rose_idle_'+(Math.floor(tick/18)%2+1),e.x,e.y,16,31,e.f<0);return;}
  const x=e.x-camX,y=e.y+HUD,sw=Math.sin(tick*.06)*2;cx.fillStyle='#1d5a2a';cx.fillRect(x-1,y-24,3,24);cx.fillStyle='#2e8a3a';cx.fillRect(x-8,y-12,7,4);cx.fillRect(x+2,y-18,7,4);
  const o=e.spit?5:2;cx.fillStyle='#8a1022';cx.beginPath();cx.arc(x+sw,y-30,8,0,7);cx.fill();cx.fillStyle='#d8243c';cx.beginPath();cx.arc(x+sw-2,y-32,5,0,7);cx.fill();cx.fillStyle='#ff6080';cx.fillRect(x+sw-3,y-34,3,2);
  cx.fillStyle='#200008';cx.fillRect(x+sw+e.f*3-2,y-31,5,o);cx.fillStyle='#fff';cx.fillRect(x+sw+e.f*3-2,y-31,1,1);cx.fillRect(x+sw+e.f*3+2,y-31,1,1);}
 if(e.t=='garg'){const fly=e.st!='statue'&&e.st!='shake';const sh=e.st=='shake'?(tick%4<2?-1:1):0;
  if(has('gargoyle_statue_1')){sa(fly?'gargoyle_fly_'+(Math.floor(tick/9)%2+1):'gargoyle_statue_1',e.x+sh,e.y+(fly?8:0),16,31,e.f<0);return;}
  if(!fly){cx.fillStyle='#3a444e';cx.fillRect(e.x-camX-12,e.y+HUD-2,24,4);}
  const im=recol(fly?'phantombat_flap_'+(Math.floor(tick/6)%3+1):'phantombat_defeat_1','grey',RC.grey);if(im)sa(im,e.x+sh,e.y+(fly?6:0),48,63,e.f<0,0,.42);
  if(e.st=='shake'&&tick%6<3){cx.fillStyle='#f33';cx.fillRect(e.x-camX-4,e.y+HUD-20,2,2);cx.fillRect(e.x-camX+2,e.y+HUD-20,2,2);}}
 if(e.t=='crow'){if(has('crow_flap_1')){sa('crow_flap_'+(e.st?Math.floor(tick/7)%2+1:1),e.x,e.y,8,15,e.st?e.vx<0:pl.x<e.x);return;}
  const im=recol('bat_flap_'+(e.st?Math.floor(tick/5)%2+1:1),'black',RC.black);if(im)sa(im,e.x,e.y,8,15,e.vx<0,0,1.3);cx.fillStyle='#fc3';cx.fillRect(e.x-camX+(e.vx<0?-6:5),e.y+HUD-10,2,1);}
 if(e.t=='sold'){const thr=e.th>=20&&e.th<36;
  if(has('thornsoldier_walk_1')){sa(e.th?(thr?'thornsoldier_thrust_2':'thornsoldier_thrust_1'):'thornsoldier_walk_'+(Math.floor(tick/15)%2+1),e.x,e.y,24,47,e.f<0);return;}
  const im=recol(e.th?'skeleton_throw_1':'skeleton_walk_'+(Math.floor(tick/14)%2+1),'thorn',RC.thorn);if(im)sa(im,e.x,e.y,16,47,e.f<0);
  const x=e.x-camX,y=e.y+HUD-24,ext=thr?26:e.th?-4:6;cx.fillStyle='#6a4a2a';cx.fillRect(e.f>0?x:x-14-ext,y,14+ext,2);cx.fillStyle='#dde';const tx=x+e.f*(14+ext);cx.fillRect(e.f>0?tx:tx-6,y-1,6,4);}}
function drawGardenProj(q){
 if(q.k=='seed'){if(has('seed'))return sa('seed',q.x,q.y,4,4);cx.fillStyle='#3a2a10';cx.fillRect(q.x-camX-3,q.y+HUD-3,6,6);cx.fillStyle='#9c6';cx.fillRect(q.x-camX-1,q.y+HUD-2,2,2);}
 if(q.k=='tb'){if(has('thornbullet_1'))return sa('thornbullet_'+(Math.floor(tick/5)%2+1),q.x,q.y,6,6,0,Math.atan2(q.vy,q.vx));const x=q.x-camX,y=q.y+HUD;cx.save();cx.translate(x,y);cx.rotate(Math.atan2(q.vy,q.vx));cx.fillStyle='#2e7d3a';cx.fillRect(-6,-1,10,3);cx.fillStyle='#e8f0c8';cx.beginPath();cx.moveTo(4,-3);cx.lineTo(9,0);cx.lineTo(4,3);cx.fill();cx.restore();}}
// ---- boss: 茨の魔女
function updWitch(b,wb){if(b.st=='wake'){b.y=70;if(b.t>60){b.st='hover';b.t=0;}return;}
 const L=camX+40,R=camX+W-40;
 if(b.st=='hover'){b.x+=(b.tx-b.x)*.03;b.y+=(64+Math.sin(b.t*.05)*14-b.y)*.06;if(b.t%80==1)b.tx=L+Math.random()*(R-L);
  if(b.t>90){const m=['bullets','pillar','dash'][b.cyc++%3];b.st=m;b.t=0;}}
 else if(b.st=='bullets'){if(b.t==20||b.t==50)for(let i=-2;i<=2;i++){const a=Math.atan2(pl.y-30-b.y,pl.x-b.x)+i*.22;projs.push({k:'tb',x:b.x,y:b.y,vx:Math.cos(a)*2.2,vy:Math.sin(a)*2.2,w:8,h:6,dmg:2,l:220});}if(b.t>70){b.st='hover';b.t=0;}}
 else if(b.st=='pillar'){if(b.t%26==1&&b.t<80)pillars.push({x:Math.max(L,Math.min(R,pl.x)),t:0});if(b.t>110){b.st='hover';b.t=0;}}
 else if(b.st=='dash'){if(b.t==1){b.dir=pl.x<b.x?-1:1;b.dy=pl.y-30;}if(b.t<40){b.y+=(b.dy-b.y)*.08;b.x-=b.dir*.4;}else{b.x+=b.dir*5;if(b.x<L-10||b.x>R+10){b.st='hover';b.t=0;b.tx=b.x;b.y-=2;}}}
 b.x=Math.max(camX+16,Math.min(camX+W-16,b.x));
 const bb={x:b.x,y:b.y+28,w:28,h:60};
 if(wb&&ov(wb,bb)&&!b.iv)hitBoss(1+up.whip,...whipContact(bb));
 if(ov(pbox(),bb))hurtPlayer(3,b.x);}
function drawWitch(b){const fl=b.flash&&tick%4<2;cx.save();if(b.st=='wake'&&tick%8<4)cx.globalAlpha=.5;
 const x=b.x-camX,y=b.y+HUD;const g=cx.createRadialGradient(x,y,4,x,y,40);g.addColorStop(0,'rgba(120,255,160,.35)');g.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=g;cx.fillRect(x-40,y-40,80,80);
 if(b.st=='dash'&&b.t<40&&tick%6<3){cx.fillStyle='rgba(255,60,80,.5)';cx.fillRect(0,y,W,3);}
 const face=pl.x<b.x;
 if(has('witch_float_1')){const n=b.dead?'witch_defeat_1':b.st=='dash'?'witch_charge_1':(b.st=='bullets'||b.st=='pillar')?'witch_summon_'+(b.t%24<12?1:2):'witch_float_'+(Math.floor(tick/15)%2+1);sa(n,b.x,b.y+30,32,79,face);}
 else{const im=recol(b.st=='bullets'||b.st=='pillar'?'celestia_talk_1':'celestia_idle_'+(Math.floor(tick/30)%2+1),'witch',RC.witch);
  if(im){cx.translate(Math.round(x),Math.round(y+30));if(!face)cx.scale(-1,1);cx.scale(1.25,1.25);cx.drawImage(im,-24,-62);}
  cx.setTransform(1,0,0,1,0,0);for(let i=0;i<5;i++){const a=tick*.05+i*1.256;cx.fillStyle=i%2?'#c0283a':'#2e7d3a';cx.fillRect(x+Math.cos(a)*22-2,y+Math.sin(a)*10+28,4,4);}}
 cx.restore();if(fl){cx.save();cx.globalAlpha=.6;cx.fillStyle='#fff';cx.fillRect(x-14,y-32,28,60);cx.restore();}
 if(b.dead&&b.t%4<2){cx.fillStyle='rgba(255,255,255,.3)';cx.fillRect(x-20,y-20,40,64);}}
// ---- banners / boss talk
function stageBanner(){const a=Math.min(1,msgT/30,(150-msgT)/20);cx.save();cx.globalAlpha=Math.max(0,a);cx.fillStyle='rgba(0,0,0,.6)';cx.fillRect(0,86,W,44);cx.fillStyle='#c9a15a';cx.fillRect(0,86,W,1);cx.fillRect(0,129,W,1);
 txt('ステージ '+String(SI+1).padStart(2,'0'),W/2,91,'#e8c27a',11,'center');txt(ST.name,W/2,106,'#fff',17,'center');cx.restore();}
function drawBTalk(){const lines=ST.bossLines;cx.fillStyle='rgba(0,16,8,.9)';cx.fillRect(12,HUD+4,W-24,74);cx.strokeStyle='#7c6';cx.strokeRect(12.5,HUD+4.5,W-25,73);
 cx.fillStyle='#000';cx.fillRect(16,HUD+8,66,66);
 if(has('witch_face'))cx.drawImage(IMG.witch_face,17,HUD+9);else{const f=recol('celestia_face','witch',RC.witch);if(f)cx.drawImage(f,17,HUD+9);}
 cx.strokeStyle='#7c6';cx.strokeRect(16.5,HUD+8.5,65,65);
 txt('茨の魔女',90,HUD+10,'#8e8',10);const l=lines[Math.min(btalk.i,lines.length-1)];const parts=l.length>24?[l.slice(0,24),l.slice(24)]:[l];parts.forEach((p,i)=>txt(p,90,HUD+28+i*14,'#fff',11));if(tick%40<25)txt('▼',W-28,HUD+64,'#fff',9);}
