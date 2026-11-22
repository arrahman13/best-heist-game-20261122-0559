// cameras.js — wall-mounted security cameras with sweeping vision cones.
// An EMP (E key or the HUD button) knocks them offline for a few seconds:
// their cones go dark and they stop spotting the thief.
import { segmentBlocked } from './level.js';

export const CAM_RANGE = 175;
export const CAM_HALF_ANGLE = 0.45;

export class Camera {
  constructor(x, y, baseAngle, sweepAmp = 0.55, phase = 0) {
    this.x = x; this.y = y;
    this.baseAngle = baseAngle;
    this.sweepAmp = sweepAmp;
    this.phase = phase;
    this.t = 0;
    this.angle = baseAngle;
    this.seeing = false;
    this.offline = 0; // seconds of EMP blackout remaining
  }

  update(dt) {
    this.t += dt;
    if (this.offline > 0) {
      this.offline -= dt;
      return; // frozen mid-sweep, lens dark
    }
    this.angle = this.baseAngle + Math.sin(this.t * 0.9 + this.phase) * this.sweepAmp;
  }

  canSee(tx, ty) {
    if (this.offline > 0) return false;
    const dx = tx - this.x, dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d > CAM_RANGE) return false;
    let ang = Math.atan2(dy, dx) - this.angle;
    while (ang > Math.PI) ang -= Math.PI * 2;
    while (ang < -Math.PI) ang += Math.PI * 2;
    if (Math.abs(ang) > CAM_HALF_ANGLE) return false;
    return !segmentBlocked(this.x, this.y, tx, ty);
  }

  drawCone(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.arc(this.x, this.y, CAM_RANGE, this.angle - CAM_HALF_ANGLE, this.angle + CAM_HALF_ANGLE);
    ctx.closePath();
    if (this.offline > 0) {
      ctx.fillStyle = 'rgba(120,120,140,0.10)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(160,160,180,0.35)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      const g = ctx.createRadialGradient(this.x, this.y, 8, this.x, this.y, CAM_RANGE);
      const hot = this.seeing ? 'rgba(255,60,220,0.40)' : 'rgba(255,80,220,0.22)';
      const edge = this.seeing ? 'rgba(255,60,220,0.08)' : 'rgba(255,80,220,0.05)';
      g.addColorStop(0, hot);
      g.addColorStop(1, edge);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = this.seeing ? 'rgba(255,110,230,0.8)' : 'rgba(255,110,230,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  draw(ctx) {
    this.drawCone(ctx);
    // Wall mount + lens, pointing along the sweep angle.
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.offline > 0 ? '#3a3a44' : '#22222c';
    ctx.fillRect(-4, -6, 18, 12);
    ctx.fillStyle = this.offline > 0 ? '#55555f' : '#ff4fd8';
    ctx.beginPath(); ctx.arc(14, 0, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#888';
    ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); ctx.fill();
    if (this.offline > 0) {
      // Keep the label inside the canvas: right-wall cameras label leftwards.
      ctx.fillStyle = '#c9c9d6';
      ctx.font = 'bold 11px Verdana, sans-serif';
      if (this.x > 880) {
        ctx.textAlign = 'right';
        ctx.fillText('OFFLINE', this.x - 10, this.y - 14);
        ctx.textAlign = 'center';
      } else {
        ctx.textAlign = 'center';
        ctx.fillText('OFFLINE', this.x, this.y - 14);
      }
    } else if (this.seeing) {
      ctx.fillStyle = '#ff4fd8';
      ctx.font = 'bold 15px Verdana, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', this.x, this.y - 14);
    }
  }
}

export function createCameras() {
  return [
    new Camera(430, 66, Math.PI / 2, 0.55, 0),        // top wall, sweeping down
    new Camera(942, 330, Math.PI, 0.5, 2.1),          // right wall, sweeping left
  ];
}
