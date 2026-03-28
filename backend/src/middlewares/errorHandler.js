const errorHandler = (err, req, res, next) => {
  // Log lỗi ra console trong development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  }

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

  // Lỗi tùy chỉnh từ service layer
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message,
      code: err.statusCode || 400,
    });
  }

  // Lỗi không xác định — không leak internal details
  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: 'Lỗi máy chủ, vui lòng thử lại sau',
    code: 500,
  });
};

module.exports = errorHandler;
