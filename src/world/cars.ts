import { Car, CarKind, TrafficRoute } from '../types';
import { shade, withAlpha } from '../engine/color';

interface CarSpec {
  w: number;
  h: number;
  body: string;
  roof: string;
  /** Taxis and trucks get roof detailing. */
  accent?: string;
}

const SPECS: Record<CarKind, CarSpec> = {
  sedan: { w: 66, h: 34, body: '#b03030', roof: '#1c1e24' },
  hatch: { w: 52, h: 30, body: '#2f7ab0', roof: '#1c1e24' },
  van: { w: 74, h: 38, body: '#c8c8cc', roof: '#2a2c32' },
  taxi: { w: 66, h: 34, body: '#e8b820', roof: '#1c1e24', accent: '#111111' },
  truck: { w: 92, h: 44, body: '#3a5a44', roof: '#24262c', accent: '#20242a' },
};

const PARKED: { kind: CarKind; x: number; y: number; angle: number }[] = [
  // Newcomer spawn / Discord hub kerbside.
  { kind: 'sedan', x: 820, y: 980, angle: 0 },
  { kind: 'hatch', x: 900, y: 1040, angle: 0 },
  { kind: 'van', x: 2020, y: 620, angle: Math.PI / 2 },
  // French café.
  { kind: 'taxi', x: 2860, y: 640, angle: Math.PI / 2 },
  // Level editor / speedrun.
  { kind: 'truck', x: 1820, y: 1180, angle: 0 },
  { kind: 'sedan', x: 2620, y: 1180, angle: Math.PI },
  // Wilds dirt road pull-offs.
  { kind: 'van', x: 1500, y: 2560, angle: Math.PI / 2 },
  { kind: 'hatch', x: 1500, y: 2720, angle: Math.PI / 2 },
  { kind: 'truck', x: 4000, y: 2620, angle: Math.PI / 2 },
  // Server farm.
  { kind: 'van', x: 3560, y: 300, angle: Math.PI / 2 },
  { kind: 'taxi', x: 3560, y: 520, angle: Math.PI / 2 },
  // Docks.
  { kind: 'truck', x: 3560, y: 2080, angle: 0 },
  { kind: 'truck', x: 3560, y: 2200, angle: 0 },
  { kind: 'sedan', x: 5200, y: 2080, angle: Math.PI },
  // Broken-down ruin car in the Dead Zone.
  { kind: 'hatch', x: 2320, y: 2260, angle: 0.6 },
];

/** Hub-relative centre of a parked car from its top-left placement. */
export function parkedCars(): Car[] {
  return PARKED.map((p, i) => {
    const s = SPECS[p.kind];
    return {
      id: `car_parked_${i}`,
      name: p.kind,
      type: 'car',
      carKind: p.kind,
      pos: { x: p.x, y: p.y },
      size: { x: s.w, y: s.h },
      color: s.body,
      angle: p.angle,
      speed: 0,
    };
  });
}

/**
 * Traffic circuits. Each is a closed loop of waypoints laid on the road grid;
 * the runtime spaces `count` cars along the total length and advances them.
 */
export const TRAFFIC_ROUTES: TrafficRoute[] = [
  {
    id: 'highway_east',
    speed: 110,
    count: 4,
    interval: 1,
    points: [
      { x: 200, y: 3132 }, { x: 5400, y: 3132 },
    ],
  },
  {
    id: 'highway_west',
    speed: 100,
    count: 4,
    interval: 1,
    points: [
      { x: 5400, y: 3388 }, { x: 200, y: 3388 },
    ],
  },
  {
    id: 'city_ring',
    speed: 80,
    count: 3,
    interval: 1,
    points: [
      { x: 805, y: 400 }, { x: 805, y: 1400 }, { x: 2400, y: 1400 },
      { x: 2400, y: 400 }, { x: 805, y: 400 },
    ],
  },
  {
    id: 'east_ring',
    speed: 90,
    count: 3,
    interval: 1,
    points: [
      { x: 3370, y: 300 }, { x: 3370, y: 1990 }, { x: 4800, y: 1990 },
      { x: 4800, y: 300 }, { x: 3370, y: 300 },
    ],
  },
];

export function carSpec(kind: CarKind): CarSpec {
  return SPECS[kind];
}

/** Draws a car from above, rotated to its heading. */
export function drawCar(ctx: CanvasRenderingContext2D, car: Car, time: number) {
  const s = SPECS[car.carKind];
  const cx = car.pos.x + car.size.x / 2;
  const cy = car.pos.y + car.size.y / 2;
  const w = car.size.x;
  const h = car.size.y;

  ctx.save();
  // Contact shadow, offset to imply height.
  ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(3, 5, w * 0.55, h * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(car.angle);

  // Wheels.
  ctx.fillStyle = '#14141a';
  const wheelW = 14;
  const wheelH = 8;
  const axle = w * 0.3;
  for (const [wx, wy] of [[-axle, -h / 2], [-axle, h / 2], [axle, -h / 2], [axle, h / 2]]) {
    ctx.fillRect(wx - wheelW / 2, wy - wheelH / 2, wheelW, wheelH);
  }

  // Body.
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, shade(s.body, 0.2));
  g.addColorStop(1, shade(s.body, -0.2));
  ctx.fillStyle = g;
  roundRect(ctx, -w / 2, -h / 2, w, h, 7);
  ctx.fill();
  ctx.strokeStyle = shade(s.body, -0.45);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Cabin / roof.
  ctx.fillStyle = car.carKind === 'truck' ? shade(s.roof, 0.05) : s.roof;
  if (car.carKind === 'truck') {
    roundRect(ctx, -w * 0.14, -h / 2 + 4, w * 0.3, h - 8, 4);
    ctx.fill();
    ctx.fillStyle = s.accent || '#20242a';
    ctx.fillRect(-w / 2 + 4, -h / 2 + 4, w * 0.32, h - 8);
  } else {
    roundRect(ctx, -w * 0.24, -h / 2 + 5, w * 0.44, h - 10, 5);
    ctx.fill();
  }

  // Windscreen highlight.
  ctx.fillStyle = withAlpha('#bfe8ff', 0.25);
  ctx.fillRect(w * 0.16, -h / 2 + 6, w * 0.08, h - 12);

  // Taxi roof sign.
  if (car.carKind === 'taxi') {
    ctx.fillStyle = '#111';
    ctx.fillRect(-6, -4, 12, 8);
    ctx.fillStyle = '#ffe680';
    ctx.fillRect(-4, -2, 8, 4);
  }

  // Headlights (glow at night) and tail lights.
  const lit = 0.35 + 0.25 * Math.sin(time * 3 + cx * 0.01);
  ctx.fillStyle = withAlpha('#fff4c0', lit + 0.3);
  ctx.fillRect(w / 2 - 6, -h / 2 + 4, 4, 6);
  ctx.fillRect(w / 2 - 6, h / 2 - 10, 4, 6);
  ctx.fillStyle = withAlpha('#ff4030', 0.8);
  ctx.fillRect(-w / 2 + 2, -h / 2 + 4, 4, 6);
  ctx.fillRect(-w / 2 + 2, h / 2 - 10, 4, 6);

  ctx.restore();
}

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
