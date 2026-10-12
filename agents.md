# agents.md

Working notes for agents and contributors on **Narrow Arrow: The Game**.

## Project layout

- `src/App.tsx` — the whole game shell: React state, the requestAnimationFrame
  loop, HUD, dialogue, shop and pause overlays. Most gameplay wiring lives here.
- `src/game/` — runtime systems: `world.ts` (world state + step functions),
  `player.ts`, `story.ts` (quests/achievements), `state.ts` (save slots).
- `src/world/` — static world content: `roads.ts`, `props.ts`, `buildings.ts`,
  `interactives.ts`, `objects.ts`, `cars.ts`, `enemies.ts`, `weather.ts`.
- `src/data/` — plain data tables: locations, NPCs, items, dialogue, plus the
  mature-content tables (`mature.ts`, `substances.ts`, `humor.ts`, `crime.ts`).
- `src/engine/` — rendering and input primitives (renderer, camera, input,
  collision, colour helpers).

All art is procedural vector drawing — there are no image assets. Keep it that
way unless there is a strong reason not to.

## Build and verify

```bash
npx tsc --noEmit     # type check
npm run build        # tsc --noEmit && vite build
npm run dev          # dev server (default port 5173)
```

`npm run build` must pass with zero TypeScript errors before committing.

## The GTA direction

The game is shifting toward a satirical open-world crime sandbox — "GTA in the
Narrow Arrow universe". The hard constraint is **no multiplayer**, ever. Single
player only.

### Mature content system (17+)

The mature layer is opt-in, self-documenting and deliberately non-explicit. It
is satire aimed at the genre's excesses, not an attempt to reproduce them.

- **Rating gate** — `CONTENT_ADVISORY` in `src/data/mature.ts` drives the
  first-run advisory card in `App.tsx`. Accepting stores `ADVISORY_ACCEPT_KEY`
  in `localStorage`. The card lists every descriptor category
  (`MatureTag`: `violence`, `blood_gore`, `crime`, `humor`, `nudity`, `language`,
  `sexual_content`, `substances`, `alcohol`, `drugs`) and offers toggles for
  strong language and the in-world radio.
- **Strong language** — dialogue is authored bleeped (`s**t`, `f***ing`). The
  `applyLanguageFilter` helper in `src/data/humor.ts` is applied to every
  dialogue line and option at render time. It is a no-op while the toggle is
  off, which is the default. Nothing is ever authored un-bleeped.
- **Nudity / sexual content** — implied only. `statue_risque` is an abstract
  marble figure; the `bordello` interaction fades to black ("a tasteful,
  entirely implied amount of time") and awards a `feather_token`. No explicit
  depiction.
- **Blood and gore** — `GoreDecal`s live on `WorldRuntime.gore`, produced by
  `world.addGore(x, y, kind)` and rendered by `drawGore` in `src/world/enemies.ts`
  before the entities so decals sit on the ground. They persist through
  save/load.
- **Crime and wanted level** — `WorldRuntime.wanted` is a `WantedState`
  (`level`, `heat`, `cooldown`). `world.commitCrime(reason, heat)` adds heat and
  pushes a reason onto `world.crimeEvents`, which `App.tsx` drains into toasts.
  `stepWanted` promotes heat into star levels and decays them when out of sight;
  `stepPolice` spawns `police` enemies that chase an active wanted player. The
  HUD shows up to five stars.
- **Substances and alcohol** — all fictional. `src/data/substances.ts` holds
  `SubstanceSpec`s (duration, speed multiplier, camera wobble, screen tint,
  HP delta, tagline, come-down line). Items map to them via
  `SUBSTANCE_ITEM`; using one applies a timed `SubstanceEffect` on the player,
  tinting the screen and wobbling the camera until it burns off. Arrow Ale,
  Meme Dust and Server Nectar are invented in-universe brands.
- **Radio** — `RADIO_STATIONS` in `src/data/humor.ts` are DJ patter snippets
  cycled in the HUD ticker by `App.tsx`. Pure flavour, no audio assets.
- **Humour** — `GRAFFITI` and the raunchy dialogue trees (`bandit_main`,
  `mixologist_main`, `goose_main` in `src/data/characters.ts`) keep the tone
  satirical and in-world: rude NEET-humour aimed at the genre, never at real
  people.

### Content rules

1. Keep everything fictional. There are no real brands, drugs or products.
2. Prefer implication over depiction for sexual content.
3. Author strong language pre-bleeped; never ship an un-bleeped string.
4. Every explicit category must stay listed on the advisory card.
5. Satire targets the genre, not real individuals.
6. Do not add multiplayer, and do not add a system that requires a server.
