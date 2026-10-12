import { Entity, Vector2, Car, Enemy } from '../types';
import { INTERACTIVES, drawInteractive, drawGate } from '../world/interactives';
import { Camera } from './camera';
import { EntitySpriteSystem } from './entitySprite';
import { EnvironmentRenderer, EnvExtras } from './environment';
import { Interior } from '../types';
import { drawInterior } from '../world/interiorArt';
import { drawCar } from '../world/cars';
import { drawEnemy } from '../world/enemies';

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

  /** Terrain, roads, scenery props, fixtures, ambient lighting and zone labels. */
  drawWorld(locations: unknown, camera: Camera, extras: EnvExtras = {}) {
    void locations;
    this.environment.draw(this.ctx, {
      x: camera.pos.x,
      y: camera.pos.y,
      w: camera.viewport.x,
      h: camera.viewport.y,
    }, extras);
  }

  /**
   * Draws an interior room. The caller translates the context so the room sits
   * centred in the viewport; the room itself is in local coordinates.
   */
  drawInteriorScene(room: Interior, camera: Camera, timeOfDay: number) {
    drawInterior(this.ctx, room, timeOfDay);
    void camera;
  }

  /** Interact prompt bubble drawn in world space. */
  drawPromptMarker(pos: Vector2, text: string, camera: Camera) {
    const x = pos.x;
    const y = pos.y - 58;
    const ctx = this.ctx;
    ctx.font = 'bold 13px Inter';
    const w = ctx.measureText(text).width + 20;
    ctx.fillStyle = 'rgba(10,12,16,0.85)';
    ctx.fillRect(x - w / 2, y - 20, w, 26);
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - w / 2, y - 20, w, 26);
    ctx.fillStyle = '#ffaa00';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y - 2);
    void camera;
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

  /** Draws a car (parked or in traffic) rotated to its heading. */
  drawCar(car: Car, camera: Camera, time: number) {
    const { pos, size } = car;
    const pad = 80;
    if (
      pos.x + size.x < camera.pos.x - pad ||
      pos.x > camera.pos.x + camera.viewport.x + pad ||
      pos.y + size.y < camera.pos.y - pad ||
      pos.y > camera.pos.y + camera.viewport.y + pad
    ) return;
    drawCar(this.ctx, car, time);
  }

  /** Draws a hostile. */
  drawEnemy(enemy: Enemy, camera: Camera, time: number) {
    const { pos, size } = enemy;
    const pad = 90;
    if (
      pos.x + size.x < camera.pos.x - pad ||
      pos.x > camera.pos.x + camera.viewport.x + pad ||
      pos.y + size.y * 2 < camera.pos.y - pad ||
      pos.y > camera.pos.y + camera.viewport.y + pad
    ) return;
    drawEnemy(this.ctx, enemy, time);
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
