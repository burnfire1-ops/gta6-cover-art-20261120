// Bay of Light Cover Studio — submission program (Node 22, standard library only).
//
// The app itself is plain static files under app/ (index.html plus its ES
// modules, no libraries, no network requests), so a desktop browser can open
// it offline. This program hands the finished entry to the judge: it copies
// app/ and screenshots/ from beside this file into the output directory and
// writes output/dossier.json with the vendored make.fun library.
//
// The output directory comes from MAKEFUN_OUTPUT_DIR, or /output when that
// variable is not set. Run it locally like this:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Directory holding this file, and the directory the entry is handed to.
const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast, before copying anything: a half-finished entry must never be
// handed in quietly as if it were valid. The entry page is the one file the
// judge opens first; the first screenshot is the cover the judge sees first;
// the renderer module is what draws that cover. Any of them missing means
// the entry is not ready, so stop here instead of handing in a broken copy.
const entryPage = join(here, 'app', 'index.html');
if (!existsSync(entryPage)) {
  throw new Error(`missing entry page: ${entryPage}`);
}
const renderer = join(here, 'app', 'src', 'cover.js');
if (!existsSync(renderer)) {
  throw new Error(`missing cover renderer: ${renderer}`);
}
const shotsDir = join(here, 'screenshots');
const firstShot = join(shotsDir, '1-cover.jpg');
if (!existsSync(shotsDir) || !existsSync(firstShot)) {
  throw new Error(`missing screenshots: expected ${firstShot} to exist`);
}

// Copy the app and its screenshots into the output directory.
mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

// Write the dossier the judge reads. The caps mirror the scorer's own
// limits: at most 163840 bytes of text, at most 4 screenshots of at most
// 262144 bytes each, at most 993 app files totalling 50331648 bytes, and no
// app path longer than 1000 bytes.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`entry handed in to ${outDir} (app/ + screenshots/ + dossier.json)`);
