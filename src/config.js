require('dotenv').config();

const path = require('path');

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  dataDir: process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.resolve(__dirname, '..', 'data'),
  apifyToken: process.env.APIFY_TOKEN || null,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || null,
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-opus-4-8',
  refreshIntervalMinutes: parseInt(process.env.REFRESH_INTERVAL_MINUTES, 10) || 360,
  dashboardPassword: process.env.DASHBOARD_PASSWORD || null,
  airtableApiKey: process.env.AIRTABLE_API_KEY || null,
  airtableBaseId: process.env.AIRTABLE_BASE_ID || null,
  isTest: process.env.NODE_ENV === 'test',
};

module.exports = config;
