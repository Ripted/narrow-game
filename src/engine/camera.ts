import { Vector2 } from '../types';

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
