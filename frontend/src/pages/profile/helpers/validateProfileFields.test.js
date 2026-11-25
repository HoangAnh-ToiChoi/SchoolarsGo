import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateBirthYear,
  validateNationality,
  validateMaxLength,
  validateCurrentDegree,
  validateSingleCertificate,
  validateCertificates,
  validateSingleField,
  mergeCertificateRowError,
  validateProfileForm,
  validateProfileFields,
} from './validateProfileFields.js';

describe('validateBirthYear', () => {
  const currentYear = 2026;

  it('chấp nhận giá trị rỗng hoặc trong khoảng [1940, currentYear]', () => {
    assert.equal(validateBirthYear('', currentYear), '');
    assert.equal(validateBirthYear(null, currentYear), '');
    assert.equal(validateBirthYear(undefined, currentYear), '');
    assert.equal(validateBirthYear(1940, currentYear), '');
    assert.equal(validateBirthYear('2002', currentYear), '');
    assert.equal(validateBirthYear(2026, currentYear), '');
  });

  it('báo lỗi khi ngoài khoảng hoặc không phải số nguyên', () => {
    assert.match(validateBirthYear(1939, currentYear), /1940/);
    assert.match(validateBirthYear(2027, currentYear), /2026/);
    assert.match(validateBirthYear(2000.5, currentYear), /nguyên/);
    assert.match(validateBirthYear('2000.5', currentYear), /nguyên/);
    assert.match(validateBirthYear('abc', currentYear), /nguyên/);
  });
});

describe('validateNationality', () => {
  it('chấp nhận rỗng hoặc đúng 2 chữ cái ASCII (kể cả chữ thường)', () => {
    assert.equal(validateNationality(''), '');
    assert.equal(validateNationality(undefined), '');
    assert.equal(validateNationality('VN'), '');
    assert.equal(validateNationality('vn'), '');
    assert.equal(validateNationality(' jp '), '');
  });

  it('báo lỗi khi không khớp 2 chữ cái ASCII', () => {
    assert.ok(validateNationality('Việt Nam'));
    assert.ok(validateNationality('12'));
    assert.ok(validateNationality('V'));
    assert.ok(validateNationality('VNM'));
    assert.ok(validateNationality('V1'));
  });
});

describe('validateMaxLength & validateCurrentDegree', () => {
  it('kiểm tra giới hạn ký tự cho major và experience', () => {
    assert.equal(validateMaxLength('', 100, 'Ngành học'), '');
    assert.equal(validateMaxLength('a'.repeat(100), 100, 'Ngành học'), '');
    assert.match(validateMaxLength('a'.repeat(101), 100, 'Ngành học'), /100/);
    assert.equal(validateMaxLength('a'.repeat(2000), 2000, 'Kinh nghiệm'), '');
    assert.match(validateMaxLength('a'.repeat(2001), 2000, 'Kinh nghiệm'), /2000/);
  });

  it('chấp nhận Bachelor, Master, PhD và từ chối Any hoặc giá trị lạ', () => {
    assert.equal(validateCurrentDegree(''), '');
    assert.equal(validateCurrentDegree('Bachelor'), '');
    assert.equal(validateCurrentDegree('Master'), '');
    assert.equal(validateCurrentDegree('PhD'), '');
    assert.ok(validateCurrentDegree('Any'));
    assert.ok(validateCurrentDegree('HighSchool'));
  });
});

describe('validateCertificates', () => {
  it('chấp nhận rỗng, null, undefined', () => {
    assert.equal(validateCertificates(undefined).hasError, false);
    assert.equal(validateCertificates(null).hasError, false);
    assert.equal(validateCertificates([]).hasError, false);
  });

  it('bắt lỗi khi vượt quá 10 chứng chỉ', () => {
    const list = Array.from({ length: 11 }, () => ({ type: 'CEFR', level: 'B2' }));
    const result = validateCertificates(list);
    assert.equal(result.hasError, true);
    assert.match(result.listError, /10/);
  });

  it('kiểm tra chặt quy tắc IELTS (bắt buộc score 0..9, kể cả 0)', () => {
    assert.equal(validateCertificates([{ type: 'ielts', score: 0 }]).hasError, false);
    assert.equal(validateCertificates([{ type: 'IELTS', score: 9 }]).hasError, false);

    const missingScore = validateCertificates([{ type: 'IELTS', score: '' }]);
    assert.equal(missingScore.hasError, true);
    assert.match(missingScore.itemErrors[0].score, /IELTS/);

    const overScore = validateCertificates([{ type: 'IELTS', score: 9.5 }]);
    assert.equal(overScore.hasError, true);
    assert.match(overScore.itemErrors[0].score, /9/);

    const blurTypeOnly = validateSingleCertificate({ type: 'IELTS', score: '' }, { requirePresence: false });
    assert.equal(blurTypeOnly.score, undefined);
  });

  it('kiểm tra chứng chỉ khác (score 0..120 hoặc level 1..20)', () => {
    assert.equal(validateCertificates([{ type: 'TOEFL', score: 120 }]).hasError, false);
    assert.equal(validateCertificates([{ type: 'TOEFL', score: 0 }]).hasError, false);
    assert.equal(validateCertificates([{ type: 'CEFR', level: 'B2' }]).hasError, false);

    const noScoreNoLevel = validateCertificates([{ type: 'JLPT' }]);
    assert.equal(noScoreNoLevel.hasError, true);
    assert.ok(noScoreNoLevel.itemErrors[0].row);

    const tooHighScore = validateCertificates([{ type: 'TOEFL', score: 121 }]);
    assert.equal(tooHighScore.hasError, true);
    assert.match(tooHighScore.itemErrors[0].score, /120/);

    const emptyType = validateCertificates([{ type: '   ', level: 'N2' }]);
    assert.equal(emptyType.hasError, true);
    assert.ok(emptyType.itemErrors[0].type);

    const longLevel = validateCertificates([{ type: 'CEFR', level: 'x'.repeat(21) }]);
    assert.equal(longLevel.hasError, true);
    assert.match(longLevel.itemErrors[0].level, /20/);
  });
});

describe('validateProfileForm & validateSingleField', () => {
  it('trả về không lỗi với dữ liệu hợp lệ đầy đủ 6 trường mới', () => {
    const result = validateProfileForm(
      {
        current_degree: 'Bachelor',
        major: 'Computer Science',
        nationality: 'vn',
        birth_year: 2002,
        experience: '2 năm làm Frontend Developer',
        gpa: 3.6,
        certificates: [
          { type: 'IELTS', score: 7.5 },
          { type: 'JLPT', level: 'N2' },
        ],
      },
      2026,
    );
    assert.equal(result.hasError, false);
    assert.deepEqual(result.errors, {});
  });

  it('gom đầy đủ lỗi khi nhiều trường sai cùng lúc và xuất alias validateProfileFields', () => {
    const result = validateProfileFields(
      {
        current_degree: 'Any',
        major: 'm'.repeat(101),
        nationality: 'Vietnam',
        birth_year: 1900,
        experience: 'e'.repeat(2001),
        gpa: 4.5,
        certificates: [{ type: 'IELTS', score: 10 }],
      },
      2026,
    );
    assert.equal(result.hasError, true);
    assert.ok(result.errors.current_degree);
    assert.ok(result.errors.major);
    assert.ok(result.errors.nationality);
    assert.ok(result.errors.birth_year);
    assert.ok(result.errors.experience);
    assert.ok(result.errors.gpa);
    assert.ok(result.errors.certificates.itemErrors[0].score);
    assert.ok(validateSingleField('nationality', '12', 2026));
    assert.equal(validateSingleField('unknown', 'abc', 2026), '');

    const merged = mergeCertificateRowError(null, 0, { score: 'Lỗi điểm' }, 1);
    assert.equal(merged.itemErrors[0].score, 'Lỗi điểm');
    assert.equal(mergeCertificateRowError(merged, 0, {}, 1), null);
  });
});
