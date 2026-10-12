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
  type: 'player' | 'npc' | 'object';
  appearance?: Appearance;
}

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
