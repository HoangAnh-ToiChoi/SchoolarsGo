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

const isProd = process.env.NODE_ENV === 'production';

/**
 * Tier 1 — Auth: strict in production, lenient in dev/test
 * prod: 5 req / 15 min | dev: 200 req / min
 */
const authLimiter = isProd
  ? createLimiter(5, 15 * 60, 'Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau 15 phút.')
  : createLimiter(200, 60, 'Quá nhiều yêu cầu đăng nhập.');

/**
 * Tier 2 — API: Standard
 * prod: 100 req / min | dev: 500 req / min
 */
const apiLimiter = isProd
  ? createLimiter(100, 60, 'Quá nhiều yêu cầu, vui lòng thử lại sau.')
  : createLimiter(500, 60, 'Quá nhiều yêu cầu, vui lòng thử lại sau.');

/**
 * Tier 3 — Upload: Moderate
 */
const uploadLimiter = createLimiter(20, 60, 'Quá nhiều yêu cầu tải lên, vui lòng thử lại sau.');

module.exports = {
  authLimiter,
  apiLimiter,
  uploadLimiter,
  createLimiter,
};
