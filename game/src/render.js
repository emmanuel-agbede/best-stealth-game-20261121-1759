// render.js — everything the player sees. The museum is drawn lit, then a
// sheet of darkness is laid over it and each warden's lamplight is cut out
// of the sheet, so what is safe and what is watched reads at a glance:
// warm pools are danger, blue dark is cover. Entities are drawn last, on
// top of the dark, so wardens and the thief are never lost in the gloom.

import { TILE, VIEW_W, VIEW_H, COLORS } from './config.js';
import { coverAt } from './levels.js';
import { conePolygon } from './vision.js';

const darkness = document.createElement('canvas');
darkness.width = VIEW_W;
darkness.height = VIEW_H;

function drawFloor(ctx, state) {
  const { parsed, level } = state;
  for (let y = 0; y < parsed.rows; y++) {
    for (let x = 0; x < parsed.cols; x++) {
      const px = x * TILE;
      const py = y * TILE;
      ctx.fillStyle = parsed.rugs[y][x]
        ? COLORS.rug
        : (x + y) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(px, py, TILE, TILE);
      if (parsed.solid[y][x]) {
        if (coverAt(level, x, y)) {
          ctx.fillStyle = COLORS.cover;
          ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
          ctx.fillStyle = COLORS.coverTop;
          ctx.fillRect(px + 3, py + 3, TILE - 6, 7);
        } else {
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = COLORS.wallTop;
          ctx.fillRect(px, py, TILE, 6);
        }
      }
    }
  }
  // The exit: a green-lit doorway mat.
  const exit = parsed.exit;
  ctx.fillStyle = COLORS.exit;
  ctx.globalAlpha = 0.75 + 0.25 * Math.sin(state.time * 3);
  ctx.fillRect(exit.x * TILE + 4, exit.y * TILE + 4, TILE - 8, TILE - 8);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#0b0e1a';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', (exit.x + 0.5) * TILE, (exit.y + 0.5) * TILE + 5);
}

function drawGem(ctx, state) {
  if (state.hasGem) return;
  const { gem } = state.parsed;
  const cx = (gem.x + 0.5) * TILE;
  const cy = (gem.y + 0.5) * TILE + Math.sin(state.time * 2.2) * 3;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = COLORS.gem;
  ctx.fillRect(-8, -8, 16, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(-8, -8, 7, 7);
  ctx.restore();
  // Sparkles, so the eye finds the prize across a dark room.
  ctx.fillStyle = 'rgba(160, 220, 255, 0.9)';
  const tw = Math.floor(state.time * 2) % 4;
  ctx.fillRect(cx + [-16, 14, -4, 10][tw], cy + [-14, -10, 15, 13][tw], 3, 3);
}

function drawDarkness(ctx, state) {
  const dctx = darkness.getContext('2d');
  dctx.clearRect(0, 0, VIEW_W, VIEW_H);
  dctx.fillStyle = 'rgba(5, 7, 18, 0.78)';
  dctx.fillRect(0, 0, VIEW_W, VIEW_H);
  dctx.globalCompositeOperation = 'destination-out';
  // Moonlight through the museum's skylights: a faint ambient lift in the
  // middle of the room, so the layout stays readable even where no lamp
  // reaches — dark enough to hide in, light enough to plan a route by.
  const moon = dctx.createRadialGradient(
    VIEW_W / 2, VIEW_H / 2, 60, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.62,
  );
  moon.addColorStop(0, 'rgba(0,0,0,0.30)');
  moon.addColorStop(1, 'rgba(0,0,0,0)');
  dctx.fillStyle = moon;
  dctx.fillRect(0, 0, VIEW_W, VIEW_H);
  for (const guard of state.guards) {
    const poly = conePolygon(state.parsed.solid, guard);
    dctx.beginPath();
    poly.forEach(([x, y], i) => (i === 0 ? dctx.moveTo(x, y) : dctx.lineTo(x, y)));
    dctx.closePath();
    dctx.fillStyle = 'rgba(0,0,0,0.92)';
    dctx.fill();
    const glow = dctx.createRadialGradient(guard.x, guard.y, 4, guard.x, guard.y, 46);
    glow.addColorStop(0, 'rgba(0,0,0,0.9)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = glow;
    dctx.fillRect(guard.x - 46, guard.y - 46, 92, 92);
  }
  // The thief's own faint candle-glow.
  const p = state.player;
  const self = dctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 58);
  self.addColorStop(0, 'rgba(0,0,0,0.95)');
  self.addColorStop(1, 'rgba(0,0,0,0)');
  dctx.fillStyle = self;
  dctx.fillRect(p.x - 58, p.y - 58, 116, 116);
  dctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(darkness, 0, 0);

  // Warm tint inside each cone, so lamplight reads as lamplight.
  for (const guard of state.guards) {
    const poly = conePolygon(state.parsed.solid, guard);
    ctx.beginPath();
    poly.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = guard.mode === 'chase'
      ? COLORS.coneAlert
      : guard.mode === 'investigate' || guard.mode === 'return'
        ? COLORS.coneWary
        : COLORS.coneCalm;
    ctx.fill();
  }
}

function drawGuard(ctx, guard) {
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.rotate(guard.angle);
  ctx.fillStyle = COLORS.guardCoat;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(3, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  // The lamp, held out front.
  ctx.fillStyle = '#ffd678';
  ctx.fillRect(10, -3, 7, 6);
  ctx.restore();
  if (guard.mode === 'investigate' || guard.mode === 'return') {
    ctx.fillStyle = '#ffb03a';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - 22);
  } else if (guard.mode === 'chase') {
    ctx.fillStyle = '#ff5040';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 22);
  }
}

function drawPlayer(ctx, state) {
  const p = state.player;
  if (p.moving) {
    // The noise ring: how far your footsteps carry right now.
    ctx.strokeStyle = p.sneaking ? 'rgba(160,200,255,0.18)' : 'rgba(255,120,90,0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.noiseRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  const bob = p.moving ? Math.sin(p.stepPhase * Math.PI) * 1.6 : 0;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  ctx.rotate(p.angle);
  ctx.fillStyle = COLORS.playerCoat;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(3, 0, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (state.hasGem) {
    ctx.fillStyle = COLORS.gem;
    ctx.save();
    ctx.translate(p.x + 12, p.y - 12);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = 'rgba(5, 7, 18, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, 34);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = '15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(state.level.name, 12, 22);
  ctx.textAlign = 'center';
  ctx.fillStyle = state.hasGem ? COLORS.gem : '#8b90a8';
  ctx.fillText(state.hasGem ? 'Sapphire in hand — reach the EXIT' : 'Steal the Star Sapphire', VIEW_W / 2, 22);
  // The suspicion eye: an outline that fills with alarm.
  const w = 170;
  const x = VIEW_W - w - 12;
  ctx.strokeStyle = '#e8e4d8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, 10, w, 13);
  const v = state.suspicion.value;
  ctx.fillStyle = v > 0.66 ? '#ff5040' : v > 0.33 ? '#ffb03a' : '#ffd678';
  if (v > 0) ctx.fillRect(x + 1.5, 11.5, (w - 3) * v, 10);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('ALARM', x - 8, 21);
}

export function drawScene(ctx, state) {
  drawFloor(ctx, state);
  drawGem(ctx, state);
  drawDarkness(ctx, state);
  for (const guard of state.guards) drawGuard(ctx, guard);
  drawPlayer(ctx, state);
  drawHud(ctx, state);
}

function centredText(ctx, lines, baseY) {
  ctx.textAlign = 'center';
  lines.forEach(([text, font, colour], i) => {
    ctx.font = font;
    ctx.fillStyle = colour;
    ctx.fillText(text, VIEW_W / 2, baseY + i * 44);
  });
}

export function drawTitleScreen(ctx, state) {
  drawScene(ctx, state);
  ctx.fillStyle = 'rgba(4, 5, 14, 0.66)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  centredText(ctx, [
    ['LAMPLIGHT', 'bold 64px Georgia, serif', '#ffd678'],
    ['A museum, after hours', 'italic 22px Georgia, serif', '#e8e4d8'],
    ['', '', ''],
    ['Slip past the wardens, steal the Star Sapphire, and reach the exit unseen.', '17px system-ui, sans-serif', '#e8e4d8'],
    ['Move: WASD or arrows · Sneak: hold Shift · Footsteps carry — watch the ring', '15px system-ui, sans-serif', '#b9bdd2'],
    ['Stay out of the lamplight. Break line of sight and suspicion fades.', '15px system-ui, sans-serif', '#b9bdd2'],
    ['', '', ''],
    ['Press Enter to begin', 'bold 19px system-ui, sans-serif', '#39d98a'],
  ], 150);
}

export function drawMessageScreen(ctx, state, title, lines, colour) {
  drawScene(ctx, state);
  ctx.fillStyle = 'rgba(4, 5, 14, 0.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  centredText(ctx, [
    [title, 'bold 52px Georgia, serif', colour],
    ...lines.map((text) => [text, '18px system-ui, sans-serif', '#e8e4d8']),
    ['', '', ''],
    ['Press Enter to continue', 'bold 18px system-ui, sans-serif', '#39d98a'],
  ], 210);
}
