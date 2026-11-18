import * as Sentry from '@sentry/node';
import { resolveError } from '~/configs/error.config.js';
import { ApiResponse } from '~/utils/responseHelper.js';

/** Điểm cuối của mọi lỗi: đổi lỗi thành response chuẩn; mọi lỗi 5xx (kể cả lỗi nghiệp vụ như upload/DB thất bại) đều ghi log + Sentry. */
const errorHandler = (err, req, res, _next) => {
  const resolved = resolveError(err);
  const isServerError = resolved.statusCode >= 500;

  if (isServerError) {
    if (process.env.SENTRY_DSN) Sentry.captureException(err);
    console.error('Server error:', err);
  } else if (process.env.NODE_ENV !== 'production' && resolved.errorCode !== 'VALIDATION_ERROR') {
    console.error('Error:', err);
  }

  return res.status(resolved.statusCode).json(ApiResponse.error(resolved));
};

export default errorHandler;
