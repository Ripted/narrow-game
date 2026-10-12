# Narrow Arrow: The Game

A top-down 2D browser game set in a Discord meme community. Explore ten zones,
talk to the locals, collect the update fragments, and uncover the mystery of
`arrow_ghost`.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL in a browser.

## Controls

| Key | Action |
| --- | --- |
| `W A S D` / arrows | Move |
| `E` | Interact / attack |
| `Q` | Toggle quest log |
| `I` | Toggle inventory |
| `ESC` | Pause menu |

Touch devices get an on-screen joystick and action buttons automatically.

## Features

- **Ten explorable zones** with distinct colour themes and ambient audio.
- **Dialogue system** with branching choices and four reachable endings.
- **Quest log** tracking active and completed objectives.
- **Inventory** with equipable weapons (the baguette is a weapon, as intended).
- **Combat encounter** against `arrow_ghost` on the Narrow List.
- **Secrets and achievements** hidden across the map.
- **Speedrun challenge** on the Speedrun Track (start and finish the timers).
- **Save slots and autosave** via `localStorage`.
- **Minimap** with live player and NPC markers.

## Project structure

```
src/
  audio.ts              Web Audio SFX + per-zone ambience
  App.tsx               Game loop and UI
  engine/               renderer, input, camera, collision
  game/                 player, story progression, save state
  data/                 npcs, locations, dialogue, items
  world/                interactable objects
```

## Development notes

- `npm run lint` runs `tsc --noEmit`.
- When serving the dev server behind a proxy, set `ALLOWED_HOSTS`
  (comma-separated) so Vite accepts the forwarded hostname.

