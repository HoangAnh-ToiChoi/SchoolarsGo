import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_FILE_MB } from '../constants';
import { validateFile } from './validateFile.js';

describe('validateFile', () => {
  it('đuôi hợp lệ (không phân biệt hoa thường) và đủ nhỏ thì qua', () => {
    assert.equal(validateFile({ name: 'transcript.PDF', size: 1000 }), null);
    assert.equal(validateFile({ name: 'sop.final.docx', size: 1000 }), null);
  });

  it('đuôi không nhận thì báo lỗi', () => {
    assert.match(validateFile({ name: 'virus.exe', size: 10 }), /PDF, DOC, DOCX hoặc TXT/);
  });

  it(`lớn hơn ${MAX_FILE_MB}MB thì báo lỗi`, () => {
    const size = MAX_FILE_MB * 1024 * 1024 + 1;
    assert.equal(validateFile({ name: 'cv.pdf', size }), `Tệp lớn hơn ${MAX_FILE_MB}MB`);
  });
});
