import * as Sentry from '@sentry/node';
import { resolveError } from '#configs/error.config.js';
import { ApiResponse } from '#utils/responseHelper.js';

/** Điểm cuối của mọi lỗi: đổi lỗi thành response chuẩn, lỗi lạ thì ghi log + Sentry. */
const errorHandler = (err, req, res, _next) => {
  const resolved = resolveError(err);
  const isUnexpected = resolved.statusCode >= 500 && !err.isOperational;

  if (isUnexpected) {
    if (process.env.SENTRY_DSN) Sentry.captureException(err);
    console.error('Unhandled error:', err);
  } else if (process.env.NODE_ENV !== 'production' && resolved.errorCode !== 'VALIDATION_ERROR') {
    console.error('Error:', err);
  }

  return res.status(resolved.statusCode).json(ApiResponse.error(resolved));
};

export default errorHandler;
