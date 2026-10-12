import { Entity, Vector2 } from '../types';
import { CollisionSystem } from '../engine/collision';
import { WORLD_OBJECTS } from '../world/objects';
import { NPCS } from '../data/npcs';

export class Player implements Entity {
  id: string = 'player';
  name: string;
  pos: Vector2;
  size: Vector2 = { x: 30, y: 30 };
  color: string;
  type: 'player' = 'player';
  speed: number = 5;

  constructor(name: string, color: string, startPos: Vector2) {
    this.name = name;
    this.color = color;
    this.pos = startPos;
  }

  private solid(): any[] {
    return [...WORLD_OBJECTS, ...NPCS];
  }

  update(movement: Vector2) {
    const nextPos = {
      x: this.pos.x + movement.x * this.speed,
      y: this.pos.y + movement.y * this.speed,
    };

    if (!CollisionSystem.checkCollision(nextPos, this.size, this.solid())) {
      this.pos = nextPos;
    } else {
      // Try sliding along each axis independently.
      const nextPosX = { x: this.pos.x + movement.x * this.speed, y: this.pos.y };
      if (!CollisionSystem.checkCollision(nextPosX, this.size, this.solid())) {
        this.pos.x = nextPosX.x;
      }

      const nextPosY = { x: this.pos.x, y: this.pos.y + movement.y * this.speed };
      if (!CollisionSystem.checkCollision(nextPosY, this.size, this.solid())) {
        this.pos.y = nextPosY.y;
      }
    }

    this.pos = CollisionSystem.clampToWorld(this.pos, this.size);
  }
}
