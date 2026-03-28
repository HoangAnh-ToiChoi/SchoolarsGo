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

module.exports = rateLimiter;
