// Every tuning number and colour in one place. The playfield is a fixed 1280x720 logical area;
// the renderer scales it to the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720, groundY: 620 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Gravity, in pixels per second squared, applied to projectiles and loose blocks. */
export const GRAVITY = 900;

/** The trebuchet's pivot, in playfield pixels. It never moves. */
export const TREBUCHET = { x: 130, y: FIELD.groundY, armLength: 92 };

/** Ammo types: id, name, shots are chosen with keys 1/2/3. Damage and behaviour live in physics.js. */
export const AMMO = [
  { id: 'rock', name: 'Scrap Rock', key: '1' },
  { id: 'firepot', name: 'Firepot', key: '2' },
  { id: 'chain', name: 'Chain-Shot', key: '3' },
];

export const PALETTE = {
  backdrop: '#14101d',
  sky: '#1d1830',
  skyHorizon: '#3a2a4d',
  ground: '#241d18',
  groundTop: '#3a2f26',
  stone: '#8d8fa3',
  stoneDark: '#6b6d80',
  wood: '#9a6b3f',
  woodDark: '#6f4a28',
  banner: '#d8443c',
  bannerGold: '#f2c94c',
  fire: '#ff7a2f',
  ember: '#ffc46b',
  trebuchet: '#7a5230',
  text: '#f2ead9',
  muted: '#a89ec4',
  hudPanel: '#221d33',
  aim: '#ffe9a8',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best castle reached is kept between visits (this browser only). */
export const BEST_KEY = 'siegebreak.best';
