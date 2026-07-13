const db = require('../../db');
const config = require('../../config');
const nicheService = require('../nicheService');
const rulePlanner = require('./rulePlanner');
const claudePlanner = require('./claudePlanner');

const plannerName = () => (config.anthropicApiKey ? 'claude' : 'rules');

async function generatePlan(nicheId) {
  const niche = nicheService.getNiche(nicheId);
  if (!niche) throw new Error(`Niche ${nicheId} not found`);

  const score = nicheService.latestScore(nicheId);
  const videos = nicheService.videosWithMetrics(nicheId, 'views');
  const input = { niche, score, videos };

  let plan;
  let generator;
  let model = null;
  if (config.anthropicApiKey) {
    try {
      plan = await claudePlanner.generate(input);
      generator = 'claude';
      model = config.anthropicModel;
    } catch (err) {
      console.error('[gameplan] Claude generation failed, falling back to rules:', err.message);
      plan = rulePlanner.generate(input);
      generator = 'rules';
    }
  } else {
    plan = rulePlanner.generate(input);
    generator = 'rules';
  }

  const generatedAt = new Date().toISOString();
  const result = db
    .prepare(`INSERT INTO game_plans (niche_id, generated_at, generator, model, plan_json) VALUES (?, ?, ?, ?, ?)`)
    .run(nicheId, generatedAt, generator, model, JSON.stringify(plan));

  return { id: result.lastInsertRowid, nicheId, generatedAt, generator, model, plan };
}

function rowToPlan(row) {
  if (!row) return null;
  return {
    id: row.id,
    nicheId: row.niche_id,
    generatedAt: row.generated_at,
    generator: row.generator,
    model: row.model,
    plan: JSON.parse(row.plan_json),
  };
}

function latestPlan(nicheId) {
  return rowToPlan(
    db.prepare(`SELECT * FROM game_plans WHERE niche_id = ? ORDER BY generated_at DESC, id DESC LIMIT 1`).get(nicheId)
  );
}

function getPlan(planId) {
  return rowToPlan(db.prepare(`SELECT * FROM game_plans WHERE id = ?`).get(planId));
}

function listPlans(nicheId) {
  return db
    .prepare(`SELECT id, niche_id, generated_at, generator, model FROM game_plans WHERE niche_id = ? ORDER BY generated_at DESC`)
    .all(nicheId)
    .map((r) => ({ id: r.id, nicheId: r.niche_id, generatedAt: r.generated_at, generator: r.generator, model: r.model }));
}

module.exports = { generatePlan, latestPlan, getPlan, listPlans, plannerName };
