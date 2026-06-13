//------------------------------------------------------------ boot, loop, input
let ACC=0,LASTT=0;
function stepGame(){if(INGAME&&G)tickTime();
 musTick();
 const t=topM();if(t&&t.u)t.u();
 for(const k in KEYP)KEYP[k]=0}
function drawFrame(){if(!ctx)return;
 let s=0;for(let i=MODES.length-1;i>=0;i--)if(!MODES[i].tr){s=i;break}
 ctx.fillStyle='#080810';ctx.fillRect(0,0,W,H);
 for(let i=s;i<MODES.length;i++)if(MODES[i].d)MODES[i].d()}
function frameLoop(ts){requestAnimationFrame(frameLoop);
 if(!LASTT)LASTT=ts;let dt=ts-LASTT;LASTT=ts;if(dt>250)dt=250;
 ACC+=dt;let n=0;
 while(ACC>=16.667&&n<5){ACC-=16.667;n++;stepGame()}
 drawFrame()}
function resize(){if(!cv||typeof innerWidth==='undefined')return;
 let coarse=false;try{coarse=matchMedia('(pointer:coarse)').matches}catch(e){}
 const availH=innerHeight-(coarse?186:16);
 let s=Math.min(fl((innerWidth-8)/W),fl(availH/H));
 s=clamp(s,2,4);
 cv.style.width=(W*s)+'px';cv.style.height=(H*s)+'px'}
function setupInput(){if(typeof addEventListener!=='function')return;
 const mp={ArrowUp:'u',KeyW:'u',ArrowDown:'d',KeyS:'d',ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r',KeyZ:'a',Space:'a',KeyX:'b',Backspace:'b',Enter:'st'};
 addEventListener('keydown',e=>{aInit();const k=mp[e.code];if(k){setKey(k,true);e.preventDefault()}});
 addEventListener('keyup',e=>{const k=mp[e.code];if(k){setKey(k,false);e.preventDefault()}})}
function setupTouch(){if(typeof document==='undefined'||!document.getElementById)return;
 const pads=document.getElementById('pads');if(!pads||!pads.querySelectorAll)return;
 pads.querySelectorAll('[data-k]').forEach(el=>{
  const k=el.getAttribute('data-k');
  const dn=e=>{e.preventDefault();aInit();setKey(k,true);el.classList.add('on')};
  const up=e=>{e.preventDefault();setKey(k,false);el.classList.remove('on')};
  el.addEventListener('pointerdown',dn);el.addEventListener('pointerup',up);
  el.addEventListener('pointercancel',up);el.addEventListener('pointerleave',up)})}
function boot(){buildTiles();
 if(typeof document!=='undefined'&&document.getElementById)cv=document.getElementById('cv');
 if(!cv)cv=document.createElement('canvas');
 cv.width=W;cv.height=H;ctx=cv.getContext('2d');
 if(ctx)ctx.imageSmoothingEnabled=false;
 setupInput();setupTouch();setupIO();resize();
 if(typeof addEventListener==='function')addEventListener('resize',resize);
 const issues=selfTest();
 if(issues.length&&typeof console!=='undefined')console.warn('FAUNWILD selftest:',issues);
 pushM(TitleMode());playSong('over');
 if(typeof requestAnimationFrame==='function')requestAnimationFrame(frameLoop)}
//------------------------------------------------------------ self test
function selfTest(){const errs=[];
 const tileChars='.gf-wTLFSrCDRBPWoxq#_kphenamdHYZuUi^v<>';
 for(const k in MAPS){const mp=MAPS[k],g=mp.g,w=g[0].length;
  for(let y=0;y<g.length;y++){if(g[y].length!==w)errs.push(k+' row '+y+' width '+g[y].length+' != '+w);
   for(const c of g[y])if(tileChars.indexOf(c)<0)errs.push(k+' unknown tile "'+c+'"')}
  const at=(x,y)=>(y<0||y>=g.length||x<0||x>=w)?'T':g[y][x];
  for(const wp of mp.warps){
   if(!MAPS[wp.m]){errs.push(k+' warp to missing map '+wp.m);continue}
   const tg=MAPS[wp.m].g;
   if(wp.ty>=tg.length||wp.tx>=tg[0].length){errs.push(k+' warp OOB to '+wp.m);continue}
   const c=tg[wp.ty][wp.tx];
   if(SOLID[c]||c==='H')errs.push(k+' warp lands on solid "'+c+'" in '+wp.m)}
  if(mp.edges)for(const dk in mp.edges)if(!MAPS[mp.edges[dk].m])errs.push(k+' edge to missing map');
  for(const n of mp.npcs){
   if(n.y>=g.length||n.x>=w){errs.push(k+' npc out of bounds');continue}
   if(SOLID[at(n.x,n.y)])errs.push(k+' npc standing on solid "'+at(n.x,n.y)+'" at '+n.x+','+n.y);
   if(n.tr){const team=n.tr.rival?rivalTeam(n.tr.rival):n.tr.team;
    for(const e of team)if(!SP[e[0]])errs.push(k+' trainer bad species '+e[0]);
    if(n.tr.win&&!SCRIPTS[n.tr.win])errs.push(k+' missing win script '+n.tr.win)}
   if(n.dscript&&!SCRIPTS[n.dscript])errs.push(k+' missing dscript '+n.dscript)}
  for(const it of mp.items){if(!IT[it.it])errs.push(k+' bad item '+it.it);
   if(SOLID[at(it.x,it.y)])errs.push(k+' item on solid')}
  for(const e of (mp.trig||[]).concat(mp.exam||[]))if(!SCRIPTS[e.s])errs.push(k+' missing script '+e.s);
  if(mp.enc)for(const ph of ['m','d','n'])for(const e of (mp.enc[ph]||[]))if(!SP[e[0]])errs.push(k+' enc bad species '+e[0])}
 for(let i=1;i<=DEXN;i++){const s=SP[i];
  const rows=s.px.split('|');
  if(rows.length!==16)errs.push(s.n+' px has '+rows.length+' rows');
  for(const r of rows){if(r.length!==8&&r.length!==16)errs.push(s.n+' px row len '+r.length);
   for(const c of r)if('.12345'.indexOf(c)<0)errs.push(s.n+' bad px char '+c)}
  for(const e of s.mv)if(!MV[e[1]])errs.push(s.n+' bad move '+e[1]);
  if(s.ev&&!SP[s.ev.to])errs.push(s.n+' bad evo target');
  if(s.ev&&s.ev.item&&!IT[s.ev.item])errs.push(s.n+' bad evo item')}
 for(const gk of ['gym1','gym2','gym3']){const mp=MAPS[gk],g=mp.g,w=g[0].length,h=g.length;
  const pass=c=>'_YZuUdi^v<>'.indexOf(c)>=0;
  const st0=mp.warps[0],L=mp.npcs[0];
  const seen=new Set([st0.x+','+st0.y]);const q=[[st0.x,st0.y]];let ok=false;
  while(q.length){const [x,y]=q.shift();
   if(Math.abs(x-L.x)+Math.abs(y-L.y)===1){ok=true;break}
   for(const dd of [[0,1],[0,-1],[1,0],[-1,0]]){const nx=x+dd[0],ny=y+dd[1];
    if(nx<0||ny<0||nx>=w||ny>=h)continue;
    const key=nx+','+ny;if(seen.has(key))continue;seen.add(key);
    if(pass(g[ny][nx]))q.push([nx,ny])}}
  if(!ok)errs.push(gk+' leader unreachable')}
 {const g=MAPS.cave.g;const pass=c=>c==='q'||c==='d';
  const seen=new Set(['1,8']);const q=[[1,8]];let ok=false;
  while(q.length){const [x,y]=q.shift();
   if(x===18&&y===7){ok=true;break}
   for(const dd of [[0,1],[0,-1],[1,0],[-1,0]]){const nx=x+dd[0],ny=y+dd[1];
    if(ny<0||ny>=g.length||nx<0||nx>=g[0].length)continue;
    const key=nx+','+ny;if(seen.has(key))continue;seen.add(key);
    if(pass(g[ny][nx]))q.push([nx,ny])}}
  if(!ok)errs.push('cave exits not connected')}
 return errs}
//------------------------------------------------------------ headless battle sim (for tests)
function simBattle(t,policy){policy=policy||{};const B=mkBattle(t);
 const gen=battleFlow(B);let val;
 for(let i=0;i<40000;i++){let r;
  try{r=gen.next(val)}catch(e){return 'ERR:'+(e&&e.stack||e)}
  val=undefined;
  if(r.done)return r.value;
  const tk=r.value||{};
  switch(tk.k){
   case 'do':val=tk.fn();break;
   case 'ask':val=(policy.ask!==undefined)?policy.ask:0;break;
   case 'push':
    if(tk.tag==='bmenu')val=policy.menu?policy.menu(B):0;
    else if(tk.tag==='bmove'){let mi=0;const m=G.party[B.pIdx];
     for(let j=0;j<m.mv.length;j++)if(m.mv[j].pp>0){mi=j;break}
     val=mi}
    else val=0;
    break;
   case 'party':{let pi=-1;
    for(let j=0;j<G.party.length;j++)if(G.party[j].hp>0&&j!==tk.cur){pi=j;break}
    val=pi;break}
   case 'bag':val=policy.bag?policy.bag(B):null;break;
   case 'forget':val=0;break;
   case 'name':val='TEST';break;
   default:break}}
 return 'TIMEOUT'}
//------------------------------------------------------------ debug handle & boot guard
const FW={boot,stepGame,drawFrame,newGame,startPlay,makeMon,maxHP,stat,simBattle,selfTest,
 SP,MV,IT,MAPS,SCRIPTS,OW,warpTo,enterMap,setKey,kp,pushM,remM,topM,MODES,EVOQ,doEvos,
 runScript,startScript,addItem,exportCode,importCode,loadSave,doSave,TitleMode,mkBattle,battleFlow,effMul,
 get G(){return G},set G(v){G=v},
 get INGAME(){return INGAME},set INGAME(v){INGAME=v}};
if(typeof window!=='undefined'){window.FW=FW;
 if(!window.__FAUNTEST&&typeof addEventListener==='function')addEventListener('load',()=>boot())}
