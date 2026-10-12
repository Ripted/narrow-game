import { Appearance, HairStyle } from '../types';

const SKIN = {
  porcelain: '#f3d3bd',
  fair: '#eec2a4',
  tan: '#d59a6a',
  olive: '#c08654',
  brown: '#9a6440',
  deep: '#6f452c',
};

/**
 * Character looks are data-driven so new NPCs only need an appearance object
 * rather than art. Colours came from each character's existing accent colour so
 * the cast keeps its identity after the move to humanoid sprites.
 */
export const APPEARANCES: Record<string, Appearance> = {
  // ---- Playable characters ----
  penguin: {
    skin: SKIN.fair, hair: '#2b3a45', hairStyle: 'short',
    shirt: '#00b7c2', pants: '#1f2933', shoes: '#0f1115',
    height: 1.0, build: 1.0,
  },
  ripted: {
    skin: SKIN.tan, hair: '#f0c14b', hairStyle: 'spiky',
    shirt: '#d4af37', pants: '#2b2b2b', shoes: '#111111',
    height: 1.04, build: 1.0,
  },
  champy: {
    skin: SKIN.brown, hair: '#3a2a4a', hairStyle: 'short',
    shirt: '#8b2fd6', pants: '#241a33', shoes: '#120c1a',
    height: 1.02, build: 1.05,
  },
  polar: {
    skin: SKIN.porcelain, hair: '#cfe8f2', hairStyle: 'long',
    shirt: '#9fd4e8', pants: '#3b5b7a', shoes: '#20303f',
    height: 1.08, build: 0.95,
  },
  custom: {
    skin: SKIN.fair, hair: '#5a3b2e', hairStyle: 'short',
    shirt: '#dddddd', pants: '#333333', shoes: '#111111',
    height: 1.0, build: 1.0,
  },

  // ---- NPCs ----
  hydo: {
    skin: SKIN.fair, hair: '#6d6d6d', hairStyle: 'short',
    shirt: '#7c8794', pants: '#2c3138', shoes: '#15181d',
    height: 0.98, build: 1.0,
  },
  sam: {
    skin: SKIN.olive, hair: '#3f2d1e', hairStyle: 'bun',
    shirt: '#2f8f4e', pants: '#22303a', shoes: '#14181c',
    height: 1.0, build: 0.98,
  },
  kiwi: {
    skin: SKIN.fair, hair: '#b8332f', hairStyle: 'spiky',
    shirt: '#d1332e', pants: '#8c1d1a', shoes: '#1a0f0f',
    height: 1.02, build: 1.1,
  },
  rimai: {
    skin: SKIN.tan, hair: '#e8722c', hairStyle: 'spiky',
    shirt: '#ef7d1a', pants: '#3a2a1c', shoes: '#1c130c',
    height: 1.0, build: 1.0,
  },
  goosey: {
    skin: SKIN.brown, hair: '#2e0f0f', hairStyle: 'short',
    shirt: '#8f1d1d', pants: '#1f1414', shoes: '#0d0808',
    height: 1.06, build: 1.15,
  },
  aqprox: {
    skin: SKIN.fair, hair: '#8fb8c2', hairStyle: 'short',
    shirt: '#3f8ea3', pants: '#1d2c33', shoes: '#10181b',
    height: 1.0, build: 0.95, opacity: 0.6,
  },
  xazikk: {
    skin: SKIN.fair, hair: '#4a4a52', hairStyle: 'short',
    shirt: '#4a5568', pants: '#2a2f3a', shoes: '#14171c',
    height: 0.96, build: 0.96,
  },
  mazyx: {
    skin: SKIN.porcelain, hair: '#5a5f6b', hairStyle: 'ponytail',
    shirt: '#5c6472', pants: '#2c313c', shoes: '#14171c',
    height: 0.98, build: 0.94,
  },
  esh: {
    skin: '#e8e8f0', hair: '#0a0a0f', hairStyle: 'long',
    shirt: '#12121a', pants: '#0a0a10', shoes: '#05050a',
    height: 1.12, build: 0.9, opacity: 0.75, glow: 'rgba(255,255,255,0.35)',
  },
  arrow_ghost: {
    skin: '#e6faff', hair: '#ffffff', hairStyle: 'short',
    shirt: '#0d1b1e', pants: '#0a1417', shoes: '#061013',
    height: 1.05, build: 0.98, opacity: 0.68, glow: 'rgba(0,255,255,0.45)',
  },

  // ---- Dialogue-only speakers (no sprite in the world) ----
  ripted_dialogue: {
    skin: SKIN.tan, hair: '#f0c14b', hairStyle: 'spiky',
    shirt: '#d4af37', pants: '#2b2b2b', shoes: '#111111',
    height: 1.04, build: 1.0,
  },
};

/** Fallback derived from an entity colour so nothing renders unclothed. */
export function fallbackAppearance(color: string): Appearance {
  const styles: HairStyle[] = ['short', 'long', 'spiky', 'bun', 'ponytail'];
  let hash = 0;
  for (let i = 0; i < color.length; i++) hash = (hash * 31 + color.charCodeAt(i)) >>> 0;
  return {
    skin: SKIN.fair,
    hair: '#3a2a20',
    hairStyle: styles[hash % styles.length],
    shirt: color,
    pants: '#2b2f36',
    shoes: '#14171c',
    height: 1.0,
    build: 1.0,
  };
}

export const PLAYER_APPEARANCE_KEYS: Record<string, string> = {
  penguin: 'penguin',
  ripted: 'ripted',
  champy: 'champy',
  polar: 'polar',
  custom: 'custom',
};
