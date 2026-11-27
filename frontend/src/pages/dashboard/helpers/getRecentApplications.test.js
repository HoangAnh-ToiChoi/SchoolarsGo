import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getRecentApplications } from './getRecentApplications.js';

describe('getRecentApplications', () => {
  it('sắp mới nhất trước, giữ nguyên mảng gốc', () => {
    const apps = [
      { id: 'a', created_at: '2026-11-01' },
      { id: 'b', created_at: '2026-11-20' },
    ];
    assert.deepEqual(getRecentApplications(apps).map((a) => a.id), ['b', 'a']);
    assert.equal(apps[0].id, 'a');
  });

  it('tối đa 5 đơn', () => {
    const apps = Array.from({ length: 7 }, (_, i) => ({ id: i, created_at: `2026-11-0${i + 1}` }));
    assert.equal(getRecentApplications(apps).length, 5);
  });
});
