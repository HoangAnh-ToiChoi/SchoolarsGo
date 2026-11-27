import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_SIGNAL_FIELDS } from '../constants';
import { calculateCompletionScore } from './calculateCompletionScore.js';

const TOTAL = PROFILE_SIGNAL_FIELDS.length + 1; // + 1 điểm cho việc có tài liệu
const fullProfile = Object.fromEntries(PROFILE_SIGNAL_FIELDS.map(({ key }) => [key, key === 'gpa' ? 3.5 : 'x']));

describe('calculateCompletionScore', () => {
  it('hồ sơ đầy đủ và có tài liệu được 100%', () => {
    const res = calculateCompletionScore(fullProfile, [{ id: 1 }]);
    assert.equal(Number(res), 100);
    assert.equal(res.percentage, 100);
    assert.equal(res.score, TOTAL);
    assert.deepEqual(res.missingLabels, []);
  });

  it('hồ sơ rỗng được 0% và liệt kê đủ mục còn thiếu, kể cả tài liệu', () => {
    const res = calculateCompletionScore(null, []);
    assert.equal(res.percentage, 0);
    assert.equal(res.total, TOTAL);
    assert.equal(res.missingLabels.length, TOTAL);
    assert.equal(res.missingLabels.at(-1), 'tài liệu hồ sơ');
  });

  it('chuỗi chỉ có khoảng trắng tính là chưa điền; GPA 0 vẫn tính là đã điền', () => {
    const res = calculateCompletionScore({ ...fullProfile, bio: '   ', gpa: 0 }, [{ id: 1 }]);
    assert.equal(res.score, TOTAL - 1);
    assert.equal(res.missingLabels.length, 1);
  });

  it('tài liệu nhận cả dạng { data: [] } và dạng số đếm', () => {
    assert.equal(calculateCompletionScore(fullProfile, { data: [{ id: 1 }] }).percentage, 100);
    assert.equal(calculateCompletionScore(fullProfile, 2).percentage, 100);
    assert.equal(calculateCompletionScore(fullProfile, undefined).score, TOTAL - 1);
  });
});
