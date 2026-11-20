// Fixed scenes for screenshots: ?shot=editor loads the sample cast into the editor;
// ?shot=cover shows the cover alone, full-bleed. window.__shotReady fires once painted.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await load('samples', query.get('caption') ?? 'BAY OF LIGHT');
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
