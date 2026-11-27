import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getStatusLabel } from './getStatusLabel.js';

describe('getStatusLabel', () => {
  it('trả nhãn tiếng Việt của trạng thái đơn', () => {
    assert.equal(getStatusLabel('submitted'), 'Đã nộp');
    assert.equal(getStatusLabel('under_review'), 'Đang xét duyệt');
  });

  it('trạng thái lạ trả undefined', () => {
    assert.equal(getStatusLabel('unknown'), undefined);
  });
});
