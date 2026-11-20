// Bay of Light Cover Studio — cover renderer. Draws the multi-panel GTA-style poster
// onto any canvas at any size: panels, the title band of its own, chrome lettering,
// role tags, poster furniture, colour grades, halftone and grain. No network, no
// Rockstar art, no Rockstar font: Anton + Pacifico (SIL OFL) only.

export const PALETTE = {
  tealSea: '#00D0B8', neonPink: '#FF1F8A', sand: '#F2C95E', sunsetOrange: '#FF7A1A',
  deepPurple: '#1A0B2E', palmGreen: '#2E7D5B', cream: '#FFF3D6', ink: '#12081F',
  cyanNeon: '#17DDD6',
};

export const GRADES = {
  sunset: { name: 'Teluk Sunset', filter: 'saturate(1.25) contrast(1.08)', sky: ['#00D0B8', '#FF1F8A', '#FF7A1A'], tint: 'rgba(255,122,26,0.10)', chrome: ['#F2C95E', '#FF7A1A', '#FF1F8A'] },
  neon: { name: 'Neon Night', filter: 'saturate(1.45) contrast(1.15) hue-rotate(-12deg)', sky: ['#1A0B2E', '#17DDD6', '#FF1F8A'], tint: 'rgba(23,221,214,0.12)', chrome: ['#17DDD6', '#FF1F8A', '#F2C95E'] },
  golden: { name: 'Golden Hour', filter: 'sepia(0.35) saturate(1.3) contrast(1.06)', sky: ['#F2C95E', '#FF7A1A', '#B45309'], tint: 'rgba(242,201,94,0.14)', chrome: ['#FFF3D6', '#F2C95E', '#FF7A1A'] },
  teal: { name: 'Tropic Teal', filter: 'saturate(1.35) contrast(1.05) hue-rotate(8deg)', sky: ['#00D0B8', '#2E7D5B', '#FFF3D6'], tint: 'rgba(0,208,184,0.12)', chrome: ['#FFF3D6', '#00D0B8', '#2E7D5B'] },
  halftone: { name: 'Comic Halftone', filter: 'saturate(1.5) contrast(1.35)', sky: ['#FFF3D6', '#FF1F8A', '#00D0B8'], tint: 'rgba(255,31,138,0.06)', chrome: ['#F2C95E', '#FF7A1A', '#FF1F8A'] },
};

export const ROLES = ['THE DRIVER', 'THE BOSS', 'THE ANGLER', 'THE LOOKOUT', 'THE COURIER', 'THE FIXER', 'THE ACE'];
export const SUBS = [
  'DERMAGA 7 · 6:42 PM · LOOKING FOR TROUBLE', 'PIER 9 · 7:15 PM · NO WAY BACK',
  'BOULEVARD · 5:30 PM · ONE LAST CAST', 'ROOFTOP · 11 PM · EYES ON THE BAY',
  'OLD TOWN · 8:05 PM · PACKAGE DUE', 'BACK ALLEY · MIDNIGHT · FIXES EVERYTHING',
  'MARINA · SUNSET · WILD CARD',
];

// Focal points (fractions of the photo) used by the smart crop when one photo
// fills many panels: faces sit in the upper third, so each panel takes another
// slice of the same photo instead of repeating one crop.
const FOCALS = [[0.5, 0.28], [0.5, 0.45], [0.32, 0.35], [0.68, 0.38], [0.5, 0.6], [0.5, 0.3], [0.5, 0.5]];
const ZOOMS = [1.35, 1.15, 1.5, 1.4, 1.25, 1.6, 1.2];

/** Panel rects for a layout at W x H. Title band sits between the rows, never over a face. */
export function layoutPanels(id, W, H) {
  const top = { y: 0, h: H * 0.34 };
  const band = { y: H * 0.34, h: H * 0.22 };
  const bot = { y: H * 0.56, h: H * 0.34 };
  const foot = { y: H * 0.9, h: H * 0.1 };
  const row = (r, n, slant) => {
    const out = [];
    for (let i = 0; i < n; i++) out.push({ x: (W / n) * i, y: r.y, w: W / n, h: r.h, slant, role: ROLES[(out.length + (r === bot ? 3 : 0)) % ROLES.length], sub: SUBS[(out.length + (r === bot ? 3 : 0)) % SUBS.length] });
    return out;
  };
  switch (id) {
    case 'mosaic7': return { panels: [...row(top, 4, 0), ...row(bot, 3, 0)], band, foot, hero: 0 };
    case 'trio': {
      const s = H * 0.12;
      return { panels: [0, 1, 2].map((i) => ({ x: (W / 3) * i - s, y: 0, w: W / 3 + s * 2, h: H * 0.9, slant: s / (H * 0.9), role: ROLES[i * 2], sub: SUBS[i * 2] })), band: { y: H * 0.4, h: H * 0.2 }, foot, hero: 1 };
    }
    case 'fivecrop': return { panels: [...row(top, 2, 0.14), ...row(bot, 3, 0.14)], band, foot, hero: 0 };
    case 'hero': return { panels: [...row(top, 3, 0.14), ...row(bot, 3, 0.14)], band, foot, hero: 1, heroRect: { x: W * 0.33, y: H * 0.03, w: W * 0.34, h: H * 0.6 } };
    default: return { panels: [...row(top, 3, 0.14), ...row(bot, 3, 0.14)], band, foot, hero: -1 }; // harbor6
  }
}

export const LAYOUT_NAMES = { harbor6: 'Harbor Six', mosaic7: 'Seven Mosaic', trio: 'Diagonal Trio', fivecrop: 'One-Photo Five-Crop', hero: 'Hero Pop-Out' };

function fitFont(ctx, text, maxW, start, font) {
  let s = start;
  ctx.font = font(s);
  while (s > 8 && ctx.measureText(text).width > maxW) { s -= 2; ctx.font = font(s); }
  return s;
}

function clipPanel(ctx, p) {
  ctx.beginPath();
  const d = (p.slant || 0) * p.h;
  ctx.moveTo(p.x + d, p.y); ctx.lineTo(p.x + p.w + d, p.y);
  ctx.lineTo(p.x + p.w - d, p.y + p.h); ctx.lineTo(p.x - d, p.y + p.h);
  ctx.closePath(); ctx.clip();
}

function drawPhoto(ctx, img, p, panel) {
  if (!img || !img.naturalWidth) { ctx.fillStyle = '#2E1A4A'; ctx.fillRect(p.x, p.y, p.w, p.h); return; }
  const z = (panel.zoom || 1.15);
  const sc = Math.max(p.w / img.naturalWidth, p.h / img.naturalHeight) * z;
  const dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
  const fx = panel.fx ?? 0.5, fy = panel.fy ?? 0.35;
  let dx = p.x + (p.w - dw) / 2 - (fx - 0.5) * (dw - p.w) + (panel.ox || 0);
  let dy = p.y + (p.h - dh) / 2 - (fy - 0.5) * (dh - p.h) + (panel.oy || 0);
  dx = Math.min(p.x, Math.max(p.x + p.w - dw, dx));
  dy = Math.min(p.y, Math.max(p.y + p.h - dh, dy));
  ctx.save();
  if (panel.flip) { ctx.translate(p.x + p.w / 2, 0); ctx.scale(-1, 1); ctx.translate(-(p.x + p.w / 2), 0); }
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function halftone(ctx, W, H, amount, clipRects) {
  if (amount <= 0) return;
  ctx.save();
  ctx.beginPath();
  for (const r of clipRects) ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  const step = Math.max(6, W / 160);
  ctx.fillStyle = `rgba(18,8,31,${0.16 * amount})`;
  for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) {
    ctx.beginPath(); ctx.arc(x + ((y / step) % 2) * step / 2, y, step * 0.16 * amount + 0.6, 0, 7); ctx.fill();
  }
  ctx.restore();
}

let noiseCanvas = null;
function grain(ctx, W, H, amount) {
  if (amount <= 0) return;
  if (!noiseCanvas) {
    noiseCanvas = document.createElement('canvas'); noiseCanvas.width = noiseCanvas.height = 128;
    const n = noiseCanvas.getContext('2d'); const d = n.createImageData(128, 128);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255 | 0; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 28; }
    n.putImageData(d, 0, 0);
  }
  ctx.save(); ctx.globalAlpha = amount; ctx.globalCompositeOperation = 'overlay';
  const pat = ctx.createPattern(noiseCanvas, 'repeat'); ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawRoleTag(ctx, p, role, sub, W) {
  const u = W / 1080;
  const pad = 10 * u, fs = Math.max(11, 17 * u), ss = Math.max(8, 11.5 * u);
  ctx.font = `${fs}px Anton, sans-serif`;
  const tw = ctx.measureText(role).width + pad * 2;
  const x = p.x + 10 * u, y = p.y + p.h - (fs + ss + pad * 2 + 14 * u);
  ctx.fillStyle = 'rgba(18,8,31,0.88)'; ctx.fillRect(x, y, tw, fs + pad);
  ctx.fillStyle = PALETTE.sand; ctx.fillRect(x, y, 4 * u, fs + pad);
  ctx.fillStyle = PALETTE.cream; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(role, x + pad + 2 * u, y + (fs + pad) / 2);
  ctx.font = `${ss}px Anton, sans-serif`; ctx.fillStyle = 'rgba(255,243,214,0.92)';
  ctx.fillText(sub, x + 2, y + fs + pad + ss / 2 + 4 * u);
  ctx.textBaseline = 'alphabetic';
}

function drawBarcode(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.cream;
  let bx = x; let seed = 626;
  while (bx < x + w - 2) { seed = (seed * 16807) % 2147483647; const bw = 1 + (seed % 4); ctx.fillRect(bx, y, bw, h); bx += bw + 1 + (seed % 3); }
}

/** Draws the whole cover. `state`: {images, panels, layout, grade, title, script, tagline, quote, sliders, extras}. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, u = W / 1080;
  const g = GRADES[state.grade] || GRADES.sunset;
  const L = layoutPanels(state.layout, W, H);
  const sl = state.sliders || {};
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = PALETTE.deepPurple; ctx.fillRect(0, 0, W, H);

  // Sky wash behind the panels (grade identity at a glance).
  const sky = ctx.createLinearGradient(0, 0, W, H * 0.5);
  g.sky.forEach((c, i) => sky.addColorStop(i / (g.sky.length - 1), c));
  ctx.globalAlpha = 0.22; ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;

  // Panels.
  const panels = L.panels.map((p, i) => ({ ...p, ...(state.panels?.[i] || {}) }));
  panels.forEach((p, i) => {
    ctx.save(); clipPanel(ctx, p);
    ctx.filter = `${g.filter} brightness(${1 + (sl.paint || 0) * 0.0012})`;
    drawPhoto(ctx, state.images[p.img ?? 0], p, p);
    ctx.filter = 'none';
    ctx.fillStyle = g.tint; ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,243,214,0.9)'; ctx.lineWidth = Math.max(2, 3 * u);
    ctx.beginPath();
    const d = (p.slant || 0) * p.h;
    ctx.moveTo(p.x + p.w + d, p.y); ctx.lineTo(p.x + p.w - d, p.y + p.h); ctx.stroke();
  });

  // Hero pop-out: centre figure breaks through the title band, text drawn after it.
  if (L.heroRect) {
    const hp = { ...L.heroRect, ...(state.panels?.[1] || {}) };
    ctx.save(); ctx.beginPath(); ctx.rect(hp.x, hp.y, hp.w, hp.h); ctx.clip();
    ctx.filter = g.filter; drawPhoto(ctx, state.images[hp.img ?? 0], hp, hp); ctx.filter = 'none';
    ctx.fillStyle = g.tint; ctx.fillRect(hp.x, hp.y, hp.w, hp.h); ctx.restore();
    ctx.strokeStyle = PALETTE.sand; ctx.lineWidth = Math.max(3, 4 * u); ctx.strokeRect(hp.x, hp.y, hp.w, hp.h);
  }

  // Title band: its own zone, never over a face.
  const b = L.band;
  ctx.fillStyle = PALETTE.deepPurple; ctx.fillRect(0, b.y, W, b.h);
  ctx.fillStyle = PALETTE.sand; ctx.fillRect(0, b.y, W, Math.max(2, 3 * u)); ctx.fillRect(0, b.y + b.h, W, Math.max(2, 3 * u));
  if ((sl.glow || 0) > 0) {
    const gl = ctx.createRadialGradient(W / 2, b.y + b.h / 2, 0, W / 2, b.y + b.h / 2, W * 0.45);
    gl.addColorStop(0, `rgba(255,31,138,${0.25 * (sl.glow / 100)})`); gl.addColorStop(1, 'rgba(255,31,138,0)');
    ctx.fillStyle = gl; ctx.fillRect(0, b.y, W, b.h);
  }
  const title = (state.title || 'BAY OF LIGHT').toUpperCase();
  const tSize = fitFont(ctx, title, W * 0.92, b.h * 0.52, (s) => `${s}px Anton, sans-serif`);
  const chrome = ctx.createLinearGradient(W * 0.08, 0, W * 0.92, 0);
  g.chrome.forEach((c, i) => chrome.addColorStop(i / (g.chrome.length - 1), c));
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const ty = b.y + b.h * 0.4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = Math.max(6, 8 * u);
  ctx.strokeText(title, W / 2, ty);
  ctx.fillStyle = chrome; ctx.fillText(title, W / 2, ty);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = Math.max(1.5, 2 * u);
  ctx.strokeText(title, W / 2, ty);
  // Retro chrome stripes.
  ctx.save(); ctx.beginPath(); ctx.rect(0, ty - tSize * 0.32, W, tSize * 0.64); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let y = ty - tSize * 0.3; y < ty + tSize * 0.3; y += Math.max(5, tSize * 0.09)) ctx.fillRect(0, y, W, Math.max(1, tSize * 0.02));
  ctx.restore();
  // Script subtitle + tagline inside the band.
  const sc = state.script || 'one last summer';
  const sSize = fitFont(ctx, sc, W * 0.7, b.h * 0.2, (s) => `${s}px Pacifico, cursive`);
  ctx.font = `${sSize}px Pacifico, cursive`; ctx.fillStyle = PALETTE.neonPink;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(1, 1.5 * u);
  ctx.strokeText(sc, W / 2, b.y + b.h * 0.78); ctx.fillText(sc, W / 2, b.y + b.h * 0.78);
  const tg = (state.tagline || 'SIX LIVES · ONE BAY · NO WAY BACK').toUpperCase();
  const gSize = fitFont(ctx, tg, W * 0.86, b.h * 0.11, (s) => `${s}px Anton, sans-serif`);
  ctx.font = `${gSize}px Anton, sans-serif`; ctx.fillStyle = PALETTE.sand;
  ctx.fillText(tg, W / 2, b.y + b.h * 0.95);
  ctx.textBaseline = 'alphabetic';

  // Role tags + sub-lines.
  if (state.extras?.tags !== false) panels.forEach((p) => drawRoleTag(ctx, p, p.role || ROLES[0], p.sub || SUBS[0], W));

  // Location chip + heat inside the title band (left, below the title):
  // the band is solid colour, so the chip can never cover a face, a hat or
  // panel text — the old hero-panel anchor put HEAT under THE BOSS's hat.
  if (state.extras?.heat !== false) {
    const cx = 14 * u, cy = b.y + b.h * 0.63;
    ctx.font = `${Math.max(11, 15 * u)}px Anton, sans-serif`;
    const chip = 'DERMAGA 7 · 7:15 PM';
    const cw = ctx.measureText(chip).width + 20 * u;
    ctx.fillStyle = 'rgba(18,8,31,0.88)'; ctx.fillRect(cx, cy, cw, 26 * u);
    ctx.fillStyle = PALETTE.sand; ctx.textAlign = 'left'; ctx.fillText(chip, cx + 10 * u, cy + 19 * u);
    ctx.fillStyle = PALETTE.sand; ctx.fillText('HEAT ★★★★☆', cx, cy + 44 * u);
    ctx.textAlign = 'left';
  }

  // VOL badge, top right.
  ctx.save(); ctx.translate(W - 46 * u, 46 * u); ctx.rotate(0.12);
  ctx.fillStyle = PALETTE.sand; ctx.beginPath(); ctx.arc(0, 0, 34 * u, 0, 7); ctx.fill();
  ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = 2 * u; ctx.stroke();
  ctx.fillStyle = PALETTE.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${Math.max(9, 13 * u)}px Anton, sans-serif`; ctx.fillText('VOL.', 0, -6 * u); ctx.fillText('01', 0, 8 * u);
  ctx.restore(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';

  // Footer: quote bar, billing, barcode, COMING SOON, gold seal.
  const f = L.foot;
  ctx.fillStyle = PALETTE.ink; ctx.fillRect(0, f.y, W, f.h);
  ctx.fillStyle = PALETTE.sand; ctx.fillRect(0, f.y, W, Math.max(2, 2 * u));
  const qSize = fitFont(ctx, `★★★★★  "${state.quote || 'PURE GOLDEN-HOUR MAYHEM'}"  — THE CAHAYA GAZETTE`, W * 0.62, f.h * 0.34, (s) => `${s}px Anton, sans-serif`);
  ctx.font = `${qSize}px Anton, sans-serif`; ctx.fillStyle = PALETTE.sand; ctx.textAlign = 'left';
  ctx.fillText(`★★★★★  "${(state.quote || 'PURE GOLDEN-HOUR MAYHEM').toUpperCase()}"  — THE CAHAYA GAZETTE`, 14 * u, f.y + f.h * 0.36);
  const bSize = fitFont(ctx, 'A BAY OF LIGHT PICTURE · STARRING YOU · SHOT ON YOUR OWN CAMERA · GRADED BY HAND', W * 0.62, f.h * 0.24, (s) => `${s}px Anton, sans-serif`);
  ctx.font = `${bSize}px Anton, sans-serif`; ctx.fillStyle = 'rgba(255,243,214,0.85)';
  ctx.fillText('A BAY OF LIGHT PICTURE · STARRING YOU · SHOT ON YOUR OWN CAMERA · GRADED BY HAND', 14 * u, f.y + f.h * 0.78);
  ctx.textAlign = 'left';
  // COMING SOON pill, top-left over the first panel.
  ctx.font = `${Math.max(9, 13 * u)}px Anton, sans-serif`;
  const cs = 'COMING SOON';
  const csw = ctx.measureText(cs).width + 20 * u;
  ctx.fillStyle = PALETTE.neonPink; ctx.fillRect(10 * u, 10 * u, csw, 26 * u);
  ctx.fillStyle = '#fff'; ctx.fillText(cs, 20 * u, 28 * u);
  // Barcode + catalogue number, right side.
  drawBarcode(ctx, W - 150 * u, f.y + f.h * 0.18, 120 * u, f.h * 0.42);
  ctx.font = `${Math.max(9, 12 * u)}px Anton, sans-serif`; ctx.fillStyle = PALETTE.cream; ctx.textAlign = 'center';
  ctx.fillText('TC-0626', W - 90 * u, f.y + f.h * 0.82);
  ctx.textAlign = 'left';
  // Gold seal in the footer, between the billing text and the barcode.
  if (state.extras?.seal !== false) {
    const sx = W - 215 * u, sy = f.y + f.h / 2, r = Math.min(44 * u, f.h * 0.44);
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(-0.1);
    ctx.fillStyle = PALETTE.sand; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = 2.5 * u;
    ctx.beginPath(); ctx.arc(0, 0, r - 6 * u, 0, 7); ctx.stroke();
    ctx.fillStyle = PALETTE.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${Math.max(8, Math.min(11 * u, r * 0.24))}px Anton, sans-serif`;
    ctx.fillText('ORIGINAL', 0, -10 * u); ctx.fillText('COVER ART', 0, 2 * u); ctx.fillText('★', 0, 16 * u);
    ctx.restore(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  }

  // Halftone + grain on top of everything photographic.
  const ht = state.grade === 'halftone' ? 1 : (sl.halftone || 0) / 100;
  halftone(ctx, W, H, ht, L.panels.map((p) => ({ x: p.x, y: p.y, w: p.w, h: p.h })));
  grain(ctx, W, H, (sl.grain || 0) / 100 * 0.9);
}
