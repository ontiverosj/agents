// Deterministic, zero-network game plan generator. Fills a strategy template
// from the niche's observed stats: hook archetypes with niche keywords,
// formats by dominant duration bucket, cadence by velocity, hashtag tiers
// mined from stored video hashtags.

const HOOK_ARCHETYPES = [
  { pattern: (kw) => `Nobody talks about this ${kw} mistake — and it's costing you`, why: 'Contrarian hooks create an information gap viewers stay to close.' },
  { pattern: (kw) => `I tested the most viral ${kw} advice so you don't have to`, why: 'Result-first framing promises a payoff for watching to the end.' },
  { pattern: (kw) => `POV: you finally figure out ${kw}`, why: 'POV format drives relatability and comment engagement.' },
  { pattern: (kw) => `3 ${kw} things I wish I knew sooner`, why: 'Numbered lists set clear expectations and boost completion rate.' },
  { pattern: (kw) => `Stop doing this if you care about ${kw}`, why: 'Pattern interrupts stop the scroll in the first second.' },
  { pattern: (kw) => `Day 1 of documenting my ${kw} journey`, why: 'Series format converts viewers into followers who return for updates.' },
  { pattern: (kw) => `The ${kw} routine that actually works (with proof)`, why: 'Proof-based claims earn saves and shares — the strongest ranking signals.' },
];

const BROAD_TAGS = ['fyp', 'foryou', 'viral', 'learnontiktok', 'tiktokmademedoit'];

function dominantDurationBucket(videos) {
  const buckets = { 'under 15s': 0, '15-35s': 0, '35-60s': 0, 'over 60s': 0 };
  for (const v of videos) {
    const d = v.durationSeconds || 30;
    if (d <= 15) buckets['under 15s']++;
    else if (d <= 35) buckets['15-35s']++;
    else if (d <= 60) buckets['35-60s']++;
    else buckets['over 60s']++;
  }
  return Object.entries(buckets).sort((a, b) => b[1] - a[1])[0][0];
}

function mineHashtags(videos, primary) {
  const counts = new Map();
  for (const v of videos) {
    for (const tag of v.hashtags || []) {
      const t = String(tag).toLowerCase();
      if (primary.includes(t) || BROAD_TAGS.includes(t)) continue;
      counts.set(t, (counts.get(t) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t);
}

function generate({ niche, score, videos }) {
  const kw = niche.name.toLowerCase();
  const bucket = dominantDurationBucket(videos);
  const velocity = score?.view_velocity || 0;
  const saturation = score?.creator_saturation || 0;
  const cadence = velocity > 5000 ? '2x/day' : velocity > 500 ? '1x/day' : '4-5x/week';

  const primaryTags = niche.hashtags.map((t) => String(t).toLowerCase());
  const topVideos = videos.slice(0, 3);

  return {
    nicheSummary: `${niche.name}: median views ${Math.round(score?.median_views || 0).toLocaleString()}, avg engagement ${((score?.avg_engagement_rate || 0) * 100).toFixed(1)}%, creator saturation ${(saturation * 100).toFixed(0)}%. ${saturation < 0.35 ? 'Low big-creator saturation — a new account can realistically break in.' : 'Large accounts dominate — differentiate with a sharper sub-angle.'}`,
    positioning: saturation < 0.35
      ? `Own a specific sub-angle of ${kw} and post consistently — the field is open enough that consistency wins.`
      : `Big accounts own the generic ${kw} content. Win by narrowing: pick an underserved audience segment or format and become the go-to voice for it.`,
    hooks: HOOK_ARCHETYPES.slice(0, 6).map((h) => ({ text: h.pattern(kw), why: h.why })),
    formats: [
      { name: 'Talking-head value drop', description: `Face-to-camera delivering one specific ${kw} insight. Hook in the first 1.5s, payoff by the midpoint.`, targetDuration: bucket },
      { name: 'Screen/B-roll tutorial', description: `Show, don't tell — demonstrate the ${kw} tip over b-roll or screen recording with text overlays.`, targetDuration: bucket },
      { name: 'Series episode', description: `A numbered ongoing series ("Part 3 of...") to convert viewers into followers.`, targetDuration: bucket === 'under 15s' ? '15-35s' : bucket },
    ],
    postingSchedule: {
      cadence,
      bestTimes: ['7-9am', '12-1pm', '7-10pm (local audience time)'],
      weeklyPlan: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
        day,
        format: ['Talking-head value drop', 'Screen/B-roll tutorial', 'Series episode'][i % 3],
        idea: HOOK_ARCHETYPES[i % HOOK_ARCHETYPES.length].pattern(kw),
      })),
    },
    hashtagStrategy: {
      primary: primaryTags,
      secondary: mineHashtags(videos, primaryTags),
      broad: BROAD_TAGS.slice(0, 3),
    },
    videoOutlines: topVideos.map((v, i) => ({
      title: `Riff on top performer #${i + 1} (${Math.round(v.latest.views).toLocaleString()} views)`,
      hook: HOOK_ARCHETYPES[i % HOOK_ARCHETYPES.length].pattern(kw),
      beats: [
        `0-3s: pattern-interrupt hook — reference: "${(v.caption || '').slice(0, 80)}"`,
        `3-${Math.min(15, v.durationSeconds || 15)}s: deliver the core value with on-screen text`,
        `final 5s: open loop or question to drive comments`,
      ],
      cta: 'Ask a specific question viewers must comment to answer; pin your own comment to seed replies.',
    })),
    kpis: [
      { metric: 'Average watch % (your TikTok analytics)', target: '> 60% for videos under 35s', timeframe: 'first 2 weeks' },
      { metric: 'Views per video', target: `> ${Math.max(1000, Math.round((score?.median_views || 10000) * 0.01)).toLocaleString()} within 48h`, timeframe: 'first month' },
      { metric: 'Posting consistency', target: cadence, timeframe: 'ongoing' },
      { metric: 'Follower conversion', target: '> 1 follower per 200 views', timeframe: 'first month' },
    ],
  };
}

module.exports = { generate };
