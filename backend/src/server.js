require('dotenv').config();

// ── Sentry (init trước khi load bất kỳ module nào khác) ───────────────────────
const Sentry = require('@sentry/node');
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    sendDefaultPii: true,
  });
}

const app = require('./app');
const { startScrapeJob } = require('./jobs/scholarshipScraper');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info({
    url: `http://localhost:${PORT}`,
    environment: process.env.NODE_ENV || 'development',
    health: `http://localhost:${PORT}/api/health`,
  }, 'ScholarsGo API started');
  startScrapeJob();
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
