// Projectile flight and block collapse, with no drawing and no browser in it. A block is a
// rectangle with a position, a velocity, a spin and a health; it rests when something solid
// holds it up, and it falls, slides and knocks its neighbours when it does not. The world
// asks this module to advance one fixed step at a time and to report what happened.
export function createProjectile() {
  throw new Error('not implemented');
}
export function stepProjectile() {
  throw new Error('not implemented');
}
export function stepBlocks() {
  throw new Error('not implemented');
}
