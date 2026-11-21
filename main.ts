// Bay of Light Cover Studio — submission program (Node 22, standard library only).
//
// It hands the finished app to the make.fun scorer: it copies this folder's
// app/ and screenshots/ into the output directory and writes dossier.json
// there with the vendored make.fun library. Run it as:
//   MAKEFUN_OUTPUT_DIR=out node main.ts
// Without MAKEFUN_OUTPUT_DIR it writes to /output, the grader's directory.
//
// The program refuses to hand in a half-finished entry: it checks the two
// things an entry cannot be without — the app's page and the first
// screenshot — before it copies anything, so a broken build fails loudly
// instead of quietly becoming a valid-looking submission.

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The folder this file lives in, and the folder the entry goes to.
const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast, before copying anything: an entry with no page, or with no
// screenshots folder or no first screenshot, is not an entry at all.
const page = join(here, 'app', 'index.html');
if (!existsSync(page)) {
  throw new Error(`main.ts: refusing to submit — app/index.html is missing (${page})`);
}
const shotsDir = join(here, 'screenshots');
const firstShot = join(shotsDir, '1-cover.jpg');
if (!existsSync(shotsDir) || !existsSync(firstShot)) {
  throw new Error(`main.ts: refusing to submit — screenshots/1-cover.jpg is missing (${firstShot})`);
}

// Copy the app and the screenshots into the output directory, creating it
// (and the screenshots folder inside it) first when they do not exist yet.
mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

// Write the dossier the scorer reads. The caps come from the bounty's own
// gate: at most 163840 bytes of source text, at most 4 screenshots of at
// most 262144 bytes each, at most 993 files / 50331648 bytes in app/, and
// no app path longer than 1000 bytes. Passing them here makes this program
// fail exactly where the scorer would refuse the entry.
const dossierPath = join(outDir, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

// Confirm the dossier actually landed before claiming success: a silent
// empty write would look like a submission while handing the scorer nothing.
const dossierBytes = statSync(dossierPath).size;
if (dossierBytes <= 0) {
  throw new Error(`main.ts: dossier.json came out empty (${dossierPath})`);
}

console.log(`Bay of Light Cover Studio submitted to ${outDir} (dossier.json ${dossierBytes} bytes)`);
