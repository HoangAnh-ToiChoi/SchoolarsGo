import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toScholarshipPayload } from './toScholarshipPayload.js';

const INITIAL = { title: 'A', degree: 'PhD', amount: 1000, deadline: '2026-12-31', requirements: 'IELTS', language: '' };

describe('toScholarshipPayload', () => {
  it('thêm mới: bỏ ô trống, đổi số tiền sang số', () => {
    const payload = toScholarshipPayload({ title: 'A', amount: '1500', deadline: '', language: '' });
    assert.deepEqual(payload, { title: 'A', amount: 1500 });
  });

  it('sửa: chỉ gửi trường đã đổi, kèm id', () => {
    const payload = toScholarshipPayload({ ...INITIAL, title: 'B', amount: '1000' }, { id: 7, initial: INITIAL });
    assert.deepEqual(payload, { id: 7, title: 'B' });
  });

  it('sửa: không đổi gì thì chỉ còn id', () => {
    assert.deepEqual(toScholarshipPayload({ ...INITIAL }, { id: 7, initial: INITIAL }), { id: 7 });
  });

  it('sửa: xóa số tiền / hạn nộp gửi null, xóa chữ gửi chuỗi rỗng, ô bắt buộc để trống thì không gửi', () => {
    const form = { ...INITIAL, amount: '', deadline: '', requirements: '', degree: '' };
    const payload = toScholarshipPayload(form, { id: 7, initial: INITIAL });
    assert.deepEqual(payload, { id: 7, amount: null, deadline: null, requirements: '' });
  });
});
