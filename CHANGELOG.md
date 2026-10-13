# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Humanoid character sprites: every character is drawn with a head, hair in
  six styles, torso, articulated arms and legs, and shoes. Each has a distinct
  data-driven look (skin, hair colour, clothing, height, build).
- Four-directional facing and a limb-driven walk cycle that scales with
  movement speed; idle characters breathe subtly.
- Translucent, glowing sprites for spectral characters (ESH, Aqprox,
  `arrow_ghost`).
- Portrait art in the dialogue box now matches the speaker's world sprite.
- Animated character previews on the character-select screen.
- Quest log with active/completed tracking, completable from in-game flags.
- Inventory system with pickups, item descriptions, and equipable weapons.
- Combat encounter against `arrow_ghost`, with player and boss health bars.
- Minimap with live player and NPC markers, plus an HP/weapon HUD.
- Web Audio sound effects and a per-zone ambient drone.
- Three save slots plus autosave (every 30 seconds and on zone change).
- Ending screen showing playtime, fragments, achievements, and quests.
- Speedrun challenge on the Speedrun Track with lap and best times.
- Secrets and achievements, surfaced with toast notifications.
- Reachable endings C (Kiwi Wins) and D (Champy Was Arrow_Ghost).
- On-screen touch controls (joystick plus action buttons) for mobile.
- Dialogue portraits drawn procedurally from each character's colour.
- README, CONTRIBUTING, and this changelog.

### Changed

- Input actions are now edge-triggered, so holding `Q`/`I`/`ESC` no longer
  repeats the action every frame. Arrow keys also move the player.
- NPCs are solid and the player is clamped to the map bounds; the previous
  `clampToWorld` implementation was a no-op.
- The renderer now handles window resize and culls off-screen entities.
- The page has a real title and a favicon.

### Removed

- The AI Studio / Gemini integration (`@google/genai`, `GEMINI_API_KEY`).
- Unused dependencies: `lucide-react`, `motion`, `express`, `dotenv`.

### Fixed

- The game failed to start because the renderer was created before the canvas
  mounted, leaving the player stuck on the character-select screen.

## [0.2.0] - Save system hardening

### Added

- A save-slot manager in the pause menu: each slot shows the character, zone,
  playtime, gold and timestamp, with load, delete, and overwrite confirmation.
- Export/import of the current run as a JSON string, for backup or sharing.
- An achievements panel listing every achievement with locked/unlocked state,
  reachable from the pause menu and the ending screen.
- A second boss encounter, the Polar Shade, on the Speedrun Track. Talking to
  Polar can start the fight; winning drops the Heavy Wrench and 150 gold and
  unlocks "Speedrun Denied".
- A `saveVersion` field and a migration step, so saves written by older builds
  load with sensible defaults instead of breaking.
- A "New Game" action on the menu and pause screen that clears all slots.

### Fixed

- Manual saves now include the living-world snapshot (clock, NPCs, chests,
  gates, killed enemies, weather), matching autosave. Previously a manual load
  reset the world.
- The equipped weapon is persisted, so loading no longer reverts to the
  starting stick.
- Playtime is restored on load, so the ending screen shows the real total.
- The ending screen reports achievements out of the real total, not a hardcoded
  `/11`.
- Manual saves report a failure toast instead of silently doing nothing when
  browser storage is full.

### Changed

- Boss encounters are data-driven (`BOSSES` in `src/game/story.ts`), so adding
  another is a spec entry plus a dialogue tree.

## [0.0.0] - Initial

- Project scaffold: world, NPCs, dialogue, and renderer.
