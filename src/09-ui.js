//------------------------------------------------------------ pause menu & screens
function PauseMode(){let sel=0;const its=['KINDEX','PARTY','BAG','SAVE','OPTIONS','EXIT'];
 return {tr:true,
 u(){if(kp('u')){sel=(sel+5)%6;sfx('blip')}
  if(kp('d')){sel=(sel+1)%6;sfx('blip')}
  if(kp('b')||kp('st')){sfx('blip');remM(this);return}
  if(kp('a')){sfx('conf');
   if(sel===0)pushM(DexMode());
   else if(sel===1)pushM(PartyMode({},()=>{}));
   else if(sel===2)pushM(BagMode({},()=>{}));
   else if(sel===3){runScript(function*(){
    if(doSave()){yield say(G.name+' saved the journey!');
     const i=yield ask(['Copy a backup save code too?'],['YES','NO'],1);
     if(i===0)showIO('export')}
    else yield say('Could not save here!','Use OPTIONS > SAVE CODE for a backup code instead.')})}
   else if(sel===4)pushM(OptionsMode());
   else remM(this)}},
 d(){const w=72,x=W-w-2;panel(x,2,w,6*13+10);
  for(let i=0;i<6;i++){drawText(its[i],x+14,8+i*13);if(i===sel)drawText('>',x+5,8+i*13)}
  panel(2,2,80,24);drawText('$'+G.money,7,6);
  drawText(clockStr()+' '+({m:'MORN',d:'DAY',n:'NIGHT'}[phase()]),7,15)}}}
function PartyMode(t,cb){t=t||{};let sel=0,sub=-1,swap=-1;
 return {tr:false,
 u(){const n=G.party.length;
  if(sub>=0){
   if(kp('u')){sub=(sub+3)%4;sfx('blip')}
   if(kp('d')){sub=(sub+1)%4;sfx('blip')}
   if(kp('b')){sub=-1;sfx('blip');return}
   if(kp('a')){sfx('conf');const m=G.party[sel];
    if(sub===0)pushM(SummaryMode(sel));
    else if(sub===1){swap=sel;sub=-1}
    else if(sub===2){sub=-1;runScript(function*(){
     const i=yield ask([SP[m.id].n+(m.item?' holds '+IT[m.item].n+'.':' holds nothing.')],['GIVE','TAKE','BACK'],2);
     if(i===0){const id=yield {k:'bag',give:1};
      if(id){if(m.item){addItem(m.item,1);yield say('Took back the '+IT[m.item].n+' first.')}
       yield doT(()=>{m.item=id;remItem(id,1)});
       yield say(SP[m.id].n+' now holds the '+IT[id].n+'!')}}
     else if(i===1){if(m.item){addItem(m.item,1);
       yield say('Took the '+IT[m.item].n+' from '+SP[m.id].n+'.');m.item=0}
      else yield say('It holds nothing.')}})}
    else sub=-1}
   return}
  if(kp('u')&&n){sel=(sel+n-1)%n;sfx('blip')}
  if(kp('d')&&n){sel=(sel+1)%n;sfx('blip')}
  if(kp('b')){if(t.forced){sfx('deny');return}
   sfx('blip');remM(this);cb(t.pick?-1:undefined);return}
  if(kp('a')&&n){
   if(swap>=0){if(swap!==sel){const a=G.party[swap];G.party[swap]=G.party[sel];G.party[sel]=a;sfx('conf')}
    swap=-1;return}
   if(t.pick){const m=G.party[sel];
    if(t.battle&&(m.hp<=0||t.cur===sel)){sfx('deny');return}
    sfx('conf');remM(this);cb(sel);return}
   sfx('conf');sub=0}},
 d(){ctx.fillStyle='#d8e8d0';ctx.fillRect(0,0,W,H);
  drawText(t.title||'YOUR KIN',6,4);
  for(let i=0;i<6;i++){const m=G.party[i];const y=14+i*21;
   panel(4,y,152,20);
   if(!m){drawText('-',12,y+7,'#a0a8a0');continue}
   ctx.drawImage(monSpr(m.id,m.gleam),0,0,16,16,8,y+2,16,16);
   drawText(SP[m.id].n.slice(0,10)+(m.gleam?'*':''),28,y+3);
   drawText('L'+m.lv,102,y+3);
   hpbar(28,y+13,56,m.hp,maxHP(m));
   drawText(m.hp+'/'+maxHP(m),88,y+12);
   if(m.hp<=0)drawText('KO',130,y+3,'#c03030');
   else if(m.st)drawText(m.st,130,y+3,STCOL[m.st]);
   if(i===sel)frame(4,y,152,20,'#c03030');
   if(i===swap)drawText('<>',136,y+12,'#3050c0')}
  if(sub>=0){const its=['STATS','SWITCH','ITEM','BACK'];const x=98,y=86;
   panel(x,y,58,4*12+9);
   for(let i=0;i<4;i++){drawText(its[i],x+12,y+5+i*12);if(i===sub)drawText('>',x+4,y+5+i*12)}}}}}
function SummaryMode(i){const m=G.party[i];
 return {tr:false,
 u(){if(kp('b')||kp('a')){sfx('blip');remM(this)}},
 d(){ctx.fillStyle='#e8e0d0';ctx.fillRect(0,0,W,H);
  panel(2,2,156,52);
  ctx.drawImage(monSpr(m.id,m.gleam),0,0,16,16,8,8,40,40);
  drawText(SP[m.id].n+(m.gleam?' *':''),54,8);
  let tx=54;for(const ty of SP[m.id].t){tx=drawText(ty,tx,19,TYPECOL[ty])+5}
  drawText('L'+m.lv,134,8);
  hpbar(54,31,72,m.hp,maxHP(m));
  drawText(m.hp+'/'+maxHP(m)+(m.st?'  '+m.st:m.hp<=0?'  KO':''),54,36);
  drawText(frHearts(m)>0?'@'.repeat(frHearts(m)):'...',54,45,'#d04060');
  panel(2,56,78,58);
  drawText('ATTACK  '+stat(m,'at'),7,62);
  drawText('DEFENSE '+stat(m,'df'),7,74);
  drawText('SPIRIT  '+stat(m,'sc'),7,86);
  drawText('SPEED   '+stat(m,'sp'),7,98);
  panel(82,56,76,58);
  for(let j=0;j<4;j++){const s=m.mv[j],y=62+j*13;
   if(!s){drawText('-',88,y,'#a8a8a0');continue}
   drawText(MV[s.id].n.slice(0,9),88,y);
   drawText(''+s.pp,144,y,'#506050')}
  panel(2,116,156,26);
  drawText('HOLDS: '+(m.item?IT[m.item].n:'NOTHING'),8,120);
  drawText('NEXT LV: '+Math.max(0,expFor(m.lv+1)-m.exp)+' EXP',8,131)}}}
function BagMode(t,cb){t=t||{};let sel=0,top=0;
 const usableBattle=id=>['ball','heal','cure','rev'].includes(IT[id].k);
 return {tr:false,
 u(){const L=bagList();if(sel>=L.length)sel=Math.max(0,L.length-1);
  if(kp('u')&&L.length){sel=(sel+L.length-1)%L.length;sfx('blip')}
  if(kp('d')&&L.length){sel=(sel+1)%L.length;sfx('blip')}
  if(sel<top)top=sel;if(sel>top+7)top=sel-7;
  if(kp('b')){sfx('blip');remM(this);cb(null);return}
  if(kp('a')&&L.length){const id=L[sel];
   if(t.battle){if(!usableBattle(id)){sfx('deny');return}
    sfx('conf');remM(this);cb(id);return}
   if(t.give){if(IT[id].k==='ball'){sfx('deny');return}
    sfx('conf');remM(this);cb(id);return}
   sfx('conf');
   runScript(function*(){const k=IT[id].k;
    const ci=yield ask([IT[id].n+': '+IT[id].d],['USE','TOSS','BACK'],2);
    if(ci===1){const i2=yield ask(['Toss one '+IT[id].n+'?'],['YES','NO'],1);
     if(i2===0){remItem(id,1);yield say('Tossed one '+IT[id].n+'.')}
     return}
    if(ci!==0)return;
    if(k==='ball'){yield say("Can't use that now.");return}
    if(k==='held'){yield say('Give it to a KIN to hold:','PARTY > pick a KIN > ITEM > GIVE.');return}
    const pi=yield {k:'party',pick:1,title:'USE ON WHICH KIN?'};
    if(pi<0)return;
    const m=G.party[pi];
    if(k==='evo'){const ev=SP[m.id].ev;
     if(ev&&ev.item===id){remItem(id,1);
      yield say('The '+IT[id].n+' hums and glows!');
      EVOQ.push({pi,from:m.id,to:ev.to});
      yield* doEvos()}
     else yield say('It had no effect on '+SP[m.id].n+'.');
     return}
    if(!canUseItem(m,id)){yield say("It won't have any effect.");return}
    sfx('heal');yield say(useItemOn(m,id))})}},
 d(){ctx.fillStyle='#e0d8c8';ctx.fillRect(0,0,W,H);
  drawText('BAG'+(t.battle?'  (BATTLE)':t.give?'  (GIVE)':''),6,4);
  const L=bagList();panel(2,12,156,8*13+8);
  if(!L.length)drawText('EMPTY',12,20,'#988878');
  for(let r=0;r<8;r++){const i=top+r;if(i>=L.length)break;const id=L[i];
   drawText(IT[id].n.slice(0,14),16,17+r*13);
   drawText('X'+G.bag[id],126,17+r*13);
   if(i===sel)drawText('>',7,17+r*13)}
  panel(2,122,156,20);
  if(L.length){const ls=wrap(IT[L[sel]].d,25);
   drawText(ls[0]||'',7,125);drawText(ls[1]||'',7,133)}}}}
function ShopMode(t,cb){const buy=t.mode!=='sell';
 let sel=0,top=0,qty=0;
 const items=()=>buy?t.stock:bagList().filter(id=>IT[id].k!=='evo');
 const price=id=>buy?IT[id].pr:fl(IT[id].pr/2);
 return {tr:false,
 u(){const L=items();if(sel>=L.length)sel=Math.max(0,L.length-1);
  if(qty>0){const id=L[sel],mxq=buy?99:G.bag[id];
   if(kp('l')){qty=Math.max(1,qty-1);sfx('blip')}
   if(kp('r')){qty=Math.min(mxq,qty+1);sfx('blip')}
   if(kp('u')){qty=Math.min(mxq,qty+10);sfx('blip')}
   if(kp('d')){qty=Math.max(1,qty-10);sfx('blip')}
   if(kp('b')){qty=0;sfx('blip');return}
   if(kp('a')){const cost=price(id)*qty;
    if(buy){if(G.money<cost){sfx('deny');return}
     G.money-=cost;addItem(id,qty);sfx('catch')}
    else{remItem(id,qty);G.money+=cost;sfx('catch')}
    qty=0}
   return}
  if(kp('u')&&L.length){sel=(sel+L.length-1)%L.length;sfx('blip')}
  if(kp('d')&&L.length){sel=(sel+1)%L.length;sfx('blip')}
  if(sel<top)top=sel;if(sel>top+7)top=sel-7;
  if(kp('b')){sfx('blip');remM(this);cb();return}
  if(kp('a')&&L.length){qty=1;sfx('conf')}},
 d(){ctx.fillStyle='#e8e8d8';ctx.fillRect(0,0,W,H);
  panel(2,2,76,15);drawText('$'+G.money,8,6);
  drawText(buy?'BUYING':'SELLING',110,6);
  const L=items();panel(2,20,156,8*13+8);
  if(!L.length)drawText('NOTHING HERE',12,28,'#988878');
  for(let r=0;r<8;r++){const i=top+r;if(i>=L.length)break;const id=L[i];
   drawText(IT[id].n.slice(0,12),16,25+r*13);
   drawText('$'+price(id),96,25+r*13);
   if(!buy)drawText('X'+G.bag[id],134,25+r*13);
   if(i===sel)drawText('>',7,25+r*13)}
  if(qty>0&&L.length){const id=L[sel];panel(30,112,128,28);
   drawText('X'+qty+' = $'+(price(id)*qty),40,118);
   drawText('</>:QTY A:OK B:NO',40,128)}}}}
function VaultMode(cb){let col=0;const sel=[0,0];let top=0;
 return {tr:false,
 u(){const Ls=[G.party,G.vault],L=Ls[col];
  if(sel[col]>=L.length)sel[col]=Math.max(0,L.length-1);
  if(kp('l')){col=0;sfx('blip')}
  if(kp('r')){col=1;sfx('blip')}
  if(kp('u')&&L.length){sel[col]=(sel[col]+L.length-1)%L.length;sfx('blip')}
  if(kp('d')&&L.length){sel[col]=(sel[col]+1)%L.length;sfx('blip')}
  if(sel[1]<top)top=sel[1];if(sel[1]>top+5)top=sel[1]-5;
  if(kp('b')){sfx('blip');remM(this);cb();return}
  if(kp('a')&&L.length){
   if(col===0){if(G.party.length<=1){sfx('deny');return}
    G.vault.push(G.party.splice(sel[0],1)[0]);sfx('conf')}
   else{if(G.party.length>=6){sfx('deny');return}
    G.party.push(G.vault.splice(sel[1],1)[0]);sfx('conf')}}},
 d(){ctx.fillStyle='#d0d8e8';ctx.fillRect(0,0,W,H);
  drawText('KIN VAULT   A:MOVE B:DONE',6,3);
  panel(2,13,76,129);drawText('PARTY',10,17,col===0?'#c03030':'#404048');
  for(let i=0;i<G.party.length;i++){const m=G.party[i];
   drawText(SP[m.id].n.slice(0,8),16,29+i*18);
   drawText('L'+m.lv,16,38+i*18,'#606870');
   if(col===0&&i===sel[0])drawText('>',7,29+i*18)}
  panel(82,13,76,129);drawText('VAULT '+G.vault.length,90,17,col===1?'#c03030':'#404048');
  for(let r=0;r<6;r++){const i=top+r;if(i>=G.vault.length)break;const m=G.vault[i];
   drawText(SP[m.id].n.slice(0,8),96,29+r*18);
   drawText('L'+m.lv,96,38+r*18,'#606870');
   if(col===1&&i===sel[1])drawText('>',87,29+r*18)}}}}
function NameMode(cb){let name='',cx2=0,cy2=0;
 const cell=(x,y)=>{const i=y*7+x;return i<26?String.fromCharCode(65+i):i===26?'DEL':'END'};
 return {tr:false,
 u(){if(kp('l')){cx2=(cx2+6)%7;sfx('blip')}
  if(kp('r')){cx2=(cx2+1)%7;sfx('blip')}
  if(kp('u')){cy2=(cy2+3)%4;sfx('blip')}
  if(kp('d')){cy2=(cy2+1)%4;sfx('blip')}
  if(kp('b')){name=name.slice(0,-1);sfx('blip')}
  if(kp('st')){if(name.length){sfx('conf');remM(this);cb(name)}return}
  if(kp('a')){const c=cell(cx2,cy2);
   if(c==='DEL'){name=name.slice(0,-1);sfx('blip')}
   else if(c==='END'){if(name.length){sfx('conf');remM(this);cb(name)}else sfx('deny')}
   else if(name.length<7){name+=c;sfx('blip')}
   else sfx('deny')}},
 d(){ctx.fillStyle='#283038';ctx.fillRect(0,0,W,H);
  drawText('YOUR NAME?',8,6,'#e8e8d8');
  panel(8,18,144,17);drawText(name+(fl(Date.now()/300)%2?'_':''),16,23);
  panel(8,42,144,86);
  for(let y=0;y<4;y++)for(let x=0;x<7;x++){const c=cell(x,y);
   const px=20+x*19,py=50+y*19;
   drawText(c,px,py);
   if(x===cx2&&y===cy2)frame(px-4,py-4,c.length*6+7,14,'#c03030')}
  drawText('A:PICK B:DEL START:DONE',10,133,'#aab0c0')}}}
function ForgetMode(mon,mid,cb){let sel=0;
 return {tr:true,
 u(){if(kp('u')){sel=(sel+4)%5;sfx('blip')}
  if(kp('d')){sel=(sel+1)%5;sfx('blip')}
  if(kp('b')){sfx('blip');remM(this);cb(-1);return}
  if(kp('a')){sfx('conf');remM(this);cb(sel<4?sel:-1)}},
 d(){panel(24,18,112,98);
  drawText('FORGET WHICH MOVE?',32,24);
  for(let i=0;i<4;i++){drawText(MV[mon.mv[i].id].n.slice(0,13),46,38+i*13);
   if(sel===i)drawText('>',36,38+i*13)}
  drawText('GIVE UP',46,38+52);if(sel===4)drawText('>',36,90);
  drawText('NEW: '+MV[mid].n.slice(0,12),32,104,'#3050b0')}}}
function EvoMode(mon,to,cb){let f=0;
 return {tr:false,
 u(){if(f<280&&kp('b')){remM(this);cb('cancel');return}
  f++;
  if(f===280)sfx('evo');
  if(f>=336){remM(this);cb('done')}},
 d(){ctx.fillStyle='#101428';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#1c2444';ctx.fillRect(0,40,W,64);
  for(let i=0;i<10;i++){ctx.fillStyle='#303c64';ctx.fillRect((i*53+fl(f/3)*7)%160,(i*31)%140,1,1)}
  const per=Math.max(3,fl(42-f/8));
  const id=(f>=280||fl(f/per)%2===1)?to:mon.id;
  ctx.drawImage(monSpr(id,mon.gleam),0,0,16,16,56,46,48,48);
  if(f<280)drawText('B: STOP',62,124,'#8890b0');
  if(f>=280&&f<330){ctx.fillStyle='rgba(255,255,240,'+Math.max(0,(1-(f-280)/44)).toFixed(2)+')';ctx.fillRect(0,0,W,H)}}}}
function DexMode(){let sel=0,top=0;
 return {tr:false,
 u(){if(kp('u')){sel=(sel+DEXN-1)%DEXN;sfx('blip')}
  if(kp('d')){sel=(sel+1)%DEXN;sfx('blip')}
  if(sel<top)top=sel;if(sel>top+8)top=sel-8;
  if(kp('b')){sfx('blip');remM(this);return}
  if(kp('a')){const id=sel+1;
   if(G.seen[id]){sfx('conf');pushM(DexEntryMode(id))}else sfx('deny')}},
 d(){ctx.fillStyle='#c83838';ctx.fillRect(0,0,W,13);
  ctx.fillStyle='#e8e0d0';ctx.fillRect(0,13,W,H-13);
  drawText('KINDEX SEEN:'+Object.keys(G.seen).length+' SNARED:'+Object.keys(G.caught).length,4,3,'#f8f0e0');
  for(let r=0;r<9;r++){const i=top+r;if(i>=DEXN)break;
   const id=i+1,y=17+r*14;
   drawText(('00'+id).slice(-2),16,y);
   drawText(G.seen[id]?SP[id].n:'?????',36,y,G.seen[id]?'#282828':'#a09888');
   if(G.caught[id])drawText('*',110,y,'#c03030');
   if(i===sel)drawText('>',7,y)}}}}
function DexEntryMode(id){return {tr:false,
 u(){if(kp('a')||kp('b')){sfx('blip');remM(this)}},
 d(){ctx.fillStyle='#e8e0d0';ctx.fillRect(0,0,W,H);
  panel(2,2,156,58);
  ctx.drawImage(monSpr(id,0),0,0,16,16,10,10,44,44);
  drawText(('00'+id).slice(-2)+' '+SP[id].n,62,10);
  let tx=62;for(const t of SP[id].t)tx=drawText(t,tx,22,TYPECOL[t])+6;
  drawText(G.caught[id]?'SNARED *':'SEEN ONLY',62,36,G.caught[id]?'#c03030':'#807868');
  panel(2,62,156,52);
  const ls=wrap(G.caught[id]?SP[id].dex:'Snare one to record its full entry.',25);
  for(let i=0;i<ls.length&&i<3;i++)drawText(ls[i],8,68+i*12);
  drawText('A/B: BACK',8,130,'#807868')}}}
function OptionsMode(){let sel=0;
 const rows=['TEXT SPEED','MUSIC','SOUND FX','SET CLOCK','SAVE CODE','IMPORT CODE','BACK'];
 return {tr:false,
 u(){if(kp('u')){sel=(sel+rows.length-1)%rows.length;sfx('blip')}
  if(kp('d')){sel=(sel+1)%rows.length;sfx('blip')}
  const adj=dd=>{sfx('blip');
   if(sel===0)G.opts.txt=clamp(G.opts.txt+dd,0,2);
   else if(sel===1)G.opts.mus=G.opts.mus?0:1;
   else if(sel===2)G.opts.sfx=G.opts.sfx?0:1;
   else if(sel===3)G.time=(((fl(G.time/60)+dd+24)%24))*60};
  if(kp('l'))adj(-1);
  if(kp('r'))adj(1);
  if(kp('b')){sfx('blip');remM(this);return}
  if(kp('a')){if(sel===4)showIO('export');
   else if(sel===5)showIO('import');
   else if(sel===6){sfx('blip');remM(this)}
   else adj(1)}},
 d(){ctx.fillStyle='#d8dce0';ctx.fillRect(0,0,W,H);
  drawText('OPTIONS',6,4);
  const vals=[['SLOW','MID','FAST'][G.opts.txt],G.opts.mus?'ON':'OFF',G.opts.sfx?'ON':'OFF',
   ('0'+(fl(G.time/60)%24)).slice(-2)+':00 '+({m:'MORN',d:'DAY',n:'NIGHT'}[phase()]),'>','>',''];
  for(let i=0;i<rows.length;i++){const y=18+i*15;
   drawText(rows[i],18,y);drawText(vals[i],96,y);
   if(i===sel)drawText('>',8,y)}
  drawText('</> CHANGE   B: BACK',8,130,'#506070')}}}
//------------------------------------------------------------ save-code overlay (DOM)
let IOEL=null;
function setupIO(){if(typeof document==='undefined'||!document.getElementById)return;
 const io=document.getElementById('io');if(!io)return;
 IOEL={io,ta:document.getElementById('iotext'),load:document.getElementById('ioload'),
  close:document.getElementById('ioclose'),title:document.getElementById('iotitle')};
 IOEL.close.onclick=()=>{IOEL.io.style.display='none'};
 IOEL.load.onclick=()=>{
  if(importCode(IOEL.ta.value)){IOEL.io.style.display='none';
   MODES.length=0;pushM(OW);enterMap();
   runScript(function*(){yield say('Save code loaded!','Welcome back, '+G.name+'.')})}
  else IOEL.title.textContent='INVALID CODE - check it and try again'}}
function showIO(mode){if(!IOEL){runScript(function*(){yield say('Save codes need the web page UI.')});return}
 IOEL.io.style.display='flex';
 if(mode==='export'){IOEL.title.textContent='SAVE CODE - copy and keep it safe';
  IOEL.ta.value=exportCode();IOEL.ta.readOnly=true;IOEL.load.style.display='none';
  IOEL.ta.focus();if(IOEL.ta.select)IOEL.ta.select()}
 else{IOEL.title.textContent='PASTE A SAVE CODE BELOW';
  IOEL.ta.value='';IOEL.ta.readOnly=false;IOEL.load.style.display='inline-block';IOEL.ta.focus()}}
//------------------------------------------------------------ title & intro
function TitleMode(){let sel=0,f=0;
 const opts=()=>hasSave()?['CONTINUE','NEW GAME','IMPORT CODE']:['NEW GAME','IMPORT CODE'];
 return {tr:false,
 u(){f++;const o=opts();if(sel>=o.length)sel=0;
  if(kp('u')){sel=(sel+o.length-1)%o.length;sfx('blip')}
  if(kp('d')){sel=(sel+1)%o.length;sfx('blip')}
  if(kp('a')||kp('st')){const c=o[sel];sfx('conf');
   if(c==='CONTINUE'){if(loadSave())startPlay()}
   else if(c==='NEW GAME'){MODES.length=0;newGame('RIN');pushM(OW);startScript(introScript())}
   else showIO('import')}},
 d(){f++;
  ctx.fillStyle='#101828';ctx.fillRect(0,0,W,H);
  for(let i=0;i<26;i++){const sx=(i*37)%160,sy=(i*53)%72;
   ctx.fillStyle=(fl(f/40)+i)%6?'#28324c':'#98a0d0';ctx.fillRect(sx,sy,1,1)}
  drawTextBig('FAUNWILD',10,18,3,'#502c14');
  drawTextBig('FAUNWILD',8,16,3,'#f0c850');
  ctext('AN ORIGINAL KIN ADVENTURE',44,'#98a0c0');
  ctx.drawImage(monSpr(30,0),0,0,16,16,58,54,44,44);
  const o=opts();panel(44,99,72,o.length*12+8);
  for(let i=0;i<o.length;i++){drawText(o[i],58,103+i*12);if(i===sel)drawText('>',48,103+i*12)}
  ctext('Z:OK X:BACK ENTER:MENU',2,'#5a6488');
  ctx.globalAlpha=.10+.07*Math.sin(f/80);ctx.fillStyle='#4858b8';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}}}
function IntroBg(){let f=0;return {tr:false,
 d(){f++;ctx.fillStyle='#16202c';ctx.fillRect(0,0,W,H);
  for(let i=0;i<18;i++){ctx.fillStyle='#2a3850';ctx.fillRect((i*43)%160,(i*29)%96,2,2)}
  ctx.drawImage(npcSpr('prof','d'),0,0,16,16,24,30+fl(Math.sin(f/40)*2),48,48);
  ctx.drawImage(monSpr(1,0),0,0,16,16,98,40+fl(Math.cos(f/34)*2),40,40)}}}
function* introScript(){const bg=IntroBg();pushM(bg);
 yield {k:'fade',dir:'in'};
 yield say('BRAMBLE: Welcome to the world of KIN!','Wondrous creatures of field, flame and shadow share our roads.','Folk who battle and bond with them are called KEEPERS.','And what a season! TWO new KIN types were just discovered:','ALLOY and UMBRAL! The old type charts are obsolete!');
 const ci=yield ask(['First things first.','What shall I call you?'],['RIN','KAI','MILO','NOA','OTHER'],0);
 let nm='RIN';
 if(ci<4)nm=['RIN','KAI','MILO','NOA'][ci];
 else nm=(yield {k:'name'})||'RIN';
 yield doT(()=>{G.name=nm});
 yield say('BRAMBLE: '+nm+'! A fine KEEPER name.','Come to my LAB in MOSSHOLLOW when you wake.','Your story starts today!');
 yield {k:'fade',dir:'out'};
 yield doT(()=>{remM(bg);warpTo('home',4,4,'d')});
 yield {k:'fade',dir:'in'};
 yield say('(Visit the LAB with the big blue roof, south side of town!)')}
function startPlay(){MODES.length=0;pushM(OW);INGAME=true;enterMap();
 runScript(function*(){yield {k:'fade',dir:'in'}})}
