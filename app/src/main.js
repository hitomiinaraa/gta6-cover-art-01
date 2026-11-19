// Golden Hour — editor. Own code: state, photo loading, controls, live preview
// and PNG export. Photos are read on the user's own machine and never uploaded.
import { renderCover, LAYOUTS, GRADES, SIZES } from './cover.js';
import { applyShot } from './shots.js';

const SAMPLES = [
  { id: 'boulevard', name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { id: 'pier', name: 'Pier', src: 'samples/pier.jpg' },
  { id: 'skyline', name: 'Skyline', src: 'samples/skyline.jpg' },
  { id: 'tower', name: 'Tower', src: 'samples/tower.jpg' },
  { id: 'motel', name: 'Motel', src: 'samples/motel.jpg' },
  { id: 'car', name: 'Getaway Car', src: 'samples/car.jpg' },
];

const DEFAULTS = {
  layout: 'cast',
  grade: 'sunset',
  size: 'landscape',
  title: 'GOLDEN COAST',
  subtitle: 'One Last Ride',
  tagline: 'NO RULES AFTER DARK',
  quote: 'THE COAST HAS NEVER LOOKED THIS GOOD',
  quoteSource: 'VICE DAILY',
  vol: 'VOL. 07',
  sealLines: ['ORIGINAL', 'COVER ART'],
  billing: 'A GOLDEN HOUR PICTURE · STARRING YOU · SHOT ON YOUR OWN CAMERA · GRADED BY HAND',
};

const state = { ...DEFAULTS, panels: [] };
const images = {}; // photoId -> HTMLImageElement
const photos = []; // {id, name, src}
let uploadCount = 0;

function layoutPanels(layoutId) {
  const layout = LAYOUTS[layoutId];
  const sampleIds = photos.map((p) => p.id);
  return layout.panels.map((panel, i) => ({
    photoId: sampleIds[i % Math.max(1, sampleIds.length)] || null,
    zoom: 1,
    ox: 0,
    oy: 0,
    label: panel.label,
    sub: panel.sub,
  }));
}

function resetPanelsForLayout() {
  // Keep the user's photo choices where the panel count allows, else re-deal.
  const fresh = layoutPanels(state.layout);
  const old = state.panels;
  state.panels = fresh.map((panel, i) => ({
    ...panel,
    photoId: old[i]?.photoId || panel.photoId,
    zoom: old[i]?.zoom ?? 1,
    ox: old[i]?.ox ?? 0,
    oy: old[i]?.oy ?? 0,
  }));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
}

async function loadSamples() {
  for (const sample of SAMPLES) {
    photos.push(sample);
    try {
      images[sample.id] = await loadImage(sample.src);
    } catch (e) {
      console.warn(e.message);
    }
  }
}

function renderPreview() {
  const canvas = document.getElementById('preview');
  const size = SIZES[state.size];
  const box = canvas.parentElement.getBoundingClientRect();
  const maxW = Math.min(box.width - 8, 960);
  const scale = Math.min(maxW / size.w, 560 / size.h, 1);
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
  // Render at the preview's own pixel size: the renderer is resolution-free.
  renderCover(canvas, state, images);
  document.getElementById('previewSize').textContent =
    `${size.label} · ${state.layout} · ${GRADES[state.grade].name}`;
}

function render() {
  renderPreview();
}

function buildLayoutButtons() {
  const box = document.getElementById('layoutBtns');
  box.innerHTML = '';
  for (const [id, layout] of Object.entries(LAYOUTS)) {
    const btn = document.createElement('button');
    btn.className = 'pick' + (state.layout === id ? ' on' : '');
    btn.type = 'button';
    btn.innerHTML = `<b>${layout.name}</b><span>${layout.blurb}</span>`;
    btn.addEventListener('click', () => {
      state.layout = id;
      resetPanelsForLayout();
      buildLayoutButtons();
      buildPanelControls();
      render();
    });
    box.appendChild(btn);
  }
}

function buildGradeButtons() {
  const box = document.getElementById('gradeBtns');
  box.innerHTML = '';
  for (const [id, grade] of Object.entries(GRADES)) {
    const btn = document.createElement('button');
    btn.className = 'pick swatch' + (state.grade === id ? ' on' : '');
    btn.type = 'button';
    btn.style.setProperty('--g1', grade.titleTop);
    btn.style.setProperty('--g2', grade.titleBot);
    btn.innerHTML = `<b>${grade.name}</b>`;
    btn.addEventListener('click', () => {
      state.grade = id;
      buildGradeButtons();
      render();
    });
    box.appendChild(btn);
  }
}

function buildSizeButtons() {
  const box = document.getElementById('sizeBtns');
  box.innerHTML = '';
  for (const [id, size] of Object.entries(SIZES)) {
    const btn = document.createElement('button');
    btn.className = 'pick' + (state.size === id ? ' on' : '');
    btn.type = 'button';
    btn.innerHTML = `<b>${size.label}</b>`;
    btn.addEventListener('click', () => {
      state.size = id;
      buildSizeButtons();
      render();
    });
    box.appendChild(btn);
  }
}

function buildPhotoThumbs() {
  const box = document.getElementById('photoThumbs');
  box.innerHTML = '';
  for (const photo of photos) {
    const img = images[photo.id];
    const thumb = document.createElement('button');
    thumb.className = 'thumb';
    thumb.type = 'button';
    thumb.title = photo.name;
    if (img) {
      const c = document.createElement('canvas');
      c.width = 96; c.height = 72;
      const cx = c.getContext('2d');
      const scale = Math.max(96 / img.naturalWidth, 72 / img.naturalHeight);
      const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
      cx.drawImage(img, (96 - dw) / 2, (72 - dh) / 2, dw, dh);
      thumb.appendChild(c);
    }
    const label = document.createElement('span');
    label.textContent = photo.name;
    thumb.appendChild(label);
    thumb.addEventListener('click', () => {
      // One click: put this photo in the first panel, so the cover changes.
      if (state.panels[0]) { state.panels[0].photoId = photo.id; buildPanelControls(); render(); }
    });
    box.appendChild(thumb);
  }
}

function buildPanelControls() {
  const box = document.getElementById('panelControls');
  box.innerHTML = '';
  const layout = LAYOUTS[state.layout];
  state.panels.forEach((panel, i) => {
    const def = layout.panels[i];
    const wrap = document.createElement('div');
    wrap.className = 'panelctl';
    const head = document.createElement('div');
    head.className = 'panelhead';
    head.textContent = `Panel ${i + 1} — ${def.label || 'photo'}`;
    wrap.appendChild(head);
    // Photo picker.
    const sel = document.createElement('select');
    sel.setAttribute('aria-label', `Panel ${i + 1} photo`);
    for (const photo of photos) {
      const opt = document.createElement('option');
      opt.value = photo.id;
      opt.textContent = photo.name;
      if (photo.id === panel.photoId) opt.selected = true;
      sel.appendChild(opt);
    }
    sel.addEventListener('change', () => { panel.photoId = sel.value; render(); });
    wrap.appendChild(sel);
    // Zoom + pan sliders.
    const sliders = [
      ['Zoom', 'zoom', 1, 2, 0.01, panel.zoom],
      ['Pan ↔', 'ox', -1, 1, 0.01, panel.ox],
      ['Pan ↕', 'oy', -1, 1, 0.01, panel.oy],
    ];
    for (const [label, key, min, max, step, value] of sliders) {
      const row = document.createElement('label');
      row.className = 'slider';
      row.innerHTML = `<span>${label}</span>`;
      const input = document.createElement('input');
      input.type = 'range';
      input.min = min; input.max = max; input.step = step; input.value = value;
      input.setAttribute('aria-label', `Panel ${i + 1} ${label}`);
      input.addEventListener('input', () => { panel[key] = Number(input.value); render(); });
      row.appendChild(input);
      wrap.appendChild(row);
    }
    // Label + subline.
    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.value = panel.label;
    labelInput.placeholder = 'Panel label';
    labelInput.setAttribute('aria-label', `Panel ${i + 1} label`);
    labelInput.addEventListener('input', () => { panel.label = labelInput.value.toUpperCase(); render(); });
    wrap.appendChild(labelInput);
    const subInput = document.createElement('input');
    subInput.type = 'text';
    subInput.value = panel.sub;
    subInput.placeholder = 'Panel subline';
    subInput.setAttribute('aria-label', `Panel ${i + 1} subline`);
    subInput.addEventListener('input', () => { panel.sub = subInput.value; render(); });
    wrap.appendChild(subInput);
    box.appendChild(wrap);
  });
}

function bindCaptionInputs() {
  const map = [
    ['inTitle', 'title'], ['inSubtitle', 'subtitle'], ['inTagline', 'tagline'],
    ['inQuote', 'quote'], ['inQuoteSource', 'quoteSource'], ['inVol', 'vol'],
    ['inBilling', 'billing'],
  ];
  for (const [id, key] of map) {
    const input = document.getElementById(id);
    input.value = state[key];
    input.addEventListener('input', () => {
      state[key] = key === 'title' ? input.value.toUpperCase() : input.value;
      render();
    });
  }
}

function exportPNG(sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  renderCover(off, state, images);
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      const stamp = state.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
      a.href = URL.createObjectURL(blob);
      a.download = `golden-hour-${stamp}-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(blob);
    }, 'image/png');
  });
}

async function exportAll() {
  const status = document.getElementById('status');
  for (const key of Object.keys(SIZES)) {
    status.textContent = `Exporting ${SIZES[key].label}…`;
    await exportPNG(key);
    await new Promise((r) => setTimeout(r, 250));
  }
  status.textContent = `Exported all three sizes · ${new Date().toLocaleTimeString()}`;
}

async function handleUpload(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    uploadCount += 1;
    const id = `up${uploadCount}`;
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
    const img = await loadImage(dataUrl);
    images[id] = img;
    photos.push({ id, name: file.name.replace(/\.[^.]+$/, '').slice(0, 18) || `Photo ${uploadCount}`, src: dataUrl });
  }
  buildPhotoThumbs();
  buildPanelControls();
  render();
}

async function init() {
  await document.fonts.ready;
  await loadSamples();
  state.panels = layoutPanels(state.layout);
  applyShot(state, photos);
  resetPanelsForLayout();
  buildLayoutButtons();
  buildGradeButtons();
  buildSizeButtons();
  buildPhotoThumbs();
  buildPanelControls();
  bindCaptionInputs();
  document.getElementById('upload').addEventListener('change', (e) => handleUpload(e.target.files));
  const drop = document.getElementById('dropzone');
  drop.addEventListener('click', () => document.getElementById('upload').click());
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    handleUpload(e.dataTransfer.files);
  });
  document.getElementById('exportAll').addEventListener('click', exportAll);
  for (const key of Object.keys(SIZES)) {
    document.getElementById(`export-${key}`).addEventListener('click', async () => {
      await exportPNG(key);
      document.getElementById('status').textContent = `Exported ${SIZES[key].label} · ${new Date().toLocaleTimeString()}`;
    });
  }
  render();
  window.GoldenHour = { state, render, exportPNG, exportAll, images, photos };
}

init().catch((e) => {
  document.getElementById('status').textContent = `Could not start: ${e.message}`;
  console.error(e);
});
