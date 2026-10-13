import { LOCATIONS, LAND_FEATURES, WATER_FEATURES } from '../data/locations';
import { MAP_WIDTH, MAP_HEIGHT } from './collision';
import { isWaterPoint } from '../world/terrain';
import { PROPS, ROADS } from '../world/props';
import { BUILDINGS } from '../world/buildings';
import { INTERACTIVES, drawInteractive, drawGate } from '../world/interactives';
import { Prop, Gate, Interactive } from '../types';
import { drawProp, propShadow, propEmissive } from '../world/propArt';
import { drawBuilding, buildingEmissive } from '../world/buildingArt';
import { hash01, shade, withAlpha, mix } from './color';

export interface EnvView {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Live world state the environment pass needs (gates swing open, etc.). */
export interface EnvExtras {
  gates?: Gate[];
  daylight?: number;
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

  draw(ctx: CanvasRenderingContext2D, view: EnvView, extras: EnvExtras = {}) {
    this.drawBase(ctx, view);
    this.drawWater(ctx, view);
    this.drawLand(ctx, view);
    this.drawZones(ctx, view);
    this.drawRoads(ctx, view);
    this.drawBounds(ctx, view);
    this.drawProps(ctx, view, extras);
    this.drawLighting(ctx, view, extras);
  }

  /** Landmasses: the island, its districts and the terrain tint per family. */
  private drawLand(ctx: CanvasRenderingContext2D, view: EnvView) {
    for (const l of LAND_FEATURES) {
      if (!this.visible(l.x, l.y, l.width, l.height, view)) continue;

      // Shoreline foam halo, drawn just outside the land so it reads on water.
      ctx.fillStyle = 'rgba(150,215,230,0.20)';
      ctx.fillRect(l.x - 7, l.y - 7, l.width + 14, l.height + 14);

      const ground = mix(l.color, '#1b1c22', 0.35);
      const g = ctx.createLinearGradient(0, l.y, 0, l.y + l.height);
      g.addColorStop(0, shade(ground, 0.1));
      g.addColorStop(1, shade(ground, -0.14));
      ctx.fillStyle = g;
      ctx.fillRect(l.x, l.y, l.width, l.height);

      // Beaches and bluffs get a soft lighter rim along the shoreline.
      if (l.kind === 'sand' || l.kind === 'island') {
        ctx.fillStyle = withAlpha('#d8c89a', 0.10);
        ctx.fillRect(l.x, l.y, l.width, 26);
        ctx.fillRect(l.x, l.y + l.height - 26, l.width, 26);
        ctx.fillRect(l.x, l.y, 26, l.height);
        ctx.fillRect(l.x + l.width - 26, l.y, 26, l.height);
      }

      // Deterministic terrain detail, cheap and viewport-clipped.
      ctx.save();
      ctx.beginPath();
      ctx.rect(l.x, l.y, l.width, l.height);
      ctx.clip();
      const count = Math.min(150, Math.floor((l.width * l.height) / 26000));
      for (let i = 0; i < count; i++) {
        const px = l.x + hash01(l.id + i, 5) * l.width;
        const py = l.y + hash01(l.id + i, 6) * l.height;
        if (!this.visible(px - 40, py - 40, 80, 80, view)) continue;
        const r = 20 + hash01(l.id + i, 7) * 70;
        ctx.fillStyle = withAlpha(i % 2 ? shade(ground, 0.28) : shade(ground, -0.3), 0.12);
        ctx.beginPath();
        ctx.ellipse(px, py, r, r * (0.6 + hash01(l.id + i, 8) * 0.3), 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /** Ocean, the Grand Lake and the Chiltown River, with a gentle wave shimmer. */
  private drawWater(ctx: CanvasRenderingContext2D, view: EnvView) {
    const ocean = ctx.createLinearGradient(0, view.y, 0, view.y + view.h);
    ocean.addColorStop(0, '#0d2634');
    ocean.addColorStop(1, '#0a1c28');
    ctx.fillStyle = ocean;
    ctx.fillRect(view.x, view.y, view.w, view.h);

    for (const w of WATER_FEATURES) {
      if (!this.visible(w.x, w.y, w.width, w.height, view)) continue;
      ctx.fillStyle = w.color;
      ctx.fillRect(w.x, w.y, w.width, w.height);
    }

    // Sparse glints, only over water so land never shimmers.
    ctx.save();
    ctx.fillStyle = 'rgba(190,235,255,0.10)';
    const t = performance.now() / 900;
    for (let i = 0; i < 90; i++) {
      const px = view.x + hash01(`wv${i}`, Math.floor(t)) * view.w;
      const py = view.y + hash01(`wv${i}`, Math.floor(t) + 1) * view.h;
      if (!isWaterPoint(px, py)) continue;
      ctx.fillRect(px, py, 16, 2);
    }
    ctx.restore();
  }

  /**
   * Darkens everything outside the playable map and marks the boundary with a
   * hazard band, so reaching the edge reads as "end of world" rather than a
   * hard invisible wall.
   */
  private drawBounds(ctx: CanvasRenderingContext2D, view: EnvView) {
    const W = MAP_WIDTH;
    const H = MAP_HEIGHT;
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

      // Base wash — the zone colour desaturated toward a neutral ground tone and
      // kept translucent so the terrain family underneath still reads through.
      const ground = mix(loc.color, '#1b1c22', 0.42);
      const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.height);
      g.addColorStop(0, withAlpha(shade(ground, 0.1), 0.5));
      g.addColorStop(1, withAlpha(shade(ground, -0.12), 0.5));
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
        ctx.fillStyle = withAlpha(i % 2 ? shade(ground, 0.3) : shade(ground, -0.3), 0.1);
        ctx.beginPath();
        ctx.ellipse(px, py, r, r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Inset border frame.
      ctx.strokeStyle = withAlpha(shade(loc.color, 0.6), 0.22);
      ctx.lineWidth = 3;
      ctx.strokeRect(b.x + 6, b.y + 6, b.width - 12, b.height - 12);
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.width, b.height);

      // Corner ticks so the grid seams read as deliberate.
      ctx.strokeStyle = withAlpha(shade(loc.color, 0.8), 0.32);
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

      // Shoulder/kerb first so wide roads and bridges read as raised.
      if (r.major) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12);
      }
      const g = vertical
        ? ctx.createLinearGradient(r.x, 0, r.x + r.w, 0)
        : ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
      g.addColorStop(0, shade(r.color, -0.3));
      g.addColorStop(0.5, r.color);
      g.addColorStop(1, shade(r.color, -0.3));
      ctx.fillStyle = g;
      ctx.fillRect(r.x, r.y, r.w, r.h);

      // Bridge decking: cross-planks instead of tarmac.
      if (r.bridge) {
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 2;
        for (let d = r.y; d < r.y + r.h; d += 26) {
          ctx.beginPath();
          ctx.moveTo(r.x, d);
          ctx.lineTo(r.x + r.w, d);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(220,220,230,0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(r.x + 4, r.y);
        ctx.lineTo(r.x + 4, r.y + r.h);
        ctx.moveTo(r.x + r.w - 4, r.y);
        ctx.lineTo(r.x + r.w - 4, r.y + r.h);
        ctx.stroke();
      }

      // Kerb edges.
      ctx.fillStyle = withAlpha('#000000', 0.35);
      if (vertical) {
        ctx.fillRect(r.x, r.y, 3, r.h);
        ctx.fillRect(r.x + r.w - 3, r.y, 3, r.h);
      } else {
        ctx.fillRect(r.x, r.y, r.w, 3);
        ctx.fillRect(r.x, r.y + r.h - 3, r.w, 3);
      }

      // Dashed centre line (double-solid for freeways).
      if (r.major) {
        ctx.strokeStyle = withAlpha('#e8d98a', 0.5);
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        const off = r.h > 32 ? 10 : 4;
        ctx.beginPath();
        if (vertical) {
          ctx.moveTo(r.x + r.w / 2 - off, r.y);
          ctx.lineTo(r.x + r.w / 2 - off, r.y + len);
          ctx.moveTo(r.x + r.w / 2 + off, r.y);
          ctx.lineTo(r.x + r.w / 2 + off, r.y + len);
        } else {
          ctx.moveTo(r.x, r.y + r.h / 2 - off);
          ctx.lineTo(r.x + len, r.y + r.h / 2 - off);
          ctx.moveTo(r.x, r.y + r.h / 2 + off);
          ctx.lineTo(r.x + len, r.y + r.h / 2 + off);
        }
        ctx.stroke();
      } else {
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
  }

  private drawProps(ctx: CanvasRenderingContext2D, view: EnvView, extras: EnvExtras) {
    // Ground props, buildings and fixtures are sorted together back-to-front so a
    // building correctly occludes props standing behind it. Keyed by footprint
    // bottom, so a building's tall facade still draws over the prop behind it.
    type Item = { key: number; x: number; draw: () => void };
    const items: Item[] = [];

    for (const p of PROPS) {
      if (!this.visible(p.pos.x - 6, p.pos.y - p.size.y * 1.8, p.size.x + 12, p.size.y * 2.4, view)) continue;
      const cx = p.pos.x + p.size.x / 2;
      const baseY = p.pos.y + p.size.y;
      items.push({ key: baseY, x: p.pos.x, draw: () => { propShadow(ctx, cx, baseY, p.size.x, p.size.y); drawProp(ctx, p.propKind, cx, baseY, p.size.x, p.size.y, p.color, p.id); } });
    }

    for (const b of BUILDINGS) {
      const top = b.pos.y - b.wallHeight - 30;
      const bot = b.pos.y + b.size.y + 12;
      if (!this.visible(b.pos.x - 12, top, b.size.x + 24, bot - top, view)) continue;
      items.push({ key: b.pos.y + b.size.y, x: b.pos.x, draw: () => drawBuilding(ctx, b) });
    }

    for (const it of INTERACTIVES) {
      if (!this.visible(it.pos.x - 10, it.pos.y - it.size.y * 1.6, it.size.x + 20, it.size.y * 2.2, view)) continue;
      items.push({
        key: it.pos.y + it.size.y,
        x: it.pos.x,
        draw: () => drawInteractive(ctx, it, performance.now() / 1000),
      });
    }

    for (const g of extras.gates || []) {
      if (!this.visible(g.pos.x - 10, g.pos.y - 10, g.size.x + 20, g.size.y + 20, view)) continue;
      items.push({ key: g.pos.y + g.size.y, x: g.pos.x, draw: () => drawGate(ctx, g) });
    }

    items.sort((a, b) => a.key - b.key || a.x - b.x);
    for (const it of items) it.draw();
  }

  /**
   * Ambient-darkness pass with soft pools of light around glow sources, applied
   * with multiply blending so the uplights genuinely brighten the ground.
   */
  private drawLighting(ctx: CanvasRenderingContext2D, view: EnvView, extras: EnvExtras) {
    // Ambient darkness scales with the clock: bright at noon, deep at night.
    const daylight = extras.daylight ?? 1;
    const ambient = 0.18 + daylight * 0.72; // 0.18 (night) .. 0.9 (day)
    const a = Math.round(200 * ambient + 40);

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(${a},${a},${Math.min(255, a + 8)},1)`;
    ctx.fillRect(view.x, view.y, view.w, view.h);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // Fixtures glow more at night.
    const glowBoost = 1 + (1 - daylight) * 1.6;
    for (const it of INTERACTIVES) {
      const cx = it.pos.x + it.size.x / 2;
      const baseY = it.pos.y + it.size.y;
      if (!this.visible(cx - 130, baseY - 140, 260, 240, view)) continue;
      const warm = it.interactiveKind === 'campfire' || it.interactiveKind === 'lever';
      const rad = warm ? 150 : 100;
      const g = ctx.createRadialGradient(cx, baseY - 12, 0, cx, baseY - 12, rad);
      g.addColorStop(0, withAlpha(it.color, (warm ? 0.3 : 0.14) * glowBoost));
      g.addColorStop(1, withAlpha(it.color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(cx - rad, baseY - 12 - rad, rad * 2, rad * 2);
    }
    for (const p of PROPS) {
      const cx = p.pos.x + p.size.x / 2;
      const baseY = p.pos.y + p.size.y;
      if (!this.visible(cx - 120, baseY - 160, 240, 240, view)) continue;
      const warm = p.propKind === 'lamp' || p.propKind === 'clock' || p.propKind === 'neon';
      const rad = warm ? 130 : 90;
      const g = ctx.createRadialGradient(cx, baseY - 10, 0, cx, baseY - 10, rad);
      g.addColorStop(0, withAlpha(p.color, (warm ? 0.16 : 0.08) * glowBoost));
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
    for (const b of BUILDINGS) {
      const top = b.pos.y - b.wallHeight - 40;
      const bot = b.pos.y + b.size.y;
      if (!this.visible(b.pos.x - 40, top, b.size.x + 80, bot - top, view)) continue;
      buildingEmissive(ctx, b);
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
