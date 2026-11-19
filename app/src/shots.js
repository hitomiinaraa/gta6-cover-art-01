// Golden Hour — deterministic states for screenshots and the finalist review.
// Reads ?shot= parameters and folds them into the editor state before the
// first render. No network, no side effects beyond the state object.
import { LAYOUTS, GRADES, SIZES } from './cover.js';

function pickParam(params, key) {
  const value = params.get(key);
  return value === null ? null : value;
}

export function applyShot(state, photos) {
  const params = new URLSearchParams(window.location.search);
  if ([...params.keys()].length === 0) return false;
  const layout = pickParam(params, 'layout');
  if (layout && LAYOUTS[layout]) state.layout = layout;
  const grade = pickParam(params, 'grade');
  if (grade && GRADES[grade]) state.grade = grade;
  const size = pickParam(params, 'size');
  if (size && SIZES[size]) state.size = size;
  for (const key of ['title', 'subtitle', 'tagline', 'quote', 'quoteSource', 'vol', 'billing']) {
    const value = pickParam(params, key);
    if (value !== null) state[key] = key === 'title' ? value.toUpperCase() : value;
  }
  const seal = pickParam(params, 'seal');
  if (seal !== null) state.sealLines = seal.split('|').map((s) => s.trim()).filter(Boolean);
  // photo=<id> puts one photo in every panel; photo<N>=<id> targets panel N.
  const photo = pickParam(params, 'photo');
  const known = new Set(photos.map((p) => p.id));
  if (photo && known.has(photo)) {
    state.panels.forEach((panel) => { panel.photoId = photo; });
  }
  state.panels.forEach((panel, i) => {
    const value = pickParam(params, `photo${i}`);
    if (value && known.has(value)) panel.photoId = value;
  });
  return true;
}
