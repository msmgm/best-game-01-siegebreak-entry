// Mouse and keyboard input. The aim is a drag from the trebuchet: press, drag to set the angle
// and power, release to fire. One-shot presses (confirm, pause, restart, ammo choice) are queued
// as bit flags and taken once by the loop, so a press between two frames is never lost and never
// counted twice.

import { FIELD, TREBUCHET } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_AMMO_1 = 8;
export const ACTION_AMMO_2 = 16;
export const ACTION_AMMO_3 = 32;
export const ACTION_FIRE = 64;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function createInput(target) {
  const aim = { angle: 0.7, power: 0.6, dragging: false };
  let actionFlags = 0;

  let startClientX = 0;
  let startClientY = 0;
  let totalMovement = 0;

  const pivotX = TREBUCHET.x;
  const pivotY = TREBUCHET.y - 85;

  function toPlayfield(clientX, clientY) {
    const rect = target.getBoundingClientRect();
    const width = target.clientWidth || rect.width || FIELD.width;
    const height = target.clientHeight || rect.height || FIELD.height;
    const scale = Math.min(width / FIELD.width, height / FIELD.height);
    const ox = (width - FIELD.width * scale) * 0.5;
    const oy = (height - FIELD.height * scale) * 0.5;

    const x = (clientX - rect.left - ox) / scale;
    const y = (clientY - rect.top - oy) / scale;
    return { x, y };
  }

  function handlePointerDown(e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    aim.dragging = true;
    startClientX = e.clientX;
    startClientY = e.clientY;
    totalMovement = 0;

    const pt = toPlayfield(e.clientX, e.clientY);
    const dx = pt.x - pivotX;
    const dy = pt.y - pivotY;
    aim.angle = clamp(Math.atan2(pivotY - pt.y, pt.x - pivotX), 0.08, 1.45);
    const distance = Math.hypot(dx, dy);
    aim.power = clamp(distance / 420, 0.15, 1);

    try {
      target.setPointerCapture(e.pointerId);
    } catch (_) {}
  }

  function handlePointerMove(e) {
    if (!aim.dragging) return;
    totalMovement = Math.hypot(e.clientX - startClientX, e.clientY - startClientY);

    const pt = toPlayfield(e.clientX, e.clientY);
    const dx = pt.x - pivotX;
    const dy = pt.y - pivotY;
    aim.angle = clamp(Math.atan2(pivotY - pt.y, pt.x - pivotX), 0.08, 1.45);
    const distance = Math.hypot(dx, dy);
    aim.power = clamp(distance / 420, 0.15, 1);
  }

  function handlePointerUp(e) {
    if (!aim.dragging) return;
    aim.dragging = false;

    if (totalMovement < 6) {
      actionFlags |= ACTION_CONFIRM;
    } else {
      actionFlags |= ACTION_FIRE;
    }

    try {
      target.releasePointerCapture(e.pointerId);
    } catch (_) {}
  }

  function handlePointerCancel() {
    if (aim.dragging) {
      aim.dragging = false;
    }
  }

  function handleWindowBlur() {
    if (aim.dragging) {
      aim.dragging = false;
    }
  }

  function handleKeyDown(e) {
    if (e.repeat) return;

    const code = e.code;
    const key = e.key;

    if (code === 'Space' || code === 'Enter' || key === ' ' || key === 'Enter') {
      actionFlags |= ACTION_CONFIRM;
      e.preventDefault();
    } else if (code === 'KeyP' || code === 'Escape' || key === 'p' || key === 'P' || key === 'Escape') {
      actionFlags |= ACTION_PAUSE;
      e.preventDefault();
    } else if (code === 'KeyR' || key === 'r' || key === 'R') {
      actionFlags |= ACTION_RESTART;
      e.preventDefault();
    } else if (code === 'Digit1' || key === '1') {
      actionFlags |= ACTION_AMMO_1;
      e.preventDefault();
    } else if (code === 'Digit2' || key === '2') {
      actionFlags |= ACTION_AMMO_2;
      e.preventDefault();
    } else if (code === 'Digit3' || key === '3') {
      actionFlags |= ACTION_AMMO_3;
      e.preventDefault();
    } else if (code === 'ArrowLeft' || key === 'ArrowLeft' || code === 'KeyA' || key === 'a' || key === 'A') {
      aim.angle = clamp(aim.angle - 0.03, 0.08, 1.45);
      e.preventDefault();
    } else if (code === 'ArrowRight' || key === 'ArrowRight' || code === 'KeyD' || key === 'd' || key === 'D') {
      aim.angle = clamp(aim.angle + 0.03, 0.08, 1.45);
      e.preventDefault();
    } else if (code === 'ArrowUp' || key === 'ArrowUp') {
      aim.power = clamp(aim.power + 0.05, 0.15, 1);
      e.preventDefault();
    } else if (code === 'ArrowDown' || key === 'ArrowDown') {
      aim.power = clamp(aim.power - 0.05, 0.15, 1);
      e.preventDefault();
    }
  }

  if (target) {
    target.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    target.addEventListener('pointercancel', handlePointerCancel);
    target.addEventListener('pointerleave', handlePointerCancel);
    window.addEventListener('blur', handleWindowBlur);
  }
  window.addEventListener('keydown', handleKeyDown);

  return {
    aim,
    takeActions() {
      const flags = actionFlags;
      actionFlags = 0;
      return flags;
    }
  };
}


