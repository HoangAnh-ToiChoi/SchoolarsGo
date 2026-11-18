import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import { common, postgres, multer } from '~/constants/errors.js';

/**
 * Mỗi hàm nhận một lỗi, nhận ra thì trả { statusCode, code, errorCode, message, details }, không thì null.
 * `code` giữ kiểu cũ (số HTTP hoặc mã chữ của AppError) để FE đang đọc không gãy; `errorCode` là mã chuẩn.
 */
const build = ({ statusCode, code, message }, details = null) => ({ statusCode, code: statusCode, errorCode: code, message, details });
const ownEntry = (table, key) => typeof key === 'string' && Object.hasOwn(table, key) && table[key];

const zodError = err =>
  err instanceof ZodError
    ? build(common.VALIDATION_ERROR, err.errors.map(e => ({ field: e.path.join('.'), message: e.message })))
    : null;

const postgresError = err => {
  const mapped = ownEntry(postgres, err.code);
  return mapped ? build(mapped) : null;
};

const jwtError = err => {
  if (err.name === 'JsonWebTokenError') return build(common.INVALID_TOKEN);
  if (err.name === 'TokenExpiredError') return build(common.TOKEN_EXPIRED);
  return null;
};

const multerError = err => {
  const mapped = ownEntry(multer, err.code);
  return mapped ? build(mapped) : null;
};

const malformedJsonError = err => (err.type === 'entity.parse.failed' ? build(common.MALFORMED_JSON) : null);

const appError = err => {
  if (!err.isOperational) return null;
  const statusCode = err.statusCode || 400;
  return {
    statusCode,
    code: err.code || statusCode,
    errorCode: err.errorCode || 'BAD_REQUEST',
    message: err.message,
    details: err.details ?? null,
  };
};

const mappers = [zodError, postgresError, jwtError, multerError, malformedJsonError, appError];

/** Đổi một lỗi bất kỳ thành thông tin response. Lỗi không nhận ra → 500, không lộ chi tiết nội bộ. */
const resolveError = err => {
  for (const map of mappers) {
    const resolved = map(err);
    if (resolved) return resolved;
  }
  return build(common.INTERNAL_SERVER_ERROR);
};

class ErrorHandleController {
  /** Cho test và nơi khác cần đổi lỗi mà không qua response. */
  resolve(err) {
    return resolveError(err);
  }

  /** Route không khớp. */
  notFound(req, res) {
    return res.error(build(common.ROUTE_NOT_FOUND));
  }

  /** Điểm cuối của mọi lỗi: đổi lỗi thành response chuẩn; mọi lỗi 5xx (kể cả lỗi nghiệp vụ như upload/DB thất bại) đều ghi log + Sentry. */
  handle(err, req, res, _next) {
    const resolved = resolveError(err);

    if (resolved.statusCode >= 500) {
      if (process.env.SENTRY_DSN) Sentry.captureException(err);
      console.error('Server error:', err);
    } else if (process.env.NODE_ENV !== 'production' && resolved.errorCode !== common.VALIDATION_ERROR.code) {
      console.error('Error:', err);
    }

    return res.error(resolved);
  }
}

export default new ErrorHandleController();
