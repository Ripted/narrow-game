import { Appearance, Entity, Vector2 } from '../types';
import { CollisionSystem } from '../engine/collision';

/**
 * The player avatar. Collision solids are supplied per frame by the caller so
 * the same class works in the exterior (buildings, live NPCs, closed gates) and
 * inside interiors (walls and furniture), which use different coordinate spaces.
 */
export class Player implements Entity {
  id: string = 'player';
  name: string;
  pos: Vector2;
  size: Vector2 = { x: 30, y: 30 };
  color: string;
  type: 'player' = 'player';
  appearance?: Appearance;
  speed: number = 5;

  constructor(name: string, color: string, startPos: Vector2, appearance?: Appearance) {
    this.name = name;
    this.color = color;
    this.pos = startPos;
    this.appearance = appearance;
  }

  /**
   * Moves with axis-separated sliding: if the full step is blocked, each axis is
   * tried alone so the player slides along walls instead of sticking.
   */
  update(movement: Vector2, solids: any[]) {
    const dist = this.speed;
    const nextPos = {
      x: this.pos.x + movement.x * dist,
      y: this.pos.y + movement.y * dist,
    };

    if (!CollisionSystem.checkCollision(nextPos, this.size, solids)) {
      this.pos = nextPos;
    } else {
      const nextPosX = { x: this.pos.x + movement.x * dist, y: this.pos.y };
      if (!CollisionSystem.checkCollision(nextPosX, this.size, solids)) {
        this.pos.x = nextPosX.x;
      }
      const nextPosY = { x: this.pos.x, y: this.pos.y + movement.y * dist };
      if (!CollisionSystem.checkCollision(nextPosY, this.size, solids)) {
        this.pos.y = nextPosY.y;
      }
    }
  }

  clampToWorld() {
    this.pos = CollisionSystem.clampToWorld(this.pos, this.size);
  }

  /** Keeps the player inside an interior room's walkable area. */
  clampToRoom(width: number, height: number, margin = 22) {
    this.pos = {
      x: Math.max(margin, Math.min(width - this.size.x - margin, this.pos.x)),
      y: Math.max(margin, Math.min(height - this.size.y - margin, this.pos.y)),
    };
  }
}
