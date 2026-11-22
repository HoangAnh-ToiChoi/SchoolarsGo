import * as Sentry from '@sentry/node';
import { ZodError } from 'zod';
import { GoogleGenerativeAIError } from '@google/generative-ai';
import { common, postgres, multer, cv } from '~/constants/errors.js';
import { CV_FILE_ERROR_NAMES } from '~/constants/cv.js';

/**
 * Hàm phụ là `static #` và gọi qua tên class vì app.js gắn `notFound` / `handle` vào Express không bind `this`.
 * Mỗi mapper nhận một lỗi, nhận ra thì trả { statusCode, code, errorCode, message, details }, không thì null.
 * `code` giữ kiểu cũ (số HTTP hoặc mã chữ của AppError) để FE đang đọc không gãy; `errorCode` là mã chuẩn.
 */
class ErrorHandleController {
  /** Cho test và nơi khác cần đổi lỗi mà không qua response. */
  resolve(err) {
    return ErrorHandleController.#resolveError(err);
  }

  /** Route không khớp. */
  notFound(req, res) {
    return res.error(ErrorHandleController.#build(common.ROUTE_NOT_FOUND));
  }

  /** Điểm cuối của mọi lỗi: đổi lỗi thành response chuẩn; mọi lỗi 5xx (kể cả lỗi nghiệp vụ như upload/DB thất bại) đều ghi log + Sentry. */
  handle(err, req, res, _next) {
    const resolved = ErrorHandleController.#resolveError(err);

    if (resolved.statusCode >= 500) {
      if (process.env.SENTRY_DSN) Sentry.captureException(err);
      console.error('Server error:', err);
    } else if (process.env.NODE_ENV !== 'production' && resolved.errorCode !== common.VALIDATION_ERROR.code) {
      console.error('Error:', err);
    }

    return res.error(resolved);
  }

  /** Đổi một lỗi bất kỳ thành thông tin response, thử lần lượt từng mapper. Lỗi không nhận ra → 500, không lộ chi tiết nội bộ. */
  static #resolveError(err) {
    const resolved = ErrorHandleController.#zodError(err)
      ?? ErrorHandleController.#postgresError(err)
      ?? ErrorHandleController.#jwtError(err)
      ?? ErrorHandleController.#multerError(err)
      ?? ErrorHandleController.#malformedJsonError(err)
      ?? ErrorHandleController.#cvFileError(err)
      ?? ErrorHandleController.#aiError(err)
      ?? ErrorHandleController.#aiBadResponseError(err)
      ?? ErrorHandleController.#appError(err);
    return resolved ?? ErrorHandleController.#build(common.INTERNAL_SERVER_ERROR);
  }

  static #build({ statusCode, code, message }, details = null) {
    return { statusCode, code: statusCode, errorCode: code, message, details };
  }

  static #ownEntry(table, key) {
    return typeof key === 'string' && Object.hasOwn(table, key) && table[key];
  }

  static #zodError(err) {
    if (!(err instanceof ZodError)) return null;
    return ErrorHandleController.#build(common.VALIDATION_ERROR, err.errors.map(e => ({ field: e.path.join('.'), message: e.message })));
  }

  static #postgresError(err) {
    const mapped = ErrorHandleController.#ownEntry(postgres, err.code);
    return mapped ? ErrorHandleController.#build(mapped) : null;
  }

  static #jwtError(err) {
    if (err.name === 'JsonWebTokenError') return ErrorHandleController.#build(common.INVALID_TOKEN);
    if (err.name === 'TokenExpiredError') return ErrorHandleController.#build(common.TOKEN_EXPIRED);
    return null;
  }

  static #multerError(err) {
    const mapped = ErrorHandleController.#ownEntry(multer, err.code);
    return mapped ? ErrorHandleController.#build(mapped) : null;
  }

  static #malformedJsonError(err) {
    return err.type === 'entity.parse.failed' ? ErrorHandleController.#build(common.MALFORMED_JSON) : null;
  }

  // Thư viện đọc PDF ném lỗi riêng khi file hỏng / có mật khẩu: lỗi của người dùng, không phải lỗi server
  static #cvFileError(err) {
    return CV_FILE_ERROR_NAMES.includes(err.name) ? ErrorHandleController.#build(cv.UNREADABLE_FILE) : null;
  }

  // Gemini lỗi mạng, quá hạn mức, bị chặn nội dung… (cvExtract.service không bắt, lỗi rơi xuống đây)
  static #aiError(err) {
    return err instanceof GoogleGenerativeAIError ? ErrorHandleController.#build(cv.AI_FAILED) : null;
  }

  // JSON.parse chữ AI trả về bị hỏng. Lỗi JSON của request body đã được #malformedJsonError nhận trước (có `type`)
  static #aiBadResponseError(err) {
    return err instanceof SyntaxError ? ErrorHandleController.#build(cv.AI_BAD_RESPONSE) : null;
  }

  static #appError(err) {
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
}

export default new ErrorHandleController();
