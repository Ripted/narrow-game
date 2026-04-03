export type Color = string;

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  name: string;
  pos: Vector2;
  size: Vector2;
  color: Color;
  type: 'player' | 'npc' | 'object';
}

export interface NPC extends Entity {
  dialogueId: string;
  homeLocation: string;
}

export interface WorldObject extends Entity {
  interactable: boolean;
  description?: string;
  dialogueId?: string;
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

export interface GameState {
  player: {
    name: string;
    characterType: string;
    pos: Vector2;
    inventory: string[];
  };
  flags: Record<string, boolean | number | string>;
  activeQuests: string[];
  currentLocation: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
}
