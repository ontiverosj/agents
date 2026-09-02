function show(id, text, ok) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'msg ' + (ok ? 'ok' : 'err');
}

async function refresh() {
  const s = await chrome.runtime.sendMessage({ type: 'status' });
  const pill = document.getElementById('modePill');
  if (!s.hasLock) pill.textContent = 'no lock set';
  else if (s.lockMode === 'noknowledge') pill.textContent = 'nobody-knows-it lock active';
  else pill.textContent = 'partner password lock active';

  const now = Date.now();
  const statusEl = document.getElementById('unlockStatus');
  const reqBtn = document.getElementById('requestUnlock');
  const cancelBtn = document.getElementById('cancelUnlock');
  const useBtn = document.getElementById('usePause');

  if (s.unlockAt > now) {
    const hrs = ((s.unlockAt - now) / 3600000).toFixed(1);
    statusEl.textContent = `Unlock pending — ready in ${hrs} hours.`;
    statusEl.className = 'msg ok';
    reqBtn.hidden = true;
    cancelBtn.hidden = false;
    useBtn.hidden = true;
  } else if (s.unlockAt > 0 && now <= s.unlockAt + s.unlockWindowMs) {
    statusEl.textContent = 'Unlock is READY — usable once, within the next hour.';
    statusEl.className = 'msg ok';
    reqBtn.hidden = true;
    cancelBtn.hidden = false;
    useBtn.hidden = false;
  } else {
    statusEl.textContent = 'No unlock pending.';
    statusEl.className = 'msg';
    reqBtn.hidden = false;
    cancelBtn.hidden = true;
    useBtn.hidden = true;
  }
}

document.getElementById('setRandomLock').addEventListener('click', async () => {
  const current = document.getElementById('rlCurrent').value;
  const res = await chrome.runtime.sendMessage({ type: 'setRandomLock', current });
  if (res.ok) {
    show(
      'rlMsg',
      'Done. A random lock was generated and immediately forgotten — nobody knows it. The delayed unlock is now the only way to pause.',
      true
    );
    document.getElementById('rlCurrent').value = '';
  } else {
    show('rlMsg', res.error, false);
  }
  refresh();
});

document.getElementById('setLock').addEventListener('click', async () => {
  const password = document.getElementById('password').value;
  const current = document.getElementById('current').value;
  if (password.length < 4) {
    show('lockMsg', 'Password must be at least 4 characters.', false);
    return;
  }
  const res = await chrome.runtime.sendMessage({ type: 'setLock', password, current });
  if (res.ok) {
    show('lockMsg', 'Lock password set. Protection can now only be paused with it.', true);
    document.getElementById('password').value = '';
    document.getElementById('current').value = '';
  } else {
    show('lockMsg', res.error, false);
  }
  refresh();
});

document.getElementById('requestUnlock').addEventListener('click', async () => {
  const res = await chrome.runtime.sendMessage({ type: 'requestUnlock' });
  if (res.ok) show('unlockMsg', 'Requested. Come back in 24 hours if you still need it.', true);
  refresh();
});

document.getElementById('cancelUnlock').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'cancelUnlock' });
  show('unlockMsg', 'Pending unlock cancelled. Good call.', true);
  refresh();
});

document.getElementById('usePause').addEventListener('click', async () => {
  const res = await chrome.runtime.sendMessage({ type: 'pause' });
  if (res.ok) show('unlockMsg', 'Paused. Protection auto-resumes in 30 minutes.', true);
  else show('unlockMsg', res.error, false);
  refresh();
});

document.getElementById('pause').addEventListener('click', async () => {
  const password = document.getElementById('pausePw').value;
  const res = await chrome.runtime.sendMessage({ type: 'pause', password });
  if (res.ok) show('pauseMsg', 'Paused. Protection auto-resumes in 30 minutes.', true);
  else show('pauseMsg', res.error, false);
  document.getElementById('pausePw').value = '';
  refresh();
});

refresh();
setInterval(refresh, 30000);
