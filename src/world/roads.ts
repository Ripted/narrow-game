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
  { x: 0, y: 960, w: 3400, h: 90, color: '#4a4438' },
  { x: 0, y: 1760, w: 3400, h: 90, color: '#4a4438' },
  { x: 760, y: 0, w: 90, h: 2400, color: '#443f34' },
  { x: 1970, y: 0, w: 90, h: 2400, color: '#443f34' },
  { x: 2760, y: 0, w: 90, h: 2400, color: '#443f34' },
];

/** True when a point sits on (or within `pad` of) any road. */
export function onRoad(x: number, y: number, pad = 24): boolean {
  return ROADS.some((r) => x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad);
}
