import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { addNewScholarshipCount, formatNewScholarshipCount } from './addNewScholarshipCount.js';

describe('addNewScholarshipCount', () => {
  it('cộng dồn số nguyên dương', () => {
    assert.equal(addNewScholarshipCount(0, { count: 3 }), 3);
    assert.equal(addNewScholarshipCount(3, { count: 2 }), 5);
  });

  it('bỏ qua tín hiệu giả hoặc hỏng (kênh công khai)', () => {
    for (const payload of [{ count: '<b>x' }, { count: -5 }, { count: 1.5 }, {}, null]) {
      assert.equal(addNewScholarshipCount(4, payload), 4);
    }
  });

  it('chặn trần 99 và hiện "99+"', () => {
    assert.equal(addNewScholarshipCount(10, { count: 999999 }), 99);
    assert.equal(formatNewScholarshipCount(99), '99+');
    assert.equal(formatNewScholarshipCount(7), '7');
  });
});
