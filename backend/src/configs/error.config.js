import { ZodError } from 'zod';

/**
 * Gom cách đổi mọi lỗi (zod, Postgres/Supabase, JWT, multer, JSON hỏng, AppError, lỗi lạ)
 * thành một dạng duy nhất { statusCode, code, errorCode, message, details }.
 * `code` giữ kiểu cũ (số HTTP hoặc mã chữ của AppError) để FE đang đọc không gãy.
 */

const INTERNAL_MESSAGE = 'Lỗi máy chủ, vui lòng thử lại sau';

const POSTGRES_ERRORS = {
  23505: { statusCode: 409, errorCode: 'DUPLICATE_ENTRY', message: 'Dữ liệu đã tồn tại (unique constraint violation)' },
  23503: { statusCode: 400, errorCode: 'INVALID_REFERENCE', message: 'Tham chiếu không hợp lệ (foreign key violation)' },
  '22P02': { statusCode: 400, errorCode: 'INVALID_DATA_FORMAT', message: 'Dữ liệu có định dạng không hợp lệ' },
};

const MULTER_ERRORS = {
  LIMIT_FILE_SIZE: { errorCode: 'FILE_TOO_LARGE', message: 'File quá lớn (tối đa 10MB)' },
  LIMIT_UNEXPECTED_FILE: { errorCode: 'UNEXPECTED_FILE', message: 'Field upload không hợp lệ' },
};

const result = (statusCode, errorCode, message, details = null) =>
  ({ statusCode, code: statusCode, errorCode, message, details });

function zodError(err) {
  if (!(err instanceof ZodError)) return null;
  const details = err.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
  return result(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', details);
}

function postgresError(err) {
  const mapped = typeof err.code === 'string' && Object.hasOwn(POSTGRES_ERRORS, err.code) && POSTGRES_ERRORS[err.code];
  return mapped ? result(mapped.statusCode, mapped.errorCode, mapped.message) : null;
}

function jwtError(err) {
  if (err.name === 'JsonWebTokenError') return result(401, 'INVALID_TOKEN', 'Token không hợp lệ');
  if (err.name === 'TokenExpiredError') return result(401, 'TOKEN_EXPIRED', 'Phiên đăng nhập đã hết hạn');
  return null;
}

function multerError(err) {
  const mapped = typeof err.code === 'string' && Object.hasOwn(MULTER_ERRORS, err.code) && MULTER_ERRORS[err.code];
  return mapped ? result(400, mapped.errorCode, mapped.message) : null;
}

function malformedJsonError(err) {
  return err.type === 'entity.parse.failed'
    ? result(400, 'MALFORMED_JSON', 'Request body không phải JSON hợp lệ')
    : null;
}

function appError(err) {
  if (!err.isOperational) return null;
  const statusCode = err.statusCode || 400;
  return {
    statusCode,
    code: err.code || statusCode,
    errorCode: err.errorCode || 'BAD_REQUEST',
    message: err.message,
    details: err.details ?? null,
  };
}

const mappers = [zodError, postgresError, jwtError, multerError, malformedJsonError, appError];

/** Đổi một lỗi bất kỳ thành thông tin response. Lỗi không nhận ra → 500, không lộ chi tiết nội bộ. */
function resolveError(err) {
  for (const map of mappers) {
    const resolved = map(err);
    if (resolved) return resolved;
  }
  return result(500, 'INTERNAL_SERVER_ERROR', INTERNAL_MESSAGE);
}

export { resolveError };
