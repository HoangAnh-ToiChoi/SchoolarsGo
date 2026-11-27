import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getProfileCompletion } from './getProfileCompletion.js';

describe('getProfileCompletion', () => {
  it('chưa có hồ sơ thì 0%', () => {
    assert.equal(getProfileCompletion(undefined), 0);
  });

  it('đếm trường có giá trị trên 6 trường, làm tròn', () => {
    assert.equal(getProfileCompletion({ full_name: 'An', phone: '09', gpa: 3.2 }), 50);
    assert.equal(getProfileCompletion({ full_name: 'An', gpa: '' }), 17);
  });
});
