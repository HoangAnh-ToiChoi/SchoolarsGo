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
  ORIGIN_NOT_ALLOWED: { statusCode: 403, code: 'ORIGIN_NOT_ALLOWED', message: 'Nguồn gửi yêu cầu không được phép.' },
});

module.exports = { authorization };
