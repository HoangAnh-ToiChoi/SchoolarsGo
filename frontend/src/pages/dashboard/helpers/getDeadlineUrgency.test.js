import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDeadlineUrgency } from './getDeadlineUrgency.js';

describe('getDeadlineUrgency', () => {
  it('chia theo mốc 7 và 14 ngày (tính cả mốc)', () => {
    assert.equal(getDeadlineUrgency(7), 'urgent');
    assert.equal(getDeadlineUrgency(8), 'soon');
    assert.equal(getDeadlineUrgency(14), 'soon');
    assert.equal(getDeadlineUrgency(15), 'normal');
  });
});
