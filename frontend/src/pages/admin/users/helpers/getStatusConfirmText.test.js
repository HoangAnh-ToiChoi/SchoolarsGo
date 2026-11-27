import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getStatusConfirmText } from './getStatusConfirmText.js';

describe('getStatusConfirmText', () => {
  it('tài khoản đang hoạt động thì hỏi khóa, ưu tiên tên', () => {
    const text = getStatusConfirmText({ is_active: true, full_name: 'An', email: 'an@x.vn' });
    assert.equal(text.title, 'Khóa tài khoản');
    assert.equal(text.description, 'Tài khoản "An" sẽ bị khóa và không thể đăng nhập.');
    assert.equal(text.confirmClass, 'btnDanger');
  });

  it('tài khoản bị khóa thì hỏi mở, không có tên thì dùng email', () => {
    const text = getStatusConfirmText({ is_active: false, email: 'an@x.vn' });
    assert.equal(text.title, 'Mở tài khoản');
    assert.equal(text.description, 'Tài khoản "an@x.vn" sẽ được mở lại.');
    assert.equal(text.confirmLabel, 'Mở tài khoản');
  });
});
