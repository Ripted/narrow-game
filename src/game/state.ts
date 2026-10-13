import { GameState } from '../types';

export interface SaveSlot {
  index: number;
  label: string;
  /** Wall-clock time the slot was written, or 0 when empty. */
  savedAt: number;
  /** Milliseconds of play time recorded in the slot. */
  playtime: number;
  /** Gold recorded in the slot, for the summary line. */
  gold: number;
  state: GameState | null;
}

const SLOT_KEY = (i: number) => `narrow_arrow_slot_${i}`;
const AUTO_KEY = 'narrow_arrow_autosave';
const LEGACY_KEY = 'narrow_arrow_save';

export const SLOT_COUNT = 3;

/** Current save-format version. Bump when the persisted shape changes. */
export const SAVE_VERSION = 2;

/**
 * Brings a save written by an older build up to the current shape. Missing
 * fields are filled with sensible defaults so a stale save still loads.
 */
export function migrateSave(raw: any): GameState | null {
  if (!raw || typeof raw !== 'object' || !raw.player) return null;
  const player = raw.player || {};
  return {
    ...raw,
    saveVersion: SAVE_VERSION,
    savedAt: typeof raw.savedAt === 'number' ? raw.savedAt : Date.now(),
    player: {
      ...player,
      inventory: Array.isArray(player.inventory) ? player.inventory : [],
      equipped: typeof player.equipped === 'string' ? player.equipped : '',
      hp: typeof player.hp === 'number' ? player.hp : 100,
      maxHp: typeof player.maxHp === 'number' ? player.maxHp : 100,
      gold: typeof player.gold === 'number' ? player.gold : 0,
      playtime: typeof player.playtime === 'number' ? player.playtime : 0,
    },
    flags: raw.flags || {},
    activeQuests: Array.isArray(raw.activeQuests) ? raw.activeQuests : [],
    completedQuests: Array.isArray(raw.completedQuests) ? raw.completedQuests : [],
    unlockedAchievements: Array.isArray(raw.unlockedAchievements) ? raw.unlockedAchievements : [],
  };
}

function readSlot(key: string): GameState | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return migrateSave(JSON.parse(raw));
  } catch {
    return null;
  }
}

export class StateManager {
  /** Writes a slot. Returns false if storage is full or unavailable. */
  static saveSlot(index: number, state: GameState): boolean {
    try {
      localStorage.setItem(SLOT_KEY(index), JSON.stringify({ ...state, savedAt: Date.now() }));
      return true;
    } catch {
      return false;
    }
  }

  static loadSlot(index: number): GameState | null {
    return readSlot(SLOT_KEY(index));
  }

  static clearSlot(index: number) {
    localStorage.removeItem(SLOT_KEY(index));
  }

  static autosave(state: GameState): boolean {
    try {
      localStorage.setItem(AUTO_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
      return true;
    } catch {
      // Ignore quota errors; autosave is best-effort.
      return false;
    }
  }

  static loadAutosave(): GameState | null {
    return readSlot(AUTO_KEY);
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
        savedAt: state ? state.savedAt : 0,
        playtime: state ? state.player.playtime : 0,
        gold: state ? state.player.gold : 0,
        state,
      });
    }
    return slots;
  }

  static clear() {
    for (let i = 0; i < SLOT_COUNT; i++) this.clearSlot(i);
    localStorage.removeItem(AUTO_KEY);
    localStorage.removeItem(LEGACY_KEY);
  }

  /** Serialises the current state to a portable string for backup/sharing. */
  static exportState(state: GameState): string {
    return JSON.stringify({ ...state, savedAt: Date.now() }, null, 2);
  }

  /** Parses an exported string back into a state, or null if it is invalid. */
  static importState(text: string): GameState | null {
    try {
      return migrateSave(JSON.parse(text));
    } catch {
      return null;
    }
  }
}

/** "1h 04m" / "12m 30s" / "45s" from a millisecond count. */
export function formatPlaytime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

/** Short, locale-aware timestamp for a save slot. */
export function formatSavedAt(ts: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

