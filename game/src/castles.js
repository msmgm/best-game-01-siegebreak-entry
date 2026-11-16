// The ten castles, hand-built. Each castle is a list of blocks standing on the ground on the
// right of the field, plus the banners that must fall to win it.
//
// Block: { x, y, w, h, type } — x/y are the top-left corner in playfield pixels, type is
// 'stone' (tough, two hits) or 'wood' (one hit, burns when a firepot breaks on it).
// Banner: { x, y } — the pole's base sits on top of the block it names by index in `on`,
// and the banner falls when that block is destroyed or topples.
// Castle: { name, sub, shots, wind: { min, max }, blocks, banners, gusts }
//   shots: how many shots the player gets for this castle.
//   wind: the range the per-shot wind is drawn from, in px/s (negative blows left).
//   gusts: true from the later castles on — the wind changes mid-flight.
export const CASTLES = [];
