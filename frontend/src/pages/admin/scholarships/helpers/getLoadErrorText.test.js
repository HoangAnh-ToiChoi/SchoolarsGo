import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getLoadErrorText } from './getLoadErrorText.js';

describe('getLoadErrorText', () => {
  it('404 nói rõ học bổng không còn; lỗi khác báo chung', () => {
    assert.match(getLoadErrorText({ status: 404 }), /quá hạn hoặc đã bị xóa/);
    assert.equal(getLoadErrorText({ status: 500 }), 'Không tải được học bổng.');
  });
});
