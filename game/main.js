// main.js — Vault Run: the game loop, state machine, alarm, EMP, getaway
// timer and scoring. Wires together level, guards, cameras, loot, the thief,
// the HUD and the sound effects.
import { CANVAS_W, CANVAS_H, ROOM, EXIT, VAULT, drawRoom } from './level.js';
import { createGuards } from './guards.js';
import { createCameras } from './cameras.js';
import { createLoot } from './loot.js';
import { Thief } from './thief.js';
import { drawHUD, drawScore, EMP_BUTTON } from './hud.js';
import { ensureAudio, sfx } from './audio.js';

const EMP_DURATION = 5;    // seconds cameras stay offline
const EMP_COOLDOWN = 12;   // seconds before the EMP can fire again
const GETAWAY_TIME = 30;   // seconds to escape after grabbing the vault
const ALARM_RISE = 30;     // alarm points per second while spotted
const ALARM_FALL = 14;     // alarm points per second while hidden

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const game = {
  state: 'title', // title | playing | caught | win
  thief: new Thief(),
  guards: createGuards(),
  cameras: createCameras(),
  loot: createLoot(),
  alarm: 0,
  lootValue: 0,
  vaultTaken: false,
  timesSpotted: 0,
  elapsed: 0,
  getaway: false,
  getawayLeft: 0,
  empActive: 0,
  empCooldown: 0,
  spotters: 0,
  spottedFlash: 0, // seconds left showing the "SPOTTED!" warning
  finalScore: 0,
  rank: 'C',
  frozen: false, // demo screenshots: render a staged frame, don't advance
  time: 0,
};

const input = { up: false, down: false, left: false, right: false };

function resetGame() {
  game.thief = new Thief();
  game.guards = createGuards();
  game.cameras = createCameras();
  game.loot = createLoot();
  game.alarm = 0;
  game.lootValue = 0;
  game.vaultTaken = false;
  game.timesSpotted = 0;
  game.elapsed = 0;
  game.getaway = false;
  game.getawayLeft = 0;
  game.empActive = 0;
  game.empCooldown = 0;
  game.spotters = 0;
  game.spottedFlash = 0;
  game.finalScore = 0;
  game.rank = 'C';
  game.state = 'playing';
}

function computeScore() {
  const clean = game.state === 'win' && game.timesSpotted === 0 ? 500 : 0;
  const timeBonus = game.state === 'win' ? Math.max(0, Math.round(300 - game.elapsed * 2)) : 0;
  game.finalScore = game.lootValue + clean + timeBonus;
  if (game.state === 'win') {
    game.rank = game.lootValue >= 1800 && game.timesSpotted === 0 ? 'S'
      : game.lootValue >= 1400 && game.timesSpotted <= 1 ? 'A'
      : game.lootValue >= 1000 ? 'B' : 'C';
  } else {
    game.rank = game.lootValue >= 1000 ? 'B' : 'C';
  }
}

function fireEMP() {
  if (game.state !== 'playing' || game.empCooldown > 0) return;
  game.empActive = EMP_DURATION;
  game.empCooldown = EMP_COOLDOWN;
  for (const cam of game.cameras) cam.offline = EMP_DURATION;
  sfx.emp();
  setStatus('EMP fired — cameras offline for 5 seconds.');
}

function update(dt) {
  game.time += dt;
  if (game.state !== 'playing') return;
  game.elapsed += dt;

  // EMP timers.
  if (game.empActive > 0) game.empActive -= dt;
  if (game.empCooldown > 0) game.empCooldown -= dt;

  game.thief.update(dt, input);
  for (const g of game.guards) g.update(dt, game);
  for (const c of game.cameras) c.update(dt);
  for (const l of game.loot) l.update(dt);

  // Who can see the thief right now?
  let spotters = 0;
  for (const g of game.guards) if (g.seeing) spotters++;
  for (const c of game.cameras) if (c.canSee(game.thief.x, game.thief.y)) { c.seeing = true; spotters++; }
  else c.seeing = false;
  if (spotters > 0 && game.spotters === 0) {
    game.timesSpotted++;
    game.spottedFlash = 1.5;
    sfx.spotted();
  }
  if (game.spottedFlash > 0) game.spottedFlash -= dt;
  game.spotters = spotters;

  // Alarm rises while spotted, falls while hidden; getaway ticks it up.
  if (spotters > 0) game.alarm += ALARM_RISE * (1 + 0.3 * (spotters - 1)) * dt;
  else game.alarm -= ALARM_FALL * dt;
  if (game.getaway) {
    game.alarm += 2 * dt;
    game.getawayLeft -= dt;
    if (game.getawayLeft <= 0) {
      game.alarm = 100; // out of time — the crew closes in
    }
  }
  game.alarm = Math.max(0, Math.min(100, game.alarm));
  if (game.alarm >= 100) {
    game.state = 'caught';
    computeScore();
    sfx.caught();
    setStatus('Caught! The alarm hit 100%. Press R to run it again.');
    return;
  }

  // Loot pickups.
  for (const l of game.loot) {
    if (l.taken) continue;
    if (Math.hypot(l.x - game.thief.x, l.y - game.thief.y) < 28) {
      l.taken = true;
      game.lootValue += l.value;
      if (l.kind === 'vault') {
        game.vaultTaken = true;
        game.getaway = true;
        game.getawayLeft = GETAWAY_TIME;
        sfx.vault();
        setStatus('Vault grabbed! Getaway timer running — reach the green EXIT!');
      } else {
        sfx.pickup();
      }
    }
  }

  // Escape through the green exit — only counts once the vault is taken.
  const t = game.thief;
  if (t.x - t.r < EXIT.x + EXIT.w + 6 && t.x > EXIT.x - 4 &&
      t.y > EXIT.y - 6 && t.y < EXIT.y + EXIT.h + 6) {
    if (game.vaultTaken) {
      game.state = 'win';
      computeScore();
      sfx.win();
      setStatus(`Clean getaway! Score $${game.finalScore}, rank ${game.rank}. Press R to run it again.`);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawRoom(ctx);
  for (const l of game.loot) l.draw(ctx);
  for (const g of game.guards) g.draw(ctx);
  for (const c of game.cameras) c.draw(ctx);
  game.thief.draw(ctx);

  // Red flash at the screen edge while the thief is being seen.
  if (game.state === 'playing' && game.spotters > 0) {
    ctx.strokeStyle = 'rgba(255,45,45,0.85)';
    ctx.lineWidth = 5;
    ctx.strokeRect(3, 3, CANVAS_W - 6, CANVAS_H - 6);
  }

  // "Grab the vault first" hint when lingering at the exit too early.
  const t = game.thief;
  if (game.state === 'playing' && !game.vaultTaken &&
      t.x < EXIT.x + 90 && t.y > EXIT.y - 20 && t.y < EXIT.y + EXIT.h + 20) {
    ctx.fillStyle = '#ffe98a';
    ctx.font = 'bold 14px Verdana, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Grab the vault first!', EXIT.x + 46, EXIT.y + EXIT.h / 2 + 5);
  }

  // "SPOTTED!" warning while the alarm is climbing from a fresh sighting.
  if (game.state === 'playing' && game.spottedFlash > 0) {
    ctx.fillStyle = `rgba(255,45,45,${Math.min(1, game.spottedFlash)})`;
    ctx.font = 'bold 26px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPOTTED!', 480, 110);
    ctx.textAlign = 'left';
  }

  drawHUD(ctx, game);

  if (game.state === 'title') drawTitle(ctx);
  if (game.state === 'caught' || game.state === 'win') drawScore(ctx, game);
}

function drawTitle(ctx) {
  ctx.fillStyle = 'rgba(5,8,14,0.78)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8c15a';
  ctx.font = 'bold 52px Verdana, sans-serif';
  ctx.fillText('VAULT RUN', 480, 210);
  ctx.fillStyle = '#c8d3e6';
  ctx.font = '17px Verdana, sans-serif';
  ctx.fillText('One room. Three guards. Two cameras. One vault.', 480, 250);
  ctx.fillStyle = '#ffe98a';
  ctx.font = '15px Verdana, sans-serif';
  ctx.fillText('Cross the room, grab the vault, escape through the green EXIT.', 480, 282);
  ctx.fillStyle = '#c8d3e6';
  ctx.font = '14px Verdana, sans-serif';
  ctx.fillText('Red cones: guard sight   ·   Magenta cones: cameras   ·   Gold: loot', 480, 322);
  ctx.fillText('WASD / arrows to move  ·  E or click EMP to black out cameras (5s)', 480, 348);
  ctx.fillText('Small loot pays a little — the vault pays $1000, but the room gets hot.', 480, 374);
  ctx.fillStyle = '#37e07f';
  ctx.font = 'bold 20px Verdana, sans-serif';
  ctx.fillText('Press ENTER or click to start', 480, 430);
  ctx.fillStyle = '#8fa3c0';
  ctx.font = '12px Verdana, sans-serif';
  ctx.fillText('Stay out of the cones or the alarm fills — at 100% you are caught.', 480, 462);
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

// ---- Input ----
const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};
window.addEventListener('keydown', (e) => {
  if (KEYMAP[e.code] !== undefined) {
    input[KEYMAP[e.code]] = true;
    e.preventDefault();
  }
  if (e.code === 'KeyE') fireEMP();
  if (e.code === 'Enter' && game.state === 'title') {
    ensureAudio();
    resetGame();
  }
  if (e.code === 'KeyR' && (game.state === 'caught' || game.state === 'win')) {
    ensureAudio();
    resetGame();
  }
});
window.addEventListener('keyup', (e) => {
  if (KEYMAP[e.code] !== undefined) input[KEYMAP[e.code]] = false;
});
canvas.addEventListener('mousedown', (e) => {
  ensureAudio();
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (CANVAS_W / rect.width);
  const y = (e.clientY - rect.top) * (CANVAS_H / rect.height);
  if (game.state === 'title') { resetGame(); return; }
  if (game.state === 'playing' &&
      x >= EMP_BUTTON.x && x <= EMP_BUTTON.x + EMP_BUTTON.w &&
      y >= EMP_BUTTON.y && y <= EMP_BUTTON.y + EMP_BUTTON.h) {
    fireEMP();
  }
});

// ---- Demo hooks: ?demo=1/2/3 stage a frozen mid-game frame for screenshots ----
function applyDemo(mode) {
  game.frozen = true;
  game.state = 'playing';
  game.elapsed = 41;
  if (mode === '1') {
    // Mid-heist: thief partway across, caught in a guard cone, alarm half full.
    game.thief.x = 430; game.thief.y = 330; game.thief.facing = Math.PI / 2;
    game.alarm = 55;
    game.lootValue = 400;
    game.timesSpotted = 1;
    game.loot[0].taken = true;
    game.loot[1].taken = true;
    const g1 = game.guards[0];
    g1.x = 430; g1.y = 200; g1.facing = Math.PI / 2; g1.seeing = true;
    // Stage the other patrols facing along their routes for the shot.
    game.guards[1].facing = Math.PI / 2;
    game.guards[2].facing = 0;
    game.spotters = 1;
    game.cameras[0].angle = Math.PI / 2 + 0.3;
    game.cameras[1].angle = Math.PI - 0.3;
  } else if (mode === '2') {
    // EMP blackout: cameras offline, cones dim, thief closing on the vault.
    game.thief.x = 780; game.thief.y = 185; game.thief.facing = 0;
    game.alarm = 30;
    game.lootValue = 800;
    game.timesSpotted = 1;
    game.loot[0].taken = true;
    game.loot[1].taken = true;
    game.loot[2].taken = true;
    game.empActive = 3.2;
    game.empCooldown = 8.8;
    for (const c of game.cameras) c.offline = 3.2;
    const g2 = game.guards[1];
    g2.mode = 'investigate';
    g2.x = 690; g2.y = 260;
    g2.lastSeen = { x: 760, y: 200 };
    g2.facing = Math.atan2(200 - 260, 760 - 690);
  } else if (mode === '3') {
    // Score screen after a clean getaway.
    game.state = 'win';
    game.lootValue = 1800;
    game.elapsed = 74;
    game.timesSpotted = 1;
    game.vaultTaken = true;
    game.loot.forEach((l) => { l.taken = true; });
    computeScore();
  }
}

// ---- Main loop ----
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.frozen) update(dt);
  draw();
  requestAnimationFrame(frame);
}

const params = new URLSearchParams(window.location.search);
const demo = params.get('demo');
if (demo) applyDemo(demo);
window.__vaultRun = game; // inspectable state for headless play-tests
requestAnimationFrame(frame);
