# FAUNWILD architecture

One page of everything you need to hack the engine. The build is a straight
concatenation of `src/*.js` in filename order into `template.html`.

## Modules

| File | Owns |
|---|---|
| 00-core.js | helpers (`fl`, `ri`, `ch`, `wpick`), the 5x7 pixel font `GL` |
| 01-audio.js | WebAudio sequencer (`SONGS`, `playSong`, `musTick`), `sfx()`, jingles |
| 02-typechart.js | `TYPES`, `PHYS`, full `CHART`, `MV` moves, `IT` items |
| 03-species.js | `SP` (the Kindex), `STARTERS`, `RIVALPICK` |
| 04-art.js | `HERO`/`NPCSPR` pixmaps, `PALS`, procedural tiles (`buildTiles` → `TIL`), `SOLID` |
| 05-maps.js | `MAPS`, `DEXN` |
| 06-engine.js | game state `G`, mode stack, input, saves, dialog, the script/task system, mon math, sprite decode |
| 07-overworld.js | `OW` mode, NPC wander, trainer line-of-sight, warps/edges, encounters, `SCRIPTS` |
| 08-battle.js | `mkBattle`/`battleFlow`, damage/AI/status/catch/exp, battle menus |
| 09-ui.js | pause, party, bag, shop, vault, Kindex, options, name entry, evolution scene, title, intro |
| 10-boot.js | `boot()`, frame loop, `selfTest()`, `simBattle()`, the `FW` debug handle |

## The mode stack

Every screen is a mode: `{tr, u(), d()}` (`tr` = transparent). `MODES` is a
stack; each frame the loop calls `topM().u()` then draws from the topmost
*opaque* mode upward. Dialogs are transparent modes drawn over whatever is
beneath (overworld or battle). Fixed timestep: 60 updates/sec.

Input: `KEYS` (held), `kp(k)` consumes a press. Keys are `u d l r a b st`.

## The script system (how all cutscenes work)

Cutscenes, NPC chatter, shops, and the entire battle flow are **generator
functions** that `yield` plain task objects. `startScript(gen)` pumps the
generator; `execTask` runs each task (usually by pushing a UI mode) and
resumes the generator with the result. Synchronous tasks resume immediately.

| Task | Yields → returns |
|---|---|
| `say('a','b')` | dialog pages → `undefined` |
| `ask([txt],[opts],cancelIdx)` | choice → selected index |
| `wait(frames)` / `{k:'anim',f,d(frame)}` | timing / custom overlay draw |
| `doT(fn)` | runs `fn` synchronously → its return value |
| `sfxT(id)` / `{k:'song',n}` / `{k:'fade',dir}` | audio / transitions |
| `{k:'emote',n}` / `{k:'npcwalk',n}` | `!` bubble; NPC walks to the player |
| `{k:'battle', wild:mon}` or `{tr:{...}}` | full battle → `'win' 'loss' 'ran' 'fled' 'caught'` |
| `{k:'shop',stock,mode}` `{k:'vault'}` `{k:'party',pick:1}` `{k:'bag',battle:1}` | UI screens |
| `{k:'name'}` `{k:'forget',mon,mv}` `{k:'evo',mon,to}` | name entry / move forgetting / evolution scene |

## Overworld

Grid movement at 2px/frame. On arriving at a tile, `OW.arrive()` checks **in
order**: gym switch tiles → warps → ice/current (`i` / `^v<>`, keep sliding) → script triggers
→ wild encounter roll (`g` grass 14%, `q` cave floor 7%) → trainer
line-of-sight. Edges: walking off a map border with `edges:{N:{m,d}}` arrives
on the far row of map `m` at `coord + d`. Ledges (`L`) hop only southward.
Trainers with `sight:n` scan n tiles ahead each step; on contact: `!` emote,
walk-up, battle (`engage()`), with their defeat stored in flag `tr.f`.

### Tile legend

```
.  grass        g tall grass (encounters)   f flowers      - path
T  tree         w water                     L ledge (S)    F fence    S sign
r  boulder      C cave mouth (warp)         D door (warp)
R B P roofs     W wall   o window           x cave wall    q cave floor
#  inner wall   _ floor  k counter          p PC           h shelf
e  bed          a table  m rug              d exit mat (warp)
H  hedge        Y Z switch-gates            u U the switches that open them
i  ice (slide)  n statue                    ^ v < > live current (drift one way)
```

## Time

`G.time` is minutes; 1 real second = 1 game minute (so 1 real min = 1 game
hour, full day = 24 min). Phases: morning 04–10, day 10–20, night 20–04.
Outdoor maps multiply a tint. NPCs with `time:'m'|'d'|'n'` only exist in that
phase. The clock is settable in Options.

## Battle math

- Damage: `floor(floor(floor(2L/5+2)·P·A/D)/50)+2`, then ×2 crit (1/16 base,
  1/8 high-crit), ×1.5 STAB, ×type chart, ×held items, ×(217–255)/255.
- Physical types (`PHYS`): BEAST STONE GALE VENOM ALLOY use ATK/DEF; the rest
  use the shared SPIRIT stat — Gen-1 style.
- Stat stages ±6: multiplier `(2+s)/2` (or inverse). Accuracy uses `(3+s)/3`.
- Status: burn halves physical ATK + 1/8 chip; poison 1/8 chip; paralysis ¼
  speed + 25% skip; sleep 2–4 turns. EMBER can't be burned; ALLOY can't be poisoned.
- Catching: `a = ⌊(3M−2H)·rate·ball/(3M)⌋ × status (sleep 2×, else 1.5×)`,
  then four shake checks at `⌊255·(a/255)^¼⌋`.
- Run: `⌊spe·128/foeSpe⌋ + 30·attempts` vs `rand(256)`.
- Exp: medium-fast (`level³`), split among participants, ×1.5 vs trainers.
- AI: weighted pick by `power × effectiveness × STAB`, never picks immune
  moves, favors status early.
- The roamer (`G.roamer`) keeps hp/status between encounters, flees at the end
  of every round unless asleep, and relocates on map change. Night only.

## Saves

`localStorage['faunwild1'] = {v:1, g:G}`. Export codes are
`'FWN1.' + base64(JSON)`. `G` is plain JSON — keep it that way. Species,
moves, and items are stored **by id**, hence the append-only rule.

## Tests

`test/test.js` stubs `document`/canvas/`localStorage`, evals the built
`dist/game.js`, then: runs `selfTest()` (data validation incl. gym BFS
reachability), 100+ `simBattle` simulations, catch/evolution/save round-trips,
and drives the real UI modes headlessly through the whole opening sequence by
injecting key presses. `FW` (on `window`) exposes everything for testing and
console tinkering.
