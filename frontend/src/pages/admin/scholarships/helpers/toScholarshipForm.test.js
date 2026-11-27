import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toScholarshipForm } from './toScholarshipForm.js';

describe('toScholarshipForm', () => {
  it('thêm mới thì mọi ô trống', () => {
    const form = toScholarshipForm(null);
    assert.equal(form.title, '');
    assert.equal(form.amount, '');
    assert.equal(Object.keys(form).length, 10);
  });

  it('sửa thì lấy dữ liệu học bổng, cắt giờ khỏi hạn nộp, giữ số tiền 0', () => {
    const form = toScholarshipForm({ id: 1, title: 'A', amount: 0, deadline: '2026-12-31T00:00:00Z', provider: null });
    assert.equal(form.title, 'A');
    assert.equal(form.amount, 0);
    assert.equal(form.deadline, '2026-12-31');
    assert.equal(form.provider, '');
  });
});
