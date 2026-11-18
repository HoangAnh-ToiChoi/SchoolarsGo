/**
 * Middleware gắn hàm trả response lên `res`, mọi request đi qua đều có sẵn:
 *   res.success(data, message, meta)   200   { success, data?, message?, meta? }
 *   res.created(data, message)         201
 *   res.error(error)                   lỗi   { success: false, message, code, error, errors? }
 * `code` giữ cho FE đang đọc; `error` là mã chuẩn UPPER_SNAKE_CASE; `errors` là chi tiết từng trường.
 * Mount trước mọi route trong app.js. Controller chỉ gọi `res.success(...)`, không tự viết JSON.
 */
class ResponseController {
  attach(req, res, next) {
    const ok = (status, data, message, meta) => {
      const body = { success: true };
      if (data !== null) body.data = data;
      if (message) body.message = message;
      if (meta) body.meta = meta;
      return res.status(status).json(body);
    };

    res.success = (data = null, message = 'OK', meta = null) => ok(200, data, message, meta);
    res.created = (data = null, message = 'Created') => ok(201, data, message, null);
    res.error = ({ statusCode, message, code, errorCode, details = null }) => {
      const body = { success: false, message, code, error: errorCode };
      if (details) body.errors = details;
      return res.status(statusCode).json(body);
    };

    next();
  }
}

export default new ResponseController();
