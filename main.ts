// Lamplight — hand-in program for the make.fun "best stealth game" bounty.
//
// The game itself is the static site in game/ (open game/index.html in a
// browser, no build step, no network). This program is the courier: it copies
// game/ and screenshots/ into the output directory and writes dossier.json
// there with the vendored make.fun library, so the dossier the scorer rebuilds
// from those same files matches byte for byte.
//
// Run it the way the grader does, with MAKEFUN_OUTPUT_DIR naming the output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The caps below mirror the gate's own limits, so a hand-in that would fail
// the gate fails here first, loudly, instead of on the leaderboard.
const DOSSIER_CAPS = {
  text_max_bytes: 163_840,
  screenshots: { max: 4, max_bytes: 262_144 },
  game_max_files: 993,
  game_max_bytes: 50_331_648,
  game_path_max_bytes: 1_000,
};

function handIn(): void {
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoDir, 'game'), join(outputDir, 'game'), { recursive: true });

  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  const shotsDir = join(repoDir, 'screenshots');
  if (existsSync(shotsDir)) {
    cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
  }

  const dossier = buildDossier(outputDir, DOSSIER_CAPS);
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
  console.log(`Lamplight handed in: game/ and screenshots/ copied to ${outputDir}, dossier.json written (${dossier.length} bytes).`);
}

handIn();
