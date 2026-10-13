import { Vector2 } from '../types';
import { MAP_WIDTH, MAP_HEIGHT } from './collision';

export class Camera {
  pos: Vector2 = { x: 0, y: 0 };
  target: Vector2 = { x: 0, y: 0 };
  lerpFactor: number = 0.1;
  viewport: Vector2 = { x: 800, y: 600 };

  constructor(width: number, height: number) {
    this.viewport = { x: width, y: height };
  }

  update(targetPos: Vector2) {
    // Center camera on target
    this.target.x = targetPos.x - this.viewport.x / 2;
    this.target.y = targetPos.y - this.viewport.y / 2;

    // Never show the void past the map edge: the spawn sits near the top-left
    // corner, so an unclamped camera would frame mostly out-of-bounds darkness.
    const maxX = Math.max(0, MAP_WIDTH - this.viewport.x);
    const maxY = Math.max(0, MAP_HEIGHT - this.viewport.y);
    this.target.x = Math.max(0, Math.min(maxX, this.target.x));
    this.target.y = Math.max(0, Math.min(maxY, this.target.y));

    // Smooth follow
    this.pos.x += (this.target.x - this.pos.x) * this.lerpFactor;
    this.pos.y += (this.target.y - this.pos.y) * this.lerpFactor;
  }

  apply(ctx: CanvasRenderingContext2D) {
    ctx.translate(-this.pos.x, -this.pos.y);
  }

  resize(width: number, height: number) {
    this.viewport = { x: width, y: height };
  }
}
