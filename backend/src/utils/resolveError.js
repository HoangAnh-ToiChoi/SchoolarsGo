import { ZodError } from 'zod';
import { ApiError as GeminiApiError } from '@google/genai';
import { common, postgres, multer, cv } from '~/constants/errors.js';
import { CV_FILE_ERROR_NAMES } from '~/constants/cv.js';

/**
 * Đổi một lỗi bất kỳ thành { statusCode, code, errorCode, message, details } cho errorHandle.controller.
 * Tách khỏi controller vì file vượt 100 dòng; hàm thuần, test gọi qua errorHandleController.resolve().
 * Mỗi mapper nhận một lỗi, nhận ra thì trả kết quả, không thì null.
 * `code` giữ kiểu cũ (số HTTP hoặc mã chữ của AppError) để FE đang đọc không gãy; `errorCode` là mã chuẩn.
 * Kiểu lỗi mới = mã trong constants/errors.js + một mapper ở đây (thêm vào resolveError).
 */

/** Đổi một lỗi bất kỳ thành thông tin response, thử lần lượt từng mapper. Lỗi không nhận ra → 500, không lộ chi tiết nội bộ. */
function resolveError(err) {
  const resolved = zodError(err)
    ?? postgresError(err)
    ?? jwtError(err)
    ?? multerError(err)
    ?? malformedJsonError(err)
    ?? payloadTooLargeError(err)
    ?? cvFileError(err)
    ?? aiError(err)
    ?? aiBadResponseError(err)
    ?? appError(err);
  return resolved ?? build(common.INTERNAL_SERVER_ERROR);
}

function build({ statusCode, code, message }, details = null) {
  return { statusCode, code: statusCode, errorCode: code, message, details };
}

function ownEntry(table, key) {
  return typeof key === 'string' && Object.hasOwn(table, key) && table[key];
}

function zodError(err) {
  if (!(err instanceof ZodError)) return null;
  return build(common.VALIDATION_ERROR, err.issues.map(e => ({ field: e.path.join('.'), message: e.message })));
}

function postgresError(err) {
  const mapped = ownEntry(postgres, err.code);
  return mapped ? build(mapped) : null;
}

function jwtError(err) {
  if (err.name === 'JsonWebTokenError') return build(common.INVALID_TOKEN);
  if (err.name === 'TokenExpiredError') return build(common.TOKEN_EXPIRED);
  return null;
}

function multerError(err) {
  const mapped = ownEntry(multer, err.code);
  return mapped ? build(mapped) : null;
}

function malformedJsonError(err) {
  return err.type === 'entity.parse.failed' ? build(common.MALFORMED_JSON) : null;
}

// Body JSON vượt giới hạn express.json (app.js): lỗi của client, trước đây rơi xuống 500
function payloadTooLargeError(err) {
  return err.type === 'entity.too.large' ? build(common.PAYLOAD_TOO_LARGE) : null;
}

// Thư viện đọc PDF ném lỗi riêng khi file hỏng / có mật khẩu: lỗi của người dùng, không phải lỗi server
function cvFileError(err) {
  return CV_FILE_ERROR_NAMES.includes(err.name) ? build(cv.UNREADABLE_FILE) : null;
}

// Gemini lỗi mạng, quá hạn mức, bị chặn nội dung… (cvExtract.service không bắt, lỗi rơi xuống đây)
function aiError(err) {
  return err instanceof GeminiApiError ? build(cv.AI_FAILED) : null;
}

// JSON.parse chữ AI trả về bị hỏng. Lỗi JSON của request body đã được #malformedJsonError nhận trước (có `type`)
function aiBadResponseError(err) {
  return err instanceof SyntaxError ? build(cv.AI_BAD_RESPONSE) : null;
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

export { resolveError, build as buildError };
