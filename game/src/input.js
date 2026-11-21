// input.js — the keyboard, as a set of held keys plus a queue of one-shot
// presses. Movement reads the held set every frame; menus and restarts read
// the press queue, so a tap is never lost between frames.

const held = new Set();
const pressed = [];

const TRACKED = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight',
  'Space', 'Enter', 'KeyR', 'KeyM', 'KeyP', 'Escape',
]);

export function initInput(window) {
  window.addEventListener('keydown', (event) => {
    if (!TRACKED.has(event.code)) return;
    event.preventDefault();
    if (!event.repeat) pressed.push(event.code);
    held.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    held.delete(event.code);
  });
  window.addEventListener('blur', () => held.clear());
}

// axis reads a held direction pair as -1, 0 or 1.
function axis(negativeCodes, positiveCodes) {
  const neg = negativeCodes.some((code) => held.has(code));
  const pos = positiveCodes.some((code) => held.has(code));
  return (pos ? 1 : 0) - (neg ? 1 : 0);
}

export function moveAxis() {
  return {
    x: axis(['ArrowLeft', 'KeyA'], ['ArrowRight', 'KeyD']),
    y: axis(['ArrowUp', 'KeyW'], ['ArrowDown', 'KeyS']),
  };
}

export function sneaking() {
  return held.has('ShiftLeft') || held.has('ShiftRight');
}

// takePresses drains the one-shot queue; call once per frame.
export function takePresses() {
  return pressed.splice(0, pressed.length);
}
