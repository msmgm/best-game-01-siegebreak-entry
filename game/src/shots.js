// The screenshot scenes behind ?shot=start|play|win|end. Each one plays the real rules forward
// from a fresh world for a fixed number of steps, steered by a simple autopilot, so the frame is
// what a short game really looks like and the same seed always gives the same frame.
import { STEP, GRAVITY, TREBUCHET } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_CASTLE, SCREEN_OVER } from './render.js';

export function stageShot(name, world) {
  world.reset();

  function solveShot(state) {
    let targetX = 800;
    let targetY = 300;
    if (state.banners && state.banners.length > 0) {
      const ban = state.banners[0];
      targetX = ban.x;
      targetY = ban.y - 20;
    } else if (state.blocks && state.blocks.length > 0) {
      for (let i = 0; i < state.blocks.length; i++) {
        const b = state.blocks[i];
        if (!b.dead) {
          targetX = b.x + b.w * 0.5;
          targetY = b.y;
          break;
        }
      }
    }

    const wind = state.wind || 0;
    const pwind = wind * 0.35;
    let bestAngle = 0.7;
    let bestPower = 0.6;
    let minError = Infinity;

    for (let angle = 0.30; angle <= 1.40; angle += 0.05) {
      for (let power = 0.30; power <= 1.00; power += 0.05) {
        const speed = 380 + power * 560;
        let vx = Math.cos(angle) * speed;
        let vy = -Math.sin(angle) * speed;
        let x = TREBUCHET.x + Math.cos(angle) * TREBUCHET.armLength;
        let y = TREBUCHET.y - Math.sin(angle) * TREBUCHET.armLength;

        let closestDistSq = Infinity;
        for (let stepCount = 0; stepCount < 120; stepCount++) {
          const dt = 1 / 60;
          vy += GRAVITY * dt;
          vx += pwind * dt;
          x += vx * dt;
          y += vy * dt;

          const dx = x - targetX;
          const dy = y - targetY;
          const dSq = dx * dx + dy * dy;
          if (dSq < closestDistSq) {
            closestDistSq = dSq;
          }
          if (y > FIELD_GROUND_Y || x < 0 || x > 1280) break;
        }

        if (closestDistSq < minError) {
          minError = closestDistSq;
          bestAngle = angle;
          bestPower = power;
        }
      }
    }

    return { angle: bestAngle, power: bestPower };
  }

  const FIELD_GROUND_Y = 620;

  if (name === 'start' || !name) {
    for (let i = 0; i < 300; i++) {
      world.step(STEP);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }

  if (name === 'play') {
    const sol = solveShot(world.state);
    world.state.aim.angle = sol.angle;
    world.state.aim.power = sol.power;
    world.state.aim.dragging = true;
    for (let i = 0; i < 30; i++) {
      world.step(STEP);
    }
    return { screen: SCREEN_PLAY, best: world.state.score };
  }

  if (name === 'win') {
    let totalSteps = 0;
    while (world.state.phase !== 'castleClear' && world.state.phase !== 'lost' && totalSteps < 36000) {
      if (world.state.phase === 'aim') {
        let woodCount = 0;
        let totalCount = 0;
        for (let i = 0; i < world.state.blocks.length; i++) {
          const b = world.state.blocks[i];
          if (!b.dead) {
            totalCount++;
            if (b.type === 'wood') woodCount++;
          }
        }
        if (totalCount > 0 && woodCount / totalCount > 0.5) {
          world.selectAmmo('firepot');
        } else {
          world.selectAmmo('rock');
        }

        const sol = solveShot(world.state);
        world.state.aim.angle = sol.angle;
        world.state.aim.power = sol.power;
        world.fire();
      }
      world.step(STEP);
      totalSteps++;
    }
    return { screen: SCREEN_CASTLE, best: world.state.score };
  }

  if (name === 'end') {
    let totalSteps = 0;
    while (world.state.phase !== 'lost' && world.state.phase !== 'castleClear' && totalSteps < 36000) {
      if (world.state.phase === 'aim') {
        world.selectAmmo('rock');
        world.state.aim.angle = 0.45;
        world.state.aim.power = 0.5;
        world.fire();
      }
      world.step(STEP);
      totalSteps++;
    }
    return { screen: SCREEN_OVER, best: 0 };
  }

  for (let i = 0; i < 300; i++) {
    world.step(STEP);
  }
  return { screen: SCREEN_TITLE, best: 0 };
}

