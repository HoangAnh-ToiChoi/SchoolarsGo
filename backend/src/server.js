import 'dotenv/config';

import * as Sentry from '@sentry/node';
import { scrubSentryEvent } from '~/utils/scrubSentryEvent.js';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    sendDefaultPii: false, // không gửi IP, cookie phiên lên bên thứ ba
    beforeSend: scrubSentryEvent,
    beforeSendTransaction: scrubSentryEvent,
  });
}

// Nạp app SAU Sentry.init: import tĩnh của ESM chạy trước code nên Sentry sẽ không kịp theo dõi express, http, pg
const { default: app } = await import('./app.js');
const { startJobs } = await import('./jobs/index.js');
const { pool } = await import('./configs/database.config.js');
const { SHUTDOWN_TIMEOUT_MS } = await import('./constants/health.js');

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

// Ngừng nhận request mới, chờ request đang chạy xong rồi đóng pool DB. Kết nối keep-alive đang rảnh
// giữ server.close() chờ mãi nên đóng ngay; quá SHUTDOWN_TIMEOUT_MS thì thoát hẳn để Railway không phải kill
function shutdownServer(signal) {
  console.log(`${signal} received, shutting down gracefully`);
  const forceExit = setTimeout(function onShutdownTimeout() {
    console.error('Shutdown quá hạn, thoát ngay');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close(async function onServerClosed() {
    await pool.end();
    console.log('Server closed');
    process.exit(0);
  });
  server.closeIdleConnections();
}
