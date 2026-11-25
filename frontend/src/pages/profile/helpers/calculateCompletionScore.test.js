import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCompletionScore } from './calculateCompletionScore.js';

describe('calculateCompletionScore', () => {
  it('trả về 0% khi hồ sơ và tài liệu đều trống', () => {
    const res = calculateCompletionScore({}, []);
    assert.equal(Number(res), 0);
    assert.equal(res.score, 0);
    assert.equal(res.total, 14);
    assert.equal(res.missingLabels.length, 14);
  });

  it('không tính certificates khi là mảng rỗng hoặc chỉ chứa dòng trống', () => {
    const emptyArr = calculateCompletionScore({ certificates: [] }, 0);
    assert.equal(emptyArr.score, 0);

    const blankRow = calculateCompletionScore({ certificates: [{ type: '   ', score: '' }] }, 0);
    assert.equal(blankRow.score, 0);
    assert.ok(blankRow.missingLabels.includes('Chứng chỉ'));
  });

  it('tính đúng khi có certificates hợp lệ và gpa bằng 0', () => {
    const res = calculateCompletionScore(
      {
        gpa: 0,
        certificates: [{ type: 'IELTS', score: 7.5 }],
      },
      0,
    );
    assert.equal(res.score, 2);
    assert.equal(res.missingLabels.includes('Chứng chỉ'), false);
    assert.equal(res.missingLabels.includes('GPA (thang 4.0)'), false);
  });

  it('đạt 100% khi đủ cả 13 trường hồ sơ (gồm 6 trường mới) và có tài liệu', () => {
    const fullProfile = {
      current_degree: 'Bachelor',
      major: 'Computer Science',
      nationality: 'VN',
      birth_year: 2002,
      gpa: 3.8,
      english_level: 'IELTS 7.5',
      experience: 'Thực tập 1 năm',
      certificates: [{ type: 'IELTS', score: 7.5 }],
      target_country: 'UK',
      target_degree: 'Master',
      target_intake: 'Fall 2027',
      target_major: 'Artificial Intelligence',
      bio: 'Mục tiêu nghiên cứu AI',
    };
    const res = calculateCompletionScore(fullProfile, [{ id: 'doc1' }]);
    assert.equal(Number(res), 100);
    assert.equal(res.score, 14);
    assert.equal(res.total, 14);
    assert.deepEqual(res.missingLabels, []);
  });
});
