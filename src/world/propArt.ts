import { PropKind } from '../types';
import { shade, withAlpha, hash01 } from '../engine/color';
import { Ctx, poly, ellipse, linear } from './canvasUtils';

/** Soft ground shadow, drawn before the prop so it sits underneath. */
export function propShadow(ctx: Ctx, cx: number, baseY: number, w: number, h: number) {
  const rx = Math.max(w, h) * 0.55;
  const g = ctx.createRadialGradient(cx, baseY, 0, cx, baseY, rx);
  g.addColorStop(0, 'rgba(0,0,0,0.4)');
  g.addColorStop(0.7, 'rgba(0,0,0,0.16)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, baseY, rx, rx * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws the solid body of a scenery prop. Coordinates are the prop's centre-x
 * and its ground line; `w`/`h` are the entity's declared size and `color` is
 * the themed accent. Everything is procedural vector art — no image assets.
 */
export function drawProp(ctx: Ctx, kind: PropKind, cx: number, baseY: number, w: number, h: number, color: string, seed: string) {
  const s = Math.max(w, h);
  switch (kind) {
    case 'tree': {
      const canopyY = baseY - h * 0.62;
      ctx.fillStyle = shade('#5a3d24', -0.1);
      ctx.fillRect(cx - s * 0.1, baseY - h * 0.42, s * 0.2, h * 0.42);
      ellipse(ctx, cx, canopyY - s * 0.2, s * 0.62, s * 0.55, linear(ctx, canopyY - s, canopyY + s * 0.5, shade(color, 0.35), shade(color, -0.3)));
      ellipse(ctx, cx - s * 0.42, canopyY + s * 0.12, s * 0.46, s * 0.42, linear(ctx, canopyY - s, canopyY + s * 0.5, shade(color, 0.15), shade(color, -0.35)));
      ellipse(ctx, cx + s * 0.42, canopyY + s * 0.12, s * 0.46, s * 0.42, linear(ctx, canopyY - s, canopyY + s * 0.5, shade(color, 0.15), shade(color, -0.35)));
      break;
    }
    case 'pine': {
      const trunk = h * 0.22;
      ctx.fillStyle = shade('#4a3320', -0.1);
      ctx.fillRect(cx - s * 0.08, baseY - trunk, s * 0.16, trunk);
      ctx.fillStyle = linear(ctx, baseY - h, baseY, shade(color, 0.2), shade(color, -0.35));
      for (let i = 0; i < 3; i++) {
        const top = baseY - h + i * h * 0.24;
        const spread = s * (0.28 + i * 0.24);
        poly(ctx, [[cx, top], [cx + spread, top + h * 0.32], [cx - spread, top + h * 0.32]], linear(ctx, baseY - h, baseY, shade(color, 0.2), shade(color, -0.35)));
      }
      break;
    }
    case 'bush': {
      const g = linear(ctx, baseY - h, baseY, shade(color, 0.25), shade(color, -0.35));
      ellipse(ctx, cx - s * 0.22, baseY - h * 0.35, s * 0.4, s * 0.34, g);
      ellipse(ctx, cx + s * 0.22, baseY - h * 0.32, s * 0.4, s * 0.32, shade(color, -0.15));
      ellipse(ctx, cx, baseY - h * 0.55, s * 0.46, s * 0.4, shade(color, 0.1));
      break;
    }
    case 'flower': {
      const sway = Math.sin(Date.now() / 900 + hash01(seed, 1) * 6) * 2;
      ctx.strokeStyle = '#3f7a3a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, baseY);
      ctx.quadraticCurveTo(cx + sway, baseY - h * 0.6, cx + sway * 1.5, baseY - h);
      ctx.stroke();
      ellipse(ctx, cx + sway * 1.5, baseY - h, s * 0.22, s * 0.22, color);
      ellipse(ctx, cx + sway * 1.5, baseY - h, s * 0.1, s * 0.1, shade(color, 0.6));
      break;
    }
    case 'grass': {
      ctx.strokeStyle = shade(color, -0.1);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (let i = -2; i <= 2; i++) {
        const bx = cx + i * s * 0.18;
        const lean = i * 3;
        ctx.beginPath();
        ctx.moveTo(bx, baseY);
        ctx.quadraticCurveTo(bx + lean * 0.5, baseY - h * 0.6, bx + lean, baseY - h);
        ctx.stroke();
      }
      break;
    }
    case 'rock': {
      poly(ctx, [
        [cx - s * 0.6, baseY],
        [cx - s * 0.45, baseY - h * 0.55],
        [cx - s * 0.05, baseY - h * 0.72],
        [cx + s * 0.5, baseY - h * 0.5],
        [cx + s * 0.62, baseY],
      ], linear(ctx, baseY - h, baseY, shade(color, 0.18), shade(color, -0.4)));
      poly(ctx, [
        [cx - s * 0.45, baseY - h * 0.55],
        [cx - s * 0.05, baseY - h * 0.72],
        [cx + s * 0.05, baseY - h * 0.4],
      ], withAlpha('#ffffff', 0.12));
      break;
    }
    case 'barrel': {
      const bw = s * 0.8;
      ctx.fillStyle = linear(ctx, baseY - h, baseY, shade(color, 0.25), shade(color, -0.35));
      ctx.beginPath();
      ctx.moveTo(cx - bw / 2, baseY - h);
      ctx.quadraticCurveTo(cx - bw * 0.62, baseY - h / 2, cx - bw / 2, baseY);
      ctx.lineTo(cx + bw / 2, baseY);
      ctx.quadraticCurveTo(cx + bw * 0.62, baseY - h / 2, cx + bw / 2, baseY - h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = shade('#3a3a3a', 0.1);
      ctx.fillRect(cx - bw * 0.56, baseY - h * 0.78, bw * 1.12, 3);
      ctx.fillRect(cx - bw * 0.56, baseY - h * 0.28, bw * 1.12, 3);
      break;
    }
    case 'crate': {
      const g = linear(ctx, baseY - h, baseY, shade(color, 0.2), shade(color, -0.3));
      ctx.fillStyle = g;
      ctx.fillRect(cx - s * 0.55, baseY - h, s * 1.1, h);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - s * 0.55, baseY - h, s * 1.1, h);
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.55, baseY - h);
      ctx.lineTo(cx + s * 0.55, baseY);
      ctx.moveTo(cx + s * 0.55, baseY - h);
      ctx.lineTo(cx - s * 0.55, baseY);
      ctx.stroke();
      break;
    }
    case 'lamp': {
      ctx.fillStyle = shade('#2a2f36', 0.05);
      ctx.fillRect(cx - s * 0.06, baseY - h, s * 0.12, h);
      ctx.fillRect(cx - s * 0.22, baseY - h - s * 0.1, s * 0.44, s * 0.12);
      ellipse(ctx, cx, baseY - h - s * 0.06, s * 0.16, s * 0.14, color);
      break;
    }
    case 'fence': {
      ctx.fillStyle = shade('#6b5238', -0.05);
      const wpx = s * 0.12;
      ctx.fillRect(cx - s * 0.55, baseY - h, wpx, h);
      ctx.fillRect(cx + s * 0.43, baseY - h, wpx, h);
      ctx.fillRect(cx - s * 0.6, baseY - h * 0.7, s * 1.2, h * 0.14);
      ctx.fillRect(cx - s * 0.6, baseY - h * 0.38, s * 1.2, h * 0.14);
      break;
    }
    case 'neon': {
      ctx.fillStyle = 'rgba(15,15,20,0.9)';
      ctx.fillRect(cx - w / 2, baseY - h, w, h);
      ctx.strokeStyle = withAlpha(color, 0.9);
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - w / 2 + 2, baseY - h + 2, w - 4, h - 4);
      break;
    }
    case 'terminal': {
      ctx.fillStyle = '#20252c';
      ctx.fillRect(cx - w / 2, baseY - h * 2.1, w, h * 1.5);
      ctx.fillStyle = '#0a1a0f';
      ctx.fillRect(cx - w / 2 + 3, baseY - h * 2.02, w - 6, h * 1.34);
      ctx.fillStyle = shade('#1c2129', 0.05);
      ctx.fillRect(cx - w * 0.6, baseY - h * 0.6, w * 1.2, h * 0.14);
      ctx.fillRect(cx - 3, baseY - h * 0.5, 6, h * 0.5);
      break;
    }
    case 'server': {
      ctx.fillStyle = '#171b21';
      ctx.fillRect(cx - w / 2, baseY - h, w, h);
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - w / 2, baseY - h, w, h);
      const rows = 5;
      for (let i = 0; i < rows; i++) {
        const y = baseY - h + 6 + i * (h - 12) / rows;
        ctx.fillStyle = '#0c0f13';
        ctx.fillRect(cx - w / 2 + 4, y, w - 8, (h - 12) / rows - 3);
      }
      break;
    }
    case 'console': {
      const cw = s * 0.95;
      ctx.fillStyle = '#1a1420';
      ctx.fillRect(cx - cw / 2, baseY - h * 1.5, cw, h * 1.5);
      ctx.fillStyle = '#0b0e12';
      ctx.fillRect(cx - cw * 0.4, baseY - h * 1.42, cw * 0.8, h * 0.72);
      ctx.fillStyle = shade(color, -0.1);
      ctx.fillRect(cx - cw * 0.46, baseY - h * 0.62, cw * 0.92, h * 0.22);
      break;
    }
    case 'portal': {
      const r = s * 0.62;
      const cy = baseY - r;
      const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
      g.addColorStop(0, withAlpha(color, 0.75));
      g.addColorStop(0.7, withAlpha(color, 0.25));
      g.addColorStop(1, withAlpha(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = withAlpha(shade(color, 0.4), 0.9);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 0.7, r * 0.85, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'book': {
      const bw = s * 0.9;
      for (let i = 0; i < 3; i++) {
        const yy = baseY - i * h * 0.3 - h * 0.3;
        ctx.fillStyle = i % 2 ? shade(color, -0.1) : shade('#7a3a3a', 0.15);
        ctx.fillRect(cx - bw / 2 + i * 2, yy, bw - i * 4, h * 0.28);
        ctx.fillStyle = '#e8e0c8';
        ctx.fillRect(cx + bw / 2 - i * 4 - 5, yy + 2, 4, h * 0.24);
      }
      break;
    }
    case 'skull': {
      ellipse(ctx, cx, baseY - h * 0.62, s * 0.42, s * 0.4, '#e6e2d6');
      poly(ctx, [[cx - s * 0.24, baseY - h * 0.32], [cx + s * 0.24, baseY - h * 0.32], [cx + s * 0.16, baseY - h * 0.08], [cx - s * 0.16, baseY - h * 0.08]], '#d8d3c4');
      ellipse(ctx, cx - s * 0.16, baseY - h * 0.66, s * 0.1, s * 0.11, '#20242b');
      ellipse(ctx, cx + s * 0.16, baseY - h * 0.66, s * 0.1, s * 0.11, '#20242b');
      break;
    }
    case 'statue': {
      ctx.fillStyle = shade(color, -0.35);
      ctx.fillRect(cx - s * 0.5, baseY - h * 0.28, s, h * 0.28);
      const g = linear(ctx, baseY - h, baseY - h * 0.3, shade(color, 0.25), shade(color, -0.25));
      ellipse(ctx, cx, baseY - h * 0.78, s * 0.22, s * 0.24, g);
      ctx.fillStyle = g;
      ctx.fillRect(cx - s * 0.26, baseY - h * 0.62, s * 0.52, h * 0.42);
      break;
    }
    case 'column': {
      ctx.fillStyle = linear(ctx, baseY - h, baseY, shade(color, 0.25), shade(color, -0.35));
      ctx.fillRect(cx - s * 0.22, baseY - h, s * 0.44, h);
      ctx.fillStyle = shade(color, 0.1);
      ctx.fillRect(cx - s * 0.34, baseY - h - s * 0.12, s * 0.68, s * 0.14);
      ctx.fillRect(cx - s * 0.34, baseY - s * 0.1, s * 0.68, s * 0.12);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.22 + i * s * 0.11, baseY - h);
        ctx.lineTo(cx - s * 0.22 + i * s * 0.11, baseY);
        ctx.stroke();
      }
      break;
    }
    case 'monitor': {
      ctx.fillStyle = shade('#20252c', -0.1);
      ctx.fillRect(cx - s * 0.7, baseY - h * 2.4, s * 1.4, h * 0.16);
      ctx.fillRect(cx - s * 0.08, baseY - h * 2.24, s * 0.16, h * 1.1);
      ctx.fillStyle = '#161a20';
      ctx.fillRect(cx - s * 0.6, baseY - h * 1.5, s * 1.2, h * 0.9);
      ctx.fillStyle = '#0a1a2a';
      ctx.fillRect(cx - s * 0.54, baseY - h * 1.44, s * 1.08, h * 0.78);
      break;
    }
    case 'clock': {
      const r = s * 0.62;
      const cy = baseY - r - 4;
      ctx.fillStyle = linear(ctx, cy - r, cy + r, shade(color, 0.5), shade(color, -0.35));
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - r * 0.6);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r * 0.45, cy + r * 0.2);
      ctx.stroke();
      break;
    }
    case 'board': {
      ctx.fillStyle = shade('#5a3d24', -0.1);
      ctx.fillRect(cx - 3, baseY - h * 0.35, 6, h * 0.35);
      ctx.fillStyle = linear(ctx, baseY - h, baseY - h * 0.35, shade(color, 0.16), shade(color, -0.24));
      ctx.fillRect(cx - w / 2, baseY - h, w, h * 0.65);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - w / 2, baseY - h, w, h * 0.65);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 ? '#e9e2c8' : '#d9d2b4';
        ctx.fillRect(cx - w / 2 + 6 + hash01(seed + i, 4) * (w - 22), baseY - h + 5 + hash01(seed + i, 9) * (h * 0.65 - 18), 9, 11);
      }
      break;
    }
    case 'banner':
      break; // handled as a world object
    case 'adboard': {
      // Lit roadside billboard.
      ctx.fillStyle = shade('#20242c', -0.2);
      ctx.fillRect(cx - 4, baseY - h * 0.5, 8, h * 0.5);
      ctx.fillStyle = linear(ctx, baseY - h, baseY - h * 0.5, shade(color, 0.2), shade(color, -0.3));
      ctx.fillRect(cx - w / 2, baseY - h, w, h * 0.55);
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - w / 2, baseY - h, w, h * 0.55);
      ctx.fillStyle = withAlpha('#ffffff', 0.85);
      ctx.fillRect(cx - w * 0.4, baseY - h + h * 0.12, w * 0.8, h * 0.06);
      ctx.fillRect(cx - w * 0.4, baseY - h + h * 0.24, w * 0.55, h * 0.06);
      break;
    }
    case 'statue_risque': {
      // Classical marble figure (Venus-style), kept abstract and tasteful.
      ctx.fillStyle = shade('#cfc6ba', -0.4);
      ctx.fillRect(cx - s * 0.5, baseY - h * 0.24, s, h * 0.24);
      const g = linear(ctx, baseY - h, baseY - h * 0.3, shade('#e6ded2', 0.1), shade('#b8ada0', -0.2));
      // Hips and legs.
      ctx.fillStyle = g;
      ctx.fillRect(cx - s * 0.24, baseY - h * 0.62, s * 0.48, h * 0.42);
      // Torso.
      ctx.beginPath();
      ctx.ellipse(cx, baseY - h * 0.72, s * 0.26, h * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Implied chest — two simple forms, no detail.
      ctx.beginPath();
      ctx.arc(cx - s * 0.11, baseY - h * 0.8, s * 0.09, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.11, baseY - h * 0.8, s * 0.09, 0, Math.PI * 2);
      ctx.fill();
      // Head.
      ctx.beginPath();
      ctx.arc(cx, baseY - h * 0.98, s * 0.13, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'dumpster': {
      ctx.fillStyle = linear(ctx, baseY - h, baseY, shade(color, 0.2), shade(color, -0.3));
      ctx.fillRect(cx - w / 2, baseY - h * 0.8, w, h * 0.8);
      ctx.fillStyle = shade(color, 0.35);
      ctx.fillRect(cx - w / 2 - 2, baseY - h, w + 4, h * 0.22);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - w / 2, baseY - h * 0.8, w, h * 0.8);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(cx - w / 2 + 4, baseY - h * 0.7, w - 8, h * 0.08);
      break;
    }
    case 'beer_tap': {
      ctx.fillStyle = shade('#3a2a1a', -0.1);
      ctx.fillRect(cx - s * 0.3, baseY - h, s * 0.6, h);
      ctx.fillStyle = linear(ctx, baseY - h * 1.5, baseY - h, shade(color, 0.3), shade(color, -0.2));
      ctx.fillRect(cx - s * 0.14, baseY - h * 1.4, s * 0.28, h * 0.5);
      ctx.fillStyle = '#c9c9c9';
      ctx.fillRect(cx - s * 0.2, baseY - h * 0.95, s * 0.4, h * 0.08);
      break;
    }
    default: {
      ctx.fillStyle = color;
      ctx.fillRect(cx - w / 2, baseY - h, w, h);
      break;
    }
  }
}

/** Emissive accents drawn after the lighting pass so lights actually glow. */
export function propEmissive(ctx: Ctx, kind: PropKind, cx: number, baseY: number, w: number, h: number, color: string, seed: string) {
  const s = Math.max(w, h);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const blob = (y: number, r: number, col: string) => {
    const g = ctx.createRadialGradient(cx, y, 0, cx, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, withAlpha(col, 0));
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, y - r, r * 2, r * 2);
  };
  switch (kind) {
    case 'lamp': blob(baseY - h - s * 0.06, s * 1.6, withAlpha(color, 0.5)); break;
    case 'neon':
      blob(baseY - h / 2, Math.max(w, h) * 1.1, withAlpha(color, 0.4));
      break;
    case 'portal': blob(baseY - s * 0.62, s * 1.3, withAlpha(color, 0.45)); break;
    case 'terminal':
      ctx.fillStyle = '#4dff88';
      ctx.font = `${Math.round(h * 0.28)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('> _', cx, baseY - h * 1.5);
      blob(baseY - h * 1.4, s * 0.9, 'rgba(60,255,140,0.35)');
      break;
    case 'server': {
      const rows = 5;
      for (let i = 0; i < rows; i++) {
        const y = baseY - h + 8 + i * (h - 12) / rows;
        const on = hash01(seed + i, 2) > 0.4;
        ctx.fillStyle = on ? '#39ff88' : '#ff6a3d';
        ctx.fillRect(cx + w / 2 - 8, y + 1, 3, 3);
      }
      break;
    }
    case 'console':
      ctx.fillStyle = withAlpha(color, 0.5);
      ctx.fillRect(cx - s * 0.38, baseY - h * 1.4, s * 0.76, h * 0.7);
      break;
    case 'monitor':
      blob(baseY - h * 1.05, s * 1.1, 'rgba(80,180,255,0.28)');
      break;
    case 'clock':
      blob(baseY - s * 0.62 - 4, s * 0.9, withAlpha(color, 0.3));
      break;
    case 'adboard':
      blob(baseY - h * 0.7, s * 1.0, withAlpha(color, 0.28));
      break;
    case 'beer_tap':
      blob(baseY - h * 1.2, s * 0.8, withAlpha(color, 0.3));
      break;
    default:
      break;
  }
  ctx.restore();
}
