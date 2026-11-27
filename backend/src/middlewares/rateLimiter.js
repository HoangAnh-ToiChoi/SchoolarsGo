import rateLimit from 'express-rate-limit';
import { getCvDailyLimit } from '~/configs/cv.config.js';
import { CV_RATE_WINDOW_MS } from '~/constants/cv.js';
import { cv as cvErrors } from '~/constants/errors.js';
import { clientIpKey } from '~/utils/clientIp.js';
import { isProduction } from '~/configs/app.config.js';

const createLimiter = (maxRequests, windowSeconds, message, options = {}) => {
  return rateLimit({
    windowMs: windowSeconds * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.error({ statusCode: 429, message, code: 429, errorCode: 'TOO_MANY_REQUESTS' }),
    keyGenerator: clientIpKey,
    ...options,
  });
};

const isProd = isProduction();

// Mỗi route auth một bộ đếm riêng (R15): trước đây 4 route dùng chung một bộ theo IP, nên đăng nhập sai 5 lần
// là cả IP (ký túc xá, quán cà phê dùng chung NAT) không đăng ký hay lấy lại mật khẩu được nữa.
// Bộ đếm nằm trong RAM của tiến trình: đủ cho 1 instance Railway; chạy nhiều instance thì cần store dùng chung.

// Chạy trước validate nên tự chuẩn hóa email giống auth.validation
function ipAndEmailKey(req) {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  return `${clientIpKey(req)}|${email}`;
}

// Đăng nhập: production 5 lần sai / 15 phút cho mỗi cặp IP + email (đăng nhập đúng không tính), dev 200 lần / phút
const loginLimiter = isProd
  ? createLimiter(5, 15 * 60, 'Quá nhiều lần đăng nhập sai, vui lòng thử lại sau 15 phút.', { keyGenerator: ipAndEmailKey, skipSuccessfulRequests: true })
  : createLimiter(200, 60, 'Quá nhiều yêu cầu đăng nhập.');

// Chặn dò mật khẩu trên nhiều email từ một IP: 50 lần / 15 phút (production)
const loginIpLimiter = isProd
  ? createLimiter(50, 15 * 60, 'Quá nhiều yêu cầu đăng nhập từ địa chỉ này, vui lòng thử lại sau.')
  : createLimiter(1000, 60, 'Quá nhiều yêu cầu đăng nhập.');

// Đăng ký: production 10 lần / giờ / IP
const registerLimiter = isProd
  ? createLimiter(10, 60 * 60, 'Quá nhiều yêu cầu đăng ký, vui lòng thử lại sau.')
  : createLimiter(200, 60, 'Quá nhiều yêu cầu đăng ký.');

// Chặn một IP gửi mail đặt lại mật khẩu hàng loạt bằng cách đổi email: 20 lần / giờ (production)
const forgotPasswordIpLimiter = isProd
  ? createLimiter(20, 60 * 60, 'Quá nhiều yêu cầu đặt lại mật khẩu từ địa chỉ này, vui lòng thử lại sau.')
  : createLimiter(1000, 60, 'Quá nhiều yêu cầu đặt lại mật khẩu.');

// Quên mật khẩu (gửi email): production 5 lần / giờ cho mỗi cặp IP + email; đặt lại bằng token: 10 lần / 15 phút / IP
const forgotPasswordLimiter = isProd
  ? createLimiter(5, 60 * 60, 'Quá nhiều yêu cầu đặt lại mật khẩu, vui lòng thử lại sau.', { keyGenerator: ipAndEmailKey })
  : createLimiter(200, 60, 'Quá nhiều yêu cầu đặt lại mật khẩu.');
const resetPasswordLimiter = isProd
  ? createLimiter(10, 15 * 60, 'Quá nhiều yêu cầu đặt lại mật khẩu, vui lòng thử lại sau.')
  : createLimiter(200, 60, 'Quá nhiều yêu cầu đặt lại mật khẩu.');

// API chung: production 100 lần / phút, dev 500 lần / phút
const apiLimiter = isProd
  ? createLimiter(100, 60, 'Quá nhiều yêu cầu, vui lòng thử lại sau.')
  : createLimiter(500, 60, 'Quá nhiều yêu cầu, vui lòng thử lại sau.');

// Tải lên 20 lần / phút, làm mới phiên 30 lần / 15 phút
const uploadLimiter = createLimiter(20, 60, 'Quá nhiều yêu cầu tải lên, vui lòng thử lại sau.');
const refreshLimiter = createLimiter(30, 15 * 60, 'Quá nhiều yêu cầu làm mới phiên, vui lòng thử lại sau.');

// Đọc CV tốn lượt Gemini: giới hạn / ngày / người theo configs/cv.config.js. Cần chạy sau auth để có req.user.
const cvLimiter = rateLimit({
  windowMs: CV_RATE_WINDOW_MS,
  max: getCvDailyLimit(),
  keyGenerator: req => req.user.id,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.error({ statusCode: cvErrors.LIMIT_REACHED.statusCode, message: cvErrors.LIMIT_REACHED.message, code: cvErrors.LIMIT_REACHED.statusCode, errorCode: cvErrors.LIMIT_REACHED.code }),
});

export {
  loginLimiter,
  loginIpLimiter,
  registerLimiter,
  forgotPasswordIpLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  apiLimiter,
  uploadLimiter,
  refreshLimiter,
  cvLimiter,
  createLimiter,
};