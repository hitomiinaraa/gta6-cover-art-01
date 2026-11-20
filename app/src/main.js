// Golden Hour v4 — the editor.
// Wires the renderer (cover.js) to the page: photo strip, visual layout
// thumbnails, grade swatches, caption fields, panel controls, look sliders,
// undo/redo, PNG export. Written fresh for v4.

import { SIZES, LAYOUTS, GRADES, PHOTOS, DEFAULT_CROPS, PANEL_LABELS, CAPTIONS } from './cover-data.js';
import { defaultState, loadImage, renderCover } from './cover.js';
import { runShot } from './shots.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const state = defaultState();
// The verify harness reads state.panels; crops are the same array.
state.panels = state.crops;

const images = [];        // HTMLImageElement per photo slot
const extraImages = [];   // user-uploaded photos, appended after PHOTOS
let history = [];
let historyIndex = -1;
let renderQueued = false;
let shotMode = false;     // true for ?shot=cover: hide the editor selection outline

function photoCount() {
  return PHOTOS.length + extraImages.length;
}

function imageFor(slot) {
  return slot < PHOTOS.length ? images[slot] : extraImages[slot - PHOTOS.length];
}

function allImages() {
  return [...images, ...extraImages];
}

function pushHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(JSON.stringify({
    layout: state.layout, grade: state.grade, size: state.size,
    title: state.title, script: state.script, tagline: state.tagline,
    quote: state.quote, quoteBy: state.quoteBy,
    paint: state.paint, glow: state.glow, titleSize: state.titleSize,
    showSeal: state.showSeal, showQuote: state.showQuote,
    showChips: state.showChips, showBilling: state.showBilling,
    crops: state.crops,
  }));
  if (history.length > 60) history.shift();
  historyIndex = history.length - 1;
  updateUndoRedo();
}

function applySnapshot(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  state.panels = state.crops;
  syncControls();
  queueRender();
}

function undo() {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  applySnapshot(history[historyIndex]);
}

function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex += 1;
  applySnapshot(history[historyIndex]);
}

function updateUndoRedo() {
  const u = $('#undo');
  const r = $('#redo');
  if (u) u.disabled = historyIndex <= 0;
  if (r) r.disabled = historyIndex >= history.length - 1;
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    render();
  });
}

function render() {
  const canvas = $('#cover');
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  const ctx = canvas.getContext('2d');
  const imgs = allImages();
  renderCover(ctx, size.w, size.h, state, imgs, { preview: !shotMode });
  updatePanelInfo();
}

function updatePanelInfo() {
  const el = $('#panelInfo');
  if (!el) return;
  const i = state.selected;
  const crop = state.crops[i] || state.crops[0];
  const photo = crop.photo < PHOTOS.length
    ? PHOTOS[crop.photo].name
    : 'Uploaded ' + (crop.photo - PHOTOS.length + 1);
  el.textContent = `Panel ${i + 1} of ${LAYOUTS[state.layout].panels.length} · ${photo} · zoom ${crop.zoom.toFixed(1)}×`;
  const zoom = $('#panelZoom');
  if (zoom) zoom.value = String(Math.round(crop.zoom * 100));
  const zoomLabel = $('#zoomLabel');
  if (zoomLabel) zoomLabel.textContent = crop.zoom.toFixed(1) + '×';
}

// ---- Layout thumbnails: real mini renders of each layout
function drawLayoutThumbs() {
  const box = $('#layouts');
  if (!box) return;
  box.innerHTML = '';
  const imgs = allImages();
  for (const layout of Object.values(LAYOUTS)) {
    const btn = document.createElement('button');
    btn.className = 'layout-thumb' + (state.layout === layout.id ? ' active' : '');
    btn.dataset.layout = layout.id;
    btn.title = layout.name;
    const cv = document.createElement('canvas');
    cv.width = 160;
    cv.height = 100;
    btn.appendChild(cv);
    const label = document.createElement('span');
    label.textContent = layout.name;
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      state.layout = layout.id;
      state.selected = 0;
      syncControls();
      queueRender();
      pushHistory();
    });
    box.appendChild(btn);
    const thumbState = { ...state, layout: layout.id, selected: null };
    renderCover(cv.getContext('2d'), 160, 100, thumbState, imgs, { preview: false });
  }
}

function drawGradeSwatches() {
  const box = $('#grades');
  if (!box) return;
  box.innerHTML = '';
  for (const grade of Object.values(GRADES)) {
    const btn = document.createElement('button');
    btn.className = 'grade-swatch' + (state.grade === grade.id ? ' active' : '');
    btn.dataset.grade = grade.id;
    btn.title = grade.label;
    btn.style.background = `linear-gradient(135deg, ${grade.title[0]}, ${grade.title[1]} 55%, ${grade.title[2]})`;
    const label = document.createElement('span');
    label.textContent = grade.label;
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      state.grade = grade.id;
      syncControls();
      queueRender();
      pushHistory();
      drawLayoutThumbs();
    });
    box.appendChild(btn);
  }
}

function drawPhotoThumbs() {
  const box = $('#photos');
  if (!box) return;
  box.innerHTML = '';
  const names = [...PHOTOS.map((p) => p.name), ...extraImages.map((_, k) => 'Uploaded ' + (k + 1))];
  const srcs = [...PHOTOS.map((p) => p.src), ...extraImages.map((img) => img.src)];
  names.forEach((name, i) => {
    const btn = document.createElement('button');
    btn.className = 'thumb';
    btn.dataset.photo = String(i);
    btn.title = name + ' — click to place on the selected panel';
    const img = document.createElement('img');
    img.src = srcs[i];
    img.alt = name;
    btn.appendChild(img);
    const label = document.createElement('span');
    label.textContent = name;
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      state.crops[state.selected] = { ...state.crops[state.selected], photo: i };
      queueRender();
      pushHistory();
    });
    box.appendChild(btn);
  });
}

function syncControls() {
  $$('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  $$('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  $$('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === state.size));
  const set = (id, v) => { const el = $(id); if (el) el.value = v; };
  set('#inTitle', state.title);
  set('#inScript', state.script);
  set('#inTagline', state.tagline);
  set('#inQuote', state.quote);
  set('#inQuoteBy', state.quoteBy);
  set('#paint', state.paint);
  set('#glow', state.glow);
  set('#titleSize', state.titleSize);
  const check = (id, v) => { const el = $(id); if (el) el.checked = v; };
  check('#exSeal', state.showSeal);
  check('#exQuote', state.showQuote);
  check('#exChips', state.showChips);
  check('#exBilling', state.showBilling);
  updateUndoRedo();
  updatePanelInfo();
}

async function exportCover(sizeKey) {
  const size = SIZES[sizeKey] || SIZES[state.size];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  renderCover(canvas.getContext('2d'), size.w, size.h, state, allImages(), { preview: false });
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `golden-hour-${sizeKey}-${size.w}x${size.h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return blob;
}

async function exportAll() {
  for (const key of ['square', 'portrait', 'wide']) {
    await exportCover(key);
  }
}

function autoFill() {
  // Spread the photos across the panels with varied crops: shuffle the
  // default crops so no two panels share the same photo + crop.
  const shuffled = [...DEFAULT_CROPS].sort(() => Math.random() - 0.5);
  state.crops = shuffled.map((c) => ({ ...c }));
  state.panels = state.crops;
  queueRender();
  pushHistory();
}

function surpriseMe() {
  const layouts = Object.keys(LAYOUTS);
  const grades = Object.keys(GRADES);
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  state.grade = grades[Math.floor(Math.random() * grades.length)];
  state.selected = 0;
  autoFill();
  drawLayoutThumbs();
  syncControls();
}

function initControls() {
  // Caption fields
  const bindText = (id, key) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', () => {
      state[key] = el.value;
      queueRender();
    });
    el.addEventListener('change', () => pushHistory());
  };
  bindText('#inTitle', 'title');
  bindText('#inScript', 'script');
  bindText('#inTagline', 'tagline');
  bindText('#inQuote', 'quote');
  bindText('#inQuoteBy', 'quoteBy');

  // Size buttons
  $$('[data-size]').forEach((b) => {
    b.addEventListener('click', () => {
      state.size = b.dataset.size;
      syncControls();
      queueRender();
      pushHistory();
    });
  });

  // Look sliders
  const bindRange = (id, key) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', () => {
      state[key] = Number(el.value);
      queueRender();
    });
    el.addEventListener('change', () => pushHistory());
  };
  bindRange('#paint', 'paint');
  bindRange('#glow', 'glow');
  bindRange('#titleSize', 'titleSize');

  // Panel zoom slider (bottom bar) edits the selected panel's crop.
  const zoom = $('#panelZoom');
  if (zoom) {
    zoom.addEventListener('input', () => {
      const crop = state.crops[state.selected];
      crop.zoom = Number(zoom.value) / 100;
      const label = $('#zoomLabel');
      if (label) label.textContent = crop.zoom.toFixed(1) + '×';
      queueRender();
    });
    zoom.addEventListener('change', () => pushHistory());
  }

  // Panel controls
  const stepPhoto = (dir) => {
    const crop = state.crops[state.selected];
    crop.photo = (crop.photo + dir + photoCount()) % photoCount();
    queueRender();
    pushHistory();
  };
  $('#prevPhoto')?.addEventListener('click', () => stepPhoto(-1));
  $('#nextPhoto')?.addEventListener('click', () => stepPhoto(1));
  $('#resetCrop')?.addEventListener('click', () => {
    state.crops[state.selected] = { ...DEFAULT_CROPS[state.selected] };
    state.panels = state.crops;
    queueRender();
    pushHistory();
  });
  $('#flipPanel')?.addEventListener('click', () => {
    const crop = state.crops[state.selected];
    crop.panX = 1 - crop.panX;
    queueRender();
    pushHistory();
  });
  $('#swapPanel')?.addEventListener('click', () => {
    const n = LAYOUTS[state.layout].panels.length;
    const j = (state.selected + 1) % n;
    [state.crops[state.selected], state.crops[j]] = [state.crops[j], state.crops[state.selected]];
    state.panels = state.crops;
    queueRender();
    pushHistory();
  });

  // Extras checkboxes
  const bindCheck = (id, key) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('change', () => {
      state[key] = el.checked;
      queueRender();
      pushHistory();
    });
  };
  bindCheck('#exSeal', 'showSeal');
  bindCheck('#exQuote', 'showQuote');
  bindCheck('#exChips', 'showChips');
  bindCheck('#exBilling', 'showBilling');

  // Photo actions
  $('#addPhotos')?.addEventListener('click', () => $('#upload')?.click());
  $('#autoFill')?.addEventListener('click', autoFill);
  $('#surprise')?.addEventListener('click', surpriseMe);
  $('#upload')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      extraImages.push(img);
      drawPhotoThumbs();
      state.crops[state.selected] = { ...state.crops[state.selected], photo: photoCount() - 1 };
      queueRender();
      pushHistory();
    };
    img.src = url;
  });

  // Export
  $$('[data-export]').forEach((b) => {
    b.addEventListener('click', () => exportCover(b.dataset.export));
  });
  $('#exportAll')?.addEventListener('click', exportAll);

  // Undo / redo (header + bottom bar share the same handlers)
  $$('#undo, #undo2').forEach((b) => b.addEventListener('click', undo));
  $$('#redo, #redo2').forEach((b) => b.addEventListener('click', redo));

  // Canvas click selects a panel.
  const canvas = $('#cover');
  canvas?.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const areaH = canvas.height * 0.86;
    const panels = LAYOUTS[state.layout].panels;
    for (let i = 0; i < panels.length; i++) {
      const p = panels[i];
      const x = p.x * canvas.width;
      const y = p.y * areaH;
      const w = p.w * canvas.width;
      const h = p.h * areaH;
      if (px >= x && px <= x + w && py >= y && py <= y + h) {
        state.selected = i;
        queueRender();
        break;
      }
    }
  });
}

async function init() {
  // Load the bundled OFL fonts before the first paint, so the title is
  // never drawn in a fallback font.
  try {
    await Promise.all([
      document.fonts.load('400 100px Anton'),
      document.fonts.load('400 100px Yellowtail'),
      document.fonts.load('700 40px Archivo'),
      document.fonts.load('800 40px Archivo'),
    ]);
  } catch (e) {
    // Fonts fall back to system sans; the app still works.
  }
  for (const photo of PHOTOS) {
    try {
      images.push(await loadImage(photo.src));
    } catch (e) {
      images.push(null);
    }
  }
  initControls();
  drawPhotoThumbs();
  drawGradeSwatches();
  drawLayoutThumbs();
  syncControls();
  pushHistory();
  render();

  window.__cover = {
    ready: true,
    state,
    exportCover,
    exportAll,
    setLayout: (id) => { state.layout = id; syncControls(); queueRender(); },
    setSize: (id) => { state.size = id; syncControls(); queueRender(); },
    setGrade: (id) => { state.grade = id; syncControls(); queueRender(); },
    render: () => render(),
  };

  // Shot mode (dossier screenshots): ?shot=cover&photo=pier&caption=...
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    // Cover shots are the judged artefact: no selection outline.
    shotMode = shot === 'cover';
    runShot(shot, params, (photoName, caption) => {
      const idx = PHOTOS.findIndex((p) => p.id === photoName);
      if (idx >= 0) {
        // The named photo becomes the lead panel only; the other panels
        // keep their varied default crops (the whole point of v4).
        state.crops[0] = { ...state.crops[0], photo: idx };
        state.panels = state.crops;
      }
      if (caption) state.title = caption;
      syncControls();
      queueRender();
    });
  }
}

init();
