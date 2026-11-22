// guards.js — patrolling guards with visible vision cones. A guard that spots
// the thief raises the alarm; one that loses sight investigates the last
// place it saw the thief, marked with a "?" while it searches.
import { pointBlocked, segmentBlocked } from './level.js';

export const CONE_RANGE = 155;
export const CONE_HALF_ANGLE = 0.5; // ~29 degrees each side
const PATROL_SPEED = 56;
const INVESTIGATE_SPEED = 88;

export class Guard {
  constructor(waypoints, color = '#e5484d') {
    this.waypoints = waypoints;
    this.x = waypoints[0].x;
    this.y = waypoints[0].y;
    this.wp = 1;
    this.facing = 0;
    this.pause = 0;          // seconds left pausing at a waypoint, sweeping
    this.sweepT = Math.random() * 6;
    this.mode = 'patrol';    // patrol | investigate | look | return
    this.lastSeen = null;    // {x, y} of the last spotted thief position
    this.lookT = 0;
    this.seeing = false;
    this.color = color;
  }

  // True when the thief is inside this guard's cone with a clear line of sight.
  canSee(tx, ty) {
    const dx = tx - this.x, dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d > CONE_RANGE) return false;
    let ang = Math.atan2(dy, dx) - this.facing;
    while (ang > Math.PI) ang -= Math.PI * 2;
    while (ang < -Math.PI) ang += Math.PI * 2;
    if (Math.abs(ang) > CONE_HALF_ANGLE) return false;
    return !segmentBlocked(this.x, this.y, tx, ty);
  }

  update(dt, game) {
    const speedBoost = game.getaway ? 1.6 : 1;
    this.seeing = this.canSee(game.thief.x, game.thief.y);
    if (this.seeing) {
      this.lastSeen = { x: game.thief.x, y: game.thief.y };
      this.facing = Math.atan2(game.thief.y - this.y, game.thief.x - this.x);
      if (this.mode === 'patrol') this.mode = 'investigate';
    }

    if (this.mode === 'patrol') {
      const target = this.waypoints[this.wp];
      if (this.pause > 0) {
        // Sweep the cone back and forth while waiting at the waypoint.
        this.pause -= dt;
        this.sweepT += dt;
        this.facing = this.baseFacing() + Math.sin(this.sweepT * 1.6) * 0.7;
      } else {
        const dx = target.x - this.x, dy = target.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d < 4) {
          this.wp = (this.wp + 1) % this.waypoints.length;
          this.pause = 1.4;
        } else {
          this.facing = Math.atan2(dy, dx);
          const step = PATROL_SPEED * speedBoost * dt;
          this.x += (dx / d) * step;
          this.y += (dy / d) * step;
        }
      }
    } else if (this.mode === 'investigate') {
      if (!this.lastSeen) { this.mode = 'return'; return; }
      const dx = this.lastSeen.x - this.x, dy = this.lastSeen.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 10) {
        this.mode = 'look';
        this.lookT = 2.0;
      } else {
        this.facing = Math.atan2(dy, dx);
        const step = INVESTIGATE_SPEED * speedBoost * dt;
        const nx = this.x + (dx / d) * step;
        const ny = this.y + (dy / d) * step;
        if (!pointBlocked(nx, this.y, 12)) this.x = nx;
        if (!pointBlocked(this.x, ny, 12)) this.y = ny;
      }
    } else if (this.mode === 'look') {
      // Stand at the last seen spot, scanning around, "?" overhead.
      this.lookT -= dt;
      this.sweepT += dt;
      this.facing += Math.sin(this.sweepT * 2.2) * 0.06;
      if (this.lookT <= 0) this.mode = 'return';
    } else { // return: walk back to the nearest waypoint, resume patrol
      let best = 0, bestD = Infinity;
      this.waypoints.forEach((w, i) => {
        const d = Math.hypot(w.x - this.x, w.y - this.y);
        if (d < bestD) { bestD = d; best = i; }
      });
      const target = this.waypoints[best];
      const dx = target.x - this.x, dy = target.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 6) { this.wp = (best + 1) % this.waypoints.length; this.mode = 'patrol'; }
      else {
        this.facing = Math.atan2(dy, dx);
        const step = INVESTIGATE_SPEED * speedBoost * dt;
        this.x += (dx / d) * step;
        this.y += (dy / d) * step;
      }
    }
  }

  baseFacing() {
    const target = this.waypoints[this.wp];
    return Math.atan2(target.y - this.y, target.x - this.x);
  }

  drawCone(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.arc(this.x, this.y, CONE_RANGE, this.facing - CONE_HALF_ANGLE, this.facing + CONE_HALF_ANGLE);
    ctx.closePath();
    const g = ctx.createRadialGradient(this.x, this.y, 8, this.x, this.y, CONE_RANGE);
    const hot = this.seeing ? 'rgba(255,40,40,0.42)' : 'rgba(255,70,60,0.26)';
    const edge = this.seeing ? 'rgba(255,40,40,0.10)' : 'rgba(255,70,60,0.06)';
    g.addColorStop(0, hot);
    g.addColorStop(1, edge);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = this.seeing ? 'rgba(255,80,80,0.8)' : 'rgba(255,90,80,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  draw(ctx) {
    this.drawCone(ctx);
    // Body: dark-red uniformed guard with a visor.
    ctx.fillStyle = '#7a1f24';
    ctx.beginPath(); ctx.arc(this.x, this.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffb3b3'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(this.x, this.y, 13, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffd9d9';
    ctx.beginPath(); ctx.arc(this.x, this.y, 5, 0, Math.PI * 2); ctx.fill();
    // Facing tick.
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + Math.cos(this.facing) * 17, this.y + Math.sin(this.facing) * 17);
    ctx.stroke();
    if (this.mode === 'investigate' || this.mode === 'look') {
      // "?" overhead while hunting the last seen spot.
      ctx.fillStyle = '#ffe14d';
      ctx.font = 'bold 20px Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', this.x, this.y - 20);
      if (this.lastSeen && this.mode === 'investigate') {
        ctx.strokeStyle = 'rgba(255,225,77,0.7)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(this.lastSeen.x, this.lastSeen.y, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    if (this.seeing) {
      ctx.fillStyle = '#ff2d2d';
      ctx.font = 'bold 16px Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', this.x, this.y - 20);
    }
  }
}

export function createGuards() {
  return [
    new Guard([{ x: 300, y: 200 }, { x: 720, y: 200 }]),
    new Guard([{ x: 450, y: 280 }, { x: 450, y: 540 }]),
    new Guard([{ x: 200, y: 560 }, { x: 740, y: 560 }]),
  ];
}
