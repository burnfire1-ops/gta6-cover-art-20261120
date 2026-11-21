// Bay of Light Cover Studio — editor logic: state, wizard, pickers, sliders,
// panel editing, history, export and the ?shot= screenshot scenes.
// The cover itself is drawn by ./cover.js; this file only drives it.
import { drawCover, layoutPanels, pointInPoly, THEMES, THEME_NAMES, GRADES, GRADE_NAMES, LAYOUTS, LAYOUT_NAMES, ROLES, SUBLINES, FOCUS, ZOOMS, SURPRISES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const SIZES = ['1080x1080', '1080x1350', '1920x1080'];

function freshPanels() {
  return ROLES.map((_, i) => ({
    photo: 0,
    fx: FOCUS[i][0],
    fy: FOCUS[i][1],
    zoom: ZOOMS[i],
    flip: false,
    ox: 0,
    oy: 0,
    role: ROLES[i],
    sub: SUBLINES[i],
  }));
}

const state = {
  theme: 'Teluk Sunset',
  grade: 'Teluk Sunset',
  layout: 'Harbor Six',
  title: 'BAY OF LIGHT',
  script: 'one last summer',
  tagline: 'SIX LIVES · ONE BAY · NO WAY BACK',
  quote: 'PURE GOLDEN-HOUR MAYHEM',
  sliders: { paint: 50, grade: 85, halftone: 0, grain: 25, glow: 40 },
  panels: freshPanels(),
  selected: 0,
  exportSize: '1080x1350',
  photos: [],
};

let undoStack = [];
let redoStack = [];

function snapshot() {
  const { photos, ...rest } = state;
  return JSON.stringify({ ...rest, photoCount: photos.length });
}
function restore(json) {
  const data = JSON.parse(json);
  delete data.photoCount;
  Object.assign(state, data);
  state.panels = data.panels;
}
function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
  syncHistoryButtons();
}
function syncHistoryButtons() {
  document.getElementById('undoBtn').disabled = undoStack.length === 0;
  document.getElementById('redoBtn').disabled = redoStack.length === 0;
}
function doUndo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  syncAll();
  redraw();
  syncHistoryButtons();
}
function doRedo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  syncAll();
  redraw();
  syncHistoryButtons();
}
document.getElementById('undoBtn').addEventListener('click', doUndo);
document.getElementById('redoBtn').addEventListener('click', doRedo);

function redraw() {
  drawCover(canvas, state);
}

function setStatus(text) {
  statusEl.textContent = text;
}

// ---------------------------------------------------------------- wizard

const stepTabs = [...document.querySelectorAll('.step-tab')];
const stepSections = [...document.querySelectorAll('.step')];
function showStep(n) {
  stepTabs.forEach((b) => b.classList.toggle('active', b.dataset.step === String(n)));
  stepSections.forEach((s) => { s.hidden = s.dataset.step !== String(n); });
}
stepTabs.forEach((b) => b.addEventListener('click', () => showStep(+b.dataset.step)));

// ---------------------------------------------------------------- pickers

const themeWrap = document.getElementById('themeCards');
THEME_NAMES.forEach((name) => {
  const t = THEMES[name];
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'theme-card';
  card.dataset.theme = name;
  card.innerHTML = `<span class="swatch" style="display:block;background:linear-gradient(90deg,${t.swatches.join(',')})"></span>`
    + `<span class="tname">${name}</span><span class="tmood">${t.mood}</span>`;
  card.addEventListener('click', () => {
    pushHistory();
    state.theme = name;
    state.grade = t.grade;
    syncPickers();
    redraw();
  });
  themeWrap.appendChild(card);
});

const layoutWrap = document.getElementById('layoutBtns');
LAYOUT_NAMES.forEach((name) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = name;
  b.dataset.layout = name;
  b.addEventListener('click', () => {
    pushHistory();
    state.layout = name;
    state.selected = 0;
    syncPickers();
    syncPanelUI();
    redraw();
  });
  layoutWrap.appendChild(b);
});

const gradeWrap = document.getElementById('gradeBtns');
GRADE_NAMES.forEach((name) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = name;
  b.dataset.grade = name;
  b.addEventListener('click', () => {
    pushHistory();
    state.grade = name;
    syncPickers();
    redraw();
  });
  gradeWrap.appendChild(b);
});

function syncPickers() {
  themeWrap.querySelectorAll('.theme-card').forEach((c) => {
    c.classList.toggle('active', c.dataset.theme === state.theme);
  });
  layoutWrap.querySelectorAll('button').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  gradeWrap.querySelectorAll('button').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
}

// ---------------------------------------------------------------- text + sliders

function bindText(id, key, upper) {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    state[key] = upper ? el.value.toUpperCase() : el.value;
    redraw();
  });
  // Snapshot before the first keystroke, so undo returns to the old text.
  el.addEventListener('focus', () => pushHistory());
}
bindText('titleInput', 'title', true);
bindText('scriptInput', 'script', false);
bindText('taglineInput', 'tagline', true);
bindText('quoteInput', 'quote', true);

const sliderDefs = [
  ['sliderPaint', 'paintVal', 'paint'],
  ['sliderGrade', 'gradeVal', 'grade'],
  ['sliderHalftone', 'halftoneVal', 'halftone'],
  ['sliderGrain', 'grainVal', 'grain'],
  ['sliderGlow', 'glowVal', 'glow'],
];
sliderDefs.forEach(([id, valId, key]) => {
  const el = document.getElementById(id);
  const val = document.getElementById(valId);
  el.addEventListener('input', () => {
    state.sliders[key] = +el.value;
    val.textContent = el.value;
    redraw();
  });
  // Snapshot on first grab, before the slider moves.
  el.addEventListener('pointerdown', () => pushHistory());
  el.addEventListener('focus', () => pushHistory());
});

// ---------------------------------------------------------------- photos

const thumbsEl = document.getElementById('thumbs');
const photoCountEl = document.getElementById('photoCount');

function assignPanelPhotos() {
  const n = Math.max(1, state.photos.length);
  state.panels.forEach((p, i) => {
    const roleIdx = ROLES.indexOf(p.role);
    p.photo = (roleIdx === -1 ? i : roleIdx) % n;
  });
}

function syncThumbs() {
  thumbsEl.innerHTML = '';
  state.photos.forEach((p, i) => {
    const c = document.createElement('canvas');
    c.width = 72;
    c.height = 96;
    const g = c.getContext('2d');
    const s = Math.max(72 / p.img.naturalWidth, 96 / p.img.naturalHeight);
    const dw = p.img.naturalWidth * s;
    const dh = p.img.naturalHeight * s;
    g.drawImage(p.img, (72 - dw) / 2, (96 - dh) / 2, dw, dh);
    c.title = p.name;
    c.addEventListener('click', () => {
      pushHistory();
      state.panels[state.selected].photo = i;
      state.panels[state.selected].ox = 0;
      state.panels[state.selected].oy = 0;
      redraw();
    });
    thumbsEl.appendChild(c);
  });
  photoCountEl.textContent = `${state.photos.length} photo${state.photos.length === 1 ? '' : 's'}`;
}

async function addPhotos(files) {
  for (const file of files) {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      state.photos.push({ img, name: file.name || 'photo' });
    } catch {
      setStatus('That file could not be read as an image.');
    }
  }
  assignPanelPhotos();
  syncThumbs();
  redraw();
}

async function loadSamples() {
  const names = ['harbor-man', 'harbor-woman', 'harbor-rider'];
  for (const name of names) {
    if (state.photos.some((p) => p.name === name)) continue;
    const img = await loadImage(`samples/${name}.jpg`);
    state.photos.push({ img, name });
  }
  assignPanelPhotos();
  syncThumbs();
  redraw();
  setStatus('Sample photos loaded — a fictional cast of three. Edit the caption, pick a look, export.');
}

document.getElementById('btnSamples').addEventListener('click', () => { pushHistory(); loadSamples(); });
document.getElementById('btnAuto').addEventListener('click', () => {
  pushHistory();
  state.layout = LAYOUT_NAMES[Math.floor(Math.random() * LAYOUT_NAMES.length)];
  state.selected = 0;
  syncPickers();
  syncPanelUI();
  redraw();
});
document.getElementById('btnSurprise').addEventListener('click', () => {
  pushHistory();
  state.layout = LAYOUT_NAMES[Math.floor(Math.random() * LAYOUT_NAMES.length)];
  state.grade = GRADE_NAMES[Math.floor(Math.random() * GRADE_NAMES.length)];
  const [title, script] = SURPRISES[Math.floor(Math.random() * SURPRISES.length)];
  state.title = title;
  state.script = script;
  document.getElementById('titleInput').value = title;
  document.getElementById('scriptInput').value = script;
  state.selected = 0;
  syncPickers();
  syncPanelUI();
  redraw();
});

// Drop zone: click to browse, drag-drop, paste.
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  pushHistory();
  addPhotos([...fileInput.files]);
  fileInput.value = '';
});
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  pushHistory();
  addPhotos([...e.dataTransfer.files].filter((f) => f.type.startsWith('image/')));
});
document.addEventListener('paste', (e) => {
  const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
  if (files.length) {
    pushHistory();
    addPhotos(files);
  }
});

// ---------------------------------------------------------------- panel editing

const panelLabel = document.getElementById('panelLabel');
const panelChips = document.getElementById('panelChips');
const zoomSlider = document.getElementById('zoomSlider');
const zoomVal = document.getElementById('zoomVal');
const roleInput = document.getElementById('roleInput');
const subInput = document.getElementById('subInput');

function currentPanels() {
  return layoutPanels(state.layout, canvas.width, canvas.height).panels;
}

function syncPanelUI() {
  const panels = currentPanels();
  panelChips.innerHTML = '';
  panels.forEach((panel, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `${i + 1}`;
    b.title = state.panels[i].role;
    b.classList.toggle('active', i === state.selected);
    b.addEventListener('click', () => {
      state.selected = i;
      syncPanelUI();
    });
    panelChips.appendChild(b);
  });
  const p = state.panels[state.selected];
  panelLabel.textContent = `Panel ${state.selected + 1} — ${p.role}`;
  zoomSlider.value = String(Math.round(((p.zoom - 0.8) / 1.7) * 100));
  zoomVal.textContent = String(Math.round(((p.zoom - 0.8) / 1.7) * 100));
  roleInput.value = p.role;
  subInput.value = p.sub;
}

zoomSlider.addEventListener('input', () => {
  const p = state.panels[state.selected];
  p.zoom = 0.8 + (+zoomSlider.value / 100) * 1.7;
  zoomVal.textContent = zoomSlider.value;
  redraw();
});
zoomSlider.addEventListener('pointerdown', () => pushHistory());

roleInput.addEventListener('input', () => {
  state.panels[state.selected].role = roleInput.value.toUpperCase();
  panelLabel.textContent = `Panel ${state.selected + 1} — ${state.panels[state.selected].role}`;
  redraw();
});
roleInput.addEventListener('focus', () => pushHistory());
subInput.addEventListener('input', () => {
  state.panels[state.selected].sub = subInput.value.toUpperCase();
  redraw();
});
subInput.addEventListener('focus', () => pushHistory());

document.getElementById('btnFlip').addEventListener('click', () => {
  pushHistory();
  const p = state.panels[state.selected];
  p.flip = !p.flip;
  redraw();
});
document.getElementById('btnFace').addEventListener('click', () => {
  pushHistory();
  const p = state.panels[state.selected];
  p.fx = 0.5;
  p.fy = 0.28;
  p.zoom = Math.max(1.3, p.zoom);
  p.ox = 0;
  p.oy = 0;
  syncPanelUI();
  redraw();
});
document.getElementById('btnSwap').addEventListener('click', () => {
  pushHistory();
  const panels = state.panels;
  const next = (state.selected + 1) % currentPanels().length;
  [panels[state.selected].photo, panels[next].photo] = [panels[next].photo, panels[state.selected].photo];
  redraw();
});
document.getElementById('btnResetCrop').addEventListener('click', () => {
  pushHistory();
  const i = state.selected;
  state.panels[i].fx = FOCUS[i][0];
  state.panels[i].fy = FOCUS[i][1];
  state.panels[i].zoom = ZOOMS[i];
  state.panels[i].flip = false;
  state.panels[i].ox = 0;
  state.panels[i].oy = 0;
  syncPanelUI();
  redraw();
});

// Canvas pointer: click selects a panel, drag moves its photo, wheel zooms it.
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const pt = canvasPoint(e);
  const panels = currentPanels();
  const hit = panels.findIndex((p) => pointInPoly(pt.x, pt.y, p.poly));
  if (hit === -1) return;
  state.selected = hit;
  syncPanelUI();
  pushHistory();
  drag = { x: pt.x, y: pt.y, panel: panels[hit] };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const pt = canvasPoint(e);
  const p = state.panels[state.selected];
  p.ox += (pt.x - drag.x) / drag.panel.w;
  p.oy += (pt.y - drag.y) / drag.panel.h;
  p.ox = Math.max(-0.6, Math.min(0.6, p.ox));
  p.oy = Math.max(-0.6, Math.min(0.6, p.oy));
  drag = { x: pt.x, y: pt.y, panel: drag.panel };
  redraw();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = state.panels[state.selected];
  p.zoom = Math.max(0.8, Math.min(2.5, p.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
  syncPanelUI();
  redraw();
}, { passive: false });

// ---------------------------------------------------------------- export

function applySize(size) {
  const [w, h] = size.split('x').map(Number);
  canvas.width = w;
  canvas.height = h;
}

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function exportOne(size) {
  return new Promise((resolve) => {
    const [w, h] = size.split('x').map(Number);
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    drawCover(off, state);
    off.toBlob((blob) => {
      if (blob) download(blob, `bay-of-light-${size}.png`);
      resolve(!!blob);
    }, 'image/png');
  });
}

document.querySelectorAll('#sizeBtns button').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#sizeBtns button').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    state.exportSize = b.dataset.size;
    applySize(state.exportSize);
    redraw();
  });
});

function needPhotos() {
  if (state.photos.length) return false;
  setStatus('Load a photo first — try “Load sample photos”.');
  return true;
}

document.getElementById('btnExportOne').addEventListener('click', async () => {
  if (needPhotos()) return;
  await exportOne(state.exportSize);
  setStatus(`Exported bay-of-light-${state.exportSize}.png`);
});
document.getElementById('btnExportAll').addEventListener('click', async () => {
  if (needPhotos()) return;
  const done = [];
  for (const size of SIZES) {
    await exportOne(size);
    done.push(size);
    await new Promise((r) => setTimeout(r, 150));
  }
  window.__exported = done;
  setStatus('Exported all three sizes.');
});

// ---------------------------------------------------------------- boot + shots

function syncAll() {
  document.getElementById('titleInput').value = state.title;
  document.getElementById('scriptInput').value = state.script;
  document.getElementById('taglineInput').value = state.tagline;
  document.getElementById('quoteInput').value = state.quote;
  sliderDefs.forEach(([id, valId, key]) => {
    document.getElementById(id).value = String(state.sliders[key]);
    document.getElementById(valId).textContent = String(state.sliders[key]);
  });
  document.querySelectorAll('#sizeBtns button').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.exportSize);
  });
  applySize(state.exportSize);
  syncPickers();
  syncPanelUI();
  syncThumbs();
}

async function boot() {
  await Promise.all([
    document.fonts.load('16px Anton'),
    document.fonts.load('16px Pacifico'),
  ]).catch(() => {});
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    await runShot(shot, params, async (_sample, caption, opts) => {
      await loadSamples();
      if (caption) {
        state.title = caption.toUpperCase();
        document.getElementById('titleInput').value = state.title;
      }
      if (opts?.theme && THEMES[opts.theme]) {
        state.theme = opts.theme;
        state.grade = THEMES[opts.theme].grade;
      }
      if (opts?.layout && LAYOUTS[opts.layout]) state.layout = opts.layout;
      if (opts?.grade && GRADES[opts.grade]) state.grade = opts.grade;
      const size = params.get('size');
      if (size && SIZES.includes(size)) {
        state.exportSize = size;
        document.querySelectorAll('#sizeBtns button').forEach((b) => {
          b.classList.toggle('active', b.dataset.size === size);
        });
      }
      if (shot === 'editor') showStep(2);
      syncPickers();
      syncPanelUI();
      applySize(state.exportSize);
      redraw();
    });
  } else {
    syncAll();
    redraw();
  }
}

boot();
