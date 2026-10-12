import { WeatherKind } from '../types';
import { withAlpha } from '../engine/color';

interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
}

/**
 * Screen-space weather. Particles are recycled in viewport coordinates rather
 * than world coordinates, so a storm looks identical everywhere and costs a
 * fixed number of draws regardless of how big the map grows.
 */
export class WeatherSystem {
  weather: WeatherKind = 'clear';
  private drops: Drop[] = [];
  private w = 0;
  private h = 0;
  /** Countdown to the next weather roll. */
  private rollIn = 20;

  private ensure(count: number) {
    while (this.drops.length < count) {
      const rain = this.weather === 'rain';
      this.drops.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: rain ? 90 : 22,
        vy: rain ? 640 : 60,
        len: rain ? 10 + Math.random() * 9 : 0,
      });
    }
    this.drops.length = count;
  }

  update(dt: number, w: number, h: number, daylight: number) {
    this.w = w;
    this.h = h;
    this.rollIn -= dt;
    if (this.rollIn <= 0) {
      this.rollIn = 25 + Math.random() * 40;
      this.rollWeather(daylight);
    }
    if (this.weather === 'clear') {
      this.drops.length = 0;
      return;
    }
    const rain = this.weather === 'rain';
    this.ensure(rain ? 260 : 150);
    for (const d of this.drops) {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.y > this.h) { d.y = -12; d.x = Math.random() * this.w; }
      if (d.x > this.w) d.x = 0;
      if (rain) d.len = 10 + Math.random() * 4;
    }
  }

  private rollWeather(daylight: number) {
    const r = Math.random();
    // Rain is likelier at night, snow likelier in the deep cold hours.
    if (r < 0.16) this.weather = 'rain';
    else if (r < 0.24) this.weather = 'snow';
    else this.weather = 'clear';
    if (daylight > 0.9 && r < 0.1) this.weather = 'clear';
  }

  setWeather(kind: WeatherKind) {
    this.weather = kind;
  }

  /** Ambient darkening factor from weather (1 = no effect). */
  lightFactor(): number {
    if (this.weather === 'rain') return 0.78;
    if (this.weather === 'snow') return 0.86;
    return 1;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.weather === 'clear') return;
    if (this.weather === 'rain') {
      ctx.strokeStyle = withAlpha('#9fc8e8', 0.5);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (const d of this.drops) {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * 0.25, d.y - d.len);
      }
      ctx.stroke();
      // Wet sheen.
      ctx.fillStyle = withAlpha('#0a1420', 0.16);
      ctx.fillRect(0, 0, this.w, this.h);
    } else {
      ctx.fillStyle = withAlpha('#ffffff', 0.85);
      for (const d of this.drops) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = withAlpha('#bfd8ff', 0.1);
      ctx.fillRect(0, 0, this.w, this.h);
    }
  }
}
