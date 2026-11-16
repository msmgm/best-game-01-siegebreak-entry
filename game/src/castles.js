// The ten castles, hand-built. Each castle is a list of blocks standing on the ground on the
// right of the field, plus the banners that must fall to win it.
//
// Block: { x, y, w, h, type } — x/y are the top-left corner in playfield pixels, type is
// 'stone' (tough, two hits) or 'wood' (one hit, burns when a firepot breaks on it).
// Banner: { x, y, on } — the pole's base sits on top of the block it names by index in `on`,
// and the banner falls when that block is destroyed or topples.
// Castle: { name, sub, shots, wind: { min, max }, blocks, banners, gusts, movers }
//   shots: how many shots the player gets for this castle.
//   wind: the range the per-shot wind is drawn from, in px/s (negative blows left).
//   gusts: true from the later castles on — the wind changes mid-flight.
//   movers: optional sliding blocks with banners.
export const CASTLES = [
  {
    name: 'First Stones',
    sub: 'A lone bastion of grey limestone guarding the valley road.',
    shots: 8,
    wind: { min: -20, max: 20 },
    gusts: false,
    blocks: [
      { x: 900, y: 560, w: 80, h: 60, type: 'stone' },
      { x: 910, y: 510, w: 60, h: 50, type: 'stone' }
    ],
    banners: [
      { x: 940, y: 510, on: 1 }
    ]
  },
  {
    name: 'Twin Watch',
    sub: 'Pines harvested in haste, brittle against the iron bolt.',
    shots: 8,
    wind: { min: -40, max: 40 },
    gusts: false,
    blocks: [
      { x: 800, y: 570, w: 70, h: 50, type: 'wood' },
      { x: 810, y: 520, w: 50, h: 50, type: 'wood' },
      { x: 1050, y: 570, w: 70, h: 50, type: 'wood' },
      { x: 1060, y: 520, w: 50, h: 50, type: 'wood' }
    ],
    banners: [
      { x: 835, y: 520, on: 1 },
      { x: 1085, y: 520, on: 3 }
    ]
  },
  {
    name: 'The Gatehouse',
    sub: 'An ancient stone archway spanning the old trade route.',
    shots: 8,
    wind: { min: -60, max: 60 },
    gusts: false,
    blocks: [
      { x: 880, y: 530, w: 50, h: 90, type: 'stone' },
      { x: 1000, y: 530, w: 50, h: 90, type: 'stone' },
      { x: 860, y: 480, w: 210, h: 50, type: 'stone' }
    ],
    banners: [
      { x: 965, y: 480, on: 2 }
    ]
  },
  {
    name: 'Ember Hall',
    sub: 'A long timber barracks waiting for the incendiary spark.',
    shots: 9,
    wind: { min: -60, max: 60 },
    gusts: false,
    blocks: [
      { x: 820, y: 560, w: 120, h: 60, type: 'wood' },
      { x: 950, y: 560, w: 120, h: 60, type: 'wood' },
      { x: 840, y: 510, w: 80, h: 50, type: 'wood' },
      { x: 970, y: 510, w: 80, h: 50, type: 'wood' }
    ],
    banners: [
      { x: 880, y: 510, on: 2 },
      { x: 1010, y: 510, on: 3 }
    ]
  },
  {
    name: 'Stonekeep',
    sub: 'A reinforced keep where the banner sits under a protective slab.',
    shots: 9,
    wind: { min: -80, max: 80 },
    gusts: false,
    blocks: [
      { x: 910, y: 500, w: 30, h: 120, type: 'stone' },
      { x: 990, y: 500, w: 30, h: 120, type: 'stone' },
      { x: 940, y: 530, w: 50, h: 90, type: 'stone' },
      { x: 890, y: 460, w: 150, h: 40, type: 'stone' }
    ],
    banners: [
      { x: 965, y: 530, on: 2 }
    ]
  },
  {
    name: 'Three Sisters',
    sub: 'Three slender stone spires rising against the gale.',
    shots: 10,
    wind: { min: -80, max: 80 },
    gusts: true,
    blocks: [
      { x: 760, y: 550, w: 60, h: 70, type: 'stone' },
      { x: 770, y: 480, w: 40, h: 70, type: 'stone' },
      { x: 910, y: 530, w: 60, h: 90, type: 'stone' },
      { x: 920, y: 450, w: 40, h: 80, type: 'stone' },
      { x: 1060, y: 550, w: 60, h: 70, type: 'stone' },
      { x: 1070, y: 480, w: 40, h: 70, type: 'stone' }
    ],
    banners: [
      { x: 790, y: 480, on: 1 },
      { x: 940, y: 450, on: 3 },
      { x: 1090, y: 480, on: 5 }
    ]
  },
  {
    name: 'The Mill',
    sub: 'Gears turn within the limestone walls, shifting the standard.',
    shots: 10,
    wind: { min: -80, max: 80 },
    gusts: true,
    blocks: [
      { x: 780, y: 540, w: 70, h: 80, type: 'stone' },
      { x: 790, y: 480, w: 50, h: 60, type: 'stone' },
      { x: 1030, y: 540, w: 70, h: 80, type: 'stone' },
      { x: 1040, y: 480, w: 50, h: 60, type: 'stone' },
      { x: 890, y: 560, w: 100, h: 60, type: 'stone' },
      { x: 900, y: 510, w: 80, h: 50, type: 'wood' }
    ],
    banners: [
      { x: 815, y: 480, on: 1 },
      { x: 1065, y: 480, on: 3 },
      { x: 940, y: 510, on: 5 }
    ],
    movers: [
      { on: 5, axis: 'x', min: 880, max: 980, period: 4.0 }
    ]
  },
  {
    name: 'Windgate',
    sub: 'A towering pillar defying the howling tempest of the upper pass.',
    shots: 10,
    wind: { min: -100, max: 100 },
    gusts: true,
    blocks: [
      { x: 930, y: 540, w: 80, h: 80, type: 'stone' },
      { x: 940, y: 460, w: 60, h: 80, type: 'stone' },
      { x: 940, y: 380, w: 60, h: 80, type: 'stone' },
      { x: 915, y: 340, w: 110, h: 40, type: 'stone' }
    ],
    banners: [
      { x: 970, y: 380, on: 2 }
    ]
  },
  {
    name: 'The Citadel',
    sub: 'Twin keeps bound by iron timber, an unbroken mountain wall.',
    shots: 12,
    wind: { min: -100, max: 100 },
    gusts: true,
    blocks: [
      { x: 760, y: 540, w: 80, h: 80, type: 'stone' },
      { x: 770, y: 470, w: 60, h: 70, type: 'stone' },
      { x: 1040, y: 540, w: 80, h: 80, type: 'stone' },
      { x: 1050, y: 470, w: 60, h: 70, type: 'stone' },
      { x: 840, y: 560, w: 200, h: 60, type: 'wood' },
      { x: 870, y: 510, w: 60, h: 50, type: 'wood' },
      { x: 950, y: 510, w: 60, h: 50, type: 'wood' }
    ],
    banners: [
      { x: 800, y: 470, on: 1 },
      { x: 1080, y: 470, on: 3 },
      { x: 900, y: 510, on: 5 },
      { x: 980, y: 510, on: 6 }
    ]
  },
  {
    name: "The King's Crown",
    sub: 'The ultimate stronghold where trebuchet and gale meet their master.',
    shots: 12,
    wind: { min: -120, max: 120 },
    gusts: true,
    blocks: [
      { x: 750, y: 540, w: 70, h: 80, type: 'stone' },
      { x: 760, y: 470, w: 50, h: 70, type: 'stone' },
      { x: 1060, y: 540, w: 70, h: 80, type: 'stone' },
      { x: 1070, y: 470, w: 50, h: 70, type: 'stone' },
      { x: 860, y: 540, w: 180, h: 80, type: 'stone' },
      { x: 910, y: 480, w: 80, h: 60, type: 'stone' },
      { x: 880, y: 430, w: 140, h: 50, type: 'stone' },
      { x: 900, y: 500, w: 90, h: 40, type: 'wood' },
      { x: 910, y: 460, w: 70, h: 40, type: 'wood' }
    ],
    banners: [
      { x: 785, y: 470, on: 1 },
      { x: 1095, y: 470, on: 3 },
      { x: 950, y: 480, on: 5 },
      { x: 945, y: 460, on: 8 }
    ],
    movers: [
      { on: 8, axis: 'x', min: 870, max: 1010, period: 3.5 }
    ]
  }
];
