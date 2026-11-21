// config.js — every tunable number and colour of Lamplight in one place.
// The world is a grid of tiles; all speeds are pixels per second, all times
// are seconds, and distances the detection maths uses are in pixels.

export const TILE = 40;               // one tile is 40x40 px
export const VIEW_W = 960;            // logical canvas width  (24 tiles)
export const VIEW_H = 640;            // logical canvas height (16 tiles)

export const PLAYER = {
  radius: 13,
  walkSpeed: 148,                     // normal pace: quick, but audible nearby
  sneakSpeed: 74,                     // Shift held: half pace, near silent
  noiseRadius: 118,                   // walking carries this far
  sneakNoiseRadius: 30,               // sneaking carries this far
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 62,
  investigateSpeed: 96,
  chaseSpeed: 158,
  turnRate: 3.4,                      // radians per second a guard can swing round
  pauseAtWaypoint: 1.1,               // beats of stillness at each patrol point
  loseInterestAfter: 3.2,             // unseen seconds before a search is dropped
};

export const VISION = {
  range: 196,                         // how far lamplight reaches
  halfAngle: 0.62,                    // cone half-angle, radians (~35.5 degrees)
  coneRays: 28,                       // rays cast to shape the drawn lamplight
  fillTime: 0.55,                     // seconds in the light, at point blank, to be caught
  fillTimeFar: 1.6,                   // seconds at the cone's edge: distance buys time
  decayPerSecond: 0.55,               // how fast suspicion fades once you break line of sight
};

export const COLORS = {
  floorA: '#232742',
  floorB: '#20243c',
  rug: '#3a2b4d',
  wall: '#4d5578',
  wallTop: '#66719c',
  cover: '#6b4f35',
  coverTop: '#8a6a45',
  exit: '#39d98a',
  gem: '#57c7ff',
  player: '#f2e6c9',
  playerCoat: '#31517d',
  guard: '#d8dcea',
  guardCoat: '#7d3131',
  coneCalm: 'rgba(255, 214, 120, 0.30)',
  coneWary: 'rgba(255, 160, 60, 0.42)',
  coneAlert: 'rgba(255, 80, 60, 0.50)',
};
