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

  /** Dodge roll: brief burst of speed with invulnerability and a faint trail. */
  dodgeTimer = 0;
  dodgeCooldown = 0;
  dodgeDir: Vector2 = { x: 1, y: 0 };
  trail: Vector2[] = [];

  constructor(name: string, color: string, startPos: Vector2, appearance?: Appearance) {
    this.name = name;
    this.color = color;
    this.pos = startPos;
    this.appearance = appearance;
  }

  get dodging(): boolean {
    return this.dodgeTimer > 0;
  }

  /** Requests a roll in the current movement direction; ignored if on cooldown. */
  tryDodge(movement: Vector2): boolean {
    if (this.dodgeCooldown > 0) return false;
    if (movement.x === 0 && movement.y === 0) return false;
    const len = Math.hypot(movement.x, movement.y) || 1;
    this.dodgeDir = { x: movement.x / len, y: movement.y / len };
    this.dodgeTimer = 0.28;
    this.dodgeCooldown = 0.9;
    this.trail = [];
    return true;
  }

  /**
   * Moves with axis-separated sliding: if the full step is blocked, each axis is
   * tried alone so the player slides along walls instead of sticking.
   */
  update(movement: Vector2, solids: any[], dtSec = 0) {
    if (this.dodgeCooldown > 0) this.dodgeCooldown -= dtSec;
    let move: Vector2 = movement;
    let dist = this.speed;
    if (this.dodgeTimer > 0) {
      this.dodgeTimer -= dtSec;
      move = this.dodgeDir;
      dist = this.speed * 2.6;
    }
    if (this.dodgeTimer <= 0 && this.trail.length) this.trail.shift();

    const nextPos = {
      x: this.pos.x + move.x * dist,
      y: this.pos.y + move.y * dist,
    };

    if (!CollisionSystem.checkCollision(nextPos, this.size, solids)) {
      this.pos = nextPos;
    } else {
      const nextPosX = { x: this.pos.x + move.x * dist, y: this.pos.y };
      if (!CollisionSystem.checkCollision(nextPosX, this.size, solids)) {
        this.pos.x = nextPosX.x;
      }
      const nextPosY = { x: this.pos.x, y: this.pos.y + move.y * dist };
      if (!CollisionSystem.checkCollision(nextPosY, this.size, solids)) {
        this.pos.y = nextPosY.y;
      }
    }
    if (this.dodging) {
      this.trail.push({ ...this.pos });
      if (this.trail.length > 6) this.trail.shift();
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
