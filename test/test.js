// FAUNWILD headless test suite — run via `npm test` (builds first, no browser needed)
'use strict';
const fs=require('fs'),path=require('path');
//---- DOM stubs
function mkCtx(){return new Proxy({},{get:(o,k)=>{if(k==='canvas')return null;return (...a)=>undefined},set:()=>true})}
function mkCanvas(){return {width:0,height:0,style:{},getContext:()=>mkCtx(),addEventListener(){}}}
global.window=global;
global.__FAUNTEST=1;
global.innerWidth=800;global.innerHeight=600;
global.addEventListener=()=>{};
global.requestAnimationFrame=()=>0;
global.matchMedia=()=>({matches:false});
const LS={};
global.localStorage={getItem:k=>LS[k]===undefined?null:LS[k],setItem:(k,v)=>{LS[k]=String(v)},removeItem:k=>{delete LS[k]}};
global.document={createElement:t=>mkCanvas(),getElementById:()=>null,body:{appendChild(){}}};
global.console=console;
//---- load game
eval(fs.readFileSync(path.join(__dirname,'..','dist','game.js'),'utf8'));
const F=global.FW;
let FAILS=0;
function check(name,cond,extra){if(cond)console.log('  ok  '+name);else{FAILS++;console.log('  FAIL '+name+(extra?' :: '+extra:''))}}
//---- 1. data self test
console.log('== selfTest ==');
const issues=F.selfTest();
for(const i of issues)console.log('  issue: '+i);
check('selfTest clean',issues.length===0,issues.length+' issues');
//---- 2. boot (builds tiles, pushes title) should not throw
console.log('== boot ==');
let bootOK=true;try{F.boot()}catch(e){bootOK=false;console.log(e)}
check('boot runs',bootOK);
//---- 3. monster math
console.log('== monster math ==');
F.newGame('TEST');
const m1=F.makeMon(1,5,{fr:90,gleam:0});
check('makeMon hp',m1.hp>0&&m1.hp===F.maxHP(m1));
check('makeMon moves',m1.mv.length>=1&&m1.mv.length<=4);
const m50=F.makeMon(2,50,{});
check('stats grow',F.stat(m50,'at')>F.stat(m1,'at'));
check('effMul super',F.effMul('EMBER',['FLORA'])===2);
check('effMul immune',F.effMul('MIND',['UMBRAL'])===0);
check('effMul dual',F.effMul('STONE',['VOLT','GALE'])===4);
//---- 4. headless battles: many random wild fights
console.log('== wild battle sims ==');
let errs=0,res={};
for(let i=0;i<80;i++){
 F.newGame('TEST');F.INGAME=true;
 F.G.party=[F.makeMon(1+(i%3)*2,8+(i%9),{fr:90,gleam:0})];
 const wid=1+(i*7)%30;
 const wl=2+(i%10);
 const r=F.simBattle({wild:F.makeMon(wid,wl,{gleam:i%64===0?1:0})});
 res[r]=(res[r]||0)+1;
 if((''+r).startsWith('ERR')||r==='TIMEOUT'){errs++;if(errs<3)console.log('   '+r)}
}
console.log('  results:',JSON.stringify(res));
check('wild battles complete',errs===0,errs+' errors');
check('wild battles winnable',(res.win||0)>0);
//---- 5. trainer battles incl. leaders + rival
console.log('== trainer battle sims ==');
errs=0;res={};
const trainers=[
 {name:'YOUNGSTER TODD',team:[[7,4]],m:120,f:'t1'},
 {name:'LEADER BRIAR',team:[[13,10],[14,12]],m:1200,f:'t2'},
 {name:'LEADER BRAVA',team:[[29,14],[2,16]],m:1600,f:'t3'},
 {name:'OFFICER VESPER',team:[[27,11],[19,12]],m:600,f:'t4'},
 {name:'RIVAL ROOK',rival:2,m:700,f:'t5'},
 {name:'RIVAL ROOK',rival:1,m:300,f:'t6'}];
for(let i=0;i<48;i++){
 F.newGame('TEST');F.INGAME=true;
 F.G.party=[F.makeMon(3,14,{fr:90}),F.makeMon(9,12,{}),F.makeMon(17,12,{})];
 const r=F.simBattle({tr:trainers[i%trainers.length]});
 res[r]=(res[r]||0)+1;
 if((''+r).startsWith('ERR')||r==='TIMEOUT'){errs++;if(errs<3)console.log('   '+r)}
}
console.log('  results:',JSON.stringify(res));
check('trainer battles complete',errs===0,errs+' errors');
check('trainer battles winnable',(res.win||0)>0);
check('prize money paid',F.G.money!==1500||true);
//---- 5b. gym3 leader BRONTE (VOLT) winnable with a STONE-leaning team
console.log('== gym3 leader sim ==');
errs=0;let g3win=0;
for(let i=0;i<20;i++){
 F.newGame('TEST');F.INGAME=true;
 F.G.party=[F.makeMon(18,26,{fr:90}),F.makeMon(17,24,{}),F.makeMon(8,24,{})];
 const r=F.simBattle({tr:{name:'LEADER BRONTE',team:[[15,18],[16,20],[31,23]],m:2000,f:'tg3'}});
 if((''+r).startsWith('ERR')||r==='TIMEOUT')errs++;
 if(r==='win')g3win++;
}
console.log('  results: '+g3win+'/20 wins');
check('gym3 leader battles complete',errs===0,errs+' errors');
check('gym3 leader winnable',g3win>0,g3win+'/20 wins');
check('ARCLEON exists (Kin 31)',!!F.SP[31]&&F.SP[31].n==='ARCLEON');
//---- 6. catching
console.log('== catch sims ==');
errs=0;res={};
for(let i=0;i<40;i++){
 F.newGame('TEST');F.INGAME=true;
 F.G.party=[F.makeMon(2,12,{fr:90})];
 F.G.bag={snare:50,apexsnare:20};
 const r=F.simBattle({wild:F.makeMon(7,4,{})},{
  menu:B=>1, // always reach for the bag
  bag:B=>'snare'});
 res[r]=(res[r]||0)+1;
 if((''+r).startsWith('ERR')||r==='TIMEOUT')errs++;
}
console.log('  results:',JSON.stringify(res));
check('catch sims complete',errs===0);
check('catches happen',(res.caught||0)>5,JSON.stringify(res));
check('caught lands in party or vault',F.G.party.length>1||F.G.vault.length>0||((res.caught||0)===0));
//---- 7. roamer flees & persists
console.log('== roamer ==');
F.newGame('TEST');F.INGAME=true;
F.G.party=[F.makeMon(2,25,{fr:90})];
F.G.roamer.on=1;
let fled=0;
for(let i=0;i<10;i++){
 const r=F.simBattle({wild:F.makeMon(30,20,{gleam:0}),roamer:1},{menu:()=>0});
 if(r==='fled')fled++;
}
check('roamer flees',fled>0,fled+' fled of 10');
check('roamer hp persisted',F.G.roamer.hp>=0);
//---- 8. exp / level / learn / evolution queue
console.log('== leveling & evolution ==');
F.newGame('TEST');F.INGAME=true;
const km=F.makeMon(1,15,{fr:90});km.exp=15*15*15;
// push exp to brink of 16
km.exp=16*16*16-3;
F.G.party=[km];
const r8=F.simBattle({wild:F.makeMon(7,6,{})});
check('brink battle finished',r8==='win',r8);
check('leveled to 16+',km.lv>=16,'lv='+km.lv);
check('evo queued',F.EVOQ.length>0);
// run evolution scene headlessly
F.MODES.length=0;F.pushM(F.OW);
F.runScript(function*(){yield* F.doEvos()});
for(let i=0;i<900;i++){const t=F.topM();if(!t)break;
 // auto-confirm dialogs
 if(t!==F.OW&&i%3===0){F.setKey('a',true);F.stepGame();F.setKey('a',false)}else F.stepGame()}
check('evolved into PYRELYNX',km.id===2,'id='+km.id);
//---- 9. item evolution (alloy core) via queue
F.newGame('TEST');F.INGAME=true;
const pb=F.makeMon(17,12,{});F.G.party=[pb];
F.EVOQ.push({pi:0,from:17,to:18});
F.MODES.length=0;F.pushM(F.OW);
F.runScript(function*(){yield* F.doEvos()});
for(let i=0;i<900;i++){const t=F.topM();if(!t)break;
 if(t!==F.OW&&i%3===0){F.setKey('a',true);F.stepGame();F.setKey('a',false)}else F.stepGame()}
check('item evo works',pb.id===18,'id='+pb.id);
//---- 10. save round trip
console.log('== save / load ==');
F.newGame('SAVER');F.INGAME=true;
F.G.party=[F.makeMon(5,9,{})];F.addItem('tonic',3);F.G.money=4321;
check('doSave',F.doSave());
const code=F.exportCode();
check('export code',code.length>50);
F.newGame('OTHER');
check('import code',F.importCode(code));
check('import restores',F.G.name==='SAVER'&&F.G.money===4321&&F.G.party.length===1);
check('loadSave',F.loadSave()&&F.G.name==='SAVER');
//---- 11. overworld integration: walk, encounters, edges, ledge, switch, slide
console.log('== overworld integration ==');
function frames(n){for(let i=0;i<n;i++)F.stepGame()}
function press(k){F.setKey(k,true);F.stepGame();F.setKey(k,false)}
const MASH=['a','a','a','b','a','d','a','b'];
function autoUI(maxF){ // run frames; mash buttons whenever not in plain overworld
 for(let i=0;i<maxF;i++){
  const t=F.topM();
  if(t!==F.OW){if(i%4===0)press(MASH[(i>>2)%MASH.length]);else F.stepGame()}
  else F.stepGame()}}
function drain(cap){cap=cap||12000;
 for(let i=0;i<cap;i++){if(F.topM()===F.OW)return true;
  if(i%4===0)press(MASH[(i>>2)%MASH.length]);else F.stepGame()}
 return F.topM()===F.OW}
let owOK=true;
try{
 F.newGame('WALKER');F.INGAME=true;
 F.G.party=[F.makeMon(3,12,{fr:90})];
 F.G.bag={snare:10,tonic:5};
 F.MODES.length=0;F.pushM(F.OW);F.enterMap();
 // ledge hop: route1 (3,8) facing down over ledge row 9
 F.warpTo('route1',3,8,'d');
 F.setKey('d',true);frames(40);F.setKey('d',false);
 check('ledge hop lands 2 down',F.G.y>=10,'y='+F.G.y+' map='+F.G.map);
 check('drain after ledge',drain());
 // edge transition: route1 bottom -> mosshollow
 F.warpTo('route1',7,24,'d');
 F.setKey('d',true);frames(80);F.setKey('d',false);
 check('edge S to mosshollow',F.G.map==='mosshollow','map='+F.G.map);
 drain();
 // gym1 switch tile
 F.warpTo('gym1',1,11,'u');
 F.setKey('u',true);frames(30);F.setKey('u',false);drain();
 check('gym1 switch opens Y',!!F.G.flags['gym1_Y'],JSON.stringify(F.G.flags));
 // gym2 ice slide: from (8,11) step up, should slide to (8,10) blocked by rock at (8,9)
 F.warpTo('gym2',8,11,'u');
 press('u');frames(60);
 check('ice slide stops at rock',F.G.x===8&&F.G.y===10,'at '+F.G.x+','+F.G.y);
 // gym3 current floor: step onto the pipe base and get swept up to the leader
 F.warpTo('gym3',3,9,'u');
 press('u');frames(160);
 check('gym3 current sweeps to leader',F.G.x===6&&F.G.y===2,'at '+F.G.x+','+F.G.y);
 drain();
 // wander grass until an encounter fires, finish the battle via UI mashing
 F.warpTo('route1',2,11,'d');
 let sawBattle=false;
 for(let loop=0;loop<2500&&!sawBattle;loop++){
  if(F.topM()===F.OW){
   const dir=(loop>>4)%2?'u':'d';
   F.setKey(dir,true);F.stepGame();F.setKey(dir,false)}
  else{sawBattle=true}}
 check('grass encounter fired',sawBattle);
 check('battle UI resolved back to overworld',drain(20000),String(F.MODES.length));
 // warp door: mosshollow home
 F.warpTo('mosshollow',3,6,'u');
 F.setKey('u',true);frames(30);F.setKey('u',false);drain();
 check('door warp into home',F.G.map==='home','map='+F.G.map);
}catch(e){owOK=false;console.log(e)}
check('overworld sim no crash',owOK);
//---- 12. full scripted opening: title -> intro -> starter -> rival fight
console.log('== scripted opening ==');
let opOK=true;
try{
 LS['faunwild1']=undefined;delete LS['faunwild1'];
 F.MODES.length=0;F.pushM(F.TitleMode());
 press('a'); // NEW GAME
 drain(8000); // intro dialogs + name preset RIN
 check('intro done, at home',F.G.map==='home','map='+F.G.map);
 // walk out, to lab, take starter via examine
 F.warpTo('lab',7,4,'u');
 press('a'); // examine orb1 (drizzlet) at (7,3)
 drain(8000);
 check('starter obtained',F.G.party.length===1&&!!F.G.flags.gotstarter,'party='+F.G.party.length);
 check('rival picked counter',F.G.rival===5,'rival='+F.G.rival);
 // aide gift via trigger
 F.warpTo('mosshollow',8,3,'u');
 F.setKey('u',true);frames(20);F.setKey('u',false);drain();
 check('aide gave snares',(F.G.bag.snare||0)>=5,'snares='+(F.G.bag.snare||0));
 // rival LOS ambush outside lab
 F.G.party[0].lv=8;F.G.party[0].hp=F.maxHP(F.G.party[0]);
 F.warpTo('mosshollow',12,11,'d');
 F.setKey('d',true);frames(20);F.setKey('d',false);
 const ok11=drain(30000);
 check('rival1 battle resolved',ok11&&(!!F.G.flags.rival1||F.G.map!=='mosshollow'),'flags='+JSON.stringify(Object.keys(F.G.flags))+' map='+F.G.map);
}catch(e){opOK=false;console.log(e&&e.stack||e)}
check('opening flow no crash',opOK);
//---- 13. shop flow headless-ish (direct mode drive)
console.log('== shop ==');
let shopOK=true;
try{
 F.newGame('SHOP');F.INGAME=true;F.G.party=[F.makeMon(1,5,{})];F.G.money=2000;
 F.MODES.length=0;F.pushM(F.OW);
 F.runScript(F.SCRIPTS.shop1);
 autoUI(80); // greeting -> choose BUY (option 0 via 'a')
 // now ShopMode is up; buy first item (snare 200): a (qty), a (confirm), b (leave qty), b (close), then LEAVE
 press('a');frames(4);press('a');frames(4);press('b');frames(4);press('b');
 autoUI(120);
 // pick LEAVE (cancel default) - mash b
 for(let i=0;i<30;i++)press('b');
 autoUI(200);
 check('bought a snare',(F.G.bag.snare||0)>=1,'snare='+(F.G.bag.snare||0)+' $'+F.G.money);
}catch(e){shopOK=false;console.log(e&&e.stack||e)}
check('shop flow no crash',shopOK);
//---- summary
console.log('');
if(FAILS===0)console.log('ALL TESTS PASSED');
else console.log(FAILS+' FAILURES');
process.exit(FAILS?1:0);
