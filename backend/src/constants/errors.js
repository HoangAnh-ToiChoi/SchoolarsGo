const authorization = Object.freeze({
  ACCESS_TOKEN_MISSING: { statusCode: 401, code: 'ACCESS_TOKEN_MISSING', message: 'Vui lòng đăng nhập để tiếp tục.' },
  ACCESS_TOKEN_EXPIRED: { statusCode: 401, code: 'ACCESS_TOKEN_EXPIRED', message: 'Phiên đăng nhập đã hết hạn.' },
  ACCESS_TOKEN_INVALID: { statusCode: 401, code: 'ACCESS_TOKEN_INVALID', message: 'Access token không hợp lệ.' },
  REFRESH_TOKEN_MISSING: { statusCode: 401, code: 'REFRESH_TOKEN_MISSING', message: 'Thiếu refresh token.' },
  REFRESH_TOKEN_EXPIRED: { statusCode: 401, code: 'REFRESH_TOKEN_EXPIRED', message: 'Refresh token đã hết hạn.' },
  REFRESH_TOKEN_INVALID: { statusCode: 401, code: 'REFRESH_TOKEN_INVALID', message: 'Refresh token không hợp lệ.' },
  REFRESH_TOKEN_REUSED: { statusCode: 401, code: 'REFRESH_TOKEN_REUSED', message: 'Refresh token đã được sử dụng lại.' },
  REFRESH_RACE: { statusCode: 409, code: 'REFRESH_RACE', message: 'Phiên đăng nhập đang được làm mới ở tab khác.' },
  SESSION_REVOKED: { statusCode: 401, code: 'SESSION_REVOKED', message: 'Phiên đăng nhập đã bị thu hồi.' },
  SESSION_NOT_FOUND: { statusCode: 404, code: 'SESSION_NOT_FOUND', message: 'Không tìm thấy thiết bị.' },
  ACCOUNT_LOCKED: { statusCode: 403, code: 'ACCOUNT_LOCKED', message: 'Tài khoản đã bị khóa.' },
  INVALID_CREDENTIALS: { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu không đúng.' },
  USER_EXISTS: { statusCode: 409, code: 'USER_EXISTS', message: 'Email đã được sử dụng.' },
  USER_NOT_FOUND: { statusCode: 404, code: 'USER_NOT_FOUND', message: 'Không tìm thấy tài khoản.' },
  CREATE_USER_FAILED: { statusCode: 500, code: 'CREATE_USER_FAILED', message: 'Không thể tạo tài khoản.' },
  INVALID_RESET_TOKEN: { statusCode: 400, code: 'INVALID_RESET_TOKEN', message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' },
  EXPIRED_RESET_TOKEN: { statusCode: 400, code: 'EXPIRED_RESET_TOKEN', message: 'Liên kết đã hết hạn. Vui lòng yêu cầu lại.' },
  ORIGIN_NOT_ALLOWED: { statusCode: 403, code: 'ORIGIN_NOT_ALLOWED', message: 'Nguồn gửi yêu cầu không được phép.' },
});

// Lỗi chung của server (errorHandle.controller dùng khi gặp lỗi không phải AppError)
const common = Object.freeze({
  INTERNAL_SERVER_ERROR: { statusCode: 500, code: 'INTERNAL_SERVER_ERROR', message: 'Lỗi máy chủ, vui lòng thử lại sau' },
  VALIDATION_ERROR: { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' },
  MALFORMED_JSON: { statusCode: 400, code: 'MALFORMED_JSON', message: 'Request body không phải JSON hợp lệ' },
  ROUTE_NOT_FOUND: { statusCode: 404, code: 'ROUTE_NOT_FOUND', message: 'Endpoint not found' },
  INVALID_TOKEN: { statusCode: 401, code: 'INVALID_TOKEN', message: 'Token không hợp lệ' },
  TOKEN_EXPIRED: { statusCode: 401, code: 'TOKEN_EXPIRED', message: 'Phiên đăng nhập đã hết hạn' },
});

// Mã lỗi của Postgres/Supabase (khóa là SQLSTATE)
const postgres = Object.freeze({
  23505: { statusCode: 409, code: 'DUPLICATE_ENTRY', message: 'Dữ liệu đã tồn tại (unique constraint violation)' },
  23503: { statusCode: 400, code: 'INVALID_REFERENCE', message: 'Tham chiếu không hợp lệ (foreign key violation)' },
  '22P02': { statusCode: 400, code: 'INVALID_DATA_FORMAT', message: 'Dữ liệu có định dạng không hợp lệ' },
});

// Mã lỗi của multer (khóa là err.code)
const multer = Object.freeze({
  LIMIT_FILE_SIZE: { statusCode: 400, code: 'FILE_TOO_LARGE', message: 'File quá lớn (tối đa 10MB)' },
  LIMIT_UNEXPECTED_FILE: { statusCode: 400, code: 'UNEXPECTED_FILE', message: 'Field upload không hợp lệ' },
});

export { authorization, common, postgres, multer };