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

  clear() {
    this.ctx.fillStyle = '#0d0d0d';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawEntity(entity: Entity, camera: Camera) {
    const { pos, size, color, name } = entity;
    
    // Draw body
    this.ctx.fillStyle = color;
    this.ctx.fillRect(pos.x, pos.y, size.x, size.y);

    // Draw name
    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px Inter';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(name, pos.x + size.x / 2, pos.y - 10);
  }

  drawWorld(locations: any, camera: Camera) {
    Object.values(locations).forEach((loc: any) => {
      const { bounds, name, color } = loc;
      
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

  drawInteractPrompt(pos: Vector2, text: string) {
    this.ctx.fillStyle = '#ffaa00';
    this.ctx.fillRect(pos.x - 40, pos.y - 60, 80, 30);
    this.ctx.fillStyle = 'black';
    this.ctx.font = 'bold 14px Inter';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, pos.x, pos.y - 40);
  }
}
