import { Entity, Vector2 } from '../types';
import { Camera } from './camera';
import { EntitySpriteSystem } from './entitySprite';

export class Renderer {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  sprites = new EntitySpriteSystem();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /** True when the given world-space rect intersects the camera viewport. */
  private isVisible(x: number, y: number, w: number, h: number, camera: Camera): boolean {
    const left = camera.pos.x;
    const top = camera.pos.y;
    const right = left + camera.viewport.x;
    const bottom = top + camera.viewport.y;
    // Extra headroom so tall sprites and nameplates pop in off-screen.
    const pad = 110;
    return (
      x + w >= left - pad &&
      x <= right + pad &&
      y + h >= top - pad &&
      y <= bottom + pad
    );
  }

  clear() {
    this.ctx.fillStyle = '#0d0d0d';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** Advances animation state and draws a single entity (human or object). */
  drawEntity(
    entity: Entity,
    camera: Camera,
    hp?: { hp: number; maxHp: number },
    dtMs = 16
  ) {
    const { pos, size } = entity;
    if (!this.isVisible(pos.x, pos.y - size.y * 1.6, size.x, size.y * 2.6, camera)) return;

    this.sprites.update(entity, dtMs);
    this.sprites.draw(this.ctx, entity, { hp });
  }

  drawWorld(locations: any, camera: Camera) {
    Object.values(locations).forEach((loc: any) => {
      const { bounds, name, color } = loc;

      if (!this.isVisible(bounds.x, bounds.y, bounds.width, bounds.height, camera)) return;

      // Draw background
      this.ctx.fillStyle = color;
      this.ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

      // Draw border
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

      // Draw area name
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.font = 'bold 40px Inter';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(name, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    });
  }

  /**
   * Draws a bust-style portrait for the dialogue box, matching the character's
   * world sprite.
   */
  drawPortrait(ctx: CanvasRenderingContext2D, entity: Entity, x: number, y: number, size: number) {
    this.sprites.drawPortrait(ctx, entity, x, y, size);
  }

  drawInteractPrompt(pos: Vector2, text: string) {
    this.ctx.fillStyle = '#ffaa00';
    this.ctx.fillRect(pos.x - 40, pos.y - 60, 80, 30);
    this.ctx.fillStyle = 'black';
    this.ctx.font = 'bold 14px Inter';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, pos.x, pos.y - 40);
  }
}
