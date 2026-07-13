// Live TikTok data via Apify's TikTok Scraper actor (clockworks/tiktok-scraper).
// All Apify field-name mapping is isolated here — the actor's output schema
// drifts occasionally, so missing fields degrade to 0/null instead of throwing.

const axios = require('axios');
const config = require('../config');

const ACTOR = 'clockworks~tiktok-scraper';
const RUN_SYNC_URL = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items`;
const TIMEOUT_MS = 120_000;

function mapItem(item) {
  const stats = {
    views: item.playCount ?? item.plays ?? 0,
    likes: item.diggCount ?? item.likes ?? 0,
    comments: item.commentCount ?? item.comments ?? 0,
    shares: item.shareCount ?? item.shares ?? 0,
    saves: item.collectCount ?? item.saves ?? 0,
  };
  return {
    externalId: String(item.id ?? item.videoId ?? item.webVideoUrl ?? ''),
    url: item.webVideoUrl ?? item.url ?? null,
    authorHandle: item.authorMeta?.name ? `@${item.authorMeta.name}` : null,
    authorFollowers: item.authorMeta?.fans ?? null,
    caption: item.text ?? item.desc ?? null,
    hashtags: Array.isArray(item.hashtags) ? item.hashtags.map((h) => h.name ?? h).filter(Boolean) : [],
    durationSeconds: item.videoMeta?.duration ?? item.duration ?? null,
    postedAt: item.createTimeISO ?? (item.createTime ? new Date(item.createTime * 1000).toISOString() : null),
    stats,
  };
}

async function runActor(input) {
  const { data } = await axios.post(RUN_SYNC_URL, input, {
    params: { token: config.apifyToken },
    timeout: TIMEOUT_MS,
  });
  if (!Array.isArray(data)) return [];
  return data.filter((item) => item && item.id !== undefined).map(mapItem).filter((v) => v.externalId);
}

async function fetchVideosByHashtag(tag, { limit = 30 } = {}) {
  const clean = String(tag).replace(/^#/, '');
  return runActor({ hashtags: [clean], resultsPerPage: limit });
}

async function fetchTrendingByKeyword(query, { limit = 30 } = {}) {
  return runActor({ searchQueries: [String(query)], resultsPerPage: limit });
}

module.exports = { name: 'apify', fetchVideosByHashtag, fetchTrendingByKeyword };
