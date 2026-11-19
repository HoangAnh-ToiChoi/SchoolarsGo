import rateLimit from 'express-rate-limit';

const createLimiter = (maxRequests, windowSeconds, message) => {
  return rateLimit({
    windowMs: windowSeconds * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.error({ statusCode: 429, message, code: 429, errorCode: 'TOO_MANY_REQUESTS' }),
  });
};

const isProd = process.env.NODE_ENV === 'production';

// Đăng nhập: production 5 lần / 15 phút, dev 200 lần / phút
const authLimiter = isProd
  ? createLimiter(5, 15 * 60, 'Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau 15 phút.')
  : createLimiter(200, 60, 'Quá nhiều yêu cầu đăng nhập.');

// API chung: production 100 lần / phút, dev 500 lần / phút
const apiLimiter = isProd
  ? createLimiter(100, 60, 'Quá nhiều yêu cầu, vui lòng thử lại sau.')
  : createLimiter(500, 60, 'Quá nhiều yêu cầu, vui lòng thử lại sau.');

// Tải lên 20 lần / phút, làm mới phiên 30 lần / 15 phút
const uploadLimiter = createLimiter(20, 60, 'Quá nhiều yêu cầu tải lên, vui lòng thử lại sau.');
const refreshLimiter = createLimiter(30, 15 * 60, 'Quá nhiều yêu cầu làm mới phiên, vui lòng thử lại sau.');

export { authLimiter, apiLimiter, uploadLimiter, refreshLimiter, createLimiter };