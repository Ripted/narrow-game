import { Building, BuildingKind } from '../types';
import { LOCATIONS } from '../data/locations';
import { NPCS } from '../data/npcs';
import { WORLD_OBJECTS } from './objects';
import { ROADS } from './roads';
import { overlapsWater } from './terrain';

interface Spec {
  kind: BuildingKind;
  wallHeight: number;
  wall: string;
  roof: string;
  count: number;
}

/** Per-zone building vocabulary, so every area has a distinct skyline. */
const ZONE_BUILDINGS: Record<string, Spec[]> = {
  newcomer_spawn: [
    { kind: 'house', wallHeight: 62, wall: '#c9a06a', roof: '#8a3a2a', count: 2 },
    { kind: 'hut', wallHeight: 34, wall: '#8a6a44', roof: '#5a4326', count: 1 },
  ],
  polish_district: [
    { kind: 'bunker', wallHeight: 30, wall: '#8a8f92', roof: '#5a5f62', count: 2 },
    { kind: 'warehouse', wallHeight: 58, wall: '#8f6a6a', roof: '#7a2020', count: 1 },
  ],
  discord_hub: [
    { kind: 'tower', wallHeight: 150, wall: '#2f3a44', roof: '#39d0d8', count: 2 },
    { kind: 'warehouse', wallHeight: 54, wall: '#3a4450', roof: '#4a90d0', count: 1 },
  ],
  narrow_list_hq: [
    { kind: 'hall', wallHeight: 96, wall: '#b8a878', roof: '#8a6a2a', count: 1 },
    { kind: 'tower', wallHeight: 120, wall: '#a89868', roof: '#d4af37', count: 1 },
  ],
  level_editor: [
    { kind: 'warehouse', wallHeight: 56, wall: '#8a6a3a', roof: '#c07a2a', count: 2 },
    { kind: 'hut', wallHeight: 34, wall: '#7a5a34', roof: '#5a4326', count: 1 },
  ],
  speedrun_track: [
    { kind: 'tower', wallHeight: 128, wall: '#3a5a70', roof: '#39d0e0', count: 1 },
    { kind: 'warehouse', wallHeight: 50, wall: '#4a6a80', roof: '#5a90b0', count: 1 },
  ],
  french_cafe: [
    { kind: 'cafe', wallHeight: 58, wall: '#c9b08a', roof: '#8a3a2a', count: 1 },
    { kind: 'house', wallHeight: 56, wall: '#b8a0c0', roof: '#5a4a6a', count: 1 },
  ],
  dev_room: [
    { kind: 'shrine', wallHeight: 46, wall: '#3a3548', roof: '#9a8aff', count: 1 },
    { kind: 'bunker', wallHeight: 28, wall: '#2f2f3a', roof: '#4a4a5a', count: 1 },
  ],
  meme_archives: [
    { kind: 'warehouse', wallHeight: 52, wall: '#5a6a4a', roof: '#7ac07a', count: 2 },
    { kind: 'hut', wallHeight: 32, wall: '#4a5a3a', roof: '#3a4a2a', count: 1 },
  ],
  dead_zone: [
    { kind: 'ruin', wallHeight: 44, wall: '#5a554c', roof: '#3a352c', count: 2 },
    { kind: 'bunker', wallHeight: 26, wall: '#4a4a4a', roof: '#3a3a3a', count: 1 },
  ],
  the_wilds: [
    { kind: 'ruin', wallHeight: 38, wall: '#4e4a3c', roof: '#33301f', count: 4 },
    { kind: 'hut', wallHeight: 30, wall: '#5a4a30', roof: '#3f3420', count: 2 },
  ],
  the_highway: [
    { kind: 'warehouse', wallHeight: 40, wall: '#4a4a52', roof: '#33333a', count: 1 },
    { kind: 'bunker', wallHeight: 24, wall: '#44444c', roof: '#303036', count: 1 },
  ],
  server_farm: [
    { kind: 'warehouse', wallHeight: 62, wall: '#28323c', roof: '#39d0d8', count: 3 },
    { kind: 'tower', wallHeight: 156, wall: '#22303a', roof: '#2ad0e0', count: 2 },
  ],
  docks: [
    { kind: 'warehouse', wallHeight: 56, wall: '#3a4a54', roof: '#5a7a8a', count: 3 },
    { kind: 'hut', wallHeight: 30, wall: '#43545e', roof: '#2f3d45', count: 2 },
    { kind: 'bunker', wallHeight: 26, wall: '#3d4a52', roof: '#2c363c', count: 1 },
  ],

  // ---- Chiltown proper ------------------------------------------------------
  chiltown_loop: [
    { kind: 'skyscraper', wallHeight: 210, wall: '#2f3540', roof: '#3a4450', count: 4 },
    { kind: 'apartment', wallHeight: 118, wall: '#454a52', roof: '#3a3f47', count: 4 },
    { kind: 'brownstone', wallHeight: 76, wall: '#6a4a3a', roof: '#4a2f26', count: 3 },
  ],
  gold_coast: [
    { kind: 'brownstone', wallHeight: 80, wall: '#7a5a44', roof: '#5a3a2e', count: 5 },
    { kind: 'apartment', wallHeight: 132, wall: '#5a5560', roof: '#45404a', count: 3 },
    { kind: 'cafe', wallHeight: 60, wall: '#c9b08a', roof: '#8a3a2a', count: 2 },
  ],
  wrigleyville: [
    { kind: 'stadium', wallHeight: 120, wall: '#4a5058', roof: '#3f4650', count: 1 },
    { kind: 'brownstone', wallHeight: 72, wall: '#6a3f34', roof: '#4a2a22', count: 4 },
    { kind: 'house', wallHeight: 60, wall: '#b08a5a', roof: '#7a2f22', count: 3 },
  ],
  chinatown: [
    { kind: 'apartment', wallHeight: 110, wall: '#5a3f3a', roof: '#3f2a26', count: 4 },
    { kind: 'warehouse', wallHeight: 54, wall: '#4a4038', roof: '#7a2a2a', count: 2 },
    { kind: 'cafe', wallHeight: 58, wall: '#a86a4a', roof: '#8a2020', count: 2 },
  ],

  // ---- The Southlands -------------------------------------------------------
  farmland: [
    { kind: 'hut', wallHeight: 34, wall: '#7a5a34', roof: '#4a3a20', count: 4 },
    { kind: 'warehouse', wallHeight: 50, wall: '#8a3a2a', roof: '#5a2a1e', count: 2 },
    { kind: 'house', wallHeight: 58, wall: '#c9a06a', roof: '#7a2f22', count: 2 },
  ],
  lakefront: [
    { kind: 'house', wallHeight: 56, wall: '#c0a878', roof: '#8a3a2a', count: 4 },
    { kind: 'cafe', wallHeight: 58, wall: '#b8a0c0', roof: '#5a4a6a', count: 2 },
    { kind: 'lighthouse', wallHeight: 96, wall: '#e0e0e0', roof: '#c23a3a', count: 1 },
  ],
  bluff_county: [
    { kind: 'hut', wallHeight: 32, wall: '#5a4a30', roof: '#3f3420', count: 4 },
    { kind: 'ruin', wallHeight: 40, wall: '#4e4a3c', roof: '#33301f', count: 3 },
  ],

  // ---- The north island -----------------------------------------------------
  north_shore: [
    { kind: 'apartment', wallHeight: 126, wall: '#4f5560', roof: '#3c424c', count: 4 },
    { kind: 'brownstone', wallHeight: 74, wall: '#6a4f3a', roof: '#4a3527', count: 4 },
    { kind: 'house', wallHeight: 58, wall: '#b8a878', roof: '#7a2f22', count: 3 },
  ],
  lake_woods: [
    { kind: 'ruin', wallHeight: 36, wall: '#4a4636', roof: '#2f2c1e', count: 4 },
    { kind: 'hut', wallHeight: 30, wall: '#5a4a30', roof: '#3f3420', count: 3 },
  ],
  grand_lake_airport: [
    { kind: 'tower', wallHeight: 140, wall: '#3a4450', roof: '#5a7a9a', count: 1 },
    { kind: 'warehouse', wallHeight: 58, wall: '#4a4f58', roof: '#6a6f78', count: 3 },
  ],
  freight_yards: [
    { kind: 'warehouse', wallHeight: 52, wall: '#45403a', roof: '#5a544c', count: 3 },
    { kind: 'bunker', wallHeight: 26, wall: '#3a3630', roof: '#2c2824', count: 3 },
  ],

  // ---- The Steel Coast ------------------------------------------------------
  steelworks: [
    { kind: 'factory', wallHeight: 120, wall: '#4a3a30', roof: '#5a4a3a', count: 3 },
    { kind: 'warehouse', wallHeight: 58, wall: '#4a4038', roof: '#6a5a4a', count: 3 },
  ],
  east_dunes: [
    { kind: 'ruin', wallHeight: 38, wall: '#6a5f48', roof: '#4a4232', count: 4 },
    { kind: 'hut', wallHeight: 30, wall: '#7a6a4a', roof: '#4a3f2a', count: 3 },
  ],
};

const FOOTPRINTS: Record<BuildingKind, [number, number]> = {
  house: [92, 70], cafe: [112, 80], tower: [64, 64], hall: [168, 112], bunker: [120, 92],
  warehouse: [152, 100], shrine: [74, 70], hut: [56, 50], ruin: [104, 82],
  skyscraper: [76, 76], brownstone: [70, 92], apartment: [104, 84], factory: [176, 120],
  stadium: [220, 150], lighthouse: [48, 48],
};

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

function overlaps(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number, gap = 0) {
  return ax < bx + bw + gap && ax + aw + gap > bx && ay < by + bh + gap && ay + ah + gap > by;
}

function valid(b: Building, all: Building[]): boolean {
  // Keep structures out of the river and the lake.
  if (overlapsWater(b.pos.x, b.pos.y, b.size.x, b.size.y)) return false;
  // Roads (with a little clearance).
  for (const r of ROADS) {
    if (overlaps(b.pos.x, b.pos.y, b.size.x, b.size.y, r.x, r.y, r.w, r.h, 6)) return false;
  }
  // Spawn point.
  const cx = b.pos.x + b.size.x / 2;
  const cy = b.pos.y + b.size.y / 2;
  if (Math.hypot(cx - 100, cy - 100) < 190) return false;
  // Characters and interactive objects.
  for (const e of [...NPCS, ...WORLD_OBJECTS]) {
    if (overlaps(b.pos.x, b.pos.y, b.size.x, b.size.y, e.pos.x, e.pos.y, e.size.x, e.size.y, 46)) return false;
  }
  // Other buildings.
  for (const o of all) {
    if (overlaps(b.pos.x, b.pos.y, b.size.x, b.size.y, o.pos.x, o.pos.y, o.size.x, o.size.y, 34)) return false;
  }
  return true;
}

function buildBuildings(): Building[] {
  const out: Building[] = [];
  for (const loc of Object.values(LOCATIONS)) {
    const specs = ZONE_BUILDINGS[loc.id];
    if (!specs) continue;
    const b = loc.bounds;
    const rnd = rng([...loc.id].reduce((h, ch) => (h * 131 + ch.charCodeAt(0)) >>> 0, 11));
    let n = 0;
    for (const spec of specs) {
      let placed = 0;
      let attempts = 0;
      while (placed < spec.count && attempts < 220) {
        attempts++;
        const [fw, fh] = FOOTPRINTS[spec.kind];
        const w = Math.round(fw * (0.9 + rnd() * 0.25));
        const h = Math.round(fh * (0.9 + rnd() * 0.25));
        const pad = 46;
        const x = b.x + pad + rnd() * Math.max(1, b.width - pad * 2 - w);
        const y = b.y + pad + rnd() * Math.max(1, b.height - pad * 2 - h);
        const cand: Building = {
          id: `building_${loc.id}_${n}`,
          name: spec.kind,
          type: 'building',
          buildingKind: spec.kind,
          pos: { x, y },
          size: { x: w, y: h },
          color: spec.wall,
          roofColor: spec.roof,
          wallHeight: spec.wallHeight,
          zone: loc.id,
        };
        if (!valid(cand, out)) continue;
        out.push(cand);
        placed++;
        n++;
      }
    }
  }
  return out;
}

export const BUILDINGS: Building[] = buildBuildings();
