import { Entity, Vector2 } from '../types';
import { Camera } from './camera';
import { EntitySpriteSystem } from './entitySprite';
import { EnvironmentRenderer } from './environment';

export class Renderer {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  sprites = new EntitySpriteSystem();
  environment = new EnvironmentRenderer();

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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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

  /** Terrain, roads, scenery props, ambient lighting and zone labels. */
  drawWorld(locations: unknown, camera: Camera) {
    void locations;
    this.environment.draw(this.ctx, {
      x: camera.pos.x,
      y: camera.pos.y,
      w: camera.viewport.x,
      h: camera.viewport.y,
    });
  }

  /** Emissive prop details, drawn after characters so lights sit in front. */
  drawWorldLights(camera: Camera) {
    this.environment.drawEmissive(this.ctx, {
      x: camera.pos.x,
      y: camera.pos.y,
      w: camera.viewport.x,
      h: camera.viewport.y,
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
