/**
 * Small colour helpers shared by the sprite and environment renderers.
 * All inputs accept `#rgb`, `#rrggbb`, or `rgb(...)`; unknown formats are
 * returned unchanged so rendering never throws on odd data.
 */

interface Rgb { r: number; g: number; b: number }

export function parseColor(color: string): Rgb | null {
  const c = color.trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    const num = parseInt(h, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(c);
  if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
  return null;
}

export function rgbString({ r, g, b }: Rgb, alpha?: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  if (alpha === undefined) return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`;
  return `rgba(${clamp(r)}, ${clamp(g)}, ${clamp(b)}, ${alpha})`;
}

/** Multiplies a colour towards black (amount < 0) or white (amount > 0). */
export function shade(color: string, amount: number): string {
  const c = parseColor(color);
  if (!c) return color;
  if (amount < 0) {
    const k = 1 + amount;
    return rgbString({ r: c.r * k, g: c.g * k, b: c.b * k });
  }
  return rgbString({
    r: c.r + (255 - c.r) * amount,
    g: c.g + (255 - c.g) * amount,
    b: c.b + (255 - c.b) * amount,
  });
}

/** Returns the same colour at the given alpha (0-1). */
export function withAlpha(color: string, alpha: number): string {
  const c = parseColor(color);
  if (!c) return color;
  return rgbString(c, alpha);
}

/** Blends `a` towards `b` by `t` (0-1). */
export function mix(a: string, b: string, t: number): string {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return a;
  return rgbString({
    r: ca.r + (cb.r - ca.r) * t,
    g: ca.g + (cb.g - ca.g) * t,
    b: ca.b + (cb.b - ca.b) * t,
  });
}

/** Deterministic 0-1 hash from a string, for stable per-item variation. */
export function hash01(str: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
