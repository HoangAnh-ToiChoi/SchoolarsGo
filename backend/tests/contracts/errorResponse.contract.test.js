import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

import AppError from '#utils/AppError.js';
import { ApiResponse } from '#utils/responseHelper.js';
import { resolveError } from '#configs/error.config.js';
import { authorization } from '#constants/errors.js';

test('AppError.notFound: status 404, errorCode mặc định, code chỉ có khi truyền', () => {
  const plain = AppError.notFound('Không thấy');
  assert.equal(plain.statusCode, 404);
  assert.equal(plain.errorCode, 'NOT_FOUND');
  assert.equal(plain.code, undefined);

  const coded = AppError.notFound('Không thấy', 'SCHOLARSHIP_NOT_FOUND');
  assert.equal(coded.code, 'SCHOLARSHIP_NOT_FOUND');
  assert.equal(coded.errorCode, 'SCHOLARSHIP_NOT_FOUND');
});

test('AppError dựng từ hằng số trong constants/errors.js giữ nguyên code và status', () => {
  const error = new AppError(authorization.USER_EXISTS);
  assert.equal(error.statusCode, 409);
  assert.equal(error.code, 'USER_EXISTS');
  assert.equal(error.errorCode, 'USER_EXISTS');
});

test('resolveError: AppError giữ message, code kiểu cũ và thêm error', () => {
  const resolved = resolveError(AppError.conflict('Trùng', 'ALREADY_SAVED'));
  assert.deepEqual(
    { statusCode: resolved.statusCode, code: resolved.code, errorCode: resolved.errorCode, message: resolved.message },
    { statusCode: 409, code: 'ALREADY_SAVED', errorCode: 'ALREADY_SAVED', message: 'Trùng' },
  );
  assert.equal(resolveError(AppError.notFound('x')).code, 404);
});

test('resolveError: ZodError thành 400 VALIDATION_ERROR kèm lỗi từng trường', () => {
  const parsed = z.object({ email: z.string().email() }).safeParse({ email: 'x' });
  const resolved = resolveError(parsed.error);
  assert.equal(resolved.statusCode, 400);
  assert.equal(resolved.errorCode, 'VALIDATION_ERROR');
  assert.equal(resolved.details[0].field, 'email');
});

test('resolveError: lỗi Postgres, JWT, multer, JSON hỏng được đổi đúng status', () => {
  assert.equal(resolveError({ code: '23505', message: 'dup' }).statusCode, 409);
  assert.equal(resolveError({ code: '23503', message: 'fk' }).statusCode, 400);
  assert.equal(resolveError({ code: '22P02', message: 'fmt' }).errorCode, 'INVALID_DATA_FORMAT');
  assert.equal(resolveError({ name: 'TokenExpiredError' }).errorCode, 'TOKEN_EXPIRED');
  assert.equal(resolveError({ name: 'JsonWebTokenError' }).errorCode, 'INVALID_TOKEN');
  assert.equal(resolveError({ code: 'LIMIT_FILE_SIZE' }).errorCode, 'FILE_TOO_LARGE');
  assert.equal(resolveError({ type: 'entity.parse.failed' }).errorCode, 'MALFORMED_JSON');
});

test('resolveError: lỗi lạ thành 500 và không lộ message nội bộ', () => {
  const resolved = resolveError(new Error('password=abc123 trong câu SQL'));
  assert.equal(resolved.statusCode, 500);
  assert.equal(resolved.errorCode, 'INTERNAL_SERVER_ERROR');
  assert.doesNotMatch(resolved.message, /abc123/);
});

test('ApiResponse: thành công bỏ trường rỗng, lỗi có code + error + errors', () => {
  assert.deepEqual(ApiResponse.success({ a: 1 }, 'OK', { page: 1 }), { success: true, data: { a: 1 }, message: 'OK', meta: { page: 1 } });
  assert.deepEqual(ApiResponse.success(null, ''), { success: true });
  assert.deepEqual(
    ApiResponse.error({ message: 'Sai', code: 400, errorCode: 'VALIDATION_ERROR', details: [{ field: 'a', message: 'b' }] }),
    { success: false, message: 'Sai', code: 400, error: 'VALIDATION_ERROR', errors: [{ field: 'a', message: 'b' }] },
  );
  assert.equal('errors' in ApiResponse.error({ message: 'Sai', code: 404, errorCode: 'NOT_FOUND' }), false);
});

test('resolveError: mã lỗi trùng khóa của Object.prototype không bị coi là lỗi Postgres/multer', () => {
  for (const code of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
    const resolved = resolveError({ code, message: 'x' });
    assert.equal(resolved.statusCode, 500);
    assert.equal(resolved.errorCode, 'INTERNAL_SERVER_ERROR');
  }
});

test('handleUploadError: MulterError đi qua errorHandler, lỗi fileFilter thành AppError 400', async () => {
  const { default: multer } = await import('multer');
  const { handleUploadError } = await import('#middlewares/upload.js');
  const run = (err) => {
    const seen = [];
    const req = { resume: () => seen.push('resume') };
    handleUploadError(err, req, {}, (e) => seen.push(e));
    return seen;
  };

  const tooBig = new multer.MulterError('LIMIT_FILE_SIZE');
  assert.deepEqual(run(tooBig), ['resume', tooBig]);
  assert.equal(resolveError(tooBig).errorCode, 'FILE_TOO_LARGE');

  const [, mapped] = run(new Error('Thiếu field "type" trong request'));
  assert.equal(mapped.statusCode, 400);
  assert.equal(mapped.code, 'UPLOAD_INVALID');
  assert.deepEqual(run(undefined), [undefined]);
});
