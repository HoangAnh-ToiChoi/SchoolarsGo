import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateGPA } from './validateGPA.js';

describe('validateGPA', () => {
  it('bỏ trống là hợp lệ (không bắt buộc)', () => {
    assert.equal(validateGPA(''), '');
    assert.equal(validateGPA(null), '');
    assert.equal(validateGPA(undefined), '');
  });

  it('số trong khoảng 0–4 là hợp lệ, kể cả chuỗi số và hai đầu mút', () => {
    assert.equal(validateGPA('3.2'), '');
    assert.equal(validateGPA(0), '');
    assert.equal(validateGPA(4), '');
  });

  it('không phải số hoặc ngoài khoảng thì báo lỗi', () => {
    assert.equal(validateGPA('abc'), 'GPA phải là số');
    assert.equal(validateGPA(4.5), 'GPA phải từ 0 đến 4.0');
    assert.equal(validateGPA(-1), 'GPA phải từ 0 đến 4.0');
  });
});
