export type Color = string;

export interface Vector2 {
  x: number;
  y: number;
}

export type HairStyle = 'short' | 'long' | 'bald' | 'ponytail' | 'spiky' | 'bun';

/** Everything needed to draw a character as a stylised human. */
export interface Appearance {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  shirt: string;
  pants: string;
  shoes: string;
  /** 0.85 (short) to 1.15 (tall). */
  height: number;
  /** 0.85 (slim) to 1.25 (broad). */
  build: number;
  /** Optional translucency, e.g. for the ghost. */
  opacity?: number;
  /** Optional colour glow drawn behind the character. */
  glow?: string;
}

export interface Entity {
  id: string;
  name: string;
  pos: Vector2;
  size: Vector2;
  color: Color;
  type: 'player' | 'npc' | 'object' | 'prop' | 'building' | 'car' | 'enemy';
  appearance?: Appearance;
  /** Selects the decorative vector art used for object/prop entities. */
  propKind?: PropKind;
}

/**
 * Visual style for a non-character entity. `crate` is a neutral fallback;
 * everything else has hand-tuned canvas art in the sprite system.
 */
export type PropKind =
  | 'tree'
  | 'pine'
  | 'bush'
  | 'flower'
  | 'rock'
  | 'grass'
  | 'crate'
  | 'barrel'
  | 'lamp'
  | 'fence'
  | 'neon'
  | 'terminal'
  | 'server'
  | 'console'
  | 'portal'
  | 'book'
  | 'skull'
  | 'statue'
  | 'column'
  | 'monitor'
  | 'clock'
  | 'board'
  | 'banner'
  | 'sign'
  | 'shrine'
  | 'baguette'
  | 'plaque'
  | 'crystal';

/** A purely decorative world entity; never interactive, never solid. */
export interface Prop extends Entity {
  type: 'prop';
  propKind: PropKind;
}

/**
 * A structure in the world. Buildings are solid (the player collides with their
 * footprint) and are drawn with a top-down roof plus a raised, extruded facade
 * so they read as three-dimensional.
 */
export type BuildingKind =
  | 'house'
  | 'cafe'
  | 'tower'
  | 'hall'
  | 'bunker'
  | 'warehouse'
  | 'shrine'
  | 'hut'
  | 'ruin';

export interface Building extends Entity {
  type: 'building';
  buildingKind: BuildingKind;
  /** Facade height in pixels, added above the footprint when drawn. */
  wallHeight: number;
  /** Roof/accent colour; `color` is the wall colour. */
  roofColor: string;
  /** Location id this building sits in. */
  zone: string;
}

/** Human-readable kind, used for interaction prompts and minimap tooltips. */
export const BUILDING_LABELS: Record<BuildingKind, string> = {
  house: 'House',
  cafe: 'Café',
  tower: 'Tower',
  hall: 'Hall',
  bunker: 'Bunker',
  warehouse: 'Warehouse',
  shrine: 'Shrine',
  hut: 'Hut',
  ruin: 'Ruin',
};

export interface NPC extends Entity {
  dialogueId: string;
  homeLocation: string;
  portrait?: string;
  hp?: number;
  boss?: boolean;
  /** Optional named route the NPC walks during the day. */
  scheduleId?: string;
  /** Building id this NPC retreats into at night (hidden from the exterior). */
  nightBuildingId?: string;
}

/** A single waypoint on a schedule route, in world coordinates. */
export interface ScheduleWaypoint {
  x: number;
  y: number;
  /** Seconds to linger once the waypoint is reached. */
  wait?: number;
}

export interface Schedule {
  id: string;
  waypoints: ScheduleWaypoint[];
  /** Movement speed in px/s while travelling between waypoints. */
  speed: number;
}

export type InteractiveKind = 'chest' | 'sign' | 'lever' | 'campfire' | 'merchant';

/**
 * A hand-placed interactive fixture. Unlike props these can be used: chests
 * yield loot, signs are readable, levers open named gates and campfires heal.
 */
export interface Interactive extends Entity {
  type: 'object';
  interactiveKind: InteractiveKind;
  /** Gate opened by a lever (levers only). */
  gateId?: string;
  /** Loot granted once by a chest. */
  itemId?: string;
  gold?: number;
  /** Readable text for signs. */
  text?: string;
  /** Flavour text shown on use. */
  description?: string;
  /** Whether the fixture has already been used (chest opened, lever pulled). */
  used?: boolean;
  /** Stock sold by a merchant fixture, in item-id order. */
  stock?: ShopEntry[];
}

/** One line of a merchant's stock. */
export interface ShopEntry {
  itemId: string;
  price: number;
  /** Max times it can be bought; undefined means unlimited. */
  limit?: number;
}

/**
 * A solid barrier that blocks passage until its linked lever is pulled (or its
 * `openFlag` is set).
 */
export interface Gate extends Entity {
  type: 'object';
  /** Lever flag that opens this gate. */
  openFlag: string;
  open: boolean;
}

/** A door on a building that leads into an interior room. */
export interface Door {
  buildingId: string;
  interiorId: string;
  /** World-space point the player stands on to enter. */
  x: number;
  y: number;
}

/** A walkable room behind a building's door, generated in local coordinates. */
export interface Interior {
  id: string;
  name: string;
  /** Which building generated it. */
  buildingId: string;
  buildingKind: BuildingKind;
  width: number;
  height: number;
  /** Where the player appears on entry. */
  spawn: Vector2;
  /** The step-off tile back to the exterior. */
  exit: Vector2;
  /** Solid furniture blocks, in local coordinates. */
  furnitures: { x: number; y: number; w: number; h: number; color: string; kind: string }[];
  /** Ambient floor tint. */
  floor: string;
  wall: string;
  /** NPC ids present inside (at night, a home owner). */
  occupants: string[];
}

export interface QuestMarker {
  questId: string;
  locationId: string;
  x: number;
  y: number;
  label: string;
}

export type CarKind = 'sedan' | 'hatch' | 'van' | 'taxi' | 'truck';

/** A vehicle. Parked cars are solid scenery; ambient cars follow a route. */
export interface Car extends Entity {
  type: 'car';
  carKind: CarKind;
  /** Angle in radians, 0 = facing right (+x). */
  angle: number;
  /** Current speed in px/s when moving. */
  speed: number;
  /** Named traffic route this car loops along, if any. */
  routeId?: string;
  /** Progress along the route, in px. */
  routeDist?: number;
}

/** A named traffic circuit; the runtime wraps cars around it. */
export interface TrafficRoute {
  id: string;
  /** Waypoints in world coordinates; the last connects back to the first. */
  points: Vector2[];
  speed: number;
  /** How many cars run this route. */
  count: number;
  interval: number;
}

export type EnemyKind = 'stalker' | 'brute' | 'drone';

/** A hostile wanderer that chases and hits the player on contact. */
export interface Enemy extends Entity {
  type: 'enemy';
  enemyKind: EnemyKind;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  /** Home point the enemy leashes back to when the player escapes. */
  home: Vector2;
  /** Seconds until it can hit again. */
  cooldown?: number;
}

export type WeatherKind = 'clear' | 'rain' | 'snow';

export interface WorldSave {
  clock: number;
  npcPos: Record<string, Vector2>;
  openedChestIds: string[];
  usedLeverIds: string[];
  openGateFlags: string[];
  killedEnemyIds: string[];
  weather: WeatherKind;
}

export interface WorldObject extends Entity {
  interactable: boolean;
  description?: string;
  dialogueId?: string;
  /** Item picked up on interaction and added to the inventory. */
  itemId?: string;
  /** Marks a hidden secret that unlocks an achievement when found. */
  secretId?: string;
}

export interface DialogueNode {
  id: string;
  text: string;
  options?: DialogueOption[];
  onComplete?: (state: GameState) => void;
}

export interface DialogueOption {
  text: string;
  nextNodeId: string;
  condition?: (state: GameState) => boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
}

export interface GameState {
  player: {
    name: string;
    characterType: string;
    pos: Vector2;
    inventory: string[];
    hp: number;
    maxHp: number;
    gold: number;
    /** Milliseconds of active play time. */
    playtime: number;
  };
  flags: Record<string, any>;
  activeQuests: string[];
  completedQuests: string[];
  unlockedAchievements: string[];
  currentLocation: string;
  /** Snapshot of the mutable living-world state (clock, NPCs, chests, gates). */
  worldSave?: WorldSave;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  color: string;
  /** When true the item can be used as a weapon during combat. */
  weapon?: boolean;
  damage?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
}
