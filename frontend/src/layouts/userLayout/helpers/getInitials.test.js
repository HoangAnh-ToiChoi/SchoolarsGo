import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getInitials } from './getInitials.js';

describe('getInitials', () => {
  it('lấy chữ đầu của họ và tên cuối, viết hoa', () => {
    assert.equal(getInitials('Trần Hoàng Anh'), 'TA');
    assert.equal(getInitials('  nguyễn   văn  bình '), 'NB');
  });

  it('tên một chữ chỉ lấy một ký tự', () => {
    assert.equal(getInitials('an'), 'A');
  });

  it('tên rỗng hoặc thiếu trả "?"', () => {
    assert.equal(getInitials(''), '?');
    assert.equal(getInitials('   '), '?');
    assert.equal(getInitials(), '?');
  });
});
