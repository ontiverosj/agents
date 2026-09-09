const crypto = require('crypto');

const constantTimeEqual = (actual, expected) => {
  if (typeof actual !== 'string' || typeof expected !== 'string') return false;

  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
};

const createToolsTokenGuard = ({
  getToken = () => process.env.AGENT_TOOLS_TOKEN,
  logger = console,
} = {}) => (req, res, next) => {
  const token = getToken();
  if (!token) {
    logger.error('AGENT_TOOLS_TOKEN is not configured; rejecting protected request');
    return res.status(503).json({ error: 'Authentication unavailable' });
  }

  const header = req.headers.authorization || '';
  if (!constantTimeEqual(header, `Bearer ${token}`)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
};

module.exports = { constantTimeEqual, createToolsTokenGuard };
