import test from 'node:test';
import assert from 'node:assert/strict';

const { default: recommendMatchService } = await import('~/services/recommendMatch.service.js');

const PROFILE = { gpa: 3.6, english_level: 'IELTS 7.0', target_country: 'Japan', target_degree: 'Master', target_major: 'Computer Science', nationality: 'VN', birth_year: 2000 };
const SCHOLARSHIP = { country: 'Japan', degree: 'Master', field_of_study: 'Computer Science', min_gpa: 3, min_ielts: 6.5, eligible_nationalities: null, max_age: null };

const blockersOf = (profile, scholarship) => recommendMatchService.ruleFit({ ...PROFILE, ...profile }, { ...SCHOLARSHIP, ...scholarship }).blockers;

test('hồ sơ khớp đủ điều kiện → không có blocker, có lý do', () => {
  const fit = recommendMatchService.ruleFit(PROFILE, SCHOLARSHIP);
  assert.deepEqual(fit.blockers, []);
  assert.ok(fit.reasons.some((r) => r.includes('Bậc học Master')));
  assert.ok(fit.score > 0.5);
});

test('R20 bậc học: học bổng chỉ PhD chặn người muốn học Bachelor; "Any" ở một phía thì không chặn', () => {
  assert.deepEqual(blockersOf({ target_degree: 'Bachelor' }, { degree: 'PhD' }), ['Học bổng dành cho bậc PhD']);
  assert.deepEqual(blockersOf({ target_degree: 'Bachelor' }, { degree: 'Any' }), []);
  assert.deepEqual(blockersOf({ target_degree: 'Any' }, { degree: 'PhD' }), []);
  assert.deepEqual(blockersOf({ target_degree: null }, { degree: 'PhD' }), []);
});

test('R20 quốc tịch: chỉ nhận JP thì chặn hồ sơ VN; danh sách rỗng / chưa khai quốc tịch thì không chặn', () => {
  assert.equal(blockersOf({}, { eligible_nationalities: ['JP'] }).length, 1);
  assert.deepEqual(blockersOf({}, { eligible_nationalities: ['JP', 'VN'] }), []);
  assert.deepEqual(blockersOf({}, { eligible_nationalities: [] }), []);
  assert.deepEqual(blockersOf({ nationality: null }, { eligible_nationalities: ['JP'] }), []);
  assert.deepEqual(blockersOf({ nationality: 'VN' }, { eligible_nationalities: ['vn'] }), []);
});

test('R20 tuổi: quá tuổi tối đa thì chặn; chưa khai năm sinh thì không chặn', () => {
  const thisYear = Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()).slice(0, 4));
  assert.equal(blockersOf({ birth_year: thisYear - 40 }, { max_age: 35 }).length, 1);
  assert.deepEqual(blockersOf({ birth_year: thisYear - 30 }, { max_age: 35 }), []);
  assert.deepEqual(blockersOf({ birth_year: null }, { max_age: 35 }), []);
});

test('R20 tuổi chỉ có năm sinh: chưa chắc quá tuổi thì không chặn', () => {
  const thisYear = Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()).slice(0, 4));
  // Sinh năm thisYear-36: có thể mới 35 (chưa tới sinh nhật) → không chặn với max 35
  assert.deepEqual(blockersOf({ birth_year: thisYear - 36 }, { max_age: 35 }), []);
  // Sinh năm thisYear-37: ít nhất 36 tuổi → chặn
  assert.equal(blockersOf({ birth_year: thisYear - 37 }, { max_age: 35 }).length, 1);
});

test('GPA / IELTS thấp hơn yêu cầu vẫn là blocker như trước', () => {
  assert.equal(blockersOf({ gpa: 2.5 }, {}).length, 1);
  assert.equal(blockersOf({ english_level: 'IELTS 5.5' }, {}).length, 1);
});

test('similarity: nhóm từ cùng nghĩa giúp "AI" khớp "Computer Science"', () => {
  assert.ok(recommendMatchService.similarity('AI', 'Computer Science') > 0);
  assert.equal(recommendMatchService.similarity('', 'Computer Science'), 0);
});
