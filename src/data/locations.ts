/**
 * Chiltown — a fictional island metropolis modelled on Chicago and its
 * surroundings. The playable map is a single landmass ringed by water: the
 * dense city grid in the north-west, the Grand Lake to the east, the
 * Chiltown River cutting through the middle, and farmland, bluffs and pine
 * barrens in the south and across the north bridge.
 */
export const MAP_BOUNDS = { width: 11000, height: 7600 };

/**
 * Solid ground. Everything not covered by one of these rectangles is water (the
 * ocean, the Grand Lake and the Chiltown River), so the coastline only has to
 * be described once.
 */
export interface LandFeature {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Terrain family, drives the ground tint and the ambient detail pass. */
  kind: 'city' | 'highway' | 'farmland' | 'forest' | 'bluff' | 'sand' | 'island';
  color: string;
}

export const LAND_FEATURES: LandFeature[] = [
  // The city proper, ringed by the highway.
  { id: 'chiltown_city', name: 'Chiltown', x: 0, y: 0, width: 6000, height: 5600, kind: 'city', color: '#3a3a41' },
  { id: 'chiltown_highway', name: 'The Tri-State', x: 0, y: 5600, width: 6000, height: 260, kind: 'highway', color: '#2e2e34' },
  // The southern mainland: farmland, lakefront and bluffs.
  { id: 'south_mainland', name: 'The Southlands', x: 0, y: 5860, width: 6000, height: 1740, kind: 'farmland', color: '#38442c' },
  // The north island across the river, reached by the Chiltown Bridge.
  { id: 'north_island', name: 'North Shore Heights', x: 6300, y: 0, width: 2900, height: 1600, kind: 'island', color: '#33402c' },
  { id: 'north_connector', name: 'The Lake Woods', x: 6300, y: 1600, width: 900, height: 1600, kind: 'forest', color: '#2c3a26' },
  { id: 'north_bridge', name: 'Chiltown Bridge', x: 6000, y: 1600, width: 300, height: 1600, kind: 'highway', color: '#3a3a40' },
  { id: 'north_island_south', name: 'Grand Lake Airport', x: 6300, y: 3200, width: 4700, height: 1200, kind: 'island', color: '#39442f' },
  // The eastern island: steelworks and dunes.
  { id: 'east_island', name: 'The Steel Coast', x: 6300, y: 6000, width: 4700, height: 1600, kind: 'sand', color: '#3d4436' },
];

/** Named water bodies, drawn over the base ocean for a little depth variety. */
export interface WaterFeature {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export const WATER_FEATURES: WaterFeature[] = [
  { id: 'chiltown_river', name: 'Chiltown River', x: 6000, y: 0, width: 300, height: 7600, color: '#123a4a' },
  { id: 'grand_lake', name: 'The Grand Lake', x: 6300, y: 1600, width: 4700, height: 1600, color: '#0f3040' },
];

/** True when the point is over water rather than solid ground. */
export function isWater(x: number, y: number): boolean {
  for (const l of LAND_FEATURES) {
    if (x >= l.x && x <= l.x + l.width && y >= l.y && y <= l.y + l.height) return false;
  }
  return true;
}

/** The landmass a point sits on, if any. */
export function landAt(x: number, y: number): LandFeature | null {
  for (const l of LAND_FEATURES) {
    if (x >= l.x && x <= l.x + l.width && y >= l.y && y <= l.y + l.height) return l;
  }
  return null;
}

export const LOCATIONS = {
  // ---- Original city grid ---------------------------------------------------
  NEWCOMER_SPAWN: {
    id: 'newcomer_spawn',
    name: 'Newcomer Spawn',
    description: 'Where the player starts. Tutorial area. Basic signs explaining controls.',
    color: '#333333',
    bounds: { x: 0, y: 0, width: 800, height: 600 }
  },
  DISCORD_HUB: {
    id: 'discord_hub',
    name: 'The Discord Server',
    description: 'The central hub. Dark room with glowing channel portals.',
    color: '#1a1a1a',
    bounds: { x: 800, y: 0, width: 1200, height: 1000 }
  },
  NARROW_LIST_HQ: {
    id: 'narrow_list_hq',
    name: 'The Narrow List HQ',
    description: 'A hall of fame style room. Leaderboard on the wall.',
    color: '#2a2a2a',
    bounds: { x: 2000, y: 0, width: 800, height: 800 }
  },
  LEVEL_EDITOR: {
    id: 'level_editor',
    name: 'The Level Editor Zone',
    description: 'A chaotic creative space. Unfinished maps float around.',
    color: '#3d1a00',
    bounds: { x: 800, y: 1000, width: 1000, height: 800 }
  },
  SPEEDRUN_TRACK: {
    id: 'speedrun_track',
    name: 'The Speedrun Track',
    description: 'A clean minimalist area. Timer displays on the walls.',
    color: '#001a3d',
    bounds: { x: 1800, y: 1000, width: 1000, height: 800 }
  },
  POLISH_DISTRICT: {
    id: 'polish_district',
    name: 'The Polish District',
    description: 'A rough, aggressive-looking area. Red and white color scheme.',
    color: '#3d0000',
    bounds: { x: 0, y: 600, width: 800, height: 1200 }
  },
  FRENCH_CAFE: {
    id: 'french_cafe',
    name: 'The French Café',
    description: 'A small side area. Chill vibe but constant bickering.',
    color: '#1a1a2a',
    bounds: { x: 2800, y: 0, width: 600, height: 600 }
  },
  DEV_ROOM: {
    id: 'dev_room',
    name: "ESH's Shrine / Dev Room",
    description: 'A mysterious locked-looking area in the corner. Mostly dark.',
    color: '#050505',
    bounds: { x: 2800, y: 600, width: 600, height: 600 }
  },
  MEME_ARCHIVES: {
    id: 'meme_archives',
    name: 'The Meme Archives',
    description: 'A back-alley area full of interactable objects triggering memes.',
    color: '#1a2a1a',
    bounds: { x: 800, y: 1800, width: 1000, height: 600 }
  },
  DEAD_ZONE: {
    id: 'dead_zone',
    name: 'The Dead Zone',
    description: 'An abandoned area on the edge of the map. Empty buildings.',
    color: '#111111',
    bounds: { x: 1800, y: 1800, width: 1000, height: 600 }
  },
  THE_WILDS: {
    id: 'the_wilds',
    name: 'The Wilds',
    description: 'Overgrown outskirts past the city. Trees, ruins and winding dirt roads.',
    color: '#22301f',
    bounds: { x: 0, y: 2400, width: 6000, height: 700 }
  },
  THE_HIGHWAY: {
    id: 'the_highway',
    name: 'The Highway',
    description: 'A wide ring road on the city edge. Traffic runs both ways. Mind the cars.',
    color: '#2a2a2e',
    bounds: { x: 0, y: 3100, width: 6000, height: 320 }
  },
  SERVER_FARM: {
    id: 'server_farm',
    name: 'The Server Farm',
    description: 'A cold data centre. Rows of humming racks and blinking status lights.',
    color: '#16222c',
    bounds: { x: 3400, y: 0, width: 2600, height: 2000 }
  },
  DOCKS: {
    id: 'docks',
    name: 'The Docks',
    description: 'The southern waterfront. Cranes, containers and a salt-eaten pier.',
    color: '#1d2b33',
    bounds: { x: 3400, y: 2000, width: 2600, height: 1600 }
  },

  // ---- Chiltown proper ------------------------------------------------------
  CHILTOWN_LOOP: {
    id: 'chiltown_loop',
    name: 'The Loop',
    description: 'Downtown Chiltown. Skyscrapers, the elevated train and a giant mirrored bean.',
    color: '#2b2b33',
    bounds: { x: 0, y: 3600, width: 1600, height: 2000 }
  },
  GOLD_COAST: {
    id: 'gold_coast',
    name: 'The Gold Coast',
    description: 'Lakeshore money. Brownstones, a beach and a pier with a ferris wheel.',
    color: '#3a3020',
    bounds: { x: 1600, y: 3600, width: 1400, height: 2000 }
  },
  WRIGLEYVILLE: {
    id: 'wrigleyville',
    name: 'Bleacherville',
    description: 'Bars, hot dog stands and an old ballpark with ivy on the walls.',
    color: '#3a2020',
    bounds: { x: 3000, y: 3600, width: 1400, height: 2000 }
  },
  CHINATOWN: {
    id: 'chinatown',
    name: 'The River Ward',
    description: 'Lanterns, a pagoda gate and a riverwalk along the Chiltown River.',
    color: '#3a1a1a',
    bounds: { x: 4400, y: 3600, width: 1600, height: 2000 }
  },

  // ---- The Southlands -------------------------------------------------------
  FARMLAND: {
    id: 'farmland',
    name: 'The Corn Belt',
    description: 'Endless flat farmland. Silos, windmills and roads that go nowhere.',
    color: '#3a4a24',
    bounds: { x: 0, y: 5860, width: 2200, height: 1740 }
  },
  LAKEFRONT: {
    id: 'lakefront',
    name: 'South Lakefront',
    description: 'Sand, piers and a boardwalk strung with dead light bulbs.',
    color: '#3a4438',
    bounds: { x: 2200, y: 5860, width: 1800, height: 1740 }
  },
  BLUFF_COUNTY: {
    id: 'bluff_county',
    name: 'Bluff County',
    description: 'Rolling hills and pine woods. A lighthouse watches the water.',
    color: '#2c3a2a',
    bounds: { x: 4000, y: 5860, width: 2000, height: 1740 }
  },

  // ---- The north island -----------------------------------------------------
  NORTH_SHORE: {
    id: 'north_shore',
    name: 'North Shore Heights',
    description: 'Leafy and expensive. Apartments, a marina and too many joggers.',
    color: '#33402c',
    bounds: { x: 6300, y: 0, width: 2900, height: 1600 }
  },
  LAKE_WOODS: {
    id: 'lake_woods',
    name: 'The Lake Woods',
    description: 'Dense pine barrens on the narrow neck of the north island.',
    color: '#28361f',
    bounds: { x: 6300, y: 1600, width: 900, height: 1600 }
  },
  GRAND_LAKE_AIRPORT: {
    id: 'grand_lake_airport',
    name: 'Grand Lake Airport',
    description: 'Two runways, a control tower and a very relaxed approach to security.',
    color: '#33383d',
    bounds: { x: 6300, y: 3200, width: 2400, height: 1200 }
  },
  FREIGHT_YARDS: {
    id: 'freight_yards',
    name: 'The Freight Yards',
    description: 'Stacked containers and rail spurs. Perfectly quiet at night.',
    color: '#2f2c28',
    bounds: { x: 8700, y: 3200, width: 2300, height: 1200 }
  },

  // ---- The Steel Coast ------------------------------------------------------
  STEELWORKS: {
    id: 'steelworks',
    name: 'The Steelworks',
    description: 'Blast furnaces, cranes and the smell of hot metal.',
    color: '#3a2a24',
    bounds: { x: 6300, y: 6000, width: 2400, height: 1600 }
  },
  EAST_DUNES: {
    id: 'east_dunes',
    name: 'The East Dunes',
    description: 'Wind-blown sand dunes with the bones of old piers poking out.',
    color: '#403a2c',
    bounds: { x: 8700, y: 6000, width: 2300, height: 1600 }
  },
};

/** Colour used on the minimap for each location. */
export const LOCATION_MINIMAP_COLORS: Record<string, string> = {
  newcomer_spawn: '#666666',
  discord_hub: '#3a3a3a',
  narrow_list_hq: '#555555',
  level_editor: '#8a4a00',
  speedrun_track: '#00508a',
  polish_district: '#8a0000',
  french_cafe: '#3a3a6a',
  dev_room: '#1a1a1a',
  meme_archives: '#2a5a2a',
  dead_zone: '#222222',
  the_wilds: '#2f4a2a',
  the_highway: '#4a4a52',
  server_farm: '#2a4a5a',
  docks: '#3a5a6a',
  chiltown_loop: '#5a5a6a',
  gold_coast: '#8a6a2a',
  wrigleyville: '#8a3a3a',
  chinatown: '#7a2a2a',
  farmland: '#5a6a2a',
  lakefront: '#4a5a48',
  bluff_county: '#2f4a2a',
  north_shore: '#3f5a38',
  lake_woods: '#2a4a24',
  grand_lake_airport: '#4a4a4a',
  freight_yards: '#4a423a',
  steelworks: '#5a3a2a',
  east_dunes: '#6a5a3a',
};
