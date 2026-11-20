// Bay of Light Cover Studio — UI: 3-step wizard, live canvas preview (drag to pan,
// scroll to zoom), per-panel controls, undo/redo, one-click export of all three sizes.
// Photos never leave the machine: FileReader + object URLs only, no upload.
import { drawCover, layoutPanels, LAYOUT_NAMES, GRADES, THEMES, ROLES, SUBS } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const SIZES = [[1080, 1080], [1080, 1350], [1920, 1080]];
const FOCALS = [[0.5, 0.28], [0.5, 0.45], [0.32, 0.35], [0.68, 0.38], [0.5, 0.6], [0.5, 0.3], [0.5, 0.5]];
const ZOOMS = [1.35, 1.15, 1.5, 1.4, 1.25, 1.6, 1.2];

const state = {
  images: [], panels: [], layout: 'harbor6', grade: 'sunset',
  title: 'BAY OF LIGHT', script: 'one last summer', tagline: 'SIX LIVES · ONE BAY · NO WAY BACK',
  quote: 'PURE GOLDEN-HOUR MAYHEM',
  sliders: { paint: 50, gradeAmt: 85, halftone: 0, grain: 25, glow: 40 },
  extras: { tags: true, heat: true, seal: true },
  selected: 0, size: 1,
};
let history = [], future = [];

export function loadImage(url) {
  return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = url; });
}

function panelCount() { return layoutPanels(state.layout, 1080, 1350).panels.length; }

function refillPanels(reassign) {
  const n = panelCount();
  const next = [];
  for (let i = 0; i < n; i++) {
    const old = state.panels[i];
    if (old && !reassign) { next.push(old); continue; }
    next.push({
      img: state.images.length ? i % state.images.length : 0,
      zoom: ZOOMS[i % ZOOMS.length], fx: FOCALS[i % FOCALS.length][0], fy: FOCALS[i % FOCALS.length][1],
      ox: 0, oy: 0, flip: false, role: ROLES[i % ROLES.length], sub: SUBS[i % SUBS.length],
    });
  }
  state.panels = next;
}

function snapshot() { return JSON.stringify({ ...state, images: state.images.length }); }
function pushHistory() { history.push(snapshot()); if (history.length > 40) history.shift(); future = []; updateUndo(); }
function updateUndo() { $('undo').disabled = !history.length; $('redo').disabled = !future.length; }

function redraw() {
  const [w, h] = SIZES[state.size];
  canvas.width = Math.round(w / 2); canvas.height = Math.round(h / 2);
  drawCover(canvas, state);
  $('sizeLabel').textContent = `${w} × ${h}`;
  renderThumbs(); renderPanelList();
}

function renderThumbs() {
  const box = $('thumbs'); box.innerHTML = '';
  state.images.forEach((img, i) => {
    const t = document.createElement('canvas'); t.width = 72; t.height = 96; t.className = 'thumb';
    t.title = `Photo ${i + 1} — click to assign to selected panel`;
    const c = t.getContext('2d'); const s = Math.max(72 / img.naturalWidth, 96 / img.naturalHeight);
    c.drawImage(img, (72 - img.naturalWidth * s) / 2, (96 - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
    t.addEventListener('click', () => { pushHistory(); state.panels[state.selected].img = i; redraw(); });
    box.appendChild(t);
  });
  $('photoCount').textContent = state.images.length ? `${state.images.length} photo${state.images.length > 1 ? 's' : ''} loaded` : 'No photos yet — load the samples or drop your own.';
}

function renderPanelList() {
  const box = $('panels'); box.innerHTML = '';
  state.panels.forEach((p, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'panelChip' + (i === state.selected ? ' sel' : '');
    b.textContent = `${i + 1} · ${p.role}`;
    b.addEventListener('click', () => { state.selected = i; syncPanelControls(); redraw(); });
    box.appendChild(b);
  });
}

function syncPanelControls() {
  const p = state.panels[state.selected]; if (!p) return;
  $('pZoom').value = Math.round((p.zoom - 0.8) / 1.7 * 100);
  $('pRole').value = p.role; $('pSub').value = p.sub;
  $('panelLabel').textContent = `Panel ${state.selected + 1} — ${p.role}`;
}

async function addFiles(files) {
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    const img = await loadImage(URL.createObjectURL(f));
    state.images.push(img);
  }
  pushHistory(); refillPanels(true); redraw();
  $('status').textContent = `${state.images.length} photo(s) loaded. Smart crop filled ${state.panels.length} panels — drag a panel to reposition it.`;
}

async function loadSamples() {
  for (const f of ['harbor-man.jpg', 'harbor-woman.jpg', 'harbor-rider.jpg']) {
    try { state.images.push(await loadImage(`samples/${f}`)); } catch { /* sample missing: skip */ }
  }
  pushHistory(); refillPanels(true); redraw();
  $('status').textContent = 'Sample photos loaded — a fictional cast of three. Edit the caption, pick a look, export.';
}

function surprise() {
  pushHistory();
  const layouts = Object.keys(LAYOUT_NAMES), grades = Object.keys(GRADES);
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  state.grade = grades[Math.floor(Math.random() * grades.length)];
  const titles = [['DERMAGA NIGHTS', 'after dark'], ['CAHAYA NIGHTS', 'one last summer'], ['SALT & SIRENS', 'tide is turning'], ['TELUK LIGHTS', 'no curfew']];
  const [t, s] = titles[Math.floor(Math.random() * titles.length)];
  state.title = t; state.script = s;
  $('title').value = t; $('script').value = s;
  syncPickers(); refillPanels(); redraw();
}

function syncPickers() {
  document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('sel', b.dataset.v === state.layout));
  document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('sel', b.dataset.v === state.grade));
  // A theme is active exactly when the current grade is that theme's grade.
  document.querySelectorAll('#themes button').forEach((b) => b.classList.toggle('sel', THEMES[b.dataset.v]?.grade === state.grade));
}

function buildPickers() {
  const tb = $('themes'), lb = $('layouts'), gb = $('grades');
  for (const [id, t] of Object.entries(THEMES)) {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.v = id; b.className = 'themeBtn';
    b.title = `${t.name} — ${t.mood}. One click switches the whole cover mood.`;
    const sw = document.createElement('span'); sw.className = 'swatch';
    sw.style.background = `linear-gradient(90deg, ${t.swatch.join(', ')})`;
    const nm = document.createElement('span'); nm.className = 'tname'; nm.textContent = t.name;
    const md = document.createElement('span'); md.className = 'tmood'; md.textContent = t.mood;
    b.append(sw, nm, md);
    b.addEventListener('click', () => { pushHistory(); state.grade = t.grade; syncPickers(); redraw(); });
    tb.appendChild(b);
  }
  for (const [id, name] of Object.entries(LAYOUT_NAMES)) {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.v = id; b.textContent = name;
    b.addEventListener('click', () => { pushHistory(); state.layout = id; refillPanels(); syncPickers(); redraw(); });
    lb.appendChild(b);
  }
  for (const [id, g] of Object.entries(GRADES)) {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.v = id; b.textContent = g.name;
    b.addEventListener('click', () => { pushHistory(); state.grade = id; syncPickers(); redraw(); });
    gb.appendChild(b);
  }
}

function exportOne(w, h) {
  return new Promise((resolve) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    drawCover(c, state);
    c.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `bay-of-light-${w}x${h}.png`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      resolve(`${w}x${h}`);
    }, 'image/png');
  });
}

async function exportAll() {
  if (!state.images.length) { $('status').textContent = 'Load a photo first — samples work too.'; return; }
  $('status').textContent = 'Exporting 3 PNGs…';
  const done = [];
  for (const [w, h] of SIZES) { done.push(await exportOne(w, h)); await new Promise((r) => setTimeout(r, 150)); }
  $('status').textContent = `Exported ${done.join(' · ')} — 3 PNGs, one click.`;
  window.__exported = done;
}

function bindSlider(id, key) {
  $(id).addEventListener('input', (e) => { state.sliders[key] = +e.target.value; redraw(); });
}

function init() {
  buildPickers(); syncPickers(); refillPanels();
  document.fonts?.load('16px Anton').catch(() => {});
  document.fonts?.load('16px Pacifico').catch(() => {});
  document.fonts?.ready.then(() => redraw());

  // Wizard steps.
  document.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('[data-step]').forEach((x) => x.classList.toggle('sel', x === b));
    document.querySelectorAll('.step').forEach((s) => s.classList.toggle('on', s.id === `step${b.dataset.step}`));
  }));

  $('drop').addEventListener('click', () => $('file').click());
  $('file').addEventListener('change', (e) => addFiles([...e.target.files]));
  $('samples').addEventListener('click', loadSamples);
  $('surprise').addEventListener('click', surprise);
  $('autoLayout').addEventListener('click', () => { pushHistory(); refillPanels(); redraw(); $('status').textContent = 'Auto layout: smart crop refilled every panel from your photos.'; });
  ['dragover', 'dragenter'].forEach((ev) => $('drop').addEventListener(ev, (e) => { e.preventDefault(); $('drop').classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => $('drop').addEventListener(ev, (e) => { e.preventDefault(); $('drop').classList.remove('over'); }));
  $('drop').addEventListener('drop', (e) => addFiles([...e.dataTransfer.files]));
  document.addEventListener('paste', (e) => { const f = [...(e.clipboardData?.files || [])].filter((x) => x.type.startsWith('image/')); if (f.length) addFiles(f); });

  $('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
  $('script').addEventListener('input', (e) => { state.script = e.target.value; redraw(); });
  $('tagline').addEventListener('input', (e) => { state.tagline = e.target.value; redraw(); });
  $('quote').addEventListener('input', (e) => { state.quote = e.target.value; redraw(); });
  bindSlider('sPaint', 'paint'); bindSlider('sGrade', 'gradeAmt'); bindSlider('sHalftone', 'halftone'); bindSlider('sGrain', 'grain'); bindSlider('sGlow', 'glow');

  $('pZoom').addEventListener('input', (e) => { const p = state.panels[state.selected]; p.zoom = 0.8 + (+e.target.value / 100) * 1.7; redraw(); });
  $('pFlip').addEventListener('click', () => { pushHistory(); state.panels[state.selected].flip = !state.panels[state.selected].flip; redraw(); });
  $('pFace').addEventListener('click', () => { pushHistory(); const p = state.panels[state.selected]; p.fx = 0.5; p.fy = 0.3; p.zoom = Math.max(p.zoom, 1.3); redraw(); });
  $('pSwap').addEventListener('click', () => { pushHistory(); const n = state.panels.length, i = state.selected, j = (i + 1) % n; [state.panels[i].img, state.panels[j].img] = [state.panels[j].img, state.panels[i].img]; redraw(); });
  $('pRole').addEventListener('input', (e) => { state.panels[state.selected].role = e.target.value.toUpperCase(); renderPanelList(); redraw(); });
  $('pSub').addEventListener('input', (e) => { state.panels[state.selected].sub = e.target.value.toUpperCase(); redraw(); });
  $('pReset').addEventListener('click', () => { pushHistory(); const i = state.selected; state.panels[i] = { img: state.images.length ? i % state.images.length : 0, zoom: ZOOMS[i % ZOOMS.length], fx: FOCALS[i % FOCALS.length][0], fy: FOCALS[i % FOCALS.length][1], ox: 0, oy: 0, flip: false, role: ROLES[i % ROLES.length], sub: SUBS[i % SUBS.length] }; syncPanelControls(); redraw(); });

  document.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
    pushHistory(); state.size = +b.dataset.size;
    document.querySelectorAll('[data-size]').forEach((x) => x.classList.toggle('sel', x === b));
    redraw();
  }));
  $('exportAll').addEventListener('click', exportAll);
  $('exportOne').addEventListener('click', () => { const [w, h] = SIZES[state.size]; exportOne(w, h).then((d) => { $('status').textContent = `Exported ${d}.`; }); });
  $('undo').addEventListener('click', () => { if (!history.length) return; future.push(snapshot()); const s = JSON.parse(history.pop()); Object.assign(state, s, { images: state.images }); refillPanels(); syncPickers(); redraw(); updateUndo(); });
  $('redo').addEventListener('click', () => { if (!future.length) return; history.push(snapshot()); const s = JSON.parse(future.pop()); Object.assign(state, s, { images: state.images }); refillPanels(); syncPickers(); redraw(); updateUndo(); });

  // Canvas: click a panel to select it; drag to pan; scroll to zoom.
  let drag = null;
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * canvas.width, y: (e.clientY - r.top) / r.height * canvas.height }; };
  canvas.addEventListener('pointerdown', (e) => {
    const { x, y } = pos(e);
    const L = layoutPanels(state.layout, canvas.width, canvas.height);
    const i = L.panels.findIndex((p) => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
    if (i >= 0) { state.selected = i; syncPanelControls(); renderPanelList(); }
    drag = { x, y, ox: state.panels[state.selected]?.ox || 0, oy: state.panels[state.selected]?.oy || 0, moved: false };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const { x, y } = pos(e);
    if (Math.abs(x - drag.x) + Math.abs(y - drag.y) > 3) drag.moved = true;
    const p = state.panels[state.selected]; if (!p) return;
    p.ox = drag.ox + (x - drag.x); p.oy = drag.oy + (y - drag.y); redraw();
  });
  canvas.addEventListener('pointerup', () => { if (drag?.moved) pushHistory(); drag = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = state.panels[state.selected]; if (!p) return;
    p.zoom = Math.min(2.5, Math.max(0.8, p.zoom * (e.deltaY < 0 ? 1.08 : 0.92))); syncPanelControls(); redraw();
  }, { passive: false });

  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    runShot(shot, new URLSearchParams(location.search), async (sample, text) => {
      if (sample === 'samples') { await loadSamples(); }
      else { state.images.push(await loadImage(sample)); refillPanels(); }
      if (text) { state.title = text; $('title').value = text; }
      redraw();
    });
  } else {
    redraw(); updateUndo();
  }
}

init();
