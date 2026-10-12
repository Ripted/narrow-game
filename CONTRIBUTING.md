# Contributing

Thanks for wanting to improve Narrow Arrow. This project is small and
data-driven, so most changes are quick.

## Getting set up

```bash
npm install
npm run dev
```

The dev server runs on <http://localhost:3000>.

## Before you open a pull request

Run the checks the CI runs:

```bash
npm run lint    # tsc --noEmit
npm run build   # type-check + production build
```

Both must pass.

## Code style

- TypeScript, React function components, two-space indentation.
- Keep engine code (`src/engine`) free of React imports; it should be usable
  from plain canvas code.
- Prefer small, focused modules over large files. If `App.tsx` grows, consider
  extracting a component or a hook.
- Comments should explain *why*, not restate *what* the code does.

## Adding content

The game is content-driven. Most additions only touch the `src/data` folder:

| To add... | Edit... |
| --- | --- |
| A character's look | `src/data/appearances.ts` |
| An NPC | `src/data/npcs.ts` |
| Dialogue | `src/data/characters.ts` (keyed by `dialogueId`) |
| An item | `src/data/items.ts` |
| A zone | `src/data/locations.ts` |
| A world prop, pickup, or secret | `src/world/objects.ts` |
| A quest or achievement | `src/game/story.ts` |

### Dialogue

Dialogue is a list of nodes. Each node has an `id`, some `text`, and optional
`options`. An option can set a `condition` so it only shows once the player has
the right flag:

```ts
{
  id: 'my_npc_1',
  text: 'Do you have the fragment?',
  options: [
    {
      text: 'Here it is.',
      nextNodeId: 'my_npc_2',
      condition: (state) => state.flags.fragments_collected === 3,
    },
  ],
}
```

Use `onComplete` on a node to set flags, which in turn drives quests,
achievements, and endings.

### Flags

Flags are the single source of truth for progression. Anything you want to
remember should be a flag in `state.flags`. Quests, achievements, and endings
are all derived from flags in `src/game/story.ts`, so add the flag there when
you introduce one.

## Pull request checklist

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] The change is playable in the browser.
- [ ] The README is updated if you added a feature or changed controls.
- [ ] `CHANGELOG.md` has an entry under "Unreleased".
