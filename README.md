[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/burnfire1-ops/gta6-cover-art-20261120/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/burnfire1-ops/gta6-cover-art-20261120/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Bay of Light Cover Studio

A web app that turns a photo and a caption into GTA 6-style cover art: a multi-panel poster with bold chrome lettering and a sunset or neon grade, exported as a PNG to share. It runs offline in a desktop browser from static files — serve `app/` with `node serve.ts` and open http://localhost:8080. Your photos never leave your machine: they are read locally and drawn on a canvas, never uploaded.

## How it works — three steps

1. **Add photos.** Drop a photo, browse for one, paste from the clipboard, or load the three sample cast photos. One photo fills every panel with a smart crop — each panel takes a different slice of it, aimed at the face.
2. **Caption & look.** Edit the title, script line, tagline and role tags; pick a theme, a layout and a grade; tune the grade intensity with five sliders (Paint, Grade, Halftone, Grain, Glow).
3. **Export PNG.** Pick a size — 1080 × 1080, 1080 × 1350 or 1920 × 1080 — and export one size, or export all three in one click. Click a panel on the canvas to select it, drag to move its photo, scroll to zoom it.

## Three themes

One click switches the whole cover mood — same layout, same title, a different Bay of Light. Export any theme, or all three.

- **Teluk Sunset** — teal lalu pink lalu oranye.
- **Neon Night** — ungu gelap + cyan neon.
- **Golden Hour** — pasir + emas vintage amber.

## Six grades, seven layouts

Grades: Teluk Sunset, Neon Shore, Neon Night, Golden Hour, Tropic Teal, Comic Halftone. Each grade is a photo filter plus a sky wash, a tint and a three-stop chrome for the title; the Grade slider blends it from the raw photo (0) to full strength (100). The grade touches the photos only — never the title or the poster furniture.

Layouts: Harbor Six, Seven Mosaic, Diagonal Trio, One-Photo Five-Crop, Hero Pop-Out, Bayfront Four, Sunset Strip. Each lays the same cast out differently, with slanted panel dividers and its own panel count.

## The cover

- Role nameplates with sub-lines (THE DRIVER, THE BOSS, THE ANGLER, THE LOOKOUT, THE COURIER, THE FIXER, THE ACE)
- Chrome three-stop title, pink script subtitle, sand tagline
- Quote bar from THE CAHAYA GAZETTE, billing block, gold ORIGINAL COVER ART seal
- VOL 01 badge, TC-0626 barcode, COMING SOON pill, DERMAGA 7 location + HEAT chip

## Editor

The editor is a single page: a three-step wizard on the left, a live preview on the right. Panels are editable per panel — pick a photo per panel, flip it, re-centre on the face, swap it with the next panel, or reset its crop. Undo and redo keep up to 40 steps. Everything is local: no accounts, no uploads, no network requests.

All lettering is original — no Rockstar assets, no Rockstar fonts. The only fonts are Anton and Pacifico (SIL Open Font License, vendored in `app/fonts/` with their licence texts). The three sample cast members are fictional people made with an image model, photographed in a tropical harbor town at golden hour.

## License

MIT — see [LICENSE](LICENSE).
