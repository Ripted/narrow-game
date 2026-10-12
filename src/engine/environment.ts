import { LOCATIONS } from '../data/locations';
import { PROPS, ROADS } from '../world/props';
import { Prop } from '../types';
import { drawProp, propShadow, propEmissive } from '../world/propArt';
import { hash01, shade, withAlpha } from './color';

export interface EnvView {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Draws the static world: base terrain, per-zone tiling and detail, decorative
 * roads, scenery props, ambient lighting and zone labels.
 *
 * Everything here is procedural and deterministic, and each pass culls to the
 * camera viewport, so the fixed prop layout costs nothing when off-screen.
 */
export class EnvironmentRenderer {
  private base: CanvasPattern | null = null;

  private getBasePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    if (this.base) return this.base;
    const t = document.createElement('canvas');
    t.width = t.height = 32;
    const c = t.getContext('2d');
    if (!c) return null;
    c.fillStyle = '#141416';
    c.fillRect(0, 0, 32, 32);
    for (let i = 0; i < 28; i++) {
      const x = hash01(`b${i}`, 1) * 32;
      const y = hash01(`b${i}`, 2) * 32;
      const a = 0.02 + hash01(`b${i}`, 3) * 0.05;
      c.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      c.fillRect(x, y, 1, 1);
    }
    this.base = ctx.createPattern(t, 'repeat');
    return this.base;
  }

  draw(ctx: CanvasRenderingContext2D, view: EnvView) {
    this.drawBase(ctx, view);
    this.drawZones(ctx, view);
    this.drawRoads(ctx, view);
    this.drawBounds(ctx, view);
    this.drawProps(ctx, view);
    this.drawLighting(ctx, view);
  }

  /**
   * Darkens everything outside the playable map and marks the boundary with a
   * hazard band, so reaching the edge reads as "end of world" rather than a
   * hard invisible wall.
   */
  private drawBounds(ctx: CanvasRenderingContext2D, view: EnvView) {
    const W = 3400;
    const H = 2400;
    ctx.fillStyle = '#050507';
    // Outside strips, clipped to the viewport.
    const strips: [number, number, number, number][] = [
      [view.x, view.y, Math.min(view.x + view.w, 0) - view.x, view.h],
      [Math.max(view.x, W), view.y, view.x + view.w - Math.max(view.x, W), view.h],
      [view.x, view.y, view.w, Math.min(view.y + view.h, 0) - view.y],
      [view.x, Math.max(view.y, H), view.w, view.y + view.h - Math.max(view.y, H)],
    ];
    for (const [x, y, w, h] of strips) if (w > 0 && h > 0) ctx.fillRect(x, y, w, h);

    // Hazard band just inside the border.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,170,0,0.16)';
    const band = 14;
    ctx.fillRect(0, 0, W, band);
    ctx.fillRect(0, H - band, W, band);
    ctx.fillRect(0, 0, band, H);
    ctx.fillRect(W - band, 0, band, H);
    ctx.strokeStyle = 'rgba(255,170,0,0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, W - 3, H - 3);
    ctx.restore();
  }

  /** Subtle noise fill across the whole visible area (covers the map bounds). */
  private drawBase(ctx: CanvasRenderingContext2D, view: EnvView) {
    const pat = this.getBasePattern(ctx);
    if (pat) {
      ctx.fillStyle = pat;
      ctx.fillRect(view.x, view.y, view.w, view.h);
    } else {
      ctx.fillStyle = '#141416';
      ctx.fillRect(view.x, view.y, view.w, view.h);
    }
  }

  private drawZones(ctx: CanvasRenderingContext2D, view: EnvView) {
    for (const loc of Object.values(LOCATIONS)) {
      const b = loc.bounds;
      if (!this.visible(b.x, b.y, b.width, b.height, view)) continue;

      // Base wash — a vertical gradient of the zone colour.
      const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.height);
      g.addColorStop(0, shade(loc.color, 0.12));
      g.addColorStop(1, shade(loc.color, -0.12));
      ctx.fillStyle = g;
      ctx.fillRect(b.x, b.y, b.width, b.height);

      // Interior mottled texture, deterministic per zone.
      ctx.save();
      ctx.beginPath();
      ctx.rect(b.x, b.y, b.width, b.height);
      ctx.clip();
      const count = Math.min(90, Math.floor((b.width * b.height) / 12000));
      for (let i = 0; i < count; i++) {
        const px = b.x + hash01(loc.id + i, 5) * b.width;
        const py = b.y + hash01(loc.id + i, 6) * b.height;
        const r = 14 + hash01(loc.id + i, 7) * 46;
        ctx.fillStyle = withAlpha(i % 2 ? shade(loc.color, 0.22) : shade(loc.color, -0.25), 0.16);
        ctx.beginPath();
        ctx.ellipse(px, py, r, r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Inset border frame.
      ctx.strokeStyle = withAlpha(shade(loc.color, 0.6), 0.35);
      ctx.lineWidth = 3;
      ctx.strokeRect(b.x + 6, b.y + 6, b.width - 12, b.height - 12);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.width, b.height);

      // Corner ticks so the grid seams read as deliberate.
      ctx.strokeStyle = withAlpha(shade(loc.color, 0.8), 0.5);
      ctx.lineWidth = 2;
      const tick = 26;
      const corners: [number, number, number, number][] = [
        [b.x, b.y, 1, 1],
        [b.x + b.width, b.y, -1, 1],
        [b.x, b.y + b.height, 1, -1],
        [b.x + b.width, b.y + b.height, -1, -1],
      ];
      for (const [cx0, cy0, sx, sy] of corners) {
        ctx.beginPath();
        ctx.moveTo(cx0 + sx * 10, cy0);
        ctx.lineTo(cx0, cy0);
        ctx.lineTo(cx0, cy0 + sy * 10);
        ctx.moveTo(cx0 + sx * tick, cy0);
        ctx.lineTo(cx0 + sx * tick, cy0 + sy * 6);
        ctx.moveTo(cx0, cy0 + sy * tick);
        ctx.lineTo(cx0 + sx * 6, cy0 + sy * tick);
        ctx.stroke();
      }

      // Large, faint zone label — only when the zone centre is on screen.
      const ccx = b.x + b.width / 2;
      const ccy = b.y + b.height / 2;
      if (this.visible(ccx - 240, ccy - 40, 480, 80, view)) {
        ctx.fillStyle = withAlpha(shade(loc.color, 0.75), 0.22);
        ctx.font = 'bold 44px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(loc.name.toUpperCase(), ccx, ccy);
        ctx.font = 'bold 13px Inter';
        ctx.fillStyle = withAlpha('#ffffff', 0.22);
        ctx.fillText('◆ ZONE ◆', ccx, ccy + 24);
      }
    }
  }

  private drawRoads(ctx: CanvasRenderingContext2D, view: EnvView) {
    for (const r of ROADS) {
      if (!this.visible(r.x, r.y, r.w, r.h, view)) continue;
      const vertical = r.h > r.w;
      const len = vertical ? r.h : r.w;
      const g = vertical
        ? ctx.createLinearGradient(r.x, 0, r.x + r.w, 0)
        : ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
      g.addColorStop(0, shade(r.color, -0.3));
      g.addColorStop(0.5, r.color);
      g.addColorStop(1, shade(r.color, -0.3));
      ctx.fillStyle = g;
      ctx.fillRect(r.x, r.y, r.w, r.h);

      // Kerb edges.
      ctx.fillStyle = withAlpha('#000000', 0.35);
      if (vertical) {
        ctx.fillRect(r.x, r.y, 3, r.h);
        ctx.fillRect(r.x + r.w - 3, r.y, 3, r.h);
      } else {
        ctx.fillRect(r.x, r.y, r.w, 3);
        ctx.fillRect(r.x, r.y + r.h - 3, r.w, 3);
      }

      // Dashed centre line.
      ctx.strokeStyle = withAlpha('#d8cfae', 0.4);
      ctx.lineWidth = 4;
      ctx.setLineDash([26, 26]);
      ctx.beginPath();
      if (vertical) {
        ctx.moveTo(r.x + r.w / 2, r.y);
        ctx.lineTo(r.x + r.w / 2, r.y + len);
      } else {
        ctx.moveTo(r.x, r.y + r.h / 2);
        ctx.lineTo(r.x + len, r.y + r.h / 2);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  private drawProps(ctx: CanvasRenderingContext2D, view: EnvView) {
    // Isometric-ish sort: back-to-front, then left-to-right.
    const visible = PROPS.filter((p) =>
      this.visible(p.pos.x - 6, p.pos.y - p.size.y * 1.8, p.size.x + 12, p.size.y * 2.4, view)
    );
    visible.sort((a, b) => (a.pos.y + a.size.y) - (b.pos.y + b.size.y) || a.pos.x - b.pos.x);
    for (const p of visible) this.drawPropEntity(ctx, p);
  }

  private drawPropEntity(ctx: CanvasRenderingContext2D, p: Prop) {
    const cx = p.pos.x + p.size.x / 2;
    const baseY = p.pos.y + p.size.y;
    propShadow(ctx, cx, baseY, p.size.x, p.size.y);
    drawProp(ctx, p.propKind, cx, baseY, p.size.x, p.size.y, p.color, p.id);
  }

  /**
   * Ambient-darkness pass with soft pools of light around glow sources, applied
   * with multiply blending so the uplights genuinely brighten the ground.
   */
  private drawLighting(ctx: CanvasRenderingContext2D, view: EnvView) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(174,172,182,1)';
    ctx.fillRect(view.x, view.y, view.w, view.h);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of PROPS) {
      const cx = p.pos.x + p.size.x / 2;
      const baseY = p.pos.y + p.size.y;
      if (!this.visible(cx - 120, baseY - 160, 240, 240, view)) continue;
      const warm = p.propKind === 'lamp' || p.propKind === 'clock' || p.propKind === 'neon';
      const rad = warm ? 130 : 90;
      const g = ctx.createRadialGradient(cx, baseY - 10, 0, cx, baseY - 10, rad);
      g.addColorStop(0, withAlpha(p.color, warm ? 0.16 : 0.08));
      g.addColorStop(1, withAlpha(p.color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(cx - rad, baseY - 10 - rad, rad * 2, rad * 2);
    }
    ctx.restore();
  }

  /** Emissive prop details, drawn after characters so lights sit in front. */
  drawEmissive(ctx: CanvasRenderingContext2D, view: EnvView) {
    for (const p of PROPS) {
      const cx = p.pos.x + p.size.x / 2;
      const baseY = p.pos.y + p.size.y;
      if (!this.visible(cx - 120, baseY - 200, 240, 260, view)) continue;
      propEmissive(ctx, p.propKind, cx, baseY, p.size.x, p.size.y, p.color, p.id);
    }
  }

  private visible(x: number, y: number, w: number, h: number, view: EnvView): boolean {
    const pad = 64;
    return (
      x + w >= view.x - pad &&
      x <= view.x + view.w + pad &&
      y + h >= view.y - pad &&
      y <= view.y + view.h + pad
    );
  }
}
