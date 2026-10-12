import { Vector2 } from '../types';

/**
 * Tracks keyboard and touch input.
 *
 * One-shot actions (interact, quest log, pause) use `consumePressed`, which
 * returns true a single time per physical press. Reading a held key every frame
 * (as the game loop used to) would fire an action ~60 times per second.
 */
export class InputHandler {
  keys: Set<string> = new Set();
  private pressed: Set<string> = new Set();
  private touchMovement: Vector2 = { x: 0, y: 0 };
  private touchAction: string | null = null;

  constructor() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (!this.keys.has(key)) this.pressed.add(key);
      this.keys.add(key);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  isPressed(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  /** Returns true once per press, then clears the pending flag. */
  consumePressed(key: string): boolean {
    const k = key.toLowerCase();
    if (this.pressed.has(k)) {
      this.pressed.delete(k);
      return true;
    }
    return false;
  }

  consumeAction(): string | null {
    const action = this.touchAction;
    this.touchAction = null;
    return action;
  }

  setTouchMovement(x: number, y: number) {
    this.touchMovement = { x, y };
  }

  setTouchAction(action: string) {
    this.touchAction = action;
  }

  getMovement(): Vector2 {
    let x = this.touchMovement.x;
    let y = this.touchMovement.y;

    if (this.isPressed('w') || this.isPressed('arrowup')) y -= 1;
    if (this.isPressed('s') || this.isPressed('arrowdown')) y += 1;
    if (this.isPressed('a') || this.isPressed('arrowleft')) x -= 1;
    if (this.isPressed('d') || this.isPressed('arrowright')) x += 1;

    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      const len = Math.sqrt(x * x + y * y);
      if (len > 1) {
        x /= len;
        y /= len;
      }
    }

    return { x, y };
  }
}
