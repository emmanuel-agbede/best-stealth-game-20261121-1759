// player.js — the thief. Moves with the arrow keys or WASD, slides along
// walls instead of sticking to them, and makes noise in proportion to pace:
// walking carries across a room, sneaking (Shift) barely past arm's reach.
// Wardens investigate the loudest noise they hear, so a run across open
// floor is a confession.

import { TILE, PLAYER } from './config.js';

// circleHitsSolid reports whether a circle at (x,y) overlaps a solid tile.
function circleHitsSolid(solid, x, y, radius) {
  const minTx = Math.floor((x - radius) / TILE);
  const maxTx = Math.floor((x + radius) / TILE);
  const minTy = Math.floor((y - radius) / TILE);
  const maxTy = Math.floor((y + radius) / TILE);
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (!solid[ty]?.[tx]) continue;
      const nearX = Math.max(tx * TILE, Math.min(x, tx * TILE + TILE));
      const nearY = Math.max(ty * TILE, Math.min(y, ty * TILE + TILE));
      if (Math.hypot(x - nearX, y - nearY) < radius) return true;
    }
  }
  return false;
}

export class Player {
  constructor(startTile) {
    this.x = (startTile.x + 0.5) * TILE;
    this.y = (startTile.y + 0.5) * TILE;
    this.angle = -Math.PI / 2;
    this.moving = false;
    this.sneaking = false;
    this.stepPhase = 0;       // walks the footstep sounds and the bob
  }

  get noiseRadius() {
    if (!this.moving) return 0;
    return this.sneaking ? PLAYER.sneakNoiseRadius : PLAYER.noiseRadius;
  }

  update(dt, input, solid) {
    const axis = input.moveAxis();
    this.sneaking = input.sneaking();
    this.moving = axis.x !== 0 || axis.y !== 0;
    if (!this.moving) return;

    const length = Math.hypot(axis.x, axis.y);
    const speed = this.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    const dx = (axis.x / length) * speed * dt;
    const dy = (axis.y / length) * speed * dt;
    this.angle = Math.atan2(axis.y, axis.x);

    // Move one axis at a time so the thief slides along walls and cover.
    const fromX = this.x;
    const fromY = this.y;
    if (!circleHitsSolid(solid, this.x + dx, this.y, PLAYER.radius)) this.x += dx;
    if (!circleHitsSolid(solid, this.x, this.y + dy, PLAYER.radius)) this.y += dy;

    // Footfalls follow the distance actually travelled: pushing against a
    // wall is silent, sliding along one is not.
    const travelled = Math.hypot(this.x - fromX, this.y - fromY);
    this.moving = travelled > 0;
    this.stepPhase += travelled / 26; // one footfall per 26 px travelled
  }
}
