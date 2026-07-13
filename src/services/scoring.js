// Pure scoring functions. All watch-time/retention figures are ESTIMATES
// derived from public engagement signals — TikTok does not expose real watch
// time for other creators' videos. Weights are collected here for easy tuning.

const WEIGHTS = {
  // engagement rate components
  comments: 2,
  shares: 3,
  saves: 2,
  // opportunity score components (must sum to 1)
  demand: 0.3,
  engagement: 0.2,
  achievability: 0.25,
  momentum: 0.15,
  retention: 0.1,
  // thresholds
  megaCreatorFollowers: 500_000, // above this an author counts toward saturation
  engagementCeiling: 0.1, // ER at or above this maps to a full engagement score
  demandLogCeiling: 7, // log10(views) that maps to a full demand score (10M median)
};

const clamp01 = (x) => Math.max(0, Math.min(1, x));

function engagementRate({ views, likes, comments, shares, saves }) {
  const v = Math.max(views, 1);
  return (likes + WEIGHTS.comments * comments + WEIGHTS.shares * shares + WEIGHTS.saves * saves) / v;
}

// Views per hour. Prefers the delta between two snapshots; falls back to
// lifetime average since posting when snapshots are missing or too close
// together for the delta to be meaningful.
function viewVelocity({ views, prevViews = null, hoursBetween = null, hoursSincePosted = null }) {
  if (prevViews !== null && hoursBetween && hoursBetween >= 1) {
    return Math.max(0, (views - prevViews) / hoursBetween);
  }
  if (hoursSincePosted && hoursSincePosted > 0) {
    return views / hoursSincePosted;
  }
  return 0;
}

// Duration sweet-spot factor: TikTok's algorithm favors completions, and
// completion likelihood varies by length bucket.
function durationFactor(durationSeconds) {
  if (durationSeconds == null) return 1.0;
  if (durationSeconds <= 15) return 0.9;
  if (durationSeconds <= 35) return 1.0;
  if (durationSeconds <= 60) return 0.95;
  return 0.85;
}

// Estimated retention score, 0-100. A proxy built from interaction depth
// (comments/shares correlate with finishing a video), save rate, and
// engagement — NOT real watch-time data.
function estimatedWatchScore(stats, durationSeconds) {
  const v = Math.max(stats.views, 1);
  const interactionDepth = (stats.comments + stats.shares) / v;
  const saveSignal = (stats.saves || 0) / v;
  const er = engagementRate(stats);
  const raw =
    (interactionDepth * 30 + saveSignal * 25) * durationFactor(durationSeconds) +
    0.25 * Math.min(er / 0.08, 1);
  return clamp01(raw) * 100;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Aggregate per-video metrics into a niche-level score row.
// videos: [{ stats, durationSeconds, authorFollowers, velocity }]
// trendFactor: 0-1 momentum (0.5 = flat) computed by the caller from history.
function scoreNiche(videos, trendFactor = 0.5) {
  if (!videos.length) {
    return {
      median_views: 0,
      avg_engagement_rate: 0,
      view_velocity: 0,
      creator_saturation: 0,
      est_watch_score: 0,
      opportunity_score: 0,
      video_count: 0,
    };
  }

  const medianViews = median(videos.map((v) => v.stats.views));
  const avgEngagement = videos.reduce((s, v) => s + engagementRate(v.stats), 0) / videos.length;
  const avgWatch = videos.reduce((s, v) => s + estimatedWatchScore(v.stats, v.durationSeconds), 0) / videos.length;
  const nicheVelocity = median(videos.map((v) => v.velocity || 0));
  const saturation =
    videos.filter((v) => (v.authorFollowers || 0) > WEIGHTS.megaCreatorFollowers).length / videos.length;

  const demand = clamp01(Math.log10(Math.max(medianViews, 1)) / WEIGHTS.demandLogCeiling);
  const engagement = clamp01(avgEngagement / WEIGHTS.engagementCeiling);
  const achievability = 1 - saturation;
  const momentum = clamp01(trendFactor);
  const retention = avgWatch / 100;

  const opportunity =
    100 *
    (WEIGHTS.demand * demand +
      WEIGHTS.engagement * engagement +
      WEIGHTS.achievability * achievability +
      WEIGHTS.momentum * momentum +
      WEIGHTS.retention * retention);

  return {
    median_views: medianViews,
    avg_engagement_rate: avgEngagement,
    view_velocity: nicheVelocity,
    creator_saturation: saturation,
    est_watch_score: avgWatch,
    opportunity_score: opportunity,
    video_count: videos.length,
  };
}

// Normalize a now-vs-then velocity ratio into a 0-1 momentum factor.
// ratio 0.5 (halved) -> 0, ratio 1 (flat) -> ~0.33, ratio 2 (doubled) -> 1.
function trendFactorFromVelocities(currentVelocity, pastVelocity) {
  if (!pastVelocity || pastVelocity <= 0) return 0.5;
  const ratio = Math.max(0.5, Math.min(2, currentVelocity / pastVelocity));
  return (ratio - 0.5) / 1.5;
}

module.exports = {
  WEIGHTS,
  engagementRate,
  viewVelocity,
  durationFactor,
  estimatedWatchScore,
  scoreNiche,
  trendFactorFromVelocities,
  median,
};
