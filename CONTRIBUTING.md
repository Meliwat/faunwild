# Contributing to FAUNWILD

Everything you need is Node 18+ and a text editor. No installs.

```
node build.js     # src/*.js  ->  dist/faunwild.html (open it in a browser)
npm test          # build + headless test suite (the same gate CI runs)
```

Workflow: fork → branch → edit files in `src/` → `npm test` → open a PR.
Small, focused PRs merge fastest. Screenshots or GIFs help a lot for anything visual.

---

## Recipe: add a new Kin

All species live in `src/03-species.js` in the `SP` array. **Append to the
end — never reorder or renumber** (saves store species by id). The Kindex
size grows automatically.

```js
{n:'EMBERMOLE',                       // display name, <= 10 chars
 t:['EMBER','STONE'],                 // 1-2 types from the 12 in src/02-typechart.js
 bs:{hp:55,at:70,df:80,sc:45,sp:38},  // base stats (~30 weak ... ~130 elite)
 cr:150,                              // catch rate: 255 trivial ... 5 legendary
 xy:95,                               // base exp yield (~40 early, ~220 legendary)
 ev:{l:24,to:31},                     // null, {l:LEVEL,to:ID}, {fr:160,to:ID}, or {item:'alloycore',to:ID}
 mv:[[1,'pebbletoss'],[1,'cower'],[9,'singe'],[15,'rockfall'],[22,'flamelash']],
 dex:'It naps inside chimneys. Sweeps fear its snore.',   // flavor, ~60 chars max
 pal:['#3a2418','#c05828','#e8a060','#f8e060'],            // colors for px chars 1-4 (5 allowed)
 px:'........|...11...|..1221..|...'}  // sprite, see below
```

**Sprite format (`px`):** 16 rows joined by `|`. An 8-character row is
mirrored to 16px wide (author the LEFT half); a 16-character row is used
as-is. `.` = transparent, `1`–`5` = palette index. The "gleaming" variant is
generated automatically by rotating the palette's color channels.

**Make it catchable:** add it to an encounter table in `src/05-maps.js` —
entries are `[speciesId, minLv, maxLv, weight]` under `enc:{m:[...],d:[...],n:[...]}`
(morning / day / night). A new Kin that appears *only* at one time of day is
very on-brand.

Run `npm test`: the data validator (`selfTest`) checks your sprite dimensions,
move references, evolution target, and encounter entries automatically.

## Recipe: add a move

`MV` in `src/02-typechart.js`:

```js
cinderspin:{n:'CINDER SPIN',t:'EMBER',p:55,a:95,pp:20,brn:20}
```

Fields: `p` power (0 = status move), `a` accuracy (0 = never misses), `pp`.
Effects: `pr:1` priority, `hc:1` high crit, `brn/psn/par:N` (% chance on hit),
`st:'SLP'|'PAR'|'PSN'` (pure status move), `drain:1`, `rec:1` (recoil),
`stat:{s:'atk|def|spc|spe|acc', d:±1|±2, who:'self'|'foe', c:CHANCE}`.
Then put it in some learnsets. New effect *kinds* are implemented in
`doMove()` in `src/08-battle.js` — add a test if you add one.

## Recipe: add an item

`IT` + `BAGORDER` in `src/02-typechart.js`. Kinds `ball`, `heal`, `cure`,
`rev`, `evo` work generically. Held-item behaviors hook into:
`heldDmg()` / `calcDmg()` / `effSpe()` (battle math), `endTurn()` (berries),
and the prize-money block in `handleFaints()` — all in `src/08-battle.js`.

## Recipe: add a map

`MAPS` in `src/05-maps.js`. Anatomy:

```js
mymap:{out:1, mus:'over',                 // outdoors (day/night tint) + music id
 edges:{N:{m:'route1',d:-1}},             // walking off the N edge: arrive in route1 at x+d
 g:[ 'TTT-TTT', ... ],                    // equal-width rows of tile chars (legend in docs/ARCHITECTURE.md)
 warps:[{x,y,m,tx,ty,dir}],               // step on (x,y) -> appear at (tx,ty) in map m
 npcs:[{x,y,pal:'kid',dir:'d',mv:1,d:['line 1','line 2']},          // wandering chatter
       {x,y,pal:'hiker',dir:'l',tr:{name,team:[[id,lv]],m:MONEY,    // a trainer with
        sight:4,f:'tr_flag',b:['before'],a:['after']}}],            // 4-tile line of sight
 trig:[{x,y,s:'scriptId',not:'flag'}],    // step-on cutscene triggers
 exam:[{x,y,s:'scriptId'}],               // press-A-on-tile scripts
 signs:{'3,7':'SIGN TEXT'},
 items:[{x,y,it:'tonic',q:1,f:'it_unique_flag'}],
 enc:{m:[[7,2,4,30]],d:[...],n:[...]}}    // or null for safe maps
```

`selfTest` validates row widths, tile chars, warp targets, NPC placement, and
(for gyms) BFS-reachability of the leader — so a typo fails CI, not a player.

## Recipe: NPCs, dialog, cutscenes

Scripts are generator functions in `SCRIPTS` (`src/07-overworld.js`) that
`yield` task objects: `say('...')`, `ask(['?'],['YES','NO'],1)`, `wait(30)`,
`doT(()=>{...})`, `sfxT('found')`, `{k:'fade',dir:'out'}`, `{k:'battle',tr:{...}}`,
`{k:'shop',stock:[...]}` and more — full task reference in
`docs/ARCHITECTURE.md`. Yield reads top-to-bottom like a screenplay.

---

## Testing

- `npm test` must pass. It builds the game and runs `test/test.js`: the data
  validator plus headless simulations of battles, catching, evolution, saving,
  ledges, gym puzzles, shops, and the full opening sequence.
- Battle/mechanic changes: add a sim using `FW.simBattle(cfg, policy)` —
  it runs whole battles in milliseconds with scripted choices.
- New maps/species/items usually need **no new tests**; `selfTest` covers them.

## Ground rules (the Rules of the Wild)

1. The built game stays **one self-contained HTML file**.
2. **Zero dependencies** — no packages, CDNs, or binary assets; art and audio
   are generated in code.
3. **Original IP only.** No creatures, names, music, or art from existing
   franchises — and no thin renames.
4. **Saves keep working.** Append ids; never reorder. If you must change the
   save format, bump the version and write a migration.
5. Keep it all-ages and keep the GBC-era feel: 160x144, chunky pixels, terse text.

Thanks for building Solvane with us!
