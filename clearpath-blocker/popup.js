async function refresh() {
  const s = await chrome.runtime.sendMessage({ type: 'status' });
  const badge = document.getElementById('status');
  const detail = document.getElementById('detail');
  const resume = document.getElementById('resume');

  if (s.active) {
    badge.textContent = 'Protection active';
    badge.className = 'badge on';
    detail.textContent = s.hasLock
      ? 'Adult content blocked. SafeSearch enforced. Pausing requires the lock password.'
      : 'Blocking is on, but no lock password is set yet — open Settings and have your accountability partner set one.';
    resume.hidden = true;
  } else {
    badge.textContent = 'PAUSED';
    badge.className = 'badge off';
    const mins = Math.max(0, Math.round((s.pausedUntil - Date.now()) / 60000));
    detail.textContent = `Protection is paused and will auto-resume in about ${mins} min.`;
    resume.hidden = false;
  }
}

document.getElementById('resume').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'resume' });
  refresh();
});

document.getElementById('options').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

refresh();
