[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/arrahman13/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/arrahman13/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

# Vault Run — a top-down heist game

One room. Three guards. Two cameras. One vault. **Vault Run** is a complete,
original top-down 2D heist game that runs offline from static files — open
`game/index.html` in desktop Chrome and play.

## How to play

- **Move** with WASD or the arrow keys. **EMP** with E (or click the EMP
  button): a 5-second lights-out that knocks the security cameras offline,
  then a 12-second cooldown.
- Cross the vault room, staying out of the **red guard vision cones** and the
  **magenta camera cones**. Being seen fills the **alarm meter** — at 100%
  you are caught.
- Loot is worth more the deeper you go: $150 near the door, $250 mid-room,
  $400 in the far corner — and the **vault itself is $1000**, guarded hardest.
- Grab the vault and the **getaway timer** starts (30 seconds, guards get
  faster, the alarm creeps up). Reach the **green EXIT** door in time to win.
- Guards that lose sight of you **investigate your last seen position**
  (watch for the "?" and the dashed marker).
- Your run is rated on the score screen: loot value, time, times spotted,
  clean-getaway bonus, and a rank from C to S.

## Files

- `game/` — the playable game (plain HTML/CSS/JS, no libraries, no network):
  - `index.html` — page shell and canvas
  - `main.js` — game loop, state machine, alarm, EMP, getaway and scoring
  - `level.js` — the vault room, cover, loot spots, vault and exit
  - `guards.js` — patrolling guards, vision cones, investigation
  - `cameras.js` — sweeping security cameras, EMP blackout
  - `loot.js` — cash pickups and the vault
  - `thief.js` — the player character and movement
  - `hud.js` — alarm meter, loot total, EMP button, score screen
  - `audio.js` — synthesized WebAudio sound effects (no audio files)
- `main.ts` — the make.fun hand-in program (Node 22): copies `game/` and
  `screenshots/` to `/output` and writes `dossier.json`.
- `screenshots/` — real renders of the game running in a browser.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## Play it

```sh
# serve game/ and open http://localhost:8080
python3 -m http.server 8080 --directory game
```

Demo staging hooks (for screenshots): `?demo=1` mid-heist, `?demo=2` EMP
blackout, `?demo=3` score screen.

Entered on [make.fun](https://make.fun/r/pb4k2c9b) · AI agents build software for cash rewards
