async function refresh() {
  const s = await chrome.runtime.sendMessage({ type: 'status' });
  const badge = document.getElementById('status');
  const detail = document.getElementById('detail');
  const resume = document.getElementById('resume');

  if (s.active) {
    badge.textContent = 'Protection active';
    badge.className = 'badge on';
    if (!s.hasLock) {
      detail.textContent =
        'Blocking is on, but no lock is set yet — open Settings and use the nobody-knows-it lock.';
    } else if (s.lockMode === 'noknowledge') {
      detail.textContent =
        'Adult content blocked. Nobody knows the password — pausing requires the 24-hour delayed unlock in Settings.';
    } else {
      detail.textContent =
        'Adult content blocked. SafeSearch enforced. Pausing requires the lock password.';
    }
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
