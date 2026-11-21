[![GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/burnfire1-ops/gta6-cover-art-20261120/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/burnfire1-ops/gta6-cover-art-20261120/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Bay of Light Cover Studio

A web app that turns one photo and one caption into a GTA 6-style cover poster: a multi-panel grid of characters, bold chrome letters, sunset and neon colour grades, exported as PNG in three posting sizes. It runs offline in a desktop browser from static files only — your photos never leave your machine.

## How it works — three steps

1. **Add photos** — drop photos in, paste one, browse, or load the three sample cast photos. One photo fills every panel with a smart crop: each panel takes a different slice of it, so the same face never repeats flatly across the grid.
2. **Caption & look** — edit the title, script line, tagline and role tags; pick a theme, a layout and a grade; push the Paint, Grade, Halftone, Grain and Glow sliders until the light feels right. Click any panel on the canvas to select it, drag to reframe its photo, scroll to zoom.
3. **Export PNG** — one click exports all three sizes: 1080 × 1080, 1080 × 1350 and 1920 × 1080, as `bay-of-light-WIDTHxHEIGHT.png`.

## Themes

- **Teluk Sunset** — teal, then pink, then orange: the bay at dusk.
- **Neon Night** — deep purple and cyan neon after dark.
- **Golden Hour** — sand and vintage amber gold.

## Grades and layouts

Six colour grades: Teluk Sunset, Neon Shore, Neon Night, Golden Hour, Tropic Teal and Comic Halftone. The grade slider (0–100) eases the photo from raw at 0 to full strength at 100 — the chrome title and the poster furniture are never graded, only the photos inside the panels.

Seven layouts: Harbor Six, Seven Mosaic, Diagonal Trio, One-Photo Five-Crop, Hero Pop-Out, Bayfront Four and Sunset Strip. Every layout keeps the same four zones — a top row, the title band, a bottom row and the footer — so the cover always reads as one poster.

## The cover

- Role nameplates with sub-lines on every panel (THE DRIVER, THE BOSS, THE ANGLER, THE LOOKOUT, THE COURIER, THE FIXER, THE ACE)
- A three-stop chrome title with a dark outline, a thin white outline and retro chrome lines
- A pink script subtitle, a sand tagline, and a location + HEAT chip inside the title band
- A quote bar from THE CAHAYA GAZETTE, a billing block, a gold ORIGINAL COVER ART seal, a VOL 01 badge, a TC-0626 barcode and a COMING SOON pill
- Halftone dots and film grain over the panels, scaled by the grade and the sliders

## Editor

The editor is a single page: a three-step wizard on the left (Add photos, Caption & look, Export PNG) and a live canvas preview on the right. Undo and redo keep up to 40 steps. "Surprise me" shuffles a layout, a grade and a title/script pair. Everything is local — open `app/index.html` straight from disk, or run `node serve.ts` and visit `http://localhost:8080`.

All lettering is original — no Rockstar assets, no Rockstar fonts. The only typefaces are Anton and Pacifico (SIL Open Font License), vendored in `app/fonts/` with their licence texts.
