# FAUNWILD

**A community-built monster-keeping RPG in the spirit of the Game Boy Color era — shipped as a single HTML file.**

Explore the Solvane region, snare wild Kin, outsmart two gym leaders, chase a
night-walking legend, and stop the Gloam Syndicate. Everything — 30 original
creatures, pixel art, maps, chiptune music, the lot — is generated from code.
No assets. No dependencies. No engine. Just one `.html` file you can open
anywhere, and a codebase anyone can read top to bottom.

This is an open, community-driven game: **fork it, change it, break it, expand
it.** New Kin, new routes, new mechanics — all welcome via pull request.

## Play it

- **Online:** enable GitHub Pages for this repo (Settings → Pages → Source:
  *GitHub Actions*) and the included workflow publishes every push to `main`
  at `https://<your-user>.github.io/<repo>/`.
- **Locally:** `node build.js`, then open `dist/faunwild.html` in any browser.

### Controls

| Action | Keys | Touch |
|---|---|---|
| Move | Arrows / WASD | D-pad |
| A (confirm / interact) | Z or Space | A |
| B (cancel / run) | X | B |
| Start (menu) | Enter | START |

Save from the Start menu. **Options → Save Code** gives you a portable backup
string you can paste on any device.

## What's in the game

- 30 original Kin with hand-placed pixel sprites, a 12-type chart featuring two
  "newly discovered" types (**ALLOY** and **UMBRAL**), 49 moves, held items
- Classic battle math: STAB, crits, stat stages, burn/poison/paralysis/sleep,
  PP, switching, fleeing, and an AI that hunts for super-effective hits
- Catching with authentic shake checks; party of 6 plus a Vault box
- A real-time day/night cycle (1 real minute = 1 game hour) with tinted maps,
  time-based encounters, a night-only vendor, and a morning gift
- Friendship and item evolutions, a 1/64 **gleaming** rarity, and **NOCTELK** —
  a roaming legendary that only walks the three roads at night and flees mid-battle
- Two towns, three routes, a cave story event, and two gyms with puzzles
  (switch-gated hedges; an ice-slide floor)
- Saving via localStorage **and** exportable save codes

## Hacking on it

```
node build.js     # concatenates src/*.js into dist/faunwild.html
npm test          # builds, then runs the headless test suite (no browser needed)
```

The test suite simulates 100+ full battles, catching, evolution, saving, ledge
hops, gym puzzles, and the entire opening sequence — in Node, with a stubbed
DOM. It is the CI gate for every PR.

### Repo layout

```
src/00-core.js        helpers + the 5x7 pixel font
src/01-audio.js       WebAudio chiptune sequencer, songs, sound effects
src/02-typechart.js   the 12 types, full effectiveness table, moves, items
src/03-species.js     THE KINDEX — species stats, learnsets, sprites  <- most PRs land here
src/04-art.js         player/NPC sprites, palettes, procedural tiles
src/05-maps.js        every map: grids, warps, NPCs, trainers, encounters
src/06-engine.js      game state, saves, dialog/script system, mode stack
src/07-overworld.js   movement, encounters, trainer line-of-sight, field scripts
src/08-battle.js      the battle engine
src/09-ui.js          menus, Kindex, shop, vault, title screen, intro
src/10-boot.js        boot loop, selfTest data validator, headless battle sim
template.html         the page shell (CSS, touch controls, save-code overlay)
build.js              zero-dependency build: src/* -> one HTML file
test/test.js          headless test harness (run by CI)
```

## Contributing

Start with **[CONTRIBUTING.md](CONTRIBUTING.md)** — it has copy-paste recipes
for adding a Kin, a move, an item, a map, an NPC, or a whole mechanic, plus
the ground rules. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** explains how
the engine works (the generator-based script system, battle flow, formulas,
map schema, sprite format).

### Wanted: ideas the game is begging for

- **The AURELIA region** — the sealed gate north of Cindervale is the canonical
  hook for a community-built second region (new maps, gyms, Kin 31+)
- The classic stretch features: **daycare/breeding**, **fishing**, **phone
  rematches**
- More Kin (the Kindex auto-grows), more moves, more held items
- A third gym, trainer rematches, post-game content for the roamer
- More music tracks, town themes, better battle animations
- Balance passes, accessibility options, speedrun timer, anything you can dream up

### The Rules of the Wild

These keep the project what it is. PRs that break them won't merge:

1. **One file out.** The built game stays a single self-contained HTML file.
2. **Zero dependencies.** No npm packages, no CDNs, no asset files — all art
   and audio are generated in code.
3. **Original IP only.** No creatures, names, music, or art from existing
   franchises, and no thin renames of them.
4. **Saves keep working.** Append new ids (species, items, moves); never
   reorder or repurpose existing ones.
5. **Tests pass.** `npm test` is the law of the land.

## License

[MIT](LICENSE) — do whatever you like; just keep the notice.
