import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getSaveLabel } from './getSaveLabel.js';

describe('getSaveLabel', () => {
  it('đang lưu thì báo đang lưu', () => {
    assert.equal(getSaveLabel(true, true), 'Đang lưu...');
  });

  it('chữ nút theo chế độ sửa / thêm', () => {
    assert.equal(getSaveLabel(false, true), 'Lưu thay đổi');
    assert.equal(getSaveLabel(false, false), 'Thêm học bổng');
  });
});
