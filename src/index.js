const path = require('path');
const express = require('express');
const apiRouter = require('./routes/api');

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use('/api', apiRouter);
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'BrandForge' });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`BrandForge running on http://localhost:${PORT}`);
});

module.exports = app;
