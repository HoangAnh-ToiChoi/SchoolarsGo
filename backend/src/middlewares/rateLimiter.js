const rateLimit = require('express-rate-limit');

/**
 * Tạo rate limiter với cấu hình tùy chỉnh.
 * @param {number} maxRequests
 * @param {number} windowSeconds
 * @param {string} message
 * @returns {Function} Express middleware
 */
const createLimiter = (maxRequests, windowSeconds, message) => {
  return rateLimit({
    windowMs: windowSeconds * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
      code: 429,
    },
  });
};

/**
 * Tier 1 — Auth: Rất strict (chống brute-force)
 * 5 requests / 15 phút — cho login, register
 */
const authLimiter = createLimiter(
  5,
  15 * 60,
  'Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau 15 phút.'
);

/**
 * Tier 2 — API: Standard (bảo vệ server)
 * 100 requests / 1 phút — áp dụng cho tất cả API routes
 */
const apiLimiter = createLimiter(100, 60, 'Quá nhiều yêu cầu, vui lòng thử lại sau.');

/**
 * Tier 3 — Upload: Moderate (tránh spam upload)
 * 20 requests / 1 phút — cho upload documents
 */
const uploadLimiter = createLimiter(20, 60, 'Quá nhiều yêu cầu tải lên, vui lòng thử lại sau.');

module.exports = {
  authLimiter,
  apiLimiter,
  uploadLimiter,
  createLimiter,
};
