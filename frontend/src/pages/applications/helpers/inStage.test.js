import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { inStage } from './inStage.js';

describe('inStage', () => {
  it('chặng không giới hạn trạng thái (tab "Tất cả") nhận mọi đơn', () => {
    assert.equal(inStage({ key: 'all' }, { status: 'withdrawn' }), true);
  });

  it('đơn thuộc chặng khi trạng thái nằm trong danh sách', () => {
    const stage = { statuses: ['submitted', 'under_review'] };
    assert.equal(inStage(stage, { status: 'under_review' }), true);
    assert.equal(inStage(stage, { status: 'draft' }), false);
  });
});
