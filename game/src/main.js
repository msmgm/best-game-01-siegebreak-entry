// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s steps
// (several in a slow frame, none in a fast one), and the renderer paints what is there. The game
// moves between six screens: title, play, paused, castle-cleared, campaign-won and game over.
//
// ?seed=N fixes the wind and castle jitter. ?shot=start|play|win|end (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.

import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_HIT, EVENT_BANNER, EVENT_CASTLE, EVENT_OVER, EVENT_CAMPAIGN } from './world.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE, ACTION_RESTART, ACTION_AMMO_1, ACTION_AMMO_2, ACTION_AMMO_3, ACTION_FIRE } from './input.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_CASTLE, SCREEN_WIN, SCREEN_OVER } from './render.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

export function boot() {
  const params = new URLSearchParams(window.location.search);
  const shotName = params.get('shot');
  const seed = parseInt(params.get('seed'), 10) || Math.floor(Math.random() * 1000000);
  const canvas = document.getElementById('game');
  const statusEl = document.getElementById('status');

  if (!canvas) return;

  function announce(text) {
    if (statusEl) statusEl.textContent = text;
  }

  if (shotName) {
    const world = createWorld(createRandom(seed));
    const { screen, best } = stageShot(shotName, world);
    const renderer = createRenderer(canvas);
    requestAnimationFrame(() => {
      renderer.draw(world.state, screen, best);
      requestAnimationFrame(() => {
        renderer.draw(world.state, screen, best);
        window.__shotReady = true;
      });
    });
    return;
  }

  let best = 0;
  try {
    const stored = localStorage.getItem(BEST_KEY);
    if (stored) {
      best = parseInt(stored, 10) || 0;
    }
  } catch (_) {}

  const random = createRandom(seed);
  const world = createWorld(random);
  const renderer = createRenderer(canvas);
  const input = createInput(canvas);
  const audio = createAudio();
  let screen = SCREEN_TITLE;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Game paused');
    }
  });

  let lastTime = performance.now();
  let accumulator = 0;
  const MAX_FRAME = 0.25;

  function tick(now) {
    requestAnimationFrame(tick);
    let dt = (now - lastTime) / 1000;
    lastTime = now;
    if (dt > MAX_FRAME) dt = MAX_FRAME;

    accumulator += dt;
    while (accumulator >= STEP) {
      accumulator -= STEP;

      const actions = input.takeActions();

      if (screen === SCREEN_PLAY) {
        world.state.aim.angle = input.aim.angle;
        world.state.aim.power = input.aim.power;
        world.state.aim.dragging = input.aim.dragging;
      }

      if (actions & ACTION_CONFIRM) {
        audio.unlock();
        if (screen === SCREEN_TITLE) {
          world.reset();
          screen = SCREEN_PLAY;
          audio.click();
          announce('Playing Castle 1');
        } else if (screen === SCREEN_CASTLE) {
          world.nextCastle();
          screen = SCREEN_PLAY;
          audio.click();
          const cNum = (world.state.castleIndex !== undefined ? world.state.castleIndex : 0) + 1;
          announce(`Playing Castle ${cNum}`);
        } else if (screen === SCREEN_WIN || screen === SCREEN_OVER) {
          world.reset();
          screen = SCREEN_PLAY;
          audio.click();
          announce('New game started');
        }
      }

      if (actions & ACTION_PAUSE) {
        if (screen === SCREEN_PLAY) {
          screen = SCREEN_PAUSED;
          audio.click();
          announce('Game paused');
        } else if (screen === SCREEN_PAUSED) {
          screen = SCREEN_PLAY;
          audio.click();
          announce('Game resumed');
        }
      }

      if (actions & ACTION_RESTART) {
        if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
          world.loadCastle(world.state.castleIndex);
          screen = SCREEN_PLAY;
          audio.click();
          announce('Restarted castle');
        } else if (screen === SCREEN_OVER) {
          world.reset();
          screen = SCREEN_PLAY;
          audio.click();
          announce('New game started');
        }
      }

      if (actions & ACTION_AMMO_1) {
        world.selectAmmo('rock');
        audio.click();
        announce('Selected Rock ammo');
      }
      if (actions & ACTION_AMMO_2) {
        world.selectAmmo('firepot');
        audio.click();
        announce('Selected Firepot ammo');
      }
      if (actions & ACTION_AMMO_3) {
        world.selectAmmo('chain');
        audio.click();
        announce('Selected Chain-Shot ammo');
      }

      if (actions & ACTION_FIRE) {
        if (screen === SCREEN_PLAY && world.state.phase === 'aim') {
          audio.unlock();
          const fired = world.fire();
          if (fired) {
            audio.boom();
            announce('Fire!');
          }
        }
      }

      if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
        const events = world.step(STEP);

        if (events & EVENT_HIT) {
          if (world.state.projectile && world.state.projectile.ammo === 'firepot') {
            audio.fire();
          } else if (world.state.projectile && world.state.projectile.ammo === 'chain') {
            audio.boom();
          } else {
            audio.thud();
          }
        }
        if (events & EVENT_BANNER) {
          audio.win();
          announce('Banner down!');
        }
        if (events & EVENT_CASTLE) {
          audio.win();
          best = Math.max(best, world.state.castleIndex + 1);
          try {
            localStorage.setItem(BEST_KEY, String(best));
          } catch (_) {}
          screen = SCREEN_CASTLE;
          announce('Castle cleared!');
        }
        if (events & EVENT_CAMPAIGN) {
          audio.win();
          best = 10;
          try {
            localStorage.setItem(BEST_KEY, String(best));
          } catch (_) {}
          screen = SCREEN_WIN;
          announce('Campaign won!');
        }
        if (events & EVENT_OVER) {
          audio.lose();
          screen = SCREEN_OVER;
          announce('Game over');
        }
      }
    }

    renderer.draw(world.state, screen, best);
  }

  requestAnimationFrame(tick);
}

boot();

