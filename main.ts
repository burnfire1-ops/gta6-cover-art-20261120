// Bay of Light Cover Studio — submission program (Node 22, standard library only).
// It hands the finished app to the make.fun judge: it copies app/ and screenshots/
// from beside this file into the output directory and writes dossier.json there
// with the vendored make.fun library.
//
// Run it with MAKEFUN_OUTPUT_DIR pointing at a scratch folder while testing:
//   MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts
// Without that variable it writes to /output, the grader's directory.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const appDir = join(here, 'app');
const shotsDir = join(here, 'screenshots');

if (!existsSync(join(appDir, 'index.html'))) {
  throw new Error('missing app/index.html — refusing to submit a half-built entry');
}
if (!existsSync(shotsDir) || !existsSync(join(shotsDir, '1-cover.jpg'))) {
  throw new Error('missing screenshots/1-cover.jpg — refusing to submit a half-built entry');
}
// The judge needs at least one screenshot and at most four; count them early
// so a stray extra file fails here, loudly, instead of inside buildDossier.
const shotFiles = readdirSync(shotsDir).filter((f) => /\.(jpe?g|png)$/i.test(f));
if (shotFiles.length === 0 || shotFiles.length > 4) {
  throw new Error(`expected 1–4 screenshots, found ${shotFiles.length}`);
}

mkdirSync(join(out, 'app'), { recursive: true });
cpSync(appDir, join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// Caps from the scorer's gate: the text cap shapes the dossier bytes; the rest
// refuse an entry the scorer would refuse anyway (too many / too big screenshots,
// too many or too heavy app files, or an app path that is too long).
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
console.log(`submitted ${shotFiles.length} screenshot(s) to ${out}`);
