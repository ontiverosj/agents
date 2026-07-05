const express = require('express');
const router = express.Router();

const { analyzeProduct } = require('../lib/analyzer');
const { generateBrandConcepts, listTones } = require('../lib/names');
const { generateIdentity, listStyles } = require('../lib/identity');
const { buildBrandPackage } = require('../lib/packageBuilder');
const { listCategories } = require('../lib/knowledge');
const store = require('../lib/store');

// Reference data for building forms
router.get('/meta', (req, res) => {
  res.json({ categories: listCategories(), tones: listTones(), styles: listStyles() });
});

// 1. Product intake & market analysis
router.post('/analyze', (req, res) => {
  const { product, description, categoryId, goals, tone } = req.body || {};
  if (!product || !String(product).trim()) {
    return res.status(400).json({ error: 'Please provide a product name, niche, or description.' });
  }
  res.json(analyzeProduct({
    product: String(product).trim(),
    description: String(description || ''),
    categoryId: String(categoryId || ''),
    goals: String(goals || ''),
    tone: String(tone || ''),
  }));
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
router.post('/package', (req, res) => {
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
  res.json(buildBrandPackage(spec));
});

module.exports = router;
