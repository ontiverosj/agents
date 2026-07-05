// Product intake analysis: turns a product name/description into structured
// market, audience, and brand-opportunity insights.

const { detectCategory, getCategory } = require('./knowledge');
const { createRng, pickN, intBetween } = require('./seed');

function analyzeProduct({ product, description = '', categoryId = '', goals = '', tone = '' }) {
  const inputText = `${product} ${description}`.trim();
  let category;
  let detected = false;
  if (categoryId) {
    category = getCategory(categoryId);
    detected = true;
  } else {
    const result = detectCategory(inputText);
    category = result.category;
    detected = result.matched;
  }

  const rand = createRng(`analyze:${inputText}:${category.id}`);

  // Opportunity score blends category momentum with how specific the input is —
  // a described niche is a stronger starting point than a bare product name.
  const specificity = Math.min(20, Math.floor(String(description).split(/\s+/).filter(Boolean).length / 3));
  const score = Math.min(97, Math.max(40, category.momentum + specificity + intBetween(rand, -6, 6) - 5));

  const scoreLabel =
    score >= 85 ? 'Strong opportunity' :
    score >= 70 ? 'Promising opportunity' :
    score >= 55 ? 'Viable with sharp positioning' :
    'Challenging — niche down further';

  return {
    product,
    description,
    goals,
    tone,
    category: { id: category.id, label: category.label, detected },
    opportunityScore: score,
    opportunityLabel: scoreLabel,
    marketNote: category.marketNote,
    trends: category.trends,
    audiences: category.audiences,
    competitors: category.competitors,
    pricing: category.pricing,
    positioning: pickN(rand, category.positioning, Math.min(4, category.positioning.length)),
    brandOpportunities: category.opportunities,
    nextSteps: buildNextSteps(category, rand),
  };
}

function buildNextSteps(category, rand) {
  const universal = [
    'Talk to 5–10 people in your target audience before finalizing the brand direction',
    'Search USPTO trademark records and social handles before committing to a name',
    'Pick ONE primary audience segment for launch — you can expand later',
    'Set up an email list on day one; it\'s the only channel you fully own',
  ];
  const categorySpecific = {
    beauty: 'Order competitor products and document what their unboxing/packaging gets right and wrong',
    fitness: 'Publish your method or transformation story publicly before you sell anything',
    food: 'Do a farmers market or local pop-up to test flavor reactions face-to-face',
    fashion: 'Mock up 3 designs and test demand with a pre-order or waitlist drop',
    home: 'Photograph products in real rooms, not white backgrounds — context sells here',
    pets: 'Get 10 pet owners to test the product and film their pets\' reactions',
    tech: 'Post the problem you\'re solving in relevant subreddits and measure the response',
    baby: 'Verify safety/compliance requirements (CPSC, ASTM) for your product type first',
    outdoor: 'Field-test publicly: document real trips using the product, including failures',
    stationery: 'Share your design process on social for 2 weeks and see what resonates',
    jewelry: 'Test 3 price points with small batches before committing to inventory',
    digital: 'Pre-sell to 5 people before building the full product',
    general: 'Run a small landing-page test to measure real interest before investing in inventory',
  };
  const steps = universal.slice();
  if (categorySpecific[category.id]) steps.splice(1, 0, categorySpecific[category.id]);
  return steps;
}

module.exports = { analyzeProduct };
