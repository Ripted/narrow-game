import { GameState } from '../types';

export class StateManager {
  private static SAVE_KEY = 'narrow_arrow_save';

  static save(state: GameState) {
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(state));
  }

  static load(): GameState | null {
    const saved = localStorage.getItem(this.SAVE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load save', e);
      return null;
    }
  }

  static clear() {
    localStorage.removeItem(this.SAVE_KEY);
  }
}
