//------------------------------------------------------------ types & full effectiveness table
const TYPES=['BEAST','EMBER','TIDE','FLORA','VOLT','STONE','GALE','VENOM','MIND','SPIRIT','ALLOY','UMBRAL'];
const PHYS={BEAST:1,STONE:1,GALE:1,VENOM:1,ALLOY:1}; // physical types; others use SPIRIT stat (special)
/* CHART[attacker][defender] -> 2 (super), .5 (not very), 0 (no effect). Missing = 1.
   ALLOY and UMBRAL are the two "newly discovered" types of the Solvane region. */
const CHART={
BEAST:{SPIRIT:0,STONE:.5,ALLOY:.5},
EMBER:{FLORA:2,VENOM:2,ALLOY:2,EMBER:.5,TIDE:.5,STONE:.5},
TIDE:{EMBER:2,STONE:2,TIDE:.5,FLORA:.5},
FLORA:{TIDE:2,STONE:2,FLORA:.5,EMBER:.5,GALE:.5,VENOM:.5,ALLOY:.5},
VOLT:{TIDE:2,GALE:2,VOLT:.5,FLORA:.5,STONE:0},
STONE:{EMBER:2,VOLT:2,GALE:2,VENOM:2,FLORA:.5,ALLOY:.5},
GALE:{FLORA:2,VENOM:2,VOLT:.5,STONE:.5,ALLOY:.5},
VENOM:{FLORA:2,MIND:2,UMBRAL:2,STONE:.5,SPIRIT:.5,VENOM:.5,ALLOY:0},
MIND:{VENOM:2,MIND:.5,ALLOY:.5,UMBRAL:0},
SPIRIT:{SPIRIT:2,MIND:2,UMBRAL:.5,BEAST:0},
ALLOY:{STONE:2,EMBER:.5,TIDE:.5,VOLT:.5,ALLOY:.5},
UMBRAL:{MIND:2,SPIRIT:2,UMBRAL:.5,ALLOY:.5}};
const TYPECOL={BEAST:'#a8a090',EMBER:'#e87838',TIDE:'#5090d8',FLORA:'#58b048',VOLT:'#d8b020',STONE:'#b09858',GALE:'#88a8e0',VENOM:'#9858b0',MIND:'#e070a0',SPIRIT:'#7068b8',ALLOY:'#8aa3ad',UMBRAL:'#564a63'};
function effMul(t,defTypes){let m=1;for(const d of defTypes){const r=CHART[t]&&CHART[t][d];if(r!==undefined)m*=r}return m}

//------------------------------------------------------------ moves
const MV={
pounce:{n:'POUNCE',t:'BEAST',p:40,a:100,pp:35},
maul:{n:'MAUL',t:'BEAST',p:70,a:95,pp:20},
dashstrike:{n:'DASH STRIKE',t:'BEAST',p:40,a:100,pp:25,pr:1},
hyperram:{n:'HYPER RAM',t:'BEAST',p:85,a:90,pp:10},
cower:{n:'COWER',t:'BEAST',p:0,a:100,pp:30,stat:{s:'atk',d:-1,who:'foe'}},
rattle:{n:'RATTLE',t:'BEAST',p:0,a:100,pp:30,stat:{s:'def',d:-1,who:'foe'}},
brace:{n:'BRACE',t:'BEAST',p:0,a:0,pp:30,stat:{s:'def',d:1,who:'self'}},
singe:{n:'SINGE',t:'EMBER',p:40,a:100,pp:25,brn:10},
flamelash:{n:'FLAME LASH',t:'EMBER',p:65,a:100,pp:15,brn:10},
pyreburst:{n:'PYRE BURST',t:'EMBER',p:95,a:85,pp:8,brn:10},
splashjet:{n:'SPLASHJET',t:'TIDE',p:40,a:100,pp:25},
tidalwhip:{n:'TIDAL WHIP',t:'TIDE',p:65,a:100,pp:15},
geyser:{n:'GEYSER',t:'TIDE',p:95,a:85,pp:8},
mistveil:{n:'MIST VEIL',t:'TIDE',p:0,a:0,pp:20,stat:{s:'def',d:1,who:'self'}},
leafdart:{n:'LEAF DART',t:'FLORA',p:40,a:100,pp:30},
vinesnare:{n:'VINE SNARE',t:'FLORA',p:60,a:100,pp:20,stat:{s:'spe',d:-1,who:'foe',c:30}},
bloomblast:{n:'BLOOM BLAST',t:'FLORA',p:95,a:85,pp:8},
sapdrain:{n:'SAP DRAIN',t:'FLORA',p:40,a:100,pp:20,drain:1},
sporecloud:{n:'SPORE CLOUD',t:'FLORA',p:0,a:75,pp:10,st:'SLP'},
staticjolt:{n:'STATIC JOLT',t:'VOLT',p:40,a:100,pp:25,par:10},
voltlance:{n:'VOLT LANCE',t:'VOLT',p:70,a:100,pp:15,par:10},
stormcoil:{n:'STORM COIL',t:'VOLT',p:95,a:85,pp:8,par:10},
numbpulse:{n:'NUMB PULSE',t:'VOLT',p:0,a:90,pp:15,st:'PAR'},
pebbletoss:{n:'PEBBLE TOSS',t:'STONE',p:40,a:100,pp:30},
rockfall:{n:'ROCKFALL',t:'STONE',p:70,a:90,pp:12},
quakestomp:{n:'QUAKE STOMP',t:'STONE',p:85,a:95,pp:8},
stoneguard:{n:'STONEGUARD',t:'STONE',p:0,a:0,pp:15,stat:{s:'def',d:2,who:'self'}},
galeflick:{n:'GALEFLICK',t:'GALE',p:40,a:100,pp:30},
wingcutter:{n:'WING CUTTER',t:'GALE',p:62,a:100,pp:20,hc:1},
skydive:{n:'SKY DIVE',t:'GALE',p:88,a:90,pp:10},
slipstream:{n:'SLIPSTREAM',t:'GALE',p:0,a:0,pp:15,stat:{s:'spe',d:2,who:'self'}},
toxicnip:{n:'TOXIC NIP',t:'VENOM',p:40,a:100,pp:25,psn:20},
venombarb:{n:'VENOM BARB',t:'VENOM',p:65,a:100,pp:15,psn:20},
toxincloud:{n:'TOXIN CLOUD',t:'VENOM',p:0,a:90,pp:15,st:'PSN'},
webbind:{n:'WEB BIND',t:'VENOM',p:0,a:95,pp:15,stat:{s:'spe',d:-2,who:'foe'}},
mindjab:{n:'MIND JAB',t:'MIND',p:45,a:100,pp:25},
psysurge:{n:'PSY SURGE',t:'MIND',p:85,a:100,pp:10,stat:{s:'spc',d:-1,who:'foe',c:20}},
lullwave:{n:'LULL WAVE',t:'MIND',p:0,a:60,pp:10,st:'SLP'},
dazzleglare:{n:'DAZZLE GLARE',t:'MIND',p:0,a:100,pp:20,stat:{s:'acc',d:-1,who:'foe'}},
shadeswipe:{n:'SHADE SWIPE',t:'SPIRIT',p:45,a:100,pp:25},
phantomrend:{n:'PHANTOM REND',t:'SPIRIT',p:78,a:100,pp:10},
gravemist:{n:'GRAVE MIST',t:'SPIRIT',p:0,a:100,pp:20,stat:{s:'spc',d:-1,who:'foe'}},
alloyclaw:{n:'ALLOY CLAW',t:'ALLOY',p:50,a:100,pp:25},
forgeslam:{n:'FORGE SLAM',t:'ALLOY',p:82,a:90,pp:10},
temper:{n:'TEMPER',t:'ALLOY',p:0,a:0,pp:20,stat:{s:'atk',d:1,who:'self'}},
umbralfang:{n:'UMBRAL FANG',t:'UMBRAL',p:50,a:100,pp:25},
nightreaver:{n:'NIGHT REAVER',t:'UMBRAL',p:78,a:95,pp:10},
gloamveil:{n:'GLOAM VEIL',t:'UMBRAL',p:0,a:0,pp:15,stat:{s:'spc',d:1,who:'self'}},
struggle:{n:'STRUGGLE',t:'BEAST',p:50,a:100,pp:0,rec:1}};

//------------------------------------------------------------ items
const IT={
snare:{n:'SNARE',pr:200,k:'ball',m:1,d:'A coil device that snares wild Kin.'},
primesnare:{n:'PRIME SNARE',pr:600,k:'ball',m:1.5,d:'A fine snare. Grips 1.5x better.'},
apexsnare:{n:'APEX SNARE',pr:1200,k:'ball',m:2,d:'Top craft snare. Grips 2x better.'},
tonic:{n:'TONIC',pr:200,k:'heal',hp:20,d:'Restores 20 HP to one Kin.'},
supertonic:{n:'SUPER TONIC',pr:700,k:'heal',hp:60,d:'Restores 60 HP to one Kin.'},
remedy:{n:'REMEDY',pr:250,k:'cure',d:'Cures any status problem.'},
rekindle:{n:'REKINDLE',pr:1500,k:'rev',d:'Revives a fainted Kin to half HP.'},
juneberry:{n:'JUNEBERRY',pr:150,k:'held',d:'HELD: restores 12 HP when low.'},
bitterroot:{n:'BITTERROOT',pr:300,k:'held',d:'HELD: cures the first status problem.'},
powerband:{n:'POWER BAND',pr:900,k:'held',d:'HELD: boosts all damage 10%.'},
quickquill:{n:'QUICK QUILL',pr:800,k:'held',d:'HELD: raises SPEED 12%.'},
irontalisman:{n:'IRON TALISMAN',pr:800,k:'held',d:'HELD: raises DEFENSE 12%.'},
cinderfang:{n:'CINDER FANG',pr:800,k:'held',d:'HELD: EMBER moves +20%.'},
tidepearl:{n:'TIDE PEARL',pr:800,k:'held',d:'HELD: TIDE moves +20%.'},
leafcrest:{n:'LEAF CREST',pr:800,k:'held',d:'HELD: FLORA moves +20%.'},
stormcell:{n:'STORM CELL',pr:800,k:'held',d:'HELD: VOLT moves +20%.'},
coincharm:{n:'COIN CHARM',pr:1000,k:'held',d:'HELD: 1.5x prize money.'},
alloycore:{n:'ALLOY CORE',pr:2100,k:'evo',d:'Strange ore. Evolves certain Kin.'}};
const BAGORDER=['snare','primesnare','apexsnare','tonic','supertonic','remedy','rekindle','juneberry','bitterroot','powerband','quickquill','irontalisman','cinderfang','tidepearl','leafcrest','stormcell','coincharm','alloycore'];

