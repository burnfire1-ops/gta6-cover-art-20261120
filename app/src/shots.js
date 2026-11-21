// Fixed scenes for screenshots: ?shot=cover shows the exported cover alone,
// ?shot=editor shows the editor with the sample cast loaded. `photo` picks the
// sample (samples/<photo>.jpg) and `caption` the title words; window.__shotReady
// is set once the cover has painted, two animation frames after loading.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await load(`samples/${query.get('photo') ?? 'media-generation-harbor-man-0-91bac76d-5021-44c6-8f31-aef2f41d365b'}.jpg`, query.get('caption') ?? 'BAY OF LIGHT');
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
