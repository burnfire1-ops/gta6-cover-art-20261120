// Bay of Light Cover Studio — the hand-in program (Node 22, standard library only).
//
// It takes the finished app (app/) and its three screenshots (screenshots/) from
// beside this file, copies both into the output directory, and writes the
// dossier.json the judge reads, using the vendored make.fun library.
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output. When it is
// unset the program targets /output, the grader's directory.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast, before copying anything: a half-finished entry must never be
// handed in silently as if it were valid. The page has to exist, the
// screenshots folder has to exist, and the first screenshot — the cover the
// judge sees first — has to be there. Anything missing stops the run here.
const page = join(here, 'app', 'index.html');
if (!existsSync(page)) {
  throw new Error('refusing to hand in: app/index.html is missing');
}
const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir)) {
  throw new Error('refusing to hand in: screenshots/ is missing');
}
if (!existsSync(join(shotsDir, '1-cover.jpg'))) {
  throw new Error('refusing to hand in: screenshots/1-cover.jpg is missing');
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The caps come from the bounty's gate: text at most 163840 bytes, at most four
// screenshots of at most 262144 bytes each, app at most 993 entries and
// 50331648 bytes in total, no app path over 1000 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
