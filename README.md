[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/burnfire1-ops/gta6-cover-art-20261120/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/burnfire1-ops/gta6-cover-art-20261120/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# BAY OF LIGHT — Cover Studio

An offline web app that turns one photo and a caption into GTA 6-style cover art: a multi-panel poster with bold chrome lettering and a sunset or neon grade, exported as a PNG to share. It runs in a desktop browser from its own static files — your photos never leave your machine.

Serve it locally with `node serve.ts`, then open http://localhost:8080.

## How it works — three steps

1. **Add photos.** Drop a photo in, browse for one, paste from the clipboard, or load the three sample photos — a fictional cast of three. One photo fills every panel with a smart crop: each panel takes a different slice of the same picture.
2. **Caption & look.** Edit the title, script line, tagline and role tags; pick a theme, a layout and a grade; tune the grade intensity with the sliders.
3. **Export PNG.** One click exports all three post sizes — 1080 × 1080, 1080 × 1350 and 1920 × 1080 — or export a single size.

## Three themes

- **Teluk Sunset** — teal, then pink, then orange. Warm golden-hour bay.
- **Neon Night** — deep purple and cyan neon. Cold night glow.
- **Golden Hour** — sand and vintage amber gold.

One click switches the whole cover mood — same layout, same title, a different Bay of Light.

## Six grades, seven layouts

Grades: Teluk Sunset, Neon Shore, Neon Night, Golden Hour, Tropic Teal, Comic Halftone. Each grade sets the photo filter, the sky wash, the tint and the three-stop chrome of the title; the Grade slider fades it from the raw photo to full strength.

Layouts: Harbor Six, Seven Mosaic, Diagonal Trio, One-Photo Five-Crop, Hero Pop-Out, Bayfront Four, Sunset Strip. Every layout keeps the same title band and footer — only the panel geometry changes.

## The cover

- Role nameplate + sub-line on every panel (THE DRIVER, THE BOSS, THE ANGLER, THE LOOKOUT, THE COURIER, THE FIXER, THE ACE)
- Three-stop chrome title, pink script subtitle, sand tagline
- Quote bar from THE CAHAYA GAZETTE, billing block, gold ORIGINAL COVER ART seal
- VOL 01 badge, TC-0626 barcode, COMING SOON pill, DERMAGA 7 location + HEAT chip
- Halftone dots and film grain over the panels

## Editor

Click a panel to select it, drag to move its photo, scroll to zoom. Each panel has its own zoom, flip, face reset, swap and crop reset. Undo and redo keep up to 40 steps. "🎲 Surprise me" picks a random layout, grade and title.

All lettering is original — no Rockstar assets, no Rockstar fonts. The only fonts are Anton and Pacifico (SIL Open Font License, vendored in `app/fonts/`).
