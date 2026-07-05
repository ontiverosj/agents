// Visual identity generation: color palettes, font pairings, visual style
// direction, and original SVG logo concepts (generated geometry — no cloning
// of existing marks).

const { getCategory } = require('./knowledge');
const { createRng, pick, pickN, intBetween } = require('./seed');

// ---------- Color utilities ----------

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

const COLOR_WORDS = [
  { words: ['red', 'crimson', 'scarlet'], hue: 4 },
  { words: ['orange', 'tangerine', 'coral', 'peach', 'terracotta', 'rust'], hue: 22 },
  { words: ['gold', 'yellow', 'mustard', 'amber', 'honey'], hue: 44 },
  { words: ['olive', 'chartreuse', 'lime'], hue: 85 },
  { words: ['green', 'emerald', 'forest', 'sage'], hue: 145 },
  { words: ['mint', 'seafoam'], hue: 162 },
  { words: ['teal', 'turquoise', 'aqua'], hue: 178 },
  { words: ['cyan', 'sky'], hue: 195 },
  { words: ['blue', 'azure', 'cobalt'], hue: 218 },
  { words: ['navy', 'midnight'], hue: 225 },
  { words: ['indigo', 'denim'], hue: 248 },
  { words: ['purple', 'violet', 'plum', 'grape'], hue: 272 },
  { words: ['lavender', 'lilac'], hue: 278 },
  { words: ['magenta', 'fuchsia'], hue: 315 },
  { words: ['pink', 'rose', 'blush'], hue: 338 },
  { words: ['brown', 'chocolate', 'espresso', 'tan', 'beige', 'sand', 'earth'], hue: 28 },
];

function parsePreferredHue(text) {
  const t = String(text || '').toLowerCase();
  for (const entry of COLOR_WORDS) {
    for (const w of entry.words) {
      if (t.includes(w)) return entry.hue;
    }
  }
  return null;
}

const HUE_NAMES = [
  [15, 'Red'], [40, 'Orange'], [65, 'Gold'], [95, 'Chartreuse'], [150, 'Green'],
  [170, 'Mint'], [185, 'Teal'], [205, 'Sky'], [240, 'Blue'], [265, 'Indigo'],
  [290, 'Purple'], [320, 'Magenta'], [345, 'Pink'], [360, 'Red'],
];

function nameColor(h, s, l) {
  h = ((h % 360) + 360) % 360;
  if (s < 12) return l < 25 ? 'Charcoal' : l < 60 ? 'Stone Gray' : 'Soft White';
  if (l <= 20 && s <= 30) return 'Charcoal';
  if (l >= 92 && s <= 40) return 'Soft White';
  let hueName = 'Red';
  for (const [max, name] of HUE_NAMES) {
    if (h <= max) { hueName = name; break; }
  }
  const tone = l < 28 ? 'Deep' : l < 45 ? 'Rich' : l < 62 ? (s > 65 ? 'Vivid' : 'Warm') : 'Soft';
  return `${tone} ${hueName}`;
}

// ---------- Style presets ----------

const STYLES = {
  modern: {
    label: 'Modern & Minimal',
    sat: 62, light: 47,
    fonts: [
      { heading: 'Sora', body: 'Inter', vibe: 'Clean geometric heading with a neutral workhorse body' },
      { heading: 'Space Grotesk', body: 'Inter', vibe: 'Techy character up top, effortless readability below' },
      { heading: 'Archivo', body: 'Work Sans', vibe: 'Swiss-style clarity with friendly proportions' },
    ],
    direction: 'Generous white space, tight grids, one accent color used sparingly. Photography: clean backdrops, natural light, product-forward. Avoid gradients and clutter — restraint is the identity.',
  },
  classic: {
    label: 'Classic & Trustworthy',
    sat: 48, light: 36,
    fonts: [
      { heading: 'Playfair Display', body: 'Source Sans 3', vibe: 'Editorial serif authority with modern sans support' },
      { heading: 'Lora', body: 'Karla', vibe: 'Bookish warmth balanced by a crisp humanist sans' },
      { heading: 'Libre Baskerville', body: 'Inter', vibe: 'Timeless print heritage, digital-ready body' },
    ],
    direction: 'Symmetry, serif headlines, muted palette with one heritage accent. Photography: warm tones, real people, honest detail shots. The brand should feel like it has always existed.',
  },
  playful: {
    label: 'Playful & Vibrant',
    sat: 78, light: 55,
    fonts: [
      { heading: 'Fredoka', body: 'Nunito', vibe: 'Rounded, bouncy heading with a soft friendly body' },
      { heading: 'Baloo 2', body: 'Quicksand', vibe: 'Chunky charm paired with light geometric friendliness' },
      { heading: 'Quicksand', body: 'Inter', vibe: 'Gentle roundness kept grown-up by a neutral body' },
    ],
    direction: 'Bold color blocking, rounded corners everywhere, stickers and doodle accents. Photography: bright, saturated, candid moments and real smiles. The brand should make people grin in the feed.',
  },
  luxury: {
    label: 'Luxury & Refined',
    sat: 42, light: 28,
    fonts: [
      { heading: 'Cormorant Garamond', body: 'Montserrat', vibe: 'High-contrast elegance with precise geometric body' },
      { heading: 'Marcellus', body: 'Jost', vibe: 'Roman-inscription poise with quiet modernism' },
      { heading: 'Italiana', body: 'Lato', vibe: 'Fashion-editorial thinness, grounded and legible below' },
    ],
    direction: 'Dark, moody base with a single metallic-feeling accent. Thin rules, wide letter-spacing, small type. Photography: dramatic lighting, texture close-ups, negative space. Say less, imply more.',
  },
  organic: {
    label: 'Organic & Natural',
    sat: 38, light: 40,
    fonts: [
      { heading: 'Fraunces', body: 'Work Sans', vibe: 'Soft, wonky warmth with an easygoing body' },
      { heading: 'Lora', body: 'Mulish', vibe: 'Natural bookishness with breathable modern support' },
      { heading: 'Quattrocento', body: 'Karla', vibe: 'Understated serif heritage, humanist and honest' },
    ],
    direction: 'Earth tones, textured paper backgrounds, hand-drawn accents. Photography: natural materials, sunlight, hands making things. Imperfection is a feature — nothing should feel machine-made.',
  },
  bold: {
    label: 'Bold & Energetic',
    sat: 76, light: 46,
    fonts: [
      { heading: 'Anton', body: 'Inter', vibe: 'Condensed impact headline with clean supporting text' },
      { heading: 'Bebas Neue', body: 'Open Sans', vibe: 'Poster-scale presence, approachable body' },
      { heading: 'Archivo', body: 'Inter', vibe: 'Heavy grotesque confidence with quiet support' },
    ],
    direction: 'High contrast, oversized type, hard edges. One loud brand color against black or white. Photography: dynamic angles, motion blur, real intensity. The brand should feel like a statement.',
  },
};

// ---------- Palettes ----------

function buildPalette(baseHue, style, label, rand, accentStrategy) {
  const s = style.sat + intBetween(rand, -5, 5);
  const l = style.light + intBetween(rand, -3, 3);
  const secondaryHue = baseHue + pick(rand, [-28, 25, 32]);
  let accentHue;
  if (accentStrategy === 'gold') accentHue = 44 + intBetween(rand, -4, 6);
  else if (accentStrategy === 'analogous') accentHue = baseHue + pick(rand, [-55, 55]);
  else accentHue = baseHue + 180 + intBetween(rand, -18, 18);

  const colors = [
    { role: 'Primary', h: baseHue, s, l, usage: 'Logo, buttons, and key brand moments' },
    { role: 'Secondary', h: secondaryHue, s: Math.max(20, s - 14), l: Math.min(72, l + 18), usage: 'Backgrounds, cards, and supporting elements' },
    { role: 'Accent', h: accentHue, s: Math.min(88, s + 12), l: Math.min(64, l + 12), usage: 'Calls-to-action, highlights, small pops' },
    { role: 'Ink', h: baseHue, s: 18, l: 14, usage: 'Headlines and body text' },
    { role: 'Paper', h: baseHue, s: 22, l: 96, usage: 'Page and packaging backgrounds' },
  ];
  return {
    name: label,
    colors: colors.map((c) => ({
      role: c.role,
      hex: hslToHex(c.h, c.s, c.l),
      name: nameColor(c.h, c.s, c.l),
      usage: c.usage,
    })),
  };
}

// ---------- Logo generation ----------

function esc(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function initialsOf(name) {
  const words = String(name).replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/).filter((w) => !['the', 'of', 'and', 'by', 'co', 'a'].includes(w.toLowerCase()));
  if (!words.length) return 'B';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

// Abstract motif marks, drawn per category mood. Each returns SVG markup
// centered around (0,0) within roughly a 72x72 box.
const MOTIFS = {
  organic: (p, a, rand) => {
    const tilt = intBetween(rand, -12, 12);
    return `<g transform="rotate(${tilt})">
      <path d="M0,34 Q-34,34 -34,0 Q0,0 0,34 Z" fill="${p}"/>
      <path d="M0,-34 Q34,-34 34,0 Q0,0 0,-34 Z" fill="${p}"/>
      <path d="M0,34 Q34,34 34,0 Q0,0 0,34 Z" fill="${a}" opacity="0.85"/>
      <path d="M0,-34 Q-34,-34 -34,0 Q0,0 0,-34 Z" fill="${a}" opacity="0.55"/>
    </g>`;
  },
  dynamic: (p, a) => `<g>
      <polygon points="-30,26 -12,26 8,-26 -10,-26" fill="${p}"/>
      <polygon points="-2,26 12,26 30,-20 16,-20" fill="${a}"/>
      <polygon points="20,26 30,26 36,10 26,10" fill="${p}" opacity="0.6"/>
    </g>`,
  crafted: (p, a, rand) => {
    const spokes = pick(rand, [6, 8]);
    let lines = '';
    for (let i = 0; i < spokes; i++) {
      const ang = (i * 360) / spokes;
      lines += `<line x1="0" y1="-13" x2="0" y2="-31" stroke="${i % 2 ? a : p}" stroke-width="7" stroke-linecap="round" transform="rotate(${ang})"/>`;
    }
    return `<g>${lines}<circle r="8" fill="${p}"/></g>`;
  },
  geometric: (p, a, rand) => {
    const variantShape = pick(rand, ['orbit', 'stack']);
    if (variantShape === 'orbit') {
      return `<g>
        <circle r="30" fill="none" stroke="${p}" stroke-width="8"/>
        <circle cx="21" cy="-21" r="10" fill="${a}"/>
      </g>`;
    }
    return `<g>
      <rect x="-28" y="-28" width="34" height="34" rx="8" fill="${p}"/>
      <rect x="-6" y="-6" width="34" height="34" rx="17" fill="${a}" opacity="0.9"/>
    </g>`;
  },
  playful: (p, a, rand) => {
    const tilt = intBetween(rand, -8, 8);
    return `<g transform="rotate(${tilt})">
      <circle cx="-14" cy="8" r="19" fill="${p}"/>
      <circle cx="16" cy="-4" r="14" fill="${a}"/>
      <circle cx="6" cy="22" r="8" fill="${a}" opacity="0.6"/>
      <circle cx="20" cy="-24" r="5" fill="${p}" opacity="0.7"/>
    </g>`;
  },
  badge: (p, a) => `<g>
      <polygon points="-30,22 -8,-18 2,-2 12,-14 30,22" fill="${p}"/>
      <circle cx="16" cy="-20" r="7" fill="${a}"/>
      <line x1="-34" y1="28" x2="34" y2="28" stroke="${p}" stroke-width="4" stroke-linecap="round"/>
    </g>`,
  elegant: (p, a) => `<g>
      <rect x="-22" y="-22" width="44" height="44" fill="none" stroke="${p}" stroke-width="2.5" transform="rotate(45)"/>
      <rect x="-13" y="-13" width="26" height="26" fill="none" stroke="${a}" stroke-width="2" transform="rotate(45)"/>
      <circle r="4.5" fill="${p}"/>
    </g>`,
  monogram: null, // handled by the monogram concept
};

const CONTAINERS = ['circle', 'roundsquare', 'hexagon', 'shield'];

function containerSvg(shape, fill) {
  switch (shape) {
    case 'circle': return `<circle cx="0" cy="0" r="46" fill="${fill}"/>`;
    case 'roundsquare': return `<rect x="-44" y="-44" width="88" height="88" rx="22" fill="${fill}"/>`;
    case 'hexagon': return `<polygon points="0,-48 42,-24 42,24 0,48 -42,24 -42,-24" fill="${fill}"/>`;
    case 'shield': return `<path d="M0,-46 L42,-32 L42,10 Q42,36 0,50 Q-42,36 -42,10 L-42,-32 Z" fill="${fill}"/>`;
    default: return `<circle cx="0" cy="0" r="46" fill="${fill}"/>`;
  }
}

function wrapSvg(inner, w, h, bg) {
  const bgRect = bg ? `<rect width="${w}" height="${h}" fill="${bg}" rx="12"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${bgRect}${inner}</svg>`;
}

function generateLogos({ brandName, categoryId, style, palette, variant = 0 }) {
  const category = getCategory(categoryId);
  const styleData = STYLES[style] || STYLES.modern;
  const rand = createRng(`logos:${brandName}:${category.id}:${style}:${variant}`);
  const initials = initialsOf(brandName);
  const headingFont = pick(rand, styleData.fonts).heading;
  const fontStack = `'${headingFont}', 'Segoe UI', sans-serif`;

  const [primary, , accent, ink, paper] = palette.colors.map((c) => c.hex);
  const motifKey = MOTIFS[category.logoMotif] ? category.logoMotif : 'geometric';
  const drawMotif = MOTIFS[motifKey] || MOTIFS.geometric;

  const logos = [];

  // 1. Monogram in a container
  const shape = pick(rand, CONTAINERS);
  logos.push({
    id: 'monogram',
    name: 'Monogram Mark',
    description: `Your initials "${initials}" set in a ${shape === 'roundsquare' ? 'rounded square' : shape}. Works at any size — avatars, favicons, packaging stamps.`,
    svg: wrapSvg(
      `<g transform="translate(70,70)">${containerSvg(shape, primary)}
       <text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-family="${fontStack}" font-weight="700" font-size="${initials.length > 1 ? 40 : 52}" fill="${paper}">${esc(initials)}</text></g>`,
      140, 140, null
    ),
  });

  // 2. Abstract motif mark
  logos.push({
    id: 'abstract',
    name: 'Abstract Mark',
    description: `An original ${category.logoMotif} symbol generated for your brand — no letterforms, so it stays distinctive across products and merch.`,
    svg: wrapSvg(`<g transform="translate(70,72)">${drawMotif(primary, accent, rand)}</g>`, 140, 140, null),
  });

  // 3. Wordmark
  const nameLen = brandName.length;
  const wordmarkSize = nameLen > 18 ? 22 : nameLen > 12 ? 28 : 36;
  logos.push({
    id: 'wordmark',
    name: 'Wordmark',
    description: `The brand name set in ${headingFont} with an accent mark — the workhorse logo for websites, invoices, and headers.`,
    svg: wrapSvg(
      `<text x="20" y="62" font-family="${fontStack}" font-weight="700" font-size="${wordmarkSize}" fill="${ink}" letter-spacing="${style === 'luxury' ? 3 : 0.5}">${esc(brandName)}</text>
       <circle cx="${28 + nameLen * (wordmarkSize * 0.56)}" cy="58" r="5" fill="${accent}"/>
       <rect x="20" y="76" width="44" height="4" rx="2" fill="${primary}"/>`,
      Math.max(240, 50 + nameLen * (wordmarkSize * 0.62)), 100, null
    ),
  });

  // 4. Badge / emblem
  logos.push({
    id: 'badge',
    name: 'Badge Emblem',
    description: 'A stamped emblem with your initials and founding year — strong on labels, apparel, and packaging seals.',
    svg: wrapSvg(
      `<g transform="translate(70,70)">
        <circle r="62" fill="${primary}"/>
        <circle r="52" fill="none" stroke="${paper}" stroke-width="2"/>
        <circle r="46" fill="none" stroke="${paper}" stroke-width="1" stroke-dasharray="3 4"/>
        <text x="0" y="-6" text-anchor="middle" font-family="${fontStack}" font-weight="700" font-size="34" fill="${paper}">${esc(initials)}</text>
        <text x="0" y="22" text-anchor="middle" font-family="${fontStack}" font-size="11" letter-spacing="2" fill="${accent}">EST. ${new Date().getFullYear()}</text>
        <circle cx="-30" cy="30" r="2.5" fill="${accent}"/><circle cx="30" cy="30" r="2.5" fill="${accent}"/>
      </g>`,
      140, 140, null
    ),
  });

  // 5. Combination lockup (icon + name)
  const lockupFontSize = nameLen > 16 ? 20 : 26;
  logos.push({
    id: 'lockup',
    name: 'Combination Lockup',
    description: 'Symbol and name side by side — the full signature for your website header and social banners.',
    svg: wrapSvg(
      `<g transform="translate(52,55) scale(0.62)">${drawMotif(primary, accent, rand)}</g>
       <text x="96" y="63" font-family="${fontStack}" font-weight="700" font-size="${lockupFontSize}" fill="${ink}">${esc(brandName)}</text>`,
      Math.max(280, 116 + nameLen * (lockupFontSize * 0.6)), 110, null
    ),
  });

  return logos;
}

// ---------- Public API ----------

function generateIdentity({ brandName, categoryId, style = 'modern', personality = '', preferredColors = '', variant = 0 }) {
  const category = getCategory(categoryId);
  const styleKey = STYLES[style] ? style : 'modern';
  const styleData = STYLES[styleKey];
  const rand = createRng(`identity:${brandName}:${category.id}:${styleKey}:${preferredColors}:${personality}:${variant}`);

  const preferredHue = parsePreferredHue(preferredColors);
  const defaultHues = { beauty: 340, fitness: 10, food: 26, fashion: 230, home: 30, pets: 40, tech: 222, baby: 180, outdoor: 150, stationery: 260, jewelry: 45, digital: 250, general: 215 };
  const baseHue = preferredHue !== null ? preferredHue : (defaultHues[category.id] || 215) + intBetween(rand, -12, 12);

  // Luxury reads best with a gold accent; organic palettes clash with hard
  // complements, so they get gold/analogous warmth instead.
  const accentStrategy = styleKey === 'luxury' || styleKey === 'organic' ? 'gold' : 'complement';
  const palettes = [
    buildPalette(baseHue, styleData, 'Signature', createRng(`p1:${brandName}:${variant}`), accentStrategy),
    buildPalette(baseHue + 24, styleData, 'Alternate Warmth', createRng(`p2:${brandName}:${variant}`), 'analogous'),
    buildPalette(baseHue - 30, styleData, 'Cool Contrast', createRng(`p3:${brandName}:${variant}`), accentStrategy),
  ];

  const fonts = pickN(rand, styleData.fonts, Math.min(2, styleData.fonts.length));
  const logos = generateLogos({ brandName, categoryId: category.id, style: styleKey, palette: palettes[0], variant });

  return {
    brandName,
    style: { id: styleKey, label: styleData.label },
    palettes,
    fonts,
    logos,
    direction: styleData.direction,
    originality:
      'These logo concepts are generated from original geometry and your brand\'s own letters. Before commercial use, run a trademark search (USPTO.gov) and reverse-image check to confirm the final design is distinct in your category.',
  };
}

function listStyles() {
  return Object.entries(STYLES).map(([id, s]) => ({ id, label: s.label }));
}

module.exports = { generateIdentity, listStyles, STYLES };
