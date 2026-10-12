import { useEffect, useRef } from 'react';
import { Appearance } from '../types';
import { EntitySpriteSystem } from '../engine/entitySprite';

interface Props {
  name: string;
  color: string;
  appearance: Appearance;
  size?: number;
}

/**
 * Small looping preview of a character, drawn with the same sprite system used
 * in the world so the select screen matches the in-game look.
 */
export function CharacterPreview({ name, color, appearance, size = 96 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const sprites = new EntitySpriteSystem();
    const entity = {
      id: `preview-${name}`,
      name,
      pos: { x: size / 2, y: size * 0.78 },
      size: { x: 30, y: 30 },
      color,
      appearance,
      type: 'player' as const,
    };

    let raf = 0;
    let last = performance.now();
    let t = 0;

    const loop = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      t += dt;

      // Walk back and forth across the tile so the legs keep cycling.
      const span = size * 0.22;
      const cx = size / 2 + Math.sin(t / 700) * span;
      entity.pos = { x: cx, y: size * 0.78 };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      const bg = ctx.createLinearGradient(0, 0, 0, size);
      bg.addColorStop(0, 'rgba(22,28,36,0.9)');
      bg.addColorStop(1, 'rgba(8,10,14,0.95)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);

      // Ground line
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.moveTo(size * 0.1, size * 0.8);
      ctx.lineTo(size * 0.9, size * 0.8);
      ctx.stroke();

      sprites.update(entity, dt);
      // Scale the sprite down to fit the tile.
      ctx.save();
      ctx.translate(size / 2, size * 0.8);
      ctx.scale(0.7, 0.7);
      ctx.translate(-size / 2, -size * 0.8);
      sprites.draw(ctx, entity);
      ctx.restore();

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [name, color, appearance, size]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} className="char-preview" />;
}
