// level.js — the vault room: walls, cover that blocks movement and sight,
// loot spots, the vault and the exit door. One room to cross, several routes.
export const CANVAS_W = 960;
export const CANVAS_H = 640;
export const HUD_H = 56;

// Playable room bounds (inside the wall border).
export const ROOM = { x: 16, y: 64, w: 928, h: 560 };

// Cover objects: crates, desks and pillars. They block the thief, the guards
// and line of sight, so the room has several safe routes through it.
export const BLOCKERS = [
  { x: 180, y: 150, w: 90, h: 60, kind: 'crate' },   // crate cluster A
  { x: 360, y: 120, w: 120, h: 40, kind: 'desk' },   // desk B
  { x: 560, y: 220, w: 50, h: 50, kind: 'pillar' },  // pillar C
  { x: 700, y: 300, w: 80, h: 80, kind: 'crate' },   // crate D
  { x: 280, y: 380, w: 140, h: 44, kind: 'desk' },   // desk E
  { x: 520, y: 470, w: 56, h: 56, kind: 'pillar' },  // pillar F
  { x: 760, y: 470, w: 90, h: 56, kind: 'crate' },   // crate G
  { x: 120, y: 300, w: 60, h: 140, kind: 'desk' },   // tall counter H
];

// Small loot: worth more the deeper you go — the risk/reward choice.
export const LOOT_SPOTS = [
  { x: 240, y: 260, value: 150, label: '$150' },
  { x: 470, y: 330, value: 250, label: '$250' },
  { x: 660, y: 180, value: 400, label: '$400' },
];

// The vault: the big prize, deep in the top-right corner, guarded hardest.
export const VAULT = { x: 860, y: 112, value: 1000, label: 'VAULT $1000' };

// The exit door on the left wall — escape here after the grab.
export const EXIT = { x: 16, y: 520, w: 34, h: 84 };

// Where the thief slips in.
export const ENTRY = { x: 84, y: 560 };

export function pointBlocked(x, y, r, blockers = BLOCKERS) {
  if (x - r < ROOM.x || x + r > ROOM.x + ROOM.w ||
      y - r < ROOM.y || y + r > ROOM.y + ROOM.h) return true;
  for (const b of blockers) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return true;
  }
  return false;
}

// True when a straight line between two points crosses a blocker or a wall.
export function segmentBlocked(x1, y1, x2, y2, blockers = BLOCKERS) {
  const steps = 24;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (pointBlocked(x, y, 0, blockers)) return true;
  }
  return false;
}

export function drawRoom(ctx) {
  // Floor: dark tiles with a faint grid so movement reads clearly.
  ctx.fillStyle = '#171e2c';
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
  ctx.strokeStyle = 'rgba(120,140,180,0.10)';
  ctx.lineWidth = 1;
  for (let x = ROOM.x + 46; x < ROOM.x + ROOM.w; x += 46) {
    ctx.beginPath(); ctx.moveTo(x, ROOM.y); ctx.lineTo(x, ROOM.y + ROOM.h); ctx.stroke();
  }
  for (let y = ROOM.y + 46; y < ROOM.y + ROOM.h; y += 46) {
    ctx.beginPath(); ctx.moveTo(ROOM.x, y); ctx.lineTo(ROOM.x + ROOM.w, y); ctx.stroke();
  }
  // Carpet runner from entry toward the vault — the "safe lane" hint.
  ctx.fillStyle = 'rgba(232,193,90,0.05)';
  ctx.fillRect(ROOM.x + 60, ROOM.y + 400, 760, 40);

  // Walls.
  ctx.fillStyle = '#2c3a52';
  ctx.fillRect(ROOM.x - 8, ROOM.y - 8, ROOM.w + 16, 8);
  ctx.fillRect(ROOM.x - 8, ROOM.y + ROOM.h, ROOM.w + 16, 8);
  ctx.fillRect(ROOM.x - 8, ROOM.y - 8, 8, ROOM.h + 16);
  ctx.fillRect(ROOM.x + ROOM.w, ROOM.y - 8, 8, ROOM.h + 16);
  ctx.fillStyle = '#42546f';
  ctx.fillRect(ROOM.x - 8, ROOM.y - 8, ROOM.w + 16, 2);
  ctx.fillRect(ROOM.x - 8, ROOM.y + ROOM.h + 6, ROOM.w + 16, 2);

  // Cover objects.
  for (const b of BLOCKERS) {
    if (b.kind === 'crate') {
      ctx.fillStyle = '#5a4632';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#8a6f4d';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + b.w, b.y + b.h);
      ctx.moveTo(b.x + b.w, b.y); ctx.lineTo(b.x, b.y + b.h);
      ctx.stroke();
    } else if (b.kind === 'desk') {
      ctx.fillStyle = '#3d4a63';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#55688a';
      ctx.fillRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8);
    } else { // pillar
      ctx.fillStyle = '#4a5a76';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#6b7f9f';
      ctx.beginPath();
      ctx.arc(b.x + b.w / 2, b.y + b.h / 2, Math.min(b.w, b.h) / 2 - 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Exit door: bright green, glowing, on the left wall.
  ctx.fillStyle = '#1fae5f';
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = '#37e07f';
  ctx.fillRect(EXIT.x + 6, EXIT.y + 6, EXIT.w - 12, EXIT.h - 12);
  ctx.fillStyle = '#062b16';
  ctx.font = 'bold 13px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(EXIT.x + EXIT.w / 2 + 26, EXIT.y + EXIT.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#37e07f';
  ctx.fillText('EXIT', 0, 4);
  ctx.restore();
  // Exit glow marker so it reads from across the room.
  ctx.strokeStyle = 'rgba(55,224,127,0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT.x - 4, EXIT.y - 4, EXIT.w + 8, EXIT.h + 8);
}
