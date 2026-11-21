// vision.js — who can see what. A guard sees the thief when three things
// line up: the thief is inside the lamp cone (range + half-angle), and the
// straight line between them crosses no wall, crate or pillar. The cone's
// visible shape is found by casting rays and clipping them at the first
// solid tile, so lamplight pools around corners the way players expect.

import { TILE, VISION } from './config.js';

// segmentBlocked walks the line from (x0,y0) to (x1,y1) in small steps and
// reports whether any solid tile lies on it. Steps of a quarter tile keep
// thin diagonal leaks from slipping through.
export function segmentBlocked(solid, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / (TILE / 4)));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tx = Math.floor((x0 + dx * t) / TILE);
    const ty = Math.floor((y0 + dy * t) / TILE);
    if (solid[ty]?.[tx]) return true;
  }
  return false;
}

// angleDifference wraps an angle gap into [-PI, PI].
export function angleDifference(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// canSee is the guard's-eye test used by the detection maths.
export function canSee(solid, guard, target) {
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > VISION.range) return false;
  if (dist > TILE * 0.9) {
    const bearing = Math.atan2(dy, dx);
    if (Math.abs(angleDifference(bearing, guard.angle)) > VISION.halfAngle) return false;
  }
  return !segmentBlocked(solid, guard.x, guard.y, target.x, target.y);
}

// conePolygon casts a fan of rays across the cone and returns the lit
// outline: each ray stops at the first solid tile (or at full range), so
// the drawn lamplight is exactly the ground the guard can see.
export function conePolygon(solid, guard) {
  const rays = VISION.coneRays;
  const points = [[guard.x, guard.y]];
  for (let i = 0; i <= rays; i++) {
    const a = guard.angle - VISION.halfAngle + (2 * VISION.halfAngle * i) / rays;
    const step = TILE / 3;
    let d = step;
    let px = guard.x;
    let py = guard.y;
    while (d <= VISION.range) {
      px = guard.x + Math.cos(a) * d;
      py = guard.y + Math.sin(a) * d;
      const tx = Math.floor(px / TILE);
      const ty = Math.floor(py / TILE);
      if (solid[ty]?.[tx]) break;
      d += step;
    }
    points.push([px, py]);
  }
  return points;
}
