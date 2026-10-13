import { Building, BuildingKind } from '../types';
import { shade, withAlpha, hash01 } from '../engine/color';
import { Ctx, poly, linear } from './canvasUtils';

export interface RoofSpec {
  /** Flat roof colour (canvas has no depth buffer). */
  roofColor: string;
  /** 0 = flat slab, 1 = steep gable/hip. */
  slope: number;
  chimney: boolean;
  skylights: boolean;
}

const ROOFS: Record<BuildingKind, RoofSpec> = {
  house: { roofColor: '#7a2f22', slope: 0.55, chimney: true, skylights: false },
  cafe: { roofColor: '#8a3a2a', slope: 0.4, chimney: true, skylights: false },
  tower: { roofColor: '#3a3f4a', slope: 0.2, chimney: false, skylights: false },
  hall: { roofColor: '#4a3f6a', slope: 0.3, chimney: false, skylights: true },
  bunker: { roofColor: '#4a4f52', slope: 0.05, chimney: false, skylights: false },
  warehouse: { roofColor: '#6a6a70', slope: 0.12, chimney: false, skylights: true },
  shrine: { roofColor: '#8a1f2a', slope: 0.75, chimney: false, skylights: false },
  hut: { roofColor: '#5a4326', slope: 0.6, chimney: false, skylights: false },
  ruin: { roofColor: '#4a453c', slope: 0.35, chimney: false, skylights: false },
  skyscraper: { roofColor: '#2c313c', slope: 0.1, chimney: false, skylights: false },
  brownstone: { roofColor: '#5a3a2e', slope: 0.25, chimney: true, skylights: false },
  apartment: { roofColor: '#4a4550', slope: 0.16, chimney: false, skylights: true },
  factory: { roofColor: '#585c60', slope: 0.2, chimney: true, skylights: true },
  stadium: { roofColor: '#3f4650', slope: 0.08, chimney: false, skylights: true },
  lighthouse: { roofColor: '#c23a3a', slope: 0.6, chimney: false, skylights: false },
};

/**
 * Layout, in world space (the camera looks from the south):
 *   roof band : y - H      .. y + h - H   (top face, shifted up by the wall height)
 *   wall band : y + h - H  .. y + h       (the south wall, carries windows and door)
 * The whole drawn body is (x, y - H, w, h + H).
 */
function bands(b: Building) {
  const H = b.wallHeight;
  return { wallY: b.pos.y + b.size.y - H, roofY: b.pos.y - H, wallH: H };
}

interface WinRect { x: number; y: number; w: number; h: number; lit: boolean }

function windows(b: Building): WinRect[] {
  const { wallY, wallH } = bands(b);
  const kind = b.buildingKind;
  const tall = kind === 'tower' || kind === 'skyscraper';
  const cols = tall ? 3 : kind === 'warehouse' || kind === 'factory' || kind === 'stadium' ? 4 : Math.max(2, Math.min(4, Math.round(b.size.x / 46)));
  const rows = tall ? 3 : kind === 'apartment' || kind === 'brownstone' ? 2 : 1;
  const marginX = 12;
  const cellW = (b.size.x - marginX * 2) / cols;
  const winW = Math.min(cellW * 0.62, 22);
  const winH = Math.min(wallH * 0.5, 14);
  const gapRows = rows > 1 ? (wallH - winH * rows) / (rows + 1) : (wallH - winH) / 2;
  const out: WinRect[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = b.pos.x + marginX + cellW * c + (cellW - winW) / 2;
      const wy = wallY + gapRows * (r + 1) + winH * r;
      out.push({ x: wx, y: wy, w: winW, h: winH, lit: hash01(b.id + r + c, 5) > 0.45 });
    }
  }
  return out;
}

/** The solid body of a building, drawn after any props behind it. */
export function drawBuilding(ctx: Ctx, b: Building) {
  const x = b.pos.x;
  const y = b.pos.y;
  const w = b.size.x;
  const h = b.size.y;
  const H = b.wallHeight;
  const roof = ROOFS[b.buildingKind];
  const { wallY, roofY } = bands(b);

  // Ground shadow, cast away from the roof (down-right).
  const sg = ctx.createLinearGradient(0, y, 0, y + h + 14);
  sg.addColorStop(0, 'rgba(0,0,0,0.16)');
  sg.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = sg;
  ctx.fillRect(x + 7, y + 7, w, h + 12);

  // Whole body: roof band + south wall band, as one block.
  const wallGrad = linear(ctx, roofY, y + h, shade(b.color, 0.18), shade(b.color, -0.4));
  ctx.fillStyle = wallGrad;
  ctx.fillRect(x, roofY, w, h + H);

  // Panel banding on the south wall only.
  ctx.strokeStyle = 'rgba(0,0,0,0.14)';
  ctx.lineWidth = 1;
  for (let by = wallY + 6; by < y + h - 3; by += 9) {
    ctx.beginPath();
    ctx.moveTo(x + 2, by);
    ctx.lineTo(x + w - 2, by);
    ctx.stroke();
  }

  if (roof.chimney) drawChimney(ctx, b, roofY);
  drawRoof(ctx, b, roof, roofY, wallY);
  if (roof.skylights) drawSkylights(ctx, b, roofY, wallY);
  drawWindows(ctx, b);
  drawDoor(ctx, b, wallY);
  if (b.buildingKind === 'ruin') drawRuinDamage(ctx, b, roofY, wallY);

  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, roofY + 1, w - 2, h + H - 2);
}

function drawChimney(ctx: Ctx, b: Building, roofY: number) {
  const cx = b.pos.x + b.size.x * 0.74;
  ctx.fillStyle = shade(b.color, -0.3);
  ctx.fillRect(cx - 7, roofY - 26, 14, 30);
  ctx.fillStyle = shade(b.color, 0.05);
  ctx.fillRect(cx - 9, roofY - 30, 18, 6);
}

function drawRoof(ctx: Ctx, b: Building, roof: RoofSpec, roofY: number, wallY: number) {
  const x = b.pos.x;
  const w = b.size.x;
  const h = b.size.y;
  const back = 10 + roof.slope * 24;
  const g = linear(ctx, roofY, wallY, shade(roof.roofColor, 0.35), shade(roof.roofColor, -0.25));

  if (roof.slope >= 0.6) {
    const ridge = roofY + h * 0.42;
    poly(ctx, [[x, wallY], [x + w, wallY], [x + w - back, ridge], [x + back, ridge]], g);
    poly(ctx, [[x + back, ridge], [x + w - back, ridge], [x + w - back * 2, roofY], [x + back * 2, roofY]],
      linear(ctx, roofY, ridge, shade(roof.roofColor, 0.5), shade(roof.roofColor, 0.1)));
  } else {
    poly(ctx, [[x, wallY], [x + w, wallY], [x + w - back, roofY], [x + back, roofY]], g);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.strokeStyle = withAlpha(shade(roof.roofColor, 0.6), 0.5);
  ctx.beginPath();
  const ry = roof.slope >= 0.6 ? roofY + h * 0.42 : roofY + h * 0.5;
  ctx.moveTo(x + back, ry);
  ctx.lineTo(x + w - back, ry);
  ctx.stroke();
}

function drawSkylights(ctx: Ctx, b: Building, roofY: number, wallY: number) {
  const x = b.pos.x;
  const w = b.size.x;
  const n = Math.max(2, Math.floor(w / 44));
  for (let i = 0; i < n; i++) {
    const sx = x + 16 + (i * (w - 32)) / Math.max(1, n - 1);
    const sy = (roofY + wallY) / 2 - 4;
    ctx.fillStyle = withAlpha('#9ad4ff', 0.55);
    ctx.fillRect(sx - 8, sy, 16, 8);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - 8, sy, 16, 8);
  }
}

function drawWindows(ctx: Ctx, b: Building) {
  for (const win of windows(b)) {
    ctx.fillStyle = win.lit ? '#ffd98a' : '#161d27';
    ctx.fillRect(win.x, win.y, win.w, win.h);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(win.x, win.y, win.w, win.h);
    ctx.beginPath();
    ctx.moveTo(win.x + win.w / 2, win.y);
    ctx.lineTo(win.x + win.w / 2, win.y + win.h);
    ctx.stroke();
  }
}

function drawDoor(ctx: Ctx, b: Building, wallY: number) {
  const doorW = Math.min(26, b.size.x * 0.3);
  const doorH = Math.min(b.wallHeight * 0.78, 28);
  const dx = b.pos.x + b.size.x / 2 - doorW / 2;
  const dy = b.pos.y + b.size.y - doorH;
  ctx.fillStyle = shade(b.roofColor, -0.3);
  ctx.fillRect(dx, dy, doorW, doorH);
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 2;
  ctx.strokeRect(dx, dy, doorW, doorH);
  ctx.fillStyle = '#e8d48a';
  ctx.beginPath();
  ctx.arc(dx + doorW - 5, dy + doorH / 2, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = withAlpha('#ffffff', 0.14);
  ctx.fillRect(dx - 5, wallY + 2, doorW + 10, 4);
}

function drawRuinDamage(ctx: Ctx, b: Building, roofY: number, wallY: number) {
  const x = b.pos.x;
  const w = b.size.x;
  ctx.fillStyle = '#141416';
  for (let i = 0; i < 3; i++) {
    const cx = x + 12 + hash01(b.id + i, 8) * (w - 24);
    const top = roofY + 2 + hash01(b.id + i, 9) * (wallY - roofY) * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - 8, top);
    ctx.lineTo(cx + 6, top + 4);
    ctx.lineTo(cx + 2, top + 14);
    ctx.lineTo(cx - 10, top + 10);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.38, roofY + (wallY - roofY) * 0.4);
  ctx.lineTo(x + w * 0.46, b.pos.y + b.size.y * 0.6);
  ctx.lineTo(x + w * 0.4, b.pos.y + b.size.y);
  ctx.stroke();
}

/** Warm light spilling from lit windows, drawn additively after characters. */
export function buildingEmissive(ctx: Ctx, b: Building) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const win of windows(b)) {
    if (!win.lit) continue;
    const wx = win.x + win.w / 2;
    const wy = win.y + win.h / 2;
    const g = ctx.createRadialGradient(wx, wy, 0, wx, wy, 28);
    g.addColorStop(0, 'rgba(255,210,120,0.32)');
    g.addColorStop(1, 'rgba(255,210,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(wx - 28, wy - 28, 56, 56);
  }
  ctx.restore();
}
