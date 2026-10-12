import { Building, Interior } from '../types';
import { hash01 } from '../engine/color';

/**
 * Interiors are generated per building, deterministically, in local coordinates
 * (0,0 to width,height). They are not part of the world map: when the player
 * steps through a door the game renders the room instead of the exterior, so
 * the camera, collision and rendering all operate on the same tiny coordinate
 * space. The exit tile sits at the bottom-centre, matching the drawn door.
 */

interface RoomSpec {
  w: number;
  h: number;
  floor: string;
  wall: string;
  /** Furniture placed along the walls, as (u,v) fractions of the room. */
  furnitures: { kind: string; color: string; w: number; h: number; u: number; v: number }[];
  name: string;
}

const ROOMS: Record<string, RoomSpec> = {
  house: {
    name: 'Living Room',
    w: 520,
    h: 380,
    floor: '#4a3b2c',
    wall: '#6b5540',
    furnitures: [
      { kind: 'bed', color: '#8a5a6a', w: 90, h: 60, u: 0.18, v: 0.24 },
      { kind: 'table', color: '#6a4a2a', w: 110, h: 60, u: 0.62, v: 0.62 },
      { kind: 'shelf', color: '#5a4028', w: 120, h: 26, u: 0.8, v: 0.16 },
      { kind: 'rug', color: '#7a3a3a', w: 150, h: 100, u: 0.42, v: 0.42 },
    ],
  },
  cafe: {
    name: 'The French Café',
    w: 560,
    h: 400,
    floor: '#6a5340',
    wall: '#8a6a4a',
    furnitures: [
      { kind: 'counter', color: '#4a3a2a', w: 240, h: 40, u: 0.5, v: 0.18 },
      { kind: 'table', color: '#7a5a3a', w: 70, h: 70, u: 0.24, v: 0.62 },
      { kind: 'table', color: '#7a5a3a', w: 70, h: 70, u: 0.5, v: 0.62 },
      { kind: 'table', color: '#7a5a3a', w: 70, h: 70, u: 0.76, v: 0.62 },
    ],
  },
  tower: {
    name: 'Control Room',
    w: 440,
    h: 440,
    floor: '#2a3038',
    wall: '#3a4450',
    furnitures: [
      { kind: 'console', color: '#39d0d8', w: 180, h: 40, u: 0.5, v: 0.16 },
      { kind: 'server', color: '#2a3a44', w: 40, h: 120, u: 0.14, v: 0.55 },
      { kind: 'server', color: '#2a3a44', w: 40, h: 120, u: 0.86, v: 0.55 },
      { kind: 'table', color: '#33404a', w: 110, h: 60, u: 0.5, v: 0.7 },
    ],
  },
  hall: {
    name: 'Hall of Fame',
    w: 680,
    h: 420,
    floor: '#6a5a3a',
    wall: '#8a7a4a',
    furnitures: [
      { kind: 'board', color: '#d4af37', w: 300, h: 30, u: 0.5, v: 0.14 },
      { kind: 'column', color: '#b8b2a4', w: 34, h: 34, u: 0.16, v: 0.55 },
      { kind: 'column', color: '#b8b2a4', w: 34, h: 34, u: 0.84, v: 0.55 },
      { kind: 'statue', color: '#cfc9b8', w: 40, h: 40, u: 0.5, v: 0.72 },
    ],
  },
  bunker: {
    name: 'Bunker',
    w: 420,
    h: 320,
    floor: '#3a3d40',
    wall: '#4a4f52',
    furnitures: [
      { kind: 'crate', color: '#5a5f62', w: 60, h: 60, u: 0.2, v: 0.28 },
      { kind: 'crate', color: '#5a5f62', w: 60, h: 60, u: 0.2, v: 0.66 },
      { kind: 'table', color: '#454a4d', w: 120, h: 50, u: 0.65, v: 0.5 },
    ],
  },
  warehouse: {
    name: 'Warehouse',
    w: 640,
    h: 400,
    floor: '#4a4a4e',
    wall: '#5a5a60',
    furnitures: [
      { kind: 'crate', color: '#6a6a70', w: 70, h: 70, u: 0.18, v: 0.3 },
      { kind: 'crate', color: '#6a6a70', w: 70, h: 70, u: 0.18, v: 0.7 },
      { kind: 'crate', color: '#6a6a70', w: 70, h: 70, u: 0.82, v: 0.3 },
      { kind: 'crate', color: '#6a6a70', w: 70, h: 70, u: 0.82, v: 0.7 },
      { kind: 'shelf', color: '#4a4a50', w: 160, h: 28, u: 0.5, v: 0.16 },
    ],
  },
  shrine: {
    name: "ESH's Shrine",
    w: 480,
    h: 420,
    floor: '#1a1a24',
    wall: '#2f2f3a',
    furnitures: [
      { kind: 'crystal', color: '#9a8aff', w: 40, h: 40, u: 0.5, v: 0.2 },
      { kind: 'shrine', color: '#6a5cff', w: 80, h: 80, u: 0.5, v: 0.42 },
      { kind: 'candle', color: '#ffd070', w: 20, h: 20, u: 0.22, v: 0.32 },
      { kind: 'candle', color: '#ffd070', w: 20, h: 20, u: 0.78, v: 0.32 },
      { kind: 'candle', color: '#ffd070', w: 20, h: 20, u: 0.22, v: 0.72 },
      { kind: 'candle', color: '#ffd070', w: 20, h: 20, u: 0.78, v: 0.72 },
    ],
  },
  hut: {
    name: 'Hut',
    w: 360,
    h: 300,
    floor: '#4a3a26',
    wall: '#5a4326',
    furnitures: [
      { kind: 'bed', color: '#6a5a3a', w: 80, h: 50, u: 0.25, v: 0.3 },
      { kind: 'table', color: '#5a4028', w: 90, h: 50, u: 0.68, v: 0.66 },
    ],
  },
};

/** Interiors exist for every enterable kind; ruins are a collapsed shell. */
export function interiorFor(building: Building): Interior | null {
  if (building.buildingKind === 'ruin') return null;
  const spec = ROOMS[building.buildingKind];
  if (!spec) return null;

  const jitter = hash01(building.id, 3);
  const w = spec.w;
  const h = spec.h;
  // Bottom-centre exit lines up with the drawn door.
  const exitX = w / 2;

  const furnitures = spec.furnitures.map((f, i) => {
    const jx = (hash01(building.id + i, 11) - 0.5) * 26;
    const jy = (hash01(building.id + i, 12) - 0.5) * 26;
    return {
      kind: f.kind,
      color: f.color,
      x: Math.round(f.u * w - f.w / 2 + jx),
      y: Math.round(f.v * h - f.h / 2 + jy),
      w: f.w,
      h: f.h,
    };
  });

  return {
    id: `interior_${building.id}`,
    name: spec.name,
    buildingId: building.id,
    buildingKind: building.buildingKind,
    width: w,
    height: h,
    spawn: { x: exitX, y: h - 54 },
    exit: { x: exitX, y: h - 18 },
    furnitures,
    floor: spec.floor,
    wall: spec.wall,
    occupants: [],
  };
}

/** Deterministic per-building odour/style nudge, kept for future use. */
export function interiorSeed(building: Building): number {
  return hash01(building.id, 3);
}
