'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { checkBasic: checkBeforeExtract, checkDetails: checkAfterExtract } = require('../../src/ingestion/filter');
const { NOW, rawPost } = require('./helpers');

const facts = (overrides = {}) => ({
  deadline: new Date('2027-01-15T23:59:59Z'),
  degree: 'Master',
  degreeKnown: true,
  country: 'Germany',
  ...overrides,
});

test('bài bình thường đạt luật giai đoạn 1', () => {
  assert.equal(checkBeforeExtract(rawPost()).ok, true);
});

test('R5: thiếu link hoặc link không phải https', () => {
  assert.equal(checkBeforeExtract(rawPost({ link: '' })).rule, 'R5');
  assert.equal(checkBeforeExtract(rawPost({ link: 'http://example.org/a' })).rule, 'R5');
});

test('R6: tiêu đề quá ngắn hoặc có từ rác', () => {
  assert.equal(checkBeforeExtract(rawPost({ title: 'Short' })).rule, 'R6');
  assert.equal(checkBeforeExtract(rawPost({ title: 'Best online casino scholarship offers' })).rule, 'R6');
});

test('R1: việc làm, hội nghị bị loại; chuyên mục việc làm cũng bị loại', () => {
  assert.equal(checkBeforeExtract(rawPost({ title: 'Programme Officer Job Vacancy in Hanoi' })).rule, 'R1');
  assert.equal(checkBeforeExtract(rawPost({ title: 'Annual Conference on Education 2027' })).rule, 'R1');
  assert.equal(checkBeforeExtract(rawPost({ categories: ['jobs'] })).rule, 'R1');
});

test('R1: tiêu đề có "scholarship" thì dù có "internship" vẫn được giữ', () => {
  assert.equal(checkBeforeExtract(rawPost({ title: 'Fully Funded Internship Scholarship in Japan' })).ok, true);
});

test('R2: hạn nộp đã qua bị loại, hạn còn thì đạt', () => {
  const expired = facts({ deadline: new Date('2026-09-15T23:59:59Z') });
  assert.equal(checkAfterExtract(rawPost(), expired, { now: NOW }).rule, 'R2');
  assert.equal(checkAfterExtract(rawPost(), facts(), { now: NOW }).ok, true);
});

test('R2: hạn là hôm nay (cuối ngày) vẫn còn hiệu lực', () => {
  const today = facts({ deadline: new Date('2026-11-08T23:59:59Z') });
  assert.equal(checkAfterExtract(rawPost(), today, { now: NOW }).ok, true);
});

test('R3: không rõ hạn và bài đăng hơn 12 tháng thì bị loại; bài mới thì giữ', () => {
  const old = rawPost({ publishedAt: new Date('2025-06-01T00:00:00Z') });
  assert.equal(checkAfterExtract(old, facts({ deadline: null }), { now: NOW }).rule, 'R3');
  assert.equal(checkAfterExtract(rawPost(), facts({ deadline: null }), { now: NOW }).ok, true);
});

test('R4: ghi rõ chỉ dành cho nhóm khác thì bị loại', () => {
  const cases = [
    'This scholarship is open only to citizens of the EU.',
    'Available to UK students only.',
    'Open to African students only.',
    'Only for Latin Americans.',
  ];
  for (const sentence of cases) {
    const result = checkAfterExtract(rawPost({ contentText: sentence }), facts(), { now: NOW });
    assert.equal(result.rule, 'R4', sentence);
  }
});

test('R4: nhắc đích danh Việt Nam thì không bị loại', () => {
  const post = rawPost({ contentText: 'African students only. Students from Vietnam may also apply.' });
  assert.equal(checkAfterExtract(post, facts(), { now: NOW }).ok, true);
});

test('R1: bài hướng dẫn, danh sách bị loại; tiêu đề bắt đầu bằng năm thì không', () => {
  const guides = [
    'How to Apply for the Swedish Institute Scholarship 2027',
    '8 Asian Countries With Low Tuition Fees for International Students',
    'Top 10 Fully Funded Scholarships in Europe',
  ];
  for (const title of guides) assert.equal(checkBeforeExtract(rawPost({ title })).rule, 'R1', title);
  assert.equal(checkBeforeExtract(rawPost({ title: '2027 Huazhong University CSC Scholarship for International Students' })).ok, true);
});

test('R1: tài trợ cho tổ chức, dự án, nghiên cứu bị loại; học bổng sinh viên có chữ "grants" thì giữ', () => {
  const funding = [
    'UNDP Ocean Innovation Challenge 2026: Apply for Up to $250,000',
    "Women's Economic Empowerment in Transport Research Grant 2026",
    'Resilience Fund for Women 2026 Grants: Apply for Up to $50,000',
    'Call for Proposals: Community Development Grants',
  ];
  for (const title of funding) assert.equal(checkBeforeExtract(rawPost({ title })).rule, 'R1', title);
  assert.equal(checkBeforeExtract(rawPost({ title: "UNIL Master's Grants in Switzerland for Foreign Students" })).ok, true);
});
