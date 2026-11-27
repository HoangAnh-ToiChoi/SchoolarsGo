import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toScholarshipPayload } from './toScholarshipPayload.js';

describe('toScholarshipPayload', () => {
  it('bỏ số tiền và hạn nộp khi để trống', () => {
    const payload = toScholarshipPayload({ title: 'A', amount: '', deadline: '' });
    assert.deepEqual(payload, { title: 'A' });
  });

  it('đổi số tiền sang số và gắn id khi sửa', () => {
    const payload = toScholarshipPayload({ title: 'A', amount: '1500', deadline: '2026-12-31' }, 7);
    assert.deepEqual(payload, { id: 7, title: 'A', amount: 1500, deadline: '2026-12-31' });
  });
});
