// Bay of Light Cover Studio — the editor.
//
// Owns the state (words, theme, layout, grade, sliders, per-panel crops),
// builds the pickers, wires every control, and paints the preview through
// cover.js. Photos are read locally and never uploaded anywhere. A `?shot=`
// query hands control to shots.js instead, for the fixed screenshot scenes.

import { drawCover, GRADES, THEMES, LAYOUTS, ROLES, layoutPanels, PANEL_ZOOM } from './cover.js';
import { runShot } from './shots.js';

// ---------------------------------------------------------------- state

const SURPRISE_PAIRS = [
  ['DERMAGA NIGHTS', 'after dark'],
  ['CAHAYA NIGHTS', 'one last summer'],
  ['SALT & SIRENS', 'tide is turning'],
  ['TELUK LIGHTS', 'no curfew'],
];

const SAMPLE_FILES = ['harbor-man.jpg', 'harbor-woman.jpg', 'harbor-rider.jpg'];
const EXPORT_SIZES = [
  [1080, 1080],
  [1080, 1350],
  [1920, 1080],
];

// One slot per panel position (seven at most). `role` is null until the
// user renames a panel; the layout then supplies the default role.
function freshPanels() {
  return Array.from({ length: 7 }, () => ({
    photo: 0,
    ox: 0,
    oy: 0,
    zoom: 1,
    flip: false,
    role: null,
    roleName: null,
    sub: null,
  }));
}

let state = {
  title: 'BAY OF LIGHT',
  script: 'one last summer',
  tagline: 'SIX LIVES · ONE BAY · NO WAY BACK',
  quote: 'PURE GOLDEN-HOUR MAYHEM',
  theme: 'sunset',
  grade: 'sunset',
  layout: 'harbor',
  paint: 50,
  intensity: 85,
  halftone: 0,
  grain: 25,
  glow: 40,
  exportSize: '1080x1350',
  selected: 0,
  extras: { tags: true, heat: true, seal: true },
  panels: freshPanels(),
};

let photos = []; // loaded Image objects, in load order
let fontsReady = false;

// ---------------------------------------------------------------- elements

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const statusEl = $('status');

// ---------------------------------------------------------------- history

const undoStack = [];
const redoStack = [];
const MAX_HISTORY = 40;

function snapshot() {
  return JSON.stringify(state);
}

function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack.length = 0;
  syncHistoryButtons();
}

function restore(json) {
  state = JSON.parse(json);
  syncAll();
  draw();
}

function syncHistoryButtons() {
  $('btnUndo').disabled = undoStack.length === 0;
  $('btnRedo').disabled = redoStack.length === 0;
}

$('btnUndo').addEventListener('click', () => {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  syncHistoryButtons();
});
$('btnRedo').addEventListener('click', () => {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  syncHistoryButtons();
});

// ---------------------------------------------------------------- drawing

function panelCount() {
  return layoutPanels(state.layout, canvas.width, canvas.height).panels.length;
}

function currentPanels() {
  return layoutPanels(state.layout, canvas.width, canvas.height).panels;
}

function coverOpts() {
  return {
    photos,
    title: state.title,
    script: state.script,
    tagline: state.tagline,
    quote: state.quote,
    gradeId: state.grade,
    layoutId: state.layout,
    intensity: state.intensity,
    paint: state.paint,
    halftone: state.halftone,
    grain: state.grain,
    glow: state.glow,
    extras: state.extras,
    panels: state.panels,
  };
}

async function ensureFonts() {
  if (fontsReady) return;
  try {
    await Promise.all([
      document.fonts.load('16px Anton'),
      document.fonts.load('16px Pacifico'),
      document.fonts.ready,
    ]);
  } catch {
    // The cover still draws with the fallback font; the words matter more
    // than the exact face when a font file cannot load.
  }
  fontsReady = true;
}

async function draw() {
  await ensureFonts();
  drawCover(canvas, coverOpts());
  drawThumbs();
  syncPanelUI();
}

function setStatus(text) {
  statusEl.textContent = text;
}

// ---------------------------------------------------------------- pickers

function buildPickers() {
  const themeBox = $('themePicker');
  themeBox.innerHTML = '';
  THEMES.forEach((t) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'theme-card';
    card.dataset.theme = t.id;
    card.innerHTML =
      `<span class="swatch" style="background:linear-gradient(90deg, ${t.swatches.join(', ')})"></span>` +
      `<span class="theme-name">${t.name}</span>` +
      `<span class="theme-mood">${t.mood}</span>`;
    card.addEventListener('click', () => {
      pushHistory();
      state.theme = t.id;
      state.grade = t.grade;
      syncAll();
      draw();
    });
    themeBox.appendChild(card);
  });

  const layoutBox = $('layoutPicker');
  layoutBox.innerHTML = '';
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = l.name;
    b.dataset.layout = l.id;
    b.addEventListener('click', () => {
      pushHistory();
      state.layout = l.id;
      state.selected = Math.min(state.selected, panelCount() - 1);
      syncAll();
      draw();
    });
    layoutBox.appendChild(b);
  });

  const gradeBox = $('gradePicker');
  gradeBox.innerHTML = '';
  Object.entries(GRADES).forEach(([id, g]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = g.name;
    b.dataset.grade = id;
    b.addEventListener('click', () => {
      pushHistory();
      state.grade = id;
      const match = THEMES.find((t) => t.grade === id);
      state.theme = match ? match.id : null;
      syncAll();
      draw();
    });
    gradeBox.appendChild(b);
  });
}

function syncPickers() {
  document.querySelectorAll('#themePicker .theme-card').forEach((el) => {
    el.classList.toggle('active', el.dataset.theme === state.theme);
  });
  document.querySelectorAll('#layoutPicker button').forEach((el) => {
    el.classList.toggle('active', el.dataset.layout === state.layout);
  });
  document.querySelectorAll('#gradePicker button').forEach((el) => {
    el.classList.toggle('active', el.dataset.grade === state.grade);
  });
  document.querySelectorAll('#sizePicker button').forEach((el) => {
    el.classList.toggle('active', el.dataset.size === state.exportSize);
  });
}

// ---------------------------------------------------------------- wizard

function showStep(n) {
  document.querySelectorAll('.step-nav button').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.step) === n);
  });
  [1, 2, 3].forEach((i) => {
    $('step-' + i).classList.toggle('hidden', i !== n);
  });
}

document.querySelectorAll('.step-nav button').forEach((b) => {
  b.addEventListener('click', () => showStep(Number(b.dataset.step)));
});

// ---------------------------------------------------------------- text + sliders

function bindText(id, key) {
  $(id).addEventListener('input', (e) => {
    state[key] = e.target.value;
    draw();
  });
}
bindText('inTitle', 'title');
bindText('inScript', 'script');
bindText('inTagline', 'tagline');
bindText('inQuote', 'quote');

function bindSlider(id, valId, key) {
  $(id).addEventListener('input', (e) => {
    state[key] = Number(e.target.value);
    $(valId).textContent = e.target.value;
    draw();
  });
}
bindSlider('slPaint', 'valPaint', 'paint');
bindSlider('slGrade', 'valGrade', 'intensity');
bindSlider('slHalftone', 'valHalftone', 'halftone');
bindSlider('slGrain', 'valGrain', 'grain');
bindSlider('slGlow', 'valGlow', 'glow');

function bindExtra(id, key) {
  $(id).addEventListener('change', (e) => {
    pushHistory();
    state.extras[key] = e.target.checked;
    draw();
  });
}
bindExtra('exTags', 'tags');
bindExtra('exHeat', 'heat');
bindExtra('exSeal', 'seal');

// ---------------------------------------------------------------- photos

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function drawThumbs() {
  const box = $('thumbs');
  box.innerHTML = '';
  photos.forEach((img, i) => {
    const t = document.createElement('canvas');
    t.width = 72;
    t.height = 96;
    const tctx = t.getContext('2d');
    const s = Math.max(72 / img.naturalWidth, 96 / img.naturalHeight);
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    tctx.drawImage(img, (72 - dw) / 2, (96 - dh) / 2, dw, dh);
    t.title = `Photo ${i + 1} — click to put it in the selected panel`;
    t.addEventListener('click', () => {
      pushHistory();
      state.panels[state.selected].photo = i;
      draw();
    });
    box.appendChild(t);
  });
  $('photoCount').textContent =
    photos.length === 0 ? 'No photos yet.' : `${photos.length} photo${photos.length > 1 ? 's' : ''} loaded.`;
}

async function addFiles(files) {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  if (!images.length) return;
  pushHistory();
  const firstLoad = photos.length === 0;
  for (const file of images) {
    try {
      photos.push(await loadImage(URL.createObjectURL(file)));
    } catch {
      // A file that is not a readable image is skipped, not fatal.
    }
  }
  if (firstLoad && photos.length) {
    state.panels.forEach((p) => {
      p.photo = 0;
    });
  }
  setStatus(`${photos.length} photo${photos.length > 1 ? 's' : ''} loaded.`);
  draw();
}

async function loadSamples() {
  pushHistory();
  photos = [];
  for (const name of SAMPLE_FILES) {
    try {
      photos.push(await loadImage(`samples/${name}`));
    } catch {
      // A missing sample is skipped; the rest still load.
    }
  }
  state.panels.forEach((p, i) => {
    p.photo = photos.length ? i % photos.length : 0;
  });
  setStatus(
    photos.length
      ? `${photos.length} sample photos loaded — one photo fills every panel with a smart crop.`
      : 'Sample photos could not be loaded.',
  );
  draw();
}

$('btnSamples').addEventListener('click', loadSamples);

$('btnAuto').addEventListener('click', () => {
  pushHistory();
  // Pick the layout whose panel count sits closest to the photo count.
  const n = Math.max(photos.length, 1);
  let best = LAYOUTS[0].id;
  let bestGap = Infinity;
  LAYOUTS.forEach((l) => {
    const count = layoutPanels(l.id, canvas.width, canvas.height).panels.length;
    const gap = Math.abs(count - n);
    if (gap < bestGap) {
      bestGap = gap;
      best = l.id;
    }
  });
  state.layout = best;
  state.selected = 0;
  syncAll();
  draw();
  setStatus(`Auto layout: ${LAYOUTS.find((l) => l.id === best).name}.`);
});

$('btnSurprise').addEventListener('click', () => {
  pushHistory();
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  state.layout = pick(LAYOUTS).id;
  const gradeIds = Object.keys(GRADES);
  state.grade = pick(gradeIds);
  const match = THEMES.find((t) => t.grade === state.grade);
  state.theme = match ? match.id : null;
  const pair = pick(SURPRISE_PAIRS);
  state.title = pair[0];
  state.script = pair[1];
  state.selected = 0;
  syncAll();
  draw();
  setStatus(`Surprise: ${state.title} — ${state.layout} in ${GRADES[state.grade].name}.`);
});

// Drop zone: click to browse, drag-drop, paste from the clipboard.
const dropzone = $('dropzone');
dropzone.addEventListener('click', () => $('fileInput').click());
dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') $('fileInput').click();
});
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  addFiles(e.dataTransfer.files);
});
$('fileInput').addEventListener('change', (e) => {
  addFiles(e.target.files);
  e.target.value = '';
});
document.addEventListener('paste', (e) => {
  const files = [...(e.clipboardData?.files ?? [])];
  if (files.length) addFiles(files);
});

// ---------------------------------------------------------------- panel editing

function selectedSlot() {
  return state.panels[state.selected];
}

function effectiveRole(i) {
  const panels = currentPanels();
  const slot = state.panels[i];
  const role = ROLES[slot.role ?? panels[i].role];
  return { name: slot.roleName ?? role.name, sub: slot.sub ?? role.sub };
}

function syncPanelUI() {
  const n = panelCount();
  if (state.selected >= n) state.selected = n - 1;
  const role = effectiveRole(state.selected);
  $('panelLabel').textContent = `Panel ${state.selected + 1} — ${role.name}`;
  const chips = $('panelChips');
  chips.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = String(i + 1);
    if (i === state.selected) b.classList.add('active');
    b.addEventListener('click', () => {
      state.selected = i;
      syncPanelUI();
    });
    chips.appendChild(b);
  }
  const slot = selectedSlot();
  const zoomVal = Math.round(((slot.zoom - 0.8) / 1.7) * 100);
  $('slZoom').value = String(Math.min(100, Math.max(0, zoomVal)));
  $('valZoom').textContent = String(Math.min(100, Math.max(0, zoomVal)));
  if (document.activeElement !== $('inRole')) $('inRole').value = role.name;
  if (document.activeElement !== $('inSub')) $('inSub').value = role.sub;
}

$('slZoom').addEventListener('input', (e) => {
  selectedSlot().zoom = 0.8 + (Number(e.target.value) / 100) * 1.7;
  $('valZoom').textContent = e.target.value;
  draw();
});
$('inRole').addEventListener('input', (e) => {
  selectedSlot().roleName = e.target.value.toUpperCase();
  draw();
});
$('inSub').addEventListener('input', (e) => {
  selectedSlot().sub = e.target.value.toUpperCase();
  draw();
});
$('btnFlip').addEventListener('click', () => {
  pushHistory();
  const slot = selectedSlot();
  slot.flip = !slot.flip;
  draw();
});
$('btnFace').addEventListener('click', () => {
  pushHistory();
  const slot = selectedSlot();
  slot.ox = 0;
  slot.oy = 0;
  slot.zoom = Math.max(slot.zoom, 1.3 / PANEL_ZOOM[state.selected % PANEL_ZOOM.length]);
  draw();
});
$('btnSwap').addEventListener('click', () => {
  pushHistory();
  const n = panelCount();
  const next = (state.selected + 1) % n;
  const a = state.panels[state.selected];
  const b = state.panels[next];
  const photo = a.photo;
  a.photo = b.photo;
  b.photo = photo;
  state.selected = next;
  draw();
});
$('btnResetCrop').addEventListener('click', () => {
  pushHistory();
  const slot = selectedSlot();
  slot.ox = 0;
  slot.oy = 0;
  slot.zoom = 1;
  slot.flip = false;
  draw();
});

// Canvas interaction: click selects a panel, drag pans its photo, the
// wheel zooms it (0.8 to 2.5, a factor of 1.08 up and 0.92 down).
let drag = null;

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function hitPanel(pt) {
  const panels = currentPanels();
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (pt.x >= p.x && pt.x <= p.x + p.w + p.skew && pt.y >= p.y && pt.y <= p.y + p.h) return i;
  }
  return -1;
}

canvas.addEventListener('pointerdown', (e) => {
  const pt = canvasPoint(e);
  const i = hitPanel(pt);
  if (i < 0) return;
  state.selected = i;
  canvas.classList.add('dragging');
  canvas.setPointerCapture(e.pointerId);
  drag = { x: pt.x, y: pt.y, ox: selectedSlot().ox, oy: selectedSlot().oy };
  syncPanelUI();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const pt = canvasPoint(e);
  const slot = selectedSlot();
  const p = currentPanels()[state.selected];
  slot.ox = Math.max(-p.w, Math.min(p.w, drag.ox + (pt.x - drag.x)));
  slot.oy = Math.max(-p.h, Math.min(p.h, drag.oy + (pt.y - drag.y)));
  draw();
});
canvas.addEventListener('pointerup', () => {
  if (drag) pushHistory();
  drag = null;
  canvas.classList.remove('dragging');
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const pt = canvasPoint(e);
  const i = hitPanel(pt);
  if (i < 0) return;
  state.selected = i;
  const slot = selectedSlot();
  slot.zoom = Math.min(2.5, Math.max(0.8, slot.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
  syncPanelUI();
  draw();
}, { passive: false });

// ---------------------------------------------------------------- export

function setCanvasSize(w, h) {
  canvas.width = w;
  canvas.height = h;
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function exportPNG(w, h) {
  return new Promise((resolve) => {
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    drawCover(off, coverOpts());
    off.toBlob((blob) => {
      if (blob) downloadBlob(blob, `bay-of-light-${w}x${h}.png`);
      resolve(!!blob);
    }, 'image/png');
  });
}

document.querySelectorAll('#sizePicker button').forEach((b) => {
  b.addEventListener('click', () => {
    state.exportSize = b.dataset.size;
    const [w, h] = state.exportSize.split('x').map(Number);
    setCanvasSize(w, h);
    syncPickers();
    draw();
  });
});

$('btnExportOne').addEventListener('click', async () => {
  if (!photos.length) {
    setStatus('Load a photo first — there is nothing to export yet.');
    return;
  }
  const [w, h] = state.exportSize.split('x').map(Number);
  await exportPNG(w, h);
  setStatus(`Exported bay-of-light-${w}x${h}.png.`);
});

$('btnExportAll').addEventListener('click', async () => {
  if (!photos.length) {
    setStatus('Load a photo first — there is nothing to export yet.');
    return;
  }
  const done = [];
  for (const [w, h] of EXPORT_SIZES) {
    if (await exportPNG(w, h)) done.push(`${w}x${h}`);
    await new Promise((r) => setTimeout(r, 150));
  }
  window.__exported = done;
  setStatus(`Exported all three: ${done.map((s) => `bay-of-light-${s}.png`).join(', ')}.`);
});

// ---------------------------------------------------------------- sync + boot

function syncAll() {
  $('inTitle').value = state.title;
  $('inScript').value = state.script;
  $('inTagline').value = state.tagline;
  $('inQuote').value = state.quote;
  $('slPaint').value = String(state.paint);
  $('valPaint').textContent = String(state.paint);
  $('slGrade').value = String(state.intensity);
  $('valGrade').textContent = String(state.intensity);
  $('slHalftone').value = String(state.halftone);
  $('valHalftone').textContent = String(state.halftone);
  $('slGrain').value = String(state.grain);
  $('valGrain').textContent = String(state.grain);
  $('slGlow').value = String(state.glow);
  $('valGlow').textContent = String(state.glow);
  $('exTags').checked = state.extras.tags;
  $('exHeat').checked = state.extras.heat;
  $('exSeal').checked = state.extras.seal;
  syncPickers();
  syncPanelUI();
  syncHistoryButtons();
}

buildPickers();
syncAll();

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, {
    setCanvasSize: (w, h) => setCanvasSize(w, h),
    setTheme: (id) => {
      const t = THEMES.find((x) => x.id === id);
      if (!t) return;
      state.theme = t.id;
      state.grade = t.grade;
      syncAll();
    },
    setLayout: (id) => {
      if (!LAYOUTS.some((l) => l.id === id)) return;
      state.layout = id;
      syncAll();
    },
    setGrade: (id) => {
      if (!GRADES[id]) return;
      state.grade = id;
      const match = THEMES.find((t) => t.grade === id);
      state.theme = match ? match.id : null;
      syncAll();
    },
    setCaption: (text) => {
      state.title = text;
      syncAll();
    },
    loadSamples,
    showStep,
    draw,
  });
} else {
  draw();
}
