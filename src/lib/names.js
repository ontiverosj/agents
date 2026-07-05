// Brand concept generation: names, taglines, positioning one-liners,
// and social handle ideas — driven by category word banks and tone.

const { getCategory, detectCategory } = require('./knowledge');
const { createRng, pick, pickN, shuffle } = require('./seed');

const TONES = {
  bold: {
    label: 'Bold & Confident',
    adjectives: ['Fierce', 'Untamed', 'Prime', 'Rogue', 'Alpha', 'Rebel', 'Stark', 'Vivid'],
    suffixes: ['Co.', 'Supply', 'Standard', 'Works', 'Collective', 'Labs'],
    taglines: [
      'Built different. Made for {audience}.',
      'No shortcuts. Just {benefit}.',
      'The {category} brand that doesn\'t play it safe.',
      '{benefit}, or nothing.',
      'Dare to {verb}.',
    ],
  },
  friendly: {
    label: 'Warm & Friendly',
    adjectives: ['Happy', 'Sunny', 'Kind', 'Honest', 'Cozy', 'Bright', 'Good', 'Merry'],
    suffixes: ['& Co.', 'Goods', 'Club', 'Company', 'Corner', 'Collective'],
    taglines: [
      'Made with care, for {audience}.',
      '{benefit} — the friendly way.',
      'Your new favorite {category} brand.',
      'Good things for {audience}.',
      'Here to help you {verb}.',
    ],
  },
  premium: {
    label: 'Premium & Refined',
    adjectives: ['Maison', 'Noble', 'Sterling', 'Reserve', 'Heritage', 'Atelier', 'Signature', 'Private'],
    suffixes: ['House', 'Atelier', 'Reserve', 'Studio', '& Sons', 'Estate'],
    taglines: [
      'Quietly exceptional {category}.',
      '{benefit}, elevated.',
      'For those who notice the difference.',
      'Crafted for {audience} who expect more.',
      'The art of {verb_ing}.',
    ],
  },
  playful: {
    label: 'Playful & Fun',
    adjectives: ['Wobbly', 'Zesty', 'Peppy', 'Snappy', 'Bouncy', 'Cheeky', 'Wiggly', 'Jolly'],
    suffixes: ['Club', 'Party', 'Squad', 'Co.', 'Crew', 'Land'],
    taglines: [
      'Seriously good {category}. Not-so-serious brand.',
      '{benefit} — with a wink.',
      'Life\'s short. {verb_cap}.',
      'The fun way to {verb}.',
      'Warning: may cause joy.',
    ],
  },
  minimal: {
    label: 'Minimal & Modern',
    adjectives: ['Bare', 'Plain', 'Pure', 'Simple', 'Common', 'Basic', 'Clear', 'Still'],
    suffixes: ['Studio', 'Objects', 'Form', 'Standard', 'Essentials', 'Index'],
    taglines: [
      '{benefit}. Nothing else.',
      'Less, but better.',
      'Simply {benefit}.',
      '{category_cap}, distilled.',
      'Everything you need. Nothing you don\'t.',
    ],
  },
  earthy: {
    label: 'Earthy & Organic',
    adjectives: ['Wild', 'Rooted', 'Golden', 'Humble', 'Native', 'Fern', 'Meadow', 'River'],
    suffixes: ['Goods', 'Farm', 'Roots', 'Trading Co.', 'Provisions', 'Grove'],
    taglines: [
      'From the earth, for {audience}.',
      '{benefit}, naturally.',
      'Slow made. Well made.',
      'Rooted in {benefit}.',
      'Grown, not manufactured.',
    ],
  },
};

const CATEGORY_BENEFITS = {
  beauty: { benefit: 'skin you feel good in', verb: 'glow', audience: 'real skin' },
  fitness: { benefit: 'strength that lasts', verb: 'move', audience: 'busy people' },
  food: { benefit: 'flavor worth slowing down for', verb: 'savor', audience: 'hungry people' },
  fashion: { benefit: 'style that means something', verb: 'wear it loud', audience: 'people like you' },
  home: { benefit: 'a home that feels like you', verb: 'get cozy', audience: 'homebodies' },
  pets: { benefit: 'happier pets', verb: 'spoil them', audience: 'pet parents' },
  tech: { benefit: 'gear that just works', verb: 'upgrade', audience: 'people who notice details' },
  baby: { benefit: 'calmer parenting', verb: 'grow', audience: 'growing families' },
  outdoor: { benefit: 'gear you can trust out there', verb: 'get out there', audience: 'people who\'d rather be outside' },
  stationery: { benefit: 'ideas worth putting on paper', verb: 'make something', audience: 'makers' },
  jewelry: { benefit: 'pieces that mean something', verb: 'shine', audience: 'sentimental people' },
  digital: { benefit: 'results you can measure', verb: 'level up', audience: 'ambitious people' },
  general: { benefit: 'quality you can feel', verb: 'choose better', audience: 'people who care' },
};

const INVENTED_ENDINGS = ['a', 'o', 'ia', 'io', 'ora', 'era', 'ely', 'ish', 'va', 'en', 'ae', 'una'];

function titleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function cleanHandle(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function fillTagline(template, slots) {
  return template
    .replace('{benefit}', slots.benefit)
    .replace('{audience}', slots.audience)
    .replace('{verb_cap}', titleCase(slots.verb))
    .replace('{verb_ing}', slots.verb.endsWith('e') ? slots.verb.slice(0, -1) + 'ing' : slots.verb + 'ing')
    .replace('{verb}', slots.verb)
    .replace('{category_cap}', titleCase(slots.category))
    .replace('{category}', slots.category)
    .replace(/^./, (c) => c.toUpperCase());
}

function generateBrandConcepts({ product, categoryId, tone = 'bold', founderName = '', variant = 0 }) {
  const category = categoryId ? getCategory(categoryId) : detectCategory(product).category;
  const toneData = TONES[tone] || TONES.bold;
  const rand = createRng(`brands:${product}:${category.id}:${tone}:${founderName}:${variant}`);

  const slots = {
    ...(CATEGORY_BENEFITS[category.id] || CATEGORY_BENEFITS.general),
    category: category.label.split('&')[0].trim().toLowerCase(),
  };

  const roots = shuffle(rand, category.nameRoots);
  const adjectives = shuffle(rand, toneData.adjectives);
  const morphemes = shuffle(rand, category.morphemes);
  const taglinePool = shuffle(rand, toneData.taglines);

  const concepts = [];

  // Strategy 1: Evocative root + suffix ("Ember Supply")
  concepts.push({
    name: `${roots[0]} ${pick(rand, toneData.suffixes)}`,
    style: 'Evocative + Suffix',
    rationale: `"${roots[0]}" carries the feeling of the category while the suffix signals an established, shoppable brand. Easy to say, easy to remember.`,
  });

  // Strategy 2: Adjective + root compound ("Wild Fern")
  concepts.push({
    name: `${adjectives[0]} ${roots[1]}`,
    style: 'Two-Word Compound',
    rationale: `Pairs a ${toneData.label.toLowerCase()} adjective with a category-rooted noun. Reads like a brand people already trust, with room to shorten to "${roots[1]}" as a nickname.`,
  });

  // Strategy 3: Invented word ("Glowora")
  const invented = titleCase(morphemes[0] + pick(rand, INVENTED_ENDINGS));
  concepts.push({
    name: invented,
    style: 'Invented Name',
    rationale: `A coined word built from category sounds — distinctive, ownable, and more likely to have open trademarks and handles. You define what it means.`,
  });

  // Strategy 4: "The [Adjective] [Root]"
  concepts.push({
    name: `The ${adjectives[1]} ${roots[2]}`,
    style: 'The + Descriptor',
    rationale: `The definite article makes it feel like THE destination for this niche. Conversational and memorable — works especially well for content-led brands.`,
  });

  // Strategy 5: Personal brand (uses founder name when given)
  if (founderName && founderName.trim()) {
    const first = founderName.trim().split(/\s+/)[0];
    const personalForms = [
      `${titleCase(first)} & Co.`,
      `House of ${titleCase(first)}`,
      `${titleCase(first)}'s ${roots[3]}`,
      `By ${titleCase(first)}`,
    ];
    concepts.push({
      name: pick(rand, personalForms),
      style: 'Personal Brand',
      rationale: `Puts you at the center of the brand. Personal names build trust fastest for founder-led businesses and grow with you across products.`,
    });
  } else {
    concepts.push({
      name: `${roots[3]} & ${roots[4]}`,
      style: 'Paired Nouns',
      rationale: `Two category words joined like a partnership — feels crafted and heritage-inspired, with a rhythm that sticks.`,
    });
  }

  // Strategy 6: Modern compound (root + morpheme, TitleCase merged)
  const modern = titleCase(morphemes[1]) + titleCase(morphemes[2] || roots[5].toLowerCase());
  concepts.push({
    name: modern,
    style: 'Modern Compound',
    rationale: `A merged compound in the style of modern digital-native brands — compact, app-friendly, and strong as a wordmark.`,
  });

  // Attach taglines + handles to every concept
  return concepts.map((concept, i) => {
    const taglines = pickN(createRng(`tag:${concept.name}:${variant}`), taglinePool, 3)
      .map((t) => fillTagline(t, slots));
    const handle = cleanHandle(concept.name);
    return {
      ...concept,
      taglines,
      handles: [`@${handle}`, `@${handle}co`, `@shop.${handle}`, `@${handle}.official`].slice(0, 3),
      note: 'Check USPTO trademark records and handle availability before committing to any name.',
    };
  });
}

function listTones() {
  return Object.entries(TONES).map(([id, t]) => ({ id, label: t.label }));
}

module.exports = { generateBrandConcepts, listTones, TONES };
