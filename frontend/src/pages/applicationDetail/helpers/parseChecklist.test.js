import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseChecklist } from './parseChecklist.js';

describe('parseChecklist', () => {
  it('mảng giữ nguyên', () => {
    const list = [{ item: 'CV', done: true }];
    assert.equal(parseChecklist(list), list);
  });

  it('chuỗi JSON mảng (dữ liệu cũ) được đọc', () => {
    assert.deepEqual(parseChecklist('[{"item":"CV","done":false}]'), [{ item: 'CV', done: false }]);
  });

  it('JSON hỏng, JSON không phải mảng, null đều trả mảng rỗng', () => {
    assert.deepEqual(parseChecklist('{not json'), []);
    assert.deepEqual(parseChecklist('{"item":"CV"}'), []);
    assert.deepEqual(parseChecklist(null), []);
    assert.deepEqual(parseChecklist(42), []);
  });
});
