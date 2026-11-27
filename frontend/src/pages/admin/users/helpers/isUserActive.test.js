import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isUserActive } from './isUserActive.js';

describe('isUserActive', () => {
  it('chỉ false mới là bị khóa', () => {
    assert.equal(isUserActive({ is_active: false }), false);
    assert.equal(isUserActive({ is_active: true }), true);
  });

  it('thiếu trường hoặc chưa chọn người dùng thì coi là đang hoạt động', () => {
    assert.equal(isUserActive({}), true);
    assert.equal(isUserActive(null), true);
  });
});
