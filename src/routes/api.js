const express = require('express');
const provider = require('../providers');
const nicheService = require('../services/nicheService');
const gameplan = require('../services/gameplan');

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/health', (req, res) => {
  res.json({
    ok: true,
    providers: { data: provider.name, planner: gameplan.plannerName() },
  });
});

router.get('/niches', (req, res) => {
  const niches = nicheService.listNiches().map((n) => {
    const latest = nicheService.latestScore(n.id) || null;
    const sparkline = nicheService
      .scoreHistory(n.id, 30)
      .map((s) => ({ t: s.computed_at, opportunity_score: s.opportunity_score }));
    return { ...n, latestScore: latest, sparkline };
  });
  niches.sort((a, b) => (b.latestScore?.opportunity_score || 0) - (a.latestScore?.opportunity_score || 0));
  res.json(niches);
});

router.post(
  '/niches',
  asyncHandler(async (req, res) => {
    const { name, hashtags, keywords } = req.body || {};
    if (!name || !Array.isArray(hashtags) || hashtags.length === 0) {
      return res.status(400).json({ error: 'name and a non-empty hashtags array are required' });
    }
    const clean = hashtags.map((t) => String(t).replace(/^#/, '').trim()).filter(Boolean);
    let niche;
    try {
      niche = nicheService.createNiche({ name, hashtags: clean, keywords: keywords || [] });
    } catch (err) {
      if (String(err.message).includes('UNIQUE')) {
        return res.status(409).json({ error: `A niche named "${name}" is already tracked` });
      }
      throw err;
    }
    const score = await nicheService.refreshNiche(niche.id);
    res.status(201).json({ ...nicheService.getNiche(niche.id), latestScore: score });
  })
);

router.get('/niches/:id', (req, res) => {
  const niche = nicheService.getNiche(req.params.id);
  if (!niche) return res.status(404).json({ error: 'Niche not found' });
  res.json({
    ...niche,
    latestScore: nicheService.latestScore(niche.id) || null,
    videos: nicheService.videosWithMetrics(niche.id).slice(0, 30),
  });
});

router.delete('/niches/:id', (req, res) => {
  const niche = nicheService.getNiche(req.params.id);
  if (!niche) return res.status(404).json({ error: 'Niche not found' });
  nicheService.archiveNiche(niche.id);
  res.status(204).end();
});

router.post(
  '/niches/:id/refresh',
  asyncHandler(async (req, res) => {
    const niche = nicheService.getNiche(req.params.id);
    if (!niche) return res.status(404).json({ error: 'Niche not found' });
    const score = await nicheService.refreshNiche(niche.id);
    res.json({ refreshed: true, score });
  })
);

router.get('/niches/:id/timeseries', (req, res) => {
  const niche = nicheService.getNiche(req.params.id);
  if (!niche) return res.status(404).json({ error: 'Niche not found' });
  const days = Math.min(365, parseInt(req.query.days, 10) || 30);
  res.json({
    scores: nicheService.scoreHistory(niche.id, days),
    totals: nicheService.metricTotals(niche.id, days),
  });
});

router.get('/niches/:id/videos', (req, res) => {
  const niche = nicheService.getNiche(req.params.id);
  if (!niche) return res.status(404).json({ error: 'Niche not found' });
  res.json(nicheService.videosWithMetrics(niche.id, req.query.sort || 'views'));
});

router.get(
  '/discover',
  asyncHandler(async (req, res) => {
    const q = (req.query.q || '').trim();
    if (!q) return res.status(400).json({ error: 'q query parameter is required' });
    res.json(await nicheService.discover(q));
  })
);

router.post(
  '/niches/:id/gameplan',
  asyncHandler(async (req, res) => {
    const niche = nicheService.getNiche(req.params.id);
    if (!niche) return res.status(404).json({ error: 'Niche not found' });
    res.status(201).json(await gameplan.generatePlan(niche.id));
  })
);

router.get('/niches/:id/gameplan', (req, res) => {
  const plan = gameplan.latestPlan(req.params.id);
  if (!plan) return res.status(404).json({ error: 'No game plan yet — generate one first' });
  res.json(plan);
});

router.get('/niches/:id/gameplans', (req, res) => {
  res.json(gameplan.listPlans(req.params.id));
});

router.get('/gameplans/:planId', (req, res) => {
  const plan = gameplan.getPlan(req.params.planId);
  if (!plan) return res.status(404).json({ error: 'Plan not found' });
  res.json(plan);
});

router.use((err, req, res, next) => {
  console.error('[api]', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

module.exports = router;
