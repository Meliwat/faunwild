//------------------------------------------------------------ overworld
const OW={tr:false,prog:0,len:16,dx:0,dy:0,hop:0,moving:false,sliding:false,bumpT:0,animT:0,faceT:0,
u(){if(this.bumpT>0)this.bumpT--;
 if(this.moving){this.stepAnim();return}
 if(topM()!==this){this.faceT=0;return}
 npcTick();
 if(this.sliding){if(this.slideCont())return;this.sliding=false}
 if(kp('st')){sfx('conf');pushM(PauseMode());return}
 if(kp('a')){this.interact();return}
 let d=null;if(KEYS.u)d='u';else if(KEYS.d)d='d';else if(KEYS.l)d='l';else if(KEYS.r)d='r';
 if(!d){this.faceT=0;return}
 if(G.dir!==d){G.dir=d;this.faceT=6;return}
 if(this.faceT>0){this.faceT--;return}
 this.tryMove(d,false)},
tryMove(d,auto){const [vx,vy]=DV[d];const tx=G.x+vx,ty=G.y+vy;const mp=MAPS[G.map];
 const w=mp.g[0].length,h=mp.g.length;
 if(tx<0||ty<0||tx>=w||ty>=h){if(!auto)this.tryEdge(d);return false}
 const t=tileAt(tx,ty);
 if(t==='L'&&d==='d'){this.hop=1;this.startMove(vx,vy,32);sfx('hop');return true}
 if(blockedAt(tx,ty)){if(!auto&&this.bumpT<=0){sfx('bump');this.bumpT=14}return false}
 this.startMove(vx,vy,16);return true},
startMove(vx,vy,len){this.moving=true;this.dx=vx;this.dy=vy;this.prog=0;this.len=len},
stepAnim(){this.prog+=2;this.animT++;
 if(this.prog>=this.len){G.x+=this.dx*(this.len/16);G.y+=this.dy*(this.len/16);
  this.moving=false;this.hop=0;this.prog=0;this.arrive()}},
slideCont(){const t=tileAt(G.x,G.y);
 if(t==='i')return this.tryMove(G.dir,true);
 if(CURDIR[t])return this.tryMove(CURDIR[t],true);
 return false},
tryEdge(d){const mp=MAPS[G.map];const e=mp.edges&&mp.edges[{u:'N',d:'S',l:'W',r:'E'}[d]];
 if(!e){if(this.bumpT<=0){sfx('bump');this.bumpT=14}return}
 const tg=MAPS[e.m],w=tg.g[0].length,h=tg.g.length;let nx,ny;
 if(d==='u'){nx=clamp(G.x+e.d,0,w-1);ny=h-1}
 else if(d==='d'){nx=clamp(G.x+e.d,0,w-1);ny=0}
 else if(d==='l'){nx=w-1;ny=clamp(G.y+e.d,0,h-1)}
 else {nx=0;ny=clamp(G.y+e.d,0,h-1)}
 warpTo(e.m,nx,ny,d)},
arrive(){const mp=MAPS[G.map];const t=tileAt(G.x,G.y);
 G.steps++;if(G.steps%128===0)for(const m of G.party)m.fr=Math.min(255,m.fr+1);
 if(t==='u'||t==='U'){const gc=t==='u'?'Y':'Z';const f=G.map+'_'+gc;
  if(!G.flags[f]){G.flags[f]=1;sfx('click');runScript(function*(){yield say('CLICK! A hedge gate slid open somewhere.')});return}}
 const wp=mp.warps.find(q=>q.x===G.x&&q.y===G.y);
 if(wp){doWarp(wp);return}
 if(t==='i'||CURDIR[t]){this.sliding=true;return}
 const tg=mp.trig.find(q=>q.x===G.x&&q.y===G.y&&(!q.not||!G.flags[q.not]));
 if(tg){runScript(SCRIPTS[tg.s]);return}
 if((t==='g'||t==='q')&&mp.enc){if(this.rollEnc())return}
 losScan()},
rollEnc(){const t=tileAt(G.x,G.y);const rate=t==='g'?0.14:0.07;if(!ch(rate))return false;
 const R=G.roamer;
 if(R.on&&!R.beat&&!R.caught&&R.map===G.map&&phase()==='n'&&ch(0.35)){startWild(roamerMon(),1);return true}
 const tab=MAPS[G.map].enc[phase()]||MAPS[G.map].enc.d;const e=wpick(tab);
 startWild(makeMon(e[0],e[1]+ri(e[2]-e[1]+1),{gleam:ri(64)===0,fr:70}),0);return true},
interact(){const mp=MAPS[G.map];const [vx,vy]=DV[G.dir];const fx=G.x+vx,fy=G.y+vy;
 let n=npcVisAt(fx,fy);
 if(!n&&tileAt(fx,fy)==='k')n=npcVisAt(fx+vx,fy+vy);
 if(n){n.fdir=OPP[G.dir];sfx('blip');
  if(n.tr&&!G.flags[n.tr.f]){runScript(function*(){yield* trainerScript(n);yield* doEvos()});return}
  if(n.tr&&G.flags[n.tr.f]){runScript(function*(){yield say(...(n.tr.a||['...']))});return}
  if(n.dscript){runScript(SCRIPTS[n.dscript]);return}
  if(n.d){runScript(function*(){yield say(...n.d)});return}
  return}
 const sg=mp.signs&&mp.signs[fx+','+fy];
 if(sg){sfx('blip');runScript(function*(){yield say(sg)});return}
 const it=itemAt(fx,fy);
 if(it){runScript(function*(){yield doT(()=>{addItem(it.it,it.q||1);G.flags[it.f]=1});yield sfxT('found');
  yield say(G.name+' found '+((it.q||1)>1?it.q+'x ':'')+IT[it.it].n+'!')});return}
 const ex=mp.exam&&mp.exam.find(e=>e.x===fx&&e.y===fy);
 if(ex){runScript(SCRIPTS[ex.s]);return}},
cam(){const mp=MAPS[G.map];const mw=mp.g[0].length*16,mh=mp.g.length*16;
 let px=G.x*16,py=G.y*16;
 if(this.moving){px+=this.dx*this.prog;py+=this.dy*this.prog}
 return [fl(clamp(px-72,0,Math.max(0,mw-W))),fl(clamp(py-64,0,Math.max(0,mh-H)))]},
d(){const mp=MAPS[G.map];const [cx,cy]=this.cam();
 ctx.fillStyle='#101018';ctx.fillRect(0,0,W,H);
 const x0=fl(cx/16),y0=fl(cy/16),x1=fl((cx+W-1)/16),y1=fl((cy+H-1)/16);
 for(let ty=y0;ty<=y1;ty++)for(let tx2=x0;tx2<=x1;tx2++){
  let t=tileAt(tx2,ty);
  if((t==='Y'||t==='Z')&&gateOpen(t))t='_';
  const c=TIL[t]||TIL['.'];ctx.drawImage(c,tx2*16-cx,ty*16-cy)}
 for(const lb of (mp.labels||[])){const tw=lb.t.length*6-1;
  const sx=fl(lb.x*16+8-tw/2)-cx,sy=lb.y*16-cy+1;
  if(sx+tw<-2||sx>W||sy<-10||sy>H)continue;
  ctx.fillStyle='#14141c';ctx.fillRect(sx-2,sy-1,tw+4,9);
  ctx.fillStyle='#3a3a4a';ctx.fillRect(sx-2,sy-1,tw+4,1);
  drawText(lb.t,sx,sy,'#f8f4d8')}
 for(const it of mp.items){if(G.flags[it.f])continue;const sx=it.x*16-cx,sy=it.y*16-cy;
  if(sx<-16||sy<-16||sx>W||sy>H)continue;
  ctx.fillStyle='#30343c';ctx.fillRect(sx+4,sy+5,8,8);
  ctx.fillStyle='#e85058';ctx.fillRect(sx+5,sy+6,6,3);
  ctx.fillStyle='#f0f0e8';ctx.fillRect(sx+5,sy+9,6,3);
  ctx.fillStyle='#f8b8b8';ctx.fillRect(sx+6,sy+7,1,1)}
 const ents=[];
 for(const n of mp.npcs){if(!npcVis(n))continue;
  ents.push({y:n.y*16+(n.py||0),f:()=>ctx.drawImage(npcSpr(n.pal,n.fdir||n.dir),n.x*16+(n.px||0)-cx,n.y*16+(n.py||0)-cy-2)})}
 let ppx=G.x*16,ppy=G.y*16;
 if(this.moving){ppx+=this.dx*this.prog;ppy+=this.dy*this.prog}
 const lift=this.hop?-fl(7*Math.sin(Math.PI*this.prog/this.len)):0;
 const wf=this.moving&&fl(this.animT/7)%2===1;
 ents.push({y:ppy+1,f:()=>{if(this.hop){ctx.fillStyle='rgba(16,28,16,0.35)';ctx.fillRect(ppx-cx+4,ppy-cy+12,8,3)}
  ctx.drawImage(heroSpr(G.dir,wf),ppx-cx,ppy-cy-2+lift)}});
 ents.sort((a,b)=>a.y-b.y);for(const e of ents)e.f();
 if(!this.moving&&tileAt(G.x,G.y)==='g')ctx.drawImage(TIL['g'],0,8,16,8,G.x*16-cx,G.y*16-cy+8,16,8);
 tint();
 if(mp.out){panel(W-42,0,42,13);drawText(clockStr(),W-37,3)}}};

function npcTick(){const mp=MAPS[G.map];
 for(const n of mp.npcs){if(!npcVis(n))continue;
  if(n.px)n.px-=Math.sign(n.px);if(n.py)n.py-=Math.sign(n.py);
  if(!n.mv)continue;
  if(--n.wt>0)continue;n.wt=70+ri(110);
  const d=pick(['u','d','l','r']);const [vx,vy]=DV[d];
  const tx=n.x+vx,ty=n.y+vy;
  if(Math.abs(tx-n.x0)>1||Math.abs(ty-n.y0)>1)continue;
  if(blockedAt(tx,ty)||(tx===G.x&&ty===G.y))continue;
  const t=tileAt(tx,ty);
  if(t!=='.'&&t!=='-'&&t!=='f'&&t!=='_')continue;
  if(mp.warps.some(w=>w.x===tx&&w.y===ty))continue;
  n.fdir=d;n.x=tx;n.y=ty;n.px=-vx*16;n.py=-vy*16}}
function losScan(){if(topM()!==OW)return;const mp=MAPS[G.map];
 for(const n of mp.npcs){if(!npcVis(n)||!n.tr||!(n.tr.sight>0)||G.flags[n.tr.f])continue;
  const [vx,vy]=DV[n.fdir||n.dir];
  for(let i=1;i<=n.tr.sight;i++){const tx=n.x+vx*i,ty=n.y+vy*i;
   if(tx===G.x&&ty===G.y){engage(n);return}
   if(blockedAt(tx,ty))break}}}
function engage(n){runScript(function*(){
 yield sfxT('conf');yield {k:'emote',n,f:26};yield {k:'npcwalk',n};
 yield doT(()=>{const ddx=n.x-G.x,ddy=n.y-G.y;
  G.dir=Math.abs(ddx)>Math.abs(ddy)?(ddx>0?'r':'l'):(ddy>0?'d':'u');n.fdir=OPP[G.dir]});
 yield* trainerScript(n);yield* doEvos()})}
function warpTo(m,x,y,dir){G.map=m;G.x=x;G.y=y;if(dir)G.dir=dir;OW.moving=false;OW.sliding=false;OW.prog=0;enterMap()}
function enterMap(){const mp=MAPS[G.map];if(mp.mus&&AUD.song!==mp.mus)playSong(mp.mus);
 G.roamer.map=pick(['route1','route2','route3']);
 for(const n of mp.npcs){n.px=0;n.py=0}}
function doWarp(w){runScript(function*(){yield {k:'fade',dir:'out'};yield doT(()=>warpTo(w.m,w.tx,w.ty,w.dir));yield {k:'fade',dir:'in'}})}
function roamerMon(){const R=G.roamer;const m=makeMon(30,20,{fr:30});
 if(R.hp>=0&&R.hp<=maxHP(m)){m.hp=R.hp;m.st=R.st;m.slp=R.slp}else R.hp=m.hp;
 return m}
function startWild(mon,isRoamer){runScript(function*(){
 const r=yield {k:'battle',wild:mon,roamer:isRoamer};
 if(r==='loss')yield* whiteout();
 yield* doEvos()})}
function* trainerScript(n){const t=n.tr;
 yield say(...(t.b||[t.name+' wants to duel!']));
 const r=yield {k:'battle',tr:t};
 if(r==='win'){G.flags[t.f]=1;yield say(...(t.a||['...']));
  if(t.win)yield* SCRIPTS[t.win]()}
 else if(r==='loss')yield* whiteout()}
function* whiteout(){yield say(G.name+' is out of usable KIN!',G.name+' whited out!');
 yield {k:'fade',dir:'out'};
 yield doT(()=>{G.money=fl(G.money/2);healParty();warpTo(G.heal.m,G.heal.x,G.heal.y,'d')});
 yield wait(20);yield {k:'fade',dir:'in'};
 yield say('You hurried somewhere safe...')}
function queueEvo(pi){const m=G.party[pi];if(!m)return;const ev=SP[m.id].ev;if(!ev)return;
 if(EVOQ.some(e=>e.pi===pi))return;
 if((ev.l&&m.lv>=ev.l)||(ev.fr&&m.fr>=ev.fr))EVOQ.push({pi,from:m.id,to:ev.to})}
function* doEvos(){while(EVOQ.length){const e=EVOQ.shift();const m=G.party[e.pi];
 if(!m||m.id!==e.from)continue;
 yield say('What? '+SP[m.id].n+' is evolving!');
 const r=yield {k:'evo',mon:m,to:e.to};
 if(r==='cancel'){sfx('deny');yield say('...It stopped evolving!');continue}
 const oldN=SP[m.id].n,oldMax=maxHP(m);
 yield doT(()=>{m.id=e.to;m.hp=Math.min(m.hp+(maxHP(m)-oldMax),maxHP(m));addCaught(e.to)});
 yield sfxT('evo');
 yield say(oldN+' evolved into '+SP[e.to].n+'!')}}
function rivalTeam(stage){const s=(G&&G.rival)||3;
 if(stage===1)return [[s,5]];
 return [[19,12],[9,11],[s,14]]}

//------------------------------------------------------------ field scripts
function* shopFlow(stock){for(;;){const i=yield ask(['CLERK: How can I help you?'],['BUY','SELL','LEAVE'],2);
 if(i===0)yield {k:'shop',stock,mode:'buy'};
 else if(i===1)yield {k:'shop',mode:'sell'};
 else break}
 yield say('CLERK: Come again!')}
function* orbPick(i){if(G.flags.gotstarter){yield say('The other KIN were sent off to new homes.');return}
 const id=STARTERS[i],s=SP[id];
 yield say('The '+s.t[0]+' KIN, '+s.n+'!');
 const c=yield ask([s.dex,'Choose '+s.n+'?'],['YES','NO'],1);
 if(c!==0)return;
 yield doT(()=>{G.party.push(makeMon(id,5,{fr:90}));addCaught(id);setF('gotstarter');G.rival=RIVALPICK[id]});
 yield sfxT('catch');
 yield say(G.name+' chose '+s.n+'!');
 yield say('BRAMBLE: A fine match!','Your rival ROOK took '+SP[G.rival].n+' at dawn. The type that beats yours.','He called it "strategy." Hmph.');
 yield doT(()=>setF('kindex'));yield sfxT('found');
 yield say(G.name+' received the KINDEX!','BRAMBLE: It records every KIN you see and snare.','My AIDE at the north exit has a parting gift. Travel well!')}
const SCRIPTS={
aide:function*(){if(!G.flags.gotstarter){yield say('AIDE: Hold on! Professor BRAMBLE needs you at the LAB first.','Big blue roof, south side of the village.');yield doT(()=>{G.y=Math.min(G.y+1,3);G.dir='d'});return}
 yield say('AIDE: Off already? The Professor sent these along.');
 yield doT(()=>{addItem('snare',5);setF('snares')});yield sfxT('found');
 yield say(G.name+' received 5 SNARES!','AIDE: Weaken a wild KIN first. Sleep makes snaring far easier!')},
mom:function*(){if(!G.flags.gotstarter){yield say('MOM: Professor BRAMBLE was asking for you!',"He's at the LAB. Go on, shoo! Adventure won't start itself.");return}
 const i=yield ask(['MOM: Look at you, a real KEEPER!','Want to rest up before you go?'],['YES','NO'],1);
 if(i===0){yield doT(()=>healParty());yield sfxT('heal');yield wait(30);yield say('MOM: There. Good as new!')}
 else yield say("MOM: Don't forget to visit, hero.")},
bed:function*(){const i=yield ask(['The bed looks warm and inviting.','Take a nap?'],['YES','NO'],1);
 if(i!==0)return;
 yield {k:'fade',dir:'out'};yield doT(()=>healParty());yield sfxT('heal');yield wait(35);
 yield {k:'fade',dir:'in'};yield say(G.name+' woke up refreshed!')},
prof:function*(){if(!G.flags.gotstarter){yield say('BRAMBLE: Ah, '+G.name+'! Right on time.','Three young KIN wait on that table: EMBER, TIDE and FLORA.','Go on. Choose your partner!');return}
 yield say('BRAMBLE: Fill that KINDEX! Walk, battle, snare.','KIN grow fond of a kind KEEPER as you travel.','Some only reveal their true form to a real friend.')},
orb0:function*(){yield* orbPick(0)},
orb1:function*(){yield* orbPick(1)},
orb2:function*(){yield* orbPick(2)},
nurse:function*(){const i=yield ask(['NURSE: Welcome to the HAVEN!','Shall I mend your KIN?'],['YES','NO'],1);
 if(i===0){yield doT(()=>{healParty();G.heal={m:G.map,x:5,y:4}});yield sfxT('heal');yield wait(40);
  yield say('NURSE: All mended! Do come again.')}
 else yield say('NURSE: Safe roads!')},
pc:function*(){yield sfxT('conf');yield say(G.name+' booted up the KIN VAULT.');yield {k:'vault'}},
shop1:function*(){yield* shopFlow(['snare','tonic','remedy','juneberry'])},
shop2:function*(){yield* shopFlow(['snare','primesnare','tonic','supertonic','remedy','rekindle'])},
shop3:function*(){yield* shopFlow(['primesnare','apexsnare','supertonic','rekindle','remedy','powerband'])},
vendor:function*(){yield say('VENDOR: Psst. The moon market is open.','Best gear, night prices. No refunds, no questions.');
 yield* shopFlow(['apexsnare','coincharm','tidepearl','rekindle'])},
keeper:function*(){if(G.lastGift===G.day){yield say('KEEPER: Mornings are for walking. KIN love a good walk.');return}
 yield say('KEEPER: Ah, a fellow early bird!','Morning dew grows the sweetest JUNEBERRIES. Take one!');
 yield doT(()=>{addItem('juneberry',1);G.lastGift=G.day});yield sfxT('found');
 yield say(G.name+' received a JUNEBERRY!')},
miner:function*(){if(!G.flags.gloamgone){yield say('MINER: Those GLOAM creeps cornered me!','They want my ALLOY CORES for some "eclipse engine."','Please, run them off!');return}
 if(!G.flags.core){yield say('MINER: You ran them off! You absolute gem.','Take this. Dug it from the deepest vein.');
  yield doT(()=>{addItem('alloycore',1);setF('core')});yield sfxT('found');
  yield say(G.name+' received an ALLOY CORE!','MINER: Odd ore. A certain STONE KIN hums when it gets close...');return}
 yield say('MINER: That ore hums louder at night. Spooky, eh?')},
rival1win:function*(){yield say('ROOK stormed off toward ROUTE 1.')},
rival2:function*(){yield sfxT('conf');
 yield say('ROOK: Hold it!','Still hauling that same starter around? Adorable.','Watch how a real KEEPER builds a team.');
 const r=yield {k:'battle',tr:{name:'RIVAL ROOK',rival:2,m:700,f:'rival2'}};
 if(r==='win'){yield doT(()=>setF('rival2'));
  yield say('ROOK: ...You train hard. Annoying.','BRAVA in CINDERVALE melts careless teams. Be careful.','Not that I care.')}
 else if(r==='loss'){yield* whiteout()}
 yield* doEvos()},
badge1:function*(){yield sfxT('badge');
 yield say('BRIAR: Take the BLOOM BADGE. You earned every petal.');
 yield doT(()=>{if(!G.badges.includes('BLOOM'))G.badges.push('BLOOM')});
 yield say(G.name+' received the BLOOM BADGE!');
 yield doT(()=>addItem('leafcrest',1));yield sfxT('found');
 yield say('BRIAR: And a LEAF CREST. Held, it feeds FLORA moves.','East past ROUTE 2 lies CINDERVALE... if you brave the cave.');
 yield doT(()=>{G.roamer.on=1});yield wait(20);
 yield say('...Far away, something ancient stirred in the night.')},
badge2:function*(){yield sfxT('badge');
 yield say('BRAVA: The CINDER BADGE! Wear it hot.');
 yield doT(()=>{if(!G.badges.includes('CINDER'))G.badges.push('CINDER')});
 yield say(G.name+' received the CINDER BADGE!');
 yield doT(()=>addItem('cinderfang',1));yield sfxT('found');
 yield say('BRAVA: And a CINDER FANG, for your fire.','That makes two! But BRONTE waits north past CINDERVALE.','Their VOLT gym in STORMREACH crackles. Pack STONE moves!','And that legend NOCTELK still walks the three roads at night.')},
badge3:function*(){yield sfxT('badge');
 yield say('BRONTE: The SURGE BADGE is yours. Fully charged!');
 yield doT(()=>{if(!G.badges.includes('SURGE'))G.badges.push('SURGE')});
 yield say(G.name+' received the SURGE BADGE!');
 yield doT(()=>addItem('stormcell',1));yield sfxT('found');
 yield say('BRONTE: And a STORM CELL. It supercharges VOLT moves.','Three badges! You light up Solvane, KEEPER.','The AURELIA gate north is sealed... for now.','But NOCTELK still walks the three roads at night. Go chase the storm.')},
gloamwin:function*(){yield say('VESPER: The eclipse will rise... elsewhere!');
 yield doT(()=>setF('gloamgone'));
 yield say('The GLOAM SYNDICATE scattered into the dark!')}};

