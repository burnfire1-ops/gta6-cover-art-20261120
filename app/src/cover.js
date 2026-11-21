// Bay of Light Cover Studio — the cover renderer.
// Everything on the poster is drawn on one 2D canvas. All sizes scale from
// u = canvas width / 1080, so the same code draws the live preview and the
// full-size exports. Only the photos inside the panels ever take the grade;
// the title, chrome and poster furniture never do.

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

// One grade: a CSS filter recipe for the photos, three sky colours, a tint
// wash and three chrome colours for the title gradient.
export const GRADES = {
  'Teluk Sunset': {
    sat: 1.6, con: 1.22, sepia: 0, hue: 0,
    sky: ['#00D0B8', '#FF1F8A', '#FF7A1A'],
    tint: '#FF7A1A', tintAlpha: 0.2,
    chrome: ['#F2C95E', '#FF7A1A', '#FF1F8A'],
    halftone: 0,
  },
  'Neon Shore': {
    sat: 1.85, con: 1.45, sepia: 0, hue: -8,
    sky: ['#1A0B2E', '#FF1F8A', '#FF7A1A'],
    tint: '#FF1F8A', tintAlpha: 0.22,
    chrome: ['#17DDD6', '#FF1F8A', '#F2C95E'],
    halftone: 0.7,
  },
  'Neon Night': {
    sat: 1.7, con: 1.3, sepia: 0, hue: -20,
    sky: ['#1A0B2E', '#17DDD6', '#FF1F8A'],
    tint: '#17DDD6', tintAlpha: 0.2,
    chrome: ['#17DDD6', '#FF1F8A', '#F2C95E'],
    halftone: 0,
  },
  'Golden Hour': {
    sat: 1.5, con: 1.12, sepia: 0.5, hue: 0,
    sky: ['#F2C95E', '#FF7A1A', '#B45309'],
    tint: '#F2C95E', tintAlpha: 0.2,
    chrome: ['#FFF3D6', '#F2C95E', '#FF7A1A'],
    halftone: 0,
  },
  'Tropic Teal': {
    sat: 1.35, con: 1.05, sepia: 0, hue: 8,
    sky: ['#00D0B8', '#2E7D5B', '#FFF3D6'],
    tint: '#00D0B8', tintAlpha: 0.12,
    chrome: ['#FFF3D6', '#00D0B8', '#2E7D5B'],
    halftone: 0,
  },
  'Comic Halftone': {
    sat: 1.9, con: 1.6, sepia: 0, hue: 0,
    sky: ['#FFF3D6', '#FF1F8A', '#00D0B8'],
    tint: '#FF1F8A', tintAlpha: 0.14,
    chrome: ['#F2C95E', '#FF7A1A', '#FF1F8A'],
    halftone: 1.6,
  },
};

export const GRADE_NAMES = Object.keys(GRADES);

// A theme is one grade plus its mood line and the three swatch colours shown
// on its picker card. Layout, title and furniture stay the same across themes.
export const THEMES = {
  'Teluk Sunset': {
    grade: 'Teluk Sunset',
    mood: 'teal lalu pink lalu oranye',
    swatches: ['#00D0B8', '#FF1F8A', '#FF7A1A'],
  },
  'Neon Night': {
    grade: 'Neon Night',
    mood: 'ungu gelap + cyan neon',
    swatches: ['#1A0B2E', '#17DDD6', '#FF1F8A'],
  },
  'Golden Hour': {
    grade: 'Golden Hour',
    mood: 'pasir + emas vintage amber',
    swatches: ['#F2C95E', '#FF7A1A', '#B45309'],
  },
};

export const THEME_NAMES = Object.keys(THEMES);

export const ROLES = [
  'THE DRIVER', 'THE BOSS', 'THE ANGLER', 'THE LOOKOUT',
  'THE COURIER', 'THE FIXER', 'THE ACE',
];

export const SUBLINES = [
  'DERMAGA 7 · 6:42 PM · LOOKING FOR TROUBLE',
  'PIER 9 · 7:15 PM · NO WAY BACK',
  'BOULEVARD · 5:30 PM · ONE LAST CAST',
  'ROOFTOP · 11 PM · EYES ON THE BAY',
  'OLD TOWN · 8:05 PM · PACKAGE DUE',
  'BACK ALLEY · MIDNIGHT · FIXES EVERYTHING',
  'MARINA · SUNSET · WILD CARD',
];

// Smart-crop anchors per panel index, measured against the real cast photos
// (faces sit in the upper third of each photo, so the anchors sit with them):
// panel 4 (THE COURIER, harbor-woman) is anchored at y 0.34 so her eyes,
// forehead and chin all stay inside the frame; panel 2 (THE ANGLER,
// harbor-rider) is anchored at (0.5, 0.25) so her face sits low enough that
// the VOL badge in the top-right corner never touches her eyes, in either
// aspect; panel 1 (THE BOSS, harbor-woman again) is anchored at y 0.35 for
// the same reason. The other panels keep the spec table.
export const FOCUS = [
  [0.5, 0.28], [0.5, 0.35], [0.5, 0.25], [0.68, 0.38],
  [0.5, 0.34], [0.5, 0.3], [0.5, 0.5],
];
export const ZOOMS = [1.35, 1.15, 1.4, 1.4, 1.25, 1.6, 1.2];

// Role order per layout (indices into ROLES).
export const LAYOUTS = {
  'Harbor Six': { roles: [0, 1, 2, 3, 4, 5], top: 3, slant: 0.14 },
  'Seven Mosaic': { roles: [0, 1, 2, 3, 4, 5, 6], top: 4, slant: 0 },
  'Diagonal Trio': { roles: [0, 2, 4], top: 3, slant: 0, trio: true },
  'One-Photo Five-Crop': { roles: [0, 1, 2, 3, 4], top: 2, slant: 0.14 },
  'Hero Pop-Out': { roles: [0, 1, 2, 3, 4, 5], top: 3, slant: 0.14, hero: true },
  'Bayfront Four': { roles: [0, 1, 2, 3], top: 2, slant: 0.14 },
  'Sunset Strip': { roles: [0, 1, 2, 3, 5, 6], top: 4, slant: 0.14 },
};
export const LAYOUT_NAMES = Object.keys(LAYOUTS);

export const SURPRISES = [
  ['DERMAGA NIGHTS', 'after dark'],
  ['CAHAYA NIGHTS', 'one last summer'],
  ['SALT & SIRENS', 'tide is turning'],
  ['TELUK LIGHTS', 'no curfew'],
];

// ---------------------------------------------------------------- geometry

// Panel geometry for a layout on a w x h canvas. Each panel carries its
// role index, its bounding box and its slanted polygon (for clipping and
// hit-testing). Zones: top row 0–0.34, title band 0.34–0.56, bottom row
// 0.56–0.90, footer 0.90–1.0 (the trio band sits at 0.40–0.60 instead).
export function layoutPanels(name, w, h) {
  const def = LAYOUTS[name] ?? LAYOUTS['Harbor Six'];
  const bandY = def.trio ? 0.4 * h : 0.34 * h;
  const bandH = def.trio ? 0.2 * h : 0.22 * h;
  const panels = [];
  if (def.trio) {
    const tall = 0.9 * h;
    const extra = 0.12 * h;
    const pw = w / 3;
    def.roles.forEach((role, i) => {
      const x0 = i * pw;
      panels.push({
        role, index: i,
        x: x0 - extra, y: 0, w: pw + 2 * extra, h: tall,
        poly: [
          [x0 + extra, 0], [x0 + pw + extra, 0],
          [x0 + pw - extra, tall], [x0 - extra, tall],
        ],
      });
    });
    return { panels, bandY, bandH, hero: null };
  }
  const topCount = def.top;
  const botCount = def.roles.length - topCount;
  const topH = 0.34 * h;
  const botY = 0.56 * h;
  const botH = 0.34 * h;
  const slantTop = def.slant * topH;
  const slantBot = def.slant * botH;
  const row = (count, y0, ph, slant) => {
    const pw = w / count;
    for (let i = 0; i < count; i++) {
      const x0 = i * pw;
      panels.push({
        role: def.roles[panels.length], index: panels.length,
        x: x0, y: y0, w: pw, h: ph,
        poly: slant
          ? [[x0 + slant, y0], [x0 + pw + slant, y0], [x0 + pw, y0 + ph], [x0, y0 + ph]]
          : [[x0, y0], [x0 + pw, y0], [x0 + pw, y0 + ph], [x0, y0 + ph]],
      });
    }
  };
  row(topCount, 0, topH, slantTop);
  row(botCount, botY, botH, slantBot);
  const hero = def.hero
    ? { x: 0.33 * w, y: 0.03 * h, w: 0.34 * w, h: 0.6 * h, role: 1 }
    : null;
  return { panels, bandY, bandH, hero };
}

export function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ---------------------------------------------------------------- helpers

function hexA(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Grade strength t (0–1) interpolates the filter back toward a raw photo.
function gradeFilter(grade, t, paint) {
  const g = GRADES[grade];
  const sat = lerp(1, g.sat, t).toFixed(3);
  const con = lerp(1, g.con, t).toFixed(3);
  const sepia = (g.sepia * t).toFixed(3);
  const hue = (g.hue * t).toFixed(1);
  const bright = (1 + paint * 0.0012).toFixed(4);
  return `saturate(${sat}) contrast(${con}) sepia(${sepia}) hue-rotate(${hue}deg) brightness(${bright})`;
}

// Fit-to-width text: shrink from `start` until it fits `maxW`.
function fitFont(ctx, text, start, maxW, family, weight = '') {
  let size = start;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxW && size > 8) {
    size -= 1;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

let grainTile = null;
function noiseTile() {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const img = g.createImageData(128, 128);
  let seed = 12345;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const v = seed % 256;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 28;
  }
  g.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

// Draw one photo into a panel rect with its smart crop. `crop` holds
// fx, fy (focus fractions), zoom, flip and drag offsets ox, oy (fractions
// of the panel size). The drawn image is clamped so it always covers the panel.
function drawPhotoInto(ctx, photo, rect, crop, filter, tint, tintAlpha) {
  const { x, y, w, h } = rect;
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const base = Math.max(w / iw, h / ih) * crop.zoom;
  const dw = iw * base;
  const dh = ih * base;
  let dx = x + w / 2 - crop.fx * dw + (crop.ox || 0) * w;
  let dy = y + h / 2 - crop.fy * dh + (crop.oy || 0) * h;
  dx = Math.min(x, Math.max(x + w - dw, dx));
  dy = Math.min(y, Math.max(y + h - dh, dy));
  ctx.save();
  ctx.filter = filter;
  if (crop.flip) {
    // Mirror around the panel's vertical centre line.
    ctx.translate(2 * (x + w / 2), 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.restore();
  if (tintAlpha > 0.001) {
    ctx.fillStyle = hexA(tint, tintAlpha);
    ctx.fillRect(x, y, w, h);
  }
}

function clipPoly(ctx, poly) {
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
  ctx.clip();
}

// ---------------------------------------------------------------- the cover

// state: {
//   photos: Image[] (may hold nulls), theme, layout,
//   title, script, tagline, quote,
//   sliders: { paint, grade, halftone, grain, glow },
//   panels: [{ photo, fx, fy, zoom, flip, ox, oy, role, sub }] (per panel index),
//   extras: { tags, heat, seal } }
// The canvas keeps its own size; exports just use a bigger canvas.
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const u = w / 1080;
  const gradeName = state.grade ?? THEMES[state.theme]?.grade ?? 'Teluk Sunset';
  const g = GRADES[gradeName];
  const t = (state.sliders.grade ?? 85) / 100;
  const paint = state.sliders.paint ?? 50;
  const filter = gradeFilter(gradeName, t, paint);
  const tintAlpha = g.tintAlpha * t;
  const photos = state.photos || [];
  const { panels, bandY, bandH, hero } = layoutPanels(state.layout, w, h);
  const extras = state.extras ?? { tags: true, heat: true, seal: true };

  // Backdrop: deep purple, then a diagonal sky wash over the top half.
  ctx.fillStyle = PALETTE.purple;
  ctx.fillRect(0, 0, w, h);
  const sky = ctx.createLinearGradient(0, 0, w, h * 0.5);
  g.sky.forEach((c, i) => sky.addColorStop(i / (g.sky.length - 1), hexA(c, 0.22 * (0.15 + 0.85 * t))));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.5);

  const cropFor = (panel) => {
    const p = (state.panels && state.panels[panel.index]) || {};
    return {
      fx: p.fx ?? FOCUS[panel.index][0],
      fy: p.fy ?? FOCUS[panel.index][1],
      zoom: p.zoom ?? ZOOMS[panel.index],
      flip: !!p.flip,
      ox: p.ox ?? 0,
      oy: p.oy ?? 0,
    };
  };
  const photoFor = (panel) => {
    const p = (state.panels && state.panels[panel.index]) || {};
    const idx = p.photo ?? (panel.role % Math.max(1, photos.length));
    // Photos arrive as { img, name } from the editor (or raw images in tests).
    const pic = (entry) => (entry && entry.naturalWidth ? entry : entry?.img) || null;
    return pic(photos[idx]) || pic(photos[0]);
  };

  // Panels.
  for (const panel of panels) {
    const photo = photoFor(panel);
    if (!photo) continue;
    ctx.save();
    clipPoly(ctx, panel.poly);
    drawPhotoInto(ctx, photo, panel, cropFor(panel), filter, g.tint, tintAlpha);
    ctx.restore();
    // Cream divider on the panel's right edge.
    ctx.strokeStyle = PALETTE.cream;
    ctx.lineWidth = 3 * u;
    ctx.beginPath();
    ctx.moveTo(panel.poly[1][0], panel.poly[1][1]);
    ctx.lineTo(panel.poly[2][0], panel.poly[2][1]);
    ctx.stroke();
  }

  // Halftone dots over the panels.
  const amount = Math.min(
    1.8,
    g.halftone * t + (state.sliders.halftone ?? 0) / 100,
  );
  if (amount > 0.05) {
    const gap = Math.max(6, w / 160);
    const r = gap * 0.22 * amount + 0.8;
    ctx.fillStyle = hexA(PALETTE.ink, 0.22 * amount);
    for (let row = 0, yy = 0; yy < 0.9 * h; row++, yy += gap) {
      for (let xx = row % 2 ? gap / 2 : 0; xx < w; xx += gap) {
        ctx.beginPath();
        ctx.arc(xx, yy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Title band: solid purple with sand rules, then the chrome title.
  ctx.fillStyle = PALETTE.purple;
  ctx.fillRect(0, bandY, w, bandH);
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(0, bandY, w, 3 * u);
  ctx.fillRect(0, bandY + bandH - 3 * u, w, 3 * u);
  if ((state.sliders.glow ?? 40) > 0) {
    const glow = ctx.createRadialGradient(
      w / 2, bandY + bandH / 2, 0, w / 2, bandY + bandH / 2, w * 0.45,
    );
    glow.addColorStop(0, hexA(PALETTE.pink, 0.25 * ((state.sliders.glow ?? 40) / 100)));
    glow.addColorStop(1, hexA(PALETTE.pink, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, bandY, w, bandH);
  }

  // Chrome title on its own layer so the retro lines clip to the letters.
  const title = (state.title || 'BAY OF LIGHT').toUpperCase();
  const off = document.createElement('canvas');
  off.width = w;
  off.height = Math.ceil(bandH);
  const octx = off.getContext('2d');
  let titleSize = fitFont(octx, title, bandH * 0.5, w * 0.92, 'Anton');
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  const titleGrad = octx.createLinearGradient(w * 0.04, 0, w * 0.96, 0);
  g.chrome.forEach((c, i) => titleGrad.addColorStop(i / (g.chrome.length - 1), c));
  octx.lineJoin = 'round';
  octx.strokeStyle = PALETTE.ink;
  octx.lineWidth = 8 * u;
  octx.strokeText(title, w / 2, bandH * 0.36);
  octx.strokeStyle = '#FFFFFF';
  octx.lineWidth = 2 * u;
  octx.strokeText(title, w / 2, bandH * 0.36);
  octx.fillStyle = titleGrad;
  octx.fillText(title, w / 2, bandH * 0.36);
  octx.globalCompositeOperation = 'source-atop';
  octx.fillStyle = 'rgba(255,255,255,0.18)';
  const top = bandH * 0.36 - titleSize * 0.42;
  for (let i = 0; i < 3; i++) {
    octx.fillRect(0, top + (i * titleSize) / 3.2, w, Math.max(1, titleSize * 0.045));
  }
  octx.globalCompositeOperation = 'source-over';
  ctx.drawImage(off, 0, bandY);

  // Script subtitle + tagline inside the band.
  const script = state.script || 'one last summer';
  const scriptSize = fitFont(ctx, script, bandH * 0.15, w * 0.7, 'Pacifico');
  ctx.font = `${scriptSize}px Pacifico`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(1, 2 * u);
  ctx.strokeStyle = '#FFFFFF';
  ctx.strokeText(script, w / 2, bandY + bandH * 0.7);
  ctx.fillStyle = PALETTE.pink;
  ctx.fillText(script, w / 2, bandY + bandH * 0.7);

  const tagline = (state.tagline || 'SIX LIVES · ONE BAY · NO WAY BACK').toUpperCase();
  const tagSize = fitFont(ctx, tagline, bandH * 0.085, w * 0.86, 'Anton');
  ctx.font = `${tagSize}px Anton`;
  ctx.fillStyle = PALETTE.sand;
  ctx.fillText(tagline, w / 2, bandY + bandH * 0.9);

  // Location + HEAT chip, bottom-left inside the band.
  if (extras.heat) {
    const chipY = bandY + bandH * 0.6;
    const chipH = bandH * 0.15;
    ctx.font = `${Math.max(9, chipH * 0.52)}px Anton`;
    const label = 'DERMAGA 7 · 7:15 PM';
    const chipW = ctx.measureText(label).width + 18 * u;
    ctx.fillStyle = hexA(PALETTE.ink, 0.88);
    ctx.fillRect(0.02 * w, chipY, chipW, chipH);
    ctx.fillStyle = PALETTE.sand;
    ctx.fillRect(0.02 * w, chipY, 4 * u, chipH);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PALETTE.sand;
    ctx.fillText(label, 0.02 * w + 10 * u, chipY + chipH / 2);
    ctx.font = `${Math.max(9, chipH * 0.5)}px Anton`;
    ctx.fillText('HEAT ★★★★☆', 0.02 * w + 2 * u, chipY + chipH + bandH * 0.04);
    ctx.textAlign = 'center';
  }

  // Hero pop-out: the middle panel's photo breaking through the band.
  if (hero) {
    const heroEntry = photos[1] || photos[0];
    const heroPhoto = heroEntry && heroEntry.naturalWidth ? heroEntry : heroEntry?.img;
    if (heroPhoto) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(hero.x, hero.y, hero.w, hero.h);
      ctx.clip();
      drawPhotoInto(ctx, heroPhoto, hero, cropFor({ index: 1 }), filter, g.tint, tintAlpha);
      ctx.restore();
      ctx.strokeStyle = PALETTE.sand;
      ctx.lineWidth = 4 * u;
      ctx.strokeRect(hero.x, hero.y, hero.w, hero.h);
    }
  }

  // Role nameplates on the panels.
  if (extras.tags) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    for (const panel of panels) {
      const p = (state.panels && state.panels[panel.index]) || {};
      const name = (p.role ?? ROLES[panel.role]).toUpperCase();
      const sub = (p.sub ?? SUBLINES[panel.role]).toUpperCase();
      const nameSize = Math.max(10, 0.0145 * w);
      const subSize = Math.max(8, nameSize * 0.58);
      ctx.font = `${nameSize}px Anton`;
      const nameW = ctx.measureText(name).width;
      ctx.font = `${subSize}px Anton`;
      const subW = ctx.measureText(sub).width;
      const chipW = Math.max(nameW, subW) + 18 * u;
      const chipH = nameSize + subSize + 14 * u;
      const cx = panel.x + 8 * u;
      const cy = panel.y + panel.h - chipH - 8 * u;
      ctx.fillStyle = hexA(PALETTE.ink, 0.88);
      ctx.fillRect(cx, cy, chipW, chipH);
      ctx.fillStyle = PALETTE.sand;
      ctx.fillRect(cx, cy, 4 * u, chipH);
      ctx.fillStyle = PALETTE.cream;
      ctx.font = `${nameSize}px Anton`;
      ctx.fillText(name, cx + 10 * u, cy + nameSize + 2 * u);
      ctx.fillStyle = 'rgba(255,243,214,0.92)';
      ctx.font = `${subSize}px Anton`;
      ctx.fillText(sub, cx + 10 * u, cy + nameSize + subSize + 8 * u);
    }
    ctx.textAlign = 'center';
  }

  // VOL badge, top right, tilted a touch.
  const badgeR = Math.max(24, 0.033 * Math.min(w, h));
  const badgeX = w - badgeR * 1.3;
  const badgeY = badgeR * 1.3;
  ctx.save();
  ctx.translate(badgeX, badgeY);
  ctx.rotate(-0.14);
  ctx.fillStyle = PALETTE.sand;
  ctx.beginPath();
  ctx.arc(0, 0, badgeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3 * u;
  ctx.stroke();
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${badgeR * 0.32}px Anton`;
  ctx.fillText('VOL.', 0, -badgeR * 0.28);
  ctx.font = `${badgeR * 0.62}px Anton`;
  ctx.fillText('01', 0, badgeR * 0.3);
  ctx.restore();

  // Footer.
  const footY = 0.9 * h;
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(0, footY, w, h - footY);
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(0, footY, w, 2 * u);
  const quote = `★★★★★ “${state.quote || 'PURE GOLDEN-HOUR MAYHEM'}” — THE CAHAYA GAZETTE`;
  const quoteSize = fitFont(ctx, quote, (h - footY) * 0.42, w * 0.62, 'Anton');
  ctx.font = `${quoteSize}px Anton`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.sand;
  ctx.fillText(quote, 0.02 * w, footY + (h - footY) * 0.3);
  const billing = 'A BAY OF LIGHT PICTURE · STARRING YOU · SHOT ON YOUR OWN CAMERA · GRADED BY HAND';
  const billSize = fitFont(ctx, billing, (h - footY) * 0.3, w * 0.62, 'Anton');
  ctx.font = `${billSize}px Anton`;
  ctx.fillStyle = 'rgba(255,243,214,0.85)';
  ctx.fillText(billing, 0.02 * w, footY + (h - footY) * 0.72);

  // Gold seal between the billing text and the barcode.
  if (extras.seal) {
    const sealR = (h - footY) * 0.34;
    const sealX = w * 0.71;
    const sealY = footY + (h - footY) * 0.5;
    ctx.fillStyle = PALETTE.sand;
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2 * u;
    ctx.stroke();
    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = 'center';
    ctx.font = `${sealR * 0.3}px Anton`;
    ctx.fillText('ORIGINAL', sealX, sealY - sealR * 0.3);
    ctx.fillText('COVER ART', sealX, sealY + sealR * 0.08);
    ctx.font = `${sealR * 0.42}px Anton`;
    ctx.fillText('★', sealX, sealY + sealR * 0.52);
  }

  // Barcode: dense LCG bars (seed 626), catalogue number beneath.
  const barX0 = w * 0.8;
  const barX1 = w * 0.985;
  const barY = footY + (h - footY) * 0.14;
  const barH = (h - footY) * 0.52;
  let seed = 626;
  ctx.fillStyle = PALETTE.cream;
  let bx = barX0;
  while (bx < barX1) {
    seed = (seed * 16807) % 2147483647;
    const bw = 1 + (seed % 4);
    ctx.fillRect(bx, barY, bw * u, barH);
    bx += (bw + 1 + (seed % 3)) * u;
  }
  ctx.font = `${Math.max(9, (h - footY) * 0.2)}px Anton`;
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText('TC-0626', (barX0 + barX1) / 2, footY + (h - footY) * 0.88);

  // COMING SOON pill, top left, overlapping the first panel.
  const pillH = Math.max(22, 0.032 * h);
  ctx.font = `${pillH * 0.52}px Anton`;
  const pillLabel = 'COMING SOON';
  const pillW = ctx.measureText(pillLabel).width + pillH * 1.4;
  const pillX = 0.02 * w;
  const pillY = 0.02 * h;
  ctx.fillStyle = PALETTE.pink;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pillLabel, pillX + pillW / 2, pillY + pillH / 2 + 1);

  // Grain over everything.
  const grainAmt = ((state.sliders.grain ?? 25) / 100) * 0.9;
  if (grainAmt > 0.01) {
    const tile = noiseTile();
    const pat = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalAlpha = grainAmt;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}
