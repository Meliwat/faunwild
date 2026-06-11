//------------------------------------------------------------ core engine: state, modes, input
let G=null,cv=null,ctx=null,INGAME=false;
const MODES=[];const EVOQ=[];
function pushM(m){MODES.push(m)}
function remM(m){const i=MODES.indexOf(m);if(i>=0)MODES.splice(i,1)}
function topM(){return MODES[MODES.length-1]}
const KEYS={},KEYP={};
function setKey(k,down){if(down){if(!KEYS[k])KEYP[k]=1;KEYS[k]=1}else{KEYS[k]=0}}
function kp(k){if(KEYP[k]){KEYP[k]=0;return 1}return 0}
const DV={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]};
const OPP={u:'d',d:'u',l:'r',r:'l'};

function newGame(name){G={v:1,name:(name||'RIN').toUpperCase().slice(0,7),map:'home',x:4,y:4,dir:'d',
 party:[],vault:[],bag:{},money:1500,flags:{},badges:[],
 time:8*60,day:0,steps:0,lastGift:-1,rival:3,
 opts:{txt:1,mus:1,sfx:1},seen:{},caught:{},
 roamer:{on:0,map:'route1',hp:-1,st:0,slp:0,beat:0,caught:0},
 heal:{m:'home',x:4,y:4}};
 resetNpcs();INGAME=true}
function setF(f){G.flags[f]=1}
function hasF(f){return !!G.flags[f]}
function phase(){const h=fl(G.time/60)%24;return (h>=4&&h<10)?'m':(h>=10&&h<20)?'d':'n'}
function tickTime(){G.time+=1/60;if(G.time>=1440){G.time-=1440;G.day++}}
function clockStr(){const t=fl(G.time),h=fl(t/60)%24,m=t%60;return (h<10?'0':'')+h+':'+(m<10?'0':'')+m}

//------------------------------------------------------------ save / load
function saveData(){return JSON.stringify({v:1,g:G})}
function doSave(){try{localStorage.setItem('faunwild1',saveData());return true}catch(e){return false}}
function hasSave(){try{return !!localStorage.getItem('faunwild1')}catch(e){return false}}
function applySave(o){if(!o||o.v!==1||!o.g||!o.g.party)return false;G=o.g;if(!G.roamer)G.roamer={on:0,map:'route1',hp:-1,st:0,slp:0,beat:0,caught:0};resetNpcs();INGAME=true;return true}
function loadSave(){try{const s=localStorage.getItem('faunwild1');if(!s)return false;return applySave(JSON.parse(s))}catch(e){return false}}
function exportCode(){try{return 'FWN1.'+btoa(unescape(encodeURIComponent(saveData())))}catch(e){return''}}
function importCode(s){try{s=(s||'').trim();if(s.indexOf('FWN1.')!==0)return false;return applySave(JSON.parse(decodeURIComponent(escape(atob(s.slice(5))))))}catch(e){return false}}
function resetNpcs(){for(const k in MAPS){for(const n of MAPS[k].npcs){if(n.x0===undefined){n.x0=n.x;n.y0=n.y}n.x=n.x0;n.y=n.y0;n.fdir=n.dir;n.px=0;n.py=0;n.wt=30+ri(60)}}}

//------------------------------------------------------------ bag
function addItem(id,q){G.bag[id]=(G.bag[id]||0)+(q||1)}
function remItem(id,q){G.bag[id]=(G.bag[id]||0)-(q||1);if(G.bag[id]<=0)delete G.bag[id]}
function itemCount(id){return G.bag[id]||0}
function bagList(){return BAGORDER.filter(id=>G.bag[id]>0)}

//------------------------------------------------------------ monsters
function expFor(l){return l*l*l}
function movesUpTo(id,lv){const ls=SP[id].mv.filter(e=>e[0]<=lv).map(e=>e[1]);const u=[];for(const m of ls)if(!u.includes(m))u.push(m);return u.slice(-4)}
function makeMon(id,lv,o){o=o||{};const dv={hp:ri(16),at:ri(16),df:ri(16),sc:ri(16),sp:ri(16)};
 const m={id,lv,exp:expFor(lv),dv,st:0,slp:0,fr:o.fr!=null?o.fr:70,item:o.item||0,gleam:o.gleam?1:0};
 m.mv=movesUpTo(id,lv).map(x=>({id:x,pp:MV[x].pp}));m.hp=0;m.hp=maxHP(m);return m}
function stat(m,k){return fl((SP[m.id].bs[k]+m.dv[k])*2*m.lv/100)+5}
function maxHP(m){return fl((SP[m.id].bs.hp+m.dv.hp)*2*m.lv/100)+m.lv+10}
function healMon(m){m.hp=maxHP(m);m.st=0;m.slp=0;for(const v of m.mv)v.pp=MV[v.id].pp}
function healParty(){for(const m of G.party)healMon(m)}
function addSeen(id){G.seen[id]=1}
function addCaught(id){G.seen[id]=1;G.caught[id]=1}
function partyAlive(){let n=0;for(const m of G.party)if(m.hp>0)n++;return n}
function firstAlive(){for(let i=0;i<G.party.length;i++)if(G.party[i].hp>0)return i;return -1}
function frHearts(m){return fl(m.fr/52)}

//------------------------------------------------------------ sprites
const SPRC={};
function sprCanvas(px,pal,key){if(key&&SPRC[key])return SPRC[key];
 const c=document.createElement('canvas');c.width=16;c.height=16;const x=c.getContext('2d');
 const rows=px.split('|');
 for(let ry=0;ry<16;ry++){let row=rows[ry]||'';if(row.length===8)row+=row.split('').reverse().join('');
  for(let cx=0;cx<16;cx++){const cc=row[cx];if(cc&&cc!=='.'){x.fillStyle=pal[+cc-1]||'#000';x.fillRect(cx,ry,1,1)}}}
 if(key)SPRC[key]=c;return c}
function flipC(c,key){if(key&&SPRC[key])return SPRC[key];const f=document.createElement('canvas');f.width=16;f.height=16;const x=f.getContext('2d');x.translate(16,0);x.scale(-1,1);x.drawImage(c,0,0);if(key)SPRC[key]=f;return f}
function gleamPal(pal){return pal.map(h=>{const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);const f2=v=>('0'+v.toString(16)).slice(-2);return '#'+f2(g)+f2(b)+f2(r)})}
function monSpr(id,gl){const s=SP[id];return sprCanvas(s.px,gl?gleamPal(s.pal):s.pal,'m'+id+(gl?'g':''))}
function heroSpr(dir,fr){const f=fr?2:1;
 if(dir==='d')return sprCanvas(HERO['d'+f],HEROPAL,'hd'+f);
 if(dir==='u')return sprCanvas(HERO['u'+f],HEROPAL,'hu'+f);
 const base=sprCanvas(HERO['s'+f],HEROPAL,'hs'+f);
 return dir==='l'?base:flipC(base,'hsr'+f)}
function npcSpr(pal,dir){const p=PALS[pal]||PALS.kid;
 if(dir==='d')return sprCanvas(NPCSPR.d,p,'n_'+pal+'_d');
 if(dir==='u')return sprCanvas(NPCSPR.u,p,'n_'+pal+'_u');
 const base=sprCanvas(NPCSPR.s,p,'n_'+pal+'_s');
 return dir==='l'?base:flipC(base,'n_'+pal+'_sr')}

//------------------------------------------------------------ text & ui
function drawText(s,x,y,col){s=(''+s).toUpperCase();ctx.fillStyle=col||'#282828';let cx=x;
 for(const c of s){if(c===' '){cx+=6;continue}const g=GL[c];if(g)for(let r=0;r<7;r++){const b=g[r];for(let k=0;k<5;k++)if(b&(16>>k))ctx.fillRect(cx+k,y+r,1,1)}cx+=6}return cx}
function drawTextBig(s,x,y,sc,col){s=(''+s).toUpperCase();ctx.fillStyle=col||'#282828';let cx=x;
 for(const c of s){if(c===' '){cx+=6*sc;continue}const g=GL[c];if(g)for(let r=0;r<7;r++){const b=g[r];for(let k=0;k<5;k++)if(b&(16>>k))ctx.fillRect(cx+k*sc,y+r*sc,sc,sc)}cx+=6*sc}}
function ctext(s,y,col){drawText(s,fl((W-(''+s).length*6)/2),y,col)}
function frame(x,y,w,h,col){ctx.fillStyle=col;ctx.fillRect(x,y,w,1);ctx.fillRect(x,y+h-1,w,1);ctx.fillRect(x,y,1,h);ctx.fillRect(x+w-1,y,1,h)}
function panel(x,y,w,h){ctx.fillStyle='#f8f8f0';ctx.fillRect(x,y,w,h);frame(x,y,w,h,'#202020');frame(x+2,y+2,w-4,h-4,'#98a098')}
function hpbar(x,y,w,cur,max){const f=clamp(cur/Math.max(1,max),0,1);ctx.fillStyle='#404040';ctx.fillRect(x,y,w,4);ctx.fillStyle='#e8e8e0';ctx.fillRect(x+1,y+1,w-2,2);const fw=fl((w-2)*f);ctx.fillStyle=f>.5?'#30b850':f>.21?'#e8a020':'#e04848';if(fw>0)ctx.fillRect(x+1,y+1,fw,2)}
function wrap(s,n){const out=[''];for(const w of (''+s).split(' ')){const L=out[out.length-1];if(L&&(L.length+1+w.length)>n)out.push(w);else out[out.length-1]=L?L+' '+w:w}return out}

//------------------------------------------------------------ script tasks
const say=(...tx)=>({k:'say',tx:tx.flat()});
const ask=(tx,opts,cancel)=>({k:'ask',tx:Array.isArray(tx)?tx:[tx],opts,cancel});
const wait=f=>({k:'wait',f});
const doT=fn=>({k:'do',fn});
const sfxT=n=>({k:'sfx',n});
function startScript(gen,onDone){const sm={gen,onDone,val:undefined,running:false};
 sm.mode={tr:true,u(){},d(){},sm};pushM(sm.mode);pump(sm)}
function runScript(genFn,onDone){startScript(genFn(),onDone)}
function pump(sm){if(sm.running)return;sm.running=true;
 for(;;){let r;try{r=sm.gen.next(sm.val)}catch(e){if(typeof console!=='undefined')console.error('script error',e);r={done:true}}
  sm.val=undefined;
  if(r.done){remM(sm.mode);sm.running=false;if(sm.onDone)sm.onDone(r.value);return}
  let sync=true,fin=false;
  try{execTask(r.value,res=>{sm.val=res;fin=true;if(!sync){sm.running=false;pump(sm)}})}
  catch(e){if(typeof console!=='undefined')console.error('task error',e,r.value);fin=true}
  sync=false;
  if(!fin){sm.running=false;return}}}
function execTask(t,cb){if(!t){cb();return}switch(t.k){
 case 'say':pushM(DialogMode(t.tx,()=>cb()));break;
 case 'ask':pushM(DialogMode(t.tx,i=>cb(i),{opts:t.opts,cancel:t.cancel}));break;
 case 'wait':pushM({tr:true,f:t.f,u(){if(--this.f<=0){remM(this);cb()}},d(){}});break;
 case 'fade':pushM(FadeMode(t.dir,()=>cb()));break;
 case 'do':cb(t.fn());break;
 case 'sfx':sfx(t.n);cb();break;
 case 'song':playSong(t.n);cb();break;
 case 'emote':pushM(EmoteMode(t.n,t.f||30,()=>cb()));break;
 case 'npcwalk':pushM(NpcWalkMode(t.n,()=>cb()));break;
 case 'anim':pushM({tr:true,f:0,u(){this.f++;if(this.f>=t.f){remM(this);cb()}},d(){if(t.d)t.d(this.f)}});break;
 case 'push':pushM(t.mk(cb));break;
 case 'battle':pushM(BattleMode(t,r=>cb(r)));break;
 case 'shop':pushM(ShopMode(t,()=>cb()));break;
 case 'vault':pushM(VaultMode(()=>cb()));break;
 case 'party':pushM(PartyMode(t,i=>cb(i)));break;
 case 'bag':pushM(BagMode(t,r=>cb(r)));break;
 case 'name':pushM(NameMode(s=>cb(s)));break;
 case 'forget':pushM(ForgetMode(t.mon,t.mv,i=>cb(i)));break;
 case 'evo':pushM(EvoMode(t.mon,t.to,r=>cb(r)));break;
 default:cb()}}

function DialogMode(tx,cb,opt){const pages=[];
 for(const t of tx){const ls=wrap(t,24);for(let i=0;i<ls.length;i+=2)pages.push(ls.slice(i,i+2))}
 if(!pages.length)pages.push(['']);
 let pi=0,shown=0,choosing=false,choice=0;
 const tot=p=>p.reduce((a,l)=>a+l.length,0);
 return {tr:true,
 u(){const spd=[0.6,1.4,3][G?G.opts.txt:1];
  if(choosing){
   if(kp('u')){choice=(choice+opt.opts.length-1)%opt.opts.length;sfx('blip')}
   if(kp('d')){choice=(choice+1)%opt.opts.length;sfx('blip')}
   if(kp('a')){sfx('conf');remM(this);cb(choice)}
   else if(kp('b')){sfx('blip');remM(this);cb(opt.cancel!=null?opt.cancel:opt.opts.length-1)}
   return}
  const T=tot(pages[pi]);
  if(shown<T){shown+=spd;if(kp('a')||kp('b'))shown=T;return}
  if(pi<pages.length-1){if(kp('a')||kp('b')){pi++;shown=0;sfx('blip')}return}
  if(opt&&opt.opts){choosing=true;return}
  if(kp('a')||kp('b')){sfx('blip');remM(this);cb()}},
 d(){panel(0,104,160,40);const ls=pages[pi];let c=0;
  for(let i=0;i<ls.length;i++){const lim=clamp(fl(shown)-c,0,ls[i].length);drawText(ls[i].slice(0,lim),8,112+i*13);c+=ls[i].length}
  if(fl(shown)>=tot(pages[pi])&&!choosing&&fl(Date.now()/280)%2){ctx.fillStyle='#282828';ctx.fillRect(149,134,5,2);ctx.fillRect(150,136,3,2);ctx.fillRect(151,138,1,2)}
  if(choosing){const n=opt.opts.length,w=78,h=n*13+10,px=W-w-1,py=103-h;panel(px,py,w,h);
   for(let i=0;i<n;i++){drawText(opt.opts[i],px+14,py+6+i*13);if(i===choice)drawText('>',px+5,py+6+i*13)}}}}}

function FadeMode(dir,cb){let f=0;return {tr:true,u(){f++;if(f>=16){remM(this);cb()}},
 d(){const a=dir==='in'?1-f/16:f/16;ctx.fillStyle='rgba(8,8,12,'+a.toFixed(2)+')';ctx.fillRect(0,0,W,H)}}}
function EmoteMode(n,fr,cb){let f=0;return {tr:true,u(){f++;if(f>=fr){remM(this);cb()}},
 d(){const [cx,cy]=OW.cam();const sx=n.x*16+(n.px||0)-cx,sy=n.y*16+(n.py||0)-cy-14;panel(sx+4,sy-2,9,12);drawText('!',sx+6,sy)}}}
function NpcWalkMode(n,cb){return {tr:true,u(){
  const ddx=G.x-n.x,ddy=G.y-n.y;
  if(Math.abs(ddx)+Math.abs(ddy)<=1){n.px=0;n.py=0;remM(this);cb();return}
  const sx=Math.sign(ddx),sy=Math.sign(ddy);
  const mx=Math.abs(ddx)>0&&Math.abs(ddx)>=Math.abs(ddy)?sx:0;
  const my=mx?0:sy;
  n.px=(n.px||0)+mx*2;n.py=(n.py||0)+my*2;
  n.fdir=mx>0?'r':mx<0?'l':my>0?'d':'u';
  if(Math.abs(n.px)>=16||Math.abs(n.py)>=16){n.x+=mx;n.y+=my;n.px=0;n.py=0}},d(){}}}

//------------------------------------------------------------ tint
function tint(){const mp=MAPS[G.map];if(!mp.out)return;const p=phase();
 ctx.globalCompositeOperation='multiply';
 ctx.fillStyle=p==='m'?'rgba(255,206,158,0.32)':p==='d'?'rgba(255,244,220,0.10)':'rgba(96,106,190,0.60)';
 ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';
 if(p==='n'){ctx.fillStyle='rgba(16,20,56,0.22)';ctx.fillRect(0,0,W,H)}}

//------------------------------------------------------------ map helpers
(function(){const a=MAPS.mosshollow.npcs[0];a.not='snares';
 MAPS.mosshollow.npcs.push({x:7,y:1,pal:'aide',dir:'d',req:'snares',d:['AIDE: HAVENS mend your KIN for free. Use them often!']})})();
function tileAt(x,y){const g=MAPS[G.map].g;if(y<0||y>=g.length||x<0||x>=g[0].length)return 'T';return g[y][x]}
function gateOpen(c){return !!G.flags[G.map+'_'+c]}
function tileSolid(t){if(SOLID[t])return true;if(t==='H')return true;if((t==='Y'||t==='Z')&&!gateOpen(t))return true;if(t==='L')return true;return false}
function itemAt(x,y){return MAPS[G.map].items.find(i=>i.x===x&&i.y===y&&!G.flags[i.f])}
function npcVis(n){if(n.req&&!G.flags[n.req])return false;if(n.not&&G.flags[n.not])return false;if(n.time&&phase()!==n.time)return false;return true}
function npcVisAt(x,y){for(const n of MAPS[G.map].npcs)if(npcVis(n)&&n.x===x&&n.y===y)return n;return null}
function blockedAt(x,y){if(tileSolid(tileAt(x,y)))return true;if(itemAt(x,y))return true;if(npcVisAt(x,y))return true;return false}

