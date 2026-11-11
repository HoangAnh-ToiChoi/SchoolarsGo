'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseDeadline } = require('../../src/ingestion/extract');
const { NOW } = require('./helpers');

const iso = (d) => (d ? d.toISOString().slice(0, 10) : null);
const parse = (text) => iso(parseDeadline(text, { now: NOW }));

test('đọc các kiểu viết ngày thường gặp', () => {
  assert.equal(parse('Application Deadline: 15 January 2027'), '2027-01-15');
  assert.equal(parse('Apply by December 1, 2026'), '2026-12-01');
  assert.equal(parse('Applications close on 3rd March 2027.'), '2027-03-03');
  assert.equal(parse('Deadline: 2027-02-28'), '2027-02-28');
});

test('chỉ có tháng và năm thì lấy cuối tháng', () => {
  assert.equal(parse('Deadline: Dec 2026'), '2026-12-31');
  assert.equal(parse('Deadline: February 2027'), '2027-02-28');
});

test('nhiều ngày: chọn ngày gần nhất còn hạn', () => {
  assert.equal(parse('Deadline: Dec 2026/Jan 2027 (annual)'), '2026-12-31');
  assert.equal(parse('Deadline: 1 September 2026. Next deadline: 20 January 2027.'), '2027-01-20');
});

test('toàn ngày đã qua: trả ngày muộn nhất để luật R2 loại', () => {
  assert.equal(parse('Deadline: 1 March 2026. Deadline: 1 May 2026'), '2026-05-01');
});

test('không có từ khoá hạn nộp thì không đoán', () => {
  assert.equal(parse('Published on 12 October 2026. Course starts 2027.'), null);
  assert.equal(parse('Không có ngày nào'), null);
});

test('bỏ qua ngày không hợp lệ', () => {
  assert.equal(parse('Deadline: 45 January 2027'), null);
});
