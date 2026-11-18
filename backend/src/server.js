import 'dotenv/config';

import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    sendDefaultPii: true,
  });
}

import app from './app.js';
import { startJobs } from './jobs/index.js';

const PORT = process.env.PORT || 5000;

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
