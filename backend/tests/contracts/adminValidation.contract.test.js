import test from 'node:test';
import assert from 'node:assert/strict';

import { adminCreateScholarshipSchema, adminUpdateScholarshipSchema } from '~/validations/admin.validation.js';

const BASE = { title: 'A', provider: 'P', country: 'Japan', degree: 'Master' };

test('form admin: số tiền dạng số và hạn dạng YYYY-MM-DD được nhận; ISO vẫn nhận', () => {
  const data = adminCreateScholarshipSchema.parse({ ...BASE, amount: 1500, deadline: '2027-03-01' });
  assert.equal(data.amount, 1500);
  assert.equal(data.deadline, '2027-03-01');
  assert.equal(adminUpdateScholarshipSchema.parse({ amount: '2000.5' }).amount, 2000.5);
  assert.equal(adminUpdateScholarshipSchema.parse({ deadline: '2027-03-01T17:00:00.000Z' }).deadline, '2027-03-01T17:00:00.000Z');
});

test('form admin: ngôn ngữ, hình thức, mô tả, yêu cầu được giữ lại (không bị bỏ lặng lẽ)', () => {
  const extra = { language: 'English', coverage: 'Full', summary: 'Mô tả', requirements: 'IELTS 6.5' };
  const data = adminUpdateScholarshipSchema.parse(extra);
  assert.deepEqual(data, extra);
});

test('xóa số tiền / hạn nộp gửi null; chuỗi rỗng không biến thành 0', () => {
  assert.deepEqual(adminUpdateScholarshipSchema.parse({ amount: null, deadline: null }), { amount: null, deadline: null });
  assert.equal(adminCreateScholarshipSchema.parse({ ...BASE, amount: '' }).amount, undefined);
});

test('giá trị sai bị từ chối', () => {
  for (const bad of [{ amount: -1 }, { amount: 'abc' }, { amount: 1e11 }, { deadline: '01/03/2027' }, { deadline: '2027-02-30' }, { degree: '' }]) {
    assert.equal(adminUpdateScholarshipSchema.safeParse(bad).success, false, JSON.stringify(bad));
  }
});

test('PATCH amount rỗng không được biến thành NULL trong SQL: khóa bị bỏ hẳn', () => {
  const data = adminUpdateScholarshipSchema.parse({ title: 'B', amount: '' });
  assert.deepEqual(Object.keys(data), ['title']);
  assert.equal(adminUpdateScholarshipSchema.safeParse({ amount: '' }).success, false, 'không còn gì để cập nhật');
});

test('amount chỉ nhận số hoặc chuỗi số', () => {
  for (const bad of ['  ', false, true, [], '1e3', '12a']) {
    assert.equal(adminUpdateScholarshipSchema.safeParse({ amount: bad }).success, false, JSON.stringify(bad));
  }
  assert.equal(adminUpdateScholarshipSchema.parse({ amount: ' 1500 ' }).amount, 1500);
});
