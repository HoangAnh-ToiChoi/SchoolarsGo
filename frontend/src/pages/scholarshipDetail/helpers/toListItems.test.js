import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toListItems } from './toListItems.js';

describe('toListItems', () => {
  it('tách text mỗi ý một dòng, bỏ ký hiệu đầu dòng và dòng trống', () => {
    assert.deepEqual(toListItems('- Học phí\r\n• Sinh hoạt phí\n\n1. Vé máy bay\n2) Bảo hiểm'), [
      'Học phí',
      'Sinh hoạt phí',
      'Vé máy bay',
      'Bảo hiểm',
    ]);
  });

  it('mảng thì làm sạch từng phần tử', () => {
    assert.deepEqual(toListItems([' a ', '', 3]), ['a', '3']);
  });

  it('kiểu khác trả mảng rỗng', () => {
    assert.deepEqual(toListItems(null), []);
    assert.deepEqual(toListItems({}), []);
  });
});
