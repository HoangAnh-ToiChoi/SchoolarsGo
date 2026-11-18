require('dotenv').config();

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
const { startJobs } = require('./jobs');
const { registerStorageListeners } = require('./events/listeners/storage.listener');
const { registerAuthListeners } = require('./events/listeners/auth.listener');
const PORT = process.env.PORT || 5000;

registerStorageListeners();
registerAuthListeners();

const server = app.listen(PORT, function onServerStarted() {
  console.log(`🚀 ScholarsGo API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  startJobs();
});

process.on('SIGTERM', function handleSigterm() {
  shutdownServer('SIGTERM');
});

process.on('SIGINT', function handleSigint() {
  shutdownServer('SIGINT');
});

function shutdownServer(signal) {
  console.log(`${signal} received, shutting down gracefully`);
  server.close(function onServerClosed() {
    console.log('Server closed');
    process.exit(0);
  });
}
