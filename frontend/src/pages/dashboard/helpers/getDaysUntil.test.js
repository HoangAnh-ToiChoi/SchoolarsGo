import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDaysUntil } from './getDaysUntil.js';

describe('getDaysUntil', () => {
  const now = new Date('2026-11-28T12:00:00Z');

  it('làm tròn lên phần ngày lẻ', () => {
    assert.equal(getDaysUntil('2026-11-29T00:00:00Z', now), 1);
    assert.equal(getDaysUntil('2026-12-05T12:00:00Z', now), 7);
  });

  it('đã qua hạn thì ra số âm hoặc 0', () => {
    assert.equal(getDaysUntil('2026-11-26T12:00:00Z', now), -2);
  });
});
