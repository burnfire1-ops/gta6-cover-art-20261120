// BAY OF LIGHT Cover Studio — gta6-cover-art-01 entry (Node 22, standard library only).
// Hands in the app: copies app/ and screenshots/ from beside this file to /output and
// writes /output/dossier.json with the vendored make.fun library, as the starter does.
// The app is plain static files under app/ (index.html + ES modules + OFL fonts +
// sample photos), fully offline. Serve locally with `node serve.ts`, then open
// http://localhost:8080. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast, before copying anything, when the entry is incomplete: the app must
// exist with its entry point, and at least one screenshot must be present (the
// first by name is the cover the judge sees). A half-built entry must never be
// handed in silently as a valid one.
if (!existsSync(join(here, 'app', 'index.html'))) throw new Error('missing app/index.html — build the app first');
if (!existsSync(join(here, 'screenshots')) || !existsSync(join(here, 'screenshots', '1-cover.jpg'))) throw new Error('missing screenshots/1-cover.jpg — take the cover screenshot first');

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes;
// the others refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files in app/ or 48 MiB of app files, in all, or a path
// under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
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
