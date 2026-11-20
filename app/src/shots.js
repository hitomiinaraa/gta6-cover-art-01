// Golden Hour v4 — shot presets for the dossier screenshots.
// ?shot=cover shows the cover alone; ?shot=editor shows the full editor.
// The query carries the photo, caption, layout, grade and size for the shot.

export function runShot(shot, query, load) {
  const apply = () => {
    const api = window.__cover;
    if (!api) return;
    const layout = query.get('layout');
    const grade = query.get('grade');
    const size = query.get('size');
    if (layout) api.setLayout(layout);
    if (grade) api.setGrade(grade);
    if (size) api.setSize(size);
    const photo = query.get('photo');
    const caption = query.get('caption');
    if (photo || caption) load(photo, caption);
    // Two frames for the render to settle, then signal the harness.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.__shotReady = true;
      });
    });
  };

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    apply();
  } else if (shot === 'editor') {
    document.body.classList.add('shot-editor');
    apply();
  }
}
