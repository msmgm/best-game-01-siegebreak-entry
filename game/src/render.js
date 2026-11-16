// Drawing only: the world's state and the current screen in, pixels out. The 1280x720 playfield
// is scaled to fit the window and centred, the margin filled with the backdrop colour. Canvas
// shapes and text for the field, the trebuchet, the castle, the particles and the HUD/panels.
// Text that holds a number is rebuilt only when the number changes, so a frame allocates nothing.
// Drawing only: the world's state and the current screen in, pixels out. The 1280x720 playfield
// is scaled to fit the window and centred, the margin filled with the backdrop colour. Canvas
// shapes and text for the field, the trebuchet, the castle, the particles and the HUD/panels.
// Text that holds a number is rebuilt only when the number changes, so a frame allocates nothing.

import { FIELD, TREBUCHET, AMMO, PALETTE, FONT, GRAVITY } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CASTLE = 'castle';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  
  const textCache = new Map();
  function getCachedLabel(prefix, num) {
    const key = prefix + num;
    let cached = textCache.get(key);
    if (!cached) {
      cached = prefix + num;
      textCache.set(key, cached);
    }
    return cached;
  }

  function clamp(v, min, max) {
    return v < min ? min : (v > max ? max : v);
  }

  return {
    draw(state, screen, best) {
      const width = canvas.width = window.innerWidth;
      const height = canvas.height = window.innerHeight;

      ctx.fillStyle = PALETTE.backdrop;
      ctx.fillRect(0, 0, width, height);

      const scale = Math.min(width / FIELD.width, height / FIELD.height);
      const ox = (width - FIELD.width * scale) * 0.5;
      const oy = (height - FIELD.height * scale) * 0.5;

      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(scale, scale);

      ctx.beginPath();
      ctx.rect(0, 0, FIELD.width, FIELD.height);
      ctx.clip();

      // --- SKY ---
      const skyGrad = ctx.createLinearGradient(0, 0, 0, FIELD.groundY);
      skyGrad.addColorStop(0, PALETTE.sky);
      skyGrad.addColorStop(1, PALETTE.skyHorizon);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, FIELD.width, FIELD.groundY);

      // Stars
      const stars = [
        [150, 80], [320, 50], [550, 110], [780, 60], [950, 90], [1150, 45],
        [220, 150], [450, 130], [820, 140], [1050, 120]
      ];
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < stars.length; i++) {
        ctx.fillRect(stars[i][0], stars[i][1], 2, 2);
      }

      // Moon
      ctx.fillStyle = '#fcefc7';
      ctx.beginPath();
      ctx.arc(1080, 120, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.sky;
      ctx.beginPath();
      ctx.arc(1092, 114, 32, 0, Math.PI * 2);
      ctx.fill();

      // Two layers of dark hill silhouettes
      ctx.fillStyle = '#261f38';
      ctx.beginPath();
      ctx.moveTo(0, FIELD.groundY);
      ctx.lineTo(0, 450);
      ctx.quadraticCurveTo(350, 380, 700, 460);
      ctx.quadraticCurveTo(1000, 520, FIELD.width, 440);
      ctx.lineTo(FIELD.width, FIELD.groundY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#1f192b';
      ctx.beginPath();
      ctx.moveTo(0, FIELD.groundY);
      ctx.lineTo(0, 500);
      ctx.quadraticCurveTo(400, 440, 800, 510);
      ctx.quadraticCurveTo(1100, 560, FIELD.width, 480);
      ctx.lineTo(FIELD.width, FIELD.groundY);
      ctx.closePath();
      ctx.fill();

      // --- GROUND ---
      ctx.fillStyle = PALETTE.ground;
      ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
      ctx.fillStyle = PALETTE.groundTop;
      ctx.fillRect(0, FIELD.groundY, FIELD.width, 6);

      ctx.fillStyle = '#4a3d30';
      for (let x = 40; x < FIELD.width; x += 95) {
        ctx.fillRect(x, FIELD.groundY + 6, 12, 4);
        ctx.fillRect(x + 25, FIELD.groundY + 10, 6, 3);
      }

      // --- TREBUCHET ---
      const tx = TREBUCHET.x;
      const ty = TREBUCHET.y;
      const armLen = TREBUCHET.armLength;

      ctx.strokeStyle = PALETTE.trebuchet;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(tx - 35, ty);
      ctx.lineTo(tx, ty - 85);
      ctx.lineTo(tx + 35, ty);
      ctx.stroke();

      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(tx - 22, ty - 45);
      ctx.lineTo(tx + 22, ty - 45);
      ctx.stroke();

      const pivotY = ty - 85;
      const aiming = screen === SCREEN_PLAY && state && state.phase === 'aim';
      const armAngle = aiming ? state.aim.angle : 0.7;

      ctx.save();
      ctx.translate(tx, pivotY);
      ctx.rotate(-armAngle);

      ctx.strokeStyle = PALETTE.trebuchet;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-40, 0);
      ctx.lineTo(armLen, 0);
      ctx.stroke();

      ctx.fillStyle = '#5c3d22';
      ctx.fillRect(-52, -18, 24, 28);
      ctx.fillStyle = '#8d8fa3';
      ctx.beginPath();
      ctx.arc(-40, -4, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4a321a';
      ctx.beginPath();
      ctx.ellipse(armLen, 6, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      if (aiming && state.aim.dragging) {
        const power = state.aim.power;
        const speed = 380 + power * 560;
        const vx = Math.cos(armAngle) * speed;
        const vy = -Math.sin(armAngle) * speed;
        const wind = state ? (state.wind || 0) : 0;
        const pwind = wind * 0.35;

        const cupX = tx + Math.cos(armAngle) * armLen;
        const cupY = ty - Math.sin(armAngle) * armLen;

        let simX = cupX;
        let simY = cupY;
        let simVx = vx;
        let simVy = vy;

        ctx.lineWidth = 3;
        for (let d = 0; d < 14; d++) {
          const dt = 0.04;
          simVy += GRAVITY * dt;
          simVx += pwind * dt;
          simX += simVx * dt;
          simY += simVy * dt;

          const alpha = 1 - d / 15;
          ctx.fillStyle = `rgba(255, 233, 168, ${alpha})`;
          ctx.beginPath();
          ctx.arc(simX, simY, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.strokeStyle = PALETTE.aim;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cupX, cupY);
        ctx.lineTo(cupX - Math.cos(armAngle) * 30, cupY + Math.sin(armAngle) * 30);
        ctx.stroke();
      }

      // --- BLOCKS ---
      if (state && state.blocks) {
        for (let i = 0; i < state.blocks.length; i++) {
          const b = state.blocks[i];
          if (b.dead) continue;

          ctx.save();
          const cx = b.x + b.w * 0.5;
          const cy = b.y + b.h * 0.5;
          ctx.translate(cx, cy);

          const tiltAngle = clamp((b.vx || 0) * 0.0006, -0.2, 0.2);
          if (!b.resting && !b.mover) {
            ctx.rotate(tiltAngle);
          }

          if (b.type === 'stone') {
            ctx.fillStyle = PALETTE.stone;
            ctx.fillRect(-b.w * 0.5, -b.h * 0.5, b.w, b.h);
            ctx.strokeStyle = PALETTE.stoneDark;
            ctx.lineWidth = 2;
            ctx.strokeRect(-b.w * 0.5, -b.h * 0.5, b.w, b.h);

            ctx.fillStyle = '#a6a8bd';
            ctx.fillRect(-b.w * 0.5, -b.h * 0.5, b.w, 4);

            if (b.hp === 1) {
              ctx.strokeStyle = '#3a3c4a';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(-b.w * 0.2, -b.h * 0.3);
              ctx.lineTo(0, 0);
              ctx.lineTo(b.w * 0.2, b.h * 0.3);
              ctx.stroke();
            }
          } else {
            ctx.fillStyle = PALETTE.wood;
            ctx.fillRect(-b.w * 0.5, -b.h * 0.5, b.w, b.h);
            ctx.strokeStyle = PALETTE.woodDark;
            ctx.lineWidth = 2;
            ctx.strokeRect(-b.w * 0.5, -b.h * 0.5, b.w, b.h);

            ctx.strokeStyle = PALETTE.woodDark;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-b.w * 0.4, -b.h * 0.2);
            ctx.lineTo(b.w * 0.4, -b.h * 0.2);
            ctx.moveTo(-b.w * 0.4, b.h * 0.2);
            ctx.lineTo(b.w * 0.4, b.h * 0.2);
            ctx.stroke();
          }

          if (b.burning) {
            ctx.strokeStyle = PALETTE.fire;
            ctx.lineWidth = 3 + Math.sin((state.elapsed || 0) * 20) * 1.5;
            ctx.strokeRect(-b.w * 0.5 - 1, -b.h * 0.5 - 1, b.w + 2, b.h + 2);
          }

          ctx.restore();
        }
      }

      // --- BANNERS ---
      if (state && state.banners) {
        for (let i = 0; i < state.banners.length; i++) {
          const ban = state.banners[i];
          if (ban.down) {
            ctx.save();
            ctx.translate(ban.x, FIELD.groundY - 6);
            ctx.rotate(Math.PI * 0.5);
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = PALETTE.banner;
            ctx.fillRect(0, -6, 32, 16);
            ctx.strokeStyle = PALETTE.bannerGold;
            ctx.lineWidth = 2;
            ctx.strokeRect(0, -6, 32, 16);
            ctx.restore();
          } else {
            ctx.strokeStyle = '#5c4033';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(ban.x, ban.y);
            ctx.lineTo(ban.x, ban.y - 46);
            ctx.stroke();

            const elapsed = state.elapsed || 0;
            const wave = Math.sin(elapsed * 8 + ban.x * 0.1) * 6;
            ctx.fillStyle = PALETTE.banner;
            ctx.beginPath();
            ctx.moveTo(ban.x, ban.y - 46);
            ctx.lineTo(ban.x + 36, ban.y - 36 + wave);
            ctx.lineTo(ban.x, ban.y - 26);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = PALETTE.bannerGold;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(ban.x, ban.y - 46);
            ctx.lineTo(ban.x + 36, ban.y - 36 + wave);
            ctx.lineTo(ban.x, ban.y - 26);
            ctx.closePath();
            ctx.stroke();
          }
        }
      }

      // --- PROJECTILE ---
      if (state && state.projectile && state.projectile.active) {
        const p = state.projectile;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = p.radius * 1.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
        ctx.stroke();

        if (p.ammo === 'rock') {
          ctx.fillStyle = '#4a4d5e';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#a6a8bd';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.ammo === 'firepot') {
          ctx.fillStyle = '#b35422';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#e07a3f';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = PALETTE.fire;
          ctx.beginPath();
          ctx.arc(p.x, p.y - p.radius - 4, 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.ammo === 'chain') {
          ctx.fillStyle = '#333';
          ctx.beginPath();
          ctx.arc(p.x - 6, p.y, 6, 0, Math.PI * 2);
          ctx.arc(p.x + 6, p.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#777';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(p.x - 6, p.y);
          ctx.lineTo(p.x + 6, p.y);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#555';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- PARTICLES ---
      if (state && state.particles) {
        for (let i = 0; i < state.particles.length; i++) {
          const pt = state.particles[i];
          const alpha = Math.max(0, 1 - pt.life / pt.maxLife);
          ctx.save();
          if (pt.kind === 'dust') {
            ctx.fillStyle = `rgba(180, 180, 190, ${alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size * (1 + (pt.life / pt.maxLife)), 0, Math.PI * 2);
            ctx.fill();
          } else if (pt.kind === 'debris') {
            ctx.fillStyle = pt.color || PALETTE.stone;
            ctx.globalAlpha = alpha;
            ctx.translate(pt.x, pt.y);
            ctx.rotate(pt.life * 5);
            ctx.fillRect(-pt.size * 0.5, -pt.size * 0.5, pt.size, pt.size);
          } else if (pt.kind === 'ember') {
            ctx.fillStyle = PALETTE.ember;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
          } else if (pt.kind === 'confetti') {
            ctx.fillStyle = pt.color || PALETTE.bannerGold;
            ctx.globalAlpha = alpha;
            ctx.translate(pt.x, pt.y);
            ctx.rotate(pt.life * 3);
            ctx.fillRect(-4, -2, 8, 4);
          }
          ctx.restore();
        }
      }

      // --- HUD ---
      if (screen === SCREEN_PLAY && state && state.castle) {
        ctx.fillStyle = PALETTE.hudPanel;
        ctx.fillRect(0, 0, FIELD.width, 60);
        ctx.strokeStyle = '#362d4d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 60);
        ctx.lineTo(FIELD.width, 60);
        ctx.stroke();

        ctx.fillStyle = PALETTE.text;
        ctx.font = `bold 22px ${FONT}`;
        ctx.textAlign = 'left';
        const castleNum = (state.castleIndex !== undefined ? state.castleIndex : 0) + 1;
        ctx.fillText(`Castle ${castleNum}/10: ${state.castle.name}`, 24, 28);

        ctx.fillStyle = PALETTE.muted;
        ctx.font = `16px ${FONT}`;
        ctx.fillText(state.castle.sub || '', 24, 50);

        const totalShots = state.castle.shots || 8;
        const shotsLeft = state.shotsLeft || 0;
        let iconStartX = FIELD.width * 0.45;
        for (let s = 0; s < totalShots; s++) {
          ctx.fillStyle = s < shotsLeft ? PALETTE.text : '#554a6b';
          ctx.fillRect(iconStartX + s * 16, 20, 10, 14);
        }

        const windVal = Math.round(state.wind || 0);
        ctx.fillStyle = PALETTE.text;
        ctx.font = `20px ${FONT}`;
        ctx.textAlign = 'center';
        const windArrow = windVal < 0 ? '←' : (windVal > 0 ? '→' : '—');
        ctx.fillText(`Wind ${windArrow} ${Math.abs(windVal)} px/s`, FIELD.width * 0.5, 50);

        ctx.textAlign = 'right';
        ctx.fillStyle = PALETTE.text;
        ctx.font = `bold 22px ${FONT}`;
        const currentScore = (state.totalScore || 0) + (state.score || 0);
        ctx.fillText(`Score ${currentScore}`, FIELD.width - 24, 28);

        ctx.fillStyle = PALETTE.muted;
        ctx.font = `18px ${FONT}`;
        ctx.fillText(`Best ${best || 0}`, FIELD.width - 24, 50);

        ctx.fillStyle = PALETTE.hudPanel;
        ctx.fillRect(0, FIELD.height - 40, FIELD.width, 40);
        ctx.strokeStyle = '#362d4d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, FIELD.height - 40);
        ctx.lineTo(FIELD.width, FIELD.height - 40);
        ctx.stroke();

        ctx.fillStyle = PALETTE.text;
        ctx.font = `18px ${FONT}`;
        ctx.textAlign = 'left';
        ctx.fillText('Drag to aim — release to fire', 24, FIELD.height - 14);

        const ammoTypes = [
          { id: 'rock', label: '1 Rock' },
          { id: 'firepot', label: '2 Firepot' },
          { id: 'chain', label: '3 Chain' }
        ];
        let ammoX = 350;
        for (let a = 0; a < ammoTypes.length; a++) {
          const at = ammoTypes[a];
          const selected = state.ammo === at.id;
          if (selected) {
            ctx.fillStyle = PALETTE.bannerGold;
            ctx.fillRect(ammoX - 8, FIELD.height - 32, 90, 24);
            ctx.fillStyle = '#14101d';
          } else {
            ctx.fillStyle = PALETTE.muted;
          }
          ctx.font = selected ? `bold 18px ${FONT}` : `18px ${FONT}`;
          ctx.fillText(at.label, ammoX, FIELD.height - 14);
          ammoX += 110;
        }

        ctx.fillStyle = PALETTE.muted;
        ctx.textAlign = 'right';
        ctx.fillText('R restart   P pause', FIELD.width - 24, FIELD.height - 14);
      }

      // --- PANELS ---
      if (screen !== SCREEN_PLAY) {
        ctx.fillStyle = 'rgba(20, 16, 29, 0.85)';
        ctx.fillRect(0, 0, FIELD.width, FIELD.height);

        const pw = 700, ph = 460;
        const px = (FIELD.width - pw) * 0.5;
        const py = (FIELD.height - ph) * 0.5;

        ctx.fillStyle = PALETTE.hudPanel;
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = PALETTE.bannerGold;
        ctx.lineWidth = 3;
        ctx.strokeRect(px, py, pw, ph);

        ctx.textAlign = 'center';

        if (screen === SCREEN_TITLE) {
          ctx.fillStyle = PALETTE.bannerGold;
          ctx.font = `bold 64px ${FONT}`;
          ctx.fillText('SIEGEBREAK', px + pw * 0.5, py + 80);

          ctx.fillStyle = PALETTE.text;
          ctx.font = `24px ${FONT}`;
          ctx.fillText("Knock down the king's towers.", px + pw * 0.5, py + 145);
          ctx.font = `20px ${FONT}`;
          ctx.fillStyle = PALETTE.muted;
          ctx.fillText('Drag from the trebuchet to aim. Release to fire.', px + pw * 0.5, py + 190);
          ctx.fillText('1/2/3 chooses the shot. R restarts, P pauses.', px + pw * 0.5, py + 230);
          ctx.fillText(`Best castle: ${best || 0}`, px + pw * 0.5, py + 280);

          ctx.fillStyle = PALETTE.bannerGold;
          ctx.font = `bold 24px ${FONT}`;
          ctx.fillText('Press Space or click to start', px + pw * 0.5, py + 370);

        } else if (screen === SCREEN_PAUSED) {
          ctx.fillStyle = PALETTE.bannerGold;
          ctx.font = `bold 54px ${FONT}`;
          ctx.fillText('Paused', px + pw * 0.5, py + 160);

          ctx.fillStyle = PALETTE.text;
          ctx.font = `24px ${FONT}`;
          ctx.fillText('Press P to resume', px + pw * 0.5, py + 260);

        } else if (screen === SCREEN_CASTLE) {
          const cName = state && state.castle ? state.castle.name : 'Castle';
          const cScore = state ? (state.score || 0) : 0;
          const bonus = (state ? (state.shotsLeft || 0) : 0) * 100;

          ctx.fillStyle = PALETTE.bannerGold;
          ctx.font = `bold 46px ${FONT}`;
          ctx.fillText(`${cName} has fallen!`, px + pw * 0.5, py + 100);

          ctx.fillStyle = PALETTE.text;
          ctx.font = `24px ${FONT}`;
          ctx.fillText(`Score ${cScore}  (+${bonus} unused-shot bonus)`, px + pw * 0.5, py + 190);

          ctx.fillStyle = PALETTE.muted;
          ctx.font = `20px ${FONT}`;
          ctx.fillText('The banner lies in the dust. The road is open.', px + pw * 0.5, py + 250);

          ctx.fillStyle = PALETTE.bannerGold;
          ctx.font = `bold 24px ${FONT}`;
          ctx.fillText('Press Space for the next castle', px + pw * 0.5, py + 360);

        } else if (screen === SCREEN_WIN) {
          const totalScore = state ? (state.totalScore || 0) : 0;

          ctx.fillStyle = PALETTE.bannerGold;
          ctx.font = `bold 52px ${FONT}`;
          ctx.fillText('THE KINGDOM IS YOURS', px + pw * 0.5, py + 110);

          ctx.fillStyle = PALETTE.text;
          ctx.font = `24px ${FONT}`;
          ctx.fillText('All 10 castles have fallen.', px + pw * 0.5, py + 190);
          ctx.fillText(`Final Score ${totalScore}`, px + pw * 0.5, py + 235);

          ctx.fillStyle = PALETTE.bannerGold;
          ctx.font = `bold 24px ${FONT}`;
          ctx.fillText('Press Space to play again', px + pw * 0.5, py + 360);

        } else if (screen === SCREEN_OVER) {
          const cNum = state && state.castleIndex !== undefined ? state.castleIndex + 1 : 1;
          const cName = state && state.castle ? state.castle.name : 'Castle';
          const totalScore = state ? (state.totalScore || 0) : 0;

          ctx.fillStyle = PALETTE.bannerGold;
          ctx.font = `bold 48px ${FONT}`;
          ctx.fillText('Out of shots', px + pw * 0.5, py + 110);

          ctx.fillStyle = PALETTE.text;
          ctx.font = `24px ${FONT}`;
          ctx.fillText(`Castle ${cNum}: ${cName} still stands.`, px + pw * 0.5, py + 190);
          ctx.fillText(`Score ${totalScore}`, px + pw * 0.5, py + 235);

          ctx.fillStyle = PALETTE.bannerGold;
          ctx.font = `bold 24px ${FONT}`;
          ctx.fillText('Press Space to try again', px + pw * 0.5, py + 360);
        }
      }

      ctx.restore();
    }
  };
}

