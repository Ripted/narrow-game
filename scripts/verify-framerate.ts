/**
 * Verifies that player movement and camera follow are frame-rate independent.
 * Run with: npx tsx scripts/verify-framerate.ts
 *
 * Simulates the same wall-clock duration at 60fps and at 15fps. A correct
 * implementation covers the same distance and settles the camera in the same
 * time; a per-frame implementation covers a quarter of the distance.
 */
import { Player } from '../src/game/player';
import { Camera } from '../src/engine/camera';

function walk(fps: number, seconds: number) {
  const player = new Player('Tester', '#fff', { x: 1000, y: 1000 });
  // Use an exact step count: accumulating `t += dt` in floating point lands on
  // either side of `seconds` and silently adds or drops a step.
  const steps = Math.round(fps * seconds);
  const dt = seconds / steps;
  for (let i = 0; i < steps; i++) player.update({ x: 0, y: -1 }, [], dt);
  return player.pos.y;
}

function cameraFollow(fps: number, seconds: number) {
  const cam = new Camera(800, 600);
  const steps = Math.round(fps * seconds);
  const dt = seconds / steps;
  for (let i = 0; i < steps; i++) cam.update({ x: 2000, y: 2000 }, dt);
  return cam.pos.y;
}

function check(label: string, a: number, b: number, tolerance = 0.02) {
  const drift = Math.abs(a - b) / Math.max(1e-9, Math.abs(a));
  const ok = drift <= tolerance;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(34)} 60fps=${a.toFixed(2)}  15fps=${b.toFixed(2)}` +
      `  drift=${(drift * 100).toFixed(2)}%`
  );
  return ok;
}

let allOk = true;

// 2 seconds of walking at 300 px/s should cover ~600px regardless of frame rate.
const walk60 = walk(60, 2);
const walk15 = walk(15, 2);
allOk = check('walk distance (2s)', walk60, walk15) && allOk;

// A 4x slower machine must not walk a quarter as far.
const ratio = walk15 / walk60;
console.log(`      slow/fast walk ratio = ${ratio.toFixed(3)} (want ~1.000)`);
allOk = Math.abs(ratio - 1) < 0.02 && allOk;

// The camera should track identically at any frame rate. Check a short horizon
// too: after a long enough run both versions converge, so a 3s-only check would
// pass the old per-frame blend.
allOk = check('camera track (0.5s)', cameraFollow(60, 0.5), cameraFollow(15, 0.5)) && allOk;
allOk = check('camera settle (3s)', cameraFollow(60, 3), cameraFollow(15, 3)) && allOk;

// Sanity: the walk is actually the intended speed.
console.log(`      2s walk covered ${(1000 - walk60).toFixed(1)}px (want ~600)`);
allOk = Math.abs(1000 - walk60 - 600) < 6 && allOk;

console.log(allOk ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
process.exit(allOk ? 0 : 1);
