/**
 * ApiResponse — dạng JSON chuẩn của mọi response.
 *   Thành công: { success: true, data?, message?, meta? }
 *   Lỗi:        { success: false, message, code, error, errors? }
 * `code` giữ cho FE đang đọc; `error` là mã lỗi chuẩn (UPPER_SNAKE_CASE); `errors` là chi tiết từng trường.
 */
class ApiResponse {
  static success(data = null, message = 'OK', meta = null) {
    const body = { success: true };
    if (data !== null) body.data = data;
    if (message) body.message = message;
    if (meta) body.meta = meta;
    return body;
  }

  static error({ message, code, errorCode, details = null }) {
    const body = { success: false, message, code, error: errorCode };
    if (details) body.errors = details;
    return body;
  }
}

const success = (res, data = null, message = 'OK', meta = null) =>
  res.json(ApiResponse.success(data, message, meta));

const created = (res, data = null, message = 'Created') =>
  res.status(201).json(ApiResponse.success(data, message));

export { ApiResponse, success, created };
