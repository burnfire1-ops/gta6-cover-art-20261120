// Bay of Light Cover Studio — editor wiring.
//
// Owns the page state (theme, layout, grade, sliders, captions, per-panel
// crops, undo history), draws the preview through cover.js, and handles
// photo loading, panel picking, export, and the ?shot= screenshot scenes.
import { drawCover, renderCover, layoutPanels, THEMES, LAYOUTS, GRADES, ROLES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const SAMPLE_PATHS = ['samples/harbor-man.jpg', 'samples/harbor-woman.jpg', 'samples/harbor-rider.jpg'];
const EXPORT_SIZES = [
  { label: '1080 × 1080', w: 1080, h: 1080, key: '1080x1080' },
  { label: '1080 × 1350', w: 1080, h: 1350, key: '1080x1350' },
  { label: '1920 × 1080', w: 1920, h: 1080, key: '1920x1080' },
];
const SURPRISES = [
  { title: 'DERMAGA NIGHTS', script: 'after dark' },
  { title: 'CAHAYA NIGHTS', script: 'one last summer' },
  { title: 'SALT & SIRENS', script: 'tide is turning' },
  { title: 'TELUK LIGHTS', script: 'no curfew' },
];

// ---- State -----------------------------------------------------------------

function freshState() {
  return {
    theme: 0,
    layout: 'harbor',
    grade: 0,
    paint: 50,
    gradeAmt: 85,
    halftone: 0,
    grain: 25,
    glow: 40,
    title: 'BAY OF LIGHT',
    script: 'one last summer',
    tagline: 'SIX LIVES · ONE BAY · NO WAY BACK',
    quote: 'PURE GOLDEN-HOUR MAYHEM',
    extras: { tags: true, heat: true, seal: true },
    crops: {}, // panel index -> { img, fx, fy, zoom, flip, ox, oy, role, sub }
    selected: 0,
    exportSize: '1080x1350',
    photoCount: 0,
  };
}

const state = freshState();
let photos = []; // loaded Image objects, in load order
let undoStack = [];
let redoStack = [];

function snapshot() {
  return JSON.stringify(state);
}
function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
  syncHistoryButtons();
}
function restore(json) {
  const saved = JSON.parse(json);
  const keptPhotos = state.photoCount;
  Object.assign(state, saved);
  state.photoCount = Math.max(keptPhotos, saved.photoCount);
  syncAllControls();
  redraw();
}
function syncHistoryButtons() {
  document.getElementById('undoBtn').disabled = undoStack.length === 0;
  document.getElementById('redoBtn').disabled = redoStack.length === 0;
}

// ---- Configuration for the renderer ----------------------------------------

function panelCount() {
  return layoutPanels(state.layout, 1080, 1080).length;
}

function buildCfg() {
  const panels = [];
  const count = panelCount();
  for (let i = 0; i < count; i++) panels.push(state.crops[i] || {});
  return {
    theme: state.theme,
    layout: state.layout,
    grade: state.grade,
    paint: state.paint,
    gradeAmt: state.gradeAmt,
    halftone: state.halftone,
    grain: state.grain,
    glow: state.glow,
    title: state.title,
    script: state.script,
    tagline: state.tagline,
    quote: state.quote,
    extras: state.extras,
    panels,
  };
}

function redraw() {
  drawCover(canvas, buildCfg(), photos);
}

// ---- Image loading -----------------------------------------------------------

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addPhotos(urls) {
  for (const url of urls) {
    try {
      photos.push(await loadImage(url));
    } catch {
      // A single unreadable file must not stop the rest.
    }
  }
  state.photoCount = photos.length;
  buildThumbs();
  redraw();
}

async function loadSamples() {
  photos = [];
  await addPhotos(SAMPLE_PATHS);
  statusEl.textContent = 'Sample photos loaded — a fictional cast of three. Edit the caption, pick a look, export.';
}

function buildThumbs() {
  const box = document.getElementById('thumbs');
  box.innerHTML = '';
  photos.forEach((img, idx) => {
    const thumb = document.createElement('canvas');
    thumb.width = 72;
    thumb.height = 96;
    const tctx = thumb.getContext('2d');
    const s = Math.max(72 / img.naturalWidth, 96 / img.naturalHeight);
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    tctx.drawImage(img, (72 - dw) / 2, (96 - dh) / 2, dw, dh);
    thumb.title = `Photo ${idx + 1}`;
    thumb.addEventListener('click', () => {
      pushHistory();
      crop(state.selected).img = idx;
      buildThumbs();
      redraw();
    });
    box.appendChild(thumb);
  });
  const count = document.getElementById('photoCount');
  count.textContent = photos.length === 0
    ? 'No photos yet.'
    : `${photos.length} photo${photos.length > 1 ? 's' : ''} loaded — one photo fills every panel with a smart crop.`;
}

// ---- Per-panel crop overrides ------------------------------------------------

function crop(i) {
  if (!state.crops[i]) state.crops[i] = {};
  return state.crops[i];
}

function panelRole(i) {
  const panels = layoutPanels(state.layout, 1080, 1080);
  const roleIdx = panels[i] ? panels[i].role : i;
  const over = state.crops[i] || {};
  return { name: over.role ?? ROLES[roleIdx].name, sub: over.sub ?? ROLES[roleIdx].sub };
}

function syncPanelSection() {
  const { name, sub } = panelRole(state.selected);
  document.getElementById('panelLabel').textContent = `Panel ${state.selected + 1} — ${name}`;
  document.getElementById('roleInput').value = name;
  document.getElementById('subInput').value = sub;
  const chips = document.getElementById('panelChips');
  chips.innerHTML = '';
  for (let i = 0; i < panelCount(); i++) {
    const { name: n } = panelRole(i);
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.textContent = `${i + 1} · ${n}`;
    if (i === state.selected) chip.classList.add('active');
    chip.addEventListener('click', () => {
      state.selected = i;
      syncPanelSection();
      syncZoomSlider();
      redraw();
    });
    chips.appendChild(chip);
  }
}

function syncZoomSlider() {
  const over = state.crops[state.selected] || {};
  const zoom = over.zoom ?? 1.3;
  const slider = document.getElementById('zoomSlider');
  slider.value = Math.round(((zoom - 0.8) / (2.5 - 0.8)) * 100);
  document.getElementById('zoomVal').textContent = slider.value;
}

// ---- Controls: wizard, pickers, sliders --------------------------------------

function showStep(n) {
  document.querySelectorAll('.step-page').forEach((page) => {
    page.hidden = page.dataset.page !== String(n);
  });
  document.querySelectorAll('.step-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.step === String(n));
  });
}

document.querySelectorAll('.step-btn').forEach((btn) => {
  btn.addEventListener('click', () => showStep(Number(btn.dataset.step)));
});

function buildThemeCards() {
  const box = document.getElementById('themes');
  box.innerHTML = '';
  THEMES.forEach((theme, idx) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'theme-card' + (idx === state.theme ? ' active' : '');
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.display = 'block';
    swatch.style.background = `linear-gradient(90deg, ${theme.swatch.join(', ')})`;
    const name = document.createElement('span');
    name.className = 'theme-name';
    name.textContent = theme.name;
    const mood = document.createElement('span');
    mood.className = 'theme-mood';
    mood.textContent = theme.mood;
    card.append(swatch, name, mood);
    card.addEventListener('click', () => {
      pushHistory();
      state.theme = idx;
      state.grade = theme.grade;
      buildThemeCards();
      buildGradeButtons();
      redraw();
    });
    box.appendChild(card);
  });
}

function buildLayoutButtons() {
  const box = document.getElementById('layouts');
  box.innerHTML = '';
  LAYOUTS.forEach((layout) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = layout.name;
    if (layout.id === state.layout) btn.classList.add('active');
    btn.addEventListener('click', () => {
      pushHistory();
      state.layout = layout.id;
      state.selected = 0;
      buildLayoutButtons();
      syncPanelSection();
      syncZoomSlider();
      resizePreview();
      redraw();
    });
    box.appendChild(btn);
  });
}

function buildGradeButtons() {
  const box = document.getElementById('grades');
  box.innerHTML = '';
  GRADES.forEach((grade, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = grade.name;
    if (idx === state.grade) btn.classList.add('active');
    btn.addEventListener('click', () => {
      pushHistory();
      state.grade = idx;
      buildGradeButtons();
      redraw();
    });
    box.appendChild(btn);
  });
}

function bindSlider(id, valId, key, after) {
  const slider = document.getElementById(id);
  const val = document.getElementById(valId);
  slider.addEventListener('input', () => {
    state[key] = Number(slider.value);
    val.textContent = slider.value;
    redraw();
  });
  slider.addEventListener('change', () => {
    pushHistory();
    if (after) after();
  });
}

function bindText(id, key) {
  const input = document.getElementById(id);
  input.addEventListener('input', () => {
    state[key] = input.value;
    redraw();
  });
  input.addEventListener('change', pushHistory);
}

function syncAllControls() {
  document.getElementById('titleInput').value = state.title;
  document.getElementById('scriptInput').value = state.script;
  document.getElementById('taglineInput').value = state.tagline;
  document.getElementById('quoteInput').value = state.quote;
  const pairs = [['paintSlider', 'paintVal', state.paint], ['gradeSlider', 'gradeVal', state.gradeAmt], ['halftoneSlider', 'halftoneVal', state.halftone], ['grainSlider', 'grainVal', state.grain], ['glowSlider', 'glowVal', state.glow]];
  pairs.forEach(([s, v, n]) => {
    document.getElementById(s).value = n;
    document.getElementById(v).textContent = n;
  });
  buildThemeCards();
  buildLayoutButtons();
  buildGradeButtons();
  syncPanelSection();
  syncZoomSlider();
  resizePreview();
}

// ---- Step 1: photo intake ------------------------------------------------------

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') fileInput.click();
});
fileInput.addEventListener('change', async () => {
  const urls = [...fileInput.files].map((f) => URL.createObjectURL(f));
  pushHistory();
  await addPhotos(urls);
  if (photos.length > 0) statusEl.textContent = 'Sample photos loaded — a fictional cast of three. Edit the caption, pick a look, export.';
});
['dragover', 'dragenter'].forEach((ev) => dropzone.addEventListener(ev, (e) => {
  e.preventDefault();
  dropzone.classList.add('drag-over');
}));
['dragleave', 'drop'].forEach((ev) => dropzone.addEventListener(ev, (e) => {
  e.preventDefault();
  dropzone.classList.remove('drag-over');
}));
dropzone.addEventListener('drop', async (e) => {
  const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/'));
  if (files.length === 0) return;
  pushHistory();
  await addPhotos(files.map((f) => URL.createObjectURL(f)));
});
document.addEventListener('paste', async (e) => {
  const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
  if (files.length === 0) return;
  pushHistory();
  await addPhotos(files.map((f) => URL.createObjectURL(f)));
});

document.getElementById('loadSamples').addEventListener('click', async () => {
  pushHistory();
  await loadSamples();
});
document.getElementById('autoLayout').addEventListener('click', () => {
  pushHistory();
  const others = LAYOUTS.filter((l) => l.id !== state.layout);
  state.layout = others[Math.floor(Math.random() * others.length)].id;
  state.selected = 0;
  buildLayoutButtons();
  syncPanelSection();
  resizePreview();
  redraw();
});
document.getElementById('surpriseBtn').addEventListener('click', () => {
  pushHistory();
  state.layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)].id;
  state.grade = Math.floor(Math.random() * GRADES.length);
  const pick = SURPRISES[Math.floor(Math.random() * SURPRISES.length)];
  state.title = pick.title;
  state.script = pick.script;
  syncAllControls();
  redraw();
});

// ---- Step 2 bindings -----------------------------------------------------------

bindText('titleInput', 'title');
bindText('scriptInput', 'script');
bindText('taglineInput', 'tagline');
bindText('quoteInput', 'quote');
bindSlider('paintSlider', 'paintVal', 'paint');
bindSlider('gradeSlider', 'gradeVal', 'gradeAmt');
bindSlider('halftoneSlider', 'halftoneVal', 'halftone');
bindSlider('grainSlider', 'grainVal', 'grain');
bindSlider('glowSlider', 'glowVal', 'glow');

// ---- Step 3: sizes, panel editing, export --------------------------------------

function resizePreview() {
  const size = EXPORT_SIZES.find((s) => s.key === state.exportSize) || EXPORT_SIZES[1];
  canvas.width = size.w;
  canvas.height = size.h;
}

document.querySelectorAll('.size-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.exportSize = btn.dataset.size;
    document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('active', b === btn));
    resizePreview();
    redraw();
  });
});

document.getElementById('zoomSlider').addEventListener('input', (e) => {
  const v = Number(e.target.value);
  document.getElementById('zoomVal').textContent = v;
  crop(state.selected).zoom = 0.8 + (v / 100) * (2.5 - 0.8);
  redraw();
});
document.getElementById('zoomSlider').addEventListener('change', pushHistory);

document.getElementById('roleInput').addEventListener('input', (e) => {
  crop(state.selected).role = e.target.value.toUpperCase();
  syncPanelSection();
  redraw();
});
document.getElementById('roleInput').addEventListener('change', pushHistory);
document.getElementById('subInput').addEventListener('input', (e) => {
  crop(state.selected).sub = e.target.value.toUpperCase();
  redraw();
});
document.getElementById('subInput').addEventListener('change', pushHistory);

document.getElementById('flipBtn').addEventListener('click', () => {
  pushHistory();
  const c = crop(state.selected);
  c.flip = !c.flip;
  redraw();
});
document.getElementById('faceBtn').addEventListener('click', () => {
  pushHistory();
  const c = crop(state.selected);
  c.fx = 0.5;
  c.fy = 0.28;
  c.zoom = Math.max(c.zoom ?? 1.3, 1.3);
  syncZoomSlider();
  redraw();
});
document.getElementById('swapBtn').addEventListener('click', () => {
  pushHistory();
  const count = panelCount();
  const next = (state.selected + 1) % count;
  const a = crop(state.selected);
  const b = crop(next);
  const tmp = a.img;
  a.img = b.img;
  b.img = tmp;
  state.selected = next;
  syncPanelSection();
  redraw();
});
document.getElementById('resetCropBtn').addEventListener('click', () => {
  pushHistory();
  delete state.crops[state.selected];
  syncPanelSection();
  syncZoomSlider();
  redraw();
});

function downloadCanvas(offscreen, w, h) {
  return new Promise((resolve) => {
    offscreen.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `bay-of-light-${w}x${h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve();
    }, 'image/png');
  });
}

async function exportSize(size) {
  const offscreen = renderCover(size.w, size.h, buildCfg(), photos);
  await downloadCanvas(offscreen, size.w, size.h);
}

document.getElementById('exportOne').addEventListener('click', async () => {
  if (photos.length === 0) {
    statusEl.textContent = 'Load a photo first — try “Load sample photos”.';
    return;
  }
  const size = EXPORT_SIZES.find((s) => s.key === state.exportSize);
  await exportSize(size);
  statusEl.textContent = `Exported bay-of-light-${size.w}x${size.h}.png`;
});

document.getElementById('exportAll').addEventListener('click', async () => {
  if (photos.length === 0) {
    statusEl.textContent = 'Load a photo first — try “Load sample photos”.';
    return;
  }
  const done = [];
  for (const size of EXPORT_SIZES) {
    await exportSize(size);
    done.push(size.key);
    await new Promise((r) => setTimeout(r, 150));
  }
  window.__exported = done;
  statusEl.textContent = `Exported all three sizes: ${done.join(', ')}.`;
});

// ---- History buttons -----------------------------------------------------------

document.getElementById('undoBtn').addEventListener('click', () => {
  if (undoStack.length === 0) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  syncHistoryButtons();
});
document.getElementById('redoBtn').addEventListener('click', () => {
  if (redoStack.length === 0) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  syncHistoryButtons();
});

// ---- Canvas interaction: pick, drag, scroll-zoom --------------------------------

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function panelAt(x, y) {
  const panels = layoutPanels(state.layout, canvas.width, canvas.height);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    const px = p.x * canvas.width;
    const py = p.y * canvas.height;
    const pw = p.w * canvas.width;
    const ph = p.h * canvas.height;
    const shift = p.skew * ph;
    // Point inside the slanted panel: interpolate the left edge by height.
    const relY = (y - py) / ph;
    if (relY < 0 || relY > 1) continue;
    const left = px + shift * (1 - relY);
    const right = px + pw + shift * (1 - relY);
    if (x >= left && x <= right) return i;
  }
  return -1;
}

let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  const { x, y } = canvasPoint(e);
  const idx = panelAt(x, y);
  if (idx === -1) return;
  state.selected = idx;
  syncPanelSection();
  syncZoomSlider();
  dragging = { idx, lastX: x, lastY: y, moved: false };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const { x, y } = canvasPoint(e);
  const panels = layoutPanels(state.layout, canvas.width, canvas.height);
  const p = panels[dragging.idx];
  const c = crop(dragging.idx);
  c.ox = Math.max(-0.5, Math.min(0.5, (c.ox || 0) + (x - dragging.lastX) / (p.w * canvas.width)));
  c.oy = Math.max(-0.5, Math.min(0.5, (c.oy || 0) + (y - dragging.lastY) / (p.h * canvas.height)));
  dragging.lastX = x;
  dragging.lastY = y;
  dragging.moved = true;
  redraw();
});
canvas.addEventListener('pointerup', () => {
  if (dragging && dragging.moved) pushHistory();
  dragging = null;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const { x, y } = canvasPoint(e);
  const idx = panelAt(x, y);
  if (idx === -1) return;
  pushHistory();
  const c = crop(idx);
  const zoom = c.zoom ?? 1.3;
  c.zoom = Math.max(0.8, Math.min(2.5, zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
  if (idx === state.selected) syncZoomSlider();
  redraw();
}, { passive: false });

// ---- Boot ----------------------------------------------------------------------

syncAllControls();
syncHistoryButtons();
redraw();
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => redraw());
}

// ---- Screenshot scenes -----------------------------------------------------------

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, async (samples, caption, query) => {
    state.title = (caption || 'BAY OF LIGHT').toUpperCase();
    const themeId = query.get('theme');
    const themeIdx = THEMES.findIndex((t) => t.id === themeId);
    if (themeIdx >= 0) {
      state.theme = themeIdx;
      state.grade = THEMES[themeIdx].grade;
    }
    const layoutId = query.get('layout');
    if (LAYOUTS.some((l) => l.id === layoutId)) state.layout = layoutId;
    const sizeKey = query.get('size');
    if (EXPORT_SIZES.some((s) => s.key === sizeKey)) state.exportSize = sizeKey;
    await loadSamples();
    syncAllControls();
    if (shot === 'editor') showStep(2);
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    redraw();
  });
}
