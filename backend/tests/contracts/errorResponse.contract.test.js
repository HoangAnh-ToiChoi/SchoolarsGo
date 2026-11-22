import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

import responseController from '~/controllers/response.controller.js';
import errorHandleController from '~/controllers/errorHandle.controller.js';
import { AppError, authorization, profile, saved, notification } from '~/constants/errors.js';

test('AppError: định nghĩa có hàm thay đổi nội dung (profile.gpaOutOfRange) vẫn giữ status, code, message', () => {
  const error = new AppError(profile.gpaOutOfRange(10));
  assert.equal(error.statusCode, 400);
  assert.equal(error.code, 'INVALID_GPA');
  assert.equal(error.errorCode, 'INVALID_GPA');
  assert.equal(error.message, 'GPA phải nằm trong khoảng 0 - 10');
});

test('AppError dựng từ hằng số trong constants/errors.js giữ nguyên code và status', () => {
  const error = new AppError(authorization.USER_EXISTS);
  assert.equal(error.statusCode, 409);
  assert.equal(error.code, 'USER_EXISTS');
  assert.equal(error.errorCode, 'USER_EXISTS');
});

test('resolveError: AppError giữ message, code kiểu cũ và thêm error', () => {
  const resolved = errorHandleController.resolve(new AppError(saved.ALREADY_SAVED));
  assert.deepEqual(
    { statusCode: resolved.statusCode, code: resolved.code, errorCode: resolved.errorCode, message: resolved.message },
    { statusCode: 409, code: 'SCHOLARSHIP_ALREADY_SAVED', errorCode: 'SCHOLARSHIP_ALREADY_SAVED', message: saved.ALREADY_SAVED.message },
  );
  assert.equal(errorHandleController.resolve(new AppError(notification.NOT_FOUND)).code, 'NOTIFICATION_NOT_FOUND');
});

test('resolveError: ZodError thành 400 VALIDATION_ERROR kèm lỗi từng trường', () => {
  const parsed = z.object({ email: z.string().email() }).safeParse({ email: 'x' });
  const resolved = errorHandleController.resolve(parsed.error);
  assert.equal(resolved.statusCode, 400);
  assert.equal(resolved.errorCode, 'VALIDATION_ERROR');
  assert.equal(resolved.details[0].field, 'email');
});

test('resolveError: lỗi Postgres, JWT, multer, JSON hỏng được đổi đúng status', () => {
  assert.equal(errorHandleController.resolve({ code: '23505', message: 'dup' }).statusCode, 409);
  assert.equal(errorHandleController.resolve({ code: '23503', message: 'fk' }).statusCode, 400);
  assert.equal(errorHandleController.resolve({ code: '22P02', message: 'fmt' }).errorCode, 'INVALID_DATA_FORMAT');
  assert.equal(errorHandleController.resolve({ name: 'TokenExpiredError' }).errorCode, 'TOKEN_EXPIRED');
  assert.equal(errorHandleController.resolve({ name: 'JsonWebTokenError' }).errorCode, 'INVALID_TOKEN');
  assert.equal(errorHandleController.resolve({ code: 'LIMIT_FILE_SIZE' }).errorCode, 'FILE_TOO_LARGE');
  assert.equal(errorHandleController.resolve({ type: 'entity.parse.failed' }).errorCode, 'MALFORMED_JSON');
});

test('resolveError: lỗi lạ thành 500 và không lộ message nội bộ', () => {
  const resolved = errorHandleController.resolve(new Error('password=abc123 trong câu SQL'));
  assert.equal(resolved.statusCode, 500);
  assert.equal(resolved.errorCode, 'INTERNAL_SERVER_ERROR');
  assert.doesNotMatch(resolved.message, /abc123/);
});

test('res.success / res.error: thành công bỏ trường rỗng, lỗi có code + error + errors', () => {
  const send = (call) => {
    const out = {};
    const res = { status: (code) => ((out.status = code), res), json: (body) => ((out.body = body), res) };
    responseController.attach({}, res, () => {});
    call(res);
    return out;
  };

  const ok = send((res) => res.success({ a: 1 }, 'OK', { page: 1 }));
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.body, { success: true, data: { a: 1 }, message: 'OK', meta: { page: 1 } });
  assert.equal(send((res) => res.created({ id: 1 })).status, 201);
  assert.deepEqual(send((res) => res.success(null, '')).body, { success: true });

  const bad = send((res) => res.error({ statusCode: 400, message: 'Sai', code: 400, errorCode: 'VALIDATION_ERROR', details: [{ field: 'a', message: 'b' }] }));
  assert.equal(bad.status, 400);
  assert.deepEqual(bad.body, { success: false, message: 'Sai', code: 400, error: 'VALIDATION_ERROR', errors: [{ field: 'a', message: 'b' }] });
  assert.equal('errors' in send((res) => res.error({ statusCode: 404, message: 'Sai', code: 404, errorCode: 'NOT_FOUND' })).body, false);
});

test('resolveError: mã lỗi trùng khóa của Object.prototype không bị coi là lỗi Postgres/multer', () => {
  for (const code of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
    const resolved = errorHandleController.resolve({ code, message: 'x' });
    assert.equal(resolved.statusCode, 500);
    assert.equal(resolved.errorCode, 'INTERNAL_SERVER_ERROR');
  }
});

test('handleUploadError: MulterError đi qua errorHandle.controller, lỗi fileFilter thành AppError 400', async () => {
  const { default: multer } = await import('multer');
  const { handleUploadError } = await import('~/middlewares/upload.js');
  const run = (err) => {
    const seen = [];
    const req = { resume: () => seen.push('resume') };
    handleUploadError(err, req, {}, (e) => seen.push(e));
    return seen;
  };

  const tooBig = new multer.MulterError('LIMIT_FILE_SIZE');
  assert.deepEqual(run(tooBig), ['resume', tooBig]);
  assert.equal(errorHandleController.resolve(tooBig).errorCode, 'FILE_TOO_LARGE');

  const [, mapped] = run(new Error('Thiếu field "type" trong request'));
  assert.equal(mapped.statusCode, 400);
  assert.equal(mapped.code, 'UPLOAD_INVALID');
  assert.deepEqual(run(undefined), [undefined]);
});
