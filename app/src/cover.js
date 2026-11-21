// Bay of Light Cover Studio — the cover renderer.
//
// Everything the poster shows lives here: the nine-colour palette, the six
// colour grades, the three themes, the seven layouts, the seven roles with
// their sub-lines, the smart crop, and drawCover(), which paints one whole
// cover onto a 2D canvas at any size. The editor (main.js) owns the state;
// this file only turns a state object into pixels.
//
// One rule runs through the whole file: the grade touches the photos only.
// The chrome title, the furniture, the footer and the badges are never
// graded — they keep their own colours at every intensity.

export const PALETTE = {
  teal: '#00D0B8',
  pink: '#FF1F8A',
  sand: '#F2C95E',
  sunset: '#FF7A1A',
  purple: '#1A0B2E',
  palm: '#2E7D5B',
  cream: '#FFF3D6',
  ink: '#12081F',
  cyan: '#17DDD6',
  amber: '#B45309',
};

// Six grades. filter: how the photo is pushed (saturation, contrast,
// hue rotation in degrees, sepia). sky: the three sky-wash colours.
// tint: the translucent wash laid over the photo, with its full-strength
// alpha. chrome: the three stops of the title's chrome gradient.
export const GRADES = {
  sunset: {
    name: 'Teluk Sunset',
    filter: { sat: 1.6, con: 1.22, hue: 0, sepia: 0 },
    sky: [PALETTE.teal, PALETTE.pink, PALETTE.sunset],
    tint: { color: PALETTE.sunset, alpha: 0.2 },
    chrome: [PALETTE.sand, PALETTE.sunset, PALETTE.pink],
  },
  shore: {
    name: 'Neon Shore',
    filter: { sat: 1.85, con: 1.45, hue: -8, sepia: 0 },
    sky: [PALETTE.purple, PALETTE.pink, PALETTE.sunset],
    tint: { color: PALETTE.pink, alpha: 0.22 },
    chrome: [PALETTE.cyan, PALETTE.pink, PALETTE.sand],
  },
  night: {
    name: 'Neon Night',
    filter: { sat: 1.7, con: 1.3, hue: -20, sepia: 0 },
    sky: [PALETTE.purple, PALETTE.cyan, PALETTE.pink],
    tint: { color: PALETTE.cyan, alpha: 0.2 },
    chrome: [PALETTE.cyan, PALETTE.pink, PALETTE.sand],
  },
  golden: {
    name: 'Golden Hour',
    filter: { sat: 1.5, con: 1.12, hue: 0, sepia: 0.5 },
    sky: [PALETTE.sand, PALETTE.sunset, PALETTE.amber],
    tint: { color: PALETTE.sand, alpha: 0.2 },
    chrome: [PALETTE.cream, PALETTE.sand, PALETTE.sunset],
  },
  teal: {
    name: 'Tropic Teal',
    filter: { sat: 1.35, con: 1.05, hue: 8, sepia: 0 },
    sky: [PALETTE.teal, PALETTE.palm, PALETTE.cream],
    tint: { color: PALETTE.teal, alpha: 0.12 },
    chrome: [PALETTE.cream, PALETTE.teal, PALETTE.palm],
  },
  halftone: {
    name: 'Comic Halftone',
    filter: { sat: 1.9, con: 1.6, hue: 0, sepia: 0 },
    sky: [PALETTE.cream, PALETTE.pink, PALETTE.teal],
    tint: { color: PALETTE.pink, alpha: 0.14 },
    chrome: [PALETTE.sand, PALETTE.sunset, PALETTE.pink],
  },
};

// Three themes. A theme is one grade plus a mood line and three swatches
// for its picker card. Layout, title and furniture are the same in all
// three — only the mood changes, so the three read as three covers of one
// world.
export const THEMES = [
  {
    id: 'sunset',
    name: 'Teluk Sunset',
    grade: 'sunset',
    mood: 'Teal, then pink, then orange — the bay at dusk.',
    swatches: [PALETTE.teal, PALETTE.pink, PALETTE.sunset],
  },
  {
    id: 'night',
    name: 'Neon Night',
    grade: 'night',
    mood: 'Deep purple and cyan neon after dark.',
    swatches: [PALETTE.purple, PALETTE.cyan, PALETTE.pink],
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    grade: 'golden',
    mood: 'Sand and vintage amber gold.',
    swatches: [PALETTE.sand, PALETTE.sunset, PALETTE.amber],
  },
];

export const LAYOUTS = [
  { id: 'harbor', name: 'Harbor Six' },
  { id: 'mosaic', name: 'Seven Mosaic' },
  { id: 'trio', name: 'Diagonal Trio' },
  { id: 'fivecrop', name: 'One-Photo Five-Crop' },
  { id: 'hero', name: 'Hero Pop-Out' },
  { id: 'four', name: 'Bayfront Four' },
  { id: 'strip', name: 'Sunset Strip' },
];

// The seven roles, in order, with the sub-line each one carries.
export const ROLES = [
  { name: 'THE DRIVER', sub: 'DERMAGA 7 · 6:42 PM · LOOKING FOR TROUBLE' },
  { name: 'THE BOSS', sub: 'PIER 9 · 7:15 PM · NO WAY BACK' },
  { name: 'THE ANGLER', sub: 'BOULEVARD · 5:30 PM · ONE LAST CAST' },
  { name: 'THE LOOKOUT', sub: 'ROOFTOP · 11 PM · EYES ON THE BAY' },
  { name: 'THE COURIER', sub: 'OLD TOWN · 8:05 PM · PACKAGE DUE' },
  { name: 'THE FIXER', sub: 'BACK ALLEY · MIDNIGHT · FIXES EVERYTHING' },
  { name: 'THE ACE', sub: 'MARINA · SUNSET · WILD CARD' },
];

// Smart crop: where each panel looks inside one shared photo, and how far
// it zooms in. Faces sit in the top third of a photo, so each panel takes
// a different slice of it.
export const FOCUS = [
  [0.5, 0.28],
  [0.5, 0.45],
  [0.32, 0.35],
  [0.68, 0.38],
  [0.5, 0.6],
  [0.5, 0.3],
  [0.5, 0.5],
];
export const PANEL_ZOOM = [1.35, 1.15, 1.5, 1.4, 1.25, 1.6, 1.2];

// ---------------------------------------------------------------- helpers

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgba(hex, alpha) {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// A seeded pseudo-random generator (mulberry32): the barcode bars are the
// same on every render of the same cover.
function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Shrink a font until the text fits maxWidth, starting from startSize.
// Returns the size that fits (never below 6).
function fitSize(ctx, text, family, weight, startSize, maxWidth) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 6 && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

// The CSS filter string for a grade at a given intensity (0-100) and paint
// brightness (0-100). At intensity 0 the photo is raw; at 100 the grade
// is at full strength. Saturation and contrast ease out from 1, sepia and
// hue rotation scale up from 0.
export function gradeFilter(gradeId, intensity, paint) {
  const g = GRADES[gradeId] ?? GRADES.sunset;
  const k = clamp(intensity, 0, 100) / 100;
  const sat = 1 + (g.filter.sat - 1) * k;
  const con = 1 + (g.filter.con - 1) * k;
  const hue = g.filter.hue * k;
  const sepia = g.filter.sepia * k;
  const bright = 1 + clamp(paint, 0, 100) * 0.0012;
  return (
    `saturate(${sat.toFixed(3)}) contrast(${con.toFixed(3)}) ` +
    `hue-rotate(${hue.toFixed(1)}deg) sepia(${sepia.toFixed(3)}) brightness(${bright.toFixed(3)})`
  );
}

// ---------------------------------------------------------------- geometry

// The canvas is split vertically into four zones: a top row (0-0.34), the
// title band (0.34-0.56), a bottom row (0.56-0.90) and the footer
// (0.90-1.0). Diagonal Trio moves its band to 0.40-0.60 and stretches its
// three panels the full height instead.
//
// Returns { panels, band, hero }: panels carry x, y, w, h in pixels, a
// skew (how far the top edge is shifted right, for the slanted dividers)
// and the role index they show; band is { y0, y1 }; hero is the pop-out
// square or null.
export function layoutPanels(layoutId, w, h) {
  const topY0 = 0;
  const topY1 = 0.34 * h;
  const botY0 = 0.56 * h;
  const botY1 = 0.9 * h;
  const rowH = topY1 - topY0;
  const skew = 0.14 * rowH;
  const band = { y0: 0.34 * h, y1: 0.56 * h };
  const panels = [];
  const row = (count, y, hh, roles, skewPx) => {
    for (let i = 0; i < count; i++) {
      panels.push({
        x: (i * w) / count,
        y,
        w: w / count,
        h: hh,
        skew: skewPx,
        role: roles[i],
      });
    }
  };

  let hero = null;
  switch (layoutId) {
    case 'mosaic':
      row(4, topY0, rowH, [0, 1, 2, 3], 0);
      row(3, botY0, botY1 - botY0, [4, 5, 6], 0);
      break;
    case 'trio': {
      const tallH = 0.9 * h;
      const extra = 0.12 * h;
      const base = w / 3;
      const trioSkew = extra;
      [0, 2, 4].forEach((role, i) => {
        panels.push({ x: i * base - extra, y: 0, w: base + 2 * extra, h: tallH, skew: trioSkew, role });
      });
      band.y0 = 0.4 * h;
      band.y1 = 0.6 * h;
      break;
    }
    case 'fivecrop':
      row(2, topY0, rowH, [0, 1], skew);
      row(3, botY0, botY1 - botY0, [2, 3, 4], skew);
      break;
    case 'hero':
      row(3, topY0, rowH, [0, 1, 2], skew);
      row(3, botY0, botY1 - botY0, [3, 4, 5], skew);
      hero = { x: 0.33 * w, y: 0.03 * h, w: 0.34 * w, h: 0.6 * h, panel: 1 };
      break;
    case 'four':
      row(2, topY0, rowH, [0, 1], skew);
      row(2, botY0, botY1 - botY0, [2, 3], skew);
      break;
    case 'strip':
      row(4, topY0, rowH, [0, 1, 2, 3], skew);
      row(2, botY0, botY1 - botY0, [5, 6], skew);
      break;
    case 'harbor':
    default:
      row(3, topY0, rowH, [0, 1, 2], skew);
      row(3, botY0, botY1 - botY0, [3, 4, 5], skew);
      break;
  }
  return { panels, band, hero };
}

// The parallelogram path of a panel (a plain rectangle when skew is 0).
function panelPath(ctx, p) {
  ctx.beginPath();
  ctx.moveTo(p.x + p.skew, p.y);
  ctx.lineTo(p.x + p.w + p.skew, p.y);
  ctx.lineTo(p.x + p.w, p.y + p.h);
  ctx.lineTo(p.x, p.y + p.h);
  ctx.closePath();
}

// ---------------------------------------------------------------- photo

// Paint one photo into one panel with the smart crop: the photo is scaled
// to cover the panel, multiplied by the panel zoom, anchored so the focus
// point lands in the middle of the panel, and nudged by the panel's drag
// offsets. The result is clamped so the photo never leaves the panel.
function paintPhoto(ctx, img, p, focus, zoom, ox, oy, flip) {
  const base = Math.max(p.w / img.naturalWidth, p.h / img.naturalHeight);
  const s = base * zoom;
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  let dx = p.x + p.w / 2 - focus[0] * dw + ox;
  let dy = p.y + p.h / 2 - focus[1] * dh + oy;
  if (dw <= p.w) dx = p.x + (p.w - dw) / 2;
  else dx = clamp(dx, p.x + p.w - dw, p.x);
  if (dh <= p.h) dy = p.y + (p.h - dh) / 2;
  else dy = clamp(dy, p.y + p.h - dh, p.y);
  ctx.save();
  if (flip) {
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.scale(-1, 1);
    ctx.translate(-(p.x + p.w / 2), -(p.y + p.h / 2));
  }
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// One 128x128 tile of grey noise, cached after the first build, for grain.
let noiseTile = null;
function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 256);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 28;
  }
  tctx.putImageData(data, 0, 0);
  noiseTile = tile;
  return tile;
}

// ---------------------------------------------------------------- the cover

// Paint the whole cover onto `canvas` at its own size.
// opts: {
//   photos: [Image...], title, script, tagline, quote,
//   gradeId, layoutId, intensity, paint, halftone, grain, glow (0-100),
//   extras: { tags, heat, seal },
//   panels: [{ photo, ox, oy, zoom, flip, role, sub }] — one per panel slot
// }
export function drawCover(canvas, opts) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const u = W / 1080; // unit: every size follows the canvas width
  const grade = GRADES[opts.gradeId] ?? GRADES.sunset;
  const intensity = clamp(opts.intensity ?? 85, 0, 100);
  const k = intensity / 100;
  const { panels, band, hero } = layoutPanels(opts.layoutId, W, H);
  const bandH = band.y1 - band.y0;

  // --- backdrop: deep purple, then the sky wash over the top half.
  ctx.fillStyle = PALETTE.purple;
  ctx.fillRect(0, 0, W, H);
  const sky = ctx.createLinearGradient(0, 0, W, H * 0.5);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.globalAlpha = 0.22 * (0.15 + 0.85 * k);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.5);
  ctx.globalAlpha = 1;

  // --- panels: photo, tint, slanted divider, role chip.
  const filter = gradeFilter(opts.gradeId, intensity, opts.paint ?? 50);
  panels.forEach((p, i) => {
    const slot = opts.panels?.[i] ?? {};
    const img = opts.photos?.[slot.photo ?? 0] ?? null;
    const focus = FOCUS[i % FOCUS.length];
    const zoom = (slot.zoom ?? 1) * PANEL_ZOOM[i % PANEL_ZOOM.length];
    ctx.save();
    panelPath(ctx, p);
    ctx.clip();
    if (img) {
      ctx.filter = filter;
      paintPhoto(ctx, img, p, focus, zoom, slot.ox ?? 0, slot.oy ?? 0, !!slot.flip);
      ctx.filter = 'none';
      ctx.fillStyle = grade.tint.color;
      ctx.globalAlpha = grade.tint.alpha * k;
      ctx.fillRect(p.x - p.skew - 2, p.y, p.w + 2 * p.skew + 4, p.h);
      ctx.globalAlpha = 1;
    } else {
      const empty = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
      empty.addColorStop(0, grade.sky[0]);
      empty.addColorStop(1, grade.sky[2]);
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = empty;
      ctx.fillRect(p.x - p.skew - 2, p.y, p.w + 2 * p.skew + 4, p.h);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // Slanted divider on the panel's right edge.
    ctx.strokeStyle = PALETTE.cream;
    ctx.lineWidth = 3 * u;
    ctx.beginPath();
    ctx.moveTo(p.x + p.w + p.skew, p.y);
    ctx.lineTo(p.x + p.w, p.y + p.h);
    ctx.stroke();
    // Role chip, bottom-left of the panel.
    if (opts.extras?.tags !== false) {
      const role = ROLES[slot.role ?? p.role];
      const name = slot.roleName ?? role.name;
      const sub = slot.sub ?? role.sub;
      const nameSize = fitSize(ctx, name, 'Anton', '', 26 * u, p.w * 0.62);
      ctx.font = `${nameSize}px Anton`;
      const subSize = Math.max(6, nameSize * 0.42);
      ctx.font = `${subSize}px Anton`;
      const subW = ctx.measureText(sub).width;
      ctx.font = `${nameSize}px Anton`;
      const nameW = ctx.measureText(name).width;
      const pad = 10 * u;
      const chipW = Math.max(nameW, subW) + pad * 2 + 4 * u;
      const chipH = nameSize + subSize + pad * 1.6;
      const cx = p.x + 10 * u;
      const cy = p.y + p.h - chipH - 10 * u;
      ctx.fillStyle = rgba(PALETTE.ink, 0.88);
      ctx.fillRect(cx, cy, chipW, chipH);
      ctx.fillStyle = PALETTE.sand;
      ctx.fillRect(cx, cy, 4 * u, chipH);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = PALETTE.cream;
      ctx.font = `${nameSize}px Anton`;
      ctx.fillText(name, cx + pad + 4 * u, cy + pad + nameSize * 0.85);
      ctx.fillStyle = 'rgba(255,243,214,0.92)';
      ctx.font = `${subSize}px Anton`;
      ctx.fillText(sub, cx + pad + 4 * u, cy + pad + nameSize * 0.85 + subSize * 1.25);
    }
  });

  // --- hero pop-out: the middle panel's photo breaking through the band.
  if (hero) {
    const slot = opts.panels?.[hero.panel] ?? {};
    const img = opts.photos?.[slot.photo ?? 0] ?? null;
    ctx.save();
    ctx.beginPath();
    ctx.rect(hero.x, hero.y, hero.w, hero.h);
    ctx.clip();
    if (img) {
      ctx.filter = filter;
      paintPhoto(ctx, img, hero, FOCUS[1], (slot.zoom ?? 1) * PANEL_ZOOM[1], slot.ox ?? 0, slot.oy ?? 0, !!slot.flip);
      ctx.filter = 'none';
      ctx.fillStyle = grade.tint.color;
      ctx.globalAlpha = grade.tint.alpha * k;
      ctx.fillRect(hero.x, hero.y, hero.w, hero.h);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.strokeStyle = PALETTE.sand;
    ctx.lineWidth = 4 * u;
    ctx.strokeRect(hero.x, hero.y, hero.w, hero.h);
  }

  // --- title band: solid purple, sand rules, glow, chrome title.
  ctx.fillStyle = PALETTE.purple;
  ctx.fillRect(0, band.y0, W, bandH);
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(0, band.y0, W, 3 * u);
  ctx.fillRect(0, band.y1 - 3 * u, W, 3 * u);
  const glow = clamp(opts.glow ?? 40, 0, 100);
  if (glow > 0) {
    const radial = ctx.createRadialGradient(W / 2, (band.y0 + band.y1) / 2, 0, W / 2, (band.y0 + band.y1) / 2, W * 0.55);
    radial.addColorStop(0, rgba(PALETTE.pink, 0.25 * (glow / 100)));
    radial.addColorStop(1, rgba(PALETTE.pink, 0));
    ctx.fillStyle = radial;
    ctx.fillRect(0, band.y0, W, bandH);
  }

  // Chrome title on its own layer, so the retro lines can be clipped
  // inside the letters.
  const titleText = (opts.title || 'BAY OF LIGHT').toUpperCase();
  const titleLayer = document.createElement('canvas');
  titleLayer.width = W;
  titleLayer.height = Math.max(2, Math.ceil(bandH));
  const tctx = titleLayer.getContext('2d');
  const titleSize = fitSize(tctx, titleText, 'Anton', '', 0.52 * bandH, W * 0.92);
  const grad = tctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, grade.chrome[0]);
  grad.addColorStop(0.5, grade.chrome[1]);
  grad.addColorStop(1, grade.chrome[2]);
  tctx.textAlign = 'center';
  tctx.textBaseline = 'middle';
  tctx.font = `${titleSize}px Anton`;
  const titleY = bandH * 0.42;
  tctx.lineJoin = 'round';
  tctx.strokeStyle = PALETTE.ink;
  tctx.lineWidth = 8 * u;
  tctx.strokeText(titleText, W / 2, titleY);
  tctx.strokeStyle = '#FFFFFF';
  tctx.lineWidth = 2 * u;
  tctx.strokeText(titleText, W / 2, titleY);
  tctx.fillStyle = grad;
  tctx.fillText(titleText, W / 2, titleY);
  tctx.globalCompositeOperation = 'source-atop';
  tctx.fillStyle = 'rgba(255,255,255,0.18)';
  const lineGap = Math.max(6, titleSize * 0.22);
  for (let y = titleY - titleSize * 0.5; y < titleY + titleSize * 0.5; y += lineGap) {
    tctx.fillRect(0, y, W, Math.max(1, lineGap * 0.28));
  }
  tctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(titleLayer, 0, band.y0);

  // Script subtitle, pink Pacifico with a thin white outline.
  const scriptText = opts.script || 'one last summer';
  const scriptSize = fitSize(ctx, scriptText, 'Pacifico', '', 0.2 * bandH, W * 0.7);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${scriptSize}px Pacifico`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5 * u;
  ctx.strokeText(scriptText, W / 2, band.y0 + bandH * 0.78);
  ctx.fillStyle = PALETTE.pink;
  ctx.fillText(scriptText, W / 2, band.y0 + bandH * 0.78);

  // Tagline, sand Anton across the foot of the band.
  const tagText = (opts.tagline || 'SIX LIVES · ONE BAY · NO WAY BACK').toUpperCase();
  const tagSize = fitSize(ctx, tagText, 'Anton', '', 0.11 * bandH, W * 0.86);
  ctx.font = `${tagSize}px Anton`;
  ctx.fillStyle = PALETTE.sand;
  ctx.fillText(tagText, W / 2, band.y0 + bandH * 0.95);

  // Location chip + HEAT, bottom-left inside the band.
  if (opts.extras?.heat !== false) {
    const chipText = 'DERMAGA 7 · 7:15 PM';
    const chipSize = Math.max(7, 13 * u);
    ctx.textAlign = 'left';
    ctx.font = `${chipSize}px Anton`;
    const chipW = ctx.measureText(chipText).width + 16 * u;
    const chipH = chipSize * 1.9;
    const chipX = 0.025 * W;
    const chipY = band.y0 + bandH * 0.60;
    ctx.fillStyle = rgba(PALETTE.ink, 0.88);
    ctx.fillRect(chipX, chipY, chipW, chipH);
    ctx.fillStyle = PALETTE.sand;
    ctx.fillText(chipText, chipX + 8 * u, chipY + chipH * 0.68);
    ctx.font = `${chipSize}px Anton`;
    ctx.fillStyle = PALETTE.sand;
    ctx.fillText('HEAT ★★★★☆', chipX, chipY + chipH + chipSize * 1.5);
  }

  // --- VOL badge, top-right: a tilted sand circle with an ink ring.
  const badgeR = 0.042 * W;
  const badgeX = W - badgeR - 0.025 * W;
  const badgeY = badgeR + 0.025 * H;
  ctx.save();
  ctx.translate(badgeX, badgeY);
  ctx.rotate(-0.14);
  ctx.fillStyle = PALETTE.sand;
  ctx.beginPath();
  ctx.arc(0, 0, badgeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.5 * u;
  ctx.beginPath();
  ctx.arc(0, 0, badgeR - 3 * u, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.max(7, 11 * u)}px Anton`;
  ctx.fillText('VOL.', 0, -badgeR * 0.28);
  ctx.font = `${Math.max(9, 17 * u)}px Anton`;
  ctx.fillText('01', 0, badgeR * 0.3);
  ctx.restore();

  // --- footer: ink, sand rule, quote, billing, seal, barcode.
  const footY0 = 0.9 * H;
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(0, footY0, W, H - footY0);
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(0, footY0, W, 2 * u);

  const quoteText = `★★★★★  "${opts.quote || 'PURE GOLDEN-HOUR MAYHEM'}"  — THE CAHAYA GAZETTE`;
  const quoteSize = fitSize(ctx, quoteText, 'Anton', '', 0.024 * H, W * 0.62);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${quoteSize}px Anton`;
  ctx.fillStyle = PALETTE.sand;
  ctx.fillText(quoteText, W * 0.31, footY0 + (H - footY0) * 0.32);

  const billText = 'A BAY OF LIGHT PICTURE · STARRING YOU · SHOT ON YOUR OWN CAMERA · GRADED BY HAND';
  const billSize = fitSize(ctx, billText, 'Anton', '', 0.015 * H, W * 0.62);
  ctx.font = `${billSize}px Anton`;
  ctx.fillStyle = 'rgba(255,243,214,0.85)';
  ctx.fillText(billText, W * 0.31, footY0 + (H - footY0) * 0.72);

  // Gold seal between the billing text and the barcode.
  if (opts.extras?.seal !== false) {
    const sealR = (H - footY0) * 0.38;
    const sealX = W * 0.7;
    const sealY = footY0 + (H - footY0) * 0.5;
    ctx.save();
    ctx.translate(sealX, sealY);
    ctx.fillStyle = PALETTE.sand;
    ctx.beginPath();
    ctx.arc(0, 0, sealR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2 * u;
    ctx.beginPath();
    ctx.arc(0, 0, sealR - 2.5 * u, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = 'center';
    ctx.font = `${Math.max(6, sealR * 0.32)}px Anton`;
    ctx.fillText('ORIGINAL', 0, -sealR * 0.22);
    ctx.fillText('COVER ART', 0, sealR * 0.18);
    ctx.font = `${Math.max(6, sealR * 0.4)}px Anton`;
    ctx.fillText('★', 0, sealR * 0.58);
    ctx.restore();
  }

  // Barcode (bars from seed 626) + catalogue number, far right.
  const barX0 = W * 0.82;
  const barX1 = W * 0.97;
  const barY0 = footY0 + (H - footY0) * 0.16;
  const barY1 = footY0 + (H - footY0) * 0.68;
  const rnd = seededRandom(626);
  ctx.fillStyle = PALETTE.cream;
  let bx = barX0;
  while (bx < barX1) {
    const bw = (1 + Math.floor(rnd() * 4)) * u;
    if (rnd() > 0.45) ctx.fillRect(bx, barY0, bw, barY1 - barY0);
    bx += bw + (1 + Math.floor(rnd() * 3)) * u;
  }
  ctx.textAlign = 'center';
  ctx.font = `${Math.max(7, 12 * u)}px Anton`;
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText('TC-0626', (barX0 + barX1) / 2, footY0 + (H - footY0) * 0.9);

  // COMING SOON pill, top-left, overlapping the first panel.
  const pillText = 'COMING SOON';
  const pillSize = Math.max(8, 15 * u);
  ctx.font = `${pillSize}px Anton`;
  const pillW = ctx.measureText(pillText).width + 22 * u;
  const pillH = pillSize * 2;
  const pillX = 0.02 * W;
  const pillY = footY0 - pillH * 0.55;
  ctx.fillStyle = PALETTE.pink;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText(pillText, pillX + pillW / 2, pillY + pillH * 0.68);

  // --- halftone dots over the panels, then grain over everything.
  const baseDots = opts.gradeId === 'halftone' ? 1.6 : opts.gradeId === 'shore' ? 0.7 : 0;
  const dots = Math.min(1.8, baseDots * (0.15 + 0.85 * k) + clamp(opts.halftone ?? 0, 0, 100) / 100);
  if (dots > 0.02) {
    const gap = Math.max(6, W / 160);
    const radius = gap * 0.22 * dots + 0.8;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, band.y0);
    ctx.rect(0, band.y1, W, footY0 - band.y1);
    ctx.clip();
    ctx.fillStyle = PALETTE.ink;
    ctx.globalAlpha = 0.22 * dots;
    let rowIdx = 0;
    for (let y = gap / 2; y < footY0; y += gap, rowIdx++) {
      const off = rowIdx % 2 === 0 ? 0 : gap / 2;
      for (let x = gap / 2 + off; x < W; x += gap) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  const grainAmt = clamp(opts.grain ?? 25, 0, 100) / 100;
  if (grainAmt > 0) {
    const tile = getNoiseTile();
    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalAlpha = grainAmt * 0.9;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
