// ClearPath Blocker — service worker.
// Handles the pause/resume flow. Rules themselves are static declarativeNetRequest
// rulesets, so blocking keeps working even if this worker is asleep.

const RULESETS = ['adult_block', 'safesearch'];
const PAUSE_MINUTES = 30;
const UNLOCK_DELAY_HOURS = 24; // wait after requesting an unlock
const UNLOCK_WINDOW_HOURS = 1; // how long the unlock stays usable once ready

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: RULESETS,
  });
});

// Auto re-enable after a pause expires, even across browser restarts.
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'clearpath-resume') {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: RULESETS,
    });
    await chrome.storage.local.set({ pausedUntil: 0 });
  }
});

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function doPause() {
  const pausedUntil = Date.now() + PAUSE_MINUTES * 60 * 1000;
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    disableRulesetIds: RULESETS,
  });
  await chrome.storage.local.set({ pausedUntil });
  chrome.alarms.create('clearpath-resume', { delayInMinutes: PAUSE_MINUTES });
  return pausedUntil;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg.type === 'status') {
      const enabled = await chrome.declarativeNetRequest.getEnabledRulesets();
      const {
        pausedUntil = 0,
        lockHash = null,
        lockMode = null,
        unlockAt = 0,
      } = await chrome.storage.local.get(['pausedUntil', 'lockHash', 'lockMode', 'unlockAt']);
      sendResponse({
        active: enabled.length > 0,
        pausedUntil,
        hasLock: !!lockHash,
        lockMode,
        unlockAt,
        unlockWindowMs: UNLOCK_WINDOW_HOURS * 3600 * 1000,
      });
      return;
    }

    if (msg.type === 'setLock') {
      const { lockHash } = await chrome.storage.local.get('lockHash');
      // Changing an existing lock requires the current password so the
      // accountability setup stays in control.
      if (lockHash) {
        const ok = (await sha256(msg.current || '')) === lockHash;
        if (!ok) {
          sendResponse({ ok: false, error: 'Current password is wrong.' });
          return;
        }
      }
      await chrome.storage.local.set({
        lockHash: await sha256(msg.password),
        lockMode: 'partner',
      });
      sendResponse({ ok: true });
      return;
    }

    if (msg.type === 'setRandomLock') {
      const { lockHash } = await chrome.storage.local.get('lockHash');
      if (lockHash) {
        const ok = (await sha256(msg.current || '')) === lockHash;
        if (!ok) {
          sendResponse({
            ok: false,
            error: 'A lock already exists. Enter its current password to replace it.',
          });
          return;
        }
      }
      // Generate a password nobody will ever see, hash it, and discard it.
      // From here on, the only way to pause is the 24-hour delayed unlock.
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const secret = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
      await chrome.storage.local.set({
        lockHash: await sha256(secret),
        lockMode: 'noknowledge',
        unlockAt: 0,
      });
      sendResponse({ ok: true });
      return;
    }

    if (msg.type === 'requestUnlock') {
      const unlockAt = Date.now() + UNLOCK_DELAY_HOURS * 3600 * 1000;
      await chrome.storage.local.set({ unlockAt });
      sendResponse({ ok: true, unlockAt });
      return;
    }

    if (msg.type === 'cancelUnlock') {
      await chrome.storage.local.set({ unlockAt: 0 });
      sendResponse({ ok: true });
      return;
    }

    if (msg.type === 'pause') {
      const { lockHash, unlockAt = 0 } = await chrome.storage.local.get([
        'lockHash',
        'unlockAt',
      ]);
      if (!lockHash) {
        sendResponse({ ok: false, error: 'No lock set yet.' });
        return;
      }

      const now = Date.now();
      const unlockReady =
        unlockAt > 0 && now >= unlockAt && now <= unlockAt + UNLOCK_WINDOW_HOURS * 3600 * 1000;

      if (unlockReady) {
        await chrome.storage.local.set({ unlockAt: 0 }); // single use
        const pausedUntil = await doPause();
        sendResponse({ ok: true, pausedUntil });
        return;
      }

      if (msg.password && (await sha256(msg.password)) === lockHash) {
        const pausedUntil = await doPause();
        sendResponse({ ok: true, pausedUntil });
        return;
      }

      sendResponse({
        ok: false,
        error:
          unlockAt > now
            ? 'Unlock not ready yet — the 24-hour delay is still running.'
            : 'Wrong password. Or use "Request delayed unlock" and come back in 24 hours.',
      });
      return;
    }

    if (msg.type === 'resume') {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: RULESETS,
      });
      await chrome.storage.local.set({ pausedUntil: 0 });
      chrome.alarms.clear('clearpath-resume');
      sendResponse({ ok: true });
      return;
    }
  })();
  return true; // keep the message channel open for the async response
});
