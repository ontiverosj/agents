// Periodic refresh of tracked niches so metric snapshots build into a time
// series (view velocity, trend factor, charts).
const cron = require('node-cron');
const config = require('../config');
const nicheService = require('./nicheService');

async function refreshAll(reason) {
  const niches = nicheService.listNiches();
  if (!niches.length) return;
  console.log(`[scheduler] refreshing ${niches.length} niche(s) (${reason})`);
  for (const niche of niches) {
    try {
      await nicheService.refreshNiche(niche.id);
    } catch (err) {
      console.error(`[scheduler] refresh failed for niche ${niche.id} (${niche.name}):`, err.message);
    }
  }
}

function start() {
  if (config.isTest) return;

  const minutes = Math.max(5, config.refreshIntervalMinutes);
  // Hourly-or-longer intervals run on the hour; shorter ones every N minutes.
  const expression =
    minutes >= 60 ? `0 */${Math.max(1, Math.round(minutes / 60))} * * *` : `*/${minutes} * * * *`;
  cron.schedule(expression, () => refreshAll('scheduled'));
  console.log(`[scheduler] refresh every ${minutes} minutes (cron: ${expression})`);

  // Catch up shortly after boot for niches that have never been refreshed.
  setTimeout(() => {
    const stale = nicheService.listNiches().filter((n) => !n.last_refreshed_at);
    if (stale.length) refreshAll('initial sweep');
  }, 10_000);
}

module.exports = { start, refreshAll };
