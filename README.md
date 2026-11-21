[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/burnfire1-ops/gta6-cover-art-20261120/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/burnfire1-ops/gta6-cover-art-20261120/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Bay of Light — Cover Studio

A web app that turns one photo and a caption into a GTA 6-style cover poster: a multi-panel cast grid, big chrome lettering, and a sunset/neon grade, exported as PNG in three posting sizes. It runs offline in a desktop browser from static files only, and a photo never leaves the machine — pictures are read locally, never uploaded.

## How it works — three steps

1. **Add photos** — drop, paste, browse, or load the three sample cast photos. One photo fills all six panels with a smart crop: each panel takes a different slice of the same picture, anchored on its own focus point.
2. **Caption & look** — edit the title, script line, tagline, and role tags; pick a theme, a layout, and a grade; tune the grade intensity with five sliders (Paint, Grade, Halftone, Grain, Glow).
3. **Export PNG** — one click exports all three sizes (1080 × 1080, 1080 × 1350, 1920 × 1080) as `bay-of-light-WxH.png`, or export a single size.

## Themes

- **Teluk Sunset** — teal sea, then pink, then orange: the bay at dusk.
- **Neon Night** — deep purple and cyan neon: the bay after midnight.
- **Golden Hour** — sand and vintage amber gold: the bay in old sunlight.

One click switches the whole cover mood — same layout, same title, a different Bay of Light.

## Grades and layouts

Six grades: Teluk Sunset, Neon Shore, Neon Night, Golden Hour, Tropic Teal, Comic Halftone. Each grade is a photo filter plus a sky wash, a tint, and a three-stop chrome gradient for the title; the grade slider blends it from the raw photo (0) to full strength (100). Only the photos are graded — the title chrome and all poster furniture are never touched by the grade.

Seven layouts: Harbor Six, Seven Mosaic, Diagonal Trio, One-Photo Five-Crop, Hero Pop-Out, Bayfront Four, Sunset Strip.

## The cover

- Role nameplate + sub-line on every panel (THE DRIVER, THE BOSS, THE ANGLER, THE LOOKOUT, THE COURIER, THE FIXER, THE ACE).
- Big three-stop chrome title, pink Pacifico script subtitle, and the tagline SIX LIVES · ONE BAY · NO WAY BACK.
- Quote bar from THE CAHAYA GAZETTE, billing block, gold ORIGINAL COVER ART seal, VOL 01 badge, barcode TC-0626, COMING SOON pill, and the DERMAGA 7 location + HEAT chip.
- All lettering is original — no Rockstar assets, no Rockstar fonts. The only fonts are Anton and Pacifico (SIL Open Font License, vendored in `app/fonts/`).

## Editor

- Click a panel to select it, drag to move its photo, scroll to zoom (0.8–2.5×).
- Per-panel tools: Flip, Face (re-centre on the face), Swap → (swap photos with the next panel), Reset crop.
- Undo/redo history (40 steps), role tag and sub-line editing per panel.
- Surprise me: a random layout, grade, and title/script pair.
- Works fully offline; no network requests from the app.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Submit it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
