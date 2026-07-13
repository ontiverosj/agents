// Deterministic sample-data provider. Lets the whole app run and demo with
// zero API keys. Video identity is keyed on (tag, index) — never on time — so
// repeated refreshes hit the same videos and snapshots chain into a real time
// series. Stats grow with wall-clock time since a synthetic posted_at, which
// gives the scheduler genuine velocity curves to chart.

// Seed profiles chosen so niches differentiate meaningfully on the leaderboard.
const NICHE_PROFILES = {
  booktok: { baseViews: 900_000, engagement: 0.085, saturation: 0.55, growth: 1.0, durations: [25, 60] },
  'fitness-over-40': { baseViews: 350_000, engagement: 0.07, saturation: 0.2, growth: 1.15, durations: [30, 75] },
  'budget-meal-prep': { baseViews: 550_000, engagement: 0.095, saturation: 0.15, growth: 1.35, durations: [20, 45] },
  'ai-tools': { baseViews: 1_800_000, engagement: 0.06, saturation: 0.7, growth: 1.25, durations: [15, 40] },
  'home-organization': { baseViews: 420_000, engagement: 0.08, saturation: 0.3, growth: 1.05, durations: [20, 50] },
  'personal-finance': { baseViews: 700_000, engagement: 0.065, saturation: 0.5, growth: 1.1, durations: [30, 70] },
  'dog-training': { baseViews: 480_000, engagement: 0.09, saturation: 0.25, growth: 1.2, durations: [20, 55] },
  'skincare-science': { baseViews: 1_100_000, engagement: 0.075, saturation: 0.6, growth: 0.95, durations: [25, 60] },
  'van-life': { baseViews: 300_000, engagement: 0.088, saturation: 0.35, growth: 0.9, durations: [30, 90] },
  'study-tips': { baseViews: 650_000, engagement: 0.1, saturation: 0.2, growth: 1.3, durations: [15, 35] },
};

const HOOK_WORDS = ['nobody talks about', 'I tested', 'stop doing', 'the truth about', 'how I', '3 signs', 'watch before you try', 'POV:', 'day 1 of', 'you are doing'];
const ADJECTIVES = ['insane', 'underrated', 'viral', 'easy', 'life-changing', 'honest', 'realistic', 'beginner', 'advanced', 'daily'];
const HANDLE_PARTS = ['creator', 'daily', 'hq', 'official', 'guru', 'club', 'lab', 'journal', 'coach', 'world'];

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeTag(tag) {
  return String(tag).toLowerCase().replace(/^#/, '').replace(/\s+/g, '-');
}

// Unknown tags get a synthesized profile so discover works for any query.
function profileFor(tag) {
  const key = normalizeTag(tag);
  if (NICHE_PROFILES[key]) return NICHE_PROFILES[key];
  const rand = mulberry32(hashCode(key));
  return {
    baseViews: 100_000 + Math.floor(rand() * 1_500_000),
    engagement: 0.04 + rand() * 0.07,
    saturation: rand() * 0.7,
    growth: 0.85 + rand() * 0.55,
    durations: [15, 15 + Math.floor(rand() * 75)],
  };
}

function makeVideo(tag, index, profile) {
  const key = normalizeTag(tag);
  const rand = mulberry32(hashCode(`${key}::${index}`));

  const externalId = `mock-${key}-${index}`;
  const handle = `@${key.replace(/-/g, '')}_${HANDLE_PARTS[Math.floor(rand() * HANDLE_PARTS.length)]}${index}`;
  const isMega = rand() < profile.saturation;
  const authorFollowers = isMega
    ? 500_000 + Math.floor(rand() * 4_500_000)
    : 1_000 + Math.floor(rand() * 400_000);

  const [minD, maxD] = profile.durations;
  const durationSeconds = minD + Math.floor(rand() * Math.max(1, maxD - minD));

  const caption = `${HOOK_WORDS[Math.floor(rand() * HOOK_WORDS.length)]} ${ADJECTIVES[Math.floor(rand() * ADJECTIVES.length)]} ${key.replace(/-/g, ' ')} #${key.replace(/-/g, '')}`;
  const hashtags = [key.replace(/-/g, ''), 'fyp', ADJECTIVES[Math.floor(rand() * ADJECTIVES.length)]];

  // Synthetic post age: 1-30 days, stable per video.
  const ageDays = 1 + rand() * 29;
  const postedAtMs = Date.now() - ageDays * 24 * 3600 * 1000;

  // Views grow toward an asymptote as the video ages; recomputing later with a
  // larger elapsed time yields organically higher numbers.
  const viralBoost = rand() < 0.12 ? 4 + rand() * 8 : 1;
  const potential = profile.baseViews * (0.2 + rand() * 1.6) * viralBoost * profile.growth;
  const ageHours = (Date.now() - postedAtMs) / 3_600_000;
  const maturity = 1 - Math.exp(-ageHours / 90); // ~63% of potential after ~4 days
  const jitter = 0.97 + mulberry32(hashCode(`${key}::${index}::${Math.floor(Date.now() / 600_000)}`))() * 0.06;
  const views = Math.floor(potential * maturity * jitter);

  const er = profile.engagement * (0.7 + rand() * 0.6);
  const likes = Math.floor(views * er * 0.78);
  const comments = Math.floor(views * er * 0.06);
  const shares = Math.floor(views * er * 0.09);
  const saves = Math.floor(views * er * 0.07);

  return {
    externalId,
    url: `https://www.tiktok.com/${handle}/video/${7_000_000_000_000_000_000 + hashCode(externalId)}`,
    authorHandle: handle,
    authorFollowers,
    caption,
    hashtags,
    durationSeconds,
    postedAt: new Date(postedAtMs).toISOString(),
    stats: { views, likes, comments, shares, saves },
  };
}

async function fetchVideosByHashtag(tag, { limit = 30 } = {}) {
  const profile = profileFor(tag);
  return Array.from({ length: limit }, (_, i) => makeVideo(tag, i, profile));
}

async function fetchTrendingByKeyword(query, { limit = 30 } = {}) {
  return fetchVideosByHashtag(query, { limit });
}

module.exports = { name: 'mock', fetchVideosByHashtag, fetchTrendingByKeyword };
