import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getUpcomingDeadlines } from './getUpcomingDeadlines.js';

describe('getUpcomingDeadlines', () => {
  const now = new Date('2026-11-28T00:00:00Z');

  it('chỉ giữ hạn trong 30 ngày tới, sắp theo hạn gần nhất', () => {
    const items = [
      { id: 1, deadline: '2026-12-20' },
      { id: 2, deadline: '2026-11-20' },
      { id: 3, deadline: '2026-12-01' },
      { id: 4, deadline: '2027-02-01' },
      { id: 5, deadline: null },
    ];
    assert.deepEqual(getUpcomingDeadlines(items, now).map((s) => s.id), [3, 1]);
  });

  it('tối đa 5 học bổng', () => {
    const items = Array.from({ length: 8 }, (_, i) => ({ id: i, deadline: `2026-12-0${i + 1}` }));
    assert.equal(getUpcomingDeadlines(items, now).length, 5);
  });
});
