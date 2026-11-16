// The game's rules and state, with no drawing and no browser in it: the castle, the shots,
// the ammo, the score, the win and lose conditions. step() advances one fixed step and
// returns what happened as bit flags, so the caller can react without the world knowing
// about screens or sound. Nothing here allocates after createWorld returns.
import { CASTLES } from './castles.js';
import { TREBUCHET } from './config.js';
import { createBlocks, createProjectile, launchProjectile, stepProjectile, stepBlocks } from './physics.js';

export const EVENT_SHOT = 1;
export const EVENT_HIT = 2;
export const EVENT_BANNER = 4;
export const EVENT_CASTLE = 8;
export const EVENT_OVER = 16;
export const EVENT_CAMPAIGN = 32;

export function createWorld(random) {
  const state = {
    castleIndex: 0,
    castle: null,
    blocks: [],
    banners: [],
    projectile: createProjectile(),
    shotsLeft: 0,
    ammo: 'rock',
    score: 0,
    totalScore: 0,
    wind: 0,
    baseWind: 0,
    elapsed: 0,
    phase: 'aim',
    aim: { angle: 0.7, power: 0.6, dragging: false },
    particles: [],
    settleTimer: 0
  };

  function spawnParticle(particles, x, y, vx, vy, maxLife, size, color, kind) {
    particles.push({
      x, y, vx, vy,
      life: maxLife,
      maxLife,
      size,
      color,
      kind
    });
  }

  function loadCastle(index) {
    state.castleIndex = index;
    state.castle = CASTLES[index];
    state.blocks = createBlocks(state.castle);
    for (let i = 0; i < state.blocks.length; i++) {
      const b = state.blocks[i];
      b.startX = b.x;
      b.startY = b.y;
      b.scored = false;
    }
    state.banners = [];
    if (state.castle.banners) {
      for (let i = 0; i < state.castle.banners.length; i++) {
        const ban = state.castle.banners[i];
        state.banners.push({
          x: ban.x,
          y: ban.y,
          on: ban.on,
          down: false,
          startX: ban.x,
          startY: ban.y
        });
      }
    }
    state.projectile = createProjectile();
    state.shotsLeft = state.castle.shots;
    state.ammo = 'rock';
    state.score = 0;
    state.baseWind = random() * (state.castle.wind.max - state.castle.wind.min) + state.castle.wind.min;
    state.wind = state.baseWind;
    state.elapsed = 0;
    state.phase = 'aim';
    state.aim = { angle: 0.7, power: 0.6, dragging: false };
    state.particles = [];
    state.settleTimer = 0;
  }

  function reset() {
    state.totalScore = 0;
    state.castleIndex = 0;
    loadCastle(0);
  }

  function selectAmmo(id) {
    if (id === 'rock' || id === 'firepot' || id === 'chain') {
      state.ammo = id;
    }
  }

  function fire() {
    if (state.phase === 'aim' && state.shotsLeft > 0) {
      const angle = state.aim.angle;
      const power = state.aim.power;
      const lx = TREBUCHET.x + Math.cos(angle) * TREBUCHET.armLength;
      const ly = TREBUCHET.y - Math.sin(angle) * TREBUCHET.armLength;
      const speed = 380 + power * 560;
      const vx = Math.cos(angle) * speed;
      const vy = -Math.sin(angle) * speed;
      launchProjectile(state.projectile, lx, ly, vx, vy, state.ammo);
      state.shotsLeft -= 1;
      state.phase = 'flying';
      return EVENT_SHOT;
    }
    return 0;
  }

  function checkBlocksAndBanners(eventsRef) {
    for (let i = 0; i < state.blocks.length; i++) {
      const b = state.blocks[i];
      if (b.dead && !b.scored) {
        b.scored = true;
        state.score += 25;
      }
    }

    for (let i = 0; i < state.banners.length; i++) {
      const ban = state.banners[i];
      const b = state.blocks[ban.on];
      if (b && b.mover) {
        ban.x = b.x + b.w * 0.5;
        ban.y = b.y;
      }
    }

    for (let i = 0; i < state.banners.length; i++) {
      const ban = state.banners[i];
      if (ban.down) continue;
      const b = state.blocks[ban.on];
      if (!b) continue;

      const isDown = b.dead ||
        Math.abs(b.y - b.startY) > 34 ||
        (!b.mover && Math.abs(b.x - b.startX) > 70);

      if (isDown) {
        ban.down = true;
        state.score += 200;
        eventsRef.val |= EVENT_BANNER;
        for (let c = 0; c < 12; c++) {
          spawnParticle(
            state.particles,
            ban.x, ban.y - 20,
            (random() - 0.5) * 180,
            -random() * 220 - 50,
            1.2 + random() * 0.8,
            4 + random() * 4,
            '#f2c94c',
            'confetti'
          );
        }
      }
    }
  }

  function step(dt) {
    state.elapsed += dt;

    if (state.castle.gusts) {
      state.wind = state.baseWind + Math.sin(state.elapsed * 0.6) * 28;
    } else {
      state.wind = state.baseWind;
    }

    const eventsRef = { val: 0 };

    if (state.phase === 'aim') {
      stepBlocks(state.blocks, dt, random);
      checkBlocksAndBanners(eventsRef);

      for (let i = 0; i < state.blocks.length; i++) {
        const b = state.blocks[i];
        if (!b.dead && b.burning && random() < 0.3) {
          spawnParticle(
            state.particles,
            b.x + random() * b.w,
            b.y + random() * b.h,
            (random() - 0.5) * 40,
            -random() * 60 - 20,
            0.5 + random() * 0.4,
            2 + random() * 2,
            random() < 0.5 ? '#ff7a2f' : '#ffc46b',
            'ember'
          );
        }
      }
    } else if (state.phase === 'flying') {
      const res = stepProjectile(state.projectile, dt, state.wind, state.blocks);
      if (res.hit) {
        eventsRef.val |= EVENT_HIT;
        for (let d = 0; d < 8; d++) {
          spawnParticle(
            state.particles,
            res.x, res.y,
            (random() - 0.5) * 200,
            (random() - 0.5) * 200 - 40,
            0.4 + random() * 0.4,
            3 + random() * 5,
            '#8d8fa3',
            'dust'
          );
        }
        for (let db = 0; db < 5; db++) {
          spawnParticle(
            state.particles,
            res.x, res.y,
            (random() - 0.5) * 280,
            -random() * 220 - 30,
            0.8 + random() * 0.7,
            4 + random() * 4,
            res.block && res.block.type === 'wood' ? '#9a6b3f' : '#6b6d80',
            'debris'
          );
        }
      }
      stepBlocks(state.blocks, dt, random);
      checkBlocksAndBanners(eventsRef);

      if (res.done) {
        state.phase = 'settling';
        state.settleTimer = 1.4;
      }
    } else if (state.phase === 'settling') {
      stepBlocks(state.blocks, dt, random);
      checkBlocksAndBanners(eventsRef);
      state.settleTimer -= dt;

      let allResting = true;
      let anyBurning = false;
      for (let i = 0; i < state.blocks.length; i++) {
        const b = state.blocks[i];
        if (!b.dead) {
          if (!b.resting) allResting = false;
          if (b.burning) anyBurning = true;
        }
      }

      if ((allResting && !anyBurning) || state.settleTimer <= 0) {
        const allBannersDown = state.banners.every(b => b.down);
        if (allBannersDown) {
          state.score += state.shotsLeft * 100;
          state.totalScore += state.score;
          if (state.castleIndex === CASTLES.length - 1) {
            state.phase = 'campaignWin';
            eventsRef.val |= EVENT_CAMPAIGN;
          } else {
            state.phase = 'castleClear';
            eventsRef.val |= EVENT_CASTLE;
          }
        } else if (state.shotsLeft === 0) {
          state.phase = 'lost';
          eventsRef.val |= EVENT_OVER;
        } else {
          state.baseWind = random() * (state.castle.wind.max - state.castle.wind.min) + state.castle.wind.min;
          state.wind = state.baseWind;
          state.phase = 'aim';
        }
      }
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const pt = state.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.kind === 'debris' || pt.kind === 'dust') {
        pt.vy += 500 * dt;
      }
      pt.life -= dt;
      if (pt.life <= 0) {
        state.particles[i] = state.particles[state.particles.length - 1];
        state.particles.pop();
      }
    }

    return eventsRef.val;
  }

  function nextCastleInternal() {
    if (state.phase === 'castleClear') {
      loadCastle(state.castleIndex + 1);
    }
  }

  loadCastle(0);

  return {
    state,
    reset,
    loadCastle,
    fire,
    step,
    selectAmmo,
    nextCastle: nextCastleInternal
  };
}

export function nextCastle(world) {
  if (world && world.state && world.state.phase === 'castleClear') {
    world.loadCastle(world.state.castleIndex + 1);
  }
}
