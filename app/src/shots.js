// Fixed scenes for screenshots. ?shot=cover shows the finished cover alone,
// ?shot=editor shows the editor with the sample cast loaded. `load` is the
// caller-supplied loader (sample file + caption text). window.__shotReady is
// set once the scene has painted, so a screenshot runner knows when to shoot.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  const theme = query.get('theme');
  const layout = query.get('layout');
  const grade = query.get('grade');
  await load(
    `samples/${query.get('photo') ?? 'harbor-man'}.jpg`,
    query.get('caption') ?? 'BAY OF LIGHT',
    { theme, layout, grade },
  );
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
