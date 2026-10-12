import { Interior } from '../types';
import { shade, withAlpha, hash01 } from '../engine/color';

/**
 * Draws an interior room in local coordinates. Everything is procedural and
 * deterministic, matching the flat vector look of the exterior building art.
 * Callers must already have translated the canvas so (0,0) is the room origin.
 */
export function drawInterior(ctx: CanvasRenderingContext2D, room: Interior, timeOfDay: number) {
  const { width: w, height: h } = room;

  // Floor: a vertical gradient with a subtle plank/mottle pattern.
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, shade(room.floor, 0.12));
  g.addColorStop(1, shade(room.floor, -0.16));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();
  for (let i = 0; i < 40; i++) {
    const x = hash01(room.id + i, 21) * w;
    const y = hash01(room.id + i, 22) * h;
    const r = 20 + hash01(room.id + i, 23) * 50;
    ctx.fillStyle = withAlpha(i % 2 ? shade(room.floor, 0.24) : shade(room.floor, -0.24), 0.1);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Walls: a thick band around the room with an inner shadow.
  const wall = 20;
  ctx.fillStyle = room.wall;
  ctx.fillRect(0, 0, w, wall);
  ctx.fillRect(0, h - wall, w, wall);
  ctx.fillRect(0, 0, wall, h);
  ctx.fillRect(w - wall, 0, wall, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 3;
  ctx.strokeRect(wall + 2, wall + 2, w - wall * 2 - 4, h - wall * 2 - 4);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  // Wall trim highlight.
  ctx.fillStyle = withAlpha(shade(room.wall, 0.5), 0.35);
  ctx.fillRect(wall, wall, w - wall * 2, 3);

  // Exit mat at the bottom-centre, aligned with the exterior door.
  const matW = 74;
  const matX = room.exit.x - matW / 2;
  ctx.fillStyle = withAlpha('#ffd070', 0.22);
  ctx.fillRect(matX, h - wall - 26, matW, 26);
  ctx.strokeStyle = withAlpha('#ffd070', 0.5);
  ctx.lineWidth = 2;
  ctx.strokeRect(matX, h - wall - 26, matW, 26);
  ctx.fillStyle = withAlpha('#ffffff', 0.5);
  ctx.font = 'bold 11px Inter';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', room.exit.x, h - wall - 8);

  // Furniture, sorted so lower pieces overlap higher ones.
  const sorted = [...room.furnitures].sort((a, b) => a.y + a.h - (b.y + b.h));
  for (const f of sorted) drawFurniture(ctx, f, room, timeOfDay);

  // Room name plate near the top wall.
  ctx.fillStyle = withAlpha('#ffffff', 0.4);
  ctx.font = 'bold 14px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(room.name.toUpperCase(), w / 2, wall + 22);
}

interface F {
  kind: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function drawFurniture(ctx: CanvasRenderingContext2D, f: F, room: Interior, timeOfDay: number) {
  const { x, y, w, h } = f;
  // Contact shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(x + 4, y + h - 4, w, 6);

  switch (f.kind) {
    case 'bed':
      ctx.fillStyle = shade(f.color, -0.15);
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = withAlpha('#ffffff', 0.5);
      ctx.fillRect(x + 4, y + 4, w - 8, h * 0.4);
      break;
    case 'table':
      ctx.fillStyle = shade(f.color, -0.2);
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = shade(f.color, 0.15);
      ctx.fillRect(x + 3, y + 3, w - 6, h - 10);
      break;
    case 'counter':
      ctx.fillStyle = shade(f.color, -0.2);
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = shade(f.color, 0.25);
      ctx.fillRect(x, y, w, 8);
      break;
    case 'shelf':
      ctx.fillStyle = shade(f.color, -0.1);
      ctx.fillRect(x, y, w, h);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = withAlpha('#ffffff', 0.12 + hash01(room.id + i + f.x, 4) * 0.2);
        ctx.fillRect(x + 6 + i * (w / 5), y + 4, w / 5 - 8, h - 8);
      }
      break;
    case 'console':
      ctx.fillStyle = '#1a2026';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = withAlpha(f.color, 0.8);
      ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = withAlpha('#ffffff', 0.2 + 0.5 * hash01(room.id + i, 6));
        ctx.fillRect(x + 10 + i * ((w - 20) / 8), y + 10, (w - 20) / 8 - 4, h - 20);
      }
      break;
    case 'server':
      ctx.fillStyle = shade(f.color, -0.3);
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = withAlpha('#39d0d8', 0.9);
      ctx.fillRect(x, y + 4, w, 4);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = withAlpha(hash01(room.id + i, 7) > 0.5 ? '#7affa0' : '#39d0d8', 0.7);
        ctx.fillRect(x + 6, y + 16 + i * (h / 5), w - 12, 5);
      }
      break;
    case 'crate':
      ctx.fillStyle = shade(f.color, -0.2);
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = shade(f.color, 0.25);
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 4);
      ctx.lineTo(x + w - 4, y + h - 4);
      ctx.moveTo(x + w - 4, y + 4);
      ctx.lineTo(x + 4, y + h - 4);
      ctx.stroke();
      break;
    case 'column':
      ctx.fillStyle = shade(f.color, 0.1);
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    case 'statue':
      ctx.fillStyle = shade(f.color, -0.1);
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h, w * 0.6, h * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = shade(f.color, 0.15);
      ctx.fillRect(x + w * 0.35, y, w * 0.3, h);
      break;
    case 'crystal': {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const glow = 0.4 + 0.3 * Math.sin(timeOfDay * 6 + x);
      ctx.fillStyle = withAlpha(f.color, glow);
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(x + w, cy);
      ctx.lineTo(cx, y + h);
      ctx.lineTo(x, cy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'shrine':
      ctx.fillStyle = shade(f.color, -0.3);
      ctx.fillRect(x, y + h * 0.4, w, h * 0.6);
      ctx.fillStyle = withAlpha(f.color, 0.8);
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h * 0.5);
      ctx.lineTo(x, y + h * 0.5);
      ctx.closePath();
      ctx.fill();
      break;
    case 'candle': {
      const flick = 0.6 + 0.4 * Math.sin(timeOfDay * 9 + x * 0.3);
      ctx.fillStyle = shade(f.color, -0.4);
      ctx.fillRect(x + w * 0.3, y + h * 0.4, w * 0.4, h * 0.6);
      ctx.fillStyle = withAlpha('#ffdd88', flick);
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h * 0.3, w * 0.35, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'board':
      ctx.fillStyle = shade(f.color, -0.2);
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = withAlpha('#ffffff', 0.25);
      for (let i = 0; i < 6; i++) ctx.fillRect(x + 8 + i * (w / 6), y + 6, w / 6 - 10, h - 12);
      break;
    default:
      ctx.fillStyle = shade(f.color, -0.1);
      ctx.fillRect(x, y, w, h);
  }
}
