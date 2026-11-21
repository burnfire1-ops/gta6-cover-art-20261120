// Bay of Light Cover Studio — the editor wiring.
//
// One state object drives everything: the wizard steps, the pickers, the
// sliders, the panel editing, the undo history and the PNG export. The cover
// itself is drawn by ./cover.js; this file only owns the page around it.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, layoutPanels, ROLES, SUBLINES, FOCUS, ZOOMS } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const SAMPLES = [
  'media-generation-harbor-man-0-91bac76d-5021-44c6-8f31-aef2f41d365b',
  'media-generation-harbor-woman-0-589b97d6-4f8c-46a1-a419-ec38b17af6e4',
  'media-generation-harbor-rider-0-0c919c9e-c1de-4b15-9dd5-3b326b646555',
];
const SURPRISES = [
  ['DERMAGA NIGHTS', 'after dark'],
  ['CAHAYA NIGHTS', 'one last summer'],
  ['SALT & SIRENS', 'tide is turning'],
  ['TELUK LIGHTS', 'no curfew'],
];

// The whole editable state. Photos live outside the snapshots: history
// stores the settings and counts the photos, never the pixels.
const state = {
  photos: [],
  panelPhoto: [0, 1, 2, 0, 1, 2, 0],
  crops: FOCUS.map((f, i) => ({ fx: f[0], fy: f[1], zoom: ZOOMS[i], ox: 0, oy: 0, flip: false })),
  title: 'BAY OF LIGHT',
  script: 'one last summer',
  tagline: 'SIX LIVES · ONE BAY · NO WAY BACK',
  quote: 'PURE GOLDEN-HOUR MAYHEM',
  theme: 'sunset',
  layout: 'harbor',
  grade: 'shore',
  paint: 50,
  intensity: 85,
  halftone: 0,
  grain: 25,
  glow: 40,
  roleNames: [...ROLES],
  roleSubs: [...SUBLINES],
  selected: 0,
  exportSize: '1080x1350',
  extras: { tags: true, heat: true, seal: true },
};

let undoStack = [];
let redoStack = [];
const $ = (id) => document.getElementById(id);

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function panelCount() {
  return layoutPanels(state.layout, canvas.width, canvas.height).panels.length;
}

function redraw() {
  if (state.selected >= panelCount()) state.selected = 0;
  drawCover(canvas, state);
  syncPanelUI();
}

function snapshot() {
  const { photos, ...rest } = state;
  return JSON.stringify({ ...rest, photoCount: photos.length });
}

function restore(json) {
  const data = JSON.parse(json);
  const photos = state.photos;
  const photoCount = data.photoCount;
  delete data.photoCount;
  Object.assign(state, data);
  state.photos = photos.slice(0, photoCount);
  syncAllUI();
  redraw();
}

function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
  syncHistoryButtons();
}

function syncHistoryButtons() {
  $('undo').disabled = undoStack.length === 0;
  $('redo').disabled = redoStack.length === 0;
}

$('undo').addEventListener('click', () => {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  syncHistoryButtons();
});
$('redo').addEventListener('click', () => {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  syncHistoryButtons();
});

// ---------------------------------------------------------------- wizard

document.querySelectorAll('.step-nav').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.step-nav').forEach((b) => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.step').forEach((s) => s.classList.add('hidden'));
    $(`step-${btn.dataset.step}`).classList.remove('hidden');
  });
});

function goStep(n) {
  document.querySelector(`.step-nav[data-step="${n}"]`).click();
}

// ---------------------------------------------------------------- photos

function rebuildThumbs() {
  const box = $('thumbs');
  box.innerHTML = '';
  state.photos.forEach((img, i) => {
    const t = document.createElement('canvas');
    t.width = 72;
    t.height = 96;
    t.title = SAMPLES[i] ?? `Photo ${i + 1}`;
    const tctx = t.getContext('2d');
    const s = Math.max(72 / img.naturalWidth, 96 / img.naturalHeight);
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    tctx.drawImage(img, (72 - dw) / 2, (96 - dh) / 2, dw, dh);
    t.addEventListener('click', () => {
      state.panelPhoto[state.selected] = i;
      pushHistory();
      redraw();
      [...box.children].forEach((c, j) => c.classList.toggle('selected', j === i));
    });
    box.appendChild(t);
  });
  $('photo-count').textContent = state.photos.length === 0
    ? 'No photos yet.'
    : `${state.photos.length} photo${state.photos.length > 1 ? 's' : ''} loaded — click a thumbnail to put it in the selected panel.`;
}

async function addPhotoFiles(files) {
  let added = false;
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    try {
      state.photos.push(await loadImage(URL.createObjectURL(file)));
      added = true;
    } catch { /* a file that is not a picture is skipped */ }
  }
  if (added) {
    pushHistory();
    rebuildThumbs();
    redraw();
  }
}

async function loadSamples() {
  state.photos = [];
  for (const name of SAMPLES) {
    try {
      state.photos.push(await loadImage(`samples/${name}.jpg`));
    } catch { /* a missing sample is skipped */ }
  }
  state.panelPhoto = state.panelPhoto.map((_, i) => i % Math.max(1, state.photos.length));
  rebuildThumbs();
  redraw();
  status.textContent = 'Sample photos loaded — a fictional cast of three. Edit the caption, pick a look, export.';
}

$('load-samples').addEventListener('click', async () => {
  await loadSamples();
  pushHistory();
});

$('browse').addEventListener('change', (e) => addPhotoFiles([...e.target.files]));
$('dropzone').addEventListener('click', () => $('browse').click());
$('dropzone').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') $('browse').click(); });
for (const type of ['dragover', 'dragenter']) {
  $('dropzone').addEventListener(type, (e) => { e.preventDefault(); $('dropzone').classList.add('drag-over'); });
}
for (const type of ['dragleave', 'drop']) {
  $('dropzone').addEventListener(type, (e) => { e.preventDefault(); $('dropzone').classList.remove('drag-over'); });
}
$('dropzone').addEventListener('drop', (e) => addPhotoFiles([...e.dataTransfer.files]));
document.addEventListener('paste', (e) => {
  const files = [...(e.clipboardData?.files ?? [])];
  if (files.length) addPhotoFiles(files);
});

$('auto-layout').addEventListener('click', () => {
  const keys = Object.keys({ harbor: 1, mosaic: 1, diagonal: 1, fivecrop: 1, hero: 1, bayfront: 1, strip: 1 });
  setLayout(keys[Math.floor(Math.random() * keys.length)]);
  pushHistory();
});

$('surprise').addEventListener('click', () => {
  const grades = ['sunset', 'shore', 'night', 'golden', 'teal', 'halftone'];
  const layouts = ['harbor', 'mosaic', 'diagonal', 'fivecrop', 'hero', 'bayfront', 'strip'];
  const [title, script] = SURPRISES[Math.floor(Math.random() * SURPRISES.length)];
  state.title = title;
  state.script = script;
  setGrade(grades[Math.floor(Math.random() * grades.length)]);
  setLayout(layouts[Math.floor(Math.random() * layouts.length)]);
  $('in-title').value = title;
  $('in-script').value = script;
  pushHistory();
  redraw();
});

// ---------------------------------------------------------------- step 2

function bindText(id, key) {
  $(id).addEventListener('input', (e) => {
    state[key] = e.target.value;
    redraw();
  });
  $(id).addEventListener('change', pushHistory);
}
bindText('in-title', 'title');
bindText('in-script', 'script');
bindText('in-tagline', 'tagline');
bindText('in-quote', 'quote');

function setTheme(theme) {
  state.theme = theme;
  const grades = { sunset: 'sunset', neon: 'night', golden: 'golden' };
  setGrade(grades[theme] ?? 'sunset', false);
  document.querySelectorAll('.theme-card').forEach((c) => c.classList.toggle('active', c.dataset.theme === theme));
}

function setGrade(grade, redrawNow = true) {
  state.grade = grade;
  document.querySelectorAll('#grade-pick .pick-btn').forEach((b) => b.classList.toggle('active', b.dataset.grade === grade));
  if (redrawNow) redraw();
}

document.querySelectorAll('.theme-card').forEach((card) => {
  card.addEventListener('click', () => {
    setTheme(card.dataset.theme);
    pushHistory();
    redraw();
  });
});

function setLayout(layout) {
  state.layout = layout;
  document.querySelectorAll('#layout-pick .pick-btn').forEach((b) => b.classList.toggle('active', b.dataset.layout === layout));
  if (state.selected >= panelCount()) state.selected = 0;
  buildPanelChips();
}
document.querySelectorAll('#layout-pick .pick-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    setLayout(btn.dataset.layout);
    pushHistory();
    redraw();
  });
});
document.querySelectorAll('#grade-pick .pick-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    setGrade(btn.dataset.grade);
    pushHistory();
  });
});

function bindSlider(id, valId, key) {
  $(id).addEventListener('input', (e) => {
    state[key] = Number(e.target.value);
    $(valId).textContent = e.target.value;
    redraw();
  });
  $(id).addEventListener('change', pushHistory);
}
bindSlider('sl-paint', 'v-paint', 'paint');
bindSlider('sl-grade', 'v-grade', 'intensity');
bindSlider('sl-halftone', 'v-halftone', 'halftone');
bindSlider('sl-grain', 'v-grain', 'grain');
bindSlider('sl-glow', 'v-glow', 'glow');

// ---------------------------------------------------------------- step 3

function setExportSize(size) {
  state.exportSize = size;
  const [w, h] = size.split('x').map(Number);
  canvas.width = w;
  canvas.height = h;
  document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('active', b.dataset.size === size));
}
document.querySelectorAll('.size-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    setExportSize(btn.dataset.size);
    pushHistory();
    redraw();
  });
});

function buildPanelChips() {
  const box = $('panel-chips');
  box.innerHTML = '';
  const n = panelCount();
  for (let i = 0; i < n; i++) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'pick-btn';
    chip.textContent = `${i + 1}`;
    chip.addEventListener('click', () => selectPanel(i));
    box.appendChild(chip);
  }
  syncPanelUI();
}

function selectPanel(i) {
  state.selected = i;
  syncPanelUI();
  redraw();
}

function syncPanelUI() {
  const n = panelCount();
  const i = Math.min(state.selected, n - 1);
  const role = layoutPanels(state.layout, canvas.width, canvas.height).panels[i]?.role ?? i;
  $('panel-label').textContent = `Panel ${i + 1} — ${state.roleNames[role]}`;
  [...$('panel-chips').children].forEach((c, j) => c.classList.toggle('active', j === i));
  const crop = state.crops[i];
  $('sl-zoom').value = String(Math.round(((crop.zoom - 0.8) / 1.7) * 100));
  $('v-zoom').textContent = $('sl-zoom').value;
  if (document.activeElement !== $('in-role')) $('in-role').value = state.roleNames[role];
  if (document.activeElement !== $('in-sub')) $('in-sub').value = state.roleSubs[role];
}

$('sl-zoom').addEventListener('input', (e) => {
  const crop = state.crops[state.selected];
  crop.zoom = 0.8 + (Number(e.target.value) / 100) * 1.7;
  $('v-zoom').textContent = e.target.value;
  redraw();
});
$('sl-zoom').addEventListener('change', pushHistory);

$('in-role').addEventListener('input', (e) => {
  const role = layoutPanels(state.layout, canvas.width, canvas.height).panels[state.selected]?.role ?? state.selected;
  state.roleNames[role] = e.target.value.toUpperCase().slice(0, 20);
  redraw();
});
$('in-role').addEventListener('change', pushHistory);
$('in-sub').addEventListener('input', (e) => {
  const role = layoutPanels(state.layout, canvas.width, canvas.height).panels[state.selected]?.role ?? state.selected;
  state.roleSubs[role] = e.target.value.toUpperCase().slice(0, 48);
  redraw();
});
$('in-sub').addEventListener('change', pushHistory);

$('btn-flip').addEventListener('click', () => {
  const crop = state.crops[state.selected];
  crop.flip = !crop.flip;
  pushHistory();
  redraw();
});
$('btn-face').addEventListener('click', () => {
  const crop = state.crops[state.selected];
  crop.fx = 0.5;
  crop.fy = 0.28;
  crop.zoom = Math.max(crop.zoom, 1.3);
  crop.ox = 0;
  crop.oy = 0;
  pushHistory();
  redraw();
});
$('btn-swap').addEventListener('click', () => {
  const n = panelCount();
  const a = state.selected;
  const b = (a + 1) % n;
  [state.panelPhoto[a], state.panelPhoto[b]] = [state.panelPhoto[b], state.panelPhoto[a]];
  pushHistory();
  redraw();
});
$('btn-resetcrop').addEventListener('click', () => {
  const i = state.selected;
  state.crops[i] = { fx: FOCUS[i][0], fy: FOCUS[i][1], zoom: ZOOMS[i], ox: 0, oy: 0, flip: false };
  pushHistory();
  redraw();
});

// ---------------------------------------------------------------- canvas pointing

function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height),
  };
}

function panelAt(x, y) {
  const { panels } = layoutPanels(state.layout, canvas.width, canvas.height);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    const t = (y - p.y) / p.h;
    if (t < 0 || t > 1) continue;
    const left = p.x + p.skew * t;
    const right = p.x + p.w + p.skew * t;
    if (x >= left && x <= right) return i;
  }
  return -1;
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const pt = canvasPoint(e);
  const hit = panelAt(pt.x, pt.y);
  if (hit < 0) return;
  canvas.setPointerCapture(e.pointerId);
  canvas.classList.add('dragging');
  selectPanel(hit);
  drag = { x: pt.x, y: pt.y, moved: false };
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const pt = canvasPoint(e);
  const p = layoutPanels(state.layout, canvas.width, canvas.height).panels[state.selected];
  if (!p) return;
  const crop = state.crops[state.selected];
  crop.ox += (pt.x - drag.x) / p.w;
  crop.oy += (pt.y - drag.y) / p.h;
  drag.x = pt.x;
  drag.y = pt.y;
  drag.moved = true;
  redraw();
});
function endDrag() {
  if (drag?.moved) pushHistory();
  drag = null;
  canvas.classList.remove('dragging');
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const crop = state.crops[state.selected];
  crop.zoom = Math.min(2.5, Math.max(0.8, crop.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
  $('sl-zoom').value = String(Math.round(((crop.zoom - 0.8) / 1.7) * 100));
  $('v-zoom').textContent = $('sl-zoom').value;
  redraw();
}, { passive: false });

// ---------------------------------------------------------------- export

function downloadPNG(w, h) {
  return new Promise((resolve) => {
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    drawCover(off, state);
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `bay-of-light-${w}x${h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(`${w}x${h}`);
    }, 'image/png');
  });
}

async function exportAll() {
  if (!state.photos.length) {
    status.textContent = 'Load a photo first — try "Load sample photos".';
    return;
  }
  const sizes = [[1080, 1080], [1080, 1350], [1920, 1080]];
  const done = [];
  for (const [w, h] of sizes) {
    done.push(await downloadPNG(w, h));
    await new Promise((r) => setTimeout(r, 150));
  }
  window.__exported = done;
  status.textContent = `Exported ${done.join(', ')} — bay-of-light-*.png.`;
}

$('export-all').addEventListener('click', exportAll);
$('export-one').addEventListener('click', async () => {
  if (!state.photos.length) {
    status.textContent = 'Load a photo first — try "Load sample photos".';
    return;
  }
  const [w, h] = state.exportSize.split('x').map(Number);
  const name = await downloadPNG(w, h);
  window.__exported = [name];
  status.textContent = `Exported ${name} — bay-of-light-${name}.png.`;
});

// ---------------------------------------------------------------- sync + boot

function syncAllUI() {
  $('in-title').value = state.title;
  $('in-script').value = state.script;
  $('in-tagline').value = state.tagline;
  $('in-quote').value = state.quote;
  for (const [id, key] of [['sl-paint', 'paint'], ['sl-grade', 'intensity'], ['sl-halftone', 'halftone'], ['sl-grain', 'grain'], ['sl-glow', 'glow']]) {
    $(id).value = String(state[key]);
    $(`v-${id.slice(3)}`).textContent = String(state[key]);
  }
  document.querySelectorAll('.theme-card').forEach((c) => c.classList.toggle('active', c.dataset.theme === state.theme));
  document.querySelectorAll('#grade-pick .pick-btn').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  document.querySelectorAll('#layout-pick .pick-btn').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('active', b.dataset.size === state.exportSize));
  const [w, h] = state.exportSize.split('x').map(Number);
  canvas.width = w;
  canvas.height = h;
  buildPanelChips();
  rebuildThumbs();
}

async function waitFonts() {
  try {
    await Promise.all([document.fonts.load('40px Anton'), document.fonts.load('40px Pacifico')]);
    await document.fonts.ready;
  } catch { /* fall back to system fonts */ }
}

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, async (sample, text) => {
    // Shot scenes pick their own look from the query: a cover shot is
    // Teluk Sunset / Harbor Six, a portrait cover Neon Night, the editor
    // shot keeps the defaults.
    const theme = query.get('theme') ?? (shot === 'cover' ? 'sunset' : state.theme);
    const grade = query.get('grade') ?? (shot === 'cover' ? 'sunset' : state.grade);
    const layout = query.get('layout') ?? state.layout;
    const w = Number(query.get('w') ?? (shot === 'cover' ? 1920 : 1080));
    const h = Number(query.get('h') ?? (shot === 'cover' ? 1080 : 1350));
    canvas.width = w;
    canvas.height = h;
    setLayout(layout);
    state.theme = theme;
    document.querySelectorAll('.theme-card').forEach((c) => c.classList.toggle('active', c.dataset.theme === theme));
    setGrade(grade, false);
    state.title = (query.get('caption') ?? text ?? 'BAY OF LIGHT').toUpperCase();
    $('in-title').value = state.title;
    await loadSamples();
    if (shot === 'editor') goStep(2);
    await waitFonts();
    redraw();
  });
} else {
  buildPanelChips();
  syncHistoryButtons();
  waitFonts().then(redraw);
  redraw();
}
