import { Vector2 } from '../types';
import { LOCATIONS, MAP_BOUNDS } from '../data/locations';
import { NPCS } from '../data/npcs';

export const MAP_WIDTH = MAP_BOUNDS.width;
export const MAP_HEIGHT = MAP_BOUNDS.height;

export class CollisionSystem {
  static checkCollision(
    pos: Vector2,
    size: Vector2,
    worldObjects: any[],
    ignoreId?: string
  ): boolean {
    for (const obj of worldObjects) {
      if (ignoreId && obj.id === ignoreId) continue;
      if (
        pos.x < obj.pos.x + obj.size.x &&
        pos.x + size.x > obj.pos.x &&
        pos.y < obj.pos.y + obj.size.y &&
        pos.y + size.y > obj.pos.y
      ) {
        return true;
      }
    }
    return false;
  }

  /** NPCs are solid, so the player cannot walk through characters. */
  static checkEntityCollision(
    pos: Vector2,
    size: Vector2,
    entities: any[],
    ignoreId?: string
  ): boolean {
    return this.checkCollision(pos, size, entities, ignoreId);
  }

  /** Keeps the player inside the overall map bounds. */
  static clampToWorld(pos: Vector2, size: Vector2): Vector2 {
    return {
      x: Math.max(0, Math.min(MAP_WIDTH - size.x, pos.x)),
      y: Math.max(0, Math.min(MAP_HEIGHT - size.y, pos.y)),
    };
  }

  /** Returns the location containing the point, if any. */
  static locationAt(pos: Vector2): string | null {
    for (const loc of Object.values(LOCATIONS)) {
      const b = loc.bounds;
      if (
        pos.x >= b.x &&
        pos.x <= b.x + b.width &&
        pos.y >= b.y &&
        pos.y <= b.y + b.height
      ) {
        return loc.id;
      }
    }
    return null;
  }

  /** All solid entities the player should collide with. */
  static solidEntities() {
    return NPCS.filter((n) => n.boss !== true || false);
  }
}
