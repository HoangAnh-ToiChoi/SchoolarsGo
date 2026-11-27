import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatFileSize } from './formatFileSize.js';

describe('formatFileSize', () => {
  it('dưới 1MB hiện KB, tối thiểu 1 KB', () => {
    assert.equal(formatFileSize(500), '1 KB');
    assert.equal(formatFileSize(2048), '2 KB');
  });

  it('từ 1MB hiện MB một chữ số thập phân', () => {
    assert.equal(formatFileSize(1.5 * 1024 * 1024), '1.5 MB');
  });

  it('không có kích thước trả chuỗi rỗng', () => {
    assert.equal(formatFileSize(0), '');
    assert.equal(formatFileSize(undefined), '');
  });
});
