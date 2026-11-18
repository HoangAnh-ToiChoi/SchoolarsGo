const DEFAULT_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
};

/**
 * AppError — lỗi nghiệp vụ của ứng dụng (isOperational = true).
 * Ba cách tạo:
 *   AppError.notFound('Học bổng không tồn tại.', 'SCHOLARSHIP_NOT_FOUND')   // dùng cho lỗi thường
 *   new AppError(authorization.USER_EXISTS)                                // mã lỗi dựng sẵn trong constants/errors.js
 *   new AppError('Bận', 503, 'CHAT_BUSY')                                  // status không có hàm tạo sẵn
 * `code` chỉ có khi truyền mã tường minh (FE đọc `code`, test so `error.code`).
 * `errorCode` luôn có (mặc định theo status) và là giá trị trả về ở trường `error` của response.
 */
class AppError extends Error {
  constructor(messageOrDetails, statusCode = 500, code, details = null) {
    const input = typeof messageOrDetails === 'object' && messageOrDetails !== null
      ? messageOrDetails
      : { message: messageOrDetails, statusCode, code, details };

    super(input.message);
    this.statusCode = input.statusCode;
    this.isOperational = true;
    this.errorCode = input.code || DEFAULT_CODES[input.statusCode] || (input.statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
    if (input.code) this.code = input.code;
    this.details = input.details ?? null;
  }

  static badRequest(message = 'Dữ liệu yêu cầu không hợp lệ', code, details) {
    return new AppError(message, 400, code, details);
  }

  static unauthorized(message = 'Xác thực không thành công', code) {
    return new AppError(message, 401, code);
  }

  static forbidden(message = 'Bạn không có quyền thực hiện thao tác này', code) {
    return new AppError(message, 403, code);
  }

  static notFound(message = 'Không tìm thấy dữ liệu yêu cầu', code) {
    return new AppError(message, 404, code);
  }

  static conflict(message = 'Dữ liệu đã tồn tại', code, details) {
    return new AppError(message, 409, code, details);
  }

  static internal(message = 'Lỗi máy chủ, vui lòng thử lại sau', code) {
    return new AppError(message, 500, code);
  }
}

export default AppError;
