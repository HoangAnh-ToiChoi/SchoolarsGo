const rateLimit = require('express-rate-limit');

const rateLimiter = (maxRequests = 100, windowMs = 60, message = 'Too many requests, please try again later.') => {
  return rateLimit({
    windowMs: windowMs * 1000, // convert seconds to ms
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
      code: 429,
    },
    // Không áp dụng rate limit cho health check
    skip: (req) => req.path === '/api/health',
  });
};

// Named export cho app.js global limiter
const apiLimiter = rateLimiter(100, 60, 'Quá nhiều yêu cầu, vui lòng thử lại sau.');
const authLimiter = rateLimiter(5, 15 * 60, 'Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau 15 phút.');

module.exports = rateLimiter;
module.exports.apiLimiter = apiLimiter;
module.exports.authLimiter = authLimiter;
