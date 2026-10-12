# Narrow Arrow: The Game

A top-down 2D browser game set in a Discord meme community. Explore ten zones,
talk to the locals, collect the update fragments, and uncover the mystery of
`arrow_ghost`.

Built with React, TypeScript and Vite. No backend, no external assets, no API
keys — it runs entirely in the browser.

## Contents

- [Quick start](#quick-start)
- [Controls](#controls)
- [Gameplay](#gameplay)
- [Zones](#zones)
- [Endings](#endings)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Development](#development)
- [Roadmap](#roadmap)

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL in a browser.

To build a production bundle:

```bash
npm run build
npm run preview
```

## Controls

| Key | Action |
| --- | --- |
| `W` `A` `S` `D` / arrow keys | Move |
| `E` | Interact, advance dialogue, or attack |
| `Q` | Toggle the quest log |
| `I` | Toggle the inventory |
| `ESC` | Pause menu (save, equip, mute, quit) |

Touch devices get an on-screen joystick and action buttons automatically.

## Gameplay

- **Explore** ten connected zones on a 3400 x 2400 map packed with hand-drawn
  characters. NPCs and scenery are solid, and the minimap tracks your position
  in real time.
- **Watch the cast move.** Every character is a procedurally drawn human with a
  limb-driven walk cycle, four facing directions, and a distinct look (skin,
  hair, clothing, build). Ghosts and shades render translucent with a glow.
- **Talk** to characters with a branching dialogue system. Some options only
  appear once you have learned something elsewhere. Dialogue portraits match
  the character you are talking to.
- **Collect** update fragments and other items, then **equip** weapons from the
  inventory (yes, the baguette is a weapon).
- **Fight** `arrow_ghost` on the Narrow List. Open with `E`, watch both health
  bars, and back off when yours drops.
- **Take on the speedrun challenge** by touching the first timer in the
  Speedrun Track and racing to the second.
- **Find secrets** scattered across the Meme Archives, Polish District and Dead
  Zone; each one unlocks an achievement toast.
- **Save** at any time from the pause menu, or rely on autosave, which fires
  every 30 seconds and on every zone change.

## Zones

| Zone | Vibe |
| --- | --- |
| Newcomer Spawn | Tutorial area with basic signs |
| The Discord Server | Central hub of glowing channels |
| The Narrow List HQ | Leaderboard hall of fame |
| The Level Editor Zone | Floating unfinished maps |
| The Speedrun Track | Minimalist, timer-lined |
| The Polish District | Red and white, aggressive |
| The French Café | Chill but bickering |
| ESH's Shrine / Dev Room | Dark and mostly locked |
| The Meme Archives | Back alley of interactables |
| The Dead Zone | Abandoned edge of the map |

## Endings

There are four endings. The two you are most likely to reach first are listed
plainly; the other two are hidden behind specific choices.

<details>
<summary>Spoilers</summary>

| Ending | How to reach it |
| --- | --- |
| A — The Game Lives | Collect all three update fragments and bring them to ESH. |
| B — Glorious Death | Let your health drop to zero during the fight. |
| C — Kiwi Wins | Visit the Dev Room first, then agree to help Kiwi take over. |
| D — Champy Was Arrow_Ghost | Read Kiwi's apology, then confront Champy about the alt account. |

</details>

## Project structure

```
src/
  App.tsx        Game loop, UI overlays, and state wiring
  audio.ts       Web Audio sound effects and per-zone ambience
  types.ts       Shared game types
  components/
    CharacterPreview.tsx  Animated preview used on the select screen
  engine/
    camera.ts      Viewport follow and world/screen transforms
    collision.ts   AABB collision, map clamping, location lookup
    entitySprite.ts  Humanoid sprites, walk cycle, and portraits
    input.ts       Keyboard and touch input with edge-triggered actions
    renderer.ts    Canvas drawing, culling, world rendering
  game/
    player.ts      Player movement and collision response
    state.ts       Save slots and autosave (localStorage)
    story.ts       Quests, achievements, and endings
  data/
    appearances.ts Character looks (skin, hair, clothing, build)
    characters.ts  Dialogue trees
    items.ts       Inventory item catalog
    locations.ts   Zone definitions and minimap colours
    npcs.ts        NPC roster
  world/
    objects.ts     Interactable world objects
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run `tsc --noEmit` |
| `npm run clean` | Remove the `dist` directory |

## Development

- **No API keys required.** The game is fully offline and generates all audio
  and art procedurally.
- **Saves** live in `localStorage` under `narrow_arrow_*` keys. Clear them from
  devtools or call `StateManager.clear()` to reset.
- **Behind a proxy?** Set `ALLOWED_HOSTS` (comma-separated) so Vite accepts the
  forwarded hostname:

  ```bash
  ALLOWED_HOSTS="example.com,foo.example.com" npm run dev
  ```

- **Adding content** is data-driven: new NPCs go in `data/npcs.ts`, dialogue in
  `data/characters.ts`, items in `data/items.ts`, and world props in
  `world/objects.ts`.

## Roadmap

Ideas that would fit the current systems:

- Sprite art in place of the procedural rectangles.
- Free-text NPC chat with a local model.
- Boss variety and a second combat encounter.
- A shot at online leaderboards for the speedrun challenge.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Changes are tracked in
[CHANGELOG.md](CHANGELOG.md).


