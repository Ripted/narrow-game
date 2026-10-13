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

### Deploying to GitHub Pages

GitHub Pages is set to the "GitHub Actions" source, so the site is published by
`.github/workflows/deploy.yml`, which builds the project and uploads `dist/` on
every push to `main`. `vite.config.ts` sets `base: '/narrow-game/'` because the
site is served from the `/narrow-game/` subpath. Nothing under `dist/` is
committed; pushing to `main` (or running the workflow manually) is enough to
redeploy.

## The GTA direction

The game is shifting toward a satirical open-world crime sandbox — "GTA in the
Narrow Arrow universe". The hard constraint is **no multiplayer**, ever. Single
player only.

### Mature content system

The mature layer is satirical and deliberately non-explicit. It pokes at the
genre's excesses rather than reproducing them.

- **Strong language** — dialogue is authored bleeped (`s**t`, `f***ing`). The
  `applyLanguageFilter` helper in `src/data/humor.ts` is applied to every
  dialogue line and option at render time. A pause-menu toggle un-bleeps it; the
  default is off. Nothing is ever authored un-bleeped.
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
- **Driving** — `App.tsx` runs a per-car model from `carSpec(car.carKind)`
  (`maxSpeed`, `accel`, `handling` in `src/world/cars.ts`): engine force plus
  rolling drag, steering that scales with speed and flips in reverse, and no
  turning while parked. The driver is drawn *inside* the car — `drawCarBody`
  then `drawDriverInCar` (clipped to the cabin, seated pose via the
  `driving` flag in `entitySprite.ts`) then a glazed `drawCarRoof`. A driven car
  is remembered in `WorldRuntime.drivenCarId` so its position survives a save.
- **Humour** — `GRAFFITI` and the raunchy dialogue trees (`bandit_main`,
  `mixologist_main`, `goose_main` in `src/data/characters.ts`) keep the tone
  satirical and in-world: rude NEET-humour aimed at the genre, never at real
  people.

### Content rules

1. Keep everything fictional. There are no real brands, drugs or products.
2. Prefer implication over depiction for sexual content.
3. Author strong language pre-bleeped; never ship an un-bleeped string.
4. Satire targets the genre, not real individuals.
5. Do not add multiplayer, and do not add a system that requires a server.

## Saves

`StateManager` (`src/game/state.ts`) owns three manual slots plus an autosave,
all in `localStorage` under `narrow_arrow_*`. A `GameState` carries a
`saveVersion`; `migrateSave` fills defaults for fields an older build omitted,
so never read a freshly loaded state without normalising it first.

Every save — manual or autosave — must include a `WorldSave` snapshot from
`world.save()` (clock, NPC positions, opened chests, thrown levers, gates,
killed enemies, weather, gore, wanted heat, and the driven car's position).
Skipping it makes a load silently reset the world. `player.equipped` and
`player.playtime` must also be written on save, otherwise loading reverts the
weapon and zeroes the clock.

Player preferences (strong language, radio, audio mute/volume) live in a
separate store, `SettingsStore` in `src/game/settings.ts`, under
`narrow_arrow_settings`, so clearing a save never resets them.

The pause menu exposes the slot manager (`SaveMenu`), achievements
(`AchievementsPanel`), and a "New Game" action that clears all slots.

## Boss fights

Bosses are data, not bespoke code. Add a `BossSpec` to `BOSSES` in
`src/game/story.ts` (npcId, name, maxHp, startFlag, defeatedFlag,
achievementId, optional rewardItem/rewardGold/resolvesArcs) and give the NPC a
dialogue tree whose fight node sets `startFlag`. `App.tsx` derives the active
boss from flags via `BOSS_BY_NPC`, so no per-boss branching is needed. Set
`resolvesArcs: true` only on the final boss; other bosses end their own fight
and leave the game running.

## Camera framing

`Camera.update` clamps its target to `MAP_WIDTH`/`MAP_HEIGHT` (from
`src/engine/collision.ts`). The player spawns near the map's top-left corner
(world 100,100 in a 5600x4000 map), so an unclamped camera centres on the
corner and fills most of the viewport with out-of-bounds void — which reads as
a blank first screen. Any new camera that centres on a target must clamp the
same way.
