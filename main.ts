// Vault Run — make.fun hand-in program (Node 22, standard library only).
// Copies this repository's game/ and screenshots/ into /output (or
// $MAKEFUN_OUTPUT_DIR outside the grader) and writes /output/dossier.json
// with buildDossier from the vendored make.fun library.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');

// Fail loudly instead of handing in a half-empty entry.
if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error(`game/index.html not found under ${gameDir}`);
}
if (!existsSync(shotsDir) || readdirSync(shotsDir).filter((f) => !f.startsWith('.')).length < 3) {
  throw new Error(`expected at least 3 screenshots under ${shotsDir}`);
}

mkdirSync(outDir, { recursive: true });
cpSync(gameDir, join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

// Caps mirror the gate's own limits, so a local run refuses what the
// scorer would refuse: at most 4 screenshots of 256 KiB, game/ at most
// 993 entries and 48 MiB, and the dossier text capped at 160 KiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
const dossierPath = join(outDir, 'dossier.json');
writeFileSync(dossierPath, dossier);

// Short run summary so a local run shows what the grader will receive.
const shotCount = readdirSync(join(outDir, 'screenshots')).filter((f) => !f.startsWith('.')).length;
console.log(
  `vault-run: wrote ${join(outDir, 'game')} + ${shotCount} screenshot(s) + ` +
  `dossier.json (${statSync(dossierPath).size} bytes) to ${outDir}`,
);
