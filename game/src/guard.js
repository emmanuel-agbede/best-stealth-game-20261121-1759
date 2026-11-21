// guard.js — a warden. Wardens walk a waypoint loop at patrol pace, and
// think in four moods:
//   patrol      — walk the loop, pausing a beat at each corner;
//   investigate — something moved or sounded: go and look at it;
//   chase       — the thief is in the light and the alarm is filling;
//   return      — the trail went cold: walk back to the loop.
// Suspicion is a single meter, shared by the whole floor: it fills while
// any warden sees the thief (faster up close, faster still if the thief is
// running) and drains while nobody does. A full meter is a caught thief;
// a half-full one sends the nearest warden to investigate, which is the
// player's chance to break line of sight and let it fade.

import { TILE, GUARD, VISION } from './config.js';
import { angleDifference, canSee } from './vision.js';

export class Guard {
  constructor(waypoints) {
    this.waypoints = waypoints.map(([tx, ty]) => ({
      x: (tx + 0.5) * TILE,
      y: (ty + 0.5) * TILE,
    }));
    const first = this.waypoints[0];
    const second = this.waypoints[1] ?? first;
    this.x = first.x;
    this.y = first.y;
    this.angle = Math.atan2(second.y - first.y, second.x - first.x);
    this.targetIndex = 1 % this.waypoints.length;
    this.mode = 'patrol';
    this.pauseLeft = 0;
    this.focus = null;        // the point being investigated or chased
    this.unseenFor = 0;       // seconds since the thief was last visible
    this.seesThief = false;
  }

  // stepToward moves the guard toward a point at a speed, turning first:
  // a warden swings his lamp round at a limited rate, which is what makes
  // darting behind a guard's back survivable.
  stepToward(point, speed, dt) {
    const dx = point.x - this.x;
    const dy = point.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return true;
    const wanted = Math.atan2(dy, dx);
    const turn = angleDifference(wanted, this.angle);
    const maxTurn = GUARD.turnRate * dt;
    this.angle += Math.max(-maxTurn, Math.min(maxTurn, turn));
    if (Math.abs(turn) < 1.2) {
      const step = Math.min(dist, speed * dt);
      this.x += Math.cos(this.angle) * step;
      this.y += Math.sin(this.angle) * step;
    }
    return dist < TILE * 0.4;
  }

  update(dt, world) {
    const { solid, player, suspicion } = world;
    this.seesThief = canSee(solid, this, player);

    if (this.seesThief) {
      this.unseenFor = 0;
      this.focus = { x: player.x, y: player.y };
      if (suspicion.value > 0.45) this.mode = 'chase';
      else if (this.mode === 'patrol' || this.mode === 'return') this.mode = 'investigate';
    } else {
      this.unseenFor += dt;
    }

    switch (this.mode) {
      case 'patrol': {
        if (this.pauseLeft > 0) {
          this.pauseLeft -= dt;
          break;
        }
        const target = this.waypoints[this.targetIndex];
        if (this.stepToward(target, GUARD.patrolSpeed, dt)) {
          this.targetIndex = (this.targetIndex + 1) % this.waypoints.length;
          this.pauseLeft = GUARD.pauseAtWaypoint;
        }
        break;
      }
      case 'investigate': {
        if (!this.focus || this.stepToward(this.focus, GUARD.investigateSpeed, dt)) {
          // Arrived and found nothing: sweep the lamp back and forth over
          // the spot, the way a person searches, then give up and go back.
          if (this.searchSweep === undefined) {
            this.searchSweep = 0;
            this.searchFacing = this.angle;
          }
          this.searchSweep += dt;
          this.angle = this.searchFacing + Math.sin(this.searchSweep * 2.4) * 0.75;
          if (this.unseenFor > 1.4) {
            this.searchSweep = undefined;
            this.mode = 'return';
          }
        }
        break;
      }
      case 'chase': {
        if (this.focus) this.stepToward(this.focus, GUARD.chaseSpeed, dt);
        if (this.unseenFor > GUARD.loseInterestAfter) this.mode = 'investigate';
        break;
      }
      case 'return': {
        const target = this.waypoints[this.targetIndex];
        if (this.stepToward(target, GUARD.investigateSpeed, dt)) this.mode = 'patrol';
        break;
      }
    }
    return this.seesThief;
  }
}

// updateSuspicion advances the shared meter for one frame and reports the
// state the renderer and the catch check need.
export function updateSuspicion(suspicion, dt, guards, player) {
  const seer = guards.find((g) => g.seesThief);
  if (seer) {
    const dist = Math.hypot(player.x - seer.x, player.y - seer.y);
    const closeness = 1 - Math.min(1, dist / VISION.range); // 1 at point blank
    const fillSeconds = VISION.fillTime + (VISION.fillTimeFar - VISION.fillTime) * (1 - closeness);
    let rate = dt / fillSeconds;
    if (!player.sneaking && (player.moving)) rate *= 1.35;   // a running thief is obvious
    suspicion.value = Math.min(1, suspicion.value + rate);
  } else {
    suspicion.value = Math.max(0, suspicion.value - VISION.decayPerSecond * dt);
  }
  suspicion.seen = Boolean(seer);
  return suspicion;
}
