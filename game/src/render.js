// Drawing only: the world's state and the current screen in, pixels out. The 1280x720 playfield
// is scaled to fit the window and centred, the margin filled with the backdrop colour. Canvas
// shapes and text for the field, the trebuchet, the castle, the particles and the HUD/panels.
// Text that holds a number is rebuilt only when the number changes, so a frame allocates nothing.
export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CASTLE = 'castle';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

export function createRenderer(canvas) {
  throw new Error('not implemented');
}
