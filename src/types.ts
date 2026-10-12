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
  type: 'player' | 'npc' | 'object' | 'prop' | 'building';
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
