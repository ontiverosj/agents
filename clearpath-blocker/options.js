function show(id, text, ok) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'msg ' + (ok ? 'ok' : 'err');
}

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
});

document.getElementById('pause').addEventListener('click', async () => {
  const password = document.getElementById('pausePw').value;
  const res = await chrome.runtime.sendMessage({ type: 'pause', password });
  if (res.ok) {
    show('pauseMsg', 'Paused. Protection auto-resumes in 30 minutes.', true);
  } else {
    show('pauseMsg', res.error, false);
  }
  document.getElementById('pausePw').value = '';
});
