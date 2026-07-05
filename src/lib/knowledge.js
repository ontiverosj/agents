// U.S. product-market knowledge base.
// Each category powers analysis (trends, audiences, competitors, pricing,
// positioning) and generation (name word banks, logo motifs, content pillars).

const CATEGORIES = [
  {
    id: 'beauty',
    label: 'Beauty & Skincare',
    keywords: ['skincare', 'skin care', 'serum', 'moisturizer', 'cleanser', 'makeup', 'cosmetic', 'beauty', 'lotion', 'soap', 'lip balm', 'lipstick', 'haircare', 'hair care', 'shampoo', 'conditioner', 'sunscreen', 'spf', 'body butter', 'face mask', 'nail'],
    momentum: 88,
    marketNote: 'The U.S. beauty and personal care market is one of the largest consumer categories, with indie and creator-led brands consistently taking share from legacy players through social-first launches.',
    trends: [
      '"Skinimalism" — simple routines with fewer, multi-purpose products',
      'Ingredient transparency and clinical-style claims (percentages on the label)',
      'Clean, refill-friendly and low-waste packaging',
      'TikTok/Instagram-driven discovery; before-and-after content converts',
      'Men\'s grooming and unisex lines expanding the buyer base',
    ],
    audiences: [
      {
        name: 'Ingredient-conscious millennials',
        description: 'Ages 27–42, research-heavy shoppers who read labels and reviews before buying.',
        painPoints: ['Overwhelmed by conflicting product claims', 'Sensitive skin reactions from harsh formulas', 'Paying premium prices for filler ingredients'],
        channels: ['Instagram', 'TikTok', 'YouTube reviews', 'Reddit (r/SkincareAddiction)'],
      },
      {
        name: 'Gen Z routine-builders',
        description: 'Ages 16–26, trend-aware and driven by creators; loyal to brands with personality.',
        painPoints: ['Budget limits vs. desire for "shelfie" brands', 'Acne and skin-barrier issues from over-exfoliating trends', 'Distrust of ads; trust creators instead'],
        channels: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
      },
      {
        name: 'Busy self-care seekers',
        description: 'Ages 30–55, want effective routines that take minutes, value rituals and small luxuries.',
        painPoints: ['No time for 10-step routines', 'Products that promise but underdeliver', 'Hard to know what works for aging skin'],
        channels: ['Instagram', 'Facebook', 'Email newsletters', 'Podcasts'],
      },
    ],
    competitors: [
      { name: 'The Ordinary', angle: 'Radical ingredient transparency at drugstore prices', pricePoint: '$' },
      { name: 'Glossier', angle: 'Community-built, minimalist "skin first" lifestyle brand', pricePoint: '$$' },
      { name: 'CeraVe', angle: 'Dermatologist-backed essentials at mass-market scale', pricePoint: '$' },
      { name: 'Drunk Elephant', angle: 'Clean-clinical positioning with premium pricing', pricePoint: '$$$' },
    ],
    pricing: {
      budget: '$8–15 per item — compete on honesty and simplicity',
      mid: '$18–35 per item — the indie sweet spot; justify with hero ingredients and story',
      premium: '$40–90 per item — requires clinical proof, luxury packaging, or a strong founder story',
    },
    positioning: [
      'The honest expert: publish your formulas and explain every ingredient in plain English',
      'The one-step brand: replace a 5-product routine with one hero product',
      'The niche specialist: own one skin concern (e.g., rosacea, melanated skin, teen skin) completely',
      'The ritual brand: sell the 5-minute self-care moment, not just the product',
    ],
    opportunities: [
      'Underserved niches (sensitive skin, specific skin tones, men, teens) still lack trusted go-to brands',
      'Founder-led education content builds authority faster than ad spend in this category',
      'Bundling into simple "routines" raises average order value and reduces choice paralysis',
    ],
    nameRoots: ['Glow', 'Dew', 'Velvet', 'Petal', 'Lumen', 'Bloom', 'Silk', 'Aura', 'Ritual', 'Bare', 'Radiance', 'Sage'],
    morphemes: ['glo', 'lum', 'vela', 'dara', 'ora', 'skin', 'ami', 'nou'],
    contentPillars: ['Ingredient education', 'Before-and-after results', 'Morning/evening routine demos', 'Myth-busting skincare trends', 'Founder story and formulation process'],
    logoMotif: 'organic',
  },
  {
    id: 'fitness',
    label: 'Fitness & Wellness',
    keywords: ['fitness', 'workout', 'gym', 'yoga', 'pilates', 'supplement', 'protein', 'pre-workout', 'creatine', 'resistance band', 'dumbbell', 'wellness', 'meditation', 'recovery', 'foam roller', 'athletic', 'running', 'training', 'health coach'],
    momentum: 85,
    marketNote: 'U.S. health and wellness spending keeps climbing, and the market rewards personality-driven brands — fitness is one of the strongest categories for personal brands built on a founder\'s own transformation or method.',
    trends: [
      'Hybrid training (strength + mobility + recovery) over single-discipline programs',
      'Wearable-data-driven habits; customers want measurable progress',
      'Recovery products (sleep, mobility, massage) growing faster than performance products',
      'Community challenges and accountability groups drive retention',
      'Creator-led programs outperform faceless brands',
    ],
    audiences: [
      {
        name: 'Busy professionals getting back in shape',
        description: 'Ages 28–45, limited time, want efficient programs and honest guidance.',
        painPoints: ['No time for 90-minute gym sessions', 'Conflicting fitness advice online', 'Starting over repeatedly after falling off'],
        channels: ['Instagram', 'YouTube', 'Podcasts', 'Email'],
      },
      {
        name: 'Home-gym builders',
        description: 'Ages 25–50, invested in training at home, buy equipment and programs.',
        painPoints: ['Limited space and budget for equipment', 'Boredom and plateaus without variety', 'No coach to check form'],
        channels: ['YouTube', 'TikTok', 'Reddit (r/homegym)'],
      },
      {
        name: 'Wellness-first women 35+',
        description: 'Care about strength, hormones, longevity — not just aesthetics.',
        painPoints: ['Fitness advice built for 22-year-olds', 'Menopause/hormone changes ignored by mainstream brands', 'Gyms feel intimidating'],
        channels: ['Instagram', 'Facebook groups', 'Podcasts'],
      },
    ],
    competitors: [
      { name: 'Peloton', angle: 'Premium connected fitness with celebrity instructors', pricePoint: '$$$' },
      { name: 'Gymshark', angle: 'Creator-built apparel empire targeting young lifters', pricePoint: '$$' },
      { name: 'AG1 (Athletic Greens)', angle: 'One daily habit, heavy podcast sponsorship', pricePoint: '$$$' },
      { name: 'Alo Yoga', angle: 'Studio-to-street lifestyle and influencer seeding', pricePoint: '$$$' },
    ],
    pricing: {
      budget: '$10–25 (accessories, guides) — volume play, hard without an audience',
      mid: '$30–80 (equipment, apparel, supplements) — indie sweet spot with strong branding',
      premium: '$100+ (coaching, programs, premium equipment) — needs proof and testimonials',
    },
    positioning: [
      'The specific-method coach: name your training method and own it (e.g., "the 30/30 method")',
      'The busy-person brand: everything designed around 20–30 minute sessions',
      'The life-stage specialist: fitness for new moms, over-50s, desk workers',
      'The recovery-first brand: compete where the big players are weakest',
    ],
    opportunities: [
      'Personal transformation stories are the strongest marketing asset in this category',
      'Digital products (programs, plans) have near-zero marginal cost and pair with physical goods',
      'Life-stage niches (postpartum, 50+, injury recovery) are underserved and loyal',
    ],
    nameRoots: ['Forge', 'Apex', 'Stride', 'Pulse', 'Iron', 'Momentum', 'Vigor', 'Summit', 'Core', 'Kinetic', 'Tempo', 'Grit'],
    morphemes: ['fit', 'flex', 'vig', 'kor', 'stryv', 'moto', 'peak', 'liv'],
    contentPillars: ['Quick follow-along workouts', 'Form fixes and common mistakes', 'Client/member transformations', 'Nutrition made simple', 'Training myths debunked'],
    logoMotif: 'dynamic',
  },
  {
    id: 'food',
    label: 'Food & Beverage',
    keywords: ['coffee', 'tea', 'snack', 'sauce', 'hot sauce', 'spice', 'seasoning', 'jerky', 'chocolate', 'candy', 'juice', 'kombucha', 'drink', 'beverage', 'granola', 'honey', 'jam', 'bakery', 'baked', 'cookie', 'meal', 'food', 'protein bar', 'salsa'],
    momentum: 80,
    marketNote: 'U.S. specialty food and beverage thrives on small-batch stories — farmers-market-to-DTC is a proven path, and flavor-forward challenger brands regularly break out via social video.',
    trends: [
      'Bold global flavors (chili crisp, ube, yuzu, tajín) crossing into the mainstream',
      'Functional ingredients: adaptogens, protein, probiotics, no-alcohol alternatives',
      'Small-batch and single-origin stories command premium prices',
      'Nostalgia flavors reimagined with better ingredients',
      '"Grocery shelfie" packaging designed to be shared on social',
    ],
    audiences: [
      {
        name: 'Adventurous home cooks',
        description: 'Ages 25–45, cook most meals at home, hunt for flavor upgrades and pantry heroes.',
        painPoints: ['Bored of the same weeknight meals', 'Specialty ingredients hard to find locally', 'Big brands taste flat and over-sweetened'],
        channels: ['TikTok (recipe content)', 'Instagram', 'YouTube'],
      },
      {
        name: 'Health-conscious snackers',
        description: 'Ages 22–40, read nutrition labels, want snacks that fit macros without tasting like cardboard.',
        painPoints: ['"Healthy" snacks that taste bad', 'Hidden sugar and seed oils', 'Expensive habit at grocery prices'],
        channels: ['Instagram', 'TikTok', 'Amazon reviews'],
      },
      {
        name: 'Gift and occasion buyers',
        description: 'Buy premium consumables as gifts, care about packaging and story.',
        painPoints: ['Generic gift baskets feel impersonal', 'Hard to find gifts under $50 that feel special'],
        channels: ['Etsy', 'Instagram', 'Local markets', 'Email'],
      },
    ],
    competitors: [
      { name: 'Fly By Jing', angle: 'Founder-story-driven Sichuan flavors at premium prices', pricePoint: '$$$' },
      { name: 'Graza', angle: 'Single-product focus (olive oil) with playful squeeze-bottle branding', pricePoint: '$$' },
      { name: 'Liquid Death', angle: 'Pure branding play — water sold like a rock band', pricePoint: '$$' },
      { name: 'Chamberlain Coffee', angle: 'Creator-owned coffee brand built on an existing audience', pricePoint: '$$' },
    ],
    pricing: {
      budget: '$5–10 per unit — needs retail volume or bundles to work',
      mid: '$12–25 per unit — DTC sweet spot with strong packaging and story',
      premium: '$25–60 (gift sets, subscriptions) — packaging and origin story do the heavy lifting',
    },
    positioning: [
      'The single-hero brand: one product done unreasonably well (one sauce, one roast, one bar)',
      'The heritage brand: a family recipe or cultural tradition, told honestly',
      'The function brand: taste-first but engineered for a benefit (energy, protein, gut health)',
      'The personality brand: flavor plus a voice people follow for entertainment',
    ],
    opportunities: [
      'Recipe-format video content markets the product while being genuinely useful',
      'Bundles and subscriptions fix the low-ticket-price economics of food DTC',
      'Regional and cultural flavors with authentic founder stories are outperforming generic "clean" brands',
    ],
    nameRoots: ['Ember', 'Harvest', 'Copper', 'Maple', 'Hearth', 'Golden', 'Wildwood', 'Batch', 'Rooted', 'Sunday', 'Pepper', 'Grove'],
    morphemes: ['sav', 'tasta', 'noma', 'brix', 'zest', 'oro', 'umi', 'fina'],
    contentPillars: ['30-second recipes using the product', 'Behind-the-scenes small-batch production', 'Taste tests and pairings', 'Founder/origin story episodes', 'Customer creations and remixes'],
    logoMotif: 'crafted',
  },
  {
    id: 'fashion',
    label: 'Fashion & Apparel',
    keywords: ['clothing', 'apparel', 't-shirt', 'tshirt', 'hoodie', 'streetwear', 'fashion', 'dress', 'denim', 'jeans', 'hat', 'cap', 'sock', 'shoe', 'sneaker', 'activewear', 'loungewear', 'vintage', 'thrift', 'boutique', 'jacket'],
    momentum: 76,
    marketNote: 'U.S. apparel is crowded but permanently open to newcomers — small brands win with a sharp point of view, limited drops, and community, not with catalog breadth.',
    trends: [
      'Drop culture: limited releases create urgency and community',
      'Quality-over-quantity backlash against ultra-fast fashion',
      'Niche identity apparel (professions, hobbies, subcultures) with built-in audiences',
      'Blanks + print-on-demand lower the barrier; differentiation is all brand',
      'Secondhand and upcycled fashion normalizing "story" pieces',
    ],
    audiences: [
      {
        name: 'Subculture insiders',
        description: 'Ages 18–35, buy apparel that signals belonging to a scene, hobby, or identity.',
        painPoints: ['Mass brands feel generic', 'Designs that get the culture slightly wrong', 'Drops sell out or fit poorly'],
        channels: ['Instagram', 'TikTok', 'Discord', 'Reddit'],
      },
      {
        name: 'Conscious basics buyers',
        description: 'Ages 25–45, want fewer, better staples with honest sourcing.',
        painPoints: ['Fast fashion guilt', 'Premium basics priced out of reach', 'Greenwashing fatigue'],
        channels: ['Instagram', 'Email', 'YouTube'],
      },
      {
        name: 'Gift and fandom shoppers',
        description: 'Buy statement pieces and gifts around interests (pets, professions, hometowns).',
        painPoints: ['Cheesy designs on cheap blanks', 'Slow print-on-demand shipping'],
        channels: ['Etsy', 'Instagram', 'Facebook'],
      },
    ],
    competitors: [
      { name: 'Shein/Temu', angle: 'Bottomless cheap variety — impossible to beat on price, easy to beat on meaning', pricePoint: '$' },
      { name: 'Madhappy', angle: 'Optimism-branded streetwear with mental-health mission', pricePoint: '$$$' },
      { name: 'True Classic', angle: 'Fit-focused basics for regular guys, performance-marketing machine', pricePoint: '$$' },
      { name: 'Local boutique brands', angle: 'City/scene pride with small drops', pricePoint: '$$' },
    ],
    pricing: {
      budget: '$15–25 (tees) — viable with print-on-demand but thin margins',
      mid: '$28–60 (tees to hoodies) — needs strong design identity and quality blanks',
      premium: '$60–150 — requires cut-and-sew quality, story, and scarcity',
    },
    positioning: [
      'The scene brand: own one subculture or profession completely',
      'The message brand: wearable point-of-view people want to broadcast',
      'The quality-basics brand: fewer, better staples with transparent costs',
      'The local-pride brand: city or region identity done with taste',
    ],
    opportunities: [
      'Niche communities (nurses, anglers, plant people, gamers) buy identity apparel enthusiastically',
      'Limited drops turn small audiences into reliable revenue without inventory risk',
      'The founder\'s own style and story is the differentiation — document, don\'t just advertise',
    ],
    nameRoots: ['Thread', 'Cloth', 'Standard', 'Union', 'Avenue', 'Weekend', 'Canvas', 'District', 'Heritage', 'Form', 'Stitch', 'Nomad'],
    morphemes: ['wear', 'fit', 'mode', 'vint', 'kolo', 'true', 'form', 'urba'],
    contentPillars: ['Drop previews and behind-the-design', 'Styling and fit checks', 'Community spotlights wearing the brand', 'Quality/sourcing transparency', 'The scene/culture the brand serves'],
    logoMotif: 'monogram',
  },
  {
    id: 'home',
    label: 'Home & Living',
    keywords: ['candle', 'home decor', 'decor', 'pillow', 'blanket', 'organizer', 'organization', 'kitchen', 'mug', 'cup', 'tumbler', 'furniture', 'planter', 'plant', 'rug', 'wall art', 'print', 'ceramic', 'pottery', 'vase', 'home fragrance', 'diffuser', 'cleaning'],
    momentum: 72,
    marketNote: 'Home goods reward brands that sell a feeling — coziness, calm, order. Candles, ceramics, and organization products are classic first products for creator-led brands with strong visual identities.',
    trends: [
      '"Dopamine decor" and personality-rich pieces over beige minimalism',
      'Home fragrance as affordable luxury and gifting staple',
      'Organization content (restocking, labeling) drives product discovery on TikTok',
      'Handmade and small-batch ceramics/textiles command premium prices',
      'Multi-functional pieces for small spaces and renters',
    ],
    audiences: [
      {
        name: 'First-apartment nesters',
        description: 'Ages 22–32, furnishing rentals on a budget, want personality without permanence.',
        painPoints: ['Can\'t paint or renovate rentals', 'IKEA-sameness', 'Small spaces need clever products'],
        channels: ['TikTok', 'Instagram', 'Pinterest'],
      },
      {
        name: 'Cozy-home curators',
        description: 'Ages 28–50, homeowners who treat their space as self-expression and buy seasonally.',
        painPoints: ['Mass-market decor feels soulless', 'Quality hard to judge online', 'Seasonal refresh gets expensive'],
        channels: ['Pinterest', 'Instagram', 'Email'],
      },
      {
        name: 'Gift-givers',
        description: 'Buy candles, mugs, and decor as default gifts; packaging matters as much as product.',
        painPoints: ['Gifts that feel generic', 'Shipping fragile items'],
        channels: ['Etsy', 'Instagram', 'Local markets'],
      },
    ],
    competitors: [
      { name: 'Brooklinen', angle: 'Hotel-quality basics with direct pricing', pricePoint: '$$' },
      { name: 'Homesick Candles', angle: 'Nostalgia-concept candles (states, memories) — concept-first product', pricePoint: '$$' },
      { name: 'Our Place', angle: 'One hero product (Always Pan) with lifestyle-brand energy', pricePoint: '$$$' },
      { name: 'Etsy makers', angle: 'Handmade authenticity at every price point', pricePoint: '$–$$$' },
    ],
    pricing: {
      budget: '$12–24 — accessories and small decor; bundle to lift order value',
      mid: '$25–60 — candles, ceramics, textiles with strong branding',
      premium: '$60–200 — handmade, personalized, or hero-product plays',
    },
    positioning: [
      'The concept brand: every product ties to one emotional idea (nostalgia, calm, celebration)',
      'The maker brand: the founder\'s hands and process are the story',
      'The small-space brand: everything designed for renters and tiny homes',
      'The gift-first brand: packaging, notes, and unboxing designed for giving',
    ],
    opportunities: [
      'Scent and texture can\'t be shipped digitally — reviews and video build the bridge',
      'Personalization (names, hometowns, dates) doubles perceived value cheaply',
      'Seasonal collections create natural repeat-purchase rhythm',
    ],
    nameRoots: ['Hearth', 'Haven', 'Nook', 'Willow', 'Clay', 'Linen', 'Dwell', 'Ember', 'Fern', 'Alcove', 'Homestead', 'Wick'],
    morphemes: ['casa', 'dom', 'nest', 'hyg', 'terra', 'lume', 'aura', 'kin'],
    contentPillars: ['Room styling before/after', 'Behind-the-scenes making process', 'Cozy rituals featuring the product', 'Small-space solutions', 'Seasonal collection stories'],
    logoMotif: 'organic',
  },
  {
    id: 'pets',
    label: 'Pet Products',
    keywords: ['dog', 'cat', 'pet', 'puppy', 'kitten', 'leash', 'collar', 'pet treat', 'dog treat', 'cat toy', 'dog toy', 'pet bed', 'litter', 'aquarium', 'bird', 'grooming', 'pet food'],
    momentum: 84,
    marketNote: 'U.S. pet spending is famously recession-resistant and keeps growing — "pet parents" treat animals like family and pay premium prices for health, safety, and style.',
    trends: [
      'Pet humanization: birthday kits, matching owner/pet gear, "gotcha day" gifts',
      'Health-forward treats and supplements with human-grade ingredients',
      'Breed-specific and size-specific products replacing one-size-fits-all',
      'Pet influencer accounts as a marketing channel and brand model',
      'Stylish gear that matches home decor (no more neon nylon)',
    ],
    audiences: [
      {
        name: 'Millennial pet parents',
        description: 'Ages 26–42, often child-free, treat pets as family and budget accordingly.',
        painPoints: ['Cheap products that break or aren\'t safe', 'Ugly gear that clashes with their aesthetic', 'Confusing ingredient labels on treats'],
        channels: ['Instagram', 'TikTok', 'Chewy reviews'],
      },
      {
        name: 'New puppy/kitten owners',
        description: 'In a 6-month buying frenzy; need everything and want guidance.',
        painPoints: ['Don\'t know what they actually need', 'Overwhelmed by choices', 'Training struggles'],
        channels: ['YouTube', 'TikTok', 'Google search', 'Facebook groups'],
      },
      {
        name: 'Senior-pet caretakers',
        description: 'Focused on comfort, mobility, and health of aging animals.',
        painPoints: ['Few products designed for old pets', 'Vet costs make prevention appealing'],
        channels: ['Facebook', 'Email', 'Vet recommendations'],
      },
    ],
    competitors: [
      { name: 'Wild One', angle: 'Design-forward walk gear in muted modern colors', pricePoint: '$$$' },
      { name: 'BarkBox', angle: 'Subscription surprise-and-delight with big personality', pricePoint: '$$' },
      { name: 'The Farmer\'s Dog', angle: 'Fresh human-grade food, subscription-first', pricePoint: '$$$' },
      { name: 'Chewy private labels', angle: 'Value pricing with unbeatable logistics', pricePoint: '$' },
    ],
    pricing: {
      budget: '$8–18 (toys, treats) — repeat purchase is the game',
      mid: '$20–50 (gear, beds, bundles) — design and durability justify it',
      premium: '$50–150 (subscriptions, custom gear, health lines) — trust and proof required',
    },
    positioning: [
      'The design brand: pet gear that looks like it belongs in a nice home',
      'The health brand: transparent ingredients and vet-informed formulation',
      'The breed/lifestyle specialist: products for one type of dog life (hiking dogs, apartment cats)',
      'The celebration brand: own pet birthdays, adoptions, and milestones',
    ],
    opportunities: [
      'A pet-and-founder duo is a natural, endlessly renewable content engine',
      'New-owner starter kits capture customers at their highest-spend moment',
      'Matching human+pet products double order value and are highly shareable',
    ],
    nameRoots: ['Wag', 'Paw', 'Fetch', 'Whisker', 'Bark', 'Scout', 'Tail', 'Bandit', 'Biscuit', 'Rover', 'Purr', 'Kibble'],
    morphemes: ['paw', 'wag', 'fur', 'pup', 'meow', 'tail', 'peto', 'ruff'],
    contentPillars: ['Pets using/testing products', 'New-owner tips and checklists', 'Ingredient and safety education', 'Customer pet spotlights', 'Founder\'s pet as brand mascot'],
    logoMotif: 'playful',
  },
  {
    id: 'tech',
    label: 'Tech & Gadgets',
    keywords: ['gadget', 'tech', 'phone case', 'charger', 'cable', 'stand', 'desk', 'keyboard', 'mouse', 'headphone', 'earbud', 'speaker', 'smart home', 'accessory', 'laptop', 'tablet', 'camera', 'drone', 'led', 'electronics', '3d print'],
    momentum: 78,
    marketNote: 'Tech accessories and desk-setup products ride the remote-work and creator-economy waves. Differentiation comes from design taste and problem-specific engineering, since most hardware is commoditized.',
    trends: [
      'Desk-setup culture: aesthetic workspaces as identity and content genre',
      'MagSafe/modular ecosystems create accessory opportunities',
      'Sustainable materials (recycled aluminum, plant-based cases) as differentiator',
      'Niche-specific gear: products for streamers, travelers, students',
      '"Everyday carry" community drives premium small-goods sales',
    ],
    audiences: [
      {
        name: 'Desk-setup enthusiasts',
        description: 'Ages 20–40, remote workers and creators who treat their desk as a hobby.',
        painPoints: ['Cable clutter ruins the aesthetic', 'Cheap accessories fail fast', 'Hard to find cohesive-looking gear'],
        channels: ['YouTube', 'Instagram', 'Reddit (r/battlestations)'],
      },
      {
        name: 'Practical commuters & travelers',
        description: 'Ages 25–50, want reliable, compact gear that just works.',
        painPoints: ['Chargers and cables that die in months', 'Bulky gear', 'Counterfeit-quality products on marketplaces'],
        channels: ['Amazon', 'YouTube reviews', 'Google search'],
      },
      {
        name: 'Students & first-setup buyers',
        description: 'Budget-conscious but aspirational; buy in back-to-school waves.',
        painPoints: ['Premium brands out of budget', 'Not sure what\'s worth the money'],
        channels: ['TikTok', 'YouTube', 'Amazon'],
      },
    ],
    competitors: [
      { name: 'Anker', angle: 'Reliability at scale — owns "safe default" positioning', pricePoint: '$$' },
      { name: 'Grovemade', angle: 'Premium natural-material desk goods, design-led', pricePoint: '$$$' },
      { name: 'Peak Design', angle: 'Engineer-founder credibility with crowdfunded launches', pricePoint: '$$$' },
      { name: 'AliExpress white-label', angle: 'Same factories, no brand — the floor you must differentiate above', pricePoint: '$' },
    ],
    pricing: {
      budget: '$12–25 — must out-design commodity gear, not out-price it',
      mid: '$30–80 — design-led accessories with strong visuals',
      premium: '$90–300 — engineering story, materials, and warranty required',
    },
    positioning: [
      'The taste brand: cohesive design system across all products — buy the whole desk',
      'The one-problem brand: solve a specific annoyance perfectly (cables, travel, glare)',
      'The niche-workflow brand: gear built for one job (streaming, field work, note-taking)',
      'The materials brand: sustainable or premium materials as identity',
    ],
    opportunities: [
      'Setup tours and product-in-context video outperform spec sheets',
      'Crowdfunding validates demand and funds inventory before launch',
      'Bundled "kits" for specific workflows lift order value and reduce decision fatigue',
    ],
    nameRoots: ['Bolt', 'Circuit', 'Nova', 'Orbit', 'Flux', 'Vector', 'Pixel', 'Beacon', 'Modul', 'Axis', 'Signal', 'Dock'],
    morphemes: ['tek', 'byte', 'volt', 'neo', 'zen', 'gridd', 'omni', 'sync'],
    contentPillars: ['Desk/setup transformations', 'Problem-solution product demos', 'Design and engineering process', 'Gear guides for specific workflows', 'Customer setup features'],
    logoMotif: 'geometric',
  },
  {
    id: 'baby',
    label: 'Baby & Kids',
    keywords: ['baby', 'infant', 'toddler', 'kids', 'children', 'nursery', 'diaper', 'stroller', 'onesie', 'toy', 'montessori', 'teether', 'swaddle', 'parenting', 'mom', 'newborn', 'crib'],
    momentum: 74,
    marketNote: 'Parents research obsessively and trust other parents most — baby brands grow through word-of-mouth, registries, and parent-creator recommendations. Safety credibility is non-negotiable.',
    trends: [
      'Montessori-style and screen-free toys with developmental claims',
      'Neutral, decor-friendly palettes replacing primary-color plastic',
      'Registry-driven discovery (Babylist) favors distinctive products',
      'Parent-founder stories ("I made this because nothing worked") convert strongly',
      'Milestone and keepsake products for documenting childhood',
    ],
    audiences: [
      {
        name: 'First-time expecting parents',
        description: 'Research everything, build registries, anxious about safety and quality.',
        painPoints: ['Overwhelming conflicting advice', 'Fear of unsafe materials', 'Budget shock of baby prep'],
        channels: ['Instagram', 'TikTok', 'Babylist', 'Parenting podcasts'],
      },
      {
        name: 'Intentional-parenting millennials',
        description: 'Ages 28–40, curate what enters the home; value development and aesthetics.',
        painPoints: ['Toy clutter and plastic overload', 'Products kids ignore after a day', 'Hard to verify developmental claims'],
        channels: ['Instagram', 'Pinterest', 'Email'],
      },
      {
        name: 'Grandparents & gift-givers',
        description: 'High willingness to spend on quality and keepsakes.',
        painPoints: ['Don\'t know what parents actually want', 'Fear of duplicating registry items'],
        channels: ['Facebook', 'Etsy', 'Google search'],
      },
    ],
    competitors: [
      { name: 'Lovevery', angle: 'Development-stage subscription kits with expert credibility', pricePoint: '$$$' },
      { name: 'Kyte Baby', angle: 'One hero material (bamboo) across sleepwear', pricePoint: '$$' },
      { name: 'Melissa & Doug', angle: 'Trusted classic toys at accessible prices', pricePoint: '$$' },
      { name: 'Amazon basics brands', angle: 'Cheap essentials — can\'t match on trust or design', pricePoint: '$' },
    ],
    pricing: {
      budget: '$10–20 — accessories and small goods; gifting bundles help',
      mid: '$25–60 — the registry sweet spot with strong safety story',
      premium: '$60–200 — heirloom quality, personalization, or subscription kits',
    },
    positioning: [
      'The parent-founder brand: built to solve your own kid\'s problem',
      'The development brand: every product tied to a stage and skill',
      'The heirloom brand: quality and design meant to be passed down',
      'The calm-nursery brand: aesthetic cohesion parents are proud to photograph',
    ],
    opportunities: [
      'Registry placement (Babylist et al.) is a discovery channel most small brands ignore',
      'Milestone content (month-by-month guides) builds trust before purchase',
      'Personalized keepsakes carry the strongest margins in the category',
    ],
    nameRoots: ['Sprout', 'Little', 'Wren', 'Nest', 'Cub', 'Fable', 'Lark', 'Sunny', 'Poppy', 'Bloom', 'Tiny', 'Meadow'],
    morphemes: ['bebe', 'lil', 'nino', 'kiko', 'luna', 'momo', 'pip', 'tot'],
    contentPillars: ['Stage-by-stage development tips', 'Real-parent product demos', 'Safety and materials transparency', 'Nursery tours and organization', 'Founder parenting story'],
    logoMotif: 'playful',
  },
  {
    id: 'outdoor',
    label: 'Outdoor & Adventure',
    keywords: ['camping', 'hiking', 'outdoor', 'fishing', 'hunting', 'kayak', 'climbing', 'trail', 'backpack', 'tent', 'cooler', 'knife', 'flashlight', 'survival', 'garden', 'bike', 'cycling', 'adventure', 'national park', 'overland'],
    momentum: 75,
    marketNote: 'Outdoor recreation participation in the U.S. remains at record highs since 2020. The category rewards authenticity — brands founded by actual practitioners with field-tested products.',
    trends: [
      'Car camping and overlanding bringing new, gear-hungry audiences outdoors',
      '"Gorpcore" crossover: technical gear worn as everyday fashion',
      'Ultralight and packable everything for hikers and travelers',
      'Public-lands and conservation values as brand identity',
      'Beginner-friendly content lowering the intimidation barrier',
    ],
    audiences: [
      {
        name: 'Weekend warriors',
        description: 'Ages 25–45, office jobs, escape outdoors on weekends; buy gear as aspiration.',
        painPoints: ['Gear overwhelm as beginners', 'Expensive mistakes on wrong gear', 'Limited storage space'],
        channels: ['YouTube', 'Instagram', 'Reddit (r/camping)'],
      },
      {
        name: 'Dedicated practitioners',
        description: 'Anglers, climbers, hunters who know exactly what\'s wrong with current gear.',
        painPoints: ['Big brands dumbing down products', 'Durability declining', 'Marketing over field-testing'],
        channels: ['YouTube', 'Forums', 'Podcasts'],
      },
      {
        name: 'Outdoor-adjacent lifestyle buyers',
        description: 'Buy the aesthetic (mugs, tees, stickers) more than technical gear.',
        painPoints: ['Technical brands feel gatekeep-y', 'Want the vibe without the jargon'],
        channels: ['Instagram', 'TikTok', 'Etsy'],
      },
    ],
    competitors: [
      { name: 'YETI', angle: 'Overbuilt quality turned into status symbol', pricePoint: '$$$' },
      { name: 'REI Co-op brand', angle: 'Trusted house brand with member loyalty', pricePoint: '$$' },
      { name: 'Parks Project', angle: 'Conservation mission + lifestyle apparel', pricePoint: '$$' },
      { name: 'Direct-from-factory gear', angle: 'Cheap and improving — brand story is the moat', pricePoint: '$' },
    ],
    pricing: {
      budget: '$12–30 (accessories, apparel) — lifestyle angle works here',
      mid: '$35–90 — field-tested credibility and warranties matter',
      premium: '$100–400 — buy-it-for-life positioning with proof',
    },
    positioning: [
      'The practitioner brand: founded and field-tested by someone who actually does the thing',
      'The beginner\'s-guide brand: gear plus education for intimidated newcomers',
      'The buy-it-for-life brand: fewer products, overbuilt, guaranteed',
      'The place brand: identity around a region, park, or trail culture',
    ],
    opportunities: [
      'Field-test content (real trips, real failures) builds unmatched trust',
      'Beginner kits solve gear-overwhelm and lift average order value',
      'Conservation partnerships align values and earn organic press',
    ],
    nameRoots: ['Ridge', 'Timber', 'Summit', 'Basin', 'Cairn', 'Drift', 'Pine', 'Granite', 'Trail', 'North', 'Wilder', 'Outpost'],
    morphemes: ['terra', 'peak', 'wild', 'nor', 'trek', 'roam', 'alta', 'camp'],
    contentPillars: ['Field tests and trip reports', 'Beginner how-to guides', 'Gear maintenance and repair', 'Conservation and public lands', 'Customer adventure features'],
    logoMotif: 'badge',
  },
  {
    id: 'stationery',
    label: 'Stationery, Art & Crafts',
    keywords: ['stationery', 'journal', 'notebook', 'planner', 'sticker', 'pen', 'art print', 'illustration', 'craft', 'diy', 'crochet', 'knitting', 'embroidery', 'painting', 'digital art', 'greeting card', 'washi', 'scrapbook', 'calligraphy'],
    momentum: 70,
    marketNote: 'Stationery and craft products are deeply personal, gift-friendly, and creator-native — artists routinely turn a following into a product line. Low startup costs make it a classic first brand.',
    trends: [
      'Analog backlash: journaling, planning, and paper as digital detox',
      'Sticker and stationery "hauls" as a content genre',
      'Craft kits (everything included) for beginners exploding',
      'Artist-branded products: the illustrator IS the brand',
      'Planner communities with methodologies (bullet journaling et al.)',
    ],
    audiences: [
      {
        name: 'Journalers & planners',
        description: 'Ages 18–40, build rituals around planning and reflection; buy repeatedly.',
        painPoints: ['Paper quality disappointments', 'Planners that don\'t fit their system', 'Falling off the habit'],
        channels: ['Instagram', 'TikTok', 'YouTube', 'Pinterest'],
      },
      {
        name: 'Craft hobbyists',
        description: 'All ages, want quality supplies and guided projects.',
        painPoints: ['Intimidating skill curves', 'Buying wrong supplies for a project', 'Big-box craft stores overwhelm'],
        channels: ['YouTube', 'Pinterest', 'Etsy', 'Facebook groups'],
      },
      {
        name: 'Art collectors & gifters',
        description: 'Buy prints, cards, and small art as affordable self-expression.',
        painPoints: ['Mass-produced art feels empty', 'Finding artists whose style they love'],
        channels: ['Instagram', 'Etsy', 'Art fairs'],
      },
    ],
    competitors: [
      { name: 'Papier', angle: 'Personalized stationery with fashion-brand aesthetics', pricePoint: '$$' },
      { name: 'Archer & Olive', angle: 'Creator-built journal brand with signature paper quality', pricePoint: '$$$' },
      { name: 'Etsy artists', angle: 'Infinite variety; brand cohesion is the differentiator', pricePoint: '$–$$' },
      { name: 'Amazon imports', angle: 'Cheap volume — no story, no community', pricePoint: '$' },
    ],
    pricing: {
      budget: '$4–12 (stickers, cards) — repeat purchases and bundles drive revenue',
      mid: '$15–40 (journals, prints, kits) — quality and art style justify it',
      premium: '$45–120 (kits, custom work, collections) — personalization and scarcity',
    },
    positioning: [
      'The artist brand: one recognizable illustration style across everything',
      'The method brand: products built around a planning/journaling methodology you teach',
      'The kit brand: complete beginner experiences, not just supplies',
      'The paper-quality brand: obsess over materials others cheap out on',
    ],
    opportunities: [
      'Process videos (drawing, printing, packing orders) are effortless authentic content',
      'Subscription boxes and seasonal collections stabilize inherently gift-driven revenue',
      'Teaching (tutorials, classes) builds the audience that then buys the products',
    ],
    nameRoots: ['Quill', 'Fable', 'Marginalia', 'Inkwell', 'Paper', 'Doodle', 'Plume', 'Press', 'Folio', 'Sketch', 'Muse', 'Parchment'],
    morphemes: ['ink', 'pluma', 'arto', 'craft', 'scrib', 'pagea', 'lino', 'mark'],
    contentPillars: ['Process and studio behind-the-scenes', 'Plan-with-me / journal-with-me sessions', 'Tutorials and technique tips', 'Collection launch stories', 'Community creations'],
    logoMotif: 'crafted',
  },
  {
    id: 'jewelry',
    label: 'Jewelry & Accessories',
    keywords: ['jewelry', 'necklace', 'ring', 'bracelet', 'earring', 'gold', 'silver', 'charm', 'pendant', 'watch', 'sunglasses', 'bag', 'purse', 'wallet', 'accessories', 'anklet', 'permanent jewelry'],
    momentum: 73,
    marketNote: 'Jewelry blends self-expression, gifting, and sentiment — small brands win with meaning (symbols, birthstones, milestones) and demi-fine quality between fast fashion and fine jewelry.',
    trends: [
      'Demi-fine boom: gold-filled and vermeil quality at accessible prices',
      'Meaning-driven pieces: zodiac, birth flowers, coordinates, milestones',
      'Permanent jewelry experiences (welded bracelets) as retail theater',
      'Waterproof "wear everywhere" positioning removing care anxiety',
      'Stacking and layering culture drives multi-item purchases',
    ],
    audiences: [
      {
        name: 'Everyday-luxury self-purchasers',
        description: 'Ages 24–40, buy jewelry for themselves as identity and reward.',
        painPoints: ['Fast-fashion pieces tarnish fast', 'Fine jewelry priced for occasions only', 'Green skin and allergies from mystery metals'],
        channels: ['Instagram', 'TikTok', 'Pinterest'],
      },
      {
        name: 'Sentimental gift-buyers',
        description: 'Shopping for meaning — anniversaries, graduations, memorials, new moms.',
        painPoints: ['Generic gifts feel thoughtless', 'Fear of choosing wrong style/size', 'Engraving and custom options confusing'],
        channels: ['Etsy', 'Google search', 'Instagram', 'Email'],
      },
      {
        name: 'Trend-forward Gen Z stackers',
        description: 'Build layered looks, buy often at lower price points.',
        painPoints: ['Keeping up with trends affordably', 'Quality roulette on marketplace sites'],
        channels: ['TikTok', 'Instagram', 'Pinterest'],
      },
    ],
    competitors: [
      { name: 'Mejuri', angle: 'Everyday fine jewelry, "buy it for yourself" positioning', pricePoint: '$$$' },
      { name: 'Ana Luisa', angle: 'Sustainability-framed demi-fine at mid prices', pricePoint: '$$' },
      { name: 'Etsy makers', angle: 'Personalization and handmade sentiment', pricePoint: '$–$$' },
      { name: 'Shein accessories', angle: 'Trend speed at throwaway prices', pricePoint: '$' },
    ],
    pricing: {
      budget: '$15–35 — trend pieces; quality claims must be honest',
      mid: '$40–120 — demi-fine sweet spot (gold-filled, sterling)',
      premium: '$150–500 — solid gold, custom work, heirloom positioning',
    },
    positioning: [
      'The meaning brand: every piece tells or marks something (dates, places, people)',
      'The quality-truth brand: educate on metals and back it with guarantees',
      'The wear-everywhere brand: waterproof, workout-proof, life-proof',
      'The maker brand: designed and finished by the founder, small batches',
    ],
    opportunities: [
      'Personalization (engraving, birthstones, initials) commands 2–3x margins',
      'Gift-occasion SEO and email flows capture high-intent buyers year-round',
      'Try-on and styling video content converts better than product photography',
    ],
    nameRoots: ['Gilded', 'Aurelia', 'Luster', 'Keepsake', 'Solstice', 'Vera', 'Halo', 'Mira', 'Opaline', 'Charm', 'Astra', 'Loulou'],
    morphemes: ['aur', 'gem', 'lume', 'ella', 'vio', 'stell', 'ora', 'mira'],
    contentPillars: ['Styling and stacking tutorials', 'The meaning behind each piece', 'Metal/quality education', 'Customer milestone stories', 'Studio and making process'],
    logoMotif: 'elegant',
  },
  {
    id: 'digital',
    label: 'Coaching & Digital Products',
    keywords: ['course', 'coaching', 'ebook', 'template', 'digital product', 'consulting', 'membership', 'newsletter', 'notion', 'preset', 'printable', 'masterclass', 'workshop', 'freelance', 'service', 'agency', 'online business', 'saas'],
    momentum: 82,
    marketNote: 'The U.S. creator economy keeps expanding — knowledge products and services have the highest margins of any category, and the personal brand IS the product. Trust is the entire funnel.',
    trends: [
      'Micro-products ($9–49) as low-friction entry points to bigger offers',
      'Cohort-based and community-led programs outperforming self-paced courses',
      'Niching down: "LinkedIn coach for dentists" beats "business coach"',
      'Newsletter-first businesses building owned audiences off-platform',
      'Productized services: fixed-scope, fixed-price replacing hourly billing',
    ],
    audiences: [
      {
        name: 'Side-hustle starters',
        description: 'Ages 24–40, employed but building an exit; buy roadmaps and templates.',
        painPoints: ['Information overload, execution paralysis', 'Fear of wasting money on gurus', 'Limited time after work hours'],
        channels: ['YouTube', 'TikTok', 'Twitter/X', 'Podcasts'],
      },
      {
        name: 'Established freelancers leveling up',
        description: 'Want systems, positioning, and pricing help to escape feast-famine.',
        painPoints: ['Undercharging and scope creep', 'Inconsistent lead flow', 'Trading time for money'],
        channels: ['LinkedIn', 'Twitter/X', 'Newsletters'],
      },
      {
        name: 'Professionals buying transformation',
        description: 'Pay premium for outcomes: career changes, health, relationships, skills.',
        painPoints: ['Skeptical of coaching-industry hype', 'Need proof and structure, not motivation'],
        channels: ['LinkedIn', 'Podcasts', 'Referrals', 'Email'],
      },
    ],
    competitors: [
      { name: 'Established course creators in your niche', angle: 'First-mover audiences — differentiate on specificity and proof', pricePoint: '$$$' },
      { name: 'Skillshare/Udemy', angle: 'Commodity pricing — avoid competing here', pricePoint: '$' },
      { name: 'Free YouTube content', angle: 'Your real competitor; sell structure and outcomes, not information', pricePoint: 'Free' },
      { name: 'Niche newsletters', angle: 'Owning attention in your space before you arrive', pricePoint: '$$' },
    ],
    pricing: {
      budget: '$9–49 (templates, guides) — entry offers that build the buyer list',
      mid: '$97–497 (courses, workshops) — core offers with clear outcomes',
      premium: '$1,000–10,000 (coaching, cohorts, done-for-you) — proof and positioning required',
    },
    positioning: [
      'The specific-outcome brand: promise one measurable result for one audience',
      'The proof-of-work brand: build in public and let receipts do the selling',
      'The method brand: name your framework and become synonymous with it',
      'The anti-guru brand: radical honesty about what works and what doesn\'t',
    ],
    opportunities: [
      'A tight niche makes every piece of content, testimonial, and offer more persuasive',
      'Free value content compounds: one great post can outperform months of ads',
      'The offer ladder (free → $29 → $297 → $2,000) turns one audience into a business',
    ],
    nameRoots: ['Blueprint', 'Compass', 'Leverage', 'Catalyst', 'North', 'Framework', 'Momentum', 'Playbook', 'Signal', 'Elevate', 'Anchor', 'Sprint'],
    morphemes: ['grow', 'scale', 'menta', 'lift', 'path', 'lead', 'flow', 'edge'],
    contentPillars: ['Teach the method in public', 'Client results and case studies', 'Behind-the-scenes of the business', 'Contrarian takes on industry norms', 'Personal story and lessons'],
    logoMotif: 'geometric',
  },
  {
    id: 'general',
    label: 'General Consumer Products',
    keywords: [],
    momentum: 65,
    marketNote: 'This product doesn\'t map cleanly to a single category — often a sign of an interesting cross-niche opportunity. The strategies below apply broadly to U.S. direct-to-consumer brands.',
    trends: [
      'Personal brands outperform faceless brands: people buy from people',
      'Short-form video is the discovery engine for new products',
      'Niche-first beats mass-market for new entrants',
      'Owned channels (email, SMS) matter more as ad costs rise',
      'Story and values drive willingness to pay premium prices',
    ],
    audiences: [
      {
        name: 'Early-adopter enthusiasts',
        description: 'The subset of any market that actively hunts for new and better products.',
        painPoints: ['Mainstream options ignore their specific needs', 'Hard to find brands that "get it"'],
        channels: ['TikTok', 'Instagram', 'Reddit', 'YouTube'],
      },
      {
        name: 'Values-driven shoppers',
        description: 'Choose brands aligned with identity: local, sustainable, founder-led.',
        painPoints: ['Greenwashing and fake founder stories', 'Premium prices without premium substance'],
        channels: ['Instagram', 'Email', 'Word of mouth'],
      },
    ],
    competitors: [
      { name: 'Amazon marketplace sellers', angle: 'Price and speed — differentiate on brand and trust', pricePoint: '$' },
      { name: 'Category incumbents', angle: 'Distribution and awareness — outmaneuver with focus and speed', pricePoint: '$$' },
      { name: 'Other DTC challengers', angle: 'Same playbooks — win with authentic story and sharper niche', pricePoint: '$$' },
    ],
    pricing: {
      budget: 'Entry pricing to remove risk for first-time buyers',
      mid: 'Core offer priced on value delivered, not cost-plus',
      premium: 'Premium tier for superfans: bundles, personalization, limited editions',
    },
    positioning: [
      'The niche-first brand: dominate a small audience before expanding',
      'The founder brand: your face, story, and taste as the differentiator',
      'The single-problem brand: one pain point solved better than anyone',
    ],
    opportunities: [
      'Cross-category products can define a new niche instead of competing in an old one',
      'Document the building of the brand itself — the journey attracts the first customers',
      'Direct customer conversations beat market reports at this stage',
    ],
    nameRoots: ['True', 'Ember', 'Nova', 'Atlas', 'Field', 'Honor', 'Craft', 'Modern', 'Prime', 'Origin', 'Bright', 'Keystone'],
    morphemes: ['nova', 'vero', 'alta', 'kin', 'luma', 'sol', 'ora', 'ven'],
    contentPillars: ['Founder journey building the brand', 'Product in real life', 'Customer stories', 'The why behind the brand', 'Education around the problem you solve'],
    logoMotif: 'geometric',
  },
];

function detectCategory(text) {
  const haystack = String(text || '').toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const cat of CATEGORIES) {
    if (cat.id === 'general') continue;
    let score = 0;
    for (const kw of cat.keywords) {
      if (haystack.includes(kw)) {
        // Longer keywords are more specific signals.
        score += kw.length > 6 ? 2 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }
  return { category: best || getCategory('general'), matched: bestScore > 0 };
}

function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES.find((c) => c.id === 'general');
}

function listCategories() {
  return CATEGORIES.map((c) => ({ id: c.id, label: c.label }));
}

module.exports = { CATEGORIES, detectCategory, getCategory, listCategories };
