// levels.js — the three museum floors of Lamplight, drawn as tile maps.
//
// Legend:  # wall    C crate (cover)   P pillar (cover)   , rug (floor)
//          S thief's start   G the Star Sapphire   E exit   . floor
// Crates and pillars block movement and sight alike: duck behind one and a
// warden's lamplight breaks on it. Patrols are waypoint loops in tile
// coordinates; wardens walk them in order, forever, until you give them
// something more interesting to do.

export const LEVELS = [
  {
    name: 'Floor I — The Entrance Hall',
    intro: 'Two wardens, one sapphire. Learn their rounds.',
    map: [
      '########################',
      '#......................#',
      '#......................#',
      '#....CC........CC......#',
      '#.....CC...P...........#',
      '#.........######.......#',
      '#..P................G..#',
      '#......................#',
      '#......................#',
      '#......,,,.............#',
      '#......,,,.............#',
      '#......,,,.............#',
      '#..P................E..#',
      '#......................#',
      '#..S....CC....P........#',
      '########################',
    ],
    patrols: [
      [[4, 2], [19, 2], [19, 8], [4, 8]],
      [[6, 10], [16, 10], [16, 13], [6, 13]],
    ],
  },
  {
    name: 'Floor II — The Gallery',
    intro: 'One door between you and the vault alcove. Time it.',
    map: [
      '########################',
      '#..........#...........#',
      '#..CC......#......CC...#',
      '#..CC......#...........#',
      '#..........#....P......#',
      '#....P.................#',
      '#..........#...........#',
      '#....#####.#....,,,....#',
      '#....#G..#.#....,,,..E.#',
      '#....#...#.#....,,,....#',
      '#..........#...........#',
      '#..P.......#....CC.....#',
      '#..........#....CC.....#',
      '#....CC....#...........#',
      '#..S.......#......P....#',
      '########################',
    ],
    patrols: [
      [[6, 1], [9, 1], [9, 6], [6, 6]],
      [[2, 10], [9, 10], [9, 14], [2, 14]],
      [[13, 1], [21, 1], [21, 3], [13, 3]],
    ],
  },
  {
    name: 'Floor III — The Vault Wing',
    intro: 'Four wardens and a long, lamplit sweep. Patience.',
    map: [
      '########################',
      '#....#........#........#',
      '#....#...CC...#...CC...#',
      '#..P.#...CC...#........#',
      '#....#........#....P...#',
      '#......................#',
      '#.####...P....####.....#',
      '#......................#',
      '#....,,,....CC.....#...#',
      '#....,,,....CC.....#G..#',
      '#....,,,...............#',
      '#..P......P......##....#',
      '#......................#',
      '#....CC......CC....E...#',
      '#..S......P............#',
      '########################',
    ],
    patrols: [
      [[1, 1], [4, 1], [4, 4], [1, 4]],
      [[7, 1], [12, 1], [12, 4], [7, 4]],
      [[16, 1], [22, 1], [22, 3], [16, 3]],
      [[2, 7], [21, 7], [21, 12], [2, 12]],
    ],
  },
];

const SOLID_CHARS = new Set(['#', 'C', 'P']);

// parseLevel turns a level's map into the structures the game runs on:
// a solidity grid, the special tiles, and pixel-space spawn points.
export function parseLevel(level) {
  const rows = level.map.length;
  const cols = level.map[0].length;
  const solid = [];
  const rugs = [];
  let start = null;
  let gem = null;
  let exit = null;
  for (let y = 0; y < rows; y++) {
    solid.push([]);
    rugs.push([]);
    for (let x = 0; x < cols; x++) {
      const ch = level.map[y][x];
      solid[y].push(SOLID_CHARS.has(ch));
      rugs[y].push(ch === ',');
      if (ch === 'S') start = { x, y };
      if (ch === 'G') gem = { x, y };
      if (ch === 'E') exit = { x, y };
    }
  }
  return { solid, rugs, start, gem, exit, rows, cols };
}

// coverAt reports whether a tile is hide-behind cover (crate or pillar),
// as opposed to a full wall: the renderer draws them differently.
export function coverAt(level, x, y) {
  const ch = level.map[y]?.[x];
  return ch === 'C' || ch === 'P';
}
