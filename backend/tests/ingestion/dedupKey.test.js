'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { dedupKey } = require('../../src/ingestion/toRow');

test('cùng học bổng, khác cách viết tiêu đề → cùng khoá', () => {
  const a = dedupKey('Swedish Institute Scholarship 2027 | Fully Funded');
  const b = dedupKey('Swedish Institute Scholarships 2026/2027');
  assert.equal(a, b);
  assert.equal(a, 'swedish-institute');
});

test('bỏ phần đuôi "- Apply by ..."', () => {
  assert.equal(
    dedupKey('Asia Foundation Development Fellows Program 2027 - Apply by December 1, 2026'),
    dedupKey('The Asia Foundation Development Fellows Programme')
  );
});

test('hai học bổng khác nhau thì khoá khác nhau', () => {
  assert.notEqual(dedupKey('Oxford Weidenfeld Scholarship'), dedupKey('Oxford Clarendon Scholarship'));
});

test('khoá không dài quá 200 ký tự', () => {
  assert.ok(dedupKey('word '.repeat(200)).length <= 200);
});

test('cleanTitle: bỏ đuôi quảng cáo sau dấu |', () => {
  const { cleanTitle } = require('../../src/ingestion/toRow');
  assert.equal(cleanTitle('MTCP Scholarship in Malaysia 2026 | Fully Funded | Study in Malaysia'), 'MTCP Scholarship in Malaysia 2026');
  assert.equal(cleanTitle('University of Southampton Scholarships 2027 | UK'), 'University of Southampton Scholarships 2027 | UK');
  assert.equal(cleanTitle('Plain Title Scholarship'), 'Plain Title Scholarship');
});
