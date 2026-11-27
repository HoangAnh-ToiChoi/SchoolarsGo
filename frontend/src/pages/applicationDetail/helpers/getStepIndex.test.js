import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { STEPS } from '../constants';
import { getStepIndex } from './getStepIndex.js';

describe('getStepIndex', () => {
  it('trạng thái thường trả đúng vị trí chặng', () => {
    assert.equal(getStepIndex('draft'), 0);
    assert.equal(getStepIndex('interview'), 3);
  });

  it('được nhận hay bị từ chối đều là chặng cuối "Kết quả"', () => {
    assert.equal(getStepIndex('accepted'), STEPS.length - 1);
    assert.equal(getStepIndex('rejected'), STEPS.length - 1);
  });

  it('trạng thái lạ trả -1', () => {
    assert.equal(getStepIndex('withdrawn'), -1);
    assert.equal(getStepIndex(undefined), -1);
  });
});
