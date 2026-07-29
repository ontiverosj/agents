#!/usr/bin/env node
/*
 * Cron entrypoint: trigger the daily Sentry re-engagement sweep.
 * Invoked by the Render cron service (see render.yaml); can also be run
 * from any scheduler:
 *   SERVER_URL=https://... AGENT_TOOLS_TOKEN=... node scripts/run-sentry-sweep.js
 */
const axios = require('axios');

const SERVER_URL = (process.env.SERVER_URL || '').replace(/\/$/, '');
const TOKEN = process.env.AGENT_TOOLS_TOKEN;
if (!SERVER_URL || !TOKEN) {
  console.error('Required env vars: SERVER_URL, AGENT_TOOLS_TOKEN');
  process.exit(1);
}

axios
  .post(
    `${SERVER_URL}/jobs/sentry-sweep`,
    { stale_days: Number(process.env.SENTRY_STALE_DAYS) || 14 },
    { headers: { Authorization: `Bearer ${TOKEN}` }, timeout: 120000 }
  )
  .then(({ data }) => {
    console.log(`Sentry sweep queued ${data.queued} call(s)`, data.data ? `(batch: ${data.data.id || 'ok'})` : '');
  })
  .catch((err) => {
    console.error('Sweep failed:', JSON.stringify(err.response?.data || err.message));
    process.exit(1);
  });
