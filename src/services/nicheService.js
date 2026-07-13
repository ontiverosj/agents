const db = require('../db');
const provider = require('../providers');
const scoring = require('./scoring');

const now = () => new Date().toISOString();

function slugify(name) {
  return String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const parseJson = (text, fallback) => {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
};

function rowToNiche(row) {
  if (!row) return null;
  return {
    ...row,
    hashtags: parseJson(row.hashtags, []),
    keywords: parseJson(row.keywords, []),
  };
}

function createNiche({ name, hashtags, keywords = [] }) {
  const slug = slugify(name);
  const result = db
    .prepare(
      `INSERT INTO niches (name, slug, hashtags, keywords, created_at) VALUES (?, ?, ?, ?, ?)`
    )
    .run(name, slug, JSON.stringify(hashtags), JSON.stringify(keywords), now());
  return getNiche(result.lastInsertRowid);
}

function getNiche(id) {
  return rowToNiche(db.prepare(`SELECT * FROM niches WHERE id = ?`).get(id));
}

function listNiches(status = 'tracked') {
  return db.prepare(`SELECT * FROM niches WHERE status = ? ORDER BY id`).all(status).map(rowToNiche);
}

function archiveNiche(id) {
  db.prepare(`UPDATE niches SET status = 'archived' WHERE id = ?`).run(id);
}

function latestScore(nicheId) {
  return db
    .prepare(`SELECT * FROM niche_scores WHERE niche_id = ? ORDER BY computed_at DESC, id DESC LIMIT 1`)
    .get(nicheId);
}

function scoreHistory(nicheId, days = 30) {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  return db
    .prepare(`SELECT * FROM niche_scores WHERE niche_id = ? AND computed_at >= ? ORDER BY computed_at`)
    .all(nicheId, since);
}

// Aggregate totals across the niche's videos per refresh, for charts.
function metricTotals(nicheId, days = 30) {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  return db
    .prepare(
      `SELECT ms.captured_at AS t,
              SUM(ms.views) AS views, SUM(ms.likes) AS likes,
              SUM(ms.comments) AS comments, SUM(ms.shares) AS shares
       FROM metric_snapshots ms
       JOIN videos v ON v.id = ms.video_id
       WHERE v.niche_id = ? AND ms.captured_at >= ?
       GROUP BY ms.captured_at
       ORDER BY ms.captured_at`
    )
    .all(nicheId, since);
}

// Latest snapshot + previous snapshot per video, with derived per-video metrics.
function videosWithMetrics(nicheId, sort = 'views') {
  const rows = db
    .prepare(
      `SELECT v.*,
              latest.views, latest.likes, latest.comments, latest.shares, latest.saves,
              latest.captured_at,
              prev.views AS prev_views, prev.captured_at AS prev_captured_at
       FROM videos v
       JOIN metric_snapshots latest ON latest.id = (
         SELECT id FROM metric_snapshots WHERE video_id = v.id ORDER BY captured_at DESC, id DESC LIMIT 1
       )
       LEFT JOIN metric_snapshots prev ON prev.id = (
         SELECT id FROM metric_snapshots WHERE video_id = v.id ORDER BY captured_at DESC, id DESC LIMIT 1 OFFSET 1
       )
       WHERE v.niche_id = ?`
    )
    .all(nicheId);

  const enriched = rows.map((r) => {
    const stats = { views: r.views, likes: r.likes, comments: r.comments, shares: r.shares, saves: r.saves };
    const hoursBetween = r.prev_captured_at
      ? (new Date(r.captured_at) - new Date(r.prev_captured_at)) / 3_600_000
      : null;
    const hoursSincePosted = r.posted_at ? (Date.now() - new Date(r.posted_at)) / 3_600_000 : null;
    return {
      id: r.id,
      externalId: r.external_id,
      url: r.url,
      authorHandle: r.author_handle,
      authorFollowers: r.author_followers,
      caption: r.caption,
      hashtags: parseJson(r.hashtags, []),
      durationSeconds: r.duration_seconds,
      postedAt: r.posted_at,
      latest: stats,
      engagementRate: scoring.engagementRate(stats),
      viewVelocity: scoring.viewVelocity({
        views: r.views,
        prevViews: r.prev_views,
        hoursBetween,
        hoursSincePosted,
      }),
      estWatchScore: scoring.estimatedWatchScore(stats, r.duration_seconds),
    };
  });

  const sorters = {
    views: (a, b) => b.latest.views - a.latest.views,
    velocity: (a, b) => b.viewVelocity - a.viewVelocity,
    engagement: (a, b) => b.engagementRate - a.engagementRate,
    watch: (a, b) => b.estWatchScore - a.estWatchScore,
  };
  return enriched.sort(sorters[sort] || sorters.views);
}

const upsertVideo = db.prepare(
  `INSERT INTO videos (niche_id, external_id, url, author_handle, author_followers, caption, hashtags, duration_seconds, posted_at, first_seen_at)
   VALUES (@niche_id, @external_id, @url, @author_handle, @author_followers, @caption, @hashtags, @duration_seconds, @posted_at, @first_seen_at)
   ON CONFLICT(niche_id, external_id) DO UPDATE SET
     author_followers = excluded.author_followers,
     caption = COALESCE(excluded.caption, videos.caption),
     url = COALESCE(excluded.url, videos.url)
   `
);

const insertSnapshot = db.prepare(
  `INSERT INTO metric_snapshots (video_id, captured_at, views, likes, comments, shares, saves)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);

// Fetch fresh data for a niche, persist videos + snapshots, compute a score row.
async function refreshNiche(id) {
  const niche = getNiche(id);
  if (!niche) throw new Error(`Niche ${id} not found`);

  const seen = new Map(); // externalId -> RawVideo (dedupe across hashtags)
  for (const tag of niche.hashtags) {
    try {
      const videos = await provider.fetchVideosByHashtag(tag, { limit: 30 });
      for (const v of videos) {
        if (v.externalId && !seen.has(v.externalId)) seen.set(v.externalId, v);
      }
    } catch (err) {
      console.error(`[refresh] provider failed for #${tag} (niche ${id}):`, err.message);
    }
  }

  const capturedAt = now();
  const persist = db.transaction((rawVideos) => {
    for (const raw of rawVideos) {
      upsertVideo.run({
        niche_id: id,
        external_id: raw.externalId,
        url: raw.url,
        author_handle: raw.authorHandle,
        author_followers: raw.authorFollowers,
        caption: raw.caption,
        hashtags: JSON.stringify(raw.hashtags || []),
        duration_seconds: raw.durationSeconds,
        posted_at: raw.postedAt,
        first_seen_at: capturedAt,
      });
      const videoId = db
        .prepare(`SELECT id FROM videos WHERE niche_id = ? AND external_id = ?`)
        .get(id, raw.externalId).id;
      insertSnapshot.run(
        videoId,
        capturedAt,
        raw.stats.views || 0,
        raw.stats.likes || 0,
        raw.stats.comments || 0,
        raw.stats.shares || 0,
        raw.stats.saves || 0
      );
    }
  });
  persist([...seen.values()]);

  // Score from persisted per-video metrics (includes velocity from snapshot deltas).
  const videos = videosWithMetrics(id);
  const scoreInput = videos.map((v) => ({
    stats: v.latest,
    durationSeconds: v.durationSeconds,
    authorFollowers: v.authorFollowers,
    velocity: v.viewVelocity,
  }));

  // Momentum: current niche velocity vs the velocity recorded ~7 days ago.
  const history = scoreHistory(id, 8);
  const weekAgo = history.find(
    (s) => Date.now() - new Date(s.computed_at) > 6.5 * 24 * 3600 * 1000
  );
  const currentVelocity = scoring.median(scoreInput.map((v) => v.velocity || 0));
  const trend = weekAgo
    ? scoring.trendFactorFromVelocities(currentVelocity, weekAgo.view_velocity)
    : 0.5;

  const score = scoring.scoreNiche(scoreInput, trend);
  db.prepare(
    `INSERT INTO niche_scores (niche_id, computed_at, median_views, avg_engagement_rate, view_velocity, creator_saturation, est_watch_score, opportunity_score, video_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    capturedAt,
    score.median_views,
    score.avg_engagement_rate,
    score.view_velocity,
    score.creator_saturation,
    score.est_watch_score,
    score.opportunity_score,
    score.video_count
  );
  db.prepare(`UPDATE niches SET last_refreshed_at = ? WHERE id = ?`).run(capturedAt, id);

  return { ...score, computed_at: capturedAt };
}

// Provider preview for the add-niche flow; persists nothing.
async function discover(query, limit = 20) {
  const videos = await provider.fetchTrendingByKeyword(query, { limit });
  const scoreInput = videos.map((v) => ({
    stats: v.stats,
    durationSeconds: v.durationSeconds,
    authorFollowers: v.authorFollowers,
    velocity: v.postedAt
      ? scoring.viewVelocity({
          views: v.stats.views,
          hoursSincePosted: (Date.now() - new Date(v.postedAt)) / 3_600_000,
        })
      : 0,
  }));
  const preview = scoring.scoreNiche(scoreInput, 0.5);
  return {
    query,
    provider: provider.name,
    previewStats: preview,
    sampleVideos: videos.slice(0, 10).map((v) => ({
      ...v,
      engagementRate: scoring.engagementRate(v.stats),
      estWatchScore: scoring.estimatedWatchScore(v.stats, v.durationSeconds),
    })),
  };
}

module.exports = {
  createNiche,
  getNiche,
  listNiches,
  archiveNiche,
  latestScore,
  scoreHistory,
  metricTotals,
  videosWithMetrics,
  refreshNiche,
  discover,
  slugify,
};
