import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildProfilePayload } from './buildProfilePayload.js';

describe('buildProfilePayload', () => {
  it('bỏ qua chuỗi rỗng ở gpa, birth_year, nationality, current_degree, target_degree', () => {
    const payload = buildProfilePayload({
      gpa: '',
      birth_year: '  ',
      nationality: '',
      current_degree: '',
      target_degree: '',
      major: 'Computer Science',
      experience: '',
    });

    assert.equal('gpa' in payload, false);
    assert.equal('birth_year' in payload, false);
    assert.equal('nationality' in payload, false);
    assert.equal('current_degree' in payload, false);
    assert.equal('target_degree' in payload, false);
    assert.equal(payload.major, 'Computer Science');
    assert.equal(payload.experience, '');
  });

  it('ép kiểu Number cho gpa, birth_year (giữ giá trị 0) và viết hoa nationality', () => {
    const payload = buildProfilePayload({
      gpa: '0',
      birth_year: '2002',
      nationality: ' vn ',
      current_degree: 'Bachelor',
      target_degree: 'Master',
    });

    assert.strictEqual(payload.gpa, 0);
    assert.strictEqual(payload.birth_year, 2002);
    assert.strictEqual(payload.nationality, 'VN');
    assert.strictEqual(payload.current_degree, 'Bachelor');
    assert.strictEqual(payload.target_degree, 'Master');
  });

  it('chuẩn hóa certificates: ép Number score (giữ 0), bỏ field score/level rỗng', () => {
    const payload = buildProfilePayload({
      certificates: [
        { type: ' IELTS ', score: '7.5', level: '' },
        { type: 'IELTS', score: 0, level: '   ' },
        { type: ' CEFR ', score: '', level: ' B2 ' },
      ],
    });

    assert.deepEqual(payload.certificates, [
      { type: 'IELTS', score: 7.5 },
      { type: 'IELTS', score: 0 },
      { type: 'CEFR', level: 'B2' },
    ]);
  });

  it('giữ mảng rỗng certificates để người dùng có thể xóa hết chứng chỉ', () => {
    assert.deepEqual(buildProfilePayload({ certificates: [] }), { certificates: [] });
    assert.deepEqual(buildProfilePayload(null), {});
    assert.deepEqual(buildProfilePayload({ gpa: undefined, major: null }), {});
  });
});
