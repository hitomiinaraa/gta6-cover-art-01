// Deterministic ?shot= states for screenshots.
// ?shot=cover1|cover2|cover3 renders the exported cover full-bleed in an
// <img> (the PNG the app itself wrote); ?shot=editor leaves the editor UI
// up with a photo loaded. The verification script waits for
// window.__shotReady before screenshotting.

const SHOTS = {
  cover1: { layout: 'cast', grade: 'golden', size: 'square', title: 'GOLDEN COAST', subtitle: 'One Last Ride', tagline: 'NO RULES AFTER DARK', quote: 'THE COAST HAS NEVER LOOKED THIS GOOD', quoteSource: 'VICE DAILY', vol: '07', photos: [2, 0, 5, 3, 1, 4], pans: [{ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }] },
  cover2: { layout: 'slant', grade: 'neon', size: 'square', title: 'NEON TIDE', subtitle: 'Six nights in paradise', tagline: 'EVERY SUNSET HAS A PRICE', quote: 'SUNSET NEVER LOOKED THIS DANGEROUS', quoteSource: 'VICE DAILY', vol: '06', photos: [3, 4, 0, 5, 2], pans: [{ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.3, y: 0.6 }, { x: 0.5, y: 0.5 }] },
  cover3: { layout: 'hero', grade: 'sunset', size: 'portrait', title: 'VICE DAWN', subtitle: 'Salt & Neon', tagline: 'ONE COAST · NO RULES · COMING SOON', quote: 'PURE GOLDEN-HOUR MAYHEM', quoteSource: 'THE HARBOR GAZETTE', vol: '06', photos: [5, 1, 0], pans: [{ x: 0.5, y: 0.15 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }] },
  editor: { layout: 'cast', grade: 'golden', size: 'square', title: 'GOLDEN COAST', subtitle: 'One Last Ride', tagline: 'NO RULES AFTER DARK', quote: 'THE COAST HAS NEVER LOOKED THIS GOOD', quoteSource: 'VICE DAILY', vol: '07', photos: [2, 0, 5, 3, 1, 4], pans: [{ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }] },
};

function applyPreset(preset) {
  const c = window.__cover;
  if (!c) return;
  c.setLayout(preset.layout);
  c.setGrade(preset.grade);
  c.setSize(preset.size);
  c.state.title = preset.title;
  c.state.subtitle = preset.subtitle;
  c.state.tagline = preset.tagline;
  c.state.quote = preset.quote;
  c.state.quoteSource = preset.quoteSource;
  c.state.vol = preset.vol;
  c.state.panels.forEach((p, i) => {
    p.photo = preset.photos[i % preset.photos.length];
    p.zoom = 1;
    const pan = (preset.pans && preset.pans[i]) || { x: 0.5, y: 0.5 };
    p.panX = pan.x; p.panY = pan.y;
  });
  const title = document.getElementById('in-title');
  if (title) title.value = preset.title;
  const sub = document.getElementById('in-subtitle');
  if (sub) sub.value = preset.subtitle;
  const tag = document.getElementById('in-tagline');
  if (tag) tag.value = preset.tagline;
  const q = document.getElementById('in-quote');
  if (q) q.value = preset.quote;
  const src = document.getElementById('in-source');
  if (src) src.value = preset.quoteSource;
  const vol = document.getElementById('in-vol');
  if (vol) vol.value = preset.vol;
  c.render();
}

async function runShot() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (!shot || !SHOTS[shot]) { window.__shotReady = Promise.resolve('editor'); return; }
  const preset = SHOTS[shot];
  // Wait for the editor init (samples + fonts) before applying the preset.
  const start = Date.now();
  while (!window.__cover || !window.__cover.photos.length) {
    if (Date.now() - start > 15000) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  await new Promise((r) => setTimeout(r, 300));
  applyPreset(preset);
  await new Promise((r) => setTimeout(r, 200));
  if (shot.startsWith('cover')) {
    // Show the exported PNG itself, full-bleed, for the screenshot.
    const blob = await window.__cover.exportCover(preset.size);
    const url = URL.createObjectURL(blob);
    document.body.innerHTML = '';
    document.body.style.margin = '0';
    document.body.style.background = '#10061e';
    const img = document.createElement('img');
    img.id = 'shot-img';
    img.src = url;
    img.style.display = 'block';
    img.style.width = '100vw';
    img.style.height = '100vh';
    img.style.objectFit = 'contain';
    document.body.appendChild(img);
    await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
  }
  window.__shotReady = Promise.resolve(shot);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runShot);
} else {
  runShot();
}
