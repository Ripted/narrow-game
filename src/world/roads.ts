/** A road segment drawn on top of the terrain, in world coordinates. */
export interface Road {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Path colour. */
  color: string;
}

/**
 * Roads form a rough grid along the seams between the themed zones, so the world
 * reads as connected instead of as a grid of unlinked rooms.
 */
export const ROADS: Road[] = [
  // Original city grid.
  { x: 0, y: 960, w: 3400, h: 90, color: '#4a4438' },
  { x: 0, y: 1760, w: 3400, h: 90, color: '#4a4438' },
  { x: 760, y: 0, w: 90, h: 2400, color: '#443f34' },
  { x: 1970, y: 0, w: 90, h: 2400, color: '#443f34' },
  { x: 2760, y: 0, w: 90, h: 2400, color: '#443f34' },

  // Eastern ring round the new districts.
  { x: 3320, y: 0, w: 100, h: 4000, color: '#3f3a30' },
  { x: 3320, y: 1940, w: 2280, h: 100, color: '#3f3a30' },

  // The Highway: a wide ring road with a centre divider.
  { x: 0, y: 3100, w: 5600, h: 64, color: '#3a3a40' },
  { x: 0, y: 3356, w: 5600, h: 64, color: '#3a3a40' },
  { x: 2736, y: 3100, w: 48, h: 320, color: '#26262b' },

  // Dirt tracks into the Wilds.
  { x: 1400, y: 2400, w: 70, h: 700, color: '#5a4a34' },
  { x: 3900, y: 2400, w: 70, h: 700, color: '#54452f' },
];

/** True when a point sits on (or within `pad` of) any road. */
export function onRoad(x: number, y: number, pad = 24): boolean {
  return ROADS.some((r) => x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad);
}
