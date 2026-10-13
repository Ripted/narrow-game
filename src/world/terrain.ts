import { LAND_FEATURES, landAt } from '../data/locations';

export interface Rect {
  pos: { x: number; y: number };
  size: { x: number; y: number };
}

/**
 * Water the player and cars cannot enter. The interior water is the Chiltown
 * River (split either side of the bridge) plus the Grand Lake; everything else
 * inside the map is solid ground, so the outer ocean needs no collision.
 */
export const WATER_SOLIDS: Rect[] = [
  { pos: { x: 6000, y: 0 }, size: { x: 300, y: 1600 } },     // river, north of the bridge
  { pos: { x: 6000, y: 3200 }, size: { x: 300, y: 4400 } },  // river, south of the bridge
  { pos: { x: 6300, y: 1600 }, size: { x: 4700, y: 4400 } }, // the Grand Lake
];

/** True when a point lies in open water. */
export function isWaterPoint(x: number, y: number): boolean {
  for (const w of WATER_SOLIDS) {
    if (x >= w.pos.x && x <= w.pos.x + w.size.x && y >= w.pos.y && y <= w.pos.y + w.size.y) return true;
  }
  return false;
}

/** True when a rectangle overlaps any water, used to keep spawns on dry land. */
export function overlapsWater(x: number, y: number, w: number, h: number): boolean {
  for (const s of WATER_SOLIDS) {
    if (x < s.pos.x + s.size.x && x + w > s.pos.x && y < s.pos.y + s.size.y && y + h > s.pos.y) return true;
  }
  return false;
}

/** The terrain family a point sits on, or 'water' out on the lakes. */
export function terrainKindAt(x: number, y: number): string {
  const land = landAt(x, y);
  return land ? land.kind : 'water';
}

/** Land features that fall inside a viewport, for culled terrain passes. */
export function visibleLand(viewX: number, viewY: number, viewW: number, viewH: number) {
  return LAND_FEATURES.filter(
    (l) => l.x + l.width >= viewX && l.x <= viewX + viewW && l.y + l.height >= viewY && l.y <= viewY + viewH,
  );
}
