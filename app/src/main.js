// Golden Hour editor — loads photos, wires the controls, live-previews the
// cover on canvas and exports PNGs in the three post sizes. Vanilla JS, no
// libraries, no network: photos are local files or object URLs from uploads.

import { GRADES, LAYOUTS, SIZES, CAST_NAMES, PLACES, renderCover } from './cover.js';

const SAMPLES = [
  { id: 'boulevard', src: 'samples/boulevard.jpg', name: 'Boulevard' },
  { id: 'pier', src: 'samples/pier.jpg', name: 'Pier' },
  { id: 'skyline', src: 'samples/skyline.jpg', name: 'Skyline' },
  { id: 'tower', src: 'samples/tower.jpg', name: 'Lifeguard Tower' },
  { id: 'motel', src: 'samples/motel.jpg', name: 'Neon Motel' },
  { id: 'car', src: 'samples/car.jpg', name: 'Getaway Car' },
];

function defaultPanels(layout) {
  const n = (LAYOUTS[layout] || LAYOUTS.cast).panels;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ photo: i % SAMPLES.length, zoom: 1, panX: 0.5, panY: 0.5 });
  }
  return out;
}

export const state = {
  layout: 'cast',
  grade: 'golden',
  size: 'square',
  title: 'GOLDEN COAST',
  subtitle: 'One Last Ride',
  tagline: 'NO RULES AFTER DARK',
  quote: 'THE COAST HAS NEVER LOOKED THIS GOOD',
  quoteSource: 'VICE DAILY',
  vol: '07',
  panels: defaultPanels('cast'),
  selectedPanel: 0,
};

const photos = []; // HTMLImageElement per SAMPLES entry, then uploads appended
const photoMeta = [...SAMPLES];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('cannot load ' + src));
    img.src = src;
  });
}

async function loadSamples() {
  for (const s of SAMPLES) {
    try { photos.push(await loadImage(s.src)); }
    catch { photos.push(null); }
  }
}

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');

function currentSize() {
  return SIZES[state.size] || SIZES.square;
}

function render() {
  const { w, h } = currentSize();
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  renderCover(ctx, w, h, { ...state, photos });
  updatePanelList();
}

let renderQueued = false;
function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => { renderQueued = false; render(); });
}

function setLayout(layout) {
  if (!LAYOUTS[layout]) return;
  state.layout = layout;
  state.panels = defaultPanels(layout);
  state.selectedPanel = 0;
  document.querySelectorAll('[data-layout]').forEach(b => b.classList.toggle('active', b.dataset.layout === layout));
  queueRender();
}

function setGrade(grade) {
  if (!GRADES[grade]) return;
  state.grade = grade;
  document.querySelectorAll('[data-grade]').forEach(b => b.classList.toggle('active', b.dataset.grade === grade));
  queueRender();
}

function setSize(size) {
  if (!SIZES[size]) return;
  state.size = size;
  document.querySelectorAll('[data-size]').forEach(b => b.classList.toggle('active', b.dataset.size === size));
  queueRender();
}

function bindText(id, key, upper) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', () => {
    state[key] = upper ? el.value.toUpperCase() : el.value;
    queueRender();
  });
}

function buildPhotoStrip() {
  const strip = document.getElementById('photos');
  strip.innerHTML = '';
  photoMeta.forEach((meta, i) => {
    const d = document.createElement('div');
    d.className = 'thumb';
    d.dataset.photo = String(i);
    d.title = meta.name;
    const img = document.createElement('img');
    img.src = meta.src;
    img.alt = meta.name;
    img.draggable = true;
    d.appendChild(img);
    const cap = document.createElement('span');
    cap.textContent = meta.name;
    d.appendChild(cap);
    d.addEventListener('click', () => {
      state.panels[state.selectedPanel].photo = i;
      queueRender();
    });
    strip.appendChild(d);
  });
}

function updatePanelList() {
  const list = document.getElementById('panels');
  if (!list) return;
  const rects = state.panels.length;
  if (list.childElementCount !== rects) {
    list.innerHTML = '';
    for (let i = 0; i < rects; i++) {
      const b = document.createElement('button');
      b.className = 'panel-btn';
      b.dataset.panel = String(i);
      b.textContent = `Panel ${i + 1}`;
      b.addEventListener('click', () => { state.selectedPanel = i; queueRender(); });
      list.appendChild(b);
    }
  }
  list.querySelectorAll('.panel-btn').forEach((b, i) => {
    b.classList.toggle('active', i === state.selectedPanel);
    const p = state.panels[i];
    const name = photoMeta[p.photo] ? photoMeta[p.photo].name : `Photo ${p.photo + 1}`;
    b.textContent = `Panel ${i + 1} · ${name}`;
  });
  const zoom = document.getElementById('zoom');
  if (zoom) zoom.value = String(state.panels[state.selectedPanel].zoom || 1);
}

function exportCover(sizeKey) {
  const size = SIZES[sizeKey] || currentSize();
  const off = document.createElement('canvas');
  off.width = size.w; off.height = size.h;
  renderCover(off.getContext('2d'), size.w, size.h, { ...state, photos });
  return new Promise((resolve) => off.toBlob(resolve, 'image/png'));
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

async function exportAll() {
  const slug = (state.title || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
  for (const key of Object.keys(SIZES)) {
    const blob = await exportCover(key);
    if (blob) downloadBlob(blob, `${slug}-${SIZES[key].w}x${SIZES[key].h}.png`);
  }
}

function bindControls() {
  document.querySelectorAll('[data-layout]').forEach(b => b.addEventListener('click', () => setLayout(b.dataset.layout)));
  document.querySelectorAll('[data-grade]').forEach(b => b.addEventListener('click', () => setGrade(b.dataset.grade)));
  document.querySelectorAll('[data-size]').forEach(b => b.addEventListener('click', () => setSize(b.dataset.size)));
  bindText('in-title', 'title', true);
  bindText('in-subtitle', 'subtitle', false);
  bindText('in-tagline', 'tagline', true);
  bindText('in-quote', 'quote', true);
  bindText('in-source', 'quoteSource', true);
  bindText('in-vol', 'vol', false);
  const zoom = document.getElementById('zoom');
  if (zoom) zoom.addEventListener('input', () => {
    state.panels[state.selectedPanel].zoom = parseFloat(zoom.value) || 1;
    queueRender();
  });
  const up = document.getElementById('upload');
  if (up) up.addEventListener('change', async () => {
    for (const file of up.files || []) {
      if (!file.type.startsWith('image/')) continue;
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImage(url);
        photos.push(img);
        photoMeta.push({ id: 'upload-' + photoMeta.length, src: url, name: file.name.slice(0, 18) || 'Upload' });
      } catch { URL.revokeObjectURL(url); }
    }
    buildPhotoStrip();
    queueRender();
  });
  const exp = document.getElementById('export');
  if (exp) exp.addEventListener('click', async () => {
    const blob = await exportCover(state.size);
    if (blob) {
      const slug = (state.title || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
      downloadBlob(blob, `${slug}-${currentSize().w}x${currentSize().h}.png`);
    }
  });
  const expAll = document.getElementById('export-all');
  if (expAll) expAll.addEventListener('click', exportAll);

  // Drag on the canvas pans the selected panel's photo.
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    drag = { x: e.clientX - r.left, y: e.clientY - r.top, panX: state.panels[state.selectedPanel].panX, panY: state.panels[state.selectedPanel].panY };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = canvas.getBoundingClientRect();
    const dx = (e.clientX - r.left - drag.x) / r.width;
    const dy = (e.clientY - r.top - drag.y) / r.height;
    const p = state.panels[state.selectedPanel];
    p.panX = Math.min(1, Math.max(0, drag.panX + dx));
    p.panY = Math.min(1, Math.max(0, drag.panY + dy));
    queueRender();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });

  // Drop photos onto the canvas to assign them to the selected panel.
  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      photos.push(img);
      photoMeta.push({ id: 'upload-' + photoMeta.length, src: url, name: file.name.slice(0, 18) || 'Upload' });
      state.panels[state.selectedPanel].photo = photos.length - 1;
      buildPhotoStrip();
      queueRender();
    } catch { URL.revokeObjectURL(url); }
  });
}

// Shot presets (?shot=...) for deterministic screenshots. The shot module
// calls window.__cover.applyShot before the first render.
window.__cover = {
  state,
  photos,
  photoMeta,
  render,
  queueRender,
  exportCover,
  setLayout,
  setGrade,
  setSize,
  ready: null,
};

async function init() {
  await loadSamples();
  bindControls();
  buildPhotoStrip();
  try {
    await Promise.race([
      document.fonts.ready,
      new Promise((r) => setTimeout(r, 4000)),
    ]);
    await Promise.all([
      document.fonts.load('900 100px Anton'),
      document.fonts.load('70px Yellowtail'),
      document.fonts.load('700 20px Archivo'),
    ]).catch(() => {});
  } catch { /* fonts fall back to system sans */ }
  render();
  window.__cover.ready = Promise.resolve(true);
}

init();
