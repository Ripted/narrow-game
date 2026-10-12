import { Prop, PropKind } from '../types';
import { LOCATIONS } from '../data/locations';
import { NPCS } from '../data/npcs';
import { WORLD_OBJECTS } from './objects';

export const PROP_COLLISION_EXEMPT = true; // props are scenery only; never solid

/** A road segment drawn on top of the terrain, in world coordinates. */
export interface Road {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Path colour. */
  color: string;
}

/**
 * Roads form a rough grid along the seams between the themed zones, so the world
 * reads as connected instead of as a grid of unlinked rooms.
 */
export const ROADS: Road[] = [
  { x: 0, y: 960, w: 3400, h: 90, color: '#4a4438' },
  { x: 0, y: 1760, w: 3400, h: 90, color: '#4a4438' },
  { x: 760, y: 0, w: 90, h: 2400, color: '#443f34' },
  { x: 1970, y: 0, w: 90, h: 2400, color: '#443f34' },
  { x: 2760, y: 0, w: 90, h: 2400, color: '#443f34' },
];

interface ZoneTheme {
  kinds: PropKind[];
  /** Per-kind colour override; missing kinds fall back to the zone accent. */
  colors: Record<string, string>;
  accent: string;
  count: number;
}

/**
 * Each zone gets a palette and a prop vocabulary so biomes feel distinct:
 * forests and flowers in the spawn and café, neon and servers in the Discord
 * hub, marble columns in the hall of fame, crystals in the dev room, and cold
 * bones in the dead zone.
 */
const THEMES: Record<string, ZoneTheme> = {
  newcomer_spawn: {
    accent: '#3f7a3a',
    kinds: ['tree', 'bush', 'flower', 'grass', 'rock', 'flower', 'bush', 'grass'],
    colors: { tree: '#3f7a3a', bush: '#4a8a42', flower: '#e8d24a', grass: '#5a9a48', rock: '#6b6b6b' },
    count: 24,
  },
  polish_district: {
    accent: '#7a1f1f',
    kinds: ['rock', 'barrel', 'crate', 'fence', 'skull', 'rock', 'barrel'],
    colors: { rock: '#5a5a5c', barrel: '#8a2020', crate: '#7a2a2a', fence: '#6b4a3a', skull: '#e6e2d6' },
    count: 20,
  },
  discord_hub: {
    accent: '#39d0d8',
    kinds: ['neon', 'terminal', 'server', 'console', 'monitor', 'crate', 'portal', 'neon'],
    colors: { neon: '#39d0d8', terminal: '#39d0d8', server: '#2a3a44', console: '#c04ad0', monitor: '#4a90d0', crate: '#3a3f46', portal: '#7a5cff' },
    count: 26,
  },
  narrow_list_hq: {
    accent: '#d4af37',
    kinds: ['column', 'statue', 'crate', 'book', 'monitor', 'column'],
    colors: { column: '#b8b2a4', statue: '#cfc9b8', crate: '#8a6a30', book: '#7a3a3a', monitor: '#4a90d0' },
    count: 18,
  },
  level_editor: {
    accent: '#e08a2a',
    kinds: ['crate', 'rock', 'barrel', 'console', 'neon', 'book', 'crate'],
    colors: { crate: '#8a5a20', rock: '#6a5a48', barrel: '#a05a20', console: '#e08a2a', neon: '#ff9a3c', book: '#7a5a2a' },
    count: 22,
  },
  speedrun_track: {
    accent: '#39a0e0',
    kinds: ['column', 'clock', 'neon', 'lamp', 'crate'],
    colors: { column: '#7aa8c8', clock: '#39d0e0', neon: '#39d0e0', lamp: '#ffd070', crate: '#3a5a70' },
    count: 18,
  },
  french_cafe: {
    accent: '#8a7ac8',
    kinds: ['flower', 'bush', 'tree', 'crate', 'book', 'lamp', 'flower'],
    colors: { flower: '#d88ad0', bush: '#5a8a5a', tree: '#4a7a4a', crate: '#7a5a8a', book: '#8a6a3a', lamp: '#ffd070' },
    count: 16,
  },
  dev_room: {
    accent: '#c8c8ff',
    kinds: ['crystal', 'terminal', 'console', 'server', 'skull', 'column', 'crystal'],
    colors: { crystal: '#9a8aff', terminal: '#c8c8ff', console: '#6a5cff', server: '#20222c', skull: '#e6e2d6', column: '#8a8aa0' },
    count: 15,
  },
  meme_archives: {
    accent: '#7ac07a',
    kinds: ['crate', 'book', 'skull', 'barrel', 'neon', 'crate'],
    colors: { crate: '#5a6a3a', book: '#7a5a4a', skull: '#e6e2d6', barrel: '#6a7a4a', neon: '#7ac07a' },
    count: 18,
  },
  dead_zone: {
    accent: '#5a5a5a',
    kinds: ['bush', 'rock', 'skull', 'fence', 'column', 'crate', 'skull'],
    colors: { bush: '#4a4a3a', rock: '#4a4a4a', skull: '#c8c4b8', fence: '#4a3f34', column: '#5a5a5a', crate: '#4a4a4a' },
    count: 22,
  },
};

/** Nominal footprint per prop kind; a little jitter is added at build time. */
const SIZES: Record<PropKind, [number, number]> = {
  tree: [34, 46], pine: [30, 52], bush: [26, 20], flower: [12, 18], grass: [16, 13],
  rock: [26, 18], crate: [24, 24], barrel: [20, 26], lamp: [16, 44], fence: [36, 22],
  neon: [12, 50], terminal: [26, 30], server: [18, 46], console: [26, 26], portal: [46, 46],
  book: [20, 16], skull: [16, 16], statue: [28, 48], column: [26, 54], monitor: [28, 42],
  clock: [30, 30], board: [60, 80], banner: [200, 40], sign: [100, 60], shrine: [60, 60],
  baguette: [30, 10], plaque: [40, 40], crystal: [22, 30],
};

/** Deterministic PRNG (mulberry32) so the layout is identical every load. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** True when a point sits on any road, so props keep the paths clear. */
function onRoad(x: number, y: number): boolean {
  return ROADS.some((r) => x > r.x - 24 && x < r.x + r.w + 24 && y > r.y - 24 && y < r.y + r.h + 24);
}

function blocked(cx: number, cy: number): boolean {
  if (Math.hypot(cx - 100, cy - 100) < 150) return true;
  for (const e of [...NPCS, ...WORLD_OBJECTS]) {
    const ex = e.pos.x + e.size.x / 2;
    const ey = e.pos.y + e.size.y / 2;
    if (Math.hypot(cx - ex, cy - ey) < 80) return true;
  }
  return false;
}

function buildProps(): Prop[] {
  const props: Prop[] = [];
  for (const loc of Object.values(LOCATIONS)) {
    const theme = THEMES[loc.id];
    if (!theme) continue;
    const rnd = rng([...loc.id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7));
    const b = loc.bounds;
    let placed = 0;
    let attempts = 0;
    while (placed < theme.count && attempts < theme.count * 14) {
      attempts++;
      const kind = theme.kinds[Math.floor(rnd() * theme.kinds.length)];
      const size = SIZES[kind];
      const pad = 44;
      const cx = b.x + pad + rnd() * (b.width - pad * 2);
      const cy = b.y + pad + rnd() * (b.height - pad * 2);
      const w = size[0] * (0.85 + rnd() * 0.4);
      const h = size[1] * (0.85 + rnd() * 0.35);
      // Test both the prop's ground point and its visual centre, so tall props
      // never overhang a road or a character.
      if (onRoad(cx, cy) || onRoad(cx, cy - h / 2) || blocked(cx, cy) || blocked(cx, cy - h / 2)) continue;

      props.push({
        id: `prop_${loc.id}_${placed}`,
        name: kind,
        type: 'prop',
        propKind: kind,
        pos: { x: cx - w / 2, y: cy - h },
        size: { x: w, y: h },
        color: theme.colors[kind] || theme.accent,
      });
      placed++;
    }
  }
  return props;
}

export const PROPS: Prop[] = buildProps();
