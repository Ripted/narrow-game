import { Vector2 } from '../types';
import { MAP_WIDTH, MAP_HEIGHT } from './collision';

export class Camera {
  pos: Vector2 = { x: 0, y: 0 };
  target: Vector2 = { x: 0, y: 0 };
  /**
   * Follow responsiveness in "e-folds per second". The per-frame blend is
   * derived from this and `dt`, so the camera settles in the same wall-clock
   * time at any frame rate instead of lagging on slow machines.
   */
  followRate: number = 6.5;
  viewport: Vector2 = { x: 800, y: 600 };

  constructor(width: number, height: number) {
    this.viewport = { x: width, y: height };
  }

  update(targetPos: Vector2, dtSec = 1 / 60) {
    // Center camera on target
    this.target.x = targetPos.x - this.viewport.x / 2;
    this.target.y = targetPos.y - this.viewport.y / 2;

    // Never show the void past the map edge: the spawn sits near the top-left
    // corner, so an unclamped camera would frame mostly out-of-bounds darkness.
    const maxX = Math.max(0, MAP_WIDTH - this.viewport.x);
    const maxY = Math.max(0, MAP_HEIGHT - this.viewport.y);
    this.target.x = Math.max(0, Math.min(maxX, this.target.x));
    this.target.y = Math.max(0, Math.min(maxY, this.target.y));

    // Frame-rate independent smoothing: exponential approach, clamped so a
    // long hitch cannot overshoot the target.
    const t = Math.min(1, 1 - Math.exp(-this.followRate * dtSec));
    this.pos.x += (this.target.x - this.pos.x) * t;
    this.pos.y += (this.target.y - this.pos.y) * t;
  }

  apply(ctx: CanvasRenderingContext2D) {
    ctx.translate(-this.pos.x, -this.pos.y);
  }

  resize(width: number, height: number) {
    this.viewport = { x: width, y: height };
  }
}
