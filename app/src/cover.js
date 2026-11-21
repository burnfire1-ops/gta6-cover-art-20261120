// Bay of Light Cover Studio — the cover renderer.
//
// Everything the poster shows is drawn here, on one 2D canvas, from a plain
// configuration object and the loaded photos. No network, no libraries: just
// canvas paths, gradients and text. Sizes follow one unit, u = canvas width
// divided by 1080, so the same drawing works at any export size.
//
// Configuration shape (see main.js for the live state that feeds it):
//   theme, layout, grade, paint, gradeAmt, halftone, grain, glow,
//   title, script, tagline, quote,
//   extras: { tags, heat, seal },
//   panels: [{ img, fx, fy, zoom, flip, ox, oy, role, sub }]

// ---- Palette: nine named colours -------------------------------------------

export const PALETTE = {
  seaTeal: '#00D0B8',
  neonPink: '#FF1F8A',
  sand: '#F2C95E',
  sunset: '#FF7A1A',
  deepPurple: '#1A0B2E',
  palm: '#2E7D5B',
  cream: '#FFF3D6',
  ink: '#12081F',
  neonCyan: '#17DDD6',
  amber: '#B45309',
};

// ---- Grades: six colour grades for the photos ------------------------------
// Each grade carries a photo filter (saturation, contrast, sepia, hue turn),
// three sky colours for the background wash, a tint laid over the photos,
// and three chrome colours for the title lettering.

export const GRADES = [
  {
    name: 'Teluk Sunset',
    filter: { sat: 1.6, con: 1.22, sepia: 0, hue: 0 },
    sky: ['#00D0B8', '#FF1F8A', '#FF7A1A'],
    tint: { color: '#FF7A1A', alpha: 0.2 },
    chrome: ['#F2C95E', '#FF7A1A', '#FF1F8A'],
  },
  {
    name: 'Neon Shore',
    filter: { sat: 1.85, con: 1.45, sepia: 0, hue: -8 },
    sky: ['#1A0B2E', '#FF1F8A', '#FF7A1A'],
    tint: { color: '#FF1F8A', alpha: 0.22 },
    chrome: ['#17DDD6', '#FF1F8A', '#F2C95E'],
    halftoneBase: 0.7,
  },
  {
    name: 'Neon Night',
    filter: { sat: 1.7, con: 1.3, sepia: 0, hue: -20 },
    sky: ['#1A0B2E', '#17DDD6', '#FF1F8A'],
    tint: { color: '#17DDD6', alpha: 0.2 },
    chrome: ['#17DDD6', '#FF1F8A', '#F2C95E'],
  },
  {
    name: 'Golden Hour',
    filter: { sat: 1.5, con: 1.12, sepia: 0.5, hue: 0 },
    sky: ['#F2C95E', '#FF7A1A', '#B45309'],
    tint: { color: '#F2C95E', alpha: 0.2 },
    chrome: ['#FFF3D6', '#F2C95E', '#FF7A1A'],
  },
  {
    name: 'Tropic Teal',
    filter: { sat: 1.35, con: 1.05, sepia: 0, hue: 8 },
    sky: ['#00D0B8', '#2E7D5B', '#FFF3D6'],
    tint: { color: '#00D0B8', alpha: 0.12 },
    chrome: ['#FFF3D6', '#00D0B8', '#2E7D5B'],
  },
  {
    name: 'Comic Halftone',
    filter: { sat: 1.9, con: 1.6, sepia: 0, hue: 0 },
    sky: ['#FFF3D6', '#FF1F8A', '#00D0B8'],
    tint: { color: '#FF1F8A', alpha: 0.14 },
    chrome: ['#F2C95E', '#FF7A1A', '#FF1F8A'],
    halftoneBase: 1.6,
  },
];

// ---- Themes: three moods, each one a grade ---------------------------------

export const THEMES = [
  {
    id: 'sunset',
    name: 'Teluk Sunset',
    grade: 0,
    mood: 'Teal sea, then pink, then orange — the bay at dusk.',
    swatch: ['#00D0B8', '#FF1F8A', '#FF7A1A'],
  },
  {
    id: 'neon',
    name: 'Neon Night',
    grade: 2,
    mood: 'Deep purple and cyan neon — the bay after midnight.',
    swatch: ['#1A0B2E', '#17DDD6', '#FF1F8A'],
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    grade: 3,
    mood: 'Sand and vintage amber gold — the bay in old sunlight.',
    swatch: ['#F2C95E', '#FF7A1A', '#B45309'],
  },
];

// ---- Layouts: seven ways to split the canvas -------------------------------

export const LAYOUTS = [
  { id: 'harbor', name: 'Harbor Six' },
  { id: 'mosaic', name: 'Seven Mosaic' },
  { id: 'trio', name: 'Diagonal Trio' },
  { id: 'fivecrop', name: 'One-Photo Five-Crop' },
  { id: 'hero', name: 'Hero Pop-Out' },
  { id: 'bayfront', name: 'Bayfront Four' },
  { id: 'strip', name: 'Sunset Strip' },
];

// ---- Roles and their sub-lines ---------------------------------------------

export const ROLES = [
  { name: 'THE DRIVER', sub: 'DERMAGA 7 · 6:42 PM · LOOKING FOR TROUBLE' },
  { name: 'THE BOSS', sub: 'PIER 9 · 7:15 PM · NO WAY BACK' },
  { name: 'THE ANGLER', sub: 'BOULEVARD · 5:30 PM · ONE LAST CAST' },
  { name: 'THE LOOKOUT', sub: 'ROOFTOP · 11 PM · EYES ON THE BAY' },
  { name: 'THE COURIER', sub: 'OLD TOWN · 8:05 PM · PACKAGE DUE' },
  { name: 'THE FIXER', sub: 'BACK ALLEY · MIDNIGHT · FIXES EVERYTHING' },
  { name: 'THE ACE', sub: 'MARINA · SUNSET · WILD CARD' },
];

// Smart-crop defaults, one focus point and zoom per panel index. Faces sit
// in the top third of the cast photos, so each panel takes a different slice.
// Panel 4 (THE COURIER) uses a focus height of 0.32: the cast photo of the
// courier has her face around a quarter down the frame, and 0.32 keeps her
// eyes, nose, forehead and chin inside the panel on every export size.
const FOCUS = [
  { x: 0.5, y: 0.28 },
  { x: 0.5, y: 0.45 },
  { x: 0.32, y: 0.35 },
  { x: 0.68, y: 0.38 },
  { x: 0.5, y: 0.32 },
  { x: 0.5, y: 0.3 },
  { x: 0.5, y: 0.5 },
];
const ZOOM = [1.35, 1.15, 1.5, 1.4, 1.25, 1.6, 1.2];

// ---- Small helpers ---------------------------------------------------------

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgba(hex, alpha) {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Shrink a font until the text fits maxWidth, starting from startSize.
function fitSize(ctx, text, family, weight, startSize, maxWidth) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 8 && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

// The grade filter at a given intensity: 0 is the raw photo, 100 is full.
function gradeFilter(grade, intensity, paint) {
  const t = clamp(intensity, 0, 100) / 100;
  const f = grade.filter;
  const sat = 1 + (f.sat - 1) * t;
  const con = 1 + (f.con - 1) * t;
  const sepia = f.sepia * t;
  const hue = f.hue * t;
  const bright = 1 + paint * 0.0012;
  const parts = [`saturate(${sat.toFixed(3)})`, `contrast(${con.toFixed(3)})`];
  if (sepia > 0.001) parts.push(`sepia(${sepia.toFixed(3)})`);
  if (Math.abs(hue) > 0.01) parts.push(`hue-rotate(${hue.toFixed(1)}deg)`);
  parts.push(`brightness(${bright.toFixed(3)})`);
  return parts.join(' ');
}

// ---- Panel geometry --------------------------------------------------------
// The canvas is split vertically into four bands: top row 0–0.34, title band
// 0.34–0.56, bottom row 0.56–0.90, footer 0.90–1.0. The title band is its own
// zone and never covers a face. Each panel is { x, y, w, h, skew, role }.
// skew slants the panel's top edge right by skew * panel height.

function rowPanels(y0, y1, count, roles, slant) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: (i / count),
      y: y0,
      w: 1 / count,
      h: y1 - y0,
      skew: slant,
      role: roles[i],
    });
  }
  return out;
}

export function layoutPanels(layoutId, W, H) {
  const slant = 0.14;
  switch (layoutId) {
    case 'mosaic':
      return [
        ...rowPanels(0, 0.34, 4, [0, 1, 2, 3], 0),
        ...rowPanels(0.56, 0.9, 3, [4, 5, 6], 0),
      ];
    case 'trio': {
      // Three tall panels, each widened by 0.12 * height on both sides so
      // they lean over each other; the title band sits lower, 0.40–0.60.
      const extra = (0.12 * H) / W;
      const panels = [];
      for (let i = 0; i < 3; i++) {
        panels.push({
          x: i / 3 - extra,
          y: 0,
          w: 1 / 3 + 2 * extra,
          h: 0.9,
          skew: extra / 0.9,
          role: [0, 2, 4][i],
        });
      }
      return panels;
    }
    case 'fivecrop':
      return [
        ...rowPanels(0, 0.34, 2, [0, 1], slant),
        ...rowPanels(0.56, 0.9, 3, [2, 3, 4], slant),
      ];
    case 'hero':
      return [
        ...rowPanels(0, 0.34, 3, [0, 1, 2], slant),
        ...rowPanels(0.56, 0.9, 3, [3, 4, 5], slant),
      ];
    case 'bayfront':
      return [
        ...rowPanels(0, 0.34, 2, [0, 1], slant),
        ...rowPanels(0.56, 0.9, 2, [2, 3], slant),
      ];
    case 'strip':
      return [
        ...rowPanels(0, 0.34, 4, [0, 1, 2, 3], slant),
        ...rowPanels(0.56, 0.9, 2, [5, 6], slant),
      ];
    case 'harbor':
    default:
      return [
        ...rowPanels(0, 0.34, 3, [0, 1, 2], slant),
        ...rowPanels(0.56, 0.9, 3, [3, 4, 5], slant),
      ];
  }
}

function titleBand(layoutId) {
  return layoutId === 'trio' ? { y0: 0.4, y1: 0.6 } : { y0: 0.34, y1: 0.56 };
}

function panelPath(ctx, p, W, H) {
  const x = p.x * W;
  const y = p.y * H;
  const w = p.w * W;
  const h = p.h * H;
  const shift = p.skew * h;
  ctx.beginPath();
  ctx.moveTo(x + shift, y);
  ctx.lineTo(x + w + shift, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}

// ---- Photo drawing ---------------------------------------------------------

function drawPhotoInPanel(ctx, img, p, W, H, panelCfg, filter, grade, intensity) {
  const x = p.x * W;
  const y = p.y * H;
  const w = p.w * W;
  const h = p.h * H;
  ctx.save();
  panelPath(ctx, p, W, H);
  ctx.clip();
  ctx.filter = filter;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const zoom = panelCfg.zoom;
  const base = Math.max(w / iw, h / ih);
  const dw = iw * base * zoom;
  const dh = ih * base * zoom;
  // Anchor the focus point at the panel centre, then apply the drag offset.
  let dx = x + w / 2 - panelCfg.fx * dw + (panelCfg.ox || 0) * w;
  let dy = y + h / 2 - panelCfg.fy * dh + (panelCfg.oy || 0) * h;
  // Clamp so the photo always covers the panel.
  dx = clamp(dx, x + w - dw, x);
  dy = clamp(dy, y + h - dh, y);
  if (panelCfg.flip) {
    ctx.translate(x + w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(x + w / 2), 0);
  }
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  // Grade tint over the photo only.
  const t = clamp(intensity, 0, 100) / 100;
  if (grade.tint.alpha * t > 0.001) {
    ctx.fillStyle = rgba(grade.tint.color, grade.tint.alpha * t);
    ctx.fillRect(x - 10, y - 10, w + 20, h + 20);
  }
  ctx.restore();
  // Cream separator along the panel's right edge.
  ctx.save();
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 3 * (W / 1080);
  ctx.beginPath();
  ctx.moveTo(x + w + p.skew * h, y);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();
  ctx.restore();
}

// ---- Barcode: dense bars from a small LCG ----------------------------------

function drawBarcode(ctx, x, y, w, h) {
  let seed = 626;
  let cx = x;
  ctx.fillStyle = PALETTE.cream;
  while (cx < x + w) {
    seed = (seed * 16807) % 2147483647;
    const barW = 1 + (seed % 4);
    ctx.fillRect(cx, y, barW, h);
    cx += barW + 1 + (seed % 3);
  }
}

// ---- Grain tile (built once) ------------------------------------------------

let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
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
  grainTile = tile;
  return tile;
}

// ---- The cover ---------------------------------------------------------------

export function drawCover(canvas, cfg, photos) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const u = W / 1080;
  const grade = GRADES[cfg.grade];
  const intensity = cfg.gradeAmt;
  const t = clamp(intensity, 0, 100) / 100;
  const portrait = H > W;
  const filter = gradeFilter(grade, intensity, cfg.paint);

  // Background: deep purple, then a diagonal sky wash over the top half.
  ctx.fillStyle = PALETTE.deepPurple;
  ctx.fillRect(0, 0, W, H);
  const sky = ctx.createLinearGradient(0, 0, W, H * 0.5);
  sky.addColorStop(0, rgba(grade.sky[0], 0.22 * (0.15 + 0.85 * t)));
  sky.addColorStop(0.5, rgba(grade.sky[1], 0.22 * (0.15 + 0.85 * t)));
  sky.addColorStop(1, rgba(grade.sky[2], 0.22 * (0.15 + 0.85 * t)));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.5);

  // Panels.
  const panels = layoutPanels(cfg.layout, W, H);
  const panelCfgs = panels.map((p, i) => {
    const over = (cfg.panels && cfg.panels[i]) || {};
    const focus = FOCUS[i] || { x: 0.5, y: 0.5 };
    // In portrait the ANGLER panel (index 2) shows its face lower in the
    // frame, so its focus height drops to 0.25: the face then sits well
    // below the VOL badge in the top-right corner instead of under it.
    let fy = over.fy ?? focus.y;
    if (portrait && i === 2 && over.fy === undefined) fy = 0.25;
    // In landscape the same panel's face sits high and close to the badge:
    // the badge's rim touches the ANGLER's outer eye. A lower focus and a
    // slightly wider crop drop the face below the badge and pull it left,
    // so both eyes stay clear of the badge in landscape too.
    let zoom = over.zoom ?? ZOOM[i] ?? 1.3;
    if (!portrait && i === 2 && over.fy === undefined) fy = 0.28;
    if (!portrait && i === 2 && over.zoom === undefined) zoom = 1.2;
    return {
      img: over.img ?? i % 3,
      fx: over.fx ?? focus.x,
      fy,
      zoom: over.zoom ?? zoom,
      flip: over.flip ?? false,
      ox: over.ox ?? 0,
      oy: over.oy ?? 0,
      role: over.role ?? ROLES[p.role].name,
      sub: over.sub ?? ROLES[p.role].sub,
    };
  });
  panels.forEach((p, i) => {
    const pc = panelCfgs[i];
    const img = photos[pc.img];
    if (img) drawPhotoInPanel(ctx, img, p, W, H, pc, filter, grade, intensity);
  });

  // Halftone dots over the panels.
  const baseDots = grade.halftoneBase || 0;
  const dotAmount = Math.min(1.8, baseDots * t + cfg.halftone / 100);
  if (dotAmount > 0.01) {
    const gap = Math.max(6, W / 160);
    const radius = gap * 0.22 * dotAmount + 0.8;
    ctx.save();
    ctx.fillStyle = rgba(PALETTE.ink, 0.22 * dotAmount);
    panels.forEach((p) => {
      ctx.save();
      panelPath(ctx, p, W, H);
      ctx.clip();
      const x0 = p.x * W;
      const y0 = p.y * H;
      const x1 = (p.x + p.w) * W + gap;
      const y1 = (p.y + p.h) * H + gap;
      let row = 0;
      for (let yy = y0; yy < y1; yy += gap, row++) {
        for (let xx = x0 + (row % 2 ? gap / 2 : 0); xx < x1; xx += gap) {
          ctx.beginPath();
          ctx.arc(xx, yy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    });
    ctx.restore();
  }

  // Hero pop-out, drawn over the panels and across the title band.
  if (cfg.layout === 'hero') {
    const hx = 0.33 * W;
    const hy = 0.03 * H;
    const hw = 0.34 * W;
    const hh = 0.6 * H;
    const heroImg = photos[panelCfgs[1] ? panelCfgs[1].img : 1];
    ctx.save();
    ctx.beginPath();
    ctx.rect(hx, hy, hw, hh);
    ctx.clip();
    if (heroImg) {
      ctx.filter = filter;
      const iw = heroImg.naturalWidth;
      const ih = heroImg.naturalHeight;
      const base = Math.max(hw / iw, hh / ih);
      ctx.drawImage(heroImg, hx + hw / 2 - (iw * base) / 2, hy + hh / 2 - (ih * base) / 2, iw * base, ih * base);
      ctx.filter = 'none';
      if (grade.tint.alpha * t > 0.001) {
        ctx.fillStyle = rgba(grade.tint.color, grade.tint.alpha * t);
        ctx.fillRect(hx, hy, hw, hh);
      }
    }
    ctx.restore();
    ctx.strokeStyle = PALETTE.sand;
    ctx.lineWidth = 4 * u;
    ctx.strokeRect(hx, hy, hw, hh);
  }

  // Title band: solid purple, sand rules top and bottom, optional glow.
  const band = titleBand(cfg.layout);
  const bandY = band.y0 * H;
  const bandH = (band.y1 - band.y0) * H;
  ctx.fillStyle = PALETTE.deepPurple;
  ctx.fillRect(0, bandY, W, bandH);
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(0, bandY, W, 3 * u);
  ctx.fillRect(0, bandY + bandH - 3 * u, W, 3 * u);
  if (cfg.glow > 0) {
    const glow = ctx.createRadialGradient(W / 2, bandY + bandH / 2, 0, W / 2, bandY + bandH / 2, W * 0.45);
    glow.addColorStop(0, rgba(PALETTE.neonPink, 0.25 * (cfg.glow / 100)));
    glow.addColorStop(1, rgba(PALETTE.neonPink, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, bandY, W, bandH);
  }

  // Big chrome title, drawn on its own layer so the retro lines stay
  // inside the letterforms.
  const titleText = (cfg.title || 'BAY OF LIGHT').toUpperCase();
  const titleLayer = document.createElement('canvas');
  titleLayer.width = W;
  titleLayer.height = Math.ceil(bandH);
  const tctx = titleLayer.getContext('2d');
  const titleSize = fitSize(tctx, titleText, 'Anton, sans-serif', 400, bandH * 0.52, W * 0.92);
  const chrome = tctx.createLinearGradient(0, 0, W, 0);
  chrome.addColorStop(0, grade.chrome[0]);
  chrome.addColorStop(0.5, grade.chrome[1]);
  chrome.addColorStop(1, grade.chrome[2]);
  tctx.font = `400 ${titleSize}px Anton, sans-serif`;
  tctx.textAlign = 'center';
  tctx.textBaseline = 'middle';
  const titleY = bandH * 0.42;
  tctx.lineJoin = 'round';
  tctx.strokeStyle = PALETTE.ink;
  tctx.lineWidth = 8 * u;
  tctx.strokeText(titleText, W / 2, titleY);
  tctx.strokeStyle = '#FFFFFF';
  tctx.lineWidth = 2 * u;
  tctx.strokeText(titleText, W / 2, titleY);
  tctx.fillStyle = chrome;
  tctx.fillText(titleText, W / 2, titleY);
  // Retro chrome lines, clipped to the painted letters.
  tctx.globalCompositeOperation = 'source-atop';
  tctx.fillStyle = 'rgba(255,255,255,0.18)';
  const top = titleY - titleSize * 0.42;
  const bottom = titleY + titleSize * 0.42;
  for (let ly = top + 4; ly < bottom; ly += Math.max(7, titleSize * 0.14)) {
    tctx.fillRect(0, ly, W, Math.max(2, titleSize * 0.03));
  }
  tctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(titleLayer, 0, bandY);

  // Script subtitle, pink with a thin white outline.
  const scriptText = cfg.script || 'one last summer';
  const scriptSize = fitSize(ctx, scriptText, 'Pacifico, cursive', 400, bandH * 0.2, W * 0.7);
  ctx.font = `400 ${scriptSize}px Pacifico, cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5 * u;
  ctx.strokeText(scriptText, W / 2, bandY + bandH * 0.78);
  ctx.fillStyle = PALETTE.neonPink;
  ctx.fillText(scriptText, W / 2, bandY + bandH * 0.78);

  // Tagline, sand capitals along the foot of the band.
  const tagText = (cfg.tagline || 'SIX LIVES · ONE BAY · NO WAY BACK').toUpperCase();
  const tagSize = fitSize(ctx, tagText, 'Anton, sans-serif', 400, bandH * 0.1, W * 0.86);
  ctx.font = `400 ${tagSize}px Anton, sans-serif`;
  ctx.fillStyle = PALETTE.sand;
  ctx.fillText(tagText, W / 2, bandY + bandH * 0.93);

  // Location + HEAT chip, bottom-left inside the band (solid band, so it
  // never covers a face).
  if (cfg.extras && cfg.extras.heat !== false) {
    const chipX = 0.02 * W;
    const chipY = bandY + bandH * 0.62;
    ctx.font = `400 ${Math.max(10, 13 * u)}px Anton, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const locText = 'DERMAGA 7 · 7:15 PM';
    const locW = ctx.measureText(locText).width;
    ctx.fillStyle = rgba(PALETTE.ink, 0.88);
    ctx.fillRect(chipX, chipY - 11 * u, locW + 16 * u, 22 * u);
    ctx.fillStyle = PALETTE.sand;
    ctx.fillText(locText, chipX + 8 * u, chipY);
    ctx.font = `400 ${Math.max(10, 12 * u)}px Anton, sans-serif`;
    ctx.fillText('HEAT ★★★★☆', chipX + 2 * u, chipY + 24 * u);
    ctx.textAlign = 'center';
  }

  // Role nameplates, bottom-left of each panel.
  if (cfg.extras && cfg.extras.tags !== false) {
    panels.forEach((p, i) => {
      const pc = panelCfgs[i];
      const x = p.x * W + 10 * u;
      const y = (p.y + p.h) * H - 12 * u;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      const nameSize = Math.max(11, 17 * u);
      ctx.font = `400 ${nameSize}px Anton, sans-serif`;
      const nameW = ctx.measureText(pc.role).width;
      const subSize = Math.max(8, 10 * u);
      ctx.font = `400 ${subSize}px Anton, sans-serif`;
      const subW = ctx.measureText(pc.sub).width;
      const chipW = Math.max(nameW, subW) + 18 * u;
      const chipH = nameSize + subSize + 16 * u;
      ctx.fillStyle = rgba(PALETTE.ink, 0.88);
      ctx.fillRect(x, y - chipH, chipW, chipH);
      ctx.fillStyle = PALETTE.sand;
      ctx.fillRect(x, y - chipH, 4 * u, chipH);
      ctx.fillStyle = PALETTE.cream;
      ctx.font = `400 ${nameSize}px Anton, sans-serif`;
      ctx.fillText(pc.role, x + 10 * u, y - subSize - 8 * u);
      ctx.fillStyle = rgba(PALETTE.cream, 0.92);
      ctx.font = `400 ${subSize}px Anton, sans-serif`;
      ctx.fillText(pc.sub, x + 10 * u, y - 6 * u);
      ctx.textAlign = 'center';
    });
  }

  // COMING SOON pill, top-left over the first panel, measured from the top
  // of the canvas — never from the footer.
  const pillText = 'COMING SOON';
  const pillSize = Math.max(11, 15 * u);
  ctx.font = `400 ${pillSize}px Anton, sans-serif`;
  const pillW = ctx.measureText(pillText).width + 28 * u;
  const pillH = pillSize + 14 * u;
  const pillX = 0.02 * W;
  const pillY = 0.02 * H;
  ctx.save();
  ctx.fillStyle = PALETTE.neonPink;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pillText, pillX + pillW / 2, pillY + pillH / 2 + 1 * u);
  ctx.restore();

  // VOL badge, top-right. In portrait it is smaller and tucked tight into
  // the corner, and the ANGLER panel's focus drops (see above), so the
  // badge never sits on a face; in landscape it keeps its usual spot.
  const badgeR = portrait ? 26 * u : 34 * u;
  const badgeX = portrait ? W - badgeR - 6 * u : W - badgeR - 8 * u;
  const badgeY = portrait ? badgeR + 6 * u : badgeR + 8 * u;
  ctx.save();
  ctx.translate(badgeX, badgeY);
  ctx.rotate(-0.12);
  ctx.fillStyle = PALETTE.sand;
  ctx.beginPath();
  ctx.arc(0, 0, badgeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3 * u;
  ctx.beginPath();
  ctx.arc(0, 0, badgeR - 4 * u, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `400 ${Math.max(9, 12 * u)}px Anton, sans-serif`;
  ctx.fillText('VOL.', 0, -badgeR * 0.28);
  ctx.font = `400 ${Math.max(13, 20 * u)}px Anton, sans-serif`;
  ctx.fillText('01', 0, badgeR * 0.32);
  ctx.restore();

  // Footer: ink background, sand rule on top.
  const footY = 0.9 * H;
  const footH = 0.1 * H;
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(0, footY, W, footH);
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(0, footY, W, 2 * u);

  // Quote line, then the billing line, both capped at 62% width.
  const quoteText = `★★★★★  "${cfg.quote || 'PURE GOLDEN-HOUR MAYHEM'}"  — THE CAHAYA GAZETTE`;
  const quoteSize = fitSize(ctx, quoteText, 'Anton, sans-serif', 400, footH * 0.3, W * 0.62);
  ctx.font = `400 ${quoteSize}px Anton, sans-serif`;
  ctx.fillStyle = PALETTE.sand;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(quoteText, 0.03 * W, footY + footH * 0.3);
  const billText = 'A BAY OF LIGHT PICTURE · STARRING YOU · SHOT ON YOUR OWN CAMERA · GRADED BY HAND';
  const billSize = fitSize(ctx, billText, 'Anton, sans-serif', 400, footH * 0.24, W * 0.62);
  ctx.font = `400 ${billSize}px Anton, sans-serif`;
  ctx.fillStyle = rgba(PALETTE.cream, 0.85);
  ctx.fillText(billText, 0.03 * W, footY + footH * 0.72);

  // Gold seal between the billing text and the barcode.
  if (cfg.extras && cfg.extras.seal !== false) {
    const sealX = 0.7 * W;
    const sealY = footY + footH * 0.5;
    const sealR = footH * 0.42;
    ctx.save();
    ctx.translate(sealX, sealY);
    ctx.fillStyle = PALETTE.sand;
    ctx.beginPath();
    ctx.arc(0, 0, sealR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2 * u;
    ctx.beginPath();
    ctx.arc(0, 0, sealR - 3 * u, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `400 ${Math.max(7, 8 * u)}px Anton, sans-serif`;
    ctx.fillText('ORIGINAL', 0, -sealR * 0.32);
    ctx.fillText('COVER ART', 0, sealR * 0.05);
    ctx.font = `400 ${Math.max(9, 11 * u)}px Anton, sans-serif`;
    ctx.fillText('★', 0, sealR * 0.45);
    ctx.restore();
  }

  // Barcode (dense LCG bars) + catalogue number, bottom-right.
  const barX = 0.8 * W;
  const barW = 0.15 * W;
  const barY = footY + footH * 0.18;
  const barH = footH * 0.45;
  drawBarcode(ctx, barX, barY, barW, barH);
  ctx.font = `400 ${Math.max(9, 11 * u)}px Anton, sans-serif`;
  ctx.fillStyle = PALETTE.cream;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('TC-0626', barX, footY + footH * 0.82);

  // Grain over everything, at the end.
  if (cfg.grain > 0) {
    const tile = getGrainTile();
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = (cfg.grain / 100) * 0.9;
    ctx.fillStyle = ctx.createPattern(tile, 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

// Render a fresh offscreen cover at any size.
export function renderCover(width, height, cfg, photos) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, cfg, photos);
  return canvas;
}
