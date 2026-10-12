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
