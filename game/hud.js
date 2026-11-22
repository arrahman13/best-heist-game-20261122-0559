// hud.js — the top bar: alarm meter, loot total, EMP button with cooldown,
// getaway timer, times spotted and elapsed time. Everything the player needs
// to read the room at a glance, drawn on the canvas so it shows in screenshots.
import { HUD_H } from './level.js';

export const EMP_BUTTON = { x: 668, y: 10, w: 92, h: 36 };

export function drawHUD(ctx, game) {
  ctx.fillStyle = '#0d1320';
  ctx.fillRect(0, 0, 960, HUD_H);
  ctx.fillStyle = '#2c3a52';
  ctx.fillRect(0, HUD_H - 2, 960, 2);

  // Title.
  ctx.fillStyle = '#e8c15a';
  ctx.font = 'bold 19px Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('VAULT RUN', 14, 26);
  ctx.fillStyle = '#8fa3c0';
  ctx.font = '11px Verdana, sans-serif';
  ctx.fillText('grab the vault · reach the EXIT', 14, 44);

  // Alarm meter.
  ctx.fillStyle = '#c8d3e6';
  ctx.font = 'bold 12px Verdana, sans-serif';
  ctx.fillText('ALARM', 190, 22);
  const ax = 190, ay = 28, aw = 190, ah = 16;
  ctx.fillStyle = '#1a2233';
  ctx.fillRect(ax, ay, aw, ah);
  const frac = Math.max(0, Math.min(1, game.alarm / 100));
  const col = frac < 0.5 ? '#2fbf5a' : frac < 0.8 ? '#e8c15a' : '#ff2d2d';
  ctx.fillStyle = col;
  ctx.fillRect(ax + 1, ay + 1, (aw - 2) * frac, ah - 2);
  ctx.strokeStyle = '#42546f';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax, ay, aw, ah);
  ctx.fillStyle = frac >= 0.8 ? '#ff6b6b' : '#8fa3c0';
  ctx.font = 'bold 11px Verdana, sans-serif';
  ctx.fillText(`${Math.round(game.alarm)}%`, ax + aw + 8, ay + 13);
  if (game.alarm >= 80) {
    // Flash the whole HUD border red when the alarm is about to blow.
    ctx.strokeStyle = `rgba(255,45,45,${0.5 + 0.5 * Math.sin(game.time * 10)})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, 957, HUD_H - 2);
  }

  // Loot total.
  ctx.fillStyle = '#ffe98a';
  ctx.font = 'bold 15px Verdana, sans-serif';
  ctx.fillText(`LOOT $${game.lootValue}`, 420, 26);
  ctx.fillStyle = '#8fa3c0';
  ctx.font = '11px Verdana, sans-serif';
  ctx.fillText(`spotted ×${game.timesSpotted}`, 420, 44);

  // Getaway timer (after the vault grab).
  if (game.getaway) {
    const t = Math.max(0, game.getawayLeft);
    ctx.fillStyle = t < 10 ? '#ff6b6b' : '#ffe98a';
    ctx.font = 'bold 16px Verdana, sans-serif';
    ctx.fillText(`GETAWAY ${Math.ceil(t)}s`, 540, 26);
    ctx.fillStyle = '#8fa3c0';
    ctx.font = '11px Verdana, sans-serif';
    ctx.fillText('guards are faster!', 540, 44);
  } else {
    ctx.fillStyle = '#8fa3c0';
    ctx.font = '12px Verdana, sans-serif';
    ctx.fillText(`TIME ${formatTime(game.elapsed)}`, 540, 26);
    ctx.fillText(game.vaultTaken ? 'vault secured' : 'vault not taken', 540, 44);
  }

  // EMP button (mouse-clickable; E key works too).
  const b = EMP_BUTTON;
  const ready = game.empCooldown <= 0;
  const active = game.empActive > 0;
  ctx.fillStyle = active ? '#7a2ea6' : ready ? '#2e7d46' : '#333d52';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = active ? '#d98cff' : ready ? '#57c785' : '#55688a';
  ctx.lineWidth = 2;
  ctx.strokeRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(active ? `EMP ${Math.ceil(game.empActive)}s` : ready ? 'EMP [E]' : `EMP ${Math.ceil(game.empCooldown)}s`, b.x + b.w / 2, b.y + 23);
  ctx.textAlign = 'left';

  // (The controls hint lives under the canvas in index.html, so the HUD
  // stays clean and the EMP button never collides with hint text.)
}

export function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// Score screen: loot value, time, times spotted, clean-getaway bonus, rank.
export function drawScore(ctx, game) {
  const w = 520, h = 330, x = (960 - w) / 2, y = (640 - h) / 2;
  ctx.fillStyle = 'rgba(5,8,14,0.82)';
  ctx.fillRect(0, 0, 960, 640);
  ctx.fillStyle = '#101828';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = game.state === 'win' ? '#37e07f' : '#ff2d2d';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);

  ctx.textAlign = 'center';
  ctx.fillStyle = game.state === 'win' ? '#37e07f' : '#ff6b6b';
  ctx.font = 'bold 30px Verdana, sans-serif';
  ctx.fillText(game.state === 'win' ? 'CLEAN GETAWAY!' : 'CAUGHT!', 480, y + 48);
  ctx.fillStyle = '#e8c15a';
  ctx.font = 'bold 15px Verdana, sans-serif';
  ctx.fillText(game.state === 'win' ? 'You slipped out with the loot.' : 'The alarm hit 100% — the crew got you.', 480, y + 76);

  const rows = [
    ['Loot grabbed', `$${game.lootValue}`],
    ['Time', formatTime(game.elapsed)],
    ['Times spotted', `${game.timesSpotted}`],
    ['Clean bonus', game.timesSpotted === 0 && game.state === 'win' ? '+$500' : '$0'],
    ['FINAL SCORE', `$${game.finalScore}`],
  ];
  ctx.font = '15px Verdana, sans-serif';
  rows.forEach((r, i) => {
    const ry = y + 118 + i * 32;
    ctx.fillStyle = i === rows.length - 1 ? '#ffe98a' : '#c8d3e6';
    ctx.font = i === rows.length - 1 ? 'bold 18px Verdana, sans-serif' : '15px Verdana, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(r[0], x + 40, ry);
    ctx.textAlign = 'right';
    ctx.fillText(r[1], x + w - 40, ry);
    ctx.textAlign = 'center';
  });

  ctx.fillStyle = '#e8c15a';
  ctx.font = 'bold 22px Verdana, sans-serif';
  ctx.fillText(`RANK ${game.rank}`, 480, y + 288);
  ctx.fillStyle = '#8fa3c0';
  ctx.font = '13px Verdana, sans-serif';
  ctx.fillText('Press R to run it again', 480, y + 314);
}
