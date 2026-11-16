// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s steps
// (several in a slow frame, none in a fast one), and the renderer paints what is there. The game
// moves between six screens: title, play, paused, castle-cleared, campaign-won and game over.
//
// ?seed=N fixes the wind and castle jitter. ?shot=start|play|win|end (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.
export function boot() {
  throw new Error('not implemented');
}
boot();
