// ClearPath Blocker — service worker.
// Handles the pause/resume flow. Rules themselves are static declarativeNetRequest
// rulesets, so blocking keeps working even if this worker is asleep.

const RULESETS = ['adult_block', 'safesearch'];
const PAUSE_MINUTES = 30;

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

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg.type === 'status') {
      const enabled = await chrome.declarativeNetRequest.getEnabledRulesets();
      const { pausedUntil = 0, lockHash = null } = await chrome.storage.local.get([
        'pausedUntil',
        'lockHash',
      ]);
      sendResponse({ active: enabled.length > 0, pausedUntil, hasLock: !!lockHash });
      return;
    }

    if (msg.type === 'setLock') {
      const { lockHash } = await chrome.storage.local.get('lockHash');
      // The lock can only be set once from the UI. Changing it requires the
      // current password so the accountability partner stays in control.
      if (lockHash) {
        const ok = (await sha256(msg.current || '')) === lockHash;
        if (!ok) {
          sendResponse({ ok: false, error: 'Current password is wrong.' });
          return;
        }
      }
      await chrome.storage.local.set({ lockHash: await sha256(msg.password) });
      sendResponse({ ok: true });
      return;
    }

    if (msg.type === 'pause') {
      const { lockHash } = await chrome.storage.local.get('lockHash');
      if (!lockHash) {
        sendResponse({ ok: false, error: 'No lock password set yet.' });
        return;
      }
      if ((await sha256(msg.password || '')) !== lockHash) {
        sendResponse({ ok: false, error: 'Wrong password.' });
        return;
      }
      const pausedUntil = Date.now() + PAUSE_MINUTES * 60 * 1000;
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: RULESETS,
      });
      await chrome.storage.local.set({ pausedUntil });
      chrome.alarms.create('clearpath-resume', { delayInMinutes: PAUSE_MINUTES });
      sendResponse({ ok: true, pausedUntil });
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
