import { Vector2 } from '../types';
import { LOCATIONS } from '../data/locations';

export class CollisionSystem {
  static checkCollision(pos: Vector2, size: Vector2, worldObjects: any[]): boolean {
    // Check against world objects
    for (const obj of worldObjects) {
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

  static clampToWorld(pos: Vector2, size: Vector2): Vector2 {
    // This is a bit complex since the world is non-rectangular
    // For now, let's just keep it within a large bounding box or specific zones
    return pos;
  }
}
