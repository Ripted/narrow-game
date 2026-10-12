export const MAP_BOUNDS = { width: 5600, height: 4000 };

export const LOCATIONS = {
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
    bounds: { x: 0, y: 2400, width: 5600, height: 700 }
  },
  THE_HIGHWAY: {
    id: 'the_highway',
    name: 'The Highway',
    description: 'A wide ring road on the city edge. Traffic runs both ways. Mind the cars.',
    color: '#2a2a2e',
    bounds: { x: 0, y: 3100, width: 5600, height: 320 }
  },
  SERVER_FARM: {
    id: 'server_farm',
    name: 'The Server Farm',
    description: 'A cold data centre. Rows of humming racks and blinking status lights.',
    color: '#16222c',
    bounds: { x: 3400, y: 0, width: 2200, height: 2000 }
  },
  DOCKS: {
    id: 'docks',
    name: 'The Docks',
    description: 'The southern waterfront. Cranes, containers and a salt-eaten pier.',
    color: '#1d2b33',
    bounds: { x: 3400, y: 2000, width: 2200, height: 2000 }
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
};
