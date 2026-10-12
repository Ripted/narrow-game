import { Gate, Interactive } from '../types';
import { shade, withAlpha, hash01 } from '../engine/color';

/**
 * Hand-placed fixtures the player can use. Kept in one file so placement and
 * art stay together. None overlap buildings, world objects or roads (checked at
 * build time in the repo's verification script).
 */
export const INTERACTIVES: Interactive[] = [
  // ---- Chests: one-shot loot -------------------------------------------------
  {
    id: 'chest_polish', name: 'Supply Chest', type: 'object', interactiveKind: 'chest',
    pos: { x: 150, y: 900 }, size: { x: 46, y: 36 }, color: '#b07a2a',
    itemId: 'paprika', description: 'A rough Polish supply chest.',
  },
  {
    id: 'chest_hub', name: 'Server Cache', type: 'object', interactiveKind: 'chest',
    pos: { x: 900, y: 420 }, size: { x: 46, y: 36 }, color: '#39d0d8',
    gold: 40, description: 'A cache of server loot.',
  },
  {
    id: 'chest_cafe', name: 'Patisserie Box', type: 'object', interactiveKind: 'chest',
    pos: { x: 2840, y: 420 }, size: { x: 46, y: 36 }, color: '#c9a0c0',
    itemId: 'baguette', description: 'A box of weaponised pastries.',
  },
  {
    id: 'chest_deadzone', name: 'Rusted Chest', type: 'object', interactiveKind: 'chest',
    pos: { x: 1880, y: 2020 }, size: { x: 46, y: 36 }, color: '#6a5a3a',
    gold: 25, itemId: 'update_fragment', description: 'A rusted chest someone left behind.',
  },

  // ---- Signs: readable lore --------------------------------------------------
  {
    id: 'sign_spawn', name: 'Signpost', type: 'object', interactiveKind: 'sign',
    pos: { x: 220, y: 180 }, size: { x: 40, y: 56 }, color: '#8b6a3a',
    text: 'NEWCOMER SPAWN. WASD to move, E to interact. The taverns are enterable — walk into a door.',
  },
  {
    id: 'sign_polish', name: 'Warning Sign', type: 'object', interactiveKind: 'sign',
    pos: { x: 620, y: 700 }, size: { x: 40, y: 56 }, color: '#8b3a3a',
    text: 'THE POLISH DISTRICT. Aggressive. Red and white. Do not mention the paprika.',
  },
  {
    id: 'sign_deadzone', name: 'Rusted Sign', type: 'object', interactiveKind: 'sign',
    pos: { x: 2020, y: 1850 }, size: { x: 40, y: 56 }, color: '#5a5a5a',
    text: 'THE DEAD ZONE. Abandoned buildings. A lever somewhere opens the sealed gate to the east.',
  },

  // ---- Lever: opens the sealed gate -----------------------------------------
  {
    id: 'lever_deadzone', name: 'Old Lever', type: 'object', interactiveKind: 'lever',
    pos: { x: 2600, y: 2250 }, size: { x: 30, y: 40 }, color: '#c9b06a',
    gateId: 'gate_deadzone_open', description: 'A heavy lever, stiff with rust.',
  },

  // ---- Campfires: free heals ------------------------------------------------
  {
    id: 'campfire_spawn', name: 'Campfire', type: 'object', interactiveKind: 'campfire',
    pos: { x: 480, y: 480 }, size: { x: 44, y: 34 }, color: '#ff8a3a',
    description: 'A warm campfire. Resting here restores your health.',
  },
  {
    id: 'campfire_speedrun', name: 'Campfire', type: 'object', interactiveKind: 'campfire',
    pos: { x: 2720, y: 1700 }, size: { x: 44, y: 34 }, color: '#ff8a3a',
    description: 'A rest point for tired speedrunners.',
  },

  // ---- Merchants: gold sinks ------------------------------------------------
  {
    id: 'merchant_cafe', name: 'Café Vendor', type: 'object', interactiveKind: 'merchant',
    pos: { x: 2900, y: 300 }, size: { x: 34, y: 40 }, color: '#c9a0c0',
    description: 'A vendor with a stall of café goods.',
    stock: [
      { itemId: 'baguette', price: 20 },
      { itemId: 'energy_drink', price: 15 },
    ],
  },
  {
    id: 'merchant_docks', name: 'Dock Trader', type: 'object', interactiveKind: 'merchant',
    pos: { x: 4200, y: 2300 }, size: { x: 34, y: 40 }, color: '#5a7a8a',
    description: 'A trader dealing in dock-surplus gear.',
    stock: [
      { itemId: 'wrench', price: 35 },
      { itemId: 'pepper_spray', price: 18 },
      { itemId: 'energy_drink', price: 15 },
    ],
  },
  {
    id: 'merchant_wilds', name: 'Roadside Merchant', type: 'object', interactiveKind: 'merchant',
    pos: { x: 3820, y: 2500 }, size: { x: 34, y: 40 }, color: '#8a7a5a',
    description: 'A merchant camped by the dirt road.',
    stock: [
      { itemId: 'energy_drink', price: 12 },
      { itemId: 'pepper_spray', price: 20 },
    ],
  },
];

/**
 * Gates block a corridor until their `openFlag` is set by a lever. They are
 * solid in the exterior and drawn as a barred portcullis.
 */
export const GATES: Gate[] = [
  {
    id: 'gate_deadzone', name: 'Sealed Gate', type: 'object',
    pos: { x: 2740, y: 1800 }, size: { x: 40, y: 240 }, color: '#8a8f92',
    openFlag: 'gate_deadzone_open', open: false,
  },
  {
    id: 'gate_shrine', name: 'Shrine Gate', type: 'object',
    pos: { x: 2760, y: 640 }, size: { x: 40, y: 200 }, color: '#6a5cff',
    openFlag: 'found_admin_key', open: false,
  },
];

/** Draws a fixture; `used` chests/levers change state. */
export function drawInteractive(
  ctx: CanvasRenderingContext2D,
  it: Interactive,
  time: number
) {
  const cx = it.pos.x + it.size.x / 2;
  const baseY = it.pos.y + it.size.y;
  const w = it.size.x;
  const h = it.size.y;

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY, w * 0.55, h * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  switch (it.interactiveKind) {
    case 'chest': {
      const open = !!it.used;
      ctx.fillStyle = shade(it.color, -0.25);
      ctx.fillRect(it.pos.x, baseY - h, w, h);
      ctx.fillStyle = shade(it.color, 0.2);
      if (open) {
        // Lid flipped up behind the box.
        ctx.fillRect(it.pos.x, baseY - h - h * 0.5, w, h * 0.5);
        ctx.fillStyle = '#1a1208';
        ctx.fillRect(it.pos.x + 4, baseY - h + 4, w - 8, h - 8);
      } else {
        ctx.fillRect(it.pos.x, baseY - h, w, h * 0.55);
        ctx.fillStyle = shade(it.color, -0.1);
        ctx.fillRect(it.pos.x, baseY - h * 0.5, w, h * 0.5);
      }
      ctx.fillStyle = '#ffd070';
      ctx.fillRect(cx - 4, baseY - h * 0.55, 8, 10);
      break;
    }
    case 'sign': {
      ctx.fillStyle = '#4a3a26';
      ctx.fillRect(cx - 3, baseY - h * 0.5, 6, h * 0.5);
      ctx.fillStyle = it.color;
      ctx.fillRect(it.pos.x, baseY - h, w, h * 0.6);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(it.pos.x, baseY - h, w, h * 0.6);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 3; i++) ctx.fillRect(it.pos.x + 6, baseY - h + 8 + i * 7, w - 12, 3);
      break;
    }
    case 'lever': {
      const pulled = !!it.used;
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(it.pos.x, baseY - 12, w, 12);
      ctx.fillStyle = it.color;
      const ang = pulled ? -0.9 : 0.9;
      ctx.save();
      ctx.translate(cx, baseY - 12);
      ctx.rotate(ang);
      ctx.fillRect(-3, -h, 6, h);
      ctx.fillStyle = '#ff5a3a';
      ctx.beginPath();
      ctx.arc(0, -h, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'campfire': {
      const flick = 0.7 + 0.3 * Math.sin(time * 8);
      // Logs.
      ctx.strokeStyle = '#5a4028';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.4, baseY);
      ctx.lineTo(cx + w * 0.4, baseY - 8);
      ctx.moveTo(cx + w * 0.4, baseY);
      ctx.lineTo(cx - w * 0.4, baseY - 8);
      ctx.stroke();
      // Flame.
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = withAlpha(i === 0 ? '#ffdd55' : '#ff7a2a', flick - i * 0.15);
        ctx.beginPath();
        ctx.moveTo(cx, baseY - h - i * 10 * flick);
        ctx.lineTo(cx + 10 - i * 2, baseY - 6);
        ctx.lineTo(cx - 10 + i * 2, baseY - 6);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'merchant': {
      // A market stall: counter, striped awning and a hanging lantern.
      ctx.fillStyle = shade(it.color, -0.35);
      ctx.fillRect(it.pos.x - w * 0.5, baseY - h * 0.5, w * 2, h * 0.5);
      ctx.fillStyle = shade(it.color, 0.1);
      ctx.fillRect(it.pos.x - w * 0.5, baseY - h * 0.6, w * 2, h * 0.16);
      // Awning stripes.
      const aw = w * 2;
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 ? '#e8e0d0' : it.color;
        ctx.fillRect(it.pos.x - w * 0.5 + (aw / 5) * i, baseY - h - 6, aw / 5, 12);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(it.pos.x - w * 0.5, baseY - h - 6, aw, 12);
      // Lantern glow.
      const pulse = 0.6 + 0.4 * Math.sin(time * 3);
      ctx.fillStyle = withAlpha('#ffd070', 0.55 * pulse);
      ctx.beginPath();
      ctx.arc(cx + w * 0.5, baseY - h * 0.7, 10, 0, Math.PI * 2);
      ctx.fill();
      // Gold coin motif on the counter.
      ctx.fillStyle = '#ffd070';
      ctx.beginPath();
      ctx.arc(cx - w * 0.2, baseY - h * 0.32, 4, 0, Math.PI * 2);
      ctx.arc(cx + w * 0.2, baseY - h * 0.32, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}

/** Draws a portcullis-style gate; open gates retract into the ground. */
export function drawGate(ctx: CanvasRenderingContext2D, gate: Gate) {
  const { x, y } = gate.pos;
  const { x: w, y: h } = gate.size;
  if (gate.open) {
    ctx.fillStyle = withAlpha(gate.color, 0.28);
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = withAlpha(gate.color, 0.5);
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    return;
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x + 5, y + 5, w, h);
  ctx.fillStyle = shade(gate.color, -0.3);
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = shade(gate.color, 0.2);
  ctx.lineWidth = 3;
  const vertical = h > w;
  const bars = vertical ? 6 : 3;
  for (let i = 0; i < bars; i++) {
    ctx.beginPath();
    if (vertical) {
      const bx = x + (i + 1) * (w / (bars + 1));
      ctx.moveTo(bx, y);
      ctx.lineTo(bx, y + h);
    } else {
      const by = y + (i + 1) * (h / (bars + 1));
      ctx.moveTo(x, by);
      ctx.lineTo(x + w, by);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  // Warning stripe.
  ctx.fillStyle = withAlpha('#ffaa00', 0.35 + 0.15 * Math.sin(hash01(gate.id, 1) + performance.now() / 400));
  if (vertical) ctx.fillRect(x, y + h / 2 - 5, w, 10);
  else ctx.fillRect(x + w / 2 - 5, y, 10, h);
}
