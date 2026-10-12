import { InventoryItem } from '../types';

export const ITEMS: Record<string, InventoryItem> = {
  update_fragment: {
    id: 'update_fragment',
    name: 'Update Fragment',
    description: 'A shard of the next build. Collect three to save the game.',
    color: '#ffffff',
  },
  baguette: {
    id: 'baguette',
    name: 'Hard Baguette',
    description: 'Weaponised bread from the French Café. Xazikk would be furious.',
    color: '#f5deb3',
    weapon: true,
    damage: 8,
  },
  paprika: {
    id: 'paprika',
    name: 'Paprika Shard',
    description: 'The paprika king\'s blessing. Sharp, red, and mildly threatening.',
    color: '#b22222',
    weapon: true,
    damage: 12,
  },
  admin_key: {
    id: 'admin_key',
    name: 'Rusty Key',
    description: 'Opens something in the Dev Room. Probably. Definitely maybe.',
    color: '#c0c0c0',
  },
  energy_drink: {
    id: 'energy_drink',
    name: 'Energy Drink',
    description: 'Tastes like a sprint. Restores health on use.',
    color: '#39d0d8',
  },
  wrench: {
    id: 'wrench',
    name: 'Heavy Wrench',
    description: 'A garage wrench. Good for cars, better for arguments.',
    color: '#9aa4ad',
    weapon: true,
    damage: 9,
  },
  pepper_spray: {
    id: 'pepper_spray',
    name: 'Pepper Spray',
    description: 'A docker\'s deterrent. Short range, high regret.',
    color: '#e05a2a',
    weapon: true,
    damage: 6,
  },
  // ---- Fictional intoxicants (status-effect consumables) --------------------
  arrow_ale: {
    id: 'arrow_ale',
    name: 'Arrow Ale',
    description: 'The official drink of bad decisions. Use for a warm, blurry buzz.',
    color: '#c98a2a',
  },
  meme_dust: {
    id: 'meme_dust',
    name: 'Meme Dust',
    description: 'See the whole timeline. Regret the whole timeline. Use with caution.',
    color: '#a05ad0',
  },
  server_nectar: {
    id: 'server_nectar',
    name: 'Server Nectar',
    description: 'Pure uncut uptime. Use for a fast, humming high.',
    color: '#39c0b0',
  },
  // ---- Crime loot -----------------------------------------------------------
  stolen_watch: {
    id: 'stolen_watch',
    name: 'Hot Watch',
    description: 'Fell off a wrist near the French Café. It fell very fast.',
    color: '#d4af37',
  },
  bootleg_film: {
    id: 'bootleg_film',
    name: 'Bootleg Film',
    description: 'A very explicit movie. Rated XXX for the mosaic blur alone.',
    color: '#7a2a5a',
  },
  feather_token: {
    id: 'feather_token',
    name: 'Feather Token',
    description: 'Proof you visited The Feather. The details are between you and the fade.',
    color: '#e46aa0',
  },
};

export const STARTING_ITEM = 'rusty_stick';

/** Registered after the const map to avoid a circular reference. */
ITEMS[STARTING_ITEM] = {
  id: STARTING_ITEM,
  name: 'Rusty Stick',
  description: 'It is a stick. Everyone starts somewhere.',
  color: '#8b7355',
  weapon: true,
  damage: 4,
};
