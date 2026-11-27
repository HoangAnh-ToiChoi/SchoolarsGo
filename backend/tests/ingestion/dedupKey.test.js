import test from 'node:test';
import assert from 'node:assert/strict';
import { dedupKey, cleanTitle } from '~/ingestion/toRow.js';

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
  assert.equal(cleanTitle('MTCP Scholarship in Malaysia 2026 | Fully Funded | Study in Malaysia'), 'MTCP Scholarship in Malaysia 2026');
  assert.equal(cleanTitle('University of Southampton Scholarships 2027 | UK'), 'University of Southampton Scholarships 2027 | UK');
  assert.equal(cleanTitle('Plain Title Scholarship'), 'Plain Title Scholarship');
});

test('đuôi sau " - " phân biệt học bổng thì giữ lại (MEXT theo trường / theo đại sứ quán)', () => {
  assert.notEqual(
    dedupKey('MEXT Scholarship 2027 - University Recommendation'),
    dedupKey('MEXT Scholarship 2027 - Embassy Recommendation')
  );
});

test('cùng chương trình khác ngành không gộp chung một khoá', () => {
  assert.notEqual(dedupKey('Erasmus Mundus Scholarship 2026 - Data Science'), dedupKey('Erasmus Mundus Scholarship 2027 - Marine Biology'));
});

test('tiêu đề toàn từ chung chung → null, không dồn mọi bài vào khoá rỗng', () => {
  assert.equal(dedupKey('Fully Funded Scholarships 2026 for International Students'), null);
});

test('tiêu đề tiếng Việt bỏ dấu trước khi lọc ký tự', () => {
  assert.equal(dedupKey('Học bổng Chính phủ Hungary 2027'), 'chinh-phu-hungary');
  assert.equal(dedupKey('Học bổng Đài Loan 2027'), 'dai-loan');
});
