// Assembles the final brand package: analysis + chosen brand concept +
// visual identity + content ideas + marketing direction.

const { analyzeProduct } = require('./analyzer');
const { generateBrandConcepts } = require('./names');
const { generateIdentity } = require('./identity');
const { getCategory } = require('./knowledge');
const { createRng, pickN, shuffle } = require('./seed');

const CONTENT_FORMATS = [
  'a 30-second talking-head video on',
  'a carousel post breaking down',
  'a before/after reel showing',
  'a "day in the life" story featuring',
  'a myth-vs-fact post about',
  'a behind-the-scenes clip of',
  'a customer spotlight around',
  'a quick tutorial on',
  'a "3 things I wish I knew" post about',
  'a poll or question sticker asking your audience about',
];

function buildContentIdeas(category, brandName, rand) {
  const pillars = shuffle(rand, category.contentPillars);
  const formats = shuffle(rand, CONTENT_FORMATS);
  const ideas = [];
  for (let i = 0; i < 8; i++) {
    const pillar = pillars[i % pillars.length].toLowerCase();
    let format = formats[i % formats.length];
    // Avoid awkward repeats like "a behind-the-scenes clip of behind-the-scenes …"
    if (format.includes('behind-the-scenes') && pillar.includes('behind-the-scenes')) {
      format = formats[(i + 1) % formats.length];
    }
    ideas.push(`Post ${format} ${pillar}`.replace(/\s+/g, ' '));
  }
  return ideas;
}

function buildMarketingPlan(category, audience, rand) {
  const channels = audience ? audience.channels : ['Instagram', 'TikTok', 'Email'];
  return {
    primaryChannels: channels.slice(0, 3),
    weekOne: [
      'Claim your social handles and set up profiles with your new bio and logo',
      'Post your founder story: who you are, what you\'re building, and why',
      'Start a simple email list with a one-line value promise',
    ],
    firstMonth: [
      `Publish 3–4 posts per week rotating your content pillars: ${pickN(rand, category.contentPillars, 3).map((p) => p.toLowerCase()).join('; ')}`,
      'DM or email 20 people in your target audience for honest feedback',
      'Collect your first 5 testimonials or reactions — screenshot everything',
      'Test one small paid boost ($50–100) on your best-performing organic post',
    ],
    positioning: 'Lead with your niche and your face. At this stage, one recognizable person consistently showing up beats a polished faceless brand.',
  };
}

function buildSocialBios(brandName, tagline, category, rand) {
  const cat = category.label.split('&')[0].trim();
  const taglineFlat = tagline.replace(/\.+$/, '');
  const options = [
    `${tagline} | ${cat} for people who get it. 👇 Shop below`,
    `Founder-built ${cat.toLowerCase()} brand. ${tagline}`,
    `${brandName} — ${taglineFlat}. New drops + behind-the-scenes here first.`,
    `Small brand, big care. "${tagline}" 💬 DMs open`,
  ];
  return pickN(rand, options, 3);
}

function buildBrandPackage(input) {
  const {
    clientName = '', businessIdea = '', product, description = '', categoryId = '',
    audienceIndex = 0, tone = 'bold', style = 'modern', personality = '',
    preferredColors = '', brandName: chosenName = '', tagline: chosenTagline = '',
    goals = '', variant = 0,
  } = input;

  const analysis = analyzeProduct({ product, description, categoryId, goals, tone });
  const category = getCategory(analysis.category.id);
  const concepts = generateBrandConcepts({
    product, categoryId: analysis.category.id, tone, founderName: clientName, variant,
  });

  const concept = chosenName
    ? (concepts.find((c) => c.name === chosenName) || { name: chosenName, style: 'Client selection', taglines: [chosenTagline || concepts[0].taglines[0]], rationale: 'Selected by the client.', handles: [`@${chosenName.toLowerCase().replace(/[^a-z0-9]/g, '')}`] })
    : concepts[0];
  const tagline = chosenTagline || concept.taglines[0];

  const identity = generateIdentity({
    brandName: concept.name, categoryId: analysis.category.id, style, personality, preferredColors, variant,
  });

  const audience = analysis.audiences[Math.min(audienceIndex, analysis.audiences.length - 1)] || analysis.audiences[0];
  const rand = createRng(`package:${concept.name}:${variant}`);

  return {
    generatedFor: clientName || null,
    businessIdea: businessIdea || null,
    brand: {
      name: concept.name,
      tagline,
      alternateTaglines: (concept.taglines || []).filter((t) => t !== tagline),
      namingRationale: concept.rationale,
      handles: concept.handles,
    },
    positioning: {
      category: analysis.category.label,
      opportunityScore: analysis.opportunityScore,
      opportunityLabel: analysis.opportunityLabel,
      strategy: analysis.positioning[0],
      marketNote: analysis.marketNote,
    },
    audienceProfile: audience,
    competitors: analysis.competitors,
    pricing: analysis.pricing,
    identity: {
      style: identity.style,
      palette: identity.palettes[0],
      fonts: identity.fonts,
      logos: identity.logos,
      direction: identity.direction,
      originality: identity.originality,
    },
    socialBios: buildSocialBios(concept.name, tagline, category, rand),
    contentIdeas: buildContentIdeas(category, concept.name, rand),
    marketingPlan: buildMarketingPlan(category, audience, rand),
    nextSteps: analysis.nextSteps,
  };
}

module.exports = { buildBrandPackage };
