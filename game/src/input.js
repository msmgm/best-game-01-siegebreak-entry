// Mouse and keyboard input. The aim is a drag from the trebuchet: press, drag to set the angle
// and power, release to fire. One-shot presses (confirm, pause, restart, ammo choice) are queued
// as bit flags and taken once by the loop, so a press between two frames is never lost and never
// counted twice.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_AMMO_1 = 8;
export const ACTION_AMMO_2 = 16;
export const ACTION_AMMO_3 = 32;

export function createInput(target) {
  throw new Error('not implemented');
}
