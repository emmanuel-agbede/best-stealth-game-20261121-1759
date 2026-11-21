// main.js — Lamplight's conductor. Owns the game state (which floor, which
// phase: title, playing, caught, floor clear, or the clean getaway), runs
// the fixed-step loop, and wires the parts together: the thief hears and is
// heard, the wardens see and are seen, and the suspicion meter decides.

import { TILE, VIEW_W, VIEW_H, GUARD } from './config.js';
import { LEVELS, parseLevel } from './levels.js';
import { Player } from './player.js';
import { Guard, updateSuspicion } from './guard.js';
import * as input from './input.js';
import { SoundKit } from './audio.js';
import { drawScene, drawTitleScreen, drawMessageScreen } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const statusLine = document.getElementById('status');
const sound = new SoundKit();

const state = {
  phase: 'title',
  levelIndex: 0,
  level: null,
  parsed: null,
  player: null,
  guards: [],
  suspicion: { value: 0, seen: false },
  hasGem: false,
  time: 0,
  paused: false,
};

function loadLevel(index) {
  state.levelIndex = index;
  state.level = LEVELS[index];
  state.parsed = parseLevel(state.level);
  state.player = new Player(state.parsed.start);
  state.guards = state.level.patrols.map((patrol) => new Guard(patrol));
  state.suspicion.value = 0;
  state.suspicion.seen = false;
  state.hasGem = false;
  state.paused = false;
  announce(`${state.level.name}. ${state.level.intro}`);
}

function announce(text) {
  if (statusLine) statusLine.textContent = text;
}

function tileDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// hearing: a moving thief is a sound. Any warden inside the noise ring who
// is not already chasing comes to look at where the sound came from.
function hearNoise() {
  const p = state.player;
  if (!p.moving || p.noiseRadius === 0) return;
  for (const guard of state.guards) {
    if (guard.mode === 'chase') continue;
    if (tileDistance(guard, p) < p.noiseRadius) {
      guard.mode = 'investigate';
      guard.focus = { x: p.x, y: p.y };
    }
  }
}

let lastPlayerStep = 0;
const guardStepAcc = new Map();
let tickTimer = 0;

function playFootsteps(dt) {
  const p = state.player;
  const stepIndex = Math.floor(p.stepPhase);
  if (p.moving && stepIndex !== lastPlayerStep) {
    sound.footstep(p.sneaking ? 0.05 : 0.12, 1.35);
  }
  lastPlayerStep = stepIndex;
  for (const guard of state.guards) {
    const speed = guard.mode === 'patrol'
      ? GUARD.patrolSpeed
      : guard.mode === 'chase' ? GUARD.chaseSpeed : GUARD.investigateSpeed;
    const acc = (guardStepAcc.get(guard) ?? 0) + (guard.pauseLeft > 0 ? 0 : speed * dt);
    if (acc > 30) {
      const closeness = Math.max(0, 1 - tileDistance(guard, p) / 430);
      sound.footstep(closeness * 0.55, 0.8);
      guardStepAcc.set(guard, 0);
    } else {
      guardStepAcc.set(guard, acc);
    }
  }
}

function update(dt) {
  state.time += dt;
  const presses = input.takePresses();
  for (const code of presses) {
    if (code === 'KeyM') sound.muted = !sound.muted;
    if (code === 'KeyR' && (state.phase === 'playing' || state.phase === 'caught')) {
      loadLevel(state.levelIndex);
      state.phase = 'playing';
    }
    if (code === 'KeyP' && state.phase === 'playing') state.paused = !state.paused;
    if (code === 'Escape' && state.phase !== 'title') {
      loadLevel(state.levelIndex);
      state.phase = 'title';
    }
    if (code === 'Enter' || code === 'Space') {
      sound.ensure();
      if (state.phase === 'title') state.phase = 'playing';
      else if (state.phase === 'caught') { loadLevel(state.levelIndex); state.phase = 'playing'; }
      else if (state.phase === 'clear') { loadLevel(state.levelIndex + 1); state.phase = 'playing'; }
      else if (state.phase === 'won') { loadLevel(0); state.phase = 'title'; }
    }
  }
  if (state.phase !== 'playing' || state.paused) return;

  state.player.update(dt, input, state.parsed.solid);
  hearNoise();
  const world = { solid: state.parsed.solid, player: state.player, suspicion: state.suspicion };
  for (const guard of state.guards) guard.update(dt, world);
  updateSuspicion(state.suspicion, dt, state.guards, state.player);
  playFootsteps(dt);

  if (state.suspicion.seen) {
    tickTimer -= dt;
    if (tickTimer <= 0) {
      sound.suspicionTick(state.suspicion.value);
      tickTimer = 0.14;
    }
  }

  const gemCentre = {
    x: (state.parsed.gem.x + 0.5) * TILE,
    y: (state.parsed.gem.y + 0.5) * TILE,
  };
  if (!state.hasGem && tileDistance(state.player, gemCentre) < 26) {
    state.hasGem = true;
    sound.gemTaken();
    announce('The Star Sapphire is yours. Reach the exit.');
  }

  const exitCentre = {
    x: (state.parsed.exit.x + 0.5) * TILE,
    y: (state.parsed.exit.y + 0.5) * TILE,
  };
  if (state.hasGem && tileDistance(state.player, exitCentre) < 26) {
    sound.floorCleared();
    state.phase = state.levelIndex === LEVELS.length - 1 ? 'won' : 'clear';
    announce(state.phase === 'won' ? 'A clean getaway.' : 'Floor cleared.');
    return;
  }

  const grabbed = state.guards.some((g) => tileDistance(g, state.player) < 24);
  if (state.suspicion.value >= 1 || grabbed) {
    state.phase = 'caught';
    sound.caught();
    announce('Spotted! The wardens have you.');
  }
}

function draw() {
  if (state.phase === 'title') {
    drawTitleScreen(ctx, state);
  } else if (state.phase === 'caught') {
    drawMessageScreen(ctx, state, 'SPOTTED!', [
      'The lamplight held you a moment too long.',
      state.level.intro,
    ], '#ff5040');
  } else if (state.phase === 'clear') {
    drawMessageScreen(ctx, state, 'FLOOR CLEARED', [
      'Down the stairs, quiet as dust.',
      LEVELS[state.levelIndex + 1].name + ' awaits.',
    ], '#39d98a');
  } else if (state.phase === 'won') {
    drawMessageScreen(ctx, state, 'A CLEAN GETAWAY', [
      'Three floors, one sapphire, and no one saw a thing.',
      'The museum opens in the morning none the wiser.',
    ], '#ffd678');
  } else {
    drawScene(ctx, state);
    if (state.paused) {
      ctx.fillStyle = 'rgba(4, 5, 14, 0.5)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.fillStyle = '#e8e4d8';
      ctx.font = 'bold 34px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', VIEW_W / 2, VIEW_H / 2);
    }
  }
}

// Fit the canvas into the window, keeping the museum's proportions.
function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
  canvas.style.marginLeft = `${Math.floor((window.innerWidth - VIEW_W * scale) / 2)}px`;
  canvas.style.marginTop = `${Math.floor((window.innerHeight - VIEW_H * scale) / 2)}px`;
}

const shotName = new URLSearchParams(window.location.search).get('shot');
loadLevel(0);
if (shotName) {
  if (shotName === 'end') loadLevel(LEVELS.length - 1);
  applyShot(state, shotName);
}
input.initInput(window);
window.addEventListener('resize', fitCanvas);
fitCanvas();

// Exposed for the maker's own play-testing in a headless browser.
window.__lamplight = state;

let lastStamp = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastStamp) / 1000);
  lastStamp = now;
  if (!shotName) update(dt);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
