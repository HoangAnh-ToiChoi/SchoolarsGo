import * as Sentry from '@sentry/node';
import { common } from '~/constants/errors.js';
import { resolveError, buildError } from '~/utils/resolveError.js';
import { getSentryDsn, isProduction } from '~/configs/app.config.js';

/**
 * Điểm cuối của mọi lỗi. app.js gắn `notFound` / `handle` vào Express không bind `this`, nên không dùng `this`.
 * Việc đổi lỗi thành { statusCode, code, errorCode, message, details } nằm ở utils/resolveError.js.
 */
class ErrorHandleController {
  /** Cho test và nơi khác cần đổi lỗi mà không qua response. */
  resolve(err) {
    return resolveError(err);
  }

  /** Route không khớp. */
  notFound(req, res) {
    return res.error(buildError(common.ROUTE_NOT_FOUND));
  }

  /** Điểm cuối của mọi lỗi: đổi lỗi thành response chuẩn; mọi lỗi 5xx (kể cả lỗi nghiệp vụ như upload/DB thất bại) đều ghi log + Sentry. */
  handle(err, req, res, _next) {
    const resolved = resolveError(err);

    if (resolved.statusCode >= 500) {
      if (getSentryDsn()) Sentry.captureException(err);
      console.error('Server error:', err);
    } else if (!isProduction() && resolved.errorCode !== common.VALIDATION_ERROR.code) {
      console.error('Error:', err);
    }

    return res.error(resolved);
  }
}

export default new ErrorHandleController();
