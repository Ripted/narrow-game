import { Entity, Vector2 } from '../types';
import { Camera } from './camera';

export class Renderer {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;

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
    // Small padding so entities pop in just off-screen instead of at the edge.
    const pad = 80;
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

  drawEntity(entity: Entity, camera: Camera, hp?: { hp: number; maxHp: number }) {
    const { pos, size, color, name } = entity;

    if (!this.isVisible(pos.x, pos.y, size.x, size.y, camera)) return;

    // Draw body
    this.ctx.fillStyle = color;
    this.ctx.fillRect(pos.x, pos.y, size.x, size.y);

    // Draw name
    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px Inter';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(name, pos.x + size.x / 2, pos.y - 10);

    if (hp) {
      const barW = Math.max(size.x, 40);
      const barX = pos.x + size.x / 2 - barW / 2;
      const barY = pos.y - 24;
      this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
      this.ctx.fillRect(barX, barY, barW, 5);
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(barX, barY, barW * Math.max(0, hp.hp / hp.maxHp), 5);
    }
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
   * Draws a simple blocky avatar for dialogue portraits using the entity's
   * colour, giving characters a distinct look without external art.
   */
  drawPortrait(ctx: CanvasRenderingContext2D, entity: Entity, x: number, y: number, size: number) {
    ctx.save();
    ctx.fillStyle = '#111';
    ctx.fillRect(x, y, size, size);

    // Face
    ctx.fillStyle = entity.color;
    ctx.fillRect(x + size * 0.12, y + size * 0.12, size * 0.76, size * 0.76);

    // Eyes
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(x + size * 0.3, y + size * 0.38, size * 0.12, size * 0.12);
    ctx.fillRect(x + size * 0.58, y + size * 0.38, size * 0.12, size * 0.12);

    // Mouth
    ctx.fillRect(x + size * 0.34, y + size * 0.66, size * 0.32, size * 0.08);
    ctx.restore();
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
