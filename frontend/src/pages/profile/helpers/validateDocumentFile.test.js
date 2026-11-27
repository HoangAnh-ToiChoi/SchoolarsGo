import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateDocumentFile } from './validateDocumentFile.js';

describe('validateDocumentFile', () => {
  it('tệp hợp lệ', () => {
    assert.deepEqual(validateDocumentFile({ name: 'cv.PDF', size: 1024 }), { valid: true, error: null });
  });

  it('thiếu tệp, quá 10MB, sai đuôi đều bị từ chối', () => {
    assert.equal(validateDocumentFile(null).valid, false);
    assert.match(validateDocumentFile({ name: 'cv.pdf', size: 10 * 1024 * 1024 + 1 }).error, /10MB/);
    assert.match(validateDocumentFile({ name: 'cv.exe', size: 10 }).error, /không được hỗ trợ/);
  });

  it('cho phép đổi giới hạn qua options', () => {
    const options = { maxSize: 100, allowedExtensions: ['.png'] };
    assert.equal(validateDocumentFile({ name: 'a.png', size: 50 }, options).valid, true);
    assert.equal(validateDocumentFile({ name: 'a.png', size: 200 }, options).valid, false);
  });
});
