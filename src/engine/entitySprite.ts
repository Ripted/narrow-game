import { Appearance, Entity, HairStyle } from '../types';

type Facing = 'down' | 'up' | 'left' | 'right';

interface AnimState {
  prevX: number;
  prevY: number;
  phase: number;
  facing: Facing;
  moving: boolean;
}

/** Multiplies a hex colour towards black (amount < 0) or white (amount > 0). */
function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  if (amount < 0) {
    const k = 1 + amount;
    r = Math.round(r * k); g = Math.round(g * k); b = Math.round(b * k);
  } else {
    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (255 - g) * amount);
    b = Math.round(b + (255 - b) * amount);
  }
  return `rgb(${r}, ${g}, ${b})`;
}

const HAIR_STYLES: HairStyle[] = ['short', 'long', 'spiky', 'bun', 'ponytail'];

/** Deterministic fallback so nothing ever renders unclothed. */
export function defaultAppearance(color: string): Appearance {
  let hash = 0;
  for (let i = 0; i < color.length; i++) hash = (hash * 31 + color.charCodeAt(i)) >>> 0;
  return {
    skin: '#eec2a4',
    hair: '#3a2a20',
    hairStyle: HAIR_STYLES[hash % HAIR_STYLES.length],
    shirt: color,
    pants: '#2b2f36',
    shoes: '#14171c',
    height: 1,
    build: 1,
  };
}

/**
 * Draws entities as stylised humans with a limb-driven walk cycle.
 *
 * The system is stateful: it watches each entity's position between frames to
 * infer speed and facing, so callers only need to call `update` then `draw`.
 * Objects (maps, timers, plaques) keep their simple rectangle rendering.
 */
export class EntitySpriteSystem {
  private states = new Map<string, AnimState>();

  update(entity: Entity, dtMs: number) {
    let state = this.states.get(entity.id);
    if (!state) {
      state = { prevX: entity.pos.x, prevY: entity.pos.y, phase: 0, facing: 'down', moving: false };
      this.states.set(entity.id, state);
    }

    const dx = entity.pos.x - state.prevX;
    const dy = entity.pos.y - state.prevY;
    const speed = Math.hypot(dx, dy);
    state.prevX = entity.pos.x;
    state.prevY = entity.pos.y;

    // Guard against teleports (debug jumps, spawn placement).
    const moving = speed > 0.05 && speed < 40;
    state.moving = moving;

    if (moving) {
      if (Math.abs(dx) >= Math.abs(dy)) {
        state.facing = dx < 0 ? 'left' : 'right';
      } else {
        state.facing = dy < 0 ? 'up' : 'down';
      }
      // Advance the walk cycle in step with how far the entity travelled.
      state.phase += Math.min(speed, 6) * (dtMs / 16) * 0.055;
    }
  }

  facingOf(id: string): Facing {
    return this.states.get(id)?.facing ?? 'down';
  }

  draw(
    ctx: CanvasRenderingContext2D,
    entity: Entity,
    opts: { hp?: { hp: number; maxHp: number } } = {}
  ) {
    if (entity.type === 'object') {
      this.drawObject(ctx, entity);
      return;
    }

    const look = entity.appearance ?? defaultAppearance(entity.color);
    const state = this.states.get(entity.id);
    const phase = state?.phase ?? 0;
    const moving = state?.moving ?? false;
    const facing = state?.facing ?? 'down';

    const cx = entity.pos.x + entity.size.x / 2;
    const groundY = entity.pos.y + entity.size.y;
    const u = Math.max(entity.size.x, 30) / 28;
    const H = 50 * look.height * u;

    if (look.glow) {
      const gl = ctx.createRadialGradient(cx, groundY - H * 0.5, 2, cx, groundY - H * 0.5, H * 0.8);
      gl.addColorStop(0, look.glow);
      gl.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(cx - H, groundY - H * 1.6, H * 2, H * 2);
    }

    ctx.save();
    if (look.opacity !== undefined) ctx.globalAlpha = look.opacity;
    this.drawBody(ctx, cx, groundY, u, H, look, phase, moving, facing);
    ctx.restore();

    // Nameplate above the head.
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `${Math.round(11 + u)}px Inter`;
    ctx.textAlign = 'center';
    ctx.fillText(entity.name, cx, groundY - H - 8 * u);

    if (opts.hp) {
      this.drawHealthBar(ctx, cx, groundY - H - 4 * u, Math.max(entity.size.x, 44), opts.hp);
    }
  }

  private drawObject(ctx: CanvasRenderingContext2D, entity: Entity) {
    const { pos, size, color } = entity;
    ctx.fillStyle = color;
    ctx.fillRect(pos.x, pos.y, size.x, size.y);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(pos.x, pos.y, size.x, size.y);
  }

  private drawHealthBar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    y: number,
    width: number,
    hp: { hp: number; maxHp: number }
  ) {
    const barW = width;
    const barX = cx - barW / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(barX, y, barW, 5);
    ctx.fillStyle = '#ff3b3b';
    ctx.fillRect(barX, y, barW * Math.max(0, hp.hp / hp.maxHp), 5);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, y, barW, 5);
  }

  private drawBody(
    ctx: CanvasRenderingContext2D,
    cx: number,
    groundY: number,
    u: number,
    H: number,
    look: Appearance,
    phase: number,
    moving: boolean,
    facing: Facing
  ) {
    const build = look.build;
    const hipY = groundY - 0.5 * H;
    const shoulderY = groundY - 0.78 * H;
    const headR = 0.115 * H;
    const headCY = groundY - 0.885 * H;

    const legHalf = 2.2 * u * build;
    const hipHW = 4.2 * u * build;
    const shoulderHW = 5.6 * u * build;

    const thighLen = 0.22 * H;
    const shinLen = 0.28 * H;
    const upperArmLen = 0.2 * H;
    const foreArmLen = 0.19 * H;

    const swingA = moving ? Math.sin(phase) : 0;
    const swingB = moving ? Math.sin(phase + Math.PI) : 0;
    const bob = moving ? Math.abs(Math.sin(phase)) * 0.6 * u : Math.sin(Date.now() / 600) * 0.4 * u;

    const side = facing === 'left' || facing === 'right';
    const drawOrderBack: Array<() => void> = [];
    const drawOrderFront: Array<() => void> = [];

    const leg = (hx: number, swing: number, p: number, front: boolean) => () => {
      const lift = moving ? Math.max(0, Math.cos(p)) * 0.55 : 0;
      const thighAngle = swing * 0.6;
      const shinAngle = thighAngle - lift;
      const kneeX = hx - thighLen * Math.sin(thighAngle);
      const kneeY = hipY + thighLen * Math.cos(thighAngle) + bob;
      const footX = kneeX - shinLen * Math.sin(shinAngle);
      const footY = kneeY + shinLen * Math.cos(shinAngle);

      ctx.strokeStyle = front ? look.pants : shade(look.pants, -0.2);
      ctx.lineWidth = 3.4 * u * build;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx, hipY + bob);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(footX, footY);
      ctx.stroke();

      // Shoe
      ctx.fillStyle = front ? look.shoes : shade(look.shoes, -0.2);
      ctx.beginPath();
      ctx.ellipse(footX + (side ? (facing === 'right' ? 1.2 * u : -1.2 * u) : 0), footY, 2.4 * u, 1.5 * u, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    const arm = (sx: number, swing: number, sideFar: boolean) => () => {
      const upperAngle = -swing * 0.6;
      const elbowX = sx - upperArmLen * Math.sin(upperAngle);
      const elbowY = shoulderY + upperArmLen * Math.cos(upperAngle) + bob;
      const foreAngle = upperAngle - 0.3;
      const handX = elbowX - foreArmLen * Math.sin(foreAngle);
      const handY = elbowY + foreArmLen * Math.cos(foreAngle);
      const sleeveColor = sideFar ? shade(look.shirt, -0.22) : look.shirt;
      const skinColor = sideFar ? shade(look.skin, -0.18) : look.skin;

      ctx.lineCap = 'round';
      ctx.strokeStyle = sleeveColor;
      ctx.lineWidth = 3 * u * build;
      ctx.beginPath();
      ctx.moveTo(sx, shoulderY + bob);
      ctx.lineTo(elbowX, elbowY);
      ctx.stroke();

      ctx.strokeStyle = skinColor;
      ctx.lineWidth = 2.5 * u * build;
      ctx.beginPath();
      ctx.moveTo(elbowX, elbowY);
      ctx.lineTo(handX, handY);
      ctx.stroke();

      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(handX, handY, 1.5 * u, 0, Math.PI * 2);
      ctx.fill();
    };

    if (side) {
      // Facing left/right: far limbs behind the torso, near limbs in front.
      const nearSign = facing === 'right' ? 1 : -1;
      drawOrderBack.push(leg(cx - legHalf * nearSign, swingB, phase + Math.PI, false));
      drawOrderBack.push(arm(cx - (shoulderHW + 0.5 * u) * nearSign, swingB, true));
      drawOrderFront.push(leg(cx + legHalf * nearSign, swingA, phase, true));
      drawOrderFront.push(arm(cx + (shoulderHW + 0.5 * u) * nearSign, swingA, false));
    } else {
      drawOrderFront.push(leg(cx - legHalf, swingA, phase, true));
      drawOrderFront.push(leg(cx + legHalf, swingB, phase + Math.PI, true));
      drawOrderFront.push(arm(cx - shoulderHW - 0.5 * u, swingB, false));
      drawOrderFront.push(arm(cx + shoulderHW + 0.5 * u, swingA, false));
    }

    drawOrderBack.forEach((fn) => fn());

    // Torso: a tapered, slightly rounded shape from hips to shoulders.
    const torsoTop = shoulderY + bob;
    const torsoBottom = hipY + bob;
    ctx.fillStyle = look.shirt;
    ctx.beginPath();
    ctx.moveTo(cx - shoulderHW, torsoTop + 1.5 * u);
    ctx.quadraticCurveTo(cx, torsoTop - 1.5 * u, cx + shoulderHW, torsoTop + 1.5 * u);
    ctx.lineTo(cx + hipHW, torsoBottom);
    ctx.quadraticCurveTo(cx, torsoBottom + 1.5 * u, cx - hipHW, torsoBottom);
    ctx.closePath();
    ctx.fill();

    if (side) {
      // A little shading on the trailing edge sells the silhouette.
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.beginPath();
      const edge = facing === 'right' ? cx - shoulderHW : cx + shoulderHW;
      ctx.moveTo(edge, torsoTop + 1.5 * u);
      ctx.lineTo(cx, torsoTop + 1.5 * u);
      ctx.lineTo(cx, torsoBottom);
      ctx.lineTo(facing === 'right' ? cx - hipHW : cx + hipHW, torsoBottom);
      ctx.closePath();
      ctx.fill();
    }

    // Belt
    ctx.fillStyle = shade(look.pants, -0.25);
    ctx.fillRect(cx - hipHW, torsoBottom - 2 * u, hipHW * 2, 2.2 * u);

    drawOrderFront.forEach((fn) => fn());

    this.drawHead(ctx, cx, headCY + bob, headR, u, look, facing);
  }

  private drawHead(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    u: number,
    look: Appearance,
    facing: Facing
  ) {
    // Neck
    ctx.strokeStyle = shade(look.skin, -0.12);
    ctx.lineWidth = 3 * u;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.5);
    ctx.lineTo(cx, cy + r * 1.4);
    ctx.stroke();

    // Head
    ctx.fillStyle = look.skin;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.92, r, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = look.hair;
    this.drawHair(ctx, cx, cy, r, look.hairStyle, facing);

    if (facing !== 'up') {
      ctx.fillStyle = '#20242b';
      const eyeDX = facing === 'left' ? -r * 0.3 : facing === 'right' ? r * 0.3 : r * 0.32;
      if (facing === 'left' || facing === 'right') {
        ctx.beginPath();
        ctx.arc(cx + eyeDX, cy + r * 0.05, r * 0.13, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(cx - r * 0.32, cy + r * 0.05, r * 0.13, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.32, cy + r * 0.05, r * 0.13, 0, Math.PI * 2);
        ctx.fill();
      }
      // Mouth
      ctx.strokeStyle = shade(look.skin, -0.35);
      ctx.lineWidth = Math.max(1, r * 0.08);
      ctx.beginPath();
      ctx.arc(cx + (facing === 'down' ? 0 : eyeDX), cy + r * 0.42, r * 0.22, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  }

  private drawHair(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    style: HairStyle,
    facing: Facing
  ) {
    const top = cy - r;
    switch (style) {
      case 'bald':
        break;
      case 'short':
        ctx.beginPath();
        ctx.ellipse(cx, cy - r * 0.35, r * 0.98, r * 0.72, 0, Math.PI, 0);
        ctx.fill();
        break;
      case 'spiky': {
        ctx.beginPath();
        ctx.ellipse(cx, cy - r * 0.35, r * 0.98, r * 0.66, 0, Math.PI, 0);
        ctx.fill();
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + i * r * 0.36 - r * 0.16, cy - r * 0.7);
          ctx.lineTo(cx + i * r * 0.36, top - r * 0.55);
          ctx.lineTo(cx + i * r * 0.36 + r * 0.16, cy - r * 0.7);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case 'long':
        ctx.beginPath();
        ctx.ellipse(cx, cy - r * 0.3, r * 1.02, r * 0.75, 0, Math.PI, 0);
        ctx.fill();
        if (facing !== 'up') {
          ctx.beginPath();
          ctx.ellipse(cx - r * 0.95, cy + r * 0.25, r * 0.36, r * 0.85, 0, 0, Math.PI * 2);
          ctx.ellipse(cx + r * 0.95, cy + r * 0.25, r * 0.36, r * 0.85, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.ellipse(cx, cy + r * 0.2, r * 0.95, r * 0.95, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'bun':
        ctx.beginPath();
        ctx.ellipse(cx, cy - r * 0.35, r * 0.98, r * 0.72, 0, Math.PI, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, top - r * 0.2, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'ponytail':
        ctx.beginPath();
        ctx.ellipse(cx, cy - r * 0.35, r * 0.98, r * 0.72, 0, Math.PI, 0);
        ctx.fill();
        if (facing !== 'up') {
          ctx.beginPath();
          ctx.ellipse(cx + r * 0.9, cy + r * 0.35, r * 0.3, r * 0.7, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
    }
  }

  /** Bust-style portrait for the dialogue box, matching the world sprite. */
  drawPortrait(
    ctx: CanvasRenderingContext2D,
    entity: Entity,
    x: number,
    y: number,
    size: number
  ) {
    const look = entity.appearance ?? defaultAppearance(entity.color);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.clip();

    // Background
    const bg = ctx.createLinearGradient(x, y, x, y + size);
    bg.addColorStop(0, 'rgba(20,26,34,1)');
    bg.addColorStop(1, 'rgba(8,10,14,1)');
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, size, size);

    const cx = x + size / 2;
    const headR = size * 0.26;
    const headCY = y + size * 0.42;

    // Shoulders / clothing
    ctx.fillStyle = look.shirt;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.12, y + size);
    ctx.quadraticCurveTo(cx, y + size * 0.62, x + size * 0.88, y + size);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.moveTo(cx, y + size * 0.66);
    ctx.lineTo(x + size * 0.88, y + size);
    ctx.lineTo(cx, y + size);
    ctx.closePath();
    ctx.fill();

    // Neck
    ctx.fillStyle = shade(look.skin, -0.12);
    ctx.fillRect(cx - size * 0.07, headCY + headR * 0.7, size * 0.14, size * 0.16);

    // Head
    ctx.fillStyle = look.skin;
    ctx.beginPath();
    ctx.ellipse(cx, headCY, headR * 0.9, headR, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = look.hair;
    this.drawHair(ctx, cx, headCY, headR, look.hairStyle, 'down');

    // Eyes
    ctx.fillStyle = '#20242b';
    ctx.beginPath();
    ctx.arc(cx - headR * 0.34, headCY + headR * 0.08, headR * 0.12, 0, Math.PI * 2);
    ctx.arc(cx + headR * 0.34, headCY + headR * 0.08, headR * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = shade(look.skin, -0.4);
    ctx.lineWidth = Math.max(1, size * 0.012);
    ctx.beginPath();
    ctx.arc(cx, headCY + headR * 0.42, headR * 0.24, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    ctx.restore();
  }
}
