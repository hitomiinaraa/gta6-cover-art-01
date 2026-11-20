// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample
// photo; ?shot=cover shows the cover alone; ?shot=square / ?shot=portrait
// show the cover at that export size. `photo` picks the sample and `layout`
// / `grade` override the defaults. window.__shotReady is set once painted.
export async function runShot(shot, query, apply) {
  if (shot === 'cover' || shot === 'square' || shot === 'portrait' || shot === 'wide') {
    document.body.classList.add('shot-cover');
  }
  const patch = {};
  const photo = query.get('photo');
  if (photo) patch.photo = photo;
  const layout = query.get('layout');
  if (layout) patch.layout = layout;
  const grade = query.get('grade');
  if (grade) patch.grade = grade;
  const size = query.get('size') || (shot === 'portrait' ? 'portrait' : shot === 'wide' ? 'wide' : shot === 'square' ? 'square' : null);
  if (size) patch.size = size;
  const title = query.get('title');
  if (title) patch.title = title;
  await apply(patch);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
