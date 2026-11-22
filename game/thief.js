// thief.js — the player: a quick, quiet thief in a cyan hood. WASD / arrows
// to move; slides along walls and cover instead of sticking on them.
import { ENTRY, pointBlocked } from './level.js';

export const THIEF_SPEED = 155;

export class Thief {
  constructor() {
    this.x = ENTRY.x;
    this.y = ENTRY.y;
    this.r = 11;
    this.facing = 0;
    this.moving = false;
    this.stepT = 0;
  }

  reset() {
    this.x = ENTRY.x;
    this.y = ENTRY.y;
    this.facing = 0;
    this.moving = false;
  }

  update(dt, input) {
    let dx = 0, dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    this.moving = dx !== 0 || dy !== 0;
    if (!this.moving) return;
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
    this.facing = Math.atan2(dy, dx);
    const step = THIEF_SPEED * dt;
    const nx = this.x + dx * step;
    const ny = this.y + dy * step;
    if (!pointBlocked(nx, this.y, this.r)) this.x = nx;
    if (!pointBlocked(this.x, ny, this.r)) this.y = ny;
    this.stepT += dt;
  }

  draw(ctx) {
    // Shadow + hood: cyan circle, darker hood, pale face, direction tick.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(this.x, this.y + 8, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#19b8c9';
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d9fbff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#0e2f36';
    ctx.beginPath(); ctx.arc(this.x, this.y, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8fbff';
    ctx.beginPath(); ctx.arc(this.x + Math.cos(this.facing) * 3, this.y + Math.sin(this.facing) * 3, 2.5, 0, Math.PI * 2); ctx.fill();
    // Loot bag appears once the thief carries anything.
    ctx.fillStyle = '#e8c15a';
    ctx.beginPath(); ctx.arc(this.x - Math.cos(this.facing) * 12, this.y - Math.sin(this.facing) * 12, 4, 0, Math.PI * 2); ctx.fill();
  }
}
