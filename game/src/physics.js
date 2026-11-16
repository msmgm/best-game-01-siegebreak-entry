// Projectile flight and block collapse, with no drawing and no browser in it. A block is a
// rectangle with a position, a velocity, a spin and a health; it rests when something solid
// holds it up, and it falls, slides and knocks its neighbours when it does not. The world
// asks this module to advance one fixed step at a time and to report what happened.

import { FIELD, GRAVITY } from './config.js';

/**
 * Runtime shapes:
 * - Block: { x, y, w, h, type, hp, vx, vy, resting, burning, burnT, burnAcc, dead, mover }
 *   where type is 'stone' (hp 2) or 'wood' (hp 1), mover is null or { axis, min, max, period, phase }.
 * - Projectile: { active, x, y, vx, vy, ammo, radius } with radius 9.
 */

export function createBlocks(castle) {
  const blocks = [];
  if (!castle || !castle.blocks) return blocks;
  for (let i = 0; i < castle.blocks.length; i++) {
    const b = castle.blocks[i];
    blocks.push({
      x: b.x,
      y: b.y,
      w: b.w,
      h: b.h,
      type: b.type,
      hp: b.type === 'stone' ? 2 : 1,
      vx: 0,
      vy: 0,
      resting: true,
      burning: false,
      burnT: 0,
      burnAcc: 0,
      dead: false,
      mover: b.mover ? {
        axis: b.mover.axis,
        min: b.mover.min,
        max: b.mover.max,
        period: b.mover.period,
        phase: b.mover.phase || 0
      } : null,
      moverTime: 0
    });
  }
  return blocks;
}

export function createProjectile() {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    ammo: null,
    radius: 9
  };
}

export function launchProjectile(p, x, y, vx, vy, ammo) {
  p.active = true;
  p.x = x;
  p.y = y;
  p.vx = vx;
  p.vy = vy;
  p.ammo = ammo;
}

export function damageBlock(block, amount) {
  if (block.dead) return;
  block.hp -= amount;
  if (block.hp <= 0) {
    block.dead = true;
    block.resting = false;
    block.burning = false;
  }
}

function overlapsX(b1, b2) {
  const overlap = Math.min(b1.x + b1.w, b2.x + b2.w) - Math.max(b1.x, b2.x);
  return overlap >= 8;
}

export function stepProjectile(p, dt, wind, blocks) {
  if (!p.active) {
    return { hit: false, done: true };
  }

  // Apply gravity and wind (wind is px/s horizontal acceleration; wind factor 0.35)
  p.vy += GRAVITY * dt;
  p.vx += wind * 0.35 * dt;

  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // Check bounds: groundY or off field sides/top
  if (p.y > FIELD.groundY || p.y < 0 || p.x < 0 || p.x > FIELD.width) {
    p.active = false;
    return { hit: false, done: true };
  }

  // Collision against live, non-dead blocks (circle vs rectangle)
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.dead) continue;

    const cx = Math.max(b.x, Math.min(p.x, b.x + b.w));
    const cy = Math.max(b.y, Math.min(p.y, b.y + b.h));
    const dx = p.x - cx;
    const dy = p.y - cy;
    const distSq = dx * dx + dy * dy;

    if (distSq <= p.radius * p.radius) {
      // Hit!
      p.active = false;
      const hitX = cx;
      const hitY = cy;
      const ammo = p.ammo;

      const bCenterX = b.x + b.w * 0.5;
      const bCenterY = b.y + b.h * 0.5;
      let dirX = bCenterX - p.x;
      let dirY = bCenterY - p.y;
      let len = Math.sqrt(dirX * dirX + dirY * dirY);
      if (len === 0) { dirX = 1; dirY = 0; len = 1; }
      const nx = dirX / len;
      const ny = dirY / len;

      if (ammo === 'rock') {
        // Rock: 2 damage, strong impulse (520 px/s along direction plus 160 up)
        damageBlock(b, 2);
        b.vx += nx * 520;
        b.vy += ny * 520 - 160;
        b.resting = false;
      } else if (ammo === 'firepot') {
        // Firepot: 1 damage, weak impulse, ignites wood (burning=true, burnT=2.5)
        damageBlock(b, 1);
        b.vx += nx * 200;
        b.vy += ny * 200 - 80;
        b.resting = false;
        if (b.type === 'wood' && !b.dead) {
          b.burning = true;
          b.burnT = 2.5;
          b.burnAcc = 0;
        }
      } else if (ammo === 'chain') {
        // Chain-shot: 1 damage to EVERY live block whose centre is within 80px of impact point, medium outward impulse (300 px/s)
        for (let j = 0; j < blocks.length; j++) {
          const other = blocks[j];
          if (other.dead) continue;
          const ocx = other.x + other.w * 0.5;
          const ocy = other.y + other.h * 0.5;
          const odx = ocx - hitX;
          const ody = ocy - hitY;
          const oDistSq = odx * odx + ody * ody;
          if (oDistSq <= 80 * 80) {
            damageBlock(other, 1);
            const oLen = Math.sqrt(oDistSq);
            const onx = oLen === 0 ? 1 : odx / oLen;
            const ony = oLen === 0 ? 0 : ody / oLen;
            other.vx += onx * 300;
            other.vy += ony * 300 - 100;
            other.resting = false;
          }
        }
      } else {
        // Fallback default hit
        damageBlock(b, 1);
        b.vx += nx * 300;
        b.vy += ny * 300 - 100;
        b.resting = false;
      }

      return { hit: true, done: true, block: b, x: hitX, y: hitY, ammo };
    }
  }

  return { hit: false, done: false };
}

export function stepBlocks(blocks, dt, random) {
  // (a) Movers
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.dead) continue;
    if (b.mover) {
      b.moverTime = (b.moverTime || b.mover.phase || 0) + dt;
      const progress = 0.5 * (1 + Math.sin((b.moverTime / b.mover.period) * 2 * Math.PI));
      b[b.mover.axis] = b.mover.min + (b.mover.max - b.mover.min) * progress;
      b.vx = 0;
      b.vy = 0;
      b.resting = true;
    }
  }

  // (b) & (c) Support and Falling
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.dead) continue;
    if (b.mover) continue; // movers ignore gravity/falling

    // Check support
    let supported = false;
    let supportingBlock = null;

    // Check ground support (bottom within 6px of groundY)
    const groundDist = FIELD.groundY - (b.y + b.h);
    if (groundDist >= 0 && groundDist <= 6) {
      supported = true;
    } else {
      // Check support on other live, resting blocks
      for (let j = 0; j < blocks.length; j++) {
        const other = blocks[j];
        if (other === b || other.dead) continue;
        const botDiff = other.y - (b.y + b.h);
        if (botDiff >= 0 && botDiff <= 6 && overlapsX(b, other)) {
          supported = true;
          supportingBlock = other;
          break;
        }
      }
    }

    if (supported) {
      if (Math.abs(b.vx) < 10 && Math.abs(b.vy) < 10) {
        b.vx = 0;
        b.vy = 0;
        b.resting = true;
      }
      b.vx *= 0.8; // friction
    } else {
      // Fall
      b.vy += GRAVITY * dt;
      b.y += b.vy * dt;
      b.x += b.vx * dt;
      b.resting = false;

      // Check landing on ground
      if (b.y + b.h >= FIELD.groundY) {
        const impactVy = b.vy;
        b.y = FIELD.groundY - b.h;
        b.vy = 0;
        b.vx *= 0.5;
        b.resting = true;
      } else {
        // Check landing on other blocks
        for (let j = 0; j < blocks.length; j++) {
          const other = blocks[j];
          if (other === b || other.dead) continue;
          if (b.y + b.h >= other.y && b.y + b.h <= other.y + 14 && b.y < other.y && overlapsX(b, other)) {
            const impactVy = b.vy;
            b.y = other.y - b.h;
            b.vy = 0;
            b.vx *= 0.5;
            b.resting = true;
            if (Math.abs(impactVy) > 420) {
              damageBlock(other, 1);
            }
            break;
          }
        }
      }
    }
  }

  // (d) Burning
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.dead) continue;
    if (b.type === 'wood' && b.burning) {
      b.burnT -= dt;
      b.burnAcc = (b.burnAcc || 0) + dt;
      while (b.burnAcc >= 1.2) {
        b.burnAcc -= 1.2;
        damageBlock(b, 1);
      }
      if (b.dead || b.burnT <= 0) {
        b.burning = false;
      }

      // Burning spreads: once per step with probability 0.02
      if (random() < 0.02) {
        const bcx = b.x + b.w * 0.5;
        const bcy = b.y + b.h * 0.5;
        for (let j = 0; j < blocks.length; j++) {
          const other = blocks[j];
          if (other === b || other.dead || other.type !== 'wood' || other.burning) continue;
          const ocx = other.x + other.w * 0.5;
          const ocy = other.y + other.h * 0.5;
          const ddx = ocx - bcx;
          const ddy = ocy - bcy;
          if (ddx * ddx + ddy * ddy <= 90 * 90) {
            other.burning = true;
            other.burnT = 2.5;
            other.burnAcc = 0;
            break;
          }
        }
      }
    }
  }

  // (e) Tumbled away / out of bounds
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.dead) continue;
    if (b.y + b.h > FIELD.groundY + 60 || b.x + b.w < -200 || b.x > FIELD.width + 200) {
      b.dead = true;
      b.resting = false;
      b.burning = false;
    }
  }
}
