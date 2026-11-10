'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { extractFacts } = require('../../src/ingestion/shared/extract');
const { score } = require('../../src/ingestion/shared/filters');
const { NOW, rawPost } = require('./helpers');

test('trích xuất: hạn, nước, bậc học, đơn vị cấp, GPA, IELTS', () => {
  const raw = rawPost({
    title: 'University of Oxford Scholarships',
    contentText:
      'Masters Degree   Deadline: 20 December 2026\nStudy in:  UK\nHost Institution(s):\nUniversity of Oxford, United Kingdom\nMinimum GPA of 3.2 and IELTS 7.0 required. Fully funded.',
  });
  const facts = extractFacts(raw, { now: NOW });
  assert.equal(facts.deadline.toISOString().slice(0, 10), '2026-12-20');
  assert.equal(facts.country, 'United Kingdom');
  assert.equal(facts.degree, 'Master');
  assert.equal(facts.provider, 'University of Oxford');
  assert.equal(facts.minGpa, 3.2);
  assert.equal(facts.minIelts, 7);
  assert.equal(facts.coverage, 'Full');
});

test('trích xuất: bậc học ưu tiên gợi ý từ chuyên mục của nguồn', () => {
  const raw = rawPost({ signals: ['degree:PhD'], contentText: 'Master students may apply.' });
  assert.equal(extractFacts(raw, { now: NOW }).degree, 'PhD');
});

test('trích xuất: nhiều bậc học khác nhau → Any và degreeKnown=false', () => {
  const facts = extractFacts(rawPost({ signals: ['degree:Master', 'degree:PhD'] }), { now: NOW });
  assert.equal(facts.degree, 'Any');
  assert.equal(facts.degreeKnown, false);
});

test('trích xuất: không đoán nước khi bài không nói', () => {
  const raw = rawPost({ contentText: 'A great opportunity.', title: 'Great Opportunity For Students' });
  assert.equal(extractFacts(raw, { now: NOW }).country, null);
});

test('GPA ngoài thang 4 thì bỏ', () => {
  const facts = extractFacts(rawPost({ contentText: 'GPA 8.5 out of 10' }), { now: NOW });
  assert.equal(facts.minGpa, null);
});

const factsOf = (overrides = {}) => ({
  deadline: new Date('2027-03-01T23:59:59Z'),
  degreeKnown: true,
  country: 'Japan',
  ...overrides,
});
const scoreOf = (contentText, facts = factsOf(), extra = {}) =>
  score(rawPost({ contentText, ...extra }), facts, { now: NOW });

test('điểm: nhắc Việt Nam cao hơn bài chung chung', () => {
  const vn = scoreOf('Open to students from Vietnam.').score;
  const generic = scoreOf('Open to students.').score;
  assert.ok(vn > generic, `${vn} phải lớn hơn ${generic}`);
});

test('điểm: Đông Nam Á > châu Á chung > mọi quốc tịch', () => {
  const sea = scoreOf('Southeast Asia applicants').score;
  const asia = scoreOf('Asian students').score;
  const intl = scoreOf('Open to international students').score;
  assert.ok(sea > asia && asia > intl, `${sea} > ${asia} > ${intl}`);
});

test('điểm: chuyên mục chỉ gồm vùng khác bị trừ điểm; không rõ hạn bị trừ điểm', () => {
  const africa = scoreOf('x', factsOf(), { signals: ['region:africa'] });
  assert.ok(africa.reasons.some((r) => r.includes('vùng khác')));
  const noDeadline = scoreOf('x', factsOf({ deadline: null }));
  assert.ok(noDeadline.reasons.some((r) => r.includes('chưa rõ hạn')));
});

test('điểm luôn nằm trong 0..100', () => {
  const s = scoreOf('Vietnam ASEAN Southeast Asia Asian developing countries international students').score;
  assert.ok(s >= 0 && s <= 100);
});

test('nước đến học: nhãn trong bài thắng gợi ý chuyên mục (chuyên mục có thể là vùng đủ điều kiện)', () => {
  const raw = rawPost({
    title: 'NTU Business PhD Scholarship 2027',
    signals: ['country:United States'],
    contentText: 'Location of the Opportunity\nSingapore\nDeadline: 31 January 2027',
  });
  assert.equal(extractFacts(raw, { now: NOW }).country, 'Singapore');
});

test('nước đến học: tiêu đề thắng chuyên mục; không có gì thì dùng chuyên mục', () => {
  const fromTitle = rawPost({ title: 'Great Scholarship in Singapore for Students', signals: ['country:Japan'], contentText: 'x' });
  assert.equal(extractFacts(fromTitle, { now: NOW }).country, 'Singapore');
  const fromSignal = rawPost({ title: 'Great Scholarship for Students', signals: ['country:Japan'], contentText: 'x' });
  assert.equal(extractFacts(fromSignal, { now: NOW }).country, 'Japan');
});
