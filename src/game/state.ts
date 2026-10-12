import { GameState } from '../types';

export interface SaveSlot {
  index: number;
  label: string;
  savedAt: number;
  state: GameState;
}

const SLOT_KEY = (i: number) => `narrow_arrow_slot_${i}`;
const AUTO_KEY = 'narrow_arrow_autosave';
const LEGACY_KEY = 'narrow_arrow_save';

export const SLOT_COUNT = 3;

export class StateManager {
  static saveSlot(index: number, state: GameState) {
    localStorage.setItem(SLOT_KEY(index), JSON.stringify(state));
  }

  static loadSlot(index: number): GameState | null {
    const raw = localStorage.getItem(SLOT_KEY(index));
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static clearSlot(index: number) {
    localStorage.removeItem(SLOT_KEY(index));
  }

  static autosave(state: GameState) {
    try {
      localStorage.setItem(AUTO_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors; autosave is best-effort.
    }
  }

  static loadAutosave(): GameState | null {
    const raw = localStorage.getItem(AUTO_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static hasAnySave(): boolean {
    if (this.loadAutosave()) return true;
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (this.loadSlot(i)) return true;
    }
    // Legacy single-slot save from earlier builds.
    return localStorage.getItem(LEGACY_KEY) !== null;
  }

  static slots(): SaveSlot[] {
    const slots: SaveSlot[] = [];
    for (let i = 0; i < SLOT_COUNT; i++) {
      const state = this.loadSlot(i);
      slots.push({
        index: i,
        label: state ? `${state.player.name} · ${state.currentLocation}` : 'Empty',
        savedAt: state ? Date.now() : 0,
        state: state as GameState,
      });
    }
    return slots;
  }

  static clear() {
    for (let i = 0; i < SLOT_COUNT; i++) this.clearSlot(i);
    localStorage.removeItem(AUTO_KEY);
    localStorage.removeItem(LEGACY_KEY);
  }
}
