const express = require('express');
const router = express.Router();

const { analyzeProduct } = require('../lib/analyzer');
const { generateBrandConcepts, listTones } = require('../lib/names');
const { generateIdentity, listStyles } = require('../lib/identity');
const { buildBrandPackage } = require('../lib/packageBuilder');
const { listCategories } = require('../lib/knowledge');
const nameCheck = require('../lib/nameCheck');
const searchData = require('../lib/searchData');
const semrushMcp = require('../lib/semrushMcp');
const store = require('../lib/store');

// Reference data for building forms
router.get('/meta', (req, res) => {
  const s = searchData.status();
  res.json({
    categories: listCategories(),
    tones: listTones(),
    styles: listStyles(),
    search: s,
    semrushEnabled: Boolean(s.mode && s.ready), // legacy field
  });
});

// ---------- Search-data connection management ----------

router.get('/semrush/status', (req, res) => {
  res.json(searchData.status());
});

// Starts the OAuth flow against Semrush's MCP server (MCP mode only).
// Redirects the browser to Semrush's authorization page.
router.get('/semrush/connect', async (req, res) => {
  if (searchData.mode() !== 'semrush-mcp') {
    return res.status(400).send('Semrush MCP mode is not active. Set SEARCH_MODE=semrush-mcp in .env.');
  }
  try {
    const redirectUrl = process.env.SEMRUSH_MCP_REDIRECT_URL
      || `${req.protocol}://${req.get('host')}/api/semrush/callback`;
    const result = await semrushMcp.beginAuth(redirectUrl);
    if (result.alreadyConnected) return res.redirect('/?semrush=connected');
    res.redirect(result.authUrl);
  } catch (err) {
    console.error('Semrush connect failed:', err.message);
    res.status(502).send(`Could not start Semrush authorization: ${err.message}`);
  }
});

// OAuth callback: exchanges the authorization code for tokens.
router.get('/semrush/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.redirect(`/?semrush=error&reason=${encodeURIComponent(String(error))}`);
  if (!code) return res.status(400).send('Missing authorization code.');
  try {
    await semrushMcp.finishAuth(String(code));
    res.redirect('/?semrush=connected');
  } catch (err) {
    console.error('Semrush token exchange failed:', err.message);
    res.redirect(`/?semrush=error&reason=${encodeURIComponent(err.message)}`);
  }
});

router.post('/semrush/disconnect', (req, res) => {
  semrushMcp.disconnect();
  res.json({ disconnected: true });
});

// Name availability: USPTO trademark knockout search + domain availability
// + social handle check links.
router.post('/namecheck', async (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Please provide a name to check.' });
  }
  try {
    res.json(await nameCheck.checkName(String(name)));
  } catch (err) {
    res.status(502).json({ error: `Name check failed: ${err.message}` });
  }
});

// 1. Product intake & market analysis
router.post('/analyze', async (req, res) => {
  const { product, description, categoryId, goals, tone } = req.body || {};
  if (!product || !String(product).trim()) {
    return res.status(400).json({ error: 'Please provide a product name, niche, or description.' });
  }
  const analysis = analyzeProduct({
    product: String(product).trim(),
    description: String(description || ''),
    categoryId: String(categoryId || ''),
    goals: String(goals || ''),
    tone: String(tone || ''),
  });
  // Live search-demand enrichment (null when no SEMRUSH_API_KEY configured)
  analysis.searchData = await searchData.getSearchInsights(String(product).trim());
  res.json(analysis);
});

// 2. Brand concept generation
router.post('/brands', (req, res) => {
  const { product, categoryId, tone, founderName, variant } = req.body || {};
  if (!product || !String(product).trim()) {
    return res.status(400).json({ error: 'Please provide a product to generate brand concepts for.' });
  }
  res.json({
    concepts: generateBrandConcepts({
      product: String(product).trim(),
      categoryId: String(categoryId || ''),
      tone: String(tone || 'bold'),
      founderName: String(founderName || ''),
      variant: Number(variant) || 0,
    }),
  });
});

// 3. Visual identity generation
router.post('/identity', (req, res) => {
  const { brandName, categoryId, style, personality, preferredColors, variant } = req.body || {};
  if (!brandName || !String(brandName).trim()) {
    return res.status(400).json({ error: 'Please provide a brand name to build an identity for.' });
  }
  res.json(generateIdentity({
    brandName: String(brandName).trim(),
    categoryId: String(categoryId || ''),
    style: String(style || 'modern'),
    personality: String(personality || ''),
    preferredColors: String(preferredColors || ''),
    variant: Number(variant) || 0,
  }));
});

// 4. Client onboarding CRUD
router.get('/clients', (req, res) => {
  res.json({ clients: store.listClients() });
});

router.post('/clients', (req, res) => {
  const body = req.body || {};
  if (!body.name || !String(body.name).trim()) {
    return res.status(400).json({ error: 'Client name is required.' });
  }
  if (!body.product || !String(body.product).trim()) {
    return res.status(400).json({ error: 'A product or business idea is required.' });
  }
  res.status(201).json({ client: store.createClient(body) });
});

router.get('/clients/:id', (req, res) => {
  const client = store.getClient(req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found.' });
  res.json({ client });
});

router.delete('/clients/:id', (req, res) => {
  if (!store.deleteClient(req.params.id)) {
    return res.status(404).json({ error: 'Client not found.' });
  }
  res.json({ deleted: true });
});

// 5. Brand package (from a saved client or an ad-hoc spec)
router.post('/package', async (req, res) => {
  const body = req.body || {};
  let spec = body;
  if (body.clientId) {
    const client = store.getClient(body.clientId);
    if (!client) return res.status(404).json({ error: 'Client not found.' });
    spec = {
      clientName: client.name,
      businessIdea: client.businessIdea,
      product: client.product,
      description: `${client.businessIdea} ${client.targetAudience}`.trim(),
      categoryId: client.categoryId,
      tone: client.tone,
      style: client.style,
      personality: client.personality,
      preferredColors: client.preferredColors,
      goals: client.goals,
      ...body.overrides,
    };
  }
  if (!spec.product || !String(spec.product).trim()) {
    return res.status(400).json({ error: 'A product is required to build a brand package.' });
  }
  const pkg = buildBrandPackage(spec);
  // Live SEO keyword targets for the marketing section (null when disabled)
  pkg.searchInsights = await searchData.getSearchInsights(String(spec.product).trim());
  res.json(pkg);
});

module.exports = router;
