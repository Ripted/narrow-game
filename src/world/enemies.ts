import { Enemy, EnemyKind } from '../types';
import { shade, withAlpha } from '../engine/color';

interface EnemySpec {
  size: { x: number; y: number };
  color: string;
  hp: number;
  damage: number;
  speed: number;
}

export const ENEMY_SPECS: Record<EnemyKind, EnemySpec> = {
  stalker: { size: { x: 34, y: 38 }, color: '#c03a5a', hp: 24, damage: 7, speed: 78 },
  brute: { size: { x: 46, y: 48 }, color: '#8a4a20', hp: 60, damage: 14, speed: 52 },
  drone: { size: { x: 30, y: 30 }, color: '#39d0d8', hp: 16, damage: 5, speed: 104 },
  police: { size: { x: 40, y: 42 }, color: '#2b4a8a', hp: 40, damage: 9, speed: 92 },
};

/** Stats used when the wanted system spawns a police unit. */
export const POLICE_SPEC = ENEMY_SPECS.police;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const SPAWNS: { kind: EnemyKind; x: number; y: number }[] = [
  { kind: 'stalker', x: 2400, y: 2100 },
  { kind: 'stalker', x: 2700, y: 2300 },
  { kind: 'brute', x: 2500, y: 2250 },
  { kind: 'drone', x: 4200, y: 900 },
  { kind: 'drone', x: 4500, y: 1200 },
  { kind: 'stalker', x: 1200, y: 2700 },
  { kind: 'stalker', x: 3300, y: 2750 },
  { kind: 'brute', x: 4600, y: 2500 },
  { kind: 'drone', x: 3600, y: 3400 },
  { kind: 'stalker', x: 560, y: 2200 },
  { kind: 'brute', x: 200, y: 3000 },
  { kind: 'drone', x: 5300, y: 3600 },
];

export function spawnEnemies(): Enemy[] {
  return SPAWNS.map((s, i) => {
    const spec = ENEMY_SPECS[s.kind];
    return {
      id: `enemy_${s.kind}_${i}`,
      name: s.kind,
      type: 'enemy',
      enemyKind: s.kind,
      pos: { x: s.x, y: s.y },
      size: { ...spec.size },
      color: spec.color,
      hp: spec.hp,
      maxHp: spec.hp,
      damage: spec.damage,
      speed: spec.speed,
      home: { x: s.x, y: s.y },
      cooldown: 0,
    };
  });
}

/** Draws a hostile from above; each archetype has a distinct silhouette. */
export function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, time: number) {
  const cx = e.pos.x + e.size.x / 2;
  const cy = e.pos.y + e.size.y / 2;
  const w = e.size.x;
  const h = e.size.y;

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + h * 0.42, w * 0.55, h * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  const bob = e.enemyKind === 'drone' ? Math.sin(time * 6 + cx * 0.02) * 3 : 0;
  const bx = cx;
  const by = cy + bob;

  if (e.enemyKind === 'police') {
    // Police cruiser: dark blue body, flashing light bar, star badge.
    ctx.fillStyle = '#14161c';
    ctx.fillRect(bx - w * 0.5, by + h * 0.28, w, h * 0.16);
    ctx.fillStyle = shade(e.color, 0.1);
    roundRect(ctx, bx - w * 0.5, by - h * 0.42, w, h * 0.8, 5);
    ctx.fill();
    ctx.strokeStyle = shade(e.color, -0.4);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = withAlpha('#bfe8ff', 0.35);
    ctx.fillRect(bx - w * 0.34, by - h * 0.32, w * 0.28, h * 0.64);
    const flash = Math.sin(time * 12) > 0;
    ctx.fillStyle = flash ? '#ff3030' : '#3050ff';
    ctx.fillRect(bx - w * 0.16, by - h * 0.5, w * 0.32, h * 0.12);
    ctx.fillStyle = flash ? '#3050ff' : '#ff3030';
    ctx.fillRect(bx - w * 0.16, by - h * 0.36, w * 0.32, h * 0.1);
    ctx.fillStyle = '#ffd070';
    ctx.beginPath();
    ctx.arc(bx + w * 0.28, by, 3.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.enemyKind === 'drone') {
    // Four-rotor quadcopter.
    ctx.fillStyle = shade(e.color, -0.3);
    ctx.beginPath();
    ctx.ellipse(bx, by, w * 0.32, h * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(e.color, 0.1);
    ctx.beginPath();
    ctx.ellipse(bx, by, w * 0.2, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    const spin = time * 30;
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const rx = bx + dx * w * 0.4;
      const ry = by + dy * h * 0.4;
      ctx.strokeStyle = withAlpha('#ffffff', 0.5);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rx, ry, w * 0.16, spin, spin + Math.PI * 1.4);
      ctx.stroke();
    }
    // Red sensor eye.
    ctx.fillStyle = `rgba(255,60,60,${0.6 + 0.4 * Math.sin(time * 8)})`;
    ctx.beginPath();
    ctx.arc(bx, by, 3.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.enemyKind === 'brute') {
    // Bulky sloped body with two heavy arms.
    ctx.fillStyle = shade(e.color, -0.15);
    ctx.beginPath();
    ctx.moveTo(bx - w * 0.55, by + h * 0.5);
    ctx.lineTo(bx - w * 0.35, by - h * 0.4);
    ctx.lineTo(bx + w * 0.35, by - h * 0.4);
    ctx.lineTo(bx + w * 0.55, by + h * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shade(e.color, 0.2);
    ctx.beginPath();
    ctx.ellipse(bx, by - h * 0.28, w * 0.26, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(e.color, -0.35);
    ctx.fillRect(bx - w * 0.62, by - h * 0.1, w * 0.16, h * 0.5);
    ctx.fillRect(bx + w * 0.46, by - h * 0.1, w * 0.16, h * 0.5);
    ctx.fillStyle = '#ff4030';
    ctx.fillRect(bx - w * 0.12, by - h * 0.34, 4, 3);
    ctx.fillRect(bx + w * 0.04, by - h * 0.34, 4, 3);
  } else {
    // Stalker: lean body with a lashing arm and a single eye.
    ctx.fillStyle = shade(e.color, -0.2);
    ctx.beginPath();
    ctx.ellipse(bx, by + h * 0.08, w * 0.42, h * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(e.color, 0.15);
    ctx.beginPath();
    ctx.ellipse(bx, by - h * 0.22, w * 0.28, h * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
    // Lashing arm sweeps side to side.
    const sweep = Math.sin(time * 4 + cx * 0.01) * 0.6;
    ctx.save();
    ctx.translate(bx + w * 0.3, by);
    ctx.rotate(sweep);
    ctx.strokeStyle = shade(e.color, -0.4);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.7, 0);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = `rgba(255,80,80,${0.6 + 0.4 * Math.sin(time * 6)})`;
    ctx.beginPath();
    ctx.arc(bx, by - h * 0.24, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Damage bar once hurt.
  if (e.hp < e.maxHp) {
    const bw = w + 6;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(cx - bw / 2, e.pos.y - 12, bw, 5);
    ctx.fillStyle = '#ff4040';
    ctx.fillRect(cx - bw / 2, e.pos.y - 12, bw * (e.hp / e.maxHp), 5);
  }
  ctx.restore();
}

/** Draws a stylised blood decal in world space. Abstract, never realistic. */
export function drawGore(ctx: CanvasRenderingContext2D, g: { x: number; y: number; size: number; style: string }) {
  const s = g.size;
  if (g.style === 'smear') {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#6a0d12';
    ctx.beginPath();
    ctx.ellipse(g.x, g.y, 26 * s, 7 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#70120f';
  ctx.beginPath();
  ctx.ellipse(g.x, g.y, 9 * s, 7 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a0d0b';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + s;
    const r = 10 * s + (i % 3) * 3 * s;
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(a) * r, g.y + Math.sin(a) * r, 1.6 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
