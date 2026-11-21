// Fixed scenes for screenshots, driven by the ?shot= query parameter.
// The editor calls runShot with its own helpers (the `studio` object), so
// this file knows the scenes but not how the editor is built.
//
//   ?shot=cover&w=1920&h=1080&theme=sunset&layout=harbor
//       the exported cover alone, full-bleed, no editor chrome
//   ?shot=cover&w=1080&h=1350&theme=neon-night&layout=harbor
//       the same cover, portrait, in the cold Neon Night grade
//   ?shot=editor
//       the editor with the sample photos loaded, on step 2
//
// `caption` sets the title words (default BAY OF LIGHT). Once the scene is
// painted, window.__shotReady is set after two animation frames, which is
// the screenshot tool's signal that the page has settled.
export async function runShot(shot, query, studio) {
  const caption = query.get('caption') ?? 'BAY OF LIGHT';
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const w = Number(query.get('w') ?? 1920);
    const h = Number(query.get('h') ?? 1080);
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) studio.setCanvasSize(w, h);
    if (query.get('theme')) studio.setTheme(query.get('theme'));
    if (query.get('layout')) studio.setLayout(query.get('layout'));
    if (query.get('grade')) studio.setGrade(query.get('grade'));
    studio.setCaption(caption);
    await studio.loadSamples();
    await studio.draw();
  } else if (shot === 'editor') {
    studio.setCaption(caption);
    await studio.loadSamples();
    studio.showStep(2);
    await studio.draw();
  } else {
    return;
  }
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  window.__shotReady = true;
}
