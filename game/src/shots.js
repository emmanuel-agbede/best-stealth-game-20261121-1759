// shots.js — deterministic posed scenes for the maker's screenshots.
// Opening the game with ?shot=<name> freezes play in a composed moment of
// the real game (same code, same rendering), so the screenshots in
// screenshots/ are honest renders of Lamplight itself, taken in a browser:
//   start — the title over Floor I
//   play  — mid-patrol on Floor I, the thief crossing open floor
//   hide  — lamplight breaking on a crate, the thief in its shadow
//   end   — the getaway: sapphire in hand, the last floor cleared

import { TILE } from './config.js';

function place(entity, tx, ty, angle) {
  entity.x = (tx + 0.5) * TILE;
  entity.y = (ty + 0.5) * TILE;
  if (angle !== undefined) entity.angle = angle;
}

export function applyShot(state, name) {
  state.time = 1.25; // one frozen moment, sparkles and exit glow mid-pulse
  if (name === 'start') {
    state.phase = 'title';
    return;
  }
  if (name === 'play') {
    state.phase = 'playing';
    place(state.player, 12, 8, 0);
    state.player.moving = true;
    place(state.guards[0], 9, 2, 0);
    place(state.guards[1], 14, 12, Math.PI);
    state.suspicion.value = 0.12;
    return;
  }
  if (name === 'hide') {
    state.phase = 'playing';
    // The thief sits in the shadow of the crates on Floor I while a
    // warden's lamp sweeps straight down the gap beside them.
    place(state.player, 5, 4, -Math.PI / 2);
    state.player.sneaking = true;
    place(state.guards[0], 5, 1, Math.PI / 2);
    state.guards[0].mode = 'investigate';
    place(state.guards[1], 15, 11, Math.PI);
    state.suspicion.value = 0.34;
    return;
  }
  if (name === 'end') {
    state.phase = 'won';
    state.hasGem = true;
    place(state.player, 19, 12, 0);
    return;
  }
  state.phase = 'title';
}
