export class InputHandler {
  keys: Set<string> = new Set();

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  isPressed(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  getMovement(): { x: number; y: number } {
    let x = 0;
    let y = 0;

    if (this.isPressed('w') || this.isPressed('arrowup')) y -= 1;
    if (this.isPressed('s') || this.isPressed('arrowdown')) y += 1;
    if (this.isPressed('a') || this.isPressed('arrowleft')) x -= 1;
    if (this.isPressed('d') || this.isPressed('arrowright')) x += 1;

    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      const len = Math.sqrt(x * x + y * y);
      x /= len;
      y /= len;
    }

    return { x, y };
  }
}
