const path = require('path');
const fs = require('fs');
const express = require('express');
const config = require('./config');
const provider = require('./providers');
const gameplan = require('./services/gameplan');
const scheduler = require('./services/scheduler');
const apiRouter = require('./routes/api');
const legacyRouter = require('./routes/legacy');

const app = express();
app.use(express.json());

// Legacy lead API stays public (existing integrations call it unauthenticated).
app.use('/agent', legacyRouter);

// Optional basic auth for the dashboard + API.
if (config.dashboardPassword) {
  app.use((req, res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, encoded] = header.split(' ');
    if (scheme === 'Basic' && encoded) {
      const password = Buffer.from(encoded, 'base64').toString().split(':').slice(1).join(':');
      if (password === config.dashboardPassword) return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="TikTok Niche Finder"');
    res.status(401).send('Authentication required');
  });
}

app.use('/api', apiRouter);

// Serve the built dashboard (client/dist) with an SPA fallback.
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
} else {
  app.get('/', (req, res) => {
    res
      .status(200)
      .send('TikTok Niche Finder API is running. Dashboard not built yet — run `npm run build`. API at /api/*');
  });
}

app.listen(config.port, () => {
  console.log(`TikTok Niche Finder running on port ${config.port}`);
  console.log(`  data provider: ${provider.name}${provider.name === 'mock' ? ' (set APIFY_TOKEN for live TikTok data)' : ''}`);
  console.log(`  game plans:    ${gameplan.plannerName()}${gameplan.plannerName() === 'rules' ? ' (set ANTHROPIC_API_KEY for AI plans)' : ''}`);
  console.log(`  database:      ${config.dataDir}/tiktok.db`);
  scheduler.start();
});
