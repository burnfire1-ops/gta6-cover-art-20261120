// Fixed scenes for screenshots: ?shot=cover shows the exported cover alone,
// ?shot=editor shows the editor with the sample cast loaded. The `load`
// callback receives the three sample photo paths, the caption text, and the
// full query, so the scene can pick its theme and layout. window.__shotReady
// is set once the scene has painted, two animation frames after loading.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const samples = [
    'samples/harbor-man.jpg',
    'samples/harbor-woman.jpg',
    'samples/harbor-rider.jpg',
  ];
  await load(samples, query.get('caption') ?? 'BAY OF LIGHT', query);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      window.__shotReady = true;
    }),
  );
}
