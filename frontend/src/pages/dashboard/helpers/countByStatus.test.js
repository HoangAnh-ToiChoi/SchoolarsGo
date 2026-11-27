import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { countByStatus } from './countByStatus.js';

describe('countByStatus', () => {
  it('đếm số đơn mỗi trạng thái', () => {
    const counts = countByStatus([{ status: 'draft' }, { status: 'submitted' }, { status: 'draft' }]);
    assert.deepEqual(counts, { draft: 2, submitted: 1 });
  });

  it('không có đơn thì rỗng', () => {
    assert.deepEqual(countByStatus([]), {});
  });
});
