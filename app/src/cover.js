// Bay of Light Cover Studio — the cover renderer.
//
// One canvas, one state object, one poster: a multi-panel GTA-style cover with
// a chrome title band, a quote footer, a gold seal and a barcode. Everything
// is drawn with the plain 2D context, no library, so the same code renders the
// live preview and the exported PNGs. Sizes follow u = canvas width / 1080.

export const PALETTE = {
  teal: '#00D0B8',
  pink: '#FF1F8A',
  sand: '#F2C95E',
  orange: '#FF7A1A',
  purple: '#1A0B2E',
  palm: '#2E7D5B',
  cream: '#FFF3D6',
  ink: '#12081F',
  cyan: '#17DDD6',
  amber: '#B45309',
};

// Six photo grades. Each carries the numeric filter knobs (saturate, contrast,
// hue shift in degrees, sepia), the three sky colours for the background wash,
// the tint washed over the photos, and the three chrome stops for the title.
export const GRADES = {
  sunset: {
    label: 'Teluk Sunset', sat: 1.6, con: 1.22, hue: 0, sepia: 0,
    sky: ['#00D0B8', '#FF1F8A', '#FF7A1A'], tint: '#FF7A1A', tintAlpha: 0.2,
    chrome: ['#F2C95E', '#FF7A1A', '#FF1F8A'],
  },
  shore: {
    label: 'Neon Shore', sat: 1.85, con: 1.45, hue: -8, sepia: 0,
    sky: ['#1A0B2E', '#FF1F8A', '#FF7A1A'], tint: '#FF1F8A', tintAlpha: 0.22,
    chrome: ['#17DDD6', '#FF1F8A', '#F2C95E'],
  },
  night: {
    label: 'Neon Night', sat: 1.7, con: 1.3, hue: -20, sepia: 0,
    sky: ['#1A0B2E', '#17DDD6', '#FF1F8A'], tint: '#17DDD6', tintAlpha: 0.2,
    chrome: ['#17DDD6', '#FF1F8A', '#F2C95E'],
  },
  golden: {
    label: 'Golden Hour', sat: 1.5, con: 1.12, hue: 0, sepia: 0.5,
    sky: ['#F2C95E', '#FF7A1A', '#B45309'], tint: '#F2C95E', tintAlpha: 0.2,
    chrome: ['#FFF3D6', '#F2C95E', '#FF7A1A'],
  },
  teal: {
    label: 'Tropic Teal', sat: 1.35, con: 1.05, hue: 8, sepia: 0,
    sky: ['#00D0B8', '#2E7D5B', '#FFF3D6'], tint: '#00D0B8', tintAlpha: 0.12,
    chrome: ['#FFF3D6', '#00D0B8', '#2E7D5B'],
  },
  halftone: {
    label: 'Comic Halftone', sat: 1.9, con: 1.6, hue: 0, sepia: 0,
    sky: ['#FFF3D6', '#FF1F8A', '#00D0B8'], tint: '#FF1F8A', tintAlpha: 0.14,
    chrome: ['#F2C95E', '#FF7A1A', '#FF1F8A'],
  },
};

// Three themes: each is one grade plus a mood line and three swatch colours
// for its picker card. Layout, title and furniture never change between
// themes — only the mood does, so the three covers read as one world.
export const THEMES = {
  sunset: {
    label: 'Teluk Sunset', grade: 'sunset', mood: 'Teal lalu pink lalu oranye.',
    swatch: ['#00D0B8', '#FF1F8A', '#FF7A1A'],
  },
  neon: {
    label: 'Neon Night', grade: 'night', mood: 'Ungu gelap + cyan neon.',
    swatch: ['#1A0B2E', '#17DDD6', '#FF1F8A'],
  },
  golden: {
    label: 'Golden Hour', grade: 'golden', mood: 'Pasir + emas vintage amber.',
    swatch: ['#F2C95E', '#FF7A1A', '#B45309'],
  },
};

export const LAYOUTS = {
  harbor: { label: 'Harbor Six' },
  mosaic: { label: 'Seven Mosaic' },
  diagonal: { label: 'Diagonal Trio' },
  fivecrop: { label: 'One-Photo Five-Crop' },
  hero: { label: 'Hero Pop-Out' },
  bayfront: { label: 'Bayfront Four' },
  strip: { label: 'Sunset Strip' },
};

export const ROLES = ['THE DRIVER', 'THE BOSS', 'THE ANGLER', 'THE LOOKOUT', 'THE COURIER', 'THE FIXER', 'THE ACE'];

export const SUBLINES = [
  'DERMAGA 7 · 6:42 PM · LOOKING FOR TROUBLE',
  'PIER 9 · 7:15 PM · NO WAY BACK',
  'BOULEVARD · 5:30 PM · ONE LAST CAST',
  'ROOFTOP · 11 PM · EYES ON THE BAY',
  'OLD TOWN · 8:05 PM · PACKAGE DUE',
  'BACK ALLEY · MIDNIGHT · FIXES EVERYTHING',
  'MARINA · SUNSET · WILD CARD',
];

// Smart-crop anchors (fractions of the photo) and zooms, one per panel index.
// Tuned to THIS cast, whose photos are tall (the man and the woman are 1:2,
// the rider 2:3): each focus sits on the face's centre, so eyes, forehead
// and chin all land inside even the wide landscape panels. Panel 4, THE
// COURIER, aims at the woman's face (eyes near 0.36, chin near 0.46); panel
// 2, THE ANGLER, sits lower than the spec table so the rider's eyes stay
// clear of the VOL badge in the top-right corner.
export const FOCUS = [[0.5, 0.32], [0.5, 0.4], [0.32, 0.3], [0.68, 0.32], [0.5, 0.4], [0.5, 0.3], [0.5, 0.32]];
export const ZOOMS = [1.25, 1.15, 1.5, 1.25, 1.25, 1.6, 1.25];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function hexA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** The CSS filter for a grade at an intensity (0-100) and a Paint value. */
export function gradeFilter(gradeKey, intensity, paint) {
  const g = GRADES[gradeKey] ?? GRADES.shore;
  const t = clamp(intensity, 0, 100) / 100;
  const sat = 1 + (g.sat - 1) * t;
  const con = 1 + (g.con - 1) * t;
  const hue = g.hue * t;
  const sep = g.sepia * t;
  const bright = 1 + clamp(paint, 0, 100) * 0.0012;
  return `saturate(${sat.toFixed(3)}) contrast(${con.toFixed(3)}) hue-rotate(${hue.toFixed(1)}deg) sepia(${sep.toFixed(3)}) brightness(${bright.toFixed(3)})`;
}

/** Shrink a font until the text fits maxWidth, starting at startSize. */
function fitFont(ctx, text, family, weight, startSize, maxWidth) {
  let size = startSize;
  const face = (s) => `${weight ? `${weight} ` : ''}${s}px ${family}`;
  ctx.font = face(size);
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = face(size);
  }
  return size;
}

// ---------------------------------------------------------------- geometry

// A panel: its bounding box, the slant of its left edge (bottom shifted right
// by skew), which role it carries, and its index in the crop table.
function panel(x, y, w, h, skew, role, index) {
  return { x, y, w, h, skew, role, index };
}

/**
 * The panels of a layout on a W x H canvas, plus the title band and an
 * optional hero rectangle. Zones: top row 0-0.34, band 0.34-0.56, bottom row
 * 0.56-0.90, footer 0.90-1.0 — except Diagonal Trio, whose band sits at
 * 0.40-0.60 and whose panels run the full 0-0.90 height.
 */
export function layoutPanels(layout, W, H) {
  const topY = 0;
  const topH = 0.34 * H;
  const bandY0 = 0.34 * H;
  const bandY1 = 0.56 * H;
  const botY = 0.56 * H;
  const botH = 0.34 * H;
  const panels = [];
  let hero = null;
  let band = { y0: bandY0, y1: bandY1 };
  const row = (y, h, count, roles, skewFrac) => {
    const cw = W / count;
    const skew = skewFrac * h;
    for (let i = 0; i < count; i++) {
      panels.push(panel(i * cw, y, cw, h, skew, roles[i], panels.length));
    }
  };
  if (layout === 'mosaic') {
    row(topY, topH, 4, [0, 1, 2, 3], 0);
    row(botY, botH, 3, [4, 5, 6], 0);
  } else if (layout === 'diagonal') {
    band = { y0: 0.4 * H, y1: 0.6 * H };
    const tallH = 0.9 * H;
    const extra = 0.12 * H;
    const cw = W / 3;
    [0, 2, 4].forEach((role, i) => {
      const cx = (i + 0.5) * cw;
      const w = cw + 2 * extra;
      panels.push(panel(cx - w / 2, 0, w, tallH, extra, role, panels.length));
    });
  } else if (layout === 'fivecrop') {
    row(topY, topH, 2, [0, 1], 0.14);
    row(botY, botH, 3, [2, 3, 4], 0.14);
  } else if (layout === 'hero') {
    row(topY, topH, 3, [0, 1, 2], 0.14);
    row(botY, botH, 3, [3, 4, 5], 0.14);
    hero = { x: 0.33 * W, y: 0.03 * H, w: 0.34 * W, h: 0.6 * H };
  } else if (layout === 'bayfront') {
    row(topY, topH, 2, [0, 1], 0.14);
    row(botY, botH, 2, [2, 3], 0.14);
  } else if (layout === 'strip') {
    row(topY, topH, 4, [0, 1, 2, 3], 0.14);
    row(botY, botH, 2, [5, 6], 0.14);
  } else {
    // Harbor Six, the default: 3 + 3 with a slant.
    row(topY, topH, 3, [0, 1, 2], 0.14);
    row(botY, botH, 3, [3, 4, 5], 0.14);
  }
  return { panels, band, hero };
}

/** The parallelogram path of a panel (its left edge slants by its skew). */
function tracePanel(ctx, p) {
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + p.w, p.y);
  ctx.lineTo(p.x + p.w + p.skew, p.y + p.h);
  ctx.lineTo(p.x + p.skew, p.y + p.h);
  ctx.closePath();
}

// ---------------------------------------------------------------- photo

/**
 * Draw one photo into a panel with the smart crop: cover-fit times the panel
 * zoom, anchored at the focus point, clamped so the photo never leaves the
 * panel, flipped when asked. ox/oy are drag offsets in fractions of the panel.
 */
function drawPhotoInto(ctx, img, p, crop, gradeKey, intensity, paint) {
  if (!img || !img.naturalWidth) {
    ctx.fillStyle = PALETTE.purple;
    ctx.fillRect(p.x - Math.abs(p.skew), p.y, p.w + 2 * Math.abs(p.skew), p.h);
    return;
  }
  const fx = crop.fx ?? FOCUS[p.index][0];
  const fy = crop.fy ?? FOCUS[p.index][1];
  const zoom = crop.zoom ?? ZOOMS[p.index];
  const base = Math.max(p.w / img.naturalWidth, p.h / img.naturalHeight);
  const dw = img.naturalWidth * base * zoom;
  const dh = img.naturalHeight * base * zoom;
  let dx = p.x + p.w / 2 - fx * dw + (crop.ox ?? 0) * p.w;
  let dy = p.y + p.h / 2 - fy * dh + (crop.oy ?? 0) * p.h;
  dx = dw <= p.w ? p.x + (p.w - dw) / 2 : clamp(dx, p.x + p.w - dw, p.x);
  dy = dh <= p.h ? p.y + (p.h - dh) / 2 : clamp(dy, p.y + p.h - dh, p.y);
  ctx.save();
  tracePanel(ctx, p);
  ctx.clip();
  ctx.filter = gradeFilter(gradeKey, intensity, paint);
  ctx.save();
  if (crop.flip) {
    ctx.translate(p.x * 2 + p.w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, p.x * 2 + p.w - dx - dw, dy, dw, dh);
  } else {
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  ctx.restore();
  ctx.filter = 'none';
  // The grade tint, washed over the photo only.
  const g = GRADES[gradeKey] ?? GRADES.shore;
  ctx.fillStyle = hexA(g.tint, g.tintAlpha * (clamp(intensity, 0, 100) / 100));
  ctx.fillRect(p.x - Math.abs(p.skew) - 2, p.y, p.w + 2 * Math.abs(p.skew) + 4, p.h);
  ctx.restore();
}

// ---------------------------------------------------------------- furniture

/** The barcode: dense thin cream bars from a tiny LCG, seed 626. */
function drawBarcode(ctx, x, y, w, h, u) {
  let seed = 626;
  let cx = x;
  ctx.fillStyle = PALETTE.cream;
  while (cx < x + w) {
    seed = (seed * 16807) % 2147483647;
    const bw = (1 + (seed % 4)) * u;
    ctx.fillRect(cx, y, bw, h);
    cx += bw + (1 + (seed % 3)) * u;
  }
}

/** The gold seal: a sand disc, an ink ring, ORIGINAL / COVER ART / a star. */
function drawSeal(ctx, cx, cy, r, u) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.sand;
  ctx.fill();
  ctx.lineWidth = 2 * u;
  ctx.strokeStyle = PALETTE.ink;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.lineWidth = 1 * u;
  ctx.stroke();
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.max(7, r * 0.24)}px Anton, sans-serif`;
  ctx.fillText('ORIGINAL', cx, cy - r * 0.32);
  ctx.fillText('COVER ART', cx, cy + r * 0.02);
  ctx.font = `${Math.max(8, r * 0.34)}px Anton, sans-serif`;
  ctx.fillText('★', cx, cy + r * 0.42);
  ctx.restore();
}

/** The VOL badge. Small and tucked into the corner so it never sits on a
 *  face: on a portrait canvas it hugs the corner tighter, because the
 *  portrait crop lifts the top-right face up under the badge. The landscape
 *  radius stays near 3% of the width — big enough to read, small enough to
 *  clear the rider's eyes in the ANGLER panel. */
function drawBadge(ctx, W, H, u) {
  const portrait = H > W;
  const r = (portrait ? 34 : 32) * u;
  const cx = portrait ? W - r * 0.9 : W - r - 0.012 * W;
  const cy = portrait ? r * 0.9 : r + 0.012 * W;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.1);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.sand;
  ctx.fill();
  ctx.lineWidth = 2.5 * u;
  ctx.strokeStyle = PALETTE.ink;
  ctx.stroke();
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.max(8, r * 0.26)}px Anton, sans-serif`;
  ctx.fillText('VOL.', 0, -r * 0.22);
  ctx.font = `${Math.max(11, r * 0.42)}px Anton, sans-serif`;
  ctx.fillText('01', 0, r * 0.28);
  ctx.restore();
}

/** The COMING SOON pill, top-left over the first panel (never the footer). */
function drawPill(ctx, W, H, u) {
  const size = Math.max(11, 0.016 * H);
  ctx.font = `${size}px Anton, sans-serif`;
  const label = 'COMING SOON';
  const tw = ctx.measureText(label).width;
  const padX = 12 * u;
  const padY = 7 * u;
  const x = 0.02 * W;
  const y = 0.02 * H;
  const w = tw + padX * 2;
  const h = size + padY * 2;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fillStyle = PALETTE.pink;
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + padX, y + h / 2 + size * 0.04);
  ctx.restore();
}

// A deterministic 128x128 grey-noise tile for the grain, so every render
// of the same settings looks the same.
let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(128, 128);
  let seed = 20260626;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const v = seed % 256;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 28;
  }
  tctx.putImageData(img, 0, 0);
  grainTile = tile;
  return tile;
}

// ---------------------------------------------------------------- the cover

/**
 * Draw the whole cover on `canvas` from `s`:
 *   photos, panelPhoto[], crops[], title, script, tagline, quote,
 *   theme, layout, grade, paint, intensity, halftone, grain, glow,
 *   roleNames[], roleSubs[], extras { tags, heat, seal }.
 * The grade touches the photos only — never the title or the furniture.
 */
export function drawCover(canvas, s) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const u = W / 1080;
  const gradeKey = GRADES[s.grade] ? s.grade : (THEMES[s.theme]?.grade ?? 'shore');
  const g = GRADES[gradeKey];
  const intensity = clamp(s.intensity ?? 85, 0, 100);
  const paint = clamp(s.paint ?? 50, 0, 100);

  // Background: dark purple, then the sky wash over the top half.
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = PALETTE.purple;
  ctx.fillRect(0, 0, W, H);
  const wash = ctx.createLinearGradient(0, 0, W, H * 0.5);
  const washA = 0.22 * (0.15 + 0.85 * (intensity / 100));
  wash.addColorStop(0, hexA(g.sky[0], washA));
  wash.addColorStop(0.5, hexA(g.sky[1], washA));
  wash.addColorStop(1, hexA(g.sky[2], washA));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H * 0.5);

  const { panels, band, hero } = layoutPanels(s.layout ?? 'harbor', W, H);
  const photos = s.photos ?? [];
  const panelPhoto = s.panelPhoto ?? panels.map((_, i) => i % Math.max(1, photos.length));
  const crops = s.crops ?? [];

  // Panels: photo, tint, then the cream divider on the right edge.
  for (const p of panels) {
    const img = photos[panelPhoto[p.index] ?? 0] ?? null;
    drawPhotoInto(ctx, img, p, crops[p.index] ?? {}, gradeKey, intensity, paint);
    ctx.save();
    tracePanel(ctx, p);
    ctx.clip();
    ctx.strokeStyle = PALETTE.cream;
    ctx.lineWidth = 3 * u;
    ctx.beginPath();
    ctx.moveTo(p.x + p.w, p.y);
    ctx.lineTo(p.x + p.w + p.skew, p.y + p.h);
    ctx.stroke();
    ctx.restore();
    // Role nameplate, bottom-left of the panel.
    if (s.extras?.tags !== false) {
      const name = (s.roleNames?.[p.role] ?? ROLES[p.role]).toUpperCase();
      const sub = (s.roleSubs?.[p.role] ?? SUBLINES[p.role]).toUpperCase();
      const nameSize = Math.max(9, 0.032 * p.h);
      const subSize = Math.max(7, 0.018 * p.h);
      ctx.font = `${nameSize}px Anton, sans-serif`;
      const nameW = ctx.measureText(name).width;
      ctx.font = `${subSize}px Anton, sans-serif`;
      const subW = ctx.measureText(sub).width;
      const chipW = Math.max(nameW, subW) + 14 * u;
      const chipH = nameSize + subSize + 12 * u;
      const chipX = p.x + p.skew * 0.5 + 6 * u;
      const chipY = p.y + p.h - chipH - 6 * u;
      ctx.save();
      ctx.fillStyle = hexA(PALETTE.ink, 0.88);
      ctx.fillRect(chipX, chipY, chipW, chipH);
      ctx.fillStyle = PALETTE.sand;
      ctx.fillRect(chipX, chipY, 4 * u, chipH);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = PALETTE.cream;
      ctx.font = `${nameSize}px Anton, sans-serif`;
      ctx.fillText(name, chipX + 9 * u, chipY + nameSize + 2 * u);
      ctx.fillStyle = hexA(PALETTE.cream, 0.92);
      ctx.font = `${subSize}px Anton, sans-serif`;
      ctx.fillText(sub, chipX + 9 * u, chipY + nameSize + subSize + 6 * u);
      ctx.restore();
    }
  }

  // Halftone dots over the panels only.
  const baseDots = gradeKey === 'halftone' ? 1.6 : gradeKey === 'shore' ? 0.7 : 0;
  const dots = Math.min(1.8, baseDots * (intensity / 100) + (s.halftone ?? 0) / 100);
  if (dots > 0.02) {
    const gap = Math.max(6, W / 160);
    ctx.save();
    ctx.fillStyle = hexA(PALETTE.ink, 0.22 * dots);
    for (const p of panels) {
      ctx.save();
      tracePanel(ctx, p);
      ctx.clip();
      const rad = gap * 0.22 * dots + 0.8;
      let row = 0;
      for (let y = p.y; y < p.y + p.h + gap; y += gap, row++) {
        const off = row % 2 === 0 ? 0 : gap / 2;
        for (let x = p.x - Math.abs(p.skew) + off; x < p.x + p.w + Math.abs(p.skew) + gap; x += gap) {
          ctx.beginPath();
          ctx.arc(x, y, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // Title band: solid purple, sand rules, an optional pink glow.
  const bandH = band.y1 - band.y0;
  ctx.fillStyle = PALETTE.purple;
  ctx.fillRect(0, band.y0, W, bandH);
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(0, band.y0, W, 3 * u);
  ctx.fillRect(0, band.y1 - 3 * u, W, 3 * u);
  const glow = clamp(s.glow ?? 40, 0, 100);
  if (glow > 0) {
    const radial = ctx.createRadialGradient(W / 2, (band.y0 + band.y1) / 2, 0, W / 2, (band.y0 + band.y1) / 2, W * 0.45);
    radial.addColorStop(0, hexA(PALETTE.pink, 0.25 * (glow / 100)));
    radial.addColorStop(1, hexA(PALETTE.pink, 0));
    ctx.fillStyle = radial;
    ctx.fillRect(0, band.y0, W, bandH);
  }

  // The chrome title, drawn on a spare canvas so the retro lines can be
  // clipped to the glyphs themselves.
  const title = (s.title ?? 'BAY OF LIGHT').toUpperCase();
  const titleOff = document.createElement('canvas');
  titleOff.width = W;
  titleOff.height = Math.ceil(bandH);
  const tctx = titleOff.getContext('2d');
  const titleSize = fitFont(tctx, title, 'Anton, sans-serif', '', 0.52 * bandH, W * 0.92);
  const titleGrad = tctx.createLinearGradient(0, 0, W, 0);
  titleGrad.addColorStop(0, g.chrome[0]);
  titleGrad.addColorStop(0.5, g.chrome[1]);
  titleGrad.addColorStop(1, g.chrome[2]);
  tctx.textAlign = 'center';
  tctx.textBaseline = 'alphabetic';
  tctx.lineJoin = 'round';
  const titleBase = bandH * 0.5;
  tctx.font = `${titleSize}px Anton, sans-serif`;
  tctx.strokeStyle = PALETTE.ink;
  tctx.lineWidth = 8 * u;
  tctx.strokeText(title, W / 2, titleBase);
  tctx.strokeStyle = '#ffffff';
  tctx.lineWidth = 2 * u;
  tctx.strokeText(title, W / 2, titleBase);
  tctx.fillStyle = titleGrad;
  tctx.fillText(title, W / 2, titleBase);
  tctx.globalCompositeOperation = 'source-atop';
  tctx.fillStyle = 'rgba(255,255,255,0.18)';
  const lineGap = Math.max(5, titleSize * 0.16);
  for (let y = titleBase - titleSize * 0.72; y < titleBase + titleSize * 0.1; y += lineGap) {
    tctx.fillRect(0, y, W, Math.max(1.5, 2 * u));
  }
  tctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(titleOff, 0, band.y0);

  // Script subtitle, pink with a thin white edge, centred low in the band.
  const script = s.script ?? 'one last summer';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const scriptSize = fitFont(ctx, script, 'Pacifico, cursive', '', 0.2 * bandH, W * 0.7);
  ctx.font = `${scriptSize}px Pacifico, cursive`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5 * u;
  ctx.strokeText(script, W / 2, band.y0 + bandH * 0.78);
  ctx.fillStyle = PALETTE.pink;
  ctx.fillText(script, W / 2, band.y0 + bandH * 0.78);

  // Tagline, sand, centred at the foot of the band.
  const tagline = (s.tagline ?? 'SIX LIVES · ONE BAY · NO WAY BACK').toUpperCase();
  const tagSize = fitFont(ctx, tagline, 'Anton, sans-serif', '', 0.11 * bandH, W * 0.86);
  ctx.font = `${tagSize}px Anton, sans-serif`;
  ctx.fillStyle = PALETTE.sand;
  ctx.fillText(tagline, W / 2, band.y0 + bandH * 0.95);

  // Location + HEAT chip, left inside the band, under the title.
  if (s.extras?.heat !== false) {
    const chipSize = Math.max(8, 0.075 * bandH);
    ctx.font = `${chipSize}px Anton, sans-serif`;
    const loc = 'DERMAGA 7 · 7:15 PM';
    const locW = ctx.measureText(loc).width;
    const chipX = 0.02 * W;
    const chipY = band.y0 + bandH * 0.56;
    const chipH = chipSize + 8 * u;
    ctx.fillStyle = hexA(PALETTE.ink, 0.88);
    ctx.fillRect(chipX, chipY, locW + 14 * u, chipH);
    ctx.fillStyle = PALETTE.sand;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(loc, chipX + 7 * u, chipY + chipH / 2);
    ctx.font = `${chipSize}px Anton, sans-serif`;
    ctx.fillText('HEAT ★★★★☆', chipX, chipY + chipH + chipSize * 0.9);
  }

  // Hero pop-out, over the band: the middle panel's photo breaking through.
  if (hero) {
    const img = photos[panelPhoto[1] ?? 0] ?? null;
    ctx.save();
    ctx.beginPath();
    ctx.rect(hero.x, hero.y, hero.w, hero.h);
    ctx.clip();
    if (img && img.naturalWidth) {
      const base = Math.max(hero.w / img.naturalWidth, hero.h / img.naturalHeight);
      const dw = img.naturalWidth * base;
      const dh = img.naturalHeight * base;
      ctx.filter = gradeFilter(gradeKey, intensity, paint);
      ctx.drawImage(img, hero.x + (hero.w - dw) / 2, hero.y + (hero.h - dh) / 2, dw, dh);
      ctx.filter = 'none';
      ctx.fillStyle = hexA(g.tint, g.tintAlpha * (intensity / 100));
      ctx.fillRect(hero.x, hero.y, hero.w, hero.h);
    } else {
      ctx.fillStyle = PALETTE.purple;
      ctx.fillRect(hero.x, hero.y, hero.w, hero.h);
    }
    ctx.restore();
    ctx.lineWidth = 4 * u;
    ctx.strokeStyle = PALETTE.sand;
    ctx.strokeRect(hero.x, hero.y, hero.w, hero.h);
  }

  // Footer: ink, a sand rule on top.
  const footY0 = 0.9 * H;
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(0, footY0, W, H - footY0);
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(0, footY0, W, 2 * u);

  // Quote row: five stars, the quote, the gazette.
  const quote = `★★★★★ "${(s.quote ?? 'PURE GOLDEN-HOUR MAYHEM').toUpperCase()}" — THE CAHAYA GAZETTE`;
  ctx.textAlign = 'left';
  const quoteSize = fitFont(ctx, quote, 'Anton, sans-serif', '', 0.032 * H, W * 0.62);
  ctx.font = `${quoteSize}px Anton, sans-serif`;
  ctx.fillStyle = PALETTE.sand;
  ctx.fillText(quote, 0.02 * W, footY0 + (H - footY0) * 0.34);
  // Billing row.
  const billing = 'A BAY OF LIGHT PICTURE · STARRING YOU · SHOT ON YOUR OWN CAMERA · GRADED BY HAND';
  const billSize = fitFont(ctx, billing, 'Anton, sans-serif', '', 0.02 * H, W * 0.62);
  ctx.font = `${billSize}px Anton, sans-serif`;
  ctx.fillStyle = hexA(PALETTE.cream, 0.85);
  ctx.fillText(billing, 0.02 * W, footY0 + (H - footY0) * 0.78);

  // Gold seal between the billing text and the barcode.
  if (s.extras?.seal !== false) {
    drawSeal(ctx, 0.71 * W, footY0 + (H - footY0) * 0.5, 0.042 * H, u);
  }

  // Barcode + catalogue number, right.
  const barX = 0.84 * W;
  const barW = 0.13 * W;
  drawBarcode(ctx, barX, footY0 + (H - footY0) * 0.16, barW, (H - footY0) * 0.42, u);
  ctx.font = `${Math.max(8, 0.016 * H)}px Anton, sans-serif`;
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText('TC-0626', barX, footY0 + (H - footY0) * 0.86);

  // Badge and pill last, over everything in their corners.
  drawBadge(ctx, W, H, u);
  drawPill(ctx, W, H, u);

  // Grain over the whole cover, faint.
  const grainAmt = (clamp(s.grain ?? 25, 0, 100) / 100) * 0.9;
  if (grainAmt > 0.01) {
    const tile = getGrainTile();
    ctx.save();
    ctx.globalAlpha = grainAmt;
    ctx.globalCompositeOperation = 'overlay';
    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
