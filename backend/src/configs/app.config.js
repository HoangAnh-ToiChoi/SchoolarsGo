// Môi trường chạy của backend (CLAUDE.md 4.6: chỉ thư mục configs/ đọc process.env)

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function getNodeEnv() {
  return process.env.NODE_ENV || 'development';
}

function getPort() {
  return Number(process.env.PORT) || 5000;
}

// Không có DSN thì không gửi lỗi lên Sentry (dev, test)
function getSentryDsn() {
  return process.env.SENTRY_DSN || null;
}

// Gốc URL của FE, dùng để dựng link trong email (đặt lại mật khẩu)
function getFrontendUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
}

export { isProduction, getNodeEnv, getPort, getSentryDsn, getFrontendUrl };
