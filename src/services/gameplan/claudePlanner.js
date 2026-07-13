// AI game plan generation via the Claude API. Structured outputs
// (output_config.format) guarantee the response matches the plan schema.

const Anthropic = require('@anthropic-ai/sdk');
const config = require('../../config');

const PLAN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['nicheSummary', 'positioning', 'hooks', 'formats', 'postingSchedule', 'hashtagStrategy', 'videoOutlines', 'kpis'],
  properties: {
    nicheSummary: { type: 'string' },
    positioning: { type: 'string' },
    hooks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['text', 'why'],
        properties: { text: { type: 'string' }, why: { type: 'string' } },
      },
    },
    formats: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'description', 'targetDuration'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          targetDuration: { type: 'string' },
        },
      },
    },
    postingSchedule: {
      type: 'object',
      additionalProperties: false,
      required: ['cadence', 'bestTimes', 'weeklyPlan'],
      properties: {
        cadence: { type: 'string' },
        bestTimes: { type: 'array', items: { type: 'string' } },
        weeklyPlan: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['day', 'format', 'idea'],
            properties: {
              day: { type: 'string' },
              format: { type: 'string' },
              idea: { type: 'string' },
            },
          },
        },
      },
    },
    hashtagStrategy: {
      type: 'object',
      additionalProperties: false,
      required: ['primary', 'secondary', 'broad'],
      properties: {
        primary: { type: 'array', items: { type: 'string' } },
        secondary: { type: 'array', items: { type: 'string' } },
        broad: { type: 'array', items: { type: 'string' } },
      },
    },
    videoOutlines: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'hook', 'beats', 'cta'],
        properties: {
          title: { type: 'string' },
          hook: { type: 'string' },
          beats: { type: 'array', items: { type: 'string' } },
          cta: { type: 'string' },
        },
      },
    },
    kpis: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['metric', 'target', 'timeframe'],
        properties: {
          metric: { type: 'string' },
          target: { type: 'string' },
          timeframe: { type: 'string' },
        },
      },
    },
  },
};

const SYSTEM_PROMPT = `You are a TikTok growth strategist. You analyze real performance data from a niche and produce a concrete, actionable content game plan for a creator entering that niche. Be specific to the niche and the data — never generic. Ground every recommendation in the supplied stats (views, engagement, saturation, velocity, estimated retention, top-video captions and durations). Include 5-8 hooks, 3-5 formats, a 7-day weekly plan, and 3 video outlines with second-by-second beats.`;

function buildPrompt({ niche, score, videos }) {
  const top = videos.slice(0, 10).map((v, i) => ({
    rank: i + 1,
    caption: v.caption,
    durationSeconds: v.durationSeconds,
    views: v.latest.views,
    engagementRate: +(v.engagementRate * 100).toFixed(2),
    estRetentionScore: Math.round(v.estWatchScore),
    authorFollowers: v.authorFollowers,
    hashtags: v.hashtags,
  }));

  return [
    `Create a TikTok content game plan for the niche "${niche.name}" (hashtags: ${niche.hashtags.map((t) => '#' + t).join(', ')}).`,
    '',
    'Niche stats (computed from tracked public videos; retention scores are estimates from engagement signals, not real watch time):',
    JSON.stringify(
      {
        medianViews: Math.round(score?.median_views || 0),
        avgEngagementRatePct: +((score?.avg_engagement_rate || 0) * 100).toFixed(2),
        viewVelocityPerHour: Math.round(score?.view_velocity || 0),
        creatorSaturationPct: +((score?.creator_saturation || 0) * 100).toFixed(0),
        estRetentionScore: Math.round(score?.est_watch_score || 0),
        opportunityScore: Math.round(score?.opportunity_score || 0),
        videoCount: score?.video_count || 0,
      },
      null,
      2
    ),
    '',
    'Top performing videos:',
    JSON.stringify(top, null, 2),
  ].join('\n');
}

async function generate({ niche, score, videos }) {
  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  const response = await client.messages.create({
    model: config.anthropicModel,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    output_config: { format: { type: 'json_schema', schema: PLAN_SCHEMA } },
    messages: [{ role: 'user', content: buildPrompt({ niche, score, videos }) }],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('Claude declined to generate this plan');
  }
  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text content in Claude response');
  return JSON.parse(textBlock.text);
}

module.exports = { generate };
