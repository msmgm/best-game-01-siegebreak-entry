// The game's rules and state, with no drawing and no browser in it: the castle, the shots,
// the ammo, the score, the win and lose conditions. step() advances one fixed step and
// returns what happened as bit flags, so the caller can react without the world knowing
// about screens or sound. Nothing here allocates after createWorld returns.
export const EVENT_SHOT = 1;
export const EVENT_HIT = 2;
export const EVENT_BANNER = 4;
export const EVENT_CASTLE = 8;
export const EVENT_OVER = 16;
export const EVENT_CAMPAIGN = 32;

export function createWorld(random) {
  throw new Error('not implemented');
}
