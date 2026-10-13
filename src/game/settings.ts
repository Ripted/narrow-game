import { GameSettings } from '../types';

const KEY = 'narrow_arrow_settings';

export const DEFAULT_SETTINGS: GameSettings = {
  strongLanguage: false,
  radioOn: true,
  muted: false,
  volume: 0.22,
};

/**
 * Player preferences that should outlive a run. Kept separate from save slots
 * so clearing a save never resets audio or content settings.
 */
export const SettingsStore = {
  load(): GameSettings {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw);
      return {
        strongLanguage: parsed.strongLanguage === true,
        radioOn: parsed.radioOn !== false,
        muted: parsed.muted === true,
        volume: typeof parsed.volume === 'number'
          ? Math.max(0, Math.min(1, parsed.volume))
          : DEFAULT_SETTINGS.volume,
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },

  save(settings: GameSettings) {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      // Preferences are best-effort; ignore quota errors.
    }
  },
};
