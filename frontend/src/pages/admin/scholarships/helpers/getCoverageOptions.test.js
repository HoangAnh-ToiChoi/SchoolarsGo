import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCoverageOptions } from './getCoverageOptions.js';

describe('getCoverageOptions', () => {
  it('giá trị trống hoặc có sẵn thì giữ danh sách', () => {
    assert.equal(getCoverageOptions('').length, 2);
    assert.equal(getCoverageOptions('Full').length, 2);
  });

  it('chữ tự do từ bài kéo về được thêm vào cuối', () => {
    assert.deepEqual(getCoverageOptions('Tuition only').at(-1), { value: 'Tuition only', label: 'Tuition only' });
  });
});
