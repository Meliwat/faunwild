//------------------------------------------------------------ battle engine
const STATN={atk:'ATTACK',def:'DEFENSE',spc:'SPIRIT',spe:'SPEED',acc:'ACCURACY'};
const STCOL={PSN:'#9858b0',BRN:'#d86020',PAR:'#b89010',SLP:'#7068b8'};
const zeroS=()=>({atk:0,def:0,spc:0,spe:0,acc:0});
const stg=s=>s>=0?(2+s)/2:2/(2-s);
const astg=s=>s>=0?(3+s)/3:3/(3-s);
function effSpe(m,S){let v=stat(m,'sp');v=fl(v*stg(S.spe));if(m.item==='quickquill')v=fl(v*1.12);if(m.st==='PAR')v=fl(v/4);return Math.max(1,v)}
function heldDmg(att,def,mv,base,phys){
 if(att.item==='powerband')base=fl(base*1.1);
 if(att.item==='cinderfang'&&mv.t==='EMBER')base=fl(base*1.2);
 if(att.item==='tidepearl'&&mv.t==='TIDE')base=fl(base*1.2);
 if(att.item==='leafcrest'&&mv.t==='FLORA')base=fl(base*1.2);
 if(att.item==='stormcell'&&mv.t==='VOLT')base=fl(base*1.2);
 return base}
function calcDmg(att,def,aS,dS,mv,crit){const phys=!!PHYS[mv.t];
 let A=stat(att,phys?'at':'sc'),D=stat(def,phys?'df':'sc');
 if(!crit){A=Math.max(1,fl(A*stg(aS[phys?'atk':'spc'])));D=Math.max(1,fl(D*stg(dS[phys?'def':'spc'])))}
 if(def.item==='irontalisman'&&phys)D=fl(D*1.12);
 if(att.st==='BRN'&&phys)A=Math.max(1,fl(A/2));
 let b=fl(fl(fl(2*att.lv/5+2)*mv.p*A/Math.max(1,D))/50)+2;
 if(crit)b*=2;
 if(SP[att.id].t.includes(mv.t))b=fl(b*1.5);
 b=fl(b*effMul(mv.t,SP[def.id].t));
 b=heldDmg(att,def,mv,b,phys);
 b=fl(b*(217+ri(39))/255);
 return Math.max(1,b)}
function aiPick(e,p,turn){const us=e.mv.filter(s=>s.pp>0);
 if(!us.length)return {id:'struggle',pp:1};
 let tot=0;const sc=us.map(s=>{const m=MV[s.id];let w;
  if(m.p>0){const ef=effMul(m.t,SP[p.id].t);w=ef===0?0.01:m.p*ef*(SP[e.id].t.includes(m.t)?1.5:1)}
  else{w=(turn<2?42:10);if(m.st&&p.st)w=0.5}
  tot+=w;return [s,w]});
 let r=Math.random()*tot;for(const [s,w] of sc){r-=w;if(r<0)return s}return us[0]}
function canUseItem(m,id){const it=IT[id];if(!m)return false;
 if(it.k==='heal')return m.hp>0&&m.hp<maxHP(m);
 if(it.k==='cure')return m.hp>0&&!!m.st;
 if(it.k==='rev')return m.hp<=0;
 return false}
function useItemOn(m,id){const it=IT[id];
 if(it.k==='heal'){const h=Math.min(it.hp,maxHP(m)-m.hp);m.hp+=h;remItem(id);return SP[m.id].n+' recovered '+h+' HP!'}
 if(it.k==='cure'){m.st=0;m.slp=0;remItem(id);return SP[m.id].n+' is cured!'}
 if(it.k==='rev'){m.hp=fl(maxHP(m)/2);m.st=0;m.slp=0;remItem(id);return SP[m.id].n+' came back to its senses!'}
 return 'Nothing happened.'}
function mkBattle(t){const B={tr:false,t:t.tr||null,kind:t.tr?'tr':'wild',roamer:!!t.roamer,
 e:null,eTeam:null,eIdx:0,pIdx:Math.max(0,firstAlive()),
 pS:zeroS(),eS:zeroS(),parts:new Set(),turn:0,runs:0,
 eShown:0,pShown:0,eOff:90,pOff:-90,hideE:0,hideP:0,eDrop:0,pDrop:0,
 flashE:0,flashP:0,shakeT:0,spark:0,ball:null,wob:0,beepT:30,
 u(){},
 d(){
  // per-frame visual easing
  if(this.e){const d1=this.e.hp-this.eShown;if(Math.abs(d1)>0.4)this.eShown+=Math.sign(d1)*Math.max(0.45,Math.abs(d1)/9);else this.eShown=this.e.hp}
  const P=G.party[this.pIdx];
  if(P){const d2=P.hp-this.pShown;if(Math.abs(d2)>0.4)this.pShown+=Math.sign(d2)*Math.max(0.45,Math.abs(d2)/9);else this.pShown=P.hp}
  if(this.flashE>0)this.flashE--;if(this.flashP>0)this.flashP--;
  if(this.shakeT>0)this.shakeT--;if(this.spark>0)this.spark--;
  if(P&&P.hp>0&&P.hp<=maxHP(P)*0.25){if(--this.beepT<=0){sfx('beep');this.beepT=32}}
  const sh=this.shakeT>0?ri(5)-2:0;
  ctx.fillStyle='#f0efe0';ctx.fillRect(0,0,W,104);
  ctx.fillStyle='#dce9c6';ctx.fillRect(86+sh,40,64,9);ctx.fillStyle='#b9cf9e';ctx.fillRect(86+sh,47,64,2);
  ctx.fillStyle='#dce9c6';ctx.fillRect(6+sh,96,68,8);ctx.fillStyle='#b9cf9e';ctx.fillRect(6+sh,102,68,2);
  if(this.e&&!this.hideE&&!(this.flashE%4>=2)){
   ctx.drawImage(monSpr(this.e.id,this.e.gleam),0,0,16,16,104+this.eOff+sh,12+this.eDrop,32,32)}
  if(this.spark>0&&this.e){for(let i=0;i<3;i++)drawText('*',104+ri(34),10+ri(34),i?'#f8e060':'#fff')}
  if(this.ball){const b=this.ball;ctx.fillStyle='#202028';ctx.fillRect(b.x+this.wob,b.y,8,8);
   ctx.fillStyle='#e04848';ctx.fillRect(b.x+1+this.wob,b.y+1,6,3);
   ctx.fillStyle='#f0f0e8';ctx.fillRect(b.x+1+this.wob,b.y+4,6,3);
   ctx.fillStyle='#f8f8f8';ctx.fillRect(b.x+3+this.wob,b.y+3,2,2)}
  if(P&&!this.hideP&&!(this.flashP%4>=2)){
   ctx.drawImage(monSpr(P.id,P.gleam),0,0,16,16,14+this.pOff+sh,52+this.pDrop,48,48)}
  if(this.e){panel(2,3,80,28);const e=this.e;
   drawText(SP[e.id].n.slice(0,9)+(e.gleam?'*':''),7,7);
   hpbar(8,16,64,this.eShown,maxHP(e));
   drawText('L'+e.lv,7,21);
   if(e.st)drawText(e.st,40,21,STCOL[e.st]);
   if(this.roamer)drawText('~',68,7,'#564a63')}
  if(P){panel(80,66,78,38);
   drawText(SP[P.id].n.slice(0,9)+(P.gleam?'*':''),85,70);
   hpbar(88,79,64,this.pShown,maxHP(P));
   drawText(fl(Math.max(0,this.pShown))+'/'+maxHP(P),88,84);
   drawText('L'+P.lv,134,70);
   if(P.st)drawText(P.st,130,84,STCOL[P.st]);
   const e0=expFor(P.lv),e1=expFor(P.lv+1);
   ctx.fillStyle='#404048';ctx.fillRect(88,95,64,3);
   ctx.fillStyle='#48a8e0';ctx.fillRect(88,95,fl(64*clamp((P.exp-e0)/Math.max(1,e1-e0),0,1)),3)}
  panel(0,104,160,40)}};
 if(t.tr){B.eTeam=(t.tr.rival?rivalTeam(t.tr.rival):t.tr.team).map(e2=>makeMon(e2[0],e2[1],{fr:70,gleam:0}))}
 else{B.e=t.wild;B.eShown=t.wild.hp}
 const P=G.party[B.pIdx];if(P)B.pShown=P.hp;
 return B}
function BattleMode(t,cb){const B=mkBattle(t);
 B.started=false;
 B.u=function(){if(!B.started){B.started=true;
  startScript(battleFlow(B),r=>{remM(B);const mp=MAPS[G.map];playSong(mp&&mp.mus?mp.mus:'over');cb(r)})}};
 return B}
function bAnim(B,f,d){return {k:'anim',f,d}}
function* battleFlow(B){
 yield {k:'song',n:(MAPS[G.map]&&MAPS[G.map].mus==='gym')?'gymbattle':'battle'};
 yield bAnim(B,30,f=>{if(f<14){ctx.fillStyle=f%4<2?'#080810':'#e8e8d8';ctx.fillRect(0,0,W,H)}
  else{const h2=fl((H/2)*(1-(f-14)/16));ctx.fillStyle='#080810';if(h2>0){ctx.fillRect(0,0,W,h2);ctx.fillRect(0,H-h2,W,h2)}}});
 if(B.kind==='wild'){addSeen(B.e.id);
  yield bAnim(B,16,f=>{B.eOff=fl((16-f)*5.6)});B.eOff=0;
  yield say('A wild '+SP[B.e.id].n+' appeared!');
  if(B.e.gleam){B.spark=70;sfx('found');yield say('It GLEAMS like treasure!')}
  if(B.roamer){sfx('found');yield say('The legend of the night roads!')}}
 else{yield say(B.t.name+' wants to duel!');yield* enemySend(B,0)}
 yield* playerSend(B,B.pIdx,true);
 for(;;){B.turn++;
  let act=yield* playerAction(B);
  if(act.t==='ball'){const r=yield* throwBall(B,act.id);if(r)return r;act=null}
  else if(act.t==='run'){if(yield* tryRun(B))return 'ran';act=null}
  else if(act.t==='item'){yield say(G.name+' used a '+IT[act.id].n+'!');
   const msg=useItemOn(G.party[act.tgt],act.id);sfx('heal');
   if(act.tgt===B.pIdx)B.pShown=Math.min(B.pShown,G.party[B.pIdx].hp);
   yield say(msg);act=null}
  else if(act.t==='switch'){yield* doSwitch(B,act.i,false);act=null}
  const P=()=>G.party[B.pIdx];
  if(B.e.hp>0&&P().hp>0){
   const em=aiPick(B.e,P(),B.turn);
   if(act&&act.t==='fight'){
    const pf=goesFirst(B,act.mv,em);
    for(const w of (pf?['p','e']:['e','p'])){
     if(B.e.hp<=0||P().hp<=0)break;
     if(w==='p')yield* doMove(B,'p',act.mv);else yield* doMove(B,'e',em)}}
   else yield* doMove(B,'e',em)}
  let r=yield* handleFaints(B);if(r)return r;
  r=yield* endTurn(B);if(r)return r;
  if(B.roamer&&B.e.hp>0){
   if(B.e.st!=='SLP'){yield* persistRoamer(B);sfx('run');
    yield say('NOCTELK slipped back into the dark!');return 'fled'}
   yield say('NOCTELK stirs in its sleep...')}}}
function goesFirst(B,pm,em){const pp=MV[pm.id].pr||0,ep=MV[em.id].pr||0;
 if(pp!==ep)return pp>ep;
 const ps=effSpe(G.party[B.pIdx],B.pS),es=effSpe(B.e,B.eS);
 if(ps!==es)return ps>es;return ch(.5)}
function* enemySend(B,i){B.eIdx=i;B.e=B.eTeam[i];B.eS=zeroS();B.hideE=0;B.eDrop=0;B.eShown=B.e.hp;B.eOff=90;
 addSeen(B.e.id);B.parts=new Set([B.pIdx]);
 yield say(B.t.name+' sent out '+SP[B.e.id].n+'!');
 yield bAnim(B,14,f=>{B.eOff=fl((14-f)*6.4)});B.eOff=0}
function* playerSend(B,i,first){B.pIdx=i;B.pS=zeroS();B.hideP=0;B.pDrop=0;const m=G.party[i];B.pShown=m?m.hp:0;
 B.parts.add(i);B.pOff=-90;
 yield say((first?'Go! ':'You got this, ')+SP[m.id].n+'!');
 yield bAnim(B,14,f=>{B.pOff=-fl((14-f)*6.4)});B.pOff=0}
function* doSwitch(B,i,forced){if(!forced){yield say('Come back, '+SP[G.party[B.pIdx].id].n+'!');
  yield bAnim(B,10,f=>{B.pOff=-f*9});B.hideP=1}
 yield* playerSend(B,i,false)}
function* playerAction(B){const P=()=>G.party[B.pIdx];
 for(;;){
  const c=yield {k:'push',tag:'bmenu',B,mk:cb=>BMenuMode(B,cb)};
  if(c===0){
   if(!P().mv.some(s=>s.pp>0)){yield say(SP[P().id].n+' has no moves left!');return {t:'fight',mv:{id:'struggle',pp:1}}}
   const mi=yield {k:'push',tag:'bmove',B,mk:cb=>BMoveMode(B,cb)};
   if(mi<0)continue;
   const s=P().mv[mi];
   if(s.pp<=0){sfx('deny');yield say('No PP left for that move!');continue}
   return {t:'fight',mv:s}}
  if(c===1){const id=yield {k:'bag',battle:1};
   if(!id)continue;
   if(IT[id].k==='ball'){
    if(B.kind==='tr'){yield say("You can't snare another KEEPER's KIN!");continue}
    return {t:'ball',id}}
   const tgt=yield {k:'party',pick:1,battle:1,cur:B.pIdx,title:'USE ON WHICH KIN?'};
   if(tgt<0)continue;
   if(!canUseItem(G.party[tgt],id)){yield say("It won't have any effect.");continue}
   return {t:'item',id,tgt}}
  if(c===2){const i=yield {k:'party',pick:1,battle:1,cur:B.pIdx,title:'SWITCH TO WHICH KIN?'};
   if(i<0)continue;
   return {t:'switch',i}}
  if(c===3){
   if(B.kind==='tr'){yield say("Can't flee a KEEPER duel!");continue}
   return {t:'run'}}}}
function* tryRun(B){const F=fl(effSpe(G.party[B.pIdx],B.pS)*128/Math.max(1,effSpe(B.e,B.eS)))+30*(++B.runs);
 if(F>255||ri(256)<F){sfx('run');yield say('Got away safely!');
  if(B.roamer)yield* persistRoamer(B);
  return true}
 yield say("Can't escape!");return false}
function* persistRoamer(B){yield doT(()=>{G.roamer.hp=B.e.hp;G.roamer.st=B.e.st;G.roamer.slp=B.e.slp})}
function* doMove(B,side,slot){const att=side==='p'?G.party[B.pIdx]:B.e;
 const def=side==='p'?B.e:G.party[B.pIdx];
 const aS=side==='p'?B.pS:B.eS,dS=side==='p'?B.eS:B.pS;
 const an=(side==='p'?'':'Foe ')+SP[att.id].n,dn=(side==='p'?'Foe ':'')+SP[def.id].n;
 const mv=MV[slot.id];
 if(att.st==='SLP'){att.slp--;
  if(att.slp>0){yield say(an+' is fast asleep!');return}
  att.st=0;yield say(an+' woke up!')}
 if(att.st==='PAR'&&ch(.25)){yield say(an+' is fully numbed!');return}
 if(slot.id!=='struggle')slot.pp--;
 yield say(an+' used '+mv.n+'!');
 if(mv.a>0){const hitC=(mv.a/100)*astg(aS.acc);
  if(Math.random()>=hitC){yield say('The attack missed!');return}}
 if(mv.p>0){
  const ef=effMul(mv.t,SP[def.id].t);
  if(ef===0){yield say("It doesn't affect "+dn+'...');return}
  const crit=ch(mv.hc?1/8:1/16);
  const dmg=calcDmg(att,def,aS,dS,mv,crit);
  if(side==='p'){B.flashE=14}else{B.flashP=14}
  if(ef>1||crit)B.shakeT=10;
  sfx(ef>1?'hit2':'hit');
  def.hp=Math.max(0,def.hp-dmg);
  yield wait(clamp(fl(dmg/Math.max(1,maxHP(def))*60)+12,14,52));
  if(crit)yield say('A critical hit!');
  if(ef>1)yield say("It's super effective!");
  if(ef<1)yield say("It's not very effective...");
  if(mv.drain&&att.hp>0){const h=Math.max(1,fl(dmg/2));att.hp=Math.min(maxHP(att),att.hp+h);
   yield say(an+' drained the wound!')}
  if(mv.rec){att.hp=Math.max(0,att.hp-Math.max(1,fl(dmg/4)));yield say(an+' is hurt by recoil!')}
  if(def.hp>0){
   if(mv.brn&&!def.st&&!SP[def.id].t.includes('EMBER')&&ri(100)<mv.brn){def.st='BRN';yield say(dn+' was burned!')}
   else if(mv.psn&&!def.st&&!SP[def.id].t.includes('ALLOY')&&ri(100)<mv.psn){def.st='PSN';yield say(dn+' was poisoned!')}
   else if(mv.par&&!def.st&&ri(100)<mv.par){def.st='PAR';yield say(dn+' is numbed! It may not move!')}
   if(mv.stat&&mv.stat.who==='foe'&&(mv.stat.c?ri(100)<mv.stat.c:false)){
    yield* statChange(B,def,dS,dn,mv.stat)}}
  return}
 // pure status moves
 if(mv.st){const tgt=def,tn=dn;
  if(tgt.st){yield say('But it failed!');return}
  if(mv.st==='PSN'&&SP[tgt.id].t.includes('ALLOY')){yield say("It doesn't affect "+tn+'...');return}
  if(mv.st==='SLP'){tgt.st='SLP';tgt.slp=2+ri(3);yield say(tn+' fell asleep!')}
  else if(mv.st==='PAR'){tgt.st='PAR';yield say(tn+' is numbed! It may not move!')}
  else if(mv.st==='PSN'){tgt.st='PSN';yield say(tn+' was poisoned!')}
  return}
 if(mv.stat){const self=mv.stat.who==='self';
  const tgt=self?att:def,tS=self?aS:dS,tn=self?an:dn;
  yield* statChange(B,tgt,tS,tn,mv.stat)}}
function* statChange(B,tgt,S,tn,st){const cur=S[st.s];
 const nv=clamp(cur+st.d,-6,6);
 if(nv===cur){yield say(tn+"'s "+STATN[st.s]+" won't go "+(st.d>0?'higher':'lower')+'!');return}
 S[st.s]=nv;sfx(st.d>0?'conf':'deny');
 yield say(tn+"'s "+STATN[st.s]+(st.d>1?' rose sharply!':st.d===1?' rose!':st.d<-1?' fell sharply!':' fell!'))}
function* handleFaints(B){const P=()=>G.party[B.pIdx];
 if(B.e.hp<=0){sfx('faint');B.flashE=0;
  yield bAnim(B,14,f=>{B.eDrop=f*3});B.hideE=1;
  yield say((B.kind==='wild'?'The wild ':'Foe ')+SP[B.e.id].n+' fainted!');
  if(B.roamer){yield doT(()=>{G.roamer.beat=1});
   yield say('The legend sinks into the gloam...')}
  yield* giveExp(B);
  if(B.kind==='tr'&&B.eIdx<B.eTeam.length-1){yield* enemySend(B,B.eIdx+1)}
  else{sfx('victory');
   if(B.kind==='tr'){let pay=B.t.m||100;
    if(P()&&P().item==='coincharm')pay=fl(pay*1.5);
    yield doT(()=>{G.money+=pay;for(const m of G.party)m.fr=Math.min(255,m.fr+2)});
    yield say(G.name+' defeated '+B.t.name+'!','Got $'+pay+' for winning!')}
   return 'win'}}
 if(P().hp<=0){sfx('faint');
  yield bAnim(B,14,f=>{B.pDrop=f*4});B.hideP=1;
  yield doT(()=>{P().fr=Math.max(0,P().fr-3)});
  yield say(SP[P().id].n+' fainted!');
  if(firstAlive()<0)return 'loss';
  const i=yield {k:'party',pick:1,battle:1,forced:1,cur:B.pIdx,title:'SEND OUT WHICH KIN?'};
  yield* doSwitch(B,i,true)}
 return null}
function* endTurn(B){const list=[['e',B.e],['p',G.party[B.pIdx]]];
 for(const [side,m] of list){if(!m||m.hp<=0)continue;
  const n=(side==='p'?'':'Foe ')+SP[m.id].n;
  if(m.st==='PSN'||m.st==='BRN'){const d=Math.max(1,fl(maxHP(m)/8));m.hp=Math.max(0,m.hp-d);
   if(side==='p')B.flashP=10;else B.flashE=10;
   yield say(n+' is hurt by its '+(m.st==='PSN'?'poison!':'burn!'));
   yield wait(16)}
  if(m.hp>0&&m.item==='juneberry'&&m.hp<=fl(maxHP(m)/3)){m.hp=Math.min(maxHP(m),m.hp+12);m.item=0;
   yield say(n+' ate its JUNEBERRY!')}
  if(m.st&&m.item==='bitterroot'){m.st=0;m.slp=0;m.item=0;
   yield say(n+"'s BITTERROOT cured it!")}}
 return yield* handleFaints(B)}
function* giveExp(B){const e=B.e;
 const ps=[...B.parts].filter(i=>G.party[i]&&G.party[i].hp>0);
 if(!ps.length)return;
 const base=Math.max(1,fl(SP[e.id].xy*e.lv/7));
 const share=Math.max(1,fl(base/ps.length*(B.kind==='tr'?1.5:1)));
 for(const i of ps){const m=G.party[i];if(m.lv>=100)continue;
  yield say(SP[m.id].n+' gained '+share+' EXP!');
  m.exp+=share;
  while(m.lv<100&&m.exp>=expFor(m.lv+1)){
   const om=maxHP(m);m.lv++;m.hp+=maxHP(m)-om;m.fr=Math.min(255,m.fr+3);
   sfx('lvl');if(i===B.pIdx)B.pShown=m.hp;
   yield say(SP[m.id].n+' grew to level '+m.lv+'!');
   for(const lm of SP[m.id].mv){if(lm[0]!==m.lv)continue;const mid=lm[1];
    if(m.mv.some(s2=>s2.id===mid))continue;
    if(m.mv.length<4){m.mv.push({id:mid,pp:MV[mid].pp});sfx('found');
     yield say(SP[m.id].n+' learned '+MV[mid].n+'!')}
    else{yield say(SP[m.id].n+' wants to learn '+MV[mid].n+'!','But it already knows 4 moves!');
     const c=yield ask(['Forget an old move?'],['YES','NO'],1);
     let done=false;
     if(c===0){const fi=yield {k:'forget',mon:m,mv:mid};
      if(fi>=0){const old=MV[m.mv[fi].id].n;m.mv[fi]={id:mid,pp:MV[mid].pp};done=true;
       yield say('1, 2 and... poof!',SP[m.id].n+' forgot '+old+'...','And learned '+MV[mid].n+'!')}}
     if(!done)yield say(SP[m.id].n+' did not learn '+MV[mid].n+'.')}}
   queueEvo(i)}}}
function* throwBall(B,id){remItem(id);
 yield say(G.name+' threw a '+IT[id].n+'!');sfx('throw');
 yield bAnim(B,20,f=>{const t2=f/20;B.ball={x:fl(20+t2*92),y:fl(80-Math.sin(t2*Math.PI)*62)}});
 B.ball={x:112,y:30};B.hideE=1;sfx('click');
 const e=B.e,M=maxHP(e);
 let a=fl(fl(3*M-2*e.hp)*SP[e.id].cr*IT[id].m/(3*M));
 a=fl(a*(e.st==='SLP'?2:e.st?1.5:1));a=clamp(a,1,255);
 const bb=fl(255*Math.pow(a/255,0.25));
 let sh=0;for(let i=0;i<4;i++){if(ri(256)<bb)sh++;else break}
 const caught=sh>=4;
 for(let i=0;i<Math.min(sh,3);i++){yield wait(18);sfx('shake');
  yield bAnim(B,22,f=>{B.wob=fl(3*Math.sin(f/2.6))});B.wob=0}
 yield wait(14);
 if(!caught){B.hideE=0;B.ball=null;sfx('deny');
  yield say(['Oh no! It broke free!','Argh! Almost had it!','Shoot! So close!'][Math.min(sh,2)]);
  return null}
 sfx('click');yield wait(18);sfx('catch');
 const isNew=!G.caught[e.id];
 yield say('Gotcha! '+SP[e.id].n+' was snared!');
 yield doT(()=>{addCaught(e.id);if(B.roamer)G.roamer.caught=1});
 if(isNew)yield say(SP[e.id].n+"'s data hums into the KINDEX!");
 if(G.party.length<6)yield doT(()=>G.party.push(e));
 else{yield doT(()=>G.vault.push(e));yield say('It was beamed to the VAULT.')}
 return 'caught'}
//---- battle menus
function BMenuMode(B,cb){let sel=0;const its=['FIGHT','BAG','KIN','RUN'];
 return {tr:true,
 u(){if(kp('l')||kp('r')){sel^=1;sfx('blip')}
  if(kp('u')||kp('d')){sel^=2;sfx('blip')}
  if(kp('a')){sfx('conf');remM(this);cb(sel)}},
 d(){panel(64,104,96,40);
  for(let i=0;i<4;i++){const x=72+(i%2)*46,y=112+fl(i/2)*16;
   drawText(its[i],x+8,y);if(i===sel)drawText('>',x,y)}
  panel(0,104,64,40);drawText('WHAT',8,112);drawText('WILL',8,122);drawText(SP[G.party[B.pIdx].id].n.slice(0,8)+' DO?',4,132)}}}
function BMoveMode(B,cb){let sel=0;const m=G.party[B.pIdx];
 return {tr:true,
 u(){if(kp('u')){sel=(sel+m.mv.length-1)%m.mv.length;sfx('blip')}
  if(kp('d')){sel=(sel+1)%m.mv.length;sfx('blip')}
  if(kp('b')){sfx('blip');remM(this);cb(-1)}
  if(kp('a')){sfx('conf');remM(this);cb(sel)}},
 d(){panel(0,104,160,40);
  for(let i=0;i<m.mv.length;i++){const s=m.mv[i];
   drawText(MV[s.id].n.slice(0,13),16,109+i*8+(i>1?1:0));
   if(i===sel)drawText('>',8,109+i*8+(i>1?1:0))}
  const s=m.mv[sel];panel(108,104,52,40);
  drawText(MV[s.id].t.slice(0,7),112,110,TYPECOL[MV[s.id].t]);
  drawText('PP',112,122);drawText(s.pp+'/'+MV[s.id].pp,112,131)}}}
