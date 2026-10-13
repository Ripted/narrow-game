import { Prop, PropKind } from '../types';
import { LOCATIONS } from '../data/locations';
import { NPCS } from '../data/npcs';
import { WORLD_OBJECTS } from './objects';
import { ROADS, onRoad } from './roads';
import { BUILDINGS } from './buildings';
import { isWaterPoint } from './terrain';
import { LANDMARK_PROPS } from './landmarks';

export { ROADS, onRoad } from './roads';
export const PROP_COLLISION_EXEMPT = true; // props are scenery only; never solid

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
    kinds: ['column', 'statue', 'statue_risque', 'crate', 'book', 'monitor', 'column'],
    colors: { column: '#b8b2a4', statue: '#cfc9b8', statue_risque: '#ddd6c8', crate: '#8a6a30', book: '#7a3a3a', monitor: '#4a90d0' },
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
    kinds: ['column', 'clock', 'neon', 'lamp', 'crate', 'beer_tap'],
    colors: { column: '#7aa8c8', clock: '#39d0e0', neon: '#39d0e0', lamp: '#ffd070', crate: '#3a5a70', beer_tap: '#c98a2a' },
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
  the_wilds: {
    accent: '#3a5a30',
    kinds: ['pine', 'tree', 'bush', 'grass', 'rock', 'flower', 'pine', 'tree', 'bush'],
    colors: { pine: '#2f5a30', tree: '#3a6a38', bush: '#4a6a3a', grass: '#5a7a44', rock: '#5a5a52', flower: '#e0c04a' },
    count: 46,
  },
  the_highway: {
    accent: '#6a6a70',
    kinds: ['lamp', 'fence', 'rock', 'fence', 'lamp', 'adboard'],
    colors: { lamp: '#ffd070', fence: '#5a5a60', rock: '#55555a', adboard: '#e08a2a' },
    count: 18,
  },
  server_farm: {
    accent: '#39d0d8',
    kinds: ['server', 'server', 'terminal', 'console', 'monitor', 'neon', 'server'],
    colors: { server: '#1e2a34', terminal: '#39d0d8', console: '#2ad0e0', monitor: '#4a90d0', neon: '#39d0d8' },
    count: 30,
  },
  docks: {
    accent: '#5a7a8a',
    kinds: ['crate', 'barrel', 'crate', 'fence', 'rock', 'crate', 'barrel', 'dumpster'],
    colors: { crate: '#4a5a64', barrel: '#6a4a3a', fence: '#4a5560', rock: '#4a4a4a', dumpster: '#3a4a3a' },
    count: 28,
  },

  // ---- Chiltown proper ------------------------------------------------------
  chiltown_loop: {
    accent: '#8a90a0',
    kinds: ['neon', 'lamp', 'dumpster', 'column', 'adboard', 'crate', 'lamp', 'neon', 'monitor'],
    colors: { neon: '#e04a9a', lamp: '#ffd070', dumpster: '#3a3f46', column: '#6a6f78', adboard: '#e08a2a', crate: '#4a4f56', monitor: '#4a90d0' },
    count: 34,
  },
  gold_coast: {
    accent: '#c9a86a',
    kinds: ['tree', 'lamp', 'bush', 'flower', 'crate', 'picnic', 'lamp', 'flower'],
    colors: { tree: '#4a7a4a', lamp: '#ffd070', bush: '#5a8a5a', flower: '#d88ad0', crate: '#7a5a3a', picnic: '#8a5a3a' },
    count: 26,
  },
  wrigleyville: {
    accent: '#c04a3a',
    kinds: ['adboard', 'lamp', 'crate', 'beer_tap', 'dumpster', 'lamp', 'book'],
    colors: { adboard: '#c04a3a', lamp: '#ffd070', crate: '#6a4a3a', beer_tap: '#c98a2a', dumpster: '#3a4a3a', book: '#8a6a3a' },
    count: 24,
  },
  chinatown: {
    accent: '#d04a3a',
    kinds: ['neon', 'lamp', 'flower', 'crate', 'bush', 'neon', 'crate'],
    colors: { neon: '#ff3a3a', lamp: '#ffb060', flower: '#e0a0b0', crate: '#6a4a3a', bush: '#4a7a4a' },
    count: 22,
  },

  // ---- The Southlands -------------------------------------------------------
  farmland: {
    accent: '#8a9a3a',
    kinds: ['haystack', 'silo', 'windmill', 'fence', 'grass', 'tree', 'haystack', 'fence'],
    colors: { haystack: '#c9a84a', silo: '#b0b0a8', windmill: '#c8c8c0', fence: '#6a5a44', grass: '#6a8a3a', tree: '#4a7a3a' },
    count: 44,
  },
  lakefront: {
    accent: '#c9b878',
    kinds: ['pier', 'buoy', 'lifeguard', 'driftwood', 'cattail', 'picnic', 'rock', 'pier'],
    colors: { pier: '#8a6a44', buoy: '#e04a3a', lifeguard: '#e8e8e8', driftwood: '#9a8a6a', cattail: '#5a7a44', picnic: '#c04a3a', rock: '#6a6a60' },
    count: 40,
  },
  bluff_county: {
    accent: '#3a5a30',
    kinds: ['pine', 'pine', 'tree', 'bush', 'rock', 'grass', 'pine', 'rock'],
    colors: { pine: '#2f5a30', tree: '#3a6a38', bush: '#4a6a3a', rock: '#5a5a52', grass: '#5a7a44' },
    count: 52,
  },

  // ---- The north island -----------------------------------------------------
  north_shore: {
    accent: '#7a9a6a',
    kinds: ['tree', 'tree', 'bush', 'flower', 'lamp', 'picnic', 'lamp', 'crate'],
    colors: { tree: '#4a7a4a', bush: '#5a8a5a', flower: '#e0c04a', lamp: '#ffd070', picnic: '#8a5a3a', crate: '#6a5a4a' },
    count: 34,
  },
  lake_woods: {
    accent: '#2f4a28',
    kinds: ['pine', 'pine', 'pine', 'tree', 'bush', 'rock', 'grass', 'pine'],
    colors: { pine: '#2a5230', tree: '#356034', bush: '#45663a', rock: '#55554c', grass: '#547040' },
    count: 56,
  },
  grand_lake_airport: {
    accent: '#8a9098',
    kinds: ['lamp', 'fence', 'adboard', 'crate', 'lamp', 'monitor', 'fence'],
    colors: { lamp: '#ffd070', fence: '#5a5a60', adboard: '#3a7ab0', crate: '#4a4f56', monitor: '#4a90d0' },
    count: 24,
  },
  freight_yards: {
    accent: '#6a6258',
    kinds: ['crate', 'crate', 'dumpster', 'fence', 'barrel', 'crate', 'rock'],
    colors: { crate: '#5a5248', dumpster: '#3a4a3a', fence: '#5a544c', barrel: '#6a4a3a', rock: '#4a4a4a' },
    count: 40,
  },

  // ---- The Steel Coast ------------------------------------------------------
  steelworks: {
    accent: '#b05a2a',
    kinds: ['barrel', 'crate', 'fence', 'dumpster', 'rock', 'barrel', 'crate'],
    colors: { barrel: '#a05a20', crate: '#5a4a3a', fence: '#5a544c', dumpster: '#3a3a34', rock: '#4a4a4a' },
    count: 42,
  },
  east_dunes: {
    accent: '#c9b878',
    kinds: ['rock', 'driftwood', 'grass', 'bush', 'rock', 'cattail', 'pier'],
    colors: { rock: '#7a6a52', driftwood: '#9a8a6a', grass: '#6a7a44', bush: '#5a6a3a', cattail: '#5a7a44', pier: '#8a6a44' },
    count: 46,
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
  adboard: [120, 70], statue_risque: [30, 54], dumpster: [54, 40], beer_tap: [26, 44],
  pier: [70, 26], buoy: [18, 24], lifeguard: [22, 34], driftwood: [40, 18], cattail: [14, 30],
  silo: [40, 66], windmill: [52, 78], haystack: [34, 26], picnic: [34, 24],
  bean: [140, 96], ferris: [160, 150], pagoda: [110, 90], pylon: [44, 130],
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

/** True when a point collides with a character, an object or a building. */
function blocked(cx: number, cy: number): boolean {
  if (Math.hypot(cx - 100, cy - 100) < 150) return true;
  for (const e of [...NPCS, ...WORLD_OBJECTS]) {
    const ex = e.pos.x + e.size.x / 2;
    const ey = e.pos.y + e.size.y / 2;
    if (Math.hypot(cx - ex, cy - ey) < 80) return true;
  }
  // Keep scenery out of building footprints and away from their facades.
  for (const b of BUILDINGS) {
    const bx = b.pos.x - 16;
    const by = b.pos.y - b.wallHeight - 20;
    const bw = b.size.x + 32;
    const bh = b.size.y + b.wallHeight + 40;
    if (cx > bx && cx < bx + bw && cy > by && cy < by + bh) return true;
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
      // never overhang a road or a character. Water is off-limits too.
      if (onRoad(cx, cy) || onRoad(cx, cy - h / 2)) continue;
      if (isWaterPoint(cx, cy) || isWaterPoint(cx, cy - h / 2)) continue;
      if (blocked(cx, cy) || blocked(cx, cy - h / 2)) continue;

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

export const PROPS: Prop[] = [...buildProps(), ...LANDMARK_PROPS];
