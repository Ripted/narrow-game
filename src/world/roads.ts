/** A road segment drawn on top of the terrain, in world coordinates. */
export interface Road {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Path colour. */
  color: string;
  /** Highways get lane markings and a darker shoulder. */
  major?: boolean;
  /** Road bridges are drawn as decking, not tarmac, so they read as elevated. */
  bridge?: boolean;
}

const ASPHALT = '#4a4438';
const DARK = '#443f34';
const RING = '#3f3a30';
const FREEWAY = '#3a3a40';
const DIRT = '#5a4a34';

/**
 * Chiltown's street network. The old themed zones keep their grid, and the new
 * districts hang off a downtown grid, a freeway ring and a couple of bridges.
 */
export const ROADS: Road[] = [
  // ---- Original city grid ---------------------------------------------------
  { x: 0, y: 960, w: 3400, h: 90, color: ASPHALT },
  { x: 0, y: 1760, w: 3400, h: 90, color: ASPHALT },
  { x: 760, y: 0, w: 90, h: 2400, color: DARK },
  { x: 1970, y: 0, w: 90, h: 2400, color: DARK },
  { x: 2760, y: 0, w: 90, h: 2400, color: DARK },

  // ---- Eastern ring around the server farm and docks ------------------------
  { x: 3320, y: 0, w: 100, h: 5600, color: RING },
  { x: 3320, y: 1940, w: 2680, h: 100, color: RING },

  // ---- The Tri-State: the freeway ring with a centre divider ----------------
  { x: 0, y: 3100, w: 6000, h: 64, color: FREEWAY, major: true },
  { x: 0, y: 3356, w: 6000, h: 64, color: FREEWAY, major: true },
  { x: 2736, y: 3100, w: 48, h: 320, color: '#26262b' },

  // ---- The Loop: downtown avenues -------------------------------------------
  { x: 0, y: 3520, w: 6000, h: 80, color: ASPHALT },
  { x: 0, y: 3980, w: 6000, h: 80, color: ASPHALT },
  { x: 0, y: 4440, w: 6000, h: 80, color: ASPHALT },
  { x: 0, y: 4900, w: 6000, h: 80, color: ASPHALT },
  { x: 0, y: 5360, w: 6000, h: 80, color: ASPHALT },
  { x: 1540, y: 3520, w: 80, h: 2160, color: DARK },
  { x: 2940, y: 3520, w: 80, h: 2160, color: DARK },
  { x: 4340, y: 3520, w: 80, h: 2160, color: DARK },
  { x: 5740, y: 3520, w: 80, h: 2160, color: DARK },

  // ---- The Tri-State South: the coastal freeway -----------------------------
  { x: 0, y: 5640, w: 6000, h: 64, color: FREEWAY, major: true },
  { x: 0, y: 5896, w: 6000, h: 64, color: FREEWAY, major: true },
  { x: 2736, y: 5640, w: 48, h: 320, color: '#26262b' },

  // ---- Southlands arterials -------------------------------------------------
  { x: 1000, y: 5860, w: 80, h: 1740, color: DIRT },
  { x: 2400, y: 5860, w: 80, h: 1740, color: DIRT },
  { x: 4000, y: 5860, w: 80, h: 1740, color: DIRT },
  { x: 0, y: 6300, w: 6000, h: 80, color: ASPHALT },
  { x: 0, y: 7000, w: 6000, h: 80, color: ASPHALT },

  // ---- The Chiltown Bridge to the north island ------------------------------
  { x: 6120, y: 1600, w: 120, h: 1600, color: FREEWAY, major: true, bridge: true },
  { x: 6300, y: 1520, w: 2900, h: 80, color: ASPHALT },
  { x: 6300, y: 3160, w: 4700, h: 80, color: ASPHALT },
  { x: 7900, y: 0, w: 80, h: 1600, color: DARK },
  { x: 6500, y: 1600, w: 80, h: 1600, color: DIRT },

  // ---- Airport and freight yard spurs ---------------------------------------
  { x: 6300, y: 4200, w: 4700, h: 80, color: ASPHALT },
  { x: 6300, y: 6000, w: 4700, h: 80, color: ASPHALT },
  { x: 7500, y: 3200, w: 80, h: 1200, color: DARK },
  { x: 9700, y: 3200, w: 80, h: 1200, color: DARK },

  // ---- The Steel Coast ------------------------------------------------------
  { x: 7500, y: 6000, w: 80, h: 1600, color: DARK },
  { x: 9700, y: 6000, w: 80, h: 1600, color: DARK },
  { x: 6300, y: 6700, w: 4700, h: 80, color: DIRT },
];

/** True when a point sits on (or within `pad` of) any road. */
export function onRoad(x: number, y: number, pad = 24): boolean {
  return ROADS.some((r) => x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad);
}
