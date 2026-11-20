// Golden Hour — editor: photos, captions, layout/grade/size switching,
// per-panel zoom + pan, live preview, PNG exports. Exposes window.__cover
// ({ ready, state, exportCover }) for the verifier and the ?shot= scenes.
import { renderCover, LAYOUT_IDS, GRADE_IDS, SIZE_IDS, SIZE_DIMS } from './cover.js';
import { LAYOUTS, LAYOUT_PANELS } from './cover-data.js';
import { runShot } from './shots.js';

const SAMPLES = [
  { name: 'boulevard', label: 'BOULEVARD' },
  { name: 'pier', label: 'THE PIER' },
  { name: 'skyline', label: 'SKYLINE' },
  { name: 'tower', label: 'LIFEGUARD' },
  { name: 'motel', label: 'NEON MOTEL' },
  { name: 'car', label: 'GETAWAY' },
];

const DEFAULT_LABELS = ['DOWNTOWN', 'THE BEACH', 'NEON ROW', 'THE GETAWAY', 'VICE CITY', 'LAST RIDE'];

const state = {
  layout: 'cast',
  grade: 'golden',
  size: 'square',
  title: 'GOLDEN COAST',
  subtitle: 'One Last Ride',
  tagline: 'NO RULES AFTER DARK',
  quote: 'THE COAST HAS NEVER LOOKED THIS GOOD',
  quoteSource: 'VICE DAILY',
  vol: 'VOL. 07',
  panels: [],
};

const photos = []; // { name, label, img }
let selectedPanel = 0;
let fontsReady = false;
let renderQueued = false;

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');

function buildPanels(layout, keep) {
  const n = LAYOUT_PANELS[layout];
  const next = [];
  for (let i = 0; i < n; i++) {
    const old = keep && keep[i];
    next.push({
      photo: old ? old.photo : (i + 2) % photos.length,
      zoom: old ? old.zoom : 1,
      panX: old ? old.panX : 0,
      panY: old ? old.panY : 0,
      label: old ? old.label : (DEFAULT_LABELS[i] || ''),
    });
  }
  return next;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('failed to load ' + src));
    img.src = src;
  });
}

async function loadFonts() {
  const faces = [
    new FontFace('Anton', 'url(fonts/Anton-Regular.ttf)', { weight: '400' }),
    new FontFace('Archivo', 'url(fonts/Archivo.ttf)', { weight: '100 900' }),
    new FontFace('Yellowtail', 'url(fonts/Yellowtail-Regular.ttf)', { weight: '400' }),
  ];
  for (const face of faces) {
    try {
      const loaded = await face.load();
      document.fonts.add(loaded);
    } catch (e) {
      console.warn('font failed: ' + face.family, e);
    }
  }
  await document.fonts.ready;
  fontsReady = true;
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderCover(canvas, state, photos.map((p) => p.img));
  });
}

function panelRects() {
  const [W, H] = SIZE_DIMS[state.size];
  const stripH = 0.115 * H;
  const area = { x: 0, y: 0, w: W, h: H - stripH };
  const g = 0.008 * W;
  return LAYOUTS[state.layout](area, g);
}

function pickPanel(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = ((clientX - r.left) / r.width) * canvas.width;
  const y = ((clientY - r.top) / r.height) * canvas.height;
  const rects = panelRects();
  for (let i = rects.length - 1; i >= 0; i--) {
    const p = rects[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}

function renderThumbs() {
  const strip = document.getElementById('photos');
  strip.innerHTML = '';
  photos.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'thumb';
    b.type = 'button';
    b.title = p.name;
    const img = document.createElement('img');
    img.src = p.img.src;
    img.alt = p.name;
    const cap = document.createElement('span');
    cap.textContent = p.label;
    b.append(img, cap);
    b.addEventListener('click', () => {
      state.panels[selectedPanel].photo = i;
      syncPanelControls();
      queueRender();
    });
    strip.appendChild(b);
  });
}

function syncPanelControls() {
  const p = state.panels[selectedPanel];
  const labelInput = document.getElementById('panelLabel');
  if (labelInput) labelInput.value = p ? p.label : '';
  const zoomLabel = document.getElementById('zoomLabel');
  if (zoomLabel) zoomLabel.textContent = p ? `${Math.round(p.zoom * 100)}%` : '';
  document.querySelectorAll('#photos .thumb').forEach((t, i) => {
    t.classList.toggle('active', p && p.photo === i);
  });
}

function bindButtons(attr, values, apply) {
  document.querySelectorAll(`[data-${attr}]`).forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute(`data-${attr}`);
      if (!values.includes(value)) return;
      apply(value);
      document.querySelectorAll(`[data-${attr}]`).forEach((b) =>
        b.classList.toggle('active', b === btn));
      queueRender();
    });
  });
}

async function exportCover(sizeKey) {
  const off = document.createElement('canvas');
  const savedSize = state.size;
  state.size = sizeKey;
  renderCover(off, state, photos.map((p) => p.img));
  state.size = savedSize;
  queueRender();
  return new Promise((resolve) => off.toBlob(resolve, 'image/png'));
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}

async function init() {
  // Load the six sample photos first so the first paint has images.
  for (const s of SAMPLES) {
    try {
      const img = await loadImage(`samples/${s.name}.jpg`);
      photos.push({ name: s.name, label: s.label, img });
    } catch (e) {
      console.warn('sample failed: ' + s.name, e);
    }
  }
  state.panels = buildPanels(state.layout, null);
  renderThumbs();

  // Caption fields.
  for (const [id, key] of [['title', 'title'], ['subtitle', 'subtitle'], ['tagline', 'tagline'], ['quote', 'quote']]) {
    const el = document.getElementById(id);
    if (el) {
      el.value = state[key];
      el.addEventListener('input', () => { state[key] = el.value; queueRender(); });
    }
  }

  // Layout / grade / size.
  bindButtons('layout', LAYOUT_IDS, (v) => {
    state.layout = v;
    state.panels = buildPanels(v, state.panels);
    selectedPanel = 0;
    syncPanelControls();
  });
  bindButtons('grade', GRADE_IDS, (v) => { state.grade = v; });
  bindButtons('size', SIZE_IDS, (v) => { state.size = v; });

  // Panel controls: label, zoom.
  const labelInput = document.getElementById('panelLabel');
  if (labelInput) {
    labelInput.addEventListener('input', () => {
      state.panels[selectedPanel].label = labelInput.value;
      queueRender();
    });
  }
  const zoomIn = document.getElementById('zoomIn');
  const zoomOut = document.getElementById('zoomOut');
  if (zoomIn) zoomIn.addEventListener('click', () => {
    const p = state.panels[selectedPanel];
    p.zoom = Math.min(3, p.zoom + 0.15);
    syncPanelControls();
    queueRender();
  });
  if (zoomOut) zoomOut.addEventListener('click', () => {
    const p = state.panels[selectedPanel];
    p.zoom = Math.max(1, p.zoom - 0.15);
    syncPanelControls();
    queueRender();
  });

  // Canvas: click selects a panel, drag pans it.
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const i = pickPanel(e.clientX, e.clientY);
    if (i < 0) return;
    selectedPanel = i;
    syncPanelControls();
    canvas.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, panX: state.panels[i].panX, panY: state.panels[i].panY };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = canvas.getBoundingClientRect();
    const p = state.panels[selectedPanel];
    p.panX = Math.max(-1, Math.min(1, drag.panX + ((e.clientX - drag.x) / r.width) * 1.6));
    p.panY = Math.max(-1, Math.min(1, drag.panY + ((e.clientY - drag.y) / r.height) * 1.6));
    queueRender();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });

  // Upload: adds a photo to the strip and assigns it to the selected panel.
  const upload = document.getElementById('upload');
  if (upload) {
    upload.addEventListener('change', async () => {
      const file = upload.files && upload.files[0];
      if (!file) return;
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      const img = await loadImage(dataUrl);
      photos.push({ name: file.name.replace(/\.[^.]+$/, ''), label: 'YOUR PHOTO', img });
      renderThumbs();
      state.panels[selectedPanel].photo = photos.length - 1;
      syncPanelControls();
      queueRender();
    });
  }

  // Exports.
  for (const key of SIZE_IDS) {
    const btn = document.getElementById('export-' + key);
    if (btn) {
      btn.addEventListener('click', async () => {
        const blob = await exportCover(key);
        downloadBlob(blob, `gta6-cover-${key}.png`);
      });
    }
  }
  const exportAll = document.getElementById('export-all');
  if (exportAll) {
    exportAll.addEventListener('click', async () => {
      for (const key of SIZE_IDS) {
        const blob = await exportCover(key);
        downloadBlob(blob, `gta6-cover-${key}.png`);
        await new Promise((r) => setTimeout(r, 250));
      }
    });
  }

  await loadFonts();
  syncPanelControls();
  queueRender();

  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) {
    await runShot(shot, params, async (patch) => {
      if (patch.size) state.size = patch.size;
      if (patch.layout) {
        state.layout = patch.layout;
        state.panels = buildPanels(patch.layout, state.panels);
      }
      if (patch.grade) state.grade = patch.grade;
      if (patch.title) {
        state.title = patch.title;
        const t = document.getElementById('title');
        if (t) t.value = patch.title;
      }
      if (patch.photo) {
        const idx = photos.findIndex((p) => p.name === patch.photo);
        if (idx >= 0) state.panels[0].photo = idx;
      }
      queueRender();
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
  }

  window.__cover = {
    get ready() { return fontsReady; },
    state,
    exportCover,
  };
  // __cover must exist before ready flips true for the verifier's waitForFunction.
  if (fontsReady) {
    // Already rendered above; expose the handle now.
  }
}

init().catch((e) => {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', `<p class="fatal">Failed to start: ${e.message}</p>`);
});
