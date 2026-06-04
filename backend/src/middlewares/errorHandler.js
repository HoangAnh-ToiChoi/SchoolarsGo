const Sentry = require('@sentry/node');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  // Xử lý lỗi Supabase
  if (err.code && err.message && err.details) {
    // Supabase validation error
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Dữ liệu đã tồn tại (unique constraint violation)',
        code: 409,
      });
    }
    if (err.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Tham chiếu không hợp lệ (foreign key violation)',
        code: 400,
      });
    }
  }

  // Xử lý JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ',
      code: 401,
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập đã hết hạn',
      code: 401,
    });
  }

  // Xử lý Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File quá lớn (tối đa 10MB)',
      code: 400,
    });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Field upload không hợp lệ',
      code: 400,
    });
  }

  // Body-parser JSON parse error (invalid JSON body từ client)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Request body không phải JSON hợp lệ',
      code: 400,
    });
  }

  // Lỗi tùy chỉnh từ service layer (AppError với isOperational = true)
  // Bao gồm: Storage errors, validation errors, business logic errors...
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message,
      code: err.statusCode || 400,
    });
  }

  // Lỗi không xác định — capture Sentry + không leak internal details
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
  logger.error({ err }, 'Unhandled request error');
  return res.status(500).json({
    success: false,
    message: 'Lỗi máy chủ, vui lòng thử lại sau',
    code: 500,
  });
};

module.exports = errorHandler;
