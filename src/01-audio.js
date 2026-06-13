//------------------------------------------------------------ audio
let actx=null;
const AUD={song:null,step:0,next:0,hold:0};
function aInit(){try{const AC=(typeof window!=='undefined')&&(window.AudioContext||window.webkitAudioContext);
 if(!actx&&AC)actx=new AC();
 if(actx&&actx.state==='suspended')actx.resume()}catch(e){actx=actx||null}}
function tone(f,t0,dur,type,vol,slide){if(!actx)return;try{const o=actx.createOscillator(),g=actx.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t0);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),t0+dur);g.gain.setValueAtTime(vol||.03,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);o.connect(g);g.connect(actx.destination);o.start(t0);o.stop(t0+dur+.02)}catch(e){}}
const midi=m=>440*Math.pow(2,(m-69)/12);
const SONGS={
over:{spd:7,lead:[72,0,76,79,76,0,72,0,74,0,77,81,77,0,74,0,76,79,84,79,81,0,77,76,74,0,71,74,72,0,0,0],
      bass:[48,0,55,0,52,0,55,0,50,0,57,0,53,0,57,0,48,0,55,0,53,0,57,0,43,0,50,0,48,0,48,0]},
battle:{spd:9,lead:[69,69,0,69,72,0,69,0,67,67,0,67,71,0,67,0,69,69,0,69,72,74,76,0,77,76,74,72,71,69,68,69],
      bass:[45,45,45,45,43,43,43,43,45,45,45,45,40,40,44,44]},
cave:{spd:4,lead:[64,0,0,0,67,0,63,0,65,0,0,0,60,0,62,0],bass:[40,0,0,0,0,0,0,0,38,0,0,0,0,0,0,0]},
gym:{spd:8,lead:[69,0,76,0,72,0,69,0,71,0,74,0,77,0,74,0,72,0,79,0,76,0,72,0,74,72,71,69,67,69,0,0],
      bass:[45,0,45,0,40,0,40,0,43,0,43,0,38,0,40,0]},
gymbattle:{spd:10,lead:[81,81,0,81,79,0,76,0,77,77,0,77,76,0,72,0,74,76,77,79,81,79,77,76,74,72,71,72,74,76,0,0],
      bass:[45,45,52,52,40,40,47,47,43,43,50,50,41,41,43,43]}};
function playSong(id){AUD.song=id;AUD.step=0;if(actx)AUD.next=actx.currentTime+.06}
function stopSong(){AUD.song=null}
function musTick(){if(!actx||!G||!G.opts.mus||!AUD.song)return;if(actx.currentTime<AUD.hold)return;const s=SONGS[AUD.song];if(!s)return;
 while(AUD.next<actx.currentTime+.14){const i=AUD.step%s.lead.length,L=s.lead[i],B=s.bass[i%s.bass.length],dt=1/s.spd;
  if(L)tone(midi(L),AUD.next,dt*.85,'square',.022);if(B)tone(midi(B),AUD.next,dt*.95,'triangle',.045);AUD.step++;AUD.next+=dt}}
function jin(notes,spd,type){if(!actx||!G||!G.opts.sfx)return;let t=actx.currentTime+.02;const dt=1/(spd||8);
 for(const n of notes){if(n)tone(midi(n),t,dt*.9,type||'square',.04);t+=dt}AUD.hold=t+.1;if(AUD.song)AUD.next=Math.max(AUD.next,t+.1)}
function sfx(n){if(!G||!G.opts.sfx||!actx)return;const t=actx.currentTime;switch(n){
 case 'blip':tone(900,t,.03,'square',.02);break;
 case 'conf':tone(1100,t,.05,'square',.03);break;
 case 'deny':tone(140,t,.09,'square',.035);break;
 case 'bump':tone(95,t,.06,'square',.03);break;
 case 'hit':tone(300,t,.1,'sawtooth',.05,90);break;
 case 'hit2':tone(520,t,.12,'sawtooth',.06,70);break;
 case 'faint':tone(420,t,.45,'square',.05,60);break;
 case 'throw':tone(520,t,.12,'square',.03,1200);break;
 case 'shake':tone(240,t,.06,'square',.04);break;
 case 'click':tone(1500,t,.05,'square',.05);break;
 case 'run':tone(800,t,.18,'square',.03,200);break;
 case 'beep':tone(1040,t,.05,'square',.035);break;
 case 'hop':tone(330,t,.09,'square',.03,660);break;
 case 'heal':jin([76,79,84],10);break;
 case 'lvl':jin([72,76,79,84],11);break;
 case 'catch':jin([72,72,76,79,84,0,84],10);break;
 case 'badge':jin([72,76,79,84,79,84,88],9);break;
 case 'evo':jin([60,64,67,72,76,79,84,88],12);break;
 case 'found':jin([84,88],12);break;
 case 'victory':jin([79,79,79,84,0,79,84,88],9);break;
}}

